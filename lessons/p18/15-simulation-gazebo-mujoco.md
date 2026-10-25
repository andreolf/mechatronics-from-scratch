---
id: p18-l15
minutes: 40
summary: A simulator is a numerical integrator plus a contact model, and both have limits you must respect. You compare explicit and semi-implicit Euler, build a spring-damper floor and find the time step where it creates energy, simulate a 2-link arm under PD control with gravity compensation, check it against kinematics, and measure the real-time factor.
---

## What a physics engine does every step

Gazebo, MuJoCo, Isaac Sim, PyBullet and Drake all repeat, every time step $\Delta t$:

1. compute forces: gravity, joint torques from your controllers (through ros2_control, lesson 14), springs and damping,
2. detect contacts between collision shapes (lesson 12) and compute contact forces,
3. solve the equations of motion $M(q)\ddot q + C(q, \dot q) + G(q) = \tau + J^T f_{contact}$ (Phase 06),
4. integrate velocities and positions to the next step.

## Integrators

**Explicit Euler** updates position and velocity from the old state. On an oscillator it adds energy every step, so a pendulum swings higher and higher. **Semi-implicit (symplectic) Euler** updates the velocity first and uses the new velocity for the position. It costs the same but keeps the energy error bounded, which is why game and robot engines use it or implicit variants. MuJoCo defaults to semi-implicit Euler, with RK4 and implicit options.

## Contact

The simplest contact model is a **penalty** spring-damper: when shapes overlap by $d$, push them apart with $f = k d - c\, \dot d$. A stiff spring means less penetration but a high natural frequency $\omega = \sqrt{k/m}$, and an explicit step is only stable for roughly $\omega \Delta t < 2$. Above that, the simulation creates energy: objects jitter, bounce higher than they fell or explode. Engines use soft constraints (MuJoCo) or complementarity solvers (ODE, Bullet) to handle contact more robustly, but a time step that is too large still breaks them.

## Real-time factor

The **real-time factor** (RTF) is simulated time divided by wall-clock time. RTF 1 means the simulation keeps pace with reality, which is what you need to run real ROS 2 nodes against it (with `use_sim_time` and the `/clock` topic). Above 1 you can train or test faster than real time.

:::figure widget=simarm caption="A simulated 2-link arm under PD control with gravity compensation. Change the gains, the time step and the integrator; the readout compares the simulated tool position with the kinematic target and shows the energy behaviour."
:::end

## Worked example

1. A pendulum released from 1 rad, 20 s at $\Delta t = 10$ ms: explicit Euler gains 266 % in energy, semi-implicit Euler stays within 1.47 %.
2. A 1 kg ball dropped from 0.5 m onto a penalty floor with $c = 50$ N s/m: penetration 45.67 mm at $k = 10^3$ N/m (and no rebound, it is overdamped), 22.92 mm at $10^4$, 8.88 mm at $10^5$.
3. At $k = 10^7$ N/m and $\Delta t = 1$ ms, $\omega \Delta t = 3.162$, and the ball rebounds at 4.04 m/s after hitting at 3.13 m/s: the step created energy. At $\Delta t = 10$ µs it rebounds at 3.06 m/s.
4. The 2-link arm (illustrative masses 1.0 and 0.6 kg, links 0.4 and 0.3 m), commanded to $q = (0.8, -0.6)$ with $\Delta t = 1$ ms, settles with the tool at $(0.5727, 0.34654)$ m, the same as forward kinematics to within 1 mm.
5. The arm simulation ran at a real-time factor of about 87 on our build machine; your number will differ.

## Code it from scratch

:::code file=sim_step.py
```python
import time
import numpy as np

def pendulum(method, dt=0.01, T=20.0, g=9.81, L=1.0, th0=1.0):
    """integrate th'' = -(g/L) sin th; return the relative energy error at the end"""
    th, w = th0, 0.0; E = lambda th, w: 0.5 * L**2 * w**2 + g * L * (1 - np.cos(th))
    E0 = E(th, w)
    for _ in range(int(T / dt)):
        a = -g / L * np.sin(th)
        if method == "explicit": th, w = th + dt * w, w + dt * a          # both from the old state
        else: w = w + dt * a; th = th + dt * w                             # semi-implicit: velocity first, then position
    return (E(th, w) - E0) / E0

def drop(k=1e5, c=50.0, m=1.0, dt=1e-4, T=1.0, h0=0.5):
    """a ball dropped on a floor modelled as a spring-damper (penalty contact), active only while penetrating"""
    z, v, pen, bounce_v = h0, 0.0, 0.0, None
    for _ in range(int(T / dt)):
        f = -m * 9.81
        if z < 0:
            f += -k * z - c * v; pen = max(pen, -z)                         # contact force pushes out of the floor
        v += dt * f / m; z += dt * v
        if bounce_v is None and z > 0 and v > 0 and pen > 0: bounce_v = v
        if not np.isfinite(z) or abs(z) > 1e3: return None, None
    return pen, bounce_v

def arm_sim(q_goal, dt=1e-3, T=3.0, m=(1.0, 0.6), l=(0.4, 0.3), kp=60.0, kd=8.0, g=9.81):
    """a 2-link arm in a vertical plane (point masses at the link ends), PD control plus gravity compensation"""
    m1, m2 = m; l1, l2 = l; q = np.zeros(2); qd = np.zeros(2)
    def G(q): c1, c12 = np.cos(q[0]), np.cos(q[0] + q[1]); return np.array([(m1 + m2) * g * l1 * c1 + m2 * g * l2 * c12, m2 * g * l2 * c12])
    wall = time.perf_counter()
    for _ in range(int(T / dt)):
        c2, s2 = np.cos(q[1]), np.sin(q[1])
        M = np.array([[m1 * l1**2 + m2 * (l1**2 + l2**2 + 2 * l1 * l2 * c2), m2 * (l2**2 + l1 * l2 * c2)],
                      [m2 * (l2**2 + l1 * l2 * c2), m2 * l2**2]])
        Cv = np.array([-m2 * l1 * l2 * s2 * (2 * qd[0] * qd[1] + qd[1]**2), m2 * l1 * l2 * s2 * qd[0]**2])
        tau = kp * (q_goal - q) - kd * qd + G(q)                             # the controller under test
        qdd = np.linalg.solve(M, tau - Cv - G(q))                            # the physics engine's job
        qd = qd + dt * qdd; q = q + dt * qd
    wall = time.perf_counter() - wall
    return q, T / wall

def fk(q, l=(0.4, 0.3)):
    return np.array([l[0] * np.cos(q[0]) + l[1] * np.cos(q[0] + q[1]), l[0] * np.sin(q[0]) + l[1] * np.sin(q[0] + q[1])])

def test_integrators():
    ex, si = pendulum("explicit"), pendulum("semi")
    print(f"pendulum 20 s at dt = 10 ms: energy error explicit Euler {100 * ex:+.1f} %, semi-implicit {100 * si:+.2f} %")
    assert ex > 0.5 and abs(si) < 0.02

def test_contact():
    rows = []
    for k in (1e3, 1e4, 1e5):
        pen, bv = drop(k=k); rows.append(pen); print(f"floor stiffness {k:8.0f} N/m: max penetration {1000 * pen:6.2f} mm, " + (f"rebound speed {bv:.2f} m/s" if bv else "no rebound (damping ratio too high)"))
    assert rows[0] > rows[1] > rows[2]
    v_in = np.sqrt(2 * 9.81 * 0.5)                                         # impact speed from 0.5 m
    for dt in (1e-3, 1e-5):
        _, bv = drop(k=1e7, dt=dt)
        print(f"k = 1e7 N/m at dt = {dt:g} s: omega dt = {np.sqrt(1e7) * dt:.3f}, impact {v_in:.2f} m/s, rebound {bv:.2f} m/s"
              + (" (faster than it hit: the step created energy)" if bv > v_in else ""))
        assert (bv > v_in) == (dt == 1e-3)                                    # the stiff contact needs a smaller step

def test_arm_matches_kinematics():
    goal = np.array([0.8, -0.6]); q, rtf = arm_sim(goal)
    ee, ref = fk(q), fk(goal)
    print(f"arm settles at q = {np.round(q, 5)}, tool {np.round(ee, 5)} vs kinematics {np.round(ref, 5)}, "
          f"error {1000 * np.linalg.norm(ee - ref):.3f} mm")
    print(f"real-time factor on this machine: {rtf:.0f} (simulated seconds per wall second; varies by machine)")
    assert np.linalg.norm(ee - ref) < 1e-3 and rtf > 1

test_integrators()
test_contact()
test_arm_matches_kinematics()
print("PASS")
```
:::end

## In practice

Gazebo (`gz sim`, the successor of Gazebo Classic) connects to ROS 2 through `ros_gz_bridge` and to ros2_control through `gz_ros2_control`, which loads your URDF's controllers against simulated joints. MuJoCo is fast and accurate for contact-rich manipulation and learning, with ROS 2 integrations maintained by the community. Check RTF, contact parameters and inertias (lesson 12) before trusting a result, and validate against hardware: the sim-to-real gap is real.

## Exercises

:::exercise
Your simulated gripper jitters when it closes on an object. Name three things to check.
:::solution
Contact stiffness against the time step ($\omega \Delta t$ too large), inertias of small links (tiny masses give high natural frequencies), and the controller gains, which may be too high for the simulated time step. Reduce the step, soften the contact or fix the inertias.
:::end

:::exercise
A simulation runs at RTF 0.4. What happens to a ROS 2 controller node that uses wall-clock time?
:::solution
It runs 2.5 times too often relative to simulated time, so its gains and filters behave differently. Use `use_sim_time:=true` so the node follows `/clock`, and the controller then runs at its rate in simulated time.
:::end

## Quiz

:::quiz
- type: num
  q: Natural frequency of a 1 kg mass on a 1e6 N/m contact spring (rad/s)?
  answer: 1000
  tol: 0.002
  py: "math.sqrt(1e6/1)"
  explain: sqrt(k/m).
- type: num
  q: Largest stable step for that contact with the rule omega dt < 2 (ms)?
  answer: 2
  tol: 0.002
  py: "2/1000*1000"
  explain: 2/omega seconds.
- type: num
  q: Real-time factor if 30 s of simulation take 12 s of wall time?
  answer: 2.5
  tol: 0.002
  py: "30/12"
  explain: Simulated over wall time.
- type: num
  q: Impact speed of a ball dropped from 0.5 m (m/s)?
  answer: 3.13
  tol: 0.005
  py: "math.sqrt(2*9.81*0.5)"
  explain: sqrt(2 g h).
- type: mc
  q: Semi-implicit Euler updates…
  options:
    - velocity first, then position with the new velocity
    - position first, then velocity
    - both from the old state
    - only the position
  answer: 0
  explain: That keeps energy bounded.
- type: mc
  q: A contact spring that is too stiff for the time step makes objects…
  options:
    - jitter or bounce higher than they fell
    - sink slowly through the floor
    - stop moving entirely
    - simulate faster
  answer: 0
  explain: The integrator injects energy.
:::end
