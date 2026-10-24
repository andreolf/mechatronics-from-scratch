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
