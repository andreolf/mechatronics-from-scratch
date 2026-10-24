var e=`p07-l12`,t=35,n=`An ultrasonic ranger times an echo, and the distance is half the round trip times the speed of sound. You correct the speed of sound for temperature, compare threshold detection with cross-correlation on simulated noisy echoes, and reach errors below 1 cm with correlation plus parabolic interpolation.`,r=`<h2 id="time-of-flight">Time of flight</h2>
<p>A transducer sends a short burst at 40 kHz, the sound bounces off the target and returns after <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span>, so</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.9781em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.2921em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">2</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>The speed of sound in air depends on temperature: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4831em;"></span><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">331.3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">0.606</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span> m/s with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span> in °C. That’s 343.4 m/s at 20 °C and 337.4 m/s at 10 °C, a 1.8 % difference, so 3.5 cm at 2 m. Measure the air temperature or calibrate against a known distance.</p>
<p>The beam is wide (about 30°), soft surfaces absorb, and angled ones reflect away, so ultrasonic rangers are good for “is something close?” and poor at fine detail. A minimum range of a few centimetres comes from the transducer still ringing after transmitting.</p>
<h2 id="detecting-the-echo">Detecting the echo</h2>
<p><strong>Threshold</strong>: report the first sample above a fixed level. It’s simple, but the resonant transducer’s echo rises over several cycles, so a weak echo crosses the threshold later than a strong one. The error depends on the target’s reflectivity and distance: often a centimetre or more, and a whole cycle (4.3 mm of range) at a time.</p>
<p><strong>Cross-correlation</strong>: slide a copy of the transmitted burst along the received signal and find the lag where they match best:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mopen">[</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mclose">]</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.3em;vertical-align:-1.25em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.9em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">n</span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.25em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">x</span><span class="mopen">[</span><span class="mord mathnormal">n</span><span class="mclose">]</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">s</span><span class="mopen">[</span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.2079em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mclose">]</span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9579em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.25em;"><span class="mord">^</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.5021em;vertical-align:-0.7521em;"></span><span class="mop">ar<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.4306em;"><span style="top:-2.3479em;margin-left:0em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span><span class="mop">max</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.7521em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mopen">[</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mclose">]</span><span class="mord">.</span></span></span></span></span></div>
<p>That uses the whole echo, not one sample, so it is independent of amplitude and robust to noise. It’s the optimal <em>matched filter</em> for a known pulse in white noise. Fitting a parabola through the peak and its two neighbours gives sub-sample resolution (Phase 08 lesson 15).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="echo" data-args="{}"></div></div><figcaption>A received echo in noise (top) and its correlation with the transmitted burst (bottom). The correlation peak marks the round-trip time even when the echo is hard to see.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An echo returns after 11.66 ms at 20 °C.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">331.3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.606</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">343.42</span></span></span></span> m/s.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">343.42</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.01166/2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.002</span></span></span></span> m.</li>
<li>If the firmware assumed 343 m/s while the air was at 0 °C (331.3 m/s), it would report 2.000 m for a target really at 1.931 m: a 7 cm error from temperature alone.</li>
<li>Sampling at 1 MHz, one sample is 0.17 mm of range, so correlation is limited by noise, not by sampling.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">ultrasonic.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

rng = np.random.default_rng(<span class="hljs-number">21</span>)
FS, F0 = <span class="hljs-number">1e6</span>, <span class="hljs-number">40e3</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">c_air</span>(<span class="hljs-params">T</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-number">331.3</span> + <span class="hljs-number">0.606</span> * T

<span class="hljs-keyword">def</span> <span class="hljs-title function_">burst</span>(<span class="hljs-params">cycles=<span class="hljs-number">10</span></span>):
    n = <span class="hljs-built_in">int</span>(cycles * FS / F0)
    t = np.arange(n) / FS
    <span class="hljs-keyword">return</span> np.sin(<span class="hljs-number">2</span> * np.pi * F0 * t) * np.sin(np.pi * np.arange(n) / n) ** <span class="hljs-number">2</span>   <span class="hljs-comment"># transducer-shaped envelope</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">received</span>(<span class="hljs-params">d, amp, noise, T=<span class="hljs-number">20.0</span>, n=<span class="hljs-number">14000</span></span>):
    s = burst()
    x = noise * rng.standard_normal(n)
    delay = <span class="hljs-number">2</span> * d / c_air(T) * FS
    k0 = <span class="hljs-built_in">int</span>(delay)
    frac = delay - k0
    shifted = np.interp(np.arange(<span class="hljs-built_in">len</span>(s)) - frac, np.arange(<span class="hljs-built_in">len</span>(s)), s, left=<span class="hljs-number">0</span>, right=<span class="hljs-number">0</span>)
    x[k0:k0 + <span class="hljs-built_in">len</span>(s)] += amp * shifted
    <span class="hljs-keyword">return</span> x

<span class="hljs-keyword">def</span> <span class="hljs-title function_">by_threshold</span>(<span class="hljs-params">x, level</span>):
    <span class="hljs-keyword">return</span> np.argmax(np.<span class="hljs-built_in">abs</span>(x) &gt; level) / FS

<span class="hljs-keyword">def</span> <span class="hljs-title function_">by_correlation</span>(<span class="hljs-params">x</span>):
    s = burst()
    r = np.correlate(x, s, mode=<span class="hljs-string">&quot;valid&quot;</span>)
    k = <span class="hljs-built_in">int</span>(np.argmax(r))
    y0, y1, y2 = r[k - <span class="hljs-number">1</span>], r[k], r[k + <span class="hljs-number">1</span>]
    <span class="hljs-keyword">return</span> (k + <span class="hljs-number">0.5</span> * (y0 - y2) / (y0 - <span class="hljs-number">2</span> * y1 + y2)) / FS   <span class="hljs-comment"># parabolic peak</span>

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(c_air(<span class="hljs-number">20</span>) - <span class="hljs-number">343.42</span>) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">343.42</span> * <span class="hljs-number">0.01166</span> / <span class="hljs-number">2</span> - <span class="hljs-number">2.002</span>) &lt; <span class="hljs-number">0.001</span>
    worst_thr = worst_cor = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">for</span> d <span class="hljs-keyword">in</span> np.linspace(<span class="hljs-number">0.3</span>, <span class="hljs-number">2.2</span>, <span class="hljs-number">20</span>):
        <span class="hljs-keyword">for</span> amp <span class="hljs-keyword">in</span> (<span class="hljs-number">0.05</span>, <span class="hljs-number">0.2</span>, <span class="hljs-number">1.0</span>):                         <span class="hljs-comment"># weak, medium, strong reflectors</span>
            x = received(d, amp, noise=<span class="hljs-number">0.01</span>)
            d_thr = by_threshold(x, <span class="hljs-number">0.04</span>) * c_air(<span class="hljs-number">20</span>) / <span class="hljs-number">2</span>
            d_cor = by_correlation(x) * c_air(<span class="hljs-number">20</span>) / <span class="hljs-number">2</span>
            worst_thr = <span class="hljs-built_in">max</span>(worst_thr, <span class="hljs-built_in">abs</span>(d_thr - d))
            worst_cor = <span class="hljs-built_in">max</span>(worst_cor, <span class="hljs-built_in">abs</span>(d_cor - d))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;worst error: threshold <span class="hljs-subst">{<span class="hljs-number">100</span>*worst_thr:<span class="hljs-number">.1</span>f}</span> cm, correlation <span class="hljs-subst">{<span class="hljs-number">100</span>*worst_cor:<span class="hljs-number">.2</span>f}</span> cm&quot;</span>)
    <span class="hljs-keyword">assert</span> worst_cor &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> worst_thr &gt; <span class="hljs-number">2</span> * worst_cor</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does threshold detection err in steps of about 4.3 mm?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The echo is a 40 kHz sine under an envelope, so the threshold can only be crossed near a peak of a cycle. Moving from one cycle to the next shifts the time by 25 µs, which is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">343</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">25</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">6</span></span></span></span></span></span></span></span></span><span class="mord">/2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4.3</span></span></span></span> mm of range.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Two rangers on one robot fire at the same time. What goes wrong, and how does correlation help?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Each can hear the other’s burst and report a false echo. Fire them in turn, or give each a different coded burst (a chirp or pseudo-random sequence, Phase 06’s LFSR). Correlation with its own code then rejects the other’s.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p07-l12"></div>

`,i=[{id:`time-of-flight`,title:`Time of flight`},{id:`detecting-the-echo`,title:`Detecting the echo`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p07-l12-q1`,type:`num`,q:`<p>Speed of sound in m/s at 20 °C?</p>
`,explain:`<p>331.3 + 0.606 T.</p>
`,answer:343.42,tol:.001,unit:`m/s`},{id:`p07-l12-q2`,type:`num`,q:`<p>Distance in m for an 11.66 ms round trip at 20 °C?</p>
`,explain:`<p>Half the round trip.</p>
`,answer:2.0021,tol:.001,unit:`m`},{id:`p07-l12-q3`,type:`num`,q:`<p>Range per 40 kHz cycle in mm (c = 343 m/s)?</p>
`,explain:`<p>Half a wavelength.</p>
`,answer:4.2875,tol:.002,unit:`mm`},{id:`p07-l12-q4`,type:`mc`,q:`<p>Cross-correlation beats a fixed threshold because…</p>
`,explain:`<p>A matched filter.</p>
`,options:[`it removes the speed of sound`,`it is faster`,`it uses the whole echo and doesn’t depend on amplitude`,`it needs no transmitted signal`],answer:2},{id:`p07-l12-q5`,type:`num`,q:`<p>Range error in % from assuming 343 m/s when the air is at 0 °C?</p>
`,explain:`<p>Measure the temperature.</p>
`,answer:3.53,tol:.01,unit:`%`},{id:`p07-l12-q6`,type:`mc`,q:`<p>Fitting a parabola to the correlation peak gives…</p>
`,explain:`<p>Interpolation between samples.</p>
`,options:[`sub-sample time resolution`,`the echo amplitude only`,`the speed of sound`,`a wider beam`],answer:0}],o=[{file:`ultrasonic.py`,lang:`python`,src:`import numpy as np

rng = np.random.default_rng(21)
FS, F0 = 1e6, 40e3

def c_air(T):
    return 331.3 + 0.606 * T

def burst(cycles=10):
    n = int(cycles * FS / F0)
    t = np.arange(n) / FS
    return np.sin(2 * np.pi * F0 * t) * np.sin(np.pi * np.arange(n) / n) ** 2   # transducer-shaped envelope

def received(d, amp, noise, T=20.0, n=14000):
    s = burst()
    x = noise * rng.standard_normal(n)
    delay = 2 * d / c_air(T) * FS
    k0 = int(delay)
    frac = delay - k0
    shifted = np.interp(np.arange(len(s)) - frac, np.arange(len(s)), s, left=0, right=0)
    x[k0:k0 + len(s)] += amp * shifted
    return x

def by_threshold(x, level):
    return np.argmax(np.abs(x) > level) / FS

def by_correlation(x):
    s = burst()
    r = np.correlate(x, s, mode="valid")
    k = int(np.argmax(r))
    y0, y1, y2 = r[k - 1], r[k], r[k + 1]
    return (k + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) / FS   # parabolic peak

if __name__ == "__main__":
    assert abs(c_air(20) - 343.42) < 1e-9 and abs(343.42 * 0.01166 / 2 - 2.002) < 0.001
    worst_thr = worst_cor = 0.0
    for d in np.linspace(0.3, 2.2, 20):
        for amp in (0.05, 0.2, 1.0):                         # weak, medium, strong reflectors
            x = received(d, amp, noise=0.01)
            d_thr = by_threshold(x, 0.04) * c_air(20) / 2
            d_cor = by_correlation(x) * c_air(20) / 2
            worst_thr = max(worst_thr, abs(d_thr - d))
            worst_cor = max(worst_cor, abs(d_cor - d))
    print(f"worst error: threshold {100*worst_thr:.1f} cm, correlation {100*worst_cor:.2f} cm")
    assert worst_cor < 0.01 and worst_thr > 2 * worst_cor`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};