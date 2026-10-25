---
id: p19-l18
minutes: 40
summary: An emergency stop must bring a machine to rest quickly and reliably. You learn the IEC 60204-1 stop categories and Safe Torque Off, simulate category 0 and category 1 stops of a motor joint, add a ramp monitor that catches a drive fault, check the stop times against their budgets, and turn the worst case into a minimum safety distance.
---

## Stop categories

IEC 60204-1 defines three ways to stop:

- **Category 0**: remove power to the actuators at once (an uncontrolled stop). The machine coasts, or a brake stops it.
- **Category 1**: a controlled stop with power available to the actuators, then power removed once stopped. Usually the fastest stop for a servo axis, because the drive brakes harder than friction.
- **Category 2**: a controlled stop with power left on, holding position. Not allowed for an emergency stop.

An emergency stop must be category 0 or 1, and the choice follows from the risk assessment.

## Safe Torque Off

Opening a contactor in the motor supply is slow and wears out. Modern drives instead offer **Safe Torque Off** (STO, defined with other drive safety functions in IEC 61800-5-2): two independent channels block the gate signals so the inverter cannot produce torque, even if the controller misbehaves. STO alone gives category 0. Category 1 adds **Safe Stop 1** (SS1): decelerate, then STO. In its monitored form (SS1-r), a safety function watches the speed against the expected ramp $\omega(t) \le \omega_0 (1 - t/t_{ramp}) \cdot k + \omega_{min}$ and triggers STO at once if the drive does not follow. The holding brake is applied with STO (safe brake control).

:::figure widget=stopcat caption="Speed against time for the stop categories with the monitoring envelope. Choose the category, inject a drive fault and toggle the holding brake."
:::end

## Worked example

Illustrative joint: 0.002 kg·m² at the motor, 300 rad/s, drive braking torque 3 N·m, holding brake 2 N·m, budgets 300 ms normally and 350 ms in the worst case:

1. Category 0 with the brake: 288.5 ms; without the brake the joint coasts for 7884.6 ms.
2. Category 1: decelerates along a 0.2 s ramp, torque off at 191.6 ms, at rest at 196.4 ms, within 300 ms.
3. Category 1 with a drive fault (no braking torque): the monitor triggers STO at 30.0 ms and the brake stops the joint at 317.0 ms, within the 350 ms worst-case budget.
4. Using the worst case, with a light curtain responding in 20 ms and detecting 30 mm objects ($C = 8(d - 14) = 128$ mm), the overall stopping time is 337 ms. ISO 13855's $S = K T + C$ with $K = 2000$ mm/s exceeds 500 mm, so $K = 1600$ mm/s applies: the curtain must be at least 667 mm from the hazard.

## Code it from scratch

:::code file=estop.py
```python
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
```
:::end

## In practice

E-stop buttons (ISO 13850) wire through safety relays or a safety PLC to the drive's STO inputs; servo drives from many vendors include STO and SS1 certified to a stated PL and SIL. Stopping times are measured on the real machine with a stop-time meter, because the brake, load and wear change them, and re-measured after maintenance. This lesson is educational and not a substitute for the standards or a qualified assessment.

## Exercises

:::exercise
A drive brakes at 1500 rad/s² from 300 rad/s. How long does the controlled part of a category 1 stop take?
:::solution
$300 / 1500 = 0.2$ s.
:::end

:::exercise
Why is category 2 not allowed for an emergency stop?
:::solution
In category 2 power stays on to hold position, so a fault in the drive or controller could still move the machine. An emergency stop must end with energy removed from the actuators.
:::end

## Quiz

:::quiz
- type: num
  q: Deceleration for 3 N·m on 0.002 kg·m² (rad/s²)?
  answer: 1500
  tol: 0.002
  py: "3/0.002"
  explain: α = T / J.
- type: num
  q: Kinetic energy at 300 rad/s with 0.002 kg·m² (J)?
  answer: 90
  tol: 0.001
  py: "0.5*0.002*300**2"
  explain: ½ J ω².
- type: num
  q: ISO 13855 distance with K 2000 mm/s, T 0.15 s and C 128 mm (mm)?
  answer: 428
  tol: 0.002
  py: "2000*0.15+128"
  explain: S = K T + C, under 500 mm so K = 2000 stands.
- type: num
  q: Intrusion allowance C for a light curtain detecting 14 mm objects (mm)?
  answer: 0
  tol: 0.001
  py: "8*(14-14)"
  explain: C = 8(d − 14).
- type: mc
  q: Which stop category keeps power on after stopping?
  options: ["Category 2", "Category 0", "Category 1", "None"]
  answer: 0
  explain: Category 2 holds position with power.
- type: mc
  q: What does Safe Torque Off do?
  options: ["Prevents the drive from producing torque through independent channels", "Brakes the motor with maximum torque", "Disconnects the mains supply", "Lowers the speed setpoint"]
  answer: 0
  explain: It blocks the gate signals.
:::end
