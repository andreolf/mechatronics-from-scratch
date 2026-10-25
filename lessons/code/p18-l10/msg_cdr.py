import re, struct

PRIM = {"bool": "?", "byte": "B", "char": "B", "int8": "b", "uint8": "B", "int16": "h", "uint16": "H",
        "int32": "i", "uint32": "I", "int64": "q", "uint64": "Q", "float32": "f", "float64": "d"}

def parse_msg(text):
    """parse the ROS 2 message definition language: 'type name [default]' fields and 'type NAME=value' constants.
    Array forms: T[] (unbounded sequence), T[N] (fixed array), T[<=N] (bounded sequence); string<=N bounded strings."""
    fields, consts = [], {}
    for line in text.splitlines():
        line = line.split("#")[0].strip()
        if not line: continue
        m = re.match(r"^(\S+)\s+([A-Z][A-Z0-9_]*)\s*=\s*(.+)$", line)
        if m: consts[m.group(2)] = int(m.group(3)) if m.group(1) in PRIM and "float" not in m.group(1) else m.group(3); continue
        m = re.match(r"^([\w/]+?)(<=\d+)?(\[(<=)?(\d*)\])?\s+([a-z][a-z0-9_]*)(\s+.+)?$", line)
        if not m: raise ValueError(f"cannot parse: {line}")
        base, _, arr, bounded, n, name, default = m.groups()
        kind = None if not arr else "fixed" if n and not bounded else "sequence"
        fields.append({"type": base, "name": name, "array": kind, "n": int(n) if n else None, "default": default and default.strip()})
    return fields, consts

class CDR:
    """little-endian CDR as ROS 2 uses on the wire: a 4-byte encapsulation header, then each primitive aligned to its size
    (relative to the end of the header), strings as uint32 length including the NUL, sequences as uint32 count"""
    def __init__(self, registry): self.reg = registry
    def _al(self, buf, n): buf.extend(b"\0" * ((-len(buf)) % n))
    def _prim(self, buf, t, v, layout, name):
        f = PRIM[t]; size = struct.calcsize(f); self._al(buf, size); layout.append((name, t, len(buf), size)); buf += struct.pack("<" + f, v)
    def _one(self, buf, t, v, layout, name):
        if t in PRIM: self._prim(buf, t, v, layout, name)
        elif t == "string":
            b = v.encode() + b"\0"; self._al(buf, 4); layout.append((name, "string", len(buf), 4 + len(b))); buf += struct.pack("<I", len(b)) + b
        else: self._struct(buf, t, v, layout, name + ".")
    def _struct(self, buf, t, v, layout, prefix=""):
        for f in parse_msg(self.reg[t])[0]:
            val, nm = v[f["name"]], prefix + f["name"]
            if f["array"] is None: self._one(buf, f["type"], val, layout, nm); continue
            if f["array"] == "fixed": assert len(val) == f["n"]
            else: self._al(buf, 4); layout.append((nm + " (count)", "uint32", len(buf), 4)); buf += struct.pack("<I", len(val))
            for i, x in enumerate(val): self._one(buf, f["type"], x, layout, f"{nm}[{i}]")
    def serialize(self, t, v):
        buf, layout = bytearray(), []; self._struct(buf, t, v, layout)
        return b"\x00\x01\x00\x00" + bytes(buf), layout        # 0x0001 = CDR little endian
    def deserialize(self, t, data):
        assert data[:4] == b"\x00\x01\x00\x00"; self.d, self.p = data[4:], 0; return self._rstruct(t)
    def _ral(self, n): self.p += (-self.p) % n
    def _rone(self, t):
        if t in PRIM:
            f = PRIM[t]; s = struct.calcsize(f); self._ral(s); v = struct.unpack_from("<" + f, self.d, self.p)[0]; self.p += s; return v
        if t == "string":
            self._ral(4); n = struct.unpack_from("<I", self.d, self.p)[0]; self.p += 4; s = self.d[self.p:self.p + n - 1].decode(); self.p += n; return s
        return self._rstruct(t)
    def _rstruct(self, t):
        out = {}
        for f in parse_msg(self.reg[t])[0]:
            if f["array"] is None: out[f["name"]] = self._rone(f["type"]); continue
            if f["array"] == "fixed": n = f["n"]
            else: self._ral(4); n = struct.unpack_from("<I", self.d, self.p)[0]; self.p += 4
            out[f["name"]] = [self._rone(f["type"]) for _ in range(n)]
        return out

REG = {
    "builtin_interfaces/Time": "int32 sec\nuint32 nanosec",
    "std_msgs/Header": "builtin_interfaces/Time stamp\nstring frame_id",
    "my_robot_interfaces/EncoderReading": """# one wheel encoder sample
uint8 LEFT=0
uint8 RIGHT=1
std_msgs/Header header
uint8 wheel
int32 ticks
float64 velocity            # rad/s
float32[3] covariance_diag
string label
int16[] history""",
}

def test_parse():
    f, c = parse_msg(REG["my_robot_interfaces/EncoderReading"])
    print("constants", c, "| fields", [(x["name"], x["type"] + ("[]" if x["array"] == "sequence" else f"[{x['n']}]" if x["array"] else "")) for x in f])
    assert c == {"LEFT": 0, "RIGHT": 1} and len(f) == 7 and f[4]["n"] == 3 and f[6]["array"] == "sequence"
    g, _ = parse_msg("float64 x 0.0\nstring<=16 name\nint8[<=4] bits")
    assert g[0]["default"] == "0.0" and g[1]["type"] == "string" and g[2]["array"] == "sequence"

def test_round_trip():
    msg = {"header": {"stamp": {"sec": 1700000000, "nanosec": 250000000}, "frame_id": "base_link"}, "wheel": 1,
           "ticks": -4096, "velocity": 12.566370614359172, "covariance_diag": [0.25, 0.25, 0.5], "label": "rear", "history": [1, -2, 3]}
    cdr = CDR(REG); data, layout = cdr.serialize("my_robot_interfaces/EncoderReading", msg)
    print(f"serialized {len(data)} bytes (4-byte header + {len(data) - 4} payload)")
    for name, t, off, size in layout: print(f"  offset {off:3d}  {size:2d} bytes  {t:8s} {name}")
    print("first 24 bytes:", data[:24].hex(" "))
    back = cdr.deserialize("my_robot_interfaces/EncoderReading", data)
    assert back == msg and len(data) == 78
    assert dict((n, o) for n, _, o, _ in layout)["velocity"] % 8 == 0     # float64 aligned to 8

test_parse()
test_round_trip()
print("PASS")
