var e=`p16-l06`,t=40,n=`The simplest planners treat the map as a grid of free and blocked cells and search it as a graph. You derive why breadth-first search finds the fewest steps when every step costs the same, and why Dijkstra’s algorithm finds the cheapest path when steps have different costs, implement both on an occupancy grid, and test their path costs against an independent shortest-path solver on a building-like map and on random maps.`,r=`<h2 id="grids-are-graphs">Grids are graphs</h2>
<p>An <strong>occupancy grid</strong> divides the map into cells, each free or blocked. Every free cell is a node, joined to its free neighbours: 4-connected (up, down, left, right, each cost 1) or 8-connected (adding diagonals of cost <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;">2</span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span></span></span></span>). A diagonal step is allowed only if neither of the cells it cuts past is blocked, so the path can’t slip through a corner. Mobile robots plan this way on maps built from their lidar (Phase 17).</p>
<h2 id="breadth-first-search">Breadth-first search</h2>
<p>BFS expands cells in rings: first the start, then everything 1 step away, then 2, and so on, using a first-in first-out queue. The first time it reaches a cell, it has used the fewest possible steps, because every cell at distance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span></span></span></span> is dequeued before any at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>. Each cell and edge is handled once: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mclose">)</span></span></span></span>.</p>
<p>BFS is optimal only when all steps cost the same. On an 8-connected grid it would treat a diagonal as 1, not <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;">2</span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span></span></span></span>.</p>
<h2 id="dijkstra-s-algorithm">Dijkstra’s algorithm</h2>
<p>Dijkstra keeps a priority queue ordered by the cost so far, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span></span></span></span>. It repeatedly removes the cheapest cell, marks it final and <strong>relaxes</strong> its neighbours: if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">c</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mopen">(</span><span class="mord mathnormal">c</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span>, update <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span>.</p>
<p>Why is a removed cell final? Every cell still in the queue has <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8304em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≥</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">c</span><span class="mclose">)</span></span></span></span>, and costs are non-negative, so any other route to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">c</span></span></span></span> through them costs at least <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">c</span><span class="mclose">)</span></span></span></span>. With a binary heap, the cost is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">O</span><span class="mopen">((</span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">lo<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="mclose">)</span></span></span></span>. Negative step costs break this argument, but distances can’t be negative.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="wavefront" data-args="{}"></div></div><figcaption>Breadth-first search or Dijkstra spreading from the start across an occupancy grid. The colour is the cost to reach each cell, and the path is traced back from the goal once it is reached. Move the slider to step through the expansion.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>On an empty grid from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">0</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0</span><span class="mclose">)</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">3</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">5</span><span class="mclose">)</span></span></span></span>: BFS needs <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span></span></span></span> steps; 8-connected Dijkstra pays <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord">3</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;">2</span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6.243</span></span></span></span>, three diagonals and two straight steps.</p>
<p>An illustrative 40 × 30 building map with walls and doors, from cell <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">2</span><span class="mclose">)</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">27</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">37</span><span class="mclose">)</span></span></span></span>:</p>
<ol>
<li>BFS: 60 steps, having discovered 1000 of the 1114 free cells before reaching the goal. Dijkstra on the 4-connected grid also costs 60, and so does SciPy’s shortest-path solver on the same graph.</li>
<li>Dijkstra on the 8-connected grid: cost 47.70, matching SciPy, after expanding 975 cells. The path has 40 cells.</li>
<li>On 20 random 15 × 15 maps with 25 % of cells blocked, Dijkstra matches the reference on all 15 solvable maps and reports the other 5 unreachable.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">gridsearch.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq
<span class="hljs-keyword">from</span> collections <span class="hljs-keyword">import</span> deque
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy.sparse <span class="hljs-keyword">import</span> lil_matrix
<span class="hljs-keyword">from</span> scipy.sparse.csgraph <span class="hljs-keyword">import</span> dijkstra <span class="hljs-keyword">as</span> reference_dijkstra

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_map</span>(<span class="hljs-params">w=<span class="hljs-number">40</span>, h=<span class="hljs-number">30</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;an illustrative occupancy grid (True = blocked): walls with gaps, like rooms and corridors&quot;&quot;&quot;</span>
    g = np.zeros((h, w), <span class="hljs-built_in">bool</span>)
    g[<span class="hljs-number">5</span>:<span class="hljs-number">25</span>, <span class="hljs-number">12</span>] = <span class="hljs-literal">True</span>; g[<span class="hljs-number">14</span>:<span class="hljs-number">16</span>, <span class="hljs-number">12</span>] = <span class="hljs-literal">False</span>            <span class="hljs-comment"># wall with a door</span>
    g[<span class="hljs-number">0</span>:<span class="hljs-number">20</span>, <span class="hljs-number">24</span>] = <span class="hljs-literal">True</span>                                  <span class="hljs-comment"># wall from the top</span>
    g[<span class="hljs-number">22</span>, <span class="hljs-number">18</span>:<span class="hljs-number">36</span>] = <span class="hljs-literal">True</span>; g[<span class="hljs-number">22</span>, <span class="hljs-number">30</span>:<span class="hljs-number">32</span>] = <span class="hljs-literal">False</span>           <span class="hljs-comment"># wall with a door</span>
    g[<span class="hljs-number">8</span>:<span class="hljs-number">12</span>, <span class="hljs-number">30</span>:<span class="hljs-number">38</span>] = <span class="hljs-literal">True</span>                               <span class="hljs-comment"># a block</span>
    <span class="hljs-keyword">return</span> g

N4 = [(<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>)]
N8 = N4 + [(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>), (-<span class="hljs-number">1</span>, <span class="hljs-number">1</span>), (-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">neighbours</span>(<span class="hljs-params">g, c, conn</span>):
    r, k = c
    <span class="hljs-keyword">for</span> dr, dk <span class="hljs-keyword">in</span> (N4 <span class="hljs-keyword">if</span> conn == <span class="hljs-number">4</span> <span class="hljs-keyword">else</span> N8):
        n = (r + dr, k + dk)
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> (<span class="hljs-number">0</span> &lt;= n[<span class="hljs-number">0</span>] &lt; g.shape[<span class="hljs-number">0</span>] <span class="hljs-keyword">and</span> <span class="hljs-number">0</span> &lt;= n[<span class="hljs-number">1</span>] &lt; g.shape[<span class="hljs-number">1</span>]) <span class="hljs-keyword">or</span> g[n]: <span class="hljs-keyword">continue</span>
        <span class="hljs-keyword">if</span> dr <span class="hljs-keyword">and</span> dk <span class="hljs-keyword">and</span> (g[r + dr, k] <span class="hljs-keyword">or</span> g[r, k + dk]): <span class="hljs-keyword">continue</span>     <span class="hljs-comment"># no cutting blocked corners diagonally</span>
        <span class="hljs-keyword">yield</span> n, (<span class="hljs-number">1.0</span> <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> (dr <span class="hljs-keyword">and</span> dk) <span class="hljs-keyword">else</span> np.sqrt(<span class="hljs-number">2</span>))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bfs</span>(<span class="hljs-params">g, s, t</span>):
    <span class="hljs-string">&quot;&quot;&quot;fewest 4-connected steps: the first time a cell is reached is via a shortest path&quot;&quot;&quot;</span>
    dist = {s: <span class="hljs-number">0</span>}; prev = {s: <span class="hljs-literal">None</span>}; Q = deque([s])
    <span class="hljs-keyword">while</span> Q:
        c = Q.popleft()
        <span class="hljs-keyword">if</span> c == t: <span class="hljs-keyword">break</span>
        <span class="hljs-keyword">for</span> n, _ <span class="hljs-keyword">in</span> neighbours(g, c, <span class="hljs-number">4</span>):
            <span class="hljs-keyword">if</span> n <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> dist: dist[n] = dist[c] + <span class="hljs-number">1</span>; prev[n] = c; Q.append(n)
    <span class="hljs-keyword">return</span> dist.get(t), prev, <span class="hljs-built_in">len</span>(dist)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">dijkstra</span>(<span class="hljs-params">g, s, t, conn=<span class="hljs-number">8</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;least-cost path with step costs 1 and sqrt(2); a cell is final when it leaves the priority queue&quot;&quot;&quot;</span>
    dist = {s: <span class="hljs-number">0.0</span>}; prev = {s: <span class="hljs-literal">None</span>}; pq = [(<span class="hljs-number">0.0</span>, s)]; done = <span class="hljs-built_in">set</span>()
    <span class="hljs-keyword">while</span> pq:
        d, c = heapq.heappop(pq)
        <span class="hljs-keyword">if</span> c <span class="hljs-keyword">in</span> done: <span class="hljs-keyword">continue</span>
        done.add(c)
        <span class="hljs-keyword">if</span> c == t: <span class="hljs-keyword">break</span>
        <span class="hljs-keyword">for</span> n, w <span class="hljs-keyword">in</span> neighbours(g, c, conn):
            <span class="hljs-keyword">if</span> d + w &lt; dist.get(n, np.inf): dist[n] = d + w; prev[n] = c; heapq.heappush(pq, (d + w, n))
    path = [t]
    <span class="hljs-keyword">while</span> prev.get(path[-<span class="hljs-number">1</span>]) <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>: path.append(prev[path[-<span class="hljs-number">1</span>]])
    <span class="hljs-keyword">return</span> dist.get(t), path[::-<span class="hljs-number">1</span>], <span class="hljs-built_in">len</span>(done)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">all_pairs_reference</span>(<span class="hljs-params">g, s, conn</span>):
    <span class="hljs-string">&quot;&quot;&quot;an independent answer: scipy&#x27;s Dijkstra on the same graph as a sparse matrix&quot;&quot;&quot;</span>
    h, w = g.shape; A = lil_matrix((h * w, h * w))
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(h):
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(w):
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> g[r, k]:
                <span class="hljs-keyword">for</span> n, c <span class="hljs-keyword">in</span> neighbours(g, (r, k), conn): A[r * w + k, n[<span class="hljs-number">0</span>] * w + n[<span class="hljs-number">1</span>]] = c
    <span class="hljs-keyword">return</span> reference_dijkstra(A.tocsr(), indices=s[<span class="hljs-number">0</span>] * w + s[<span class="hljs-number">1</span>])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_optimal_costs</span>():
    g = make_map(); s, t = (<span class="hljs-number">2</span>, <span class="hljs-number">2</span>), (<span class="hljs-number">27</span>, <span class="hljs-number">37</span>)
    steps, _, seen = bfs(g, s, t)
    cost8, path, expanded = dijkstra(g, s, t, <span class="hljs-number">8</span>)
    cost4 = dijkstra(g, s, t, <span class="hljs-number">4</span>)[<span class="hljs-number">0</span>]
    ref8 = all_pairs_reference(g, s, <span class="hljs-number">8</span>)[t[<span class="hljs-number">0</span>] * g.shape[<span class="hljs-number">1</span>] + t[<span class="hljs-number">1</span>]]
    ref4 = all_pairs_reference(g, s, <span class="hljs-number">4</span>)[t[<span class="hljs-number">0</span>] * g.shape[<span class="hljs-number">1</span>] + t[<span class="hljs-number">1</span>]]
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;BFS: <span class="hljs-subst">{steps}</span> steps (4-connected), discovered <span class="hljs-subst">{seen}</span> of <span class="hljs-subst">{(~g).<span class="hljs-built_in">sum</span>()}</span> free cells; Dijkstra 4-connected cost <span class="hljs-subst">{cost4:<span class="hljs-number">.0</span>f}</span>, reference <span class="hljs-subst">{ref4:<span class="hljs-number">.0</span>f}</span>&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Dijkstra 8-connected: cost <span class="hljs-subst">{cost8:<span class="hljs-number">.4</span>f}</span>, reference <span class="hljs-subst">{ref8:<span class="hljs-number">.4</span>f}</span>, <span class="hljs-subst">{expanded}</span> cells expanded, path of <span class="hljs-subst">{<span class="hljs-built_in">len</span>(path)}</span> cells&quot;</span>)
    <span class="hljs-keyword">assert</span> steps == cost4 == ref4 <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(cost8 - ref8) &lt; <span class="hljs-number">1e-9</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">all</span>(<span class="hljs-keyword">not</span> g[c] <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> path) <span class="hljs-keyword">and</span> cost8 &lt; steps          <span class="hljs-comment"># diagonal moves shorten the path</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_random_maps</span>():
    rng = np.random.default_rng(<span class="hljs-number">3</span>); n = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20</span>):
        g = rng.random((<span class="hljs-number">15</span>, <span class="hljs-number">15</span>)) &lt; <span class="hljs-number">0.25</span>; g[<span class="hljs-number">0</span>, <span class="hljs-number">0</span>] = g[<span class="hljs-number">14</span>, <span class="hljs-number">14</span>] = <span class="hljs-literal">False</span>
        c = dijkstra(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">14</span>, <span class="hljs-number">14</span>))[<span class="hljs-number">0</span>]; r = all_pairs_reference(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), <span class="hljs-number">8</span>)[-<span class="hljs-number">1</span>]
        <span class="hljs-keyword">if</span> c <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-keyword">assert</span> np.isinf(r); <span class="hljs-keyword">continue</span>
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(c - r) &lt; <span class="hljs-number">1e-9</span>; n += <span class="hljs-number">1</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;20 random 15 x 15 maps: Dijkstra matches the reference on all <span class="hljs-subst">{n}</span> solvable ones and reports the rest unreachable&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_empty_grid</span>():
    g = np.zeros((<span class="hljs-number">10</span>, <span class="hljs-number">10</span>), <span class="hljs-built_in">bool</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;empty grid (0,0) to (3,5): BFS <span class="hljs-subst">{bfs(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">5</span>))[<span class="hljs-number">0</span>]}</span> steps, 8-connected cost <span class="hljs-subst">{dijkstra(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">5</span>))[<span class="hljs-number">0</span>]:<span class="hljs-number">.4</span>f}</span> = 3 sqrt(2) + 2&quot;</span>)
    <span class="hljs-keyword">assert</span> bfs(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">5</span>))[<span class="hljs-number">0</span>] == <span class="hljs-number">8</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(dijkstra(g, (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">3</span>, <span class="hljs-number">5</span>))[<span class="hljs-number">0</span>] - (<span class="hljs-number">3</span> * np.sqrt(<span class="hljs-number">2</span>) + <span class="hljs-number">2</span>)) &lt; <span class="hljs-number">1e-12</span>

test_optimal_costs()
test_random_maps()
test_empty_grid()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Nav2, the ROS 2 navigation stack, plans with grid searches like these on a costmap, where cells near obstacles cost more than open floor rather than being simply free or blocked. Dijkstra handles that directly: the step cost becomes the distance times the cell’s cost.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Dijkstra expanded 975 cells to find one path. When is that work not wasted?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>When the start is fixed and you need paths to many goals, or a cost-to-go map for a controller: one Dijkstra run from the goal gives every cell’s distance to it, and the robot can descend that field from wherever it is. For a single start and goal, A* (lesson 07) expands far fewer cells.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why do 8-connected grid paths still look jagged, and why are they not the true shortest paths?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>They can only move in 8 directions, so a path at 20° zig-zags between straight and diagonal steps. Its length can exceed the straight line by up to about 8 % (at 22.5°). Any-angle planners such as Theta*, or smoothing the path afterwards, remove the zig-zags.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p16-l06"></div>
`,i=[{id:`grids-are-graphs`,title:`Grids are graphs`},{id:`breadth-first-search`,title:`Breadth-first search`},{id:`dijkstra-s-algorithm`,title:`Dijkstra’s algorithm`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p16-l06-q1`,type:`num`,q:`<p>BFS steps on an empty 4-connected grid from (0, 0) to (6, 2)?</p>
`,explain:`<p>The Manhattan distance.</p>
`,answer:8,tol:.001,unit:``},{id:`p16-l06-q2`,type:`num`,q:`<p>8-connected Dijkstra cost on an empty grid from (0, 0) to (6, 2)?</p>
`,explain:`<p>Two diagonals and four straight steps.</p>
`,answer:6.828,tol:.002,unit:``},{id:`p16-l06-q3`,type:`num`,q:`<p>Largest ratio of 8-connected path length to straight-line distance, at 22.5° (cos 22.5° + (√2 − 1) sin 22.5°)?</p>
`,explain:`<p>The worst angle for an 8-direction grid, about 8 % too long.</p>
`,answer:1.0824,tol:.002,unit:``},{id:`p16-l06-q4`,type:`num`,q:`<p>Edges in a fully free 4-connected 10 × 10 grid, counting each once?</p>
`,explain:`<p>9 horizontal edges in each of 10 rows, and the same vertically.</p>
`,answer:180,tol:.001,unit:``},{id:`p16-l06-q5`,type:`mc`,q:`<p>BFS finds optimal paths only when…</p>
`,explain:`<p>It counts steps, not costs.</p>
`,options:[`the grid is 8-connected`,`the goal is reachable in under 100 steps`,`every step has the same cost`,`there are no obstacles`],answer:2},{id:`p16-l06-q6`,type:`mc`,q:`<p>Dijkstra can mark a dequeued cell final because…</p>
`,explain:`<p>No detour through a more expensive cell can make it cheaper.</p>
`,options:[`every other queued cell costs at least as much and step costs are non-negative`,`it has the fewest steps`,`it was added first`,`it is the closest to the goal`],answer:0}],o=[{file:`gridsearch.py`,lang:`python`,src:`import heapq
from collections import deque
import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.csgraph import dijkstra as reference_dijkstra

def make_map(w=40, h=30):
    """an illustrative occupancy grid (True = blocked): walls with gaps, like rooms and corridors"""
    g = np.zeros((h, w), bool)
    g[5:25, 12] = True; g[14:16, 12] = False            # wall with a door
    g[0:20, 24] = True                                  # wall from the top
    g[22, 18:36] = True; g[22, 30:32] = False           # wall with a door
    g[8:12, 30:38] = True                               # a block
    return g

N4 = [(1, 0), (-1, 0), (0, 1), (0, -1)]
N8 = N4 + [(1, 1), (1, -1), (-1, 1), (-1, -1)]

def neighbours(g, c, conn):
    r, k = c
    for dr, dk in (N4 if conn == 4 else N8):
        n = (r + dr, k + dk)
        if not (0 <= n[0] < g.shape[0] and 0 <= n[1] < g.shape[1]) or g[n]: continue
        if dr and dk and (g[r + dr, k] or g[r, k + dk]): continue     # no cutting blocked corners diagonally
        yield n, (1.0 if not (dr and dk) else np.sqrt(2))

def bfs(g, s, t):
    """fewest 4-connected steps: the first time a cell is reached is via a shortest path"""
    dist = {s: 0}; prev = {s: None}; Q = deque([s])
    while Q:
        c = Q.popleft()
        if c == t: break
        for n, _ in neighbours(g, c, 4):
            if n not in dist: dist[n] = dist[c] + 1; prev[n] = c; Q.append(n)
    return dist.get(t), prev, len(dist)

def dijkstra(g, s, t, conn=8):
    """least-cost path with step costs 1 and sqrt(2); a cell is final when it leaves the priority queue"""
    dist = {s: 0.0}; prev = {s: None}; pq = [(0.0, s)]; done = set()
    while pq:
        d, c = heapq.heappop(pq)
        if c in done: continue
        done.add(c)
        if c == t: break
        for n, w in neighbours(g, c, conn):
            if d + w < dist.get(n, np.inf): dist[n] = d + w; prev[n] = c; heapq.heappush(pq, (d + w, n))
    path = [t]
    while prev.get(path[-1]) is not None: path.append(prev[path[-1]])
    return dist.get(t), path[::-1], len(done)

def all_pairs_reference(g, s, conn):
    """an independent answer: scipy's Dijkstra on the same graph as a sparse matrix"""
    h, w = g.shape; A = lil_matrix((h * w, h * w))
    for r in range(h):
        for k in range(w):
            if not g[r, k]:
                for n, c in neighbours(g, (r, k), conn): A[r * w + k, n[0] * w + n[1]] = c
    return reference_dijkstra(A.tocsr(), indices=s[0] * w + s[1])

def test_optimal_costs():
    g = make_map(); s, t = (2, 2), (27, 37)
    steps, _, seen = bfs(g, s, t)
    cost8, path, expanded = dijkstra(g, s, t, 8)
    cost4 = dijkstra(g, s, t, 4)[0]
    ref8 = all_pairs_reference(g, s, 8)[t[0] * g.shape[1] + t[1]]
    ref4 = all_pairs_reference(g, s, 4)[t[0] * g.shape[1] + t[1]]
    print(f"BFS: {steps} steps (4-connected), discovered {seen} of {(~g).sum()} free cells; Dijkstra 4-connected cost {cost4:.0f}, reference {ref4:.0f}")
    print(f"Dijkstra 8-connected: cost {cost8:.4f}, reference {ref8:.4f}, {expanded} cells expanded, path of {len(path)} cells")
    assert steps == cost4 == ref4 and abs(cost8 - ref8) < 1e-9
    assert all(not g[c] for c in path) and cost8 < steps          # diagonal moves shorten the path

def test_random_maps():
    rng = np.random.default_rng(3); n = 0
    for _ in range(20):
        g = rng.random((15, 15)) < 0.25; g[0, 0] = g[14, 14] = False
        c = dijkstra(g, (0, 0), (14, 14))[0]; r = all_pairs_reference(g, (0, 0), 8)[-1]
        if c is None: assert np.isinf(r); continue
        assert abs(c - r) < 1e-9; n += 1
    print(f"20 random 15 x 15 maps: Dijkstra matches the reference on all {n} solvable ones and reports the rest unreachable")

def test_empty_grid():
    g = np.zeros((10, 10), bool)
    print(f"empty grid (0,0) to (3,5): BFS {bfs(g, (0, 0), (3, 5))[0]} steps, 8-connected cost {dijkstra(g, (0, 0), (3, 5))[0]:.4f} = 3 sqrt(2) + 2")
    assert bfs(g, (0, 0), (3, 5))[0] == 8 and abs(dijkstra(g, (0, 0), (3, 5))[0] - (3 * np.sqrt(2) + 2)) < 1e-12

test_optimal_costs()
test_random_maps()
test_empty_grid()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};