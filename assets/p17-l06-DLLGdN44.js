var e=`p17-l06`,t=35,n=`Many industrial vision tasks come down to separating bright parts from a dark background and counting them. You implement Otsu’s automatic threshold, morphological opening to remove noise and connected-component labelling for area and centroid, and count illustrative parts on a noisy conveyor exactly, matching OpenCV.`,r=`<h2 id="choosing-a-threshold">Choosing a threshold</h2>
<p>A binary mask <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&gt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> splits pixels into background and foreground. <strong>Otsu’s method</strong> picks <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> from the histogram alone: it maximises the between-class variance</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1141em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">σ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8641em;"><span style="top:-2.453em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">b</span></span></span><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.2em;vertical-align:-0.35em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0269em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0269em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="delimsizing size1">(</span></span><span class="mord"><span class="mord mathnormal">μ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.404em;vertical-align:-0.35em;"></span><span class="mord"><span class="mord mathnormal">μ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mord"><span class="mord"><span class="delimsizing size1">)</span></span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:1.054em;"><span style="top:-3.3029em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mpunct">,</span></span></span></span></span></div>
<p>where <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0269em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0269em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> are the fractions of pixels below and above <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">μ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">μ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> their means. With cumulative sums it costs one pass over 256 levels. It works well when the histogram has two clear peaks; with uneven lighting, threshold small tiles separately (adaptive thresholding).</p>
<h2 id="cleaning-the-mask">Cleaning the mask</h2>
<p>Noise leaves isolated specks in the mask. <strong>Morphology</strong> fixes this with min and max filters on the binary image:</p>
<ul>
<li><strong>Erosion</strong> keeps a pixel only if its whole neighbourhood is foreground (shrinks blobs, deletes specks).</li>
<li><strong>Dilation</strong> sets a pixel if any neighbour is foreground (grows blobs, fills pinholes).</li>
<li><strong>Opening</strong> is erosion then dilation: specks vanish, large blobs return to roughly their shape.</li>
</ul>
<h2 id="connected-components">Connected components</h2>
<p>A <strong>connected component</strong> is a maximal set of foreground pixels linked through neighbours (4-connected: edges only; 8-connected: corners too). Label them with a flood fill from each unlabelled foreground pixel, or with OpenCV’s faster two-pass union-find. Each component gives its area, bounding box and centroid, the mean of its pixel coordinates, accurate to a fraction of a pixel. Filtering by area removes what survives the opening.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="blobs" data-args="{}"></div></div><figcaption>Illustrative parts on a noisy conveyor. Move the threshold or press Otsu, toggle the opening, and add noise, and watch the component count against the true count.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative 160 × 120 image of 9 bright discs (levels 160 to 210) on a background of 60, with noise of standard deviation 30.</p>
<ol>
<li>Otsu chooses threshold 115, the same as <code>cv2.threshold</code> with <code>THRESH_OTSU</code>.</li>
<li>The raw mask has 435 components, almost all specks of noise. <code>cv2.connectedComponentsWithStats</code> agrees on the count and the label image.</li>
<li>After a 3 × 3 opening and a 20-pixel minimum area: 9 components, the true count.</li>
<li>The largest centroid error is 0.29 px.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">blobs.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> collections <span class="hljs-keyword">import</span> deque
<span class="hljs-keyword">try</span>:
    <span class="hljs-keyword">import</span> cv2
<span class="hljs-keyword">except</span> ImportError:
    cv2 = <span class="hljs-literal">None</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_image</span>(<span class="hljs-params">n=<span class="hljs-number">9</span>, noise=<span class="hljs-number">30.0</span>, seed=<span class="hljs-number">3</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative 120 x 160 image of n non-overlapping bright parts (discs) on a dark conveyor, with noise&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); y, x = np.mgrid[<span class="hljs-number">0</span>:<span class="hljs-number">120</span>, <span class="hljs-number">0</span>:<span class="hljs-number">160</span>]
    img = np.full((<span class="hljs-number">120</span>, <span class="hljs-number">160</span>), <span class="hljs-number">60.0</span>); truth = []
    <span class="hljs-keyword">while</span> <span class="hljs-built_in">len</span>(truth) &lt; n:
        c = rng.uniform([<span class="hljs-number">14</span>, <span class="hljs-number">14</span>], [<span class="hljs-number">106</span>, <span class="hljs-number">146</span>]); r = rng.uniform(<span class="hljs-number">6</span>, <span class="hljs-number">11</span>)
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">all</span>(np.hypot(*(c - d)) &gt; r + s + <span class="hljs-number">4</span> <span class="hljs-keyword">for</span> d, s <span class="hljs-keyword">in</span> truth):
            truth.append((c, r)); img[(y - c[<span class="hljs-number">0</span>]) ** <span class="hljs-number">2</span> + (x - c[<span class="hljs-number">1</span>]) ** <span class="hljs-number">2</span> &lt;= r * r] = rng.uniform(<span class="hljs-number">160</span>, <span class="hljs-number">210</span>)
    img = np.clip(img + rng.normal(<span class="hljs-number">0</span>, noise, img.shape), <span class="hljs-number">0</span>, <span class="hljs-number">255</span>).astype(np.uint8)
    <span class="hljs-keyword">return</span> img, truth

<span class="hljs-keyword">def</span> <span class="hljs-title function_">otsu</span>(<span class="hljs-params">img</span>):
    <span class="hljs-string">&quot;&quot;&quot;the threshold t that maximises the between-class variance w0 w1 (mu0 - mu1)^2 of the histogram&quot;&quot;&quot;</span>
    p = np.bincount(img.ravel(), minlength=<span class="hljs-number">256</span>) / img.size; levels = np.arange(<span class="hljs-number">256</span>)
    w0 = np.cumsum(p); mu = np.cumsum(p * levels); mu_t = mu[-<span class="hljs-number">1</span>]
    <span class="hljs-keyword">with</span> np.errstate(divide=<span class="hljs-string">&quot;ignore&quot;</span>, invalid=<span class="hljs-string">&quot;ignore&quot;</span>):
        sb = (mu_t * w0 - mu) ** <span class="hljs-number">2</span> / (w0 * (<span class="hljs-number">1</span> - w0))
    sb[~np.isfinite(sb)] = <span class="hljs-number">0</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">int</span>(np.argmax(sb))                                        <span class="hljs-comment"># pixels &gt; t are foreground</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">components</span>(<span class="hljs-params">mask, min_area=<span class="hljs-number">1</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;8-connected components by breadth-first flood fill: label image and (area, centroid row, centroid col) per blob&quot;&quot;&quot;</span>
    H, W = mask.shape; lab = np.zeros((H, W), <span class="hljs-built_in">int</span>); stats = []
    <span class="hljs-keyword">for</span> i0 <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(H):
        <span class="hljs-keyword">for</span> j0 <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(W):
            <span class="hljs-keyword">if</span> mask[i0, j0] <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> lab[i0, j0]:
                k = <span class="hljs-built_in">len</span>(stats) + <span class="hljs-number">1</span>; lab[i0, j0] = k; q = deque([(i0, j0)]); pix = []
                <span class="hljs-keyword">while</span> q:
                    i, j = q.popleft(); pix.append((i, j))
                    <span class="hljs-keyword">for</span> di <span class="hljs-keyword">in</span> (-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>):
                        <span class="hljs-keyword">for</span> dj <span class="hljs-keyword">in</span> (-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>):
                            a, b = i + di, j + dj
                            <span class="hljs-keyword">if</span> <span class="hljs-number">0</span> &lt;= a &lt; H <span class="hljs-keyword">and</span> <span class="hljs-number">0</span> &lt;= b &lt; W <span class="hljs-keyword">and</span> mask[a, b] <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> lab[a, b]:
                                lab[a, b] = k; q.append((a, b))
                pix = np.array(pix); stats.append((<span class="hljs-built_in">len</span>(pix), *pix.mean(<span class="hljs-number">0</span>)))
    keep = [s <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> stats <span class="hljs-keyword">if</span> s[<span class="hljs-number">0</span>] &gt;= min_area]
    <span class="hljs-keyword">return</span> lab, keep

<span class="hljs-keyword">def</span> <span class="hljs-title function_">open3</span>(<span class="hljs-params">mask</span>):
    <span class="hljs-string">&quot;&quot;&quot;morphological opening with a 3 x 3 square: erode then dilate, which removes isolated noise pixels&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">shift_all</span>(<span class="hljs-params">m, op</span>):
        p = np.pad(m, <span class="hljs-number">1</span>, constant_values=op <span class="hljs-keyword">is</span> np.logical_and)       <span class="hljs-comment"># erosion pads with True, dilation with False</span>
        out = p[<span class="hljs-number">1</span>:-<span class="hljs-number">1</span>, <span class="hljs-number">1</span>:-<span class="hljs-number">1</span>].copy()
        <span class="hljs-keyword">for</span> di <span class="hljs-keyword">in</span> (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>):
            <span class="hljs-keyword">for</span> dj <span class="hljs-keyword">in</span> (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>):
                out = op(out, p[di:di + m.shape[<span class="hljs-number">0</span>], dj:dj + m.shape[<span class="hljs-number">1</span>]])
        <span class="hljs-keyword">return</span> out
    <span class="hljs-keyword">return</span> shift_all(shift_all(mask, np.logical_and), np.logical_or)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_otsu_bimodal</span>():
    img = np.r_[np.full(<span class="hljs-number">500</span>, <span class="hljs-number">50</span>), np.full(<span class="hljs-number">500</span>, <span class="hljs-number">200</span>)].astype(np.uint8).reshape(<span class="hljs-number">10</span>, <span class="hljs-number">100</span>)
    t = otsu(img); <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;two levels 50 and 200, equal counts: Otsu threshold <span class="hljs-subst">{t}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-number">50</span> &lt;= t &lt; <span class="hljs-number">200</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_counts_match_truth</span>():
    img, truth = make_image()
    t = otsu(img); mask = img &gt; t
    _, raw = components(mask); _, blobs = components(open3(mask), min_area=<span class="hljs-number">20</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Otsu threshold <span class="hljs-subst">{t}</span>; raw mask <span class="hljs-subst">{<span class="hljs-built_in">len</span>(raw)}</span> components, after a 3 x 3 opening and a 20-pixel minimum <span class="hljs-subst">{<span class="hljs-built_in">len</span>(blobs)}</span> (truth <span class="hljs-subst">{<span class="hljs-built_in">len</span>(truth)}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(blobs) == <span class="hljs-built_in">len</span>(truth)
    err = <span class="hljs-built_in">max</span>(<span class="hljs-built_in">min</span>(np.hypot(b[<span class="hljs-number">1</span>] - c[<span class="hljs-number">0</span>], b[<span class="hljs-number">2</span>] - c[<span class="hljs-number">1</span>]) <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> blobs) <span class="hljs-keyword">for</span> c, _ <span class="hljs-keyword">in</span> truth)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;largest centroid error <span class="hljs-subst">{err:<span class="hljs-number">.2</span>f}</span> px&quot;</span>)
    <span class="hljs-keyword">assert</span> err &lt; <span class="hljs-number">1.0</span>
    <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;OpenCV not installed: skipping the comparison&quot;</span>); <span class="hljs-keyword">return</span>
    t_cv, _ = cv2.threshold(img, <span class="hljs-number">0</span>, <span class="hljs-number">255</span>, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    n_cv, lab_cv, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=<span class="hljs-number">8</span>)
    lab, _ = components(mask)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;cv2 Otsu threshold <span class="hljs-subst">{t_cv:<span class="hljs-number">.0</span>f}</span>; cv2.connectedComponentsWithStats finds <span class="hljs-subst">{n_cv - <span class="hljs-number">1</span>}</span> components in the raw mask; label images agree: <span class="hljs-subst">{<span class="hljs-built_in">bool</span>(((lab &gt; <span class="hljs-number">0</span>) == (lab_cv &gt; <span class="hljs-number">0</span>)).<span class="hljs-built_in">all</span>())}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> t == <span class="hljs-built_in">int</span>(t_cv) <span class="hljs-keyword">and</span> n_cv - <span class="hljs-number">1</span> == <span class="hljs-built_in">len</span>(raw)

test_otsu_bimodal()
test_counts_match_truth()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Two parts touch each other. What happens to the count, and how could you separate them?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>They form one component, so the count is one short and the area is about double. Separate them with erosion until they split, a distance transform plus watershed, or reject components whose area is far above the expected part area and flag them.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does a 4-connected labelling of a thin diagonal line give many components?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Pixels on a diagonal touch only at their corners, which 4-connectivity does not count, so each pixel is its own component. 8-connectivity links them.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l06"></div>
`,i=[{id:`choosing-a-threshold`,title:`Choosing a threshold`},{id:`cleaning-the-mask`,title:`Cleaning the mask`},{id:`connected-components`,title:`Connected components`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l06-q1`,type:`num`,q:`<p>Between-class variance with w0 = w1 = 0.5 and class means 50 and 200?</p>
`,explain:`<p>w0 w1 (mu0 - mu1)^2.</p>
`,answer:5625,tol:.001,unit:``},{id:`p17-l06-q2`,type:`num`,q:`<p>Centroid column of a blob covering columns 10, 11 and 14 (one pixel each)?</p>
`,explain:`<p>The mean column.</p>
`,answer:11.667,tol:.002,unit:``},{id:`p17-l06-q3`,type:`num`,q:`<p>Neighbours of a pixel in 8-connectivity?</p>
`,explain:`<p>The 4 edge and 4 corner neighbours.</p>
`,answer:8,tol:.001,unit:``},{id:`p17-l06-q4`,type:`num`,q:`<p>Area in pixels of a disc of radius 10 px (approximately)?</p>
`,explain:`<p>pi r^2.</p>
`,answer:314.16,tol:.01,unit:`px`},{id:`p17-l06-q5`,type:`mc`,q:`<p>Morphological opening is…</p>
`,explain:`<p>It removes specks smaller than the structuring element.</p>
`,options:[`the difference of two blurs`,`erosion followed by dilation`,`a Gaussian blur followed by a threshold`,`dilation followed by erosion`],answer:1},{id:`p17-l06-q6`,type:`mc`,q:`<p>Otsu’s threshold works best when the histogram…</p>
`,explain:`<p>It splits the histogram into two classes.</p>
`,options:[`is flat`,`has one peak`,`has two well-separated peaks`,`is the same across lighting conditions`],answer:2}],o=[{file:`blobs.py`,lang:`python`,src:`import numpy as np
from collections import deque
try:
    import cv2
except ImportError:
    cv2 = None

def make_image(n=9, noise=30.0, seed=3):
    """illustrative 120 x 160 image of n non-overlapping bright parts (discs) on a dark conveyor, with noise"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 60.0); truth = []
    while len(truth) < n:
        c = rng.uniform([14, 14], [106, 146]); r = rng.uniform(6, 11)
        if all(np.hypot(*(c - d)) > r + s + 4 for d, s in truth):
            truth.append((c, r)); img[(y - c[0]) ** 2 + (x - c[1]) ** 2 <= r * r] = rng.uniform(160, 210)
    img = np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)
    return img, truth

def otsu(img):
    """the threshold t that maximises the between-class variance w0 w1 (mu0 - mu1)^2 of the histogram"""
    p = np.bincount(img.ravel(), minlength=256) / img.size; levels = np.arange(256)
    w0 = np.cumsum(p); mu = np.cumsum(p * levels); mu_t = mu[-1]
    with np.errstate(divide="ignore", invalid="ignore"):
        sb = (mu_t * w0 - mu) ** 2 / (w0 * (1 - w0))
    sb[~np.isfinite(sb)] = 0
    return int(np.argmax(sb))                                        # pixels > t are foreground

def components(mask, min_area=1):
    """8-connected components by breadth-first flood fill: label image and (area, centroid row, centroid col) per blob"""
    H, W = mask.shape; lab = np.zeros((H, W), int); stats = []
    for i0 in range(H):
        for j0 in range(W):
            if mask[i0, j0] and not lab[i0, j0]:
                k = len(stats) + 1; lab[i0, j0] = k; q = deque([(i0, j0)]); pix = []
                while q:
                    i, j = q.popleft(); pix.append((i, j))
                    for di in (-1, 0, 1):
                        for dj in (-1, 0, 1):
                            a, b = i + di, j + dj
                            if 0 <= a < H and 0 <= b < W and mask[a, b] and not lab[a, b]:
                                lab[a, b] = k; q.append((a, b))
                pix = np.array(pix); stats.append((len(pix), *pix.mean(0)))
    keep = [s for s in stats if s[0] >= min_area]
    return lab, keep

def open3(mask):
    """morphological opening with a 3 x 3 square: erode then dilate, which removes isolated noise pixels"""
    def shift_all(m, op):
        p = np.pad(m, 1, constant_values=op is np.logical_and)       # erosion pads with True, dilation with False
        out = p[1:-1, 1:-1].copy()
        for di in (0, 1, 2):
            for dj in (0, 1, 2):
                out = op(out, p[di:di + m.shape[0], dj:dj + m.shape[1]])
        return out
    return shift_all(shift_all(mask, np.logical_and), np.logical_or)

def test_otsu_bimodal():
    img = np.r_[np.full(500, 50), np.full(500, 200)].astype(np.uint8).reshape(10, 100)
    t = otsu(img); print(f"two levels 50 and 200, equal counts: Otsu threshold {t}")
    assert 50 <= t < 200

def test_counts_match_truth():
    img, truth = make_image()
    t = otsu(img); mask = img > t
    _, raw = components(mask); _, blobs = components(open3(mask), min_area=20)
    print(f"Otsu threshold {t}; raw mask {len(raw)} components, after a 3 x 3 opening and a 20-pixel minimum {len(blobs)} (truth {len(truth)})")
    assert len(blobs) == len(truth)
    err = max(min(np.hypot(b[1] - c[0], b[2] - c[1]) for b in blobs) for c, _ in truth)
    print(f"largest centroid error {err:.2f} px")
    assert err < 1.0
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    t_cv, _ = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    n_cv, lab_cv, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    lab, _ = components(mask)
    print(f"cv2 Otsu threshold {t_cv:.0f}; cv2.connectedComponentsWithStats finds {n_cv - 1} components in the raw mask; label images agree: {bool(((lab > 0) == (lab_cv > 0)).all())}")
    assert t == int(t_cv) and n_cv - 1 == len(raw)

test_otsu_bimodal()
test_counts_match_truth()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};