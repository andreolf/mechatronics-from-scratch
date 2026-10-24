import numpy as np

# the arm lab's links: uniform rods, centre of mass halfway, I about the centre m l^2 / 12
P = dict(l=[1.0, 0.8], m=[1.5, 1.0], g=9.81)
P["lc"] = [P["l"][0] / 2, P["l"][1] / 2]; P["I"] = [m * l * l / 12 for m, l in zip(P["m"], P["l"])]
cross2 = lambda a, b: a[0] * b[1] - a[1] * b[0]               # z component of a 3-D cross product
def wx(w, r): return np.array([-w * r[1], w * r[0]])            # (w z) x r in the plane

def rnea(q, qd, qdd, p=P, f_tool=(0.0, 0.0)):
    """recursive Newton-Euler for a planar chain of revolute joints.
    Gravity enters as an upward acceleration of the base, so every link 'feels' it."""
    n = len(q); th = np.cumsum(q); w = np.cumsum(qd); al = np.cumsum(qdd)
    a_joint = np.array([0.0, p["g"]]); a_c, r_c, r_next = [], [], []
    for i in range(n):                                            # forward pass: velocities and accelerations
        u = np.array([np.cos(th[i]), np.sin(th[i])])
        rc, rn = p["lc"][i] * u, p["l"][i] * u
        a_c.append(a_joint + wx(al[i], rc) + wx(w[i], wx(w[i], rc)))
        a_joint = a_joint + wx(al[i], rn) + wx(w[i], wx(w[i], rn))
        r_c.append(rc); r_next.append(rn)
    f, tau_next, tau = -np.asarray(f_tool, float), 0.0, np.zeros(n)   # force the outer link applies to the next one
    for i in reversed(range(n)):                                  # backward pass: forces and moments
        F = p["m"][i] * a_c[i]                                    # net force needed on link i
        f_i = F + f                                               # force from joint i onto link i
        # moments about joint i: joint torque + moment of f_i (at the joint, zero arm) - moment of f at the far end
        tau[i] = p["I"][i] * al[i] + cross2(r_c[i], F) + cross2(r_next[i], f) + tau_next
        f, tau_next = f_i, tau[i]
    return tau

def lagrange(q, qd, qdd, p=P):
    """the closed-form M, C, g the arm lab integrates"""
    (l1, _), (m1, m2), (lc1, lc2), (I1, I2), g = p["l"], p["m"], p["lc"], p["I"], p["g"]
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M = np.array([[m1 * lc1 ** 2 + I1 + m2 * (l1 ** 2 + lc2 ** 2 + 2 * l1 * lc2 * c2) + I2, m2 * (lc2 ** 2 + l1 * lc2 * c2) + I2],
                  [m2 * (lc2 ** 2 + l1 * lc2 * c2) + I2, m2 * lc2 ** 2 + I2]])
    h = m2 * l1 * lc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2])
    G = np.array([(m1 * lc1 + m2 * l1) * g * np.cos(q[0]) + m2 * lc2 * g * np.cos(q[0] + q[1]), m2 * lc2 * g * np.cos(q[0] + q[1])])
    return M @ qdd + c + G

def test_matches_lagrangian():
    rng = np.random.default_rng(15)
    for _ in range(500):
        q, qd, qdd = rng.uniform(-3, 3, 2), rng.uniform(-4, 4, 2), rng.uniform(-10, 10, 2)
        assert np.allclose(rnea(q, qd, qdd), lagrange(q, qd, qdd), atol=1e-10)

def test_tool_force_matches_statics():
    q = np.radians([90, -90]); F = np.array([10.0, 0.0])
    extra = rnea(q, [0, 0], [0, 0], f_tool=F) - rnea(q, [0, 0], [0, 0])
    assert np.allclose(extra, [10.0, 0.0])                        # lesson 10's answer, resisting a 10 N push

def test_worked_example():
    q, qd, qdd = np.radians([60, -70]), np.array([1.0, -0.5]), np.array([2.0, 1.0])
    t = rnea(q, qd, qdd); s = rnea(q, [0, 0], [0, 0])
    print(f"tau = ({t[0]:.3f}, {t[1]:.3f}) N m, of which gravity ({s[0]:.3f}, {s[1]:.3f})")
    # mass matrix column by column: unit accelerations, no velocity, no gravity
    p0 = dict(P, g=0.0)
    Mcols = np.column_stack([rnea(q, [0, 0], e, p0) for e in np.eye(2)])
    print("M(q) from RNEA:\n", Mcols.round(4))
    assert np.allclose(Mcols, Mcols.T)

test_matches_lagrangian()
test_tool_force_matches_statics()
test_worked_example()
print("PASS")
