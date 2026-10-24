---
id: p05-l10
minutes: 35
summary: A diode is the simplest nonlinear part, and the first that needs a numerical solver. You meet the Shockley equation, see why a silicon diode "drops 0.6–0.7 V", find a diode-resistor operating point with a load line and with Newton's method, and measure the 60 mV-per-decade rule.
---

## The Shockley equation

A pn junction conducts easily one way and barely at all the other. Its current follows

$$i = I_s\left(e^{v/(nV_T)} - 1\right), \qquad V_T = \frac{kT}{q} \approx 25.85\ \text{mV at 300 K}.$$

- $I_s$, the saturation current, is tiny: around $10^{-14}$ A for a small silicon diode.
- $n$, the ideality factor, is between 1 and 2.
- In reverse ($v < 0$), $i \approx -I_s$: essentially off, until breakdown.

Because of the exponential, every factor of 10 in current costs only $nV_T\ln10 \approx 59.5$ mV (with $n = 1$). Between 1 mA and 100 mA the voltage moves only about 0.12 V. That's why you can treat a conducting silicon diode as a fixed 0.6–0.7 V drop for a first estimate. LEDs follow the same law with larger drops (about 1.8–3.3 V, set by the colour).

**Temperature.** $I_s$ rises steeply with temperature, so at fixed current the forward voltage falls by about 2 mV/°C. That makes diodes (and transistor junctions) cheap temperature sensors.

## Finding the operating point

A supply $V$ drives a resistor $R$ and a diode in series. Two equations must hold at once:

- diode: $i = I_s(e^{v/nV_T} - 1)$
- resistor (the **load line**): $i = (V - v)/R$

Graphically, the answer is where the curves cross. Numerically, solve $f(v) = I_s(e^{v/nV_T} - 1) - (V - v)/R = 0$ with Newton's method (Phase 02 lesson 13): $v \leftarrow v - f(v)/f'(v)$. Start near 0.6 V, because starting high can overflow the exponential. This is exactly what SPICE does at every nonlinear element.

:::figure widget=diode caption="The diode curve and the resistor load line. Their crossing is the operating point, found here by Newton's method."
:::end

## Worked example

$V = 5$ V, $R = 1$ kΩ, $I_s = 10^{-14}$ A, $n = 1$.

1. The 0.7 V estimate gives $i \approx 4.3/1000 = 4.3$ mA.
2. Newton from $v_0 = 0.6$ V converges in a few steps to $v = 0.6925$ V, $i = 4.3075$ mA.
3. Check: $10^{-14}e^{0.6925/0.02585} = 4.31$ mA. ✓
4. At 1 mA the diode drops 0.6547 V and at 10 mA 0.7143 V: 59.5 mV per decade.

## Code it from scratch

:::code file=diode.py
```python
import math

IS, NVT = 1e-14, 0.02585

def diode_i(v):
    return IS * (math.exp(v / NVT) - 1)

def operating_point(V, R, v=0.6, tol=1e-12):
    for k in range(100):
        f = diode_i(v) - (V - v) / R
        df = IS / NVT * math.exp(v / NVT) + 1 / R
        step = f / df
        v -= max(-0.1, min(0.1, step))            # limit the step, as SPICE does
        if abs(step) < tol:
            return v, (V - v) / R, k + 1
    raise RuntimeError("no convergence")

def bisect(V, R, lo=0.0, hi=1.0):
    for _ in range(200):
        mid = (lo + hi) / 2
        if diode_i(mid) - (V - mid) / R > 0:
            hi = mid
        else:
            lo = mid
    return mid

if __name__ == "__main__":
    v, i, iters = operating_point(5.0, 1000.0)
    print(f"V_D = {v:.5f} V, I = {i*1e3:.4f} mA after {iters} Newton steps")
    assert abs(v - 0.692490) < 1e-6 and abs(i - 4.30751e-3) < 1e-8 and iters < 15
    assert abs(bisect(5.0, 1000.0) - v) < 1e-9
    v1 = NVT * math.log(1e-3 / IS + 1)
    v10 = NVT * math.log(1e-2 / IS + 1)
    assert abs(v1 - 0.65474) < 1e-5 and abs((v10 - v1) - NVT * math.log(10)) < 1e-9
    # starting too high without step limiting would overflow math.exp; the limiter copes
    assert abs(operating_point(5.0, 1000.0, v=3.0)[0] - v) < 1e-9
```
:::end

## Exercises

:::exercise
Two of these diodes in series replace one. With $V = 5$ V and $R = 1$ kΩ, estimate the current using the 0.7 V rule, then say whether the true value is higher or lower.
:::solution
$(5 - 1.4)/1000 = 3.6$ mA. At 3.6 mA each diode drops a little less than 0.7 V (0.6878 V), so the true current is slightly higher: about 3.62 mA.
:::end

:::exercise
A diode carries 2 mA at 25 °C and drops 0.65 V. Estimate its drop at 75 °C at the same current.
:::solution
About −2 mV/°C × 50 °C = −0.1 V, so roughly 0.55 V.
:::end

## Quiz

:::quiz
- type: num
  q: What is the diode voltage at the 5 V, 1 kΩ operating point?
  answer: 0.69249
  tol: 0.001
  unit: V
  py: "0.692490375"
  explain: Newton's method on the diode and load-line equations.
- type: num
  q: How many mV per decade of current does an ideal (n = 1) diode need at 300 K?
  answer: 59.522
  tol: 0.002
  unit: mV
  py: "25.85*math.log(10)"
  explain: $nV_T\ln10$.
- type: num
  q: What is the forward voltage at 1 mA with Is = 1e-14 A?
  answer: 0.65474
  tol: 0.001
  unit: V
  py: "0.02585*math.log(1e-3/1e-14+1)"
  explain: 'Invert Shockley, giving $v = nV_T\ln(i/I_s + 1)$.'
- type: mc
  q: The resistor equation $i = (V - v)/R$ drawn on the diode's I-V plot is called the…
  options:
    - load line
    - Bode plot
    - phasor
    - knee
  answer: 0
  explain: Its crossing with the diode curve is the operating point.
- type: mc
  q: At constant current, a silicon diode's forward voltage with rising temperature…
  options:
    - rises by about 2 mV/°C
    - falls by about 2 mV/°C
    - doesn't change
    - doubles every 10 °C
  answer: 1
  explain: $I_s$ grows faster than $V_T$.
- type: num
  q: Rough current estimate (0.7 V rule) for 5 V, 1 kΩ and one diode, in mA?
  answer: 4.3
  tol: 0.001
  unit: mA
  py: "(5-0.7)/1000*1e3"
  explain: Good to within 0.2 %.
:::end

:::verify
import math
IS, NVT = 1e-14, 0.02585
v = 0.68
for _ in range(60):
    f = 2*NVT*math.log(((5-v*2)/1000)/IS+1) - 2*v; v += f/4
i = (5-2*v)/1000
assert abs(v-0.6878)<5e-4 and abs(i*1e3-3.624)<0.005
:::end
