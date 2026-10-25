import numpy as np

def mosfet_loss(Tj, I=25.0, rds25=8e-3, alpha=0.0045, D=0.5, V=24.0, t_sw=20e-9, fs=100e3, qg=30e-9, vg=10.0):
    """losses of a hard-switched MOSFET: conduction rises with junction temperature, switching does not (simplified)"""
    rds = rds25 * (1 + alpha * (Tj - 25))                                   # on-resistance grows about 0.45 %/K
    return {"conduction": D * I**2 * rds, "switching": 0.5 * V * I * 2 * t_sw * fs, "gate": qg * vg * fs}

def junction_temp(theta, Ta=40.0, **kw):
    """solve Tj = Ta + P(Tj) * theta_total by fixed-point iteration; None if it never settles (thermal runaway)"""
    Tj = Ta
    for _ in range(200):
        Tn = Ta + sum(mosfet_loss(Tj, **kw).values()) * theta
        if Tn > 400: return None
        if abs(Tn - Tj) < 1e-9: return Tn
        Tj = Tn
    return None

def heatsink_needed(Tmax=125.0, margin=25.0, theta_jc=0.8, theta_cs=0.5, Ta=40.0, **kw):
    """largest heatsink-to-ambient resistance that keeps Tj below Tmax - margin"""
    Tt = Tmax - margin; P = sum(mosfet_loss(Tt, **kw).values())          # losses at the target temperature
    return (Tt - Ta) / P - theta_jc - theta_cs, P

def transient(P, R=(0.3, 0.5, 2.5), tau=(1e-3, 0.05, 30.0), t=np.array([1e-3, 0.01, 0.1, 1, 10, 100, 300])):
    """Foster thermal network: the junction rise after a power step is a sum of RC exponentials"""
    return np.array([sum(P * r * (1 - np.exp(-ti / ta)) for r, ta in zip(R, tau)) for ti in t]), t

def test_losses_and_heatsink():
    loss = mosfet_loss(100.0); print("losses at Tj = 100 C:", {k: round(v, 3) for k, v in loss.items()}, f"total {sum(loss.values()):.3f} W")
    th, P = heatsink_needed()
    Tj = junction_temp(0.8 + 0.5 + th)
    print(f"heatsink needed: theta_sa <= {th:.2f} K/W (at {P:.2f} W); with it Tj settles at {Tj:.2f} C")
    assert Tj is not None and Tj <= 100.0 + 1e-6

def test_no_heatsink_and_runaway():
    Tj = junction_temp(62.0)                                                 # a TO-220 in free air, about 62 K/W
    print(f"no heatsink (62 K/W): {'no equilibrium below 400 C: the part is destroyed' if Tj is None else f'Tj = {Tj:.1f} C'}")
    small = junction_temp(62.0, I=3.0); print(f"no heatsink at 3 A: Tj = {small:.1f} C")
    assert Tj is None and small < 125

def test_transient():
    rise, t = transient(5.0)
    print("junction rise after a 5 W step:", ", ".join(f"{ti:g} s {r:.2f} K" for ti, r in zip(t, rise)))
    assert np.all(np.diff(rise) > 0) and abs(rise[-1] - 5 * 3.3) < 0.5

test_losses_and_heatsink()
test_no_heatsink_and_runaway()
test_transient()
print("PASS")
