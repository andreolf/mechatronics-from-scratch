var e=`p10-l18`,t=35,n=`A UART interrupt produces bytes faster than the main loop wants to handle them one at a time, and a ring buffer is the standard way to pass them across without locks. You derive head and tail indices with power-of-two masking and why one producer and one consumer need no critical section, implement a lock-free SPSC ring buffer with acquire and release ordering, and stress-test it with two threads passing ten million bytes with none lost or reordered.`,r=`<h2 id="the-problem">The problem</h2>
<p>A UART receive interrupt fires once per byte, at 115 200 baud about every 87 µs. The ISR must be short (lesson 09), so it can’t parse a protocol. The main loop parses, but it might be busy for a few milliseconds. In between, the bytes have to wait somewhere. A <strong>ring buffer</strong> (circular FIFO) is a fixed array with two indices: the producer (the ISR) writes at <code>head</code>, the consumer (the main loop) reads at <code>tail</code>, and both wrap around.</p>
<h2 id="indices-that-never-wrap">Indices that never wrap</h2>
<p>The cleanest version keeps <code>head</code> and <code>tail</code> as free-running unsigned counters that are never reset, and wraps only when indexing, with a power-of-two size <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6151em;"></span><span class="mord text"><span class="mord">count</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord text"><span class="mord">head</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">tail</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">slot</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">index</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord">&amp;</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mopen">(</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>Unsigned subtraction is modulo <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span></span></span></span>, so <code>head - tail</code> is correct even after the counters overflow. The buffer is <strong>empty</strong> when count = 0 and <strong>full</strong> when count = <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span>, so all <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> slots are usable (the “keep one slot empty” trick is only needed when the indices are themselves wrapped). Masking with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1</span></span></span></span> replaces a slow modulo, and works only when <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> is a power of two.</p>
<h2 id="why-no-lock-is-needed">Why no lock is needed</h2>
<p>With exactly <strong>one producer and one consumer</strong> (SPSC), each index has a single writer: only the producer writes <code>head</code>, only the consumer writes <code>tail</code>. Each reads the other’s index, and a 32-bit aligned load or store is atomic (lesson 10). Two orderings make it correct:</p>
<ul>
<li>the producer writes the <strong>data first, then publishes</strong> the new <code>head</code> (a <em>release</em> store), so the consumer never sees an index pointing at unwritten data;</li>
<li>the consumer reads <code>head</code> with an <em>acquire</em> load before reading the data, and publishes the new <code>tail</code> only <strong>after</strong> it has copied the byte out.</li>
</ul>
<p>On a single-core Cortex-M with an ISR, the compiler is the main reorderer, and <code>volatile</code> or a compiler barrier is enough. On multi-core systems, or with DMA, you need real memory barriers, which is what C11 / GCC <code>__atomic</code> acquire and release give you portably. The test below uses two OS threads on a multi-core host, which is a harsher test than an MCU will ever give.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="ringbuf" data-args="{}"></div></div><figcaption>Head (producer, lime) and tail (consumer, blue) chasing each other around a 16-slot ring. Change the producer and consumer rates; when the producer laps the consumer, bytes are dropped and counted.</figcaption></figure>
<h2 id="sizing">Sizing</h2>
<p>If the producer delivers bytes at rate <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span></span></span></span> and the consumer can be away for at most <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mop mtight"><span class="mtight">m</span><span class="mtight">a</span><span class="mtight">x</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, the buffer must hold <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">r</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mop mtight"><span class="mtight">m</span><span class="mtight">a</span><span class="mtight">x</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> bytes, rounded up to a power of two. When it’s full, decide explicitly: drop the new byte and count it (usual for UART receive), or overwrite the oldest (usual for logs).</p>
<h2 id="worked-example">Worked example</h2>
<p>115 200 baud 8N1 is 11 520 bytes/s. The main loop can be busy up to 15 ms.</p>
<ol>
<li>Worst backlog: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">11</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">520</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.015</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">173</span></span></span></span> bytes, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">256</span></span></span></span>.</li>
<li>With head = 4 294 967 290 and tail = 4 294 967 200, count = 90; after head wraps to 10, count = <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">10</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">294</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">967</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">200</span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin"><span class="mord"><span class="mord mathrm">mod</span></span></span><span class="mspace" style="margin-right:0.0556em;"></span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">32</span></span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">106</span></span></span></span>. Still right.</li>
<li>Slot for index 4 294 967 290 with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> = 256: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">294</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">967</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">290</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord">&amp;</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord">255</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">250</span></span></span></span>.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">ring_spsc.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* build: gcc -std=c99 -O1 ring_spsc.c -pthread */</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> _POSIX_C_SOURCE 200809L</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;pthread.h&gt;</span></span>

<span class="hljs-meta">#<span class="hljs-keyword">define</span> RB_SIZE 256u                                   <span class="hljs-comment">/* must be a power of two */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> RB_MASK (RB_SIZE - 1u)</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span>
  <span class="hljs-type">uint8_t</span> data[RB_SIZE];
  <span class="hljs-type">uint32_t</span> head;                                       <span class="hljs-comment">/* written only by the producer */</span>
  <span class="hljs-type">uint32_t</span> tail;                                       <span class="hljs-comment">/* written only by the consumer */</span>
  <span class="hljs-type">uint32_t</span> dropped;
} <span class="hljs-type">ring_t</span>;

<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">rb_put</span><span class="hljs-params">(<span class="hljs-type">ring_t</span> *r, <span class="hljs-type">uint8_t</span> b)</span> {              <span class="hljs-comment">/* producer (the UART ISR) */</span>
  <span class="hljs-type">uint32_t</span> h = r-&gt;head;                                <span class="hljs-comment">/* our own index: plain read is fine */</span>
  <span class="hljs-type">uint32_t</span> t = __atomic_load_n(&amp;r-&gt;tail, __ATOMIC_ACQUIRE);
  <span class="hljs-keyword">if</span> (h - t == RB_SIZE) { r-&gt;dropped++; <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; }    <span class="hljs-comment">/* full: drop and count */</span>
  r-&gt;data[h &amp; RB_MASK] = b;                            <span class="hljs-comment">/* 1: write the data */</span>
  __atomic_store_n(&amp;r-&gt;head, h + <span class="hljs-number">1</span>, __ATOMIC_RELEASE); <span class="hljs-comment">/* 2: then publish it */</span>
  <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">rb_get</span><span class="hljs-params">(<span class="hljs-type">ring_t</span> *r, <span class="hljs-type">uint8_t</span> *b)</span> {             <span class="hljs-comment">/* consumer (the main loop) */</span>
  <span class="hljs-type">uint32_t</span> t = r-&gt;tail;
  <span class="hljs-type">uint32_t</span> h = __atomic_load_n(&amp;r-&gt;head, __ATOMIC_ACQUIRE);
  <span class="hljs-keyword">if</span> (h == t) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;                                <span class="hljs-comment">/* empty */</span>
  *b = r-&gt;data[t &amp; RB_MASK];                           <span class="hljs-comment">/* 1: read the data */</span>
  __atomic_store_n(&amp;r-&gt;tail, t + <span class="hljs-number">1</span>, __ATOMIC_RELEASE); <span class="hljs-comment">/* 2: then free the slot */</span>
  <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">rb_count</span><span class="hljs-params">(<span class="hljs-type">ring_t</span> *r)</span> { <span class="hljs-keyword">return</span> __atomic_load_n(&amp;r-&gt;head, __ATOMIC_ACQUIRE) - __atomic_load_n(&amp;r-&gt;tail, __ATOMIC_ACQUIRE); }

<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> TOTAL 10000000u</span>
<span class="hljs-type">static</span> <span class="hljs-type">ring_t</span> shared;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> *<span class="hljs-title function_">producer</span><span class="hljs-params">(<span class="hljs-type">void</span> *arg)</span> {
  (<span class="hljs-type">void</span>)arg;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = <span class="hljs-number">0</span>; i &lt; TOTAL;) <span class="hljs-keyword">if</span> (rb_put(&amp;shared, (<span class="hljs-type">uint8_t</span>)(i * <span class="hljs-number">7u</span> + (i &gt;&gt; <span class="hljs-number">8</span>)))) i++;   <span class="hljs-comment">/* retry when full */</span>
  <span class="hljs-keyword">return</span> <span class="hljs-literal">NULL</span>;
}

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-comment">/* single-threaded unit tests, starting just below the 32-bit wrap of the indices */</span>
  <span class="hljs-type">ring_t</span> r = {{<span class="hljs-number">0</span>}, <span class="hljs-number">0xFFFFFFF0u</span>, <span class="hljs-number">0xFFFFFFF0u</span>, <span class="hljs-number">0</span>}; <span class="hljs-type">uint8_t</span> b;
  CHECK(!rb_get(&amp;r, &amp;b) &amp;&amp; rb_count(&amp;r) == <span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = <span class="hljs-number">0</span>; i &lt; RB_SIZE; i++) CHECK(rb_put(&amp;r, (<span class="hljs-type">uint8_t</span>)i));
  CHECK(rb_count(&amp;r) == RB_SIZE &amp;&amp; !rb_put(&amp;r, <span class="hljs-number">99</span>) &amp;&amp; r.dropped == <span class="hljs-number">1</span>);   <span class="hljs-comment">/* all N slots usable, then full */</span>
  CHECK(r.head &lt; r.tail);                                                 <span class="hljs-comment">/* head wrapped past 2^32 */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = <span class="hljs-number">0</span>; i &lt; RB_SIZE; i++) { CHECK(rb_get(&amp;r, &amp;b)); CHECK(b == (<span class="hljs-type">uint8_t</span>)i); }
  CHECK(rb_count(&amp;r) == <span class="hljs-number">0</span> &amp;&amp; !rb_get(&amp;r, &amp;b));
  CHECK((<span class="hljs-number">4294967290u</span> &amp; RB_MASK) == <span class="hljs-number">250u</span> &amp;&amp; (<span class="hljs-type">uint32_t</span>)(<span class="hljs-number">10u</span> - <span class="hljs-number">4294967200u</span>) == <span class="hljs-number">106u</span>);

  <span class="hljs-comment">/* stress: a producer thread and this consumer pass 10 million bytes through a 256-byte ring */</span>
  <span class="hljs-type">pthread_t</span> th; CHECK(pthread_create(&amp;th, <span class="hljs-literal">NULL</span>, producer, <span class="hljs-literal">NULL</span>) == <span class="hljs-number">0</span>);
  <span class="hljs-type">uint32_t</span> got = <span class="hljs-number">0</span>, errors = <span class="hljs-number">0</span>, max_fill = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (got &lt; TOTAL) {
    <span class="hljs-type">uint32_t</span> c = rb_count(&amp;shared); <span class="hljs-keyword">if</span> (c &gt; max_fill) max_fill = c;
    <span class="hljs-keyword">if</span> (rb_get(&amp;shared, &amp;b)) { <span class="hljs-keyword">if</span> (b != (<span class="hljs-type">uint8_t</span>)(got * <span class="hljs-number">7u</span> + (got &gt;&gt; <span class="hljs-number">8</span>))) errors++; got++; }
  }
  pthread_join(th, <span class="hljs-literal">NULL</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;stress: %u bytes received, %u out of order or corrupted, max fill %u of %u\\n&quot;</span>, got, errors, max_fill, RB_SIZE);
  CHECK(errors == <span class="hljs-number">0</span> &amp;&amp; max_fill &lt;= RB_SIZE &amp;&amp; rb_count(&amp;shared) == <span class="hljs-number">0</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A teammate adds a second ISR (a CAN receive) that also calls <code>rb_put</code> on the same buffer. What breaks?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Now there are two producers writing <code>head</code>. If the CAN ISR preempts the UART ISR between its read of <code>head</code> and its store, both write the same slot and one byte is lost, the lost-update race from lesson 10. Fixes: one buffer per producer, give both ISRs the same priority so they can’t preempt each other, or a critical section in <code>rb_put</code>.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does <code>rb_get</code> publish the new <code>tail</code> only after copying the byte out?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Publishing <code>tail</code> frees the slot. If it happened first, the producer could see the space, write a new byte into that very slot, and the consumer would then read the new byte instead of the old one: data corruption without any lost count.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l18"></div>

`,i=[{id:`the-problem`,title:`The problem`},{id:`indices-that-never-wrap`,title:`Indices that never wrap`},{id:`why-no-lock-is-needed`,title:`Why no lock is needed`},{id:`sizing`,title:`Sizing`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l18-q1`,type:`num`,q:`<p>Bytes per second at 115 200 baud, 8N1 (10 bits per byte)?</p>
`,explain:`<p>Start, 8 data, stop.</p>
`,answer:11520,tol:.001,unit:`bytes/s`},{id:`p10-l18-q2`,type:`num`,q:`<p>Backlog in bytes if the main loop is away for 15 ms at that rate?</p>
`,explain:`<p>Round up to a power of two, 256.</p>
`,answer:172.8,tol:.001,unit:`bytes`},{id:`p10-l18-q3`,type:`num`,q:`<p>Slot index of counter value 1000 in a 64-entry ring?</p>
`,explain:`<p>Masking with N − 1.</p>
`,answer:40,tol:.001,unit:``},{id:`p10-l18-q4`,type:`num`,q:`<p>head = 5, tail = 4294967291 (both 32-bit). How many bytes are in the buffer?</p>
`,explain:`<p>Unsigned subtraction wraps.</p>
`,answer:10,tol:.001,unit:`bytes`},{id:`p10-l18-q5`,type:`mc`,q:`<p>Why must the ring size be a power of two for masking?</p>
`,explain:`<p>The mask keeps the low bits.</p>
`,options:[`for alignment`,`index &amp; (N−1) equals index mod N only when N is a power of two`,`to save RAM`,`the DMA requires it`],answer:1},{id:`p10-l18-q6`,type:`mc`,q:`<p>In the producer, what is the correct order?</p>
`,explain:`<p>The consumer must never see an index pointing at unwritten data.</p>
`,options:[`publish head, then write the data`,`write the data, then publish head with a release store`,`either order`,`disable interrupts first`],answer:1}],o=[{file:`ring_spsc.c`,lang:`c`,src:`/* build: gcc -std=c99 -O1 ring_spsc.c -pthread */
#define _POSIX_C_SOURCE 200809L
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define RB_SIZE 256u                                   /* must be a power of two */
#define RB_MASK (RB_SIZE - 1u)
typedef struct {
  uint8_t data[RB_SIZE];
  uint32_t head;                                       /* written only by the producer */
  uint32_t tail;                                       /* written only by the consumer */
  uint32_t dropped;
} ring_t;

static int rb_put(ring_t *r, uint8_t b) {              /* producer (the UART ISR) */
  uint32_t h = r->head;                                /* our own index: plain read is fine */
  uint32_t t = __atomic_load_n(&r->tail, __ATOMIC_ACQUIRE);
  if (h - t == RB_SIZE) { r->dropped++; return 0; }    /* full: drop and count */
  r->data[h & RB_MASK] = b;                            /* 1: write the data */
  __atomic_store_n(&r->head, h + 1, __ATOMIC_RELEASE); /* 2: then publish it */
  return 1;
}
static int rb_get(ring_t *r, uint8_t *b) {             /* consumer (the main loop) */
  uint32_t t = r->tail;
  uint32_t h = __atomic_load_n(&r->head, __ATOMIC_ACQUIRE);
  if (h == t) return 0;                                /* empty */
  *b = r->data[t & RB_MASK];                           /* 1: read the data */
  __atomic_store_n(&r->tail, t + 1, __ATOMIC_RELEASE); /* 2: then free the slot */
  return 1;
}
static uint32_t rb_count(ring_t *r) { return __atomic_load_n(&r->head, __ATOMIC_ACQUIRE) - __atomic_load_n(&r->tail, __ATOMIC_ACQUIRE); }

#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)
#define TOTAL 10000000u
static ring_t shared;
static void *producer(void *arg) {
  (void)arg;
  for (uint32_t i = 0; i < TOTAL;) if (rb_put(&shared, (uint8_t)(i * 7u + (i >> 8)))) i++;   /* retry when full */
  return NULL;
}

int main(void) {
  /* single-threaded unit tests, starting just below the 32-bit wrap of the indices */
  ring_t r = {{0}, 0xFFFFFFF0u, 0xFFFFFFF0u, 0}; uint8_t b;
  CHECK(!rb_get(&r, &b) && rb_count(&r) == 0);
  for (uint32_t i = 0; i < RB_SIZE; i++) CHECK(rb_put(&r, (uint8_t)i));
  CHECK(rb_count(&r) == RB_SIZE && !rb_put(&r, 99) && r.dropped == 1);   /* all N slots usable, then full */
  CHECK(r.head < r.tail);                                                 /* head wrapped past 2^32 */
  for (uint32_t i = 0; i < RB_SIZE; i++) { CHECK(rb_get(&r, &b)); CHECK(b == (uint8_t)i); }
  CHECK(rb_count(&r) == 0 && !rb_get(&r, &b));
  CHECK((4294967290u & RB_MASK) == 250u && (uint32_t)(10u - 4294967200u) == 106u);

  /* stress: a producer thread and this consumer pass 10 million bytes through a 256-byte ring */
  pthread_t th; CHECK(pthread_create(&th, NULL, producer, NULL) == 0);
  uint32_t got = 0, errors = 0, max_fill = 0;
  while (got < TOTAL) {
    uint32_t c = rb_count(&shared); if (c > max_fill) max_fill = c;
    if (rb_get(&shared, &b)) { if (b != (uint8_t)(got * 7u + (got >> 8))) errors++; got++; }
  }
  pthread_join(th, NULL);
  printf("stress: %u bytes received, %u out of order or corrupted, max fill %u of %u\\n", got, errors, max_fill, RB_SIZE);
  CHECK(errors == 0 && max_fill <= RB_SIZE && rb_count(&shared) == 0);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};