import numpy as np
from scipy import signal

LOOPS = {   # name: (num, den) of L(s)
    "type 0": ([10], np.polymul([1, 1], [1, 2])),
    "type 1": ([10], np.polymul([1, 0], np.polymul([1, 2], [1, 5]))),
    "type 2": ([10, 10], np.polymul([1, 0, 0], [1, 5])),
}

def system_type(den):
    den = np.trim_zeros(np.array(den, float), "f")
    return len(den) - len(np.trim_zeros(den, "b"))

def error_constants(num, den):
    N = system_type(den)
    d = np.trim_zeros(np.array(den, float), "b")          # divide out s^N
    k0 = np.polyval(num, 0) / np.polyval(d, 0)
    consts = []
    for m in range(3):                                    # K_p, K_v, K_a = lim s^m L
        consts.append(np.inf if m < N else (k0 if m == N else 0.0))
    return N, consts

def predicted_errors(num, den):
    _, (Kp, Kv, Ka) = error_constants(num, den)
    inv = lambda K: 0.0 if np.isinf(K) else (np.inf if K == 0 else 1 / K)
    return [1 / (1 + Kp) if not np.isinf(Kp) else 0.0, inv(Kv), inv(Ka)]

def simulated_error(num, den, kind, T=80.0):
    cl_den = np.polyadd(den, num)
    assert np.all(np.roots(cl_den).real < 0)
    t = np.linspace(0, T, 40001)
    r = [np.ones_like(t), t, t ** 2 / 2][kind]
    E = signal.lti(den, cl_den)                         # E/R = 1/(1 + L) = den/(den + num)
    _, e, _ = signal.lsim(E, r, t)
    return e[-1], e[-4000]

def test_types_and_constants():
    assert [system_type(d) for _, d in LOOPS.values()] == [0, 1, 2]
    assert error_constants(*LOOPS["type 0"])[1][0] == 5
    assert error_constants(*LOOPS["type 1"])[1][1] == 1
    assert error_constants(*LOOPS["type 2"])[1][2] == 2

def test_matches_simulation():
    names = ["step", "ramp", "parabola"]
    for name, (num, den) in LOOPS.items():
        pred = predicted_errors(num, den)
        for kind in range(3):
            e_end, e_before = simulated_error(num, den, kind)
            if np.isinf(pred[kind]):
                assert e_end > e_before + 0.5                    # keeps growing
                desc = "grows without bound"
            else:
                assert abs(e_end - pred[kind]) < 1e-3, (name, kind, e_end, pred[kind])
                desc = f"{e_end:.4f} (predicted {pred[kind]:.4f})"
            print(f"{name}, {names[kind]:8s}: error {desc}")

test_types_and_constants()
test_matches_simulation()
print("PASS")
