import numpy as np

ms, mu, ks, kt = 250.0, 40.0, 16000.0, 160000.0
M = np.diag([ms, mu])
K = np.array([[ks, -ks], [-ks, ks + kt]])

def natural_frequencies():
    w2 = np.linalg.eigvals(np.linalg.solve(M, K)).real
    return np.sort(np.sqrt(w2)) / (2 * np.pi)

def make_f(cs, road):
    def f(t, s):
        xs, xu, vs, vu = s
        r = road(t)
        fs = -ks * (xs - xu) - cs * (vs - vu)
        return np.array([vs, vu, fs / ms, (-fs - kt * (xu - r)) / mu])
    return f

def rk4(f, x0, t_end, dt):
    n = int(round(t_end / dt)); x = np.array(x0, float); out = np.empty((n + 1, len(x0))); out[0] = x
    for k in range(n):
        t = k * dt
        k1 = f(t, x); k2 = f(t + dt / 2, x + dt / 2 * k1); k3 = f(t + dt / 2, x + dt / 2 * k2); k4 = f(t + dt, x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out[k + 1] = x
    return np.arange(n + 1) * dt, out

def peak_freqs(sig, dt, n=2):
    pad = 1 << 21
    spec = np.abs(np.fft.rfft((sig - sig.mean()) * np.hanning(len(sig)), pad))
    freqs = np.fft.rfftfreq(pad, dt)
    peaks = [i for i in range(1, len(spec) - 1) if spec[i] > spec[i - 1] and spec[i] > spec[i + 1]]
    chosen = []
    for i in sorted(peaks, key=lambda i: -spec[i]):          # strongest first, skipping window side lobes
        if all(abs(freqs[i] - freqs[j]) > 1.0 for j in chosen):
            chosen.append(i)
        if len(chosen) == n:
            break
    return sorted(freqs[i] for i in chosen)

def test_frequencies():
    f1, f2 = natural_frequencies()
    a1 = np.sqrt(ks * kt / (ks + kt) / ms) / (2 * np.pi); a2 = np.sqrt((ks + kt) / mu) / (2 * np.pi)
    print(f"eigenvalues: {f1:.3f} Hz and {f2:.3f} Hz; hand approximations {a1:.3f} and {a2:.3f} Hz")
    assert abs(a1 - f1) / f1 < 0.02 and abs(a2 - f2) / f2 < 0.02
    # free vibration, no damping: a mix of both modes, starting from a displaced wheel
    dt = 1e-3
    t, X = rk4(make_f(0.0, lambda t: 0.0), [0.0, 0.01, 0.0, 0.0], 60.0, dt)
    p = peak_freqs(X[:, 0] + 5 * X[:, 1], dt)
    print(f"simulated spectrum peaks: {p[0]:.3f} Hz and {p[1]:.3f} Hz")
    assert abs(p[0] - f1) / f1 < 0.005 and abs(p[1] - f2) / f2 < 0.005
    # energy is conserved without damping (checks the equations' signs)
    E = 0.5 * ms * X[:, 2] ** 2 + 0.5 * mu * X[:, 3] ** 2 + 0.5 * ks * (X[:, 0] - X[:, 1]) ** 2 + 0.5 * kt * X[:, 1] ** 2
    print(f"energy drift over 60 s: {np.max(np.abs(E - E[0])) / E[0]:.1e} of the initial energy")
    assert np.max(np.abs(E - E[0])) / E[0] < 1e-3

def test_bump():
    bump = lambda t: 0.05 * (1 - np.cos(2 * np.pi * (t - 0.5) / 0.1)) / 2 if 0.5 <= t <= 0.6 else 0.0
    t, X = rk4(make_f(1000.0, bump), [0, 0, 0, 0], 5.0, 1e-4)
    print(f"over a 5 cm bump with c = 1000 Ns/m: body peak {X[:, 0].max() * 100:.1f} cm, wheel peak {X[:, 1].max() * 100:.1f} cm")
    assert abs(X[-1, 0]) < 2e-3                         # damped back to rest
    assert X[:, 1].max() > X[:, 0].max()                # the suspension isolates the body

test_frequencies()
test_bump()
print("PASS")
