---
id: p01-l11
minutes: 35
summary: Every structure vibrates in a few preferred shapes at preferred frequencies. You turn the equations of a mass-spring chain into a generalised eigenproblem, solve it with a from-scratch Jacobi eigenvalue method, and check the frequencies against the exact two-mass result.
---

## From Newton's law to an eigenproblem

Two carts of mass $m$ sit between two walls, joined by three springs of stiffness $k$. Newton's second law for each cart gives

$$m\ddot x_1 = -k x_1 + k(x_2 - x_1), \qquad m\ddot x_2 = -k(x_2 - x_1) - k x_2,$$

or in matrix form

$$M\ddot{\mathbf x} + K\mathbf x = 0, \qquad M = \begin{pmatrix} m & 0\\0 & m\end{pmatrix},\quad K = \begin{pmatrix} 2k & -k\\-k & 2k\end{pmatrix}.$$

Guess a solution where every mass moves in step: $\mathbf x(t) = \mathbf v\cos(\omega t)$. Substituting gives $-\omega^2 M\mathbf v + K\mathbf v = 0$, the **generalised eigenproblem**

$$K\mathbf v = \omega^2 M\mathbf v .$$

Each eigenvalue $\omega_i^2$ is a squared natural frequency, and each eigenvector $\mathbf v_i$ is a **mode shape**. Any free motion is a sum of modes, each oscillating at its own frequency. This is also why $A = V\Lambda V^{-1}$ matters: in the eigenvector basis the coupled system splits into independent oscillators.

## Making it symmetric

With $M$ diagonal and positive, substitute $\mathbf v = M^{-1/2}\mathbf u$ and multiply by $M^{-1/2}$:

$$\big(M^{-1/2} K M^{-1/2}\big)\mathbf u = \omega^2\mathbf u .$$

The matrix in brackets is symmetric, so its eigenvalues are real and its eigenvectors orthogonal. Symmetric matrices have their own robust algorithm, the Jacobi method: repeatedly apply a 2 × 2 rotation that zeroes the largest off-diagonal entry. Each rotation is $A \leftarrow G^\top A G$, which keeps the eigenvalues, and the off-diagonal mass shrinks every sweep until $A$ is diagonal.

## Worked example: the two-cart chain

With $m = 1$ kg and $k = 100$ N/m, $M^{-1/2}KM^{-1/2} = \begin{pmatrix} 200 & -100 \\ -100 & 200\end{pmatrix}$, whose eigenvalues are $200 \mp 100$:

- **Mode 1**: $\omega_1^2 = 100$, $\omega_1 = 10$ rad/s $= 1.59$ Hz, shape $(1, 1)$. Both carts move together and the middle spring never stretches.
- **Mode 2**: $\omega_2^2 = 300$, $\omega_2 = 17.32$ rad/s $= 2.76$ Hz, shape $(1, -1)$. The carts move against each other.

For a chain of $n$ equal carts between walls, the exact frequencies are $\omega_j = 2\sqrt{k/m}\,\sin\!\big(\tfrac{j\pi}{2(n+1)}\big)$. For three carts that gives 7.654, 14.142 and 18.478 rad/s.

## Code it from scratch

:::code file=modes.py
```python
import math
import numpy as np

def jacobi_eig(A, tol=1e-12, max_sweeps=100):
    A = np.array(A, float); n = len(A); V = np.eye(n)
    for _ in range(max_sweeps):
        off = np.sqrt(np.sum(A ** 2) - np.sum(np.diag(A) ** 2))
        if off < tol * np.linalg.norm(A): break
        for p in range(n - 1):
            for q in range(p + 1, n):
                if abs(A[p, q]) < 1e-300: continue
                theta = (A[q, q] - A[p, p]) / (2 * A[p, q])
                t = math.copysign(1, theta) / (abs(theta) + math.sqrt(theta * theta + 1))
                c = 1 / math.sqrt(t * t + 1); s = t * c
                G = np.eye(n); G[p, p] = G[q, q] = c; G[p, q] = s; G[q, p] = -s
                A = G.T @ A @ G; V = V @ G
    order = np.argsort(np.diag(A))
    return np.diag(A)[order], V[:, order]

def modes(masses, k):
    n = len(masses)
    K = np.diag([2 * k] * n) - np.diag([k] * (n - 1), 1) - np.diag([k] * (n - 1), -1)
    Mih = np.diag(1 / np.sqrt(masses))
    w2, U = jacobi_eig(Mih @ K @ Mih)
    return np.sqrt(w2), Mih @ U                 # frequencies [rad/s], mode shapes

if __name__ == "__main__":
    w, V = modes([1.0, 1.0], 100.0)
    assert np.allclose(w, [10, math.sqrt(300)])
    assert abs(V[0, 0] / V[1, 0] - 1) < 1e-9 and abs(V[0, 1] / V[1, 1] + 1) < 1e-9
    w3, V3 = modes([1.0, 1.0, 1.0], 100.0)
    exact = [2 * 10 * math.sin(j * math.pi / 8) for j in (1, 2, 3)]
    assert np.allclose(w3, exact, rtol=1e-10)
    print("3-cart frequencies [rad/s]:", w3.round(3), " shapes:\n", (V3 / abs(V3).max(0)).round(3))
```
:::end

## Exercises

:::exercise
Make the second cart of the two-cart chain twice as heavy ($m_2 = 2$ kg). What are the natural frequencies?
:::solution
1. $\det(K - \omega^2 M) = (200 - \omega^2)(200 - 2\omega^2) - 100^2 = 0$.
2. Expand: $2\omega^4 - 600\omega^2 + 30000 = 0$, so $\omega^2 = 150 \mp 86.60$.
3. $\omega_1 = \sqrt{63.40} = 7.962$ rad/s and $\omega_2 = \sqrt{236.60} = 15.382$ rad/s. The heavier cart lowers both.
:::end

:::exercise
Why does mode 1 of the equal two-cart chain not depend on the middle spring?
:::solution
In mode 1 both carts move by the same amount, so the middle spring never changes length and carries no force. Each cart rides on one wall spring alone: $\omega_1 = \sqrt{k/m}$.
:::end

## Quiz

:::quiz
- type: num
  q: Two 1 kg carts with three 100 N/m springs between walls. What is the higher natural frequency in hertz?
  answer: 2.7566
  tol: 0.002
  unit: Hz
  py: "math.sqrt(300)/(2*math.pi)"
  explain: $\omega_2 = \sqrt{300} = 17.32$ rad/s, and $17.32/2\pi = 2.757$ Hz.
- type: num
  q: Using $\omega_j = 2\sqrt{k/m}\sin(j\pi/(2(n+1)))$ with $k/m = 100$, what is the lowest frequency of a 3-cart chain in rad/s?
  answer: 7.6537
  tol: 0.001
  py: "20*math.sin(math.pi/8)"
  explain: $20\sin(\pi/8) = 20 \times 0.3827 = 7.654$ rad/s.
- type: mc
  q: In the generalised eigenproblem $K\mathbf v = \omega^2 M\mathbf v$, the eigenvector is…
  options:
    - the damping ratio
    - the mode shape, the relative amplitude of each mass
    - the force on each mass
    - always (1, 1, …)
  answer: 1
  explain: Each eigenvector says how far each mass moves relative to the others when the structure vibrates in that mode.
- type: mc
  q: Why transform to $M^{-1/2}KM^{-1/2}$?
  options:
    - It is faster to write
    - The result is symmetric, so eigenvalues are real and a symmetric solver such as Jacobi applies
    - It removes the springs
    - It doubles the frequencies
  answer: 1
  explain: $K$ is symmetric, and conjugating by the diagonal $M^{-1/2}$ keeps it symmetric while turning the problem into a standard eigenproblem.
- type: num
  q: With $m_2 = 2$ kg (others as before), what is the lower natural frequency in rad/s?
  answer: 7.962
  tol: 0.002
  py: "math.sqrt(min(np.linalg.eigvals(np.linalg.solve(np.diag([1,2]), [[200,-100],[-100,200]])).real))"
  explain: $\omega^2 = 150 - 86.60 = 63.40$, so $\omega_1 = 7.962$ rad/s.
:::end

:::verify
import numpy as np, math
w2 = sorted(np.linalg.eigvals(np.linalg.solve(np.diag([1,2.]), [[200,-100],[-100,200]])).real)
assert abs(w2[0]-63.40)<0.005 and abs(w2[1]-236.60)<0.005 and abs(math.sqrt(w2[0])-7.962)<5e-4 and abs(math.sqrt(w2[1])-15.382)<5e-4
assert abs(math.sqrt(3)*50 - 86.60) < 0.005
assert abs(10/(2*math.pi)-1.59)<0.005 and abs(math.sqrt(300)-17.32)<0.005 and abs(math.sqrt(300)/(2*math.pi)-2.76)<0.005
assert np.allclose([20*math.sin(j*math.pi/8) for j in (1,2,3)],[7.654,14.142,18.478],atol=5e-4)
:::end
