var e=`p20-l10`,t=40,n=`The real drone will not match the model. You build a robustness test that flies 300 perturbed copies of the quad (inertia, motor lag, delay and thrust all off by realistic amounts) through the Lesson 09 controller, add sensor noise and a gust, and check that the worst copy still has margin, then confirm the test catches a drone outside the envelope.`,r=`<h2 id="model-mismatch">Model mismatch</h2>
<p>Every parameter in the model is wrong by some amount: the inertia changes with the battery and payload, motors and ESCs differ, the loop delay depends on filtering and scheduling, and thrust falls as the battery drains. A controller that only works for the nominal model is a simulation result, not a flight controller.</p>
<p>The robustness test samples the uncertain parameters from an envelope,</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">xx</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">0.7</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.3</span><span class="mclose">]</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1132em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">m</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">10</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">40</span><span class="mclose">]</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">ms</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">12</span><span class="mclose">]</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">ms</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">0.8</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.2</span><span class="mclose">]</span><span class="mpunct">,</span></span></span></span></span></div>
<p>and asks for every sample: is the minimum phase margin above a floor (30° here), and does the time response with noise and a gust stay within limits? It is a Monte Carlo version of the robust-control questions of Phase 14, and it is what “run it in Gazebo with noise” should mean in practice.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="montecarlo" data-args="{}"></div></div><figcaption>Phase margins of perturbed drones. Change the size of the envelope and the gains; the dots show each sample, the readout gives the worst case and the share below the 30 degree floor.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Lesson 09 gains, envelope above (illustrative):</p>
<ol>
<li>Nominal: rate phase margin 62.4°, attitude 78.6°, no overshoot; a 0.2 N·m gust for 0.2 s pushes roll 3.08° off, and the mean error at the end is 0.50°.</li>
<li>300 perturbed drones: minimum phase margin 34.9°, 5th percentile 41.1°, median 55.2°; none below 30°.</li>
<li>Worst case: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">xx</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> 0.0088 kg·m², motor lag 34 ms, delay 11.3 ms, thrust gain 1.11 (light, slow and strong at once); overshoot 0.2 %, gust error 3.08°, mean error 0.41° at the end.</li>
<li>Outside the envelope (35 ms delay, 50 ms motors): rate margin 6.5°, overshoot 83.5 %. The test notices, which is the point of testing it.</li>
</ol>
<p>The gust error barely changes with the parameters because it is set by the controller’s stiffness <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9805em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">a</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span>, not the inertia.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">robustness.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-comment"># nominal roll axis and the Lesson 09 cascaded controller</span>
NOM = <span class="hljs-built_in">dict</span>(Ixx=<span class="hljs-number">0.012</span>, tau_m=<span class="hljs-number">0.02</span>, delay=<span class="hljs-number">0.006</span>, k_thrust=<span class="hljs-number">1.0</span>)
KP_R, KI_R, KD_R, KP_A, TAU_MAX, T = <span class="hljs-number">0.36</span>, <span class="hljs-number">1.0</span>, <span class="hljs-number">0.004</span>, <span class="hljs-number">6.0</span>, <span class="hljs-number">1.5</span>, <span class="hljs-number">0.002</span>
W = np.logspace(-<span class="hljs-number">1</span>, <span class="hljs-number">3.5</span>, <span class="hljs-number">6000</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">loops</span>(<span class="hljs-params">P</span>):
    s = <span class="hljs-number">1j</span> * W
    C = KP_R + KI_R / s + KD_R * s / (<span class="hljs-number">1</span> + s / <span class="hljs-number">200</span>)
    G = P[<span class="hljs-string">&quot;k_thrust&quot;</span>] * np.exp(-P[<span class="hljs-string">&quot;delay&quot;</span>] * s) / (P[<span class="hljs-string">&quot;tau_m&quot;</span>] * s + <span class="hljs-number">1</span>) / (P[<span class="hljs-string">&quot;Ixx&quot;</span>] * s)
    Li = C * G; Lo = KP_A * Li / (<span class="hljs-number">1</span> + Li) / s
    <span class="hljs-keyword">return</span> Li, Lo

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pm</span>(<span class="hljs-params">L</span>):
    mag, ph = np.<span class="hljs-built_in">abs</span>(L), np.unwrap(np.angle(L)); i = np.where(np.diff(np.sign(mag - <span class="hljs-number">1</span>)))[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">return</span> <span class="hljs-number">180</span> + np.degrees(ph[i[<span class="hljs-number">0</span>]]) <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(i) <span class="hljs-keyword">else</span> <span class="hljs-number">180.0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">P, gust=<span class="hljs-number">0.0</span>, noise=<span class="hljs-number">0.0</span>, t_end=<span class="hljs-number">2.0</span>, dt=<span class="hljs-number">2e-4</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;20 deg roll step with sensor noise and a torque gust at 1 s; returns overshoot (%), worst error after the gust and
    mean error over the last 0.3 s (deg)&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); n_del = <span class="hljs-built_in">int</span>(<span class="hljs-built_in">round</span>(P[<span class="hljs-string">&quot;delay&quot;</span>] / dt)); buf = [<span class="hljs-number">0.0</span>] * (n_del + <span class="hljs-number">1</span>)
    phi = p = tau = integ = d_f = prev_e = u = <span class="hljs-number">0.0</span>; sub = <span class="hljs-built_in">int</span>(T / dt); out = []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(t_end / dt)):
        t = k * dt
        <span class="hljs-keyword">if</span> k % sub == <span class="hljs-number">0</span>:
            phm, pmeas = phi + rng.normal(<span class="hljs-number">0</span>, noise * <span class="hljs-number">0.01</span>), p + rng.normal(<span class="hljs-number">0</span>, noise * <span class="hljs-number">0.05</span>)   <span class="hljs-comment"># 0.6 deg, 3 deg/s per unit</span>
            e = KP_A * (np.radians(<span class="hljs-number">20</span>) - phm) - pmeas; integ += e * T
            d_f += T * <span class="hljs-number">200</span> * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            <span class="hljs-keyword">if</span> u != u_raw: integ -= e * T
        buf.append(u); ud = buf.pop(<span class="hljs-number">0</span>)
        tau += dt / P[<span class="hljs-string">&quot;tau_m&quot;</span>] * (P[<span class="hljs-string">&quot;k_thrust&quot;</span>] * ud - tau)
        p += dt * (tau + (gust <span class="hljs-keyword">if</span> <span class="hljs-number">1.0</span> &lt;= t &lt; <span class="hljs-number">1.2</span> <span class="hljs-keyword">else</span> <span class="hljs-number">0.0</span>)) / P[<span class="hljs-string">&quot;Ixx&quot;</span>]; phi += dt * p
        out.append(np.degrees(phi))
    out = np.array(out); i17 = <span class="hljs-built_in">int</span>(<span class="hljs-number">1.7</span> / dt)
    <span class="hljs-keyword">return</span> <span class="hljs-number">100</span> * (out[:<span class="hljs-built_in">int</span>(<span class="hljs-number">1.0</span> / dt)].<span class="hljs-built_in">max</span>() - <span class="hljs-number">20</span>) / <span class="hljs-number">20</span>, np.<span class="hljs-built_in">abs</span>(out[<span class="hljs-built_in">int</span>(<span class="hljs-number">1.0</span> / dt):] - <span class="hljs-number">20</span>).<span class="hljs-built_in">max</span>(), np.<span class="hljs-built_in">abs</span>(out[i17:] - <span class="hljs-number">20</span>).mean()

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sample</span>(<span class="hljs-params">rng</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">dict</span>(Ixx=NOM[<span class="hljs-string">&quot;Ixx&quot;</span>] * rng.uniform(<span class="hljs-number">0.7</span>, <span class="hljs-number">1.3</span>),            <span class="hljs-comment"># payload, battery position</span>
                tau_m=rng.uniform(<span class="hljs-number">0.01</span>, <span class="hljs-number">0.04</span>),                     <span class="hljs-comment"># ESC and motor differences</span>
                delay=rng.uniform(<span class="hljs-number">0.002</span>, <span class="hljs-number">0.012</span>),                   <span class="hljs-comment"># scheduling, filtering</span>
                k_thrust=rng.uniform(<span class="hljs-number">0.8</span>, <span class="hljs-number">1.2</span>))                    <span class="hljs-comment"># battery voltage, propeller wear</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_nominal</span>():
    Li, Lo = loops(NOM); ov, gust_err, late = step(NOM, gust=<span class="hljs-number">0.2</span>, noise=<span class="hljs-number">1.0</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;nominal: rate PM <span class="hljs-subst">{pm(Li):<span class="hljs-number">.1</span>f}</span> deg, attitude PM <span class="hljs-subst">{pm(Lo):<span class="hljs-number">.1</span>f}</span> deg, overshoot <span class="hljs-subst">{ov:<span class="hljs-number">.1</span>f}</span> %, &quot;</span>
          <span class="hljs-string">f&quot;0.2 N m gust for 0.2 s: worst error <span class="hljs-subst">{gust_err:<span class="hljs-number">.2</span>f}</span> deg, mean error at the end <span class="hljs-subst">{late:<span class="hljs-number">.2</span>f}</span> deg&quot;</span>)
    <span class="hljs-keyword">assert</span> pm(Li) &gt; <span class="hljs-number">45</span> <span class="hljs-keyword">and</span> pm(Lo) &gt; <span class="hljs-number">45</span> <span class="hljs-keyword">and</span> ov &lt; <span class="hljs-number">10</span> <span class="hljs-keyword">and</span> gust_err &lt; <span class="hljs-number">5</span> <span class="hljs-keyword">and</span> late &lt; <span class="hljs-number">0.8</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_monte_carlo</span>(<span class="hljs-params">n=<span class="hljs-number">300</span></span>):
    rng = np.random.default_rng(<span class="hljs-number">42</span>); worst = <span class="hljs-literal">None</span>; pms = []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        P = sample(rng); Li, Lo = loops(P); m = <span class="hljs-built_in">min</span>(pm(Li), pm(Lo)); pms.append(m)
        <span class="hljs-keyword">if</span> worst <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> m &lt; worst[<span class="hljs-number">0</span>]: worst = (m, P)
    pms = np.array(pms)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{n}</span> perturbed drones: phase margin min <span class="hljs-subst">{pms.<span class="hljs-built_in">min</span>():<span class="hljs-number">.1</span>f}</span> deg, 5th percentile <span class="hljs-subst">{np.percentile(pms, <span class="hljs-number">5</span>):<span class="hljs-number">.1</span>f}</span> deg, &quot;</span>
          <span class="hljs-string">f&quot;median <span class="hljs-subst">{np.median(pms):<span class="hljs-number">.1</span>f}</span> deg; <span class="hljs-subst">{np.mean(pms &lt; <span class="hljs-number">30</span>) * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> % below 30 deg&quot;</span>)
    m, P = worst; ov, ge, late = step(P, gust=<span class="hljs-number">0.2</span>, noise=<span class="hljs-number">1.0</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;worst case:&quot;</span>, {k: <span class="hljs-built_in">round</span>(v, <span class="hljs-number">4</span>) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> P.items()}, <span class="hljs-string">f&quot;-&gt; overshoot <span class="hljs-subst">{ov:<span class="hljs-number">.1</span>f}</span> %, gust error <span class="hljs-subst">{ge:<span class="hljs-number">.2</span>f}</span> deg, mean error at the end <span class="hljs-subst">{late:<span class="hljs-number">.2</span>f}</span> deg&quot;</span>)
    <span class="hljs-keyword">assert</span> pms.<span class="hljs-built_in">min</span>() &gt; <span class="hljs-number">30</span> <span class="hljs-keyword">and</span> ov &lt; <span class="hljs-number">20</span> <span class="hljs-keyword">and</span> late &lt; <span class="hljs-number">0.8</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_beyond_envelope</span>():
    P = <span class="hljs-built_in">dict</span>(NOM, delay=<span class="hljs-number">0.035</span>, tau_m=<span class="hljs-number">0.05</span>)               <span class="hljs-comment"># far outside the envelope: the test must notice</span>
    Li, Lo = loops(P); ov, _, late = step(P)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;35 ms delay, 50 ms motors: rate PM <span class="hljs-subst">{pm(Li):<span class="hljs-number">.1</span>f}</span> deg, overshoot <span class="hljs-subst">{ov:<span class="hljs-number">.1</span>f}</span> %&quot;</span>)
    <span class="hljs-keyword">assert</span> pm(Li) &lt; <span class="hljs-number">20</span>

test_nominal(); test_monte_carlo(); test_beyond_envelope(); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Gazebo with the PX4 software-in-the-loop setup runs the real firmware against a physics model; randomising its parameters and adding wind and sensor noise turns it into this test. Measure the envelope rather than guessing it: weigh the drone with each battery, measure motor step responses on a thrust stand, and log the loop delay. Then fly, tethered or low, and compare the logs with the simulation.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why is the worst case light, slow and strong at once?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Lower inertia and higher thrust gain both raise the loop gain, pushing the crossover up, where the slower motor and longer delay add the most phase lag. The margin falls from both sides.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>How would you make the controller robust to a 20 ms delay?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Lower the rate crossover so that <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> stays small (for example 30° of lag at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">26</span></span></span></span> rad/s), then lower the attitude gain to keep the separation. The drone becomes slower but stays stable; reducing the delay itself is better.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l10"></div>
`,i=[{id:`model-mismatch`,title:`Model mismatch`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l10-q1`,type:`num`,q:`<p>Phase lag of 12 ms delay at 27.8 rad/s (degrees)?</p>
`,explain:`<p>ωTd.</p>
`,answer:19.1,tol:.005,unit:``},{id:`p20-l10-q2`,type:`num`,q:`<p>Cascade stiffness k_a k_p for 6 and 0.36 (N·m/rad)?</p>
`,explain:`<p>Product of the gains.</p>
`,answer:2.16,tol:.005,unit:``},{id:`p20-l10-q3`,type:`num`,q:`<p>Static roll error from 0.2 N·m with that stiffness (degrees)?</p>
`,explain:`<p>τ/k.</p>
`,answer:5.31,tol:.005,unit:``},{id:`p20-l10-q4`,type:`num`,q:`<p>Relative loop gain change for 0.7 inertia and 1.2 thrust gain?</p>
`,explain:`<p>k_T / (I/I0).</p>
`,answer:1.714,tol:.005,unit:``},{id:`p20-l10-q5`,type:`mc`,q:`<p>What should a robustness test also check, besides the samples inside the envelope?</p>
`,explain:`<p>A test that never fails proves nothing.</p>
`,options:[`That the integrator is off`,`That a drone outside the envelope fails it`,`That the nominal model is exact`,`That noise is zero`],answer:1},{id:`p20-l10-q6`,type:`mc`,q:`<p>Where should the envelope come from?</p>
`,explain:`<p>Measure, then test.</p>
`,options:[`The controller gains`,`The nominal model`,`Measurements of the real drone and its variation`,`The simulator defaults`],answer:2}],o=[{file:`robustness.py`,lang:`python`,src:`import numpy as np

# nominal roll axis and the Lesson 09 cascaded controller
NOM = dict(Ixx=0.012, tau_m=0.02, delay=0.006, k_thrust=1.0)
KP_R, KI_R, KD_R, KP_A, TAU_MAX, T = 0.36, 1.0, 0.004, 6.0, 1.5, 0.002
W = np.logspace(-1, 3.5, 6000)

def loops(P):
    s = 1j * W
    C = KP_R + KI_R / s + KD_R * s / (1 + s / 200)
    G = P["k_thrust"] * np.exp(-P["delay"] * s) / (P["tau_m"] * s + 1) / (P["Ixx"] * s)
    Li = C * G; Lo = KP_A * Li / (1 + Li) / s
    return Li, Lo

def pm(L):
    mag, ph = np.abs(L), np.unwrap(np.angle(L)); i = np.where(np.diff(np.sign(mag - 1)))[0]
    return 180 + np.degrees(ph[i[0]]) if len(i) else 180.0

def step(P, gust=0.0, noise=0.0, t_end=2.0, dt=2e-4, seed=0):
    """20 deg roll step with sensor noise and a torque gust at 1 s; returns overshoot (%), worst error after the gust and
    mean error over the last 0.3 s (deg)"""
    rng = np.random.default_rng(seed); n_del = int(round(P["delay"] / dt)); buf = [0.0] * (n_del + 1)
    phi = p = tau = integ = d_f = prev_e = u = 0.0; sub = int(T / dt); out = []
    for k in range(int(t_end / dt)):
        t = k * dt
        if k % sub == 0:
            phm, pmeas = phi + rng.normal(0, noise * 0.01), p + rng.normal(0, noise * 0.05)   # 0.6 deg, 3 deg/s per unit
            e = KP_A * (np.radians(20) - phm) - pmeas; integ += e * T
            d_f += T * 200 * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            if u != u_raw: integ -= e * T
        buf.append(u); ud = buf.pop(0)
        tau += dt / P["tau_m"] * (P["k_thrust"] * ud - tau)
        p += dt * (tau + (gust if 1.0 <= t < 1.2 else 0.0)) / P["Ixx"]; phi += dt * p
        out.append(np.degrees(phi))
    out = np.array(out); i17 = int(1.7 / dt)
    return 100 * (out[:int(1.0 / dt)].max() - 20) / 20, np.abs(out[int(1.0 / dt):] - 20).max(), np.abs(out[i17:] - 20).mean()

def sample(rng):
    return dict(Ixx=NOM["Ixx"] * rng.uniform(0.7, 1.3),            # payload, battery position
                tau_m=rng.uniform(0.01, 0.04),                     # ESC and motor differences
                delay=rng.uniform(0.002, 0.012),                   # scheduling, filtering
                k_thrust=rng.uniform(0.8, 1.2))                    # battery voltage, propeller wear

def test_nominal():
    Li, Lo = loops(NOM); ov, gust_err, late = step(NOM, gust=0.2, noise=1.0)
    print(f"nominal: rate PM {pm(Li):.1f} deg, attitude PM {pm(Lo):.1f} deg, overshoot {ov:.1f} %, "
          f"0.2 N m gust for 0.2 s: worst error {gust_err:.2f} deg, mean error at the end {late:.2f} deg")
    assert pm(Li) > 45 and pm(Lo) > 45 and ov < 10 and gust_err < 5 and late < 0.8

def test_monte_carlo(n=300):
    rng = np.random.default_rng(42); worst = None; pms = []
    for k in range(n):
        P = sample(rng); Li, Lo = loops(P); m = min(pm(Li), pm(Lo)); pms.append(m)
        if worst is None or m < worst[0]: worst = (m, P)
    pms = np.array(pms)
    print(f"{n} perturbed drones: phase margin min {pms.min():.1f} deg, 5th percentile {np.percentile(pms, 5):.1f} deg, "
          f"median {np.median(pms):.1f} deg; {np.mean(pms < 30) * 100:.1f} % below 30 deg")
    m, P = worst; ov, ge, late = step(P, gust=0.2, noise=1.0)
    print("worst case:", {k: round(v, 4) for k, v in P.items()}, f"-> overshoot {ov:.1f} %, gust error {ge:.2f} deg, mean error at the end {late:.2f} deg")
    assert pms.min() > 30 and ov < 20 and late < 0.8

def test_beyond_envelope():
    P = dict(NOM, delay=0.035, tau_m=0.05)               # far outside the envelope: the test must notice
    Li, Lo = loops(P); ov, _, late = step(P)
    print(f"35 ms delay, 50 ms motors: rate PM {pm(Li):.1f} deg, overshoot {ov:.1f} %")
    assert pm(Li) < 20

test_nominal(); test_monte_carlo(); test_beyond_envelope(); print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};