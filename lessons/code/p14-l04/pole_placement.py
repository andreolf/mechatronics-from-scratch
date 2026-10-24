import numpy as np
from scipy.signal import place_poles
from scipy.linalg import expm

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def ackermann(A, B, poles):
    """K such that eig(A - B K) = poles, single input: K = e_n^T C^-1 phi(A)"""
    n = len(A)
    a = np.real(np.poly(poles))                            # desired characteristic polynomial, highest power first
    phi = sum(c * np.linalg.matrix_power(A, n - i) for i, c in enumerate(a))
    en = np.zeros((1, n)); en[0, -1] = 1.0
    return en @ np.linalg.solve(ctrb(A, B), phi)

def crane(M=500.0, m=1000.0, L=8.0, g=9.81):
    """trolley (mass M) with a load m hanging on a rope of length L: x = [x, xd, phi, phid], u = force on the trolley"""
    A = np.array([[0, 1, 0, 0], [0, 0, m * g / M, 0], [0, 0, 0, 1], [0, 0, -(M + m) * g / (M * L), 0]])
    B = np.array([[0], [1 / M], [0], [-1 / (M * L)]])
    return A, B

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def pair(wn, z):
    return [complex(-z * wn, wn * np.sqrt(1 - z * z)), complex(-z * wn, -wn * np.sqrt(1 - z * z))]

def test_eigenvalues_match_targets():
    for name, (A, B), poles in (("cart-pole", cartpole_AB(), [-3, -4, -5, -6]),
                                ("cart-pole, complex", cartpole_AB(), pair(4, 0.7) + pair(2, 0.9)),
                                ("crane", crane(), pair(0.8, 0.8) + pair(1.2, 0.7))):
        K = ackermann(A, B, poles)
        got = np.sort_complex(np.linalg.eigvals(A - B @ K)); want = np.sort_complex(np.array(poles, complex))
        Kref = place_poles(A, B, poles).gain_matrix
        print(f"{name:20s} K = {np.round(K.ravel(), 3)}  max eigenvalue error {np.abs(got - want).max():.1e}")
        assert np.abs(got - want).max() < 1e-6 and np.allclose(K, Kref, rtol=1e-6)

def test_crane_moves_without_sway():
    A, B = crane(); K = ackermann(A, B, pair(0.8, 0.8) + pair(1.2, 0.7))
    # move the trolley 10 m: feedback on x - 10
    Acl = A - B @ K; xr = np.array([10.0, 0, 0, 0]); dt = 0.05; E = expm(Acl * dt)
    e = -xr; xs = []
    for _ in range(int(30 / dt)): xs.append(e + xr); e = E @ e
    xs = np.array(xs)
    print(f"crane: 10 m move, max sway {np.degrees(np.abs(xs[:, 2]).max()):.1f} deg, sway after 15 s {np.degrees(np.abs(xs[300:, 2]).max()):.3f} deg, final x {xs[-1, 0]:.3f} m")
    assert abs(xs[-1, 0] - 10) < 0.01 and np.degrees(np.abs(xs[300:, 2]).max()) < 0.1
    # open loop the sway mode is undamped at sqrt((M+m)g/(ML))
    assert abs(np.abs(np.linalg.eigvals(A)).max() - np.sqrt(1500 * 9.81 / (500 * 8))) < 1e-9

test_eigenvalues_match_targets()
test_crane_moves_without_sway()
print("PASS")
