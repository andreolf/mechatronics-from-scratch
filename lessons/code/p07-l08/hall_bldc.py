import itertools
import numpy as np

def hall_code(theta_e_deg):
    t = theta_e_deg % 360
    return "".join("1" if (t - off) % 360 < 180 else "0" for off in (0, 120, 240))

def back_emf(theta_e_deg, phase):                       # phase 0, 1, 2 = A, B, C; 30 deg from the Hall edges
    return np.sin(np.radians(theta_e_deg - 120 * phase - 30))

def derive_table():
    """For each Hall sector choose (high, low) maximising the worst-case torque over the sector."""
    table = {}
    for sector in range(6):
        th = np.linspace(60 * sector + 0.5, 60 * sector + 59.5, 120)
        best = max(itertools.permutations(range(3), 2),
                   key=lambda hl: np.min(back_emf(th, hl[0]) - back_emf(th, hl[1])))
        table[hall_code(60 * sector + 30)] = ("ABC"[best[0]] + "+", "ABC"[best[1]] + "-")
    return table

SEQUENCE = ["101", "100", "110", "010", "011", "001"]   # increasing electrical angle

def direction(prev, new):
    i, j = SEQUENCE.index(prev), SEQUENCE.index(new)
    return {1: +1, 5: -1}.get((j - i) % 6, 0)

if __name__ == "__main__":
    table = derive_table()
    print(table)
    assert table["100"] == ("A+", "B-") and table["110"] == ("A+", "C-") and table["010"] == ("B+", "C-")
    assert table["011"] == ("B+", "A-") and table["001"] == ("C+", "A-") and table["101"] == ("C+", "B-")
    # torque never drops below cos(30 deg) of its peak (sqrt(3) for a line-to-line pair)
    th = np.linspace(0, 360, 3601)[:-1]
    tq = []
    for a in th:
        hi, lo = table[hall_code(a)]
        tq.append(back_emf(a, "ABC".index(hi[0])) - back_emf(a, "ABC".index(lo[0])))
    tq = np.array(tq) / np.sqrt(3)
    assert tq.min() > 0.865 and abs(tq.max() - 1) < 1e-3
    # direction and speed from simulated Hall edges, 4 pole pairs at 3000 rpm, then reversing
    p, rpm = 4, 3000
    t = np.arange(0, 0.02, 1e-6)
    theta_e = 360 * p * (rpm / 60) * t
    codes = [hall_code(a) for a in theta_e]
    edges = [i for i in range(1, len(codes)) if codes[i] != codes[i - 1]]
    assert all(direction(codes[i - 1], codes[i]) == +1 for i in edges)
    period = np.diff(t[edges]).mean()
    est_rpm = 60 / (6 * p * period)
    assert abs(est_rpm - 3000) < 5
    rev = [hall_code(-a) for a in theta_e[:3000]]
    assert all(direction(rev[i - 1], rev[i]) == -1 for i in range(1, len(rev)) if rev[i] != rev[i - 1])
    assert abs(1e-3 * 0.1 / (1e21 * 1.602e-19 * 1e-5) - 0.0624) < 0.001
    print(f"speed from Hall edges: {est_rpm:.0f} rpm, minimum torque {tq.min():.3f} of peak")
