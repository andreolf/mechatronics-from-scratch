---
id: p12-l15
minutes: 35
summary: A mechanical watch keeps time with a balance wheel and hairspring, a torsional oscillator topped up by tiny impulses from the escapement, and it is a good timekeeper only because its period hardly depends on how far it swings. You derive the oscillator's period and the energy balance that sets its amplitude, simulate impulses with event detection, and test that impulses at the centre leave the period independent of amplitude while impulses off-centre or a nonlinear spring do not.
---

## The oscillator

A balance wheel of inertia $I$ on a spiral hairspring of stiffness $\kappa$ obeys

$$I\ddot\theta + c\dot\theta + \kappa\theta = \tau_{esc}(t), \qquad T_0 = 2\pi\sqrt{I/\kappa}.$$

A common modern beat is 28 800 vibrations per hour, which is 4 Hz. With $I = 1\times10^{-9}$ kg·m² (10 mg·cm², illustrative) that needs $\kappa = I(2\pi \cdot 4)^2 = 6.3\times10^{-7}$ N·m/rad. A linear spring gives a period that doesn't depend on amplitude at all: this property is **isochronism**, and it's what makes the balance a clock.

## Escapement and energy

Friction and air drain energy at a rate set by the quality factor $Q = I\omega_0/c$. Twice per period, as the balance swings through the centre, the escapement's pallet fork gives it a small kick of energy $E_i$. In steady state the energy per cycle balances:

$$2E_i = \oint c\dot\theta\,d\theta = \pi c\,\omega_0 A^2 \quad\Rightarrow\quad A = \sqrt{\frac{2E_i}{\pi c\,\omega_0}}.$$

Amplitude settles wherever the mainspring's push and the losses agree, typically 200° to 300°, and changes as the mainspring runs down. So the period must not depend on $A$.

## Where it goes wrong

- **Off-centre impulse.** Airy's result: a kick given before the centre makes the clock gain, one after makes it lose, and the effect shrinks as amplitude grows. So the period depends on amplitude unless the kick lands exactly at the centre.
- **Nonlinear spring.** If $\kappa$ rises with angle, $\kappa(1 + \epsilon\theta^2)$, the frequency rises with amplitude: $\omega \approx \omega_0(1 + \tfrac38\epsilon A^2)$.
- **Damping** lowers the frequency by a factor $\sqrt{1 - 1/(4Q^2)}$, a constant offset that regulation removes.

Rates are quoted in seconds per day: $86\,400\,(T_0/T - 1)$, positive for gaining.

:::figure widget=balancewheel caption="A balance wheel ticking, with each escapement kick marked. Move the kick away from the centre or stiffen the spring's nonlinearity, then change the amplitude and watch the rate in seconds per day."
:::end

## Worked example

$Q = 250$, $f_0 = 4$ Hz, target amplitude 270°.

1. Damping coefficient: $c = I\omega_0/Q = 1.005\times10^{-10}$ N·m·s.
2. Impulse energy: $E_i = \pi c\,\omega_0 A^2/2 = \pi \times 1.005\times10^{-10} \times 25.13 \times 4.71^2/2 = 88$ nJ per kick.
3. Damping offset: $\zeta = 1/(2Q) = 0.002$, so the rate is $-86\,400\,\zeta^2/2 = -0.17$ s/day at any amplitude.
4. With $\epsilon = 10^{-3}$ rad⁻², going from 200° to 300° changes the rate by $\tfrac38\epsilon(A_2^2 - A_1^2)\times 86\,400 = 493$ s/day. Real hairsprings are made very linear for exactly this reason.

## Code it from scratch

:::code file=balance.py
```python
import numpy as np
from scipy.integrate import solve_ivp

f0, I, Q = 4.0, 1e-9, 250.0
w0 = 2 * np.pi * f0; kap = I * w0 ** 2; c = I * w0 / Q
DAY = 86400

def run(A, th_i=0.0, eps=0.0, nimp=60):
    """balance wheel kicked with energy E_i each time it passes theta = -th_i on its way to the centre"""
    E = np.pi * c * w0 * A ** 2 / 2
    rhs = lambda t, s: [s[1], -(kap * (s[0] + eps * s[0] ** 3) + c * s[1]) / I]
    s, t, times, amp = np.array([A, 0.0]), 0.0, [], 0.0
    for _ in range(nimp):
        d = -int(np.sign(s[1])) if s[1] != 0 else (-1 if s[0] > 0 else 1)   # direction of the next swing
        ev = lambda t, s: s[0] + d * th_i
        ev.terminal, ev.direction = True, d
        sol = solve_ivp(rhs, (t, t + 1), s, events=ev, rtol=1e-12, atol=1e-15, method="DOP853")
        t, s = sol.t_events[0][0], sol.y_events[0][0].copy()
        s[1] = d * np.sqrt(s[1] ** 2 + 2 * E / I)                             # the escapement's kick
        times.append(t); amp = np.max(np.abs(sol.y[0]))
    times = np.array(times)
    period = np.mean(times[22::2] - times[20:-2:2])
    return DAY * (1 / f0 / period - 1), np.degrees(amp)

def test_centre_impulse_isochronous():
    rates = {}
    for A in (200, 270, 300):
        rate, amp = run(np.radians(A))
        rates[A] = rate
        print(f"kick at centre, amplitude {amp:5.1f} deg: rate {rate:+.4f} s/day")
        assert abs(amp - A) < 1.5                             # energy balance sets the amplitude
    spread = max(rates.values()) - min(rates.values())
    assert spread < 1e-3                                      # period independent of amplitude
    assert abs(rates[270] + DAY * (1 / (2 * Q)) ** 2 / 2) < 1e-3   # only the damping offset remains

def test_off_centre_impulse_not_isochronous():
    r200, _ = run(np.radians(200), th_i=np.radians(10))
    r300, _ = run(np.radians(300), th_i=np.radians(10))
    print(f"kick 10 deg before centre: {r200:+.2f} s/day at 200 deg, {r300:+.2f} s/day at 300 deg")
    assert r200 > r300 > 0                                     # gains, and less so at large amplitude (Airy)

def test_nonlinear_spring():
    eps = 1e-3
    r200, _ = run(np.radians(200), eps=eps)
    r300, _ = run(np.radians(300), eps=eps)
    pred = 3 / 8 * eps * (np.radians(300) ** 2 - np.radians(200) ** 2) * DAY
    print(f"cubic spring: rate changes by {r300 - r200:.0f} s/day from 200 to 300 deg (Lindstedt {pred:.0f})")
    assert abs((r300 - r200) - pred) / pred < 0.05

test_centre_impulse_isochronous()
test_off_centre_impulse_not_isochronous()
test_nonlinear_spring()
print("PASS")
```
:::end

## Exercises

:::exercise
A watch's balance has $Q = 250$ when flat but 200 when vertical, because of pivot friction. With the same impulse energy, how much does the amplitude change, and does the rate change?
:::solution
$A \propto \sqrt{1/c} \propto \sqrt Q$, so amplitude falls by $\sqrt{200/250} = 0.894$, from 270° to 241°. With a centre kick and a linear spring the rate doesn't change, apart from the damping offset moving from −0.17 to −0.27 s/day. Real watches show positional errors because the kick isn't perfectly centred and the balance isn't perfectly poised.
:::end

:::exercise
Why does a pendulum clock face the same problem as the nonlinear hairspring?
:::solution
A pendulum's restoring torque is $mg\ell\sin\theta$, which softens with angle, so its period grows with amplitude: $T \approx T_0(1 + \theta_0^2/16)$. That's circular error; clockmakers keep the swing small and constant.
:::end

## Quiz

:::quiz
- type: num
  q: Frequency in Hz of a balance beating 28 800 vibrations per hour (two vibrations per period)?
  answer: 4
  tol: 0
  unit: Hz
  py: "28800/3600/2"
  explain: 8 vibrations per second, 4 periods.
- type: num
  q: Hairspring stiffness in N·m/rad for 4 Hz with I = 1e-9 kg·m²?
  answer: 6.317e-7
  tol: 0.002
  unit: N·m/rad
  py: "1e-9*(2*3.14159265*4)**2"
  explain: κ = I ω².
- type: num
  q: Rate offset in s/day from damping alone with Q = 250?
  answer: -0.1728
  tol: 0.01
  unit: s/day
  py: "-86400*(1/500)**2/2"
  explain: −86 400 ζ²/2 with ζ = 1/(2Q).
- type: num
  q: Factor by which amplitude changes if Q drops from 250 to 200 at the same impulse energy?
  answer: 0.894
  tol: 0.002
  py: "(200/250)**0.5"
  explain: A ∝ √Q.
- type: mc
  q: Where should the escapement kick the balance to keep it isochronous?
  options:
    - at the centre, where the spring torque is zero
    - at maximum amplitude
    - at 90°
    - anywhere
  answer: 0
  explain: Airy's theorem.
- type: mc
  q: A hairspring that stiffens with angle makes the watch…
  options:
    - gain more at larger amplitude
    - lose at larger amplitude
    - keep perfect time
    - stop
  answer: 0
  explain: Frequency rises with amplitude.
:::end
