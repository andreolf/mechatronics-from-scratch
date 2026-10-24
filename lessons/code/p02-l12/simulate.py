import math
import numpy as np

def rk4_step(f, t, x, u, h):
    k1 = f(t, x, u); k2 = f(t + h/2, x + h/2*k1, u); k3 = f(t + h/2, x + h/2*k2, u); k4 = f(t + h, x + h*k3, u)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

def simulate(f, x0, u_fn, t, step=rk4_step):
    """Integrate x' = f(t, x, u) on the time grid t, with input u = u_fn(t, x) held over each step."""
    X = np.empty((len(t), len(x0))); X[0] = x0
    for k in range(len(t) - 1):
        u = u_fn(t[k], X[k])
        X[k + 1] = step(f, t[k], X[k], u, t[k + 1] - t[k])
    return X

R, L, kt, ke, J, b = 1.0, 0.5e-3, 0.05, 0.05, 1e-5, 1e-6
def dc_motor(t, x, u):
    i, w = x; V, tauL = u
    return np.array([(V - R*i - ke*w) / L, (kt*i - b*w - tauL) / J])

if __name__ == "__main__":
    t = np.linspace(0, 0.05, 5001)
    X = simulate(dc_motor, np.zeros(2), lambda t, x: (12.0, 0.0), t)
    w_ss = kt*12 / (R*b + kt*ke)
    assert abs(X[-1, 1] - w_ss) < 1e-3 * w_ss and abs(X[-1, 0] - b*w_ss/kt) < 1e-4
    A = np.array([[-R/L, -ke/L], [kt/J, -b/J]])
    print("eigenvalues", np.sort(np.linalg.eigvals(A).real), f"ω_ss = {w_ss:.1f} rad/s")
    # reproduce lesson 5 (RC step) and lesson 6 (mass-spring-damper)
    t5 = np.linspace(0, 5, 501)
    rc = simulate(lambda t, x, u: (u - x) / 1.0, np.zeros(1), lambda t, x: 5.0, t5)
    assert abs(rc[:, 0] - 5*(1 - np.exp(-t5))).max() < 1e-6
    t6 = np.linspace(0, 3, 30001)
    m, c, k = 0.5, 4.0, 200.0
    msd = simulate(lambda t, x, u: np.array([x[1], (u - c*x[1] - k*x[0]) / m]), np.zeros(2), lambda t, x: 1.0, t6)
    zeta = c / (2*math.sqrt(k*m))
    assert abs(msd[:, 0].max()*k - 1 - math.exp(-zeta*math.pi/math.sqrt(1 - zeta**2))) < 1e-4
