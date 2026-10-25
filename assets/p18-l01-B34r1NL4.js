var e=`p18-l01`,t=30,n=`A control loop that is right but late is wrong. You define deadlines, jitter and worst-case execution time, tell hard, firm and soft deadlines apart, write the statistics that characterise a periodic loop, test them on synthetic data, and measure a 1 kHz Python loop on a real Linux machine.`,r=`<h2 id="deadlines">Deadlines</h2>
<p>A <strong>real-time</strong> system is one whose correctness depends on <em>when</em> results arrive, not only on their values. Each job of a periodic task is released at time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, must finish by its deadline <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span></span></span></span> (usually the next release), and needs at most its <strong>worst-case execution time</strong> (WCET) <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span> of processor time.</p>
<p>What a missed deadline costs decides the class:</p>
<ul>
<li><strong>Hard</strong>: a miss is a failure (an airbag, a motor current loop that would trip the drive).</li>
<li><strong>Firm</strong>: a late result is worthless and discarded, but the system carries on (a dropped video frame).</li>
<li><strong>Soft</strong>: a late result loses value gradually (a slower user interface).</li>
</ul>
<p>“Real-time” does not mean fast. A 1 Hz loop that never misses is real-time; a 10 kHz loop that occasionally stalls for 50 ms is not.</p>
<h2 id="jitter-and-its-statistics">Jitter and its statistics</h2>
<p>For a loop with nominal period <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span>, the measured periods <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord">Δ</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> give the <strong>jitter</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord">Δ</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span>. Mean and standard deviation describe typical behaviour, but real-time cares about the <strong>tail</strong>: the 99th percentile, the maximum, and the count of deadline misses. A control design (Phase 13) assumes a fixed sample time, and jitter acts like noise on it.</p>
<p>Two habits keep the average rate right: schedule each wake-up at an <strong>absolute</strong> time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8234em;vertical-align:-0.2083em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span> (not “sleep <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span> after finishing”, which drifts by the work time every cycle), and measure with a monotonic clock (<code>time.perf_counter</code>, <code>CLOCK_MONOTONIC</code>).</p>
<h2 id="wcet-is-not-measured-it-is-bounded">WCET is not measured, it is bounded</h2>
<p>The longest execution time you observed is a lower bound on the WCET, not the WCET. Caches, branch prediction, interrupts and rare code paths can make an unobserved run longer. Safety-critical work uses static analysis or adds a margin to the measured maximum.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="timinghist" data-args="{}"></div></div><figcaption>Histogram of the periods of an illustrative 1 kHz loop. Change the jitter and the chance of a long stall, and see the mean barely move while the tail and the deadline misses change.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<ol>
<li>A synthetic 1 kHz loop with 20 µs of Gaussian jitter and two injected overruns (3.5 ms and 2.4 ms) over 10 000 periods: mean 1.0005 ms, standard deviation 34.9 µs, 99th percentile 1.0463 ms, maximum 3.50 ms, worst jitter 2500 µs and 2 deadline misses. The two outliers barely move the mean but dominate the maximum.</li>
<li>Half a deadline late: a hard task has failed (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord">∞</span></span></span></span>), a firm task delivers nothing (0), a soft task delivers half its value (0.5).</li>
<li>One run of the code on our shared build machine, 500 iterations at 1 kHz with <code>time.sleep</code>: mean 1.0003 ms, standard deviation 370 µs, worst 4.879 ms and 9 misses. The absolute release times keep the mean exact while the tail is poor. Your numbers will differ from run to run.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">loop_timing.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> time
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">timing_stats</span>(<span class="hljs-params">stamps, period, deadline=<span class="hljs-literal">None</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;statistics of a periodic loop from its wake-up timestamps (seconds):
    periods, jitter (deviation from the nominal period), and deadline misses&quot;&quot;&quot;</span>
    stamps = np.asarray(stamps, <span class="hljs-built_in">float</span>); dt = np.diff(stamps)
    jit = dt - period; deadline = period <span class="hljs-keyword">if</span> deadline <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">else</span> deadline
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;n&quot;</span>: <span class="hljs-built_in">len</span>(dt), <span class="hljs-string">&quot;mean&quot;</span>: dt.mean(), <span class="hljs-string">&quot;std&quot;</span>: dt.std(), <span class="hljs-string">&quot;min&quot;</span>: dt.<span class="hljs-built_in">min</span>(), <span class="hljs-string">&quot;max&quot;</span>: dt.<span class="hljs-built_in">max</span>(),
            <span class="hljs-string">&quot;p99&quot;</span>: np.percentile(dt, <span class="hljs-number">99</span>), <span class="hljs-string">&quot;max_abs_jitter&quot;</span>: np.<span class="hljs-built_in">abs</span>(jit).<span class="hljs-built_in">max</span>(),
            <span class="hljs-string">&quot;misses&quot;</span>: <span class="hljs-built_in">int</span>((dt &gt; period + deadline).<span class="hljs-built_in">sum</span>())}                <span class="hljs-comment"># an iteration started more than a deadline late</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">utility</span>(<span class="hljs-params">kind, lateness, deadline=<span class="hljs-number">1.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;value of a result delivered \`lateness\` after its deadline: hard (failure), firm (worthless), soft (degrades)&quot;&quot;&quot;</span>
    <span class="hljs-keyword">if</span> lateness &lt;= <span class="hljs-number">0</span>: <span class="hljs-keyword">return</span> <span class="hljs-number">1.0</span>
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;hard&quot;</span>: <span class="hljs-keyword">return</span> -np.inf                                  <span class="hljs-comment"># missing it is a system failure</span>
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;firm&quot;</span>: <span class="hljs-keyword">return</span> <span class="hljs-number">0.0</span>                                      <span class="hljs-comment"># a late result is simply discarded</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">max</span>(<span class="hljs-number">0.0</span>, <span class="hljs-number">1.0</span> - lateness / deadline)                         <span class="hljs-comment"># soft: value decays</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run_loop</span>(<span class="hljs-params">period=<span class="hljs-number">1e-3</span>, n=<span class="hljs-number">500</span>, busy=<span class="hljs-number">2e-4</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;a periodic loop on this machine: do &#x27;work&#x27;, then sleep until the next absolute release time&quot;&quot;&quot;</span>
    stamps = []; t_next = time.perf_counter()
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        stamps.append(time.perf_counter())
        t0 = time.perf_counter()
        <span class="hljs-keyword">while</span> time.perf_counter() - t0 &lt; busy: <span class="hljs-keyword">pass</span>                     <span class="hljs-comment"># stand-in for the control computation</span>
        t_next += period
        delay = t_next - time.perf_counter()
        <span class="hljs-keyword">if</span> delay &gt; <span class="hljs-number">0</span>: time.sleep(delay)
    <span class="hljs-keyword">return</span> np.array(stamps)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_stats_on_known_data</span>():
    rng = np.random.default_rng(<span class="hljs-number">0</span>); period = <span class="hljs-number">1e-3</span>
    dt = period + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">20e-6</span>, <span class="hljs-number">10000</span>); dt[[<span class="hljs-number">100</span>, <span class="hljs-number">5000</span>]] = [<span class="hljs-number">3.5e-3</span>, <span class="hljs-number">2.4e-3</span>]   <span class="hljs-comment"># two injected overruns</span>
    st = timing_stats(np.r_[<span class="hljs-number">0</span>, np.cumsum(dt)], period)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;synthetic 1 kHz loop: mean <span class="hljs-subst">{<span class="hljs-number">1e3</span> * st[<span class="hljs-string">&#x27;mean&#x27;</span>]:<span class="hljs-number">.4</span>f}</span> ms, std <span class="hljs-subst">{<span class="hljs-number">1e6</span> * st[<span class="hljs-string">&#x27;std&#x27;</span>]:<span class="hljs-number">.1</span>f}</span> us, max <span class="hljs-subst">{<span class="hljs-number">1e3</span> * st[<span class="hljs-string">&#x27;max&#x27;</span>]:<span class="hljs-number">.2</span>f}</span> ms, &quot;</span>
          <span class="hljs-string">f&quot;p99 <span class="hljs-subst">{<span class="hljs-number">1e3</span> * st[<span class="hljs-string">&#x27;p99&#x27;</span>]:<span class="hljs-number">.4</span>f}</span> ms, max |jitter| <span class="hljs-subst">{<span class="hljs-number">1e6</span> * st[<span class="hljs-string">&#x27;max_abs_jitter&#x27;</span>]:<span class="hljs-number">.0</span>f}</span> us, deadline misses <span class="hljs-subst">{st[<span class="hljs-string">&#x27;misses&#x27;</span>]}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> np.isclose(st[<span class="hljs-string">&quot;mean&quot;</span>], dt.mean()) <span class="hljs-keyword">and</span> np.isclose(st[<span class="hljs-string">&quot;std&quot;</span>], dt.std()) <span class="hljs-keyword">and</span> st[<span class="hljs-string">&quot;misses&quot;</span>] == <span class="hljs-number">2</span>
    <span class="hljs-keyword">assert</span> np.isclose(st[<span class="hljs-string">&quot;max_abs_jitter&quot;</span>], <span class="hljs-number">2.5e-3</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_utility</span>():
    vals = [(k, utility(k, <span class="hljs-number">0.5</span>)) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;hard&quot;</span>, <span class="hljs-string">&quot;firm&quot;</span>, <span class="hljs-string">&quot;soft&quot;</span>)]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;half a deadline late: &quot;</span> + <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{k}</span> <span class="hljs-subst">{v}</span>&quot;</span> <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> vals))
    <span class="hljs-keyword">assert</span> vals[<span class="hljs-number">0</span>][<span class="hljs-number">1</span>] == -np.inf <span class="hljs-keyword">and</span> vals[<span class="hljs-number">1</span>][<span class="hljs-number">1</span>] == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> vals[<span class="hljs-number">2</span>][<span class="hljs-number">1</span>] == <span class="hljs-number">0.5</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_measure_this_machine</span>():
    st = timing_stats(run_loop(), <span class="hljs-number">1e-3</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;this machine, 500 iterations at 1 kHz with time.sleep: mean <span class="hljs-subst">{<span class="hljs-number">1e3</span> * st[<span class="hljs-string">&#x27;mean&#x27;</span>]:<span class="hljs-number">.4</span>f}</span> ms, std <span class="hljs-subst">{<span class="hljs-number">1e6</span> * st[<span class="hljs-string">&#x27;std&#x27;</span>]:<span class="hljs-number">.0</span>f}</span> us, &quot;</span>
          <span class="hljs-string">f&quot;worst <span class="hljs-subst">{<span class="hljs-number">1e3</span> * st[<span class="hljs-string">&#x27;max&#x27;</span>]:<span class="hljs-number">.3</span>f}</span> ms, misses <span class="hljs-subst">{st[<span class="hljs-string">&#x27;misses&#x27;</span>]}</span> (numbers vary from run to run and machine to machine)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(st[<span class="hljs-string">&quot;mean&quot;</span>] - <span class="hljs-number">1e-3</span>) &lt; <span class="hljs-number">2e-4</span>                                 <span class="hljs-comment"># absolute release times keep the average rate</span>

test_stats_on_known_data()
test_utility()
test_measure_this_machine()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In ROS 2, <code>ros2 topic hz</code> and <code>ros2 topic delay</code> report these statistics for a topic, and ros2_control’s controller manager runs the read-update-write loop at a fixed rate and can report overruns. For hard deadlines the loop runs on a real-time kernel (lesson 05) or on a microcontroller (lessons 03 and 16), not in Python.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A loop does 0.3 ms of work and then sleeps 1 ms. What is its actual rate, and how do you fix it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The period is 1.3 ms, about 769 Hz, and it drifts further with every slow iteration. Sleep until an absolute next release time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8234em;vertical-align:-0.2083em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> ms instead.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Your motor current loop must run every 50 µs. In 10 hours of testing the longest iteration took 41 µs. Is the loop proven safe?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>No. 41 µs is the longest observed time, a lower bound on the WCET. Rare paths (an interrupt storm, a cache flush) could exceed 50 µs. Bound it by analysis, keep a margin, and add an overrun detector that puts the drive in a safe state.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l01"></div>
`,i=[{id:`deadlines`,title:`Deadlines`},{id:`jitter-and-its-statistics`,title:`Jitter and its statistics`},{id:`wcet-is-not-measured-it-is-bounded`,title:`WCET is not measured, it is bounded`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l01-q1`,type:`num`,q:`<p>Actual rate of a loop that works 0.25 ms and then sleeps 1 ms?</p>
`,explain:`<p>The period is 1.25 ms.</p>
`,answer:800,tol:.001,unit:`Hz`},{id:`p18-l01-q2`,type:`num`,q:`<p>Jitter of a measured period of 1.07 ms in a 1 kHz loop?</p>
`,explain:`<p>Measured minus nominal period.</p>
`,answer:70,tol:.002,unit:`µs`},{id:`p18-l01-q3`,type:`num`,q:`<p>Deadline misses expected per hour in a 1 kHz loop that misses once in a million iterations?</p>
`,explain:`<p>3.6 million iterations per hour.</p>
`,answer:3.6,tol:.002,unit:``},{id:`p18-l01-q4`,type:`num`,q:`<p>Processor share of a task with WCET 0.2 ms and period 1 ms?</p>
`,explain:`<p>Utilisation C/T.</p>
`,answer:.2,tol:.002,unit:``},{id:`p18-l01-q5`,type:`mc`,q:`<p>A dropped video frame in a teleoperation display is an example of a…</p>
`,explain:`<p>The late frame is useless but the system carries on.</p>
`,options:[`soft deadline with no value loss`,`firm deadline`,`non-real-time task`,`hard deadline`],answer:1},{id:`p18-l01-q6`,type:`mc`,q:`<p>The longest execution time observed in testing is…</p>
`,explain:`<p>Unobserved runs may be longer.</p>
`,options:[`the average execution time`,`a lower bound on the WCET`,`an upper bound on the WCET`,`the WCET`],answer:1}],o=[{file:`loop_timing.py`,lang:`python`,src:`import time
import numpy as np

def timing_stats(stamps, period, deadline=None):
    """statistics of a periodic loop from its wake-up timestamps (seconds):
    periods, jitter (deviation from the nominal period), and deadline misses"""
    stamps = np.asarray(stamps, float); dt = np.diff(stamps)
    jit = dt - period; deadline = period if deadline is None else deadline
    return {"n": len(dt), "mean": dt.mean(), "std": dt.std(), "min": dt.min(), "max": dt.max(),
            "p99": np.percentile(dt, 99), "max_abs_jitter": np.abs(jit).max(),
            "misses": int((dt > period + deadline).sum())}                # an iteration started more than a deadline late

def utility(kind, lateness, deadline=1.0):
    """value of a result delivered \`lateness\` after its deadline: hard (failure), firm (worthless), soft (degrades)"""
    if lateness <= 0: return 1.0
    if kind == "hard": return -np.inf                                  # missing it is a system failure
    if kind == "firm": return 0.0                                      # a late result is simply discarded
    return max(0.0, 1.0 - lateness / deadline)                         # soft: value decays

def run_loop(period=1e-3, n=500, busy=2e-4):
    """a periodic loop on this machine: do 'work', then sleep until the next absolute release time"""
    stamps = []; t_next = time.perf_counter()
    for _ in range(n):
        stamps.append(time.perf_counter())
        t0 = time.perf_counter()
        while time.perf_counter() - t0 < busy: pass                     # stand-in for the control computation
        t_next += period
        delay = t_next - time.perf_counter()
        if delay > 0: time.sleep(delay)
    return np.array(stamps)

def test_stats_on_known_data():
    rng = np.random.default_rng(0); period = 1e-3
    dt = period + rng.normal(0, 20e-6, 10000); dt[[100, 5000]] = [3.5e-3, 2.4e-3]   # two injected overruns
    st = timing_stats(np.r_[0, np.cumsum(dt)], period)
    print(f"synthetic 1 kHz loop: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.1f} us, max {1e3 * st['max']:.2f} ms, "
          f"p99 {1e3 * st['p99']:.4f} ms, max |jitter| {1e6 * st['max_abs_jitter']:.0f} us, deadline misses {st['misses']}")
    assert np.isclose(st["mean"], dt.mean()) and np.isclose(st["std"], dt.std()) and st["misses"] == 2
    assert np.isclose(st["max_abs_jitter"], 2.5e-3)

def test_utility():
    vals = [(k, utility(k, 0.5)) for k in ("hard", "firm", "soft")]
    print("half a deadline late: " + ", ".join(f"{k} {v}" for k, v in vals))
    assert vals[0][1] == -np.inf and vals[1][1] == 0 and vals[2][1] == 0.5

def test_measure_this_machine():
    st = timing_stats(run_loop(), 1e-3)
    print(f"this machine, 500 iterations at 1 kHz with time.sleep: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.0f} us, "
          f"worst {1e3 * st['max']:.3f} ms, misses {st['misses']} (numbers vary from run to run and machine to machine)")
    assert abs(st["mean"] - 1e-3) < 2e-4                                 # absolute release times keep the average rate

test_stats_on_known_data()
test_utility()
test_measure_this_machine()
print("PASS")`}],s={id:e,minutes:30,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};