import math
import numpy as np

G, M, POLE, LIMIT = 9.81, 1.25, 0.5, 28.0

# 1. the limits stack up: relax at 28 N, firmware cut-off at 40 N, power line rated 50 N
assert 28 < 40 < 50
print(f"28 N is the weight of {28 / G:.2f} kg; the 50 N line has a margin of {50 / 28:.2f} over the relax limit")

# 2. tensions at rest at the lab's safety pose: pivot (0.8, 0.4, 1.4) in the 7 x 7 x 3 m room, 1.25 kg
A = np.array([[-3.5, -3.5, 3], [3.5, -3.5, 3], [3.5, 3.5, 3], [-3.5, 3.5, 3]])
v = A - [0.8, 0.4, 1.4]; U = (v / np.linalg.norm(v, axis=1)[:, None]).T
t = U.T @ np.linalg.solve(U @ U.T, [0, 0, M * G])
print("tensions at rest (N):", t.round(2))
assert np.allclose(t, [8.11, 10.25, 11.74, 8.91], atol=0.006) and t.max() < LIMIT

# 3. a sudden sideways push: the pendulum overshoots, so the pole (and the lines) see more than the static force
def step_push(F, dt=1e-5, t_end=3.0):
    a = w = 0.0; peak = 0.0; amax = 0.0
    for _ in range(int(t_end / dt)):
        w += (-G * math.sin(a) + F / M * math.cos(a)) / POLE * dt
        a += w * dt
        peak = max(peak, M * G * math.cos(a) + F * math.sin(a) + M * POLE * w * w)
        amax = max(amax, a)
    return peak, math.degrees(amax)
peak, amax = step_push(15.0)
static = math.hypot(15.0, M * G)
print(f"15 N push: {static:.1f} N on the pole when steady, {peak:.1f} N at the first swing, {amax:.0f} degrees of swing")
assert abs(static - 19.37) < 0.01 and abs(peak - 33.6) < 0.1 and abs(amax - 101.5) < 0.2

# 4. a line bent around a body by angle phi on each side presses on it with 2 T sin(phi)
for phi in (5, 30, 90):
    print(f"  line at the limit bent {phi} degrees each side presses with {2 * LIMIT * math.sin(math.radians(phi)):.1f} N")
assert abs(2 * LIMIT * math.sin(math.radians(5)) - 4.88) < 0.01

# 5. letting go: free fall from 2.5 m against a controlled 0.3 m/s descent
v_fall = math.sqrt(2 * G * 2.5)
print(f"dropped from 2.5 m: {v_fall:.1f} m/s, {0.5 * M * v_fall**2:.1f} J; lowered at 0.3 m/s: {0.5 * M * 0.09 * 1000:.0f} mJ")
assert abs(v_fall - 7.0) < 0.01 and abs(0.5 * M * v_fall**2 - 30.7) < 0.05

# 6. a latching supervisor: trips on any line over the limit, stays tripped until re-armed,
#    and re-arming into a fault that is still there trips again at once
class Supervisor:
    def __init__(self, limit):
        self.limit, self.relaxed, self.reason = limit, False, ""
    def update(self, tensions):
        if not self.relaxed and max(tensions) > self.limit:
            self.relaxed, self.reason = True, f"line {int(np.argmax(tensions)) + 1} at {max(tensions):.1f} N"
        return self.relaxed
    def rearm(self):
        self.relaxed, self.reason = False, ""

s = Supervisor(LIMIT)
assert not s.update(t)
assert s.update([12, 29.5, 10, 9]) and s.reason == "line 2 at 29.5 N"
assert s.update(t)                       # still relaxed after the overload has gone: latched
s.rearm(); assert not s.update(t)
s.rearm(); assert s.update([30, 10, 10, 10])
# at a 50 Hz loop an overload is seen within 20 ms, during which 0.4 m/s covers 8 mm
assert abs(0.4 * 0.02 - 0.008) < 1e-12
print("PASS")
