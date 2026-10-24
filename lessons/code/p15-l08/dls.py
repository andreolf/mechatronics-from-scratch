import numpy as np

L = np.array([1.0, 0.8])                      # the arm lab's links (m)
LAMBDA = 0.08                                 # the lab's damping (m)

def fk(q): a = np.cumsum(q); return np.array([L @ np.cos(a), L @ np.sin(a)])
def jac(q):
    a = np.cumsum(q); return np.array([[-L @ np.sin(a), -L[1] * np.sin(a[1])], [L @ np.cos(a), L[1] * np.cos(a[1])]])

def step_pinv(J, v, lam): return np.linalg.pinv(J) @ v
def step_dls(J, v, lam):   # J^T (J J^T + lambda^2 I)^-1 v
    return J.T @ np.linalg.solve(J @ J.T + lam ** 2 * np.eye(2), v)

def track(step, lam=LAMBDA, speed=0.2, k=20.0, dt=1e-3, T=4.0):
    """resolved-rate control: the target slides along y = 0.3 out past the reach limit; dq = step(J, v_d + k e)"""
    q = np.radians([20.0, -60.0]); x0 = fk(q); qdmax, errs, qs = 0.0, [], []
    for i in range(int(T / dt)):
        t = i * dt
        xd = np.array([x0[0] + speed * t, x0[1] + (0.3 - x0[1]) * min(1, t / 0.5)])
        vd = np.array([speed, (0.3 - x0[1]) / 0.5 if t < 0.5 else 0.0])
        e = xd - fk(q)
        qd = step(jac(q), vd + k * e, lam)
        qdmax = max(qdmax, np.abs(qd).max()); q = q + dt * qd
        errs.append(np.linalg.norm(e)); qs.append(q.copy())
    return qdmax, np.array(errs), np.array(qs)

def test_dls_bounded_at_singularity():
    p_max, p_err, _ = track(step_pinv)
    d_max, d_err, _ = track(step_dls)
    print(f"pseudo-inverse: peak joint speed {p_max:9.1f} rad/s")
    print(f"DLS (lambda = {LAMBDA}): peak joint speed {d_max:6.2f} rad/s, final error {d_err[-1] * 1000:.0f} mm (target beyond reach)")
    assert p_max > 100 and d_max < 10

def test_singular_value_filter():
    # DLS gain on each singular direction is s/(s^2 + lambda^2): never more than 1/(2 lambda)
    for s in np.logspace(-4, 1, 200):
        assert s / (s * s + LAMBDA ** 2) <= 1 / (2 * LAMBDA) + 1e-12
    U, S, Vt = np.linalg.svd(jac(np.radians([30, 1.0])))
    v = U[:, 1]                                                   # ask for motion along the weak direction
    for lam in (0, LAMBDA):
        qd = step_dls(jac(np.radians([30, 1.0])), v, lam) if lam else step_pinv(jac(np.radians([30, 1.0])), v, 0)
        print(f"lambda = {lam:4.2f}: smallest singular value {S[1]:.4f}, joint speed for 1 m/s along it {np.linalg.norm(qd):7.2f} rad/s")
    assert np.linalg.norm(step_dls(jac(np.radians([30, 1.0])), v, LAMBDA)) <= 1 / (2 * LAMBDA) + 1e-9

def test_damping_costs_accuracy_far_from_singularity():
    q = np.radians([60, -70]); J = jac(q); v = np.array([0.1, 0.0])
    err = np.linalg.norm(J @ step_dls(J, v, LAMBDA) - v) / 0.1
    print(f"away from the singularity, DLS tracks the requested velocity within {err * 100:.2f} %")
    assert err < 0.03

test_dls_bounded_at_singularity()
test_singular_value_filter()
test_damping_costs_accuracy_far_from_singularity()
print("PASS")
