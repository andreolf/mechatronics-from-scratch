import math
import numpy as np

G_L, C = 9.81, 0.5
f = lambda x: np.array([x[1], -G_L * math.sin(x[0]) - C * x[1]])
jac = lambda x: np.array([[0.0, 1.0], [-G_L * math.cos(x[0]), -C]])

def find_equilibria(f, jac, starts, tol=1e-12):
    found = []
    for x in starts:
        x = np.array(x, float)
        for _ in range(50):
            dx = np.linalg.solve(jac(x), -f(x)); x += dx
            if np.abs(dx).max() < tol: break
        if np.abs(f(x)).max() < 1e-10 and not any(np.allclose(x, y, atol=1e-6) for y in found):
            found.append(x)
    return sorted(found, key=lambda v: v[0])

def classify(J):
    lam = np.linalg.eigvals(J)
    if np.all(abs(lam.imag) > 1e-12):
        return ("stable focus" if lam.real.max() < 0 else "unstable focus" if lam.real.min() > 0 else "centre"), lam
    re = np.sort(lam.real)
    return ("stable node" if re[1] < 0 else "unstable node" if re[0] > 0 else "saddle"), lam

if __name__ == "__main__":
    starts = [(a, w) for a in np.linspace(-7, 7, 29) for w in (-1.0, 0.0, 1.0)]
    eq = find_equilibria(f, jac, starts)
    eq = [e for e in eq if -7 <= e[0] <= 7]
    angles = [round(e[0] / math.pi) for e in eq]
    assert angles == [-2, -1, 0, 1, 2] and all(abs(e[0] - k * math.pi) < 1e-9 for e, k in zip(eq, angles))
    for e, k in zip(eq, angles):
        kind, lam = classify(jac(e))
        print(f"θ* = {k:+d}π: {kind}, λ = {np.round(lam, 3)}")
        assert kind == ("stable focus" if k % 2 == 0 else "saddle")
    _, lam = classify(jac([0, 0])); assert np.allclose(sorted(lam.imag), [-3.1222, 3.1222], atol=1e-4)
    _, lam = classify(jac([math.pi, 0])); assert np.allclose(sorted(lam.real), [-3.392, 2.892], atol=1e-3)
