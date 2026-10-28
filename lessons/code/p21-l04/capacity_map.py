import numpy as np, time

G = 9.81
def anchors(w, d, h):
    return np.array([[-w/2, -d/2, h], [w/2, -d/2, h], [w/2, d/2, h], [-w/2, d/2, h]])

def capacity(A, p, t_max):
    """largest hanging mass at pivot p with every tension in [0, t_max]"""
    v = A - p
    U = (v / np.linalg.norm(v, axis=1)[:, None]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [0, 0, G])            # tensions per kg, minimum norm
    n = np.linalg.svd(U)[2][-1]
    lo = max([-tau[i] / n[i] for i in range(4) if n[i] > 1e-12], default=-np.inf)
    hi = min([-tau[i] / n[i] for i in range(4) if n[i] < -1e-12], default=np.inf)
    if lo > hi:
        return 0.0                                             # no all-pulling solution: outside the workspace
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) for i in range(4) for j in range(i+1, 4) if abs(n[i] - n[j]) > 1e-12]
    peak = min(np.max(tau + c * n) for c in cands if lo - 1e-9 <= c <= hi + 1e-9)
    return t_max / peak

A = anchors(7, 7, 3)
c0 = capacity(A, np.array([0, 0, 0.5]), 28)
s = 2.5 / np.sqrt(24.5 + 2.5**2)
assert abs(c0 - 4 * 28 * s / G) < 1e-9                       # centre: four equal lines, m = 4 T sin(theta) / g
print(f"centre, gripper on the floor: {c0:.2f} kg at 28 N")
for p, want in [((1.0, -0.5, 0.9), 3.91), ((3.0, -0.5, 0.9), 3.17), ((3.4, 0, 2.9), 0.165), ((0, 0, 2.5), 1.15)]:
    c = capacity(A, np.array(p), 28); print(p, f"{c:.3f} kg"); assert abs(c - want) < 0.006
assert capacity(A, np.array([4.0, 0, 1.0]), 28) == 0          # beyond the footprint
t0 = time.time()
xs = (np.arange(24) + 0.5) / 24 * 7 - 3.5
zs = 0.5 + (np.arange(12) + 0.5) / 12 * 2.4
caps = np.array([[[capacity(A, np.array([x, y, z]), 28) for x in xs] for y in xs] for z in zs])
print(f"mean over pivot heights 0.5-2.9 m: {caps.mean():.2f} kg ({time.time()-t0:.1f} s)")
for z, layer in zip(zs[::3], caps[::3]):
    print(f"  z = {z:.1f} m: min {layer.min():.2f}, mean {layer.mean():.2f}, max {layer.max():.2f} kg")

assert 2.2 < caps.mean() < 2.45
# near the floor the centre is best; near the ceiling it is the worst place in the room
assert capacity(A, np.array([0, 0, 0.6]), 28) > capacity(A, np.array([3.2, 3.2, 0.6]), 28)
assert capacity(A, np.array([0, 0, 2.8]), 28) < capacity(A, np.array([3.2, 3.2, 2.8]), 28)
# capacity is linear in the limit: halve the allowed tension, halve the payload
assert abs(capacity(A, np.array([1.0, -0.5, 0.9]), 14) * 2 - capacity(A, np.array([1.0, -0.5, 0.9]), 28)) < 1e-9
# what working tension would give 2 kg at the floor centre, and 1.25 kg on average?
print(f"tension for 2 kg at the floor centre: {28 * 2 / c0:.1f} N; for a 1.25 kg mean: {28 * 1.25 / caps.mean():.1f} N")
print("PASS")
