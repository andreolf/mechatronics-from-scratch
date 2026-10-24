---
id: p15-l14
minutes: 45
summary: Computed-torque control uses the arm's own dynamics model to cancel its nonlinearities, so the tracking error obeys a simple linear equation you choose. You derive the control law from M(q) q double-dot plus C q dot plus g equals tau, implement it on the arm lab's arm tracking a swinging trajectory, test that the error decays exactly as a critically damped second-order system, and see how an unmodelled payload breaks the cancellation.
---

## Feedback linearisation

The arm obeys $M(q)\ddot q + c(q, \dot q) + g(q) = \tau$ (lesson 13, with $c$ now including the lab's joint damping). Pick

$$\tau = M(q)\,\big(\ddot q_d + K_d\dot e + K_pe\big) + c(q, \dot q) + g(q), \qquad e = q_d - q.$$

Substitute: $M\ddot q = M(\ddot q_d + K_d\dot e + K_pe)$, and since $M$ is always invertible,

$$\ddot e + K_d\dot e + K_pe = 0.$$

Each joint's error is now an independent, linear, constant-coefficient system, whatever the pose or speed. With $K_p = \omega_n^2$ and $K_d = 2\omega_n$ it is critically damped:

$$e(t) = e_0(1 + \omega_nt)\,e^{-\omega_nt} \quad \text{(starting with zero error rate)}.$$

## Against PD with gravity compensation

The [arm lab](#lab-arm)'s servo is PD plus gravity compensation: $\tau = K_pe + K_d\dot e + g(q)$. It holds a pose perfectly, but while tracking a moving reference it has no $M\ddot q_d$ or Coriolis feedforward, so a following error remains that depends on the motion.

## The catch: the model

The cancellation is only as good as the model. An unmodelled payload changes $M$, $c$ and $g$, and the leftover torque appears in the error equation multiplied by $M^{-1}$. That gain is large wherever the inertia is small, at the elbow for example.

:::figure widget=ctc caption="The arm lab's arm tracking a swinging trajectory, starting 5 degrees off. Compare computed torque with the lab's PD-plus-gravity servo, change the error bandwidth, and add a payload the controller doesn't know about."
:::end

## Worked example

Reference: both joints swing sinusoidally about the lab's start pose (30° at 1.5 rad/s and 40° at 2 rad/s), starting 5° off on each joint.

1. Computed torque with $\omega_n = 10$ rad/s: the shoulder error at 0.5 s is 0.2021°, against a theoretical $5°(1 + 5)e^{-5} = 0.2021°$. It matches to $10^{-9}$ degrees over the whole run.
2. Peak torques are 30.2 and 6.0 N·m, inside the lab's 45 and 25 N·m limits.
3. The lab's PD plus gravity servo still has up to 1.19° of following error after 2 s.
4. Add an unmodelled 0.5 kg payload and computed torque settles to up to 10.5° of error. Its own gravity is never cancelled, and the elbow's small inertia amplifies the leftover torque. Put the payload in the model and the error vanishes again.

## Code it from scratch

:::code file=computed_torque.py
```python
import numpy as np

# the arm lab's model (lesson 13), with an optional unknown payload at the tool and the lab's joint damping
L1, L2, M1, M2, G, B = 1.0, 0.8, 1.5, 1.0, 9.81, 0.6
def model(q, qd, payload=0.0):
    """M, C q_dot + damping, g for the 2-link arm with a point payload at the tool"""
    lc1, lc2, I1, I2 = L1 / 2, L2 / 2, M1 * L1 ** 2 / 12, M2 * L2 ** 2 / 12
    m2, I2c = M2 + payload, I2 + M2 * lc2 ** 2 + payload * L2 ** 2      # forearm + payload about the elbow
    mc2 = M2 * lc2 + payload * L2                                       # first moment of the forearm about the elbow
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M11 = M1 * lc1 ** 2 + I1 + m2 * L1 ** 2 + I2c + 2 * L1 * mc2 * c2
    M12 = I2c + L1 * mc2 * c2
    Mm = np.array([[M11, M12], [M12, I2c]])
    h = L1 * mc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2]) + B * qd
    g = np.array([(M1 * lc1 + m2 * L1) * G * np.cos(q[0]) + mc2 * G * np.cos(q[0] + q[1]), mc2 * G * np.cos(q[0] + q[1])])
    return Mm, c, g

def ref(t):
    """a smooth joint trajectory: swing round the lab's start pose"""
    q0, A, w = np.radians([60, -70]), np.radians([30, 40]), np.array([1.5, 2.0])
    return q0 + A * np.sin(w * t), A * w * np.cos(w * t), -A * w * w * np.sin(w * t)

def computed_torque(q, qd, t, wn=10.0, payload_model=0.0):
    qr, vr, ar = ref(t); e, ed = qr - q, vr - qd
    M, c, g = model(q, qd, payload_model)
    return M @ (ar + 2 * wn * ed + wn * wn * e) + c + g             # Kd = 2 wn, Kp = wn^2: critically damped error

def pd_gravity(q, qd, t, Kp=(140, 90), Kd=(30, 16)):
    qr, vr, _ = ref(t); _, _, g = model(q, qd)
    return np.array(Kp) * (qr - q) + np.array(Kd) * (vr - qd) + g    # the lab's servo

def run(ctrl, T=4.0, dt=1e-3, payload=0.0, e0=np.radians([5, -5])):
    q = ref(0)[0] - e0; qd = ref(0)[1].copy(); ts, es, taus = [], [], []
    def f(s, t):    # the controller is evaluated continuously (inside every RK4 stage)
        tau = ctrl(s[:2], s[2:], t); M, c, g = model(s[:2], s[2:], payload)
        return np.concatenate([s[2:], np.linalg.solve(M, tau - c - g)]), tau
    s = np.concatenate([q, qd])
    for i in range(int(T / dt)):
        t = i * dt
        k1, tau = f(s, t); k2, _ = f(s + dt / 2 * k1, t + dt / 2); k3, _ = f(s + dt / 2 * k2, t + dt / 2); k4, _ = f(s + dt * k3, t + dt)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ts.append(t + dt); es.append(ref(t + dt)[0] - s[:2]); taus.append(tau)
    return np.array(ts), np.array(es), np.array(taus)

def test_error_decays_exponentially():
    wn = 10.0
    t, e, tau = run(lambda q, qd, t: computed_torque(q, qd, t, wn))
    e0 = np.radians(5)
    # theory for a critically damped error starting at e0 with zero rate: e(t) = e0 (1 + wn t) exp(-wn t)
    theory = e0 * (1 + wn * t) * np.exp(-wn * t)
    dev = np.abs(np.abs(e[:, 0]) - theory).max()
    print(f"computed torque, wn = {wn}: |e1| at 0.5 s {np.degrees(abs(e[499, 0])):.4f} deg (theory {np.degrees(theory[499]):.4f}), deviation from theory {np.degrees(dev):.1e} deg")
    print(f"  peak torques ({np.abs(tau[:, 0]).max():.1f}, {np.abs(tau[:, 1]).max():.1f}) N m")
    assert dev < np.radians(1e-3)
    assert np.abs(e[2000:]).max() < np.radians(1e-6)          # gone after 2 s

def test_compare_pd():
    t, e, _ = run(pd_gravity)
    print(f"lab PD + gravity: tracking error after 2 s up to {np.degrees(np.abs(e[2000:]).max()):.3f} deg (it never vanishes)")
    assert np.abs(e[2000:]).max() > np.radians(0.5)

def test_model_mismatch():
    t, e, _ = run(lambda q, qd, t: computed_torque(q, qd, t), payload=0.5)
    print(f"with an unmodelled 0.5 kg payload: residual error up to {np.degrees(np.abs(e[2000:]).max()):.3f} deg")
    t2, e2, _ = run(lambda q, qd, t: computed_torque(q, qd, t, payload_model=0.5), payload=0.5)
    assert np.abs(e[2000:]).max() > 0.05 * np.pi / 180 and np.abs(e2[2000:]).max() < 1e-6

test_error_decays_exponentially()
test_compare_pd()
test_model_mismatch()
print("PASS")
```
:::end

## Exercises

:::exercise
Estimate the residual elbow error from an unmodelled payload $\Delta m$ held still.
:::solution
The missing gravity torque at the elbow is about $\Delta m\,g\,\ell_2\cos(q_1 + q_2)$. In the error equation it appears as an extra acceleration of order $\Delta\tau/M_{22}$, balanced by $K_pe$, so $e \approx \Delta\tau/(M_{22}\omega_n^2)$. With 0.5 kg, $\Delta\tau \approx 3.9$ N·m and an effective inertia of about 0.2 kg·m², the error is about 0.2 rad (11°) at $\omega_n = 10$. Raising $\omega_n$, adding integral action, or estimating the payload all help.
:::end

:::exercise
Why not just raise $\omega_n$ to 100 rad/s?
:::solution
The torque needed for a given initial error grows with $\omega_n^2$, so the motors saturate and the linear error equation no longer holds. Sensor noise is also amplified, and the bandwidth runs into unmodelled flexibility and the delay of a digital controller (Phase 13).
:::end

## Quiz

:::quiz
- type: num
  q: Kp for a critically damped error with ωn = 10 rad/s?
  answer: 100
  tol: 0.001
  unit: 1/s²
  py: "10**2"
  explain: Kp = ωn².
- type: num
  q: Kd for the same design?
  answer: 20
  tol: 0.001
  unit: 1/s
  py: "2*10"
  explain: Kd = 2ωn.
- type: num
  q: Fraction of the initial error left after 0.5 s with ωn = 10 (zero initial error rate)?
  answer: 0.040428
  tol: 0.002
  py: "(1+5)*math.exp(-5)"
  explain: (1 + ωn t) e^(−ωn t).
- type: num
  q: Residual elbow error estimate for a 3.9 N·m unmodelled torque, 0.2 kg·m² inertia and ωn = 10?
  answer: 0.195
  tol: 0.002
  unit: rad
  py: "3.9/(0.2*100)"
  explain: Δτ / (M ωn²).
- type: mc
  q: Computed torque makes the error dynamics linear because…
  options:
    - the model's M, c and g cancel the arm's own nonlinear terms
    - the gains are very high
    - the arm is light
    - gravity is ignored
  answer: 0
  explain: Feedback linearisation.
- type: mc
  q: PD with gravity compensation leaves a tracking error on a moving reference because…
  options:
    - it has no M times desired-acceleration or Coriolis feedforward
    - its gravity model is wrong
    - PD is unstable
    - the torque limits are too low
  answer: 0
  explain: It only cancels gravity.
:::end
