---
id: p21-l10
minutes: 45
summary: Stringman can be driven from Python, from a raw telemetry stream, by an AI agent over MCP, or by a policy learned from your own teleoperation. You see what each interface is for, then build a behaviour-cloning toy that fails in exactly the way real imitation learning fails, and fix it two ways.
---

## Four ways in

Stringman's software gives you more entry points than most hobby robots, and the differences between them are a good map of robot software in general.

**A maneuver in Python.** The `nf_robot` package that runs the controller can be imported into your own program. The central object is the `AsyncObserver`, which owns the connections to every component, the robot's state, the calibration and the UI. You add a behaviour by writing a `Maneuver` class and registering it. The documentation's first example nudges the gantry up 5 cm and back, and puts `slow_stop_all_spools()` in a `finally` block so that whatever goes wrong, the spools come to rest. A maneuver drives the robot only through the observer's public methods.

**The telemetry stream.** A separate program can connect to `ws://localhost:4245`, read `TelemetryBatchUpdate` messages and send `ControlBatchUpdate` messages, with controls for direct gantry velocity or for goal points in room space. This is the interface the browser UI and the LeRobot integration use.

**An agent over MCP.** The firmware includes an MCP server that runs inside the observer, with a guide written for an AI agent. Its safety section reads like a checklist for any remote operator: move only with permission, `stop` always works, start with small nudges of at most 0.5 m, never weaken an over-tension monitor without the user's say-so, and leave popups that ask about the physical world to the person. Its coordinate notes include the detail from Lesson 2: to put the gripper at a point, aim the gantry at the point plus the pole offset.

**A learned policy.** A LeRobot process can run a trained model that consumes video and produces movements while an episode is active, and an agent can steer it with prompts such as "Pick up the orange pen".

The pattern to copy is the layering. Fast safety loops live on the anchors (Lesson 9), motion primitives and calibration live in the observer, and everything clever, whether your script, an agent or a neural network, sits on top and can be stopped by one button.

## Imitation learning in one paragraph

Drive the robot yourself while it records what it sees and what you commanded, then train a model to predict your commands from its observations. That is *behaviour cloning*. Neufangled's guide recommends recording with swing cancellation on and running the trained policy with it on too, keeping episodes short and deliberate, turning on every light in the room, and starting with one object and the same motion every time: 50 episodes are enough for an ACT model as long as there is no extra variety in the data. Variety is added one degree at a time, with more data for each.

ACT, *Action Chunking with Transformers*, comes from a 2023 paper by Zhao, Kumar, Levine and Finn on low-cost bimanual manipulation. It predicts a sequence of future actions rather than one, and its paper reports 80 to 90 % success on six fine real-world tasks from about 10 minutes of demonstrations. The same paper names the problem that makes imitation learning hard: errors in the policy compound over time.

## Why clones drift

Ross, Gordon and Bagnell put it precisely in the 2011 DAgger paper: in imitation learning, future observations depend on the policy's own previous actions, which breaks the assumption that training and test data come from the same distribution. A clone trained only on an expert's clean runs has never seen what to do after a mistake, so its first small error puts it somewhere new, where its next action is a guess.

The toy below shows it with nothing but a corridor. The gripper travels 4 m at 0.4 m/s between obstacles 15 cm either side of its path, with a random 1.5 cm sideways disturbance every 0.1 s. The expert steers back to the centre line. Fifty clean expert runs never leave the centre, so every recorded state has a correction of zero, and the clone learns to do nothing. The clone is then just a random walk: after 100 steps its spread is $1.5\sqrt{100} = 15$ cm, the whole half-width, and in the simulation only 36 % of its runs stay in the corridor.

Two fixes, both from the literature and both simple:

- **Disturb the demonstrations.** DART (Laskey and colleagues, 2017) injects noise into the expert's own runs, which "forces the supervisor to demonstrate how to recover from errors". With 1.5 cm of disturbance during the demos the clone stays in the corridor every time.
- **Ask the expert about the learner's mistakes.** DAgger runs the clone, has the expert label the states the clone actually reached, adds them to the data and retrains. Two rounds of five runs are enough here.

:::figure widget=bc caption="Behaviour cloning in a corridor. With clean demonstrations the clone has never seen a correction. Add disturbance to the demonstrations, or a DAgger round, and watch the runs stay inside."
:::end

On a real robot, both fixes cost something. Disturbing your own demonstrations means recording some deliberate mistakes and their recoveries, which is exactly what "keep your motions deliberate and clean" warns against if overdone. DAgger needs a person ready to take over mid-run and say what they would have done. Most practical datasets end up with a little of each: a few episodes that start from awkward positions, and corrective episodes recorded after watching the policy fail.

## Code it from scratch

:::code file=behaviour_cloning.py
```python
import numpy as np

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
print("PASS")
```
:::end

## In practice

Neufangled's guide is specific about the computer, and for good reason. Recording should not drop below 30 fps; it recommends 16 or more CPU cores for recording, warns that at 100 % CPU the data will likely contain time distortion that degrades the trained model, and suggests something like an RTX 3090 or better for running policies. Time distortion is the corridor problem in another form: if frames and commands drift apart in time, the model learns actions for the wrong observations. Log and check the timestamps in your dataset before you spend a night training on it.

## Exercises

:::exercise
Why does the clone trained on clean demonstrations predict zero correction even at a state 10 cm off the centre line?
:::solution
Every state in its training data is on the centre line, where the expert's correction is zero. A nearest-neighbour model can only return actions it has seen, so at 10 cm it returns the zero correction of its nearest recorded states, while the expert would have commanded −0.2 m/s.
:::end

:::exercise
Neufangled says 50 episodes are enough for ACT "as long as there is no extra variety in the data". How would you extend a dataset for grasping one cup to grasping it in any orientation?
:::solution
Add one degree of variety at a time: first record episodes with the cup in a few orientations, train, and check the policy still works on the old cases, then add the next variable. Record more episodes for each degree added, and include some that start from awkward or slightly wrong positions so the policy sees recoveries.
:::end

## Quiz

:::quiz
- type: mc
  q: What breaks the usual i.i.d. assumption in imitation learning?
  options: ["Future observations depend on the policy's own previous actions", "The images are too large", "The dataset is public", "The robot has four motors"]
  answer: 0
  explain: The clone's mistakes take it to states the expert never visited.
- type: num
  q: Spread after 100 steps of a random walk with 1.5 cm steps (cm)?
  answer: 15
  tol: 0.001
  py: "1.5*math.sqrt(100)"
  explain: σ √n.
- type: mc
  q: What does DART change about the demonstrations?
  options: ["It injects noise while the expert demonstrates, so the data show recoveries", "It removes noisy demonstrations", "It records at a higher frame rate", "It uses a different robot"]
  answer: 0
  explain: The expert has to correct the injected errors.
- type: mc
  q: Which Stringman interface should a new autonomous behaviour written in Python use?
  options: ["A Maneuver registered with the AsyncObserver", "Raw CAN messages to the motors", "Writing to configuration.json", "SSH into an anchor"]
  answer: 0
  explain: The observer owns connections, state and motion primitives.
- type: mc
  q: What does Neufangled recommend about swing cancellation when recording datasets?
  options: ["Record and evaluate with it on", "Turn it off for recording", "Only use it for evaluation", "It does not matter"]
  answer: 0
  explain: The policy learns what it sees; keep the same conditions.
- type: mc
  q: Why can time distortion in a dataset hurt the trained policy?
  options: ["Frames and commands drift apart, so the model learns actions for the wrong observations", "It makes the files bigger", "It changes the camera colours", "It slows down training only"]
  answer: 0
  explain: The observation-action pairing is what the model learns.
:::end

:::verify
import math
assert abs(1.5*math.sqrt(100)-15) < 1e-12 and abs(4/0.4-10) < 1e-12 and abs(10/0.1-100) < 1e-12 and -2*0.1 == -0.2
:::end

## Sources

- Neufangled, [Python API](https://neufangled.com/docs/python_api/) (AsyncObserver, maneuvers, the hello example), [usage guide](https://neufangled.com/docs/usage_guide/) (telemetry stream at `ws://localhost:4245`, TelemetryBatchUpdate and ControlBatchUpdate, LeRobot models with prompts), [imitation learning guide](https://neufangled.com/docs/imitation_learning/) (swing cancellation on, 50 episodes for ACT, variety one degree at a time, 30 fps, 16 cores, time distortion, RTX 3090).
- Stringman firmware, Apache-2.0: [MCP agent guide](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/mcp_bridge/GUIDE.md) at commit e1ee31d.
- Hugging Face, [LeRobot](https://github.com/huggingface/lerobot), Apache-2.0.
- T. Z. Zhao, V. Kumar, S. Levine and C. Finn, ["Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware"](https://arxiv.org/abs/2304.13705), 2023 (ACT).
- S. Ross, G. Gordon and D. Bagnell, ["A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning"](https://proceedings.mlr.press/v15/ross11a.html), AISTATS 2011 (DAgger).
- M. Laskey, J. Lee, R. Fox, A. Dragan and K. Goldberg, ["DART: Noise Injection for Robust Imitation Learning"](https://arxiv.org/abs/1703.09327), 2017.
