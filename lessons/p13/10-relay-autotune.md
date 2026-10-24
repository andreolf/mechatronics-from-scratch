---
id: p13-l10
minutes: 40
summary: Ziegler and Nichols tuned PID loops from just two numbers, the ultimate gain at which a proportional loop oscillates steadily and the period of that oscillation, and a relay in the loop finds both safely by making the plant oscillate at a small controlled amplitude. You derive the relay's describing function and the tuning rules, implement relay autotuning, and test that the estimated ultimate gain and period are within 10 percent of the exact values for two plants, one with dead time.
---

## The ultimate point

Raise a proportional gain until the loop just oscillates. That **ultimate gain** $K_u$ and the oscillation's **ultimate period** $P_u$ describe the plant where it matters most for stability: at the frequency $\omega_u$ where its phase is $-180°$,

$$\angle G(j\omega_u) = -180°, \qquad K_u = \frac{1}{|G(j\omega_u)|}, \qquad P_u = \frac{2\pi}{\omega_u}.$$

Pushing a real process to the edge of instability is risky. Åström and Hägglund's relay method gets the same point gently.

## The relay experiment

Replace the controller by a relay: $u = +d$ when $e > 0$, $-d$ when $e < 0$. Most plants then settle into a limit cycle at (nearly) $\omega_u$. The relay's output is a square wave, but the plant filters away its harmonics, so the loop sees mostly the fundamental, of amplitude $4d/\pi$. If the output oscillates with amplitude $a$, the relay behaves like a gain

$$N(a) = \frac{4d}{\pi a},$$

its **describing function**. The limit cycle sits where $N(a)G(j\omega) = -1$, so

$$K_u \approx \frac{4d}{\pi a}, \qquad P_u \approx \text{the measured period}.$$

The amplitude is set by $d$, so you choose how far the process is disturbed.

**Which amplitude?** The describing function compares fundamentals, so $a$ should be the amplitude of the output's fundamental, not its peak. For a strongly low-pass plant they're nearly equal. For a plant that is mostly dead time plus one lag, the output is closer to a triangle wave and the peak can overstate the fundamental by 20 %. Extracting the fundamental with one Fourier coefficient over whole periods fixes that cheaply.

## Ziegler-Nichols rules

From $K_u$ and $P_u$, the classic PID settings are

$$K_p = 0.6K_u, \qquad T_i = P_u/2, \qquad T_d = P_u/8.$$

They give fast but aggressive loops (overshoot often 40 % or more); treat them as a starting point to detune.

:::figure widget=relaycycle caption="A relay in the loop drives the plant into a limit cycle. The ultimate gain is read from the relay amplitude and the output amplitude, the period from the zero crossings. Add dead time to see the period lengthen and the estimate stay close."
:::end

## Worked example

$G(s) = 1/(s + 1)^3$.

1. Phase $-3\arctan\omega = -180°$ gives $\omega_u = \tan 60° = \sqrt3$ rad/s, so $P_u = 2\pi/\sqrt3 = 3.63$ s.
2. $|G(j\sqrt3)| = 1/(1 + 3)^{3/2} = 1/8$, so $K_u = 8$.
3. ZN PID: $K_p = 4.8$, $T_i = 1.81$ s, $T_d = 0.45$ s.

## Code it from scratch

:::code file=relay.py
```python
import numpy as np
from scipy.optimize import brentq

def plant_lag3():
    A = np.array([[-1.0, 0, 0], [1, -1, 0], [0, 1, -1]]); B = np.array([1.0, 0, 0]); C = np.array([0, 0, 1.0])
    return A, B, C, 0.0, lambda w: 1 / (1j * w + 1) ** 3

def plant_fopdt():
    A = np.array([[-0.5]]); B = np.array([0.5]); C = np.array([1.0])        # 1/(2s + 1), then 0.5 s dead time
    return A, B, C, 0.5, lambda w: np.exp(-0.5j * w) / (2j * w + 1)

def exact_ultimate(G):
    ph = lambda w: np.unwrap([np.angle(G(x)) for x in np.linspace(1e-3, w, 400)])[-1] + np.pi
    wu = brentq(ph, 0.1, 20)
    return 1 / abs(G(wu)), 2 * np.pi / wu

def relay_test(plant, d=1.0, hyst=0.0, T=60.0, dt=1e-3, noise=0.0, seed=0):
    A, B, C, delay, _ = plant
    x = np.zeros(len(B)); nd = int(round(delay / dt)); buf = [0.0] * (nd + 1)
    u = d; ys, us = [], []; rng = np.random.default_rng(seed)
    f = lambda x, u: A @ x + B * u
    for _ in range(int(T / dt)):
        y = C @ x + noise * rng.normal()
        e = -y                                             # setpoint 0, relay acts on the error
        if e > hyst: u = d
        elif e < -hyst: u = -d
        buf.append(u); ud = buf.pop(0)
        k1 = f(x, ud); k2 = f(x + dt / 2 * k1, ud); k3 = f(x + dt / 2 * k2, ud); k4 = f(x + dt * k3, ud)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ys.append(C @ x); us.append(u)
    ys = np.array(ys[len(ys) // 2:])                        # discard the start-up transient
    up = np.where((ys[:-1] < 0) & (ys[1:] >= 0))[0]
    Pu = np.mean(np.diff(up)) * dt
    seg = ys[up[0]:up[-1]]                                 # whole periods only
    tt = np.arange(len(seg)) * dt
    a1 = 2 * abs(np.mean(seg * np.exp(-2j * np.pi * tt / Pu)))   # amplitude of the fundamental
    a_peak = (ys.max() - ys.min()) / 2
    return 4 * d / (np.pi * a1), Pu, 4 * d / (np.pi * a_peak)

def test_relay_estimates_within_10_percent():
    for name, plant in (("1/(s+1)^3", plant_lag3()), ("e^-0.5s/(2s+1)", plant_fopdt())):
        Ku, Pu = exact_ultimate(plant[4])
        Ku_r, Pu_r, Ku_peak = relay_test(plant)
        print(f"{name:15s}: exact Ku {Ku:.3f}, Pu {Pu:.3f} s | relay Ku {Ku_r:.3f} ({Ku_r / Ku - 1:+.1%}), Pu {Pu_r:.3f} s ({Pu_r / Pu - 1:+.1%}) | from the peak instead: {Ku_peak:.3f} ({Ku_peak / Ku - 1:+.1%})")
        assert abs(Ku_r / Ku - 1) < 0.10 and abs(Pu_r / Pu - 1) < 0.10

def test_worked_example_exact():
    Ku, Pu = exact_ultimate(plant_lag3()[4])
    assert abs(Ku - 8) < 1e-6 and abs(Pu - 2 * np.pi / np.sqrt(3)) < 1e-6

def test_noise_with_hysteresis():
    Ku, Pu = exact_ultimate(plant_lag3()[4])
    Ku_r, Pu_r, _ = relay_test(plant_lag3(), hyst=0.02, noise=0.005)
    assert abs(Ku_r / Ku - 1) < 0.15 and abs(Pu_r / Pu - 1) < 0.15

def test_zn_pid_stable():
    Ku, Pu = 8.0, 2 * np.pi / np.sqrt(3)
    Kp, Ti, Td = 0.6 * Ku, Pu / 2, Pu / 8
    # closed loop with C = Kp(1 + 1/(Ti s) + Td s) and G = 1/(s + 1)^3: s(s+1)^3 + Kp(Td s^2 + s + 1/Ti) = 0
    cl = np.polyadd(np.polymul([1, 0], np.poly([-1, -1, -1])), Kp * np.array([Td, 1, 1 / Ti]))
    assert np.all(np.roots(cl).real < 0)

test_worked_example_exact()
test_relay_estimates_within_10_percent()
test_noise_with_hysteresis()
test_zn_pid_stable()
print("PASS")
```
:::end

## Exercises

:::exercise
Why is the relay estimate of $K_u$ slightly off, and in which direction would you expect it to err for $1/(s + 1)^3$?
:::solution
The describing function keeps only the square wave's fundamental, but the limit cycle settles where the *whole* loop, harmonics included, balances. So the oscillation runs at a slightly different frequency from $\omega_u$, and $K_u$ is read there: for $1/(s + 1)^3$ that costs about 3 to 4 %. Using the output's peak instead of its fundamental adds a second error. Here it happens to partly cancel, but for the dead-time plant, whose output is nearly a triangle wave, it makes $K_u$ 17 % low.
:::end

:::exercise
Your relay has amplitude ±2 % of full scale and the measured output oscillates ±0.5 %. Estimate $K_u$.
:::solution
$K_u = 4 \times 2/(\pi \times 0.5) = 5.1$, in units of actuator per output (both in percent of full scale).
:::end

## Quiz

:::quiz
- type: num
  q: Ultimate gain of 1/(s + 1)³?
  answer: 8
  tol: 0.001
  py: "(1+3)**1.5"
  explain: "The gain magnitude at √3 rad/s is 1/8."
- type: num
  q: Ultimate period in s of 1/(s + 1)³?
  answer: 3.628
  tol: 0.002
  unit: s
  py: "2*3.14159265/3**0.5"
  explain: 2π/√3.
- type: num
  q: Describing-function gain of a ±1 relay when the output oscillates ±0.16?
  answer: 7.96
  tol: 0.005
  py: "4/(3.14159265*0.16)"
  explain: 4d/(πa).
- type: num
  q: Ziegler-Nichols K_p for K_u = 8?
  answer: 4.8
  tol: 0.001
  py: "0.6*8"
  explain: 0.6 K_u.
- type: mc
  q: Why use a relay rather than raising P gain to find K_u?
  options:
    - the oscillation amplitude is controlled by the relay level
    - it's more accurate than the exact value
    - it doesn't need a plant
    - it gives zero steady error
  answer: 0
  explain: The experiment stays small and safe.
- type: mc
  q: Ziegler-Nichols PID tunings are typically…
  options:
    - aggressive, with large overshoot
    - very conservative
    - optimal for noise
    - unstable
  answer: 0
  explain: Detune them in practice.
:::end
