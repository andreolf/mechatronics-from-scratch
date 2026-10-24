import numpy as np

R20, Rwh, Rha, Cw, Ch, Ta = 0.5, 1.0, 1.5, 300.0, 3000.0, 30.0

def simulate(I, duty=1.0, period=120.0, T=14 * 3600, dt=0.5, tempco=0.00393):
    Tw = Th = Ta; tw = []
    for n in range(int(T / dt)):
        on = (n * dt) % period < duty * period
        P = I * I * R20 * (1 + tempco * (Tw - 20)) if on else 0.0
        q = (Tw - Th) / Rwh
        Tw += dt * (P - q) / Cw
        Th += dt * (q - (Th - Ta) / Rha) / Ch
        tw.append(Tw)
    return np.array(tw)

def continuous_current(Tmax=155.0):
    return np.sqrt((Tmax - Ta) / ((Rwh + Rha) * R20 * (1 + 0.00393 * (Tmax - 20))))

if __name__ == "__main__":
    # without the copper temperature coefficient, the steady state is exactly Ta + P (Rwh + Rha)
    tw = simulate(6.0, tempco=0.0)
    P = 36 * R20
    print(f"steady {tw[-1]:.3f} C, formula {Ta + P * (Rwh + Rha):.3f} C")
    assert abs(tw[-1] - (Ta + P * (Rwh + Rha))) < 0.01
    Ic = continuous_current()
    print(f"continuous current for class F: {Ic:.2f} A")
    assert abs(Ic - 8.08) < 0.01
    assert abs(simulate(Ic)[-1] - 155.0) < 0.2             # with tempco, it settles right at the limit
    # duty cycle: 12 A at 40 % has RMS 7.59 A < Ic; the average winding temperature stays below the limit
    tw = simulate(12.0, duty=0.4)
    last = tw[-int(120 / 0.5) * 5:]
    print(f"12 A at 40 %: winding {last.min():.0f}..{last.max():.0f} C")
    assert 12 * np.sqrt(0.4) < Ic and last.mean() < 155 and last.max() < 165
