import numpy as np

V, R, k, I0 = 12.0, 1.2, 0.02, 0.15
Ts, w0, Is = k * V / R, V / k, V / R

def operating_point(TL):
    """Speed and current where the motor's output torque k(i - I0) meets the load."""
    i = TL / k + I0
    return (V - R * i) / k, i

w = np.linspace(0, w0, 200001)
P_ideal = Ts * (1 - w / w0) * w
i = (V - k * w) / R
eta = np.where(i > I0, k * (i - I0) * w / (V * i), 0)

if __name__ == "__main__":
    w_star = w[np.argmax(P_ideal)]
    print(f"peak power {P_ideal.max():.2f} W at {w_star:.1f} rad/s (w0/2 = {w0/2})")
    assert abs(w_star - w0 / 2) < 0.01 and abs(P_ideal.max() - V * V / (4 * R)) < 1e-6
    eta_max_formula = (1 - np.sqrt(I0 / Is)) ** 2
    print(f"peak efficiency {eta.max():.4f} (formula {eta_max_formula:.4f}) at i = {i[np.argmax(eta)]:.3f} A")
    assert abs(eta.max() - eta_max_formula) < 1e-6
    assert abs(i[np.argmax(eta)] - np.sqrt(I0 * Is)) < 1e-3
    # a load just below stall still runs, at the stall torque it stops
    w_op, _ = operating_point(0.9 * (Ts - k * I0))
    assert w_op > 0 and operating_point(Ts)[0] < 0
