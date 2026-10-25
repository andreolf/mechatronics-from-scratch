var e=`p18-l11`,t=40,n=`Every sensor and link of a robot has its own frame, and tf2 answers where one frame is relative to another at any recent time. You build a transform buffer with a frame tree, time-stamped history, lerp and slerp interpolation and extrapolation errors, and check its lookups against geometry worked out by hand.`,r=`<h2 id="frames-everywhere">Frames everywhere</h2>
<p>A laser reports points in <code>laser</code>, a camera in <code>camera_optical</code>, wheel odometry gives <code>base_link</code> in <code>odom</code>, and localisation gives <code>odom</code> in <code>map</code>. To put a laser point on the map you chain transforms (Phase 15): <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0836em;vertical-align:-0.3013em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7823em;"><span style="top:-2.3987em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">a</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">ser</span></span></span></span><span style="top:-3.1809em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">p</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3013em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1504em;vertical-align:-0.3013em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7823em;"><span style="top:-2.3987em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">d</span><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">m</span></span></span></span><span style="top:-3.1809em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">p</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3013em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-2.4169em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ba</span><span class="mord mathnormal mtight">se</span></span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">d</span><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">m</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2831em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-2.4169em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">a</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">ser</span></span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ba</span><span class="mord mathnormal mtight">se</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2831em;"><span></span></span></span></span></span></span></span></span></span>. <strong>tf2</strong> keeps all of them and does the chaining for you.</p>
<h2 id="the-frame-tree">The frame tree</h2>
<p>The transforms form a <strong>tree</strong>: every frame has exactly one parent, so there is one path between any two frames, up from the source to the common ancestor and down to the target. Standard names (REP 105) are <code>map</code> → <code>odom</code> → <code>base_link</code> → sensor frames. <code>map</code> → <code>odom</code> jumps when localisation corrects itself, and <code>odom</code> → <code>base_link</code> is smooth but drifts.</p>
<p>Two kinds of transform:</p>
<ul>
<li><strong>Static</strong> (<code>/tf_static</code>): fixed mounting, published once with transient-local durability (lesson 07), valid at all times.</li>
<li><strong>Dynamic</strong> (<code>/tf</code>): published repeatedly with stamps, kept in a time-sorted buffer (10 s by default).</li>
</ul>
<h2 id="time-and-interpolation">Time and interpolation</h2>
<p>A laser scan stamped 1.05 s must be transformed with the robot’s pose at 1.05 s, not the latest. The buffer <strong>interpolates</strong> between the two neighbouring samples: linear for translation, <strong>slerp</strong> (spherical linear interpolation, Phase 01) for the rotation quaternion. A request outside the stored interval raises an <strong>extrapolation error</strong> rather than guessing; requesting time zero means “latest available”.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="tftree" data-args="{}"></div></div><figcaption>A robot’s frame tree. Drag the time slider through the odometry history and pick source and target frames; the readout shows the looked-up transform and its path through the tree.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative tree: <code>map</code> → <code>odom</code> (fixed at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.5</span></span></span></span>, yaw 0.1 rad), <code>odom</code> → <code>base_link</code> (an arc <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6679em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">t</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mop">cos</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">t</span></span></span></span>, yaw <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span>, at 10 Hz for 2 s), and static <code>laser</code>, <code>camera_link</code> and <code>camera_optical</code> frames on the base.</p>
<ol>
<li>A laser return 2 m ahead at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> s, looked up into <code>map</code>, lands at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2.7893</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3.0021</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0.15</span><span class="mclose">)</span></span></span></span>, exactly where the geometry puts it: the base pose rotated by 0.1 rad plus 2.2 m along the heading 1.1 rad (the laser sits 0.2 m ahead).</li>
<li>Camera to laser and back gives the identity.</li>
<li>At <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.05</span></span></span></span> s, between two samples, slerp gives yaw exactly 1.05000 and lerp gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.86634</span></span></span></span> against the true 0.86742: a 1 mm chord error.</li>
<li>A lookup at 2.5 s fails: requested time outside <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">0.00</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">2.00</span><span class="mclose">]</span></span></span></span>.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">tf_buffer.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">qmul</span>(<span class="hljs-params">a, b</span>):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b                  <span class="hljs-comment"># quaternions as (x, y, z, w), the ROS order</span>
    <span class="hljs-keyword">return</span> np.array([w1*x2 + x1*w2 + y1*z2 - z1*y2, w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2, w1*w2 - x1*x2 - y1*y2 - z1*z2])
<span class="hljs-keyword">def</span> <span class="hljs-title function_">qconj</span>(<span class="hljs-params">q</span>): <span class="hljs-keyword">return</span> np.array([-q[<span class="hljs-number">0</span>], -q[<span class="hljs-number">1</span>], -q[<span class="hljs-number">2</span>], q[<span class="hljs-number">3</span>]])
<span class="hljs-keyword">def</span> <span class="hljs-title function_">qrot</span>(<span class="hljs-params">q, v</span>): <span class="hljs-keyword">return</span> qmul(qmul(q, np.r_[v, <span class="hljs-number">0.0</span>]), qconj(q))[:<span class="hljs-number">3</span>]
<span class="hljs-keyword">def</span> <span class="hljs-title function_">qyaw</span>(<span class="hljs-params">yaw</span>): <span class="hljs-keyword">return</span> np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, np.sin(yaw / <span class="hljs-number">2</span>), np.cos(yaw / <span class="hljs-number">2</span>)])
<span class="hljs-keyword">def</span> <span class="hljs-title function_">qrpy</span>(<span class="hljs-params">r, p, y</span>):
    qx = np.array([np.sin(r / <span class="hljs-number">2</span>), <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, np.cos(r / <span class="hljs-number">2</span>)]); qy = np.array([<span class="hljs-number">0</span>, np.sin(p / <span class="hljs-number">2</span>), <span class="hljs-number">0</span>, np.cos(p / <span class="hljs-number">2</span>)])
    <span class="hljs-keyword">return</span> qmul(qyaw(y), qmul(qy, qx))
<span class="hljs-keyword">def</span> <span class="hljs-title function_">slerp</span>(<span class="hljs-params">a, b, s</span>):
    d = np.dot(a, b)
    <span class="hljs-keyword">if</span> d &lt; <span class="hljs-number">0</span>: b, d = -b, -d                                 <span class="hljs-comment"># take the short way round</span>
    <span class="hljs-keyword">if</span> d &gt; <span class="hljs-number">0.9995</span>: q = a + s * (b - a); <span class="hljs-keyword">return</span> q / np.linalg.norm(q)
    th = np.arccos(d); <span class="hljs-keyword">return</span> (np.sin((<span class="hljs-number">1</span> - s) * th) * a + np.sin(s * th) * b) / np.sin(th)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">TF</span>:
    <span class="hljs-string">&quot;&quot;&quot;a transform (t, q) maps points in the child frame to the parent frame: p_parent = q p_child q* + t&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, t, q</span>): <span class="hljs-variable language_">self</span>.t, <span class="hljs-variable language_">self</span>.q = np.asarray(t, <span class="hljs-built_in">float</span>), np.asarray(q, <span class="hljs-built_in">float</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__mul__</span>(<span class="hljs-params">self, o</span>): <span class="hljs-keyword">return</span> TF(<span class="hljs-variable language_">self</span>.t + qrot(<span class="hljs-variable language_">self</span>.q, o.t), qmul(<span class="hljs-variable language_">self</span>.q, o.q))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">inv</span>(<span class="hljs-params">self</span>): qi = qconj(<span class="hljs-variable language_">self</span>.q); <span class="hljs-keyword">return</span> TF(-qrot(qi, <span class="hljs-variable language_">self</span>.t), qi)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">apply</span>(<span class="hljs-params">self, p</span>): <span class="hljs-keyword">return</span> qrot(<span class="hljs-variable language_">self</span>.q, p) + <span class="hljs-variable language_">self</span>.t

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ExtrapolationError</span>(<span class="hljs-title class_ inherited__">Exception</span>): <span class="hljs-keyword">pass</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Buffer</span>:
    <span class="hljs-string">&quot;&quot;&quot;tf2&#x27;s core: each child frame has one parent and a time-sorted history of transforms; static edges have no history&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, cache=<span class="hljs-number">10.0</span></span>): <span class="hljs-variable language_">self</span>.parent, <span class="hljs-variable language_">self</span>.hist, <span class="hljs-variable language_">self</span>.static, <span class="hljs-variable language_">self</span>.cache = {}, {}, {}, cache
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">set_static</span>(<span class="hljs-params">self, parent, child, tf</span>): <span class="hljs-variable language_">self</span>.parent[child] = parent; <span class="hljs-variable language_">self</span>.static[child] = tf
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">set</span>(<span class="hljs-params">self, parent, child, stamp, tf</span>):
        <span class="hljs-variable language_">self</span>.parent[child] = parent; h = <span class="hljs-variable language_">self</span>.hist.setdefault(child, []); h.append((stamp, tf)); h.sort(key=<span class="hljs-keyword">lambda</span> e: e[<span class="hljs-number">0</span>])
        <span class="hljs-keyword">while</span> h[-<span class="hljs-number">1</span>][<span class="hljs-number">0</span>] - h[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] &gt; <span class="hljs-variable language_">self</span>.cache: h.pop(<span class="hljs-number">0</span>)         <span class="hljs-comment"># drop history older than the cache length</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">edge</span>(<span class="hljs-params">self, child, t</span>):
        <span class="hljs-keyword">if</span> child <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.static: <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.static[child]
        h = <span class="hljs-variable language_">self</span>.hist[child]
        <span class="hljs-keyword">if</span> t <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-keyword">return</span> h[-<span class="hljs-number">1</span>][<span class="hljs-number">1</span>]                          <span class="hljs-comment"># time 0 in tf2: the latest available</span>
        <span class="hljs-keyword">if</span> t &lt; h[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] <span class="hljs-keyword">or</span> t &gt; h[-<span class="hljs-number">1</span>][<span class="hljs-number">0</span>]:
            <span class="hljs-keyword">raise</span> ExtrapolationError(<span class="hljs-string">f&quot;<span class="hljs-subst">{child}</span>: requested <span class="hljs-subst">{t:<span class="hljs-number">.2</span>f}</span> s outside [<span class="hljs-subst">{h[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span>, <span class="hljs-subst">{h[-<span class="hljs-number">1</span>][<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span>]&quot;</span>)
        <span class="hljs-keyword">for</span> (t0, a), (t1, b) <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(h, h[<span class="hljs-number">1</span>:]):
            <span class="hljs-keyword">if</span> t0 &lt;= t &lt;= t1:
                s = <span class="hljs-number">0</span> <span class="hljs-keyword">if</span> t1 == t0 <span class="hljs-keyword">else</span> (t - t0) / (t1 - t0)
                <span class="hljs-keyword">return</span> TF(a.t + s * (b.t - a.t), slerp(a.q, b.q, s))   <span class="hljs-comment"># lerp the translation, slerp the rotation</span>
        <span class="hljs-keyword">return</span> h[-<span class="hljs-number">1</span>][<span class="hljs-number">1</span>]
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">chain</span>(<span class="hljs-params">self, f</span>):
        out = [f]
        <span class="hljs-keyword">while</span> out[-<span class="hljs-number">1</span>] <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.parent: out.append(<span class="hljs-variable language_">self</span>.parent[out[-<span class="hljs-number">1</span>]])
        <span class="hljs-keyword">return</span> out
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">lookup</span>(<span class="hljs-params">self, target, source, t=<span class="hljs-literal">None</span></span>):
        <span class="hljs-string">&quot;&quot;&quot;transform that maps points in \`source\` to \`target\`, at time t, through the common ancestor&quot;&quot;&quot;</span>
        up_s, up_t = <span class="hljs-variable language_">self</span>.chain(source), <span class="hljs-variable language_">self</span>.chain(target)
        root = <span class="hljs-built_in">next</span>(f <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> up_s <span class="hljs-keyword">if</span> f <span class="hljs-keyword">in</span> up_t)
        <span class="hljs-keyword">def</span> <span class="hljs-title function_">to_root</span>(<span class="hljs-params">path</span>):
            T = TF([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>])
            <span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> path[:path.index(root)]: T = <span class="hljs-variable language_">self</span>.edge(f, t) * T
            <span class="hljs-keyword">return</span> T
        <span class="hljs-keyword">return</span> to_root(up_t).inv() * to_root(up_s)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">tree</span>(<span class="hljs-params">self, f=<span class="hljs-string">&quot;map&quot;</span>, depth=<span class="hljs-number">0</span></span>):
        lines = [(<span class="hljs-string">&quot;  &quot;</span> * depth) + f + (<span class="hljs-string">&quot; (static)&quot;</span> <span class="hljs-keyword">if</span> f <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.static <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;&quot;</span>)]
        <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> <span class="hljs-built_in">sorted</span>(k <span class="hljs-keyword">for</span> k, p <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.parent.items() <span class="hljs-keyword">if</span> p == f): lines += <span class="hljs-variable language_">self</span>.tree(c, depth + <span class="hljs-number">1</span>)
        <span class="hljs-keyword">return</span> lines

<span class="hljs-keyword">def</span> <span class="hljs-title function_">build</span>():
    b = Buffer()
    b.set_static(<span class="hljs-string">&quot;base_link&quot;</span>, <span class="hljs-string">&quot;laser&quot;</span>, TF([<span class="hljs-number">0.20</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.15</span>], qyaw(<span class="hljs-number">0</span>)))
    b.set_static(<span class="hljs-string">&quot;base_link&quot;</span>, <span class="hljs-string">&quot;camera_link&quot;</span>, TF([<span class="hljs-number">0.10</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.30</span>], qrpy(<span class="hljs-number">0</span>, <span class="hljs-number">0.2</span>, <span class="hljs-number">0</span>)))
    b.set_static(<span class="hljs-string">&quot;camera_link&quot;</span>, <span class="hljs-string">&quot;camera_optical&quot;</span>, TF([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>], qrpy(-np.pi / <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, -np.pi / <span class="hljs-number">2</span>)))
    b.<span class="hljs-built_in">set</span>(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-number">0.0</span>, TF([<span class="hljs-number">1.0</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">0</span>], qyaw(<span class="hljs-number">0.1</span>)))
    b.<span class="hljs-built_in">set</span>(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-number">2.0</span>, TF([<span class="hljs-number">1.0</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">0</span>], qyaw(<span class="hljs-number">0.1</span>)))
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">21</span>):                                        <span class="hljs-comment"># the robot drives an arc: odometry at 10 Hz for 2 s</span>
        t = <span class="hljs-number">0.1</span> * k; b.<span class="hljs-built_in">set</span>(<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;base_link&quot;</span>, t, TF([np.sin(t), <span class="hljs-number">1</span> - np.cos(t), <span class="hljs-number">0</span>], qyaw(t)))
    <span class="hljs-keyword">return</span> b

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_tree_and_lookups</span>():
    b = build()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;\\n&quot;</span>.join(b.tree()))
    p = b.lookup(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;laser&quot;</span>, <span class="hljs-number">1.0</span>).apply([<span class="hljs-number">2.0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>])      <span class="hljs-comment"># a laser return 2 m ahead, at t = 1 s</span>
    yaw = <span class="hljs-number">0.1</span> + <span class="hljs-number">1.0</span>; base = np.array([<span class="hljs-number">1.0</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">0</span>]) + qrot(qyaw(<span class="hljs-number">0.1</span>), [np.sin(<span class="hljs-number">1</span>), <span class="hljs-number">1</span> - np.cos(<span class="hljs-number">1</span>), <span class="hljs-number">0</span>])
    expect = base + np.array([np.cos(yaw), np.sin(yaw), <span class="hljs-number">0</span>]) * <span class="hljs-number">2.2</span> + [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.15</span>]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;laser point in map at t = 1.0 s:&quot;</span>, np.<span class="hljs-built_in">round</span>(p, <span class="hljs-number">4</span>), <span class="hljs-string">&quot;expected&quot;</span>, np.<span class="hljs-built_in">round</span>(expect, <span class="hljs-number">4</span>))
    <span class="hljs-keyword">assert</span> np.allclose(p, expect, atol=<span class="hljs-number">1e-9</span>)
    T = b.lookup(<span class="hljs-string">&quot;laser&quot;</span>, <span class="hljs-string">&quot;camera_optical&quot;</span>, <span class="hljs-number">0.5</span>) * b.lookup(<span class="hljs-string">&quot;camera_optical&quot;</span>, <span class="hljs-string">&quot;laser&quot;</span>, <span class="hljs-number">0.5</span>)
    <span class="hljs-keyword">assert</span> np.allclose(T.t, <span class="hljs-number">0</span>) <span class="hljs-keyword">and</span> np.isclose(<span class="hljs-built_in">abs</span>(T.q[<span class="hljs-number">3</span>]), <span class="hljs-number">1</span>)                  <span class="hljs-comment"># a round trip is the identity</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_interpolation_and_extrapolation</span>():
    b = build(); T = b.lookup(<span class="hljs-string">&quot;odom&quot;</span>, <span class="hljs-string">&quot;base_link&quot;</span>, <span class="hljs-number">1.05</span>)
    yaw = <span class="hljs-number">2</span> * np.arctan2(T.q[<span class="hljs-number">2</span>], T.q[<span class="hljs-number">3</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;between samples at t = 1.05 s: x <span class="hljs-subst">{T.t[<span class="hljs-number">0</span>]:<span class="hljs-number">.5</span>f}</span> (true <span class="hljs-subst">{np.sin(<span class="hljs-number">1.05</span>):<span class="hljs-number">.5</span>f}</span>), yaw <span class="hljs-subst">{yaw:<span class="hljs-number">.5</span>f}</span> (true 1.05000)&quot;</span>)
    <span class="hljs-keyword">assert</span> np.isclose(yaw, <span class="hljs-number">1.05</span>) <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(T.t[<span class="hljs-number">0</span>] - np.sin(<span class="hljs-number">1.05</span>)) &lt; <span class="hljs-number">2e-3</span>       <span class="hljs-comment"># slerp exact for the yaw; lerp cuts the arc by about 1 mm</span>
    <span class="hljs-keyword">try</span>: b.lookup(<span class="hljs-string">&quot;map&quot;</span>, <span class="hljs-string">&quot;base_link&quot;</span>, <span class="hljs-number">2.5</span>); <span class="hljs-keyword">assert</span> <span class="hljs-literal">False</span>
    <span class="hljs-keyword">except</span> ExtrapolationError <span class="hljs-keyword">as</span> e: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;lookup at 2.5 s:&quot;</span>, e)

test_tree_and_lookups()
test_interpolation_and_extrapolation()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In ROS 2, <code>tf2_ros.Buffer</code> with a <code>TransformListener</code> fills the buffer, <code>buffer.lookup_transform('map', 'laser', stamp, timeout)</code> does the lookup, and <code>StaticTransformBroadcaster</code> publishes fixed frames. <code>ros2 run tf2_tools view_frames</code> draws the tree, and <code>ros2 run tf2_ros tf2_echo map laser</code> prints a live lookup.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>The localisation node publishes <code>map</code> → <code>base_link</code> while odometry publishes <code>odom</code> → <code>base_link</code>. What breaks?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><code>base_link</code> has two parents, so the frames no longer form a tree and lookups flip between them. Localisation should publish <code>map</code> → <code>odom</code>, computed so that the chain matches its estimate.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A laser scan stamped 0.02 s in the future of the newest odometry fails to transform. Give two fixes.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Wait for the transform (pass a timeout so the lookup blocks until odometry catches up, or use a <code>tf2_ros.MessageFilter</code>), or fix the clock or stamps if the sensor’s stamp is wrong. Do not quietly use the latest transform for a moving robot.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l11"></div>
`,i=[{id:`frames-everywhere`,title:`Frames everywhere`},{id:`the-frame-tree`,title:`The frame tree`},{id:`time-and-interpolation`,title:`Time and interpolation`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l11-q1`,type:`num`,q:`<p>Edges on the path from laser to camera_optical in the example tree?</p>
`,explain:`<p>laser to base_link, base_link to camera_link, camera_link to camera_optical.</p>
`,answer:3,tol:.001,unit:``},{id:`p18-l11-q2`,type:`num`,q:`<p>Interpolation fraction for a lookup at 1.05 s between samples at 1.0 and 1.1 s?</p>
`,explain:`<p>Halfway.</p>
`,answer:.5,tol:.001,unit:``},{id:`p18-l11-q3`,type:`num`,q:`<p>Default tf2 buffer length in seconds?</p>
`,explain:`<p>The cache time.</p>
`,answer:10,tol:.001,unit:``},{id:`p18-l11-q4`,type:`num`,q:`<p>Odometry samples kept in 10 s at 50 Hz?</p>
`,explain:`<p>Rate times cache time.</p>
`,answer:500,tol:.001,unit:``},{id:`p18-l11-q5`,type:`mc`,q:`<p>The rotation part of an interpolated transform uses…</p>
`,explain:`<p>Spherical linear interpolation.</p>
`,options:[`the latest sample`,`the nearest sample`,`slerp of the quaternions`,`linear interpolation of Euler angles`],answer:2},{id:`p18-l11-q6`,type:`mc`,q:`<p>Which transform should localisation publish according to REP 105?</p>
`,explain:`<p>Odometry owns odom to base_link.</p>
`,options:[`map to odom`,`map to base_link`,`base_link to laser`,`odom to base_link`],answer:0}],o=[{file:`tf_buffer.py`,lang:`python`,src:`import numpy as np

def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b                  # quaternions as (x, y, z, w), the ROS order
    return np.array([w1*x2 + x1*w2 + y1*z2 - z1*y2, w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2, w1*w2 - x1*x2 - y1*y2 - z1*z2])
def qconj(q): return np.array([-q[0], -q[1], -q[2], q[3]])
def qrot(q, v): return qmul(qmul(q, np.r_[v, 0.0]), qconj(q))[:3]
def qyaw(yaw): return np.array([0, 0, np.sin(yaw / 2), np.cos(yaw / 2)])
def qrpy(r, p, y):
    qx = np.array([np.sin(r / 2), 0, 0, np.cos(r / 2)]); qy = np.array([0, np.sin(p / 2), 0, np.cos(p / 2)])
    return qmul(qyaw(y), qmul(qy, qx))
def slerp(a, b, s):
    d = np.dot(a, b)
    if d < 0: b, d = -b, -d                                 # take the short way round
    if d > 0.9995: q = a + s * (b - a); return q / np.linalg.norm(q)
    th = np.arccos(d); return (np.sin((1 - s) * th) * a + np.sin(s * th) * b) / np.sin(th)

class TF:
    """a transform (t, q) maps points in the child frame to the parent frame: p_parent = q p_child q* + t"""
    def __init__(self, t, q): self.t, self.q = np.asarray(t, float), np.asarray(q, float)
    def __mul__(self, o): return TF(self.t + qrot(self.q, o.t), qmul(self.q, o.q))
    def inv(self): qi = qconj(self.q); return TF(-qrot(qi, self.t), qi)
    def apply(self, p): return qrot(self.q, p) + self.t

class ExtrapolationError(Exception): pass

class Buffer:
    """tf2's core: each child frame has one parent and a time-sorted history of transforms; static edges have no history"""
    def __init__(self, cache=10.0): self.parent, self.hist, self.static, self.cache = {}, {}, {}, cache
    def set_static(self, parent, child, tf): self.parent[child] = parent; self.static[child] = tf
    def set(self, parent, child, stamp, tf):
        self.parent[child] = parent; h = self.hist.setdefault(child, []); h.append((stamp, tf)); h.sort(key=lambda e: e[0])
        while h[-1][0] - h[0][0] > self.cache: h.pop(0)         # drop history older than the cache length
    def edge(self, child, t):
        if child in self.static: return self.static[child]
        h = self.hist[child]
        if t is None: return h[-1][1]                          # time 0 in tf2: the latest available
        if t < h[0][0] or t > h[-1][0]:
            raise ExtrapolationError(f"{child}: requested {t:.2f} s outside [{h[0][0]:.2f}, {h[-1][0]:.2f}]")
        for (t0, a), (t1, b) in zip(h, h[1:]):
            if t0 <= t <= t1:
                s = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                return TF(a.t + s * (b.t - a.t), slerp(a.q, b.q, s))   # lerp the translation, slerp the rotation
        return h[-1][1]
    def chain(self, f):
        out = [f]
        while out[-1] in self.parent: out.append(self.parent[out[-1]])
        return out
    def lookup(self, target, source, t=None):
        """transform that maps points in \`source\` to \`target\`, at time t, through the common ancestor"""
        up_s, up_t = self.chain(source), self.chain(target)
        root = next(f for f in up_s if f in up_t)
        def to_root(path):
            T = TF([0, 0, 0], [0, 0, 0, 1])
            for f in path[:path.index(root)]: T = self.edge(f, t) * T
            return T
        return to_root(up_t).inv() * to_root(up_s)
    def tree(self, f="map", depth=0):
        lines = [("  " * depth) + f + (" (static)" if f in self.static else "")]
        for c in sorted(k for k, p in self.parent.items() if p == f): lines += self.tree(c, depth + 1)
        return lines

def build():
    b = Buffer()
    b.set_static("base_link", "laser", TF([0.20, 0, 0.15], qyaw(0)))
    b.set_static("base_link", "camera_link", TF([0.10, 0, 0.30], qrpy(0, 0.2, 0)))
    b.set_static("camera_link", "camera_optical", TF([0, 0, 0], qrpy(-np.pi / 2, 0, -np.pi / 2)))
    b.set("map", "odom", 0.0, TF([1.0, 0.5, 0], qyaw(0.1)))
    b.set("map", "odom", 2.0, TF([1.0, 0.5, 0], qyaw(0.1)))
    for k in range(21):                                        # the robot drives an arc: odometry at 10 Hz for 2 s
        t = 0.1 * k; b.set("odom", "base_link", t, TF([np.sin(t), 1 - np.cos(t), 0], qyaw(t)))
    return b

def test_tree_and_lookups():
    b = build()
    print("\\n".join(b.tree()))
    p = b.lookup("map", "laser", 1.0).apply([2.0, 0, 0])      # a laser return 2 m ahead, at t = 1 s
    yaw = 0.1 + 1.0; base = np.array([1.0, 0.5, 0]) + qrot(qyaw(0.1), [np.sin(1), 1 - np.cos(1), 0])
    expect = base + np.array([np.cos(yaw), np.sin(yaw), 0]) * 2.2 + [0, 0, 0.15]
    print("laser point in map at t = 1.0 s:", np.round(p, 4), "expected", np.round(expect, 4))
    assert np.allclose(p, expect, atol=1e-9)
    T = b.lookup("laser", "camera_optical", 0.5) * b.lookup("camera_optical", "laser", 0.5)
    assert np.allclose(T.t, 0) and np.isclose(abs(T.q[3]), 1)                  # a round trip is the identity

def test_interpolation_and_extrapolation():
    b = build(); T = b.lookup("odom", "base_link", 1.05)
    yaw = 2 * np.arctan2(T.q[2], T.q[3])
    print(f"between samples at t = 1.05 s: x {T.t[0]:.5f} (true {np.sin(1.05):.5f}), yaw {yaw:.5f} (true 1.05000)")
    assert np.isclose(yaw, 1.05) and abs(T.t[0] - np.sin(1.05)) < 2e-3       # slerp exact for the yaw; lerp cuts the arc by about 1 mm
    try: b.lookup("map", "base_link", 2.5); assert False
    except ExtrapolationError as e: print("lookup at 2.5 s:", e)

test_tree_and_lookups()
test_interpolation_and_extrapolation()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};