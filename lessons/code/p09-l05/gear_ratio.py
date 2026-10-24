import numpy as np
from scipy.optimize import minimize_scalar

def accel(N, Tm=0.1, Jm=1e-5, JL=0.01, eta=1.0):
    return N * eta * Tm / (JL + N * N * Jm)

def best_ratio(Tm=0.1, Jm=1e-5, JL=0.01, eta=1.0, w_motor_max=None, w_load_needed=None):
    hi = 1000.0
    if w_motor_max and w_load_needed:
        hi = w_motor_max / w_load_needed              # speed limit caps the ratio
    r = minimize_scalar(lambda N: -accel(N, Tm, Jm, JL, eta), bounds=(1.0, hi), method="bounded",
                        options={"xatol": 1e-9})
    return r.x

if __name__ == "__main__":
    N = best_ratio()
    print(f"numerical optimum N = {N:.4f}, formula {np.sqrt(0.01 / 1e-5):.4f}")
    assert abs(N - np.sqrt(0.01 / 1e-5)) < 1e-4
    assert abs(accel(N) - 0.1 / (2 * np.sqrt(0.01 * 1e-5))) < 1e-6
    # at the optimum the reflected load inertia equals the motor inertia
    assert abs(0.01 / N ** 2 - 1e-5) < 1e-10
    # gearbox efficiency scales the acceleration but does not move the optimum
    assert abs(best_ratio(eta=0.8) - N) < 1e-4
    # a speed requirement caps the ratio: 628 rad/s motor, 30 rad/s joint
    Nc = best_ratio(w_motor_max=628.0, w_load_needed=30.0)
    print(f"speed-limited ratio {Nc:.2f}, acceleration {accel(Nc):.1f} rad/s^2")
    assert abs(Nc - 628 / 30) < 1e-3 and accel(Nc) > 0.9 * accel(N)
