import numpy as np

def cubic(q0, qf, T, v0=0.0, vf=0.0):
    """coefficients a0..a3 of q(t) = sum a_k t^k meeting position and velocity at t = 0 and t = T"""
    A = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [1, T, T**2, T**3], [0, 1, 2 * T, 3 * T**2]], float)
    return np.linalg.solve(A, [q0, v0, qf, vf])

def quintic(q0, qf, T, v0=0.0, vf=0.0, a0=0.0, af=0.0):
    """coefficients a0..a5 meeting position, velocity and acceleration at both ends"""
    A = np.array([[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0],
                  [1, T, T**2, T**3, T**4, T**5], [0, 1, 2 * T, 3 * T**2, 4 * T**3, 5 * T**4], [0, 0, 2, 6 * T, 12 * T**2, 20 * T**3]], float)
    return np.linalg.solve(A, [q0, v0, a0, qf, vf, af])

def evaluate(c, t, d=0):
    """d-th derivative of the polynomial with coefficients c (lowest power first) at times t"""
    p = np.polynomial.polynomial.Polynomial(c)
    return p.deriv(d)(t) if d else p(t)

def test_boundary_conditions():
    for c, n, conds in [(cubic(0.2, 1.4, 2.0, 0.3, -0.1), 2, [(0.2, 0.3), (1.4, -0.1)]),
                        (quintic(0.2, 1.4, 2.0, 0.3, -0.1, 0.5, 0.0), 3, [(0.2, 0.3, 0.5), (1.4, -0.1, 0.0)])]:
        err = max(abs(evaluate(c, t, d) - want[d]) for t, want in zip([0, 2.0], conds) for d in range(n))
        print(f"{'cubic' if n == 2 else 'quintic'}: largest boundary-condition error {err:.1e}")
        assert err < 1e-12

def test_rest_to_rest_peaks():
    D, T = 1.0, 2.0; t = np.linspace(0, T, 200001)
    c3, c5 = cubic(0, D, T), quintic(0, D, T)
    v3, a3 = np.abs(evaluate(c3, t, 1)).max(), np.abs(evaluate(c3, t, 2)).max()
    v5, a5 = np.abs(evaluate(c5, t, 1)).max(), np.abs(evaluate(c5, t, 2)).max()
    j3, j5 = np.abs(evaluate(c3, t, 3)).max(), np.abs(evaluate(c5, t, 3)).max()
    print(f"1 rad in 2 s, cubic: peak velocity {v3:.4f} rad/s, peak acceleration {a3:.4f} rad/s^2 (at the ends), jerk {j3:.3f}")
    print(f"1 rad in 2 s, quintic: peak velocity {v5:.4f} rad/s, peak acceleration {a5:.4f} rad/s^2, start acceleration {evaluate(c5, 0, 2):.1e}, peak jerk {j5:.3f}")
    assert abs(v3 - 1.5 * D / T) < 1e-9 and abs(a3 - 6 * D / T**2) < 1e-9
    assert abs(v5 - 1.875 * D / T) < 1e-9 and abs(a5 - 10 / np.sqrt(3) * D / T**2) < 1e-6
    assert abs(evaluate(c3, 0, 2)) > 1 and abs(evaluate(c5, 0, 2)) < 1e-12   # the cubic jumps from rest to 1.5 rad/s^2

def test_via_points_join_smoothly():
    """chain cubics through via points with chosen via velocities: velocity is continuous at each join"""
    qs, ts, vs = [0.0, 0.8, 0.5, 1.2], [0.0, 1.0, 2.5, 3.5], [0.0, 0.4, 0.2, 0.0]
    segs = [cubic(qs[i], qs[i + 1], ts[i + 1] - ts[i], vs[i], vs[i + 1]) for i in range(3)]
    jumps = [abs(evaluate(segs[i], ts[i + 1] - ts[i], 1) - evaluate(segs[i + 1], 0, 1)) for i in range(2)]
    acc_jumps = [abs(evaluate(segs[i], ts[i + 1] - ts[i], 2) - evaluate(segs[i + 1], 0, 2)) for i in range(2)]
    print(f"three cubics through via points: velocity jumps {max(jumps):.1e}, acceleration jumps {', '.join(f'{a:.2f}' for a in acc_jumps)} rad/s^2")
    assert max(jumps) < 1e-12 and min(acc_jumps) > 0.1                # C1 but not C2: splines (lesson 05) fix that

test_boundary_conditions()
test_rest_to_rest_peaks()
test_via_points_join_smoothly()
print("PASS")
