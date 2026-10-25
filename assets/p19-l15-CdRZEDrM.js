var e=`p19-l15`,t=40,n=`A switching converter is a radio transmitter unless its layout keeps fast currents in small loops and fast voltages on small copper. You compute magnetic coupling from a hot loop into a nearby sensor trace with Biot-Savart, show how moving one capacitor cuts it more than thirty times, and see how slower edges shrink the high-frequency spectrum.`,r=`<h2 id="two-coupling-paths">Two coupling paths</h2>
<p>Electromagnetic compatibility (EMC) means a device neither disturbs others nor is disturbed. In a switching converter, two quantities do most of the damage:</p>
<ul>
<li><strong>di/dt in a loop.</strong> The current that switches on and off flows around the <strong>hot loop</strong> (input capacitor, high-side switch, low-side switch). A changing current in a loop of area <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">A</span></span></span></span> makes a magnetic field that induces <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">M</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathrm">d</span><span class="mord mathnormal">i</span><span class="mord">/</span><span class="mord mathrm">d</span><span class="mord mathnormal">t</span></span></span></span> in any nearby loop, with mutual inductance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">M</span></span></span></span> roughly proportional to the loop areas.</li>
<li><strong>dV/dt on a node.</strong> The switch node swings the full input voltage in nanoseconds. Any stray capacitance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span> to a neighbour injects <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6595em;"></span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathrm">d</span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mord">/</span><span class="mord mathrm">d</span><span class="mord mathnormal">t</span></span></span></span>.</li>
</ul>
<h2 id="layout-is-the-fix">Layout is the fix</h2>
<p>Place the input capacitor right against the switches so the hot loop is tiny, return currents on a solid ground plane directly beneath their traces, keep the switch node copper small, and route sensitive traces away. Slowing the edges (gate resistors, Lesson 07) also helps, at the cost of switching loss (Lesson 06). A trapezoidal waveform with rise time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> has a spectrum envelope that falls at 20 dB per decade above <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mord">1/</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight">u</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight">se</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span> and 40 dB per decade above <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1/</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span>.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="loopcoupling" data-args="{}"></div></div><figcaption>A hot loop beside a victim trace. Move the input capacitor closer, change the edge time and the gap, and toggle the ground plane; the readout estimates mutual inductance and the induced spike.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative layout, 2 A switched in 10 ns, victim loop 20 × 10 mm beside the converter:</p>
<ol>
<li>Check: 10 mm from a long wire the code gives 20.000 µT per A, matching <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">μ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mopen">(</span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mclose">)</span></span></span></span>.</li>
<li>Moving the input capacitor next to the switches shrinks the hot loop from 400 to 24 mm².</li>
<li>Mutual inductance falls from 1.056 nH to 0.0330 nH, and the induced spike from 211.2 mV to 6.60 mV: 32 times less coupling.</li>
<li>A 12 V edge in 2 ns (6.0 V/ns) through 0.5 pF injects 3.00 mA; in 10 ns (1.2 V/ns), 0.60 mA. The spectrum corners are 159 MHz and 32 MHz.</li>
<li>Between 200 MHz and 1 GHz the 10 ns edge carries 16.5 dB less power than the 2 ns edge.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">coupling.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

MU0 = <span class="hljs-number">4e-7</span> * np.pi

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bz_segment</span>(<span class="hljs-params">x0, y0, x1, y1, px, py, n=<span class="hljs-number">400</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;z field at points (px, py) from 1 A along a straight segment in the same plane (Biot-Savart, midpoint rule).&quot;&quot;&quot;</span>
    s = (np.arange(n) + <span class="hljs-number">0.5</span>) / n; xs = x0 + (x1 - x0) * s; ys = y0 + (y1 - y0) * s
    dlx, dly = (x1 - x0) / n, (y1 - y0) / n
    rx = px[..., <span class="hljs-literal">None</span>] - xs; ry = py[..., <span class="hljs-literal">None</span>] - ys; r3 = (rx**<span class="hljs-number">2</span> + ry**<span class="hljs-number">2</span>) ** <span class="hljs-number">1.5</span>
    <span class="hljs-keyword">return</span> MU0 / (<span class="hljs-number">4</span> * np.pi) * np.<span class="hljs-built_in">sum</span>((dlx * ry - dly * rx) / r3, axis=-<span class="hljs-number">1</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bz_from_loop</span>(<span class="hljs-params">corners, px, py</span>):
    pts = <span class="hljs-built_in">list</span>(corners) + [corners[<span class="hljs-number">0</span>]]
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">sum</span>(bz_segment(*p, *q, px, py) <span class="hljs-keyword">for</span> p, q <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(pts[:-<span class="hljs-number">1</span>], pts[<span class="hljs-number">1</span>:]))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">mutual</span>(<span class="hljs-params">hot, victim, n=<span class="hljs-number">60</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;mutual inductance: flux through the victim rectangle (x0, y0, x1, y1) from 1 A in the hot loop.&quot;&quot;&quot;</span>
    x0, y0, x1, y1 = victim; xs = np.linspace(x0, x1, n + <span class="hljs-number">1</span>); ys = np.linspace(y0, y1, n + <span class="hljs-number">1</span>)
    xc, yc = (xs[:-<span class="hljs-number">1</span>] + xs[<span class="hljs-number">1</span>:]) / <span class="hljs-number">2</span>, (ys[:-<span class="hljs-number">1</span>] + ys[<span class="hljs-number">1</span>:]) / <span class="hljs-number">2</span>; X, Y = np.meshgrid(xc, yc)
    <span class="hljs-keyword">return</span> np.<span class="hljs-built_in">sum</span>(bz_from_loop(hot, X, Y)) * (xs[<span class="hljs-number">1</span>] - xs[<span class="hljs-number">0</span>]) * (ys[<span class="hljs-number">1</span>] - ys[<span class="hljs-number">0</span>])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rect</span>(<span class="hljs-params">x0, y0, w, h</span>): <span class="hljs-keyword">return</span> [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_biot_savart</span>():
    b = bz_segment(-<span class="hljs-number">10.0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">10.0</span>, <span class="hljs-number">0</span>, np.array([<span class="hljs-number">0.0</span>]), np.array([<span class="hljs-number">0.01</span>]), n=<span class="hljs-number">200000</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;field 10 mm from a long wire: <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(b[<span class="hljs-number">0</span>]) * <span class="hljs-number">1e6</span>:<span class="hljs-number">.3</span>f}</span> uT per A (infinite wire <span class="hljs-subst">{MU0 / (<span class="hljs-number">2</span> * np.pi * <span class="hljs-number">0.01</span>) * <span class="hljs-number">1e6</span>:<span class="hljs-number">.3</span>f}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(<span class="hljs-built_in">abs</span>(b[<span class="hljs-number">0</span>]) - MU0 / (<span class="hljs-number">2</span> * np.pi * <span class="hljs-number">0.01</span>)) / (MU0 / (<span class="hljs-number">2</span> * np.pi * <span class="hljs-number">0.01</span>)) &lt; <span class="hljs-number">0.01</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_layout_change</span>():
    mm = <span class="hljs-number">1e-3</span>; victim = (<span class="hljs-number">25</span> * mm, -<span class="hljs-number">5</span> * mm, <span class="hljs-number">45</span> * mm, <span class="hljs-number">5</span> * mm)                     <span class="hljs-comment"># a 20 x 10 mm sensor trace loop nearby</span>
    before = rect(<span class="hljs-number">0</span>, -<span class="hljs-number">10</span> * mm, <span class="hljs-number">20</span> * mm, <span class="hljs-number">20</span> * mm)                                 <span class="hljs-comment"># input capacitor far from the switches</span>
    after = rect(<span class="hljs-number">5</span> * mm, -<span class="hljs-number">2</span> * mm, <span class="hljs-number">6</span> * mm, <span class="hljs-number">4</span> * mm)                               <span class="hljs-comment"># capacitor right next to the switches</span>
    di_dt = <span class="hljs-number">2.0</span> / <span class="hljs-number">10e-9</span>                                                          <span class="hljs-comment"># 2 A switched in 10 ns</span>
    m0, m1 = mutual(before, victim), mutual(after, victim)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;hot loop area <span class="hljs-subst">{<span class="hljs-number">400</span>:<span class="hljs-number">.0</span>f}</span> -&gt; <span class="hljs-subst">{<span class="hljs-number">24</span>:<span class="hljs-number">.0</span>f}</span> mm^2&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;mutual inductance <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(m0) * <span class="hljs-number">1e9</span>:<span class="hljs-number">.3</span>f}</span> -&gt; <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(m1) * <span class="hljs-number">1e9</span>:<span class="hljs-number">.4</span>f}</span> nH; induced spike <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(m0) * di_dt * <span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> -&gt; <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(m1) * di_dt * <span class="hljs-number">1000</span>:<span class="hljs-number">.2</span>f}</span> mV&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;coupling reduced <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(m0 / m1):<span class="hljs-number">.0</span>f}</span> times&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(m1) &lt; <span class="hljs-built_in">abs</span>(m0) / <span class="hljs-number">10</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_edge_rate</span>():
    vin, c = <span class="hljs-number">12.0</span>, <span class="hljs-number">0.5e-12</span>                                                       <span class="hljs-comment"># 0.5 pF stray capacitance to the victim</span>
    <span class="hljs-keyword">for</span> tr <span class="hljs-keyword">in</span> (<span class="hljs-number">2e-9</span>, <span class="hljs-number">10e-9</span>):
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;rise time <span class="hljs-subst">{tr * <span class="hljs-number">1e9</span>:<span class="hljs-number">.0</span>f}</span> ns: dV/dt <span class="hljs-subst">{vin / tr / <span class="hljs-number">1e9</span>:<span class="hljs-number">.1</span>f}</span> V/ns, injected current <span class="hljs-subst">{c * vin / tr * <span class="hljs-number">1000</span>:<span class="hljs-number">.2</span>f}</span> mA, spectrum corner <span class="hljs-subst">{<span class="hljs-number">1</span> / (np.pi * tr) / <span class="hljs-number">1e6</span>:<span class="hljs-number">.0</span>f}</span> MHz&quot;</span>)
    fs, n = <span class="hljs-number">10e9</span>, <span class="hljs-number">2</span>**<span class="hljs-number">16</span>; t = np.arange(n) / fs; f0 = <span class="hljs-number">1e6</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">spec</span>(<span class="hljs-params">tr</span>):
        <span class="hljs-string">&quot;&quot;&quot;1 MHz, 50 % duty trapezoid with equal rise and fall times, and its spectrum.&quot;&quot;&quot;</span>
        ph = (t * f0) % <span class="hljs-number">1</span> / f0
        v = vin * np.clip(np.minimum(ph / tr, (<span class="hljs-number">0.5</span> / f0 - ph) / tr + <span class="hljs-number">1</span>), <span class="hljs-number">0</span>, <span class="hljs-number">1</span>)
        a = np.<span class="hljs-built_in">abs</span>(np.fft.rfft(v * np.hanning(n))) / n; f = np.fft.rfftfreq(n, <span class="hljs-number">1</span> / fs); <span class="hljs-keyword">return</span> f, a
    f, a2 = spec(<span class="hljs-number">2e-9</span>); _, a10 = spec(<span class="hljs-number">10e-9</span>); band = (f &gt; <span class="hljs-number">200e6</span>) &amp; (f &lt; <span class="hljs-number">1e9</span>)
    gain = <span class="hljs-number">10</span> * np.log10(np.<span class="hljs-built_in">sum</span>(a2[band]**<span class="hljs-number">2</span>) / np.<span class="hljs-built_in">sum</span>(a10[band]**<span class="hljs-number">2</span>))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;200 MHz-1 GHz power: the 10 ns edge is <span class="hljs-subst">{gain:<span class="hljs-number">.1</span>f}</span> dB lower than the 2 ns edge (envelope ratio <span class="hljs-subst">{<span class="hljs-number">20</span> * np.log10(<span class="hljs-number">5</span>):<span class="hljs-number">.1</span>f}</span> dB)&quot;</span>)
    <span class="hljs-keyword">assert</span> gain &gt; <span class="hljs-number">10</span>

test_biot_savart()
test_layout_change()
test_edge_rate()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Layout happens in a PCB tool such as KiCad, where you place the input capacitor first, keep the hot loop on one layer over an unbroken ground plane, and check the switch node’s copper area. Field solvers (openEMS, commercial 3D tools) refine estimates like these, and pre-compliance scans with a near-field probe and spectrum analyser find problems before a formal test against limits such as CISPR 32 or CISPR 25.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A 3 nH stray inductance carries a current that changes by 4 A in 8 ns. What spike appears across it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">L</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathrm">d</span><span class="mord mathnormal">i</span><span class="mord">/</span><span class="mord mathrm">d</span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">9</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">4/8</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">9</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.5</span></span></span></span> V.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does a ground plane under a trace reduce its radiated field?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The return current flows in the plane directly under the trace, so the loop area is the trace length times the small height above the plane. A smaller loop has a smaller magnetic moment and smaller mutual inductance to everything nearby.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l15"></div>
`,i=[{id:`two-coupling-paths`,title:`Two coupling paths`},{id:`layout-is-the-fix`,title:`Layout is the fix`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l15-q1`,type:`num`,q:`<p>Induced voltage for M = 0.5 nH and di/dt = 1 A/ns (V)?</p>
`,explain:`<p>v = M di/dt.</p>
`,answer:.5,tol:.002,unit:``},{id:`p19-l15-q2`,type:`num`,q:`<p>Current injected through 1 pF by 24 V in 4 ns (mA)?</p>
`,explain:`<p>i = C dV/dt.</p>
`,answer:6,tol:.002,unit:``},{id:`p19-l15-q3`,type:`num`,q:`<p>Spectrum corner frequency for a 5 ns rise time (MHz)?</p>
`,explain:`<p>1/(π tr).</p>
`,answer:63.7,tol:.003,unit:``},{id:`p19-l15-q4`,type:`num`,q:`<p>Field 5 mm from a long wire carrying 1 A (µT)?</p>
`,explain:`<p>μ0 I / (2π r).</p>
`,answer:40,tol:.002,unit:``},{id:`p19-l15-q5`,type:`mc`,q:`<p>What is the first layout step for a buck converter?</p>
`,explain:`<p>It minimises the hot loop.</p>
`,options:[`Make the switch node copper large`,`Place the input capacitor tight against the switches`,`Route the feedback trace first`,`Put the inductor far away`],answer:1},{id:`p19-l15-q6`,type:`mc`,q:`<p>Slower switching edges…</p>
`,explain:`<p>The classic trade-off.</p>
`,options:[`reduce high-frequency emissions but increase switching loss`,`increase emissions`,`reduce both emissions and loss`,`have no effect on EMC`],answer:0}],o=[{file:`coupling.py`,lang:`python`,src:`import numpy as np

MU0 = 4e-7 * np.pi

def bz_segment(x0, y0, x1, y1, px, py, n=400):
    """z field at points (px, py) from 1 A along a straight segment in the same plane (Biot-Savart, midpoint rule)."""
    s = (np.arange(n) + 0.5) / n; xs = x0 + (x1 - x0) * s; ys = y0 + (y1 - y0) * s
    dlx, dly = (x1 - x0) / n, (y1 - y0) / n
    rx = px[..., None] - xs; ry = py[..., None] - ys; r3 = (rx**2 + ry**2) ** 1.5
    return MU0 / (4 * np.pi) * np.sum((dlx * ry - dly * rx) / r3, axis=-1)

def bz_from_loop(corners, px, py):
    pts = list(corners) + [corners[0]]
    return sum(bz_segment(*p, *q, px, py) for p, q in zip(pts[:-1], pts[1:]))

def mutual(hot, victim, n=60):
    """mutual inductance: flux through the victim rectangle (x0, y0, x1, y1) from 1 A in the hot loop."""
    x0, y0, x1, y1 = victim; xs = np.linspace(x0, x1, n + 1); ys = np.linspace(y0, y1, n + 1)
    xc, yc = (xs[:-1] + xs[1:]) / 2, (ys[:-1] + ys[1:]) / 2; X, Y = np.meshgrid(xc, yc)
    return np.sum(bz_from_loop(hot, X, Y)) * (xs[1] - xs[0]) * (ys[1] - ys[0])

def rect(x0, y0, w, h): return [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]

def test_biot_savart():
    b = bz_segment(-10.0, 0, 10.0, 0, np.array([0.0]), np.array([0.01]), n=200000)
    print(f"field 10 mm from a long wire: {abs(b[0]) * 1e6:.3f} uT per A (infinite wire {MU0 / (2 * np.pi * 0.01) * 1e6:.3f})")
    assert abs(abs(b[0]) - MU0 / (2 * np.pi * 0.01)) / (MU0 / (2 * np.pi * 0.01)) < 0.01

def test_layout_change():
    mm = 1e-3; victim = (25 * mm, -5 * mm, 45 * mm, 5 * mm)                     # a 20 x 10 mm sensor trace loop nearby
    before = rect(0, -10 * mm, 20 * mm, 20 * mm)                                 # input capacitor far from the switches
    after = rect(5 * mm, -2 * mm, 6 * mm, 4 * mm)                               # capacitor right next to the switches
    di_dt = 2.0 / 10e-9                                                          # 2 A switched in 10 ns
    m0, m1 = mutual(before, victim), mutual(after, victim)
    print(f"hot loop area {400:.0f} -> {24:.0f} mm^2")
    print(f"mutual inductance {abs(m0) * 1e9:.3f} -> {abs(m1) * 1e9:.4f} nH; induced spike {abs(m0) * di_dt * 1000:.1f} -> {abs(m1) * di_dt * 1000:.2f} mV")
    print(f"coupling reduced {abs(m0 / m1):.0f} times")
    assert abs(m1) < abs(m0) / 10

def test_edge_rate():
    vin, c = 12.0, 0.5e-12                                                       # 0.5 pF stray capacitance to the victim
    for tr in (2e-9, 10e-9):
        print(f"rise time {tr * 1e9:.0f} ns: dV/dt {vin / tr / 1e9:.1f} V/ns, injected current {c * vin / tr * 1000:.2f} mA, spectrum corner {1 / (np.pi * tr) / 1e6:.0f} MHz")
    fs, n = 10e9, 2**16; t = np.arange(n) / fs; f0 = 1e6
    def spec(tr):
        """1 MHz, 50 % duty trapezoid with equal rise and fall times, and its spectrum."""
        ph = (t * f0) % 1 / f0
        v = vin * np.clip(np.minimum(ph / tr, (0.5 / f0 - ph) / tr + 1), 0, 1)
        a = np.abs(np.fft.rfft(v * np.hanning(n))) / n; f = np.fft.rfftfreq(n, 1 / fs); return f, a
    f, a2 = spec(2e-9); _, a10 = spec(10e-9); band = (f > 200e6) & (f < 1e9)
    gain = 10 * np.log10(np.sum(a2[band]**2) / np.sum(a10[band]**2))
    print(f"200 MHz-1 GHz power: the 10 ns edge is {gain:.1f} dB lower than the 2 ns edge (envelope ratio {20 * np.log10(5):.1f} dB)")
    assert gain > 10

test_biot_savart()
test_layout_change()
test_edge_rate()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};