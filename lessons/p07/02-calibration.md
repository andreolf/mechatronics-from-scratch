---
id: p07-l02
minutes: 35
summary: Calibration measures known references and fits the map from raw reading to physical value. You derive two-point and least-squares calibration, calibrate a simulated load cell from reference weights, and use the residuals to spot non-linearity and to check the result against its specification.
---

## Two points define a line

If the sensor is linear, $r = g\,m + o$, two known references $m_1, m_2$ with readings $r_1, r_2$ give

$$g = \frac{r_2 - r_1}{m_2 - m_1},\qquad o = r_1 - g\,m_1,\qquad \hat m = \frac{r - o}{g}.$$

It's quick, but all the noise of just two readings goes straight into $g$ and $o$.

## Least squares over many points

With $N$ references, stack the model as $\mathbf r = A\boldsymbol\theta$ with rows $[m_i, 1]$ and solve the normal equations from Phase 01:

$$\boldsymbol\theta = (A^\top A)^{-1}A^\top\mathbf r.$$

The noise averages out, and you get **residuals** $e_i = r_i - \hat r_i$ to inspect:

- Residuals that look random, with an rms near the sensor noise, mean the model fits.
- A curved pattern (a bow) means non-linearity. Add a quadratic column $m_i^2$, or calibrate piecewise.
- One large residual is an outlier: a bad reference or a misread.

Spread the reference points across the whole range, and include the ends. Extrapolating outside the calibrated range is a guess.

:::figure widget=lsq caption="The same least-squares fit applied to a motor's torque constant. Add noise or reduce the samples and watch the fitted slope's error grow."
:::end

## Worked example

A load cell reads 1012 counts empty and 53 412 counts with a 5.000 kg reference.

1. Two-point: $g = (53\,412 - 1012)/5 = 10\,480$ counts/kg and $o = 1012$ counts.
2. A reading of 22 000 counts gives $\hat m = (22\,000 - 1012)/10\,480 = 2.0027$ kg.
3. If each reading has 20 counts rms noise, the two-point slope has an uncertainty of about $\sqrt2\times20/5 = 5.7$ counts/kg, or 0.054 % of the slope.
4. Each single reading also carries the noise: 20 counts is 1.9 g. Averaging 16 samples per reading brings it to 0.5 g.
5. A least-squares fit over 11 points (0 to 5 kg in 0.5 kg steps) cuts that by about 2.5× and shows any bow in the residuals.

## Code it from scratch

:::code file=calibrate.py
```python
import numpy as np

rng = np.random.default_rng(4)
G_TRUE, O_TRUE, BOW, NOISE = 10_480.0, 1012.0, 30.0, 20.0     # counts/kg, counts, counts at mid-scale, counts rms

def load_cell(m):
    x = np.asarray(m) / 5.0
    return G_TRUE * np.asarray(m) + O_TRUE + BOW * 4 * x * (1 - x) + NOISE * rng.standard_normal(np.shape(m))

def fit(m, r, quadratic=False):
    cols = [m, np.ones_like(m)] + ([m**2] if quadratic else [])
    A = np.column_stack(cols)
    theta = np.linalg.solve(A.T @ A, A.T @ r)
    return theta, r - A @ theta

def invert(theta, r):
    if len(theta) == 2:
        g, o = theta
        return (r - o) / g
    g, o, q = theta                                            # q m^2 + g m + o = r
    return (-g + np.sqrt(g * g - 4 * q * (o - r))) / (2 * q)

if __name__ == "__main__":
    refs = np.linspace(0, 5, 11)
    r = load_cell(refs)
    two = np.array([(r[-1] - r[0]) / 5, r[0]])
    lin, res_lin = fit(refs, r)
    quad, res_q = fit(refs, r, quadratic=True)
    print("two-point g, o:", two.round(1), " least squares:", lin.round(1), " residual rms:", res_lin.std().round(1), "->", res_q.std().round(1))
    # the linear fit leaves a bow: residuals at the ends and middle have opposite signs
    assert res_lin[5] > 0 and res_lin[0] < 0 and res_lin[-1] < 0
    assert res_q.std() < res_lin.std()
    # check against the spec on fresh readings, each the mean of 16 samples: |error| < 0.1 % of full scale (5 g)
    test_m = rng.uniform(0, 5, 500)
    test_r = np.mean([load_cell(test_m) for _ in range(16)], axis=0)
    err = invert(quad, test_r) - test_m
    print(f"after quadratic calibration: max error {1000*np.abs(err).max():.2f} g")
    assert np.abs(err).max() < 0.005
    assert np.abs(invert(np.array([10_480.0, 1012.0]), 22_000) - 2.0027) < 1e-4
```
:::end

## Exercises

:::exercise
Your residuals after a linear fit are about +3, −1, −4, −1, +3 counts at 0, 25, 50, 75 and 100 % of the range. What does that tell you?
:::solution
A symmetric bow: the sensor is non-linear (curved), not just noisy. Fit a quadratic term, or calibrate with a lookup table.
:::end

:::exercise
Why should calibration references span the whole working range?
:::solution
The fit is only trustworthy where it has data. Outside it, slope errors grow with the distance, and any non-linearity goes unseen.
:::end

## Quiz

:::quiz
- type: num
  q: Gain in counts/kg from 1012 counts at 0 kg and 53 412 counts at 5 kg?
  answer: 10480
  tol: 0.001
  unit: counts/kg
  py: "(53412-1012)/5"
  explain: Rise over run.
- type: num
  q: Mass in kg for a reading of 22 000 counts?
  answer: 2.00267
  tol: 0.001
  unit: kg
  py: "(22000-1012)/10480"
  explain: Subtract the offset, divide by the gain.
- type: mc
  q: Residuals that form a smooth bow indicate…
  options:
    - random noise
    - non-linearity the model doesn't capture
    - a perfect fit
    - an offset error
  answer: 1
  explain: Noise doesn't have a shape.
- type: mc
  q: Least squares improves on a two-point calibration because…
  options:
    - it needs no references
    - noise averages over many points, and residuals can be inspected
    - it is always exact
    - it removes hysteresis
  answer: 1
  explain: More data and a diagnostic.
- type: num
  q: Uncertainty in counts/kg of a two-point slope over 5 kg with 20 counts rms noise per reading?
  answer: 5.657
  tol: 0.002
  unit: counts/kg
  py: "math.sqrt(2)*20/5"
  explain: Two independent readings.
- type: num
  q: 0.1 % of a 5 kg full scale in grams?
  answer: 5
  tol: 0.001
  unit: g
  py: "5000*0.001"
  explain: The spec used in the code.
:::end

:::verify
assert (53412-1012)/5 == 10480
:::end
