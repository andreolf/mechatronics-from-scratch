import math

G, POLE = 9.81, 0.5
w = math.sqrt(G / POLE)

def residual(tau, gain=1.0, predict=False, T=10.0, dt=1e-3, d0=0.09):
    """swing left in the last 2 s of a 10 s run, starting from a 9 cm swing, with the PD swing damping acting on a
    state measured tau seconds ago; optionally rotated forward by omega * tau as a free pendulum would move"""
    kp, kd = 0.5 * w * w * gain, 0.9 * w * gain
    lag = int(round(tau / dt))
    d, v = d0, 0.0
    hist = [(d, v)] * (lag + 1)
    c, s = math.cos(w * tau), math.sin(w * tau)
    tail = 0.0
    for k in range(int(T / dt)):
        dm, vm = hist[-1 - lag]
        if predict and lag:
            dm, vm = dm * c + vm / w * s, -dm * w * s + vm * c
        a = kp * dm + kd * vm
        v += (-w * w * d - a) * dt
        d += v * dt
        hist.append((d, v))
        if len(hist) > lag + 2:
            hist.pop(0)
        if k * dt > T - 2:
            tail = max(tail, abs(d))
    return tail

for tau in (0.0, 0.1, 0.15, 0.2, 0.3):
    r = residual(tau)
    plain = "grows past 1 m" if r > 1 else f"{r*100:.3f} cm"
    print(f"delay {tau*1000:3.0f} ms: plain {plain}, projected {residual(tau, predict=True)*100:.3f} cm")
assert residual(0.1) < 1e-4                       # 100 ms: still fine
assert 0.0005 < residual(0.15) < 0.005            # 150 ms: slow to settle
assert residual(0.2) > 0.09                       # 200 ms: the swing grows
assert residual(0.2, predict=True) < 1e-4 and residual(0.3, predict=True) < 0.003
# the projection assumes the pendulum swings freely during the delay; a gentler gain keeps that nearly true
print(f"500 ms: full gain projected {residual(0.5, predict=True)*100:.1f} cm, half gain projected {residual(0.5, 0.5, True)*1000:.2f} mm")
assert residual(0.5, predict=True) > 0.05 and residual(0.5, 0.5, True) < 0.001

# message sizes: a 2 x 2 swing state at 100 Hz is nothing next to one camera
state_rate = 100 * 4 * 4                          # floats of 4 bytes
raw_video = 1920 * 1080 * 1.5 * 30                # YUV 4:2:0, bytes per second
print(f"swing state {state_rate / 1000:.1f} kB/s; one uncompressed 1080p30 camera {raw_video / 1e6:.0f} MB/s")
assert state_rate == 1600 and abs(raw_video / 1e6 - 93.3) < 0.1
print("PASS")
