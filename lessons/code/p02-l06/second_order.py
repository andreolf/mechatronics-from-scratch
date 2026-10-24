import math
import numpy as np

def rk4(f, x, t, h):
    k1 = f(t, x); k2 = f(t + h/2, x + h/2*k1); k3 = f(t + h/2, x + h/2*k2); k4 = f(t + h, x + h*k3)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

def step_response(m, c, k, t_end=3.0, h=1e-4):
    f = lambda t, s: np.array([s[1], (1.0 - c*s[1] - k*s[0]) / m])   # F = 1 N
    n = round(t_end / h); xs = np.empty(n + 1); s = np.zeros(2); xs[0] = 0
    for i in range(n):
        s = rk4(f, s, i*h, h); xs[i + 1] = s[0]
    return np.arange(n + 1) * h, xs

if __name__ == "__main__":
    m, c, k = 0.5, 4.0, 200.0
    wn, zeta = math.sqrt(k/m), c / (2*math.sqrt(k*m))
    assert abs(wn - 20) < 1e-12 and abs(zeta - 0.2) < 1e-12
    t, x = step_response(m, c, k)
    x_ss = 1 / k
    Mp = x.max() / x_ss - 1
    tp = t[np.argmax(x)]
    print(f"overshoot {100*Mp:.2f} % (formula {100*math.exp(-zeta*math.pi/math.sqrt(1-zeta**2)):.2f} %), peak at {tp:.4f} s")
    assert abs(Mp - math.exp(-zeta*math.pi/math.sqrt(1 - zeta**2))) < 1e-4
    assert abs(tp - math.pi/(wn*math.sqrt(1 - zeta**2))) < 2e-4
    for z in (0.1, 0.5, 0.7, 0.9):
        cc = 2*z*math.sqrt(k*m); _, xz = step_response(m, cc, k)
        assert abs(xz.max()/x_ss - 1 - math.exp(-z*math.pi/math.sqrt(1 - z*z))) < 1e-4
    _, xc = step_response(m, 2*math.sqrt(k*m), k)
    assert xc.max() <= x_ss * (1 + 1e-9)                  # critical damping: no overshoot
