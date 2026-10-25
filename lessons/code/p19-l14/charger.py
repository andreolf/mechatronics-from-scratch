import numpy as np

Q = 3.0; R0, R1, C1 = 0.022, 0.015, 1500.0                          # illustrative cell (Lessons 10-12)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)

V_MAX, V_PRE, I_CC, I_PRE, I_END = 4.20, 3.00, 1.0 * Q, 0.1 * Q, 0.05 * Q
T_MIN, T_MAX, TIMEOUT = 0.0, 45.0, 4 * 3600
V_TOL = 0.005                                                      # regulation tolerance (illustrative; check the cell datasheet)

class Charger:
    """IDLE -> PRECHARGE (deeply empty) -> CC -> CV -> DONE, with FAULT from any active state."""
    def __init__(self): self.state, self.i, self.integ, self.t = "IDLE", 0.0, 0.0, 0.0
    def step(self, v, temp, dt):
        s = self.state
        if s in ("PRECHARGE", "CC", "CV"):
            self.t += dt
            if not (T_MIN <= temp <= T_MAX) or self.t > TIMEOUT or v > V_MAX + 0.05: self.state = "FAULT"
        if s == "IDLE": self.state = "PRECHARGE" if v < V_PRE else "CC"
        elif s == "PRECHARGE" and self.state != "FAULT":
            if v >= V_PRE: self.state = "CC"
        elif s == "CC" and self.state != "FAULT":
            if v >= V_MAX - 0.010: self.state, self.integ = "CV", self.i - 20.0 * (V_MAX - v)   # bumpless transfer
        elif s == "CV" and self.state != "FAULT":
            if self.i < I_END: self.state = "DONE"
        st = self.state
        if st == "PRECHARGE": self.i = I_PRE
        elif st == "CC": self.i = min(I_CC, self.i + I_CC * dt / 2)                  # soft start, 2 s ramp
        elif st == "CV":
            self.integ = float(np.clip(self.integ + 10.0 * (V_MAX - v) * dt, 0, I_CC))     # PI voltage loop, clamped integrator (anti-windup)
            self.i = float(np.clip(self.integ + 20.0 * (V_MAX - v), 0, I_CC))
        else: self.i = 0.0
        return self.i

def charge(soc0=0.02, temp=lambda t: 25.0, dt=0.5):
    ch = Charger(); soc, v1, t = soc0, 0.0, 0.0; log = []
    a = np.exp(-dt / (R1 * C1))
    while ch.state not in ("DONE", "FAULT") and t < 6 * 3600:
        v = ocv(soc) + R0 * ch.i + v1                                                  # terminal voltage while charging
        i = ch.step(v, temp(t), dt)
        v = ocv(soc) + R0 * i + v1
        log.append((t, ch.state, i, v, soc))
        v1 = a * v1 + R1 * (1 - a) * i; soc += i * dt / (Q * 3600); t += dt
    return ch, log

def test_full_charge():
    ch, log = charge()
    t, st, i, v, soc = map(np.array, zip(*log))
    first = {s: t[st == s][0] / 60 for s in ("PRECHARGE", "CC", "CV")}
    print("state entered at (min): " + ", ".join(f"{k} {val:.1f}" for k, val in first.items()))
    print(f"finished {ch.state} after {t[-1] / 60:.1f} min at SOC {100 * soc[-1]:.1f} %")
    print(f"max voltage {v.max():.4f} V (limit {V_MAX} V + {1000 * V_TOL:.0f} mV tolerance), max current {i.max():.3f} A (limit {I_CC})")
    assert ch.state == "DONE" and v.max() <= V_MAX + V_TOL and i.max() <= I_CC + 1e-9 and soc[-1] > 0.95
    cc_share = 100 * np.sum(i[st == "CC"]) / np.sum(i)
    print(f"{cc_share:.0f} % of the charge went in during CC")

def test_temperature_fault():
    ch, log = charge(soc0=0.5, temp=lambda t: 25 + t / 60)                            # cell heats 1 K per minute
    print(f"over-temperature: {ch.state} after {log[-1][0] / 60:.1f} min, current then {log[-1][2]:.1f} A")
    assert ch.state == "FAULT" and log[-1][2] == 0.0

test_full_charge()
test_temperature_fault()
print("PASS")
