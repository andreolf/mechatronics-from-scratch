import numpy as np

E_CHARGE = 1.602176634e-19

def load_power(V, r, R):
    i = V / (R + r)
    return i, i * i * R, i * i * r

if __name__ == "__main__":
    assert abs(1 / E_CHARGE - 6.2415e18) < 1e15
    i, pl, pr = load_power(12, 0.5, 6)
    assert abs(i - 1.846154) < 1e-6 and abs(pl - 20.4497) < 1e-4 and abs(pr - 1.7041) < 1e-4
    assert abs(pl + pr - 12 * i) < 1e-12               # source power = load + internal losses
    runtime_h = 2.0 / i
    assert abs(runtime_h - 1.0833) < 1e-4
    # maximum power transfer by brute force
    R = np.linspace(0.01, 5, 100_000)
    best = R[np.argmax(load_power(12, 0.5, R)[1])]
    print(f"best load {best:.3f} ohm, P = {load_power(12, 0.5, best)[1]:.2f} W")
    assert abs(best - 0.5) < 1e-3 and abs(load_power(12, 0.5, 0.5)[1] - 72.0) < 1e-9
    assert abs(12 * 2 * 3600 - 86_400) < 1e-9          # 2000 mAh at 12 V in joules
