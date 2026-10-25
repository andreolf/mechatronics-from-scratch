var e=`p18-l03`,t=40,n=`An RTOS is a small kernel that runs the highest-priority ready task on every tick. You build the core of one in C on the host, a tick-driven preemptive priority scheduler with sensing, control and logging tasks, check that every task meets its period, and see why vTaskDelayUntil, not vTaskDelay, keeps a control loop on time.`,r=`<h2 id="what-an-rtos-gives-you">What an RTOS gives you</h2>
<p>A bare-metal super-loop (Phase 10) runs everything in one sequence, so a slow logging step delays the control step. A <strong>real-time operating system</strong> such as FreeRTOS, Zephyr or ThreadX splits the work into <strong>tasks</strong>, each with its own stack and a fixed priority, and a small kernel decides which one runs:</p>
<ul>
<li>A periodic <strong>tick interrupt</strong> (often 1 kHz) advances the kernel clock and unblocks tasks whose delay has expired.</li>
<li>The scheduler always runs the <strong>highest-priority ready task</strong>, preempting a lower one mid-computation. Tasks of equal priority can share time by round robin.</li>
<li>A task that has nothing to do <strong>blocks</strong> (on a delay, a queue or a semaphore) and uses no processor time. When nothing is ready, the idle task runs and can put the chip to sleep.</li>
</ul>
<p>This is exactly the fixed-priority model of lesson 02, so its analysis applies.</p>
<h2 id="task-states">Task states</h2>
<p>Each task is <strong>running</strong>, <strong>ready</strong> (could run, a higher-priority task is running), <strong>blocked</strong> (waiting for time or an event) or <strong>suspended</strong>. A periodic task is a loop: wait for the next release, do the job, repeat.</p>
<h2 id="delay-until-not-delay">Delay until, not delay</h2>
<p><code>vTaskDelay(10)</code> blocks for 10 ticks <em>from now</em>. If the task was preempted, the next release is pushed back by its response time, and the loop drifts. <code>vTaskDelayUntil(&amp;last, 10)</code> blocks until <code>last + 10</code>, an absolute time, which keeps the period exact as long as each job finishes within it. It is the RTOS version of the absolute-time loop in lesson 01.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="rtostimeline" data-args="{}"></div></div><figcaption>Tick-by-tick timeline of sensing (high priority), control and logging tasks. Change the execution times and periods, and switch control between delay-until and delay to see the drift.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative tasks, in ticks: sensing priority 3, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4</span></span></span></span>; control priority 2, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span></span></span></span>; logging priority 1, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">50</span></span></span></span>.</p>
<ol>
<li>The first 40 ticks run <code>SCCLSLLLSLCCS...S...SCC.S...S.CCS...S...</code>: logging is preempted by sensing at ticks 4 and 8 and by control at 10.</li>
<li>Over 1000 ticks, worst response times are 1, 3 and 10 ticks, matching response-time analysis (for logging <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span></span></span></span>), and every task keeps its exact period. Utilisation is 0.550, so 450 ticks are idle.</li>
<li>Switching control to <code>vTaskDelay(10)</code> makes its mean period 12.01 ticks: each cycle adds its response time.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">rtos_sim.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* rtos_sim.c: a tick-driven preemptive priority scheduler, the core of an RTOS like FreeRTOS, simulated on the host.
   Three tasks (sensing, control, logging) block until their next wake-up tick; the highest-priority ready task runs. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>

<span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> DELAY_UNTIL, DELAY };              <span class="hljs-comment">/* vTaskDelayUntil (absolute) vs vTaskDelay (relative to finish) */</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NT 3</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> HORIZON 1000</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> MAXJ 400</span>

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span>
    <span class="hljs-type">const</span> <span class="hljs-type">char</span> *name; <span class="hljs-type">char</span> tag; <span class="hljs-type">int</span> prio, wcet, period, mode;
    <span class="hljs-type">int</span> ready, left, wake, last_release;
    <span class="hljs-type">int</span> releases[MAXJ], finishes[MAXJ], nj;
} Task;

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">run</span><span class="hljs-params">(Task *t, <span class="hljs-type">char</span> *timeline)</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) { t[i].ready = <span class="hljs-number">0</span>; t[i].left = <span class="hljs-number">0</span>; t[i].wake = <span class="hljs-number">0</span>; t[i].nj = <span class="hljs-number">0</span>; }
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> tick = <span class="hljs-number">0</span>; tick &lt; HORIZON; tick++) {
        <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++)                            <span class="hljs-comment">/* the tick interrupt unblocks tasks whose delay expired */</span>
            <span class="hljs-keyword">if</span> (!t[i].ready &amp;&amp; tick &gt;= t[i].wake) {
                t[i].ready = <span class="hljs-number">1</span>; t[i].left = t[i].wcet; t[i].last_release = tick;
                <span class="hljs-keyword">if</span> (t[i].nj &lt; MAXJ) t[i].releases[t[i].nj] = tick;
            }
        <span class="hljs-type">int</span> run = <span class="hljs-number">-1</span>;                                          <span class="hljs-comment">/* pick the highest-priority ready task */</span>
        <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++)
            <span class="hljs-keyword">if</span> (t[i].ready &amp;&amp; (run &lt; <span class="hljs-number">0</span> || t[i].prio &gt; t[run].prio)) run = i;
        timeline[tick] = run &lt; <span class="hljs-number">0</span> ? <span class="hljs-string">&#x27;.&#x27;</span> : t[run].tag;
        <span class="hljs-keyword">if</span> (run &lt; <span class="hljs-number">0</span>) <span class="hljs-keyword">continue</span>;                                 <span class="hljs-comment">/* idle task */</span>
        Task *k = &amp;t[run];
        <span class="hljs-keyword">if</span> (--k-&gt;left == <span class="hljs-number">0</span>) {                                  <span class="hljs-comment">/* job done at the end of this tick: block */</span>
            <span class="hljs-keyword">if</span> (k-&gt;nj &lt; MAXJ) k-&gt;finishes[k-&gt;nj++] = tick + <span class="hljs-number">1</span>;
            k-&gt;ready = <span class="hljs-number">0</span>;
            k-&gt;wake = k-&gt;mode == DELAY_UNTIL ? k-&gt;last_release + k-&gt;period : tick + <span class="hljs-number">1</span> + k-&gt;period;
        }
    }
    timeline[HORIZON] = <span class="hljs-number">0</span>;
}

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">report</span><span class="hljs-params">(<span class="hljs-type">const</span> Task *k, <span class="hljs-type">int</span> *max_resp, <span class="hljs-type">double</span> *mean_period)</span> {
    <span class="hljs-type">int</span> worst = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> j = <span class="hljs-number">0</span>; j &lt; k-&gt;nj; j++) { <span class="hljs-type">int</span> r = k-&gt;finishes[j] - k-&gt;releases[j]; <span class="hljs-keyword">if</span> (r &gt; worst) worst = r; }
    *max_resp = worst;
    *mean_period = k-&gt;nj &gt; <span class="hljs-number">1</span> ? (<span class="hljs-type">double</span>)(k-&gt;releases[k-&gt;nj - <span class="hljs-number">1</span>] - k-&gt;releases[<span class="hljs-number">0</span>]) / (k-&gt;nj - <span class="hljs-number">1</span>) : <span class="hljs-number">0</span>;
}

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
    <span class="hljs-type">static</span> <span class="hljs-type">char</span> tl[HORIZON + <span class="hljs-number">1</span>];
    Task t[NT] = {
        {<span class="hljs-string">&quot;sensing&quot;</span>, <span class="hljs-string">&#x27;S&#x27;</span>, <span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>, DELAY_UNTIL},                <span class="hljs-comment">/* name, tag, priority, WCET, period (ticks), delay mode */</span>
        {<span class="hljs-string">&quot;control&quot;</span>, <span class="hljs-string">&#x27;C&#x27;</span>, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">10</span>, DELAY_UNTIL},
        {<span class="hljs-string">&quot;logging&quot;</span>, <span class="hljs-string">&#x27;L&#x27;</span>, <span class="hljs-number">1</span>, <span class="hljs-number">5</span>, <span class="hljs-number">50</span>, DELAY_UNTIL},
    };
    <span class="hljs-type">int</span> ok = <span class="hljs-number">1</span>, resp; <span class="hljs-type">double</span> per;

    run(t, tl);
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;first 40 ticks: %.40s\\n&quot;</span>, tl);
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; NT; i++) {
        report(&amp;t[i], &amp;resp, &amp;per);
        <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;  %-8s prio %d  C=%d T=%-3d jobs %3d  worst response %d  mean period %.2f\\n&quot;</span>,
               t[i].name, t[i].prio, t[i].wcet, t[i].period, t[i].nj, resp, per);
        <span class="hljs-keyword">if</span> (resp &gt; t[i].period || per != t[i].period) ok = <span class="hljs-number">0</span>;   <span class="hljs-comment">/* every task meets its period, no drift */</span>
    }
    <span class="hljs-type">int</span> idle = <span class="hljs-number">0</span>; <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; HORIZON; i++) idle += tl[i] == <span class="hljs-string">&#x27;.&#x27;</span>;
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;idle %d of %d ticks (utilisation %.3f)\\n&quot;</span>, idle, HORIZON, <span class="hljs-number">1.0</span> - (<span class="hljs-type">double</span>)idle / HORIZON);

    t[<span class="hljs-number">1</span>].mode = DELAY;                                         <span class="hljs-comment">/* control switches to a relative delay */</span>
    run(t, tl);
    report(&amp;t[<span class="hljs-number">1</span>], &amp;resp, &amp;per);
    <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;control with vTaskDelay(10): mean period %.2f ticks instead of 10 (drifts by its response time)\\n&quot;</span>, per);
    <span class="hljs-keyword">if</span> (per &lt;= <span class="hljs-number">10.5</span>) ok = <span class="hljs-number">0</span>;

    <span class="hljs-built_in">puts</span>(ok ? <span class="hljs-string">&quot;PASS&quot;</span> : <span class="hljs-string">&quot;FAIL&quot;</span>);
    <span class="hljs-keyword">return</span> ok ? <span class="hljs-number">0</span> : <span class="hljs-number">1</span>;
}</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In FreeRTOS each of these tasks is a function created with <code>xTaskCreate(fn, &quot;control&quot;, stack_words, NULL, priority, &amp;handle)</code> and looping on <code>vTaskDelayUntil</code>. The real kernel also switches stacks and registers (on a Cortex-M in the PendSV interrupt), which this host simulation leaves out. Size each stack with <code>uxTaskGetStackHighWaterMark</code>, and use a tracing tool such as Percepio Tracealyzer or SEGGER SystemView to see the real timeline.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Give logging a higher priority than control in the example. What happens to control’s worst response time?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Control can now be delayed by a whole 5-tick logging job as well as by sensing. Response-time analysis gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span></span></span></span>, and the simulation agrees: a worst response of 10 ticks, exactly its period. It still just meets its deadline, but with no margin; long low-value work belongs at low priority.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the idle task matter on a battery-powered board?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>It runs whenever no task is ready. Putting the processor to sleep there (or using FreeRTOS tickless idle) saves power without changing any task’s timing.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l03"></div>
`,i=[{id:`what-an-rtos-gives-you`,title:`What an RTOS gives you`},{id:`task-states`,title:`Task states`},{id:`delay-until-not-delay`,title:`Delay until, not delay`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l03-q1`,type:`num`,q:`<p>Utilisation of the three example tasks (1/4, 2/10, 5/50)?</p>
`,explain:`<p>Sum of C/T.</p>
`,answer:.55,tol:.002,unit:``},{id:`p18-l03-q2`,type:`num`,q:`<p>Mean period of a task that uses vTaskDelay(10) and always takes 3 ticks to finish after release?</p>
`,explain:`<p>Response time plus the relative delay.</p>
`,answer:13,tol:.001,unit:``},{id:`p18-l03-q3`,type:`num`,q:`<p>Jobs of a 4-tick-period task in 1000 ticks?</p>
`,explain:`<p>One per period.</p>
`,answer:250,tol:.001,unit:``},{id:`p18-l03-q4`,type:`num`,q:`<p>Tick period in milliseconds for a 1 kHz tick?</p>
`,explain:`<p>configTICK_RATE_HZ of 1000.</p>
`,answer:1,tol:.001,unit:``},{id:`p18-l03-q5`,type:`mc`,q:`<p>A ready task does not run because…</p>
`,explain:`<p>The other three describe blocked or suspended tasks.</p>
`,options:[`it is waiting for a semaphore`,`a higher-priority task is running`,`it has been suspended`,`its delay has not expired`],answer:1},{id:`p18-l03-q6`,type:`mc`,q:`<p>To keep a control loop’s period exact under preemption, use…</p>
`,explain:`<p>It blocks until an absolute time.</p>
`,options:[`vTaskDelay`,`a lower priority`,`vTaskDelayUntil`,`a busy-wait loop`],answer:2}],o=[{file:`rtos_sim.c`,lang:`c`,src:`/* rtos_sim.c: a tick-driven preemptive priority scheduler, the core of an RTOS like FreeRTOS, simulated on the host.
   Three tasks (sensing, control, logging) block until their next wake-up tick; the highest-priority ready task runs. */
#include <stdio.h>
#include <string.h>

enum { DELAY_UNTIL, DELAY };              /* vTaskDelayUntil (absolute) vs vTaskDelay (relative to finish) */
#define NT 3
#define HORIZON 1000
#define MAXJ 400

typedef struct {
    const char *name; char tag; int prio, wcet, period, mode;
    int ready, left, wake, last_release;
    int releases[MAXJ], finishes[MAXJ], nj;
} Task;

static void run(Task *t, char *timeline) {
    for (int i = 0; i < NT; i++) { t[i].ready = 0; t[i].left = 0; t[i].wake = 0; t[i].nj = 0; }
    for (int tick = 0; tick < HORIZON; tick++) {
        for (int i = 0; i < NT; i++)                            /* the tick interrupt unblocks tasks whose delay expired */
            if (!t[i].ready && tick >= t[i].wake) {
                t[i].ready = 1; t[i].left = t[i].wcet; t[i].last_release = tick;
                if (t[i].nj < MAXJ) t[i].releases[t[i].nj] = tick;
            }
        int run = -1;                                          /* pick the highest-priority ready task */
        for (int i = 0; i < NT; i++)
            if (t[i].ready && (run < 0 || t[i].prio > t[run].prio)) run = i;
        timeline[tick] = run < 0 ? '.' : t[run].tag;
        if (run < 0) continue;                                 /* idle task */
        Task *k = &t[run];
        if (--k->left == 0) {                                  /* job done at the end of this tick: block */
            if (k->nj < MAXJ) k->finishes[k->nj++] = tick + 1;
            k->ready = 0;
            k->wake = k->mode == DELAY_UNTIL ? k->last_release + k->period : tick + 1 + k->period;
        }
    }
    timeline[HORIZON] = 0;
}

static void report(const Task *k, int *max_resp, double *mean_period) {
    int worst = 0;
    for (int j = 0; j < k->nj; j++) { int r = k->finishes[j] - k->releases[j]; if (r > worst) worst = r; }
    *max_resp = worst;
    *mean_period = k->nj > 1 ? (double)(k->releases[k->nj - 1] - k->releases[0]) / (k->nj - 1) : 0;
}

int main(void) {
    static char tl[HORIZON + 1];
    Task t[NT] = {
        {"sensing", 'S', 3, 1, 4, DELAY_UNTIL},                /* name, tag, priority, WCET, period (ticks), delay mode */
        {"control", 'C', 2, 2, 10, DELAY_UNTIL},
        {"logging", 'L', 1, 5, 50, DELAY_UNTIL},
    };
    int ok = 1, resp; double per;

    run(t, tl);
    printf("first 40 ticks: %.40s\\n", tl);
    for (int i = 0; i < NT; i++) {
        report(&t[i], &resp, &per);
        printf("  %-8s prio %d  C=%d T=%-3d jobs %3d  worst response %d  mean period %.2f\\n",
               t[i].name, t[i].prio, t[i].wcet, t[i].period, t[i].nj, resp, per);
        if (resp > t[i].period || per != t[i].period) ok = 0;   /* every task meets its period, no drift */
    }
    int idle = 0; for (int i = 0; i < HORIZON; i++) idle += tl[i] == '.';
    printf("idle %d of %d ticks (utilisation %.3f)\\n", idle, HORIZON, 1.0 - (double)idle / HORIZON);

    t[1].mode = DELAY;                                         /* control switches to a relative delay */
    run(t, tl);
    report(&t[1], &resp, &per);
    printf("control with vTaskDelay(10): mean period %.2f ticks instead of 10 (drifts by its response time)\\n", per);
    if (per <= 10.5) ok = 0;

    puts(ok ? "PASS" : "FAIL");
    return ok ? 0 : 1;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};