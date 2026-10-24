---
id: p07-l05
minutes: 35
summary: An NTC thermistor's resistance falls steeply and non-linearly with temperature. You compare the two-point β equation with the three-term Steinhart-Hart equation, fit the coefficients from a resistance table by solving a 3×3 system, and reach better than 0.2 K over 0 to 80 °C.
---

## A resistance that falls with temperature

An NTC thermistor is a ceramic semiconductor: warming it frees charge carriers, so its resistance falls by roughly 4 % per kelvin near room temperature. A 10 kΩ part (at 25 °C) is about 35 kΩ at 0 °C and 1.2 kΩ at 85 °C. That steep slope makes it sensitive and cheap, ideal for battery packs, motor windings and heatsinks, but very non-linear.

## Two models

**The β equation** comes from a two-point datasheet value, usually β(25/85):

$$\frac1T = \frac1{T_{25}} + \frac1\beta\ln\frac{R}{R_{25}}.$$

It's only exact at the two points; it drifts by a kelvin or more across a wide range.

**The Steinhart-Hart equation** adds a cubic term:

$$\frac1T = A + B\ln R + C(\ln R)^3.$$

It is linear in $A, B, C$, so three table points give a $3\times3$ linear system. Choose them spread across the range (0, 40 and 80 °C here). With more points, use least squares (lesson 2). The fit typically holds to a few hundredths of a kelvin.

**Reading it**: put the thermistor in a divider with a fixed resistor $R_f$ (often equal to $R_{25}$) and measure ratiometrically. Then $R = R_f\cdot\text{code}/(2^n - \text{code})$, and the model gives $T$. Keep the current low: self-heating is about 1 mK per µW in still air.

:::figure widget=thermistor caption="Temperature error of each model against the true curve. The β equation drifts outside ±0.2 K; Steinhart-Hart stays well inside it."
:::end

## Worked example

From the table: $R(0\,°C) = 34.58$ kΩ, $R(40\,°C) = 5.343$ kΩ and $R(80\,°C) = 1.379$ kΩ (the curve used in the code, rounded).

1. Write $L_i = \ln R_i$ and $y_i = 1/T_i$ with $T_i$ in kelvin.
2. Solve $\begin{bmatrix}1 & L_i & L_i^3\end{bmatrix}\begin{bmatrix}A\\B\\C\end{bmatrix} = y_i$ for the three points.
3. Check between the points, for example at 20 °C (12.55 kΩ): over the whole range the fit stays within 0.07 K.
4. The datasheet β(25/85) = 3781 K model is off by up to 1.6 K across 0–80 °C, because a single β can't follow the curve's change of slope.

## Code it from scratch

:::code file=steinhart_hart.py
```python
import numpy as np

T25 = 298.15
def true_lnR(T):
    """The 'real' part, as a resistance table would give it (10 kOhm at 25 C)."""
    u = 1 / T - 1 / T25
    return np.log(1e4) + 3950 * u + 3e5 * u * u

def fit_sh(T_points):
    L = true_lnR(np.asarray(T_points))
    A = np.column_stack([np.ones_like(L), L, L**3])
    return np.linalg.solve(A, 1 / np.asarray(T_points))

def sh_T(abc, R):
    L = np.log(R)
    return 1 / (abc[0] + abc[1] * L + abc[2] * L**3)

def beta_T(beta, R):
    return 1 / (1 / T25 + np.log(R / 1e4) / beta)

def r_from_code(code, bits=12, Rf=10e3):
    return Rf * code / (2**bits - code)                       # thermistor on the low side of the divider

if __name__ == "__main__":
    K = 273.15
    print("R at 0, 25, 40, 80, 85 C:", np.exp(true_lnR(np.array([0, 25, 40, 80, 85]) + K)).round(0))
    abc = fit_sh([0 + K, 40 + K, 80 + K])
    T = np.linspace(0, 80, 801) + K
    R = np.exp(true_lnR(T))
    err_sh = np.abs(sh_T(abc, R) - T).max()
    beta = (true_lnR(25 + K) - true_lnR(85 + K)) / (1 / (25 + K) - 1 / (85 + K))
    err_beta = np.abs(beta_T(beta, R) - T).max()
    print(f"Steinhart-Hart A, B, C = {abc}, max error {err_sh:.3f} K; beta(25/85) = {beta:.0f} K, max error {err_beta:.2f} K")
    assert err_sh < 0.2 and err_beta > 1.0
    # through a 12-bit ratiometric divider at 30 C
    Rt = float(np.exp(true_lnR(30 + K)))
    code = round(4096 * Rt / (Rt + 10e3))
    T_meas = sh_T(abc, r_from_code(code)) - K
    assert abs(T_meas - 30) < 0.05
```
:::end

## Exercises

:::exercise
Why is the Steinhart-Hart fit a linear problem even though the curve is very non-linear?
:::solution
The unknowns $A, B, C$ appear linearly: $1/T$ is a linear combination of $1$, $\ln R$ and $(\ln R)^3$. The non-linearity sits in the known regressors, not in the parameters.
:::end

:::exercise
A 10 kΩ thermistor sits in a divider with 10 kΩ on 3.3 V. How much power does it dissipate at 25 °C, and roughly how much does it self-heat at 1 mK/µW?
:::solution
Half the supply across each: $1.65^2/10\,000 = 272$ µW, so about 0.27 K. That's significant against a 0.2 K target. Use a larger divider resistance or power the divider only while sampling.
:::end

## Quiz

:::quiz
- type: mc
  q: The Steinhart-Hart equation models…
  options:
    - R as a polynomial in T
    - 1/T as A + B ln R + C (ln R)^3
    - T as linear in R
    - the β value only
  answer: 1
  explain: Three coefficients.
- type: num
  q: Minimum number of table points to determine A, B and C?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Three unknowns.
- type: num
  q: Self-heating power in µW of a 10 kΩ thermistor with 1.65 V across it?
  answer: 272.25
  tol: 0.002
  unit: µW
  py: "1.65**2/10e3*1e6"
  explain: V²/R.
- type: num
  q: Thermistor resistance in kΩ when a 12-bit divider (10 kΩ fixed, thermistor low) reads 2048?
  answer: 10
  tol: 0.001
  unit: kΩ
  py: "10*2048/(4096-2048)"
  explain: Mid-scale means equal resistances.
- type: mc
  q: The β equation is exact…
  options:
    - everywhere
    - only at its two defining temperatures
    - only at 0 °C
    - never
  answer: 1
  explain: It's a two-point model.
- type: num
  q: Approximate self-heating in K at 1 mK/µW and 272 µW?
  answer: 0.272
  tol: 0.01
  unit: K
  py: "272e-3"
  explain: Comparable to the accuracy target.
:::end

:::verify
import math
assert abs(1.65**2/1e4 - 272.25e-6) < 1e-12
:::end
