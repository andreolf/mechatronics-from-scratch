---
id: p04-l05
minutes: 35
summary: Uncertainty travels through a model like a vector through a matrix. You derive Σy = AΣxAᵀ, linearise a nonlinear model with its Jacobian, propagate encoder quantisation through a two-link arm to get an end-effector error ellipse, and check it against Monte Carlo.
---

## The propagation law

Let $\mathbf y = A\mathbf x + \mathbf b$ with $\mathbf x$ having mean $\boldsymbol\mu$ and covariance $\Sigma_x$. The mean maps directly, $\mathbb E[\mathbf y] = A\boldsymbol\mu + \mathbf b$, and the deviation is $\mathbf y - \mathbb E\mathbf y = A(\mathbf x - \boldsymbol\mu)$. So

$$\Sigma_y = \mathbb E[A(\mathbf x - \boldsymbol\mu)(\mathbf x - \boldsymbol\mu)^TA^T] = A\,\Sigma_x A^T.$$

The offset $\mathbf b$ drops out: shifting doesn't change spread. If $\mathbf x$ is Gaussian, $\mathbf y$ is exactly Gaussian too. This one line is the covariance-prediction step of the Kalman filter (Phase 14).

**Nonlinear models.** For $\mathbf y = f(\mathbf x)$, linearise around the mean with the Jacobian $J = \partial f/\partial\mathbf x$ (Phase 02 lesson 4):

$$\Sigma_y \approx J\,\Sigma_x J^T.$$

It's accurate when the errors are small compared with the scale on which $f$ bends. When they aren't, use Monte Carlo (lesson 8) or the unscented transform.

## A two-link arm

For a planar arm with link lengths $l_1$, $l_2$ and joint angles $q_1$, $q_2$:

$$x = l_1\cos q_1 + l_2\cos(q_1 + q_2), \qquad y = l_1\sin q_1 + l_2\sin(q_1 + q_2),$$

$$J = \begin{bmatrix}-l_1\sin q_1 - l_2\sin(q_1 + q_2) & -l_2\sin(q_1 + q_2)\\ l_1\cos q_1 + l_2\cos(q_1 + q_2) & l_2\cos(q_1 + q_2)\end{bmatrix}.$$

Joint-angle uncertainty becomes a tilted ellipse at the tool tip. Its shape changes with posture, and near a singularity (arm fully stretched) it collapses toward a line: errors along the arm vanish while errors across it remain.

:::figure widget=covariance caption="An error ellipse like the one at the arm's tip. In the worked example the joint errors are independent, but the Jacobian couples them into x-y correlation."
:::end

## Worked example

$l_1 = l_2 = 0.3$ m at $q_1 = 30°$, $q_2 = 60°$, with 12-bit (4096-count) encoders on both joints.

1. The tool tip is at $x = 0.3\cos30° + 0.3\cos90° = 0.2598$ m and $y = 0.15 + 0.3 = 0.45$ m.
2. The Jacobian is $J = \begin{bmatrix}-0.45 & -0.3\\ 0.2598 & 0\end{bmatrix}$.
3. One count is $360/4096 = 0.0879°$. Quantisation is uniform over ±½ count, so $\sigma_q = 0.0879°/\sqrt{12} = 0.0254° = 4.43\times10^{-4}$ rad, and $\Sigma_q = \sigma_q^2I$.
4. $\Sigma_p = \sigma_q^2JJ^T$ gives $\sigma_x = 0.240$ mm and $\sigma_y = 0.115$ mm, with negative x-y correlation.
5. The eigenvalues give 1σ semi-axes of 0.259 mm and 0.059 mm. Encoder resolution alone limits this arm to about a quarter of a millimetre at the tip; gear backlash and link flex usually add more.

## Code it from scratch

:::code file=propagate.py
```python
import math
import numpy as np

L1 = L2 = 0.3

def fk(q):
    q1, q2 = q[..., 0], q[..., 1]
    return np.stack([L1 * np.cos(q1) + L2 * np.cos(q1 + q2), L1 * np.sin(q1) + L2 * np.sin(q1 + q2)], axis=-1)

def jacobian(q):
    q1, q2 = q
    s1, c1, s12, c12 = math.sin(q1), math.cos(q1), math.sin(q1 + q2), math.cos(q1 + q2)
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

if __name__ == "__main__":
    q0 = np.radians([30.0, 60.0])
    assert np.allclose(fk(q0), [0.259808, 0.45], atol=1e-6)
    sq = math.radians(360 / 4096) / math.sqrt(12)
    J = jacobian(q0)
    Sp = sq**2 * J @ J.T
    sx, sy = np.sqrt(np.diag(Sp))
    print(f"sigma_x {sx*1e3:.3f} mm, sigma_y {sy*1e3:.3f} mm")
    assert abs(sx - 2.395e-4) < 1e-6 and abs(sy - 1.150e-4) < 1e-6
    # Monte Carlo with uniform quantisation errors agrees with linear propagation
    rng = np.random.default_rng(9)
    dq = (rng.random((400_000, 2)) - 0.5) * math.radians(360 / 4096)
    P = fk(q0 + dq)
    assert np.max(np.abs(np.cov(P.T) - Sp)) < 0.02 * np.max(np.abs(Sp))
    # with large errors (5 deg) linearisation is visibly off: the mean shifts
    big = fk(q0 + rng.standard_normal((400_000, 2)) * math.radians(5))
    shift = np.linalg.norm(big.mean(axis=0) - fk(q0))
    assert shift > 5e-4                                # more than half a millimetre of bias
```
:::end

## Exercises

:::exercise
Two resistors in series, $R = R_1 + R_2$, each with $\sigma = 1$ Ω and independent. Use the propagation law to find $\sigma_R$. What if they're perfectly correlated (from the same reel and drift together)?
:::solution
$A = [1\ 1]$. Independent: $\Sigma_R = 1 + 1 = 2$, so $\sigma_R = 1.414$ Ω. Perfectly correlated: $\Sigma_x = \begin{bmatrix}1 & 1\\1 & 1\end{bmatrix}$, so $\Sigma_R = 4$ and $\sigma_R = 2$ Ω. Correlation can make things worse, or better for differences ($R_1 - R_2$ would then have zero spread, which is why matched resistor pairs exist).
:::end

:::exercise
At $q_2 = 0$ (arm straight), what happens to the error ellipse?
:::solution
The Jacobian's columns become parallel (both perpendicular to the arm), so $J$ is singular and $JJ^T$ has a zero eigenvalue. The ellipse collapses to a line across the arm: no error along it, to first order.
:::end

## Quiz

:::quiz
- type: num
  q: What is the quantisation σ in degrees of a 4096-count encoder?
  answer: 0.025372
  tol: 0.002
  unit: °
  py: "360/4096/math.sqrt(12)"
  explain: One count is 0.0879°, divided by √12.
- type: num
  q: What is σx in mm at the tool tip in the worked example?
  answer: 0.2395
  tol: 0.003
  unit: mm
  py: "1e3*math.radians(360/4096)/math.sqrt(12)*math.sqrt(0.45**2+0.3**2)"
  explain: Row 1 of J is (−0.45, −0.3), so $\sigma_x = \sigma_q\sqrt{0.45^2 + 0.3^2}$.
- type: mc
  q: For $\mathbf y = A\mathbf x + \mathbf b$, the covariance of $\mathbf y$ is…
  options:
    - $A\Sigma_x + \mathbf b$
    - $A\Sigma_xA^T$
    - $A^T\Sigma_xA$
    - $\Sigma_x$
  answer: 1
  explain: The offset doesn't affect spread.
- type: num
  q: Two independent resistors in series, each with σ = 1 Ω. What is σ of the sum in ohms?
  answer: 1.4142
  tol: 0.001
  unit: Ω
  py: "math.sqrt(2)"
  explain: Variances add.
- type: mc
  q: Linearised propagation $J\Sigma J^T$ becomes inaccurate when…
  options:
    - the model is linear
    - errors are large compared with the curvature scale of $f$
    - Σ is diagonal
    - there are more outputs than inputs
  answer: 1
  explain: The first-order Taylor expansion only holds for small deviations.
- type: num
  q: Two perfectly correlated 1 Ω errors in series. What is σ of the sum in ohms?
  answer: 2
  tol: 0.001
  unit: Ω
  py: "2.0"
  explain: $[1\ 1]\begin{bmatrix}1&1\\1&1\end{bmatrix}[1\ 1]^T = 4$.
:::end

:::verify
import numpy as np, math
J = np.array([[-0.45,-0.3],[0.3*math.cos(math.radians(30)),0]]); s = math.radians(360/4096)/math.sqrt(12)
assert abs(s-4.43e-4)<5e-7 and abs(360/4096-0.0879)<5e-5
P = s*s*J@J.T; ax = np.sqrt(np.linalg.eigvalsh(P))*1e3
assert abs(ax[1]-0.259)<5e-4 and abs(ax[0]-0.059)<5e-4 and P[0,1] < 0
:::end
