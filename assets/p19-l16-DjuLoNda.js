var e=`p19-l16`,t=40,n=`Machine safety starts with a structured hunt for hazards. You follow the ISO 12100 process of limits, hazard identification, risk estimation, evaluation and reduction, encode a hazard log for a robot arm cell with an illustrative risk matrix, and test that every hazard has measures, design measures come before warnings, and no high risk remains.`,r=`<h2 id="the-iso-12100-process">The ISO 12100 process</h2>
<p>ISO 12100 sets out how to make a machine safe, iterating until the risk is acceptable:</p>
<ol>
<li><strong>Determine the limits</strong> of the machine: intended use, reasonably foreseeable misuse, who interacts with it, in which life phases (installation, operation, cleaning, maintenance).</li>
<li><strong>Identify hazards</strong>: mechanical (crushing, impact, shearing), electrical, thermal, noise, ergonomic, and the situations in which people meet them.</li>
<li><strong>Estimate the risk</strong> of each: the severity of the possible harm and the probability of that harm, which depends on exposure, the likelihood of the hazardous event and whether it can be avoided.</li>
<li><strong>Evaluate</strong> whether the risk is acceptable.</li>
<li><strong>Reduce</strong> it with the <strong>three-step method</strong>, in this order: inherently safe design, then safeguarding and complementary protective measures, then information for use.</li>
</ol>
<p>A warning label is the last resort, never the main measure for a serious hazard.</p>
<h2 id="a-risk-matrix">A risk matrix</h2>
<p>Many teams score risk as severity times likelihood on agreed scales, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">L</span></span></span></span>, and colour the result. The standard does not prescribe a matrix: the 4 × 4 one in the code is illustrative, and its thresholds are a project decision. Medium residual risks are accepted here only when a safety function with a required performance level (PLr, Lesson 17) covers them.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="riskmatrix" data-args="{}"></div></div><figcaption>The illustrative risk matrix with each hazard before and after its measures. Select a hazard and toggle measures to see it move.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Six hazards for a robot arm cell:</p>
<ol>
<li>Impact by the moving arm, crushing while teaching, and unexpected start-up during maintenance start <strong>high</strong>; the electric shock, dropped part and hot surface hazards start medium.</li>
<li>After the measures, no high risk remains (3 before, 0 after). The dropped part and burn hazards reach low; the other four are medium and each relies on a safety function with a PLr (interlocked door, enabling switch, isolator interlock, restart interlock).</li>
<li>Every hazard has at least one measure, every measure lowers the score, and no medium or high hazard relies on information alone.</li>
</ol>
<p>The hazards, scores and PLr values are a teaching example, not an assessment of a real cell.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">hazard_log.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-comment"># Illustrative hazard log for a small robot arm cell. The 4 x 4 matrix and scores are a teaching example, not taken</span>
<span class="hljs-comment"># from ISO 12100 (which defines the process, not a matrix); real projects agree their own scales.</span>
SEV = {<span class="hljs-string">&quot;minor&quot;</span>: <span class="hljs-number">1</span>, <span class="hljs-string">&quot;serious&quot;</span>: <span class="hljs-number">2</span>, <span class="hljs-string">&quot;major&quot;</span>: <span class="hljs-number">3</span>, <span class="hljs-string">&quot;fatal&quot;</span>: <span class="hljs-number">4</span>}           <span class="hljs-comment"># worst credible harm</span>
LIK = {<span class="hljs-string">&quot;remote&quot;</span>: <span class="hljs-number">1</span>, <span class="hljs-string">&quot;unlikely&quot;</span>: <span class="hljs-number">2</span>, <span class="hljs-string">&quot;possible&quot;</span>: <span class="hljs-number">3</span>, <span class="hljs-string">&quot;likely&quot;</span>: <span class="hljs-number">4</span>}    <span class="hljs-comment"># likelihood of that harm</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">risk</span>(<span class="hljs-params">s, l</span>):
    r = SEV[s] * LIK[l]
    <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;high&quot;</span> <span class="hljs-keyword">if</span> r &gt;= <span class="hljs-number">9</span> <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;medium&quot;</span> <span class="hljs-keyword">if</span> r &gt;= <span class="hljs-number">4</span> <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;low&quot;</span>

ORDER = {<span class="hljs-string">&quot;design&quot;</span>: <span class="hljs-number">0</span>, <span class="hljs-string">&quot;guard&quot;</span>: <span class="hljs-number">1</span>, <span class="hljs-string">&quot;info&quot;</span>: <span class="hljs-number">2</span>}                      <span class="hljs-comment"># ISO 12100 three-step method: design first, info last</span>

HAZARDS = [
    <span class="hljs-comment"># (id, hazard, situation, severity, likelihood before, [(measure type, measure)], severity after, likelihood after)</span>
    (<span class="hljs-string">&quot;H1&quot;</span>, <span class="hljs-string">&quot;impact by moving arm&quot;</span>, <span class="hljs-string">&quot;operator enters cell during automatic run&quot;</span>, <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;possible&quot;</span>,
     [(<span class="hljs-string">&quot;guard&quot;</span>, <span class="hljs-string">&quot;interlocked fence door stops the arm (safety function, PLr d, Lessons 17-18)&quot;</span>), (<span class="hljs-string">&quot;guard&quot;</span>, <span class="hljs-string">&quot;light curtain at loading window&quot;</span>)], <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;remote&quot;</span>),
    (<span class="hljs-string">&quot;H2&quot;</span>, <span class="hljs-string">&quot;crushing between arm and fixture&quot;</span>, <span class="hljs-string">&quot;teaching the robot with the pendant&quot;</span>, <span class="hljs-string">&quot;major&quot;</span>, <span class="hljs-string">&quot;possible&quot;</span>,
     [(<span class="hljs-string">&quot;design&quot;</span>, <span class="hljs-string">&quot;reduced speed 250 mm/s in teach mode&quot;</span>), (<span class="hljs-string">&quot;guard&quot;</span>, <span class="hljs-string">&quot;three-position enabling switch (safety function, PLr d)&quot;</span>)], <span class="hljs-string">&quot;serious&quot;</span>, <span class="hljs-string">&quot;unlikely&quot;</span>),
    (<span class="hljs-string">&quot;H3&quot;</span>, <span class="hljs-string">&quot;dropped part&quot;</span>, <span class="hljs-string">&quot;gripper loses vacuum while moving&quot;</span>, <span class="hljs-string">&quot;serious&quot;</span>, <span class="hljs-string">&quot;possible&quot;</span>,
     [(<span class="hljs-string">&quot;design&quot;</span>, <span class="hljs-string">&quot;gripper with spring-closed fingers that hold on power loss&quot;</span>), (<span class="hljs-string">&quot;info&quot;</span>, <span class="hljs-string">&quot;hard-hat zone sign&quot;</span>)], <span class="hljs-string">&quot;serious&quot;</span>, <span class="hljs-string">&quot;remote&quot;</span>),
    (<span class="hljs-string">&quot;H4&quot;</span>, <span class="hljs-string">&quot;electric shock&quot;</span>, <span class="hljs-string">&quot;opening the control cabinet&quot;</span>, <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;unlikely&quot;</span>,
     [(<span class="hljs-string">&quot;design&quot;</span>, <span class="hljs-string">&quot;touch-safe terminals, IP2X inside the cabinet&quot;</span>), (<span class="hljs-string">&quot;guard&quot;</span>, <span class="hljs-string">&quot;cabinet door interlocked with the isolator (safety function, PLr c)&quot;</span>), (<span class="hljs-string">&quot;info&quot;</span>, <span class="hljs-string">&quot;lockout-tagout procedure&quot;</span>)], <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;remote&quot;</span>),
    (<span class="hljs-string">&quot;H5&quot;</span>, <span class="hljs-string">&quot;unexpected start-up&quot;</span>, <span class="hljs-string">&quot;maintenance inside the cell&quot;</span>, <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;possible&quot;</span>,
     [(<span class="hljs-string">&quot;guard&quot;</span>, <span class="hljs-string">&quot;lockable main isolator, one lock per technician&quot;</span>), (<span class="hljs-string">&quot;design&quot;</span>, <span class="hljs-string">&quot;restart needs a deliberate reset outside the cell (safety function, PLr d)&quot;</span>)], <span class="hljs-string">&quot;fatal&quot;</span>, <span class="hljs-string">&quot;remote&quot;</span>),
    (<span class="hljs-string">&quot;H6&quot;</span>, <span class="hljs-string">&quot;burn from motor housing&quot;</span>, <span class="hljs-string">&quot;touching the arm after a long run&quot;</span>, <span class="hljs-string">&quot;minor&quot;</span>, <span class="hljs-string">&quot;likely&quot;</span>,
     [(<span class="hljs-string">&quot;info&quot;</span>, <span class="hljs-string">&quot;hot surface label&quot;</span>), (<span class="hljs-string">&quot;design&quot;</span>, <span class="hljs-string">&quot;thermal derating keeps the housing below 60 C&quot;</span>)], <span class="hljs-string">&quot;minor&quot;</span>, <span class="hljs-string">&quot;unlikely&quot;</span>),
]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_hazard_log</span>():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-string">&#x27;id&#x27;</span>:3s}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;before&#x27;</span>:7s}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;after&#x27;</span>:7s}</span> measures&quot;</span>)
    <span class="hljs-keyword">for</span> hid, hz, sit, s0, l0, meas, s1, l1 <span class="hljs-keyword">in</span> HAZARDS:
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{hid:3s}</span> <span class="hljs-subst">{risk(s0, l0):7s}</span> <span class="hljs-subst">{risk(s1, l1):7s}</span> <span class="hljs-subst">{<span class="hljs-built_in">len</span>(meas)}</span>  <span class="hljs-subst">{hz}</span>&quot;</span>)
        <span class="hljs-keyword">assert</span> meas, hid                                                       <span class="hljs-comment"># every hazard has a measure</span>
        <span class="hljs-comment"># residual risk acceptable: low, or medium only when a safety function with a required performance level covers it</span>
        <span class="hljs-keyword">assert</span> risk(s1, l1) == <span class="hljs-string">&quot;low&quot;</span> <span class="hljs-keyword">or</span> (risk(s1, l1) == <span class="hljs-string">&quot;medium&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">any</span>(<span class="hljs-string">&quot;PLr&quot;</span> <span class="hljs-keyword">in</span> m <span class="hljs-keyword">for</span> _, m <span class="hljs-keyword">in</span> meas)), hid
        <span class="hljs-keyword">assert</span> SEV[s1] * LIK[l1] &lt; SEV[s0] * LIK[l0], hid                       <span class="hljs-comment"># measures actually reduce the risk</span>
        <span class="hljs-keyword">if</span> risk(s0, l0) <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;high&quot;</span>, <span class="hljs-string">&quot;medium&quot;</span>):
            <span class="hljs-keyword">assert</span> <span class="hljs-built_in">min</span>(ORDER[t] <span class="hljs-keyword">for</span> t, _ <span class="hljs-keyword">in</span> meas) &lt; <span class="hljs-number">2</span>, hid                      <span class="hljs-comment"># never only warnings for real risks</span>
    before = <span class="hljs-built_in">sum</span>(risk(h[<span class="hljs-number">3</span>], h[<span class="hljs-number">4</span>]) == <span class="hljs-string">&quot;high&quot;</span> <span class="hljs-keyword">for</span> h <span class="hljs-keyword">in</span> HAZARDS); after = <span class="hljs-built_in">sum</span>(risk(h[<span class="hljs-number">6</span>], h[<span class="hljs-number">7</span>]) == <span class="hljs-string">&quot;high&quot;</span> <span class="hljs-keyword">for</span> h <span class="hljs-keyword">in</span> HAZARDS)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;high risks: <span class="hljs-subst">{before}</span> before, <span class="hljs-subst">{after}</span> after&quot;</span>)
    <span class="hljs-keyword">assert</span> after == <span class="hljs-number">0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_matrix</span>():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;risk matrix (rows: severity, columns: likelihood remote..likely)&quot;</span>)
    <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> SEV: <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{s:8s}</span> &quot;</span> + <span class="hljs-string">&quot; &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{risk(s, l):6s}</span>&quot;</span> <span class="hljs-keyword">for</span> l <span class="hljs-keyword">in</span> LIK))

test_hazard_log()
test_matrix()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Hazard logs usually live in spreadsheets or requirements tools, reviewed by a team that includes operators and maintenance staff, because the people who do the job know the situations. Robot cells add ISO 10218 (industrial robots) and, for collaborative robots, ISO/TS 15066. Encoding the log as data, as here, lets checks run on every change. This lesson is educational and not a substitute for the standards or a qualified safety assessment.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A cleaner might reach past a guard to wipe a sensor while the machine runs. Which ISO 12100 step catches this?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Determining the limits, specifically reasonably foreseeable misuse and the cleaning life phase. Hazard identification must then cover the situation.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why is “add a warning sign” not enough for an impact hazard from a robot arm?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Information for use is the last of the three steps and relies on people always reading and obeying it. A hazard that can kill must first be reduced by design (lower speed, force limits) and safeguarding (fences, interlocks).</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l16"></div>
`,i=[{id:`the-iso-12100-process`,title:`The ISO 12100 process`},{id:`a-risk-matrix`,title:`A risk matrix`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l16-q1`,type:`num`,q:`<p>Risk score for severity 3 and likelihood 4 on the lesson’s scales?</p>
`,explain:`<p>S × L.</p>
`,answer:12,tol:.001,unit:``},{id:`p19-l16-q2`,type:`num`,q:`<p>Cells in a 4 × 4 risk matrix?</p>
`,explain:`<p>Every severity and likelihood pair.</p>
`,answer:16,tol:.001,unit:``},{id:`p19-l16-q3`,type:`num`,q:`<p>Steps in the ISO 12100 three-step risk reduction method?</p>
`,explain:`<p>Design, safeguarding, information.</p>
`,answer:3,tol:.001,unit:``},{id:`p19-l16-q4`,type:`num`,q:`<p>Score reduction from 4 × 3 to 4 × 1 (%)?</p>
`,explain:`<p>From 12 to 4.</p>
`,answer:66.7,tol:.003,unit:``},{id:`p19-l16-q5`,type:`mc`,q:`<p>Which risk reduction measure comes first?</p>
`,explain:`<p>Design out the hazard if possible.</p>
`,options:[`Training`,`Warning labels`,`Inherently safe design`,`Personal protective equipment`],answer:2},{id:`p19-l16-q6`,type:`mc`,q:`<p>What does ISO 12100 define?</p>
`,explain:`<p>Teams choose their own scales.</p>
`,options:[`Battery charging rules`,`Robot speed limits`,`A mandatory 5 × 5 risk matrix`,`The risk assessment and reduction process`],answer:3}],o=[{file:`hazard_log.py`,lang:`python`,src:`# Illustrative hazard log for a small robot arm cell. The 4 x 4 matrix and scores are a teaching example, not taken
# from ISO 12100 (which defines the process, not a matrix); real projects agree their own scales.
SEV = {"minor": 1, "serious": 2, "major": 3, "fatal": 4}           # worst credible harm
LIK = {"remote": 1, "unlikely": 2, "possible": 3, "likely": 4}    # likelihood of that harm
def risk(s, l):
    r = SEV[s] * LIK[l]
    return "high" if r >= 9 else "medium" if r >= 4 else "low"

ORDER = {"design": 0, "guard": 1, "info": 2}                      # ISO 12100 three-step method: design first, info last

HAZARDS = [
    # (id, hazard, situation, severity, likelihood before, [(measure type, measure)], severity after, likelihood after)
    ("H1", "impact by moving arm", "operator enters cell during automatic run", "fatal", "possible",
     [("guard", "interlocked fence door stops the arm (safety function, PLr d, Lessons 17-18)"), ("guard", "light curtain at loading window")], "fatal", "remote"),
    ("H2", "crushing between arm and fixture", "teaching the robot with the pendant", "major", "possible",
     [("design", "reduced speed 250 mm/s in teach mode"), ("guard", "three-position enabling switch (safety function, PLr d)")], "serious", "unlikely"),
    ("H3", "dropped part", "gripper loses vacuum while moving", "serious", "possible",
     [("design", "gripper with spring-closed fingers that hold on power loss"), ("info", "hard-hat zone sign")], "serious", "remote"),
    ("H4", "electric shock", "opening the control cabinet", "fatal", "unlikely",
     [("design", "touch-safe terminals, IP2X inside the cabinet"), ("guard", "cabinet door interlocked with the isolator (safety function, PLr c)"), ("info", "lockout-tagout procedure")], "fatal", "remote"),
    ("H5", "unexpected start-up", "maintenance inside the cell", "fatal", "possible",
     [("guard", "lockable main isolator, one lock per technician"), ("design", "restart needs a deliberate reset outside the cell (safety function, PLr d)")], "fatal", "remote"),
    ("H6", "burn from motor housing", "touching the arm after a long run", "minor", "likely",
     [("info", "hot surface label"), ("design", "thermal derating keeps the housing below 60 C")], "minor", "unlikely"),
]

def test_hazard_log():
    print(f"{'id':3s} {'before':7s} {'after':7s} measures")
    for hid, hz, sit, s0, l0, meas, s1, l1 in HAZARDS:
        print(f"{hid:3s} {risk(s0, l0):7s} {risk(s1, l1):7s} {len(meas)}  {hz}")
        assert meas, hid                                                       # every hazard has a measure
        # residual risk acceptable: low, or medium only when a safety function with a required performance level covers it
        assert risk(s1, l1) == "low" or (risk(s1, l1) == "medium" and any("PLr" in m for _, m in meas)), hid
        assert SEV[s1] * LIK[l1] < SEV[s0] * LIK[l0], hid                       # measures actually reduce the risk
        if risk(s0, l0) in ("high", "medium"):
            assert min(ORDER[t] for t, _ in meas) < 2, hid                      # never only warnings for real risks
    before = sum(risk(h[3], h[4]) == "high" for h in HAZARDS); after = sum(risk(h[6], h[7]) == "high" for h in HAZARDS)
    print(f"high risks: {before} before, {after} after")
    assert after == 0

def test_matrix():
    print("risk matrix (rows: severity, columns: likelihood remote..likely)")
    for s in SEV: print(f"  {s:8s} " + " ".join(f"{risk(s, l):6s}" for l in LIK))

test_hazard_log()
test_matrix()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};