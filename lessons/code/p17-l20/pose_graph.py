import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

def wrap(a): return (a + np.pi) % (2 * np.pi) - np.pi

def v2t(p):
    c, s = np.cos(p[2]), np.sin(p[2]); return np.array([[c, -s, p[0]], [s, c, p[1]], [0, 0, 1]])

def t2v(T): return np.array([T[0, 2], T[1, 2], np.arctan2(T[1, 0], T[0, 0])])

def relative(pi, pj):
    """pose j seen from pose i: inv(T_i) T_j as (x, y, theta)"""
    return t2v(np.linalg.inv(v2t(pi)) @ v2t(pj))

def make_problem(seed=0, side=10, step=1.0, laps=2, sig=(0.05, 0.05, np.radians(1.0))):
    """illustrative robot driving a 10 m square twice; odometry edges between consecutive poses,
    loop-closure edges whenever it passes a pose of the first lap again (as a scan matcher would report)"""
    rng = np.random.default_rng(seed); truth = []; p = np.zeros(3)
    for _ in range(laps):
        for _ in range(4):
            for _ in range(int(side / step)): truth.append(p.copy()); p = t2v(v2t(p) @ v2t([step, 0, 0]))
            p = t2v(v2t(p) @ v2t([0, 0, np.pi / 2]))
    truth = np.array(truth); n = len(truth); info_odo = np.diag(1 / np.array(sig) ** 2); edges = []
    for i in range(n - 1):
        z = relative(truth[i], truth[i + 1]) + rng.normal(0, sig); edges.append((i, i + 1, z, info_odo))
    per_lap = n // laps
    for i in range(per_lap, n):
        j = i - per_lap
        z = relative(truth[j], truth[i]) + rng.normal(0, np.array(sig) / 2); edges.append((j, i, z, 4 * info_odo))
    guess = [np.zeros(3)]
    for i, j, z, _ in edges[:n - 1]: guess.append(t2v(v2t(guess[-1]) @ v2t(z)))        # dead reckoning initial guess
    return truth, np.array(guess), edges

def error_and_jacobians(xi, xj, z):
    """residual e = t2v(Z^-1 Xi^-1 Xj) and its Jacobians with respect to pose i and pose j"""
    Ri, Rz = v2t(xi)[:2, :2], v2t(z)[:2, :2]; ci, si = np.cos(xi[2]), np.sin(xi[2])
    e = t2v(np.linalg.inv(v2t(z)) @ np.linalg.inv(v2t(xi)) @ v2t(xj)); e[2] = wrap(e[2])
    dRi = np.array([[-si, ci], [-ci, -si]])                            # d(Ri') / d theta_i
    A = np.zeros((3, 3)); B = np.zeros((3, 3))
    A[:2, :2] = -Rz.T @ Ri.T; A[:2, 2] = Rz.T @ dRi @ (xj[:2] - xi[:2]); A[2, 2] = -1
    B[:2, :2] = Rz.T @ Ri.T; B[2, 2] = 1
    return e, A, B

def chi2(x, edges):
    """total weighted squared error: sum of e' Omega e over all edges"""
    total = 0.0
    for i, j, z, om in edges:
        e = error_and_jacobians(x[i], x[j], z)[0]; total += e @ om @ e
    return total

def optimise(x, edges, iters=10):
    """Gauss-Newton: build the sparse system H dx = -b from every edge, fix the first pose, solve, update, repeat"""
    x = x.copy(); n = len(x); hist = [chi2(x, edges)]
    for _ in range(iters):
        H = lil_matrix((3 * n, 3 * n)); b = np.zeros(3 * n)
        for i, j, z, om in edges:
            e, A, B = error_and_jacobians(x[i], x[j], z); si, sj = slice(3 * i, 3 * i + 3), slice(3 * j, 3 * j + 3)
            H[si, si] += A.T @ om @ A; H[si, sj] += A.T @ om @ B; H[sj, si] += B.T @ om @ A; H[sj, sj] += B.T @ om @ B
            b[si] += A.T @ om @ e; b[sj] += B.T @ om @ e
        H[0:3, 0:3] += np.eye(3) * 1e9                                  # anchor pose 0 (the gauge freedom)
        dx = spsolve(H.tocsr(), -b).reshape(n, 3); x += dx; x[:, 2] = wrap(x[:, 2])
        hist.append(chi2(x, edges))
        if np.abs(dx).max() < 1e-8: break
    return x, np.array(hist)

def ate(x, truth): return np.sqrt(np.mean(np.sum((x[:, :2] - truth[:, :2]) ** 2, 1)))

def test_jacobians():
    xi, xj, z = np.array([1.0, 2.0, 0.5]), np.array([2.5, 2.7, 1.1]), np.array([1.2, 0.3, 0.4]); e0, A, B = error_and_jacobians(xi, xj, z); h = 1e-6
    An = np.column_stack([(error_and_jacobians(xi + h * d, xj, z)[0] - error_and_jacobians(xi - h * d, xj, z)[0]) / (2 * h) for d in np.eye(3)])
    Bn = np.column_stack([(error_and_jacobians(xi, xj + h * d, z)[0] - error_and_jacobians(xi, xj - h * d, z)[0]) / (2 * h) for d in np.eye(3)])
    print(f"analytic vs numerical Jacobians: A {np.abs(A - An).max():.1e}, B {np.abs(B - Bn).max():.1e}")
    assert max(np.abs(A - An).max(), np.abs(B - Bn).max()) < 1e-6

def test_optimisation():
    truth, guess, edges = make_problem()
    x, hist = optimise(guess, edges)
    n_loop = len(edges) - (len(truth) - 1)
    print(f"{len(truth)} poses, {len(truth) - 1} odometry edges, {n_loop} loop closures")
    print(f"chi2 {hist[0]:.0f} -> {hist[1]:.1f} -> {hist[-1]:.1f} after {len(hist) - 1} iterations (about {3 * (len(edges) - len(truth) + 1)} expected at the optimum)")
    print(f"trajectory error (RMS position): dead reckoning {ate(guess, truth):.2f} m, optimised {ate(x, truth):.3f} m")
    assert hist[-1] < 1e-3 * hist[0] and ate(x, truth) < 0.2 * ate(guess, truth)
    dof = 3 * (len(edges) - len(truth) + 1); assert 0.7 * dof < hist[-1] < 1.3 * dof

def test_no_loop_closure_no_change():
    truth, guess, edges = make_problem()
    x, hist = optimise(guess, edges[:len(truth) - 1])
    print(f"odometry edges only: chi2 {hist[0]:.2e}, trajectory moves by at most {np.abs(x - guess).max():.1e}")
    assert np.abs(x - guess).max() < 1e-6

test_jacobians()
test_optimisation()
test_no_loop_closure_no_change()
print("PASS")
