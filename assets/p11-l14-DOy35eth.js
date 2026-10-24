var e=`p11-l14`,t=40,n=`Wireless telemetry trades wires for latency that varies, packets that get lost and bandwidth shared with everyone nearby, and MQTT is the small publish and subscribe protocol most robots and sensors use to push readings to a broker. You derive throughput, latency and the cost of retransmission, write MQTT packet encoding, a tiny broker with topic wildcards and a QoS 1 publisher, and test on a simulated lossy link, with no network needed, that 95th-percentile latency stays under target.`,r=`<h2 id="wireless-links-in-numbers">Wireless links in numbers</h2>
<ul>
<li><strong>BLE</strong> sends data in connection events every <em>connection interval</em> (7.5 ms to 4 s, negotiated). Latency is up to one interval plus retries; throughput is a few hundred kbit/s at best. Good for a battery-powered sensor at tens of Hz.</li>
<li><strong>Wi-Fi</strong> gives Mbit/s and a few ms of typical latency on a quiet network, but the medium is shared: contention, retries and power-save can produce tails of 100 ms or more.</li>
<li>Neither is a control-loop bus. Telemetry tolerates late or missing samples; a position loop doesn’t.</li>
</ul>
<p>For a sample to arrive, the one-way latency is serialisation + propagation + queuing + any retransmissions. If a packet is lost with probability <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span></span></span></span> and resent after a timeout <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0077em;">R</span><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">O</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, the number of resends is geometric, and the chance a message needs more than <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> tries is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0435em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">p</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span></span></span></span></span></span></span>. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8056em;vertical-align:-0.0556em;"></span><span class="mord">2%</span></span></span></span>, 2 % of messages arrive at least <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0077em;">R</span><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">O</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> late: the <strong>tail</strong> of the latency distribution is set by loss and timeout, not by the median.</p>
<h2 id="mqtt">MQTT</h2>
<p>MQTT runs over TCP to a <strong>broker</strong>. Clients <strong>publish</strong> messages to a <em>topic</em> string such as <code>robot/1/telemetry</code>, and <strong>subscribe</strong> to topic filters with wildcards: <code>+</code> matches one level (<code>robot/+/telemetry</code>), <code>#</code> matches everything below (<code>robot/#</code>, which also matches <code>robot</code>). Publishers and subscribers never know about each other.</p>
<p>Each packet starts with a fixed header: one byte of type and flags, then the <em>remaining length</em> as a variable-length integer, 7 bits per byte with the top bit meaning “more bytes follow” (0–127 in one byte, up to 268 435 455 in four). A PUBLISH carries a 2-byte topic length, the topic, a 2-byte packet id for QoS 1, and the payload.</p>
<p>Quality of service:</p>
<ul>
<li><strong>QoS 0</strong>, at most once: fire and forget. Lost packets stay lost.</li>
<li><strong>QoS 1</strong>, at least once: the receiver answers PUBACK with the packet id; the sender resends with the DUP flag set until it gets one. Duplicates are possible when the PUBACK is lost, so include a sequence number and drop repeats.</li>
<li><strong>QoS 2</strong>, exactly once, costs a four-way handshake; rarely worth it for telemetry.</li>
</ul>
<p>(Over real TCP, the transport itself retransmits; the simulation below models the combined effect as loss plus a resend timeout.)</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="telemetry" data-args="{}"></div></div><figcaption>A live telemetry dashboard fed through a simulated lossy link: the signal, the latency of each sample and the 95th percentile against the target. Raise the packet loss and the resend timeout to watch the tail grow; switch between QoS 0 and QoS 1.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A robot publishes 16-byte binary samples at 50 Hz to <code>robot/1/telemetry</code> at QoS 1.</p>
<ol>
<li>PUBLISH size: 1 + 1 (remaining length 37) + 2 + 17 + 2 + 16 = 39 bytes; with about 54 bytes of TCP/IP/Ethernet headers, 93 bytes per sample, 4.65 kB/s. Negligible on Wi-Fi.</li>
<li>The link has 8 ms base latency, exponential jitter with a 4 ms mean, and 2 % loss in each direction; the resend timeout is 100 ms.</li>
<li>95th percentile without loss: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">8</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">20</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20.0</span></span></span></span> ms. With 2 % loss, about 2 % of samples take more than 108 ms, which sits above the 95th percentile but sets the 99th.</li>
<li>Target: 95 % of samples within 30 ms. Met, at both QoS 0 and QoS 1; QoS 1 also delivers every sample.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">mqtt_telemetry.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq, math, random, struct

<span class="hljs-comment"># ---------- MQTT 3.1.1 encoding ----------</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">enc_varint</span>(<span class="hljs-params">n</span>):
    out = <span class="hljs-built_in">bytearray</span>()
    <span class="hljs-keyword">while</span> <span class="hljs-literal">True</span>:
        b, n = n % <span class="hljs-number">128</span>, n // <span class="hljs-number">128</span>
        out.append(b | (<span class="hljs-number">0x80</span> <span class="hljs-keyword">if</span> n <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>))
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> n:
            <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>(out)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">dec_varint</span>(<span class="hljs-params">buf, i=<span class="hljs-number">0</span></span>):
    mult, val = <span class="hljs-number">1</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
        b = buf[i + k]
        val += (b &amp; <span class="hljs-number">0x7F</span>) * mult
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> b &amp; <span class="hljs-number">0x80</span>:
            <span class="hljs-keyword">return</span> val, i + k + <span class="hljs-number">1</span>
        mult *= <span class="hljs-number">128</span>
    <span class="hljs-keyword">raise</span> ValueError(<span class="hljs-string">&quot;malformed remaining length&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">publish</span>(<span class="hljs-params">topic, payload, qos=<span class="hljs-number">0</span>, pid=<span class="hljs-number">0</span>, dup=<span class="hljs-literal">False</span></span>):
    t = topic.encode()
    var = struct.pack(<span class="hljs-string">&quot;&gt;H&quot;</span>, <span class="hljs-built_in">len</span>(t)) + t + (struct.pack(<span class="hljs-string">&quot;&gt;H&quot;</span>, pid) <span class="hljs-keyword">if</span> qos <span class="hljs-keyword">else</span> <span class="hljs-string">b&quot;&quot;</span>)
    body = var + payload
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x30</span> | (dup &lt;&lt; <span class="hljs-number">3</span>) | (qos &lt;&lt; <span class="hljs-number">1</span>)]) + enc_varint(<span class="hljs-built_in">len</span>(body)) + body

<span class="hljs-keyword">def</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params">pkt</span>):
    ptype, flags = pkt[<span class="hljs-number">0</span>] &gt;&gt; <span class="hljs-number">4</span>, pkt[<span class="hljs-number">0</span>] &amp; <span class="hljs-number">0x0F</span>
    length, i = dec_varint(pkt, <span class="hljs-number">1</span>)
    body = pkt[i:i + length]
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(body) == length
    <span class="hljs-keyword">if</span> ptype == <span class="hljs-number">3</span>:
        qos = (flags &gt;&gt; <span class="hljs-number">1</span>) &amp; <span class="hljs-number">3</span>
        tl = struct.unpack(<span class="hljs-string">&quot;&gt;H&quot;</span>, body[:<span class="hljs-number">2</span>])[<span class="hljs-number">0</span>]
        topic = body[<span class="hljs-number">2</span>:<span class="hljs-number">2</span> + tl].decode()
        j = <span class="hljs-number">2</span> + tl
        pid = struct.unpack(<span class="hljs-string">&quot;&gt;H&quot;</span>, body[j:j + <span class="hljs-number">2</span>])[<span class="hljs-number">0</span>] <span class="hljs-keyword">if</span> qos <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>
        <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;type&quot;</span>: <span class="hljs-string">&quot;PUBLISH&quot;</span>, <span class="hljs-string">&quot;topic&quot;</span>: topic, <span class="hljs-string">&quot;qos&quot;</span>: qos, <span class="hljs-string">&quot;pid&quot;</span>: pid, <span class="hljs-string">&quot;dup&quot;</span>: <span class="hljs-built_in">bool</span>(flags &amp; <span class="hljs-number">8</span>), <span class="hljs-string">&quot;payload&quot;</span>: body[j + (<span class="hljs-number">2</span> <span class="hljs-keyword">if</span> qos <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>):]}
    <span class="hljs-keyword">if</span> ptype == <span class="hljs-number">4</span>:
        <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;type&quot;</span>: <span class="hljs-string">&quot;PUBACK&quot;</span>, <span class="hljs-string">&quot;pid&quot;</span>: struct.unpack(<span class="hljs-string">&quot;&gt;H&quot;</span>, body)[<span class="hljs-number">0</span>]}
    <span class="hljs-keyword">raise</span> ValueError(ptype)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">puback</span>(<span class="hljs-params">pid</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">bytes</span>([<span class="hljs-number">0x40</span>, <span class="hljs-number">2</span>]) + struct.pack(<span class="hljs-string">&quot;&gt;H&quot;</span>, pid)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">topic_matches</span>(<span class="hljs-params">filt, topic</span>):
    f, t = filt.split(<span class="hljs-string">&quot;/&quot;</span>), topic.split(<span class="hljs-string">&quot;/&quot;</span>)
    <span class="hljs-keyword">for</span> i, part <span class="hljs-keyword">in</span> <span class="hljs-built_in">enumerate</span>(f):
        <span class="hljs-keyword">if</span> part == <span class="hljs-string">&quot;#&quot;</span>:
            <span class="hljs-keyword">return</span> <span class="hljs-literal">True</span>
        <span class="hljs-keyword">if</span> i &gt;= <span class="hljs-built_in">len</span>(t) <span class="hljs-keyword">or</span> (part != <span class="hljs-string">&quot;+&quot;</span> <span class="hljs-keyword">and</span> part != t[i]):
            <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">len</span>(f) == <span class="hljs-built_in">len</span>(t)

<span class="hljs-comment"># ---------- a simulated link, broker and clients ----------</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Sim</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.t, <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.n = <span class="hljs-number">0.0</span>, [], <span class="hljs-number">0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">at</span>(<span class="hljs-params">self, t, fn, *args</span>):
        <span class="hljs-variable language_">self</span>.n += <span class="hljs-number">1</span>
        heapq.heappush(<span class="hljs-variable language_">self</span>.q, (t, <span class="hljs-variable language_">self</span>.n, fn, args))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">self, until</span>):
        <span class="hljs-keyword">while</span> <span class="hljs-variable language_">self</span>.q <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.q[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] &lt;= until:
            <span class="hljs-variable language_">self</span>.t, _, fn, args = heapq.heappop(<span class="hljs-variable language_">self</span>.q)
            fn(*args)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Link</span>:
    <span class="hljs-string">&quot;&quot;&quot;one direction: base latency + exponential jitter, independent loss&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, sim, rng, base=<span class="hljs-number">0.008</span>, jitter=<span class="hljs-number">0.004</span>, loss=<span class="hljs-number">0.02</span></span>):
        <span class="hljs-variable language_">self</span>.sim, <span class="hljs-variable language_">self</span>.rng, <span class="hljs-variable language_">self</span>.base, <span class="hljs-variable language_">self</span>.jitter, <span class="hljs-variable language_">self</span>.loss = sim, rng, base, jitter, loss
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">self, pkt, deliver</span>):
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.rng.random() &lt; <span class="hljs-variable language_">self</span>.loss:
            <span class="hljs-keyword">return</span>
        <span class="hljs-variable language_">self</span>.sim.at(<span class="hljs-variable language_">self</span>.sim.t + <span class="hljs-variable language_">self</span>.base + <span class="hljs-variable language_">self</span>.rng.expovariate(<span class="hljs-number">1</span> / <span class="hljs-variable language_">self</span>.jitter) <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.jitter <span class="hljs-keyword">else</span> <span class="hljs-variable language_">self</span>.sim.t + <span class="hljs-variable language_">self</span>.base, deliver, pkt)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Broker</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, sim</span>):
        <span class="hljs-variable language_">self</span>.sim, <span class="hljs-variable language_">self</span>.subs = sim, []
        <span class="hljs-variable language_">self</span>.to_client = <span class="hljs-literal">None</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">self, filt, deliver</span>):
        <span class="hljs-variable language_">self</span>.subs.append((filt, deliver))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_packet</span>(<span class="hljs-params">self, pkt</span>):
        p = parse(pkt)
        <span class="hljs-keyword">if</span> p[<span class="hljs-string">&quot;type&quot;</span>] == <span class="hljs-string">&quot;PUBLISH&quot;</span>:
            <span class="hljs-keyword">if</span> p[<span class="hljs-string">&quot;qos&quot;</span>] == <span class="hljs-number">1</span>:
                <span class="hljs-variable language_">self</span>.to_client.send(puback(p[<span class="hljs-string">&quot;pid&quot;</span>]), <span class="hljs-variable language_">self</span>.publisher_rx)
            <span class="hljs-keyword">for</span> filt, deliver <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.subs:
                <span class="hljs-keyword">if</span> topic_matches(filt, p[<span class="hljs-string">&quot;topic&quot;</span>]):
                    deliver(p)                            <span class="hljs-comment"># dashboard on the broker&#x27;s LAN: no extra loss</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Publisher</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, sim, link, qos, rto=<span class="hljs-number">0.1</span></span>):
        <span class="hljs-variable language_">self</span>.sim, <span class="hljs-variable language_">self</span>.link, <span class="hljs-variable language_">self</span>.qos, <span class="hljs-variable language_">self</span>.rto = sim, link, qos, rto
        <span class="hljs-variable language_">self</span>.pid, <span class="hljs-variable language_">self</span>.inflight, <span class="hljs-variable language_">self</span>.sent, <span class="hljs-variable language_">self</span>.resends = <span class="hljs-number">0</span>, {}, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">publish_sample</span>(<span class="hljs-params">self, seq, value</span>):
        payload = struct.pack(<span class="hljs-string">&quot;&gt;Idf4x&quot;</span>, seq, <span class="hljs-variable language_">self</span>.sim.t, value)      <span class="hljs-comment"># 16 bytes: sequence, timestamp, value</span>
        <span class="hljs-variable language_">self</span>.sent += <span class="hljs-number">1</span>
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.qos == <span class="hljs-number">0</span>:
            <span class="hljs-variable language_">self</span>.link.send(publish(<span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, payload), <span class="hljs-variable language_">self</span>.broker.on_packet)
            <span class="hljs-keyword">return</span>
        <span class="hljs-variable language_">self</span>.pid = <span class="hljs-variable language_">self</span>.pid % <span class="hljs-number">65535</span> + <span class="hljs-number">1</span>
        pid = <span class="hljs-variable language_">self</span>.pid
        <span class="hljs-variable language_">self</span>.inflight[pid] = payload
        <span class="hljs-variable language_">self</span>._send(pid, dup=<span class="hljs-literal">False</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_send</span>(<span class="hljs-params">self, pid, dup</span>):
        <span class="hljs-keyword">if</span> pid <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.inflight:
            <span class="hljs-keyword">return</span>
        <span class="hljs-variable language_">self</span>.link.send(publish(<span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, <span class="hljs-variable language_">self</span>.inflight[pid], <span class="hljs-number">1</span>, pid, dup), <span class="hljs-variable language_">self</span>.broker.on_packet)
        <span class="hljs-variable language_">self</span>.sim.at(<span class="hljs-variable language_">self</span>.sim.t + <span class="hljs-variable language_">self</span>.rto, <span class="hljs-variable language_">self</span>._timeout, pid)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_timeout</span>(<span class="hljs-params">self, pid</span>):
        <span class="hljs-keyword">if</span> pid <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.inflight:
            <span class="hljs-variable language_">self</span>.resends += <span class="hljs-number">1</span>
            <span class="hljs-variable language_">self</span>._send(pid, dup=<span class="hljs-literal">True</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_ack</span>(<span class="hljs-params">self, pkt</span>):
        <span class="hljs-variable language_">self</span>.inflight.pop(parse(pkt)[<span class="hljs-string">&quot;pid&quot;</span>], <span class="hljs-literal">None</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Dashboard</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, sim</span>):
        <span class="hljs-variable language_">self</span>.sim, <span class="hljs-variable language_">self</span>.lat, <span class="hljs-variable language_">self</span>.seen, <span class="hljs-variable language_">self</span>.dups, <span class="hljs-variable language_">self</span>.values = sim, {}, <span class="hljs-built_in">set</span>(), <span class="hljs-number">0</span>, {}
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_publish</span>(<span class="hljs-params">self, p</span>):
        seq, t_sent, value = struct.unpack(<span class="hljs-string">&quot;&gt;Idf4x&quot;</span>, p[<span class="hljs-string">&quot;payload&quot;</span>])
        <span class="hljs-keyword">if</span> seq <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.seen:
            <span class="hljs-variable language_">self</span>.dups += <span class="hljs-number">1</span>                                 <span class="hljs-comment"># at-least-once: drop repeats by sequence number</span>
            <span class="hljs-keyword">return</span>
        <span class="hljs-variable language_">self</span>.seen.add(seq)
        <span class="hljs-variable language_">self</span>.lat[seq] = <span class="hljs-variable language_">self</span>.sim.t - t_sent
        <span class="hljs-variable language_">self</span>.values[seq] = value

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">qos, seconds=<span class="hljs-number">60.0</span>, rate=<span class="hljs-number">50.0</span>, loss=<span class="hljs-number">0.02</span>, seed=<span class="hljs-number">3</span></span>):
    rng = random.Random(seed)
    sim = Sim()
    up, down = Link(sim, rng, loss=loss), Link(sim, rng, loss=loss)
    broker, pub, dash = Broker(sim), Publisher(sim, up, qos), Dashboard(sim)
    broker.to_client, pub.broker = down, broker
    broker.publisher_rx = pub.on_ack
    broker.subscribe(<span class="hljs-string">&quot;robot/+/telemetry&quot;</span>, dash.on_publish)
    n = <span class="hljs-built_in">int</span>(seconds * rate)
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        value = <span class="hljs-number">40</span> + <span class="hljs-number">5</span> * math.sin(<span class="hljs-number">2</span> * math.pi * <span class="hljs-number">0.05</span> * k / rate)               <span class="hljs-comment"># a slowly varying temperature</span>
        sim.at(k / rate, pub.publish_sample, k, value)
    sim.run(seconds + <span class="hljs-number">5</span>)
    <span class="hljs-keyword">return</span> pub, dash, n

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pct</span>(<span class="hljs-params">xs, p</span>):
    s = <span class="hljs-built_in">sorted</span>(xs)
    <span class="hljs-keyword">return</span> s[<span class="hljs-built_in">min</span>(<span class="hljs-built_in">len</span>(s) - <span class="hljs-number">1</span>, <span class="hljs-built_in">int</span>(p / <span class="hljs-number">100</span> * <span class="hljs-built_in">len</span>(s)))]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">ascii_plot</span>(<span class="hljs-params">values, width=<span class="hljs-number">60</span>, height=<span class="hljs-number">6</span></span>):
    xs = [values[k] <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">sorted</span>(values)][::<span class="hljs-built_in">max</span>(<span class="hljs-number">1</span>, <span class="hljs-built_in">len</span>(values) // width)][:width]
    lo, hi = <span class="hljs-built_in">min</span>(xs), <span class="hljs-built_in">max</span>(xs)
    rows = []
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(height - <span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>):
        rows.append(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-string">&quot;*&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-built_in">int</span>((x - lo) / (hi - lo + <span class="hljs-number">1e-9</span>) * (height - <span class="hljs-number">1</span>) + <span class="hljs-number">0.5</span>) == r <span class="hljs-keyword">else</span> <span class="hljs-string">&quot; &quot;</span> <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> xs))
    <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;\\n&quot;</span>.join(rows)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_encoding</span>():
    <span class="hljs-keyword">for</span> n, hexs <span class="hljs-keyword">in</span> ((<span class="hljs-number">0</span>, <span class="hljs-string">&quot;00&quot;</span>), (<span class="hljs-number">127</span>, <span class="hljs-string">&quot;7f&quot;</span>), (<span class="hljs-number">128</span>, <span class="hljs-string">&quot;8001&quot;</span>), (<span class="hljs-number">16383</span>, <span class="hljs-string">&quot;ff7f&quot;</span>), (<span class="hljs-number">16384</span>, <span class="hljs-string">&quot;808001&quot;</span>), (<span class="hljs-number">268435455</span>, <span class="hljs-string">&quot;ffffff7f&quot;</span>)):
        <span class="hljs-keyword">assert</span> enc_varint(n).<span class="hljs-built_in">hex</span>() == hexs <span class="hljs-keyword">and</span> dec_varint(enc_varint(n))[<span class="hljs-number">0</span>] == n
    pkt = publish(<span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, <span class="hljs-built_in">bytes</span>(<span class="hljs-number">16</span>), qos=<span class="hljs-number">1</span>, pid=<span class="hljs-number">7</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(pkt) == <span class="hljs-number">39</span> <span class="hljs-keyword">and</span> pkt[<span class="hljs-number">0</span>] == <span class="hljs-number">0x32</span> <span class="hljs-keyword">and</span> pkt[<span class="hljs-number">1</span>] == <span class="hljs-number">37</span>
    p = parse(pkt)
    <span class="hljs-keyword">assert</span> (p[<span class="hljs-string">&quot;topic&quot;</span>], p[<span class="hljs-string">&quot;qos&quot;</span>], p[<span class="hljs-string">&quot;pid&quot;</span>], <span class="hljs-built_in">len</span>(p[<span class="hljs-string">&quot;payload&quot;</span>])) == (<span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, <span class="hljs-number">1</span>, <span class="hljs-number">7</span>, <span class="hljs-number">16</span>)
    <span class="hljs-keyword">assert</span> parse(publish(<span class="hljs-string">&quot;a/b&quot;</span>, <span class="hljs-string">b&quot;x&quot;</span>, <span class="hljs-number">1</span>, <span class="hljs-number">9</span>, dup=<span class="hljs-literal">True</span>))[<span class="hljs-string">&quot;dup&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">True</span>
    <span class="hljs-keyword">assert</span> parse(puback(<span class="hljs-number">7</span>)) == {<span class="hljs-string">&quot;type&quot;</span>: <span class="hljs-string">&quot;PUBACK&quot;</span>, <span class="hljs-string">&quot;pid&quot;</span>: <span class="hljs-number">7</span>}
    <span class="hljs-keyword">for</span> filt, topic, want <span class="hljs-keyword">in</span> ((<span class="hljs-string">&quot;robot/+/telemetry&quot;</span>, <span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, <span class="hljs-literal">True</span>), (<span class="hljs-string">&quot;robot/+/telemetry&quot;</span>, <span class="hljs-string">&quot;robot/1/2/telemetry&quot;</span>, <span class="hljs-literal">False</span>),
                              (<span class="hljs-string">&quot;robot/#&quot;</span>, <span class="hljs-string">&quot;robot&quot;</span>, <span class="hljs-literal">True</span>), (<span class="hljs-string">&quot;robot/#&quot;</span>, <span class="hljs-string">&quot;robot/1/telemetry&quot;</span>, <span class="hljs-literal">True</span>), (<span class="hljs-string">&quot;robot/1&quot;</span>, <span class="hljs-string">&quot;robot/1/x&quot;</span>, <span class="hljs-literal">False</span>),
                              (<span class="hljs-string">&quot;+/+&quot;</span>, <span class="hljs-string">&quot;a/b&quot;</span>, <span class="hljs-literal">True</span>), (<span class="hljs-string">&quot;#&quot;</span>, <span class="hljs-string">&quot;anything/at/all&quot;</span>, <span class="hljs-literal">True</span>)):
        <span class="hljs-keyword">assert</span> topic_matches(filt, topic) == want, (filt, topic)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;MQTT: remaining-length vectors, PUBLISH/PUBACK round trip, 39-byte telemetry packet, wildcards ok&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_latency</span>():
    target = <span class="hljs-number">0.030</span>
    <span class="hljs-keyword">for</span> qos <span class="hljs-keyword">in</span> (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>):
        pub, dash, n = run(qos)
        lat = <span class="hljs-built_in">list</span>(dash.lat.values())
        delivered = <span class="hljs-built_in">len</span>(dash.seen) / n
        p50, p95, p99 = pct(lat, <span class="hljs-number">50</span>), pct(lat, <span class="hljs-number">95</span>), pct(lat, <span class="hljs-number">99</span>)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;QoS <span class="hljs-subst">{qos}</span>: delivered <span class="hljs-subst">{delivered * <span class="hljs-number">100</span>:<span class="hljs-number">.2</span>f}</span> %, p50 <span class="hljs-subst">{p50 * <span class="hljs-number">1e3</span>:<span class="hljs-number">.1</span>f}</span> ms, p95 <span class="hljs-subst">{p95 * <span class="hljs-number">1e3</span>:<span class="hljs-number">.1</span>f}</span> ms, &quot;</span>
              <span class="hljs-string">f&quot;p99 <span class="hljs-subst">{p99 * <span class="hljs-number">1e3</span>:<span class="hljs-number">.1</span>f}</span> ms, resends <span class="hljs-subst">{pub.resends}</span>, duplicates dropped <span class="hljs-subst">{dash.dups}</span>&quot;</span>)
        <span class="hljs-keyword">assert</span> p95 &lt; target
        <span class="hljs-keyword">if</span> qos == <span class="hljs-number">0</span>:
            <span class="hljs-keyword">assert</span> <span class="hljs-number">0.97</span> &lt; delivered &lt; <span class="hljs-number">0.99</span>                 <span class="hljs-comment"># about 2 % lost for good</span>
        <span class="hljs-keyword">else</span>:
            <span class="hljs-keyword">assert</span> delivered == <span class="hljs-number">1.0</span> <span class="hljs-keyword">and</span> pub.resends &gt; <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> p99 &gt; <span class="hljs-number">0.1</span>   <span class="hljs-comment"># all arrive; the tail is the resend timeout</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;temperature as received (QoS 1):&quot;</span>)
    <span class="hljs-built_in">print</span>(ascii_plot(dash.values))
    clean = <span class="hljs-number">0.008</span> + <span class="hljs-number">0.004</span> * math.log(<span class="hljs-number">20</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(clean - <span class="hljs-number">0.0200</span>) &lt; <span class="hljs-number">1e-4</span>

test_encoding()
test_latency()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>The dashboard shows 95th-percentile latency of 18 ms but the 99.9th is 2 s. Is anything wrong?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Probably not a bug: with loss, a few messages need several resends, and TCP’s retransmission timeout backs off exponentially, so the far tail is long. If samples older than, say, 200 ms are useless, prefer QoS 0 with a sequence number and accept the gaps, or bound the queue so stale samples are dropped instead of delivered late.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why include a sequence number in the payload when MQTT already has packet ids?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The packet id belongs to one hop (client to broker) and is reused after acknowledgement; subscribers see the broker’s ids, not the publisher’s. A sequence number from the source lets the dashboard detect gaps (lost QoS 0 samples), drop duplicates from QoS 1 resends and reorder late arrivals.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l14"></div>
`,i=[{id:`wireless-links-in-numbers`,title:`Wireless links in numbers`},{id:`mqtt`,title:`MQTT`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l14-q1`,type:`num`,q:`<p>Remaining-length bytes for a 200-byte MQTT packet body?</p>
`,explain:`<p>Values above 127 need a second byte.</p>
`,answer:2,tol:0,unit:`bytes`},{id:`p11-l14-q2`,type:`num`,q:`<p>95th percentile in ms of 8 ms + exponential jitter with mean 4 ms?</p>
`,explain:`<p>The exponential’s 95th percentile is mean × ln 20.</p>
`,answer:19.98,tol:.001,unit:`ms`},{id:`p11-l14-q3`,type:`num`,q:`<p>Percentage of messages that need at least two resends with 2 % loss?</p>
`,explain:`<p>p^k.</p>
`,answer:.04,tol:.001,unit:`%`},{id:`p11-l14-q4`,type:`num`,q:`<p>Size in bytes of a QoS 1 PUBLISH with topic robot/1/telemetry and a 16-byte payload?</p>
`,explain:`<p>Fixed header, topic length, topic, packet id, payload.</p>
`,answer:39,tol:0,unit:`bytes`},{id:`p11-l14-q5`,type:`mc`,q:`<p>Which topics does the filter robot/+/telemetry match?</p>
`,explain:`<ul>
<li>matches exactly one level.</li>
</ul>
`,options:[`robot/1/2/telemetry`,`robot/telemetry`,`robot/1/telemetry and robot/arm/telemetry`,`every topic under robot`],answer:2},{id:`p11-l14-q6`,type:`mc`,q:`<p>What does QoS 1 guarantee?</p>
`,explain:`<p>Resends after a lost PUBACK create duplicates.</p>
`,options:[`delivery within a deadline`,`at most once`,`exactly once`,`at least once delivery, so duplicates are possible`],answer:3}],o=[{file:`mqtt_telemetry.py`,lang:`python`,src:`import heapq, math, random, struct

# ---------- MQTT 3.1.1 encoding ----------
def enc_varint(n):
    out = bytearray()
    while True:
        b, n = n % 128, n // 128
        out.append(b | (0x80 if n else 0))
        if not n:
            return bytes(out)

def dec_varint(buf, i=0):
    mult, val = 1, 0
    for k in range(4):
        b = buf[i + k]
        val += (b & 0x7F) * mult
        if not b & 0x80:
            return val, i + k + 1
        mult *= 128
    raise ValueError("malformed remaining length")

def publish(topic, payload, qos=0, pid=0, dup=False):
    t = topic.encode()
    var = struct.pack(">H", len(t)) + t + (struct.pack(">H", pid) if qos else b"")
    body = var + payload
    return bytes([0x30 | (dup << 3) | (qos << 1)]) + enc_varint(len(body)) + body

def parse(pkt):
    ptype, flags = pkt[0] >> 4, pkt[0] & 0x0F
    length, i = dec_varint(pkt, 1)
    body = pkt[i:i + length]
    assert len(body) == length
    if ptype == 3:
        qos = (flags >> 1) & 3
        tl = struct.unpack(">H", body[:2])[0]
        topic = body[2:2 + tl].decode()
        j = 2 + tl
        pid = struct.unpack(">H", body[j:j + 2])[0] if qos else 0
        return {"type": "PUBLISH", "topic": topic, "qos": qos, "pid": pid, "dup": bool(flags & 8), "payload": body[j + (2 if qos else 0):]}
    if ptype == 4:
        return {"type": "PUBACK", "pid": struct.unpack(">H", body)[0]}
    raise ValueError(ptype)

def puback(pid):
    return bytes([0x40, 2]) + struct.pack(">H", pid)

def topic_matches(filt, topic):
    f, t = filt.split("/"), topic.split("/")
    for i, part in enumerate(f):
        if part == "#":
            return True
        if i >= len(t) or (part != "+" and part != t[i]):
            return False
    return len(f) == len(t)

# ---------- a simulated link, broker and clients ----------
class Sim:
    def __init__(self):
        self.t, self.q, self.n = 0.0, [], 0
    def at(self, t, fn, *args):
        self.n += 1
        heapq.heappush(self.q, (t, self.n, fn, args))
    def run(self, until):
        while self.q and self.q[0][0] <= until:
            self.t, _, fn, args = heapq.heappop(self.q)
            fn(*args)

class Link:
    """one direction: base latency + exponential jitter, independent loss"""
    def __init__(self, sim, rng, base=0.008, jitter=0.004, loss=0.02):
        self.sim, self.rng, self.base, self.jitter, self.loss = sim, rng, base, jitter, loss
    def send(self, pkt, deliver):
        if self.rng.random() < self.loss:
            return
        self.sim.at(self.sim.t + self.base + self.rng.expovariate(1 / self.jitter) if self.jitter else self.sim.t + self.base, deliver, pkt)

class Broker:
    def __init__(self, sim):
        self.sim, self.subs = sim, []
        self.to_client = None
    def subscribe(self, filt, deliver):
        self.subs.append((filt, deliver))
    def on_packet(self, pkt):
        p = parse(pkt)
        if p["type"] == "PUBLISH":
            if p["qos"] == 1:
                self.to_client.send(puback(p["pid"]), self.publisher_rx)
            for filt, deliver in self.subs:
                if topic_matches(filt, p["topic"]):
                    deliver(p)                            # dashboard on the broker's LAN: no extra loss

class Publisher:
    def __init__(self, sim, link, qos, rto=0.1):
        self.sim, self.link, self.qos, self.rto = sim, link, qos, rto
        self.pid, self.inflight, self.sent, self.resends = 0, {}, 0, 0
    def publish_sample(self, seq, value):
        payload = struct.pack(">Idf4x", seq, self.sim.t, value)      # 16 bytes: sequence, timestamp, value
        self.sent += 1
        if self.qos == 0:
            self.link.send(publish("robot/1/telemetry", payload), self.broker.on_packet)
            return
        self.pid = self.pid % 65535 + 1
        pid = self.pid
        self.inflight[pid] = payload
        self._send(pid, dup=False)
    def _send(self, pid, dup):
        if pid not in self.inflight:
            return
        self.link.send(publish("robot/1/telemetry", self.inflight[pid], 1, pid, dup), self.broker.on_packet)
        self.sim.at(self.sim.t + self.rto, self._timeout, pid)
    def _timeout(self, pid):
        if pid in self.inflight:
            self.resends += 1
            self._send(pid, dup=True)
    def on_ack(self, pkt):
        self.inflight.pop(parse(pkt)["pid"], None)

class Dashboard:
    def __init__(self, sim):
        self.sim, self.lat, self.seen, self.dups, self.values = sim, {}, set(), 0, {}
    def on_publish(self, p):
        seq, t_sent, value = struct.unpack(">Idf4x", p["payload"])
        if seq in self.seen:
            self.dups += 1                                 # at-least-once: drop repeats by sequence number
            return
        self.seen.add(seq)
        self.lat[seq] = self.sim.t - t_sent
        self.values[seq] = value

def run(qos, seconds=60.0, rate=50.0, loss=0.02, seed=3):
    rng = random.Random(seed)
    sim = Sim()
    up, down = Link(sim, rng, loss=loss), Link(sim, rng, loss=loss)
    broker, pub, dash = Broker(sim), Publisher(sim, up, qos), Dashboard(sim)
    broker.to_client, pub.broker = down, broker
    broker.publisher_rx = pub.on_ack
    broker.subscribe("robot/+/telemetry", dash.on_publish)
    n = int(seconds * rate)
    for k in range(n):
        value = 40 + 5 * math.sin(2 * math.pi * 0.05 * k / rate)               # a slowly varying temperature
        sim.at(k / rate, pub.publish_sample, k, value)
    sim.run(seconds + 5)
    return pub, dash, n

def pct(xs, p):
    s = sorted(xs)
    return s[min(len(s) - 1, int(p / 100 * len(s)))]

def ascii_plot(values, width=60, height=6):
    xs = [values[k] for k in sorted(values)][::max(1, len(values) // width)][:width]
    lo, hi = min(xs), max(xs)
    rows = []
    for r in range(height - 1, -1, -1):
        rows.append("".join("*" if int((x - lo) / (hi - lo + 1e-9) * (height - 1) + 0.5) == r else " " for x in xs))
    return "\\n".join(rows)

def test_encoding():
    for n, hexs in ((0, "00"), (127, "7f"), (128, "8001"), (16383, "ff7f"), (16384, "808001"), (268435455, "ffffff7f")):
        assert enc_varint(n).hex() == hexs and dec_varint(enc_varint(n))[0] == n
    pkt = publish("robot/1/telemetry", bytes(16), qos=1, pid=7)
    assert len(pkt) == 39 and pkt[0] == 0x32 and pkt[1] == 37
    p = parse(pkt)
    assert (p["topic"], p["qos"], p["pid"], len(p["payload"])) == ("robot/1/telemetry", 1, 7, 16)
    assert parse(publish("a/b", b"x", 1, 9, dup=True))["dup"] is True
    assert parse(puback(7)) == {"type": "PUBACK", "pid": 7}
    for filt, topic, want in (("robot/+/telemetry", "robot/1/telemetry", True), ("robot/+/telemetry", "robot/1/2/telemetry", False),
                              ("robot/#", "robot", True), ("robot/#", "robot/1/telemetry", True), ("robot/1", "robot/1/x", False),
                              ("+/+", "a/b", True), ("#", "anything/at/all", True)):
        assert topic_matches(filt, topic) == want, (filt, topic)
    print("MQTT: remaining-length vectors, PUBLISH/PUBACK round trip, 39-byte telemetry packet, wildcards ok")

def test_latency():
    target = 0.030
    for qos in (0, 1):
        pub, dash, n = run(qos)
        lat = list(dash.lat.values())
        delivered = len(dash.seen) / n
        p50, p95, p99 = pct(lat, 50), pct(lat, 95), pct(lat, 99)
        print(f"QoS {qos}: delivered {delivered * 100:.2f} %, p50 {p50 * 1e3:.1f} ms, p95 {p95 * 1e3:.1f} ms, "
              f"p99 {p99 * 1e3:.1f} ms, resends {pub.resends}, duplicates dropped {dash.dups}")
        assert p95 < target
        if qos == 0:
            assert 0.97 < delivered < 0.99                 # about 2 % lost for good
        else:
            assert delivered == 1.0 and pub.resends > 0 and p99 > 0.1   # all arrive; the tail is the resend timeout
    print("temperature as received (QoS 1):")
    print(ascii_plot(dash.values))
    clean = 0.008 + 0.004 * math.log(20)
    assert abs(clean - 0.0200) < 1e-4

test_encoding()
test_latency()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};