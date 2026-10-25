var e=`p19-l20`,t=40,n=`Failure modes and effects analysis asks, for every part, how it can fail, what happens then, and how you would know. You build an FMEA for an illustrative self-balancing robot, rank failure modes by RPN, check that the highest risks and every severe mode have effective actions, and expose the weaknesses of multiplying ordinal scores.`,r=`<h2 id="bottom-up-analysis">Bottom-up analysis</h2>
<p>Hazard analysis (Lesson 16) works top-down from what could hurt someone. <strong>FMEA</strong> works bottom-up: list each item, each way it can fail, the effect on the system and the user, and the causes and existing controls. Three ratings, usually 1 to 10, describe each failure mode:</p>
<ul>
<li><strong>Severity</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span></span></span></span> of the effect;</li>
<li><strong>Occurrence</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span></span></span></span>, how likely the cause is;</li>
<li><strong>Detection</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span></span></span></span>, how unlikely it is that the failure is detected before it causes harm (10 means it cannot be detected).</li>
</ul>
<h2 id="the-risk-priority-number-and-its-limits">The risk priority number and its limits</h2>
<p>The classic ranking is the <strong>risk priority number</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord"><span class="mord mathrm">RPN</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span></span></span></span>, from 1 to 1000. It is easy to compute and widely used, but it multiplies ordinal scales as if they were measurements:</p>
<ul>
<li>many different combinations give the same RPN, from harmless to dangerous;</li>
<li>a severe but rare failure can rank below a mild, frequent one;</li>
<li>the 1000 combinations produce only 120 distinct values, unevenly spread.</li>
</ul>
<p>That is why the 2019 AIAG and VDA FMEA handbook replaced the RPN with <strong>action priority</strong> tables that weight severity first, and why good practice adds a rule such as “every failure mode with severity 9 or 10 gets an action, whatever its RPN”.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="fmeagrid" data-args="{}"></div></div><figcaption>The FMEA rows ranked by RPN. Change S, O and D for the selected row and toggle the actions; severe rows stay flagged whatever their RPN.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Nine failure modes of an illustrative self-balancing robot (ratings are a teaching example, not field data):</p>
<ol>
<li>By RPN the top three are gyro bias drift (180), the loosening wheel set-screw (180) and control-loop overruns (147).</li>
<li>The high-side MOSFET failing short (S 9, RPN 108) ranks only 5th, below the set-screw (S 6, RPN 180); being lifted while the motors run (S 9) ranks 8th.</li>
<li>The top three and both severity-9 modes have actions that reduce their RPN, for example 180 to 54 for gyro drift and 108 to 36 for the MOSFET short.</li>
<li>Only 120 distinct RPN values exist, and 24 different (S, O, D) triples give RPN 120, from (2, 6, 10) to (10, 6, 2).</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">fmea.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-comment"># Illustrative FMEA for a self-balancing two-wheeled robot. Ratings are 1 (best) to 10 (worst) on the usual</span>
<span class="hljs-comment"># severity, occurrence and detection scales; the values are a teaching example, not field data.</span>
ROWS = [
    <span class="hljs-comment"># (item, failure mode, effect, S, O, D, action, (S, O, D) after action or None)</span>
    (<span class="hljs-string">&quot;IMU&quot;</span>, <span class="hljs-string">&quot;gyro bias drifts with temperature&quot;</span>, <span class="hljs-string">&quot;robot leans and drives away slowly&quot;</span>, <span class="hljs-number">6</span>, <span class="hljs-number">6</span>, <span class="hljs-number">5</span>,
     <span class="hljs-string">&quot;online bias estimate while stationary; temperature-compensation table&quot;</span>, (<span class="hljs-number">6</span>, <span class="hljs-number">3</span>, <span class="hljs-number">3</span>)),
    (<span class="hljs-string">&quot;IMU&quot;</span>, <span class="hljs-string">&quot;I2C bus locks up&quot;</span>, <span class="hljs-string">&quot;no attitude data, robot falls over&quot;</span>, <span class="hljs-number">8</span>, <span class="hljs-number">4</span>, <span class="hljs-number">4</span>,
     <span class="hljs-string">&quot;bus timeout and recovery; watchdog on IMU data age; motor STO on stale data&quot;</span>, (<span class="hljs-number">8</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>)),
    (<span class="hljs-string">&quot;motor driver&quot;</span>, <span class="hljs-string">&quot;high-side MOSFET fails short&quot;</span>, <span class="hljs-string">&quot;wheel driven uncontrolled, robot falls or runs off&quot;</span>, <span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">6</span>,
     <span class="hljs-string">&quot;driver with desaturation detection; current-sense plausibility; power relay cut&quot;</span>, (<span class="hljs-number">9</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>)),
    (<span class="hljs-string">&quot;encoder&quot;</span>, <span class="hljs-string">&quot;connector intermittent&quot;</span>, <span class="hljs-string">&quot;wrong wheel speed, oscillation&quot;</span>, <span class="hljs-number">5</span>, <span class="hljs-number">5</span>, <span class="hljs-number">4</span>,
     <span class="hljs-string">&quot;locking connector; speed plausibility against motor current&quot;</span>, (<span class="hljs-number">5</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>)),
    (<span class="hljs-string">&quot;battery&quot;</span>, <span class="hljs-string">&quot;cell over-discharge&quot;</span>, <span class="hljs-string">&quot;brown-out resets the MCU mid-balance&quot;</span>, <span class="hljs-number">7</span>, <span class="hljs-number">4</span>, <span class="hljs-number">3</span>,
     <span class="hljs-string">&quot;BMS undervoltage warning with controlled sit-down before cut-off&quot;</span>, (<span class="hljs-number">7</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>)),
    (<span class="hljs-string">&quot;firmware&quot;</span>, <span class="hljs-string">&quot;control loop overruns its deadline&quot;</span>, <span class="hljs-string">&quot;jitter, growing oscillation&quot;</span>, <span class="hljs-number">7</span>, <span class="hljs-number">3</span>, <span class="hljs-number">7</span>,
     <span class="hljs-string">&quot;WCET measurement (Phase 18); deadline-miss counter triggers safe stop&quot;</span>, (<span class="hljs-number">7</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>)),
    (<span class="hljs-string">&quot;chassis&quot;</span>, <span class="hljs-string">&quot;wheel set-screw loosens&quot;</span>, <span class="hljs-string">&quot;wheel slips on shaft&quot;</span>, <span class="hljs-number">6</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>,
     <span class="hljs-string">&quot;keyed shaft and thread-locker; slip check comparing wheel and motor speed&quot;</span>, (<span class="hljs-number">6</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>)),
    (<span class="hljs-string">&quot;user&quot;</span>, <span class="hljs-string">&quot;lifted while motors run&quot;</span>, <span class="hljs-string">&quot;wheels spin at full speed, finger injury&quot;</span>, <span class="hljs-number">9</span>, <span class="hljs-number">3</span>, <span class="hljs-number">3</span>,
     <span class="hljs-string">&quot;detect loss of ground contact from current and attitude; cut torque&quot;</span>, (<span class="hljs-number">9</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>)),
    (<span class="hljs-string">&quot;LED&quot;</span>, <span class="hljs-string">&quot;status LED fails&quot;</span>, <span class="hljs-string">&quot;status not visible&quot;</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">8</span>, <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>),
]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rpn</span>(<span class="hljs-params">s, o, d</span>): <span class="hljs-keyword">return</span> s * o * d

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_rpn_ranking</span>():
    ranked = <span class="hljs-built_in">sorted</span>(ROWS, key=<span class="hljs-keyword">lambda</span> r: -rpn(*r[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>]))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-string">&#x27;RPN&#x27;</span>:&gt;4s}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;S&#x27;</span>:&gt;2s}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;O&#x27;</span>:&gt;2s}</span> <span class="hljs-subst">{<span class="hljs-string">&#x27;D&#x27;</span>:&gt;2s}</span>  item / failure mode -&gt; RPN after action&quot;</span>)
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> ranked:
        after = <span class="hljs-string">f&quot;<span class="hljs-subst">{rpn(*r[<span class="hljs-number">7</span>]):4d}</span>&quot;</span> <span class="hljs-keyword">if</span> r[<span class="hljs-number">7</span>] <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;   -&quot;</span>
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{rpn(*r[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>]):4d}</span> <span class="hljs-subst">{r[<span class="hljs-number">3</span>]:2d}</span> <span class="hljs-subst">{r[<span class="hljs-number">4</span>]:2d}</span> <span class="hljs-subst">{r[<span class="hljs-number">5</span>]:2d}</span>  <span class="hljs-subst">{r[<span class="hljs-number">0</span>]}</span> / <span class="hljs-subst">{r[<span class="hljs-number">1</span>]}</span> -&gt; <span class="hljs-subst">{after}</span>&quot;</span>)
    top = ranked[:<span class="hljs-number">3</span>]; severe = [r <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> ROWS <span class="hljs-keyword">if</span> r[<span class="hljs-number">3</span>] &gt;= <span class="hljs-number">9</span>]
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> top + severe:
        <span class="hljs-keyword">assert</span> r[<span class="hljs-number">6</span>] <span class="hljs-keyword">and</span> r[<span class="hljs-number">7</span>] <span class="hljs-keyword">and</span> rpn(*r[<span class="hljs-number">7</span>]) &lt; rpn(*r[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>]), r[<span class="hljs-number">1</span>]             <span class="hljs-comment"># highest risks have effective actions</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;actions on the top 3 by RPN and on all <span class="hljs-subst">{<span class="hljs-built_in">len</span>(severe)}</span> modes with severity 9 or 10&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_rpn_limits</span>():
    ranked = <span class="hljs-built_in">sorted</span>(ROWS, key=<span class="hljs-keyword">lambda</span> r: -rpn(*r[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>])); short = <span class="hljs-built_in">next</span>(r <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> ROWS <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;fails short&quot;</span> <span class="hljs-keyword">in</span> r[<span class="hljs-number">1</span>])
    screw = <span class="hljs-built_in">next</span>(r <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> ROWS <span class="hljs-keyword">if</span> r[<span class="hljs-number">0</span>] == <span class="hljs-string">&quot;chassis&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;the MOSFET short (S <span class="hljs-subst">{short[<span class="hljs-number">3</span>]}</span>, RPN <span class="hljs-subst">{rpn(*short[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>])}</span>) ranks <span class="hljs-subst">{ranked.index(short) + <span class="hljs-number">1</span>}</span>th by RPN, &quot;</span>
          <span class="hljs-string">f&quot;below the loose set-screw (S <span class="hljs-subst">{screw[<span class="hljs-number">3</span>]}</span>, RPN <span class="hljs-subst">{rpn(*screw[<span class="hljs-number">3</span>:<span class="hljs-number">6</span>])}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> ranked.index(short) &gt; ranked.index(screw)
    combos = {rpn(s, o, d) <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>) <span class="hljs-keyword">for</span> o <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>) <span class="hljs-keyword">for</span> d <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>)}
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;S x O x D can take only <span class="hljs-subst">{<span class="hljs-built_in">len</span>(combos)}</span> distinct values out of 1000 combinations, unevenly spread from 1 to 1000&quot;</span>)
    same = [(s, o, d) <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>) <span class="hljs-keyword">for</span> o <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>) <span class="hljs-keyword">for</span> d <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">1</span>, <span class="hljs-number">11</span>) <span class="hljs-keyword">if</span> s * o * d == <span class="hljs-number">120</span>]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-built_in">len</span>(same)}</span> different (S, O, D) triples give RPN 120, from <span class="hljs-subst">{<span class="hljs-built_in">min</span>(same)}</span> to <span class="hljs-subst">{<span class="hljs-built_in">max</span>(same)}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(combos) &lt; <span class="hljs-number">200</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(same) &gt; <span class="hljs-number">10</span>

test_rpn_ranking()
test_rpn_limits()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>FMEAs live in spreadsheets or dedicated FMEA tools and are reviewed by cross-functional teams; design FMEA and process FMEA (for manufacturing) follow the same pattern. The actions feed back into the design: diagnostics that improve detection (Lesson 19), redundancy and derating that reduce occurrence. Keeping the FMEA as data makes rules like “no severe mode without an action” checkable on every revision.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Compute the RPN of S 8, O 2, D 9 and compare it with S 4, O 6, D 6.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">8</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">144</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">6</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">144</span></span></span></span>: equal RPNs, but the first is a severe, hard-to-detect failure and deserves priority.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Which kind of action lowers the detection rating?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Adding a diagnostic or test that reveals the failure before it causes harm, such as a plausibility check, a watchdog, or an end-of-line test. Design changes that make the cause less likely lower occurrence instead; only design changes to the effect lower severity.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l20"></div>
`,i=[{id:`bottom-up-analysis`,title:`Bottom-up analysis`},{id:`the-risk-priority-number-and-its-limits`,title:`The risk priority number and its limits`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l20-q1`,type:`num`,q:`<p>RPN for S 7, O 4 and D 5?</p>
`,explain:`<p>S × O × D.</p>
`,answer:140,tol:.001,unit:``},{id:`p19-l20-q2`,type:`num`,q:`<p>Largest possible RPN on 1 to 10 scales?</p>
`,explain:`<p>10³.</p>
`,answer:1e3,tol:.001,unit:``},{id:`p19-l20-q3`,type:`num`,q:`<p>RPN reduction from 180 to 54 (%)?</p>
`,explain:`<p>(180 − 54)/180.</p>
`,answer:70,tol:.002,unit:``},{id:`p19-l20-q4`,type:`num`,q:`<p>New RPN if detection improves from 6 to 2 with S 9 and O 2?</p>
`,explain:`<p>Only D changes.</p>
`,answer:36,tol:.001,unit:``},{id:`p19-l20-q5`,type:`mc`,q:`<p>What is the main weakness of ranking by RPN?</p>
`,explain:`<p>Multiplying ordinal scores hides severity.</p>
`,options:[`It is too hard to compute`,`A severe failure can rank below a mild frequent one`,`It ignores occurrence`,`It only works for software`],answer:1},{id:`p19-l20-q6`,type:`mc`,q:`<p>What does a detection rating of 10 mean?</p>
`,explain:`<p>Higher D is worse.</p>
`,options:[`The failure is always detected`,`The failure never occurs`,`The effect is harmless`,`The failure cannot be detected before it causes harm`],answer:3}],o=[{file:`fmea.py`,lang:`python`,src:`# Illustrative FMEA for a self-balancing two-wheeled robot. Ratings are 1 (best) to 10 (worst) on the usual
# severity, occurrence and detection scales; the values are a teaching example, not field data.
ROWS = [
    # (item, failure mode, effect, S, O, D, action, (S, O, D) after action or None)
    ("IMU", "gyro bias drifts with temperature", "robot leans and drives away slowly", 6, 6, 5,
     "online bias estimate while stationary; temperature-compensation table", (6, 3, 3)),
    ("IMU", "I2C bus locks up", "no attitude data, robot falls over", 8, 4, 4,
     "bus timeout and recovery; watchdog on IMU data age; motor STO on stale data", (8, 3, 2)),
    ("motor driver", "high-side MOSFET fails short", "wheel driven uncontrolled, robot falls or runs off", 9, 2, 6,
     "driver with desaturation detection; current-sense plausibility; power relay cut", (9, 2, 2)),
    ("encoder", "connector intermittent", "wrong wheel speed, oscillation", 5, 5, 4,
     "locking connector; speed plausibility against motor current", (5, 2, 3)),
    ("battery", "cell over-discharge", "brown-out resets the MCU mid-balance", 7, 4, 3,
     "BMS undervoltage warning with controlled sit-down before cut-off", (7, 2, 2)),
    ("firmware", "control loop overruns its deadline", "jitter, growing oscillation", 7, 3, 7,
     "WCET measurement (Phase 18); deadline-miss counter triggers safe stop", (7, 2, 3)),
    ("chassis", "wheel set-screw loosens", "wheel slips on shaft", 6, 5, 6,
     "keyed shaft and thread-locker; slip check comparing wheel and motor speed", (6, 2, 3)),
    ("user", "lifted while motors run", "wheels spin at full speed, finger injury", 9, 3, 3,
     "detect loss of ground contact from current and attitude; cut torque", (9, 3, 1)),
    ("LED", "status LED fails", "status not visible", 2, 3, 8, None, None),
]

def rpn(s, o, d): return s * o * d

def test_rpn_ranking():
    ranked = sorted(ROWS, key=lambda r: -rpn(*r[3:6]))
    print(f"{'RPN':>4s} {'S':>2s} {'O':>2s} {'D':>2s}  item / failure mode -> RPN after action")
    for r in ranked:
        after = f"{rpn(*r[7]):4d}" if r[7] else "   -"
        print(f"{rpn(*r[3:6]):4d} {r[3]:2d} {r[4]:2d} {r[5]:2d}  {r[0]} / {r[1]} -> {after}")
    top = ranked[:3]; severe = [r for r in ROWS if r[3] >= 9]
    for r in top + severe:
        assert r[6] and r[7] and rpn(*r[7]) < rpn(*r[3:6]), r[1]             # highest risks have effective actions
    print(f"actions on the top 3 by RPN and on all {len(severe)} modes with severity 9 or 10")

def test_rpn_limits():
    ranked = sorted(ROWS, key=lambda r: -rpn(*r[3:6])); short = next(r for r in ROWS if "fails short" in r[1])
    screw = next(r for r in ROWS if r[0] == "chassis")
    print(f"the MOSFET short (S {short[3]}, RPN {rpn(*short[3:6])}) ranks {ranked.index(short) + 1}th by RPN, "
          f"below the loose set-screw (S {screw[3]}, RPN {rpn(*screw[3:6])})")
    assert ranked.index(short) > ranked.index(screw)
    combos = {rpn(s, o, d) for s in range(1, 11) for o in range(1, 11) for d in range(1, 11)}
    print(f"S x O x D can take only {len(combos)} distinct values out of 1000 combinations, unevenly spread from 1 to 1000")
    same = [(s, o, d) for s in range(1, 11) for o in range(1, 11) for d in range(1, 11) if s * o * d == 120]
    print(f"{len(same)} different (S, O, D) triples give RPN 120, from {min(same)} to {max(same)}")
    assert len(combos) < 200 and len(same) > 10

test_rpn_ranking()
test_rpn_limits()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};