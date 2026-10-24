---
id: p01-l02
minutes: 25
summary: Every number in mechatronics carries a unit, and most bench bugs are unit bugs. You express torque, power and energy in SI base units, use dimensional analysis to predict a pendulum's period before solving anything, and build a `Quantity` class that refuses to add metres to seconds.
---

## Seven base units, and the four you'll use most

The SI system builds every unit from seven base units. Mechatronics mostly needs four of them: the kilogram (kg), the metre (m), the second (s) and the ampere (A). Everything else is a product of powers of these:

| Quantity | Unit | In base units |
|---|---|---|
| Force | newton, N | kg·m·s⁻² |
| Torque | newton metre, N·m | kg·m²·s⁻² |
| Energy | joule, J | kg·m²·s⁻² |
| Power | watt, W | kg·m²·s⁻³ |
| Voltage | volt, V | kg·m²·s⁻³·A⁻¹ |
| Resistance | ohm, Ω | kg·m²·s⁻³·A⁻² |

Torque and energy share the same base units. They differ in meaning: torque is a moment about an axis, energy is torque times an angle. The radian is dimensionless (arc length over radius), which is why the units still match.

## Mechanical power is torque times angular speed

Work done by a torque $\tau$ turning a shaft through a small angle $d\theta$ is $dW = \tau\, d\theta$. Divide by $dt$:

$$P = \frac{dW}{dt} = \tau \frac{d\theta}{dt} = \tau\,\omega .$$

In units: $\text{N·m} \times \text{rad/s} = \text{kg·m}^2\text{·s}^{-2} \times \text{s}^{-1} = \text{kg·m}^2\text{·s}^{-3} = \text{W}$.

Datasheets give speed in revolutions per minute, so convert first: $\omega = 2\pi n / 60$ with $n$ in rpm. Forgetting this factor of $2\pi/60 \approx 0.105$ is the single most common power error in motor sizing.

## Dimensional analysis predicts answers

If a result can only depend on a few quantities, the units alone often fix its form. Take a pendulum. Its period $T$ could depend on the length $l$ [m], gravity $g$ [m·s⁻²] and the bob mass $m$ [kg]. Try $T = C\, l^a g^b m^c$ and match exponents:

$$\text{s}^1 = \text{m}^{a}\,(\text{m·s}^{-2})^{b}\,\text{kg}^{c} \;\Rightarrow\; c = 0,\; a + b = 0,\; -2b = 1 .$$

So $b = -\tfrac12$, $a = \tfrac12$, and $T = C\sqrt{l/g}$. Mass drops out without solving any differential equation. The full solution in Phase 03 gives $C = 2\pi$ for small swings. This is the Buckingham π idea: count the base dimensions, form dimensionless groups, and the physics can only be a function of those groups.

## Worked example: power at the shaft

A gear motor delivers $\tau = 0.5$ N·m at $n = 3000$ rpm.

1. $\omega = 2\pi \times 3000 / 60 = 314.16$ rad/s.
2. $P = 0.5 \times 314.16 = 157.08$ W.
3. If the motor draws 7.0 A from 24 V, the electrical input is 168 W and the efficiency is $157.08 / 168 = 93.5\,\%$.

Had you used 3000 directly as rad/s, you would have predicted 1500 W, ten times the real number.

## Code it from scratch

A `Quantity` stores a value and a tuple of exponents for (kg, m, s, A). Multiplication adds exponents; addition demands they match.

:::code file=units.py
```python
import math

DIMS = ("kg", "m", "s", "A")

class Quantity:
    def __init__(self, value, dims=(0, 0, 0, 0)):
        self.value = float(value)
        self.dims = tuple(dims)

    def __add__(self, other):
        if self.dims != other.dims:
            raise TypeError(f"cannot add {self.unit()} and {other.unit()}")
        return Quantity(self.value + other.value, self.dims)

    __sub__ = lambda self, o: self + Quantity(-o.value, o.dims)

    def __mul__(self, other):
        if not isinstance(other, Quantity):
            return Quantity(self.value * other, self.dims)
        return Quantity(self.value * other.value,
                        [a + b for a, b in zip(self.dims, other.dims)])

    __rmul__ = __mul__

    def __truediv__(self, other):
        if not isinstance(other, Quantity):
            return Quantity(self.value / other, self.dims)
        return Quantity(self.value / other.value,
                        [a - b for a, b in zip(self.dims, other.dims)])

    def unit(self):
        parts = [f"{d}^{e}" if e != 1 else d for d, e in zip(DIMS, self.dims) if e]
        return "·".join(parts) or "1"

    def __repr__(self):
        return f"{self.value:g} {self.unit()}"

kg, m, s, A = (Quantity(1, d) for d in [(1,0,0,0), (0,1,0,0), (0,0,1,0), (0,0,0,1)])
N = kg * m / (s * s)
W = N * m / s

if __name__ == "__main__":
    torque = 0.5 * N * m
    omega = Quantity(2 * math.pi * 3000 / 60, (0, 0, -1, 0))   # rad/s
    P = torque * omega
    assert P.dims == W.dims and abs(P.value - 157.0796) < 1e-3
    print("shaft power:", P)
    try:
        (2 * m) + (3 * s)
    except TypeError as e:
        print("refused:", e)
    else:
        raise SystemExit("adding metres to seconds must fail")
```
:::end

Real projects use a library such as `pint`, but writing the class once shows you exactly what those libraries check.

## Exercises

:::exercise
A motor datasheet lists a torque constant $k_t = 0.06$ N·m/A and a back-EMF constant $k_e = 0.06$ V·s/rad. Show that these two units are the same.
:::solution
1. N·m/A = kg·m²·s⁻²·A⁻¹.
2. V·s/rad = (kg·m²·s⁻³·A⁻¹)·s = kg·m²·s⁻²·A⁻¹ (the radian is dimensionless).
3. They match. In SI units an ideal DC motor has $k_t = k_e$, which follows from energy conservation: $\tau\omega = k_t i\,\omega$ must equal $e\, i = k_e \omega\, i$.
:::end

:::exercise
A 12 V battery is rated 2.5 Ah. How much energy does it store, in joules?
:::solution
1. Charge: $2.5\text{ A} \times 3600\text{ s} = 9000$ C.
2. Energy: $E = V Q = 12 \times 9000 = 108\,000$ J, or 30 Wh.
:::end

## Quiz

:::quiz
- type: num
  q: A motor delivers 2 N·m at 1500 rpm. What is its mechanical power in watts?
  answer: 314.159
  tol: 0.005
  unit: W
  py: "2 * 2*math.pi*1500/60"
  explain: $\omega = 2\pi \cdot 1500/60 = 157.08$ rad/s, so $P = 2 \times 157.08 = 314.16$ W.
- type: mc
  q: What is the volt in SI base units?
  options:
    - kg·m²·s⁻²
    - kg·m²·s⁻³·A⁻¹
    - kg·m·s⁻²·A
    - A·s
  answer: 1
  explain: A volt is a watt per ampere, and a watt is kg·m²·s⁻³.
- type: num
  q: Using $T = 2\pi\sqrt{l/g}$ with $g = 9.81$ m/s², what is the period of a 1 m pendulum in seconds?
  answer: 2.006
  tol: 0.005
  unit: s
  py: "2*math.pi*math.sqrt(1/9.81)"
  explain: $2\pi\sqrt{1/9.81} = 2.006$ s.
- type: mc
  q: Dimensional analysis shows a pendulum's period does not depend on the bob's mass. Why?
  options:
    - Heavier bobs fall faster, which cancels out
    - Mass is the only quantity containing kg, so its exponent must be zero for T to have units of seconds
    - Mass was ignored to keep the algebra short
    - Air resistance removes the mass dependence
  answer: 1
  explain: Nothing else in the list has kilograms, so no power of mass except zero can appear in a quantity measured in seconds.
- type: num
  q: How much energy, in joules, does a 12 V, 2.5 Ah battery store?
  answer: 108000
  tol: 0.001
  unit: J
  py: "12*2.5*3600"
  explain: $12 \times 2.5 \times 3600 = 108\,000$ J.
:::end

:::verify
import math
w = 2*math.pi*3000/60
assert abs(w - 314.16) < 0.005
assert abs(0.5*w - 157.08) < 0.005
assert abs(0.5*w/168 - 0.935) < 0.0005
assert abs(0.5*3000 - 1500) < 1e-9
:::end
