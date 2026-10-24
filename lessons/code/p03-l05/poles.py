import numpy as np

def step_response(num, den, t_end=10.0, n=200_001):
    """Step response from partial fractions with distinct poles: y = sum r_i/p_i (e^{p_i t} - 1)."""
    p = np.roots(den)
    dden = np.polyder(den)
    r = np.polyval(num, p) / np.polyval(dden, p)        # impulse-response residues
    t = np.linspace(0, t_end, n)
    y = np.real(sum(ri / pi * (np.exp(pi * t) - 1) for ri, pi in zip(r, p)))
    return t, y

def settling_time(t, y, band=0.02):
    final = y[-1]
    outside = np.nonzero(np.abs(y - final) > band * abs(final))[0]
    return t[outside[-1] + 1]

if __name__ == "__main__":
    t, y = step_response([20.0], [1.0, 4.0, 20.0])
    zeta, wn = 2 / np.sqrt(20), np.sqrt(20)
    Mp = y.max() - 1
    assert abs(Mp - np.exp(-np.pi * zeta / np.sqrt(1 - zeta**2))) < 1e-6
    assert abs(t[y.argmax()] - np.pi / 4) < 1e-3
    ts = settling_time(t, y)
    print(f"overshoot {Mp*100:.2f} %, settling {ts:.3f} s (estimate {4/(zeta*wn):.2f} s)")
    assert abs(ts - 1.868) < 0.002
    # the envelope rule is within about 16 % either way across practical damping ratios
    for z in (0.3, 0.4, 0.5, 0.6, 0.7):
        tt, yy = step_response([1.0], [1.0, 2 * z, 1.0], t_end=40.0)
        ratio = settling_time(tt, yy) / (4 / z)
        assert 0.84 < ratio < 1.05, (z, ratio)
    # a pole 10x further left barely changes things
    t3, y3 = step_response([400.0], np.polymul([1, 4, 20], [1, 20]))
    assert abs((y3.max() - 1) - 0.2021) < 1e-3 and abs(settling_time(t3, y3) - 1.917) < 0.003
