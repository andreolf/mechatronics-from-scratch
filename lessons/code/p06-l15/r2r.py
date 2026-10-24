import numpy as np

def ladder_weights(R, R2):
    """Thevenin reduction from the LSB end. R[k] series resistors between nodes k and k+1 (n-1 of them),
    R2[0] the termination, R2[k+1] the 2R leg of bit k. Returns each bit's output voltage for 1 V drive."""
    n = len(R2) - 1
    w = []
    for bit in range(n):
        rth, vth = R2[0], 0.0
        for k in range(n):
            rb, vin = R2[k + 1], 1.0 if k == bit else 0.0
            v = (vth / rth + vin / rb) / (1 / rth + 1 / rb)
            rp = 1 / (1 / rth + 1 / rb)
            if k == n - 1:
                w.append(v); break
            vth, rth = v, rp + R[k]
    return np.array(w)

def nodal_output(R, R2, code, vref=1.0):
    """Independent check: solve the ladder's node equations G v = i directly."""
    n = len(R2) - 1
    G, I = np.zeros((n, n)), np.zeros(n)
    for k in range(n):
        g = 1 / R2[k + 1]; G[k, k] += g; I[k] += g * vref * ((code >> k) & 1)
        if k == 0:
            G[0, 0] += 1 / R2[0]
        if k < n - 1:
            g = 1 / R[k]; G[k, k] += g; G[k + 1, k + 1] += g; G[k, k + 1] -= g; G[k + 1, k] -= g
    return np.linalg.solve(G, I)[-1]

def dnl(w):
    codes = np.arange(2 ** len(w))
    out = np.array([sum(w[b] for b in range(len(w)) if c >> b & 1) for c in codes])
    lsb = (out[-1] - out[0]) / (len(codes) - 1)
    return np.diff(out) / lsb - 1

if __name__ == "__main__":
    n, Rv = 8, 10e3
    R, R2 = np.full(n - 1, Rv), np.full(n + 1, 2 * Rv)
    w = ladder_weights(R, R2)
    assert np.allclose(w, [2.0**(k - n) for k in range(n)])        # bit k contributes Vref * 2^(k-n)
    assert abs(nodal_output(R, R2, 0b1010_0101) - 0xA5 / 256) < 1e-12
    rng = np.random.default_rng(5)
    def trial(tol):
        Rt = R * (1 + tol * rng.uniform(-1, 1, n - 1)); R2t = R2 * (1 + tol * rng.uniform(-1, 1, n + 1))
        wt = ladder_weights(Rt, R2t)
        c = 0b1100_1010
        assert abs(nodal_output(Rt, R2t, c) - sum(wt[b] for b in range(n) if c >> b & 1)) < 1e-12
        d = dnl(wt)
        return np.abs(d).max(), d.min() > -1
    for tol, max_mean, mono_lo, mono_hi in ((0.001, 0.15, 1.0, 1.0), (0.01, 1.2, 0.6, 0.97), (0.02, 2.5, 0.2, 0.8)):
        res = [trial(tol) for _ in range(300)]
        worst = np.mean([r[0] for r in res]); mono = np.mean([r[1] for r in res])
        print(f"tolerance ±{tol*100:.1f} %: mean worst |DNL| {worst:.2f} LSB, monotonic {mono*100:.0f} % of DACs")
        assert worst < max_mean and mono_lo <= mono <= mono_hi
