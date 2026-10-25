---
id: p19-l08
minutes: 40
summary: Three half-bridges make a three-phase inverter that drives AC and brushless motors. You derive space vector modulation from the hexagon of eight switch states, implement the sector and dwell-time calculation, check that the averaged phase voltages match the reference everywhere, and show SVPWM gives 15.5 % more voltage than sine PWM.
---

## Eight states, six vectors

A three-phase inverter has three legs, each connecting its motor phase to the DC bus top or bottom. That gives $2^3 = 8$ switch states. Expressed in the stationary $\alpha\beta$ frame (Clarke transform, Phase 09), six of them are **active vectors** of length $\tfrac23 V_{dc}$ at 60° steps, forming a hexagon, and two (000 and 111) are **zero vectors**.

## Synthesising any vector

To produce a reference $\vec v^*$ on average over one PWM period, use the two active vectors of the sector it lies in, for fractions $T_1$ and $T_2$ of the period, and zero vectors for the rest:

$$T_1 = m \sin(60° - \theta), \qquad T_2 = m \sin\theta, \qquad T_0 = 1 - T_1 - T_2, \qquad m = \frac{\sqrt3\, |\vec v^*|}{V_{dc}},$$

with $\theta$ the angle within the sector. Splitting $T_0$ equally between 000 and 111 and arranging the vectors symmetrically gives a centred pattern with the fewest transitions.

## The linear range

The largest circle inside the hexagon has radius $V_{dc}/\sqrt3$: that is the largest sinusoidal phase amplitude SVPWM can produce without distortion. Plain sine PWM, with each leg following its own sine around $V_{dc}/2$, reaches only $V_{dc}/2$. The difference, $2/\sqrt3 = 1.155$, is 15.5 % more voltage, and so more speed, from the same battery. SVPWM is equivalent to sine PWM plus a common-mode signal $-\tfrac12(\max + \min)$ of the three references, which the star-connected motor does not see.

:::figure widget=svhex caption="The space vector hexagon with the reference vector. Drag the reference or use the sliders; the readout shows sector, dwell times and leg duty cycles."
:::end

## Worked example

48 V bus:

1. At 90 % of the linear range, over 361 angles, the averaged phase voltages (leg voltages minus their common mode, transformed to $\alpha\beta$) match the reference to within $2.00 \times 10^{-14}$ V, and every duty cycle stays between 0 and 1.
2. A 20 V reference at 40° lies in sector 1: $T_1 = 0.2468$, $T_2 = 0.4639$, $T_0 = 0.2893$. The leg duties are $(0.8554, 0.6085, 0.1446)$ and the phase voltages $(15.321, 3.473, -18.794)$ V.
3. The largest phase amplitude is 27.71 V with SVPWM against 24.00 V with sine PWM, 15.5 % more.
4. With 25 V references (beyond sine PWM's reach), SVPWM and sine-plus-min-max-injection duties agree to $5.00 \times 10^{-16}$.

## Code it from scratch

:::code file=svpwm.py
```python
import numpy as np

def svpwm(valpha, vbeta, vdc):
    """space vector modulation: find the sector, the dwell times of its two active vectors, split the zero time
    equally between 000 and 111, and return the duty cycle of each leg (high-side on-time fraction)"""
    mag, ang = np.hypot(valpha, vbeta), np.arctan2(vbeta, valpha) % (2 * np.pi)
    sector = min(int(ang // (np.pi / 3)), 5); th = ang - sector * np.pi / 3
    m = np.sqrt(3) * mag / vdc                                              # 1 at the edge of the linear range
    t1, t2 = m * np.sin(np.pi / 3 - th), m * np.sin(th)                    # fractions of the period
    if t1 + t2 > 1: t1, t2 = t1 / (t1 + t2), t2 / (t1 + t2)                # overmodulation: clamp to the hexagon
    t0 = 1 - t1 - t2
    V = [(1, 0, 0), (1, 1, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1), (1, 0, 1)]   # the six active switch states
    a, b = np.array(V[sector]), np.array(V[(sector + 1) % 6])
    return t0 / 2 + t1 * a + t2 * b, sector, (t1, t2, t0)                  # each leg is on during its active vectors + 111

def leg_to_phase(d, vdc):
    """average leg voltages d vdc, minus their common mode, give the phase voltages of a star-connected motor"""
    v = d * vdc; return v - v.mean()

def clarke(va, vb, vc): return (2 / 3) * (va - 0.5 * vb - 0.5 * vc), (vb - vc) / np.sqrt(3)

def test_matches_reference():
    vdc = 48.0; worst = 0.0
    for ang in np.linspace(0, 2 * np.pi, 361):
        mag = 0.9 * vdc / np.sqrt(3); va, vb = mag * np.cos(ang), mag * np.sin(ang)
        d, sec, _ = svpwm(va, vb, vdc); ph = leg_to_phase(d, vdc); a, b = clarke(*ph)
        worst = max(worst, np.hypot(a - va, b - vb)); assert np.all((d >= -1e-12) & (d <= 1 + 1e-12))
    print(f"90 % of the linear range, 361 angles: largest error between averaged output and reference {worst:.2e} V")
    assert worst < 1e-9

def test_example_and_range():
    vdc = 48.0; va, vb = 20 * np.cos(np.radians(40)), 20 * np.sin(np.radians(40))
    d, sec, (t1, t2, t0) = svpwm(va, vb, vdc)
    print(f"20 V at 40 deg: sector {sec + 1}, T1 {t1:.4f}, T2 {t2:.4f}, T0 {t0:.4f}; leg duties {np.round(d, 4)}; "
          f"phase voltages {np.round(leg_to_phase(d, vdc), 3)}")
    sv, sine = vdc / np.sqrt(3), vdc / 2
    print(f"largest phase amplitude: SVPWM {sv:.2f} V, sine PWM {sine:.2f} V (+{100 * (sv / sine - 1):.1f} %)")
    assert sec == 0 and abs(sv / sine - 2 / np.sqrt(3)) < 1e-12

def test_minmax_equivalence():
    vdc = 48.0; t = np.linspace(0, 2 * np.pi, 100); mag = 25.0; worst = 0
    for th in t:
        ref = mag * np.cos(th - np.array([0, 2 * np.pi / 3, 4 * np.pi / 3]))
        dz = 0.5 + (ref - 0.5 * (ref.max() + ref.min())) / vdc            # sine plus min-max common-mode injection
        d, _, _ = svpwm(*clarke(*ref), vdc); worst = max(worst, abs(d - dz).max())
    print(f"SVPWM equals sine PWM with min-max injection: largest duty difference {worst:.2e}")
    assert worst < 1e-12

test_matches_reference()
test_example_and_range()
test_minmax_equivalence()
print("PASS")
```
:::end

## In practice

Field-oriented control of a brushless motor (Phase 09) computes $v_\alpha, v_\beta$ every PWM period and passes them to SVPWM, usually in a motor-control MCU with centre-aligned timers and hardware dead time (STM32 motor control, TI C2000, the open-source VESC and ODrive firmware). NumPy is enough to check the algorithm; dead time and the switches' voltage drops add small distortions that firmware compensates.

## Exercises

:::exercise
Which sector and dwell times give a 10 V reference at 90° on a 48 V bus?
:::solution
90° lies in sector 2 (60° to 120°) with $\theta = 30°$. $m = \sqrt3 \times 10/48 = 0.361$, so $T_1 = T_2 = 0.361 \times \sin 30° = 0.180$ and $T_0 = 0.639$.
:::end

:::exercise
Why does injecting a common-mode signal not disturb the motor?
:::solution
A star-connected motor without a neutral connection responds only to differences between phase voltages. Adding the same voltage to all three legs moves the star point, not the currents.
:::end

## Quiz

:::quiz
- type: num
  q: Largest linear SVPWM phase amplitude on a 400 V bus (V)?
  answer: 230.9
  tol: 0.002
  py: "400/math.sqrt(3)"
  explain: Vdc/√3.
- type: num
  q: Switch states of a three-leg inverter?
  answer: 8
  tol: 0.001
  py: "2**3"
  explain: Six active, two zero.
- type: num
  q: Modulation index m for 20 V on a 60 V bus?
  answer: 0.5774
  tol: 0.002
  py: "math.sqrt(3)*20/60"
  explain: √3 |v| / Vdc.
- type: num
  q: Extra voltage of SVPWM over sine PWM (percent)?
  answer: 15.47
  tol: 0.002
  py: "(2/math.sqrt(3)-1)*100"
  explain: 2/√3 − 1.
- type: mc
  q: The zero-vector time in SVPWM is usually…
  options:
    - split between 000 and 111
    - always spent in 000
    - always spent in 111
    - removed by raising the frequency
  answer: 0
  explain: That centres the pattern.
- type: mc
  q: SVPWM is equivalent to sine PWM plus…
  options:
    - a common-mode signal of minus half the sum of max and min
    - a third harmonic of the current
    - a DC offset on one phase
    - a dead-time correction
  answer: 0
  explain: Min-max injection.
:::end
