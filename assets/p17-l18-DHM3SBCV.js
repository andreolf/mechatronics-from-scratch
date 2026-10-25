var e=`p17-l18`,t=40,n=`Two laser scans of the same place, taken from different poses, overlap once one is moved onto the other. You implement the closed-form best rigid transform with the SVD and the iterative closest point algorithm around it, align two illustrative scans from a 9 cm and 4° odometry guess to about a millimetre, and map out where ICP stops converging.`,r=`<h2 id="best-rigid-transform">Best rigid transform</h2>
<p>Given paired points <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">↔</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, the rotation and translation minimising <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">∣</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6984em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord">∣</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span> have a closed form (Kabsch, Arun):</p>
<ol>
<li>Subtract the centroids: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0106em;vertical-align:-0.2587em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-2.4413em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2587em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.5678em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.5678em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">a</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.25em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0106em;vertical-align:-0.2587em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-2.4413em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2587em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8312em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8312em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">b</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.25em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span>.</li>
<li>SVD of the cross-covariance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1078em;vertical-align:-0.2587em;"></span><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-2.4413em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2587em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-2.4413em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′⊤</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2587em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8491em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="mord">Σ</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">⊤</span></span></span></span></span></span></span></span></span></span></span>.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8491em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">⊤</span></span></span></span></span></span></span></span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0991em;vertical-align:-0.25em;"></span><span class="mop"><span class="mord mathrm" style="margin-right:0.0139em;">diag</span></span><span class="mopen">(</span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">det</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.109em;">U</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">⊤</span></span></span></span></span></span></span></span><span class="mclose">))</span></span></span></span>, which prevents a reflection; <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9145em;vertical-align:-0.0833em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8312em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">b</span></span><span style="top:-3.2634em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.25em;"><span class="mord">ˉ</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.5678em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">a</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.25em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span>.</li>
</ol>
<h2 id="iterative-closest-point">Iterative closest point</h2>
<p>Scans do not come with correspondences. <strong>ICP</strong> guesses them:</p>
<ol>
<li>Transform the source scan with the current estimate.</li>
<li>Pair each source point with its <strong>nearest</strong> target point (a k-d tree makes this <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span><span class="mopen">(</span><span class="mop">lo<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span>).</li>
<li>Reject pairs farther apart than a threshold (parts not seen in both scans).</li>
<li>Solve for the best rigid transform of the pairs, compose it with the estimate, and repeat until the error stops falling.</li>
</ol>
<p>Without outlier rejection, neither the re-pairing nor the solve can increase the error, so ICP settles, but only into the <strong>nearest</strong> local minimum. It needs a good initial guess, usually odometry (lesson 14), and fails in featureless places such as long corridors, where sliding along the walls costs nothing.</p>
<h2 id="variants">Variants</h2>
<p>Point-to-<strong>plane</strong> (in 2D, point-to-line) ICP minimises the distance along the target surface normal, letting points slide along walls; it converges in far fewer iterations. Robust kernels downweight outliers instead of a hard cut-off. Real scans also differ by occlusion and point density, which is why the final RMS pair distance never reaches the sensor noise.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="icp" data-args="{}"></div></div><figcaption>Two illustrative scans of an L-shaped room. Set the initial offset and rotation, then step through ICP iterations and watch the pairs and the alignment.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative L-shaped room with a box, sampled as points; two scans from poses 32 cm and 8.6° apart, each keeping a random 80 % of the points with 1 cm noise (occlusion is ignored).</p>
<ol>
<li>With known correspondences, the SVD solution recovers a transform to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">16</span></span></span></span></span></span></span></span></span></span></span></span>.</li>
<li>From an odometry guess 9.4 cm and 4.0° off: after 17 iterations the error is 1.25 mm and 0.067°; the RMS pair distance falls from 10.7 to 1.88 cm (the remainder is point spacing and noise, since the scans sample different points).</li>
<li>Initial errors of 15 cm and 5°, 15° or 30°: 8 of 8 trials converge. At 60°: only 4 of 8.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">icp.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy.spatial <span class="hljs-keyword">import</span> cKDTree

<span class="hljs-keyword">def</span> <span class="hljs-title function_">room_points</span>(<span class="hljs-params">n_per_m=<span class="hljs-number">40</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative 2D scene sampled as points: an L-shaped room outline plus a box (a laser scan&#x27;s raw material)&quot;&quot;&quot;</span>
    segs = [((<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">6</span>, <span class="hljs-number">0</span>)), ((<span class="hljs-number">6</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">6</span>, <span class="hljs-number">3</span>)), ((<span class="hljs-number">6</span>, <span class="hljs-number">3</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">3</span>)), ((<span class="hljs-number">3</span>, <span class="hljs-number">3</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">5</span>)), ((<span class="hljs-number">3</span>, <span class="hljs-number">5</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">5</span>)), ((<span class="hljs-number">0</span>, <span class="hljs-number">5</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>)),
            ((<span class="hljs-number">1.5</span>, <span class="hljs-number">1.0</span>), (<span class="hljs-number">2.3</span>, <span class="hljs-number">1.0</span>)), ((<span class="hljs-number">2.3</span>, <span class="hljs-number">1.0</span>), (<span class="hljs-number">2.3</span>, <span class="hljs-number">1.6</span>)), ((<span class="hljs-number">2.3</span>, <span class="hljs-number">1.6</span>), (<span class="hljs-number">1.5</span>, <span class="hljs-number">1.6</span>)), ((<span class="hljs-number">1.5</span>, <span class="hljs-number">1.6</span>), (<span class="hljs-number">1.5</span>, <span class="hljs-number">1.0</span>))]
    pts = []
    <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> segs:
        a, b = np.array(a, <span class="hljs-built_in">float</span>), np.array(b, <span class="hljs-built_in">float</span>); n = <span class="hljs-built_in">int</span>(np.linalg.norm(b - a) * n_per_m)
        pts.append(a + np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, n, endpoint=<span class="hljs-literal">False</span>)[:, <span class="hljs-literal">None</span>] * (b - a))
    <span class="hljs-keyword">return</span> np.vstack(pts)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">se2</span>(<span class="hljs-params">x, y, th</span>):
    c, s = np.cos(th), np.sin(th); <span class="hljs-keyword">return</span> np.array([[c, -s, x], [s, c, y], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">transform</span>(<span class="hljs-params">T, p</span>): <span class="hljs-keyword">return</span> p @ T[:<span class="hljs-number">2</span>, :<span class="hljs-number">2</span>].T + T[:<span class="hljs-number">2</span>, <span class="hljs-number">2</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">best_fit</span>(<span class="hljs-params">A, B</span>):
    <span class="hljs-string">&quot;&quot;&quot;the rigid transform minimising sum |R a_i + t - b_i|^2 (Kabsch / Arun): centre, SVD of the cross-covariance&quot;&quot;&quot;</span>
    ca, cb = A.mean(<span class="hljs-number">0</span>), B.mean(<span class="hljs-number">0</span>); U, _, Vt = np.linalg.svd((A - ca).T @ (B - cb))
    D = np.diag([<span class="hljs-number">1</span>, np.sign(np.linalg.det(Vt.T @ U.T))])               <span class="hljs-comment"># guard against a reflection</span>
    R = Vt.T @ D @ U.T; T = np.eye(<span class="hljs-number">3</span>); T[:<span class="hljs-number">2</span>, :<span class="hljs-number">2</span>] = R; T[:<span class="hljs-number">2</span>, <span class="hljs-number">2</span>] = cb - R @ ca
    <span class="hljs-keyword">return</span> T

<span class="hljs-keyword">def</span> <span class="hljs-title function_">icp</span>(<span class="hljs-params">src, dst, T0=np.eye(<span class="hljs-params"><span class="hljs-number">3</span></span>), iters=<span class="hljs-number">60</span>, reject=<span class="hljs-number">0.5</span>, tol=<span class="hljs-number">1e-7</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;point-to-point ICP: pair each source point with its nearest target point, solve, repeat&quot;&quot;&quot;</span>
    tree = cKDTree(dst); T = T0.copy(); prev = np.inf; hist = []
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(iters):
        p = transform(T, src); d, idx = tree.query(p)
        keep = d &lt; reject                                               <span class="hljs-comment"># drop pairs too far apart (no overlap)</span>
        T = best_fit(p[keep], dst[idx[keep]]) @ T
        err = np.sqrt(np.mean(d[keep] ** <span class="hljs-number">2</span>)); hist.append(err)
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(prev - err) &lt; tol: <span class="hljs-keyword">break</span>
        prev = err
    <span class="hljs-keyword">return</span> T, np.array(hist)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">scan</span>(<span class="hljs-params">pts, T_world_robot, rng, noise=<span class="hljs-number">0.01</span>, keep_frac=<span class="hljs-number">0.8</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;what the robot sees: the scene in its own frame, a random 80 % of points, with noise (occlusion is ignored here)&quot;&quot;&quot;</span>
    local = transform(np.linalg.inv(T_world_robot), pts); m = rng.random(<span class="hljs-built_in">len</span>(pts)) &lt; keep_frac
    <span class="hljs-keyword">return</span> local[m] + rng.normal(<span class="hljs-number">0</span>, noise, (m.<span class="hljs-built_in">sum</span>(), <span class="hljs-number">2</span>))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pose_error</span>(<span class="hljs-params">T, T_true</span>):
    E = np.linalg.inv(T_true) @ T; <span class="hljs-keyword">return</span> np.hypot(*E[:<span class="hljs-number">2</span>, <span class="hljs-number">2</span>]), <span class="hljs-built_in">abs</span>(np.degrees(np.arctan2(E[<span class="hljs-number">1</span>, <span class="hljs-number">0</span>], E[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>])))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_best_fit_exact</span>():
    rng = np.random.default_rng(<span class="hljs-number">0</span>); A = rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, (<span class="hljs-number">30</span>, <span class="hljs-number">2</span>)); T = se2(<span class="hljs-number">0.4</span>, -<span class="hljs-number">0.2</span>, <span class="hljs-number">0.3</span>)
    e = np.<span class="hljs-built_in">abs</span>(best_fit(A, transform(T, A)) - T).<span class="hljs-built_in">max</span>()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;known correspondences: the SVD solution recovers the transform to <span class="hljs-subst">{e:<span class="hljs-number">.1</span>e}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> e &lt; <span class="hljs-number">1e-12</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">setup</span>(<span class="hljs-params">seed=<span class="hljs-number">1</span></span>):
    rng = np.random.default_rng(seed); pts = room_points()
    T1, T2 = se2(<span class="hljs-number">2.0</span>, <span class="hljs-number">2.0</span>, <span class="hljs-number">0.1</span>), se2(<span class="hljs-number">2.3</span>, <span class="hljs-number">1.9</span>, <span class="hljs-number">0.25</span>)                    <span class="hljs-comment"># two robot poses</span>
    s1, s2 = scan(pts, T1, rng), scan(pts, T2, rng)
    <span class="hljs-keyword">return</span> s1, s2, np.linalg.inv(T1) @ T2                              <span class="hljs-comment"># true relative pose: scan 2 points into scan 1&#x27;s frame</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_converges_from_odometry_guess</span>():
    s1, s2, T_rel = setup()
    guess = T_rel @ se2(<span class="hljs-number">0.08</span>, -<span class="hljs-number">0.05</span>, np.radians(<span class="hljs-number">4</span>))                    <span class="hljs-comment"># odometry guess: 9 cm and 4 deg off</span>
    T, hist = icp(s2, s1, guess)
    dp, da = pose_error(T, T_rel); dp0, da0 = pose_error(guess, T_rel)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;initial error <span class="hljs-subst">{<span class="hljs-number">100</span> * dp0:<span class="hljs-number">.1</span>f}</span> cm, <span class="hljs-subst">{da0:<span class="hljs-number">.1</span>f}</span> deg -&gt; after <span class="hljs-subst">{<span class="hljs-built_in">len</span>(hist)}</span> iterations <span class="hljs-subst">{<span class="hljs-number">1000</span> * dp:<span class="hljs-number">.2</span>f}</span> mm, <span class="hljs-subst">{da:<span class="hljs-number">.3</span>f}</span> deg; RMS pair distance <span class="hljs-subst">{<span class="hljs-number">100</span> * hist[<span class="hljs-number">0</span>]:<span class="hljs-number">.1</span>f}</span> -&gt; <span class="hljs-subst">{<span class="hljs-number">100</span> * hist[-<span class="hljs-number">1</span>]:<span class="hljs-number">.2</span>f}</span> cm&quot;</span>)
    <span class="hljs-keyword">assert</span> dp &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> da &lt; <span class="hljs-number">0.3</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_basin_of_convergence</span>():
    s1, s2, T_rel = setup(); res = []
    <span class="hljs-keyword">for</span> ang <span class="hljs-keyword">in</span> (<span class="hljs-number">5</span>, <span class="hljs-number">15</span>, <span class="hljs-number">30</span>, <span class="hljs-number">60</span>):
        ok = <span class="hljs-number">0</span>
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span>):
            off = se2(<span class="hljs-number">0.15</span> * np.cos(k * np.pi / <span class="hljs-number">4</span>), <span class="hljs-number">0.15</span> * np.sin(k * np.pi / <span class="hljs-number">4</span>), np.radians(ang) * (<span class="hljs-number">1</span> <span class="hljs-keyword">if</span> k % <span class="hljs-number">2</span> <span class="hljs-keyword">else</span> -<span class="hljs-number">1</span>))
            dp, da = pose_error(icp(s2, s1, T_rel @ off, iters=<span class="hljs-number">100</span>)[<span class="hljs-number">0</span>], T_rel); ok += (dp &lt; <span class="hljs-number">0.02</span>) <span class="hljs-keyword">and</span> (da &lt; <span class="hljs-number">0.5</span>)
        res.append(ok)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;initial error 15 cm and <span class="hljs-subst">{ang}</span> deg: converged in <span class="hljs-subst">{ok}</span> of 8 trials&quot;</span>)
    <span class="hljs-keyword">assert</span> res[<span class="hljs-number">0</span>] == <span class="hljs-number">8</span> <span class="hljs-keyword">and</span> res[-<span class="hljs-number">1</span>] &lt; <span class="hljs-number">8</span>

test_best_fit_exact()
test_converges_from_odometry_guess()
test_basin_of_convergence()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Open3D’s <code>registration_icp</code> offers point-to-point and point-to-plane ICP for 3D point clouds, plus global registration from features to get the initial guess. In ROS 2, slam_toolbox uses scan matching to correct odometry between scans, and libpointmatcher and KISS-ICP are common for lidar odometry.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why is ICP between two scans of a long, straight corridor poorly constrained?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Sliding one scan along the corridor moves every point along its wall, so the nearest-neighbour distances barely change. The along-corridor translation is unobservable; only sideways position and heading are fixed. Fuse odometry for the missing direction.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What does the determinant check in the SVD step guard against?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>With noisy or nearly collinear points the best orthogonal matrix can be a reflection (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mop">det</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord">1</span></span></span></span>), which is not a physical motion. Flipping the sign of the last singular direction gives the best proper rotation.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l18"></div>
`,i=[{id:`best-rigid-transform`,title:`Best rigid transform`},{id:`iterative-closest-point`,title:`Iterative closest point`},{id:`variants`,title:`Variants`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l18-q1`,type:`num`,q:`<p>Centroid x of the points (0, 0), (2, 0) and (4, 3)?</p>
`,explain:`<p>The mean.</p>
`,answer:2,tol:.001,unit:`m`},{id:`p17-l18-q2`,type:`num`,q:`<p>Degrees of freedom of a 2D rigid transform?</p>
`,explain:`<p>x, y and the angle.</p>
`,answer:3,tol:.001,unit:``},{id:`p17-l18-q3`,type:`num`,q:`<p>Determinant of a proper rotation matrix?</p>
`,explain:`<p>Reflections have -1.</p>
`,answer:1,tol:.001,unit:``},{id:`p17-l18-q4`,type:`num`,q:`<p>Point pairs needed at minimum to fix a 2D rigid transform?</p>
`,explain:`<p>Two distinct points fix x, y and the angle.</p>
`,answer:2,tol:.001,unit:``},{id:`p17-l18-q5`,type:`mc`,q:`<p>ICP needs a good initial guess because…</p>
`,explain:`<p>Nearest-neighbour pairing is only right near the solution.</p>
`,options:[`the SVD needs a starting point`,`it only uses two points`,`k-d trees need it`,`it converges to the nearest local minimum`],answer:3},{id:`p17-l18-q6`,type:`mc`,q:`<p>Point-to-plane ICP improves on point-to-point by…</p>
`,explain:`<p>It measures distance along the surface normal.</p>
`,options:[`using fewer points`,`letting points slide along surfaces, converging faster`,`making the problem convex`,`removing the need for nearest neighbours`],answer:1}],o=[{file:`icp.py`,lang:`python`,src:`import numpy as np
from scipy.spatial import cKDTree

def room_points(n_per_m=40):
    """illustrative 2D scene sampled as points: an L-shaped room outline plus a box (a laser scan's raw material)"""
    segs = [((0, 0), (6, 0)), ((6, 0), (6, 3)), ((6, 3), (3, 3)), ((3, 3), (3, 5)), ((3, 5), (0, 5)), ((0, 5), (0, 0)),
            ((1.5, 1.0), (2.3, 1.0)), ((2.3, 1.0), (2.3, 1.6)), ((2.3, 1.6), (1.5, 1.6)), ((1.5, 1.6), (1.5, 1.0))]
    pts = []
    for a, b in segs:
        a, b = np.array(a, float), np.array(b, float); n = int(np.linalg.norm(b - a) * n_per_m)
        pts.append(a + np.linspace(0, 1, n, endpoint=False)[:, None] * (b - a))
    return np.vstack(pts)

def se2(x, y, th):
    c, s = np.cos(th), np.sin(th); return np.array([[c, -s, x], [s, c, y], [0, 0, 1]])

def transform(T, p): return p @ T[:2, :2].T + T[:2, 2]

def best_fit(A, B):
    """the rigid transform minimising sum |R a_i + t - b_i|^2 (Kabsch / Arun): centre, SVD of the cross-covariance"""
    ca, cb = A.mean(0), B.mean(0); U, _, Vt = np.linalg.svd((A - ca).T @ (B - cb))
    D = np.diag([1, np.sign(np.linalg.det(Vt.T @ U.T))])               # guard against a reflection
    R = Vt.T @ D @ U.T; T = np.eye(3); T[:2, :2] = R; T[:2, 2] = cb - R @ ca
    return T

def icp(src, dst, T0=np.eye(3), iters=60, reject=0.5, tol=1e-7):
    """point-to-point ICP: pair each source point with its nearest target point, solve, repeat"""
    tree = cKDTree(dst); T = T0.copy(); prev = np.inf; hist = []
    for k in range(iters):
        p = transform(T, src); d, idx = tree.query(p)
        keep = d < reject                                               # drop pairs too far apart (no overlap)
        T = best_fit(p[keep], dst[idx[keep]]) @ T
        err = np.sqrt(np.mean(d[keep] ** 2)); hist.append(err)
        if abs(prev - err) < tol: break
        prev = err
    return T, np.array(hist)

def scan(pts, T_world_robot, rng, noise=0.01, keep_frac=0.8):
    """what the robot sees: the scene in its own frame, a random 80 % of points, with noise (occlusion is ignored here)"""
    local = transform(np.linalg.inv(T_world_robot), pts); m = rng.random(len(pts)) < keep_frac
    return local[m] + rng.normal(0, noise, (m.sum(), 2))

def pose_error(T, T_true):
    E = np.linalg.inv(T_true) @ T; return np.hypot(*E[:2, 2]), abs(np.degrees(np.arctan2(E[1, 0], E[0, 0])))

def test_best_fit_exact():
    rng = np.random.default_rng(0); A = rng.normal(0, 1, (30, 2)); T = se2(0.4, -0.2, 0.3)
    e = np.abs(best_fit(A, transform(T, A)) - T).max()
    print(f"known correspondences: the SVD solution recovers the transform to {e:.1e}")
    assert e < 1e-12

def setup(seed=1):
    rng = np.random.default_rng(seed); pts = room_points()
    T1, T2 = se2(2.0, 2.0, 0.1), se2(2.3, 1.9, 0.25)                    # two robot poses
    s1, s2 = scan(pts, T1, rng), scan(pts, T2, rng)
    return s1, s2, np.linalg.inv(T1) @ T2                              # true relative pose: scan 2 points into scan 1's frame

def test_converges_from_odometry_guess():
    s1, s2, T_rel = setup()
    guess = T_rel @ se2(0.08, -0.05, np.radians(4))                    # odometry guess: 9 cm and 4 deg off
    T, hist = icp(s2, s1, guess)
    dp, da = pose_error(T, T_rel); dp0, da0 = pose_error(guess, T_rel)
    print(f"initial error {100 * dp0:.1f} cm, {da0:.1f} deg -> after {len(hist)} iterations {1000 * dp:.2f} mm, {da:.3f} deg; RMS pair distance {100 * hist[0]:.1f} -> {100 * hist[-1]:.2f} cm")
    assert dp < 0.01 and da < 0.3

def test_basin_of_convergence():
    s1, s2, T_rel = setup(); res = []
    for ang in (5, 15, 30, 60):
        ok = 0
        for k in range(8):
            off = se2(0.15 * np.cos(k * np.pi / 4), 0.15 * np.sin(k * np.pi / 4), np.radians(ang) * (1 if k % 2 else -1))
            dp, da = pose_error(icp(s2, s1, T_rel @ off, iters=100)[0], T_rel); ok += (dp < 0.02) and (da < 0.5)
        res.append(ok)
        print(f"initial error 15 cm and {ang} deg: converged in {ok} of 8 trials")
    assert res[0] == 8 and res[-1] < 8

test_best_fit_exact()
test_converges_from_odometry_guess()
test_basin_of_convergence()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};