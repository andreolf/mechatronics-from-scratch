import numpy as np

A, d, Cd, g = 1.0, 0.03, 0.6, 9.81
a = np.pi * d ** 2 / 4
q_pump = 0.002                                        # m^3/s

def q_out(h):
    return Cd * a * np.sqrt(2 * g * max(h, 0.0))

def simulate(h0, pump_on, T, dt=0.5):
    h, t, H = h0, 0.0, [h0]
    def f(h):
        return ((q_pump if pump_on else 0.0) - q_out(h)) / A
    while t < T - 1e-12:
        k1 = f(h); k2 = f(h + dt / 2 * k1); k3 = f(h + dt / 2 * k2); k4 = f(h + dt * k3)
        h = max(h + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4), 0.0); t += dt; H.append(h)
    return np.array(H)

def h_steady():
    return (q_pump / (Cd * a)) ** 2 / (2 * g)

def t_empty(h0):
    return A / (Cd * a) * np.sqrt(2 * h0 / g)

def test_fill_to_flow_balance():
    H = simulate(0.0, True, 20000)
    print(f"filled level {H[-1]:.4f} m, flow balance predicts {h_steady():.4f} m")
    assert abs(H[-1] - h_steady()) / h_steady() < 1e-3
    assert abs(q_out(H[-1]) - q_pump) / q_pump < 1e-3

def test_drain_time():
    h0, dt = h_steady(), 0.5
    H = simulate(h0, False, 1.5 * t_empty(h0), dt)
    t_sim = np.argmax(H < 1e-4) * dt
    print(f"drain from {h0:.3f} m: simulated {t_sim:.0f} s, closed form {t_empty(h0):.0f} s")
    assert abs(t_sim - t_empty(h0)) / t_empty(h0) < 0.01
    # sqrt(h) falls linearly
    t = np.arange(len(H)) * dt
    mid = (t > 100) & (t < 800)
    slope = np.polyfit(t[mid], np.sqrt(H[mid]), 1)[0]
    assert abs(slope + Cd * a * np.sqrt(2 * g) / (2 * A)) < 1e-6

def test_quadratic_scaling():
    global q_pump
    q0 = q_pump; h1 = h_steady(); q_pump = 2 * q0; h2 = h_steady(); q_pump = q0
    assert abs(h2 / h1 - 4) < 1e-12
    print(f"double the pump flow: level {h1:.2f} m -> {h2:.2f} m")

test_fill_to_flow_balance()
test_drain_time()
test_quadratic_scaling()
print("PASS")
