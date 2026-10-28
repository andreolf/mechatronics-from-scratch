---
id: p21-l09
minutes: 40
summary: Stringman's computing is split between a PC and three small Raspberry Pis talking over Wi-Fi, with CAN to the motors and serial to the gripper servos. You trace the signal path, put numbers on the data, and find out what a few hundred milliseconds of delay do to swing damping, and how projecting the swing forward rescues it.
---

## Where the computing lives

Neufangled's usage guide describes the split plainly. The brain is a Python program, the motion controller (`stringman-headless`), running on your own PC. The robot's components are "just light video streaming devices and motor command issuers". If the motion controller is not running, the anchors simply hold position and transmit nothing.

From the tech specs, the parts list and the firmware source, the pieces are:

| Unit | Computer | Talks to its hardware over | Talks to the PC over |
|---|---|---|---|
| Two anchors, each with two DM-H6215 motors and a camera | Raspberry Pi 3A+ | CAN bus (`can0`, through an MCP2515 controller) | 5 GHz Wi-Fi |
| Gripper with IMU, camera, wrist and finger servos | Raspberry Pi Zero 2W | Serial at 1 Mbit/s to the STS3215 servos | 2.4 GHz Wi-Fi only |
| Motion controller and UI server | Your PC | | |

Each component runs a WebSocket server on port 8765 and announces itself with mDNS, so the motion controller finds and connects to everything without you typing an address. The control panel in your browser connects to the motion controller on port 4245, and messages are typed with protocol buffers. The cameras are 1920 × 1080 at 30 fps on the anchors and 684 × 384 at 60 fps on the gripper. The whole thing can run air-gapped on your own network, with the UI served locally and the models on your own hardware.

The gripper gets its power down one of the support lines, the two-conductor FEP line from Lesson 5. That is why it has no battery and why that one line has a thicker pile on its spool.

## Why split it this way

There are good reasons and they recur in every robot you will build.

- **Fast loops stay local.** The tension regulation in Lesson 5 runs at 50 Hz on the anchor itself, and the 40 N cut-off works with the network down. Nothing that keeps a line from going slack waits for Wi-Fi.
- **Heavy maths goes where the power is.** Calibration fits, camera processing and learned policies (Lesson 10) run on the PC.
- **Bandwidth is about video, not control.** The swing state the gripper publishes is four numbers at 100 Hz, 1.6 kB/s. One uncompressed 1080p30 camera stream is 93 MB/s, which is why video is compressed and scaled down before it travels.

The price is that the swing damping loop now crosses the network twice: gyro on the gripper, Wi-Fi to the PC, controller, Wi-Fi to an anchor, CAN to the motor. Every hop adds delay, and Wi-Fi delay is not even constant.

## What delay does to damping

Lesson 7's damping law accelerates the pivot towards the swing. Delay the measurement by $\tau$ and the correction lands at the wrong phase. For a swing with $\omega = 4.43$ rad/s, a delay of $\tau$ is a phase lag of $\omega\tau$. In the simulation below, with the gains from Lesson 7 and a 9 cm swing to start:

| Delay | Acting on the old state | Projected forward by the delay |
|---|---|---|
| 100 ms | damped | damped |
| 150 ms | 1.2 mm still swinging after 8 s | damped |
| 200 ms | **grows without limit** | damped |
| 300 ms | grows | 1.8 mm left |

At 200 ms the phase lag is 0.89 rad, 51°, and the "damping" has turned into pumping.

The fix is the one in Stringman's `swing.py`. A pendulum swings at one frequency, so a state measured $\tau$ ago can be rotated forward by $\omega\tau$ to where it is now:

$$ \begin{bmatrix} d \\ \dot d/\omega \end{bmatrix}_{\!\text{now}} = \begin{bmatrix} \cos\omega\tau & \sin\omega\tau \\ -\sin\omega\tau & \cos\omega\tau \end{bmatrix} \begin{bmatrix} d \\ \dot d/\omega \end{bmatrix}_{\!\text{then}} . $$

That rotation is exact for a free pendulum. It is only approximate here, because the controller has been pushing on the swing during the delay. The stronger the push, the worse the approximation: at 500 ms with full gain the projected loop leaves 13.8 cm of swing, while at half gain it leaves 0.3 mm. A gentle gain plus a good latency estimate beats a strong gain on a stale measurement. Stringman's correction is gentle too, a gain of −0.12 on the projected swing acceleration, and its latency is measured by trial rather than assumed, with candidates clipped between 0 and 0.75 s.

:::figure widget=swingdelay caption="Swing damping through a delay. Raise the delay until the swing grows, then project the swing forward. Push the delay further and lower the gain to find what keeps it damped."
:::end

## Code it from scratch

:::code file=delayed_damping.py
```python
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
```
:::end

## In practice

Measure your loop delay end to end before tuning anything. Log a timestamp when the IMU sample is taken, carry it through every message, and log when the motor command based on it is applied; the difference, over a few thousand samples, is your latency distribution. Use its median for the projection and look at its tail: a Wi-Fi link that is usually 30 ms and sometimes 300 ms will occasionally hand the loop a correction at the wrong phase, and the gain has to be gentle enough to survive that. Put the gripper on its own 2.4 GHz channel away from the anchors if your router allows it.

## Exercises

:::exercise
At what delay does the phase lag of a 0.5 m swing reach 90°?
:::solution
$\omega\tau = \pi/2$ gives $\tau = \pi/(2 \times 4.43) = 0.355$ s. A quarter period, 1.419/4. By then a correction meant to oppose the swing velocity is acting on its displacement instead, and well before that the loop has lost its damping.
:::end

:::exercise
Why does the projected loop get worse at long delays with a strong gain, but not with a gentle one?
:::solution
The projection assumes the pendulum swings freely during the delay. With a strong gain, the corrections issued during the delay change the swing a lot, so the free-pendulum prediction is wrong by the time the next correction lands. With a gentle gain each correction barely changes the swing over one delay, so the prediction stays accurate.
:::end

## Quiz

:::quiz
- type: num
  q: Phase lag of a 0.5 m swing for a 200 ms loop delay (degrees)?
  answer: 50.8
  tol: 0.005
  py: "math.degrees(math.sqrt(9.81/0.5)*0.2)"
  explain: ω τ with ω = 4.43 rad/s.
- type: num
  q: Data rate of a 2 × 2 state of 4-byte floats sent at 100 Hz (kB/s)?
  answer: 1.6
  tol: 0.001
  py: "100*4*4/1000"
  explain: 16 bytes per message.
- type: mc
  q: Which loop does Stringman keep on the anchor instead of across the network?
  options: ["Line tension regulation and the 40 N cut-off", "Swing cancellation", "Calibration", "The learned policy"]
  answer: 0
  explain: The 50 Hz tension loop runs on the anchor itself.
- type: mc
  q: How does the motion controller find the robot's components?
  options: ["They announce themselves with mDNS and serve WebSockets on port 8765", "You type their IP addresses", "Over Bluetooth", "Through a cloud server only"]
  answer: 0
  explain: The component server registers an mDNS service.
- type: mc
  q: What does projecting the measured swing forward by the delay assume?
  options: ["That the pendulum swings freely during the delay", "That there is no delay", "That the gyro is noise-free", "That the pivot is fixed forever"]
  answer: 0
  explain: It is a rotation by ωτ, exact only for a free pendulum.
- type: num
  q: Delay at which the phase lag of a 0.5 m swing reaches 90° (s)?
  answer: 0.355
  tol: 0.005
  py: "math.pi/2/math.sqrt(9.81/0.5)"
  explain: A quarter period.
:::end

:::verify
import math
w = math.sqrt(9.81/0.5)
assert abs(w-4.43) < 0.005 and abs(w*0.2-0.89) < 0.005 and abs(math.degrees(w*0.2)-51) < 0.5 and abs(math.pi/(2*w)-0.355) < 0.0005
assert abs(2*math.pi/w/4-0.355) < 0.0005 and 100*4*4 == 1600 and abs(1920*1080*1.5*30/1e6-93) < 0.5
:::end

## Sources

- Neufangled, [usage guide](https://neufangled.com/docs/usage_guide/) (motion controller on the PC, components as "light video streaming devices and motor command issuers", anchors hold position without it, LAN mode on port 4245).
- Neufangled, [Stringman tech specs](https://neufangled.com/) (Pi 3A+ anchors, Pi Zero 2W gripper, 5 GHz Wi-Fi with the gripper 2.4 GHz only, cameras, parts list with DM-H6215 and STS3215, air-gapped operation, power through a support line).
- Stringman firmware, Apache-2.0, at commit e1ee31d: [`anchor_arp_server.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/anchor_arp_server.py) (DM motors on `can0`), [`simple_st3215.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/simple_st3215.py) (servo serial at 1 Mbit/s), [`component_server.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/component_server.py) (WebSocket on 8765, mDNS, MCP2515), [`swing.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/host/swing.py) (forward projection, gain, latency range).
