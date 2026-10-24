---
id: p09-l10
minutes: 40
summary: A brushless motor moves the commutator into electronics, so three Hall sensors tell the drive which pair of windings to energise. You derive the six-step commutation table that keeps the stator field 60 to 120 degrees ahead of the rotor, implement it, and simulate the motor spinning correctly in both directions.
---

## Brushless DC

A **BLDC** motor has permanent magnets on the rotor and three windings (A, B, C) on the stator, usually star-connected. A brushed motor's commutator switches the current mechanically to keep the field ahead of the rotor; in a BLDC, a three-phase bridge (three half-bridges, lesson 6) does it electronically.

With a $p$-pole-pair rotor, one mechanical revolution is $p$ electrical cycles. Everything below is in electrical degrees.

## Six vectors from six pairs

At any time, drive current into one phase and out of another, and leave the third floating. With phase axes at 0°, 120° and 240°, the stator field of "X+ Y−" points along $\hat x - \hat y$. That gives six directions, 60° apart:

| Pair | Field angle |
|---|---|
| A+ B− | 330° |
| A+ C− | 30° |
| B+ C− | 90° |
| B+ A− | 150° |
| C+ A− | 210° |
| C+ B− | 270° |

Torque is proportional to $\sin(\text{lead})$, the angle by which the stator field leads the rotor magnet. Keep the lead between 60° and 120°: each vector serves a 60° sector of rotor angle, and the torque varies between $\sin 60° = 0.87$ and 1, averaging $3/\pi = 0.955$. That's a ripple of 13 % from geometry alone.

## Hall sensors

Three Hall sensors 120° apart, each high for half a cycle, produce six codes, one per sector. Forward the sequence is 1, 3, 2, 6, 4, 5; codes 0 and 7 are impossible and mean a broken sensor wire. The commutation table maps each code to a pair. For reverse, pick the vector that *lags* by 60–120° instead, which is the pair with + and − swapped from 180° away.

:::figure widget=sixstep caption="Rotor magnet (blue) and the stator field of the energised pair (lime). Turn the rotor: at each Hall transition the drive steps the field 60° on, keeping it 60–120° ahead (or behind, in reverse)."
:::end

## Worked example

A scooter hub motor with $p = 15$ pole pairs at 600 rpm.

1. Mechanical: 10 rev/s. Electrical: $15\cdot10 = 150$ Hz.
2. Commutations: 6 per electrical cycle, 900 per second, one every 1.11 ms.
3. Rotor in sector 0 (Hall code 001, between −30° and 30°): forward drives B+ C− (90°), with lead 60–120°. Reverse drives C+ B− (270°).

## Code it from scratch

:::code file=six_step.py
```python
import numpy as np

HALL = [1, 3, 2, 6, 4, 5]                     # forward Hall sequence, sector 0..5
PAIR_AT = {330: ("A", "B"), 30: ("A", "C"), 90: ("B", "C"), 150: ("B", "A"), 210: ("C", "A"), 270: ("C", "B")}
AXIS = {"A": 0.0, "B": 120.0, "C": 240.0}

def hall_code(theta_deg):
    sector = int(((theta_deg + 30) % 360) // 60)
    return HALL[sector]

def commutate(code, forward=True):
    """Hall code -> (high phase, low phase). Builds the table from geometry, not by hand."""
    sector = HALL.index(code)
    field = (60 * sector + (90 if forward else -90)) % 360
    return PAIR_AT[field]

def field_angle(pair):
    x, y = pair
    v = np.array([np.cos(np.radians(AXIS[x])) - np.cos(np.radians(AXIS[y])),
                  np.sin(np.radians(AXIS[x])) - np.sin(np.radians(AXIS[y]))])
    return np.degrees(np.arctan2(v[1], v[0])) % 360

def spin(forward, T=0.3, dt=1e-5, J=2e-5, b=1e-4, Tmax=0.05):
    th = 10.0; w = 0.0                          # electrical degrees, rad/s (electrical)
    lead_seen = []
    for _ in range(int(T / dt)):
        pair = commutate(hall_code(th), forward)
        lead = (field_angle(pair) - th + 180) % 360 - 180
        lead_seen.append(lead)
        w += dt * (Tmax * np.sin(np.radians(lead)) - b * w) / J
        th = (th + np.degrees(w) * dt) % 360
    return w, np.array(lead_seen)

if __name__ == "__main__":
    # the geometric pair table is what we claimed
    for ang, pair in PAIR_AT.items():
        assert abs(field_angle(pair) - ang) < 1e-9
    # every Hall sector gets a vector 60..120 deg ahead (forward) or behind (reverse)
    for th in np.arange(0, 360, 0.5):
        for fwd in (True, False):
            lead = (field_angle(commutate(hall_code(th), fwd)) - th + 180) % 360 - 180
            assert 59.99 <= (lead if fwd else -lead) <= 120.01
    wf, lf = spin(True); wr, lr = spin(False)
    print(f"forward speed {wf:.0f} rad/s, reverse {wr:.0f} rad/s")
    assert wf > 100 and wr < -100 and abs(wf + wr) < 0.02 * wf
    # average torque factor 3/pi, ripple 1 - sin 60
    s = np.sin(np.radians(np.linspace(60, 120, 100001)))
    assert abs(s.mean() - 3 / np.pi) < 1e-4 and abs(1 - s.min() - 0.134) < 1e-3
```
:::end

## Exercises

:::exercise
A Hall sensor reads code 7. What should the drive do?
:::solution
Codes 0 and 7 can't occur with healthy sensors (they'd need all three high or all low). Treat it as a fault: switch all phases off (or to a safe braking state) and report a Hall error, rather than looking up a table entry.
:::end

:::exercise
At high speed the drive commutates slightly early ("phase advance"). Why?
:::solution
The winding inductance delays the current's rise after each commutation, so the effective field lags the table. Commutating early by the delay angle $\omega_e L/R$ (roughly) lines up the actual current with the intended sector and recovers torque at speed.
:::end

## Quiz

:::quiz
- type: num
  q: Electrical frequency in Hz of a 15-pole-pair motor at 600 rpm?
  answer: 150
  tol: 0.001
  unit: Hz
  py: "15*600/60"
  explain: p × mechanical rev/s.
- type: num
  q: Commutation events per second at that speed?
  answer: 900
  tol: 0.001
  py: "6*150"
  explain: Six per electrical cycle.
- type: num
  q: Average torque factor of six-step with ideal 60–120° lead?
  answer: 0.9549
  tol: 0.001
  py: "3/math.pi"
  explain: Mean of sin over 60–120°.
- type: num
  q: Field angle in degrees of the pair A+ C−?
  answer: 30
  tol: 0.001
  unit: °
  py: "math.degrees(math.atan2(0-math.sin(math.radians(240)), 1-math.cos(math.radians(240))))"
  explain: Â − Ĉ.
- type: mc
  q: In six-step drive, how many phases carry current at a time?
  options:
    - one
    - two
    - three
    - it alternates between one and three
  answer: 1
  explain: One in, one out, one floating.
- type: mc
  q: To reverse a BLDC, the drive…
  options:
    - reverses the Hall sequence wiring
    - picks the vector lagging the rotor by 60–120°
    - swaps the bus polarity
    - lowers the PWM frequency
  answer: 1
  explain: Torque sign follows sin(lead).
:::end

:::verify
assert abs(1/(6*150) - 1.11e-3) < 0.01e-3
:::end
