---
id: p06-l03
minutes: 40
summary: Interlocks and decoders are Boolean functions, and fewer gates means cheaper, faster, easier-to-check logic. You use De Morgan's laws, minimise with Karnaugh maps, implement Quine-McCluskey, and check every minimised expression against its truth table.
---

## Boolean algebra

Variables are 0 or 1; AND is $AB$, OR is $A + B$, and NOT is $A'$. Useful identities:

- $A + A' = 1$, $AA' = 0$, $A + AB = A$ (absorption)
- $AB + AB' = A$ (the combining rule behind every minimisation)
- **De Morgan**: $(AB)' = A' + B'$ and $(A + B)' = A'B'$. Any function can be built from NAND gates alone (or NOR alone), which is how standard cell libraries work (lesson 4).

Any function can be written as a **sum of products** (SOP), an OR of AND terms. Each input row where the output is 1 is a **minterm**; for four inputs ABCD, minterm 13 is $ABC'D$.

## Karnaugh maps

A K-map arranges the truth table so that neighbouring cells differ in exactly one variable. Rows and columns follow Gray code (00, 01, 11, 10), and the edges wrap around. Any rectangle of $2^k$ adjacent 1s combines (by $AB + AB' = A$) into a single product term missing $k$ variables. To minimise:

1. Cover every 1 with the largest possible power-of-two rectangles (**prime implicants**).
2. Take the ones that are the only cover for some 1 (**essential** primes).
3. Cover what's left with as few extra primes as possible.

**Don't-care** cells (input combinations that can't happen) can be counted as 1 when that makes a group bigger.

**Quine-McCluskey** is the same idea as an algorithm: merge terms that differ in one bit, repeat until nothing merges (these are the prime implicants), then solve the covering problem. K-maps stop being practical beyond five or six variables; the algorithm doesn't.

:::figure widget=kmap caption="A 4-variable K-map. Tap cells to set minterms; the coloured outlines are the chosen groups, and the readout shows the minimal sum of products."
:::end

## Worked example

A press may run (F = 1) only in these input states (A guard closed, B two-hand button, C maintenance key, D power OK), given as minterms {1, 3, 5, 7, 13, 15}.

1. Minterms 1, 3, 5 and 7 all have $A = 0$ and $D = 1$: a group of four, $A'D$.
2. Minterms 5, 7, 13 and 15 all have $B = 1$ and $D = 1$: $BD$.
3. Both groups are essential, and together they cover everything: $F = A'D + BD = D(A' + B)$.
4. Six 4-input AND terms shrink to one AND and one OR (or 2 gates in factored form). Checking all 16 input rows confirms it.

## Code it from scratch

:::code file=quine_mccluskey.py
```python
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
```
:::end

## Exercises

:::exercise
Minimise $F(A, B, C) = \sum m(0, 2, 4, 6)$.
:::solution
All four have $C = 0$, and the K-map wraps, so they form one group: $F = C'$.
:::end

:::exercise
Express $F = A'D + BD$ using only NAND gates.
:::solution
$F = ((A'D)'(BD)')'$ by De Morgan: two NANDs for the products, one NAND to combine them, and one NAND with tied inputs to make $A'$. Four NAND gates.
:::end

## Quiz

:::quiz
- type: mc
  q: De Morgan's law says (AB)′ equals…
  options:
    - A′B′
    - A′ + B′
    - A + B
    - (A + B)′
  answer: 1
  explain: NOT-AND is OR of NOTs.
- type: mc
  q: Minimal SOP for minterms {1, 3, 5, 7, 13, 15} of ABCD?
  options:
    - A′D + BD
    - ABD + A′D
    - D
    - A′B′D + BD
  answer: 0
  explain: Two groups of four.
- type: num
  q: How many variables does a group of 4 cells remove from a product term?
  answer: 2
  tol: 0.001
  py: "math.log2(4)"
  explain: A group of $2^k$ cells removes $k$ variables.
- type: mc
  q: K-map rows and columns are ordered in Gray code so that…
  options:
    - the map is sorted numerically
    - neighbouring cells differ in exactly one variable
    - don't-cares are grouped
    - the map has fewer cells
  answer: 1
  explain: Adjacency equals a one-bit difference.
- type: num
  q: How many minterms does a 4-input function have in total?
  answer: 16
  tol: 0.001
  py: "2**4"
  explain: One per input combination.
- type: mc
  q: An essential prime implicant is one that…
  options:
    - covers the most minterms
    - is the only prime covering some minterm
    - contains a don't-care
    - has no complemented variables
  answer: 1
  explain: It must appear in every minimal cover.
:::end

:::verify
from itertools import product
for a,b,c,d in product((0,1),repeat=4):
    m = a*8+b*4+c*2+d
    assert ((not a and d) or (b and d)) == (m in (1,3,5,7,13,15))
:::end
