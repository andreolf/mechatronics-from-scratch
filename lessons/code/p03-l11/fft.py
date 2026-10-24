import numpy as np

def fft_recursive(x):
    x = np.asarray(x, complex)
    N = len(x)
    if N == 1:
        return x
    E, O = fft_recursive(x[0::2]), fft_recursive(x[1::2])
    w = np.exp(-2j * np.pi * np.arange(N // 2) / N) * O
    return np.concatenate([E + w, E - w])

def fft_iterative(x):
    """In-place radix-2 FFT with bit reversal; returns (X, number of butterflies)."""
    a = np.array(x, complex)
    N = len(a)
    bits = N.bit_length() - 1
    assert 1 << bits == N, "length must be a power of two"
    rev = [int(format(i, f"0{bits}b")[::-1], 2) for i in range(N)]
    a = a[rev]
    flies, span = 0, 1
    while span < N:
        w_step = np.exp(-1j * np.pi / span)
        for start in range(0, N, 2 * span):
            w = 1.0 + 0j
            for k in range(span):
                u, v = a[start + k], w * a[start + k + span]
                a[start + k], a[start + k + span] = u + v, u - v
                w *= w_step
                flies += 1
        span *= 2
    return a, flies

def dft(x):
    N = len(x)
    n = np.arange(N)
    return np.exp(-2j * np.pi * np.outer(n, n) / N) @ np.asarray(x, complex)

if __name__ == "__main__":
    assert np.allclose(fft_recursive([1, 2, 3, 4]), [10, -2 + 2j, -2, -2 - 2j])
    rng = np.random.default_rng(0)
    for N in (8, 64, 1024):
        x = rng.standard_normal(N) + 1j * rng.standard_normal(N)
        ref = np.fft.fft(x)
        Xi, flies = fft_iterative(x)
        assert np.max(np.abs(fft_recursive(x) - ref)) < 1e-9
        assert np.max(np.abs(Xi - ref)) < 1e-9
        assert flies == N // 2 * int(np.log2(N))
    assert np.allclose(dft(x[:64]), np.fft.fft(x[:64]))
    print("matches numpy.fft; butterflies at N = 1024:", flies, "vs N^2 =", 1024**2)
