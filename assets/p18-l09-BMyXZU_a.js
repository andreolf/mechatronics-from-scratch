var e=`p18-l09`,t=35,n=`A sensor publisher and a subscriber look trivial until the link loses packets or the callback is slow. You simulate a 200 Hz IMU publisher, a DDS link and a keep-last subscriber, check the received rate within 1 %, and see what best effort, retransmission and history depth do to rate and latency.`,r=`<h2 id="the-publisher-side">The publisher side</h2>
<p>An IMU driver publishes <code>sensor_msgs/msg/Imu</code> from a timer (or from the device’s data-ready interrupt) at a fixed rate. Every message carries a <code>header</code> with a <strong>stamp</strong>, the time the measurement was taken, and a <strong>frame_id</strong>, the frame it is expressed in (lesson 11). Stamp with the sample time, not the publish time: consumers use the stamp to fuse data (Phase 14) and to measure latency.</p>
<h2 id="what-qos-does-to-the-stream">What QoS does to the stream</h2>
<ul>
<li><strong>Best effort</strong>: a lost packet is gone; the rate drops by the loss fraction but the latency stays low.</li>
<li><strong>Reliable</strong>: lost packets are resent, so nothing is lost, but a resent sample arrives late, and with a slow link the writer’s history can fill and block.</li>
<li><strong>History depth</strong> on the subscriber: with keep-last <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>, when samples arrive faster than the callback runs, the oldest queued ones are overwritten. A deep queue means old data is processed late; depth 1 means the callback always sees the freshest sample.</li>
</ul>
<p>A callback that takes longer than the period caps the processed rate at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1/</span><span class="mord mathnormal">c</span></span></span></span> and silently drops the rest. The rate a subscriber <em>receives</em> is what to check, with <code>ros2 topic hz</code> or in a test.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="pubsub" data-args="{}"></div></div><figcaption>Live plot of an illustrative IMU stream at the subscriber. Change loss, reliability, callback time and queue depth; the readout shows the received rate, drops and latency.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Simulated 10 s of a 200 Hz IMU with 0.2 ms timer jitter and about 1.3 ms of network latency. Latency is measured from the stamp to the end of the callback.</p>
<ol>
<li>Reliable, 1 ms callback, depth 10: 200.0 Hz received in order, within 1 % of the publish rate; median latency 2.21 ms.</li>
<li>Best effort with 2 % loss: 195.3 Hz, same latency.</li>
<li>Reliable with 2 % loss: all 2000 samples arrive, but resent ones are up to 13.39 ms late.</li>
<li>An 8 ms callback with depth 10 processes about 125 Hz (126.0 Hz counted, including the backlog finished after 10 s); 740 samples are overwritten and the median latency grows to 56.93 ms. With depth 1, the same rate but a median latency of 11.95 ms.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">imu_link.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">rate=<span class="hljs-number">200.0</span>, seconds=<span class="hljs-number">10.0</span>, reliability=<span class="hljs-string">&quot;reliable&quot;</span>, loss=<span class="hljs-number">0.0</span>, cb_ms=<span class="hljs-number">1.0</span>, depth=<span class="hljs-number">10</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;event simulation of an IMU publisher, a DDS link and a subscriber with keep-last history.
    Returns received messages (seq, stamp, processed time) and drop counts.&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); T = <span class="hljs-number">1.0</span> / rate
    ev = []                                                    <span class="hljs-comment"># (time, kind, seq, stamp)</span>
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(seconds * rate)):
        stamp = k * T + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.2e-3</span>)                  <span class="hljs-comment"># publisher timer with a little jitter</span>
        t, tries = stamp, <span class="hljs-number">0</span>
        <span class="hljs-keyword">while</span> <span class="hljs-literal">True</span>:                                            <span class="hljs-comment"># the network: latency, loss, retransmission if reliable</span>
            <span class="hljs-keyword">if</span> rng.random() &gt;= loss: heapq.heappush(ev, (t + <span class="hljs-number">1e-3</span> + rng.exponential(<span class="hljs-number">0.3e-3</span>), <span class="hljs-string">&quot;arrive&quot;</span>, k, stamp)); <span class="hljs-keyword">break</span>
            <span class="hljs-keyword">if</span> reliability == <span class="hljs-string">&quot;best_effort&quot;</span>: <span class="hljs-keyword">break</span>
            t += <span class="hljs-number">10e-3</span>; tries += <span class="hljs-number">1</span>                             <span class="hljs-comment"># reliable: resend after a 10 ms retransmission timeout</span>
    queue, busy_until, got, dropped_queue = [], <span class="hljs-number">0.0</span>, [], <span class="hljs-number">0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">start_next</span>(<span class="hljs-params">now</span>):
        <span class="hljs-keyword">nonlocal</span> busy_until
        seq, stamp = queue.pop(<span class="hljs-number">0</span>); busy_until = now + cb_ms * <span class="hljs-number">1e-3</span>
        got.append((seq, stamp, busy_until))                   <span class="hljs-comment"># latency is measured from stamp to end of callback</span>
        heapq.heappush(ev, (busy_until, <span class="hljs-string">&quot;done&quot;</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>))
    <span class="hljs-keyword">while</span> ev:
        t, kind, seq, stamp = heapq.heappop(ev)
        <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;arrive&quot;</span>:
            queue.append((seq, stamp))
            <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(queue) &gt; depth: queue.pop(<span class="hljs-number">0</span>); dropped_queue += <span class="hljs-number">1</span>     <span class="hljs-comment"># keep last N: the oldest is overwritten</span>
        <span class="hljs-keyword">if</span> queue <span class="hljs-keyword">and</span> t &gt;= busy_until - <span class="hljs-number">1e-12</span>: start_next(t)
    <span class="hljs-keyword">return</span> got, dropped_queue

<span class="hljs-keyword">def</span> <span class="hljs-title function_">stats</span>(<span class="hljs-params">got, seconds=<span class="hljs-number">10.0</span></span>):
    seqs = [g[<span class="hljs-number">0</span>] <span class="hljs-keyword">for</span> g <span class="hljs-keyword">in</span> got]; lat = np.array([g[<span class="hljs-number">2</span>] - g[<span class="hljs-number">1</span>] <span class="hljs-keyword">for</span> g <span class="hljs-keyword">in</span> got]) * <span class="hljs-number">1e3</span>
    <span class="hljs-keyword">return</span> {<span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-built_in">len</span>(got) / seconds, <span class="hljs-string">&quot;received&quot;</span>: <span class="hljs-built_in">len</span>(got), <span class="hljs-string">&quot;in_order&quot;</span>: seqs == <span class="hljs-built_in">sorted</span>(seqs),
            <span class="hljs-string">&quot;lat_median_ms&quot;</span>: <span class="hljs-built_in">float</span>(np.median(lat)), <span class="hljs-string">&quot;lat_max_ms&quot;</span>: <span class="hljs-built_in">float</span>(lat.<span class="hljs-built_in">max</span>())}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_scenarios</span>():
    rows = [(<span class="hljs-string">&quot;reliable, 1 ms callback, depth 10&quot;</span>, <span class="hljs-built_in">dict</span>()),
            (<span class="hljs-string">&quot;best effort, 2 % loss&quot;</span>, <span class="hljs-built_in">dict</span>(reliability=<span class="hljs-string">&quot;best_effort&quot;</span>, loss=<span class="hljs-number">0.02</span>)),
            (<span class="hljs-string">&quot;reliable, 2 % loss (retransmitted)&quot;</span>, <span class="hljs-built_in">dict</span>(loss=<span class="hljs-number">0.02</span>)),
            (<span class="hljs-string">&quot;reliable, slow 8 ms callback, depth 10&quot;</span>, <span class="hljs-built_in">dict</span>(cb_ms=<span class="hljs-number">8.0</span>)),
            (<span class="hljs-string">&quot;reliable, slow 8 ms callback, depth 1&quot;</span>, <span class="hljs-built_in">dict</span>(cb_ms=<span class="hljs-number">8.0</span>, depth=<span class="hljs-number">1</span>))]
    out = {}
    <span class="hljs-keyword">for</span> name, kw <span class="hljs-keyword">in</span> rows:
        got, dq = run(**kw); s = stats(got); out[name] = (s, dq)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{name:40s}</span> <span class="hljs-subst">{s[<span class="hljs-string">&#x27;rate&#x27;</span>]:<span class="hljs-number">6.1</span>f}</span> Hz received, <span class="hljs-subst">{dq:4d}</span> dropped by history, latency median <span class="hljs-subst">{s[<span class="hljs-string">&#x27;lat_median_ms&#x27;</span>]:<span class="hljs-number">5.2</span>f}</span> ms, max <span class="hljs-subst">{s[<span class="hljs-string">&#x27;lat_max_ms&#x27;</span>]:<span class="hljs-number">6.2</span>f}</span> ms&quot;</span>)
    a = out[rows[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>]][<span class="hljs-number">0</span>]; <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(a[<span class="hljs-string">&quot;rate&quot;</span>] - <span class="hljs-number">200</span>) / <span class="hljs-number">200</span> &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> a[<span class="hljs-string">&quot;in_order&quot;</span>]       <span class="hljs-comment"># the lesson&#x27;s check: within 1 %</span>
    b = out[rows[<span class="hljs-number">1</span>][<span class="hljs-number">0</span>]][<span class="hljs-number">0</span>]; <span class="hljs-keyword">assert</span> <span class="hljs-number">190</span> &lt; b[<span class="hljs-string">&quot;rate&quot;</span>] &lt; <span class="hljs-number">200</span>
    c = out[rows[<span class="hljs-number">2</span>][<span class="hljs-number">0</span>]][<span class="hljs-number">0</span>]; <span class="hljs-keyword">assert</span> c[<span class="hljs-string">&quot;received&quot;</span>] == <span class="hljs-number">2000</span> <span class="hljs-keyword">and</span> c[<span class="hljs-string">&quot;lat_max_ms&quot;</span>] &gt; <span class="hljs-number">10</span>              <span class="hljs-comment"># nothing lost, but late</span>
    d, e = out[rows[<span class="hljs-number">3</span>][<span class="hljs-number">0</span>]][<span class="hljs-number">0</span>], out[rows[<span class="hljs-number">4</span>][<span class="hljs-number">0</span>]][<span class="hljs-number">0</span>]
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(d[<span class="hljs-string">&quot;rate&quot;</span>] - <span class="hljs-number">125</span>) &lt; <span class="hljs-number">2</span> <span class="hljs-keyword">and</span> e[<span class="hljs-string">&quot;lat_median_ms&quot;</span>] &lt; d[<span class="hljs-string">&quot;lat_median_ms&quot;</span>] / <span class="hljs-number">4</span>            <span class="hljs-comment"># depth 1 = freshest data</span>

test_scenarios()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<p>The real nodes in rclpy, for reference (not run by this site’s checks; needs a ROS 2 install):</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">imu_nodes_ref.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-comment"># Reference only, not run by this site&#x27;s checks; needs a ROS 2 install (for example Jazzy).</span>
<span class="hljs-keyword">import</span> rclpy
<span class="hljs-keyword">from</span> rclpy.node <span class="hljs-keyword">import</span> Node
<span class="hljs-keyword">from</span> rclpy.qos <span class="hljs-keyword">import</span> qos_profile_sensor_data
<span class="hljs-keyword">from</span> sensor_msgs.msg <span class="hljs-keyword">import</span> Imu

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ImuPublisher</span>(<span class="hljs-title class_ inherited__">Node</span>):
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-built_in">super</span>().__init__(<span class="hljs-string">&#x27;imu_publisher&#x27;</span>)
        <span class="hljs-variable language_">self</span>.pub = <span class="hljs-variable language_">self</span>.create_publisher(Imu, <span class="hljs-string">&#x27;imu/data&#x27;</span>, qos_profile_sensor_data)   <span class="hljs-comment"># best effort, keep last 5</span>
        <span class="hljs-variable language_">self</span>.create_timer(<span class="hljs-number">1.0</span> / <span class="hljs-number">200.0</span>, <span class="hljs-variable language_">self</span>.tick)

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">tick</span>(<span class="hljs-params">self</span>):
        msg = Imu()
        msg.header.stamp = <span class="hljs-variable language_">self</span>.get_clock().now().to_msg()
        msg.header.frame_id = <span class="hljs-string">&#x27;imu_link&#x27;</span>
        msg.linear_acceleration.z = <span class="hljs-number">9.81</span>
        <span class="hljs-variable language_">self</span>.pub.publish(msg)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ImuSubscriber</span>(<span class="hljs-title class_ inherited__">Node</span>):
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-built_in">super</span>().__init__(<span class="hljs-string">&#x27;imu_subscriber&#x27;</span>)
        <span class="hljs-variable language_">self</span>.create_subscription(Imu, <span class="hljs-string">&#x27;imu/data&#x27;</span>, <span class="hljs-variable language_">self</span>.cb, qos_profile_sensor_data)

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">cb</span>(<span class="hljs-params">self, msg</span>):
        age = <span class="hljs-variable language_">self</span>.get_clock().now() - rclpy.time.Time.from_msg(msg.header.stamp)
        <span class="hljs-variable language_">self</span>.get_logger().debug(<span class="hljs-string">f&#x27;az <span class="hljs-subst">{msg.linear_acceleration.z:<span class="hljs-number">.2</span>f}</span>, age <span class="hljs-subst">{age.nanoseconds / <span class="hljs-number">1e6</span>:<span class="hljs-number">.2</span>f}</span> ms&#x27;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p><code>ros2 topic hz /imu/data</code> and <code>ros2 topic bw</code> measure rate and bandwidth, and <code>ros2 topic delay</code> uses header stamps for latency. In C++, avoid allocation in the publishing loop with <code>rclcpp::LoanedMessage</code> or preallocated messages, and prefer intra-process communication or shared memory for large data such as images and point clouds.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your 100 Hz control node subscribes to a 1 kHz IMU with depth 100 and reliable QoS, and only uses the latest sample. What is wrong?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>If the callback falls behind, it works through up to 100 old samples (0.1 s of stale data). Use depth 1 or a small depth with best effort, or process all queued samples cheaply and keep only the last one.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does a reliable link not guarantee a reliable control loop?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Reliability guarantees delivery, not timeliness: a resent sample may arrive after its deadline, and a slow reader can make a reliable writer block. A control loop needs fresh data on time, so it usually prefers best effort with a deadline QoS and handles missing samples.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l09"></div>
`,i=[{id:`the-publisher-side`,title:`The publisher side`},{id:`what-qos-does-to-the-stream`,title:`What QoS does to the stream`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l09-q1`,type:`num`,q:`<p>Maximum processed rate with a 4 ms callback?</p>
`,explain:`<p>One callback at a time.</p>
`,answer:250,tol:.001,unit:`Hz`},{id:`p18-l09-q2`,type:`num`,q:`<p>Expected rate received from 500 Hz with 3 % best-effort loss?</p>
`,explain:`<p>The loss fraction is gone.</p>
`,answer:485,tol:.002,unit:`Hz`},{id:`p18-l09-q3`,type:`num`,q:`<p>Age of the oldest sample in a full depth-50 queue of a 200 Hz stream?</p>
`,explain:`<p>Depth times period.</p>
`,answer:250,tol:.002,unit:`ms`},{id:`p18-l09-q4`,type:`num`,q:`<p>Allowed received-rate band for 200 Hz within 1 % (lower edge)?</p>
`,explain:`<p>1 % of 200 Hz is 2 Hz.</p>
`,answer:198,tol:.001,unit:`Hz`},{id:`p18-l09-q5`,type:`mc`,q:`<p>A message’s header stamp should be…</p>
`,explain:`<p>Consumers fuse and measure latency against it.</p>
`,options:[`the time the measurement was taken`,`zero for sensor data`,`the time the message was published`,`the time it was received`],answer:0},{id:`p18-l09-q6`,type:`mc`,q:`<p>A subscriber that only needs the freshest sample should use…</p>
`,explain:`<p>Old samples are overwritten.</p>
`,options:[`transient local durability`,`depth 1000`,`keep-all history`,`keep-last with depth 1`],answer:3}],o=[{file:`imu_link.py`,lang:`python`,src:`import heapq
import numpy as np

def run(rate=200.0, seconds=10.0, reliability="reliable", loss=0.0, cb_ms=1.0, depth=10, seed=0):
    """event simulation of an IMU publisher, a DDS link and a subscriber with keep-last history.
    Returns received messages (seq, stamp, processed time) and drop counts."""
    rng = np.random.default_rng(seed); T = 1.0 / rate
    ev = []                                                    # (time, kind, seq, stamp)
    for k in range(int(seconds * rate)):
        stamp = k * T + rng.normal(0, 0.2e-3)                  # publisher timer with a little jitter
        t, tries = stamp, 0
        while True:                                            # the network: latency, loss, retransmission if reliable
            if rng.random() >= loss: heapq.heappush(ev, (t + 1e-3 + rng.exponential(0.3e-3), "arrive", k, stamp)); break
            if reliability == "best_effort": break
            t += 10e-3; tries += 1                             # reliable: resend after a 10 ms retransmission timeout
    queue, busy_until, got, dropped_queue = [], 0.0, [], 0
    def start_next(now):
        nonlocal busy_until
        seq, stamp = queue.pop(0); busy_until = now + cb_ms * 1e-3
        got.append((seq, stamp, busy_until))                   # latency is measured from stamp to end of callback
        heapq.heappush(ev, (busy_until, "done", -1, 0))
    while ev:
        t, kind, seq, stamp = heapq.heappop(ev)
        if kind == "arrive":
            queue.append((seq, stamp))
            if len(queue) > depth: queue.pop(0); dropped_queue += 1     # keep last N: the oldest is overwritten
        if queue and t >= busy_until - 1e-12: start_next(t)
    return got, dropped_queue

def stats(got, seconds=10.0):
    seqs = [g[0] for g in got]; lat = np.array([g[2] - g[1] for g in got]) * 1e3
    return {"rate": len(got) / seconds, "received": len(got), "in_order": seqs == sorted(seqs),
            "lat_median_ms": float(np.median(lat)), "lat_max_ms": float(lat.max())}

def test_scenarios():
    rows = [("reliable, 1 ms callback, depth 10", dict()),
            ("best effort, 2 % loss", dict(reliability="best_effort", loss=0.02)),
            ("reliable, 2 % loss (retransmitted)", dict(loss=0.02)),
            ("reliable, slow 8 ms callback, depth 10", dict(cb_ms=8.0)),
            ("reliable, slow 8 ms callback, depth 1", dict(cb_ms=8.0, depth=1))]
    out = {}
    for name, kw in rows:
        got, dq = run(**kw); s = stats(got); out[name] = (s, dq)
        print(f"{name:40s} {s['rate']:6.1f} Hz received, {dq:4d} dropped by history, latency median {s['lat_median_ms']:5.2f} ms, max {s['lat_max_ms']:6.2f} ms")
    a = out[rows[0][0]][0]; assert abs(a["rate"] - 200) / 200 < 0.01 and a["in_order"]       # the lesson's check: within 1 %
    b = out[rows[1][0]][0]; assert 190 < b["rate"] < 200
    c = out[rows[2][0]][0]; assert c["received"] == 2000 and c["lat_max_ms"] > 10              # nothing lost, but late
    d, e = out[rows[3][0]][0], out[rows[4][0]][0]
    assert abs(d["rate"] - 125) < 2 and e["lat_median_ms"] < d["lat_median_ms"] / 4            # depth 1 = freshest data

test_scenarios()
print("PASS")`},{file:`imu_nodes_ref.py`,lang:`python`,src:`# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Imu

class ImuPublisher(Node):
    def __init__(self):
        super().__init__('imu_publisher')
        self.pub = self.create_publisher(Imu, 'imu/data', qos_profile_sensor_data)   # best effort, keep last 5
        self.create_timer(1.0 / 200.0, self.tick)

    def tick(self):
        msg = Imu()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'imu_link'
        msg.linear_acceleration.z = 9.81
        self.pub.publish(msg)

class ImuSubscriber(Node):
    def __init__(self):
        super().__init__('imu_subscriber')
        self.create_subscription(Imu, 'imu/data', self.cb, qos_profile_sensor_data)

    def cb(self, msg):
        age = self.get_clock().now() - rclpy.time.Time.from_msg(msg.header.stamp)
        self.get_logger().debug(f'az {msg.linear_acceleration.z:.2f}, age {age.nanoseconds / 1e6:.2f} ms')`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};