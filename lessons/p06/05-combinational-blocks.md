---
id: p06-l05
minutes: 35
summary: Adders, multiplexers and decoders are the blocks every processor and FPGA design is built from. You derive the full adder, show why ripple-carry delay grows with word length, derive carry look-ahead from generate and propagate terms, and simulate both at gate level with timing for all 256 input pairs.
---

## Building blocks

- **Multiplexer**: selects one of $2^k$ inputs using $k$ select lines; a 2:1 mux is $Y = S'A + SB$.
- **Decoder**: turns a $k$-bit code into one of $2^k$ active outputs, used for chip selects and address decoding.
- **Full adder**: adds bits $a$, $b$ and carry-in $c$:

$$s = a \oplus b \oplus c, \qquad c_{out} = ab + c(a \oplus b).$$

Define **generate** $g = ab$ (this bit makes a carry by itself) and **propagate** $p = a \oplus b$ (it passes an incoming carry on). Then $c_{out} = g + pc$ and $s = p \oplus c$.

## Ripple carry versus look-ahead

A **ripple-carry adder** chains $n$ full adders. Each carry waits for the previous one, two gate delays per bit (an AND then an OR), so delay grows linearly: $t \approx 2n$ gate delays.

**Carry look-ahead** expands the recursion so every carry depends only on the $g$, $p$ terms and $c_0$:

$$c_1 = g_0 + p_0c_0, \quad c_2 = g_1 + p_1g_0 + p_1p_0c_0, \quad c_3 = g_2 + p_2g_1 + p_2p_1g_0 + p_2p_1p_0c_0.$$

Each carry is a two-level sum of products, so all carries are ready after about 3 gate delays regardless of position. The price is gates with many inputs; real designs use 4-bit look-ahead blocks arranged hierarchically, giving delay that grows like $\log n$.

:::figure widget=adder caption="When each sum bit of a 4-bit adder settles. Ripple carry gets slower for each higher bit; carry look-ahead settles every bit at once."
:::end

## Worked example

Add $1111 + 0001$ (15 + 1), the worst case for ripple carry, with one unit of delay per gate (multi-input gates count as one).

1. At $t = 1$: $p = 1110$ and $g = 0001$.
2. Ripple: $c_1$ is ready at $t = 3$, $c_2$ at 5, $c_3$ at 7, so $s_3 = p_3 \oplus c_3$ settles at $t = 8$. The carry out appears at $t = 9$.
3. Look-ahead: every $c_i$ is ready at $t = 3$, so all sum bits are done at $t = 4$.
4. Scaled up: a 32-bit ripple adder at 20 ps per gate needs about $2\times32\times20 = 1.28$ ns, limiting the clock to about 780 MHz before anything else in the path is counted.

## Code it from scratch

:::code file=adders.py
```python
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
```
:::end

## Exercises

:::exercise
Write the 4:1 multiplexer as a sum of products with selects $S_1S_0$ and inputs $D_0$–$D_3$.
:::solution
$Y = S_1'S_0'D_0 + S_1'S_0D_1 + S_1S_0'D_2 + S_1S_0D_3$.
:::end

:::exercise
How many gate delays does a 16-bit ripple adder need in this model, and how many for 4-bit look-ahead blocks rippling between blocks?
:::solution
Ripple: the top sum bit at $2\times16 = 32$. With four 4-bit look-ahead blocks, each block's carry out takes about 2 extra delays once its carry in is known (about 3 for the first), so roughly $3 + 2\times3 + 1 = 10$, about a third.
:::end

## Quiz

:::quiz
- type: mc
  q: The carry-out of a full adder is…
  options:
    - a ⊕ b ⊕ c
    - ab + c(a ⊕ b)
    - a + b + c
    - (ab)′
  answer: 1
  explain: Generate, or propagate an incoming carry.
- type: num
  q: In this model, when does the top sum bit of a 4-bit ripple adder settle (gate delays)?
  answer: 8
  tol: 0.001
  py: "2*4"
  explain: About 2 delays per bit.
- type: num
  q: And with carry look-ahead?
  answer: 4
  tol: 0.001
  py: "4"
  explain: Carries at 3, then one XOR.
- type: mc
  q: The propagate term p_i is…
  options:
    - a_i b_i
    - a_i ⊕ b_i
    - a_i + b_i + c_i
    - c_i
  answer: 1
  explain: The bit passes a carry when exactly one input is 1.
- type: num
  q: Delay in ns of a 32-bit ripple adder at 20 ps per gate (2 gates per bit)?
  answer: 1.28
  tol: 0.001
  unit: ns
  py: "2*32*20e-3"
  explain: 64 gate delays.
- type: num
  q: How many select lines does a 16:1 multiplexer need?
  answer: 4
  tol: 0.001
  py: "math.log2(16)"
  explain: $2^k$ inputs need $k$ selects.
:::end

:::verify
assert 15 + 1 == 0b10000
:::end
