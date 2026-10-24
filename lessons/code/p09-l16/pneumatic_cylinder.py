import numpy as np

Rg, Tk, pa, Cd = 287.0, 293.0, 1.013e5, 0.8

def mass_flow(ps, p, d_orifice):
    Ao = np.pi * d_orifice ** 2 / 4
    r = p / ps
    psi = 0.0404 if r <= 0.528 else 0.0404 * np.sqrt(max(0.0, 1 - ((r - 0.528) / 0.472) ** 2))
    return Cd * Ao * psi * ps / np.sqrt(Tk)

def simulate(d0, F, ps=7e5, bore=0.032, stroke=0.2, m=5.0, x0=0.01, c=50.0, dt=2e-5, T=3.0):
    A = np.pi * bore ** 2 / 4
    p, x, v = pa, 0.0, 0.0
    for n in range(int(T / dt)):
        mdot = mass_flow(ps, p, d0)
        Vol = A * (x0 + x)
        a = ((p - pa) * A - F - c * v) / m
        if x <= 0 and a < 0: a, v = 0.0, 0.0
        v += a * dt; x = min(max(x + v * dt, 0.0), stroke)
        p += dt * (Rg * Tk * mdot - p * A * v) / Vol          # isothermal chamber
        if x >= stroke:
            return n * dt
    return np.inf

def estimate(d0, F, ps=7e5, bore=0.032, stroke=0.2, x0=0.01):
    A = np.pi * bore ** 2 / 4; pw = pa + F / A
    mdot = mass_flow(ps, pw, d0)
    t_fill = (pw - pa) * A * x0 / (mdot * Rg * Tk)
    return t_fill + stroke * A * pw / (mdot * Rg * Tk)

if __name__ == "__main__":
    for d0 in (1.0e-3, 1.5e-3, 2.5e-3):
        for F in (100.0, 200.0, 300.0):
            ts, te = simulate(d0, F), estimate(d0, F)
            print(f"orifice {d0*1e3:.1f} mm, load {F:.0f} N: simulated {ts:.3f} s, estimate {te:.3f} s ({100*(ts-te)/te:+.0f} %)")
            assert ts >= te                                   # the estimate ignores acceleration: always optimistic
            if te > 0.25 and F >= 200:                        # flow-limited strokes: the estimate holds
                assert (ts - te) / te < 0.15
    A = np.pi * 0.032 ** 2 / 4
    k = 1.4 * 3.5e5 * A ** 2 / (A * 0.11)
    print(f"air spring {k:.0f} N/m, {np.sqrt(k / 5) / (2 * np.pi):.1f} Hz with 5 kg")
    assert abs(k - 3580) < 10
