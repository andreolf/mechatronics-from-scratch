var e=`p18-l08`,t=40,n=`Topics stream, services answer and actions carry out long goals with feedback. You build a small executor that runs one of each, the talker-listener, add_two_ints and Fibonacci examples, as an integration test, and reproduce the classic deadlock of calling a service synchronously inside a callback on a single-threaded executor.`,r=`<h2 id="three-ways-to-communicate">Three ways to communicate</h2>
<ul>
<li><strong>Topic</strong>: fire and forget, many to many. A publisher does not know who listens. Use for streams: sensor data, state, commands.</li>
<li><strong>Service</strong>: one request, one response, from a client to one server. Use for short queries and configuration (“reset odometry”, “get the map”).</li>
<li><strong>Action</strong>: a goal that takes time. The client sends a goal, the server accepts or rejects it, streams <strong>feedback</strong> and finally returns a <strong>result</strong>; the client can <strong>cancel</strong>. Built from services (goal, cancel, result) and topics (feedback, status). Use for “move to this pose”, “grasp”.</li>
</ul>
<h2 id="executors-and-callbacks">Executors and callbacks</h2>
<p>A node does not run its own loop. Its timers, subscriptions, service handlers and response handlers are <strong>callbacks</strong>, and an <strong>executor</strong> waits for work and runs them. <code>rclpy.spin(node)</code> uses a single-threaded executor: one callback at a time. A <code>MultiThreadedExecutor</code> runs several at once, limited by <strong>callback groups</strong>: callbacks in a mutually exclusive group never overlap, those in a reentrant group may.</p>
<h2 id="sync-versus-async">Sync versus async</h2>
<p><code>client.call(req)</code> blocks until the response arrives. But the response is itself delivered by a callback that the executor must run. Called from inside a callback on a single-threaded executor, it waits for work that can only happen after it returns: a <strong>deadlock</strong>. Use <code>call_async</code> and a done callback, or put the client in its own callback group on a multi-threaded executor.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="msgflow" data-args="{}"></div></div><figcaption>Messages moving between nodes: a topic stream, a service request and response, and an action’s goal, feedback and result. Step through or play, and toggle the synchronous call to see the executor stall.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The integration test runs in a simulated second of executor time:</p>
<ol>
<li>Topic: the talker publishes on a 0.1 s timer and the listener receives <code>hello 0</code> to <code>hello 4</code>.</li>
<li>Service: <code>call_async</code> to <code>add_two_ints</code> with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">2</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">3</span><span class="mclose">)</span></span></span></span> completes with 5.</li>
<li>Action: the Fibonacci goal of order 5 streams feedback <code>[0, 1, 1]</code>, <code>[0, 1, 1, 2]</code>, <code>[0, 1, 1, 2, 3]</code>, <code>[0, 1, 1, 2, 3, 5]</code> and succeeds with <code>[0, 1, 1, 2, 3, 5]</code>.</li>
<li>A synchronous call inside a timer callback times out on the single-threaded executor and on a two-thread executor when everything shares one callback group; with the service in its own group it returns 5.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">executor_model.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">from</span> collections <span class="hljs-keyword">import</span> deque

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Future</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>): <span class="hljs-variable language_">self</span>.done, <span class="hljs-variable language_">self</span>.result, <span class="hljs-variable language_">self</span>.cbs = <span class="hljs-literal">False</span>, <span class="hljs-literal">None</span>, []
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">set</span>(<span class="hljs-params">self, ex, value</span>):
        <span class="hljs-variable language_">self</span>.done, <span class="hljs-variable language_">self</span>.result = <span class="hljs-literal">True</span>, value
        <span class="hljs-keyword">for</span> cb <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.cbs: ex.post(cb, <span class="hljs-variable language_">self</span>, group=<span class="hljs-literal">None</span>)

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Executor</span>:
    <span class="hljs-string">&quot;&quot;&quot;a model of rclpy&#x27;s executors: callbacks wait in a queue; \`threads\` workers take them, but two callbacks of the same
    mutually exclusive callback group never run at once&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, threads=<span class="hljs-number">1</span></span>):
        <span class="hljs-variable language_">self</span>.q, <span class="hljs-variable language_">self</span>.timers, <span class="hljs-variable language_">self</span>.t, <span class="hljs-variable language_">self</span>.threads, <span class="hljs-variable language_">self</span>.running = deque(), [], <span class="hljs-number">0.0</span>, threads, []
        <span class="hljs-variable language_">self</span>.topics, <span class="hljs-variable language_">self</span>.services = {}, {}
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">post</span>(<span class="hljs-params">self, cb, *args, group=<span class="hljs-string">&quot;default&quot;</span></span>): <span class="hljs-variable language_">self</span>.q.append((cb, args, group))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_runnable</span>(<span class="hljs-params">self</span>):
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(<span class="hljs-variable language_">self</span>.running) &gt;= <span class="hljs-variable language_">self</span>.threads: <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>                  <span class="hljs-comment"># every worker is busy</span>
        <span class="hljs-keyword">for</span> i, (cb, args, g) <span class="hljs-keyword">in</span> <span class="hljs-built_in">enumerate</span>(<span class="hljs-variable language_">self</span>.q):
            <span class="hljs-keyword">if</span> g <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">or</span> g <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.running: <span class="hljs-keyword">del</span> <span class="hljs-variable language_">self</span>.q[i]; <span class="hljs-keyword">return</span> cb, args, g
        <span class="hljs-keyword">return</span> <span class="hljs-literal">None</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_run</span>(<span class="hljs-params">self, item</span>):
        cb, args, g = item; <span class="hljs-variable language_">self</span>.running.append(g); cb(*args); <span class="hljs-variable language_">self</span>.running.remove(g)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">wait_for</span>(<span class="hljs-params">self, fut, max_steps=<span class="hljs-number">1000</span></span>):
        <span class="hljs-string">&quot;&quot;&quot;a synchronous wait from inside a callback: other workers may keep executing callbacks meanwhile&quot;&quot;&quot;</span>
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(max_steps):
            <span class="hljs-keyword">if</span> fut.done: <span class="hljs-keyword">return</span> fut.result
            item = <span class="hljs-variable language_">self</span>._runnable()
            <span class="hljs-keyword">if</span> item: <span class="hljs-variable language_">self</span>._run(item)
            <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>._tick()
        <span class="hljs-keyword">raise</span> TimeoutError(<span class="hljs-string">&quot;future never completed: the executor could not run the callback it waits for&quot;</span>)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">_tick</span>(<span class="hljs-params">self, dt=<span class="hljs-number">0.01</span></span>):
        <span class="hljs-variable language_">self</span>.t = <span class="hljs-built_in">round</span>(<span class="hljs-variable language_">self</span>.t + dt, <span class="hljs-number">6</span>)
        <span class="hljs-keyword">for</span> tm <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.timers:
            <span class="hljs-keyword">if</span> <span class="hljs-variable language_">self</span>.t + <span class="hljs-number">1e-9</span> &gt;= tm[<span class="hljs-string">&quot;next&quot;</span>] <span class="hljs-keyword">and</span> tm[<span class="hljs-string">&quot;active&quot;</span>]: tm[<span class="hljs-string">&quot;next&quot;</span>] += tm[<span class="hljs-string">&quot;period&quot;</span>]; <span class="hljs-variable language_">self</span>.post(tm[<span class="hljs-string">&quot;cb&quot;</span>], group=tm[<span class="hljs-string">&quot;group&quot;</span>])
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">spin</span>(<span class="hljs-params">self, seconds</span>):
        end = <span class="hljs-variable language_">self</span>.t + seconds
        <span class="hljs-keyword">while</span> <span class="hljs-variable language_">self</span>.t &lt; end - <span class="hljs-number">1e-9</span>:
            item = <span class="hljs-variable language_">self</span>._runnable()
            <span class="hljs-keyword">if</span> item: <span class="hljs-variable language_">self</span>._run(item)
            <span class="hljs-keyword">else</span>: <span class="hljs-variable language_">self</span>._tick()

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Node</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, ex, name, group=<span class="hljs-string">&quot;default&quot;</span></span>): <span class="hljs-variable language_">self</span>.ex, <span class="hljs-variable language_">self</span>.name, <span class="hljs-variable language_">self</span>.group = ex, name, group
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">create_publisher</span>(<span class="hljs-params">self, topic</span>):
        <span class="hljs-keyword">return</span> <span class="hljs-keyword">lambda</span> msg: [<span class="hljs-variable language_">self</span>.ex.post(cb, msg, group=g) <span class="hljs-keyword">for</span> cb, g <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>.ex.topics.get(topic, [])]
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">create_subscription</span>(<span class="hljs-params">self, topic, cb, group=<span class="hljs-literal">None</span></span>): <span class="hljs-variable language_">self</span>.ex.topics.setdefault(topic, []).append((cb, group <span class="hljs-keyword">or</span> <span class="hljs-variable language_">self</span>.group))
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">create_timer</span>(<span class="hljs-params">self, period, cb, group=<span class="hljs-literal">None</span></span>):
        tm = {<span class="hljs-string">&quot;period&quot;</span>: period, <span class="hljs-string">&quot;next&quot;</span>: <span class="hljs-variable language_">self</span>.ex.t + period, <span class="hljs-string">&quot;cb&quot;</span>: cb, <span class="hljs-string">&quot;group&quot;</span>: group <span class="hljs-keyword">or</span> <span class="hljs-variable language_">self</span>.group, <span class="hljs-string">&quot;active&quot;</span>: <span class="hljs-literal">True</span>}
        <span class="hljs-variable language_">self</span>.ex.timers.append(tm); <span class="hljs-keyword">return</span> tm
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">create_service</span>(<span class="hljs-params">self, name, cb, group=<span class="hljs-literal">None</span></span>): <span class="hljs-variable language_">self</span>.ex.services[name] = (cb, group <span class="hljs-keyword">or</span> <span class="hljs-variable language_">self</span>.group)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">call_async</span>(<span class="hljs-params">self, name, req</span>):
        fut = Future(); cb, g = <span class="hljs-variable language_">self</span>.ex.services[name]
        <span class="hljs-variable language_">self</span>.ex.post(<span class="hljs-keyword">lambda</span>: fut.<span class="hljs-built_in">set</span>(<span class="hljs-variable language_">self</span>.ex, cb(req)), group=g); <span class="hljs-keyword">return</span> fut
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">call</span>(<span class="hljs-params">self, name, req</span>): <span class="hljs-keyword">return</span> <span class="hljs-variable language_">self</span>.ex.wait_for(<span class="hljs-variable language_">self</span>.call_async(name, req))

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ActionServer</span>:
    <span class="hljs-string">&quot;&quot;&quot;goal -&gt; accepted, periodic feedback, final result; a cancel request stops it early&quot;&quot;&quot;</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, node, name, execute_steps, period=<span class="hljs-number">0.1</span></span>):
        <span class="hljs-variable language_">self</span>.node, <span class="hljs-variable language_">self</span>.steps, <span class="hljs-variable language_">self</span>.period = node, execute_steps, period; node.ex.services[name + <span class="hljs-string">&quot;/send_goal&quot;</span>] = (<span class="hljs-variable language_">self</span>.on_goal, node.group)
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">on_goal</span>(<span class="hljs-params">self, req</span>):
        goal, fb_cb, res_fut = req
        gen = <span class="hljs-variable language_">self</span>.steps(goal); h = {<span class="hljs-string">&quot;cancel&quot;</span>: <span class="hljs-literal">False</span>}
        <span class="hljs-keyword">def</span> <span class="hljs-title function_">step</span>():
            <span class="hljs-keyword">if</span> h[<span class="hljs-string">&quot;cancel&quot;</span>]: tm[<span class="hljs-string">&quot;active&quot;</span>] = <span class="hljs-literal">False</span>; res_fut.<span class="hljs-built_in">set</span>(<span class="hljs-variable language_">self</span>.node.ex, (<span class="hljs-string">&quot;canceled&quot;</span>, <span class="hljs-literal">None</span>)); <span class="hljs-keyword">return</span>
            <span class="hljs-keyword">try</span>: fb_cb(<span class="hljs-built_in">next</span>(gen))
            <span class="hljs-keyword">except</span> StopIteration <span class="hljs-keyword">as</span> e: tm[<span class="hljs-string">&quot;active&quot;</span>] = <span class="hljs-literal">False</span>; res_fut.<span class="hljs-built_in">set</span>(<span class="hljs-variable language_">self</span>.node.ex, (<span class="hljs-string">&quot;succeeded&quot;</span>, e.value))
        tm = <span class="hljs-variable language_">self</span>.node.create_timer(<span class="hljs-variable language_">self</span>.period, step); <span class="hljs-keyword">return</span> h

<span class="hljs-keyword">def</span> <span class="hljs-title function_">fibonacci</span>(<span class="hljs-params">order</span>):
    seq = [<span class="hljs-number">0</span>, <span class="hljs-number">1</span>]
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(order - <span class="hljs-number">1</span>): seq.append(seq[-<span class="hljs-number">1</span>] + seq[-<span class="hljs-number">2</span>]); <span class="hljs-keyword">yield</span> <span class="hljs-built_in">list</span>(seq)
    <span class="hljs-keyword">return</span> seq

<span class="hljs-keyword">def</span> <span class="hljs-title function_">integration</span>(<span class="hljs-params">threads=<span class="hljs-number">1</span>, separate_group=<span class="hljs-literal">False</span>, sync_in_callback=<span class="hljs-literal">False</span></span>):
    ex = Executor(threads); log = {<span class="hljs-string">&quot;rx&quot;</span>: [], <span class="hljs-string">&quot;fb&quot;</span>: [], <span class="hljs-string">&quot;sum&quot;</span>: <span class="hljs-literal">None</span>, <span class="hljs-string">&quot;err&quot;</span>: <span class="hljs-literal">None</span>}
    talker = Node(ex, <span class="hljs-string">&quot;talker&quot;</span>); listener = Node(ex, <span class="hljs-string">&quot;listener&quot;</span>); server = Node(ex, <span class="hljs-string">&quot;adder&quot;</span>, <span class="hljs-string">&quot;server&quot;</span> <span class="hljs-keyword">if</span> separate_group <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;default&quot;</span>)
    pub = talker.create_publisher(<span class="hljs-string">&quot;chatter&quot;</span>); n = [<span class="hljs-number">0</span>]
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">tick</span>():
        <span class="hljs-keyword">if</span> n[<span class="hljs-number">0</span>] &lt; <span class="hljs-number">5</span>: pub(<span class="hljs-string">f&quot;hello <span class="hljs-subst">{n[<span class="hljs-number">0</span>]}</span>&quot;</span>); n[<span class="hljs-number">0</span>] += <span class="hljs-number">1</span>
    talker.create_timer(<span class="hljs-number">0.1</span>, tick)
    listener.create_subscription(<span class="hljs-string">&quot;chatter&quot;</span>, log[<span class="hljs-string">&quot;rx&quot;</span>].append)
    server.create_service(<span class="hljs-string">&quot;add_two_ints&quot;</span>, <span class="hljs-keyword">lambda</span> r: r[<span class="hljs-number">0</span>] + r[<span class="hljs-number">1</span>])
    <span class="hljs-keyword">if</span> sync_in_callback:                                     <span class="hljs-comment"># a timer callback calls the service synchronously</span>
        <span class="hljs-keyword">def</span> <span class="hljs-title function_">caller</span>():
            <span class="hljs-keyword">try</span>: log[<span class="hljs-string">&quot;sum&quot;</span>] = listener.call(<span class="hljs-string">&quot;add_two_ints&quot;</span>, (<span class="hljs-number">2</span>, <span class="hljs-number">3</span>))
            <span class="hljs-keyword">except</span> TimeoutError <span class="hljs-keyword">as</span> e: log[<span class="hljs-string">&quot;err&quot;</span>] = <span class="hljs-built_in">str</span>(e)
        tm = listener.create_timer(<span class="hljs-number">0.05</span>, <span class="hljs-keyword">lambda</span>: (caller(), tm.update(active=<span class="hljs-literal">False</span>)))
    <span class="hljs-keyword">else</span>:
        fut = listener.call_async(<span class="hljs-string">&quot;add_two_ints&quot;</span>, (<span class="hljs-number">2</span>, <span class="hljs-number">3</span>)); fut.cbs.append(<span class="hljs-keyword">lambda</span> f: log.update(<span class="hljs-built_in">sum</span>=f.result))
    fs = Node(ex, <span class="hljs-string">&quot;fib_server&quot;</span>); ActionServer(fs, <span class="hljs-string">&quot;fibonacci&quot;</span>, fibonacci)
    res = Future(); listener.call_async(<span class="hljs-string">&quot;fibonacci/send_goal&quot;</span>, (<span class="hljs-number">5</span>, log[<span class="hljs-string">&quot;fb&quot;</span>].append, res))
    ex.spin(<span class="hljs-number">1.0</span>)
    <span class="hljs-keyword">return</span> log, res

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_one_of_each</span>():
    log, res = integration()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;topic received:&quot;</span>, log[<span class="hljs-string">&quot;rx&quot;</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;service (async call) 2 + 3 =&quot;</span>, log[<span class="hljs-string">&quot;sum&quot;</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;action feedback:&quot;</span>, log[<span class="hljs-string">&quot;fb&quot;</span>], <span class="hljs-string">&quot;result:&quot;</span>, res.result)
    <span class="hljs-keyword">assert</span> log[<span class="hljs-string">&quot;rx&quot;</span>] == [<span class="hljs-string">f&quot;hello <span class="hljs-subst">{i}</span>&quot;</span> <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">5</span>)] <span class="hljs-keyword">and</span> log[<span class="hljs-string">&quot;sum&quot;</span>] == <span class="hljs-number">5</span>
    <span class="hljs-keyword">assert</span> res.result == (<span class="hljs-string">&quot;succeeded&quot;</span>, [<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">5</span>]) <span class="hljs-keyword">and</span> <span class="hljs-built_in">len</span>(log[<span class="hljs-string">&quot;fb&quot;</span>]) == <span class="hljs-number">4</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_sync_call_deadlock</span>():
    log, _ = integration(threads=<span class="hljs-number">1</span>, sync_in_callback=<span class="hljs-literal">True</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;single-threaded executor, sync call inside a callback:&quot;</span>, log[<span class="hljs-string">&quot;err&quot;</span>])
    <span class="hljs-keyword">assert</span> log[<span class="hljs-string">&quot;sum&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span> <span class="hljs-keyword">and</span> log[<span class="hljs-string">&quot;err&quot;</span>]
    log, _ = integration(threads=<span class="hljs-number">2</span>, sync_in_callback=<span class="hljs-literal">True</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;multi-threaded executor, same callback group:&quot;</span>, log[<span class="hljs-string">&quot;err&quot;</span>] <span class="hljs-keyword">or</span> log[<span class="hljs-string">&quot;sum&quot;</span>])
    <span class="hljs-keyword">assert</span> log[<span class="hljs-string">&quot;err&quot;</span>]
    log, _ = integration(threads=<span class="hljs-number">2</span>, separate_group=<span class="hljs-literal">True</span>, sync_in_callback=<span class="hljs-literal">True</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;multi-threaded executor, service in its own callback group: 2 + 3 =&quot;</span>, log[<span class="hljs-string">&quot;sum&quot;</span>])
    <span class="hljs-keyword">assert</span> log[<span class="hljs-string">&quot;sum&quot;</span>] == <span class="hljs-number">5</span> <span class="hljs-keyword">and</span> log[<span class="hljs-string">&quot;err&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>

test_one_of_each()
test_sync_call_deadlock()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<p>The same ideas in real rclpy, for reference (not run by this site’s checks; needs a ROS 2 install):</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">talker_ref.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-comment"># Reference only, not run by this site&#x27;s checks; needs a ROS 2 install (for example Jazzy).</span>
<span class="hljs-keyword">import</span> rclpy
<span class="hljs-keyword">from</span> rclpy.node <span class="hljs-keyword">import</span> Node
<span class="hljs-keyword">from</span> rclpy.callback_groups <span class="hljs-keyword">import</span> MutuallyExclusiveCallbackGroup
<span class="hljs-keyword">from</span> rclpy.executors <span class="hljs-keyword">import</span> MultiThreadedExecutor
<span class="hljs-keyword">from</span> std_msgs.msg <span class="hljs-keyword">import</span> String
<span class="hljs-keyword">from</span> example_interfaces.srv <span class="hljs-keyword">import</span> AddTwoInts

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Talker</span>(<span class="hljs-title class_ inherited__">Node</span>):
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self</span>):
        <span class="hljs-built_in">super</span>().__init__(<span class="hljs-string">&#x27;talker&#x27;</span>)
        <span class="hljs-variable language_">self</span>.pub = <span class="hljs-variable language_">self</span>.create_publisher(String, <span class="hljs-string">&#x27;chatter&#x27;</span>, <span class="hljs-number">10</span>)
        <span class="hljs-variable language_">self</span>.n = <span class="hljs-number">0</span>
        <span class="hljs-variable language_">self</span>.create_timer(<span class="hljs-number">0.1</span>, <span class="hljs-variable language_">self</span>.tick)
        <span class="hljs-variable language_">self</span>.cli = <span class="hljs-variable language_">self</span>.create_client(AddTwoInts, <span class="hljs-string">&#x27;add_two_ints&#x27;</span>, callback_group=MutuallyExclusiveCallbackGroup())

    <span class="hljs-keyword">def</span> <span class="hljs-title function_">tick</span>(<span class="hljs-params">self</span>):
        <span class="hljs-variable language_">self</span>.pub.publish(String(data=<span class="hljs-string">f&#x27;hello <span class="hljs-subst">{self.n}</span>&#x27;</span>)); <span class="hljs-variable language_">self</span>.n += <span class="hljs-number">1</span>
        fut = <span class="hljs-variable language_">self</span>.cli.call_async(AddTwoInts.Request(a=<span class="hljs-number">2</span>, b=<span class="hljs-number">3</span>))     <span class="hljs-comment"># never block inside a callback</span>
        fut.add_done_callback(<span class="hljs-keyword">lambda</span> f: <span class="hljs-variable language_">self</span>.get_logger().info(<span class="hljs-string">f&#x27;sum <span class="hljs-subst">{f.result().<span class="hljs-built_in">sum</span>}</span>&#x27;</span>))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">main</span>():
    rclpy.init()
    ex = MultiThreadedExecutor(); ex.add_node(Talker()); ex.spin()</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>The <code>demo_nodes_py</code>, <code>examples_rclpy_minimal_service</code> and <code>action_tutorials</code> packages contain the real versions of these nodes, and <code>ros2 service call</code>, <code>ros2 action send_goal --feedback</code> and <code>ros2 topic echo</code> exercise them from the command line. Integration tests use <code>launch_testing</code> to start nodes and assert on what they publish.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Should “drive 3 m forward” be a topic, a service or an action?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>An action: it takes seconds, the client wants progress (distance so far) and may need to cancel it. A service would block with no feedback, and a topic gives no result or acknowledgement.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does <code>call_async</code> followed by <code>rclpy.spin_until_future_complete(node, fut)</code> in <code>main()</code> work, while <code>call</code> inside a timer callback on a single-threaded executor hangs?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><code>spin_until_future_complete</code> runs the executor until the future is done, so the response callback gets executed. Inside a callback, the only executor thread is busy running that callback and cannot deliver the response.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l08"></div>
`,i=[{id:`three-ways-to-communicate`,title:`Three ways to communicate`},{id:`executors-and-callbacks`,title:`Executors and callbacks`},{id:`sync-versus-async`,title:`Sync versus async`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l08-q1`,type:`num`,q:`<p>Messages the listener received in the integration test?</p>
`,explain:`<p>hello 0 to hello 4.</p>
`,answer:5,tol:.001,unit:``},{id:`p18-l08-q2`,type:`num`,q:`<p>Last element of the Fibonacci result for order 5?</p>
`,explain:`<p>0, 1, 1, 2, 3, 5.</p>
`,answer:5,tol:.001,unit:``},{id:`p18-l08-q3`,type:`num`,q:`<p>Feedback messages in the example action?</p>
`,explain:`<p>One per added term.</p>
`,answer:4,tol:.001,unit:``},{id:`p18-l08-q4`,type:`num`,q:`<p>Messages per second from a 0.1 s timer?</p>
`,explain:`<p>10 Hz.</p>
`,answer:10,tol:.001,unit:``},{id:`p18-l08-q5`,type:`mc`,q:`<p>Calling a service synchronously inside a callback on a single-threaded executor…</p>
`,explain:`<p>Use call_async instead.</p>
`,options:[`works but is slow`,`deadlocks, because the response needs the busy executor`,`raises a type error`,`is required for reliability`],answer:1},{id:`p18-l08-q6`,type:`mc`,q:`<p>The best fit for a long task with progress and cancel is…</p>
`,explain:`<p>Actions provide feedback and cancel.</p>
`,options:[`a service`,`a parameter`,`a topic`,`an action`],answer:3}],o=[{file:`executor_model.py`,lang:`python`,src:`from collections import deque

class Future:
    def __init__(self): self.done, self.result, self.cbs = False, None, []
    def set(self, ex, value):
        self.done, self.result = True, value
        for cb in self.cbs: ex.post(cb, self, group=None)

class Executor:
    """a model of rclpy's executors: callbacks wait in a queue; \`threads\` workers take them, but two callbacks of the same
    mutually exclusive callback group never run at once"""
    def __init__(self, threads=1):
        self.q, self.timers, self.t, self.threads, self.running = deque(), [], 0.0, threads, []
        self.topics, self.services = {}, {}
    def post(self, cb, *args, group="default"): self.q.append((cb, args, group))
    def _runnable(self):
        if len(self.running) >= self.threads: return None                  # every worker is busy
        for i, (cb, args, g) in enumerate(self.q):
            if g is None or g not in self.running: del self.q[i]; return cb, args, g
        return None
    def _run(self, item):
        cb, args, g = item; self.running.append(g); cb(*args); self.running.remove(g)
    def wait_for(self, fut, max_steps=1000):
        """a synchronous wait from inside a callback: other workers may keep executing callbacks meanwhile"""
        for _ in range(max_steps):
            if fut.done: return fut.result
            item = self._runnable()
            if item: self._run(item)
            else: self._tick()
        raise TimeoutError("future never completed: the executor could not run the callback it waits for")
    def _tick(self, dt=0.01):
        self.t = round(self.t + dt, 6)
        for tm in self.timers:
            if self.t + 1e-9 >= tm["next"] and tm["active"]: tm["next"] += tm["period"]; self.post(tm["cb"], group=tm["group"])
    def spin(self, seconds):
        end = self.t + seconds
        while self.t < end - 1e-9:
            item = self._runnable()
            if item: self._run(item)
            else: self._tick()

class Node:
    def __init__(self, ex, name, group="default"): self.ex, self.name, self.group = ex, name, group
    def create_publisher(self, topic):
        return lambda msg: [self.ex.post(cb, msg, group=g) for cb, g in self.ex.topics.get(topic, [])]
    def create_subscription(self, topic, cb, group=None): self.ex.topics.setdefault(topic, []).append((cb, group or self.group))
    def create_timer(self, period, cb, group=None):
        tm = {"period": period, "next": self.ex.t + period, "cb": cb, "group": group or self.group, "active": True}
        self.ex.timers.append(tm); return tm
    def create_service(self, name, cb, group=None): self.ex.services[name] = (cb, group or self.group)
    def call_async(self, name, req):
        fut = Future(); cb, g = self.ex.services[name]
        self.ex.post(lambda: fut.set(self.ex, cb(req)), group=g); return fut
    def call(self, name, req): return self.ex.wait_for(self.call_async(name, req))

class ActionServer:
    """goal -> accepted, periodic feedback, final result; a cancel request stops it early"""
    def __init__(self, node, name, execute_steps, period=0.1):
        self.node, self.steps, self.period = node, execute_steps, period; node.ex.services[name + "/send_goal"] = (self.on_goal, node.group)
    def on_goal(self, req):
        goal, fb_cb, res_fut = req
        gen = self.steps(goal); h = {"cancel": False}
        def step():
            if h["cancel"]: tm["active"] = False; res_fut.set(self.node.ex, ("canceled", None)); return
            try: fb_cb(next(gen))
            except StopIteration as e: tm["active"] = False; res_fut.set(self.node.ex, ("succeeded", e.value))
        tm = self.node.create_timer(self.period, step); return h

def fibonacci(order):
    seq = [0, 1]
    for _ in range(order - 1): seq.append(seq[-1] + seq[-2]); yield list(seq)
    return seq

def integration(threads=1, separate_group=False, sync_in_callback=False):
    ex = Executor(threads); log = {"rx": [], "fb": [], "sum": None, "err": None}
    talker = Node(ex, "talker"); listener = Node(ex, "listener"); server = Node(ex, "adder", "server" if separate_group else "default")
    pub = talker.create_publisher("chatter"); n = [0]
    def tick():
        if n[0] < 5: pub(f"hello {n[0]}"); n[0] += 1
    talker.create_timer(0.1, tick)
    listener.create_subscription("chatter", log["rx"].append)
    server.create_service("add_two_ints", lambda r: r[0] + r[1])
    if sync_in_callback:                                     # a timer callback calls the service synchronously
        def caller():
            try: log["sum"] = listener.call("add_two_ints", (2, 3))
            except TimeoutError as e: log["err"] = str(e)
        tm = listener.create_timer(0.05, lambda: (caller(), tm.update(active=False)))
    else:
        fut = listener.call_async("add_two_ints", (2, 3)); fut.cbs.append(lambda f: log.update(sum=f.result))
    fs = Node(ex, "fib_server"); ActionServer(fs, "fibonacci", fibonacci)
    res = Future(); listener.call_async("fibonacci/send_goal", (5, log["fb"].append, res))
    ex.spin(1.0)
    return log, res

def test_one_of_each():
    log, res = integration()
    print("topic received:", log["rx"])
    print("service (async call) 2 + 3 =", log["sum"])
    print("action feedback:", log["fb"], "result:", res.result)
    assert log["rx"] == [f"hello {i}" for i in range(5)] and log["sum"] == 5
    assert res.result == ("succeeded", [0, 1, 1, 2, 3, 5]) and len(log["fb"]) == 4

def test_sync_call_deadlock():
    log, _ = integration(threads=1, sync_in_callback=True)
    print("single-threaded executor, sync call inside a callback:", log["err"])
    assert log["sum"] is None and log["err"]
    log, _ = integration(threads=2, sync_in_callback=True)
    print("multi-threaded executor, same callback group:", log["err"] or log["sum"])
    assert log["err"]
    log, _ = integration(threads=2, separate_group=True, sync_in_callback=True)
    print("multi-threaded executor, service in its own callback group: 2 + 3 =", log["sum"])
    assert log["sum"] == 5 and log["err"] is None

test_one_of_each()
test_sync_call_deadlock()
print("PASS")`},{file:`talker_ref.py`,lang:`python`,src:`# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.callback_groups import MutuallyExclusiveCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from std_msgs.msg import String
from example_interfaces.srv import AddTwoInts

class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.pub = self.create_publisher(String, 'chatter', 10)
        self.n = 0
        self.create_timer(0.1, self.tick)
        self.cli = self.create_client(AddTwoInts, 'add_two_ints', callback_group=MutuallyExclusiveCallbackGroup())

    def tick(self):
        self.pub.publish(String(data=f'hello {self.n}')); self.n += 1
        fut = self.cli.call_async(AddTwoInts.Request(a=2, b=3))     # never block inside a callback
        fut.add_done_callback(lambda f: self.get_logger().info(f'sum {f.result().sum}'))

def main():
    rclpy.init()
    ex = MultiThreadedExecutor(); ex.add_node(Talker()); ex.spin()`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};