import numpy as np

P = dict(vin=12.0, L=22e-6, C=470e-6, rc=0.05, R=1.65)       # buck with an electrolytic output capacitor (its ESR adds a zero)

def plant(s, vin, L, C, rc, R):
    """control-to-output transfer function of the averaged buck, Gvd = vout/d"""
    return vin * (1 + s * C * rc) / (L * C * s**2 * (1 + rc / R) + s * (L / R + C * rc) + 1)

def type2(s, K, wz, wp): return K * (1 + s / wz) / (s * (1 + s / wp))

def design(fc=20e3, k=4.5):
    """type-II: zero a factor k below crossover, pole a factor k above, gain so that |loop| = 1 at fc"""
    wc = 2 * np.pi * fc; wz, wp = wc / k, wc * k
    K = 1 / abs(plant(1j * wc, **P) * type2(1j * wc, 1.0, wz, wp))
    return K, wz, wp

def margins(K, wz, wp):
    f = np.logspace(1, 6, 20000); s = 2j * np.pi * f; Lp = plant(s, **P) * type2(s, K, wz, wp)
    i = np.argmin(abs(abs(Lp) - 1)); pm = 180 + np.degrees(np.angle(Lp[i]))
    ph = np.degrees(np.unwrap(np.angle(Lp))); hi = f > f[i]
    return f[i], pm, ph[hi].min()                                          # lowest phase above crossover

def load_step(K, wz, wp, vref=3.3, t_end=3e-3, dt=20e-9, i1=1.0, i2=2.0, t_step=1e-3):
    """averaged buck with the type-II controller: the load is a current sink that steps from i1 to i2"""
    vin, L, C, rc = P["vin"], P["L"], P["C"], P["rc"]
    iL, vC, z, w = i1, vref, vref / vin / K, vref / vin / K                # start in steady state
    out = []
    for k in range(int(t_end / dt)):
        t = k * dt; io = i1 if t < t_step else i2
        vo = vC + rc * (iL - io)
        e = vref - vo; z += dt * e; w += dt * wp * (z - w)
        d = np.clip(K * ((wp / wz) * z + (1 - wp / wz) * w), 0, 1)          # duty cycle, limited to 0..1
        iL += dt * (d * vin - vo) / L; vC += dt * (iL - io) / C
        if k % 50 == 0: out.append((t, vo))
    return np.array(out)

def test_margins():
    K, wz, wp = design(); fc, pm, ph_hi = margins(K, wz, wp)
    f0 = 1 / (2 * np.pi * np.sqrt(P["L"] * P["C"])); fesr = 1 / (2 * np.pi * P["C"] * P["rc"])
    print(f"LC double pole {f0:.0f} Hz, ESR zero {fesr:.0f} Hz; compensator zero {wz / 2 / np.pi:.0f} Hz, pole {wp / 2 / np.pi:.0f} Hz")
    print(f"crossover {fc / 1e3:.2f} kHz, phase margin {pm:.1f} deg; above crossover the phase stays above {ph_hi:.1f} deg")
    assert pm > 45 and abs(fc - 20e3) / 20e3 < 0.01 and ph_hi > -180
    return K, wz, wp

def test_load_step(K, wz, wp):
    tr = load_step(K, wz, wp); t, v = tr[:, 0], tr[:, 1]; after = t > 1e-3
    dip = 3.3 - v[after].min(); settle = t[after][np.where(abs(v[after] - 3.3) > 0.01 * 3.3)[0][-1]] - 1e-3
    print(f"load step 1 A -> 2 A: dip {1000 * dip:.1f} mV, back within 1 % after {1e6 * settle:.0f} us, final {v[-1]:.4f} V")
    assert abs(v[-1] - 3.3) < 1e-3 and dip < 0.1                            # the integrator removes the steady-state error

K, wz, wp = test_margins()
test_load_step(K, wz, wp)
print("PASS")
