---
id: p07-l08
minutes: 35
summary: A brushless DC motor needs to know where its rotor is to switch the right coils. You derive the Hall voltage, read three Hall sensors as a six-state code, derive the commutation table that maximises torque, detect the rotation direction, and estimate speed from the state changes.
---

## The Hall effect

Push a current $I$ through a thin conductor of thickness $t$ in a magnetic field $B$ perpendicular to it. The Lorentz force pushes the carriers to one side, building a transverse voltage:

$$V_H = \frac{I B}{n q t},$$

where $n$ is the carrier density and $q$ the electron charge. Semiconductors have a small $n$, so they give usable voltages. Hall switch ICs add an amplifier and a Schmitt trigger (Phase 05) and output a clean digital level: on near a south pole, off near a north pole.

## Three sensors, six states

A BLDC motor places three Hall switches 120 electrical degrees apart. Rotating magnets produce a three-bit code that changes every 60°:

$$101 \to 100 \to 110 \to 010 \to 011 \to 001 \to 101\ \ \text{(one direction)}.$$

Like quadrature (Phase 06), only one bit changes at a time. 000 and 111 never occur and signal a broken wire.

**Six-step commutation**: in each 60° sector, drive one phase high and one low and leave the third floating, choosing the pair whose back-EMF is largest, so the torque is maximised. Mount the sensors so their transitions sit 30° from the back-EMF zero crossings. The torque then dips to $\cos 30° = 86.6$ % of its peak at each switch: the characteristic 13 % ripple of six-step drive.

**Speed**: six transitions per electrical revolution and $p$ pole pairs per mechanical revolution give $6p$ transitions per turn. Time them like the period method of lesson 7.

:::figure widget=hall caption="The three Hall signals over one electrical revolution. Move the rotor and read the code, the sector and the two driven phases."
:::end

## Worked example

A motor with 4 pole pairs spins at 3000 rpm.

1. Electrical frequency: $50\text{ rev/s}\times4 = 200$ Hz.
2. Hall transitions: $6\times200 = 1200$ per second, one every 0.83 ms.
3. At code 100 the table drives A high and B low. Next, at 110, it switches B off and drives C low.
4. A Hall sensor with $I = 1$ mA, $B = 0.1$ T, $n = 10^{21}$ m⁻³ and $t = 10$ µm gives $V_H = 10^{-4}/(10^{21}\cdot1.6\times10^{-19}\cdot10^{-5}) = 62.5$ mV.

## Code it from scratch

:::code file=hall_bldc.py
```python
import itertools
import numpy as np

def hall_code(theta_e_deg):
    t = theta_e_deg % 360
    return "".join("1" if (t - off) % 360 < 180 else "0" for off in (0, 120, 240))

def back_emf(theta_e_deg, phase):                       # phase 0, 1, 2 = A, B, C; 30 deg from the Hall edges
    return np.sin(np.radians(theta_e_deg - 120 * phase - 30))

def derive_table():
    """For each Hall sector choose (high, low) maximising the worst-case torque over the sector."""
    table = {}
    for sector in range(6):
        th = np.linspace(60 * sector + 0.5, 60 * sector + 59.5, 120)
        best = max(itertools.permutations(range(3), 2),
                   key=lambda hl: np.min(back_emf(th, hl[0]) - back_emf(th, hl[1])))
        table[hall_code(60 * sector + 30)] = ("ABC"[best[0]] + "+", "ABC"[best[1]] + "-")
    return table

SEQUENCE = ["101", "100", "110", "010", "011", "001"]   # increasing electrical angle

def direction(prev, new):
    i, j = SEQUENCE.index(prev), SEQUENCE.index(new)
    return {1: +1, 5: -1}.get((j - i) % 6, 0)

if __name__ == "__main__":
    table = derive_table()
    print(table)
    assert table["100"] == ("A+", "B-") and table["110"] == ("A+", "C-") and table["010"] == ("B+", "C-")
    assert table["011"] == ("B+", "A-") and table["001"] == ("C+", "A-") and table["101"] == ("C+", "B-")
    # torque never drops below cos(30 deg) of its peak (sqrt(3) for a line-to-line pair)
    th = np.linspace(0, 360, 3601)[:-1]
    tq = []
    for a in th:
        hi, lo = table[hall_code(a)]
        tq.append(back_emf(a, "ABC".index(hi[0])) - back_emf(a, "ABC".index(lo[0])))
    tq = np.array(tq) / np.sqrt(3)
    assert tq.min() > 0.865 and abs(tq.max() - 1) < 1e-3
    # direction and speed from simulated Hall edges, 4 pole pairs at 3000 rpm, then reversing
    p, rpm = 4, 3000
    t = np.arange(0, 0.02, 1e-6)
    theta_e = 360 * p * (rpm / 60) * t
    codes = [hall_code(a) for a in theta_e]
    edges = [i for i in range(1, len(codes)) if codes[i] != codes[i - 1]]
    assert all(direction(codes[i - 1], codes[i]) == +1 for i in edges)
    period = np.diff(t[edges]).mean()
    est_rpm = 60 / (6 * p * period)
    assert abs(est_rpm - 3000) < 5
    rev = [hall_code(-a) for a in theta_e[:3000]]
    assert all(direction(rev[i - 1], rev[i]) == -1 for i in range(1, len(rev)) if rev[i] != rev[i - 1])
    assert abs(1e-3 * 0.1 / (1e21 * 1.602e-19 * 1e-5) - 0.0624) < 0.001
    print(f"speed from Hall edges: {est_rpm:.0f} rpm, minimum torque {tq.min():.3f} of peak")
```
:::end

## Exercises

:::exercise
Your controller sees 111 from the Hall sensors. What happened, and what should the drive do?
:::solution
111 (and 000) can't occur with correctly placed sensors, so a sensor or its pull-up has failed (or a wire is open). Disable the bridge, report a fault and don't guess a sector.
:::end

:::exercise
How many Hall transitions per mechanical revolution does a 7-pole-pair hub motor produce, and what's the angular resolution?
:::solution
$6\times7 = 42$ transitions, one every 8.6°. That's enough for commutation but coarse for position control, which is why servo drives add an encoder.
:::end

## Quiz

:::quiz
- type: num
  q: Hall transitions per second for 4 pole pairs at 3000 rpm?
  answer: 1200
  tol: 0.001
  py: "6*4*3000/60"
  explain: 6 per electrical revolution.
- type: num
  q: Hall voltage in mV for I = 1 mA, B = 0.1 T, n = 1e21 m⁻³, t = 10 µm?
  answer: 62.42
  tol: 0.005
  unit: mV
  py: "1e-3*0.1/(1e21*1.602e-19*1e-5)*1000"
  explain: V_H = IB/(nqt).
- type: mc
  q: Which Hall codes indicate a fault?
  options:
    - 101 and 010
    - 000 and 111
    - 100 and 011
    - none
  answer: 1
  explain: They never occur in normal rotation.
- type: num
  q: Minimum six-step torque as a percentage of peak?
  answer: 86.6
  tol: 0.001
  unit: '%'
  py: "math.cos(math.radians(30))*100"
  explain: cos 30°.
- type: mc
  q: In six-step drive, during each sector…
  options:
    - all three phases conduct
    - one phase is high, one low and one floating
    - only one phase conducts
    - the phases are sinusoidal
  answer: 1
  explain: Two phases conduct.
- type: num
  q: Transitions per mechanical revolution for 7 pole pairs?
  answer: 42
  tol: 0.001
  py: "6*7"
  explain: 6p.
:::end

:::verify
assert 6*4*50 == 1200
:::end
