var e=`p17-l11`,t=40,n=`A printed square marker gives a robot its full 3D pose from one image. You decode a marker ID independent of rotation, get a first pose from the marker’s homography, refine it by Gauss-Newton on the reprojection error, reach a median rotation error of 0.6° in an illustrative simulation and match OpenCV’s solvePnP, and see accuracy fall with distance.`,r=`<h2 id="fiducial-markers">Fiducial markers</h2>
<p>ArUco and AprilTag markers are black squares with a grid of bits inside. Detection finds quadrilaterals in a thresholded image (lesson 06), warps each to a square with a homography (lesson 09), and reads the bits. A dictionary of codes chosen far apart in Hamming distance makes false detections rare and allows a few bit errors to be corrected. Trying the four 90° rotations of the grid gives the ID <strong>and</strong> which corner is which, needed for the pose.</p>
<h2 id="perspective-n-point">Perspective-n-Point</h2>
<p>Given the marker’s corners in its own frame (side <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">s</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">Z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>) and their pixels, find <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord mathnormal">λ</span><span class="mord"><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6679em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">u</span></span><span style="top:-3.35em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.2222em;"><span class="mord">~</span></span></span></span></span></span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">X</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">t</span><span class="mclose">)</span></span></span></span>: the <strong>PnP</strong> problem. For a plane:</p>
<ol>
<li>Fit the homography <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span></span></span></span> from marker coordinates to pixels.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">K</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">σ</span><span class="mopen">[</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace">\xA0</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace">\xA0</span><span class="mord mathnormal">t</span><span class="mclose">]</span></span></span></span>: scale so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">∣</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, set <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">3</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, and snap the result to the nearest rotation with an SVD.</li>
<li>Refine <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span></span></span></span> by Gauss-Newton on the 8 reprojection residuals, updating the rotation as <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">←</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop">exp</span><span class="mopen">([</span><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="mclose"><span class="mclose">]</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.2583em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">×</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> so it stays a rotation.</li>
</ol>
<h2 id="accuracy-and-ambiguity">Accuracy and ambiguity</h2>
<p>Rotation accuracy depends on how much perspective the corners show, so it degrades quickly as the marker shrinks in the image. A small or distant marker viewed nearly head-on also has two poses, tilted towards or away from the camera, that fit almost equally well; IPPE returns both, and tracking over time or a bigger marker resolves it.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="markerpose" data-args="{}"></div></div><figcaption>An illustrative 10 cm marker in front of a camera, its projected outline and the pose recovered from noisy corners. Tilt and move it, add corner noise, and watch the rotation error.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative camera (<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">800</span></span></span></span> px), a 10 cm marker, corners detected with 0.3 px noise.</p>
<ol>
<li>A marker seen rotated a quarter turn decodes as ID 3 with rotation 1.</li>
<li>200 random poses at 0.4 to 1.2 m: the homography alone gives a median rotation error of 2.77°; Gauss-Newton refinement brings it to <strong>0.61°</strong> (95th percentile 2.02°), with median position error 1.3 mm.</li>
<li><code>cv2.solvePnP</code> with <code>SOLVEPNP_IPPE_SQUARE</code> followed by <code>solvePnPRefineLM</code> lands on the same pose in all 50 trials, to 0.001 mm.</li>
<li>At 0.5 m the marker is 160 px wide and the median rotation error is 0.53°; at 2 m it is 40 px wide and the error is 2.57°.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">marker_pose.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">try</span>:
    <span class="hljs-keyword">import</span> cv2
<span class="hljs-keyword">except</span> ImportError:
    cv2 = <span class="hljs-literal">None</span>

K = np.array([[<span class="hljs-number">800.0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">320</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">800.0</span>, <span class="hljs-number">240</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]])
S = <span class="hljs-number">0.10</span>                                                              <span class="hljs-comment"># illustrative marker side, 10 cm</span>
OBJ = np.array([[-S / <span class="hljs-number">2</span>, S / <span class="hljs-number">2</span>, <span class="hljs-number">0</span>], [S / <span class="hljs-number">2</span>, S / <span class="hljs-number">2</span>, <span class="hljs-number">0</span>], [S / <span class="hljs-number">2</span>, -S / <span class="hljs-number">2</span>, <span class="hljs-number">0</span>], [-S / <span class="hljs-number">2</span>, -S / <span class="hljs-number">2</span>, <span class="hljs-number">0</span>]])   <span class="hljs-comment"># OpenCV&#x27;s corner order</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rot</span>(<span class="hljs-params">r</span>):
    th = np.linalg.norm(r)
    <span class="hljs-keyword">if</span> th &lt; <span class="hljs-number">1e-12</span>: <span class="hljs-keyword">return</span> np.eye(<span class="hljs-number">3</span>)
    k = r / th; X = np.array([[<span class="hljs-number">0</span>, -k[<span class="hljs-number">2</span>], k[<span class="hljs-number">1</span>]], [k[<span class="hljs-number">2</span>], <span class="hljs-number">0</span>, -k[<span class="hljs-number">0</span>]], [-k[<span class="hljs-number">1</span>], k[<span class="hljs-number">0</span>], <span class="hljs-number">0</span>]])
    <span class="hljs-keyword">return</span> np.eye(<span class="hljs-number">3</span>) + np.sin(th) * X + (<span class="hljs-number">1</span> - np.cos(th)) * X @ X

<span class="hljs-keyword">def</span> <span class="hljs-title function_">project</span>(<span class="hljs-params">P, R, t</span>):
    q = (P @ R.T + t) @ K.T
    <span class="hljs-keyword">return</span> q[:, :<span class="hljs-number">2</span>] / q[:, <span class="hljs-number">2</span>:]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">homography</span>(<span class="hljs-params">src, dst</span>):
    A = []
    <span class="hljs-keyword">for</span> (x, y), (u, v) <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(src, dst):
        A += [[-x, -y, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, u * x, u * y, u], [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, -x, -y, -<span class="hljs-number">1</span>, v * x, v * y, v]]
    <span class="hljs-keyword">return</span> np.linalg.svd(np.array(A))[<span class="hljs-number">2</span>][-<span class="hljs-number">1</span>].reshape(<span class="hljs-number">3</span>, <span class="hljs-number">3</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">pose_from_homography</span>(<span class="hljs-params">uv</span>):
    <span class="hljs-string">&quot;&quot;&quot;planar PnP, first guess: K^-1 H = s [r1 r2 t]; make the rotation orthonormal with an SVD&quot;&quot;&quot;</span>
    M = np.linalg.inv(K) @ homography(OBJ[:, :<span class="hljs-number">2</span>], uv)
    M /= np.linalg.norm(M[:, <span class="hljs-number">0</span>]) * np.sign(M[<span class="hljs-number">2</span>, <span class="hljs-number">2</span>])                    <span class="hljs-comment"># scale so |r1| = 1 and the marker is in front</span>
    R0 = np.c_[M[:, <span class="hljs-number">0</span>], M[:, <span class="hljs-number">1</span>], np.cross(M[:, <span class="hljs-number">0</span>], M[:, <span class="hljs-number">1</span>])]
    U, _, Vt = np.linalg.svd(R0); R = U @ np.diag([<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, np.linalg.det(U @ Vt)]) @ Vt
    <span class="hljs-keyword">return</span> R, M[:, <span class="hljs-number">2</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">refine</span>(<span class="hljs-params">uv, R, t, iters=<span class="hljs-number">10</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;Gauss-Newton on the 8 reprojection residuals over a rotation increment w and the translation&quot;&quot;&quot;</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(iters):
        r = (project(OBJ, R, t) - uv).ravel(); J = np.zeros((<span class="hljs-number">8</span>, <span class="hljs-number">6</span>)); e = <span class="hljs-number">1e-7</span>
        <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">6</span>):
            d = np.zeros(<span class="hljs-number">6</span>); d[i] = e
            J[:, i] = ((project(OBJ, rot(d[:<span class="hljs-number">3</span>]) @ R, t + d[<span class="hljs-number">3</span>:]) - uv).ravel() - r) / e
        dx = -np.linalg.lstsq(J, r, rcond=<span class="hljs-literal">None</span>)[<span class="hljs-number">0</span>]
        R, t = rot(dx[:<span class="hljs-number">3</span>]) @ R, t + dx[<span class="hljs-number">3</span>:]
    <span class="hljs-keyword">return</span> R, t

<span class="hljs-keyword">def</span> <span class="hljs-title function_">angle_between</span>(<span class="hljs-params">R1, R2</span>): <span class="hljs-keyword">return</span> np.degrees(np.arccos(np.clip((np.trace(R1.T @ R2) - <span class="hljs-number">1</span>) / <span class="hljs-number">2</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">1</span>)))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">decode</span>(<span class="hljs-params">bits, dictionary</span>):
    <span class="hljs-string">&quot;&quot;&quot;a marker&#x27;s ID from its inner bit grid, trying all four rotations (which also gives the corner order)&quot;&quot;&quot;</span>
    <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
        b = np.rot90(bits, k)
        <span class="hljs-keyword">for</span> mid, code <span class="hljs-keyword">in</span> dictionary.items():
            <span class="hljs-keyword">if</span> (b == code).<span class="hljs-built_in">all</span>(): <span class="hljs-keyword">return</span> mid, k
    <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">trial</span>(<span class="hljs-params">rng, noise=<span class="hljs-number">0.3</span></span>):
    R = rot(rng.uniform(-<span class="hljs-number">0.6</span>, <span class="hljs-number">0.6</span>, <span class="hljs-number">3</span>)); t = np.array([*rng.uniform(-<span class="hljs-number">0.15</span>, <span class="hljs-number">0.15</span>, <span class="hljs-number">2</span>), rng.uniform(<span class="hljs-number">0.4</span>, <span class="hljs-number">1.2</span>)])
    uv = project(OBJ, R, t) + rng.normal(<span class="hljs-number">0</span>, noise, (<span class="hljs-number">4</span>, <span class="hljs-number">2</span>))
    Rh, th = pose_from_homography(uv); Rr, tr = refine(uv, Rh, th)
    <span class="hljs-keyword">return</span> R, t, uv, Rh, th, Rr, tr

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_decode</span>():
    rng = np.random.default_rng(<span class="hljs-number">0</span>); dic = {i: rng.integers(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>, (<span class="hljs-number">4</span>, <span class="hljs-number">4</span>)) <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">5</span>)}
    mid, k = decode(np.rot90(dic[<span class="hljs-number">3</span>], -<span class="hljs-number">1</span>), dic)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;a marker seen rotated a quarter turn decodes as ID <span class="hljs-subst">{mid}</span> with rotation <span class="hljs-subst">{k}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> mid == <span class="hljs-number">3</span> <span class="hljs-keyword">and</span> k == <span class="hljs-number">1</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_pose_accuracy</span>():
    rng = np.random.default_rng(<span class="hljs-number">1</span>); ang, pos, ang_h, flips = [], [], [], <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">200</span>):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        ang_h.append(angle_between(R, Rh)); ang.append(angle_between(R, Rr)); pos.append(np.linalg.norm(tr - t))
    ang = np.array(ang)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;200 random poses at 0.4 to 1.2 m, 0.3 px corner noise: median rotation error <span class="hljs-subst">{np.median(ang_h):<span class="hljs-number">.2</span>f}</span> deg from the homography, &quot;</span>
          <span class="hljs-string">f&quot;<span class="hljs-subst">{np.median(ang):<span class="hljs-number">.2</span>f}</span> deg refined; 95th percentile <span class="hljs-subst">{np.percentile(ang, <span class="hljs-number">95</span>):<span class="hljs-number">.2</span>f}</span> deg; median position error <span class="hljs-subst">{<span class="hljs-number">1000</span> * np.median(pos):<span class="hljs-number">.1</span>f}</span> mm&quot;</span>)
    <span class="hljs-keyword">assert</span> np.median(ang) &lt; <span class="hljs-number">1.0</span> <span class="hljs-keyword">and</span> np.median(pos) &lt; <span class="hljs-number">0.01</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_matches_opencv</span>():
    rng = np.random.default_rng(<span class="hljs-number">2</span>); diffs = []
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">50</span>):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-keyword">break</span>
        ok, rv, tv = cv2.solvePnP(OBJ, uv, K, <span class="hljs-literal">None</span>, flags=cv2.SOLVEPNP_IPPE_SQUARE)
        rv, tv = cv2.solvePnPRefineLM(OBJ, uv, K, <span class="hljs-literal">None</span>, rv, tv)       <span class="hljs-comment"># IPPE is closed form; refine as we do</span>
        <span class="hljs-keyword">if</span> angle_between(cv2.Rodrigues(rv)[<span class="hljs-number">0</span>], Rr) &lt; <span class="hljs-number">5</span>: diffs.append(np.linalg.norm(tv.ravel() - tr))
    <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;OpenCV not installed: skipping the comparison&quot;</span>); <span class="hljs-keyword">return</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;cv2.solvePnP (IPPE_SQUARE) plus solvePnPRefineLM lands on the same pose in <span class="hljs-subst">{<span class="hljs-built_in">len</span>(diffs)}</span> of 50 trials; positions differ by at most <span class="hljs-subst">{<span class="hljs-number">1000</span> * <span class="hljs-built_in">max</span>(diffs):<span class="hljs-number">.3</span>f}</span> mm&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(diffs) &gt;= <span class="hljs-number">48</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">max</span>(diffs) &lt; <span class="hljs-number">1e-4</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_distance_hurts</span>():
    rng = np.random.default_rng(<span class="hljs-number">3</span>)
    <span class="hljs-keyword">for</span> z <span class="hljs-keyword">in</span> (<span class="hljs-number">0.5</span>, <span class="hljs-number">2.0</span>):
        errs = []
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">200</span>):
            R = rot(rng.uniform(-<span class="hljs-number">0.4</span>, <span class="hljs-number">0.4</span>, <span class="hljs-number">3</span>)); t = np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, z])
            uv = project(OBJ, R, t) + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.3</span>, (<span class="hljs-number">4</span>, <span class="hljs-number">2</span>))
            errs.append(angle_between(R, refine(uv, *pose_from_homography(uv))[<span class="hljs-number">0</span>]))
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;at <span class="hljs-subst">{z}</span> m the marker is <span class="hljs-subst">{<span class="hljs-number">800</span> * S / z:<span class="hljs-number">.0</span>f}</span> px wide: median rotation error <span class="hljs-subst">{np.median(errs):<span class="hljs-number">.2</span>f}</span> deg&quot;</span>)
    <span class="hljs-keyword">assert</span> np.median(errs) &gt; <span class="hljs-number">1.0</span>

test_decode()
test_pose_accuracy()
test_matches_opencv()
test_distance_hurts()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>You need rotation error below 1° at 2 m. What could you change?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Make the marker appear bigger: a larger marker (around 25 cm here) or a longer focal length. Alternatively use several markers on a rigid board, whose corners spread over a large area, or average over frames when the robot is still.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why is position along the viewing axis usually less accurate than across it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Depth comes from the marker’s apparent size, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mord mathnormal">s</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span></span></span></span>, so an error <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span></span></span></span> in the width gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span></span></span></span>, which grows with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.044em;">z</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span>. Sideways position comes directly from where the marker is in the image, far better conditioned.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l11"></div>
`,i=[{id:`fiducial-markers`,title:`Fiducial markers`},{id:`perspective-n-point`,title:`Perspective-n-Point`},{id:`accuracy-and-ambiguity`,title:`Accuracy and ambiguity`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l11-q1`,type:`num`,q:`<p>Width in pixels of a 0.1 m marker at 2 m with f = 800 px?</p>
`,explain:`<p>f s / z.</p>
`,answer:40,tol:.001,unit:`px`},{id:`p17-l11-q2`,type:`num`,q:`<p>Reprojection residuals for one square marker?</p>
`,explain:`<p>4 corners, 2 coordinates each.</p>
`,answer:8,tol:.001,unit:``},{id:`p17-l11-q3`,type:`num`,q:`<p>Unknowns in a 6-DOF pose?</p>
`,explain:`<p>Three for rotation, three for translation.</p>
`,answer:6,tol:.001,unit:``},{id:`p17-l11-q4`,type:`num`,q:`<p>Distance to a 0.15 m marker that appears 60 px wide with f = 800 px?</p>
`,explain:`<p>z = f s / w.</p>
`,answer:2,tol:.001,unit:`m`},{id:`p17-l11-q5`,type:`mc`,q:`<p>Trying the four rotations of a marker’s bit grid tells you…</p>
`,explain:`<p>The pose needs corners in a known order.</p>
`,options:[`the camera’s focal length`,`the lighting direction`,`its ID and which corner is which`,`its distance`],answer:2},{id:`p17-l11-q6`,type:`mc`,q:`<p>A distant marker seen nearly head-on may give…</p>
`,explain:`<p>Tilting towards or away from the camera looks nearly the same.</p>
`,options:[`no solution at all`,`an exact pose regardless of noise`,`two poses that fit almost equally well`,`a wrong ID`],answer:2}],o=[{file:`marker_pose.py`,lang:`python`,src:`import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
S = 0.10                                                              # illustrative marker side, 10 cm
OBJ = np.array([[-S / 2, S / 2, 0], [S / 2, S / 2, 0], [S / 2, -S / 2, 0], [-S / 2, -S / 2, 0]])   # OpenCV's corner order

def rot(r):
    th = np.linalg.norm(r)
    if th < 1e-12: return np.eye(3)
    k = r / th; X = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(th) * X + (1 - np.cos(th)) * X @ X

def project(P, R, t):
    q = (P @ R.T + t) @ K.T
    return q[:, :2] / q[:, 2:]

def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A += [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]]
    return np.linalg.svd(np.array(A))[2][-1].reshape(3, 3)

def pose_from_homography(uv):
    """planar PnP, first guess: K^-1 H = s [r1 r2 t]; make the rotation orthonormal with an SVD"""
    M = np.linalg.inv(K) @ homography(OBJ[:, :2], uv)
    M /= np.linalg.norm(M[:, 0]) * np.sign(M[2, 2])                    # scale so |r1| = 1 and the marker is in front
    R0 = np.c_[M[:, 0], M[:, 1], np.cross(M[:, 0], M[:, 1])]
    U, _, Vt = np.linalg.svd(R0); R = U @ np.diag([1, 1, np.linalg.det(U @ Vt)]) @ Vt
    return R, M[:, 2]

def refine(uv, R, t, iters=10):
    """Gauss-Newton on the 8 reprojection residuals over a rotation increment w and the translation"""
    for _ in range(iters):
        r = (project(OBJ, R, t) - uv).ravel(); J = np.zeros((8, 6)); e = 1e-7
        for i in range(6):
            d = np.zeros(6); d[i] = e
            J[:, i] = ((project(OBJ, rot(d[:3]) @ R, t + d[3:]) - uv).ravel() - r) / e
        dx = -np.linalg.lstsq(J, r, rcond=None)[0]
        R, t = rot(dx[:3]) @ R, t + dx[3:]
    return R, t

def angle_between(R1, R2): return np.degrees(np.arccos(np.clip((np.trace(R1.T @ R2) - 1) / 2, -1, 1)))

def decode(bits, dictionary):
    """a marker's ID from its inner bit grid, trying all four rotations (which also gives the corner order)"""
    for k in range(4):
        b = np.rot90(bits, k)
        for mid, code in dictionary.items():
            if (b == code).all(): return mid, k
    return None, None

def trial(rng, noise=0.3):
    R = rot(rng.uniform(-0.6, 0.6, 3)); t = np.array([*rng.uniform(-0.15, 0.15, 2), rng.uniform(0.4, 1.2)])
    uv = project(OBJ, R, t) + rng.normal(0, noise, (4, 2))
    Rh, th = pose_from_homography(uv); Rr, tr = refine(uv, Rh, th)
    return R, t, uv, Rh, th, Rr, tr

def test_decode():
    rng = np.random.default_rng(0); dic = {i: rng.integers(0, 2, (4, 4)) for i in range(5)}
    mid, k = decode(np.rot90(dic[3], -1), dic)
    print(f"a marker seen rotated a quarter turn decodes as ID {mid} with rotation {k}")
    assert mid == 3 and k == 1

def test_pose_accuracy():
    rng = np.random.default_rng(1); ang, pos, ang_h, flips = [], [], [], 0
    for _ in range(200):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        ang_h.append(angle_between(R, Rh)); ang.append(angle_between(R, Rr)); pos.append(np.linalg.norm(tr - t))
    ang = np.array(ang)
    print(f"200 random poses at 0.4 to 1.2 m, 0.3 px corner noise: median rotation error {np.median(ang_h):.2f} deg from the homography, "
          f"{np.median(ang):.2f} deg refined; 95th percentile {np.percentile(ang, 95):.2f} deg; median position error {1000 * np.median(pos):.1f} mm")
    assert np.median(ang) < 1.0 and np.median(pos) < 0.01

def test_matches_opencv():
    rng = np.random.default_rng(2); diffs = []
    for _ in range(50):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        if cv2 is None: break
        ok, rv, tv = cv2.solvePnP(OBJ, uv, K, None, flags=cv2.SOLVEPNP_IPPE_SQUARE)
        rv, tv = cv2.solvePnPRefineLM(OBJ, uv, K, None, rv, tv)       # IPPE is closed form; refine as we do
        if angle_between(cv2.Rodrigues(rv)[0], Rr) < 5: diffs.append(np.linalg.norm(tv.ravel() - tr))
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    print(f"cv2.solvePnP (IPPE_SQUARE) plus solvePnPRefineLM lands on the same pose in {len(diffs)} of 50 trials; positions differ by at most {1000 * max(diffs):.3f} mm")
    assert len(diffs) >= 48 and max(diffs) < 1e-4

def test_distance_hurts():
    rng = np.random.default_rng(3)
    for z in (0.5, 2.0):
        errs = []
        for _ in range(200):
            R = rot(rng.uniform(-0.4, 0.4, 3)); t = np.array([0, 0, z])
            uv = project(OBJ, R, t) + rng.normal(0, 0.3, (4, 2))
            errs.append(angle_between(R, refine(uv, *pose_from_homography(uv))[0]))
        print(f"at {z} m the marker is {800 * S / z:.0f} px wide: median rotation error {np.median(errs):.2f} deg")
    assert np.median(errs) > 1.0

test_decode()
test_pose_accuracy()
test_matches_opencv()
test_distance_hurts()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};