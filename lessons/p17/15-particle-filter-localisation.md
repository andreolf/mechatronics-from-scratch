---
id: p17-l15
minutes: 45
summary: Monte Carlo localisation represents "where might I be" as thousands of guesses. You implement a particle filter with an odometry motion model, a laser beam likelihood computed by ray casting against a map, and low-variance resampling, and watch it find an illustrative robot from complete global uncertainty within two scans, the method behind Nav2's AMCL.
---

## Beliefs as samples

Localisation estimates the robot's pose $x_t$ in a known map from odometry $u_{1:t}$ and sensor readings $z_{1:t}$. The Bayes filter alternates a **prediction** with the motion model and a **correction** with the measurement model:

$$\overline{bel}(x_t) = \int p(x_t \mid u_t, x_{t-1})\, bel(x_{t-1})\, dx_{t-1}, \qquad bel(x_t) \propto p(z_t \mid x_t)\, \overline{bel}(x_t).$$

A **particle filter** represents the belief by $N$ weighted samples. It can hold any shape: one blob, several hypotheses in look-alike corridors, or a uniform spread at start-up. That makes **global localisation** (no idea where the robot is) and recovery from mistakes possible, which a Kalman filter cannot do.

## The three steps

1. **Predict**: move every particle by the odometry plus sampled noise, proportional to the motion.
2. **Weight**: for each particle, predict the laser ranges by ray casting in the map and score the real scan: a Gaussian on each beam's range error, plus a small floor for readings the map cannot explain (people, chairs). Multiply over beams (add logs). Particles inside walls get weight 0.
3. **Resample**: draw a new set in proportion to the weights. **Low-variance resampling** uses one random offset and $N$ evenly spaced pointers, so a particle with weight $w$ gets $\lfloor Nw \rfloor$ or $\lceil Nw \rceil$ copies. Resample only when the effective sample size $1/\sum w_i^2$ drops (here below $N/2$), to avoid needlessly losing diversity.

The weighted mean is the pose estimate. AMCL adds adaptive particle counts (KLD sampling) and random particles injected when the scan fits poorly, for kidnapped-robot recovery.

:::figure widget=mcl caption="Monte Carlo localisation in an illustrative room. Step along the robot's route and watch the particles collapse from the whole room onto the true pose (lime). Change the particle count."
:::end

## Worked example

An illustrative 8 × 5 m room with a pillar, an alcove and a wall stub, so no two places look alike; a 6-beam laser (every 60°, 4 m range, 0.25 m noise); 3000 particles spread uniformly over the free space; the robot drives a 15 m route in 76 steps of 0.2 m.

1. From $(1, 2)$ facing $+x$ the ray caster reads 4.00 m ahead (the pillar at $x = 5$) and 1.00 m behind.
2. Resampling weights 0.5, 0.25, 0.125, 0.125 over 1000 particles gives exactly 500, 250, 125 and 125 copies.
3. After the first scan the estimate is still 0.8 to 1.2 m off with a spread of 1.8 to 2.4 m (three random seeds): several places fit one scan. From the second step on it stays within 0.3 m.
4. Over the last 20 steps the median error is 4 to 12 cm, with a particle spread of about 8 cm.

## Code it from scratch

:::code file=mcl.py
```python
import numpy as np

# illustrative 8 x 5 m room with a pillar and an alcove, so no two places look the same (wall segments x1, y1, x2, y2)
WALLS = np.array([[0, 0, 8, 0], [8, 0, 8, 5], [8, 5, 3, 5], [3, 5, 3, 4], [3, 4, 0, 4], [0, 4, 0, 0],
                  [5, 1.5, 6, 1.5], [6, 1.5, 6, 2.5], [6, 2.5, 5, 2.5], [5, 2.5, 5, 1.5], [1.5, 0, 1.5, 1.2]], float)
BEAMS = np.radians(np.arange(-180, 180, 60))                          # 6 laser beams, 60 deg apart
MAX_RANGE, SIGMA_R = 4.0, 0.25

def free(x, y):
    """inside the room and outside the pillar and the short wall stub"""
    inside = (x > 0.1) & (x < 7.9) & (y > 0.1) & (((y < 3.9) | (x > 3.1)) & (y < 4.9))
    pillar = (x > 4.9) & (x < 6.1) & (y > 1.4) & (y < 2.6); stub = (x > 1.4) & (x < 1.6) & (y < 1.3)
    return inside & ~pillar & ~stub

def raycast(poses):
    """laser ranges for N poses (x, y, theta): nearest intersection of each beam with every wall segment"""
    ang = poses[:, 2:3] + BEAMS; dx, dy = np.cos(ang)[..., None], np.sin(ang)[..., None]        # N x B x 1
    ox, oy = poses[:, 0, None, None], poses[:, 1, None, None]
    x1, y1, x2, y2 = WALLS.T; ex, ey = x2 - x1, y2 - y1
    den = dx * ey - dy * ex
    with np.errstate(divide="ignore", invalid="ignore"):
        t = ((x1 - ox) * ey - (y1 - oy) * ex) / den; u = ((x1 - ox) * dy - (y1 - oy) * dx) / den
    t = np.where((np.abs(den) > 1e-12) & (t > 0) & (u >= 0) & (u <= 1), t, np.inf)
    return np.minimum(t.min(2), MAX_RANGE)

def motion(particles, ds, dth, rng, a=(0.05, 0.02)):
    """sample the odometry motion model: travel and turn with noise proportional to the motion"""
    n = len(particles); s = ds + rng.normal(0, a[0] * abs(ds) + 0.01, n); r = dth + rng.normal(0, a[1] + 0.05 * abs(dth), n)
    p = particles.copy(); p[:, 2] += r / 2; p[:, 0] += s * np.cos(p[:, 2]); p[:, 1] += s * np.sin(p[:, 2]); p[:, 2] += r / 2
    return p

def weights(particles, z):
    """beam likelihood: Gaussian range error plus a small floor for unexpected readings; zero weight inside walls"""
    pred = raycast(particles)
    lik = 0.9 * np.exp(-0.5 * ((pred - z) / SIGMA_R) ** 2) + 0.1 * 0.2
    logw = np.log(lik).sum(1); logw[~free(particles[:, 0], particles[:, 1])] = -np.inf
    w = np.exp(logw - logw.max()); return w / w.sum()

def low_variance_resample(particles, w, rng):
    """one random offset, n evenly spaced pointers into the cumulative weights: low variance, O(n)"""
    n = len(w); u = (rng.random() + np.arange(n)) / n
    return particles[np.minimum(np.searchsorted(np.cumsum(w), u), n - 1)]

def route():
    """the robot's path: waypoints visited at 0.2 m per step, as (ds, dtheta) odometry commands"""
    pts = np.array([[1, 2.5], [4, 3.2], [7, 3.8], [7, 0.8], [3, 0.8], [2.5, 2.5]]); poses = [np.r_[pts[0], 0]]
    for a, b in zip(pts[:-1], pts[1:]):
        th = np.arctan2(*(b - a)[::-1]); n = int(np.ceil(np.linalg.norm(b - a) / 0.2))
        for k in range(n): poses.append(np.r_[a + (b - a) * (k + 1) / n, th])
    poses = np.array(poses); poses[0, 2] = poses[1, 2]
    d = np.diff(poses, axis=0); ds = np.hypot(d[:, 0], d[:, 1]); dth = (d[:, 2] + np.pi) % (2 * np.pi) - np.pi
    return poses, ds, dth

def run(n=3000, seed=0):
    rng = np.random.default_rng(seed); truth, ds, dth = route()
    p = rng.uniform([0, 0, -np.pi], [8, 5, np.pi], (4 * n, 3)); p = p[free(p[:, 0], p[:, 1])][:n]   # global uncertainty
    errs, spread = [], []
    for k in range(len(ds)):
        p = motion(p, ds[k], dth[k], rng)
        z = raycast(truth[k + 1:k + 2])[0] + rng.normal(0, SIGMA_R, len(BEAMS))
        w = weights(p, z)
        est = (w[:, None] * p[:, :2]).sum(0)
        errs.append(np.linalg.norm(est - truth[k + 1, :2])); spread.append(np.sqrt((w * ((p[:, :2] - est) ** 2).sum(1)).sum()))
        if 1 / (w ** 2).sum() < len(w) / 2: p = low_variance_resample(p, w, rng)   # resample when the effective size halves
    return np.array(errs), np.array(spread)

def test_raycast():
    r = raycast(np.array([[1.0, 2.0, 0.0]]))[0]
    print(f"from (1, 2) facing +x: range ahead {r[3]:.2f} m (the pillar at x = 5), behind {r[0]:.2f} m")
    assert np.allclose([r[3], r[0]], [4, 1])

def test_resampling():
    rng = np.random.default_rng(1); w = np.array([0.5, 0.25, 0.125, 0.125]); p = np.arange(4.0)[:, None]
    counts = np.bincount(low_variance_resample(np.repeat(p, 250, 0), np.repeat(w, 250) / 250, rng)[:, 0].astype(int), minlength=4)
    print(f"weights 0.5, 0.25, 0.125, 0.125 over 1000 particles: resampled counts {counts.tolist()}")
    assert np.abs(counts - 1000 * w).max() <= 1

def test_global_localisation():
    for seed in (0, 1, 2):
        errs, spread = run(seed=seed)
        first = int(np.argmax(np.convolve(errs < 0.3, np.ones(5), "valid") == 5))
        print(f"seed {seed}: error {errs[0]:.2f} m and spread {spread[0]:.2f} m after the first scan, below 0.3 m for good from step {first}; final error {errs[-1]:.3f} m, spread {spread[-1]:.3f} m; "
              f"median error over the last 20 steps {np.median(errs[-20:]):.3f} m")
        assert np.median(errs[-20:]) < 0.15 and (errs[first:] < 0.3).mean() > 0.95

test_raycast()
test_resampling()
test_global_localisation()
print("PASS")
```
:::end

## In practice

Nav2's localiser is AMCL, an adaptive Monte Carlo localiser of exactly this kind. It uses the occupancy grid map (lesson 17), a likelihood-field laser model (a precomputed distance-to-nearest-obstacle map that avoids ray casting), and publishes the `map → odom` transform (lesson 14). You give it an initial pose estimate in RViz, or ask it for global localisation.

## Exercises

:::exercise
A robot sits in the middle of a long, featureless corridor. What does the particle cloud look like, and when does it collapse?
:::solution
Particles spread along the corridor (and possibly in identical corridors elsewhere): the scan fixes the sideways position and heading, not the position along it. The cloud collapses when the robot reaches a door, a corner or another distinctive feature.
:::end

:::exercise
Why resample only when the effective sample size drops, rather than every step?
:::solution
Each resampling discards particles and duplicates others, losing diversity even when the weights are nearly equal (the robot was stationary or the scan was uninformative). Resampling only when the weights become uneven keeps the variety needed for multiple hypotheses.
:::end

## Quiz

:::quiz
- type: num
  q: Effective sample size of weights 0.5, 0.25, 0.25?
  answer: 2.667
  tol: 0.002
  py: "1/(0.25+0.0625+0.0625)"
  explain: 1 / sum of squared weights.
- type: num
  q: Copies of a particle with weight 0.012 among 1000 after low-variance resampling (expected)?
  answer: 12
  tol: 0.001
  py: "0.012*1000"
  explain: N w.
- type: num
  q: Log-likelihood contribution of a beam 0.5 m off with sigma 0.25 m (Gaussian part, ignoring the constant)?
  answer: -2
  tol: 0.002
  py: "-0.5*(0.5/0.25)**2"
  explain: -(error/sigma)^2 / 2.
- type: num
  q: Ray-cast evaluations for 3000 particles with 6 beams?
  answer: 18000
  tol: 0.001
  py: "3000*6"
  explain: One per beam per particle.
- type: mc
  q: A particle filter, unlike an EKF, can…
  options:
    - represent several separate pose hypotheses at once
    - give an exact Gaussian posterior
    - run with one particle
    - skip the motion model
  answer: 0
  explain: Samples can take any shape.
- type: mc
  q: Low-variance resampling…
  options:
    - uses one random number and evenly spaced pointers
    - draws N independent random numbers
    - keeps only the best particle
    - adds random particles everywhere
  answer: 0
  explain: Its copy counts deviate from N w by less than one.
:::end
