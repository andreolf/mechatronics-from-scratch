var e=`p18-l10`,t=35,n=`Your robot needs message types that ROS 2 does not ship. You learn the message definition language, constants, arrays and bounded types, write a parser for it, serialize a custom encoder message to CDR bytes with correct alignment exactly as DDS sends it, and check it round-trips.`,r=`<h2 id="interface-files">Interface files</h2>
<p>ROS 2 messages, services and actions are defined in small text files in a package of their own, by convention <code>my_robot_interfaces</code>:</p>
<ul>
<li><code>msg/EncoderReading.msg</code>: one field per line, <code>type name</code>, optionally with a default (<code>float64 gain 1.0</code>).</li>
<li>Constants: <code>uint8 LEFT=0</code> (upper-case names).</li>
<li>Arrays: <code>float32[3]</code> fixed, <code>int16[]</code> unbounded sequence, <code>int16[&lt;=8]</code> bounded sequence, <code>string&lt;=16</code> bounded string.</li>
<li>Nested types: <code>std_msgs/Header header</code>.</li>
<li><code>srv/X.srv</code> has a request and a response separated by <code>---</code>; <code>action/X.action</code> has goal, result and feedback separated by two <code>---</code> lines.</li>
</ul>
<p>At build time, <code>rosidl</code> generates C, C++ and Python classes and the serialization code from these files.</p>
<h2 id="cdr-on-the-wire">CDR on the wire</h2>
<p>DDS sends messages in <strong>CDR</strong> (Common Data Representation). ROS 2 uses a 4-byte encapsulation header (<code>00 01 00 00</code> for little-endian CDR) and then the fields in order:</p>
<ul>
<li>each primitive is <strong>aligned</strong> to its own size (a <code>float64</code> starts at a multiple of 8, counted from the end of the header), with zero padding: a field of size <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">s</span></span></span></span> that would start at offset <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">o</span></span></span></span> is preceded by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">−</span><span class="mord mathnormal">o</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord"><span class="mord mathrm">mod</span></span></span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">s</span></span></span></span> padding bytes,</li>
<li>a string is a <code>uint32</code> length including the terminating NUL, then the bytes and the NUL,</li>
<li>a sequence is a <code>uint32</code> element count, then the elements; a fixed array has no count,</li>
<li>nested messages are simply inlined.</li>
</ul>
<p>Field order therefore changes the size: putting the large, aligned fields first reduces padding.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="msgfields" data-args="{}"></div></div><figcaption>The CDR byte layout of an encoder message. Change the label length, the history length and the field order; padding bytes are shown hatched and the total size updates.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p><code>EncoderReading</code> with header (stamp 1700000000 s, 250000000 ns, frame <code>base_link</code>), wheel 1, ticks −4096, velocity 12.566 rad/s, a 3-element covariance, label <code>rear</code> and a 3-element history:</p>
<ol>
<li>The parser finds constants LEFT 0 and RIGHT 1 and 7 fields, including a fixed <code>float32[3]</code> and an unbounded <code>int16[]</code>.</li>
<li>Offsets: stamp at 0 and 4, <code>frame_id</code> at 8 (4-byte length plus 10 bytes), wheel at 22, ticks at 24 after one padding byte, velocity at 32 (aligned to 8, after 4 padding bytes), covariance at 40, 44 and 48, label at 52, the history count at 64 and its elements at 68, 70 and 72.</li>
<li>Total 78 bytes: 4 of header and 74 of payload. The first bytes are <code>00 01 00 00 00 f1 53 65 …</code>: the header, then 1700000000 in little-endian.</li>
<li>Deserializing gives back exactly the original message.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">msg_cdr.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> re, struct

PRIM = {<span class="hljs-string">&quot;bool&quot;</span>: <span class="hljs-string">&quot;?&quot;</span>, <span class="hljs-string">&quot;byte&quot;</span>: <span class="hljs-string">&quot;B&quot;</span>, <span class="hljs-string">&quot;char&quot;</span>: <span class="hljs-string">&quot;B&quot;</span>, <span class="hljs-string">&quot;int8&quot;</span>: <span class="hljs-string">&quot;b&quot;</span>, <span class="hljs-string">&quot;uint8&quot;</span>: <span class="hljs-string">&quot;B&quot;</span>, <span class="hljs-string">&quot;int16&quot;</span>: <span class="hljs-string">&quot;h&quot;</span>, <span class="hljs-string">&quot;uint16&quot;</span>: <span class="hljs-string">&quot;H&quot;</span>,
        <span class="hljs-string">&quot;int32&quot;</span>: <span class="hljs-string">&quot;i&quot;</span>, <span class="hljs-string">&quot;uint32&quot;</span>: <span class="hljs-string">&quot;I&quot;</span>, <span class="hljs-string">&quot;int64&quot;</span>: <span class="hljs-string">&quot;q&quot;</span>, <span class="hljs-string">&quot;uint64&quot;</span>: <span class="hljs-string">&quot;Q&quot;</span>, <span class="hljs-string">&quot;float32&quot;</span>: <span class="hljs-string">&quot;f&quot;</span>, <span class="hljs-string">&quot;float64&quot;</span>: <span class="hljs-string">&quot;d&quot;</span>}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">parse_msg</span>(<span class="hljs-params">text</span>):
    <span class="hljs-string">&quot;&quot;&quot;parse the ROS 2 message definition language: &#x27;type name [default]&#x27; fields and &#x27;type NAME=value&#x27; constants.
    Array forms: T[] (unbounded sequence), T[N] (fixed array), T[&lt;=N] (bounded sequence); string&lt;=N bounded strings.&quot;&quot;&quot;</span>
    fields, consts = [], {}
    <span class="hljs-keyword">for</span> line <span class="hljs-keyword">in</span> text.splitlines():
        line = line.split(<span class="hljs-string">&quot;#&quot;</span>)[<span class="hljs-number">0</span>].strip()
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> line: <span class="hljs-keyword">continue</span>
        m = re.<span class="hljs-keyword">match</span>(<span class="hljs-string">r&quot;^(\\S+)\\s+([A-Z][A-Z0-9_]*)\\s*=\\s*(.+)$&quot;</span>, line)
        <span class="hljs-keyword">if</span> m: consts[m.group(<span class="hljs-number">2</span>)] = <span class="hljs-built_in">int</span>(m.group(<span class="hljs-number">3</span>)) <span class="hljs-keyword">if</span> m.group(<span class="hljs-number">1</span>) <span class="hljs-keyword">in</span> PRIM <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;float&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> m.group(<span class="hljs-number">1</span>) <span class="hljs-keyword">else</span> m.group(<span class="hljs-number">3</span>); <span class="hljs-keyword">continue</span>
        m = re.<span class="hljs-keyword">match</span>(<span class="hljs-string">r&quot;^([\\w/]+?)(&lt;=\\d+)?(\\[(&lt;=)?(\\d*)\\])?\\s+([a-z][a-z0-9_]*)(\\s+.+)?$&quot;</span>, line)
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> m: <span class="hljs-keyword">raise</span> ValueError(<span class="hljs-string">f&quot;cannot parse: <span class="hljs-subst">{line}</span>&quot;</span>)
        base, _, arr, bounded, n, name, default = m.groups()
        kind = <span class="hljs-literal">None</span> <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> arr <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;fixed&quot;</span> <span class="hljs-keyword">if</span> n <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> bounded <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;sequence&quot;</span>
        fields.append({<span class="hljs-string">&quot;type&quot;</span>: base, <span class="hljs-string">&quot;name&quot;</span>: name, <span class="hljs-string">&quot;array&quot;</span>: kind, <span class="hljs-string">&quot;n&quot;</span>: <span class="hljs-built_in">int</span>(n) <span class="hljs-keyword">if</span> n <span class="hljs-keyword">else</span> <span class="hljs-literal">None</span>, <span class="hljs-string">&quot;default&quot;</span>: default <span class="hljs-keyword">and</span> default.strip()})
    <span class="hljs-keyword">return</span> fields, consts

<span class="hljs-keyword">class</span> <span class="hljs-title class_">CDR</span>:
    <span class="hljs-string">&quot;&quot;&quot;little-endian CDR as ROS 2 uses on the wire: a 4-byte encapsulation header, then each primitive aligned to its size
    (relative to the end of the header), strings as uint32 length including the NUL, sequences as uint32 count&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, registry</span>): <span class="hljs-variable language_">self</span>.reg = registry
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_al</span>(<span class="hljs-params">self, buf, n</span>): buf.extend(<span class="hljs-string">b&quot;\\0&quot;</span> * ((-<span class="hljs-built_in">len</span>(buf)) % n))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_prim</span>(<span class="hljs-params">self, buf, t, v, layout, name</span>):
        f = PRIM[t]; size = struct.calcsize(f); <span class="hljs-variable language_">self</span>._al(buf, size); layout.append((name, t, <span class="hljs-built_in">len</span>(buf), size)); buf += struct.pack(<span class="hljs-string">&quot;&lt;&quot;</span> + f, v)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_one</span>(<span class="hljs-params">self, buf, t, v, layout, name</span>):
        <span class="hljs-keyword">if</span> t <span class="hljs-keyword">in</span> PRIM: <span class="hljs-variable language_">self</span>._prim(buf, t, v, layout, name)
        <span class="hljs-keyword">elif</span> t == <span class="hljs-string">&quot;string&quot;</span>:
            b = v.encode() + <span class="hljs-string">b&quot;\\0&quot;</span>; <span class="hljs-variable language_">self</span>._al(buf, <span class="hljs-number">4</span>); layout.append((name, <span class="hljs-string">&quot;string&quot;</span>, <span class="hljs-built_in">len</span>(buf), <span class="hljs-number">4</span> + <span class="hljs-built_in">len</span>(b))); buf += struct.pack(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-built_in">len</span>(b)) + b
        <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>._struct(buf, t, v, layout, name + <span class="hljs-string">&quot;.&quot;</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_struct</span>(<span class="hljs-params">self, buf, t, v, layout, prefix=<span class="hljs-string">&quot;&quot;</span></span>):
        <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> parse_msg(<span class="hljs-variable language_">self</span>.reg[t])[<span class="hljs-number">0</span>]:
            val, nm = v[f[<span class="hljs-string">&quot;name&quot;</span>]], prefix + f[<span class="hljs-string">&quot;name&quot;</span>]
            <span class="hljs-keyword">if</span> f[<span class="hljs-string">&quot;array&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-variable language_">self</span>._one(buf, f[<span class="hljs-string">&quot;type&quot;</span>], val, layout, nm); <span class="hljs-keyword">continue</span>
            <span class="hljs-keyword">if</span> f[<span class="hljs-string">&quot;array&quot;</span>] == <span class="hljs-string">&quot;fixed&quot;</span>: <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(val) == f[<span class="hljs-string">&quot;n&quot;</span>]
            <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>._al(buf, <span class="hljs-number">4</span>); layout.append((nm + <span class="hljs-string">&quot; (count)&quot;</span>, <span class="hljs-string">&quot;uint32&quot;</span>, <span class="hljs-built_in">len</span>(buf), <span class="hljs-number">4</span>)); buf += struct.pack(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-built_in">len</span>(val))
            <span class="hljs-keyword">for</span> i, x <span class="hljs-keyword">in</span> <span class="hljs-built_in">enumerate</span>(val): <span class="hljs-variable language_">self</span>._one(buf, f[<span class="hljs-string">&quot;type&quot;</span>], x, layout, <span class="hljs-string">f&quot;<span class="hljs-subst">{nm}</span>[<span class="hljs-subst">{i}</span>]&quot;</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">serialize</span>(<span class="hljs-params">self, t, v</span>):
        buf, layout = <span class="hljs-built_in">bytearray</span>(), []; <span class="hljs-variable language_">self</span>._struct(buf, t, v, layout)
        <span class="hljs-keyword">return</span> <span class="hljs-string">b&quot;\\x00\\x01\\x00\\x00&quot;</span> + <span class="hljs-built_in">bytes</span>(buf), layout        <span class="hljs-comment"># 0x0001 = CDR little endian</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">deserialize</span>(<span class="hljs-params">self, t, data</span>):
        <span class="hljs-keyword">assert</span> data[:<span class="hljs-number">4</span>] == <span class="hljs-string">b&quot;\\x00\\x01\\x00\\x00&quot;</span>; <span class="hljs-variable language_">self</span>.d, <span class="hljs-variable language_">self</span>.p = data[<span class="hljs-number">4</span>:], <span class="hljs-number">0</span>; <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>._rstruct(t)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_ral</span>(<span class="hljs-params">self, n</span>): <span class="hljs-variable language_">self</span>.p += (-<span class="hljs-variable language_">self</span>.p) % n
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_rone</span>(<span class="hljs-params">self, t</span>):
        <span class="hljs-keyword">if</span> t <span class="hljs-keyword">in</span> PRIM:
            f = PRIM[t]; s = struct.calcsize(f); <span class="hljs-variable language_">self</span>._ral(s); v = struct.unpack_from(<span class="hljs-string">&quot;&lt;&quot;</span> + f, <span class="hljs-variable language_">self</span>.d, <span class="hljs-variable language_">self</span>.p)[<span class="hljs-number">0</span>]; <span class="hljs-variable language_">self</span>.p += s; <span class="hljs-keyword">return</span> v
        <span class="hljs-keyword">if</span> t == <span class="hljs-string">&quot;string&quot;</span>:
            <span class="hljs-variable language_">self</span>._ral(<span class="hljs-number">4</span>); n = struct.unpack_from(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-variable language_">self</span>.d, <span class="hljs-variable language_">self</span>.p)[<span class="hljs-number">0</span>]; <span class="hljs-variable language_">self</span>.p += <span class="hljs-number">4</span>; s = <span class="hljs-variable language_">self</span>.d[<span class="hljs-variable language_">self</span>.p:<span class="hljs-variable language_">self</span>.p + n - <span class="hljs-number">1</span>].decode(); <span class="hljs-variable language_">self</span>.p += n; <span class="hljs-keyword">return</span> s
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>._rstruct(t)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_rstruct</span>(<span class="hljs-params">self, t</span>):
        out = {}
        <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> parse_msg(<span class="hljs-variable language_">self</span>.reg[t])[<span class="hljs-number">0</span>]:
            <span class="hljs-keyword">if</span> f[<span class="hljs-string">&quot;array&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: out[f[<span class="hljs-string">&quot;name&quot;</span>]] = <span class="hljs-variable language_">self</span>._rone(f[<span class="hljs-string">&quot;type&quot;</span>]); <span class="hljs-keyword">continue</span>
            <span class="hljs-keyword">if</span> f[<span class="hljs-string">&quot;array&quot;</span>] == <span class="hljs-string">&quot;fixed&quot;</span>: n = f[<span class="hljs-string">&quot;n&quot;</span>]
            <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>._ral(<span class="hljs-number">4</span>); n = struct.unpack_from(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-variable language_">self</span>.d, <span class="hljs-variable language_">self</span>.p)[<span class="hljs-number">0</span>]; <span class="hljs-variable language_">self</span>.p += <span class="hljs-number">4</span>
            out[f[<span class="hljs-string">&quot;name&quot;</span>]] = [<span class="hljs-variable language_">self</span>._rone(f[<span class="hljs-string">&quot;type&quot;</span>]) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n)]
        <span class="hljs-keyword">return</span> out

REG = {
    <span class="hljs-string">&quot;builtin_interfaces/Time&quot;</span>: <span class="hljs-string">&quot;int32 sec\\nuint32 nanosec&quot;</span>,
    <span class="hljs-string">&quot;std_msgs/Header&quot;</span>: <span class="hljs-string">&quot;builtin_interfaces/Time stamp\\nstring frame_id&quot;</span>,
    <span class="hljs-string">&quot;my_robot_interfaces/EncoderReading&quot;</span>: <span class="hljs-string">&quot;&quot;&quot;# one wheel encoder sample
uint8 LEFT=0
uint8 RIGHT=1
std_msgs/Header header
uint8 wheel
int32 ticks
float64 velocity            # rad/s
float32[3] covariance_diag
string label
int16[] history&quot;&quot;&quot;</span>,
}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_parse</span>():
    f, c = parse_msg(REG[<span class="hljs-string">&quot;my_robot_interfaces/EncoderReading&quot;</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;constants&quot;</span>, c, <span class="hljs-string">&quot;| fields&quot;</span>, [(x[<span class="hljs-string">&quot;name&quot;</span>], x[<span class="hljs-string">&quot;type&quot;</span>] + (<span class="hljs-string">&quot;[]&quot;</span> <span class="hljs-keyword">if</span> x[<span class="hljs-string">&quot;array&quot;</span>] == <span class="hljs-string">&quot;sequence&quot;</span> <span class="hljs-keyword">else</span> <span class="hljs-string">f&quot;[<span class="hljs-subst">{x[<span class="hljs-string">&#x27;n&#x27;</span>]}</span>]&quot;</span> <span class="hljs-keyword">if</span> x[<span class="hljs-string">&quot;array&quot;</span>] <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;&quot;</span>)) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> f])
    <span class="hljs-keyword">assert</span> c == {<span class="hljs-string">&quot;LEFT&quot;</span>: <span class="hljs-number">0</span>, <span class="hljs-string">&quot;RIGHT&quot;</span>: <span class="hljs-number">1</span>} <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(f) == <span class="hljs-number">7</span> <span class="hljs-keyword">and</span> f[<span class="hljs-number">4</span>][<span class="hljs-string">&quot;n&quot;</span>] == <span class="hljs-number">3</span> <span class="hljs-keyword">and</span> f[<span class="hljs-number">6</span>][<span class="hljs-string">&quot;array&quot;</span>] == <span class="hljs-string">&quot;sequence&quot;</span>
    g, _ = parse_msg(<span class="hljs-string">&quot;float64 x 0.0\\nstring&lt;=16 name\\nint8[&lt;=4] bits&quot;</span>)
    <span class="hljs-keyword">assert</span> g[<span class="hljs-number">0</span>][<span class="hljs-string">&quot;default&quot;</span>] == <span class="hljs-string">&quot;0.0&quot;</span> <span class="hljs-keyword">and</span> g[<span class="hljs-number">1</span>][<span class="hljs-string">&quot;type&quot;</span>] == <span class="hljs-string">&quot;string&quot;</span> <span class="hljs-keyword">and</span> g[<span class="hljs-number">2</span>][<span class="hljs-string">&quot;array&quot;</span>] == <span class="hljs-string">&quot;sequence&quot;</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_round_trip</span>():
    msg = {<span class="hljs-string">&quot;header&quot;</span>: {<span class="hljs-string">&quot;stamp&quot;</span>: {<span class="hljs-string">&quot;sec&quot;</span>: <span class="hljs-number">1700000000</span>, <span class="hljs-string">&quot;nanosec&quot;</span>: <span class="hljs-number">250000000</span>}, <span class="hljs-string">&quot;frame_id&quot;</span>: <span class="hljs-string">&quot;base_link&quot;</span>}, <span class="hljs-string">&quot;wheel&quot;</span>: <span class="hljs-number">1</span>,
           <span class="hljs-string">&quot;ticks&quot;</span>: -<span class="hljs-number">4096</span>, <span class="hljs-string">&quot;velocity&quot;</span>: <span class="hljs-number">12.566370614359172</span>, <span class="hljs-string">&quot;covariance_diag&quot;</span>: [<span class="hljs-number">0.25</span>, <span class="hljs-number">0.25</span>, <span class="hljs-number">0.5</span>], <span class="hljs-string">&quot;label&quot;</span>: <span class="hljs-string">&quot;rear&quot;</span>, <span class="hljs-string">&quot;history&quot;</span>: [<span class="hljs-number">1</span>, -<span class="hljs-number">2</span>, <span class="hljs-number">3</span>]}
    cdr = CDR(REG); data, layout = cdr.serialize(<span class="hljs-string">&quot;my_robot_interfaces/EncoderReading&quot;</span>, msg)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;serialized <span class="hljs-subst">{<span class="hljs-built_in">len</span>(data)}</span> bytes (4-byte header + <span class="hljs-subst">{<span class="hljs-built_in">len</span>(data) - <span class="hljs-number">4</span>}</span> payload)&quot;</span>)
    <span class="hljs-keyword">for</span> name, t, off, size <span class="hljs-keyword">in</span> layout: <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  offset <span class="hljs-subst">{off:3d}</span>  <span class="hljs-subst">{size:2d}</span> bytes  <span class="hljs-subst">{t:8s}</span> <span class="hljs-subst">{name}</span>&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;first 24 bytes:&quot;</span>, data[:<span class="hljs-number">24</span>].<span class="hljs-built_in">hex</span>(<span class="hljs-string">&quot; &quot;</span>))
    back = cdr.deserialize(<span class="hljs-string">&quot;my_robot_interfaces/EncoderReading&quot;</span>, data)
    <span class="hljs-keyword">assert</span> back == msg <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(data) == <span class="hljs-number">78</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">dict</span>((n, o) <span class="hljs-keyword">for</span> n, _, o, _ <span class="hljs-keyword">in</span> layout)[<span class="hljs-string">&quot;velocity&quot;</span>] % <span class="hljs-number">8</span> == <span class="hljs-number">0</span>     <span class="hljs-comment"># float64 aligned to 8</span>

test_parse()
test_round_trip()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In the interfaces package, <code>rosidl_generate_interfaces(\${PROJECT_NAME} &quot;msg/EncoderReading.msg&quot; DEPENDENCIES std_msgs)</code> in <code>CMakeLists.txt</code> and <code>&lt;member_of_group&gt;rosidl_interface_packages&lt;/member_of_group&gt;</code> in <code>package.xml</code> generate the types; <code>ros2 interface show my_robot_interfaces/msg/EncoderReading</code> prints the definition. Reuse standard messages (<code>sensor_msgs</code>, <code>geometry_msgs</code>) whenever they fit, so existing tools such as RViz understand your data.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Reorder the example fields to minimise padding, ignoring the header.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Put the 8-byte field first, then 4-byte, 2-byte and 1-byte fields: velocity, ticks, covariance, then the sequences and strings, then wheel. Variable-length fields still create some padding after them, so put them last.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What happens if a publisher and a subscriber were built with different versions of <code>EncoderReading.msg</code>?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The type names are equal, so they may still connect, and the subscriber decodes the bytes with the wrong layout: wrong values or a deserialization error. From Iron on, ROS 2 computes a type hash for each interface (REP 2011) so such mismatches can be detected. Rebuild and deploy both sides from the same definition.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l10"></div>
`,i=[{id:`interface-files`,title:`Interface files`},{id:`cdr-on-the-wire`,title:`CDR on the wire`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l10-q1`,type:`num`,q:`<p>Bytes for a CDR string “base_link” including its length field?</p>
`,explain:`<p>Length, 9 characters, NUL.</p>
`,answer:14,tol:.001,unit:``},{id:`p18-l10-q2`,type:`num`,q:`<p>Padding before a float64 that would start at payload offset 28?</p>
`,explain:`<p>The next multiple of 8 is 32.</p>
`,answer:4,tol:.001,unit:``},{id:`p18-l10-q3`,type:`num`,q:`<p>Total serialized size of the example message in bytes?</p>
`,explain:`<p>4 header plus 74 payload.</p>
`,answer:78,tol:.001,unit:``},{id:`p18-l10-q4`,type:`num`,q:`<p>Bytes for an int16[] sequence of 5 elements starting aligned?</p>
`,explain:`<p>Count plus elements.</p>
`,answer:14,tol:.001,unit:``},{id:`p18-l10-q5`,type:`mc`,q:`<p>In a .msg file, uint8 LEFT=0 is…</p>
`,explain:`<p>Upper-case name with = defines a constant.</p>
`,options:[`a field with default 0`,`a comment`,`a constant`,`an array`],answer:2},{id:`p18-l10-q6`,type:`mc`,q:`<p>The first 4 bytes 00 01 00 00 of a ROS 2 sample mean…</p>
`,explain:`<p>Encapsulation kind 0x0001.</p>
`,options:[`sequence number 1`,`big-endian CDR encapsulation`,`little-endian CDR encapsulation`,`message length 256`],answer:2}],o=[{file:`msg_cdr.py`,lang:`python`,src:`import re, struct

PRIM = {"bool": "?", "byte": "B", "char": "B", "int8": "b", "uint8": "B", "int16": "h", "uint16": "H",
        "int32": "i", "uint32": "I", "int64": "q", "uint64": "Q", "float32": "f", "float64": "d"}

def parse_msg(text):
    """parse the ROS 2 message definition language: 'type name [default]' fields and 'type NAME=value' constants.
    Array forms: T[] (unbounded sequence), T[N] (fixed array), T[<=N] (bounded sequence); string<=N bounded strings."""
    fields, consts = [], {}
    for line in text.splitlines():
        line = line.split("#")[0].strip()
        if not line: continue
        m = re.match(r"^(\\S+)\\s+([A-Z][A-Z0-9_]*)\\s*=\\s*(.+)$", line)
        if m: consts[m.group(2)] = int(m.group(3)) if m.group(1) in PRIM and "float" not in m.group(1) else m.group(3); continue
        m = re.match(r"^([\\w/]+?)(<=\\d+)?(\\[(<=)?(\\d*)\\])?\\s+([a-z][a-z0-9_]*)(\\s+.+)?$", line)
        if not m: raise ValueError(f"cannot parse: {line}")
        base, _, arr, bounded, n, name, default = m.groups()
        kind = None if not arr else "fixed" if n and not bounded else "sequence"
        fields.append({"type": base, "name": name, "array": kind, "n": int(n) if n else None, "default": default and default.strip()})
    return fields, consts

class CDR:
    """little-endian CDR as ROS 2 uses on the wire: a 4-byte encapsulation header, then each primitive aligned to its size
    (relative to the end of the header), strings as uint32 length including the NUL, sequences as uint32 count"""
    def __init__(self, registry): self.reg = registry
    def _al(self, buf, n): buf.extend(b"\\0" * ((-len(buf)) % n))
    def _prim(self, buf, t, v, layout, name):
        f = PRIM[t]; size = struct.calcsize(f); self._al(buf, size); layout.append((name, t, len(buf), size)); buf += struct.pack("<" + f, v)
    def _one(self, buf, t, v, layout, name):
        if t in PRIM: self._prim(buf, t, v, layout, name)
        elif t == "string":
            b = v.encode() + b"\\0"; self._al(buf, 4); layout.append((name, "string", len(buf), 4 + len(b))); buf += struct.pack("<I", len(b)) + b
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
        return b"\\x00\\x01\\x00\\x00" + bytes(buf), layout        # 0x0001 = CDR little endian
    def deserialize(self, t, data):
        assert data[:4] == b"\\x00\\x01\\x00\\x00"; self.d, self.p = data[4:], 0; return self._rstruct(t)
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
    "builtin_interfaces/Time": "int32 sec\\nuint32 nanosec",
    "std_msgs/Header": "builtin_interfaces/Time stamp\\nstring frame_id",
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
    g, _ = parse_msg("float64 x 0.0\\nstring<=16 name\\nint8[<=4] bits")
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
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};