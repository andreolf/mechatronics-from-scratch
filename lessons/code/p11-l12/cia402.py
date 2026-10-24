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
