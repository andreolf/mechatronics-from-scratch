import numpy as np

Ch, Cw, Cb = 50.0, 0.3 * 4186.0, 190.0       # J/K
Rhw, Rwb, Rba = 0.05, 0.1, 0.5               # K/W
P, Ta = 150.0, 20.0

def full(t, T):
    Th, Tw, Tb = T
    return np.array([(P - (Th - Tw) / Rhw) / Ch,
                     ((Th - Tw) / Rhw - (Tw - Tb) / Rwb) / Cw,
                     ((Tw - Tb) / Rwb - (Tb - Ta) / Rba) / Cb])

def two_node(t, T):                           # heater merged into the water
    Tw, Tb = T
    return np.array([(P - (Tw - Tb) / Rwb) / (Ch + Cw),
                     ((Tw - Tb) / Rwb - (Tb - Ta) / Rba) / Cb])

def one_node(t, T):                           # everything in one lump behind Rwb + Rba
    return np.array([(P - (T[0] - Ta) / (Rwb + Rba)) / (Ch + Cw + Cb)])

def rk4(f, x0, t_end, dt):
    n = int(round(t_end / dt))
    xs, x = [np.array(x0, float)], np.array(x0, float)
    for k in range(n):
        t = k * dt
        k1 = f(t, x); k2 = f(t + dt / 2, x + dt / 2 * k1); k3 = f(t + dt / 2, x + dt / 2 * k2); k4 = f(t + dt, x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        xs.append(x)
    return np.arange(n + 1) * dt, np.array(xs)

def test_steady_state():
    t, X = rk4(full, [Ta] * 3, 20000, 0.5)
    assert abs(X[-1, 1] - (Ta + P * (Rwb + Rba))) < 0.01      # water -> 110 C
    assert abs(X[-1, 2] - (Ta + P * Rba)) < 0.01              # body -> 95 C
    assert abs(X[-1, 0] - (Ta + P * (Rhw + Rwb + Rba))) < 0.01

def test_reduced_within_5_percent():
    t_end, dt = 3 * 898.0, 0.5                  # dt well below the 2.5 s heater time constant
    t, X3 = rk4(full, [Ta] * 3, t_end, dt)
    _, X2 = rk4(two_node, [Ta] * 2, t_end, dt)
    _, X1 = rk4(one_node, [Ta], t_end, dt)
    rise = P * (Rwb + Rba)
    e2 = np.max(np.abs(X2[:, 0] - X3[:, 1])) / rise
    e1 = np.max(np.abs(X1[:, 0] - X3[:, 1])) / rise
    print(f"worst water-temperature error over 3 tau: 2-node {e2 * 100:.2f} %, 1-node {e1 * 100:.2f} % of the 90 K rise")
    assert e1 < 0.05 and e2 < e1
    k600 = int(600 / dt)
    print(f"after 10 min: full {X3[k600, 1]:.1f} C, 1-node {X1[k600, 0]:.1f} C (hand: 63.9 C)")
    assert abs(X1[k600, 0] - (Ta + rise * (1 - np.exp(-600 / 897.6)))) < 0.01

def test_time_scales():
    A = np.array([[-1 / (Rhw * Ch), 1 / (Rhw * Ch), 0],
                  [1 / (Rhw * Cw), -(1 / Rhw + 1 / Rwb) / Cw, 1 / (Rwb * Cw)],
                  [0, 1 / (Rwb * Cb), -(1 / Rwb + 1 / Rba) / Cb]])
    taus = sorted(-1 / np.linalg.eigvals(A).real)
    print("time constants of the full model (s):", ", ".join(f"{x:.1f}" for x in taus))
    assert taus[-1] > 30 * taus[-2]             # one slow mode, well separated
    assert abs(taus[-1] - 898) / 898 < 0.05

test_steady_state()
test_reduced_within_5_percent()
test_time_scales()
print("PASS")
