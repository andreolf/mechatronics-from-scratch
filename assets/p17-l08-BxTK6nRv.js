var e=`p17-l08`,t=40,n=`To find the same point in two images you need a fingerprint of its surroundings. You implement a BRIEF-like binary descriptor, match with Hamming distance and Lowe’s ratio test, and show the ratio test lifting the inlier ratio from 73 % to 97 % on an illustrative pair of views with occlusions and distractors, identical to OpenCV’s brute-force matcher.`,r=`<h2 id="binary-descriptors">Binary descriptors</h2>
<p>A <strong>descriptor</strong> turns the patch around a keypoint into a vector that is similar for the same point seen again and different for other points. <strong>BRIEF</strong> is the simplest: smooth the image, pick a fixed random set of 256 point pairs <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">p</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span> inside the patch, and set bit <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6595em;"></span><span class="mord mathnormal">i</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">p</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span>. The result is 32 bytes.</p>
<p>Comparisons ignore any brightness gain and offset, so the descriptor survives lighting changes. Plain BRIEF is not rotation invariant; <strong>ORB</strong> adds an orientation from the patch’s intensity centroid and rotates the pairs to match.</p>
<h2 id="hamming-distance">Hamming distance</h2>
<p>The distance between two binary descriptors is the number of differing bits, <code>popcount(a XOR b)</code>, a few machine instructions. Unrelated patches differ in about half the bits (128 of 256); the same point seen again differs in far fewer.</p>
<h2 id="the-ratio-test">The ratio test</h2>
<p>The nearest neighbour is not always right: a point may be occluded in the other view, or repeated texture may give several similar candidates. <strong>Lowe’s ratio test</strong> keeps a match only if the best distance is clearly smaller than the second best,</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">d</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">ρ</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">d</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">ρ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.7</span><span class="mord text"><span class="mord">\xA0to\xA0</span></span><span class="mord">0.8.</span></span></span></span></span></div>
<p>A correct match stands out; an ambiguous or wrong one usually has a close runner-up. The test throws away some good matches to remove most bad ones, and what remains goes to RANSAC (lesson 10).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="matching" data-args="{}"></div></div><figcaption>Keypoints matched between two illustrative views. Lime lines are correct matches, red ones wrong. Move the ratio threshold and the noise, and watch the inlier ratio.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative textured scene and a second view moved by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">17.3</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">9.6</span><span class="mclose">)</span></span></span></span> px, rotated 8°, 15 % brighter with an offset and noise of 6 levels. 150 keypoints in view 1; 30 % of them are occluded in view 2, which has 60 keypoints of its own.</p>
<ol>
<li>A keypoint’s descriptor is 256 bits; distance to itself 0, to a different keypoint 119, about half.</li>
<li>Brightening the image by gain 1.3 and offset 20 changes no bits.</li>
<li>Ratio 1.0 (plain nearest neighbour): 144 matches, 72.9 % correct.</li>
<li>Ratio 0.8: 103 matches, 97.1 % correct. Ratio 0.7: 96 matches, 97.9 %.</li>
<li><code>cv2.BFMatcher</code> with <code>NORM_HAMMING</code> and <code>knnMatch(k=2)</code> with the same ratio gives the same 103 matches.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">matching.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">try</span>:
    <span class="hljs-keyword">import</span> cv2
<span class="hljs-keyword">except</span> ImportError:
    cv2 = <span class="hljs-literal">None</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">texture</span>(<span class="hljs-params">H=<span class="hljs-number">200</span>, W=<span class="hljs-number">260</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative textured scene: smoothed random noise, contrast-stretched, as a float image&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); f = rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, (H, W))
    F = np.fft.fft2(f); ky, kx = np.meshgrid(np.fft.fftfreq(H), np.fft.fftfreq(W), indexing=<span class="hljs-string">&quot;ij&quot;</span>)
    f = np.real(np.fft.ifft2(F * np.exp(-(kx ** <span class="hljs-number">2</span> + ky ** <span class="hljs-number">2</span>) / (<span class="hljs-number">2</span> * <span class="hljs-number">0.06</span> ** <span class="hljs-number">2</span>))))
    <span class="hljs-keyword">return</span> <span class="hljs-number">128</span> + <span class="hljs-number">50</span> * f / f.std()

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bilinear</span>(<span class="hljs-params">img, x, y</span>):
    x0, y0 = np.floor(x).astype(<span class="hljs-built_in">int</span>), np.floor(y).astype(<span class="hljs-built_in">int</span>); ax, ay = x - x0, y - y0
    x0 = np.clip(x0, <span class="hljs-number">0</span>, img.shape[<span class="hljs-number">1</span>] - <span class="hljs-number">2</span>); y0 = np.clip(y0, <span class="hljs-number">0</span>, img.shape[<span class="hljs-number">0</span>] - <span class="hljs-number">2</span>)
    <span class="hljs-keyword">return</span> ((<span class="hljs-number">1</span> - ay) * ((<span class="hljs-number">1</span> - ax) * img[y0, x0] + ax * img[y0, x0 + <span class="hljs-number">1</span>]) + ay * ((<span class="hljs-number">1</span> - ax) * img[y0 + <span class="hljs-number">1</span>, x0] + ax * img[y0 + <span class="hljs-number">1</span>, x0 + <span class="hljs-number">1</span>]))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">second_view</span>(<span class="hljs-params">img, shift=(<span class="hljs-params"><span class="hljs-number">17.3</span>, -<span class="hljs-number">9.6</span></span>), angle_deg=<span class="hljs-number">8.0</span>, gain=<span class="hljs-number">1.15</span>, bias=-<span class="hljs-number">12</span>, noise=<span class="hljs-number">3.0</span>, seed=<span class="hljs-number">1</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;the same scene moved, slightly rotated, brighter and noisier; returns the image and the map from view 1 to view 2&quot;&quot;&quot;</span>
    a = np.radians(angle_deg); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]); c = np.array([<span class="hljs-number">130</span>, <span class="hljs-number">100</span>]); t = np.array(shift)
    to2 = <span class="hljs-keyword">lambda</span> p: (p - c) @ R.T + c + t
    H, W = img.shape; ys, xs = np.mgrid[<span class="hljs-number">0</span>:H, <span class="hljs-number">0</span>:W].astype(<span class="hljs-built_in">float</span>)
    q = (np.c_[xs.ravel(), ys.ravel()] - c - t) @ R + c                   <span class="hljs-comment"># inverse map: where each view-2 pixel came from</span>
    out = gain * bilinear(img, q[:, <span class="hljs-number">0</span>], q[:, <span class="hljs-number">1</span>]).reshape(H, W) + bias
    <span class="hljs-keyword">return</span> out + np.random.default_rng(seed).normal(<span class="hljs-number">0</span>, noise, out.shape), to2

PAIRS = np.random.default_rng(<span class="hljs-number">42</span>).integers(-<span class="hljs-number">12</span>, <span class="hljs-number">13</span>, (<span class="hljs-number">256</span>, <span class="hljs-number">4</span>))           <span class="hljs-comment"># 256 random point pairs in a 25 x 25 patch</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">describe</span>(<span class="hljs-params">img, pts</span>):
    <span class="hljs-string">&quot;&quot;&quot;BRIEF-like binary descriptor: bit i is 1 when the pixel at pair i&#x27;s first point is darker than at its second&quot;&quot;&quot;</span>
    x, y = np.<span class="hljs-built_in">round</span>(pts[:, <span class="hljs-number">0</span>]).astype(<span class="hljs-built_in">int</span>), np.<span class="hljs-built_in">round</span>(pts[:, <span class="hljs-number">1</span>]).astype(<span class="hljs-built_in">int</span>)
    a = img[y[:, <span class="hljs-literal">None</span>] + PAIRS[:, <span class="hljs-number">1</span>], x[:, <span class="hljs-literal">None</span>] + PAIRS[:, <span class="hljs-number">0</span>]]; b = img[y[:, <span class="hljs-literal">None</span>] + PAIRS[:, <span class="hljs-number">3</span>], x[:, <span class="hljs-literal">None</span>] + PAIRS[:, <span class="hljs-number">2</span>]]
    <span class="hljs-keyword">return</span> np.packbits(a &lt; b, axis=<span class="hljs-number">1</span>)                                     <span class="hljs-comment"># 32 bytes per keypoint</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">hamming</span>(<span class="hljs-params">D1, D2</span>):
    <span class="hljs-string">&quot;&quot;&quot;all pairwise Hamming distances: count the differing bits&quot;&quot;&quot;</span>
    <span class="hljs-keyword">return</span> np.unpackbits(D1[:, <span class="hljs-literal">None</span>, :] ^ D2[<span class="hljs-literal">None</span>, :, :], axis=<span class="hljs-number">2</span>).<span class="hljs-built_in">sum</span>(<span class="hljs-number">2</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">match</span>(<span class="hljs-params">D1, D2, ratio=<span class="hljs-number">0.8</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;nearest neighbour in descriptor space, kept only if clearly better than the second nearest (Lowe&#x27;s ratio test)&quot;&quot;&quot;</span>
    d = hamming(D1, D2); idx = np.argsort(d, axis=<span class="hljs-number">1</span>)
    best, second = d[np.arange(<span class="hljs-built_in">len</span>(d)), idx[:, <span class="hljs-number">0</span>]], d[np.arange(<span class="hljs-built_in">len</span>(d)), idx[:, <span class="hljs-number">1</span>]]
    keep = best &lt; ratio * second
    <span class="hljs-keyword">return</span> np.c_[np.nonzero(keep)[<span class="hljs-number">0</span>], idx[keep, <span class="hljs-number">0</span>]], best

<span class="hljs-keyword">def</span> <span class="hljs-title function_">keypoints</span>(<span class="hljs-params">img, n=<span class="hljs-number">150</span>, border=<span class="hljs-number">20</span>, seed=<span class="hljs-number">2</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;for this lesson, keypoints at random positions; in practice from a corner detector (lesson 07)&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); H, W = img.shape
    <span class="hljs-keyword">return</span> rng.uniform([border + <span class="hljs-number">20</span>, border + <span class="hljs-number">20</span>], [W - border - <span class="hljs-number">20</span>, H - border - <span class="hljs-number">20</span>], (n, <span class="hljs-number">2</span>))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">evaluate</span>(<span class="hljs-params">ratio=<span class="hljs-number">0.8</span>, noise=<span class="hljs-number">6.0</span></span>):
    img1 = texture(); img2, to2 = second_view(img1, noise=noise)
    p1 = keypoints(img1); p2 = to2(p1)
    keep2 = (p2[:, <span class="hljs-number">0</span>] &gt; <span class="hljs-number">20</span>) &amp; (p2[:, <span class="hljs-number">0</span>] &lt; <span class="hljs-number">240</span>) &amp; (p2[:, <span class="hljs-number">1</span>] &gt; <span class="hljs-number">20</span>) &amp; (p2[:, <span class="hljs-number">1</span>] &lt; <span class="hljs-number">180</span>)
    p1, p2 = p1[keep2], p2[keep2]
    rng = np.random.default_rng(<span class="hljs-number">3</span>); seen = rng.random(<span class="hljs-built_in">len</span>(p2)) &lt; <span class="hljs-number">0.7</span>      <span class="hljs-comment"># 30 % of the points are occluded in view 2,</span>
    p2 = np.r_[p2[seen], rng.uniform([<span class="hljs-number">30</span>, <span class="hljs-number">30</span>], [<span class="hljs-number">230</span>, <span class="hljs-number">170</span>], (<span class="hljs-number">60</span>, <span class="hljs-number">2</span>))]      <span class="hljs-comment"># and view 2 has 60 keypoints of its own</span>
    p2 = p2[rng.permutation(<span class="hljs-built_in">len</span>(p2))]                                     <span class="hljs-comment"># shuffle so the index tells nothing</span>
    D1, D2 = describe(img1, p1), describe(img2, p2)
    m, _ = <span class="hljs-keyword">match</span>(D1, D2, ratio)
    good = np.linalg.norm(to2(p1[m[:, <span class="hljs-number">0</span>]]) - p2[m[:, <span class="hljs-number">1</span>]], axis=<span class="hljs-number">1</span>) &lt; <span class="hljs-number">2</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">len</span>(p1), <span class="hljs-built_in">len</span>(m), good.mean(), D1, D2

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_descriptor_basics</span>():
    img = texture(); p = keypoints(img)[:<span class="hljs-number">5</span>]; D = describe(img, p)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;descriptor: <span class="hljs-subst">{D.shape[<span class="hljs-number">1</span>]}</span> bytes = <span class="hljs-subst">{<span class="hljs-number">8</span> * D.shape[<span class="hljs-number">1</span>]}</span> bits; distance of a keypoint to itself <span class="hljs-subst">{hamming(D[:<span class="hljs-number">1</span>], D[:<span class="hljs-number">1</span>])[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]}</span>, to a different one <span class="hljs-subst">{hamming(D[:<span class="hljs-number">1</span>], D[<span class="hljs-number">1</span>:<span class="hljs-number">2</span>])[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>]}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> D.shape[<span class="hljs-number">1</span>] == <span class="hljs-number">32</span> <span class="hljs-keyword">and</span> hamming(D[:<span class="hljs-number">1</span>], D[:<span class="hljs-number">1</span>])[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>] == <span class="hljs-number">0</span>
    brighter = describe(<span class="hljs-number">1.3</span> * img + <span class="hljs-number">20</span>, p)
    <span class="hljs-keyword">assert</span> (hamming(D, brighter).diagonal() == <span class="hljs-number">0</span>).<span class="hljs-built_in">all</span>()                  <span class="hljs-comment"># comparisons ignore gain and offset</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_ratio_test</span>():
    res = []
    <span class="hljs-keyword">for</span> ratio <span class="hljs-keyword">in</span> (<span class="hljs-number">1.0</span>, <span class="hljs-number">0.8</span>, <span class="hljs-number">0.7</span>):
        n, m, inl, *_ = evaluate(ratio)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;ratio <span class="hljs-subst">{ratio}</span>: <span class="hljs-subst">{m}</span> of <span class="hljs-subst">{n}</span> keypoints matched, inlier ratio <span class="hljs-subst">{<span class="hljs-number">100</span> * inl:<span class="hljs-number">.1</span>f}</span> %&quot;</span>)
        res.append(inl)
    n, m, inl, D1, D2 = evaluate(<span class="hljs-number">0.8</span>)
    <span class="hljs-keyword">assert</span> inl &gt; <span class="hljs-number">0.9</span> <span class="hljs-keyword">and</span> res[<span class="hljs-number">1</span>] &gt; res[<span class="hljs-number">0</span>] + <span class="hljs-number">0.2</span>
    <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;OpenCV not installed: skipping the comparison&quot;</span>); <span class="hljs-keyword">return</span>
    knn = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(D1, D2, k=<span class="hljs-number">2</span>)
    ref = <span class="hljs-built_in">sorted</span>((a.queryIdx, a.trainIdx) <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> knn <span class="hljs-keyword">if</span> a.distance &lt; <span class="hljs-number">0.8</span> * b.distance)
    ours = <span class="hljs-built_in">sorted</span>(<span class="hljs-built_in">map</span>(<span class="hljs-built_in">tuple</span>, <span class="hljs-keyword">match</span>(D1, D2, <span class="hljs-number">0.8</span>)[<span class="hljs-number">0</span>].tolist()))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;cv2.BFMatcher (NORM_HAMMING, k = 2) with the same ratio test gives the same <span class="hljs-subst">{<span class="hljs-built_in">len</span>(ref)}</span> matches: <span class="hljs-subst">{ref == ours}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> ref == ours

test_descriptor_basics()
test_ratio_test()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why is brute-force matching acceptable for a few hundred keypoints but not for a million-image database?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Brute force costs <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">n</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal">n</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> Hamming distances: 40 000 for 200 × 200, trivial. A large database needs approximate nearest-neighbour search (locality-sensitive hashing, vocabulary trees) that trades a little accuracy for orders of magnitude in speed.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A keypoint’s best distance is 40 and its second best 45. Does it pass the ratio test with 0.8?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6835em;vertical-align:-0.0391em;"></span><span class="mord">40</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.8</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">45</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">36</span></span></span></span> is false, so the match is rejected as ambiguous.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l08"></div>
`,i=[{id:`binary-descriptors`,title:`Binary descriptors`},{id:`hamming-distance`,title:`Hamming distance`},{id:`the-ratio-test`,title:`The ratio test`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l08-q1`,type:`num`,q:`<p>Bytes in a 256-bit binary descriptor?</p>
`,explain:`<p>8 bits per byte.</p>
`,answer:32,tol:.001,unit:``},{id:`p17-l08-q2`,type:`num`,q:`<p>Hamming distance between 10110010 and 10011011?</p>
`,explain:`<p>Count the differing bits.</p>
`,answer:3,tol:.001,unit:``},{id:`p17-l08-q3`,type:`num`,q:`<p>Expected Hamming distance between two unrelated 256-bit descriptors?</p>
`,explain:`<p>Each bit differs with probability one half.</p>
`,answer:128,tol:.001,unit:``},{id:`p17-l08-q4`,type:`num`,q:`<p>Largest best distance that passes a 0.75 ratio test when the second best is 80?</p>
`,explain:`<p>It must be strictly below 60.</p>
`,answer:59,tol:.001,unit:``},{id:`p17-l08-q5`,type:`mc`,q:`<p>Lowe’s ratio test rejects a match when…</p>
`,explain:`<p>Ambiguous matches are usually wrong.</p>
`,options:[`the descriptor has too many ones`,`the best distance is above 128`,`the keypoints are far apart in the image`,`the second-best candidate is nearly as close as the best`],answer:3},{id:`p17-l08-q6`,type:`mc`,q:`<p>BRIEF descriptors are unaffected by…</p>
`,explain:`<p>Comparisons of pixel pairs do not change.</p>
`,options:[`a change of scale`,`a change of brightness gain and offset`,`a large rotation`,`a change of viewpoint`],answer:1}],o=[{file:`matching.py`,lang:`python`,src:`import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

def texture(H=200, W=260, seed=0):
    """illustrative textured scene: smoothed random noise, contrast-stretched, as a float image"""
    rng = np.random.default_rng(seed); f = rng.normal(0, 1, (H, W))
    F = np.fft.fft2(f); ky, kx = np.meshgrid(np.fft.fftfreq(H), np.fft.fftfreq(W), indexing="ij")
    f = np.real(np.fft.ifft2(F * np.exp(-(kx ** 2 + ky ** 2) / (2 * 0.06 ** 2))))
    return 128 + 50 * f / f.std()

def bilinear(img, x, y):
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int); ax, ay = x - x0, y - y0
    x0 = np.clip(x0, 0, img.shape[1] - 2); y0 = np.clip(y0, 0, img.shape[0] - 2)
    return ((1 - ay) * ((1 - ax) * img[y0, x0] + ax * img[y0, x0 + 1]) + ay * ((1 - ax) * img[y0 + 1, x0] + ax * img[y0 + 1, x0 + 1]))

def second_view(img, shift=(17.3, -9.6), angle_deg=8.0, gain=1.15, bias=-12, noise=3.0, seed=1):
    """the same scene moved, slightly rotated, brighter and noisier; returns the image and the map from view 1 to view 2"""
    a = np.radians(angle_deg); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]); c = np.array([130, 100]); t = np.array(shift)
    to2 = lambda p: (p - c) @ R.T + c + t
    H, W = img.shape; ys, xs = np.mgrid[0:H, 0:W].astype(float)
    q = (np.c_[xs.ravel(), ys.ravel()] - c - t) @ R + c                   # inverse map: where each view-2 pixel came from
    out = gain * bilinear(img, q[:, 0], q[:, 1]).reshape(H, W) + bias
    return out + np.random.default_rng(seed).normal(0, noise, out.shape), to2

PAIRS = np.random.default_rng(42).integers(-12, 13, (256, 4))           # 256 random point pairs in a 25 x 25 patch

def describe(img, pts):
    """BRIEF-like binary descriptor: bit i is 1 when the pixel at pair i's first point is darker than at its second"""
    x, y = np.round(pts[:, 0]).astype(int), np.round(pts[:, 1]).astype(int)
    a = img[y[:, None] + PAIRS[:, 1], x[:, None] + PAIRS[:, 0]]; b = img[y[:, None] + PAIRS[:, 3], x[:, None] + PAIRS[:, 2]]
    return np.packbits(a < b, axis=1)                                     # 32 bytes per keypoint

def hamming(D1, D2):
    """all pairwise Hamming distances: count the differing bits"""
    return np.unpackbits(D1[:, None, :] ^ D2[None, :, :], axis=2).sum(2)

def match(D1, D2, ratio=0.8):
    """nearest neighbour in descriptor space, kept only if clearly better than the second nearest (Lowe's ratio test)"""
    d = hamming(D1, D2); idx = np.argsort(d, axis=1)
    best, second = d[np.arange(len(d)), idx[:, 0]], d[np.arange(len(d)), idx[:, 1]]
    keep = best < ratio * second
    return np.c_[np.nonzero(keep)[0], idx[keep, 0]], best

def keypoints(img, n=150, border=20, seed=2):
    """for this lesson, keypoints at random positions; in practice from a corner detector (lesson 07)"""
    rng = np.random.default_rng(seed); H, W = img.shape
    return rng.uniform([border + 20, border + 20], [W - border - 20, H - border - 20], (n, 2))

def evaluate(ratio=0.8, noise=6.0):
    img1 = texture(); img2, to2 = second_view(img1, noise=noise)
    p1 = keypoints(img1); p2 = to2(p1)
    keep2 = (p2[:, 0] > 20) & (p2[:, 0] < 240) & (p2[:, 1] > 20) & (p2[:, 1] < 180)
    p1, p2 = p1[keep2], p2[keep2]
    rng = np.random.default_rng(3); seen = rng.random(len(p2)) < 0.7      # 30 % of the points are occluded in view 2,
    p2 = np.r_[p2[seen], rng.uniform([30, 30], [230, 170], (60, 2))]      # and view 2 has 60 keypoints of its own
    p2 = p2[rng.permutation(len(p2))]                                     # shuffle so the index tells nothing
    D1, D2 = describe(img1, p1), describe(img2, p2)
    m, _ = match(D1, D2, ratio)
    good = np.linalg.norm(to2(p1[m[:, 0]]) - p2[m[:, 1]], axis=1) < 2
    return len(p1), len(m), good.mean(), D1, D2

def test_descriptor_basics():
    img = texture(); p = keypoints(img)[:5]; D = describe(img, p)
    print(f"descriptor: {D.shape[1]} bytes = {8 * D.shape[1]} bits; distance of a keypoint to itself {hamming(D[:1], D[:1])[0, 0]}, to a different one {hamming(D[:1], D[1:2])[0, 0]}")
    assert D.shape[1] == 32 and hamming(D[:1], D[:1])[0, 0] == 0
    brighter = describe(1.3 * img + 20, p)
    assert (hamming(D, brighter).diagonal() == 0).all()                  # comparisons ignore gain and offset

def test_ratio_test():
    res = []
    for ratio in (1.0, 0.8, 0.7):
        n, m, inl, *_ = evaluate(ratio)
        print(f"ratio {ratio}: {m} of {n} keypoints matched, inlier ratio {100 * inl:.1f} %")
        res.append(inl)
    n, m, inl, D1, D2 = evaluate(0.8)
    assert inl > 0.9 and res[1] > res[0] + 0.2
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    knn = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(D1, D2, k=2)
    ref = sorted((a.queryIdx, a.trainIdx) for a, b in knn if a.distance < 0.8 * b.distance)
    ours = sorted(map(tuple, match(D1, D2, 0.8)[0].tolist()))
    print(f"cv2.BFMatcher (NORM_HAMMING, k = 2) with the same ratio test gives the same {len(ref)} matches: {ref == ours}")
    assert ref == ours

test_descriptor_basics()
test_ratio_test()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};