import numpy as np

J, T_FRIC, B_VISC = 0.002, 0.05, 2e-4        # illustrative joint: inertia at the motor (kg m^2), friction (N m), viscous (N m s)
T_DRIVE, T_BRAKE = 3.0, 2.0                    # drive's braking torque limit, holding brake torque (N m)
W0 = 300.0                                     # motor speed when the stop is requested (rad/s)

def stop(category, drive_ok=True, brake=True, ramp_s=0.2, sto_speed=5.0, sto_timer=0.30, slack=1.15, dt=1e-4):
    """IEC 60204-1 stop categories. 0: remove torque at once (STO) and drop the brake. 1: drive decelerates along a ramp,
    then STO and brake once nearly stopped or when the safety timer expires; a monitor compares speed against the ramp
    envelope and triggers STO early if the drive does not follow (a monitored SS1, IEC 61800-5-2)."""
    w, t, sto, t_sto, angle = W0, 0.0, category == 0, 0.0 if category == 0 else None, 0.0
    while w > 0 and t < 10:
        envelope = W0 * max(0.0, 1 - t / ramp_s) * slack + sto_speed
        if not sto and (w < sto_speed or t >= sto_timer or w > envelope): sto, t_sto = True, t
        if sto: torque = T_BRAKE if brake else 0.0
        else: torque = min(T_DRIVE, J * W0 / ramp_s + T_FRIC) if drive_ok else 0.0   # controlled ramp
        dw = -(torque + T_FRIC + B_VISC * w) / J * dt
        angle += w * dt; w = max(0.0, w + dw); t += dt
    return t, t_sto, angle

def test_stop_categories():
    spec, spec_fault = 0.30, 0.35                                               # normal and worst-case stop budgets
    rows = [("category 0, brake", stop(0)), ("category 0, no brake", stop(0, brake=False)),
            ("category 1", stop(1)), ("category 1, drive fault", stop(1, drive_ok=False))]
    for name, (t, t_sto, ang) in rows:
        print(f"{name:24s} stops in {t * 1000:7.1f} ms, torque off at {t_sto * 1000:6.1f} ms, travels {ang:6.2f} rad at the motor")
    t1, ts1, _ = rows[2][1]; tf, tsf, _ = rows[3][1]
    assert t1 <= spec and ts1 <= 0.30                                          # category 1 meets the 300 ms spec
    assert tsf < 0.05 and tf <= spec_fault                                         # monitor catches the fault quickly, brake stops it
    assert rows[1][1][0] > 10 * t1 or rows[1][1][0] >= 10                      # coasting without a brake takes far longer

def test_safety_distance():
    t_stop = max(stop(1)[0], stop(1, drive_ok=False)[0])                       # use the worst case, the drive fault
    t_detect = 0.020                                                           # light curtain response (illustrative)
    T = t_detect + t_stop; d_mm = 30; C = 8 * (d_mm - 14) / 1000             # light curtain detecting 30 mm objects
    S = 2.0 * T + C                                                            # ISO 13855 form S = K T + C, K = 2000 mm/s
    if S > 0.5: S = max(0.5, 1.6 * T + C)                                      # beyond 500 mm the standard allows K = 1600 mm/s
    print(f"overall stopping time {T * 1000:.0f} ms, C = {C * 1000:.0f} mm -> minimum distance {S * 1000:.0f} mm")
    assert 0.3 < S < 1.0

test_stop_categories()
test_safety_distance()
print("PASS")
