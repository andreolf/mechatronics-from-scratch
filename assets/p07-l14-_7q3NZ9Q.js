var e=`p07-l14`,t=35,n=`Motor control needs the current, which is the torque. You size a shunt and amplifier for ±20 A, compare low-side, high-side and Hall sensing, and show why sampling at the centre of a PWM period gives the average current while sampling near an edge catches ripple and ringing.`,r=`<h2 id="shunts">Shunts</h2>
<p>A <strong>shunt</strong> is a small, accurate resistor in the current path. Ohm’s law turns current into voltage: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span>. Choose <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> by balancing:</p>
<ul>
<li><strong>Signal</strong>: a larger <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> gives more millivolts above amplifier offset and noise.</li>
<li><strong>Loss</strong>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> heats the board and wastes energy.</li>
</ul>
<p>A full-scale drop of 50–100 mV is typical. Use a 4-terminal (Kelvin) connection, so the solder joints and copper aren’t part of the measurement, and a current-sense amplifier with high common-mode rejection.</p>
<p><strong>Where to put it</strong>:</p>
<ul>
<li><strong>Low side</strong> (between the load or bridge and ground): a common-mode voltage near 0 V, so it’s easy to amplify. It doesn’t see a short from the load to ground, and it lifts the load’s ground.</li>
<li><strong>High side or in-line in a motor phase</strong>: it sees all the current, but the common mode swings with the PWM, so it needs a dedicated amplifier with high common-mode rejection at high slew rates.</li>
<li><strong>Hall-effect current sensors</strong> (lesson 8): galvanic isolation and no loss, at the cost of offset drift and bandwidth.</li>
</ul>
<h2 id="sampling-in-a-pwm-period">Sampling in a PWM period</h2>
<p>With PWM at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9805em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0269em;">pw</span><span class="mord mathnormal mtight">m</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span>, the motor’s inductance turns the voltage pulses into a current that ramps up during the on-time and down during the off-time: a triangle <strong>ripple</strong> around the average. Each switching edge also adds <strong>ringing</strong>.</p>
<p>With <strong>centre-aligned PWM</strong>, the middle of the on-time (and of the off-time) is exactly where the rising ramp crosses the average, far from both edges. Triggering the ADC from the PWM timer at that instant samples the <strong>average current</strong> with no filtering delay. That’s what every field-oriented motor drive does (Phase 09).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="shunt" data-args="{}"></div></div><figcaption>Shunt current through one centre-aligned PWM period, with ramp ripple and switching ringing. Move the sample instant: the centre gives the average; near an edge you sample the ringing.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Design for ±20 A with a 3.3 V ADC.</p>
<ol>
<li>A 50 mV drop at 20 A gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.5</span></span></span></span> mΩ. Loss at 20 A: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.0025</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> W, so use a 2–3 W part.</li>
<li>Bidirectional: bias the amplifier output at 1.65 V. Gain <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1.65/0.05</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">33</span></span></span></span> maps ±20 A to 0–3.3 V.</li>
<li>A 12-bit ADC: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">3.3/4096</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.81</span></span></span></span> mV per count, which is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.81/</span><span class="mopen">(</span><span class="mord">33</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2.5</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9.8</span></span></span></span> mA per count.</li>
<li>An amplifier offset of 100 µV at the input is 40 mA of current error, which you calibrate out at zero current.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">current_sense.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">shunt_design</span>(<span class="hljs-params">i_max, v_fs=<span class="hljs-number">0.05</span>, adc_span=<span class="hljs-number">3.3</span>, bits=<span class="hljs-number">12</span></span>):
    R = v_fs / i_max
    G = (adc_span / <span class="hljs-number">2</span>) / v_fs                              <span class="hljs-comment"># bidirectional around mid-rail</span>
    amps_per_count = adc_span / <span class="hljs-number">2</span>**bits / (G * R)
    <span class="hljs-keyword">return</span> R, i_max**<span class="hljs-number">2</span> * R, G, amps_per_count

<span class="hljs-keyword">def</span> <span class="hljs-title function_">phase_current</span>(<span class="hljs-params">t, duty, i_avg=<span class="hljs-number">10.0</span>, ripple=<span class="hljs-number">4.0</span>, ring=<span class="hljs-number">6.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;t in PWM periods [0, 1); centre-aligned, on in the middle.&quot;&quot;&quot;</span>
    t = np.asarray(t) % <span class="hljs-number">1.0</span>
    on0, on1 = <span class="hljs-number">0.5</span> - duty / <span class="hljs-number">2</span>, <span class="hljs-number">0.5</span> + duty / <span class="hljs-number">2</span>
    rising = (t &gt;= on0) &amp; (t &lt; on1)
    x_off = np.where(t &lt; on0, (t + <span class="hljs-number">1</span> - on1) / (<span class="hljs-number">1</span> - duty), (t - on1) / (<span class="hljs-number">1</span> - duty))
    i = np.where(rising, i_avg - ripple / <span class="hljs-number">2</span> + ripple * (t - on0) / duty, i_avg + ripple / <span class="hljs-number">2</span> - ripple * x_off)
    <span class="hljs-keyword">for</span> edge <span class="hljs-keyword">in</span> (on0, on1):
        dt = t - edge
        i = i + np.where((dt &gt;= <span class="hljs-number">0</span>) &amp; (dt &lt; <span class="hljs-number">0.04</span>), ring * np.exp(-dt / <span class="hljs-number">0.012</span>) * np.cos(<span class="hljs-number">2</span> * np.pi * dt / <span class="hljs-number">0.012</span>), <span class="hljs-number">0</span>)
    <span class="hljs-keyword">return</span> i

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    R, P, G, lsb = shunt_design(<span class="hljs-number">20</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;R = <span class="hljs-subst">{R*<span class="hljs-number">1e3</span>:<span class="hljs-number">.2</span>f}</span> mOhm, loss <span class="hljs-subst">{P:<span class="hljs-number">.2</span>f}</span> W, gain <span class="hljs-subst">{G:<span class="hljs-number">.0</span>f}</span>, <span class="hljs-subst">{lsb*<span class="hljs-number">1e3</span>:<span class="hljs-number">.2</span>f}</span> mA per count&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(R - <span class="hljs-number">2.5e-3</span>) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(P - <span class="hljs-number">1.0</span>) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(G - <span class="hljs-number">33</span>) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(lsb - <span class="hljs-number">9.766e-3</span>) &lt; <span class="hljs-number">1e-5</span>
    t = np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">200_000</span>, endpoint=<span class="hljs-literal">False</span>)
    <span class="hljs-keyword">for</span> duty <span class="hljs-keyword">in</span> (<span class="hljs-number">0.2</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">0.8</span>):
        true_avg = phase_current(t, duty, ring=<span class="hljs-number">0</span>).mean()
        centre = <span class="hljs-built_in">float</span>(phase_current(<span class="hljs-number">0.5</span>, duty))           <span class="hljs-comment"># middle of the on-time (PWM counter at its peak)</span>
        valley = <span class="hljs-built_in">float</span>(phase_current(<span class="hljs-number">0.0</span>, duty))           <span class="hljs-comment"># middle of the off-time</span>
        near_edge = <span class="hljs-built_in">float</span>(phase_current(<span class="hljs-number">0.5</span> - duty / <span class="hljs-number">2</span> + <span class="hljs-number">0.005</span>, duty))
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(centre - true_avg) &lt; <span class="hljs-number">1e-3</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(valley - true_avg) &lt; <span class="hljs-number">1e-3</span>
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(near_edge - true_avg) &gt; <span class="hljs-number">1.0</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;centre-aligned sampling returns the average current at every duty cycle&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does a low-side shunt under a half-bridge only measure the current while the low switch conducts?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The current flows through the shunt only when its leg’s low-side switch (or diode) carries it. During the high-side on-time, the current circulates elsewhere and the shunt reads zero. Sample during the low-side conduction window, which also sets a minimum off-time.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Choose a shunt for ±5 A with a 100 mV full-scale drop. What power does it dissipate?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.1/5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20</span></span></span></span> mΩ; <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">25</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.02</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.5</span></span></span></span> W at full current. Use a 1 W part.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p07-l14"></div>

`,i=[{id:`shunts`,title:`Shunts`},{id:`sampling-in-a-pwm-period`,title:`Sampling in a PWM period`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p07-l14-q1`,type:`num`,q:`<p>Shunt resistance in mΩ for 50 mV at 20 A?</p>
`,explain:`<p>R = V/I.</p>
`,answer:2.5,tol:.001,unit:`mΩ`},{id:`p07-l14-q2`,type:`num`,q:`<p>Power in W at 20 A through 2.5 mΩ?</p>
`,explain:`<p>I²R.</p>
`,answer:1,tol:.001,unit:`W`},{id:`p07-l14-q3`,type:`num`,q:`<p>Amplifier gain to map ±50 mV onto 0–3.3 V around mid-rail?</p>
`,explain:`<p>Half the span over the full-scale drop.</p>
`,answer:33,tol:.001,unit:``},{id:`p07-l14-q4`,type:`mc`,q:`<p>In centre-aligned PWM, sampling at the middle of the on-time gives…</p>
`,explain:`<p>The ramp crosses the average there.</p>
`,options:[`the peak current`,`the average current`,`zero`,`the ringing amplitude`],answer:1},{id:`p07-l14-q5`,type:`num`,q:`<p>Current error in mA from a 100 µV amplifier input offset on 2.5 mΩ?</p>
`,explain:`<p>Calibrate it at zero current.</p>
`,answer:40,tol:.001,unit:`mA`},{id:`p07-l14-q6`,type:`mc`,q:`<p>A Hall-effect current sensor’s main advantage over a shunt is…</p>
`,explain:`<p>It senses the field around the conductor.</p>
`,options:[`lower offset drift`,`galvanic isolation and no I²R loss`,`higher bandwidth always`,`lower cost always`],answer:1}],o=[{file:`current_sense.py`,lang:`python`,src:`import numpy as np

def shunt_design(i_max, v_fs=0.05, adc_span=3.3, bits=12):
    R = v_fs / i_max
    G = (adc_span / 2) / v_fs                              # bidirectional around mid-rail
    amps_per_count = adc_span / 2**bits / (G * R)
    return R, i_max**2 * R, G, amps_per_count

def phase_current(t, duty, i_avg=10.0, ripple=4.0, ring=6.0):
    """t in PWM periods [0, 1); centre-aligned, on in the middle."""
    t = np.asarray(t) % 1.0
    on0, on1 = 0.5 - duty / 2, 0.5 + duty / 2
    rising = (t >= on0) & (t < on1)
    x_off = np.where(t < on0, (t + 1 - on1) / (1 - duty), (t - on1) / (1 - duty))
    i = np.where(rising, i_avg - ripple / 2 + ripple * (t - on0) / duty, i_avg + ripple / 2 - ripple * x_off)
    for edge in (on0, on1):
        dt = t - edge
        i = i + np.where((dt >= 0) & (dt < 0.04), ring * np.exp(-dt / 0.012) * np.cos(2 * np.pi * dt / 0.012), 0)
    return i

if __name__ == "__main__":
    R, P, G, lsb = shunt_design(20)
    print(f"R = {R*1e3:.2f} mOhm, loss {P:.2f} W, gain {G:.0f}, {lsb*1e3:.2f} mA per count")
    assert abs(R - 2.5e-3) < 1e-12 and abs(P - 1.0) < 1e-12 and abs(G - 33) < 1e-12 and abs(lsb - 9.766e-3) < 1e-5
    t = np.linspace(0, 1, 200_000, endpoint=False)
    for duty in (0.2, 0.5, 0.8):
        true_avg = phase_current(t, duty, ring=0).mean()
        centre = float(phase_current(0.5, duty))           # middle of the on-time (PWM counter at its peak)
        valley = float(phase_current(0.0, duty))           # middle of the off-time
        near_edge = float(phase_current(0.5 - duty / 2 + 0.005, duty))
        assert abs(centre - true_avg) < 1e-3 and abs(valley - true_avg) < 1e-3
        assert abs(near_edge - true_avg) > 1.0
    print("centre-aligned sampling returns the average current at every duty cycle")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};