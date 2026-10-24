---
id: p07-l13
minutes: 35
summary: Light travels a metre in 3.3 ns, so optical rangers either time very short pulses or measure the phase of modulated light. You derive phase-shift ranging and its ambiguity distance, unwrap it with two frequencies, and convert a raw 2D LiDAR scan into points that match a ground-truth wall.
---

## Two ways to time light

**Direct time of flight**: fire a nanosecond laser pulse and time the return with a fast counter or a time-to-digital converter. One millimetre of range is 6.7 ps of round trip, so the electronics are demanding; single-photon detectors and histogramming over many pulses make it practical (most rotating LiDARs and VL53-type sensors).

**Indirect (phase-shift) ToF**: modulate the light's intensity at frequency $f$ and measure the phase lag $\Delta\varphi$ of the returned modulation:

$$d = \frac{c\,\Delta\varphi}{4\pi f}.$$

The phase wraps every $2\pi$, so distances repeat every **ambiguity distance**

$$d_{amb} = \frac{c}{2f}.$$

That's 7.5 m at 20 MHz. A higher $f$ gives better precision for the same phase noise, but a shorter unambiguous range. Use **two frequencies**: the combination is unambiguous up to the range set by their greatest common divisor, while the higher one gives the precision.

## From a scan to points

A 2D scanning LiDAR rotates a ranger and reports $(\theta_i, r_i)$ pairs. In the sensor frame,

$$x_i = r_i\cos\theta_i,\qquad y_i = r_i\sin\theta_i.$$

Then transform into the robot or world frame with the sensor's pose (Phase 01 rotations). Real scans contain **invalid returns**: 0 or the maximum range for no echo, plus mixed pixels at edges, where the beam hits two surfaces. Filter them before using the points.

:::figure widget=itof caption="Reported against true distance for a phase-measuring sensor. Past the ambiguity distance the reading wraps back to zero; raise the frequency and it wraps sooner."
:::end

## Worked example

A sensor modulates at 20 MHz and measures a phase of 1.2 rad.

1. $d_{amb} = 3\times10^8/(2\times2\times10^7) = 7.49$ m.
2. $d = 3\times10^8\times1.2/(4\pi\times2\times10^7) = 1.431$ m, or $1.431 + 7.49k$ m for integer $k$.
3. A second measurement at 25 MHz ($d_{amb} = 6.0$ m) picks which $k$ fits both. Together they're unambiguous to $c/(2\times5\text{ MHz}) = 30$ m.
4. A LiDAR return at 30° and 2.31 m becomes the point $(2.000, 1.155)$ m.

## Code it from scratch

:::code file=lidar.py
```python
import numpy as np

C = 299_792_458.0
rng = np.random.default_rng(13)

def phase_of(d, f):
    return (4 * np.pi * f * d / C) % (2 * np.pi)

def unwrap_two(phi1, f1, phi2, f2, d_max):
    """Pick the distance consistent with both phases (search over wraps of f1)."""
    amb1 = C / (2 * f1)
    cands = phi1 * C / (4 * np.pi * f1) + amb1 * np.arange(int(d_max / amb1) + 1)
    err = np.angle(np.exp(1j * (phase_of(cands, f2) - phi2)))
    return cands[np.argmin(np.abs(err))]

def scan_to_points(angles, ranges, r_min=0.05, r_max=12.0):
    ok = (ranges > r_min) & (ranges < r_max)
    return np.column_stack([ranges[ok] * np.cos(angles[ok]), ranges[ok] * np.sin(angles[ok])])

if __name__ == "__main__":
    assert abs(C / (2 * 20e6) - 7.4948) < 1e-3
    d = C * 1.2 / (4 * np.pi * 20e6)
    assert abs(d - 1.4313) < 1e-3
    for true_d in (1.4, 9.7, 17.3, 28.2):
        est = unwrap_two(phase_of(true_d, 20e6), 20e6, phase_of(true_d, 25e6), 25e6, d_max=29.9)
        assert abs(est - true_d) < 1e-6, (true_d, est)
    # simulate a 2D scan of a wall at y = 2 m (x from -3 to 3), 1 mm noise, plus dropouts
    angles = np.radians(np.arange(0, 360, 0.5))
    ranges = np.full(angles.size, 0.0)                          # 0 = no return
    sin = np.sin(angles)
    hit = sin > 2 / np.hypot(3, 2)                              # rays that reach the wall segment
    ranges[hit] = 2 / sin[hit] + 0.001 * rng.standard_normal(hit.sum())
    ranges[rng.choice(np.flatnonzero(hit), 10, replace=False)] = 0.0   # dropouts
    pts = scan_to_points(angles, ranges)
    assert len(pts) == hit.sum() - 10
    a, b = np.polyfit(pts[:, 0], pts[:, 1], 1)                   # fit y = a x + b
    print(f"{len(pts)} points, wall fit y = {a:.4f} x + {b:.4f}, rms residual {np.std(pts[:,1]-(a*pts[:,0]+b))*1000:.2f} mm")
    assert abs(a) < 0.002 and abs(b - 2) < 0.002 and np.abs(pts[:, 1] - 2).max() < 0.01
    assert np.allclose(scan_to_points(np.radians([30]), np.array([2.31])), [[2.0005, 1.155]], atol=1e-3)
```
:::end

## Exercises

:::exercise
A phase measurement has 1 mrad of noise. What is the range noise at 20 MHz and at 100 MHz?
:::solution
$\sigma_d = c\,\sigma_\varphi/(4\pi f)$: 1.2 mm at 20 MHz and 0.24 mm at 100 MHz. The ambiguity distance shrinks to 1.5 m, though.
:::end

:::exercise
Why does a beam that grazes the edge of a box produce points floating in mid-air?
:::solution
The beam footprint hits both the box edge and the wall behind it. The sensor measures a mixture of the two returns and reports a distance in between: a *mixed pixel*. Filter points that jump between neighbours.
:::end

## Quiz

:::quiz
- type: num
  q: Ambiguity distance in m at 20 MHz?
  answer: 7.4948
  tol: 0.001
  unit: m
  py: "299792458/(2*20e6)"
  explain: c/(2f).
- type: num
  q: Distance in m for a 1.2 rad phase at 20 MHz?
  answer: 1.4313
  tol: 0.001
  unit: m
  py: "299792458*1.2/(4*math.pi*20e6)"
  explain: cΔφ/(4πf).
- type: num
  q: Unambiguous range in m of 20 and 25 MHz combined?
  answer: 29.979
  tol: 0.001
  unit: m
  py: "299792458/(2*5e6)"
  explain: Their difference, 5 MHz.
- type: num
  q: Round-trip time in ps for 1 mm of range?
  answer: 6.6713
  tol: 0.002
  unit: ps
  py: "2e-3/299792458*1e12"
  explain: Light is fast.
- type: mc
  q: A LiDAR range of exactly 0 usually means…
  options:
    - an object touching the sensor
    - no return; discard it
    - maximum precision
    - a mixed pixel
  answer: 1
  explain: Filter invalid returns.
- type: num
  q: The y coordinate in m of a return at 30° and 2.31 m?
  answer: 1.155
  tol: 0.001
  unit: m
  py: "2.31*math.sin(math.radians(30))"
  explain: r sin θ.
:::end

:::verify
import math
assert abs(299792458*1e-3/(4*math.pi*20e6) - 1.19e-3) < 1e-5
:::end
