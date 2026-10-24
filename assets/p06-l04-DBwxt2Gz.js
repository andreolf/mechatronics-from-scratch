var e=`p06-l04`,t=30,n=`Every logic gate is a pair of transistor networks fighting over one wire. You derive the CMOS pull-up/pull-down duality, model NAND and NOR as switch graphs, check their truth tables, and compute why static power is nearly zero while switching power grows with frequency.`,r=`<h2 id="transistors-as-switches">Transistors as switches</h2>
<p>In CMOS logic both transistor types act as switches (lesson 13 of Phase 05):</p>
<ul>
<li><strong>NMOS</strong> conducts when its gate is high. It’s good at pulling the output down to ground.</li>
<li><strong>PMOS</strong> conducts when its gate is low. It’s good at pulling the output up to VDD.</li>
</ul>
<p>A gate has a <strong>pull-up network</strong> of PMOS between VDD and the output, and a <strong>pull-down network</strong> of NMOS between the output and ground. The two are <strong>duals</strong>: where one has transistors in series, the other has them in parallel. For every input combination exactly one network conducts, so the output is always driven firmly to 0 or 1.</p>
<ul>
<li><strong>Inverter</strong>: one PMOS above, one NMOS below.</li>
<li><strong>NAND</strong>: NMOS in series (output pulled low only if A <em>and</em> B are high) and PMOS in parallel.</li>
<li><strong>NOR</strong>: NMOS in parallel and PMOS in series.</li>
</ul>
<p>CMOS gates are naturally <em>inverting</em>. AND is a NAND followed by an inverter, which is why NAND and NOR are the basic cells.</p>
<h2 id="power">Power</h2>
<ul>
<li><strong>Static</strong>: with one network always off, no DC current flows from VDD to ground. Only leakage remains (nanoamps per gate, though that adds up across a billion transistors).</li>
<li><strong>Dynamic</strong>: every output transition charges or discharges the load capacitance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span>. Energy <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span> is drawn from the supply per full charge-discharge cycle, so</li>
</ul>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">d</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span><span class="mord mathnormal mtight">n</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0585em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mpunct">,</span></span></span></span></span></div>
<p>with activity factor <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span></span></span></span> (the fraction of cycles in which the node switches). That’s why lowering the supply voltage is the most effective power saving, and why microcontrollers slow their clocks in sleep modes.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="cmos" data-args="{}"></div></div><figcaption>A NAND or NOR gate as transistor switches. Toggle A and B: exactly one network conducts, and the output follows.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A microcontroller core has an effective switched capacitance of 1 nF (all its gates together, with α included), runs at 48 MHz and 1.2 V.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">9</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord">1.</span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">48</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">6</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">69.1</span></span></span></span> mW.</li>
<li>At 0.9 V and the same clock: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">38.9</span></span></span></span> mW, 44 % less, from the <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span> term alone.</li>
<li>Clock at 1 MHz in a low-power mode: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.44</span></span></span></span> mW at 1.2 V. Leakage then becomes a noticeable share.</li>
<li>Each gate drives about 2 fF; at 1.2 V one transition costs <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1901em;vertical-align:-0.345em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8451em;"><span style="top:-2.655em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">2</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.394em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.345em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.44</span></span></span></span> fJ.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">cmos.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">from</span> itertools <span class="hljs-keyword">import</span> product

<span class="hljs-keyword">def</span> <span class="hljs-title function_">conducts</span>(<span class="hljs-params">net, inputs</span>):
    <span class="hljs-string">&quot;&quot;&quot;net is (&#x27;n&#x27;, var) / (&#x27;p&#x27;, var) for a transistor, or (&#x27;series&#x27;|&#x27;parallel&#x27;, [nets]).&quot;&quot;&quot;</span>
    kind = net[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;n&quot;</span>:
        <span class="hljs-keyword">return</span> inputs[net[<span class="hljs-number">1</span>]] == <span class="hljs-number">1</span>
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;p&quot;</span>:
        <span class="hljs-keyword">return</span> inputs[net[<span class="hljs-number">1</span>]] == <span class="hljs-number">0</span>
    parts = [conducts(x, inputs) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> net[<span class="hljs-number">1</span>]]
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">all</span>(parts) <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;series&quot;</span> <span class="hljs-keyword">else</span> <span class="hljs-built_in">any</span>(parts)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">dual</span>(<span class="hljs-params">net</span>):
    <span class="hljs-string">&quot;&quot;&quot;Swap series/parallel and NMOS/PMOS: builds the pull-up from the pull-down.&quot;&quot;&quot;</span>
    kind = net[<span class="hljs-number">0</span>]
    <span class="hljs-keyword">if</span> kind <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;p&quot;</span>):
        <span class="hljs-keyword">return</span> (<span class="hljs-string">&quot;p&quot;</span> <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;n&quot;</span> <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;n&quot;</span>, net[<span class="hljs-number">1</span>])
    <span class="hljs-keyword">return</span> (<span class="hljs-string">&quot;parallel&quot;</span> <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;series&quot;</span> <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;series&quot;</span>, [dual(x) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> net[<span class="hljs-number">1</span>]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">gate</span>(<span class="hljs-params">pulldown</span>):
    pullup = dual(pulldown)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">f</span>(<span class="hljs-params">**inputs</span>):
        up, down = conducts(pullup, inputs), conducts(pulldown, inputs)
        <span class="hljs-keyword">assert</span> up != down, <span class="hljs-string">&quot;contention or floating output&quot;</span>
        <span class="hljs-keyword">return</span> <span class="hljs-number">1</span> <span class="hljs-keyword">if</span> up <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>
    <span class="hljs-keyword">return</span> f

NAND = gate((<span class="hljs-string">&quot;series&quot;</span>, [(<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;A&quot;</span>), (<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;B&quot;</span>)]))
NOR = gate((<span class="hljs-string">&quot;parallel&quot;</span>, [(<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;A&quot;</span>), (<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;B&quot;</span>)]))
AOI = gate((<span class="hljs-string">&quot;parallel&quot;</span>, [(<span class="hljs-string">&quot;series&quot;</span>, [(<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;A&quot;</span>), (<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;B&quot;</span>)]), (<span class="hljs-string">&quot;n&quot;</span>, <span class="hljs-string">&quot;C&quot;</span>)]))   <span class="hljs-comment"># (AB + C)&#x27;</span>

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> product((<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), repeat=<span class="hljs-number">2</span>):
        <span class="hljs-keyword">assert</span> NAND(A=a, B=b) == <span class="hljs-number">1</span> - (a &amp; b) <span class="hljs-keyword">and</span> NOR(A=a, B=b) == <span class="hljs-number">1</span> - (a | b)
    <span class="hljs-keyword">for</span> a, b, c <span class="hljs-keyword">in</span> product((<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), repeat=<span class="hljs-number">3</span>):
        <span class="hljs-keyword">assert</span> AOI(A=a, B=b, C=c) == <span class="hljs-number">1</span> - ((a &amp; b) | c)
    P = <span class="hljs-keyword">lambda</span> C, V, f: C * V * V * f
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(P(<span class="hljs-number">1e-9</span>, <span class="hljs-number">1.2</span>, <span class="hljs-number">48e6</span>) - <span class="hljs-number">0.06912</span>) &lt; <span class="hljs-number">1e-12</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(P(<span class="hljs-number">1e-9</span>, <span class="hljs-number">0.9</span>, <span class="hljs-number">48e6</span>) / P(<span class="hljs-number">1e-9</span>, <span class="hljs-number">1.2</span>, <span class="hljs-number">48e6</span>) - <span class="hljs-number">0.5625</span>) &lt; <span class="hljs-number">1e-12</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;NAND, NOR and AND-OR-INVERT truth tables verified; one network always conducts&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Design the pull-down and pull-up networks for <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">Y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">A</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0019em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mclose">)</span><span class="mclose"><span class="mclose">)</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span></span></span></span>.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Pull-down: NMOS A in series with (NMOS B parallel NMOS C). Pull-up (dual): PMOS A in parallel with (PMOS B in series with PMOS C). Six transistors.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What happens if both networks conduct at once, and when can that happen briefly?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Current flows straight from VDD to ground (short-circuit or “crowbar” current). It happens for a moment during slow input transitions, when the input sits mid-way and both transistor types are partly on, which is another reason to keep edges fast and use Schmitt inputs for slow signals.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l04"></div>

`,i=[{id:`transistors-as-switches`,title:`Transistors as switches`},{id:`power`,title:`Power`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l04-q1`,type:`mc`,q:`<p>In a CMOS NAND gate, the NMOS transistors are…</p>
`,explain:`<p>The output is pulled low only when A and B are both high.</p>
`,options:[`in parallel`,`in series`,`absent`,`connected to VDD`],answer:1},{id:`p06-l04-q2`,type:`mc`,q:`<p>A PMOS transistor conducts when its gate is…</p>
`,explain:`<p>It’s the complement of NMOS.</p>
`,options:[`high`,`low`,`floating`,`at mid-rail only`],answer:1},{id:`p06-l04-q3`,type:`num`,q:`<p>Dynamic power in mW for C = 1 nF, V = 1.2 V, f = 48 MHz?</p>
`,explain:`<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0085em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span></span></span></span>.</p>
`,answer:69.12,tol:.001,unit:`mW`},{id:`p06-l04-q4`,type:`num`,q:`<p>Ratio of dynamic power at 0.9 V to 1.2 V?</p>
`,explain:`<p>Power scales with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span>.</p>
`,answer:.5625,tol:.001,unit:``},{id:`p06-l04-q5`,type:`mc`,q:`<p>The static power of an ideal CMOS gate is…</p>
`,explain:`<p>Only leakage remains.</p>
`,options:[`large`,`nearly zero, because one network is always off`,`proportional to frequency`,`the same as dynamic power`],answer:1},{id:`p06-l04-q6`,type:`num`,q:`<p>How many transistors does a 2-input CMOS NOR gate use?</p>
`,explain:`<p>Two NMOS in parallel and two PMOS in series.</p>
`,answer:4,tol:.001,unit:``}],o=[{file:`cmos.py`,lang:`python`,src:`from itertools import product

def conducts(net, inputs):
    """net is ('n', var) / ('p', var) for a transistor, or ('series'|'parallel', [nets])."""
    kind = net[0]
    if kind == "n":
        return inputs[net[1]] == 1
    if kind == "p":
        return inputs[net[1]] == 0
    parts = [conducts(x, inputs) for x in net[1]]
    return all(parts) if kind == "series" else any(parts)

def dual(net):
    """Swap series/parallel and NMOS/PMOS: builds the pull-up from the pull-down."""
    kind = net[0]
    if kind in ("n", "p"):
        return ("p" if kind == "n" else "n", net[1])
    return ("parallel" if kind == "series" else "series", [dual(x) for x in net[1]])

def gate(pulldown):
    pullup = dual(pulldown)
    def f(**inputs):
        up, down = conducts(pullup, inputs), conducts(pulldown, inputs)
        assert up != down, "contention or floating output"
        return 1 if up else 0
    return f

NAND = gate(("series", [("n", "A"), ("n", "B")]))
NOR = gate(("parallel", [("n", "A"), ("n", "B")]))
AOI = gate(("parallel", [("series", [("n", "A"), ("n", "B")]), ("n", "C")]))   # (AB + C)'

if __name__ == "__main__":
    for a, b in product((0, 1), repeat=2):
        assert NAND(A=a, B=b) == 1 - (a & b) and NOR(A=a, B=b) == 1 - (a | b)
    for a, b, c in product((0, 1), repeat=3):
        assert AOI(A=a, B=b, C=c) == 1 - ((a & b) | c)
    P = lambda C, V, f: C * V * V * f
    assert abs(P(1e-9, 1.2, 48e6) - 0.06912) < 1e-12 and abs(P(1e-9, 0.9, 48e6) / P(1e-9, 1.2, 48e6) - 0.5625) < 1e-12
    print("NAND, NOR and AND-OR-INVERT truth tables verified; one network always conducts")`}],s={id:e,minutes:30,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};