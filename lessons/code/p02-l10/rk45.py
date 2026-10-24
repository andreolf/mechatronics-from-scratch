import numpy as np
from scipy.integrate import solve_ivp      # only for the reference solution

C = [0, 1/5, 3/10, 4/5, 8/9, 1, 1]
A = [[], [1/5], [3/40, 9/40], [44/45, -56/15, 32/9],
     [19372/6561, -25360/2187, 64448/6561, -212/729],
     [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656],
     [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84]]
B5 = np.array([35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0])
B4 = np.array([5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40])

def rk45(f, t, x, t_end, rtol=1e-6, atol=1e-6, h=1e-2):
    x = np.asarray(x, float); accepted = rejected = 0
    while t < t_end - 1e-15:
        h = min(h, t_end - t)
        k = []
        for i in range(7):
            xi = x + h * sum(A[i][j] * k[j] for j in range(i)) if i else x
            k.append(f(t + C[i] * h, xi))
        k = np.array(k)
        x5, x4 = x + h * B5 @ k, x + h * B4 @ k
        err = np.max(np.abs(x5 - x4) / (atol + rtol * np.maximum(abs(x), abs(x5))))
        if err <= 1:
            t, x = t + h, x5; accepted += 1
        else:
            rejected += 1
        h *= min(5.0, max(0.2, 0.9 * err ** -0.2)) if err > 0 else 5.0
    return x, accepted, rejected

if __name__ == "__main__":
    vdp = lambda t, s: np.array([s[1], (1 - s[0] ** 2) * s[1] - s[0]])
    ref = solve_ivp(vdp, [0, 20], [2, 0], method="DOP853", rtol=1e-13, atol=1e-13).y[:, -1]
    last_steps = 0
    for tol in (1e-4, 1e-6, 1e-8, 1e-10):
        x, n, r = rk45(vdp, 0.0, [2.0, 0.0], 20.0, tol, tol)
        e = np.abs(x - ref).max()
        print(f"tol {tol:.0e}: error {e:.1e}, {n} steps, {r} rejected")
        assert e < 20 * tol and n > last_steps
        last_steps = n
    assert abs(0.05 * 0.9 * 4 ** -0.2 - 0.0341) < 1e-4
