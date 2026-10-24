import numpy as np

L1, L2, M1, M2, G = 1.0, 0.8, 1.5, 1.0, 9.81    # the arm lab's links: uniform rods (m, kg)
TAU_MAX = np.array([45.0, 25.0])                # the lab's motor torque limits (N m)

def fk(q):
    e = L1 * np.array([np.cos(q[0]), np.sin(q[0])]); return e + L2 * np.array([np.cos(q[0] + q[1]), np.sin(q[0] + q[1])]), e
def jac(q):
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

def jac_point(q, link, d):
    """Jacobian of a point a distance d along link 1 or 2 (zero column for joints beyond it)"""
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    if link == 1: return np.array([[-d * s1, 0], [d * c1, 0]])
    return np.array([[-L1 * s1 - d * s12, -d * s12], [L1 * c1 + d * c12, d * c12]])

def holding_torque(q, payload=0.0, F_tool=(0.0, 0.0)):
    """virtual work: tau = sum J_i^T F_i over every applied force, here the link weights, the payload and a tool force.
    Returned as the torque the motors must supply to hold still."""
    tau = np.zeros(2)
    for link, m, d in ((1, M1, L1 / 2), (2, M2, L2 / 2)):
        tau -= jac_point(q, link, d).T @ np.array([0, -m * G])
    tau -= jac(q).T @ (np.array([0, -payload * G]) + np.asarray(F_tool, float))
    return tau

def newton_euler_static(q, payload=0.0, F_tool=(0.0, 0.0)):
    """free-body diagrams: each joint must cancel the moment of everything outboard of it"""
    tip, elbow = fk(q); F_tool = np.asarray(F_tool, float)
    c1 = elbow / 2; c2 = elbow + (tip - elbow) / 2
    cross = lambda r, f: r[0] * f[1] - r[1] * f[0]
    forces2 = [(c2, np.array([0, -M2 * G])), (tip, np.array([0, -payload * G]) + F_tool)]
    tau2 = -sum(cross(p - elbow, f) for p, f in forces2)
    tau1 = -sum(cross(p, f) for p, f in forces2 + [(c1, np.array([0, -M1 * G]))])
    return np.array([tau1, tau2])

def test_matches_newton_euler():
    rng = np.random.default_rng(13)
    for _ in range(300):
        q = rng.uniform(-np.pi, np.pi, 2); m = rng.uniform(0, 3); F = rng.normal(size=2) * 10
        assert np.allclose(holding_torque(q, m, F), newton_euler_static(q, m, F))

def test_lab_gravity_model():
    # the lab's gravity term: (m1 lc1 + m2 l1) g cos q1 + m2 lc2 g cos(q1 + q2), m2 lc2 g cos(q1 + q2)
    q = np.radians([60, -70])
    lab = np.array([(M1 * 0.5 + M2 * L1) * G * np.cos(q[0]) + M2 * 0.4 * G * np.cos(q[0] + q[1]), M2 * 0.4 * G * np.cos(q[0] + q[1])])
    assert np.allclose(holding_torque(q), lab)

def test_payload_example():
    q = np.radians([60, -70])
    for m in (0.0, 2.0):
        t = holding_torque(q, m); print(f"payload {m:.1f} kg: tau = ({t[0]:6.2f}, {t[1]:6.2f}) N m, {np.abs(t / TAU_MAX).max() * 100:.0f} % of the worst limit")
    # the heaviest payload the lab arm can hold stretched out horizontally
    qh = np.array([0.0, 0.0]); base = holding_torque(qh); per_kg = holding_torque(qh, 1.0) - base
    mmax = np.min((TAU_MAX - base) / per_kg)
    print(f"stretched horizontally: {base.round(2)} N m with no payload, max payload {mmax:.2f} kg")
    assert abs(mmax - min((45 - base[0]) / (1.8 * G), (25 - base[1]) / (0.8 * G))) < 1e-9

def test_force_at_tool():
    q = np.radians([90, -90])                 # upper arm up, forearm horizontal
    t = holding_torque(q, 0, F_tool=(10.0, 0.0)) - holding_torque(q)
    print("resisting a 10 N push in +x at the tool needs", t.round(3), "N m extra")
    assert np.allclose(t, [10 * 1.0, 0.0], atol=1e-9)          # the push runs along the forearm, so the elbow feels none of it

test_matches_newton_euler()
test_lab_gravity_model()
test_payload_example()
test_force_at_tool()
print("PASS")
