import numpy as np

def full_step():
    return np.array([(1, 1), (-1, 1), (-1, -1), (1, -1)], float)

def half_step(compensated=False):
    s = []
    for k in range(8):
        a = k * np.pi / 4
        v = np.array([np.cos(a), np.sin(a)])
        v = np.where(np.abs(v) < 1e-9, 0, np.sign(v))
        if compensated and np.all(v != 0):
            v = v / np.sqrt(2)
        s.append(v)
    return np.array(s)

def microstep(m, amp=127):
    th = np.arange(4 * m) * (np.pi / 2) / m
    return np.round(amp * np.stack([np.cos(th), np.sin(th)], 1))   # integer DAC codes

def shaft_angle_deg(table, Nr=50):
    return np.degrees(np.unwrap(np.arctan2(table[:, 1], table[:, 0]))) / Nr

if __name__ == "__main__":
    mag = lambda t: np.hypot(t[:, 0], t[:, 1])
    assert np.allclose(mag(full_step()), np.sqrt(2))
    h = mag(half_step())
    print("half-step magnitudes:", np.round(h, 3))
    assert abs(h.max() / h.min() - np.sqrt(2)) < 1e-12
    assert np.allclose(mag(half_step(compensated=True)), 1)
    t = microstep(16)
    m = mag(t)
    print(f"1/16 microstep, 8-bit: magnitude {m.min():.2f}..{m.max():.2f} (ideal 127)")
    assert np.max(np.abs(m - 127)) / 127 < 0.01                # constant within 1 %
    assert tuple(t[3]) == (122.0, 37.0)
    ang = shaft_angle_deg(t)
    steps = np.diff(ang)
    assert abs(np.mean(steps) - 1.8 / 16) < 1e-3 and np.max(np.abs(steps - 1.8 / 16)) < 0.01   # rounding wobble < 0.01 deg
    # 4 full steps per electrical cycle -> 1.8 degrees each with 50 teeth
    assert abs(np.diff(shaft_angle_deg(full_step()))[0] - 1.8) < 1e-12
