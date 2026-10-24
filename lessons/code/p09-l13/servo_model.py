import numpy as np

DEG_PER_US = 180 / 1000

def pulse_train(width_us, periods=3, fs=1e6, period_us=20000):
    n = np.arange(int(periods * period_us * fs / 1e6))
    return ((n % period_us) < width_us).astype(np.uint8)

def measure_width(samples, fs=1e6):
    """Timer-capture style: count samples between a rising and the next falling edge."""
    d = np.diff(samples.astype(int))
    rise = np.flatnonzero(d == 1) + 1; fall = np.flatnonzero(d == -1) + 1
    if samples[0]:
        rise = np.r_[0, rise]
    widths = [f - r for r in rise for f in fall[fall > r][:1]]
    return np.median(widths) * 1e6 / fs

def servo(cmd_deg, start_deg=90.0, kp=40.0, w_max=500.0, deadband_us=4.0, T=0.4, dt=1e-4):
    th = start_deg; db = deadband_us / 2 * DEG_PER_US
    for _ in range(int(T / dt)):
        e = cmd_deg - th
        if abs(e) > db:
            th += dt * np.clip(kp * e, -w_max, w_max)       # saturated proportional drive
    return th

if __name__ == "__main__":
    rng = np.random.default_rng(13)
    worst = 0
    for width in rng.uniform(1000, 2000, 40):
        measured = measure_width(pulse_train(round(width)))
        assert abs(measured - round(width)) <= 1
        cmd = (measured - 1000) * DEG_PER_US
        ang = servo(cmd, start_deg=rng.uniform(0, 180))
        worst = max(worst, abs(ang - cmd))
    print(f"worst final error over 40 random commands: {worst:.3f} deg")
    assert worst < 2.0 and worst <= 2 * DEG_PER_US + 1e-9   # within the deadband
    assert abs((1350 - 1000) * DEG_PER_US - 63) < 1e-12
