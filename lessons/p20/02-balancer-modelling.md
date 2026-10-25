---
id: p20-l02
minutes: 45
summary: The self-balancing robot capstone starts with its model. You derive the wheeled inverted pendulum with Lagrange's equations and SymPy, add a DC motor with back EMF between body and wheels, linearise around upright and check the result against a hand formula and against the nonlinear simulation, and watch the robot fall without control.
---

## Two bodies, one motor

The robot is a body balanced on two wheels. Take the wheel travel $x$ and the body tilt $\theta$ from vertical as generalised coordinates. The body's centre of mass sits a distance $l$ above the axle, so its velocity is $(\dot x + l\cos\theta\,\dot\theta,\; -l\sin\theta\,\dot\theta)$. With wheel inertia folded into an equivalent mass $m + I_w/r^2$:

$$T = \tfrac12\left(m + \tfrac{I_w}{r^2}\right)\dot x^2 + \tfrac12 M\left[(\dot x + l\cos\theta\,\dot\theta)^2 + (l\sin\theta\,\dot\theta)^2\right] + \tfrac12 I_b\dot\theta^2, \qquad V = M g l\cos\theta.$$

The motors sit in the body and drive the wheels, so their torque $\tau$ does work on the relative angle $x/r - \theta$: the generalised forces are $Q_x = \tau/r$ and $Q_\theta = -\tau$. A DC motor gives $\tau = k_t (v - k_e \omega_{rel})/R$ per motor, with $\omega_{rel} = \dot x/r - \dot\theta$, which adds damping through back EMF.

## Linearising

Around upright ($\theta = 0$, at rest) the model becomes $\dot s = A s + B v$ with state $s = (x, \dot x, \theta, \dot\theta)$. Eliminating $\ddot x$ by hand gives the gravity term

$$A_{\ddot\theta,\theta} = \frac{M g l}{I_b + M l^2 - \dfrac{(M l)^2}{M + m + I_w/r^2}},$$

which the code checks against a finite-difference Jacobian of the nonlinear model. One eigenvalue is positive: upright is unstable, and the time to fall scales with its inverse. The site's [live pendulum lab](#lab-pendulum) shows the same instability on a cart-pole.

:::figure widget=wipfall caption="The robot released from a small tilt without control. Change the initial tilt, the body height and the motor's back-EMF damping; compare the nonlinear and linear models."
:::end

## Worked example

Illustrative robot: body 0.9 kg with its centre of mass 7 cm above the axle, wheels 0.12 kg of radius 4 cm, motors $k_t = k_e = 0.25$, $R = 4$ Ω:

1. Eigenvalues of $A$: −59.497, −5.581, 0.000 and +7.108 per second. The positive one is the fall.
2. $A_{\ddot\theta,\theta} = 130.524$ s⁻², matching the hand formula.
3. From 2°, after 0.3 s without control the nonlinear model has tilted to 9.384° and the linear one to 9.324°: a gap of 0.059°.
4. Uncontrolled, the robot goes from 2° to 45° in 0.526 s while its wheels roll 1.1 cm.

## Code it from scratch

:::code file=wip_model.py
```python
import numpy as np
import sympy as sp

# Illustrative two-wheeled robot: body M, wheels (both) m, wheel radius r, body centre of mass l above the axle.
P = dict(M=0.9, m=0.12, r=0.04, l=0.07, Ib=0.004, Iw=0.12 * 0.04**2 / 2, g=9.81, kt=0.25, ke=0.25, R=4.0)

def derive():
    """Lagrange: q = (x, th); the motor torque acts between body and wheels, so its virtual work is tau d(x/r - th)."""
    t = sp.symbols("t"); M, m, r, l, Ib, Iw, g, tau = sp.symbols("M m r l Ib Iw g tau", positive=True)
    x, th = sp.Function("x")(t), sp.Function("th")(t); xd, thd = x.diff(t), th.diff(t)
    T = sp.Rational(1, 2) * (m + Iw / r**2) * xd**2 + sp.Rational(1, 2) * M * ((xd + l * sp.cos(th) * thd)**2 + (l * sp.sin(th) * thd)**2) + sp.Rational(1, 2) * Ib * thd**2
    V = M * g * l * sp.cos(th); Lg = T - V
    eqs = [sp.simplify(Lg.diff(qd).diff(t) - Lg.diff(q)) for q, qd in ((x, xd), (th, thd))]
    Q = [tau / r, -tau]
    xdd, thdd = sp.symbols("xdd thdd"); w, wt = sp.symbols("w wt"); X, TH = sp.symbols("X TH")
    sub = {x.diff(t, 2): xdd, th.diff(t, 2): thdd, xd: w, thd: wt, x: X, th: TH}
    sol = sp.solve([sp.Eq(e.subs(sub), q) for e, q in zip(eqs, Q)], [xdd, thdd], dict=True)[0]
    return sp.lambdify((X, w, TH, wt, tau, M, m, r, l, Ib, Iw, g), [sol[xdd], sol[thdd]], "numpy")

ACC = derive()

def f(s, v, p=P):
    """state s = (x, x', th, th'), input: motor voltage v. Two motors: tau = 2 kt (v - ke w_rel) / R."""
    x, w, th, wt = s; w_rel = w / p["r"] - wt
    tau = 2 * p["kt"] * (v - p["ke"] * w_rel) / p["R"]
    xdd, thdd = ACC(x, w, th, wt, tau, p["M"], p["m"], p["r"], p["l"], p["Ib"], p["Iw"], p["g"])
    return np.array([w, xdd, wt, thdd])

def rk4(s, v, dt):
    k1 = f(s, v); k2 = f(s + dt / 2 * k1, v); k3 = f(s + dt / 2 * k2, v); k4 = f(s + dt * k3, v)
    return s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

def linearise(eps=1e-6):
    A = np.zeros((4, 4)); B = np.zeros(4); s0 = np.zeros(4)
    for i in range(4):
        d = np.zeros(4); d[i] = eps; A[:, i] = (f(s0 + d, 0) - f(s0 - d, 0)) / (2 * eps)
    B = (f(s0, eps) - f(s0, -eps)) / (2 * eps)
    return A, B

def test_linear_matches_nonlinear():
    A, B = linearise(); ev = np.linalg.eigvals(A)
    print("eigenvalues of A: " + ", ".join(f"{e.real:+.3f}" + (f"{e.imag:+.3f}j" if abs(e.imag) > 1e-9 else "") for e in sorted(ev, key=lambda e: e.real)))
    p = P; den = p["Ib"] + p["M"] * p["l"]**2 - (p["M"] * p["l"])**2 / (p["M"] + p["m"] + p["Iw"] / p["r"]**2)
    print(f"A[3,2] = {A[3, 2]:.3f} 1/s^2; hand derivation M g l / (Ib + M l^2 - (M l)^2 / (M + m + Iw/r^2)) = {p['M'] * p['g'] * p['l'] / den:.3f}")
    assert abs(A[3, 2] - p["M"] * p["g"] * p["l"] / den) < 1e-4 and max(ev.real) > 0
    dt = 1e-3; s = np.array([0, 0, np.radians(2), 0]); z = s.copy(); err = 0
    for _ in range(300):
        s = rk4(s, 0.0, dt); z = z + dt * (A @ z); err = max(err, abs(s[2] - z[2]))
    print(f"2 deg start, 0.3 s uncontrolled: nonlinear tilt {np.degrees(s[2]):.3f} deg, linear {np.degrees(z[2]):.3f} deg, max gap {np.degrees(err):.3f} deg")
    assert np.degrees(err) < 0.1 * np.degrees(s[2])

def test_falls_uncontrolled():
    s = np.array([0, 0, np.radians(2), 0]); t = 0
    while abs(s[2]) < np.radians(45): s = rk4(s, 0.0, 1e-3); t += 1e-3
    print(f"uncontrolled: from 2 deg to 45 deg in {t:.3f} s, the wheels rolled {100 * s[0]:.1f} cm")
    assert 0.2 < t < 2

test_linear_matches_nonlinear()
test_falls_uncontrolled()
print("PASS")
```
:::end

## In practice

MuJoCo or Gazebo simulate the full robot from a model file, including contacts and wheel slip, and are where you test controllers before hardware. A hand-derived model like this one is still worth having: it gives the linear model for controller design (Lesson 05), and agreement between the two catches errors in either.

## Exercises

:::exercise
Why does a taller robot (larger $l$) fall more slowly?
:::solution
The unstable eigenvalue is roughly $\sqrt{M g l / (I_b + M l^2)}$ (ignoring wheel coupling). For a point mass this is $\sqrt{g/l}$, which shrinks as $l$ grows: a broom balances more easily than a pencil.
:::end

:::exercise
Shorting the motor terminals ($v = 0$) slows the fall but does not stop it. Why?
:::solution
Back EMF drives a current that opposes relative motion between body and wheels, a damping torque. Damping removes energy but cannot create the restoring torque needed against gravity, so the unstable mode remains.
:::end

## Quiz

:::quiz
- type: num
  q: √(g/l) for l = 0.07 m (1/s)?
  answer: 11.84
  tol: 0.003
  py: "math.sqrt(9.81/0.07)"
  explain: Point-mass pendulum rate.
- type: num
  q: Time constant of an unstable pole at +7.1 per second (s)?
  answer: 0.141
  tol: 0.005
  py: "1/7.1"
  explain: 1/λ.
- type: num
  q: Factor by which a tilt grows in 0.3 s with λ = 7.1 per second?
  answer: 8.42
  tol: 0.005
  py: "math.exp(7.1*0.3)"
  explain: e^(λt).
- type: num
  q: Equivalent wheel mass m + Iw/r² with m 0.12 kg, Iw 9.6e-5 kg·m², r 0.04 m (kg)?
  answer: 0.18
  tol: 0.002
  py: "0.12+9.6e-5/0.04**2"
  explain: Rotation adds mass.
- type: mc
  q: Which generalised forces does the motor torque produce?
  options: ["τ/r on x and −τ on θ", "τ on both", "Only τ on θ", "None, it is internal"]
  answer: 0
  explain: It acts between body and wheels.
- type: mc
  q: What does one positive eigenvalue of A mean?
  options: ["Upright is unstable", "The robot oscillates", "The model is wrong", "The motor is saturated"]
  answer: 0
  explain: Small tilts grow exponentially.
:::end
