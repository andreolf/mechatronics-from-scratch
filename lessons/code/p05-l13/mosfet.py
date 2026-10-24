def rdson(vgs, vth=1.8, r10=0.010):
    if vgs <= vth:
        return float("inf")
    return r10 * (10 - vth) / (vgs - vth)

def losses(vgs, I, V, f, t_edge):
    p_cond = I * I * rdson(vgs)
    p_sw = 0.5 * V * I * (2 * t_edge) * f
    return p_cond, p_sw

if __name__ == "__main__":
    assert abs(rdson(10) - 0.010) < 1e-15
    for vgs, expect in ((10, 0.25), (4.5, 0.75926), (3.3, 1.36667)):
        pc, _ = losses(vgs, 5, 12, 20e3, 50e-9)
        assert abs(pc - expect) < 1e-4, (vgs, pc)
    _, psw = losses(10, 5, 12, 20e3, 50e-9)
    assert abs(psw - 0.06) < 1e-12
    t_gpio = 20e-9 / 20e-3                               # Qg / I
    _, psw_slow = losses(10, 5, 12, 20e3, t_gpio)
    print(f"GPIO gate edge {t_gpio*1e6:.1f} us -> switching loss {psw_slow:.2f} W")
    assert abs(t_gpio - 1e-6) < 1e-15 and abs(psw_slow - 1.2) < 1e-9
    # minimum gate voltage for < 0.5 W conduction loss
    vmin = 1.8 + 0.010 * 8.2 / (0.5 / 25)
    assert abs(vmin - 5.9) < 1e-9 and abs(losses(vmin, 5, 12, 0, 0)[0] - 0.5) < 1e-12
    assert abs(1.36667 * 62 - 84.7) < 0.1                # temperature rise without a heatsink
