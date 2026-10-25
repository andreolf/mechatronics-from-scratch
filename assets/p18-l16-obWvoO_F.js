var e=`p18-l16`,t=40,n=`micro-ROS puts a ROS 2 node on a microcontroller, connected to the graph through an agent on a bigger computer. You write both ends of an encoder link in C, CDR serialization, serial framing with byte stuffing and a CRC on the MCU, and unframing, CRC checking and rate measurement on the agent, and check the published rate.`,r=`<h2 id="why-micro-ros">Why micro-ROS</h2>
<p>A motor controller or an IMU board runs on a microcontroller (Phase 10) with tens of kilobytes of RAM, no Linux and no full DDS. <strong>micro-ROS</strong> brings the ROS 2 client API (<code>rclc</code>, a C layer on <code>rcl</code>) to it, on top of an RTOS such as FreeRTOS or Zephyr (lesson 03). It does not speak DDS itself: it uses <strong>DDS-XRCE</strong> (DDS for eXtremely Resource Constrained Environments), a small client protocol carried over serial, UDP or CAN to a <strong>micro-ROS agent</strong> running on the robot’s computer. The agent creates the real DDS entities on the client’s behalf, so the MCU appears in the graph as an ordinary node.</p>
<h2 id="what-crosses-the-wire">What crosses the wire</h2>
<p>The payload is the same CDR encoding DDS uses (lesson 10). Over a serial link, bytes need <strong>framing</strong> so the receiver can find message boundaries and detect corruption. A common scheme, HDLC-style and similar in spirit to the XRCE serial transport:</p>
<ul>
<li>a flag byte <code>0x7E</code> at the start and end,</li>
<li><strong>byte stuffing</strong>: a flag or escape byte inside the data is sent as <code>0x7D</code> followed by the byte XOR <code>0x20</code>,</li>
<li>a <strong>CRC</strong> over the payload, so a flipped bit is detected and the frame dropped (here CRC-16/CCITT, check value <code>0x29B1</code>).</li>
</ul>
<p>Best-effort streams drop bad frames; reliable XRCE streams retransmit them.</p>
<h2 id="budget-the-link">Budget the link</h2>
<p>A UART at 115200 baud with 10 bits per byte (start, 8 data, stop) carries 11 520 bytes/s. The load is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord text"><span class="mord">load</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9805em;vertical-align:-0.2861em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">n</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">b</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span><span class="mord mathnormal mtight">t</span><span class="mord mathnormal mtight">es</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">10/</span><span class="mord text"><span class="mord">baud</span></span></span></span></span>, so at 100 Hz, frames of 26 bytes use <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">26</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">10/115200</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8056em;vertical-align:-0.0556em;"></span><span class="mord">22.6</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">%</span></span></span></span> of it, which leaves room for other topics and retransmissions.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="microros" data-args="{}"></div></div><figcaption>An encoder MCU publishing through a micro-ROS agent. Change the publish rate, baud rate and bit-error rate; the readout shows link load, frames rejected by CRC and the rate seen in the ROS 2 graph.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A simulated 10 s run with an illustrative 2 % of frames corrupted by a single bit flip:</p>
<ol>
<li>The CRC routine gives <code>0x29B1</code> for <code>&quot;123456789&quot;</code>, the standard check value.</li>
<li>The MCU sends 1000 frames of at most 26 bytes (a 20-byte CDR payload, 2 CRC bytes, flags and occasional escapes).</li>
<li>The agent rejects 18 frames by CRC and publishes 982, a rate of 98.3 Hz. Every published message equals what was sent; the last tick count is 937.</li>
<li>The link load at 115200 baud is 22.6 %.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">microros_link.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* microros_link.c: what a micro-ROS encoder node and its agent exchange, simulated on the host.
   MCU side: sample the encoder on a 100 Hz timer, serialize to CDR, frame for a serial link with a CRC.
   Agent side: unframe, check the CRC, deserialize, publish into the ROS 2 graph, and measure the rate. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>

<span class="hljs-meta">#<span class="hljs-keyword">define</span> PI 3.14159265358979323846</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> FLAG 0x7E</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> ESC  0x7D</span>

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">int32_t</span> sec; <span class="hljs-type">uint32_t</span> nanosec; <span class="hljs-type">int32_t</span> ticks; <span class="hljs-type">float</span> velocity; } EncoderMsg;

<span class="hljs-type">static</span> <span class="hljs-type">uint16_t</span> <span class="hljs-title function_">crc16</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *d, <span class="hljs-type">size_t</span> n)</span> {           <span class="hljs-comment">/* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF */</span>
    <span class="hljs-type">uint16_t</span> c = <span class="hljs-number">0xFFFF</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) { c ^= (<span class="hljs-type">uint16_t</span>)(d[i] &lt;&lt; <span class="hljs-number">8</span>); <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> b = <span class="hljs-number">0</span>; b &lt; <span class="hljs-number">8</span>; b++) c = (c &amp; <span class="hljs-number">0x8000</span>) ? (<span class="hljs-type">uint16_t</span>)((c &lt;&lt; <span class="hljs-number">1</span>) ^ <span class="hljs-number">0x1021</span>) : (<span class="hljs-type">uint16_t</span>)(c &lt;&lt; <span class="hljs-number">1</span>); }
    <span class="hljs-keyword">return</span> c;
}

<span class="hljs-type">static</span> <span class="hljs-type">size_t</span> <span class="hljs-title function_">cdr_encode</span><span class="hljs-params">(<span class="hljs-type">const</span> EncoderMsg *m, <span class="hljs-type">uint8_t</span> *out)</span> {  <span class="hljs-comment">/* little-endian CDR: header, then 4-byte aligned fields */</span>
    <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> hdr[<span class="hljs-number">4</span>] = {<span class="hljs-number">0x00</span>, <span class="hljs-number">0x01</span>, <span class="hljs-number">0x00</span>, <span class="hljs-number">0x00</span>};
    <span class="hljs-built_in">memcpy</span>(out, hdr, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(out + <span class="hljs-number">4</span>, &amp;m-&gt;sec, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(out + <span class="hljs-number">8</span>, &amp;m-&gt;nanosec, <span class="hljs-number">4</span>);
    <span class="hljs-built_in">memcpy</span>(out + <span class="hljs-number">12</span>, &amp;m-&gt;ticks, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(out + <span class="hljs-number">16</span>, &amp;m-&gt;velocity, <span class="hljs-number">4</span>);   <span class="hljs-comment">/* host is little-endian, like a Cortex-M */</span>
    <span class="hljs-keyword">return</span> <span class="hljs-number">20</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">cdr_decode</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *in, <span class="hljs-type">size_t</span> n, EncoderMsg *m)</span> {
    <span class="hljs-keyword">if</span> (n != <span class="hljs-number">20</span> || in[<span class="hljs-number">1</span>] != <span class="hljs-number">0x01</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
    <span class="hljs-built_in">memcpy</span>(&amp;m-&gt;sec, in + <span class="hljs-number">4</span>, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(&amp;m-&gt;nanosec, in + <span class="hljs-number">8</span>, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(&amp;m-&gt;ticks, in + <span class="hljs-number">12</span>, <span class="hljs-number">4</span>); <span class="hljs-built_in">memcpy</span>(&amp;m-&gt;velocity, in + <span class="hljs-number">16</span>, <span class="hljs-number">4</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
}

<span class="hljs-type">static</span> <span class="hljs-type">size_t</span> <span class="hljs-title function_">frame</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *p, <span class="hljs-type">size_t</span> n, <span class="hljs-type">uint8_t</span> *out)</span> { <span class="hljs-comment">/* FLAG, escaped (payload + CRC), FLAG */</span>
    <span class="hljs-type">uint8_t</span> tmp[<span class="hljs-number">64</span>]; <span class="hljs-built_in">memcpy</span>(tmp, p, n); <span class="hljs-type">uint16_t</span> c = crc16(p, n); tmp[n] = (<span class="hljs-type">uint8_t</span>)(c &gt;&gt; <span class="hljs-number">8</span>); tmp[n + <span class="hljs-number">1</span>] = (<span class="hljs-type">uint8_t</span>)c;
    <span class="hljs-type">size_t</span> k = <span class="hljs-number">0</span>; out[k++] = FLAG;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n + <span class="hljs-number">2</span>; i++) {
        <span class="hljs-keyword">if</span> (tmp[i] == FLAG || tmp[i] == ESC) { out[k++] = ESC; out[k++] = tmp[i] ^ <span class="hljs-number">0x20</span>; } <span class="hljs-keyword">else</span> out[k++] = tmp[i];
    }
    out[k++] = FLAG; <span class="hljs-keyword">return</span> k;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">unframe</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *f, <span class="hljs-type">size_t</span> n, <span class="hljs-type">uint8_t</span> *p, <span class="hljs-type">size_t</span> *pn)</span> {
    <span class="hljs-type">uint8_t</span> tmp[<span class="hljs-number">64</span>]; <span class="hljs-type">size_t</span> k = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">if</span> (n &lt; <span class="hljs-number">4</span> || f[<span class="hljs-number">0</span>] != FLAG || f[n - <span class="hljs-number">1</span>] != FLAG) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">1</span>; i &lt; n - <span class="hljs-number">1</span>; i++) { <span class="hljs-keyword">if</span> (f[i] == ESC) { <span class="hljs-keyword">if</span> (++i &gt;= n - <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; tmp[k++] = f[i] ^ <span class="hljs-number">0x20</span>; } <span class="hljs-keyword">else</span> tmp[k++] = f[i]; <span class="hljs-keyword">if</span> (k &gt;= <span class="hljs-keyword">sizeof</span> tmp) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; }
    <span class="hljs-keyword">if</span> (k &lt; <span class="hljs-number">2</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
    <span class="hljs-type">uint16_t</span> c = (<span class="hljs-type">uint16_t</span>)(tmp[k - <span class="hljs-number">2</span>] &lt;&lt; <span class="hljs-number">8</span> | tmp[k - <span class="hljs-number">1</span>]);
    <span class="hljs-keyword">if</span> (crc16(tmp, k - <span class="hljs-number">2</span>) != c) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;                       <span class="hljs-comment">/* corrupted on the wire: drop it */</span>
    <span class="hljs-built_in">memcpy</span>(p, tmp, k - <span class="hljs-number">2</span>); *pn = k - <span class="hljs-number">2</span>; <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
}

<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> lcg = <span class="hljs-number">12345</span>;
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">rnd</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { lcg = lcg * <span class="hljs-number">1664525u</span> + <span class="hljs-number">1013904223u</span>; <span class="hljs-keyword">return</span> lcg &gt;&gt; <span class="hljs-number">8</span>; }

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
    <span class="hljs-type">int</span> ok = <span class="hljs-number">1</span>;
    <span class="hljs-type">uint16_t</span> check = crc16((<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *)<span class="hljs-string">&quot;123456789&quot;</span>, <span class="hljs-number">9</span>);
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;CRC-16/CCITT-FALSE of \\&quot;123456789\\&quot; = 0x%04X (standard check value 0x29B1)\\n&quot;</span>, check);
    <span class="hljs-keyword">if</span> (check != <span class="hljs-number">0x29B1</span>) ok = <span class="hljs-number">0</span>;

    <span class="hljs-type">const</span> <span class="hljs-type">double</span> rate = <span class="hljs-number">100.0</span>, seconds = <span class="hljs-number">10.0</span>, cpr = <span class="hljs-number">2048.0</span>;  <span class="hljs-comment">/* 100 Hz timer, 2048 counts per revolution */</span>
    <span class="hljs-type">int</span> sent = <span class="hljs-number">0</span>, good = <span class="hljs-number">0</span>, bad_crc = <span class="hljs-number">0</span>; <span class="hljs-type">int32_t</span> last_ticks = <span class="hljs-number">0</span>; <span class="hljs-type">double</span> <span class="hljs-type">first_t</span> = <span class="hljs-number">-1</span>, <span class="hljs-type">last_t</span> = <span class="hljs-number">0</span>; <span class="hljs-type">int</span> max_frame = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; (<span class="hljs-type">int</span>)(rate * seconds); k++) {
        <span class="hljs-type">double</span> t = k / rate, w = <span class="hljs-number">2.0</span> * <span class="hljs-built_in">sin</span>(<span class="hljs-number">0.5</span> * t);              <span class="hljs-comment">/* the wheel speeds up and slows down, rad/s */</span>
        <span class="hljs-type">static</span> <span class="hljs-type">double</span> angle = <span class="hljs-number">0</span>; angle += w / rate;
        EncoderMsg m = {(<span class="hljs-type">int32_t</span>)t, (<span class="hljs-type">uint32_t</span>)((t - <span class="hljs-built_in">floor</span>(t)) * <span class="hljs-number">1e9</span> + <span class="hljs-number">0.5</span>), (<span class="hljs-type">int32_t</span>)lround(angle / (<span class="hljs-number">2</span> * PI) * cpr), (<span class="hljs-type">float</span>)w};
        <span class="hljs-type">uint8_t</span> payload[<span class="hljs-number">32</span>], wire[<span class="hljs-number">96</span>]; <span class="hljs-type">size_t</span> pn = cdr_encode(&amp;m, payload), fn = frame(payload, pn, wire);
        <span class="hljs-keyword">if</span> ((<span class="hljs-type">int</span>)fn &gt; max_frame) max_frame = (<span class="hljs-type">int</span>)fn;
        sent++;
        <span class="hljs-keyword">if</span> (rnd() % <span class="hljs-number">100</span> &lt; <span class="hljs-number">2</span>) wire[<span class="hljs-number">1</span> + rnd() % (fn - <span class="hljs-number">2</span>)] ^= (<span class="hljs-type">uint8_t</span>)(<span class="hljs-number">1u</span> &lt;&lt; (rnd() % <span class="hljs-number">8</span>));   <span class="hljs-comment">/* 2 % of frames get a bit flip */</span>
        <span class="hljs-type">uint8_t</span> rx[<span class="hljs-number">64</span>]; <span class="hljs-type">size_t</span> rn; EncoderMsg r;                   <span class="hljs-comment">/* ---- the agent ---- */</span>
        <span class="hljs-keyword">if</span> (!unframe(wire, fn, rx, &amp;rn) || !cdr_decode(rx, rn, &amp;r)) { bad_crc++; <span class="hljs-keyword">continue</span>; }
        <span class="hljs-type">double</span> tr = r.sec + r.nanosec * <span class="hljs-number">1e-9</span>;
        <span class="hljs-keyword">if</span> (<span class="hljs-type">first_t</span> &lt; <span class="hljs-number">0</span>) <span class="hljs-type">first_t</span> = tr;
        <span class="hljs-type">last_t</span> = tr; last_ticks = r.ticks; good++;
        <span class="hljs-keyword">if</span> (r.ticks != m.ticks || fabsf(r.velocity - m.velocity) &gt; <span class="hljs-number">0</span>) ok = <span class="hljs-number">0</span>;   <span class="hljs-comment">/* what arrives is exactly what was sent */</span>
    }
    <span class="hljs-type">double</span> measured = good / (<span class="hljs-type">last_t</span> - <span class="hljs-type">first_t</span> + <span class="hljs-number">1.0</span> / rate);   <span class="hljs-comment">/* published samples per second of sensor time */</span>
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;in the ROS 2 graph the agent then shows: node /encoder_node, publisher /encoder [my_robot_interfaces/msg/EncoderStamped]\\n&quot;</span>);
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;sent %d frames (up to %d bytes each), %d rejected by CRC, %d published; rate %.1f Hz; last ticks %d\\n&quot;</span>,
           sent, max_frame, bad_crc, good, measured, last_ticks);
    <span class="hljs-keyword">if</span> (bad_crc &lt; <span class="hljs-number">5</span> || bad_crc &gt; <span class="hljs-number">40</span> || <span class="hljs-built_in">fabs</span>(measured - <span class="hljs-number">98.0</span>) &gt; <span class="hljs-number">1.5</span>) ok = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">if</span> (sent * max_frame * <span class="hljs-number">10</span> &gt; <span class="hljs-number">115200</span> * (<span class="hljs-type">int</span>)seconds) ok = <span class="hljs-number">0</span>;  <span class="hljs-comment">/* fits a 115200 baud UART (10 bits per byte) */</span>
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;link load at 115200 baud: %.1f %%\\n&quot;</span>, <span class="hljs-number">100.0</span> * sent * max_frame * <span class="hljs-number">10</span> / (<span class="hljs-number">115200.0</span> * seconds));
    <span class="hljs-built_in">puts</span>(ok ? <span class="hljs-string">&quot;PASS&quot;</span> : <span class="hljs-string">&quot;FAIL&quot;</span>);
    <span class="hljs-keyword">return</span> ok ? <span class="hljs-number">0</span> : <span class="hljs-number">1</span>;
}</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>On the MCU, <code>rclc_support_init</code>, <code>rclc_node_init_default</code>, <code>rclc_publisher_init_best_effort</code> and an <code>rclc_executor</code> with a timer publish the message; on the computer, <code>ros2 run micro_ros_agent micro_ros_agent serial --dev /dev/ttyACM0 -b 115200</code> starts the agent. Then <code>ros2 node list</code> shows the MCU node and <code>ros2 topic hz /encoder</code> checks its rate. micro-ROS supports boards such as ESP32, STM32, Raspberry Pi Pico and Teensy, with static memory configured at build time.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>The encoder must publish at 1 kHz with 26-byte frames. Is 115200 baud enough?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>1000 × 26 × 10 = 260 000 bit/s, more than twice the link capacity. Use a faster UART (for example 921600 baud), USB CDC, or send batches of samples per message.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the agent see fewer frames than were sent, and what would you change for data that must not be lost?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Frames with bit errors fail the CRC and are dropped on a best-effort stream. For important data (configuration, commands) use a reliable XRCE stream, which acknowledges and retransmits; keep high-rate sensor data best effort.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l16"></div>
`,i=[{id:`why-micro-ros`,title:`Why micro-ROS`},{id:`what-crosses-the-wire`,title:`What crosses the wire`},{id:`budget-the-link`,title:`Budget the link`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l16-q1`,type:`num`,q:`<p>Bytes per second a 115200 baud UART carries with 10 bits per byte?</p>
`,explain:`<p>Start and stop bits included.</p>
`,answer:11520,tol:.001,unit:``},{id:`p18-l16-q2`,type:`num`,q:`<p>Link load for 200 Hz frames of 30 bytes at 115200 baud (percent)?</p>
`,explain:`<p>Bits sent over bits available.</p>
`,answer:52.08,tol:.002,unit:``},{id:`p18-l16-q3`,type:`num`,q:`<p>Expected published rate at 100 Hz with 5 % of frames corrupted?</p>
`,explain:`<p>Corrupted frames are dropped.</p>
`,answer:95,tol:.002,unit:`Hz`},{id:`p18-l16-q4`,type:`num`,q:`<p>Escaped value sent for a data byte 0x7E (decimal)?</p>
`,explain:`<p>0x5E after the escape byte 0x7D.</p>
`,answer:94,tol:.001,unit:``},{id:`p18-l16-q5`,type:`mc`,q:`<p>The micro-ROS agent…</p>
`,explain:`<p>The MCU speaks DDS-XRCE to the agent.</p>
`,options:[`replaces the RTOS scheduler`,`creates DDS entities on behalf of the MCU client`,`compiles the firmware`,`runs on the microcontroller`],answer:1},{id:`p18-l16-q6`,type:`mc`,q:`<p>A frame whose CRC does not match is…</p>
`,explain:`<p>A CRC detects errors; it does not correct them.</p>
`,options:[`dropped, or retransmitted on a reliable stream`,`corrected automatically by the CRC`,`published with a warning`,`sent back to the MCU unchanged`],answer:0}],o=[{file:`microros_link.c`,lang:`c`,src:`/* microros_link.c: what a micro-ROS encoder node and its agent exchange, simulated on the host.
   MCU side: sample the encoder on a 100 Hz timer, serialize to CDR, frame for a serial link with a CRC.
   Agent side: unframe, check the CRC, deserialize, publish into the ROS 2 graph, and measure the rate. */
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#define PI 3.14159265358979323846
#define FLAG 0x7E
#define ESC  0x7D

typedef struct { int32_t sec; uint32_t nanosec; int32_t ticks; float velocity; } EncoderMsg;

static uint16_t crc16(const uint8_t *d, size_t n) {           /* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF */
    uint16_t c = 0xFFFF;
    for (size_t i = 0; i < n; i++) { c ^= (uint16_t)(d[i] << 8); for (int b = 0; b < 8; b++) c = (c & 0x8000) ? (uint16_t)((c << 1) ^ 0x1021) : (uint16_t)(c << 1); }
    return c;
}

static size_t cdr_encode(const EncoderMsg *m, uint8_t *out) {  /* little-endian CDR: header, then 4-byte aligned fields */
    const uint8_t hdr[4] = {0x00, 0x01, 0x00, 0x00};
    memcpy(out, hdr, 4); memcpy(out + 4, &m->sec, 4); memcpy(out + 8, &m->nanosec, 4);
    memcpy(out + 12, &m->ticks, 4); memcpy(out + 16, &m->velocity, 4);   /* host is little-endian, like a Cortex-M */
    return 20;
}
static int cdr_decode(const uint8_t *in, size_t n, EncoderMsg *m) {
    if (n != 20 || in[1] != 0x01) return 0;
    memcpy(&m->sec, in + 4, 4); memcpy(&m->nanosec, in + 8, 4); memcpy(&m->ticks, in + 12, 4); memcpy(&m->velocity, in + 16, 4);
    return 1;
}

static size_t frame(const uint8_t *p, size_t n, uint8_t *out) { /* FLAG, escaped (payload + CRC), FLAG */
    uint8_t tmp[64]; memcpy(tmp, p, n); uint16_t c = crc16(p, n); tmp[n] = (uint8_t)(c >> 8); tmp[n + 1] = (uint8_t)c;
    size_t k = 0; out[k++] = FLAG;
    for (size_t i = 0; i < n + 2; i++) {
        if (tmp[i] == FLAG || tmp[i] == ESC) { out[k++] = ESC; out[k++] = tmp[i] ^ 0x20; } else out[k++] = tmp[i];
    }
    out[k++] = FLAG; return k;
}
static int unframe(const uint8_t *f, size_t n, uint8_t *p, size_t *pn) {
    uint8_t tmp[64]; size_t k = 0;
    if (n < 4 || f[0] != FLAG || f[n - 1] != FLAG) return 0;
    for (size_t i = 1; i < n - 1; i++) { if (f[i] == ESC) { if (++i >= n - 1) return 0; tmp[k++] = f[i] ^ 0x20; } else tmp[k++] = f[i]; if (k >= sizeof tmp) return 0; }
    if (k < 2) return 0;
    uint16_t c = (uint16_t)(tmp[k - 2] << 8 | tmp[k - 1]);
    if (crc16(tmp, k - 2) != c) return 0;                       /* corrupted on the wire: drop it */
    memcpy(p, tmp, k - 2); *pn = k - 2; return 1;
}

static uint32_t lcg = 12345;
static uint32_t rnd(void) { lcg = lcg * 1664525u + 1013904223u; return lcg >> 8; }

int main(void) {
    int ok = 1;
    uint16_t check = crc16((const uint8_t *)"123456789", 9);
    printf("CRC-16/CCITT-FALSE of \\"123456789\\" = 0x%04X (standard check value 0x29B1)\\n", check);
    if (check != 0x29B1) ok = 0;

    const double rate = 100.0, seconds = 10.0, cpr = 2048.0;  /* 100 Hz timer, 2048 counts per revolution */
    int sent = 0, good = 0, bad_crc = 0; int32_t last_ticks = 0; double first_t = -1, last_t = 0; int max_frame = 0;
    for (int k = 0; k < (int)(rate * seconds); k++) {
        double t = k / rate, w = 2.0 * sin(0.5 * t);              /* the wheel speeds up and slows down, rad/s */
        static double angle = 0; angle += w / rate;
        EncoderMsg m = {(int32_t)t, (uint32_t)((t - floor(t)) * 1e9 + 0.5), (int32_t)lround(angle / (2 * PI) * cpr), (float)w};
        uint8_t payload[32], wire[96]; size_t pn = cdr_encode(&m, payload), fn = frame(payload, pn, wire);
        if ((int)fn > max_frame) max_frame = (int)fn;
        sent++;
        if (rnd() % 100 < 2) wire[1 + rnd() % (fn - 2)] ^= (uint8_t)(1u << (rnd() % 8));   /* 2 % of frames get a bit flip */
        uint8_t rx[64]; size_t rn; EncoderMsg r;                   /* ---- the agent ---- */
        if (!unframe(wire, fn, rx, &rn) || !cdr_decode(rx, rn, &r)) { bad_crc++; continue; }
        double tr = r.sec + r.nanosec * 1e-9;
        if (first_t < 0) first_t = tr;
        last_t = tr; last_ticks = r.ticks; good++;
        if (r.ticks != m.ticks || fabsf(r.velocity - m.velocity) > 0) ok = 0;   /* what arrives is exactly what was sent */
    }
    double measured = good / (last_t - first_t + 1.0 / rate);   /* published samples per second of sensor time */
    printf("in the ROS 2 graph the agent then shows: node /encoder_node, publisher /encoder [my_robot_interfaces/msg/EncoderStamped]\\n");
    printf("sent %d frames (up to %d bytes each), %d rejected by CRC, %d published; rate %.1f Hz; last ticks %d\\n",
           sent, max_frame, bad_crc, good, measured, last_ticks);
    if (bad_crc < 5 || bad_crc > 40 || fabs(measured - 98.0) > 1.5) ok = 0;
    if (sent * max_frame * 10 > 115200 * (int)seconds) ok = 0;  /* fits a 115200 baud UART (10 bits per byte) */
    printf("link load at 115200 baud: %.1f %%\\n", 100.0 * sent * max_frame * 10 / (115200.0 * seconds));
    puts(ok ? "PASS" : "FAIL");
    return ok ? 0 : 1;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};