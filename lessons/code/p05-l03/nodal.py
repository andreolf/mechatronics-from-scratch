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
