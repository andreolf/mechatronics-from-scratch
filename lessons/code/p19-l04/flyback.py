import numpy as np

def flyback(vin=24.0, n=0.25, D=0.4, Lm=200e-6, Cc=220e-6, R=5.0, fs=100e3, periods=4000, steps=200, v0=None):
    """flyback: on, the primary magnetising current ramps up and stores energy in the core (output diode blocks);
    off, the stored energy flows out of the secondary (turns ratio n = Ns/Np) into the output capacitor.
    State: magnetising current referred to the primary, output voltage."""
    dt = 1 / fs / steps; on = round(D * steps)
    vC = v0 if v0 is not None else vin * n * D / (1 - D); im = 0.5; tv, e_in, e_out = [], 0.0, 0.0
    for k in range(periods * steps):
        if k % steps < on:
            dim = vin / Lm; ic = -vC / R; p_in, p_core_out = vin * im, 0.0
        else:
            dim = -(vC / n) / Lm; i_sec = im / n; ic = i_sec - vC / R; p_in, p_core_out = 0.0, vC * i_sec
            if im <= 0: dim, ic, p_core_out = 0.0, -vC / R, 0.0          # DCM: core empty, diode off
        im_old = im; im = max(im + dt * dim, 0.0); vC += dt * ic / Cc
        if k >= (periods - 10) * steps and im_old > 0:                      # trapezoidal energy: average current over the step
            f = 0.5 * (im_old + im) / im_old; e_in += p_in * f * dt; e_out += p_core_out * f * dt
        if k >= (periods - 10) * steps: tv.append(vC)
    return np.mean(tv), e_in, e_out

def ccm_formula(vin, n, D): return vin * n * D / (1 - D)

def test_ratio_formula():
    for D in (0.3, 0.4, 0.5):
        v, ei, eo = flyback(D=D)
        print(f"D = {D}: simulated {v:.3f} V, formula Vin n D/(1 - D) = {ccm_formula(24, 0.25, D):.3f} V")
        assert abs(v - ccm_formula(24, 0.25, D)) / v < 0.01

def test_energy_through_core():
    v, ei, eo = flyback()
    print(f"over 10 periods: energy into the core {1e6 * ei:.2f} uJ, out to the secondary {1e6 * eo:.2f} uJ, "
          f"load used {1e6 * v**2 / 5 * 10 / 100e3:.2f} uJ")
    assert abs(ei - eo) / ei < 0.01                                          # lossless core: what goes in comes out

def test_buck_boost_is_flyback_with_n1():
    v, _, _ = flyback(n=1.0, D=0.6, R=50.0)
    print(f"n = 1 (an inverting buck-boost, magnitude): {v:.3f} V, formula Vin D/(1 - D) = {24 * 0.6 / 0.4:.3f} V")
    assert abs(v - 36.0) / 36 < 0.01

test_ratio_formula()
test_energy_through_core()
test_buck_boost_is_flyback_with_n1()
print("PASS")
