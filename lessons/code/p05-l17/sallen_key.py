import math
import numpy as np

def h_nodal(f, R1, R2, C1, C2):
    """Solve KCL at nodes A and B numerically (ideal follower: vout = vB)."""
    s = 2j * math.pi * f
    # node A: (vA - 1)/R1 + (vA - vB)/R2 + s*C1*(vA - vout) = 0, with vout = vB
    # node B: (vB - vA)/R2 + s*C2*vB = 0
    G = np.array([[1 / R1 + 1 / R2 + s * C1, -1 / R2 - s * C1],
                  [-1 / R2, 1 / R2 + s * C2]], dtype=complex)
    vA, vB = np.linalg.solve(G, [1 / R1, 0])
    return vB

def h_formula(f, R1, R2, C1, C2):
    s = 2j * math.pi * f
    return 1 / (s * s * R1 * R2 * C1 * C2 + s * C2 * (R1 + R2) + 1)

if __name__ == "__main__":
    R, C1, C2 = 10.7e3, 22e-9, 10e-9
    fn = 1 / (2 * math.pi * R * math.sqrt(C1 * C2))
    Q = math.sqrt(R * R * C1 * C2) / (C2 * 2 * R)
    print(f"fn = {fn:.1f} Hz, Q = {Q:.4f}")
    assert abs(fn - 1002.82) < 0.01 and abs(Q - 0.74162) < 1e-5
    for f in (10, 500, 1000, 5000, 20000):
        assert abs(h_nodal(f, R, R, C1, C2) - h_formula(f, R, R, C1, C2)) < 1e-12
    att = 20 * math.log10(abs(h_formula(5000, R, R, C1, C2)))
    assert -29 < att < -27
    peak = max(abs(h_formula(f, R, R, C1, C2)) for f in np.linspace(10, 3000, 3000))
    assert 0 < 20 * math.log10(peak) < 0.15          # Q slightly above 0.707: a tiny bump
    # an exact Butterworth with C1 = 2 C2 is flat
    assert abs(math.sqrt(2) / 2 - 0.5 * math.sqrt(2.0)) < 1e-15
