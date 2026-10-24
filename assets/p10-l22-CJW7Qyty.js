var e=`p10-l22`,t=40,n=`Most firmware bugs are logic bugs, and logic can be tested on a laptop in milliseconds if the code doesn’t talk to registers directly. You derive a hardware abstraction layer with an interface the application calls and fakes the tests control, write a tiny Unity-style test framework, and test a debounced button and LED controller against fake GPIO and a fake clock, producing a CI-ready report and exit code.`,r=`<h2 id="why-test-on-the-host">Why test on the host</h2>
<p>Flashing a board, pressing a button and watching an LED is a slow test that only covers what you thought of trying. Most of the code in a firmware project is <strong>logic</strong>: state machines, protocol parsers, filters, schedulers. None of it needs the hardware, <em>if</em> it doesn’t touch registers directly. Then it compiles with the host’s gcc and runs thousands of cases in milliseconds, on every commit, in CI.</p>
<p>The tool most embedded teams use for this is <strong>Unity</strong> (a small C test framework from ThrowTheSwitch), often with CMock to generate fakes. The ideas fit in a page, so here we build a minimal version ourselves.</p>
<h2 id="the-seam-a-hardware-abstraction-layer">The seam: a hardware abstraction layer</h2>
<p>Put an interface between the logic and the registers:</p>
<pre><code class="language-c">typedef struct {
  int  (*read_button)(void);            /* 1 = pressed */
  void (*write_led)(int on);
  uint32_t (*millis)(void);
} hal_t;
</code></pre>
<p>The application module takes a <code>const hal_t *</code> and calls only through it. On the board, the functions read <code>GPIOC-&gt;IDR</code>, write <code>GPIOA-&gt;BSRR</code> and return a SysTick counter (lessons 05 and 09). In the tests, a <strong>fake</strong> implements the same interface with plain variables the test controls: it can make the button bounce, jump the clock forward, and record every LED write.</p>
<p>Three kinds of test double, from simplest:</p>
<ul>
<li>a <strong>stub</strong> returns canned values;</li>
<li>a <strong>fake</strong> has working, simplified behaviour (a clock you advance by hand);</li>
<li>a <strong>mock</strong> also checks that it was called the right way (CMock generates these).</li>
</ul>
<h2 id="what-to-test">What to test</h2>
<p>The module under test toggles an LED on each debounced press of a button, and blinks when the button is held for 2 s:</p>
<ul>
<li>a press that stays stable for 20 ms toggles the LED, once;</li>
<li><strong>bounce</strong> (transitions faster than 20 ms) is ignored;</li>
<li>holding for 2 s enters blink mode at 2 Hz; releasing leaves it;</li>
<li><code>millis()</code> wrapping at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span></span></span></span> ms doesn’t break timing, because elapsed time is computed as <code>now - start</code> in unsigned arithmetic (lesson 18’s trick).</li>
</ul>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="testreport" data-args="{}"></div></div><figcaption>The test report from running the suite. Introduce a bug in the module (a debounce off by one, or signed time arithmetic) and see which tests catch it.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Debounce 20 ms, fake clock in 1 ms steps.</p>
<ol>
<li>Button goes down at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> = 100 ms and bounces until 104 ms, then stays down. The last raw change is at 104, so the press is accepted at 124 ms: one toggle.</li>
<li>A 10 ms glitch is shorter than 20 ms: no toggle.</li>
<li>Start the clock at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span></span></span></span> ms. A press accepted 20 ms later has <code>now - start</code> = 20 even though <code>now</code> &lt; <code>start</code>: correct with <code>uint32_t</code>, broken with <code>int64_t</code> casts of the two values.</li>
<li>Hold from 1000 ms: blink mode at 3020 ms (2 s after the press was accepted at 1020 ms); the LED then toggles every 250 ms.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p>Everything is in one file so it runs as is; in a project, <code>minitest.h</code>, <code>button_led.c/.h</code>, <code>hal_fake.c</code> and <code>test_button_led.c</code> would be separate, with only <code>test_*.c</code> and the fake left out of the firmware build.</p>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">test_button_led.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>

<span class="hljs-comment">/* ---------------- minitest.h: a tiny Unity-style framework ---------------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> mt_tests, mt_failures, mt_current_failed;
<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">char</span> *mt_name;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> TEST_ASSERT_TRUE(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;%s:%d:%s:FAIL: %s\\n&quot;</span>, __FILE__, __LINE__, mt_name, #c); mt_current_failed = 1; return; } } while (0)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> TEST_ASSERT_EQUAL_INT(e, a) do { long _e = (long)(e), _a = (long)(a); <span class="hljs-keyword">if</span> (_e != _a) { \\
    printf(<span class="hljs-string">&quot;%s:%d:%s:FAIL: expected %ld was %ld\\n&quot;</span>, __FILE__, __LINE__, mt_name, _e, _a); mt_current_failed = 1; return; } } while (0)</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">setUp</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span>;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> RUN_TEST(fn) do { mt_name = #fn; mt_current_failed = 0; setUp(); fn(); mt_tests++; \\
    <span class="hljs-keyword">if</span> (mt_current_failed) mt_failures++; <span class="hljs-keyword">else</span> printf(<span class="hljs-string">&quot;%s:PASS\\n&quot;</span>, #fn); } while (0)</span>

<span class="hljs-comment">/* ---------------- hal.h ---------------- */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">int</span> (*read_button)(<span class="hljs-type">void</span>); <span class="hljs-type">void</span> (*write_led)(<span class="hljs-type">int</span> on); <span class="hljs-type">uint32_t</span> (*millis)(<span class="hljs-type">void</span>); } <span class="hljs-type">hal_t</span>;

<span class="hljs-comment">/* ---------------- button_led.c: the module under test ---------------- */</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DEBOUNCE_MS 20u</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> HOLD_MS 2000u</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> BLINK_HALF_MS 250u</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">const</span> <span class="hljs-type">hal_t</span> *hal; <span class="hljs-type">int</span> raw, stable, led, blinking; <span class="hljs-type">uint32_t</span> t_change, t_press, t_blink; } <span class="hljs-type">button_led_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">bl_init</span><span class="hljs-params">(<span class="hljs-type">button_led_t</span> *b, <span class="hljs-type">const</span> <span class="hljs-type">hal_t</span> *hal)</span> {
  <span class="hljs-built_in">memset</span>(b, <span class="hljs-number">0</span>, <span class="hljs-keyword">sizeof</span> *b); b-&gt;hal = hal; b-&gt;t_change = hal-&gt;millis(); hal-&gt;write_led(<span class="hljs-number">0</span>);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">bl_poll</span><span class="hljs-params">(<span class="hljs-type">button_led_t</span> *b)</span> {                    <span class="hljs-comment">/* call every millisecond or so */</span>
  <span class="hljs-type">uint32_t</span> now = b-&gt;hal-&gt;millis(); <span class="hljs-type">int</span> raw = b-&gt;hal-&gt;read_button();
  <span class="hljs-keyword">if</span> (raw != b-&gt;raw) { b-&gt;raw = raw; b-&gt;t_change = now; }
  <span class="hljs-keyword">if</span> (raw != b-&gt;stable &amp;&amp; (<span class="hljs-type">uint32_t</span>)(now - b-&gt;t_change) &gt;= DEBOUNCE_MS) {   <span class="hljs-comment">/* unsigned: wrap-safe */</span>
    b-&gt;stable = raw;
    <span class="hljs-keyword">if</span> (raw) { b-&gt;led = !b-&gt;led; b-&gt;hal-&gt;write_led(b-&gt;led); b-&gt;t_press = now; }
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (b-&gt;blinking) { b-&gt;blinking = <span class="hljs-number">0</span>; b-&gt;led = <span class="hljs-number">0</span>; b-&gt;hal-&gt;write_led(<span class="hljs-number">0</span>); }
  }
  <span class="hljs-keyword">if</span> (b-&gt;stable &amp;&amp; !b-&gt;blinking &amp;&amp; (<span class="hljs-type">uint32_t</span>)(now - b-&gt;t_press) &gt;= HOLD_MS) { b-&gt;blinking = <span class="hljs-number">1</span>; b-&gt;t_blink = now; }
  <span class="hljs-keyword">if</span> (b-&gt;blinking &amp;&amp; (<span class="hljs-type">uint32_t</span>)(now - b-&gt;t_blink) &gt;= BLINK_HALF_MS) { b-&gt;t_blink += BLINK_HALF_MS; b-&gt;led = !b-&gt;led; b-&gt;hal-&gt;write_led(b-&gt;led); }
}

<span class="hljs-comment">/* ---------------- hal_fake.c ---------------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> fake_button; <span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> fake_now; <span class="hljs-type">static</span> <span class="hljs-type">int</span> fake_led, fake_led_writes;
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">fake_read_button</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> fake_button; }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">fake_write_led</span><span class="hljs-params">(<span class="hljs-type">int</span> on)</span> { fake_led = on; fake_led_writes++; }
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">fake_millis</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> fake_now; }
<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">hal_t</span> fake_hal = {fake_read_button, fake_write_led, fake_millis};
<span class="hljs-type">static</span> <span class="hljs-type">button_led_t</span> bl;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">run_ms</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> ms)</span> { <span class="hljs-keyword">while</span> (ms--) { fake_now++; bl_poll(&amp;bl); } }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">set_button</span><span class="hljs-params">(<span class="hljs-type">int</span> v)</span> { fake_button = v; bl_poll(&amp;bl); }   <span class="hljs-comment">/* the edge is seen at the current ms */</span>

<span class="hljs-comment">/* ---------------- test_button_led.c ---------------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">setUp</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { fake_button = <span class="hljs-number">0</span>; fake_now = <span class="hljs-number">1000</span>; fake_led = <span class="hljs-number">-1</span>; fake_led_writes = <span class="hljs-number">0</span>; bl_init(&amp;bl, &amp;fake_hal); }

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_led_starts_off</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_clean_press_toggles_once</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">19</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led);       <span class="hljs-comment">/* not yet stable */</span>
  run_ms(<span class="hljs-number">1</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, fake_led);                       <span class="hljs-comment">/* accepted at 20 ms */</span>
  run_ms(<span class="hljs-number">500</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, fake_led); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">2</span>, fake_led_writes);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_bounce_is_ignored</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">5</span>; i++) { set_button(!fake_button); run_ms(<span class="hljs-number">1</span>); }    <span class="hljs-comment">/* 5 ms of chatter, ends pressed */</span>
  run_ms(<span class="hljs-number">18</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led);
  run_ms(<span class="hljs-number">1</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, fake_led);                           <span class="hljs-comment">/* 20 ms after the last edge */</span>
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_short_glitch_does_nothing</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">10</span>); set_button(<span class="hljs-number">0</span>); run_ms(<span class="hljs-number">100</span>);
  TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, fake_led_writes);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_two_presses_toggle_back</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">50</span>); set_button(<span class="hljs-number">0</span>); run_ms(<span class="hljs-number">50</span>); set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">50</span>);
  TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_hold_enters_blink_at_2hz</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">20</span> + HOLD_MS - <span class="hljs-number">1</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, bl.blinking);
  run_ms(<span class="hljs-number">1</span>); TEST_ASSERT_TRUE(bl.blinking);
  <span class="hljs-type">int</span> writes = fake_led_writes; run_ms(<span class="hljs-number">1000</span>); TEST_ASSERT_EQUAL_INT(writes + <span class="hljs-number">4</span>, fake_led_writes);   <span class="hljs-comment">/* 4 toggles per s */</span>
  set_button(<span class="hljs-number">0</span>); run_ms(<span class="hljs-number">20</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, bl.blinking); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">test_millis_wraparound</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  fake_now = <span class="hljs-number">0xFFFFFFFFu</span> - <span class="hljs-number">10</span>; bl_init(&amp;bl, &amp;fake_hal);
  set_button(<span class="hljs-number">1</span>); run_ms(<span class="hljs-number">19</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">0</span>, fake_led);
  run_ms(<span class="hljs-number">1</span>); TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, fake_led); TEST_ASSERT_TRUE(fake_now &lt; <span class="hljs-number">100</span>);   <span class="hljs-comment">/* clock wrapped */</span>
}
<span class="hljs-comment">/* a meta-test: the framework itself must report a failing assertion */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">failing_on_purpose</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { TEST_ASSERT_EQUAL_INT(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>); }

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  RUN_TEST(test_led_starts_off);
  RUN_TEST(test_clean_press_toggles_once);
  RUN_TEST(test_bounce_is_ignored);
  RUN_TEST(test_short_glitch_does_nothing);
  RUN_TEST(test_two_presses_toggle_back);
  RUN_TEST(test_hold_enters_blink_at_2hz);
  RUN_TEST(test_millis_wraparound);
  <span class="hljs-type">int</span> real_tests = mt_tests, real_failures = mt_failures;
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;-----------------------\\n%d Tests %d Failures 0 Ignored\\n%s\\n&quot;</span>, real_tests, real_failures, real_failures ? <span class="hljs-string">&quot;FAIL&quot;</span> : <span class="hljs-string">&quot;OK&quot;</span>);
  RUN_TEST(failing_on_purpose);                           <span class="hljs-comment">/* expected to print one FAIL line */</span>
  <span class="hljs-keyword">if</span> (mt_failures != real_failures + <span class="hljs-number">1</span>) { <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;framework did not catch a failure\\n&quot;</span>); <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>; }
  <span class="hljs-keyword">if</span> (real_failures) <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;                             <span class="hljs-comment">/* non-zero exit fails the CI job */</span>
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your colleague changes <code>(uint32_t)(now - b-&gt;t_change) &gt;= DEBOUNCE_MS</code> to <code>now &gt;= b-&gt;t_change + DEBOUNCE_MS</code>. Which test fails, and why?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><code>test_millis_wraparound</code>. Near the wrap, <code>t_change + 20</code> overflows to a small number, so <code>now &gt;= ...</code> is true immediately and the press is accepted after 0 ms instead of 20 (or, depending on values, never). The subtraction form computes elapsed time modulo <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span></span></span></span>, which is always right for intervals under 49 days.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>How would you run these tests in CI, and what makes the job fail?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Build them with the host compiler (<code>gcc -std=c99 -Wall -Werror test_button_led.c -o tests &amp;&amp; ./tests</code>) in any CI runner. The process exit code is the contract: 0 passes the job, anything else fails it. That’s why <code>main</code> returns 1 if any real test failed, and why the framework is checked against a test that’s meant to fail.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l22"></div>

`,i=[{id:`why-test-on-the-host`,title:`Why test on the host`},{id:`the-seam-a-hardware-abstraction-layer`,title:`The seam: a hardware abstraction layer`},{id:`what-to-test`,title:`What to test`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l22-q1`,type:`num`,q:`<p>With a 20 ms debounce, the last bounce at 104 ms, when is the press accepted, in ms?</p>
`,explain:`<p>20 ms after the last raw change.</p>
`,answer:124,tol:.001,unit:`ms`},{id:`p10-l22-q2`,type:`num`,q:`<p>Elapsed ms computed as uint32 (now − start) with start = 2^32 − 10 and now = 10?</p>
`,explain:`<p>Unsigned subtraction wraps correctly.</p>
`,answer:20,tol:.001,unit:`ms`},{id:`p10-l22-q3`,type:`num`,q:`<p>LED writes per second in blink mode with a 250 ms half-period?</p>
`,explain:`<p>Toggle every 250 ms is a 2 Hz blink.</p>
`,answer:4,tol:.001,unit:``},{id:`p10-l22-q4`,type:`num`,q:`<p>When does blink mode start if the press is accepted at 1020 ms and the hold time is 2 s?</p>
`,explain:`<p>Hold time after the accepted press.</p>
`,answer:3020,tol:.001,unit:`ms`},{id:`p10-l22-q5`,type:`mc`,q:`<p>What lets the module be tested on the host?</p>
`,explain:`<p>The seam between logic and registers.</p>
`,options:[`compiling with -O0`,`it calls hardware only through a HAL interface that tests can replace with a fake`,`it uses volatile`,`it runs in QEMU`],answer:1},{id:`p10-l22-q6`,type:`mc`,q:`<p>Which test double records calls and checks they were made correctly?</p>
`,explain:`<p>Mocks verify interactions; CMock generates them.</p>
`,options:[`a stub`,`a fake`,`a mock`,`a spy register`],answer:2}],o=[{file:`test_button_led.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <string.h>

/* ---------------- minitest.h: a tiny Unity-style framework ---------------- */
static int mt_tests, mt_failures, mt_current_failed;
static const char *mt_name;
#define TEST_ASSERT_TRUE(c) do { if (!(c)) { printf("%s:%d:%s:FAIL: %s\\n", __FILE__, __LINE__, mt_name, #c); mt_current_failed = 1; return; } } while (0)
#define TEST_ASSERT_EQUAL_INT(e, a) do { long _e = (long)(e), _a = (long)(a); if (_e != _a) { \\
    printf("%s:%d:%s:FAIL: expected %ld was %ld\\n", __FILE__, __LINE__, mt_name, _e, _a); mt_current_failed = 1; return; } } while (0)
static void setUp(void);
#define RUN_TEST(fn) do { mt_name = #fn; mt_current_failed = 0; setUp(); fn(); mt_tests++; \\
    if (mt_current_failed) mt_failures++; else printf("%s:PASS\\n", #fn); } while (0)

/* ---------------- hal.h ---------------- */
typedef struct { int (*read_button)(void); void (*write_led)(int on); uint32_t (*millis)(void); } hal_t;

/* ---------------- button_led.c: the module under test ---------------- */
#define DEBOUNCE_MS 20u
#define HOLD_MS 2000u
#define BLINK_HALF_MS 250u
typedef struct { const hal_t *hal; int raw, stable, led, blinking; uint32_t t_change, t_press, t_blink; } button_led_t;
static void bl_init(button_led_t *b, const hal_t *hal) {
  memset(b, 0, sizeof *b); b->hal = hal; b->t_change = hal->millis(); hal->write_led(0);
}
static void bl_poll(button_led_t *b) {                    /* call every millisecond or so */
  uint32_t now = b->hal->millis(); int raw = b->hal->read_button();
  if (raw != b->raw) { b->raw = raw; b->t_change = now; }
  if (raw != b->stable && (uint32_t)(now - b->t_change) >= DEBOUNCE_MS) {   /* unsigned: wrap-safe */
    b->stable = raw;
    if (raw) { b->led = !b->led; b->hal->write_led(b->led); b->t_press = now; }
    else if (b->blinking) { b->blinking = 0; b->led = 0; b->hal->write_led(0); }
  }
  if (b->stable && !b->blinking && (uint32_t)(now - b->t_press) >= HOLD_MS) { b->blinking = 1; b->t_blink = now; }
  if (b->blinking && (uint32_t)(now - b->t_blink) >= BLINK_HALF_MS) { b->t_blink += BLINK_HALF_MS; b->led = !b->led; b->hal->write_led(b->led); }
}

/* ---------------- hal_fake.c ---------------- */
static int fake_button; static uint32_t fake_now; static int fake_led, fake_led_writes;
static int fake_read_button(void) { return fake_button; }
static void fake_write_led(int on) { fake_led = on; fake_led_writes++; }
static uint32_t fake_millis(void) { return fake_now; }
static const hal_t fake_hal = {fake_read_button, fake_write_led, fake_millis};
static button_led_t bl;
static void run_ms(uint32_t ms) { while (ms--) { fake_now++; bl_poll(&bl); } }
static void set_button(int v) { fake_button = v; bl_poll(&bl); }   /* the edge is seen at the current ms */

/* ---------------- test_button_led.c ---------------- */
static void setUp(void) { fake_button = 0; fake_now = 1000; fake_led = -1; fake_led_writes = 0; bl_init(&bl, &fake_hal); }

static void test_led_starts_off(void) { TEST_ASSERT_EQUAL_INT(0, fake_led); }
static void test_clean_press_toggles_once(void) {
  set_button(1); run_ms(19); TEST_ASSERT_EQUAL_INT(0, fake_led);       /* not yet stable */
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led);                       /* accepted at 20 ms */
  run_ms(500); TEST_ASSERT_EQUAL_INT(1, fake_led); TEST_ASSERT_EQUAL_INT(2, fake_led_writes);
}
static void test_bounce_is_ignored(void) {
  for (int i = 0; i < 5; i++) { set_button(!fake_button); run_ms(1); }    /* 5 ms of chatter, ends pressed */
  run_ms(18); TEST_ASSERT_EQUAL_INT(0, fake_led);
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led);                           /* 20 ms after the last edge */
}
static void test_short_glitch_does_nothing(void) {
  set_button(1); run_ms(10); set_button(0); run_ms(100);
  TEST_ASSERT_EQUAL_INT(0, fake_led); TEST_ASSERT_EQUAL_INT(1, fake_led_writes);
}
static void test_two_presses_toggle_back(void) {
  set_button(1); run_ms(50); set_button(0); run_ms(50); set_button(1); run_ms(50);
  TEST_ASSERT_EQUAL_INT(0, fake_led);
}
static void test_hold_enters_blink_at_2hz(void) {
  set_button(1); run_ms(20 + HOLD_MS - 1); TEST_ASSERT_EQUAL_INT(0, bl.blinking);
  run_ms(1); TEST_ASSERT_TRUE(bl.blinking);
  int writes = fake_led_writes; run_ms(1000); TEST_ASSERT_EQUAL_INT(writes + 4, fake_led_writes);   /* 4 toggles per s */
  set_button(0); run_ms(20); TEST_ASSERT_EQUAL_INT(0, bl.blinking); TEST_ASSERT_EQUAL_INT(0, fake_led);
}
static void test_millis_wraparound(void) {
  fake_now = 0xFFFFFFFFu - 10; bl_init(&bl, &fake_hal);
  set_button(1); run_ms(19); TEST_ASSERT_EQUAL_INT(0, fake_led);
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led); TEST_ASSERT_TRUE(fake_now < 100);   /* clock wrapped */
}
/* a meta-test: the framework itself must report a failing assertion */
static void failing_on_purpose(void) { TEST_ASSERT_EQUAL_INT(1, 2); }

int main(void) {
  RUN_TEST(test_led_starts_off);
  RUN_TEST(test_clean_press_toggles_once);
  RUN_TEST(test_bounce_is_ignored);
  RUN_TEST(test_short_glitch_does_nothing);
  RUN_TEST(test_two_presses_toggle_back);
  RUN_TEST(test_hold_enters_blink_at_2hz);
  RUN_TEST(test_millis_wraparound);
  int real_tests = mt_tests, real_failures = mt_failures;
  printf("-----------------------\\n%d Tests %d Failures 0 Ignored\\n%s\\n", real_tests, real_failures, real_failures ? "FAIL" : "OK");
  RUN_TEST(failing_on_purpose);                           /* expected to print one FAIL line */
  if (mt_failures != real_failures + 1) { printf("framework did not catch a failure\\n"); return 1; }
  if (real_failures) return 1;                             /* non-zero exit fails the CI job */
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};