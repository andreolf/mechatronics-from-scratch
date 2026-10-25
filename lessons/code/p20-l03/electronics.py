import numpy as np
from scipy.linalg import solve_continuous_are

# ---- 1. power budget (illustrative currents) ----
RAILS = {"3V3": {"MCU": 0.060, "IMU": 0.004, "radio": 0.030, "LEDs": 0.010}, "5V": {"encoders": 0.040}}
VBAT, CAP_AH, MOTOR_W, BUCK_ETA = 11.1, 2.5, 2 * 8.0, 0.90

def budget():
    i33 = sum(RAILS["3V3"].values()); i5 = sum(RAILS["5V"].values()) + i33          # 3V3 LDO fed from the 5 V buck
    p_ldo = (5.0 - 3.3) * i33; p5_in = 5.0 * i5 / BUCK_ETA; p_bat = p5_in + MOTOR_W
    return i33, i5, p_ldo, p_bat, 60 * VBAT * CAP_AH * 0.85 / p_bat

# ---- 2. electrical rules check on a netlist written as data ----
# pin types follow KiCad's: power_in, power_out, input, output, bidirectional, passive, no_connect
PARTS = {
    "BT1": {"+": ("VBAT", "power_out"), "-": ("GND", "power_out")},
    "U1 buck": {"VIN": ("VBAT", "power_in"), "GND": ("GND", "power_in"), "VOUT": ("5V", "power_out")},
    "U2 LDO": {"VIN": ("5V", "power_in"), "GND": ("GND", "power_in"), "VOUT": ("3V3", "power_out")},
    "U3 MCU": {"VDD": ("3V3", "power_in"), "GND": ("GND", "power_in"), "SDA": ("SDA", "bidirectional"), "SCL": ("SCL", "output"),
               "PWM1": ("PWM1", "output"), "PWM2": ("PWM2", "output"), "IRQ": ("IMU_INT", "input"), "PA7": (None, "no_connect")},
    "U4 IMU": {"VDD": ("3V3", "power_in"), "GND": ("GND", "power_in"), "SDA": ("SDA", "bidirectional"), "SCL": ("SCL", "input"), "INT": ("IMU_INT", "output")},
    "U5 driver": {"VM": ("VBAT", "power_in"), "VCC": ("3V3", "power_in"), "GND": ("GND", "power_in"), "IN1": ("PWM1", "input"), "IN2": ("PWM2", "input"),
                  "OUT1": ("M+", "output"), "OUT2": ("M-", "output")},
    "M1 motor": {"1": ("M+", "passive"), "2": ("M-", "passive")},
    "R1 pull-up": {"1": ("3V3", "passive"), "2": ("SDA", "passive")}, "R2 pull-up": {"1": ("3V3", "passive"), "2": ("SCL", "passive")},
}

def erc(parts):
    nets = {}; errors = []
    for ref, pins in parts.items():
        for pin, (net, kind) in pins.items():
            if net is None:
                if kind != "no_connect": errors.append(f"{ref}.{pin} unconnected")
                continue
            nets.setdefault(net, []).append((ref, pin, kind))
    for net, pins in nets.items():
        kinds = [k for _, _, k in pins]
        if len(pins) == 1: errors.append(f"net {net} has a single pin ({pins[0][0]}.{pins[0][1]})")
        if kinds.count("output") + kinds.count("power_out") > 1 and net != "GND": errors.append(f"net {net}: more than one output drives it")
        if "power_in" in kinds and "power_out" not in kinds: errors.append(f"net {net}: power input not driven by a power output")
        if "input" in kinds and not any(k in kinds for k in ("output", "bidirectional", "power_out")): errors.append(f"net {net}: input with no driver")
    return errors

# ---- 3. IMU placement: accelerometer tilt error during a recovery ----
def recovery(M=0.9, m=0.12, r=0.04, l=0.07, Ib=0.004, Iw=9.6e-5, g=9.81):
    Mm = np.array([[M + m + Iw / r**2, M * l], [M * l, Ib + M * l**2]]); Mi = np.linalg.inv(Mm)
    A = np.zeros((4, 4)); A[0, 1] = A[2, 3] = 1; A[[1, 3], 2] = Mi @ [0, M * g * l]; B = np.zeros(4); B[[1, 3]] = Mi @ [1 / r, -1]
    K = (B @ solve_continuous_are(A, B[:, None], np.diag([10, 1, 100, 1]), np.array([[50.0]])) * 50.0 ** -1)
    s = np.array([0, 0, np.radians(5), 0]); dt = 1e-3; log = []
    for _ in range(2000):
        ds = A @ s + B * float(-K @ s); log.append((ds[1], ds[3], s[2])); s = s + dt * ds
    return np.array(log)

def tilt_error(log, h, g=9.81):
    """an accelerometer h above the axle on the body reads (x'' + h th'') along the body plus gravity: tilt from atan2."""
    xdd, thdd, th = log.T; ax = g * np.sin(th) + (xdd * np.cos(th) + h * thdd); az = g * np.cos(th) - xdd * np.sin(th)
    return np.degrees(np.max(np.abs(np.arctan2(ax, az) - th)))

def test_power_budget():
    i33, i5, p_ldo, p_bat, run = budget()
    print(f"3V3 rail {1000 * i33:.0f} mA, 5V rail {1000 * i5:.0f} mA, LDO dissipation {1000 * p_ldo:.0f} mW, battery load {p_bat:.2f} W, runtime {run:.1f} min")
    assert run >= 30 and p_ldo < 0.5

def test_erc():
    errs = erc(PARTS); print(f"ERC on the design: {len(errs)} errors"); assert not errs
    broken = {k: dict(v) for k, v in PARTS.items()}
    broken["U2 LDO"]["VOUT"] = ("3V3_LDO", "power_out")                       # LDO output drawn to a separately named net
    broken["U4 IMU"]["INT"] = (None, "output")                               # interrupt pin left floating
    broken["U5 driver"]["IN2"] = ("PWM1", "input"); broken["U3 MCU"]["PWM2"] = ("PWM1", "output")   # two outputs shorted
    for e in erc(broken): print("  caught:", e)
    assert len(erc(broken)) >= 4

def test_imu_placement():
    log = recovery()
    errs = {h: tilt_error(log, h) for h in np.round(np.arange(0, 0.31, 0.01), 2)}
    best = min(errs, key=errs.get)
    print("accelerometer tilt error during a 5 deg recovery: " + ", ".join(f"{100 * h:.0f} cm {errs[h]:.2f} deg" for h in (0.0, 0.07, 0.15, 0.30)))
    print(f"best height {100 * best:.0f} cm above the axle: {errs[best]:.2f} deg")
    assert errs[best] < errs[0.0] and errs[best] < errs[0.07]

test_power_budget()
test_erc()
test_imu_placement()
print("PASS")
