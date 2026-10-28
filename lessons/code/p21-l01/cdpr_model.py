import numpy as np

# A room-scale CDPR: anchors at the top corners of a W x D x H room, one pivot, a gripper on a pole below it.
W, D, H = 7.0, 7.0, 3.0          # metres (Neufangled's example room)
POLE = 0.5                       # gripper hangs 0.5 m below the pivot
anchors = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def lengths(pivot):
    return np.linalg.norm(anchors - pivot, axis=1)

gripper = np.array([0.0, 0.0, 1.0])
pivot = gripper + [0, 0, POLE]
L = lengths(pivot)
print("line lengths at the centre:", np.round(L, 3))
assert np.allclose(L, np.sqrt(3.5**2 + 3.5**2 + 1.5**2))

# degrees of freedom and redundancy
dof, cables = 3, len(anchors)
print(f"{cables} cables for {dof} DOF: redundancy {cables - dof}")
assert cables - dof == 1

# can positive tensions hold the weight? only if 'straight up' lies inside the cone of the cable directions
u = (anchors - pivot) / L[:, None]
t, *_ = np.linalg.lstsq(u.T, np.array([0, 0, 9.81]), rcond=None)   # minimum-norm solution of U t = m g z
assert np.all(t > 0) and np.allclose(u.T @ t, [0, 0, 9.81])
print("tensions holding 1 kg at the centre (N):", np.round(t, 3))

# the brochure check
room = W * D * H
arm = 2 / 3 * np.pi * 0.75**3
per_k_room, per_k_arm = room / 0.795, arm / 2.5
print(f"volume per $1000: room {per_k_room:.1f} m^3, arm {per_k_arm:.3f} m^3, ratio {per_k_room / per_k_arm:.0f}")
assert round(per_k_room) == 185 and abs(per_k_arm - 0.35) < 0.01 and 480 < per_k_room / per_k_arm < 560
print(f"28 N is the weight of {28 / 9.81:.2f} kg")
print("PASS")
