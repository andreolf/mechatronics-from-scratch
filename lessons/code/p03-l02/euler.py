import numpy as np

def cis(theta):
    """e^{j theta} from the two Taylor series, summed until the terms vanish."""
    theta = np.asarray(theta, float)
    c, s = np.zeros_like(theta), np.zeros_like(theta)
    term = np.ones_like(theta, dtype=complex)    # (j theta)^n / n!
    for n in range(60):
        if n % 2 == 0: c += term.real
        else:          s += term.imag
        term = term * 1j * theta / (n + 1)
    return c + 1j * s

if __name__ == "__main__":
    th = np.linspace(-np.pi, np.pi, 2001)
    z = cis(th)
    assert np.max(np.abs(z - np.exp(1j * th))) < 1e-12
    assert np.max(np.abs((z + z.conj()) / 2 - np.cos(th))) < 1e-12
    assert np.max(np.abs(np.cos(3 * th) - (4 * np.cos(th)**3 - 3 * np.cos(th)))) < 1e-12
    # amplitude-phase form of 3 cos wt + 4 sin wt
    a, b = 3.0, 4.0
    R, phi = np.hypot(a, b), np.arctan2(b, a)
    assert np.max(np.abs(a * np.cos(th) + b * np.sin(th) - R * np.cos(th - phi))) < 1e-12
    # demodulation: mean of signal * 2cos over whole periods recovers a
    t = np.linspace(0, 1, 10000, endpoint=False); w = 2 * np.pi * 5
    sig = a * np.cos(w * t) + b * np.sin(w * t)
    assert abs(np.mean(sig * 2 * np.cos(w * t)) - a) < 1e-9 and abs(np.mean(sig * 2 * np.sin(w * t)) - b) < 1e-9
    print("Euler identities hold to 1e-12;", f"R = {R}, phi = {np.degrees(phi):.2f} deg")
