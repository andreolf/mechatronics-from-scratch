---
id: p11-l05
minutes: 40
summary: RS-485 carries a UART over a twisted pair as a voltage difference, which shrugs off ground shifts and noise over a kilometre, and Modbus RTU is the simple master and slave protocol that most industrial pumps, drives and meters speak on it. You derive the differential margins, the frame layout and the 3.5-character silence that ends a frame, write a Modbus master, and test it against a simulated pump controller with a noisy line.
---

## Differential signalling

A UART at 3.3 V logic levels dies after a few metres: the ground at the far end isn't the same as yours, and motor noise couples into the wire. **RS-485** sends each bit as the voltage difference between two wires, A and B, of a twisted pair:

- The driver puts at least ±1.5 V across a 54 Ω load (two 120 Ω terminators in parallel with the receivers).
- The receiver decides on the sign of $V_A - V_B$ with only **±200 mV** threshold.
- Noise couples equally onto both twisted wires, so it cancels in the difference. The receiver tolerates a **common-mode** voltage from −7 V to +12 V, so a few volts of ground shift between cabinets don't matter.
- It's a **multidrop** bus: up to 32 unit loads, one twisted pair, 120 Ω termination at **both** ends to stop reflections, and failsafe biasing so an idle bus reads as a 1.
- **Half duplex**: one pair, so only one node drives at a time. The master's transceiver has a driver-enable pin, which it must release right after the last stop bit.

## Modbus RTU

A master sends a request; exactly one addressed slave answers. An RTU frame is binary:

| field | size |
|---|---|
| slave address (1–247) | 1 byte |
| function code | 1 byte |
| data | 0–252 bytes |
| CRC-16/MODBUS, **low byte first** | 2 bytes |

Common functions: **03** read holding registers, **04** read input registers, **06** write one register, **16** (0x10) write several. Registers are 16-bit, big-endian. An error answer sets the top bit of the function code (03 → 83) and gives an exception code: 01 illegal function, 02 illegal data address, 03 illegal data value.

There's no length byte in a request and no start marker: a frame ends with **silence of at least 3.5 character times**. At 19 200 baud with 8E1 (11 bits per character), one character is 573 µs and the gap is 2.0 ms. Above 19 200 baud the standard fixes the gap at 1.75 ms.

## Timing a transaction

Reading $n$ registers takes an 8-byte request and a $5 + 2n$ byte response. At 11 bits per byte:

$$T = \frac{11\,(8 + 5 + 2n)}{\text{baud}} + 2\,T_{3.5} + T_{\text{slave}}.$$

For 10 registers at 19 200 baud: 18.9 ms on the wire plus 4.0 ms of gaps plus the slave's turnaround. Polling 20 such devices takes about half a second, which is why Modbus is fine for a pump's flow reading and useless for a servo loop.

:::figure widget=modbus caption="A Modbus RTU transaction on an RS-485 bus: the master's request, the 3.5-character silence, the pump controller's response, and a CRC failure that triggers a retry. Change the baud rate and register count to see the cycle time."
:::end

## Worked example

Read the pump's two input registers at address 0x0000 (flow ×0.1 L/min and pressure ×0.01 bar) from slave 0x11.

1. Request: `11 04 00 00 00 02` then CRC. CRC-16/MODBUS of those six bytes is 0x5B73, sent low byte first: `73 5B`.
2. Response: `11 04 04 01 F4 03 E8` + CRC. Byte count 4, then 0x01F4 = 500 → 50.0 L/min, and 0x03E8 = 1000 → 10.00 bar.
3. At 19 200 baud the request is $8 \times 11/19200 = 4.58$ ms, the response $9 \times 11/19200 = 5.16$ ms.

## Code it from scratch

:::code file=modbus.py
```python
import random, struct

def crc16_modbus(data):
    crc = 0xFFFF
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
    return crc

def frame(body):
    return body + struct.pack("<H", crc16_modbus(body))         # CRC low byte first

def char_time(baud, bits=11):
    return bits / baud

def t35(baud):
    return 3.5 * char_time(baud) if baud <= 19200 else 1.75e-3

class PumpController:
    """a simulated Modbus slave: holding regs 0 = speed setpoint (rpm), 1 = mode; input regs 0..2"""
    def __init__(self, addr=0x11):
        self.addr = addr
        self.holding = [0, 0]
        self.turnaround = 1.2e-3                                  # seconds before it answers

    def inputs(self):
        rpm = self.holding[0] if self.holding[1] == 1 else 0
        flow = rpm * 500 // 1450                                  # 0.1 L/min per count
        pressure = rpm * 1000 // 1450                             # 0.01 bar per count
        return [flow, pressure, 412]                              # temperature 41.2 C

    def handle(self, req):
        if len(req) < 4 or crc16_modbus(req[:-2]) != struct.unpack("<H", req[-2:])[0]:
            return None                                           # bad CRC: stay silent
        if req[0] != self.addr:
            return None
        fn = req[1]
        def exc(code):
            return frame(bytes([self.addr, fn | 0x80, code]))
        if fn in (3, 4):
            start, count = struct.unpack(">HH", req[2:6])
            regs = self.holding if fn == 3 else self.inputs()
            if count < 1 or count > 125:
                return exc(3)
            if start + count > len(regs):
                return exc(2)
            data = b"".join(struct.pack(">H", v) for v in regs[start:start + count])
            return frame(bytes([self.addr, fn, len(data)]) + data)
        if fn == 6:
            reg, val = struct.unpack(">HH", req[2:6])
            if reg >= len(self.holding):
                return exc(2)
            if reg == 0 and val > 3000:
                return exc(3)
            self.holding[reg] = val
            return frame(req[:6])                                 # echo
        if fn == 16:
            start, count, nbytes = struct.unpack(">HHB", req[2:7])
            vals = struct.unpack(">" + "H" * count, req[7:7 + nbytes])
            if start + count > len(self.holding):
                return exc(2)
            self.holding[start:start + count] = vals
            return frame(req[:6])
        return exc(1)

class ModbusError(Exception):
    pass

class Bus:
    """RS-485 half-duplex line: bytes take 11 bit times each; noise flips bits with some probability"""
    def __init__(self, slave, baud=19200, ber=0.0, seed=1):
        self.slave, self.baud, self.ber = slave, baud, ber
        self.rng = random.Random(seed)
        self.t = 0.0

    def corrupt(self, data):
        out = bytearray(data)
        for i in range(len(out)):
            for bit in range(8):
                if self.rng.random() < self.ber:
                    out[i] ^= 1 << bit
        return bytes(out)

    def send(self, req, timeout):
        self.t += len(req) * char_time(self.baud) + t35(self.baud)   # request, then the end-of-frame silence
        resp = self.slave.handle(self.corrupt(req))
        if resp is None:
            self.t += timeout
            return None
        self.t += self.slave.turnaround + len(resp) * char_time(self.baud) + t35(self.baud)
        return self.corrupt(resp)

class ModbusMaster:
    def __init__(self, bus, retries=3, timeout=0.1):
        self.bus, self.retries, self.timeout = bus, retries, timeout
        self.retried = 0

    def transact(self, addr, body, expect_len):
        req = frame(bytes([addr]) + body)
        for attempt in range(self.retries + 1):
            resp = self.bus.send(req, self.timeout)
            if resp is None or len(resp) < 5:
                self.retried += attempt < self.retries
                continue
            if crc16_modbus(resp[:-2]) != struct.unpack("<H", resp[-2:])[0] or resp[0] != addr:
                self.retried += attempt < self.retries
                continue
            if resp[1] & 0x80:
                raise ModbusError(f"exception {resp[2]}")
            if expect_len is not None and len(resp) != expect_len:
                self.retried += attempt < self.retries
                continue
            return resp
        raise TimeoutError("no valid response")

    def read_registers(self, addr, start, count, fn=3):
        r = self.transact(addr, struct.pack(">BHH", fn, start, count), 5 + 2 * count)
        return list(struct.unpack(">" + "H" * count, r[3:3 + 2 * count]))

    def write_register(self, addr, reg, value):
        self.transact(addr, struct.pack(">BHH", 6, reg, value), 8)

    def write_registers(self, addr, start, values):
        body = struct.pack(">BHHB", 16, start, len(values), 2 * len(values)) + b"".join(struct.pack(">H", v) for v in values)
        self.transact(addr, body, 8)

def test_worked_example():
    assert crc16_modbus(b"123456789") == 0x4B37
    req = frame(bytes([0x11, 0x04, 0x00, 0x00, 0x00, 0x02]))
    assert req[-2:] == bytes([0x73, 0x5B]), req.hex()
    assert abs(t35(19200) - 2.005e-3) < 1e-5 and t35(115200) == 1.75e-3

def test_read_write():
    pump = PumpController()
    m = ModbusMaster(Bus(pump))
    assert m.read_registers(0x11, 0, 2) == [0, 0]
    m.write_register(0x11, 0, 1450)
    m.write_register(0x11, 1, 1)
    flow, pressure, temp = m.read_registers(0x11, 0, 3, fn=4)
    assert (flow / 10, pressure / 100, temp / 10) == (50.0, 10.0, 41.2)
    m.write_registers(0x11, 0, [725, 1])
    assert m.read_registers(0x11, 0, 2) == [725, 1]
    assert m.read_registers(0x11, 0, 2, fn=4) == [250, 500]
    for bad, code in (((0x11, 5, 1), 2), ((0x11, 0, 200), 3)):
        try:
            m.read_registers(*bad)
            raise AssertionError("expected an exception response")
        except ModbusError as e:
            assert str(e) == f"exception {code}"
    try:
        m.write_register(0x11, 0, 5000)
        raise AssertionError
    except ModbusError as e:
        assert str(e) == "exception 3"
    try:
        m.read_registers(0x12, 0, 1)                         # nobody at 0x12
        raise AssertionError
    except TimeoutError:
        pass
    print("pump: write setpoint, read flow 50.0 L/min, 10.00 bar, 41.2 C; exceptions 02 and 03; timeout for absent slave")

def test_timing():
    pump = PumpController()
    bus = Bus(pump, baud=19200)
    m = ModbusMaster(bus)
    m.read_registers(0x11, 0, 2)
    expect = 11 * (8 + 5 + 2 * 2) / 19200 + 2 * t35(19200) + pump.turnaround
    assert abs(bus.t - expect) < 1e-12
    n10 = 11 * (8 + 5 + 20) / 19200
    print(f"read 2 regs: {bus.t * 1e3:.2f} ms; 10 regs on the wire {n10 * 1e3:.1f} ms")
    assert abs(n10 - 0.0189) < 1e-4

def test_noisy_line():
    pump = PumpController()
    pump.holding = [1450, 1]
    m = ModbusMaster(Bus(pump, ber=2e-4, seed=5), retries=5)
    for _ in range(500):
        assert m.read_registers(0x11, 0, 3, fn=4) == [500, 1000, 412]
    print(f"noisy line (BER 2e-4): 500 reads all correct, {m.retried} retries after CRC failures")
    assert m.retried > 0

test_worked_example()
test_read_write()
test_timing()
test_noisy_line()
print("PASS")
```
:::end

## Exercises

:::exercise
A Modbus network works on the bench but fails intermittently on a 200 m cable to the pump house. Name three things to check.
:::solution
Termination: 120 Ω at both ends of the trunk, and nowhere else. Failsafe bias resistors so the idle line reads as a defined 1. A ground or common reference between the two ends (a third wire), because the common-mode range is only −7 to +12 V; motor ground currents can exceed it. Also stub lengths and the driver-enable timing at the master.
:::end

:::exercise
Why does the master need a response timeout, and how long should it be?
:::solution
A slave stays silent when it sees a bad CRC or a different address, so the master would wait forever. The timeout must cover the slave's worst-case turnaround plus the longest response on the wire: for 125 registers at 19 200 baud that's $255 \times 11/19200 = 146$ ms plus turnaround, so a few hundred milliseconds is typical. Too long a timeout slows the whole poll cycle when a device is offline.
:::end

## Quiz

:::quiz
- type: num
  q: One 8E1 character time at 19 200 baud, in µs?
  answer: 572.9
  tol: 0.001
  unit: µs
  py: "11/19200*1e6"
  explain: Eleven bits.
- type: num
  q: The 3.5-character silence at 9600 baud with 11-bit characters, in ms?
  answer: 4.010
  tol: 0.001
  unit: ms
  py: "3.5*11/9600*1e3"
  explain: Below 19 200 baud it scales with the baud rate.
- type: num
  q: Response length in bytes for reading 10 registers with function 03?
  answer: 25
  tol: 0
  unit: bytes
  py: "5 + 2*10"
  explain: Address, function, byte count, 20 data bytes, 2 CRC bytes.
- type: num
  q: Load in ohms seen by the driver from two 120 Ω terminators?
  answer: 60
  tol: 0
  unit: Ω
  py: "120/2"
  explain: The standard's 54 Ω also allows for the receivers.
- type: mc
  q: A slave answers function 03 with function code 0x83 and data 02. What happened?
  options:
    - illegal data address
    - CRC error
    - the slave is busy
    - success
  answer: 0
  explain: Top bit set means an exception; code 02 is illegal data address.
- type: mc
  q: Why does RS-485 survive ground shifts that break a plain UART?
  options:
    - the receiver looks only at the difference between A and B, within a wide common-mode range
    - it uses higher voltages
    - it's optical
    - it has no ground
  answer: 0
  explain: Common-mode rejection.
:::end

:::verify
import struct
def crc(d):
    c = 0xFFFF
    for b in d:
        c ^= b
        for _ in range(8):
            c = (c >> 1) ^ 0xA001 if c & 1 else c >> 1
    return c
assert crc(bytes([0x11, 4, 0, 0, 0, 2])) == 0x5B73
assert 0x01F4 == 500 and 0x03E8 == 1000
:::end
