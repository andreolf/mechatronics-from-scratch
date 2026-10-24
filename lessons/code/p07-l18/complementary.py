import numpy as np

rng = np.random.default_rng(18)
FS = 200.0
DT = 1 / FS

def simulate(T=20.0, bias=1.5, gyro_noise=0.5, acc_noise=4.0):
    t = np.arange(0, T, DT)
    theta = 30 * np.sin(2 * np.pi * 0.2 * t) * (t > 2)
    rate = np.gradient(theta, DT)
    gyro = rate + bias + gyro_noise * rng.standard_normal(t.size)
    push = np.where((t > 10) & (t < 11), 15.0, 0.0)          # a forward acceleration seen as tilt
    acc = theta + acc_noise * rng.standard_normal(t.size) + push
    return t, theta, gyro, acc

def complementary(gyro, acc, tau):
    a = tau / (tau + DT)
    est = np.empty_like(acc)
    est[0] = acc[0]
    for k in range(1, len(acc)):
        est[k] = a * (est[k - 1] + gyro[k] * DT) + (1 - a) * acc[k]
    return est

def rms(e):
    return float(np.sqrt(np.mean(e ** 2)))

if __name__ == "__main__":
    t, theta, gyro, acc = simulate()
    gyro_only = theta[0] + np.cumsum(gyro) * DT
    fused = complementary(gyro, acc, tau=0.5)
    e_g, e_a, e_f = rms(gyro_only - theta), rms(acc - theta), rms(fused - theta)
    print(f"rms error: gyro {e_g:.2f} deg, accelerometer {e_a:.2f} deg, complementary {e_f:.2f} deg")
    assert e_f < e_a and e_f < e_g
    # the two filters sum to one at every frequency
    w = np.logspace(-2, 2, 50)
    tau = 0.5
    lp, hp = 1 / (1j * w * tau + 1), 1j * w * tau / (1j * w * tau + 1)
    assert np.allclose(lp + hp, 1)
    # steady-state error from a constant bias is bias * tau
    still = complementary(np.full(20_000, 1.5), np.zeros(20_000), tau=0.5)
    assert abs(still[-1] - 1.5 * 0.5) < 0.01
    assert abs(0.5 / (0.5 + DT) - 0.9901) < 1e-4
