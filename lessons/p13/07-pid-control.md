---
id: p13-l07
minutes: 45
summary: The PID controller adds a derivative term to PI, so the effort responds to the error now, to its accumulated past and to its rate of change, and on an unstable plant such as an inverted pendulum the derivative's damping is what makes balance possible at all. You derive what each term does to the linearised cart-pole's poles, implement the same PID the live pendulum lab runs, and test that it balances the nonlinear cart-pole for 30 seconds while switching off P or D makes it fall.
---

## Three terms

$$u(t) = K_pe(t) + K_i\int_0^t e\,d\tau + K_d\frac{de}{dt}, \qquad C(s) = K_p + \frac{K_i}{s} + K_ds.$$

- **P** acts on the present error: stiffness.
- **I** acts on the past: removes steady offsets (lesson 06).
- **D** acts on the predicted future: damping, because it opposes motion.

## What each term does to the cart-pole

Linearise the [live pendulum lab](#lab-pendulum)'s cart-pole (lesson p12-l11, $M = 0.8$, $m = 0.25$, $\ell = 0.45$) at upright. With $F$ the cart force and $\theta$ positive towards $+x$:

$$\ddot\theta = p^2\theta - \beta F, \qquad p^2 = \frac{g}{\ell\left(\frac43 - \frac{m}{M + m}\right)} = 19.9\ \text{s}^{-2}, \qquad \beta = \frac{1}{(M + m)\,\ell\left(\frac43 - \frac{m}{M + m}\right)} = 1.93.$$

With $F = K_p\theta + K_d\dot\theta$ (push the cart under the lean):

$$s^2 + \beta K_d\,s + (\beta K_p - p^2) = 0.$$

- **P alone** ($K_d = 0$): roots $\pm\sqrt{p^2 - \beta K_p}$ for small $K_p$, or $\pm j\sqrt{\beta K_p - p^2}$ for large $K_p$. Never better than an undamped oscillation, and real parasitic lags tip it unstable.
- **P + D**: needs $K_p > p^2/\beta = 10.3$ N/rad for stiffness and $K_d > 0$ for damping.
- **I** adds a pole at the origin and corrects a constant offset such as a sensor bias or a tilted rail.

The lab's tuning is $K_p = 38$, $K_i = 6$, $K_d = 7$ (illustrative). Then $\beta K_p - p^2 = 53.5$, so $\omega_n = 7.3$ rad/s, and $\beta K_d = 13.5$, so $\zeta = 0.92$.

## The cart drifts

Angle control alone says nothing about where the cart is. The lab adds an outer PD on cart position, $F \mathrel{+}= k_x x + k_v\dot x$ with **positive** gains: to bring the cart back towards $x = 0$ you first have to lean the pole that way, which means briefly moving the cart the other way. That non-minimum-phase behaviour is why the signs look wrong. With both the angle integral and the position term, the linearised loop also has one eigenvalue at exactly zero: the cart can come to rest at any position where the integral's force cancels $k_xx$, so the position settles but not necessarily at zero.

:::figure widget=pidcartpole caption="The cart-pole under the lab's PID with a kick at 3 s. Switch P, I or D off: without D or without P it falls within a couple of seconds; without I it still balances here because nothing biases it."
:::end

## Worked example

Minimum gains for the linear model:

1. $K_p > p^2/\beta = 19.9/1.93 = 10.3$ N/rad.
2. With $K_p = 38$, choosing $\zeta = 0.7$ needs $\beta K_d = 2 \times 0.7 \times 7.32 = 10.2$, so $K_d = 5.3$ N·s/rad. The lab's 7 is a little more damped, which helps against the 20 ms actuator lag the linear model ignores.

## Code it from scratch

:::code file=pid_cartpole.py
```python
import numpy as np

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA = 30.0, 0.02
GAINS = dict(Kp=38.0, Ki=6.0, Kd=7.0, kx=1.6, kv=2.6)

def deriv(s, F):
    """the live lab's cart-pole (uniform rod, small joint and cart friction)"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    xdd = temp - m * l * thdd * cs / tot - 0.3 * xd
    return np.array([xd, xdd, thd, thdd])

def run(P=True, I=True, D=True, T=30.0, th0=0.06, kick_at=None, **over):
    G = {**GAINS, **over}
    h, every = 1e-3, 5; dt = h * every                       # physics 1 kHz, control 200 Hz
    s = np.array([0.0, 0.0, th0, 0.0]); F = Fc = integ = dstate = 0.0; prev = th0
    a = np.exp(-dt / 0.012)                                  # derivative low-pass, 12 ms
    ths, xs = [], []
    for k in range(int(T / h)):
        if kick_at is not None and k == int(kick_at / h): s[3] += 0.9
        if k % every == 0:
            th = s[2]
            dstate = a * dstate + (1 - a) * (th - prev) / dt; prev = th      # derivative on measurement
            integ = np.clip(integ + th * dt, -0.5, 0.5) if I else 0.0
            u = (G["Kp"] * th if P else 0) + (G["Ki"] * integ if I else 0) + (G["Kd"] * dstate if D else 0) \
                + G["kx"] * s[0] + G["kv"] * s[1]
            Fc = np.clip(u, -Fmax, Fmax)
        F += h / tauA * (Fc - F)                              # actuator lag
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ths.append(s[2]); xs.append(s[0])
        if abs(s[2]) > 1.0: break                            # fallen
    return np.array(ths), np.array(xs)

def test_balances_30_s():
    th, x = run(kick_at=10.0)
    print(f"tuned PID: {len(th) / 1000:.1f} s upright, max tilt {np.max(np.abs(th)):.3f} rad, cart within {np.max(np.abs(x)):.2f} m, final tilt {th[-1]:.1e}")
    assert len(th) == 30000 and np.max(np.abs(th)) < 0.25 and np.max(np.abs(x)) < 2.0 and abs(th[-1]) < 1e-3

def test_without_d_or_p_it_falls():
    for name, kw in (("no D", dict(D=False)), ("no P", dict(P=False))):
        th, _ = run(**kw)
        print(f"{name}: falls after {len(th) / 1000:.2f} s")
        assert len(th) < 5000

def test_linear_poles():
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    assert abs(p2 - 19.904) < 1e-3 and abs(beta - 1.9324) < 1e-3
    G = GAINS
    # linearised closed loop, ideal derivative, actuator lag: states x, xd, th, thd, F, integral
    def f(z):
        x, xd, th, thd, F, I = z
        Fc = G["Kp"] * th + G["Ki"] * I + G["Kd"] * thd + G["kx"] * x + G["kv"] * xd
        return np.concatenate([deriv([x, xd, th, thd], F), [(Fc - F) / tauA, th]])
    A = np.column_stack([(f(e * 1e-7) - f(-e * 1e-7)) / 2e-7 for e in np.eye(6)])
    ev = np.linalg.eigvals(A)
    print("linearised closed-loop eigenvalues:", np.round(np.sort_complex(ev), 2))
    ev = ev[np.argsort(-ev.real)]
    assert abs(ev[0]) < 1e-9                                  # one zero mode: a family of resting cart positions
    assert np.all(ev[1:].real < -0.5)                         # every other mode decays
    assert np.max(np.linalg.eigvals(A - G["Kd"] * np.outer(np.eye(6)[4], np.eye(6)[3]) / tauA).real) > 0   # remove D: unstable

test_balances_30_s()
test_without_d_or_p_it_falls()
test_linear_poles()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does the lab differentiate the measured angle rather than the error $\theta_{ref} - \theta$?
:::solution
With a fixed reference they're the same, but when the reference steps, the derivative of the error is a huge spike ("derivative kick") that slams the actuator. Differentiating the measurement gives the same damping without the kick.
:::end

:::exercise
Using the linear model, what is the largest $K_p$ for which P + D with $K_d = 7$ stays overdamped?
:::solution
Overdamped needs $(\beta K_d)^2 \ge 4(\beta K_p - p^2)$: $13.5^2/4 = 45.7 \ge 1.93K_p - 19.9$, so $K_p \le 34.0$ N/rad. The lab's 38 is just past that, slightly underdamped ($\zeta = 0.92$).
:::end

## Quiz

:::quiz
- type: num
  q: Minimum proportional gain in N/rad for the linear cart-pole to have stiffness (p² = 19.9, β = 1.93)?
  answer: 10.31
  tol: 0.005
  unit: N/rad
  py: "19.904/1.9324"
  explain: K_p > p²/β.
- type: num
  q: Natural frequency in rad/s with K_p = 38?
  answer: 7.32
  tol: 0.005
  unit: rad/s
  py: "(1.9324*38-19.904)**0.5"
  explain: √(βK_p − p²).
- type: num
  q: Damping ratio with K_d = 7?
  answer: 0.924
  tol: 0.005
  py: "1.9324*7/(2*(1.9324*38-19.904)**0.5)"
  explain: βK_d/(2ω_n).
- type: num
  q: K_d for ζ = 0.7 at K_p = 38?
  answer: 5.30
  tol: 0.01
  unit: N·s/rad
  py: "2*0.7*(1.9324*38-19.904)**0.5/1.9324"
  explain: 2ζω_n/β.
- type: mc
  q: Which term provides damping on the inverted pendulum?
  options:
    - derivative
    - integral
    - proportional
    - none of them
  answer: 0
  explain: It opposes angular velocity.
- type: mc
  q: Why are the lab's cart-position gains positive?
  options:
    - you must lean the pole towards where the cart should go, by first moving the cart away
    - it's a sign error
    - the rail is tilted
    - to make the cart drift
  answer: 0
  explain: Non-minimum-phase behaviour.
:::end
