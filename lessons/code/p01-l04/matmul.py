import time
import numpy as np

def matmul(A, B):
    n, m = len(A), len(A[0])
    assert m == len(B), "inner dimensions must match"
    p = len(B[0])
    C = [[0.0] * p for _ in range(n)]
    for i in range(n):
        for j in range(p):
            s = 0.0
            for k in range(m):
                s += A[i][k] * B[k][j]
            C[i][j] = s
    return C

if __name__ == "__main__":
    R = [[0, -1], [1, 0]]
    S = [[2, 0], [0, 1]]
    assert matmul(S, R) == [[0, -2], [1, 0]]
    assert matmul(R, S) == [[0, -1], [2, 0]]
    rng = np.random.default_rng(0)
    A, B = rng.standard_normal((120, 80)), rng.standard_normal((80, 100))
    t0 = time.perf_counter(); C1 = np.array(matmul(A.tolist(), B.tolist())); t1 = time.perf_counter()
    C2 = A @ B; t2 = time.perf_counter()
    assert np.allclose(C1, C2, rtol=0, atol=1e-12)
    print(f"loops {1e3*(t1-t0):.1f} ms, NumPy {1e3*(t2-t1):.3f} ms, max diff {abs(C1-C2).max():.1e}")
