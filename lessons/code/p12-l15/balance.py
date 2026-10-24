import numpy as np
from scipy.integrate import solve_ivp

f0, I, Q = 4.0, 1e-9, 250.0
w0 = 2 * np.pi * f0; kap = I * w0 ** 2; c = I * w0 / Q
DAY = 86400

def run(A, th_i=0.0, eps=0.0, nimp=60):
    """balance wheel kicked with energy E_i each time it passes theta = -th_i on its way to the centre"""
    E = np.pi * c * w0 * A ** 2 / 2
    rhs = lambda t, s: [s[1], -(kap * (s[0] + eps * s[0] ** 3) + c * s[1]) / I]
    s, t, times, amp = np.array([A, 0.0]), 0.0, [], 0.0
    for _ in range(nimp):
        d = -int(np.sign(s[1])) if s[1] != 0 else (-1 if s[0] > 0 else 1)   # direction of the next swing
        ev = lambda t, s: s[0] + d * th_i
        ev.terminal, ev.direction = True, d
        sol = solve_ivp(rhs, (t, t + 1), s, events=ev, rtol=1e-12, atol=1e-15, method="DOP853")
        t, s = sol.t_events[0][0], sol.y_events[0][0].copy()
        s[1] = d * np.sqrt(s[1] ** 2 + 2 * E / I)                             # the escapement's kick
        times.append(t); amp = np.max(np.abs(sol.y[0]))
    times = np.array(times)
    period = np.mean(times[22::2] - times[20:-2:2])
    return DAY * (1 / f0 / period - 1), np.degrees(amp)

def test_centre_impulse_isochronous():
    rates = {}
    for A in (200, 270, 300):
        rate, amp = run(np.radians(A))
        rates[A] = rate
        print(f"kick at centre, amplitude {amp:5.1f} deg: rate {rate:+.4f} s/day")
        assert abs(amp - A) < 1.5                             # energy balance sets the amplitude
    spread = max(rates.values()) - min(rates.values())
    assert spread < 1e-3                                      # period independent of amplitude
    assert abs(rates[270] + DAY * (1 / (2 * Q)) ** 2 / 2) < 1e-3   # only the damping offset remains

def test_off_centre_impulse_not_isochronous():
    r200, _ = run(np.radians(200), th_i=np.radians(10))
    r300, _ = run(np.radians(300), th_i=np.radians(10))
    print(f"kick 10 deg before centre: {r200:+.2f} s/day at 200 deg, {r300:+.2f} s/day at 300 deg")
    assert r200 > r300 > 0                                     # gains, and less so at large amplitude (Airy)

def test_nonlinear_spring():
    eps = 1e-3
    r200, _ = run(np.radians(200), eps=eps)
    r300, _ = run(np.radians(300), eps=eps)
    pred = 3 / 8 * eps * (np.radians(300) ** 2 - np.radians(200) ** 2) * DAY
    print(f"cubic spring: rate changes by {r300 - r200:.0f} s/day from 200 to 300 deg (Lindstedt {pred:.0f})")
    assert abs((r300 - r200) - pred) / pred < 0.05

test_centre_impulse_isochronous()
test_off_centre_impulse_not_isochronous()
test_nonlinear_spring()
print("PASS")
