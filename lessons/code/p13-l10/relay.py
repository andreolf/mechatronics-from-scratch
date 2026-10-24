import numpy as np
from scipy.optimize import brentq

def plant_lag3():
    A = np.array([[-1.0, 0, 0], [1, -1, 0], [0, 1, -1]]); B = np.array([1.0, 0, 0]); C = np.array([0, 0, 1.0])
    return A, B, C, 0.0, lambda w: 1 / (1j * w + 1) ** 3

def plant_fopdt():
    A = np.array([[-0.5]]); B = np.array([0.5]); C = np.array([1.0])        # 1/(2s + 1), then 0.5 s dead time
    return A, B, C, 0.5, lambda w: np.exp(-0.5j * w) / (2j * w + 1)

def exact_ultimate(G):
    ph = lambda w: np.unwrap([np.angle(G(x)) for x in np.linspace(1e-3, w, 400)])[-1] + np.pi
    wu = brentq(ph, 0.1, 20)
    return 1 / abs(G(wu)), 2 * np.pi / wu

def relay_test(plant, d=1.0, hyst=0.0, T=60.0, dt=1e-3, noise=0.0, seed=0):
    A, B, C, delay, _ = plant
    x = np.zeros(len(B)); nd = int(round(delay / dt)); buf = [0.0] * (nd + 1)
    u = d; ys, us = [], []; rng = np.random.default_rng(seed)
    f = lambda x, u: A @ x + B * u
    for _ in range(int(T / dt)):
        y = C @ x + noise * rng.normal()
        e = -y                                             # setpoint 0, relay acts on the error
        if e > hyst: u = d
        elif e < -hyst: u = -d
        buf.append(u); ud = buf.pop(0)
        k1 = f(x, ud); k2 = f(x + dt / 2 * k1, ud); k3 = f(x + dt / 2 * k2, ud); k4 = f(x + dt * k3, ud)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ys.append(C @ x); us.append(u)
    ys = np.array(ys[len(ys) // 2:])                        # discard the start-up transient
    up = np.where((ys[:-1] < 0) & (ys[1:] >= 0))[0]
    Pu = np.mean(np.diff(up)) * dt
    seg = ys[up[0]:up[-1]]                                 # whole periods only
    tt = np.arange(len(seg)) * dt
    a1 = 2 * abs(np.mean(seg * np.exp(-2j * np.pi * tt / Pu)))   # amplitude of the fundamental
    a_peak = (ys.max() - ys.min()) / 2
    return 4 * d / (np.pi * a1), Pu, 4 * d / (np.pi * a_peak)

def test_relay_estimates_within_10_percent():
    for name, plant in (("1/(s+1)^3", plant_lag3()), ("e^-0.5s/(2s+1)", plant_fopdt())):
        Ku, Pu = exact_ultimate(plant[4])
        Ku_r, Pu_r, Ku_peak = relay_test(plant)
        print(f"{name:15s}: exact Ku {Ku:.3f}, Pu {Pu:.3f} s | relay Ku {Ku_r:.3f} ({Ku_r / Ku - 1:+.1%}), Pu {Pu_r:.3f} s ({Pu_r / Pu - 1:+.1%}) | from the peak instead: {Ku_peak:.3f} ({Ku_peak / Ku - 1:+.1%})")
        assert abs(Ku_r / Ku - 1) < 0.10 and abs(Pu_r / Pu - 1) < 0.10

def test_worked_example_exact():
    Ku, Pu = exact_ultimate(plant_lag3()[4])
    assert abs(Ku - 8) < 1e-6 and abs(Pu - 2 * np.pi / np.sqrt(3)) < 1e-6

def test_noise_with_hysteresis():
    Ku, Pu = exact_ultimate(plant_lag3()[4])
    Ku_r, Pu_r, _ = relay_test(plant_lag3(), hyst=0.02, noise=0.005)
    assert abs(Ku_r / Ku - 1) < 0.15 and abs(Pu_r / Pu - 1) < 0.15

def test_zn_pid_stable():
    Ku, Pu = 8.0, 2 * np.pi / np.sqrt(3)
    Kp, Ti, Td = 0.6 * Ku, Pu / 2, Pu / 8
    # closed loop with C = Kp(1 + 1/(Ti s) + Td s) and G = 1/(s + 1)^3: s(s+1)^3 + Kp(Td s^2 + s + 1/Ti) = 0
    cl = np.polyadd(np.polymul([1, 0], np.poly([-1, -1, -1])), Kp * np.array([Td, 1, 1 / Ti]))
    assert np.all(np.roots(cl).real < 0)

test_worked_example_exact()
test_relay_estimates_within_10_percent()
test_noise_with_hysteresis()
test_zn_pid_stable()
print("PASS")
