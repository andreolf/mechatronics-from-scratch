import numpy as np

def boot_cap(qg=60e-9, iq=150e-6, ileak=20e-6, t_on=50e-6, dv=0.5, qls=5e-9):
    """bootstrap capacitor: it must deliver the gate charge, the high-side driver's quiescent and leakage current
    for the longest on-time, and the level-shifter charge, while drooping no more than dv"""
    q = qg + (iq + ileak) * t_on + qls; return q / dv, q

def simulate(Cb, vdd=12.0, vf=0.6, r_chg=5.0, qg=60e-9, iq=150e-6, ileak=20e-6, qls=5e-9, fs=20e3, D=0.9, periods=200, n=400):
    """switch-node cycles: low side on -> Cb charges from Vdd through the diode and a resistance;
    high side on -> Cb supplies the gate charge at turn-on, then the driver's quiescent and leakage current"""
    T = 1 / fs; dt = T / n; v = vdd - vf; hist, vmin, was_on = [], v, False
    for p in range(periods):
        for k in range(n):
            on = k < round(D * n)
            if on:                                                            # high side on: switch node at Vin
                if not was_on: v -= (qg + qls) / Cb                           # gate charge pulled at turn-on
                v -= (iq + ileak) * dt / Cb
            else:                                                             # low side on: switch node at ground
                v += max(0.0, (vdd - vf - v) / r_chg) * dt / Cb
            was_on = on
            v = max(v, 0.0); vmin = min(vmin, v)
            if p == periods - 1 or D >= 1: hist.append(v)
    return vmin, np.array(hist)

def test_sizing_and_droop():
    t_on = 0.9 / 20e3; Cb, q = boot_cap(t_on=t_on)
    C_pick = 0.47e-6                                                          # next standard value above, with margin
    vmin, _ = simulate(C_pick)
    print(f"charge per cycle {1e9 * q:.1f} nC -> Cb >= {1e9 * Cb:.0f} nF for 0.5 V droop; chosen 470 nF")
    print(f"simulated minimum bootstrap voltage {vmin:.3f} V (start {12 - 0.6:.1f} V), droop {12 - 0.6 - vmin:.3f} V")
    assert C_pick >= Cb and 12 - 0.6 - vmin < 0.5

def test_hundred_percent_duty():
    _, h = simulate(0.47e-6, D=1.0, periods=400)                              # 20 ms with the high side always on
    uvlo = 8.0; t_fail = np.argmax(h < uvlo) * (1 / 20e3 / 400)
    print(f"100 % duty: the bootstrap voltage reaches the {uvlo} V undervoltage lockout after {1000 * t_fail:.2f} ms")
    assert (h < uvlo).any() and t_fail < 20e-3                                # a bootstrap cannot hold the gate on forever

test_sizing_and_droop()
test_hundred_percent_duty()
print("PASS")
