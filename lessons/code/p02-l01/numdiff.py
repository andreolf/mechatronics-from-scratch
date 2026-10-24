import math
import numpy as np

def forward(f, x, h): return (f(x + h) - f(x)) / h
def central(f, x, h): return (f(x + h) - f(x - h)) / (2 * h)

def slope(hs, errs):
    return np.polyfit(np.log10(hs), np.log10(errs), 1)[0]

if __name__ == "__main__":
    x, exact = 1.0, math.cos(1.0)
    assert abs(forward(math.sin, x, 0.1) - 0.497364) < 1e-6
    assert abs(central(math.sin, x, 0.1) - 0.539402) < 1e-6
    hs = np.logspace(-4, -1, 13)                    # truncation-dominated range
    ef = [abs(forward(math.sin, x, h) - exact) for h in hs]
    ec = [abs(central(math.sin, x, h) - exact) for h in hs]
    sf, sc = slope(hs, ef), slope(hs, ec)
    print(f"log-log slopes: forward {sf:.3f}, central {sc:.3f}")
    assert abs(sf - 1) < 0.05 and abs(sc - 2) < 0.05
    hs_all = np.logspace(-15, 0, 151)
    best_f = hs_all[np.argmin([abs(forward(math.sin, x, h) - exact) for h in hs_all])]
    best_c = hs_all[np.argmin([abs(central(math.sin, x, h) - exact) for h in hs_all])]
    print(f"best h: forward {best_f:.1e}, central {best_c:.1e}")
    assert 1e-10 < best_f < 1e-6 and 1e-7 < best_c < 1e-4
