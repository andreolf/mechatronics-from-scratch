import numpy as np

m, m_adh, P, Fmax, g = 120e3, 60e3, 1.0e6, 140e3, 9.81
A, B, C = 2400.0, 60.0, 8.0          # Davis coefficients, illustrative (N, N s/m, N s^2/m^2)
meff = 1.06 * m

def forces(v, grade, mu):
    a = np.arctan(grade)
    demand = min(Fmax, P / max(v, 0.1))
    adh = mu * m_adh * g * np.cos(a)
    Ft = min(demand, adh)
    resist = A + B * v + C * v * v if v > 0 else 0.0
    return Ft, demand, adh, resist, m * g * np.sin(a)

def simulate(grade, mu, v0=0.5, T=300.0, dt=0.05):
    v, slip_t, vs = v0, 0.0, []
    for _ in range(int(T / dt)):
        Ft, demand, adh, R, G = forces(v, grade, mu)
        if demand > adh: slip_t += dt
        v = max(v + dt * (Ft - R - G) / meff, 0.0); vs.append(v)
    return np.array(vs), slip_t

def balance_speed(grade):
    G = m * g * np.sin(np.arctan(grade))
    lo, hi = P / Fmax, 60.0                  # constant-power region
    for _ in range(80):
        v = (lo + hi) / 2
        lo, hi = (v, hi) if P / v - (A + B * v + C * v * v) - G > 0 else (lo, v)
    return v

def test_worked_numbers():
    _, _, adh_dry, _, G = forces(1.0, 0.07, 0.25)
    _, _, adh_wet, _, _ = forces(1.0, 0.07, 0.12)
    print(f"grade force {G / 1e3:.1f} kN, adhesion dry {adh_dry / 1e3:.1f} kN, wet {adh_wet / 1e3:.1f} kN")
    assert abs(G - 82.2e3) < 100 and abs(adh_dry - 146.8e3) < 100 and abs(adh_wet - 70.5e3) < 100

def test_dry_climb_no_slip():
    vs, slip = simulate(0.07, 0.25)
    vb = balance_speed(0.07)
    print(f"dry 70 permille: no slip ({slip:.1f} s), climbs at {vs[-1] * 3.6:.1f} km/h (balance {vb * 3.6:.1f} km/h)")
    assert slip == 0 and abs(vs[-1] - vb) < 0.05

def test_wet_slip_predicted():
    vs, slip = simulate(0.07, 0.12, v0=8.0, T=60)
    print(f"wet 70 permille: slip for {slip:.0f} of 60 s, speed falls from 28.8 to {vs[-1] * 3.6:.1f} km/h")
    assert slip > 0 and vs[-1] < 8.0

def test_slip_iff_demand_exceeds_adhesion():
    rng = np.random.default_rng(4)
    for _ in range(2000):
        v, grade, mu = rng.uniform(0, 25), rng.uniform(0, 0.1), rng.uniform(0.05, 0.35)
        Ft, demand, adh, _, _ = forces(v, grade, mu)
        slipping = Ft < demand
        assert slipping == (demand > adh)
        assert Ft <= adh + 1e-9 and Ft <= demand + 1e-9

def test_max_grade():
    gmax_dry = np.tan(np.arcsin(Fmax / (m * g)))
    gmax_wet = 0.12 * m_adh / m        # small-angle, Davis ignored
    print(f"steepest start: dry {gmax_dry * 1000:.0f} permille (motor-limited), wet {gmax_wet * 1000:.0f} permille (adhesion-limited)")
    assert abs(gmax_dry - 0.119) < 0.002 and abs(gmax_wet - 0.06) < 1e-9

test_worked_numbers()
test_dry_climb_no_slip()
test_wet_slip_predicted()
test_slip_iff_demand_exceeds_adhesion()
test_max_grade()
print("PASS")
