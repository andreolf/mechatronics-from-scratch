var e=`p11-l04`,t=30,n=`A byte stream needs packet boundaries, and COBS gives them by rewriting a packet so it contains no zero bytes, then using a single zero as the delimiter, at a worst-case cost of one byte per 254. You derive the encoding by hand, write the encoder and decoder in C, and test them by round-tripping random payloads of every awkward length and recovering from a corrupted frame mid-stream.`,r=`<h2 id="the-framing-problem">The framing problem</h2>
<p>A UART delivers bytes, not packets. If you send <code>[length][payload][crc]</code> and one byte is lost, the receiver reads the wrong length and stays out of step forever. You need a byte value that <strong>only</strong> ever means “end of packet”, so the receiver can resynchronise at the next one.</p>
<p>SLIP and HDLC reserve a flag byte and <strong>escape</strong> it inside the payload, which doubles the size in the worst case (a payload full of flag bytes). <strong>COBS</strong> (consistent overhead byte stuffing, Cheshire and Baker, 1999) removes every zero from the payload with a bounded overhead, and then a zero is the delimiter.</p>
<h2 id="how-cobs-encodes">How COBS encodes</h2>
<p>Split the packet at its zeros. Each piece becomes a <strong>code byte</strong> followed by up to 254 non-zero bytes, where the code is one more than the number of data bytes and stands for “this many bytes, then a zero”:</p>
<ul>
<li><code>11 22 00 33</code> becomes <code>03 11 22 02 33</code>. The code 03 means “two bytes, then a zero”; the final 02 means “one byte, end of packet” (the implicit zero at the end is dropped).</li>
<li>A run of 254 non-zero bytes gets the code <strong>FF</strong>, which means “254 bytes and <em>no</em> zero”, so long runs cost one extra byte per 254.</li>
<li><code>00</code> alone becomes <code>01 01</code>.</li>
</ul>
<p>Worst-case output is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">⌊</span><span class="mord mathnormal">n</span><span class="mord">/254</span><span class="mclose">⌋</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> bytes, plus the trailing 00 delimiter: about 0.4 % overhead, whatever the data. (This simple encoder ends an exact multiple of 254 with an extra 01 code; some implementations drop it, and the decoder accepts both.)</p>
<p>Decoding reverses it: read a code <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">c</span></span></span></span>, copy <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> bytes, then output a zero unless <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">c</span></span></span></span> was FF or this is the end of the packet. A zero <strong>inside</strong> an encoded frame is an error, and is also where the next frame starts.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="cobs" data-args="{}"></div></div><figcaption>COBS step by step: the packet’s zeros, the code bytes that replace them (each points to the next zero), and the decoded result. Pick a packet to see the pointers move.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Encode <code>45 00 00 2C 4C 79 00 05</code>.</p>
<ol>
<li>Pieces split at zeros: <code>45</code> | (empty) | <code>2C 4C 79</code> | <code>05</code>.</li>
<li>Codes: <code>02 45</code>, <code>01</code>, <code>04 2C 4C 79</code>, <code>02 05</code>.</li>
<li>Encoded: <code>02 45 01 04 2C 4C 79 02 05</code>, 9 bytes for 8, then the delimiter <code>00</code>.</li>
<li>Decode: 02 → copy 45, add 00; 01 → add 00; 04 → copy three, add 00; 02 → copy 05, end. Back to the original.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">cobs.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stddef.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>

<span class="hljs-comment">/* encode n bytes; returns the encoded length (no delimiter). out needs n + n/254 + 1 bytes. */</span>
<span class="hljs-type">static</span> <span class="hljs-type">size_t</span> <span class="hljs-title function_">cobs_encode</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *in, <span class="hljs-type">size_t</span> n, <span class="hljs-type">uint8_t</span> *out)</span> {
  <span class="hljs-type">size_t</span> code_at = <span class="hljs-number">0</span>, o = <span class="hljs-number">1</span>;
  <span class="hljs-type">uint8_t</span> code = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) {
    <span class="hljs-keyword">if</span> (in[i] == <span class="hljs-number">0</span>) {
      out[code_at] = code; code_at = o++; code = <span class="hljs-number">1</span>;
    } <span class="hljs-keyword">else</span> {
      out[o++] = in[i];
      <span class="hljs-keyword">if</span> (++code == <span class="hljs-number">0xFF</span>) { out[code_at] = code; code_at = o++; code = <span class="hljs-number">1</span>; }
    }
  }
  out[code_at] = code;
  <span class="hljs-keyword">return</span> o;
}

<span class="hljs-comment">/* decode; returns the decoded length or -1 on a malformed frame */</span>
<span class="hljs-type">static</span> <span class="hljs-type">long</span> <span class="hljs-title function_">cobs_decode</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *in, <span class="hljs-type">size_t</span> n, <span class="hljs-type">uint8_t</span> *out)</span> {
  <span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>, o = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (i &lt; n) {
    <span class="hljs-type">uint8_t</span> code = in[i++];
    <span class="hljs-keyword">if</span> (code == <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;                      <span class="hljs-comment">/* zeros never appear inside a frame */</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-type">uint8_t</span> k = <span class="hljs-number">1</span>; k &lt; code; k++) {
      <span class="hljs-keyword">if</span> (i &gt;= n || in[i] == <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;
      out[o++] = in[i++];
    }
    <span class="hljs-keyword">if</span> (code != <span class="hljs-number">0xFF</span> &amp;&amp; i &lt; n) out[o++] = <span class="hljs-number">0</span>;
  }
  <span class="hljs-keyword">return</span> (<span class="hljs-type">long</span>)o;
}

<span class="hljs-comment">/* a streaming receiver: collects bytes until a 00, then decodes */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">uint8_t</span> buf[<span class="hljs-number">2048</span>]; <span class="hljs-type">size_t</span> n; <span class="hljs-type">int</span> good, bad; <span class="hljs-type">uint8_t</span> last[<span class="hljs-number">2048</span>]; <span class="hljs-type">long</span> last_len; } <span class="hljs-type">rx_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">rx_byte</span><span class="hljs-params">(<span class="hljs-type">rx_t</span> *r, <span class="hljs-type">uint8_t</span> b)</span> {
  <span class="hljs-keyword">if</span> (b != <span class="hljs-number">0</span>) { <span class="hljs-keyword">if</span> (r-&gt;n &lt; <span class="hljs-keyword">sizeof</span> r-&gt;buf) r-&gt;buf[r-&gt;n++] = b; <span class="hljs-keyword">return</span>; }
  <span class="hljs-keyword">if</span> (r-&gt;n) {
    <span class="hljs-type">long</span> len = cobs_decode(r-&gt;buf, r-&gt;n, r-&gt;last);
    <span class="hljs-comment">/* the last two payload bytes are a checksum: sum of the rest, mod 65536 */</span>
    <span class="hljs-type">int</span> ok = len &gt;= <span class="hljs-number">2</span>;
    <span class="hljs-keyword">if</span> (ok) { <span class="hljs-type">unsigned</span> s = <span class="hljs-number">0</span>; <span class="hljs-keyword">for</span> (<span class="hljs-type">long</span> i = <span class="hljs-number">0</span>; i &lt; len - <span class="hljs-number">2</span>; i++) s += r-&gt;last[i]; ok = (s &amp; <span class="hljs-number">0xFFFF</span>) == (<span class="hljs-type">unsigned</span>)(r-&gt;last[len - <span class="hljs-number">2</span>] &lt;&lt; <span class="hljs-number">8</span> | r-&gt;last[len - <span class="hljs-number">1</span>]); }
    <span class="hljs-keyword">if</span> (ok) { r-&gt;good++; r-&gt;last_len = len - <span class="hljs-number">2</span>; } <span class="hljs-keyword">else</span> r-&gt;bad++;
  }
  r-&gt;n = <span class="hljs-number">0</span>;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> rng = <span class="hljs-number">99</span>;
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">rnd</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { rng ^= rng &lt;&lt; <span class="hljs-number">13</span>; rng ^= rng &gt;&gt; <span class="hljs-number">17</span>; rng ^= rng &lt;&lt; <span class="hljs-number">5</span>; <span class="hljs-keyword">return</span> rng; }

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">roundtrip</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *p, <span class="hljs-type">size_t</span> n)</span> {
  <span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> enc[<span class="hljs-number">4096</span>], dec[<span class="hljs-number">4096</span>];
  <span class="hljs-type">size_t</span> m = cobs_encode(p, n, enc);
  CHECK(m &lt;= n + n / <span class="hljs-number">254</span> + <span class="hljs-number">1</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; m; i++) CHECK(enc[i] != <span class="hljs-number">0</span>);
  <span class="hljs-type">long</span> d = cobs_decode(enc, m, dec);
  CHECK(d == (<span class="hljs-type">long</span>)n &amp;&amp; <span class="hljs-built_in">memcmp</span>(p, dec, n) == <span class="hljs-number">0</span>);
}

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> p[<span class="hljs-number">2000</span>];
  <span class="hljs-comment">/* the worked example */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> ex[<span class="hljs-number">8</span>] = {<span class="hljs-number">0x45</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0x2C</span>, <span class="hljs-number">0x4C</span>, <span class="hljs-number">0x79</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0x05</span>};
  <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> want[<span class="hljs-number">9</span>] = {<span class="hljs-number">0x02</span>, <span class="hljs-number">0x45</span>, <span class="hljs-number">0x01</span>, <span class="hljs-number">0x04</span>, <span class="hljs-number">0x2C</span>, <span class="hljs-number">0x4C</span>, <span class="hljs-number">0x79</span>, <span class="hljs-number">0x02</span>, <span class="hljs-number">0x05</span>};
  <span class="hljs-type">uint8_t</span> enc[<span class="hljs-number">16</span>];
  CHECK(cobs_encode(ex, <span class="hljs-number">8</span>, enc) == <span class="hljs-number">9</span> &amp;&amp; <span class="hljs-built_in">memcmp</span>(enc, want, <span class="hljs-number">9</span>) == <span class="hljs-number">0</span>);
  <span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> z = <span class="hljs-number">0</span>; CHECK(cobs_encode(&amp;z, <span class="hljs-number">1</span>, enc) == <span class="hljs-number">2</span> &amp;&amp; enc[<span class="hljs-number">0</span>] == <span class="hljs-number">1</span> &amp;&amp; enc[<span class="hljs-number">1</span>] == <span class="hljs-number">1</span>);
  <span class="hljs-comment">/* awkward lengths: around 254, all zeros, no zeros */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">size_t</span> lens[] = {<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">253</span>, <span class="hljs-number">254</span>, <span class="hljs-number">255</span>, <span class="hljs-number">256</span>, <span class="hljs-number">507</span>, <span class="hljs-number">508</span>, <span class="hljs-number">509</span>, <span class="hljs-number">1000</span>, <span class="hljs-number">1999</span>};
  <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> li = <span class="hljs-number">0</span>; li &lt; <span class="hljs-keyword">sizeof</span> lens / <span class="hljs-keyword">sizeof</span> lens[<span class="hljs-number">0</span>]; li++) {
    <span class="hljs-type">size_t</span> n = lens[li];
    <span class="hljs-built_in">memset</span>(p, <span class="hljs-number">0</span>, n); roundtrip(p, n);
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) p[i] = (<span class="hljs-type">uint8_t</span>)(<span class="hljs-number">1</span> + i % <span class="hljs-number">255</span>);
    roundtrip(p, n);
    <span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> e2[<span class="hljs-number">4096</span>];
    CHECK(cobs_encode(p, n, e2) == n + n / <span class="hljs-number">254</span> + <span class="hljs-number">1</span> || n == <span class="hljs-number">0</span>);      <span class="hljs-comment">/* worst case is exactly reached */</span>
  }
  <span class="hljs-comment">/* random payloads, from mostly-zero to no zeros */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> t = <span class="hljs-number">0</span>; t &lt; <span class="hljs-number">20000</span>; t++) {
    <span class="hljs-type">size_t</span> n = rnd() % <span class="hljs-number">700</span>;
    <span class="hljs-type">unsigned</span> zero_pct = rnd() % <span class="hljs-number">101</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) p[i] = (rnd() % <span class="hljs-number">100</span> &lt; zero_pct) ? <span class="hljs-number">0</span> : (<span class="hljs-type">uint8_t</span>)(<span class="hljs-number">1</span> + rnd() % <span class="hljs-number">255</span>);
    roundtrip(p, n);
  }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;round-trip: worked example, awkward lengths and 20000 random payloads ok\\n&quot;</span>);
  <span class="hljs-comment">/* a stream of 100 frames with one byte corrupted in frame 40 and one dropped in frame 70 */</span>
  <span class="hljs-type">rx_t</span> r; <span class="hljs-built_in">memset</span>(&amp;r, <span class="hljs-number">0</span>, <span class="hljs-keyword">sizeof</span> r);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> f = <span class="hljs-number">0</span>; f &lt; <span class="hljs-number">100</span>; f++) {
    <span class="hljs-type">size_t</span> n = <span class="hljs-number">1</span> + rnd() % <span class="hljs-number">60</span>; <span class="hljs-type">unsigned</span> s = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) { p[i] = (<span class="hljs-type">uint8_t</span>)rnd(); s += p[i]; }
    p[n] = (<span class="hljs-type">uint8_t</span>)(s &gt;&gt; <span class="hljs-number">8</span> &amp; <span class="hljs-number">0xFF</span>); p[n + <span class="hljs-number">1</span>] = (<span class="hljs-type">uint8_t</span>)(s &amp; <span class="hljs-number">0xFF</span>);
    <span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> e[<span class="hljs-number">256</span>]; <span class="hljs-type">size_t</span> m = cobs_encode(p, n + <span class="hljs-number">2</span>, e);
    <span class="hljs-keyword">if</span> (f == <span class="hljs-number">40</span>) e[m / <span class="hljs-number">2</span>] ^= <span class="hljs-number">0x10</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-type">size_t</span> i = <span class="hljs-number">0</span>; i &lt; m; i++) { <span class="hljs-keyword">if</span> (f == <span class="hljs-number">70</span> &amp;&amp; i == <span class="hljs-number">1</span>) <span class="hljs-keyword">continue</span>; rx_byte(&amp;r, e[i]); }
    rx_byte(&amp;r, <span class="hljs-number">0</span>);
  }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;stream: %d frames good, %d rejected, receiver back in step after each\\n&quot;</span>, r.good, r.bad);
  CHECK(r.good == <span class="hljs-number">98</span> &amp;&amp; r.bad == <span class="hljs-number">2</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your COBS frames go over a radio that sometimes inserts a spurious 00 byte. What happens, and what limits the damage?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The receiver sees the 00 as a delimiter and splits one frame into two fragments. Both fail to decode or fail their checksum and are dropped; the next real delimiter resynchronises the stream, so only that one packet is lost. This is why COBS frames still need a CRC (lesson 03): COBS finds boundaries, it doesn’t detect corruption.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>What’s the encoded size of a 1000-byte packet with no zeros, and with all zeros?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>No zeros: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1000</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">⌊</span><span class="mord">1000/254</span><span class="mclose">⌋</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1004</span></span></span></span> bytes (three FF codes plus one final code), 1005 with the delimiter. All zeros: each zero becomes a code 01, plus a final 01, so 1001 bytes. Overhead never exceeds one byte per 254, whatever the data.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l04"></div>

`,i=[{id:`the-framing-problem`,title:`The framing problem`},{id:`how-cobs-encodes`,title:`How COBS encodes`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l04-q1`,type:`num`,q:`<p>Worst-case encoded length (without the delimiter) of a 508-byte packet?</p>
`,explain:`<p>Two FF blocks of 254, then a final 01 code for the empty last block.</p>
`,answer:511,tol:0,unit:`bytes`},{id:`p11-l04-q2`,type:`num`,q:`<p>Percentage overhead of COBS for long packets in the worst case?</p>
`,explain:`<p>One byte per 254.</p>
`,answer:.394,tol:.002,unit:`%`},{id:`p11-l04-q3`,type:`num`,q:`<p>Encoded length of a packet of 300 zeros?</p>
`,explain:`<p>Each zero becomes code 01, plus a final 01.</p>
`,answer:301,tol:0,unit:`bytes`},{id:`p11-l04-q4`,type:`num`,q:`<p>The code byte for “two data bytes, then a zero”?</p>
`,explain:`<p>Code = data bytes + 1.</p>
`,answer:3,tol:0,unit:``},{id:`p11-l04-q5`,type:`mc`,q:`<p>What does the code byte FF mean?</p>
`,explain:`<p>Long runs are split every 254 bytes.</p>
`,options:[`254 data bytes and no zero after them`,`end of packet`,`an escaped zero`,`an error`],answer:0},{id:`p11-l04-q6`,type:`mc`,q:`<p>Why do COBS frames still need a CRC?</p>
`,explain:`<p>A flipped bit decodes to a wrong but well-formed packet.</p>
`,options:[`COBS finds packet boundaries but doesn’t detect corrupted bytes`,`COBS output contains zeros`,`the UART needs it`,`they don’t`],answer:0}],o=[{file:`cobs.c`,lang:`c`,src:`#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* encode n bytes; returns the encoded length (no delimiter). out needs n + n/254 + 1 bytes. */
static size_t cobs_encode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t code_at = 0, o = 1;
  uint8_t code = 1;
  for (size_t i = 0; i < n; i++) {
    if (in[i] == 0) {
      out[code_at] = code; code_at = o++; code = 1;
    } else {
      out[o++] = in[i];
      if (++code == 0xFF) { out[code_at] = code; code_at = o++; code = 1; }
    }
  }
  out[code_at] = code;
  return o;
}

/* decode; returns the decoded length or -1 on a malformed frame */
static long cobs_decode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t i = 0, o = 0;
  while (i < n) {
    uint8_t code = in[i++];
    if (code == 0) return -1;                      /* zeros never appear inside a frame */
    for (uint8_t k = 1; k < code; k++) {
      if (i >= n || in[i] == 0) return -1;
      out[o++] = in[i++];
    }
    if (code != 0xFF && i < n) out[o++] = 0;
  }
  return (long)o;
}

/* a streaming receiver: collects bytes until a 00, then decodes */
typedef struct { uint8_t buf[2048]; size_t n; int good, bad; uint8_t last[2048]; long last_len; } rx_t;
static void rx_byte(rx_t *r, uint8_t b) {
  if (b != 0) { if (r->n < sizeof r->buf) r->buf[r->n++] = b; return; }
  if (r->n) {
    long len = cobs_decode(r->buf, r->n, r->last);
    /* the last two payload bytes are a checksum: sum of the rest, mod 65536 */
    int ok = len >= 2;
    if (ok) { unsigned s = 0; for (long i = 0; i < len - 2; i++) s += r->last[i]; ok = (s & 0xFFFF) == (unsigned)(r->last[len - 2] << 8 | r->last[len - 1]); }
    if (ok) { r->good++; r->last_len = len - 2; } else r->bad++;
  }
  r->n = 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

static uint32_t rng = 99;
static uint32_t rnd(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }

static void roundtrip(const uint8_t *p, size_t n) {
  static uint8_t enc[4096], dec[4096];
  size_t m = cobs_encode(p, n, enc);
  CHECK(m <= n + n / 254 + 1);
  for (size_t i = 0; i < m; i++) CHECK(enc[i] != 0);
  long d = cobs_decode(enc, m, dec);
  CHECK(d == (long)n && memcmp(p, dec, n) == 0);
}

int main(void) {
  static uint8_t p[2000];
  /* the worked example */
  const uint8_t ex[8] = {0x45, 0, 0, 0x2C, 0x4C, 0x79, 0, 0x05};
  const uint8_t want[9] = {0x02, 0x45, 0x01, 0x04, 0x2C, 0x4C, 0x79, 0x02, 0x05};
  uint8_t enc[16];
  CHECK(cobs_encode(ex, 8, enc) == 9 && memcmp(enc, want, 9) == 0);
  const uint8_t z = 0; CHECK(cobs_encode(&z, 1, enc) == 2 && enc[0] == 1 && enc[1] == 1);
  /* awkward lengths: around 254, all zeros, no zeros */
  const size_t lens[] = {0, 1, 253, 254, 255, 256, 507, 508, 509, 1000, 1999};
  for (size_t li = 0; li < sizeof lens / sizeof lens[0]; li++) {
    size_t n = lens[li];
    memset(p, 0, n); roundtrip(p, n);
    for (size_t i = 0; i < n; i++) p[i] = (uint8_t)(1 + i % 255);
    roundtrip(p, n);
    static uint8_t e2[4096];
    CHECK(cobs_encode(p, n, e2) == n + n / 254 + 1 || n == 0);      /* worst case is exactly reached */
  }
  /* random payloads, from mostly-zero to no zeros */
  for (int t = 0; t < 20000; t++) {
    size_t n = rnd() % 700;
    unsigned zero_pct = rnd() % 101;
    for (size_t i = 0; i < n; i++) p[i] = (rnd() % 100 < zero_pct) ? 0 : (uint8_t)(1 + rnd() % 255);
    roundtrip(p, n);
  }
  printf("round-trip: worked example, awkward lengths and 20000 random payloads ok\\n");
  /* a stream of 100 frames with one byte corrupted in frame 40 and one dropped in frame 70 */
  rx_t r; memset(&r, 0, sizeof r);
  for (int f = 0; f < 100; f++) {
    size_t n = 1 + rnd() % 60; unsigned s = 0;
    for (size_t i = 0; i < n; i++) { p[i] = (uint8_t)rnd(); s += p[i]; }
    p[n] = (uint8_t)(s >> 8 & 0xFF); p[n + 1] = (uint8_t)(s & 0xFF);
    static uint8_t e[256]; size_t m = cobs_encode(p, n + 2, e);
    if (f == 40) e[m / 2] ^= 0x10;
    for (size_t i = 0; i < m; i++) { if (f == 70 && i == 1) continue; rx_byte(&r, e[i]); }
    rx_byte(&r, 0);
  }
  printf("stream: %d frames good, %d rejected, receiver back in step after each\\n", r.good, r.bad);
  CHECK(r.good == 98 && r.bad == 2);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:30,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};