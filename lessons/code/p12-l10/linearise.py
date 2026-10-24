import numpy as np
import sympy as sp

At, kappa = 1.0, 0.6 * np.pi * 0.03 ** 2 / 4 * np.sqrt(2 * 9.81)

def tank(x, u):
    return np.array([(u[0] - kappa * np.sqrt(max(x[0], 0.0))) / At])

def jacobians(f, x0, u0):
    x0, u0 = np.array(x0, float), np.array(u0, float)
    fx = lambda x: f(x, u0); fu = lambda u: f(x0, u)
    def jac(g, z):
        cols = []
        for j in range(len(z)):
            e = np.zeros(len(z)); eps = 1e-6 * max(1.0, abs(z[j])); e[j] = eps
            cols.append((g(z + e) - g(z - e)) / (2 * eps))
        return np.column_stack(cols)
    return jac(fx, x0), jac(fu, u0)

def simulate(f, x0, u, T, dt):
    x = np.array(x0, float); out = [x.copy()]
    for _ in range(int(round(T / dt))):
        k1 = f(x, u); k2 = f(x + dt / 2 * k1, u); k3 = f(x + dt / 2 * k2, u); k4 = f(x + dt * k3, u)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x.copy())
    return np.array(out)

q0 = 0.002
h0 = (q0 / kappa) ** 2

def test_jacobian_matches_hand():
    A, B = jacobians(tank, [h0], [q0])
    assert abs(f_eq := tank([h0], [q0])[0]) < 1e-15
    hand = -q0 / (2 * At * h0)
    print(f"h0 = {h0:.4f} m; numerical A = {A[0, 0]:.6e}, hand {hand:.6e}; B = {B[0, 0]:.6f}")
    assert abs(A[0, 0] - hand) / abs(hand) < 1e-7 and abs(B[0, 0] - 1 / At) < 1e-7
    # and against SymPy's exact derivative
    h, u = sp.symbols("h u", positive=True)
    dfdh = sp.diff((u - sp.Float(kappa) * sp.sqrt(h)) / At, h).subs({h: h0, u: q0})
    assert abs(float(dfdh) - A[0, 0]) < 1e-12

def test_error_grows_quadratically():
    A, B = jacobians(tank, [h0], [q0])
    lin = lambda x, u: A @ (x - np.array([h0])) + B @ (u - np.array([q0]))
    errs = []
    for frac in (0.02, 0.04, 0.08, 0.16):
        u = np.array([q0 * (1 + frac)])
        hn = simulate(tank, [h0], u, 8000, 4.0)[:, 0]
        hl = simulate(lin, [h0], u, 8000, 4.0)[:, 0]
        dev = hn[-1] - h0
        errs.append(np.max(np.abs(hn - hl)) / abs(dev))
        print(f"inflow +{frac * 100:4.0f} %: level change {dev * 100:6.2f} cm, linear model error {errs[-1] * 100:5.2f} % of it")
    assert errs[0] < 0.02                       # small near the operating point
    ratios = [errs[i + 1] / errs[i] for i in range(3)]
    assert all(1.8 < r < 2.2 for r in ratios)   # relative error ~ step, so absolute error ~ step^2

def test_pendulum():
    g, l = 9.81, 0.5
    f = lambda x, u: np.array([x[1], -g / l * np.sin(x[0]) + u[0]])
    A_down, _ = jacobians(f, [0.0, 0.0], [0.0])
    A_up, _ = jacobians(f, [np.pi, 0.0], [0.0])
    ev_down, ev_up = np.linalg.eigvals(A_down), np.linalg.eigvals(A_up)
    print(f"pendulum eigenvalues hanging {np.round(ev_down, 3)}, inverted {np.round(ev_up, 3)}")
    assert np.allclose(sorted(ev_down.imag), [-np.sqrt(g / l), np.sqrt(g / l)], atol=1e-6)
    assert np.isclose(max(ev_up.real), np.sqrt(g / l), atol=1e-6)

test_jacobian_matches_hand()
test_error_grows_quadratically()
test_pendulum()
print("PASS")
