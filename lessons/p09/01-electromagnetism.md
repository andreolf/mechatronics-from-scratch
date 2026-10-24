---
id: p09-l01
minutes: 35
summary: Every electric actuator rests on two laws. A current in a magnetic field feels a force, and a conductor moving through a field generates a voltage. You derive both for a coil in a magnet gap, show that the force constant and the back-EMF constant are the same number, and compute the force on a voice coil that partly leaves its gap.
---

## Force on a current: Lorentz

A straight conductor of length $L$ carrying current $I$ across a uniform field $\mathbf B$ feels

$$\mathbf F = I\,\mathbf L \times \mathbf B,$$

so when $\mathbf L \perp \mathbf B$ the magnitude is

$$|F| = B I L.$$

The direction follows the right-hand rule: fingers along the current, bend them toward $\mathbf B$, and the thumb gives the force. A coil of $N$ turns, each with active length $L$ in the field, gives

$$F = N B L\, I = k_f\, I,$$

so force is **linear in current**. That linearity is why a current loop (lesson 7) is really a torque or force loop.

In a **voice-coil actuator** (loudspeaker, hard-disk head, a lens focus motor), a radial field crosses a cylindrical gap and the coil sits in it. Each turn has active length $2\pi r$, and every element sees $\mathbf B$ perpendicular to it, so the forces add axially.

## Voltage from motion: Faraday

When the coil moves at speed $v$, each turn sweeps flux at the rate $B L v$, and Faraday's law $e = -\,d\Phi/dt$ gives a **back-EMF**

$$e = N B L\, v = k_e\, v.$$

The two constants are the same number, $k_f = k_e = NBL$, in N/A and V·s/m (which are the same unit). That's not a coincidence but energy conservation: the electrical power absorbed by the back-EMF, $e I$, equals the mechanical power delivered, $F v$:

$$e I = (NBLv)\,I = (NBLI)\,v = F v.$$

For rotary motors the same argument gives torque $T = k_t I$ and back-EMF $e = k_e \omega$, with $k_t = k_e$ in SI units (lesson 2).

## When the coil leaves the gap

The field is only strong inside the gap. Outside it falls off over a fringe of a few millimetres. If the coil is longer than the gap ("overhung"), the number of turns in the field stays constant over a stroke and the force constant stays flat; if it moves past that, $k_f$ drops. Datasheets give a force-versus-stroke curve for exactly this reason.

:::figure widget=lorentz caption="Three conductors of a coil in the gap between two magnet poles. The force (lime) is proportional to current, field and turns, and reverses with the current."
:::end

## Worked example

A voice coil has $N = 50$ turns of radius 4.77 mm (so each turn is $2\pi r = 30$ mm long) in a 0.8 T radial gap.

1. Force constant: $k_f = 50 \times 0.8 \times 0.030 = 1.2$ N/A.
2. At 2 A: $F = 2.4$ N.
3. Moving at 0.5 m/s, the back-EMF is $1.2 \times 0.5 = 0.6$ V.
4. Power check: $eI = 0.6 \times 2 = 1.2$ W, and $Fv = 2.4 \times 0.5 = 1.2$ W.
5. With 4 Ω of coil resistance, holding 2.4 N still costs $I^2R = 16$ W of heat. Force from a coil is cheap to make and expensive to hold.

## Code it from scratch

:::code file=voice_coil.py
```python
import numpy as np

def gap_field(z, B0=0.8, h=0.006, fringe=0.0015):
    """Radial flux density at axial position z: flat in the gap of height h, Gaussian fringe outside."""
    over = np.maximum(np.abs(z) - h / 2, 0)
    return B0 * np.exp(-(over / fringe) ** 2)

def coil_force(I, z0, N=50, r=0.030 / (2 * np.pi), coil_len=0.004, segs=360):
    """Sum I dl x B over every turn and segment. Radial B, tangential dl -> axial force."""
    zs = z0 + np.linspace(-coil_len / 2, coil_len / 2, N)      # turn positions
    phi = np.linspace(0, 2 * np.pi, segs, endpoint=False)
    dphi = 2 * np.pi / segs
    F = np.zeros(3)
    for z in zs:
        B = gap_field(z)
        dl = np.stack([-np.sin(phi), np.cos(phi), np.zeros_like(phi)], 1) * r * dphi
        Bv = np.stack([np.cos(phi), np.sin(phi), np.zeros_like(phi)], 1) * B
        F += I * np.cross(dl, Bv).sum(0)
    return F

if __name__ == "__main__":
    F = coil_force(2.0, 0.0)
    print("force at 2 A, centred:", np.round(F, 6))
    assert abs(F[0]) < 1e-9 and abs(F[1]) < 1e-9          # radial parts cancel
    assert abs(abs(F[2]) - 50 * 0.8 * 2.0 * 0.030) < 1e-9    # N B I L = 2.4 N
    # linear in current
    Is = np.linspace(-5, 5, 11)
    Fz = np.array([coil_force(I, 0.0)[2] for I in Is])
    slope, icpt = np.polyfit(Is, Fz, 1)
    assert np.max(np.abs(Fz - slope * Is)) < 1e-9 and abs(icpt) < 1e-9
    # power balance: back-EMF e = k v, so e*I == F*v
    k = abs(slope); v = 0.5
    assert abs(k * v * 2.0 - abs(F[2]) * v) < 1e-12
    # force falls once turns leave the 6 mm gap
    off = abs(coil_force(2.0, 0.004)[2])
    print(f"k_f = {k:.3f} N/A; force with the coil 4 mm off centre: {off:.2f} N")
    assert off < 0.8 * abs(F[2])
```
:::end

## Exercises

:::exercise
A rotary motor's datasheet gives a torque constant of 0.05 N·m/A. What back-EMF does it produce at 3000 rpm?
:::solution
$k_e = k_t = 0.05$ V·s/rad. At 3000 rpm, $\omega = 3000 \cdot 2\pi/60 = 314.2$ rad/s, so $e = 15.7$ V.
:::end

:::exercise
Why does a voice-coil actuator get hot when it holds a load against gravity but not when it moves freely?
:::solution
Holding force needs a steady current, and with no motion all the electrical power $I^2R$ becomes heat (the back-EMF is zero, so no power goes to mechanical work). Moving freely needs little current. This is why gravity-loaded voice coils use springs or counterweights.
:::end

## Quiz

:::quiz
- type: num
  q: Force constant in N/A for N = 50, B = 0.8 T, L = 0.03 m per turn?
  answer: 1.2
  tol: 0.001
  unit: N/A
  py: "50*0.8*0.03"
  explain: k = N·B·L.
- type: num
  q: Force in N on that coil at 2 A?
  answer: 2.4
  tol: 0.001
  unit: N
  py: "1.2*2"
  explain: F = k·I.
- type: num
  q: Back-EMF in V at 0.5 m/s?
  answer: 0.6
  tol: 0.001
  unit: V
  py: "1.2*0.5"
  explain: e = k·v.
- type: num
  q: Back-EMF in V of a 0.05 N·m/A motor at 3000 rpm?
  answer: 15.71
  tol: 0.002
  unit: V
  py: "0.05*3000*2*math.pi/60"
  explain: k_e = k_t in SI units.
- type: mc
  q: Why is k_f equal to k_e?
  options:
    - by coincidence of units
    - energy conservation, e·I = F·v
    - only for voice coils
    - because B is uniform
  answer: 1
  explain: Electrical power in equals mechanical power out.
- type: mc
  q: Reversing the current in the coil…
  options:
    - leaves the force unchanged
    - reverses the force
    - doubles the force
    - removes the back-EMF
  answer: 1
  explain: F = I L × B is linear in I.
:::end

:::verify
import math
assert abs(2*math.pi*0.030/(2*math.pi) - 0.030) < 1e-12
assert abs(0.030/(2*math.pi) - 0.00477) < 1e-5
:::end
