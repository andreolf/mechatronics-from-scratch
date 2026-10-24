var e=`p06-l16`,t=40,n=`Your first hardware description. You write a parameterised Verilog counter that divides a clock by 2^n, add a synchronised, debounced button that changes the blink rate, simulate it with a self-checking testbench in Icarus Verilog, and check that the output frequency is exactly f_clk/2^n.`,r=`<h2 id="describing-hardware-not-running-code">Describing hardware, not running code</h2>
<p>Verilog looks like C but describes circuits that all run at once:</p>
<ul>
<li><code>always @(posedge clk)</code> describes flip-flops. Every assignment inside it, written <code>q &lt;= q + 1</code>, takes effect together at the clock edge (a <strong>non-blocking</strong> assignment).</li>
<li><code>assign y = a &amp; b;</code> describes combinational logic: a wire that is always equal to its expression.</li>
<li>A <code>module</code> is a component with ports. Instantiating one is placing a chip and wiring it up.</li>
</ul>
<p>The synthesiser turns the description into the gates and flip-flops of lessons 3–8, and the FPGA tools place them and check timing (lesson 11). Before any of that, you <strong>simulate</strong>: a testbench drives the clock and inputs, watches the outputs and checks them automatically.</p>
<h2 id="a-counter-as-a-clock-divider">A counter as a clock divider</h2>
<p>An <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>-bit binary counter’s bit <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">q</span><span class="mopen">[</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mclose">]</span></span></span></span> toggles every <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8491em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span></span></span></span></span></span></span> clock cycles, so its period is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8491em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span></span></span></span> cycles:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0496em;vertical-align:-0.3552em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3448em;"><span style="top:-2.5198em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">q</span><span class="mopen mtight">[</span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mclose mtight">]</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3552em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0574em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3714em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7751em;"><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">c</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>To blink an LED at about 1 Hz from a 12 MHz oscillator, pick <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> so that <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">12</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0991em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">6</span></span></span></span></span></span></span></span><span class="mord">/</span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">23</span></span></span></span> gives 0.715 Hz. For an exact frequency, count to a terminal value <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">M</span></span></span></span> and reset instead (a modulo-<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">M</span></span></span></span> counter); the period is then <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.109em;">M</span></span></span></span> cycles for a toggled output.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="clockdiv" data-args="{}"></div></div><figcaption>The clock and counter bits q[0]..q[3]. Each bit divides the one above by two; pick a bit to see its period.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A blinker for a 12 MHz board, with a button that cycles through three speeds.</p>
<ol>
<li>A 24-bit counter, with the LED on <code>q[23]</code>, <code>q[22]</code> or <code>q[21]</code>: 0.715, 1.43 or 2.86 Hz.</li>
<li>The button is asynchronous: two flip-flops synchronise it (lesson 11), then a counter debouncer (lesson 12) requires 2^16 stable cycles (5.5 ms at 12 MHz).</li>
<li>A rising edge of the debounced signal advances a 2-bit <code>speed</code> register: 0 → 1 → 2 → 0. That’s a tiny FSM (lesson 8).</li>
<li>For simulation, the testbench sets small parameters (a 6-bit counter, 3-bit debounce) so the checks run in microseconds rather than seconds of simulated time. The same parameterised module synthesises with the real values.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">blinker_tb.v</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-verilog"><span class="hljs-meta">\`<span class="hljs-keyword">timescale</span> 1ns/1ps</span>
<span class="hljs-keyword">module</span> blinker #(<span class="hljs-keyword">parameter</span> W = <span class="hljs-number">24</span>, <span class="hljs-keyword">parameter</span> DB = <span class="hljs-number">16</span>) (
    <span class="hljs-keyword">input</span>  <span class="hljs-keyword">wire</span> clk, rst, btn_async,
    <span class="hljs-keyword">output</span> <span class="hljs-keyword">wire</span> led,
    <span class="hljs-keyword">output</span> <span class="hljs-keyword">reg</span>  [<span class="hljs-number">1</span>:<span class="hljs-number">0</span>] speed
);
    <span class="hljs-keyword">reg</span> [W-<span class="hljs-number">1</span>:<span class="hljs-number">0</span>] cnt;
    <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk) cnt &lt;= rst ? <span class="hljs-number">0</span> : cnt + <span class="hljs-number">1&#x27;b1</span>;

    <span class="hljs-keyword">reg</span> s1, s2;                                   <span class="hljs-comment">// two-flop synchroniser</span>
    <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk) <span class="hljs-keyword">begin</span> s1 &lt;= btn_async; s2 &lt;= s1; <span class="hljs-keyword">end</span>

    <span class="hljs-keyword">reg</span> [DB-<span class="hljs-number">1</span>:<span class="hljs-number">0</span>] db_cnt; <span class="hljs-keyword">reg</span> btn, btn_prev;       <span class="hljs-comment">// counter debouncer</span>
    <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk) <span class="hljs-keyword">begin</span>
        <span class="hljs-keyword">if</span> (rst) <span class="hljs-keyword">begin</span> db_cnt &lt;= <span class="hljs-number">0</span>; btn &lt;= <span class="hljs-number">0</span>; btn_prev &lt;= <span class="hljs-number">0</span>; <span class="hljs-keyword">end</span>
        <span class="hljs-keyword">else</span> <span class="hljs-keyword">begin</span>
            btn_prev &lt;= btn;
            <span class="hljs-keyword">if</span> (s2 == btn) db_cnt &lt;= <span class="hljs-number">0</span>;
            <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (&amp;db_cnt) <span class="hljs-keyword">begin</span> btn &lt;= s2; db_cnt &lt;= <span class="hljs-number">0</span>; <span class="hljs-keyword">end</span>
            <span class="hljs-keyword">else</span> db_cnt &lt;= db_cnt + <span class="hljs-number">1&#x27;b1</span>;
        <span class="hljs-keyword">end</span>
    <span class="hljs-keyword">end</span>

    <span class="hljs-keyword">always</span> @(<span class="hljs-keyword">posedge</span> clk)                         <span class="hljs-comment">// speed FSM, advance on a debounced press</span>
        <span class="hljs-keyword">if</span> (rst) speed &lt;= <span class="hljs-number">0</span>;
        <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (btn &amp;&amp; !btn_prev) speed &lt;= (speed == <span class="hljs-number">2</span>) ? <span class="hljs-number">2&#x27;d0</span> : speed + <span class="hljs-number">1&#x27;b1</span>;

    <span class="hljs-keyword">assign</span> led = cnt[W - <span class="hljs-number">1</span> - speed];
<span class="hljs-keyword">endmodule</span>

<span class="hljs-keyword">module</span> tb;
    <span class="hljs-keyword">localparam</span> W = <span class="hljs-number">6</span>, DB = <span class="hljs-number">3</span>;
    <span class="hljs-keyword">reg</span> clk = <span class="hljs-number">0</span>, rst = <span class="hljs-number">1</span>, btn = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">wire</span> led; <span class="hljs-keyword">wire</span> [<span class="hljs-number">1</span>:<span class="hljs-number">0</span>] speed;
    <span class="hljs-keyword">integer</span> errors = <span class="hljs-number">0</span>, edges, first, last, k;
    blinker <span class="hljs-variable">#(.W(W), .DB(DB)) dut(.clk(clk), .rst(rst), .btn_async(btn), .led(led), .speed(speed))</span>;
    <span class="hljs-keyword">always</span> #<span class="hljs-number">5</span> clk = ~clk;                         <span class="hljs-comment">// 100 MHz in simulation time</span>

    <span class="hljs-keyword">task</span> measure_period(<span class="hljs-keyword">input</span> <span class="hljs-keyword">integer</span> expect_cycles);
        <span class="hljs-keyword">integer</span> cyc; <span class="hljs-keyword">reg</span> prev;
        <span class="hljs-keyword">begin</span>
            edges = <span class="hljs-number">0</span>; first = <span class="hljs-number">0</span>; last = <span class="hljs-number">0</span>; prev = led;
            <span class="hljs-keyword">for</span> (cyc = <span class="hljs-number">0</span>; cyc &lt; <span class="hljs-number">8</span> * expect_cycles; cyc = cyc + <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span>
                @(<span class="hljs-keyword">posedge</span> clk); #<span class="hljs-number">1</span>;
                <span class="hljs-keyword">if</span> (led &amp;&amp; !prev) <span class="hljs-keyword">begin</span>
                    <span class="hljs-keyword">if</span> (edges == <span class="hljs-number">0</span>) first = cyc; last = cyc; edges = edges + <span class="hljs-number">1</span>;
                <span class="hljs-keyword">end</span>
                prev = led;
            <span class="hljs-keyword">end</span>
            <span class="hljs-keyword">if</span> ((last - first) != (edges - <span class="hljs-number">1</span>) * expect_cycles) <span class="hljs-keyword">begin</span>
                <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL speed %0d: %0d rising edges over %0d cycles, expected period %0d&quot;</span>, speed, edges, last - first, expect_cycles);
                errors = errors + <span class="hljs-number">1</span>;
            <span class="hljs-keyword">end</span> <span class="hljs-keyword">else</span> <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;speed %0d: period %0d cycles = f_clk/%0d&quot;</span>, speed, expect_cycles, expect_cycles);
        <span class="hljs-keyword">end</span>
    <span class="hljs-keyword">endtask</span>

    <span class="hljs-keyword">task</span> press;                                   <span class="hljs-comment">// a bouncy press: chatter, hold, chatter</span>
        <span class="hljs-keyword">begin</span>
            <span class="hljs-keyword">for</span> (k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">6</span>; k = k + <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span> btn = ~btn; #<span class="hljs-number">3</span>; <span class="hljs-keyword">end</span>
            btn = <span class="hljs-number">1</span>; #<span class="hljs-number">200</span>;
            <span class="hljs-keyword">for</span> (k = <span class="hljs-number">0</span>; k &lt; <span class="hljs-number">6</span>; k = k + <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span> btn = ~btn; #<span class="hljs-number">3</span>; <span class="hljs-keyword">end</span>
            btn = <span class="hljs-number">0</span>; #<span class="hljs-number">200</span>;
        <span class="hljs-keyword">end</span>
    <span class="hljs-keyword">endtask</span>

    <span class="hljs-keyword">initial</span> <span class="hljs-keyword">begin</span>
        #<span class="hljs-number">22</span> rst = <span class="hljs-number">0</span>;
        measure_period(<span class="hljs-number">1</span> &lt;&lt; W);                   <span class="hljs-comment">// speed 0 uses cnt[W-1]</span>
        press; <span class="hljs-keyword">if</span> (speed != <span class="hljs-number">1</span>) <span class="hljs-keyword">begin</span> <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL press 1 gave speed %0d&quot;</span>, speed); errors = errors + <span class="hljs-number">1</span>; <span class="hljs-keyword">end</span>
        measure_period(<span class="hljs-number">1</span> &lt;&lt; (W - <span class="hljs-number">1</span>));
        press; <span class="hljs-keyword">if</span> (speed != <span class="hljs-number">2</span>) <span class="hljs-keyword">begin</span> <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL press 2 gave speed %0d&quot;</span>, speed); errors = errors + <span class="hljs-number">1</span>; <span class="hljs-keyword">end</span>
        measure_period(<span class="hljs-number">1</span> &lt;&lt; (W - <span class="hljs-number">2</span>));
        press; <span class="hljs-keyword">if</span> (speed != <span class="hljs-number">0</span>) <span class="hljs-keyword">begin</span> <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL press 3 gave speed %0d&quot;</span>, speed); errors = errors + <span class="hljs-number">1</span>; <span class="hljs-keyword">end</span>
        <span class="hljs-keyword">if</span> (errors == <span class="hljs-number">0</span>) <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;PASS&quot;</span>); <span class="hljs-keyword">else</span> <span class="hljs-built_in">$display</span>(<span class="hljs-string">&quot;FAIL %0d errors&quot;</span>, errors);
        <span class="hljs-built_in">$finish</span>;
    <span class="hljs-keyword">end</span>
<span class="hljs-keyword">endmodule</span></code></pre></div>
<p>The same frequency arithmetic in Python:</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">divider.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-python">f_clk = <span class="hljs-number">12e6</span>
rates = {k: f_clk / <span class="hljs-number">2</span> ** (k + <span class="hljs-number">1</span>) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> (<span class="hljs-number">21</span>, <span class="hljs-number">22</span>, <span class="hljs-number">23</span>)}
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(rates[<span class="hljs-number">23</span>] - <span class="hljs-number">0.715</span>) &lt; <span class="hljs-number">0.001</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(rates[<span class="hljs-number">22</span>] - <span class="hljs-number">1.431</span>) &lt; <span class="hljs-number">0.001</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(rates[<span class="hljs-number">21</span>] - <span class="hljs-number">2.861</span>) &lt; <span class="hljs-number">0.001</span>
debounce_ms = <span class="hljs-number">2</span>**<span class="hljs-number">16</span> / f_clk * <span class="hljs-number">1e3</span>
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(debounce_ms - <span class="hljs-number">5.46</span>) &lt; <span class="hljs-number">0.01</span>
M = <span class="hljs-built_in">int</span>(f_clk / (<span class="hljs-number">2</span> * <span class="hljs-number">1.0</span>))          <span class="hljs-comment"># modulo counter toggling the LED for exactly 1 Hz</span>
<span class="hljs-keyword">assert</span> M == <span class="hljs-number">6_000_000</span> <span class="hljs-keyword">and</span> (M - <span class="hljs-number">1</span>).bit_length() == <span class="hljs-number">23</span>
<span class="hljs-built_in">print</span>(rates, <span class="hljs-string">f&quot;debounce <span class="hljs-subst">{debounce_ms:<span class="hljs-number">.2</span>f}</span> ms, modulo-<span class="hljs-subst">{M}</span> counter needs 23 bits&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does the testbench measure the period over several rising edges instead of trusting the first one?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The first edge after reset or a speed change can come early, because the counter is already partway through its cycle. The steady-state spacing between later edges is the true period.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What happens if you use blocking assignments (<code>=</code>) in the synchroniser’s <code>always</code> block?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><code>s1 = btn_async; s2 = s1;</code> makes <code>s2</code> take the new value in the same clock edge. The two flops collapse into one, and the synchroniser no longer gives the first stage a cycle to resolve.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l16"></div>

`,i=[{id:`describing-hardware-not-running-code`,title:`Describing hardware, not running code`},{id:`a-counter-as-a-clock-divider`,title:`A counter as a clock divider`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l16-q1`,type:`num`,q:`<p>Blink frequency in Hz from bit q[23] of a counter on 12 MHz?</p>
`,explain:`<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0991em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">c</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">+</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span></span></span></span>.</p>
`,answer:.71526,tol:.001,unit:`Hz`},{id:`p06-l16-q2`,type:`num`,q:`<p>Period of q[3] in clock cycles?</p>
`,explain:`<p>It toggles every 8 cycles.</p>
`,answer:16,tol:.001,unit:``},{id:`p06-l16-q3`,type:`mc`,q:`<p>In Verilog, <code>q &lt;= q + 1</code> inside <code>always @(posedge clk)</code> describes…</p>
`,explain:`<p>A non-blocking assignment in a clocked block makes flip-flops.</p>
`,options:[`a loop that runs forever`,`a register updated at each clock edge`,`combinational logic`,`a delay`],answer:1},{id:`p06-l16-q4`,type:`num`,q:`<p>Debounce time in ms for 2^16 cycles at 12 MHz?</p>
`,explain:`<p>Cycles over clock rate.</p>
`,answer:5.461,tol:.002,unit:`ms`},{id:`p06-l16-q5`,type:`num`,q:`<p>Terminal count M for a toggled output of exactly 1 Hz from 12 MHz?</p>
`,explain:`<p>Toggle every half period.</p>
`,answer:6e6,tol:.001,unit:``},{id:`p06-l16-q6`,type:`mc`,q:`<p>A testbench is…</p>
`,explain:`<p>It never becomes hardware.</p>
`,options:[`the synthesised circuit`,`simulation code that drives inputs and checks outputs automatically`,`the FPGA pin map`,`a timing report`],answer:1}],o=[{file:`blinker_tb.v`,lang:`verilog`,src:`\`timescale 1ns/1ps
module blinker #(parameter W = 24, parameter DB = 16) (
    input  wire clk, rst, btn_async,
    output wire led,
    output reg  [1:0] speed
);
    reg [W-1:0] cnt;
    always @(posedge clk) cnt <= rst ? 0 : cnt + 1'b1;

    reg s1, s2;                                   // two-flop synchroniser
    always @(posedge clk) begin s1 <= btn_async; s2 <= s1; end

    reg [DB-1:0] db_cnt; reg btn, btn_prev;       // counter debouncer
    always @(posedge clk) begin
        if (rst) begin db_cnt <= 0; btn <= 0; btn_prev <= 0; end
        else begin
            btn_prev <= btn;
            if (s2 == btn) db_cnt <= 0;
            else if (&db_cnt) begin btn <= s2; db_cnt <= 0; end
            else db_cnt <= db_cnt + 1'b1;
        end
    end

    always @(posedge clk)                         // speed FSM, advance on a debounced press
        if (rst) speed <= 0;
        else if (btn && !btn_prev) speed <= (speed == 2) ? 2'd0 : speed + 1'b1;

    assign led = cnt[W - 1 - speed];
endmodule

module tb;
    localparam W = 6, DB = 3;
    reg clk = 0, rst = 1, btn = 0;
    wire led; wire [1:0] speed;
    integer errors = 0, edges, first, last, k;
    blinker #(.W(W), .DB(DB)) dut(.clk(clk), .rst(rst), .btn_async(btn), .led(led), .speed(speed));
    always #5 clk = ~clk;                         // 100 MHz in simulation time

    task measure_period(input integer expect_cycles);
        integer cyc; reg prev;
        begin
            edges = 0; first = 0; last = 0; prev = led;
            for (cyc = 0; cyc < 8 * expect_cycles; cyc = cyc + 1) begin
                @(posedge clk); #1;
                if (led && !prev) begin
                    if (edges == 0) first = cyc; last = cyc; edges = edges + 1;
                end
                prev = led;
            end
            if ((last - first) != (edges - 1) * expect_cycles) begin
                $display("FAIL speed %0d: %0d rising edges over %0d cycles, expected period %0d", speed, edges, last - first, expect_cycles);
                errors = errors + 1;
            end else $display("speed %0d: period %0d cycles = f_clk/%0d", speed, expect_cycles, expect_cycles);
        end
    endtask

    task press;                                   // a bouncy press: chatter, hold, chatter
        begin
            for (k = 0; k < 6; k = k + 1) begin btn = ~btn; #3; end
            btn = 1; #200;
            for (k = 0; k < 6; k = k + 1) begin btn = ~btn; #3; end
            btn = 0; #200;
        end
    endtask

    initial begin
        #22 rst = 0;
        measure_period(1 << W);                   // speed 0 uses cnt[W-1]
        press; if (speed != 1) begin $display("FAIL press 1 gave speed %0d", speed); errors = errors + 1; end
        measure_period(1 << (W - 1));
        press; if (speed != 2) begin $display("FAIL press 2 gave speed %0d", speed); errors = errors + 1; end
        measure_period(1 << (W - 2));
        press; if (speed != 0) begin $display("FAIL press 3 gave speed %0d", speed); errors = errors + 1; end
        if (errors == 0) $display("PASS"); else $display("FAIL %0d errors", errors);
        $finish;
    end
endmodule`},{file:`divider.py`,lang:`python`,src:`f_clk = 12e6
rates = {k: f_clk / 2 ** (k + 1) for k in (21, 22, 23)}
assert abs(rates[23] - 0.715) < 0.001 and abs(rates[22] - 1.431) < 0.001 and abs(rates[21] - 2.861) < 0.001
debounce_ms = 2**16 / f_clk * 1e3
assert abs(debounce_ms - 5.46) < 0.01
M = int(f_clk / (2 * 1.0))          # modulo counter toggling the LED for exactly 1 Hz
assert M == 6_000_000 and (M - 1).bit_length() == 23
print(rates, f"debounce {debounce_ms:.2f} ms, modulo-{M} counter needs 23 bits")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};