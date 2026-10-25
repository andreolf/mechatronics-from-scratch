var e=`p16-l07`,t=35,n=`Dijkstra spreads evenly in every direction, even away from the goal. A* adds an estimate of the remaining cost so the search leans towards the goal, and it still returns the optimal path as long as the estimate never overestimates. You derive why an admissible heuristic preserves optimality, implement A* with the octile heuristic, and test that it matches Dijkstra’s cost on the lesson 06 map and on random maps while expanding far fewer cells.`,r=`<h2 id="cost-so-far-plus-cost-to-go">Cost so far plus cost to go</h2>
<p>A* orders its priority queue by</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mpunct">,</span></span></span></span></span></div>
<p>where <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span> is the cost from the start (as in Dijkstra) and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span> is a <strong>heuristic</strong> estimate of the cost from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> to the goal. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">h</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>, A* is Dijkstra.</p>
<p>On an 8-connected grid with no obstacles, the exact cost from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mclose">)</span></span></span></span> to the goal is the <strong>octile distance</strong>:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">h</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop">max</span><span class="mopen">(</span><span class="mord">Δ</span><span class="mord mathnormal">x</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">Δ</span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.2061em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9561em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;">2</span></span><span style="top:-2.9161em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
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
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.0839em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">min</span><span class="mopen">(</span><span class="mord">Δ</span><span class="mord mathnormal">x</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">Δ</span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>Obstacles can only make the true cost larger, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">h</span></span></span></span> never overestimates. On a 4-connected grid, the Manhattan distance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord">Δ</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">Δ</span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span></span></span></span> plays the same role.</p>
<h2 id="why-admissible-means-optimal">Why admissible means optimal</h2>
<p>A heuristic is <strong>admissible</strong> if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">h</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span></span></span></span>, the true remaining cost, for every <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span>. Suppose A* is about to finish with a suboptimal goal cost <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&gt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6887em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span></span></span></span>. Some cell <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> on an optimal path is still in the queue, with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">h</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6887em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span></span></span></span>. Since <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0391em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mopen">(</span><span class="mord mathnormal">t</span><span class="mclose">)</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> would come out first. So A* can’t finish with a worse path.</p>
<p>A stronger property, <strong>consistency</strong>, requires <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">a</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mopen">(</span><span class="mord mathnormal">a</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">b</span><span class="mclose">)</span></span></span></span> for every edge. Then <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span></span></span></span> never decreases along a path, and every expanded cell is already final, as in Dijkstra. The octile distance is consistent.</p>
<p>Inflating the heuristic, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">h</span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5782em;vertical-align:-0.0391em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&gt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>, is <strong>weighted A</strong>*. It expands fewer cells but gives up optimality; the cost is at most <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span></span></span></span> times the optimum.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="astar" data-args="{}"></div></div><figcaption>Cells expanded by Dijkstra, A* and weighted A* on the same map. All find a path; compare the number of cells each had to expand and the cost it paid.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The 40 × 30 building map from lesson 06, from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">2</span><span class="mclose">)</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">27</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">37</span><span class="mclose">)</span></span></span></span>:</p>
<ol>
<li>Dijkstra: cost 47.70, after expanding 975 cells.</li>
<li>A* with the octile heuristic: the same cost 47.70, after expanding 309 cells, 32 % of Dijkstra’s work.</li>
<li>Weighted A* with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3</span></span></span></span>: 40 cells expanded. Here its path happens to be optimal too.</li>
<li>On 40 random 30 × 30 maps with 30 % of cells blocked, A* matched Dijkstra’s cost on all 19 solvable maps and never expanded more cells. Weighted A* was up to 18.1 % longer.</li>
<li>Over every edge of the map, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">a</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mopen">(</span><span class="mord mathnormal">a</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">h</span><span class="mopen">(</span><span class="mord mathnormal">b</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">7</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">15</span></span></span></span></span></span></span></span></span></span></span></span>: consistent up to rounding.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">astar.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_map</span>(<span class="hljs-params">w=<span class="hljs-number">40</span>, h=<span class="hljs-number">30</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;the illustrative building map of lesson 06 (True = blocked)&quot;&quot;&quot;</span>
    g = np.zeros((h, w), <span class="hljs-built_in">bool</span>)
    g[<span class="hljs-number">5</span>:<span class="hljs-number">25</span>, <span class="hljs-number">12</span>] = <span class="hljs-literal">True</span>; g[<span class="hljs-number">14</span>:<span class="hljs-number">16</span>, <span class="hljs-number">12</span>] = <span class="hljs-literal">False</span>
    g[<span class="hljs-number">0</span>:<span class="hljs-number">20</span>, <span class="hljs-number">24</span>] = <span class="hljs-literal">True</span>
    g[<span class="hljs-number">22</span>, <span class="hljs-number">18</span>:<span class="hljs-number">36</span>] = <span class="hljs-literal">True</span>; g[<span class="hljs-number">22</span>, <span class="hljs-number">30</span>:<span class="hljs-number">32</span>] = <span class="hljs-literal">False</span>
    g[<span class="hljs-number">8</span>:<span class="hljs-number">12</span>, <span class="hljs-number">30</span>:<span class="hljs-number">38</span>] = <span class="hljs-literal">True</span>
    <span class="hljs-keyword">return</span> g

N8 = [(<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>), (<span class="hljs-number">1</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>), (-<span class="hljs-number">1</span>, <span class="hljs-number">1</span>), (-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>)]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">neighbours</span>(<span class="hljs-params">g, c</span>):
    r, k = c
    <span class="hljs-keyword">for</span> dr, dk <span class="hljs-keyword">in</span> N8:
        n = (r + dr, k + dk)
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> (<span class="hljs-number">0</span> &lt;= n[<span class="hljs-number">0</span>] &lt; g.shape[<span class="hljs-number">0</span>] <span class="hljs-keyword">and</span> <span class="hljs-number">0</span> &lt;= n[<span class="hljs-number">1</span>] &lt; g.shape[<span class="hljs-number">1</span>]) <span class="hljs-keyword">or</span> g[n]: <span class="hljs-keyword">continue</span>
        <span class="hljs-keyword">if</span> dr <span class="hljs-keyword">and</span> dk <span class="hljs-keyword">and</span> (g[r + dr, k] <span class="hljs-keyword">or</span> g[r, k + dk]): <span class="hljs-keyword">continue</span>
        <span class="hljs-keyword">yield</span> n, (np.sqrt(<span class="hljs-number">2</span>) <span class="hljs-keyword">if</span> dr <span class="hljs-keyword">and</span> dk <span class="hljs-keyword">else</span> <span class="hljs-number">1.0</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">octile</span>(<span class="hljs-params">a, b</span>):
    <span class="hljs-string">&quot;&quot;&quot;exact cost on an empty 8-connected grid: an admissible and consistent heuristic&quot;&quot;&quot;</span>
    dx, dy = <span class="hljs-built_in">abs</span>(a[<span class="hljs-number">0</span>] - b[<span class="hljs-number">0</span>]), <span class="hljs-built_in">abs</span>(a[<span class="hljs-number">1</span>] - b[<span class="hljs-number">1</span>])
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">max</span>(dx, dy) + (np.sqrt(<span class="hljs-number">2</span>) - <span class="hljs-number">1</span>) * <span class="hljs-built_in">min</span>(dx, dy)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">astar</span>(<span class="hljs-params">g, s, t, h=octile, w=<span class="hljs-number">1.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;A*: expand by f = g + w h. w = 1 and h = 0 is Dijkstra; w &gt; 1 is weighted A*&quot;&quot;&quot;</span>
    cost = {s: <span class="hljs-number">0.0</span>}; prev = {s: <span class="hljs-literal">None</span>}; pq = [(w * h(s, t), <span class="hljs-number">0.0</span>, s)]; done = <span class="hljs-built_in">set</span>()
    <span class="hljs-keyword">while</span> pq:
        f, d, c = heapq.heappop(pq)
        <span class="hljs-keyword">if</span> c <span class="hljs-keyword">in</span> done: <span class="hljs-keyword">continue</span>
        done.add(c)
        <span class="hljs-keyword">if</span> c == t: <span class="hljs-keyword">break</span>
        <span class="hljs-keyword">for</span> n, step <span class="hljs-keyword">in</span> neighbours(g, c):
            <span class="hljs-keyword">if</span> d + step &lt; cost.get(n, np.inf) - <span class="hljs-number">1e-12</span>:
                cost[n] = d + step; prev[n] = c; heapq.heappush(pq, (d + step + w * h(n, t), d + step, n))
    <span class="hljs-keyword">if</span> t <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> cost: <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>, <span class="hljs-built_in">len</span>(done)
    path = [t]
    <span class="hljs-keyword">while</span> prev[path[-<span class="hljs-number">1</span>]] <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>: path.append(prev[path[-<span class="hljs-number">1</span>]])
    <span class="hljs-keyword">return</span> cost[t], path[::-<span class="hljs-number">1</span>], <span class="hljs-built_in">len</span>(done)

zero = <span class="hljs-keyword">lambda</span> a, b: <span class="hljs-number">0.0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_same_cost_fewer_expansions</span>():
    g = make_map(); s, t = (<span class="hljs-number">2</span>, <span class="hljs-number">2</span>), (<span class="hljs-number">27</span>, <span class="hljs-number">37</span>)
    cd, _, ed = astar(g, s, t, zero)
    ca, path, ea = astar(g, s, t)
    cw, _, ew = astar(g, s, t, w=<span class="hljs-number">3.0</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Dijkstra: cost <span class="hljs-subst">{cd:<span class="hljs-number">.4</span>f}</span>, <span class="hljs-subst">{ed}</span> cells expanded&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;A* (octile): cost <span class="hljs-subst">{ca:<span class="hljs-number">.4</span>f}</span>, <span class="hljs-subst">{ea}</span> cells expanded (<span class="hljs-subst">{ea / ed * <span class="hljs-number">100</span>:<span class="hljs-number">.0</span>f}</span> %)&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;weighted A* (w = 3): cost <span class="hljs-subst">{cw:<span class="hljs-number">.4</span>f}</span> (<span class="hljs-subst">{(cw / cd - <span class="hljs-number">1</span>) * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> % longer), <span class="hljs-subst">{ew}</span> cells expanded&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(ca - cd) &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> ea &lt; ed
    <span class="hljs-keyword">assert</span> cd - <span class="hljs-number">1e-9</span> &lt;= cw &lt;= <span class="hljs-number">3</span> * cd <span class="hljs-keyword">and</span> ew &lt;= ea

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_random_maps</span>():
    rng = np.random.default_rng(<span class="hljs-number">7</span>); fewer = total = <span class="hljs-number">0</span>; worst_w = <span class="hljs-number">1.0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">40</span>):
        g = rng.random((<span class="hljs-number">30</span>, <span class="hljs-number">30</span>)) &lt; <span class="hljs-number">0.3</span>; s, t = (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>), (<span class="hljs-number">29</span>, <span class="hljs-number">29</span>); g[s] = g[t] = <span class="hljs-literal">False</span>
        cd, _, ed = astar(g, s, t, zero); ca, _, ea = astar(g, s, t)
        <span class="hljs-keyword">if</span> cd <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-keyword">assert</span> ca <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>; <span class="hljs-keyword">continue</span>
        total += <span class="hljs-number">1</span>; fewer += ea &lt;= ed
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(ca - cd) &lt; <span class="hljs-number">1e-9</span>                     <span class="hljs-comment"># admissible heuristic: same optimal cost</span>
        worst_w = <span class="hljs-built_in">max</span>(worst_w, astar(g, s, t, w=<span class="hljs-number">3.0</span>)[<span class="hljs-number">0</span>] / cd)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;40 random 30 x 30 maps (30 % blocked): A* matched Dijkstra&#x27;s cost on all <span class="hljs-subst">{total}</span> solvable maps, expanding no more cells on <span class="hljs-subst">{fewer}</span>; weighted A* (w = 3) was up to <span class="hljs-subst">{(worst_w - <span class="hljs-number">1</span>) * <span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> % longer&quot;</span>)
    <span class="hljs-keyword">assert</span> fewer == total <span class="hljs-keyword">and</span> <span class="hljs-number">1</span> &lt; worst_w &lt;= <span class="hljs-number">3</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_heuristic_is_consistent</span>():
    <span class="hljs-string">&quot;&quot;&quot;h(a) &lt;= step(a, b) + h(b) for every edge: then every expanded cell is already final&quot;&quot;&quot;</span>
    g = make_map(); t = (<span class="hljs-number">27</span>, <span class="hljs-number">37</span>); worst = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(g.shape[<span class="hljs-number">0</span>]):
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(g.shape[<span class="hljs-number">1</span>]):
            <span class="hljs-keyword">if</span> g[r, k]: <span class="hljs-keyword">continue</span>
            <span class="hljs-keyword">for</span> n, step <span class="hljs-keyword">in</span> neighbours(g, (r, k)): worst = <span class="hljs-built_in">max</span>(worst, octile((r, k), t) - step - octile(n, t))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;largest h(a) - step - h(b) over all edges: <span class="hljs-subst">{worst:<span class="hljs-number">.1</span>e}</span> (&lt;= 0 up to rounding)&quot;</span>)
    <span class="hljs-keyword">assert</span> worst &lt;= <span class="hljs-number">1e-12</span>

test_same_cost_fewer_expansions()
test_random_maps()
test_heuristic_is_consistent()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Nav2’s grid planner offers both Dijkstra and A* on a costmap. When cells cost more near obstacles, the plain octile distance (which assumes the cheapest cell cost everywhere) is still admissible.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Is the Euclidean distance admissible on an 8-connected grid? Is it better or worse than octile?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Admissible: no grid path is shorter than the straight line. But it is smaller than the octile distance, which is the exact cost without obstacles, so it is less informed and A* expands more cells.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What happens if the heuristic overestimates, say <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">h</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mord">×</span></span></span></span> octile?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>That is weighted A* with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span>. The search heads for the goal more greedily and expands fewer cells, but it can commit to a worse route. Its cost is guaranteed to be at most twice the optimum.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p16-l07"></div>
`,i=[{id:`cost-so-far-plus-cost-to-go`,title:`Cost so far plus cost to go`},{id:`why-admissible-means-optimal`,title:`Why admissible means optimal`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p16-l07-q1`,type:`num`,q:`<p>Octile distance from (0, 0) to (7, 3)?</p>
`,explain:`<p>max + (√2 − 1) min.</p>
`,answer:8.243,tol:.002,unit:``},{id:`p16-l07-q2`,type:`num`,q:`<p>Manhattan distance from (0, 0) to (7, 3), the 4-connected heuristic?</p>
`,explain:`<p>Δx + Δy.</p>
`,answer:10,tol:.001,unit:``},{id:`p16-l07-q3`,type:`num`,q:`<p>Worst-case cost bound for weighted A* with w = 1.5 when the optimum is 40?</p>
`,explain:`<p>At most w times optimal.</p>
`,answer:60,tol:.001,unit:``},{id:`p16-l07-q4`,type:`num`,q:`<p>Fraction of Dijkstra’s expansions A* needed on the building map?</p>
`,explain:`<p>309 of 975 cells.</p>
`,answer:.317,tol:.005,unit:``},{id:`p16-l07-q5`,type:`mc`,q:`<p>A heuristic is admissible when…</p>
`,explain:`<p>Then A* returns an optimal path.</p>
`,options:[`it never overestimates the true remaining cost`,`it is zero at the start`,`it equals the Euclidean distance`,`it never underestimates it`],answer:0},{id:`p16-l07-q6`,type:`mc`,q:`<p>A* with h = 0 is…</p>
`,explain:`<p>It orders cells by g alone.</p>
`,options:[`Dijkstra’s algorithm`,`greedy best-first search`,`depth-first search`,`breadth-first search on any grid`],answer:0}],o=[{file:`astar.py`,lang:`python`,src:`import heapq
import numpy as np

def make_map(w=40, h=30):
    """the illustrative building map of lesson 06 (True = blocked)"""
    g = np.zeros((h, w), bool)
    g[5:25, 12] = True; g[14:16, 12] = False
    g[0:20, 24] = True
    g[22, 18:36] = True; g[22, 30:32] = False
    g[8:12, 30:38] = True
    return g

N8 = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]

def neighbours(g, c):
    r, k = c
    for dr, dk in N8:
        n = (r + dr, k + dk)
        if not (0 <= n[0] < g.shape[0] and 0 <= n[1] < g.shape[1]) or g[n]: continue
        if dr and dk and (g[r + dr, k] or g[r, k + dk]): continue
        yield n, (np.sqrt(2) if dr and dk else 1.0)

def octile(a, b):
    """exact cost on an empty 8-connected grid: an admissible and consistent heuristic"""
    dx, dy = abs(a[0] - b[0]), abs(a[1] - b[1])
    return max(dx, dy) + (np.sqrt(2) - 1) * min(dx, dy)

def astar(g, s, t, h=octile, w=1.0):
    """A*: expand by f = g + w h. w = 1 and h = 0 is Dijkstra; w > 1 is weighted A*"""
    cost = {s: 0.0}; prev = {s: None}; pq = [(w * h(s, t), 0.0, s)]; done = set()
    while pq:
        f, d, c = heapq.heappop(pq)
        if c in done: continue
        done.add(c)
        if c == t: break
        for n, step in neighbours(g, c):
            if d + step < cost.get(n, np.inf) - 1e-12:
                cost[n] = d + step; prev[n] = c; heapq.heappush(pq, (d + step + w * h(n, t), d + step, n))
    if t not in cost: return None, None, len(done)
    path = [t]
    while prev[path[-1]] is not None: path.append(prev[path[-1]])
    return cost[t], path[::-1], len(done)

zero = lambda a, b: 0.0

def test_same_cost_fewer_expansions():
    g = make_map(); s, t = (2, 2), (27, 37)
    cd, _, ed = astar(g, s, t, zero)
    ca, path, ea = astar(g, s, t)
    cw, _, ew = astar(g, s, t, w=3.0)
    print(f"Dijkstra: cost {cd:.4f}, {ed} cells expanded")
    print(f"A* (octile): cost {ca:.4f}, {ea} cells expanded ({ea / ed * 100:.0f} %)")
    print(f"weighted A* (w = 3): cost {cw:.4f} ({(cw / cd - 1) * 100:.1f} % longer), {ew} cells expanded")
    assert abs(ca - cd) < 1e-9 and ea < ed
    assert cd - 1e-9 <= cw <= 3 * cd and ew <= ea

def test_random_maps():
    rng = np.random.default_rng(7); fewer = total = 0; worst_w = 1.0
    for _ in range(40):
        g = rng.random((30, 30)) < 0.3; s, t = (0, 0), (29, 29); g[s] = g[t] = False
        cd, _, ed = astar(g, s, t, zero); ca, _, ea = astar(g, s, t)
        if cd is None: assert ca is None; continue
        total += 1; fewer += ea <= ed
        assert abs(ca - cd) < 1e-9                     # admissible heuristic: same optimal cost
        worst_w = max(worst_w, astar(g, s, t, w=3.0)[0] / cd)
    print(f"40 random 30 x 30 maps (30 % blocked): A* matched Dijkstra's cost on all {total} solvable maps, expanding no more cells on {fewer}; weighted A* (w = 3) was up to {(worst_w - 1) * 100:.1f} % longer")
    assert fewer == total and 1 < worst_w <= 3

def test_heuristic_is_consistent():
    """h(a) <= step(a, b) + h(b) for every edge: then every expanded cell is already final"""
    g = make_map(); t = (27, 37); worst = 0.0
    for r in range(g.shape[0]):
        for k in range(g.shape[1]):
            if g[r, k]: continue
            for n, step in neighbours(g, (r, k)): worst = max(worst, octile((r, k), t) - step - octile(n, t))
    print(f"largest h(a) - step - h(b) over all edges: {worst:.1e} (<= 0 up to rounding)")
    assert worst <= 1e-12

test_same_cost_fewer_expansions()
test_random_maps()
test_heuristic_is_consistent()
print("PASS")`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};