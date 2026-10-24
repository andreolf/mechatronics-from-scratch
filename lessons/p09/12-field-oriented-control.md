---
id: p09-l12
minutes: 45
summary: Field-oriented control runs two PI current loops in the rotor's dq frame, so a permanent-magnet motor's torque becomes a single constant setpoint. You derive the dq voltage equations and the torque law, simulate a PMSM in its three real phases under FOC, and show its torque ripple is tiny next to six-step drive.
---

## The motor in dq

Transform a permanent-magnet synchronous motor (PMSM) with $p$ pole pairs, phase resistance $R$, inductance $L$ (surface magnets, so $L_d = L_q = L$) and magnet flux linkage $\psi$ into the rotor frame (lesson 11). With electrical speed $\omega_e = p\,\omega_m$:

$$L\frac{di_d}{dt} = v_d - R i_d + \omega_e L i_q,$$
$$L\frac{di_q}{dt} = v_q - R i_q - \omega_e L i_d - \omega_e\psi.$$

Each axis is the RL circuit of lesson 7, plus two **cross-coupling** terms $\pm\omega_e L i$ and the back-EMF $\omega_e\psi$ on q.

## The torque law

The power absorbed by the back-EMFs is $\tfrac32\omega_e\psi\,i_q$ (the 3/2 comes from the amplitude-invariant transform), and dividing by $\omega_m$:

$$T = \frac32\,p\,\psi\, i_q.$$

Only $i_q$ makes torque; $i_d$ just pushes along the magnet's flux. So FOC sets $i_d^* = 0$ (or negative for field weakening at high speed) and $i_q^* = T^*/(\tfrac32 p\psi)$.

## The control loop

Every PWM period:

1. Measure two phase currents and read the rotor angle θ from an encoder.
2. Clarke, then Park, to get $i_d, i_q$.
3. PI on each axis (gains $K_p = L\omega_c$, $K_i = R\omega_c$), plus **decoupling feed-forward**: add $-\omega_e L i_q$ to $v_d$ and $\omega_e(L i_d + \psi)$ to $v_q$, so the PIs only see the RL plant.
4. Inverse Park and inverse Clarke to get three phase voltages, then space-vector PWM.

Because the currents are now sinusoidal and exactly in quadrature with a sinusoidal back-EMF, the torque is constant, unlike six-step's 13–14 % ripple (lesson 10). FOC is why modern drones, e-bikes and robot joints are smooth and quiet.

:::figure widget=foc caption="Torque against electrical angle for six-step (amber) and sinusoidal FOC currents (lime). Make the back-EMF trapezoidal: six-step improves and FOC gets worse, because each suits a different motor."
:::end

## Worked example

$p = 4$, $\psi = 0.01$ Wb, $R = 0.5$ Ω, $L = 0.5$ mH. You want 0.3 N·m at 3000 rpm.

1. $i_q^* = 0.3/(1.5\cdot4\cdot0.01) = 5$ A.
2. $\omega_m = 314.2$ rad/s, so $\omega_e = 1257$ rad/s.
3. Back-EMF amplitude: $\omega_e\psi = 12.57$ V. Feed-forward on d: $-\omega_e L i_q = -3.14$ V.
4. Steady $v_q = R i_q + \omega_e\psi = 2.5 + 12.57 = 15.07$ V, so the phase voltage amplitude is $\sqrt{15.07^2 + 3.14^2} = 15.4$ V. A 24 V bus (max about 13.9 V phase amplitude with space-vector PWM) can't do it, and you'd need field weakening or a 36 V bus.

## Code it from scratch

:::code file=foc_pmsm.py
```python
import numpy as np

p, psi, R, L = 4, 0.01, 0.5, 0.5e-3
Ts = 50e-6; wc = 2 * np.pi * 800; Kp, Ki = L * wc, R * wc
K = 2 * np.pi / 3

def clarke(a, b, c): return (2 / 3) * (a - b / 2 - c / 2), (b - c) / np.sqrt(3)
def park(al, be, th): return al * np.cos(th) + be * np.sin(th), -al * np.sin(th) + be * np.cos(th)
def inv_park(d, q, th): return d * np.cos(th) - q * np.sin(th), d * np.sin(th) + q * np.cos(th)
def inv_clarke(al, be): return np.array([al, -al / 2 + np.sqrt(3) / 2 * be, -al / 2 - np.sqrt(3) / 2 * be])

def emf(th_e, w_e):            # phase back-EMFs from the magnet flux psi*cos(th - kK)
    return -w_e * psi * np.sin(th_e - np.arange(3) * K)

def run_foc(iq_ref=5.0, w_m=100.0, T=0.05, sub=20):
    """Three real phases simulated at Ts/sub; the controller runs every Ts."""
    w_e = p * w_m; dt = Ts / sub
    i = np.zeros(3); Id = Iq = 0.0; v = np.zeros(3); th = 0.0; torque = []
    for n in range(int(T / Ts)):
        idm, iqm = park(*clarke(*i), th)                       # measure
        ed, eq = 0.0 - idm, iq_ref - iqm
        Id += Ki * Ts * ed; Iq += Ki * Ts * eq
        vd = Kp * ed + Id - w_e * L * iqm                       # PI + decoupling feed-forward
        vq = Kp * eq + Iq + w_e * (L * idm + psi)
        v = inv_clarke(*inv_park(vd, vq, th + w_e * Ts / 2))    # angle at mid-period
        for _ in range(sub):                                    # plant: L di/dt = v - R i - e
            e = emf(th, w_e)
            i = i + dt * (v - R * i - e) / L
            th += w_e * dt
            torque.append((e @ i) / w_m)                       # T = power into the EMFs / w_m
    return np.array(torque)

def six_step_torque(I=5.0, w_m=100.0, N=3600):
    w_e = p * w_m; T = []
    for th in np.linspace(0, 2 * np.pi, N, endpoint=False):
        e = emf(th, w_e); i = np.zeros(3)
        i[np.argmax(e)] = I; i[np.argmin(e)] = -I                # ideal Hall commutation, 120-degree blocks
        T.append((e @ i) / w_m)
    return np.array(T)

if __name__ == "__main__":
    t_foc = run_foc()[-int(0.02 / Ts * 20):]                    # last 20 ms, after the step settles
    t6 = six_step_torque()
    rip = lambda t: np.ptp(t) / np.mean(t)
    print(f"FOC: mean {t_foc.mean():.4f} N*m (law {1.5*p*psi*5:.4f}), ripple {100*rip(t_foc):.2f} %")
    print(f"six-step: mean {t6.mean():.4f} N*m, ripple {100*rip(t6):.1f} %")
    assert abs(t_foc.mean() - 1.5 * p * psi * 5) < 0.01 * 1.5 * p * psi * 5
    assert rip(t6) > 0.10 and rip(t_foc) < rip(t6) / 5
    assert abs(rip(t6) - (1 - np.cos(np.pi / 6)) / (3 / np.pi)) < 0.005     # (1 - cos 30) / mean of cos over +-30 deg
```
:::end

## Exercises

:::exercise
Why does FOC set $i_d = 0$ for a surface-magnet motor below base speed?
:::solution
Torque depends only on $i_q$, so any $i_d$ adds copper loss ($\tfrac32 R(i_d^2 + i_q^2)$) and no torque. Maximum torque per amp is at $i_d = 0$. (For interior-magnet motors with $L_d \ne L_q$, a negative $i_d$ adds reluctance torque.)
:::end

:::exercise
At 3000 rpm the worked example needed 15.4 V on a bus that can give 13.9 V. How does negative $i_d$ help?
:::solution
$v_q$ contains $\omega_e(L i_d + \psi)$. A negative $i_d$ cancels part of the magnet flux: with $i_d = -8$ A, $L i_d = -0.004$ Wb, so $\omega_e(\psi + Li_d) = 1257\cdot0.006 = 7.5$ V instead of 12.6 V. That's **field weakening**: more speed for the same bus voltage, at the cost of extra current.
:::end

## Quiz

:::quiz
- type: num
  q: Torque in N·m for p = 4, ψ = 0.01 Wb, i_q = 5 A?
  answer: 0.3
  tol: 0.001
  unit: N·m
  py: "1.5*4*0.01*5"
  explain: (3/2)·p·ψ·i_q.
- type: num
  q: Electrical speed in rad/s at 3000 rpm with 4 pole pairs?
  answer: 1256.6
  tol: 0.001
  unit: rad/s
  py: "4*3000*2*math.pi/60"
  explain: ω_e = p·ω_m.
- type: num
  q: Back-EMF amplitude in V at that speed (ψ = 0.01 Wb)?
  answer: 12.566
  tol: 0.001
  unit: V
  py: "4*3000*2*math.pi/60*0.01"
  explain: ω_e·ψ.
- type: num
  q: Phase voltage amplitude in V needed (v_q = 15.07 V, v_d = −3.14 V)?
  answer: 15.39
  tol: 0.002
  unit: V
  py: "math.hypot(15.07,3.14)"
  explain: √(v_d² + v_q²).
- type: mc
  q: Which current produces torque in a surface PMSM?
  options:
    - i_d
    - i_q
    - i_α
    - the zero-sequence current
  answer: 1
  explain: T = (3/2)pψ i_q.
- type: mc
  q: Decoupling feed-forward cancels…
  options:
    - the PWM ripple
    - the ω_e·L cross terms and back-EMF, leaving each axis as an RL plant
    - the encoder error
    - the dead time
  answer: 1
  explain: Then lesson 7's PI design applies.
:::end

:::verify
import math
we = 4*3000*2*math.pi/60
assert abs(we*0.5e-3*5 - 3.14) < 0.01 and abs(0.5*5 + we*0.01 - 15.07) < 0.01
assert abs(24/math.sqrt(3) - 13.86) < 0.01
:::end
