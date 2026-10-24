import numpy as np

def rk4(f, x0, T, dt):
    x = np.array(x0, float); out = [x]
    for _ in range(int(round(T / dt))):
        k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x)
    return np.array(out)

def mechanical(m, c, k, F):
    return lambda s: np.array([s[1], (F - c * s[1] - k * s[0]) / m])                 # [x, v]

def series_rlc(L, R, C, V):
    return lambda s: np.array([s[1], (V - R * s[1] - s[0] / C) / L])                 # [q, i]

def parallel_rlc(C, R, L, I):
    """node voltage u and inductor current iL: C du/dt = I - u/R - iL, L diL/dt = u"""
    return lambda s: np.array([(I - s[0] / R - s[1]) / C, s[0] / L])                 # [u, iL]

def test_force_voltage():
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    Q = rk4(series_rlc(m, c, 1 / k, F), [0, 0], 10, 1e-3)
    assert np.max(np.abs(X - Q)) < 1e-12                  # identical, step for step
    zeta = c / (2 * np.sqrt(k * m)); os = np.exp(-np.pi * zeta / np.sqrt(1 - zeta ** 2))
    peak = X[:, 0].max()
    print(f"x peak {peak:.4f} m vs predicted {0.2 * (1 + os):.4f} m (overshoot {os * 100:.1f} %)")
    assert abs(peak - 0.2 * (1 + os)) < 1e-4

def test_force_current():
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    U = rk4(parallel_rlc(m, 1 / c, 1 / k, F), [0, 0], 10, 1e-3)
    assert np.max(np.abs(U[:, 0] - X[:, 1])) < 1e-12      # node voltage = velocity
    assert np.max(np.abs(U[:, 1] - k * X[:, 0])) < 1e-9   # inductor current = spring force
    print("force-current twin: node voltage equals velocity, inductor current equals spring force")

def test_scaled():
    """q(t') = alpha * x(t'/b): charge scaled by alpha, time by b, same 10 V source"""
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    alpha, b = 1e-3, 1e-3                                 # practical parts, 1000x faster
    L, R, C = m * b ** 2 / alpha, c * b / alpha, alpha / k
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    Q = rk4(series_rlc(L, R, C, F), [0, 0], 10 * b, 1e-3 * b)
    q_as_x = Q[:, 0] / alpha
    assert np.max(np.abs(q_as_x - X[:, 0])) < 1e-9
    print(f"scaled circuit: L = {L:.3g} H, R = {R:.3g} ohm, C = {C * 1e6:.3g} uF, same curve in 1/1000 of the time")

test_force_voltage()
test_force_current()
test_scaled()
print("PASS")
