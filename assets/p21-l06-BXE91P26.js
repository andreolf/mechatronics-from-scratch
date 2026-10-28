var e=`p21-l06`,t=45,n=`A cable robot is only as good as its idea of where the anchors are. You see how a few centimetres of anchor error bend a straight move into an arch and slacken lines, then recover the anchors and the zero of every line counter by least squares from the robot’s own measurements, and learn why the poses you choose matter as much as the solver.`,r=`<h2 id="what-the-robot-has-to-know">What the robot has to know</h2>
<p>Lessons 2 to 5 assumed you knew the anchor positions exactly. You never do. You drill four holes near the ceiling corners of a real room, and walls are not square, ceilings are not level and a tape measure across a 7 m room in the air is good to a centimetre on a good day. On top of that, each winch counts line relative to wherever its counter happened to start. So a calibration has to find, at minimum:</p>
<ul>
<li>12 numbers: the three coordinates of each anchor, or more exactly of the point where each line leaves its pulley or eyelet;</li>
<li>4 numbers: the offset between each line counter and the true line length.</li>
</ul>
<h2 id="what-a-small-mistake-does">What a small mistake does</h2>
<p>The robot winds each line to the length its model says, and gravity does the rest. With four lines and one point, that rest position is easy to state: the gripper hangs at the <strong>lowest</strong> point that is no further from each real anchor than its line. Usually three lines end up taut and one goes slack. That is the model in the code below, and it is the same physics you saw in Lesson 3 from the other side.</p>
<p>Command a straight line across Stringman’s 7 × 7 × 3 m example room at 1 m, from <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord">2.5</span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.5</span></span></span></span> m, and give the model each of these mistakes in turn:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>What is wrong</th>
<th>Height error</th>
<th>What you see</th>
</tr>
</thead>
<tbody><tr>
<td>Every anchor 5 cm further out than the model thinks</td>
<td>+18.5 cm in the middle, +13.7 cm at the ends</td>
<td>An arch: the gripper rides up, most in the middle</td>
</tr>
<tr>
<td>Every anchor 5 cm further in</td>
<td>−16.7 cm in the middle</td>
<td>A sag</td>
</tr>
<tr>
<td>Ceiling 5 cm higher than the model</td>
<td>+5.0 cm everywhere</td>
<td>A pure shift, harmless</td>
</tr>
<tr>
<td>One anchor 5 cm lower</td>
<td>Up to −1.8 cm, and 1.4 cm sideways</td>
<td>A kink, with lines 1 and 3 going slack in turn</td>
</tr>
</tbody></table></div>
<p>The first row is the surprise. A horizontal error of 5 cm per axis is 7.1 cm along the diagonal, which changes the length of a line by about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">7.1</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">cos</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6.6</span></span></span></span> cm. With the lines rising at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.375</span></span></span></span>, the gripper has to rise <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">6.6/0.375</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">17.5</span></span></span></span> cm to make up that much length, close to the exact 18.5 cm. Shallow lines amplify horizontal errors into vertical ones, by roughly <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1/</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">tan</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span></span></span>, and the amplification is worst exactly where the robot spends its time, in the middle of the room.</p>
<p>Neufangled’s usage guide describes the symptom from the user’s side: after a poor calibration the gantry moves “in an ascending arc, with some lines becoming slack in the process”, and the suggested test of a calibration is to drive in straight lines and watch.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="anchorcal" data-args="{}"></div></div><figcaption>Error along a commanded straight line at y = 0 for different calibration mistakes. Lime is height, blue is sideways. Try the size of the mistake and the height of the path: the arch shrinks as the path rises and the lines steepen.</figcaption></figure>
<h2 id="calibration-as-least-squares">Calibration as least squares</h2>
<p>Move the robot to a set of poses <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6389em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathbf">p</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> that you know independently, from a camera looking at a marker for example, and record what each counter says, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">m</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mord mathnormal mtight">i</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. The model for every reading is</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">m</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mord mathnormal mtight">i</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">∥</span><span class="mord"><span class="mord mathbf">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathbf">p</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">∥</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">ε</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mord mathnormal mtight">i</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>Sixteen unknowns, four equations per pose. Gauss-Newton is the same as in Lesson 2 with a bigger Jacobian: the derivative of a reading with respect to its anchor is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">−</span><span class="mopen">(</span><span class="mord"><span class="mord mathbf">p</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathbf">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mord">/</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0197em;">l</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0197em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mord mathnormal mtight">i</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, a unit vector, and with respect to its offset it is 1.</p>
<p>The solver is the easy part. The poses are the hard part, because one combination of unknowns is nearly invisible: moving an anchor along its own line and changing that line’s offset by the same amount leaves every reading almost unchanged, as long as the line keeps roughly the same direction. You break that tie by measuring from poses where the line points in very different directions. With 1 mm of noise on every reading and anchors started 5 cm from the truth, averaged over 40 simulated rooms:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Poses</th>
<th>Anchor error after calibration</th>
</tr>
</thead>
<tbody><tr>
<td>9 poses on a 4 × 4 m grid at 1.0 m</td>
<td>9.0 mm</td>
</tr>
<tr>
<td>18 poses, same grid at 0.6 and 2.0 m</td>
<td>5.3 mm</td>
</tr>
<tr>
<td>75 poses on a 6 × 6 m grid at 0.5, 1.5 and 2.5 m</td>
<td>1.6 mm</td>
</tr>
</tbody></table></div>
<p>In every case the fit’s residual is down at the 1 mm noise level. A good residual says the model can explain the data, not that the answer is right; only spread-out poses make the answer unique.</p>
<h2 id="how-stringman-does-it">How Stringman does it</h2>
<p>Stringman’s full calibration starts with paper cards on the floor, one of them marked “origin”, and the robot moves over them while its anchor cameras watch. The fit in its <code>eyelet_calibration.py</code> is a weighted least-squares problem that combines several kinds of evidence in one cost: where the two cameras see each card, agreement between the cameras, the change in line length measured by the motor encoders between gantry positions, and structural terms that say the room must be physically possible, such as the anchors standing plumb and the four pull points sharing a height. After a warm-started pass, a plausibility check compares those structural terms before and after, because, in the code’s own words, a fit can drive the total cost down by deforming the room when the data contain an error the model has no parameter for.</p>
<p>Then there is the quick calibration, a few seconds long, which tightens all lines and resets each line-length counter from what the cameras see. It fixes slightly slack lines, not wrong anchors. And on the Pilot gripper it also resets the length of the winch line from the time between recent swings, which is the pendulum of the next lesson used as a ruler.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">anchor_calibration.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np, itertools

<span class="hljs-keyword">def</span> <span class="hljs-title function_">anchors</span>(<span class="hljs-params">w=<span class="hljs-number">7.0</span>, d=<span class="hljs-number">7.0</span>, h=<span class="hljs-number">3.0</span></span>):
    <span class="hljs-keyword">return</span> np.array([[-w/<span class="hljs-number">2</span>, -d/<span class="hljs-number">2</span>, h], [w/<span class="hljs-number">2</span>, -d/<span class="hljs-number">2</span>, h], [w/<span class="hljs-number">2</span>, d/<span class="hljs-number">2</span>, h], [-w/<span class="hljs-number">2</span>, d/<span class="hljs-number">2</span>, h]])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">trilaterate</span>(<span class="hljs-params">P, r</span>):
    <span class="hljs-string">&quot;&quot;&quot;the two points at distances r from three centres P (rows); None if the spheres do not meet&quot;&quot;&quot;</span>
    ex = (P[<span class="hljs-number">1</span>] - P[<span class="hljs-number">0</span>]) / np.linalg.norm(P[<span class="hljs-number">1</span>] - P[<span class="hljs-number">0</span>])
    i = ex @ (P[<span class="hljs-number">2</span>] - P[<span class="hljs-number">0</span>]); ey = P[<span class="hljs-number">2</span>] - P[<span class="hljs-number">0</span>] - i * ex
    <span class="hljs-keyword">if</span> np.linalg.norm(ey) &lt; <span class="hljs-number">1e-12</span>: <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>
    ey /= np.linalg.norm(ey); ez = np.cross(ex, ey)
    d = np.linalg.norm(P[<span class="hljs-number">1</span>] - P[<span class="hljs-number">0</span>]); j = ey @ (P[<span class="hljs-number">2</span>] - P[<span class="hljs-number">0</span>])
    x = (r[<span class="hljs-number">0</span>]**<span class="hljs-number">2</span> - r[<span class="hljs-number">1</span>]**<span class="hljs-number">2</span> + d**<span class="hljs-number">2</span>) / (<span class="hljs-number">2</span> * d)
    y = (r[<span class="hljs-number">0</span>]**<span class="hljs-number">2</span> - r[<span class="hljs-number">2</span>]**<span class="hljs-number">2</span> + i**<span class="hljs-number">2</span> + j**<span class="hljs-number">2</span>) / (<span class="hljs-number">2</span> * j) - i / j * x
    z2 = r[<span class="hljs-number">0</span>]**<span class="hljs-number">2</span> - x**<span class="hljs-number">2</span> - y**<span class="hljs-number">2</span>
    <span class="hljs-keyword">if</span> z2 &lt; <span class="hljs-number">0</span>: <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>
    base = P[<span class="hljs-number">0</span>] + x * ex + y * ey
    <span class="hljs-keyword">return</span> base + np.sqrt(z2) * ez, base - np.sqrt(z2) * ez

<span class="hljs-keyword">def</span> <span class="hljs-title function_">hang</span>(<span class="hljs-params">A, L</span>):
    <span class="hljs-string">&quot;&quot;&quot;Where a point mass on four lines of fixed length comes to rest: the lowest point with every
    anchor distance &lt;= its line length. Some lines end up taut, the rest slack.&quot;&quot;&quot;</span>
    best, tight = <span class="hljs-literal">None</span>, <span class="hljs-literal">None</span>
    ok = <span class="hljs-keyword">lambda</span> p: np.<span class="hljs-built_in">all</span>(np.linalg.norm(A - p, axis=<span class="hljs-number">1</span>) &lt;= L + <span class="hljs-number">1e-9</span>)
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):                                       <span class="hljs-comment"># one line, hanging straight down</span>
        p = A[i] - [<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, L[i]]
        <span class="hljs-keyword">if</span> ok(p) <span class="hljs-keyword">and</span> (best <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> p[<span class="hljs-number">2</span>] &lt; best[<span class="hljs-number">2</span>]): best, tight = p, (i,)
    <span class="hljs-keyword">for</span> i, j <span class="hljs-keyword">in</span> itertools.combinations(<span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>), <span class="hljs-number">2</span>):          <span class="hljs-comment"># two lines: lowest point of their circle</span>
        c = A[j] - A[i]; dd = np.linalg.norm(c); e = c / dd
        a = (L[i]**<span class="hljs-number">2</span> - L[j]**<span class="hljs-number">2</span> + dd**<span class="hljs-number">2</span>) / (<span class="hljs-number">2</span> * dd); rho2 = L[i]**<span class="hljs-number">2</span> - a**<span class="hljs-number">2</span>
        <span class="hljs-keyword">if</span> rho2 &lt; <span class="hljs-number">0</span>: <span class="hljs-keyword">continue</span>
        ctr = A[i] + a * e
        down = np.array([<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, -<span class="hljs-number">1.0</span>]) - e * (-e[<span class="hljs-number">2</span>])           <span class="hljs-comment"># downward direction in the circle&#x27;s plane</span>
        <span class="hljs-keyword">if</span> np.linalg.norm(down) &lt; <span class="hljs-number">1e-12</span>: <span class="hljs-keyword">continue</span>
        p = ctr + np.sqrt(rho2) * down / np.linalg.norm(down)
        <span class="hljs-keyword">if</span> ok(p) <span class="hljs-keyword">and</span> (best <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> p[<span class="hljs-number">2</span>] &lt; best[<span class="hljs-number">2</span>]): best, tight = p, (i, j)
    <span class="hljs-keyword">for</span> tri <span class="hljs-keyword">in</span> itertools.combinations(<span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>), <span class="hljs-number">3</span>):           <span class="hljs-comment"># three lines: a vertex of the intersection</span>
        sol = trilaterate(A[<span class="hljs-built_in">list</span>(tri)], L[<span class="hljs-built_in">list</span>(tri)])
        <span class="hljs-keyword">if</span> sol <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-keyword">continue</span>
        p = <span class="hljs-built_in">min</span>(sol, key=<span class="hljs-keyword">lambda</span> q: q[<span class="hljs-number">2</span>])
        <span class="hljs-keyword">if</span> ok(p) <span class="hljs-keyword">and</span> (best <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> p[<span class="hljs-number">2</span>] &lt; best[<span class="hljs-number">2</span>]): best, tight = p, tri
    <span class="hljs-keyword">return</span> best, tight


<span class="hljs-comment"># 1. What a calibration mistake does to a commanded straight line at 1 m, x from -2.5 to 2.5 m</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">path_error</span>(<span class="hljs-params">A_true, A_model, z=<span class="hljs-number">1.0</span></span>):
    errs, slack = [], <span class="hljs-built_in">set</span>()
    <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> np.linspace(-<span class="hljs-number">2.5</span>, <span class="hljs-number">2.5</span>, <span class="hljs-number">51</span>):
        cmd = np.array([x, <span class="hljs-number">0.0</span>, z])
        p, tight = hang(A_true, np.linalg.norm(A_model - cmd, axis=<span class="hljs-number">1</span>))
        errs.append(p - cmd); slack |= <span class="hljs-built_in">set</span>(<span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>)) - <span class="hljs-built_in">set</span>(tight)
    <span class="hljs-keyword">return</span> np.array(errs), <span class="hljs-built_in">sorted</span>(i + <span class="hljs-number">1</span> <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> slack)

e, _ = path_error(anchors(<span class="hljs-number">7.1</span>, <span class="hljs-number">7.1</span>, <span class="hljs-number">3.0</span>), anchors())
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;anchors 5 cm further out: gripper <span class="hljs-subst">{e[<span class="hljs-number">25</span>, <span class="hljs-number">2</span>]*<span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm high in the middle, <span class="hljs-subst">{e[<span class="hljs-number">0</span>, <span class="hljs-number">2</span>]*<span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm at the ends&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(e[<span class="hljs-number">25</span>, <span class="hljs-number">2</span>] - <span class="hljs-number">0.185</span>) &lt; <span class="hljs-number">0.001</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(e[<span class="hljs-number">0</span>, <span class="hljs-number">2</span>] - <span class="hljs-number">0.137</span>) &lt; <span class="hljs-number">0.001</span>
e, _ = path_error(anchors(<span class="hljs-number">7.0</span>, <span class="hljs-number">7.0</span>, <span class="hljs-number">3.05</span>), anchors())
<span class="hljs-keyword">assert</span> np.allclose(e[:, <span class="hljs-number">2</span>], <span class="hljs-number">0.05</span>) <span class="hljs-keyword">and</span> np.allclose(e[:, :<span class="hljs-number">2</span>], <span class="hljs-number">0</span>)    <span class="hljs-comment"># a ceiling error is a pure shift</span>
A_bad = anchors(); A_bad[<span class="hljs-number">2</span>, <span class="hljs-number">2</span>] -= <span class="hljs-number">0.05</span>
e, slack = path_error(A_bad, anchors())
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;anchor 3 5 cm low: up to <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(e[:, <span class="hljs-number">2</span>]).<span class="hljs-built_in">max</span>()*<span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm down, <span class="hljs-subst">{<span class="hljs-built_in">abs</span>(e[:, <span class="hljs-number">0</span>]).<span class="hljs-built_in">max</span>()*<span class="hljs-number">100</span>:<span class="hljs-number">.1</span>f}</span> cm sideways, slack lines <span class="hljs-subst">{slack}</span>&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(<span class="hljs-built_in">abs</span>(e[:, <span class="hljs-number">2</span>]).<span class="hljs-built_in">max</span>() - <span class="hljs-number">0.0176</span>) &lt; <span class="hljs-number">0.0005</span> <span class="hljs-keyword">and</span> slack == [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>]

<span class="hljs-comment"># 2. Self-calibration: 12 anchor coordinates and 4 counter offsets from encoder readings at known poses</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">calibrate</span>(<span class="hljs-params">P, M, A0, iters=<span class="hljs-number">30</span></span>):
    x = np.concatenate([A0.ravel(), np.zeros(<span class="hljs-number">4</span>)])
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(iters):
        A, c = x[:<span class="hljs-number">12</span>].reshape(<span class="hljs-number">4</span>, <span class="hljs-number">3</span>), x[<span class="hljs-number">12</span>:]
        V = P[:, <span class="hljs-literal">None</span>] - A[<span class="hljs-literal">None</span>]
        L = np.linalg.norm(V, axis=<span class="hljs-number">2</span>)
        r = (L + c - M).ravel()
        J = np.zeros((r.size, <span class="hljs-number">16</span>))
        <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(P)):
            <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
                J[<span class="hljs-number">4</span>*k + i, <span class="hljs-number">3</span>*i:<span class="hljs-number">3</span>*i + <span class="hljs-number">3</span>] = -V[k, i] / L[k, i]
                J[<span class="hljs-number">4</span>*k + i, <span class="hljs-number">12</span> + i] = <span class="hljs-number">1.0</span>
        dx = np.linalg.lstsq(J, -r, rcond=<span class="hljs-literal">None</span>)[<span class="hljs-number">0</span>]
        x += dx
        <span class="hljs-keyword">if</span> np.linalg.norm(dx) &lt; <span class="hljs-number">1e-12</span>:
            <span class="hljs-keyword">break</span>
    <span class="hljs-keyword">return</span> x[:<span class="hljs-number">12</span>].reshape(<span class="hljs-number">4</span>, <span class="hljs-number">3</span>), x[<span class="hljs-number">12</span>:], np.sqrt(np.mean(r**<span class="hljs-number">2</span>))

g3, g5 = np.linspace(-<span class="hljs-number">2</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>), np.linspace(-<span class="hljs-number">3</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>)
pose_sets = {<span class="hljs-string">&quot;9 poses at 1.0 m&quot;</span>: np.array([[x, y, <span class="hljs-number">1.0</span>] <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> g3 <span class="hljs-keyword">for</span> y <span class="hljs-keyword">in</span> g3]),
             <span class="hljs-string">&quot;18 poses at 0.6 and 2.0 m&quot;</span>: np.array([[x, y, z] <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> g3 <span class="hljs-keyword">for</span> y <span class="hljs-keyword">in</span> g3 <span class="hljs-keyword">for</span> z <span class="hljs-keyword">in</span> (<span class="hljs-number">0.6</span>, <span class="hljs-number">2.0</span>)]),
             <span class="hljs-string">&quot;75 poses at 0.5, 1.5 and 2.5 m&quot;</span>: np.array([[x, y, z] <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> g5 <span class="hljs-keyword">for</span> y <span class="hljs-keyword">in</span> g5 <span class="hljs-keyword">for</span> z <span class="hljs-keyword">in</span> (<span class="hljs-number">0.5</span>, <span class="hljs-number">1.5</span>, <span class="hljs-number">2.5</span>)])}
mean_err = {}
<span class="hljs-keyword">for</span> name, P <span class="hljs-keyword">in</span> pose_sets.items():
    errs = []
    <span class="hljs-keyword">for</span> seed <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">40</span>):
        rng = np.random.default_rng(<span class="hljs-number">100</span> + seed)
        A_true = anchors() + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.05</span>, (<span class="hljs-number">4</span>, <span class="hljs-number">3</span>))         <span class="hljs-comment"># the real room is a few cm off the plan</span>
        c_true = rng.uniform(-<span class="hljs-number">0.5</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">4</span>)                       <span class="hljs-comment"># where each line counter happens to read zero</span>
        M = np.linalg.norm(A_true[<span class="hljs-literal">None</span>] - P[:, <span class="hljs-literal">None</span>], axis=<span class="hljs-number">2</span>) + c_true + rng.normal(<span class="hljs-number">0</span>, <span class="hljs-number">0.001</span>, (<span class="hljs-built_in">len</span>(P), <span class="hljs-number">4</span>))
        A, c, rms = calibrate(P, M, anchors())
        <span class="hljs-keyword">assert</span> rms &lt; <span class="hljs-number">0.0015</span>                                      <span class="hljs-comment"># the fit explains the data to the noise level</span>
        errs.append(np.sqrt(np.mean(np.<span class="hljs-built_in">sum</span>((A - A_true)**<span class="hljs-number">2</span>, axis=<span class="hljs-number">1</span>))))
    mean_err[name] = np.mean(errs)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: anchors recovered to <span class="hljs-subst">{mean_err[name]*<span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> mm rms from 1 mm of length noise&quot;</span>)
v = <span class="hljs-built_in">list</span>(mean_err.values())
<span class="hljs-keyword">assert</span> v[<span class="hljs-number">0</span>] &gt; v[<span class="hljs-number">1</span>] &gt; v[<span class="hljs-number">2</span>] <span class="hljs-keyword">and</span> v[<span class="hljs-number">2</span>] &lt; <span class="hljs-number">0.003</span> <span class="hljs-keyword">and</span> v[<span class="hljs-number">0</span>] &gt; <span class="hljs-number">0.006</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Start with a tape-measured guess, and make the guess honest: it is the starting point, not the answer. Choose calibration poses that are wide, near the floor and high up, and do not throw away the residual. If a calibration that used to converge to a millimetre suddenly converges to a centimetre, something physical has changed: an anchor screw has crept, a line has slipped on its spool, or a card has been kicked. Run a straight-line test after every full calibration, at two heights.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>In the first row of the table, why is the error bigger in the middle than at the ends of the path?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>In the middle all four lines are equally shallow, so each line’s length error turns into height with the full <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1/</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">tan</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span></span></span></span> amplification. Towards the ends the lines on the near side are steeper, so the same length error moves the gripper less in height.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why can’t you calibrate the counter offsets alone, assuming the anchors are where you measured them?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>You can, and quick calibration effectively does, but any anchor error is then absorbed into the offsets, which are constant. At one pose the lengths come out right, and elsewhere the error reappears because the true error in length depends on the direction of the line. That is the arch in the table.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p21-l06"></div>

<h2 id="sources">Sources</h2>
<ul>
<li>Neufangled, <a href="https://neufangled.com/docs/usage_guide/">usage guide</a> (calibration cards and origin card, the ascending-arc symptom, straight-line test, quick calibration, Pilot winch-line reset from swings, manual anchor edits in <code>configuration.json</code>).</li>
<li>Stringman firmware, Apache-2.0: <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/eyelet_calibration.py"><code>eyelet_calibration.py</code></a> at commit e1ee31d (weighted least-squares terms and the plausibility check).</li>
<li>A. Pott, <a href="https://doi.org/10.1007/978-3-319-76138-1"><em>Cable-Driven Parallel Robots: Theory and Application</em></a>, Springer, 2018 (kinematic calibration).</li>
</ul>
`,i=[{id:`what-the-robot-has-to-know`,title:`What the robot has to know`},{id:`what-a-small-mistake-does`,title:`What a small mistake does`},{id:`calibration-as-least-squares`,title:`Calibration as least squares`},{id:`how-stringman-does-it`,title:`How Stringman does it`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`},{id:`sources`,title:`Sources`}],a=[{id:`p21-l06-q1`,type:`mc`,q:`<p>A suspended four-line robot winds its lines to lengths from a model. Where does the gripper come to rest?</p>
`,explain:`<p>Gravity pulls it down until the lines stop it; usually three are taut.</p>
`,options:[`At the least-squares point`,`At the commanded point`,`At the lowest point no further from each real anchor than its line`,`Directly under the centre of the room`],answer:2},{id:`p21-l06-q2`,type:`num`,q:`<p>The lines rise at sin θ = 0.375 and a line is 6.6 cm too short. Roughly how far does the gripper rise to make up the length (cm)?</p>
`,explain:`<p>To first order, Δz = Δl / sin θ.</p>
`,answer:17.6,tol:.01,unit:``},{id:`p21-l06-q3`,type:`mc`,q:`<p>Your calibration says the ceiling is 5 cm lower than it is. What do you see?</p>
`,explain:`<p>A common height error is a pure translation.</p>
`,options:[`Slack lines everywhere`,`The whole workspace shifted up by 5 cm`,`A sideways drift`,`An arch`],answer:1},{id:`p21-l06-q4`,type:`mc`,q:`<p>Which pair of unknowns is hardest to tell apart in an anchor calibration?</p>
`,explain:`<p>Both change the reading by the same amount until the line direction changes.</p>
`,options:[`The payload and the tension limit`,`An anchor’s position along its own line and that line’s counter offset`,`Two different anchors’ heights`,`The x and y of the gripper`],answer:1},{id:`p21-l06-q5`,type:`mc`,q:`<p>What does Stringman’s quick calibration do?</p>
`,explain:`<p>It takes seconds and fixes slight slack, not anchor errors.</p>
`,options:[`Tightens the lines and resets the line-length counters from what the cameras see`,`Measures the payload`,`Re-solves all the anchor positions`,`Calibrates the camera lenses`],answer:0},{id:`p21-l06-q6`,type:`mc`,q:`<p>The calibration residual is 1 mm, the same as the measurement noise. What does that prove?</p>
`,explain:`<p>Poorly spread poses can give a small residual and a wrong answer.</p>
`,options:[`The poses were well chosen`,`The anchors are within 1 mm`,`Nothing at all`,`Only that the model can explain the data, not that the anchors are right`],answer:3}],o=[{file:`anchor_calibration.py`,lang:`python`,src:`import numpy as np, itertools

def anchors(w=7.0, d=7.0, h=3.0):
    return np.array([[-w/2, -d/2, h], [w/2, -d/2, h], [w/2, d/2, h], [-w/2, d/2, h]])

def trilaterate(P, r):
    """the two points at distances r from three centres P (rows); None if the spheres do not meet"""
    ex = (P[1] - P[0]) / np.linalg.norm(P[1] - P[0])
    i = ex @ (P[2] - P[0]); ey = P[2] - P[0] - i * ex
    if np.linalg.norm(ey) < 1e-12: return None
    ey /= np.linalg.norm(ey); ez = np.cross(ex, ey)
    d = np.linalg.norm(P[1] - P[0]); j = ey @ (P[2] - P[0])
    x = (r[0]**2 - r[1]**2 + d**2) / (2 * d)
    y = (r[0]**2 - r[2]**2 + i**2 + j**2) / (2 * j) - i / j * x
    z2 = r[0]**2 - x**2 - y**2
    if z2 < 0: return None
    base = P[0] + x * ex + y * ey
    return base + np.sqrt(z2) * ez, base - np.sqrt(z2) * ez

def hang(A, L):
    """Where a point mass on four lines of fixed length comes to rest: the lowest point with every
    anchor distance <= its line length. Some lines end up taut, the rest slack."""
    best, tight = None, None
    ok = lambda p: np.all(np.linalg.norm(A - p, axis=1) <= L + 1e-9)
    for i in range(4):                                       # one line, hanging straight down
        p = A[i] - [0, 0, L[i]]
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i,)
    for i, j in itertools.combinations(range(4), 2):          # two lines: lowest point of their circle
        c = A[j] - A[i]; dd = np.linalg.norm(c); e = c / dd
        a = (L[i]**2 - L[j]**2 + dd**2) / (2 * dd); rho2 = L[i]**2 - a**2
        if rho2 < 0: continue
        ctr = A[i] + a * e
        down = np.array([0, 0, -1.0]) - e * (-e[2])           # downward direction in the circle's plane
        if np.linalg.norm(down) < 1e-12: continue
        p = ctr + np.sqrt(rho2) * down / np.linalg.norm(down)
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i, j)
    for tri in itertools.combinations(range(4), 3):           # three lines: a vertex of the intersection
        sol = trilaterate(A[list(tri)], L[list(tri)])
        if sol is None: continue
        p = min(sol, key=lambda q: q[2])
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, tri
    return best, tight


# 1. What a calibration mistake does to a commanded straight line at 1 m, x from -2.5 to 2.5 m
def path_error(A_true, A_model, z=1.0):
    errs, slack = [], set()
    for x in np.linspace(-2.5, 2.5, 51):
        cmd = np.array([x, 0.0, z])
        p, tight = hang(A_true, np.linalg.norm(A_model - cmd, axis=1))
        errs.append(p - cmd); slack |= set(range(4)) - set(tight)
    return np.array(errs), sorted(i + 1 for i in slack)

e, _ = path_error(anchors(7.1, 7.1, 3.0), anchors())
print(f"anchors 5 cm further out: gripper {e[25, 2]*100:.1f} cm high in the middle, {e[0, 2]*100:.1f} cm at the ends")
assert abs(e[25, 2] - 0.185) < 0.001 and abs(e[0, 2] - 0.137) < 0.001
e, _ = path_error(anchors(7.0, 7.0, 3.05), anchors())
assert np.allclose(e[:, 2], 0.05) and np.allclose(e[:, :2], 0)    # a ceiling error is a pure shift
A_bad = anchors(); A_bad[2, 2] -= 0.05
e, slack = path_error(A_bad, anchors())
print(f"anchor 3 5 cm low: up to {abs(e[:, 2]).max()*100:.1f} cm down, {abs(e[:, 0]).max()*100:.1f} cm sideways, slack lines {slack}")
assert abs(abs(e[:, 2]).max() - 0.0176) < 0.0005 and slack == [1, 3]

# 2. Self-calibration: 12 anchor coordinates and 4 counter offsets from encoder readings at known poses
def calibrate(P, M, A0, iters=30):
    x = np.concatenate([A0.ravel(), np.zeros(4)])
    for _ in range(iters):
        A, c = x[:12].reshape(4, 3), x[12:]
        V = P[:, None] - A[None]
        L = np.linalg.norm(V, axis=2)
        r = (L + c - M).ravel()
        J = np.zeros((r.size, 16))
        for k in range(len(P)):
            for i in range(4):
                J[4*k + i, 3*i:3*i + 3] = -V[k, i] / L[k, i]
                J[4*k + i, 12 + i] = 1.0
        dx = np.linalg.lstsq(J, -r, rcond=None)[0]
        x += dx
        if np.linalg.norm(dx) < 1e-12:
            break
    return x[:12].reshape(4, 3), x[12:], np.sqrt(np.mean(r**2))

g3, g5 = np.linspace(-2, 2, 3), np.linspace(-3, 3, 5)
pose_sets = {"9 poses at 1.0 m": np.array([[x, y, 1.0] for x in g3 for y in g3]),
             "18 poses at 0.6 and 2.0 m": np.array([[x, y, z] for x in g3 for y in g3 for z in (0.6, 2.0)]),
             "75 poses at 0.5, 1.5 and 2.5 m": np.array([[x, y, z] for x in g5 for y in g5 for z in (0.5, 1.5, 2.5)])}
mean_err = {}
for name, P in pose_sets.items():
    errs = []
    for seed in range(40):
        rng = np.random.default_rng(100 + seed)
        A_true = anchors() + rng.normal(0, 0.05, (4, 3))         # the real room is a few cm off the plan
        c_true = rng.uniform(-0.5, 0.5, 4)                       # where each line counter happens to read zero
        M = np.linalg.norm(A_true[None] - P[:, None], axis=2) + c_true + rng.normal(0, 0.001, (len(P), 4))
        A, c, rms = calibrate(P, M, anchors())
        assert rms < 0.0015                                      # the fit explains the data to the noise level
        errs.append(np.sqrt(np.mean(np.sum((A - A_true)**2, axis=1))))
    mean_err[name] = np.mean(errs)
    print(f"{name}: anchors recovered to {mean_err[name]*1000:.1f} mm rms from 1 mm of length noise")
v = list(mean_err.values())
assert v[0] > v[1] > v[2] and v[2] < 0.003 and v[0] > 0.006
print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};