---
id: p03-l11
minutes: 35
summary: The FFT computes the discrete Fourier transform in O(N log N) instead of O(N²), which is why spectrum analysers run on microcontrollers. You derive the radix-2 butterfly by splitting even and odd samples, implement it recursively and iteratively, and count the work.
---

## The DFT as a matrix

For $N$ samples $x_n$, the discrete Fourier transform is

$$X_k = \sum_{n=0}^{N-1}x_n\,W_N^{kn}, \qquad W_N = e^{-2\pi j/N}.$$

That's a matrix-vector product with the $N\times N$ matrix $F_{kn} = W_N^{kn}$, costing $N^2$ complex multiplications. At $N = 1024$ that's over a million. The columns of $F$ are orthogonal, so the inverse is $\frac1N\bar F$: the inverse DFT is the same algorithm with conjugated twiddles and a $1/N$.

## Deriving the butterfly

Split the sum into even and odd $n$ (assume $N$ even):

$$X_k = \sum_{m=0}^{N/2-1}x_{2m}W_N^{2mk} + W_N^k\sum_{m=0}^{N/2-1}x_{2m+1}W_N^{2mk}.$$

Since $W_N^2 = W_{N/2}$, both sums are DFTs of length $N/2$. Call them $E_k$ and $O_k$. They're periodic in $k$ with period $N/2$, and $W_N^{k + N/2} = -W_N^k$, so

$$X_k = E_k + W_N^kO_k, \qquad X_{k+N/2} = E_k - W_N^kO_k, \qquad k = 0, \dots, N/2 - 1.$$

One complex multiplication produces two outputs. That's the butterfly. Recursing until length 1 gives $\log_2 N$ stages of $N/2$ butterflies each:

$$\tfrac N2\log_2N \text{ multiplications} \quad\text{versus}\quad N^2.$$

At $N = 1024$: 5120 versus 1,048,576, about 200 times less work.

**Iterative form.** The recursion reads the input in **bit-reversed** order: index 6 = 110₂ ends up at position 011₂ = 3. Reorder once, then run the stages in place, doubling the butterfly span each time. Embedded FFT libraries such as CMSIS-DSP are written this way, with no recursion and no extra memory.

:::figure widget=spectrum caption="Every bin of this spectrum came from a 2048-point radix-2 FFT running in your browser: 11 stages of 1024 butterflies."
:::end

## Worked example

Compute the DFT of $x = [1, 2, 3, 4]$ by hand with the butterfly.

1. Even samples $[1, 3]$ give $E = [1 + 3, 1 - 3] = [4, -2]$. Odd samples $[2, 4]$ give $O = [6, -2]$.
2. Twiddles: $W_4^0 = 1$ and $W_4^1 = -j$.
3. $X_0 = E_0 + O_0 = 10$ and $X_2 = E_0 - O_0 = -2$.
4. $X_1 = E_1 + (-j)O_1 = -2 + 2j$ and $X_3 = E_1 - (-j)O_1 = -2 - 2j$.
5. So $X = [10, -2 + 2j, -2, -2 - 2j]$. $X_0$ is the sum of the samples, and $X_3 = \overline{X_1}$ as it must be for real input.

## Code it from scratch

:::code file=fft.py
```python
import numpy as np

def fft_recursive(x):
    x = np.asarray(x, complex)
    N = len(x)
    if N == 1:
        return x
    E, O = fft_recursive(x[0::2]), fft_recursive(x[1::2])
    w = np.exp(-2j * np.pi * np.arange(N // 2) / N) * O
    return np.concatenate([E + w, E - w])

def fft_iterative(x):
    """In-place radix-2 FFT with bit reversal; returns (X, number of butterflies)."""
    a = np.array(x, complex)
    N = len(a)
    bits = N.bit_length() - 1
    assert 1 << bits == N, "length must be a power of two"
    rev = [int(format(i, f"0{bits}b")[::-1], 2) for i in range(N)]
    a = a[rev]
    flies, span = 0, 1
    while span < N:
        w_step = np.exp(-1j * np.pi / span)
        for start in range(0, N, 2 * span):
            w = 1.0 + 0j
            for k in range(span):
                u, v = a[start + k], w * a[start + k + span]
                a[start + k], a[start + k + span] = u + v, u - v
                w *= w_step
                flies += 1
        span *= 2
    return a, flies

def dft(x):
    N = len(x)
    n = np.arange(N)
    return np.exp(-2j * np.pi * np.outer(n, n) / N) @ np.asarray(x, complex)

if __name__ == "__main__":
    assert np.allclose(fft_recursive([1, 2, 3, 4]), [10, -2 + 2j, -2, -2 - 2j])
    rng = np.random.default_rng(0)
    for N in (8, 64, 1024):
        x = rng.standard_normal(N) + 1j * rng.standard_normal(N)
        ref = np.fft.fft(x)
        Xi, flies = fft_iterative(x)
        assert np.max(np.abs(fft_recursive(x) - ref)) < 1e-9
        assert np.max(np.abs(Xi - ref)) < 1e-9
        assert flies == N // 2 * int(np.log2(N))
    assert np.allclose(dft(x[:64]), np.fft.fft(x[:64]))
    print("matches numpy.fft; butterflies at N = 1024:", flies, "vs N^2 =", 1024**2)
```
:::end

## Exercises

:::exercise
Your recording has 1000 samples. What are your options for a radix-2 FFT?
:::solution
Zero-pad to 1024, which interpolates the spectrum on a finer grid but adds no information. Or truncate to 512, which loses resolution. Mixed-radix FFTs (1000 = 2³·5³) avoid both, and libraries like FFTW and numpy handle any length.
:::end

:::exercise
Where does sample 13 go after bit reversal with $N = 32$?
:::solution
$13 = 01101_2$ reversed is $10110_2 = 22$.
:::end

## Quiz

:::quiz
- type: num
  q: How many butterflies does a radix-2 FFT of 1024 points perform?
  answer: 5120
  tol: 0.001
  py: "1024//2*10"
  explain: $\frac N2\log_2N = 512 \times 10$.
- type: num
  q: Roughly how many times fewer multiplications than the direct DFT is that? Give the ratio $N^2/(\frac N2\log_2N)$.
  answer: 204.8
  tol: 0.001
  py: "1024**2/5120"
  explain: $1048576/5120$.
- type: num
  q: What is $X_0$ for $x = [1, 2, 3, 4]$?
  answer: 10
  tol: 0.001
  py: "1+2+3+4"
  explain: $X_0$ is the sum of the samples.
- type: num
  q: Where does index 6 move under bit reversal for $N = 8$?
  answer: 3
  tol: 0.001
  py: "int('011',2)"
  explain: $110_2$ reversed is $011_2$.
- type: mc
  q: The butterfly relies on which property of the twiddle factor?
  options:
    - $W_N^{k+N/2} = -W_N^k$
    - $W_N$ is real
    - $W_N^k = k$
    - $|W_N| = N$
  answer: 0
  explain: Half a turn later the twiddle flips sign, so one product gives two outputs.
- type: mc
  q: For a real input, $X_{N-k}$ equals…
  options:
    - $X_k$
    - $\overline{X_k}$
    - $-X_k$
    - 0
  answer: 1
  explain: Conjugate symmetry of real signals.
:::end

:::verify
assert int(format(13,'05b')[::-1],2) == 22
assert 1024**2 == 1048576 and round(1048576/5120) == 205
:::end
