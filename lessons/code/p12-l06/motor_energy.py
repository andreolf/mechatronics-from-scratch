import numpy as np

R, L, k, Jm, b = 0.8, 1e-3, 0.05, 2e-5, 1e-5
JL, N, tau_load, V = 0.01, 20.0, 1.5, 24.0
Jeq = Jm + JL / N ** 2

def f(s):
    i, w, _ = s
    di = (V - R * i - k * w) / L
    dw = (k * i - b * w - tau_load / N) / Jeq
    return np.array([di, dw, w / N])                # last state: load angle

def simulate(T=0.5, dt=1e-5):
    n = int(round(T / dt)); s = np.zeros(3); S = np.empty((n + 1, 3)); S[0] = s
    for j in range(n):
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); S[j + 1] = s
    return np.arange(n + 1) * dt, S

def trapz(y, t):
    return float(np.sum((y[1:] + y[:-1]) * np.diff(t)) / 2)

def test_kt_equals_ke():
    # power through the conversion: e*i must equal tau*w at every instant
    t, S = simulate(0.05)
    i, w = S[:, 0], S[:, 1]
    assert np.max(np.abs((k * w) * i - (k * i) * w)) < 1e-9
    v_per_krpm = 0.05 * 1000 * 2 * np.pi / 60
    print(f"k = 0.05 N*m/A = 0.05 V*s/rad = {v_per_krpm:.3f} V/krpm")
    assert abs(v_per_krpm - 5.236) < 1e-3

def test_energy_balance():
    t, S = simulate()
    i, w = S[:, 0], S[:, 1]
    supplied = trapz(V * i, t)
    copper = trapz(R * i ** 2, t)
    friction = trapz(b * w ** 2, t)
    stored = 0.5 * L * i[-1] ** 2 + 0.5 * Jeq * w[-1] ** 2
    work = tau_load * S[-1, 2]                       # torque times drum angle
    accounted = copper + friction + stored + work
    err = abs(supplied - accounted) / supplied
    print(f"supplied {supplied:.3f} J = copper {copper:.3f} + friction {friction:.4f} + stored {stored:.3f} + lifting {work:.3f} J; error {err * 100:.4f} %")
    assert err < 0.01

def test_steady_state():
    t, S = simulate()
    tau = tau_load / N
    w_ss = (k * V - R * tau) / (k ** 2 + R * b)
    print(f"steady motor speed {S[-1, 1]:.1f} rad/s (formula {w_ss:.1f}); drum {S[-1, 1] / N:.2f} rad/s; current {S[-1, 0]:.3f} A")
    assert abs(S[-1, 1] - w_ss) / w_ss < 1e-3
    assert abs(Jeq - 4.5e-5) < 1e-12

test_kt_equals_ke()
test_energy_balance()
test_steady_state()
print("PASS")
