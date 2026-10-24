import math
import numpy as np

def rk4_step(f, t, x, u, h):
    k1 = f(t, x, u)
    k2 = f(t + h / 2, x + h / 2 * k1, u)
    k3 = f(t + h / 2, x + h / 2 * k2, u)
    k4 = f(t + h, x + h * k3, u)
    return x + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

def pendulum(t, x, u, g=9.81, l=1.0):
    return np.array([x[1], -g / l * math.sin(x[0]) + u])

def run(h, t_end=4.0, x0=(1.0, 0.0)):
    """Return θ every 0.1 s, so the error is measured along the whole trajectory."""
    x, out, every = np.array(x0), [], round(0.1 / h)
    for k in range(round(t_end / h)):
        x = rk4_step(pendulum, k * h, x, 0.0, h)
        if (k + 1) % every == 0: out.append(x[0])
    return np.array(out)

if __name__ == "__main__":
    x1 = rk4_step(lambda t, x, u: x, 0.0, np.array([1.0]), 0.0, 0.1)[0]
    assert abs(x1 - 1.10517083) < 1e-8 and abs(x1 - math.exp(0.1) - (-8.5e-8)) < 1e-9
    ref = run(5e-5)                                # 57° swing, so sin θ ≠ θ
    hs = np.array([0.02, 0.01, 0.005, 0.0025])
    errs = np.array([abs(run(h) - ref).max() for h in hs])
    slope = np.polyfit(np.log(hs), np.log(errs), 1)[0]
    print("errors:", errs, f"slope {slope:.3f}")
    assert abs(slope - 4) < 0.1
