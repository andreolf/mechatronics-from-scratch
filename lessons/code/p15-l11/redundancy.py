import numpy as np

L = np.array([1.0, 0.8, 0.5])                                 # illustrative 3-link planar arm (m)
LIM = np.radians([[0, 180], [-135, 135], [-60, 60]])          # joint limits
MID, RNG = LIM.mean(axis=1), LIM[:, 1] - LIM[:, 0]

def fk(q): a = np.cumsum(q); return np.array([L @ np.cos(a), L @ np.sin(a)])
def jac(q):
    a = np.cumsum(q)
    return np.array([[-(L[j:] @ np.sin(a[j:])) for j in range(3)], [L[j:] @ np.cos(a[j:]) for j in range(3)]])

def limit_cost_grad(q):
    """H = sum ((q - mid) / range)^2 is smallest mid-range; its gradient pushes joints away from their limits"""
    return 2 * (q - MID) / RNG ** 2

def track_circle(null_gain, T=8.0, dt=1e-3, k=20.0, centre=(1.2, 0.5), radius=0.4, period=4.0):
    q = np.radians([70.0, -80.0, 40.0])
    x_start = np.array(centre) + [radius, 0]
    for _ in range(200):                                        # start on the circle (pseudo-inverse IK)
        q += np.linalg.pinv(jac(q)) @ (x_start - fk(q))
    worst_margin, errs, qs = np.inf, [], []
    for i in range(int(T / dt)):
        w = 2 * np.pi / period; t = i * dt
        xd = np.array(centre) + radius * np.array([np.cos(w * t), np.sin(w * t)])
        vd = radius * w * np.array([-np.sin(w * t), np.cos(w * t)])
        J = jac(q); Jp = np.linalg.pinv(J); N = np.eye(3) - Jp @ J
        qd = Jp @ (vd + k * (xd - fk(q))) + N @ (-null_gain * limit_cost_grad(q))
        q = q + dt * qd
        worst_margin = min(worst_margin, np.min(np.minimum(q - LIM[:, 0], LIM[:, 1] - q)))
        errs.append(np.linalg.norm(xd - fk(q))); qs.append(q.copy())
    return np.degrees(worst_margin), np.array(errs), np.array(qs)

def test_null_space_keeps_limits():
    m0, e0, q0 = track_circle(0.0)
    m1, e1, q1 = track_circle(10.0)
    print(f"pseudo-inverse only : worst limit margin {m0:7.2f} deg (negative = limit broken), q2 range {np.degrees(q0[:, 1].min()):.1f} to {np.degrees(q0[:, 1].max()):.1f} deg")
    print(f"with null-space term: worst limit margin {m1:7.2f} deg, q2 range {np.degrees(q1[:, 1].min()):.1f} to {np.degrees(q1[:, 1].max()):.1f} deg")
    print(f"tracking error after 1 s: {e0[1000:].max() * 1000:.3f} mm and {e1[1000:].max() * 1000:.3f} mm")
    assert m0 < 0 and m1 > 0                                  # limits respected only with the null-space term
    assert e1[1000:].max() < 1e-3                              # and the tool still tracks the circle

def test_null_space_motion_is_invisible():
    rng = np.random.default_rng(14)
    for q in rng.uniform(-2, 2, (100, 3)):
        J = jac(q); N = np.eye(3) - np.linalg.pinv(J) @ J
        assert np.allclose(J @ N @ rng.normal(size=3), 0, atol=1e-12)
        assert np.linalg.matrix_rank(N, tol=1e-9) == 1        # one spare degree of freedom

test_null_space_motion_is_invisible()
test_null_space_keeps_limits()
print("PASS")
