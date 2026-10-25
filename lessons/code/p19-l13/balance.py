import numpy as np

def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)   # illustrative curve (Lesson 11)

def balance(soc0, q_ah, r_bleed=33.0, threshold_mv=5.0, hours=12.0, dt=10.0):
    """passive balancing at rest: every cell more than threshold above the lowest cell voltage bleeds through its resistor."""
    soc = np.array(soc0, float); q = np.array(q_ah, float) * 3600; heat = 0.0; t = 0.0; log = []
    while t < hours * 3600:
        v = ocv(soc); on = v > v.min() + threshold_mv / 1000
        i = np.where(on, v / r_bleed, 0.0); heat += np.sum(i * v) * dt
        soc -= i * dt / q; t += dt; log.append(1000 * (v.max() - v.min()))
    return soc, heat / 3600, np.array(log)

def pack_window(soc, q_ah):
    q = np.array(q_ah); down = np.min(soc * q); up = np.min((1 - soc) * q)   # Ah available before any cell hits a limit
    return down, up

def test_balancing():
    soc0 = [0.95, 0.92, 0.97, 0.90, 0.94, 0.96]; q = [3.0, 2.9, 3.05, 3.0, 2.95, 3.0]
    v0 = 1000 * (ocv(np.array(soc0)).max() - ocv(np.array(soc0)).min())
    soc, wh, log = balance(soc0, q)
    print(f"initial spread {v0:.1f} mV ({100 * (max(soc0) - min(soc0)):.1f} % SOC)")
    hrs = np.argmax(log < 10) * 10 / 3600
    print(f"after 12 h at 33 ohm: spread {log[-1]:.1f} mV, below 10 mV after {hrs:.2f} h, {wh:.3f} Wh turned into heat")
    print(f"lowest cell untouched: {soc0[3]:.4f} -> {soc[3]:.4f}")
    d0, u0 = pack_window(np.array(soc0), q); d1, u1 = pack_window(soc, q)
    print(f"charge the string can still accept before the fullest cell is full: {u0:.3f} Ah -> {u1:.3f} Ah")
    assert log[-1] < 0.25 * v0 and log[-1] < 10 and abs(soc[3] - soc0[3]) < 1e-12 and u1 > u0

def test_bleed_current():
    print(f"bleed current at 4.0 V through 33 ohm: {1000 * 4.0 / 33:.0f} mA, {1000 * 4.0**2 / 33:.0f} mW per cell")

test_balancing()
test_bleed_current()
print("PASS")
