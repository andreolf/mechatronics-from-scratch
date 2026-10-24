---
id: p01-l03
minutes: 30
summary: Vectors describe forces, velocities and positions. You derive what the dot product and the cross product mean geometrically, compute the moment a force makes about a joint, and implement `dot`, `cross` and `norm` without calling a library.
---

## Vectors as arrows and as lists

A vector in 3D is a list of three numbers $\mathbf a = (a_x, a_y, a_z)$ measured along fixed axes. It is also an arrow with a length $\lVert \mathbf a \rVert = \sqrt{a_x^2 + a_y^2 + a_z^2}$ and a direction. You will switch between these two views all the time: the list is what code stores, the arrow is what you reason about.

## The dot product measures alignment

Define the dot product algebraically as

$$\mathbf a \cdot \mathbf b = a_x b_x + a_y b_y + a_z b_z .$$

To see what it means, apply the law of cosines to the triangle with sides $\mathbf a$, $\mathbf b$ and $\mathbf a - \mathbf b$:

$$\lVert \mathbf a - \mathbf b \rVert^2 = \lVert \mathbf a \rVert^2 + \lVert \mathbf b \rVert^2 - 2\lVert \mathbf a\rVert\lVert \mathbf b\rVert\cos\theta .$$

Expanding the left side with the algebraic definition gives $\lVert \mathbf a\rVert^2 + \lVert \mathbf b\rVert^2 - 2\,\mathbf a\cdot\mathbf b$. Comparing the two,

$$\mathbf a \cdot \mathbf b = \lVert \mathbf a \rVert \lVert \mathbf b \rVert \cos\theta .$$

So the dot product is zero for perpendicular vectors, positive when they point the same way, and $\mathbf a \cdot \hat{\mathbf u}$ is the length of $\mathbf a$'s shadow on a unit direction $\hat{\mathbf u}$. Mechanical work $W = \mathbf F \cdot \mathbf d$ is exactly that shadow: only the part of the force along the motion does work.

:::figure widget=vectors caption="Move a (lime) and b (blue). Tap near a tip to place it, or press Drag to drag on a touchscreen. The shaded parallelogram's signed area is the z-component of a × b; the amber arrow is b projected onto a."
:::end

## The cross product is an area with a direction

The cross product of two 3D vectors is

$$\mathbf a \times \mathbf b = \begin{pmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{pmatrix}.$$

Three facts follow from the formula, and you can check each by expanding it:

- $\mathbf a \cdot (\mathbf a \times \mathbf b) = 0$ and $\mathbf b \cdot (\mathbf a \times \mathbf b) = 0$, so the result is perpendicular to both inputs.
- $\lVert \mathbf a \times \mathbf b \rVert = \lVert\mathbf a\rVert\lVert\mathbf b\rVert\sin\theta$, the area of the parallelogram the two vectors span.
- $\mathbf b \times \mathbf a = -\,\mathbf a \times \mathbf b$. Order matters; the direction follows the right-hand rule.

### Moments about a joint

A force $\mathbf F$ applied at a point $\mathbf r$ from a joint creates the moment (torque)

$$\mathbf M = \mathbf r \times \mathbf F .$$

Its direction is the axis the force tries to turn the body about, and its size is the force times the perpendicular lever arm. This one line is the basis of statics, robot joint torques and the rotational dynamics of Phase 03.

## Worked example: torque on a gripper joint

A gripper pad sits at $\mathbf r = (0.2,\ 0.1,\ 0)$ m from the wrist joint and carries a load of $\mathbf F = (0,\ 0,\ -50)$ N (about 5 kg hanging).

$$\mathbf M = \begin{pmatrix} 0.1\cdot(-50) - 0\cdot 0 \\ 0\cdot 0 - 0.2\cdot(-50) \\ 0.2\cdot 0 - 0.1 \cdot 0 \end{pmatrix} = \begin{pmatrix} -5 \\ 10 \\ 0 \end{pmatrix}\ \text{N·m}.$$

The size is $\sqrt{25 + 100} = 11.18$ N·m. Check perpendicularity: $\mathbf M \cdot \mathbf r = -1 + 1 + 0 = 0$ and $\mathbf M \cdot \mathbf F = 0$. A wrist motor about the x axis feels 5 N·m; one about the y axis feels 10 N·m.

## Code it from scratch

:::code file=vec.py
```python
import math, random
import numpy as np

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return math.sqrt(dot(a, a))

def cross(a, b):
    ax, ay, az = a
    bx, by, bz = b
    return (ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx)

if __name__ == "__main__":
    M = cross((0.2, 0.1, 0.0), (0.0, 0.0, -50.0))
    assert np.allclose(M, (-5, 10, 0)) and abs(norm(M) - 11.1803) < 1e-4
    rng = random.Random(0)
    for _ in range(1000):
        a = [rng.uniform(-1, 1) for _ in range(3)]
        b = [rng.uniform(-1, 1) for _ in range(3)]
        c = cross(a, b)
        assert np.allclose(c, np.cross(a, b), atol=1e-12)
        assert abs(dot(c, a)) < 1e-12 and abs(dot(c, b)) < 1e-12
        assert abs(dot(a, b) - np.dot(a, b)) < 1e-12
    print("dot, cross and norm match NumPy on 1000 random pairs")
```
:::end

## Exercises

:::exercise
Find the angle between $\mathbf a = (1, 2, 3)$ and $\mathbf b = (4, -5, 6)$.
:::solution
1. $\mathbf a \cdot \mathbf b = 4 - 10 + 18 = 12$.
2. $\lVert\mathbf a\rVert = \sqrt{14} = 3.742$, $\lVert\mathbf b\rVert = \sqrt{77} = 8.775$.
3. $\cos\theta = 12 / (3.742 \times 8.775) = 0.3655$, so $\theta = 68.56°$.
:::end

:::exercise
A 30 N force pushes along $(0, 1, 0)$ at the end of a 0.4 m arm that points along $(\cos 30°, \sin 30°, 0)$. What torque does the joint at the origin feel?
:::solution
1. $\mathbf r = 0.4(0.866, 0.5, 0) = (0.3464, 0.2, 0)$ m, $\mathbf F = (0, 30, 0)$ N.
2. $\mathbf M = \mathbf r \times \mathbf F = (0, 0, 0.3464 \times 30 - 0.2 \times 0) = (0, 0, 10.39)$ N·m.
3. Only the force component perpendicular to the arm counts: $0.4 \times 30 \cos 30° = 10.39$ N·m.
:::end

## Quiz

:::quiz
- type: num
  q: Compute $\mathbf a\cdot\mathbf b$ for $\mathbf a = (1,2,3)$ and $\mathbf b = (4,-5,6)$.
  answer: 12
  tol: 0.0001
  py: "np.dot([1,2,3],[4,-5,6])"
  explain: $4 - 10 + 18 = 12$.
- type: num
  q: What is $\lVert \mathbf a \times \mathbf b \rVert$ for the same two vectors?
  answer: 30.561
  tol: 0.001
  py: "np.linalg.norm(np.cross([1,2,3],[4,-5,6]))"
  explain: $\mathbf a\times\mathbf b = (27, 6, -13)$ and $\sqrt{729 + 36 + 169} = \sqrt{934} = 30.56$.
- type: mc
  q: The cross product $\mathbf r \times \mathbf F$ is always…
  options:
    - parallel to the force
    - perpendicular to both r and F
    - a scalar
    - unchanged if you swap r and F
  answer: 1
  explain: Expanding $\mathbf r\cdot(\mathbf r\times\mathbf F)$ gives zero term by term, and the same for $\mathbf F$. Swapping the order flips the sign.
- type: num
  q: A 20 N force acts perpendicular to a 0.15 m lever. What is the size of the moment in N·m?
  answer: 3
  tol: 0.001
  unit: N·m
  py: "0.15*20"
  explain: $\lVert\mathbf r\rVert\lVert\mathbf F\rVert\sin 90° = 0.15 \times 20 = 3$ N·m.
- type: mc
  q: The dot product of a force with a displacement gives…
  options:
    - the torque
    - the work done
    - the power
    - the momentum
  answer: 1
  explain: Work is the component of force along the motion times the distance, $W = \mathbf F\cdot\mathbf d$.
:::end

:::verify
import numpy as np, math
M = np.cross([0.2,0.1,0],[0,0,-50]); assert np.allclose(M,[-5,10,0]); assert abs(np.linalg.norm(M)-11.18) < 0.005
a, b = np.array([1,2,3.]), np.array([4,-5,6.])
th = math.degrees(math.acos(a@b/np.linalg.norm(a)/np.linalg.norm(b))); assert abs(th-68.56) < 0.01
assert abs(np.linalg.norm(a)-3.742)<5e-4 and abs(np.linalg.norm(b)-8.775)<5e-4 and abs(a@b/np.linalg.norm(a)/np.linalg.norm(b)-0.3655)<5e-5
r = 0.4*np.array([math.cos(math.radians(30)), math.sin(math.radians(30)), 0]); assert abs(np.cross(r,[0,30,0])[2]-10.39)<0.005
assert np.allclose(np.cross(a,b),[27,6,-13])
:::end
