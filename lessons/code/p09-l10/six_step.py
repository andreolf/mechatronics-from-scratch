import numpy as np

HALL = [1, 3, 2, 6, 4, 5]                     # forward Hall sequence, sector 0..5
PAIR_AT = {330: ("A", "B"), 30: ("A", "C"), 90: ("B", "C"), 150: ("B", "A"), 210: ("C", "A"), 270: ("C", "B")}
AXIS = {"A": 0.0, "B": 120.0, "C": 240.0}

def hall_code(theta_deg):
    sector = int(((theta_deg + 30) % 360) // 60)
    return HALL[sector]

def commutate(code, forward=True):
    """Hall code -> (high phase, low phase). Builds the table from geometry, not by hand."""
    sector = HALL.index(code)
    field = (60 * sector + (90 if forward else -90)) % 360
    return PAIR_AT[field]

def field_angle(pair):
    x, y = pair
    v = np.array([np.cos(np.radians(AXIS[x])) - np.cos(np.radians(AXIS[y])),
                  np.sin(np.radians(AXIS[x])) - np.sin(np.radians(AXIS[y]))])
    return np.degrees(np.arctan2(v[1], v[0])) % 360

def spin(forward, T=0.3, dt=1e-5, J=2e-5, b=1e-4, Tmax=0.05):
    th = 10.0; w = 0.0                          # electrical degrees, rad/s (electrical)
    lead_seen = []
    for _ in range(int(T / dt)):
        pair = commutate(hall_code(th), forward)
        lead = (field_angle(pair) - th + 180) % 360 - 180
        lead_seen.append(lead)
        w += dt * (Tmax * np.sin(np.radians(lead)) - b * w) / J
        th = (th + np.degrees(w) * dt) % 360
    return w, np.array(lead_seen)

if __name__ == "__main__":
    # the geometric pair table is what we claimed
    for ang, pair in PAIR_AT.items():
        assert abs(field_angle(pair) - ang) < 1e-9
    # every Hall sector gets a vector 60..120 deg ahead (forward) or behind (reverse)
    for th in np.arange(0, 360, 0.5):
        for fwd in (True, False):
            lead = (field_angle(commutate(hall_code(th), fwd)) - th + 180) % 360 - 180
            assert 59.99 <= (lead if fwd else -lead) <= 120.01
    wf, lf = spin(True); wr, lr = spin(False)
    print(f"forward speed {wf:.0f} rad/s, reverse {wr:.0f} rad/s")
    assert wf > 100 and wr < -100 and abs(wf + wr) < 0.02 * wf
    # average torque factor 3/pi, ripple 1 - sin 60
    s = np.sin(np.radians(np.linspace(60, 120, 100001)))
    assert abs(s.mean() - 3 / np.pi) < 1e-4 and abs(1 - s.min() - 0.134) < 1e-3
