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
