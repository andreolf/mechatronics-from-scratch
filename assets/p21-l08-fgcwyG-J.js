var e=`p21-l08`,t=40,n=`Stringman’s answer to “what if someone walks into a line?” is a 28 N tension limit at which every motor lets go. You work out what that limit does and does not protect, why a sudden push trips it sooner than a steady one, why letting go needs to be a controlled descent, and how to build a supervisor that latches.`,r=`<h2 id="lines-in-a-room-with-people">Lines in a room with people</h2>
<p>An arm can only hit what is inside its reach. A room-scale cable robot strings lines across the space that people live in, at whatever height the gripper happens to be. Most of the time the lines are overhead, but not always: lower the gripper to the floor by a bed and the lines run diagonally across the room at head and chest height.</p>
<p>Neufangled’s FAQ gives Stringman’s answer in one sentence: when a line reaches a tension limit of 28 N, “about the weight of a backpack”, all motors relax and the lines can be pulled loose. The firmware adds a second, independent layer. Any motor that reads more than 40 N switches off its own torque, even with no connection to the controller, and the log message says why: to protect the line. And the power line to the gripper, the one that also carries load, is rated at 50 N tensile strength. Three numbers, each a step above the last:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Layer</th>
<th>Where it runs</th>
<th>Threshold</th>
</tr>
</thead>
<tbody><tr>
<td>Relax all motors</td>
<td>Motion controller</td>
<td>28 N on any line</td>
</tr>
<tr>
<td>Torque off on that motor</td>
<td>Anchor firmware</td>
<td>40 N</td>
</tr>
<tr>
<td>Line breaks</td>
<td>Physics</td>
<td>50 N (power line rating)</td>
</tr>
</tbody></table></div>
<p>The margin from the relax limit to the line rating is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">50/28</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.79</span></span></span></span>. That margin is what protects you from the controller’s own delays and from the dynamic peaks below.</p>
<h2 id="what-a-tension-limit-protects">What a tension limit protects</h2>
<p>A tension limit is a limit on force, and it acts everywhere along the line. Wherever a line is bent around something, a wrist, a shoulder or a chair back, it presses on it with</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">F</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">φ</span><span class="mpunct">,</span></span></span></span></span></div>
<p>where <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">φ</span></span></span></span> is how far the line is deflected on each side. A line at 28 N grazing a body at 5° presses with 4.9 N. Wrapped around it at 90° each side, the most it can ever press with is 56 N, which is why entanglement, not contact, is the case to design for. The limit also caps how hard the gripper can push on anything: the lines cannot deliver more than their tensions allow.</p>
<p>What it does not protect against is worth listing as honestly as what it does:</p>
<ul>
<li><strong>Pinch points at the spools.</strong> A finger caught where the line enters a spool sees the motor’s torque, not the line’s tension.</li>
<li><strong>A falling gripper.</strong> Relaxing motors removes the force holding the gripper up. That is the next section.</li>
<li><strong>Anchors pulling out.</strong> The anchors carry the sum of everything. Neufangled’s install guide asks for studs or columns, not drywall.</li>
<li><strong>Speed.</strong> At 0.4 m/s the gripper of 1.25 kg carries 0.1 J; the limit does nothing about where it is going.</li>
</ul>
<h2 id="sudden-loads-trip-early">Sudden loads trip early</h2>
<p>Someone who walks into a line or grabs the gripper does not apply a force slowly. A step load on a pendulum overshoots, and the peak is what the lines see. In the code below, a steady 15 N push on a 1.25 kg gripper leans the pole by 51° and loads it with 19.4 N. Apply the same push suddenly to a hanging gripper and the first swing goes to 101°, twice the lean, with 33.6 N on the pole, 1.73 times the steady value.</p>
<p>The simulator below shows the same effect with all four lines and the swing damping on. At its safety pose the lines carry at most 11.7 N at rest; a steady 15 N lean raises the peak to 15.4 N, but the transient when the push is applied reaches 21 N, and any push from about 20 N up trips the 28 N limit in its first swing.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="cablebot" data-args="{&quot;preset&quot;:&quot;safety&quot;}"></div></div><figcaption>Relax at the limit. Raise Push on the gripper until a line crosses 28 N: every line goes slack and the gripper is lowered to the floor. Re-arm with the push still applied and it trips again. Turn Relax at the limit off to see the tension the lines would otherwise reach.</figcaption></figure>
<h2 id="letting-go-gently">Letting go gently</h2>
<p>“All motors relax” is the right idea and needs one more decision: what happens to the gripper? A fully limp, back-drivable motor lets the weight pull line off its spool, and the gripper falls. From 2.5 m that is 7.0 m/s and 30.7 J at the floor for 1.25 kg. A motor that keeps a few newtons of holding force and pays out at a capped speed lowers it instead: at 0.3 m/s the gripper arrives with 56 mJ, five hundred times less.</p>
<p>The simulator uses that second behaviour. When it trips, it holds 2 N on each line, pays out at no more than 0.3 m/s until the gripper rests on the floor, and stays there. <strong>This is our model, not a description of Stringman.</strong> Neufangled documents that the motors relax and the lines can be pulled loose; we have not found a statement of how fast its gripper descends, so treat this part as a design choice for your own build, and test your version with a payload over something soft before you trust it.</p>
<h2 id="a-supervisor-that-latches">A supervisor that latches</h2>
<p>A safety stop that resets itself when the tension drops will oscillate: trip, sag, recover, pull, trip. The supervisor has to <strong>latch</strong>. Once tripped it stays tripped until someone deliberately re-arms it, and re-arming into the same fault trips it again immediately. Three more rules are worth building in from the start:</p>
<ul>
<li>Check every line on every loop. At a 50 Hz loop the worst case is 20 ms to notice, during which the gripper at 0.4 m/s moves 8 mm.</li>
<li>Keep the layers independent. The controller’s limit, the firmware’s cut-off and the mechanical strength of the line should not share a failure mode. Stringman’s 40 N firmware limit works with the network down.</li>
<li>Log the reason. “Line 2 at 29.5 N” tells you whether it was a person, a snag or a bad calibration.</li>
</ul>
<p>ISO/TS 15066, the technical specification for collaborative industrial robots, whose requirements the 2025 edition of ISO 10218 has now integrated, frames safety around limiting the force and pressure a robot can apply to a person’s body. A home cable robot is not certified against it, and nothing in this lesson is a compliance claim, but the frame fits: decide which force you are limiting, make sure every failure path ends below it, and measure it.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">safety.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

G, M, POLE, LIMIT = <span class="hljs-number">9.81</span>, <span class="hljs-number">1.25</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">28.0</span>

<span class="hljs-comment"># 1. the limits stack up: relax at 28 N, firmware cut-off at 40 N, power line rated 50 N</span>
<span class="hljs-keyword">assert</span> <span class="hljs-number">28</span> &lt; <span class="hljs-number">40</span> &lt; <span class="hljs-number">50</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;28 N is the weight of <span class="hljs-subst">{<span class="hljs-number">28</span> / G:<span class="hljs-number">.2</span>f}</span> kg; the 50 N line has a margin of <span class="hljs-subst">{<span class="hljs-number">50</span> / <span class="hljs-number">28</span>:<span class="hljs-number">.2</span>f}</span> over the relax limit&quot;</span>)

<span class="hljs-comment"># 2. tensions at rest at the lab&#x27;s safety pose: pivot (0.8, 0.4, 1.4) in the 7 x 7 x 3 m room, 1.25 kg</span>
A = np.array([[-<span class="hljs-number">3.5</span>, -<span class="hljs-number">3.5</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">3.5</span>, -<span class="hljs-number">3.5</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">3.5</span>, <span class="hljs-number">3.5</span>, <span class="hljs-number">3</span>], [-<span class="hljs-number">3.5</span>, <span class="hljs-number">3.5</span>, <span class="hljs-number">3</span>]])
v = A - [<span class="hljs-number">0.8</span>, <span class="hljs-number">0.4</span>, <span class="hljs-number">1.4</span>]; U = (v / np.linalg.norm(v, axis=<span class="hljs-number">1</span>)[:, <span class="hljs-literal">None</span>]).T
t = U.T @ np.linalg.solve(U @ U.T, [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, M * G])
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;tensions at rest (N):&quot;</span>, t.<span class="hljs-built_in">round</span>(<span class="hljs-number">2</span>))
<span class="hljs-keyword">assert</span> np.allclose(t, [<span class="hljs-number">8.11</span>, <span class="hljs-number">10.25</span>, <span class="hljs-number">11.74</span>, <span class="hljs-number">8.91</span>], atol=<span class="hljs-number">0.006</span>) <span class="hljs-keyword">and</span> t.<span class="hljs-built_in">max</span>() &lt; LIMIT

<span class="hljs-comment"># 3. a sudden sideways push: the pendulum overshoots, so the pole (and the lines) see more than the static force</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">step_push</span>(<span class="hljs-params">F, dt=<span class="hljs-number">1e-5</span>, t_end=<span class="hljs-number">3.0</span></span>):
    a = w = <span class="hljs-number">0.0</span>; peak = <span class="hljs-number">0.0</span>; amax = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(t_end / dt)):
        w += (-G * math.sin(a) + F / M * math.cos(a)) / POLE * dt
        a += w * dt
        peak = <span class="hljs-built_in">max</span>(peak, M * G * math.cos(a) + F * math.sin(a) + M * POLE * w * w)
        amax = <span class="hljs-built_in">max</span>(amax, a)
    <span class="hljs-keyword">return</span> peak, math.degrees(amax)
peak, amax = step_push(<span class="hljs-number">15.0</span>)
static = math.hypot(<span class="hljs-number">15.0</span>, M * G)
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;15 N push: <span class="hljs-subst">{static:<span class="hljs-number">.1</span>f}</span> N on the pole when steady, <span class="hljs-subst">{peak:<span class="hljs-number">.1</span>f}</span> N at the first swing, <span class="hljs-subst">{amax:<span class="hljs-number">.0</span>f}</span> degrees of swing&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(static - <span class="hljs-number">19.37</span>) &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(peak - <span class="hljs-number">33.6</span>) &lt; <span class="hljs-number">0.1</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(amax - <span class="hljs-number">101.5</span>) &lt; <span class="hljs-number">0.2</span>

<span class="hljs-comment"># 4. a line bent around a body by angle phi on each side presses on it with 2 T sin(phi)</span>
<span class="hljs-keyword">for</span> phi <span class="hljs-keyword">in</span> (<span class="hljs-number">5</span>, <span class="hljs-number">30</span>, <span class="hljs-number">90</span>):
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  line at the limit bent <span class="hljs-subst">{phi}</span> degrees each side presses with <span class="hljs-subst">{<span class="hljs-number">2</span> * LIMIT * math.sin(math.radians(phi)):<span class="hljs-number">.1</span>f}</span> N&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">2</span> * LIMIT * math.sin(math.radians(<span class="hljs-number">5</span>)) - <span class="hljs-number">4.88</span>) &lt; <span class="hljs-number">0.01</span>

<span class="hljs-comment"># 5. letting go: free fall from 2.5 m against a controlled 0.3 m/s descent</span>
v_fall = math.sqrt(<span class="hljs-number">2</span> * G * <span class="hljs-number">2.5</span>)
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;dropped from 2.5 m: <span class="hljs-subst">{v_fall:<span class="hljs-number">.1</span>f}</span> m/s, <span class="hljs-subst">{<span class="hljs-number">0.5</span> * M * v_fall**<span class="hljs-number">2</span>:<span class="hljs-number">.1</span>f}</span> J; lowered at 0.3 m/s: <span class="hljs-subst">{<span class="hljs-number">0.5</span> * M * <span class="hljs-number">0.09</span> * <span class="hljs-number">1000</span>:<span class="hljs-number">.0</span>f}</span> mJ&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(v_fall - <span class="hljs-number">7.0</span>) &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">0.5</span> * M * v_fall**<span class="hljs-number">2</span> - <span class="hljs-number">30.7</span>) &lt; <span class="hljs-number">0.05</span>

<span class="hljs-comment"># 6. a latching supervisor: trips on any line over the limit, stays tripped until re-armed,</span>
<span class="hljs-comment">#    and re-arming into a fault that is still there trips again at once</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Supervisor</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, limit</span>):
        <span class="hljs-variable language_">self</span>.limit, <span class="hljs-variable language_">self</span>.relaxed, <span class="hljs-variable language_">self</span>.reason = limit, <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">update</span>(<span class="hljs-params">self, tensions</span>):
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> <span class="hljs-variable language_">self</span>.relaxed <span class="hljs-keyword">and</span> <span class="hljs-built_in">max</span>(tensions) &gt; <span class="hljs-variable language_">self</span>.limit:
            <span class="hljs-variable language_">self</span>.relaxed, <span class="hljs-variable language_">self</span>.reason = <span class="hljs-literal">True</span>, <span class="hljs-string">f&quot;line <span class="hljs-subst">{<span class="hljs-built_in">int</span>(np.argmax(tensions)) + <span class="hljs-number">1</span>}</span> at <span class="hljs-subst">{<span class="hljs-built_in">max</span>(tensions):<span class="hljs-number">.1</span>f}</span> N&quot;</span>
        <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.relaxed
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">rearm</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.relaxed, <span class="hljs-variable language_">self</span>.reason = <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;&quot;</span>

s = Supervisor(LIMIT)
<span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> s.update(t)
<span class="hljs-keyword">assert</span> s.update([<span class="hljs-number">12</span>, <span class="hljs-number">29.5</span>, <span class="hljs-number">10</span>, <span class="hljs-number">9</span>]) <span class="hljs-keyword">and</span> s.reason == <span class="hljs-string">&quot;line 2 at 29.5 N&quot;</span>
<span class="hljs-keyword">assert</span> s.update(t)                       <span class="hljs-comment"># still relaxed after the overload has gone: latched</span>
s.rearm(); <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> s.update(t)
s.rearm(); <span class="hljs-keyword">assert</span> s.update([<span class="hljs-number">30</span>, <span class="hljs-number">10</span>, <span class="hljs-number">10</span>, <span class="hljs-number">10</span>])
<span class="hljs-comment"># at a 50 Hz loop an overload is seen within 20 ms, during which 0.4 m/s covers 8 mm</span>
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">0.4</span> * <span class="hljs-number">0.02</span> - <span class="hljs-number">0.008</span>) &lt; <span class="hljs-number">1e-12</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Test the stop the way it will be triggered. Pull a line sideways by hand at mid-span, grab the gripper and yank it, and drive the gripper into a cushion, and check each time that it trips, that it latches, and what the gripper does next. Then put the robot in a state you did not plan for, such as the controller crashed or the network down, and check that the firmware layer still cuts torque. A stop that has only been tested in the simulator has not been tested.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A line at the 28 N limit is wrapped around a forearm and bends by 20° on each side. How hard does it press on the arm, and how much more would a line at the 50 N breaking load press?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">28</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">20°</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">19.2</span></span></span></span> N at the limit, and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">50</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">20°</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">34.2</span></span></span></span> N at the breaking load. The relax limit buys 15 N of margin at this angle, and more importantly it releases the line instead of holding it there.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why should a tripped supervisor not re-arm itself once the tension has fallen back below the limit?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Because relaxing is what made the tension fall. An automatic re-arm would pull the lines tight again into the same person or snag, trip, relax and repeat, a cycle that can tighten a loop around a limb. A human decision to re-arm, with the fault re-checked at once, breaks that cycle.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p21-l08"></div>

<h2 id="sources">Sources</h2>
<ul>
<li>Neufangled, <a href="https://neufangled.com/">Stringman home page and FAQ</a> (28 N limit at which all motors relax and lines can be pulled loose, 50 N power line, anchors on studs or columns, 0.4 m/s).</li>
<li>Stringman firmware, Apache-2.0: <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/spool_dm.py"><code>spool_dm.py</code></a> at commit e1ee31d (40 N limit that disables motor torque even without a controller connection).</li>
<li>ISO, <a href="https://www.iso.org/standard/62996.html">ISO/TS 15066:2016 Robots and robotic devices — Collaborative robots</a>.</li>
<li><a href="https://arxiv.org/abs/2602.17822">“Evolution of Safety Requirements in Industrial Robotics: Comparative Analysis of ISO 10218-1/2 (2011 vs. 2025) and Integration of ISO/TS 15066”</a>, arXiv:2602.17822.</li>
</ul>
`,i=[{id:`lines-in-a-room-with-people`,title:`Lines in a room with people`},{id:`what-a-tension-limit-protects`,title:`What a tension limit protects`},{id:`sudden-loads-trip-early`,title:`Sudden loads trip early`},{id:`letting-go-gently`,title:`Letting go gently`},{id:`a-supervisor-that-latches`,title:`A supervisor that latches`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`},{id:`sources`,title:`Sources`}],a=[{id:`p21-l08-q1`,type:`num`,q:`<p>What mass has a weight of 28 N (kg)?</p>
`,explain:`<p>m = F / g.</p>
`,answer:2.85,tol:.005,unit:``},{id:`p21-l08-q2`,type:`num`,q:`<p>Most force a line at 28 N can press on a body it wraps around, bent 90° on each side (N)?</p>
`,explain:`<p>F = 2 T sin φ with φ = 90°.</p>
`,answer:56,tol:.001,unit:``},{id:`p21-l08-q3`,type:`mc`,q:`<p>A 15 N push is applied suddenly to a hanging 1.25 kg gripper. How does the peak pole force compare with the steady value?</p>
`,explain:`<p>33.6 N against 19.4 N in the undamped model.</p>
`,options:[`The same`,`About 1.7 times higher, because the swing overshoots`,`Ten times higher`,`Half`],answer:1},{id:`p21-l08-q4`,type:`num`,q:`<p>Kinetic energy of a 1.25 kg gripper dropped from 2.5 m when it reaches the floor (J)?</p>
`,explain:`<p>m g h.</p>
`,answer:30.7,tol:.005,unit:``},{id:`p21-l08-q5`,type:`mc`,q:`<p>Which of these does a 28 N line-tension limit NOT protect against?</p>
`,explain:`<p>At the spool the force comes from the motor torque directly.</p>
`,options:[`A finger pinched at a spool`,`A line bent around a wrist`,`A line snapping from overload`,`The gripper pushing hard on a person`],answer:0},{id:`p21-l08-q6`,type:`mc`,q:`<p>Why must the safety supervisor latch?</p>
`,explain:`<p>An unlatched stop oscillates between trip and recovery.</p>
`,options:[`Because sensors are noisy`,`To keep the calibration`,`Otherwise it re-tightens into the same fault as soon as relaxing lowers the tension`,`To save power`],answer:2}],o=[{file:`safety.py`,lang:`python`,src:`import math
import numpy as np

G, M, POLE, LIMIT = 9.81, 1.25, 0.5, 28.0

# 1. the limits stack up: relax at 28 N, firmware cut-off at 40 N, power line rated 50 N
assert 28 < 40 < 50
print(f"28 N is the weight of {28 / G:.2f} kg; the 50 N line has a margin of {50 / 28:.2f} over the relax limit")

# 2. tensions at rest at the lab's safety pose: pivot (0.8, 0.4, 1.4) in the 7 x 7 x 3 m room, 1.25 kg
A = np.array([[-3.5, -3.5, 3], [3.5, -3.5, 3], [3.5, 3.5, 3], [-3.5, 3.5, 3]])
v = A - [0.8, 0.4, 1.4]; U = (v / np.linalg.norm(v, axis=1)[:, None]).T
t = U.T @ np.linalg.solve(U @ U.T, [0, 0, M * G])
print("tensions at rest (N):", t.round(2))
assert np.allclose(t, [8.11, 10.25, 11.74, 8.91], atol=0.006) and t.max() < LIMIT

# 3. a sudden sideways push: the pendulum overshoots, so the pole (and the lines) see more than the static force
def step_push(F, dt=1e-5, t_end=3.0):
    a = w = 0.0; peak = 0.0; amax = 0.0
    for _ in range(int(t_end / dt)):
        w += (-G * math.sin(a) + F / M * math.cos(a)) / POLE * dt
        a += w * dt
        peak = max(peak, M * G * math.cos(a) + F * math.sin(a) + M * POLE * w * w)
        amax = max(amax, a)
    return peak, math.degrees(amax)
peak, amax = step_push(15.0)
static = math.hypot(15.0, M * G)
print(f"15 N push: {static:.1f} N on the pole when steady, {peak:.1f} N at the first swing, {amax:.0f} degrees of swing")
assert abs(static - 19.37) < 0.01 and abs(peak - 33.6) < 0.1 and abs(amax - 101.5) < 0.2

# 4. a line bent around a body by angle phi on each side presses on it with 2 T sin(phi)
for phi in (5, 30, 90):
    print(f"  line at the limit bent {phi} degrees each side presses with {2 * LIMIT * math.sin(math.radians(phi)):.1f} N")
assert abs(2 * LIMIT * math.sin(math.radians(5)) - 4.88) < 0.01

# 5. letting go: free fall from 2.5 m against a controlled 0.3 m/s descent
v_fall = math.sqrt(2 * G * 2.5)
print(f"dropped from 2.5 m: {v_fall:.1f} m/s, {0.5 * M * v_fall**2:.1f} J; lowered at 0.3 m/s: {0.5 * M * 0.09 * 1000:.0f} mJ")
assert abs(v_fall - 7.0) < 0.01 and abs(0.5 * M * v_fall**2 - 30.7) < 0.05

# 6. a latching supervisor: trips on any line over the limit, stays tripped until re-armed,
#    and re-arming into a fault that is still there trips again at once
class Supervisor:
    def __init__(self, limit):
        self.limit, self.relaxed, self.reason = limit, False, ""
    def update(self, tensions):
        if not self.relaxed and max(tensions) > self.limit:
            self.relaxed, self.reason = True, f"line {int(np.argmax(tensions)) + 1} at {max(tensions):.1f} N"
        return self.relaxed
    def rearm(self):
        self.relaxed, self.reason = False, ""

s = Supervisor(LIMIT)
assert not s.update(t)
assert s.update([12, 29.5, 10, 9]) and s.reason == "line 2 at 29.5 N"
assert s.update(t)                       # still relaxed after the overload has gone: latched
s.rearm(); assert not s.update(t)
s.rearm(); assert s.update([30, 10, 10, 10])
# at a 50 Hz loop an overload is seen within 20 ms, during which 0.4 m/s covers 8 mm
assert abs(0.4 * 0.02 - 0.008) < 1e-12
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};