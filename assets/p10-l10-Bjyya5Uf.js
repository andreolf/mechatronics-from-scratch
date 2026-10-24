var e=`p10-l10`,t=40,n=`An interrupt can land between any two instructions of the main loop, so any shared variable that takes more than one access to read or update can be torn. You derive the two classic hazards, a torn multi-word read and a lost read-modify-write, reproduce both deterministically by firing a modelled interrupt at every possible instruction boundary, fix them with a re-read loop, a critical section and an atomic operation, and stress-test the fixes over millions of placements.`,r=`<h2 id="where-an-interrupt-can-land">Where an interrupt can land</h2>
<p>The main loop and an ISR share memory, and the ISR can run between <em>any</em> two instructions of <code>main</code>. A C statement is usually several instructions. On a 32-bit Cortex-M:</p>
<ul>
<li>a single aligned 8-, 16- or 32-bit load or store is <strong>atomic</strong>: the ISR sees the old value or the new one, never a mix;</li>
<li>anything bigger or compound is <strong>not</strong>: a 64-bit variable takes two loads, and <code>x++</code> or <code>flags |= bit</code> is a load, a modify and a store.</li>
</ul>
<p>That gives two hazards, and both are bugs that pass every bench test and then fail once a week in the field, because the window is a few nanoseconds wide.</p>
<h2 id="hazard-1-a-torn-read">Hazard 1: a torn read</h2>
<p>A 64-bit millisecond counter <code>ticks</code> is stored as two words <code>lo</code> and <code>hi</code>; the 1 kHz ISR does <code>if (++lo == 0) ++hi;</code>. Main reads <code>lo</code> then <code>hi</code>. If the counter is at <code>hi:lo</code> = 5:0xFFFFFFFF and the ISR runs <strong>between the two loads</strong>, main gets lo = 0xFFFFFFFF (old) and hi = 6 (new): a time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span></span></span></span> ms in the future, about 50 days. The fix needs no interrupt masking: read <code>hi</code>, then <code>lo</code>, then <code>hi</code> again, and retry if <code>hi</code> changed:</p>
<pre><code class="language-c">do { h1 = hi; l = lo; h2 = hi; } while (h1 != h2);
</code></pre>
<p>If an ISR changed <code>hi</code> during the read, the two copies differ and we go round again. If they agree, <code>l</code> was read while <code>hi</code> held that value.</p>
<h2 id="hazard-2-a-lost-update">Hazard 2: a lost update</h2>
<p>Main does <code>flags |= MAIN_BIT</code> and the ISR does <code>flags |= ISR_BIT</code>. Main’s statement is <code>ldr; orr; str</code>. If the ISR runs after main’s load, main stores its stale copy plus its own bit and <strong>erases the ISR’s bit</strong>. Three fixes:</p>
<ol>
<li>a <strong>critical section</strong>: disable interrupts around the RMW (<code>__disable_irq(); flags |= b; __enable_irq();</code>, or save and restore PRIMASK if you might already be inside one). Short and simple, but it adds latency (lesson 09);</li>
<li>an <strong>atomic RMW</strong> with exclusive access: Cortex-M3 and up have LDREX/STREX, which the compiler emits for C11 atomics or GCC’s <code>__atomic_fetch_or</code>. The store fails and retries if an exception happened in between;</li>
<li>a design without sharing: give each writer its own variable, or hardware that does the modify for you (BSRR, lesson 05).</li>
</ol>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="racetime" data-args="{}"></div></div><figcaption>Main’s instructions on a timeline with the ISR firing between two of them. Slide the interrupt point: when it lands inside the read window or the RMW window, the result is wrong. Switch on the fix to see the retry or the masked window.</figcaption></figure>
<h2 id="testing-a-race-deterministically">Testing a race deterministically</h2>
<p>Random timing tests miss races. A model finds them: write the main-side code as steps, with a hook between every pair of accesses, and fire the ISR at <strong>every</strong> hook in turn. If the result is wrong for any placement, the code is broken; if it’s right for all, and the ISR can’t run twice inside the window, the code is correct for one interrupt. Then run a random stress test that fires the ISR at random hooks, sometimes several times in a row, over millions of operations.</p>
<h2 id="worked-example">Worked example</h2>
<p>Counter at 5:0xFFFFFFFF, ISR due.</p>
<ol>
<li>Naive read, ISR before both loads: 6:0x00000000, correct.</li>
<li>ISR between the loads: lo = 0xFFFFFFFF, hi = 6, reads 6:0xFFFFFFFF, wrong by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span></span></span></span>.</li>
<li>ISR after both loads: 5:0xFFFFFFFF, correct (just old).</li>
<li>Re-read loop, ISR after the first <code>hi</code>: h1 = 5, l = 0, h2 = 6, retry, then 6:0 correct.</li>
<li>How rare? The window is two loads, about 4 cycles at 168 MHz = 24 ns. Main reads 1000 times a second, so it spends a fraction <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1000</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">24</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">ns</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2.4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">5</span></span></span></span></span></span></span></span></span></span></span></span> of its time inside the window. For the 64-bit counter the dangerous ISR (the one that wraps <code>lo</code>) comes once per 49.7 days, so this device fails about once per 5700 years. The <em>same code</em> reading a 16-bit timer count plus a software overflow counter, which wraps every 65.5 ms, fails <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">15.3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2.4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">5</span></span></span></span></span></span></span></span></span></span></span></span> times a second: about once every 45 minutes. Rare is not never.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">race_model.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>

<span class="hljs-comment">/* ---- shared state and the ISR ---- */</span>
<span class="hljs-type">static</span> <span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> lo, hi, flags;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> MAIN_BIT 0x1u</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> ISR_BIT  0x2u</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">tick_isr</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">if</span> (++lo == <span class="hljs-number">0</span>) ++hi; flags |= ISR_BIT; }

<span class="hljs-comment">/* ---- the interrupt model: an ISR may run at any hook between two accesses of main ---- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> fire_at = <span class="hljs-number">-1</span>, hook_no, irq_masked, pending, isr_runs, random_mode;
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> rng = <span class="hljs-number">2463534242u</span>;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">request</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">if</span> (irq_masked) pending = <span class="hljs-number">1</span>; <span class="hljs-keyword">else</span> { tick_isr(); isr_runs++; } }   <span class="hljs-comment">/* masked: stays pending */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">hook</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">if</span> (random_mode) { <span class="hljs-keyword">while</span> ((rng ^= rng &lt;&lt; <span class="hljs-number">13</span>, rng ^= rng &gt;&gt; <span class="hljs-number">17</span>, rng ^= rng &lt;&lt; <span class="hljs-number">5</span>) % <span class="hljs-number">7</span> == <span class="hljs-number">0</span>) request(); }
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (hook_no == fire_at) request();
  hook_no++;
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">irq_disable</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { irq_masked = <span class="hljs-number">1</span>; }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">irq_enable</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {                           <span class="hljs-comment">/* a pending ISR runs as soon as it&#x27;s unmasked */</span>
  irq_masked = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">if</span> (pending) { pending = <span class="hljs-number">0</span>; tick_isr(); isr_runs++; }
  hook();
}

<span class="hljs-comment">/* ---- main-side code, written as individual accesses ---- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint64_t</span> <span class="hljs-title function_">read_naive</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  hook(); <span class="hljs-type">uint32_t</span> l = lo; hook(); <span class="hljs-type">uint32_t</span> h = hi; hook();
  <span class="hljs-keyword">return</span> ((<span class="hljs-type">uint64_t</span>)h &lt;&lt; <span class="hljs-number">32</span>) | l;
}
<span class="hljs-type">static</span> <span class="hljs-type">uint64_t</span> <span class="hljs-title function_">read_fixed</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">uint32_t</span> h1, l, h2;
  <span class="hljs-keyword">do</span> { hook(); h1 = hi; hook(); l = lo; hook(); h2 = hi; hook(); } <span class="hljs-keyword">while</span> (h1 != h2);
  <span class="hljs-keyword">return</span> ((<span class="hljs-type">uint64_t</span>)h1 &lt;&lt; <span class="hljs-number">32</span>) | l;
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">set_naive</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { hook(); <span class="hljs-type">uint32_t</span> v = flags; hook(); v |= MAIN_BIT; hook(); flags = v; hook(); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">set_critical</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { irq_disable(); hook(); <span class="hljs-type">uint32_t</span> v = flags; hook(); flags = v | MAIN_BIT; hook(); irq_enable(); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">set_atomic</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { hook(); __atomic_fetch_or(&amp;flags, MAIN_BIT, __ATOMIC_SEQ_CST); hook(); }  <span class="hljs-comment">/* LDREX/STREX on M3 */</span>

<span class="hljs-type">static</span> <span class="hljs-type">uint64_t</span> <span class="hljs-title function_">now</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> ((<span class="hljs-type">uint64_t</span>)hi &lt;&lt; <span class="hljs-number">32</span>) | lo; }
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-comment">/* run fn once with the ISR at hook k; report whether the result is consistent */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">read_ok</span><span class="hljs-params">(<span class="hljs-type">uint64_t</span> (*fn)(<span class="hljs-type">void</span>), <span class="hljs-type">int</span> k)</span> {
  lo = <span class="hljs-number">0xFFFFFFFFu</span>; hi = <span class="hljs-number">5</span>; fire_at = k; hook_no = <span class="hljs-number">0</span>;
  <span class="hljs-type">uint64_t</span> before = now(), v = fn(), after = now();
  <span class="hljs-keyword">return</span> v &gt;= before &amp;&amp; v &lt;= after;                   <span class="hljs-comment">/* a correct read is some value the counter really held */</span>
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">set_ok</span><span class="hljs-params">(<span class="hljs-type">void</span> (*fn)(<span class="hljs-type">void</span>), <span class="hljs-type">int</span> k)</span> {
  flags = <span class="hljs-number">0</span>; fire_at = k; hook_no = <span class="hljs-number">0</span>; isr_runs = <span class="hljs-number">0</span>; fn();
  <span class="hljs-keyword">return</span> (flags &amp; MAIN_BIT) &amp;&amp; (isr_runs == <span class="hljs-number">0</span> || (flags &amp; ISR_BIT));   <span class="hljs-comment">/* an ISR ran but its bit is gone = lost update */</span>
}

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">int</span> torn = <span class="hljs-number">0</span>, lost = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">8</span>; k++) torn += !read_ok(read_naive, k);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">8</span>; k++) CHECK(read_ok(read_fixed, k));
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">8</span>; k++) lost += !set_ok(set_naive, k);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">8</span>; k++) { CHECK(set_ok(set_critical, k)); CHECK(set_ok(set_atomic, k)); }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;exhaustive: naive read torn at %d placement(s), naive RMW lost the ISR bit at %d placement(s); fixes clean\\n&quot;</span>, torn, lost);
  CHECK(torn == <span class="hljs-number">1</span> &amp;&amp; lost == <span class="hljs-number">2</span>);

  <span class="hljs-comment">/* random stress: ISRs at random hooks, sometimes several in a row; time must never jump or go backwards */</span>
  random_mode = <span class="hljs-number">1</span>; lo = <span class="hljs-number">0xFFFFFF00u</span>; hi = <span class="hljs-number">0</span>;
  <span class="hljs-type">uint64_t</span> prev = <span class="hljs-number">0</span>; <span class="hljs-type">long</span> bad_naive = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">long</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">3000000</span>; i++) {
    <span class="hljs-keyword">if</span> ((i &amp; <span class="hljs-number">0xFFFF</span>) == <span class="hljs-number">0</span>) { lo = <span class="hljs-number">0xFFFFFF00u</span>; hi++; prev = now(); }   <span class="hljs-comment">/* jump ahead to just before another wrap */</span>
    <span class="hljs-type">uint64_t</span> v = read_fixed(); CHECK(v &gt;= prev &amp;&amp; v - prev &lt; <span class="hljs-number">64</span>); prev = v;
    <span class="hljs-keyword">if</span> (i % <span class="hljs-number">3</span> == <span class="hljs-number">0</span>) { <span class="hljs-type">uint64_t</span> a = now(), w = read_naive(); <span class="hljs-keyword">if</span> (w &gt; now() || w &lt; a) bad_naive++; }
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-type">long</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">1000000</span>; i++) {
    flags = <span class="hljs-number">0</span>; set_critical(); CHECK(flags &amp; MAIN_BIT); flags = <span class="hljs-number">0</span>; set_atomic(); CHECK(flags &amp; MAIN_BIT);
    flags = <span class="hljs-number">0</span>; tick_isr(); set_critical(); CHECK(flags == (MAIN_BIT | ISR_BIT));
  }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;random stress: 3,000,000 fixed reads monotonic; naive reads gave %ld torn values\\nPASS\\n&quot;</span>, bad_naive);
  CHECK(bad_naive &gt; <span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Is <code>volatile uint32_t count; ... count++;</code> in main safe if the ISR only <em>reads</em> <code>count</code>?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Yes. Only main writes it, and the single 32-bit store is atomic, so the ISR sees the old or the new value. The hazard needs two writers (lost update) or a multi-access read of something the other side writes (torn read).</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Your critical section is <code>__disable_irq(); ...; __enable_irq();</code> and it’s called from inside another critical section. What goes wrong, and what’s the fix?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The inner <code>__enable_irq()</code> re-enables interrupts while the outer section still expects them off. Save and restore PRIMASK instead: <code>uint32_t m = __get_PRIMASK(); __disable_irq(); ...; __set_PRIMASK(m);</code>.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l10"></div>

`,i=[{id:`where-an-interrupt-can-land`,title:`Where an interrupt can land`},{id:`hazard-1-a-torn-read`,title:`Hazard 1: a torn read`},{id:`hazard-2-a-lost-update`,title:`Hazard 2: a lost update`},{id:`testing-a-race-deterministically`,title:`Testing a race deterministically`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l10-q1`,type:`num`,q:`<p>How many days until a 32-bit millisecond counter wraps?</p>
`,explain:`<p>4 294 967 296 ms.</p>
`,answer:49.71,tol:.001,unit:`days`},{id:`p10-l10-q2`,type:`num`,q:`<p>A torn read of hi:lo at the wrap is wrong by how many ms?</p>
`,explain:`<p>The new hi with the old lo.</p>
`,answer:4294967296,tol:1e-6,unit:`ms`},{id:`p10-l10-q3`,type:`num`,q:`<p>A 4-cycle window at 168 MHz lasts how many ns?</p>
`,explain:`<p>Cycles over the clock.</p>
`,answer:23.81,tol:.001,unit:`ns`},{id:`p10-l10-q4`,type:`num`,q:`<p>flags |= bit compiles to load, or, store. How many hook positions (between accesses) let an ISR’s update be lost?</p>
`,explain:`<p>After the load and before the store, in either of the two gaps.</p>
`,answer:2,tol:.001,unit:``},{id:`p10-l10-q5`,type:`mc`,q:`<p>Which of these is atomic on a Cortex-M3?</p>
`,explain:`<p>Single aligned word accesses are atomic; compound statements are not.</p>
`,options:[`count++ on a uint32_t`,`an aligned 32-bit load`,`flags |= 4`,`a 64-bit load`],answer:1},{id:`p10-l10-q6`,type:`mc`,q:`<p>The hi-lo-hi re-read loop works because…</p>
`,explain:`<p>A lock-free consistency check.</p>
`,options:[`it uses LDREX`,`volatile makes it atomic`,`if hi did not change across the read, lo was read while hi held that value`,`it disables interrupts`],answer:2}],o=[{file:`race_model.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* ---- shared state and the ISR ---- */
static volatile uint32_t lo, hi, flags;
#define MAIN_BIT 0x1u
#define ISR_BIT  0x2u
static void tick_isr(void) { if (++lo == 0) ++hi; flags |= ISR_BIT; }

/* ---- the interrupt model: an ISR may run at any hook between two accesses of main ---- */
static int fire_at = -1, hook_no, irq_masked, pending, isr_runs, random_mode;
static uint32_t rng = 2463534242u;
static void request(void) { if (irq_masked) pending = 1; else { tick_isr(); isr_runs++; } }   /* masked: stays pending */
static void hook(void) {
  if (random_mode) { while ((rng ^= rng << 13, rng ^= rng >> 17, rng ^= rng << 5) % 7 == 0) request(); }
  else if (hook_no == fire_at) request();
  hook_no++;
}
static void irq_disable(void) { irq_masked = 1; }
static void irq_enable(void) {                           /* a pending ISR runs as soon as it's unmasked */
  irq_masked = 0;
  if (pending) { pending = 0; tick_isr(); isr_runs++; }
  hook();
}

/* ---- main-side code, written as individual accesses ---- */
static uint64_t read_naive(void) {
  hook(); uint32_t l = lo; hook(); uint32_t h = hi; hook();
  return ((uint64_t)h << 32) | l;
}
static uint64_t read_fixed(void) {
  uint32_t h1, l, h2;
  do { hook(); h1 = hi; hook(); l = lo; hook(); h2 = hi; hook(); } while (h1 != h2);
  return ((uint64_t)h1 << 32) | l;
}
static void set_naive(void) { hook(); uint32_t v = flags; hook(); v |= MAIN_BIT; hook(); flags = v; hook(); }
static void set_critical(void) { irq_disable(); hook(); uint32_t v = flags; hook(); flags = v | MAIN_BIT; hook(); irq_enable(); }
static void set_atomic(void) { hook(); __atomic_fetch_or(&flags, MAIN_BIT, __ATOMIC_SEQ_CST); hook(); }  /* LDREX/STREX on M3 */

static uint64_t now(void) { return ((uint64_t)hi << 32) | lo; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

/* run fn once with the ISR at hook k; report whether the result is consistent */
static int read_ok(uint64_t (*fn)(void), int k) {
  lo = 0xFFFFFFFFu; hi = 5; fire_at = k; hook_no = 0;
  uint64_t before = now(), v = fn(), after = now();
  return v >= before && v <= after;                   /* a correct read is some value the counter really held */
}
static int set_ok(void (*fn)(void), int k) {
  flags = 0; fire_at = k; hook_no = 0; isr_runs = 0; fn();
  return (flags & MAIN_BIT) && (isr_runs == 0 || (flags & ISR_BIT));   /* an ISR ran but its bit is gone = lost update */
}

int main(void) {
  int torn = 0, lost = 0;
  for (int k = 0; k < 8; k++) torn += !read_ok(read_naive, k);
  for (int k = 0; k < 8; k++) CHECK(read_ok(read_fixed, k));
  for (int k = 0; k < 8; k++) lost += !set_ok(set_naive, k);
  for (int k = 0; k < 8; k++) { CHECK(set_ok(set_critical, k)); CHECK(set_ok(set_atomic, k)); }
  printf("exhaustive: naive read torn at %d placement(s), naive RMW lost the ISR bit at %d placement(s); fixes clean\\n", torn, lost);
  CHECK(torn == 1 && lost == 2);

  /* random stress: ISRs at random hooks, sometimes several in a row; time must never jump or go backwards */
  random_mode = 1; lo = 0xFFFFFF00u; hi = 0;
  uint64_t prev = 0; long bad_naive = 0;
  for (long i = 0; i < 3000000; i++) {
    if ((i & 0xFFFF) == 0) { lo = 0xFFFFFF00u; hi++; prev = now(); }   /* jump ahead to just before another wrap */
    uint64_t v = read_fixed(); CHECK(v >= prev && v - prev < 64); prev = v;
    if (i % 3 == 0) { uint64_t a = now(), w = read_naive(); if (w > now() || w < a) bad_naive++; }
  }
  for (long i = 0; i < 1000000; i++) {
    flags = 0; set_critical(); CHECK(flags & MAIN_BIT); flags = 0; set_atomic(); CHECK(flags & MAIN_BIT);
    flags = 0; tick_isr(); set_critical(); CHECK(flags == (MAIN_BIT | ISR_BIT));
  }
  printf("random stress: 3,000,000 fixed reads monotonic; naive reads gave %ld torn values\\nPASS\\n", bad_naive);
  CHECK(bad_naive > 0);
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};