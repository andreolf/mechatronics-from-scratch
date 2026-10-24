import numpy as np
from scipy.optimize import curve_fit

TRUE = dict(R=1.2, L=0.6e-3, k=0.02, J=3e-6, b=2e-6, Tc=4e-4)
rng = np.random.default_rng(3)

def no_load(V, p):
    w = (V - p["R"] * p["Tc"] / p["k"]) / (p["k"] + p["R"] * p["b"] / p["k"])
    return w, (p["b"] * w + p["Tc"]) / p["k"]

# --- synthetic bench data, with noise ---
t1 = np.arange(0, 5e-3, 1e-5)
i_locked = 1.0 / TRUE["R"] * (1 - np.exp(-t1 * TRUE["R"] / TRUE["L"])) + 0.005 * rng.standard_normal(t1.size)
nl = {V: no_load(V, TRUE) for V in (6.0, 12.0)}
meas = {V: (w * (1 + 0.002 * rng.standard_normal()), i * (1 + 0.005 * rng.standard_normal())) for V, (w, i) in nl.items()}
w0 = nl[12.0][0]
tau = TRUE["J"] / TRUE["b"]; wc = TRUE["Tc"] / TRUE["b"]
t3 = np.arange(0, 3, 0.01)
w_sd = np.maximum((w0 + wc) * np.exp(-t3 / tau) - wc, 0)
keep = w_sd > 20
t3, w_sd = t3[keep], w_sd[keep] + 2.0 * rng.standard_normal(keep.sum())

# --- identification ---
(I_inf, tau_e), _ = curve_fit(lambda t, a, c: a * (1 - np.exp(-t / c)), t1, i_locked, p0=[1, 1e-3])
R = 1.0 / I_inf
L = tau_e * R
k = np.mean([(V - R * i) / w for V, (w, i) in meas.items()])
(wa, ia), (wb, ib) = meas[6.0], meas[12.0]
b = k * (ib - ia) / (wb - wa)
Tc = k * ia - b * wa
(A, tau_fit, B), _ = curve_fit(lambda t, A, c, B: A * np.exp(-t / c) - B, t3, w_sd, p0=[w0, 1, 100])
J = b * tau_fit
est = dict(R=R, L=L, k=k, J=J, b=b, Tc=Tc)

if __name__ == "__main__":
    for name, v in est.items():
        err = 100 * (v - TRUE[name]) / TRUE[name]
        print(f"{name:>2} = {v:.4g} (true {TRUE[name]:.4g}, {err:+.1f} %)")
        assert abs(err) < 5, name
