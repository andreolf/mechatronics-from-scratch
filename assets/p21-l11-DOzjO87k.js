var e=`p21-l11`,t=50,n=`Put the track together into a desk-sized four-line robot you can build in a weekend and extend for months. You size it with the tools from Lessons 2 to 10, write a bill of materials as requirements rather than part numbers, plan the build in stages that each end with a test, and see where Stringman’s open designs can help and how to credit them.`,r=`<h2 id="why-start-at-desk-scale">Why start at desk scale</h2>
<p>Everything in this track works the same at 0.8 m as at 7 m, and a desk frame is cheaper, safer and faster to iterate on. A 5 N line cannot hurt anyone, a 0.2 kg gripper does no damage when it falls, and you can rebuild a winch in an evening. The physics keeps you honest at any scale, so the habits you build here carry over to a room.</p>
<p>The target, which the simulator’s desk preset uses:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Requirement</th>
<th>Value</th>
<th>Where it comes from</th>
</tr>
</thead>
<tbody><tr>
<td>Frame</td>
<td>0.8 × 0.6 m footprint, anchors 0.5 m up</td>
<td>fits on a desk</td>
</tr>
<tr>
<td>Hanging mass</td>
<td>0.2 kg (small servo gripper plus a light object)</td>
<td></td>
</tr>
<tr>
<td>Line tension limit</td>
<td>5 N</td>
<td>Lesson 8: low enough to be harmless</td>
</tr>
<tr>
<td>Speed</td>
<td>0.2 m/s</td>
<td>half of Stringman’s 0.4 m/s</td>
</tr>
<tr>
<td>Pole</td>
<td>0.1 m</td>
<td>Lesson 7: period 0.634 s</td>
</tr>
</tbody></table></div>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="cablebot" data-args="{&quot;preset&quot;:&quot;desk&quot;}"></div></div><figcaption>The desk preset: 0.8 × 0.6 × 0.5 m, 10 cm pole, 0.1 kg, a 5 N limit and 0.2 m/s. Raise the payload to 0.2 kg and drag the gripper up and to the walls: the capacity map shows where it stops fitting.</figcaption></figure>
<h2 id="size-it-with-the-track">Size it with the track</h2>
<p><strong>Workspace (Lesson 4).</strong> With a 5 N limit the capacity at the centre is 1.27 kg with the pivot 0.1 m above the desk and 0.40 kg at 0.4 m. The worst point in each layer matters more: 0.52 kg up to a pivot height of 0.25 m, 0.25 kg at 0.4 m and 0.19 kg at 0.425 m. So 0.2 kg fits everywhere with the pivot at or below 0.40 m, which leaves the gripper 0.30 m of vertical travel above the desk. Put that limit in software from day one.</p>
<p><strong>Tension at rest (Lesson 3).</strong> In the middle at 0.2 m each line carries 0.95 N. That is what your tension sensors should read when nothing is happening, and a reading of zero on one of them means a slack line.</p>
<p><strong>Winches (Lesson 5).</strong> The three spool numbers come straight from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span> and one step of arc:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0463em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3603em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0.010</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">m</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0.4</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">N⋅m</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">40</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">N</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.113em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.427em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0.010</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">m</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0.2</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">m/s</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">20</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">rad/s</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord">191</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">rpm</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">Δ</span><span class="mord mathnormal" style="margin-right:0.0197em;">l</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0074em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">3200</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.020</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">mm</span></span><span class="mord">.</span></span></span></span></span></div>
<p>So a 10 mm spool radius on a NEMA 17 stepper with 0.4 N·m of holding torque pulls 40 N, eight times the limit, which is the margin a stepper wants because its torque falls with speed and a lost step is a silent length error. At 1/16 microstepping, 3,200 steps per turn, one step is 0.020 mm of line. The longest line, from an anchor to the opposite bottom corner, is 1.12 m, so 1.5 m per spool is enough, and 1.5 m of 0.5 mm line fits in one layer on a 12 mm wide drum, so you never need the pile model.</p>
<p><strong>Tension sensing (Lessons 5 and 8).</strong> Steppers do not report torque. The simplest honest option is a small load cell under each anchor pulley, read through a load-cell amplifier, which gives you the 5 N trip, the slack-line check and real data for the null-space problem of Lesson 3. The alternative is to use small direct-drive or geared BLDC motors with current sensing, Stringman’s route, at more cost and complexity.</p>
<p><strong>Swing (Lessons 7 and 9).</strong> On a 10 cm pole a stop from 0.2 m/s swings 2.0 cm. A ZV shaper adds 0.317 s to each move and needs no sensor at all, so start there. Add an IMU on the gripper and feedback damping later, and measure the loop delay first: on a desk the whole loop can live on one microcontroller, with no Wi-Fi in it.</p>
<h2 id="bill-of-materials-as-requirements">Bill of materials as requirements</h2>
<p>Prices and part numbers go out of date; requirements do not. Write the list like this and choose parts that meet each line.</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Qty</th>
<th>Part</th>
<th>Requirement</th>
<th>Check</th>
</tr>
</thead>
<tbody><tr>
<td>1</td>
<td>Frame</td>
<td>Rigid to under 1 mm at the anchors under 4 × 5 N; square to 2 mm</td>
<td>Lesson 6: in the room example a 5 cm anchor error lifted a straight path by 18.5 cm</td>
</tr>
<tr>
<td>4</td>
<td>Stepper motors</td>
<td>Holding torque ≥ 4 × 5 N × spool radius</td>
<td>0.4 N·m on a 10 mm spool gives 8×</td>
</tr>
<tr>
<td>4</td>
<td>Stepper drivers</td>
<td>Microstepping ≥ 1/16, current limit set below the motor rating</td>
<td>0.020 mm per step</td>
</tr>
<tr>
<td>4</td>
<td>Spools</td>
<td>10 mm radius, ≥ 12 mm wide, flanged, line clamped not tied</td>
<td>One layer for 1.5 m</td>
</tr>
<tr>
<td>4</td>
<td>Pulleys or eyelets at the anchors</td>
<td>Smooth, low friction, line exit point known to 1 mm</td>
<td>Lesson 6 calibrates what is left</td>
</tr>
<tr>
<td>4</td>
<td>Load cells with amplifiers</td>
<td>Range ≥ 2 × 5 N, read at ≥ 50 Hz</td>
<td>Lesson 8: trip within 20 ms</td>
</tr>
<tr>
<td>1</td>
<td>Line</td>
<td>Low stretch braid, rated ≥ 3 × the 5 N limit</td>
<td>20 N rating passes</td>
</tr>
<tr>
<td>1</td>
<td>Microcontroller</td>
<td>Four step outputs, four load-cell inputs, USB serial to a PC</td>
<td>Lesson 9: keep the fast loops local</td>
</tr>
<tr>
<td>1</td>
<td>Gripper</td>
<td>Hanging mass with payload ≤ 0.2 kg</td>
<td>Lesson 4 map</td>
</tr>
<tr>
<td>1</td>
<td>Power supply and a physical stop switch</td>
<td>Switch cuts motor power, not just the software</td>
<td>Lesson 8: independent layers</td>
</tr>
<tr>
<td>1</td>
<td>Camera (optional)</td>
<td>Fixed above the desk, sees the whole workspace</td>
<td>Lesson 6 calibration, Lesson 10 datasets</td>
</tr>
</tbody></table></div>
<h2 id="build-in-stages-each-ending-with-a-test">Build in stages, each ending with a test</h2>
<ol>
<li><strong>One winch on the bench.</strong> Wind line onto the spool with a known weight hanging from it. Test: commanding 1 m of line moves the weight 1 m within 1 mm; the load cell reads the weight within 2 %.</li>
<li><strong>Four winches, open loop.</strong> Mount the motors, hand-measure the anchors, run the IK from Lesson 2. Test: the gripper reaches the centre and four points 10 cm from it.</li>
<li><strong>Calibrate.</strong> Mark a grid on the desk, record line lengths at 20 or more poses spread over the whole volume, and fit anchors and offsets as in Lesson 6. Test: straight lines at two heights stay within 2 mm.</li>
<li><strong>Tensions and the supervisor.</strong> Read all four load cells at 50 Hz, log them, and implement the latching 5 N trip from Lesson 8. Test: pull a line by hand; it trips, stays tripped and lowers the gripper slowly.</li>
<li><strong>Swing.</strong> Time ten swings, set the ZV shaper. Test: residual swing after a full-speed stop under 2 mm.</li>
<li><strong>Software.</strong> A Python API on the PC with a small set of verbs (move, nudge, stop, grasp), all of them cancellable. Test: <code>stop</code> from any state brings every motor to rest.</li>
<li><strong>Learning (optional).</strong> Teleoperate, record episodes with timestamps, and train a small policy, starting with one object and one motion, per Lesson 10.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">desk_build_check.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

G = <span class="hljs-number">9.81</span>
W, D, H, POLE, LIMIT, MASS = <span class="hljs-number">0.8</span>, <span class="hljs-number">0.6</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">0.1</span>, <span class="hljs-number">5.0</span>, <span class="hljs-number">0.2</span>       <span class="hljs-comment"># desk frame, metres, newtons, kg hanging</span>
A = np.array([[-W/<span class="hljs-number">2</span>, -D/<span class="hljs-number">2</span>, H], [W/<span class="hljs-number">2</span>, -D/<span class="hljs-number">2</span>, H], [W/<span class="hljs-number">2</span>, D/<span class="hljs-number">2</span>, H], [-W/<span class="hljs-number">2</span>, D/<span class="hljs-number">2</span>, H]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">capacity</span>(<span class="hljs-params">p, t_max=LIMIT</span>):
    v = A - p
    U = (v / np.linalg.norm(v, axis=<span class="hljs-number">1</span>)[:, <span class="hljs-literal">None</span>]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, G])
    n = np.linalg.svd(U)[<span class="hljs-number">2</span>][-<span class="hljs-number">1</span>]
    lo = <span class="hljs-built_in">max</span>([-tau[i] / n[i] <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>) <span class="hljs-keyword">if</span> n[i] &gt; <span class="hljs-number">1e-12</span>], default=-np.inf)
    hi = <span class="hljs-built_in">min</span>([-tau[i] / n[i] <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>) <span class="hljs-keyword">if</span> n[i] &lt; -<span class="hljs-number">1e-12</span>], default=np.inf)
    <span class="hljs-keyword">if</span> lo &gt; hi:
        <span class="hljs-keyword">return</span> <span class="hljs-number">0.0</span>
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>) <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(i + <span class="hljs-number">1</span>, <span class="hljs-number">4</span>) <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(n[i] - n[j]) &gt; <span class="hljs-number">1e-12</span>]
    <span class="hljs-keyword">return</span> t_max / <span class="hljs-built_in">min</span>(np.<span class="hljs-built_in">max</span>(tau + c * n) <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> cands <span class="hljs-keyword">if</span> lo - <span class="hljs-number">1e-9</span> &lt;= c &lt;= hi + <span class="hljs-number">1e-9</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">worst_in_layer</span>(<span class="hljs-params">z, n=<span class="hljs-number">40</span></span>):
    xs = -W/<span class="hljs-number">2</span> + W * (np.arange(n) + <span class="hljs-number">0.5</span>) / n
    ys = -D/<span class="hljs-number">2</span> + D * (np.arange(n) + <span class="hljs-number">0.5</span>) / n
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">min</span>(capacity(np.array([x, y, z])) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> xs <span class="hljs-keyword">for</span> y <span class="hljs-keyword">in</span> ys)

<span class="hljs-comment"># 1. the workspace: where does 0.2 kg fit under a 5 N limit?</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;centre capacity: <span class="hljs-subst">{capacity(np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.1</span>])):<span class="hljs-number">.2</span>f}</span> kg with the pivot at 0.1 m, <span class="hljs-subst">{capacity(np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.4</span>])):<span class="hljs-number">.2</span>f}</span> kg at 0.4 m&quot;</span>)
<span class="hljs-keyword">for</span> z <span class="hljs-keyword">in</span> (<span class="hljs-number">0.25</span>, <span class="hljs-number">0.4</span>, <span class="hljs-number">0.425</span>):
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  worst point at pivot height <span class="hljs-subst">{z}</span> m: <span class="hljs-subst">{worst_in_layer(z):<span class="hljs-number">.3</span>f}</span> kg&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(capacity(np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.1</span>])) - <span class="hljs-number">1.274</span>) &lt; <span class="hljs-number">0.002</span>
<span class="hljs-keyword">assert</span> worst_in_layer(<span class="hljs-number">0.4</span>) &gt; MASS &gt; worst_in_layer(<span class="hljs-number">0.425</span>)       <span class="hljs-comment"># keep the pivot at or below 0.40 m</span>

<span class="hljs-comment"># 2. winch requirements from lessons 5 and 7, checked against a candidate spec</span>
spool_r, holding_torque, microsteps, line_rating = <span class="hljs-number">0.010</span>, <span class="hljs-number">0.40</span>, <span class="hljs-number">200</span> * <span class="hljs-number">16</span>, <span class="hljs-number">20.0</span>
v_max, line_needed = <span class="hljs-number">0.2</span>, math.dist((-W/<span class="hljs-number">2</span>, -D/<span class="hljs-number">2</span>, H), (W/<span class="hljs-number">2</span>, D/<span class="hljs-number">2</span>, <span class="hljs-number">0</span>))
checks = {
    <span class="hljs-string">&quot;torque margin over the limit &gt;= 4&quot;</span>: holding_torque / spool_r / LIMIT &gt;= <span class="hljs-number">4</span>,
    <span class="hljs-string">&quot;speed for 0.2 m/s under 300 rpm&quot;</span>: v_max / spool_r * <span class="hljs-number">60</span> / (<span class="hljs-number">2</span> * math.pi) &lt; <span class="hljs-number">300</span>,
    <span class="hljs-string">&quot;resolution under 0.1 mm per microstep&quot;</span>: <span class="hljs-number">2</span> * math.pi * spool_r / microsteps &lt; <span class="hljs-number">1e-4</span>,
    <span class="hljs-string">&quot;line rated at least 3x the limit&quot;</span>: line_rating &gt;= <span class="hljs-number">3</span> * LIMIT,
    <span class="hljs-string">&quot;1.5 m of line covers the longest diagonal&quot;</span>: <span class="hljs-number">1.5</span> &gt; line_needed,
    <span class="hljs-string">&quot;one layer: 1.5 m on a 12 mm drum of 0.5 mm line&quot;</span>: <span class="hljs-number">1.5</span> / (<span class="hljs-number">2</span> * math.pi * spool_r) * <span class="hljs-number">0.5e-3</span> &lt; <span class="hljs-number">0.012</span>,
}
<span class="hljs-keyword">for</span> k, ok <span class="hljs-keyword">in</span> checks.items():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{<span class="hljs-string">&#x27;ok &#x27;</span> <span class="hljs-keyword">if</span> ok <span class="hljs-keyword">else</span> <span class="hljs-string">&#x27;NO &#x27;</span>}</span> <span class="hljs-subst">{k}</span>&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">all</span>(checks.values())
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(line_needed - <span class="hljs-number">1.118</span>) &lt; <span class="hljs-number">0.001</span>

<span class="hljs-comment"># 3. swing on a 10 cm pole</span>
T = <span class="hljs-number">2</span> * math.pi * math.sqrt(POLE / G)
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;swing period <span class="hljs-subst">{T:<span class="hljs-number">.3</span>f}</span> s; a stop from 0.2 m/s swings <span class="hljs-subst">{<span class="hljs-number">0.2</span> / math.sqrt(G / POLE) * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm; ZV shaping adds <span class="hljs-subst">{T / <span class="hljs-number">2</span>:<span class="hljs-number">.3</span>f}</span> s&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(T - <span class="hljs-number">0.634</span>) &lt; <span class="hljs-number">0.001</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">0.2</span> / math.sqrt(G / POLE) - <span class="hljs-number">0.0202</span>) &lt; <span class="hljs-number">0.0001</span>

<span class="hljs-comment"># 4. tension at rest in the middle: what the load cells should read</span>
v = A - [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0.2</span>]; s = <span class="hljs-number">0.3</span> / np.linalg.norm(v[<span class="hljs-number">0</span>])
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;each line at rest in the middle: <span class="hljs-subst">{MASS * G / (<span class="hljs-number">4</span> * s):<span class="hljs-number">.2</span>f}</span> N&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(MASS * G / (<span class="hljs-number">4</span> * s) - <span class="hljs-number">0.953</span>) &lt; <span class="hljs-number">0.002</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="standing-on-stringman">Standing on Stringman</h2>
<p>This track uses Neufangled’s Stringman as its running example because its makers have published unusually much of it, with real numbers in the code comments. If you build from their work, use it on their terms:</p>
<ul>
<li>The <a href="https://github.com/nhnifong/cranebot3-firmware">Stringman firmware and controller</a> are Apache-2.0. You can study and reuse the code with attribution and the licence notice.</li>
<li>The hardware designs (CAD, STL files, print guide and BOM) are released under CERN-OHL-W 2.0 with an addendum that the user assumes full responsibility for injury, damage or loss, per Neufangled’s <a href="https://neufangled.com/docs/downloads/">downloads page</a>. The CAD is in Onshape. This course does not reproduce any of it.</li>
<li>The <a href="https://github.com/nhnifong/stringman-pcbs">Stringman PCBs</a> are published as KiCad projects. GitHub did not detect a licence file in that repository when this lesson was written, so ask the authors before reusing those designs.</li>
<li>Neufangled states that Stringman is OSHWA certified. If you want a robot that works on the first day, <a href="https://neufangled.com/">buy one</a> and support the people who did the hard part.</li>
</ul>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>You want 0.3 kg hanging on the desk robot. What changes?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>At 5 N the worst point in the 0.25 m layer is 0.52 kg, but at 0.4 m it is 0.25 kg, so either lower the top of the workspace until the worst point in the layer is above 0.3 kg (about 0.375 m in the simulator’s map) or raise the limit to about 6 N, since capacity scales linearly with the limit. Raising the limit also means re-checking the torque margin and the line rating.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the BOM ask for a physical stop switch that cuts motor power when the software already has a supervisor?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The supervisor runs in the same software that might have failed. A switch that removes motor power works when the microcontroller has crashed, the PC is frozen or a bug has disabled the trip. Lesson 8’s rule: keep the safety layers independent.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p21-l11"></div>

<h2 id="sources">Sources</h2>
<ul>
<li>Neufangled, <a href="https://neufangled.com/">Stringman home page</a> (OSHWA certification, published CAD, PCBs and software, 0.4 m/s, 28 N), <a href="https://neufangled.com/docs/downloads/">downloads and licence</a> (CERN-OHL-W 2.0 with addendum, Onshape CAD, KiCad PCBs).</li>
<li>Stringman firmware, <a href="https://github.com/nhnifong/cranebot3-firmware">nhnifong/cranebot3-firmware</a>, Apache-2.0; PCBs, <a href="https://github.com/nhnifong/stringman-pcbs">nhnifong/stringman-pcbs</a> (no licence detected by GitHub on 28 October 2026).</li>
<li>Lessons 2 to 10 of this track for every number in the sizing.</li>
</ul>
`,i=[{id:`why-start-at-desk-scale`,title:`Why start at desk scale`},{id:`size-it-with-the-track`,title:`Size it with the track`},{id:`bill-of-materials-as-requirements`,title:`Bill of materials as requirements`},{id:`build-in-stages-each-ending-with-a-test`,title:`Build in stages, each ending with a test`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`standing-on-stringman`,title:`Standing on Stringman`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`},{id:`sources`,title:`Sources`}],a=[{id:`p21-l11-q1`,type:`num`,q:`<p>Capacity at the centre of the desk frame with the pivot at 0.1 m and a 5 N limit (kg)?</p>
`,explain:`<p>4 T sin θ / g with the lines rising 0.4 m over 0.5 m.</p>
`,answer:1.27,tol:.005,unit:``},{id:`p21-l11-q2`,type:`num`,q:`<p>Tension in each line at rest in the middle, 0.2 kg hanging, pivot at 0.2 m (N)?</p>
`,explain:`<p>m g / (4 sin θ) with sin θ = 0.3/0.583.</p>
`,answer:.953,tol:.005,unit:``},{id:`p21-l11-q3`,type:`num`,q:`<p>Longest line needed in the desk frame, anchor to the opposite bottom corner (m)?</p>
`,explain:`<p>The space diagonal.</p>
`,answer:1.118,tol:.001,unit:``},{id:`p21-l11-q4`,type:`mc`,q:`<p>Why write the BOM as requirements instead of part numbers?</p>
`,explain:`<p>A requirement says why a part was chosen.</p>
`,options:[`It is shorter`,`Suppliers prefer it`,`It avoids licences`,`Requirements stay valid when parts and prices change, and each line can be checked against a lesson`],answer:3},{id:`p21-l11-q5`,type:`mc`,q:`<p>Under which licence are Stringman’s hardware designs released?</p>
`,explain:`<p>Per Neufangled’s downloads page; the software is Apache-2.0.</p>
`,options:[`CERN-OHL-W 2.0 with a responsibility addendum`,`They are proprietary`,`Apache-2.0`,`MIT`],answer:0},{id:`p21-l11-q6`,type:`mc`,q:`<p>What should be the first test of the build?</p>
`,explain:`<p>Every later stage depends on the winch.</p>
`,options:[`Swing damping with an IMU`,`One winch on the bench: commanded length against a measured weight`,`Calibrate all four anchors`,`Train a policy`],answer:1}],o=[{file:`desk_build_check.py`,lang:`python`,src:`import math
import numpy as np

G = 9.81
W, D, H, POLE, LIMIT, MASS = 0.8, 0.6, 0.5, 0.1, 5.0, 0.2       # desk frame, metres, newtons, kg hanging
A = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def capacity(p, t_max=LIMIT):
    v = A - p
    U = (v / np.linalg.norm(v, axis=1)[:, None]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [0, 0, G])
    n = np.linalg.svd(U)[2][-1]
    lo = max([-tau[i] / n[i] for i in range(4) if n[i] > 1e-12], default=-np.inf)
    hi = min([-tau[i] / n[i] for i in range(4) if n[i] < -1e-12], default=np.inf)
    if lo > hi:
        return 0.0
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) for i in range(4) for j in range(i + 1, 4) if abs(n[i] - n[j]) > 1e-12]
    return t_max / min(np.max(tau + c * n) for c in cands if lo - 1e-9 <= c <= hi + 1e-9)

def worst_in_layer(z, n=40):
    xs = -W/2 + W * (np.arange(n) + 0.5) / n
    ys = -D/2 + D * (np.arange(n) + 0.5) / n
    return min(capacity(np.array([x, y, z])) for x in xs for y in ys)

# 1. the workspace: where does 0.2 kg fit under a 5 N limit?
print(f"centre capacity: {capacity(np.array([0, 0, 0.1])):.2f} kg with the pivot at 0.1 m, {capacity(np.array([0, 0, 0.4])):.2f} kg at 0.4 m")
for z in (0.25, 0.4, 0.425):
    print(f"  worst point at pivot height {z} m: {worst_in_layer(z):.3f} kg")
assert abs(capacity(np.array([0, 0, 0.1])) - 1.274) < 0.002
assert worst_in_layer(0.4) > MASS > worst_in_layer(0.425)       # keep the pivot at or below 0.40 m

# 2. winch requirements from lessons 5 and 7, checked against a candidate spec
spool_r, holding_torque, microsteps, line_rating = 0.010, 0.40, 200 * 16, 20.0
v_max, line_needed = 0.2, math.dist((-W/2, -D/2, H), (W/2, D/2, 0))
checks = {
    "torque margin over the limit >= 4": holding_torque / spool_r / LIMIT >= 4,
    "speed for 0.2 m/s under 300 rpm": v_max / spool_r * 60 / (2 * math.pi) < 300,
    "resolution under 0.1 mm per microstep": 2 * math.pi * spool_r / microsteps < 1e-4,
    "line rated at least 3x the limit": line_rating >= 3 * LIMIT,
    "1.5 m of line covers the longest diagonal": 1.5 > line_needed,
    "one layer: 1.5 m on a 12 mm drum of 0.5 mm line": 1.5 / (2 * math.pi * spool_r) * 0.5e-3 < 0.012,
}
for k, ok in checks.items():
    print(f"  {'ok ' if ok else 'NO '} {k}")
assert all(checks.values())
assert abs(line_needed - 1.118) < 0.001

# 3. swing on a 10 cm pole
T = 2 * math.pi * math.sqrt(POLE / G)
print(f"swing period {T:.3f} s; a stop from 0.2 m/s swings {0.2 / math.sqrt(G / POLE) * 100:.1f} cm; ZV shaping adds {T / 2:.3f} s")
assert abs(T - 0.634) < 0.001 and abs(0.2 / math.sqrt(G / POLE) - 0.0202) < 0.0001

# 4. tension at rest in the middle: what the load cells should read
v = A - [0, 0, 0.2]; s = 0.3 / np.linalg.norm(v[0])
print(f"each line at rest in the middle: {MASS * G / (4 * s):.2f} N")
assert abs(MASS * G / (4 * s) - 0.953) < 0.002
print("PASS")`}],s={id:e,minutes:50,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};