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
