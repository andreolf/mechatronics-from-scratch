var e=`p11-l06`,t=40,n=`I2C runs many chips on two open-drain wires that devices can only pull low, with pull-up resistors doing the rising, so the pull-up value sets the rise time t_r = 0.8473 RC and with it the top speed. You derive pull-up sizing, the start, stop, address and ACK rules, write a bit-banged I2C master, and test it against a simulated sensor that acknowledges, stretches the clock and auto-increments its register pointer.`,r=`<h2 id="open-drain-and-pull-ups">Open drain and pull-ups</h2>
<p>I2C has two lines, SCL (clock) and SDA (data). Every device has <strong>open-drain</strong> outputs: it can pull a line low or let go, never drive it high. A pull-up resistor <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> does the rising. Two consequences:</p>
<ul>
<li>The bus is a <strong>wired AND</strong>: if anyone pulls low, the line is low. Two devices can’t fight and short the supply, and a slow slave can hold SCL low to make the master wait (<strong>clock stretching</strong>).</li>
<li>Rising edges are an RC charge of the bus capacitance <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">b</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> (pins plus wiring) through <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span>.</li>
</ul>
<p>The spec measures rise time from 30 % to 70 % of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.0908em;vertical-align:-0.7693em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">b</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop">ln</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">0.7</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">0.3</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.7693em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9694em;vertical-align:-0.2861em;"></span><span class="mord">0.8473</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">p</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">b</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>So the largest allowed pull-up is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6644em;"><span style="top:-2.453em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mopen">(</span><span class="mord">0.8473</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">b</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span>: with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9114em;vertical-align:-0.247em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6644em;"><span style="top:-2.453em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1000</span></span></span></span> ns (standard mode, 100 kHz) and 400 pF that’s 2.95 kΩ; fast mode (400 kHz, 300 ns) with 200 pF gives 1.77 kΩ. The smallest is set by how much current a pin can sink at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">O</span><span class="mord mathnormal mtight">L</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.4</span></span></span></span> V, typically 3 mA: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">min</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.2222em;">V</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.2222em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span><span class="mord mathnormal mtight" style="margin-right:0.0278em;">D</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.4</span><span class="mclose">)</span><span class="mord">/3</span><span class="mord text"><span class="mord">\xA0mA</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">967</span></span></span></span> Ω at 3.3 V.</p>
<h2 id="the-protocol">The protocol</h2>
<ul>
<li><strong>Idle</strong>: both lines high.</li>
<li><strong>START</strong>: SDA falls while SCL is high. <strong>STOP</strong>: SDA rises while SCL is high. These are the only times SDA may change while SCL is high; data changes while SCL is low and is sampled while it’s high.</li>
<li>After a START the master sends a byte: a <strong>7-bit address</strong> and a R/W bit (0 = write). Bytes are MSB first.</li>
<li>After every byte the receiver pulls SDA low for one clock: the <strong>ACK</strong>. A high SDA in that slot (<strong>NACK</strong>) means nobody answered, or that the master wants no more data.</li>
<li>To read register <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>: START, address+W, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, <strong>repeated START</strong>, address+R, read bytes (ACK all but the last, NACK the last), STOP.</li>
</ul>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="i2ctrace" data-args="{}"></div></div><figcaption>SDA and SCL for a register read: START, address and write bit, ACK, register number, repeated START, address and read bit, data, NACK, STOP. Drag the pull-up and bus capacitance to see the rising edges slow down.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Size the pull-ups for a 400 kHz bus at 3.3 V with an IMU, a magnetometer and 30 cm of cable, about 120 pF in total.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">ma</span><span class="mord mathnormal mtight">x</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">300</span><span class="mord text"><span class="mord">\xA0ns</span></span><span class="mord">/</span><span class="mopen">(</span><span class="mord">0.8473</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">120</span><span class="mord text"><span class="mord">\xA0pF</span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.95</span></span></span></span> kΩ.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0077em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">min</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">3.3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.4</span><span class="mclose">)</span><span class="mord">/3</span><span class="mord text"><span class="mord">\xA0mA</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">967</span></span></span></span> Ω.</li>
<li>Pick 2.2 kΩ: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0.8473</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2200</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">120</span><span class="mord text"><span class="mord">\xA0pF</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">224</span></span></span></span> ns, under 300 ns with margin. The MCU’s internal 40 kΩ pull-ups would give 4.1 µs, which is why they’re no good for I2C.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">i2c.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>

<span class="hljs-comment">/* ---------- the bus: wired AND of master and slave, plus a recorder ---------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> m_scl = <span class="hljs-number">1</span>, m_sda = <span class="hljs-number">1</span>;                    <span class="hljs-comment">/* 1 = released */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> s_scl = <span class="hljs-number">1</span>, s_sda = <span class="hljs-number">1</span>;
<span class="hljs-type">static</span> <span class="hljs-type">int</span> line_scl = <span class="hljs-number">1</span>, line_sda = <span class="hljs-number">1</span>;
<span class="hljs-type">static</span> <span class="hljs-type">int</span> sda_changes_while_scl_high;

<span class="hljs-comment">/* ---------- a simulated sensor at address 0x48 with 16 registers ---------- */</span>
<span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> S_IDLE, S_RX, S_TX };
<span class="hljs-type">static</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span>
  <span class="hljs-type">int</span> st, bit, addr_phase, have_reg, master_ack, stretch, go_tx;
  <span class="hljs-type">uint8_t</span> shift, reg, regs[<span class="hljs-number">16</span>];
  <span class="hljs-type">int</span> stretch_cycles;                                <span class="hljs-comment">/* hold SCL low this many delays after each ACK */</span>
} dev;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DEV_ADDR 0x48</span>

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">slave_tx_load</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { dev.shift = dev.regs[dev.reg &amp; <span class="hljs-number">15</span>]; dev.reg++; dev.bit = <span class="hljs-number">0</span>; s_sda = dev.shift &gt;&gt; <span class="hljs-number">7</span> &amp; <span class="hljs-number">1</span>; }
<span class="hljs-comment">/* bit counts the clocks of the current byte: 0..7 data, 8 = ACK slot pending, 9 = in the ACK slot */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">slave_scl_rise</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">if</span> (dev.st == S_RX &amp;&amp; dev.bit &lt; <span class="hljs-number">8</span>) { dev.shift = (<span class="hljs-type">uint8_t</span>)(dev.shift &lt;&lt; <span class="hljs-number">1</span> | line_sda); dev.bit++; }
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (dev.st == S_TX) { <span class="hljs-keyword">if</span> (dev.bit &lt; <span class="hljs-number">8</span>) dev.bit++; <span class="hljs-keyword">else</span> { dev.master_ack = !line_sda; dev.bit = <span class="hljs-number">9</span>; } }
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">slave_scl_fall</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">if</span> (dev.st == S_RX) {
    <span class="hljs-keyword">if</span> (dev.bit == <span class="hljs-number">8</span>) {                              <span class="hljs-comment">/* a byte is in: decide whether to ACK */</span>
      <span class="hljs-keyword">if</span> (dev.addr_phase) {
        <span class="hljs-keyword">if</span> ((dev.shift &gt;&gt; <span class="hljs-number">1</span>) != DEV_ADDR) { dev.st = S_IDLE; <span class="hljs-keyword">return</span>; }
        dev.addr_phase = <span class="hljs-number">0</span>;
        dev.go_tx = dev.shift &amp; <span class="hljs-number">1</span>;                   <span class="hljs-comment">/* a read: start sending after the ACK slot */</span>
      } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (!dev.have_reg) { dev.reg = dev.shift; dev.have_reg = <span class="hljs-number">1</span>; }
      <span class="hljs-keyword">else</span> { dev.regs[dev.reg &amp; <span class="hljs-number">15</span>] = dev.shift; dev.reg++; }
      s_sda = <span class="hljs-number">0</span>; dev.bit = <span class="hljs-number">9</span>;                        <span class="hljs-comment">/* ACK */</span>
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (dev.bit == <span class="hljs-number">9</span>) {                       <span class="hljs-comment">/* the ACK slot is over */</span>
      s_sda = <span class="hljs-number">1</span>; dev.bit = <span class="hljs-number">0</span>; dev.shift = <span class="hljs-number">0</span>;
      <span class="hljs-keyword">if</span> (dev.go_tx) { dev.go_tx = <span class="hljs-number">0</span>; dev.st = S_TX; slave_tx_load(); <span class="hljs-keyword">return</span>; }
      <span class="hljs-keyword">if</span> (dev.stretch_cycles) { s_scl = <span class="hljs-number">0</span>; dev.stretch = dev.stretch_cycles; }
    }
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (dev.st == S_TX) {
    <span class="hljs-keyword">if</span> (dev.bit &lt; <span class="hljs-number">8</span>) s_sda = dev.shift &gt;&gt; (<span class="hljs-number">7</span> - dev.bit) &amp; <span class="hljs-number">1</span>;
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (dev.bit == <span class="hljs-number">8</span>) s_sda = <span class="hljs-number">1</span>;                <span class="hljs-comment">/* let the master drive its ACK */</span>
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (dev.master_ack) slave_tx_load();
    <span class="hljs-keyword">else</span> { dev.st = S_IDLE; s_sda = <span class="hljs-number">1</span>; }
  }
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">bus_update</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> pass = <span class="hljs-number">0</span>; pass &lt; <span class="hljs-number">3</span>; pass++) {             <span class="hljs-comment">/* settle: the slave may respond to an edge */</span>
    <span class="hljs-type">int</span> scl = m_scl &amp; s_scl, sda = m_sda &amp; s_sda;
    <span class="hljs-keyword">if</span> (scl == line_scl &amp;&amp; sda == line_sda) <span class="hljs-keyword">return</span>;
    <span class="hljs-type">int</span> old_scl = line_scl, old_sda = line_sda;
    line_scl = scl; line_sda = sda;
    <span class="hljs-keyword">if</span> (old_scl &amp;&amp; scl &amp;&amp; old_sda != sda) {
      sda_changes_while_scl_high++;
      <span class="hljs-keyword">if</span> (!sda) { dev.st = S_RX; dev.bit = <span class="hljs-number">0</span>; dev.shift = <span class="hljs-number">0</span>; dev.addr_phase = <span class="hljs-number">1</span>; dev.go_tx = <span class="hljs-number">0</span>; s_sda = <span class="hljs-number">1</span>; }   <span class="hljs-comment">/* START */</span>
      <span class="hljs-keyword">else</span> { dev.st = S_IDLE; dev.have_reg = <span class="hljs-number">0</span>; s_sda = <span class="hljs-number">1</span>; }                                     <span class="hljs-comment">/* STOP */</span>
    }
    <span class="hljs-keyword">if</span> (!old_scl &amp;&amp; scl) slave_scl_rise();
    <span class="hljs-keyword">if</span> (old_scl &amp;&amp; !scl) slave_scl_fall();
  }
}

<span class="hljs-comment">/* ---------- the HAL a real port would implement with GPIO open-drain writes ---------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">scl</span><span class="hljs-params">(<span class="hljs-type">int</span> v)</span> { m_scl = v; bus_update(); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">sda</span><span class="hljs-params">(<span class="hljs-type">int</span> v)</span> { m_sda = v; bus_update(); }
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">sda_read</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> line_sda; }
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">scl_read</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">return</span> line_scl; }
<span class="hljs-type">static</span> <span class="hljs-type">long</span> delays;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">delay_half</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {                       <span class="hljs-comment">/* half a bit period; the slave&#x27;s stretch counts down */</span>
  delays++;
  <span class="hljs-keyword">if</span> (dev.stretch &amp;&amp; --dev.stretch == <span class="hljs-number">0</span>) { s_scl = <span class="hljs-number">1</span>; bus_update(); }
}

<span class="hljs-comment">/* ---------- the bit-banged master ---------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">scl_high</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {                          <span class="hljs-comment">/* release SCL and wait for any clock stretching */</span>
  scl(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> t = <span class="hljs-number">0</span>; t &lt; <span class="hljs-number">1000</span>; t++) { <span class="hljs-keyword">if</span> (scl_read()) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; delay_half(); }
  <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">i2c_start</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { sda(<span class="hljs-number">1</span>); scl_high(); delay_half(); sda(<span class="hljs-number">0</span>); delay_half(); scl(<span class="hljs-number">0</span>); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">i2c_stop</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { sda(<span class="hljs-number">0</span>); delay_half(); scl_high(); delay_half(); sda(<span class="hljs-number">1</span>); delay_half(); }
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">i2c_write_byte</span><span class="hljs-params">(<span class="hljs-type">uint8_t</span> b)</span> {               <span class="hljs-comment">/* returns 1 for ACK */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">7</span>; i &gt;= <span class="hljs-number">0</span>; i--) { sda(b &gt;&gt; i &amp; <span class="hljs-number">1</span>); delay_half(); scl_high(); delay_half(); scl(<span class="hljs-number">0</span>); }
  sda(<span class="hljs-number">1</span>); delay_half(); scl_high(); <span class="hljs-type">int</span> ack = !sda_read(); delay_half(); scl(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> ack;
}
<span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> <span class="hljs-title function_">i2c_read_byte</span><span class="hljs-params">(<span class="hljs-type">int</span> ack)</span> {
  <span class="hljs-type">uint8_t</span> b = <span class="hljs-number">0</span>; sda(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">8</span>; i++) { delay_half(); scl_high(); b = (<span class="hljs-type">uint8_t</span>)(b &lt;&lt; <span class="hljs-number">1</span> | sda_read()); delay_half(); scl(<span class="hljs-number">0</span>); }
  sda(!ack); delay_half(); scl_high(); delay_half(); scl(<span class="hljs-number">0</span>); sda(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">return</span> b;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">i2c_write_regs</span><span class="hljs-params">(<span class="hljs-type">uint8_t</span> addr, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *d, <span class="hljs-type">int</span> n)</span> {
  i2c_start();
  <span class="hljs-keyword">if</span> (!i2c_write_byte((<span class="hljs-type">uint8_t</span>)(addr &lt;&lt; <span class="hljs-number">1</span>))) { i2c_stop(); <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
  <span class="hljs-type">int</span> ok = i2c_write_byte(reg);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; n &amp;&amp; ok; i++) ok = i2c_write_byte(d[i]);
  i2c_stop();
  <span class="hljs-keyword">return</span> ok ? <span class="hljs-number">0</span> : <span class="hljs-number">-2</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">i2c_read_regs</span><span class="hljs-params">(<span class="hljs-type">uint8_t</span> addr, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">uint8_t</span> *d, <span class="hljs-type">int</span> n)</span> {
  i2c_start();
  <span class="hljs-keyword">if</span> (!i2c_write_byte((<span class="hljs-type">uint8_t</span>)(addr &lt;&lt; <span class="hljs-number">1</span>))) { i2c_stop(); <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
  <span class="hljs-keyword">if</span> (!i2c_write_byte(reg)) { i2c_stop(); <span class="hljs-keyword">return</span> <span class="hljs-number">-2</span>; }
  i2c_start();                                       <span class="hljs-comment">/* repeated START */</span>
  <span class="hljs-keyword">if</span> (!i2c_write_byte((<span class="hljs-type">uint8_t</span>)(addr &lt;&lt; <span class="hljs-number">1</span> | <span class="hljs-number">1</span>))) { i2c_stop(); <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) d[i] = i2c_read_byte(i &lt; n - <span class="hljs-number">1</span>);
  i2c_stop();
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-comment">/* pull-up sizing */</span>
  <span class="hljs-type">double</span> rmax = <span class="hljs-number">300e-9</span> / (<span class="hljs-number">0.8473</span> * <span class="hljs-number">120e-12</span>), rmin = (<span class="hljs-number">3.3</span> - <span class="hljs-number">0.4</span>) / <span class="hljs-number">3e-3</span>, tr = <span class="hljs-number">0.8473</span> * <span class="hljs-number">2200</span> * <span class="hljs-number">120e-12</span>;
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;400 kHz, 120 pF: R between %.0f and %.0f ohm; 2.2k gives t_r = %.0f ns\\n&quot;</span>, rmin, rmax, tr * <span class="hljs-number">1e9</span>);
  CHECK(rmax &gt; <span class="hljs-number">2200</span> &amp;&amp; rmin &lt; <span class="hljs-number">2200</span> &amp;&amp; tr &lt; <span class="hljs-number">300e-9</span>);

  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">16</span>; i++) dev.regs[i] = (<span class="hljs-type">uint8_t</span>)(<span class="hljs-number">0xA0</span> + i);
  <span class="hljs-type">uint8_t</span> buf[<span class="hljs-number">16</span>];
  <span class="hljs-comment">/* read one register, then a burst with auto-increment */</span>
  CHECK(i2c_read_regs(DEV_ADDR, <span class="hljs-number">3</span>, buf, <span class="hljs-number">1</span>) == <span class="hljs-number">0</span> &amp;&amp; buf[<span class="hljs-number">0</span>] == <span class="hljs-number">0xA3</span>);
  CHECK(i2c_read_regs(DEV_ADDR, <span class="hljs-number">0</span>, buf, <span class="hljs-number">16</span>) == <span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">16</span>; i++) CHECK(buf[i] == <span class="hljs-number">0xA0</span> + i);
  <span class="hljs-comment">/* write two registers and read them back */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> w[<span class="hljs-number">2</span>] = {<span class="hljs-number">0x5A</span>, <span class="hljs-number">0xC3</span>};
  CHECK(i2c_write_regs(DEV_ADDR, <span class="hljs-number">7</span>, w, <span class="hljs-number">2</span>) == <span class="hljs-number">0</span> &amp;&amp; dev.regs[<span class="hljs-number">7</span>] == <span class="hljs-number">0x5A</span> &amp;&amp; dev.regs[<span class="hljs-number">8</span>] == <span class="hljs-number">0xC3</span>);
  CHECK(i2c_read_regs(DEV_ADDR, <span class="hljs-number">7</span>, buf, <span class="hljs-number">2</span>) == <span class="hljs-number">0</span> &amp;&amp; buf[<span class="hljs-number">0</span>] == <span class="hljs-number">0x5A</span> &amp;&amp; buf[<span class="hljs-number">1</span>] == <span class="hljs-number">0xC3</span>);
  <span class="hljs-comment">/* nobody at 0x50: NACK on the address */</span>
  CHECK(i2c_read_regs(<span class="hljs-number">0x50</span>, <span class="hljs-number">0</span>, buf, <span class="hljs-number">1</span>) == <span class="hljs-number">-1</span>);
  CHECK(line_scl &amp;&amp; line_sda);                       <span class="hljs-comment">/* bus released and idle */</span>
  <span class="hljs-comment">/* the slave stretches the clock after every byte it receives */</span>
  dev.stretch_cycles = <span class="hljs-number">25</span>; <span class="hljs-type">long</span> before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, <span class="hljs-number">0</span>, buf, <span class="hljs-number">4</span>) == <span class="hljs-number">0</span> &amp;&amp; buf[<span class="hljs-number">0</span>] == <span class="hljs-number">0xA0</span> &amp;&amp; buf[<span class="hljs-number">3</span>] == <span class="hljs-number">0xA3</span>);
  <span class="hljs-type">long</span> stretched = delays - before; dev.stretch_cycles = <span class="hljs-number">0</span>; before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, <span class="hljs-number">0</span>, buf, <span class="hljs-number">4</span>) == <span class="hljs-number">0</span>);
  <span class="hljs-type">long</span> plain = delays - before;
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;clock stretching: the same read took %ld half-bits instead of %ld, data still correct\\n&quot;</span>, stretched, plain);
  CHECK(stretched &gt; plain + <span class="hljs-number">40</span>);              <span class="hljs-comment">/* two received bytes, 25 half-bits each */</span>
  <span class="hljs-comment">/* SDA changed while SCL was high only for STARTs and STOPs:
     per read 2 STARTs + 1 STOP; per write 1 START + 1 STOP; the failed read 1 + 1 */</span>
  <span class="hljs-type">int</span> expect = <span class="hljs-number">3</span> * <span class="hljs-number">5</span> + <span class="hljs-number">2</span> * <span class="hljs-number">1</span> + <span class="hljs-number">2</span>;
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;SDA changed with SCL high %d times = START/STOP count %d\\n&quot;</span>, sda_changes_while_scl_high, expect);
  CHECK(sda_changes_while_scl_high == expect);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Two sensors on your bus both have address 0x68. What are your options?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Many parts have an address pin (the MPU-6050’s AD0 picks 0x68 or 0x69), so strap one differently. Otherwise use two I2C peripherals, an I2C multiplexer such as the TCA9548A, or a part with a programmable address. Two devices at one address both ACK and both drive data, which corrupts every read.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>After a reset mid-transfer, the bus is stuck with SDA low. Why, and how do you recover?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The slave was in the middle of sending a 0 bit and is still waiting for clocks; it doesn’t know the master reset. The standard fix is to toggle SCL up to nine times until the slave releases SDA, then generate a STOP. Many drivers do this at startup.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l06"></div>

`,i=[{id:`open-drain-and-pull-ups`,title:`Open drain and pull-ups`},{id:`the-protocol`,title:`The protocol`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l06-q1`,type:`num`,q:`<p>Rise time in ns for 4.7 kΩ and 100 pF?</p>
`,explain:`<p>0.8473 RC; too slow for 400 kHz.</p>
`,answer:398.2,tol:.001,unit:`ns`},{id:`p11-l06-q2`,type:`num`,q:`<p>Largest pull-up in Ω for standard mode (1000 ns) with 400 pF?</p>
`,explain:`<p>t_r/(0.8473 C_b).</p>
`,answer:2950.5,tol:.001,unit:`Ω`},{id:`p11-l06-q3`,type:`num`,q:`<p>Smallest pull-up in Ω at 5 V for 3 mA sink at V_OL = 0.4 V?</p>
`,explain:`<p>(V_DD − V_OL)/I_OL.</p>
`,answer:1533.3,tol:.001,unit:`Ω`},{id:`p11-l06-q4`,type:`num`,q:`<p>The first byte sent to read from a device at 0x48?</p>
`,explain:`<p>0x91, address shifted left with R/W = 1.</p>
`,answer:145,tol:0,unit:``},{id:`p11-l06-q5`,type:`mc`,q:`<p>What is a START condition?</p>
`,explain:`<p>SDA rising with SCL high is a STOP.</p>
`,options:[`SDA falls while SCL is high`,`SCL falls while SDA is high`,`SDA rises while SCL is high`,`nine clocks with SDA low`],answer:0},{id:`p11-l06-q6`,type:`mc`,q:`<p>Why can a slave stretch the clock?</p>
`,explain:`<p>The master releases SCL and waits until it actually rises.</p>
`,options:[`SCL is open drain, so holding it low makes the master wait`,`the slave generates the clock`,`the pull-up is weak`,`it can’t`],answer:0}],o=[{file:`i2c.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- the bus: wired AND of master and slave, plus a recorder ---------- */
static int m_scl = 1, m_sda = 1;                    /* 1 = released */
static int s_scl = 1, s_sda = 1;
static int line_scl = 1, line_sda = 1;
static int sda_changes_while_scl_high;

/* ---------- a simulated sensor at address 0x48 with 16 registers ---------- */
enum { S_IDLE, S_RX, S_TX };
static struct {
  int st, bit, addr_phase, have_reg, master_ack, stretch, go_tx;
  uint8_t shift, reg, regs[16];
  int stretch_cycles;                                /* hold SCL low this many delays after each ACK */
} dev;
#define DEV_ADDR 0x48

static void slave_tx_load(void) { dev.shift = dev.regs[dev.reg & 15]; dev.reg++; dev.bit = 0; s_sda = dev.shift >> 7 & 1; }
/* bit counts the clocks of the current byte: 0..7 data, 8 = ACK slot pending, 9 = in the ACK slot */
static void slave_scl_rise(void) {
  if (dev.st == S_RX && dev.bit < 8) { dev.shift = (uint8_t)(dev.shift << 1 | line_sda); dev.bit++; }
  else if (dev.st == S_TX) { if (dev.bit < 8) dev.bit++; else { dev.master_ack = !line_sda; dev.bit = 9; } }
}
static void slave_scl_fall(void) {
  if (dev.st == S_RX) {
    if (dev.bit == 8) {                              /* a byte is in: decide whether to ACK */
      if (dev.addr_phase) {
        if ((dev.shift >> 1) != DEV_ADDR) { dev.st = S_IDLE; return; }
        dev.addr_phase = 0;
        dev.go_tx = dev.shift & 1;                   /* a read: start sending after the ACK slot */
      } else if (!dev.have_reg) { dev.reg = dev.shift; dev.have_reg = 1; }
      else { dev.regs[dev.reg & 15] = dev.shift; dev.reg++; }
      s_sda = 0; dev.bit = 9;                        /* ACK */
    } else if (dev.bit == 9) {                       /* the ACK slot is over */
      s_sda = 1; dev.bit = 0; dev.shift = 0;
      if (dev.go_tx) { dev.go_tx = 0; dev.st = S_TX; slave_tx_load(); return; }
      if (dev.stretch_cycles) { s_scl = 0; dev.stretch = dev.stretch_cycles; }
    }
  } else if (dev.st == S_TX) {
    if (dev.bit < 8) s_sda = dev.shift >> (7 - dev.bit) & 1;
    else if (dev.bit == 8) s_sda = 1;                /* let the master drive its ACK */
    else if (dev.master_ack) slave_tx_load();
    else { dev.st = S_IDLE; s_sda = 1; }
  }
}
static void bus_update(void) {
  for (int pass = 0; pass < 3; pass++) {             /* settle: the slave may respond to an edge */
    int scl = m_scl & s_scl, sda = m_sda & s_sda;
    if (scl == line_scl && sda == line_sda) return;
    int old_scl = line_scl, old_sda = line_sda;
    line_scl = scl; line_sda = sda;
    if (old_scl && scl && old_sda != sda) {
      sda_changes_while_scl_high++;
      if (!sda) { dev.st = S_RX; dev.bit = 0; dev.shift = 0; dev.addr_phase = 1; dev.go_tx = 0; s_sda = 1; }   /* START */
      else { dev.st = S_IDLE; dev.have_reg = 0; s_sda = 1; }                                     /* STOP */
    }
    if (!old_scl && scl) slave_scl_rise();
    if (old_scl && !scl) slave_scl_fall();
  }
}

/* ---------- the HAL a real port would implement with GPIO open-drain writes ---------- */
static void scl(int v) { m_scl = v; bus_update(); }
static void sda(int v) { m_sda = v; bus_update(); }
static int sda_read(void) { return line_sda; }
static int scl_read(void) { return line_scl; }
static long delays;
static void delay_half(void) {                       /* half a bit period; the slave's stretch counts down */
  delays++;
  if (dev.stretch && --dev.stretch == 0) { s_scl = 1; bus_update(); }
}

/* ---------- the bit-banged master ---------- */
static int scl_high(void) {                          /* release SCL and wait for any clock stretching */
  scl(1);
  for (int t = 0; t < 1000; t++) { if (scl_read()) return 0; delay_half(); }
  return -1;
}
static void i2c_start(void) { sda(1); scl_high(); delay_half(); sda(0); delay_half(); scl(0); }
static void i2c_stop(void) { sda(0); delay_half(); scl_high(); delay_half(); sda(1); delay_half(); }
static int i2c_write_byte(uint8_t b) {               /* returns 1 for ACK */
  for (int i = 7; i >= 0; i--) { sda(b >> i & 1); delay_half(); scl_high(); delay_half(); scl(0); }
  sda(1); delay_half(); scl_high(); int ack = !sda_read(); delay_half(); scl(0);
  return ack;
}
static uint8_t i2c_read_byte(int ack) {
  uint8_t b = 0; sda(1);
  for (int i = 0; i < 8; i++) { delay_half(); scl_high(); b = (uint8_t)(b << 1 | sda_read()); delay_half(); scl(0); }
  sda(!ack); delay_half(); scl_high(); delay_half(); scl(0); sda(1);
  return b;
}
static int i2c_write_regs(uint8_t addr, uint8_t reg, const uint8_t *d, int n) {
  i2c_start();
  if (!i2c_write_byte((uint8_t)(addr << 1))) { i2c_stop(); return -1; }
  int ok = i2c_write_byte(reg);
  for (int i = 0; i < n && ok; i++) ok = i2c_write_byte(d[i]);
  i2c_stop();
  return ok ? 0 : -2;
}
static int i2c_read_regs(uint8_t addr, uint8_t reg, uint8_t *d, int n) {
  i2c_start();
  if (!i2c_write_byte((uint8_t)(addr << 1))) { i2c_stop(); return -1; }
  if (!i2c_write_byte(reg)) { i2c_stop(); return -2; }
  i2c_start();                                       /* repeated START */
  if (!i2c_write_byte((uint8_t)(addr << 1 | 1))) { i2c_stop(); return -1; }
  for (int i = 0; i < n; i++) d[i] = i2c_read_byte(i < n - 1);
  i2c_stop();
  return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  /* pull-up sizing */
  double rmax = 300e-9 / (0.8473 * 120e-12), rmin = (3.3 - 0.4) / 3e-3, tr = 0.8473 * 2200 * 120e-12;
  printf("400 kHz, 120 pF: R between %.0f and %.0f ohm; 2.2k gives t_r = %.0f ns\\n", rmin, rmax, tr * 1e9);
  CHECK(rmax > 2200 && rmin < 2200 && tr < 300e-9);

  for (int i = 0; i < 16; i++) dev.regs[i] = (uint8_t)(0xA0 + i);
  uint8_t buf[16];
  /* read one register, then a burst with auto-increment */
  CHECK(i2c_read_regs(DEV_ADDR, 3, buf, 1) == 0 && buf[0] == 0xA3);
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 16) == 0);
  for (int i = 0; i < 16; i++) CHECK(buf[i] == 0xA0 + i);
  /* write two registers and read them back */
  const uint8_t w[2] = {0x5A, 0xC3};
  CHECK(i2c_write_regs(DEV_ADDR, 7, w, 2) == 0 && dev.regs[7] == 0x5A && dev.regs[8] == 0xC3);
  CHECK(i2c_read_regs(DEV_ADDR, 7, buf, 2) == 0 && buf[0] == 0x5A && buf[1] == 0xC3);
  /* nobody at 0x50: NACK on the address */
  CHECK(i2c_read_regs(0x50, 0, buf, 1) == -1);
  CHECK(line_scl && line_sda);                       /* bus released and idle */
  /* the slave stretches the clock after every byte it receives */
  dev.stretch_cycles = 25; long before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 4) == 0 && buf[0] == 0xA0 && buf[3] == 0xA3);
  long stretched = delays - before; dev.stretch_cycles = 0; before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 4) == 0);
  long plain = delays - before;
  printf("clock stretching: the same read took %ld half-bits instead of %ld, data still correct\\n", stretched, plain);
  CHECK(stretched > plain + 40);              /* two received bytes, 25 half-bits each */
  /* SDA changed while SCL was high only for STARTs and STOPs:
     per read 2 STARTs + 1 STOP; per write 1 START + 1 STOP; the failed read 1 + 1 */
  int expect = 3 * 5 + 2 * 1 + 2;
  printf("SDA changed with SCL high %d times = START/STOP count %d\\n", sda_changes_while_scl_high, expect);
  CHECK(sda_changes_while_scl_high == expect);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};