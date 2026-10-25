var e=`p18-l06`,t=40,n=`A real-time loop must never wait on a lock held by a slower thread. You learn why a shared struct tears, what memory ordering means, and build a deterministic interleaving checker that runs every schedule of a writer and a reader, showing that a naive buffer tears while a seqlock and a triple buffer never do.`,r=`<h2 id="the-torn-read">The torn read</h2>
<p>A control loop reads a pose (several words) that a vision thread writes. If the reader runs between two of the writer’s stores, it sees half an old pose and half a new one: a <strong>torn read</strong>. A mutex fixes it but makes the real-time reader wait for the writer (lesson 04). <strong>Lock-free</strong> structures let both sides proceed without ever blocking each other.</p>
<h2 id="atomics-and-memory-ordering">Atomics and memory ordering</h2>
<p>An <strong>atomic</strong> operation (a load, a store, an exchange, a compare-and-swap) is indivisible: no other thread sees it half done. But compilers and processors also <strong>reorder</strong> ordinary loads and stores. A writer that stores the data and then sets a flag may, on an ARM core, publish the flag first. C11 and C++ atomics fix the order:</p>
<ul>
<li>a <strong>release</strong> store makes every earlier write visible before it,</li>
<li>an <strong>acquire</strong> load makes every later read happen after it,</li>
<li><code>seq_cst</code> (the default) gives one global order, at some cost.</li>
</ul>
<p>A writer that fills the data and then publishes with release, and a reader that checks with acquire and then reads the data, always see complete data. This lesson’s checker assumes sequentially consistent memory, which is exactly what correct atomics give you.</p>
<h2 id="two-lock-free-patterns">Two lock-free patterns</h2>
<p><strong>Seqlock.</strong> The writer increments a sequence counter (odd: writing), writes the data, increments again (even). The reader reads the counter, the data, the counter again, and retries if the counter was odd or changed. The writer never waits; the reader may retry.</p>
<p><strong>Triple buffer.</strong> Three slots: the writer owns a back slot, the reader owns a front slot, and a shared middle index plus a “new data” flag sit in one atomic word. The writer fills its back slot and atomically exchanges it with the middle; the reader, if the flag is set, atomically exchanges its front with the middle. Neither waits nor retries, and the reader always gets the latest complete sample, ideal for a fast loop reading a slower producer.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="triplebuf" data-args="{}"></div></div><figcaption>Step a writer and a reader through one interleaving. Pick naive, seqlock or triple buffer, and the readout says whether the reader’s value is torn.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The writer publishes two samples, 1 and 2, each written as two words; the reader reads once (the seqlock reader may try twice). The checker runs every interleaving:</p>
<ol>
<li>Naive shared struct: 56 interleavings, 24 of them torn, for example <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0</span><span class="mclose">)</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span>.</li>
<li>Seqlock: 46378 interleavings, 0 torn. The reader sees <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0</span><span class="mclose">)</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span> or <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">2</span><span class="mclose">)</span></span></span></span>, or gives up after two tries and reads again next cycle.</li>
<li>Triple buffer: 330 interleavings, 0 torn, and the reader always gets a complete sample.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">interleavings.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">def</span> <span class="hljs-title function_">naive_writer</span>(<span class="hljs-params">m, vals</span>):
    <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> vals:
        m[<span class="hljs-string">&quot;a&quot;</span>] = v; <span class="hljs-keyword">yield</span>                                   <span class="hljs-comment"># each yield is a point where the other thread may run</span>
        m[<span class="hljs-string">&quot;b&quot;</span>] = v; <span class="hljs-keyword">yield</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">naive_reader</span>(<span class="hljs-params">m, out</span>):
    a = m[<span class="hljs-string">&quot;a&quot;</span>]; <span class="hljs-keyword">yield</span>
    b = m[<span class="hljs-string">&quot;b&quot;</span>]; <span class="hljs-keyword">yield</span>
    out.append((a, b))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">seq_writer</span>(<span class="hljs-params">m, vals</span>):
    <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> vals:
        m[<span class="hljs-string">&quot;seq&quot;</span>] += <span class="hljs-number">1</span>; <span class="hljs-keyword">yield</span>                                <span class="hljs-comment"># odd: write in progress</span>
        m[<span class="hljs-string">&quot;a&quot;</span>] = v; <span class="hljs-keyword">yield</span>
        m[<span class="hljs-string">&quot;b&quot;</span>] = v; <span class="hljs-keyword">yield</span>
        m[<span class="hljs-string">&quot;seq&quot;</span>] += <span class="hljs-number">1</span>; <span class="hljs-keyword">yield</span>                                <span class="hljs-comment"># even: consistent again</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">seq_reader</span>(<span class="hljs-params">m, out, tries=<span class="hljs-number">2</span></span>):
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(tries):
        s1 = m[<span class="hljs-string">&quot;seq&quot;</span>]; <span class="hljs-keyword">yield</span>
        a = m[<span class="hljs-string">&quot;a&quot;</span>]; <span class="hljs-keyword">yield</span>
        b = m[<span class="hljs-string">&quot;b&quot;</span>]; <span class="hljs-keyword">yield</span>
        s2 = m[<span class="hljs-string">&quot;seq&quot;</span>]; <span class="hljs-keyword">yield</span>
        <span class="hljs-keyword">if</span> s1 % <span class="hljs-number">2</span> == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> s1 == s2:
            out.append((a, b)); <span class="hljs-keyword">return</span>
    out.append(<span class="hljs-string">&quot;gave up&quot;</span>)                                   <span class="hljs-comment"># the writer kept it busy; try again next cycle</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">tb_writer</span>(<span class="hljs-params">m, vals</span>):
    <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> vals:
        m[<span class="hljs-string">&quot;slot&quot;</span>][m[<span class="hljs-string">&quot;back&quot;</span>]] = [v, <span class="hljs-literal">None</span>]; <span class="hljs-keyword">yield</span>             <span class="hljs-comment"># write the back buffer, which only the writer touches</span>
        m[<span class="hljs-string">&quot;slot&quot;</span>][m[<span class="hljs-string">&quot;back&quot;</span>]][<span class="hljs-number">1</span>] = v; <span class="hljs-keyword">yield</span>
        m[<span class="hljs-string">&quot;back&quot;</span>], m[<span class="hljs-string">&quot;mid&quot;</span>] = m[<span class="hljs-string">&quot;mid&quot;</span>][<span class="hljs-number">0</span>], (m[<span class="hljs-string">&quot;back&quot;</span>], <span class="hljs-literal">True</span>); <span class="hljs-keyword">yield</span>   <span class="hljs-comment"># one atomic exchange publishes it</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">tb_reader</span>(<span class="hljs-params">m, out</span>):
    <span class="hljs-keyword">if</span> m[<span class="hljs-string">&quot;mid&quot;</span>][<span class="hljs-number">1</span>]:                                         <span class="hljs-comment"># new data? swap it to the front with one atomic exchange</span>
        m[<span class="hljs-string">&quot;front&quot;</span>], m[<span class="hljs-string">&quot;mid&quot;</span>] = m[<span class="hljs-string">&quot;mid&quot;</span>][<span class="hljs-number">0</span>], (m[<span class="hljs-string">&quot;front&quot;</span>], <span class="hljs-literal">False</span>)
    <span class="hljs-keyword">yield</span>
    a = m[<span class="hljs-string">&quot;slot&quot;</span>][m[<span class="hljs-string">&quot;front&quot;</span>]][<span class="hljs-number">0</span>]; <span class="hljs-keyword">yield</span>
    b = m[<span class="hljs-string">&quot;slot&quot;</span>][m[<span class="hljs-string">&quot;front&quot;</span>]][<span class="hljs-number">1</span>]; <span class="hljs-keyword">yield</span>
    out.append((a, b))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">init</span>(<span class="hljs-params">kind</span>):
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;triple&quot;</span>: <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;slot&quot;</span>: [[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]], <span class="hljs-string">&quot;back&quot;</span>: <span class="hljs-number">0</span>, <span class="hljs-string">&quot;mid&quot;</span>: (<span class="hljs-number">1</span>, <span class="hljs-literal">False</span>), <span class="hljs-string">&quot;front&quot;</span>: <span class="hljs-number">2</span>}
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;a&quot;</span>: <span class="hljs-number">0</span>, <span class="hljs-string">&quot;b&quot;</span>: <span class="hljs-number">0</span>, <span class="hljs-string">&quot;seq&quot;</span>: <span class="hljs-number">0</span>}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">explore</span>(<span class="hljs-params">writer, reader, kind, vals=(<span class="hljs-params"><span class="hljs-number">1</span>, <span class="hljs-number">2</span></span>)</span>):
    <span class="hljs-string">&quot;&quot;&quot;run every interleaving of the two threads (sequentially consistent memory) and collect what the reader saw&quot;&quot;&quot;</span>
    results = []
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">replay</span>(<span class="hljs-params">schedule</span>):
        m = init(kind); out = []; th = [writer(m, vals), reader(m, out)]; alive = [<span class="hljs-literal">True</span>, <span class="hljs-literal">True</span>]
        <span class="hljs-keyword">for</span> who <span class="hljs-keyword">in</span> schedule:
            <span class="hljs-keyword">try</span>: <span class="hljs-built_in">next</span>(th[who])
            <span class="hljs-keyword">except</span> StopIteration: alive[who] = <span class="hljs-literal">False</span>
        <span class="hljs-keyword">return</span> alive, out
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">dfs</span>(<span class="hljs-params">schedule</span>):
        alive, out = replay(schedule)
        live = [i <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>) <span class="hljs-keyword">if</span> alive[i]]
        <span class="hljs-keyword">for</span> who <span class="hljs-keyword">in</span> live: dfs(schedule + [who])           <span class="hljs-comment"># branch: either thread may take the next step</span>
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> live: results.append(out[<span class="hljs-number">0</span>] <span class="hljs-keyword">if</span> out <span class="hljs-keyword">else</span> <span class="hljs-literal">None</span>)
    dfs([])
    <span class="hljs-keyword">return</span> results

<span class="hljs-keyword">def</span> <span class="hljs-title function_">torn</span>(<span class="hljs-params">r</span>): <span class="hljs-keyword">return</span> <span class="hljs-built_in">isinstance</span>(r, <span class="hljs-built_in">tuple</span>) <span class="hljs-keyword">and</span> r[<span class="hljs-number">0</span>] != r[<span class="hljs-number">1</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_all</span>():
    <span class="hljs-keyword">for</span> name, w, r, kind <span class="hljs-keyword">in</span> [(<span class="hljs-string">&quot;naive shared struct&quot;</span>, naive_writer, naive_reader, <span class="hljs-string">&quot;plain&quot;</span>),
                             (<span class="hljs-string">&quot;seqlock&quot;</span>, seq_writer, seq_reader, <span class="hljs-string">&quot;plain&quot;</span>),
                             (<span class="hljs-string">&quot;triple buffer&quot;</span>, tb_writer, tb_reader, <span class="hljs-string">&quot;triple&quot;</span>)]:
        res = explore(w, r, kind)
        seen = <span class="hljs-built_in">sorted</span>({<span class="hljs-built_in">str</span>(x) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> res})
        nt = <span class="hljs-built_in">sum</span>(torn(x) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> res)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: <span class="hljs-subst">{<span class="hljs-built_in">len</span>(res)}</span> interleavings, <span class="hljs-subst">{nt}</span> torn reads, reader saw <span class="hljs-subst">{seen}</span>&quot;</span>)
        <span class="hljs-keyword">if</span> name.startswith(<span class="hljs-string">&quot;naive&quot;</span>): <span class="hljs-keyword">assert</span> nt &gt; <span class="hljs-number">0</span>
        <span class="hljs-keyword">else</span>: <span class="hljs-keyword">assert</span> nt == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">any</span>(<span class="hljs-built_in">isinstance</span>(x, <span class="hljs-built_in">tuple</span>) <span class="hljs-keyword">and</span> x[<span class="hljs-number">0</span>] == <span class="hljs-number">2</span> <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> res)

test_all()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In C++ use <code>std::atomic</code> with explicit <code>memory_order_release</code> and <code>memory_order_acquire</code>, and check <code>is_lock_free()</code>. The ros2_control framework ships <code>realtime_tools::RealtimeBuffer</code> and <code>RealtimePublisher</code> for passing data between non-real-time and real-time threads, and <code>boost::lockfree::spsc_queue</code> is a standard single-producer single-consumer ring. Test with ThreadSanitizer, and with a model checker such as CDSChecker or TLA+ for anything subtle.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why can the seqlock reader’s retry loop starve in principle, and why does the triple buffer not have this problem?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>If the writer writes continuously, every read attempt overlaps a write and is retried. The triple-buffer reader never retries: it always has a complete slot of its own, at worst one sample old.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>The writer stores the data, then stores <code>ready = 1</code> with a relaxed (unordered) store. What can go wrong on a weakly ordered processor?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The <code>ready</code> store can become visible before the data stores, so a reader that sees <code>ready == 1</code> may read old data. Make the flag store a release and the reader’s load an acquire.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l06"></div>
`,i=[{id:`the-torn-read`,title:`The torn read`},{id:`atomics-and-memory-ordering`,title:`Atomics and memory ordering`},{id:`two-lock-free-patterns`,title:`Two lock-free patterns`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l06-q1`,type:`num`,q:`<p>Interleavings of a 2-step writer and a 2-step reader (choose 2 of 4)?</p>
`,explain:`<p>Positions of the reader’s steps among 4.</p>
`,answer:6,tol:.001,unit:``},{id:`p18-l06-q2`,type:`num`,q:`<p>Buffers in a triple buffer?</p>
`,explain:`<p>Front, middle, back.</p>
`,answer:3,tol:.001,unit:``},{id:`p18-l06-q3`,type:`num`,q:`<p>Torn reads the checker found for the naive struct?</p>
`,explain:`<p>Out of 56 interleavings.</p>
`,answer:24,tol:.001,unit:``},{id:`p18-l06-q4`,type:`num`,q:`<p>Seqlock counter value after the writer has published 5 samples, starting at 0?</p>
`,explain:`<p>Two increments per write.</p>
`,answer:10,tol:.001,unit:``},{id:`p18-l06-q5`,type:`mc`,q:`<p>A seqlock reader must retry if…</p>
`,explain:`<p>Either means a write overlapped.</p>
`,options:[`the data is zero`,`the counter is even`,`the writer is idle`,`the counter was odd or changed during the read`],answer:3},{id:`p18-l06-q6`,type:`mc`,q:`<p>To publish data safely with a flag, the flag store should use…</p>
`,explain:`<p>Release-acquire orders the data before the flag.</p>
`,options:[`release ordering, read with acquire`,`relaxed ordering on both sides`,`a sleep between the stores`,`a plain volatile int`],answer:0}],o=[{file:`interleavings.py`,lang:`python`,src:`def naive_writer(m, vals):
    for v in vals:
        m["a"] = v; yield                                   # each yield is a point where the other thread may run
        m["b"] = v; yield

def naive_reader(m, out):
    a = m["a"]; yield
    b = m["b"]; yield
    out.append((a, b))

def seq_writer(m, vals):
    for v in vals:
        m["seq"] += 1; yield                                # odd: write in progress
        m["a"] = v; yield
        m["b"] = v; yield
        m["seq"] += 1; yield                                # even: consistent again

def seq_reader(m, out, tries=2):
    for _ in range(tries):
        s1 = m["seq"]; yield
        a = m["a"]; yield
        b = m["b"]; yield
        s2 = m["seq"]; yield
        if s1 % 2 == 0 and s1 == s2:
            out.append((a, b)); return
    out.append("gave up")                                   # the writer kept it busy; try again next cycle

def tb_writer(m, vals):
    for v in vals:
        m["slot"][m["back"]] = [v, None]; yield             # write the back buffer, which only the writer touches
        m["slot"][m["back"]][1] = v; yield
        m["back"], m["mid"] = m["mid"][0], (m["back"], True); yield   # one atomic exchange publishes it

def tb_reader(m, out):
    if m["mid"][1]:                                         # new data? swap it to the front with one atomic exchange
        m["front"], m["mid"] = m["mid"][0], (m["front"], False)
    yield
    a = m["slot"][m["front"]][0]; yield
    b = m["slot"][m["front"]][1]; yield
    out.append((a, b))

def init(kind):
    if kind == "triple": return {"slot": [[0, 0], [0, 0], [0, 0]], "back": 0, "mid": (1, False), "front": 2}
    return {"a": 0, "b": 0, "seq": 0}

def explore(writer, reader, kind, vals=(1, 2)):
    """run every interleaving of the two threads (sequentially consistent memory) and collect what the reader saw"""
    results = []
    def replay(schedule):
        m = init(kind); out = []; th = [writer(m, vals), reader(m, out)]; alive = [True, True]
        for who in schedule:
            try: next(th[who])
            except StopIteration: alive[who] = False
        return alive, out
    def dfs(schedule):
        alive, out = replay(schedule)
        live = [i for i in (0, 1) if alive[i]]
        for who in live: dfs(schedule + [who])           # branch: either thread may take the next step
        if not live: results.append(out[0] if out else None)
    dfs([])
    return results

def torn(r): return isinstance(r, tuple) and r[0] != r[1]

def test_all():
    for name, w, r, kind in [("naive shared struct", naive_writer, naive_reader, "plain"),
                             ("seqlock", seq_writer, seq_reader, "plain"),
                             ("triple buffer", tb_writer, tb_reader, "triple")]:
        res = explore(w, r, kind)
        seen = sorted({str(x) for x in res})
        nt = sum(torn(x) for x in res)
        print(f"{name}: {len(res)} interleavings, {nt} torn reads, reader saw {seen}")
        if name.startswith("naive"): assert nt > 0
        else: assert nt == 0 and any(isinstance(x, tuple) and x[0] == 2 for x in res)

test_all()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};