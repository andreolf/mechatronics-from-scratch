var e=`p14-l07`,t=45,n=`LQR turns the cart-pole balancing problem into choosing weights, and one design handles the pole angle and the cart position together. You linearise the pendulum lab’s model at upright, pick weights with Bryson-style reasoning, simulate the LQR on the full nonlinear model with the lab’s force limit and actuator lag, test that it recovers from 15 degrees, and compare its recovery with the PID from Phase 13.`,r=`<h2 id="linear-model-and-weights">Linear model and weights</h2>
<p>Linearise the <a href="#lab-pendulum">pendulum lab</a>’s cart-pole at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>, including its small friction terms: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6679em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6679em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">x</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1111em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">A</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mord mathnormal" style="margin-right:0.1389em;">F</span></span></span></span> with states <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1813em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6679em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">x</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1111em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9313em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.0556em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span>. The linearisation in code uses central differences on the same nonlinear model the simulation runs, so model and plant agree exactly at upright.</p>
<p>Weights, Bryson style:</p>
<ul>
<li>angle: we’d accept about 0.14 rad (8°) in a recovery, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">θ</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord">1/0.1</span><span class="mord"><span class="mord">4</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">50</span></span></span></span>;</li>
<li>cart position: about 0.45 m of travel, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span>;</li>
<li>rates: lightly weighted, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, mainly to add damping;</li>
<li>force: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.05</span></span></span></span>, so about 4.5 N costs as much as a 1 m position error.</li>
</ul>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathrm" style="margin-right:0.0139em;">diag</span></span><span class="mopen">(</span><span class="mord">5</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">50</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mclose">)</span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.05.</span></span></span></span></span></div>
<p>The resulting gain has four entries, and their signs tell the story: positive tilt calls for a push in the direction of the tilt (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">θ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">F</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="mord mathnormal">x</span></span></span></span>) and, less intuitively, cart position error also gets a push <em>away</em> from the target first (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>): to move the cart right you must first tilt the pole right, which takes a step left.</p>
<h2 id="what-the-simulation-adds">What the simulation adds</h2>
<p>The design model ignores three things the lab has: the 30 N force limit, a 20 ms actuator lag, and a 200 Hz controller update. The test runs the full nonlinear model with all three. LQR’s guaranteed margins (at least 60° of phase margin, and the loop gain can halve or grow without limit, for the ideal continuous design) are why it shrugs these off.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="lqrcartpole" data-args="{}"></div></div><figcaption>The cart-pole recovering from a starting tilt under LQR and under the Phase 13 PID. Raise the angle and change the weight on the angle: LQR brings the cart back to the centre as part of the same design, while the PID’s cart loop is slower.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>With the weights above:</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">−</span><span class="mord">10.0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">10.7</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">72.9</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">16.3</span><span class="mclose">)</span></span></span></span>.</li>
<li>From 15°: the angle settles within 0.5° in 2.3 s, the cart travels 0.33 m and returns within 1 cm by 2.9 s, peak force 19 N, inside the 30 N limit.</li>
<li>The Phase 13 PID settles the angle in a similar time (1.9 s) but takes 7.9 s to bring the cart back: its cart terms are a slow outer correction, not part of one optimal design.</li>
<li>With the force limit, this LQR recovers from up to about 55° in simulation.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">lqr_cartpole.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy.linalg <span class="hljs-keyword">import</span> solve_continuous_are

M, m, l, g = <span class="hljs-number">0.8</span>, <span class="hljs-number">0.25</span>, <span class="hljs-number">0.45</span>, <span class="hljs-number">9.81</span>
Fmax, tauA = <span class="hljs-number">30.0</span>, <span class="hljs-number">0.02</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">deriv</span>(<span class="hljs-params">s, F</span>):
    <span class="hljs-string">&quot;&quot;&quot;the live lab&#x27;s cart-pole (uniform rod, small joint and cart friction)&quot;&quot;&quot;</span>
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (<span class="hljs-number">4</span> / <span class="hljs-number">3</span> - m * cs * cs / tot)) - <span class="hljs-number">0.02</span> * thd
    <span class="hljs-keyword">return</span> np.array([xd, temp - m * l * thdd * cs / tot - <span class="hljs-number">0.3</span> * xd, thd, thdd])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">linearise</span>():
    f = <span class="hljs-keyword">lambda</span> s, F: deriv(s, F)
    A = np.column_stack([(f(e * <span class="hljs-number">1e-6</span>, <span class="hljs-number">0</span>) - f(-e * <span class="hljs-number">1e-6</span>, <span class="hljs-number">0</span>)) / <span class="hljs-number">2e-6</span> <span class="hljs-keyword">for</span> e <span class="hljs-keyword">in</span> np.eye(<span class="hljs-number">4</span>)])
    B = ((f(np.zeros(<span class="hljs-number">4</span>), <span class="hljs-number">1e-6</span>) - f(np.zeros(<span class="hljs-number">4</span>), -<span class="hljs-number">1e-6</span>)) / <span class="hljs-number">2e-6</span>)[:, <span class="hljs-literal">None</span>]
    <span class="hljs-keyword">return</span> A, B

<span class="hljs-keyword">def</span> <span class="hljs-title function_">lqr_gain</span>(<span class="hljs-params">Q, R</span>):
    A, B = linearise(); P = solve_continuous_are(A, B, Q, R)
    <span class="hljs-keyword">return</span> np.linalg.solve(R, B.T @ P)[<span class="hljs-number">0</span>]

Q0, R0 = np.diag([<span class="hljs-number">5.0</span>, <span class="hljs-number">1.0</span>, <span class="hljs-number">50.0</span>, <span class="hljs-number">1.0</span>]), np.array([[<span class="hljs-number">0.05</span>]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">policy, th0_deg, T=<span class="hljs-number">10.0</span></span>):
    h, every = <span class="hljs-number">1e-3</span>, <span class="hljs-number">5</span>; dt = h * every                        <span class="hljs-comment"># physics 1 kHz, control 200 Hz like the lab</span>
    s = np.array([<span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>, np.radians(th0_deg), <span class="hljs-number">0.0</span>]); F = Fc = <span class="hljs-number">0.0</span>; mem = {}
    ths, xs, Fs = [], [], []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(T / h)):
        <span class="hljs-keyword">if</span> k % every == <span class="hljs-number">0</span>: Fc = <span class="hljs-built_in">float</span>(np.clip(policy(s, dt, mem), -Fmax, Fmax))
        F += h / tauA * (Fc - F)                               <span class="hljs-comment"># actuator lag, not in the LQR model</span>
        k1 = deriv(s, F); k2 = deriv(s + h / <span class="hljs-number">2</span> * k1, F); k3 = deriv(s + h / <span class="hljs-number">2</span> * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / <span class="hljs-number">6</span> * (k1 + <span class="hljs-number">2</span> * k2 + <span class="hljs-number">2</span> * k3 + k4)
        ths.append(s[<span class="hljs-number">2</span>]); xs.append(s[<span class="hljs-number">0</span>]); Fs.append(Fc)
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(s[<span class="hljs-number">2</span>]) &gt; <span class="hljs-number">1.0</span>: <span class="hljs-keyword">break</span>
    <span class="hljs-keyword">return</span> np.array(ths), np.array(xs), np.array(Fs)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">lqr_policy</span>(<span class="hljs-params">K</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">lambda</span> s, dt, mem: -K @ s

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pid_policy</span>(<span class="hljs-params">s, dt, mem, Kp=<span class="hljs-number">38.0</span>, Ki=<span class="hljs-number">6.0</span>, Kd=<span class="hljs-number">7.0</span>, kx=<span class="hljs-number">1.6</span>, kv=<span class="hljs-number">2.6</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;lesson p13-l07&#x27;s PID on the angle with cart-position terms&quot;&quot;&quot;</span>
    th = s[<span class="hljs-number">2</span>]; a = np.exp(-dt / <span class="hljs-number">0.012</span>)
    mem[<span class="hljs-string">&quot;d&quot;</span>] = a * mem.get(<span class="hljs-string">&quot;d&quot;</span>, <span class="hljs-number">0.0</span>) + (<span class="hljs-number">1</span> - a) * (th - mem.get(<span class="hljs-string">&quot;prev&quot;</span>, th)) / dt; mem[<span class="hljs-string">&quot;prev&quot;</span>] = th
    mem[<span class="hljs-string">&quot;i&quot;</span>] = np.clip(mem.get(<span class="hljs-string">&quot;i&quot;</span>, <span class="hljs-number">0.0</span>) + th * dt, -<span class="hljs-number">0.5</span>, <span class="hljs-number">0.5</span>)
    <span class="hljs-keyword">return</span> Kp * th + Ki * mem[<span class="hljs-string">&quot;i&quot;</span>] + Kd * mem[<span class="hljs-string">&quot;d&quot;</span>] + kx * s[<span class="hljs-number">0</span>] + kv * s[<span class="hljs-number">1</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">settle_time</span>(<span class="hljs-params">th, tol=np.radians(<span class="hljs-params"><span class="hljs-number">0.5</span></span>)</span>):
    out = np.where(np.<span class="hljs-built_in">abs</span>(th) &gt; tol)[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">return</span> (out[-<span class="hljs-number">1</span>] + <span class="hljs-number">1</span>) / <span class="hljs-number">1000</span> <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(out) <span class="hljs-keyword">else</span> <span class="hljs-number">0.0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_lqr_stabilises_from_15_deg</span>():
    K = lqr_gain(Q0, R0)
    th, x, F = run(lqr_policy(K), <span class="hljs-number">15.0</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;LQR K = <span class="hljs-subst">{np.<span class="hljs-built_in">round</span>(K, <span class="hljs-number">2</span>)}</span>&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;LQR from 15 deg: upright <span class="hljs-subst">{<span class="hljs-built_in">len</span>(th) / <span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> s, settles within 0.5 deg at <span class="hljs-subst">{settle_time(th):<span class="hljs-number">.2</span>f}</span> s, cart travel <span class="hljs-subst">{np.<span class="hljs-built_in">abs</span>(x).<span class="hljs-built_in">max</span>():<span class="hljs-number">.2</span>f}</span> m, peak force <span class="hljs-subst">{np.<span class="hljs-built_in">abs</span>(F).<span class="hljs-built_in">max</span>():<span class="hljs-number">.1</span>f}</span> N&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(th) == <span class="hljs-number">10000</span> <span class="hljs-keyword">and</span> np.<span class="hljs-built_in">abs</span>(th[-<span class="hljs-number">1</span>]) &lt; <span class="hljs-number">1e-3</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(x[-<span class="hljs-number">1</span>]) &lt; <span class="hljs-number">0.01</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">cart_settle</span>(<span class="hljs-params">x, tol=<span class="hljs-number">0.01</span></span>):
    out = np.where(np.<span class="hljs-built_in">abs</span>(x) &gt; tol)[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">return</span> (out[-<span class="hljs-number">1</span>] + <span class="hljs-number">1</span>) / <span class="hljs-number">1000</span> <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(out) <span class="hljs-keyword">else</span> <span class="hljs-number">0.0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_compare_with_pid</span>():
    K = lqr_gain(Q0, R0)
    <span class="hljs-keyword">for</span> deg <span class="hljs-keyword">in</span> (<span class="hljs-number">5.0</span>, <span class="hljs-number">15.0</span>):
        tl, xl, _ = run(lqr_policy(K), deg, T=<span class="hljs-number">20.0</span>); tp, xp, _ = run(pid_policy, deg, T=<span class="hljs-number">20.0</span>)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;from <span class="hljs-subst">{deg:<span class="hljs-number">4.1</span>f}</span> deg | LQR: angle settles <span class="hljs-subst">{settle_time(tl):<span class="hljs-number">.2</span>f}</span> s, cart back within 1 cm at <span class="hljs-subst">{cart_settle(xl):<span class="hljs-number">.2</span>f}</span> s&quot;</span>
              <span class="hljs-string">f&quot; | PID: angle <span class="hljs-subst">{settle_time(tp):<span class="hljs-number">.2</span>f}</span> s, cart <span class="hljs-subst">{cart_settle(xp):<span class="hljs-number">.2</span>f}</span> s&quot;</span>)
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(tl) == <span class="hljs-built_in">len</span>(tp) == <span class="hljs-number">20000</span>
        <span class="hljs-keyword">assert</span> cart_settle(xl) &lt; cart_settle(xp)          <span class="hljs-comment"># one design handles angle and cart together</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_largest_recoverable_angle</span>():
    K = lqr_gain(Q0, R0); lo, hi = <span class="hljs-number">15.0</span>, <span class="hljs-number">60.0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">12</span>):
        mid = (lo + hi) / <span class="hljs-number">2</span>; th, _, _ = run(lqr_policy(K), mid, T=<span class="hljs-number">6.0</span>)
        lo, hi = (mid, hi) <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(th) == <span class="hljs-number">6000</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(th[-<span class="hljs-number">1</span>]) &lt; <span class="hljs-number">0.02</span> <span class="hljs-keyword">else</span> (lo, mid)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;with the 30 N force limit, this LQR recovers from up to about <span class="hljs-subst">{lo:<span class="hljs-number">.0</span>f}</span> deg&quot;</span>)
    <span class="hljs-keyword">assert</span> lo &gt; <span class="hljs-number">15</span>

test_lqr_stabilises_from_15_deg()
test_compare_with_pid()
test_largest_recoverable_angle()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Raise <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">θ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> from 50 to 500. What changes in the gains and the response?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The angle gains grow and the pole is held more tightly upright: smaller peak tilt in a recovery, but more force and faster cart motion, and more sensitivity to sensor noise and to the actuator lag the model ignores. Eventually the force limit is hit on large starts, and the recoverable angle can shrink.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why must the cart move away from its target first?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The force-to-position path is non-minimum phase once the pole must stay up. To accelerate the cart right in steady fashion, the pole must lean right, and the only way to lean it right is to move the cart’s base left first. The LQR gain <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> encodes that.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p14-l07"></div>
`,i=[{id:`linear-model-and-weights`,title:`Linear model and weights`},{id:`what-the-simulation-adds`,title:`What the simulation adds`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p14-l07-q1`,type:`num`,q:`<p>Bryson weight for an acceptable angle of 0.14 rad?</p>
`,explain:`<p>Q = 1/x_max².</p>
`,answer:51.02,tol:.01,unit:``},{id:`p14-l07-q2`,type:`num`,q:`<p>Force in N that costs as much as a 1 m position error with Q_x = 5 and R = 0.05?</p>
`,explain:`<p>R F² = Q_x x², so F = √(Q_x/R).</p>
`,answer:10,tol:.001,unit:`N`},{id:`p14-l07-q3`,type:`num`,q:`<p>Control period in ms at 200 Hz?</p>
`,explain:`<p>The lab’s controller rate.</p>
`,answer:5,tol:.001,unit:`ms`},{id:`p14-l07-q4`,type:`num`,q:`<p>Guaranteed phase margin in degrees of a continuous single-input LQR?</p>
`,explain:`<p>From the return-difference inequality |1 + L(jω)| ≥ 1.</p>
`,answer:60,tol:.001,unit:`deg`},{id:`p14-l07-q5`,type:`mc`,q:`<p>Compared with the Phase 13 PID, the LQR’s main advantage here is…</p>
`,explain:`<p>Angle and cart are weighed together.</p>
`,options:[`it never needs a model`,`it brings the cart back much sooner as part of one design`,`it settles the angle ten times faster`,`it uses no force`],answer:1},{id:`p14-l07-q6`,type:`mc`,q:`<p>What did the design model leave out that the test includes?</p>
`,explain:`<p>The nonlinear simulation adds all three.</p>
`,options:[`gravity`,`force limit, actuator lag and sampling`,`the cart mass`,`the pole length`],answer:1}],o=[{file:`lqr_cartpole.py`,lang:`python`,src:`import numpy as np
from scipy.linalg import solve_continuous_are

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA = 30.0, 0.02

def deriv(s, F):
    """the live lab's cart-pole (uniform rod, small joint and cart friction)"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    f = lambda s, F: deriv(s, F)
    A = np.column_stack([(f(e * 1e-6, 0) - f(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((f(np.zeros(4), 1e-6) - f(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

def lqr_gain(Q, R):
    A, B = linearise(); P = solve_continuous_are(A, B, Q, R)
    return np.linalg.solve(R, B.T @ P)[0]

Q0, R0 = np.diag([5.0, 1.0, 50.0, 1.0]), np.array([[0.05]])

def run(policy, th0_deg, T=10.0):
    h, every = 1e-3, 5; dt = h * every                        # physics 1 kHz, control 200 Hz like the lab
    s = np.array([0.0, 0.0, np.radians(th0_deg), 0.0]); F = Fc = 0.0; mem = {}
    ths, xs, Fs = [], [], []
    for k in range(int(T / h)):
        if k % every == 0: Fc = float(np.clip(policy(s, dt, mem), -Fmax, Fmax))
        F += h / tauA * (Fc - F)                               # actuator lag, not in the LQR model
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ths.append(s[2]); xs.append(s[0]); Fs.append(Fc)
        if abs(s[2]) > 1.0: break
    return np.array(ths), np.array(xs), np.array(Fs)

def lqr_policy(K):
    return lambda s, dt, mem: -K @ s

def pid_policy(s, dt, mem, Kp=38.0, Ki=6.0, Kd=7.0, kx=1.6, kv=2.6):
    """lesson p13-l07's PID on the angle with cart-position terms"""
    th = s[2]; a = np.exp(-dt / 0.012)
    mem["d"] = a * mem.get("d", 0.0) + (1 - a) * (th - mem.get("prev", th)) / dt; mem["prev"] = th
    mem["i"] = np.clip(mem.get("i", 0.0) + th * dt, -0.5, 0.5)
    return Kp * th + Ki * mem["i"] + Kd * mem["d"] + kx * s[0] + kv * s[1]

def settle_time(th, tol=np.radians(0.5)):
    out = np.where(np.abs(th) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_lqr_stabilises_from_15_deg():
    K = lqr_gain(Q0, R0)
    th, x, F = run(lqr_policy(K), 15.0)
    print(f"LQR K = {np.round(K, 2)}")
    print(f"LQR from 15 deg: upright {len(th) / 1000:.1f} s, settles within 0.5 deg at {settle_time(th):.2f} s, cart travel {np.abs(x).max():.2f} m, peak force {np.abs(F).max():.1f} N")
    assert len(th) == 10000 and np.abs(th[-1]) < 1e-3 and abs(x[-1]) < 0.01

def cart_settle(x, tol=0.01):
    out = np.where(np.abs(x) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_compare_with_pid():
    K = lqr_gain(Q0, R0)
    for deg in (5.0, 15.0):
        tl, xl, _ = run(lqr_policy(K), deg, T=20.0); tp, xp, _ = run(pid_policy, deg, T=20.0)
        print(f"from {deg:4.1f} deg | LQR: angle settles {settle_time(tl):.2f} s, cart back within 1 cm at {cart_settle(xl):.2f} s"
              f" | PID: angle {settle_time(tp):.2f} s, cart {cart_settle(xp):.2f} s")
        assert len(tl) == len(tp) == 20000
        assert cart_settle(xl) < cart_settle(xp)          # one design handles angle and cart together

def test_largest_recoverable_angle():
    K = lqr_gain(Q0, R0); lo, hi = 15.0, 60.0
    for _ in range(12):
        mid = (lo + hi) / 2; th, _, _ = run(lqr_policy(K), mid, T=6.0)
        lo, hi = (mid, hi) if len(th) == 6000 and abs(th[-1]) < 0.02 else (lo, mid)
    print(f"with the 30 N force limit, this LQR recovers from up to about {lo:.0f} deg")
    assert lo > 15

test_lqr_stabilises_from_15_deg()
test_compare_with_pid()
test_largest_recoverable_angle()
print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};