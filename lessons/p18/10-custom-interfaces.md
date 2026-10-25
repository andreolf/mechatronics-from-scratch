---
id: p18-l10
minutes: 35
summary: Your robot needs message types that ROS 2 does not ship. You learn the message definition language, constants, arrays and bounded types, write a parser for it, serialize a custom encoder message to CDR bytes with correct alignment exactly as DDS sends it, and check it round-trips.
---

## Interface files

ROS 2 messages, services and actions are defined in small text files in a package of their own, by convention `my_robot_interfaces`:

- `msg/EncoderReading.msg`: one field per line, `type name`, optionally with a default (`float64 gain 1.0`).
- Constants: `uint8 LEFT=0` (upper-case names).
- Arrays: `float32[3]` fixed, `int16[]` unbounded sequence, `int16[<=8]` bounded sequence, `string<=16` bounded string.
- Nested types: `std_msgs/Header header`.
- `srv/X.srv` has a request and a response separated by `---`; `action/X.action` has goal, result and feedback separated by two `---` lines.

At build time, `rosidl` generates C, C++ and Python classes and the serialization code from these files.

## CDR on the wire

DDS sends messages in **CDR** (Common Data Representation). ROS 2 uses a 4-byte encapsulation header (`00 01 00 00` for little-endian CDR) and then the fields in order:

- each primitive is **aligned** to its own size (a `float64` starts at a multiple of 8, counted from the end of the header), with zero padding: a field of size $s$ that would start at offset $o$ is preceded by $(-o) \bmod s$ padding bytes,
- a string is a `uint32` length including the terminating NUL, then the bytes and the NUL,
- a sequence is a `uint32` element count, then the elements; a fixed array has no count,
- nested messages are simply inlined.

Field order therefore changes the size: putting the large, aligned fields first reduces padding.

:::figure widget=msgfields caption="The CDR byte layout of an encoder message. Change the label length, the history length and the field order; padding bytes are shown hatched and the total size updates."
:::end

## Worked example

`EncoderReading` with header (stamp 1700000000 s, 250000000 ns, frame `base_link`), wheel 1, ticks −4096, velocity 12.566 rad/s, a 3-element covariance, label `rear` and a 3-element history:

1. The parser finds constants LEFT 0 and RIGHT 1 and 7 fields, including a fixed `float32[3]` and an unbounded `int16[]`.
2. Offsets: stamp at 0 and 4, `frame_id` at 8 (4-byte length plus 10 bytes), wheel at 22, ticks at 24 after one padding byte, velocity at 32 (aligned to 8, after 4 padding bytes), covariance at 40, 44 and 48, label at 52, the history count at 64 and its elements at 68, 70 and 72.
3. Total 78 bytes: 4 of header and 74 of payload. The first bytes are `00 01 00 00 00 f1 53 65 …`: the header, then 1700000000 in little-endian.
4. Deserializing gives back exactly the original message.

## Code it from scratch

:::code file=msg_cdr.py
```python
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
```
:::end

## In practice

In the interfaces package, `rosidl_generate_interfaces(${PROJECT_NAME} "msg/EncoderReading.msg" DEPENDENCIES std_msgs)` in `CMakeLists.txt` and `<member_of_group>rosidl_interface_packages</member_of_group>` in `package.xml` generate the types; `ros2 interface show my_robot_interfaces/msg/EncoderReading` prints the definition. Reuse standard messages (`sensor_msgs`, `geometry_msgs`) whenever they fit, so existing tools such as RViz understand your data.

## Exercises

:::exercise
Reorder the example fields to minimise padding, ignoring the header.
:::solution
Put the 8-byte field first, then 4-byte, 2-byte and 1-byte fields: velocity, ticks, covariance, then the sequences and strings, then wheel. Variable-length fields still create some padding after them, so put them last.
:::end

:::exercise
What happens if a publisher and a subscriber were built with different versions of `EncoderReading.msg`?
:::solution
The type names are equal, so they may still connect, and the subscriber decodes the bytes with the wrong layout: wrong values or a deserialization error. From Iron on, ROS 2 computes a type hash for each interface (REP 2011) so such mismatches can be detected. Rebuild and deploy both sides from the same definition.
:::end

## Quiz

:::quiz
- type: num
  q: Bytes for a CDR string "base_link" including its length field?
  answer: 14
  tol: 0.001
  py: "4+len('base_link')+1"
  explain: Length, 9 characters, NUL.
- type: num
  q: Padding before a float64 that would start at payload offset 28?
  answer: 4
  tol: 0.001
  py: "(-28)%8"
  explain: The next multiple of 8 is 32.
- type: num
  q: Total serialized size of the example message in bytes?
  answer: 78
  tol: 0.001
  py: "78"
  explain: 4 header plus 74 payload.
- type: num
  q: Bytes for an int16[] sequence of 5 elements starting aligned?
  answer: 14
  tol: 0.001
  py: "4+5*2"
  explain: Count plus elements.
- type: mc
  q: In a .msg file, uint8 LEFT=0 is…
  options:
    - a constant
    - a field with default 0
    - an array
    - a comment
  answer: 0
  explain: Upper-case name with = defines a constant.
- type: mc
  q: The first 4 bytes 00 01 00 00 of a ROS 2 sample mean…
  options:
    - little-endian CDR encapsulation
    - message length 256
    - big-endian CDR encapsulation
    - sequence number 1
  answer: 0
  explain: Encapsulation kind 0x0001.
:::end
