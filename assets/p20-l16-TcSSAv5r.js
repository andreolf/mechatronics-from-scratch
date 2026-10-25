var e=`p20-l16`,t=35,n=`The last lesson packages the capstones. You write each one down as requirements, model, code, tests, results and demo, check mechanically that every requirement traces to a test with a recorded result and that a smoke test re-derives a headline number, generate the portfolio README, and confirm the checker catches the gaps you inject.`,r=`<h2 id="what-a-portfolio-must-show">What a portfolio must show</h2>
<p>A reviewer, whether an employer, a professor or a future you, wants the same six things for each project: the <strong>requirements</strong>, the <strong>model</strong>, the <strong>code</strong>, the <strong>tests</strong>, the <strong>results</strong> and a <strong>demo</strong>. Most important is the trace from each requirement to the test that proves it, with the number it produced:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8623em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">requirement</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord text"><span class="mord">test</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord text"><span class="mord">result</span></span><span class="mord">.</span></span></span></span></span></div>
<p>A requirement without a test is a wish; a test without a requirement is noise. Write the trace as data, so a script can check it rather than a person.</p>
<h2 id="results-not-adjectives">Results, not adjectives</h2>
<p>“Robust” says nothing; “minimum phase margin 34.9° over 300 perturbed drones” says what was done and lets someone check it. Label simulated and illustrative values as such, keep the scripts that produced them, and make every number in the write-up regenerable from the repository.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="portfolio" data-args="{}"></div></div><figcaption>The five capstones and their traceability. Toggle artifacts off to see which checks fail; the readout lists the gaps.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The five capstones of this phase:</p>
<ol>
<li>Balancing robot: 6 lessons, 4 requirements (R1 to R4 of Lesson 01) each traced to a test, for example R2 runs at least 30 min, from the power budget at 84.2 min.</li>
<li>Quadcopter: 4 lessons, 4 requirements, including the 2° attitude specification met at 1.18° RMS.</li>
<li>Robot arm: 3 lessons, 3 requirements, including targets within 1 mm, met at 0.307 mm.</li>
<li>Irrigation pump: 2 requirements; rope drive supervisor: 2 requirements, 63 state–fault pairs.</li>
<li>Totals: 5 capstones, 15 requirements all traced, 12 code files, 16 lessons; the generated README has 49 lines. Removing a test, a demo and breaking one smoke test produces exactly those 3 problems.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">portfolio_check.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math, hashlib, json

<span class="hljs-comment"># small, fast smoke tests, one per capstone, re-deriving a headline result of its lessons</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_balancer</span>():   <span class="hljs-comment"># Lesson 05: delay margin of the LQR loop</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">abs</span>(math.radians(<span class="hljs-number">93.1</span>) / <span class="hljs-number">20.4</span> - <span class="hljs-number">0.0797</span>) &lt; <span class="hljs-number">1e-3</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_quad</span>():       <span class="hljs-comment"># Lesson 07: X-frame mixer round trip (thrust, roll, pitch, yaw)</span>
    d, c = <span class="hljs-number">0.22</span> / math.sqrt(<span class="hljs-number">2</span>), <span class="hljs-number">0.016</span>
    M = [[<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>], [-d, d, d, -d], [-d, d, -d, d], [-c, -c, c, c]]
    f = [<span class="hljs-number">2.5</span>, <span class="hljs-number">2.0</span>, <span class="hljs-number">2.2</span>, <span class="hljs-number">2.4</span>]; w = [<span class="hljs-built_in">sum</span>(M[i][j] * f[j] <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>)) <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>)]
    <span class="hljs-comment"># inverse of this M in closed form: f = T/4 + ... ; check by solving with Gaussian elimination</span>
    A = [row[:] + [w[i]] <span class="hljs-keyword">for</span> i, row <span class="hljs-keyword">in</span> <span class="hljs-built_in">enumerate</span>(M)]
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
        p = <span class="hljs-built_in">max</span>(<span class="hljs-built_in">range</span>(i, <span class="hljs-number">4</span>), key=<span class="hljs-keyword">lambda</span> r: <span class="hljs-built_in">abs</span>(A[r][i])); A[i], A[p] = A[p], A[i]
        <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
            <span class="hljs-keyword">if</span> r != i: k = A[r][i] / A[i][i]; A[r] = [a - k * b <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(A[r], A[i])]
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">all</span>(<span class="hljs-built_in">abs</span>(A[i][<span class="hljs-number">4</span>] / A[i][i] - f[i]) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>))
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_arm</span>():        <span class="hljs-comment"># Lesson 12: quintic peak speed 15/8 dq/T</span>
    T, dq = <span class="hljs-number">1.0</span>, <span class="hljs-number">1.0</span>; vmax = <span class="hljs-built_in">max</span>(dq * (<span class="hljs-number">30</span> * s**<span class="hljs-number">2</span> - <span class="hljs-number">60</span> * s**<span class="hljs-number">3</span> + <span class="hljs-number">30</span> * s**<span class="hljs-number">4</span>) / T <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> [k / <span class="hljs-number">1000</span> <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1001</span>)])
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">abs</span>(vmax - <span class="hljs-number">15</span> / <span class="hljs-number">8</span>) &lt; <span class="hljs-number">1e-6</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_pump</span>():       <span class="hljs-comment"># Lesson 14: operating point satisfies pump curve = system curve</span>
    Q = math.sqrt((<span class="hljs-number">14</span> - <span class="hljs-number">6</span>) / (<span class="hljs-number">1.8e5</span> + <span class="hljs-number">0.9e5</span>)); <span class="hljs-keyword">return</span> <span class="hljs-built_in">abs</span>((<span class="hljs-number">14</span> - <span class="hljs-number">1.8e5</span> * Q * Q) - (<span class="hljs-number">6</span> + <span class="hljs-number">0.9e5</span> * Q * Q)) &lt; <span class="hljs-number">1e-9</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_lift</span>():       <span class="hljs-comment"># Lesson 15: emergency stopping distance v^2 / 2a</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">5.0</span>**<span class="hljs-number">2</span> / (<span class="hljs-number">2</span> * <span class="hljs-number">1.6</span>) - <span class="hljs-number">7.8125</span>) &lt; <span class="hljs-number">1e-9</span>

REQUIRED = [<span class="hljs-string">&quot;requirements&quot;</span>, <span class="hljs-string">&quot;model&quot;</span>, <span class="hljs-string">&quot;code&quot;</span>, <span class="hljs-string">&quot;tests&quot;</span>, <span class="hljs-string">&quot;results&quot;</span>, <span class="hljs-string">&quot;demo&quot;</span>]
CAPSTONES = {
    <span class="hljs-string">&quot;balancing robot&quot;</span>: <span class="hljs-built_in">dict</span>(lessons=[<span class="hljs-string">&quot;p20-l01&quot;</span>, <span class="hljs-string">&quot;p20-l02&quot;</span>, <span class="hljs-string">&quot;p20-l03&quot;</span>, <span class="hljs-string">&quot;p20-l04&quot;</span>, <span class="hljs-string">&quot;p20-l05&quot;</span>, <span class="hljs-string">&quot;p20-l06&quot;</span>],
        requirements={<span class="hljs-string">&quot;R1&quot;</span>: <span class="hljs-string">&quot;recovers from 5 deg within 1.5 s&quot;</span>, <span class="hljs-string">&quot;R2&quot;</span>: <span class="hljs-string">&quot;runs at least 30 min&quot;</span>, <span class="hljs-string">&quot;R3&quot;</span>: <span class="hljs-string">&quot;loop jitter under 100 us&quot;</span>,
                      <span class="hljs-string">&quot;R4&quot;</span>: <span class="hljs-string">&quot;cuts torque within 50 ms beyond 30 deg&quot;</span>},
        model=<span class="hljs-string">&quot;nonlinear wheel-pendulum, linearised (l02)&quot;</span>, code=[<span class="hljs-string">&quot;balance_fw.c&quot;</span>, <span class="hljs-string">&quot;pid_vs_lqr.py&quot;</span>, <span class="hljs-string">&quot;break_it.py&quot;</span>],
        tests={<span class="hljs-string">&quot;R1&quot;</span>: <span class="hljs-string">&quot;recovery and kick tests&quot;</span>, <span class="hljs-string">&quot;R2&quot;</span>: <span class="hljs-string">&quot;power budget&quot;</span>, <span class="hljs-string">&quot;R3&quot;</span>: <span class="hljs-string">&quot;loop timing budget&quot;</span>, <span class="hljs-string">&quot;R4&quot;</span>: <span class="hljs-string">&quot;fault injection&quot;</span>}, smoke=t_balancer,
        results=[<span class="hljs-string">&quot;LQR recovers from a kick in 1.03 s&quot;</span>, <span class="hljs-string">&quot;84.2 min from the power budget&quot;</span>, <span class="hljs-string">&quot;48.5 us jitter, 533.9 us of the 2 ms period used&quot;</span>,
                 <span class="hljs-string">&quot;motor loss trips the tilt monitor&quot;</span>],
        demo=<span class="hljs-string">&quot;video of the push test and the fault campaign&quot;</span>),
    <span class="hljs-string">&quot;quadcopter&quot;</span>: <span class="hljs-built_in">dict</span>(lessons=[<span class="hljs-string">&quot;p20-l07&quot;</span>, <span class="hljs-string">&quot;p20-l08&quot;</span>, <span class="hljs-string">&quot;p20-l09&quot;</span>, <span class="hljs-string">&quot;p20-l10&quot;</span>],
        requirements={<span class="hljs-string">&quot;Q1&quot;</span>: <span class="hljs-string">&quot;mixer is invertible&quot;</span>, <span class="hljs-string">&quot;Q2&quot;</span>: <span class="hljs-string">&quot;attitude RMS error below 2 deg&quot;</span>, <span class="hljs-string">&quot;Q3&quot;</span>: <span class="hljs-string">&quot;phase margin above 45 deg&quot;</span>,
                      <span class="hljs-string">&quot;Q4&quot;</span>: <span class="hljs-string">&quot;robust over the parameter envelope&quot;</span>},
        model=<span class="hljs-string">&quot;rigid body with motor lag and delay&quot;</span>, code=[<span class="hljs-string">&quot;quad_mixer.py&quot;</span>, <span class="hljs-string">&quot;attitude_estimation.py&quot;</span>, <span class="hljs-string">&quot;cascaded_control.py&quot;</span>, <span class="hljs-string">&quot;robustness.py&quot;</span>],
        tests={<span class="hljs-string">&quot;Q1&quot;</span>: <span class="hljs-string">&quot;round trip&quot;</span>, <span class="hljs-string">&quot;Q2&quot;</span>: <span class="hljs-string">&quot;simulated flight&quot;</span>, <span class="hljs-string">&quot;Q3&quot;</span>: <span class="hljs-string">&quot;loop margins&quot;</span>, <span class="hljs-string">&quot;Q4&quot;</span>: <span class="hljs-string">&quot;300-sample Monte Carlo&quot;</span>}, smoke=t_quad,
        results=[<span class="hljs-string">&quot;round trip exact&quot;</span>, <span class="hljs-string">&quot;EKF 1.18 deg RMS&quot;</span>, <span class="hljs-string">&quot;62.4 and 78.6 deg&quot;</span>, <span class="hljs-string">&quot;minimum 34.9 deg&quot;</span>], demo=<span class="hljs-string">&quot;SITL flight log plots&quot;</span>),
    <span class="hljs-string">&quot;robot arm&quot;</span>: <span class="hljs-built_in">dict</span>(lessons=[<span class="hljs-string">&quot;p20-l11&quot;</span>, <span class="hljs-string">&quot;p20-l12&quot;</span>, <span class="hljs-string">&quot;p20-l13&quot;</span>],
        requirements={<span class="hljs-string">&quot;A1&quot;</span>: <span class="hljs-string">&quot;motors meet torque with SF 1.5&quot;</span>, <span class="hljs-string">&quot;A2&quot;</span>: <span class="hljs-string">&quot;reaches targets within 1 mm&quot;</span>, <span class="hljs-string">&quot;A3&quot;</span>: <span class="hljs-string">&quot;tracks within 2 mm&quot;</span>},
        model=<span class="hljs-string">&quot;URDF and two-link dynamics&quot;</span>, code=[<span class="hljs-string">&quot;arm_design.py&quot;</span>, <span class="hljs-string">&quot;pick_and_place.py&quot;</span>, <span class="hljs-string">&quot;computed_torque.py&quot;</span>],
        tests={<span class="hljs-string">&quot;A1&quot;</span>: <span class="hljs-string">&quot;torque sweep&quot;</span>, <span class="hljs-string">&quot;A2&quot;</span>: <span class="hljs-string">&quot;waypoint error with encoders&quot;</span>, <span class="hljs-string">&quot;A3&quot;</span>: <span class="hljs-string">&quot;tracking run with payload error&quot;</span>}, smoke=t_arm,
        results=[<span class="hljs-string">&quot;64 % and 47 % of rating&quot;</span>, <span class="hljs-string">&quot;0.307 mm&quot;</span>, <span class="hljs-string">&quot;0.814 mm moving&quot;</span>], demo=<span class="hljs-string">&quot;pick-and-place animation&quot;</span>),
    <span class="hljs-string">&quot;irrigation pump&quot;</span>: <span class="hljs-built_in">dict</span>(lessons=[<span class="hljs-string">&quot;p20-l14&quot;</span>],
        requirements={<span class="hljs-string">&quot;P1&quot;</span>: <span class="hljs-string">&quot;never runs dry for more than 3 s per start&quot;</span>, <span class="hljs-string">&quot;P2&quot;</span>: <span class="hljs-string">&quot;at most 6 starts per hour&quot;</span>},
        model=<span class="hljs-string">&quot;pump and system curves, two tanks&quot;</span>, code=[<span class="hljs-string">&quot;irrigation_pump.py&quot;</span>],
        tests={<span class="hljs-string">&quot;P1&quot;</span>: <span class="hljs-string">&quot;week simulations with sensor failures&quot;</span>, <span class="hljs-string">&quot;P2&quot;</span>: <span class="hljs-string">&quot;start counter&quot;</span>}, smoke=t_pump,
        results=[<span class="hljs-string">&quot;2 s per lockout with both level sensors failed&quot;</span>, <span class="hljs-string">&quot;max 6 per hour&quot;</span>], demo=<span class="hljs-string">&quot;tank level plots&quot;</span>),
    <span class="hljs-string">&quot;rope drive supervisor&quot;</span>: <span class="hljs-built_in">dict</span>(lessons=[<span class="hljs-string">&quot;p20-l15&quot;</span>],
        requirements={<span class="hljs-string">&quot;S1&quot;</span>: <span class="hljs-string">&quot;every fault in every state ends safe&quot;</span>, <span class="hljs-string">&quot;S2&quot;</span>: <span class="hljs-string">&quot;no restart while a fault is present&quot;</span>},
        model=<span class="hljs-string">&quot;state machine with line dynamics (educational)&quot;</span>, code=[<span class="hljs-string">&quot;rope_drive_supervisor.py&quot;</span>],
        tests={<span class="hljs-string">&quot;S1&quot;</span>: <span class="hljs-string">&quot;63 state-fault pairs&quot;</span>, <span class="hljs-string">&quot;S2&quot;</span>: <span class="hljs-string">&quot;restart attempts with the fault held&quot;</span>}, smoke=t_lift,
        results=[<span class="hljs-string">&quot;all 63 end locked out with brakes on&quot;</span>, <span class="hljs-string">&quot;all refused&quot;</span>], demo=<span class="hljs-string">&quot;state diagram&quot;</span>),
}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">check</span>(<span class="hljs-params">capstones</span>):
    problems = []
    <span class="hljs-keyword">for</span> name, c <span class="hljs-keyword">in</span> capstones.items():
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> REQUIRED:
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> c.get(k): problems.append(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: no <span class="hljs-subst">{k}</span>&quot;</span>)
        <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> c.get(<span class="hljs-string">&quot;requirements&quot;</span>, {}):
            <span class="hljs-keyword">if</span> r <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> c.get(<span class="hljs-string">&quot;tests&quot;</span>, {}): problems.append(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: requirement <span class="hljs-subst">{r}</span> has no test&quot;</span>)
        <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> c.get(<span class="hljs-string">&quot;tests&quot;</span>, {}):
            <span class="hljs-keyword">if</span> r <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> c.get(<span class="hljs-string">&quot;requirements&quot;</span>, {}): problems.append(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: test for unknown requirement <span class="hljs-subst">{r}</span>&quot;</span>)
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(c.get(<span class="hljs-string">&quot;results&quot;</span>, [])) &lt; <span class="hljs-built_in">len</span>(c.get(<span class="hljs-string">&quot;tests&quot;</span>, {})): problems.append(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: a test has no recorded result&quot;</span>)
        <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;smoke&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> c <span class="hljs-keyword">or</span> <span class="hljs-keyword">not</span> c[<span class="hljs-string">&quot;smoke&quot;</span>](): problems.append(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: smoke test missing or failing&quot;</span>)
    <span class="hljs-keyword">return</span> problems

<span class="hljs-keyword">def</span> <span class="hljs-title function_">readme</span>(<span class="hljs-params">capstones</span>):
    lines = [<span class="hljs-string">&quot;# Mechatronics capstones&quot;</span>, <span class="hljs-string">&quot;&quot;</span>, <span class="hljs-string">&quot;| Capstone | Lessons | Requirements | Tests | Demo |&quot;</span>, <span class="hljs-string">&quot;|---|---|---|---|---|&quot;</span>]
    <span class="hljs-keyword">for</span> n, c <span class="hljs-keyword">in</span> capstones.items():
        lines.append(<span class="hljs-string">f&quot;| <span class="hljs-subst">{n}</span> | <span class="hljs-subst">{<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&#x27;lessons&#x27;</span>])}</span> | <span class="hljs-subst">{<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&#x27;requirements&#x27;</span>])}</span> | <span class="hljs-subst">{<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&#x27;tests&#x27;</span>])}</span> | <span class="hljs-subst">{c[<span class="hljs-string">&#x27;demo&#x27;</span>]}</span> |&quot;</span>)
    <span class="hljs-keyword">for</span> n, c <span class="hljs-keyword">in</span> capstones.items():
        lines += [<span class="hljs-string">&quot;&quot;</span>, <span class="hljs-string">f&quot;## <span class="hljs-subst">{n}</span>&quot;</span>, <span class="hljs-string">&quot;&quot;</span>, <span class="hljs-string">f&quot;Model: <span class="hljs-subst">{c[<span class="hljs-string">&#x27;model&#x27;</span>]}</span>.&quot;</span>, <span class="hljs-string">&quot;&quot;</span>]
        lines += [<span class="hljs-string">f&quot;- **<span class="hljs-subst">{r}</span>** <span class="hljs-subst">{txt}</span>: <span class="hljs-subst">{c[<span class="hljs-string">&#x27;tests&#x27;</span>][r]}</span>, <span class="hljs-subst">{res}</span>&quot;</span> <span class="hljs-keyword">for</span> (r, txt), res <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(c[<span class="hljs-string">&quot;requirements&quot;</span>].items(), c[<span class="hljs-string">&quot;results&quot;</span>])]
    <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;\\n&quot;</span>.join(lines) + <span class="hljs-string">&quot;\\n&quot;</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_portfolio</span>():
    p = check(CAPSTONES); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;problems:&quot;</span>, p <span class="hljs-keyword">or</span> <span class="hljs-string">&quot;none&quot;</span>); <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> p
    n_req = <span class="hljs-built_in">sum</span>(<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&quot;requirements&quot;</span>]) <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> CAPSTONES.values()); n_files = <span class="hljs-built_in">sum</span>(<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&quot;code&quot;</span>]) <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> CAPSTONES.values())
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-built_in">len</span>(CAPSTONES)}</span> capstones, <span class="hljs-subst">{n_req}</span> requirements all traced to tests, <span class="hljs-subst">{n_files}</span> code files, &quot;</span>
          <span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-built_in">sum</span>(<span class="hljs-built_in">len</span>(c[<span class="hljs-string">&#x27;lessons&#x27;</span>]) <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> CAPSTONES.values()) + <span class="hljs-number">1</span>}</span> lessons with this one&quot;</span>)
    text = readme(CAPSTONES); <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;README: <span class="hljs-subst">{<span class="hljs-built_in">len</span>(text.splitlines())}</span> lines, sha256 <span class="hljs-subst">{hashlib.sha256(text.encode()).hexdigest()[:<span class="hljs-number">12</span>]}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> text.count(<span class="hljs-string">&quot;## &quot;</span>) == <span class="hljs-built_in">len</span>(CAPSTONES)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_checker_catches_gaps</span>():
    broken = json.loads(json.dumps({k: {kk: vv <span class="hljs-keyword">for</span> kk, vv <span class="hljs-keyword">in</span> v.items() <span class="hljs-keyword">if</span> kk != <span class="hljs-string">&quot;smoke&quot;</span>} <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> CAPSTONES.items()}))
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> broken: broken[k][<span class="hljs-string">&quot;smoke&quot;</span>] = CAPSTONES[k][<span class="hljs-string">&quot;smoke&quot;</span>]
    broken[<span class="hljs-string">&quot;robot arm&quot;</span>][<span class="hljs-string">&quot;tests&quot;</span>].pop(<span class="hljs-string">&quot;A2&quot;</span>); broken[<span class="hljs-string">&quot;quadcopter&quot;</span>][<span class="hljs-string">&quot;demo&quot;</span>] = <span class="hljs-string">&quot;&quot;</span>; broken[<span class="hljs-string">&quot;irrigation pump&quot;</span>][<span class="hljs-string">&quot;smoke&quot;</span>] = <span class="hljs-keyword">lambda</span>: <span class="hljs-literal">False</span>
    p = check(broken); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;injected gaps found:&quot;</span>, p); <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(p) == <span class="hljs-number">3</span>

test_portfolio(); test_checker_catches_gaps(); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Put each capstone in a Git repository with <code>README.md</code> (the trace table), <code>docs/</code> (derivations, figures), <code>src/</code>, <code>tests/</code> and <code>results/</code>, run the tests in continuous integration, and tag the version that produced the numbers. A short video of each demo and the generated README make a portfolio someone can review in ten minutes. That is also the last step of this course: well done for getting here.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A reviewer asks how you know the arm meets its torque specification. What do you point to?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Requirement A1 in the README, the torque sweep in <code>arm_design.py</code> that checks every pose, its result (64 % and 47 % of the motor ratings) and the URDF limits generated from the chosen motors.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why check the portfolio with a script instead of by reading it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A script runs on every change and does not get tired; it catches the requirement whose test was deleted last month. Reading is still needed for clarity, but not for completeness.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l16"></div>
`,i=[{id:`what-a-portfolio-must-show`,title:`What a portfolio must show`},{id:`results-not-adjectives`,title:`Results, not adjectives`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l16-q1`,type:`num`,q:`<p>Requirements across capstones with 4, 4, 3, 2 and 2?</p>
`,explain:`<p>Sum.</p>
`,answer:15,tol:.001,unit:``},{id:`p20-l16-q2`,type:`num`,q:`<p>Lessons in the arm capstone as a share of Phase 20’s 16 (%)?</p>
`,explain:`<p>3/16.</p>
`,answer:18.75,tol:.005,unit:``},{id:`p20-l16-q3`,type:`num`,q:`<p>Margin of 84.2 min over the 30 min requirement (×)?</p>
`,explain:`<p>Result over limit.</p>
`,answer:2.807,tol:.005,unit:``},{id:`p20-l16-q4`,type:`num`,q:`<p>Margin of the arm’s 0.307 mm against 1 mm (×)?</p>
`,explain:`<p>Limit over result.</p>
`,answer:3.257,tol:.005,unit:``},{id:`p20-l16-q5`,type:`mc`,q:`<p>Which is a requirement without a test?</p>
`,explain:`<p>Nothing proves it.</p>
`,options:[`A demo`,`A result`,`A wish`,`A model`],answer:2},{id:`p20-l16-q6`,type:`mc`,q:`<p>What makes a reported number trustworthy?</p>
`,explain:`<p>Anyone can rerun it.</p>
`,options:[`It appears in a slide`,`It is regenerated by a script in the repository`,`It is round`,`It matches expectations`],answer:1}],o=[{file:`portfolio_check.py`,lang:`python`,src:`import math, hashlib, json

# small, fast smoke tests, one per capstone, re-deriving a headline result of its lessons
def t_balancer():   # Lesson 05: delay margin of the LQR loop
    return abs(math.radians(93.1) / 20.4 - 0.0797) < 1e-3
def t_quad():       # Lesson 07: X-frame mixer round trip (thrust, roll, pitch, yaw)
    d, c = 0.22 / math.sqrt(2), 0.016
    M = [[1, 1, 1, 1], [-d, d, d, -d], [-d, d, -d, d], [-c, -c, c, c]]
    f = [2.5, 2.0, 2.2, 2.4]; w = [sum(M[i][j] * f[j] for j in range(4)) for i in range(4)]
    # inverse of this M in closed form: f = T/4 + ... ; check by solving with Gaussian elimination
    A = [row[:] + [w[i]] for i, row in enumerate(M)]
    for i in range(4):
        p = max(range(i, 4), key=lambda r: abs(A[r][i])); A[i], A[p] = A[p], A[i]
        for r in range(4):
            if r != i: k = A[r][i] / A[i][i]; A[r] = [a - k * b for a, b in zip(A[r], A[i])]
    return all(abs(A[i][4] / A[i][i] - f[i]) < 1e-12 for i in range(4))
def t_arm():        # Lesson 12: quintic peak speed 15/8 dq/T
    T, dq = 1.0, 1.0; vmax = max(dq * (30 * s**2 - 60 * s**3 + 30 * s**4) / T for s in [k / 1000 for k in range(1001)])
    return abs(vmax - 15 / 8) < 1e-6
def t_pump():       # Lesson 14: operating point satisfies pump curve = system curve
    Q = math.sqrt((14 - 6) / (1.8e5 + 0.9e5)); return abs((14 - 1.8e5 * Q * Q) - (6 + 0.9e5 * Q * Q)) < 1e-9
def t_lift():       # Lesson 15: emergency stopping distance v^2 / 2a
    return abs(5.0**2 / (2 * 1.6) - 7.8125) < 1e-9

REQUIRED = ["requirements", "model", "code", "tests", "results", "demo"]
CAPSTONES = {
    "balancing robot": dict(lessons=["p20-l01", "p20-l02", "p20-l03", "p20-l04", "p20-l05", "p20-l06"],
        requirements={"R1": "recovers from 5 deg within 1.5 s", "R2": "runs at least 30 min", "R3": "loop jitter under 100 us",
                      "R4": "cuts torque within 50 ms beyond 30 deg"},
        model="nonlinear wheel-pendulum, linearised (l02)", code=["balance_fw.c", "pid_vs_lqr.py", "break_it.py"],
        tests={"R1": "recovery and kick tests", "R2": "power budget", "R3": "loop timing budget", "R4": "fault injection"}, smoke=t_balancer,
        results=["LQR recovers from a kick in 1.03 s", "84.2 min from the power budget", "48.5 us jitter, 533.9 us of the 2 ms period used",
                 "motor loss trips the tilt monitor"],
        demo="video of the push test and the fault campaign"),
    "quadcopter": dict(lessons=["p20-l07", "p20-l08", "p20-l09", "p20-l10"],
        requirements={"Q1": "mixer is invertible", "Q2": "attitude RMS error below 2 deg", "Q3": "phase margin above 45 deg",
                      "Q4": "robust over the parameter envelope"},
        model="rigid body with motor lag and delay", code=["quad_mixer.py", "attitude_estimation.py", "cascaded_control.py", "robustness.py"],
        tests={"Q1": "round trip", "Q2": "simulated flight", "Q3": "loop margins", "Q4": "300-sample Monte Carlo"}, smoke=t_quad,
        results=["round trip exact", "EKF 1.18 deg RMS", "62.4 and 78.6 deg", "minimum 34.9 deg"], demo="SITL flight log plots"),
    "robot arm": dict(lessons=["p20-l11", "p20-l12", "p20-l13"],
        requirements={"A1": "motors meet torque with SF 1.5", "A2": "reaches targets within 1 mm", "A3": "tracks within 2 mm"},
        model="URDF and two-link dynamics", code=["arm_design.py", "pick_and_place.py", "computed_torque.py"],
        tests={"A1": "torque sweep", "A2": "waypoint error with encoders", "A3": "tracking run with payload error"}, smoke=t_arm,
        results=["64 % and 47 % of rating", "0.307 mm", "0.814 mm moving"], demo="pick-and-place animation"),
    "irrigation pump": dict(lessons=["p20-l14"],
        requirements={"P1": "never runs dry for more than 3 s per start", "P2": "at most 6 starts per hour"},
        model="pump and system curves, two tanks", code=["irrigation_pump.py"],
        tests={"P1": "week simulations with sensor failures", "P2": "start counter"}, smoke=t_pump,
        results=["2 s per lockout with both level sensors failed", "max 6 per hour"], demo="tank level plots"),
    "rope drive supervisor": dict(lessons=["p20-l15"],
        requirements={"S1": "every fault in every state ends safe", "S2": "no restart while a fault is present"},
        model="state machine with line dynamics (educational)", code=["rope_drive_supervisor.py"],
        tests={"S1": "63 state-fault pairs", "S2": "restart attempts with the fault held"}, smoke=t_lift,
        results=["all 63 end locked out with brakes on", "all refused"], demo="state diagram"),
}

def check(capstones):
    problems = []
    for name, c in capstones.items():
        for k in REQUIRED:
            if not c.get(k): problems.append(f"{name}: no {k}")
        for r in c.get("requirements", {}):
            if r not in c.get("tests", {}): problems.append(f"{name}: requirement {r} has no test")
        for r in c.get("tests", {}):
            if r not in c.get("requirements", {}): problems.append(f"{name}: test for unknown requirement {r}")
        if len(c.get("results", [])) < len(c.get("tests", {})): problems.append(f"{name}: a test has no recorded result")
        if "smoke" not in c or not c["smoke"](): problems.append(f"{name}: smoke test missing or failing")
    return problems

def readme(capstones):
    lines = ["# Mechatronics capstones", "", "| Capstone | Lessons | Requirements | Tests | Demo |", "|---|---|---|---|---|"]
    for n, c in capstones.items():
        lines.append(f"| {n} | {len(c['lessons'])} | {len(c['requirements'])} | {len(c['tests'])} | {c['demo']} |")
    for n, c in capstones.items():
        lines += ["", f"## {n}", "", f"Model: {c['model']}.", ""]
        lines += [f"- **{r}** {txt}: {c['tests'][r]}, {res}" for (r, txt), res in zip(c["requirements"].items(), c["results"])]
    return "\\n".join(lines) + "\\n"

def test_portfolio():
    p = check(CAPSTONES); print("problems:", p or "none"); assert not p
    n_req = sum(len(c["requirements"]) for c in CAPSTONES.values()); n_files = sum(len(c["code"]) for c in CAPSTONES.values())
    print(f"{len(CAPSTONES)} capstones, {n_req} requirements all traced to tests, {n_files} code files, "
          f"{sum(len(c['lessons']) for c in CAPSTONES.values()) + 1} lessons with this one")
    text = readme(CAPSTONES); print(f"README: {len(text.splitlines())} lines, sha256 {hashlib.sha256(text.encode()).hexdigest()[:12]}")
    assert text.count("## ") == len(CAPSTONES)

def test_checker_catches_gaps():
    broken = json.loads(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "smoke"} for k, v in CAPSTONES.items()}))
    for k in broken: broken[k]["smoke"] = CAPSTONES[k]["smoke"]
    broken["robot arm"]["tests"].pop("A2"); broken["quadcopter"]["demo"] = ""; broken["irrigation pump"]["smoke"] = lambda: False
    p = check(broken); print("injected gaps found:", p); assert len(p) == 3

test_portfolio(); test_checker_catches_gaps(); print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};