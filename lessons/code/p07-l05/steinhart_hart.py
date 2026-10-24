import numpy as np

T25 = 298.15
def true_lnR(T):
    """The 'real' part, as a resistance table would give it (10 kOhm at 25 C)."""
    u = 1 / T - 1 / T25
    return np.log(1e4) + 3950 * u + 3e5 * u * u

def fit_sh(T_points):
    L = true_lnR(np.asarray(T_points))
    A = np.column_stack([np.ones_like(L), L, L**3])
    return np.linalg.solve(A, 1 / np.asarray(T_points))

def sh_T(abc, R):
    L = np.log(R)
    return 1 / (abc[0] + abc[1] * L + abc[2] * L**3)

def beta_T(beta, R):
    return 1 / (1 / T25 + np.log(R / 1e4) / beta)

def r_from_code(code, bits=12, Rf=10e3):
    return Rf * code / (2**bits - code)                       # thermistor on the low side of the divider

if __name__ == "__main__":
    K = 273.15
    print("R at 0, 25, 40, 80, 85 C:", np.exp(true_lnR(np.array([0, 25, 40, 80, 85]) + K)).round(0))
    abc = fit_sh([0 + K, 40 + K, 80 + K])
    T = np.linspace(0, 80, 801) + K
    R = np.exp(true_lnR(T))
    err_sh = np.abs(sh_T(abc, R) - T).max()
    beta = (true_lnR(25 + K) - true_lnR(85 + K)) / (1 / (25 + K) - 1 / (85 + K))
    err_beta = np.abs(beta_T(beta, R) - T).max()
    print(f"Steinhart-Hart A, B, C = {abc}, max error {err_sh:.3f} K; beta(25/85) = {beta:.0f} K, max error {err_beta:.2f} K")
    assert err_sh < 0.2 and err_beta > 1.0
    # through a 12-bit ratiometric divider at 30 C
    Rt = float(np.exp(true_lnR(30 + K)))
    code = round(4096 * Rt / (Rt + 10e3))
    T_meas = sh_T(abc, r_from_code(code)) - K
    assert abs(T_meas - 30) < 0.05
