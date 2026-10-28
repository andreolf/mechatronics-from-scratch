---
id: p21-l06
minutes: 45
summary: A cable robot is only as good as its idea of where the anchors are. You see how a few centimetres of anchor error bend a straight move into an arch and slacken lines, then recover the anchors and the zero of every line counter by least squares from the robot's own measurements, and learn why the poses you choose matter as much as the solver.
---

## What the robot has to know

Lessons 2 to 5 assumed you knew the anchor positions exactly. You never do. You drill four holes near the ceiling corners of a real room, and walls are not square, ceilings are not level and a tape measure across a 7 m room in the air is good to a centimetre on a good day. On top of that, each winch counts line relative to wherever its counter happened to start. So a calibration has to find, at minimum:

- 12 numbers: the three coordinates of each anchor, or more exactly of the point where each line leaves its pulley or eyelet;
- 4 numbers: the offset between each line counter and the true line length.

## What a small mistake does

The robot winds each line to the length its model says, and gravity does the rest. With four lines and one point, that rest position is easy to state: the gripper hangs at the **lowest** point that is no further from each real anchor than its line. Usually three lines end up taut and one goes slack. That is the model in the code below, and it is the same physics you saw in Lesson 3 from the other side.

Command a straight line across Stringman's 7 × 7 × 3 m example room at 1 m, from $x = -2.5$ to $2.5$ m, and give the model each of these mistakes in turn:

| What is wrong | Height error | What you see |
|---|---|---|
| Every anchor 5 cm further out than the model thinks | +18.5 cm in the middle, +13.7 cm at the ends | An arch: the gripper rides up, most in the middle |
| Every anchor 5 cm further in | −16.7 cm in the middle | A sag |
| Ceiling 5 cm higher than the model | +5.0 cm everywhere | A pure shift, harmless |
| One anchor 5 cm lower | Up to −1.8 cm, and 1.4 cm sideways | A kink, with lines 1 and 3 going slack in turn |

The first row is the surprise. A horizontal error of 5 cm per axis is 7.1 cm along the diagonal, which changes the length of a line by about $7.1 \cos\theta = 6.6$ cm. With the lines rising at $\sin\theta = 0.375$, the gripper has to rise $6.6/0.375 = 17.5$ cm to make up that much length, close to the exact 18.5 cm. Shallow lines amplify horizontal errors into vertical ones, by roughly $1/\tan\theta$, and the amplification is worst exactly where the robot spends its time, in the middle of the room.

Neufangled's usage guide describes the symptom from the user's side: after a poor calibration the gantry moves "in an ascending arc, with some lines becoming slack in the process", and the suggested test of a calibration is to drive in straight lines and watch.

:::figure widget=anchorcal caption="Error along a commanded straight line at y = 0 for different calibration mistakes. Lime is height, blue is sideways. Try the size of the mistake and the height of the path: the arch shrinks as the path rises and the lines steepen."
:::end

## Calibration as least squares

Move the robot to a set of poses $\mathbf p_k$ that you know independently, from a camera looking at a marker for example, and record what each counter says, $m_{ki}$. The model for every reading is

$$ m_{ki} = \lVert \mathbf a_i - \mathbf p_k \rVert + c_i + \varepsilon_{ki} . $$

Sixteen unknowns, four equations per pose. Gauss-Newton is the same as in Lesson 2 with a bigger Jacobian: the derivative of a reading with respect to its anchor is $-(\mathbf p_k - \mathbf a_i)/l_{ki}$, a unit vector, and with respect to its offset it is 1.

The solver is the easy part. The poses are the hard part, because one combination of unknowns is nearly invisible: moving an anchor along its own line and changing that line's offset by the same amount leaves every reading almost unchanged, as long as the line keeps roughly the same direction. You break that tie by measuring from poses where the line points in very different directions. With 1 mm of noise on every reading and anchors started 5 cm from the truth, averaged over 40 simulated rooms:

| Poses | Anchor error after calibration |
|---|---|
| 9 poses on a 4 × 4 m grid at 1.0 m | 9.0 mm |
| 18 poses, same grid at 0.6 and 2.0 m | 5.3 mm |
| 75 poses on a 6 × 6 m grid at 0.5, 1.5 and 2.5 m | 1.6 mm |

In every case the fit's residual is down at the 1 mm noise level. A good residual says the model can explain the data, not that the answer is right; only spread-out poses make the answer unique.

## How Stringman does it

Stringman's full calibration starts with paper cards on the floor, one of them marked "origin", and the robot moves over them while its anchor cameras watch. The fit in its `eyelet_calibration.py` is a weighted least-squares problem that combines several kinds of evidence in one cost: where the two cameras see each card, agreement between the cameras, the change in line length measured by the motor encoders between gantry positions, and structural terms that say the room must be physically possible, such as the anchors standing plumb and the four pull points sharing a height. After a warm-started pass, a plausibility check compares those structural terms before and after, because, in the code's own words, a fit can drive the total cost down by deforming the room when the data contain an error the model has no parameter for.

Then there is the quick calibration, a few seconds long, which tightens all lines and resets each line-length counter from what the cameras see. It fixes slightly slack lines, not wrong anchors. And on the Pilot gripper it also resets the length of the winch line from the time between recent swings, which is the pendulum of the next lesson used as a ruler.

## Code it from scratch

:::code file=anchor_calibration.py
```python
import numpy as np, itertools

def anchors(w=7.0, d=7.0, h=3.0):
    return np.array([[-w/2, -d/2, h], [w/2, -d/2, h], [w/2, d/2, h], [-w/2, d/2, h]])

def trilaterate(P, r):
    """the two points at distances r from three centres P (rows); None if the spheres do not meet"""
    ex = (P[1] - P[0]) / np.linalg.norm(P[1] - P[0])
    i = ex @ (P[2] - P[0]); ey = P[2] - P[0] - i * ex
    if np.linalg.norm(ey) < 1e-12: return None
    ey /= np.linalg.norm(ey); ez = np.cross(ex, ey)
    d = np.linalg.norm(P[1] - P[0]); j = ey @ (P[2] - P[0])
    x = (r[0]**2 - r[1]**2 + d**2) / (2 * d)
    y = (r[0]**2 - r[2]**2 + i**2 + j**2) / (2 * j) - i / j * x
    z2 = r[0]**2 - x**2 - y**2
    if z2 < 0: return None
    base = P[0] + x * ex + y * ey
    return base + np.sqrt(z2) * ez, base - np.sqrt(z2) * ez

def hang(A, L):
    """Where a point mass on four lines of fixed length comes to rest: the lowest point with every
    anchor distance <= its line length. Some lines end up taut, the rest slack."""
    best, tight = None, None
    ok = lambda p: np.all(np.linalg.norm(A - p, axis=1) <= L + 1e-9)
    for i in range(4):                                       # one line, hanging straight down
        p = A[i] - [0, 0, L[i]]
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i,)
    for i, j in itertools.combinations(range(4), 2):          # two lines: lowest point of their circle
        c = A[j] - A[i]; dd = np.linalg.norm(c); e = c / dd
        a = (L[i]**2 - L[j]**2 + dd**2) / (2 * dd); rho2 = L[i]**2 - a**2
        if rho2 < 0: continue
        ctr = A[i] + a * e
        down = np.array([0, 0, -1.0]) - e * (-e[2])           # downward direction in the circle's plane
        if np.linalg.norm(down) < 1e-12: continue
        p = ctr + np.sqrt(rho2) * down / np.linalg.norm(down)
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i, j)
    for tri in itertools.combinations(range(4), 3):           # three lines: a vertex of the intersection
        sol = trilaterate(A[list(tri)], L[list(tri)])
        if sol is None: continue
        p = min(sol, key=lambda q: q[2])
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, tri
    return best, tight


# 1. What a calibration mistake does to a commanded straight line at 1 m, x from -2.5 to 2.5 m
def path_error(A_true, A_model, z=1.0):
    errs, slack = [], set()
    for x in np.linspace(-2.5, 2.5, 51):
        cmd = np.array([x, 0.0, z])
        p, tight = hang(A_true, np.linalg.norm(A_model - cmd, axis=1))
        errs.append(p - cmd); slack |= set(range(4)) - set(tight)
    return np.array(errs), sorted(i + 1 for i in slack)

e, _ = path_error(anchors(7.1, 7.1, 3.0), anchors())
print(f"anchors 5 cm further out: gripper {e[25, 2]*100:.1f} cm high in the middle, {e[0, 2]*100:.1f} cm at the ends")
assert abs(e[25, 2] - 0.185) < 0.001 and abs(e[0, 2] - 0.137) < 0.001
e, _ = path_error(anchors(7.0, 7.0, 3.05), anchors())
assert np.allclose(e[:, 2], 0.05) and np.allclose(e[:, :2], 0)    # a ceiling error is a pure shift
A_bad = anchors(); A_bad[2, 2] -= 0.05
e, slack = path_error(A_bad, anchors())
print(f"anchor 3 5 cm low: up to {abs(e[:, 2]).max()*100:.1f} cm down, {abs(e[:, 0]).max()*100:.1f} cm sideways, slack lines {slack}")
assert abs(abs(e[:, 2]).max() - 0.0176) < 0.0005 and slack == [1, 3]

# 2. Self-calibration: 12 anchor coordinates and 4 counter offsets from encoder readings at known poses
def calibrate(P, M, A0, iters=30):
    x = np.concatenate([A0.ravel(), np.zeros(4)])
    for _ in range(iters):
        A, c = x[:12].reshape(4, 3), x[12:]
        V = P[:, None] - A[None]
        L = np.linalg.norm(V, axis=2)
        r = (L + c - M).ravel()
        J = np.zeros((r.size, 16))
        for k in range(len(P)):
            for i in range(4):
                J[4*k + i, 3*i:3*i + 3] = -V[k, i] / L[k, i]
                J[4*k + i, 12 + i] = 1.0
        dx = np.linalg.lstsq(J, -r, rcond=None)[0]
        x += dx
        if np.linalg.norm(dx) < 1e-12:
            break
    return x[:12].reshape(4, 3), x[12:], np.sqrt(np.mean(r**2))

g3, g5 = np.linspace(-2, 2, 3), np.linspace(-3, 3, 5)
pose_sets = {"9 poses at 1.0 m": np.array([[x, y, 1.0] for x in g3 for y in g3]),
             "18 poses at 0.6 and 2.0 m": np.array([[x, y, z] for x in g3 for y in g3 for z in (0.6, 2.0)]),
             "75 poses at 0.5, 1.5 and 2.5 m": np.array([[x, y, z] for x in g5 for y in g5 for z in (0.5, 1.5, 2.5)])}
mean_err = {}
for name, P in pose_sets.items():
    errs = []
    for seed in range(40):
        rng = np.random.default_rng(100 + seed)
        A_true = anchors() + rng.normal(0, 0.05, (4, 3))         # the real room is a few cm off the plan
        c_true = rng.uniform(-0.5, 0.5, 4)                       # where each line counter happens to read zero
        M = np.linalg.norm(A_true[None] - P[:, None], axis=2) + c_true + rng.normal(0, 0.001, (len(P), 4))
        A, c, rms = calibrate(P, M, anchors())
        assert rms < 0.0015                                      # the fit explains the data to the noise level
        errs.append(np.sqrt(np.mean(np.sum((A - A_true)**2, axis=1))))
    mean_err[name] = np.mean(errs)
    print(f"{name}: anchors recovered to {mean_err[name]*1000:.1f} mm rms from 1 mm of length noise")
v = list(mean_err.values())
assert v[0] > v[1] > v[2] and v[2] < 0.003 and v[0] > 0.006
print("PASS")
```
:::end

## In practice

Start with a tape-measured guess, and make the guess honest: it is the starting point, not the answer. Choose calibration poses that are wide, near the floor and high up, and do not throw away the residual. If a calibration that used to converge to a millimetre suddenly converges to a centimetre, something physical has changed: an anchor screw has crept, a line has slipped on its spool, or a card has been kicked. Run a straight-line test after every full calibration, at two heights.

## Exercises

:::exercise
In the first row of the table, why is the error bigger in the middle than at the ends of the path?
:::solution
In the middle all four lines are equally shallow, so each line's length error turns into height with the full $1/\tan\theta$ amplification. Towards the ends the lines on the near side are steeper, so the same length error moves the gripper less in height.
:::end

:::exercise
Why can't you calibrate the counter offsets alone, assuming the anchors are where you measured them?
:::solution
You can, and quick calibration effectively does, but any anchor error is then absorbed into the offsets, which are constant. At one pose the lengths come out right, and elsewhere the error reappears because the true error in length depends on the direction of the line. That is the arch in the table.
:::end

## Quiz

:::quiz
- type: mc
  q: A suspended four-line robot winds its lines to lengths from a model. Where does the gripper come to rest?
  options: ["At the lowest point no further from each real anchor than its line", "At the least-squares point", "At the commanded point", "Directly under the centre of the room"]
  answer: 0
  explain: Gravity pulls it down until the lines stop it; usually three are taut.
- type: num
  q: The lines rise at sin θ = 0.375 and a line is 6.6 cm too short. Roughly how far does the gripper rise to make up the length (cm)?
  answer: 17.6
  tol: 0.01
  py: "6.6/0.375"
  explain: To first order, Δz = Δl / sin θ.
- type: mc
  q: Your calibration says the ceiling is 5 cm lower than it is. What do you see?
  options: ["The whole workspace shifted up by 5 cm", "An arch", "Slack lines everywhere", "A sideways drift"]
  answer: 0
  explain: A common height error is a pure translation.
- type: mc
  q: Which pair of unknowns is hardest to tell apart in an anchor calibration?
  options: ["An anchor's position along its own line and that line's counter offset", "Two different anchors' heights", "The x and y of the gripper", "The payload and the tension limit"]
  answer: 0
  explain: Both change the reading by the same amount until the line direction changes.
- type: mc
  q: What does Stringman's quick calibration do?
  options: ["Tightens the lines and resets the line-length counters from what the cameras see", "Re-solves all the anchor positions", "Calibrates the camera lenses", "Measures the payload"]
  answer: 0
  explain: It takes seconds and fixes slight slack, not anchor errors.
- type: mc
  q: The calibration residual is 1 mm, the same as the measurement noise. What does that prove?
  options: ["Only that the model can explain the data, not that the anchors are right", "The anchors are within 1 mm", "The poses were well chosen", "Nothing at all"]
  answer: 0
  explain: Poorly spread poses can give a small residual and a wrong answer.
:::end

:::verify
import math
L = math.sqrt(2*3.5**2 + 2**2); c = math.sqrt(2)*3.5/L; s = 2/L; d = 0.05*math.sqrt(2)
assert abs(d*100 - 7.1) < 0.05 and abs(s - 0.375) < 5e-4 and abs(d*c*100 - 6.6) < 0.05 and abs(d*c/s*100 - 17.5) < 0.05
assert abs(6.6/0.375 - 17.6) < 0.01
:::end

## Sources

- Neufangled, [usage guide](https://neufangled.com/docs/usage_guide/) (calibration cards and origin card, the ascending-arc symptom, straight-line test, quick calibration, Pilot winch-line reset from swings, manual anchor edits in `configuration.json`).
- Stringman firmware, Apache-2.0: [`eyelet_calibration.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/eyelet_calibration.py) at commit e1ee31d (weighted least-squares terms and the plausibility check).
- A. Pott, [*Cable-Driven Parallel Robots: Theory and Application*](https://doi.org/10.1007/978-3-319-76138-1), Springer, 2018 (kinematic calibration).
