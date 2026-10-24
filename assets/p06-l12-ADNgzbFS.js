var e=`p06-l12`,t=30,n=`Mechanical contacts bounce for milliseconds, so one press becomes a burst of edges. You measure the bounce, compare an RC filter, a counter debouncer and an integrator, and verify on simulated presses that each press produces exactly one clean event with a known latency.`,r=`<h2 id="bounce">Bounce</h2>
<p>When a switch closes, the contacts hit, rebound and chatter for anywhere from 100 µs to 20 ms before settling. A microcontroller sampling at MHz rates sees dozens of presses. The fixes, roughly in order of robustness:</p>
<ul>
<li><strong>RC filter plus Schmitt trigger.</strong> Smooth the edges with a time constant longer than the bounce, then square them up with hysteresis. It needs parts, but no software.</li>
<li><strong>Counter debouncer.</strong> Sample at a fixed rate, for example 1 kHz from a timer. Accept a new level only after <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> consecutive samples agree. The latency is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> sample periods. Any disagreement resets the count.</li>
<li><strong>Integrator.</strong> Count up while the input is high and down while it’s low, clamped to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mclose">]</span></span></span></span>. The output goes high at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> and low at 0. Its hysteresis tolerates occasional noise spikes better than a reset counter.</li>
</ul>
<p>Choose <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord">/</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> longer than the worst bounce and shorter than a press anyone would notice (more than about 30 ms feels sluggish). Do it in a timer tick, not in the edge interrupt: an interrupt per bounce edge can swamp the CPU, and the raw signal also needs synchronising first (lesson 11).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="debounce" data-args="{}"></div></div><figcaption>A raw contact signal with bounce on press and release, sampled every millisecond. Raise the required samples until one press gives one event.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A tactile switch bounces for up to 5 ms. We sample at 1 kHz.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span></span></span></span> gives 8 ms of required agreement: longer than the bounce, with margin.</li>
<li>The latency is 8 ms after the contact settles. That’s imperceptible.</li>
<li>With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span>, a bounce gap of 2 ms or more in the raw signal could already register as an extra press.</li>
<li>An RC alternative: 10 kΩ and 1 µF give τ = 10 ms. A Schmitt input switching at about 1/3 and 2/3 of the supply delays the edge by about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.5</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3</span></span></span></span>, which is 4–11 ms.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">debounce.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

rng = np.random.default_rng(<span class="hljs-number">3</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">press_sequence</span>(<span class="hljs-params">n_presses, bounce_ms=<span class="hljs-number">5</span>, hold_ms=<span class="hljs-number">120</span>, gap_ms=<span class="hljs-number">150</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;1 kHz samples of a switch with random chatter at each transition.&quot;&quot;&quot;</span>
    x = []
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n_presses):
        x += [<span class="hljs-number">0</span>] * gap_ms
        x += [<span class="hljs-built_in">int</span>(rng.random() &lt; k / bounce_ms) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(bounce_ms)]       <span class="hljs-comment"># chatter while closing</span>
        x += [<span class="hljs-number">1</span>] * hold_ms
        x += [<span class="hljs-built_in">int</span>(rng.random() &gt; k / bounce_ms) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(bounce_ms)]       <span class="hljs-comment"># chatter while opening</span>
    <span class="hljs-keyword">return</span> np.array(x + [<span class="hljs-number">0</span>] * gap_ms)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">counter_debounce</span>(<span class="hljs-params">x, N</span>):
    out, state, cnt = [], x[<span class="hljs-number">0</span>], <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> x:
        <span class="hljs-keyword">if</span> v != state:
            cnt += <span class="hljs-number">1</span>
            <span class="hljs-keyword">if</span> cnt &gt;= N:
                state, cnt = v, <span class="hljs-number">0</span>
        <span class="hljs-keyword">else</span>:
            cnt = <span class="hljs-number">0</span>
        out.append(state)
    <span class="hljs-keyword">return</span> np.array(out)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">integrator_debounce</span>(<span class="hljs-params">x, N</span>):
    out, acc, state = [], <span class="hljs-number">0</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> x:
        acc = <span class="hljs-built_in">min</span>(N, acc + <span class="hljs-number">1</span>) <span class="hljs-keyword">if</span> v <span class="hljs-keyword">else</span> <span class="hljs-built_in">max</span>(<span class="hljs-number">0</span>, acc - <span class="hljs-number">1</span>)
        <span class="hljs-keyword">if</span> acc == N:
            state = <span class="hljs-number">1</span>
        <span class="hljs-keyword">elif</span> acc == <span class="hljs-number">0</span>:
            state = <span class="hljs-number">0</span>
        out.append(state)
    <span class="hljs-keyword">return</span> np.array(out)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rising</span>(<span class="hljs-params">y</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">int</span>(np.count_nonzero((y[<span class="hljs-number">1</span>:] == <span class="hljs-number">1</span>) &amp; (y[:-<span class="hljs-number">1</span>] == <span class="hljs-number">0</span>)))

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    x = press_sequence(<span class="hljs-number">50</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;raw rising edges:&quot;</span>, rising(x))
    <span class="hljs-keyword">assert</span> rising(x) &gt; <span class="hljs-number">50</span>
    <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> (counter_debounce, integrator_debounce):
        y = f(x, <span class="hljs-number">8</span>)
        <span class="hljs-keyword">assert</span> rising(y) == <span class="hljs-number">50</span>, f.__name__
    <span class="hljs-comment"># latency of the counter debouncer: output rises N samples after the input last rose</span>
    y = counter_debounce(x, <span class="hljs-number">8</span>)
    last_raw_rise = <span class="hljs-number">150</span> + <span class="hljs-built_in">max</span>(k <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">5</span>) <span class="hljs-keyword">if</span> x[<span class="hljs-number">150</span> + k] == <span class="hljs-number">1</span> <span class="hljs-keyword">and</span> x[<span class="hljs-number">149</span> + k] == <span class="hljs-number">0</span>)
    first_clean = <span class="hljs-built_in">int</span>(np.argmax(y))
    <span class="hljs-keyword">assert</span> first_clean - last_raw_rise &lt;= <span class="hljs-number">8</span>
    <span class="hljs-comment"># too small a count lets bounce through</span>
    <span class="hljs-keyword">assert</span> rising(counter_debounce(x, <span class="hljs-number">1</span>)) &gt; <span class="hljs-number">50</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;N = 8 at 1 kHz: exactly 50 presses from 50, latency &lt;= 8 ms&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A user complains that fast double-taps are missed. Which parameter do you change, and in which direction?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Reduce <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>, or the sample period, so the debounced high and low phases fit inside the user’s tap. Keep <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord">/</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> above the measured bounce.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why sample in a periodic timer tick rather than on each edge interrupt?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Bounce can produce hundreds of edges per press. The timer gives a fixed, known CPU load and a fixed time base for counting.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l12"></div>

`,i=[{id:`bounce`,title:`Bounce`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l12-q1`,type:`num`,q:`<p>Debounce latency in ms for N = 8 at 1 kHz sampling?</p>
`,explain:`<p>N sample periods.</p>
`,answer:8,tol:.001,unit:`ms`},{id:`p06-l12-q2`,type:`mc`,q:`<p>The integrator debouncer differs from the reset counter because…</p>
`,explain:`<p>One spike only moves it one step.</p>
`,options:[`it has no latency`,`it uses interrupts`,`it counts up and down, giving hysteresis against isolated spikes`,`it needs no sampling`],answer:2},{id:`p06-l12-q3`,type:`num`,q:`<p>RC time constant in ms for 10 kΩ and 1 µF?</p>
`,explain:`<p>R × C.</p>
`,answer:10,tol:.001,unit:`ms`},{id:`p06-l12-q4`,type:`mc`,q:`<p>A required agreement time of 30 ms or more is generally…</p>
`,explain:`<p>Keep it just above the bounce.</p>
`,options:[`required by USB`,`noticeable to the user as sluggish`,`needed for every switch`,`too short`],answer:1},{id:`p06-l12-q5`,type:`num`,q:`<p>Rising edges seen after perfect debouncing of 50 presses?</p>
`,explain:`<p>One per press.</p>
`,answer:50,tol:.001,unit:``},{id:`p06-l12-q6`,type:`num`,q:`<p>Time in ms for an RC with τ = 10 ms to reach 2/3 of the supply from 0?</p>
`,explain:`<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3</span></span></span></span>.</p>
`,answer:10.986,tol:.005,unit:`ms`}],o=[{file:`debounce.py`,lang:`python`,src:`import numpy as np

rng = np.random.default_rng(3)

def press_sequence(n_presses, bounce_ms=5, hold_ms=120, gap_ms=150):
    """1 kHz samples of a switch with random chatter at each transition."""
    x = []
    for _ in range(n_presses):
        x += [0] * gap_ms
        x += [int(rng.random() < k / bounce_ms) for k in range(bounce_ms)]       # chatter while closing
        x += [1] * hold_ms
        x += [int(rng.random() > k / bounce_ms) for k in range(bounce_ms)]       # chatter while opening
    return np.array(x + [0] * gap_ms)

def counter_debounce(x, N):
    out, state, cnt = [], x[0], 0
    for v in x:
        if v != state:
            cnt += 1
            if cnt >= N:
                state, cnt = v, 0
        else:
            cnt = 0
        out.append(state)
    return np.array(out)

def integrator_debounce(x, N):
    out, acc, state = [], 0, 0
    for v in x:
        acc = min(N, acc + 1) if v else max(0, acc - 1)
        if acc == N:
            state = 1
        elif acc == 0:
            state = 0
        out.append(state)
    return np.array(out)

def rising(y):
    return int(np.count_nonzero((y[1:] == 1) & (y[:-1] == 0)))

if __name__ == "__main__":
    x = press_sequence(50)
    print("raw rising edges:", rising(x))
    assert rising(x) > 50
    for f in (counter_debounce, integrator_debounce):
        y = f(x, 8)
        assert rising(y) == 50, f.__name__
    # latency of the counter debouncer: output rises N samples after the input last rose
    y = counter_debounce(x, 8)
    last_raw_rise = 150 + max(k for k in range(5) if x[150 + k] == 1 and x[149 + k] == 0)
    first_clean = int(np.argmax(y))
    assert first_clean - last_raw_rise <= 8
    # too small a count lets bounce through
    assert rising(counter_debounce(x, 1)) > 50
    print("N = 8 at 1 kHz: exactly 50 presses from 50, latency <= 8 ms")`}],s={id:e,minutes:30,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};