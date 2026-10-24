var e=`p11-l11`,t=40,n=`A classic CAN data frame wraps an 11-bit ID and up to 8 data bytes in fixed fields with a CRC-15, and inserts a stuff bit after any five equal bits so receivers never lose sync, while a DBC file says which bits of the data mean which physical signal. You derive the frame layout, the stuffing rule and its worst case, and signal scaling, write a frame encoder, decoder and DBC signal decoder, and test them against a reference log with known values.`,r=`<h2 id="the-classic-data-frame">The classic data frame</h2>
<div class="table-scroll"><table>
<thead>
<tr>
<th>field</th>
<th>bits</th>
<th>notes</th>
</tr>
</thead>
<tbody><tr>
<td>SOF</td>
<td>1</td>
<td>dominant, starts the frame</td>
</tr>
<tr>
<td>identifier</td>
<td>11</td>
<td>priority and meaning</td>
</tr>
<tr>
<td>RTR, IDE, r0</td>
<td>3</td>
<td>data frame, standard ID, reserved</td>
</tr>
<tr>
<td>DLC</td>
<td>4</td>
<td>0–8 data bytes</td>
</tr>
<tr>
<td>data</td>
<td>8n</td>
<td></td>
</tr>
<tr>
<td>CRC</td>
<td>15</td>
<td>polynomial 0x4599, over SOF to the end of data</td>
</tr>
<tr>
<td>CRC delimiter, ACK slot, ACK delimiter</td>
<td>3</td>
<td>any receiver drives the ACK slot dominant</td>
</tr>
<tr>
<td>EOF</td>
<td>7</td>
<td>recessive</td>
</tr>
<tr>
<td>interframe space</td>
<td>3</td>
<td>recessive</td>
</tr>
</tbody></table></div>
<p>That’s <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">47</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span><span class="mord mathnormal">n</span></span></span></span> bits, 111 for 8 bytes: 57 % efficiency at best. CAN’s sender sees its frame acknowledged by <em>someone</em> (the ACK slot), not by a specific node.</p>
<h2 id="bit-stuffing">Bit stuffing</h2>
<p>CAN has no clock line, and receivers re-synchronise on recessive-to-dominant edges. A long run of equal bits has no edges, so after <strong>five identical bits</strong> the transmitter inserts one bit of the opposite value, and receivers remove it. Six equal bits in a row are an error (the error and EOF fields use that on purpose). Stuffing applies from SOF to the end of the CRC: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">34</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span><span class="mord mathnormal">n</span></span></span></span> bits.</p>
<p>The worst case is a run of five, then a stuff bit that itself starts a new run of four more equal bits, repeated: one stuff bit per four bits after the first five, so at most</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:2.4em;vertical-align:-0.95em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">⌊</span></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">4</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">34</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">8</span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">⌋</span></span></span></span></span></span></span></div>
<p>stuff bits, 24 for 8 bytes. The worst-case frame is 135 bits, which is the number to use for bus-load and latency analysis.</p>
<h2 id="signals-and-dbc-files">Signals and DBC files</h2>
<p>Eight bytes rarely hold one value. A <strong>DBC</strong> file, the de facto standard format for describing a CAN network, defines messages (<code>BO_</code>) and the signals inside them (<code>SG_</code>):</p>
<pre><code class="language-text">SG_ Speed : 0|16@1+ (0.125,0) [0|8191.875] “rpm” Vector__XXX
</code></pre>
<p>That’s start bit 0, length 16, <code>@1</code> little-endian (Intel; <code>@0</code> is big-endian, Motorola), <code>+</code> unsigned (<code>-</code> is two’s complement signed), and the physical value is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord text"><span class="mord">raw</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.125</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> rpm.</p>
<p>For Intel signals, the payload is a little-endian integer and the signal is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord text"><span class="mord">payload</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≫</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">start</span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord">&amp;</span></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0991em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">e</span><span class="mord mathnormal mtight">n</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span>. For Motorola signals, the start bit names the signal’s <strong>most significant</strong> bit in a numbering where bit 7 is the MSB of byte 0, and the signal continues into the following bytes: easy to get wrong, so test it.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="candbc" data-args="{}"></div></div><figcaption>A CAN frame’s bits with the stuff bits highlighted, and the DBC signals decoded from the data bytes. Change the signal values to see the data bytes, the stuffing and the decoded values update.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The motor controller sends ID 0x123 with data <code>E0 2E 83 9F 36 00 00 00</code>.</p>
<ol>
<li>As a little-endian integer the payload is 0x369F832EE0.</li>
<li>Speed = bits 0–15 = 0x2EE0 = 12 000, × 0.125 = <strong>1500 rpm</strong>.</li>
<li>Current = bits 16–27 = 0xF83, a 12-bit signed value: 3971 − 4096 = −125, × 0.1 = <strong>−12.5 A</strong>.</li>
<li>Temperature = bits 28–35 = 0x69 = 105, × 1 − 40 = <strong>65 °C</strong>. State = bits 36–38 = 3.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">can_dbc.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> random, re

<span class="hljs-comment"># ---------- CRC-15/CAN ----------</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">crc15</span>(<span class="hljs-params">bits</span>):
    crc = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> bits:
        nxt = b ^ (crc &gt;&gt; <span class="hljs-number">14</span>)
        crc = (crc &lt;&lt; <span class="hljs-number">1</span>) &amp; <span class="hljs-number">0x7FFF</span>
        <span class="hljs-keyword">if</span> nxt:
            crc ^= <span class="hljs-number">0x4599</span>
    <span class="hljs-keyword">return</span> crc

<span class="hljs-keyword">def</span> <span class="hljs-title function_">to_bits</span>(<span class="hljs-params">value, n</span>):
    <span class="hljs-keyword">return</span> [(value &gt;&gt; i) &amp; <span class="hljs-number">1</span> <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n - <span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bytes_to_bits</span>(<span class="hljs-params">data</span>):
    <span class="hljs-keyword">return</span> [b <span class="hljs-keyword">for</span> byte <span class="hljs-keyword">in</span> data <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> to_bits(byte, <span class="hljs-number">8</span>)]

<span class="hljs-comment"># ---------- stuffing ----------</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">stuff</span>(<span class="hljs-params">bits</span>):
    out, run, last = [], <span class="hljs-number">0</span>, <span class="hljs-literal">None</span>
    <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> bits:
        out.append(b)
        run = run + <span class="hljs-number">1</span> <span class="hljs-keyword">if</span> b == last <span class="hljs-keyword">else</span> <span class="hljs-number">1</span>
        last = b
        <span class="hljs-keyword">if</span> run == <span class="hljs-number">5</span>:
            out.append(<span class="hljs-number">1</span> - b)
            last, run = <span class="hljs-number">1</span> - b, <span class="hljs-number">1</span>
    <span class="hljs-keyword">return</span> out

<span class="hljs-keyword">def</span> <span class="hljs-title function_">unstuff</span>(<span class="hljs-params">bits</span>):
    out, run, last, i = [], <span class="hljs-number">0</span>, <span class="hljs-literal">None</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">while</span> i &lt; <span class="hljs-built_in">len</span>(bits):
        b = bits[i]
        out.append(b)
        run = run + <span class="hljs-number">1</span> <span class="hljs-keyword">if</span> b == last <span class="hljs-keyword">else</span> <span class="hljs-number">1</span>
        last = b
        <span class="hljs-keyword">if</span> run == <span class="hljs-number">5</span>:
            i += <span class="hljs-number">1</span>
            <span class="hljs-keyword">if</span> i &gt;= <span class="hljs-built_in">len</span>(bits):
                <span class="hljs-keyword">break</span>
            <span class="hljs-keyword">if</span> bits[i] == b:
                <span class="hljs-keyword">raise</span> ValueError(<span class="hljs-string">&quot;stuff error: six equal bits&quot;</span>)
            last, run = bits[i], <span class="hljs-number">1</span>
        i += <span class="hljs-number">1</span>
    <span class="hljs-keyword">return</span> out

<span class="hljs-comment"># ---------- frames ----------</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">encode_frame</span>(<span class="hljs-params">can_id, data</span>):
    <span class="hljs-keyword">assert</span> <span class="hljs-number">0</span> &lt;= can_id &lt; <span class="hljs-number">0x800</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(data) &lt;= <span class="hljs-number">8</span>
    head = [<span class="hljs-number">0</span>] + to_bits(can_id, <span class="hljs-number">11</span>) + [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>] + to_bits(<span class="hljs-built_in">len</span>(data), <span class="hljs-number">4</span>) + bytes_to_bits(data)
    body = head + to_bits(crc15(head), <span class="hljs-number">15</span>)
    <span class="hljs-keyword">return</span> stuff(body) + [<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>] + [<span class="hljs-number">1</span>] * <span class="hljs-number">7</span> + [<span class="hljs-number">1</span>] * <span class="hljs-number">3</span>     <span class="hljs-comment"># CRC delim, ACK (acked), ACK delim, EOF, IFS</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">decode_frame</span>(<span class="hljs-params">bits</span>):
    <span class="hljs-comment"># find the end of the stuffed region by unstuffing progressively</span>
    raw = unstuff(bits[:-<span class="hljs-number">13</span>])
    dlc = <span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, raw[<span class="hljs-number">15</span>:<span class="hljs-number">19</span>])), <span class="hljs-number">2</span>)
    n = <span class="hljs-number">19</span> + <span class="hljs-number">8</span> * dlc
    head, crc = raw[:n], <span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, raw[n:n + <span class="hljs-number">15</span>])), <span class="hljs-number">2</span>)
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(raw) != n + <span class="hljs-number">15</span> <span class="hljs-keyword">or</span> crc15(head) != crc:
        <span class="hljs-keyword">raise</span> ValueError(<span class="hljs-string">&quot;CRC error&quot;</span>)
    can_id = <span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, raw[<span class="hljs-number">1</span>:<span class="hljs-number">12</span>])), <span class="hljs-number">2</span>)
    data = <span class="hljs-built_in">bytes</span>(<span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, head[<span class="hljs-number">19</span> + <span class="hljs-number">8</span> * k:<span class="hljs-number">27</span> + <span class="hljs-number">8</span> * k])), <span class="hljs-number">2</span>) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(dlc))
    <span class="hljs-keyword">return</span> can_id, data

<span class="hljs-keyword">def</span> <span class="hljs-title function_">max_stuff_bits</span>(<span class="hljs-params">n</span>):
    <span class="hljs-keyword">return</span> (<span class="hljs-number">34</span> + <span class="hljs-number">8</span> * n - <span class="hljs-number">1</span>) // <span class="hljs-number">4</span>

<span class="hljs-comment"># ---------- DBC ----------</span>
DBC = <span class="hljs-string">&quot;&quot;&quot;
BO_ 291 MotorStatus: 8 Drive
 SG_ Speed : 0|16@1+ (0.125,0) [0|8191.875] &quot;rpm&quot; Vector__XXX
 SG_ Current : 16|12@1- (0.1,0) [-204.8|204.7] &quot;A&quot; Vector__XXX
 SG_ Temp : 28|8@1+ (1,-40) [-40|215] &quot;degC&quot; Vector__XXX
 SG_ State : 36|3@1+ (1,0) [0|7] &quot;&quot; Vector__XXX

BO_ 1280 BMS: 8 BMS
 SG_ PackVoltage : 7|16@0+ (0.01,0) [0|655.35] &quot;V&quot; Vector__XXX
 SG_ PackCurrent : 23|16@0- (0.1,0) [-3276.8|3276.7] &quot;A&quot; Vector__XXX
 SG_ SoC : 39|8@0+ (0.5,0) [0|100] &quot;%&quot; Vector__XXX
&quot;&quot;&quot;</span>

SG = re.<span class="hljs-built_in">compile</span>(<span class="hljs-string">r&#x27;SG_ (\\w+) : (\\d+)\\|(\\d+)@([01])([+-]) \\(([^,]+),([^)]+)\\) \\[([^|]+)\\|([^\\]]+)\\] &quot;([^&quot;]*)&quot;&#x27;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">parse_dbc</span>(<span class="hljs-params">text</span>):
    msgs, cur = {}, <span class="hljs-literal">None</span>
    <span class="hljs-keyword">for</span> line <span class="hljs-keyword">in</span> text.splitlines():
        line = line.strip()
        <span class="hljs-keyword">if</span> line.startswith(<span class="hljs-string">&quot;BO_ &quot;</span>):
            _, mid, name, dlc, _ = line.replace(<span class="hljs-string">&quot;:&quot;</span>, <span class="hljs-string">&quot;&quot;</span>).split()
            cur = msgs[<span class="hljs-built_in">int</span>(mid)] = {<span class="hljs-string">&quot;name&quot;</span>: name, <span class="hljs-string">&quot;dlc&quot;</span>: <span class="hljs-built_in">int</span>(dlc), <span class="hljs-string">&quot;signals&quot;</span>: []}
        <span class="hljs-keyword">elif</span> line.startswith(<span class="hljs-string">&quot;SG_ &quot;</span>):
            m = SG.<span class="hljs-keyword">match</span>(line)
            name, start, length, order, sign, factor, offset, lo, hi, unit = m.groups()
            cur[<span class="hljs-string">&quot;signals&quot;</span>].append(<span class="hljs-built_in">dict</span>(name=name, start=<span class="hljs-built_in">int</span>(start), length=<span class="hljs-built_in">int</span>(length), intel=order == <span class="hljs-string">&quot;1&quot;</span>,
                                       signed=sign == <span class="hljs-string">&quot;-&quot;</span>, factor=<span class="hljs-built_in">float</span>(factor), offset=<span class="hljs-built_in">float</span>(offset), unit=unit))
    <span class="hljs-keyword">return</span> msgs

<span class="hljs-keyword">def</span> <span class="hljs-title function_">raw_value</span>(<span class="hljs-params">sig, data</span>):
    n = sig[<span class="hljs-string">&quot;length&quot;</span>]
    <span class="hljs-keyword">if</span> sig[<span class="hljs-string">&quot;intel&quot;</span>]:
        raw = (<span class="hljs-built_in">int</span>.from_bytes(data, <span class="hljs-string">&quot;little&quot;</span>) &gt;&gt; sig[<span class="hljs-string">&quot;start&quot;</span>]) &amp; ((<span class="hljs-number">1</span> &lt;&lt; n) - <span class="hljs-number">1</span>)
    <span class="hljs-keyword">else</span>:                                                 <span class="hljs-comment"># Motorola: start is the MSB; count in big-endian order</span>
        msb = (sig[<span class="hljs-string">&quot;start&quot;</span>] // <span class="hljs-number">8</span>) * <span class="hljs-number">8</span> + (<span class="hljs-number">7</span> - sig[<span class="hljs-string">&quot;start&quot;</span>] % <span class="hljs-number">8</span>)
        total = <span class="hljs-number">8</span> * <span class="hljs-built_in">len</span>(data)
        raw = (<span class="hljs-built_in">int</span>.from_bytes(data, <span class="hljs-string">&quot;big&quot;</span>) &gt;&gt; (total - msb - n)) &amp; ((<span class="hljs-number">1</span> &lt;&lt; n) - <span class="hljs-number">1</span>)
    <span class="hljs-keyword">if</span> sig[<span class="hljs-string">&quot;signed&quot;</span>] <span class="hljs-keyword">and</span> raw &gt;&gt; (n - <span class="hljs-number">1</span>):
        raw -= <span class="hljs-number">1</span> &lt;&lt; n
    <span class="hljs-keyword">return</span> raw

<span class="hljs-keyword">def</span> <span class="hljs-title function_">decode</span>(<span class="hljs-params">msgs, can_id, data</span>):
    m = msgs[can_id]
    <span class="hljs-keyword">return</span> {s[<span class="hljs-string">&quot;name&quot;</span>]: raw_value(s, data) * s[<span class="hljs-string">&quot;factor&quot;</span>] + s[<span class="hljs-string">&quot;offset&quot;</span>] <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> m[<span class="hljs-string">&quot;signals&quot;</span>]}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">encode</span>(<span class="hljs-params">msgs, can_id, values</span>):
    m = msgs[can_id]
    payload_le, payload_be = <span class="hljs-number">0</span>, <span class="hljs-number">0</span>
    total = <span class="hljs-number">8</span> * m[<span class="hljs-string">&quot;dlc&quot;</span>]
    <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> m[<span class="hljs-string">&quot;signals&quot;</span>]:
        n = s[<span class="hljs-string">&quot;length&quot;</span>]
        raw = <span class="hljs-built_in">round</span>((values[s[<span class="hljs-string">&quot;name&quot;</span>]] - s[<span class="hljs-string">&quot;offset&quot;</span>]) / s[<span class="hljs-string">&quot;factor&quot;</span>]) &amp; ((<span class="hljs-number">1</span> &lt;&lt; n) - <span class="hljs-number">1</span>)
        <span class="hljs-keyword">if</span> s[<span class="hljs-string">&quot;intel&quot;</span>]:
            payload_le |= raw &lt;&lt; s[<span class="hljs-string">&quot;start&quot;</span>]
        <span class="hljs-keyword">else</span>:
            msb = (s[<span class="hljs-string">&quot;start&quot;</span>] // <span class="hljs-number">8</span>) * <span class="hljs-number">8</span> + (<span class="hljs-number">7</span> - s[<span class="hljs-string">&quot;start&quot;</span>] % <span class="hljs-number">8</span>)
            payload_be |= raw &lt;&lt; (total - msb - n)
    le = payload_le.to_bytes(m[<span class="hljs-string">&quot;dlc&quot;</span>], <span class="hljs-string">&quot;little&quot;</span>)
    be = payload_be.to_bytes(m[<span class="hljs-string">&quot;dlc&quot;</span>], <span class="hljs-string">&quot;big&quot;</span>)
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>(a | b <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(le, be))

<span class="hljs-comment"># a short reference log (candump format) with the values each frame should decode to</span>
LOG = <span class="hljs-string">&quot;&quot;&quot;
(1700000000.000100) can0 123#E02E839F36000000
(1700000000.000600) can0 500#9BC4FE3BA3000000
(1700000000.001100) can0 123#0000000080040000
&quot;&quot;&quot;</span>
EXPECT = [
    {<span class="hljs-string">&quot;Speed&quot;</span>: <span class="hljs-number">1500.0</span>, <span class="hljs-string">&quot;Current&quot;</span>: -<span class="hljs-number">12.5</span>, <span class="hljs-string">&quot;Temp&quot;</span>: <span class="hljs-number">65.0</span>, <span class="hljs-string">&quot;State&quot;</span>: <span class="hljs-number">3.0</span>},
    {<span class="hljs-string">&quot;PackVoltage&quot;</span>: <span class="hljs-number">398.76</span>, <span class="hljs-string">&quot;PackCurrent&quot;</span>: -<span class="hljs-number">45.3</span>, <span class="hljs-string">&quot;SoC&quot;</span>: <span class="hljs-number">81.5</span>},
    {<span class="hljs-string">&quot;Speed&quot;</span>: <span class="hljs-number">0.0</span>, <span class="hljs-string">&quot;Current&quot;</span>: <span class="hljs-number">0.0</span>, <span class="hljs-string">&quot;Temp&quot;</span>: -<span class="hljs-number">40.0</span>, <span class="hljs-string">&quot;State&quot;</span>: <span class="hljs-number">0.0</span>},
]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_crc_and_stuffing</span>():
    <span class="hljs-keyword">assert</span> crc15(bytes_to_bits(<span class="hljs-string">b&quot;123456789&quot;</span>)) == <span class="hljs-number">0x059E</span>          <span class="hljs-comment"># CRC-15/CAN check value</span>
    rng = random.Random(<span class="hljs-number">2</span>)
    worst_seen = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">3000</span>):
        can_id, data = rng.randrange(<span class="hljs-number">0x800</span>), <span class="hljs-built_in">bytes</span>(rng.randrange(<span class="hljs-number">256</span>) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(rng.randrange(<span class="hljs-number">9</span>)))
        bits = encode_frame(can_id, data)
        s = <span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, bits[:-<span class="hljs-number">13</span>]))
        <span class="hljs-keyword">assert</span> <span class="hljs-string">&quot;000000&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> s <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;111111&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> s
        <span class="hljs-keyword">assert</span> decode_frame(bits) == (can_id, data)
        stuffed = <span class="hljs-built_in">len</span>(bits) - (<span class="hljs-number">47</span> + <span class="hljs-number">8</span> * <span class="hljs-built_in">len</span>(data))
        <span class="hljs-keyword">assert</span> <span class="hljs-number">0</span> &lt;= stuffed &lt;= max_stuff_bits(<span class="hljs-built_in">len</span>(data))
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(data) == <span class="hljs-number">8</span>:
            worst_seen = <span class="hljs-built_in">max</span>(worst_seen, stuffed)
        flip = rng.randrange(<span class="hljs-built_in">len</span>(bits) - <span class="hljs-number">13</span>)                     <span class="hljs-comment"># a single bit error inside the stuffed region</span>
        bad = bits[:]; bad[flip] ^= <span class="hljs-number">1</span>
        <span class="hljs-keyword">try</span>:
            <span class="hljs-keyword">assert</span> decode_frame(bad) != (can_id, data)
        <span class="hljs-keyword">except</span> (ValueError, IndexError):
            <span class="hljs-keyword">pass</span>
    pattern = [<span class="hljs-number">0</span>] * <span class="hljs-number">5</span> + [<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>] * <span class="hljs-number">12</span>           <span class="hljs-comment"># the worst case: every stuff bit starts a new run</span>
    pattern = pattern[:<span class="hljs-number">98</span>]
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(stuff(pattern)) - <span class="hljs-number">98</span> == max_stuff_bits(<span class="hljs-number">8</span>) == <span class="hljs-number">24</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;CRC-15 check 0x059E; 3000 random frames round-trip; worst stuffing seen <span class="hljs-subst">{worst_seen}</span> of max <span class="hljs-subst">{max_stuff_bits(<span class="hljs-number">8</span>)}</span>&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_dbc_log</span>():
    msgs = parse_dbc(DBC)
    <span class="hljs-keyword">for</span> line, want <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(LOG.strip().splitlines(), EXPECT):
        frame = line.split()[<span class="hljs-number">2</span>]
        can_id, data = <span class="hljs-built_in">int</span>(frame.split(<span class="hljs-string">&quot;#&quot;</span>)[<span class="hljs-number">0</span>], <span class="hljs-number">16</span>), <span class="hljs-built_in">bytes</span>.fromhex(frame.split(<span class="hljs-string">&quot;#&quot;</span>)[<span class="hljs-number">1</span>])
        got = decode(msgs, can_id, data)
        <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> want.items():
            <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(got[k] - v) &lt; <span class="hljs-number">1e-9</span>, (k, got[k], v)
        <span class="hljs-keyword">assert</span> decode_frame(encode_frame(can_id, data)) == (can_id, data)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;reference log decodes to:&quot;</span>, decode(msgs, <span class="hljs-number">0x123</span>, <span class="hljs-built_in">bytes</span>.fromhex(<span class="hljs-string">&quot;E02E839F36000000&quot;</span>)))
    rng = random.Random(<span class="hljs-number">9</span>)
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">2000</span>):                                         <span class="hljs-comment"># encode/decode round trip within range</span>
        v = {<span class="hljs-string">&quot;Speed&quot;</span>: rng.randrange(<span class="hljs-number">65536</span>) * <span class="hljs-number">0.125</span>, <span class="hljs-string">&quot;Current&quot;</span>: rng.randrange(-<span class="hljs-number">2048</span>, <span class="hljs-number">2048</span>) * <span class="hljs-number">0.1</span>,
             <span class="hljs-string">&quot;Temp&quot;</span>: rng.randrange(<span class="hljs-number">256</span>) - <span class="hljs-number">40.0</span>, <span class="hljs-string">&quot;State&quot;</span>: <span class="hljs-built_in">float</span>(rng.randrange(<span class="hljs-number">8</span>))}
        got = decode(msgs, <span class="hljs-number">0x123</span>, encode(msgs, <span class="hljs-number">0x123</span>, v))
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">all</span>(<span class="hljs-built_in">abs</span>(got[k] - v[k]) &lt; <span class="hljs-number">1e-6</span> <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> v)
        b = {<span class="hljs-string">&quot;PackVoltage&quot;</span>: rng.randrange(<span class="hljs-number">65536</span>) * <span class="hljs-number">0.01</span>, <span class="hljs-string">&quot;PackCurrent&quot;</span>: rng.randrange(-<span class="hljs-number">32768</span>, <span class="hljs-number">32768</span>) * <span class="hljs-number">0.1</span>, <span class="hljs-string">&quot;SoC&quot;</span>: rng.randrange(<span class="hljs-number">201</span>) * <span class="hljs-number">0.5</span>}
        got = decode(msgs, <span class="hljs-number">0x500</span>, encode(msgs, <span class="hljs-number">0x500</span>, b))
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">all</span>(<span class="hljs-built_in">abs</span>(got[k] - b[k]) &lt; <span class="hljs-number">1e-6</span> <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> b)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;DBC: reference log matches; 2000 Intel and Motorola round trips&quot;</span>)

test_crc_and_stuffing()
test_dbc_log()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A signal decodes correctly when it’s small but jumps to nonsense above 255. Intel or Motorola is wrong?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Almost certainly the byte order. A 16-bit value under 256 fits in one byte, so it decodes the same either way; above 255 the high byte matters and swapping order gives garbage. Check <code>@0</code> versus <code>@1</code> in the DBC and remember that a Motorola start bit is the signal’s MSB.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why are six equal bits in a row on the bus never part of a valid frame body, and who uses that?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Stuffing guarantees at most five equal bits between SOF and the CRC. Error frames deliberately send six dominant bits (an error flag) to violate the rule, so every node notices immediately and discards the frame; the 7-bit recessive EOF also lies outside the stuffed region.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l11"></div>

`,i=[{id:`the-classic-data-frame`,title:`The classic data frame`},{id:`bit-stuffing`,title:`Bit stuffing`},{id:`signals-and-dbc-files`,title:`Signals and DBC files`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l11-q1`,type:`num`,q:`<p>Unstuffed length in bits of a classic data frame with 4 data bytes, including the interframe space?</p>
`,explain:`<p>47 + 8n.</p>
`,answer:79,tol:0,unit:`bits`},{id:`p11-l11-q2`,type:`num`,q:`<p>Maximum stuff bits for an 8-byte frame?</p>
`,explain:`<p>One per four bits after the first five.</p>
`,answer:24,tol:0,unit:`bits`},{id:`p11-l11-q3`,type:`num`,q:`<p>Physical value for raw 0xF83 as a 12-bit signed signal with factor 0.1?</p>
`,explain:`<p>Two’s complement.</p>
`,answer:-12.5,tol:1e-4,unit:`A`},{id:`p11-l11-q4`,type:`num`,q:`<p>Worst-case duration in µs of an 8-byte frame at 500 kbit/s?</p>
`,explain:`<p>111 + 24 stuff bits.</p>
`,answer:270,tol:.001,unit:`µs`},{id:`p11-l11-q5`,type:`mc`,q:`<p>What does @0 mean in a DBC signal definition?</p>
`,explain:`<p>@1 is little-endian (Intel).</p>
`,options:[`start bit zero`,`unsigned`,`no scaling`,`big-endian (Motorola) byte order`],answer:3},{id:`p11-l11-q6`,type:`mc`,q:`<p>Why does CAN stuff bits?</p>
`,explain:`<p>There’s no clock line.</p>
`,options:[`to pad frames to 8 bytes`,`to encrypt the data`,`to add error correction`,`so receivers see edges often enough to stay synchronised`],answer:3}],o=[{file:`can_dbc.py`,lang:`python`,src:`import random, re

# ---------- CRC-15/CAN ----------
def crc15(bits):
    crc = 0
    for b in bits:
        nxt = b ^ (crc >> 14)
        crc = (crc << 1) & 0x7FFF
        if nxt:
            crc ^= 0x4599
    return crc

def to_bits(value, n):
    return [(value >> i) & 1 for i in range(n - 1, -1, -1)]

def bytes_to_bits(data):
    return [b for byte in data for b in to_bits(byte, 8)]

# ---------- stuffing ----------
def stuff(bits):
    out, run, last = [], 0, None
    for b in bits:
        out.append(b)
        run = run + 1 if b == last else 1
        last = b
        if run == 5:
            out.append(1 - b)
            last, run = 1 - b, 1
    return out

def unstuff(bits):
    out, run, last, i = [], 0, None, 0
    while i < len(bits):
        b = bits[i]
        out.append(b)
        run = run + 1 if b == last else 1
        last = b
        if run == 5:
            i += 1
            if i >= len(bits):
                break
            if bits[i] == b:
                raise ValueError("stuff error: six equal bits")
            last, run = bits[i], 1
        i += 1
    return out

# ---------- frames ----------
def encode_frame(can_id, data):
    assert 0 <= can_id < 0x800 and len(data) <= 8
    head = [0] + to_bits(can_id, 11) + [0, 0, 0] + to_bits(len(data), 4) + bytes_to_bits(data)
    body = head + to_bits(crc15(head), 15)
    return stuff(body) + [1, 0, 1] + [1] * 7 + [1] * 3     # CRC delim, ACK (acked), ACK delim, EOF, IFS

def decode_frame(bits):
    # find the end of the stuffed region by unstuffing progressively
    raw = unstuff(bits[:-13])
    dlc = int("".join(map(str, raw[15:19])), 2)
    n = 19 + 8 * dlc
    head, crc = raw[:n], int("".join(map(str, raw[n:n + 15])), 2)
    if len(raw) != n + 15 or crc15(head) != crc:
        raise ValueError("CRC error")
    can_id = int("".join(map(str, raw[1:12])), 2)
    data = bytes(int("".join(map(str, head[19 + 8 * k:27 + 8 * k])), 2) for k in range(dlc))
    return can_id, data

def max_stuff_bits(n):
    return (34 + 8 * n - 1) // 4

# ---------- DBC ----------
DBC = """
BO_ 291 MotorStatus: 8 Drive
 SG_ Speed : 0|16@1+ (0.125,0) [0|8191.875] "rpm" Vector__XXX
 SG_ Current : 16|12@1- (0.1,0) [-204.8|204.7] "A" Vector__XXX
 SG_ Temp : 28|8@1+ (1,-40) [-40|215] "degC" Vector__XXX
 SG_ State : 36|3@1+ (1,0) [0|7] "" Vector__XXX

BO_ 1280 BMS: 8 BMS
 SG_ PackVoltage : 7|16@0+ (0.01,0) [0|655.35] "V" Vector__XXX
 SG_ PackCurrent : 23|16@0- (0.1,0) [-3276.8|3276.7] "A" Vector__XXX
 SG_ SoC : 39|8@0+ (0.5,0) [0|100] "%" Vector__XXX
"""

SG = re.compile(r'SG_ (\\w+) : (\\d+)\\|(\\d+)@([01])([+-]) \\(([^,]+),([^)]+)\\) \\[([^|]+)\\|([^\\]]+)\\] "([^"]*)"')

def parse_dbc(text):
    msgs, cur = {}, None
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("BO_ "):
            _, mid, name, dlc, _ = line.replace(":", "").split()
            cur = msgs[int(mid)] = {"name": name, "dlc": int(dlc), "signals": []}
        elif line.startswith("SG_ "):
            m = SG.match(line)
            name, start, length, order, sign, factor, offset, lo, hi, unit = m.groups()
            cur["signals"].append(dict(name=name, start=int(start), length=int(length), intel=order == "1",
                                       signed=sign == "-", factor=float(factor), offset=float(offset), unit=unit))
    return msgs

def raw_value(sig, data):
    n = sig["length"]
    if sig["intel"]:
        raw = (int.from_bytes(data, "little") >> sig["start"]) & ((1 << n) - 1)
    else:                                                 # Motorola: start is the MSB; count in big-endian order
        msb = (sig["start"] // 8) * 8 + (7 - sig["start"] % 8)
        total = 8 * len(data)
        raw = (int.from_bytes(data, "big") >> (total - msb - n)) & ((1 << n) - 1)
    if sig["signed"] and raw >> (n - 1):
        raw -= 1 << n
    return raw

def decode(msgs, can_id, data):
    m = msgs[can_id]
    return {s["name"]: raw_value(s, data) * s["factor"] + s["offset"] for s in m["signals"]}

def encode(msgs, can_id, values):
    m = msgs[can_id]
    payload_le, payload_be = 0, 0
    total = 8 * m["dlc"]
    for s in m["signals"]:
        n = s["length"]
        raw = round((values[s["name"]] - s["offset"]) / s["factor"]) & ((1 << n) - 1)
        if s["intel"]:
            payload_le |= raw << s["start"]
        else:
            msb = (s["start"] // 8) * 8 + (7 - s["start"] % 8)
            payload_be |= raw << (total - msb - n)
    le = payload_le.to_bytes(m["dlc"], "little")
    be = payload_be.to_bytes(m["dlc"], "big")
    return bytes(a | b for a, b in zip(le, be))

# a short reference log (candump format) with the values each frame should decode to
LOG = """
(1700000000.000100) can0 123#E02E839F36000000
(1700000000.000600) can0 500#9BC4FE3BA3000000
(1700000000.001100) can0 123#0000000080040000
"""
EXPECT = [
    {"Speed": 1500.0, "Current": -12.5, "Temp": 65.0, "State": 3.0},
    {"PackVoltage": 398.76, "PackCurrent": -45.3, "SoC": 81.5},
    {"Speed": 0.0, "Current": 0.0, "Temp": -40.0, "State": 0.0},
]

def test_crc_and_stuffing():
    assert crc15(bytes_to_bits(b"123456789")) == 0x059E          # CRC-15/CAN check value
    rng = random.Random(2)
    worst_seen = 0
    for _ in range(3000):
        can_id, data = rng.randrange(0x800), bytes(rng.randrange(256) for _ in range(rng.randrange(9)))
        bits = encode_frame(can_id, data)
        s = "".join(map(str, bits[:-13]))
        assert "000000" not in s and "111111" not in s
        assert decode_frame(bits) == (can_id, data)
        stuffed = len(bits) - (47 + 8 * len(data))
        assert 0 <= stuffed <= max_stuff_bits(len(data))
        if len(data) == 8:
            worst_seen = max(worst_seen, stuffed)
        flip = rng.randrange(len(bits) - 13)                     # a single bit error inside the stuffed region
        bad = bits[:]; bad[flip] ^= 1
        try:
            assert decode_frame(bad) != (can_id, data)
        except (ValueError, IndexError):
            pass
    pattern = [0] * 5 + [1, 1, 1, 1, 0, 0, 0, 0] * 12           # the worst case: every stuff bit starts a new run
    pattern = pattern[:98]
    assert len(stuff(pattern)) - 98 == max_stuff_bits(8) == 24
    print(f"CRC-15 check 0x059E; 3000 random frames round-trip; worst stuffing seen {worst_seen} of max {max_stuff_bits(8)}")

def test_dbc_log():
    msgs = parse_dbc(DBC)
    for line, want in zip(LOG.strip().splitlines(), EXPECT):
        frame = line.split()[2]
        can_id, data = int(frame.split("#")[0], 16), bytes.fromhex(frame.split("#")[1])
        got = decode(msgs, can_id, data)
        for k, v in want.items():
            assert abs(got[k] - v) < 1e-9, (k, got[k], v)
        assert decode_frame(encode_frame(can_id, data)) == (can_id, data)
    print("reference log decodes to:", decode(msgs, 0x123, bytes.fromhex("E02E839F36000000")))
    rng = random.Random(9)
    for _ in range(2000):                                         # encode/decode round trip within range
        v = {"Speed": rng.randrange(65536) * 0.125, "Current": rng.randrange(-2048, 2048) * 0.1,
             "Temp": rng.randrange(256) - 40.0, "State": float(rng.randrange(8))}
        got = decode(msgs, 0x123, encode(msgs, 0x123, v))
        assert all(abs(got[k] - v[k]) < 1e-6 for k in v)
        b = {"PackVoltage": rng.randrange(65536) * 0.01, "PackCurrent": rng.randrange(-32768, 32768) * 0.1, "SoC": rng.randrange(201) * 0.5}
        got = decode(msgs, 0x500, encode(msgs, 0x500, b))
        assert all(abs(got[k] - b[k]) < 1e-6 for k in b)
    print("DBC: reference log matches; 2000 Intel and Motorola round trips")

test_crc_and_stuffing()
test_dbc_log()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};