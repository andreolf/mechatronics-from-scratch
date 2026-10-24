var e=`p11-l03`,t=40,n=`A CRC is the remainder of dividing the message, read as a polynomial over GF(2), by a fixed generator, so it catches every single-bit error, every burst shorter than the CRC and every odd number of flips for the right generator, where a byte sum misses many double errors. You derive the division, write bitwise and table-driven CRC-8 and CRC-16 that match the standard check values, and measure which errors each checksum misses.`,r=`<h2 id="arithmetic-with-no-carries">Arithmetic with no carries</h2>
<p>Read a bit string as a polynomial with coefficients 0 or 1: 1011 is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">3</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span>. In GF(2), addition is XOR and there are no carries, so subtraction is also XOR. Polynomial long division then works like ordinary long division, but each “subtract” is an XOR.</p>
<p>A CRC with an <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>-bit generator <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">G</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span></span></span></span> (degree <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>) is:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">CRC</span></span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.109em;">M</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">M</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.7144em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord"><span class="mord mathrm">mod</span></span></span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">G</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>Append those <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span> bits to the message and the whole codeword is divisible by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span>. The receiver divides again: a non-zero remainder means an error. An error pattern <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span></span></span></span> slips through only if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span> divides <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span></span></span></span>.</p>
<h2 id="what-a-good-generator-guarantees">What a good generator guarantees</h2>
<ul>
<li><strong>Single-bit errors</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8247em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span></span></span></span></span></span></span></span>: caught if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span> has more than one term.</li>
<li><strong>Two-bit errors</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.908em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8247em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0572em;">j</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0747em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0572em;">j</span></span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">i</span><span class="mbin mtight">−</span><span class="mord mathnormal mtight" style="margin-right:0.0572em;">j</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span>: caught if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span> doesn’t divide <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.9324em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8491em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> for any <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> up to the codeword length. CRC-16/CCITT’s generator <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">16</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">12</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">5</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> is fine up to 32 767 bits.</li>
<li><strong>Odd numbers of flips</strong>: caught if <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mclose">)</span></span></span></span> divides <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span>, because then <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mopen">(</span><span class="mord">1</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> isn’t divisible. CCITT’s generator has that factor.</li>
<li><strong>Bursts</strong> of length <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7719em;vertical-align:-0.136em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0747em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0572em;">j</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mop">de<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, which <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span> (degree <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span>, with a constant term) can’t divide. Bursts of length <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> slip through only when <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span>: one pattern in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span></span></span></span></span></span></span></span>.</li>
<li><strong>Anything else</strong>: about one in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6644em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6644em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0278em;">r</span></span></span></span></span></span></span></span></span></span></span> random errors survives.</li>
</ul>
<p>A byte sum (checksum-8) or XOR misses two flips of the same bit in different bytes whenever they cancel, which happens a lot. On a 16-byte message the code below finds that the byte sum misses 168 of the 9 180 possible double-bit errors in its 136-bit codeword, CRC-8 misses 9 of 9 180 (its generator repeats after 127 bits, shorter than the codeword), and CRC-16 misses none of 10 296.</p>
<h2 id="table-driven">Table-driven</h2>
<p>The bitwise loop does one shift and a conditional XOR per bit. Because the CRC is linear, the effect of the top 8 bits on the register can be precomputed for all 256 values: process a byte at a time with one table lookup, eight times faster. The same table idea works in C on an MCU (512 bytes of flash for CRC-16), and many MCUs have a CRC peripheral.</p>
<p>There are dozens of named CRCs that differ in polynomial, initial value, bit order (<em>reflected</em> or not) and a final XOR. Always check against the published <strong>check value</strong>, the CRC of the ASCII string “123456789”.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="crcdetect" data-args="{}"></div></div><figcaption>Which errors each check catches. Pick an error type; the bars show the fraction of error patterns each check lets through on a 16-byte message, computed in your browser (exhaustively for single, double and short-burst errors, by random sampling otherwise).</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Divide the message 1101 by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">3</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> (1011) for a 3-bit CRC.</p>
<ol>
<li>Append three zeros: 1101 000.</li>
<li>XOR 1011 under the leading 1: 1101 ⊕ 1011 = 0110, bring down: 110 0.</li>
<li>1100 ⊕ 1011 = 0111, bring down: 111 0.</li>
<li>1110 ⊕ 1011 = 0101, bring down the last 0: 1010 ⊕ 1011 = 0001.</li>
<li>The remainder is 001, the codeword is 1101 001, and dividing 1101001 by 1011 leaves 0.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">crc.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> binascii, random, zlib

<span class="hljs-keyword">def</span> <span class="hljs-title function_">crc_bitwise</span>(<span class="hljs-params">data, width, poly, init, refin=<span class="hljs-literal">False</span>, refout=<span class="hljs-literal">False</span>, xorout=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;MSB-first shift register; reflected variants shift right with the reversed polynomial&quot;&quot;&quot;</span>
    mask = (<span class="hljs-number">1</span> &lt;&lt; width) - <span class="hljs-number">1</span>
    <span class="hljs-keyword">if</span> refin:
        rpoly = <span class="hljs-built_in">int</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{poly:<span class="hljs-number">0</span>{width}</span>b}&quot;</span>[::-<span class="hljs-number">1</span>], <span class="hljs-number">2</span>)
        crc = <span class="hljs-built_in">int</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{init:<span class="hljs-number">0</span>{width}</span>b}&quot;</span>[::-<span class="hljs-number">1</span>], <span class="hljs-number">2</span>)
        <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> data:
            crc ^= b
            <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span>):
                crc = (crc &gt;&gt; <span class="hljs-number">1</span>) ^ rpoly <span class="hljs-keyword">if</span> crc &amp; <span class="hljs-number">1</span> <span class="hljs-keyword">else</span> crc &gt;&gt; <span class="hljs-number">1</span>
        out = crc <span class="hljs-keyword">if</span> refout <span class="hljs-keyword">else</span> <span class="hljs-built_in">int</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{crc:<span class="hljs-number">0</span>{width}</span>b}&quot;</span>[::-<span class="hljs-number">1</span>], <span class="hljs-number">2</span>)
    <span class="hljs-keyword">else</span>:
        crc = init
        <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> data:
            crc ^= b &lt;&lt; (width - <span class="hljs-number">8</span>)
            <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span>):
                crc = ((crc &lt;&lt; <span class="hljs-number">1</span>) ^ poly) &amp; mask <span class="hljs-keyword">if</span> crc &amp; (<span class="hljs-number">1</span> &lt;&lt; (width - <span class="hljs-number">1</span>)) <span class="hljs-keyword">else</span> (crc &lt;&lt; <span class="hljs-number">1</span>) &amp; mask
        out = crc
    <span class="hljs-keyword">return</span> out ^ xorout

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_table</span>(<span class="hljs-params">width, poly</span>):
    mask, top = (<span class="hljs-number">1</span> &lt;&lt; width) - <span class="hljs-number">1</span>, <span class="hljs-number">1</span> &lt;&lt; (width - <span class="hljs-number">1</span>)
    table = []
    <span class="hljs-keyword">for</span> byte <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">256</span>):
        crc = byte &lt;&lt; (width - <span class="hljs-number">8</span>)
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span>):
            crc = ((crc &lt;&lt; <span class="hljs-number">1</span>) ^ poly) &amp; mask <span class="hljs-keyword">if</span> crc &amp; top <span class="hljs-keyword">else</span> (crc &lt;&lt; <span class="hljs-number">1</span>) &amp; mask
        table.append(crc)
    <span class="hljs-keyword">return</span> table

T8, T16 = make_table(<span class="hljs-number">8</span>, <span class="hljs-number">0x07</span>), make_table(<span class="hljs-number">16</span>, <span class="hljs-number">0x1021</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">crc8</span>(<span class="hljs-params">data, init=<span class="hljs-number">0x00</span></span>):                       <span class="hljs-comment"># CRC-8 (SMBus), poly x^8+x^2+x+1</span>
    crc = init
    <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> data:
        crc = T8[crc ^ b]
    <span class="hljs-keyword">return</span> crc

<span class="hljs-keyword">def</span> <span class="hljs-title function_">crc16_ccitt</span>(<span class="hljs-params">data, init=<span class="hljs-number">0xFFFF</span></span>):              <span class="hljs-comment"># CRC-16/CCITT-FALSE, poly 0x1021</span>
    crc = init
    <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> data:
        crc = ((crc &lt;&lt; <span class="hljs-number">8</span>) &amp; <span class="hljs-number">0xFFFF</span>) ^ T16[(crc &gt;&gt; <span class="hljs-number">8</span>) ^ b]
    <span class="hljs-keyword">return</span> crc

RT16 = []                                        <span class="hljs-comment"># reflected table for CRC-16/MODBUS (poly 0x8005 reversed = 0xA001)</span>
<span class="hljs-keyword">for</span> byte <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">256</span>):
    c = byte
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span>):
        c = (c &gt;&gt; <span class="hljs-number">1</span>) ^ <span class="hljs-number">0xA001</span> <span class="hljs-keyword">if</span> c &amp; <span class="hljs-number">1</span> <span class="hljs-keyword">else</span> c &gt;&gt; <span class="hljs-number">1</span>
    RT16.append(c)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">crc16_modbus</span>(<span class="hljs-params">data</span>):
    crc = <span class="hljs-number">0xFFFF</span>
    <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> data:
        crc = (crc &gt;&gt; <span class="hljs-number">8</span>) ^ RT16[(crc ^ b) &amp; <span class="hljs-number">0xFF</span>]
    <span class="hljs-keyword">return</span> crc

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_check_values</span>():
    check = <span class="hljs-string">b&quot;123456789&quot;</span>
    <span class="hljs-keyword">assert</span> crc8(check) == <span class="hljs-number">0xF4</span> == crc_bitwise(check, <span class="hljs-number">8</span>, <span class="hljs-number">0x07</span>, <span class="hljs-number">0</span>)
    <span class="hljs-keyword">assert</span> crc16_ccitt(check) == <span class="hljs-number">0x29B1</span> == crc_bitwise(check, <span class="hljs-number">16</span>, <span class="hljs-number">0x1021</span>, <span class="hljs-number">0xFFFF</span>)
    <span class="hljs-keyword">assert</span> crc16_modbus(check) == <span class="hljs-number">0x4B37</span> == crc_bitwise(check, <span class="hljs-number">16</span>, <span class="hljs-number">0x8005</span>, <span class="hljs-number">0xFFFF</span>, <span class="hljs-literal">True</span>, <span class="hljs-literal">True</span>)
    <span class="hljs-keyword">assert</span> crc_bitwise(check, <span class="hljs-number">32</span>, <span class="hljs-number">0x04C11DB7</span>, <span class="hljs-number">0xFFFFFFFF</span>, <span class="hljs-literal">True</span>, <span class="hljs-literal">True</span>, <span class="hljs-number">0xFFFFFFFF</span>) == <span class="hljs-number">0xCBF43926</span> == zlib.crc32(check)
    rng = random.Random(<span class="hljs-number">1</span>)
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">300</span>):
        d = <span class="hljs-built_in">bytes</span>(rng.randrange(<span class="hljs-number">256</span>) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(rng.randrange(<span class="hljs-number">0</span>, <span class="hljs-number">64</span>)))
        <span class="hljs-keyword">assert</span> crc16_ccitt(d) == binascii.crc_hqx(d, <span class="hljs-number">0xFFFF</span>) == crc_bitwise(d, <span class="hljs-number">16</span>, <span class="hljs-number">0x1021</span>, <span class="hljs-number">0xFFFF</span>)
        <span class="hljs-keyword">assert</span> crc8(d) == crc_bitwise(d, <span class="hljs-number">8</span>, <span class="hljs-number">0x07</span>, <span class="hljs-number">0</span>)
        <span class="hljs-keyword">assert</span> crc16_modbus(d) == crc_bitwise(d, <span class="hljs-number">16</span>, <span class="hljs-number">0x8005</span>, <span class="hljs-number">0xFFFF</span>, <span class="hljs-literal">True</span>, <span class="hljs-literal">True</span>)
        cw = d + crc16_ccitt(d).to_bytes(<span class="hljs-number">2</span>, <span class="hljs-string">&quot;big&quot;</span>)
        <span class="hljs-keyword">assert</span> crc16_ccitt(cw) == <span class="hljs-number">0</span>                       <span class="hljs-comment"># the codeword is divisible by G</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;check values match: CRC-8 0xF4, CCITT 0x29B1, MODBUS 0x4B37, CRC-32 0xCBF43926 (= zlib)&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_hand_division</span>():
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">polymod</span>(<span class="hljs-params">a, g</span>):
        <span class="hljs-keyword">while</span> a.bit_length() &gt;= g.bit_length():
            a ^= g &lt;&lt; (a.bit_length() - g.bit_length())
        <span class="hljs-keyword">return</span> a
    <span class="hljs-keyword">assert</span> polymod(<span class="hljs-number">0b1101000</span>, <span class="hljs-number">0b1011</span>) == <span class="hljs-number">0b001</span>
    <span class="hljs-keyword">assert</span> polymod(<span class="hljs-number">0b1101001</span>, <span class="hljs-number">0b1011</span>) == <span class="hljs-number">0</span>

<span class="hljs-comment"># --- which errors slip through? (linearity: an error is missed iff its own syndrome is 0) ---</span>
N = <span class="hljs-number">16</span>                                                   <span class="hljs-comment"># message bytes</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">syndromes</span>(<span class="hljs-params">check_fn, nbytes_check</span>):
    <span class="hljs-string">&quot;&quot;&quot;syndrome of each single-bit error over the whole codeword, by linearity&quot;&quot;&quot;</span>
    L = N + nbytes_check
    base = check_fn(<span class="hljs-built_in">bytes</span>(L))
    syn = []
    <span class="hljs-keyword">for</span> bit <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span> * L):
        e = <span class="hljs-built_in">bytearray</span>(L); e[bit // <span class="hljs-number">8</span>] |= <span class="hljs-number">0x80</span> &gt;&gt; (bit % <span class="hljs-number">8</span>)
        syn.append(check_fn(<span class="hljs-built_in">bytes</span>(e)) ^ base)
    <span class="hljs-keyword">return</span> syn

<span class="hljs-keyword">def</span> <span class="hljs-title function_">codeword_crc16</span>(<span class="hljs-params">cw</span>):                                 <span class="hljs-comment"># remainder of the codeword: 0 when intact</span>
    <span class="hljs-keyword">return</span> crc16_ccitt(cw[:N]) ^ <span class="hljs-built_in">int</span>.from_bytes(cw[N:], <span class="hljs-string">&quot;big&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">codeword_crc8</span>(<span class="hljs-params">cw</span>):
    <span class="hljs-keyword">return</span> crc8(cw[:N]) ^ cw[N]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">codeword_sum8</span>(<span class="hljs-params">cw</span>):
    <span class="hljs-keyword">return</span> (<span class="hljs-built_in">sum</span>(cw[:N]) - cw[N]) &amp; <span class="hljs-number">0xFF</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">missed_double</span>(<span class="hljs-params">check_fn, ncheck, msg</span>):
    <span class="hljs-string">&quot;&quot;&quot;exhaustive: every pair of flipped bits in the codeword of a real message&quot;&quot;&quot;</span>
    L = N + ncheck
    <span class="hljs-keyword">if</span> check_fn <span class="hljs-keyword">is</span> codeword_sum8:
        cw = msg + <span class="hljs-built_in">bytes</span>([<span class="hljs-built_in">sum</span>(msg) &amp; <span class="hljs-number">0xFF</span>])
    <span class="hljs-keyword">elif</span> check_fn <span class="hljs-keyword">is</span> codeword_crc8:
        cw = msg + <span class="hljs-built_in">bytes</span>([crc8(msg)])
    <span class="hljs-keyword">else</span>:
        cw = msg + crc16_ccitt(msg).to_bytes(<span class="hljs-number">2</span>, <span class="hljs-string">&quot;big&quot;</span>)
    <span class="hljs-keyword">assert</span> check_fn(cw) == <span class="hljs-number">0</span>
    missed = total = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">8</span> * L):
        <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(i + <span class="hljs-number">1</span>, <span class="hljs-number">8</span> * L):
            e = <span class="hljs-built_in">bytearray</span>(cw); e[i // <span class="hljs-number">8</span>] ^= <span class="hljs-number">0x80</span> &gt;&gt; (i % <span class="hljs-number">8</span>); e[j // <span class="hljs-number">8</span>] ^= <span class="hljs-number">0x80</span> &gt;&gt; (j % <span class="hljs-number">8</span>)
            total += <span class="hljs-number">1</span>
            missed += check_fn(<span class="hljs-built_in">bytes</span>(e)) == <span class="hljs-number">0</span>
    <span class="hljs-keyword">return</span> missed, total

<span class="hljs-keyword">def</span> <span class="hljs-title function_">bursts</span>(<span class="hljs-params">syn, length</span>):
    <span class="hljs-string">&quot;&quot;&quot;count undetected bursts of exactly this length (first and last bit flipped)&quot;&quot;&quot;</span>
    nbits, missed, total = <span class="hljs-built_in">len</span>(syn), <span class="hljs-number">0</span>, <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> start <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(nbits - length + <span class="hljs-number">1</span>):
        ends = syn[start] ^ syn[start + length - <span class="hljs-number">1</span>]
        mids = syn[start + <span class="hljs-number">1</span>:start + length - <span class="hljs-number">1</span>]
        acc = [ends]
        <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> mids:                                   <span class="hljs-comment"># all subsets of the middle bits</span>
            acc = acc + [a ^ s <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> acc]
        total += <span class="hljs-built_in">len</span>(acc)
        missed += acc.count(<span class="hljs-number">0</span>)
    <span class="hljs-keyword">return</span> missed, total

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_error_detection</span>():
    msg = <span class="hljs-built_in">bytes</span>(random.Random(<span class="hljs-number">7</span>).randrange(<span class="hljs-number">256</span>) <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N))
    s16 = syndromes(codeword_crc16, <span class="hljs-number">2</span>)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">all</span>(s16)                                      <span class="hljs-comment"># every single-bit error caught</span>
    m16, tot = missed_double(codeword_crc16, <span class="hljs-number">2</span>, msg)
    m8, _ = missed_double(codeword_crc8, <span class="hljs-number">1</span>, msg)
    ms, _ = missed_double(codeword_sum8, <span class="hljs-number">1</span>, msg)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;double-bit errors missed: CRC-16 <span class="hljs-subst">{m16}</span>, CRC-8 <span class="hljs-subst">{m8}</span>, sum-8 <span class="hljs-subst">{ms}</span> (of about <span class="hljs-subst">{tot}</span>)&quot;</span>)
    <span class="hljs-keyword">assert</span> m16 == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> ms &gt; <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> L <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">2</span>, <span class="hljs-number">17</span>):
        missed, total = bursts(s16, L)
        <span class="hljs-keyword">assert</span> missed == <span class="hljs-number">0</span>, L                            <span class="hljs-comment"># every burst up to 16 bits</span>
    missed, total = bursts(s16, <span class="hljs-number">17</span>)
    positions = <span class="hljs-built_in">len</span>(s16) - <span class="hljs-number">17</span> + <span class="hljs-number">1</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;bursts of 17 bits: <span class="hljs-subst">{missed}</span> missed of <span class="hljs-subst">{total}</span> = 1 in <span class="hljs-subst">{total // missed}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> missed == positions                           <span class="hljs-comment"># only B(x) = G(x) at each position: 1 in 2^15</span>
    rng = random.Random(<span class="hljs-number">3</span>)
    odd_missed = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20000</span>):
        k = rng.choice([<span class="hljs-number">3</span>, <span class="hljs-number">5</span>, <span class="hljs-number">7</span>, <span class="hljs-number">9</span>])
        e = <span class="hljs-number">0</span>
        <span class="hljs-keyword">for</span> b <span class="hljs-keyword">in</span> rng.sample(<span class="hljs-built_in">range</span>(<span class="hljs-built_in">len</span>(s16)), k):
            e ^= s16[b]
        odd_missed += e == <span class="hljs-number">0</span>
    <span class="hljs-keyword">assert</span> odd_missed == <span class="hljs-number">0</span>                               <span class="hljs-comment"># (x+1) divides G: all odd-weight errors caught</span>
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;all single, double, odd-weight and &lt;=16-bit burst errors caught by CRC-16/CCITT&quot;</span>)

test_check_values()
test_hand_division()
test_error_detection()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your Modbus frame’s CRC check fails on every frame, but the bytes look right. What’s the likely cause?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Byte order or bit reflection. Modbus RTU sends its CRC-16 low byte first and uses the reflected algorithm (0xA001, shift right). Computing CCITT-style MSB-first, or appending the CRC high byte first, gives a “wrong” value on every frame. Check your function against 0x4B37 for “123456789”.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why can a CRC detect all bursts up to 16 bits but not guarantee detecting four random flips?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A burst confines the error polynomial to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0747em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8247em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0572em;">j</span></span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mclose">)</span></span></span></span> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mop">de<span style="margin-right:0.0139em;">g</span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">16</span></span></span></span>, which a degree-16 generator with a constant term can’t divide. Four scattered flips form a polynomial of high degree; some of those are multiples of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">G</span></span></span></span>, roughly a <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">16</span></span></span></span></span></span></span></span></span></span></span></span> fraction, so a few slip through.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l03"></div>

`,i=[{id:`arithmetic-with-no-carries`,title:`Arithmetic with no carries`},{id:`what-a-good-generator-guarantees`,title:`What a good generator guarantees`},{id:`table-driven`,title:`Table-driven`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l03-q1`,type:`num`,q:`<p>CRC-16/CCITT-FALSE check value of “123456789”, in decimal?</p>
`,explain:`<p>0x29B1.</p>
`,answer:10673,tol:0,unit:``},{id:`p11-l03-q2`,type:`num`,q:`<p>Fraction of 17-bit bursts a CRC-16 misses, as 1 in how many?</p>
`,explain:`<p>Only B = G, one in 2^(r−1).</p>
`,answer:32768,tol:0,unit:``},{id:`p11-l03-q3`,type:`num`,q:`<p>Approximate fraction of random errors a CRC-32 misses, as 1 in how many?</p>
`,explain:`<p>2^−r.</p>
`,answer:4294967296,tol:1e-4,unit:``},{id:`p11-l03-q4`,type:`num`,q:`<p>Table size in bytes for a byte-wise CRC-16 table?</p>
`,explain:`<p>256 entries of 2 bytes.</p>
`,answer:512,tol:0,unit:`bytes`},{id:`p11-l03-q5`,type:`mc`,q:`<p>The remainder of 1101000 divided by 1011 in GF(2) is…</p>
`,explain:`<p>The worked example.</p>
`,options:[`001`,`101`,`000`,`011`],answer:0},{id:`p11-l03-q6`,type:`mc`,q:`<p>Why does a generator with a factor (x+1) catch every odd number of flips?</p>
`,explain:`<p>Multiples of (x+1) evaluate to 0 at x = 1.</p>
`,options:[`because E(1) = 1 for odd weight, which a multiple of (x+1) can’t be`,`it doesn’t`,`because the CRC is reflected`,`because odd errors are bursts`],answer:0}],o=[{file:`crc.py`,lang:`python`,src:`import binascii, random, zlib

def crc_bitwise(data, width, poly, init, refin=False, refout=False, xorout=0):
    """MSB-first shift register; reflected variants shift right with the reversed polynomial"""
    mask = (1 << width) - 1
    if refin:
        rpoly = int(f"{poly:0{width}b}"[::-1], 2)
        crc = int(f"{init:0{width}b}"[::-1], 2)
        for b in data:
            crc ^= b
            for _ in range(8):
                crc = (crc >> 1) ^ rpoly if crc & 1 else crc >> 1
        out = crc if refout else int(f"{crc:0{width}b}"[::-1], 2)
    else:
        crc = init
        for b in data:
            crc ^= b << (width - 8)
            for _ in range(8):
                crc = ((crc << 1) ^ poly) & mask if crc & (1 << (width - 1)) else (crc << 1) & mask
        out = crc
    return out ^ xorout

def make_table(width, poly):
    mask, top = (1 << width) - 1, 1 << (width - 1)
    table = []
    for byte in range(256):
        crc = byte << (width - 8)
        for _ in range(8):
            crc = ((crc << 1) ^ poly) & mask if crc & top else (crc << 1) & mask
        table.append(crc)
    return table

T8, T16 = make_table(8, 0x07), make_table(16, 0x1021)

def crc8(data, init=0x00):                       # CRC-8 (SMBus), poly x^8+x^2+x+1
    crc = init
    for b in data:
        crc = T8[crc ^ b]
    return crc

def crc16_ccitt(data, init=0xFFFF):              # CRC-16/CCITT-FALSE, poly 0x1021
    crc = init
    for b in data:
        crc = ((crc << 8) & 0xFFFF) ^ T16[(crc >> 8) ^ b]
    return crc

RT16 = []                                        # reflected table for CRC-16/MODBUS (poly 0x8005 reversed = 0xA001)
for byte in range(256):
    c = byte
    for _ in range(8):
        c = (c >> 1) ^ 0xA001 if c & 1 else c >> 1
    RT16.append(c)

def crc16_modbus(data):
    crc = 0xFFFF
    for b in data:
        crc = (crc >> 8) ^ RT16[(crc ^ b) & 0xFF]
    return crc

def test_check_values():
    check = b"123456789"
    assert crc8(check) == 0xF4 == crc_bitwise(check, 8, 0x07, 0)
    assert crc16_ccitt(check) == 0x29B1 == crc_bitwise(check, 16, 0x1021, 0xFFFF)
    assert crc16_modbus(check) == 0x4B37 == crc_bitwise(check, 16, 0x8005, 0xFFFF, True, True)
    assert crc_bitwise(check, 32, 0x04C11DB7, 0xFFFFFFFF, True, True, 0xFFFFFFFF) == 0xCBF43926 == zlib.crc32(check)
    rng = random.Random(1)
    for _ in range(300):
        d = bytes(rng.randrange(256) for _ in range(rng.randrange(0, 64)))
        assert crc16_ccitt(d) == binascii.crc_hqx(d, 0xFFFF) == crc_bitwise(d, 16, 0x1021, 0xFFFF)
        assert crc8(d) == crc_bitwise(d, 8, 0x07, 0)
        assert crc16_modbus(d) == crc_bitwise(d, 16, 0x8005, 0xFFFF, True, True)
        cw = d + crc16_ccitt(d).to_bytes(2, "big")
        assert crc16_ccitt(cw) == 0                       # the codeword is divisible by G
    print("check values match: CRC-8 0xF4, CCITT 0x29B1, MODBUS 0x4B37, CRC-32 0xCBF43926 (= zlib)")

def test_hand_division():
    def polymod(a, g):
        while a.bit_length() >= g.bit_length():
            a ^= g << (a.bit_length() - g.bit_length())
        return a
    assert polymod(0b1101000, 0b1011) == 0b001
    assert polymod(0b1101001, 0b1011) == 0

# --- which errors slip through? (linearity: an error is missed iff its own syndrome is 0) ---
N = 16                                                   # message bytes

def syndromes(check_fn, nbytes_check):
    """syndrome of each single-bit error over the whole codeword, by linearity"""
    L = N + nbytes_check
    base = check_fn(bytes(L))
    syn = []
    for bit in range(8 * L):
        e = bytearray(L); e[bit // 8] |= 0x80 >> (bit % 8)
        syn.append(check_fn(bytes(e)) ^ base)
    return syn

def codeword_crc16(cw):                                 # remainder of the codeword: 0 when intact
    return crc16_ccitt(cw[:N]) ^ int.from_bytes(cw[N:], "big")

def codeword_crc8(cw):
    return crc8(cw[:N]) ^ cw[N]

def codeword_sum8(cw):
    return (sum(cw[:N]) - cw[N]) & 0xFF

def missed_double(check_fn, ncheck, msg):
    """exhaustive: every pair of flipped bits in the codeword of a real message"""
    L = N + ncheck
    if check_fn is codeword_sum8:
        cw = msg + bytes([sum(msg) & 0xFF])
    elif check_fn is codeword_crc8:
        cw = msg + bytes([crc8(msg)])
    else:
        cw = msg + crc16_ccitt(msg).to_bytes(2, "big")
    assert check_fn(cw) == 0
    missed = total = 0
    for i in range(8 * L):
        for j in range(i + 1, 8 * L):
            e = bytearray(cw); e[i // 8] ^= 0x80 >> (i % 8); e[j // 8] ^= 0x80 >> (j % 8)
            total += 1
            missed += check_fn(bytes(e)) == 0
    return missed, total

def bursts(syn, length):
    """count undetected bursts of exactly this length (first and last bit flipped)"""
    nbits, missed, total = len(syn), 0, 0
    for start in range(nbits - length + 1):
        ends = syn[start] ^ syn[start + length - 1]
        mids = syn[start + 1:start + length - 1]
        acc = [ends]
        for s in mids:                                   # all subsets of the middle bits
            acc = acc + [a ^ s for a in acc]
        total += len(acc)
        missed += acc.count(0)
    return missed, total

def test_error_detection():
    msg = bytes(random.Random(7).randrange(256) for _ in range(N))
    s16 = syndromes(codeword_crc16, 2)
    assert all(s16)                                      # every single-bit error caught
    m16, tot = missed_double(codeword_crc16, 2, msg)
    m8, _ = missed_double(codeword_crc8, 1, msg)
    ms, _ = missed_double(codeword_sum8, 1, msg)
    print(f"double-bit errors missed: CRC-16 {m16}, CRC-8 {m8}, sum-8 {ms} (of about {tot})")
    assert m16 == 0 and ms > 0
    for L in range(2, 17):
        missed, total = bursts(s16, L)
        assert missed == 0, L                            # every burst up to 16 bits
    missed, total = bursts(s16, 17)
    positions = len(s16) - 17 + 1
    print(f"bursts of 17 bits: {missed} missed of {total} = 1 in {total // missed}")
    assert missed == positions                           # only B(x) = G(x) at each position: 1 in 2^15
    rng = random.Random(3)
    odd_missed = 0
    for _ in range(20000):
        k = rng.choice([3, 5, 7, 9])
        e = 0
        for b in rng.sample(range(len(s16)), k):
            e ^= s16[b]
        odd_missed += e == 0
    assert odd_missed == 0                               # (x+1) divides G: all odd-weight errors caught
    print("all single, double, odd-weight and <=16-bit burst errors caught by CRC-16/CCITT")

test_check_values()
test_hand_division()
test_error_detection()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};