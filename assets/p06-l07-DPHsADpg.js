var e=`p06-l07`,t=40,n=`Feedback gives logic memory. You derive the SR latch from two cross-coupled NOR gates, build a gated D latch and a master-slave D flip-flop, simulate them, and prove that a flip-flop’s output changes only on rising clock edges while a latch is transparent.`,r=`<h2 id="the-sr-latch">The SR latch</h2>
<p>Connect two NOR gates so each one’s output feeds the other’s input:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0701em;vertical-align:-0.25em;"></span><span class="mord katex-accent"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">Q</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1667em;"><span class="mord">ˉ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1944em;"><span></span></span></span></span></span><span class="mclose"><span class="mclose">)</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8019em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord katex-accent"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">Q</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1667em;"><span class="mord">ˉ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1944em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0519em;vertical-align:-0.25em;"></span><span class="mord mathnormal">Q</span><span class="mclose"><span class="mclose">)</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8019em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<ul>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> forces <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0145em;vertical-align:-0.1944em;"></span><span class="mord katex-accent"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">Q</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1667em;"><span class="mord">ˉ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1944em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> and then <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>: <strong>set</strong>.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> forces <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>: <strong>reset</strong>.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>: each gate holds the other, so the latch <strong>remembers</strong> its last state. That’s one bit of memory from two gates.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> forces both outputs to 0, and releasing both at once leaves the result to a race between the gates. That input is forbidden.</li>
</ul>
<h2 id="d-latch-and-d-flip-flop">D latch and D flip-flop</h2>
<p>A <strong>gated D latch</strong> adds steering logic so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span>. While the enable <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span> is high, Q follows D (the latch is <strong>transparent</strong>). When E falls, Q holds. No forbidden input is possible.</p>
<p>A <strong>D flip-flop</strong> is two D latches in series: the <strong>master</strong> is enabled when the clock is low and the <strong>slave</strong> when it’s high. While CLK is low the master tracks D but the slave holds. At the rising edge the master freezes and the slave copies it. So Q takes the value D had <em>at the rising edge</em>, and nothing D does at other times reaches Q. Every register, counter and state machine (lesson 8) is built on this edge-triggered behaviour.</p>
<p>Two timing rules come with it (lesson 11): D must be stable for a <strong>setup time</strong> before the edge and a <strong>hold time</strong> after it.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="dff" data-args="{}"></div></div><figcaption>Clock, data, a D latch’s output and a D flip-flop’s output. The latch follows D whenever the clock is high; the flip-flop changes only at rising edges (dotted).</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Trace a master-slave flip-flop. CLK rises at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8389em;vertical-align:-0.1944em;"></span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">5</span></span></span></span>; D goes 0 → 1 at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.5</span></span></span></span> and back to 0 at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.5</span></span></span></span>.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6542em;vertical-align:-0.0391em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> (CLK low, from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>): the master is transparent and holds D = 0. The slave is closed and holds Q = 0.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> (rising edge): the master closes on 0, and the slave opens and copies 0. Q = 0.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.5</span></span></span></span>: D = 1, but the master is closed (CLK high). Nothing changes.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span> (CLK falls): the master opens and sees D = 1; the slave closes. Q stays 0.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.5</span></span></span></span>: D = 0 again. The master follows, so it holds 0.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3</span></span></span></span> (rising edge): the slave copies 0. <strong>The 1 pulse never reached Q</strong>, because it didn’t span a rising edge. A transparent latch on CLK would have passed it through between <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.5</span></span></span></span> and 2.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">flipflops.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">def</span> <span class="hljs-title function_">sr_latch</span>(<span class="hljs-params">S, R, q=<span class="hljs-number">0</span>, qb=<span class="hljs-number">1</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;Iterate the cross-coupled NOR pair until it settles (or report a race).&quot;&quot;&quot;</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">10</span>):
        nq, nqb = <span class="hljs-built_in">int</span>(<span class="hljs-keyword">not</span> (R <span class="hljs-keyword">or</span> qb)), <span class="hljs-built_in">int</span>(<span class="hljs-keyword">not</span> (S <span class="hljs-keyword">or</span> q))
        <span class="hljs-keyword">if</span> (nq, nqb) == (q, qb):
            <span class="hljs-keyword">return</span> q, qb
        q, qb = nq, nqb
    <span class="hljs-keyword">raise</span> RuntimeError(<span class="hljs-string">&quot;oscillates&quot;</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">DLatch</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.qb = <span class="hljs-number">0</span>, <span class="hljs-number">1</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">self, d, en</span>):
        <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.qb = sr_latch(d <span class="hljs-keyword">and</span> en, (<span class="hljs-keyword">not</span> d) <span class="hljs-keyword">and</span> en, <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.qb)
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.q

<span class="hljs-keyword">class</span> <span class="hljs-title class_">DFF</span>:
    <span class="hljs-string">&quot;&quot;&quot;Master-slave: master transparent when clk = 0, slave when clk = 1.&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.m, <span class="hljs-variable language_">self</span>.s = DLatch(), DLatch()
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">self, d, clk</span>):
        mq = <span class="hljs-variable language_">self</span>.m.step(d, <span class="hljs-keyword">not</span> clk)
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.s.step(mq, clk)

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    <span class="hljs-keyword">assert</span> sr_latch(<span class="hljs-number">1</span>, <span class="hljs-number">0</span>) == (<span class="hljs-number">1</span>, <span class="hljs-number">0</span>) <span class="hljs-keyword">and</span> sr_latch(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>) == (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>)
    <span class="hljs-keyword">assert</span> sr_latch(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>) == (<span class="hljs-number">1</span>, <span class="hljs-number">0</span>) <span class="hljs-keyword">and</span> sr_latch(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>) == (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>)     <span class="hljs-comment"># memory</span>
    <span class="hljs-keyword">assert</span> sr_latch(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>) == (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>)                                              <span class="hljs-comment"># the forbidden state</span>
    <span class="hljs-keyword">import</span> random
    random.seed(<span class="hljs-number">7</span>)
    ff, lat = DFF(), DLatch()
    t_steps = <span class="hljs-number">4000</span>
    clk_prev, q_prev, d_prev, d_at_edge = <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-literal">None</span>
    <span class="hljs-keyword">for</span> t <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(t_steps):
        clk = (t // <span class="hljs-number">20</span>) % <span class="hljs-number">2</span>                                  <span class="hljs-comment"># 20 sub-steps per half period</span>
        d = <span class="hljs-built_in">int</span>(random.random() &lt; <span class="hljs-number">0.5</span>) <span class="hljs-keyword">if</span> t % <span class="hljs-number">7</span> == <span class="hljs-number">0</span> <span class="hljs-keyword">else</span> d_prev
        q = ff.step(d, clk)
        rising = clk == <span class="hljs-number">1</span> <span class="hljs-keyword">and</span> clk_prev == <span class="hljs-number">0</span>
        <span class="hljs-keyword">if</span> rising:
            d_at_edge = d_prev                               <span class="hljs-comment"># the value D held just before the edge</span>
        <span class="hljs-keyword">if</span> q != q_prev:
            <span class="hljs-keyword">assert</span> rising, <span class="hljs-string">f&quot;flip-flop output changed off an edge at t=<span class="hljs-subst">{t}</span>&quot;</span>
        <span class="hljs-keyword">if</span> d_at_edge <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>:
            <span class="hljs-keyword">assert</span> q == d_at_edge                           <span class="hljs-comment"># holds the value captured at the edge</span>
        ql = lat.step(d, clk)
        <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> clk <span class="hljs-keyword">or</span> ql == d                           <span class="hljs-comment"># the latch is transparent while enabled</span>
        clk_prev, q_prev, d_prev = clk, q, d
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;DFF output changes only on rising edges; the latch is transparent while enabled&quot;</span>)</code></pre></div>
<p>The same flip-flop as a Verilog behavioural model, checked by Icarus:</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">dff_tb.v</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-verilog"><span class="hljs-meta">\`<span class="hljs-keyword">timescale</span> 1ns/1ps</span>
<span class="hljs-keyword">module</span> dff(<span class="hljs-keyword">input</span> clk, d, <span class="hljs-keyword">output</span> <span class="hljs-keyword">reg</span> q);
  <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk) q &lt;= d;
<span class="hljs-keyword">endmodule</span>

<span class="hljs-keyword">module</span> tb;
  <span class="hljs-keyword">reg</span> clk = <span class="hljs-number">0</span>, d = <span class="hljs-number">0</span>; <span class="hljs-keyword">wire</span> q; <span class="hljs-keyword">integer</span> errors = <span class="hljs-number">0</span>; <span class="hljs-keyword">reg</span> expected = <span class="hljs-number">0</span>;
  dff u(<span class="hljs-variable">.clk</span>(clk), <span class="hljs-variable">.d</span>(d), <span class="hljs-variable">.q</span>(q));
  <span class="hljs-keyword">always</span> #<span class="hljs-number">5</span> clk = ~clk;                       <span class="hljs-comment">// 10 ns period</span>
  <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk) expected &lt;= d;
  <span class="hljs-keyword">initial</span> <span class="hljs-keyword">begin</span>
    #<span class="hljs-number">12</span> d = <span class="hljs-number">1</span>; #<span class="hljs-number">3</span> d = <span class="hljs-number">0</span>;                      <span class="hljs-comment">// a short pulse between edges: must not appear on q</span>
    #<span class="hljs-number">20</span> d = <span class="hljs-number">1</span>; #<span class="hljs-number">40</span> d = <span class="hljs-number">0</span>; #<span class="hljs-number">30</span>;
    <span class="hljs-built_in">$finish</span>;
  <span class="hljs-keyword">end</span>
  <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">negedge</span> clk) <span class="hljs-keyword">if</span> (q !== expected) <span class="hljs-keyword">begin</span> errors = errors + <span class="hljs-number">1</span>; <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL at %0t&quot;</span>, <span class="hljs-built_in">$time</span>); <span class="hljs-keyword">end</span>
  <span class="hljs-keyword">final</span> <span class="hljs-keyword">if</span> (errors == <span class="hljs-number">0</span>) <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;PASS: q only changes on rising edges&quot;</span>);
<span class="hljs-keyword">endmodule</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why can’t a D latch reach the SR latch’s forbidden state?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span> can’t both be 1, because D and D′ are never both 1.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A design uses a D latch instead of a flip-flop in a counter. What goes wrong?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>While the enable is high the latch is transparent, so the incremented value feeds straight back and increments again, racing through many counts in one half-period. Edge triggering breaks that loop.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l07"></div>

`,i=[{id:`the-sr-latch`,title:`The SR latch`},{id:`d-latch-and-d-flip-flop`,title:`D latch and D flip-flop`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l07-q1`,type:`mc`,q:`<p>With S = R = 0, an SR latch…</p>
`,explain:`<p>The cross-coupled feedback remembers.</p>
`,options:[`sets`,`holds its previous state`,`oscillates`,`resets`],answer:1},{id:`p06-l07-q2`,type:`mc`,q:`<p>A D latch with enable high is…</p>
`,explain:`<p>It’s level-sensitive.</p>
`,options:[`edge-triggered`,`[object Object]`,`in the forbidden state`,`frozen`],answer:1},{id:`p06-l07-q3`,type:`mc`,q:`<p>A master-slave D flip-flop captures D…</p>
`,explain:`<p>The master closes and the slave copies.</p>
`,options:[`at the rising clock edge`,`continuously`,`while the clock is low`,`at the falling edge only if D is 1`],answer:0},{id:`p06-l07-q4`,type:`num`,q:`<p>How many gates in a NOR-based SR latch?</p>
`,explain:`<p>Two cross-coupled NORs.</p>
`,answer:2,tol:.001,unit:``},{id:`p06-l07-q5`,type:`num`,q:`<p>In the worked example, Q after the edge at t = 3?</p>
`,explain:`<p>The pulse didn’t span an edge.</p>
`,answer:0,tol:.001,unit:``},{id:`p06-l07-q6`,type:`mc`,q:`<p>Setup time is…</p>
`,explain:`<p>Hold time is the stability required after the edge.</p>
`,options:[`how long after the edge Q changes`,`how long D must be stable before the clock edge`,`the gate delay of the slave`,`the clock period`],answer:1}],o=[{file:`flipflops.py`,lang:`python`,src:`def sr_latch(S, R, q=0, qb=1):
    """Iterate the cross-coupled NOR pair until it settles (or report a race)."""
    for _ in range(10):
        nq, nqb = int(not (R or qb)), int(not (S or q))
        if (nq, nqb) == (q, qb):
            return q, qb
        q, qb = nq, nqb
    raise RuntimeError("oscillates")

class DLatch:
    def __init__(self):
        self.q, self.qb = 0, 1
    def step(self, d, en):
        self.q, self.qb = sr_latch(d and en, (not d) and en, self.q, self.qb)
        return self.q

class DFF:
    """Master-slave: master transparent when clk = 0, slave when clk = 1."""
    def __init__(self):
        self.m, self.s = DLatch(), DLatch()
    def step(self, d, clk):
        mq = self.m.step(d, not clk)
        return self.s.step(mq, clk)

if __name__ == "__main__":
    assert sr_latch(1, 0) == (1, 0) and sr_latch(0, 1, 1, 0) == (0, 1)
    assert sr_latch(0, 0, 1, 0) == (1, 0) and sr_latch(0, 0, 0, 1) == (0, 1)     # memory
    assert sr_latch(1, 1) == (0, 0)                                              # the forbidden state
    import random
    random.seed(7)
    ff, lat = DFF(), DLatch()
    t_steps = 4000
    clk_prev, q_prev, d_prev, d_at_edge = 0, 0, 0, None
    for t in range(t_steps):
        clk = (t // 20) % 2                                  # 20 sub-steps per half period
        d = int(random.random() < 0.5) if t % 7 == 0 else d_prev
        q = ff.step(d, clk)
        rising = clk == 1 and clk_prev == 0
        if rising:
            d_at_edge = d_prev                               # the value D held just before the edge
        if q != q_prev:
            assert rising, f"flip-flop output changed off an edge at t={t}"
        if d_at_edge is not None:
            assert q == d_at_edge                           # holds the value captured at the edge
        ql = lat.step(d, clk)
        assert not clk or ql == d                           # the latch is transparent while enabled
        clk_prev, q_prev, d_prev = clk, q, d
    print("DFF output changes only on rising edges; the latch is transparent while enabled")`},{file:`dff_tb.v`,lang:`verilog`,src:`\`timescale 1ns/1ps
module dff(input clk, d, output reg q);
  always @(posedge clk) q <= d;
endmodule

module tb;
  reg clk = 0, d = 0; wire q; integer errors = 0; reg expected = 0;
  dff u(.clk(clk), .d(d), .q(q));
  always #5 clk = ~clk;                       // 10 ns period
  always @(posedge clk) expected <= d;
  initial begin
    #12 d = 1; #3 d = 0;                      // a short pulse between edges: must not appear on q
    #20 d = 1; #40 d = 0; #30;
    $finish;
  end
  always @(negedge clk) if (q !== expected) begin errors = errors + 1; $display("FAIL at %0t", $time); end
  final if (errors == 0) $display("PASS: q only changes on rising edges");
endmodule`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};