def full_adder_timed(a, b, c):
    """Each input is (value, arrival time); every gate adds 1 unit of delay."""
    p = (a[0] ^ b[0], max(a[1], b[1]) + 1)
    g = (a[0] & b[0], max(a[1], b[1]) + 1)
    pc = (p[0] & c[0], max(p[1], c[1]) + 1)
    cout = (g[0] | pc[0], max(g[1], pc[1]) + 1)
    s = (p[0] ^ c[0], max(p[1], c[1]) + 1)
    return s, cout

def ripple(a, b, n=4):
    c, out = (0, 0), []
    for i in range(n):
        s, c = full_adder_timed(((a >> i) & 1, 0), ((b >> i) & 1, 0), c)
        out.append(s)
    return out, c

def lookahead(a, b, n=4, c0=0):
    p = [((a >> i) & 1) ^ ((b >> i) & 1) for i in range(n)]
    g = [((a >> i) & 1) & ((b >> i) & 1) for i in range(n)]
    carries = [(c0, 0)]
    for i in range(1, n + 1):                    # c_i = g_{i-1} + p_{i-1} g_{i-2} + ... + p_{i-1}..p_0 c0
        terms = []
        for j in range(i):                       # term: g_j * p_{j+1} ... p_{i-1}
            t = g[j]
            for k in range(j + 1, i):
                t &= p[k]
            terms.append(t)
        t = c0
        for k in range(i):
            t &= p[k]
        terms.append(t)
        carries.append((int(any(terms)), 3))     # g/p at 1, AND level at 2, OR level at 3
    sums = [(p[i] ^ carries[i][0], max(1, carries[i][1]) + 1) for i in range(n)]
    return sums, carries[n]

if __name__ == "__main__":
    worst_r = worst_l = 0
    for a in range(16):
        for b in range(16):
            for adder in (ripple, lookahead):
                s, c = adder(a, b)
                assert sum(bit << i for i, (bit, _) in enumerate(s)) + (c[0] << 4) == a + b
            worst_r = max(worst_r, max(t for _, t in ripple(a, b)[0]))
            worst_l = max(worst_l, max(t for _, t in lookahead(a, b)[0]))
    s, c = ripple(15, 1)
    print(f"15 + 1 ripple: sum bit times {[t for _, t in s]}, carry out at {c[1]}; look-ahead worst {worst_l}")
    assert [t for _, t in s] == [2, 4, 6, 8] and c[1] == 9 and worst_r == 8 and worst_l == 4
    assert abs(2 * 32 * 20e-12 - 1.28e-9) < 1e-18
