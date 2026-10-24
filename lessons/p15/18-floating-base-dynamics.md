---
id: p15-l18
minutes: 45
summary: A legged robot is not bolted to the ground, so its base has six degrees of freedom that no motor drives directly, and only the contact forces at its feet can hold it up. You derive the floating-base equations and the six-equation balance the feet must satisfy, compute the contact forces of a standing quadruped on flat ground, on three feet and on a slope with a friction cone, find the joint torques that produce them, and test that the forces always balance gravity.
---

## The floating base

An arm's base is fixed, so its configuration is just the joint angles. A walking robot's configuration also includes where its body is and how it is oriented: 6 more coordinates for the **floating base**. For a quadruped with 3 joints per leg, $q$ has $6 + 12 = 18$ entries. The equations of motion look like an arm's, with two changes:

$$M(q)\dot\nu + h(q, \nu) = S^T\tau + J_c^T(q)\,f.$$

1. $S^T = \begin{bmatrix}0_{6 \times 12}\\ I_{12}\end{bmatrix}$: the motors act on the joints only. The first 6 rows, the base, are **unactuated**.
2. $J_c^Tf$: the contact forces $f$ at the stance feet enter through the contact Jacobian. The contact constraint $J_c\nu = 0$ says the feet don't move.

## The base rows: only the feet hold it up

Take the first 6 rows at rest ($\dot\nu = 0$, $\nu = 0$). The torques vanish from them, leaving a balance between gravity and the feet:

$$\sum_i f_i + m\mathbf g = 0, \qquad \sum_i p_i \times f_i = 0 \;\; (p_i \text{ from the CoM}).$$

These are 6 equations in $3k$ unknowns for $k$ stance feet. With 4 feet there are 12 unknowns, so the stance is **statically indeterminate**: infinitely many force distributions work, and the robot chooses one. With 3 feet, the vertical forces are fixed by the geometry. Each force must also stay inside its **friction cone**, $\|f_t\| \le \mu f_n$, with $f_n > 0$ (feet can push, not pull).

## Choosing the forces, then the torques

A good choice keeps every foot's ratio $\|f_t\|/f_n$ as small as possible: make each tangential force proportional to its normal force, which gives the same ratio everywhere, $\tan\alpha$ on a slope of angle $\alpha$. Then find the normal forces that satisfy the moment balance. Real controllers solve a small quadratic program with the cone constraints at every control step. The joint rows then give the torques. For a leg standing still, $\tau_{leg} = J_{leg}^Tf$ (lesson 10, with the ground pushing on the foot).

:::figure widget=contactforces caption="A standing 50 kg quadruped seen from the side, with the contact force at each foot drawn as an arrow and the friction cone at each foot. Tilt the ground, or lift a leg, and watch the forces redistribute. The robot slips when an arrow leaves its cone."
:::end

## Worked example

An illustrative 50 kg quadruped, feet at $\pm 0.35$ m fore-aft and $\pm 0.25$ m sideways, 0.5 m below the CoM, $\mu = 0.6$:

1. Flat ground, four feet: $mg = 490.5$ N shared equally, 122.6 N per foot, no tangential force.
2. Right hind lifted: the CoM lies exactly on the diagonal from right front to left hind, so those two feet carry 245.25 N each and the left front carries nothing. The margin is zero (lesson 17).
3. On a 25° slope rising forwards (an alpine meadow, say): the normal forces shift downhill to 185.2 N per hind foot and 37.1 N per front foot, with tangential/normal $= \tan 25° = 0.466 < 0.6$: it holds.
4. It slips above $\arctan 0.6 = 31.0°$. It would also tip over backwards at $\arctan(0.35/0.5) = 35.0°$, where the front feet's normal force reaches zero, so on this ground slipping comes first.
5. Standing on flat ground with each foot under its hip (thigh and shank 0.3 m, hip 0.5 m up), the knee holds $122.6 \times 0.166 = 20.3$ N·m and the hip nothing.

## Code it from scratch

:::code file=floating_base.py
```python
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
```
:::end

## Exercises

:::exercise
Why can't a legged robot accelerate its body sideways while standing on ice ($\mu \approx 0$)?
:::solution
The only external horizontal force on the robot comes from the feet. With $\mu = 0$ the cones collapse to vertical lines, so $\sum f_i$ has no horizontal component and the base rows say the CoM can't accelerate horizontally, whatever the joint torques do. Internal motion just moves the legs one way and the body the other.
:::end

:::exercise
With four feet down, the robot can squeeze its feet towards each other without moving. What does that do to the contact forces?
:::solution
It adds internal forces: equal and opposite tangential components that cancel in the sum and in the moment, so the base balance is unchanged. They move the forces within or out of the friction cones. Controllers usually minimise them, but they can be used to brace, for example on a narrow ledge.
:::end

## Quiz

:::quiz
- type: num
  q: Size of q for a quadruped with 3 joints per leg and a floating base?
  answer: 18
  tol: 0.001
  py: "6+4*3"
  explain: 6 base coordinates plus 12 joints.
- type: num
  q: Vertical force per foot for a 50 kg robot standing symmetrically on four feet?
  answer: 122.625
  tol: 0.002
  unit: N
  py: "50*9.81/4"
  explain: mg/4.
- type: num
  q: Steepest slope a robot can stand on with friction coefficient 0.6?
  answer: 30.96
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan(0.6))"
  explain: tan α ≤ μ.
- type: num
  q: Slope at which the illustrative quadruped would tip over backwards (feet 0.35 m fore-aft of the CoM, CoM 0.5 m up)?
  answer: 34.99
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan(0.35/0.5))"
  explain: The weight's line of action passes the hind feet.
- type: mc
  q: The first 6 rows of the floating-base equations contain…
  options:
    - no joint torques, only gravity, inertia and contact forces
    - only the joint torques
    - the friction coefficient
    - nothing useful
  answer: 0
  explain: The base is unactuated.
- type: mc
  q: A standing quadruped on four feet is statically indeterminate because…
  options:
    - there are 12 unknown force components but only 6 balance equations
    - the legs are flexible
    - the CoM is unknown
    - friction is nonlinear
  answer: 0
  explain: The robot can choose among many force distributions.
:::end
