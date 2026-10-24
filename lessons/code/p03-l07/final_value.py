import numpy as np
from scipy import signal

def final_value(num, den, inp="step"):
    """lim s->0 s*G(s)*R(s); returns None if the response doesn't settle."""
    k = {"impulse": 0, "step": 1, "ramp": 2}[inp]
    d = np.polymul(den, [1] + [0] * k)             # G(s)/s^k
    if k:                                          # multiply by s: cancel one s from the denominator
        sX_num, sX_den = np.asarray(num, float), np.polydiv(d, [1, 0])[0]
    else:                                          # impulse: multiply the numerator by s
        sX_num, sX_den = np.polymul(num, [1, 0]), np.asarray(d, float)
    # cancel common factors of s
    while abs(sX_num[-1]) < 1e-15 and abs(sX_den[-1]) < 1e-15:
        sX_num, sX_den = sX_num[:-1], sX_den[:-1]
    if np.any(np.roots(sX_den).real >= -1e-12):
        return None                                # pole on or right of the axis: FVT invalid
    return np.polyval(sX_num, 0) / np.polyval(sX_den, 0)

if __name__ == "__main__":
    assert abs(final_value([10], [1, 3, 2]) - 5) < 1e-12
    t = np.linspace(0, 20, 4001)
    _, y = signal.step(([10], [1, 3, 2]), T=t)
    assert abs(y[-1] - 5) < 1e-6
    assert final_value([1], [1, -1]) is None         # unstable: FVT would say -1
    assert final_value([1], [1, 0, 4]) is None       # undamped oscillator
    assert abs(final_value([10], [1, 3, 2], "impulse")) < 1e-12   # impulse response decays to 0
    # motor speed loop: error transfer 1/(1+L), L = 0.5*G
    G_num, G_den = [0.05], [1e-7, 1.0001e-4, 2.51e-3]
    E_num, E_den = G_den, np.polyadd(G_den, 0.5 * np.array(G_num))
    ess = final_value(E_num, E_den)
    print(f"steady-state error {100*ess:.2f} %")
    assert abs(ess - 0.09124) < 1e-4
    # PI: L = (0.5 s + 5)/s * G ; ramp error = 1 / (5 * G(0))
    L_num, L_den = np.polymul([0.5, 5], G_num), np.polymul([1, 0], G_den)
    E_num, E_den = L_den, np.polyadd(L_den, L_num)
    assert abs(final_value(E_num, E_den, "step")) < 1e-12
    assert abs(final_value(E_num, E_den, "ramp") - 1 / (5 * 0.05 / 2.51e-3)) < 1e-9
