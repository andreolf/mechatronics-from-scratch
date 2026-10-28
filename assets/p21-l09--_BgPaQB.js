var e=`p21-l09`,t=40,n=`Stringman’s computing is split between a PC and three small Raspberry Pis talking over Wi-Fi, with CAN to the motors and serial to the gripper servos. You trace the signal path, put numbers on the data, and find out what a few hundred milliseconds of delay do to swing damping, and how projecting the swing forward rescues it.`,r=`<h2 id="where-the-computing-lives">Where the computing lives</h2>
<p>Neufangled’s usage guide describes the split plainly. The brain is a Python program, the motion controller (<code>stringman-headless</code>), running on your own PC. The robot’s components are “just light video streaming devices and motor command issuers”. If the motion controller is not running, the anchors simply hold position and transmit nothing.</p>
<p>From the tech specs, the parts list and the firmware source, the pieces are:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Unit</th>
<th>Computer</th>
<th>Talks to its hardware over</th>
<th>Talks to the PC over</th>
</tr>
</thead>
<tbody><tr>
<td>Two anchors, each with two DM-H6215 motors and a camera</td>
<td>Raspberry Pi 3A+</td>
<td>CAN bus (<code>can0</code>, through an MCP2515 controller)</td>
<td>5 GHz Wi-Fi</td>
</tr>
<tr>
<td>Gripper with IMU, camera, wrist and finger servos</td>
<td>Raspberry Pi Zero 2W</td>
<td>Serial at 1 Mbit/s to the STS3215 servos</td>
<td>2.4 GHz Wi-Fi only</td>
</tr>
<tr>
<td>Motion controller and UI server</td>
<td>Your PC</td>
<td></td>
<td></td>
</tr>
</tbody></table></div>
<p>Each component runs a WebSocket server on port 8765 and announces itself with mDNS, so the motion controller finds and connects to everything without you typing an address. The control panel in your browser connects to the motion controller on port 4245, and messages are typed with protocol buffers. The cameras are 1920 × 1080 at 30 fps on the anchors and 684 × 384 at 60 fps on the gripper. The whole thing can run air-gapped on your own network, with the UI served locally and the models on your own hardware.</p>
<p>The gripper gets its power down one of the support lines, the two-conductor FEP line from Lesson 5. That is why it has no battery and why that one line has a thicker pile on its spool.</p>
<h2 id="why-split-it-this-way">Why split it this way</h2>
<p>There are good reasons and they recur in every robot you will build.</p>
<ul>
<li><strong>Fast loops stay local.</strong> The tension regulation in Lesson 5 runs at 50 Hz on the anchor itself, and the 40 N cut-off works with the network down. Nothing that keeps a line from going slack waits for Wi-Fi.</li>
<li><strong>Heavy maths goes where the power is.</strong> Calibration fits, camera processing and learned policies (Lesson 10) run on the PC.</li>
<li><strong>Bandwidth is about video, not control.</strong> The swing state the gripper publishes is four numbers at 100 Hz, 1.6 kB/s. One uncompressed 1080p30 camera stream is 93 MB/s, which is why video is compressed and scaled down before it travels.</li>
</ul>
<p>The price is that the swing damping loop now crosses the network twice: gyro on the gripper, Wi-Fi to the PC, controller, Wi-Fi to an anchor, CAN to the motor. Every hop adds delay, and Wi-Fi delay is not even constant.</p>
<h2 id="what-delay-does-to-damping">What delay does to damping</h2>
<p>Lesson 7’s damping law accelerates the pivot towards the swing. Delay the measurement by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span> and the correction lands at the wrong phase. For a swing with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4.43</span></span></span></span> rad/s, a delay of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span> is a phase lag of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span>. In the simulation below, with the gains from Lesson 7 and a 9 cm swing to start:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Delay</th>
<th>Acting on the old state</th>
<th>Projected forward by the delay</th>
</tr>
</thead>
<tbody><tr>
<td>100 ms</td>
<td>damped</td>
<td>damped</td>
</tr>
<tr>
<td>150 ms</td>
<td>1.2 mm still swinging after 8 s</td>
<td>damped</td>
</tr>
<tr>
<td>200 ms</td>
<td><strong>grows without limit</strong></td>
<td>damped</td>
</tr>
<tr>
<td>300 ms</td>
<td>grows</td>
<td>1.8 mm left</td>
</tr>
</tbody></table></div>
<p>At 200 ms the phase lag is 0.89 rad, 51°, and the “damping” has turned into pumping.</p>
<p>The fix is the one in Stringman’s <code>swing.py</code>. A pendulum swings at one frequency, so a state measured <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span> ago can be rotated forward by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span> to where it is now:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:2.541em;vertical-align:-1.0454em;"></span><span class="minner"><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">[</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.4957em;"><span style="top:-3.6557em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span><span style="top:-2.3643em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9313em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">d</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:0.0278em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.9957em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">]</span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:-0.744em;"><span style="top:-1.6546em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mspace mtight" style="margin-right:-0.1952em;"></span><span class="mord text mtight"><span class="mord mtight">now</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.0454em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.541em;vertical-align:-1.0454em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">[</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mop">cos</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">−</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mop">cos</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">]</span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner"><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">[</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.4957em;"><span style="top:-3.6557em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span><span style="top:-2.3643em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9313em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">d</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:0.0278em;"><span class="mord">˙</span></span></span></span></span></span></span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.9957em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">]</span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:-0.5592em;"><span style="top:-1.6546em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mspace mtight" style="margin-right:-0.1952em;"></span><span class="mord text mtight"><span class="mord mtight">then</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.0454em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">.</span></span></span></span></span></div>
<p>That rotation is exact for a free pendulum. It is only approximate here, because the controller has been pushing on the swing during the delay. The stronger the push, the worse the approximation: at 500 ms with full gain the projected loop leaves 13.8 cm of swing, while at half gain it leaves 0.3 mm. A gentle gain plus a good latency estimate beats a strong gain on a stale measurement. Stringman’s correction is gentle too, a gain of −0.12 on the projected swing acceleration, and its latency is measured by trial rather than assumed, with candidates clipped between 0 and 0.75 s.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="swingdelay" data-args="{}"></div></div><figcaption>Swing damping through a delay. Raise the delay until the swing grows, then project the swing forward. Push the delay further and lower the gain to find what keeps it damped.</figcaption></figure>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">delayed_damping.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math

G, POLE = <span class="hljs-number">9.81</span>, <span class="hljs-number">0.5</span>
w = math.sqrt(G / POLE)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">residual</span>(<span class="hljs-params">tau, gain=<span class="hljs-number">1.0</span>, predict=<span class="hljs-literal">False</span>, T=<span class="hljs-number">10.0</span>, dt=<span class="hljs-number">1e-3</span>, d0=<span class="hljs-number">0.09</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;swing left in the last 2 s of a 10 s run, starting from a 9 cm swing, with the PD swing damping acting on a
    state measured tau seconds ago; optionally rotated forward by omega * tau as a free pendulum would move&quot;&quot;&quot;</span>
    kp, kd = <span class="hljs-number">0.5</span> * w * w * gain, <span class="hljs-number">0.9</span> * w * gain
    lag = <span class="hljs-built_in">int</span>(<span class="hljs-built_in">round</span>(tau / dt))
    d, v = d0, <span class="hljs-number">0.0</span>
    hist = [(d, v)] * (lag + <span class="hljs-number">1</span>)
    c, s = math.cos(w * tau), math.sin(w * tau)
    tail = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(T / dt)):
        dm, vm = hist[-<span class="hljs-number">1</span> - lag]
        <span class="hljs-keyword">if</span> predict <span class="hljs-keyword">and</span> lag:
            dm, vm = dm * c + vm / w * s, -dm * w * s + vm * c
        a = kp * dm + kd * vm
        v += (-w * w * d - a) * dt
        d += v * dt
        hist.append((d, v))
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(hist) &gt; lag + <span class="hljs-number">2</span>:
            hist.pop(<span class="hljs-number">0</span>)
        <span class="hljs-keyword">if</span> k * dt &gt; T - <span class="hljs-number">2</span>:
            tail = <span class="hljs-built_in">max</span>(tail, <span class="hljs-built_in">abs</span>(d))
    <span class="hljs-keyword">return</span> tail

<span class="hljs-keyword">for</span> tau <span class="hljs-keyword">in</span> (<span class="hljs-number">0.0</span>, <span class="hljs-number">0.1</span>, <span class="hljs-number">0.15</span>, <span class="hljs-number">0.2</span>, <span class="hljs-number">0.3</span>):
    r = residual(tau)
    plain = <span class="hljs-string">&quot;grows past 1 m&quot;</span> <span class="hljs-keyword">if</span> r &gt; <span class="hljs-number">1</span> <span class="hljs-keyword">else</span> <span class="hljs-string">f&quot;<span class="hljs-subst">{r*<span class="hljs-number">100</span>:<span class="hljs-number">.3</span>f}</span> cm&quot;</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;delay <span class="hljs-subst">{tau*<span class="hljs-number">1000</span>:<span class="hljs-number">3.0</span>f}</span> ms: plain <span class="hljs-subst">{plain}</span>, projected <span class="hljs-subst">{residual(tau, predict=<span class="hljs-literal">True</span>)*<span class="hljs-number">100</span>:<span class="hljs-number">.3</span>f}</span> cm&quot;</span>)
<span class="hljs-keyword">assert</span> residual(<span class="hljs-number">0.1</span>) &lt; <span class="hljs-number">1e-4</span>                       <span class="hljs-comment"># 100 ms: still fine</span>
<span class="hljs-keyword">assert</span> <span class="hljs-number">0.0005</span> &lt; residual(<span class="hljs-number">0.15</span>) &lt; <span class="hljs-number">0.005</span>            <span class="hljs-comment"># 150 ms: slow to settle</span>
<span class="hljs-keyword">assert</span> residual(<span class="hljs-number">0.2</span>) &gt; <span class="hljs-number">0.09</span>                       <span class="hljs-comment"># 200 ms: the swing grows</span>
<span class="hljs-keyword">assert</span> residual(<span class="hljs-number">0.2</span>, predict=<span class="hljs-literal">True</span>) &lt; <span class="hljs-number">1e-4</span> <span class="hljs-keyword">and</span> residual(<span class="hljs-number">0.3</span>, predict=<span class="hljs-literal">True</span>) &lt; <span class="hljs-number">0.003</span>
<span class="hljs-comment"># the projection assumes the pendulum swings freely during the delay; a gentler gain keeps that nearly true</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;500 ms: full gain projected <span class="hljs-subst">{residual(<span class="hljs-number">0.5</span>, predict=<span class="hljs-literal">True</span>)*<span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm, half gain projected <span class="hljs-subst">{residual(<span class="hljs-number">0.5</span>, <span class="hljs-number">0.5</span>, <span class="hljs-literal">True</span>)*<span class="hljs-number">1000</span>:<span class="hljs-number">.2</span>f}</span> mm&quot;</span>)
<span class="hljs-keyword">assert</span> residual(<span class="hljs-number">0.5</span>, predict=<span class="hljs-literal">True</span>) &gt; <span class="hljs-number">0.05</span> <span class="hljs-keyword">and</span> residual(<span class="hljs-number">0.5</span>, <span class="hljs-number">0.5</span>, <span class="hljs-literal">True</span>) &lt; <span class="hljs-number">0.001</span>

<span class="hljs-comment"># message sizes: a 2 x 2 swing state at 100 Hz is nothing next to one camera</span>
state_rate = <span class="hljs-number">100</span> * <span class="hljs-number">4</span> * <span class="hljs-number">4</span>                          <span class="hljs-comment"># floats of 4 bytes</span>
raw_video = <span class="hljs-number">1920</span> * <span class="hljs-number">1080</span> * <span class="hljs-number">1.5</span> * <span class="hljs-number">30</span>                <span class="hljs-comment"># YUV 4:2:0, bytes per second</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;swing state <span class="hljs-subst">{state_rate / <span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> kB/s; one uncompressed 1080p30 camera <span class="hljs-subst">{raw_video / <span class="hljs-number">1e6</span>:<span class="hljs-number">.0</span>f}</span> MB/s&quot;</span>)
<span class="hljs-keyword">assert</span> state_rate == <span class="hljs-number">1600</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(raw_video / <span class="hljs-number">1e6</span> - <span class="hljs-number">93.3</span>) &lt; <span class="hljs-number">0.1</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Measure your loop delay end to end before tuning anything. Log a timestamp when the IMU sample is taken, carry it through every message, and log when the motor command based on it is applied; the difference, over a few thousand samples, is your latency distribution. Use its median for the projection and look at its tail: a Wi-Fi link that is usually 30 ms and sometimes 300 ms will occasionally hand the loop a correction at the wrong phase, and the gain has to be gentle enough to survive that. Put the gripper on its own 2.4 GHz channel away from the anchors if your router allows it.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>At what delay does the phase lag of a 0.5 m swing reach 90°?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord">/2</span></span></span></span> gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.1132em;">τ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord">/</span><span class="mopen">(</span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">4.43</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.355</span></span></span></span> s. A quarter period, 1.419/4. By then a correction meant to oppose the swing velocity is acting on its displacement instead, and well before that the loop has lost its damping.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the projected loop get worse at long delays with a strong gain, but not with a gentle one?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The projection assumes the pendulum swings freely during the delay. With a strong gain, the corrections issued during the delay change the swing a lot, so the free-pendulum prediction is wrong by the time the next correction lands. With a gentle gain each correction barely changes the swing over one delay, so the prediction stays accurate.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p21-l09"></div>

<h2 id="sources">Sources</h2>
<ul>
<li>Neufangled, <a href="https://neufangled.com/docs/usage_guide/">usage guide</a> (motion controller on the PC, components as “light video streaming devices and motor command issuers”, anchors hold position without it, LAN mode on port 4245).</li>
<li>Neufangled, <a href="https://neufangled.com/">Stringman tech specs</a> (Pi 3A+ anchors, Pi Zero 2W gripper, 5 GHz Wi-Fi with the gripper 2.4 GHz only, cameras, parts list with DM-H6215 and STS3215, air-gapped operation, power through a support line).</li>
<li>Stringman firmware, Apache-2.0, at commit e1ee31d: <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/anchor_arp_server.py"><code>anchor_arp_server.py</code></a> (DM motors on <code>can0</code>), <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/simple_st3215.py"><code>simple_st3215.py</code></a> (servo serial at 1 Mbit/s), <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/component_server.py"><code>component_server.py</code></a> (WebSocket on 8765, mDNS, MCP2515), <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/swing.py"><code>swing.py</code></a> (forward projection, gain, latency range).</li>
</ul>
`,i=[{id:`where-the-computing-lives`,title:`Where the computing lives`},{id:`why-split-it-this-way`,title:`Why split it this way`},{id:`what-delay-does-to-damping`,title:`What delay does to damping`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`},{id:`sources`,title:`Sources`}],a=[{id:`p21-l09-q1`,type:`num`,q:`<p>Phase lag of a 0.5 m swing for a 200 ms loop delay (degrees)?</p>
`,explain:`<p>ω τ with ω = 4.43 rad/s.</p>
`,answer:50.8,tol:.005,unit:``},{id:`p21-l09-q2`,type:`num`,q:`<p>Data rate of a 2 × 2 state of 4-byte floats sent at 100 Hz (kB/s)?</p>
`,explain:`<p>16 bytes per message.</p>
`,answer:1.6,tol:.001,unit:``},{id:`p21-l09-q3`,type:`mc`,q:`<p>Which loop does Stringman keep on the anchor instead of across the network?</p>
`,explain:`<p>The 50 Hz tension loop runs on the anchor itself.</p>
`,options:[`Line tension regulation and the 40 N cut-off`,`Calibration`,`Swing cancellation`,`The learned policy`],answer:0},{id:`p21-l09-q4`,type:`mc`,q:`<p>How does the motion controller find the robot’s components?</p>
`,explain:`<p>The component server registers an mDNS service.</p>
`,options:[`Over Bluetooth`,`Through a cloud server only`,`They announce themselves with mDNS and serve WebSockets on port 8765`,`You type their IP addresses`],answer:2},{id:`p21-l09-q5`,type:`mc`,q:`<p>What does projecting the measured swing forward by the delay assume?</p>
`,explain:`<p>It is a rotation by ωτ, exact only for a free pendulum.</p>
`,options:[`That the pendulum swings freely during the delay`,`That the gyro is noise-free`,`That the pivot is fixed forever`,`That there is no delay`],answer:0},{id:`p21-l09-q6`,type:`num`,q:`<p>Delay at which the phase lag of a 0.5 m swing reaches 90° (s)?</p>
`,explain:`<p>A quarter period.</p>
`,answer:.355,tol:.005,unit:``}],o=[{file:`delayed_damping.py`,lang:`python`,src:`import math

G, POLE = 9.81, 0.5
w = math.sqrt(G / POLE)

def residual(tau, gain=1.0, predict=False, T=10.0, dt=1e-3, d0=0.09):
    """swing left in the last 2 s of a 10 s run, starting from a 9 cm swing, with the PD swing damping acting on a
    state measured tau seconds ago; optionally rotated forward by omega * tau as a free pendulum would move"""
    kp, kd = 0.5 * w * w * gain, 0.9 * w * gain
    lag = int(round(tau / dt))
    d, v = d0, 0.0
    hist = [(d, v)] * (lag + 1)
    c, s = math.cos(w * tau), math.sin(w * tau)
    tail = 0.0
    for k in range(int(T / dt)):
        dm, vm = hist[-1 - lag]
        if predict and lag:
            dm, vm = dm * c + vm / w * s, -dm * w * s + vm * c
        a = kp * dm + kd * vm
        v += (-w * w * d - a) * dt
        d += v * dt
        hist.append((d, v))
        if len(hist) > lag + 2:
            hist.pop(0)
        if k * dt > T - 2:
            tail = max(tail, abs(d))
    return tail

for tau in (0.0, 0.1, 0.15, 0.2, 0.3):
    r = residual(tau)
    plain = "grows past 1 m" if r > 1 else f"{r*100:.3f} cm"
    print(f"delay {tau*1000:3.0f} ms: plain {plain}, projected {residual(tau, predict=True)*100:.3f} cm")
assert residual(0.1) < 1e-4                       # 100 ms: still fine
assert 0.0005 < residual(0.15) < 0.005            # 150 ms: slow to settle
assert residual(0.2) > 0.09                       # 200 ms: the swing grows
assert residual(0.2, predict=True) < 1e-4 and residual(0.3, predict=True) < 0.003
# the projection assumes the pendulum swings freely during the delay; a gentler gain keeps that nearly true
print(f"500 ms: full gain projected {residual(0.5, predict=True)*100:.1f} cm, half gain projected {residual(0.5, 0.5, True)*1000:.2f} mm")
assert residual(0.5, predict=True) > 0.05 and residual(0.5, 0.5, True) < 0.001

# message sizes: a 2 x 2 swing state at 100 Hz is nothing next to one camera
state_rate = 100 * 4 * 4                          # floats of 4 bytes
raw_video = 1920 * 1080 * 1.5 * 30                # YUV 4:2:0, bytes per second
print(f"swing state {state_rate / 1000:.1f} kB/s; one uncompressed 1080p30 camera {raw_video / 1e6:.0f} MB/s")
assert state_rate == 1600 and abs(raw_video / 1e6 - 93.3) < 0.1
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};