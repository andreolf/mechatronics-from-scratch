var e=`p17-l12`,t=40,n=`Two cameras side by side see near things shifted more than far ones, and the shift gives depth. You derive z = fB/d for a rectified pair, implement block matching with sub-pixel refinement and a uniqueness check, recover an illustrative scene’s depth with errors matching the z²/fB prediction, and compare with OpenCV’s StereoBM.`,r=`<h2 id="disparity-and-depth">Disparity and depth</h2>
<p>Two identical cameras a baseline <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span></span></span></span> apart, image planes coplanar and rows aligned (a <strong>rectified</strong> pair), see a point at depth <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.044em;">z</span></span></span></span> in the same row, shifted by the <strong>disparity</strong></p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">u</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">L</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">u</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0077em;">R</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0574em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3714em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">⟺</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0574em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3714em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>Near points have large disparity, far points small. Real stereo heads are calibrated and their images warped so the rows line up (<code>stereoRectify</code>), which turns the 2D search into a 1D search along a row.</p>
<h2 id="how-good-is-the-depth">How good is the depth</h2>
<p>Differentiate: a disparity error <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal">d</span></span></span></span> gives</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.3715em;vertical-align:-0.8804em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.4911em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal">d</span><span class="mord">.</span></span></span></span></span></div>
<p>Depth error grows with the <strong>square</strong> of distance, which is why stereo is excellent at 1 m and poor at 20 m, and why a wider baseline or longer focal length helps far away (at the cost of a larger minimum distance and more occlusion).</p>
<h2 id="block-matching">Block matching</h2>
<p>For each left pixel, compare its <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> window with windows in the right image shifted by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner">…</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">d</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mop mtight"><span class="mtight">m</span><span class="mtight">a</span><span class="mtight">x</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, using the sum of absolute differences (SAD), and take the cheapest. Box sums with an integral image make each cost <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span><span class="mopen">(</span><span class="mord">1</span><span class="mclose">)</span></span></span></span> per pixel. Then:</p>
<ul>
<li><strong>Sub-pixel</strong>: fit a parabola through the costs at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> and take its minimum.</li>
<li><strong>Uniqueness</strong>: reject pixels whose best cost is not clearly below the next best away from it. This removes textureless areas and <strong>occlusions</strong>, pixels the right camera cannot see.</li>
</ul>
<p>Larger windows are less noisy but blur depth edges.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="stereo" data-args="{}"></div></div><figcaption>Illustrative left and right image rows and the disparity map from block matching. Change the window size and the disparity range, and watch noise and edge blur trade off.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative rectified pair, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">400</span></span></span></span> px, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.12</span></span></span></span> m: a box face at 1.6 m in front of a textured wall at 4 m.</p>
<ol>
<li>Disparities: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">400</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.12/1.6</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">30</span></span></span></span> px for the box, 12 px for the wall. At 4 m, 1 px of disparity error is 0.33 m of depth.</li>
<li>Block matching with a 9 × 9 window: 77.6 % of pixels pass the uniqueness check (the rest are mostly the occluded strip beside the box and the left border). Away from depth edges 97.98 % are within 0.5 px.</li>
<li>At 1.6 m the median depth error is 1.2 mm; at 4 m it is 4.8 mm. Both match <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord">/</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mclose">)</span></span></span></span> times the measured median disparity error (0.023 and 0.014 px).</li>
<li><code>cv2.StereoBM</code> with the same window: 98.03 % of its valid pixels within 1 px of the truth, and it agrees with ours within 1 px on 98.02 % of the pixels both keep.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">stereo.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">try</span>:
    <span class="hljs-keyword">import</span> cv2
<span class="hljs-keyword">except</span> ImportError:
    cv2 = <span class="hljs-literal">None</span>

F, B, CX, CY, H, W = <span class="hljs-number">400.0</span>, <span class="hljs-number">0.12</span>, <span class="hljs-number">160.0</span>, <span class="hljs-number">120.0</span>, <span class="hljs-number">240</span>, <span class="hljs-number">320</span>              <span class="hljs-comment"># illustrative rectified pair: f in px, baseline in m</span>
RNG = np.random.default_rng(<span class="hljs-number">0</span>); WAVES = RNG.normal(<span class="hljs-number">0</span>, <span class="hljs-number">25</span>, (<span class="hljs-number">40</span>, <span class="hljs-number">2</span>)); PHASE = RNG.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">2</span> * np.pi, <span class="hljs-number">40</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">texture</span>(<span class="hljs-params">X, Y, z0</span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative surface pattern painted on each plane (a sum of random sinusoids in world metres)&quot;&quot;&quot;</span>
    s = np.zeros_like(X)
    <span class="hljs-keyword">for</span> (a, b), p <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(WAVES, PHASE): s += np.sin(a * X + b * Y + p + <span class="hljs-number">3</span> * z0)
    <span class="hljs-keyword">return</span> <span class="hljs-number">128</span> + <span class="hljs-number">22</span> * s / np.sqrt(<span class="hljs-built_in">len</span>(PHASE) / <span class="hljs-number">2</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">cam_x</span>):
    <span class="hljs-string">&quot;&quot;&quot;a camera at (cam_x, 0, 0) sees a 0.6 x 0.5 m box face at 1.6 m in front of a wall at 4 m&quot;&quot;&quot;</span>
    v, u = np.mgrid[<span class="hljs-number">0</span>:H, <span class="hljs-number">0</span>:W].astype(<span class="hljs-built_in">float</span>); img = np.empty((H, W)); depth = np.empty((H, W))
    <span class="hljs-keyword">for</span> z, box <span class="hljs-keyword">in</span> ((<span class="hljs-number">4.0</span>, <span class="hljs-literal">False</span>), (<span class="hljs-number">1.6</span>, <span class="hljs-literal">True</span>)):
        X = (u - CX) * z / F + cam_x; Y = (v - CY) * z / F
        hit = (np.<span class="hljs-built_in">abs</span>(X) &lt; <span class="hljs-number">0.3</span>) &amp; (np.<span class="hljs-built_in">abs</span>(Y) &lt; <span class="hljs-number">0.25</span>) <span class="hljs-keyword">if</span> box <span class="hljs-keyword">else</span> np.ones((H, W), <span class="hljs-built_in">bool</span>)
        img[hit] = texture(X, Y, z)[hit]; depth[hit] = z
    <span class="hljs-keyword">return</span> np.clip(img, <span class="hljs-number">0</span>, <span class="hljs-number">255</span>).astype(np.uint8), depth

<span class="hljs-keyword">def</span> <span class="hljs-title function_">block_match</span>(<span class="hljs-params">L, R, max_d=<span class="hljs-number">48</span>, half=<span class="hljs-number">4</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;for each left pixel, the disparity d minimising the sum of absolute differences with the right pixel d columns left,
    refined to sub-pixel by a parabola through the costs at d - 1, d, d + 1&quot;&quot;&quot;</span>
    L, R = L.astype(<span class="hljs-built_in">float</span>), R.astype(<span class="hljs-built_in">float</span>); k = <span class="hljs-number">2</span> * half + <span class="hljs-number">1</span>
    cost = np.full((max_d + <span class="hljs-number">1</span>, H, W), np.inf)
    <span class="hljs-keyword">for</span> d <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(max_d + <span class="hljs-number">1</span>):
        diff = np.<span class="hljs-built_in">abs</span>(L[:, d:] - R[:, :W - d])
        c = np.cumsum(np.cumsum(np.pad(diff, ((half + <span class="hljs-number">1</span>, half), (half + <span class="hljs-number">1</span>, half))), <span class="hljs-number">0</span>), <span class="hljs-number">1</span>)
        box = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
        cost[d][:, d:] = box
    d0 = np.argmin(cost, <span class="hljs-number">0</span>); i, j = np.indices(d0.shape)
    inner = (d0 &gt; <span class="hljs-number">0</span>) &amp; (d0 &lt; max_d)
    c0 = cost[np.clip(d0 - <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, max_d), i, j]; c1 = cost[d0, i, j]; c2 = cost[np.clip(d0 + <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, max_d), i, j]
    den = c0 - <span class="hljs-number">2</span> * c1 + c2
    <span class="hljs-keyword">with</span> np.errstate(<span class="hljs-built_in">all</span>=<span class="hljs-string">&quot;ignore&quot;</span>):
        sub = np.where(inner &amp; np.isfinite(den) &amp; (den &gt; <span class="hljs-number">0</span>), <span class="hljs-number">0.5</span> * (c0 - c2) / den, <span class="hljs-number">0.0</span>)
    disp = d0 + sub; best = c1
    second = np.where(np.<span class="hljs-built_in">abs</span>(np.arange(max_d + <span class="hljs-number">1</span>)[:, <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>] - d0) &gt; <span class="hljs-number">1</span>, cost, np.inf).<span class="hljs-built_in">min</span>(<span class="hljs-number">0</span>)
    valid = (j &gt;= max_d + half) &amp; (i &gt;= half) &amp; (i &lt; H - half) &amp; (j &lt; W - half) &amp; (best &lt; <span class="hljs-number">0.9</span> * second)   <span class="hljs-comment"># uniqueness check</span>
    <span class="hljs-keyword">return</span> disp, valid

<span class="hljs-keyword">def</span> <span class="hljs-title function_">depth_from_disparity</span>(<span class="hljs-params">d</span>): <span class="hljs-keyword">return</span> F * B / d

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_formula</span>():
    d_box, d_wall = F * B / <span class="hljs-number">1.6</span>, F * B / <span class="hljs-number">4.0</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;disparity of the box <span class="hljs-subst">{d_box:<span class="hljs-number">.1</span>f}</span> px, of the wall <span class="hljs-subst">{d_wall:<span class="hljs-number">.1</span>f}</span> px; 1 px of disparity error at 4 m is <span class="hljs-subst">{<span class="hljs-number">4.0</span> ** <span class="hljs-number">2</span> / (F * B):<span class="hljs-number">.2</span>f}</span> m of depth&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(d_box - <span class="hljs-number">30</span>) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(d_wall - <span class="hljs-number">12</span>) &lt; <span class="hljs-number">1e-9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_block_matching</span>():
    L, true_z = render(<span class="hljs-number">0.0</span>); R, _ = render(B)
    disp, valid = block_match(L, R)
    z = depth_from_disparity(np.maximum(disp, <span class="hljs-number">0.5</span>))
    inner = valid &amp; (np.<span class="hljs-built_in">abs</span>(true_z - np.roll(true_z, <span class="hljs-number">6</span>, <span class="hljs-number">1</span>)) == <span class="hljs-number">0</span>) &amp; (np.<span class="hljs-built_in">abs</span>(true_z - np.roll(true_z, -<span class="hljs-number">6</span>, <span class="hljs-number">1</span>)) == <span class="hljs-number">0</span>)
    err_d = np.<span class="hljs-built_in">abs</span>(disp - F * B / true_z)[inner]
    <span class="hljs-keyword">for</span> zz <span class="hljs-keyword">in</span> (<span class="hljs-number">1.6</span>, <span class="hljs-number">4.0</span>):
        m = inner &amp; (true_z == zz); e = np.<span class="hljs-built_in">abs</span>(z - true_z)[m]; ed = np.median(np.<span class="hljs-built_in">abs</span>(disp - F * B / zz)[m])
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;surface at <span class="hljs-subst">{zz}</span> m: median depth <span class="hljs-subst">{np.median(z[m]):<span class="hljs-number">.3</span>f}</span> m, median error <span class="hljs-subst">{<span class="hljs-number">1000</span> * np.median(e):<span class="hljs-number">.1</span>f}</span> mm; &quot;</span>
              <span class="hljs-string">f&quot;z^2 / fB times its median disparity error of <span class="hljs-subst">{ed:<span class="hljs-number">.3</span>f}</span> px predicts <span class="hljs-subst">{<span class="hljs-number">1000</span> * zz ** <span class="hljs-number">2</span> / (F * B) * ed:<span class="hljs-number">.1</span>f}</span> mm&quot;</span>)
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(np.median(e) - zz ** <span class="hljs-number">2</span> / (F * B) * ed) &lt; <span class="hljs-number">0.2</span> * np.median(e)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-number">100</span> * valid.mean():<span class="hljs-number">.1</span>f}</span> % of pixels pass the uniqueness check; <span class="hljs-subst">{<span class="hljs-number">100</span> * (err_d &lt; <span class="hljs-number">0.5</span>).mean():<span class="hljs-number">.2</span>f}</span> % of those away from edges are within 0.5 px&quot;</span>)
    <span class="hljs-keyword">assert</span> (err_d &lt; <span class="hljs-number">0.5</span>).mean() &gt; <span class="hljs-number">0.97</span>
    <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;OpenCV not installed: skipping the comparison&quot;</span>); <span class="hljs-keyword">return</span>
    bm = cv2.StereoBM_create(numDisparities=<span class="hljs-number">64</span>, blockSize=<span class="hljs-number">9</span>); dc = bm.compute(L, R).astype(<span class="hljs-built_in">float</span>) / <span class="hljs-number">16</span>
    ok = inner &amp; (dc &gt; <span class="hljs-number">0</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;cv2.StereoBM: <span class="hljs-subst">{<span class="hljs-number">100</span> * (np.<span class="hljs-built_in">abs</span>(dc - F * B / true_z)[ok] &lt; <span class="hljs-number">1</span>).mean():<span class="hljs-number">.2</span>f}</span> % of its valid pixels away from edges within 1 px of the truth; &quot;</span>
          <span class="hljs-string">f&quot;ours and OpenCV&#x27;s agree within 1 px on <span class="hljs-subst">{<span class="hljs-number">100</span> * (np.<span class="hljs-built_in">abs</span>(dc - disp)[ok &amp; valid] &lt; <span class="hljs-number">1</span>).mean():<span class="hljs-number">.2</span>f}</span> % of pixels both keep&quot;</span>)
    <span class="hljs-keyword">assert</span> (np.<span class="hljs-built_in">abs</span>(dc - disp)[ok &amp; valid] &lt; <span class="hljs-number">1</span>).mean() &gt; <span class="hljs-number">0.95</span>

test_formula()
test_block_matching()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A stereo camera has <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">700</span></span></span></span> px and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.06</span></span></span></span> m, with disparity error 0.25 px. What depth error do you expect at 1 m and at 5 m?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal">d</span><span class="mord">/</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.25/42</span></span></span></span>: 6 mm at 1 m and 149 mm at 5 m.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does block matching fail on a plain white wall?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Every window along the row looks the same, so the cost curve is flat and the minimum is decided by noise. The uniqueness check rejects these pixels. Active stereo cameras project a random infrared dot pattern to give such surfaces texture.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l12"></div>
`,i=[{id:`disparity-and-depth`,title:`Disparity and depth`},{id:`how-good-is-the-depth`,title:`How good is the depth`},{id:`block-matching`,title:`Block matching`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l12-q1`,type:`num`,q:`<p>Depth of a point with disparity 20 px, f = 500 px, B = 0.1 m?</p>
`,explain:`<p>z = fB/d.</p>
`,answer:2.5,tol:.001,unit:`m`},{id:`p17-l12-q2`,type:`num`,q:`<p>Disparity of a point at 5 m with f = 600 px and B = 0.2 m?</p>
`,explain:`<p>d = fB/z.</p>
`,answer:24,tol:.001,unit:`px`},{id:`p17-l12-q3`,type:`num`,q:`<p>Depth error at 3 m for 0.5 px disparity error, f = 600 px, B = 0.1 m?</p>
`,explain:`<p>z^2 δd / (fB).</p>
`,answer:.075,tol:.002,unit:`m`},{id:`p17-l12-q4`,type:`num`,q:`<p>Factor by which depth error grows when distance doubles?</p>
`,explain:`<p>It scales with z^2.</p>
`,answer:4,tol:.001,unit:``},{id:`p17-l12-q5`,type:`mc`,q:`<p>Rectification makes stereo matching…</p>
`,explain:`<p>Corresponding points share a row.</p>
`,options:[`work without calibration`,`a 1D search along the same row`,`independent of texture`,`unnecessary`],answer:1},{id:`p17-l12-q6`,type:`mc`,q:`<p>Increasing the block-matching window size…</p>
`,explain:`<p>Bigger windows average over more pixels, including across edges.</p>
`,options:[`reduces noise but blurs depth edges`,`sharpens depth edges`,`removes occlusions`,`increases the baseline`],answer:0}],o=[{file:`stereo.py`,lang:`python`,src:`import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

F, B, CX, CY, H, W = 400.0, 0.12, 160.0, 120.0, 240, 320              # illustrative rectified pair: f in px, baseline in m
RNG = np.random.default_rng(0); WAVES = RNG.normal(0, 25, (40, 2)); PHASE = RNG.uniform(0, 2 * np.pi, 40)

def texture(X, Y, z0):
    """illustrative surface pattern painted on each plane (a sum of random sinusoids in world metres)"""
    s = np.zeros_like(X)
    for (a, b), p in zip(WAVES, PHASE): s += np.sin(a * X + b * Y + p + 3 * z0)
    return 128 + 22 * s / np.sqrt(len(PHASE) / 2)

def render(cam_x):
    """a camera at (cam_x, 0, 0) sees a 0.6 x 0.5 m box face at 1.6 m in front of a wall at 4 m"""
    v, u = np.mgrid[0:H, 0:W].astype(float); img = np.empty((H, W)); depth = np.empty((H, W))
    for z, box in ((4.0, False), (1.6, True)):
        X = (u - CX) * z / F + cam_x; Y = (v - CY) * z / F
        hit = (np.abs(X) < 0.3) & (np.abs(Y) < 0.25) if box else np.ones((H, W), bool)
        img[hit] = texture(X, Y, z)[hit]; depth[hit] = z
    return np.clip(img, 0, 255).astype(np.uint8), depth

def block_match(L, R, max_d=48, half=4):
    """for each left pixel, the disparity d minimising the sum of absolute differences with the right pixel d columns left,
    refined to sub-pixel by a parabola through the costs at d - 1, d, d + 1"""
    L, R = L.astype(float), R.astype(float); k = 2 * half + 1
    cost = np.full((max_d + 1, H, W), np.inf)
    for d in range(max_d + 1):
        diff = np.abs(L[:, d:] - R[:, :W - d])
        c = np.cumsum(np.cumsum(np.pad(diff, ((half + 1, half), (half + 1, half))), 0), 1)
        box = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
        cost[d][:, d:] = box
    d0 = np.argmin(cost, 0); i, j = np.indices(d0.shape)
    inner = (d0 > 0) & (d0 < max_d)
    c0 = cost[np.clip(d0 - 1, 0, max_d), i, j]; c1 = cost[d0, i, j]; c2 = cost[np.clip(d0 + 1, 0, max_d), i, j]
    den = c0 - 2 * c1 + c2
    with np.errstate(all="ignore"):
        sub = np.where(inner & np.isfinite(den) & (den > 0), 0.5 * (c0 - c2) / den, 0.0)
    disp = d0 + sub; best = c1
    second = np.where(np.abs(np.arange(max_d + 1)[:, None, None] - d0) > 1, cost, np.inf).min(0)
    valid = (j >= max_d + half) & (i >= half) & (i < H - half) & (j < W - half) & (best < 0.9 * second)   # uniqueness check
    return disp, valid

def depth_from_disparity(d): return F * B / d

def test_formula():
    d_box, d_wall = F * B / 1.6, F * B / 4.0
    print(f"disparity of the box {d_box:.1f} px, of the wall {d_wall:.1f} px; 1 px of disparity error at 4 m is {4.0 ** 2 / (F * B):.2f} m of depth")
    assert abs(d_box - 30) < 1e-9 and abs(d_wall - 12) < 1e-9

def test_block_matching():
    L, true_z = render(0.0); R, _ = render(B)
    disp, valid = block_match(L, R)
    z = depth_from_disparity(np.maximum(disp, 0.5))
    inner = valid & (np.abs(true_z - np.roll(true_z, 6, 1)) == 0) & (np.abs(true_z - np.roll(true_z, -6, 1)) == 0)
    err_d = np.abs(disp - F * B / true_z)[inner]
    for zz in (1.6, 4.0):
        m = inner & (true_z == zz); e = np.abs(z - true_z)[m]; ed = np.median(np.abs(disp - F * B / zz)[m])
        print(f"surface at {zz} m: median depth {np.median(z[m]):.3f} m, median error {1000 * np.median(e):.1f} mm; "
              f"z^2 / fB times its median disparity error of {ed:.3f} px predicts {1000 * zz ** 2 / (F * B) * ed:.1f} mm")
        assert abs(np.median(e) - zz ** 2 / (F * B) * ed) < 0.2 * np.median(e)
    print(f"{100 * valid.mean():.1f} % of pixels pass the uniqueness check; {100 * (err_d < 0.5).mean():.2f} % of those away from edges are within 0.5 px")
    assert (err_d < 0.5).mean() > 0.97
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    bm = cv2.StereoBM_create(numDisparities=64, blockSize=9); dc = bm.compute(L, R).astype(float) / 16
    ok = inner & (dc > 0)
    print(f"cv2.StereoBM: {100 * (np.abs(dc - F * B / true_z)[ok] < 1).mean():.2f} % of its valid pixels away from edges within 1 px of the truth; "
          f"ours and OpenCV's agree within 1 px on {100 * (np.abs(dc - disp)[ok & valid] < 1).mean():.2f} % of pixels both keep")
    assert (np.abs(dc - disp)[ok & valid] < 1).mean() > 0.95

test_formula()
test_block_matching()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};