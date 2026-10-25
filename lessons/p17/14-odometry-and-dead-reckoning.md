---
id: p17-l14
minutes: 35
summary: A wheeled robot can estimate its pose by counting wheel turns, but the error grows without bound. You implement differential-drive dead reckoning, propagate a wheel-noise error model through the motion Jacobians, confirm it against a Monte Carlo simulation (sideways error growing as distance to the power 1.5), and see how a 0.5 % wheel mismatch bends a straight run, then map it to ROS 2 odometry.
---

## Dead reckoning

A differential-drive robot with wheel separation $b$ measures each wheel's travel $\Delta_l, \Delta_r$ from its encoders. Per step:

$$\Delta s = \frac{\Delta_l + \Delta_r}{2}, \qquad \Delta\theta = \frac{\Delta_r - \Delta_l}{b}.$$

Over a step with constant wheel speeds the robot moves on an arc; its chord has length $\Delta s\,\operatorname{sinc}(\Delta\theta/2)$ and points along the mid-heading $\theta + \Delta\theta/2$. Integrating these steps is **dead reckoning** (odometry). IMUs and visual odometry (lesson 13) give the same kind of relative motion.

## How errors grow

Model each wheel's travel error as independent with variance $k^2|\Delta|$, so it grows with distance. Map it to $(\Delta s, \Delta\theta)$ and push the pose covariance through the linearised motion:

$$P \leftarrow F P F^\top + G Q G^\top,$$

where $F = \partial(\text{new pose})/\partial(\text{pose})$ and $G = \partial(\text{new pose})/\partial(\Delta s, \Delta\theta)$, the prediction step of an EKF (lesson 16). On a straight run:

- heading error grows like $\sqrt s$ (a random walk);
- along-track error grows like $\sqrt s$;
- **sideways** error integrates the heading error and grows like $s^{3/2}$, so it dominates.

## Systematic errors

Random noise is the smaller problem. Unequal wheel diameters or a wrong wheel base give a **bias**: a 0.5 % mismatch turns the robot by $\kappa = 0.005/b$ rad per metre, so a "straight" run curves sideways by about $\kappa s^2/2$. Calibrate these out (for example with the UMBmark square test), then fuse odometry with absolute measurements (lessons 15 and 16).

:::figure widget=drift caption="Many simulated runs of an illustrative robot told to drive straight, with their spread and the predicted 2-sigma ellipse. Change the wheel noise, the wheel mismatch and the distance."
:::end

## Worked example

An illustrative robot with $b = 0.40$ m driving at 0.5 m/s with 20 ms steps.

1. Right wheel 20 % faster: turning radius $\frac{b}{2}\frac{1 + 1.2}{1.2 - 1} = 2.20$ m; after 5.5 m of travel the heading is 143.2° and the end point lies exactly on the circle.
2. 5 m straight with wheel noise $k = 1$ cm per $\sqrt{\text{m}}$, 2000 Monte Carlo runs: $\sigma_y = 22.81$ cm and $\sigma_\theta = 4.51°$; the propagated covariance predicts 22.82 cm and 4.53°.
3. Along-track: Monte Carlo 1.84 cm, model 1.58 cm. The difference is the mean shortfall of 0.73 cm from $\cos(\text{heading error}) < 1$, a second-order effect the linear model leaves out.
4. Four times the distance multiplies along-track and heading sigma by 2.00 and sideways sigma by 8.00.
5. A 0.5 % larger right wheel: 15.7 cm sideways after 5 m and 3.58° of heading; $\kappa s^2/2$ predicts 15.6 cm.

## Code it from scratch

:::code file=odometry.py
```python
import numpy as np

WHEEL_BASE = 0.40                                                      # illustrative differential-drive robot, m
DT = 0.02

def step(pose, dl, dr, b=WHEEL_BASE):
    """dead reckoning from wheel travel: ds = (dl + dr)/2, dtheta = (dr - dl)/b. Constant wheel speeds within a step
    trace an arc, whose chord is ds sinc(dtheta/2) long and points along the mid-heading"""
    x, y, th = pose; ds = 0.5 * (dl + dr); dth = (dr - dl) / b
    c = ds * np.sinc(dth / (2 * np.pi))                                   # np.sinc(x) = sin(pi x)/(pi x)
    return np.array([x + c * np.cos(th + dth / 2), y + c * np.sin(th + dth / 2), th + dth])

def drive(dl, dr, pose=(0.0, 0.0, 0.0)):
    poses = [np.array(pose, float)]
    for a, c in zip(dl, dr): poses.append(step(poses[-1], a, c))
    return np.array(poses)

def straight_run(n=500, v=0.5):
    d = np.full(n, v * DT); return d, d.copy()                           # 5 m straight at 0.5 m/s

def jacobians(pose, ds, dth):
    x, y, th = pose; a = th + dth / 2
    F = np.array([[1, 0, -ds * np.sin(a)], [0, 1, ds * np.cos(a)], [0, 0, 1]])
    G = np.array([[np.cos(a), -ds * np.sin(a) / 2], [np.sin(a), ds * np.cos(a) / 2], [0, 1]])
    return F, G

def propagate_cov(dl, dr, k=0.01, b=WHEEL_BASE):
    """error model: each wheel's travel has variance k^2 |d| (errors grow with distance, independent per step).
    Map to (ds, dtheta) and push through the motion Jacobians: P <- F P F' + G Q G'"""
    pose = np.zeros(3); P = np.zeros((3, 3))
    for a, c in zip(dl, dr):
        Qw = np.diag([k ** 2 * abs(a), k ** 2 * abs(c)]); M = np.array([[0.5, 0.5], [-1 / b, 1 / b]])
        ds, dth = 0.5 * (a + c), (c - a) / b; F, G = jacobians(pose, ds, dth)
        P = F @ P @ F.T + G @ (M @ Qw @ M.T) @ G.T; pose = step(pose, a, c)
    return P

def monte_carlo(dl, dr, k=0.01, runs=2000, seed=0):
    rng = np.random.default_rng(seed); ends = np.empty((runs, 3))
    for r in range(runs):
        nl = rng.normal(0, k * np.sqrt(np.abs(dl))); nr = rng.normal(0, k * np.sqrt(np.abs(dr)))
        ends[r] = drive(dl + nl, dr + nr)[-1]
    return ends

def test_kinematics():
    dl, dr = np.full(500, 0.5 * DT), np.full(500, 0.5 * DT * 1.2)     # right wheel 20 % faster: a circle
    p = drive(dl, dr)
    R = WHEEL_BASE / 2 * (1 + 1.2) / (1.2 - 1)
    dist = np.hypot(*p[-1, :2]); chord = 2 * R * np.sin(p[-1, 2] / 2)
    print(f"right wheel 20 % faster: turning radius {R:.2f} m, heading after 5.5 m of travel {np.degrees(p[-1, 2]):.1f} deg, end point on the circle: {abs(dist - chord) < 1e-9}")
    assert abs(dist - chord) < 1e-9

def test_drift_matches_model():
    dl, dr = straight_run(); ends = monte_carlo(dl, dr); P = propagate_cov(dl, dr)
    sx, sy, st = ends.std(0); px, py_, pt = np.sqrt(np.diag(P))
    print(f"5 m straight, wheel noise 1 cm per sqrt(m): Monte Carlo sigma x {100 * sx:.2f} cm, y {100 * sy:.2f} cm, heading {np.degrees(st):.2f} deg")
    print(f"propagated covariance:               sigma x {100 * px:.2f} cm, y {100 * py_:.2f} cm, heading {np.degrees(pt):.2f} deg")
    assert abs(sy / py_ - 1) < 0.05 and abs(st / pt - 1) < 0.05
    short = ends[:, 0].mean() - 5.0                                     # cos(heading error) < 1 shortens the run:
    print(f"mean along-track shortfall {100 * short:.2f} cm, a second-order effect the linear model leaves out")
    assert short < 0 and sx > px                                        # the linearisation misses it
    assert sy > 3 * sx                                                  # heading error makes the sideways error dominate

def test_growth_rates():
    """along-track error grows like sqrt(s); heading error like sqrt(s); sideways error like s^1.5"""
    out = []
    for n in (250, 1000):
        P = propagate_cov(*straight_run(n)); out.append(np.sqrt(np.diag(P)))
    r = out[1] / out[0]
    print(f"4 x the distance: along-track sigma x {r[0]:.2f}, sideways x {r[1]:.2f}, heading x {r[2]:.2f}")
    assert abs(r[0] - 2) < 0.01 and abs(r[1] - 8) < 0.1 and abs(r[2] - 2) < 0.01

def test_systematic_bias():
    dl, dr = straight_run(); p = drive(dl * 1.0, dr * 1.005)          # right wheel 0.5 % larger in diameter
    print(f"a 0.5 % wheel-size mismatch: {100 * p[-1, 1]:.1f} cm sideways after 5 m, heading {np.degrees(p[-1, 2]):.2f} deg")
    kappa = 0.005 / WHEEL_BASE                                        # curvature: heading change per metre, about
    print(f"small-angle prediction kappa s^2 / 2 = {100 * kappa * 25 / 2:.1f} cm")
    assert abs(p[-1, 1] - kappa * 25 / 2) < 0.005

test_kinematics()
test_drift_matches_model()
test_growth_rates()
test_systematic_bias()
print("PASS")
```
:::end

## In practice

In ROS 2 a base driver publishes `nav_msgs/Odometry` on `/odom` with the pose, twist and their covariances, and broadcasts the `odom → base_link` transform. `robot_localization` fuses wheel odometry with an IMU in an EKF, and a localiser (Nav2's AMCL, lesson 15) publishes `map → odom` to correct the drift.

## Exercises

:::exercise
Heading error on a straight run grows to 4.5° after 5 m. What heading error do you expect after 20 m, and roughly how large is the sideways error then?
:::solution
Heading error grows like $\sqrt s$: $4.5 \times 2 = 9°$. Sideways error grows like $s^{3/2}$: $22.8 \times 8 \approx 1.8$ m. Odometry alone is unusable over long distances.
:::end

:::exercise
Why does a robot's `odom` pose never jump, while its pose in `map` may?
:::solution
Odometry is continuous by construction (it only integrates small motions), which control loops need. Corrections from a localiser are applied to the `map → odom` transform, which may jump when a correction arrives, without disturbing the smooth `odom` pose.
:::end

## Quiz

:::quiz
- type: num
  q: Heading change when the right wheel travels 0.21 m and the left 0.19 m, wheel base 0.4 m?
  answer: 0.05
  tol: 0.002
  unit: rad
  py: "(0.21-0.19)/0.4"
  explain: (dr - dl) / b.
- type: num
  q: Forward travel in that step?
  answer: 0.2
  tol: 0.002
  unit: m
  py: "(0.21+0.19)/2"
  explain: The mean of the wheels.
- type: num
  q: Factor by which sideways error grows when distance increases 4 times?
  answer: 8
  tol: 0.001
  py: "4**1.5"
  explain: It grows like s^1.5.
- type: num
  q: Sideways drift after 10 m with curvature 0.01 rad/m (small-angle)?
  answer: 0.5
  tol: 0.002
  unit: m
  py: "0.01*100/2"
  explain: kappa s^2 / 2.
- type: mc
  q: On a long straight odometry run, the largest error is usually…
  options:
    - sideways, from accumulated heading error
    - along the direction of travel
    - in the wheel base
    - zero, if the encoders are accurate
  answer: 0
  explain: Heading error integrates into lateral error.
- type: mc
  q: The ROS 2 transform that a localiser corrects is…
  options:
    - map to odom
    - odom to base_link
    - base_link to the wheels
    - the camera intrinsics
  answer: 0
  explain: odom stays continuous; map to odom absorbs corrections.
:::end
