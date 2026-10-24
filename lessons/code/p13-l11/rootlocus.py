import numpy as np
from scipy.optimize import linear_sum_assignment

def root_locus(num, den, gains):
    """closed-loop roots of den + K num for each K, ordered so each branch is continuous"""
    num = np.pad(num, (len(den) - len(num), 0))
    prev = np.roots(den); out = [prev]
    for K in gains[1:]:
        r = np.roots(den + K * num)
        cost = np.abs(prev[:, None] - r[None, :])
        _, j = linear_sum_assignment(cost)
        prev = r[j]; out.append(prev)
    return np.array(out)

num, den = np.array([1.0]), np.poly([0, -2, -4])
L = lambda s: np.polyval(num, s) / np.polyval(den, s)
gains = np.concatenate([[0], np.logspace(-3, 4, 4000)])
locus = root_locus(num, den, gains)

def test_angle_and_magnitude_conditions():
    worst_a = worst_m = 0
    for K, roots in zip(gains[1:], locus[1:]):
        for s in roots:
            ang = np.degrees(np.angle(L(s)))
            worst_a = max(worst_a, abs(abs(ang) - 180))
            worst_m = max(worst_m, abs(K * abs(L(s)) - 1))
    print(f"{locus[1:].size} locus points: worst angle error {worst_a:.1e} deg, worst magnitude error {worst_m:.1e}")
    assert worst_a < 1e-6 and worst_m < 1e-6

def test_asymptotes():
    far = locus[-1]                                       # K = 1e4
    centroid = (0 - 2 - 4) / 3
    angles = sorted(np.degrees(np.angle(far - centroid)) % 360)
    print("far-branch angles from the centroid:", np.round(angles, 2))
    assert np.allclose(angles, [60, 180, 300], atol=1.0)

def test_breakaway():
    cands = np.roots(np.polysub(np.polymul(np.polyder(num), den), np.polymul(num, np.polyder(den))))
    real = [c.real for c in cands if abs(c.imag) < 1e-9 and -2 < c.real < 0]
    sb = real[0]; Kb = 1 / abs(L(sb))
    print(f"breakaway at s = {sb:.4f}, K = {Kb:.4f}")
    assert abs(sb - (-2 + 2 / np.sqrt(3))) < 1e-9
    # just below Kb two real roots near sb, just above a complex pair
    r_lo = np.roots(den + (Kb * 0.999) * np.pad(num, (3, 0))); r_hi = np.roots(den + (Kb * 1.001) * np.pad(num, (3, 0)))
    assert np.sum(np.abs(r_lo.imag) > 1e-6) == 0 and np.sum(np.abs(r_hi.imag) > 1e-6) == 2

def test_crossing_matches_routh():
    i = np.argmax([np.max(r.real) > 0 for r in locus])
    K_cross = gains[i]
    print(f"first right-half-plane pole at K = {K_cross:.2f} (Routh: 48)")
    assert abs(K_cross - 48) / 48 < 0.01
    r = np.roots(den + 48 * np.pad(num, (3, 0)))
    assert np.isclose(np.max(np.abs(r.imag)), np.sqrt(8), atol=1e-6)

test_angle_and_magnitude_conditions()
test_asymptotes()
test_breakaway()
test_crossing_matches_routh()
print("PASS")
