---
id: p07-l11
minutes: 40
summary: A magnetometer gives heading from the Earth's field, until nearby steel and magnets distort it. You model hard-iron offsets and soft-iron distortion, fit an ellipsoid to readings taken while tumbling the device, map it back to a sphere, and get heading within 2 degrees.
---

## Heading from the Earth's field

The Earth's field is 25–65 µT, with a horizontal component pointing to magnetic north and a vertical component (the *inclination*) pointing down in the northern hemisphere. With the device level, the heading is

$$\psi = \operatorname{atan2}(-m_y, m_x).$$

When tilted, first rotate the reading into the horizontal plane using roll and pitch from the accelerometer (lesson 9): a *tilt-compensated compass*.

## Hard and soft iron

Mounted in a robot, the sensor sees more than the Earth:

- **Hard iron**: permanent magnets and magnetised steel add a constant vector $\mathbf h$ that rotates with the device. It shifts the sphere of readings off-centre.
- **Soft iron**: nearby ferrous material bends the field, so the readings are a linear map $S$ of the true field. It stretches the sphere into an ellipsoid.

$$\mathbf m_{raw} = S\,\mathbf m + \mathbf h + \text{noise}.$$

## Ellipsoid fit

Tumble the device through many orientations. The true field has constant magnitude, so the raw readings lie on an ellipsoid:

$$(\mathbf m_{raw} - \mathbf h)^\top M(\mathbf m_{raw} - \mathbf h) = 1.$$

Expanding gives an equation that is **linear** in 9 unknowns (6 for the symmetric quadratic part, 3 for the linear part), which least squares solves (lesson 2). From the fit:

1. Centre $\mathbf h = -A^{-1}\mathbf g$.
2. Shape: $M = A/k$ with $k = 1 + \mathbf h^\top A\,\mathbf h$.
3. Correction: $\mathbf m = B\,M^{1/2}(\mathbf m_{raw} - \mathbf h)$, which puts the readings back on a sphere of radius $B$.

:::figure widget=magcal caption="Readings while turning a full circle, level. Hard iron shifts the circle, soft iron stretches it; turn on the calibration to map it back."
:::end

## Worked example

A level robot reads $m_x = 37$ µT, $m_y = -23$ µT. The calibration found a hard-iron offset of (15, −8) µT and no soft iron.

1. Raw heading: $\operatorname{atan2}(23, 37) = 31.9°$.
2. Corrected: $(37 - 15, -23 + 8) = (22, -15)$, so $\operatorname{atan2}(15, 22) = 34.3°$.
3. The offset caused a 2.4° error at this heading. It's worse at other headings: for a 20 µT horizontal field, a 17 µT offset can cause errors of tens of degrees.

## Code it from scratch

:::code file=mag_calibration.py
```python
import numpy as np

rng = np.random.default_rng(12)
B_WORLD = np.array([20.0, 0.0, -40.0])                       # µT: north and down (x north, z up)
S = np.array([[1.25, 0.10, 0.02], [0.10, 0.90, -0.05], [0.02, -0.05, 1.05]])   # symmetric soft iron
H = np.array([15.0, -8.0, 22.0])                              # hard iron

def rot(yaw, pitch, roll):
    cy, sy, cp, sp, cr, sr = np.cos(yaw), np.sin(yaw), np.cos(pitch), np.sin(pitch), np.cos(roll), np.sin(roll)
    Rz = np.array([[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]])
    Ry = np.array([[cp, 0, sp], [0, 1, 0], [-sp, 0, cp]])
    Rx = np.array([[1, 0, 0], [0, cr, -sr], [0, sr, cr]])
    return Rz @ Ry @ Rx                                          # body -> world

def read(R):
    return S @ (R.T @ B_WORLD) + H + 0.3 * rng.standard_normal(3)

def fit_ellipsoid(P):
    x, y, z = P.T
    D = np.column_stack([x*x, y*y, z*z, 2*x*y, 2*x*z, 2*y*z, 2*x, 2*y, 2*z])
    p = np.linalg.lstsq(D, np.ones(len(P)), rcond=None)[0]
    A = np.array([[p[0], p[3], p[4]], [p[3], p[1], p[5]], [p[4], p[5], p[2]]])
    g = p[6:]
    h = -np.linalg.solve(A, g)
    M = A / (1 + h @ A @ h)
    w, V = np.linalg.eigh(M)
    return h, V @ np.diag(np.sqrt(w)) @ V.T                     # centre and M^(1/2)

def heading(m):
    return np.degrees(np.arctan2(-m[1], m[0]))

if __name__ == "__main__":
    samples = np.array([read(rot(*rng.uniform([-np.pi, -1.2, -np.pi], [np.pi, 1.2, np.pi]))) for _ in range(400)])
    h, Mh = fit_ellipsoid(samples)
    Bmag = np.linalg.norm(B_WORLD)
    print("hard iron estimate:", h.round(2))
    assert np.allclose(h, H, atol=0.5)
    radii = np.linalg.norm((samples - h) @ Mh.T, axis=1)
    assert np.abs(radii - 1).max() < 0.03                       # back on the unit sphere
    worst_raw = worst_cal = 0.0
    for yaw in np.radians(np.arange(0, 360, 5)):                 # level headings
        raw = read(rot(yaw, 0, 0))
        cal = Bmag * Mh @ (raw - h)
        true = np.degrees(yaw)
        wrap = lambda a: (a + 180) % 360 - 180
        worst_raw = max(worst_raw, abs(wrap(heading(raw) - true)))
        worst_cal = max(worst_cal, abs(wrap(heading(cal) - true)))
    print(f"worst level heading error: raw {worst_raw:.1f} deg, calibrated {worst_cal:.2f} deg")
    assert worst_cal < 2 and worst_raw > 20
```
:::end

## Exercises

:::exercise
Why must you tumble the device in 3D, not just spin it flat, for a full ellipsoid fit?
:::solution
A flat spin only samples one slice of the ellipsoid, so the fit can't determine the vertical offset or the shape along the other axes. The least-squares problem becomes ill-conditioned.
:::end

:::exercise
A motor current changes the field near the sensor. Can a one-time calibration fix that?
:::solution
No. Calibration fixes constant hard iron and linear soft iron. A current-dependent field varies in time: move the sensor away, or model the disturbance against the measured current.
:::end

## Quiz

:::quiz
- type: num
  q: Raw heading in degrees for m_x = 37 µT, m_y = −23 µT?
  answer: 31.866
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan2(23,37))"
  explain: atan2(−m_y, m_x).
- type: num
  q: Corrected heading in degrees after removing an offset of (15, −8) µT?
  answer: 34.287
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan2(15,22))"
  explain: Subtract the offset first.
- type: mc
  q: Hard iron…
  options:
    - stretches the sphere of readings
    - shifts its centre
    - rotates the Earth's field
    - adds noise
  answer: 1
  explain: A constant offset vector.
- type: mc
  q: Soft iron turns the sphere of readings into…
  options:
    - a shifted sphere
    - an ellipsoid
    - a plane
    - a line
  answer: 1
  explain: A linear map.
- type: num
  q: Unknowns in the linear ellipsoid fit?
  answer: 9
  tol: 0.001
  py: "6+3"
  explain: Six quadratic and three linear terms.
- type: num
  q: Magnitude in µT of a field of (20, 0, −40) µT?
  answer: 44.721
  tol: 0.002
  unit: µT
  py: "math.hypot(20,40)"
  explain: Typical for mid-latitudes.
:::end

:::verify
import math
assert abs(math.hypot(20,40) - 44.72) < 0.01
:::end
