---
id: p02-l06
minutes: 35
summary: Mass, spring and damper describe suspensions, motor shafts, sensor mounts and closed control loops. You derive natural frequency and damping ratio from m ẍ + c ẋ + k x = F, classify the three damping cases, and confirm the overshoot formula against a simulation.
---

## The standard form

Newton's law for a mass on a spring and damper is

$$m\ddot x + c\dot x + kx = F .$$

Divide by $m$ and name the two groups that matter:

$$\ddot x + 2\zeta\omega_n\dot x + \omega_n^2 x = \frac{F}{m}, \qquad \omega_n = \sqrt{\frac{k}{m}},\quad \zeta = \frac{c}{2\sqrt{km}} .$$

$\omega_n$ is the **natural frequency** in rad/s, how fast the undamped system would oscillate, and $\zeta$ is the dimensionless **damping ratio**. Many closed control loops reduce to this same form, so these two numbers are the vocabulary of control design.

## Three kinds of response

Try $x = e^{st}$ in the unforced equation: $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$, so

$$s = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2 - 1}.$$

- $\zeta < 1$, **underdamped**: complex roots $s = -\zeta\omega_n \pm i\omega_d$ with $\omega_d = \omega_n\sqrt{1 - \zeta^2}$. The response rings at $\omega_d$ inside an envelope $e^{-\zeta\omega_n t}$.
- $\zeta = 1$, **critically damped**: a repeated root. The fastest response with no overshoot.
- $\zeta > 1$, **overdamped**: two real negative roots. No overshoot, but sluggish.

## Overshoot and peak time

For a unit step and $\zeta < 1$, the response is

$$x(t) = 1 - \frac{e^{-\zeta\omega_n t}}{\sqrt{1-\zeta^2}}\sin\!\big(\omega_d t + \arccos\zeta\big).$$

Its first peak is where $\dot x = 0$, at $t_p = \pi/\omega_d$. Substituting gives the percent overshoot

$$M_p = e^{-\zeta\pi/\sqrt{1-\zeta^2}} .$$

It depends only on $\zeta$: 0.7 gives 4.6 %, 0.5 gives 16 %, 0.2 gives 53 %. That is why specifications like "less than 5 % overshoot" translate directly into "$\zeta \ge 0.6901$", about 0.69.

:::figure widget=response args={"order":2} caption="Unit step response of the standard second-order system. Compare the measured overshoot with the formula as you change ζ."
:::end

## Worked example: a sensor on a flexible bracket

An accelerometer and its bracket act as $m = 0.5$ kg, $k = 200$ N/m, $c = 4$ N·s/m.

1. $\omega_n = \sqrt{200/0.5} = 20$ rad/s (3.18 Hz).
2. $\zeta = 4/(2\sqrt{200 \times 0.5}) = 4/20 = 0.2$.
3. $\omega_d = 20\sqrt{1 - 0.04} = 19.60$ rad/s, peak time $t_p = \pi/19.60 = 0.160$ s.
4. Overshoot $M_p = e^{-0.2\pi/\sqrt{0.96}} = e^{-0.641} = 52.7\,\%$.

A bump makes the bracket ring for about $4/(\zeta\omega_n) = 1$ s. Adding damping to reach $\zeta = 0.7$ needs $c = 2 \times 0.7 \times\sqrt{100} = 14$ N·s/m.

## Code it from scratch

:::code file=second_order.py
```python
import math
import numpy as np

def rk4(f, x, t, h):
    k1 = f(t, x); k2 = f(t + h/2, x + h/2*k1); k3 = f(t + h/2, x + h/2*k2); k4 = f(t + h, x + h*k3)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

def step_response(m, c, k, t_end=3.0, h=1e-4):
    f = lambda t, s: np.array([s[1], (1.0 - c*s[1] - k*s[0]) / m])   # F = 1 N
    n = round(t_end / h); xs = np.empty(n + 1); s = np.zeros(2); xs[0] = 0
    for i in range(n):
        s = rk4(f, s, i*h, h); xs[i + 1] = s[0]
    return np.arange(n + 1) * h, xs

if __name__ == "__main__":
    m, c, k = 0.5, 4.0, 200.0
    wn, zeta = math.sqrt(k/m), c / (2*math.sqrt(k*m))
    assert abs(wn - 20) < 1e-12 and abs(zeta - 0.2) < 1e-12
    t, x = step_response(m, c, k)
    x_ss = 1 / k
    Mp = x.max() / x_ss - 1
    tp = t[np.argmax(x)]
    print(f"overshoot {100*Mp:.2f} % (formula {100*math.exp(-zeta*math.pi/math.sqrt(1-zeta**2)):.2f} %), peak at {tp:.4f} s")
    assert abs(Mp - math.exp(-zeta*math.pi/math.sqrt(1 - zeta**2))) < 1e-4
    assert abs(tp - math.pi/(wn*math.sqrt(1 - zeta**2))) < 2e-4
    for z in (0.1, 0.5, 0.7, 0.9):
        cc = 2*z*math.sqrt(k*m); _, xz = step_response(m, cc, k)
        assert abs(xz.max()/x_ss - 1 - math.exp(-z*math.pi/math.sqrt(1 - z*z))) < 1e-4
    _, xc = step_response(m, 2*math.sqrt(k*m), k)
    assert xc.max() <= x_ss * (1 + 1e-9)                  # critical damping: no overshoot
```
:::end

## Exercises

:::exercise
A motor shaft with load behaves like $J = 2\times10^{-4}$ kg·m², torsional stiffness $k = 50$ N·m/rad and damping $c = 0.01$ N·m·s/rad. Find $\omega_n$ and $\zeta$.
:::solution
1. $\omega_n = \sqrt{50/2\times10^{-4}} = 500$ rad/s (79.6 Hz).
2. $\zeta = 0.01/(2\sqrt{50\times 2\times10^{-4}}) = 0.01/0.2 = 0.05$, lightly damped, which is why servo tuning has to avoid exciting this resonance.
:::end

:::exercise
A specification allows at most 10 % overshoot. What damping ratio is needed?
:::solution
Solve $e^{-\zeta\pi/\sqrt{1-\zeta^2}} = 0.1$: let $a = -\ln 0.1/\pi = 0.733$; then $\zeta = a/\sqrt{1 + a^2} = 0.591$.
:::end

## Quiz

:::quiz
- type: num
  q: What overshoot, in percent, does ζ = 0.2 give?
  answer: 52.662
  tol: 0.002
  unit: "%"
  py: "100*math.exp(-0.2*math.pi/math.sqrt(1-0.04))"
  explain: $e^{-0.2\pi/\sqrt{0.96}} = 0.527$.
- type: num
  q: What damping ratio gives exactly 10 % overshoot?
  answer: 0.59116
  tol: 0.002
  py: "(lambda a: a/math.sqrt(1+a*a))(-math.log(0.1)/math.pi)"
  explain: $a = -\ln(0.1)/\pi = 0.733$ and $\zeta = a/\sqrt{1+a^2} = 0.591$.
- type: num
  q: For m = 0.5 kg, k = 200 N/m, c = 4 N·s/m, what is the peak time in seconds?
  answer: 0.16032
  tol: 0.002
  unit: s
  py: "math.pi/(20*math.sqrt(1-0.2**2))"
  explain: $\omega_d = 19.60$ rad/s and $t_p = \pi/\omega_d = 0.160$ s.
- type: mc
  q: Which damping case gives the fastest response without overshoot?
  options:
    - ζ = 0
    - ζ = 0.5
    - ζ = 1
    - ζ = 2
  answer: 2
  explain: Critical damping is the boundary between ringing and sluggish exponential approach.
- type: num
  q: Motor shaft with $J = 2\times10^{-4}$ kg·m², $k = 50$ N·m/rad, $c = 0.01$ N·m·s/rad. What is ζ?
  answer: 0.05
  tol: 0.001
  py: "0.01/(2*math.sqrt(50*2e-4))"
  explain: $\zeta = c/(2\sqrt{kJ}) = 0.01/0.2 = 0.05$.
:::end

:::verify
import math
for z, mp in ((0.7,.046),(0.5,.16),(0.2,.53)): assert abs(math.exp(-z*math.pi/math.sqrt(1-z*z))-mp) < 0.005
assert abs(20/(2*math.pi)-3.18)<0.005 and abs(20*math.sqrt(.96)-19.60)<0.005 and abs(math.pi/19.596-0.160)<5e-4
assert abs(0.2*math.pi/math.sqrt(.96)-0.641)<5e-4 and abs(4/(0.2*20)-1)<1e-12 and abs(2*.7*10-14)<1e-12
assert abs(math.sqrt(50/2e-4)-500)<1e-9 and abs(500/(2*math.pi)-79.6)<0.05
a5 = -math.log(0.05)/math.pi; assert abs(a5/math.sqrt(1+a5*a5)-0.6901)<5e-5
a = -math.log(0.1)/math.pi; assert abs(a-0.733)<5e-4
:::end
