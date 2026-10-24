import numpy as np

V, R, m, k_spring, F0, g0, gr, L0, k = 24.0, 12.0, 0.02, 300.0, 2.0, 4e-3, 1e-3, 0.02, 1e-4

def L(x): return L0 + k / (g0 - x + gr)
def force(i, x): return k * i * i / (2 * (g0 - x + gr) ** 2)

def simulate(hold=True, I_hold=0.6, t_peak=0.03, T=0.12, dt=1e-5):
    x = v = psi = i = 0.0; P_hold = []; closed_at = None; dip = False; i_prev = 0.0
    for n in range(int(T / dt)):
        t = n * dt
        u = V if (not hold or t < t_peak or i < I_hold) else 0.0         # bang-bang chopper after t_peak
        psi += dt * (u - R * i); i = max(psi / L(x), 0.0)               # flux linkage carries the motion back-EMF
        a = (force(i, x) - (F0 + k_spring * x)) / m
        if (x <= 0 and a < 0) or (x >= g0 and a > 0): a, v = 0.0, 0.0
        v += a * dt; x = min(max(x + v * dt, 0.0), g0)
        if closed_at is None and x >= g0: closed_at = t
        if 0 < x < g0 and i < i_prev: dip = True
        i_prev = i
        if t > 0.06: P_hold.append(i * i * R)
    return dict(closed=x >= g0, closed_at=closed_at, P=np.mean(P_hold), dip=dip)

if __name__ == "__main__":
    cont = simulate(hold=False); ph = simulate(hold=True)
    print(f"continuous: {cont['P']:.1f} W, peak-and-hold: {ph['P']:.1f} W, pull-in after {1e3*ph['closed_at']:.1f} ms")
    assert cont["closed"] and ph["closed"] and ph["P"] < 0.5 * cont["P"]
    assert ph["dip"]                                         # the moving plunger makes the current dip
    i_min = np.sqrt(2 * (F0 + k_spring * g0) * gr ** 2 / k)
    print(f"minimum hold current {i_min:.3f} A")
    assert abs(i_min - 0.253) < 1e-3
    assert simulate(I_hold=1.3 * i_min)["closed"] and not simulate(I_hold=0.7 * i_min)["closed"]
    assert force(2.0, 0.0) > F0                               # strong enough to pull in from open
