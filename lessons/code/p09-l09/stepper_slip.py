import numpy as np

TH, NR, J, B = 0.5, 50, 5e-5, 2e-3
STEP = 2 * np.pi / 200

def move(acc, TL, w_top=60.0, T=0.15, dt=1e-5):
    """Accelerating move; returns the final lag in full steps."""
    th = om = 0.0; ta = w_top / acc
    for k in range(int(T / dt)):
        t = k * dt
        tc = 0.5 * acc * t * t if t < ta else 0.5 * acc * ta * ta + w_top * (t - ta)
        Tm = -TH * np.sin(NR * (th - tc))
        Tl = TL * np.sign(om) if abs(om) > 1e-6 else np.clip(Tm, -TL, TL)   # load opposes motion (or sticks)
        om += dt * (Tm - B * om - Tl) / J
        th += dt * om
    return (tc - th) / STEP

def natural_frequency():
    return np.sqrt(TH * NR / J)

if __name__ == "__main__":
    print(f"natural frequency {natural_frequency():.1f} rad/s = {natural_frequency()/2/np.pi:.1f} Hz")
    for acc, TL in [(3000, 0.1), (5000, 0.1), (2000, 0.2), (9000, 0.1), (12000, 0.0), (2000, 0.45)]:
        need = J * acc + TL
        lag = move(acc, TL)
        lost = int(4 * round(lag / 4))
        print(f"acc {acc:>5}, load {TL:.2f}: needs {need:.2f} N*m ({100*need/TH:.0f} % of T_h), lag {lag:6.2f} steps, lost {lost}")
        if 2 * J * acc + TL < 0.9 * TH:                # abrupt ramp: overshoot doubles the acceleration torque
            assert lost == 0 and abs(lag) < 1           # stays in step, lag under one full step
        if need > 1.05 * TH:                            # even the static condition fails
            assert lost >= 4                             # slips by at least one electrical cycle
