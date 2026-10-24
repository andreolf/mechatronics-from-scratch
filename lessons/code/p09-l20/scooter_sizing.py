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
