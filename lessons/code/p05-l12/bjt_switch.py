VBE, VCESAT = 0.7, 0.2

def switch(vin, rb, beta, vcc, rload):
    """Piecewise model of an NPN low-side switch. Returns (region, ib, ic, vce, power)."""
    ib = max(0.0, (vin - VBE) / rb)
    ic_sat = (vcc - VCESAT) / rload
    if ib == 0:
        return "cutoff", 0.0, 0.0, vcc, 0.0
    if beta * ib >= ic_sat:
        return "saturation", ib, ic_sat, VCESAT, VCESAT * ic_sat
    ic = beta * ib
    vce = vcc - ic * rload
    return "active", ib, ic, vce, vce * ic

def base_resistor(vin, ic, beta_min, overdrive=3.0):
    return (vin - VBE) / (overdrive * ic / beta_min)

if __name__ == "__main__":
    ic = (12 - VCESAT) / 400
    assert abs(ic - 0.0295) < 1e-12
    rb = base_resistor(3.3, ic, 100)
    assert abs(rb - 2937.9) < 0.1
    for beta in (100, 150, 400):                     # every guaranteed part saturates with 2.7 k
        assert switch(3.3, 2700, beta, 12, 400)[0] == "saturation"
    reg, ib, ic2, vce, p = switch(3.3, 4700, 100, 12, 400)
    assert reg == "saturation" and abs(p - 0.0059) < 1e-6 and abs(100 * ib / ic2 - 1.8745) < 1e-3
    reg, ib, ic3, vce, p = switch(3.3, 47000, 100, 12, 400)
    print(f"47 k base resistor: {reg}, Ic = {ic3*1e3:.2f} mA, Vce = {vce:.2f} V, P = {p*1e3:.1f} mW")
    assert reg == "active" and abs(vce - 9.787) < 1e-3 and abs(p - 0.05412) < 1e-4
    assert switch(0.0, 2700, 100, 12, 400)[0] == "cutoff"
