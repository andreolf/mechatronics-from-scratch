---
id: p06-l08
minutes: 40
summary: Sequences with rules (open, wait, close, stop if something's in the way) are state machines. You compare Moore and Mealy machines, write a table-driven controller for a lift gate with timeouts, and check exhaustively that no input sequence can drive the gate down onto an obstacle, then watch the checker catch a subtle bug.
---

## States, inputs and transitions

A **finite state machine** (FSM) has a finite set of states, a transition function (current state + input → next state), and outputs.

- **Moore machine**: outputs depend only on the state ("in CLOSING, the motor runs down"). Outputs change only after a clock edge, so they're glitch-free.
- **Mealy machine**: outputs depend on the state *and* the inputs. It can react one cycle sooner, but input glitches pass straight to the outputs.

In hardware, the state lives in flip-flops (lesson 7) and the transition function is combinational logic. In firmware it's a variable plus a `switch` statement or a **transition table**. Tables are easy to review, test and draw, which matters for anything safety-related.

**Encoding.** Binary encoding uses $\lceil\log_2 N\rceil$ flip-flops. **One-hot** encoding uses one flip-flop per state, which gives faster, simpler logic in FPGAs, and an illegal state (two bits set) is easy to detect.

**Timeouts.** Real machines need "if the gate hasn't reached the limit switch within 10 s, stop": a counter that runs while in a state and creates a `timeout` event when it expires. Without it, a broken limit switch leaves the motor running forever.

## Checking it exhaustively

The state space of a small controller is tiny, so you can *prove* properties rather than test a few cases: explore every reachable combination of controller state and environment (here, whether an obstacle is present) under every possible input, using breadth-first search. That's **model checking** in miniature.

:::figure widget=fsm caption="The lift-gate controller. Tap events to drive it; the active state is highlighted. An obstacle while closing always reverses the gate."
:::end

## Worked example

States: CLOSED, OPENING, OPEN, CLOSING, FAULT. The safety property: *the gate never moves down while an obstacle is present.*

1. A naive table says: in OPEN, a `close` command or the auto-close `timer` goes to CLOSING. In CLOSING, an `obstacle_on` event reverses to OPENING.
2. The model checker explores (state, obstacle) pairs. It finds the path CLOSED → `open` → OPENING → `limit_open` → OPEN → `obstacle_on` → OPEN → `close` → CLOSING with the obstacle still there. The reversal never fires, because the obstacle arrived *before* closing began, so there's no `obstacle_on` event in CLOSING. Unsafe!
3. Fix: guard the transition, so `timer` closes only if no obstacle is present, and `close` likewise.
4. The checker now reaches 9 of the 10 (state, obstacle) combinations under every event, and the one it can't reach is exactly the unsafe pair (CLOSING, obstacle present). A test suite of hand-written sequences could easily have missed step 2.

## Code it from scratch

:::code file=gate_fsm.py
```python
from collections import deque

EVENTS = ["open", "close", "limit_open", "limit_closed", "obstacle_on", "obstacle_off", "timer", "timeout"]

def step(state, obstacle, ev, guarded=True):
    """Returns the next (state, obstacle). The environment can toggle the obstacle at any time."""
    if ev in ("obstacle_on", "obstacle_off"):
        obstacle = ev == "obstacle_on"
    table = {
        "CLOSED": {"open": "OPENING"},
        "OPENING": {"limit_open": "OPEN", "timeout": "FAULT"},
        "OPEN": {"close": "CLOSING", "timer": "CLOSING"},
        "CLOSING": {"limit_closed": "CLOSED", "obstacle_on": "OPENING", "timeout": "FAULT"},
        "FAULT": {"reset": "CLOSED"},
    }
    nxt = table[state].get(ev, state)
    if guarded and state == "OPEN" and nxt == "CLOSING" and obstacle:
        nxt = "OPEN"                                       # the guard: never start closing onto an obstacle
    return nxt, obstacle

def motor(state):
    return {"OPENING": "up", "CLOSING": "down"}.get(state, "off")       # Moore output

def explore(guarded):
    """Breadth-first search over every reachable (state, obstacle) pair; keeps the shortest path to each."""
    start = ("CLOSED", False)
    seen, q = {start: []}, deque([start])
    while q:
        s = q.popleft()
        for ev in EVENTS + ["reset"]:
            n = step(*s, ev, guarded)
            if n not in seen:
                seen[n] = seen[s] + [ev]
                q.append(n)
    bad = {s: p for s, p in seen.items() if motor(s[0]) == "down" and s[1]}
    return seen, bad

if __name__ == "__main__":
    seen, bad = explore(guarded=False)
    path = next(iter(bad.values()))
    print("naive table: unsafe state reached via", path)
    assert bad and path[:3] == ["open", "limit_open", "obstacle_on"] and path[3] in ("close", "timer")
    seen, bad = explore(guarded=True)
    print(f"guarded controller: {len(seen)} of 10 (state, obstacle) pairs reachable, unsafe: {len(bad)}")
    assert len(seen) == 9 and not bad and ("CLOSING", True) not in seen
```
:::end

## Exercises

:::exercise
How many flip-flops does the 5-state gate controller need with binary encoding, and with one-hot?
:::solution
Binary: $\lceil\log_2 5\rceil = 3$. One-hot: 5.
:::end

:::exercise
Is the gate controller in the code a Moore or a Mealy machine? What would change if the motor output also depended on the obstacle input directly?
:::solution
Moore: `motor()` reads only the state. Making it $\text{down} = (\text{CLOSING}) \wedge \neg\text{obstacle}$ would make it Mealy. It reacts within the same cycle, which is arguably safer here, but a glitch on the obstacle input would then reach the motor driver.
:::end

## Quiz

:::quiz
- type: mc
  q: In a Moore machine, outputs depend on…
  options:
    - the state only
    - the state and the current inputs
    - the inputs only
    - the clock frequency
  answer: 0
  explain: Mealy outputs also depend on inputs.
- type: num
  q: Flip-flops needed for 5 states with binary encoding?
  answer: 3
  tol: 0.001
  py: "math.ceil(math.log2(5))"
  explain: $\lceil\log_2 5\rceil$.
- type: num
  q: How many (state, obstacle) pairs does the guarded controller actually reach?
  answer: 9
  tol: 0.001
  py: "5*2-1"
  explain: All but (CLOSING, obstacle present).
- type: mc
  q: A timeout transition protects against…
  options:
    - a slow clock
    - a failed sensor leaving the machine waiting forever
    - glitches
    - too many states
  answer: 1
  explain: E.g. a broken limit switch.
- type: mc
  q: Exhaustive exploration of reachable states proves a property because…
  options:
    - it tests random inputs
    - it visits every state any input sequence can reach
    - it uses one-hot encoding
    - it runs on hardware
  answer: 1
  explain: For a finite machine the reachable set is finite and fully enumerated.
- type: num
  q: Flip-flops needed for 5 states with one-hot encoding?
  answer: 5
  tol: 0.001
  py: "5"
  explain: One per state.
:::end

:::verify
import math
assert math.ceil(math.log2(5)) == 3
:::end
