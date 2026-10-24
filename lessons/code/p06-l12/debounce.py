import numpy as np

rng = np.random.default_rng(3)

def press_sequence(n_presses, bounce_ms=5, hold_ms=120, gap_ms=150):
    """1 kHz samples of a switch with random chatter at each transition."""
    x = []
    for _ in range(n_presses):
        x += [0] * gap_ms
        x += [int(rng.random() < k / bounce_ms) for k in range(bounce_ms)]       # chatter while closing
        x += [1] * hold_ms
        x += [int(rng.random() > k / bounce_ms) for k in range(bounce_ms)]       # chatter while opening
    return np.array(x + [0] * gap_ms)

def counter_debounce(x, N):
    out, state, cnt = [], x[0], 0
    for v in x:
        if v != state:
            cnt += 1
            if cnt >= N:
                state, cnt = v, 0
        else:
            cnt = 0
        out.append(state)
    return np.array(out)

def integrator_debounce(x, N):
    out, acc, state = [], 0, 0
    for v in x:
        acc = min(N, acc + 1) if v else max(0, acc - 1)
        if acc == N:
            state = 1
        elif acc == 0:
            state = 0
        out.append(state)
    return np.array(out)

def rising(y):
    return int(np.count_nonzero((y[1:] == 1) & (y[:-1] == 0)))

if __name__ == "__main__":
    x = press_sequence(50)
    print("raw rising edges:", rising(x))
    assert rising(x) > 50
    for f in (counter_debounce, integrator_debounce):
        y = f(x, 8)
        assert rising(y) == 50, f.__name__
    # latency of the counter debouncer: output rises N samples after the input last rose
    y = counter_debounce(x, 8)
    last_raw_rise = 150 + max(k for k in range(5) if x[150 + k] == 1 and x[149 + k] == 0)
    first_clean = int(np.argmax(y))
    assert first_clean - last_raw_rise <= 8
    # too small a count lets bounce through
    assert rising(counter_debounce(x, 1)) > 50
    print("N = 8 at 1 kHz: exactly 50 presses from 50, latency <= 8 ms")
