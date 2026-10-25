var e=`p18-l13`,t=35,n=`A robot starts dozens of nodes, each with its own namespace, parameters and remappings. You model what a ROS 2 launch file does, arguments with defaults and command-line overrides, namespaced groups, conditions, parameter files with wildcards and remaps, and check that every node ends up with the right parameters.`,r=`<h2 id="what-launch-does">What launch does</h2>
<p><code>ros2 launch my_robot bringup.launch.py robot:=robot2</code> runs a <strong>launch description</strong>: a list of actions that declare arguments, start nodes, group them, include other launch files and set conditions. Values such as <code>LaunchConfiguration('robot')</code> are <strong>substitutions</strong>, resolved only when the launch runs, after command-line arguments override the declared defaults.</p>
<h2 id="namespaces-and-remapping">Namespaces and remapping</h2>
<p><code>GroupAction([PushRosNamespace('robot1'), …])</code> puts every node in the group under <code>/robot1</code>, so its relative topics (<code>cmd_vel</code>) become <code>/robot1/cmd_vel</code> (lesson 07). A <strong>remapping</strong> <code>('cmd_vel', 'base/cmd_vel')</code> renames one name for one node without touching its code, which is how you wire nodes written by different people together.</p>
<h2 id="parameters">Parameters</h2>
<p>Each node declares its parameters and reads them at start-up. Values come from, in order, with later ones winning:</p>
<ol>
<li>the node’s declared defaults,</li>
<li>each entry of <code>parameters=[…]</code> in the launch file, in list order: YAML files and inline dictionaries,</li>
<li>inside a YAML file, every section whose node pattern matches the node’s fully qualified name, in file order. <code>/**</code> matches every node and <code>*</code> matches one name.</li>
</ol>
<pre><code class="language-text">/**:
  ros__parameters: {use_sim_time: false, rate: 50.0}
/*/driver:
  ros__parameters: {port: /dev/ttyUSB0}
/robot1/controller:
  ros__parameters: {kp: 2.5, rate: 200.0}
</code></pre>
<p>So for each key, the final value is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">v</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight"><span class="mord mathnormal mtight">i</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6183em;"><span style="top:-2.786em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> from the last source that sets it, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6887em;"></span><span class="mord"><span class="mord mathnormal">i</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.6887em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mbin mtight">∗</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop">max</span><span class="mopen">{</span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">:</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">source\xA0</span></span><span class="mord mathnormal">i</span><span class="mord text"><span class="mord">\xA0sets\xA0the\xA0key</span></span><span class="mclose">}</span></span></span></span>. Launch passes substituted strings through YAML rules, so <code>'false'</code> becomes a boolean.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="launchtree" data-args="{}"></div></div><figcaption>The launch tree of an illustrative bringup. Change the launch arguments; each node shows its resolved name, parameters (with where each value came from) and remappings.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The default launch of the illustrative description above:</p>
<ol>
<li>Arguments <code>robot = robot1</code>, <code>use_sim_time = false</code>, <code>with_logger = true</code>; groups <code>/robot1</code> (driver and controller) and <code>/tools</code> (logger).</li>
<li><code>/robot1/driver</code> gets <code>use_sim_time False</code>, <code>rate 50.0</code> from the wildcard and <code>port /dev/ttyUSB0</code> from <code>/*/driver</code>.</li>
<li><code>/robot1/controller</code> gets <code>rate 200.0</code> and <code>kp 2.5</code> (its own section overrides the wildcard), <code>use_sim_time False</code> from the inline dictionary, and its <code>/robot1/cmd_vel</code> is remapped to <code>/robot1/base/cmd_vel</code>.</li>
<li><code>/tools/logger</code> gets <code>rate 10.0</code> from its inline dictionary, which comes after the file, and no <code>port</code>.</li>
<li>With <code>robot:=robot2 use_sim_time:=true with_logger:=false</code> only <code>/robot2/driver</code> and <code>/robot2/controller</code> start, <code>use_sim_time</code> is True, and the controller has <strong>no</strong> <code>kp</code>: the YAML names <code>/robot1/controller</code> explicitly. A classic bug, which the check catches.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">launch_model.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> re

PARAMS_YAML = {                                  <span class="hljs-comment"># what a params.yaml file parses to; applied in file order</span>
    <span class="hljs-string">&quot;/**&quot;</span>: {<span class="hljs-string">&quot;ros__parameters&quot;</span>: {<span class="hljs-string">&quot;use_sim_time&quot;</span>: <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-number">50.0</span>}},
    <span class="hljs-string">&quot;/*/driver&quot;</span>: {<span class="hljs-string">&quot;ros__parameters&quot;</span>: {<span class="hljs-string">&quot;port&quot;</span>: <span class="hljs-string">&quot;/dev/ttyUSB0&quot;</span>}},
    <span class="hljs-string">&quot;/robot1/controller&quot;</span>: {<span class="hljs-string">&quot;ros__parameters&quot;</span>: {<span class="hljs-string">&quot;kp&quot;</span>: <span class="hljs-number">2.5</span>, <span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-number">200.0</span>}},
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Arg</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, name, default</span>): <span class="hljs-variable language_">self</span>.name, <span class="hljs-variable language_">self</span>.default = name, default
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Sub</span>:                                       <span class="hljs-comment"># LaunchConfiguration(&#x27;x&#x27;): resolved only when the launch runs</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, name, fmt=<span class="hljs-string">&quot;{}&quot;</span></span>): <span class="hljs-variable language_">self</span>.name, <span class="hljs-variable language_">self</span>.fmt = name, fmt
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Group</span>:                                     <span class="hljs-comment"># GroupAction([PushRosNamespace(ns), ...]): scoped namespace and arguments</span>
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, ns, children, condition=<span class="hljs-literal">None</span></span>): <span class="hljs-variable language_">self</span>.ns, <span class="hljs-variable language_">self</span>.children, <span class="hljs-variable language_">self</span>.condition = ns, children, condition
<span class="hljs-keyword">class</span> <span class="hljs-title class_">NodeDesc</span>:
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">__init__</span>(<span class="hljs-params">self, package, executable, name, parameters=(<span class="hljs-params"></span>), remappings=(<span class="hljs-params"></span>), namespace=<span class="hljs-literal">None</span></span>):
        <span class="hljs-variable language_">self</span>.package, <span class="hljs-variable language_">self</span>.executable, <span class="hljs-variable language_">self</span>.name = package, executable, name
        <span class="hljs-variable language_">self</span>.parameters, <span class="hljs-variable language_">self</span>.remappings, <span class="hljs-variable language_">self</span>.namespace = <span class="hljs-built_in">list</span>(parameters), <span class="hljs-built_in">list</span>(remappings), namespace

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sub</span>(<span class="hljs-params">v, cfg</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(v, Sub): <span class="hljs-keyword">return</span> v.fmt.<span class="hljs-built_in">format</span>(cfg[v.name])
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(v, <span class="hljs-built_in">dict</span>): <span class="hljs-keyword">return</span> {k: sub(x, cfg) <span class="hljs-keyword">for</span> k, x <span class="hljs-keyword">in</span> v.items()}
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(v, (<span class="hljs-built_in">list</span>, <span class="hljs-built_in">tuple</span>)): <span class="hljs-keyword">return</span> <span class="hljs-built_in">type</span>(v)(sub(x, cfg) <span class="hljs-keyword">for</span> x <span class="hljs-keyword">in</span> v)
    <span class="hljs-keyword">return</span> v

<span class="hljs-keyword">def</span> <span class="hljs-title function_">typed</span>(<span class="hljs-params">v</span>):
    <span class="hljs-string">&quot;&quot;&quot;launch passes substituted strings to parameters through YAML rules: &#x27;true&#x27; is a bool, &#x27;2.5&#x27; a float&quot;&quot;&quot;</span>
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> <span class="hljs-built_in">isinstance</span>(v, <span class="hljs-built_in">str</span>): <span class="hljs-keyword">return</span> v
    <span class="hljs-keyword">if</span> v.lower() <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;true&quot;</span>, <span class="hljs-string">&quot;false&quot;</span>): <span class="hljs-keyword">return</span> v.lower() == <span class="hljs-string">&quot;true&quot;</span>
    <span class="hljs-keyword">try</span>: <span class="hljs-keyword">return</span> <span class="hljs-built_in">int</span>(v)
    <span class="hljs-keyword">except</span> ValueError: <span class="hljs-keyword">pass</span>
    <span class="hljs-keyword">try</span>: <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(v)
    <span class="hljs-keyword">except</span> ValueError: <span class="hljs-keyword">return</span> v

<span class="hljs-keyword">def</span> <span class="hljs-title function_">match</span>(<span class="hljs-params">pattern, fqn</span>):
    <span class="hljs-string">&quot;&quot;&quot;ROS 2 parameter-file node patterns: &#x27;*&#x27; matches one name token, &#x27;**&#x27; any number of tokens&quot;&quot;&quot;</span>
    rx = <span class="hljs-string">&quot;^&quot;</span> + re.escape(pattern).replace(<span class="hljs-string">r&quot;/\\*\\*&quot;</span>, <span class="hljs-string">&quot;(/[^/]+)*&quot;</span>).replace(<span class="hljs-string">r&quot;\\*&quot;</span>, <span class="hljs-string">&quot;[^/]+&quot;</span>) + <span class="hljs-string">&quot;$&quot;</span>
    <span class="hljs-keyword">return</span> re.<span class="hljs-keyword">match</span>(rx, fqn) <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">launch</span>(<span class="hljs-params">description, cli=<span class="hljs-literal">None</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;run a launch description: resolve arguments (command line overrides defaults), push namespaces,
    then give each node its parameters (files and dicts in list order, later wins) and remappings&quot;&quot;&quot;</span>
    cfg = {a.name: a.default <span class="hljs-keyword">for</span> a <span class="hljs-keyword">in</span> description <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(a, Arg)}; cfg.update(cli <span class="hljs-keyword">or</span> {})
    nodes, tree = [], []
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">walk</span>(<span class="hljs-params">items, ns, depth</span>):
        <span class="hljs-keyword">for</span> it <span class="hljs-keyword">in</span> items:
            <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(it, Group):
                <span class="hljs-keyword">if</span> it.condition <span class="hljs-keyword">and</span> <span class="hljs-built_in">str</span>(sub(it.condition, cfg)).lower() != <span class="hljs-string">&quot;true&quot;</span>:
                    tree.append(<span class="hljs-string">&quot;  &quot;</span> * depth + <span class="hljs-string">f&quot;group <span class="hljs-subst">{sub(it.ns, cfg)}</span> (skipped: condition false)&quot;</span>); <span class="hljs-keyword">continue</span>
                g = (ns.rstrip(<span class="hljs-string">&quot;/&quot;</span>) + <span class="hljs-string">&quot;/&quot;</span> + sub(it.ns, cfg).strip(<span class="hljs-string">&quot;/&quot;</span>)) <span class="hljs-keyword">if</span> it.ns <span class="hljs-keyword">else</span> ns
                tree.append(<span class="hljs-string">&quot;  &quot;</span> * depth + <span class="hljs-string">f&quot;group namespace <span class="hljs-subst">{g}</span>&quot;</span>); walk(it.children, g, depth + <span class="hljs-number">1</span>)
            <span class="hljs-keyword">elif</span> <span class="hljs-built_in">isinstance</span>(it, NodeDesc):
                nns = sub(it.namespace, cfg) <span class="hljs-keyword">if</span> it.namespace <span class="hljs-keyword">else</span> ns <span class="hljs-keyword">or</span> <span class="hljs-string">&quot;/&quot;</span>
                fqn = (nns.rstrip(<span class="hljs-string">&quot;/&quot;</span>) + <span class="hljs-string">&quot;/&quot;</span> + it.name)
                params = {}
                <span class="hljs-keyword">for</span> p <span class="hljs-keyword">in</span> it.parameters:
                    <span class="hljs-keyword">if</span> <span class="hljs-built_in">isinstance</span>(p, <span class="hljs-built_in">str</span>) <span class="hljs-keyword">and</span> p == <span class="hljs-string">&quot;params.yaml&quot;</span>:
                        <span class="hljs-keyword">for</span> pat, body <span class="hljs-keyword">in</span> PARAMS_YAML.items():
                            <span class="hljs-keyword">if</span> <span class="hljs-keyword">match</span>(pat, fqn): params.update(body[<span class="hljs-string">&quot;ros__parameters&quot;</span>])
                    <span class="hljs-keyword">else</span>: params.update({k: typed(v) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> sub(p, cfg).items()})
                remap = {}
                <span class="hljs-keyword">for</span> a, b <span class="hljs-keyword">in</span> it.remappings:
                    full = <span class="hljs-keyword">lambda</span> n: n <span class="hljs-keyword">if</span> n.startswith(<span class="hljs-string">&quot;/&quot;</span>) <span class="hljs-keyword">else</span> nns.rstrip(<span class="hljs-string">&quot;/&quot;</span>) + <span class="hljs-string">&quot;/&quot;</span> + n
                    remap[full(sub(a, cfg))] = full(sub(b, cfg))
                nodes.append({<span class="hljs-string">&quot;fqn&quot;</span>: fqn, <span class="hljs-string">&quot;params&quot;</span>: params, <span class="hljs-string">&quot;remap&quot;</span>: remap})
                tree.append(<span class="hljs-string">&quot;  &quot;</span> * depth + <span class="hljs-string">f&quot;node <span class="hljs-subst">{it.package}</span>/<span class="hljs-subst">{it.executable}</span> as <span class="hljs-subst">{fqn}</span>&quot;</span>)
            <span class="hljs-keyword">elif</span> <span class="hljs-built_in">isinstance</span>(it, Arg):
                tree.append(<span class="hljs-string">&quot;  &quot;</span> * depth + <span class="hljs-string">f&quot;arg <span class="hljs-subst">{it.name}</span> = <span class="hljs-subst">{cfg[it.name]!r}</span>&quot;</span>)
    walk(description, <span class="hljs-string">&quot;&quot;</span>, <span class="hljs-number">0</span>)
    <span class="hljs-keyword">return</span> {n[<span class="hljs-string">&quot;fqn&quot;</span>]: n <span class="hljs-keyword">for</span> n <span class="hljs-keyword">in</span> nodes}, tree

<span class="hljs-keyword">def</span> <span class="hljs-title function_">description</span>():
    <span class="hljs-keyword">return</span> [
        Arg(<span class="hljs-string">&quot;robot&quot;</span>, <span class="hljs-string">&quot;robot1&quot;</span>), Arg(<span class="hljs-string">&quot;use_sim_time&quot;</span>, <span class="hljs-string">&quot;false&quot;</span>), Arg(<span class="hljs-string">&quot;with_logger&quot;</span>, <span class="hljs-string">&quot;true&quot;</span>),
        Group(Sub(<span class="hljs-string">&quot;robot&quot;</span>), [
            NodeDesc(<span class="hljs-string">&quot;my_robot&quot;</span>, <span class="hljs-string">&quot;driver&quot;</span>, <span class="hljs-string">&quot;driver&quot;</span>, [<span class="hljs-string">&quot;params.yaml&quot;</span>]),
            NodeDesc(<span class="hljs-string">&quot;my_robot&quot;</span>, <span class="hljs-string">&quot;controller&quot;</span>, <span class="hljs-string">&quot;controller&quot;</span>, [<span class="hljs-string">&quot;params.yaml&quot;</span>, {<span class="hljs-string">&quot;use_sim_time&quot;</span>: Sub(<span class="hljs-string">&quot;use_sim_time&quot;</span>)}],
                     remappings=[(<span class="hljs-string">&quot;cmd_vel&quot;</span>, <span class="hljs-string">&quot;base/cmd_vel&quot;</span>)]),
        ]),
        Group(<span class="hljs-string">&quot;tools&quot;</span>, [NodeDesc(<span class="hljs-string">&quot;my_robot&quot;</span>, <span class="hljs-string">&quot;logger&quot;</span>, <span class="hljs-string">&quot;logger&quot;</span>, [<span class="hljs-string">&quot;params.yaml&quot;</span>, {<span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-number">10.0</span>}])], condition=Sub(<span class="hljs-string">&quot;with_logger&quot;</span>)),
    ]

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_default_launch</span>():
    nodes, tree = launch(description()); <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;\\n&quot;</span>.join(tree))
    <span class="hljs-keyword">for</span> f, n <span class="hljs-keyword">in</span> nodes.items(): <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;  <span class="hljs-subst">{f}</span>: <span class="hljs-subst">{n[<span class="hljs-string">&#x27;params&#x27;</span>]}</span>&quot;</span> + (<span class="hljs-string">f&quot; remap <span class="hljs-subst">{n[<span class="hljs-string">&#x27;remap&#x27;</span>]}</span>&quot;</span> <span class="hljs-keyword">if</span> n[<span class="hljs-string">&quot;remap&quot;</span>] <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;&quot;</span>))
    c = nodes[<span class="hljs-string">&quot;/robot1/controller&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>]
    <span class="hljs-keyword">assert</span> c == {<span class="hljs-string">&quot;use_sim_time&quot;</span>: <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-number">200.0</span>, <span class="hljs-string">&quot;kp&quot;</span>: <span class="hljs-number">2.5</span>}          <span class="hljs-comment"># specific file entry beats the wildcard</span>
    <span class="hljs-keyword">assert</span> nodes[<span class="hljs-string">&quot;/robot1/driver&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>][<span class="hljs-string">&quot;port&quot;</span>] == <span class="hljs-string">&quot;/dev/ttyUSB0&quot;</span> <span class="hljs-keyword">and</span> nodes[<span class="hljs-string">&quot;/robot1/driver&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>][<span class="hljs-string">&quot;rate&quot;</span>] == <span class="hljs-number">50.0</span>
    <span class="hljs-keyword">assert</span> nodes[<span class="hljs-string">&quot;/tools/logger&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>] == {<span class="hljs-string">&quot;use_sim_time&quot;</span>: <span class="hljs-literal">False</span>, <span class="hljs-string">&quot;rate&quot;</span>: <span class="hljs-number">10.0</span>}   <span class="hljs-comment"># the inline dict comes later and wins</span>
    <span class="hljs-keyword">assert</span> <span class="hljs-string">&quot;port&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> nodes[<span class="hljs-string">&quot;/tools/logger&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>]                    <span class="hljs-comment"># /*/driver does not match logger</span>
    <span class="hljs-keyword">assert</span> nodes[<span class="hljs-string">&quot;/robot1/controller&quot;</span>][<span class="hljs-string">&quot;remap&quot;</span>] == {<span class="hljs-string">&quot;/robot1/cmd_vel&quot;</span>: <span class="hljs-string">&quot;/robot1/base/cmd_vel&quot;</span>}

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_command_line</span>():
    nodes, _ = launch(description(), {<span class="hljs-string">&quot;robot&quot;</span>: <span class="hljs-string">&quot;robot2&quot;</span>, <span class="hljs-string">&quot;use_sim_time&quot;</span>: <span class="hljs-string">&quot;true&quot;</span>, <span class="hljs-string">&quot;with_logger&quot;</span>: <span class="hljs-string">&quot;false&quot;</span>})
    <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;with robot:=robot2 use_sim_time:=true with_logger:=false -&gt;&quot;</span>, <span class="hljs-built_in">sorted</span>(nodes))
    <span class="hljs-keyword">assert</span> <span class="hljs-built_in">sorted</span>(nodes) == [<span class="hljs-string">&quot;/robot2/controller&quot;</span>, <span class="hljs-string">&quot;/robot2/driver&quot;</span>]
    <span class="hljs-keyword">assert</span> <span class="hljs-string">&quot;kp&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> nodes[<span class="hljs-string">&quot;/robot2/controller&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>]                 <span class="hljs-comment"># the YAML names robot1 explicitly: a classic bug</span>
    <span class="hljs-keyword">assert</span> nodes[<span class="hljs-string">&quot;/robot2/controller&quot;</span>][<span class="hljs-string">&quot;params&quot;</span>][<span class="hljs-string">&quot;use_sim_time&quot;</span>] <span class="hljs-keyword">is</span> <span class="hljs-literal">True</span>

test_default_launch()
test_command_line()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<p>The same description as a real launch file, for reference (not run by this site’s checks; needs a ROS 2 install):</p>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">bringup_ref.launch.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-comment"># Reference only, not run by this site&#x27;s checks; needs a ROS 2 install (for example Jazzy).</span>
<span class="hljs-comment"># bringup.launch.py: the same description as the model above.</span>
<span class="hljs-keyword">from</span> launch <span class="hljs-keyword">import</span> LaunchDescription
<span class="hljs-keyword">from</span> launch.actions <span class="hljs-keyword">import</span> DeclareLaunchArgument, GroupAction
<span class="hljs-keyword">from</span> launch.conditions <span class="hljs-keyword">import</span> IfCondition
<span class="hljs-keyword">from</span> launch.substitutions <span class="hljs-keyword">import</span> LaunchConfiguration, PathJoinSubstitution
<span class="hljs-keyword">from</span> launch_ros.actions <span class="hljs-keyword">import</span> Node, PushRosNamespace
<span class="hljs-keyword">from</span> launch_ros.substitutions <span class="hljs-keyword">import</span> FindPackageShare

<span class="hljs-keyword">def</span> <span class="hljs-title function_">generate_launch_description</span>():
    robot = LaunchConfiguration(<span class="hljs-string">&#x27;robot&#x27;</span>)
    params = PathJoinSubstitution([FindPackageShare(<span class="hljs-string">&#x27;my_robot&#x27;</span>), <span class="hljs-string">&#x27;config&#x27;</span>, <span class="hljs-string">&#x27;params.yaml&#x27;</span>])
    <span class="hljs-keyword">return</span> LaunchDescription([
        DeclareLaunchArgument(<span class="hljs-string">&#x27;robot&#x27;</span>, default_value=<span class="hljs-string">&#x27;robot1&#x27;</span>),
        DeclareLaunchArgument(<span class="hljs-string">&#x27;use_sim_time&#x27;</span>, default_value=<span class="hljs-string">&#x27;false&#x27;</span>),
        DeclareLaunchArgument(<span class="hljs-string">&#x27;with_logger&#x27;</span>, default_value=<span class="hljs-string">&#x27;true&#x27;</span>),
        GroupAction([
            PushRosNamespace(robot),
            Node(package=<span class="hljs-string">&#x27;my_robot&#x27;</span>, executable=<span class="hljs-string">&#x27;driver&#x27;</span>, name=<span class="hljs-string">&#x27;driver&#x27;</span>, parameters=[params]),
            Node(package=<span class="hljs-string">&#x27;my_robot&#x27;</span>, executable=<span class="hljs-string">&#x27;controller&#x27;</span>, name=<span class="hljs-string">&#x27;controller&#x27;</span>,
                 parameters=[params, {<span class="hljs-string">&#x27;use_sim_time&#x27;</span>: LaunchConfiguration(<span class="hljs-string">&#x27;use_sim_time&#x27;</span>)}],
                 remappings=[(<span class="hljs-string">&#x27;cmd_vel&#x27;</span>, <span class="hljs-string">&#x27;base/cmd_vel&#x27;</span>)]),
        ]),
        GroupAction([
            PushRosNamespace(<span class="hljs-string">&#x27;tools&#x27;</span>),
            Node(package=<span class="hljs-string">&#x27;my_robot&#x27;</span>, executable=<span class="hljs-string">&#x27;logger&#x27;</span>, name=<span class="hljs-string">&#x27;logger&#x27;</span>, parameters=[params, {<span class="hljs-string">&#x27;rate&#x27;</span>: <span class="hljs-number">10.0</span>}]),
        ], condition=IfCondition(LaunchConfiguration(<span class="hljs-string">&#x27;with_logger&#x27;</span>))),
    ])</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Inspect a running system with <code>ros2 param list /robot1/controller</code>, <code>ros2 param get</code> and <code>ros2 param dump</code>. Use <code>ros2 launch … --show-args</code> to list the arguments and <code>--print</code> to see the resolved description. Nodes can react to runtime changes with a parameter callback, and declare ranges and read-only flags with parameter descriptors.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>How would you make the parameter file work for any robot namespace?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Use a pattern instead of the namespace: <code>/*/controller</code> or <code>/**/controller</code>. Alternatively substitute the namespace into the file name or pass the robot-specific values as an inline dictionary in the launch file.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A node started with <code>parameters=[{'rate': 10.0}, params_file]</code> ignores your <code>rate: 10.0</code>. Why?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Entries are applied in list order, so the file, which sets <code>rate</code> through <code>/**</code>, comes later and wins. Put the dictionary after the file.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p18-l13"></div>
`,i=[{id:`what-launch-does`,title:`What launch does`},{id:`namespaces-and-remapping`,title:`Namespaces and remapping`},{id:`parameters`,title:`Parameters`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p18-l13-q1`,type:`num`,q:`<p>Nodes started in the default launch of the example?</p>
`,explain:`<p>Driver, controller and logger.</p>
`,answer:3,tol:.001,unit:``},{id:`p18-l13-q2`,type:`num`,q:`<p>Rate the example controller gets (Hz)?</p>
`,explain:`<p>Its own section overrides the wildcard.</p>
`,answer:200,tol:.001,unit:``},{id:`p18-l13-q3`,type:`num`,q:`<p>Rate the example driver gets (Hz)?</p>
`,explain:`<p>Only the wildcard sets it.</p>
`,answer:50,tol:.001,unit:``},{id:`p18-l13-q4`,type:`num`,q:`<p>Nodes started with with_logger:=false?</p>
`,explain:`<p>The tools group is skipped.</p>
`,answer:2,tol:.001,unit:``},{id:`p18-l13-q5`,type:`mc`,q:`<p>In a ROS 2 parameter file, /** matches…</p>
`,explain:`<p>Any number of name tokens.</p>
`,options:[`nothing; it is a comment`,`only the first node`,`every node in every namespace`,`only nodes in the root namespace`],answer:2},{id:`p18-l13-q6`,type:`mc`,q:`<p>A remapping cmd_vel to base/cmd_vel in namespace /robot1 renames the topic to…</p>
`,explain:`<p>Relative names resolve in the node’s namespace.</p>
`,options:[`/robot1/base/cmd_vel`,`/cmd_vel`,`/base/cmd_vel`,`/robot1/cmd_vel/base`],answer:0}],o=[{file:`launch_model.py`,lang:`python`,src:`import re

PARAMS_YAML = {                                  # what a params.yaml file parses to; applied in file order
    "/**": {"ros__parameters": {"use_sim_time": False, "rate": 50.0}},
    "/*/driver": {"ros__parameters": {"port": "/dev/ttyUSB0"}},
    "/robot1/controller": {"ros__parameters": {"kp": 2.5, "rate": 200.0}},
}

class Arg:
    def __init__(self, name, default): self.name, self.default = name, default
class Sub:                                       # LaunchConfiguration('x'): resolved only when the launch runs
    def __init__(self, name, fmt="{}"): self.name, self.fmt = name, fmt
class Group:                                     # GroupAction([PushRosNamespace(ns), ...]): scoped namespace and arguments
    def __init__(self, ns, children, condition=None): self.ns, self.children, self.condition = ns, children, condition
class NodeDesc:
    def __init__(self, package, executable, name, parameters=(), remappings=(), namespace=None):
        self.package, self.executable, self.name = package, executable, name
        self.parameters, self.remappings, self.namespace = list(parameters), list(remappings), namespace

def sub(v, cfg):
    if isinstance(v, Sub): return v.fmt.format(cfg[v.name])
    if isinstance(v, dict): return {k: sub(x, cfg) for k, x in v.items()}
    if isinstance(v, (list, tuple)): return type(v)(sub(x, cfg) for x in v)
    return v

def typed(v):
    """launch passes substituted strings to parameters through YAML rules: 'true' is a bool, '2.5' a float"""
    if not isinstance(v, str): return v
    if v.lower() in ("true", "false"): return v.lower() == "true"
    try: return int(v)
    except ValueError: pass
    try: return float(v)
    except ValueError: return v

def match(pattern, fqn):
    """ROS 2 parameter-file node patterns: '*' matches one name token, '**' any number of tokens"""
    rx = "^" + re.escape(pattern).replace(r"/\\*\\*", "(/[^/]+)*").replace(r"\\*", "[^/]+") + "$"
    return re.match(rx, fqn) is not None

def launch(description, cli=None):
    """run a launch description: resolve arguments (command line overrides defaults), push namespaces,
    then give each node its parameters (files and dicts in list order, later wins) and remappings"""
    cfg = {a.name: a.default for a in description if isinstance(a, Arg)}; cfg.update(cli or {})
    nodes, tree = [], []
    def walk(items, ns, depth):
        for it in items:
            if isinstance(it, Group):
                if it.condition and str(sub(it.condition, cfg)).lower() != "true":
                    tree.append("  " * depth + f"group {sub(it.ns, cfg)} (skipped: condition false)"); continue
                g = (ns.rstrip("/") + "/" + sub(it.ns, cfg).strip("/")) if it.ns else ns
                tree.append("  " * depth + f"group namespace {g}"); walk(it.children, g, depth + 1)
            elif isinstance(it, NodeDesc):
                nns = sub(it.namespace, cfg) if it.namespace else ns or "/"
                fqn = (nns.rstrip("/") + "/" + it.name)
                params = {}
                for p in it.parameters:
                    if isinstance(p, str) and p == "params.yaml":
                        for pat, body in PARAMS_YAML.items():
                            if match(pat, fqn): params.update(body["ros__parameters"])
                    else: params.update({k: typed(v) for k, v in sub(p, cfg).items()})
                remap = {}
                for a, b in it.remappings:
                    full = lambda n: n if n.startswith("/") else nns.rstrip("/") + "/" + n
                    remap[full(sub(a, cfg))] = full(sub(b, cfg))
                nodes.append({"fqn": fqn, "params": params, "remap": remap})
                tree.append("  " * depth + f"node {it.package}/{it.executable} as {fqn}")
            elif isinstance(it, Arg):
                tree.append("  " * depth + f"arg {it.name} = {cfg[it.name]!r}")
    walk(description, "", 0)
    return {n["fqn"]: n for n in nodes}, tree

def description():
    return [
        Arg("robot", "robot1"), Arg("use_sim_time", "false"), Arg("with_logger", "true"),
        Group(Sub("robot"), [
            NodeDesc("my_robot", "driver", "driver", ["params.yaml"]),
            NodeDesc("my_robot", "controller", "controller", ["params.yaml", {"use_sim_time": Sub("use_sim_time")}],
                     remappings=[("cmd_vel", "base/cmd_vel")]),
        ]),
        Group("tools", [NodeDesc("my_robot", "logger", "logger", ["params.yaml", {"rate": 10.0}])], condition=Sub("with_logger")),
    ]

def test_default_launch():
    nodes, tree = launch(description()); print("\\n".join(tree))
    for f, n in nodes.items(): print(f"  {f}: {n['params']}" + (f" remap {n['remap']}" if n["remap"] else ""))
    c = nodes["/robot1/controller"]["params"]
    assert c == {"use_sim_time": False, "rate": 200.0, "kp": 2.5}          # specific file entry beats the wildcard
    assert nodes["/robot1/driver"]["params"]["port"] == "/dev/ttyUSB0" and nodes["/robot1/driver"]["params"]["rate"] == 50.0
    assert nodes["/tools/logger"]["params"] == {"use_sim_time": False, "rate": 10.0}   # the inline dict comes later and wins
    assert "port" not in nodes["/tools/logger"]["params"]                    # /*/driver does not match logger
    assert nodes["/robot1/controller"]["remap"] == {"/robot1/cmd_vel": "/robot1/base/cmd_vel"}

def test_command_line():
    nodes, _ = launch(description(), {"robot": "robot2", "use_sim_time": "true", "with_logger": "false"})
    print("with robot:=robot2 use_sim_time:=true with_logger:=false ->", sorted(nodes))
    assert sorted(nodes) == ["/robot2/controller", "/robot2/driver"]
    assert "kp" not in nodes["/robot2/controller"]["params"]                 # the YAML names robot1 explicitly: a classic bug
    assert nodes["/robot2/controller"]["params"]["use_sim_time"] is True

test_default_launch()
test_command_line()
print("PASS")`},{file:`bringup_ref.launch.py`,lang:`python`,src:`# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
# bringup.launch.py: the same description as the model above.
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, GroupAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, PushRosNamespace
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    robot = LaunchConfiguration('robot')
    params = PathJoinSubstitution([FindPackageShare('my_robot'), 'config', 'params.yaml'])
    return LaunchDescription([
        DeclareLaunchArgument('robot', default_value='robot1'),
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        DeclareLaunchArgument('with_logger', default_value='true'),
        GroupAction([
            PushRosNamespace(robot),
            Node(package='my_robot', executable='driver', name='driver', parameters=[params]),
            Node(package='my_robot', executable='controller', name='controller',
                 parameters=[params, {'use_sim_time': LaunchConfiguration('use_sim_time')}],
                 remappings=[('cmd_vel', 'base/cmd_vel')]),
        ]),
        GroupAction([
            PushRosNamespace('tools'),
            Node(package='my_robot', executable='logger', name='logger', parameters=[params, {'rate': 10.0}]),
        ], condition=IfCondition(LaunchConfiguration('with_logger'))),
    ])`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};