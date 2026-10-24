---
id: p09-l15
minutes: 35
summary: A lead screw is an inclined plane wrapped around a shaft. You derive the torque, the efficiency and the self-locking condition from the force balance on a thread, compare a sliding Acme screw with a ball screw, and check the closed-form efficiency against a direct force-balance solution.
---

## The thread as a ramp

Unroll one turn of a thread with mean diameter $d_m$ and **lead** $l$ (axial travel per turn). It becomes a ramp of length $\pi d_m$ rising $l$, at the **lead angle**

$$\tan\lambda = \frac{l}{\pi d_m}.$$

Pushing an axial load $F$ up that ramp with a tangential force $P$, against friction $\mu$ with friction angle $\varphi = \arctan\mu$, the force balance gives

$$P = F\tan(\lambda + \varphi), \qquad T_{raise} = P\,\frac{d_m}{2} = \frac{F d_m}{2}\tan(\lambda + \varphi).$$

Without friction the torque would be $F l/(2\pi)$, by energy conservation, so the efficiency is

$$\eta = \frac{F\,l}{2\pi\,T_{raise}} = \frac{\tan\lambda}{\tan(\lambda + \varphi)}.$$

For an Acme or trapezoidal thread, the flank angle (half-angle $\alpha$, 14.5° for Acme, 15° for metric trapezoidal) tilts the normal force, so use $\mu' = \mu/\cos\alpha$.

## Back-driving

Can the load turn the screw on its own? Lowering needs torque $T_{lower} = \tfrac{F d_m}{2}\tan(\varphi - \lambda)$. If that's positive ($\varphi > \lambda$), you must turn the screw to lower the load: it's **self-locking**, which is convenient for a jack or a Z axis that must hold position with the power off. If $\lambda > \varphi$ the load back-drives the screw with efficiency

$$\eta' = \frac{\tan(\lambda - \varphi)}{\tan\lambda}.$$

A self-locking screw has $\eta < 50$ % (with $\varphi > \lambda$, $\tan\lambda/\tan(\lambda + \varphi) < \tan\lambda/\tan 2\lambda < 1/2$). You can't have both a high-efficiency drive and a power-off brake from friction alone.

**Ball screws** replace sliding with rolling balls, $\mu \approx 0.003$–$0.01$, giving 90 % or more efficiency in both directions. They always back-drive, so a vertical axis needs a brake.

:::figure widget=leadscrew caption="Efficiency against lead angle when driving (lime) and back-driving (amber). Back-driving starts where the lead angle passes the friction angle (dashed)."
:::end

## Worked example

Push 500 N with a 12 mm screw.

1. Trapezoidal, 2 mm lead, $\mu = 0.15$: $\lambda = \arctan(2/(\pi\cdot12)) = 3.04°$, $\varphi = 8.53°$, so $\eta = 0.0531/0.2048 = 25.9$ %. Torque $= 500\cdot0.002/(2\pi\cdot0.259) = 0.614$ N·m. It's self-locking.
2. Ball screw, 5 mm lead, $\mu = 0.005$: $\lambda = 7.55°$, $\varphi = 0.29°$, $\eta = 96.3$ %, torque 0.413 N·m. It back-drives with $\eta' = 96.1$ %.
3. Motor speed for 50 mm/s: 25 rev/s with the 2 mm screw, 10 rev/s with the 5 mm one.

## Code it from scratch

:::code file=lead_screw.py
```python
import numpy as np

def efficiency(lead, dm, mu):
    lam, phi = np.arctan(lead / (np.pi * dm)), np.arctan(mu)
    return np.tan(lam) / np.tan(lam + phi)

def back_efficiency(lead, dm, mu):
    lam, phi = np.arctan(lead / (np.pi * dm)), np.arctan(mu)
    return np.tan(lam - phi) / np.tan(lam) if lam > phi else 0.0

def push_force_balance(F, lam, mu):
    """Block on a ramp of angle lam, pushed horizontally by P, sliding up against friction.
    Unknowns [P, N]: sum of forces along the ramp and normal to it."""
    A = np.array([[np.cos(lam), -mu],               # P cos - F sin - mu N = 0
                  [-np.sin(lam), 1.0]])             # N - F cos - P sin = 0
    rhs = np.array([F * np.sin(lam), F * np.cos(lam)])
    P, N = np.linalg.solve(A, rhs)
    return P

def raise_torque(F, lead, dm, mu):
    lam = np.arctan(lead / (np.pi * dm))
    return push_force_balance(F, lam, mu) * dm / 2

if __name__ == "__main__":
    for lead, dm, mu in [(0.002, 0.012, 0.15), (0.005, 0.012, 0.005), (0.010, 0.020, 0.1), (0.04, 0.012, 0.2)]:
        T = raise_torque(500, lead, dm, mu)
        eta_energy = 500 * lead / (2 * np.pi * T)            # work out / work in over one turn
        print(f"lead {lead*1e3:.0f} mm, d {dm*1e3:.0f} mm, mu {mu}: T = {T:.3f} N*m, "
              f"eta {eta_energy:.4f} (formula {efficiency(lead, dm, mu):.4f}), back {back_efficiency(lead, dm, mu):.3f}")
        assert abs(eta_energy - efficiency(lead, dm, mu)) < 1e-12
    assert back_efficiency(0.002, 0.012, 0.15) == 0.0                     # self-locking
    assert efficiency(0.002, 0.012, 0.15) < 0.5
    assert back_efficiency(0.005, 0.012, 0.005) > 0.95                    # a ball screw back-drives
    # every self-locking geometry is below 50 % efficient
    lam = np.radians(np.linspace(0.1, 44, 400))
    for mu in (0.05, 0.1, 0.2):
        phi = np.arctan(mu); locking = lam < phi
        assert np.all(np.tan(lam[locking]) / np.tan(lam[locking] + phi) < 0.5)
```
:::end

## Exercises

:::exercise
A 3D printer's Z axis uses an 8 mm screw with 8 mm lead (μ = 0.2, brass nut). Does the bed fall when the motor is switched off?
:::solution
$\lambda = \arctan(8/(\pi\cdot8)) = 17.7°$ and $\varphi = 11.3°$. Since $\lambda > \varphi$ it back-drives, so the bed can drift down under its weight (often the stepper's detent torque holds it). A 2 mm-lead screw ($\lambda = 4.5°$) would self-lock.
:::end

:::exercise
Why does the Acme flank angle increase the effective friction?
:::solution
The thread flank is tilted by α, so the normal force needed to carry the axial load $F$ is $F/\cos\alpha$, larger than $F$. Friction is μ times that normal force, so the effective coefficient is $\mu/\cos\alpha$, about 3 % more for 14.5°.
:::end

## Quiz

:::quiz
- type: num
  q: Lead angle in degrees for 2 mm lead on a 12 mm screw?
  answer: 3.036
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan(2/(math.pi*12)))"
  explain: atan(l/(π d_m)).
- type: num
  q: Efficiency in % of that screw with μ = 0.15?
  answer: 25.9
  tol: 0.005
  unit: "%"
  py: "100*math.tan(math.atan(2/(math.pi*12)))/math.tan(math.atan(2/(math.pi*12))+math.atan(0.15))"
  explain: tan λ/tan(λ + φ).
- type: num
  q: Torque in N·m to push 500 N with it?
  answer: 0.614
  tol: 0.005
  unit: N·m
  py: "500*0.002/(2*math.pi*0.2593)"
  explain: F·l/(2π η).
- type: num
  q: Efficiency in % of a 5 mm lead ball screw (12 mm, μ = 0.005)?
  answer: 96.3
  tol: 0.002
  unit: "%"
  py: "100*math.tan(math.atan(5/(math.pi*12)))/math.tan(math.atan(5/(math.pi*12))+math.atan(0.005))"
  explain: Rolling friction is tiny.
- type: mc
  q: A screw is self-locking when…
  options:
    - λ > φ
    - φ > λ
    - its efficiency is above 50 %
    - it's a ball screw
  answer: 1
  explain: Friction angle exceeds lead angle.
- type: mc
  q: A self-locking screw's efficiency is always…
  options:
    - above 90 %
    - below 50 %
    - exactly 50 %
    - independent of friction
  answer: 1
  explain: A power-off brake from friction costs efficiency.
:::end

:::verify
import math
lam = math.atan(5/(math.pi*12)); phi = math.atan(0.005)
assert abs(math.tan(lam-phi)/math.tan(lam) - 0.961) < 0.001
assert abs(500*0.005/(2*math.pi*math.tan(lam)/math.tan(lam+phi)) - 0.413) < 0.001
assert abs(math.degrees(math.atan(8/(math.pi*8))) - 17.7) < 0.05
:::end
