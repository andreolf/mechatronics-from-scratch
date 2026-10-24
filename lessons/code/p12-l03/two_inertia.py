import numpy as np
from scipy.linalg import expm

Jm, JL, k, c = 1e-4, 4e-4, 50.0, 2e-3

# state x = [theta_m, theta_L, w_m, w_L], input = motor torque
A = np.array([[0, 0, 1, 0],
              [0, 0, 0, 1],
              [-k / Jm, k / Jm, -c / Jm, c / Jm],
              [k / JL, -k / JL, c / JL, -c / JL]])
B = np.array([0, 0, 1 / Jm, 0.0])

def predicted():
    wa = np.sqrt(k / JL)
    wr = np.sqrt(k * (1 / Jm + 1 / JL))
    return wa / (2 * np.pi), wr / (2 * np.pi)

def speed_amplitude(f_hz, dt=2e-5, settle=0.5, periods=10):
    """drive with a 1 mN*m sine torque, let transients die, then fit the motor-speed sine"""
    Ad = expm(A * dt)
    w = 2 * np.pi * f_hz
    n_settle = int(settle / dt); n_meas = int(periods / f_hz / dt)
    x = np.zeros(4); ts, ys = [], []
    for i in range(n_settle + n_meas):
        t = i * dt
        x = Ad @ x + dt * B * 1e-3 * np.sin(w * (t + dt / 2))     # midpoint input, exact plant
        if i >= n_settle:
            ts.append(t + dt); ys.append(x[2])
    ts, ys = np.array(ts), np.array(ys)
    M = np.column_stack([np.sin(w * ts), np.cos(w * ts), np.ones_like(ts)])
    a, b, _ = np.linalg.lstsq(M, ys, rcond=None)[0]
    return np.hypot(a, b)

def extremum(lo, hi, kind, n=25):
    fs = np.linspace(lo, hi, n)
    amps = [speed_amplitude(f) for f in fs]
    i = int(np.argmax(amps) if kind == "max" else np.argmin(amps))
    return fs[i], fs

def test_resonances():
    fa, fr = predicted()
    coarse = np.geomspace(30, 200, 25)
    amps = [speed_amplitude(f) for f in coarse]
    ip = int(np.argmax(amps)); ia = int(np.argmin(amps[:ip]))
    peak, _ = extremum(coarse[ip - 1], coarse[ip + 1], "max")
    notch, _ = extremum(coarse[ia - 1], coarse[ia + 1], "min")
    print(f"predicted anti-resonance {fa:.1f} Hz, resonance {fr:.1f} Hz; simulated dip {notch:.1f} Hz, peak {peak:.1f} Hz")
    assert abs(peak - fr) / fr < 0.01 and abs(notch - fa) / fa < 0.01

def test_eigenvalues():
    ev = np.linalg.eigvals(A)
    osc = sorted(abs(e.imag) for e in ev if abs(e.imag) > 1)
    assert abs(osc[0] / (2 * np.pi) - predicted()[1]) < 0.05    # the pole pair is the resonance
    assert sum(abs(e) < 1e-6 for e in ev) == 2                   # rigid-body rotation: a double pole at 0 (angle and speed)

def test_shaft_formula():
    G, d, l = 79e9, 0.006, 0.2                    # steel, 6 mm, 200 mm
    kshaft = G * np.pi * d ** 4 / 32 / l
    print(f"a 6 mm steel shaft 200 mm long: k = {kshaft:.1f} N*m/rad")
    assert 49 < kshaft < 51                       # the lesson's k

test_resonances()
test_eigenvalues()
test_shaft_formula()
print("PASS")
