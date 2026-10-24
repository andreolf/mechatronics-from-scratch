---
id: p14-l10
minutes: 35
summary: Feeding the observer's estimate into the state-feedback law gives an output-feedback controller, and the separation principle says its closed-loop poles are exactly the controller poles plus the observer poles. You derive the block-triangular closed-loop matrix, simulate observer-based LQR on the nonlinear cart-pole with only encoder measurements, and test that the eigenvalues are the union of the two designs.
---

## Wire them together

Controller $u = -K\hat x$, observer $\dot{\hat x} = A\hat x + Bu + L(y - C\hat x)$. In coordinates $(x, \hat x)$:

$$\frac{d}{dt}\begin{bmatrix}x\\ \hat x\end{bmatrix} = \begin{bmatrix}A & -BK\\ LC & A - BK - LC\end{bmatrix}\begin{bmatrix}x\\ \hat x\end{bmatrix}.$$

Change to $(x, e)$ with $e = x - \hat x$, so $u = -K(x - e)$:

$$\frac{d}{dt}\begin{bmatrix}x\\ e\end{bmatrix} = \begin{bmatrix}A - BK & BK\\ 0 & A - LC\end{bmatrix}\begin{bmatrix}x\\ e\end{bmatrix}.$$

**Block upper triangular**, so the eigenvalues are those of $A - BK$ together with those of $A - LC$. Design $K$ and $L$ separately; together they behave as designed. This is the **separation principle**.

Two consequences:

- the error $e$ is never excited by the reference or the controller, so the reference-to-output response is identical to full state feedback;
- a slow observer adds slow closed-loop poles, which show up in the response to disturbances and initial errors.

What it doesn't promise: robustness. The full-state LQR's generous margins can shrink a lot once an observer is in the loop (Doyle's famous 1978 counter-example), which is why loop shapes still get checked.

:::figure widget=separation caption="The closed-loop eigenvalues of observer-based control for the cart-pole: the controller's poles and the observer's poles, together. Slide each design's speed and watch the combined set move as two independent groups."
:::end

## Worked example

Cart-pole, LQR with $Q = \mathrm{diag}(5, 1, 50, 1)$, $R = 0.05$; observer poles $-20, -22, -24, -26$.

1. Controller poles: $-8.55$, $-8.13$, $-1.39 \pm 0.89j$.
2. The 8-by-8 closed-loop matrix has exactly these eight eigenvalues, to $10^{-12}$, in both coordinate systems.
3. Nonlinear plant, 10° start, estimate starting at zero, encoder noise: balanced, under 0.04° of tilt after 6 s.
4. Move the observer poles to $-0.5 \dots -0.8$ and the slowest closed-loop pole becomes $-0.5$: the observer now dominates.

## Code it from scratch

:::code file=separation.py
```python
import numpy as np
from scipy.signal import place_poles
from scipy.linalg import solve_continuous_are, expm

M, m, l, g = 0.8, 0.25, 0.45, 9.81

def deriv(s, F):
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    A = np.column_stack([(deriv(e * 1e-6, 0) - deriv(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((deriv(np.zeros(4), 1e-6) - deriv(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

A, B = linearise(); C = np.array([[1.0, 0, 0, 0], [0, 0, 1.0, 0]])

def designs(q_th=50.0, obs_poles=(-20, -22, -24, -26)):
    K = np.linalg.solve([[0.05]], B.T @ solve_continuous_are(A, B, np.diag([5.0, 1, q_th, 1]), np.array([[0.05]])))
    L = place_poles(A.T, C.T, list(obs_poles)).gain_matrix.T
    return K, L

def closed_loop_xe(K, L):
    """coordinates (x, e = x - xhat): block upper triangular"""
    return np.block([[A - B @ K, B @ K], [np.zeros((4, 4)), A - L @ C]])

def closed_loop_xxhat(K, L):
    """the same loop in (x, xhat) coordinates, as you would wire it"""
    return np.block([[A, -B @ K], [L @ C, A - B @ K - L @ C]])

def test_eigenvalues_are_the_union():
    K, L = designs()
    want = np.concatenate([np.linalg.eigvals(A - B @ K), np.linalg.eigvals(A - L @ C)])
    for name, Acl in (("(x, e)", closed_loop_xe(K, L)), ("(x, xhat)", closed_loop_xxhat(K, L))):
        got = np.linalg.eigvals(Acl)
        d = max(min(abs(gv - w) for gv in got) for w in want)
        print(f"{name:10s} eigenvalues: {np.round(np.sort_complex(got), 2)}  max distance to the union {d:.1e}")
        assert d < 1e-6

def test_transfer_is_unchanged_by_observer():
    # from a reference force input, the observer error is not excited: r -> y equals the full-state design
    K, L = designs(); Bx = np.vstack([B, np.zeros((4, 1))])
    Acl = closed_loop_xe(K, L); Cx = np.hstack([C, np.zeros((2, 4))])
    Af = A - B @ K
    for t in (0.1, 0.5, 2.0):
        y_obs = Cx @ np.linalg.solve(Acl, (expm(Acl * t) - np.eye(8)) @ Bx)
        y_full = C @ np.linalg.solve(Af, (expm(Af * t) - np.eye(4)) @ B)
        assert np.allclose(y_obs, y_full, atol=1e-9)

def test_output_feedback_balances_nonlinear_plant():
    K, L = designs(); h = 1e-3; rng = np.random.default_rng(4)
    s = np.array([0.0, 0.0, np.radians(10), 0.0]); xh = np.zeros(4); ths = []
    for k in range(8000):
        y = C @ s + rng.normal(size=2) * np.array([0.0005, np.radians(0.1)])
        F = float(np.clip(-K[0] @ xh, -30, 30))                         # the controller sees only the estimate
        xh = xh + h * (A @ xh + B[:, 0] * F + L @ (y - C @ xh))
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ths.append(s[2])
        if abs(s[2]) > 1: break
    ths = np.array(ths)
    print(f"observer-based LQR from 10 deg (estimate starts at zero): upright {len(ths) / 1000:.1f} s, tilt over the last 2 s below {np.degrees(np.abs(ths[-2000:]).max()):.2f} deg")
    assert len(ths) == 8000 and np.degrees(np.abs(ths[-2000:]).max()) < 0.5

def test_slow_observer_hurts():
    K, _ = designs()
    for poles in ((-20, -22, -24, -26), (-0.5, -0.6, -0.7, -0.8)):
        _, L = designs(obs_poles=poles)
        lam = np.linalg.eigvals(closed_loop_xe(K, L))
        print(f"observer poles near {poles[0]}: slowest closed-loop pole {lam.real.max():.2f}")
    assert abs(lam.real.max() + 0.5) < 1e-6                                       # the slow observer now dominates the response

test_eigenvalues_are_the_union()
test_transfer_is_unchanged_by_observer()
test_output_feedback_balances_nonlinear_plant()
test_slow_observer_hurts()
print("PASS")
```
:::end

## Exercises

:::exercise
Show why the reference-to-output transfer function doesn't depend on $L$.
:::solution
A reference enters through $B$ into the $x$ equation only; in $(x, e)$ coordinates the input matrix is $(B, 0)$. Since $\dot e = (A - LC)e$ has no input and starts at zero, $e$ stays zero, and $x$ evolves as under full state feedback. The observer modes are uncontrollable from the reference, so they cancel out of the transfer function.
:::end

:::exercise
Is separation still exact if the observer's model differs from the plant?
:::solution
No. With plant $(A, B)$ and model $(\hat A, \hat B)$, the error equation picks up terms in $x$ and $u$, and the closed-loop matrix is no longer block triangular. The poles then move, which is one reason robustness has to be checked separately.
:::end

## Quiz

:::quiz
- type: num
  q: How many closed-loop eigenvalues does observer-based control of a 4-state plant have?
  answer: 8
  tol: 0.001
  py: "4+4"
  explain: 4 from the controller, 4 from the observer.
- type: num
  q: Slowest closed-loop pole if the controller's slowest is −1.39 and the observer's is −0.5?
  answer: -0.5
  tol: 0.001
  py: "max(-1.39,-0.5)"
  explain: The union keeps both.
- type: num
  q: Number of zero blocks in the (x, e) closed-loop matrix?
  answer: 1
  tol: 0.001
  py: "1"
  explain: The lower-left block.
- type: num
  q: Real part of the controller's complex poles in the worked example?
  answer: -1.39
  tol: 0.01
  py: "-1.39"
  explain: −1.39 ± 0.89j.
- type: mc
  q: The separation principle guarantees…
  options:
    - the closed-loop poles are the union of the controller and observer poles
    - the same robustness margins as full state feedback
    - zero estimation error at all times
    - that the observer can be omitted
  answer: 0
  explain: Margins are not guaranteed.
- type: mc
  q: In the (x, e) coordinates, the reference input excites…
  options:
    - only x, never e
    - only e
    - both equally
    - neither
  answer: 0
  explain: The input matrix is (B, 0).
:::end
