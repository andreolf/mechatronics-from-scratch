def inverting(vin, rin, rf, A=1e12):
    """Finite-gain solve: v- = (vin*rf + vout*rin)/(rin+rf), vout = -A v-."""
    k = rf / (rin + rf); m = rin / (rin + rf)
    return -A * k * vin / (1 + A * m)

def noninverting(vin, rg, rf, A=1e12):
    beta = rg / (rg + rf)
    return A * vin / (1 + A * beta)

def clip(v, rail=11.5):
    return max(-rail, min(rail, v))

if __name__ == "__main__":
    assert abs(inverting(1.0, 10e3, 47e3) + 4.7) < 1e-9
    assert abs(noninverting(0.5, 10e3, 56e3) - 3.3) < 1e-9
    # with a realistic A = 1e5 the error is about the noise gain over A
    err = 1 - noninverting(0.5, 10e3, 56e3, A=1e5) / 3.3
    print(f"gain error with A = 1e5: {err*100:.4f} %")
    assert abs(err - 6.6 / 1e5) < 1e-6
    err_inv = 1 - inverting(1.0, 10e3, 47e3, A=1e5) / -4.7
    assert abs(err_inv - 5.7 / 1e5) < 1e-6             # inverting: noise gain is 1 + Rf/Rin = 5.7
    assert clip(inverting(3.0, 10e3, 47e3)) == 11.5 or clip(inverting(3.0, 10e3, 47e3)) == -11.5
    # loading: a 5 k source into a 10 k inverting input loses a third of the signal
    assert abs(10e3 / (5e3 + 10e3) - 2 / 3) < 1e-12
    # summing: -Rf (v1/R1 + v2/R2)
    vout = -10e3 * (0.3 / 10e3 + (-1.0) / 20e3)
    assert abs(vout - 0.2) < 1e-12
