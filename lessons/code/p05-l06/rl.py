import math

def turn_on(V, R, L, t):
    return V / R * (1 - math.exp(-t * R / L))

def flyback(I0, R, L, Vd, dt=1e-7):
    """Integrate L di/dt = -(R i + Vd) until the current reaches zero."""
    i, t, energy_diode = I0, 0.0, 0.0
    while i > 0:
        di = -(R * i + Vd) / L * dt
        energy_diode += Vd * i * dt
        i += di; t += dt
    return t, energy_diode

if __name__ == "__main__":
    V, R, L = 12.0, 10.0, 0.05
    tau = L / R
    t1 = tau * math.log(6)
    assert abs(turn_on(V, R, L, t1) - 1.0) < 1e-12 and abs(t1 - 8.9588e-3) < 1e-6
    assert abs(0.5 * L * 1.2**2 - 0.036) < 1e-12
    t_off, e_d = flyback(1.2, R, L, 0.7)
    print(f"flyback decay {t_off*1e3:.2f} ms (formula {tau*math.log(1+12/0.7)*1e3:.2f} ms)")
    assert abs(t_off - tau * math.log(1 + 1.2 * R / 0.7)) < 1e-5
    # energy balance: coil energy = diode heat + resistor heat
    i, t, e_r = 1.2, 0.0, 0.0
    while i > 0:
        e_r += R * i * i * 1e-7
        i -= (R * i + 0.7) / L * 1e-7
    assert abs(e_r + e_d - 0.036) < 1e-4
    assert abs(L * 1.2 / 1e-6 - 60_000) < 1e-6
