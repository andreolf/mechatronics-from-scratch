---
id: p21-l07
minutes: 45
summary: The gripper hangs half a metre under the point where the lines meet, so every start and stop sets it swinging. You derive the pendulum on a moving pivot, see what a 0.4 m/s stop does, then remove the swing two ways, by shaping the command and by feedback that moves the pivot under the gripper, and read how Stringman does it with a gyro.
---

## A pendulum you drive by the top

The four lines hold a point, the pivot. Stringman's gripper hangs 50 cm below it on a pole, so the thing you want to place is the bob of a pendulum whose top you move around. That is the price of having only four motors: the lines control three coordinates of the pivot and nothing stops the pole swinging under it.

Write $d$ for the gripper's horizontal offset from the point directly under the pivot, and $a$ for the pivot's horizontal acceleration. For small swings,

$$ \ddot d = -\frac{g}{l}\,d - a, \qquad \omega = \sqrt{g/l}, \qquad T = 2\pi\sqrt{l/g}. $$

With $l = 0.5$ m, $\omega = 4.43$ rad/s and the period is **1.419 s**. The $-a$ term is the whole problem: accelerate the pivot and, in the pivot's frame, the gripper feels a sideways pull the other way.

How much swing does an ordinary move make? Stop dead from Stringman's traverse speed of 0.4 m/s and the gripper carries on at 0.4 m/s with the pivot standing still. The swing amplitude is $v/\omega = 0.4/4.43 = 9.0$ cm, about 10°. A realistic move with acceleration ramps is no better on its own: in the code below, a 2 m move with 1.5 m/s² ramps leaves the start swing and the stop swing almost in phase and ends with 17 cm of swing. A real pendulum rings down slowly through air and joint friction. The simulator gives it 0.02/s of air damping, which takes almost four minutes to shrink a swing tenfold.

## Fix one: shape the command

If you know the period, you can make the second half of the disturbance cancel the first. Split every acceleration command into two copies of half the size, the second delayed by half a period. Whatever swing the first copy starts, the second starts the same swing with the opposite phase, and they cancel. This is the *zero-vibration* (ZV) input shaper from Singer and Seering's 1990 paper on shaping commands for flexible systems.

In the simulation the same 2 m move, shaped, ends with 0.02 mm of swing. It costs exactly half a period, 0.71 s, added to the move. It also needs the period: shape for a 0.5 m pole when the real swing length is 0.55 m and 1.2 cm of swing comes back. Shaping is open loop, so it does nothing about a swing started by someone bumping the gripper or by grabbing a load.

## Fix two: move the pivot under the gripper

A crane operator does this by hand: when the load swings ahead, drive after it. In equations, make the pivot accelerate towards the swing and in the direction it is moving,

$$ a = k_p\, d + k_d\, \dot d \quad\Rightarrow\quad \ddot d + k_d \dot d + \Big(\frac{g}{l} + k_p\Big) d = 0 . $$

The $k_d$ term is damping, and $k_p$ stiffens the swing. The simulator uses $k_p = 0.5\,g/l$ and $k_d = 0.9\sqrt{g/l}$, which on their own give a damping ratio of 0.37 and kill a 9 cm swing to under 1 cm in 0.88 s.

The catch is that the pivot also has a job: going where you told it. In the simulator a position loop pulls the pivot towards its target with $k_x = 1$/s and $k_v = 4$/s, and the two loops share the same motors. Turn the gains up and the two loops start fighting, so the gains have to be checked on the combined system, not on the swing alone.

There is a second trap, and the first version of this simulator fell into it. The $k_p d$ term cannot tell a swing from a lean. Push the gripper sideways with a steady 15 N and, with 1.25 kg on it, the pole leans over by $\arctan(15/12.26) = 50.7°$ and stays there. The damping law sees a large, constant $d$ and keeps accelerating the pivot after it, and the speed limit on the position loop means nothing pulls it back: in that first version the pivot chased the lean out of the room at 0.55 m/s. The fix is to apply $k_p$ only to the part of $d$ that changes, $d - \bar d$, where $\bar d$ is $d$ passed through a 2 s low-pass filter. With the position loop and the filter that makes five states per axis. Their eigenvalues show the swing modes decaying at 1.4/s or faster for poles from 0.1 to 0.5 m and at 0.48/s with a 1 m pole, plus one slow, non-oscillating 0.48/s mode that brings the pivot back to its target after a lean.

:::figure widget=cablebot args={"preset":"swing"} caption="Swing damping off. Press Kick the swing, watch the scope, then turn Swing damping on and kick again. Try a longer pole: the period grows with the square root of the length."
:::end

## How Stringman does it

Stringman's gripper carries an IMU, and its firmware describes the swing with a small state matrix that the gripper fits to its gyro at 100 Hz: one row each for the X and Y swing, one column for the in-phase and one for the quarter-period-ahead component. Because the pendulum has a single frequency, advancing that model in time is just a rotation of the state, which is exact for as long as the swing lasts.

The cancellation command is a gantry velocity that opposes the swing **as it will be** when the motors actually move, not as it was when the gyro measured it. The code projects the state forward by the loop's round-trip latency before computing the correction, and the latency is not guessed: a calibration routine runs trials at latencies of 0, 0.3 and 0.6 s, measures what swing is left over the final three periods of each, then tries seven more values spread ±0.15 s around the best. A residual of 20 mrad counts as verified, 10 mrad ends the search early, and the comments mention 6 mrad on a good robot.

Two side effects are handled explicitly, and both are worth knowing before you build your own. Cancelling a swing is a net push in the direction the swing was going, so the gantry drifts, and a centring term integrates the commanded velocity and pulls it back. And because the gantry hangs from four lines, moving it sideways also lifts it, so an altitude hold keeps the height during long trials.

## Code it from scratch

:::code file=swing.py
```python
import numpy as np

G, POLE = 9.81, 0.5
w = np.sqrt(G / POLE)
T = 2 * np.pi / w
print(f"pendulum on a {POLE} m pole: period {T:.3f} s")
assert abs(T - 1.419) < 0.001

def run(pivot_acc, t_end, l=POLE, d0=0.0, v0=0.0, dt=1e-4, air=0.0):
    """linearised swing seen from the pivot: d'' = -(g/l) d - a_pivot. d is the gripper's offset, in metres."""
    d, v, out = d0, v0, []
    for k in range(int(t_end / dt)):
        a = pivot_acc(k * dt, d, v)
        v += (-(G / l) * d - a - air * v) * dt
        d += v * dt
        out.append(d)
    return np.array(out)

# 1. a sudden stop from 0.4 m/s leaves a swing of v / omega
amp = 0.4 / w
assert abs(amp - 0.0903) < 0.0005
print(f"sudden stop from 0.4 m/s: {amp*100:.1f} cm swing, {np.degrees(np.arcsin(amp / POLE)):.1f} degrees")

# 2. a 2 m move with 1.5 m/s^2 ramps, then the same move through a zero-vibration (ZV) shaper
def trapezoid(t, amax=1.5, vmax=0.4, dist=2.0):
    ta = vmax / amax; tc = dist / vmax - ta
    if t < 0: return 0.0
    if t < ta: return amax
    if t < ta + tc: return 0.0
    if t < 2 * ta + tc: return -amax
    return 0.0
t_move = 2 * (0.4 / 1.5) + (2.0 / 0.4 - 0.4 / 1.5)
def residual(acc, l=POLE):
    d = run(lambda t, d, v: acc(t), t_move + T + 4, l=l)
    return np.abs(d[int((t_move + T) / 1e-4):]).max()
plain = residual(trapezoid)
zv = lambda t: 0.5 * trapezoid(t) + 0.5 * trapezoid(t - T / 2)   # two half-size copies, half a period apart
shaped = residual(zv)
shaped_wrong_pole = residual(zv, l=0.55)                             # shaper tuned for 0.5 m, real pole 0.55 m
print(f"2 m move: residual swing {plain*100:.1f} cm plain, {shaped*1000:.2f} mm shaped, "
      f"{shaped_wrong_pole*100:.1f} cm shaped for the wrong pole; shaping costs {T/2:.2f} s")
assert plain > 0.15 and shaped < 0.0005 and 0.005 < shaped_wrong_pole < 0.03

# 3. feedback: accelerate the pivot towards the swing, a = kp d + kd d'
kp, kd = 0.5 * w**2, 0.9 * w
zeta = kd / (2 * np.sqrt(w**2 + kp))
print(f"PD on pivot acceleration alone: zeta = {zeta:.2f}")
assert abs(zeta - 0.367) < 0.001
# with the position loop that pulls the pivot back to its target (kx = 1/s, kv = 4/s) and kp acting on d minus a
# 2 s low-pass of d (so a steady lean is not chased): five states per axis, xp, vp, d, d', dbar
for l in (0.1, 0.25, 0.5, 1.0):
    ww = G / l; p, dd, tau = 0.5 * ww, 0.9 * np.sqrt(ww), 2.0
    A = np.array([[0, 1, 0, 0, 0], [-4, -4, p, dd, -p], [0, 0, 0, 1, 0], [4, 4, -ww - p, -dd, p], [0, 0, 1 / tau, 0, -1 / tau]])
    ev = np.linalg.eigvals(A)
    swing = -ev[np.abs(ev.imag) > 1e-9].real.max()
    print(f"  pole {l} m: oscillating modes decay at {swing:.2f} /s or faster, slowest of all {-ev.real.max():.2f} /s")
    assert ev.real.max() < -0.4 and (swing > 1.3 or l == 1.0)
d = run(lambda t, d, v: kp * d + kd * v, 6, d0=amp)
settled = np.where(np.abs(d) > 0.01)[0].max() * 1e-4
free = run(lambda t, d, v: 0.0, 6, d0=amp, air=0.02)
print(f"9 cm swing: below 1 cm for good after {settled:.2f} s with damping; after 6 s without it is still {np.abs(free[-15000:]).max()*100:.1f} cm")
assert settled < 2.0 and np.abs(free[-15000:]).max() > 0.08
print("PASS")
```
:::end

## In practice

Measure the swing length rather than the pole: the bob is the whole gripper with its payload, so its centre of mass, not the end of the pole, sets the period. Time ten swings with a phone and compute the length from $l = g(T/2\pi)^2$. Use shaping for the moves you command, feedback for the swings you do not, and expect latency, not gains, to be what limits the feedback. That is the subject of Lesson 9.

## Exercises

:::exercise
A gripper with a load swings with a period of 1.55 s. What is its effective pendulum length, and what does a ZV shaper tuned for the empty 1.419 s period leave behind compared with a correctly tuned one?
:::solution
$l = 9.81 \times (1.55/2\pi)^2 = 0.597$ m. The mistuned shaper delays its second impulse by 0.709 s instead of 0.775 s, so the two swings no longer cancel exactly. For a ZV shaper the leftover fraction is $|\cos(\pi r/2)|$ with $r$ the ratio of the true to the design frequency, here $r = 1.419/1.55 = 0.915$, which leaves 13 % of the unshaped swing. A correctly tuned shaper leaves essentially none, at the cost of 0.775 s per move.
:::end

:::exercise
Why does the feedback law accelerate the pivot towards the swing rather than away from it?
:::solution
The $-a$ term in $\ddot d = -(g/l) d - a$ means pivot acceleration acts on the swing with a minus sign. Choosing $a = k_d \dot d$ turns that term into $-k_d\dot d$, a force opposing the swing velocity, which is damping. Accelerating away would add energy and make the swing grow.
:::end

## Quiz

:::quiz
- type: num
  q: Period of a 0.5 m pendulum (s)?
  answer: 1.419
  tol: 0.001
  py: "2*math.pi*math.sqrt(0.5/9.81)"
  explain: T = 2π √(l/g).
- type: num
  q: Swing amplitude after a sudden stop from 0.4 m/s on that pole (cm)?
  answer: 9.03
  tol: 0.005
  py: "0.4/math.sqrt(9.81/0.5)*100"
  explain: The gripper keeps 0.4 m/s; amplitude is v/ω.
- type: num
  q: How much time does a zero-vibration shaper add to a move for that pole (s)?
  answer: 0.709
  tol: 0.002
  py: "math.pi*math.sqrt(0.5/9.81)"
  explain: Half a period.
- type: mc
  q: Which law on the pivot's acceleration damps the swing?
  options: ["a = k_d d', towards the direction the gripper is moving", "a = −k_d d'", "a = 0", "a = constant"]
  answer: 0
  explain: It turns the −a coupling into −k_d d', a damping term.
- type: mc
  q: Why does Stringman project its fitted swing state forward before computing the correction?
  options: ["To make the correction land in phase despite the delay between measuring and moving", "To filter gyro noise", "To save bandwidth", "To find the pole length"]
  answer: 0
  explain: The projection is by the measured round-trip latency.
- type: mc
  q: What does a ZV shaper do about a swing started by someone bumping the gripper?
  options: ["Nothing; it only shapes commanded moves", "It damps it in half a period", "It doubles it", "It measures it"]
  answer: 0
  explain: Shaping is open loop.
:::end

:::verify
import math
w = math.sqrt(9.81/0.5)
assert abs(w-4.43) < 0.005 and abs(2*math.pi/w-1.419) < 0.0005 and abs(0.4/w-0.090) < 0.0005
assert abs(math.degrees(math.asin(0.4/w/0.5))-10.4) < 0.05 and abs(math.pi/w-0.71) < 0.005
assert abs(9.81*(1.55/(2*math.pi))**2-0.597) < 0.0005 and abs(1.55/2-0.775) < 1e-9 and abs(math.pi/w-0.709) < 0.0005
assert abs(0.9*w/(2*math.sqrt(1.5*w*w))-0.37) < 0.005
assert abs(math.log(10)/0.01/60-3.8) < 0.05 and abs(math.degrees(math.atan(15/(1.25*9.81)))-50.7) < 0.05 and abs(1.25*9.81-12.26) < 0.005
r = 1.419/1.55; assert abs(r-0.915) < 0.0005 and abs(abs(math.cos(math.pi*r/2))-0.13) < 0.005
r2 = math.sqrt(0.5/0.55); assert abs(abs(math.cos(math.pi*r2/2))*0.17-0.012) < 0.001
:::end

## Sources

- Neufangled, [Stringman home page](https://neufangled.com/) (gripper on a pole, active swing cancellation without extra motors, 0.4 m/s).
- Stringman firmware, Apache-2.0: [`swing.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/swing.py) at commit e1ee31d (100 Hz gyro fit, forward projection by latency, latency calibration, centring and altitude hold).
- N. C. Singer and W. P. Seering, ["Preshaping command inputs to reduce system vibration"](https://doi.org/10.1115/1.2894142), *Journal of Dynamic Systems, Measurement, and Control*, 1990.
