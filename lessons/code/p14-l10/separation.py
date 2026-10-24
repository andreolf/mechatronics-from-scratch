import numpy as np
from scipy.signal import place_poles
from scipy.linalg import solve_continuous_are, expm

M, m, l, g = 0.8, 0.25, 0.45, 9.81

def deriv(s, F):
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    A = np.column_stack([(deriv(e * 1e-6, 0) - deriv(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((deriv(np.zeros(4), 1e-6) - deriv(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

A, B = linearise(); C = np.array([[1.0, 0, 0, 0], [0, 0, 1.0, 0]])

def designs(q_th=50.0, obs_poles=(-20, -22, -24, -26)):
    K = np.linalg.solve([[0.05]], B.T @ solve_continuous_are(A, B, np.diag([5.0, 1, q_th, 1]), np.array([[0.05]])))
    L = place_poles(A.T, C.T, list(obs_poles)).gain_matrix.T
    return K, L

def closed_loop_xe(K, L):
    """coordinates (x, e = x - xhat): block upper triangular"""
    return np.block([[A - B @ K, B @ K], [np.zeros((4, 4)), A - L @ C]])

def closed_loop_xxhat(K, L):
    """the same loop in (x, xhat) coordinates, as you would wire it"""
    return np.block([[A, -B @ K], [L @ C, A - B @ K - L @ C]])

def test_eigenvalues_are_the_union():
    K, L = designs()
    want = np.concatenate([np.linalg.eigvals(A - B @ K), np.linalg.eigvals(A - L @ C)])
    for name, Acl in (("(x, e)", closed_loop_xe(K, L)), ("(x, xhat)", closed_loop_xxhat(K, L))):
        got = np.linalg.eigvals(Acl)
        d = max(min(abs(gv - w) for gv in got) for w in want)
        print(f"{name:10s} eigenvalues: {np.round(np.sort_complex(got), 2)}  max distance to the union {d:.1e}")
        assert d < 1e-6

def test_transfer_is_unchanged_by_observer():
    # from a reference force input, the observer error is not excited: r -> y equals the full-state design
    K, L = designs(); Bx = np.vstack([B, np.zeros((4, 1))])
    Acl = closed_loop_xe(K, L); Cx = np.hstack([C, np.zeros((2, 4))])
    Af = A - B @ K
    for t in (0.1, 0.5, 2.0):
        y_obs = Cx @ np.linalg.solve(Acl, (expm(Acl * t) - np.eye(8)) @ Bx)
        y_full = C @ np.linalg.solve(Af, (expm(Af * t) - np.eye(4)) @ B)
        assert np.allclose(y_obs, y_full, atol=1e-9)

def test_output_feedback_balances_nonlinear_plant():
    K, L = designs(); h = 1e-3; rng = np.random.default_rng(4)
    s = np.array([0.0, 0.0, np.radians(10), 0.0]); xh = np.zeros(4); ths = []
    for k in range(8000):
        y = C @ s + rng.normal(size=2) * np.array([0.0005, np.radians(0.1)])
        F = float(np.clip(-K[0] @ xh, -30, 30))                         # the controller sees only the estimate
        xh = xh + h * (A @ xh + B[:, 0] * F + L @ (y - C @ xh))
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ths.append(s[2])
        if abs(s[2]) > 1: break
    ths = np.array(ths)
    print(f"observer-based LQR from 10 deg (estimate starts at zero): upright {len(ths) / 1000:.1f} s, tilt over the last 2 s below {np.degrees(np.abs(ths[-2000:]).max()):.2f} deg")
    assert len(ths) == 8000 and np.degrees(np.abs(ths[-2000:]).max()) < 0.5

def test_slow_observer_hurts():
    K, _ = designs()
    for poles in ((-20, -22, -24, -26), (-0.5, -0.6, -0.7, -0.8)):
        _, L = designs(obs_poles=poles)
        lam = np.linalg.eigvals(closed_loop_xe(K, L))
        print(f"observer poles near {poles[0]}: slowest closed-loop pole {lam.real.max():.2f}")
    assert abs(lam.real.max() + 0.5) < 1e-6                                       # the slow observer now dominates the response

test_eigenvalues_are_the_union()
test_transfer_is_unchanged_by_observer()
test_output_feedback_balances_nonlinear_plant()
test_slow_observer_hurts()
print("PASS")
