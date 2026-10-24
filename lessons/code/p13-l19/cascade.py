import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5

def design(wi, ws, wp):
    Kps = J * ws / k
    return dict(Kpi=L * wi, Kii=R * wi, Kps=Kps, Kis=Kps * ws / 5, Kpp=wp)

def linearise(f, n):
    A = np.column_stack([f(e, 0.0) for e in np.eye(n)])  # the loops are linear, so columns are exact
    return A, f(np.zeros(n), 1.0)

def full_loop(g):                 # x = [i, w, th, Ii, Is], input th_ref
    def f(x, r):
        i, w, th, Ii, Is = x
        es = g["Kpp"] * (r - th) - w;  ir = g["Kps"] * es + Is
        ei = ir - i;                   V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i - k * w) / L, (k * i - b * w) / J, w, g["Kii"] * ei, g["Kis"] * es])
    return linearise(f, 5)

def speed_loop(g):                # x = [i, w, Ii, Is], input w_ref
    def f(x, r):
        i, w, Ii, Is = x
        es = r - w; ir = g["Kps"] * es + Is; ei = ir - i; V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i - k * w) / L, (k * i - b * w) / J, g["Kii"] * ei, g["Kis"] * es])
    return linearise(f, 4)

def current_loop(g):              # x = [i, Ii], rotor held, input i_ref
    def f(x, r):
        i, Ii = x; ei = r - i; V = g["Kpi"] * ei + Ii
        return np.array([(V - R * i) / L, g["Kii"] * ei])
    return linearise(f, 2)

def bandwidth(A, B, out):
    C = np.eye(len(B))[out]; I = np.eye(len(B)); w = np.logspace(0, 5, 4000)
    H = np.abs([C @ np.linalg.solve(1j * x * I - A, B) for x in w])
    return w[np.argmax(H < H[0] / np.sqrt(2))]          # first -3 dB crossing

def step_overshoot(g):
    A, B = full_loop(g)
    t = np.linspace(0, 10 / g["Kpp"], 5000)
    _, y, _ = signal.lsim((A, B[:, None], np.eye(5)[[2]], 0), np.ones_like(t), t)
    return y.max() - 1, y[-1]

def test_designed_cascade_is_stable():
    g = design(3000, 300, 30)
    A, _ = full_loop(g)
    eig = np.linalg.eigvals(A)
    print("closed-loop poles:", np.round(np.sort(eig.real), 1))
    assert np.all(eig.real < 0)
    os_, final = step_overshoot(g)
    print(f"position step: overshoot {os_:.2%}, final value {final:.4f}")
    assert os_ < 0.02 and abs(final - 1) < 1e-3

def test_bandwidths_match_design():
    g = design(3000, 300, 30)
    bi = bandwidth(*current_loop(g), 0); bs = bandwidth(*speed_loop(g), 1); bp = bandwidth(*full_loop(g), 2)
    print(f"measured bandwidths: current {bi:.0f}, speed {bs:.0f}, position {bp:.1f} rad/s")
    assert abs(bi / 3000 - 1) < 0.05
    assert 0.8 < bs / 300 < 1.5
    assert 0.8 < bp / 30 < 1.3
    assert bi / bs > 5 and bs / bp > 5                   # separation survives in the real loops

def test_poor_separation_rings():
    res = {}
    for sep in (10, 3, 1.5):
        res[sep] = step_overshoot(design(3000, 3000 / sep, 3000 / sep**2))[0]
    print("overshoot vs separation:", {s: f"{v:.1%}" for s, v in res.items()})
    assert res[10] < 0.02 and res[1.5] > 0.2

test_designed_cascade_is_stable()
test_bandwidths_match_design()
test_poor_separation_rings()
print("PASS")
