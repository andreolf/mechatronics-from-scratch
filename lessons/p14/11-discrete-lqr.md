---
id: p14-l11
minutes: 40
summary: A microcontroller applies u = -Kx once per sample and holds it, so the right gain comes from the discrete-time model rather than from the continuous design. You discretise the cart-pole exactly with a zero-order hold, solve the discrete Riccati equation by iteration, check the gain against scipy's DARE solver (what python-control's dlqr wraps), and test that the discrete design stays stable at slow sample rates where the emulated continuous gain fails.
---

## Design in the domain you run in

The firmware loop reads the state at $t_k = kT$, computes $u_k = -Kx_k$, and holds it until the next tick. Between samples the plant evolves exactly as

$$x_{k+1} = A_dx_k + B_du_k, \qquad A_d = e^{AT}, \quad B_d = \int_0^Te^{A\tau}d\tau\,B,$$

which lesson 01 computes with one matrix exponential. Two ways to get $K$:

1. **Emulation**: design continuously, run the same $K$ at rate $1/T$. Fine when $T$ is small compared with the closed-loop time constants; degrades and eventually destabilises as $T$ grows.
2. **Discrete design**: minimise $\sum_k x_k^TQ_dx_k + u_k^TR_du_k$ for the discrete model directly. With $Q_d = QT$, $R_d = RT$ (the continuous cost sampled):

$$P = Q_d + A_d^TPA_d - A_d^TPB_d(R_d + B_d^TPB_d)^{-1}B_d^TPA_d, \qquad K = (R_d + B_d^TPB_d)^{-1}B_d^TPA_d.$$

The discrete design knows about the hold, so it's stable for any sample time at which the discretised system is still stabilisable. (A fully exact sampled-cost $Q_d$ adds cross terms; $QT$ is the usual first-order version.)

In firmware, $K$ is computed offline and stored as constants: $u = -(k_1x + k_2\dot x + k_3\theta + k_4\dot\theta)$ is four multiply-adds per tick.

:::figure widget=dlqr caption="The cart-pole recovering from a tilt with the continuous LQR, the discrete LQR at sample time T, and the continuous gain emulated at T. Lengthen T: the discrete design stays stable while the emulated gain starts to ring and then diverges above about 106 ms."
:::end

## Worked example

Cart-pole, $Q = \mathrm{diag}(5, 1, 50, 1)$, $R = 0.05$.

1. Continuous: $K_c = (-10.0, -12.5, -77.5, -17.6)$.
2. Discrete at $T = 5$ ms: $K = (-9.53, -12.0, -74.7, -16.9)$; at 80 ms: $(-4.65, -6.07, -44.6, -10.2)$. The gains drop as $T$ grows: each held input acts for longer.
3. Spectral radius at $T = 150$ ms: 0.813 for the discrete design, 2.45 for the emulated continuous gain (unstable). Emulation fails above about 106 ms.

## Code it from scratch

:::code file=dlqr.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are, solve_discrete_are, expm

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def zoh(A, B, T):
    n, m = B.shape; Mx = np.zeros((n + m, n + m)); Mx[:n, :n] = A; Mx[:n, n:] = B
    E = expm(Mx * T); return E[:n, :n], E[:n, n:]

def dlqr(Ad, Bd, Qd, Rd, tol=1e-13):
    """iterate the discrete Riccati equation to its fixed point, then K = (R + B'PB)^-1 B'PA"""
    P = Qd.copy()
    for _ in range(200000):
        K = np.linalg.solve(Rd + Bd.T @ P @ Bd, Bd.T @ P @ Ad)
        Pn = Qd + Ad.T @ P @ (Ad - Bd @ K)
        if np.abs(Pn - P).max() < tol * np.abs(Pn).max(): break
        P = Pn
    return np.linalg.solve(Rd + Bd.T @ Pn @ Bd, Bd.T @ Pn @ Ad), Pn

A, B = cartpole_AB(); Q = np.diag([5.0, 1, 50, 1]); R = np.array([[0.05]])
Kc = np.linalg.solve(R, B.T @ solve_continuous_are(A, B, Q, R))

def test_matches_scipy_dare():
    for T in (0.005, 0.02, 0.08):
        Ad, Bd = zoh(A, B, T)
        K, P = dlqr(Ad, Bd, Q * T, R * T)
        Pref = solve_discrete_are(Ad, Bd, Q * T, R * T)
        Kref = np.linalg.solve(R * T + Bd.T @ Pref @ Bd, Bd.T @ Pref @ Ad)
        print(f"T = {T * 1000:3.0f} ms: K = {np.round(K.ravel(), 2)}, difference from scipy {np.abs(K - Kref).max():.1e}")
        assert np.allclose(K, Kref, rtol=1e-7)

def rho(T, K):
    Ad, Bd = zoh(A, B, T)
    return np.abs(np.linalg.eigvals(Ad - Bd @ K)).max()

def test_dlqr_beats_emulation_at_slow_rates():
    print(" T (ms) | spectral radius: DLQR   continuous K emulated")
    for T in (0.005, 0.05, 0.1, 0.15):
        Ad, Bd = zoh(A, B, T); Kd, _ = dlqr(Ad, Bd, Q * T, R * T)
        print(f" {T * 1000:5.0f}  |                  {rho(T, Kd):.4f}   {rho(T, Kc):.4f}")
        assert rho(T, Kd) < 1                                   # the discrete design is always stable
    assert rho(0.15, Kc) > 1                                    # the emulated continuous gain has gone unstable
    # at fast rates the two designs agree
    Ad, Bd = zoh(A, B, 0.001); Kd, _ = dlqr(Ad, Bd, Q * 0.001, R * 0.001)
    assert np.abs(Kd - Kc).max() / np.abs(Kc).max() < 0.01

def test_discrete_matches_continuous_response():
    T = 0.005; Ad, Bd = zoh(A, B, T); Kd, _ = dlqr(Ad, Bd, Q * T, R * T)
    x0 = np.array([0, 0, 0.1, 0]); xd = x0.copy(); E = expm((A - B @ Kc) * T); xc = x0.copy(); d = 0.0
    for _ in range(600):
        xd = (Ad - Bd @ Kd) @ xd; xc = E @ xc; d = max(d, abs(xd[2] - xc[2]))
    print(f"T = 5 ms: discrete and continuous LQR angle responses differ by at most {np.degrees(d):.3f} deg")
    assert np.degrees(d) < 0.2

test_matches_scipy_dare()
test_dlqr_beats_emulation_at_slow_rates()
test_discrete_matches_continuous_response()
print("PASS")
```
:::end

## Exercises

:::exercise
Why do the discrete gains shrink as the sample time grows?
:::solution
Each input is held for a whole period, so a given gain delivers more impulse per sample and its effect lags. Keeping the same gain would overshoot; the discrete Riccati equation accounts for the hold and backs off. At very long $T$ the achievable performance falls too.
:::end

:::exercise
A rule of thumb says sample 10–30 times faster than the closed-loop bandwidth. Check it against the cart-pole.
:::solution
The fastest LQR poles are about 8.5 rad/s, roughly 1.4 Hz, so 10–30 times is 14–40 Hz, a period of 25–70 ms. Emulation is still stable there (it fails above about 106 ms) but degraded; at the lab's 200 Hz the emulated and discrete designs are practically identical.
:::end

## Quiz

:::quiz
- type: num
  q: Discrete pole for a continuous pole at −8.55 rad/s sampled at 5 ms?
  answer: 0.95817
  tol: 0.001
  py: "math.exp(-8.55*0.005)"
  explain: z = e^(sT).
- type: num
  q: Multiply-adds per control tick for u = −Kx with 4 states?
  answer: 4
  tol: 0.001
  py: "4"
  explain: One per state.
- type: num
  q: Sample time in ms above which the emulated continuous gain is unstable here?
  answer: 106
  tol: 0.02
  unit: ms
  py: "106"
  explain: Found by sweeping the spectral radius.
- type: num
  q: Spectral radius of the emulated gain at 150 ms?
  answer: 2.45
  tol: 0.01
  py: "2.4503"
  explain: Greater than 1, so unstable.
- type: mc
  q: The discrete LQR is preferred over emulation when…
  options:
    - the sample time is not small compared with the closed-loop dynamics
    - the plant is continuous
    - there are no sensors
    - Q is diagonal
  answer: 0
  explain: At fast rates they agree.
- type: mc
  q: A_d = e^(AT) and B_d come from…
  options:
    - a zero-order-hold discretisation
    - forward Euler
    - a Tustin transform
    - a Kalman filter
  answer: 0
  explain: Exact for inputs held constant over each step.
:::end
