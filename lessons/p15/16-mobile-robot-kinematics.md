---
id: p15-l16
minutes: 40
summary: A differential-drive robot steers by running its two wheels at different speeds, and it can roll forwards and turn but never slide sideways. You derive the unicycle model and the nonholonomic constraint, find the turning radius from the wheel speeds, implement dead-reckoning odometry from quantised encoder ticks using exact arcs, and test it against a fine integration of the kinematics, then see how a 1 % error in the track width makes the estimate drift.
---

## From wheels to body motion

Two wheels of radius $r$, a distance $b$ apart (the **track**), turning at $\omega_L$ and $\omega_R$. Each wheel's contact point moves at $r\omega$. The body's forward speed is their average and its turn rate is their difference over the track:

$$v = \frac{r(\omega_R + \omega_L)}{2}, \qquad \omega = \frac{r(\omega_R - \omega_L)}{b}.$$

The pose $(x, y, \theta)$ then follows the **unicycle model**:

$$\dot x = v\cos\theta, \qquad \dot y = v\sin\theta, \qquad \dot\theta = \omega.$$

With constant wheel speeds the robot drives a circle about the **instantaneous centre of rotation** (ICR), at radius $R = v/\omega = \frac{b}{2}\frac{\omega_R + \omega_L}{\omega_R - \omega_L}$. Equal speeds drive straight; opposite speeds spin on the spot.

## The nonholonomic constraint

The wheels can't slip sideways, so the velocity perpendicular to the heading is always zero:

$$-\dot x\sin\theta + \dot y\cos\theta = 0.$$

This constrains velocities, not positions: the robot can still reach any $(x, y, \theta)$, as parallel parking shows, but not by moving directly sideways. Such a constraint is called **nonholonomic**, and it is why motion planning for cars and wheeled robots (Phase 16) is harder than for arms.

## Odometry

Encoders report wheel rotations $\Delta\phi_L, \Delta\phi_R$ each sample. Over one sample, assume constant speeds and move along the exact arc:

$$\Delta s = \tfrac{r}{2}(\Delta\phi_R + \Delta\phi_L), \;\; \Delta\theta = \tfrac{r}{b}(\Delta\phi_R - \Delta\phi_L), \;\; \Delta x = \tfrac{\Delta s}{\Delta\theta}\big(\sin(\theta + \Delta\theta) - \sin\theta\big), \;\; \Delta y = -\tfrac{\Delta s}{\Delta\theta}\big(\cos(\theta + \Delta\theta) - \cos\theta\big).$$

As $\Delta\theta \to 0$ use the straight-line step. Errors in $r$ or $b$, and wheel slip, accumulate without bound. That is why odometry is fused with other sensors, using the Kalman filters of Phase 14.

:::figure widget=diffdrive caption="Set the two wheel speeds and watch the robot drive an arc about its instantaneous centre of rotation (the cross). Equal speeds go straight, opposite speeds spin on the spot, and the odometry estimate drifts if its track width is off."
:::end

## Worked example

An illustrative small robot: $r = 0.05$ m, $b = 0.30$ m, 2048 encoder counts per wheel turn.

1. Wheels at 8 and 12 rad/s: $v = 0.05 \times 10 = 0.5$ m/s and $\omega = 0.05 \times 4/0.3 = 0.667$ rad/s, so $R = 0.75$ m. A full circle takes $2\pi/0.667 = 9.4$ s and returns to the start.
2. With wheel speeds varying in time, 10 s of 100 Hz odometry from quantised ticks ends within 0.04 mm of the fine RK4 integration.
3. The sideways velocity along the path stays at zero to within the integration error ($2 \times 10^{-5}$ m/s).
4. Tell the odometry that the track is 1 % wider than it is: after 10 s its heading is off by 0.58° and its position by 23 mm, and the error keeps growing.

## Code it from scratch

:::code file=diffdrive.py
```python
import numpy as np

R_WHEEL, TRACK, TICKS = 0.05, 0.30, 2048      # illustrative small robot: wheel radius, wheel separation (m), encoder counts per wheel turn

def body_velocity(wl, wr, r=R_WHEEL, b=TRACK):
    """wheel speeds (rad/s) -> forward speed v (m/s) and turn rate omega (rad/s)"""
    return r * (wr + wl) / 2, r * (wr - wl) / b

def unicycle(s, v, w):
    x, y, th = s; return np.array([v * np.cos(th), v * np.sin(th), w])

def integrate(wheels, T, dt=1e-4):
    """ground truth: RK4 on the unicycle model; wheels(t) -> (wl, wr)"""
    s = np.zeros(3); path = [s.copy()]
    for i in range(int(T / dt)):
        t = i * dt
        def f(s, t): return unicycle(s, *body_velocity(*wheels(t)))
        k1 = f(s, t); k2 = f(s + dt / 2 * k1, t + dt / 2); k3 = f(s + dt / 2 * k2, t + dt / 2); k4 = f(s + dt * k3, t + dt)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); path.append(s.copy())
    return np.array(path)

def odometry(dl, dr, s, r=R_WHEEL, b=TRACK):
    """dead reckoning from wheel rotations over one sample: an exact arc for constant speeds"""
    ds, dth = r * (dr + dl) / 2, r * (dr - dl) / b
    x, y, th = s
    if abs(dth) < 1e-9:
        return np.array([x + ds * np.cos(th), y + ds * np.sin(th), th])
    Rc = ds / dth
    return np.array([x + Rc * (np.sin(th + dth) - np.sin(th)), y - Rc * (np.cos(th + dth) - np.cos(th)), th + dth])

def run_odometry(wheels, T, rate=100.0, dt=1e-4, b=TRACK):
    """integrate each wheel's angle finely, quantise to encoder ticks, then dead-reckon at `rate` Hz"""
    n_sub = int(round(1 / (rate * dt))); s = np.zeros(3); angle = np.zeros(2); last = np.zeros(2, int)
    for k in range(int(T * rate)):
        for j in range(n_sub):
            angle += np.array(wheels((k * n_sub + j) * dt)) * dt
        ticks = np.floor(angle / (2 * np.pi) * TICKS).astype(int)
        d = (ticks - last) * 2 * np.pi / TICKS; last = ticks
        s = odometry(d[0], d[1], s, b=b)
    return s

def test_arc_radius():
    wl, wr = 8.0, 12.0
    v, w = body_velocity(wl, wr)
    p = integrate(lambda t: (wl, wr), T=2 * np.pi / w)              # one full circle
    R = TRACK / 2 * (wr + wl) / (wr - wl)
    print(f"wheels {wl}, {wr} rad/s: v = {v:.3f} m/s, omega = {w:.4f} rad/s, circle radius {R:.3f} m (measured {np.ptp(p[:, 1]) / 2:.3f})")
    assert abs(np.ptp(p[:, 1]) / 2 - R) < 1e-4 and np.linalg.norm(p[-1, :2]) < 1e-3

def test_nonholonomic():
    p = integrate(lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t)), T=5)
    vel = np.diff(p[:, :2], axis=0) / 1e-4
    lateral = -vel[:, 0] * np.sin(p[:-1, 2]) + vel[:, 1] * np.cos(p[:-1, 2])
    print(f"largest sideways speed along the path: {np.abs(lateral).max():.1e} m/s")
    assert np.abs(lateral).max() < 1e-3                             # it can't slide sideways

def test_odometry_matches_integration():
    wheels = lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t))
    truth = integrate(wheels, T=10)[-1]; est = run_odometry(wheels, T=10)
    err = np.linalg.norm(truth[:2] - est[:2])
    print(f"after 10 s: truth ({truth[0]:.4f}, {truth[1]:.4f}, {np.degrees(truth[2]):.2f} deg), odometry ({est[0]:.4f}, {est[1]:.4f}, {np.degrees(est[2]):.2f} deg), position error {err * 1000:.2f} mm")
    assert err < 5e-3 and abs(truth[2] - est[2]) < np.radians(0.5)

def test_track_error_drifts():
    wheels = lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t))
    truth = integrate(wheels, T=10)[-1]
    est = run_odometry(wheels, T=10, b=TRACK * 1.01)                  # odometry believes a 1 % wider track
    print(f"with a 1 % track-width error: heading off by {np.degrees(abs(truth[2] - est[2])):.2f} deg, position by {np.linalg.norm(truth[:2] - est[:2]) * 1000:.0f} mm")
    assert np.linalg.norm(truth[:2] - est[:2]) > 5e-3

test_arc_radius()
test_nonholonomic()
test_odometry_matches_integration()
test_track_error_drifts()
print("PASS")
```
:::end

## Exercises

:::exercise
How would you calibrate $b$ on a real robot?
:::solution
Command it to spin on the spot through a known number of full turns (ten, say) and measure the actual rotation, with a mark on the floor or an external tracker. The ratio of the commanded to the actual angle scales $b$. Borenstein's UMBmark test runs square paths in both directions to separate the track error from a wheel-diameter mismatch.
:::end

:::exercise
Can a differential-drive robot follow a path with a sharp corner without stopping?
:::solution
Not exactly. A corner needs an instant change of heading at nonzero speed, which means infinite $\omega$. It can stop and spin at the corner, or the path must be smoothed into arcs with a minimum radius that its wheel speed limits allow.
:::end

## Quiz

:::quiz
- type: num
  q: Forward speed with r = 0.05 m and both wheels at 10 rad/s?
  answer: 0.5
  tol: 0.001
  unit: m/s
  py: "0.05*10"
  explain: r times the wheel speed.
- type: num
  q: Turn rate with wheels at 8 and 12 rad/s, r = 0.05 m, b = 0.3 m?
  answer: 0.6667
  tol: 0.002
  unit: rad/s
  py: "0.05*(12-8)/0.3"
  explain: r(ωR − ωL)/b.
- type: num
  q: Turning radius for those wheel speeds?
  answer: 0.75
  tol: 0.001
  unit: m
  py: "0.3/2*(12+8)/(12-8)"
  explain: v/ω.
- type: num
  q: Distance per encoder count with r = 0.05 m and 2048 counts per turn?
  answer: 0.1534
  tol: 0.002
  unit: mm
  py: "2*math.pi*0.05/2048*1000"
  explain: Circumference over counts.
- type: mc
  q: The nonholonomic constraint of a differential-drive robot says…
  options:
    - its velocity perpendicular to its heading is zero
    - it can't reach every position
    - its wheels must turn at the same speed
    - it can't turn on the spot
  answer: 0
  explain: No sideways sliding.
- type: mc
  q: Odometry error grows without bound because…
  options:
    - it integrates small errors in r, b and wheel slip
    - encoders lose counts every second
    - the unicycle model is wrong
    - of the ICR
  answer: 0
  explain: Dead reckoning has no absolute reference.
:::end
