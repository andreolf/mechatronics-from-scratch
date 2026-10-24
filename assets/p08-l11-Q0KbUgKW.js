var e=`p08-l11`,t=35,n=`The FFT assumes the record repeats forever, so a sine that doesn’t fit a whole number of periods leaks into every bin. You derive leakage and scalloping loss, compare rectangular, Hann and flat-top windows, and show that the flat-top window reads a tone’s amplitude within 0.1 dB wherever it falls between bins.`,r=`<h2 id="why-leakage-happens">Why leakage happens</h2>
<p>An <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>-point FFT treats the record as one period of a periodic signal. A sine with an integer number of cycles in the record lands exactly on one bin. Any other frequency leaves a jump where the end of the record meets the start, and that discontinuity spreads energy across all bins: <strong>leakage</strong>.</p>
<p>Mathematically, the record is the signal multiplied by a rectangular window, so the spectrum is convolved with the window’s transform, a Dirichlet kernel (lesson 2) with sidelobes only 13 dB down that decay slowly.</p>
<h2 id="windows-trade-resolution-for-leakage">Windows trade resolution for leakage</h2>
<p>Taper the record smoothly to zero at both ends, and the discontinuity disappears:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>Window</th>
<th>Highest sidelobe</th>
<th>Main lobe (bins)</th>
<th>Scalloping loss</th>
</tr>
</thead>
<tbody><tr>
<td>Rectangular</td>
<td>−13 dB</td>
<td>2</td>
<td>3.92 dB</td>
</tr>
<tr>
<td>Hann</td>
<td>−31 dB</td>
<td>4</td>
<td>1.42 dB</td>
</tr>
<tr>
<td>Flat-top</td>
<td>−93 dB</td>
<td>10</td>
<td>&lt; 0.02 dB</td>
</tr>
</tbody></table></div>
<p><strong>Scalloping loss</strong> is how much a tone’s peak reads low when it falls exactly halfway between two bins. The wider the main lobe, the flatter the top, and the less the reading depends on where the tone falls.</p>
<p>So pick for the job:</p>
<ul>
<li><strong>Rectangular</strong>: transients, or coherent sampling (Phase 07 lesson 17).</li>
<li><strong>Hann</strong>: general analysis, a good balance.</li>
<li><strong>Flat-top</strong>: measuring <strong>amplitudes</strong> accurately (calibration, vibration levels), at the cost of resolution.</li>
</ul>
<p>Always correct for the window’s <strong>coherent gain</strong> <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1901em;vertical-align:-0.345em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8451em;"><span style="top:-2.655em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.109em;">N</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.394em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.345em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop op-symbol small-op" style="position:relative;top:0em;">∑</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mopen">[</span><span class="mord mathnormal">n</span><span class="mclose">]</span></span></span></span> when reading amplitudes.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="leakage" data-args="{}"></div></div><figcaption>A unit sine between FFT bins. Slide it halfway between bins: rectangular reads nearly 4 dB low, Hann 1.4 dB, flat-top almost exactly 0 dB.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A vibration sensor sees a 1 g tone at 101.7 Hz, sampled at 1024 Hz with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1024</span></span></span></span>, so the bins are 1 Hz apart and the tone sits 0.3 bin off bin 102.</p>
<ol>
<li>Rectangular: the peak bin reads <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">∣</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop"><span class="mord mathrm">sinc</span></span><span class="mopen">(</span><span class="mord">0.3</span><span class="mclose">)</span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.858</span></span></span></span> g, which is −1.33 dB.</li>
<li>Hann reads −0.51 dB.</li>
<li>Flat-top reads within 0.01 dB of 1 g.</li>
<li>To <em>separate</em> two tones 2 Hz apart, flat-top’s 10-bin main lobe is too wide; use Hann and a longer record.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">leakage.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">from</span> scipy <span class="hljs-keyword">import</span> signal

N = <span class="hljs-number">1024</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">window</span>(<span class="hljs-params">kind</span>):
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;rect&quot;</span>:
        <span class="hljs-keyword">return</span> np.ones(N)
    <span class="hljs-keyword">if</span> kind == <span class="hljs-string">&quot;hann&quot;</span>:
        <span class="hljs-keyword">return</span> signal.get_window(<span class="hljs-string">&quot;hann&quot;</span>, N)
    <span class="hljs-keyword">return</span> signal.get_window(<span class="hljs-string">&quot;flattop&quot;</span>, N)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">peak_amplitude</span>(<span class="hljs-params">offset_bins, kind, k0=<span class="hljs-number">100</span></span>):
    w = window(kind)
    n = np.arange(N)
    x = np.sin(<span class="hljs-number">2</span> * np.pi * (k0 + offset_bins) * n / N)
    X = np.fft.rfft(x * w)
    <span class="hljs-keyword">return</span> <span class="hljs-number">2</span> * np.<span class="hljs-built_in">abs</span>(X).<span class="hljs-built_in">max</span>() / w.<span class="hljs-built_in">sum</span>()                 <span class="hljs-comment"># coherent-gain corrected</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sidelobe_db</span>(<span class="hljs-params">kind</span>):
    W = np.<span class="hljs-built_in">abs</span>(np.fft.rfft(window(kind), <span class="hljs-number">64</span> * N))
    W /= W[<span class="hljs-number">0</span>]
    <span class="hljs-comment"># end of the main lobe = first local minimum (flat-top&#x27;s top bulges, so not the first rise)</span>
    first_null = np.where((W[<span class="hljs-number">1</span>:-<span class="hljs-number">1</span>] &lt; W[:-<span class="hljs-number">2</span>]) &amp; (W[<span class="hljs-number">1</span>:-<span class="hljs-number">1</span>] &lt; W[<span class="hljs-number">2</span>:]))[<span class="hljs-number">0</span>][<span class="hljs-number">0</span>] + <span class="hljs-number">1</span>
    <span class="hljs-keyword">return</span> <span class="hljs-number">20</span> * np.log10(W[first_null:].<span class="hljs-built_in">max</span>())

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    offsets = np.linspace(<span class="hljs-number">0</span>, <span class="hljs-number">0.5</span>, <span class="hljs-number">51</span>)
    worst = {k: <span class="hljs-built_in">min</span>(<span class="hljs-number">20</span> * np.log10(peak_amplitude(o, k)) <span class="hljs-keyword">for</span> o <span class="hljs-keyword">in</span> offsets) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;rect&quot;</span>, <span class="hljs-string">&quot;hann&quot;</span>, <span class="hljs-string">&quot;flattop&quot;</span>)}
    <span class="hljs-built_in">print</span>({k: <span class="hljs-built_in">round</span>(v, <span class="hljs-number">3</span>) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> worst.items()})
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(worst[<span class="hljs-string">&quot;rect&quot;</span>] + <span class="hljs-number">3.92</span>) &lt; <span class="hljs-number">0.02</span> <span class="hljs-keyword">and</span> <span class="hljs-built_in">abs</span>(worst[<span class="hljs-string">&quot;hann&quot;</span>] + <span class="hljs-number">1.42</span>) &lt; <span class="hljs-number">0.02</span> <span class="hljs-keyword">and</span> worst[<span class="hljs-string">&quot;flattop&quot;</span>] &gt; -<span class="hljs-number">0.1</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(<span class="hljs-number">20</span> * np.log10(peak_amplitude(<span class="hljs-number">0.3</span>, <span class="hljs-string">&quot;rect&quot;</span>)) - <span class="hljs-number">20</span> * np.log10(np.sinc(<span class="hljs-number">0.3</span>))) &lt; <span class="hljs-number">0.02</span>
    sl = {k: sidelobe_db(k) <span class="hljs-keyword">for</span> k <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;rect&quot;</span>, <span class="hljs-string">&quot;hann&quot;</span>, <span class="hljs-string">&quot;flattop&quot;</span>)}
    <span class="hljs-built_in">print</span>({k: <span class="hljs-built_in">round</span>(v, <span class="hljs-number">1</span>) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> sl.items()})
    <span class="hljs-keyword">assert</span> -<span class="hljs-number">14</span> &lt; sl[<span class="hljs-string">&quot;rect&quot;</span>] &lt; -<span class="hljs-number">13</span> <span class="hljs-keyword">and</span> -<span class="hljs-number">32</span> &lt; sl[<span class="hljs-string">&quot;hann&quot;</span>] &lt; -<span class="hljs-number">31</span> <span class="hljs-keyword">and</span> sl[<span class="hljs-string">&quot;flattop&quot;</span>] &lt; -<span class="hljs-number">85</span>
    <span class="hljs-comment"># a tone on a bin doesn&#x27;t leak with any window</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(peak_amplitude(<span class="hljs-number">0.0</span>, <span class="hljs-string">&quot;rect&quot;</span>) - <span class="hljs-number">1</span>) &lt; <span class="hljs-number">1e-9</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why doesn’t zero-padding the record (a longer FFT of the same data) reduce leakage?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Zero-padding just samples the same windowed spectrum more finely. It reduces the scalloping in the <em>displayed</em> peak, but the main lobe width and the sidelobes come from the window and the record length, which haven’t changed.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A Hann-windowed FFT of a 2 g tone reads 1.70 g at its peak bin. Could the tone really be 2 g?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Yes: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">20</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop"><span class="mop">lo<span style="margin-right:0.0139em;">g</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.207em;"><span style="top:-2.4559em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">10</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2441em;"><span></span></span></span></span></span></span><span class="mopen">(</span><span class="mord">1.70/2</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">−</span><span class="mord">1.41</span></span></span></span> dB, which is the Hann worst-case scalloping, so the tone could sit halfway between bins. Use a flat-top window, or interpolate between bins.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p08-l11"></div>

`,i=[{id:`why-leakage-happens`,title:`Why leakage happens`},{id:`windows-trade-resolution-for-leakage`,title:`Windows trade resolution for leakage`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p08-l11-q1`,type:`num`,q:`<p>Worst-case scalloping loss in dB of a rectangular window?</p>
`,explain:`<p>sinc(0.5) = 2/π.</p>
`,answer:-3.92,tol:.005,unit:`dB`},{id:`p08-l11-q2`,type:`num`,q:`<p>Rectangular-window reading in dB for a tone 0.3 bin off-centre?</p>
`,explain:`<p>sinc(0.3).</p>
`,answer:-1.3275,tol:.01,unit:`dB`},{id:`p08-l11-q3`,type:`mc`,q:`<p>For accurate amplitude readings, use…</p>
`,explain:`<p>Its flat main lobe makes scalloping negligible.</p>
`,options:[`a rectangular window`,`a flat-top window`,`no window and zero-padding`,`a shorter record`],answer:1},{id:`p08-l11-q4`,type:`mc`,q:`<p>Leakage is caused by…</p>
`,explain:`<p>The wrap-around discontinuity.</p>
`,options:[`aliasing`,`a non-integer number of cycles in the record`,`quantisation`,`the FFT algorithm’s rounding`],answer:1},{id:`p08-l11-q5`,type:`num`,q:`<p>Highest sidelobe of the Hann window in dB (approximately)?</p>
`,explain:`<p>Versus −13 dB rectangular.</p>
`,answer:-31.5,tol:.02,unit:`dB`},{id:`p08-l11-q6`,type:`num`,q:`<p>Bin spacing in Hz for f_s = 1024 Hz and N = 1024?</p>
`,explain:`<p>f_s/N.</p>
`,answer:1,tol:.001,unit:`Hz`}],o=[{file:`leakage.py`,lang:`python`,src:`import numpy as np
from scipy import signal

N = 1024

def window(kind):
    if kind == "rect":
        return np.ones(N)
    if kind == "hann":
        return signal.get_window("hann", N)
    return signal.get_window("flattop", N)

def peak_amplitude(offset_bins, kind, k0=100):
    w = window(kind)
    n = np.arange(N)
    x = np.sin(2 * np.pi * (k0 + offset_bins) * n / N)
    X = np.fft.rfft(x * w)
    return 2 * np.abs(X).max() / w.sum()                 # coherent-gain corrected

def sidelobe_db(kind):
    W = np.abs(np.fft.rfft(window(kind), 64 * N))
    W /= W[0]
    # end of the main lobe = first local minimum (flat-top's top bulges, so not the first rise)
    first_null = np.where((W[1:-1] < W[:-2]) & (W[1:-1] < W[2:]))[0][0] + 1
    return 20 * np.log10(W[first_null:].max())

if __name__ == "__main__":
    offsets = np.linspace(0, 0.5, 51)
    worst = {k: min(20 * np.log10(peak_amplitude(o, k)) for o in offsets) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 3) for k, v in worst.items()})
    assert abs(worst["rect"] + 3.92) < 0.02 and abs(worst["hann"] + 1.42) < 0.02 and worst["flattop"] > -0.1
    assert abs(20 * np.log10(peak_amplitude(0.3, "rect")) - 20 * np.log10(np.sinc(0.3))) < 0.02
    sl = {k: sidelobe_db(k) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 1) for k, v in sl.items()})
    assert -14 < sl["rect"] < -13 and -32 < sl["hann"] < -31 and sl["flattop"] < -85
    # a tone on a bin doesn't leak with any window
    assert abs(peak_amplitude(0.0, "rect") - 1) < 1e-9`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};