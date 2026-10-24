---
id: p06-l11
minutes: 40
summary: Every flip-flop has setup and hold windows, and an asynchronous input will eventually violate them. You derive the synchroniser MTBF formula, see why one extra flip-flop turns milliseconds into longer than the age of the universe, and check the failure model with a Monte Carlo simulation.
---

## Setup, hold and the critical path

A D flip-flop (lesson 7) only promises a clean result if D is stable from $t_{su}$ before the clock edge until $t_h$ after it. Inside one clock domain, static timing analysis guarantees it: the slowest path between two flip-flops must satisfy

$$t_{clk\to q} + t_{logic} + t_{su} \le T_{clk}.$$

That's what sets the maximum clock frequency of a design: lesson 5's ripple adder delay sits in $t_{logic}$.

## Asynchronous inputs and metastability

A button, an encoder line or a signal from another clock domain changes whenever it likes, so sooner or later it changes inside the setup/hold window. The flip-flop's cross-coupled inverters can then balance at the midpoint, **metastable**, and settle to 0 or 1 after a random time. The probability of still being undecided after time $t$ decays exponentially with a time constant $\tau$ (tens of ps in modern silicon).

If the output must be settled within a time $t_r$, the mean time between failures is

$$\text{MTBF} = \frac{e^{t_r/\tau}}{T_0\, f_{clk}\, f_{data}},$$

where $T_0$ is the effective window width, $f_{clk}$ the clock rate and $f_{data}$ the rate of asynchronous changes. The cure is a **two-flip-flop synchroniser**: the first flop may go metastable, and it gets a full clock period to resolve before the second one samples it. That puts about one clock period into the exponent.

**Rule:** every asynchronous input goes through exactly one synchroniser before it fans out. If two flip-flops sample the same raw input with slightly different wiring delays, they can disagree on the same clock edge, and the state machine ends up in an impossible state.

:::figure widget=mtbf caption="MTBF on a log scale for 1, 2 and 3 flip-flops. The exponent dominates: each extra stage multiplies the MTBF by e^{T/τ}."
:::end

## Worked example

An FPGA runs at 100 MHz and synchronises an input changing at up to 1 MHz. Take τ = 20 ps and $T_0$ = 100 ps.

1. With one flop and no settling time: $\text{MTBF} = 1/(10^{-10}\cdot10^8\cdot10^6) = 10^{-4}$ s. That's a failure every 100 µs.
2. With two flops, the first gets about 90 % of a 10 ns period: $t_r = 9$ ns, so $t_r/\tau = 450$ and the MTBF is $e^{450}\times10^{-4} \approx 10^{191}$ s. The universe is about $4\times10^{17}$ s old.
3. At 500 MHz with a slow τ = 60 ps: $t_r = 1.8$ ns and $t_r/\tau = 30$, so the MTBF is $e^{30}/(10^{-10}\cdot5\times10^{8}\cdot10^{6}) = 2.1\times10^{8}$ s, about 7 years. Across a fleet of 10 000 units that's several failures a day. Add a third flop.

## Code it from scratch

The simulation exaggerates τ so failures are frequent enough to count. It also shows the fan-out bug.

:::code file=metastability.py
```python
import math
import numpy as np

rng = np.random.default_rng(1)

def mtbf(t_r, tau, T0, f_clk, f_data):
    return math.exp(t_r / tau) / (T0 * f_clk * f_data)

def simulate_failures(n_events, f_clk, T0, tau, t_r):
    """Each async edge lands uniformly within a clock period; inside the window it goes metastable and
    resolves after an exponential time. A failure is when it is still unresolved after t_r."""
    T = 1 / f_clk
    phase = rng.uniform(0, T, n_events)
    meta = phase < T0
    resolve = rng.exponential(tau, n_events)
    return np.count_nonzero(meta & (resolve > t_r))

if __name__ == "__main__":
    assert abs(mtbf(0, 20e-12, 100e-12, 100e6, 1e6) - 1e-4) < 1e-12
    assert math.log10(mtbf(9e-9, 20e-12, 100e-12, 100e6, 1e6)) > 190
    years = mtbf(1.8e-9, 60e-12, 100e-12, 500e6, 1e6) / 3.156e7
    assert 6 < years < 8
    # Monte Carlo with an exaggerated tau of 1 ns
    f_clk, T0, tau, n = 100e6, 0.5e-9, 1e-9, 4_000_000
    for t_r in (0.0, 2e-9, 4e-9):
        fails = simulate_failures(n, f_clk, T0, tau, t_r)
        predicted = n * T0 * f_clk * math.exp(-t_r / tau)
        print(f"t_r = {t_r*1e9:.0f} ns: {fails} failures, predicted {predicted:.0f}")
        assert abs(fails - predicted) < 5 * math.sqrt(predicted) + 1
    # fan-out bug: two flops see the raw input with 0.3 ns different routing delays
    T, skew = 1 / f_clk, 0.3e-9
    phase = rng.uniform(0, T, 1_000_000)          # where the input edge lands relative to the clock
    disagree = np.count_nonzero(phase < skew)     # one flop sees the new value, the other the old one
    assert abs(disagree / 1e6 - skew * f_clk) < 0.002
    print(f"unsynchronised fan-out: flops disagree on {100*disagree/1e6:.1f} % of input changes")
```
:::end

## Exercises

:::exercise
What does doubling the clock frequency do to a two-flop synchroniser's MTBF?
:::solution
It hurts twice: the denominator doubles, and $t_r$ halves, which takes the square root of the exponential term. Synchronisers on fast clocks may need three stages.
:::end

:::exercise
Why doesn't a synchroniser on each bit work for a multi-bit counter crossing clock domains?
:::solution
Each bit resolves independently, so during a change from 0111 to 1000 the receiver can capture any mix, such as 1111. Pass a Gray-coded counter (one bit changes at a time, lesson 9) or use a handshake or FIFO.
:::end

## Quiz

:::quiz
- type: num
  q: MTBF in seconds of one flop with no settling time, 100 MHz clock, 1 MHz data, T0 = 100 ps?
  answer: 0.0001
  tol: 0.001
  unit: s
  py: "1/(1e-10*1e8*1e6)"
  explain: Just the denominator.
- type: num
  q: The exponent t_r/τ for t_r = 9 ns and τ = 20 ps?
  answer: 450
  tol: 0.001
  py: "9e-9/20e-12"
  explain: It's the exponent that makes synchronisers work.
- type: mc
  q: An async input should go through how many synchronisers before use?
  options:
    - one per flop that uses it
    - exactly one, then fan out the synchronised signal
    - none if the logic is fast
    - two in parallel
  answer: 1
  explain: Otherwise the users can disagree.
- type: num
  q: MTBF in years at 500 MHz, τ = 60 ps, t_r = 1.8 ns, 1 MHz data, T0 = 100 ps?
  answer: 6.79
  tol: 0.02
  unit: years
  py: "math.exp(30)/(1e-10*5e8*1e6)/3.156e7"
  explain: Fine for one unit, poor for a fleet.
- type: mc
  q: The maximum clock frequency inside one clock domain is set by…
  options:
    - the slowest flop-to-flop path including setup time
    - the metastability τ
    - the number of flip-flops
    - the supply voltage only
  answer: 0
  explain: Static timing.
- type: num
  q: Fraction (in %) of input changes on which two flops with 0.3 ns skew disagree at 100 MHz?
  answer: 3
  tol: 0.001
  unit: '%'
  py: "0.3e-9*100e6*100"
  explain: Skew times clock frequency.
:::end

:::verify
import math
assert abs(math.exp(30) - 1.0686e13) / 1.0686e13 < 1e-3
:::end
