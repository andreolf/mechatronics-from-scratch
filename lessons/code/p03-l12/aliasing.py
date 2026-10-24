import numpy as np

def alias(f, fs):
    return abs(f - round(f / fs) * fs)

def apparent_frequency(f, fs, N=4096):
    """Sample a cosine and find the strongest FFT bin."""
    n = np.arange(N)
    x = np.cos(2 * np.pi * f * n / fs + 0.3)
    X = np.abs(np.fft.rfft(x * np.hanning(N)))
    return np.fft.rfftfreq(N, 1 / fs)[np.argmax(X)]

def wheel_apparent_rev_s(rev_s, fps):
    """Signed apparent rotation rate, folded into (-fps/2, fps/2]."""
    r = rev_s - round(rev_s / fps) * fps
    return r if r > -fps / 2 else r + fps

if __name__ == "__main__":
    fs = 1000
    for f in (100, 450, 900, 1200, 1990, 2600):
        meas = apparent_frequency(f, fs)
        assert abs(meas - alias(f, fs)) <= fs / 4096, (f, meas)
    assert alias(1200, 1000) == 200 and alias(9, 10) == 1
    assert wheel_apparent_rev_s(23.5, 24) == -0.5 and wheel_apparent_rev_s(24.5, 24) == 0.5
    assert wheel_apparent_rev_s(23, 24) == -1
    # samples of 9 Hz and 1 Hz cosines at 10 Hz are identical
    n = np.arange(50)
    assert np.allclose(np.cos(2 * np.pi * 9 * n / 10), np.cos(2 * np.pi * 1 * n / 10))
    print("1200 Hz vibration at 1 kHz sampling appears at", alias(1200, 1000), "Hz")
