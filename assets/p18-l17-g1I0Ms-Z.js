var e=`p18-l17`,t=35,n=`Recording a robot’s topics and replaying them later lets you debug and test algorithms without the robot. You build a bag in the rosbag2 sqlite3 layout, record a live IMU and odometry stream, replay it at different rates and from a seek point, and show that a node using header stamps reproduces its live output exactly while one using wall-clock time does not.`,r=`<h2 id="what-a-bag-is">What a bag is</h2>
<p><code>ros2 bag record /imu /odom</code> subscribes to topics and stores every serialized message (the CDR bytes of lesson 10) with its receive timestamp, plus each topic’s name, type and QoS. <code>ros2 bag play</code> publishes them again in recorded order, at the original pace or faster or slower (at rate <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, a message recorded at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> is published at wall time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">s</span><span class="mord mathnormal mtight">t</span><span class="mord mathnormal mtight">a</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span><span class="mord mathnormal mtight">t</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>), and can publish <code>/clock</code> so nodes follow the bag’s time.</p>
<p>rosbag2 has pluggable storage. Early releases used <strong>sqlite3</strong>: a <code>topics</code> table and a <code>messages</code> table of (topic id, timestamp, data). From Iron on, the default is <strong>MCAP</strong>, a single-file append-only container that is faster to write and readable by tools such as Foxglove. The ideas are the same, and this lesson uses the sqlite3 layout because Python ships with sqlite.</p>
<h2 id="deterministic-replay">Deterministic replay</h2>
<p>Replaying a bag through a node should reproduce what the node did live. That holds only if the node’s output depends on the <strong>data</strong>, not on <strong>when</strong> it ran:</p>
<ul>
<li>use the messages’ header stamps (lesson 09) for time differences, not the wall clock,</li>
<li>or use ROS time with <code>use_sim_time:=true</code>, so the clock comes from <code>/clock</code> published by <code>ros2 bag play --clock</code>,</li>
<li>process messages in a well-defined order; a bag replays in timestamp order, while a live system’s callback order may differ,</li>
<li>avoid hidden state such as random numbers without fixed seeds.</li>
</ul>
<p>Then a bag becomes a <strong>regression test</strong>: replay it after every change and compare the outputs.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="bagscrub" data-args="{}"></div></div><figcaption>A recorded bag on a timeline. Scrub through it, play at different rates, and compare a node that uses header stamps with one that uses the wall clock.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A simulated 5 s run: 100 Hz IMU (yaw rate) and 20 Hz odometry (speed), each delivered after a small random delay, feeding a dead-reckoning node.</p>
<ol>
<li>The bag holds <code>/imu</code> (500 messages over 4.990 s) and <code>/odom</code> (100 messages over 4.951 s).</li>
<li>The node using header stamps ends live at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2.038672</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.28032</span><span class="mclose">)</span></span></span></span> m, heading 0.82525 rad. Replay at rate 1 and at rate 2 reproduce every output exactly.</li>
<li>The node using the time its callback ran ends live at a slightly different pose (2.038292, 1.280356) because of the delivery jitter, and replayed at rate 2 it ends at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1.215029</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0.34902</span><span class="mclose">)</span></span></span></span> m: half the time has passed on its clock.</li>
<li>Seeking to 2.5 s replays 250 poses, starting at stamp 2.50 s.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">mini_rosbag.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> sqlite3, struct, json
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">cdr</span>(<span class="hljs-params">fmt, *v</span>): <span class="hljs-keyword">return</span> <span class="hljs-string">b&quot;\\x00\\x01\\x00\\x00&quot;</span> + struct.pack(<span class="hljs-string">&quot;&lt;&quot;</span> + fmt, *v)
<span class="hljs-keyword">def</span> <span class="hljs-title function_">uncdr</span>(<span class="hljs-params">fmt, b</span>): <span class="hljs-keyword">return</span> struct.unpack(<span class="hljs-string">&quot;&lt;&quot;</span> + fmt, b[<span class="hljs-number">4</span>:])

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Bag</span>:
    <span class="hljs-string">&quot;&quot;&quot;the rosbag2 sqlite3 layout: a topics table and a messages table of (topic_id, timestamp in ns, serialized data)&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, path=<span class="hljs-string">&quot;:memory:&quot;</span></span>):
        <span class="hljs-variable language_">self</span>.db = sqlite3.connect(path)
        <span class="hljs-variable language_">self</span>.db.executescript(<span class="hljs-string">&quot;&quot;&quot;CREATE TABLE topics(id INTEGER PRIMARY KEY, name TEXT, type TEXT, serialization_format TEXT, offered_qos_profiles TEXT);
                                 CREATE TABLE messages(id INTEGER PRIMARY KEY, topic_id INTEGER, timestamp INTEGER, data BLOB);
                                 CREATE INDEX timestamp_idx ON messages(timestamp);&quot;&quot;&quot;</span>)
        <span class="hljs-variable language_">self</span>.ids = {}
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">write</span>(<span class="hljs-params">self, topic, type_, t_ns, data</span>):
        <span class="hljs-keyword">if</span> topic <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.ids:
            cur = <span class="hljs-variable language_">self</span>.db.execute(<span class="hljs-string">&quot;INSERT INTO topics(name, type, serialization_format, offered_qos_profiles) VALUES (?,?,?,?)&quot;</span>,
                                  (topic, type_, <span class="hljs-string">&quot;cdr&quot;</span>, json.dumps({<span class="hljs-string">&quot;reliability&quot;</span>: <span class="hljs-string">&quot;reliable&quot;</span>, <span class="hljs-string">&quot;depth&quot;</span>: <span class="hljs-number">10</span>})))
            <span class="hljs-variable language_">self</span>.ids[topic] = cur.lastrowid
        <span class="hljs-variable language_">self</span>.db.execute(<span class="hljs-string">&quot;INSERT INTO messages(topic_id, timestamp, data) VALUES (?,?,?)&quot;</span>, (<span class="hljs-variable language_">self</span>.ids[topic], t_ns, data))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">read</span>(<span class="hljs-params">self, start_ns=<span class="hljs-number">0</span>, end_ns=<span class="hljs-number">2</span>**<span class="hljs-number">62</span></span>):
        q = <span class="hljs-string">&quot;&quot;&quot;SELECT t.name, m.timestamp, m.data FROM messages m JOIN topics t ON m.topic_id = t.id
               WHERE m.timestamp BETWEEN ? AND ? ORDER BY m.timestamp, m.id&quot;&quot;&quot;</span>
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.db.execute(q, (start_ns, end_ns)).fetchall()
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">info</span>(<span class="hljs-params">self</span>):
        rows = <span class="hljs-variable language_">self</span>.db.execute(<span class="hljs-string">&quot;SELECT t.name, t.type, COUNT(*), MIN(m.timestamp), MAX(m.timestamp) FROM messages m JOIN topics t ON m.topic_id = t.id GROUP BY t.id ORDER BY t.name&quot;</span>).fetchall()
        <span class="hljs-keyword">return</span> rows

<span class="hljs-keyword">class</span> <span class="hljs-title class_">DeadReckoning</span>:
    <span class="hljs-string">&quot;&quot;&quot;a node: integrate gyro yaw rate and wheel speed into a 2D pose. \`use_stamps\` uses message header stamps
    (deterministic); otherwise it uses the time the callback ran (depends on how messages were delivered)&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, use_stamps=<span class="hljs-literal">True</span></span>): <span class="hljs-variable language_">self</span>.use, <span class="hljs-variable language_">self</span>.x = use_stamps, np.zeros(<span class="hljs-number">3</span>); <span class="hljs-variable language_">self</span>.v, <span class="hljs-variable language_">self</span>.tl, <span class="hljs-variable language_">self</span>.out = <span class="hljs-number">0.0</span>, <span class="hljs-literal">None</span>, []
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_odom</span>(<span class="hljs-params">self, stamp, recv, v</span>): <span class="hljs-variable language_">self</span>.v = v
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_imu</span>(<span class="hljs-params">self, stamp, recv, wz</span>):
        t = stamp <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.use <span class="hljs-keyword">else</span> recv
        <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.tl <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>:
            dt = t - <span class="hljs-variable language_">self</span>.tl; th = <span class="hljs-variable language_">self</span>.x[<span class="hljs-number">2</span>]
            <span class="hljs-variable language_">self</span>.x += [<span class="hljs-variable language_">self</span>.v * np.cos(th) * dt, <span class="hljs-variable language_">self</span>.v * np.sin(th) * dt, wz * dt]
        <span class="hljs-variable language_">self</span>.tl = t; <span class="hljs-variable language_">self</span>.out.append((stamp, *<span class="hljs-variable language_">self</span>.x))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">live_system</span>(<span class="hljs-params">bag, seconds=<span class="hljs-number">5.0</span>, seed=<span class="hljs-number">1</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;the robot running: 100 Hz IMU and 20 Hz odometry with header stamps; callbacks run after a random delivery delay&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); events = []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(seconds * <span class="hljs-number">100</span>)):
        t = k / <span class="hljs-number">100</span>; wz = <span class="hljs-number">0.4</span> * np.sin(<span class="hljs-number">0.8</span> * t) + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.01</span>)
        events.append((t + rng.exponential(<span class="hljs-number">2e-3</span>), <span class="hljs-string">&quot;/imu&quot;</span>, t, cdr(<span class="hljs-string">&quot;dd&quot;</span>, t, wz)))
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(seconds * <span class="hljs-number">20</span>)):
        t = k / <span class="hljs-number">20</span>; events.append((t + rng.exponential(<span class="hljs-number">2e-3</span>), <span class="hljs-string">&quot;/odom&quot;</span>, t, cdr(<span class="hljs-string">&quot;dd&quot;</span>, t, <span class="hljs-number">0.5</span> + <span class="hljs-number">0.1</span> * np.sin(t))))
    events.sort(key=<span class="hljs-keyword">lambda</span> e: e[<span class="hljs-number">0</span>])
    node_s, node_r = DeadReckoning(<span class="hljs-literal">True</span>), DeadReckoning(<span class="hljs-literal">False</span>)
    <span class="hljs-keyword">for</span> recv, topic, stamp, data <span class="hljs-keyword">in</span> events:
        bag.write(topic, <span class="hljs-string">&quot;sensor_msgs/msg/Imu&quot;</span> <span class="hljs-keyword">if</span> topic == <span class="hljs-string">&quot;/imu&quot;</span> <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;nav_msgs/msg/Odometry&quot;</span>, <span class="hljs-built_in">int</span>(<span class="hljs-built_in">round</span>(recv * <span class="hljs-number">1e9</span>)), data)   <span class="hljs-comment"># recorded at receive time</span>
        <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> (node_s, node_r): dispatch(n, topic, recv, data)
    <span class="hljs-keyword">return</span> node_s, node_r

<span class="hljs-keyword">def</span> <span class="hljs-title function_">dispatch</span>(<span class="hljs-params">node, topic, recv, data</span>):
    stamp, val = uncdr(<span class="hljs-string">&quot;dd&quot;</span>, data)
    (node.on_imu <span class="hljs-keyword">if</span> topic == <span class="hljs-string">&quot;/imu&quot;</span> <span class="hljs-keyword">else</span> node.on_odom)(stamp, recv, val)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">replay</span>(<span class="hljs-params">bag, use_stamps, rate=<span class="hljs-number">1.0</span>, start_ns=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;ros2 bag play: publish messages in recorded order; the clock advances with the bag time divided by the rate&quot;&quot;&quot;</span>
    node = DeadReckoning(use_stamps); msgs = bag.read(start_ns); t0 = msgs[<span class="hljs-number">0</span>][<span class="hljs-number">1</span>]
    <span class="hljs-keyword">for</span> topic, t_ns, data <span class="hljs-keyword">in</span> msgs: dispatch(node, topic, t0 * <span class="hljs-number">1e-9</span> + (t_ns - t0) * <span class="hljs-number">1e-9</span> / rate, data)
    <span class="hljs-keyword">return</span> node

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_record_and_info</span>():
    bag = Bag(); live_s, live_r = live_system(bag)
    <span class="hljs-keyword">for</span> name, ty, n, a, b <span class="hljs-keyword">in</span> bag.info(): <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{name:6s}</span> <span class="hljs-subst">{ty:22s}</span> <span class="hljs-subst">{n:4d}</span> messages, <span class="hljs-subst">{<span class="hljs-number">1e-9</span> * (b - a):<span class="hljs-number">.3</span>f}</span> s&quot;</span>)
    <span class="hljs-keyword">assert</span> [r[<span class="hljs-number">2</span>] <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> bag.info()] == [<span class="hljs-number">500</span>, <span class="hljs-number">100</span>]
    <span class="hljs-keyword">return</span> bag, live_s, live_r

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_replay</span>(<span class="hljs-params">bag, live_s, live_r</span>):
    a = replay(bag, <span class="hljs-literal">True</span>); b = replay(bag, <span class="hljs-literal">True</span>, rate=<span class="hljs-number">2.0</span>); c = replay(bag, <span class="hljs-literal">False</span>, rate=<span class="hljs-number">2.0</span>)
    fin = <span class="hljs-keyword">lambda</span> n: np.array(n.out[-<span class="hljs-number">1</span>][<span class="hljs-number">1</span>:])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;final pose live (stamps)       &quot;</span>, np.<span class="hljs-built_in">round</span>(fin(live_s), <span class="hljs-number">6</span>))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;replay x1 (stamps)             &quot;</span>, np.<span class="hljs-built_in">round</span>(fin(a), <span class="hljs-number">6</span>))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;replay x2 (stamps)             &quot;</span>, np.<span class="hljs-built_in">round</span>(fin(b), <span class="hljs-number">6</span>))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;replay x2 (receive time)       &quot;</span>, np.<span class="hljs-built_in">round</span>(fin(c), <span class="hljs-number">6</span>))
    <span class="hljs-keyword">assert</span> np.array_equal(np.array(a.out), np.array(live_s.out)) <span class="hljs-keyword">and</span> np.array_equal(np.array(b.out), np.array(live_s.out))
    <span class="hljs-keyword">assert</span> np.<span class="hljs-built_in">abs</span>(fin(c) - fin(live_r)).<span class="hljs-built_in">max</span>() &gt; <span class="hljs-number">0.1</span>                       <span class="hljs-comment"># wall-clock time makes the result depend on playback</span>
    mid = replay(bag, <span class="hljs-literal">True</span>, start_ns=<span class="hljs-built_in">int</span>(<span class="hljs-number">2.5e9</span>))                          <span class="hljs-comment"># seek: start part-way through the bag</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;seek to 2.5 s: <span class="hljs-subst">{<span class="hljs-built_in">len</span>(mid.out)}</span> poses, first stamp <span class="hljs-subst">{mid.out[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> s&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(mid.out[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] - <span class="hljs-number">2.5</span>) &lt; <span class="hljs-number">0.011</span>

bag, s, r = test_record_and_info()
test_replay(bag, s, r)
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p><code>ros2 bag record -a</code> records everything (use with care), <code>ros2 bag info</code> prints the summary shown here, <code>ros2 bag play --rate 0.5 --clock --start-offset 2.5</code> slows down, publishes <code>/clock</code> and seeks, and <code>--storage sqlite3</code> or <code>--storage mcap</code> chooses the format. Foxglove and PlotJuggler open bags for visual inspection, and the <code>rosbag2_py</code> API reads them in scripts and tests.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your localisation replays differently every time. Name three likely causes.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>It uses the wall clock instead of message stamps or sim time; it depends on callback order across topics, which a multi-threaded executor makes nondeterministic; or it uses randomness (a particle filter) without a fixed seed.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why record at the receive time and still keep the header stamps?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The receive time orders the replay as the robot saw it, including delays; the header stamp says when the measurement was taken. Algorithms need the stamp, and comparing the two reveals transport latency.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l17"></div>
`,i=[{id:`what-a-bag-is`,title:`What a bag is`},{id:`deterministic-replay`,title:`Deterministic replay`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l17-q1`,type:`num`,q:`<p>Messages in the example bag?</p>
`,explain:`<p>500 IMU plus 100 odometry.</p>
`,answer:600,tol:.001,unit:``},{id:`p18-l17-q2`,type:`num`,q:`<p>Wall time to replay a 60 s bag at rate 2 (seconds)?</p>
`,explain:`<p>Twice as fast.</p>
`,answer:30,tol:.001,unit:``},{id:`p18-l17-q3`,type:`num`,q:`<p>Messages in 10 s of a 100 Hz IMU and a 20 Hz odometry topic?</p>
`,explain:`<p>Rate times duration per topic.</p>
`,answer:1200,tol:.001,unit:``},{id:`p18-l17-q4`,type:`num`,q:`<p>IMU poses after seeking to 2.5 s in the 5 s bag?</p>
`,explain:`<p>The second half of the IMU samples.</p>
`,answer:250,tol:.001,unit:``},{id:`p18-l17-q5`,type:`mc`,q:`<p>The default rosbag2 storage format from ROS 2 Iron on is…</p>
`,explain:`<p>sqlite3 is still available as a plugin.</p>
`,options:[`CSV`,`ROS 1 .bag`,`MCAP`,`sqlite3`],answer:2},{id:`p18-l17-q6`,type:`mc`,q:`<p>To make a node replay deterministically, it should take time differences from…</p>
`,explain:`<p>Then the output depends only on the data.</p>
`,options:[`the number of callbacks`,`the wall clock`,`message header stamps or sim time`,`the CPU cycle counter`],answer:2}],o=[{file:`mini_rosbag.py`,lang:`python`,src:`import sqlite3, struct, json
import numpy as np

def cdr(fmt, *v): return b"\\x00\\x01\\x00\\x00" + struct.pack("<" + fmt, *v)
def uncdr(fmt, b): return struct.unpack("<" + fmt, b[4:])

class Bag:
    """the rosbag2 sqlite3 layout: a topics table and a messages table of (topic_id, timestamp in ns, serialized data)"""
    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(path)
        self.db.executescript("""CREATE TABLE topics(id INTEGER PRIMARY KEY, name TEXT, type TEXT, serialization_format TEXT, offered_qos_profiles TEXT);
                                 CREATE TABLE messages(id INTEGER PRIMARY KEY, topic_id INTEGER, timestamp INTEGER, data BLOB);
                                 CREATE INDEX timestamp_idx ON messages(timestamp);""")
        self.ids = {}
    def write(self, topic, type_, t_ns, data):
        if topic not in self.ids:
            cur = self.db.execute("INSERT INTO topics(name, type, serialization_format, offered_qos_profiles) VALUES (?,?,?,?)",
                                  (topic, type_, "cdr", json.dumps({"reliability": "reliable", "depth": 10})))
            self.ids[topic] = cur.lastrowid
        self.db.execute("INSERT INTO messages(topic_id, timestamp, data) VALUES (?,?,?)", (self.ids[topic], t_ns, data))
    def read(self, start_ns=0, end_ns=2**62):
        q = """SELECT t.name, m.timestamp, m.data FROM messages m JOIN topics t ON m.topic_id = t.id
               WHERE m.timestamp BETWEEN ? AND ? ORDER BY m.timestamp, m.id"""
        return self.db.execute(q, (start_ns, end_ns)).fetchall()
    def info(self):
        rows = self.db.execute("SELECT t.name, t.type, COUNT(*), MIN(m.timestamp), MAX(m.timestamp) FROM messages m JOIN topics t ON m.topic_id = t.id GROUP BY t.id ORDER BY t.name").fetchall()
        return rows

class DeadReckoning:
    """a node: integrate gyro yaw rate and wheel speed into a 2D pose. \`use_stamps\` uses message header stamps
    (deterministic); otherwise it uses the time the callback ran (depends on how messages were delivered)"""
    def __init__(self, use_stamps=True): self.use, self.x = use_stamps, np.zeros(3); self.v, self.tl, self.out = 0.0, None, []
    def on_odom(self, stamp, recv, v): self.v = v
    def on_imu(self, stamp, recv, wz):
        t = stamp if self.use else recv
        if self.tl is not None:
            dt = t - self.tl; th = self.x[2]
            self.x += [self.v * np.cos(th) * dt, self.v * np.sin(th) * dt, wz * dt]
        self.tl = t; self.out.append((stamp, *self.x))

def live_system(bag, seconds=5.0, seed=1):
    """the robot running: 100 Hz IMU and 20 Hz odometry with header stamps; callbacks run after a random delivery delay"""
    rng = np.random.default_rng(seed); events = []
    for k in range(int(seconds * 100)):
        t = k / 100; wz = 0.4 * np.sin(0.8 * t) + rng.normal(0, 0.01)
        events.append((t + rng.exponential(2e-3), "/imu", t, cdr("dd", t, wz)))
    for k in range(int(seconds * 20)):
        t = k / 20; events.append((t + rng.exponential(2e-3), "/odom", t, cdr("dd", t, 0.5 + 0.1 * np.sin(t))))
    events.sort(key=lambda e: e[0])
    node_s, node_r = DeadReckoning(True), DeadReckoning(False)
    for recv, topic, stamp, data in events:
        bag.write(topic, "sensor_msgs/msg/Imu" if topic == "/imu" else "nav_msgs/msg/Odometry", int(round(recv * 1e9)), data)   # recorded at receive time
        for n in (node_s, node_r): dispatch(n, topic, recv, data)
    return node_s, node_r

def dispatch(node, topic, recv, data):
    stamp, val = uncdr("dd", data)
    (node.on_imu if topic == "/imu" else node.on_odom)(stamp, recv, val)

def replay(bag, use_stamps, rate=1.0, start_ns=0):
    """ros2 bag play: publish messages in recorded order; the clock advances with the bag time divided by the rate"""
    node = DeadReckoning(use_stamps); msgs = bag.read(start_ns); t0 = msgs[0][1]
    for topic, t_ns, data in msgs: dispatch(node, topic, t0 * 1e-9 + (t_ns - t0) * 1e-9 / rate, data)
    return node

def test_record_and_info():
    bag = Bag(); live_s, live_r = live_system(bag)
    for name, ty, n, a, b in bag.info(): print(f"  {name:6s} {ty:22s} {n:4d} messages, {1e-9 * (b - a):.3f} s")
    assert [r[2] for r in bag.info()] == [500, 100]
    return bag, live_s, live_r

def test_replay(bag, live_s, live_r):
    a = replay(bag, True); b = replay(bag, True, rate=2.0); c = replay(bag, False, rate=2.0)
    fin = lambda n: np.array(n.out[-1][1:])
    print("final pose live (stamps)       ", np.round(fin(live_s), 6))
    print("replay x1 (stamps)             ", np.round(fin(a), 6))
    print("replay x2 (stamps)             ", np.round(fin(b), 6))
    print("replay x2 (receive time)       ", np.round(fin(c), 6))
    assert np.array_equal(np.array(a.out), np.array(live_s.out)) and np.array_equal(np.array(b.out), np.array(live_s.out))
    assert np.abs(fin(c) - fin(live_r)).max() > 0.1                       # wall-clock time makes the result depend on playback
    mid = replay(bag, True, start_ns=int(2.5e9))                          # seek: start part-way through the bag
    print(f"seek to 2.5 s: {len(mid.out)} poses, first stamp {mid.out[0][0]:.2f} s")
    assert abs(mid.out[0][0] - 2.5) < 0.011

bag, s, r = test_record_and_info()
test_replay(bag, s, r)
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};