---
id: p09-l20
minutes: 40
summary: Sizing a motor starts with the load, not the motor catalogue. You derive the road load of an electric scooter from rolling resistance, aerodynamic drag and grade, size a hub motor's torque and power for a steep climb in the Bali highlands with two riders, and check that the requirements agree with an energy-per-kilometre estimate.
---

## Road load

A vehicle of mass $m$ moving at speed $v$ up a grade $G$ (rise over run, so the angle is $\theta = \arctan G$) needs a tractive force

$$F = \underbrace{C_{rr}\,m g\cos\theta}_{\text{rolling}} + \underbrace{\tfrac12\rho\,C_dA\,v^2}_{\text{aero}} + \underbrace{m g\sin\theta}_{\text{grade}} \;(+\; m a \text{ when accelerating}).$$

The power at the wheel is $P = F v$, and a hub motor of wheel radius $r$ must give torque $T = F r$ at speed $\omega = v/r$.

For a scooter: $C_{rr}$ around 0.01–0.02 on asphalt, $C_dA$ around 0.5–0.7 m² with a sitting rider, air density about 1.15 kg/m³ in a warm climate. Grade dominates any climb: on a 10 % slope it's 10 times the rolling force.

## Sizing logic

1. **Continuous** rating from the longest sustained demand: the long climb, at the speed you want to hold. The thermal model (lesson 19) decides whether the motor survives it.
2. **Peak** torque for starting on the steepest slope and for acceleration, for seconds at a time.
3. **Speed**: no-load speed at the battery voltage must exceed top speed with margin (lesson 4).
4. **Energy** per km on the flat sets the battery: $E = F_{flat}\cdot1\text{ km}$, divided by the drivetrain efficiency. A climb adds $m g\Delta h$, partly recovered by regenerative braking on the way down.

:::figure widget=scooter caption="Scooter on a slope with its grade force (red) and aerodynamic drag (blue), and a gauge for the wheel power. Steepen the road or add a passenger and watch the power climb."
:::end

## Worked example

Scooter plus two riders, 180 kg, climbing a 10 % grade at 30 km/h (8.33 m/s) on a road in the Bali highlands. Use $C_{rr} = 0.015$, $C_dA = 0.6$ m², $\rho = 1.15$ kg/m³ and a 0.25 m wheel radius.

1. $\theta = \arctan 0.1 = 5.71°$.
2. Rolling: $0.015\cdot180\cdot9.81\cdot0.995 = 26.4$ N. Aero: $0.5\cdot1.15\cdot0.6\cdot8.33^2 = 24.0$ N. Grade: $180\cdot9.81\cdot0.0995 = 175.7$ N. Total 226 N.
3. Wheel power $226\cdot8.33 = 1.88$ kW. Hub torque $226\cdot0.25 = 56.5$ N·m at $8.33/0.25 = 33.3$ rad/s (318 rpm).
4. Flat road at 30 km/h: $26.5 + 24.0 = 50.5$ N, which is 14.0 Wh/km at the wheel, or 17.5 Wh/km from the battery at 80 % drivetrain efficiency.
5. Climbing 300 m adds $180\cdot9.81\cdot300 = 530$ kJ = 147 Wh at the wheel, 184 Wh from the battery. A 2 kWh pack gives about 114 km on the flat, and each 300 m climb costs the equivalent of 10.5 km.

A motor rated around 2 kW continuous with about 60 N·m (plus margin for starts on steeper ramps) fits this job.

## Code it from scratch

:::code file=scooter_sizing.py
```python
import numpy as np

G = 9.81

def road_load(v, grade, m=180.0, Crr=0.015, CdA=0.6, rho=1.15):
    th = np.arctan(grade)
    Fr = Crr * m * G * np.cos(th); Fa = 0.5 * rho * CdA * v * v; Fg = m * G * np.sin(th)
    return Fr, Fa, Fg

def requirements(v_kmh, grade, r_wheel=0.25, **kw):
    v = v_kmh / 3.6
    F = sum(road_load(v, grade, **kw))
    return dict(F=F, P=F * v, T=F * r_wheel, rpm=v / r_wheel * 60 / (2 * np.pi))

def trip_energy(profile, m=180.0, dt=0.1):
    """Integrate wheel power over a route: list of (distance m, grade, speed km/h). No regen."""
    E = 0.0
    for dist, grade, v_kmh in profile:
        v = v_kmh / 3.6; t = 0.0
        while t * v * np.cos(np.arctan(grade)) < dist:        # dist measured horizontally
            E += max(sum(road_load(v, grade, m)) * v, 0) * dt
            t += dt
    return E / 3600                                          # Wh

if __name__ == "__main__":
    climb = requirements(30, 0.10)
    print({k: round(v, 1) for k, v in climb.items()})
    assert abs(climb["F"] - 226.1) < 0.5 and abs(climb["P"] - 1884) < 5 and abs(climb["T"] - 56.5) < 0.2
    flat = requirements(30, 0.0)
    wh_per_km = flat["F"] * 1000 / 3600
    print(f"flat: {wh_per_km:.2f} Wh/km at the wheel")
    assert abs(wh_per_km - 14.03) < 0.05
    # consistency: a simulated route = flat energy per km x distance + potential energy of the climb
    route = [(3000, 0.0, 30), (3000, 0.10, 30), (2000, 0.0, 30)]
    E_sim = trip_energy(route)
    horiz = 8000.0; rise = 3000 * 0.10
    E_est = wh_per_km * horiz / 1000 + 180 * G * rise / 3600
    print(f"route: simulated {E_sim:.1f} Wh, estimate {E_est:.1f} Wh")
    assert abs(E_sim - E_est) / E_est < 0.02
```
:::end

## Exercises

:::exercise
The same scooter must start from rest on a 20 % ramp and reach 1 m/s² of acceleration. What peak torque does the hub motor need?
:::solution
$\theta = 11.3°$. Rolling: $0.015\cdot180\cdot9.81\cdot0.981 = 26.0$ N; grade: $180\cdot9.81\cdot0.196 = 346.3$ N; acceleration: $180\cdot1 = 180$ N; aero ≈ 0 at start. Total 552 N, so $T = 552\cdot0.25 = 138$ N·m peak, more than twice the climbing torque. Peak torque, not continuous power, often sizes the motor.
:::end

:::exercise
Why does doubling speed on the flat more than double the energy per kilometre?
:::solution
Energy per km is the force, and aero force grows as $v^2$ while rolling stays constant. At 30 km/h aero is about half the total; at 60 km/h it's 4× larger (96 N), so the energy per km goes from 14.0 to 33.9 Wh/km, 2.4× more.
:::end

## Quiz

:::quiz
- type: num
  q: Grade force in N for 180 kg on a 10 % slope?
  answer: 175.7
  tol: 0.002
  unit: N
  py: "180*9.81*math.sin(math.atan(0.1))"
  explain: m g sin θ.
- type: num
  q: Aero drag in N at 30 km/h (C_dA = 0.6 m², ρ = 1.15)?
  answer: 23.96
  tol: 0.002
  unit: N
  py: "0.5*1.15*0.6*(30/3.6)**2"
  explain: ½ρC_dAv².
- type: num
  q: Wheel power in kW for 226 N at 30 km/h?
  answer: 1.883
  tol: 0.002
  unit: kW
  py: "226*30/3.6/1000"
  explain: F·v.
- type: num
  q: Hub speed in rpm at 30 km/h with a 0.25 m wheel radius?
  answer: 318.3
  tol: 0.002
  unit: rpm
  py: "30/3.6/0.25*60/(2*math.pi)"
  explain: v/r in rpm.
- type: num
  q: Energy in Wh to lift 180 kg by 300 m?
  answer: 147.2
  tol: 0.002
  unit: Wh
  py: "180*9.81*300/3600"
  explain: m g Δh.
- type: mc
  q: On a 10 % climb at 30 km/h, the largest force is…
  options:
    - rolling resistance
    - aerodynamic drag
    - grade
    - bearing friction
  answer: 2
  explain: 176 N of 226 N.
:::end

:::verify
import math
F60 = 0.015*180*9.81 + 0.5*1.15*0.6*(60/3.6)**2
assert abs(F60*1000/3600 - 33.9) < 0.1
assert abs(2000/17.5 - 114) < 0.5 and abs(184/17.5 - 10.5) < 0.1
:::end
