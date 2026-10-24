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
