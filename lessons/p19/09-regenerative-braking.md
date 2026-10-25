---
id: p19-l09
minutes: 35
summary: A motor can brake by acting as a generator and push energy back into a battery. You simulate an illustrative mountain railway car descending 500 m, book every joule to rolling resistance, air drag, conversion losses, battery losses, storage or friction brakes, check the books close, and see how a battery charge limit sends energy to the brakes.
---

## Braking as generation

A motor turning faster than its no-load speed, or driven by the load, produces a back EMF larger than the applied voltage, so current flows back into the supply. The inverter controls that current exactly as it does when motoring, only with negative torque. The mechanical braking power $P_{mech} = F_{brake}\, v$ becomes electrical power $\eta_m \eta_{inv} P_{mech}$, and the battery stores $\eta_{bat}$ of what it accepts.

## Where the energy goes

On a descent of height $h$ that starts and ends at rest, the potential energy $m g h$ has only a few places to go:

$$m g h = E_{roll} + E_{aero} + E_{conv} + E_{bat,loss} + E_{stored} + E_{friction}.$$

Rolling resistance $c_{rr} m g \cos\theta$ and air drag $\tfrac12 \rho c_d A v^2$ take their share first; the motor and inverter lose a fraction $1 - \eta_m\eta_{inv}$ of the rest, the battery another $1 - \eta_{bat}$. If the braking power exceeds the battery's charge limit (cold cells, a full battery), the excess must go to friction brakes or a braking resistor. Writing the books this way, and checking they close, catches sign errors and missing terms in any energy model.

## Mountain descents

Mountain railways and cable cars, common in Switzerland, are the textbook case: a long, steady descent with a heavy vehicle. Recovered energy can feed other trains on the line or a battery, and a vehicle that brakes electrically wears its friction brakes far less. The numbers below are for an illustrative car, not a specific line.

:::figure widget=regenbooks caption="Energy accounts for the descent. Change the grade, speed, efficiencies and battery charge limit; the bars show where the potential energy goes."
:::end

## Worked example

A 40 t car descends 500 m on a 10 % grade at 10 m/s, with motor 93 %, inverter 97 % and battery 95 % efficiency and a 400 kW charge limit:

1. Potential energy released: 54.500 kWh.
2. Stored 82.9 %, motor and inverter losses 9.5 %, battery losses 4.4 %, rolling resistance 2.0 %, air drag 1.2 %, friction brakes 0.1 % (only the final stop exceeds the charge limit).
3. The accounts close to within 0.005 % of the total (the time-step error).
4. With a 100 kW charge limit, only 26.2 % is stored and 66.2 % goes to friction brakes.

## Code it from scratch

:::code file=regen.py
```python
import numpy as np

G = 9.81

def descent(m=40e3, h=500.0, grade=0.10, v_set=10.0, crr=0.002, cda=8.0, rho=1.2, eta_m=0.93, eta_inv=0.97, eta_bat=0.95,
            p_bat_max=400e3, a_max=0.5, dt=0.05):
    """a vehicle descends a constant grade from rest to rest. A speed controller asks the motor for braking force; the
    motor turns it into electrical power (eta_m, eta_inv), the battery stores it (eta_bat) up to its charge limit, and
    friction brakes take whatever the electric system cannot. Every joule is booked to one account."""
    th = np.arctan(grade); L = h / np.sin(th); x = v = 0.0; acc = dict.fromkeys(["rolling", "aero", "motor+inverter loss", "battery loss", "stored", "friction brakes"], 0.0)
    while x < L:
        stop = v**2 / (2 * a_max)                                             # distance needed to stop at a_max
        v_ref = 0.0 if L - x <= stop else v_set
        f_grav = m * G * np.sin(th); f_roll = crr * m * G * np.cos(th); f_aero = 0.5 * rho * cda * v**2
        a_want = np.clip((v_ref - v) / 2.0, -a_max, a_max)                    # gentle speed controller
        f_brake = max(0.0, f_grav - f_roll - f_aero - m * a_want)            # total braking force needed
        p_mech = f_brake * v; p_elec = p_mech * eta_m * eta_inv; p_bat = min(p_elec, p_bat_max / eta_bat)
        p_store = p_bat * eta_bat; p_fric = (p_elec - p_bat) / (eta_m * eta_inv)   # excess handed back to friction brakes
        a = (f_grav - f_roll - f_aero - f_brake) / m
        acc["rolling"] += f_roll * v * dt; acc["aero"] += f_aero * v * dt
        acc["motor+inverter loss"] += (p_mech - p_fric) * (1 - eta_m * eta_inv) * dt
        acc["battery loss"] += p_bat * (1 - eta_bat) * dt; acc["stored"] += p_store * dt; acc["friction brakes"] += p_fric * dt
        v_new = max(v + a * dt, 0.0); x += 0.5 * (v + v_new) * dt; v = v_new
        if v == 0.0 and v_ref == 0.0: break
    pe = m * G * x * np.sin(th)
    return pe, acc, 0.5 * m * v**2

def test_accounting_closes():
    pe, acc, ke = descent()
    print(f"potential energy released {pe / 3.6e6:.3f} kWh")
    for k, val in acc.items(): print(f"  {k:22s} {val / 3.6e6:7.3f} kWh ({100 * val / pe:5.1f} %)")
    gap = pe - sum(acc.values()) - ke
    print(f"accounting gap {gap / 3.6e6:.2e} kWh ({100 * abs(gap) / pe:.3f} % of the total)")
    assert abs(gap) / pe < 5e-4 and acc["friction brakes"] < 0.01 * pe       # only the final stop exceeds the charge limit

def test_battery_limit():
    pe, acc, _ = descent(p_bat_max=100e3)
    print(f"with a 100 kW charge limit: stored {100 * acc['stored'] / pe:.1f} %, friction brakes {100 * acc['friction brakes'] / pe:.1f} %")
    assert acc["friction brakes"] > 0 and acc["stored"] < descent()[1]["stored"]

test_accounting_closes()
test_battery_limit()
print("PASS")
```
:::end

## In practice

NumPy is all an energy-accounting model needs; it is the first step in sizing a battery or braking resistor. Vehicle and rail engineers use the same books in tools such as MATLAB/Simulink or OpenTrack, add the drive's efficiency maps against torque and speed, and model the battery's charge-power limit against temperature and state of charge, which is often what limits recovery in practice.

## Exercises

:::exercise
How much energy is released by a 40 t car descending 500 m, in kWh?
:::solution
$m g h = 40000 \times 9.81 \times 500 = 196.2$ MJ $= 54.5$ kWh.
:::end

:::exercise
Why does a full battery force the friction brakes to work?
:::solution
A full battery cannot accept charge, so its charge limit drops to zero. Every joule the motor would generate has nowhere to go, so the controller must brake by friction or dump the energy in a braking resistor.
:::end

## Quiz

:::quiz
- type: num
  q: Potential energy of 10 t descending 200 m (kWh)?
  answer: 5.45
  tol: 0.01
  py: "10000*9.81*200/3.6e6"
  explain: m g h divided by 3.6 MJ per kWh.
- type: num
  q: Fraction stored from mechanical braking with 93 %, 97 % and 95 % efficiencies (%)?
  answer: 85.7
  tol: 0.01
  py: "100*0.93*0.97*0.95"
  explain: Multiply the efficiencies.
- type: num
  q: Braking power for 20 kN at 15 m/s (kW)?
  answer: 300
  tol: 0.001
  py: "20000*15/1000"
  explain: P = F v.
- type: num
  q: Air drag power with cdA 8 m², ρ 1.2 kg/m³ at 10 m/s (kW)?
  answer: 4.8
  tol: 0.01
  py: "0.5*1.2*8*10**3/1000"
  explain: ½ρ cdA v³.
- type: mc
  q: What happens to braking energy the battery cannot accept?
  options: ["It goes to friction brakes or a braking resistor", "It is stored in the motor", "It raises the bus voltage harmlessly forever", "It disappears"]
  answer: 0
  explain: The excess must be dissipated somewhere.
- type: mc
  q: Why check that the energy accounts close?
  options: ["It catches sign errors and missing loss terms", "It speeds up the simulation", "It makes the battery larger", "It is required by the motor"]
  answer: 0
  explain: Every joule must be booked once.
:::end
