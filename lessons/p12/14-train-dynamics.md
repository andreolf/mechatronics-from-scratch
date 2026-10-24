---
id: p12-l14
minutes: 35
summary: A train climbing a mountain line is a one-dimensional point mass, but three forces decide whether it makes the grade, namely the Davis running resistance, the gravity component along the slope and a traction force capped by wheel-rail adhesion. You derive each force, simulate a train on a 7 percent adhesion grade like those on Swiss narrow-gauge lines, and test that the model predicts wheel slip whenever the traction demand exceeds what adhesion can transmit.
---

## Forces along the track

For a train of mass $m$ at speed $v$ on a grade of angle $\alpha$:

$$m_{eff}\dot v = F_t - \underbrace{(A + Bv + Cv^2)}_{\text{Davis resistance}} - mg\sin\alpha.$$

- **Davis equation**: $A$ is rolling and bearing resistance, $B v$ is flange and track losses, $Cv^2$ is aerodynamic drag. The coefficients come from run-down tests; the values here are illustrative.
- **Grade**: railways quote grades in per mille (‰): 70 ‰ means 70 m rise per km, $\alpha = \arctan 0.07$. Some Swiss narrow-gauge lines, such as the Bernina line, climb up to 70 ‰ by adhesion alone, with no rack.
- **Rotating mass**: wheels, axles and motor rotors add a few percent to the effective mass; $m_{eff} \approx 1.06m$ is typical.

## The adhesion limit

Steel on steel transmits at most $F_{adh} = \mu\,m_{adh}\,g\cos\alpha$, where $m_{adh}$ is the mass on driven axles and $\mu$ is the adhesion coefficient: around 0.25–0.33 on dry rail, dropping towards 0.1 on wet rail or leaves. The traction actually delivered is

$$F_t = \min(F_{demand},\ F_{adh}).$$

If the demand exceeds the limit the wheels slip: the motor speeds up the wheels, the rail force drops, and modern traction controllers back off. The model flags it.

Demand itself is limited by the motors: $F_{demand} = \min(F_{max},\ P/v)$, constant force at low speed and constant power above.

:::figure widget=trainslope caption="A train on a slope with the traction, resistance and grade forces drawn to scale. Steepen the grade or wet the rail until the traction demand exceeds the adhesion limit and the wheels slip."
:::end

## Worked example

Illustrative train: $m = 120$ t, of which 60 t is on driven axles, $P = 1$ MW, $F_{max} = 140$ kN, on a 70 ‰ grade.

1. Grade force: $mg\sin\alpha = 120\,000 \times 9.81 \times 0.0698 = 82.2$ kN.
2. Dry rail, $\mu = 0.25$: $F_{adh} = 0.25 \times 60\,000 \times 9.81 \times 0.9976 = 146.8$ kN, more than $F_{max}$. No slip.
3. Wet rail, $\mu = 0.12$: $F_{adh} = 70.5$ kN, below both the 140 kN demand and the 82 kN grade force. The wheels slip and the train can't even hold its speed.
4. Steepest grade on dry rail at low speed, ignoring Davis: $\sin\alpha = F_{max}/(mg) \Rightarrow 120$ ‰. On wet rail it's limited to $\mu\,m_{adh}/m = 60$ ‰.

## Code it from scratch

:::code file=train.py
```python
import numpy as np

m, m_adh, P, Fmax, g = 120e3, 60e3, 1.0e6, 140e3, 9.81
A, B, C = 2400.0, 60.0, 8.0          # Davis coefficients, illustrative (N, N s/m, N s^2/m^2)
meff = 1.06 * m

def forces(v, grade, mu):
    a = np.arctan(grade)
    demand = min(Fmax, P / max(v, 0.1))
    adh = mu * m_adh * g * np.cos(a)
    Ft = min(demand, adh)
    resist = A + B * v + C * v * v if v > 0 else 0.0
    return Ft, demand, adh, resist, m * g * np.sin(a)

def simulate(grade, mu, v0=0.5, T=300.0, dt=0.05):
    v, slip_t, vs = v0, 0.0, []
    for _ in range(int(T / dt)):
        Ft, demand, adh, R, G = forces(v, grade, mu)
        if demand > adh: slip_t += dt
        v = max(v + dt * (Ft - R - G) / meff, 0.0); vs.append(v)
    return np.array(vs), slip_t

def balance_speed(grade):
    G = m * g * np.sin(np.arctan(grade))
    lo, hi = P / Fmax, 60.0                  # constant-power region
    for _ in range(80):
        v = (lo + hi) / 2
        lo, hi = (v, hi) if P / v - (A + B * v + C * v * v) - G > 0 else (lo, v)
    return v

def test_worked_numbers():
    _, _, adh_dry, _, G = forces(1.0, 0.07, 0.25)
    _, _, adh_wet, _, _ = forces(1.0, 0.07, 0.12)
    print(f"grade force {G / 1e3:.1f} kN, adhesion dry {adh_dry / 1e3:.1f} kN, wet {adh_wet / 1e3:.1f} kN")
    assert abs(G - 82.2e3) < 100 and abs(adh_dry - 146.8e3) < 100 and abs(adh_wet - 70.5e3) < 100

def test_dry_climb_no_slip():
    vs, slip = simulate(0.07, 0.25)
    vb = balance_speed(0.07)
    print(f"dry 70 permille: no slip ({slip:.1f} s), climbs at {vs[-1] * 3.6:.1f} km/h (balance {vb * 3.6:.1f} km/h)")
    assert slip == 0 and abs(vs[-1] - vb) < 0.05

def test_wet_slip_predicted():
    vs, slip = simulate(0.07, 0.12, v0=8.0, T=60)
    print(f"wet 70 permille: slip for {slip:.0f} of 60 s, speed falls from 28.8 to {vs[-1] * 3.6:.1f} km/h")
    assert slip > 0 and vs[-1] < 8.0

def test_slip_iff_demand_exceeds_adhesion():
    rng = np.random.default_rng(4)
    for _ in range(2000):
        v, grade, mu = rng.uniform(0, 25), rng.uniform(0, 0.1), rng.uniform(0.05, 0.35)
        Ft, demand, adh, _, _ = forces(v, grade, mu)
        slipping = Ft < demand
        assert slipping == (demand > adh)
        assert Ft <= adh + 1e-9 and Ft <= demand + 1e-9

def test_max_grade():
    gmax_dry = np.tan(np.arcsin(Fmax / (m * g)))
    gmax_wet = 0.12 * m_adh / m        # small-angle, Davis ignored
    print(f"steepest start: dry {gmax_dry * 1000:.0f} permille (motor-limited), wet {gmax_wet * 1000:.0f} permille (adhesion-limited)")
    assert abs(gmax_dry - 0.119) < 0.002 and abs(gmax_wet - 0.06) < 1e-9

test_worked_numbers()
test_dry_climb_no_slip()
test_wet_slip_predicted()
test_slip_iff_demand_exceeds_adhesion()
test_max_grade()
print("PASS")
```
:::end

## Exercises

:::exercise
Why do mountain railways often put motors on every axle, or use rack sections, rather than one powerful locomotive?
:::solution
Adhesion force scales with the weight on driven axles, not with motor power. Driving every axle makes $m_{adh} = m$, doubling the steepest grade in the example. Beyond roughly 70–100 ‰ even that isn't enough, so a cogwheel engages a toothed rack and adhesion stops being the limit.
:::end

:::exercise
At what speed does the Davis $Cv^2$ term equal the $A$ term with the illustrative coefficients?
:::solution
$Cv^2 = A \Rightarrow v = \sqrt{2400/8} = 17.3$ m/s, about 62 km/h. Below that, rolling resistance matters more than air; both are small next to the 82 kN grade force on 70 ‰.
:::end

## Quiz

:::quiz
- type: num
  q: Grade force in kN on a 120 t train on 70 ‰?
  answer: 82.2
  tol: 0.005
  unit: kN
  py: "120e3*9.81*__import__('math').sin(__import__('math').atan(0.07))/1e3"
  explain: m g sin(arctan 0.07).
- type: num
  q: Adhesion limit in kN with μ = 0.12 and 60 t on driven axles (cos α ≈ 0.9976)?
  answer: 70.5
  tol: 0.005
  unit: kN
  py: "0.12*60e3*9.81*0.9976/1e3"
  explain: μ m_adh g cos α.
- type: num
  q: Steepest grade in ‰ a train can start on if μ = 0.2 and all its weight is on driven axles (small angle, no resistance)?
  answer: 200
  tol: 0.01
  unit: ‰
  py: "0.2*1000"
  explain: tan α ≈ μ.
- type: num
  q: Traction force in kN available from 1 MW at 10 m/s?
  answer: 100
  tol: 0.001
  unit: kN
  py: "1e6/10/1e3"
  explain: P/v.
- type: mc
  q: What decides whether the wheels slip?
  options:
    - traction demand versus μ times the weight on driven axles
    - the Davis A term
    - train length
    - speed alone
  answer: 0
  explain: F_t = min(demand, adhesion).
- type: mc
  q: The Davis C v² term represents…
  options:
    - aerodynamic drag
    - grade
    - bearing friction
    - adhesion
  answer: 0
  explain: It grows with the square of speed.
:::end
