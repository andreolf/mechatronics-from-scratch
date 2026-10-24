---
id: p03-l14
minutes: 40
summary: A controller designed in continuous time has to become a difference equation before it runs on a microcontroller. You derive zero-order-hold discretisation from the matrix exponential and the Tustin substitution from the trapezoid rule, add frequency prewarping, and compare all three on a low-pass filter and a PID.
---

## Zero-order hold: exact at the samples

A DAC or PWM output holds each command constant for one period $T$. For the state-space model $\dot x = Ax + Bu$ with $u$ constant over $[kT, (k+1)T)$, the ODE solution from Phase 02 gives

$$x_{k+1} = e^{AT}x_k + \Big(\int_0^T e^{A\tau}d\tau\Big)B\,u_k = \Phi x_k + \Gamma u_k.$$

Nothing is approximated: at the sample instants the discrete model reproduces the continuous plant exactly, given a held input. Both matrices come out of one matrix exponential of an augmented matrix:

$$\exp\!\left(\begin{bmatrix}A & B\\ 0 & 0\end{bmatrix}T\right) = \begin{bmatrix}\Phi & \Gamma\\ 0 & I\end{bmatrix}.$$

For $G(s) = \frac{a}{s + a}$ this gives $H(z) = \dfrac{1 - e^{-aT}}{z - e^{-aT}}$.

## Tustin: the trapezoid rule

An integrator $1/s$ integrated with the trapezoid rule is $y_k = y_{k-1} + \frac T2(u_k + u_{k-1})$, so $\frac{Y}{U} = \frac T2\frac{z + 1}{z - 1}$. Replacing every $s$ in a controller by

$$s \leftarrow \frac{2}{T}\,\frac{z - 1}{z + 1}$$

gives the Tustin (bilinear) discretisation. It maps the whole left half-plane inside the unit circle, so a stable design stays stable at any $T$. The price is frequency warping: analog frequency $\omega_a$ lands at digital frequency $\omega_d$ with

$$\omega_a = \frac{2}{T}\tan\frac{\omega_dT}{2}.$$

At low frequency the two agree; near Nyquist the whole analog axis is squeezed in. **Prewarping** fixes one chosen frequency, usually a filter corner or notch: replace $\frac2T$ by $\frac{\omega_c}{\tan(\omega_cT/2)}$ so that $\omega_c$ maps exactly.

**Matched pole-zero** maps each pole and zero by $z = e^{sT}$ and fixes the DC gain. It's simple and often good for filters.

:::figure widget=bode args={"kind":"discrete"} caption="A 10 Hz low-pass (white) and its ZOH (amber) and Tustin (lime) versions. Increase T: the discrete versions drift from the continuous one as frequencies approach Nyquist."
:::end

## Worked example

Discretise $G(s) = \frac{a}{s + a}$ with a 10 Hz corner ($a = 62.83$ rad/s) at $T = 10$ ms, so $aT = 0.6283$.

1. **ZOH**: pole $e^{-0.6283} = 0.5335$, so $y_k = 0.5335y_{k-1} + 0.4665u_{k-1}$. The input appears with a one-sample delay, as you'd expect from a hold.
2. **Tustin**: $H(z) = \dfrac{aT(z + 1)}{(2 + aT)z - (2 - aT)}$, with pole $(2 - aT)/(2 + aT) = 0.5219$.
3. **Warping**: the analog corner at 10 Hz lands at $\omega_d = \frac2T\arctan\frac{aT}2 = 60.88$ rad/s, which is 9.69 Hz. The error is 3 %, and prewarping removes it.
4. **A PID**: $C(s) = K_p + K_i/s + K_ds$. With Tustin on the integral and backward Euler on the derivative, the update is

$$I_k = I_{k-1} + K_i\tfrac T2(e_k + e_{k-1}), \qquad D_k = K_d\frac{e_k - e_{k-1}}{T}, \qquad u_k = K_pe_k + I_k + D_k.$$

In practice the derivative also gets a low-pass filter, or noise makes it unusable (Phase 13).

## Code it from scratch

:::code file=discretise.py
```python
import numpy as np
from scipy.linalg import expm
from scipy import signal

def zoh(A, B, T):
    n, m = A.shape[0], B.shape[1]
    M = np.zeros((n + m, n + m)); M[:n, :n] = A; M[:n, n:] = B
    E = expm(M * T)
    return E[:n, :n], E[:n, n:]

def tustin_first_order(a, T, prewarp=None):
    """a/(s+a) -> (b, den) in z^-1 form, optional prewarping at prewarp rad/s."""
    k = 2 / T if prewarp is None else prewarp / np.tan(prewarp * T / 2)
    return np.array([a, a]) / (k + a), np.array([1, (a - k) / (k + a)])

if __name__ == "__main__":
    a, T = 2 * np.pi * 10, 0.01
    Phi, Gam = zoh(np.array([[-a]]), np.array([[a]]), T)
    assert abs(Phi[0, 0] - np.exp(-a * T)) < 1e-12 and abs(Gam[0, 0] - (1 - np.exp(-a * T))) < 1e-12
    # ZOH step response equals the continuous one at every sample
    x, xs = 0.0, []
    for _ in range(30):
        xs.append(x); x = Phi[0, 0] * x + Gam[0, 0] * 1.0
    t = np.arange(30) * T
    assert np.max(np.abs(np.array(xs) - (1 - np.exp(-a * t)))) < 1e-12
    b, den = tustin_first_order(a, T)
    assert abs(-den[1] - 0.52189) < 1e-5
    nd, dd, _ = signal.cont2discrete(([a], [1, a]), T, method="bilinear")
    assert np.allclose(b, np.ravel(nd), atol=1e-12) and np.allclose(den, dd, atol=1e-12)
    # warping: Tustin's -3 dB point sits at 9.69 Hz; prewarping puts it back at 10 Hz
    def corner(b, den):
        f = np.linspace(5, 15, 200_001)
        z = np.exp(1j * 2 * np.pi * f * T)
        H = (b[0] + b[1] / z) / (den[0] + den[1] / z)
        return f[np.argmin(np.abs(np.abs(H) - 1 / np.sqrt(2)))]
    assert abs(corner(b, den) - 9.689) < 0.001
    assert abs(corner(*tustin_first_order(a, T, prewarp=a)) - 10.0) < 0.001
    print(f"ZOH pole {Phi[0,0]:.4f}, Tustin pole {-den[1]:.4f}, Tustin corner {corner(b, den):.3f} Hz")
```
:::end

## Exercises

:::exercise
Your controller runs at 100 Hz and contains a notch at 30 Hz to suppress a resonance. Why must you prewarp it?
:::solution
Without prewarping, Tustin moves the notch to $\omega_d = \frac2T\arctan(\omega_aT/2) = 200\arctan(0.3\pi)$ rad/s, which is 24.06 Hz. The notch would miss the resonance completely. Prewarping at 30 Hz places it exactly.
:::end

:::exercise
Discretise a pure integrator $1/s$ with forward Euler, backward Euler and Tustin. Which one is used in the PID above?
:::solution
Forward: $\frac{T}{z - 1}$. Backward: $\frac{Tz}{z - 1}$. Tustin: $\frac T2\frac{z+1}{z-1}$. The PID uses Tustin for the integral, $I_k = I_{k-1} + K_i\frac T2(e_k + e_{k-1})$, which is the trapezoid rule.
:::end

## Quiz

:::quiz
- type: num
  q: What is the ZOH pole for $a/(s + a)$ with $a = 62.83$ rad/s and $T = 10$ ms?
  answer: 0.53349
  tol: 0.001
  py: "math.exp(-2*math.pi*10*0.01)"
  explain: $e^{-aT}$.
- type: num
  q: What is the Tustin pole for the same filter?
  answer: 0.52189
  tol: 0.001
  py: "(2-2*math.pi*0.1)/(2+2*math.pi*0.1)"
  explain: $(2 - aT)/(2 + aT)$.
- type: num
  q: Where in Hz does Tustin (no prewarping) put the 10 Hz analog corner at $T = 10$ ms?
  answer: 9.689
  tol: 0.001
  unit: Hz
  py: "200*math.atan(math.pi*10*0.01)/(2*math.pi)"
  explain: $\omega_d = \frac2T\arctan(\omega_aT/2)$.
- type: mc
  q: ZOH discretisation is exact when…
  options:
    - the input is held constant between samples
    - the sample rate is infinite
    - the system is first order
    - prewarping is used
  answer: 0
  explain: $\Phi$ and $\Gamma$ solve the ODE exactly for a piecewise-constant input.
- type: mc
  q: Tustin's main advantage is…
  options:
    - zero delay
    - stable continuous designs stay stable at any sample time
    - exact frequency response at all frequencies
    - no computation
  answer: 1
  explain: The bilinear map sends the left half-plane inside the unit circle.
- type: num
  q: Where in Hz does Tustin put a 30 Hz notch at 100 Hz sampling without prewarping?
  answer: 24.058
  tol: 0.002
  unit: Hz
  py: "200*math.atan(math.pi*30*0.01)/(2*math.pi)"
  explain: $\frac2T\arctan(\pi\cdot30\cdot0.01)$ rad/s converted to Hz.
:::end

:::verify
import math
aT = 2*math.pi*10*0.01
assert abs(aT-0.6283)<1e-4 and abs(math.exp(-aT)-0.5335)<1e-4 and abs(1-math.exp(-aT)-0.4665)<1e-4
assert abs(200*math.atan(aT/2)-60.88)<0.005 and abs(200*math.atan(aT/2)/(2*math.pi)-9.69)<0.005
assert abs(200*math.atan(math.pi*0.3)/(2*math.pi)-24.06)<0.005
:::end
