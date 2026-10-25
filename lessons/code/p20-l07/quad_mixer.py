import numpy as np

m, l, g = 1.0, 0.22, 9.81                   # quad of Phase 12 lesson 13: 1 kg, 0.22 m arms
I = np.diag([0.012, 0.012, 0.022])          # kg m^2
c = 0.016                                   # yaw torque per newton of thrust (m), from the propeller's torque/thrust ratio
F_MAX = 6.0                                 # maximum thrust per motor (N), illustrative
d = l / np.sqrt(2)                          # X frame: each motor sits d forward/back and d left/right of the centre

# motor i: position (x forward, y left) and spin direction (+1 = counter-clockwise seen from above)
MOTORS = [(+d, -d, +1), (-d, +d, +1), (+d, +d, -1), (-d, -d, -1)]   # front right, rear left, front left, rear right

def mixer_matrix():
    """rows: total thrust T, roll torque tx, pitch torque ty, yaw torque tz, as a function of the four thrusts f"""
    M = np.zeros((4, 4))
    for i, (x, y, s) in enumerate(MOTORS):
        M[:, i] = [1, y, -x, -s * c]          # tx = y f, ty = -x f (z up), tz = -s c f: a prop spinning CCW pushes the body CW
    return M

M = mixer_matrix(); Minv = np.linalg.inv(M)

def mix(T, tx, ty, tz):
    """wrench -> motor thrusts, with desaturation: keep thrust and roll/pitch, give up yaw first, then scale torques"""
    f = Minv @ [T, tx, ty, tz]
    if f.min() >= 0 and f.max() <= F_MAX: return f, "ok"
    f = Minv @ [T, tx, ty, 0]                 # 1. drop yaw
    if f.min() >= 0 and f.max() <= F_MAX:
        # put back as much yaw as fits
        dy = Minv @ [0, 0, 0, tz]; lo, hi = 0.0, 1.0
        for _ in range(30):
            k = (lo + hi) / 2; ff = f + k * dy
            lo, hi = (k, hi) if ff.min() >= 0 and ff.max() <= F_MAX else (lo, k)
        return f + lo * dy, f"yaw limited to {100 * lo:.0f} %"
    base = Minv @ [T, 0, 0, 0]; dt = f - base; lo, hi = 0.0, 1.0   # 2. scale roll/pitch
    for _ in range(30):
        k = (lo + hi) / 2; ff = base + k * dt
        lo, hi = (k, hi) if ff.min() >= 0 and ff.max() <= F_MAX else (lo, k)
    return base + lo * dt, f"roll/pitch limited to {100 * lo:.0f} %, no yaw"

def test_mixer():
    f_hover = Minv @ [m * g, 0, 0, 0]
    print("mixer matrix:\n", np.round(M, 4))
    print(f"hover: each motor {f_hover[0]:.4f} N ({100 * f_hover[0] / F_MAX:.1f} % of max)")
    assert np.allclose(f_hover, m * g / 4)
    assert np.allclose(M @ Minv, np.eye(4)) and np.allclose(Minv @ M, np.eye(4))
    rng = np.random.default_rng(1)
    for _ in range(1000):                               # round trip on random wrenches
        w = rng.normal(size=4); assert np.allclose(M @ (Minv @ w), w)
    tx = 0.1; f = Minv @ [m * g, tx, 0, 0]
    print(f"roll torque 0.1 N m: thrusts {np.round(f, 4)}, roll acceleration {tx / I[0, 0]:.2f} rad/s^2")
    tz = 0.05; f = Minv @ [m * g, 0, 0, tz]
    print(f"yaw torque 0.05 N m: thrusts {np.round(f, 4)}, yaw acceleration {tz / I[2, 2]:.2f} rad/s^2")
    dF = min(F_MAX - f_hover[0], f_hover[0])          # how far each motor can move while the total thrust stays mg
    print(f"max roll torque at hover: {4 * d * dF:.3f} N m (left pair +{dF:.4f} N, right pair -{dF:.4f} N)")

def test_desaturation():
    for w in [(m * g, 0.3, 0, 0.2), (2 * m * g, 0.5, 0.3, 0.3), (2.2 * m * g, 1.2, 0.8, 0.2)]:
        f, note = mix(*w); got = M @ f
        print(f"ask T {w[0]:.2f} tx {w[1]} ty {w[2]} tz {w[3]} -> f {np.round(f, 3)}, got T {got[0]:.2f} tx {got[1]:.3f} "
              f"ty {got[2]:.3f} tz {got[3]:.3f}: {note}")
        assert f.min() >= -1e-9 and f.max() <= F_MAX + 1e-9 and abs(got[0] - w[0]) < 1e-6

def simulate_roll_step(t_end=0.3, dt=1e-3):
    """rigid body roll axis only, motor lag 20 ms: 0.1 N m step, compare roll angle with tau t^2/(2 Ixx)"""
    phi = p = 0.0; f = Minv @ [m * g, 0, 0, 0]; f_cmd = Minv @ [m * g, 0.1, 0, 0]
    for _ in range(int(t_end / dt)):
        f += dt / 0.02 * (f_cmd - f); tx = (M @ f)[1]
        p += dt * tx / I[0, 0]; phi += dt * p
    ideal = 0.1 * t_end**2 / (2 * I[0, 0])
    print(f"roll after {t_end} s: {np.degrees(phi):.1f} deg (no motor lag: {np.degrees(ideal):.1f} deg)")
    assert 0.8 * ideal < phi < ideal

test_mixer(); test_desaturation(); simulate_roll_step(); print("PASS")
