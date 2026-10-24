---
id: p11-l12
minutes: 40
summary: CANopen puts every device setting in an object dictionary addressed by index and subindex, reads and writes it with confirmed SDO messages or streams it in compact PDOs, and the CiA 402 drive profile defines a state machine that a servo drive must walk through before it will move. You derive the object dictionary, SDO and PDO framing and the drive states, implement the CiA 402 state machine with its controlword and statusword, and test every transition against the profile's table.
---

## The object dictionary

A CANopen device publishes everything it knows as entries in an **object dictionary** (OD), addressed by a 16-bit index and an 8-bit subindex. Ranges are standardised: 0x1000–0x1FFF communication settings, 0x6000–0x9FFF device-profile objects. For a drive (profile CiA 402):

| index | name | type |
|---|---|---|
| 0x6040 | controlword | u16, written by the master |
| 0x6041 | statusword | u16, read by the master |
| 0x6060 | modes of operation (1 = profile position, 3 = profile velocity, 8 = cyclic sync position) | i8 |
| 0x607A | target position | i32 |
| 0x6064 | position actual value | i32 |

## SDO and PDO

- An **SDO** (service data object) is a confirmed read or write of one OD entry. The master sends to COB-ID 0x600 + node, the device answers on 0x580 + node. An expedited write of a u16 is `2B idx_lo idx_hi sub d0 d1 00 00`, and the answer is `60 idx_lo idx_hi sub 00 00 00 00`. Errors come back as an **abort** (`80`) with a 32-bit code: 0x06020000 means the object doesn't exist. Two frames and a protocol header for two bytes of data: fine for configuration, too slow for control.
- A **PDO** (process data object) has no header at all: up to 8 bytes whose meaning is fixed in advance by a *mapping* (for example RPDO1 on 0x200 + node carries controlword + target position, 6 bytes). Sent cyclically or on a SYNC message, PDOs carry the real-time data.

## The CiA 402 state machine

A drive with power on its motor is dangerous, so it won't move until the master walks it through states with the **controlword** (0x6040), and it reports where it is with the **statusword** (0x6041):

| state | statusword (masked) |
|---|---|
| Not ready to switch on | `xxxx xxxx x0xx 0000` |
| Switch on disabled | `x1xx 0000` |
| Ready to switch on | `x01x 0001` |
| Switched on | `x01x 0011` |
| Operation enabled | `x01x 0111` |
| Quick stop active | `x00x 0111` |
| Fault reaction active | `x0xx 1111` |
| Fault | `x0xx 1000` |

| command | controlword bits 7, 3–0 | transitions |
|---|---|---|
| Shutdown | 0 x110 | 2, 6, 8 → Ready to switch on |
| Switch on | 0 0111 | 3 → Switched on; 5 from Operation enabled |
| Enable operation | 0 1111 | 4 → Operation enabled; 16 from Quick stop |
| Disable voltage | 0 xx0x | 7, 9, 10, 12 → Switch on disabled |
| Quick stop | 0 x01x | 7, 10 → Switch on disabled; 11 → Quick stop active |
| Fault reset | rising edge of bit 7 | 15: Fault → Switch on disabled |

The usual start-up is controlword **0x06, 0x07, 0x0F**, checking the statusword after each. A fault from any state goes to Fault reaction active, then Fault; only a 0→1 edge on bit 7 clears it.

:::figure widget=cia402 caption="The CiA 402 drive state machine. Send controlwords and watch the state and statusword change; inject a fault, and clear it with a rising edge on bit 7."
:::end

## Worked example

Enable drive node 5 over SDO.

1. Write 0x06 to 0x6040: frame on 0x605 `2B 40 60 00 06 00 00 00`; the drive answers on 0x585 `60 40 60 00 …`. Statusword reads 0x0231 → masked 0x6F gives 0x21, Ready to switch on.
2. Write 0x07: statusword 0x0233 → 0x23, Switched on.
3. Write 0x0F: statusword 0x0237 → 0x27, Operation enabled. Bit 9 (remote) was set throughout; bits 4 and 5 (voltage enabled, quick stop not active) show up from step 1.

## Code it from scratch

:::code file=cia402.py
```python
import struct

NRTSO, SOD, RTSO, SO, OE, QSA, FRA, FAULT = ("Not ready to switch on", "Switch on disabled", "Ready to switch on",
    "Switched on", "Operation enabled", "Quick stop active", "Fault reaction active", "Fault")

STATUS = {NRTSO: 0x0000, SOD: 0x0040, RTSO: 0x0021, SO: 0x0023, OE: 0x0027, QSA: 0x0007, FRA: 0x000F, FAULT: 0x0008}
VOLTAGE, REMOTE = 1 << 4, 1 << 9

def decode_status(sw):
    """state from a statusword, using the profile's masks"""
    if sw & 0x4F == 0x00: return NRTSO
    if sw & 0x4F == 0x40: return SOD
    if sw & 0x6F == 0x21: return RTSO
    if sw & 0x6F == 0x23: return SO
    if sw & 0x6F == 0x27: return OE
    if sw & 0x6F == 0x07: return QSA
    if sw & 0x4F == 0x0F: return FRA
    if sw & 0x4F == 0x08: return FAULT
    raise ValueError(hex(sw))

def command(cw):
    if cw & 0x8F == 0x0F: return "enable_operation"
    if cw & 0x8F == 0x07: return "switch_on"
    if cw & 0x87 == 0x06: return "shutdown"
    if cw & 0x86 == 0x02: return "quick_stop"
    if cw & 0x82 == 0x00: return "disable_voltage"
    return None

class Drive:
    def __init__(self, node=5):
        self.node = node
        self.state = NRTSO
        self.cw = 0
        self.od = {(0x6040, 0): 0, (0x6060, 0): 0, (0x607A, 0): 0, (0x6064, 0): 0}
        self.state = SOD                                   # transition 1: automatic after initialisation

    @property
    def statusword(self):
        sw = STATUS[self.state] | REMOTE
        if self.state in (RTSO, SO, OE, QSA):
            sw |= VOLTAGE
        if self.state in (RTSO, SO, OE):
            sw |= 1 << 5                                   # quick stop NOT active (bit 5 is active-low)
        return sw

    def fault(self):
        self.state = FRA                                   # transition 13
        self.state = FAULT                                 # transition 14 once the reaction is done

    def write_controlword(self, cw):
        prev, self.cw = self.cw, cw
        self.od[(0x6040, 0)] = cw
        s, c = self.state, command(cw)
        if s == FAULT:
            if not prev & 0x80 and cw & 0x80:
                self.state = SOD                           # 15: fault reset on the rising edge only
            return
        if s == FRA or cw & 0x80:
            return
        nxt = {
            (SOD, "shutdown"): RTSO,                                                   # 2
            (RTSO, "switch_on"): SO, (RTSO, "enable_operation"): OE,                   # 3, 3+4
            (RTSO, "disable_voltage"): SOD, (RTSO, "quick_stop"): SOD,                 # 7
            (SO, "enable_operation"): OE, (SO, "shutdown"): RTSO,                      # 4, 6
            (SO, "disable_voltage"): SOD, (SO, "quick_stop"): SOD,                     # 10
            (OE, "switch_on"): SO, (OE, "shutdown"): RTSO,                             # 5, 8
            (OE, "disable_voltage"): SOD, (OE, "quick_stop"): QSA,                     # 9, 11
            (QSA, "disable_voltage"): SOD, (QSA, "enable_operation"): OE,              # 12, 16
        }.get((s, c))
        if nxt:
            self.state = nxt

    # ---------- SDO server ----------
    def sdo(self, frame):
        cmd, idx, sub = frame[0], struct.unpack("<H", frame[1:3])[0], frame[3]
        key = (idx, sub)
        if idx == 0x6041 and sub == 0:
            if cmd == 0x40:
                return bytes([0x4B]) + frame[1:4] + struct.pack("<H", self.statusword) + b"\0\0"
            return bytes([0x80]) + frame[1:4] + struct.pack("<I", 0x06010002)   # read-only object
        if key not in self.od:
            return bytes([0x80]) + frame[1:4] + struct.pack("<I", 0x06020000)   # object does not exist
        if cmd == 0x40:
            return bytes([0x43]) + frame[1:4] + struct.pack("<i", self.od[key])
        if cmd in (0x2F, 0x2B, 0x23):
            size = {0x2F: 1, 0x2B: 2, 0x23: 4}[cmd]
            val = int.from_bytes(frame[4:4 + size], "little", signed=(idx != 0x6040))
            if idx == 0x6040:
                self.write_controlword(val)
            else:
                self.od[key] = val
            return bytes([0x60]) + frame[1:4] + b"\0\0\0\0"
        return bytes([0x80]) + frame[1:4] + struct.pack("<I", 0x05040001)

class Master:
    def __init__(self, drive):
        self.d = drive
        self.log = []

    def sdo_write_u16(self, idx, sub, val):
        req = struct.pack("<BHBH2x", 0x2B, idx, sub, val)
        resp = self.d.sdo(req)
        self.log.append((0x600 + self.d.node, req, 0x580 + self.d.node, resp))
        if resp[0] == 0x80:
            raise RuntimeError(f"SDO abort {struct.unpack('<I', resp[4:8])[0]:#010x}")

    def sdo_read_u16(self, idx, sub):
        resp = self.d.sdo(struct.pack("<BHB4x", 0x40, idx, sub))
        if resp[0] == 0x80:
            raise RuntimeError(f"SDO abort {struct.unpack('<I', resp[4:8])[0]:#010x}")
        return struct.unpack("<H", resp[4:6])[0]

    def enable(self):
        seen = []
        for cw, want in ((0x06, RTSO), (0x07, SO), (0x0F, OE)):
            self.sdo_write_u16(0x6040, 0, cw)
            sw = self.sdo_read_u16(0x6041, 0)
            seen.append(sw)
            if decode_status(sw) != want:
                raise RuntimeError(f"expected {want}, statusword {sw:#06x}")
        return seen

# ---------- the profile's transition table, written out independently ----------
CANON = {"shutdown": 0x06, "switch_on": 0x07, "enable_operation": 0x0F, "disable_voltage": 0x00, "quick_stop": 0x02}
SPEC = {
    SOD: {"shutdown": RTSO},
    RTSO: {"switch_on": SO, "enable_operation": OE, "disable_voltage": SOD, "quick_stop": SOD},
    SO: {"enable_operation": OE, "shutdown": RTSO, "disable_voltage": SOD, "quick_stop": SOD},
    OE: {"switch_on": SO, "shutdown": RTSO, "disable_voltage": SOD, "quick_stop": QSA},
    QSA: {"disable_voltage": SOD, "enable_operation": OE},
}
PATH = {SOD: [], RTSO: [0x06], SO: [0x06, 0x07], OE: [0x06, 0x07, 0x0F], QSA: [0x06, 0x07, 0x0F, 0x02]}

def test_enable_sequence():
    m = Master(Drive(node=5))
    seen = m.enable()
    assert seen == [0x0231, 0x0233, 0x0237], [hex(s) for s in seen]
    cob, req, rcob, resp = m.log[0]
    assert (cob, req.hex(" "), rcob, resp[0]) == (0x605, "2b 40 60 00 06 00 00 00", 0x585, 0x60)
    print("enable: statuswords", ", ".join(f"{s:#06x}" for s in seen), "-> Operation enabled")

def test_every_transition():
    checked = 0
    for start, path in PATH.items():
        for name, cw in CANON.items():
            d = Drive()
            for c in path:
                d.write_controlword(c)
            assert d.state == start
            d.write_controlword(cw)
            want = SPEC[start].get(name, start)
            assert d.state == want, (start, name, d.state, want)
            assert decode_status(d.statusword) == d.state
            checked += 1
    print(f"{checked} (state, command) pairs match the CiA 402 table")

def test_fault_and_reset():
    for start, path in PATH.items():
        d = Drive()
        for c in path:
            d.write_controlword(c)
        d.fault()
        assert d.state == FAULT and decode_status(d.statusword) == FAULT
        d.write_controlword(0x0F)
        assert d.state == FAULT                            # no command except fault reset leaves Fault
        d.write_controlword(0x80)
        assert d.state == SOD                              # rising edge of bit 7
    d = Drive(); d.write_controlword(0x80); d.fault()
    d.write_controlword(0x80)
    assert d.state == FAULT                                # bit 7 already high: no edge, no reset
    d.write_controlword(0x00); d.write_controlword(0x80)
    assert d.state == SOD
    print("fault from every state; reset only on a 0->1 edge of bit 7")

def test_sdo_errors():
    m = Master(Drive())
    for bad, code in (((0x6099, 0, 1), "0x06020000"), ((0x6041, 0, 1), "0x06010002")):
        try:
            m.sdo_write_u16(*bad)
            raise AssertionError
        except RuntimeError as e:
            assert code in str(e)
    print("SDO aborts: object does not exist, read-only object")

test_enable_sequence()
test_every_transition()
test_fault_and_reset()
test_sdo_errors()
print("PASS")
```
:::end

## Exercises

:::exercise
Your master writes 0x0F straight after power-up and the drive never enables. Why?
:::solution
After power-up the drive is in Switch on disabled, where only Shutdown (0x06) is accepted. 0x0F means Enable operation, which isn't a valid command from that state, so the drive ignores it. Walk the states: 0x06, check for Ready to switch on, then 0x07 and 0x0F (or 0x0F directly from Ready to switch on, which the profile allows).
:::end

:::exercise
Why use a PDO, not an SDO, for target positions in a 1 kHz cyclic position loop?
:::solution
An SDO is a request and a confirmation, two frames with a 4-byte header, for one value, and the master has to wait for the answer. At 1 kHz across several drives that saturates the bus. A PDO is one frame per cycle, no handshake, with controlword and target position packed in its 8 bytes, triggered by a SYNC message so all drives latch together.
:::end

## Quiz

:::quiz
- type: num
  q: COB-ID in decimal of the SDO request to node 5?
  answer: 1541
  tol: 0
  py: "0x600 + 5"
  explain: 0x605.
- type: num
  q: Statusword masked with 0x6F in Operation enabled, in decimal?
  answer: 39
  tol: 0
  py: "0x27"
  explain: x01x 0111.
- type: num
  q: Data bytes carried per SDO expedited frame for a u32 object?
  answer: 4
  tol: 0
  unit: bytes
  py: "8 - 4"
  explain: Four bytes of command, index and subindex.
- type: num
  q: Controlword in decimal for Enable operation?
  answer: 15
  tol: 0
  py: "0x0F"
  explain: Bits 0–3 set.
- type: mc
  q: Which command takes Operation enabled to Quick stop active?
  options:
    - quick stop (bit 2 cleared, bit 1 set)
    - shutdown
    - fault reset
    - switch on
  answer: 0
  explain: Transition 11.
- type: mc
  q: How do you leave the Fault state?
  options:
    - a rising edge on controlword bit 7, which goes to Switch on disabled
    - write 0x0F
    - power cycle only
    - write 0x06
  answer: 0
  explain: Transition 15.
:::end
