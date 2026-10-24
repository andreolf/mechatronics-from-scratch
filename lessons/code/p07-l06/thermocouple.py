import math

# NIST ITS-90 type K reference function, 0 to 1372 C, E in mV
C = [-0.176004136860e-01, 0.389212049750e-01, 0.185587700320e-04, -0.994575928740e-07, 0.318409457190e-09,
     -0.560728448890e-12, 0.560750590590e-15, -0.320207200030e-18, 0.971511471520e-22, -0.121047212750e-25]
A0, A1, A2 = 0.118597600000e+00, -0.118343200000e-03, 0.126968600000e+03

def E_k(t):
    return sum(c * t**i for i, c in enumerate(C)) + A0 * math.exp(A1 * (t - A2) ** 2)

def t_from_E(e, lo=0.0, hi=1372.0):
    for _ in range(60):                                   # bisection: E is monotonic on this range
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if E_k(mid) < e else (lo, mid)
    return (lo + hi) / 2

def thermocouple_temp(v_mV, t_cold):
    return t_from_E(v_mV + E_k(t_cold))

def pt100(t, R0=100.0, A=3.9083e-3, B=-5.775e-7):
    return R0 * (1 + A * t + B * t * t)

if __name__ == "__main__":
    table = {0: 0.000, 25: 1.000, 100: 4.096, 200: 8.138, 300: 12.209, 400: 16.397, 500: 20.644, 1000: 41.276}
    for t, e in table.items():
        assert abs(E_k(t) - e) < 0.0015, t
        assert abs(t_from_E(e) - t) < 0.5
    # cold-junction compensation
    for t_hot in (50, 150, 400, 800, 1200):
        for t_cold in (0, 20, 45):
            v = E_k(t_hot) - E_k(t_cold)                     # what the voltmeter sees
            assert abs(thermocouple_temp(v, t_cold) - t_hot) < 0.5
    v = 15.396
    with_cjc, without = thermocouple_temp(v, 25), t_from_E(v)
    print(f"15.396 mV, terminals at 25 C: {with_cjc:.1f} C with CJC, {without:.1f} C without")
    assert abs(with_cjc - 400) < 0.1 and 20 < with_cjc - without < 26
    # a linear 41 uV/K model is off by several kelvin somewhere in 0-1000 C
    worst_lin = max(abs(E_k(t) / 0.041 - t) for t in range(0, 1001, 10))
    assert worst_lin > 5
    assert abs(pt100(100) - 138.5055) < 1e-4
    print(f"linear-model worst error {worst_lin:.1f} K; PT100 at 100 C = {pt100(100):.2f} ohm")
