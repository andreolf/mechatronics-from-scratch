---
id: p12-l02
minutes: 35
summary: Translational mechanical systems are masses, springs and dampers, and Newton's second law applied to a free-body diagram of each mass gives one second-order equation per mass. You derive the quarter-car suspension model, find its body-bounce and wheel-hop natural frequencies from the eigenvalues of the mass and stiffness matrices, simulate it on a bumpy road, and check that the simulated free vibration oscillates at exactly those frequencies.
---

## Free-body diagrams

For each mass, draw every force acting on it, with signs from an assumed positive direction, then write $m\ddot x = \sum F$:

- a spring between $x_1$ and $x_2$ pushes with $k(x_2 - x_1)$ on mass 1 and the opposite on mass 2;
- a damper pushes with $c(\dot x_2 - \dot x_1)$ the same way;
- an input such as a road profile $r(t)$ enters through the element touching it.

Measuring positions from static equilibrium removes gravity: it's balanced by the springs' preload.

## The quarter car

A quarter car is one corner of a vehicle: the sprung (body) mass $m_s$, the unsprung (wheel and axle) mass $m_u$, the suspension spring $k_s$ and damper $c_s$ between them, and the tyre as a stiff spring $k_t$ to the road:

$$m_s \ddot x_s = -k_s (x_s - x_u) - c_s(\dot x_s - \dot x_u),$$
$$m_u \ddot x_u = k_s (x_s - x_u) + c_s(\dot x_s - \dot x_u) - k_t (x_u - r).$$

In matrix form $M\ddot x + C\dot x + Kx = f$, with

$$M = \begin{bmatrix} m_s & 0 \\ 0 & m_u\end{bmatrix}, \qquad K = \begin{bmatrix} k_s & -k_s \\ -k_s & k_s + k_t\end{bmatrix}.$$

## Natural frequencies

Without damping, try $x = v e^{j\omega t}$: $(K - \omega^2 M)v = 0$, so the $\omega^2$ are the eigenvalues of $M^{-1}K$. Two masses, two modes:

- **body bounce**: the body moves on the suspension and tyre in series, $\omega_1 \approx \sqrt{\frac{k_s k_t/(k_s + k_t)}{m_s}}$, about 1–1.5 Hz in a car, chosen for comfort;
- **wheel hop**: the wheel bounces between suspension and tyre while the body barely moves, $\omega_2 \approx \sqrt{(k_s + k_t)/m_u}$, about 10–12 Hz.

The approximations work because the masses and stiffnesses are very different; the eigenvalues are exact.

:::figure widget=quartercar caption="A quarter car driving over a bump. The body (top) moves slowly at the bounce frequency, the wheel (bottom) quickly at wheel hop. Change the damping and speed to see which mode the bump excites."
:::end

## Worked example

$m_s = 250$ kg, $m_u = 40$ kg, $k_s = 16$ kN/m, $k_t = 160$ kN/m.

1. Body bounce: $k_s k_t/(k_s + k_t) = 14.55$ kN/m, $\omega_1 \approx \sqrt{14550/250} = 7.63$ rad/s = **1.21 Hz**.
2. Wheel hop: $\omega_2 \approx \sqrt{176000/40} = 66.3$ rad/s = **10.6 Hz**.
3. The exact eigenvalues of $M^{-1}K$ give 1.213 Hz and 10.56 Hz: the approximations are within 1 %.

## Code it from scratch

:::code file=quarter_car.py
```python
import numpy as np

ms, mu, ks, kt = 250.0, 40.0, 16000.0, 160000.0
M = np.diag([ms, mu])
K = np.array([[ks, -ks], [-ks, ks + kt]])

def natural_frequencies():
    w2 = np.linalg.eigvals(np.linalg.solve(M, K)).real
    return np.sort(np.sqrt(w2)) / (2 * np.pi)

def make_f(cs, road):
    def f(t, s):
        xs, xu, vs, vu = s
        r = road(t)
        fs = -ks * (xs - xu) - cs * (vs - vu)
        return np.array([vs, vu, fs / ms, (-fs - kt * (xu - r)) / mu])
    return f

def rk4(f, x0, t_end, dt):
    n = int(round(t_end / dt)); x = np.array(x0, float); out = np.empty((n + 1, len(x0))); out[0] = x
    for k in range(n):
        t = k * dt
        k1 = f(t, x); k2 = f(t + dt / 2, x + dt / 2 * k1); k3 = f(t + dt / 2, x + dt / 2 * k2); k4 = f(t + dt, x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out[k + 1] = x
    return np.arange(n + 1) * dt, out

def peak_freqs(sig, dt, n=2):
    pad = 1 << 21
    spec = np.abs(np.fft.rfft((sig - sig.mean()) * np.hanning(len(sig)), pad))
    freqs = np.fft.rfftfreq(pad, dt)
    peaks = [i for i in range(1, len(spec) - 1) if spec[i] > spec[i - 1] and spec[i] > spec[i + 1]]
    chosen = []
    for i in sorted(peaks, key=lambda i: -spec[i]):          # strongest first, skipping window side lobes
        if all(abs(freqs[i] - freqs[j]) > 1.0 for j in chosen):
            chosen.append(i)
        if len(chosen) == n:
            break
    return sorted(freqs[i] for i in chosen)

def test_frequencies():
    f1, f2 = natural_frequencies()
    a1 = np.sqrt(ks * kt / (ks + kt) / ms) / (2 * np.pi); a2 = np.sqrt((ks + kt) / mu) / (2 * np.pi)
    print(f"eigenvalues: {f1:.3f} Hz and {f2:.3f} Hz; hand approximations {a1:.3f} and {a2:.3f} Hz")
    assert abs(a1 - f1) / f1 < 0.02 and abs(a2 - f2) / f2 < 0.02
    # free vibration, no damping: a mix of both modes, starting from a displaced wheel
    dt = 1e-3
    t, X = rk4(make_f(0.0, lambda t: 0.0), [0.0, 0.01, 0.0, 0.0], 60.0, dt)
    p = peak_freqs(X[:, 0] + 5 * X[:, 1], dt)
    print(f"simulated spectrum peaks: {p[0]:.3f} Hz and {p[1]:.3f} Hz")
    assert abs(p[0] - f1) / f1 < 0.005 and abs(p[1] - f2) / f2 < 0.005
    # energy is conserved without damping (checks the equations' signs)
    E = 0.5 * ms * X[:, 2] ** 2 + 0.5 * mu * X[:, 3] ** 2 + 0.5 * ks * (X[:, 0] - X[:, 1]) ** 2 + 0.5 * kt * X[:, 1] ** 2
    print(f"energy drift over 60 s: {np.max(np.abs(E - E[0])) / E[0]:.1e} of the initial energy")
    assert np.max(np.abs(E - E[0])) / E[0] < 1e-3

def test_bump():
    bump = lambda t: 0.05 * (1 - np.cos(2 * np.pi * (t - 0.5) / 0.1)) / 2 if 0.5 <= t <= 0.6 else 0.0
    t, X = rk4(make_f(1000.0, bump), [0, 0, 0, 0], 5.0, 1e-4)
    print(f"over a 5 cm bump with c = 1000 Ns/m: body peak {X[:, 0].max() * 100:.1f} cm, wheel peak {X[:, 1].max() * 100:.1f} cm")
    assert abs(X[-1, 0]) < 2e-3                         # damped back to rest
    assert X[:, 1].max() > X[:, 0].max()                # the suspension isolates the body

test_frequencies()
test_bump()
print("PASS")
```
:::end

## Exercises

:::exercise
Softening the suspension spring from 16 to 12 kN/m: which frequency changes most, and why do car makers like it?
:::solution
Body bounce drops roughly as $\sqrt{k_s}$ (the tyre is much stiffer, so the series stiffness is close to $k_s$): from 1.21 to about 1.05 Hz, which feels more comfortable. Wheel hop hardly moves, since $k_s + k_t$ changes by only 2 %. The cost is more body travel and more roll in corners.
:::end

:::exercise
Why measure positions from static equilibrium instead of from the unloaded spring length?
:::solution
In equilibrium each spring's preload exactly balances gravity on the masses above it. Writing the equations about that point cancels $mg$ and the preloads, leaving only the deviations. The dynamics are identical; the equations are just shorter and linear.
:::end

## Quiz

:::quiz
- type: num
  q: Approximate body-bounce frequency in Hz with k_s = 20 kN/m, k_t = 200 kN/m, m_s = 300 kg?
  answer: 1.24
  tol: 0.005
  unit: Hz
  py: "(20e3*200e3/220e3/300)**0.5/(2*__import__('math').pi)"
  explain: Series stiffness over the sprung mass.
- type: num
  q: Approximate wheel-hop frequency in Hz with k_s = 20 kN/m, k_t = 200 kN/m, m_u = 45 kg?
  answer: 11.13
  tol: 0.005
  unit: Hz
  py: "(220e3/45)**0.5/(2*__import__('math').pi)"
  explain: Both springs act on the wheel.
- type: num
  q: Static tyre deflection in mm under the full quarter-car weight (290 kg, k_t = 160 kN/m, g = 9.81)?
  answer: 17.78
  tol: 0.002
  unit: mm
  py: "290*9.81/160e3*1000"
  explain: The preload that measuring from equilibrium hides.
- type: num
  q: Number of natural frequencies of an undamped 3-mass chain?
  answer: 3
  tol: 0
  py: "3"
  explain: One per degree of freedom.
- type: mc
  q: The natural frequencies squared are the eigenvalues of…
  options:
    - M⁻¹K
    - K M
    - M + K
    - C⁻¹K
  answer: 0
  explain: From (K − ω²M)v = 0.
- type: mc
  q: In body bounce, how do the body and wheel move?
  options:
    - mostly the body, on the suspension and tyre in series
    - mostly the wheel
    - in opposite directions with equal amplitude
    - not at all
  answer: 0
  explain: The wheel follows the slow motion with a small amplitude.
:::end

:::verify
import numpy as np
M = np.diag([250.0, 40.0]); K = np.array([[16e3, -16e3], [-16e3, 176e3]])
f = np.sort(np.sqrt(np.linalg.eigvals(np.linalg.solve(M, K)).real)) / (2 * np.pi)
assert abs(f[0] - 1.213) < 0.001 and abs(f[1] - 10.564) < 0.001
:::end
