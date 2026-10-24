import math
import numpy as np

class Circuit:
    def __init__(self, n):
        self.n, self.R, self.C, self.L, self.V = n, [], [], [], []

    def r(self, a, b, val): self.R.append((a, b, val))
    def c(self, a, b, val): self.C.append((a, b, val))
    def l(self, a, b, val): self.L.append((a, b, val))
    def v(self, a, b, val): self.V.append((a, b, val))

    def transient(self, h, steps):
        n, nv, nl = self.n, len(self.V), len(self.L)
        size = n + nv + nl
        x = np.zeros(size)
        out = [x[:n].copy()]
        def at(M, i, j, val):
            if i >= 0 and j >= 0:
                M[i, j] += val
        for _ in range(steps):
            A = np.zeros((size, size)); b = np.zeros(size)
            for a, c, val in self.R:
                g = 1 / val
                at(A, a - 1, a - 1, g); at(A, c - 1, c - 1, g); at(A, a - 1, c - 1, -g); at(A, c - 1, a - 1, -g)
            for a, c, val in self.C:                       # backward Euler companion
                g = val / h
                at(A, a - 1, a - 1, g); at(A, c - 1, c - 1, g); at(A, a - 1, c - 1, -g); at(A, c - 1, a - 1, -g)
                vprev = (x[a - 1] if a else 0) - (x[c - 1] if c else 0)
                if a: b[a - 1] += g * vprev
                if c: b[c - 1] -= g * vprev
            for k, (a, c, val) in enumerate(self.V):
                row = n + k
                at(A, a - 1, row, 1); at(A, row, a - 1, 1); at(A, c - 1, row, -1); at(A, row, c - 1, -1)
                b[row] = val
            for k, (a, c, val) in enumerate(self.L):       # v_a - v_c = L/h (i - i_prev)
                row = n + nv + k
                at(A, a - 1, row, 1); at(A, c - 1, row, -1)
                at(A, row, a - 1, 1); at(A, row, c - 1, -1); A[row, row] -= val / h
                b[row] = -val / h * x[row]
            x = np.linalg.solve(A, b)
            out.append(x[:n].copy())
        return np.array(out)

if __name__ == "__main__":
    ck = Circuit(2)
    ck.v(1, 0, 5.0); ck.r(1, 2, 1e3); ck.c(2, 0, 1e-6)
    v = ck.transient(1e-4, 10)[:, 1]
    assert abs(v[-1] - 5 * (1 - 1 / 1.1**10)) < 1e-9 and abs(v[-1] - 3.0722) < 1e-4
    errs = [abs(ck.transient(1e-3 / m, m)[-1, 1] - 5 * (1 - math.exp(-1))) for m in (100, 200)]
    assert 1.9 < errs[0] / errs[1] < 2.1                    # first order: halve h, halve the error
    # series RLC from lesson 7: nodes 1 (source), 2 (between R and L), 3 (capacitor)
    rlc = Circuit(3)
    rlc.v(1, 0, 1.0); rlc.r(1, 2, 20.0); rlc.l(2, 3, 10e-3); rlc.c(3, 0, 1e-6)
    vc = rlc.transient(2e-7, 5000)[:, 2]
    overshoot = vc.max() - 1
    print(f"RLC overshoot {100*overshoot:.2f} % (analytic 72.92 %)")
    assert abs(overshoot - 0.7292) < 0.01
    # backward Euler stays stable with a huge step; forward Euler would explode
    big = ck.transient(5e-3, 20)[:, 1]
    assert np.all(np.diff(big) >= 0) and abs(big[-1] - 5) < 1e-6
    fe = [0.0]
    for _ in range(20):
        fe.append(fe[-1] + 5.0 * (5 - fe[-1]))             # h/tau = 5
    assert abs(fe[-1]) > 1e6
