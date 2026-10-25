var e=`p16-l11`,t=35,n=`Every planner in this phase spends most of its time asking one question, does the robot hit anything here. You derive the separating axis theorem, which answers it exactly for convex shapes with a handful of projections, and the bounding volumes that rule out most pairs before any exact test. You implement both for 2D polygons and test SAT against a brute-force edge-crossing test on 5000 random pairs, and that the broad phase never misses a collision.`,r=`<h2 id="separating-axes">Separating axes</h2>
<p>Two convex shapes are disjoint exactly when there is a line between them. Equivalently, there is an <strong>axis</strong> onto which their projections (intervals) don’t overlap. The <strong>separating axis theorem</strong> says that for two convex polygons, it is enough to test the axes normal to their edges:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">∩</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8056em;vertical-align:-0.0556em;"></span><span class="mord">∅</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">⟺</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7335em;vertical-align:-0.0391em;"></span><span class="mord">∃</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">{</span><span class="mord text"><span class="mord">edge\xA0normals\xA0of\xA0</span></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mord text"><span class="mord">\xA0and\xA0</span></span><span class="mord mathnormal">Q</span><span class="mclose">}</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">:</span><span class="mspace">\xA0</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.3249em;vertical-align:-0.8804em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.4306em;"><span style="top:-2.3557em;margin-left:0em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">p</span><span class="mrel mtight">∈</span><span class="mord mathnormal mtight" style="margin-right:0.1389em;">P</span></span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span><span class="mop">max</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7335em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.5483em;vertical-align:-0.8804em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6679em;"><span style="top:-2.3557em;margin-left:0em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">q</span><span class="mrel mtight">∈</span><span class="mord mathnormal mtight">Q</span></span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span><span class="mop">min</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">\xA0or\xA0the\xA0reverse</span></span><span class="mord">.</span></span></span></span></span></div>
<p>Why only those? <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span></span></span></span> overlap exactly when the origin lies in the Minkowski difference <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⊕</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">−</span><span class="mord mathnormal">Q</span><span class="mclose">)</span></span></span></span> of lesson 01. That is a convex polygon whose edges are all parallel to edges of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span></span></span></span> or <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">Q</span></span></span></span>. If the origin is outside it, one of its edges has the origin on its outer side, and that edge’s normal is a separating axis. So a polygon with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">m</span></span></span></span> edges and one with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> need at most <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">m</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> tests, fewer when edges are parallel (two rectangles: 4). The test can stop at the first separating axis, which is why it is fast when the shapes are far apart.</p>
<p>Projecting onto an unnormalised normal works, because only the order of the intervals matters. In 3D, the candidate axes are the face normals of both shapes and the cross products of their edge pairs.</p>
<p>SAT needs convex shapes. A concave robot is split into convex pieces and each pair tested.</p>
<h2 id="the-broad-phase">The broad phase</h2>
<p>Most pairs in a scene are far apart. A <strong>bounding volume</strong> around each shape is a cheap test that can only give false alarms, never misses:</p>
<ul>
<li><strong>AABB</strong> (axis-aligned bounding box): two boxes overlap iff their <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span></span></span></span> intervals and their <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span></span></span></span> intervals both overlap. Four comparisons.</li>
<li><strong>Bounding circle</strong>: overlap iff the centre distance is at most the sum of the radii.</li>
</ul>
<p>Only pairs that pass the broad phase go to the exact test (the <strong>narrow phase</strong>). Libraries organise the bounding volumes in a tree, so a query visits only the branches it overlaps.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="sat" data-args="{}"></div></div><figcaption>A square and a rotating triangle, shown with their projections on one candidate axis. Move and turn the triangle: the shapes turn red when no axis separates them. Step through the axes to see which one separates them.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<ol>
<li>A unit square and a diamond (the square rotated 45°) centred at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1.3</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.3</span><span class="mclose">)</span></span></span></span>: the diamond’s lower-left edge <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.89</span></span></span></span> cuts the square’s corner, where <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span>. SAT reports an overlap.</li>
<li>Centred at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1.6</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">1.6</span><span class="mclose">)</span></span></span></span>, the edge is at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.49</span></span></span></span>: separated, although the bounding boxes still overlap. That is a broad-phase false alarm, resolved by the narrow phase.</li>
<li>A square and a triangle (4 + 3 edges) that overlap need all 7 axes tested. When they are clear, here the 6th axis separates them.</li>
<li>On 5000 random pairs of convex polygons with 3 to 7 sides, SAT agrees with a brute-force test (edges crossing, or one polygon containing a vertex of the other) every time; 925 pairs overlap.</li>
<li>On 5000 pairs scattered over a larger area, AABBs rule out 91 % without running SAT, and miss no collision.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">sat.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

cross = <span class="hljs-keyword">lambda</span> u, v: u[<span class="hljs-number">0</span>] * v[<span class="hljs-number">1</span>] - u[<span class="hljs-number">1</span>] * v[<span class="hljs-number">0</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sat_overlap</span>(<span class="hljs-params">P, Q</span>):
    <span class="hljs-string">&quot;&quot;&quot;separating axis theorem for convex polygons: they are disjoint iff the projections onto some edge normal don&#x27;t overlap.
    Returns (overlap?, number of axes tested).&quot;&quot;&quot;</span>
    tested = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> poly <span class="hljs-keyword">in</span> (P, Q):
        <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(poly)):
            e = poly[(i + <span class="hljs-number">1</span>) % <span class="hljs-built_in">len</span>(poly)] - poly[i]; n = np.array([-e[<span class="hljs-number">1</span>], e[<span class="hljs-number">0</span>]])   <span class="hljs-comment"># an edge normal (needn&#x27;t be unit length)</span>
            tested += <span class="hljs-number">1</span>
            a, b = P @ n, Q @ n
            <span class="hljs-keyword">if</span> a.<span class="hljs-built_in">max</span>() &lt; b.<span class="hljs-built_in">min</span>() <span class="hljs-keyword">or</span> b.<span class="hljs-built_in">max</span>() &lt; a.<span class="hljs-built_in">min</span>(): <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>, tested      <span class="hljs-comment"># found a separating axis: stop early</span>
    <span class="hljs-keyword">return</span> <span class="hljs-literal">True</span>, tested

<span class="hljs-keyword">def</span> <span class="hljs-title function_">aabb_overlap</span>(<span class="hljs-params">P, Q</span>):
    <span class="hljs-string">&quot;&quot;&quot;broad phase: axis-aligned bounding boxes, two comparisons per axis&quot;&quot;&quot;</span>
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">not</span> (P[:, <span class="hljs-number">0</span>].<span class="hljs-built_in">max</span>() &lt; Q[:, <span class="hljs-number">0</span>].<span class="hljs-built_in">min</span>() <span class="hljs-keyword">or</span> Q[:, <span class="hljs-number">0</span>].<span class="hljs-built_in">max</span>() &lt; P[:, <span class="hljs-number">0</span>].<span class="hljs-built_in">min</span>() <span class="hljs-keyword">or</span> P[:, <span class="hljs-number">1</span>].<span class="hljs-built_in">max</span>() &lt; Q[:, <span class="hljs-number">1</span>].<span class="hljs-built_in">min</span>() <span class="hljs-keyword">or</span> Q[:, <span class="hljs-number">1</span>].<span class="hljs-built_in">max</span>() &lt; P[:, <span class="hljs-number">1</span>].<span class="hljs-built_in">min</span>())

<span class="hljs-keyword">def</span> <span class="hljs-title function_">circle_overlap</span>(<span class="hljs-params">P, Q</span>):
    <span class="hljs-string">&quot;&quot;&quot;broad phase: bounding circles about the vertex centroids&quot;&quot;&quot;</span>
    cp, cq = P.mean(<span class="hljs-number">0</span>), Q.mean(<span class="hljs-number">0</span>)
    <span class="hljs-keyword">return</span> np.linalg.norm(cp - cq) &lt;= np.linalg.norm(P - cp, axis=<span class="hljs-number">1</span>).<span class="hljs-built_in">max</span>() + np.linalg.norm(Q - cq, axis=<span class="hljs-number">1</span>).<span class="hljs-built_in">max</span>()

<span class="hljs-keyword">def</span> <span class="hljs-title function_">brute_overlap</span>(<span class="hljs-params">P, Q</span>):
    <span class="hljs-string">&quot;&quot;&quot;independent check: an edge of one crosses an edge of the other, or one contains a vertex of the other&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">inside</span>(<span class="hljs-params">poly, p</span>): <span class="hljs-keyword">return</span> <span class="hljs-built_in">all</span>(cross(poly[(i + <span class="hljs-number">1</span>) % <span class="hljs-built_in">len</span>(poly)] - poly[i], p - poly[i]) &gt;= <span class="hljs-number">0</span> <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(poly)))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">cross_seg</span>(<span class="hljs-params">a, b, c, d</span>):
        d1, d2, d3, d4 = cross(b - a, c - a), cross(b - a, d - a), cross(d - c, a - c), cross(d - c, b - c)
        <span class="hljs-keyword">return</span> d1 * d2 &lt; <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> d3 * d4 &lt; <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(P)):
        <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(Q)):
            <span class="hljs-keyword">if</span> cross_seg(P[i], P[(i + <span class="hljs-number">1</span>) % <span class="hljs-built_in">len</span>(P)], Q[j], Q[(j + <span class="hljs-number">1</span>) % <span class="hljs-built_in">len</span>(Q)]): <span class="hljs-keyword">return</span> <span class="hljs-literal">True</span>
    <span class="hljs-keyword">return</span> inside(P, Q[<span class="hljs-number">0</span>]) <span class="hljs-keyword">or</span> inside(Q, P[<span class="hljs-number">0</span>])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">random_convex</span>(<span class="hljs-params">rng, n, centre, size</span>):
    <span class="hljs-string">&quot;&quot;&quot;a random convex polygon: points on a circle at sorted random angles (counter-clockwise)&quot;&quot;&quot;</span>
    a = np.sort(rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">2</span> * np.pi, n)); r = size * rng.uniform(<span class="hljs-number">0.6</span>, <span class="hljs-number">1.0</span>)
    <span class="hljs-keyword">return</span> centre + r * np.stack([np.cos(a), np.sin(a)], <span class="hljs-number">1</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_matches_brute_force</span>():
    rng = np.random.default_rng(<span class="hljs-number">5</span>); agree = hits = <span class="hljs-number">0</span>; N = <span class="hljs-number">5000</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N):
        P = random_convex(rng, rng.integers(<span class="hljs-number">3</span>, <span class="hljs-number">8</span>), rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">4</span>, <span class="hljs-number">2</span>), <span class="hljs-number">1.0</span>)
        Q = random_convex(rng, rng.integers(<span class="hljs-number">3</span>, <span class="hljs-number">8</span>), rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">4</span>, <span class="hljs-number">2</span>), <span class="hljs-number">1.0</span>)
        s = sat_overlap(P, Q)[<span class="hljs-number">0</span>]; agree += s == brute_overlap(P, Q); hits += s
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{N}</span> random pairs of convex polygons: SAT agrees with the brute-force test on <span class="hljs-subst">{agree}</span>, <span class="hljs-subst">{hits}</span> overlap&quot;</span>)
    <span class="hljs-keyword">assert</span> agree == N

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_known_cases</span>():
    sq = np.array([[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">1</span>]], <span class="hljs-built_in">float</span>)
    rot = <span class="hljs-keyword">lambda</span> P, a, c: (P - P.mean(<span class="hljs-number">0</span>)) @ np.array([[np.cos(a), np.sin(a)], [-np.sin(a), np.cos(a)]]) + c
    diamond = rot(sq, np.pi / <span class="hljs-number">4</span>, np.array([<span class="hljs-number">1.3</span>, <span class="hljs-number">1.3</span>]))       <span class="hljs-comment"># its lower-left edge x + y = 1.89 cuts the square&#x27;s corner (x + y = 2)</span>
    gap = rot(sq, np.pi / <span class="hljs-number">4</span>, np.array([<span class="hljs-number">1.6</span>, <span class="hljs-number">1.6</span>]))           <span class="hljs-comment"># edge x + y = 2.49: clear of the corner</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;diamond centred at (1.3, 1.3): overlap <span class="hljs-subst">{sat_overlap(sq, diamond)[<span class="hljs-number">0</span>]}</span>; at (1.6, 1.6): overlap <span class="hljs-subst">{sat_overlap(sq, gap)[<span class="hljs-number">0</span>]}</span>, &quot;</span>
          <span class="hljs-string">f&quot;although their bounding boxes overlap: <span class="hljs-subst">{aabb_overlap(sq, gap)}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> sat_overlap(sq, diamond)[<span class="hljs-number">0</span>] <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> sat_overlap(sq, gap)[<span class="hljs-number">0</span>] <span class="hljs-keyword">and</span> aabb_overlap(sq, gap)
    tri = np.array([[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">2</span>]], <span class="hljs-built_in">float</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;square clear of a triangle: separating axis found on test <span class="hljs-subst">{sat_overlap(sq + [<span class="hljs-number">2</span>, <span class="hljs-number">2</span>], tri)[<span class="hljs-number">1</span>]}</span> of 7; overlapping: all <span class="hljs-subst">{sat_overlap(sq, tri)[<span class="hljs-number">1</span>]}</span> axes tested&quot;</span>)
    <span class="hljs-keyword">assert</span> sat_overlap(sq, tri) == (<span class="hljs-literal">True</span>, <span class="hljs-number">7</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_broad_phase_is_conservative</span>():
    <span class="hljs-string">&quot;&quot;&quot;a broad phase may report false alarms but must never miss a collision&quot;&quot;&quot;</span>
    rng = np.random.default_rng(<span class="hljs-number">9</span>); missed = culled = <span class="hljs-number">0</span>; N = <span class="hljs-number">5000</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N):
        P = random_convex(rng, <span class="hljs-number">5</span>, rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">8</span>, <span class="hljs-number">2</span>), <span class="hljs-number">1.0</span>); Q = random_convex(rng, <span class="hljs-number">5</span>, rng.uniform(<span class="hljs-number">0</span>, <span class="hljs-number">8</span>, <span class="hljs-number">2</span>), <span class="hljs-number">1.0</span>)
        exact = sat_overlap(P, Q)[<span class="hljs-number">0</span>]
        missed += exact <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> (aabb_overlap(P, Q) <span class="hljs-keyword">and</span> circle_overlap(P, Q))
        culled += <span class="hljs-keyword">not</span> aabb_overlap(P, Q)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;broad phase: AABBs rule out <span class="hljs-subst">{culled / N * <span class="hljs-number">100</span>:<span class="hljs-number">.0</span>f}</span> % of <span class="hljs-subst">{N}</span> pairs without SAT, and miss <span class="hljs-subst">{missed}</span> collisions&quot;</span>)
    <span class="hljs-keyword">assert</span> missed == <span class="hljs-number">0</span>

test_matches_brute_force()
test_known_cases()
test_broad_phase_is_conservative()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>FCL, the Flexible Collision Library used by MoveIt and OMPL, organises each robot link and obstacle mesh in a tree of bounding volumes, then runs exact tests on triangle pairs. It also returns distances, which planners such as lesson 12’s optimiser use as a clearance cost.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why is the brute-force edge test in the code not enough by itself, without the containment check?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A small polygon entirely inside a large one has no edge crossings at all, yet they overlap. The check that one polygon contains a vertex of the other covers that case.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>How many axes must SAT test for two boxes in 3D?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>3 face normals of each box plus the <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3</span></span></span></span> cross products of their edge directions: 15. That is the classic oriented bounding box test.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p16-l11"></div>
`,i=[{id:`separating-axes`,title:`Separating axes`},{id:`the-broad-phase`,title:`The broad phase`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p16-l11-q1`,type:`num`,q:`<p>Most axes SAT tests for a convex pentagon against a convex hexagon?</p>
`,explain:`<p>One per edge normal.</p>
`,answer:11,tol:.001,unit:``},{id:`p16-l11-q2`,type:`num`,q:`<p>Distinct axes for two rectangles in 2D, at any angles?</p>
`,explain:`<p>Each rectangle has only two edge directions.</p>
`,answer:4,tol:.001,unit:``},{id:`p16-l11-q3`,type:`num`,q:`<p>Projection interval length of a unit square onto the unit axis at 45°?</p>
`,explain:`<p>The diagonal.</p>
`,answer:1.4142,tol:.002,unit:``},{id:`p16-l11-q4`,type:`num`,q:`<p>Axes for two oriented boxes in 3D?</p>
`,explain:`<p>Face normals plus edge-pair cross products.</p>
`,answer:15,tol:.001,unit:``},{id:`p16-l11-q5`,type:`mc`,q:`<p>SAT applies directly to…</p>
`,explain:`<p>Concave shapes are split into convex pieces first.</p>
`,options:[`only rectangles`,`only circles`,`pairs of convex shapes`,`any polygons`],answer:2},{id:`p16-l11-q6`,type:`mc`,q:`<p>A broad phase must never…</p>
`,explain:`<p>False alarms cost time; misses cost crashes.</p>
`,options:[`be faster than the narrow phase`,`report a collision that the exact test rejects`,`report two shapes as clear when they collide`,`use bounding boxes`],answer:2}],o=[{file:`sat.py`,lang:`python`,src:`import numpy as np

cross = lambda u, v: u[0] * v[1] - u[1] * v[0]

def sat_overlap(P, Q):
    """separating axis theorem for convex polygons: they are disjoint iff the projections onto some edge normal don't overlap.
    Returns (overlap?, number of axes tested)."""
    tested = 0
    for poly in (P, Q):
        for i in range(len(poly)):
            e = poly[(i + 1) % len(poly)] - poly[i]; n = np.array([-e[1], e[0]])   # an edge normal (needn't be unit length)
            tested += 1
            a, b = P @ n, Q @ n
            if a.max() < b.min() or b.max() < a.min(): return False, tested      # found a separating axis: stop early
    return True, tested

def aabb_overlap(P, Q):
    """broad phase: axis-aligned bounding boxes, two comparisons per axis"""
    return not (P[:, 0].max() < Q[:, 0].min() or Q[:, 0].max() < P[:, 0].min() or P[:, 1].max() < Q[:, 1].min() or Q[:, 1].max() < P[:, 1].min())

def circle_overlap(P, Q):
    """broad phase: bounding circles about the vertex centroids"""
    cp, cq = P.mean(0), Q.mean(0)
    return np.linalg.norm(cp - cq) <= np.linalg.norm(P - cp, axis=1).max() + np.linalg.norm(Q - cq, axis=1).max()

def brute_overlap(P, Q):
    """independent check: an edge of one crosses an edge of the other, or one contains a vertex of the other"""
    def inside(poly, p): return all(cross(poly[(i + 1) % len(poly)] - poly[i], p - poly[i]) >= 0 for i in range(len(poly)))
    def cross_seg(a, b, c, d):
        d1, d2, d3, d4 = cross(b - a, c - a), cross(b - a, d - a), cross(d - c, a - c), cross(d - c, b - c)
        return d1 * d2 < 0 and d3 * d4 < 0
    for i in range(len(P)):
        for j in range(len(Q)):
            if cross_seg(P[i], P[(i + 1) % len(P)], Q[j], Q[(j + 1) % len(Q)]): return True
    return inside(P, Q[0]) or inside(Q, P[0])

def random_convex(rng, n, centre, size):
    """a random convex polygon: points on a circle at sorted random angles (counter-clockwise)"""
    a = np.sort(rng.uniform(0, 2 * np.pi, n)); r = size * rng.uniform(0.6, 1.0)
    return centre + r * np.stack([np.cos(a), np.sin(a)], 1)

def test_matches_brute_force():
    rng = np.random.default_rng(5); agree = hits = 0; N = 5000
    for _ in range(N):
        P = random_convex(rng, rng.integers(3, 8), rng.uniform(0, 4, 2), 1.0)
        Q = random_convex(rng, rng.integers(3, 8), rng.uniform(0, 4, 2), 1.0)
        s = sat_overlap(P, Q)[0]; agree += s == brute_overlap(P, Q); hits += s
    print(f"{N} random pairs of convex polygons: SAT agrees with the brute-force test on {agree}, {hits} overlap")
    assert agree == N

def test_known_cases():
    sq = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], float)
    rot = lambda P, a, c: (P - P.mean(0)) @ np.array([[np.cos(a), np.sin(a)], [-np.sin(a), np.cos(a)]]) + c
    diamond = rot(sq, np.pi / 4, np.array([1.3, 1.3]))       # its lower-left edge x + y = 1.89 cuts the square's corner (x + y = 2)
    gap = rot(sq, np.pi / 4, np.array([1.6, 1.6]))           # edge x + y = 2.49: clear of the corner
    print(f"diamond centred at (1.3, 1.3): overlap {sat_overlap(sq, diamond)[0]}; at (1.6, 1.6): overlap {sat_overlap(sq, gap)[0]}, "
          f"although their bounding boxes overlap: {aabb_overlap(sq, gap)}")
    assert sat_overlap(sq, diamond)[0] and not sat_overlap(sq, gap)[0] and aabb_overlap(sq, gap)
    tri = np.array([[0, 0], [2, 0], [0, 2]], float)
    print(f"square clear of a triangle: separating axis found on test {sat_overlap(sq + [2, 2], tri)[1]} of 7; overlapping: all {sat_overlap(sq, tri)[1]} axes tested")
    assert sat_overlap(sq, tri) == (True, 7)

def test_broad_phase_is_conservative():
    """a broad phase may report false alarms but must never miss a collision"""
    rng = np.random.default_rng(9); missed = culled = 0; N = 5000
    for _ in range(N):
        P = random_convex(rng, 5, rng.uniform(0, 8, 2), 1.0); Q = random_convex(rng, 5, rng.uniform(0, 8, 2), 1.0)
        exact = sat_overlap(P, Q)[0]
        missed += exact and not (aabb_overlap(P, Q) and circle_overlap(P, Q))
        culled += not aabb_overlap(P, Q)
    print(f"broad phase: AABBs rule out {culled / N * 100:.0f} % of {N} pairs without SAT, and miss {missed} collisions")
    assert missed == 0

test_matches_brute_force()
test_known_cases()
test_broad_phase_is_conservative()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};