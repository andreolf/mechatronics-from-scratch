---
id: p02-l12
minutes: 35
summary: Every simulator, controller and estimator in this course works on systems written as ẋ = f(x, u, t). You reduce higher-order equations to first-order state form, model a DC motor with two coupled states, and build the simulate() harness the rest of the course reuses.
---

## Why state form

Integrators like RK4 advance $\dot{\mathbf x} = \mathbf f(t, \mathbf x)$. Real models arrive as higher-order equations, often several coupled ones. The fix is mechanical: introduce one state for each derivative below the highest.

For $y^{(n)} = g(t, y, \dot y, \dots, y^{(n-1)}, u)$, define $x_1 = y$, $x_2 = \dot y$, …, $x_n = y^{(n-1)}$. Then

$$\dot x_1 = x_2,\quad \dot x_2 = x_3,\quad\dots,\quad \dot x_n = g(t, x_1, \dots, x_n, u).$$

The **state** is the smallest set of numbers that, with the future inputs, determines the future. For a mechanical system that is positions and velocities; for a circuit, capacitor voltages and inductor currents. Choosing physical states pays off later, when you design observers and Kalman filters that estimate them.

## A DC motor: two coupled states

The armature circuit (voltage $V$, resistance $R$, inductance $L$, back-EMF constant $k_e$) and the rotor (inertia $J$, viscous friction $b$, torque constant $k_t$, load torque $\tau_L$) give

$$L\frac{di}{dt} = V - Ri - k_e\omega, \qquad J\frac{d\omega}{dt} = k_t i - b\omega - \tau_L .$$

With state $\mathbf x = (i, \omega)$ and inputs $\mathbf u = (V, \tau_L)$ this is linear, $\dot{\mathbf x} = A\mathbf x + B\mathbf u$:

$$A = \begin{pmatrix} -R/L & -k_e/L \\ k_t/J & -b/J\end{pmatrix}, \qquad B = \begin{pmatrix} 1/L & 0 \\ 0 & -1/J\end{pmatrix}.$$

## Worked example: steady state of a small motor

$R = 1\ \Omega$, $L = 0.5$ mH, $k_t = k_e = 0.05$ N·m/A, $J = 10^{-5}$ kg·m², $b = 10^{-6}$ N·m·s/rad, $V = 12$ V, no load.

At steady state $\dot{\mathbf x} = 0$. From the rotor equation $i = b\omega/k_t$; substituting into the circuit equation,

$$\omega_{ss} = \frac{k_t V}{Rb + k_tk_e} = \frac{0.05 \times 12}{10^{-6} + 0.0025} = 239.9\ \text{rad/s}\ (2291\ \text{rpm}),$$

and $i_{ss} = b\omega_{ss}/k_t = 4.8$ mA. The eigenvalues of $A$ are about $-1707$ and $-293$ s⁻¹: the speed settles within roughly $4/293 = 14$ ms.

## Code it from scratch

:::code file=simulate.py
```python
import math
import numpy as np

def rk4_step(f, t, x, u, h):
    k1 = f(t, x, u); k2 = f(t + h/2, x + h/2*k1, u); k3 = f(t + h/2, x + h/2*k2, u); k4 = f(t + h, x + h*k3, u)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

def simulate(f, x0, u_fn, t, step=rk4_step):
    """Integrate x' = f(t, x, u) on the time grid t, with input u = u_fn(t, x) held over each step."""
    X = np.empty((len(t), len(x0))); X[0] = x0
    for k in range(len(t) - 1):
        u = u_fn(t[k], X[k])
        X[k + 1] = step(f, t[k], X[k], u, t[k + 1] - t[k])
    return X

R, L, kt, ke, J, b = 1.0, 0.5e-3, 0.05, 0.05, 1e-5, 1e-6
def dc_motor(t, x, u):
    i, w = x; V, tauL = u
    return np.array([(V - R*i - ke*w) / L, (kt*i - b*w - tauL) / J])

if __name__ == "__main__":
    t = np.linspace(0, 0.05, 5001)
    X = simulate(dc_motor, np.zeros(2), lambda t, x: (12.0, 0.0), t)
    w_ss = kt*12 / (R*b + kt*ke)
    assert abs(X[-1, 1] - w_ss) < 1e-3 * w_ss and abs(X[-1, 0] - b*w_ss/kt) < 1e-4
    A = np.array([[-R/L, -ke/L], [kt/J, -b/J]])
    print("eigenvalues", np.sort(np.linalg.eigvals(A).real), f"ω_ss = {w_ss:.1f} rad/s")
    # reproduce lesson 5 (RC step) and lesson 6 (mass-spring-damper)
    t5 = np.linspace(0, 5, 501)
    rc = simulate(lambda t, x, u: (u - x) / 1.0, np.zeros(1), lambda t, x: 5.0, t5)
    assert abs(rc[:, 0] - 5*(1 - np.exp(-t5))).max() < 1e-6
    t6 = np.linspace(0, 3, 30001)
    m, c, k = 0.5, 4.0, 200.0
    msd = simulate(lambda t, x, u: np.array([x[1], (u - c*x[1] - k*x[0]) / m]), np.zeros(2), lambda t, x: 1.0, t6)
    zeta = c / (2*math.sqrt(k*m))
    assert abs(msd[:, 0].max()*k - 1 - math.exp(-zeta*math.pi/math.sqrt(1 - zeta**2))) < 1e-4
```
:::end

The harness takes `u_fn(t, x)` rather than a fixed input so that the same function can later close a feedback loop: a controller is just a `u_fn` that reads the state.

## Exercises

:::exercise
Write $\dddot y + 3\ddot y + 2\dot y = u$ in state form.
:::solution
With $x_1 = y$, $x_2 = \dot y$, $x_3 = \ddot y$: $\dot x_1 = x_2$, $\dot x_2 = x_3$, $\dot x_3 = u - 2x_2 - 3x_3$. So $A = \begin{pmatrix} 0&1&0\\0&0&1\\0&-2&-3\end{pmatrix}$ and $B = (0, 0, 1)^\top$.
:::end

:::exercise
Add a constant load torque $\tau_L = 0.01$ N·m to the motor example. What is the new steady-state speed?
:::solution
1. Rotor: $k_t i = b\omega + \tau_L$, so $i = (b\omega + \tau_L)/k_t$.
2. Circuit: $V = R(b\omega + \tau_L)/k_t + k_e\omega$, so $\omega = (k_tV - R\tau_L)/(Rb + k_tk_e) = (0.6 - 0.01)/0.002501 = 235.9$ rad/s.
3. The current rises to $i = (2.36\times10^{-4} + 0.01)/0.05 = 0.205$ A.
:::end

## Quiz

:::quiz
- type: num
  q: Steady-state speed of the example motor at 12 V with no load, in rad/s?
  answer: 239.904
  tol: 0.001
  unit: rad/s
  py: "0.05*12/(1*1e-6 + 0.05*0.05)"
  explain: $0.6/0.002501 = 239.9$ rad/s.
- type: num
  q: With a load of 0.01 N·m, what is the steady-state speed in rad/s?
  answer: 235.906
  tol: 0.001
  unit: rad/s
  py: "(0.05*12 - 1*0.01)/(1*1e-6 + 0.05*0.05)"
  explain: $(0.6 - 0.01)/0.002501 = 235.9$ rad/s.
- type: mc
  q: How many states does a third-order ODE need in first-order form?
  options:
    - "1"
    - "2"
    - "3"
    - "4"
  answer: 2
  explain: One state per derivative from order 0 to order 2.
- type: mc
  q: Which of these is a natural state set for an RLC circuit?
  options:
    - Resistor voltage and capacitor voltage
    - Inductor current and capacitor voltage
    - Source voltage and current
    - Power and energy
  answer: 1
  explain: States are the energy-storage variables, $i_L$ and $v_C$.
- type: num
  q: For the motor's slow eigenvalue of about −293 s⁻¹, roughly how many milliseconds does it take to settle (4 time constants)?
  answer: 13.65
  tol: 0.02
  unit: ms
  py: "4/(-np.sort(np.linalg.eigvals([[-2000,-100],[5000,-0.1]]).real)[1])*1000"
  explain: The time constant is $1/293 = 3.4$ ms, and $4 \times 3.4 = 13.7$ ms.
:::end

:::verify
import numpy as np
A = np.array([[-2000,-100],[5000,-0.1]]); ev = np.sort(np.linalg.eigvals(A).real)
assert abs(ev[0]+1707)<1 and abs(ev[1]+293)<1, ev
assert abs(4/293*1000-13.65)<0.02
w = 0.6/0.002501; assert abs(w-239.9)<0.05 and abs(w*60/(2*np.pi)-2291)<0.5 and abs(1e-6*w/0.05-4.8e-3)<5e-5
w2 = 0.59/0.002501; assert abs(w2-235.9)<0.05 and abs((1e-6*w2+0.01)/0.05-0.205)<5e-4
:::end
