import numpy as np

def series(*r):
    return sum(r)

def parallel(*r):
    return 1.0 / sum(1.0 / x for x in r)

def ladder(rs, rp):
    """Input resistance of a ladder: series rs[k] then shunt rp[k], last rung at the far end."""
    r = rp[-1]
    for k in range(len(rp) - 2, -1, -1):
        r = parallel(rp[k], series(rs[k + 1], r))
    return series(rs[0], r)

def ladder_nodal(rs, rp, V=1.0):
    """Same ladder by nodal analysis: returns the source current, so R_in = V / i."""
    n = len(rp)
    G = np.zeros((n, n)); b = np.zeros(n)
    for k in range(n):
        G[k, k] += 1 / rp[k] + 1 / rs[k]
        if k == 0:
            b[0] += V / rs[0]
        else:
            G[k, k - 1] -= 1 / rs[k]; G[k - 1, k] -= 1 / rs[k]; G[k - 1, k - 1] += 1 / rs[k]
    v = np.linalg.solve(G, b)
    return (V - v[0]) / rs[0]

if __name__ == "__main__":
    assert abs((5 - 2.0) / 0.010 - 300) < 1e-9
    assert abs(parallel(10, 100) - 9.0909) < 1e-4
    vout = 5 * parallel(10, 100) / (10 + parallel(10, 100))
    assert abs(vout - 2.380952) < 1e-6
    rs, rp = [1.0, 2.2, 4.7, 1.0], [10.0, 3.3, 6.8, 2.2]
    r_reduce, r_nodal = ladder(rs, rp), 1.0 / ladder_nodal(rs, rp)
    print(f"ladder input resistance {r_reduce:.6f} kOhm (reduction) vs {r_nodal:.6f} (nodal)")
    assert abs(r_reduce - r_nodal) < 1e-12
    assert parallel(1, 2, 3) < 1                       # smaller than the smallest
