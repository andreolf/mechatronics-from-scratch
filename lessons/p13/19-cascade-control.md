---
id: p13-l19
minutes: 40
summary: A motor servo is three loops nested inside each other, current inside speed inside position, each one roughly ten times slower than the loop it wraps. You design all three by pole cancellation and bandwidth targets, check the measured bandwidths against the design, and test that the position loop is stable with clean steps while squeezing the separation makes it ring.
---

## Loops inside loops

A single PID from position error straight to motor voltage has to fight the electrical time constant, the inertia and the load all at once. A **cascade** splits the job:

- the **current loop** (innermost, fastest) makes the winding current follow a current command, so torque $\tau = k_t i$ is under direct control;
- the **speed loop** commands current to make speed follow a speed command;
- the **position loop** (outermost, slowest) commands speed.

Each inner loop, closed, looks to the loop outside it like a fast, nearly ideal actuator. The rule of thumb is a **bandwidth separation of 5–10×** per level:

$$\omega_i \approx 10\,\omega_s, \qquad \omega_s \approx 10\,\omega_p.$$

Cascades also give natural places for limits: clamp the current command to protect the motor and driver, and the speed command to respect the mechanics.

## Designing each loop

The DC motor from [the motor model lesson](#lab-motor): $L\,\dot i = V - Ri - k\omega$, $J\dot\omega = k i - b\omega$.

**Current loop.** PI with $K_{p,i} = L\omega_i$ and $K_{i,i} = R\omega_i$ puts the PI zero on the electrical pole $R/L$ and cancels it, leaving

$$\frac{i}{i_r} = \frac{\omega_i}{s + \omega_i}.$$

**Speed loop.** With the current loop treated as ideal, the plant is $k/(Js)$. A gain $K_{p,s} = J\omega_s/k$ gives crossover at $\omega_s$; add an integral zero a factor 5 below, $K_{i,s} = K_{p,s}\,\omega_s/5$, to reject load torque.

**Position loop.** Speed integrates to position, so the plant seen from the speed command is $\approx 1/s$ and a pure gain $K_{p,p} = \omega_p$ sets the bandwidth. No integral needed: the speed loop already removes load offsets.

:::figure widget=cascade caption="A position step through the three nested loops: the current spikes and settles first, speed follows, position arrives last. Shrink the bandwidth separation and the loops start fighting each other; the position overshoots and rings."
:::end

## Worked example

Illustrative motor: $R = 1.2$ Ω, $L = 2$ mH, $k = 0.05$ N·m/A, $J = 2\times10^{-4}$ kg·m², $b = 2\times10^{-5}$ N·m·s. Targets $\omega_i = 3000$, $\omega_s = 300$, $\omega_p = 30$ rad/s.

1. Current PI: $K_{p,i} = 0.002 \times 3000 = 6$ V/A, $K_{i,i} = 1.2 \times 3000 = 3600$ V/(A·s).
2. Speed PI: $K_{p,s} = 2\times10^{-4}\times 300/0.05 = 1.2$ A per rad/s, $K_{i,s} = 1.2 \times 60 = 72$ A per rad.
3. Position P: $K_{p,p} = 30$ (rad/s) per rad.

The closed-loop bandwidths come out near 3000, 400 and 32 rad/s. The speed loop lands about 30 % above target because its PI zero adds lead; that's normal and the separation is still ample.

## Code it from scratch

:::code file=cascade.py
```python
import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5

def design(wi, ws, wp):
    Kps = J * ws / k
    return dict(Kpi=L * wi, Kii=R * wi, Kps=Kps, Kis=Kps * ws / 5, Kpp=wp)

def linearise(f, n):
    A = np.column_stack([f(e, 0.0) for e in np.eye(n)])  # the loops are linear, so columns are exact
    return A, f(np.zeros(n), 1.0)

def full_loop(g):                 # x = [i, w, th, Ii, Is], input th_ref
    def f(x, r):
        i, w, th, Ii, Is = x
        es = g["Kpp"] * (r - th) - w;  ir = g["Kps"] * es + Is
        ei = ir - i;                   V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i - k * w) / L, (k * i - b * w) / J, w, g["Kii"] * ei, g["Kis"] * es])
    return linearise(f, 5)

def speed_loop(g):                # x = [i, w, Ii, Is], input w_ref
    def f(x, r):
        i, w, Ii, Is = x
        es = r - w; ir = g["Kps"] * es + Is; ei = ir - i; V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i - k * w) / L, (k * i - b * w) / J, g["Kii"] * ei, g["Kis"] * es])
    return linearise(f, 4)

def current_loop(g):              # x = [i, Ii], rotor held, input i_ref
    def f(x, r):
        i, Ii = x; ei = r - i; V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i) / L, g["Kii"] * ei])
    return linearise(f, 2)

def bandwidth(A, B, out):
    C = np.eye(len(B))[out]; I = np.eye(len(B)); w = np.logspace(0, 5, 4000)
    H = np.abs([C @ np.linalg.solve(1j * x * I - A, B) for x in w])
    return w[np.argmax(H < H[0] / np.sqrt(2))]          # first -3 dB crossing

def step_overshoot(g):
    A, B = full_loop(g)
    t = np.linspace(0, 10 / g["Kpp"], 5000)
    _, y, _ = signal.lsim((A, B[:, None], np.eye(5)[[2]], 0), np.ones_like(t), t)
    return y.max() - 1, y[-1]

def test_designed_cascade_is_stable():
    g = design(3000, 300, 30)
    A, _ = full_loop(g)
    eig = np.linalg.eigvals(A)
    print("closed-loop poles:", np.round(np.sort(eig.real), 1))
    assert np.all(eig.real < 0)
    os_, final = step_overshoot(g)
    print(f"position step: overshoot {os_:.2%}, final value {final:.4f}")
    assert os_ < 0.02 and abs(final - 1) < 1e-3

def test_bandwidths_match_design():
    g = design(3000, 300, 30)
    bi = bandwidth(*current_loop(g), 0); bs = bandwidth(*speed_loop(g), 1); bp = bandwidth(*full_loop(g), 2)
    print(f"measured bandwidths: current {bi:.0f}, speed {bs:.0f}, position {bp:.1f} rad/s")
    assert abs(bi / 3000 - 1) < 0.05
    assert 0.8 < bs / 300 < 1.5
    assert 0.8 < bp / 30 < 1.3
    assert bi / bs > 5 and bs / bp > 5                   # separation survives in the real loops

def test_poor_separation_rings():
    res = {}
    for sep in (10, 3, 1.5):
        res[sep] = step_overshoot(design(3000, 3000 / sep, 3000 / sep**2))[0]
    print("overshoot vs separation:", {s: f"{v:.1%}" for s, v in res.items()})
    assert res[10] < 0.02 and res[1.5] > 0.2

test_designed_cascade_is_stable()
test_bandwidths_match_design()
test_poor_separation_rings()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does the current PI zero go exactly on $R/L$?
:::solution
Placing the zero at $-R/L$ cancels the winding's electrical pole, so the open loop becomes $\omega_i/s$, a pure integrator. The closed loop is then first order with bandwidth $\omega_i$ and no overshoot. If $R$ drifts with temperature the cancellation is imperfect, but a slow pole-zero pair near $-R/L$ barely shows in the response.
:::end

:::exercise
The position loop's bandwidth is 30 rad/s. Can you raise it to 300 without touching the inner loops?
:::solution
Not safely: that would leave no separation from the speed loop (about 400 rad/s), and the step test above shows overshoot climbing past 20 % at a separation of 1.5. To go faster, raise all three loops together, which is limited ultimately by the current loop's sample rate and the PWM frequency.
:::end

## Quiz

:::quiz
- type: num
  q: Current-loop proportional gain in V/A for L = 2 mH and ω_i = 3000 rad/s?
  answer: 6
  tol: 0.001
  unit: V/A
  py: "0.002*3000"
  explain: K_p,i = L ω_i.
- type: num
  q: Current-loop integral gain in V/(A·s) for R = 1.2 Ω and ω_i = 3000 rad/s?
  answer: 3600
  tol: 0.001
  unit: V/(A·s)
  py: "1.2*3000"
  explain: K_i,i = R ω_i, which puts the zero at R/L.
- type: num
  q: Speed-loop gain in A per rad/s for J = 2e-4, k = 0.05 and ω_s = 300 rad/s?
  answer: 1.2
  tol: 0.001
  unit: A/(rad/s)
  py: "2e-4*300/0.05"
  explain: K_p,s = J ω_s / k.
- type: num
  q: With 10× separation per level below a current loop at ω_i = 3000 rad/s, what is the position bandwidth in rad/s?
  answer: 30
  tol: 0.001
  unit: rad/s
  py: "3000/10/10"
  explain: Two levels of 10× separation.
- type: mc
  q: Which loop is innermost in a motor servo cascade?
  options:
    - current (torque)
    - speed
    - position
    - temperature
  answer: 0
  explain: The fastest dynamics go innermost.
- type: mc
  q: Why does the position loop usually need no integral term?
  options:
    - the speed loop's integrator already rejects load torque
    - position cannot have steady-state error
    - integrators are unstable
    - the current loop removes all errors
  answer: 0
  explain: The speed PI holds zero speed error under constant load, and the plant from speed to position is already an integrator.
:::end
