---
id: p19-l15
minutes: 40
summary: A switching converter is a radio transmitter unless its layout keeps fast currents in small loops and fast voltages on small copper. You compute magnetic coupling from a hot loop into a nearby sensor trace with Biot-Savart, show how moving one capacitor cuts it more than thirty times, and see how slower edges shrink the high-frequency spectrum.
---

## Two coupling paths

Electromagnetic compatibility (EMC) means a device neither disturbs others nor is disturbed. In a switching converter, two quantities do most of the damage:

- **di/dt in a loop.** The current that switches on and off flows around the **hot loop** (input capacitor, high-side switch, low-side switch). A changing current in a loop of area $A$ makes a magnetic field that induces $v = M\, \mathrm{d}i/\mathrm{d}t$ in any nearby loop, with mutual inductance $M$ roughly proportional to the loop areas.
- **dV/dt on a node.** The switch node swings the full input voltage in nanoseconds. Any stray capacitance $C$ to a neighbour injects $i = C\, \mathrm{d}V/\mathrm{d}t$.

## Layout is the fix

Place the input capacitor right against the switches so the hot loop is tiny, return currents on a solid ground plane directly beneath their traces, keep the switch node copper small, and route sensitive traces away. Slowing the edges (gate resistors, Lesson 07) also helps, at the cost of switching loss (Lesson 06). A trapezoidal waveform with rise time $t_r$ has a spectrum envelope that falls at 20 dB per decade above $1/(\pi T_{pulse})$ and 40 dB per decade above $1/(\pi t_r)$.

:::figure widget=loopcoupling caption="A hot loop beside a victim trace. Drag the capacitor position, change the edge time and toggle the ground plane; the readout estimates mutual inductance and the induced spike."
:::end

## Worked example

Illustrative layout, 2 A switched in 10 ns, victim loop 20 × 10 mm beside the converter:

1. Check: 10 mm from a long wire the code gives 20.000 µT per A, matching $\mu_0/(2\pi r)$.
2. Moving the input capacitor next to the switches shrinks the hot loop from 400 to 24 mm².
3. Mutual inductance falls from 1.056 nH to 0.0330 nH, and the induced spike from 211.2 mV to 6.60 mV: 32 times less coupling.
4. A 12 V edge in 2 ns (6.0 V/ns) through 0.5 pF injects 3.00 mA; in 10 ns (1.2 V/ns), 0.60 mA. The spectrum corners are 159 MHz and 32 MHz.
5. Between 200 MHz and 1 GHz the 10 ns edge carries 16.5 dB less power than the 2 ns edge.

## Code it from scratch

:::code file=coupling.py
```python
import numpy as np

MU0 = 4e-7 * np.pi

def bz_segment(x0, y0, x1, y1, px, py, n=400):
    """z field at points (px, py) from 1 A along a straight segment in the same plane (Biot-Savart, midpoint rule)."""
    s = (np.arange(n) + 0.5) / n; xs = x0 + (x1 - x0) * s; ys = y0 + (y1 - y0) * s
    dlx, dly = (x1 - x0) / n, (y1 - y0) / n
    rx = px[..., None] - xs; ry = py[..., None] - ys; r3 = (rx**2 + ry**2) ** 1.5
    return MU0 / (4 * np.pi) * np.sum((dlx * ry - dly * rx) / r3, axis=-1)

def bz_from_loop(corners, px, py):
    pts = list(corners) + [corners[0]]
    return sum(bz_segment(*p, *q, px, py) for p, q in zip(pts[:-1], pts[1:]))

def mutual(hot, victim, n=60):
    """mutual inductance: flux through the victim rectangle (x0, y0, x1, y1) from 1 A in the hot loop."""
    x0, y0, x1, y1 = victim; xs = np.linspace(x0, x1, n + 1); ys = np.linspace(y0, y1, n + 1)
    xc, yc = (xs[:-1] + xs[1:]) / 2, (ys[:-1] + ys[1:]) / 2; X, Y = np.meshgrid(xc, yc)
    return np.sum(bz_from_loop(hot, X, Y)) * (xs[1] - xs[0]) * (ys[1] - ys[0])

def rect(x0, y0, w, h): return [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]

def test_biot_savart():
    b = bz_segment(-10.0, 0, 10.0, 0, np.array([0.0]), np.array([0.01]), n=200000)
    print(f"field 10 mm from a long wire: {abs(b[0]) * 1e6:.3f} uT per A (infinite wire {MU0 / (2 * np.pi * 0.01) * 1e6:.3f})")
    assert abs(abs(b[0]) - MU0 / (2 * np.pi * 0.01)) / (MU0 / (2 * np.pi * 0.01)) < 0.01

def test_layout_change():
    mm = 1e-3; victim = (25 * mm, -5 * mm, 45 * mm, 5 * mm)                     # a 20 x 10 mm sensor trace loop nearby
    before = rect(0, -10 * mm, 20 * mm, 20 * mm)                                 # input capacitor far from the switches
    after = rect(5 * mm, -2 * mm, 6 * mm, 4 * mm)                               # capacitor right next to the switches
    di_dt = 2.0 / 10e-9                                                          # 2 A switched in 10 ns
    m0, m1 = mutual(before, victim), mutual(after, victim)
    print(f"hot loop area {400:.0f} -> {24:.0f} mm^2")
    print(f"mutual inductance {abs(m0) * 1e9:.3f} -> {abs(m1) * 1e9:.4f} nH; induced spike {abs(m0) * di_dt * 1000:.1f} -> {abs(m1) * di_dt * 1000:.2f} mV")
    print(f"coupling reduced {abs(m0 / m1):.0f} times")
    assert abs(m1) < abs(m0) / 10

def test_edge_rate():
    vin, c = 12.0, 0.5e-12                                                       # 0.5 pF stray capacitance to the victim
    for tr in (2e-9, 10e-9):
        print(f"rise time {tr * 1e9:.0f} ns: dV/dt {vin / tr / 1e9:.1f} V/ns, injected current {c * vin / tr * 1000:.2f} mA, spectrum corner {1 / (np.pi * tr) / 1e6:.0f} MHz")
    fs, n = 10e9, 2**16; t = np.arange(n) / fs; f0 = 1e6
    def spec(tr):
        """1 MHz, 50 % duty trapezoid with equal rise and fall times, and its spectrum."""
        ph = (t * f0) % 1 / f0
        v = vin * np.clip(np.minimum(ph / tr, (0.5 / f0 - ph) / tr + 1), 0, 1)
        a = np.abs(np.fft.rfft(v * np.hanning(n))) / n; f = np.fft.rfftfreq(n, 1 / fs); return f, a
    f, a2 = spec(2e-9); _, a10 = spec(10e-9); band = (f > 200e6) & (f < 1e9)
    gain = 10 * np.log10(np.sum(a2[band]**2) / np.sum(a10[band]**2))
    print(f"200 MHz-1 GHz power: the 10 ns edge is {gain:.1f} dB lower than the 2 ns edge (envelope ratio {20 * np.log10(5):.1f} dB)")
    assert gain > 10

test_biot_savart()
test_layout_change()
test_edge_rate()
print("PASS")
```
:::end

## In practice

Layout happens in a PCB tool such as KiCad, where you place the input capacitor first, keep the hot loop on one layer over an unbroken ground plane, and check the switch node's copper area. Field solvers (openEMS, commercial 3D tools) refine estimates like these, and pre-compliance scans with a near-field probe and spectrum analyser find problems before a formal test against limits such as CISPR 32 or CISPR 25.

## Exercises

:::exercise
A 3 nH stray inductance carries a current that changes by 4 A in 8 ns. What spike appears across it?
:::solution
$v = L\, \mathrm{d}i/\mathrm{d}t = 3 \times 10^{-9} \times 4 / 8 \times 10^{-9} = 1.5$ V.
:::end

:::exercise
Why does a ground plane under a trace reduce its radiated field?
:::solution
The return current flows in the plane directly under the trace, so the loop area is the trace length times the small height above the plane. A smaller loop has a smaller magnetic moment and smaller mutual inductance to everything nearby.
:::end

## Quiz

:::quiz
- type: num
  q: Induced voltage for M = 0.5 nH and di/dt = 1 A/ns (V)?
  answer: 0.5
  tol: 0.002
  py: "0.5e-9*1e9"
  explain: v = M di/dt.
- type: num
  q: Current injected through 1 pF by 24 V in 4 ns (mA)?
  answer: 6
  tol: 0.002
  py: "1e-12*24/4e-9*1000"
  explain: i = C dV/dt.
- type: num
  q: Spectrum corner frequency for a 5 ns rise time (MHz)?
  answer: 63.7
  tol: 0.003
  py: "1/(math.pi*5e-9)/1e6"
  explain: 1/(π tr).
- type: num
  q: Field 5 mm from a long wire carrying 1 A (µT)?
  answer: 40
  tol: 0.002
  py: "4e-7*math.pi/(2*math.pi*0.005)*1e6"
  explain: μ0 I / (2π r).
- type: mc
  q: What is the first layout step for a buck converter?
  options: ["Place the input capacitor tight against the switches", "Route the feedback trace first", "Make the switch node copper large", "Put the inductor far away"]
  answer: 0
  explain: It minimises the hot loop.
- type: mc
  q: Slower switching edges...
  options: ["reduce high-frequency emissions but increase switching loss", "reduce both emissions and loss", "increase emissions", "have no effect on EMC"]
  answer: 0
  explain: The classic trade-off.
:::end
