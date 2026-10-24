def bridge(V, R1, R2, R3, R4):
    return V * (R2 / (R1 + R2) - R4 / (R3 + R4))

def strain_bridge(V, eps, mode, GF=2.0, R=350.0, drift=0.0):
    x = GF * eps
    up, dn = R * (1 + x + drift), R * (1 - x + drift)
    if mode == "quarter":
        return bridge(V, R, up, R, R)
    if mode == "half":                                    # tension and compression gauges in one divider
        return bridge(V, dn, up, R * (1 + drift), R * (1 + drift))
    if mode == "full":
        return bridge(V, dn, up, up, dn)
    raise ValueError(mode)

if __name__ == "__main__":
    assert bridge(5, 350, 350, 350, 350) == 0
    q, h, f = (strain_bridge(5, 1e-3, m) for m in ("quarter", "half", "full"))
    print(f"1000 ue at 5 V: quarter {q*1e3:.4f} mV, half {h*1e3:.4f} mV, full {f*1e3:.4f} mV")
    assert abs(q - 5 * 0.002 / 4.004) < 1e-12 and abs(h - 0.005) < 1e-12 and abs(f - 0.010) < 1e-12
    assert abs((0.0025 - q) / 0.0025 - 0.000999) < 1e-6
    # temperature drift: same fractional change on every gauge
    d = 10 * 10e-6
    q_drift = strain_bridge(5, 0, "quarter", drift=d)
    f_drift = strain_bridge(5, 0, "full", drift=d)
    assert abs(q_drift / (5 * 2 / 4) - 50e-6) < 1e-7    # looks like 50 microstrain
    assert abs(f_drift) < 1e-15                        # cancels
    assert abs(49.4e3 / 249 - 198.4) < 0.1
