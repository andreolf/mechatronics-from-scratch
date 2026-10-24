---
id: p13-l16
minutes: 40
summary: The sensitivity function S and the complementary sensitivity T describe how a loop responds to disturbances, noise and references, and they always add up to one, so you cannot make both small at the same frequency. You derive S plus T equals one, the Bode sensitivity integral that says pushing sensitivity down in one band raises it elsewhere, and the bounds that tie peak sensitivity to the margins, and test all three numerically for several loops, including an open-loop unstable one.
---

## Two functions

For a loop $L = GK$ with unity feedback:

$$S = \frac{1}{1 + L}, \qquad T = \frac{L}{1 + L}, \qquad S + T = 1.$$

- $S$ maps output disturbances to the output and references to the error. You want $|S|$ small at low frequency.
- $T$ maps references to the output and **sensor noise** to the output. You want $|T|$ small at high frequency.

Since they sum to one, a frequency where both are small doesn't exist: the loop must hand over from "$S$ small" to "$T$ small" somewhere around crossover.

## The waterbed effect

For a stable loop whose $L$ falls at least as $1/s^2$, Bode showed

$$\int_0^\infty \ln|S(j\omega)|\,d\omega = \pi\sum_i p_i,$$

where $p_i$ are the open-loop right-half-plane poles (zero for a stable plant). Push $\ln|S|$ below zero at low frequency and the same area must come back above zero somewhere else, as a sensitivity peak. Unstable plants are worse: they start in debt.

## Peak sensitivity and margins

$M_s = \max_\omega|S|$ is the inverse of the closest approach of $L$ to $-1$. A circle of radius $1/M_s$ round $-1$ that $L$ never enters guarantees

$$GM \ge \frac{M_s}{M_s - 1}, \qquad PM \ge 2\arcsin\frac{1}{2M_s}.$$

$M_s$ of 1.4 to 2 is a common design target; $M_s = 2$ guarantees $GM \ge 2$ and $PM \ge 29°$.

:::figure widget=sensitivity caption="|S| and |T| for a loop whose gain you set. Raise the gain: sensitivity drops at low frequency and a peak grows near crossover, keeping the area under ln|S| at zero."
:::end

## Worked example

$L = 2/(s(s + 1)(s + 2))$ from lesson 15.

1. $M_s = 2.31$, so the closest approach to $-1$ is $1/2.31 = 0.43$.
2. Bounds: $GM \ge 2.31/1.31 = 1.76$ (actual 3) and $PM \ge 2\arcsin(0.216) = 25.0°$ (actual 32.6°). Both hold.
3. Unstable case $L = 10/((s - 1)(s + 5))$: stable closed loop ($s^2 + 4s + 5$), so $\int\ln|S|\,d\omega = \pi \times 1 = 3.14$.

## Code it from scratch

:::code file=sensitivity.py
```python
import numpy as np
from scipy.integrate import quad
from scipy.optimize import brentq

LOOPS = {
    "2/(s(s+1)(s+2))": lambda s: 2 / (s * (s + 1) * (s + 2)),
    "1/(s(s+1)(s+2))": lambda s: 1 / (s * (s + 1) * (s + 2)),
    "5/((s+1)^2)": lambda s: 5 / (s + 1) ** 2,
    "20/((s+1)(s+3))": lambda s: 20 / ((s + 1) * (s + 3)),
    "10/((s-1)(s+5))": lambda s: 10 / ((s - 1) * (s + 5)),
}
RHP = {"10/((s-1)(s+5))": [1.0]}

def S(L, w): return 1 / (1 + L(1j * w))
def T(L, w): return L(1j * w) / (1 + L(1j * w))

def bode_integral(L):
    f = lambda w: np.log(abs(S(L, w)))
    return sum(quad(f, a, b, limit=500)[0] for a, b in [(0, 1), (1, 10), (10, 100), (100, 1e4)]) + quad(f, 1e4, np.inf)[0]

def margins(L):
    w = np.logspace(-3, 3, 200001); r = L(1j * w)
    ph = np.unwrap(np.angle(r)); mag = np.abs(r)
    i = np.where((mag[:-1] >= 1) & (mag[1:] < 1))[0]
    pm = 180 + np.degrees(ph[i[0]]) if len(i) else np.inf
    j = np.where((ph[:-1] > -np.pi) & (ph[1:] <= -np.pi))[0]
    gm = 1 / mag[j[0]] if len(j) else np.inf
    return gm, pm

def test_s_plus_t():
    w = np.logspace(-2, 2, 1000)
    for L in LOOPS.values():
        assert np.max(np.abs(S(L, w) + T(L, w) - 1)) < 1e-12

def test_bode_integral():
    for name, L in LOOPS.items():
        val = bode_integral(L)
        expect = np.pi * sum(RHP.get(name, []))
        print(f"{name:18s}: integral of ln|S| = {val:+.4f} (theory {expect:+.4f})")
        assert abs(val - expect) < 2e-3

def test_peak_sensitivity_bounds_margins():
    w = np.logspace(-3, 3, 200001)
    for name, L in LOOPS.items():
        if name in RHP: continue                      # margins assume an open-loop stable plant
        Ms = np.max(np.abs(S(L, w)))
        gm, pm = margins(L)
        gm_b, pm_b = Ms / (Ms - 1), np.degrees(2 * np.arcsin(1 / (2 * Ms)))
        print(f"{name:18s}: Ms = {Ms:.3f}; GM {gm:.2f} >= {gm_b:.2f}, PM {pm:.1f} >= {pm_b:.1f}")
        assert gm >= gm_b - 1e-9 and pm >= pm_b - 1e-6

def test_waterbed():
    lo = lambda L: np.mean(np.log(np.abs(S(L, np.linspace(0.01, 0.2, 50)))))
    pk = lambda L: np.max(np.abs(S(L, np.logspace(-2, 2, 20000))))
    L1, L2 = LOOPS["1/(s(s+1)(s+2))"], LOOPS["2/(s(s+1)(s+2))"]
    assert lo(L2) < lo(L1) and pk(L2) > pk(L1)        # better at low frequency, worse peak

test_s_plus_t()
test_bode_integral()
test_peak_sensitivity_bounds_margins()
test_waterbed()
print("PASS")
```
:::end

## Exercises

:::exercise
Your spec is $|S| < 0.1$ up to 1 rad/s and $|T| < 0.1$ above 3 rad/s. Is that reasonable?
:::solution
It's tight: the handover from $|S| = 0.1$ to $|T| = 0.1$ must happen within a factor of 3 in frequency. $L$ must fall from about 10 to about 0.1, 40 dB in half a decade, roughly −80 dB/decade, and steep roll-off brings large phase lag near crossover and a big sensitivity peak. Separate the two bands by a decade or more.
:::end

:::exercise
Why does an open-loop unstable plant need a higher bandwidth to control?
:::solution
Its Bode integral is $\pi p$ instead of 0, so sensitivity has to be above 1 over a large region. To keep the peak moderate the loop must spread that area over a wide band beyond the unstable pole: crossover has to be well above $p$. That's why the 13.8 s⁻¹ robot of lesson p12-l12 needs a loop much faster than 14 rad/s.
:::end

## Quiz

:::quiz
- type: num
  q: S + T at any frequency?
  answer: 1
  tol: 0
  py: "1"
  explain: (1 + L)/(1 + L).
- type: num
  q: Guaranteed gain margin for M_s = 2?
  answer: 2
  tol: 0.001
  py: "2/(2-1)"
  explain: M_s/(M_s − 1).
- type: num
  q: Guaranteed phase margin in degrees for M_s = 2?
  answer: 28.96
  tol: 0.005
  unit: °
  py: "__import__('math').degrees(2*__import__('math').asin(0.25))"
  explain: 2 arcsin(1/(2M_s)).
- type: num
  q: Bode integral of ln|S| for a loop with one open-loop RHP pole at s = 1?
  answer: 3.1416
  tol: 0.001
  py: "3.14159265"
  explain: π times the sum of RHP poles.
- type: mc
  q: Sensor noise reaches the output through…
  options:
    - T
    - S
    - the plant only
    - the integral
  answer: 0
  explain: The loop tracks the measurement.
- type: mc
  q: The waterbed effect says…
  options:
    - reducing |S| in one band raises it in another
    - S is always below 1
    - T and S are equal
    - feedback removes noise
  answer: 0
  explain: The integral of ln|S| is fixed.
:::end
