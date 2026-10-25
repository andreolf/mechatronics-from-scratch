import numpy as np

HOURS_PER_YEAR = 8760
PL_BANDS = [("e", 1e-8, 1e-7), ("d", 1e-7, 1e-6), ("c", 1e-6, 3e-6), ("b", 3e-6, 1e-5), ("a", 1e-5, 1e-4)]   # ISO 13849-1, PFH per hour
SIL_BANDS = [("SIL 4", 1e-9, 1e-8), ("SIL 3", 1e-8, 1e-7), ("SIL 2", 1e-7, 1e-6), ("SIL 1", 1e-6, 1e-5)]   # IEC 61508, high demand

def band(pfh, bands):
    for name, lo, hi in bands:
        if lo <= pfh < hi: return name
    return "below range" if pfh < bands[0][1] else "not reached"

def pfh_1oo1(lam_du): return lam_du

def pfh_1oo2(lam_du, beta, t_h):
    """simplified average dangerous failure frequency of two redundant channels over mission time t_h:
    both fail independently, (1-beta)^2 lam^2 t, or one common cause hits both, beta lam. Detected failures are
    assumed to trip the safe state. IEC 61508-6 gives the full formulas with repair and proof-test terms."""
    return (1 - beta) ** 2 * lam_du**2 * t_h + beta * lam_du

def pfh_1oo2_exact(lam_du, beta, t_h):
    """same model without the small-number approximation: P(both independent failures or a common cause by t) / t."""
    p_ind = (1 - np.exp(-(1 - beta) * lam_du * t_h)) ** 2
    return (1 - (1 - p_ind) * np.exp(-beta * lam_du * t_h)) / t_h

def monte_carlo(lam_du, beta, t_h, n=2_000_000, seed=7):
    """sample independent failure times for both channels and a common-cause time; the system fails dangerously when
    both channels are down. Average frequency = P(failure within t_h) / t_h."""
    rng = np.random.default_rng(seed)
    a = rng.exponential(1 / ((1 - beta) * lam_du), n); b = rng.exponential(1 / ((1 - beta) * lam_du), n)
    c = rng.exponential(1 / (beta * lam_du), n)
    fail = np.minimum(np.maximum(a, b), c) < t_h
    p = fail.mean(); return p / t_h, np.sqrt(p * (1 - p) / n) / t_h

def test_redundant_channel():
    mttfd_y, dc, beta, mission_y = 30, 0.90, 0.02, 20
    lam_d = 1 / (mttfd_y * HOURS_PER_YEAR); lam_du = (1 - dc) * lam_d; t = mission_y * HOURS_PER_YEAR
    print(f"per channel: MTTFd {mttfd_y} y -> lambda_D {lam_d:.3e}/h; DC {dc:.0%} -> lambda_DU {lam_du:.3e}/h")
    p1 = pfh_1oo1(lam_du); p2 = pfh_1oo2(lam_du, beta, t); mc, se = monte_carlo(lam_du, beta, t)
    print(f"1oo1 PFH {p1:.3e}/h: PL {band(p1, PL_BANDS)}, {band(p1, SIL_BANDS)}")
    print(f"1oo2 PFH formula {p2:.3e}/h, Monte Carlo {mc:.3e} +/- {se:.1e}/h: PL {band(p2, PL_BANDS)}, {band(p2, SIL_BANDS)}")
    ex = pfh_1oo2_exact(lam_du, beta, t)
    print(f"  exact {ex:.3e}/h: the simplified formula is {100 * (p2 / ex - 1):.1f} % conservative")
    print(f"  of which common cause {beta * lam_du:.3e}/h ({100 * beta * lam_du / p2:.0f} %)")
    assert abs(mc - ex) < 3 * se and ex <= p2 < 1.1 * ex                     # simulation matches; formula is a safe upper bound
    assert band(p2, PL_BANDS) == "e" and band(p1, PL_BANDS) == "d"

def test_common_cause_dominates():
    lam_du = 3.805e-7; t = 20 * HOURS_PER_YEAR
    for beta in (0.0, 0.02, 0.05, 0.10):
        print(f"beta {beta:4.2f}: PFH {pfh_1oo2(lam_du, beta, t):.3e}/h, PL {band(pfh_1oo2(lam_du, beta, t), PL_BANDS)}")
    assert pfh_1oo2(lam_du, 0.10, t) > 2 * pfh_1oo2(lam_du, 0.0, t)

test_redundant_channel()
test_common_cause_dominates()
print("PASS")
