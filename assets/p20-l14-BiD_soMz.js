var e=`p20-l14`,t=45,n=`A pump controller for a Bali-style terrace irrigation tank. You find the pump’s operating point from its curve and the pipe, control the tank level with hysteresis, protect the pump with independent dry-run checks on the sump level, a float switch and the motor current, limit its starts, and prove over simulated weeks that it never runs dry for more than a couple of seconds even when sensors fail.`,r=`<h2 id="pump-pipe-and-tank">Pump, pipe and tank</h2>
<p>On Bali’s terraced fields, water from the subak canals is shared on schedules; a small pump can lift it from a sump into a header tank that feeds the upper terraces by gravity. A centrifugal pump delivers head <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0813em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1002em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span>; the pipe needs the static lift plus friction, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0813em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0085em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span>. The pump runs where they meet:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9331em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal">Q</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7387em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:3.04em;vertical-align:-1.212em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.828em;"><span class="svg-align" style="top:-5em;"><span class="pstrut" style="height:5em;"></span><span class="mord" style="padding-left:1em;"><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3603em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0813em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0813em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.9721em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span></span></span><span style="top:-3.788em;"><span class="pstrut" style="height:5em;"></span><span class="hide-tail" style="min-width:1.02em;height:3.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="3.08em" viewBox="0 0 400000 3240" preserveAspectRatio="xMinYMin slice"><path d="M473,2793
c339.3,-1799.3,509.3,-2700,510,-2702 l0 -0
c3.3,-7.3,9.3,-11,18,-11 H400000v40H1017.7
s-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9
c-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200
c0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26
s76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,
606zM1001 80h400000v40H1017.7z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.212em;"><span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>The tank level is controlled by hysteresis: start below 60 %, stop at 90 %. The gap sets how often the pump starts, and motors allow only a few starts per hour.</p>
<h2 id="never-run-dry">Never run dry</h2>
<p>A centrifugal pump running without water overheats its seal within minutes. Three independent signals guard it: the sump level sensor, a float switch, and the motor current, which drops when the pump loses its water. The level and float stop the pump and allow a restart once the sump has refilled; low current for 3 of the last 30 seconds latches a lockout with a retry after 10 minutes, which also catches a pump that sucks air on and off.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="pumptank" data-args="{}"></div></div><figcaption>The sump, pump and header tank over a day of irrigation rounds. Change the canal inflow and the hysteresis, and fail the sensors; the readout counts starts, empty-tank time and dry running.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Illustrative system: 8 m² tank (1.5 m deep), 5 m² sump, 6 m lift, pump <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0813em;">H</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:-0.0813em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">14</span></span></span></span> m, irrigation rounds at 3 L/s from 6 to 9 and 15 to 18, a week of simulation at 1 s steps:</p>
<ol>
<li>Operating point 5.44 L/s at 8.67 m; filling from 60 % to 90 % takes 11.0 min without demand.</li>
<li>Normal week: 32.5 h of running, 108 starts (at most 2 per hour), no dry running, the tank never empty.</li>
<li>Half the canal inflow: the tank is empty for 8.2 h, because supply is below demand. No controller can fix that; it is a sizing result.</li>
<li>Float switch stuck: the level sensor still protects the pump. Level sensor failed high: the float switch stops it (366 starts, at most 6 per hour).</li>
<li>Both level sensors failed: the current monitor makes 254 lockouts with 508 s of dry running in a week, 2 s each.</li>
<li>Canal dry: one run, then the pump stays off.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">irrigation_pump.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> math
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-comment"># terrace header tank fed by a pump from a sump that the canal fills; all values illustrative</span>
A_TANK, A_SUMP = <span class="hljs-number">8.0</span>, <span class="hljs-number">5.0</span>                    <span class="hljs-comment"># tank and sump areas (m^2)</span>
H_TANK, H_SUMP = <span class="hljs-number">1.5</span>, <span class="hljs-number">1.2</span>                    <span class="hljs-comment"># usable depths (m)</span>
LIFT = <span class="hljs-number">6.0</span>                                   <span class="hljs-comment"># static head from the sump to the tank inlet (m)</span>
H0, KP = <span class="hljs-number">14.0</span>, <span class="hljs-number">1.8e5</span>                         <span class="hljs-comment"># pump curve H = H0 - KP Q^2 (m, Q in m^3/s)</span>
R_PIPE = <span class="hljs-number">0.9e5</span>                               <span class="hljs-comment"># pipe losses r Q^2</span>
START, STOP = <span class="hljs-number">0.60</span>, <span class="hljs-number">0.90</span>                     <span class="hljs-comment"># tank level hysteresis (fraction of full)</span>
SUMP_MIN, SUMP_RESTART = <span class="hljs-number">0.25</span>, <span class="hljs-number">0.80</span>          <span class="hljs-comment"># dry-run protection on the sump level (m)</span>
MAX_STARTS_PER_HOUR = <span class="hljs-number">6</span>                      <span class="hljs-comment"># motor limit</span>
I_RUN, I_DRY = <span class="hljs-number">4.0</span>, <span class="hljs-number">2.2</span>                      <span class="hljs-comment"># running current with water and when running dry (A)</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">operating_point</span>():
    <span class="hljs-string">&quot;&quot;&quot;pump curve meets system curve: H0 - KP Q^2 = LIFT + R Q^2&quot;&quot;&quot;</span>
    Q = np.sqrt((H0 - LIFT) / (KP + R_PIPE)); <span class="hljs-keyword">return</span> Q, H0 - KP * Q**<span class="hljs-number">2</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">PumpController</span>:
    <span class="hljs-string">&quot;&quot;&quot;runs every second, as the firmware would: level hysteresis, sump interlock, current check, start limit&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">s</span>):
        s.on, s.locked, s.starts, s.lock_t, s.low = <span class="hljs-literal">False</span>, <span class="hljs-literal">False</span>, [], <span class="hljs-number">0.0</span>, []
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">update</span>(<span class="hljs-params">s, t, tank, sump, current, sump_ok_switch</span>):
        s.starts = [x <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> s.starts <span class="hljs-keyword">if</span> t - x &lt; <span class="hljs-number">3600</span>]
        dry = sump &lt; SUMP_MIN <span class="hljs-keyword">or</span> <span class="hljs-keyword">not</span> sump_ok_switch                       <span class="hljs-comment"># two independent sensors, either one stops it</span>
        <span class="hljs-keyword">if</span> s.on:
            s.low = (s.low + [current &lt; <span class="hljs-number">0.7</span> * I_RUN])[-<span class="hljs-number">30</span>:]                 <span class="hljs-comment"># last 30 s of current checks</span>
            <span class="hljs-keyword">if</span> <span class="hljs-built_in">sum</span>(s.low) &gt;= <span class="hljs-number">3</span>:                                            <span class="hljs-comment"># 3 low seconds: running dry, or sucking air on and off</span>
                s.on, s.locked, s.lock_t = <span class="hljs-literal">False</span>, <span class="hljs-literal">True</span>, t                  <span class="hljs-comment"># latch, retry after 10 minutes</span>
            <span class="hljs-keyword">elif</span> dry: s.on = <span class="hljs-literal">False</span>                                         <span class="hljs-comment"># sump low: stop, restart when it has refilled</span>
            <span class="hljs-keyword">elif</span> tank &gt;= STOP: s.on = <span class="hljs-literal">False</span>
        <span class="hljs-keyword">else</span>:
            <span class="hljs-keyword">if</span> s.locked <span class="hljs-keyword">and</span> sump &gt;= SUMP_RESTART <span class="hljs-keyword">and</span> sump_ok_switch <span class="hljs-keyword">and</span> t - s.lock_t &gt; <span class="hljs-number">600</span>: s.locked = <span class="hljs-literal">False</span>
            <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> s.locked <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> dry <span class="hljs-keyword">and</span> sump &gt;= SUMP_RESTART <span class="hljs-keyword">and</span> tank &lt;= START <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(s.starts) &lt; MAX_STARTS_PER_HOUR:
                s.on = <span class="hljs-literal">True</span>; s.starts.append(t); s.low = []
        <span class="hljs-keyword">return</span> s.on

<span class="hljs-keyword">def</span> <span class="hljs-title function_">simulate</span>(<span class="hljs-params">days=<span class="hljs-number">7</span>, seed=<span class="hljs-number">0</span>, inflow_scale=<span class="hljs-number">1.0</span>, stuck_switch=<span class="hljs-literal">False</span>, failed_level=<span class="hljs-literal">False</span></span>):
    rng = np.random.default_rng(seed); Q, _ = operating_point(); c = PumpController()
    N = days * <span class="hljs-number">86400</span>; nz = rng.standard_normal((<span class="hljs-number">3</span>, N))                   <span class="hljs-comment"># demand, level and current noise, drawn up front</span>
    tank, sump = <span class="hljs-number">0.5</span> * H_TANK, <span class="hljs-number">0.8</span> * H_SUMP; log = <span class="hljs-built_in">dict</span>(dry_s=<span class="hljs-number">0</span>, lockouts=<span class="hljs-number">0</span>, empty_s=<span class="hljs-number">0</span>, starts=<span class="hljs-number">0</span>, max_starts_h=<span class="hljs-number">0</span>, run_s=<span class="hljs-number">0</span>, min_sump=<span class="hljs-number">9.0</span>)
    <span class="hljs-keyword">for</span> t <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N):
        hour = (t / <span class="hljs-number">3600</span>) % <span class="hljs-number">24</span>
        demand = (<span class="hljs-number">0.003</span> <span class="hljs-keyword">if</span> <span class="hljs-number">6</span> &lt;= hour &lt; <span class="hljs-number">9</span> <span class="hljs-keyword">or</span> <span class="hljs-number">15</span> &lt;= hour &lt; <span class="hljs-number">18</span> <span class="hljs-keyword">else</span> <span class="hljs-number">0.0004</span>) * (<span class="hljs-number">1</span> + <span class="hljs-number">0.3</span> * nz[<span class="hljs-number">0</span>, t])  <span class="hljs-comment"># irrigation rounds</span>
        inflow = inflow_scale * <span class="hljs-number">0.003</span> * (<span class="hljs-number">1</span> + <span class="hljs-number">0.15</span> * math.sin(<span class="hljs-number">2</span> * math.pi * t / <span class="hljs-number">259200</span>))                     <span class="hljs-comment"># canal, dry season</span>
        sump_meas = <span class="hljs-number">9.0</span> <span class="hljs-keyword">if</span> failed_level <span class="hljs-keyword">else</span> sump + <span class="hljs-number">0.005</span> * nz[<span class="hljs-number">1</span>, t]
        sw_ok = <span class="hljs-literal">True</span> <span class="hljs-keyword">if</span> stuck_switch <span class="hljs-keyword">else</span> sump &gt; <span class="hljs-number">0.20</span>
        current = (I_RUN <span class="hljs-keyword">if</span> sump &gt; <span class="hljs-number">0.05</span> <span class="hljs-keyword">else</span> I_DRY) + <span class="hljs-number">0.05</span> * nz[<span class="hljs-number">2</span>, t]
        was_on, was_locked = c.on, c.locked; on = c.update(t, tank / H_TANK, sump_meas, current, sw_ok)
        <span class="hljs-keyword">if</span> on <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> was_on: log[<span class="hljs-string">&quot;starts&quot;</span>] += <span class="hljs-number">1</span>
        <span class="hljs-keyword">if</span> c.locked <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> was_locked: log[<span class="hljs-string">&quot;lockouts&quot;</span>] += <span class="hljs-number">1</span>
        log[<span class="hljs-string">&quot;max_starts_h&quot;</span>] = <span class="hljs-built_in">max</span>(log[<span class="hljs-string">&quot;max_starts_h&quot;</span>], <span class="hljs-built_in">len</span>(c.starts))
        q = Q <span class="hljs-keyword">if</span> on <span class="hljs-keyword">and</span> sump &gt; <span class="hljs-number">0.05</span> <span class="hljs-keyword">else</span> <span class="hljs-number">0.0</span>
        <span class="hljs-keyword">if</span> on: log[<span class="hljs-string">&quot;run_s&quot;</span>] += <span class="hljs-number">1</span>
        <span class="hljs-keyword">if</span> on <span class="hljs-keyword">and</span> sump &lt;= <span class="hljs-number">0.05</span>: log[<span class="hljs-string">&quot;dry_s&quot;</span>] += <span class="hljs-number">1</span>                          <span class="hljs-comment"># pump running with no water at its intake</span>
        sump = <span class="hljs-built_in">min</span>(<span class="hljs-built_in">max</span>(sump + (inflow - q) / A_SUMP, <span class="hljs-number">0.0</span>), H_SUMP)
        out = <span class="hljs-built_in">min</span>(<span class="hljs-built_in">max</span>(demand, <span class="hljs-number">0</span>), tank * A_TANK)
        tank = <span class="hljs-built_in">min</span>(<span class="hljs-built_in">max</span>(tank + (q - out) / A_TANK, <span class="hljs-number">0.0</span>), H_TANK)
        <span class="hljs-keyword">if</span> tank &lt;= <span class="hljs-number">0.001</span>: log[<span class="hljs-string">&quot;empty_s&quot;</span>] += <span class="hljs-number">1</span>
        log[<span class="hljs-string">&quot;min_sump&quot;</span>] = <span class="hljs-built_in">min</span>(log[<span class="hljs-string">&quot;min_sump&quot;</span>], sump)
    <span class="hljs-keyword">return</span> log

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_operating_point</span>():
    Q, H = operating_point(); <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;operating point: <span class="hljs-subst">{<span class="hljs-number">1000</span> * Q:<span class="hljs-number">.2</span>f}</span> L/s at <span class="hljs-subst">{H:<span class="hljs-number">.2</span>f}</span> m; fills the tank from 60 % to 90 % &quot;</span>
                                     <span class="hljs-string">f&quot;in <span class="hljs-subst">{<span class="hljs-number">0.3</span> * H_TANK * A_TANK / Q / <span class="hljs-number">60</span>:<span class="hljs-number">.1</span>f}</span> min with no demand&quot;</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(H0 - KP * Q**<span class="hljs-number">2</span> - (LIFT + R_PIPE * Q**<span class="hljs-number">2</span>)) &lt; <span class="hljs-number">1e-9</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_week</span>():
    <span class="hljs-keyword">for</span> name, kw <span class="hljs-keyword">in</span> [(<span class="hljs-string">&quot;normal week&quot;</span>, {}), (<span class="hljs-string">&quot;low canal (50 % inflow)&quot;</span>, <span class="hljs-built_in">dict</span>(inflow_scale=<span class="hljs-number">0.5</span>)),
                     (<span class="hljs-string">&quot;level switch stuck OK&quot;</span>, <span class="hljs-built_in">dict</span>(stuck_switch=<span class="hljs-literal">True</span>, inflow_scale=<span class="hljs-number">0.5</span>)),
                     (<span class="hljs-string">&quot;level sensor failed high&quot;</span>, <span class="hljs-built_in">dict</span>(failed_level=<span class="hljs-literal">True</span>, inflow_scale=<span class="hljs-number">0.5</span>)),
                     (<span class="hljs-string">&quot;both level sensors failed&quot;</span>, <span class="hljs-built_in">dict</span>(failed_level=<span class="hljs-literal">True</span>, stuck_switch=<span class="hljs-literal">True</span>, inflow_scale=<span class="hljs-number">0.5</span>)),
                     (<span class="hljs-string">&quot;canal dry&quot;</span>, <span class="hljs-built_in">dict</span>(inflow_scale=<span class="hljs-number">0.0</span>))]:
        L = simulate(**kw)
        <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{name}</span>: pump ran <span class="hljs-subst">{L[<span class="hljs-string">&#x27;run_s&#x27;</span>] / <span class="hljs-number">3600</span>:<span class="hljs-number">.1</span>f}</span> h, <span class="hljs-subst">{L[<span class="hljs-string">&#x27;starts&#x27;</span>]}</span> starts (max <span class="hljs-subst">{L[<span class="hljs-string">&#x27;max_starts_h&#x27;</span>]}</span> per hour), &quot;</span>
              <span class="hljs-string">f&quot;dry running <span class="hljs-subst">{L[<span class="hljs-string">&#x27;dry_s&#x27;</span>]}</span> s (<span class="hljs-subst">{L[<span class="hljs-string">&#x27;lockouts&#x27;</span>]}</span> dry-run lockouts), tank empty <span class="hljs-subst">{L[<span class="hljs-string">&#x27;empty_s&#x27;</span>] / <span class="hljs-number">3600</span>:<span class="hljs-number">.1</span>f}</span> h, lowest sump <span class="hljs-subst">{L[<span class="hljs-string">&#x27;min_sump&#x27;</span>]:<span class="hljs-number">.3</span>f}</span> m&quot;</span>)
        <span class="hljs-keyword">assert</span> L[<span class="hljs-string">&quot;dry_s&quot;</span>] &lt;= <span class="hljs-number">3</span> * <span class="hljs-built_in">max</span>(<span class="hljs-number">1</span>, L[<span class="hljs-string">&quot;starts&quot;</span>]) <span class="hljs-keyword">and</span> L[<span class="hljs-string">&quot;max_starts_h&quot;</span>] &lt;= MAX_STARTS_PER_HOUR   <span class="hljs-comment"># never runs dry for long</span>
        <span class="hljs-keyword">if</span> name == <span class="hljs-string">&quot;normal week&quot;</span>: <span class="hljs-keyword">assert</span> L[<span class="hljs-string">&quot;empty_s&quot;</span>] == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> L[<span class="hljs-string">&quot;dry_s&quot;</span>] == <span class="hljs-number">0</span>
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> kw.get(<span class="hljs-string">&quot;failed_level&quot;</span>) <span class="hljs-keyword">and</span> <span class="hljs-keyword">not</span> kw.get(<span class="hljs-string">&quot;stuck_switch&quot;</span>): <span class="hljs-keyword">assert</span> L[<span class="hljs-string">&quot;dry_s&quot;</span>] == <span class="hljs-number">0</span>

test_operating_point(); test_week(); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>On a microcontroller this controller is a 1 s loop, built and flashed with PlatformIO, reading an ultrasonic or pressure level sensor, a float switch and a current transformer, driving a contactor. Keep the float switch wired so a broken wire reads as “dry”. Agree pump schedules with the subak’s water sharing, and use a residual-current device on any pump near water.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does a wider level hysteresis reduce starts?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>More volume must be used before the pump restarts. With <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">Δ</span><span class="mord mathnormal" style="margin-right:0.2222em;">V</span></span></span></span> between start and stop and net flows in and out, each cycle takes longer, so starts per hour fall.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why latch the current trip but not the level stop?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A low sump is normal and clears by itself as the canal refills it. Low current with a “good” sump means a sensor or the pump is wrong, so the controller waits before trying again, and a person should check if it keeps happening.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p20-l14"></div>
`,i=[{id:`pump-pipe-and-tank`,title:`Pump, pipe and tank`},{id:`never-run-dry`,title:`Never run dry`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p20-l14-q1`,type:`num`,q:`<p>Operating flow for H0 14 m, lift 6 m, kp 1.8e5, r 0.9e5 (L/s)?</p>
`,explain:`<p>√((H0 − Hs)/(kp + r)).</p>
`,answer:5.443,tol:.005,unit:``},{id:`p20-l14-q2`,type:`num`,q:`<p>Time to fill 30 % of a 1.5 m deep 8 m² tank at 5.44 L/s (min)?</p>
`,explain:`<p>Volume over flow.</p>
`,answer:11.03,tol:.005,unit:``},{id:`p20-l14-q3`,type:`num`,q:`<p>Head delivered at the operating point (m)?</p>
`,explain:`<p>H0 − kp Q².</p>
`,answer:8.67,tol:.005,unit:``},{id:`p20-l14-q4`,type:`num`,q:`<p>Daily demand with 6 h at 3 L/s and 18 h at 0.4 L/s (m³)?</p>
`,explain:`<p>L/s × 3600 s/h ÷ 1000.</p>
`,answer:90.72,tol:.005,unit:``},{id:`p20-l14-q5`,type:`mc`,q:`<p>Which signal catches a pump running dry when both level sensors fail?</p>
`,explain:`<p>Current falls without water.</p>
`,options:[`Tank level`,`The start counter`,`Motor current`,`The clock`],answer:2},{id:`p20-l14-q6`,type:`mc`,q:`<p>The tank empties at half inflow. What is the fix?</p>
`,explain:`<p>Supply below demand cannot be controlled away.</p>
`,options:[`A tighter hysteresis`,`More supply or storage, it is a sizing problem`,`A faster loop`,`More starts per hour`],answer:1}],o=[{file:`irrigation_pump.py`,lang:`python`,src:`import math
import numpy as np

# terrace header tank fed by a pump from a sump that the canal fills; all values illustrative
A_TANK, A_SUMP = 8.0, 5.0                    # tank and sump areas (m^2)
H_TANK, H_SUMP = 1.5, 1.2                    # usable depths (m)
LIFT = 6.0                                   # static head from the sump to the tank inlet (m)
H0, KP = 14.0, 1.8e5                         # pump curve H = H0 - KP Q^2 (m, Q in m^3/s)
R_PIPE = 0.9e5                               # pipe losses r Q^2
START, STOP = 0.60, 0.90                     # tank level hysteresis (fraction of full)
SUMP_MIN, SUMP_RESTART = 0.25, 0.80          # dry-run protection on the sump level (m)
MAX_STARTS_PER_HOUR = 6                      # motor limit
I_RUN, I_DRY = 4.0, 2.2                      # running current with water and when running dry (A)

def operating_point():
    """pump curve meets system curve: H0 - KP Q^2 = LIFT + R Q^2"""
    Q = np.sqrt((H0 - LIFT) / (KP + R_PIPE)); return Q, H0 - KP * Q**2

class PumpController:
    """runs every second, as the firmware would: level hysteresis, sump interlock, current check, start limit"""
    def __init__(s):
        s.on, s.locked, s.starts, s.lock_t, s.low = False, False, [], 0.0, []
    def update(s, t, tank, sump, current, sump_ok_switch):
        s.starts = [x for x in s.starts if t - x < 3600]
        dry = sump < SUMP_MIN or not sump_ok_switch                       # two independent sensors, either one stops it
        if s.on:
            s.low = (s.low + [current < 0.7 * I_RUN])[-30:]                 # last 30 s of current checks
            if sum(s.low) >= 3:                                            # 3 low seconds: running dry, or sucking air on and off
                s.on, s.locked, s.lock_t = False, True, t                  # latch, retry after 10 minutes
            elif dry: s.on = False                                         # sump low: stop, restart when it has refilled
            elif tank >= STOP: s.on = False
        else:
            if s.locked and sump >= SUMP_RESTART and sump_ok_switch and t - s.lock_t > 600: s.locked = False
            if not s.locked and not dry and sump >= SUMP_RESTART and tank <= START and len(s.starts) < MAX_STARTS_PER_HOUR:
                s.on = True; s.starts.append(t); s.low = []
        return s.on

def simulate(days=7, seed=0, inflow_scale=1.0, stuck_switch=False, failed_level=False):
    rng = np.random.default_rng(seed); Q, _ = operating_point(); c = PumpController()
    N = days * 86400; nz = rng.standard_normal((3, N))                   # demand, level and current noise, drawn up front
    tank, sump = 0.5 * H_TANK, 0.8 * H_SUMP; log = dict(dry_s=0, lockouts=0, empty_s=0, starts=0, max_starts_h=0, run_s=0, min_sump=9.0)
    for t in range(N):
        hour = (t / 3600) % 24
        demand = (0.003 if 6 <= hour < 9 or 15 <= hour < 18 else 0.0004) * (1 + 0.3 * nz[0, t])  # irrigation rounds
        inflow = inflow_scale * 0.003 * (1 + 0.15 * math.sin(2 * math.pi * t / 259200))                     # canal, dry season
        sump_meas = 9.0 if failed_level else sump + 0.005 * nz[1, t]
        sw_ok = True if stuck_switch else sump > 0.20
        current = (I_RUN if sump > 0.05 else I_DRY) + 0.05 * nz[2, t]
        was_on, was_locked = c.on, c.locked; on = c.update(t, tank / H_TANK, sump_meas, current, sw_ok)
        if on and not was_on: log["starts"] += 1
        if c.locked and not was_locked: log["lockouts"] += 1
        log["max_starts_h"] = max(log["max_starts_h"], len(c.starts))
        q = Q if on and sump > 0.05 else 0.0
        if on: log["run_s"] += 1
        if on and sump <= 0.05: log["dry_s"] += 1                          # pump running with no water at its intake
        sump = min(max(sump + (inflow - q) / A_SUMP, 0.0), H_SUMP)
        out = min(max(demand, 0), tank * A_TANK)
        tank = min(max(tank + (q - out) / A_TANK, 0.0), H_TANK)
        if tank <= 0.001: log["empty_s"] += 1
        log["min_sump"] = min(log["min_sump"], sump)
    return log

def test_operating_point():
    Q, H = operating_point(); print(f"operating point: {1000 * Q:.2f} L/s at {H:.2f} m; fills the tank from 60 % to 90 % "
                                     f"in {0.3 * H_TANK * A_TANK / Q / 60:.1f} min with no demand")
    assert abs(H0 - KP * Q**2 - (LIFT + R_PIPE * Q**2)) < 1e-9

def test_week():
    for name, kw in [("normal week", {}), ("low canal (50 % inflow)", dict(inflow_scale=0.5)),
                     ("level switch stuck OK", dict(stuck_switch=True, inflow_scale=0.5)),
                     ("level sensor failed high", dict(failed_level=True, inflow_scale=0.5)),
                     ("both level sensors failed", dict(failed_level=True, stuck_switch=True, inflow_scale=0.5)),
                     ("canal dry", dict(inflow_scale=0.0))]:
        L = simulate(**kw)
        print(f"{name}: pump ran {L['run_s'] / 3600:.1f} h, {L['starts']} starts (max {L['max_starts_h']} per hour), "
              f"dry running {L['dry_s']} s ({L['lockouts']} dry-run lockouts), tank empty {L['empty_s'] / 3600:.1f} h, lowest sump {L['min_sump']:.3f} m")
        assert L["dry_s"] <= 3 * max(1, L["starts"]) and L["max_starts_h"] <= MAX_STARTS_PER_HOUR   # never runs dry for long
        if name == "normal week": assert L["empty_s"] == 0 and L["dry_s"] == 0
        if not kw.get("failed_level") and not kw.get("stuck_switch"): assert L["dry_s"] == 0

test_operating_point(); test_week(); print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};