import numpy as np

def fk(q, l):
    a = np.cumsum(q); return np.array([np.dot(l, np.cos(a)), np.dot(l, np.sin(a))])

def jacobian(q, l):
    """d(tool x, y)/dq for a planar chain: column j sums the links from joint j outwards"""
    a = np.cumsum(q); J = np.zeros((2, len(q)))
    for j in range(len(q)):
        J[0, j] = -np.dot(l[j:], np.sin(a[j:])); J[1, j] = np.dot(l[j:], np.cos(a[j:]))
    return J

def ik_newton(target, q0, l, tol=1e-9, max_iter=20, max_step=0.5):
    """Newton-Raphson on FK(q) = target with the pseudo-inverse; the step is capped at max_step rad"""
    q = np.array(q0, float); hist = []
    for k in range(max_iter):
        e = target - fk(q, l); hist.append(np.linalg.norm(e))
        if hist[-1] < tol: return q, k, hist
        dq = np.linalg.pinv(jacobian(q, l)) @ e
        n = np.linalg.norm(dq)
        q += dq if n <= max_step else dq * max_step / n
    e = target - fk(q, l); hist.append(np.linalg.norm(e))
    return q, (max_iter if hist[-1] < tol else None), hist

LAB = np.array([1.0, 0.8]); START = np.radians([60, -70])     # the arm lab's links and start pose
ARM3 = np.array([1.0, 0.8, 0.3])

def test_jacobian_numeric():
    rng = np.random.default_rng(10)
    for q in rng.uniform(-np.pi, np.pi, (50, 3)):
        Jn = np.column_stack([(fk(q + h, ARM3) - fk(q - h, ARM3)) / 2e-6 for h in np.eye(3) * 1e-6])
        assert np.allclose(jacobian(q, ARM3), Jn, atol=1e-8)

def test_converges_in_20():
    rng = np.random.default_rng(11)
    for l, q0, name in ((LAB, START, "lab 2-link arm"), (ARM3, np.radians([60, -70, 20]), "3-link arm")):
        iters = []
        for _ in range(500):
            r, a = rng.uniform(abs(l[0] - l[1:].sum()) + 0.05 if len(l) == 2 else 0.3, l.sum() - 0.05), rng.uniform(0, np.pi)
            target = r * np.array([np.cos(a), np.sin(a)])
            q, k, _ = ik_newton(target, q0, l)
            assert k is not None and np.linalg.norm(fk(q, l) - target) < 1e-9
            iters.append(k)
        print(f"{name}: 500 targets, iterations median {np.median(iters):.0f}, max {max(iters)}")
        assert max(iters) <= 20

def test_quadratic_convergence():
    q, k, h = ik_newton(np.array([1.2, 0.6]), START, LAB)
    print("error per iteration (m):", " ".join(f"{e:.1e}" for e in h))
    assert all(h[i + 1] < 3 * h[i] ** 2 / h[0] + 1e-12 for i in range(1, len(h) - 1))   # error roughly squares
    assert abs(np.degrees(q[0]) - 62.96) < 0.01      # lands on the lesson 06 branch nearest the start

def test_redundant_minimum_norm_step():
    q = np.radians([60, -70, 20]); J = jacobian(q, ARM3); e = np.array([0.01, -0.02])
    dq = np.linalg.pinv(J) @ e
    N = np.eye(3) - np.linalg.pinv(J) @ J                 # adding a null-space motion keeps J dq the same
    other = dq + N @ np.array([0.3, -0.1, 0.2])
    assert np.allclose(J @ other, e) and np.linalg.norm(dq) < np.linalg.norm(other)

test_jacobian_numeric()
test_converges_in_20()
test_quadratic_convergence()
test_redundant_minimum_norm_step()
print("PASS")
