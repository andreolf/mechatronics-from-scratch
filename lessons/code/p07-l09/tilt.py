import numpy as np

rng = np.random.default_rng(9)

def Rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def Ry(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def specific_force(roll, pitch, accel_world=(0.0, 0.0, 0.0)):
    """Accelerometer reading in g for roll and nose-up pitch (rad). World frame: x forward, z up."""
    f_world = np.array(accel_world) + np.array([0, 0, 1.0])      # a - g, with g = (0, 0, -1) g
    return Rx(-roll) @ Ry(pitch) @ f_world                         # world -> body

def tilt(ax, ay, az):
    return np.degrees(np.arctan2(ay, az)), np.degrees(np.arctan2(ax, np.hypot(ay, az)))

if __name__ == "__main__":
    for roll, pitch in [(0, 20), (30, -10), (-60, 45), (170, 5)]:
        assert roll != 0 or abs(specific_force(0, np.radians(pitch))[0] - np.sin(np.radians(pitch))) < 1e-12
        f = specific_force(np.radians(roll), np.radians(pitch))
        r_est, p_est = tilt(*f)
        assert abs(r_est - roll) < 1e-9 and abs(p_est - pitch) < 1e-9, (roll, pitch, r_est, p_est)
    # noisy, vibrating, static board at roll 12, pitch -7: average 0.1 s at 1 kHz
    fs, n = 1000, 100
    t = np.arange(n) / fs
    f = specific_force(np.radians(12), np.radians(-7))
    vib = 0.5 * np.sin(2 * np.pi * 50 * t)
    samples = f[:, None] + 0.02 * rng.standard_normal((3, n)) + np.array([0.0, 0.3, 1.0])[:, None] * vib
    r1, p1 = tilt(*samples[:, 0])
    r, p = tilt(*samples.mean(axis=1))
    print(f"single sample: roll {r1:.1f}, pitch {p1:.1f}; averaged: roll {r:.2f}, pitch {p:.2f} (true 12, -7)")
    assert abs(r - 12) < 1 and abs(p + 7) < 1
    # sustained forward acceleration of 0.1 g while level reads as false pitch
    f = specific_force(0.0, 0.0, accel_world=(0.1, 0, 0))
    false_pitch = abs(tilt(*f)[1])
    assert abs(false_pitch - np.degrees(np.arctan(0.1))) < 1e-9
    print(f"0.1 g forward acceleration looks like {false_pitch:.2f} deg of pitch")
