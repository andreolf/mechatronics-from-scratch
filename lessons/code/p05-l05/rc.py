import math
import numpy as np

def rc_charge(V, R, C, t):
    return V * (1 - np.exp(-t / (R * C)))

def simulate(V, R, C, T, dt):
    """Integrate RC dv/dt = V - v with small explicit steps; also integrate resistor heating."""
    v, heat = 0.0, 0.0
    for _ in range(int(T / dt)):
        i = (V - v) / R
        heat += i * i * R * dt
        v += i / C * dt
    return v, heat

if __name__ == "__main__":
    R, C, V = 10e3, 10e-6, 3.3
    tau = R * C
    t70 = -tau * math.log(0.3)
    assert abs(t70 - 0.12040) < 1e-5 and abs(rc_charge(V, R, C, t70) - 0.7 * V) < 1e-12
    assert abs(rc_charge(1, 1, 1, 1.0) - 0.632) < 1e-3 and abs(rc_charge(1, 1, 1, 5.0) - 0.993) < 1e-3
    v, heat = simulate(V, R, C, 2.0, 1e-5)
    E_cap = 0.5 * C * v * v
    print(f"after 20 tau: v = {v:.5f} V, stored {E_cap*1e6:.2f} uJ, resistor heat {heat*1e6:.2f} uJ")
    assert abs(v - V) < 1e-6 and abs(E_cap - 54.45e-6) < 1e-8
    assert abs(heat / E_cap - 1) < 1e-3                 # half the delivered energy is lost
    # the loss doesn't depend on R
    _, heat2 = simulate(V, 100.0, C, 0.02, 1e-7)
    assert abs(heat2 / E_cap - 1) < 1e-3
