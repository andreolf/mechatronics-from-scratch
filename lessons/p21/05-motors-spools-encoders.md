---
id: p21-l05
minutes: 40
summary: A winch turns torque into tension and shaft angle into line length, through a spool whose radius changes as line piles on. You size a direct-drive spool, model the pile the way Stringman's firmware does, estimate tension from motor torque with friction taken off, and work out what one encoder count is worth.
---

## The winch is the robot

Everything a cable robot does goes through four winches. Each one has three jobs: wind line at the commanded speed, report how much line is out, and, if you want any of the force control from Lesson 3, report how hard the line is pulling. The parts are a motor, a spool, a way of measuring the shaft angle, and the electronics that close the loop.

Stringman's anchors use the DM-H6215, a direct-drive actuator that Neufangled lists at 1 N·m rated torque and $66 each. *Direct drive* means no gearbox: the spool sits on the motor shaft. That costs torque, but it buys two things a cable robot badly wants. The motor's own torque reading becomes a usable estimate of line tension, because there is no gearbox friction in between. And the line can be pulled off the spool by hand when the motor relaxes, which is the safety behaviour in Lesson 8.

## Torque, speed and radius

For a spool of effective radius $r$ on the motor shaft:

$$ T = \frac{\tau}{r}, \qquad v = \omega r . $$

Stringman's empty spool is 72 mm across, so $r = 36$ mm and the rated 1 N·m pulls $1/0.036 = 27.8$ N of line. That sits right at the 28 N relax limit. The traverse speed of 0.4 m/s needs $\omega = 0.4/0.036 = 11.1$ rad/s, or 106 rpm: easy for a direct-drive motor. A larger spool would reel faster for the same rpm and pull less; a smaller one would pull harder and resolve finer lengths. With a gearbox of ratio $N$, $T = N\tau/r$ and $v = \omega r/N$, plus the friction you just added.

## The pile grows

As line winds on, the spool's effective diameter grows. Stringman's firmware models that growth as linear in the length wound on: the diameter goes from $D_0$ when empty to $D_f$ when $L_f$ metres are on. Writing $s$ for the length on the spool and $\theta$ for the motor angle in revolutions,

$$ \frac{ds}{d\theta} = \pi D(s) = \pi\Big(D_0 + \frac{D_f - D_0}{L_f}\, s\Big) \quad\Rightarrow\quad s(\theta) = k_1\big(e^{k_2\theta} - 1\big), \ \ k_1 = \frac{D_0 L_f}{D_f - D_0},\ \ k_2 = \frac{\pi (D_f - D_0)}{L_f}. $$

That is the same exponential that the `SpiralCalculator` class in the Stringman repository uses. The constants in its definitions file come from measurement: 7.5 m of fishing line takes the 72 mm spool to 73.1 mm, while 7.5 m of the much thicker two-conductor power line takes it to 86.1 mm. The comments note that two separate fishing-line measurements agreed on 0.15 mm of diameter per metre wound.

How much does ignoring this cost?

- **Fishing line**: winding 7.5 m takes 32.9 revolutions. Assume a constant 72 mm and you would think only 7.44 m went on: 5.7 cm wrong.
- **Power line**: 30.3 revolutions, and the constant-diameter guess says 6.85 m: 65 cm wrong. The pull per newton-metre also drops from 27.8 N to 23.2 N on a full spool.

So the one line that carries power to the gripper needs the pile model the most.

:::figure widget=spool caption="Line on the spool against motor revolutions. The solid curve includes the growing diameter, the dashed line assumes the empty diameter throughout. Switch between the power line and the fishing line, and see what the torque and encoder figures become at each fill."
:::end

## Tension from torque

A direct-drive motor reports its torque from its current. Dividing by the effective radius gives tension, but only after you take off the torque the motor needs just to turn itself. Stringman's spool controller does exactly that:

$$ T = \frac{2\pi\,(\tau_\text{measured} - \tau_\text{hold})}{\text{metres of line per revolution}} $$

with the sign set by the motor's direction. The comments in that code record the numbers: a stopped motor reads −0.011 N·m, holding torques ran from 0.011 to 0.033 N·m across four spools, and moving friction from 0.007 to 0.027 N·m. On a 36 mm radius, 0.033 N·m is 0.9 N. That is the size of the uncertainty in a torque-based tension reading on this hardware, and a reminder that friction differs between units of the same motor.

The same controller runs a 50 Hz loop that keeps at least 0.1 N on each line, nudging the line speed by 0.3 m/s per newton of tension error with a ±0.3 N dead band. It refuses to pay out a line that is already slack, because the comments note that a line paid out slack can come off the spool. This is the practical answer to the null-space problem from Lesson 3: do not fight it with stiff position control, keep every line just taut and let the geometry decide the rest. Independently of the controller, any motor that reads more than 40 N switches off its own torque.

## What one count is worth

Line length is shaft angle times metres per revolution. An encoder with $2^b$ counts per revolution resolves

$$ \Delta l = \frac{\pi D}{2^b} . $$

A 12-bit magnetic encoder such as the AS5600, 4096 positions per turn, on a 72 mm spool resolves 0.055 mm of line. That is far finer than anything else in the length chain: the pile model, line stretch and the anchor positions from Lesson 6 are all millimetres to centimetres. The angle sensor is rarely the weak link. Multi-turn tracking is: the DM motor reports a position that wraps around every 25 rad, just under four turns, and the firmware watches for the jump and unwraps it into absolute revolutions. A missed wrap would be a 90 cm error on this spool. The unwrapping treats any jump of more than half the range between readings as a wrap; at the 50 Hz loop rate a real move that large would need 625 rad/s, against the 11 rad/s that full speed takes, so the test is safe as long as readings keep arriving.

## Worked example

Sizing a desk-scale winch from scratch: 0.5 kg payload, peak tension 5 N per line, 0.2 m/s, 1.5 m of line, a NEMA 17 stepper with 0.4 N·m holding torque and 1/16 microstepping.

1. Choose a 10 mm spool radius. At the holding torque the line could pull $0.4/0.01 = 40$ N, eight times the 5 N needed, a margin you want for steppers because their torque falls with speed and you must never lose steps.
2. Speed: $0.2/0.01 = 20$ rad/s, 191 rpm.
3. Resolution: 200 full steps × 16 = 3,200 microsteps per turn, so $2\pi \times 10/3200 = 0.020$ mm per microstep.
4. Turns for 1.5 m: $1.5/(2\pi \times 0.01) = 23.9$, about 24 turns. Wound in one layer of 0.5 mm line that is a 12 mm wide drum, so you can make the pile problem vanish by keeping to one layer.

## Code it from scratch

:::code file=spool_model.py
```python
import math

def spiral(D0, Df, Lf):
    """Spool diameter grows linearly with line wound on: D(s) = D0 + (Df - D0) s / Lf (metres).
    Returns s(theta) and theta(s), theta in revolutions."""
    k1 = D0 * Lf / (Df - D0)
    k2 = math.pi * (Df - D0) / Lf
    return (lambda th: k1 * (math.exp(k2 * th) - 1)), (lambda s: math.log(s / k1 + 1) / k2)

D0 = 0.072
for name, Df, want_revs, want_err in [("fishing", 0.0731, 32.9, -0.057), ("power", 0.0861, 30.3, -0.651)]:
    wound, revs = spiral(D0, Df, 7.5)
    th = revs(7.5)
    assert abs(wound(th) - 7.5) < 1e-12
    # integrate ds/dtheta = pi D(s) numerically as an independent check of the closed form
    s, n = 0.0, 200000
    for _ in range(n):
        s += math.pi * (D0 + (Df - D0) * s / 7.5) * th / n
    assert abs(s - 7.5) < 1e-3
    err = math.pi * D0 * th - 7.5
    print(f"{name}: {th:.1f} revs for 7.5 m; constant-diameter guess is off by {err * 100:.1f} cm")
    assert abs(th - want_revs) < 0.05 and abs(err - want_err) < 0.001

# torque to tension on the empty and the full power-line spool
assert abs(1 / 0.036 - 27.8) < 0.05 and abs(1 / (0.0861 / 2) - 23.2) < 0.05
rpm = 0.4 / 0.036 * 60 / (2 * math.pi)
assert abs(rpm - 106) < 0.5

def tension(tau_measured, tau_hold, metres_per_rev):
    """Stringman-style estimate: torque with the motor's own friction removed, over the lever arm"""
    return 2 * math.pi * (tau_measured - tau_hold) / metres_per_rev

mpr = math.pi * D0
print(f"0.5 N·m measured, 0.02 N·m hold: {tension(0.5, 0.02, mpr):.2f} N")
print(f"uncertainty from 0.033 N·m of unknown friction: {tension(0.033, 0, mpr):.2f} N")
assert abs(tension(0.5, 0.02, mpr) - 13.33) < 0.01

# what one encoder count is worth
for bits in (12, 14):
    print(f"{bits}-bit encoder on a 72 mm spool: {mpr / 2**bits * 1000:.3f} mm per count")
assert abs(mpr / 4096 * 1000 - 0.055) < 0.001

# desk winch
r = 0.010
assert 0.4 / r == 40 and abs(0.2 / r * 60 / (2 * math.pi) - 191) < 0.5
assert abs(2 * math.pi * r / 3200 * 1000 - 0.0196) < 1e-4 and abs(1.5 / (2 * math.pi * r) - 23.9) < 0.05
print("PASS")
```
:::end

## In practice

Measure the pile, do not compute it from the line's nominal diameter. Line flattens under tension, packs unevenly and crosses itself, which is why the Stringman numbers above are measurements of real spools. Wind under roughly working tension, measure the full diameter with calipers, and check by paying out a known length against a tape. Then do the friction test the Stringman comments describe: with the line off, read the torque the motor needs to hold and to turn, in both directions, for every unit you build.

## Exercises

:::exercise
A spool has a 20 mm radius and a motor with 0.6 N·m peak torque. What line tension and line speed do you get at 300 rpm, and what happens to both if you switch to a 30 mm spool?
:::solution
At 20 mm: $0.6/0.02 = 30$ N and $300 \times 2\pi/60 \times 0.02 = 0.63$ m/s. At 30 mm: 20 N and 0.94 m/s. Radius trades force for speed one for one, exactly like a gear ratio.
:::end

:::exercise
Why does the power line need the pile model so much more than the fishing line?
:::solution
The pile grows with the line's cross-section. The thick two-conductor line takes the diameter from 72 to 86.1 mm over 7.5 m, the fishing line only to 73.1 mm, so the length per revolution changes by 20 % instead of 1.5 %. Over 30 revolutions that becomes 65 cm against 5.7 cm.
:::end

## Quiz

:::quiz
- type: num
  q: Line tension from 1 N·m on an empty 72 mm diameter spool (N)?
  answer: 27.8
  tol: 0.005
  py: "1/0.036"
  explain: T = τ / r with r = 36 mm.
- type: num
  q: Motor speed for 0.4 m/s of line on that spool (rpm)?
  answer: 106
  tol: 0.01
  py: "0.4/0.036*60/(2*math.pi)"
  explain: ω = v / r = 11.1 rad/s.
- type: num
  q: Length of line per count of a 12-bit encoder on a 72 mm spool (mm)?
  answer: 0.0552
  tol: 0.01
  py: "math.pi*72/4096"
  explain: π D / 4096.
- type: mc
  q: Why does Stringman's firmware use an exponential relation between motor angle and wound length?
  options: ["The diameter grows linearly with line wound on, so wound length grows exponentially with angle", "The motor is non-linear", "Line stretch is exponential", "It approximates a gearbox"]
  answer: 0
  explain: ds/dθ = π D(s) with D linear in s.
- type: mc
  q: What must you subtract from the measured motor torque before dividing by the radius to get tension?
  options: ["The motor's own holding or friction torque", "The gravity torque of the spool", "Nothing", "The encoder offset"]
  answer: 0
  explain: Friction differs from unit to unit and in Stringman's measurements was worth up to about 0.9 N.
- type: mc
  q: What is the main reason to use direct drive for a cable robot's winches?
  options: ["Torque becomes a usable tension estimate and the line can be pulled off by hand when relaxed", "It is the cheapest option", "It gives the most torque", "It needs no encoder"]
  answer: 0
  explain: No gearbox friction in between, and the drive is back-drivable.
:::end

:::verify
import math
assert abs(1/0.036-27.8) < 0.05 and abs(0.4/0.036-11.1) < 0.05 and abs(0.4/0.036*60/(2*math.pi)-106) < 0.5
D0=0.072
def th(Df): k1=D0*7.5/(Df-D0); k2=math.pi*(Df-D0)/7.5; return math.log(7.5/k1+1)/k2
assert abs(th(0.0731)-32.9) < 0.05 and abs(math.pi*D0*th(0.0731)-7.44) < 0.005 and abs(math.pi*D0*th(0.0731)-7.5+0.057) < 0.001
assert abs(th(0.0861)-30.3) < 0.05 and abs(math.pi*D0*th(0.0861)-6.85) < 0.005 and abs(1/0.04305-23.2) < 0.05
assert abs(0.033/0.036-0.9) < 0.05 and abs(math.pi*72/4096-0.055) < 0.001 and abs(math.pi*0.072-0.23) < 0.01
assert abs((86.1-72)/72-0.2) < 0.005 and abs((73.1-72)/72-0.015) < 0.001 and abs(1.1/7.5-0.15) < 0.005 and abs(3.0/20-0.15) < 1e-9
assert 0.4/0.01 == 40 and abs(0.2/0.01*60/(2*math.pi)-191) < 0.5 and abs(2*math.pi*10/3200-0.020) < 0.001 and abs(1.5/(2*math.pi*0.01)-23.9) < 0.05 and abs(24*0.5-12) < 1e-9
assert abs(25/(2*math.pi)*math.pi*0.072-0.90) < 0.005 and abs(12.5*50-625) < 1e-9 and 25/(2*math.pi) < 4
assert abs(300*2*math.pi/60*0.02-0.63) < 0.005 and abs(300*2*math.pi/60*0.03-0.94) < 0.005
:::end

## Sources

- Neufangled, [Stringman home page](https://neufangled.com/) (DM-H6215 1 N·m direct-drive actuators, $66 each in the parts list, 0.4 m/s, 28 N limit).
- Stringman firmware, Apache-2.0: [`spools.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/spools.py) (SpiralCalculator), [`definitions.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/common/definitions.py) (72 mm spool, measured full diameters), [`spool_dm.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/spool_dm.py) (tension estimate, friction measurements, tension floor, 40 N cut-off, position unwrapping), all at commit e1ee31d.
- ams OSRAM, [AS5600 datasheet](https://www.infineon.com/assets/row/public/documents/30/49/infineon-as5600-datasheet-en.pdf) (12-bit, 4096 positions per revolution; the ams OSRAM document, now hosted by Infineon).
