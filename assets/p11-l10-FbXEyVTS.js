var e=`p11-l10`,t=35,n=`CAN lets every node transmit whenever the bus is idle and resolves collisions without losing a bit, because a dominant 0 overrides a recessive 1 on the wire and each node listens while it talks. You derive dominant and recessive levels, bitwise arbitration and why bit rate limits cable length, simulate arbitration among three nodes to show the lowest ID always wins intact, and measure what priority means for latency under load.`,r=`<h2 id="dominant-and-recessive">Dominant and recessive</h2>
<p>A CAN bus is a twisted pair, CANH and CANL, terminated with 120 Ω at each end. A transceiver either drives the pair apart (CANH ≈ 3.5 V, CANL ≈ 1.5 V: a 2 V difference, <strong>dominant</strong>, logic 0) or lets go, and the terminators pull the difference to 0 (<strong>recessive</strong>, logic 1).</p>
<p>Driving always beats letting go. So the bus is a wired AND: if any node sends 0, everyone reads 0. Like RS-485 it’s differential and tolerant of ground shifts; unlike RS-485 two nodes driving different bits at once is <em>normal</em>, not a fault.</p>
<h2 id="bitwise-arbitration">Bitwise arbitration</h2>
<p>There’s no master. Any node may start a frame when the bus has been idle. After the start-of-frame bit, each sends its <strong>identifier</strong>, MSB first, and reads the bus back on every bit:</p>
<ul>
<li>If it sent 1 (recessive) and reads 0 (dominant), someone with a lower ID is also transmitting. It <strong>stops immediately</strong> and becomes a receiver, then retries when the bus is idle again.</li>
<li>Otherwise it carries on.</li>
</ul>
<p>The winner never sees a collision: its frame goes out bit for bit as if it were alone. That’s <strong>non-destructive</strong> arbitration, and it means a lower ID is a higher priority, decided in hardware within the first 12 bits (11 ID bits plus RTR, where a data frame’s dominant RTR beats a remote request with the same ID).</p>
<p>Priority also shapes latency. The highest-priority message waits at most one frame that had already started (<em>blocking</em>) plus its own frame; lower-priority messages also wait behind every higher-priority frame queued in the meantime. The simulation below puts six periodic messages on a 500 kbit/s bus at 82 % load: the worst wait seen grows from 443 µs for 0x100 to about 1.45 ms for 0x600.</p>
<h2 id="why-the-bit-rate-limits-cable-length">Why the bit rate limits cable length</h2>
<p>Arbitration only works if every node sees every other node’s bit before it samples, within one bit time. The signal must go from one end to the other and back (the far node’s dominant bit has to reach you while you’re still in the same bit):</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">c</span><span class="mord mathnormal mtight">ab</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">e</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">t</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span><span class="mord mathnormal mtight">an</span><span class="mord mathnormal mtight">sce</span><span class="mord mathnormal mtight">i</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">v</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">er</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9012em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">s</span><span class="mord mathnormal mtight">am</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">pl</span><span class="mord mathnormal mtight">e</span><span class="mspace mtight"><span class="mtight">\xA0</span></span><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">in</span><span class="mord mathnormal mtight">t</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>At 1 Mbit/s with the sample point at 75 % (750 ns), 5 ns/m cable and 150 ns per transceiver pair, the cable must be under 45 m. At 125 kbit/s, 570 m. That trade-off is why CAN FD switches to a faster bit rate only <em>after</em> arbitration.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="canarb" data-args="{}"></div></div><figcaption>Three nodes start a frame at once. Each bit shows what every node sends and what the bus carries; a node that sends recessive but reads dominant drops out. Change the identifiers to see who wins and at which bit.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Nodes A, B and C send 0x65A, 0x658 and 0x6F0.</p>
<ol>
<li>In binary: A = 110 0101 1010, B = 110 0101 1000, C = 110 1111 0000.</li>
<li>Bits 10–8 are 110 for all three. Bit 7: A and B send 0, C sends 1 and reads 0: <strong>C drops out</strong> at bit 7.</li>
<li>Bits 6–2 match for A and B. Bit 1: A sends 1, B sends 0. <strong>A drops out</strong>.</li>
<li>B wins with 0x658, the lowest ID. A and C retry after B’s frame; A then beats C at bit 7 again.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">can_arb.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq, random

<span class="hljs-keyword">def</span> <span class="hljs-title function_">arbitrate</span>(<span class="hljs-params">ids, rtr=<span class="hljs-literal">None</span>, verbose=<span class="hljs-literal">False</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;bitwise arbitration on the 11-bit identifier plus RTR; returns (winner index, bus bits, drop-out bit per node)&quot;&quot;&quot;</span>
    rtr = rtr <span class="hljs-keyword">or</span> [<span class="hljs-number">0</span>] * <span class="hljs-built_in">len</span>(ids)
    fields = [[(i &gt;&gt; b) &amp; <span class="hljs-number">1</span> <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">10</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>)] + [r] <span class="hljs-keyword">for</span> i, r <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(ids, rtr)]
    active = <span class="hljs-built_in">set</span>(<span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(ids)))
    bus_bits, dropped = [], {}
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">12</span>):
        bus = <span class="hljs-built_in">min</span>(fields[n][k] <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> active)          <span class="hljs-comment"># wired AND: any dominant 0 wins</span>
        bus_bits.append(bus)
        <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> <span class="hljs-built_in">sorted</span>(active):
            <span class="hljs-keyword">if</span> fields[n][k] == <span class="hljs-number">1</span> <span class="hljs-keyword">and</span> bus == <span class="hljs-number">0</span>:           <span class="hljs-comment"># sent recessive, read dominant: lost</span>
                dropped[n] = k
        active -= <span class="hljs-built_in">set</span>(dropped)
        <span class="hljs-keyword">if</span> verbose:
            <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  bit <span class="hljs-subst">{k:2d}</span>: &quot;</span> + <span class="hljs-string">&quot; &quot;</span>.join(<span class="hljs-built_in">str</span>(f[k]) <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> fields) + <span class="hljs-string">f&quot;  bus <span class="hljs-subst">{bus}</span>  active <span class="hljs-subst">{<span class="hljs-built_in">sorted</span>(active)}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(active) == <span class="hljs-number">1</span> <span class="hljs-keyword">or</span> <span class="hljs-built_in">len</span>(<span class="hljs-built_in">set</span>(ids[n] <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> active)) == <span class="hljs-number">1</span>, <span class="hljs-string">&quot;two nodes sent the same ID&quot;</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">min</span>(active), bus_bits, dropped

<span class="hljs-keyword">def</span> <span class="hljs-title function_">max_cable_m</span>(<span class="hljs-params">bitrate, sample_point=<span class="hljs-number">0.75</span>, ns_per_m=<span class="hljs-number">5.0</span>, transceiver_ns=<span class="hljs-number">150.0</span></span>):
    budget_ns = sample_point / bitrate * <span class="hljs-number">1e9</span>
    <span class="hljs-keyword">return</span> (budget_ns / <span class="hljs-number">2</span> - transceiver_ns) / ns_per_m

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_worked_example</span>():
    ids = [<span class="hljs-number">0x65A</span>, <span class="hljs-number">0x658</span>, <span class="hljs-number">0x6F0</span>]
    w, bus, dropped = arbitrate(ids, verbose=<span class="hljs-literal">True</span>)
    <span class="hljs-keyword">assert</span> w == <span class="hljs-number">1</span> <span class="hljs-keyword">and</span> dropped == {<span class="hljs-number">2</span>: <span class="hljs-number">3</span>, <span class="hljs-number">0</span>: <span class="hljs-number">9</span>}            <span class="hljs-comment"># field index 3 = ID bit 7, index 9 = ID bit 1</span>
    value = <span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, bus[:<span class="hljs-number">11</span>])), <span class="hljs-number">2</span>)
    <span class="hljs-keyword">assert</span> value == <span class="hljs-number">0x658</span>                                <span class="hljs-comment"># the bus carried the winner&#x27;s ID, intact</span>
    w2, _, _ = arbitrate([<span class="hljs-number">0x65A</span>, <span class="hljs-number">0x6F0</span>])
    <span class="hljs-keyword">assert</span> w2 == <span class="hljs-number">0</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;worked example: 0x658 wins; 0x6F0 drops at ID bit 7, 0x65A at ID bit 1&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_lowest_id_always_wins</span>():
    rng = random.Random(<span class="hljs-number">4</span>)
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20000</span>):
        ids = rng.sample(<span class="hljs-built_in">range</span>(<span class="hljs-number">0x800</span>), <span class="hljs-number">3</span>)
        w, bus, _ = arbitrate(ids)
        <span class="hljs-keyword">assert</span> ids[w] == <span class="hljs-built_in">min</span>(ids)
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">int</span>(<span class="hljs-string">&quot;&quot;</span>.join(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">str</span>, bus[:<span class="hljs-number">11</span>])), <span class="hljs-number">2</span>) == <span class="hljs-built_in">min</span>(ids)
    <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x800</span>, <span class="hljs-number">3</span>):                          <span class="hljs-comment"># a data frame beats a remote frame with the same ID</span>
        w, _, _ = arbitrate([a, a], rtr=[<span class="hljs-number">1</span>, <span class="hljs-number">0</span>])
        <span class="hljs-keyword">assert</span> w == <span class="hljs-number">1</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;20000 random 3-node contests: the lowest ID always wins, and the bus carries it unchanged&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_cable_length</span>():
    l1m, l125k = max_cable_m(<span class="hljs-number">1e6</span>), max_cable_m(<span class="hljs-number">125e3</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;max cable: <span class="hljs-subst">{l1m:<span class="hljs-number">.0</span>f}</span> m at 1 Mbit/s, <span class="hljs-subst">{l125k:<span class="hljs-number">.0</span>f}</span> m at 125 kbit/s&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(l1m - <span class="hljs-number">45</span>) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(l125k - <span class="hljs-number">570</span>) &lt; <span class="hljs-number">1e-9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bus_latency</span>(<span class="hljs-params">messages, bitrate=<span class="hljs-number">500e3</span>, frame_bits=<span class="hljs-number">111</span>, seconds=<span class="hljs-number">2.0</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;messages: (id, period_s). Each is queued with a random phase; the bus sends the lowest queued ID when idle.&quot;&quot;&quot;</span>
    rng = random.Random(seed)
    t_frame = frame_bits / bitrate
    events = []
    <span class="hljs-keyword">for</span> mid, period <span class="hljs-keyword">in</span> messages:
        t = rng.uniform(<span class="hljs-number">0</span>, period)
        <span class="hljs-keyword">while</span> t &lt; seconds:
            heapq.heappush(events, (t, mid))
            t += period
    queue, lat, t_bus = [], {m: [] <span class="hljs-keyword">for</span> m, _ <span class="hljs-keyword">in</span> messages}, <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">while</span> events <span class="hljs-keyword">or</span> queue:
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> queue:
            t_bus = <span class="hljs-built_in">max</span>(t_bus, events[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>])
        <span class="hljs-keyword">while</span> events <span class="hljs-keyword">and</span> events[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] &lt;= t_bus:          <span class="hljs-comment"># everything queued before the bus goes idle joins arbitration</span>
            t, mid = heapq.heappop(events)
            heapq.heappush(queue, (mid, t))
        mid, t_q = heapq.heappop(queue)
        t_bus += t_frame
        lat[mid].append(t_bus - t_q)
    load = <span class="hljs-built_in">sum</span>(t_frame / p <span class="hljs-keyword">for</span> _, p <span class="hljs-keyword">in</span> messages)
    <span class="hljs-keyword">return</span> lat, load, t_frame

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_priority_latency</span>():
    msgs = [(<span class="hljs-number">0x100</span>, <span class="hljs-number">0.001</span>), (<span class="hljs-number">0x200</span>, <span class="hljs-number">0.002</span>), (<span class="hljs-number">0x300</span>, <span class="hljs-number">0.002</span>), (<span class="hljs-number">0x400</span>, <span class="hljs-number">0.005</span>), (<span class="hljs-number">0x500</span>, <span class="hljs-number">0.002</span>), (<span class="hljs-number">0x600</span>, <span class="hljs-number">0.001</span>)]
    worst = {}
    <span class="hljs-keyword">for</span> seed <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">40</span>):                               <span class="hljs-comment"># many random phasings, keep the worst seen</span>
        lat, load, t_frame = bus_latency(msgs, seconds=<span class="hljs-number">0.1</span>, seed=seed)
        <span class="hljs-keyword">for</span> m, v <span class="hljs-keyword">in</span> lat.items():
            worst[m] = <span class="hljs-built_in">max</span>(worst.get(m, <span class="hljs-number">0</span>), <span class="hljs-built_in">max</span>(v))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;bus load <span class="hljs-subst">{load * <span class="hljs-number">100</span>:<span class="hljs-number">.0</span>f}</span> %, frame <span class="hljs-subst">{t_frame * <span class="hljs-number">1e6</span>:<span class="hljs-number">.0</span>f}</span> us; worst latency per ID (us): &quot;</span> +
          <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{m:#x}</span> <span class="hljs-subst">{worst[m] * <span class="hljs-number">1e6</span>:<span class="hljs-number">.0</span>f}</span>&quot;</span> <span class="hljs-keyword">for</span> m, _ <span class="hljs-keyword">in</span> msgs))
    <span class="hljs-keyword">assert</span> worst[<span class="hljs-number">0x100</span>] &lt;= <span class="hljs-number">2</span> * t_frame + <span class="hljs-number">1e-12</span>           <span class="hljs-comment"># at most one frame of blocking plus its own frame</span>
    ordered = [worst[m] <span class="hljs-keyword">for</span> m, _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">sorted</span>(msgs)]
    <span class="hljs-keyword">assert</span> ordered == <span class="hljs-built_in">sorted</span>(ordered)                    <span class="hljs-comment"># lower priority, longer worst-case wait</span>
    <span class="hljs-keyword">assert</span> worst[<span class="hljs-number">0x600</span>] &gt; <span class="hljs-number">3</span> * worst[<span class="hljs-number">0x100</span>]

test_worked_example()
test_lowest_id_always_wins()
test_cable_length()
test_priority_latency()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Two nodes on your bus were both configured to send ID 0x123 with different data. What happens?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Both win arbitration together, then their data fields differ. At the first differing bit, the node sending recessive reads dominant, which outside arbitration is a <strong>bit error</strong>: it sends an error frame, both retransmit and collide again. The bus fills with error frames until one node goes error-passive or bus-off. Unique IDs per message source are a hard rule in CAN.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the highest-priority message still wait up to one frame?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Arbitration only happens at the start of a frame. If a low-priority frame has just started, nobody can interrupt it, so the urgent message waits for it to finish (blocking), about 222 µs for an 8-byte frame at 500 kbit/s, and then wins the next arbitration.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l10"></div>
`,i=[{id:`dominant-and-recessive`,title:`Dominant and recessive`},{id:`bitwise-arbitration`,title:`Bitwise arbitration`},{id:`why-the-bit-rate-limits-cable-length`,title:`Why the bit rate limits cable length`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l10-q1`,type:`num`,q:`<p>Maximum cable length in m at 500 kbit/s (75 % sample point, 5 ns/m, 150 ns transceivers)?</p>
`,explain:`<p>The round trip must fit before the sample point.</p>
`,answer:120,tol:.001,unit:`m`},{id:`p11-l10-q2`,type:`num`,q:`<p>Duration in µs of a 111-bit frame at 500 kbit/s?</p>
`,explain:`<p>Two microseconds per bit.</p>
`,answer:222,tol:.001,unit:`µs`},{id:`p11-l10-q3`,type:`num`,q:`<p>Bus load in percent from one 111-bit frame every 1 ms at 500 kbit/s?</p>
`,explain:`<p>Frame time over period.</p>
`,answer:22.2,tol:.001,unit:`%`},{id:`p11-l10-q4`,type:`num`,q:`<p>At which identifier bit (10 = MSB) does 0x6F0 lose to 0x658?</p>
`,explain:`<p>The first bit where they differ, counting from the MSB.</p>
`,answer:7,tol:0,unit:``},{id:`p11-l10-q5`,type:`mc`,q:`<p>What is a dominant bit?</p>
`,explain:`<p>Recessive is the undriven 1.</p>
`,options:[`logic 0, driven, overrides recessive`,`logic 1, driven`,`the idle level`,`an error flag`],answer:0},{id:`p11-l10-q6`,type:`mc`,q:`<p>Why is CAN arbitration called non-destructive?</p>
`,explain:`<p>No bandwidth is lost to the collision.</p>
`,options:[`the winning frame continues unchanged; the losers just stop`,`all frames are retransmitted`,`nodes can’t collide`,`the bus is never shared`],answer:0}],o=[{file:`can_arb.py`,lang:`python`,src:`import heapq, random

def arbitrate(ids, rtr=None, verbose=False):
    """bitwise arbitration on the 11-bit identifier plus RTR; returns (winner index, bus bits, drop-out bit per node)"""
    rtr = rtr or [0] * len(ids)
    fields = [[(i >> b) & 1 for b in range(10, -1, -1)] + [r] for i, r in zip(ids, rtr)]
    active = set(range(len(ids)))
    bus_bits, dropped = [], {}
    for k in range(12):
        bus = min(fields[n][k] for n in active)          # wired AND: any dominant 0 wins
        bus_bits.append(bus)
        for n in sorted(active):
            if fields[n][k] == 1 and bus == 0:           # sent recessive, read dominant: lost
                dropped[n] = k
        active -= set(dropped)
        if verbose:
            print(f"  bit {k:2d}: " + " ".join(str(f[k]) for f in fields) + f"  bus {bus}  active {sorted(active)}")
    assert len(active) == 1 or len(set(ids[n] for n in active)) == 1, "two nodes sent the same ID"
    return min(active), bus_bits, dropped

def max_cable_m(bitrate, sample_point=0.75, ns_per_m=5.0, transceiver_ns=150.0):
    budget_ns = sample_point / bitrate * 1e9
    return (budget_ns / 2 - transceiver_ns) / ns_per_m

def test_worked_example():
    ids = [0x65A, 0x658, 0x6F0]
    w, bus, dropped = arbitrate(ids, verbose=True)
    assert w == 1 and dropped == {2: 3, 0: 9}            # field index 3 = ID bit 7, index 9 = ID bit 1
    value = int("".join(map(str, bus[:11])), 2)
    assert value == 0x658                                # the bus carried the winner's ID, intact
    w2, _, _ = arbitrate([0x65A, 0x6F0])
    assert w2 == 0
    print("worked example: 0x658 wins; 0x6F0 drops at ID bit 7, 0x65A at ID bit 1")

def test_lowest_id_always_wins():
    rng = random.Random(4)
    for _ in range(20000):
        ids = rng.sample(range(0x800), 3)
        w, bus, _ = arbitrate(ids)
        assert ids[w] == min(ids)
        assert int("".join(map(str, bus[:11])), 2) == min(ids)
    for a in range(0, 0x800, 3):                          # a data frame beats a remote frame with the same ID
        w, _, _ = arbitrate([a, a], rtr=[1, 0])
        assert w == 1
    print("20000 random 3-node contests: the lowest ID always wins, and the bus carries it unchanged")

def test_cable_length():
    l1m, l125k = max_cable_m(1e6), max_cable_m(125e3)
    print(f"max cable: {l1m:.0f} m at 1 Mbit/s, {l125k:.0f} m at 125 kbit/s")
    assert abs(l1m - 45) < 1e-9 and abs(l125k - 570) < 1e-9

def bus_latency(messages, bitrate=500e3, frame_bits=111, seconds=2.0, seed=0):
    """messages: (id, period_s). Each is queued with a random phase; the bus sends the lowest queued ID when idle."""
    rng = random.Random(seed)
    t_frame = frame_bits / bitrate
    events = []
    for mid, period in messages:
        t = rng.uniform(0, period)
        while t < seconds:
            heapq.heappush(events, (t, mid))
            t += period
    queue, lat, t_bus = [], {m: [] for m, _ in messages}, 0.0
    while events or queue:
        if not queue:
            t_bus = max(t_bus, events[0][0])
        while events and events[0][0] <= t_bus:          # everything queued before the bus goes idle joins arbitration
            t, mid = heapq.heappop(events)
            heapq.heappush(queue, (mid, t))
        mid, t_q = heapq.heappop(queue)
        t_bus += t_frame
        lat[mid].append(t_bus - t_q)
    load = sum(t_frame / p for _, p in messages)
    return lat, load, t_frame

def test_priority_latency():
    msgs = [(0x100, 0.001), (0x200, 0.002), (0x300, 0.002), (0x400, 0.005), (0x500, 0.002), (0x600, 0.001)]
    worst = {}
    for seed in range(40):                               # many random phasings, keep the worst seen
        lat, load, t_frame = bus_latency(msgs, seconds=0.1, seed=seed)
        for m, v in lat.items():
            worst[m] = max(worst.get(m, 0), max(v))
    print(f"bus load {load * 100:.0f} %, frame {t_frame * 1e6:.0f} us; worst latency per ID (us): " +
          ", ".join(f"{m:#x} {worst[m] * 1e6:.0f}" for m, _ in msgs))
    assert worst[0x100] <= 2 * t_frame + 1e-12           # at most one frame of blocking plus its own frame
    ordered = [worst[m] for m, _ in sorted(msgs)]
    assert ordered == sorted(ordered)                    # lower priority, longer worst-case wait
    assert worst[0x600] > 3 * worst[0x100]

test_worked_example()
test_lowest_id_always_wins()
test_cable_length()
test_priority_latency()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};