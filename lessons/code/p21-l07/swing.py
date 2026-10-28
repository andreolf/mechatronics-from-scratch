import numpy as np

G, POLE = 9.81, 0.5
w = np.sqrt(G / POLE)
T = 2 * np.pi / w
print(f"pendulum on a {POLE} m pole: period {T:.3f} s")
assert abs(T - 1.419) < 0.001

def run(pivot_acc, t_end, l=POLE, d0=0.0, v0=0.0, dt=1e-4, air=0.0):
    """linearised swing seen from the pivot: d'' = -(g/l) d - a_pivot. d is the gripper's offset, in metres."""
    d, v, out = d0, v0, []
    for k in range(int(t_end / dt)):
        a = pivot_acc(k * dt, d, v)
        v += (-(G / l) * d - a - air * v) * dt
        d += v * dt
        out.append(d)
    return np.array(out)

# 1. a sudden stop from 0.4 m/s leaves a swing of v / omega
amp = 0.4 / w
assert abs(amp - 0.0903) < 0.0005
print(f"sudden stop from 0.4 m/s: {amp*100:.1f} cm swing, {np.degrees(np.arcsin(amp / POLE)):.1f} degrees")

# 2. a 2 m move with 1.5 m/s^2 ramps, then the same move through a zero-vibration (ZV) shaper
def trapezoid(t, amax=1.5, vmax=0.4, dist=2.0):
    ta = vmax / amax; tc = dist / vmax - ta
    if t < 0: return 0.0
    if t < ta: return amax
    if t < ta + tc: return 0.0
    if t < 2 * ta + tc: return -amax
    return 0.0
t_move = 2 * (0.4 / 1.5) + (2.0 / 0.4 - 0.4 / 1.5)
def residual(acc, l=POLE):
    d = run(lambda t, d, v: acc(t), t_move + T + 4, l=l)
    return np.abs(d[int((t_move + T) / 1e-4):]).max()
plain = residual(trapezoid)
zv = lambda t: 0.5 * trapezoid(t) + 0.5 * trapezoid(t - T / 2)   # two half-size copies, half a period apart
shaped = residual(zv)
shaped_wrong_pole = residual(zv, l=0.55)                             # shaper tuned for 0.5 m, real pole 0.55 m
print(f"2 m move: residual swing {plain*100:.1f} cm plain, {shaped*1000:.2f} mm shaped, "
      f"{shaped_wrong_pole*100:.1f} cm shaped for the wrong pole; shaping costs {T/2:.2f} s")
assert plain > 0.15 and shaped < 0.0005 and 0.005 < shaped_wrong_pole < 0.03

# 3. feedback: accelerate the pivot towards the swing, a = kp d + kd d'
kp, kd = 0.5 * w**2, 0.9 * w
zeta = kd / (2 * np.sqrt(w**2 + kp))
print(f"PD on pivot acceleration alone: zeta = {zeta:.2f}")
assert abs(zeta - 0.367) < 0.001
# with the position loop that pulls the pivot back to its target (kx = 1/s, kv = 4/s) and kp acting on d minus a
# 2 s low-pass of d (so a steady lean is not chased): five states per axis, xp, vp, d, d', dbar
for l in (0.1, 0.25, 0.5, 1.0):
    ww = G / l; p, dd, tau = 0.5 * ww, 0.9 * np.sqrt(ww), 2.0
    A = np.array([[0, 1, 0, 0, 0], [-4, -4, p, dd, -p], [0, 0, 0, 1, 0], [4, 4, -ww - p, -dd, p], [0, 0, 1 / tau, 0, -1 / tau]])
    ev = np.linalg.eigvals(A)
    swing = -ev[np.abs(ev.imag) > 1e-9].real.max()
    print(f"  pole {l} m: oscillating modes decay at {swing:.2f} /s or faster, slowest of all {-ev.real.max():.2f} /s")
    assert ev.real.max() < -0.4 and (swing > 1.3 or l == 1.0)
d = run(lambda t, d, v: kp * d + kd * v, 6, d0=amp)
settled = np.where(np.abs(d) > 0.01)[0].max() * 1e-4
free = run(lambda t, d, v: 0.0, 6, d0=amp, air=0.02)
print(f"9 cm swing: below 1 cm for good after {settled:.2f} s with damping; after 6 s without it is still {np.abs(free[-15000:]).max()*100:.1f} cm")
assert settled < 2.0 and np.abs(free[-15000:]).max() > 0.08
print("PASS")
