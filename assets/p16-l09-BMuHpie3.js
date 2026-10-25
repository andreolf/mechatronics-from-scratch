var e=`p16-l09`,t=40,n=`Gridding C-space works for two joints but not for six, where even 10 values per joint means a million cells. A probabilistic roadmap samples random free configurations instead and joins nearby ones with collision-free straight edges. You derive why the chance of missing a path shrinks exponentially with the number of samples, implement a PRM for the arm lab’s 2-link arm among the obstacles of lesson 01, and test that it finds a safe path, succeeds more often with more samples, and finds nothing when the goal is cut off.`,r=`<h2 id="sample-connect-search">Sample, connect, search</h2>
<p>A <strong>probabilistic roadmap</strong> (PRM) works in two phases.</p>
<ol>
<li><strong>Build.</strong> Draw random configurations and keep the collision-free ones. Connect each to its <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> nearest neighbours whenever the straight segment between them in C-space is collision-free.</li>
<li><strong>Query.</strong> Add the start and goal, connect them the same way, and run Dijkstra or A* on the graph.</li>
</ol>
<p>The roadmap depends only on the obstacles, so one roadmap answers many start-goal queries: PRM is a <strong>multi-query</strong> planner.</p>
<p>On the arm’s torus, distances must use the shortest angle difference, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">179°</span></span></span></span> and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord">179°</span></span></span></span> are <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">2°</span></span></span></span> apart. An edge is checked at configurations no more than <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">2°</span></span></span></span> apart with a 5 cm margin, exactly the argument of lesson 01, which makes every accepted edge safe in the continuous workspace.</p>
<h2 id="probabilistic-completeness">Probabilistic completeness</h2>
<p>Suppose a path exists with clearance: a tube around it, of volume fraction <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span></span></span></span> in some region, that a roadmap must hit. Each uniform sample misses it with probability <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span></span></span></span>, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> samples all miss with probability</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">p</span><span class="mclose"><span class="mclose">)</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7144em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">n</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8213em;"></span><span class="mord"><span class="mord mathnormal">e</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8213em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mathnormal mtight">p</span><span class="mord mathnormal mtight">n</span></span></span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>The chance of failure falls exponentially with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span>: PRM is <strong>probabilistically complete</strong>. It is not complete in the strict sense. With a finite number of samples it can miss a narrow passage, and when it finds nothing, that does not prove there is no path.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="prm" data-args="{}"></div></div><figcaption>A roadmap growing in the arm’s C-space (red: blocked joint angles). Add samples and watch the free space fill with edges until the start and goal connect. Each new seed draws a different roadmap.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The arm lab arm and the three obstacles of lesson 01, from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">0°</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">30°</span><span class="mclose">)</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">120°</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">−</span><span class="mord">30°</span><span class="mclose">)</span></span></span></span>.</p>
<ol>
<li>300 samples, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span></span></span></span>: 1746 collision-free edges. The path has 10 nodes and 270° of joint motion; checked densely in the workspace, its smallest clearance is 8.2 cm.</li>
<li>Over 20 random roadmaps, the fraction that finds a path: 0.80 with 20 samples, 0.95 with 50, and 1.00 with 100 and 200.</li>
<li>A goal at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">170°</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0°</span><span class="mclose">)</span></span></span></span> is free but in a pocket of C-space cut off from the start. An independent flood fill of a 1° grid from the start covers 43.8 % of C-space and never reaches it. A 400-sample roadmap with 2319 edges finds no path either, as it must.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">prm.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

L1, L2 = <span class="hljs-number">1.0</span>, <span class="hljs-number">0.8</span>                                            <span class="hljs-comment"># the arm lab arm and the obstacles of lesson 01</span>
OBST = np.array([(<span class="hljs-number">1.1</span>, <span class="hljs-number">0.9</span>, <span class="hljs-number">0.25</span>), (-<span class="hljs-number">0.9</span>, <span class="hljs-number">0.8</span>, <span class="hljs-number">0.3</span>), (<span class="hljs-number">0.2</span>, -<span class="hljs-number">1.2</span>, <span class="hljs-number">0.3</span>)])
MARGIN, RES = <span class="hljs-number">0.05</span>, np.radians(<span class="hljs-number">2</span>)                            <span class="hljs-comment"># as in lesson 01: 2 degree checks are safe with a 5 cm margin</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">clearance</span>(<span class="hljs-params">Q</span>):
    <span class="hljs-string">&quot;&quot;&quot;clearance of many configurations at once (rows of Q are (q1, q2)); negative = collision&quot;&quot;&quot;</span>
    Q = np.atleast_2d(Q); e = np.stack([L1 * np.cos(Q[:, <span class="hljs-number">0</span>]), L1 * np.sin(Q[:, <span class="hljs-number">0</span>])], <span class="hljs-number">1</span>)
    t = e + np.stack([L2 * np.cos(Q.<span class="hljs-built_in">sum</span>(<span class="hljs-number">1</span>)), L2 * np.sin(Q.<span class="hljs-built_in">sum</span>(<span class="hljs-number">1</span>))], <span class="hljs-number">1</span>)
    best = np.full(<span class="hljs-built_in">len</span>(Q), np.inf)
    <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> ((np.zeros_like(e), e), (e, t)):
        ab = b - a
        <span class="hljs-keyword">for</span> cx, cy, r <span class="hljs-keyword">in</span> OBST:
            p = np.array([cx, cy]); u = np.clip(np.<span class="hljs-built_in">sum</span>((p - a) * ab, <span class="hljs-number">1</span>) / np.<span class="hljs-built_in">sum</span>(ab * ab, <span class="hljs-number">1</span>), <span class="hljs-number">0</span>, <span class="hljs-number">1</span>)
            best = np.minimum(best, np.linalg.norm(a + u[:, <span class="hljs-literal">None</span>] * ab - p, axis=<span class="hljs-number">1</span>) - r)
    <span class="hljs-keyword">return</span> best

<span class="hljs-keyword">def</span> <span class="hljs-title function_">wrap</span>(<span class="hljs-params">d</span>): <span class="hljs-keyword">return</span> (d + np.pi) % (<span class="hljs-number">2</span> * np.pi) - np.pi        <span class="hljs-comment"># shortest signed angle difference</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">edge_free</span>(<span class="hljs-params">a, b</span>):
    d = wrap(b - a); n = <span class="hljs-built_in">max</span>(<span class="hljs-number">1</span>, <span class="hljs-built_in">int</span>(np.ceil(np.<span class="hljs-built_in">abs</span>(d).<span class="hljs-built_in">max</span>() / RES)))
    <span class="hljs-keyword">return</span> clearance(a + np.outer(np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, n + <span class="hljs-number">1</span>), d)).<span class="hljs-built_in">min</span>() &gt;= MARGIN

<span class="hljs-keyword">def</span> <span class="hljs-title function_">prm</span>(<span class="hljs-params">start, goal, n=<span class="hljs-number">300</span>, k=<span class="hljs-number">10</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;sample free configurations on the torus, connect each to its k nearest with collision-free edges, search the graph&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); S = []
    <span class="hljs-keyword">while</span> <span class="hljs-built_in">len</span>(S) &lt; n:
        q = rng.uniform(-np.pi, np.pi, (n, <span class="hljs-number">2</span>)); S.extend(q[clearance(q) &gt;= MARGIN])
    V = np.array([start, goal] + S[:n]); adj = {i: [] <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(V))}; edges = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(V)):
        dist = np.linalg.norm(wrap(V - V[i]), axis=<span class="hljs-number">1</span>)
        <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> np.argsort(dist)[<span class="hljs-number">1</span>:k + <span class="hljs-number">1</span>]:
            <span class="hljs-keyword">if</span> j <span class="hljs-keyword">in</span> (e <span class="hljs-keyword">for</span> e, _ <span class="hljs-keyword">in</span> adj[i]): <span class="hljs-keyword">continue</span>
            <span class="hljs-keyword">if</span> edge_free(V[i], V[j]): adj[i].append((j, dist[j])); adj[j].append((i, dist[j])); edges += <span class="hljs-number">1</span>
    cost = {<span class="hljs-number">0</span>: <span class="hljs-number">0.0</span>}; prev = {<span class="hljs-number">0</span>: <span class="hljs-literal">None</span>}; pq = [(<span class="hljs-number">0.0</span>, <span class="hljs-number">0</span>)]; done = <span class="hljs-built_in">set</span>()        <span class="hljs-comment"># Dijkstra on the roadmap</span>
    <span class="hljs-keyword">while</span> pq:
        d, i = heapq.heappop(pq)
        <span class="hljs-keyword">if</span> i <span class="hljs-keyword">in</span> done: <span class="hljs-keyword">continue</span>
        done.add(i)
        <span class="hljs-keyword">for</span> j, w <span class="hljs-keyword">in</span> adj[i]:
            <span class="hljs-keyword">if</span> d + w &lt; cost.get(j, np.inf): cost[j] = d + w; prev[j] = i; heapq.heappush(pq, (d + w, j))
    <span class="hljs-keyword">if</span> <span class="hljs-number">1</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> cost: <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>, edges
    path = [<span class="hljs-number">1</span>]
    <span class="hljs-keyword">while</span> prev[path[-<span class="hljs-number">1</span>]] <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>: path.append(prev[path[-<span class="hljs-number">1</span>]])
    <span class="hljs-keyword">return</span> V[path[::-<span class="hljs-number">1</span>]], edges

R = np.radians
<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_finds_safe_path</span>():
    path, edges = prm(R([<span class="hljs-number">0</span>, <span class="hljs-number">30</span>]), R([<span class="hljs-number">120</span>, -<span class="hljs-number">30</span>]))
    <span class="hljs-keyword">assert</span> path <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>
    dense = np.concatenate([a + np.outer(np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">50</span>, endpoint=<span class="hljs-literal">False</span>), wrap(b - a)) <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(path[:-<span class="hljs-number">1</span>], path[<span class="hljs-number">1</span>:])])
    length = <span class="hljs-built_in">sum</span>(np.linalg.norm(wrap(b - a)) <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(path[:-<span class="hljs-number">1</span>], path[<span class="hljs-number">1</span>:]))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;PRM, 300 samples, k = 10: <span class="hljs-subst">{edges}</span> edges; path of <span class="hljs-subst">{<span class="hljs-built_in">len</span>(path)}</span> nodes, <span class="hljs-subst">{np.degrees(length):<span class="hljs-number">.0</span>f}</span> deg of joint motion, smallest workspace clearance <span class="hljs-subst">{clearance(dense).<span class="hljs-built_in">min</span>() * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm&quot;</span>)
    <span class="hljs-keyword">assert</span> clearance(dense).<span class="hljs-built_in">min</span>() &gt; <span class="hljs-number">0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_success_grows_with_samples</span>():
    rates = {}
    <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> (<span class="hljs-number">20</span>, <span class="hljs-number">50</span>, <span class="hljs-number">100</span>, <span class="hljs-number">200</span>):
        rates[n] = np.mean([prm(R([<span class="hljs-number">0</span>, <span class="hljs-number">30</span>]), R([<span class="hljs-number">120</span>, -<span class="hljs-number">30</span>]), n=n, seed=s)[<span class="hljs-number">0</span>] <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20</span>)])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;fraction of 20 random roadmaps that find a path: &quot;</span> + <span class="hljs-string">&quot;, &quot;</span>.join(<span class="hljs-string">f&quot;<span class="hljs-subst">{n}</span> samples <span class="hljs-subst">{r:<span class="hljs-number">.2</span>f}</span>&quot;</span> <span class="hljs-keyword">for</span> n, r <span class="hljs-keyword">in</span> rates.items()))
    <span class="hljs-keyword">assert</span> rates[<span class="hljs-number">200</span>] == <span class="hljs-number">1.0</span> <span class="hljs-keyword">and</span> rates[<span class="hljs-number">20</span>] &lt; rates[<span class="hljs-number">200</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_unreachable_goal</span>():
    <span class="hljs-string">&quot;&quot;&quot;a goal in a free pocket cut off from the start: no roadmap can connect them&quot;&quot;&quot;</span>
    goal = R([<span class="hljs-number">170</span>, <span class="hljs-number">0</span>]); <span class="hljs-keyword">assert</span> clearance(goal)[<span class="hljs-number">0</span>] &gt;= MARGIN
    <span class="hljs-comment"># independent check: flood-fill the 1 degree C-space grid from the start (angles wrap) and see if the goal is reached</span>
    qs = -np.pi + <span class="hljs-number">2</span> * np.pi * np.arange(<span class="hljs-number">360</span>) / <span class="hljs-number">360</span>; G = np.stack(np.meshgrid(qs, qs, indexing=<span class="hljs-string">&#x27;ij&#x27;</span>), -<span class="hljs-number">1</span>).reshape(-<span class="hljs-number">1</span>, <span class="hljs-number">2</span>)
    free = (clearance(G) &gt;= MARGIN).reshape(<span class="hljs-number">360</span>, <span class="hljs-number">360</span>); seen = np.zeros_like(free); cell = <span class="hljs-keyword">lambda</span> q: <span class="hljs-built_in">tuple</span>(np.<span class="hljs-built_in">round</span>((q + np.pi) / (<span class="hljs-number">2</span> * np.pi) * <span class="hljs-number">360</span>).astype(<span class="hljs-built_in">int</span>) % <span class="hljs-number">360</span>)
    stack = [cell(R([<span class="hljs-number">0</span>, <span class="hljs-number">30</span>]))]; seen[stack[<span class="hljs-number">0</span>]] = <span class="hljs-literal">True</span>
    <span class="hljs-keyword">while</span> stack:
        i, j = stack.pop()
        <span class="hljs-keyword">for</span> di, dj <span class="hljs-keyword">in</span> ((<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>)):
            n = ((i + di) % <span class="hljs-number">360</span>, (j + dj) % <span class="hljs-number">360</span>)
            <span class="hljs-keyword">if</span> free[n] <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> seen[n]: seen[n] = <span class="hljs-literal">True</span>; stack.append(n)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;flood fill from the start reaches <span class="hljs-subst">{seen.mean() * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> % of C-space; the goal cell reached: <span class="hljs-subst">{<span class="hljs-built_in">bool</span>(seen[cell(goal)])}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-keyword">not</span> seen[cell(goal)]
    path, edges = prm(R([<span class="hljs-number">0</span>, <span class="hljs-number">30</span>]), goal, n=<span class="hljs-number">400</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;goal (170, 0) deg sits in a separate free region: <span class="hljs-subst">{edges}</span> edges, path found: <span class="hljs-subst">{path <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> path <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>

test_finds_safe_path()
test_success_grows_with_samples()
test_unreachable_goal()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>OMPL provides PRM and its relatives (PRM*, lazy PRM), and MoveIt uses OMPL to plan for real arms. Lazy PRM postpones the edge collision checks until an edge lands on a candidate path, because edge checks dominate the run time.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A narrow passage takes up 0.1 % of C-space. How many samples give a 99 % chance of putting at least one in it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Need <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.001</span><span class="mclose"><span class="mclose">)</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6644em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">n</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.01</span></span></span></span>, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7719em;vertical-align:-0.136em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≥</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0.01/</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0.999</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4603</span></span></span></span>. Narrow passages are PRM’s weakness; samplers that bias towards obstacle boundaries or bridges help.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why connect to the <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> nearest neighbours instead of to every node within a fixed radius?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A fixed radius gives many edges where samples are dense and none where they are sparse, and the edge count grows quadratically with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span>. <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> nearest bounds the work at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mord mathnormal">n</span></span></span></span> edge checks. PRM* grows <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> like <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mop">lo<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span></span></span></span> to keep asymptotic optimality.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p16-l09"></div>
`,i=[{id:`sample-connect-search`,title:`Sample, connect, search`},{id:`probabilistic-completeness`,title:`Probabilistic completeness`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p16-l09-q1`,type:`num`,q:`<p>Probability that 500 uniform samples all miss a region of 1 % of C-space?</p>
`,explain:`<p>(1 − p)ⁿ.</p>
`,answer:.00657,tol:.005,unit:``},{id:`p16-l09-q2`,type:`num`,q:`<p>Collision checks along an edge spanning 30° of joint motion at 2° resolution, counting both ends?</p>
`,explain:`<p>15 steps, 16 configurations.</p>
`,answer:16,tol:.001,unit:``},{id:`p16-l09-q3`,type:`num`,q:`<p>Grid cells needed for a 6-joint arm at 10 values per joint?</p>
`,explain:`<p>The curse of dimensionality.</p>
`,answer:1e6,tol:.001,unit:``},{id:`p16-l09-q4`,type:`num`,q:`<p>Shortest angle difference between 175° and −175°?</p>
`,explain:`<p>The torus wraps round.</p>
`,answer:10,tol:.001,unit:`°`},{id:`p16-l09-q5`,type:`mc`,q:`<p>PRM is called multi-query because…</p>
`,explain:`<p>The roadmap depends on the obstacles, not on the query.</p>
`,options:[`it samples many times`,`one roadmap answers many start and goal pairs`,`it runs several searches in parallel`,`it needs many queries to the collision checker`],answer:1},{id:`p16-l09-q6`,type:`mc`,q:`<p>If a PRM finds no path, you know that…</p>
`,explain:`<p>Probabilistic completeness only bounds the chance of missing a path.</p>
`,options:[`k was too small`,`there is no path`,`the goal is in collision`,`none was found with these samples, which does not prove there is none`],answer:3}],o=[{file:`prm.py`,lang:`python`,src:`import heapq
import numpy as np

L1, L2 = 1.0, 0.8                                            # the arm lab arm and the obstacles of lesson 01
OBST = np.array([(1.1, 0.9, 0.25), (-0.9, 0.8, 0.3), (0.2, -1.2, 0.3)])
MARGIN, RES = 0.05, np.radians(2)                            # as in lesson 01: 2 degree checks are safe with a 5 cm margin

def clearance(Q):
    """clearance of many configurations at once (rows of Q are (q1, q2)); negative = collision"""
    Q = np.atleast_2d(Q); e = np.stack([L1 * np.cos(Q[:, 0]), L1 * np.sin(Q[:, 0])], 1)
    t = e + np.stack([L2 * np.cos(Q.sum(1)), L2 * np.sin(Q.sum(1))], 1)
    best = np.full(len(Q), np.inf)
    for a, b in ((np.zeros_like(e), e), (e, t)):
        ab = b - a
        for cx, cy, r in OBST:
            p = np.array([cx, cy]); u = np.clip(np.sum((p - a) * ab, 1) / np.sum(ab * ab, 1), 0, 1)
            best = np.minimum(best, np.linalg.norm(a + u[:, None] * ab - p, axis=1) - r)
    return best

def wrap(d): return (d + np.pi) % (2 * np.pi) - np.pi        # shortest signed angle difference

def edge_free(a, b):
    d = wrap(b - a); n = max(1, int(np.ceil(np.abs(d).max() / RES)))
    return clearance(a + np.outer(np.linspace(0, 1, n + 1), d)).min() >= MARGIN

def prm(start, goal, n=300, k=10, seed=0):
    """sample free configurations on the torus, connect each to its k nearest with collision-free edges, search the graph"""
    rng = np.random.default_rng(seed); S = []
    while len(S) < n:
        q = rng.uniform(-np.pi, np.pi, (n, 2)); S.extend(q[clearance(q) >= MARGIN])
    V = np.array([start, goal] + S[:n]); adj = {i: [] for i in range(len(V))}; edges = 0
    for i in range(len(V)):
        dist = np.linalg.norm(wrap(V - V[i]), axis=1)
        for j in np.argsort(dist)[1:k + 1]:
            if j in (e for e, _ in adj[i]): continue
            if edge_free(V[i], V[j]): adj[i].append((j, dist[j])); adj[j].append((i, dist[j])); edges += 1
    cost = {0: 0.0}; prev = {0: None}; pq = [(0.0, 0)]; done = set()        # Dijkstra on the roadmap
    while pq:
        d, i = heapq.heappop(pq)
        if i in done: continue
        done.add(i)
        for j, w in adj[i]:
            if d + w < cost.get(j, np.inf): cost[j] = d + w; prev[j] = i; heapq.heappush(pq, (d + w, j))
    if 1 not in cost: return None, edges
    path = [1]
    while prev[path[-1]] is not None: path.append(prev[path[-1]])
    return V[path[::-1]], edges

R = np.radians
def test_finds_safe_path():
    path, edges = prm(R([0, 30]), R([120, -30]))
    assert path is not None
    dense = np.concatenate([a + np.outer(np.linspace(0, 1, 50, endpoint=False), wrap(b - a)) for a, b in zip(path[:-1], path[1:])])
    length = sum(np.linalg.norm(wrap(b - a)) for a, b in zip(path[:-1], path[1:]))
    print(f"PRM, 300 samples, k = 10: {edges} edges; path of {len(path)} nodes, {np.degrees(length):.0f} deg of joint motion, smallest workspace clearance {clearance(dense).min() * 100:.1f} cm")
    assert clearance(dense).min() > 0

def test_success_grows_with_samples():
    rates = {}
    for n in (20, 50, 100, 200):
        rates[n] = np.mean([prm(R([0, 30]), R([120, -30]), n=n, seed=s)[0] is not None for s in range(20)])
    print("fraction of 20 random roadmaps that find a path: " + ", ".join(f"{n} samples {r:.2f}" for n, r in rates.items()))
    assert rates[200] == 1.0 and rates[20] < rates[200]

def test_unreachable_goal():
    """a goal in a free pocket cut off from the start: no roadmap can connect them"""
    goal = R([170, 0]); assert clearance(goal)[0] >= MARGIN
    # independent check: flood-fill the 1 degree C-space grid from the start (angles wrap) and see if the goal is reached
    qs = -np.pi + 2 * np.pi * np.arange(360) / 360; G = np.stack(np.meshgrid(qs, qs, indexing='ij'), -1).reshape(-1, 2)
    free = (clearance(G) >= MARGIN).reshape(360, 360); seen = np.zeros_like(free); cell = lambda q: tuple(np.round((q + np.pi) / (2 * np.pi) * 360).astype(int) % 360)
    stack = [cell(R([0, 30]))]; seen[stack[0]] = True
    while stack:
        i, j = stack.pop()
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = ((i + di) % 360, (j + dj) % 360)
            if free[n] and not seen[n]: seen[n] = True; stack.append(n)
    print(f"flood fill from the start reaches {seen.mean() * 100:.1f} % of C-space; the goal cell reached: {bool(seen[cell(goal)])}")
    assert not seen[cell(goal)]
    path, edges = prm(R([0, 30]), goal, n=400)
    print(f"goal (170, 0) deg sits in a separate free region: {edges} edges, path found: {path is not None}")
    assert path is None

test_finds_safe_path()
test_success_grows_with_samples()
test_unreachable_goal()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};