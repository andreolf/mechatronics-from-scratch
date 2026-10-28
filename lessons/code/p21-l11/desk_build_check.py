import math
import numpy as np

G = 9.81
W, D, H, POLE, LIMIT, MASS = 0.8, 0.6, 0.5, 0.1, 5.0, 0.2       # desk frame, metres, newtons, kg hanging
A = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def capacity(p, t_max=LIMIT):
    v = A - p
    U = (v / np.linalg.norm(v, axis=1)[:, None]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [0, 0, G])
    n = np.linalg.svd(U)[2][-1]
    lo = max([-tau[i] / n[i] for i in range(4) if n[i] > 1e-12], default=-np.inf)
    hi = min([-tau[i] / n[i] for i in range(4) if n[i] < -1e-12], default=np.inf)
    if lo > hi:
        return 0.0
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) for i in range(4) for j in range(i + 1, 4) if abs(n[i] - n[j]) > 1e-12]
    return t_max / min(np.max(tau + c * n) for c in cands if lo - 1e-9 <= c <= hi + 1e-9)

def worst_in_layer(z, n=40):
    xs = -W/2 + W * (np.arange(n) + 0.5) / n
    ys = -D/2 + D * (np.arange(n) + 0.5) / n
    return min(capacity(np.array([x, y, z])) for x in xs for y in ys)

# 1. the workspace: where does 0.2 kg fit under a 5 N limit?
print(f"centre capacity: {capacity(np.array([0, 0, 0.1])):.2f} kg with the pivot at 0.1 m, {capacity(np.array([0, 0, 0.4])):.2f} kg at 0.4 m")
for z in (0.25, 0.4, 0.425):
    print(f"  worst point at pivot height {z} m: {worst_in_layer(z):.3f} kg")
assert abs(capacity(np.array([0, 0, 0.1])) - 1.274) < 0.002
assert worst_in_layer(0.4) > MASS > worst_in_layer(0.425)       # keep the pivot at or below 0.40 m

# 2. winch requirements from lessons 5 and 7, checked against a candidate spec
spool_r, holding_torque, microsteps, line_rating = 0.010, 0.40, 200 * 16, 20.0
v_max, line_needed = 0.2, math.dist((-W/2, -D/2, H), (W/2, D/2, 0))
checks = {
    "torque margin over the limit >= 4": holding_torque / spool_r / LIMIT >= 4,
    "speed for 0.2 m/s under 300 rpm": v_max / spool_r * 60 / (2 * math.pi) < 300,
    "resolution under 0.1 mm per microstep": 2 * math.pi * spool_r / microsteps < 1e-4,
    "line rated at least 3x the limit": line_rating >= 3 * LIMIT,
    "1.5 m of line covers the longest diagonal": 1.5 > line_needed,
    "one layer: 1.5 m on a 12 mm drum of 0.5 mm line": 1.5 / (2 * math.pi * spool_r) * 0.5e-3 < 0.012,
}
for k, ok in checks.items():
    print(f"  {'ok ' if ok else 'NO '} {k}")
assert all(checks.values())
assert abs(line_needed - 1.118) < 0.001

# 3. swing on a 10 cm pole
T = 2 * math.pi * math.sqrt(POLE / G)
print(f"swing period {T:.3f} s; a stop from 0.2 m/s swings {0.2 / math.sqrt(G / POLE) * 100:.1f} cm; ZV shaping adds {T / 2:.3f} s")
assert abs(T - 0.634) < 0.001 and abs(0.2 / math.sqrt(G / POLE) - 0.0202) < 0.0001

# 4. tension at rest in the middle: what the load cells should read
v = A - [0, 0, 0.2]; s = 0.3 / np.linalg.norm(v[0])
print(f"each line at rest in the middle: {MASS * G / (4 * s):.2f} N")
assert abs(MASS * G / (4 * s) - 0.953) < 0.002
print("PASS")
