var e=`p15-l17`,t=40,n=`A walking robot stays upright in a slow, static gait by keeping its centre of mass over the polygon formed by the feet on the ground. You derive the support polygon and the stability margin, work out why a crawl gait needs each foot down for more than three quarters of the cycle, simulate a generic quadruped’s crawl kinematically with and without a sideways body sway, and test that the centre of mass never leaves the support polygon.`,r=`<h2 id="static-stability">Static stability</h2>
<p>Walk slowly enough that the dynamics don’t matter. The robot is statically stable when the vertical projection of its centre of mass (CoM) lies inside the <strong>support polygon</strong>, the convex hull of the feet in contact. The <strong>stability margin</strong> is the distance from the CoM projection to the nearest edge: positive inside, negative outside. A margin of zero means the robot is balanced on a line and the smallest push tips it over.</p>
<p>Three feet are needed for a polygon with area, so a static walker lifts one leg at a time.</p>
<h2 id="gaits">Gaits</h2>
<p>A gait is the pattern of which feet are down when. Two numbers describe each leg:</p>
<ul>
<li>the <strong>duty factor</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span></span></span></span>, the fraction of the cycle the foot is on the ground;</li>
<li>the <strong>phase</strong>, when in the cycle its swing starts.</li>
</ul>
<p>The quadruped <strong>crawl</strong> swings the legs in the order left hind, left front, right hind, right front, a quarter cycle apart. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.75</span></span></span></span> exactly one leg swings at a time and the switch from one support triangle to the next is instantaneous. When the left front lands and the right hind lifts, the triangles before and after share only the diagonal between left hind and right front. The CoM must be in both triangles, so on that diagonal: the margin is zero. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&gt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.75</span></span></span></span> there are short four-foot phases between swings, and the body can move its CoM across into the next triangle before the next leg lifts.</p>
<h2 id="leaning-into-the-support">Leaning into the support</h2>
<p>While a left leg swings the support triangle is on the right, and vice versa. So the body sways sideways: towards the right during the two left swings, then across during a four-foot phase, then towards the left. Real quadrupeds combine sway with fore-aft shifts, and the dynamic gaits (trot, pace, gallop) give up static stability altogether in exchange for speed, balancing like a running animal.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="crawlgait" data-args="{}"></div></div><figcaption>A generic quadruped in a crawl gait seen from above. The shaded polygon joins the feet on the ground and the dot is the centre of mass. Scrub through the cycle, change the duty factor and switch the body sway on and off to watch the stability margin.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative quadruped (hips at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">±</span><span class="mord">0.30</span></span></span></span> m fore-aft and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">±</span><span class="mord">0.20</span></span></span></span> m sideways), with a 2 s cycle and 0.20 m steps (0.1 m/s), walking a crawl:</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.75</span></span></span></span>, no sway: the worst margin is 0.0 mm. The CoM touches the diagonal at every leg change.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.85</span></span></span></span>, no sway: 5.9 mm. Positive but tiny: a small push or a rock underfoot would tip it.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0528em;">β</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.85</span></span></span></span> with a 4 cm sideways sway: 38.2 mm worst case, 96 mm on average. Never fewer than three feet down, and the CoM stays well inside.</li>
</ol>
<p>Legged robots are a field where Switzerland is strong. ETH Zurich’s legged-robotics research led to the quadrupeds that the Zurich company ANYbotics now builds for industrial inspection. The robot in this lesson is generic, not a model of any of them.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">crawl_gait.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-comment"># an illustrative quadruped, not a model of any particular robot (m)</span>
HIPS = {<span class="hljs-string">&quot;LF&quot;</span>: (<span class="hljs-number">0.30</span>, <span class="hljs-number">0.20</span>), <span class="hljs-string">&quot;RF&quot;</span>: (<span class="hljs-number">0.30</span>, -<span class="hljs-number">0.20</span>), <span class="hljs-string">&quot;LH&quot;</span>: (-<span class="hljs-number">0.30</span>, <span class="hljs-number">0.20</span>), <span class="hljs-string">&quot;RH&quot;</span>: (-<span class="hljs-number">0.30</span>, -<span class="hljs-number">0.20</span>)}
ORDER = [<span class="hljs-string">&quot;LH&quot;</span>, <span class="hljs-string">&quot;LF&quot;</span>, <span class="hljs-string">&quot;RH&quot;</span>, <span class="hljs-string">&quot;RF&quot;</span>]           <span class="hljs-comment"># the crawl sequence: one leg at a time, a quarter cycle apart</span>
CYCLE, STEP = <span class="hljs-number">2.0</span>, <span class="hljs-number">0.20</span>                    <span class="hljs-comment"># s, m: body speed STEP / CYCLE = 0.1 m/s</span>
DUTY = <span class="hljs-number">0.85</span>                                <span class="hljs-comment"># fraction of the cycle each foot is on the ground</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">swing_window</span>(<span class="hljs-params">leg, duty=<span class="hljs-literal">None</span></span>):
    k = ORDER.index(leg); <span class="hljs-keyword">return</span> k / <span class="hljs-number">4</span>, k / <span class="hljs-number">4</span> + (<span class="hljs-number">1</span> - (DUTY <span class="hljs-keyword">if</span> duty <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">else</span> duty))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">feet_at</span>(<span class="hljs-params">t</span>):
    <span class="hljs-string">&quot;&quot;&quot;planted foot positions (x, y) at time t; a foot in swing is left out.
    The body moves at STEP / CYCLE; each foot lands DUTY/2 of a step ahead of its hip and lifts DUTY/2 behind it.&quot;&quot;&quot;</span>
    ph = (t / CYCLE) % <span class="hljs-number">1.0</span>; feet = {}
    <span class="hljs-keyword">for</span> leg, (hx, hy) <span class="hljs-keyword">in</span> HIPS.items():
        a, b = swing_window(leg)
        <span class="hljs-keyword">if</span> a &lt;= ph &lt; b: <span class="hljs-keyword">continue</span>
        t_down = CYCLE * (np.floor(t / CYCLE - b) + b)                  <span class="hljs-comment"># the last touchdown</span>
        feet[leg] = (hx + STEP * t_down / CYCLE + DUTY / <span class="hljs-number">2</span> * STEP, hy)
    <span class="hljs-keyword">return</span> feet

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sway_profile</span>(<span class="hljs-params">ph</span>):
    <span class="hljs-string">&quot;&quot;&quot;-1 (lean right) while the left legs swing, +1 while the right legs swing, ramping in the four-foot phases&quot;&quot;&quot;</span>
    a = <span class="hljs-number">1</span> - DUTY                                   <span class="hljs-comment"># swing length; LH and LF swing in [0, 0.25 + a)</span>
    <span class="hljs-keyword">if</span> ph &lt; <span class="hljs-number">0.25</span> + a: <span class="hljs-keyword">return</span> -<span class="hljs-number">1.0</span>
    <span class="hljs-keyword">if</span> ph &lt; <span class="hljs-number">0.5</span>: <span class="hljs-keyword">return</span> -<span class="hljs-number">1.0</span> + <span class="hljs-number">2</span> * (ph - <span class="hljs-number">0.25</span> - a) / (<span class="hljs-number">0.25</span> - a)
    <span class="hljs-keyword">if</span> ph &lt; <span class="hljs-number">0.75</span> + a: <span class="hljs-keyword">return</span> <span class="hljs-number">1.0</span>
    <span class="hljs-keyword">return</span> <span class="hljs-number">1.0</span> - <span class="hljs-number">2</span> * (ph - <span class="hljs-number">0.75</span> - a) / (<span class="hljs-number">0.25</span> - a)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">com_at</span>(<span class="hljs-params">t, sway=<span class="hljs-number">0.0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;body centre moves forward steadily, leaning sideways by \`sway\` towards the side that keeps three feet down&quot;&quot;&quot;</span>
    <span class="hljs-keyword">return</span> np.array([STEP * t / CYCLE, sway * sway_profile((t / CYCLE) % <span class="hljs-number">1.0</span>)])

<span class="hljs-keyword">def</span> <span class="hljs-title function_">polygon</span>(<span class="hljs-params">points</span>):
    <span class="hljs-string">&quot;&quot;&quot;convex hull, counter-clockwise (gift wrapping is enough for 3 or 4 feet)&quot;&quot;&quot;</span>
    pts = <span class="hljs-built_in">sorted</span>(<span class="hljs-built_in">set</span>(points)); 
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">cross</span>(<span class="hljs-params">o, a, b</span>): <span class="hljs-keyword">return</span> (a[<span class="hljs-number">0</span>] - o[<span class="hljs-number">0</span>]) * (b[<span class="hljs-number">1</span>] - o[<span class="hljs-number">1</span>]) - (a[<span class="hljs-number">1</span>] - o[<span class="hljs-number">1</span>]) * (b[<span class="hljs-number">0</span>] - o[<span class="hljs-number">0</span>])
    lower, upper = [], []
    <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> pts:
        <span class="hljs-keyword">while</span> <span class="hljs-built_in">len</span>(lower) &gt;= <span class="hljs-number">2</span> <span class="hljs-keyword">and</span> cross(lower[-<span class="hljs-number">2</span>], lower[-<span class="hljs-number">1</span>], p) &lt;= <span class="hljs-number">0</span>: lower.pop()
        lower.append(p)
    <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> <span class="hljs-built_in">reversed</span>(pts):
        <span class="hljs-keyword">while</span> <span class="hljs-built_in">len</span>(upper) &gt;= <span class="hljs-number">2</span> <span class="hljs-keyword">and</span> cross(upper[-<span class="hljs-number">2</span>], upper[-<span class="hljs-number">1</span>], p) &lt;= <span class="hljs-number">0</span>: upper.pop()
        upper.append(p)
    <span class="hljs-keyword">return</span> lower[:-<span class="hljs-number">1</span>] + upper[:-<span class="hljs-number">1</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">margin</span>(<span class="hljs-params">c, poly</span>):
    <span class="hljs-string">&quot;&quot;&quot;signed distance from c to the nearest edge: positive inside the support polygon&quot;&quot;&quot;</span>
    d = []
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(poly)):
        a, b = np.array(poly[i]), np.array(poly[(i + <span class="hljs-number">1</span>) % <span class="hljs-built_in">len</span>(poly)])
        e = b - a; n = np.array([-e[<span class="hljs-number">1</span>], e[<span class="hljs-number">0</span>]]) / np.linalg.norm(e)      <span class="hljs-comment"># inward normal for a CCW polygon</span>
        d.append(n @ (c - a))
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">min</span>(d)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">worst_margin</span>(<span class="hljs-params">sway, T=<span class="hljs-number">6.0</span>, dt=<span class="hljs-number">0.002</span></span>):
    out = []
    <span class="hljs-keyword">for</span> t <span class="hljs-keyword">in</span> np.arange(CYCLE, T, dt):                                   <span class="hljs-comment"># skip the first cycle (start-up)</span>
        f = feet_at(t); out.append(margin(com_at(t, sway), polygon(<span class="hljs-built_in">list</span>(f.values()))))
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">min</span>(out), np.array(out)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_feet_advance</span>():
    f0, f1 = feet_at(<span class="hljs-number">2.9</span>), feet_at(<span class="hljs-number">4.9</span>)
    <span class="hljs-keyword">for</span> leg <span class="hljs-keyword">in</span> f0:
        <span class="hljs-keyword">if</span> leg <span class="hljs-keyword">in</span> f1: <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(f1[leg][<span class="hljs-number">0</span>] - f0[leg][<span class="hljs-number">0</span>] - STEP) &lt; <span class="hljs-number">1e-12</span>    <span class="hljs-comment"># one step per cycle</span>
    n = [<span class="hljs-built_in">len</span>(feet_at(t)) <span class="hljs-keyword">for</span> t <span class="hljs-keyword">in</span> np.arange(<span class="hljs-number">2.0</span>, <span class="hljs-number">4.0</span>, <span class="hljs-number">0.01</span>)]
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">min</span>(n) == <span class="hljs-number">3</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">max</span>(n) == <span class="hljs-number">4</span>                                       <span class="hljs-comment"># never fewer than three feet down</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_com_stays_in_support_polygon</span>():
    m0, _ = worst_margin(<span class="hljs-number">0.0</span>)
    m1, arr = worst_margin(<span class="hljs-number">0.04</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;duty <span class="hljs-subst">{DUTY}</span>, no sway : worst stability margin <span class="hljs-subst">{m0 * <span class="hljs-number">1000</span>:<span class="hljs-number">5.1</span>f}</span> mm&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;duty <span class="hljs-subst">{DUTY}</span>, 4 cm sway: worst stability margin <span class="hljs-subst">{m1 * <span class="hljs-number">1000</span>:<span class="hljs-number">5.1</span>f}</span> mm (mean <span class="hljs-subst">{arr.mean() * <span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> mm)&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-number">0</span> &lt; m0 &lt; <span class="hljs-number">0.01</span> <span class="hljs-keyword">and</span> m1 &gt; <span class="hljs-number">0.03</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_duty_075_is_marginal</span>():
    <span class="hljs-keyword">global</span> DUTY
    keep, DUTY = DUTY, <span class="hljs-number">0.75</span>
    m, _ = worst_margin(<span class="hljs-number">0.0</span>); DUTY = keep
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;duty 0.75, no sway : worst margin <span class="hljs-subst">{m * <span class="hljs-number">1000</span>:<span class="hljs-number">.1</span>f}</span> mm, the centre of mass sits on the diagonal at each leg change&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(m) &lt; <span class="hljs-number">1e-9</span>

test_feet_advance()
test_com_stays_in_support_polygon()
test_duty_075_is_marginal()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does a faster crawl eventually fail even with sway?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A higher speed at the same step length means a shorter cycle, so the four-foot phases (when the body shifts across) get shorter and the sway must happen faster. The inertial forces of that faster sway move the effective point of support (the zero-moment point) away from the CoM projection, and the static argument stops holding. At that point you switch to a dynamic gait such as the trot.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Where should the CoM be for the largest margin on three feet at the corners of a triangle?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>At the triangle’s <strong>incentre</strong>, the point equidistant from all three edges. Its distance from the edges is the inradius, area divided by half the perimeter: the best possible margin for that stance.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p15-l17"></div>
`,i=[{id:`static-stability`,title:`Static stability`},{id:`gaits`,title:`Gaits`},{id:`leaning-into-the-support`,title:`Leaning into the support`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p15-l17-q1`,type:`num`,q:`<p>Body speed with 0.20 m steps and a 2 s cycle?</p>
`,explain:`<p>One step per cycle.</p>
`,answer:.1,tol:.001,unit:`m/s`},{id:`p15-l17-q2`,type:`num`,q:`<p>Minimum number of feet on the ground for static stability with area?</p>
`,explain:`<p>Three points make a triangle.</p>
`,answer:3,tol:.001,unit:``},{id:`p15-l17-q3`,type:`num`,q:`<p>Fraction of the cycle with four feet down in a crawl with duty factor 0.85?</p>
`,explain:`<p>Each of the four swings takes 0.15 of the cycle.</p>
`,answer:.4,tol:.001,unit:``},{id:`p15-l17-q4`,type:`num`,q:`<p>Inradius of a 3-4-5 right triangle of feet (m)?</p>
`,explain:`<p>Area over half the perimeter.</p>
`,answer:1,tol:.001,unit:`m`},{id:`p15-l17-q5`,type:`mc`,q:`<p>A crawl gait with duty factor exactly 0.75 has…</p>
`,explain:`<p>The CoM must sit on the shared diagonal.</p>
`,options:[`two feet down at times`,`four feet down half the time`,`the largest possible margin`,`zero stability margin at each leg change`],answer:3},{id:`p15-l17-q6`,type:`mc`,q:`<p>The body sways right while a left leg swings because…</p>
`,explain:`<p>It keeps the CoM inside the polygon.</p>
`,options:[`the remaining support triangle lies on the right`,`the left legs are heavier`,`it looks natural`,`the motors need it`],answer:0}],o=[{file:`crawl_gait.py`,lang:`python`,src:`import numpy as np

# an illustrative quadruped, not a model of any particular robot (m)
HIPS = {"LF": (0.30, 0.20), "RF": (0.30, -0.20), "LH": (-0.30, 0.20), "RH": (-0.30, -0.20)}
ORDER = ["LH", "LF", "RH", "RF"]           # the crawl sequence: one leg at a time, a quarter cycle apart
CYCLE, STEP = 2.0, 0.20                    # s, m: body speed STEP / CYCLE = 0.1 m/s
DUTY = 0.85                                # fraction of the cycle each foot is on the ground

def swing_window(leg, duty=None):
    k = ORDER.index(leg); return k / 4, k / 4 + (1 - (DUTY if duty is None else duty))

def feet_at(t):
    """planted foot positions (x, y) at time t; a foot in swing is left out.
    The body moves at STEP / CYCLE; each foot lands DUTY/2 of a step ahead of its hip and lifts DUTY/2 behind it."""
    ph = (t / CYCLE) % 1.0; feet = {}
    for leg, (hx, hy) in HIPS.items():
        a, b = swing_window(leg)
        if a <= ph < b: continue
        t_down = CYCLE * (np.floor(t / CYCLE - b) + b)                  # the last touchdown
        feet[leg] = (hx + STEP * t_down / CYCLE + DUTY / 2 * STEP, hy)
    return feet

def sway_profile(ph):
    """-1 (lean right) while the left legs swing, +1 while the right legs swing, ramping in the four-foot phases"""
    a = 1 - DUTY                                   # swing length; LH and LF swing in [0, 0.25 + a)
    if ph < 0.25 + a: return -1.0
    if ph < 0.5: return -1.0 + 2 * (ph - 0.25 - a) / (0.25 - a)
    if ph < 0.75 + a: return 1.0
    return 1.0 - 2 * (ph - 0.75 - a) / (0.25 - a)

def com_at(t, sway=0.0):
    """body centre moves forward steadily, leaning sideways by \`sway\` towards the side that keeps three feet down"""
    return np.array([STEP * t / CYCLE, sway * sway_profile((t / CYCLE) % 1.0)])

def polygon(points):
    """convex hull, counter-clockwise (gift wrapping is enough for 3 or 4 feet)"""
    pts = sorted(set(points)); 
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def margin(c, poly):
    """signed distance from c to the nearest edge: positive inside the support polygon"""
    d = []
    for i in range(len(poly)):
        a, b = np.array(poly[i]), np.array(poly[(i + 1) % len(poly)])
        e = b - a; n = np.array([-e[1], e[0]]) / np.linalg.norm(e)      # inward normal for a CCW polygon
        d.append(n @ (c - a))
    return min(d)

def worst_margin(sway, T=6.0, dt=0.002):
    out = []
    for t in np.arange(CYCLE, T, dt):                                   # skip the first cycle (start-up)
        f = feet_at(t); out.append(margin(com_at(t, sway), polygon(list(f.values()))))
    return min(out), np.array(out)

def test_feet_advance():
    f0, f1 = feet_at(2.9), feet_at(4.9)
    for leg in f0:
        if leg in f1: assert abs(f1[leg][0] - f0[leg][0] - STEP) < 1e-12    # one step per cycle
    n = [len(feet_at(t)) for t in np.arange(2.0, 4.0, 0.01)]
    assert min(n) == 3 and max(n) == 4                                       # never fewer than three feet down

def test_com_stays_in_support_polygon():
    m0, _ = worst_margin(0.0)
    m1, arr = worst_margin(0.04)
    print(f"duty {DUTY}, no sway : worst stability margin {m0 * 1000:5.1f} mm")
    print(f"duty {DUTY}, 4 cm sway: worst stability margin {m1 * 1000:5.1f} mm (mean {arr.mean() * 1000:.1f} mm)")
    assert 0 < m0 < 0.01 and m1 > 0.03

def test_duty_075_is_marginal():
    global DUTY
    keep, DUTY = DUTY, 0.75
    m, _ = worst_margin(0.0); DUTY = keep
    print(f"duty 0.75, no sway : worst margin {m * 1000:.1f} mm, the centre of mass sits on the diagonal at each leg change")
    assert abs(m) < 1e-9

test_feet_advance()
test_com_stays_in_support_polygon()
test_duty_075_is_marginal()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};