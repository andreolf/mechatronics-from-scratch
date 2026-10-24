from itertools import combinations, product

def combine(a, b):
    """Terms are strings over {'0','1','-'}; merge if they differ in exactly one fixed bit."""
    diff = [i for i, (x, y) in enumerate(zip(a, b)) if x != y]
    if len(diff) == 1 and "-" not in (a[diff[0]], b[diff[0]]):
        return a[: diff[0]] + "-" + a[diff[0] + 1 :]
    return None

def covers(term, m, n):
    bits = format(m, f"0{n}b")
    return all(t in "-" + b for t, b in zip(term, bits))

def minimise(ones, n, dont_care=()):
    terms = {format(m, f"0{n}b") for m in set(ones) | set(dont_care)}
    primes = set()
    while terms:
        merged, used = set(), set()
        for a, b in combinations(sorted(terms), 2):
            c = combine(a, b)
            if c:
                merged.add(c); used |= {a, b}
        primes |= terms - used
        terms = merged
    # cover: essential primes first, then greedy
    left, chosen = set(ones), []
    for m in sorted(ones):
        cands = [p for p in primes if covers(p, m, n)]
        if len(cands) == 1 and cands[0] not in chosen:
            chosen.append(cands[0])
    for p in chosen:
        left -= {m for m in left if covers(p, m, n)}
    while left:
        best = max(primes, key=lambda p: sum(covers(p, m, n) for m in left))
        chosen.append(best); left -= {m for m in left if covers(best, m, n)}
    return sorted(chosen)

def evaluate(terms, m, n):
    return any(covers(t, m, n) for t in terms)

if __name__ == "__main__":
    f = minimise([1, 3, 5, 7, 13, 15], 4)
    print("F =", f)                                        # '0--1' is A'D, '-1-1' is BD
    assert f == ["-1-1", "0--1"]
    # De Morgan for all inputs
    for a, b in product((0, 1), repeat=2):
        assert (not (a and b)) == ((not a) or (not b)) and (not (a or b)) == ((not a) and (not b))
    # random functions: the minimised form always matches the truth table
    import random
    random.seed(3)
    for _ in range(300):
        ones = [m for m in range(16) if random.random() < 0.5]
        terms = minimise(ones, 4)
        assert all(evaluate(terms, m, 4) == (m in ones) for m in range(16))
    # don't-cares can shrink the answer: BCD digits 10..15 never occur
    assert minimise([8, 9], 4, dont_care=range(10, 16)) == ["1---"]
