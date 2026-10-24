---
id: p05-l03
minutes: 35
summary: Kirchhoff's two laws plus Ohm's law give a linear system for any resistor circuit. You derive nodal analysis, solve a two-node circuit with a current source by hand, write a general nodal solver that stamps elements into a conductance matrix, and check superposition.
---

## Kirchhoff's laws

- **KCL (current law)**: the currents leaving any node sum to zero. Charge doesn't pile up in a wire.
- **KVL (voltage law)**: the voltages around any closed loop sum to zero. Voltage is a potential, so returning to the start returns to the same value.

## Nodal analysis

1. Pick a ground node (0 V).
2. Give every other node an unknown voltage $v_1, v_2, \dots$
3. Write KCL at each unknown node, expressing each resistor current as $(v_a - v_b)/R$.
4. Solve the resulting linear system $G\mathbf v = \mathbf i$ (Phase 01 lesson 7).

$G$ has a neat pattern. The diagonal entry $G_{kk}$ is the sum of conductances touching node $k$, and the off-diagonal $G_{jk}$ is minus the conductance between $j$ and $k$. A resistor between nodes $a$ and $b$ **stamps** $+g$ on both diagonals and $-g$ on both off-diagonals. A current source adds to the right-hand side. That's exactly how SPICE builds its equations (lesson 22).

**Superposition.** Because the system is linear, the response to several sources is the sum of the responses to each one alone, with the others switched off (voltage sources shorted, current sources opened).

:::figure widget=nodal caption="A two-node circuit. Change R3 or the current source and the solver updates both node voltages; the KCL residuals stay at zero."
:::end

## Worked example

A 10 V source feeds node 1 through $R_1 = 1$ kΩ. $R_2 = 2$ kΩ goes from node 1 to ground, $R_3 = 2$ kΩ links nodes 1 and 2, $R_4 = 4$ kΩ goes from node 2 to ground, and a 1 mA source pushes current into node 2. Work in kΩ, mA and V.

1. KCL at node 1: $\frac{v_1 - 10}{1} + \frac{v_1}{2} + \frac{v_1 - v_2}{2} = 0$.
2. KCL at node 2: $\frac{v_2 - v_1}{2} + \frac{v_2}{4} = 1$.
3. In matrix form: $\begin{bmatrix}2 & -0.5\\ -0.5 & 0.75\end{bmatrix}\begin{bmatrix}v_1\\v_2\end{bmatrix} = \begin{bmatrix}10\\1\end{bmatrix}$.
4. Determinant $2\times0.75 - 0.25 = 1.25$, so $v_1 = (10\times0.75 + 0.5)/1.25 = 6.4$ V and $v_2 = (2\times1 + 0.5\times10)/1.25 = 5.6$ V.
5. Superposition check: the 10 V source alone gives $v_2 = 4.0$ V; the 1 mA source alone gives 1.6 V. They add up to 5.6 V.

## Code it from scratch

:::code file=nodal.py
```python
import numpy as np

def solve(n_nodes, resistors, isources=(), vsources_via_r=()):
    """resistors: (a, b, R); isources: (node, I into node); vsources_via_r: (node, V, R) a source V behind R to ground.
    Node 0 is ground. Returns voltages of nodes 1..n."""
    G = np.zeros((n_nodes, n_nodes)); b = np.zeros(n_nodes)
    def stamp(a, c, g):
        for x, y, s in ((a, a, g), (c, c, g), (a, c, -g), (c, a, -g)):
            if x and y:
                G[x - 1, y - 1] += s
    for a, c, R in resistors:
        stamp(a, c, 1 / R)
    for node, I in isources:
        b[node - 1] += I
    for node, V, R in vsources_via_r:               # Norton equivalent of V in series with R
        stamp(node, 0, 1 / R); b[node - 1] += V / R
    return np.linalg.solve(G, b)

if __name__ == "__main__":
    R = [(1, 0, 2.0), (1, 2, 2.0), (2, 0, 4.0)]
    v = solve(2, R, [(2, 1.0)], [(1, 10.0, 1.0)])
    print("v1, v2 =", v)
    assert np.allclose(v, [6.4, 5.6])
    # KCL residuals at both nodes
    v1, v2 = v
    assert abs((v1 - 10) / 1 + v1 / 2 + (v1 - v2) / 2) < 1e-12 and abs((v2 - v1) / 2 + v2 / 4 - 1) < 1e-12
    # superposition
    va = solve(2, R, [], [(1, 10.0, 1.0)])
    vb = solve(2, R, [(2, 1.0)], [(1, 0.0, 1.0)])
    assert np.allclose(va + vb, v) and np.allclose([va[1], vb[1]], [4.0, 1.6])
    # G is symmetric for resistor-only circuits
    G = np.array([[2, -0.5], [-0.5, 0.75]])
    assert np.allclose(np.linalg.solve(G, [10, 1]), v)
```
:::end

## Exercises

:::exercise
In the worked example, find the current through $R_3$ and its direction.
:::solution
$(v_1 - v_2)/R_3 = (6.4 - 5.6)/2 = 0.4$ mA, flowing from node 1 to node 2.
:::end

:::exercise
Check KVL around the loop source → $R_1$ → $R_2$ → ground → source.
:::solution
The source rises 10 V. $R_1$ drops $10 - 6.4 = 3.6$ V and $R_2$ drops 6.4 V. $10 - 3.6 - 6.4 = 0$. ✓
:::end

## Quiz

:::quiz
- type: num
  q: What is v1 in the worked example, in volts?
  answer: 6.4
  tol: 0.001
  unit: V
  py: "(10*0.75+0.5)/1.25"
  explain: Cramer's rule on the 2×2 system.
- type: num
  q: What is v2, in volts?
  answer: 5.6
  tol: 0.001
  unit: V
  py: "(2*1+0.5*10)/1.25"
  explain: Or by superposition, 4.0 + 1.6.
- type: mc
  q: A resistor between nodes a and b adds to the conductance matrix…
  options:
    - +g at (a, b) only
    - +g on both diagonals and −g on both off-diagonals
    - −g on the diagonals
    - nothing if one node is ground
  answer: 1
  explain: That's the stamp. If one node is ground, only the other diagonal gets +g.
- type: num
  q: What is the current through R3 in mA?
  answer: 0.4
  tol: 0.001
  unit: mA
  py: "(6.4-5.6)/2"
  explain: $(v_1 - v_2)/R_3$.
- type: mc
  q: KCL is a consequence of…
  options:
    - conservation of energy
    - conservation of charge
    - Ohm's law
    - Faraday's law
  answer: 1
  explain: Charge can't accumulate at a node.
- type: num
  q: With only the 1 mA source active, what is v2 in volts?
  answer: 1.6
  tol: 0.001
  unit: V
  py: "1*1/(1/4+1/(2+2/3))"
  explain: 1 mA into $R_4\|(R_3 + R_1\|R_2) = 1.6$ kΩ.
:::end

:::verify
assert abs(2*0.75-0.25-1.25)<1e-12 and abs(10-3.6-6.4)<1e-12
:::end
