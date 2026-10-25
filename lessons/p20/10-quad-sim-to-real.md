---
id: p20-l10
minutes: 40
summary: The real drone will not match the model. You build a robustness test that flies 300 perturbed copies of the quad (inertia, motor lag, delay and thrust all off by realistic amounts) through the Lesson 09 controller, add sensor noise and a gust, and check that the worst copy still has margin, then confirm the test catches a drone outside the envelope.
---

## Model mismatch

Every parameter in the model is wrong by some amount: the inertia changes with the battery and payload, motors and ESCs differ, the loop delay depends on filtering and scheduling, and thrust falls as the battery drains. A controller that only works for the nominal model is a simulation result, not a flight controller.

The robustness test samples the uncertain parameters from an envelope,

$$I_{xx} \in [0.7, 1.3]\,I_0,\quad \tau_m \in [10, 40]\ \text{ms},\quad T_d \in [2, 12]\ \text{ms},\quad k_T \in [0.8, 1.2],$$

and asks for every sample: is the minimum phase margin above a floor (30° here), and does the time response with noise and a gust stay within limits? It is a Monte Carlo version of the robust-control questions of Phase 14, and it is what "run it in Gazebo with noise" should mean in practice.

:::figure widget=montecarlo caption="Phase margins of perturbed drones. Change the size of the envelope and the gains; the dots show each sample, the readout gives the worst case and the share below the 30 degree floor."
:::end

## Worked example

Lesson 09 gains, envelope above (illustrative):

1. Nominal: rate phase margin 62.4°, attitude 78.6°, no overshoot; a 0.2 N·m gust for 0.2 s pushes roll 3.08° off, and the mean error at the end is 0.50°.
2. 300 perturbed drones: minimum phase margin 34.9°, 5th percentile 41.1°, median 55.2°; none below 30°.
3. Worst case: $I_{xx}$ 0.0088 kg·m², motor lag 34 ms, delay 11.3 ms, thrust gain 1.11 (light, slow and strong at once); overshoot 0.2 %, gust error 3.08°, mean error 0.41° at the end.
4. Outside the envelope (35 ms delay, 50 ms motors): rate margin 6.5°, overshoot 83.5 %. The test notices, which is the point of testing it.

The gust error barely changes with the parameters because it is set by the controller's stiffness $k_a k_p$, not the inertia.

## Code it from scratch

:::code file=robustness.py
```python
import numpy as np

# nominal roll axis and the Lesson 09 cascaded controller
NOM = dict(Ixx=0.012, tau_m=0.02, delay=0.006, k_thrust=1.0)
KP_R, KI_R, KD_R, KP_A, TAU_MAX, T = 0.36, 1.0, 0.004, 6.0, 1.5, 0.002
W = np.logspace(-1, 3.5, 6000)

def loops(P):
    s = 1j * W
    C = KP_R + KI_R / s + KD_R * s / (1 + s / 200)
    G = P["k_thrust"] * np.exp(-P["delay"] * s) / (P["tau_m"] * s + 1) / (P["Ixx"] * s)
    Li = C * G; Lo = KP_A * Li / (1 + Li) / s
    return Li, Lo

def pm(L):
    mag, ph = np.abs(L), np.unwrap(np.angle(L)); i = np.where(np.diff(np.sign(mag - 1)))[0]
    return 180 + np.degrees(ph[i[0]]) if len(i) else 180.0

def step(P, gust=0.0, noise=0.0, t_end=2.0, dt=2e-4, seed=0):
    """20 deg roll step with sensor noise and a torque gust at 1 s; returns overshoot (%), worst error after the gust and
    mean error over the last 0.3 s (deg)"""
    rng = np.random.default_rng(seed); n_del = int(round(P["delay"] / dt)); buf = [0.0] * (n_del + 1)
    phi = p = tau = integ = d_f = prev_e = u = 0.0; sub = int(T / dt); out = []
    for k in range(int(t_end / dt)):
        t = k * dt
        if k % sub == 0:
            phm, pmeas = phi + rng.normal(0, noise * 0.01), p + rng.normal(0, noise * 0.05)   # 0.6 deg, 3 deg/s per unit
            e = KP_A * (np.radians(20) - phm) - pmeas; integ += e * T
            d_f += T * 200 * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            if u != u_raw: integ -= e * T
        buf.append(u); ud = buf.pop(0)
        tau += dt / P["tau_m"] * (P["k_thrust"] * ud - tau)
        p += dt * (tau + (gust if 1.0 <= t < 1.2 else 0.0)) / P["Ixx"]; phi += dt * p
        out.append(np.degrees(phi))
    out = np.array(out); i17 = int(1.7 / dt)
    return 100 * (out[:int(1.0 / dt)].max() - 20) / 20, np.abs(out[int(1.0 / dt):] - 20).max(), np.abs(out[i17:] - 20).mean()

def sample(rng):
    return dict(Ixx=NOM["Ixx"] * rng.uniform(0.7, 1.3),            # payload, battery position
                tau_m=rng.uniform(0.01, 0.04),                     # ESC and motor differences
                delay=rng.uniform(0.002, 0.012),                   # scheduling, filtering
                k_thrust=rng.uniform(0.8, 1.2))                    # battery voltage, propeller wear

def test_nominal():
    Li, Lo = loops(NOM); ov, gust_err, late = step(NOM, gust=0.2, noise=1.0)
    print(f"nominal: rate PM {pm(Li):.1f} deg, attitude PM {pm(Lo):.1f} deg, overshoot {ov:.1f} %, "
          f"0.2 N m gust for 0.2 s: worst error {gust_err:.2f} deg, mean error at the end {late:.2f} deg")
    assert pm(Li) > 45 and pm(Lo) > 45 and ov < 10 and gust_err < 5 and late < 0.8

def test_monte_carlo(n=300):
    rng = np.random.default_rng(42); worst = None; pms = []
    for k in range(n):
        P = sample(rng); Li, Lo = loops(P); m = min(pm(Li), pm(Lo)); pms.append(m)
        if worst is None or m < worst[0]: worst = (m, P)
    pms = np.array(pms)
    print(f"{n} perturbed drones: phase margin min {pms.min():.1f} deg, 5th percentile {np.percentile(pms, 5):.1f} deg, "
          f"median {np.median(pms):.1f} deg; {np.mean(pms < 30) * 100:.1f} % below 30 deg")
    m, P = worst; ov, ge, late = step(P, gust=0.2, noise=1.0)
    print("worst case:", {k: round(v, 4) for k, v in P.items()}, f"-> overshoot {ov:.1f} %, gust error {ge:.2f} deg, mean error at the end {late:.2f} deg")
    assert pms.min() > 30 and ov < 20 and late < 0.8

def test_beyond_envelope():
    P = dict(NOM, delay=0.035, tau_m=0.05)               # far outside the envelope: the test must notice
    Li, Lo = loops(P); ov, _, late = step(P)
    print(f"35 ms delay, 50 ms motors: rate PM {pm(Li):.1f} deg, overshoot {ov:.1f} %")
    assert pm(Li) < 20

test_nominal(); test_monte_carlo(); test_beyond_envelope(); print("PASS")
```
:::end

## In practice

Gazebo with the PX4 software-in-the-loop setup runs the real firmware against a physics model; randomising its parameters and adding wind and sensor noise turns it into this test. Measure the envelope rather than guessing it: weigh the drone with each battery, measure motor step responses on a thrust stand, and log the loop delay. Then fly, tethered or low, and compare the logs with the simulation.

## Exercises

:::exercise
Why is the worst case light, slow and strong at once?
:::solution
Lower inertia and higher thrust gain both raise the loop gain, pushing the crossover up, where the slower motor and longer delay add the most phase lag. The margin falls from both sides.
:::end

:::exercise
How would you make the controller robust to a 20 ms delay?
:::solution
Lower the rate crossover so that $\omega_c T_d$ stays small (for example 30° of lag at $\omega_c = 26$ rad/s), then lower the attitude gain to keep the separation. The drone becomes slower but stays stable; reducing the delay itself is better.
:::end

## Quiz

:::quiz
- type: num
  q: Phase lag of 12 ms delay at 27.8 rad/s (degrees)?
  answer: 19.1
  tol: 0.005
  py: "math.degrees(0.012*27.8)"
  explain: ωTd.
- type: num
  q: Cascade stiffness k_a k_p for 6 and 0.36 (N·m/rad)?
  answer: 2.16
  tol: 0.005
  py: "6*0.36"
  explain: Product of the gains.
- type: num
  q: Static roll error from 0.2 N·m with that stiffness (degrees)?
  answer: 5.31
  tol: 0.005
  py: "math.degrees(0.2/2.16)"
  explain: τ/k.
- type: num
  q: Relative loop gain change for 0.7 inertia and 1.2 thrust gain?
  answer: 1.714
  tol: 0.005
  py: "1.2/0.7"
  explain: k_T / (I/I0).
- type: mc
  q: What should a robustness test also check, besides the samples inside the envelope?
  options: ["That a drone outside the envelope fails it", "That the nominal model is exact", "That noise is zero", "That the integrator is off"]
  answer: 0
  explain: A test that never fails proves nothing.
- type: mc
  q: Where should the envelope come from?
  options: ["Measurements of the real drone and its variation", "The nominal model", "The controller gains", "The simulator defaults"]
  answer: 0
  explain: Measure, then test.
:::end
