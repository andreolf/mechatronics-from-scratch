var e=`p19-l12`,t=45,n=`State of charge cannot be measured, only estimated. You show how Coulomb counting drifts with a small current-sensor offset and never recovers from a wrong start, then build an extended Kalman filter around the equivalent circuit model that corrects with the terminal voltage and holds the error under 3 % on an illustrative e-scooter ride.`,r=`<h2 id="coulomb-counting">Coulomb counting</h2>
<p>Integrating the measured current, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord"><span class="mord mathrm">SOC</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord"><span class="mord mathrm">SOC</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.3262em;vertical-align:-0.4811em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8451em;"><span style="top:-2.655em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">Q</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.394em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.4811em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">i</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">Δ</span><span class="mord mathnormal">t</span></span></span></span>, is simple and accurate over short times. But it has no feedback: a 100 mA sensor offset on a 3 Ah cell adds 3.3 % of error per hour, and a wrong initial SOC (after a long rest with self-discharge, or a battery swap) stays wrong forever.</p>
<h2 id="voltage-as-a-measurement">Voltage as a measurement</h2>
<p>The equivalent circuit model (Lesson 11) predicts the terminal voltage from SOC, current and the RC state. If the measured voltage is lower than predicted, the SOC is probably lower than estimated. An <strong>extended Kalman filter</strong> (Phase 14 covers the linear and extended filters) makes that correction optimally: the state is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord"><span class="mord mathrm">SOC</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">]</span></span></span></span>, the prediction step is Coulomb counting plus the RC update, and the measurement model <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathrm" style="margin-right:0.0139em;">OCV</span></span><span class="mopen">(</span><span class="mord"><span class="mord mathrm">SOC</span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> is linearised with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord mathrm">d</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathrm" style="margin-right:0.0139em;">OCV</span></span><span class="mord">/</span><span class="mord mathrm">d</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathrm">SOC</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">1</span><span class="mclose">]</span></span></span></span>. The filter’s gain is large where the OCV curve is steep and small where it is flat, which is why LFP cells (Lesson 10) are harder.</p>
<h2 id="a-scooter-ride">A scooter ride</h2>
<p>E-scooters, common in places like Bali, see stop-and-go traffic, hill climbs and short regenerative pulses: a demanding profile for a fuel gauge, and a wrong reading strands the rider. The ride here is an illustrative random profile, not logged data, and the “real” cell has resistances 10 and 20 % higher than the filter’s model, so the filter faces model error as well as sensor error.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="socekf" data-args="{}"></div></div><figcaption>True SOC, Coulomb counting and the EKF over an illustrative ride. Change the sensor offset, the initial SOC error and the voltage noise.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>One hour from 90 % to 34.8 % SOC, 100 mA current offset, 2 mV voltage noise:</p>
<ol>
<li>Coulomb counting from the right start: final error 3.33 %.</li>
<li>Coulomb counting starting 20 % off: final error 23.33 %.</li>
<li>EKF starting 20 % off: error 0.31 % after 5 min, at most 1.17 % over the last 50 min, final 0.88 %, inside the 3 % target despite the model mismatch.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">soc_ekf.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

Q = <span class="hljs-number">3.0</span> * <span class="hljs-number">3600</span>; R0, R1, C1 = <span class="hljs-number">0.022</span>, <span class="hljs-number">0.015</span>, <span class="hljs-number">1500.0</span>                     <span class="hljs-comment"># illustrative cell, 1-RC model (Lesson 11)</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">ocv</span>(<span class="hljs-params">s</span>): <span class="hljs-keyword">return</span> <span class="hljs-number">3.0</span> + <span class="hljs-number">1.2</span> * s - <span class="hljs-number">0.25</span> * np.exp(-<span class="hljs-number">12</span> * s) + <span class="hljs-number">0.05</span> * np.sin(<span class="hljs-number">3</span> * s)
<span class="hljs-keyword">def</span> <span class="hljs-title function_">docv</span>(<span class="hljs-params">s</span>): <span class="hljs-keyword">return</span> <span class="hljs-number">1.2</span> + <span class="hljs-number">3.0</span> * np.exp(-<span class="hljs-number">12</span> * s) + <span class="hljs-number">0.15</span> * np.cos(<span class="hljs-number">3</span> * s)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">ride</span>(<span class="hljs-params">seconds=<span class="hljs-number">3600</span>, seed=<span class="hljs-number">3</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative stop-and-go e-scooter current for one cell: cruising, hill climbs, stops and regenerative braking.&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); i = np.zeros(seconds); t = <span class="hljs-number">0</span>
    <span class="hljs-keyword">while</span> t &lt; seconds:
        n = rng.integers(<span class="hljs-number">10</span>, <span class="hljs-number">60</span>); a = rng.choice([<span class="hljs-number">0.0</span>, <span class="hljs-number">1.0</span>, <span class="hljs-number">2.5</span>, <span class="hljs-number">5.0</span>, -<span class="hljs-number">1.5</span>], p=[<span class="hljs-number">.2</span>, <span class="hljs-number">.35</span>, <span class="hljs-number">.2</span>, <span class="hljs-number">.15</span>, <span class="hljs-number">.1</span>])
        i[t:t + n] = a + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.3</span>, <span class="hljs-built_in">min</span>(n, seconds - t)); t += n
    <span class="hljs-keyword">return</span> i

<span class="hljs-keyword">def</span> <span class="hljs-title function_">truth</span>(<span class="hljs-params">i, soc0=<span class="hljs-number">0.90</span>, dt=<span class="hljs-number">1.0</span>, noise=<span class="hljs-number">2e-3</span>, seed=<span class="hljs-number">4</span>, r0=<span class="hljs-number">1.1</span> * R0, r1=<span class="hljs-number">1.2</span> * R1, c1=C1</span>):
    <span class="hljs-string">&quot;&quot;&quot;the &#x27;real&#x27; cell: its resistances are 10 and 20 % higher than the model the estimator uses.&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); a = np.exp(-dt / (r1 * c1)); s, v1 = soc0, <span class="hljs-number">0.0</span>; socs, vs = [], []
    <span class="hljs-keyword">for</span> ik <span class="hljs-keyword">in</span> i:
        vs.append(ocv(s) - r0 * ik - v1 + rng.normal(<span class="hljs-number">0</span>, noise)); socs.append(s)
        v1 = a * v1 + r1 * (<span class="hljs-number">1</span> - a) * ik; s -= ik * dt / Q
    <span class="hljs-keyword">return</span> np.array(socs), np.array(vs)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">coulomb</span>(<span class="hljs-params">i_meas, soc0, dt=<span class="hljs-number">1.0</span></span>): <span class="hljs-keyword">return</span> soc0 - np.concatenate([[<span class="hljs-number">0</span>], np.cumsum(i_meas[:-<span class="hljs-number">1</span>])]) * dt / Q

<span class="hljs-keyword">def</span> <span class="hljs-title function_">ekf</span>(<span class="hljs-params">i_meas, v_meas, soc0, dt=<span class="hljs-number">1.0</span>, q_soc=<span class="hljs-number">1e-10</span>, q_v1=<span class="hljs-number">1e-7</span>, r=(<span class="hljs-params"><span class="hljs-number">3e-3</span></span>)**<span class="hljs-number">2</span>, p0=(<span class="hljs-params"><span class="hljs-number">0.2</span>**<span class="hljs-number">2</span>, <span class="hljs-number">1e-4</span></span>)</span>):
    <span class="hljs-string">&quot;&quot;&quot;state x = [SOC, v1]; predict with the measured current, correct with the terminal voltage.&quot;&quot;&quot;</span>
    a = np.exp(-dt / (R1 * C1)); F = np.diag([<span class="hljs-number">1.0</span>, a]); Qn = np.diag([q_soc, q_v1])
    x = np.array([soc0, <span class="hljs-number">0.0</span>]); P = np.diag(p0); out = []
    <span class="hljs-keyword">for</span> ik, vk <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(i_meas, v_meas):
        H = np.array([docv(x[<span class="hljs-number">0</span>]), -<span class="hljs-number">1.0</span>]); y = vk - (ocv(x[<span class="hljs-number">0</span>]) - R0 * ik - x[<span class="hljs-number">1</span>])
        S = H @ P @ H + r; K = P @ H / S; x = x + K * y; P = (np.eye(<span class="hljs-number">2</span>) - np.outer(K, H)) @ P
        out.append(x[<span class="hljs-number">0</span>])
        x = np.array([x[<span class="hljs-number">0</span>] - ik * dt / Q, a * x[<span class="hljs-number">1</span>] + R1 * (<span class="hljs-number">1</span> - a) * ik]); P = F @ P @ F.T + Qn
    <span class="hljs-keyword">return</span> np.array(out)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_soc_estimation</span>():
    i = ride(); soc, v = truth(i)
    i_meas = i + <span class="hljs-number">0.10</span>                                                    <span class="hljs-comment"># current sensor with a 100 mA offset</span>
    cc_good = coulomb(i_meas, <span class="hljs-number">0.90</span>); cc_bad = coulomb(i_meas, <span class="hljs-number">0.70</span>)      <span class="hljs-comment"># right and wrong starting SOC</span>
    est = ekf(i_meas, v, <span class="hljs-number">0.70</span>)
    e = <span class="hljs-keyword">lambda</span> x: <span class="hljs-number">100</span> * np.<span class="hljs-built_in">abs</span>(x - soc)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;true SOC <span class="hljs-subst">{<span class="hljs-number">100</span> * soc[<span class="hljs-number">0</span>]:<span class="hljs-number">.1</span>f}</span> % -&gt; <span class="hljs-subst">{<span class="hljs-number">100</span> * soc[-<span class="hljs-number">1</span>]:<span class="hljs-number">.1</span>f}</span> % over <span class="hljs-subst">{<span class="hljs-built_in">len</span>(i) / <span class="hljs-number">60</span>:<span class="hljs-number">.0</span>f}</span> min&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Coulomb counting, right start: final error <span class="hljs-subst">{e(cc_good)[-<span class="hljs-number">1</span>]:<span class="hljs-number">.2</span>f}</span> %&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Coulomb counting, start 20 % off: final error <span class="hljs-subst">{e(cc_bad)[-<span class="hljs-number">1</span>]:<span class="hljs-number">.2</span>f}</span> %&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;EKF, start 20 % off: error after 5 min <span class="hljs-subst">{e(est)[<span class="hljs-number">300</span>]:<span class="hljs-number">.2</span>f}</span> %, max over the last 50 min <span class="hljs-subst">{e(est)[<span class="hljs-number">600</span>:].<span class="hljs-built_in">max</span>():<span class="hljs-number">.2</span>f}</span> %, final <span class="hljs-subst">{e(est)[-<span class="hljs-number">1</span>]:<span class="hljs-number">.2</span>f}</span> %&quot;</span>)
    <span class="hljs-keyword">assert</span> e(cc_good)[-<span class="hljs-number">1</span>] &gt; <span class="hljs-number">1</span> <span class="hljs-keyword">and</span> e(cc_bad)[-<span class="hljs-number">1</span>] &gt; <span class="hljs-number">15</span> <span class="hljs-keyword">and</span> e(est)[<span class="hljs-number">600</span>:].<span class="hljs-built_in">max</span>() &lt; <span class="hljs-number">3</span>

test_soc_estimation()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>FilterPy provides Kalman, extended and unscented filters in Python for prototyping; production BMS firmware implements the two-state filter directly in C, with OCV and parameter tables over temperature. Fuel-gauge chips from battery IC vendors use related model-based methods. Wider OCV slopes, good current sensing and periodic rests (when OCV can be read directly) all help.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A 50 mA current offset on a 2 Ah cell: how much SOC error after 4 hours of Coulomb counting?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.05</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">4/2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.10</span></span></span></span>, so 10 % SOC.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the EKF correct SOC slowly on the flat part of an LFP curve?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The measurement Jacobian <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathrm">d</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathrm" style="margin-right:0.0139em;">OCV</span></span><span class="mord">/</span><span class="mord mathrm">d</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathrm">SOC</span></span></span></span></span> is small there, so a voltage error says little about SOC; the Kalman gain for SOC is small, and the filter relies mostly on Coulomb counting until the curve steepens.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l12"></div>
`,i=[{id:`coulomb-counting`,title:`Coulomb counting`},{id:`voltage-as-a-measurement`,title:`Voltage as a measurement`},{id:`a-scooter-ride`,title:`A scooter ride`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l12-q1`,type:`num`,q:`<p>SOC drift per hour from a 100 mA offset on a 3 Ah cell (%)?</p>
`,explain:`<p>Offset over capacity.</p>
`,answer:3.33,tol:.003,unit:``},{id:`p19-l12-q2`,type:`num`,q:`<p>SOC after 1 Ah from 80 % on a 4 Ah cell (%)?</p>
`,explain:`<p>Coulomb counting.</p>
`,answer:55,tol:.001,unit:``},{id:`p19-l12-q3`,type:`num`,q:`<p>Number of states in the 1-RC SOC filter?</p>
`,explain:`<p>SOC and the RC voltage.</p>
`,answer:2,tol:.001,unit:``},{id:`p19-l12-q4`,type:`num`,q:`<p>Kalman gain for scalar P 0.04, H 1.2 and R 1e-5?</p>
`,explain:`<p>K = P H / (H² P + R).</p>
`,answer:.833,tol:.003,unit:``},{id:`p19-l12-q5`,type:`mc`,q:`<p>What can Coulomb counting never fix on its own?</p>
`,explain:`<p>It has no feedback.</p>
`,options:[`Sampling at 1 Hz`,`Regenerative pulses`,`A wrong initial SOC`,`Fast current changes`],answer:2},{id:`p19-l12-q6`,type:`mc`,q:`<p>What does the EKF use to correct SOC?</p>
`,explain:`<p>The voltage innovation.</p>
`,options:[`The capacity label`,`Nothing, it only integrates current`,`The temperature only`,`The difference between measured and predicted terminal voltage`],answer:3}],o=[{file:`soc_ekf.py`,lang:`python`,src:`import numpy as np

Q = 3.0 * 3600; R0, R1, C1 = 0.022, 0.015, 1500.0                     # illustrative cell, 1-RC model (Lesson 11)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)
def docv(s): return 1.2 + 3.0 * np.exp(-12 * s) + 0.15 * np.cos(3 * s)

def ride(seconds=3600, seed=3):
    """illustrative stop-and-go e-scooter current for one cell: cruising, hill climbs, stops and regenerative braking."""
    rng = np.random.default_rng(seed); i = np.zeros(seconds); t = 0
    while t < seconds:
        n = rng.integers(10, 60); a = rng.choice([0.0, 1.0, 2.5, 5.0, -1.5], p=[.2, .35, .2, .15, .1])
        i[t:t + n] = a + rng.normal(0, 0.3, min(n, seconds - t)); t += n
    return i

def truth(i, soc0=0.90, dt=1.0, noise=2e-3, seed=4, r0=1.1 * R0, r1=1.2 * R1, c1=C1):
    """the 'real' cell: its resistances are 10 and 20 % higher than the model the estimator uses."""
    rng = np.random.default_rng(seed); a = np.exp(-dt / (r1 * c1)); s, v1 = soc0, 0.0; socs, vs = [], []
    for ik in i:
        vs.append(ocv(s) - r0 * ik - v1 + rng.normal(0, noise)); socs.append(s)
        v1 = a * v1 + r1 * (1 - a) * ik; s -= ik * dt / Q
    return np.array(socs), np.array(vs)

def coulomb(i_meas, soc0, dt=1.0): return soc0 - np.concatenate([[0], np.cumsum(i_meas[:-1])]) * dt / Q

def ekf(i_meas, v_meas, soc0, dt=1.0, q_soc=1e-10, q_v1=1e-7, r=(3e-3)**2, p0=(0.2**2, 1e-4)):
    """state x = [SOC, v1]; predict with the measured current, correct with the terminal voltage."""
    a = np.exp(-dt / (R1 * C1)); F = np.diag([1.0, a]); Qn = np.diag([q_soc, q_v1])
    x = np.array([soc0, 0.0]); P = np.diag(p0); out = []
    for ik, vk in zip(i_meas, v_meas):
        H = np.array([docv(x[0]), -1.0]); y = vk - (ocv(x[0]) - R0 * ik - x[1])
        S = H @ P @ H + r; K = P @ H / S; x = x + K * y; P = (np.eye(2) - np.outer(K, H)) @ P
        out.append(x[0])
        x = np.array([x[0] - ik * dt / Q, a * x[1] + R1 * (1 - a) * ik]); P = F @ P @ F.T + Qn
    return np.array(out)

def test_soc_estimation():
    i = ride(); soc, v = truth(i)
    i_meas = i + 0.10                                                    # current sensor with a 100 mA offset
    cc_good = coulomb(i_meas, 0.90); cc_bad = coulomb(i_meas, 0.70)      # right and wrong starting SOC
    est = ekf(i_meas, v, 0.70)
    e = lambda x: 100 * np.abs(x - soc)
    print(f"true SOC {100 * soc[0]:.1f} % -> {100 * soc[-1]:.1f} % over {len(i) / 60:.0f} min")
    print(f"Coulomb counting, right start: final error {e(cc_good)[-1]:.2f} %")
    print(f"Coulomb counting, start 20 % off: final error {e(cc_bad)[-1]:.2f} %")
    print(f"EKF, start 20 % off: error after 5 min {e(est)[300]:.2f} %, max over the last 50 min {e(est)[600:].max():.2f} %, final {e(est)[-1]:.2f} %")
    assert e(cc_good)[-1] > 1 and e(cc_bad)[-1] > 15 and e(est)[600:].max() < 3

test_soc_estimation()
print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};