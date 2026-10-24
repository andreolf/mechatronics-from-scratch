var e=`p10-l20`,t=40,n=`A time-triggered cooperative scheduler runs every task from a fixed table on a periodic tick, never preempts, and so is predictable enough to analyse completely before it ships. You derive the static schedule over the hyperperiod and the check that makes it valid, implement a table-driven dispatcher with per-task budgets and overrun detection, and test that an injected slow task is detected, logged with its tick and task id, and handled without breaking the other tasks’ periods.`,r=`<h2 id="time-triggered-cooperative">Time-triggered, cooperative</h2>
<p>In a <strong>time-triggered</strong> (TT) design, nothing happens because an event arrived; everything happens because the clock says it’s time. Inputs are polled at known instants, tasks run at known instants, outputs are written at known instants. <strong>Cooperative</strong> means tasks are never preempted: each runs to completion and returns, so there’s no shared-data race between tasks (lesson 10), only with interrupts. The price is that every task must be short, and a task that runs too long delays everything after it. So the scheduler’s most important job besides dispatching is <strong>detecting overruns</strong>.</p>
<p>This style, popularised for small embedded systems by Michael Pont’s work on time-triggered patterns, is common in safety-related firmware because its timing can be verified offline.</p>
<h2 id="the-static-table">The static table</h2>
<p>Each task has a period <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> and an offset <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">ϕ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> in ticks, and a worst-case execution time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. Over the hyperperiod <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">lcm</span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span> the scheduler’s behaviour is a fixed table: in tick <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> run tasks <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">{</span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">:</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">ϕ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord"><span class="mord mathrm">mod</span></span></span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0</span><span class="mclose">}</span></span></span></span>, in table order. Before shipping, check every tick:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:2.3521em;vertical-align:-1.3021em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8479em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">i</span><span class="mord text mtight"><span class="mord mtight">\xA0due\xA0in\xA0</span></span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.3021em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">dispatcher</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">tick</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:1em;"></span><span class="mord text"><span class="mord">for\xA0</span></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner">…</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.</span></span></span></span></span></div>
<h2 id="overrun-detection">Overrun detection</h2>
<p>Two complementary checks:</p>
<ol>
<li><strong>Tick overrun</strong>: the tick ISR increments a counter; the dispatcher handles one tick at a time. If the ISR finds the previous tick’s work still unfinished (the dispatcher hasn’t caught up), the tick overran. Log it.</li>
<li><strong>Task budget</strong>: the dispatcher timestamps each task (with a free-running timer, lesson 08) and compares its duration with its budget <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. This names the culprit.</li>
</ol>
<p>Then a <strong>policy</strong>: log and continue (skip the missed ticks so the schedule realigns with the clock), switch to a degraded mode, or stop and let the watchdog (lesson 15) reset. Never silently “catch up” by running the missed ticks back to back: that bunches the control law’s samples.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="ttgantt" data-args="{}"></div></div><figcaption>Gantt chart of a static schedule over 20 ticks. Make one task overrun at a chosen tick: the overrun is flagged red, the following tick is skipped, and the log lists the tick and task.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Tick 1 ms; tasks A (period 1, offset 0, 250 µs), B (5, 1, 400 µs), C (10, 2, 500 µs), D (20, 3, 300 µs), dispatcher 20 µs.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">lcm</span></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">5</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">10</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">20</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20</span></span></span></span> ticks.</li>
<li>Worst tick: tick 2 or 12 (A + C) = 750 + 20 = 770 µs, or tick 11 (A + B) = 670 µs. All under 1000 µs.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.25</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.08</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.05</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.015</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.395</span></span></span></span>, plus 2 % for the dispatcher.</li>
<li>If C takes 900 µs at tick 12, that tick needs up to 20 + 250 + 900 = 1170 µs. The budget check logs (tick 12, task C, 400 µs over), and when tick 13’s interrupt arrives the dispatcher is still busy, so tick 13 is logged as a tick overrun and skipped. Tick 14 starts on time. (In the simulation A takes 240 µs, so the tick overrun is 160 µs.)</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">tt_scheduler.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>

<span class="hljs-meta">#<span class="hljs-keyword">define</span> TICK_US 1000</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DISPATCH_US 20</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">char</span> name; <span class="hljs-type">uint32_t</span> period, offset, budget_us; <span class="hljs-type">uint32_t</span> runs; <span class="hljs-type">int64_t</span> last_start; } <span class="hljs-type">task_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">task_t</span> tasks[] = { {<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">250</span>, <span class="hljs-number">0</span>, <span class="hljs-number">-1</span>}, {<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>, <span class="hljs-number">400</span>, <span class="hljs-number">0</span>, <span class="hljs-number">-1</span>}, {<span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-number">10</span>, <span class="hljs-number">2</span>, <span class="hljs-number">500</span>, <span class="hljs-number">0</span>, <span class="hljs-number">-1</span>}, {<span class="hljs-string">&#x27;D&#x27;</span>, <span class="hljs-number">20</span>, <span class="hljs-number">3</span>, <span class="hljs-number">300</span>, <span class="hljs-number">0</span>, <span class="hljs-number">-1</span>} };
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NT (int)(sizeof tasks / sizeof tasks[0])</span>

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">uint32_t</span> tick; <span class="hljs-type">char</span> task; <span class="hljs-type">int32_t</span> over_us; } <span class="hljs-type">log_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">log_t</span> logbuf[<span class="hljs-number">32</span>]; <span class="hljs-type">static</span> <span class="hljs-type">int</span> n_log;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">log_overrun</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> tick, <span class="hljs-type">char</span> task, <span class="hljs-type">int32_t</span> over)</span> { <span class="hljs-keyword">if</span> (n_log &lt; <span class="hljs-number">32</span>) logbuf[n_log++] = (<span class="hljs-type">log_t</span>){tick, task, over}; }

<span class="hljs-comment">/* simulated execution time of a task; one fault injected for the test */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> inject_tick = <span class="hljs-number">0xFFFFFFFFu</span>; <span class="hljs-type">static</span> <span class="hljs-type">char</span> inject_task; <span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> inject_us;
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">exec_time</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">task_t</span> *t, <span class="hljs-type">uint32_t</span> tick)</span> { <span class="hljs-keyword">return</span> (tick == inject_tick &amp;&amp; t-&gt;name == inject_task) ? inject_us : t-&gt;budget_us - <span class="hljs-number">10</span>; }

<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">gcd</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> a, <span class="hljs-type">uint32_t</span> b)</span> { <span class="hljs-keyword">while</span> (b) { <span class="hljs-type">uint32_t</span> r = a % b; a = b; b = r; } <span class="hljs-keyword">return</span> a; }
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">due</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">task_t</span> *t, <span class="hljs-type">uint32_t</span> k)</span> { <span class="hljs-keyword">return</span> k &gt;= t-&gt;offset &amp;&amp; (k - t-&gt;offset) % t-&gt;period == <span class="hljs-number">0</span>; }

<span class="hljs-comment">/* offline check of the static table: every tick of the hyperperiod fits its budget */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">check_table</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> *hyper)</span> {
  <span class="hljs-type">uint32_t</span> H = <span class="hljs-number">1</span>, worst = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) H = H / gcd(H, tasks[i].period) * tasks[i].period;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> k = H; k &lt; <span class="hljs-number">2</span> * H; k++) {          <span class="hljs-comment">/* a full hyperperiod after every offset has started */</span>
    <span class="hljs-type">uint32_t</span> load = DISPATCH_US;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) <span class="hljs-keyword">if</span> (due(&amp;tasks[i], k)) load += tasks[i].budget_us;
    <span class="hljs-keyword">if</span> (load &gt; worst) worst = load;
  }
  *hyper = H; <span class="hljs-keyword">return</span> worst;
}

<span class="hljs-comment">/* the dispatcher, driven by a simulated tick; returns the number of skipped ticks */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">run</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> ticks)</span> {
  <span class="hljs-type">int64_t</span> now = <span class="hljs-number">0</span>; <span class="hljs-type">uint32_t</span> skipped = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> k = <span class="hljs-number">0</span>; k &lt; ticks; k++) {
    <span class="hljs-type">int64_t</span> tick_start = (<span class="hljs-type">int64_t</span>)k * TICK_US;
    <span class="hljs-keyword">if</span> (now &gt; tick_start) {                           <span class="hljs-comment">/* tick ISR fired while the dispatcher was still busy */</span>
      log_overrun(k, <span class="hljs-string">&#x27;-&#x27;</span>, (<span class="hljs-type">int32_t</span>)(now - tick_start));
      skipped++; <span class="hljs-keyword">continue</span>;                            <span class="hljs-comment">/* policy: skip this tick, realign with the clock */</span>
    }
    now = tick_start + DISPATCH_US;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) {
      <span class="hljs-keyword">if</span> (!due(&amp;tasks[i], k)) <span class="hljs-keyword">continue</span>;
      <span class="hljs-type">task_t</span> *t = &amp;tasks[i]; <span class="hljs-type">uint32_t</span> dt = exec_time(t, k);
      t-&gt;last_start = now; t-&gt;runs++; now += dt;
      <span class="hljs-keyword">if</span> (dt &gt; t-&gt;budget_us) log_overrun(k, t-&gt;name, (<span class="hljs-type">int32_t</span>)(dt - t-&gt;budget_us));   <span class="hljs-comment">/* task budget check */</span>
    }
  }
  <span class="hljs-keyword">return</span> skipped;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">uint32_t</span> H, worst = check_table(&amp;H);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;hyperperiod %u ticks, worst tick load %u us of %u\\n&quot;</span>, H, worst, TICK_US);
  CHECK(H == <span class="hljs-number">20</span> &amp;&amp; worst == <span class="hljs-number">770</span> &amp;&amp; worst &lt;= TICK_US);

  <span class="hljs-type">uint32_t</span> skipped = run(<span class="hljs-number">10</span> * H);                     <span class="hljs-comment">/* clean run */</span>
  CHECK(skipped == <span class="hljs-number">0</span> &amp;&amp; n_log == <span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) CHECK(tasks[i].runs == (<span class="hljs-number">10</span> * H - tasks[i].offset + tasks[i].period - <span class="hljs-number">1</span>) / tasks[i].period);

  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) tasks[i].runs = <span class="hljs-number">0</span>;
  inject_tick = <span class="hljs-number">12</span>; inject_task = <span class="hljs-string">&#x27;C&#x27;</span>; inject_us = <span class="hljs-number">900</span>;   <span class="hljs-comment">/* C runs 400 us over budget at tick 12 */</span>
  skipped = run(<span class="hljs-number">10</span> * H);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; n_log; i++) <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;log: tick %u task %c over by %d us\\n&quot;</span>, logbuf[i].tick, logbuf[i].task, logbuf[i].over_us);
  CHECK(n_log == <span class="hljs-number">2</span>);
  CHECK(logbuf[<span class="hljs-number">0</span>].tick == <span class="hljs-number">12</span> &amp;&amp; logbuf[<span class="hljs-number">0</span>].task == <span class="hljs-string">&#x27;C&#x27;</span> &amp;&amp; logbuf[<span class="hljs-number">0</span>].over_us == <span class="hljs-number">400</span>);   <span class="hljs-comment">/* culprit named */</span>
  CHECK(logbuf[<span class="hljs-number">1</span>].tick == <span class="hljs-number">13</span> &amp;&amp; logbuf[<span class="hljs-number">1</span>].task == <span class="hljs-string">&#x27;-&#x27;</span> &amp;&amp; logbuf[<span class="hljs-number">1</span>].over_us == <span class="hljs-number">160</span>);   <span class="hljs-comment">/* the tick overrun (A ran 240 us) */</span>
  CHECK(skipped == <span class="hljs-number">1</span>);
  CHECK(tasks[<span class="hljs-number">0</span>].runs == <span class="hljs-number">10</span> * H - <span class="hljs-number">1</span>);                 <span class="hljs-comment">/* A missed exactly one tick, then realigned */</span>
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A new task E needs to run every 3 ms. What does that do to the hyperperiod, and why might you change its period instead?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">lcm</span></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">5</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">10</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">20</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">60</span></span></span></span> ticks, three times the table to check, and E’s activations drift relative to the others so more combinations of tasks share ticks. If 2.5 ms or 4 ms is acceptable, pick a period that divides the existing hyperperiod (for example 2, 4 or 5 ms) to keep the schedule compact.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the scheduler skip a late tick instead of running it immediately to catch up?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Running the missed tick late, back to back with the next, makes the control task sample twice in quick succession and then not again for a while, which looks like a sample-time jump to the controller and can upset its dynamics. Skipping keeps the remaining samples on the clock grid, and the log records the miss.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l20"></div>

`,i=[{id:`time-triggered-cooperative`,title:`Time-triggered, cooperative`},{id:`the-static-table`,title:`The static table`},{id:`overrun-detection`,title:`Overrun detection`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l20-q1`,type:`num`,q:`<p>Hyperperiod in ticks of tasks with periods 1, 5, 10 and 20 ticks?</p>
`,explain:`<p>Least common multiple.</p>
`,answer:20,tol:.001,unit:`ticks`},{id:`p10-l20-q2`,type:`num`,q:`<p>Worst tick load in µs (A 250 + C 500 + dispatcher 20)?</p>
`,explain:`<p>Ticks where A and C coincide.</p>
`,answer:770,tol:.001,unit:`µs`},{id:`p10-l20-q3`,type:`num`,q:`<p>Utilisation of A, B, C and D (without the dispatcher)?</p>
`,explain:`<p>Σ C/T.</p>
`,answer:.395,tol:.001,unit:``},{id:`p10-l20-q4`,type:`num`,q:`<p>If C takes 900 µs in tick 12, by how many µs is tick 13 late?</p>
`,explain:`<p>Dispatcher + A + C minus the tick.</p>
`,answer:170,tol:.001,unit:`µs`},{id:`p10-l20-q5`,type:`mc`,q:`<p>What does ‘cooperative’ mean in this scheduler?</p>
`,explain:`<p>Run to completion, so no task-to-task races.</p>
`,options:[`tasks are never preempted; each runs to completion`,`tasks cooperate through queues`,`tasks share a stack`,`interrupts are disabled`],answer:0},{id:`p10-l20-q6`,type:`mc`,q:`<p>Which check names the task that caused an overrun?</p>
`,explain:`<p>The tick check only says that something was late.</p>
`,options:[`the hyperperiod check`,`the watchdog`,`the per-task budget check with a timestamp`,`the tick overrun check`],answer:2}],o=[{file:`tt_scheduler.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define TICK_US 1000
#define DISPATCH_US 20
typedef struct { char name; uint32_t period, offset, budget_us; uint32_t runs; int64_t last_start; } task_t;
static task_t tasks[] = { {'A', 1, 0, 250, 0, -1}, {'B', 5, 1, 400, 0, -1}, {'C', 10, 2, 500, 0, -1}, {'D', 20, 3, 300, 0, -1} };
#define NT (int)(sizeof tasks / sizeof tasks[0])

typedef struct { uint32_t tick; char task; int32_t over_us; } log_t;
static log_t logbuf[32]; static int n_log;
static void log_overrun(uint32_t tick, char task, int32_t over) { if (n_log < 32) logbuf[n_log++] = (log_t){tick, task, over}; }

/* simulated execution time of a task; one fault injected for the test */
static uint32_t inject_tick = 0xFFFFFFFFu; static char inject_task; static uint32_t inject_us;
static uint32_t exec_time(const task_t *t, uint32_t tick) { return (tick == inject_tick && t->name == inject_task) ? inject_us : t->budget_us - 10; }

static uint32_t gcd(uint32_t a, uint32_t b) { while (b) { uint32_t r = a % b; a = b; b = r; } return a; }
static int due(const task_t *t, uint32_t k) { return k >= t->offset && (k - t->offset) % t->period == 0; }

/* offline check of the static table: every tick of the hyperperiod fits its budget */
static uint32_t check_table(uint32_t *hyper) {
  uint32_t H = 1, worst = 0;
  for (int i = 0; i < NT; i++) H = H / gcd(H, tasks[i].period) * tasks[i].period;
  for (uint32_t k = H; k < 2 * H; k++) {          /* a full hyperperiod after every offset has started */
    uint32_t load = DISPATCH_US;
    for (int i = 0; i < NT; i++) if (due(&tasks[i], k)) load += tasks[i].budget_us;
    if (load > worst) worst = load;
  }
  *hyper = H; return worst;
}

/* the dispatcher, driven by a simulated tick; returns the number of skipped ticks */
static uint32_t run(uint32_t ticks) {
  int64_t now = 0; uint32_t skipped = 0;
  for (uint32_t k = 0; k < ticks; k++) {
    int64_t tick_start = (int64_t)k * TICK_US;
    if (now > tick_start) {                           /* tick ISR fired while the dispatcher was still busy */
      log_overrun(k, '-', (int32_t)(now - tick_start));
      skipped++; continue;                            /* policy: skip this tick, realign with the clock */
    }
    now = tick_start + DISPATCH_US;
    for (int i = 0; i < NT; i++) {
      if (!due(&tasks[i], k)) continue;
      task_t *t = &tasks[i]; uint32_t dt = exec_time(t, k);
      t->last_start = now; t->runs++; now += dt;
      if (dt > t->budget_us) log_overrun(k, t->name, (int32_t)(dt - t->budget_us));   /* task budget check */
    }
  }
  return skipped;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  uint32_t H, worst = check_table(&H);
  printf("hyperperiod %u ticks, worst tick load %u us of %u\\n", H, worst, TICK_US);
  CHECK(H == 20 && worst == 770 && worst <= TICK_US);

  uint32_t skipped = run(10 * H);                     /* clean run */
  CHECK(skipped == 0 && n_log == 0);
  for (int i = 0; i < NT; i++) CHECK(tasks[i].runs == (10 * H - tasks[i].offset + tasks[i].period - 1) / tasks[i].period);

  for (int i = 0; i < NT; i++) tasks[i].runs = 0;
  inject_tick = 12; inject_task = 'C'; inject_us = 900;   /* C runs 400 us over budget at tick 12 */
  skipped = run(10 * H);
  for (int i = 0; i < n_log; i++) printf("log: tick %u task %c over by %d us\\n", logbuf[i].tick, logbuf[i].task, logbuf[i].over_us);
  CHECK(n_log == 2);
  CHECK(logbuf[0].tick == 12 && logbuf[0].task == 'C' && logbuf[0].over_us == 400);   /* culprit named */
  CHECK(logbuf[1].tick == 13 && logbuf[1].task == '-' && logbuf[1].over_us == 160);   /* the tick overrun (A ran 240 us) */
  CHECK(skipped == 1);
  CHECK(tasks[0].runs == 10 * H - 1);                 /* A missed exactly one tick, then realigned */
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};