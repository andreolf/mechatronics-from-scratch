var e=`p19-l14`,t=40,n=`Lithium-ion cells charge with constant current, then constant voltage. You write the charger as a state machine with precharge, CC, CV, done and fault states, close a voltage loop with a clamped integrator, and check on a simulated cell that voltage and current never exceed their limits and that over-temperature stops charging.`,r=`<h2 id="the-cc-cv-profile">The CC/CV profile</h2>
<p>A Li-ion charger pushes a <strong>constant current</strong> (CC), often 0.5C to 1C, until the cell voltage reaches its maximum (4.2 V for many NMC cells). It then holds that <strong>constant voltage</strong> (CV) while the current tapers as the cell’s internal RC voltages relax, and stops when the current falls below a termination level such as C/20. A deeply discharged cell first gets a small <strong>precharge</strong> current (C/10) until it recovers above about 3.0 V. Never exceeding the maximum voltage matters: overcharge causes lithium plating and can lead to thermal runaway.</p>
<h2 id="a-state-machine">A state machine</h2>
<p>States are the clearest way to write the logic:</p>
<ul>
<li>IDLE chooses PRECHARGE or CC from the voltage;</li>
<li>PRECHARGE moves to CC above <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span><span class="mord mathnormal mtight">e</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span>;</li>
<li>CC moves to CV near <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>;</li>
<li>CV ends in DONE once <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6986em;vertical-align:-0.0391em;"></span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">e</span><span class="mord mathnormal mtight">n</span><span class="mord mathnormal mtight">d</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>;</li>
<li>any active state goes to FAULT on temperature outside 0 to 45 °C, a timeout, or overvoltage.</li>
</ul>
<p>In CV, a PI loop adjusts the current command from the voltage error <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span></span></span></span>. Its integrator must be clamped (anti-windup) and initialised to the CC current when CV starts (bumpless transfer); without both, the simulation overshot by about 10 mV. The values here are illustrative; use the cell datasheet’s limits.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="ccvcplot" data-args="{}"></div></div><figcaption>Voltage, current and state through a charge. Change the CC rate, termination current and the cell’s temperature rise; a fault shows where charging stopped.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative 3 Ah cell from 2 % SOC, 1C CC, 4.20 V, termination C/20, half-second steps:</p>
<ol>
<li>PRECHARGE from 0.0 min, CC from 30.6 min, CV from 79.0 min, DONE at 98.7 min with SOC 98.8 %.</li>
<li>Maximum voltage 4.2009 V (within the 5 mV regulation tolerance), maximum current 3.000 A.</li>
<li>83 % of the charge went in during CC; CV adds the last part slowly.</li>
<li>With the cell heating 1 K per minute from 25 °C, the charger faults at 20.0 min (45 °C) and the current goes to 0.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">charger.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

Q = <span class="hljs-number">3.0</span>; R0, R1, C1 = <span class="hljs-number">0.022</span>, <span class="hljs-number">0.015</span>, <span class="hljs-number">1500.0</span>                          <span class="hljs-comment"># illustrative cell (Lessons 10-12)</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">ocv</span>(<span class="hljs-params">s</span>): <span class="hljs-keyword">return</span> <span class="hljs-number">3.0</span> + <span class="hljs-number">1.2</span> * s - <span class="hljs-number">0.25</span> * np.exp(-<span class="hljs-number">12</span> * s) + <span class="hljs-number">0.05</span> * np.sin(<span class="hljs-number">3</span> * s)

V_MAX, V_PRE, I_CC, I_PRE, I_END = <span class="hljs-number">4.20</span>, <span class="hljs-number">3.00</span>, <span class="hljs-number">1.0</span> * Q, <span class="hljs-number">0.1</span> * Q, <span class="hljs-number">0.05</span> * Q
T_MIN, T_MAX, TIMEOUT = <span class="hljs-number">0.0</span>, <span class="hljs-number">45.0</span>, <span class="hljs-number">4</span> * <span class="hljs-number">3600</span>
V_TOL = <span class="hljs-number">0.005</span>                                                      <span class="hljs-comment"># regulation tolerance (illustrative; check the cell datasheet)</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Charger</span>:
    <span class="hljs-string">&quot;&quot;&quot;IDLE -&gt; PRECHARGE (deeply empty) -&gt; CC -&gt; CV -&gt; DONE, with FAULT from any active state.&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>): <span class="hljs-variable language_">self</span>.state, <span class="hljs-variable language_">self</span>.i, <span class="hljs-variable language_">self</span>.integ, <span class="hljs-variable language_">self</span>.t = <span class="hljs-string">&quot;IDLE&quot;</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">self, v, temp, dt</span>):
        s = <span class="hljs-variable language_">self</span>.state
        <span class="hljs-keyword">if</span> s <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;PRECHARGE&quot;</span>, <span class="hljs-string">&quot;CC&quot;</span>, <span class="hljs-string">&quot;CV&quot;</span>):
            <span class="hljs-variable language_">self</span>.t += dt
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> (T_MIN &lt;= temp &lt;= T_MAX) <span class="hljs-keyword">or</span> <span class="hljs-variable language_">self</span>.t &gt; TIMEOUT <span class="hljs-keyword">or</span> v &gt; V_MAX + <span class="hljs-number">0.05</span>: <span class="hljs-variable language_">self</span>.state = <span class="hljs-string">&quot;FAULT&quot;</span>
        <span class="hljs-keyword">if</span> s == <span class="hljs-string">&quot;IDLE&quot;</span>: <span class="hljs-variable language_">self</span>.state = <span class="hljs-string">&quot;PRECHARGE&quot;</span> <span class="hljs-keyword">if</span> v &lt; V_PRE <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;CC&quot;</span>
        <span class="hljs-keyword">elif</span> s == <span class="hljs-string">&quot;PRECHARGE&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.state != <span class="hljs-string">&quot;FAULT&quot;</span>:
            <span class="hljs-keyword">if</span> v &gt;= V_PRE: <span class="hljs-variable language_">self</span>.state = <span class="hljs-string">&quot;CC&quot;</span>
        <span class="hljs-keyword">elif</span> s == <span class="hljs-string">&quot;CC&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.state != <span class="hljs-string">&quot;FAULT&quot;</span>:
            <span class="hljs-keyword">if</span> v &gt;= V_MAX - <span class="hljs-number">0.010</span>: <span class="hljs-variable language_">self</span>.state, <span class="hljs-variable language_">self</span>.integ = <span class="hljs-string">&quot;CV&quot;</span>, <span class="hljs-variable language_">self</span>.i - <span class="hljs-number">20.0</span> * (V_MAX - v)   <span class="hljs-comment"># bumpless transfer</span>
        <span class="hljs-keyword">elif</span> s == <span class="hljs-string">&quot;CV&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.state != <span class="hljs-string">&quot;FAULT&quot;</span>:
            <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.i &lt; I_END: <span class="hljs-variable language_">self</span>.state = <span class="hljs-string">&quot;DONE&quot;</span>
        st = <span class="hljs-variable language_">self</span>.state
        <span class="hljs-keyword">if</span> st == <span class="hljs-string">&quot;PRECHARGE&quot;</span>: <span class="hljs-variable language_">self</span>.i = I_PRE
        <span class="hljs-keyword">elif</span> st == <span class="hljs-string">&quot;CC&quot;</span>: <span class="hljs-variable language_">self</span>.i = <span class="hljs-built_in">min</span>(I_CC, <span class="hljs-variable language_">self</span>.i + I_CC * dt / <span class="hljs-number">2</span>)                  <span class="hljs-comment"># soft start, 2 s ramp</span>
        <span class="hljs-keyword">elif</span> st == <span class="hljs-string">&quot;CV&quot;</span>:
            <span class="hljs-variable language_">self</span>.integ = <span class="hljs-built_in">float</span>(np.clip(<span class="hljs-variable language_">self</span>.integ + <span class="hljs-number">10.0</span> * (V_MAX - v) * dt, <span class="hljs-number">0</span>, I_CC))     <span class="hljs-comment"># PI voltage loop, clamped integrator (anti-windup)</span>
            <span class="hljs-variable language_">self</span>.i = <span class="hljs-built_in">float</span>(np.clip(<span class="hljs-variable language_">self</span>.integ + <span class="hljs-number">20.0</span> * (V_MAX - v), <span class="hljs-number">0</span>, I_CC))
        <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>.i = <span class="hljs-number">0.0</span>
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.i

<span class="hljs-keyword">def</span> <span class="hljs-title function_">charge</span>(<span class="hljs-params">soc0=<span class="hljs-number">0.02</span>, temp=<span class="hljs-keyword">lambda</span> t: <span class="hljs-number">25.0</span>, dt=<span class="hljs-number">0.5</span></span>):
    ch = Charger(); soc, v1, t = soc0, <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>; log = []
    a = np.exp(-dt / (R1 * C1))
    <span class="hljs-keyword">while</span> ch.state <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;DONE&quot;</span>, <span class="hljs-string">&quot;FAULT&quot;</span>) <span class="hljs-keyword">and</span> t &lt; <span class="hljs-number">6</span> * <span class="hljs-number">3600</span>:
        v = ocv(soc) + R0 * ch.i + v1                                                  <span class="hljs-comment"># terminal voltage while charging</span>
        i = ch.step(v, temp(t), dt)
        v = ocv(soc) + R0 * i + v1
        log.append((t, ch.state, i, v, soc))
        v1 = a * v1 + R1 * (<span class="hljs-number">1</span> - a) * i; soc += i * dt / (Q * <span class="hljs-number">3600</span>); t += dt
    <span class="hljs-keyword">return</span> ch, log

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_full_charge</span>():
    ch, log = charge()
    t, st, i, v, soc = <span class="hljs-built_in">map</span>(np.array, <span class="hljs-built_in">zip</span>(*log))
    first = {s: t[st == s][<span class="hljs-number">0</span>] / <span class="hljs-number">60</span> <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;PRECHARGE&quot;</span>, <span class="hljs-string">&quot;CC&quot;</span>, <span class="hljs-string">&quot;CV&quot;</span>)}
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;state entered at (min): &quot;</span> + <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{k}</span> <span class="hljs-subst">{val:<span class="hljs-number">.1</span>f}</span>&quot;</span> <span class="hljs-keyword">for</span> k, val <span class="hljs-keyword">in</span> first.items()))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;finished <span class="hljs-subst">{ch.state}</span> after <span class="hljs-subst">{t[-<span class="hljs-number">1</span>] / <span class="hljs-number">60</span>:<span class="hljs-number">.1</span>f}</span> min at SOC <span class="hljs-subst">{<span class="hljs-number">100</span> * soc[-<span class="hljs-number">1</span>]:<span class="hljs-number">.1</span>f}</span> %&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;max voltage <span class="hljs-subst">{v.<span class="hljs-built_in">max</span>():<span class="hljs-number">.4</span>f}</span> V (limit <span class="hljs-subst">{V_MAX}</span> V + <span class="hljs-subst">{<span class="hljs-number">1000</span> * V_TOL:<span class="hljs-number">.0</span>f}</span> mV tolerance), max current <span class="hljs-subst">{i.<span class="hljs-built_in">max</span>():<span class="hljs-number">.3</span>f}</span> A (limit <span class="hljs-subst">{I_CC}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> ch.state == <span class="hljs-string">&quot;DONE&quot;</span> <span class="hljs-keyword">and</span> v.<span class="hljs-built_in">max</span>() &lt;= V_MAX + V_TOL <span class="hljs-keyword">and</span> i.<span class="hljs-built_in">max</span>() &lt;= I_CC + <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> soc[-<span class="hljs-number">1</span>] &gt; <span class="hljs-number">0.95</span>
    cc_share = <span class="hljs-number">100</span> * np.<span class="hljs-built_in">sum</span>(i[st == <span class="hljs-string">&quot;CC&quot;</span>]) / np.<span class="hljs-built_in">sum</span>(i)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{cc_share:<span class="hljs-number">.0</span>f}</span> % of the charge went in during CC&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_temperature_fault</span>():
    ch, log = charge(soc0=<span class="hljs-number">0.5</span>, temp=<span class="hljs-keyword">lambda</span> t: <span class="hljs-number">25</span> + t / <span class="hljs-number">60</span>)                            <span class="hljs-comment"># cell heats 1 K per minute</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;over-temperature: <span class="hljs-subst">{ch.state}</span> after <span class="hljs-subst">{log[-<span class="hljs-number">1</span>][<span class="hljs-number">0</span>] / <span class="hljs-number">60</span>:<span class="hljs-number">.1</span>f}</span> min, current then <span class="hljs-subst">{log[-<span class="hljs-number">1</span>][<span class="hljs-number">2</span>]:<span class="hljs-number">.1</span>f}</span> A&quot;</span>)
    <span class="hljs-keyword">assert</span> ch.state == <span class="hljs-string">&quot;FAULT&quot;</span> <span class="hljs-keyword">and</span> log[-<span class="hljs-number">1</span>][<span class="hljs-number">2</span>] == <span class="hljs-number">0.0</span>

test_full_charge()
test_temperature_fault()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Charger ICs implement this state machine in hardware with their own timers and temperature (NTC) inputs; BMS firmware adds JEITA-style temperature-dependent current and voltage limits. Writing the logic as an explicit state machine, as here, keeps every transition reviewable and testable, and the same pattern carries over to the safety logic later in this phase.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A 2.5 Ah cell, 0.7C charge, termination C/20: what are the CC and termination currents?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>CC <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.3669em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.7</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.75</span></span></span></span> A; termination <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.3669em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2.5/20</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.125</span></span></span></span> A.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What happens without anti-windup in the CV loop?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>While the current is saturated at the CC limit, the integrator keeps accumulating the voltage error, so when the voltage reaches the limit the command stays high until the integrator unwinds: the voltage overshoots its maximum.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l14"></div>
`,i=[{id:`the-cc-cv-profile`,title:`The CC/CV profile`},{id:`a-state-machine`,title:`A state machine`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l14-q1`,type:`num`,q:`<p>Precharge current at C/10 for a 3.5 Ah cell (A)?</p>
`,explain:`<p>Capacity over 10.</p>
`,answer:.35,tol:.002,unit:``},{id:`p19-l14-q2`,type:`num`,q:`<p>Termination current at C/20 for a 4 Ah cell (mA)?</p>
`,explain:`<p>Capacity over 20.</p>
`,answer:200,tol:.001,unit:``},{id:`p19-l14-q3`,type:`num`,q:`<p>Minutes of CC at 1C to add 80 % SOC (ignoring losses)?</p>
`,explain:`<p>1C adds 100 % per hour.</p>
`,answer:48,tol:.001,unit:``},{id:`p19-l14-q4`,type:`num`,q:`<p>Voltage during CC with OCV 4.0 V, 3 A, R0 22 mΩ and v1 30 mV (V)?</p>
`,explain:`<p>Charging adds the drops.</p>
`,answer:4.096,tol:.001,unit:``},{id:`p19-l14-q5`,type:`mc`,q:`<p>When does a CC/CV charger terminate?</p>
`,explain:`<p>The taper current signals full.</p>
`,options:[`When the cell is warm`,`After exactly one hour`,`As soon as the voltage reaches the maximum`,`When the current in CV falls below the termination level`],answer:3},{id:`p19-l14-q6`,type:`mc`,q:`<p>What should over-temperature during charging do?</p>
`,explain:`<p>Fail safe.</p>
`,options:[`Nothing`,`Increase the current`,`Enter a fault state with zero current`,`Switch to CV`],answer:2}],o=[{file:`charger.py`,lang:`python`,src:`import numpy as np

Q = 3.0; R0, R1, C1 = 0.022, 0.015, 1500.0                          # illustrative cell (Lessons 10-12)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)

V_MAX, V_PRE, I_CC, I_PRE, I_END = 4.20, 3.00, 1.0 * Q, 0.1 * Q, 0.05 * Q
T_MIN, T_MAX, TIMEOUT = 0.0, 45.0, 4 * 3600
V_TOL = 0.005                                                      # regulation tolerance (illustrative; check the cell datasheet)

class Charger:
    """IDLE -> PRECHARGE (deeply empty) -> CC -> CV -> DONE, with FAULT from any active state."""
    def __init__(self): self.state, self.i, self.integ, self.t = "IDLE", 0.0, 0.0, 0.0
    def step(self, v, temp, dt):
        s = self.state
        if s in ("PRECHARGE", "CC", "CV"):
            self.t += dt
            if not (T_MIN <= temp <= T_MAX) or self.t > TIMEOUT or v > V_MAX + 0.05: self.state = "FAULT"
        if s == "IDLE": self.state = "PRECHARGE" if v < V_PRE else "CC"
        elif s == "PRECHARGE" and self.state != "FAULT":
            if v >= V_PRE: self.state = "CC"
        elif s == "CC" and self.state != "FAULT":
            if v >= V_MAX - 0.010: self.state, self.integ = "CV", self.i - 20.0 * (V_MAX - v)   # bumpless transfer
        elif s == "CV" and self.state != "FAULT":
            if self.i < I_END: self.state = "DONE"
        st = self.state
        if st == "PRECHARGE": self.i = I_PRE
        elif st == "CC": self.i = min(I_CC, self.i + I_CC * dt / 2)                  # soft start, 2 s ramp
        elif st == "CV":
            self.integ = float(np.clip(self.integ + 10.0 * (V_MAX - v) * dt, 0, I_CC))     # PI voltage loop, clamped integrator (anti-windup)
            self.i = float(np.clip(self.integ + 20.0 * (V_MAX - v), 0, I_CC))
        else: self.i = 0.0
        return self.i

def charge(soc0=0.02, temp=lambda t: 25.0, dt=0.5):
    ch = Charger(); soc, v1, t = soc0, 0.0, 0.0; log = []
    a = np.exp(-dt / (R1 * C1))
    while ch.state not in ("DONE", "FAULT") and t < 6 * 3600:
        v = ocv(soc) + R0 * ch.i + v1                                                  # terminal voltage while charging
        i = ch.step(v, temp(t), dt)
        v = ocv(soc) + R0 * i + v1
        log.append((t, ch.state, i, v, soc))
        v1 = a * v1 + R1 * (1 - a) * i; soc += i * dt / (Q * 3600); t += dt
    return ch, log

def test_full_charge():
    ch, log = charge()
    t, st, i, v, soc = map(np.array, zip(*log))
    first = {s: t[st == s][0] / 60 for s in ("PRECHARGE", "CC", "CV")}
    print("state entered at (min): " + ", ".join(f"{k} {val:.1f}" for k, val in first.items()))
    print(f"finished {ch.state} after {t[-1] / 60:.1f} min at SOC {100 * soc[-1]:.1f} %")
    print(f"max voltage {v.max():.4f} V (limit {V_MAX} V + {1000 * V_TOL:.0f} mV tolerance), max current {i.max():.3f} A (limit {I_CC})")
    assert ch.state == "DONE" and v.max() <= V_MAX + V_TOL and i.max() <= I_CC + 1e-9 and soc[-1] > 0.95
    cc_share = 100 * np.sum(i[st == "CC"]) / np.sum(i)
    print(f"{cc_share:.0f} % of the charge went in during CC")

def test_temperature_fault():
    ch, log = charge(soc0=0.5, temp=lambda t: 25 + t / 60)                            # cell heats 1 K per minute
    print(f"over-temperature: {ch.state} after {log[-1][0] / 60:.1f} min, current then {log[-1][2]:.1f} A")
    assert ch.state == "FAULT" and log[-1][2] == 0.0

test_full_charge()
test_temperature_fault()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};