from itertools import product

def conducts(net, inputs):
    """net is ('n', var) / ('p', var) for a transistor, or ('series'|'parallel', [nets])."""
    kind = net[0]
    if kind == "n":
        return inputs[net[1]] == 1
    if kind == "p":
        return inputs[net[1]] == 0
    parts = [conducts(x, inputs) for x in net[1]]
    return all(parts) if kind == "series" else any(parts)

def dual(net):
    """Swap series/parallel and NMOS/PMOS: builds the pull-up from the pull-down."""
    kind = net[0]
    if kind in ("n", "p"):
        return ("p" if kind == "n" else "n", net[1])
    return ("parallel" if kind == "series" else "series", [dual(x) for x in net[1]])

def gate(pulldown):
    pullup = dual(pulldown)
    def f(**inputs):
        up, down = conducts(pullup, inputs), conducts(pulldown, inputs)
        assert up != down, "contention or floating output"
        return 1 if up else 0
    return f

NAND = gate(("series", [("n", "A"), ("n", "B")]))
NOR = gate(("parallel", [("n", "A"), ("n", "B")]))
AOI = gate(("parallel", [("series", [("n", "A"), ("n", "B")]), ("n", "C")]))   # (AB + C)'

if __name__ == "__main__":
    for a, b in product((0, 1), repeat=2):
        assert NAND(A=a, B=b) == 1 - (a & b) and NOR(A=a, B=b) == 1 - (a | b)
    for a, b, c in product((0, 1), repeat=3):
        assert AOI(A=a, B=b, C=c) == 1 - ((a & b) | c)
    P = lambda C, V, f: C * V * V * f
    assert abs(P(1e-9, 1.2, 48e6) - 0.06912) < 1e-12 and abs(P(1e-9, 0.9, 48e6) / P(1e-9, 1.2, 48e6) - 0.5625) < 1e-12
    print("NAND, NOR and AND-OR-INVERT truth tables verified; one network always conducts")
