import numpy as np

L, R, Ts = 1e-3, 1.0, 50e-6               # winding and a 20 kHz control loop
a = np.exp(-R * Ts / L)                    # exact discretisation of the RL plant (zero-order hold)

def gains(wc, R_est=R):
    return L * wc, R_est * wc              # Kp, Ki by pole-zero cancellation

def loop_gain(w, Kp, Ki):
    z = np.exp(1j * w * Ts)
    P = (1 - a) / R / (z - a)              # plant
    C = Kp + Ki * Ts * z / (z - 1)         # PI, backward-Euler integrator
    return C * P / z                       # one sample of computation delay

def step(Kp, Ki, n=4000):
    i = I = v_prev = 0.0; out = []
    for _ in range(n):
        e = 1.0 - i; I += Ki * Ts * e; v = Kp * e + I
        i = a * i + (1 - a) / R * v_prev; v_prev = v          # last sample's voltage is applied now
        out.append(i)
    return np.array(out)

if __name__ == "__main__":
    wc = 2 * np.pi * 1000
    Kp, Ki = gains(wc)
    w = np.linspace(10, 2 * np.pi * 9000, 400000)
    Lw = loop_gain(w, Kp, Ki)
    ic = np.argmax(np.abs(Lw) < 1)
    pm = 180 + np.degrees(np.angle(Lw[ic]))
    y = step(Kp, Ki)
    bw_step = 1 / ((np.argmax(y >= 0.632) + 1) * Ts)
    print(f"crossover {w[ic]/2/np.pi:.0f} Hz, phase margin {pm:.1f} deg, 63% rise bandwidth {bw_step/2/np.pi:.0f} Hz")
    assert abs(w[ic] - wc) / wc < 0.10 and abs(bw_step - wc) / wc < 0.10
    assert 55 < pm < 70
    assert abs(y[-1] - 1) < 1e-6                              # integrator removes steady error
    # wrong R estimate: the zero misses the pole and the response creeps
    y_bad = step(*gains(wc, R_est=0.4 * R))
    t_bad = np.argmax(y_bad >= 0.98); t_ok = np.argmax(y >= 0.98)
    print(f"98 % settling: matched {t_ok * Ts * 1e3:.2f} ms, R underestimated {t_bad * Ts * 1e3:.2f} ms")
    assert t_bad > 2 * t_ok
