var e=`p18-l07`,t=35,n=`ROS 2 is a set of processes that find each other and exchange typed messages over DDS. You learn the node graph, discovery, topic name resolution and the quality-of-service rules that silently decide whether a publisher and a subscriber connect, then model a robot’s graph and list its topics and its broken connections.`,r=`<h2 id="why-ros-2">Why ROS 2</h2>
<p>A robot’s software is many programs: drivers, estimators, planners, controllers, a user interface. <strong>ROS 2</strong> (Robot Operating System 2) is not an operating system but a middleware and a set of tools that let them run as separate <strong>nodes</strong> and talk through:</p>
<ul>
<li><strong>topics</strong>: many-to-many streams of typed messages (sensor data, commands),</li>
<li><strong>services</strong>: request-response calls (lesson 08),</li>
<li><strong>actions</strong>: long-running goals with feedback and cancel (lesson 08),</li>
<li><strong>parameters</strong>: per-node configuration (lesson 13).</li>
</ul>
<h2 id="dds-underneath">DDS underneath</h2>
<p>ROS 2 uses <strong>DDS</strong> (Data Distribution Service, an OMG standard) for transport. Each process is a DDS participant. Participants <strong>discover</strong> each other by multicast on the local network (no central master, unlike ROS 1), exchange the list of their endpoints, and each publisher-subscriber pair that agrees on topic name, message type and QoS is <strong>matched</strong> and sends data directly, peer to peer. Same-machine traffic can use shared memory. The <strong>domain ID</strong> (<code>ROS_DOMAIN_ID</code>) separates independent graphs on one network.</p>
<h2 id="names">Names</h2>
<p>A node in namespace <code>/robot1</code> resolves topic names as follows: <code>scan</code> (relative) becomes <code>/robot1/scan</code>; <code>/tf</code> (absolute) stays <code>/tf</code>; <code>~/status</code> (private) becomes <code>/robot1/driver/status</code> for node <code>driver</code>. Namespaces let you run two identical robots on one network.</p>
<h2 id="quality-of-service">Quality of service</h2>
<p>Each endpoint has a <strong>QoS</strong> profile. The rule is <strong>request versus offer</strong>: the publisher must offer at least what the subscriber requests, or they do not connect, and nothing is printed by default.</p>
<ul>
<li><strong>Reliability</strong>: <code>reliable</code> (retransmit lost samples) or <code>best_effort</code>. A best-effort publisher cannot serve a reliable subscriber; the reverse is fine.</li>
<li><strong>Durability</strong>: <code>transient_local</code> keeps the last samples for late-joining subscribers (a map, a robot description); <code>volatile</code> does not. A volatile publisher cannot serve a transient-local subscriber.</li>
<li><strong>History and depth</strong>: keep the last <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> samples per subscription.</li>
<li><strong>Deadline, lifespan, liveliness</strong>: timing promises, also checked request versus offer.</li>
</ul>
<p>Sensor drivers usually publish best effort (<code>qos_profile_sensor_data</code>): a lost scan should not be retransmitted after a newer one exists.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="rosgraph" data-args="{}"></div></div><figcaption>A node graph. Change the QoS of each endpoint; edges turn red with the reason when publisher and subscriber cannot match.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative graph: an IMU driver and a lidar (in <code>/robot1</code>) publish best effort; an estimator subscribes to both and publishes odometry; a map server publishes a transient-local map; a planner, a logger and an RViz-like viewer subscribe.</p>
<ol>
<li><code>ros2 topic list -t</code> equivalent: <code>/imu/data</code>, <code>/map</code>, <code>/odom</code> and <code>/robot1/scan</code>. <code>/odom</code> shows two types, <code>geometry_msgs/msg/Pose</code> and <code>nav_msgs/msg/Odometry</code>: a bug.</li>
<li>Matched: IMU driver to estimator (best effort both sides) and map server to planner (transient local both sides).</li>
<li>Not matched: lidar to estimator (subscriber requests reliable, publisher offers best effort), estimator to planner (the planner requests a 50 ms deadline the publisher does not promise), estimator to logger (type mismatch), estimator to the viewer (it requests transient local, the publisher is volatile).</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">ros_graph.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">from</span> dataclasses <span class="hljs-keyword">import</span> dataclass, field

<span class="hljs-meta">@dataclass(<span class="hljs-params">frozen=<span class="hljs-literal">True</span></span>)</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">QoS</span>:
    reliability: <span class="hljs-built_in">str</span> = <span class="hljs-string">&quot;reliable&quot;</span>          <span class="hljs-comment"># or &quot;best_effort&quot;</span>
    durability: <span class="hljs-built_in">str</span> = <span class="hljs-string">&quot;volatile&quot;</span>           <span class="hljs-comment"># or &quot;transient_local&quot; (late joiners get the last samples)</span>
    depth: <span class="hljs-built_in">int</span> = <span class="hljs-number">10</span>                        <span class="hljs-comment"># history keep-last depth</span>
    deadline_ms: <span class="hljs-built_in">float</span> = <span class="hljs-built_in">float</span>(<span class="hljs-string">&quot;inf&quot;</span>)      <span class="hljs-comment"># maximum expected period between samples</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">compatible</span>(<span class="hljs-params">pub, sub</span>):
    <span class="hljs-string">&quot;&quot;&quot;DDS request-offered rule: what the publisher offers must be at least what the subscriber requests.
    Returns (ok, reason).&quot;&quot;&quot;</span>
    <span class="hljs-keyword">if</span> pub.reliability == <span class="hljs-string">&quot;best_effort&quot;</span> <span class="hljs-keyword">and</span> sub.reliability == <span class="hljs-string">&quot;reliable&quot;</span>:
        <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;reliability: subscriber requests reliable, publisher offers best effort&quot;</span>
    <span class="hljs-keyword">if</span> pub.durability == <span class="hljs-string">&quot;volatile&quot;</span> <span class="hljs-keyword">and</span> sub.durability == <span class="hljs-string">&quot;transient_local&quot;</span>:
        <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;durability: subscriber requests transient local, publisher offers volatile&quot;</span>
    <span class="hljs-keyword">if</span> pub.deadline_ms &gt; sub.deadline_ms:
        <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;deadline: publisher promises a longer period than the subscriber accepts&quot;</span>
    <span class="hljs-keyword">return</span> <span class="hljs-literal">True</span>, <span class="hljs-string">&quot;&quot;</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-params">name, ns=<span class="hljs-string">&quot;/&quot;</span>, node=<span class="hljs-string">&quot;&quot;</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;ROS 2 name resolution: absolute &#x27;/x&#x27;, relative &#x27;x&#x27; (prefixed by the namespace), private &#x27;~/x&#x27; (namespace/node/x)&quot;&quot;&quot;</span>
    ns = <span class="hljs-string">&quot;/&quot;</span> + ns.strip(<span class="hljs-string">&quot;/&quot;</span>) <span class="hljs-keyword">if</span> ns.strip(<span class="hljs-string">&quot;/&quot;</span>) <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;&quot;</span>
    <span class="hljs-keyword">if</span> name.startswith(<span class="hljs-string">&quot;/&quot;</span>): <span class="hljs-keyword">return</span> name
    <span class="hljs-keyword">if</span> name.startswith(<span class="hljs-string">&quot;~/&quot;</span>): <span class="hljs-keyword">return</span> <span class="hljs-string">f&quot;<span class="hljs-subst">{ns}</span>/<span class="hljs-subst">{node}</span>/<span class="hljs-subst">{name[<span class="hljs-number">2</span>:]}</span>&quot;</span>
    <span class="hljs-keyword">return</span> <span class="hljs-string">f&quot;<span class="hljs-subst">{ns}</span>/<span class="hljs-subst">{name}</span>&quot;</span>

<span class="hljs-meta">@dataclass</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Node</span>:
    name: <span class="hljs-built_in">str</span>
    ns: <span class="hljs-built_in">str</span> = <span class="hljs-string">&quot;/&quot;</span>
    pubs: <span class="hljs-built_in">list</span> = field(default_factory=<span class="hljs-built_in">list</span>)   <span class="hljs-comment"># (topic, type, QoS)</span>
    subs: <span class="hljs-built_in">list</span> = field(default_factory=<span class="hljs-built_in">list</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Graph</span>:
    <span class="hljs-string">&quot;&quot;&quot;what DDS discovery gives every participant: all endpoints, so each side can match by topic, type and QoS&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, nodes</span>): <span class="hljs-variable language_">self</span>.nodes = nodes
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">endpoints</span>(<span class="hljs-params">self, kind</span>):
        <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.nodes:
            <span class="hljs-keyword">for</span> t, ty, q <span class="hljs-keyword">in</span> <span class="hljs-built_in">getattr</span>(n, kind): <span class="hljs-keyword">yield</span> n, resolve(t, n.ns, n.name), ty, q
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">topic_list</span>(<span class="hljs-params">self</span>):
        out = {}
        <span class="hljs-keyword">for</span> kind <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;pubs&quot;</span>, <span class="hljs-string">&quot;subs&quot;</span>):
            <span class="hljs-keyword">for</span> _, t, ty, _ <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.endpoints(kind): out.setdefault(t, <span class="hljs-built_in">set</span>()).add(ty)
        <span class="hljs-keyword">return</span> {t: <span class="hljs-built_in">sorted</span>(v) <span class="hljs-keyword">for</span> t, v <span class="hljs-keyword">in</span> <span class="hljs-built_in">sorted</span>(out.items())}           <span class="hljs-comment"># one topic can carry several types: a bug to spot</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">matches</span>(<span class="hljs-params">self</span>):
        ok, bad = [], []
        <span class="hljs-keyword">for</span> pn, pt, pty, pq <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.endpoints(<span class="hljs-string">&quot;pubs&quot;</span>):
            <span class="hljs-keyword">for</span> sn, st, sty, sq <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.endpoints(<span class="hljs-string">&quot;subs&quot;</span>):
                <span class="hljs-keyword">if</span> pt != st: <span class="hljs-keyword">continue</span>
                <span class="hljs-keyword">if</span> pty != sty: bad.append((pn.name, sn.name, pt, <span class="hljs-string">&quot;type mismatch&quot;</span>)); <span class="hljs-keyword">continue</span>
                c, why = compatible(pq, sq)
                (ok <span class="hljs-keyword">if</span> c <span class="hljs-keyword">else</span> bad).append((pn.name, sn.name, pt) + (() <span class="hljs-keyword">if</span> c <span class="hljs-keyword">else</span> (why,)))
        <span class="hljs-keyword">return</span> ok, bad

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_names</span>():
    r = [resolve(<span class="hljs-string">&quot;scan&quot;</span>, <span class="hljs-string">&quot;/robot1&quot;</span>), resolve(<span class="hljs-string">&quot;/tf&quot;</span>, <span class="hljs-string">&quot;/robot1&quot;</span>), resolve(<span class="hljs-string">&quot;~/status&quot;</span>, <span class="hljs-string">&quot;/robot1&quot;</span>, <span class="hljs-string">&quot;driver&quot;</span>), resolve(<span class="hljs-string">&quot;imu&quot;</span>)]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;resolved names:&quot;</span>, r)
    <span class="hljs-keyword">assert</span> r == [<span class="hljs-string">&quot;/robot1/scan&quot;</span>, <span class="hljs-string">&quot;/tf&quot;</span>, <span class="hljs-string">&quot;/robot1/driver/status&quot;</span>, <span class="hljs-string">&quot;/imu&quot;</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_graph</span>():
    sensor = QoS(<span class="hljs-string">&quot;best_effort&quot;</span>, depth=<span class="hljs-number">5</span>)                                     <span class="hljs-comment"># like rclpy&#x27;s qos_profile_sensor_data</span>
    latched = QoS(durability=<span class="hljs-string">&quot;transient_local&quot;</span>, depth=<span class="hljs-number">1</span>)
    g = Graph([
        Node(<span class="hljs-string">&quot;imu_driver&quot;</span>, pubs=[(<span class="hljs-string">&quot;imu/data&quot;</span>, <span class="hljs-string">&quot;sensor_msgs/msg/Imu&quot;</span>, sensor)]),
        Node(<span class="hljs-string">&quot;lidar&quot;</span>, <span class="hljs-string">&quot;/robot1&quot;</span>, pubs=[(<span class="hljs-string">&quot;scan&quot;</span>, <span class="hljs-string">&quot;sensor_msgs/msg/LaserScan&quot;</span>, sensor)]),
        Node(<span class="hljs-string">&quot;estimator&quot;</span>, subs=[(<span class="hljs-string">&quot;imu/data&quot;</span>, <span class="hljs-string">&quot;sensor_msgs/msg/Imu&quot;</span>, QoS(<span class="hljs-string">&quot;best_effort&quot;</span>)), (<span class="hljs-string">&quot;/robot1/scan&quot;</span>, <span class="hljs-string">&quot;sensor_msgs/msg/LaserScan&quot;</span>, QoS())],
             pubs=[(<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;nav_msgs/msg/Odometry&quot;</span>, QoS())]),
        Node(<span class="hljs-string">&quot;map_server&quot;</span>, pubs=[(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;nav_msgs/msg/OccupancyGrid&quot;</span>, latched)]),
        Node(<span class="hljs-string">&quot;planner&quot;</span>, subs=[(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;nav_msgs/msg/OccupancyGrid&quot;</span>, latched), (<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;nav_msgs/msg/Odometry&quot;</span>, QoS(deadline_ms=<span class="hljs-number">50</span>))]),
        Node(<span class="hljs-string">&quot;logger&quot;</span>, subs=[(<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;geometry_msgs/msg/Pose&quot;</span>, QoS())]),
        Node(<span class="hljs-string">&quot;rviz&quot;</span>, subs=[(<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;nav_msgs/msg/Odometry&quot;</span>, QoS(durability=<span class="hljs-string">&quot;transient_local&quot;</span>))]),
    ])
    topics = g.topic_list(); ok, bad = g.matches()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;ros2 topic list -t:&quot;</span>); [<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{t}</span> [<span class="hljs-subst">{<span class="hljs-string">&#x27;, &#x27;</span>.join(ty)}</span>]&quot;</span>) <span class="hljs-keyword">for</span> t, ty <span class="hljs-keyword">in</span> topics.items()]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;matched:&quot;</span>, [<span class="hljs-string">f&quot;<span class="hljs-subst">{p}</span> -&gt; <span class="hljs-subst">{s}</span> on <span class="hljs-subst">{t}</span>&quot;</span> <span class="hljs-keyword">for</span> p, s, t <span class="hljs-keyword">in</span> ok])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;not matched:&quot;</span>); [<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{p}</span> -&gt; <span class="hljs-subst">{s}</span> on <span class="hljs-subst">{t}</span>: <span class="hljs-subst">{why}</span>&quot;</span>) <span class="hljs-keyword">for</span> p, s, t, why <span class="hljs-keyword">in</span> bad]
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">list</span>(topics) == [<span class="hljs-string">&quot;/imu/data&quot;</span>, <span class="hljs-string">&quot;/map&quot;</span>, <span class="hljs-string">&quot;/odom&quot;</span>, <span class="hljs-string">&quot;/robot1/scan&quot;</span>] <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(topics[<span class="hljs-string">&quot;/odom&quot;</span>]) == <span class="hljs-number">2</span>
    <span class="hljs-keyword">assert</span> (<span class="hljs-string">&quot;imu_driver&quot;</span>, <span class="hljs-string">&quot;estimator&quot;</span>, <span class="hljs-string">&quot;/imu/data&quot;</span>) <span class="hljs-keyword">in</span> ok <span class="hljs-keyword">and</span> (<span class="hljs-string">&quot;map_server&quot;</span>, <span class="hljs-string">&quot;planner&quot;</span>, <span class="hljs-string">&quot;/map&quot;</span>) <span class="hljs-keyword">in</span> ok
    <span class="hljs-keyword">assert</span> {why.split(<span class="hljs-string">&quot;:&quot;</span>)[<span class="hljs-number">0</span>] <span class="hljs-keyword">for</span> *_, why <span class="hljs-keyword">in</span> bad} == {<span class="hljs-string">&quot;reliability&quot;</span>, <span class="hljs-string">&quot;durability&quot;</span>, <span class="hljs-string">&quot;deadline&quot;</span>, <span class="hljs-string">&quot;type mismatch&quot;</span>}

test_names()
test_graph()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p><code>ros2 node list</code>, <code>ros2 topic list -t</code>, <code>ros2 topic info -v /scan</code> (which prints each endpoint’s QoS) and <code>rqt_graph</code> show the real graph. <code>ros2 doctor</code> flags common problems, and a QoS mismatch raises an “incompatible QoS” event you can log. The DDS vendor is chosen with <code>RMW_IMPLEMENTATION</code> (Fast DDS, Cyclone DDS, Connext), and Zenoh is an alternative middleware from Jazzy on.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>RViz shows nothing on <code>/scan</code>, but <code>ros2 topic hz /scan</code> prints 10 Hz. What is the likely cause?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A QoS mismatch: the driver publishes best effort and the RViz display requests reliable. <code>ros2 topic info -v /scan</code> shows both profiles; set the display’s reliability to best effort.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Two identical robots on one Wi-Fi network see each other’s <code>/cmd_vel</code>. Give two fixes.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Put each robot’s nodes in its own namespace (<code>/robot1</code>, <code>/robot2</code>) so names differ, or give each a different <code>ROS_DOMAIN_ID</code> so their DDS participants never discover each other.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l07"></div>
`,i=[{id:`why-ros-2`,title:`Why ROS 2`},{id:`dds-underneath`,title:`DDS underneath`},{id:`names`,title:`Names`},{id:`quality-of-service`,title:`Quality of service`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l07-q1`,type:`num`,q:`<p>Topics in the example’s topic list?</p>
`,explain:`<p>/imu/data, /map, /odom and /robot1/scan.</p>
`,answer:4,tol:.001,unit:``},{id:`p18-l07-q2`,type:`num`,q:`<p>Connections that failed to match in the example?</p>
`,explain:`<p>Reliability, deadline, type and durability.</p>
`,answer:4,tol:.001,unit:``},{id:`p18-l07-q3`,type:`num`,q:`<p>Default ROS_DOMAIN_ID?</p>
`,explain:`<p>Unset means domain 0.</p>
`,answer:0,tol:.001,unit:``},{id:`p18-l07-q4`,type:`num`,q:`<p>Samples a keep-last subscription of depth 10 can buffer?</p>
`,explain:`<p>The history depth.</p>
`,answer:10,tol:.001,unit:``},{id:`p18-l07-q5`,type:`mc`,q:`<p>A best-effort subscriber and a reliable publisher…</p>
`,explain:`<p>The publisher offers more than requested.</p>
`,options:[`match only on the same machine`,`match after a timeout`,`do not match`,`match, and the link behaves as best effort`],answer:3},{id:`p18-l07-q6`,type:`mc`,q:`<p>In namespace /arm, node gripper resolves ~/state to…</p>
`,explain:`<p>Private names include the node name.</p>
`,options:[`/arm/state`,`/arm/gripper/state`,`/gripper/state`,`/state`],answer:1}],o=[{file:`ros_graph.py`,lang:`python`,src:`from dataclasses import dataclass, field

@dataclass(frozen=True)
class QoS:
    reliability: str = "reliable"          # or "best_effort"
    durability: str = "volatile"           # or "transient_local" (late joiners get the last samples)
    depth: int = 10                        # history keep-last depth
    deadline_ms: float = float("inf")      # maximum expected period between samples

def compatible(pub, sub):
    """DDS request-offered rule: what the publisher offers must be at least what the subscriber requests.
    Returns (ok, reason)."""
    if pub.reliability == "best_effort" and sub.reliability == "reliable":
        return False, "reliability: subscriber requests reliable, publisher offers best effort"
    if pub.durability == "volatile" and sub.durability == "transient_local":
        return False, "durability: subscriber requests transient local, publisher offers volatile"
    if pub.deadline_ms > sub.deadline_ms:
        return False, "deadline: publisher promises a longer period than the subscriber accepts"
    return True, ""

def resolve(name, ns="/", node=""):
    """ROS 2 name resolution: absolute '/x', relative 'x' (prefixed by the namespace), private '~/x' (namespace/node/x)"""
    ns = "/" + ns.strip("/") if ns.strip("/") else ""
    if name.startswith("/"): return name
    if name.startswith("~/"): return f"{ns}/{node}/{name[2:]}"
    return f"{ns}/{name}"

@dataclass
class Node:
    name: str
    ns: str = "/"
    pubs: list = field(default_factory=list)   # (topic, type, QoS)
    subs: list = field(default_factory=list)

class Graph:
    """what DDS discovery gives every participant: all endpoints, so each side can match by topic, type and QoS"""
    def __init__(self, nodes): self.nodes = nodes
    def endpoints(self, kind):
        for n in self.nodes:
            for t, ty, q in getattr(n, kind): yield n, resolve(t, n.ns, n.name), ty, q
    def topic_list(self):
        out = {}
        for kind in ("pubs", "subs"):
            for _, t, ty, _ in self.endpoints(kind): out.setdefault(t, set()).add(ty)
        return {t: sorted(v) for t, v in sorted(out.items())}           # one topic can carry several types: a bug to spot
    def matches(self):
        ok, bad = [], []
        for pn, pt, pty, pq in self.endpoints("pubs"):
            for sn, st, sty, sq in self.endpoints("subs"):
                if pt != st: continue
                if pty != sty: bad.append((pn.name, sn.name, pt, "type mismatch")); continue
                c, why = compatible(pq, sq)
                (ok if c else bad).append((pn.name, sn.name, pt) + (() if c else (why,)))
        return ok, bad

def test_names():
    r = [resolve("scan", "/robot1"), resolve("/tf", "/robot1"), resolve("~/status", "/robot1", "driver"), resolve("imu")]
    print("resolved names:", r)
    assert r == ["/robot1/scan", "/tf", "/robot1/driver/status", "/imu"]

def test_graph():
    sensor = QoS("best_effort", depth=5)                                     # like rclpy's qos_profile_sensor_data
    latched = QoS(durability="transient_local", depth=1)
    g = Graph([
        Node("imu_driver", pubs=[("imu/data", "sensor_msgs/msg/Imu", sensor)]),
        Node("lidar", "/robot1", pubs=[("scan", "sensor_msgs/msg/LaserScan", sensor)]),
        Node("estimator", subs=[("imu/data", "sensor_msgs/msg/Imu", QoS("best_effort")), ("/robot1/scan", "sensor_msgs/msg/LaserScan", QoS())],
             pubs=[("odom", "nav_msgs/msg/Odometry", QoS())]),
        Node("map_server", pubs=[("map", "nav_msgs/msg/OccupancyGrid", latched)]),
        Node("planner", subs=[("map", "nav_msgs/msg/OccupancyGrid", latched), ("odom", "nav_msgs/msg/Odometry", QoS(deadline_ms=50))]),
        Node("logger", subs=[("odom", "geometry_msgs/msg/Pose", QoS())]),
        Node("rviz", subs=[("odom", "nav_msgs/msg/Odometry", QoS(durability="transient_local"))]),
    ])
    topics = g.topic_list(); ok, bad = g.matches()
    print("ros2 topic list -t:"); [print(f"  {t} [{', '.join(ty)}]") for t, ty in topics.items()]
    print("matched:", [f"{p} -> {s} on {t}" for p, s, t in ok])
    print("not matched:"); [print(f"  {p} -> {s} on {t}: {why}") for p, s, t, why in bad]
    assert list(topics) == ["/imu/data", "/map", "/odom", "/robot1/scan"] and len(topics["/odom"]) == 2
    assert ("imu_driver", "estimator", "/imu/data") in ok and ("map_server", "planner", "/map") in ok
    assert {why.split(":")[0] for *_, why in bad} == {"reliability", "durability", "deadline", "type mismatch"}

test_names()
test_graph()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};