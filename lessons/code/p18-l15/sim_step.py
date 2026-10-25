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
