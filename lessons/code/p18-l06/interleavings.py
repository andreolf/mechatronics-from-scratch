def naive_writer(m, vals):
    for v in vals:
        m["a"] = v; yield                                   # each yield is a point where the other thread may run
        m["b"] = v; yield

def naive_reader(m, out):
    a = m["a"]; yield
    b = m["b"]; yield
    out.append((a, b))

def seq_writer(m, vals):
    for v in vals:
        m["seq"] += 1; yield                                # odd: write in progress
        m["a"] = v; yield
        m["b"] = v; yield
        m["seq"] += 1; yield                                # even: consistent again

def seq_reader(m, out, tries=2):
    for _ in range(tries):
        s1 = m["seq"]; yield
        a = m["a"]; yield
        b = m["b"]; yield
        s2 = m["seq"]; yield
        if s1 % 2 == 0 and s1 == s2:
            out.append((a, b)); return
    out.append("gave up")                                   # the writer kept it busy; try again next cycle

def tb_writer(m, vals):
    for v in vals:
        m["slot"][m["back"]] = [v, None]; yield             # write the back buffer, which only the writer touches
        m["slot"][m["back"]][1] = v; yield
        m["back"], m["mid"] = m["mid"][0], (m["back"], True); yield   # one atomic exchange publishes it

def tb_reader(m, out):
    if m["mid"][1]:                                         # new data? swap it to the front with one atomic exchange
        m["front"], m["mid"] = m["mid"][0], (m["front"], False)
    yield
    a = m["slot"][m["front"]][0]; yield
    b = m["slot"][m["front"]][1]; yield
    out.append((a, b))

def init(kind):
    if kind == "triple": return {"slot": [[0, 0], [0, 0], [0, 0]], "back": 0, "mid": (1, False), "front": 2}
    return {"a": 0, "b": 0, "seq": 0}

def explore(writer, reader, kind, vals=(1, 2)):
    """run every interleaving of the two threads (sequentially consistent memory) and collect what the reader saw"""
    results = []
    def replay(schedule):
        m = init(kind); out = []; th = [writer(m, vals), reader(m, out)]; alive = [True, True]
        for who in schedule:
            try: next(th[who])
            except StopIteration: alive[who] = False
        return alive, out
    def dfs(schedule):
        alive, out = replay(schedule)
        live = [i for i in (0, 1) if alive[i]]
        for who in live: dfs(schedule + [who])           # branch: either thread may take the next step
        if not live: results.append(out[0] if out else None)
    dfs([])
    return results

def torn(r): return isinstance(r, tuple) and r[0] != r[1]

def test_all():
    for name, w, r, kind in [("naive shared struct", naive_writer, naive_reader, "plain"),
                             ("seqlock", seq_writer, seq_reader, "plain"),
                             ("triple buffer", tb_writer, tb_reader, "triple")]:
        res = explore(w, r, kind)
        seen = sorted({str(x) for x in res})
        nt = sum(torn(x) for x in res)
        print(f"{name}: {len(res)} interleavings, {nt} torn reads, reader saw {seen}")
        if name.startswith("naive"): assert nt > 0
        else: assert nt == 0 and any(isinstance(x, tuple) and x[0] == 2 for x in res)

test_all()
print("PASS")
