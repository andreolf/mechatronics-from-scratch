var e=`p20-l15`,t=45,n=`An educational safety supervisor for a ski-lift-style rope drive, the kind that runs Swiss mountain lifts. You define stop categories, speed and rope plausibility checks, escalation when the drive fails to brake, and a latched lockout, then prove by exhaustive simulation that every fault in every state ends with the line stopped, torque off and brakes on, and that it cannot restart while a fault is present.`,r=`<h2 id="stops-and-brakes">Stops and brakes</h2>
<p>This is an educational model only. Real ropeways in Switzerland and the EU are designed to EN 12929 and related standards, approved by the authorities, and built with certified safety hardware; nothing here replaces them.</p>
<p>A rope drive has a drive (a motor on the bullwheel), a service brake and an emergency brake acting on the bullwheel. The supervisor uses the stop categories of Phase 19:</p>
<ul>
<li><strong>Category 0</strong> (estop, derailment, overspeed, rollback, rope slip, brake fault): remove torque and apply the brakes at once.</li>
<li><strong>Category 1</strong> (high wind, lost safety line, drive fault): the drive decelerates the line, then the brakes hold it.</li>
<li><strong>Escalation:</strong> if a controlled stop does not decelerate at least <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7944em;vertical-align:-0.15em;"></span><span class="mord">0.75</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">c</span><span class="mord mathnormal mtight">t</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> after 1 s, the emergency brake takes over.</li>
</ul>
<p>The stopping distance at speed <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">v</span></span></span></span> with deceleration <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">a</span></span></span></span> is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">d</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord">/2</span><span class="mord mathnormal">a</span></span></span></span>. Too gentle and the line runs far; too hard and passengers on chairs swing, so emergency decelerations are limited too.</p>
<h2 id="plausibility">Plausibility</h2>
<p>Two speed signals, the bullwheel’s and the rope’s, catch a slipping rope when they differ by more than <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7944em;vertical-align:-0.15em;"></span><span class="mord">0.05</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">n</span><span class="mord mathnormal mtight">o</span><span class="mord mathnormal mtight">m</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.1</span></span></span></span> m/s. Speed above 115 % is overspeed; negative speed on a loaded uphill line is rollback, the most dangerous failure of all. Any fault latches, and the line can only restart after a reset with no fault present.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="ropedrive" data-args="{}"></div></div><figcaption>The supervisor’s states with the line speed. Inject a fault in a chosen state; the diagram highlights the path to the safe state and the readout gives its timeline and the peak deceleration.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative line at 5 m/s, normal ramp 0.3 m/s², controlled stop 0.8 m/s², emergency brake 1.6 m/s², 100 Hz supervisor:</p>
<ol>
<li>Exhaustive test: 7 states × 9 faults = 63 pairs. Every one ends locked out, stopped, with torque off and brakes on, and refuses reset and restart while the fault is held. The largest deceleration is 1.60 m/s², the emergency brake.</li>
<li>Drive fault at 20 s while running: controlled stop at 20.00 s; the line only coasts, so the emergency brake takes over at 21.00 s, locked out at 23.87 s, no rollback; after the fault clears, a reset at 45 s returns it to stopped and it restarts.</li>
<li>Speed checks: 5.8 m/s overspeed, 0.6 m/s rope slip and −0.2 m/s rollback each trip; 5.6 m/s with a 0.2 m/s mismatch does not.</li>
<li>Stopping from 5 m/s: normal stop 16.67 s over 41.67 m, controlled 6.25 s over 15.62 m, emergency brake 3.12 s over 7.81 m.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">rope_drive_supervisor.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> itertools

<span class="hljs-comment"># EDUCATIONAL model of a rope-drive supervisor; real installations follow EN 12929, EN 13243 and the</span>
<span class="hljs-comment"># authorities&#x27; rules, with certified safety hardware. All values are illustrative.</span>
V_NOM, A_RUN = <span class="hljs-number">5.0</span>, <span class="hljs-number">0.3</span>                      <span class="hljs-comment"># line speed (m/s), normal acceleration and stop (m/s^2)</span>
A_CTRL, A_EMRG = <span class="hljs-number">0.8</span>, <span class="hljs-number">1.6</span>                    <span class="hljs-comment"># controlled stop by the drive; emergency (mechanical) brake (m/s^2)</span>
A_ROLLBACK = <span class="hljs-number">0.4</span>                             <span class="hljs-comment"># an uphill loaded line rolls back at this rate with no torque or brake</span>
DT = <span class="hljs-number">0.01</span>                                    <span class="hljs-comment"># 100 Hz supervisor</span>

CAT0 = {<span class="hljs-string">&quot;estop&quot;</span>, <span class="hljs-string">&quot;derailment&quot;</span>, <span class="hljs-string">&quot;overspeed&quot;</span>, <span class="hljs-string">&quot;rollback&quot;</span>, <span class="hljs-string">&quot;rope slip&quot;</span>, <span class="hljs-string">&quot;brake fault&quot;</span>}   <span class="hljs-comment"># stop at once: torque off, brakes on</span>
CAT1 = {<span class="hljs-string">&quot;wind high&quot;</span>, <span class="hljs-string">&quot;safety line lost&quot;</span>, <span class="hljs-string">&quot;drive fault&quot;</span>}                              <span class="hljs-comment"># controlled stop, then brakes</span>
FAULTS = <span class="hljs-built_in">sorted</span>(CAT0 | CAT1)
STATES = [<span class="hljs-string">&quot;stopped&quot;</span>, <span class="hljs-string">&quot;starting&quot;</span>, <span class="hljs-string">&quot;running&quot;</span>, <span class="hljs-string">&quot;stopping&quot;</span>, <span class="hljs-string">&quot;controlled stop&quot;</span>, <span class="hljs-string">&quot;emergency stop&quot;</span>, <span class="hljs-string">&quot;locked out&quot;</span>]

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Supervisor</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">s</span>):
        s.state, s.latched, s.t_stop = <span class="hljs-string">&quot;stopped&quot;</span>, <span class="hljs-built_in">set</span>(), <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">outputs</span>(<span class="hljs-params">s</span>):
        <span class="hljs-string">&quot;&quot;&quot;drive torque enabled, brakes applied&quot;&quot;&quot;</span>
        <span class="hljs-keyword">return</span> s.state <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;starting&quot;</span>, <span class="hljs-string">&quot;running&quot;</span>, <span class="hljs-string">&quot;stopping&quot;</span>, <span class="hljs-string">&quot;controlled stop&quot;</span>), s.state <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;stopped&quot;</span>, <span class="hljs-string">&quot;emergency stop&quot;</span>, <span class="hljs-string">&quot;locked out&quot;</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">s, faults, cmd, v, v_rope, a_meas</span>):
        <span class="hljs-string">&quot;&quot;&quot;faults: active fault inputs; cmd: &#x27;start&#x27;, &#x27;stop&#x27;, &#x27;reset&#x27; or None; v bullwheel speed, v_rope rope speed&quot;&quot;&quot;</span>
        <span class="hljs-keyword">if</span> v &gt; <span class="hljs-number">1.15</span> * V_NOM: faults = faults | {<span class="hljs-string">&quot;overspeed&quot;</span>}                  <span class="hljs-comment"># plausibility checks inside the supervisor</span>
        <span class="hljs-keyword">if</span> v &lt; -<span class="hljs-number">0.1</span>: faults = faults | {<span class="hljs-string">&quot;rollback&quot;</span>}
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(v - v_rope) &gt; <span class="hljs-number">0.05</span> * V_NOM + <span class="hljs-number">0.1</span>: faults = faults | {<span class="hljs-string">&quot;rope slip&quot;</span>}
        s.latched |= faults
        <span class="hljs-keyword">if</span> s.state == <span class="hljs-string">&quot;locked out&quot;</span>:
            <span class="hljs-keyword">if</span> cmd == <span class="hljs-string">&quot;reset&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> faults: s.latched = <span class="hljs-built_in">set</span>(); s.state = <span class="hljs-string">&quot;stopped&quot;</span>
        <span class="hljs-keyword">elif</span> s.state == <span class="hljs-string">&quot;emergency stop&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(v) &lt; <span class="hljs-number">0.02</span>: s.state = <span class="hljs-string">&quot;locked out&quot;</span>          <span class="hljs-comment"># standstill reached: lock out</span>
        <span class="hljs-keyword">elif</span> faults &amp; CAT0 <span class="hljs-keyword">or</span> (s.state == <span class="hljs-string">&quot;controlled stop&quot;</span> <span class="hljs-keyword">and</span> s.t_stop &gt; <span class="hljs-number">1.0</span> <span class="hljs-keyword">and</span> a_meas &gt; -<span class="hljs-number">0.75</span> * A_CTRL):
            s.state = <span class="hljs-string">&quot;emergency stop&quot;</span>                                    <span class="hljs-comment"># stop at once, or escalate if the drive does not brake</span>
        <span class="hljs-keyword">elif</span> faults &amp; CAT1 <span class="hljs-keyword">and</span> s.state <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;starting&quot;</span>, <span class="hljs-string">&quot;running&quot;</span>, <span class="hljs-string">&quot;stopping&quot;</span>):
            s.state, s.t_stop = <span class="hljs-string">&quot;controlled stop&quot;</span>, <span class="hljs-number">0.0</span>
        <span class="hljs-keyword">elif</span> s.state == <span class="hljs-string">&quot;stopped&quot;</span>:
            <span class="hljs-keyword">if</span> s.latched: s.state = <span class="hljs-string">&quot;locked out&quot;</span>
            <span class="hljs-keyword">elif</span> cmd == <span class="hljs-string">&quot;start&quot;</span>: s.state = <span class="hljs-string">&quot;starting&quot;</span>
        <span class="hljs-keyword">elif</span> s.state == <span class="hljs-string">&quot;starting&quot;</span> <span class="hljs-keyword">and</span> v &gt;= V_NOM - <span class="hljs-number">1e-6</span>: s.state = <span class="hljs-string">&quot;running&quot;</span>
        <span class="hljs-keyword">elif</span> s.state <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;starting&quot;</span>, <span class="hljs-string">&quot;running&quot;</span>) <span class="hljs-keyword">and</span> cmd == <span class="hljs-string">&quot;stop&quot;</span>: s.state = <span class="hljs-string">&quot;stopping&quot;</span>
        <span class="hljs-keyword">elif</span> s.state <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;stopping&quot;</span>, <span class="hljs-string">&quot;controlled stop&quot;</span>) <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(v) &lt; <span class="hljs-number">0.02</span>:
            s.state = <span class="hljs-string">&quot;locked out&quot;</span> <span class="hljs-keyword">if</span> s.latched <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;stopped&quot;</span>
        s.t_stop += DT
        <span class="hljs-keyword">return</span> s.state

<span class="hljs-keyword">def</span> <span class="hljs-title function_">drive</span>(<span class="hljs-params">sup, v, faults</span>):
    <span class="hljs-string">&quot;&quot;&quot;line dynamics: the drive follows its ramp when it has torque; brakes decelerate; with neither, it rolls back&quot;&quot;&quot;</span>
    torque, brakes = sup.outputs()
    <span class="hljs-keyword">if</span> brakes:
        cap = A_EMRG * (<span class="hljs-number">0.6</span> <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;brake fault&quot;</span> <span class="hljs-keyword">in</span> faults <span class="hljs-keyword">else</span> <span class="hljs-number">1.0</span>)           <span class="hljs-comment"># two brakes: one failed still stops the line</span>
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(v) &lt;= cap * DT: <span class="hljs-keyword">return</span> <span class="hljs-number">0.0</span>, <span class="hljs-number">0.0</span>
        a = -cap <span class="hljs-keyword">if</span> v &gt; <span class="hljs-number">0</span> <span class="hljs-keyword">else</span> cap
    <span class="hljs-keyword">elif</span> torque <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;drive fault&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> faults:
        a = {<span class="hljs-string">&quot;starting&quot;</span>: A_RUN, <span class="hljs-string">&quot;running&quot;</span>: <span class="hljs-number">0.0</span>, <span class="hljs-string">&quot;stopping&quot;</span>: -A_RUN, <span class="hljs-string">&quot;controlled stop&quot;</span>: -A_CTRL}[sup.state]
        <span class="hljs-keyword">if</span> sup.state == <span class="hljs-string">&quot;starting&quot;</span>: a = <span class="hljs-built_in">min</span>(a, (V_NOM - v) / DT)
    <span class="hljs-keyword">else</span>: a = -A_ROLLBACK                                                 <span class="hljs-comment"># no torque, no brake: the loaded line slows and reverses</span>
    <span class="hljs-keyword">return</span> v + a * DT, a

<span class="hljs-comment"># how to reach each state: commands and a brief fault pulse, and when to inject the fault under test</span>
REACH = {<span class="hljs-string">&quot;stopped&quot;</span>: ([], <span class="hljs-literal">None</span>, <span class="hljs-number">0.5</span>), <span class="hljs-string">&quot;starting&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>)], <span class="hljs-literal">None</span>, <span class="hljs-number">2.0</span>), <span class="hljs-string">&quot;running&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>)], <span class="hljs-literal">None</span>, <span class="hljs-number">25.0</span>),
         <span class="hljs-string">&quot;stopping&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>), (<span class="hljs-string">&quot;stop&quot;</span>, <span class="hljs-number">20.0</span>)], <span class="hljs-literal">None</span>, <span class="hljs-number">22.0</span>), <span class="hljs-string">&quot;controlled stop&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>)], (<span class="hljs-string">&quot;wind high&quot;</span>, <span class="hljs-number">20.0</span>), <span class="hljs-number">21.0</span>),
         <span class="hljs-string">&quot;emergency stop&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>)], (<span class="hljs-string">&quot;estop&quot;</span>, <span class="hljs-number">20.0</span>), <span class="hljs-number">20.5</span>), <span class="hljs-string">&quot;locked out&quot;</span>: ([(<span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-number">0.0</span>)], (<span class="hljs-string">&quot;estop&quot;</span>, <span class="hljs-number">20.0</span>), <span class="hljs-number">30.0</span>)}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">run_scenario</span>(<span class="hljs-params">start_state, fault, hold=<span class="hljs-number">40.0</span></span>):
    sup = Supervisor(); v = a = t = <span class="hljs-number">0.0</span>; plan, pulse, t_inj = REACH[start_state]; peak = <span class="hljs-number">0.0</span>
    <span class="hljs-keyword">while</span> t &lt; t_inj + hold:
        cmd = <span class="hljs-built_in">next</span>((c <span class="hljs-keyword">for</span> c, tc <span class="hljs-keyword">in</span> plan <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(t - tc) &lt; DT / <span class="hljs-number">2</span>), <span class="hljs-literal">None</span>)
        faults = {pulse[<span class="hljs-number">0</span>]} <span class="hljs-keyword">if</span> pulse <span class="hljs-keyword">and</span> pulse[<span class="hljs-number">1</span>] &lt;= t &lt; pulse[<span class="hljs-number">1</span>] + <span class="hljs-number">0.1</span> <span class="hljs-keyword">else</span> <span class="hljs-built_in">set</span>()
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">abs</span>(t - t_inj) &lt; DT / <span class="hljs-number">2</span>: <span class="hljs-keyword">assert</span> sup.state == start_state, (start_state, sup.state)
        <span class="hljs-keyword">if</span> t &gt;= t_inj: faults.add(fault)
        sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults)
        <span class="hljs-keyword">if</span> t &gt;= t_inj: peak = <span class="hljs-built_in">max</span>(peak, <span class="hljs-built_in">abs</span>(a))
        t += DT
    <span class="hljs-keyword">for</span> c <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;reset&quot;</span>, <span class="hljs-string">&quot;start&quot;</span>, <span class="hljs-string">&quot;reset&quot;</span>, <span class="hljs-string">&quot;start&quot;</span>):                         <span class="hljs-comment"># try to restart with the fault still present</span>
        sup.step({fault}, c, v, v, <span class="hljs-number">0.0</span>); v, a = drive(sup, v, {fault})
    torque, brakes = sup.outputs()
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">dict</span>(state=sup.state, v=v, torque=torque, brakes=brakes, peak=peak, latched=fault <span class="hljs-keyword">in</span> sup.latched)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_all_faults_all_states</span>():
    worst = <span class="hljs-number">0.0</span>; n = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> st, f <span class="hljs-keyword">in</span> itertools.product(STATES, FAULTS):
        r = run_scenario(st, f); n += <span class="hljs-number">1</span>
        <span class="hljs-keyword">assert</span> r[<span class="hljs-string">&quot;state&quot;</span>] == <span class="hljs-string">&quot;locked out&quot;</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(r[<span class="hljs-string">&quot;v&quot;</span>]) &lt; <span class="hljs-number">0.02</span> <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> r[<span class="hljs-string">&quot;torque&quot;</span>] <span class="hljs-keyword">and</span> r[<span class="hljs-string">&quot;brakes&quot;</span>] <span class="hljs-keyword">and</span> r[<span class="hljs-string">&quot;latched&quot;</span>], (st, f, r)
        worst = <span class="hljs-built_in">max</span>(worst, r[<span class="hljs-string">&quot;peak&quot;</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{n}</span> state-fault pairs: every one ends locked out, stopped, torque off, brakes on, and refuses restart with the fault present&quot;</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;largest deceleration seen: <span class="hljs-subst">{worst:<span class="hljs-number">.2</span>f}</span> m/s^2 (emergency brake <span class="hljs-subst">{A_EMRG}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> worst &lt;= A_EMRG + <span class="hljs-number">1e-9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_escalation_and_reset</span>():
    sup = Supervisor(); v = a = <span class="hljs-number">0.0</span>; t = <span class="hljs-number">0.0</span>; log = []
    <span class="hljs-keyword">while</span> t &lt; <span class="hljs-number">70</span>:
        cmd = <span class="hljs-string">&quot;start&quot;</span> <span class="hljs-keyword">if</span> t &lt; DT <span class="hljs-keyword">else</span> (<span class="hljs-string">&quot;reset&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-number">45</span> &lt; t &lt; <span class="hljs-number">45</span> + DT <span class="hljs-keyword">else</span> (<span class="hljs-string">&quot;start&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-number">46</span> &lt; t &lt; <span class="hljs-number">46</span> + DT <span class="hljs-keyword">else</span> <span class="hljs-literal">None</span>))
        faults = {<span class="hljs-string">&quot;drive fault&quot;</span>} <span class="hljs-keyword">if</span> <span class="hljs-number">20</span> &lt;= t &lt; <span class="hljs-number">30</span> <span class="hljs-keyword">else</span> <span class="hljs-built_in">set</span>()
        st = sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults); log.append((<span class="hljs-built_in">round</span>(t, <span class="hljs-number">2</span>), st, v)); t += DT
    first = {}
    <span class="hljs-keyword">for</span> tt, st, vv <span class="hljs-keyword">in</span> log: first.setdefault(st, (tt, vv))
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;drive fault at 20 s:&quot;</span>, {k: <span class="hljs-string">f&quot;<span class="hljs-subst">{v[<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> s&quot;</span> <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> first.items()})
    <span class="hljs-keyword">assert</span> first[<span class="hljs-string">&quot;controlled stop&quot;</span>][<span class="hljs-number">0</span>] &gt;= <span class="hljs-number">20</span> <span class="hljs-keyword">and</span> first[<span class="hljs-string">&quot;emergency stop&quot;</span>][<span class="hljs-number">0</span>] - first[<span class="hljs-string">&quot;controlled stop&quot;</span>][<span class="hljs-number">0</span>] &lt;= <span class="hljs-number">1.1</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">min</span>(v <span class="hljs-keyword">for</span> _, _, v <span class="hljs-keyword">in</span> log) &gt; -<span class="hljs-number">0.05</span>                                 <span class="hljs-comment"># no significant rollback</span>
    <span class="hljs-keyword">assert</span> log[-<span class="hljs-number">1</span>][<span class="hljs-number">1</span>] == <span class="hljs-string">&quot;running&quot;</span>                                            <span class="hljs-comment"># reset after the fault cleared, restarted</span>
    rb = <span class="hljs-built_in">min</span>(v <span class="hljs-keyword">for</span> _, _, v <span class="hljs-keyword">in</span> log); <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;escalated to the emergency brake after <span class="hljs-subst">{first[<span class="hljs-string">&#x27;emergency stop&#x27;</span>][<span class="hljs-number">0</span>] - first[<span class="hljs-string">&#x27;controlled stop&#x27;</span>][<span class="hljs-number">0</span>]:<span class="hljs-number">.2</span>f}</span> s; &quot;</span>
                                          <span class="hljs-string">f&quot;lowest speed <span class="hljs-subst">{rb:<span class="hljs-number">.3</span>f}</span> m/s; restarted after reset&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_plausibility</span>():
    <span class="hljs-keyword">for</span> name, v, vr <span class="hljs-keyword">in</span> [(<span class="hljs-string">&quot;overspeed&quot;</span>, <span class="hljs-number">5.8</span>, <span class="hljs-number">5.8</span>), (<span class="hljs-string">&quot;rope slip&quot;</span>, <span class="hljs-number">5.0</span>, <span class="hljs-number">4.4</span>), (<span class="hljs-string">&quot;rollback&quot;</span>, -<span class="hljs-number">0.2</span>, -<span class="hljs-number">0.2</span>)]:
        sup = Supervisor(); sup.state = <span class="hljs-string">&quot;running&quot;</span>; sup.step(<span class="hljs-built_in">set</span>(), <span class="hljs-literal">None</span>, v, vr, <span class="hljs-number">0.0</span>)
        <span class="hljs-keyword">assert</span> sup.state == <span class="hljs-string">&quot;emergency stop&quot;</span> <span class="hljs-keyword">and</span> name <span class="hljs-keyword">in</span> sup.latched
    sup = Supervisor(); sup.state = <span class="hljs-string">&quot;running&quot;</span>; sup.step(<span class="hljs-built_in">set</span>(), <span class="hljs-literal">None</span>, <span class="hljs-number">5.6</span>, <span class="hljs-number">5.4</span>, <span class="hljs-number">0.0</span>); <span class="hljs-keyword">assert</span> sup.state == <span class="hljs-string">&quot;running&quot;</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;speed checks: 5.8 m/s overspeed, 0.6 m/s rope slip and -0.2 m/s rollback each trip; 5.6 m/s with 0.2 m/s mismatch does not&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_stopping_distances</span>():
    <span class="hljs-keyword">for</span> name, a <span class="hljs-keyword">in</span> [(<span class="hljs-string">&quot;normal stop&quot;</span>, A_RUN), (<span class="hljs-string">&quot;controlled stop&quot;</span>, A_CTRL), (<span class="hljs-string">&quot;emergency brake&quot;</span>, A_EMRG)]:
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: from <span class="hljs-subst">{V_NOM}</span> m/s in <span class="hljs-subst">{V_NOM / a:<span class="hljs-number">.2</span>f}</span> s over <span class="hljs-subst">{V_NOM**<span class="hljs-number">2</span> / (<span class="hljs-number">2</span> * a):<span class="hljs-number">.2</span>f}</span> m&quot;</span>)

test_all_faults_all_states(); test_escalation_and_reset(); test_plausibility(); test_stopping_distances(); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>The logic would be written in Python first, as here, to test it exhaustively, then implemented on a safety PLC with redundant channels, certified speed monitors and hard-wired safety circuits along the line. Every state–fault pair from the table becomes an acceptance test on the real installation, witnessed and recorded.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>How far does the line run in a controlled stop that escalates after 1 s of coasting at 0.4 m/s²?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>In 1 s it slows to 4.6 m/s and covers 4.8 m, then brakes from 4.6 m/s at 1.6 m/s²: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord">4.</span><span class="mord"><span class="mord">6</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mord">/3.2</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6.6</span></span></span></span> m. Total 11.4 m, still less than the 15.62 m of a normal controlled stop.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why is a brake fault a category 0 stop rather than category 1?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A controlled stop relies on the brakes to hold the line at the end. If one brake is suspect, the line should stop while the other is known to work, using everything available, rather than run on and risk having neither.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l15"></div>
`,i=[{id:`stops-and-brakes`,title:`Stops and brakes`},{id:`plausibility`,title:`Plausibility`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l15-q1`,type:`num`,q:`<p>Emergency stopping distance from 5 m/s at 1.6 m/s² (m)?</p>
`,explain:`<p>v²/2a.</p>
`,answer:7.81,tol:.005,unit:``},{id:`p20-l15-q2`,type:`num`,q:`<p>Overspeed threshold for 5 m/s at 115 % (m/s)?</p>
`,explain:`<p>Ratio times nominal.</p>
`,answer:5.75,tol:.001,unit:``},{id:`p20-l15-q3`,type:`num`,q:`<p>Rope slip threshold for 5 m/s (m/s)?</p>
`,explain:`<p>0.05 v_nom + 0.1.</p>
`,answer:.35,tol:.001,unit:``},{id:`p20-l15-q4`,type:`num`,q:`<p>State-fault pairs for 7 states and 9 faults?</p>
`,explain:`<p>Exhaustive product.</p>
`,answer:63,tol:.001,unit:``},{id:`p20-l15-q5`,type:`mc`,q:`<p>What must happen after any fault before the line restarts?</p>
`,explain:`<p>Faults latch.</p>
`,options:[`Nothing, it restarts itself`,`A timeout`,`A power cycle`,`A reset with no fault present`],answer:3},{id:`p20-l15-q6`,type:`mc`,q:`<p>What does escalation protect against?</p>
`,explain:`<p>The emergency brake takes over.</p>
`,options:[`High wind`,`Sensor noise`,`A drive that cannot brake during a controlled stop`,`A slow reset`],answer:2}],o=[{file:`rope_drive_supervisor.py`,lang:`python`,src:`import itertools

# EDUCATIONAL model of a rope-drive supervisor; real installations follow EN 12929, EN 13243 and the
# authorities' rules, with certified safety hardware. All values are illustrative.
V_NOM, A_RUN = 5.0, 0.3                      # line speed (m/s), normal acceleration and stop (m/s^2)
A_CTRL, A_EMRG = 0.8, 1.6                    # controlled stop by the drive; emergency (mechanical) brake (m/s^2)
A_ROLLBACK = 0.4                             # an uphill loaded line rolls back at this rate with no torque or brake
DT = 0.01                                    # 100 Hz supervisor

CAT0 = {"estop", "derailment", "overspeed", "rollback", "rope slip", "brake fault"}   # stop at once: torque off, brakes on
CAT1 = {"wind high", "safety line lost", "drive fault"}                              # controlled stop, then brakes
FAULTS = sorted(CAT0 | CAT1)
STATES = ["stopped", "starting", "running", "stopping", "controlled stop", "emergency stop", "locked out"]

class Supervisor:
    def __init__(s):
        s.state, s.latched, s.t_stop = "stopped", set(), 0.0
    def outputs(s):
        """drive torque enabled, brakes applied"""
        return s.state in ("starting", "running", "stopping", "controlled stop"), s.state in ("stopped", "emergency stop", "locked out")
    def step(s, faults, cmd, v, v_rope, a_meas):
        """faults: active fault inputs; cmd: 'start', 'stop', 'reset' or None; v bullwheel speed, v_rope rope speed"""
        if v > 1.15 * V_NOM: faults = faults | {"overspeed"}                  # plausibility checks inside the supervisor
        if v < -0.1: faults = faults | {"rollback"}
        if abs(v - v_rope) > 0.05 * V_NOM + 0.1: faults = faults | {"rope slip"}
        s.latched |= faults
        if s.state == "locked out":
            if cmd == "reset" and not faults: s.latched = set(); s.state = "stopped"
        elif s.state == "emergency stop" and abs(v) < 0.02: s.state = "locked out"          # standstill reached: lock out
        elif faults & CAT0 or (s.state == "controlled stop" and s.t_stop > 1.0 and a_meas > -0.75 * A_CTRL):
            s.state = "emergency stop"                                    # stop at once, or escalate if the drive does not brake
        elif faults & CAT1 and s.state in ("starting", "running", "stopping"):
            s.state, s.t_stop = "controlled stop", 0.0
        elif s.state == "stopped":
            if s.latched: s.state = "locked out"
            elif cmd == "start": s.state = "starting"
        elif s.state == "starting" and v >= V_NOM - 1e-6: s.state = "running"
        elif s.state in ("starting", "running") and cmd == "stop": s.state = "stopping"
        elif s.state in ("stopping", "controlled stop") and abs(v) < 0.02:
            s.state = "locked out" if s.latched else "stopped"
        s.t_stop += DT
        return s.state

def drive(sup, v, faults):
    """line dynamics: the drive follows its ramp when it has torque; brakes decelerate; with neither, it rolls back"""
    torque, brakes = sup.outputs()
    if brakes:
        cap = A_EMRG * (0.6 if "brake fault" in faults else 1.0)           # two brakes: one failed still stops the line
        if abs(v) <= cap * DT: return 0.0, 0.0
        a = -cap if v > 0 else cap
    elif torque and "drive fault" not in faults:
        a = {"starting": A_RUN, "running": 0.0, "stopping": -A_RUN, "controlled stop": -A_CTRL}[sup.state]
        if sup.state == "starting": a = min(a, (V_NOM - v) / DT)
    else: a = -A_ROLLBACK                                                 # no torque, no brake: the loaded line slows and reverses
    return v + a * DT, a

# how to reach each state: commands and a brief fault pulse, and when to inject the fault under test
REACH = {"stopped": ([], None, 0.5), "starting": ([("start", 0.0)], None, 2.0), "running": ([("start", 0.0)], None, 25.0),
         "stopping": ([("start", 0.0), ("stop", 20.0)], None, 22.0), "controlled stop": ([("start", 0.0)], ("wind high", 20.0), 21.0),
         "emergency stop": ([("start", 0.0)], ("estop", 20.0), 20.5), "locked out": ([("start", 0.0)], ("estop", 20.0), 30.0)}

def run_scenario(start_state, fault, hold=40.0):
    sup = Supervisor(); v = a = t = 0.0; plan, pulse, t_inj = REACH[start_state]; peak = 0.0
    while t < t_inj + hold:
        cmd = next((c for c, tc in plan if abs(t - tc) < DT / 2), None)
        faults = {pulse[0]} if pulse and pulse[1] <= t < pulse[1] + 0.1 else set()
        if abs(t - t_inj) < DT / 2: assert sup.state == start_state, (start_state, sup.state)
        if t >= t_inj: faults.add(fault)
        sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults)
        if t >= t_inj: peak = max(peak, abs(a))
        t += DT
    for c in ("reset", "start", "reset", "start"):                         # try to restart with the fault still present
        sup.step({fault}, c, v, v, 0.0); v, a = drive(sup, v, {fault})
    torque, brakes = sup.outputs()
    return dict(state=sup.state, v=v, torque=torque, brakes=brakes, peak=peak, latched=fault in sup.latched)

def test_all_faults_all_states():
    worst = 0.0; n = 0
    for st, f in itertools.product(STATES, FAULTS):
        r = run_scenario(st, f); n += 1
        assert r["state"] == "locked out" and abs(r["v"]) < 0.02 and not r["torque"] and r["brakes"] and r["latched"], (st, f, r)
        worst = max(worst, r["peak"])
    print(f"{n} state-fault pairs: every one ends locked out, stopped, torque off, brakes on, and refuses restart with the fault present")
    print(f"largest deceleration seen: {worst:.2f} m/s^2 (emergency brake {A_EMRG})")
    assert worst <= A_EMRG + 1e-9

def test_escalation_and_reset():
    sup = Supervisor(); v = a = 0.0; t = 0.0; log = []
    while t < 70:
        cmd = "start" if t < DT else ("reset" if 45 < t < 45 + DT else ("start" if 46 < t < 46 + DT else None))
        faults = {"drive fault"} if 20 <= t < 30 else set()
        st = sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults); log.append((round(t, 2), st, v)); t += DT
    first = {}
    for tt, st, vv in log: first.setdefault(st, (tt, vv))
    print("drive fault at 20 s:", {k: f"{v[0]:.2f} s" for k, v in first.items()})
    assert first["controlled stop"][0] >= 20 and first["emergency stop"][0] - first["controlled stop"][0] <= 1.1
    assert min(v for _, _, v in log) > -0.05                                 # no significant rollback
    assert log[-1][1] == "running"                                            # reset after the fault cleared, restarted
    rb = min(v for _, _, v in log); print(f"escalated to the emergency brake after {first['emergency stop'][0] - first['controlled stop'][0]:.2f} s; "
                                          f"lowest speed {rb:.3f} m/s; restarted after reset")

def test_plausibility():
    for name, v, vr in [("overspeed", 5.8, 5.8), ("rope slip", 5.0, 4.4), ("rollback", -0.2, -0.2)]:
        sup = Supervisor(); sup.state = "running"; sup.step(set(), None, v, vr, 0.0)
        assert sup.state == "emergency stop" and name in sup.latched
    sup = Supervisor(); sup.state = "running"; sup.step(set(), None, 5.6, 5.4, 0.0); assert sup.state == "running"
    print("speed checks: 5.8 m/s overspeed, 0.6 m/s rope slip and -0.2 m/s rollback each trip; 5.6 m/s with 0.2 m/s mismatch does not")

def test_stopping_distances():
    for name, a in [("normal stop", A_RUN), ("controlled stop", A_CTRL), ("emergency brake", A_EMRG)]:
        print(f"{name}: from {V_NOM} m/s in {V_NOM / a:.2f} s over {V_NOM**2 / (2 * a):.2f} m")

test_all_faults_all_states(); test_escalation_and_reset(); test_plausibility(); test_stopping_distances(); print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};