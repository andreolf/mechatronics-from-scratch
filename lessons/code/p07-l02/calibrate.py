import numpy as np

rng = np.random.default_rng(4)
G_TRUE, O_TRUE, BOW, NOISE = 10_480.0, 1012.0, 30.0, 20.0     # counts/kg, counts, counts at mid-scale, counts rms

def load_cell(m):
    x = np.asarray(m) / 5.0
    return G_TRUE * np.asarray(m) + O_TRUE + BOW * 4 * x * (1 - x) + NOISE * rng.standard_normal(np.shape(m))

def fit(m, r, quadratic=False):
    cols = [m, np.ones_like(m)] + ([m**2] if quadratic else [])
    A = np.column_stack(cols)
    theta = np.linalg.solve(A.T @ A, A.T @ r)
    return theta, r - A @ theta

def invert(theta, r):
    if len(theta) == 2:
        g, o = theta
        return (r - o) / g
    g, o, q = theta                                            # q m^2 + g m + o = r
    return (-g + np.sqrt(g * g - 4 * q * (o - r))) / (2 * q)

if __name__ == "__main__":
    refs = np.linspace(0, 5, 11)
    r = load_cell(refs)
    two = np.array([(r[-1] - r[0]) / 5, r[0]])
    lin, res_lin = fit(refs, r)
    quad, res_q = fit(refs, r, quadratic=True)
    print("two-point g, o:", two.round(1), " least squares:", lin.round(1), " residual rms:", res_lin.std().round(1), "->", res_q.std().round(1))
    # the linear fit leaves a bow: residuals at the ends and middle have opposite signs
    assert res_lin[5] > 0 and res_lin[0] < 0 and res_lin[-1] < 0
    assert res_q.std() < res_lin.std()
    # check against the spec on fresh readings, each the mean of 16 samples: |error| < 0.1 % of full scale (5 g)
    test_m = rng.uniform(0, 5, 500)
    test_r = np.mean([load_cell(test_m) for _ in range(16)], axis=0)
    err = invert(quad, test_r) - test_m
    print(f"after quadratic calibration: max error {1000*np.abs(err).max():.2f} g")
    assert np.abs(err).max() < 0.005
    assert np.abs(invert(np.array([10_480.0, 1012.0]), 22_000) - 2.0027) < 1e-4
