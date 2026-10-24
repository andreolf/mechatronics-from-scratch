import numpy as np

# an illustrative 50 kg quadruped standing still; feet relative to the centre of mass (m), body frame aligned with the ground
MASS, G, MU = 50.0, 9.81, 0.6
FEET = {"LF": (0.35, 0.25, -0.5), "RF": (0.35, -0.25, -0.5), "LH": (-0.35, 0.25, -0.5), "RH": (-0.35, -0.25, -0.5)}

def skew(r): return np.array([[0, -r[2], r[1]], [r[2], 0, -r[0]], [-r[1], r[0], 0]])

def wrench_matrix(feet):
    """6 x 3k: the net force and the net moment about the CoM produced by the foot forces f = [f1, f2, ...]"""
    return np.vstack([np.hstack([np.eye(3)] * len(feet)), np.hstack([skew(p) for p in feet])])

def gravity_in_ground_frame(slope_deg):
    """gravity seen in a frame tilted with a slope that rises along +x"""
    a = np.radians(slope_deg); return MASS * G * np.array([-np.sin(a), 0.0, -np.cos(a)])

def contact_forces(feet, slope_deg=0.0):
    """The base is unactuated: in a static stance the contact forces alone must cancel the weight (6 equations,
    3 unknowns per foot). Choose every foot's tangential force in proportion to its normal force, which uses the
    least friction possible, then take the minimum-norm normal forces that balance the wrench."""
    A = wrench_matrix(feet); w = gravity_in_ground_frame(slope_deg)
    b = np.concatenate([-w, np.zeros(3)])
    k = -w[:2] / -w[2]                                     # tangential / normal ratio needed overall: tan(slope)
    D = np.zeros((3 * len(feet), len(feet)))
    for i in range(len(feet)): D[3 * i:3 * i + 3, i] = [k[0], k[1], 1.0]
    fn = np.linalg.lstsq(A @ D, b, rcond=None)[0]
    F = (D @ fn).reshape(-1, 3)
    assert np.allclose(A @ F.ravel(), b), "no static balance with these feet"
    return F, A, b

def friction_ok(F, mu=MU):
    return all(f[2] > 0 and np.hypot(f[0], f[1]) <= mu * f[2] + 1e-12 for f in F)

def knee_torques(F, thigh=0.3, shank=0.3, hip_height=0.5):
    """each leg is a planar hip-knee chain in the sagittal plane with the foot under the hip:
    the ground pushes the foot with f, so the joints must supply tau = -J^T (-f) = J^T f to hold still."""
    c = hip_height / 2 / thigh; a = np.arccos(c)            # symmetric knee: thigh and shank make the same angle with vertical
    q_hip, q_knee = -np.pi / 2 + a, -2 * a                   # angles from the horizontal
    out = []
    for f in F:
        s1, c1, s12, c12 = np.sin(q_hip), np.cos(q_hip), np.sin(q_hip + q_knee), np.cos(q_hip + q_knee)
        J = np.array([[-thigh * s1 - shank * s12, -shank * s12], [thigh * c1 + shank * c12, shank * c12]])
        out.append(J.T @ np.array([f[0], f[2]]))
    return np.array(out)

def test_forces_balance_gravity():
    feet = list(FEET.values()); F, A, b = contact_forces(feet)
    print("flat ground, 4 feet: vertical forces", np.round(F[:, 2], 2), "N")
    assert np.allclose(A @ F.ravel(), b) and abs(F[:, 2].sum() - MASS * G) < 1e-9
    assert np.allclose(F[:, 2], MASS * G / 4) and np.allclose(F[:, :2], 0)        # symmetric stance: equal shares

def test_three_feet_statically_determinate():
    feet = [FEET[k] for k in ("LF", "RF", "LH")]                                 # right hind lifted
    F, A, b = contact_forces(feet)
    # vertical forces from three equations: sum = mg and zero moment about x and y; they are unique
    P = np.array([[1, 1, 1], [feet[0][1], feet[1][1], feet[2][1]], [feet[0][0], feet[1][0], feet[2][0]]])
    fz = np.linalg.solve(P, [MASS * G, 0, 0])
    print("right hind lifted: vertical forces LF, RF, LH", np.round(F[:, 2], 2), "N")
    assert np.allclose(A @ F.ravel(), b) and np.allclose(F[:, 2], fz)
    assert abs(fz[0]) < 1e-9          # the CoM sits on the RF-LH diagonal, so LF carries nothing: margin zero

def test_slope_and_friction():
    feet = list(FEET.values())
    for slope in (10, 25, 35):
        F, A, b = contact_forces(feet, slope)
        ratio = max(np.hypot(f[0], f[1]) / f[2] for f in F)
        print(f"{slope:2d} degree slope: normal forces front {F[0, 2]:.1f} N, hind {F[2, 2]:.1f} N, tangential/normal {ratio:.3f}, mu = {MU}: {'holds' if friction_ok(F) else 'slips'}")
        assert abs(ratio - np.tan(np.radians(slope))) < 1e-9 and F[2, 2] > F[0, 2]   # uphill feet (front) carry less
        assert np.allclose(A @ F.ravel(), b)
    assert friction_ok(contact_forces(feet, 25)[0]) and not friction_ok(contact_forces(feet, 35)[0])
    print(f"steepest slope it can stand on: {np.degrees(np.arctan(MU)):.1f} degrees")

def test_joint_torques():
    F, _, _ = contact_forces(list(FEET.values()))
    t = knee_torques(F)
    print("hip and knee torques per leg on flat ground:", np.round(t[0], 2), "N m")
    assert abs(t[0, 0]) < 1e-9 and abs(abs(t[0, 1]) - F[0, 2] * 0.3 * np.sqrt(1 - (0.25 / 0.3) ** 2)) < 1e-9   # foot under the hip: only the knee works, load times its lever arm

test_forces_balance_gravity()
test_three_feet_statically_determinate()
test_slope_and_friction()
test_joint_torques()
print("PASS")
