import numpy as np

def sar_convert(vin, weights, lsb):
    """weights[k] is the DAC weight of bit k in LSB units (ideal: 2**k)."""
    code = 0
    for k in reversed(range(len(weights))):
        trial = code | (1 << k)
        vdac = lsb * sum(weights[b] for b in range(len(weights)) if trial >> b & 1)
        if vin >= vdac:
            code = trial
    return code

def transitions(weights, lsb):
    """Transition level into each code: the DAC voltage of that code."""
    n = len(weights)
    return np.array([lsb * sum(weights[b] for b in range(n) if c >> b & 1) for c in range(2**n)])

def dnl_inl(T, lsb):
    width = np.diff(T) / lsb
    dnl = width - 1               # dnl[k] is code k's width error (the top code has no upper edge)
    inl = T / lsb - np.arange(len(T))
    return dnl, inl

if __name__ == "__main__":
    n, vref = 8, 3.3
    lsb = vref / 2**n
    ideal = [2**k for k in range(n)]
    assert sar_convert(2.137, ideal, lsb) == 165 and abs(2.137 / lsb - 165 - 0.77) < 0.01
    dnl, inl = dnl_inl(transitions(ideal, lsb), lsb)
    assert np.allclose(dnl, 0) and np.allclose(inl, 0)
    bad = ideal.copy(); bad[7] *= 1.01                      # MSB 1 % large
    T = transitions(bad, lsb)
    dnl, inl = dnl_inl(T, lsb)
    print(f"MSB +1 %: DNL at code 127 = {dnl[127]:+.2f} LSB, max INL = {inl.max():.2f} LSB")
    assert abs(dnl[127] - 1.28) < 1e-9                       # code 127 is wider by the extra MSB weight
    # MSB 1 % small instead: code 127 gets narrower than 0 -> the code goes missing
    small = ideal.copy(); small[7] *= 0.99
    vin = np.linspace(0, vref * 0.999, 200_000)
    codes = np.array([sar_convert(v, small, lsb) for v in vin[::20]])
    hist = np.bincount(codes, minlength=256)
    assert hist[127] == 0, "missing code"
    # histogram test recovers code widths for the +1 % case
    codes = np.array([sar_convert(v, bad, lsb) for v in vin[::4]])
    hist = np.bincount(codes, minlength=256).astype(float)
    est = hist / hist[1:125].mean() - 1
    assert abs(est[127] - dnl[127]) < 0.05
    print("missing code 127 found with MSB -1 %; ramp histogram DNL matches the transition levels")
