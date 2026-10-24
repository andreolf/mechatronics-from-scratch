---
id: p14-l09
minutes: 40
summary: State feedback needs every state, but the pendulum lab measures only the cart position and the pole angle. A Luenberger observer runs a copy of the model and corrects it with the measurement error, and its error dynamics are set by pole placement on the transposed system. You derive the error equation, design the observer by duality, and test on the nonlinear cart-pole that the estimates converge from a wrong start and beat differentiating the encoders.
---

## A model that corrects itself

Run the model alongside the plant, driven by the same input, and nudge it with the output error:

$$\dot{\hat x} = A\hat x + Bu + L(y - C\hat x).$$

Subtract from $\dot x = Ax + Bu$: the estimation error $e = x - \hat x$ obeys

$$\dot e = (A - LC)e,$$

independent of $u$ and of $x$. Choose $L$ to make $A - LC$ stable and fast, and $e \to 0$ from any start.

**Duality.** $\mathrm{eig}(A - LC) = \mathrm{eig}(A^T - C^TL^T)$: that's state-feedback pole placement for the pair $(A^T, C^T)$ with gain $L^T$. It's possible exactly when $(A, C)$ is observable (lesson 03). The cart-pole with a cart encoder and a pole encoder is.

**How fast?** Observer poles are typically 2–10 times faster than the controller's. Faster means larger $L$, which passes more measurement noise into the estimate: the trade-off the Kalman filter (lesson 12) optimises.

:::figure widget=luenberger caption="The pole's true angular rate and the observer's estimate, starting from a wrong guess, with encoder noise. Move the observer poles: faster poles converge sooner but let more noise through; the grey trace is what differentiating the noisy encoder gives."
:::end

## Worked example

Cart-pole from the [pendulum lab](#lab-pendulum), $C$ picks out $x$ and $\theta$. Observer poles at $-20, -22, -24, -26$ rad/s.

1. Dual placement on $(A^T, C^T)$ gives a 4-by-2 gain; the large entries (about 516 and 542) drive the velocity estimates from the position residuals.
2. From an estimate wrong by 0.1 m, 0.5 m/s, 0.05 rad and 1 rad/s, the error is below $10^{-5}$ after 3 s.
3. With 0.1° encoder noise sampled at 1 kHz, differentiating gives $\sigma\sqrt2/T = 2.47$ rad/s RMS of noise on the angle rate; the observer's estimate has about 0.003 rad/s.

## Code it from scratch

:::code file=luenberger.py
```python
import numpy as np
from scipy.signal import place_poles
from scipy.linalg import solve_continuous_are

M, m, l, g = 0.8, 0.25, 0.45, 9.81

def deriv(s, F):
    """the live lab's cart-pole"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    A = np.column_stack([(deriv(e * 1e-6, 0) - deriv(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((deriv(np.zeros(4), 1e-6) - deriv(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

A, B = linearise()
C = np.array([[1.0, 0, 0, 0], [0, 0, 1.0, 0]])            # cart encoder and pole encoder: no velocity sensors
K = np.linalg.solve([[0.05]], B.T @ solve_continuous_are(A, B, np.diag([5.0, 1, 50, 1]), np.array([[0.05]])))[0]

def observer_gain(poles):
    """dual pole placement: eig(A - L C) = eig(A^T - C^T L^T)"""
    return place_poles(A.T, C.T, poles).gain_matrix.T

def run(Lg, th0=np.radians(5), xhat0=np.zeros(4), sigma=0.0, T=4.0, seed=0):
    """plant under LQR on the TRUE state; the observer runs alongside so its error can be judged"""
    h = 1e-3; rng = np.random.default_rng(seed)
    s = np.array([0.0, 0.0, th0, 0.0]); xh = xhat0.copy(); errs, fd, true = [], [], []
    y_prev = C @ s
    for k in range(int(T / h)):
        F = float(np.clip(-K @ s, -30, 30))
        y = C @ s + sigma * rng.normal(size=2)
        xh = xh + h * (A @ xh + B[:, 0] * F + Lg @ (y - C @ xh))    # Luenberger observer, forward Euler at 1 kHz
        fd.append((y - y_prev) / h); y_prev = y                      # naive alternative: differentiate the encoders
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        errs.append(s - xh); true.append(s)
    return np.array(errs), np.array(fd), np.array(true)

POLES = [-20, -22, -24, -26]

def test_error_dynamics_placed():
    Lg = observer_gain(POLES)
    got = np.sort(np.linalg.eigvals(A - Lg @ C).real)
    print("observer gain L^T =\n", np.round(Lg.T, 1))
    assert np.allclose(got, sorted(POLES), atol=1e-6)

def test_estimation_error_converges():
    Lg = observer_gain(POLES)
    e, _, _ = run(Lg, xhat0=np.array([0.1, 0.5, -0.05, 1.0]))        # start the estimate badly wrong
    n0, n1 = np.linalg.norm(e[0]), np.abs(e[-1000:]).max()
    print(f"estimation error: {n0:.3f} at start, below {n1:.1e} over the last second")
    assert n1 < 1e-3 and np.abs(e[500:, 3]).max() < 0.01

def test_better_than_differentiating():
    Lg = observer_gain(POLES); sig = np.array([0.0005, np.radians(0.1)])     # 0.5 mm and 0.1 deg encoder noise
    e, fd, true = run(Lg, sigma=sig, T=4.0, seed=2)
    rms_obs = np.sqrt(np.mean(e[1000:, 3] ** 2))
    rms_fd = np.sqrt(np.mean((fd[1000:, 1] - true[999:-1, 3]) ** 2))      # differentiated angle vs the true rate
    print(f"angle-rate error: observer {rms_obs:.3f} rad/s RMS, differentiated encoder {rms_fd:.2f} rad/s RMS"
          f" (theory sigma*sqrt(2)/h = {sig[1] * np.sqrt(2) / 1e-3:.2f})")
    assert rms_obs < 0.1 * rms_fd

test_error_dynamics_placed()
test_estimation_error_converges()
test_better_than_differentiating()
print("PASS")
```
:::end

## Exercises

:::exercise
The observer uses the linear model, but the plant is nonlinear. Why does the error still go to almost zero?
:::solution
Near upright the nonlinear terms are second order in the state. As the controller brings the pendulum back, the mismatch between the model and the plant shrinks with the state, and the stable error dynamics pull $e$ down with it. At large angles the error would be noticeable; an extended Kalman filter (lesson 15) uses the nonlinear model instead.
:::end

:::exercise
Why does the observer need $u$ as an input?
:::solution
Without it, the model wouldn't know about the force the controller applies, and the error equation would gain a term $Bu$ that never vanishes. Feeding the same $u$ to the model cancels it exactly, leaving $\dot e = (A - LC)e$.
:::end

## Quiz

:::quiz
- type: num
  q: Noise in rad/s RMS from differentiating a 0.1° RMS encoder at 1 kHz?
  answer: 2.468
  tol: 0.01
  unit: rad/s
  py: "math.radians(0.1)*math.sqrt(2)/1e-3"
  explain: σ√2/T.
- type: num
  q: Size of the observer gain matrix L for 4 states and 2 sensors (rows × columns, as a number of entries)?
  answer: 8
  tol: 0.001
  py: "4*2"
  explain: L is 4 by 2.
- type: num
  q: Time constant in ms of the slowest observer pole at −20 rad/s?
  answer: 50
  tol: 0.001
  unit: ms
  py: "1000/20"
  explain: 1/20 s.
- type: num
  q: Factor by which an error mode at −20 rad/s shrinks in 0.5 s?
  answer: 4.54e-5
  tol: 0.01
  py: "math.exp(-10)"
  explain: e^(−20 × 0.5).
- type: mc
  q: The error dynamics of a Luenberger observer depend on…
  options:
    - only A − LC, not on u or x
    - the input u
    - the controller gain K
    - the reference
  answer: 0
  explain: Both u and x cancel in the subtraction.
- type: mc
  q: Making the observer poles much faster mainly costs…
  options:
    - more measurement noise in the estimate
    - instability of the plant
    - loss of observability
    - a steady-state error
  answer: 0
  explain: Large L amplifies sensor noise.
:::end
