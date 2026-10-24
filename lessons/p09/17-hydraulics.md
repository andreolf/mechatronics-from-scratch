---
id: p09-l17
minutes: 35
summary: Oil is nearly incompressible, so a small pump can lift enormous loads slowly and precisely. You use Pascal's law and flow continuity to size a cylinder from standard bores, add the pressure losses of the valve, filter and hose, and check that the lift meets its force and speed specification with a pump that's actually available.
---

## Pascal and continuity

Pressure in a confined fluid acts equally in all directions, so a cylinder of area $A$ at pressure $p$ pushes with

$$F = p\,A.$$

At 200 bar (20 MPa), a 63 mm bore pushes 62 kN, about the weight of six tonnes. That's hydraulics' advantage: very high force density.

Oil is almost incompressible, so **flow continuity** fixes the speed: whatever volume the pump delivers goes into the cylinder,

$$v = \frac{Q}{A}.$$

Force and speed are therefore set independently, by pressure and by flow, and the power is $P = p\,Q$.

## Losses

Every valve, filter, hose and fitting drops pressure, so the pump must supply

$$p_{pump} = \frac{F}{A} + \Delta p_{valve} + \Delta p_{filter} + \Delta p_{lines}.$$

Valve losses go roughly as $Q^2$ (an orifice). Line losses come from Darcy–Weisbach,

$$\Delta p = f\,\frac{L}{D}\,\frac{\rho u^2}{2}, \qquad f = \frac{64}{Re}\ \text{(laminar, } Re < 2300\text{)},$$

with mean velocity $u = 4Q/(\pi D^2)$ and $Re = uD/\nu$. Keep pressure lines below about 5 m/s. A **relief valve** limits the maximum pressure. If the load needs more than that, the relief opens, the oil heats up and nothing lifts.

## Sizing recipe

1. Pick a working pressure well under the system's rating (often 100–160 bar for a 210 bar system).
2. Minimum area $A = F/p$, then round **up** to a standard bore (ISO 3320: 25, 32, 40, 50, 63, 80, 100 mm…).
3. Flow for the speed: $Q = A v$.
4. Add losses, check the pump pressure is below the relief setting, and size the motor from $p_{pump}Q/\eta$.

:::figure widget=hydraulic caption="Pressure from pump to cylinder for a lift. Increase the load or shrink the bore: the cylinder pressure rises until the pump would exceed the 210 bar relief setting."
:::end

## Worked example

Lift 20 kN at 0.10 m/s, design pressure 100 bar, 3 m of 10 mm hose, oil $\nu = 32$ cSt, $\rho = 870$ kg/m³.

1. $A_{min} = 20\,000/10^7 = 20.0$ cm², $d_{min} = 50.5$ mm. Choose 63 mm: $A = 31.2$ cm².
2. Cylinder pressure: $20\,000/3.117\times10^{-3} = 64.2$ bar.
3. Flow: $3.117\times10^{-3}\cdot0.10 = 3.12\times10^{-4}$ m³/s = 18.7 L/min.
4. Hose: $u = 3.97$ m/s, $Re = 1241$ (laminar), $f = 0.0516$, so $\Delta p = 0.0516\cdot300\cdot870\cdot3.97^2/2 = 1.06$ bar.
5. With 5 bar for the valve and 1 bar for the filter, the pump needs 71.2 bar, and at 85 % overall efficiency $71.2\times10^5\cdot3.12\times10^{-4}/0.85 = 2.6$ kW.

## Code it from scratch

:::code file=hydraulic_lift.py
```python
import numpy as np

BORES_MM = [25, 32, 40, 50, 63, 80, 100, 125]                 # ISO 3320 cylinder bores

def size_cylinder(F, p_design):
    a_min = F / p_design
    for d in BORES_MM:
        if np.pi * (d / 1000) ** 2 / 4 >= a_min:
            return d
    raise ValueError("no standard bore is big enough")

def hose_loss(Q, D=0.010, L=3.0, nu=32e-6, rho=870.0):
    u = 4 * Q / (np.pi * D * D); Re = u * D / nu
    f = 64 / Re if Re < 2300 else 0.316 * Re ** -0.25          # laminar or Blasius
    return f * L / D * rho * u * u / 2, u, Re

def design(F=20e3, v=0.10, p_design=100e5, dp_valve=5e5, dp_filter=1e5, relief=210e5, eta=0.85):
    d = size_cylinder(F, p_design); A = np.pi * (d / 1000) ** 2 / 4
    Q = A * v; p_cyl = F / A
    dp_hose, u, Re = hose_loss(Q)
    p_pump = p_cyl + dp_valve + dp_filter + dp_hose
    return dict(bore=d, A=A, Q=Q, p_cyl=p_cyl, dp_hose=dp_hose, u=u, Re=Re, p_pump=p_pump,
                power=p_pump * Q / eta, ok=p_pump < relief and u < 5.0)

if __name__ == "__main__":
    r = design()
    print({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()})
    assert r["bore"] == 63 and r["ok"]
    assert r["p_cyl"] * r["A"] >= 20e3 - 1e-6                    # force spec met
    assert abs(r["Q"] / r["A"] - 0.10) < 1e-12                    # speed spec met (continuity)
    assert abs(r["p_cyl"] / 1e5 - 64.2) < 0.1 and abs(r["dp_hose"] / 1e5 - 1.06) < 0.02
    assert abs(r["power"] - 2.61e3) < 20
    # Pascal: the same pressure on a 10x bigger area gives 10x the force
    assert abs((r["p_cyl"] * 10 * r["A"]) / (r["p_cyl"] * r["A"]) - 10) < 1e-12
    # 70 kN on this cylinder would need more than the 210 bar relief allows; sizing picks a bigger bore
    assert 70e3 / r["A"] > 210e5 and design(F=70e3)["bore"] == 100
```
:::end

## Exercises

:::exercise
The same lift must rise at 0.25 m/s. What changes, and what doesn't?
:::solution
The flow scales with speed: $Q = 3.117\times10^{-3}\cdot0.25 = 46.8$ L/min. The cylinder pressure for the load stays 64.2 bar, but the losses grow (valve roughly ×6.25, hose ×2.5 while laminar) and the hose velocity becomes 9.9 m/s, too high, so use a 16 mm hose. Power goes up about 2.5× or more.
:::end

:::exercise
Why does a hydraulic cylinder hold a load in place much better than a pneumatic one?
:::solution
Oil's bulk modulus is around 1.5 GPa against air's few bar, so the trapped column is thousands of times stiffer (lesson 16's spring formula with $K$ in place of $np$). Closing the valve locks the cylinder almost rigidly, though leakage past seals lets it creep slowly, which is why load-holding valves exist.
:::end

## Quiz

:::quiz
- type: num
  q: Minimum bore in mm for 20 kN at 100 bar?
  answer: 50.46
  tol: 0.002
  unit: mm
  py: "math.sqrt(4*20e3/(math.pi*100e5))*1000"
  explain: √(4F/(πp)).
- type: num
  q: Cylinder pressure in bar for 20 kN on a 63 mm bore?
  answer: 64.16
  tol: 0.002
  unit: bar
  py: "20e3/(math.pi*0.063**2/4)/1e5"
  explain: F/A.
- type: num
  q: Flow in L/min to move a 63 mm piston at 0.10 m/s?
  answer: 18.70
  tol: 0.002
  unit: L/min
  py: "math.pi*0.063**2/4*0.10*60000"
  explain: Q = A·v.
- type: num
  q: Force in kN of a 63 mm bore at 200 bar?
  answer: 62.3
  tol: 0.003
  unit: kN
  py: "200e5*math.pi*0.063**2/4/1000"
  explain: p·A.
- type: num
  q: Reynolds number in a 10 mm hose at 3.97 m/s, ν = 32 cSt?
  answer: 1241
  tol: 0.003
  py: "3.97*0.010/32e-6"
  explain: uD/ν; laminar.
- type: mc
  q: In a hydraulic circuit, the actuator's speed is set by…
  options:
    - the pressure
    - the flow
    - the relief valve
    - the oil viscosity
  answer: 1
  explain: Continuity, v = Q/A.
:::end

:::verify
import math
A = math.pi*0.063**2/4; Q = A*0.1; u = 4*Q/(math.pi*0.01**2); Re = u*0.01/32e-6; f = 64/Re
assert abs(u - 3.97) < 0.01 and abs(f*300*870*u*u/2/1e5 - 1.06) < 0.01
assert abs((64.16+5+1+1.06)*1e5*Q/0.85 - 2.61e3) < 10
:::end
