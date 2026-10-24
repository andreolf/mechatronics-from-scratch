---
id: p09-l14
minutes: 35
summary: A solenoid pulls an iron plunger into a coil, and its force grows as the gap closes. You derive the force from the change in inductance, see why holding needs far less current than pulling in, simulate a peak-and-hold driver that cuts the holding power by more than half, and learn to tame the turn-off spike.
---

## Force from inductance

A coil's magnetic co-energy is $\tfrac12 L(x) i^2$, where the inductance depends on the plunger position $x$. The force is its derivative:

$$F = \frac12\,i^2\,\frac{dL}{dx}.$$

Most of the magnetic path's reluctance is in the air gap $g$, so $L$ grows roughly as $1/g$. With $L(x) = L_0 + k/(g_0 - x + g_r)$, where $g_r$ is the residual gap of the closed plunger,

$$F = \frac{k\,i^2}{2\,(g_0 - x + g_r)^2}.$$

Two consequences:

- Force goes as $i^2$, so it doesn't depend on the current's direction. That's why AC relays work.
- Force rises steeply as the gap closes. The plunger slams in, and once closed it needs much less current to stay there.

## Pull-in versus hold

The current that pulls the plunger in from the open gap is much more than the current needed to hold it closed. A **peak-and-hold** driver applies full voltage briefly to pull in fast, then regulates a low holding current, usually by chopping with PWM (the inductance smooths it, as in lesson 6). The holding power falls as $(I_{hold}/I_{peak})^2$.

The pull-in is also delayed: the current rises with time constant $L/R$, and when the plunger moves, $L$ increases, which produces a back-EMF that makes the current *dip*. That dip is a cheap way to detect that the plunger really moved.

## Switching off: the spike

Interrupting an inductor's current produces $v = L\,di/dt$, hundreds of volts, which destroys transistors. Always give the current a path:

- a **flyback diode** across the coil: safe and simple, but the current decays slowly through it ($L/R$), so the release is slow;
- a diode plus a **Zener** (or a TVS): the coil voltage clamps at $V_Z$, the current decays in $L I/V_Z$, so the release is fast.

Relays are solenoids with contacts: the same rules apply.

:::figure widget=solenoid caption="Coil current and plunger travel. With peak-and-hold, full voltage pulls the plunger in, then the driver chops at the hold current. Lower the hold current until the plunger drops out."
:::end

## Worked example

A 24 V solenoid with $R = 12$ Ω, open gap 4 mm, residual gap 1 mm, $k = 10^{-4}$ H·m, a return spring of 2 N preload plus 300 N/m.

1. Full current: $24/12 = 2$ A, so the coil dissipates 48 W continuously.
2. Open-gap force at 2 A: $10^{-4}\cdot4/(2\cdot0.005^2) = 8$ N, above the 2 N preload, so it pulls in.
3. Closed, the spring pushes $2 + 300\cdot0.004 = 3.2$ N. The magnet gives $10^{-4}i^2/(2\cdot0.001^2) = 50\,i^2$ N, so it holds with $i > 0.253$ A.
4. Hold at 0.6 A (safety margin of 2.4×): $0.36\cdot12 = 4.3$ W, a 91 % cut.

## Code it from scratch

:::code file=solenoid.py
```python
import numpy as np

V, R, m, k_spring, F0, g0, gr, L0, k = 24.0, 12.0, 0.02, 300.0, 2.0, 4e-3, 1e-3, 0.02, 1e-4

def L(x): return L0 + k / (g0 - x + gr)
def force(i, x): return k * i * i / (2 * (g0 - x + gr) ** 2)

def simulate(hold=True, I_hold=0.6, t_peak=0.03, T=0.12, dt=1e-5):
    x = v = psi = i = 0.0; P_hold = []; closed_at = None; dip = False; i_prev = 0.0
    for n in range(int(T / dt)):
        t = n * dt
        u = V if (not hold or t < t_peak or i < I_hold) else 0.0         # bang-bang chopper after t_peak
        psi += dt * (u - R * i); i = max(psi / L(x), 0.0)               # flux linkage carries the motion back-EMF
        a = (force(i, x) - (F0 + k_spring * x)) / m
        if (x <= 0 and a < 0) or (x >= g0 and a > 0): a, v = 0.0, 0.0
        v += a * dt; x = min(max(x + v * dt, 0.0), g0)
        if closed_at is None and x >= g0: closed_at = t
        if 0 < x < g0 and i < i_prev: dip = True
        i_prev = i
        if t > 0.06: P_hold.append(i * i * R)
    return dict(closed=x >= g0, closed_at=closed_at, P=np.mean(P_hold), dip=dip)

if __name__ == "__main__":
    cont = simulate(hold=False); ph = simulate(hold=True)
    print(f"continuous: {cont['P']:.1f} W, peak-and-hold: {ph['P']:.1f} W, pull-in after {1e3*ph['closed_at']:.1f} ms")
    assert cont["closed"] and ph["closed"] and ph["P"] < 0.5 * cont["P"]
    assert ph["dip"]                                         # the moving plunger makes the current dip
    i_min = np.sqrt(2 * (F0 + k_spring * g0) * gr ** 2 / k)
    print(f"minimum hold current {i_min:.3f} A")
    assert abs(i_min - 0.253) < 1e-3
    assert simulate(I_hold=1.3 * i_min)["closed"] and not simulate(I_hold=0.7 * i_min)["closed"]
    assert force(2.0, 0.0) > F0                               # strong enough to pull in from open
```
:::end

## Exercises

:::exercise
A relay coil with 0.5 H and 50 mA is switched off. How long does the current take to decay with a plain diode (coil R = 240 Ω) and with a 24 V Zener in series with it?
:::solution
Diode only: it decays with $\tau = L/R = 2$ ms, so about 6 ms to near zero. With the Zener the coil voltage is about $V_Z + I R$, mostly $V_Z$: $t \approx L I/V_Z = 0.5\cdot0.05/24 \approx 1$ ms (less, since $IR = 12$ V helps). The faster decay opens the contacts sooner and reduces arcing.
:::end

:::exercise
Why does the force depend on $i^2$ rather than $i$?
:::solution
The plunger is soft iron, not a magnet. The coil magnetises it in whichever direction the current flows, and it's always attracted. Reversing the current reverses both the field and the induced magnetisation, so the force doesn't change sign. Compare a voice coil (lesson 1), where a permanent magnet gives force linear in $i$.
:::end

## Quiz

:::quiz
- type: num
  q: Continuous coil power in W at 24 V, 12 Ω?
  answer: 48
  tol: 0.001
  unit: W
  py: "24**2/12"
  explain: V²/R.
- type: num
  q: Minimum hold current in A for a 3.2 N spring force, k = 1e-4 H·m, residual gap 1 mm?
  answer: 0.253
  tol: 0.003
  unit: A
  py: "math.sqrt(2*3.2*1e-3**2/1e-4)"
  explain: Solve k i²/(2 g_r²) = F.
- type: num
  q: Holding power in W at 0.6 A?
  answer: 4.32
  tol: 0.001
  unit: W
  py: "0.6**2*12"
  explain: I²R.
- type: num
  q: Power reduction in % of 0.6 A hold versus 2 A continuous?
  answer: 91
  tol: 0.002
  unit: "%"
  py: "100*(1-(0.6/2)**2)"
  explain: 1 − (I_hold/I_peak)².
- type: num
  q: Open-gap force in N at 2 A (gap + residual = 5 mm)?
  answer: 8
  tol: 0.001
  unit: N
  py: "1e-4*4/(2*0.005**2)"
  explain: k i²/(2g²).
- type: mc
  q: A plain flyback diode across a relay coil…
  options:
    - makes it release faster
    - protects the switch but slows the release
    - is only needed for AC relays
    - reduces pull-in time
  answer: 1
  explain: The current decays slowly through the diode.
:::end

:::verify
assert abs(2 + 300*0.004 - 3.2) < 1e-12
assert abs(0.5*0.05/24 - 1.04e-3) < 0.01e-3
:::end
