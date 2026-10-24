import math
import numpy as np

def trapz(y, h):
    y = np.asarray(y, float)
    return h * (y[0] / 2 + y[1:-1].sum() + y[-1] / 2)

def simpson(y, h):
    y = np.asarray(y, float)
    if (len(y) - 1) % 2:
        raise ValueError("Simpson needs an even number of intervals")
    return h / 3 * (y[0] + 4 * y[1:-1:2].sum() + 2 * y[2:-1:2].sum() + y[-1])

if __name__ == "__main__":
    x = np.linspace(0, 2, 3); assert trapz(x ** 3, 1) == 5 and simpson(x ** 3, 1) == 4
    x = np.linspace(0, 2, 5); assert trapz(x ** 3, 0.5) == 4.25
    errs = []                                     # order test on ∫₀¹ x⁴ dx = 1/5
    for n in (4, 8, 16, 32, 64):
        x = np.linspace(0, 1, n + 1)
        errs.append(abs(simpson(x ** 4, 1 / n) - 0.2))
    ratios = [errs[i] / errs[i + 1] for i in range(4)]
    assert all(abs(r - 16) < 1e-6 for r in ratios), ratios
    # scooter log: v(t) = 4 + 2 sin(t/2) + 0.5 t − 0.04 t² m/s, sampled at 10 Hz for 12 s
    t = np.linspace(0, 12, 121)
    v = 4 + 2 * np.sin(t / 2) + 0.5 * t - 0.04 * t ** 2
    F = lambda t: 4 * t - 4 * math.cos(t / 2) + 0.25 * t ** 2 - 0.04 * t ** 3 / 3
    exact = F(12) - F(0)
    print(f"distance: trapezoid {trapz(v, 0.1):.6f} m, Simpson {simpson(v, 0.1):.6f} m, exact {exact:.6f} m")
    assert abs(simpson(v, 0.1) - exact) < 1e-6 and abs(trapz(v, 0.1) - exact) < 1e-2
