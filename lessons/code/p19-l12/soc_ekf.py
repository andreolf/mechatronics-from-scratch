import numpy as np

Q = 3.0 * 3600; R0, R1, C1 = 0.022, 0.015, 1500.0                     # illustrative cell, 1-RC model (Lesson 11)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)
def docv(s): return 1.2 + 3.0 * np.exp(-12 * s) + 0.15 * np.cos(3 * s)

def ride(seconds=3600, seed=3):
    """illustrative stop-and-go e-scooter current for one cell: cruising, hill climbs, stops and regenerative braking."""
    rng = np.random.default_rng(seed); i = np.zeros(seconds); t = 0
    while t < seconds:
        n = rng.integers(10, 60); a = rng.choice([0.0, 1.0, 2.5, 5.0, -1.5], p=[.2, .35, .2, .15, .1])
        i[t:t + n] = a + rng.normal(0, 0.3, min(n, seconds - t)); t += n
    return i

def truth(i, soc0=0.90, dt=1.0, noise=2e-3, seed=4, r0=1.1 * R0, r1=1.2 * R1, c1=C1):
    """the 'real' cell: its resistances are 10 and 20 % higher than the model the estimator uses."""
    rng = np.random.default_rng(seed); a = np.exp(-dt / (r1 * c1)); s, v1 = soc0, 0.0; socs, vs = [], []
    for ik in i:
        vs.append(ocv(s) - r0 * ik - v1 + rng.normal(0, noise)); socs.append(s)
        v1 = a * v1 + r1 * (1 - a) * ik; s -= ik * dt / Q
    return np.array(socs), np.array(vs)

def coulomb(i_meas, soc0, dt=1.0): return soc0 - np.concatenate([[0], np.cumsum(i_meas[:-1])]) * dt / Q

def ekf(i_meas, v_meas, soc0, dt=1.0, q_soc=1e-10, q_v1=1e-7, r=(3e-3)**2, p0=(0.2**2, 1e-4)):
    """state x = [SOC, v1]; predict with the measured current, correct with the terminal voltage."""
    a = np.exp(-dt / (R1 * C1)); F = np.diag([1.0, a]); Qn = np.diag([q_soc, q_v1])
    x = np.array([soc0, 0.0]); P = np.diag(p0); out = []
    for ik, vk in zip(i_meas, v_meas):
        H = np.array([docv(x[0]), -1.0]); y = vk - (ocv(x[0]) - R0 * ik - x[1])
        S = H @ P @ H + r; K = P @ H / S; x = x + K * y; P = (np.eye(2) - np.outer(K, H)) @ P
        out.append(x[0])
        x = np.array([x[0] - ik * dt / Q, a * x[1] + R1 * (1 - a) * ik]); P = F @ P @ F.T + Qn
    return np.array(out)

def test_soc_estimation():
    i = ride(); soc, v = truth(i)
    i_meas = i + 0.10                                                    # current sensor with a 100 mA offset
    cc_good = coulomb(i_meas, 0.90); cc_bad = coulomb(i_meas, 0.70)      # right and wrong starting SOC
    est = ekf(i_meas, v, 0.70)
    e = lambda x: 100 * np.abs(x - soc)
    print(f"true SOC {100 * soc[0]:.1f} % -> {100 * soc[-1]:.1f} % over {len(i) / 60:.0f} min")
    print(f"Coulomb counting, right start: final error {e(cc_good)[-1]:.2f} %")
    print(f"Coulomb counting, start 20 % off: final error {e(cc_bad)[-1]:.2f} %")
    print(f"EKF, start 20 % off: error after 5 min {e(est)[300]:.2f} %, max over the last 50 min {e(est)[600:].max():.2f} %, final {e(est)[-1]:.2f} %")
    assert e(cc_good)[-1] > 1 and e(cc_bad)[-1] > 15 and e(est)[600:].max() < 3

test_soc_estimation()
print("PASS")
