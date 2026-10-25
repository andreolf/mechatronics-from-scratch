---
id: p20-l07
minutes: 40
summary: The quadcopter capstone starts with the mixer, the matrix that turns a wanted total thrust and three body torques into four motor thrusts. You derive it for an X frame, invert it, check the round trip, and add desaturation so that thrust and attitude survive when a motor hits its limit.
---

## From four thrusts to a wrench

The quad of Phase 12 lesson 13: $m = 1$ kg, arm $\ell = 0.22$ m, $I = \mathrm{diag}(0.012, 0.012, 0.022)$ kg·m². In an X frame each motor sits $d = \ell/\sqrt2 = 0.156$ m forward or back and left or right of the centre. With body axes $x$ forward, $y$ left, $z$ up, motor $i$ at $(x_i, y_i)$ with thrust $f_i$ and spin $s_i = \pm1$ gives

$$T = \sum f_i,\quad \tau_x = \sum y_i f_i,\quad \tau_y = -\sum x_i f_i,\quad \tau_z = -\sum s_i c\, f_i,$$

where $c$ is the propeller's torque per newton of thrust (0.016 m here, illustrative). Stacked, $w = M f$ with a $4\times4$ mixer matrix $M$. The flight controller asks for $w$ and needs $f = M^{-1} w$.

## Desaturation

Motor thrust is limited to $[0, F_{max}]$. When $M^{-1}w$ leaves that box, something must give. The usual priority is: keep total thrust (or the drone falls), then roll and pitch (or it flips), and give up yaw first, because a slow heading change is harmless. PX4's mixer does the same.

:::figure widget=quadmixer caption="The four motors of an X quad. Set the thrust and the three torques; the bars show the motor thrusts with their limit and the readout says what the desaturation gave up."
:::end

## Worked example

$F_{max} = 6$ N per motor (illustrative):

1. Hover: each motor gives $mg/4 = 2.4525$ N, 40.9 % of maximum.
2. Roll torque 0.1 N·m: the left pair rises to 2.6132 N and the right pair falls to 2.2918 N; roll acceleration $0.1 / 0.012 = 8.33$ rad/s².
3. Yaw torque 0.05 N·m needs much larger changes (1.6712 and 3.2338 N) for only 2.27 rad/s², because $c$ is small: yaw authority is weak.
4. Largest roll torque at hover: 1.526 N·m, with one pair at 4.905 N and the other at zero.
5. Desaturation: asking for 0.3 N·m of roll and 0.2 N·m of yaw at hover gives the full roll but only 63 % of the yaw. At twice hover thrust with roll, pitch and yaw, yaw is dropped and roll and pitch are scaled to 85 %.
6. With a 20 ms motor lag, a 0.1 N·m roll step gives 19.0° after 0.3 s against 21.5° for an ideal motor.

## Code it from scratch

:::code file=quad_mixer.py
```python
import numpy as np

m, l, g = 1.0, 0.22, 9.81                   # quad of Phase 12 lesson 13: 1 kg, 0.22 m arms
I = np.diag([0.012, 0.012, 0.022])          # kg m^2
c = 0.016                                   # yaw torque per newton of thrust (m), from the propeller's torque/thrust ratio
F_MAX = 6.0                                 # maximum thrust per motor (N), illustrative
d = l / np.sqrt(2)                          # X frame: each motor sits d forward/back and d left/right of the centre

# motor i: position (x forward, y left) and spin direction (+1 = counter-clockwise seen from above)
MOTORS = [(+d, -d, +1), (-d, +d, +1), (+d, +d, -1), (-d, -d, -1)]   # front right, rear left, front left, rear right

def mixer_matrix():
    """rows: total thrust T, roll torque tx, pitch torque ty, yaw torque tz, as a function of the four thrusts f"""
    M = np.zeros((4, 4))
    for i, (x, y, s) in enumerate(MOTORS):
        M[:, i] = [1, y, -x, -s * c]          # tx = y f, ty = -x f (z up), tz = -s c f: a prop spinning CCW pushes the body CW
    return M

M = mixer_matrix(); Minv = np.linalg.inv(M)

def mix(T, tx, ty, tz):
    """wrench -> motor thrusts, with desaturation: keep thrust and roll/pitch, give up yaw first, then scale torques"""
    f = Minv @ [T, tx, ty, tz]
    if f.min() >= 0 and f.max() <= F_MAX: return f, "ok"
    f = Minv @ [T, tx, ty, 0]                 # 1. drop yaw
    if f.min() >= 0 and f.max() <= F_MAX:
        # put back as much yaw as fits
        dy = Minv @ [0, 0, 0, tz]; lo, hi = 0.0, 1.0
        for _ in range(30):
            k = (lo + hi) / 2; ff = f + k * dy
            lo, hi = (k, hi) if ff.min() >= 0 and ff.max() <= F_MAX else (lo, k)
        return f + lo * dy, f"yaw limited to {100 * lo:.0f} %"
    base = Minv @ [T, 0, 0, 0]; dt = f - base; lo, hi = 0.0, 1.0   # 2. scale roll/pitch
    for _ in range(30):
        k = (lo + hi) / 2; ff = base + k * dt
        lo, hi = (k, hi) if ff.min() >= 0 and ff.max() <= F_MAX else (lo, k)
    return base + lo * dt, f"roll/pitch limited to {100 * lo:.0f} %, no yaw"

def test_mixer():
    f_hover = Minv @ [m * g, 0, 0, 0]
    print("mixer matrix:\n", np.round(M, 4))
    print(f"hover: each motor {f_hover[0]:.4f} N ({100 * f_hover[0] / F_MAX:.1f} % of max)")
    assert np.allclose(f_hover, m * g / 4)
    assert np.allclose(M @ Minv, np.eye(4)) and np.allclose(Minv @ M, np.eye(4))
    rng = np.random.default_rng(1)
    for _ in range(1000):                               # round trip on random wrenches
        w = rng.normal(size=4); assert np.allclose(M @ (Minv @ w), w)
    tx = 0.1; f = Minv @ [m * g, tx, 0, 0]
    print(f"roll torque 0.1 N m: thrusts {np.round(f, 4)}, roll acceleration {tx / I[0, 0]:.2f} rad/s^2")
    tz = 0.05; f = Minv @ [m * g, 0, 0, tz]
    print(f"yaw torque 0.05 N m: thrusts {np.round(f, 4)}, yaw acceleration {tz / I[2, 2]:.2f} rad/s^2")
    dF = min(F_MAX - f_hover[0], f_hover[0])          # how far each motor can move while the total thrust stays mg
    print(f"max roll torque at hover: {4 * d * dF:.3f} N m (left pair +{dF:.4f} N, right pair -{dF:.4f} N)")

def test_desaturation():
    for w in [(m * g, 0.3, 0, 0.2), (2 * m * g, 0.5, 0.3, 0.3), (2.2 * m * g, 1.2, 0.8, 0.2)]:
        f, note = mix(*w); got = M @ f
        print(f"ask T {w[0]:.2f} tx {w[1]} ty {w[2]} tz {w[3]} -> f {np.round(f, 3)}, got T {got[0]:.2f} tx {got[1]:.3f} "
              f"ty {got[2]:.3f} tz {got[3]:.3f}: {note}")
        assert f.min() >= -1e-9 and f.max() <= F_MAX + 1e-9 and abs(got[0] - w[0]) < 1e-6

def simulate_roll_step(t_end=0.3, dt=1e-3):
    """rigid body roll axis only, motor lag 20 ms: 0.1 N m step, compare roll angle with tau t^2/(2 Ixx)"""
    phi = p = 0.0; f = Minv @ [m * g, 0, 0, 0]; f_cmd = Minv @ [m * g, 0.1, 0, 0]
    for _ in range(int(t_end / dt)):
        f += dt / 0.02 * (f_cmd - f); tx = (M @ f)[1]
        p += dt * tx / I[0, 0]; phi += dt * p
    ideal = 0.1 * t_end**2 / (2 * I[0, 0])
    print(f"roll after {t_end} s: {np.degrees(phi):.1f} deg (no motor lag: {np.degrees(ideal):.1f} deg)")
    assert 0.8 * ideal < phi < ideal

test_mixer(); test_desaturation(); simulate_roll_step(); print("PASS")
```
:::end

## In practice

In PX4 the mixer is generated from the airframe geometry (the "control allocation" module), and Gazebo simulates the motors and propellers. Check the motor order and spin directions on the bench with props off before the first flight: a single swapped motor flips a quad instantly. Try the site's [live quadcopter lab](#lab-quad) to see the motors respond.

## Exercises

:::exercise
Why is $M$ invertible for an X frame but not if all four propellers spin the same way?
:::solution
With all spins equal, the yaw row is $-c(1, 1, 1, 1)$, a multiple of the thrust row, so $M$ is singular: there is no way to make yaw torque without changing thrust, and the drone spins.
:::end

:::exercise
What is the largest roll torque at hover if $F_{max}$ is 4 N?
:::solution
Each motor can only move $\min(4 - 2.4525, 2.4525) = 1.5475$ N, so $\tau_{max} = 4 d \cdot 1.5475 = 0.963$ N·m.
:::end

## Quiz

:::quiz
- type: num
  q: Arm offset d for ℓ = 0.22 m on an X frame (m)?
  answer: 0.1556
  tol: 0.005
  py: "0.22/math.sqrt(2)"
  explain: ℓ/√2.
- type: num
  q: Hover thrust per motor for 1 kg (N)?
  answer: 2.4525
  tol: 0.005
  py: "9.81/4"
  explain: mg/4.
- type: num
  q: Roll acceleration for 0.1 N·m with Ixx 0.012 kg·m² (rad/s²)?
  answer: 8.33
  tol: 0.005
  py: "0.1/0.012"
  explain: τ/I.
- type: num
  q: Largest roll torque at hover with F_max 6 N (N·m)?
  answer: 1.526
  tol: 0.005
  py: "4*0.22/math.sqrt(2)*min(6-9.81/4, 9.81/4)"
  explain: 4 d Δf.
- type: mc
  q: Which axis does the mixer give up first when motors saturate?
  options: ["Yaw", "Total thrust", "Roll", "Pitch"]
  answer: 0
  explain: A slow heading change is harmless.
- type: mc
  q: Why is yaw authority weak on a quad?
  options: ["Yaw torque comes from propeller drag, a small fraction of the thrust", "The yaw inertia is zero", "The mixer ignores yaw", "Yaw needs a tail rotor"]
  answer: 0
  explain: c is a few centimetres.
:::end
