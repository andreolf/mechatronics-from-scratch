---
id: p13-l05
minutes: 35
summary: Proportional control makes the actuator effort proportional to the error, and raising its gain moves the closed-loop poles, first speeding the response and shrinking the steady error and then, past a point, making it overshoot. You derive where the poles of a DC motor speed loop go as the gain rises, tune a gain for a given damping ratio, and test that the steady error to a step is exactly one over one plus Kp for this type 0 loop.
---

## The plant

With inductance included, a DC motor from voltage to speed is second order (lesson p12-l06):

$$G(s) = \frac{k}{(Ls + R)(Js + b) + k^2}.$$

With the lab motor's values ($R = 1.2$ Ω, $L = 2$ mH, $k = 0.05$, $J = 2\times10^{-4}$, $b = 2\times10^{-5}$) its poles are at $-10.7$ and $-589$ s⁻¹: a slow mechanical pole and a fast electrical one. Its DC gain is $G(0) = 19.81$ (rad/s)/V.

To keep numbers clean, measure speed in units of $G(0)$ so the plant has unit DC gain, $G_n = G/G(0)$, and use the controller $u = K_pe$. Then the loop gain at DC is just $K_p$.

## Where the poles go

The closed-loop characteristic polynomial is $a(s) + K_p\,a(0)$ where $a(s) = LJs^2 + (Lb + RJ)s + (Rb + k^2)$. Only the constant term changes, so:

- the sum of the poles is fixed at $-(Lb + RJ)/(LJ) = -600.1$;
- they move towards each other, meet at $-300$ when $(1 + K_p) = (Lb + RJ)^2/(4LJ\,a(0)) = 14.27$, then split vertically.

So $\omega_n = \sqrt{a(0)(1 + K_p)/(LJ)}$ grows with gain while $\zeta$ falls as $1/\sqrt{1 + K_p}$, and overshoot appears.

## Steady error

The loop is type 0 with $K_p$ as its position constant (lesson 04), so

$$e_{ss} = \frac{1}{1 + K_p}.$$

High gain shrinks the error but never removes it, and costs damping: there's a direct trade between accuracy and overshoot.

:::figure widget=pgain caption="Step responses of the motor speed loop under proportional control. Raise K_p: the steady error shrinks as 1/(1 + K_p), the response speeds up, and past K_p ≈ 13 it starts to overshoot."
:::end

## Worked example

Choose $K_p$ for $\zeta = 0.707$ (about 4 % overshoot).

1. $2\zeta\omega_n = 600.1$, so $\omega_n = 424.4$ rad/s.
2. $1 + K_p = \omega_n^2 LJ/a(0) = 424.4^2 \times 4\times10^{-7}/2.524\times10^{-3} = 28.5$, so $K_p = 27.5$.
3. Steady error: $1/28.5 = 3.5$ %. If that's too much, more gain won't help without more overshoot; you need integral action (lesson 06).

## Code it from scratch

:::code file=pcontrol.py
```python
import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
a = np.array([L * J, L * b + R * J, R * b + k * k])       # G = k / a(s)
G0 = k / a[2]

def closed_loop(Kp):
    return signal.lti([Kp * a[2]], a + np.array([0, 0, Kp * a[2]]))

def step_metrics(Kp):
    t = np.linspace(0, 2.0, 100001)
    _, y = signal.step(closed_loop(Kp), T=t)
    final = Kp / (1 + Kp)
    return 1 - y[-1], max(0.0, (y.max() - final) / final)

def test_steady_error_type0():
    for Kp in (0.5, 2, 10, 27.5, 100):
        e, _ = step_metrics(Kp)
        print(f"Kp = {Kp:6.1f}: steady error {e:.5f}, 1/(1 + Kp) = {1 / (1 + Kp):.5f}")
        assert abs(e - 1 / (1 + Kp)) < 1e-6

def test_pole_movement():
    s = -a[1] / a[0]
    for Kp in (0, 5, 20, 80):
        p = np.roots(a + np.array([0, 0, Kp * a[2]]))
        assert abs(p.sum().real - s) < 1e-6                     # sum fixed
    Kb = a[1] ** 2 / (4 * a[0] * a[2]) - 1
    print(f"open-loop poles {np.round(np.roots(a), 2)}, they meet at Kp = {Kb:.2f}")
    assert np.all(np.abs(np.roots(a + [0, 0, (Kb + 1e-6) * a[2]]).imag) < 1)
    assert np.all(np.abs(np.roots(a + [0, 0, (Kb + 0.5) * a[2]]).imag) > 10)

def test_overshoot_grows_with_gain():
    os_prev = -1
    for Kp in (15, 27.5, 50, 100, 200):
        _, os = step_metrics(Kp)
        assert os > os_prev; os_prev = os
    wn = a[1] / a[0] / (2 * 0.7071)
    Kp = wn ** 2 * a[0] / a[2] - 1
    _, os = step_metrics(Kp)
    print(f"Kp for zeta 0.707: {Kp:.1f}, overshoot {os * 100:.2f} % (theory 4.32 %)")
    assert abs(Kp - 27.5) < 0.1 and abs(os - 0.0432) < 0.001

test_steady_error_type0()
test_pole_movement()
test_overshoot_grows_with_gain()
print("PASS")
```
:::end

## Exercises

:::exercise
What happens to the closed-loop poles as $K_p \to \infty$ for this second-order plant, and why doesn't it go unstable?
:::solution
The real part stays at $-300$ while the imaginary part grows as $\sqrt{K_p}$. A second-order plant with positive coefficients stays stable at any gain because adding to the constant term never changes the signs. Real motors do go unstable at high gain, because of the delays and filters a second-order model leaves out (lesson 15).
:::end

:::exercise
In physical units, what voltage gain does $K_p = 27.5$ correspond to?
:::solution
The normalised loop gain is $K_{p,V}\,G(0)$, so $K_{p,V} = 27.5/19.81 = 1.39$ V per rad/s of speed error.
:::end

## Quiz

:::quiz
- type: num
  q: Steady error for a type 0 loop with K_p = 9?
  answer: 0.1
  tol: 0.001
  py: "1/10"
  explain: 1/(1 + K_p).
- type: num
  q: DC gain of the motor in (rad/s)/V?
  answer: 19.81
  tol: 0.002
  py: "0.05/(1.2*2e-5+0.05**2)"
  explain: k/(Rb + k²).
- type: num
  q: Gain K_p where the two poles meet?
  answer: 13.27
  tol: 0.005
  py: "(0.002*2e-5+1.2*2e-4)**2/(4*0.002*2e-4*(1.2*2e-5+0.05**2))-1"
  explain: Discriminant zero.
- type: num
  q: Overshoot in % at ζ = 0.707?
  answer: 4.32
  tol: 0.01
  unit: "%"
  py: "100*__import__('math').exp(-__import__('math').pi*0.7071/(1-0.7071**2)**0.5)"
  explain: exp(−πζ/√(1−ζ²)).
- type: mc
  q: Raising proportional gain on this loop…
  options:
    - shrinks the error and reduces damping
    - removes the steady error completely
    - slows the response
    - moves the pole sum
  answer: 0
  explain: Only the constant term changes.
- type: mc
  q: The pole sum stays fixed because…
  options:
    - the gain only changes the constant coefficient
    - the motor is linear
    - the inductance is small
    - the poles are real
  answer: 0
  explain: Sum of roots = −a₁/a₀.
:::end
