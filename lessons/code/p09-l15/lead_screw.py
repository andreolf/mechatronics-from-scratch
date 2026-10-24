import numpy as np

def efficiency(lead, dm, mu):
    lam, phi = np.arctan(lead / (np.pi * dm)), np.arctan(mu)
    return np.tan(lam) / np.tan(lam + phi)

def back_efficiency(lead, dm, mu):
    lam, phi = np.arctan(lead / (np.pi * dm)), np.arctan(mu)
    return np.tan(lam - phi) / np.tan(lam) if lam > phi else 0.0

def push_force_balance(F, lam, mu):
    """Block on a ramp of angle lam, pushed horizontally by P, sliding up against friction.
    Unknowns [P, N]: sum of forces along the ramp and normal to it."""
    A = np.array([[np.cos(lam), -mu],               # P cos - F sin - mu N = 0
                  [-np.sin(lam), 1.0]])             # N - F cos - P sin = 0
    rhs = np.array([F * np.sin(lam), F * np.cos(lam)])
    P, N = np.linalg.solve(A, rhs)
    return P

def raise_torque(F, lead, dm, mu):
    lam = np.arctan(lead / (np.pi * dm))
    return push_force_balance(F, lam, mu) * dm / 2

if __name__ == "__main__":
    for lead, dm, mu in [(0.002, 0.012, 0.15), (0.005, 0.012, 0.005), (0.010, 0.020, 0.1), (0.04, 0.012, 0.2)]:
        T = raise_torque(500, lead, dm, mu)
        eta_energy = 500 * lead / (2 * np.pi * T)            # work out / work in over one turn
        print(f"lead {lead*1e3:.0f} mm, d {dm*1e3:.0f} mm, mu {mu}: T = {T:.3f} N*m, "
              f"eta {eta_energy:.4f} (formula {efficiency(lead, dm, mu):.4f}), back {back_efficiency(lead, dm, mu):.3f}")
        assert abs(eta_energy - efficiency(lead, dm, mu)) < 1e-12
    assert back_efficiency(0.002, 0.012, 0.15) == 0.0                     # self-locking
    assert efficiency(0.002, 0.012, 0.15) < 0.5
    assert back_efficiency(0.005, 0.012, 0.005) > 0.95                    # a ball screw back-drives
    # every self-locking geometry is below 50 % efficient
    lam = np.radians(np.linspace(0.1, 44, 400))
    for mu in (0.05, 0.1, 0.2):
        phi = np.arctan(mu); locking = lam < phi
        assert np.all(np.tan(lam[locking]) / np.tan(lam[locking] + phi) < 0.5)
