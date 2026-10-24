var e=`p14-l14`,t=40,n=`A Kalman filter is only optimal if Q and R describe the real noise, and the filter’s own innovations tell you whether they do. You derive the normalised innovation squared and its chi-square bounds, estimate R from a log of a stationary sensor, tune q from a driving log until the NIS is consistent, and test that the tuned filter passes while filters with q 100 times off fail in opposite directions.`,r=`<h2 id="innovations-as-a-health-check">Innovations as a health check</h2>
<p>The innovation <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.044em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1128em;vertical-align:-0.3013em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6944em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">x</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.2222em;"><span class="mord">^</span></span></span></span></span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8115em;"><span style="top:-2.3987em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3.1031em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">−</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3013em;"><span></span></span></span></span></span></span></span></span></span> has covariance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1426em;vertical-align:-0.3013em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8115em;"><span style="top:-2.3987em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3.1031em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">−</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3013em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8413em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span>, as computed by the filter. If the model and noise settings are right:</p>
<ul>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> is zero-mean and <strong>white</strong> (uncorrelated in time);</li>
<li>the <strong>normalised innovation squared</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0637em;">ν</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0637em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1555em;vertical-align:-0.3013em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8413em;"><span style="top:-2.4169em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.1389em;">T</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2831em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8542em;"><span style="top:-2.3987em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3.1031em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3013em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> is chi-square with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">m</span></span></span></span> degrees of freedom (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">m</span></span></span></span> = measurement dimension), mean <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">m</span></span></span></span>;</li>
<li>about 95 % of scalar innovations fall within <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1883em;"></span><span class="mord">±</span><span class="mord">2</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8517em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span><span style="top:-2.8117em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1883em;"><span></span></span></span></span></span></span></span></span>.</li>
</ul>
<p>Unlike NEES (lesson 12), NIS needs no ground truth: it works on real logs.</p>
<p>Over <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> steps, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.5678em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0637em;">ν</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.2222em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span> is chi-square with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord mathnormal">m</span></span></span></span> degrees of freedom, giving a band for the average. Average NIS above the band: the filter is overconfident (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span></span></span></span> or <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> too small). Below: too cautious.</p>
<h2 id="a-tuning-recipe">A tuning recipe</h2>
<ol>
<li><strong>R first</strong>, from a log with the system still: the sample variance of the sensor reading is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> (if the sensor’s noise doesn’t depend on motion).</li>
<li><strong>Q next</strong>, from a log of normal operation: sweep <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span> and pick the value whose average NIS is closest to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">m</span></span></span></span>.</li>
<li><strong>Check whiteness</strong>: correlated innovations (a lag-1 autocorrelation well above zero) mean the model is missing dynamics, typically <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span> too small.</li>
</ol>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="nisplot" data-args="{}"></div></div><figcaption>Innovations of a position filter with their 2-sigma bounds, and the running average NIS against its chi-square band. Slide the assumed q away from the truth: too small and the innovations burst through the bounds; too large and they huddle inside.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Position sensor with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">σ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.3</span></span></span></span> m, true <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span> m²/s³, 10 Hz, 3000 samples.</p>
<ol>
<li>Parked log (500 samples): sample standard deviation 0.307 m, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.094</span></span></span></span> m².</li>
<li>Sweep <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span>: the average NIS is closest to 1 at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6776em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.6</span></span></span></span>, within the 95 % band [0.950, 1.051]. 95.7 % of innovations fall inside 2 sigma.</li>
<li>With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.02</span></span></span></span>: average NIS 5.8 and lag-1 autocorrelation 0.83. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">200</span></span></span></span>: average NIS 0.54.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">tuning_q_r.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy.stats <span class="hljs-keyword">import</span> chi2

dt = <span class="hljs-number">0.1</span>
F = np.array([[<span class="hljs-number">1</span>, dt], [<span class="hljs-number">0</span>, <span class="hljs-number">1</span>]]); H = np.array([[<span class="hljs-number">1.0</span>, <span class="hljs-number">0.0</span>]])
Qof = <span class="hljs-keyword">lambda</span> q: q * np.array([[dt**<span class="hljs-number">3</span> / <span class="hljs-number">3</span>, dt**<span class="hljs-number">2</span> / <span class="hljs-number">2</span>], [dt**<span class="hljs-number">2</span> / <span class="hljs-number">2</span>, dt]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_log</span>(<span class="hljs-params">q_true=<span class="hljs-number">2.0</span>, r_true=<span class="hljs-number">0.3</span>**<span class="hljs-number">2</span>, n=<span class="hljs-number">3000</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;a &#x27;recorded&#x27; log: a cart moving with random acceleration, measured by a noisy position sensor&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); L = np.linalg.cholesky(Qof(q_true)); x = np.zeros(<span class="hljs-number">2</span>); z = []
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        x = F @ x + L @ rng.normal(size=<span class="hljs-number">2</span>); z.append(H @ x + np.sqrt(r_true) * rng.normal(size=<span class="hljs-number">1</span>))
    parked = np.sqrt(r_true) * rng.normal(size=<span class="hljs-number">500</span>) + <span class="hljs-number">1.234</span>    <span class="hljs-comment"># a separate log with the cart standing still</span>
    <span class="hljs-keyword">return</span> np.array(z), parked

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run_filter</span>(<span class="hljs-params">z, q, r</span>):
    x = np.array([z[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>], <span class="hljs-number">0.0</span>]); P = np.diag([r, <span class="hljs-number">10.0</span>]); R = np.array([[r]]); nis, innov, bounds = [], [], []
    <span class="hljs-keyword">for</span> zk <span class="hljs-keyword">in</span> z[<span class="hljs-number">1</span>:]:
        x = F @ x; P = F @ P @ F.T + Qof(q)
        S = H @ P @ H.T + R; y = zk - H @ x; K = P @ H.T / S[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]
        x = x + K @ y; P = (np.eye(<span class="hljs-number">2</span>) - K @ H) @ P
        nis.append(<span class="hljs-built_in">float</span>(y @ y / S[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>])); innov.append(<span class="hljs-built_in">float</span>(y[<span class="hljs-number">0</span>])); bounds.append(<span class="hljs-number">2</span> * np.sqrt(S[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]))
    <span class="hljs-keyword">return</span> np.array(nis), np.array(innov), np.array(bounds)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">nis_band</span>(<span class="hljs-params">n, m=<span class="hljs-number">1</span>, p=<span class="hljs-number">0.95</span></span>):
    lo, hi = chi2.ppf([(<span class="hljs-number">1</span> - p) / <span class="hljs-number">2</span>, (<span class="hljs-number">1</span> + p) / <span class="hljs-number">2</span>], n * m) / n
    <span class="hljs-keyword">return</span> lo, hi

<span class="hljs-keyword">def</span> <span class="hljs-title function_">tune_q</span>(<span class="hljs-params">z, r, qs=np.logspace(<span class="hljs-params">-<span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">41</span></span>)</span>):
    <span class="hljs-string">&quot;&quot;&quot;pick the q whose average NIS is closest to its expected value m = 1&quot;&quot;&quot;</span>
    scores = [<span class="hljs-built_in">abs</span>(np.mean(run_filter(z, q, r)[<span class="hljs-number">0</span>]) - <span class="hljs-number">1.0</span>) <span class="hljs-keyword">for</span> q <span class="hljs-keyword">in</span> qs]
    <span class="hljs-keyword">return</span> qs[<span class="hljs-built_in">int</span>(np.argmin(scores))]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_r_from_parked_log</span>():
    _, parked = make_log()
    r_hat = np.var(parked, ddof=<span class="hljs-number">1</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;R from the parked log: sigma = <span class="hljs-subst">{np.sqrt(r_hat):<span class="hljs-number">.4</span>f}</span> m (true 0.3)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(np.sqrt(r_hat) / <span class="hljs-number">0.3</span> - <span class="hljs-number">1</span>) &lt; <span class="hljs-number">0.08</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_tuned_filter_passes_nis</span>():
    z, parked = make_log(); r = np.var(parked, ddof=<span class="hljs-number">1</span>); q = tune_q(z, r)
    nis, innov, b = run_filter(z, q, r)
    lo, hi = nis_band(<span class="hljs-built_in">len</span>(nis))
    inside = np.mean(np.<span class="hljs-built_in">abs</span>(innov) &lt; b)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;tuned q = <span class="hljs-subst">{q:<span class="hljs-number">.2</span>f}</span> (true 2.0): average NIS <span class="hljs-subst">{nis.mean():<span class="hljs-number">.3</span>f}</span> in [<span class="hljs-subst">{lo:<span class="hljs-number">.3</span>f}</span>, <span class="hljs-subst">{hi:<span class="hljs-number">.3</span>f}</span>], <span class="hljs-subst">{inside:<span class="hljs-number">.1</span>%}</span> of innovations inside 2 sigma&quot;</span>)
    <span class="hljs-keyword">assert</span> lo &lt; nis.mean() &lt; hi <span class="hljs-keyword">and</span> <span class="hljs-number">0.5</span> &lt; q / <span class="hljs-number">2.0</span> &lt; <span class="hljs-number">2.0</span> <span class="hljs-keyword">and</span> <span class="hljs-number">0.93</span> &lt; inside &lt; <span class="hljs-number">0.97</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_mistuned_filters_fail_nis</span>():
    z, parked = make_log(); r = np.var(parked, ddof=<span class="hljs-number">1</span>); lo, hi = nis_band(<span class="hljs-built_in">len</span>(z) - <span class="hljs-number">1</span>)
    small = run_filter(z, <span class="hljs-number">0.02</span>, r)[<span class="hljs-number">0</span>].mean(); big = run_filter(z, <span class="hljs-number">200.0</span>, r)[<span class="hljs-number">0</span>].mean()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;q 100x too small: average NIS <span class="hljs-subst">{small:<span class="hljs-number">.2</span>f}</span> (overconfident); q 100x too large: <span class="hljs-subst">{big:<span class="hljs-number">.3</span>f}</span> (too cautious)&quot;</span>)
    <span class="hljs-keyword">assert</span> small &gt; hi <span class="hljs-keyword">and</span> big &lt; lo

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_innovations_white</span>():
    z, parked = make_log(); r = np.var(parked, ddof=<span class="hljs-number">1</span>)
    _, innov, _ = run_filter(z, tune_q(z, r), r); y = innov - innov.mean()
    rho1 = np.<span class="hljs-built_in">sum</span>(y[<span class="hljs-number">1</span>:] * y[:-<span class="hljs-number">1</span>]) / np.<span class="hljs-built_in">sum</span>(y * y)
    _, innov_bad, _ = run_filter(z, <span class="hljs-number">0.02</span>, r); yb = innov_bad - innov_bad.mean()
    rho_bad = np.<span class="hljs-built_in">sum</span>(yb[<span class="hljs-number">1</span>:] * yb[:-<span class="hljs-number">1</span>]) / np.<span class="hljs-built_in">sum</span>(yb * yb)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;lag-1 autocorrelation of innovations: tuned <span class="hljs-subst">{rho1:+<span class="hljs-number">.3</span>f}</span>, q too small <span class="hljs-subst">{rho_bad:+<span class="hljs-number">.3</span>f}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(rho1) &lt; <span class="hljs-number">0.1</span> <span class="hljs-keyword">and</span> rho_bad &gt; <span class="hljs-number">0.3</span>

test_r_from_parked_log()
test_tuned_filter_passes_nis()
test_mistuned_filters_fail_nis()
test_innovations_white()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>The tuned <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span> came out at 1.6 rather than the true 2.0. Is that a failure?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>No. The average NIS is a statistic of a finite log, and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> was itself estimated (about 2 % high in standard deviation here, 5 % in variance, which pushes <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span> down to compensate). The filter’s performance is flat near the optimum, so a factor of 1.3 in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span></span></span></span> barely changes the error. What matters is that the consistency tests pass.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Average NIS looks fine, but innovations are strongly correlated. What does that suggest?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The model is wrong in a way that the noise levels can’t fix, for example a missing bias state or an unmodelled resonance. Errors that persist from one step to the next show up as correlation. Add the missing state (as the attitude filter in lesson 17 does with gyro bias) rather than inflating <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span></span></span></span>.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p14-l14"></div>
`,i=[{id:`innovations-as-a-health-check`,title:`Innovations as a health check`},{id:`a-tuning-recipe`,title:`A tuning recipe`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p14-l14-q1`,type:`num`,q:`<p>Expected NIS for a 2-D position measurement?</p>
`,explain:`<p>Chi-square with m = 2 has mean 2.</p>
`,answer:2,tol:.001,unit:``},{id:`p14-l14-q2`,type:`num`,q:`<p>Upper 97.5 % point of the average NIS over 2999 scalar innovations?</p>
`,explain:`<p>chi2(N)/N.</p>
`,answer:1.0513,tol:.002,unit:``},{id:`p14-l14-q3`,type:`num`,q:`<p>R in m² for a sensor with 0.3 m standard deviation?</p>
`,explain:`<p>The variance.</p>
`,answer:.09,tol:.001,unit:`m²`},{id:`p14-l14-q4`,type:`num`,q:`<p>Fraction of scalar innovations expected inside ±2√S?</p>
`,explain:`<p>The Gaussian 2-sigma probability.</p>
`,answer:.9545,tol:.002,unit:``},{id:`p14-l14-q5`,type:`mc`,q:`<p>Average NIS well above its band means…</p>
`,explain:`<p>Innovations are bigger than the filter expects.</p>
`,options:[`Q or R is too small and the filter is overconfident`,`Q or R is too large`,`the filter is optimal`,`the sensor is perfect`],answer:0},{id:`p14-l14-q6`,type:`mc`,q:`<p>Why is NIS usable on real logs when NEES is not?</p>
`,explain:`<p>NEES needs ground truth.</p>
`,options:[`it needs only measurements, not the true state`,`it is always smaller`,`it ignores R`,`it needs no covariance`],answer:0}],o=[{file:`tuning_q_r.py`,lang:`python`,src:`import numpy as np
from scipy.stats import chi2

dt = 0.1
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]])
Qof = lambda q: q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])

def make_log(q_true=2.0, r_true=0.3**2, n=3000, seed=0):
    """a 'recorded' log: a cart moving with random acceleration, measured by a noisy position sensor"""
    rng = np.random.default_rng(seed); L = np.linalg.cholesky(Qof(q_true)); x = np.zeros(2); z = []
    for _ in range(n):
        x = F @ x + L @ rng.normal(size=2); z.append(H @ x + np.sqrt(r_true) * rng.normal(size=1))
    parked = np.sqrt(r_true) * rng.normal(size=500) + 1.234    # a separate log with the cart standing still
    return np.array(z), parked

def run_filter(z, q, r):
    x = np.array([z[0, 0], 0.0]); P = np.diag([r, 10.0]); R = np.array([[r]]); nis, innov, bounds = [], [], []
    for zk in z[1:]:
        x = F @ x; P = F @ P @ F.T + Qof(q)
        S = H @ P @ H.T + R; y = zk - H @ x; K = P @ H.T / S[0, 0]
        x = x + K @ y; P = (np.eye(2) - K @ H) @ P
        nis.append(float(y @ y / S[0, 0])); innov.append(float(y[0])); bounds.append(2 * np.sqrt(S[0, 0]))
    return np.array(nis), np.array(innov), np.array(bounds)

def nis_band(n, m=1, p=0.95):
    lo, hi = chi2.ppf([(1 - p) / 2, (1 + p) / 2], n * m) / n
    return lo, hi

def tune_q(z, r, qs=np.logspace(-2, 2, 41)):
    """pick the q whose average NIS is closest to its expected value m = 1"""
    scores = [abs(np.mean(run_filter(z, q, r)[0]) - 1.0) for q in qs]
    return qs[int(np.argmin(scores))]

def test_r_from_parked_log():
    _, parked = make_log()
    r_hat = np.var(parked, ddof=1)
    print(f"R from the parked log: sigma = {np.sqrt(r_hat):.4f} m (true 0.3)")
    assert abs(np.sqrt(r_hat) / 0.3 - 1) < 0.08

def test_tuned_filter_passes_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); q = tune_q(z, r)
    nis, innov, b = run_filter(z, q, r)
    lo, hi = nis_band(len(nis))
    inside = np.mean(np.abs(innov) < b)
    print(f"tuned q = {q:.2f} (true 2.0): average NIS {nis.mean():.3f} in [{lo:.3f}, {hi:.3f}], {inside:.1%} of innovations inside 2 sigma")
    assert lo < nis.mean() < hi and 0.5 < q / 2.0 < 2.0 and 0.93 < inside < 0.97

def test_mistuned_filters_fail_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); lo, hi = nis_band(len(z) - 1)
    small = run_filter(z, 0.02, r)[0].mean(); big = run_filter(z, 200.0, r)[0].mean()
    print(f"q 100x too small: average NIS {small:.2f} (overconfident); q 100x too large: {big:.3f} (too cautious)")
    assert small > hi and big < lo

def test_innovations_white():
    z, parked = make_log(); r = np.var(parked, ddof=1)
    _, innov, _ = run_filter(z, tune_q(z, r), r); y = innov - innov.mean()
    rho1 = np.sum(y[1:] * y[:-1]) / np.sum(y * y)
    _, innov_bad, _ = run_filter(z, 0.02, r); yb = innov_bad - innov_bad.mean()
    rho_bad = np.sum(yb[1:] * yb[:-1]) / np.sum(yb * yb)
    print(f"lag-1 autocorrelation of innovations: tuned {rho1:+.3f}, q too small {rho_bad:+.3f}")
    assert abs(rho1) < 0.1 and rho_bad > 0.3

test_r_from_parked_log()
test_tuned_filter_passes_nis()
test_mistuned_filters_fail_nis()
test_innovations_white()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};