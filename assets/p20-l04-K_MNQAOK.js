var e=`p20-l04`,t=45,n=`The balancing robot’s firmware is a 500 Hz loop of sense, estimate, control and actuate. You budget the loop’s time from the I2C transfer and cycle counts, then write it in C against the nonlinear plant model with a biased, noisy IMU and a quantised encoder, and check that it uses under half its deadline and holds the robot upright through a push.`,r=`<h2 id="one-loop-one-deadline">One loop, one deadline</h2>
<p>Every 2 ms the firmware must:</p>
<ol>
<li>read the IMU (gyro rate and accelerometer) and the wheel encoders;</li>
<li>fuse them into a tilt estimate with a complementary filter, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1079em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9579em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1667em;"><span class="mord">^</span></span></span></span></span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.2079em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mopen">(</span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9579em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1667em;"><span class="mord">^</span></span></span></span></span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mclose">)</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">a</span><span class="mord mathnormal mtight">cc</span><span class="mpunct mtight">,</span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span>;</li>
<li>compute the motor voltage <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="mord mathnormal">s</span></span></span></span> from the estimated state;</li>
<li>update the PWM and, if time allows, send telemetry.</li>
</ol>
<h2 id="the-timing-budget">The timing budget</h2>
<p>Budget the worst case before writing code. An I2C read of 14 data bytes plus address and register bytes is about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">17</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span></span></span></span> bit times; at 400 kHz that is 387.5 µs if the CPU waits for it (DMA frees the CPU but not the bus). Computation is cheap at 84 MHz; telemetry formatting is often the largest compute item. Aim to use under half the period, so a late interrupt or a future feature does not cause a deadline miss (Phase 18), and measure on the target with a GPIO toggle and an oscilloscope, or the cycle counter.</p>
<h2 id="testing-on-a-simulated-plant">Testing on a simulated plant</h2>
<p>The firmware logic is plain C that calls <code>read_gyro</code>, <code>read_acc_tilt</code> and <code>read_encoder_x</code>. On the target those talk to hardware; here they sample the nonlinear model of Lesson 02 with a 0.01 rad/s gyro bias, noise, and a 1440-count encoder. The same control code then runs unchanged in both places, a habit that catches most bugs before the robot can fall.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="looptiming" data-args="{}"></div></div><figcaption>The 2 ms loop as a timeline: I2C transfer, computation and telemetry. Change the I2C clock, CPU frequency and telemetry size; tasks past the deadline turn red.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<ol>
<li>Budget: IMU read 387.5 µs, encoder read 6.0 µs, filter 23.8 µs, control 17.9 µs, PWM update 3.6 µs, telemetry 95.2 µs: total 533.9 µs, 26.7 % of the 2 ms period.</li>
<li>Closed loop from 5°, with a 1.5 N push for 50 ms at 2 s: maximum tilt after the first 0.5 s 2.19°, final tilt 0.033°, final position −1.1 cm, peak motor voltage 2.06 V.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">balance_fw.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* Balancing-robot firmware structure on a simulated plant: a 500 Hz loop that reads the IMU and encoders, runs a
   complementary filter and state feedback, and writes the motor voltage. The plant is the nonlinear model of
   Lesson 02 integrated at 10 kHz. Timing numbers are an illustrative budget for an 84 MHz Cortex-M4. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>

<span class="hljs-meta">#<span class="hljs-keyword">define</span> PI 3.14159265358979</span>
<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">double</span> M = <span class="hljs-number">0.9</span>, m = <span class="hljs-number">0.12</span>, r = <span class="hljs-number">0.04</span>, l = <span class="hljs-number">0.07</span>, Ib = <span class="hljs-number">0.004</span>, Iw = <span class="hljs-number">9.6e-5</span>, g = <span class="hljs-number">9.81</span>, kt = <span class="hljs-number">0.25</span>, ke = <span class="hljs-number">0.25</span>, Rm = <span class="hljs-number">4.0</span>;
<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">double</span> K[<span class="hljs-number">4</span>] = {<span class="hljs-number">3.162</span>, <span class="hljs-number">13.965</span>, <span class="hljs-number">19.922</span>, <span class="hljs-number">2.097</span>};   <span class="hljs-comment">/* LQR gains from Lesson 05 (voltage per unit state) */</span>
<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">double</span> H_IMU = <span class="hljs-number">0.11</span>, VBAT = <span class="hljs-number">11.1</span>, DT_CTRL = <span class="hljs-number">0.002</span>, DT_SIM = <span class="hljs-number">1e-4</span>;

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">double</span> x, xd, th, thd, xdd, thdd; } Plant;

<span class="hljs-type">static</span> <span class="hljs-type">unsigned</span> <span class="hljs-type">long</span> <span class="hljs-type">long</span> rs = <span class="hljs-number">12345</span>;
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">urand</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { rs = rs * <span class="hljs-number">6364136223846793005ULL</span> + <span class="hljs-number">1442695040888963407ULL</span>; <span class="hljs-keyword">return</span> ((rs &gt;&gt; <span class="hljs-number">11</span>) + <span class="hljs-number">0.5</span>) / <span class="hljs-number">9007199254740992.0</span>; }
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">gauss</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> <span class="hljs-built_in">sqrt</span>(<span class="hljs-number">-2</span> * <span class="hljs-built_in">log</span>(urand())) * <span class="hljs-built_in">cos</span>(<span class="hljs-number">2</span> * PI * urand()); }

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">accel</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">double</span> s[<span class="hljs-number">4</span>], <span class="hljs-type">double</span> v, <span class="hljs-type">double</span> push, <span class="hljs-type">double</span> out[<span class="hljs-number">2</span>])</span> {
  <span class="hljs-type">double</span> th = s[<span class="hljs-number">2</span>], c = <span class="hljs-built_in">cos</span>(th), sn = <span class="hljs-built_in">sin</span>(th), w_rel = s[<span class="hljs-number">1</span>] / r - s[<span class="hljs-number">3</span>], tau = <span class="hljs-number">2</span> * kt * (v - ke * w_rel) / Rm;
  <span class="hljs-type">double</span> a = M + m + Iw / (r * r), b = M * l * c, d = Ib + M * l * l;
  <span class="hljs-type">double</span> f1 = tau / r + M * l * sn * s[<span class="hljs-number">3</span>] * s[<span class="hljs-number">3</span>] + push, f2 = M * g * l * sn - tau + push * l;
  <span class="hljs-type">double</span> det = a * d - b * b;
  out[<span class="hljs-number">0</span>] = (d * f1 - b * f2) / det; out[<span class="hljs-number">1</span>] = (a * f2 - b * f1) / det;
}

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">step</span><span class="hljs-params">(Plant *p, <span class="hljs-type">double</span> v, <span class="hljs-type">double</span> push, <span class="hljs-type">double</span> dt)</span> {   <span class="hljs-comment">/* RK4 */</span>
  <span class="hljs-type">double</span> s[<span class="hljs-number">4</span>] = {p-&gt;x, p-&gt;xd, p-&gt;th, p-&gt;thd}, k[<span class="hljs-number">4</span>][<span class="hljs-number">4</span>], t[<span class="hljs-number">4</span>], a[<span class="hljs-number">2</span>];
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> j = <span class="hljs-number">0</span>; j &lt; <span class="hljs-number">4</span>; j++) {
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i++) t[i] = s[i] + (j == <span class="hljs-number">0</span> ? <span class="hljs-number">0</span> : (j == <span class="hljs-number">3</span> ? dt : dt / <span class="hljs-number">2</span>)) * (j == <span class="hljs-number">0</span> ? <span class="hljs-number">0</span> : k[j - <span class="hljs-number">1</span>][i]);
    accel(t, v, push, a); k[j][<span class="hljs-number">0</span>] = t[<span class="hljs-number">1</span>]; k[j][<span class="hljs-number">1</span>] = a[<span class="hljs-number">0</span>]; k[j][<span class="hljs-number">2</span>] = t[<span class="hljs-number">3</span>]; k[j][<span class="hljs-number">3</span>] = a[<span class="hljs-number">1</span>];
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i++) s[i] += dt / <span class="hljs-number">6</span> * (k[<span class="hljs-number">0</span>][i] + <span class="hljs-number">2</span> * k[<span class="hljs-number">1</span>][i] + <span class="hljs-number">2</span> * k[<span class="hljs-number">2</span>][i] + k[<span class="hljs-number">3</span>][i]);
  accel(s, v, push, a);
  p-&gt;x = s[<span class="hljs-number">0</span>]; p-&gt;xd = s[<span class="hljs-number">1</span>]; p-&gt;th = s[<span class="hljs-number">2</span>]; p-&gt;thd = s[<span class="hljs-number">3</span>]; p-&gt;xdd = a[<span class="hljs-number">0</span>]; p-&gt;thdd = a[<span class="hljs-number">1</span>];
}

<span class="hljs-comment">/* ---- firmware ---- */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">double</span> th_est, x_prev; <span class="hljs-type">int</span> first; } Ctl;

<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">read_gyro</span><span class="hljs-params">(<span class="hljs-type">const</span> Plant *p)</span> { <span class="hljs-keyword">return</span> p-&gt;thd + <span class="hljs-number">0.01</span> + <span class="hljs-number">0.002</span> * gauss(); }          <span class="hljs-comment">/* 0.01 rad/s bias */</span>
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">read_acc_tilt</span><span class="hljs-params">(<span class="hljs-type">const</span> Plant *p)</span> {
  <span class="hljs-type">double</span> ax = g * <span class="hljs-built_in">sin</span>(p-&gt;th) + p-&gt;xdd * <span class="hljs-built_in">cos</span>(p-&gt;th) + H_IMU * p-&gt;thdd, az = g * <span class="hljs-built_in">cos</span>(p-&gt;th) - p-&gt;xdd * <span class="hljs-built_in">sin</span>(p-&gt;th);
  <span class="hljs-keyword">return</span> <span class="hljs-built_in">atan2</span>(ax + <span class="hljs-number">0.05</span> * gauss(), az + <span class="hljs-number">0.05</span> * gauss());
}
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">read_encoder_x</span><span class="hljs-params">(<span class="hljs-type">const</span> Plant *p)</span> { <span class="hljs-type">double</span> cpr = <span class="hljs-number">1440</span>, ang = p-&gt;x / r; <span class="hljs-keyword">return</span> <span class="hljs-built_in">floor</span>(ang / (<span class="hljs-number">2</span> * PI) * cpr) * <span class="hljs-number">2</span> * PI / cpr * r; }

<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">control</span><span class="hljs-params">(Ctl *c, <span class="hljs-type">const</span> Plant *p)</span> {
  <span class="hljs-type">double</span> gy = read_gyro(p), at = read_acc_tilt(p), x = read_encoder_x(p);
  <span class="hljs-keyword">if</span> (c-&gt;first) { c-&gt;th_est = at; c-&gt;x_prev = x; c-&gt;first = <span class="hljs-number">0</span>; }
  c-&gt;th_est = <span class="hljs-number">0.995</span> * (c-&gt;th_est + gy * DT_CTRL) + <span class="hljs-number">0.005</span> * at;                  <span class="hljs-comment">/* complementary filter */</span>
  <span class="hljs-type">double</span> xd = (x - c-&gt;x_prev) / DT_CTRL; c-&gt;x_prev = x;
  <span class="hljs-type">double</span> v = K[<span class="hljs-number">0</span>] * x + K[<span class="hljs-number">1</span>] * xd + K[<span class="hljs-number">2</span>] * c-&gt;th_est + K[<span class="hljs-number">3</span>] * gy;
  <span class="hljs-keyword">return</span> v &gt; VBAT ? VBAT : (v &lt; -VBAT ? -VBAT : v);
}

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-comment">/* timing budget for one 2 ms period */</span>
  <span class="hljs-type">double</span> f_cpu = <span class="hljs-number">84e6</span>, i2c_bits = <span class="hljs-number">2</span> + <span class="hljs-number">17</span> * <span class="hljs-number">9</span>;                                   <span class="hljs-comment">/* start/stop + 17 bytes with ACK */</span>
  <span class="hljs-type">double</span> t_i2c = i2c_bits / <span class="hljs-number">400e3</span> * <span class="hljs-number">1e6</span>, t_cyc[<span class="hljs-number">5</span>] = {<span class="hljs-number">500</span>, <span class="hljs-number">2000</span>, <span class="hljs-number">1500</span>, <span class="hljs-number">300</span>, <span class="hljs-number">8000</span>};
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *names[<span class="hljs-number">5</span>] = {<span class="hljs-string">&quot;encoder read&quot;</span>, <span class="hljs-string">&quot;filter&quot;</span>, <span class="hljs-string">&quot;control&quot;</span>, <span class="hljs-string">&quot;PWM update&quot;</span>, <span class="hljs-string">&quot;telemetry&quot;</span>};
  <span class="hljs-type">double</span> total = t_i2c; <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;IMU read over I2C at 400 kHz: %.1f us\\n&quot;</span>, t_i2c);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">5</span>; i++) { <span class="hljs-type">double</span> us = t_cyc[i] / f_cpu * <span class="hljs-number">1e6</span>; total += us; <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;%-13s %6.0f cycles %6.1f us\\n&quot;</span>, names[i], t_cyc[i], us); }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;total %.1f us of %.0f us: %.1f %% used\\n&quot;</span>, total, DT_CTRL * <span class="hljs-number">1e6</span>, <span class="hljs-number">100</span> * total / (DT_CTRL * <span class="hljs-number">1e6</span>));
  <span class="hljs-type">int</span> ok_budget = total &lt; <span class="hljs-number">0.5</span> * DT_CTRL * <span class="hljs-number">1e6</span>;

  Plant p = {<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">5</span> * PI / <span class="hljs-number">180</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>}; Ctl c = {<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>}; <span class="hljs-type">double</span> v = <span class="hljs-number">0</span>, maxth = <span class="hljs-number">0</span>, maxv = <span class="hljs-number">0</span>; <span class="hljs-type">int</span> steps = (<span class="hljs-type">int</span>)(DT_CTRL / DT_SIM + <span class="hljs-number">0.5</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">2500</span>; k++) {                                              <span class="hljs-comment">/* 5 s of 500 Hz loop iterations */</span>
    v = control(&amp;c, &amp;p);
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> j = <span class="hljs-number">0</span>; j &lt; steps; j++) { <span class="hljs-type">double</span> push = (k &gt;= <span class="hljs-number">1000</span> &amp;&amp; k &lt; <span class="hljs-number">1025</span>) ? <span class="hljs-number">1.5</span> : <span class="hljs-number">0.0</span>; step(&amp;p, v, push, DT_SIM); }   <span class="hljs-comment">/* 1.5 N for 50 ms at 2 s */</span>
    <span class="hljs-keyword">if</span> (k &gt; <span class="hljs-number">250</span> &amp;&amp; <span class="hljs-built_in">fabs</span>(p.th) &gt; maxth) maxth = <span class="hljs-built_in">fabs</span>(p.th);
    <span class="hljs-keyword">if</span> (<span class="hljs-built_in">fabs</span>(v) &gt; maxv) maxv = <span class="hljs-built_in">fabs</span>(v);
  }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;5 deg start, 1.5 N push for 50 ms at 2 s: max tilt after 0.5 s %.2f deg, final tilt %.3f deg, final position %.1f cm, peak voltage %.2f V\\n&quot;</span>,
         maxth * <span class="hljs-number">180</span> / PI, p.th * <span class="hljs-number">180</span> / PI, <span class="hljs-number">100</span> * p.x, maxv);
  <span class="hljs-type">int</span> ok_ctrl = maxth * <span class="hljs-number">180</span> / PI &lt; <span class="hljs-number">15</span> &amp;&amp; <span class="hljs-built_in">fabs</span>(p.th) * <span class="hljs-number">180</span> / PI &lt; <span class="hljs-number">1</span>;
  <span class="hljs-built_in">printf</span>(ok_budget &amp;&amp; ok_ctrl ? <span class="hljs-string">&quot;PASS\\n&quot;</span> : <span class="hljs-string">&quot;FAIL\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>PlatformIO builds and flashes the same C (or C++) for STM32, ESP32 or RP2040 boards, and its unit-test runner can run the control code on the host, as here. Keep hardware access behind small functions, run the loop from a timer interrupt or an RTOS task with <code>vTaskDelayUntil</code>, and log loop time and deadline misses from the first flight of the code.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>How long does the 155-bit IMU read take at 1 MHz (Fast-mode Plus)?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord">155/1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">6</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">155</span></span></span></span> µs, so the loop’s busiest item shrinks from 387.5 µs to 155 µs.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the complementary filter use <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span></span></span></span> close to 1 at 500 Hz?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The filter’s crossover time constant is about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mord">/</span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mclose">)</span></span></span></span>. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0037em;">α</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.995</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span> ms that is 0.4 s: the gyro dominates fast motion and the accelerometer corrects slow drift, so the accelerometer’s dynamic errors (Lesson 03) are filtered out.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l04"></div>
`,i=[{id:`one-loop-one-deadline`,title:`One loop, one deadline`},{id:`the-timing-budget`,title:`The timing budget`},{id:`testing-on-a-simulated-plant`,title:`Testing on a simulated plant`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l04-q1`,type:`num`,q:`<p>Bit time of 155 bits at 400 kHz (µs)?</p>
`,explain:`<p>Bits over clock rate.</p>
`,answer:387.5,tol:.001,unit:``},{id:`p20-l04-q2`,type:`num`,q:`<p>Time for 8000 cycles at 84 MHz (µs)?</p>
`,explain:`<p>Cycles over frequency.</p>
`,answer:95.2,tol:.002,unit:``},{id:`p20-l04-q3`,type:`num`,q:`<p>Share of a 2 ms period used by 534 µs (%)?</p>
`,explain:`<p>Busy time over period.</p>
`,answer:26.7,tol:.003,unit:``},{id:`p20-l04-q4`,type:`num`,q:`<p>Complementary filter time constant for α 0.995 and T 2 ms (s)?</p>
`,explain:`<p>α T / (1 − α).</p>
`,answer:.398,tol:.005,unit:``},{id:`p20-l04-q5`,type:`mc`,q:`<p>Why keep hardware access behind small functions?</p>
`,explain:`<p>Host testing catches bugs early.</p>
`,options:[`It removes the need for tests`,`The same control code runs on the target and against a simulated plant`,`It makes the code faster`,`The compiler requires it`],answer:1},{id:`p20-l04-q6`,type:`mc`,q:`<p>Which item dominates this loop’s budget?</p>
`,explain:`<p>Bus time, not computation.</p>
`,options:[`The encoder read`,`The blocking I2C read`,`The PWM update`,`The control law`],answer:1}],o=[{file:`balance_fw.c`,lang:`c`,src:`/* Balancing-robot firmware structure on a simulated plant: a 500 Hz loop that reads the IMU and encoders, runs a
   complementary filter and state feedback, and writes the motor voltage. The plant is the nonlinear model of
   Lesson 02 integrated at 10 kHz. Timing numbers are an illustrative budget for an 84 MHz Cortex-M4. */
#include <math.h>
#include <stdio.h>

#define PI 3.14159265358979
static const double M = 0.9, m = 0.12, r = 0.04, l = 0.07, Ib = 0.004, Iw = 9.6e-5, g = 9.81, kt = 0.25, ke = 0.25, Rm = 4.0;
static const double K[4] = {3.162, 13.965, 19.922, 2.097};   /* LQR gains from Lesson 05 (voltage per unit state) */
static const double H_IMU = 0.11, VBAT = 11.1, DT_CTRL = 0.002, DT_SIM = 1e-4;

typedef struct { double x, xd, th, thd, xdd, thdd; } Plant;

static unsigned long long rs = 12345;
static double urand(void) { rs = rs * 6364136223846793005ULL + 1442695040888963407ULL; return ((rs >> 11) + 0.5) / 9007199254740992.0; }
static double gauss(void) { return sqrt(-2 * log(urand())) * cos(2 * PI * urand()); }

static void accel(const double s[4], double v, double push, double out[2]) {
  double th = s[2], c = cos(th), sn = sin(th), w_rel = s[1] / r - s[3], tau = 2 * kt * (v - ke * w_rel) / Rm;
  double a = M + m + Iw / (r * r), b = M * l * c, d = Ib + M * l * l;
  double f1 = tau / r + M * l * sn * s[3] * s[3] + push, f2 = M * g * l * sn - tau + push * l;
  double det = a * d - b * b;
  out[0] = (d * f1 - b * f2) / det; out[1] = (a * f2 - b * f1) / det;
}

static void step(Plant *p, double v, double push, double dt) {   /* RK4 */
  double s[4] = {p->x, p->xd, p->th, p->thd}, k[4][4], t[4], a[2];
  for (int j = 0; j < 4; j++) {
    for (int i = 0; i < 4; i++) t[i] = s[i] + (j == 0 ? 0 : (j == 3 ? dt : dt / 2)) * (j == 0 ? 0 : k[j - 1][i]);
    accel(t, v, push, a); k[j][0] = t[1]; k[j][1] = a[0]; k[j][2] = t[3]; k[j][3] = a[1];
  }
  for (int i = 0; i < 4; i++) s[i] += dt / 6 * (k[0][i] + 2 * k[1][i] + 2 * k[2][i] + k[3][i]);
  accel(s, v, push, a);
  p->x = s[0]; p->xd = s[1]; p->th = s[2]; p->thd = s[3]; p->xdd = a[0]; p->thdd = a[1];
}

/* ---- firmware ---- */
typedef struct { double th_est, x_prev; int first; } Ctl;

static double read_gyro(const Plant *p) { return p->thd + 0.01 + 0.002 * gauss(); }          /* 0.01 rad/s bias */
static double read_acc_tilt(const Plant *p) {
  double ax = g * sin(p->th) + p->xdd * cos(p->th) + H_IMU * p->thdd, az = g * cos(p->th) - p->xdd * sin(p->th);
  return atan2(ax + 0.05 * gauss(), az + 0.05 * gauss());
}
static double read_encoder_x(const Plant *p) { double cpr = 1440, ang = p->x / r; return floor(ang / (2 * PI) * cpr) * 2 * PI / cpr * r; }

static double control(Ctl *c, const Plant *p) {
  double gy = read_gyro(p), at = read_acc_tilt(p), x = read_encoder_x(p);
  if (c->first) { c->th_est = at; c->x_prev = x; c->first = 0; }
  c->th_est = 0.995 * (c->th_est + gy * DT_CTRL) + 0.005 * at;                  /* complementary filter */
  double xd = (x - c->x_prev) / DT_CTRL; c->x_prev = x;
  double v = K[0] * x + K[1] * xd + K[2] * c->th_est + K[3] * gy;
  return v > VBAT ? VBAT : (v < -VBAT ? -VBAT : v);
}

int main(void) {
  /* timing budget for one 2 ms period */
  double f_cpu = 84e6, i2c_bits = 2 + 17 * 9;                                   /* start/stop + 17 bytes with ACK */
  double t_i2c = i2c_bits / 400e3 * 1e6, t_cyc[5] = {500, 2000, 1500, 300, 8000};
  const char *names[5] = {"encoder read", "filter", "control", "PWM update", "telemetry"};
  double total = t_i2c; printf("IMU read over I2C at 400 kHz: %.1f us\\n", t_i2c);
  for (int i = 0; i < 5; i++) { double us = t_cyc[i] / f_cpu * 1e6; total += us; printf("%-13s %6.0f cycles %6.1f us\\n", names[i], t_cyc[i], us); }
  printf("total %.1f us of %.0f us: %.1f %% used\\n", total, DT_CTRL * 1e6, 100 * total / (DT_CTRL * 1e6));
  int ok_budget = total < 0.5 * DT_CTRL * 1e6;

  Plant p = {0, 0, 5 * PI / 180, 0, 0, 0}; Ctl c = {0, 0, 1}; double v = 0, maxth = 0, maxv = 0; int steps = (int)(DT_CTRL / DT_SIM + 0.5);
  for (int k = 0; k < 2500; k++) {                                              /* 5 s of 500 Hz loop iterations */
    v = control(&c, &p);
    for (int j = 0; j < steps; j++) { double push = (k >= 1000 && k < 1025) ? 1.5 : 0.0; step(&p, v, push, DT_SIM); }   /* 1.5 N for 50 ms at 2 s */
    if (k > 250 && fabs(p.th) > maxth) maxth = fabs(p.th);
    if (fabs(v) > maxv) maxv = fabs(v);
  }
  printf("5 deg start, 1.5 N push for 50 ms at 2 s: max tilt after 0.5 s %.2f deg, final tilt %.3f deg, final position %.1f cm, peak voltage %.2f V\\n",
         maxth * 180 / PI, p.th * 180 / PI, 100 * p.x, maxv);
  int ok_ctrl = maxth * 180 / PI < 15 && fabs(p.th) * 180 / PI < 1;
  printf(ok_budget && ok_ctrl ? "PASS\\n" : "FAIL\\n");
  return 0;
}`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};