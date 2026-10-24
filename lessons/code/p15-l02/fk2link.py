import numpy as np

L1, L2 = 1.0, 0.8                                   # the arm lab's link lengths (m)
Q1_LIM, Q2_LIM = (0.0, np.pi), (-np.radians(135), np.radians(135))

def fk(q1, q2, l1=L1, l2=L2):
    """tool (x, y) and elbow position of a planar 2-link arm"""
    elbow = np.array([l1 * np.cos(q1), l1 * np.sin(q1)])
    return elbow + l2 * np.array([np.cos(q1 + q2), np.sin(q1 + q2)]), elbow

def T(theta, a):
    """homogeneous transform: rotate by theta, then move a along the new x axis"""
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s, a * c], [s, c, a * s], [0, 0, 1]])

def fk_chain(q1, q2):
    return (T(q1, L1) @ T(q2, L2))[:2, 2]

def fk_geometric(q1, q2):
    """compass-and-ruler construction with complex numbers: rotate, add, rotate again"""
    z = L1 * np.exp(1j * q1) + L2 * np.exp(1j * (q1 + q2))
    return np.array([z.real, z.imag])

def workspace_area(limits, n=600, cell=0.01):
    """area covered by the tool, by rasterising a dense joint grid"""
    q1 = np.linspace(*(limits[0] if limits else (-np.pi, np.pi)), n)
    q2 = np.linspace(*(limits[1] if limits else (-np.pi, np.pi)), n)
    A, B = np.meshgrid(q1, q2)
    x = L1 * np.cos(A) + L2 * np.cos(A + B); y = L1 * np.sin(A) + L2 * np.sin(A + B)
    cells = set(zip(np.floor(x.ravel() / cell).astype(int), np.floor(y.ravel() / cell).astype(int)))
    return len(cells) * cell * cell

def test_fk_matches_construction():
    rng = np.random.default_rng(0)
    for q1, q2 in rng.uniform(-np.pi, np.pi, (500, 2)):
        p, _ = fk(q1, q2)
        assert np.allclose(p, fk_chain(q1, q2)) and np.allclose(p, fk_geometric(q1, q2))
    p, e = fk(np.radians(60), np.radians(-70))      # the lab's start pose
    print(f"lab start pose: elbow ({e[0]:.3f}, {e[1]:.3f}), tool ({p[0]:.3f}, {p[1]:.3f}) m")
    assert np.allclose(p, [0.5 + 0.8 * np.cos(np.radians(-10)), np.sqrt(3) / 2 + 0.8 * np.sin(np.radians(-10))])

def test_reach():
    rng = np.random.default_rng(1)
    r = [np.hypot(*fk(*q)[0]) for q in rng.uniform(-np.pi, np.pi, (2000, 2))]
    assert min(r) >= L1 - L2 - 1e-12 and max(r) <= L1 + L2 + 1e-12
    assert abs(np.hypot(*fk(0.3, 0)[0]) - 1.8) < 1e-12 and abs(np.hypot(*fk(0.3, np.pi)[0]) - 0.2) < 1e-12

def test_workspace_area():
    full = workspace_area(None); lim = workspace_area((Q1_LIM, Q2_LIM))
    exact = np.pi * ((L1 + L2) ** 2 - (L1 - L2) ** 2)
    print(f"workspace area: unlimited {full:.3f} m^2 (exact {exact:.3f}), with the lab's joint limits {lim:.3f} m^2")
    assert abs(full - exact) / exact < 0.02 and lim < full

test_fk_matches_construction()
test_reach()
test_workspace_area()
print("PASS")
