import numpy as np
from scipy.interpolate import CubicSpline
from scipy.linalg import solve_banded

def natural_spline(x, y):
    """second derivatives M at the knots of the natural cubic spline (M_0 = M_n = 0), by a tridiagonal solve"""
    x, y = np.asarray(x, float), np.asarray(y, float); n = len(x) - 1; h = np.diff(x)
    rhs = 6 * (np.diff(y[1:]) / h[1:] - np.diff(y[:-1]) / h[:-1])          # n - 1 interior equations
    ab = np.zeros((3, n - 1))
    ab[0, 1:] = h[1:-1]; ab[1] = 2 * (h[:-1] + h[1:]); ab[2, :-1] = h[1:-1]   # super, main, sub diagonals
    M = np.zeros(n + 1); M[1:-1] = solve_banded((1, 1), ab, rhs)
    return M

def evaluate(x, y, M, t, d=0):
    """value (d = 0), slope (1) or curvature (2) of the spline at points t"""
    x, y = np.asarray(x, float), np.asarray(y, float)
    i = np.clip(np.searchsorted(x, t, side='right') - 1, 0, len(x) - 2)
    h = x[i + 1] - x[i]; A = (x[i + 1] - t) / h; B = (t - x[i]) / h
    if d == 0: return A * y[i] + B * y[i + 1] + ((A**3 - A) * M[i] + (B**3 - B) * M[i + 1]) * h**2 / 6
    if d == 1: return (y[i + 1] - y[i]) / h + (-(3 * A**2 - 1) * M[i] + (3 * B**2 - 1) * M[i + 1]) * h / 6
    return A * M[i] + B * M[i + 1]

def piece(x, y, M, k, t, d):
    """evaluate polynomial piece k at t, even outside its interval (to compare left and right limits at a knot)"""
    h = x[k + 1] - x[k]; A = (x[k + 1] - t) / h; B = (t - x[k]) / h
    return [A * y[k] + B * y[k + 1] + ((A**3 - A) * M[k] + (B**3 - B) * M[k + 1]) * h**2 / 6,
            (y[k + 1] - y[k]) / h + (-(3 * A**2 - 1) * M[k] + (3 * B**2 - 1) * M[k + 1]) * h / 6,
            A * M[k] + B * M[k + 1]][d]

X = np.array([0.0, 1.0, 2.5, 3.0, 4.5, 6.0])      # illustrative waypoints: time (s) and joint angle (rad)
Y = np.array([0.0, 0.6, 0.4, 0.9, 1.5, 1.2])

def test_interpolates_and_c2():
    M = natural_spline(X, Y)
    assert np.abs(evaluate(X, Y, M, X) - Y).max() < 1e-12
    jumps = [max(abs(piece(X, Y, M, k - 1, X[k], d) - piece(X, Y, M, k, X[k], d)) for k in range(1, len(X) - 1)) for d in range(3)]
    print("jumps at the interior knots: value {:.1e}, slope {:.1e}, curvature {:.1e}".format(*jumps))
    assert max(jumps) < 1e-12                                            # C2 continuity
    assert M[0] == 0 and M[-1] == 0                                      # natural end conditions

def test_matches_scipy():
    M = natural_spline(X, Y); ref = CubicSpline(X, Y, bc_type='natural'); t = np.linspace(0, 6, 1001)
    err = max(np.abs(evaluate(X, Y, M, t, d) - ref(t, d)).max() for d in range(3))
    print(f"largest difference from scipy's natural CubicSpline (value, slope, curvature): {err:.1e}")
    assert err < 1e-12

def test_three_knot_example():
    M = natural_spline([0, 1, 2], [0, 1, 0])
    s0, s1 = evaluate([0, 1, 2], [0, 1, 0], M, np.array([0.0, 1.0]), 1)
    print(f"knots (0,0), (1,1), (2,0): M1 = {M[1]:.4f}, slope at x = 0 {s0:.4f}, at x = 1 {s1:.1e}")
    assert abs(M[1] + 3) < 1e-12 and abs(s0 - 1.5) < 1e-12 and abs(s1) < 1e-12

def test_smoothest_interpolant():
    """the natural spline minimises the integral of y'' squared among all C2 interpolants: a polynomial through the same points bends more"""
    M = natural_spline(X, Y); t = np.linspace(0, 6, 60001)
    bend_s = np.trapezoid(evaluate(X, Y, M, t, 2)**2, t)
    p = np.polynomial.Polynomial.fit(X, Y, len(X) - 1); bend_p = np.trapezoid(p.deriv(2)(t)**2, t)
    print(f"bending energy: natural spline {bend_s:.3f}, degree-5 interpolating polynomial {bend_p:.3f}")
    assert bend_s < bend_p

test_interpolates_and_c2()
test_matches_scipy()
test_three_knot_example()
test_smoothest_interpolant()
print("PASS")
