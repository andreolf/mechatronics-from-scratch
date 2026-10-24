var e=`p09-l10`,t=40,n=`A brushless motor moves the commutator into electronics, so three Hall sensors tell the drive which pair of windings to energise. You derive the six-step commutation table that keeps the stator field 60 to 120 degrees ahead of the rotor, implement it, and simulate the motor spinning correctly in both directions.`,r=`<h2 id="brushless-dc">Brushless DC</h2>
<p>A <strong>BLDC</strong> motor has permanent magnets on the rotor and three windings (A, B, C) on the stator, usually star-connected. A brushed motor’s commutator switches the current mechanically to keep the field ahead of the rotor; in a BLDC, a three-phase bridge (three half-bridges, lesson 6) does it electronically.</p>
<p>With a <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span></span></span></span>-pole-pair rotor, one mechanical revolution is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span></span></span></span> electrical cycles. Everything below is in electrical degrees.</p>
<h2 id="six-vectors-from-six-pairs">Six vectors from six pairs</h2>
<p>At any time, drive current into one phase and out of another, and leave the third floating. With phase axes at 0°, 120° and 240°, the stator field of “X+ Y−” points along <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6944em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal">x</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.2222em;"><span class="mord">^</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord katex-accent"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6944em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">y</span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1944em;"><span class="mord">^</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1944em;"><span></span></span></span></span></span></span></span></span>. That gives six directions, 60° apart:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Pair</th>
<th>Field angle</th>
</tr>
</thead>
<tbody><tr>
<td>A+ B−</td>
<td>330°</td>
</tr>
<tr>
<td>A+ C−</td>
<td>30°</td>
</tr>
<tr>
<td>B+ C−</td>
<td>90°</td>
</tr>
<tr>
<td>B+ A−</td>
<td>150°</td>
</tr>
<tr>
<td>C+ A−</td>
<td>210°</td>
</tr>
<tr>
<td>C+ B−</td>
<td>270°</td>
</tr>
</tbody></table></div>
<p>Torque is proportional to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop">sin</span><span class="mopen">(</span><span class="mord text"><span class="mord">lead</span></span><span class="mclose">)</span></span></span></span>, the angle by which the stator field leads the rotor magnet. Keep the lead between 60° and 120°: each vector serves a 60° sector of rotor angle, and the torque varies between <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mop">sin</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">60°</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.87</span></span></span></span> and 1, averaging <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">3/</span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.955</span></span></span></span>. That’s a ripple of 13 % from geometry alone.</p>
<h2 id="hall-sensors">Hall sensors</h2>
<p>Three Hall sensors 120° apart, each high for half a cycle, produce six codes, one per sector. Forward the sequence is 1, 3, 2, 6, 4, 5; codes 0 and 7 are impossible and mean a broken sensor wire. The commutation table maps each code to a pair. For reverse, pick the vector that <em>lags</em> by 60–120° instead, which is the pair with + and − swapped from 180° away.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="sixstep" data-args="{}"></div></div><figcaption>Rotor magnet (blue) and the stator field of the energised pair (lime). Turn the rotor: at each Hall transition the drive steps the field 60° on, keeping it 60–120° ahead (or behind, in reverse).</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A scooter hub motor with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">p</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">15</span></span></span></span> pole pairs at 600 rpm.</p>
<ol>
<li>Mechanical: 10 rev/s. Electrical: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">15</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">150</span></span></span></span> Hz.</li>
<li>Commutations: 6 per electrical cycle, 900 per second, one every 1.11 ms.</li>
<li>Rotor in sector 0 (Hall code 001, between −30° and 30°): forward drives B+ C− (90°), with lead 60–120°. Reverse drives C+ B− (270°).</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">six_step.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

HALL = [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">6</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>]                     <span class="hljs-comment"># forward Hall sequence, sector 0..5</span>
PAIR_AT = {<span class="hljs-number">330</span>: (<span class="hljs-string">&quot;A&quot;</span>, <span class="hljs-string">&quot;B&quot;</span>), <span class="hljs-number">30</span>: (<span class="hljs-string">&quot;A&quot;</span>, <span class="hljs-string">&quot;C&quot;</span>), <span class="hljs-number">90</span>: (<span class="hljs-string">&quot;B&quot;</span>, <span class="hljs-string">&quot;C&quot;</span>), <span class="hljs-number">150</span>: (<span class="hljs-string">&quot;B&quot;</span>, <span class="hljs-string">&quot;A&quot;</span>), <span class="hljs-number">210</span>: (<span class="hljs-string">&quot;C&quot;</span>, <span class="hljs-string">&quot;A&quot;</span>), <span class="hljs-number">270</span>: (<span class="hljs-string">&quot;C&quot;</span>, <span class="hljs-string">&quot;B&quot;</span>)}
AXIS = {<span class="hljs-string">&quot;A&quot;</span>: <span class="hljs-number">0.0</span>, <span class="hljs-string">&quot;B&quot;</span>: <span class="hljs-number">120.0</span>, <span class="hljs-string">&quot;C&quot;</span>: <span class="hljs-number">240.0</span>}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">hall_code</span>(<span class="hljs-params">theta_deg</span>):
    sector = <span class="hljs-built_in">int</span>(((theta_deg + <span class="hljs-number">30</span>) % <span class="hljs-number">360</span>) // <span class="hljs-number">60</span>)
    <span class="hljs-keyword">return</span> HALL[sector]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">commutate</span>(<span class="hljs-params">code, forward=<span class="hljs-literal">True</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;Hall code -&gt; (high phase, low phase). Builds the table from geometry, not by hand.&quot;&quot;&quot;</span>
    sector = HALL.index(code)
    field = (<span class="hljs-number">60</span> * sector + (<span class="hljs-number">90</span> <span class="hljs-keyword">if</span> forward <span class="hljs-keyword">else</span> -<span class="hljs-number">90</span>)) % <span class="hljs-number">360</span>
    <span class="hljs-keyword">return</span> PAIR_AT[field]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">field_angle</span>(<span class="hljs-params">pair</span>):
    x, y = pair
    v = np.array([np.cos(np.radians(AXIS[x])) - np.cos(np.radians(AXIS[y])),
                  np.sin(np.radians(AXIS[x])) - np.sin(np.radians(AXIS[y]))])
    <span class="hljs-keyword">return</span> np.degrees(np.arctan2(v[<span class="hljs-number">1</span>], v[<span class="hljs-number">0</span>])) % <span class="hljs-number">360</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">spin</span>(<span class="hljs-params">forward, T=<span class="hljs-number">0.3</span>, dt=<span class="hljs-number">1e-5</span>, J=<span class="hljs-number">2e-5</span>, b=<span class="hljs-number">1e-4</span>, Tmax=<span class="hljs-number">0.05</span></span>):
    th = <span class="hljs-number">10.0</span>; w = <span class="hljs-number">0.0</span>                          <span class="hljs-comment"># electrical degrees, rad/s (electrical)</span>
    lead_seen = []
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">int</span>(T / dt)):
        pair = commutate(hall_code(th), forward)
        lead = (field_angle(pair) - th + <span class="hljs-number">180</span>) % <span class="hljs-number">360</span> - <span class="hljs-number">180</span>
        lead_seen.append(lead)
        w += dt * (Tmax * np.sin(np.radians(lead)) - b * w) / J
        th = (th + np.degrees(w) * dt) % <span class="hljs-number">360</span>
    <span class="hljs-keyword">return</span> w, np.array(lead_seen)

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    <span class="hljs-comment"># the geometric pair table is what we claimed</span>
    <span class="hljs-keyword">for</span> ang, pair <span class="hljs-keyword">in</span> PAIR_AT.items():
        <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(field_angle(pair) - ang) &lt; <span class="hljs-number">1e-9</span>
    <span class="hljs-comment"># every Hall sector gets a vector 60..120 deg ahead (forward) or behind (reverse)</span>
    <span class="hljs-keyword">for</span> th <span class="hljs-keyword">in</span> np.arange(<span class="hljs-number">0</span>, <span class="hljs-number">360</span>, <span class="hljs-number">0.5</span>):
        <span class="hljs-keyword">for</span> fwd <span class="hljs-keyword">in</span> (<span class="hljs-literal">True</span>, <span class="hljs-literal">False</span>):
            lead = (field_angle(commutate(hall_code(th), fwd)) - th + <span class="hljs-number">180</span>) % <span class="hljs-number">360</span> - <span class="hljs-number">180</span>
            <span class="hljs-keyword">assert</span> <span class="hljs-number">59.99</span> &lt;= (lead <span class="hljs-keyword">if</span> fwd <span class="hljs-keyword">else</span> -lead) &lt;= <span class="hljs-number">120.01</span>
    wf, lf = spin(<span class="hljs-literal">True</span>); wr, lr = spin(<span class="hljs-literal">False</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;forward speed <span class="hljs-subst">{wf:<span class="hljs-number">.0</span>f}</span> rad/s, reverse <span class="hljs-subst">{wr:<span class="hljs-number">.0</span>f}</span> rad/s&quot;</span>)
    <span class="hljs-keyword">assert</span> wf &gt; <span class="hljs-number">100</span> <span class="hljs-keyword">and</span> wr &lt; -<span class="hljs-number">100</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(wf + wr) &lt; <span class="hljs-number">0.02</span> * wf
    <span class="hljs-comment"># average torque factor 3/pi, ripple 1 - sin 60</span>
    s = np.sin(np.radians(np.linspace(<span class="hljs-number">60</span>, <span class="hljs-number">120</span>, <span class="hljs-number">100001</span>)))
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(s.mean() - <span class="hljs-number">3</span> / np.pi) &lt; <span class="hljs-number">1e-4</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">1</span> - s.<span class="hljs-built_in">min</span>() - <span class="hljs-number">0.134</span>) &lt; <span class="hljs-number">1e-3</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A Hall sensor reads code 7. What should the drive do?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Codes 0 and 7 can’t occur with healthy sensors (they’d need all three high or all low). Treat it as a fault: switch all phases off (or to a safe braking state) and report a Hall error, rather than looking up a table entry.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>At high speed the drive commutates slightly early (“phase advance”). Why?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The winding inductance delays the current’s rise after each commutation, so the effective field lags the table. Commutating early by the delay angle <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">ω</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">e</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord mathnormal">L</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span></span></span></span> (roughly) lines up the actual current with the intended sector and recovers torque at speed.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p09-l10"></div>

`,i=[{id:`brushless-dc`,title:`Brushless DC`},{id:`six-vectors-from-six-pairs`,title:`Six vectors from six pairs`},{id:`hall-sensors`,title:`Hall sensors`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p09-l10-q1`,type:`num`,q:`<p>Electrical frequency in Hz of a 15-pole-pair motor at 600 rpm?</p>
`,explain:`<p>p × mechanical rev/s.</p>
`,answer:150,tol:.001,unit:`Hz`},{id:`p09-l10-q2`,type:`num`,q:`<p>Commutation events per second at that speed?</p>
`,explain:`<p>Six per electrical cycle.</p>
`,answer:900,tol:.001,unit:``},{id:`p09-l10-q3`,type:`num`,q:`<p>Average torque factor of six-step with ideal 60–120° lead?</p>
`,explain:`<p>Mean of sin over 60–120°.</p>
`,answer:.9549,tol:.001,unit:``},{id:`p09-l10-q4`,type:`num`,q:`<p>Field angle in degrees of the pair A+ C−?</p>
`,explain:`<p>Â − Ĉ.</p>
`,answer:30,tol:.001,unit:`°`},{id:`p09-l10-q5`,type:`mc`,q:`<p>In six-step drive, how many phases carry current at a time?</p>
`,explain:`<p>One in, one out, one floating.</p>
`,options:[`it alternates between one and three`,`one`,`two`,`three`],answer:2},{id:`p09-l10-q6`,type:`mc`,q:`<p>To reverse a BLDC, the drive…</p>
`,explain:`<p>Torque sign follows sin(lead).</p>
`,options:[`reverses the Hall sequence wiring`,`lowers the PWM frequency`,`swaps the bus polarity`,`picks the vector lagging the rotor by 60–120°`],answer:3}],o=[{file:`six_step.py`,lang:`python`,src:`import numpy as np

HALL = [1, 3, 2, 6, 4, 5]                     # forward Hall sequence, sector 0..5
PAIR_AT = {330: ("A", "B"), 30: ("A", "C"), 90: ("B", "C"), 150: ("B", "A"), 210: ("C", "A"), 270: ("C", "B")}
AXIS = {"A": 0.0, "B": 120.0, "C": 240.0}

def hall_code(theta_deg):
    sector = int(((theta_deg + 30) % 360) // 60)
    return HALL[sector]

def commutate(code, forward=True):
    """Hall code -> (high phase, low phase). Builds the table from geometry, not by hand."""
    sector = HALL.index(code)
    field = (60 * sector + (90 if forward else -90)) % 360
    return PAIR_AT[field]

def field_angle(pair):
    x, y = pair
    v = np.array([np.cos(np.radians(AXIS[x])) - np.cos(np.radians(AXIS[y])),
                  np.sin(np.radians(AXIS[x])) - np.sin(np.radians(AXIS[y]))])
    return np.degrees(np.arctan2(v[1], v[0])) % 360

def spin(forward, T=0.3, dt=1e-5, J=2e-5, b=1e-4, Tmax=0.05):
    th = 10.0; w = 0.0                          # electrical degrees, rad/s (electrical)
    lead_seen = []
    for _ in range(int(T / dt)):
        pair = commutate(hall_code(th), forward)
        lead = (field_angle(pair) - th + 180) % 360 - 180
        lead_seen.append(lead)
        w += dt * (Tmax * np.sin(np.radians(lead)) - b * w) / J
        th = (th + np.degrees(w) * dt) % 360
    return w, np.array(lead_seen)

if __name__ == "__main__":
    # the geometric pair table is what we claimed
    for ang, pair in PAIR_AT.items():
        assert abs(field_angle(pair) - ang) < 1e-9
    # every Hall sector gets a vector 60..120 deg ahead (forward) or behind (reverse)
    for th in np.arange(0, 360, 0.5):
        for fwd in (True, False):
            lead = (field_angle(commutate(hall_code(th), fwd)) - th + 180) % 360 - 180
            assert 59.99 <= (lead if fwd else -lead) <= 120.01
    wf, lf = spin(True); wr, lr = spin(False)
    print(f"forward speed {wf:.0f} rad/s, reverse {wr:.0f} rad/s")
    assert wf > 100 and wr < -100 and abs(wf + wr) < 0.02 * wf
    # average torque factor 3/pi, ripple 1 - sin 60
    s = np.sin(np.radians(np.linspace(60, 120, 100001)))
    assert abs(s.mean() - 3 / np.pi) < 1e-4 and abs(1 - s.min() - 0.134) < 1e-3`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};