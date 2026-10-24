var e=`p07-l01`,t=35,n=`A datasheet lists range, resolution, accuracy, linearity, hysteresis, noise and bandwidth, and each one is a different way the reading can lie. You separate accuracy from precision, build a sensor model with gain, offset, non-linearity, noise and saturation, and check that it reproduces a datasheet error budget.`,r=`<h2 id="the-vocabulary-of-a-datasheet">The vocabulary of a datasheet</h2>
<p>A sensor turns a physical quantity into a signal. Its datasheet describes how faithfully it does that:</p>
<ul>
<li><strong>Range</strong>: the inputs it measures, with the output range, for example 0–100 kPa giving 0.5–4.5 V. Outside the range it <strong>saturates</strong>.</li>
<li><strong>Sensitivity</strong>: output per unit input, here 40 mV/kPa. <strong>Resolution</strong> is the smallest change you can detect, set by noise or the ADC step.</li>
<li><strong>Offset</strong> (zero error) and <strong>gain error</strong> (span error): the straight-line errors, which calibration removes (lesson 2).</li>
<li><strong>Non-linearity</strong>: the worst deviation from the best straight line, in % of full scale (% FS).</li>
<li><strong>Hysteresis</strong>: a different output for the same input approached from below or above.</li>
<li><strong>Noise and repeatability</strong>: random scatter from one reading to the next.</li>
<li><strong>Bandwidth or response time</strong>: how fast it follows a change (Phase 03).</li>
</ul>
<h2 id="accuracy-is-not-precision">Accuracy is not precision</h2>
<p>Take many readings of the same true value. Their <strong>mean</strong> minus the truth is the <strong>bias</strong>: systematic error, poor accuracy. Their <strong>standard deviation</strong> is the scatter: random error, poor precision. A sensor can be precise but inaccurate (tight cluster, wrong place). Averaging removes scatter (by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1133em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9267em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span><span style="top:-2.8867em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1133em;"><span></span></span></span></span></span></span></span></span>, Phase 04) but never bias; calibration removes bias but not scatter.</p>
<h2 id="error-budgets">Error budgets</h2>
<p>To state the total error, combine the error sources:</p>
<ul>
<li><strong>Worst case</strong>: add the magnitudes. Guaranteed, but pessimistic.</li>
<li><strong>Root sum of squares (RSS)</strong>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.24em;vertical-align:-0.2955em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9445em;"><span class="svg-align" style="top:-3.2em;"><span class="pstrut" style="height:3.2em;"></span><span class="mord" style="padding-left:1em;"><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">e</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7959em;"><span style="top:-2.4231em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.0448em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2769em;"><span></span></span></span></span></span></span></span></span><span style="top:-2.9045em;"><span class="pstrut" style="height:3.2em;"></span><span class="hide-tail" style="min-width:1.02em;height:1.28em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.28em" viewBox="0 0 400000 1296" preserveAspectRatio="xMinYMin slice"><path d="M263,681c0.7,0,18,39.7,52,119
c34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120
c340,-704.7,510.7,-1060.3,512,-1067
l0 -0
c4.7,-7.3,11,-11,19,-11
H40000v40H1012.3
s-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232
c-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1
s-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26
c-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z
M1001 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2955em;"><span></span></span></span></span></span></span></span></span> for independent errors. More realistic, because the errors rarely all line up.</li>
</ul>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="sensorchar" data-args="{}"></div></div><figcaption>A sensor’s rising (lime) and falling (blue) characteristic against the ideal line. Each slider adds one datasheet error; the readout shows the worst total.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A 0–100 kPa pressure sensor’s datasheet gives: offset ±0.5 % FS, gain error ±1.5 % FS, non-linearity ±0.25 % FS, hysteresis 0.1 % FS and noise 0.05 % FS rms.</p>
<ol>
<li>Worst case: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1.5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.25</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.35</span></span></span></span> % FS, which is ±2.35 kPa.</li>
<li>RSS of the systematic terms: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1266em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9134em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord">0.</span><span class="mord"><span class="mord">5</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">1.</span><span class="mord"><span class="mord">5</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">0.2</span><span class="mord"><span class="mord">5</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">0.</span><span class="mord"><span class="mord">1</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span><span style="top:-2.8734em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1266em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.60</span></span></span></span> % FS.</li>
<li>A one-time calibration removes offset and gain, leaving <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1266em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9134em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord">0.2</span><span class="mord"><span class="mord">5</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">0.</span><span class="mord"><span class="mord">1</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span><span style="top:-2.8734em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1266em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.27</span></span></span></span> % FS plus noise.</li>
<li>Noise at 0.05 % FS rms is 0.05 kPa; averaging 16 readings brings it to 0.0125 kPa.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">sensor_model.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">class</span> <span class="hljs-title class_">SensorModel</span>:
    <span class="hljs-string">&quot;&quot;&quot;0-100 kPa in, 0.5-4.5 V out, with gain, offset, bow non-linearity, hysteresis, noise and saturation.&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, gain_err=<span class="hljs-number">0.0</span>, offset_fs=<span class="hljs-number">0.0</span>, nl_fs=<span class="hljs-number">0.0</span>, hys_fs=<span class="hljs-number">0.0</span>, noise_fs=<span class="hljs-number">0.0</span>, seed=<span class="hljs-number">0</span></span>):
        <span class="hljs-variable language_">self</span>.g, <span class="hljs-variable language_">self</span>.o, <span class="hljs-variable language_">self</span>.nl, <span class="hljs-variable language_">self</span>.hys, <span class="hljs-variable language_">self</span>.noise = gain_err, offset_fs, nl_fs, hys_fs, noise_fs
        <span class="hljs-variable language_">self</span>.rng = np.random.default_rng(seed)
        <span class="hljs-variable language_">self</span>.last = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">read</span>(<span class="hljs-params">self, p</span>):
        x = p / <span class="hljs-number">100.0</span>                                          <span class="hljs-comment"># fraction of full scale</span>
        rising = p &gt;= <span class="hljs-variable language_">self</span>.last
        <span class="hljs-variable language_">self</span>.last = p
        y = x * (<span class="hljs-number">1</span> + <span class="hljs-variable language_">self</span>.g) + <span class="hljs-variable language_">self</span>.o + <span class="hljs-variable language_">self</span>.nl * <span class="hljs-number">4</span> * x * (<span class="hljs-number">1</span> - x) + (-<span class="hljs-number">0.5</span> <span class="hljs-keyword">if</span> rising <span class="hljs-keyword">else</span> <span class="hljs-number">0.5</span>) * <span class="hljs-variable language_">self</span>.hys
        y += <span class="hljs-variable language_">self</span>.noise * <span class="hljs-variable language_">self</span>.rng.standard_normal()
        v = <span class="hljs-number">0.5</span> + <span class="hljs-number">4.0</span> * y
        <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(np.clip(v, <span class="hljs-number">0.25</span>, <span class="hljs-number">4.75</span>))                   <span class="hljs-comment"># output stage saturates</span>
<span class="hljs-meta">    @staticmethod</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">to_kpa</span>(<span class="hljs-params">v</span>):
        <span class="hljs-keyword">return</span> (v - <span class="hljs-number">0.5</span>) / <span class="hljs-number">4.0</span> * <span class="hljs-number">100</span>

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    spec = <span class="hljs-built_in">dict</span>(offset_fs=<span class="hljs-number">0.005</span>, gain_err=<span class="hljs-number">0.015</span>, nl_fs=<span class="hljs-number">0.0025</span>, hys_fs=<span class="hljs-number">0.001</span>)
    worst = <span class="hljs-built_in">sum</span>(spec.values()) * <span class="hljs-number">100</span>
    rss = np.sqrt(<span class="hljs-built_in">sum</span>(v**<span class="hljs-number">2</span> <span class="hljs-keyword">for</span> v <span class="hljs-keyword">in</span> spec.values())) * <span class="hljs-number">100</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(worst - <span class="hljs-number">2.35</span>) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(rss - <span class="hljs-number">1.60</span>) &lt; <span class="hljs-number">0.005</span>
    <span class="hljs-comment"># worst-case corner: all errors at their limit, read at full scale while rising</span>
    s = SensorModel(gain_err=<span class="hljs-number">0.015</span>, offset_fs=<span class="hljs-number">0.005</span>, nl_fs=<span class="hljs-number">0.0</span>, hys_fs=<span class="hljs-number">0.001</span>)
    s.last = -<span class="hljs-number">1</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(s.to_kpa(s.read(<span class="hljs-number">100</span>)) - <span class="hljs-number">100</span> - (<span class="hljs-number">1.5</span> + <span class="hljs-number">0.5</span> - <span class="hljs-number">0.05</span>)) &lt; <span class="hljs-number">1e-9</span>
    <span class="hljs-comment"># random parts within the spec never exceed the worst case</span>
    rng = np.random.default_rng(<span class="hljs-number">1</span>)
    errs = []
    <span class="hljs-keyword">for</span> part <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">2000</span>):
        e = {k: v * rng.uniform(-<span class="hljs-number">1</span>, <span class="hljs-number">1</span>) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> spec.items()}
        e[<span class="hljs-string">&quot;hys_fs&quot;</span>] = spec[<span class="hljs-string">&quot;hys_fs&quot;</span>]
        m = SensorModel(**e, seed=part)
        <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">100</span>, <span class="hljs-number">21</span>):
            errs.append(m.to_kpa(m.read(p)) - p)
    errs = np.<span class="hljs-built_in">abs</span>(errs)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;max error over 2000 parts <span class="hljs-subst">{errs.<span class="hljs-built_in">max</span>():<span class="hljs-number">.2</span>f}</span> kPa (worst case <span class="hljs-subst">{worst:<span class="hljs-number">.2</span>f}</span>), 99th percentile <span class="hljs-subst">{np.percentile(errs, <span class="hljs-number">99</span>):<span class="hljs-number">.2</span>f}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> errs.<span class="hljs-built_in">max</span>() &lt;= worst <span class="hljs-keyword">and</span> np.percentile(errs, <span class="hljs-number">99</span>) &lt; rss
    <span class="hljs-comment"># accuracy against precision: bias survives averaging, scatter does not</span>
    m = SensorModel(offset_fs=<span class="hljs-number">0.01</span>, noise_fs=<span class="hljs-number">0.002</span>, seed=<span class="hljs-number">3</span>)
    r = np.array([m.to_kpa(m.read(<span class="hljs-number">50</span>)) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">10_000</span>)])
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(r.mean() - <span class="hljs-number">50</span> - <span class="hljs-number">1.0</span>) &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(r.std() - <span class="hljs-number">0.2</span>) &lt; <span class="hljs-number">0.01</span>
    <span class="hljs-keyword">assert</span> SensorModel().read(<span class="hljs-number">150</span>) == <span class="hljs-number">4.75</span>                        <span class="hljs-comment"># saturates above range</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A temperature sensor reads 25.3, 25.4, 25.3, 25.2, 25.3 °C in a bath known to be 24.0 °C. Comment on its accuracy and precision.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The mean is 25.3 °C, a bias of +1.3 K, so the accuracy is poor. The scatter is about 0.07 K, so the precision is good. A one-point offset calibration would fix it.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does a worst-case budget overstate the typical error of a production batch?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>It assumes every error is at its limit with the same sign. Independent errors partly cancel, so the typical total follows RSS: here 1.60 % rather than 2.35 %.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p07-l01"></div>

`,i=[{id:`the-vocabulary-of-a-datasheet`,title:`The vocabulary of a datasheet`},{id:`accuracy-is-not-precision`,title:`Accuracy is not precision`},{id:`error-budgets`,title:`Error budgets`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p07-l01-q1`,type:`num`,q:`<p>Worst-case total of 0.5, 1.5, 0.25 and 0.1 % FS?</p>
`,explain:`<p>Add the magnitudes.</p>
`,answer:2.35,tol:.001,unit:`% FS`},{id:`p07-l01-q2`,type:`num`,q:`<p>RSS total of the same four errors?</p>
`,explain:`<p>Root of the sum of squares.</p>
`,answer:1.6035,tol:.002,unit:`% FS`},{id:`p07-l01-q3`,type:`mc`,q:`<p>Averaging many readings removes…</p>
`,explain:`<p>The mean converges to truth plus bias.</p>
`,options:[`bias`,`random scatter, but not bias`,`hysteresis`,`gain error`],answer:1},{id:`p07-l01-q4`,type:`num`,q:`<p>Sensitivity in mV/kPa of a 0–100 kPa sensor with a 0.5–4.5 V output?</p>
`,explain:`<p>4 V over 100 kPa.</p>
`,answer:40,tol:.001,unit:`mV/kPa`},{id:`p07-l01-q5`,type:`mc`,q:`<p>Different outputs for the same input approached from above and below is…</p>
`,explain:`<p>It depends on the history.</p>
`,options:[`non-linearity`,`hysteresis`,`noise`,`offset`],answer:1},{id:`p07-l01-q6`,type:`num`,q:`<p>Noise in kPa after averaging 16 readings of 0.05 kPa rms noise?</p>
`,explain:`<p>Divide by √16.</p>
`,answer:.0125,tol:.001,unit:`kPa`}],o=[{file:`sensor_model.py`,lang:`python`,src:`import numpy as np

class SensorModel:
    """0-100 kPa in, 0.5-4.5 V out, with gain, offset, bow non-linearity, hysteresis, noise and saturation."""
    def __init__(self, gain_err=0.0, offset_fs=0.0, nl_fs=0.0, hys_fs=0.0, noise_fs=0.0, seed=0):
        self.g, self.o, self.nl, self.hys, self.noise = gain_err, offset_fs, nl_fs, hys_fs, noise_fs
        self.rng = np.random.default_rng(seed)
        self.last = 0.0
    def read(self, p):
        x = p / 100.0                                          # fraction of full scale
        rising = p >= self.last
        self.last = p
        y = x * (1 + self.g) + self.o + self.nl * 4 * x * (1 - x) + (-0.5 if rising else 0.5) * self.hys
        y += self.noise * self.rng.standard_normal()
        v = 0.5 + 4.0 * y
        return float(np.clip(v, 0.25, 4.75))                   # output stage saturates
    @staticmethod
    def to_kpa(v):
        return (v - 0.5) / 4.0 * 100

if __name__ == "__main__":
    spec = dict(offset_fs=0.005, gain_err=0.015, nl_fs=0.0025, hys_fs=0.001)
    worst = sum(spec.values()) * 100
    rss = np.sqrt(sum(v**2 for v in spec.values())) * 100
    assert abs(worst - 2.35) < 1e-9 and abs(rss - 1.60) < 0.005
    # worst-case corner: all errors at their limit, read at full scale while rising
    s = SensorModel(gain_err=0.015, offset_fs=0.005, nl_fs=0.0, hys_fs=0.001)
    s.last = -1
    assert abs(s.to_kpa(s.read(100)) - 100 - (1.5 + 0.5 - 0.05)) < 1e-9
    # random parts within the spec never exceed the worst case
    rng = np.random.default_rng(1)
    errs = []
    for part in range(2000):
        e = {k: v * rng.uniform(-1, 1) for k, v in spec.items()}
        e["hys_fs"] = spec["hys_fs"]
        m = SensorModel(**e, seed=part)
        for p in np.linspace(0, 100, 21):
            errs.append(m.to_kpa(m.read(p)) - p)
    errs = np.abs(errs)
    print(f"max error over 2000 parts {errs.max():.2f} kPa (worst case {worst:.2f}), 99th percentile {np.percentile(errs, 99):.2f}")
    assert errs.max() <= worst and np.percentile(errs, 99) < rss
    # accuracy against precision: bias survives averaging, scatter does not
    m = SensorModel(offset_fs=0.01, noise_fs=0.002, seed=3)
    r = np.array([m.to_kpa(m.read(50)) for _ in range(10_000)])
    assert abs(r.mean() - 50 - 1.0) < 0.01 and abs(r.std() - 0.2) < 0.01
    assert SensorModel().read(150) == 4.75                        # saturates above range`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};