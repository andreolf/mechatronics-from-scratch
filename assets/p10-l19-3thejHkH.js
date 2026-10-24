var e=`p10-l19`,t=35,n=`The first firmware everyone writes is a super-loop that calls every task in turn, and it works until one slow task stretches the loop and the control law no longer runs at its rate. You derive loop timing budgets and utilisation, see why the super-loop’s period is the sum of all task times, refactor it into rate groups on a 1 ms tick with offsets that spread the slow tasks across ticks, and test that every task runs at exactly its period with every tick inside its budget.`,r=`<h2 id="the-super-loop">The super-loop</h2>
<pre><code class="language-c">for (;;) { control(); filter(); comms(); logging(); ui(); }
</code></pre>
<p>Every task runs once per pass, so the loop period is the <strong>sum</strong> of the task times, and it changes whenever any task’s time changes. A 1 kHz control law needs a 1 ms period; with five tasks taking 2 ms in total it runs at 500 Hz at best, and with jitter whenever comms or logging take longer. Adding a <code>delay</code> at the end doesn’t help: it sets a minimum period, not a fixed one.</p>
<h2 id="rate-groups">Rate groups</h2>
<p>Give the firmware a <strong>base tick</strong> from a timer interrupt (lesson 08), say 1 ms, and count ticks. Each task runs in the tick where <code>tick % period == offset</code>:</p>
<ul>
<li><strong>1 kHz group</strong>: the control law, every tick;</li>
<li><strong>100 Hz group</strong>: the filter, every 10th tick;</li>
<li><strong>50 Hz</strong> comms, every 20th; <strong>10 Hz</strong> logging and UI, every 100th.</li>
</ul>
<p>Each task now runs at an exact multiple of the tick, independent of the others. The constraint moves to a per-tick <strong>budget</strong>: everything that runs in one tick must finish within the tick, or the next one starts late. That’s where <strong>offsets</strong> matter: if all the slow tasks fire on tick 0, that one tick is overloaded even though the average load is low. Giving each group a different offset spreads them out.</p>
<h2 id="utilisation-and-the-per-tick-budget">Utilisation and the per-tick budget</h2>
<p>For tasks with worst-case execution time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> and period <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, the CPU utilisation is</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.638em;vertical-align:-1.2777em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8723em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.2777em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3603em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.836em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8193em;vertical-align:-0.136em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> is necessary but not sufficient: you also need, for <strong>every tick</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span>,</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:2.4882em;vertical-align:-1.4382em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8479em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">i</span><span class="mspace mtight" style="margin-right:0.1952em;"></span><span class="mrel mtight">:</span><span class="mspace mtight" style="margin-right:0.1952em;"></span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mspace mtight" style="margin-right:0.3253em;"></span><span class="mbin mtight"><span class="mord mtight"><span class="mord mathrm mtight">mod</span></span></span><span class="mspace mtight" style="margin-right:0.3253em;"></span><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3281em;"><span style="top:-2.357em;margin-left:-0.1389em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.143em;"><span></span></span></span></span></span></span><span class="mrel mtight">=</span><span class="mord mtight"><span class="mord mathnormal mtight">ϕ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3281em;"><span style="top:-2.357em;margin-left:0em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.143em;"><span></span></span></span></span></span></span></span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.4382em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">tick</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span></span></span></span></span></div>
<p>and checking every tick over one <strong>hyperperiod</strong> (the least common multiple of the periods) covers all cases, since the pattern repeats. Leave margin: a 70–80 % worst-tick load leaves room for interrupts and for WCET estimates that were optimistic.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="rategroups" data-args="{}"></div></div><figcaption>Task bars per 1 ms tick over 20 ticks. Switch between the super-loop and rate groups, and toggle offsets: without them every slow task lands on tick 0 and overruns it.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<div class="table-scroll"><table>
<thead>
<tr>
<th>task</th>
<th>rate</th>
<th>WCET</th>
</tr>
</thead>
<tbody><tr>
<td>control</td>
<td>1 kHz</td>
<td>200 µs</td>
</tr>
<tr>
<td>filter</td>
<td>100 Hz</td>
<td>300 µs</td>
</tr>
<tr>
<td>comms</td>
<td>50 Hz</td>
<td>500 µs</td>
</tr>
<tr>
<td>logging</td>
<td>10 Hz</td>
<td>600 µs</td>
</tr>
<tr>
<td>UI</td>
<td>10 Hz</td>
<td>400 µs</td>
</tr>
</tbody></table></div>
<ol>
<li>Super-loop: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">200</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">300</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">500</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">600</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">400</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2000</span></span></span></span> µs, so control runs at 500 Hz. Fail.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.03</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.025</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.006</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.004</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.265</span></span></span></span>.</li>
<li>Rate groups with all offsets 0: tick 0 holds every task, 2000 µs in a 1000 µs tick. Overrun.</li>
<li>Offsets 0, 1, 2, 3, 4 for the five tasks: the worst tick is control + logging = 800 µs. Pass, with 20 % margin.</li>
<li>Hyperperiod: lcm(1, 10, 20, 100) = 100 ticks.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">rate_groups.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">const</span> <span class="hljs-type">char</span> *name; <span class="hljs-type">uint32_t</span> period_ticks, offset, wcet_us; <span class="hljs-type">uint32_t</span> runs; <span class="hljs-type">int64_t</span> last_us; <span class="hljs-type">int64_t</span> min_gap, max_gap; } <span class="hljs-type">task_t</span>;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NT 5</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> TICK_US 1000</span>
<span class="hljs-type">static</span> <span class="hljs-type">task_t</span> tasks[NT] = {
  {<span class="hljs-string">&quot;control&quot;</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">200</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>}, {<span class="hljs-string">&quot;filter&quot;</span>, <span class="hljs-number">10</span>, <span class="hljs-number">1</span>, <span class="hljs-number">300</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>}, {<span class="hljs-string">&quot;comms&quot;</span>, <span class="hljs-number">20</span>, <span class="hljs-number">2</span>, <span class="hljs-number">500</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>},
  {<span class="hljs-string">&quot;logging&quot;</span>, <span class="hljs-number">100</span>, <span class="hljs-number">3</span>, <span class="hljs-number">600</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>}, {<span class="hljs-string">&quot;ui&quot;</span>, <span class="hljs-number">100</span>, <span class="hljs-number">4</span>, <span class="hljs-number">400</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>},
};
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">reset_stats</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) { tasks[i].runs = <span class="hljs-number">0</span>; tasks[i].last_us = <span class="hljs-number">-1</span>; tasks[i].min_gap = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">30</span>; tasks[i].max_gap = <span class="hljs-number">0</span>; } }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">record</span><span class="hljs-params">(<span class="hljs-type">task_t</span> *t, <span class="hljs-type">int64_t</span> start_us)</span> {
  <span class="hljs-keyword">if</span> (t-&gt;last_us &gt;= <span class="hljs-number">0</span>) { <span class="hljs-type">int64_t</span> g = start_us - t-&gt;last_us; <span class="hljs-keyword">if</span> (g &lt; t-&gt;min_gap) t-&gt;min_gap = g; <span class="hljs-keyword">if</span> (g &gt; t-&gt;max_gap) t-&gt;max_gap = g; }
  t-&gt;last_us = start_us; t-&gt;runs++;
}

<span class="hljs-comment">/* the super-loop: run everything, back to back, for \`us\` microseconds */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">superloop</span><span class="hljs-params">(<span class="hljs-type">int64_t</span> us)</span> {
  <span class="hljs-type">int64_t</span> now = <span class="hljs-number">0</span>; reset_stats();
  <span class="hljs-keyword">while</span> (now &lt; us) <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) { record(&amp;tasks[i], now); now += tasks[i].wcet_us; }
}
<span class="hljs-comment">/* rate groups on a 1 ms tick; returns the number of overrun ticks and the worst tick load */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">rate_groups</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> ticks, <span class="hljs-type">int</span> use_offsets, <span class="hljs-type">uint32_t</span> *worst_us)</span> {
  <span class="hljs-type">int</span> overruns = <span class="hljs-number">0</span>; <span class="hljs-type">int64_t</span> busy_until = <span class="hljs-number">0</span>; *worst_us = <span class="hljs-number">0</span>; reset_stats();
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> k = <span class="hljs-number">0</span>; k &lt; ticks; k++) {
    <span class="hljs-type">int64_t</span> tick_start = (<span class="hljs-type">int64_t</span>)k * TICK_US, now = tick_start &gt; busy_until ? tick_start : busy_until;
    <span class="hljs-type">uint32_t</span> load = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) {
      <span class="hljs-type">uint32_t</span> off = use_offsets ? tasks[i].offset : <span class="hljs-number">0</span>;
      <span class="hljs-keyword">if</span> (k % tasks[i].period_ticks == off % tasks[i].period_ticks) { record(&amp;tasks[i], now); now += tasks[i].wcet_us; load += tasks[i].wcet_us; }
    }
    <span class="hljs-keyword">if</span> (load &gt; *worst_us) *worst_us = load;
    <span class="hljs-keyword">if</span> (now &gt; tick_start + TICK_US) overruns++;
    busy_until = now;
  }
  <span class="hljs-keyword">return</span> overruns;
}
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">gcd</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> a, <span class="hljs-type">uint32_t</span> b)</span> { <span class="hljs-keyword">while</span> (b) { <span class="hljs-type">uint32_t</span> t = a % b; a = b; b = t; } <span class="hljs-keyword">return</span> a; }
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">double</span> U = <span class="hljs-number">0</span>; <span class="hljs-type">uint32_t</span> H = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) { U += (<span class="hljs-type">double</span>)tasks[i].wcet_us / (tasks[i].period_ticks * TICK_US); H = H / gcd(H, tasks[i].period_ticks) * tasks[i].period_ticks; }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;utilisation %.3f, hyperperiod %u ticks\\n&quot;</span>, U, H);
  CHECK(U &gt; <span class="hljs-number">0.2649</span> &amp;&amp; U &lt; <span class="hljs-number">0.2651</span> &amp;&amp; H == <span class="hljs-number">100</span>);

  superloop(<span class="hljs-number">1000000</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;super-loop: control ran %u times in 1 s (gap %lld us)\\n&quot;</span>, tasks[<span class="hljs-number">0</span>].runs, (<span class="hljs-type">long</span> <span class="hljs-type">long</span>)tasks[<span class="hljs-number">0</span>].max_gap);
  CHECK(tasks[<span class="hljs-number">0</span>].max_gap == <span class="hljs-number">2000</span> &amp;&amp; tasks[<span class="hljs-number">0</span>].runs == <span class="hljs-number">500</span>);     <span class="hljs-comment">/* 500 Hz, not 1 kHz */</span>

  <span class="hljs-type">uint32_t</span> worst;
  <span class="hljs-type">int</span> bad = rate_groups(<span class="hljs-number">10</span> * H, <span class="hljs-number">0</span>, &amp;worst);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;rate groups, no offsets: worst tick %u us, %d overrun ticks\\n&quot;</span>, worst, bad);
  CHECK(worst == <span class="hljs-number">2000</span> &amp;&amp; bad &gt; <span class="hljs-number">0</span>);

  bad = rate_groups(<span class="hljs-number">10</span> * H, <span class="hljs-number">1</span>, &amp;worst);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;rate groups with offsets: worst tick %u us, %d overrun ticks\\n&quot;</span>, worst, bad);
  CHECK(worst == <span class="hljs-number">800</span> &amp;&amp; bad == <span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) {
    <span class="hljs-type">int64_t</span> want = (<span class="hljs-type">int64_t</span>)tasks[i].period_ticks * TICK_US;
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;  %-8s runs %4u, period %lld..%lld us (want %lld)\\n&quot;</span>, tasks[i].name, tasks[i].runs, (<span class="hljs-type">long</span> <span class="hljs-type">long</span>)tasks[i].min_gap, (<span class="hljs-type">long</span> <span class="hljs-type">long</span>)tasks[i].max_gap, (<span class="hljs-type">long</span> <span class="hljs-type">long</span>)want);
    CHECK(tasks[i].min_gap == want &amp;&amp; tasks[i].max_gap == want);   <span class="hljs-comment">/* every task meets its period exactly */</span>
    CHECK(tasks[i].runs == <span class="hljs-number">10</span> * H / tasks[i].period_ticks);
  }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Logging sometimes takes 3 ms when it flushes to an SD card. What happens in the rate-group design, and how do you fix it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>That tick overruns by about 2.2 ms, so the next two control ticks start late: jitter on the control law. Split the flush into chunks of at most a few hundred microseconds spread over several ticks, or move logging into the background (the idle time after each tick’s work) with a lower priority than the tick, so the control ISR can preempt it.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does checking one hyperperiod of ticks prove the schedule for all time?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Every task’s activation pattern repeats with its period, and the hyperperiod is a multiple of all of them, so the set of tasks due on tick <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> is the same as on tick <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span></span></span></span>. If no tick in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord">0</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner">…</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> overruns, none ever does (given the WCETs hold).</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l19"></div>

`,i=[{id:`the-super-loop`,title:`The super-loop`},{id:`rate-groups`,title:`Rate groups`},{id:`utilisation-and-the-per-tick-budget`,title:`Utilisation and the per-tick budget`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l19-q1`,type:`num`,q:`<p>Super-loop period in ms for tasks of 200, 300, 500, 600 and 400 µs?</p>
`,explain:`<p>The sum of all task times.</p>
`,answer:2,tol:.001,unit:`ms`},{id:`p10-l19-q2`,type:`num`,q:`<p>Utilisation of those tasks at 1 kHz, 100, 50, 10 and 10 Hz?</p>
`,explain:`<p>Σ C/T.</p>
`,answer:.265,tol:.001,unit:``},{id:`p10-l19-q3`,type:`num`,q:`<p>Hyperperiod in ticks for periods of 1, 10, 20 and 100 ticks?</p>
`,explain:`<p>Least common multiple.</p>
`,answer:100,tol:.001,unit:`ticks`},{id:`p10-l19-q4`,type:`num`,q:`<p>Worst tick load in µs with offsets 0..4 (control 200 µs plus the largest single slow task)?</p>
`,explain:`<p>Control plus logging.</p>
`,answer:800,tol:.001,unit:`µs`},{id:`p10-l19-q5`,type:`mc`,q:`<p>Utilisation is 0.27, yet one tick overruns. How?</p>
`,explain:`<p>Offsets spread the load.</p>
`,options:[`utilisation was computed wrong`,`several slow tasks are due in the same tick; the per-tick budget is violated even though the average is low`,`the timer is too slow`,`it cannot happen`],answer:1},{id:`p10-l19-q6`,type:`mc`,q:`<p>In a super-loop, what sets the control law’s period?</p>
`,explain:`<p>That’s its main weakness.</p>
`,options:[`the timer`,`the sum of all task execution times, which varies`,`the slowest task alone`,`the compiler`],answer:1}],o=[{file:`rate_groups.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *name; uint32_t period_ticks, offset, wcet_us; uint32_t runs; int64_t last_us; int64_t min_gap, max_gap; } task_t;
#define NT 5
#define TICK_US 1000
static task_t tasks[NT] = {
  {"control", 1, 0, 200, 0, 0, 0, 0}, {"filter", 10, 1, 300, 0, 0, 0, 0}, {"comms", 20, 2, 500, 0, 0, 0, 0},
  {"logging", 100, 3, 600, 0, 0, 0, 0}, {"ui", 100, 4, 400, 0, 0, 0, 0},
};
static void reset_stats(void) { for (int i = 0; i < NT; i++) { tasks[i].runs = 0; tasks[i].last_us = -1; tasks[i].min_gap = 1 << 30; tasks[i].max_gap = 0; } }
static void record(task_t *t, int64_t start_us) {
  if (t->last_us >= 0) { int64_t g = start_us - t->last_us; if (g < t->min_gap) t->min_gap = g; if (g > t->max_gap) t->max_gap = g; }
  t->last_us = start_us; t->runs++;
}

/* the super-loop: run everything, back to back, for \`us\` microseconds */
static void superloop(int64_t us) {
  int64_t now = 0; reset_stats();
  while (now < us) for (int i = 0; i < NT; i++) { record(&tasks[i], now); now += tasks[i].wcet_us; }
}
/* rate groups on a 1 ms tick; returns the number of overrun ticks and the worst tick load */
static int rate_groups(uint32_t ticks, int use_offsets, uint32_t *worst_us) {
  int overruns = 0; int64_t busy_until = 0; *worst_us = 0; reset_stats();
  for (uint32_t k = 0; k < ticks; k++) {
    int64_t tick_start = (int64_t)k * TICK_US, now = tick_start > busy_until ? tick_start : busy_until;
    uint32_t load = 0;
    for (int i = 0; i < NT; i++) {
      uint32_t off = use_offsets ? tasks[i].offset : 0;
      if (k % tasks[i].period_ticks == off % tasks[i].period_ticks) { record(&tasks[i], now); now += tasks[i].wcet_us; load += tasks[i].wcet_us; }
    }
    if (load > *worst_us) *worst_us = load;
    if (now > tick_start + TICK_US) overruns++;
    busy_until = now;
  }
  return overruns;
}
static uint32_t gcd(uint32_t a, uint32_t b) { while (b) { uint32_t t = a % b; a = b; b = t; } return a; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  double U = 0; uint32_t H = 1;
  for (int i = 0; i < NT; i++) { U += (double)tasks[i].wcet_us / (tasks[i].period_ticks * TICK_US); H = H / gcd(H, tasks[i].period_ticks) * tasks[i].period_ticks; }
  printf("utilisation %.3f, hyperperiod %u ticks\\n", U, H);
  CHECK(U > 0.2649 && U < 0.2651 && H == 100);

  superloop(1000000);
  printf("super-loop: control ran %u times in 1 s (gap %lld us)\\n", tasks[0].runs, (long long)tasks[0].max_gap);
  CHECK(tasks[0].max_gap == 2000 && tasks[0].runs == 500);     /* 500 Hz, not 1 kHz */

  uint32_t worst;
  int bad = rate_groups(10 * H, 0, &worst);
  printf("rate groups, no offsets: worst tick %u us, %d overrun ticks\\n", worst, bad);
  CHECK(worst == 2000 && bad > 0);

  bad = rate_groups(10 * H, 1, &worst);
  printf("rate groups with offsets: worst tick %u us, %d overrun ticks\\n", worst, bad);
  CHECK(worst == 800 && bad == 0);
  for (int i = 0; i < NT; i++) {
    int64_t want = (int64_t)tasks[i].period_ticks * TICK_US;
    printf("  %-8s runs %4u, period %lld..%lld us (want %lld)\\n", tasks[i].name, tasks[i].runs, (long long)tasks[i].min_gap, (long long)tasks[i].max_gap, (long long)want);
    CHECK(tasks[i].min_gap == want && tasks[i].max_gap == want);   /* every task meets its period exactly */
    CHECK(tasks[i].runs == 10 * H / tasks[i].period_ticks);
  }
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};