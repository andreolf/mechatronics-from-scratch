---
id: p13-l04
minutes: 35
summary: How well a loop tracks steps, ramps and parabolas in steady state depends on how many integrators its open-loop transfer function has, which is called the system type. You derive the position, velocity and acceleration error constants from the final value theorem, compute them for loops of type 0, 1 and 2, and test the predicted steady-state errors against long simulations of each closed loop.
---

## Final value theorem

For unity feedback, $E(s) = R(s)/(1 + L(s))$. If the closed loop is stable,

$$e_{ss} = \lim_{t\to\infty} e(t) = \lim_{s\to 0} sE(s) = \lim_{s\to 0}\frac{sR(s)}{1 + L(s)}.$$

## Error constants

Write $L(s) = \dfrac{K\prod(s + z_i)}{s^N\prod(s + p_j)}$. The number of free integrators $N$ is the **system type**.

| input | $R(s)$ | $e_{ss}$ | constant |
|---|---|---|---|
| step $1$ | $1/s$ | $1/(1 + K_p)$ | $K_p = \lim_{s\to0} L(s)$ |
| ramp $t$ | $1/s^2$ | $1/K_v$ | $K_v = \lim_{s\to0} sL(s)$ |
| parabola $t^2/2$ | $1/s^3$ | $1/K_a$ | $K_a = \lim_{s\to0} s^2L(s)$ |

Type 0 has finite $K_p$ and $K_v = 0$: a constant step error and an unbounded ramp error. Type 1 has $K_p = \infty$ (zero step error) and finite $K_v$. Type 2 tracks ramps exactly and has a constant parabola error. Each integrator buys one more order of input tracked exactly, and makes stability harder.

:::figure widget=sserror caption="Tracking error for a step, ramp or parabola with loops of type 0, 1 and 2. A finite error settles where the error constants predict; an error that keeps growing means the type is too low for that input."
:::end

## Worked example

1. Type 0: $L = \dfrac{10}{(s + 1)(s + 2)}$. $K_p = 10/2 = 5$, so the step error is $1/6 = 0.167$.
2. Type 1: $L = \dfrac{10}{s(s + 2)(s + 5)}$. $K_v = 10/10 = 1$, so the ramp error is 1.
3. Type 2: $L = \dfrac{10(s + 1)}{s^2(s + 5)}$. $K_a = 10/5 = 2$, so the parabola error is 0.5.
4. Check stability first: the type 1 loop has $s^3 + 7s^2 + 10s + 10$, Routh needs $70 > 10$. Fine. The type 2 loop has $s^3 + 5s^2 + 10s + 10$, needs $50 > 10$. Fine.

## Code it from scratch

:::code file=sserror.py
```python
import numpy as np
from scipy import signal

LOOPS = {   # name: (num, den) of L(s)
    "type 0": ([10], np.polymul([1, 1], [1, 2])),
    "type 1": ([10], np.polymul([1, 0], np.polymul([1, 2], [1, 5]))),
    "type 2": ([10, 10], np.polymul([1, 0, 0], [1, 5])),
}

def system_type(den):
    den = np.trim_zeros(np.array(den, float), "f")
    return len(den) - len(np.trim_zeros(den, "b"))

def error_constants(num, den):
    N = system_type(den)
    d = np.trim_zeros(np.array(den, float), "b")          # divide out s^N
    k0 = np.polyval(num, 0) / np.polyval(d, 0)
    consts = []
    for m in range(3):                                    # K_p, K_v, K_a = lim s^m L
        consts.append(np.inf if m < N else (k0 if m == N else 0.0))
    return N, consts

def predicted_errors(num, den):
    _, (Kp, Kv, Ka) = error_constants(num, den)
    inv = lambda K: 0.0 if np.isinf(K) else (np.inf if K == 0 else 1 / K)
    return [1 / (1 + Kp) if not np.isinf(Kp) else 0.0, inv(Kv), inv(Ka)]

def simulated_error(num, den, kind, T=80.0):
    cl_den = np.polyadd(den, num)
    assert np.all(np.roots(cl_den).real < 0)
    t = np.linspace(0, T, 40001)
    r = [np.ones_like(t), t, t ** 2 / 2][kind]
    E = signal.lti(den, cl_den)                         # E/R = 1/(1 + L) = den/(den + num)
    _, e, _ = signal.lsim(E, r, t)
    return e[-1], e[-4000]

def test_types_and_constants():
    assert [system_type(d) for _, d in LOOPS.values()] == [0, 1, 2]
    assert error_constants(*LOOPS["type 0"])[1][0] == 5
    assert error_constants(*LOOPS["type 1"])[1][1] == 1
    assert error_constants(*LOOPS["type 2"])[1][2] == 2

def test_matches_simulation():
    names = ["step", "ramp", "parabola"]
    for name, (num, den) in LOOPS.items():
        pred = predicted_errors(num, den)
        for kind in range(3):
            e_end, e_before = simulated_error(num, den, kind)
            if np.isinf(pred[kind]):
                assert e_end > e_before + 0.5                    # keeps growing
                desc = "grows without bound"
            else:
                assert abs(e_end - pred[kind]) < 1e-3, (name, kind, e_end, pred[kind])
                desc = f"{e_end:.4f} (predicted {pred[kind]:.4f})"
            print(f"{name}, {names[kind]:8s}: error {desc}")

test_types_and_constants()
test_matches_simulation()
print("PASS")
```
:::end

## Exercises

:::exercise
A position servo has $L(s) = \dfrac{50}{s(0.1s + 1)}$. What is the following error when the reference moves at 2 rad/s?
:::solution
Type 1 with $K_v = 50$ s⁻¹, so a unit ramp leaves an error of $1/50$ rad, and a 2 rad/s ramp leaves $2/50 = 0.04$ rad.
:::end

:::exercise
Why not simply add many integrators to track everything?
:::solution
Each integrator adds 90° of phase lag at all frequencies. Two pure integrators already sit at −180°, so a type 2 loop needs zeros (phase lead) to be stable at all, as the $(s + 1)$ in the worked example provides. Three or more get progressively harder to stabilise and respond with large overshoot.
:::end

## Quiz

:::quiz
- type: num
  q: Step error of the type 0 example?
  answer: 0.1667
  tol: 0.002
  py: "1/6"
  explain: 1/(1 + K_p) with K_p = 5.
- type: num
  q: Ramp error of the type 1 example?
  answer: 1
  tol: 0.001
  py: "1"
  explain: K_v = 10/(2·5).
- type: num
  q: Parabola error of the type 2 example?
  answer: 0.5
  tol: 0.001
  py: "5/10"
  explain: K_a = 10·1/5 = 2.
- type: num
  q: Following error in rad for a 2 rad/s ramp with K_v = 50 s⁻¹?
  answer: 0.04
  tol: 0.001
  unit: rad
  py: "2/50"
  explain: Ramp rate over K_v.
- type: mc
  q: A type 1 loop tracking a step has…
  options:
    - zero steady-state error
    - error 1/(1 + K_p)
    - an error that grows
    - error 1/K_v
  answer: 0
  explain: K_p is infinite.
- type: mc
  q: The final value theorem applies only if…
  options:
    - the closed loop is stable
    - the input is a step
    - the system is type 0
    - the plant has no zeros
  answer: 0
  explain: Otherwise there is no final value.
:::end
