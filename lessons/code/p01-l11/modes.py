import math
import numpy as np

def jacobi_eig(A, tol=1e-12, max_sweeps=100):
    A = np.array(A, float); n = len(A); V = np.eye(n)
    for _ in range(max_sweeps):
        off = np.sqrt(np.sum(A ** 2) - np.sum(np.diag(A) ** 2))
        if off < tol * np.linalg.norm(A): break
        for p in range(n - 1):
            for q in range(p + 1, n):
                if abs(A[p, q]) < 1e-300: continue
                theta = (A[q, q] - A[p, p]) / (2 * A[p, q])
                t = math.copysign(1, theta) / (abs(theta) + math.sqrt(theta * theta + 1))
                c = 1 / math.sqrt(t * t + 1); s = t * c
                G = np.eye(n); G[p, p] = G[q, q] = c; G[p, q] = s; G[q, p] = -s
                A = G.T @ A @ G; V = V @ G
    order = np.argsort(np.diag(A))
    return np.diag(A)[order], V[:, order]

def modes(masses, k):
    n = len(masses)
    K = np.diag([2 * k] * n) - np.diag([k] * (n - 1), 1) - np.diag([k] * (n - 1), -1)
    Mih = np.diag(1 / np.sqrt(masses))
    w2, U = jacobi_eig(Mih @ K @ Mih)
    return np.sqrt(w2), Mih @ U                 # frequencies [rad/s], mode shapes

if __name__ == "__main__":
    w, V = modes([1.0, 1.0], 100.0)
    assert np.allclose(w, [10, math.sqrt(300)])
    assert abs(V[0, 0] / V[1, 0] - 1) < 1e-9 and abs(V[0, 1] / V[1, 1] + 1) < 1e-9
    w3, V3 = modes([1.0, 1.0, 1.0], 100.0)
    exact = [2 * 10 * math.sin(j * math.pi / 8) for j in (1, 2, 3)]
    assert np.allclose(w3, exact, rtol=1e-10)
    print("3-cart frequencies [rad/s]:", w3.round(3), " shapes:\n", (V3 / abs(V3).max(0)).round(3))
