import numpy as np

def linear_reg(vin, vout, iout, iq=5e-3):
    """a linear regulator drops the difference across a pass transistor: P_loss = (Vin - Vout) Iout + Vin Iq"""
    p_loss = (vin - vout) * iout + vin * iq; p_out = vout * iout
    return p_out / (p_out + p_loss), p_loss

def buck_losses(vin, vout, iout, fs=500e3, rds_hi=25e-3, rds_lo=12e-3, dcr=15e-3, t_sw=10e-9, qg=8e-9, vg=5.0, ripple=0.3, t_dead=20e-9, vf=0.7, iq=2e-3):
    """loss budget of a synchronous buck: conduction in both MOSFETs and the inductor, switching overlap, gate drive"""
    D = vout / vin; irms2 = iout**2 * (1 + ripple**2 / 12)             # rms squared of a triangle-on-DC current
    p = {"high-side conduction": D * irms2 * rds_hi,
         "low-side conduction": (1 - D) * irms2 * rds_lo,
         "inductor copper": irms2 * dcr,
         "switching overlap": 0.5 * vin * iout * 2 * t_sw * fs,         # rise and fall, each t_sw long
         "gate drive": 2 * qg * vg * fs,
         "dead-time diode": vf * iout * 2 * t_dead * fs,               # body diode conducts while both switches are off
         "controller": vin * iq}
    p_out = vout * iout
    return p_out / (p_out + sum(p.values())), p

def temp_rise(p, theta_ja=40.0): return p * theta_ja                    # K, from a junction-to-ambient thermal resistance

def test_compare():
    vin, vout, iout = 12.0, 3.3, 2.0
    eta_l, pl = linear_reg(vin, vout, iout); eta_s, parts = buck_losses(vin, vout, iout); ps = sum(parts.values())
    print(f"12 V to 3.3 V at 2 A: linear efficiency {100 * eta_l:.1f} %, loss {pl:.2f} W, temperature rise {temp_rise(pl):.0f} K")
    print(f"buck efficiency {100 * eta_s:.1f} %, loss {ps:.3f} W, temperature rise {temp_rise(ps):.1f} K")
    for k, v in parts.items(): print(f"  {k:22s} {1000 * v:6.1f} mW")
    assert eta_s > 0.85 and eta_l < vout / vin + 1e-12                   # a linear regulator can never beat Vout/Vin

def test_frequency_tradeoff():
    fs = np.array([100e3, 500e3, 2e6, 5e6]); eta = [buck_losses(12, 3.3, 2.0, fs=f)[0] for f in fs]
    print("efficiency against switching frequency:", ", ".join(f"{f / 1e3:.0f} kHz {100 * e:.1f} %" for f, e in zip(fs, eta)))
    assert all(np.diff(eta) < 0)                                          # switching losses grow with frequency

test_compare()
test_frequency_tradeoff()
print("PASS")
