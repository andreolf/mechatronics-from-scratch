import math
import numpy as np

def simulate(f, x0, t_end, h):
    """Forward Euler, enough for a smooth first-order system with h ≪ τ."""
    n = round(t_end / h)
    t, x = np.linspace(0, n * h, n + 1), np.empty(n + 1)
    x[0] = x0
    for k in range(n):
        x[k + 1] = x[k] + h * f(t[k], x[k])
    return t, x

if __name__ == "__main__":
    tau, u = 1.0, 5.0                                    # RC = 10 kΩ × 100 µF, 5 V step
    t, v = simulate(lambda t, x: (u - x) / tau, 0.0, 5.0, 1e-4)
    exact = u * (1 - np.exp(-t / tau))
    assert abs(v - exact).max() < 1e-4
    k63 = np.argmax(v >= u * (1 - math.exp(-1)))
    assert abs(t[k63] - tau) < 1e-3                      # 63.2 % at t = τ
    Rth, Cth, P = 2.0, 50.0, 10.0
    t, dT = simulate(lambda t, x: (Rth * P - x) / (Rth * Cth), 0.0, 300.0, 0.01)
    assert abs(dT[round(100 / 0.01)] - 12.64) < 0.01 and abs(dT[-1] - 19.0) < 0.05
    print(f"RC max error {abs(v - exact).max():.1e}; winding +{dT[-1]:.2f} K after 300 s")
