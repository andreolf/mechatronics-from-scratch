---
id: p01-l12
minutes: 35
summary: The singular value decomposition says every matrix is a rotation, a stretch along perpendicular axes, and another rotation. You derive it from the eigenvectors of AᵀA, read singular values as the axes of an ellipse, and implement it two ways.
---

## Every matrix maps a circle to an ellipse

Push the unit circle through any 2 × 2 matrix and you get an ellipse (possibly flattened to a line). Its semi-axes have lengths $\sigma_1 \ge \sigma_2 \ge 0$, the **singular values**, and point along perpendicular unit vectors $\mathbf u_1, \mathbf u_2$. The input directions that land on those axes, $\mathbf v_1, \mathbf v_2$, are perpendicular too. So

$$A\mathbf v_i = \sigma_i \mathbf u_i \quad\Longrightarrow\quad A = U\Sigma V^\top,$$

with $U$ and $V$ orthogonal and $\Sigma$ diagonal. This holds for every real matrix, square or not, which is what makes the SVD the most informative factorisation in numerical linear algebra.

:::figure widget=matrix2d caption="The dashed unit circle maps to the lime ellipse. Grey arrows are the input directions v₁ and v₂; amber and blue are their images σ₁u₁ and σ₂u₂." args={"mode":"svd","m":{"a":3,"b":0,"c":4,"d":5}}
:::end

## Derivation from AᵀA

Multiply $A = U\Sigma V^\top$ by its transpose:

$$A^\top A = V\Sigma^\top U^\top U\Sigma V^\top = V\,\Sigma^2\,V^\top .$$

That is an eigendecomposition. So the $\mathbf v_i$ are eigenvectors of the symmetric matrix $A^\top A$, the singular values are the square roots of its eigenvalues, and then $\mathbf u_i = A\mathbf v_i/\sigma_i$.

This route squares the condition number, like the normal equations, so production codes avoid forming $A^\top A$. The **one-sided Jacobi** method instead rotates pairs of columns of $A$ until they are mutually orthogonal; the column norms are then the singular values. It is short to write and accurate.

What the SVD tells you:

- $\sigma_1 = \lVert A\rVert_2$ is the largest stretch, and $\sigma_1/\sigma_n$ is the condition number (lesson 13).
- The number of nonzero $\sigma_i$ is the rank.
- For a robot Jacobian, $\sigma_i$ are the tip speeds per unit joint speed along the manipulability ellipse's axes; a zero singular value is a singularity.

## Worked example

$A = \begin{pmatrix} 3 & 0 \\ 4 & 5 \end{pmatrix}$, so $A^\top A = \begin{pmatrix} 25 & 20 \\ 20 & 25\end{pmatrix}$.

1. Eigenvalues of $A^\top A$: $25 \pm 20$, so 45 and 5.
2. $\sigma_1 = \sqrt{45} = 6.708$, $\sigma_2 = \sqrt5 = 2.236$.
3. Eigenvectors: $\mathbf v_1 = (1, 1)/\sqrt2$, $\mathbf v_2 = (1, -1)/\sqrt2$.
4. $\mathbf u_1 = A\mathbf v_1/\sigma_1 = (3, 9)/(\sqrt2 \cdot 6.708) = (0.3162, 0.9487)$.
5. Checks: $\sigma_1\sigma_2 = 15 = |\det A|$, and $\kappa = 6.708/2.236 = 3$.

## Code it from scratch

:::code file=svd.py
```python
import numpy as np

def svd_via_eig(A):
    A = np.asarray(A, float)
    w, V = np.linalg.eigh(A.T @ A)              # symmetric eigensolver (see lesson 11 for Jacobi)
    idx = np.argsort(w)[::-1]; w, V = w[idx], V[:, idx]
    s = np.sqrt(np.clip(w, 0, None))
    U = (A @ V) / s
    return U, s, V

def svd_jacobi(A, tol=1e-14, sweeps=60):
    U = np.array(A, float); n = U.shape[1]; V = np.eye(n)
    for _ in range(sweeps):
        rotated = False
        for p in range(n - 1):
            for q in range(p + 1, n):
                a, b = U[:, p] @ U[:, p], U[:, q] @ U[:, q]
                g = U[:, p] @ U[:, q]
                if abs(g) <= tol * np.sqrt(a * b): continue
                rotated = True
                zeta = (b - a) / (2 * g)
                t = np.sign(zeta) / (abs(zeta) + np.sqrt(1 + zeta ** 2)) if zeta != 0 else 1.0
                c = 1 / np.sqrt(1 + t * t); s = c * t
                for M in (U, V):
                    Mp, Mq = M[:, p].copy(), M[:, q].copy()
                    M[:, p], M[:, q] = c * Mp - s * Mq, s * Mp + c * Mq
        if not rotated: break
    sig = np.linalg.norm(U, axis=0)
    idx = np.argsort(sig)[::-1]
    return U[:, idx] / sig[idx], sig[idx], V[:, idx]

if __name__ == "__main__":
    U, s, V = svd_via_eig([[3, 0], [4, 5]])
    assert np.allclose(s, [45 ** .5, 5 ** .5]) and np.allclose(abs(U[:, 0]), [0.31623, 0.94868], atol=1e-5)
    rng = np.random.default_rng(7)
    for shape in [(5, 3), (8, 8), (12, 4)]:
        A = rng.standard_normal(shape)
        for f in (svd_via_eig, svd_jacobi):
            U, s, V = f(A)
            assert np.allclose(U @ np.diag(s) @ V.T, A, atol=1e-10)
            assert np.allclose(s, np.linalg.svd(A, compute_uv=False), rtol=1e-9)
    print("both SVDs reconstruct A and match NumPy's singular values")
```
:::end

## Exercises

:::exercise
Find the singular values of $\operatorname{diag}(3, -2)$.
:::solution
$A^\top A = \operatorname{diag}(9, 4)$, so $\sigma = 3, 2$. Singular values are never negative; the sign moves into $U$ (here $\mathbf u_2 = -\mathbf e_2$).
:::end

:::exercise
A 6-joint robot's 6 × 6 Jacobian has singular values 1.2, 0.9, 0.5, 0.3, 0.1 and 0.002 (in m/s per rad/s or rad/s per rad/s). What does that tell you?
:::solution
1. The condition number is $1.2/0.002 = 600$: the arm is close to a singularity.
2. Along the direction $\mathbf u_6$ the tip moves only 0.002 units per unit joint speed, so commanding motion there needs huge joint speeds. A controller should slow down or use damped least squares (Phase 07).
:::end

## Quiz

:::quiz
- type: num
  q: What is the largest singular value of $\begin{pmatrix}3&0\\4&5\end{pmatrix}$?
  answer: 6.7082
  tol: 0.001
  py: "np.linalg.svd([[3,0],[4,5]], compute_uv=False)[0]"
  explain: The eigenvalues of $A^\top A$ are 45 and 5, so $\sigma_1 = \sqrt{45} = 6.708$.
- type: num
  q: What is the condition number $\sigma_1/\sigma_2$ of the same matrix?
  answer: 3
  tol: 0.001
  py: "np.linalg.cond([[3,0],[4,5]])"
  explain: $\sqrt{45}/\sqrt5 = \sqrt9 = 3$.
- type: mc
  q: The right singular vectors V of A are…
  options:
    - eigenvectors of A
    - eigenvectors of AᵀA
    - the rows of A
    - eigenvectors of A + Aᵀ
  answer: 1
  explain: $A^\top A = V\Sigma^2V^\top$ is an eigendecomposition.
- type: mc
  q: How many nonzero singular values does a 4 × 3 matrix of rank 2 have?
  options:
    - "4"
    - "3"
    - "2"
    - "1"
  answer: 2
  explain: The rank equals the number of nonzero singular values.
- type: num
  q: For a 2 × 2 matrix with singular values 4 and 0.5, what is $|\det A|$?
  answer: 2
  tol: 0.0001
  py: "4*0.5"
  explain: $|\det A| = \sigma_1\sigma_2$ because rotations have determinant ±1.
:::end

:::verify
import numpy as np
A = np.array([[3,0],[4,5.]]); assert np.allclose(A.T@A,[[25,20],[20,25]])
s = np.linalg.svd(A, compute_uv=False); assert np.allclose(s,[45**.5,5**.5]) and abs(s[0]-6.708)<5e-4 and abs(s[1]-2.236)<5e-4
u1 = A@np.array([1,1])/2**.5/s[0]; assert np.allclose(u1,[.3162,.9487],atol=5e-5)
assert abs(s[0]*s[1]-15)<1e-12 and abs(s[0]/s[1]-3)<1e-12
assert np.allclose(np.linalg.svd(np.diag([3,-2.]),compute_uv=False),[3,2])
:::end
