---
id: p14-l07
minutes: 45
summary: LQR turns the cart-pole balancing problem into choosing weights, and one design handles the pole angle and the cart position together. You linearise the pendulum lab's model at upright, pick weights with Bryson-style reasoning, simulate the LQR on the full nonlinear model with the lab's force limit and actuator lag, test that it recovers from 15 degrees, and compare its recovery with the PID from Phase 13.
---

## Linear model and weights

Linearise the [pendulum lab](#lab-pendulum)'s cart-pole at $\theta = 0$, including its small friction terms: $\dot x = Ax + BF$ with states $(x, \dot x, \theta, \dot\theta)$. The linearisation in code uses central differences on the same nonlinear model the simulation runs, so model and plant agree exactly at upright.

Weights, Bryson style:

- angle: we'd accept about 0.14 rad (8°) in a recovery, so $Q_{\theta} = 1/0.14^2 \approx 50$;
- cart position: about 0.45 m of travel, $Q_x = 5$;
- rates: lightly weighted, $Q = 1$, mainly to add damping;
- force: $R = 0.05$, so about 4.5 N costs as much as a 1 m position error.

$$Q = \mathrm{diag}(5, 1, 50, 1), \qquad R = 0.05.$$

The resulting gain has four entries, and their signs tell the story: positive tilt calls for a push in the direction of the tilt ($K_\theta < 0$ with $F = -Kx$) and, less intuitively, cart position error also gets a push *away* from the target first ($K_x < 0$): to move the cart right you must first tilt the pole right, which takes a step left.

## What the simulation adds

The design model ignores three things the lab has: the 30 N force limit, a 20 ms actuator lag, and a 200 Hz controller update. The test runs the full nonlinear model with all three. LQR's guaranteed margins (at least 60° of phase margin, and the loop gain can halve or grow without limit, for the ideal continuous design) are why it shrugs these off.

:::figure widget=lqrcartpole caption="The cart-pole recovering from a starting tilt under LQR and under the Phase 13 PID. Raise the angle and change the weight on the angle: LQR brings the cart back to the centre as part of the same design, while the PID's cart loop is slower."
:::end

## Worked example

With the weights above:

1. $K = (-10.0, -10.7, -72.9, -16.3)$.
2. From 15°: the angle settles within 0.5° in 2.3 s, the cart travels 0.33 m and returns within 1 cm by 2.9 s, peak force 19 N, inside the 30 N limit.
3. The Phase 13 PID settles the angle in a similar time (1.9 s) but takes 7.9 s to bring the cart back: its cart terms are a slow outer correction, not part of one optimal design.
4. With the force limit, this LQR recovers from up to about 55° in simulation.

## Code it from scratch

:::code file=lqr_cartpole.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA = 30.0, 0.02

def deriv(s, F):
    """the live lab's cart-pole (uniform rod, small joint and cart friction)"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    f = lambda s, F: deriv(s, F)
    A = np.column_stack([(f(e * 1e-6, 0) - f(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((f(np.zeros(4), 1e-6) - f(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

def lqr_gain(Q, R):
    A, B = linearise(); P = solve_continuous_are(A, B, Q, R)
    return np.linalg.solve(R, B.T @ P)[0]

Q0, R0 = np.diag([5.0, 1.0, 50.0, 1.0]), np.array([[0.05]])

def run(policy, th0_deg, T=10.0):
    h, every = 1e-3, 5; dt = h * every                        # physics 1 kHz, control 200 Hz like the lab
    s = np.array([0.0, 0.0, np.radians(th0_deg), 0.0]); F = Fc = 0.0; mem = {}
    ths, xs, Fs = [], [], []
    for k in range(int(T / h)):
        if k % every == 0: Fc = float(np.clip(policy(s, dt, mem), -Fmax, Fmax))
        F += h / tauA * (Fc - F)                               # actuator lag, not in the LQR model
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ths.append(s[2]); xs.append(s[0]); Fs.append(Fc)
        if abs(s[2]) > 1.0: break
    return np.array(ths), np.array(xs), np.array(Fs)

def lqr_policy(K):
    return lambda s, dt, mem: -K @ s

def pid_policy(s, dt, mem, Kp=38.0, Ki=6.0, Kd=7.0, kx=1.6, kv=2.6):
    """lesson p13-l07's PID on the angle with cart-position terms"""
    th = s[2]; a = np.exp(-dt / 0.012)
    mem["d"] = a * mem.get("d", 0.0) + (1 - a) * (th - mem.get("prev", th)) / dt; mem["prev"] = th
    mem["i"] = np.clip(mem.get("i", 0.0) + th * dt, -0.5, 0.5)
    return Kp * th + Ki * mem["i"] + Kd * mem["d"] + kx * s[0] + kv * s[1]

def settle_time(th, tol=np.radians(0.5)):
    out = np.where(np.abs(th) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_lqr_stabilises_from_15_deg():
    K = lqr_gain(Q0, R0)
    th, x, F = run(lqr_policy(K), 15.0)
    print(f"LQR K = {np.round(K, 2)}")
    print(f"LQR from 15 deg: upright {len(th) / 1000:.1f} s, settles within 0.5 deg at {settle_time(th):.2f} s, cart travel {np.abs(x).max():.2f} m, peak force {np.abs(F).max():.1f} N")
    assert len(th) == 10000 and np.abs(th[-1]) < 1e-3 and abs(x[-1]) < 0.01

def cart_settle(x, tol=0.01):
    out = np.where(np.abs(x) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_compare_with_pid():
    K = lqr_gain(Q0, R0)
    for deg in (5.0, 15.0):
        tl, xl, _ = run(lqr_policy(K), deg, T=20.0); tp, xp, _ = run(pid_policy, deg, T=20.0)
        print(f"from {deg:4.1f} deg | LQR: angle settles {settle_time(tl):.2f} s, cart back within 1 cm at {cart_settle(xl):.2f} s"
              f" | PID: angle {settle_time(tp):.2f} s, cart {cart_settle(xp):.2f} s")
        assert len(tl) == len(tp) == 20000
        assert cart_settle(xl) < cart_settle(xp)          # one design handles angle and cart together

def test_largest_recoverable_angle():
    K = lqr_gain(Q0, R0); lo, hi = 15.0, 60.0
    for _ in range(12):
        mid = (lo + hi) / 2; th, _, _ = run(lqr_policy(K), mid, T=6.0)
        lo, hi = (mid, hi) if len(th) == 6000 and abs(th[-1]) < 0.02 else (lo, mid)
    print(f"with the 30 N force limit, this LQR recovers from up to about {lo:.0f} deg")
    assert lo > 15

test_lqr_stabilises_from_15_deg()
test_compare_with_pid()
test_largest_recoverable_angle()
print("PASS")
```
:::end

## Exercises

:::exercise
Raise $Q_\theta$ from 50 to 500. What changes in the gains and the response?
:::solution
The angle gains grow and the pole is held more tightly upright: smaller peak tilt in a recovery, but more force and faster cart motion, and more sensitivity to sensor noise and to the actuator lag the model ignores. Eventually the force limit is hit on large starts, and the recoverable angle can shrink.
:::end

:::exercise
Why must the cart move away from its target first?
:::solution
The force-to-position path is non-minimum phase once the pole must stay up. To accelerate the cart right in steady fashion, the pole must lean right, and the only way to lean it right is to move the cart's base left first. The LQR gain $K_x < 0$ encodes that.
:::end

## Quiz

:::quiz
- type: num
  q: Bryson weight for an acceptable angle of 0.14 rad?
  answer: 51.02
  tol: 0.01
  py: "1/0.14**2"
  explain: Q = 1/x_max².
- type: num
  q: Force in N that costs as much as a 1 m position error with Q_x = 5 and R = 0.05?
  answer: 10
  tol: 0.001
  unit: N
  py: "math.sqrt(5/0.05)"
  explain: R F² = Q_x x², so F = √(Q_x/R).
- type: num
  q: Control period in ms at 200 Hz?
  answer: 5
  tol: 0.001
  unit: ms
  py: "1000/200"
  explain: The lab's controller rate.
- type: num
  q: Guaranteed phase margin in degrees of a continuous single-input LQR?
  answer: 60
  tol: 0.001
  unit: deg
  py: "60"
  explain: From the return-difference inequality |1 + L(jω)| ≥ 1.
- type: mc
  q: Compared with the Phase 13 PID, the LQR's main advantage here is…
  options:
    - it brings the cart back much sooner as part of one design
    - it never needs a model
    - it settles the angle ten times faster
    - it uses no force
  answer: 0
  explain: Angle and cart are weighed together.
- type: mc
  q: What did the design model leave out that the test includes?
  options:
    - force limit, actuator lag and sampling
    - gravity
    - the cart mass
    - the pole length
  answer: 0
  explain: The nonlinear simulation adds all three.
:::end
