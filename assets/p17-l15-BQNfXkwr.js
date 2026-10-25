var e=`p17-l15`,t=45,n=`Monte Carlo localisation represents “where might I be” as thousands of guesses. You implement a particle filter with an odometry motion model, a laser beam likelihood computed by ray casting against a map, and low-variance resampling, and watch it find an illustrative robot from complete global uncertainty within two scans, the method behind Nav2’s AMCL.`,r=`<h2 id="beliefs-as-samples">Beliefs as samples</h2>
<p>Localisation estimates the robot’s pose <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> in a known map from odometry <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">u</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span><span class="mrel mtight">:</span><span class="mord mathnormal mtight">t</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> and sensor readings <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.044em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span><span class="mrel mtight">:</span><span class="mord mathnormal mtight">t</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. The Bayes filter alternates a <strong>prediction</strong> with the motion model and a <strong>correction</strong> with the measurement model:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1444em;vertical-align:-0.25em;"></span><span class="mord katex-overline"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8944em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="mord mathnormal">e</span><span class="mord mathnormal" style="margin-right:0.0197em;">l</span></span></span><span style="top:-3.8144em;"><span class="pstrut" style="height:3em;"></span><span class="overline-line" style="border-bottom-width:0.04em;"></span></span></span></span></span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.2222em;vertical-align:-0.8622em;"></span><span class="mop op-symbol large-op" style="margin-right:0.4445em;position:relative;top:-0.0011em;">∫</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">p</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∣</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">u</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">t</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mord mathnormal">e</span><span class="mord mathnormal" style="margin-right:0.0197em;">l</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">t</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">d</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">t</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mord mathnormal">e</span><span class="mord mathnormal" style="margin-right:0.0197em;">l</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∝</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">p</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:-0.044em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∣</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1444em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord katex-overline"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8944em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="mord mathnormal">e</span><span class="mord mathnormal" style="margin-right:0.0197em;">l</span></span></span><span style="top:-3.8144em;"><span class="pstrut" style="height:3em;"></span><span class="overline-line" style="border-bottom-width:0.04em;"></span></span></span></span></span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2806em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">t</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>A <strong>particle filter</strong> represents the belief by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> weighted samples. It can hold any shape: one blob, several hypotheses in look-alike corridors, or a uniform spread at start-up. That makes <strong>global localisation</strong> (no idea where the robot is) and recovery from mistakes possible, which a Kalman filter cannot do.</p>
<h2 id="the-three-steps">The three steps</h2>
<ol>
<li><strong>Predict</strong>: move every particle by the odometry plus sampled noise, proportional to the motion.</li>
<li><strong>Weight</strong>: for each particle, predict the laser ranges by ray casting in the map and score the real scan: a Gaussian on each beam’s range error, plus a small floor for readings the map cannot explain (people, chairs). Multiply over beams (add logs). Particles inside walls get weight 0.</li>
<li><strong>Resample</strong>: draw a new set in proportion to the weights. <strong>Low-variance resampling</strong> uses one random offset and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> evenly spaced pointers, so a particle with weight <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span></span></span></span> gets <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">⌊</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mclose">⌋</span></span></span></span> or <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">⌈</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mclose">⌉</span></span></span></span> copies. Resample only when the effective sample size <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0728em;vertical-align:-0.2587em;"></span><span class="mord">1/</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-2.4413em;margin-left:-0.0269em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2587em;"><span></span></span></span></span></span></span></span></span></span> drops (here below <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mord">/2</span></span></span></span>), to avoid needlessly losing diversity.</li>
</ol>
<p>The weighted mean is the pose estimate. AMCL adds adaptive particle counts (KLD sampling) and random particles injected when the scan fits poorly, for kidnapped-robot recovery.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="mcl" data-args="{}"></div></div><figcaption>Monte Carlo localisation in an illustrative room. Step along the robot’s route and watch the particles collapse from the whole room onto the true pose (lime). Change the particle count.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative 8 × 5 m room with a pillar, an alcove and a wall stub, so no two places look alike; a 6-beam laser (every 60°, 4 m range, 0.25 m noise); 3000 particles spread uniformly over the free space; the robot drives a 15 m route in 76 steps of 0.2 m.</p>
<ol>
<li>From <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">2</span><span class="mclose">)</span></span></span></span> facing <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord">+</span><span class="mord mathnormal">x</span></span></span></span> the ray caster reads 4.00 m ahead (the pillar at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span>) and 1.00 m behind.</li>
<li>Resampling weights 0.5, 0.25, 0.125, 0.125 over 1000 particles gives exactly 500, 250, 125 and 125 copies.</li>
<li>After the first scan the estimate is still 0.8 to 1.2 m off with a spread of 1.8 to 2.4 m (three random seeds): several places fit one scan. From the second step on it stays within 0.3 m.</li>
<li>Over the last 20 steps the median error is 4 to 12 cm, with a particle spread of about 8 cm.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">mcl.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-comment"># illustrative 8 x 5 m room with a pillar and an alcove, so no two places look the same (wall segments x1, y1, x2, y2)</span>
WALLS = np.array([[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">8</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">8</span>, <span class="hljs-number">0</span>, <span class="hljs-number">8</span>, <span class="hljs-number">5</span>], [<span class="hljs-number">8</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>], [<span class="hljs-number">3</span>, <span class="hljs-number">5</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>], [<span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">0</span>, <span class="hljs-number">4</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">4</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
                  [<span class="hljs-number">5</span>, <span class="hljs-number">1.5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">1.5</span>], [<span class="hljs-number">6</span>, <span class="hljs-number">1.5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">2.5</span>], [<span class="hljs-number">6</span>, <span class="hljs-number">2.5</span>, <span class="hljs-number">5</span>, <span class="hljs-number">2.5</span>], [<span class="hljs-number">5</span>, <span class="hljs-number">2.5</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1.5</span>], [<span class="hljs-number">1.5</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1.5</span>, <span class="hljs-number">1.2</span>]], <span class="hljs-built_in">float</span>)
BEAMS = np.radians(np.arange(-<span class="hljs-number">180</span>, <span class="hljs-number">180</span>, <span class="hljs-number">60</span>))                          <span class="hljs-comment"># 6 laser beams, 60 deg apart</span>
MAX_RANGE, SIGMA_R = <span class="hljs-number">4.0</span>, <span class="hljs-number">0.25</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">free</span>(<span class="hljs-params">x, y</span>):
    <span class="hljs-string">&quot;&quot;&quot;inside the room and outside the pillar and the short wall stub&quot;&quot;&quot;</span>
    inside = (x &gt; <span class="hljs-number">0.1</span>) &amp; (x &lt; <span class="hljs-number">7.9</span>) &amp; (y &gt; <span class="hljs-number">0.1</span>) &amp; (((y &lt; <span class="hljs-number">3.9</span>) | (x &gt; <span class="hljs-number">3.1</span>)) &amp; (y &lt; <span class="hljs-number">4.9</span>))
    pillar = (x &gt; <span class="hljs-number">4.9</span>) &amp; (x &lt; <span class="hljs-number">6.1</span>) &amp; (y &gt; <span class="hljs-number">1.4</span>) &amp; (y &lt; <span class="hljs-number">2.6</span>); stub = (x &gt; <span class="hljs-number">1.4</span>) &amp; (x &lt; <span class="hljs-number">1.6</span>) &amp; (y &lt; <span class="hljs-number">1.3</span>)
    <span class="hljs-keyword">return</span> inside &amp; ~pillar &amp; ~stub

<span class="hljs-keyword">def</span> <span class="hljs-title function_">raycast</span>(<span class="hljs-params">poses</span>):
    <span class="hljs-string">&quot;&quot;&quot;laser ranges for N poses (x, y, theta): nearest intersection of each beam with every wall segment&quot;&quot;&quot;</span>
    ang = poses[:, <span class="hljs-number">2</span>:<span class="hljs-number">3</span>] + BEAMS; dx, dy = np.cos(ang)[..., <span class="hljs-literal">None</span>], np.sin(ang)[..., <span class="hljs-literal">None</span>]        <span class="hljs-comment"># N x B x 1</span>
    ox, oy = poses[:, <span class="hljs-number">0</span>, <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>], poses[:, <span class="hljs-number">1</span>, <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>]
    x1, y1, x2, y2 = WALLS.T; ex, ey = x2 - x1, y2 - y1
    den = dx * ey - dy * ex
    <span class="hljs-keyword">with</span> np.errstate(divide=<span class="hljs-string">&quot;ignore&quot;</span>, invalid=<span class="hljs-string">&quot;ignore&quot;</span>):
        t = ((x1 - ox) * ey - (y1 - oy) * ex) / den; u = ((x1 - ox) * dy - (y1 - oy) * dx) / den
    t = np.where((np.<span class="hljs-built_in">abs</span>(den) &gt; <span class="hljs-number">1e-12</span>) &amp; (t &gt; <span class="hljs-number">0</span>) &amp; (u &gt;= <span class="hljs-number">0</span>) &amp; (u &lt;= <span class="hljs-number">1</span>), t, np.inf)
    <span class="hljs-keyword">return</span> np.minimum(t.<span class="hljs-built_in">min</span>(<span class="hljs-number">2</span>), MAX_RANGE)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">motion</span>(<span class="hljs-params">particles, ds, dth, rng, a=(<span class="hljs-params"><span class="hljs-number">0.05</span>, <span class="hljs-number">0.02</span></span>)</span>):
    <span class="hljs-string">&quot;&quot;&quot;sample the odometry motion model: travel and turn with noise proportional to the motion&quot;&quot;&quot;</span>
    n = <span class="hljs-built_in">len</span>(particles); s = ds + rng.normal(<span class="hljs-number">0</span>, a[<span class="hljs-number">0</span>] * <span class="hljs-built_in">abs</span>(ds) + <span class="hljs-number">0.01</span>, n); r = dth + rng.normal(<span class="hljs-number">0</span>, a[<span class="hljs-number">1</span>] + <span class="hljs-number">0.05</span> * <span class="hljs-built_in">abs</span>(dth), n)
    p = particles.copy(); p[:, <span class="hljs-number">2</span>] += r / <span class="hljs-number">2</span>; p[:, <span class="hljs-number">0</span>] += s * np.cos(p[:, <span class="hljs-number">2</span>]); p[:, <span class="hljs-number">1</span>] += s * np.sin(p[:, <span class="hljs-number">2</span>]); p[:, <span class="hljs-number">2</span>] += r / <span class="hljs-number">2</span>
    <span class="hljs-keyword">return</span> p

<span class="hljs-keyword">def</span> <span class="hljs-title function_">weights</span>(<span class="hljs-params">particles, z</span>):
    <span class="hljs-string">&quot;&quot;&quot;beam likelihood: Gaussian range error plus a small floor for unexpected readings; zero weight inside walls&quot;&quot;&quot;</span>
    pred = raycast(particles)
    lik = <span class="hljs-number">0.9</span> * np.exp(-<span class="hljs-number">0.5</span> * ((pred - z) / SIGMA_R) ** <span class="hljs-number">2</span>) + <span class="hljs-number">0.1</span> * <span class="hljs-number">0.2</span>
    logw = np.log(lik).<span class="hljs-built_in">sum</span>(<span class="hljs-number">1</span>); logw[~free(particles[:, <span class="hljs-number">0</span>], particles[:, <span class="hljs-number">1</span>])] = -np.inf
    w = np.exp(logw - logw.<span class="hljs-built_in">max</span>()); <span class="hljs-keyword">return</span> w / w.<span class="hljs-built_in">sum</span>()

<span class="hljs-keyword">def</span> <span class="hljs-title function_">low_variance_resample</span>(<span class="hljs-params">particles, w, rng</span>):
    <span class="hljs-string">&quot;&quot;&quot;one random offset, n evenly spaced pointers into the cumulative weights: low variance, O(n)&quot;&quot;&quot;</span>
    n = <span class="hljs-built_in">len</span>(w); u = (rng.random() + np.arange(n)) / n
    <span class="hljs-keyword">return</span> particles[np.minimum(np.searchsorted(np.cumsum(w), u), n - <span class="hljs-number">1</span>)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">route</span>():
    <span class="hljs-string">&quot;&quot;&quot;the robot&#x27;s path: waypoints visited at 0.2 m per step, as (ds, dtheta) odometry commands&quot;&quot;&quot;</span>
    pts = np.array([[<span class="hljs-number">1</span>, <span class="hljs-number">2.5</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">3.2</span>], [<span class="hljs-number">7</span>, <span class="hljs-number">3.8</span>], [<span class="hljs-number">7</span>, <span class="hljs-number">0.8</span>], [<span class="hljs-number">3</span>, <span class="hljs-number">0.8</span>], [<span class="hljs-number">2.5</span>, <span class="hljs-number">2.5</span>]]); poses = [np.r_[pts[<span class="hljs-number">0</span>], <span class="hljs-number">0</span>]]
    <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(pts[:-<span class="hljs-number">1</span>], pts[<span class="hljs-number">1</span>:]):
        th = np.arctan2(*(b - a)[::-<span class="hljs-number">1</span>]); n = <span class="hljs-built_in">int</span>(np.ceil(np.linalg.norm(b - a) / <span class="hljs-number">0.2</span>))
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n): poses.append(np.r_[a + (b - a) * (k + <span class="hljs-number">1</span>) / n, th])
    poses = np.array(poses); poses[<span class="hljs-number">0</span>, <span class="hljs-number">2</span>] = poses[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]
    d = np.diff(poses, axis=<span class="hljs-number">0</span>); ds = np.hypot(d[:, <span class="hljs-number">0</span>], d[:, <span class="hljs-number">1</span>]); dth = (d[:, <span class="hljs-number">2</span>] + np.pi) % (<span class="hljs-number">2</span> * np.pi) - np.pi
    <span class="hljs-keyword">return</span> poses, ds, dth

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">n=<span class="hljs-number">3000</span>, seed=<span class="hljs-number">0</span></span>):
    rng = np.random.default_rng(seed); truth, ds, dth = route()
    p = rng.uniform([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, -np.pi], [<span class="hljs-number">8</span>, <span class="hljs-number">5</span>, np.pi], (<span class="hljs-number">4</span> * n, <span class="hljs-number">3</span>)); p = p[free(p[:, <span class="hljs-number">0</span>], p[:, <span class="hljs-number">1</span>])][:n]   <span class="hljs-comment"># global uncertainty</span>
    errs, spread = [], []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(ds)):
        p = motion(p, ds[k], dth[k], rng)
        z = raycast(truth[k + <span class="hljs-number">1</span>:k + <span class="hljs-number">2</span>])[<span class="hljs-number">0</span>] + rng.normal(<span class="hljs-number">0</span>, SIGMA_R, <span class="hljs-built_in">len</span>(BEAMS))
        w = weights(p, z)
        est = (w[:, <span class="hljs-literal">None</span>] * p[:, :<span class="hljs-number">2</span>]).<span class="hljs-built_in">sum</span>(<span class="hljs-number">0</span>)
        errs.append(np.linalg.norm(est - truth[k + <span class="hljs-number">1</span>, :<span class="hljs-number">2</span>])); spread.append(np.sqrt((w * ((p[:, :<span class="hljs-number">2</span>] - est) ** <span class="hljs-number">2</span>).<span class="hljs-built_in">sum</span>(<span class="hljs-number">1</span>)).<span class="hljs-built_in">sum</span>()))
        <span class="hljs-keyword">if</span> <span class="hljs-number">1</span> / (w ** <span class="hljs-number">2</span>).<span class="hljs-built_in">sum</span>() &lt; <span class="hljs-built_in">len</span>(w) / <span class="hljs-number">2</span>: p = low_variance_resample(p, w, rng)   <span class="hljs-comment"># resample when the effective size halves</span>
    <span class="hljs-keyword">return</span> np.array(errs), np.array(spread)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_raycast</span>():
    r = raycast(np.array([[<span class="hljs-number">1.0</span>, <span class="hljs-number">2.0</span>, <span class="hljs-number">0.0</span>]]))[<span class="hljs-number">0</span>]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;from (1, 2) facing +x: range ahead <span class="hljs-subst">{r[<span class="hljs-number">3</span>]:<span class="hljs-number">.2</span>f}</span> m (the pillar at x = 5), behind <span class="hljs-subst">{r[<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> m&quot;</span>)
    <span class="hljs-keyword">assert</span> np.allclose([r[<span class="hljs-number">3</span>], r[<span class="hljs-number">0</span>]], [<span class="hljs-number">4</span>, <span class="hljs-number">1</span>])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_resampling</span>():
    rng = np.random.default_rng(<span class="hljs-number">1</span>); w = np.array([<span class="hljs-number">0.5</span>, <span class="hljs-number">0.25</span>, <span class="hljs-number">0.125</span>, <span class="hljs-number">0.125</span>]); p = np.arange(<span class="hljs-number">4.0</span>)[:, <span class="hljs-literal">None</span>]
    counts = np.bincount(low_variance_resample(np.repeat(p, <span class="hljs-number">250</span>, <span class="hljs-number">0</span>), np.repeat(w, <span class="hljs-number">250</span>) / <span class="hljs-number">250</span>, rng)[:, <span class="hljs-number">0</span>].astype(<span class="hljs-built_in">int</span>), minlength=<span class="hljs-number">4</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;weights 0.5, 0.25, 0.125, 0.125 over 1000 particles: resampled counts <span class="hljs-subst">{counts.tolist()}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> np.<span class="hljs-built_in">abs</span>(counts - <span class="hljs-number">1000</span> * w).<span class="hljs-built_in">max</span>() &lt;= <span class="hljs-number">1</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_global_localisation</span>():
    <span class="hljs-keyword">for</span> seed <span class="hljs-keyword">in</span> (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>):
        errs, spread = run(seed=seed)
        first = <span class="hljs-built_in">int</span>(np.argmax(np.convolve(errs &lt; <span class="hljs-number">0.3</span>, np.ones(<span class="hljs-number">5</span>), <span class="hljs-string">&quot;valid&quot;</span>) == <span class="hljs-number">5</span>))
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;seed <span class="hljs-subst">{seed}</span>: error <span class="hljs-subst">{errs[<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> m and spread <span class="hljs-subst">{spread[<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> m after the first scan, below 0.3 m for good from step <span class="hljs-subst">{first}</span>; final error <span class="hljs-subst">{errs[-<span class="hljs-number">1</span>]:<span class="hljs-number">.3</span>f}</span> m, spread <span class="hljs-subst">{spread[-<span class="hljs-number">1</span>]:<span class="hljs-number">.3</span>f}</span> m; &quot;</span>
              <span class="hljs-string">f&quot;median error over the last 20 steps <span class="hljs-subst">{np.median(errs[-<span class="hljs-number">20</span>:]):<span class="hljs-number">.3</span>f}</span> m&quot;</span>)
        <span class="hljs-keyword">assert</span> np.median(errs[-<span class="hljs-number">20</span>:]) &lt; <span class="hljs-number">0.15</span> <span class="hljs-keyword">and</span> (errs[first:] &lt; <span class="hljs-number">0.3</span>).mean() &gt; <span class="hljs-number">0.95</span>

test_raycast()
test_resampling()
test_global_localisation()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Nav2’s localiser is AMCL, an adaptive Monte Carlo localiser of exactly this kind. It uses the occupancy grid map (lesson 17), a likelihood-field laser model (a precomputed distance-to-nearest-obstacle map that avoids ray casting), and publishes the <code>map → odom</code> transform (lesson 14). You give it an initial pose estimate in RViz, or ask it for global localisation.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A robot sits in the middle of a long, featureless corridor. What does the particle cloud look like, and when does it collapse?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Particles spread along the corridor (and possibly in identical corridors elsewhere): the scan fixes the sideways position and heading, not the position along it. The cloud collapses when the robot reaches a door, a corner or another distinctive feature.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why resample only when the effective sample size drops, rather than every step?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Each resampling discards particles and duplicates others, losing diversity even when the weights are nearly equal (the robot was stationary or the scan was uninformative). Resampling only when the weights become uneven keeps the variety needed for multiple hypotheses.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l15"></div>
`,i=[{id:`beliefs-as-samples`,title:`Beliefs as samples`},{id:`the-three-steps`,title:`The three steps`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l15-q1`,type:`num`,q:`<p>Effective sample size of weights 0.5, 0.25, 0.25?</p>
`,explain:`<p>1 / sum of squared weights.</p>
`,answer:2.667,tol:.002,unit:``},{id:`p17-l15-q2`,type:`num`,q:`<p>Copies of a particle with weight 0.012 among 1000 after low-variance resampling (expected)?</p>
`,explain:`<p>N w.</p>
`,answer:12,tol:.001,unit:``},{id:`p17-l15-q3`,type:`num`,q:`<p>Log-likelihood contribution of a beam 0.5 m off with sigma 0.25 m (Gaussian part, ignoring the constant)?</p>
`,explain:`<p>-(error/sigma)^2 / 2.</p>
`,answer:-2,tol:.002,unit:``},{id:`p17-l15-q4`,type:`num`,q:`<p>Ray-cast evaluations for 3000 particles with 6 beams?</p>
`,explain:`<p>One per beam per particle.</p>
`,answer:18e3,tol:.001,unit:``},{id:`p17-l15-q5`,type:`mc`,q:`<p>A particle filter, unlike an EKF, can…</p>
`,explain:`<p>Samples can take any shape.</p>
`,options:[`skip the motion model`,`run with one particle`,`represent several separate pose hypotheses at once`,`give an exact Gaussian posterior`],answer:2},{id:`p17-l15-q6`,type:`mc`,q:`<p>Low-variance resampling…</p>
`,explain:`<p>Its copy counts deviate from N w by less than one.</p>
`,options:[`uses one random number and evenly spaced pointers`,`adds random particles everywhere`,`draws N independent random numbers`,`keeps only the best particle`],answer:0}],o=[{file:`mcl.py`,lang:`python`,src:`import numpy as np

# illustrative 8 x 5 m room with a pillar and an alcove, so no two places look the same (wall segments x1, y1, x2, y2)
WALLS = np.array([[0, 0, 8, 0], [8, 0, 8, 5], [8, 5, 3, 5], [3, 5, 3, 4], [3, 4, 0, 4], [0, 4, 0, 0],
                  [5, 1.5, 6, 1.5], [6, 1.5, 6, 2.5], [6, 2.5, 5, 2.5], [5, 2.5, 5, 1.5], [1.5, 0, 1.5, 1.2]], float)
BEAMS = np.radians(np.arange(-180, 180, 60))                          # 6 laser beams, 60 deg apart
MAX_RANGE, SIGMA_R = 4.0, 0.25

def free(x, y):
    """inside the room and outside the pillar and the short wall stub"""
    inside = (x > 0.1) & (x < 7.9) & (y > 0.1) & (((y < 3.9) | (x > 3.1)) & (y < 4.9))
    pillar = (x > 4.9) & (x < 6.1) & (y > 1.4) & (y < 2.6); stub = (x > 1.4) & (x < 1.6) & (y < 1.3)
    return inside & ~pillar & ~stub

def raycast(poses):
    """laser ranges for N poses (x, y, theta): nearest intersection of each beam with every wall segment"""
    ang = poses[:, 2:3] + BEAMS; dx, dy = np.cos(ang)[..., None], np.sin(ang)[..., None]        # N x B x 1
    ox, oy = poses[:, 0, None, None], poses[:, 1, None, None]
    x1, y1, x2, y2 = WALLS.T; ex, ey = x2 - x1, y2 - y1
    den = dx * ey - dy * ex
    with np.errstate(divide="ignore", invalid="ignore"):
        t = ((x1 - ox) * ey - (y1 - oy) * ex) / den; u = ((x1 - ox) * dy - (y1 - oy) * dx) / den
    t = np.where((np.abs(den) > 1e-12) & (t > 0) & (u >= 0) & (u <= 1), t, np.inf)
    return np.minimum(t.min(2), MAX_RANGE)

def motion(particles, ds, dth, rng, a=(0.05, 0.02)):
    """sample the odometry motion model: travel and turn with noise proportional to the motion"""
    n = len(particles); s = ds + rng.normal(0, a[0] * abs(ds) + 0.01, n); r = dth + rng.normal(0, a[1] + 0.05 * abs(dth), n)
    p = particles.copy(); p[:, 2] += r / 2; p[:, 0] += s * np.cos(p[:, 2]); p[:, 1] += s * np.sin(p[:, 2]); p[:, 2] += r / 2
    return p

def weights(particles, z):
    """beam likelihood: Gaussian range error plus a small floor for unexpected readings; zero weight inside walls"""
    pred = raycast(particles)
    lik = 0.9 * np.exp(-0.5 * ((pred - z) / SIGMA_R) ** 2) + 0.1 * 0.2
    logw = np.log(lik).sum(1); logw[~free(particles[:, 0], particles[:, 1])] = -np.inf
    w = np.exp(logw - logw.max()); return w / w.sum()

def low_variance_resample(particles, w, rng):
    """one random offset, n evenly spaced pointers into the cumulative weights: low variance, O(n)"""
    n = len(w); u = (rng.random() + np.arange(n)) / n
    return particles[np.minimum(np.searchsorted(np.cumsum(w), u), n - 1)]

def route():
    """the robot's path: waypoints visited at 0.2 m per step, as (ds, dtheta) odometry commands"""
    pts = np.array([[1, 2.5], [4, 3.2], [7, 3.8], [7, 0.8], [3, 0.8], [2.5, 2.5]]); poses = [np.r_[pts[0], 0]]
    for a, b in zip(pts[:-1], pts[1:]):
        th = np.arctan2(*(b - a)[::-1]); n = int(np.ceil(np.linalg.norm(b - a) / 0.2))
        for k in range(n): poses.append(np.r_[a + (b - a) * (k + 1) / n, th])
    poses = np.array(poses); poses[0, 2] = poses[1, 2]
    d = np.diff(poses, axis=0); ds = np.hypot(d[:, 0], d[:, 1]); dth = (d[:, 2] + np.pi) % (2 * np.pi) - np.pi
    return poses, ds, dth

def run(n=3000, seed=0):
    rng = np.random.default_rng(seed); truth, ds, dth = route()
    p = rng.uniform([0, 0, -np.pi], [8, 5, np.pi], (4 * n, 3)); p = p[free(p[:, 0], p[:, 1])][:n]   # global uncertainty
    errs, spread = [], []
    for k in range(len(ds)):
        p = motion(p, ds[k], dth[k], rng)
        z = raycast(truth[k + 1:k + 2])[0] + rng.normal(0, SIGMA_R, len(BEAMS))
        w = weights(p, z)
        est = (w[:, None] * p[:, :2]).sum(0)
        errs.append(np.linalg.norm(est - truth[k + 1, :2])); spread.append(np.sqrt((w * ((p[:, :2] - est) ** 2).sum(1)).sum()))
        if 1 / (w ** 2).sum() < len(w) / 2: p = low_variance_resample(p, w, rng)   # resample when the effective size halves
    return np.array(errs), np.array(spread)

def test_raycast():
    r = raycast(np.array([[1.0, 2.0, 0.0]]))[0]
    print(f"from (1, 2) facing +x: range ahead {r[3]:.2f} m (the pillar at x = 5), behind {r[0]:.2f} m")
    assert np.allclose([r[3], r[0]], [4, 1])

def test_resampling():
    rng = np.random.default_rng(1); w = np.array([0.5, 0.25, 0.125, 0.125]); p = np.arange(4.0)[:, None]
    counts = np.bincount(low_variance_resample(np.repeat(p, 250, 0), np.repeat(w, 250) / 250, rng)[:, 0].astype(int), minlength=4)
    print(f"weights 0.5, 0.25, 0.125, 0.125 over 1000 particles: resampled counts {counts.tolist()}")
    assert np.abs(counts - 1000 * w).max() <= 1

def test_global_localisation():
    for seed in (0, 1, 2):
        errs, spread = run(seed=seed)
        first = int(np.argmax(np.convolve(errs < 0.3, np.ones(5), "valid") == 5))
        print(f"seed {seed}: error {errs[0]:.2f} m and spread {spread[0]:.2f} m after the first scan, below 0.3 m for good from step {first}; final error {errs[-1]:.3f} m, spread {spread[-1]:.3f} m; "
              f"median error over the last 20 steps {np.median(errs[-20:]):.3f} m")
        assert np.median(errs[-20:]) < 0.15 and (errs[first:] < 0.3).mean() > 0.95

test_raycast()
test_resampling()
test_global_localisation()
print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};