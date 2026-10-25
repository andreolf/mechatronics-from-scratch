import numpy as np

def boost(vin=5.0, D=0.5, L=10e-6, Cc=100e-6, R=10.0, rL=0.0, fs=200e3, periods=3000, steps=100, v0=None):
    """switched boost: switch on, the inductor charges from Vin; switch off, it discharges through the diode into the output.
    The diode blocks reverse current, so at light load the inductor current can stop at zero (DCM)."""
    dt = 1 / fs / steps; on = round(D * steps)
    vC = v0 if v0 is not None else vin / (1 - D); iL = vC / R / (1 - D); tv, ti = [], []
    for k in range(periods * steps):
        if k % steps < on: diL = (vin - iL * rL) / L; ic = -vC / R
        else:
            diL = (vin - iL * rL - vC) / L; ic = iL - vC / R
            if iL <= 0 and diL < 0: iL, diL, ic = 0.0, 0.0, -vC / R          # diode off: current stays at zero
        iL = max(iL + dt * diL, 0.0); vC += dt * ic / Cc
        if k >= (periods - 5) * steps: tv.append(vC); ti.append(iL)
    return np.mean(tv), np.ptp(ti), min(ti)

def ideal(vin, D): return vin / (1 - D)
def with_rL(vin, D, R, rL): return vin / (1 - D) / (1 + rL / (R * (1 - D) ** 2))

def test_ccm_matches():
    for D in (0.2, 0.5, 0.7):
        v, di, imin = boost(D=D)
        print(f"D = {D}: simulated {v:.3f} V, formula Vin/(1 - D) = {ideal(5, D):.3f} V, inductor valley {imin:.3f} A (CCM)")
        assert imin > 0 and abs(v - ideal(5, D)) / ideal(5, D) < 0.01

def test_losses_limit_gain():
    Ds = np.linspace(0, 0.95, 20); g = with_rL(5, Ds, 10, 0.2)
    print(f"with 0.2 ohm in the inductor the gain peaks at {g.max() / 5:.2f} x near D = {Ds[g.argmax()]:.2f}, not at D -> 1")
    v, _, _ = boost(D=0.7, rL=0.2); print(f"D = 0.7 with 0.2 ohm: simulated {v:.3f} V, formula {with_rL(5, 0.7, 10, 0.2):.3f} V")
    assert abs(v - with_rL(5, 0.7, 10, 0.2)) / v < 0.01 and Ds[g.argmax()] < 0.95

def dcm(vin, D, L, R, fs):
    K = 2 * L * fs / R; return vin * (1 + np.sqrt(1 + 4 * D**2 / K)) / 2     # boost output in discontinuous conduction

def test_dcm_light_load():
    v, di, imin = boost(D=0.5, R=200.0, v0=20.0, periods=6000, steps=400)   # finer steps: the diode turn-off is short
    print(f"light load (200 ohm): inductor valley {imin:.3f} A (DCM), output {v:.2f} V; DCM formula {dcm(5, 0.5, 10e-6, 200, 200e3):.2f} V, "
          f"CCM formula {ideal(5, 0.5):.2f} V")
    assert imin == 0 and abs(v - dcm(5, 0.5, 10e-6, 200, 200e3)) / v < 0.02

test_ccm_matches()
test_losses_limit_gain()
test_dcm_light_load()
print("PASS")
