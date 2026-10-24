var e=`p06-l13`,t=35,n=`SRAM forgets at power-off, while flash and EEPROM remember but wear out and can only be erased in blocks. You model the program-and-erase rules of NOR flash, build a wear-levelled, power-fail-safe parameter log with sequence numbers and checksums, and compute how long the memory lasts.`,r=`<h2 id="three-kinds-of-memory">Three kinds of memory</h2>
<ul>
<li><strong>SRAM</strong>: six transistors per bit (a latch, lesson 7). Fast, unlimited writes, lost at power-off. Your variables and stack live here.</li>
<li><strong>Flash</strong>: one transistor per bit with a floating gate that traps charge. Non-volatile and dense, so your program lives here. But:<ul>
<li><strong>Program</strong> can only turn bits from 1 to 0.</li>
<li><strong>Erase</strong> sets a whole page (1–128 KiB) back to all 1s, takes milliseconds, and wears the cells. Typical endurance is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">4</span></span></span></span></span></span></span></span></span></span></span>–<span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">5</span></span></span></span></span></span></span></span></span></span></span> erase cycles.</li>
</ul>
</li>
<li><strong>EEPROM</strong>: byte-erasable with endurance around <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">6</span></span></span></span></span></span></span></span></span></span></span>, but small. Many microcontrollers emulate it in flash with the technique below.</li>
</ul>
<p>Saving a parameter by erasing the same page each time kills that page after 10 000 saves. If a save happens every minute, that’s a week.</p>
<h2 id="a-log-structured-store">A log-structured store</h2>
<p>Instead of overwriting, <strong>append</strong> records:</p>
<ol>
<li>Each record holds a sequence number, the value and a checksum (CRC in Phase 11; a simple sum here).</li>
<li>Write records one after another through a ring of pages. Erase a page only when the log wraps around to it, so every page wears evenly: <strong>wear levelling</strong>.</li>
<li>At boot, scan every record. The valid one with the highest sequence number is the current value.</li>
<li>If power fails mid-write, the half-written record fails its checksum and is ignored, so you get the previous value. Never a corrupt one. The next write goes after the half-written slot, which is simply skipped.</li>
</ol>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="flash" data-args="{}"></div></div><figcaption>Erase counts across 64 pages. With the ring, wear spreads evenly; with a fixed page, one page dies while 63 stay new.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Parameters are saved 10 million times over the product’s life. Each page holds 16 records, there are 64 pages, and the endurance is 10 000 erases.</p>
<ol>
<li>Page fills: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">7</span></span></span></span></span></span></span></span><span class="mord">/16</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">625</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> erases in total.</li>
<li>Fixed page: 625 000 erases on one page, 62 times its endurance. It wears out after <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8974em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">4</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">16</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">160</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> saves.</li>
<li>Ring of 64: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">625</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000/64</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9766</span></span></span></span> erases per page, 98 % of life. Just enough. Add pages or records per page for margin.</li>
<li>One save every 10 s gives 10 million saves in <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">8</span></span></span></span></span></span></span></span></span></span></span> s, about 3.2 years.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">flashlog.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> random

PAGE_RECORDS, N_PAGES = <span class="hljs-number">16</span>, <span class="hljs-number">8</span>
ERASED = <span class="hljs-literal">None</span>                                          <span class="hljs-comment"># an erased slot reads as all 1s; model it as None</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Flash</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.pages = [[ERASED] * PAGE_RECORDS <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N_PAGES)]
        <span class="hljs-variable language_">self</span>.erases = [<span class="hljs-number">0</span>] * N_PAGES
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">program</span>(<span class="hljs-params">self, page, slot, rec, cut=<span class="hljs-literal">False</span></span>):
        <span class="hljs-keyword">assert</span> <span class="hljs-variable language_">self</span>.pages[page][slot] <span class="hljs-keyword">is</span> ERASED, <span class="hljs-string">&quot;can only program an erased slot (bits 1 -&gt; 0)&quot;</span>
        seq, val, chk = rec
        <span class="hljs-variable language_">self</span>.pages[page][slot] = (seq, val, chk ^ <span class="hljs-number">0xFFFF</span>) <span class="hljs-keyword">if</span> cut <span class="hljs-keyword">else</span> rec   <span class="hljs-comment"># power cut: checksum incomplete</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">erase</span>(<span class="hljs-params">self, page</span>):
        <span class="hljs-variable language_">self</span>.pages[page] = [ERASED] * PAGE_RECORDS
        <span class="hljs-variable language_">self</span>.erases[page] += <span class="hljs-number">1</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">checksum</span>(<span class="hljs-params">seq, val</span>):
    <span class="hljs-keyword">return</span> (seq * <span class="hljs-number">31</span> + val * <span class="hljs-number">7</span> + <span class="hljs-number">0x1234</span>) &amp; <span class="hljs-number">0xFFFF</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ParamStore</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, flash</span>):
        <span class="hljs-variable language_">self</span>.f = flash
        <span class="hljs-variable language_">self</span>.boot()
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">boot</span>(<span class="hljs-params">self</span>):
        best, newest, pos = <span class="hljs-literal">None</span>, <span class="hljs-number">0</span>, <span class="hljs-literal">None</span>
        <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(N_PAGES):
            <span class="hljs-keyword">for</span> s <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(PAGE_RECORDS):
                r = <span class="hljs-variable language_">self</span>.f.pages[p][s]
                <span class="hljs-keyword">if</span> r <span class="hljs-keyword">is</span> ERASED:
                    <span class="hljs-keyword">continue</span>
                <span class="hljs-keyword">if</span> r[<span class="hljs-number">0</span>] &gt; newest:                     <span class="hljs-comment"># newest slot written, even if half-written</span>
                    newest, pos = r[<span class="hljs-number">0</span>], (p, s)
                <span class="hljs-keyword">if</span> r[<span class="hljs-number">2</span>] == checksum(r[<span class="hljs-number">0</span>], r[<span class="hljs-number">1</span>]) <span class="hljs-keyword">and</span> (best <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> r[<span class="hljs-number">0</span>] &gt; best[<span class="hljs-number">0</span>]):
                    best = r                          <span class="hljs-comment"># newest *valid* record</span>
        <span class="hljs-variable language_">self</span>.value = best[<span class="hljs-number">1</span>] <span class="hljs-keyword">if</span> best <span class="hljs-keyword">else</span> <span class="hljs-number">0</span>
        <span class="hljs-variable language_">self</span>.seq = newest
        <span class="hljs-variable language_">self</span>.<span class="hljs-built_in">next</span> = <span class="hljs-variable language_">self</span>._advance(pos) <span class="hljs-keyword">if</span> pos <span class="hljs-keyword">else</span> (<span class="hljs-number">0</span>, <span class="hljs-number">0</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_advance</span>(<span class="hljs-params">self, pos</span>):
        p, s = pos
        s += <span class="hljs-number">1</span>
        <span class="hljs-keyword">if</span> s == PAGE_RECORDS:
            p, s = (p + <span class="hljs-number">1</span>) % N_PAGES, <span class="hljs-number">0</span>
        <span class="hljs-keyword">return</span> p, s
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">save</span>(<span class="hljs-params">self, val, cut=<span class="hljs-literal">False</span></span>):
        p, s = <span class="hljs-variable language_">self</span>.<span class="hljs-built_in">next</span>
        <span class="hljs-keyword">if</span> s == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-variable language_">self</span>.f.pages[p][<span class="hljs-number">0</span>] <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> ERASED:
            <span class="hljs-variable language_">self</span>.f.erase(p)                            <span class="hljs-comment"># wrapping onto the oldest page</span>
        <span class="hljs-variable language_">self</span>.seq += <span class="hljs-number">1</span>
        <span class="hljs-variable language_">self</span>.f.program(p, s, (<span class="hljs-variable language_">self</span>.seq, val, checksum(<span class="hljs-variable language_">self</span>.seq, val)), cut)
        <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> cut:
            <span class="hljs-variable language_">self</span>.value = val
        <span class="hljs-variable language_">self</span>.<span class="hljs-built_in">next</span> = <span class="hljs-variable language_">self</span>._advance((p, s))

<span class="hljs-keyword">if</span> __name__ == <span class="hljs-string">&quot;__main__&quot;</span>:
    random.seed(<span class="hljs-number">7</span>)
    flash = Flash()
    store = ParamStore(flash)
    committed = <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">20_000</span>):
        v = random.randrange(<span class="hljs-number">1000</span>)
        <span class="hljs-keyword">if</span> random.random() &lt; <span class="hljs-number">0.01</span>:                      <span class="hljs-comment"># power fails during this write</span>
            store.save(v, cut=<span class="hljs-literal">True</span>)
            store = ParamStore(flash)                   <span class="hljs-comment"># reboot</span>
            <span class="hljs-keyword">assert</span> store.value == committed, (i, store.value, committed)
        <span class="hljs-keyword">else</span>:
            store.save(v)
            committed = v
        <span class="hljs-keyword">if</span> i % <span class="hljs-number">997</span> == <span class="hljs-number">0</span>:
            <span class="hljs-keyword">assert</span> ParamStore(flash).value == committed
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;erase counts per page:&quot;</span>, flash.erases)
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">max</span>(flash.erases) - <span class="hljs-built_in">min</span>(flash.erases) &lt;= <span class="hljs-number">1</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-number">10</span>**<span class="hljs-number">7</span> // <span class="hljs-number">16</span> // <span class="hljs-number">64</span> == <span class="hljs-number">9765</span> <span class="hljs-keyword">and</span> <span class="hljs-number">10</span>**<span class="hljs-number">4</span> * <span class="hljs-number">16</span> == <span class="hljs-number">160_000</span></code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why must the store skip, rather than reuse, a slot that holds a half-written record?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Flash can only program erased bits. The half-written slot is no longer erased, so writing over it would AND the old and new bits together. Skip it; it’ll be erased when the ring wraps.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A data logger writes a 32-byte record every second to a 4 MiB flash with 4 KiB sectors and 100 000-cycle endurance. Lifetime with a full ring?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>4 MiB / 32 B = 131 072 records per pass. 100 000 passes take <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1.31</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">10</span></span></span></span></span></span></span></span></span></span></span></span> s, about 415 years. The flash won’t be the limit.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p06-l13"></div>

`,i=[{id:`three-kinds-of-memory`,title:`Three kinds of memory`},{id:`a-log-structured-store`,title:`A log-structured store`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p06-l13-q1`,type:`mc`,q:`<p>Programming a flash cell can…</p>
`,explain:`<p>Setting bits back to 1 needs an erase of the whole page.</p>
`,options:[`erase a page`,`set bits 0 to 1`,`only clear bits from 1 to 0`,`change any bit freely`],answer:2},{id:`p06-l13-q2`,type:`num`,q:`<p>Saves before a fixed page wears out (16 records per page, 10 000 erases)?</p>
`,explain:`<p>Records per erase × endurance.</p>
`,answer:16e4,tol:.001,unit:``},{id:`p06-l13-q3`,type:`num`,q:`<p>Erases per page for 10 million saves over a ring of 64 pages (16 records each)?</p>
`,explain:`<p>Just under the endurance.</p>
`,answer:9765.6,tol:.001,unit:``},{id:`p06-l13-q4`,type:`mc`,q:`<p>At boot the store returns…</p>
`,explain:`<p>Sequence numbers order the log.</p>
`,options:[`the first record in flash`,`the average of all records`,`the valid record with the highest sequence number`,`the last physical slot`],answer:2},{id:`p06-l13-q5`,type:`num`,q:`<p>Years to make 10 million saves at one every 10 s?</p>
`,explain:`<p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">8</span></span></span></span></span></span></span></span></span></span></span> s.</p>
`,answer:3.17,tol:.01,unit:`years`},{id:`p06-l13-q6`,type:`mc`,q:`<p>SRAM keeps its data…</p>
`,explain:`<p>It’s a latch.</p>
`,options:[`only when erased first`,`for 10 000 writes`,`only while powered`,`for 10 years without power`],answer:2}],o=[{file:`flashlog.py`,lang:`python`,src:`import random

PAGE_RECORDS, N_PAGES = 16, 8
ERASED = None                                          # an erased slot reads as all 1s; model it as None

class Flash:
    def __init__(self):
        self.pages = [[ERASED] * PAGE_RECORDS for _ in range(N_PAGES)]
        self.erases = [0] * N_PAGES
    def program(self, page, slot, rec, cut=False):
        assert self.pages[page][slot] is ERASED, "can only program an erased slot (bits 1 -> 0)"
        seq, val, chk = rec
        self.pages[page][slot] = (seq, val, chk ^ 0xFFFF) if cut else rec   # power cut: checksum incomplete
    def erase(self, page):
        self.pages[page] = [ERASED] * PAGE_RECORDS
        self.erases[page] += 1

def checksum(seq, val):
    return (seq * 31 + val * 7 + 0x1234) & 0xFFFF

class ParamStore:
    def __init__(self, flash):
        self.f = flash
        self.boot()
    def boot(self):
        best, newest, pos = None, 0, None
        for p in range(N_PAGES):
            for s in range(PAGE_RECORDS):
                r = self.f.pages[p][s]
                if r is ERASED:
                    continue
                if r[0] > newest:                     # newest slot written, even if half-written
                    newest, pos = r[0], (p, s)
                if r[2] == checksum(r[0], r[1]) and (best is None or r[0] > best[0]):
                    best = r                          # newest *valid* record
        self.value = best[1] if best else 0
        self.seq = newest
        self.next = self._advance(pos) if pos else (0, 0)
    def _advance(self, pos):
        p, s = pos
        s += 1
        if s == PAGE_RECORDS:
            p, s = (p + 1) % N_PAGES, 0
        return p, s
    def save(self, val, cut=False):
        p, s = self.next
        if s == 0 and self.f.pages[p][0] is not ERASED:
            self.f.erase(p)                            # wrapping onto the oldest page
        self.seq += 1
        self.f.program(p, s, (self.seq, val, checksum(self.seq, val)), cut)
        if not cut:
            self.value = val
        self.next = self._advance((p, s))

if __name__ == "__main__":
    random.seed(7)
    flash = Flash()
    store = ParamStore(flash)
    committed = 0
    for i in range(20_000):
        v = random.randrange(1000)
        if random.random() < 0.01:                      # power fails during this write
            store.save(v, cut=True)
            store = ParamStore(flash)                   # reboot
            assert store.value == committed, (i, store.value, committed)
        else:
            store.save(v)
            committed = v
        if i % 997 == 0:
            assert ParamStore(flash).value == committed
    print("erase counts per page:", flash.erases)
    assert max(flash.erases) - min(flash.erases) <= 1
    assert 10**7 // 16 // 64 == 9765 and 10**4 * 16 == 160_000`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};