var e=`p21-l10`,t=45,n=`Stringman can be driven from Python, from a raw telemetry stream, by an AI agent over MCP, or by a policy learned from your own teleoperation. You see what each interface is for, then build a behaviour-cloning toy that fails in exactly the way real imitation learning fails, and fix it two ways.`,r=`<h2 id="four-ways-in">Four ways in</h2>
<p>Stringman’s software gives you more entry points than most hobby robots, and the differences between them are a good map of robot software in general.</p>
<p><strong>A maneuver in Python.</strong> The <code>nf_robot</code> package that runs the controller can be imported into your own program. The central object is the <code>AsyncObserver</code>, which owns the connections to every component, the robot’s state, the calibration and the UI. You add a behaviour by writing a <code>Maneuver</code> class and registering it. The documentation’s first example nudges the gantry up 5 cm and back, and puts <code>slow_stop_all_spools()</code> in a <code>finally</code> block so that whatever goes wrong, the spools come to rest. A maneuver drives the robot only through the observer’s public methods.</p>
<p><strong>The telemetry stream.</strong> A separate program can connect to <code>ws://localhost:4245</code>, read <code>TelemetryBatchUpdate</code> messages and send <code>ControlBatchUpdate</code> messages, with controls for direct gantry velocity or for goal points in room space. This is the interface the browser UI and the LeRobot integration use.</p>
<p><strong>An agent over MCP.</strong> The firmware includes an MCP server that runs inside the observer, with a guide written for an AI agent. Its safety section reads like a checklist for any remote operator: move only with permission, <code>stop</code> always works, start with small nudges of at most 0.5 m, never weaken an over-tension monitor without the user’s say-so, and leave popups that ask about the physical world to the person. Its coordinate notes include the detail from Lesson 2: to put the gripper at a point, aim the gantry at the point plus the pole offset.</p>
<p><strong>A learned policy.</strong> A LeRobot process can run a trained model that consumes video and produces movements while an episode is active, and an agent can steer it with prompts such as “Pick up the orange pen”.</p>
<p>The pattern to copy is the layering. Fast safety loops live on the anchors (Lesson 9), motion primitives and calibration live in the observer, and everything clever, whether your script, an agent or a neural network, sits on top and can be stopped by one button.</p>
<h2 id="imitation-learning-in-one-paragraph">Imitation learning in one paragraph</h2>
<p>Drive the robot yourself while it records what it sees and what you commanded, then train a model to predict your commands from its observations. That is <em>behaviour cloning</em>. Neufangled’s guide recommends recording with swing cancellation on and running the trained policy with it on too, keeping episodes short and deliberate, turning on every light in the room, and starting with one object and the same motion every time: 50 episodes are enough for an ACT model as long as there is no extra variety in the data. Variety is added one degree at a time, with more data for each.</p>
<p>ACT, <em>Action Chunking with Transformers</em>, comes from a 2023 paper by Zhao, Kumar, Levine and Finn on low-cost bimanual manipulation. It predicts a sequence of future actions rather than one, and its paper reports 80 to 90 % success on six fine real-world tasks from about 10 minutes of demonstrations. The same paper names the problem that makes imitation learning hard: errors in the policy compound over time.</p>
<h2 id="why-clones-drift">Why clones drift</h2>
<p>Ross, Gordon and Bagnell put it precisely in the 2011 DAgger paper: in imitation learning, future observations depend on the policy’s own previous actions, which breaks the assumption that training and test data come from the same distribution. A clone trained only on an expert’s clean runs has never seen what to do after a mistake, so its first small error puts it somewhere new, where its next action is a guess.</p>
<p>The toy below shows it with nothing but a corridor. The gripper travels 4 m at 0.4 m/s between obstacles 15 cm either side of its path, with a random 1.5 cm sideways disturbance every 0.1 s. The expert steers back to the centre line. Fifty clean expert runs never leave the centre, so every recorded state has a correction of zero, and the clone learns to do nothing. The clone is then just a random walk: after 100 steps its spread is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.04em;vertical-align:-0.1328em;"></span><span class="mord">1.5</span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.9072em;"><span class="svg-align" style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord" style="padding-left:0.833em;"><span class="mord">100</span></span></span><span style="top:-2.8672em;"><span class="pstrut" style="height:3em;"></span><span class="hide-tail" style="min-width:0.853em;height:1.08em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"><path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.1328em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">15</span></span></span></span> cm, the whole half-width, and in the simulation only 36 % of its runs stay in the corridor.</p>
<p>Two fixes, both from the literature and both simple:</p>
<ul>
<li><strong>Disturb the demonstrations.</strong> DART (Laskey and colleagues, 2017) injects noise into the expert’s own runs, which “forces the supervisor to demonstrate how to recover from errors”. With 1.5 cm of disturbance during the demos the clone stays in the corridor every time.</li>
<li><strong>Ask the expert about the learner’s mistakes.</strong> DAgger runs the clone, has the expert label the states the clone actually reached, adds them to the data and retrains. Two rounds of five runs are enough here.</li>
</ul>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="bc" data-args="{}"></div></div><figcaption>Behaviour cloning in a corridor. With clean demonstrations the clone has never seen a correction. Add disturbance to the demonstrations, or a DAgger round, and watch the runs stay inside.</figcaption></figure>
<p>On a real robot, both fixes cost something. Disturbing your own demonstrations means recording some deliberate mistakes and their recoveries, which is exactly what “keep your motions deliberate and clean” warns against if overdone. DAgger needs a person ready to take over mid-run and say what they would have done. Most practical datasets end up with a little of each: a few episodes that start from awkward positions, and corrective episodes recorded after watching the policy fail.</p>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">behaviour_cloning.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

V, DT, STEPS, WALL = <span class="hljs-number">0.4</span>, <span class="hljs-number">0.1</span>, <span class="hljs-number">100</span>, <span class="hljs-number">0.15</span>            <span class="hljs-comment"># 4 m at 0.4 m/s between obstacles 15 cm either side</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">expert</span>(<span class="hljs-params">y</span>):
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(np.clip(-<span class="hljs-number">2.0</span> * y, -<span class="hljs-number">0.4</span>, <span class="hljs-number">0.4</span>))         <span class="hljs-comment"># steer back to the centre line</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">knn_policy</span>(<span class="hljs-params">Y, A, k=<span class="hljs-number">5</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;average action of the k recorded states nearest to y&quot;&quot;&quot;</span>
    order = np.argsort(Y)
    Y, A = np.asarray(Y)[order], np.asarray(A)[order]
    <span class="hljs-keyword">def</span> <span class="hljs-title function_">act</span>(<span class="hljs-params">y</span>):
        i = np.searchsorted(Y, y)
        lo, hi = <span class="hljs-built_in">max</span>(<span class="hljs-number">0</span>, i - k), <span class="hljs-built_in">min</span>(<span class="hljs-built_in">len</span>(Y), i + k)
        near = lo + np.argsort(np.<span class="hljs-built_in">abs</span>(Y[lo:hi] - y))[:k]
        <span class="hljs-keyword">return</span> <span class="hljs-built_in">float</span>(A[near].mean())
    <span class="hljs-keyword">return</span> act

<span class="hljs-keyword">def</span> <span class="hljs-title function_">rollout</span>(<span class="hljs-params">policy, rng, noise, label=<span class="hljs-literal">None</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;drive the corridor with policy; noise is the random sideways disturbance per step (m)&quot;&quot;&quot;</span>
    y, ys = <span class="hljs-number">0.0</span>, [<span class="hljs-number">0.0</span>]
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(STEPS):
        <span class="hljs-keyword">if</span> label <span class="hljs-keyword">is</span> <span class="hljs-keyword">not</span> <span class="hljs-literal">None</span>:
            label.append((y, expert(y)))               <span class="hljs-comment"># DAgger: the expert labels the state the learner reached</span>
        y += policy(y) * DT + rng.normal(<span class="hljs-number">0</span>, noise)
        ys.append(y)
    <span class="hljs-keyword">return</span> np.array(ys)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">train</span>(<span class="hljs-params">n_demos, demo_noise, dagger_rounds, noise, rng</span>):
    data = []
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(n_demos):                            <span class="hljs-comment"># demonstrations by the expert, optionally disturbed (DART)</span>
        y = <span class="hljs-number">0.0</span>
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(STEPS):
            data.append((y, expert(y)))
            y += expert(y) * DT + rng.normal(<span class="hljs-number">0</span>, demo_noise)
    <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(dagger_rounds):
        pol = knn_policy(*<span class="hljs-built_in">zip</span>(*data))
        <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">5</span>):
            rollout(pol, rng, noise, label=data)
    <span class="hljs-keyword">return</span> knn_policy(*<span class="hljs-built_in">zip</span>(*data))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">success</span>(<span class="hljs-params">policy, rng, noise, trials=<span class="hljs-number">200</span></span>):
    <span class="hljs-keyword">return</span> np.mean([np.<span class="hljs-built_in">abs</span>(rollout(policy, rng, noise)).<span class="hljs-built_in">max</span>() &lt; WALL <span class="hljs-keyword">for</span> _ <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(trials)])

rng = np.random.default_rng(<span class="hljs-number">3</span>)
noise = <span class="hljs-number">0.015</span>
results = {
    <span class="hljs-string">&quot;expert itself&quot;</span>: success(expert, rng, noise),
    <span class="hljs-string">&quot;cloned from 50 clean demos&quot;</span>: success(train(<span class="hljs-number">50</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">0</span>, noise, rng), rng, noise),
    <span class="hljs-string">&quot;cloned from 50 disturbed demos (DART)&quot;</span>: success(train(<span class="hljs-number">50</span>, <span class="hljs-number">0.015</span>, <span class="hljs-number">0</span>, noise, rng), rng, noise),
    <span class="hljs-string">&quot;50 clean demos + 2 DAgger rounds&quot;</span>: success(train(<span class="hljs-number">50</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">2</span>, noise, rng), rng, noise),
}
<span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> results.items():
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{k:40s}</span> <span class="hljs-subst">{v*<span class="hljs-number">100</span>:<span class="hljs-number">5.1</span>f}</span> % of runs stay in the corridor&quot;</span>)

<span class="hljs-keyword">assert</span> results[<span class="hljs-string">&quot;expert itself&quot;</span>] == <span class="hljs-number">1.0</span>
<span class="hljs-keyword">assert</span> results[<span class="hljs-string">&quot;cloned from 50 clean demos&quot;</span>] &lt; <span class="hljs-number">0.6</span>          <span class="hljs-comment"># the clone never saw a mistake, so it never learned to fix one</span>
<span class="hljs-keyword">assert</span> results[<span class="hljs-string">&quot;cloned from 50 disturbed demos (DART)&quot;</span>] &gt; <span class="hljs-number">0.95</span>
<span class="hljs-keyword">assert</span> results[<span class="hljs-string">&quot;50 clean demos + 2 DAgger rounds&quot;</span>] &gt; <span class="hljs-number">0.95</span>
<span class="hljs-comment"># with clean demos every recorded state is on the centre line, and the clone&#x27;s correction is zero everywhere</span>
clean = train(<span class="hljs-number">50</span>, <span class="hljs-number">0.0</span>, <span class="hljs-number">0</span>, noise, np.random.default_rng(<span class="hljs-number">0</span>))
<span class="hljs-keyword">assert</span> clean(<span class="hljs-number">0.1</span>) == <span class="hljs-number">0.0</span> <span class="hljs-keyword">and</span> expert(<span class="hljs-number">0.1</span>) == -<span class="hljs-number">0.2</span>
<span class="hljs-comment"># so the clone is a random walk: after 100 steps of 1.5 cm the spread is 15 cm, the width of half the corridor</span>
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(noise * np.sqrt(STEPS) - WALL) &lt; <span class="hljs-number">1e-12</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="in-practice">In practice</h2>
<p>Neufangled’s guide is specific about the computer, and for good reason. Recording should not drop below 30 fps; it recommends 16 or more CPU cores for recording, warns that at 100 % CPU the data will likely contain time distortion that degrades the trained model, and suggests something like an RTX 3090 or better for running policies. Time distortion is the corridor problem in another form: if frames and commands drift apart in time, the model learns actions for the wrong observations. Log and check the timestamps in your dataset before you spend a night training on it.</p>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Why does the clone trained on clean demonstrations predict zero correction even at a state 10 cm off the centre line?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Every state in its training data is on the centre line, where the expert’s correction is zero. A nearest-neighbour model can only return actions it has seen, so at 10 cm it returns the zero correction of its nearest recorded states, while the expert would have commanded −0.2 m/s.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Neufangled says 50 episodes are enough for ACT “as long as there is no extra variety in the data”. How would you extend a dataset for grasping one cup to grasping it in any orientation?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Add one degree of variety at a time: first record episodes with the cup in a few orientations, train, and check the policy still works on the old cases, then add the next variable. Record more episodes for each degree added, and include some that start from awkward or slightly wrong positions so the policy sees recoveries.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p21-l10"></div>

<h2 id="sources">Sources</h2>
<ul>
<li>Neufangled, <a href="https://neufangled.com/docs/python_api/">Python API</a> (AsyncObserver, maneuvers, the hello example), <a href="https://neufangled.com/docs/usage_guide/">usage guide</a> (telemetry stream at <code>ws://localhost:4245</code>, TelemetryBatchUpdate and ControlBatchUpdate, LeRobot models with prompts), <a href="https://neufangled.com/docs/imitation_learning/">imitation learning guide</a> (swing cancellation on, 50 episodes for ACT, variety one degree at a time, 30 fps, 16 cores, time distortion, RTX 3090).</li>
<li>Stringman firmware, Apache-2.0: <a href="https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/mcp_bridge/GUIDE.md">MCP agent guide</a> at commit e1ee31d.</li>
<li>Hugging Face, <a href="https://github.com/huggingface/lerobot">LeRobot</a>, Apache-2.0.</li>
<li>T. Z. Zhao, V. Kumar, S. Levine and C. Finn, <a href="https://arxiv.org/abs/2304.13705">“Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware”</a>, 2023 (ACT).</li>
<li>S. Ross, G. Gordon and D. Bagnell, <a href="https://proceedings.mlr.press/v15/ross11a.html">“A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning”</a>, AISTATS 2011 (DAgger).</li>
<li>M. Laskey, J. Lee, R. Fox, A. Dragan and K. Goldberg, <a href="https://arxiv.org/abs/1703.09327">“DART: Noise Injection for Robust Imitation Learning”</a>, 2017.</li>
</ul>
`,i=[{id:`four-ways-in`,title:`Four ways in`},{id:`imitation-learning-in-one-paragraph`,title:`Imitation learning in one paragraph`},{id:`why-clones-drift`,title:`Why clones drift`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`in-practice`,title:`In practice`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`},{id:`sources`,title:`Sources`}],a=[{id:`p21-l10-q1`,type:`mc`,q:`<p>What breaks the usual i.i.d. assumption in imitation learning?</p>
`,explain:`<p>The clone’s mistakes take it to states the expert never visited.</p>
`,options:[`The images are too large`,`The robot has four motors`,`Future observations depend on the policy’s own previous actions`,`The dataset is public`],answer:2},{id:`p21-l10-q2`,type:`num`,q:`<p>Spread after 100 steps of a random walk with 1.5 cm steps (cm)?</p>
`,explain:`<p>σ √n.</p>
`,answer:15,tol:.001,unit:``},{id:`p21-l10-q3`,type:`mc`,q:`<p>What does DART change about the demonstrations?</p>
`,explain:`<p>The expert has to correct the injected errors.</p>
`,options:[`It injects noise while the expert demonstrates, so the data show recoveries`,`It removes noisy demonstrations`,`It records at a higher frame rate`,`It uses a different robot`],answer:0},{id:`p21-l10-q4`,type:`mc`,q:`<p>Which Stringman interface should a new autonomous behaviour written in Python use?</p>
`,explain:`<p>The observer owns connections, state and motion primitives.</p>
`,options:[`A Maneuver registered with the AsyncObserver`,`Raw CAN messages to the motors`,`Writing to configuration.json`,`SSH into an anchor`],answer:0},{id:`p21-l10-q5`,type:`mc`,q:`<p>What does Neufangled recommend about swing cancellation when recording datasets?</p>
`,explain:`<p>The policy learns what it sees; keep the same conditions.</p>
`,options:[`Turn it off for recording`,`It does not matter`,`Record and evaluate with it on`,`Only use it for evaluation`],answer:2},{id:`p21-l10-q6`,type:`mc`,q:`<p>Why can time distortion in a dataset hurt the trained policy?</p>
`,explain:`<p>The observation-action pairing is what the model learns.</p>
`,options:[`It changes the camera colours`,`It makes the files bigger`,`Frames and commands drift apart, so the model learns actions for the wrong observations`,`It slows down training only`],answer:2}],o=[{file:`behaviour_cloning.py`,lang:`python`,src:`import numpy as np

V, DT, STEPS, WALL = 0.4, 0.1, 100, 0.15            # 4 m at 0.4 m/s between obstacles 15 cm either side

def expert(y):
    return float(np.clip(-2.0 * y, -0.4, 0.4))         # steer back to the centre line

def knn_policy(Y, A, k=5):
    """average action of the k recorded states nearest to y"""
    order = np.argsort(Y)
    Y, A = np.asarray(Y)[order], np.asarray(A)[order]
    def act(y):
        i = np.searchsorted(Y, y)
        lo, hi = max(0, i - k), min(len(Y), i + k)
        near = lo + np.argsort(np.abs(Y[lo:hi] - y))[:k]
        return float(A[near].mean())
    return act

def rollout(policy, rng, noise, label=None):
    """drive the corridor with policy; noise is the random sideways disturbance per step (m)"""
    y, ys = 0.0, [0.0]
    for _ in range(STEPS):
        if label is not None:
            label.append((y, expert(y)))               # DAgger: the expert labels the state the learner reached
        y += policy(y) * DT + rng.normal(0, noise)
        ys.append(y)
    return np.array(ys)

def train(n_demos, demo_noise, dagger_rounds, noise, rng):
    data = []
    for _ in range(n_demos):                            # demonstrations by the expert, optionally disturbed (DART)
        y = 0.0
        for _ in range(STEPS):
            data.append((y, expert(y)))
            y += expert(y) * DT + rng.normal(0, demo_noise)
    for _ in range(dagger_rounds):
        pol = knn_policy(*zip(*data))
        for _ in range(5):
            rollout(pol, rng, noise, label=data)
    return knn_policy(*zip(*data))

def success(policy, rng, noise, trials=200):
    return np.mean([np.abs(rollout(policy, rng, noise)).max() < WALL for _ in range(trials)])

rng = np.random.default_rng(3)
noise = 0.015
results = {
    "expert itself": success(expert, rng, noise),
    "cloned from 50 clean demos": success(train(50, 0.0, 0, noise, rng), rng, noise),
    "cloned from 50 disturbed demos (DART)": success(train(50, 0.015, 0, noise, rng), rng, noise),
    "50 clean demos + 2 DAgger rounds": success(train(50, 0.0, 2, noise, rng), rng, noise),
}
for k, v in results.items():
    print(f"{k:40s} {v*100:5.1f} % of runs stay in the corridor")

assert results["expert itself"] == 1.0
assert results["cloned from 50 clean demos"] < 0.6          # the clone never saw a mistake, so it never learned to fix one
assert results["cloned from 50 disturbed demos (DART)"] > 0.95
assert results["50 clean demos + 2 DAgger rounds"] > 0.95
# with clean demos every recorded state is on the centre line, and the clone's correction is zero everywhere
clean = train(50, 0.0, 0, noise, np.random.default_rng(0))
assert clean(0.1) == 0.0 and expert(0.1) == -0.2
# so the clone is a random walk: after 100 steps of 1.5 cm the spread is 15 cm, the width of half the corridor
assert abs(noise * np.sqrt(STEPS) - WALL) < 1e-12
print("PASS")`}],s={id:e,minutes:45,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};