import numpy as np

def node2(R_load=None, I_inject=0.0, Vs=10.0):
    """Voltage at node 2 of the lesson 3 circuit, with an optional load to ground at node 2 (kOhm, mA, V)."""
    g4 = 1 / 4 + (0 if R_load is None else 1 / R_load)
    G = np.array([[1 / 1 + 1 / 2 + 1 / 2, -1 / 2], [-1 / 2, 1 / 2 + g4]])
    return np.linalg.solve(G, [Vs / 1, I_inject])[1]

def short_current():
    return node2(R_load=1e-9) / 1e-9

if __name__ == "__main__":
    vth = node2()
    isc = short_current()
    rth = vth / isc
    print(f"Vth {vth:.4f} V, IN {isc:.4f} mA, Rth {rth:.4f} kOhm")
    assert abs(vth - 4.0) < 1e-9 and abs(isc - 2.5) < 1e-6 and abs(rth - 1.6) < 1e-6
    # the equivalent predicts every load exactly
    for RL in (0.1, 1.0, 1.6, 10.0, 470.0):
        assert abs(node2(R_load=RL) - vth * RL / (rth + RL)) < 1e-6
    # and a current injection
    assert abs(node2(I_inject=1.0) - (vth + 1.0 * rth)) < 1e-6
    # bench method: open-circuit voltage plus one loaded reading
    v_loaded = node2(R_load=4.7)
    assert abs(4.7 * (vth / v_loaded - 1) - 1.6) < 1e-9
