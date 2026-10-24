import numpy as np
from scipy import signal

FS = 1000.0

def group_delay(b, a, f, df=1e-3):
    w = 2 * np.pi * np.array([f - df, f + df]) / FS
    _, H = signal.freqz(b, a, worN=w)
    dphi = np.angle(H[1] / H[0])                    # unwrap-free difference
    return -dphi / (w[1] - w[0])                    # in samples

def burst_delay(b, a, f0, width=60):
    """Delay of the envelope peak of a Gaussian tone burst through the filter, in samples."""
    n = np.arange(2000)
    env = np.exp(-0.5 * ((n - 600) / width) ** 2)
    x = env * np.sin(2 * np.pi * f0 * n / FS)
    y = signal.lfilter(b, a, x)
    env_out = np.abs(signal.hilbert(y))
    num = np.sum(env_out * n) / np.sum(env_out)
    return num - 600

if __name__ == "__main__":
    b, a = signal.butter(4, 50, fs=FS)
    gd = group_delay(b, a, 20)
    gd_ref = signal.group_delay((b, a), w=[20], fs=FS)[1][0]
    assert abs(gd - gd_ref) < 1e-3 and abs(gd - 8.936) < 0.01
    meas = burst_delay(b, a, 20)
    print(f"Butterworth 4 @ 50 Hz: group delay at 20 Hz {gd:.2f} samples, burst envelope delayed {meas:.2f}")
    assert abs(meas - gd) < 0.5
    _, H = signal.freqz(b, a, worN=[20], fs=FS)
    lag = -np.degrees(np.angle(H[0]))
    assert abs(lag - 60.92) < 0.01
    _, H200 = signal.freqz(*signal.butter(4, 200, fs=FS), worN=[20], fs=FS)
    assert -np.degrees(np.angle(H200[0])) < 16
    h = signal.firwin(31, 50, fs=FS)
    for f in (5, 20, 40):
        assert abs(group_delay(h, [1.0], f) - 15) < 1e-6          # linear phase: constant
    print(f"phase lag at 20 Hz: Butterworth {lag:.1f} deg, 31-tap FIR {360*20*15/FS:.0f} deg")
