var e=`p19-l13`,t=35,n=`Cells in series drift apart, and the string is only as good as its weakest and fullest cells. You simulate passive balancing, where a battery management system bleeds the high cells through resistors, measure how fast the voltage spread shrinks and how much energy becomes heat, and show the string can accept more charge afterwards.`,r=`<h2 id="why-cells-drift">Why cells drift</h2>
<p>Cells in a series string carry the same current, but they differ slightly in capacity, self-discharge and temperature. Over weeks the states of charge spread. During charging, the fullest cell reaches its maximum voltage first and charging must stop; during discharge, the emptiest cell reaches its cut-off first. A spread of a few percent can cost a noticeable share of the pack’s usable capacity, and an unbalanced cell is more likely to be overcharged.</p>
<h2 id="bleeding-the-high-cells">Bleeding the high cells</h2>
<p><strong>Passive balancing</strong> puts a resistor and a switch across each cell. The battery management system (BMS) turns on the bleed for every cell whose voltage is more than a threshold above the lowest, wasting its excess charge as heat until the voltages match:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8095em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">i</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">b</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">ee</span><span class="mord mathnormal mtight">d</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.9436em;vertical-align:-0.836em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.1076em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">b</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">ee</span><span class="mord mathnormal mtight">d</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ce</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.836em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.3271em;vertical-align:-0.836em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.4911em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">b</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">ee</span><span class="mord mathnormal mtight">d</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-2.4169em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ce</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span></span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2831em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.836em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>Bleed currents are small (tens to a few hundred mA), so balancing is slow and typically runs near the top of charge or while the pack rests, when OCV differences reflect SOC differences. <strong>Active balancing</strong> shuttles charge between cells with inductors or capacitors instead of burning it, at higher cost and complexity.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="balancebars" data-args="{}"></div></div><figcaption>Six cells in series with their voltages. Toggle balancing, change the bleed resistor and threshold, and step time forward; bleeding cells are highlighted.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Six illustrative cells, SOC 90 to 97 %, capacities 2.9 to 3.05 Ah, 33 Ω bleed resistors, 5 mV threshold:</p>
<ol>
<li>Initial spread 74.1 mV (7.0 % SOC).</li>
<li>Below 10 mV after 1.47 h; 5.0 mV (the threshold) after 12 h, with 2.687 Wh turned into heat.</li>
<li>The lowest cell is never touched (SOC 0.9000 before and after).</li>
<li>The charge the string can accept before its fullest cell is full rises from 0.092 Ah to 0.277 Ah.</li>
<li>Each bleed resistor at 4.0 V draws 121 mA and dissipates 485 mW, which the board layout must handle.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">balance.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">ocv</span>(<span class="hljs-params">s</span>): <span class="hljs-keyword">return</span> <span class="hljs-number">3.0</span> + <span class="hljs-number">1.2</span> * s - <span class="hljs-number">0.25</span> * np.exp(-<span class="hljs-number">12</span> * s) + <span class="hljs-number">0.05</span> * np.sin(<span class="hljs-number">3</span> * s)   <span class="hljs-comment"># illustrative curve (Lesson 11)</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">balance</span>(<span class="hljs-params">soc0, q_ah, r_bleed=<span class="hljs-number">33.0</span>, threshold_mv=<span class="hljs-number">5.0</span>, hours=<span class="hljs-number">12.0</span>, dt=<span class="hljs-number">10.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;passive balancing at rest: every cell more than threshold above the lowest cell voltage bleeds through its resistor.&quot;&quot;&quot;</span>
    soc = np.array(soc0, <span class="hljs-built_in">float</span>); q = np.array(q_ah, <span class="hljs-built_in">float</span>) * <span class="hljs-number">3600</span>; heat = <span class="hljs-number">0.0</span>; t = <span class="hljs-number">0.0</span>; log = []
    <span class="hljs-keyword">while</span> t &lt; hours * <span class="hljs-number">3600</span>:
        v = ocv(soc); on = v &gt; v.<span class="hljs-built_in">min</span>() + threshold_mv / <span class="hljs-number">1000</span>
        i = np.where(on, v / r_bleed, <span class="hljs-number">0.0</span>); heat += np.<span class="hljs-built_in">sum</span>(i * v) * dt
        soc -= i * dt / q; t += dt; log.append(<span class="hljs-number">1000</span> * (v.<span class="hljs-built_in">max</span>() - v.<span class="hljs-built_in">min</span>()))
    <span class="hljs-keyword">return</span> soc, heat / <span class="hljs-number">3600</span>, np.array(log)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pack_window</span>(<span class="hljs-params">soc, q_ah</span>):
    q = np.array(q_ah); down = np.<span class="hljs-built_in">min</span>(soc * q); up = np.<span class="hljs-built_in">min</span>((<span class="hljs-number">1</span> - soc) * q)   <span class="hljs-comment"># Ah available before any cell hits a limit</span>
    <span class="hljs-keyword">return</span> down, up

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_balancing</span>():
    soc0 = [<span class="hljs-number">0.95</span>, <span class="hljs-number">0.92</span>, <span class="hljs-number">0.97</span>, <span class="hljs-number">0.90</span>, <span class="hljs-number">0.94</span>, <span class="hljs-number">0.96</span>]; q = [<span class="hljs-number">3.0</span>, <span class="hljs-number">2.9</span>, <span class="hljs-number">3.05</span>, <span class="hljs-number">3.0</span>, <span class="hljs-number">2.95</span>, <span class="hljs-number">3.0</span>]
    v0 = <span class="hljs-number">1000</span> * (ocv(np.array(soc0)).<span class="hljs-built_in">max</span>() - ocv(np.array(soc0)).<span class="hljs-built_in">min</span>())
    soc, wh, log = balance(soc0, q)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;initial spread <span class="hljs-subst">{v0:<span class="hljs-number">.1</span>f}</span> mV (<span class="hljs-subst">{<span class="hljs-number">100</span> * (<span class="hljs-built_in">max</span>(soc0) - <span class="hljs-built_in">min</span>(soc0)):<span class="hljs-number">.1</span>f}</span> % SOC)&quot;</span>)
    hrs = np.argmax(log &lt; <span class="hljs-number">10</span>) * <span class="hljs-number">10</span> / <span class="hljs-number">3600</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;after 12 h at 33 ohm: spread <span class="hljs-subst">{log[-<span class="hljs-number">1</span>]:<span class="hljs-number">.1</span>f}</span> mV, below 10 mV after <span class="hljs-subst">{hrs:<span class="hljs-number">.2</span>f}</span> h, <span class="hljs-subst">{wh:<span class="hljs-number">.3</span>f}</span> Wh turned into heat&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;lowest cell untouched: <span class="hljs-subst">{soc0[<span class="hljs-number">3</span>]:<span class="hljs-number">.4</span>f}</span> -&gt; <span class="hljs-subst">{soc[<span class="hljs-number">3</span>]:<span class="hljs-number">.4</span>f}</span>&quot;</span>)
    d0, u0 = pack_window(np.array(soc0), q); d1, u1 = pack_window(soc, q)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;charge the string can still accept before the fullest cell is full: <span class="hljs-subst">{u0:<span class="hljs-number">.3</span>f}</span> Ah -&gt; <span class="hljs-subst">{u1:<span class="hljs-number">.3</span>f}</span> Ah&quot;</span>)
    <span class="hljs-keyword">assert</span> log[-<span class="hljs-number">1</span>] &lt; <span class="hljs-number">0.25</span> * v0 <span class="hljs-keyword">and</span> log[-<span class="hljs-number">1</span>] &lt; <span class="hljs-number">10</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(soc[<span class="hljs-number">3</span>] - soc0[<span class="hljs-number">3</span>]) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">and</span> u1 &gt; u0

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_bleed_current</span>():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;bleed current at 4.0 V through 33 ohm: <span class="hljs-subst">{<span class="hljs-number">1000</span> * <span class="hljs-number">4.0</span> / <span class="hljs-number">33</span>:<span class="hljs-number">.0</span>f}</span> mA, <span class="hljs-subst">{<span class="hljs-number">1000</span> * <span class="hljs-number">4.0</span>**<span class="hljs-number">2</span> / <span class="hljs-number">33</span>:<span class="hljs-number">.0</span>f}</span> mW per cell&quot;</span>)

test_balancing()
test_bleed_current()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Cell-monitoring ICs (from Analog Devices, Texas Instruments, NXP and others) measure every cell voltage and drive internal or external bleed switches; the BMS firmware decides when to balance. Open-source BMS projects such as foxBMS (a research platform from Fraunhofer IISB) show complete implementations. Thermal limits often cap how many cells can bleed at once.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>How long does a 100 mA bleed take to remove 2 % of a 3 Ah cell’s charge?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.02</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.06</span></span></span></span> Ah, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.06/0.1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.6</span></span></span></span> h, 36 minutes.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why balance at the top of charge rather than mid-range for an LFP pack?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The LFP OCV curve is flat in the middle, so small voltage differences hide large SOC differences. Near full the curve steepens and voltage reveals which cells are high.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l13"></div>
`,i=[{id:`why-cells-drift`,title:`Why cells drift`},{id:`bleeding-the-high-cells`,title:`Bleeding the high cells`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l13-q1`,type:`num`,q:`<p>Bleed current at 4.1 V through 47 Ω (mA)?</p>
`,explain:`<p>v / R.</p>
`,answer:87.2,tol:.003,unit:``},{id:`p19-l13-q2`,type:`num`,q:`<p>Power in a 33 Ω bleed resistor at 4.2 V (W)?</p>
`,explain:`<p>v² / R.</p>
`,answer:.535,tol:.003,unit:``},{id:`p19-l13-q3`,type:`num`,q:`<p>Hours to bleed 0.15 Ah at 120 mA?</p>
`,explain:`<p>Charge over current.</p>
`,answer:1.25,tol:.002,unit:``},{id:`p19-l13-q4`,type:`num`,q:`<p>Energy wasted bleeding 0.1 Ah at about 4 V (Wh)?</p>
`,explain:`<p>Charge times voltage.</p>
`,answer:.4,tol:.002,unit:``},{id:`p19-l13-q5`,type:`mc`,q:`<p>Which cell limits charging in a series string?</p>
`,explain:`<p>It reaches maximum voltage first.</p>
`,options:[`The fullest cell`,`The middle cell`,`The emptiest cell`,`None, the pack voltage decides`],answer:0},{id:`p19-l13-q6`,type:`mc`,q:`<p>What does passive balancing do with excess charge?</p>
`,explain:`<p>Active balancing moves charge; passive burns it.</p>
`,options:[`Turns it into heat in a resistor`,`Returns it to the charger`,`Stores it in a capacitor permanently`,`Moves it to the lowest cell`],answer:0}],o=[{file:`balance.py`,lang:`python`,src:`import numpy as np

def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)   # illustrative curve (Lesson 11)

def balance(soc0, q_ah, r_bleed=33.0, threshold_mv=5.0, hours=12.0, dt=10.0):
    """passive balancing at rest: every cell more than threshold above the lowest cell voltage bleeds through its resistor."""
    soc = np.array(soc0, float); q = np.array(q_ah, float) * 3600; heat = 0.0; t = 0.0; log = []
    while t < hours * 3600:
        v = ocv(soc); on = v > v.min() + threshold_mv / 1000
        i = np.where(on, v / r_bleed, 0.0); heat += np.sum(i * v) * dt
        soc -= i * dt / q; t += dt; log.append(1000 * (v.max() - v.min()))
    return soc, heat / 3600, np.array(log)

def pack_window(soc, q_ah):
    q = np.array(q_ah); down = np.min(soc * q); up = np.min((1 - soc) * q)   # Ah available before any cell hits a limit
    return down, up

def test_balancing():
    soc0 = [0.95, 0.92, 0.97, 0.90, 0.94, 0.96]; q = [3.0, 2.9, 3.05, 3.0, 2.95, 3.0]
    v0 = 1000 * (ocv(np.array(soc0)).max() - ocv(np.array(soc0)).min())
    soc, wh, log = balance(soc0, q)
    print(f"initial spread {v0:.1f} mV ({100 * (max(soc0) - min(soc0)):.1f} % SOC)")
    hrs = np.argmax(log < 10) * 10 / 3600
    print(f"after 12 h at 33 ohm: spread {log[-1]:.1f} mV, below 10 mV after {hrs:.2f} h, {wh:.3f} Wh turned into heat")
    print(f"lowest cell untouched: {soc0[3]:.4f} -> {soc[3]:.4f}")
    d0, u0 = pack_window(np.array(soc0), q); d1, u1 = pack_window(soc, q)
    print(f"charge the string can still accept before the fullest cell is full: {u0:.3f} Ah -> {u1:.3f} Ah")
    assert log[-1] < 0.25 * v0 and log[-1] < 10 and abs(soc[3] - soc0[3]) < 1e-12 and u1 > u0

def test_bleed_current():
    print(f"bleed current at 4.0 V through 33 ohm: {1000 * 4.0 / 33:.0f} mA, {1000 * 4.0**2 / 33:.0f} mW per cell")

test_balancing()
test_bleed_current()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};