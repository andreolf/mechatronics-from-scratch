import math
import numpy as np

g, l, m = 9.81, 1.0, 0.2
def f(x, u):
    return np.array([x[1], -g / l * math.sin(x[0]) + u / (m * l * l)])

def linearise(f, x0, u0, h=1e-6):
    x0 = np.asarray(x0, float); n = len(x0)
    A = np.column_stack([(f(x0 + h * e, u0) - f(x0 - h * e, u0)) / (2 * h) for e in np.eye(n)])
    B = ((f(x0, u0 + h) - f(x0, u0 - h)) / (2 * h)).reshape(n, 1)
    return A, B

def rk4(fun, x, h):
    k1 = fun(x); k2 = fun(x + h/2*k1); k3 = fun(x + h/2*k2); k4 = fun(x + h*k3)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

if __name__ == "__main__":
    A_up, B = linearise(f, [math.pi, 0], 0.0)
    lam = np.sort(np.linalg.eigvals(A_up).real)
    assert np.allclose(lam, [-math.sqrt(g / l), math.sqrt(g / l)], atol=1e-6)
    assert np.allclose(B, [[0], [1 / (m * l * l)]], atol=1e-6)
    A_down, _ = linearise(f, [0, 0], 0.0)
    assert np.allclose(sorted(np.linalg.eigvals(A_down).imag), [-math.sqrt(g / l), math.sqrt(g / l)], atol=1e-6)
    # nonlinear vs linear model, starting 1° from upright
    x_nl = np.array([math.pi + math.radians(1), 0.0]); d_lin = np.array([math.radians(1), 0.0]); h = 1e-3
    for k in range(735):
        x_nl = rk4(lambda s: f(s, 0.0), x_nl, h)
        d_lin = rk4(lambda s: A_up @ s, d_lin, h)
    print(f"after 0.735 s: nonlinear {math.degrees(x_nl[0] - math.pi):.2f}°, linear {math.degrees(d_lin[0]):.2f}°")
    assert abs(math.degrees(d_lin[0]) - math.cosh(math.sqrt(g / l) * 0.735)) < 1e-6   # 1° · cosh(λt)
    assert abs(x_nl[0] - math.pi - d_lin[0]) < math.radians(0.2)
