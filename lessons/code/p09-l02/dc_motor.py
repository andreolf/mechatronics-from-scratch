import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.6e-3, 0.02, 3e-6, 2e-6

def deriv(x, V, TL):
    i, w = x
    return np.array([(V - R * i - k * w) / L, (k * i - b * w - TL) / J])

def simulate(V, TL, T=0.08, dt=5e-6):
    x = np.zeros(2); out = [x.copy()]
    for _ in range(int(round(T / dt))):          # classic RK4
        k1 = deriv(x, V, TL); k2 = deriv(x + dt / 2 * k1, V, TL)
        k3 = deriv(x + dt / 2 * k2, V, TL); k4 = deriv(x + dt * k3, V, TL)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x.copy())
    return np.arange(len(out)) * dt, np.array(out)

def steady_speed(V, TL):
    return (k * V - R * TL) / (k * k + R * b)

if __name__ == "__main__":
    for TL in (0.0, 0.05):
        t, x = simulate(12.0, TL)
        print(f"T_L = {TL}: simulated {x[-1, 1]:.2f} rad/s, formula {steady_speed(12.0, TL):.2f} rad/s")
        assert abs(x[-1, 1] - steady_speed(12.0, TL)) < 1e-3 * steady_speed(12.0, TL)
    # inrush current approaches V/R, because there is no back-EMF at standstill
    t, x = simulate(12.0, 0.0, T=0.002)
    assert 0.8 * 10 < x[:, 0].max() < 10
    # mechanical time constant: 63 % of final speed after about tau_m (plus a little electrical lag)
    t, x = simulate(12.0, 0.0)
    tau_m = J * R / (k * k + R * b)
    t63 = t[np.argmax(x[:, 1] >= 0.632 * x[-1, 1])]
    assert abs(t63 - tau_m) < 0.1 * tau_m
    # cross-check against the state-space model with SciPy
    sys = signal.StateSpace([[-R / L, -k / L], [k / J, -b / J]], [[1 / L], [0]], [[0, 1]], [[0]])
    ts = np.linspace(0, 0.08, 2001)
    _, y = signal.step(sys, T=ts)
    _, x = simulate(12.0, 0.0, T=0.08, dt=4e-5)
    assert np.max(np.abs(12 * y - x[:, 1])) < 0.5
