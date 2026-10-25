---
id: p20-l05
minutes: 45
summary: Two ways to balance the robot. You tune a tilt PID with a slow position loop by hand, design an LQR from the linear model, kick both and compare recovery time, peak voltage and control effort, then break each loop at the motor input to compare phase margins and the loop delay each can tolerate.
---

## Two controllers

A **PID on tilt** is the classic hand-tuned balancer: $v = k_p e + k_i \int e\,dt + k_d \dot\theta$ with $e = \theta - \theta_{ref}$. On its own it lets the robot drift away, so a slow outer loop leans the tilt setpoint against position and speed, $\theta_{ref} = -(k_x x + k_v \dot x)$. An **LQR** uses all four states at once, $v = K s$, with $K$ minimising

$$J = \int_0^\infty \left(s^\top Q s + R\,v^2\right) dt,$$

which trades state error against voltage through the weights $Q$ and $R$ (Phase 14).

## Robustness margins

Break the loop at the motor input and look at the loop transfer function $L(j\omega)$. The **phase margin** is how far its phase is from −180° where $|L| = 1$; dividing it by the crossover frequency gives the **delay margin**, the extra loop delay that would make the system unstable:

$$\tau_{max} = \frac{\phi_m}{\omega_c}.$$

LQR loops broken at the input have guaranteed margins for continuous time: at least 60° of phase, and stability for any gain change from one half to infinity. A PID has no such guarantee; its margins are whatever the tuning gives.

:::figure widget=pidvslqr caption="Tilt after a kick for the PID and the LQR. Change the kick, the PID gains and the LQR weight on voltage; the readout compares recovery, peak voltage, effort and delay margins."
:::end

## Worked example

Lesson 02 robot, kick that sets the tilt rate to 1 rad/s, voltage limit 11.1 V, LQR with $Q = \mathrm{diag}(10, 1, 100, 1)$ and $R = 1$ giving $K = (3.16, 13.97, 19.92, 2.10)$:

1. PID ($k_p = 60$, $k_i = 150$, $k_d = 4$): recovers to 0.2° in 2.45 s, peak tilt 0.77°, peak voltage 4.00 V, effort 0.415 V²·s.
2. LQR: recovers in 1.03 s, peak tilt 2.14°, peak voltage 2.10 V, effort 0.175 V²·s: 58 % less effort. The PID holds the tilt tighter, at the cost of voltage.
3. Margins: LQR 93.1° at 20.4 rad/s, a delay margin of 79.5 ms; PID 100.9° at 203.2 rad/s, only 8.7 ms. The PID's high crossover makes it sensitive to loop delay and to sensor noise.

## Code it from scratch

:::code file=pid_vs_lqr.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are

M, m, r, l, Ib, Iw, g, kt, ke, R = 0.9, 0.12, 0.04, 0.07, 0.004, 9.6e-5, 9.81, 0.25, 0.25, 4.0   # Lesson 02 robot
VMAX, DT = 11.1, 1e-3

def model():
    """linear model about upright, input = motor voltage. Mm q'' = G q + [1/r, -1] tau, tau = 2 kt (v - ke (x'/r - th')) / R."""
    Mi = np.linalg.inv(np.array([[M + m + Iw / r**2, M * l], [M * l, Ib + M * l**2]])); e = np.array([1 / r, -1.0]); c = 2 * kt / R
    A = np.zeros((4, 4)); A[0, 1] = A[2, 3] = 1
    A[[1, 3], 2] = Mi @ [0, M * g * l]; A[[1, 3], 1] = Mi @ e * (-c * ke / r); A[[1, 3], 3] = Mi @ e * (c * ke)
    B = np.zeros(4); B[[1, 3]] = Mi @ e * c
    return A, B

A, B = model()
K_LQR = -(B @ solve_continuous_are(A, B[:, None], np.diag([10, 1, 100, 1]), np.array([[1.0]])))  # LQR u = -K s, written as v = K_LQR s

class PID:
    """tilt PID (fast) plus a slow position loop that leans the tilt setpoint, the usual hand-tuned structure."""
    def __init__(s, kp=60.0, ki=150.0, kd=4.0, kx=0.06, kv=0.12): s.k = (kp, ki, kd, kx, kv); s.i = 0.0
    def __call__(s, st):
        kp, ki, kd, kx, kv = s.k; x, xd, th, thd = st
        th_ref = -(kx * x + kv * xd); e = th - th_ref; s.i += e * DT
        return kp * e + ki * s.i + kd * thd

def kick(ctrl, w0=1.0, t_end=6.0):
    """impulse: the body is struck so its tilt rate jumps to w0 rad/s. Returns recovery time, effort and peak voltage."""
    s = np.array([0, 0, 0, w0]); t = 0; last = 0; effort = 0; vpk = 0; ths = []
    while t < t_end:
        v = float(np.clip(ctrl(s), -VMAX, VMAX)); effort += v * v * DT; vpk = max(vpk, abs(v))
        s = s + DT * (A @ s + B * v); t += DT; ths.append(s[2])
        if abs(s[2]) > np.radians(0.2): last = t
        if abs(s[2]) > np.radians(45): return None, effort, vpk, max(np.abs(ths))
    return last, effort, vpk, max(np.abs(ths))

def margins(Lf):
    """gain and phase margin of a loop transfer function given as f(s), from a log frequency sweep."""
    w = np.logspace(-2, 4, 20000); L = Lf(1j * w); mag = np.abs(L)
    i = np.nonzero(np.diff(np.sign(mag - 1)))[0]                       # every gain crossover
    pm = min(180 + np.degrees(np.angle(L[k])) for k in i)               # angle() is in (-180, 180]
    return pm, w[i]

def loop_lqr(s): return np.array([K_LQR @ np.linalg.solve(si * np.eye(4) - A, B) for si in s])

def loop_pid(s, c=PID()):
    kp, ki, kd, kx, kv = c.k
    out = []
    for si in s:
        G = np.linalg.solve(si * np.eye(4) - A, B)                     # plant from v to the state
        Ks = np.array([(kp + ki / si) * kx, (kp + ki / si) * kv, kp + ki / si, kd])   # v as a function of the state
        out.append(Ks @ G)
    return np.array(out)

def test_both_recover():
    rl = kick(lambda s: float(K_LQR @ s)); rp = kick(PID())
    for name, (t, e, vpk, thmax) in (("PID", rp), ("LQR", rl)):
        print(f"{name}: recovers in {t:.2f} s, peak tilt {np.degrees(thmax):.2f} deg, peak voltage {vpk:.2f} V, effort {e:.3f} V^2 s")
    assert rp[0] is not None and rl[0] is not None and rl[1] < rp[1]
    print(f"LQR uses {100 * (1 - rl[1] / rp[1]):.0f} % less effort")

def test_margins():
    for name, Lf in (("LQR", loop_lqr), ("PID", loop_pid)):
        pm, wc = margins(lambda s: -Lf(s))                               # negative feedback convention: L = -K G
        print(f"{name} loop broken at the motor input: phase margin {pm:.1f} deg at {wc[0]:.1f} rad/s, delay margin {1000 * np.radians(pm) / wc[0]:.1f} ms")
    (pl, wl), (pp, wp) = margins(lambda s: -loop_lqr(s)), margins(lambda s: -loop_pid(s))
    assert pl >= 60 - 1e-6                                              # LQR's guaranteed phase margin
    assert np.radians(pl) / wl[0] > np.radians(pp) / wp[0]              # LQR tolerates far more loop delay

test_both_recover()
test_margins()
print("PASS")
```
:::end

## In practice

python-control computes LQR gains (`control.lqr`), margins (`control.margin`) and step responses in a few lines, and is the natural next step once you trust the from-scratch versions. Try the kick test on the site's [live pendulum lab](#lab-pendulum), which runs PID on a cart-pole. On hardware, start with conservative gains and increase them while logging loop time, voltage and tilt.

## Exercises

:::exercise
A loop has 45° of phase margin at 50 rad/s. How much extra delay can it tolerate?
:::solution
$\tau_{max} = 0.785 / 50 = 15.7$ ms. Converting degrees to radians matters: $45° = 0.785$ rad.
:::end

:::exercise
How do you make the LQR react harder to tilt?
:::solution
Increase the tilt weight in $Q$ or reduce $R$. A smaller $R$ makes voltage cheaper, so the optimal gains grow and the recovery is faster, with more voltage and less delay margin.
:::end

## Quiz

:::quiz
- type: num
  q: Delay margin for 93.1° at 20.4 rad/s (ms)?
  answer: 79.7
  tol: 0.005
  py: "1000*math.radians(93.1)/20.4"
  explain: φm in radians over ωc.
- type: num
  q: Delay margin for 100.9° at 203.2 rad/s (ms)?
  answer: 8.67
  tol: 0.005
  py: "1000*math.radians(100.9)/203.2"
  explain: High crossover, small delay margin.
- type: num
  q: Effort saving from 0.415 to 0.175 V²·s (%)?
  answer: 57.8
  tol: 0.005
  py: "100*(1-0.175/0.415)"
  explain: 1 − ratio.
- type: num
  q: Smallest gain factor an LQR loop is guaranteed to tolerate at its input?
  answer: 0.5
  tol: 0.001
  py: "0.5"
  explain: Gain margin from 1/2 to infinity.
- type: mc
  q: What does the PID's slow outer loop do?
  options: ["Leans the tilt setpoint to bring the robot back to its position", "Removes sensor noise", "Limits the voltage", "Estimates the tilt"]
  answer: 0
  explain: Without it the robot drifts.
- type: mc
  q: Which guarantee does a continuous-time LQR give?
  options: ["At least 60° phase margin at the input", "No overshoot", "Zero steady-state error to any input", "Minimum peak voltage"]
  answer: 0
  explain: A classical LQR robustness result.
:::end
