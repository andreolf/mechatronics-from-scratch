var e=`p20-l01`,t=35,n=`A capstone starts with requirements you can test. You turn wishes into measurable criteria with a quantity, a comparison and a limit, reject vague words automatically, map every requirement to a test, and run the tests against a model of a self-balancing robot so the traceability check fails the moment a requirement has no test.`,r=`<h2 id="from-wishes-to-requirements">From wishes to requirements</h2>
<p>“The robot should balance well and last a long time” cannot be passed or failed. A <strong>requirement</strong> you can test names a quantity, a comparison and a limit, and says how it is measured: “recover from a 5° tilt within 1.5 s”, “run at least 30 min on one charge”. Words such as <em>fast</em>, <em>robust</em>, <em>reliable</em> or <em>smooth</em> are signs that the measurable part is missing.</p>
<p>Writing each requirement as data,</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8623em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">requirement</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord text"><span class="mord">id</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">metric</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">op</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">limit</span></span><span class="mclose">)</span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">pass</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">⟺</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">metric</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord text"><span class="mord">op</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord text"><span class="mord">limit</span></span><span class="mpunct">,</span></span></span></span></span></div>
<p>lets code check that the set is complete and that the design meets it.</p>
<h2 id="traceability">Traceability</h2>
<p><strong>Traceability</strong> links each requirement to the tests that verify it, and each test back to a requirement. Two checks catch most gaps:</p>
<ul>
<li>a requirement with no test is unverified;</li>
<li>a test with no requirement is either testing nothing that matters or hides a missing requirement.</li>
</ul>
<p>The same links later show what to re-test when a requirement or design changes. The capstones in this phase (a self-balancing robot, a quadcopter, a robot arm, an irrigation pump and a rope-drive supervisor) each start from a short requirements file like this one.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="tracegraph" data-args="{}"></div></div><figcaption>Requirements on the left, tests on the right, links between them. Toggle a test off or add an untested requirement and watch the traceability check fail.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Five requirements for the self-balancing robot, each tested against a model of the design (illustrative numbers):</p>
<ol>
<li>R1, recovery from 5°: 0.345 s against 1.5 s, pass.</li>
<li>R2, runtime: 75.817 min against 30 min, pass (3S 2.5 Ah pack, 85 % usable, two motors averaging 8 W).</li>
<li>R3, loop jitter: 48.473 µs against 100 µs, pass. R4, torque cut-off after a fall: 24 ms against 50 ms. R5, mass: 1.090 kg against 1.5 kg.</li>
<li>“The robot shall be robust” is rejected as vague, and adding R6 without a test makes the traceability check report it.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">requirements.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math, re

<span class="hljs-comment"># Requirements for the capstone self-balancing robot. Each one is measurable: a quantity, a comparison and a limit.</span>
REQS = [
    {<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R1&quot;</span>, <span class="hljs-string">&quot;text&quot;</span>: <span class="hljs-string">&quot;Recover from a 5 degree tilt within 1.5 s&quot;</span>, <span class="hljs-string">&quot;metric&quot;</span>: <span class="hljs-string">&quot;recovery_time_s&quot;</span>, <span class="hljs-string">&quot;op&quot;</span>: <span class="hljs-string">&quot;&lt;=&quot;</span>, <span class="hljs-string">&quot;limit&quot;</span>: <span class="hljs-number">1.5</span>},
    {<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R2&quot;</span>, <span class="hljs-string">&quot;text&quot;</span>: <span class="hljs-string">&quot;Run at least 30 min on one charge&quot;</span>, <span class="hljs-string">&quot;metric&quot;</span>: <span class="hljs-string">&quot;runtime_min&quot;</span>, <span class="hljs-string">&quot;op&quot;</span>: <span class="hljs-string">&quot;&gt;=&quot;</span>, <span class="hljs-string">&quot;limit&quot;</span>: <span class="hljs-number">30</span>},
    {<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R3&quot;</span>, <span class="hljs-string">&quot;text&quot;</span>: <span class="hljs-string">&quot;Control loop period 2 ms with jitter under 100 us&quot;</span>, <span class="hljs-string">&quot;metric&quot;</span>: <span class="hljs-string">&quot;jitter_us&quot;</span>, <span class="hljs-string">&quot;op&quot;</span>: <span class="hljs-string">&quot;&lt;&quot;</span>, <span class="hljs-string">&quot;limit&quot;</span>: <span class="hljs-number">100</span>},
    {<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R4&quot;</span>, <span class="hljs-string">&quot;text&quot;</span>: <span class="hljs-string">&quot;Cut motor torque within 50 ms of a tilt beyond 30 degrees&quot;</span>, <span class="hljs-string">&quot;metric&quot;</span>: <span class="hljs-string">&quot;cutoff_ms&quot;</span>, <span class="hljs-string">&quot;op&quot;</span>: <span class="hljs-string">&quot;&lt;=&quot;</span>, <span class="hljs-string">&quot;limit&quot;</span>: <span class="hljs-number">50</span>},
    {<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R5&quot;</span>, <span class="hljs-string">&quot;text&quot;</span>: <span class="hljs-string">&quot;Mass under 1.5 kg&quot;</span>, <span class="hljs-string">&quot;metric&quot;</span>: <span class="hljs-string">&quot;mass_kg&quot;</span>, <span class="hljs-string">&quot;op&quot;</span>: <span class="hljs-string">&quot;&lt;&quot;</span>, <span class="hljs-string">&quot;limit&quot;</span>: <span class="hljs-number">1.5</span>},
]
VAGUE = re.<span class="hljs-built_in">compile</span>(<span class="hljs-string">r&quot;\\b(fast|quick|robust|reliable|user-friendly|easy|smooth|appropriate|sufficient|as needed)\\b&quot;</span>, re.I)

<span class="hljs-comment"># Tests: each measures one metric from a model of the design (illustrative numbers) and names the requirements it covers.</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_recovery</span>():
    <span class="hljs-string">&quot;&quot;&quot;linearised tilt dynamics under a PD law: th&#x27;&#x27; = a th + b u, u = -kp th - kd th&#x27;. 2 % settling time from 5 deg.&quot;&quot;&quot;</span>
    a, b, kp, kd, dt = <span class="hljs-number">60.0</span>, <span class="hljs-number">12.0</span>, <span class="hljs-number">25.0</span>, <span class="hljs-number">2.0</span>, <span class="hljs-number">1e-4</span>
    th, w, t, last_out = math.radians(<span class="hljs-number">5</span>), <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">while</span> t &lt; <span class="hljs-number">5</span>:
        u = -kp * th - kd * w; w += (a * th + b * u) * dt; th += w * dt; t += dt
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(th) &gt; <span class="hljs-number">0.02</span> * math.radians(<span class="hljs-number">5</span>): last_out = t
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;recovery_time_s&quot;</span>: last_out}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_runtime</span>():
    cap_wh = <span class="hljs-number">11.1</span> * <span class="hljs-number">2.5</span> * <span class="hljs-number">0.85</span>                                     <span class="hljs-comment"># 3S pack, 85 % usable</span>
    load_w = <span class="hljs-number">2</span> * <span class="hljs-number">8.0</span> + <span class="hljs-number">0.5</span> + <span class="hljs-number">0.3</span>                                    <span class="hljs-comment"># two motors average, MCU board, IMU and radio</span>
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;runtime_min&quot;</span>: <span class="hljs-number">60</span> * cap_wh / (load_w / <span class="hljs-number">0.9</span>)}           <span class="hljs-comment"># 90 % efficient regulators</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_jitter</span>():
    <span class="hljs-keyword">import</span> random
    random.seed(<span class="hljs-number">1</span>); periods = [<span class="hljs-number">2000</span> + random.gauss(<span class="hljs-number">0</span>, <span class="hljs-number">12</span>) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20000</span>)]
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;jitter_us&quot;</span>: <span class="hljs-built_in">max</span>(<span class="hljs-built_in">abs</span>(p - <span class="hljs-number">2000</span>) <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> periods)}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_cutoff</span>():
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;cutoff_ms&quot;</span>: <span class="hljs-number">2</span> + <span class="hljs-number">2</span> + <span class="hljs-number">20</span>}                               <span class="hljs-comment"># one period to detect, one to act, driver disable time</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">t_mass</span>():
    parts = {<span class="hljs-string">&quot;chassis&quot;</span>: <span class="hljs-number">0.35</span>, <span class="hljs-string">&quot;motors&quot;</span>: <span class="hljs-number">0.30</span>, <span class="hljs-string">&quot;wheels&quot;</span>: <span class="hljs-number">0.12</span>, <span class="hljs-string">&quot;battery&quot;</span>: <span class="hljs-number">0.19</span>, <span class="hljs-string">&quot;electronics&quot;</span>: <span class="hljs-number">0.08</span>, <span class="hljs-string">&quot;fasteners&quot;</span>: <span class="hljs-number">0.05</span>}
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;mass_kg&quot;</span>: <span class="hljs-built_in">sum</span>(parts.values())}

TESTS = {<span class="hljs-string">&quot;t_recovery&quot;</span>: (t_recovery, [<span class="hljs-string">&quot;R1&quot;</span>]), <span class="hljs-string">&quot;t_runtime&quot;</span>: (t_runtime, [<span class="hljs-string">&quot;R2&quot;</span>]), <span class="hljs-string">&quot;t_jitter&quot;</span>: (t_jitter, [<span class="hljs-string">&quot;R3&quot;</span>]),
         <span class="hljs-string">&quot;t_cutoff&quot;</span>: (t_cutoff, [<span class="hljs-string">&quot;R4&quot;</span>]), <span class="hljs-string">&quot;t_mass&quot;</span>: (t_mass, [<span class="hljs-string">&quot;R5&quot;</span>])}
OPS = {<span class="hljs-string">&quot;&lt;=&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a &lt;= b, <span class="hljs-string">&quot;&gt;=&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a &gt;= b, <span class="hljs-string">&quot;&lt;&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a &lt; b, <span class="hljs-string">&quot;&gt;&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a &gt; b}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">trace</span>(<span class="hljs-params">reqs, tests</span>):
    covered = {r <span class="hljs-keyword">for</span> _, ids <span class="hljs-keyword">in</span> tests.values() <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> ids}; known = {r[<span class="hljs-string">&quot;id&quot;</span>] <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> reqs}
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">sorted</span>(known - covered), <span class="hljs-built_in">sorted</span>(covered - known)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_requirements_are_measurable</span>():
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> REQS:
        <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> VAGUE.search(r[<span class="hljs-string">&quot;text&quot;</span>]), r[<span class="hljs-string">&quot;id&quot;</span>]
        <span class="hljs-keyword">assert</span> r[<span class="hljs-string">&quot;op&quot;</span>] <span class="hljs-keyword">in</span> OPS <span class="hljs-keyword">and</span> <span class="hljs-built_in">isinstance</span>(r[<span class="hljs-string">&quot;limit&quot;</span>], (<span class="hljs-built_in">int</span>, <span class="hljs-built_in">float</span>)), r[<span class="hljs-string">&quot;id&quot;</span>]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-built_in">len</span>(REQS)}</span> requirements, none vague; &#x27;The robot shall be robust&#x27; would be rejected: <span class="hljs-subst">{<span class="hljs-built_in">bool</span>(VAGUE.search(<span class="hljs-string">&#x27;The robot shall be robust&#x27;</span>))}</span>&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_traceability_and_results</span>():
    untested, orphans = trace(REQS, TESTS)
    <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> untested <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> orphans
    results = {}
    <span class="hljs-keyword">for</span> name, (fn, _) <span class="hljs-keyword">in</span> TESTS.items(): results.update(fn())
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> REQS:
        v = results[r[<span class="hljs-string">&quot;metric&quot;</span>]]; ok = OPS[r[<span class="hljs-string">&quot;op&quot;</span>]](v, r[<span class="hljs-string">&quot;limit&quot;</span>])
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{r[<span class="hljs-string">&#x27;id&#x27;</span>]}</span> <span class="hljs-subst">{r[<span class="hljs-string">&#x27;metric&#x27;</span>]:16s}</span> <span class="hljs-subst">{v:<span class="hljs-number">9.3</span>f}</span> <span class="hljs-subst">{r[<span class="hljs-string">&#x27;op&#x27;</span>]}</span> <span class="hljs-subst">{r[<span class="hljs-string">&#x27;limit&#x27;</span>]:&lt;<span class="hljs-number">6</span>}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;PASS&#x27;</span> <span class="hljs-keyword">if</span> ok <span class="hljs-keyword">else</span> <span class="hljs-string">&#x27;FAIL&#x27;</span>}</span>&quot;</span>)
        <span class="hljs-keyword">assert</span> ok, r[<span class="hljs-string">&quot;id&quot;</span>]
    gap, _ = trace(REQS + [{<span class="hljs-string">&quot;id&quot;</span>: <span class="hljs-string">&quot;R6&quot;</span>}], TESTS)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;adding R6 without a test is caught: untested <span class="hljs-subst">{gap}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> gap == [<span class="hljs-string">&quot;R6&quot;</span>]

test_requirements_are_measurable()
test_traceability_and_results()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Plain Python and a test runner such as pytest are enough for a small project: requirements in a YAML or Python file, tests tagged with requirement ids, and a check in continuous integration that fails on untested requirements. Larger projects use requirements tools (Doorstop is an open-source one that keeps requirements in Git), and safety projects need the same links as evidence (Lesson 16 of Phase 19).</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Rewrite “the arm should be accurate” as a testable requirement.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>For example: “The tool centre point reaches each of 20 test targets within 1 mm, measured in simulation with the nominal model and on the robot with a dial gauge.” It names the quantity (position error), the limit (1 mm) and the measurement.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A test checks the LED blink rate but no requirement mentions the LED. What do you do?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Decide whether the behaviour matters. If it does (the LED signals a fault state to the user), add the missing requirement and link the test; if not, delete the test so it does not cost maintenance.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l01"></div>
`,i=[{id:`from-wishes-to-requirements`,title:`From wishes to requirements`},{id:`traceability`,title:`Traceability`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l01-q1`,type:`num`,q:`<p>Usable energy of a 3S pack (11.1 V, 2.5 Ah) at 85 % (Wh)?</p>
`,explain:`<p>V × Ah × usable fraction.</p>
`,answer:23.59,tol:.002,unit:``},{id:`p20-l01-q2`,type:`num`,q:`<p>Runtime of 23.6 Wh at a 16.8 W load with 90 % efficient regulators (min)?</p>
`,explain:`<p>Energy over input power.</p>
`,answer:75.9,tol:.003,unit:``},{id:`p20-l01-q3`,type:`num`,q:`<p>Requirements without tests if 7 requirements are covered by tests for 5 of them?</p>
`,explain:`<p>Two are unverified.</p>
`,answer:2,tol:.001,unit:``},{id:`p20-l01-q4`,type:`num`,q:`<p>Loop period for a 500 Hz control loop (ms)?</p>
`,explain:`<p>1/f.</p>
`,answer:2,tol:.001,unit:``},{id:`p20-l01-q5`,type:`mc`,q:`<p>Which requirement is testable?</p>
`,explain:`<p>Quantity, comparison and limit.</p>
`,options:[`Respond quickly`,`Balance well`,`Be robust to pushes`,`Recover from a 5° tilt within 1.5 s`],answer:3},{id:`p20-l01-q6`,type:`mc`,q:`<p>What does a test with no linked requirement suggest?</p>
`,explain:`<p>Traceability runs both ways.</p>
`,options:[`Nothing`,`The requirement set is complete`,`A missing requirement or an unnecessary test`,`The test must pass`],answer:2}],o=[{file:`requirements.py`,lang:`python`,src:`import math, re

# Requirements for the capstone self-balancing robot. Each one is measurable: a quantity, a comparison and a limit.
REQS = [
    {"id": "R1", "text": "Recover from a 5 degree tilt within 1.5 s", "metric": "recovery_time_s", "op": "<=", "limit": 1.5},
    {"id": "R2", "text": "Run at least 30 min on one charge", "metric": "runtime_min", "op": ">=", "limit": 30},
    {"id": "R3", "text": "Control loop period 2 ms with jitter under 100 us", "metric": "jitter_us", "op": "<", "limit": 100},
    {"id": "R4", "text": "Cut motor torque within 50 ms of a tilt beyond 30 degrees", "metric": "cutoff_ms", "op": "<=", "limit": 50},
    {"id": "R5", "text": "Mass under 1.5 kg", "metric": "mass_kg", "op": "<", "limit": 1.5},
]
VAGUE = re.compile(r"\\b(fast|quick|robust|reliable|user-friendly|easy|smooth|appropriate|sufficient|as needed)\\b", re.I)

# Tests: each measures one metric from a model of the design (illustrative numbers) and names the requirements it covers.
def t_recovery():
    """linearised tilt dynamics under a PD law: th'' = a th + b u, u = -kp th - kd th'. 2 % settling time from 5 deg."""
    a, b, kp, kd, dt = 60.0, 12.0, 25.0, 2.0, 1e-4
    th, w, t, last_out = math.radians(5), 0.0, 0.0, 0.0
    while t < 5:
        u = -kp * th - kd * w; w += (a * th + b * u) * dt; th += w * dt; t += dt
        if abs(th) > 0.02 * math.radians(5): last_out = t
    return {"recovery_time_s": last_out}

def t_runtime():
    cap_wh = 11.1 * 2.5 * 0.85                                     # 3S pack, 85 % usable
    load_w = 2 * 8.0 + 0.5 + 0.3                                    # two motors average, MCU board, IMU and radio
    return {"runtime_min": 60 * cap_wh / (load_w / 0.9)}           # 90 % efficient regulators

def t_jitter():
    import random
    random.seed(1); periods = [2000 + random.gauss(0, 12) for _ in range(20000)]
    return {"jitter_us": max(abs(p - 2000) for p in periods)}

def t_cutoff():
    return {"cutoff_ms": 2 + 2 + 20}                               # one period to detect, one to act, driver disable time

def t_mass():
    parts = {"chassis": 0.35, "motors": 0.30, "wheels": 0.12, "battery": 0.19, "electronics": 0.08, "fasteners": 0.05}
    return {"mass_kg": sum(parts.values())}

TESTS = {"t_recovery": (t_recovery, ["R1"]), "t_runtime": (t_runtime, ["R2"]), "t_jitter": (t_jitter, ["R3"]),
         "t_cutoff": (t_cutoff, ["R4"]), "t_mass": (t_mass, ["R5"])}
OPS = {"<=": lambda a, b: a <= b, ">=": lambda a, b: a >= b, "<": lambda a, b: a < b, ">": lambda a, b: a > b}

def trace(reqs, tests):
    covered = {r for _, ids in tests.values() for r in ids}; known = {r["id"] for r in reqs}
    return sorted(known - covered), sorted(covered - known)

def test_requirements_are_measurable():
    for r in REQS:
        assert not VAGUE.search(r["text"]), r["id"]
        assert r["op"] in OPS and isinstance(r["limit"], (int, float)), r["id"]
    print(f"{len(REQS)} requirements, none vague; 'The robot shall be robust' would be rejected: {bool(VAGUE.search('The robot shall be robust'))}")

def test_traceability_and_results():
    untested, orphans = trace(REQS, TESTS)
    assert not untested and not orphans
    results = {}
    for name, (fn, _) in TESTS.items(): results.update(fn())
    for r in REQS:
        v = results[r["metric"]]; ok = OPS[r["op"]](v, r["limit"])
        print(f"{r['id']} {r['metric']:16s} {v:9.3f} {r['op']} {r['limit']:<6} {'PASS' if ok else 'FAIL'}")
        assert ok, r["id"]
    gap, _ = trace(REQS + [{"id": "R6"}], TESTS)
    print(f"adding R6 without a test is caught: untested {gap}")
    assert gap == ["R6"]

test_requirements_are_measurable()
test_traceability_and_results()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};