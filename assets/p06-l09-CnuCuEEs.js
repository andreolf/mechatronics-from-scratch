var e=`p06-l09`,t=35,n=`An incremental encoder reports motion as two square waves a quarter-cycle apart. You derive the Gray-code state sequence, build a 4× quadrature decoder as a state machine, count through direction reversals against ground truth, and size the counter and sampling rate for a real motor.`,r=`<h2 id="two-channels-in-quadrature">Two channels in quadrature</h2>
<p>An optical or magnetic encoder produces channels A and B, square waves with a 90° phase offset. Each line of the disk gives one full cycle on each channel, so there are four edges per line. Read together as a 2-bit state <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">A</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mclose">)</span></span></span></span>:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">00</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">10</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">11</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">01</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">00</span><span class="mspace" style="margin-right:1em;"></span><span class="mord text"><span class="mord">(forward)</span></span><span class="mpunct">,</span></span></span></span></span></div>
<p>and the reverse order backwards. Only one bit changes per step: it’s a <strong>Gray code</strong>. That gives three things:</p>
<ul>
<li><strong>Direction</strong>: which neighbour state comes next.</li>
<li><strong>4× resolution</strong>: count every edge of both channels. A 500-line encoder gives 2000 counts per revolution, or 0.18°.</li>
<li><strong>Error detection</strong>: if both bits change at once, a state was skipped (noise, or sampling too slowly). Count it as an error instead of guessing.</li>
</ul>
<h2 id="the-decoder-as-a-lookup-table">The decoder as a lookup table</h2>
<p>Combine the previous state and the new state into a 4-bit index and look up the count change: +1, −1, 0 (no change) or <em>error</em>. It’s a 16-entry table, implemented in hardware by every microcontroller timer’s “encoder mode”, or in software in an interrupt or a fast polling loop.</p>
<p><strong>Sampling rate.</strong> A polling decoder must see every state, so it must sample faster than the edge rate: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9805em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">e</span><span class="mord mathnormal mtight">d</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">g</span><span class="mord mathnormal mtight">e</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord text"><span class="mord">lines</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">rev/s</span></span></span></span></span>. Use a hardware timer when the edge rate gets into the kHz range.</p>
<p><strong>Counter width.</strong> A 16-bit counter wraps after 32 768 counts in either direction. Extend it in software by tracking wraps, or compute differences modulo <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">16</span></span></span></span></span></span></span></span></span></span></span></span> every control period (two’s complement makes that work, lesson 1).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="quadrature" data-args="{}"></div></div><figcaption>A shaft swings forward and back. The decoded count (lime) tracks the true angle (dashed) exactly through the reversal.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A motor shaft carries a 500-line encoder and spins at up to 6000 rpm.</p>
<ol>
<li>Counts per revolution: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">500</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2000</span></span></span></span>, so the resolution is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">360/2000</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">0.18°</span></span></span></span>.</li>
<li>Edge rate at 100 rev/s: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2000</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">200</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> edges per second. A polling loop would need more than 200 kHz, so use the timer’s encoder mode.</li>
<li>A 16-bit counter wraps after <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">32</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">768/2000</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">16.4</span></span></span></span> revolutions, which takes 0.16 s at full speed. A 1 kHz control loop reads it far more often than that, so modulo-<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">16</span></span></span></span></span></span></span></span></span></span></span></span> differences work.</li>
<li>Speed estimation from these counts is Phase 07 lesson 7.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">quadrature.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-comment"># index = (prev &lt;&lt; 2) | new, states encoded as (A &lt;&lt; 1) | B; &#x27;E&#x27; marks an illegal double change</span>
TABLE = [<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>, +<span class="hljs-number">1</span>, <span class="hljs-string">&quot;E&quot;</span>, +<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;E&quot;</span>, -<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-string">&quot;E&quot;</span>, <span class="hljs-number">0</span>, +<span class="hljs-number">1</span>, <span class="hljs-string">&quot;E&quot;</span>, +<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">ab_from_phase</span>(<span class="hljs-params">ph</span>):
    k = math.floor(ph) % <span class="hljs-number">4</span>                     <span class="hljs-comment"># quarter-cycle index</span>
    <span class="hljs-keyword">return</span> (<span class="hljs-number">1</span> <span class="hljs-keyword">if</span> k <span class="hljs-keyword">in</span> (<span class="hljs-number">1</span>, <span class="hljs-number">2</span>) <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>), (<span class="hljs-number">1</span> <span class="hljs-keyword">if</span> k &gt;= <span class="hljs-number">2</span> <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Decoder</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, a, b</span>):
        <span class="hljs-variable language_">self</span>.state, <span class="hljs-variable language_">self</span>.count, <span class="hljs-variable language_">self</span>.errors = (a &lt;&lt; <span class="hljs-number">1</span>) | b, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">update</span>(<span class="hljs-params">self, a, b</span>):
        new = (a &lt;&lt; <span class="hljs-number">1</span>) | b
        d = TABLE[(<span class="hljs-variable language_">self</span>.state &lt;&lt; <span class="hljs-number">2</span>) | new]
        <span class="hljs-keyword">if</span> d == <span class="hljs-string">&quot;E&quot;</span>:
            <span class="hljs-variable language_">self</span>.errors += <span class="hljs-number">1</span>
        <span class="hljs-keyword">else</span>:
            <span class="hljs-variable language_">self</span>.count += d
        <span class="hljs-variable language_">self</span>.state = new

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    lines = <span class="hljs-number">500</span>
    t = np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">400_001</span>)
    angle_rev = <span class="hljs-number">1.7</span> * np.sin(<span class="hljs-number">2</span> * math.pi * <span class="hljs-number">0.75</span> * t) + <span class="hljs-number">0.4</span> * t          <span class="hljs-comment"># reverses several times</span>
    quarter = angle_rev * lines * <span class="hljs-number">4</span>
    dec = Decoder(*ab_from_phase(quarter[<span class="hljs-number">0</span>]))
    <span class="hljs-keyword">for</span> q <span class="hljs-keyword">in</span> quarter[<span class="hljs-number">1</span>:]:
        dec.update(*ab_from_phase(q))
        <span class="hljs-keyword">assert</span> dec.count == math.floor(q) - math.floor(quarter[<span class="hljs-number">0</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;final count <span class="hljs-subst">{dec.count}</span>, truth <span class="hljs-subst">{math.floor(quarter[-<span class="hljs-number">1</span>]) - math.floor(quarter[<span class="hljs-number">0</span>])}</span>, errors <span class="hljs-subst">{dec.errors}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> dec.errors == <span class="hljs-number">0</span>
    <span class="hljs-comment"># sampling too slowly skips states: the decoder reports errors instead of silently miscounting direction</span>
    slow = Decoder(*ab_from_phase(quarter[<span class="hljs-number">0</span>]))
    <span class="hljs-keyword">for</span> q <span class="hljs-keyword">in</span> quarter[::<span class="hljs-number">400</span>][<span class="hljs-number">1</span>:]:
        slow.update(*ab_from_phase(q))
    <span class="hljs-keyword">assert</span> slow.errors &gt; <span class="hljs-number">0</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-number">360</span> / (<span class="hljs-number">4</span> * lines) == <span class="hljs-number">0.18</span> <span class="hljs-keyword">and</span> <span class="hljs-number">4</span> * lines * <span class="hljs-number">6000</span> / <span class="hljs-number">60</span> == <span class="hljs-number">200_000</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>The table says 00 → 01 is −1. Using the forward sequence, explain why.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Forward is 00 → 10 → 11 → 01 → 00, so 01 → 00 is forward and 00 → 01 is the reverse of that step: −1.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A 1024-line encoder on a wheel of 100 mm diameter. What linear distance is one count?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">π</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">100/</span><span class="mopen">(</span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1024</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.0767</span></span></span></span> mm.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l09"></div>

`,i=[{id:`two-channels-in-quadrature`,title:`Two channels in quadrature`},{id:`the-decoder-as-a-lookup-table`,title:`The decoder as a lookup table`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l09-q1`,type:`num`,q:`<p>Counts per revolution of a 500-line encoder with 4× decoding?</p>
`,explain:`<p>Every edge of A and B.</p>
`,answer:2e3,tol:.001,unit:``},{id:`p06-l09-q2`,type:`num`,q:`<p>Edge rate in kHz at 6000 rpm?</p>
`,explain:`<p>Counts per rev × rev per second.</p>
`,answer:200,tol:.001,unit:`kHz`},{id:`p06-l09-q3`,type:`mc`,q:`<p>If both A and B change between two samples, the decoder should…</p>
`,explain:`<p>The direction is ambiguous.</p>
`,options:[`count +2`,`flag an error, because a state was skipped`,`count −1`,`ignore it silently`],answer:1},{id:`p06-l09-q4`,type:`mc`,q:`<p>The A/B state sequence is a Gray code, meaning…</p>
`,explain:`<p>That’s what makes direction and error detection possible.</p>
`,options:[`both bits change at each step`,`only one bit changes per step`,`it counts in binary`,`the states are random`],answer:1},{id:`p06-l09-q5`,type:`num`,q:`<p>Distance per count in mm, 1024 lines, 100 mm wheel?</p>
`,explain:`<p>Circumference over counts per rev.</p>
`,answer:.076699,tol:.002,unit:`mm`},{id:`p06-l09-q6`,type:`num`,q:`<p>Revolutions before a signed 16-bit counter wraps (2000 counts/rev)?</p>
`,explain:`<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">15</span></span></span></span></span></span></span></span></span><span class="mord">/2000</span></span></span></span>.</p>
`,answer:16.384,tol:.001,unit:``}],o=[{file:`quadrature.py`,lang:`python`,src:`import math
import numpy as np

# index = (prev << 2) | new, states encoded as (A << 1) | B; 'E' marks an illegal double change
TABLE = [0, -1, +1, "E", +1, 0, "E", -1, -1, "E", 0, +1, "E", +1, -1, 0]

def ab_from_phase(ph):
    k = math.floor(ph) % 4                     # quarter-cycle index
    return (1 if k in (1, 2) else 0), (1 if k >= 2 else 0)

class Decoder:
    def __init__(self, a, b):
        self.state, self.count, self.errors = (a << 1) | b, 0, 0
    def update(self, a, b):
        new = (a << 1) | b
        d = TABLE[(self.state << 2) | new]
        if d == "E":
            self.errors += 1
        else:
            self.count += d
        self.state = new

if __name__ == "__main__":
    lines = 500
    t = np.linspace(0, 2, 400_001)
    angle_rev = 1.7 * np.sin(2 * math.pi * 0.75 * t) + 0.4 * t          # reverses several times
    quarter = angle_rev * lines * 4
    dec = Decoder(*ab_from_phase(quarter[0]))
    for q in quarter[1:]:
        dec.update(*ab_from_phase(q))
        assert dec.count == math.floor(q) - math.floor(quarter[0])
    print(f"final count {dec.count}, truth {math.floor(quarter[-1]) - math.floor(quarter[0])}, errors {dec.errors}")
    assert dec.errors == 0
    # sampling too slowly skips states: the decoder reports errors instead of silently miscounting direction
    slow = Decoder(*ab_from_phase(quarter[0]))
    for q in quarter[::400][1:]:
        slow.update(*ab_from_phase(q))
    assert slow.errors > 0
    assert 360 / (4 * lines) == 0.18 and 4 * lines * 6000 / 60 == 200_000`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};