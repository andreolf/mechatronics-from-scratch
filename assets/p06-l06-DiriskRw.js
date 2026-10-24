var e=`p06-l06`,t=45,n=`A truth table says what a circuit computes; a simulator says when. You build an event-driven gate-level simulator with propagation delays, watch it produce a glitch that the Boolean algebra says can’t exist, simulate a 4-bit adder netlist, and check the same adder in Verilog with Icarus.`,r=`<h2 id="events-not-time-steps">Events, not time steps</h2>
<p>Digital signals change rarely compared with how finely you’d need to sample time. An <strong>event-driven</strong> simulator only does work when something changes:</p>
<ol>
<li>Keep a priority queue of events (time, net, new value).</li>
<li>Pop the earliest event. If the net’s value really changes, look up every gate driven by that net.</li>
<li>Re-evaluate each of those gates. If its output will change, schedule a new event at <em>now + gate delay</em>.</li>
<li>Repeat until the queue is empty or a time limit is reached.</li>
</ol>
<p>This is how Verilog simulators such as Icarus work, and how a logic analyser’s view of your circuit can be predicted.</p>
<h2 id="glitches">Glitches</h2>
<p>Take <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">Y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">A</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span></span></span></span>, which is always 0 in Boolean algebra. Built from gates, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span></span></span></span> comes through an inverter with delay <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">in</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">v</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. When A rises, for <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">in</span><span class="mord mathnormal mtight" style="margin-right:0.0359em;">v</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> both AND inputs are 1, and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.2222em;">Y</span></span></span></span> pulses high. That’s a <strong>static hazard</strong>. The same thing happens in real decoders and adders whenever two paths to one gate have different delays.</p>
<p>Glitches don’t matter in synchronous logic if the outputs settle before the next clock edge (lesson 11). They matter a lot when a combinational output drives something directly: an asynchronous reset, a chip select, or a clock.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="glitch" data-args="{}"></div></div><figcaption>Y = A·(NOT A) through real gates. Logically Y is always 0, but it pulses high for as long as the inverter delay.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Inverter delay 2 ns, AND gate delay 1 ns; A rises at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span> ns.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span>: event A = 1. The AND gate sees (1, 1) because <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span></span></span></span> still reads 1, so it schedules Y = 1 at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6</span></span></span></span>.</li>
<li>The inverter schedules <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span> at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">7</span></span></span></span>.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">6</span></span></span></span>: Y = 1. <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">7</span></span></span></span>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>, the AND re-evaluates and schedules Y = 0 at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord mathnormal">t</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span></span></span></span>.</li>
<li>Y is high from 6 to 8 ns: a 2 ns glitch, exactly the inverter delay.</li>
<li>When A falls, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span></span></span></span> rises 2 ns later and the AND sees (0, 1) throughout: no glitch on the falling edge.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">eventsim.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> heapq
<span class="hljs-keyword">from</span> itertools <span class="hljs-keyword">import</span> count

OPS = {<span class="hljs-string">&quot;AND&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a &amp; b, <span class="hljs-string">&quot;OR&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a | b, <span class="hljs-string">&quot;XOR&quot;</span>: <span class="hljs-keyword">lambda</span> a, b: a ^ b, <span class="hljs-string">&quot;NOT&quot;</span>: <span class="hljs-keyword">lambda</span> a: <span class="hljs-number">1</span> - a}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Sim</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.gates, <span class="hljs-variable language_">self</span>.val, <span class="hljs-variable language_">self</span>.fanout, <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.trace, <span class="hljs-variable language_">self</span>.seq = [], {}, {}, [], {}, count()

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">gate</span>(<span class="hljs-params">self, op, out, *ins, delay=<span class="hljs-number">1.0</span></span>):
        g = (op, out, ins, delay)
        <span class="hljs-variable language_">self</span>.gates.append(g)
        <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> ins:
            <span class="hljs-variable language_">self</span>.fanout.setdefault(n, []).append(g)
        <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> (out, *ins):
            <span class="hljs-variable language_">self</span>.val.setdefault(n, <span class="hljs-number">0</span>)

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">settle_initial</span>(<span class="hljs-params">self</span>):
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(<span class="hljs-variable language_">self</span>.gates)):                       <span class="hljs-comment"># propagate initial values without timing</span>
            <span class="hljs-keyword">for</span> op, out, ins, _ <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.gates:
                <span class="hljs-variable language_">self</span>.val[out] = OPS[op](*(<span class="hljs-variable language_">self</span>.val[i] <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> ins))

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">drive</span>(<span class="hljs-params">self, t, net, v</span>):
        heapq.heappush(<span class="hljs-variable language_">self</span>.q, (t, <span class="hljs-built_in">next</span>(<span class="hljs-variable language_">self</span>.seq), net, v))

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">self, t_end=<span class="hljs-number">1e9</span></span>):
        <span class="hljs-keyword">while</span> <span class="hljs-variable language_">self</span>.q <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.q[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] &lt;= t_end:
            t, _, net, v = heapq.heappop(<span class="hljs-variable language_">self</span>.q)
            <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.val.get(net) == v:
                <span class="hljs-keyword">continue</span>
            <span class="hljs-variable language_">self</span>.val[net] = v
            <span class="hljs-variable language_">self</span>.trace.setdefault(net, []).append((t, v))
            <span class="hljs-keyword">for</span> op, out, ins, d <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.fanout.get(net, []):
                <span class="hljs-variable language_">self</span>.drive(t + d, out, OPS[op](*(<span class="hljs-variable language_">self</span>.val[i] <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> ins)))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">adder_netlist</span>(<span class="hljs-params">sim, n=<span class="hljs-number">4</span></span>):
    sim.val[<span class="hljs-string">&quot;c0&quot;</span>] = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n):
        a, b, c = <span class="hljs-string">f&quot;a<span class="hljs-subst">{i}</span>&quot;</span>, <span class="hljs-string">f&quot;b<span class="hljs-subst">{i}</span>&quot;</span>, <span class="hljs-string">f&quot;c<span class="hljs-subst">{i}</span>&quot;</span>
        sim.gate(<span class="hljs-string">&quot;XOR&quot;</span>, <span class="hljs-string">f&quot;p<span class="hljs-subst">{i}</span>&quot;</span>, a, b); sim.gate(<span class="hljs-string">&quot;AND&quot;</span>, <span class="hljs-string">f&quot;g<span class="hljs-subst">{i}</span>&quot;</span>, a, b)
        sim.gate(<span class="hljs-string">&quot;AND&quot;</span>, <span class="hljs-string">f&quot;t<span class="hljs-subst">{i}</span>&quot;</span>, <span class="hljs-string">f&quot;p<span class="hljs-subst">{i}</span>&quot;</span>, c); sim.gate(<span class="hljs-string">&quot;OR&quot;</span>, <span class="hljs-string">f&quot;c<span class="hljs-subst">{i+<span class="hljs-number">1</span>}</span>&quot;</span>, <span class="hljs-string">f&quot;g<span class="hljs-subst">{i}</span>&quot;</span>, <span class="hljs-string">f&quot;t<span class="hljs-subst">{i}</span>&quot;</span>)
        sim.gate(<span class="hljs-string">&quot;XOR&quot;</span>, <span class="hljs-string">f&quot;s<span class="hljs-subst">{i}</span>&quot;</span>, <span class="hljs-string">f&quot;p<span class="hljs-subst">{i}</span>&quot;</span>, c)

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    s = Sim()
    s.gate(<span class="hljs-string">&quot;NOT&quot;</span>, <span class="hljs-string">&quot;na&quot;</span>, <span class="hljs-string">&quot;a&quot;</span>, delay=<span class="hljs-number">2.0</span>)
    s.gate(<span class="hljs-string">&quot;AND&quot;</span>, <span class="hljs-string">&quot;y&quot;</span>, <span class="hljs-string">&quot;a&quot;</span>, <span class="hljs-string">&quot;na&quot;</span>, delay=<span class="hljs-number">1.0</span>)
    s.settle_initial()
    s.drive(<span class="hljs-number">5.0</span>, <span class="hljs-string">&quot;a&quot;</span>, <span class="hljs-number">1</span>); s.drive(<span class="hljs-number">14.0</span>, <span class="hljs-string">&quot;a&quot;</span>, <span class="hljs-number">0</span>)
    s.run()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;Y events:&quot;</span>, s.trace[<span class="hljs-string">&quot;y&quot;</span>])
    <span class="hljs-keyword">assert</span> s.trace[<span class="hljs-string">&quot;y&quot;</span>] == [(<span class="hljs-number">6.0</span>, <span class="hljs-number">1</span>), (<span class="hljs-number">8.0</span>, <span class="hljs-number">0</span>)]               <span class="hljs-comment"># one 2 ns glitch on the rising edge only</span>

    <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">16</span>):
        <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">16</span>):
            sim = Sim(); adder_netlist(sim); sim.settle_initial()
            <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>):
                sim.drive(<span class="hljs-number">0.0</span>, <span class="hljs-string">f&quot;a<span class="hljs-subst">{i}</span>&quot;</span>, (a &gt;&gt; i) &amp; <span class="hljs-number">1</span>); sim.drive(<span class="hljs-number">0.0</span>, <span class="hljs-string">f&quot;b<span class="hljs-subst">{i}</span>&quot;</span>, (b &gt;&gt; i) &amp; <span class="hljs-number">1</span>)
            sim.run()
            total = <span class="hljs-built_in">sum</span>(sim.val[<span class="hljs-string">f&quot;s<span class="hljs-subst">{i}</span>&quot;</span>] &lt;&lt; i <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">4</span>)) + (sim.val[<span class="hljs-string">&quot;c4&quot;</span>] &lt;&lt; <span class="hljs-number">4</span>)
            <span class="hljs-keyword">assert</span> total == a + b, (a, b, total)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;event-driven 4-bit adder correct for all 256 input pairs&quot;</span>)</code></pre></div>
<p>The same adder in Verilog, with a testbench that checks all 256 pairs. Our checker runs it with Icarus Verilog (<code>iverilog -g2012</code>, then <code>vvp</code>):</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">adder4_tb.v</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-verilog"><span class="hljs-meta">\`<span class="hljs-keyword">timescale</span> 1ns/1ps</span>
<span class="hljs-keyword">module</span> full_adder(<span class="hljs-keyword">input</span> a, b, c, <span class="hljs-keyword">output</span> s, cout);
  <span class="hljs-keyword">wire</span> p, g, t;
  <span class="hljs-keyword">xor</span> #<span class="hljs-number">1</span> x1(p, a, b);
  <span class="hljs-keyword">and</span> #<span class="hljs-number">1</span> a1(g, a, b);
  <span class="hljs-keyword">and</span> #<span class="hljs-number">1</span> a2(t, p, c);
  <span class="hljs-keyword">or</span>  #<span class="hljs-number">1</span> o1(cout, g, t);
  <span class="hljs-keyword">xor</span> #<span class="hljs-number">1</span> x2(s, p, c);
<span class="hljs-keyword">endmodule</span>

<span class="hljs-keyword">module</span> adder4(<span class="hljs-keyword">input</span> [<span class="hljs-number">3</span>:<span class="hljs-number">0</span>] a, b, <span class="hljs-keyword">output</span> [<span class="hljs-number">3</span>:<span class="hljs-number">0</span>] s, <span class="hljs-keyword">output</span> cout);
  <span class="hljs-keyword">wire</span> [<span class="hljs-number">4</span>:<span class="hljs-number">0</span>] c;
  <span class="hljs-keyword">assign</span> c[<span class="hljs-number">0</span>] = <span class="hljs-number">1&#x27;b0</span>;
  <span class="hljs-keyword">genvar</span> i;
  <span class="hljs-keyword">generate</span> <span class="hljs-keyword">for</span> (i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i = i + <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span> : fa
    full_adder u(<span class="hljs-variable">.a</span>(a[i]), <span class="hljs-variable">.b</span>(b[i]), <span class="hljs-variable">.c</span>(c[i]), <span class="hljs-variable">.s</span>(s[i]), <span class="hljs-variable">.cout</span>(c[i+<span class="hljs-number">1</span>]));
  <span class="hljs-keyword">end</span> <span class="hljs-keyword">endgenerate</span>
  <span class="hljs-keyword">assign</span> cout = c[<span class="hljs-number">4</span>];
<span class="hljs-keyword">endmodule</span>

<span class="hljs-keyword">module</span> tb;
  <span class="hljs-keyword">reg</span> [<span class="hljs-number">3</span>:<span class="hljs-number">0</span>] a, b; <span class="hljs-keyword">wire</span> [<span class="hljs-number">3</span>:<span class="hljs-number">0</span>] s; <span class="hljs-keyword">wire</span> cout;
  <span class="hljs-keyword">integer</span> i, j, errors = <span class="hljs-number">0</span>;
  adder4 dut(<span class="hljs-variable">.a</span>(a), <span class="hljs-variable">.b</span>(b), <span class="hljs-variable">.s</span>(s), <span class="hljs-variable">.cout</span>(cout));
  <span class="hljs-keyword">initial</span> <span class="hljs-keyword">begin</span>
    <span class="hljs-keyword">for</span> (i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">16</span>; i = i + <span class="hljs-number">1</span>)
      <span class="hljs-keyword">for</span> (j = <span class="hljs-number">0</span>; j &lt; <span class="hljs-number">16</span>; j = j + <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span>
        a = i; b = j; #<span class="hljs-number">20</span>;                      <span class="hljs-comment">// longer than the 9 ns worst-case ripple</span>
        <span class="hljs-keyword">if</span> ({cout, s} !== i + j) <span class="hljs-keyword">begin</span> errors = errors + <span class="hljs-number">1</span>; <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL %0d + %0d = %0d&quot;</span>, i, j, {cout, s}); <span class="hljs-keyword">end</span>
      <span class="hljs-keyword">end</span>
    <span class="hljs-keyword">if</span> (errors == <span class="hljs-number">0</span>) <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;PASS: all 256 sums correct&quot;</span>);
    <span class="hljs-built_in">$finish</span>;
  <span class="hljs-keyword">end</span>
<span class="hljs-keyword">endmodule</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>In the glitch circuit, what happens if the inverter delay is 0.5 ns and the AND gate delay is 1 ns?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>With <em>transport</em> delay (as in our simulator), Y still pulses for 0.5 ns. Real gates and Verilog’s default <em>inertial</em> delay swallow pulses shorter than the gate’s own delay, so the AND gate would filter it out. Inertial delay is a better model of real gates.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>How would you remove the static hazard in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">F</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">A</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7519em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span> when B = C = 1 and A changes?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Add the consensus term <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">F</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">A</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8352em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">A</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7519em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">′</span></span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span>. It stays 1 while A switches, covering the gap between the two original terms.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l06"></div>

`,i=[{id:`events-not-time-steps`,title:`Events, not time steps`},{id:`glitches`,title:`Glitches`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l06-q1`,type:`mc`,q:`<p>An event-driven simulator does work…</p>
`,explain:`<p>Unchanged inputs need no re-evaluation.</p>
`,options:[`at every fixed time step`,`only when a net changes value`,`only at clock edges`,`once per truth-table row`],answer:1},{id:`p06-l06-q2`,type:`num`,q:`<p>Glitch width in ns for Y = A·A′ with a 2 ns inverter?</p>
`,explain:`<p>Both inputs are 1 until the inverter catches up.</p>
`,answer:2,tol:.001,unit:`ns`},{id:`p06-l06-q3`,type:`num`,q:`<p>At what time (ns) does Y first go high if A rises at 5 ns and the AND delay is 1 ns?</p>
`,explain:`<p>The AND sees (1, 1) immediately.</p>
`,answer:6,tol:.001,unit:`ns`},{id:`p06-l06-q4`,type:`mc`,q:`<p>A static-1 hazard can be removed by…</p>
`,explain:`<p>The redundant term covers the transition.</p>
`,options:[`adding the consensus term`,`removing the inverter`,`slowing the clock`,`using a NOR gate`],answer:0},{id:`p06-l06-q5`,type:`mc`,q:`<p>Glitches are harmless in synchronous logic when…</p>
`,explain:`<p>Flip-flops only sample at the edge.</p>
`,options:[`they are shorter than 1 ns`,`outputs settle before the next clock edge`,`the circuit uses NAND gates`,`the supply is 3.3 V`],answer:1},{id:`p06-l06-q6`,type:`num`,q:`<p>Worst-case ripple carry-out time (gate delays) for the 4-bit netlist?</p>
`,explain:`<p>Carry c_i is ready at 2i + 1.</p>
`,answer:9,tol:.001,unit:``}],o=[{file:`eventsim.py`,lang:`python`,src:`import heapq
from itertools import count

OPS = {"AND": lambda a, b: a & b, "OR": lambda a, b: a | b, "XOR": lambda a, b: a ^ b, "NOT": lambda a: 1 - a}

class Sim:
    def __init__(self):
        self.gates, self.val, self.fanout, self.q, self.trace, self.seq = [], {}, {}, [], {}, count()

    def gate(self, op, out, *ins, delay=1.0):
        g = (op, out, ins, delay)
        self.gates.append(g)
        for n in ins:
            self.fanout.setdefault(n, []).append(g)
        for n in (out, *ins):
            self.val.setdefault(n, 0)

    def settle_initial(self):
        for _ in range(len(self.gates)):                       # propagate initial values without timing
            for op, out, ins, _ in self.gates:
                self.val[out] = OPS[op](*(self.val[i] for i in ins))

    def drive(self, t, net, v):
        heapq.heappush(self.q, (t, next(self.seq), net, v))

    def run(self, t_end=1e9):
        while self.q and self.q[0][0] <= t_end:
            t, _, net, v = heapq.heappop(self.q)
            if self.val.get(net) == v:
                continue
            self.val[net] = v
            self.trace.setdefault(net, []).append((t, v))
            for op, out, ins, d in self.fanout.get(net, []):
                self.drive(t + d, out, OPS[op](*(self.val[i] for i in ins)))

def adder_netlist(sim, n=4):
    sim.val["c0"] = 0
    for i in range(n):
        a, b, c = f"a{i}", f"b{i}", f"c{i}"
        sim.gate("XOR", f"p{i}", a, b); sim.gate("AND", f"g{i}", a, b)
        sim.gate("AND", f"t{i}", f"p{i}", c); sim.gate("OR", f"c{i+1}", f"g{i}", f"t{i}")
        sim.gate("XOR", f"s{i}", f"p{i}", c)

if __name__ == "__main__":
    s = Sim()
    s.gate("NOT", "na", "a", delay=2.0)
    s.gate("AND", "y", "a", "na", delay=1.0)
    s.settle_initial()
    s.drive(5.0, "a", 1); s.drive(14.0, "a", 0)
    s.run()
    print("Y events:", s.trace["y"])
    assert s.trace["y"] == [(6.0, 1), (8.0, 0)]               # one 2 ns glitch on the rising edge only

    for a in range(16):
        for b in range(16):
            sim = Sim(); adder_netlist(sim); sim.settle_initial()
            for i in range(4):
                sim.drive(0.0, f"a{i}", (a >> i) & 1); sim.drive(0.0, f"b{i}", (b >> i) & 1)
            sim.run()
            total = sum(sim.val[f"s{i}"] << i for i in range(4)) + (sim.val["c4"] << 4)
            assert total == a + b, (a, b, total)
    print("event-driven 4-bit adder correct for all 256 input pairs")`},{file:`adder4_tb.v`,lang:`verilog`,src:`\`timescale 1ns/1ps
module full_adder(input a, b, c, output s, cout);
  wire p, g, t;
  xor #1 x1(p, a, b);
  and #1 a1(g, a, b);
  and #1 a2(t, p, c);
  or  #1 o1(cout, g, t);
  xor #1 x2(s, p, c);
endmodule

module adder4(input [3:0] a, b, output [3:0] s, output cout);
  wire [4:0] c;
  assign c[0] = 1'b0;
  genvar i;
  generate for (i = 0; i < 4; i = i + 1) begin : fa
    full_adder u(.a(a[i]), .b(b[i]), .c(c[i]), .s(s[i]), .cout(c[i+1]));
  end endgenerate
  assign cout = c[4];
endmodule

module tb;
  reg [3:0] a, b; wire [3:0] s; wire cout;
  integer i, j, errors = 0;
  adder4 dut(.a(a), .b(b), .s(s), .cout(cout));
  initial begin
    for (i = 0; i < 16; i = i + 1)
      for (j = 0; j < 16; j = j + 1) begin
        a = i; b = j; #20;                      // longer than the 9 ns worst-case ripple
        if ({cout, s} !== i + j) begin errors = errors + 1; $display("FAIL %0d + %0d = %0d", i, j, {cout, s}); end
      end
    if (errors == 0) $display("PASS: all 256 sums correct");
    $finish;
  end
endmodule`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};