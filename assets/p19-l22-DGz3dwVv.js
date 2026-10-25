var e=`p19-l22`,t=40,n=`Mains voltage must stay away from anything a person can touch. You learn clearance and creepage, the insulation grades between circuits, and how slots extend surface paths, then write a rule checker with a visibility-graph creepage search and fix an illustrative mains board until every check passes.`,r=`<h2 id="clearance-and-creepage">Clearance and creepage</h2>
<p>Two conductors at different voltages are separated by air and by the board surface:</p>
<ul>
<li><strong>Clearance</strong> is the shortest distance through air. Too little and a voltage surge arcs across.</li>
<li><strong>Creepage</strong> is the shortest distance along the surface of the insulation. Too little and dust and moisture form a conductive track over time.</li>
</ul>
<p>Both requirements grow with working voltage and depend on the pollution degree, the material’s tracking resistance (CTI group), the overvoltage category and altitude; IEC 60664-1 and product standards such as IEC 62368-1 give the tables.</p>
<h2 id="insulation-grades">Insulation grades</h2>
<ul>
<li><strong>Functional</strong> insulation is needed only for the circuit to work.</li>
<li><strong>Basic</strong> insulation gives one level of protection against shock, for example between mains and protective earth.</li>
<li><strong>Double</strong> or <strong>reinforced</strong> insulation separates mains from SELV (safety extra-low voltage) circuits a person can touch, and roughly doubles the distances.</li>
</ul>
<p>A milled <strong>slot</strong> in the board, under an optocoupler or transformer, lengthens creepage because the path must go around it, while clearance through air stays the same. Very narrow slots do not count.</p>
<h2 id="the-rule-checker">The rule checker</h2>
<p>Clearance between two rectangular pads is a point-to-rectangle distance. Creepage is a shortest path on the board surface around slots: build a graph of points on both pads’ outlines and slot corners, join every pair whose straight segment does not cross a slot, and run Dijkstra. The distances required in the code are <strong>illustrative, not from the standard; use the actual IEC table</strong> for your product.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="creepcheck" data-args="{}"></div></div><figcaption>Pads across an isolation barrier with the creepage path. Toggle the slot, move the neutral pad and change the insulation grade; failing pairs turn red.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<ol>
<li>Check: pads 3 mm apart have 3.000 mm creepage; a 1 mm wide slot reaching 3 mm beyond the pads stretches it to 7.325 mm, matching the hand calculation <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord">2</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord">10</span></span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>.</li>
<li>Before the fix: L–N creepage is 1.20 mm against 1.5 mm, and the optocoupler bridges mains to SELV with 4.50 mm against 5.0 mm reinforced: three failures.</li>
<li>After milling a 2 mm slot from the board edge under the optocoupler and moving the neutral pad: L–N 2.50 mm, L–SELV creepage 13.49 mm and N–SELV 8.71 mm (clearance stays 5.00 mm through air): all six checks pass.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">creepage.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy.sparse.csgraph <span class="hljs-keyword">import</span> dijkstra

<span class="hljs-comment"># Illustrative rule table, NOT from the standard: use the actual IEC 60664-1 / IEC 62368-1 tables for your pollution</span>
<span class="hljs-comment"># degree, material group, overvoltage category and altitude. (working voltage V, insulation) -&gt; (clearance, creepage) mm</span>
RULES = {(<span class="hljs-number">50</span>, <span class="hljs-string">&quot;functional&quot;</span>): (<span class="hljs-number">0.2</span>, <span class="hljs-number">0.6</span>), (<span class="hljs-number">250</span>, <span class="hljs-string">&quot;functional&quot;</span>): (<span class="hljs-number">1.0</span>, <span class="hljs-number">1.5</span>),
         (<span class="hljs-number">250</span>, <span class="hljs-string">&quot;basic&quot;</span>): (<span class="hljs-number">2.0</span>, <span class="hljs-number">2.5</span>), (<span class="hljs-number">250</span>, <span class="hljs-string">&quot;reinforced&quot;</span>): (<span class="hljs-number">4.0</span>, <span class="hljs-number">5.0</span>)}
BOARD = (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">32</span>, <span class="hljs-number">20</span>)                               <span class="hljs-comment"># board outline (mm)</span>
OUTSIDE = [(-<span class="hljs-number">50</span>, -<span class="hljs-number">50</span>, <span class="hljs-number">82</span>, <span class="hljs-number">0</span>), (-<span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">82</span>, <span class="hljs-number">70</span>), (-<span class="hljs-number">50</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">20</span>), (<span class="hljs-number">32</span>, <span class="hljs-number">0</span>, <span class="hljs-number">82</span>, <span class="hljs-number">20</span>)]
MIN_SLOT = <span class="hljs-number">1.0</span>                                       <span class="hljs-comment"># illustrative: narrower slots do not count for creepage</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rect_dist</span>(<span class="hljs-params">a, b</span>):
    dx = <span class="hljs-built_in">max</span>(b[<span class="hljs-number">0</span>] - a[<span class="hljs-number">2</span>], a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">2</span>], <span class="hljs-number">0</span>); dy = <span class="hljs-built_in">max</span>(b[<span class="hljs-number">1</span>] - a[<span class="hljs-number">3</span>], a[<span class="hljs-number">1</span>] - b[<span class="hljs-number">3</span>], <span class="hljs-number">0</span>); <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(np.hypot(dx, dy))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">crosses</span>(<span class="hljs-params">p, q, r, eps=<span class="hljs-number">1e-9</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;does segment p-q pass through the open interior of rectangle r (Liang-Barsky clipping)?&quot;&quot;&quot;</span>
    x0, y0, x1, y1 = r[<span class="hljs-number">0</span>] + eps, r[<span class="hljs-number">1</span>] + eps, r[<span class="hljs-number">2</span>] - eps, r[<span class="hljs-number">3</span>] - eps; t0, t1 = <span class="hljs-number">0.0</span>, <span class="hljs-number">1.0</span>; d = (q[<span class="hljs-number">0</span>] - p[<span class="hljs-number">0</span>], q[<span class="hljs-number">1</span>] - p[<span class="hljs-number">1</span>])
    <span class="hljs-keyword">for</span> pk, qk <span class="hljs-keyword">in</span> ((-d[<span class="hljs-number">0</span>], p[<span class="hljs-number">0</span>] - x0), (d[<span class="hljs-number">0</span>], x1 - p[<span class="hljs-number">0</span>]), (-d[<span class="hljs-number">1</span>], p[<span class="hljs-number">1</span>] - y0), (d[<span class="hljs-number">1</span>], y1 - p[<span class="hljs-number">1</span>])):
        <span class="hljs-keyword">if</span> pk == <span class="hljs-number">0</span>:
            <span class="hljs-keyword">if</span> qk &lt; <span class="hljs-number">0</span>: <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>
        <span class="hljs-keyword">else</span>:
            t = qk / pk
            <span class="hljs-keyword">if</span> pk &lt; <span class="hljs-number">0</span>: t0 = <span class="hljs-built_in">max</span>(t0, t)
            <span class="hljs-keyword">else</span>: t1 = <span class="hljs-built_in">min</span>(t1, t)
            <span class="hljs-keyword">if</span> t0 &gt; t1: <span class="hljs-keyword">return</span> <span class="hljs-literal">False</span>
    <span class="hljs-keyword">return</span> t1 - t0 &gt; <span class="hljs-number">1e-9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">perimeter_points</span>(<span class="hljs-params">r, n=<span class="hljs-number">24</span></span>):
    x0, y0, x1, y1 = r; s = np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, n, endpoint=<span class="hljs-literal">False</span>)
    <span class="hljs-keyword">return</span> ([(x0 + (x1 - x0) * u, y0) <span class="hljs-keyword">for</span> u <span class="hljs-keyword">in</span> s] + [(x1, y0 + (y1 - y0) * u) <span class="hljs-keyword">for</span> u <span class="hljs-keyword">in</span> s] +
            [(x1 - (x1 - x0) * u, y1) <span class="hljs-keyword">for</span> u <span class="hljs-keyword">in</span> s] + [(x0, y1 - (y1 - y0) * u) <span class="hljs-keyword">for</span> u <span class="hljs-keyword">in</span> s])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">creepage</span>(<span class="hljs-params">a, b, slots</span>):
    <span class="hljs-string">&quot;&quot;&quot;shortest path along the board surface from pad a to pad b, going around slots (visibility graph + Dijkstra).&quot;&quot;&quot;</span>
    slots = [s <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> slots <span class="hljs-keyword">if</span> <span class="hljs-built_in">min</span>(s[<span class="hljs-number">2</span>] - s[<span class="hljs-number">0</span>], s[<span class="hljs-number">3</span>] - s[<span class="hljs-number">1</span>]) &gt;= MIN_SLOT]
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> slots: <span class="hljs-keyword">return</span> rect_dist(a, b)
    slots = slots + OUTSIDE                                                              <span class="hljs-comment"># the path cannot leave the board</span>
    corners = [(s[i], s[j]) <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> slots <span class="hljs-keyword">for</span> i, j <span class="hljs-keyword">in</span> ((<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">2</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">2</span>, <span class="hljs-number">3</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">3</span>))]
    A = perimeter_points(a); Bp = perimeter_points(b); nodes = A + Bp + corners; n = <span class="hljs-built_in">len</span>(nodes)
    W = np.zeros((n, n))                                                                 <span class="hljs-comment"># 0 means no edge</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(i + <span class="hljs-number">1</span>, n):
            <span class="hljs-keyword">if</span> (i &lt; <span class="hljs-built_in">len</span>(A) <span class="hljs-keyword">and</span> j &lt; <span class="hljs-built_in">len</span>(A)) <span class="hljs-keyword">or</span> (<span class="hljs-built_in">len</span>(A) &lt;= i &lt; <span class="hljs-built_in">len</span>(A) + <span class="hljs-built_in">len</span>(Bp) <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(A) &lt;= j &lt; <span class="hljs-built_in">len</span>(A) + <span class="hljs-built_in">len</span>(Bp)): <span class="hljs-keyword">continue</span>
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> <span class="hljs-built_in">any</span>(crosses(nodes[i], nodes[j], s) <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> slots):
                W[i, j] = W[j, i] = np.hypot(nodes[i][<span class="hljs-number">0</span>] - nodes[j][<span class="hljs-number">0</span>], nodes[i][<span class="hljs-number">1</span>] - nodes[j][<span class="hljs-number">1</span>]) + <span class="hljs-number">1e-12</span>
    dist = dijkstra(W, directed=<span class="hljs-literal">False</span>, indices=<span class="hljs-built_in">list</span>(<span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(A))), min_only=<span class="hljs-literal">True</span>)        <span class="hljs-comment"># from any point on pad a</span>
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(dist[<span class="hljs-built_in">len</span>(A):<span class="hljs-built_in">len</span>(A) + <span class="hljs-built_in">len</span>(Bp)].<span class="hljs-built_in">min</span>())

<span class="hljs-keyword">def</span> <span class="hljs-title function_">check</span>(<span class="hljs-params">pads, pairs, slots</span>):
    ok = <span class="hljs-literal">True</span>
    <span class="hljs-keyword">for</span> na, nb, volts, ins <span class="hljs-keyword">in</span> pairs:
        cl_req, cr_req = RULES[(volts, ins)]
        cl = <span class="hljs-built_in">min</span>(rect_dist(a, b) <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> pads[na] <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> pads[nb])
        cr = <span class="hljs-built_in">min</span>(creepage(a, b, slots) <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> pads[na] <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> pads[nb])
        good = cl &gt;= cl_req <span class="hljs-keyword">and</span> cr &gt;= cr_req; ok &amp;= good
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{na:&gt;4s}</span>-<span class="hljs-subst">{nb:&lt;4s}</span> <span class="hljs-subst">{ins:10s}</span> clearance <span class="hljs-subst">{cl:<span class="hljs-number">5.2</span>f}</span>/<span class="hljs-subst">{cl_req:<span class="hljs-number">.1</span>f}</span>  creepage <span class="hljs-subst">{cr:<span class="hljs-number">5.2</span>f}</span>/<span class="hljs-subst">{cr_req:<span class="hljs-number">.1</span>f}</span>  <span class="hljs-subst">{<span class="hljs-string">&#x27;ok&#x27;</span> <span class="hljs-keyword">if</span> good <span class="hljs-keyword">else</span> <span class="hljs-string">&#x27;FAIL&#x27;</span>}</span>&quot;</span>)
    <span class="hljs-keyword">return</span> ok

PAIRS = [(<span class="hljs-string">&quot;L&quot;</span>, <span class="hljs-string">&quot;N&quot;</span>, <span class="hljs-number">250</span>, <span class="hljs-string">&quot;functional&quot;</span>), (<span class="hljs-string">&quot;L&quot;</span>, <span class="hljs-string">&quot;PE&quot;</span>, <span class="hljs-number">250</span>, <span class="hljs-string">&quot;basic&quot;</span>), (<span class="hljs-string">&quot;N&quot;</span>, <span class="hljs-string">&quot;PE&quot;</span>, <span class="hljs-number">250</span>, <span class="hljs-string">&quot;basic&quot;</span>),
         (<span class="hljs-string">&quot;L&quot;</span>, <span class="hljs-string">&quot;SELV&quot;</span>, <span class="hljs-number">250</span>, <span class="hljs-string">&quot;reinforced&quot;</span>), (<span class="hljs-string">&quot;N&quot;</span>, <span class="hljs-string">&quot;SELV&quot;</span>, <span class="hljs-number">250</span>, <span class="hljs-string">&quot;reinforced&quot;</span>), (<span class="hljs-string">&quot;SELV&quot;</span>, <span class="hljs-string">&quot;GND&quot;</span>, <span class="hljs-number">50</span>, <span class="hljs-string">&quot;functional&quot;</span>)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">board</span>(<span class="hljs-params">fixed</span>):
    <span class="hljs-string">&quot;&quot;&quot;mains on the left, an optocoupler bridging the isolation barrier at x = 20 mm, low-voltage logic on the right.&quot;&quot;&quot;</span>
    pads = {<span class="hljs-string">&quot;L&quot;</span>: [(<span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">6</span>, <span class="hljs-number">5</span>)], <span class="hljs-string">&quot;N&quot;</span>: [(<span class="hljs-number">2</span>, <span class="hljs-number">7.5</span> <span class="hljs-keyword">if</span> fixed <span class="hljs-keyword">else</span> <span class="hljs-number">6.2</span>, <span class="hljs-number">6</span>, <span class="hljs-number">10.5</span> <span class="hljs-keyword">if</span> fixed <span class="hljs-keyword">else</span> <span class="hljs-number">9.2</span>)], <span class="hljs-string">&quot;PE&quot;</span>: [(<span class="hljs-number">2</span>, <span class="hljs-number">14</span>, <span class="hljs-number">6</span>, <span class="hljs-number">17</span>)],
            <span class="hljs-string">&quot;SELV&quot;</span>: [(<span class="hljs-number">22</span>, <span class="hljs-number">2</span>, <span class="hljs-number">24</span>, <span class="hljs-number">4</span>), (<span class="hljs-number">22</span>, <span class="hljs-number">7</span>, <span class="hljs-number">24</span>, <span class="hljs-number">9</span>)], <span class="hljs-string">&quot;GND&quot;</span>: [(<span class="hljs-number">26</span>, <span class="hljs-number">2</span>, <span class="hljs-number">30</span>, <span class="hljs-number">4</span>)]}
    pads[<span class="hljs-string">&quot;L&quot;</span>].append((<span class="hljs-number">15</span>, <span class="hljs-number">2</span>, <span class="hljs-number">17.5</span> <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> fixed <span class="hljs-keyword">else</span> <span class="hljs-number">17</span>, <span class="hljs-number">4</span>)); pads[<span class="hljs-string">&quot;N&quot;</span>].append((<span class="hljs-number">15</span>, <span class="hljs-number">7</span>, <span class="hljs-number">17.5</span> <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> fixed <span class="hljs-keyword">else</span> <span class="hljs-number">17</span>, <span class="hljs-number">9</span>))   <span class="hljs-comment"># opto LED side</span>
    slots = [(<span class="hljs-number">18.5</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">20.5</span>, <span class="hljs-number">12</span>)] <span class="hljs-keyword">if</span> fixed <span class="hljs-keyword">else</span> []          <span class="hljs-comment"># milled from the board edge</span>
    <span class="hljs-keyword">return</span> pads, slots

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_rule_checks</span>():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;before:&quot;</span>); before = check(*board(<span class="hljs-literal">False</span>)[:<span class="hljs-number">1</span>], PAIRS, board(<span class="hljs-literal">False</span>)[<span class="hljs-number">1</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;after (slot under the optocoupler, N pad moved):&quot;</span>); after = check(*board(<span class="hljs-literal">True</span>)[:<span class="hljs-number">1</span>], PAIRS, board(<span class="hljs-literal">True</span>)[<span class="hljs-number">1</span>])
    <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> before <span class="hljs-keyword">and</span> after

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_creepage_geometry</span>():
    a, b = (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">4</span>, <span class="hljs-number">0</span>, <span class="hljs-number">5</span>, <span class="hljs-number">1</span>)
    straight = creepage(a, b, []); around = creepage(a, b, [(<span class="hljs-number">2</span>, -<span class="hljs-number">3</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>)])
    expect = <span class="hljs-number">2</span> * np.hypot(<span class="hljs-number">1</span>, <span class="hljs-number">3</span>) + <span class="hljs-number">1</span>                                            <span class="hljs-comment"># down to a slot corner, across, back up</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;pads 3 mm apart: straight <span class="hljs-subst">{straight:<span class="hljs-number">.3</span>f}</span> mm; around a 7 mm slot <span class="hljs-subst">{around:<span class="hljs-number">.3</span>f}</span> mm (by hand <span class="hljs-subst">{expect:<span class="hljs-number">.3</span>f}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(straight - <span class="hljs-number">3</span>) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(around - expect) &lt; <span class="hljs-number">0.02</span>

test_creepage_geometry()
test_rule_checks()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>In KiCad you set net classes and custom design rules (clearance between net classes, and a creepage constraint in recent versions), draw slots on the Edge.Cuts layer, and let the design rule checker flag violations. Component choice matters too: optocouplers, transformers and Y capacitors come with stated isolation ratings. This lesson is educational; mains designs need the real standard, certified components and testing such as hi-pot tests.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does a slot increase creepage but not clearance?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Creepage follows the insulating surface, which the slot interrupts, so the path must go around its end. Clearance is a straight line through air, which passes over the slot unchanged.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Two pads 4 mm apart need 5 mm creepage. A slot between them extends 2 mm beyond both pads’ edges. Roughly what creepage results with a 1 mm wide slot centred in the gap?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The path goes from a pad corner to the slot corner (1.5 mm across, 2 mm along), across the 1 mm slot end, and back: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1266em;"></span><span class="mord">2</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9134em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord">1.</span><span class="mord"><span class="mord">5</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span><span style="top:-2.8734em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1266em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2.5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6</span></span></span></span> mm, enough.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p19-l22"></div>
`,i=[{id:`clearance-and-creepage`,title:`Clearance and creepage`},{id:`insulation-grades`,title:`Insulation grades`},{id:`the-rule-checker`,title:`The rule checker`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p19-l22-q1`,type:`num`,q:`<p>Creepage around a 1 mm slot reaching 3 mm beyond pads 3 mm apart (mm)?</p>
`,explain:`<p>Two diagonals and the slot width.</p>
`,answer:7.325,tol:.002,unit:``},{id:`p19-l22-q2`,type:`num`,q:`<p>Reinforced creepage if basic needs 2.5 mm and reinforced doubles it (mm)?</p>
`,explain:`<p>Roughly twice basic.</p>
`,answer:5,tol:.001,unit:``},{id:`p19-l22-q3`,type:`num`,q:`<p>Clearance between pads at x 17 mm and x 22 mm on the same row (mm)?</p>
`,explain:`<p>Straight line through air.</p>
`,answer:5,tol:.001,unit:``},{id:`p19-l22-q4`,type:`num`,q:`<p>Diagonal from (17, 9) to (18.5, 12) in mm?</p>
`,explain:`<p>Part of the creepage path.</p>
`,answer:3.354,tol:.002,unit:``},{id:`p19-l22-q5`,type:`mc`,q:`<p>Which insulation grade separates mains from touchable SELV circuits?</p>
`,explain:`<p>Two levels of protection.</p>
`,options:[`Functional`,`None`,`Basic only`,`Double or reinforced`],answer:3},{id:`p19-l22-q6`,type:`mc`,q:`<p>Which distance does a slot lengthen?</p>
`,explain:`<p>Air paths go over the slot.</p>
`,options:[`Clearance`,`Both equally`,`Neither`,`Creepage`],answer:3}],o=[{file:`creepage.py`,lang:`python`,src:`import numpy as np
from scipy.sparse.csgraph import dijkstra

# Illustrative rule table, NOT from the standard: use the actual IEC 60664-1 / IEC 62368-1 tables for your pollution
# degree, material group, overvoltage category and altitude. (working voltage V, insulation) -> (clearance, creepage) mm
RULES = {(50, "functional"): (0.2, 0.6), (250, "functional"): (1.0, 1.5),
         (250, "basic"): (2.0, 2.5), (250, "reinforced"): (4.0, 5.0)}
BOARD = (0, 0, 32, 20)                               # board outline (mm)
OUTSIDE = [(-50, -50, 82, 0), (-50, 20, 82, 70), (-50, 0, 0, 20), (32, 0, 82, 20)]
MIN_SLOT = 1.0                                       # illustrative: narrower slots do not count for creepage

def rect_dist(a, b):
    dx = max(b[0] - a[2], a[0] - b[2], 0); dy = max(b[1] - a[3], a[1] - b[3], 0); return float(np.hypot(dx, dy))

def crosses(p, q, r, eps=1e-9):
    """does segment p-q pass through the open interior of rectangle r (Liang-Barsky clipping)?"""
    x0, y0, x1, y1 = r[0] + eps, r[1] + eps, r[2] - eps, r[3] - eps; t0, t1 = 0.0, 1.0; d = (q[0] - p[0], q[1] - p[1])
    for pk, qk in ((-d[0], p[0] - x0), (d[0], x1 - p[0]), (-d[1], p[1] - y0), (d[1], y1 - p[1])):
        if pk == 0:
            if qk < 0: return False
        else:
            t = qk / pk
            if pk < 0: t0 = max(t0, t)
            else: t1 = min(t1, t)
            if t0 > t1: return False
    return t1 - t0 > 1e-9

def perimeter_points(r, n=24):
    x0, y0, x1, y1 = r; s = np.linspace(0, 1, n, endpoint=False)
    return ([(x0 + (x1 - x0) * u, y0) for u in s] + [(x1, y0 + (y1 - y0) * u) for u in s] +
            [(x1 - (x1 - x0) * u, y1) for u in s] + [(x0, y1 - (y1 - y0) * u) for u in s])

def creepage(a, b, slots):
    """shortest path along the board surface from pad a to pad b, going around slots (visibility graph + Dijkstra)."""
    slots = [s for s in slots if min(s[2] - s[0], s[3] - s[1]) >= MIN_SLOT]
    if not slots: return rect_dist(a, b)
    slots = slots + OUTSIDE                                                              # the path cannot leave the board
    corners = [(s[i], s[j]) for s in slots for i, j in ((0, 1), (2, 1), (2, 3), (0, 3))]
    A = perimeter_points(a); Bp = perimeter_points(b); nodes = A + Bp + corners; n = len(nodes)
    W = np.zeros((n, n))                                                                 # 0 means no edge
    for i in range(n):
        for j in range(i + 1, n):
            if (i < len(A) and j < len(A)) or (len(A) <= i < len(A) + len(Bp) and len(A) <= j < len(A) + len(Bp)): continue
            if not any(crosses(nodes[i], nodes[j], s) for s in slots):
                W[i, j] = W[j, i] = np.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]) + 1e-12
    dist = dijkstra(W, directed=False, indices=list(range(len(A))), min_only=True)        # from any point on pad a
    return float(dist[len(A):len(A) + len(Bp)].min())

def check(pads, pairs, slots):
    ok = True
    for na, nb, volts, ins in pairs:
        cl_req, cr_req = RULES[(volts, ins)]
        cl = min(rect_dist(a, b) for a in pads[na] for b in pads[nb])
        cr = min(creepage(a, b, slots) for a in pads[na] for b in pads[nb])
        good = cl >= cl_req and cr >= cr_req; ok &= good
        print(f"  {na:>4s}-{nb:<4s} {ins:10s} clearance {cl:5.2f}/{cl_req:.1f}  creepage {cr:5.2f}/{cr_req:.1f}  {'ok' if good else 'FAIL'}")
    return ok

PAIRS = [("L", "N", 250, "functional"), ("L", "PE", 250, "basic"), ("N", "PE", 250, "basic"),
         ("L", "SELV", 250, "reinforced"), ("N", "SELV", 250, "reinforced"), ("SELV", "GND", 50, "functional")]

def board(fixed):
    """mains on the left, an optocoupler bridging the isolation barrier at x = 20 mm, low-voltage logic on the right."""
    pads = {"L": [(2, 2, 6, 5)], "N": [(2, 7.5 if fixed else 6.2, 6, 10.5 if fixed else 9.2)], "PE": [(2, 14, 6, 17)],
            "SELV": [(22, 2, 24, 4), (22, 7, 24, 9)], "GND": [(26, 2, 30, 4)]}
    pads["L"].append((15, 2, 17.5 if not fixed else 17, 4)); pads["N"].append((15, 7, 17.5 if not fixed else 17, 9))   # opto LED side
    slots = [(18.5, -1, 20.5, 12)] if fixed else []          # milled from the board edge
    return pads, slots

def test_rule_checks():
    print("before:"); before = check(*board(False)[:1], PAIRS, board(False)[1])
    print("after (slot under the optocoupler, N pad moved):"); after = check(*board(True)[:1], PAIRS, board(True)[1])
    assert not before and after

def test_creepage_geometry():
    a, b = (0, 0, 1, 1), (4, 0, 5, 1)
    straight = creepage(a, b, []); around = creepage(a, b, [(2, -3, 3, 4)])
    expect = 2 * np.hypot(1, 3) + 1                                            # down to a slot corner, across, back up
    print(f"pads 3 mm apart: straight {straight:.3f} mm; around a 7 mm slot {around:.3f} mm (by hand {expect:.3f})")
    assert abs(straight - 3) < 1e-9 and abs(around - expect) < 0.02

test_creepage_geometry()
test_rule_checks()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};