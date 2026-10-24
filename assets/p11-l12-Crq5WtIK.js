var e=`p11-l12`,t=40,n=`CANopen puts every device setting in an object dictionary addressed by index and subindex, reads and writes it with confirmed SDO messages or streams it in compact PDOs, and the CiA 402 drive profile defines a state machine that a servo drive must walk through before it will move. You derive the object dictionary, SDO and PDO framing and the drive states, implement the CiA 402 state machine with its controlword and statusword, and test every transition against the profile’s table.`,r=`<h2 id="the-object-dictionary">The object dictionary</h2>
<p>A CANopen device publishes everything it knows as entries in an <strong>object dictionary</strong> (OD), addressed by a 16-bit index and an 8-bit subindex. Ranges are standardised: 0x1000–0x1FFF communication settings, 0x6000–0x9FFF device-profile objects. For a drive (profile CiA 402):</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>index</th>
<th>name</th>
<th>type</th>
</tr>
</thead>
<tbody><tr>
<td>0x6040</td>
<td>controlword</td>
<td>u16, written by the master</td>
</tr>
<tr>
<td>0x6041</td>
<td>statusword</td>
<td>u16, read by the master</td>
</tr>
<tr>
<td>0x6060</td>
<td>modes of operation (1 = profile position, 3 = profile velocity, 8 = cyclic sync position)</td>
<td>i8</td>
</tr>
<tr>
<td>0x607A</td>
<td>target position</td>
<td>i32</td>
</tr>
<tr>
<td>0x6064</td>
<td>position actual value</td>
<td>i32</td>
</tr>
</tbody></table></div>
<h2 id="sdo-and-pdo">SDO and PDO</h2>
<ul>
<li>An <strong>SDO</strong> (service data object) is a confirmed read or write of one OD entry. The master sends to COB-ID 0x600 + node, the device answers on 0x580 + node. An expedited write of a u16 is <code>2B idx_lo idx_hi sub d0 d1 00 00</code>, and the answer is <code>60 idx_lo idx_hi sub 00 00 00 00</code>. Errors come back as an <strong>abort</strong> (<code>80</code>) with a 32-bit code: 0x06020000 means the object doesn’t exist. Two frames and a protocol header for two bytes of data: fine for configuration, too slow for control.</li>
<li>A <strong>PDO</strong> (process data object) has no header at all: up to 8 bytes whose meaning is fixed in advance by a <em>mapping</em> (for example RPDO1 on 0x200 + node carries controlword + target position, 6 bytes). Sent cyclically or on a SYNC message, PDOs carry the real-time data.</li>
</ul>
<h2 id="the-cia-402-state-machine">The CiA 402 state machine</h2>
<p>A drive with power on its motor is dangerous, so it won’t move until the master walks it through states with the <strong>controlword</strong> (0x6040), and it reports where it is with the <strong>statusword</strong> (0x6041):</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>state</th>
<th>statusword (masked)</th>
</tr>
</thead>
<tbody><tr>
<td>Not ready to switch on</td>
<td><code>xxxx xxxx x0xx 0000</code></td>
</tr>
<tr>
<td>Switch on disabled</td>
<td><code>x1xx 0000</code></td>
</tr>
<tr>
<td>Ready to switch on</td>
<td><code>x01x 0001</code></td>
</tr>
<tr>
<td>Switched on</td>
<td><code>x01x 0011</code></td>
</tr>
<tr>
<td>Operation enabled</td>
<td><code>x01x 0111</code></td>
</tr>
<tr>
<td>Quick stop active</td>
<td><code>x00x 0111</code></td>
</tr>
<tr>
<td>Fault reaction active</td>
<td><code>x0xx 1111</code></td>
</tr>
<tr>
<td>Fault</td>
<td><code>x0xx 1000</code></td>
</tr>
</tbody></table></div>
<div class="table-scroll"><table>
<thead>
<tr>
<th>command</th>
<th>controlword bits 7, 3–0</th>
<th>transitions</th>
</tr>
</thead>
<tbody><tr>
<td>Shutdown</td>
<td>0 x110</td>
<td>2, 6, 8 → Ready to switch on</td>
</tr>
<tr>
<td>Switch on</td>
<td>0 0111</td>
<td>3 → Switched on; 5 from Operation enabled</td>
</tr>
<tr>
<td>Enable operation</td>
<td>0 1111</td>
<td>4 → Operation enabled; 16 from Quick stop</td>
</tr>
<tr>
<td>Disable voltage</td>
<td>0 xx0x</td>
<td>7, 9, 10, 12 → Switch on disabled</td>
</tr>
<tr>
<td>Quick stop</td>
<td>0 x01x</td>
<td>7, 10 → Switch on disabled; 11 → Quick stop active</td>
</tr>
<tr>
<td>Fault reset</td>
<td>rising edge of bit 7</td>
<td>15: Fault → Switch on disabled</td>
</tr>
</tbody></table></div>
<p>A master decodes the state by masking, for example</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord text"><span class="mord">statusword</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord">&amp;</span></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord text"><span class="mord">6F</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">16</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7944em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord text"><span class="mord">21</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">16</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">⟺</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">Ready\xA0to\xA0switch\xA0on</span></span><span class="mord">.</span></span></span></span></span></div>
<p>The usual start-up is controlword <strong>0x06, 0x07, 0x0F</strong>, checking the statusword after each. A fault from any state goes to Fault reaction active, then Fault; only a 0→1 edge on bit 7 clears it.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="cia402" data-args="{}"></div></div><figcaption>The CiA 402 drive state machine. Send controlwords and watch the state and statusword change; inject a fault, and clear it with a rising edge on bit 7.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Enable drive node 5 over SDO.</p>
<ol>
<li>Write 0x06 to 0x6040: frame on 0x605 <code>2B 40 60 00 06 00 00 00</code>; the drive answers on 0x585 <code>60 40 60 00 …</code>. Statusword reads 0x0231 → masked 0x6F gives 0x21, Ready to switch on.</li>
<li>Write 0x07: statusword 0x0233 → 0x23, Switched on.</li>
<li>Write 0x0F: statusword 0x0237 → 0x27, Operation enabled. Bit 9 (remote) was set throughout; bits 4 and 5 (voltage enabled, quick stop not active) show up from step 1.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">cia402.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> struct

NRTSO, SOD, RTSO, SO, OE, QSA, FRA, FAULT = (<span class="hljs-string">&quot;Not ready to switch on&quot;</span>, <span class="hljs-string">&quot;Switch on disabled&quot;</span>, <span class="hljs-string">&quot;Ready to switch on&quot;</span>,
    <span class="hljs-string">&quot;Switched on&quot;</span>, <span class="hljs-string">&quot;Operation enabled&quot;</span>, <span class="hljs-string">&quot;Quick stop active&quot;</span>, <span class="hljs-string">&quot;Fault reaction active&quot;</span>, <span class="hljs-string">&quot;Fault&quot;</span>)

STATUS = {NRTSO: <span class="hljs-number">0x0000</span>, SOD: <span class="hljs-number">0x0040</span>, RTSO: <span class="hljs-number">0x0021</span>, SO: <span class="hljs-number">0x0023</span>, OE: <span class="hljs-number">0x0027</span>, QSA: <span class="hljs-number">0x0007</span>, FRA: <span class="hljs-number">0x000F</span>, FAULT: <span class="hljs-number">0x0008</span>}
VOLTAGE, REMOTE = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">4</span>, <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">decode_status</span>(<span class="hljs-params">sw</span>):
    <span class="hljs-string">&quot;&quot;&quot;state from a statusword, using the profile&#x27;s masks&quot;&quot;&quot;</span>
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x4F</span> == <span class="hljs-number">0x00</span>: <span class="hljs-keyword">return</span> NRTSO
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x4F</span> == <span class="hljs-number">0x40</span>: <span class="hljs-keyword">return</span> SOD
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x6F</span> == <span class="hljs-number">0x21</span>: <span class="hljs-keyword">return</span> RTSO
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x6F</span> == <span class="hljs-number">0x23</span>: <span class="hljs-keyword">return</span> SO
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x6F</span> == <span class="hljs-number">0x27</span>: <span class="hljs-keyword">return</span> OE
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x6F</span> == <span class="hljs-number">0x07</span>: <span class="hljs-keyword">return</span> QSA
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x4F</span> == <span class="hljs-number">0x0F</span>: <span class="hljs-keyword">return</span> FRA
    <span class="hljs-keyword">if</span> sw &amp; <span class="hljs-number">0x4F</span> == <span class="hljs-number">0x08</span>: <span class="hljs-keyword">return</span> FAULT
    <span class="hljs-keyword">raise</span> ValueError(<span class="hljs-built_in">hex</span>(sw))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">command</span>(<span class="hljs-params">cw</span>):
    <span class="hljs-keyword">if</span> cw &amp; <span class="hljs-number">0x8F</span> == <span class="hljs-number">0x0F</span>: <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;enable_operation&quot;</span>
    <span class="hljs-keyword">if</span> cw &amp; <span class="hljs-number">0x8F</span> == <span class="hljs-number">0x07</span>: <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;switch_on&quot;</span>
    <span class="hljs-keyword">if</span> cw &amp; <span class="hljs-number">0x87</span> == <span class="hljs-number">0x06</span>: <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;shutdown&quot;</span>
    <span class="hljs-keyword">if</span> cw &amp; <span class="hljs-number">0x86</span> == <span class="hljs-number">0x02</span>: <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;quick_stop&quot;</span>
    <span class="hljs-keyword">if</span> cw &amp; <span class="hljs-number">0x82</span> == <span class="hljs-number">0x00</span>: <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;disable_voltage&quot;</span>
    <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Drive</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, node=<span class="hljs-number">5</span></span>):
        <span class="hljs-variable language_">self</span>.node = node
        <span class="hljs-variable language_">self</span>.state = NRTSO
        <span class="hljs-variable language_">self</span>.cw = <span class="hljs-number">0</span>
        <span class="hljs-variable language_">self</span>.od = {(<span class="hljs-number">0x6040</span>, <span class="hljs-number">0</span>): <span class="hljs-number">0</span>, (<span class="hljs-number">0x6060</span>, <span class="hljs-number">0</span>): <span class="hljs-number">0</span>, (<span class="hljs-number">0x607A</span>, <span class="hljs-number">0</span>): <span class="hljs-number">0</span>, (<span class="hljs-number">0x6064</span>, <span class="hljs-number">0</span>): <span class="hljs-number">0</span>}
        <span class="hljs-variable language_">self</span>.state = SOD                                   <span class="hljs-comment"># transition 1: automatic after initialisation</span>

<span class="hljs-meta">    @property</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">statusword</span>(<span class="hljs-params">self</span>):
        sw = STATUS[<span class="hljs-variable language_">self</span>.state] | REMOTE
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.state <span class="hljs-keyword">in</span> (RTSO, SO, OE, QSA):
            sw |= VOLTAGE
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.state <span class="hljs-keyword">in</span> (RTSO, SO, OE):
            sw |= <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">5</span>                                   <span class="hljs-comment"># quick stop NOT active (bit 5 is active-low)</span>
        <span class="hljs-keyword">return</span> sw

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">fault</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.state = FRA                                   <span class="hljs-comment"># transition 13</span>
        <span class="hljs-variable language_">self</span>.state = FAULT                                 <span class="hljs-comment"># transition 14 once the reaction is done</span>

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">write_controlword</span>(<span class="hljs-params">self, cw</span>):
        prev, <span class="hljs-variable language_">self</span>.cw = <span class="hljs-variable language_">self</span>.cw, cw
        <span class="hljs-variable language_">self</span>.od[(<span class="hljs-number">0x6040</span>, <span class="hljs-number">0</span>)] = cw
        s, c = <span class="hljs-variable language_">self</span>.state, command(cw)
        <span class="hljs-keyword">if</span> s == FAULT:
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> prev &amp; <span class="hljs-number">0x80</span> <span class="hljs-keyword">and</span> cw &amp; <span class="hljs-number">0x80</span>:
                <span class="hljs-variable language_">self</span>.state = SOD                           <span class="hljs-comment"># 15: fault reset on the rising edge only</span>
            <span class="hljs-keyword">return</span>
        <span class="hljs-keyword">if</span> s == FRA <span class="hljs-keyword">or</span> cw &amp; <span class="hljs-number">0x80</span>:
            <span class="hljs-keyword">return</span>
        nxt = {
            (SOD, <span class="hljs-string">&quot;shutdown&quot;</span>): RTSO,                                                   <span class="hljs-comment"># 2</span>
            (RTSO, <span class="hljs-string">&quot;switch_on&quot;</span>): SO, (RTSO, <span class="hljs-string">&quot;enable_operation&quot;</span>): OE,                   <span class="hljs-comment"># 3, 3+4</span>
            (RTSO, <span class="hljs-string">&quot;disable_voltage&quot;</span>): SOD, (RTSO, <span class="hljs-string">&quot;quick_stop&quot;</span>): SOD,                 <span class="hljs-comment"># 7</span>
            (SO, <span class="hljs-string">&quot;enable_operation&quot;</span>): OE, (SO, <span class="hljs-string">&quot;shutdown&quot;</span>): RTSO,                      <span class="hljs-comment"># 4, 6</span>
            (SO, <span class="hljs-string">&quot;disable_voltage&quot;</span>): SOD, (SO, <span class="hljs-string">&quot;quick_stop&quot;</span>): SOD,                     <span class="hljs-comment"># 10</span>
            (OE, <span class="hljs-string">&quot;switch_on&quot;</span>): SO, (OE, <span class="hljs-string">&quot;shutdown&quot;</span>): RTSO,                             <span class="hljs-comment"># 5, 8</span>
            (OE, <span class="hljs-string">&quot;disable_voltage&quot;</span>): SOD, (OE, <span class="hljs-string">&quot;quick_stop&quot;</span>): QSA,                     <span class="hljs-comment"># 9, 11</span>
            (QSA, <span class="hljs-string">&quot;disable_voltage&quot;</span>): SOD, (QSA, <span class="hljs-string">&quot;enable_operation&quot;</span>): OE,              <span class="hljs-comment"># 12, 16</span>
        }.get((s, c))
        <span class="hljs-keyword">if</span> nxt:
            <span class="hljs-variable language_">self</span>.state = nxt

    <span class="hljs-comment"># ---------- SDO server ----------</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">sdo</span>(<span class="hljs-params">self, frame</span>):
        cmd, idx, sub = frame[<span class="hljs-number">0</span>], struct.unpack(<span class="hljs-string">&quot;&lt;H&quot;</span>, frame[<span class="hljs-number">1</span>:<span class="hljs-number">3</span>])[<span class="hljs-number">0</span>], frame[<span class="hljs-number">3</span>]
        key = (idx, sub)
        <span class="hljs-keyword">if</span> idx == <span class="hljs-number">0x6041</span> <span class="hljs-keyword">and</span> sub == <span class="hljs-number">0</span>:
            <span class="hljs-keyword">if</span> cmd == <span class="hljs-number">0x40</span>:
                <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x4B</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + struct.pack(<span class="hljs-string">&quot;&lt;H&quot;</span>, <span class="hljs-variable language_">self</span>.statusword) + <span class="hljs-string">b&quot;\\0\\0&quot;</span>
            <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x80</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + struct.pack(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-number">0x06010002</span>)   <span class="hljs-comment"># read-only object</span>
        <span class="hljs-keyword">if</span> key <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.od:
            <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x80</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + struct.pack(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-number">0x06020000</span>)   <span class="hljs-comment"># object does not exist</span>
        <span class="hljs-keyword">if</span> cmd == <span class="hljs-number">0x40</span>:
            <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x43</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + struct.pack(<span class="hljs-string">&quot;&lt;i&quot;</span>, <span class="hljs-variable language_">self</span>.od[key])
        <span class="hljs-keyword">if</span> cmd <span class="hljs-keyword">in</span> (<span class="hljs-number">0x2F</span>, <span class="hljs-number">0x2B</span>, <span class="hljs-number">0x23</span>):
            size = {<span class="hljs-number">0x2F</span>: <span class="hljs-number">1</span>, <span class="hljs-number">0x2B</span>: <span class="hljs-number">2</span>, <span class="hljs-number">0x23</span>: <span class="hljs-number">4</span>}[cmd]
            val = <span class="hljs-built_in">int</span>.from_bytes(frame[<span class="hljs-number">4</span>:<span class="hljs-number">4</span> + size], <span class="hljs-string">&quot;little&quot;</span>, signed=(idx != <span class="hljs-number">0x6040</span>))
            <span class="hljs-keyword">if</span> idx == <span class="hljs-number">0x6040</span>:
                <span class="hljs-variable language_">self</span>.write_controlword(val)
            <span class="hljs-keyword">else</span>:
                <span class="hljs-variable language_">self</span>.od[key] = val
            <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x60</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + <span class="hljs-string">b&quot;\\0\\0\\0\\0&quot;</span>
        <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x80</span>]) + frame[<span class="hljs-number">1</span>:<span class="hljs-number">4</span>] + struct.pack(<span class="hljs-string">&quot;&lt;I&quot;</span>, <span class="hljs-number">0x05040001</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Master</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, drive</span>):
        <span class="hljs-variable language_">self</span>.d = drive
        <span class="hljs-variable language_">self</span>.log = []

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">sdo_write_u16</span>(<span class="hljs-params">self, idx, sub, val</span>):
        req = struct.pack(<span class="hljs-string">&quot;&lt;BHBH2x&quot;</span>, <span class="hljs-number">0x2B</span>, idx, sub, val)
        resp = <span class="hljs-variable language_">self</span>.d.sdo(req)
        <span class="hljs-variable language_">self</span>.log.append((<span class="hljs-number">0x600</span> + <span class="hljs-variable language_">self</span>.d.node, req, <span class="hljs-number">0x580</span> + <span class="hljs-variable language_">self</span>.d.node, resp))
        <span class="hljs-keyword">if</span> resp[<span class="hljs-number">0</span>] == <span class="hljs-number">0x80</span>:
            <span class="hljs-keyword">raise</span> RuntimeError(<span class="hljs-string">f&quot;SDO abort <span class="hljs-subst">{struct.unpack(<span class="hljs-string">&#x27;&lt;I&#x27;</span>, resp[<span class="hljs-number">4</span>:<span class="hljs-number">8</span>])[<span class="hljs-number">0</span>]:#<span class="hljs-number">0</span>10x}</span>&quot;</span>)

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">sdo_read_u16</span>(<span class="hljs-params">self, idx, sub</span>):
        resp = <span class="hljs-variable language_">self</span>.d.sdo(struct.pack(<span class="hljs-string">&quot;&lt;BHB4x&quot;</span>, <span class="hljs-number">0x40</span>, idx, sub))
        <span class="hljs-keyword">if</span> resp[<span class="hljs-number">0</span>] == <span class="hljs-number">0x80</span>:
            <span class="hljs-keyword">raise</span> RuntimeError(<span class="hljs-string">f&quot;SDO abort <span class="hljs-subst">{struct.unpack(<span class="hljs-string">&#x27;&lt;I&#x27;</span>, resp[<span class="hljs-number">4</span>:<span class="hljs-number">8</span>])[<span class="hljs-number">0</span>]:#<span class="hljs-number">0</span>10x}</span>&quot;</span>)
        <span class="hljs-keyword">return</span> struct.unpack(<span class="hljs-string">&quot;&lt;H&quot;</span>, resp[<span class="hljs-number">4</span>:<span class="hljs-number">6</span>])[<span class="hljs-number">0</span>]

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">enable</span>(<span class="hljs-params">self</span>):
        seen = []
        <span class="hljs-keyword">for</span> cw, want <span class="hljs-keyword">in</span> ((<span class="hljs-number">0x06</span>, RTSO), (<span class="hljs-number">0x07</span>, SO), (<span class="hljs-number">0x0F</span>, OE)):
            <span class="hljs-variable language_">self</span>.sdo_write_u16(<span class="hljs-number">0x6040</span>, <span class="hljs-number">0</span>, cw)
            sw = <span class="hljs-variable language_">self</span>.sdo_read_u16(<span class="hljs-number">0x6041</span>, <span class="hljs-number">0</span>)
            seen.append(sw)
            <span class="hljs-keyword">if</span> decode_status(sw) != want:
                <span class="hljs-keyword">raise</span> RuntimeError(<span class="hljs-string">f&quot;expected <span class="hljs-subst">{want}</span>, statusword <span class="hljs-subst">{sw:#06x}</span>&quot;</span>)
        <span class="hljs-keyword">return</span> seen

<span class="hljs-comment"># ---------- the profile&#x27;s transition table, written out independently ----------</span>
CANON = {<span class="hljs-string">&quot;shutdown&quot;</span>: <span class="hljs-number">0x06</span>, <span class="hljs-string">&quot;switch_on&quot;</span>: <span class="hljs-number">0x07</span>, <span class="hljs-string">&quot;enable_operation&quot;</span>: <span class="hljs-number">0x0F</span>, <span class="hljs-string">&quot;disable_voltage&quot;</span>: <span class="hljs-number">0x00</span>, <span class="hljs-string">&quot;quick_stop&quot;</span>: <span class="hljs-number">0x02</span>}
SPEC = {
    SOD: {<span class="hljs-string">&quot;shutdown&quot;</span>: RTSO},
    RTSO: {<span class="hljs-string">&quot;switch_on&quot;</span>: SO, <span class="hljs-string">&quot;enable_operation&quot;</span>: OE, <span class="hljs-string">&quot;disable_voltage&quot;</span>: SOD, <span class="hljs-string">&quot;quick_stop&quot;</span>: SOD},
    SO: {<span class="hljs-string">&quot;enable_operation&quot;</span>: OE, <span class="hljs-string">&quot;shutdown&quot;</span>: RTSO, <span class="hljs-string">&quot;disable_voltage&quot;</span>: SOD, <span class="hljs-string">&quot;quick_stop&quot;</span>: SOD},
    OE: {<span class="hljs-string">&quot;switch_on&quot;</span>: SO, <span class="hljs-string">&quot;shutdown&quot;</span>: RTSO, <span class="hljs-string">&quot;disable_voltage&quot;</span>: SOD, <span class="hljs-string">&quot;quick_stop&quot;</span>: QSA},
    QSA: {<span class="hljs-string">&quot;disable_voltage&quot;</span>: SOD, <span class="hljs-string">&quot;enable_operation&quot;</span>: OE},
}
PATH = {SOD: [], RTSO: [<span class="hljs-number">0x06</span>], SO: [<span class="hljs-number">0x06</span>, <span class="hljs-number">0x07</span>], OE: [<span class="hljs-number">0x06</span>, <span class="hljs-number">0x07</span>, <span class="hljs-number">0x0F</span>], QSA: [<span class="hljs-number">0x06</span>, <span class="hljs-number">0x07</span>, <span class="hljs-number">0x0F</span>, <span class="hljs-number">0x02</span>]}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_enable_sequence</span>():
    m = Master(Drive(node=<span class="hljs-number">5</span>))
    seen = m.enable()
    <span class="hljs-keyword">assert</span> seen == [<span class="hljs-number">0x0231</span>, <span class="hljs-number">0x0233</span>, <span class="hljs-number">0x0237</span>], [<span class="hljs-built_in">hex</span>(s) <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> seen]
    cob, req, rcob, resp = m.log[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">assert</span> (cob, req.<span class="hljs-built_in">hex</span>(<span class="hljs-string">&quot; &quot;</span>), rcob, resp[<span class="hljs-number">0</span>]) == (<span class="hljs-number">0x605</span>, <span class="hljs-string">&quot;2b 40 60 00 06 00 00 00&quot;</span>, <span class="hljs-number">0x585</span>, <span class="hljs-number">0x60</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;enable: statuswords&quot;</span>, <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{s:#06x}</span>&quot;</span> <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> seen), <span class="hljs-string">&quot;-&gt; Operation enabled&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_every_transition</span>():
    checked = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> start, path <span class="hljs-keyword">in</span> PATH.items():
        <span class="hljs-keyword">for</span> name, cw <span class="hljs-keyword">in</span> CANON.items():
            d = Drive()
            <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> path:
                d.write_controlword(c)
            <span class="hljs-keyword">assert</span> d.state == start
            d.write_controlword(cw)
            want = SPEC[start].get(name, start)
            <span class="hljs-keyword">assert</span> d.state == want, (start, name, d.state, want)
            <span class="hljs-keyword">assert</span> decode_status(d.statusword) == d.state
            checked += <span class="hljs-number">1</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{checked}</span> (state, command) pairs match the CiA 402 table&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_fault_and_reset</span>():
    <span class="hljs-keyword">for</span> start, path <span class="hljs-keyword">in</span> PATH.items():
        d = Drive()
        <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> path:
            d.write_controlword(c)
        d.fault()
        <span class="hljs-keyword">assert</span> d.state == FAULT <span class="hljs-keyword">and</span> decode_status(d.statusword) == FAULT
        d.write_controlword(<span class="hljs-number">0x0F</span>)
        <span class="hljs-keyword">assert</span> d.state == FAULT                            <span class="hljs-comment"># no command except fault reset leaves Fault</span>
        d.write_controlword(<span class="hljs-number">0x80</span>)
        <span class="hljs-keyword">assert</span> d.state == SOD                              <span class="hljs-comment"># rising edge of bit 7</span>
    d = Drive(); d.write_controlword(<span class="hljs-number">0x80</span>); d.fault()
    d.write_controlword(<span class="hljs-number">0x80</span>)
    <span class="hljs-keyword">assert</span> d.state == FAULT                                <span class="hljs-comment"># bit 7 already high: no edge, no reset</span>
    d.write_controlword(<span class="hljs-number">0x00</span>); d.write_controlword(<span class="hljs-number">0x80</span>)
    <span class="hljs-keyword">assert</span> d.state == SOD
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;fault from every state; reset only on a 0-&gt;1 edge of bit 7&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_sdo_errors</span>():
    m = Master(Drive())
    <span class="hljs-keyword">for</span> bad, code <span class="hljs-keyword">in</span> (((<span class="hljs-number">0x6099</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>), <span class="hljs-string">&quot;0x06020000&quot;</span>), ((<span class="hljs-number">0x6041</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>), <span class="hljs-string">&quot;0x06010002&quot;</span>)):
        <span class="hljs-keyword">try</span>:
            m.sdo_write_u16(*bad)
            <span class="hljs-keyword">raise</span> AssertionError
        <span class="hljs-keyword">except</span> RuntimeError <span class="hljs-keyword">as</span> e:
            <span class="hljs-keyword">assert</span> code <span class="hljs-keyword">in</span> <span class="hljs-built_in">str</span>(e)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;SDO aborts: object does not exist, read-only object&quot;</span>)

test_enable_sequence()
test_every_transition()
test_fault_and_reset()
test_sdo_errors()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your master writes 0x0F straight after power-up and the drive never enables. Why?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>After power-up the drive is in Switch on disabled, where only Shutdown (0x06) is accepted. 0x0F means Enable operation, which isn’t a valid command from that state, so the drive ignores it. Walk the states: 0x06, check for Ready to switch on, then 0x07 and 0x0F (or 0x0F directly from Ready to switch on, which the profile allows).</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why use a PDO, not an SDO, for target positions in a 1 kHz cyclic position loop?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>An SDO is a request and a confirmation, two frames with a 4-byte header, for one value, and the master has to wait for the answer. At 1 kHz across several drives that saturates the bus. A PDO is one frame per cycle, no handshake, with controlword and target position packed in its 8 bytes, triggered by a SYNC message so all drives latch together.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l12"></div>
`,i=[{id:`the-object-dictionary`,title:`The object dictionary`},{id:`sdo-and-pdo`,title:`SDO and PDO`},{id:`the-cia-402-state-machine`,title:`The CiA 402 state machine`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l12-q1`,type:`num`,q:`<p>COB-ID in decimal of the SDO request to node 5?</p>
`,explain:`<p>0x605.</p>
`,answer:1541,tol:0,unit:``},{id:`p11-l12-q2`,type:`num`,q:`<p>Statusword masked with 0x6F in Operation enabled, in decimal?</p>
`,explain:`<p>x01x 0111.</p>
`,answer:39,tol:0,unit:``},{id:`p11-l12-q3`,type:`num`,q:`<p>Data bytes carried per SDO expedited frame for a u32 object?</p>
`,explain:`<p>Four bytes of command, index and subindex.</p>
`,answer:4,tol:0,unit:`bytes`},{id:`p11-l12-q4`,type:`num`,q:`<p>Controlword in decimal for Enable operation?</p>
`,explain:`<p>Bits 0–3 set.</p>
`,answer:15,tol:0,unit:``},{id:`p11-l12-q5`,type:`mc`,q:`<p>Which command takes Operation enabled to Quick stop active?</p>
`,explain:`<p>Transition 11.</p>
`,options:[`quick stop (bit 2 cleared, bit 1 set)`,`shutdown`,`fault reset`,`switch on`],answer:0},{id:`p11-l12-q6`,type:`mc`,q:`<p>How do you leave the Fault state?</p>
`,explain:`<p>Transition 15.</p>
`,options:[`a rising edge on controlword bit 7, which goes to Switch on disabled`,`write 0x0F`,`power cycle only`,`write 0x06`],answer:0}],o=[{file:`cia402.py`,lang:`python`,src:`import struct

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
                return bytes([0x4B]) + frame[1:4] + struct.pack("<H", self.statusword) + b"\\0\\0"
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
            return bytes([0x60]) + frame[1:4] + b"\\0\\0\\0\\0"
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
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};