import numpy as np

V, L, R, Vd = 24.0, 1e-3, 1.0, 0.7

def simulate(D, f, td=0.0, E=None, periods=60, n=2000):
    """Left leg PWM (Q1/Q2), right leg low side Q4 always on. Returns the last period's current."""
    T = 1 / f; dt = T / n
    if E is None:
        E = D * V - R * 2.0                       # back-EMF that gives about 2 A average
    i = 2.0; last = []
    for k in range(periods * n):
        ph = (k % n) / n
        q1 = td / T <= ph < D                     # Q1 turns on td after the period starts
        q2 = D + td / T <= ph < 1.0               # Q2 turns on td after Q1 turns off
        if q1: v = V
        elif q2: v = 0.0
        else: v = -Vd if i > 0 else V + Vd       # dead time: a body diode carries the current
        i += dt * (v - R * i - E) / L
        if k >= (periods - 1) * n: last.append(i)
    return np.array(last)

if __name__ == "__main__":
    for D in (0.25, 0.5, 0.75):
        i = simulate(D, 20e3)
        rip = i.max() - i.min(); est = V * D * (1 - D) / (L * 20e3)
        print(f"D = {D}: ripple {rip:.4f} A, formula {est:.4f} A")
        assert abs(rip - est) / est < 0.03
    # ripple halves when the frequency doubles
    r20 = np.ptp(simulate(0.5, 20e3)); r40 = np.ptp(simulate(0.5, 40e3))
    assert abs(r20 / r40 - 2) < 0.05
    # dead time steals about td*f*(V+Vd) of average voltage when the current is positive
    E = 0.5 * V - 2.0
    i0 = simulate(0.5, 20e3, td=0.0, E=E).mean(); i1 = simulate(0.5, 20e3, td=0.5e-6, E=E).mean()
    lost = (i0 - i1) * R
    print(f"voltage lost to 0.5 us dead time: {lost:.3f} V")
    assert abs(lost - 0.5e-6 * 20e3 * (V + Vd)) < 0.02
