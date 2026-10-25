var e=`p18-l05`,t=35,n=`Linux can run real-time loops if you control what delays them. You learn where wake-up latency comes from, what PREEMPT_RT changes, how cyclictest measures it, and measure a miniature cyclictest on this course’s shared build machine, comparing plain sleep with sleep-then-spin and handling a refused SCHED_FIFO request.`,r=`<h2 id="where-latency-comes-from">Where latency comes from</h2>
<p>A periodic thread asks to wake at time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> and actually runs at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6984em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">L</span></span></span></span>. The <strong>wake-up latency</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">L</span></span></span></span> adds up from:</p>
<ul>
<li>timer hardware and interrupt handling,</li>
<li>the kernel finishing a <strong>non-preemptible section</strong> (a spinlock held, interrupts disabled) before it can switch,</li>
<li>other threads of equal or higher priority, and the scheduler’s own decision,</li>
<li>power management: a deep CPU sleep state takes time to leave, and frequency scaling slows the first cycles,</li>
<li>cache and TLB misses once the thread runs, and <strong>SMIs</strong> (firmware interrupts invisible to the kernel).</li>
</ul>
<p>The mean is usually small. Real-time cares about the <strong>maximum</strong>, which comes from rare events.</p>
<h2 id="what-preempt-rt-changes">What PREEMPT_RT changes</h2>
<p>A stock kernel (<code>PREEMPT_DYNAMIC</code> on most distributions) can preempt most kernel code but keeps many long non-preemptible sections. The <strong>PREEMPT_RT</strong> patch set, merged into mainline Linux in 6.12, turns most spinlocks into sleeping locks with priority inheritance and runs interrupt handlers as threads with their own priorities. A high-priority <code>SCHED_FIFO</code> thread can then preempt almost anything, and worst-case latency on a tuned PC typically falls from milliseconds to tens of microseconds.</p>
<p>The kernel is only part of the job. A real-time setup also uses <code>SCHED_FIFO</code> priorities (which need root or <code>CAP_SYS_NICE</code>), locks memory with <code>mlockall</code> so no page faults happen, isolates cores (<code>isolcpus</code>, <code>nohz_full</code>) and pins the thread there, and disables deep C-states.</p>
<h2 id="cyclictest">cyclictest</h2>
<p><code>cyclictest -m -p80 -i1000 -n</code> runs a thread that sleeps until absolute times 1 ms apart and records how late each wake-up was. Run it for hours under a stress load (<code>stress-ng</code>, heavy I/O, network): the maximum, not the average, says whether your control loop can run on that machine.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="jitterhist" data-args="{}"></div></div><figcaption>Illustrative latency model, not a measurement: a histogram of wake-up latency on a stock kernel versus PREEMPT_RT, with and without load and core isolation. The tail is what moves.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>One run of the code on our shared build machine, which is not a real-time system (numbers change from run to run):</p>
<ol>
<li>Kernel 6.12.94+, <code>PREEMPT_DYNAMIC</code>, 8 cores. The request for <code>SCHED_FIFO</code> priority 80 is refused with <code>PermissionError</code>, as it is for any unprivileged process; the code carries on at normal priority.</li>
<li>Plain <code>time.sleep</code> to absolute deadlines: median latency about 55 µs, but a 99th percentile around 2 ms and a maximum of several ms, from other work on the shared machine.</li>
<li>Sleeping until 200 µs before the deadline and spinning for the rest makes the median latency 0 µs (spinning avoids the timer wake-up cost), but the tail stays in the milliseconds: spinning cannot help when the thread is not scheduled at all. Only priorities, isolation and an RT kernel fix the tail.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">mini_cyclictest.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> os, time, platform
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">kernel_info</span>():
    <span class="hljs-string">&quot;&quot;&quot;what kind of preemption this kernel was built with&quot;&quot;&quot;</span>
    v = platform.uname().version
    rt = os.path.exists(<span class="hljs-string">&quot;/sys/kernel/realtime&quot;</span>) <span class="hljs-keyword">and</span> <span class="hljs-built_in">open</span>(<span class="hljs-string">&quot;/sys/kernel/realtime&quot;</span>).read().strip() == <span class="hljs-string">&quot;1&quot;</span>
    model = <span class="hljs-string">&quot;PREEMPT_RT&quot;</span> <span class="hljs-keyword">if</span> rt <span class="hljs-keyword">or</span> <span class="hljs-string">&quot;PREEMPT_RT&quot;</span> <span class="hljs-keyword">in</span> v <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;PREEMPT_DYNAMIC&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;PREEMPT_DYNAMIC&quot;</span> <span class="hljs-keyword">in</span> v <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;PREEMPT&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;PREEMPT&quot;</span> <span class="hljs-keyword">in</span> v <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;none or voluntary&quot;</span>
    <span class="hljs-keyword">return</span> platform.release(), model

<span class="hljs-keyword">def</span> <span class="hljs-title function_">try_fifo</span>(<span class="hljs-params">prio=<span class="hljs-number">80</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;ask for SCHED_FIFO like cyclictest -p80; needs root or CAP_SYS_NICE, so fail gracefully&quot;&quot;&quot;</span>
    <span class="hljs-keyword">try</span>:
        os.sched_setscheduler(<span class="hljs-number">0</span>, os.SCHED_FIFO, os.sched_param(prio)); <span class="hljs-keyword">return</span> <span class="hljs-string">&quot;granted&quot;</span>
    <span class="hljs-keyword">except</span> (PermissionError, OSError, AttributeError) <span class="hljs-keyword">as</span> e:
        <span class="hljs-keyword">return</span> <span class="hljs-string">f&quot;not permitted here (<span class="hljs-subst">{<span class="hljs-built_in">type</span>(e).__name__}</span>)&quot;</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">wake_latency</span>(<span class="hljs-params">n=<span class="hljs-number">2000</span>, interval=<span class="hljs-number">1e-3</span>, spin=<span class="hljs-number">0.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;cyclictest in miniature: sleep until an absolute time, record how late we woke (seconds).
    spin &gt; 0: sleep until \`spin\` before the target, then busy-wait the rest (hybrid).&quot;&quot;&quot;</span>
    lat = np.empty(n); t = time.perf_counter()
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        t += interval
        d = t - spin - time.perf_counter()
        <span class="hljs-keyword">if</span> d &gt; <span class="hljs-number">0</span>: time.sleep(d)
        <span class="hljs-keyword">if</span> spin &gt; <span class="hljs-number">0</span>:
            <span class="hljs-keyword">while</span> time.perf_counter() &lt; t: <span class="hljs-keyword">pass</span>
        lat[k] = time.perf_counter() - t
    <span class="hljs-keyword">return</span> lat

<span class="hljs-keyword">def</span> <span class="hljs-title function_">summary</span>(<span class="hljs-params">lat</span>):
    us = lat * <span class="hljs-number">1e6</span>
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;min&quot;</span>: us.<span class="hljs-built_in">min</span>(), <span class="hljs-string">&quot;median&quot;</span>: np.median(us), <span class="hljs-string">&quot;p99&quot;</span>: np.percentile(us, <span class="hljs-number">99</span>), <span class="hljs-string">&quot;max&quot;</span>: us.<span class="hljs-built_in">max</span>()}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_kernel_and_priority</span>():
    rel, model = kernel_info()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;kernel <span class="hljs-subst">{rel}</span>, preemption model <span class="hljs-subst">{model}</span>, <span class="hljs-subst">{os.cpu_count()}</span> cores; SCHED_FIFO: <span class="hljs-subst">{try_fifo()}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> model <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;PREEMPT_RT&quot;</span>, <span class="hljs-string">&quot;PREEMPT_DYNAMIC&quot;</span>, <span class="hljs-string">&quot;PREEMPT&quot;</span>, <span class="hljs-string">&quot;none or voluntary&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_sleep_vs_hybrid</span>():
    s = summary(wake_latency()); h = summary(wake_latency(spin=<span class="hljs-number">200e-6</span>))
    fmt = <span class="hljs-keyword">lambda</span> d: <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{k}</span> <span class="hljs-subst">{v:<span class="hljs-number">.0</span>f}</span> us&quot;</span> <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> d.items())
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;plain sleep wake-up latency: &quot;</span> + fmt(s))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;sleep then spin for the last 200 us: &quot;</span> + fmt(h))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;(machine-dependent: these numbers change from run to run)&quot;</span>)
    <span class="hljs-keyword">assert</span> h[<span class="hljs-string">&quot;median&quot;</span>] &lt; s[<span class="hljs-string">&quot;median&quot;</span>]                                    <span class="hljs-comment"># spinning removes the timer-wake cost in the typical case</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_histogram</span>():
    lat = wake_latency(n=<span class="hljs-number">1000</span>) * <span class="hljs-number">1e6</span>
    edges = [<span class="hljs-number">0</span>, <span class="hljs-number">25</span>, <span class="hljs-number">50</span>, <span class="hljs-number">100</span>, <span class="hljs-number">200</span>, <span class="hljs-number">500</span>, <span class="hljs-number">1000</span>, np.inf]; counts, _ = np.histogram(lat, edges)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;plain sleep histogram (us): &quot;</span> + <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;&lt;<span class="hljs-subst">{e:g}</span>: <span class="hljs-subst">{c}</span>&quot;</span> <span class="hljs-keyword">for</span> e, c <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(edges[<span class="hljs-number">1</span>:], counts)))
    <span class="hljs-keyword">assert</span> counts.<span class="hljs-built_in">sum</span>() == <span class="hljs-number">1000</span>

test_kernel_and_priority()
test_sleep_vs_hybrid()
test_histogram()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>On a robot PC, install a PREEMPT_RT kernel (Ubuntu Pro ships <code>linux-realtime</code>), run <code>cyclictest</code> under load, and set real-time limits in <code>/etc/security/limits.conf</code>. ros2_control’s controller manager requests <code>SCHED_FIFO</code> for its loop when the kernel and limits allow it, and the ROS 2 real-time working group documents the rest (memory locking, preallocated messages, real-time safe executors).</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your cyclictest maximum is 40 µs idle and 3 ms while copying files over USB. What do you investigate?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The load triggers long non-preemptible sections or interrupt storms. Check the kernel is PREEMPT_RT, give the USB interrupt thread a lower priority than the control thread, isolate the control core, and use ftrace or <code>rtla timerlat</code> to find the code path causing the delay.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does <code>mlockall(MCL_CURRENT | MCL_FUTURE)</code> matter for a real-time thread?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Without it, touching a page that was swapped out or not yet mapped causes a page fault that can take milliseconds. Locking all memory (and preallocating and touching buffers at start-up) removes those faults from the loop.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l05"></div>
`,i=[{id:`where-latency-comes-from`,title:`Where latency comes from`},{id:`what-preempt-rt-changes`,title:`What PREEMPT_RT changes`},{id:`cyclictest`,title:`cyclictest`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l05-q1`,type:`num`,q:`<p>Loop budget left for computation in a 1 kHz loop with a worst-case wake-up latency of 120 µs?</p>
`,explain:`<p>The period minus the latency.</p>
`,answer:880,tol:.002,unit:`µs`},{id:`p18-l05-q2`,type:`num`,q:`<p>Wake-ups recorded by cyclictest at 1 ms intervals in one hour?</p>
`,explain:`<p>1000 per second.</p>
`,answer:36e5,tol:.001,unit:``},{id:`p18-l05-q3`,type:`num`,q:`<p>Highest SCHED_FIFO priority on Linux?</p>
`,explain:`<p>sched_get_priority_max(SCHED_FIFO).</p>
`,answer:99,tol:.001,unit:``},{id:`p18-l05-q4`,type:`num`,q:`<p>Factor by which worst-case latency improves going from 2 ms to 50 µs?</p>
`,explain:`<p>The ratio of the maxima.</p>
`,answer:40,tol:.002,unit:``},{id:`p18-l05-q5`,type:`mc`,q:`<p>The figure that decides if a machine can run your control loop is…</p>
`,explain:`<p>Rare long delays cause deadline misses.</p>
`,options:[`the median latency`,`the maximum latency under load`,`the CPU clock frequency`,`the mean latency when idle`],answer:1},{id:`p18-l05-q6`,type:`mc`,q:`<p>PREEMPT_RT makes most kernel spinlocks…</p>
`,explain:`<p>So high-priority threads can preempt them.</p>
`,options:[`disappear entirely`,`disable interrupts for longer`,`sleeping locks with priority inheritance`,`run only on core 0`],answer:2}],o=[{file:`mini_cyclictest.py`,lang:`python`,src:`import os, time, platform
import numpy as np

def kernel_info():
    """what kind of preemption this kernel was built with"""
    v = platform.uname().version
    rt = os.path.exists("/sys/kernel/realtime") and open("/sys/kernel/realtime").read().strip() == "1"
    model = "PREEMPT_RT" if rt or "PREEMPT_RT" in v else "PREEMPT_DYNAMIC" if "PREEMPT_DYNAMIC" in v else "PREEMPT" if "PREEMPT" in v else "none or voluntary"
    return platform.release(), model

def try_fifo(prio=80):
    """ask for SCHED_FIFO like cyclictest -p80; needs root or CAP_SYS_NICE, so fail gracefully"""
    try:
        os.sched_setscheduler(0, os.SCHED_FIFO, os.sched_param(prio)); return "granted"
    except (PermissionError, OSError, AttributeError) as e:
        return f"not permitted here ({type(e).__name__})"

def wake_latency(n=2000, interval=1e-3, spin=0.0):
    """cyclictest in miniature: sleep until an absolute time, record how late we woke (seconds).
    spin > 0: sleep until \`spin\` before the target, then busy-wait the rest (hybrid)."""
    lat = np.empty(n); t = time.perf_counter()
    for k in range(n):
        t += interval
        d = t - spin - time.perf_counter()
        if d > 0: time.sleep(d)
        if spin > 0:
            while time.perf_counter() < t: pass
        lat[k] = time.perf_counter() - t
    return lat

def summary(lat):
    us = lat * 1e6
    return {"min": us.min(), "median": np.median(us), "p99": np.percentile(us, 99), "max": us.max()}

def test_kernel_and_priority():
    rel, model = kernel_info()
    print(f"kernel {rel}, preemption model {model}, {os.cpu_count()} cores; SCHED_FIFO: {try_fifo()}")
    assert model in ("PREEMPT_RT", "PREEMPT_DYNAMIC", "PREEMPT", "none or voluntary")

def test_sleep_vs_hybrid():
    s = summary(wake_latency()); h = summary(wake_latency(spin=200e-6))
    fmt = lambda d: ", ".join(f"{k} {v:.0f} us" for k, v in d.items())
    print("plain sleep wake-up latency: " + fmt(s))
    print("sleep then spin for the last 200 us: " + fmt(h))
    print("(machine-dependent: these numbers change from run to run)")
    assert h["median"] < s["median"]                                    # spinning removes the timer-wake cost in the typical case

def test_histogram():
    lat = wake_latency(n=1000) * 1e6
    edges = [0, 25, 50, 100, 200, 500, 1000, np.inf]; counts, _ = np.histogram(lat, edges)
    print("plain sleep histogram (us): " + ", ".join(f"<{e:g}: {c}" for e, c in zip(edges[1:], counts)))
    assert counts.sum() == 1000

test_kernel_and_priority()
test_sleep_vs_hybrid()
test_histogram()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};