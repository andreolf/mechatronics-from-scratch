var e=`p19-l19`,t=40,n=`Safety-related software must notice when its inputs lie. You build range, rate and cross-check monitors for a redundant pair of joint angle sensors plus a freshness watchdog, inject six kinds of fault, and check that each is caught within a 50 ms budget while healthy runs raise no false alarms.`,r=`<h2 id="sensors-fail-in-many-ways">Sensors fail in many ways</h2>
<p>A sensor can fail obviously (an open wire pulls the input to a rail) or subtly: stuck at its last value, offset by a slipped magnet, drifting with temperature, spiking from interference, or simply no longer updating while the last value sits in memory. A controller that trusts such a value can drive a machine somewhere dangerous. <strong>Diagnostics</strong> turn these failures into detected faults that trip a safe state, which is what diagnostic coverage (Lesson 17) measures.</p>
<h2 id="four-cheap-monitors">Four cheap monitors</h2>
<ul>
<li><strong>Range</strong>: the value must lie in the physically possible range, here <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7804em;vertical-align:-0.136em;"></span><span class="mord">−</span><span class="mord">0.1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8304em;vertical-align:-0.136em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3.3</span></span></span></span> rad. Catches open and shorted wires.</li>
<li><strong>Rate</strong>: consecutive samples cannot differ by more than the fastest possible motion allows, plus a noise margin: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">∣</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1813em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9313em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.0556em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">ϵ</span></span></span></span>. Catches spikes and sudden offsets.</li>
<li><strong>Cross-check</strong>: two independent sensors must agree within a tolerance for most samples; requiring the disagreement to persist for <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> samples avoids nuisance trips. Catches stuck, drifting and frozen sensors.</li>
<li><strong>Freshness watchdog</strong>: each sample carries a sequence number; if it stops changing for too long, the data are stale.</li>
</ul>
<p>The thresholds trade detection time against false alarms, so test both: inject every fault class, and run long healthy sequences with realistic noise and motion.</p>
<h2 id="redundancy-in-practice">Redundancy in practice</h2>
<p>Redundant measurements are standard wherever a wrong reading could hurt someone: speed and position monitoring on cable cars and rack railways, such as those across the Swiss Alps, uses independent sensors cross-checked by the safety controller, and so do industrial robot joints with a motor encoder and a separate joint encoder. The numbers below are for an illustrative joint, not a specific installation.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="plausmon" data-args="{}"></div></div><figcaption>Two sensor traces with the monitor thresholds. Choose a fault to inject and see which monitor catches it and how quickly.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>1 kHz sampling, 2 mrad noise per sensor, joint moving at up to 2.5 rad/s, tolerance 0.02 rad for 10 samples, watchdog 20 ms:</p>
<ol>
<li>Five healthy 3 s runs: no alarms.</li>
<li>Offset of 0.05 rad and a 0.5 rad spike: caught at once by the rate monitor.</li>
<li>Open wire (input at 3.6 V): caught at once by the range and rate monitors.</li>
<li>Stuck sensor: cross-check after 18.0 ms (9.0 ms after its error exceeded 0.02 rad). Frozen sensor: cross-check after 18.0 ms, just before the 20 ms watchdog would have fired.</li>
<li>Slow drift at 0.2 rad/s: cross-check after 126.0 ms, 36.0 ms after the error became significant. Every fault is caught within 50 ms of becoming dangerous.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">plausibility.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

FS = <span class="hljs-number">1000.0</span>                                                     <span class="hljs-comment"># samples per second</span>
LO, HI = -<span class="hljs-number">0.1</span>, <span class="hljs-number">3.3</span>                                              <span class="hljs-comment"># valid range of the joint angle (rad)</span>
MAX_RATE = <span class="hljs-number">4.0</span>                                                  <span class="hljs-comment"># fastest physically possible motion (rad/s)</span>
STEP_MAX = MAX_RATE / FS + <span class="hljs-number">0.015</span>                                <span class="hljs-comment"># per-sample limit plus a margin for 2 mrad sensor noise</span>
XTOL, XN = <span class="hljs-number">0.02</span>, <span class="hljs-number">10</span>                                             <span class="hljs-comment"># cross-check: disagreement over 0.02 rad for 10 samples</span>
STALE_N = <span class="hljs-number">20</span>                                                    <span class="hljs-comment"># watchdog: no new sample for 20 ms</span>
BUDGET_MS = <span class="hljs-number">50</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Monitor</span>:
    <span class="hljs-string">&quot;&quot;&quot;range, rate and cross-check monitors for a redundant sensor pair, plus a freshness watchdog per sensor.&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>): <span class="hljs-variable language_">self</span>.prev = [<span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>]; <span class="hljs-variable language_">self</span>.xcount = <span class="hljs-number">0</span>; <span class="hljs-variable language_">self</span>.age = [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]; <span class="hljs-variable language_">self</span>.last_seq = [-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>]
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">self, a, b, seq_a, seq_b</span>):
        faults = []
        <span class="hljs-keyword">for</span> k, (v, s) <span class="hljs-keyword">in</span> <span class="hljs-built_in">enumerate</span>(((a, seq_a), (b, seq_b))):
            <span class="hljs-variable language_">self</span>.age[k] = <span class="hljs-number">0</span> <span class="hljs-keyword">if</span> s != <span class="hljs-variable language_">self</span>.last_seq[k] <span class="hljs-keyword">else</span> <span class="hljs-variable language_">self</span>.age[k] + <span class="hljs-number">1</span>; <span class="hljs-variable language_">self</span>.last_seq[k] = s
            <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.age[k] &gt;= STALE_N: faults.append(<span class="hljs-string">f&quot;stale <span class="hljs-subst">{k}</span>&quot;</span>)
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> (LO &lt;= v &lt;= HI): faults.append(<span class="hljs-string">f&quot;range <span class="hljs-subst">{k}</span>&quot;</span>)
            <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.prev[k] <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(v - <span class="hljs-variable language_">self</span>.prev[k]) &gt; STEP_MAX: faults.append(<span class="hljs-string">f&quot;rate <span class="hljs-subst">{k}</span>&quot;</span>)
            <span class="hljs-variable language_">self</span>.prev[k] = v
        <span class="hljs-variable language_">self</span>.xcount = <span class="hljs-variable language_">self</span>.xcount + <span class="hljs-number">1</span> <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(a - b) &gt; XTOL <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.xcount &gt;= XN: faults.append(<span class="hljs-string">&quot;cross-check&quot;</span>)
        <span class="hljs-keyword">return</span> faults

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">fault=<span class="hljs-literal">None</span>, t_fault=<span class="hljs-number">1.0</span>, seconds=<span class="hljs-number">3.0</span>, seed=<span class="hljs-number">0</span></span>):
    rng = np.random.default_rng(seed); n = <span class="hljs-built_in">int</span>(seconds * FS); t = np.arange(n) / FS
    truth = <span class="hljs-number">1.5</span> + <span class="hljs-number">1.0</span> * np.sin(<span class="hljs-number">2</span> * np.pi * <span class="hljs-number">0.4</span> * t)                          <span class="hljs-comment"># joint motion, peak rate 2.5 rad/s</span>
    a = truth + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.002</span>, n); b = truth + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.002</span>, n)
    sa = np.arange(n); sb = np.arange(n); k0 = <span class="hljs-built_in">int</span>(t_fault * FS)
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;stuck&quot;</span>: a[k0:] = a[k0]
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;offset&quot;</span>: a[k0:] += <span class="hljs-number">0.05</span>
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;drift&quot;</span>: a[k0:] += <span class="hljs-number">0.2</span> * (t[k0:] - t_fault)                <span class="hljs-comment"># slow drift, 0.2 rad/s</span>
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;spike&quot;</span>: a[k0] += <span class="hljs-number">0.5</span>
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;open wire&quot;</span>: a[k0:] = <span class="hljs-number">3.6</span>                                     <span class="hljs-comment"># input pulled to the rail</span>
    <span class="hljs-keyword">if</span> fault == <span class="hljs-string">&quot;frozen&quot;</span>: a[k0:] = a[k0]; sa[k0:] = sa[k0]                  <span class="hljs-comment"># sensor stopped updating</span>
    bad = np.nonzero(np.<span class="hljs-built_in">abs</span>(a[k0:] - truth[k0:]) &gt; XTOL)[<span class="hljs-number">0</span>]                <span class="hljs-comment"># when the error becomes significant</span>
    k_bad = k0 + (bad[<span class="hljs-number">0</span>] <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(bad) <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>) <span class="hljs-keyword">if</span> fault != <span class="hljs-string">&quot;frozen&quot;</span> <span class="hljs-keyword">else</span> k0      <span class="hljs-comment"># a frozen sensor is a fault at once</span>
    m = Monitor()
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        f = m.step(a[k], b[k], sa[k], sb[k])
        <span class="hljs-keyword">if</span> f: <span class="hljs-keyword">return</span> (k - k0) / FS * <span class="hljs-number">1000</span>, <span class="hljs-built_in">max</span>(<span class="hljs-number">0</span>, k - k_bad) / FS * <span class="hljs-number">1000</span>, f
    <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>, []

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_no_false_alarms</span>():
    <span class="hljs-keyword">for</span> seed <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">5</span>): <span class="hljs-keyword">assert</span> run(<span class="hljs-literal">None</span>, seed=seed)[<span class="hljs-number">0</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;healthy runs (5 seeds, 3 s each): no alarms&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_injected_faults</span>():
    <span class="hljs-keyword">for</span> fault <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;stuck&quot;</span>, <span class="hljs-string">&quot;offset&quot;</span>, <span class="hljs-string">&quot;drift&quot;</span>, <span class="hljs-string">&quot;spike&quot;</span>, <span class="hljs-string">&quot;open wire&quot;</span>, <span class="hljs-string">&quot;frozen&quot;</span>):
        ms, late, f = run(fault)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{fault:10s}</span> detected <span class="hljs-subst">{ms:<span class="hljs-number">5.1</span>f}</span> ms after injection, <span class="hljs-subst">{late:<span class="hljs-number">4.1</span>f}</span> ms after the error exceeded <span class="hljs-subst">{XTOL}</span> rad, by <span class="hljs-subst">{<span class="hljs-string">&#x27;, &#x27;</span>.join(f)}</span>&quot;</span>)
        <span class="hljs-keyword">assert</span> ms <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">and</span> ms &gt;= <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> late &lt;= BUDGET_MS, fault

test_no_false_alarms()
test_injected_faults()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>The same monitors run in safety PLCs and in dual-core lockstep microcontrollers made for functional safety (from Infineon, Texas Instruments, NXP and others), alongside hardware watchdogs that reset or shut down the system if the software stops kicking them. NumPy is enough to tune thresholds against recorded data; fault injection (Lesson 21) then verifies them on the real system.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A joint moves at most 3 rad/s, sampled at 500 Hz, with 1 mrad noise. Suggest a rate-check step limit.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Motion allows <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">3/500</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6</span></span></span></span> mrad per sample; add a margin of about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord">5</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;">2</span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">7</span></span></span></span> mrad for the noise of two samples, so about 13 mrad.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why can a cross-check not tell which of two sensors is wrong, and what helps?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>With two sensors, a disagreement only shows that one is wrong. The safe reaction is to stop. A third sensor (two-out-of-three voting) or a model-based estimate can identify the faulty one and allow continued operation.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l19"></div>
`,i=[{id:`sensors-fail-in-many-ways`,title:`Sensors fail in many ways`},{id:`four-cheap-monitors`,title:`Four cheap monitors`},{id:`redundancy-in-practice`,title:`Redundancy in practice`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l19-q1`,type:`num`,q:`<p>Largest true change per sample at 2 rad/s and 1 kHz (mrad)?</p>
`,explain:`<p>Rate divided by sampling rate.</p>
`,answer:2,tol:.001,unit:``},{id:`p19-l19-q2`,type:`num`,q:`<p>Cross-check delay for 10 samples at 1 kHz (ms)?</p>
`,explain:`<p>Persistence count over the rate.</p>
`,answer:10,tol:.001,unit:``},{id:`p19-l19-q3`,type:`num`,q:`<p>Time for a 0.2 rad/s drift to exceed 0.02 rad (ms)?</p>
`,explain:`<p>Tolerance over drift rate.</p>
`,answer:100,tol:.001,unit:``},{id:`p19-l19-q4`,type:`num`,q:`<p>Watchdog timeout for 25 missed samples at 1 kHz (ms)?</p>
`,explain:`<p>One millisecond per sample.</p>
`,answer:25,tol:.001,unit:``},{id:`p19-l19-q5`,type:`mc`,q:`<p>Which monitor catches a sensor stuck at a valid value?</p>
`,explain:`<p>A stuck value stays in range and does not jump.</p>
`,options:[`The cross-check against a second sensor`,`None of them`,`The range check`,`The rate check`],answer:0},{id:`p19-l19-q6`,type:`mc`,q:`<p>Why require a disagreement to persist for several samples?</p>
`,explain:`<p>Persistence trades latency for false alarms.</p>
`,options:[`To avoid nuisance trips from noise`,`To save memory`,`To make detection faster`,`Because sensors are always wrong`],answer:0}],o=[{file:`plausibility.py`,lang:`python`,src:`import numpy as np

FS = 1000.0                                                     # samples per second
LO, HI = -0.1, 3.3                                              # valid range of the joint angle (rad)
MAX_RATE = 4.0                                                  # fastest physically possible motion (rad/s)
STEP_MAX = MAX_RATE / FS + 0.015                                # per-sample limit plus a margin for 2 mrad sensor noise
XTOL, XN = 0.02, 10                                             # cross-check: disagreement over 0.02 rad for 10 samples
STALE_N = 20                                                    # watchdog: no new sample for 20 ms
BUDGET_MS = 50

class Monitor:
    """range, rate and cross-check monitors for a redundant sensor pair, plus a freshness watchdog per sensor."""
    def __init__(self): self.prev = [None, None]; self.xcount = 0; self.age = [0, 0]; self.last_seq = [-1, -1]
    def step(self, a, b, seq_a, seq_b):
        faults = []
        for k, (v, s) in enumerate(((a, seq_a), (b, seq_b))):
            self.age[k] = 0 if s != self.last_seq[k] else self.age[k] + 1; self.last_seq[k] = s
            if self.age[k] >= STALE_N: faults.append(f"stale {k}")
            if not (LO <= v <= HI): faults.append(f"range {k}")
            if self.prev[k] is not None and abs(v - self.prev[k]) > STEP_MAX: faults.append(f"rate {k}")
            self.prev[k] = v
        self.xcount = self.xcount + 1 if abs(a - b) > XTOL else 0
        if self.xcount >= XN: faults.append("cross-check")
        return faults

def run(fault=None, t_fault=1.0, seconds=3.0, seed=0):
    rng = np.random.default_rng(seed); n = int(seconds * FS); t = np.arange(n) / FS
    truth = 1.5 + 1.0 * np.sin(2 * np.pi * 0.4 * t)                          # joint motion, peak rate 2.5 rad/s
    a = truth + rng.normal(0, 0.002, n); b = truth + rng.normal(0, 0.002, n)
    sa = np.arange(n); sb = np.arange(n); k0 = int(t_fault * FS)
    if fault == "stuck": a[k0:] = a[k0]
    if fault == "offset": a[k0:] += 0.05
    if fault == "drift": a[k0:] += 0.2 * (t[k0:] - t_fault)                # slow drift, 0.2 rad/s
    if fault == "spike": a[k0] += 0.5
    if fault == "open wire": a[k0:] = 3.6                                     # input pulled to the rail
    if fault == "frozen": a[k0:] = a[k0]; sa[k0:] = sa[k0]                  # sensor stopped updating
    bad = np.nonzero(np.abs(a[k0:] - truth[k0:]) > XTOL)[0]                # when the error becomes significant
    k_bad = k0 + (bad[0] if len(bad) else 0) if fault != "frozen" else k0      # a frozen sensor is a fault at once
    m = Monitor()
    for k in range(n):
        f = m.step(a[k], b[k], sa[k], sb[k])
        if f: return (k - k0) / FS * 1000, max(0, k - k_bad) / FS * 1000, f
    return None, None, []

def test_no_false_alarms():
    for seed in range(5): assert run(None, seed=seed)[0] is None
    print("healthy runs (5 seeds, 3 s each): no alarms")

def test_injected_faults():
    for fault in ("stuck", "offset", "drift", "spike", "open wire", "frozen"):
        ms, late, f = run(fault)
        print(f"{fault:10s} detected {ms:5.1f} ms after injection, {late:4.1f} ms after the error exceeded {XTOL} rad, by {', '.join(f)}")
        assert ms is not None and ms >= 0 and late <= BUDGET_MS, fault

test_no_false_alarms()
test_injected_faults()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};