import numpy as np
from scipy import signal

def polyphase_decimate(x, h, M):
    h = np.concatenate([h, np.zeros((-len(h)) % M)])           # pad to a multiple of M
    K = len(h) // M
    n_out = len(x) // M
    y = np.zeros(n_out)
    xp = np.concatenate([np.zeros(len(h)), x])                   # history for the start
    for p in range(M):
        hp = h[p::M]                                             # p-th polyphase component
        # branch input: x[mM - p] for m = 0..n_out-1 (offset by the padding)
        xb = xp[len(h) - p: len(h) - p + n_out * M: M]
        hist = xp[len(h) - p - (K - 1) * M: len(h) - p: M][:K - 1] if K > 1 else np.array([])
        y += np.convolve(np.concatenate([hist, xb]), hp, mode="valid")[:n_out]
    return y

if __name__ == "__main__":
    fs, M = 8000.0, 8
    beta = 0.1102 * (60 - 8.7)
    n_taps = int(np.ceil(52 / (2.285 * 2 * np.pi * 0.025) + 1)) | 1
    h = signal.firwin(n_taps, 500, window=("kaiser", beta), fs=fs)
    print("taps:", n_taps)
    rng = np.random.default_rng(12)
    x = rng.standard_normal(8000)
    y_ref = signal.lfilter(h, 1, x)[::M]
    y = polyphase_decimate(x, h, M)
    assert np.allclose(y, y_ref, atol=1e-12)
    # alias check: tones that would fold into 0-400 Hz are attenuated by more than 60 dB
    t = np.arange(80_000) / fs
    worst = -np.inf
    for f in (600, 900, 1700, 2600, 3900):
        tone = np.sin(2 * np.pi * f * t)
        out = polyphase_decimate(tone, h, M)[2000:]
        worst = max(worst, 20 * np.log10(np.abs(out).max()))
    inband = polyphase_decimate(np.sin(2 * np.pi * 300 * t), h, M)[2000:]
    print(f"worst aliased level {worst:.1f} dB, 300 Hz passes at {20*np.log10(np.abs(inband).max()):.2f} dB")
    assert worst < -60 and abs(20 * np.log10(np.abs(inband).max())) < 0.1
    # without the filter, 1.7 kHz folds onto 300 Hz at full amplitude
    folded = np.sin(2 * np.pi * 1700 * t)[::M]
    spec = np.abs(np.fft.rfft(folded[:1000])) / 500
    assert abs(np.argmax(spec) - 300) <= 1 and spec.max() > 0.9
