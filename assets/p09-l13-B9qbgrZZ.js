var e=`p09-l13`,t=30,n=`A hobby servo packs a DC motor, a gearbox, a potentiometer and a proportional controller into one box, and you command it with a pulse width. You derive the pulse-to-angle mapping, measure a pulse with a timer, model the internal loop with its speed limit and deadband, and check the horn lands within 2 degrees of every command.`,r=`<h2 id="the-interface-a-pulse-every-20-ms">The interface: a pulse every 20 ms</h2>
<p>An RC servo reads a pulse repeated at about 50 Hz (every 20 ms). The <strong>pulse width</strong>, not the duty cycle, sets the angle. A common convention is 1000 µs for one end, 1500 µs for centre and 2000 µs for the other end. Many servos accept 500–2500 µs for a wider range, and the exact mapping varies by model, so calibrate yours. For a servo that maps 1000–2000 µs to 0–180°:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight">u</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">se</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1000</span><span class="mspace">\xA0</span><span class="mord mathnormal">μ</span><span class="mord mathnormal">s</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.2519em;vertical-align:-0.8804em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3714em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1000</span><span class="mspace">\xA0</span><span class="mord mathnormal">μ</span><span class="mord mathnormal">s</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">180°</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.18°/</span><span class="mord mathnormal">μ</span><span class="mord mathnormal">s</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight">u</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">se</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1000</span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>To generate it from a microcontroller, use a timer in PWM mode (Phase 10) with a 20 ms period and a 1 µs tick, so the compare value is the pulse width in microseconds.</p>
<h2 id="inside-a-proportional-loop">Inside: a proportional loop</h2>
<p>The servo’s controller compares the commanded angle with the potentiometer on the output shaft and drives the motor with a voltage proportional to the error, saturated at full voltage. So:</p>
<ul>
<li>far from the target the horn moves at its <strong>maximum speed</strong>, typically 0.1–0.2 s per 60°;</li>
<li>near the target it slows down proportionally;</li>
<li>inside a <strong>deadband</strong> of a few microseconds’ worth of angle it stops driving, which prevents the motor from hunting and buzzing on potentiometer noise.</li>
</ul>
<p>The deadband sets the resolution: a 4 µs deadband (±2 µs) on 0.18°/µs is ±0.36°. Because the loop is only proportional, a load torque leaves a steady error, and the servo pushes back with torque proportional to the deflection, like a stiff spring.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="servo" data-args="{}"></div></div><figcaption>Servo horn angle for a pulse width (top) and the 50 Hz control signal (bottom). Increase the deadband: the horn stops further from the command.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A servo maps 1000–2000 µs to 0–180°, moves at 60° per 0.12 s, with a 4 µs deadband.</p>
<ol>
<li>A 1350 µs pulse commands <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.18</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">350</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">63°</span></span></span></span>.</li>
<li>From 90°, the move is 27°. At 500°/s it takes about 54 ms, nearly three pulse periods.</li>
<li>The horn stops within <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8389em;vertical-align:-0.1944em;"></span><span class="mord">±</span><span class="mord">2</span><span class="mspace">\xA0</span><span class="mord mathnormal">μ</span><span class="mord mathnormal">s</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.18</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord">±</span><span class="mord">0.36°</span></span></span></span> of 63°.</li>
<li>A timer with a 1 µs tick measures the pulse to ±1 µs, or ±0.18°.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">servo_model.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

DEG_PER_US = <span class="hljs-number">180</span> / <span class="hljs-number">1000</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pulse_train</span>(<span class="hljs-params">width_us, periods=<span class="hljs-number">3</span>, fs=<span class="hljs-number">1e6</span>, period_us=<span class="hljs-number">20000</span></span>):
    n = np.arange(<span class="hljs-built_in">int</span>(periods * period_us * fs / <span class="hljs-number">1e6</span>))
    <span class="hljs-keyword">return</span> ((n % period_us) &lt; width_us).astype(np.uint8)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">measure_width</span>(<span class="hljs-params">samples, fs=<span class="hljs-number">1e6</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;Timer-capture style: count samples between a rising and the next falling edge.&quot;&quot;&quot;</span>
    d = np.diff(samples.astype(<span class="hljs-built_in">int</span>))
    rise = np.flatnonzero(d == <span class="hljs-number">1</span>) + <span class="hljs-number">1</span>; fall = np.flatnonzero(d == -<span class="hljs-number">1</span>) + <span class="hljs-number">1</span>
    <span class="hljs-keyword">if</span> samples[<span class="hljs-number">0</span>]:
        rise = np.r_[<span class="hljs-number">0</span>, rise]
    widths = [f - r <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> rise <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> fall[fall &gt; r][:<span class="hljs-number">1</span>]]
    <span class="hljs-keyword">return</span> np.median(widths) * <span class="hljs-number">1e6</span> / fs

<span class="hljs-keyword">def</span> <span class="hljs-title function_">servo</span>(<span class="hljs-params">cmd_deg, start_deg=<span class="hljs-number">90.0</span>, kp=<span class="hljs-number">40.0</span>, w_max=<span class="hljs-number">500.0</span>, deadband_us=<span class="hljs-number">4.0</span>, T=<span class="hljs-number">0.4</span>, dt=<span class="hljs-number">1e-4</span></span>):
    th = start_deg; db = deadband_us / <span class="hljs-number">2</span> * DEG_PER_US
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(T / dt)):
        e = cmd_deg - th
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(e) &gt; db:
            th += dt * np.clip(kp * e, -w_max, w_max)       <span class="hljs-comment"># saturated proportional drive</span>
    <span class="hljs-keyword">return</span> th

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    rng = np.random.default_rng(<span class="hljs-number">13</span>)
    worst = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> width <span class="hljs-keyword">in</span> rng.uniform(<span class="hljs-number">1000</span>, <span class="hljs-number">2000</span>, <span class="hljs-number">40</span>):
        measured = measure_width(pulse_train(<span class="hljs-built_in">round</span>(width)))
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(measured - <span class="hljs-built_in">round</span>(width)) &lt;= <span class="hljs-number">1</span>
        cmd = (measured - <span class="hljs-number">1000</span>) * DEG_PER_US
        ang = servo(cmd, start_deg=rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">180</span>))
        worst = <span class="hljs-built_in">max</span>(worst, <span class="hljs-built_in">abs</span>(ang - cmd))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;worst final error over 40 random commands: <span class="hljs-subst">{worst:<span class="hljs-number">.3</span>f}</span> deg&quot;</span>)
    <span class="hljs-keyword">assert</span> worst &lt; <span class="hljs-number">2.0</span> <span class="hljs-keyword">and</span> worst &lt;= <span class="hljs-number">2</span> * DEG_PER_US + <span class="hljs-number">1e-9</span>   <span class="hljs-comment"># within the deadband</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>((<span class="hljs-number">1350</span> - <span class="hljs-number">1000</span>) * DEG_PER_US - <span class="hljs-number">63</span>) &lt; <span class="hljs-number">1e-12</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>You need 0.1° resolution over 180°. Can a standard RC servo do it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>That’s 1800 positions, 0.56 µs per position on a 1000 µs range, which is finer than a typical deadband (2–8 µs) and the potentiometer’s noise. No: use a “digital” servo with a tiny deadband and a magnetic encoder, or a geared motor with an encoder and your own loop.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the servo hold its position against a push even though the controller is only proportional?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Any deflection creates an error, and the controller drives the motor against it with torque proportional to that error (until saturation). That’s a spring, multiplied by the gearbox ratio. There’s a small steady error under load, which an integral term would remove.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p09-l13"></div>

`,i=[{id:`the-interface-a-pulse-every-20-ms`,title:`The interface: a pulse every 20 ms`},{id:`inside-a-proportional-loop`,title:`Inside: a proportional loop`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p09-l13-q1`,type:`num`,q:`<p>Angle in degrees for a 1350 µs pulse (1000–2000 µs ↔ 0–180°)?</p>
`,explain:`<p>0.18°/µs.</p>
`,answer:63,tol:.001,unit:`°`},{id:`p09-l13-q2`,type:`num`,q:`<p>Final-error bound in degrees for a 4 µs deadband?</p>
`,explain:`<p>±2 µs × 0.18°/µs.</p>
`,answer:.36,tol:.001,unit:`°`},{id:`p09-l13-q3`,type:`num`,q:`<p>Time in ms to move 27° at 500°/s?</p>
`,explain:`<p>Distance over speed.</p>
`,answer:54,tol:.001,unit:`ms`},{id:`p09-l13-q4`,type:`num`,q:`<p>Pulse repetition frequency in Hz for a 20 ms period?</p>
`,explain:`<p>1/T.</p>
`,answer:50,tol:.001,unit:`Hz`},{id:`p09-l13-q5`,type:`mc`,q:`<p>The angle of an RC servo is set by…</p>
`,explain:`<p>Width in microseconds.</p>
`,options:[`the duty cycle`,`the pulse width`,`the pulse frequency`,`the supply voltage`],answer:1},{id:`p09-l13-q6`,type:`mc`,q:`<p>The deadband exists to…</p>
`,explain:`<p>It trades resolution for quiet holding.</p>
`,options:[`stop the motor hunting on noise near the target`,`set the pulse frequency`,`save the gearbox`,`make the servo faster`],answer:0}],o=[{file:`servo_model.py`,lang:`python`,src:`import numpy as np

DEG_PER_US = 180 / 1000

def pulse_train(width_us, periods=3, fs=1e6, period_us=20000):
    n = np.arange(int(periods * period_us * fs / 1e6))
    return ((n % period_us) < width_us).astype(np.uint8)

def measure_width(samples, fs=1e6):
    """Timer-capture style: count samples between a rising and the next falling edge."""
    d = np.diff(samples.astype(int))
    rise = np.flatnonzero(d == 1) + 1; fall = np.flatnonzero(d == -1) + 1
    if samples[0]:
        rise = np.r_[0, rise]
    widths = [f - r for r in rise for f in fall[fall > r][:1]]
    return np.median(widths) * 1e6 / fs

def servo(cmd_deg, start_deg=90.0, kp=40.0, w_max=500.0, deadband_us=4.0, T=0.4, dt=1e-4):
    th = start_deg; db = deadband_us / 2 * DEG_PER_US
    for _ in range(int(T / dt)):
        e = cmd_deg - th
        if abs(e) > db:
            th += dt * np.clip(kp * e, -w_max, w_max)       # saturated proportional drive
    return th

if __name__ == "__main__":
    rng = np.random.default_rng(13)
    worst = 0
    for width in rng.uniform(1000, 2000, 40):
        measured = measure_width(pulse_train(round(width)))
        assert abs(measured - round(width)) <= 1
        cmd = (measured - 1000) * DEG_PER_US
        ang = servo(cmd, start_deg=rng.uniform(0, 180))
        worst = max(worst, abs(ang - cmd))
    print(f"worst final error over 40 random commands: {worst:.3f} deg")
    assert worst < 2.0 and worst <= 2 * DEG_PER_US + 1e-9   # within the deadband
    assert abs((1350 - 1000) * DEG_PER_US - 63) < 1e-12`}],s={id:e,minutes:30,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};