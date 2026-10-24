---
id: p05-l11
minutes: 35
summary: Diodes turn AC into DC and protect switches from inductive spikes. You build a bridge rectifier with a smoothing capacitor, derive the ripple formula I/(2fC), size the capacitor and diodes for a 12 V supply, and choose flyback and TVS protection for motors and relays.
---

## Rectifying

- A **half-wave rectifier** is one diode: it passes the positive half-cycles and blocks the negative ones.
- A **full-wave bridge** uses four diodes so both half-cycles push current the same way through the load. Two diodes conduct at a time, so the output peak is $V_{peak} - 2V_d$.

On its own, the output is a bumpy series of half-sines. A **smoothing capacitor** across the load charges to near the peak, then supplies the load while the input falls, until the next peak tops it up.

## The ripple formula

Between peaks the capacitor supplies the load current $I$ alone, so its voltage falls at $dv/dt = -I/C$. For a full-wave rectifier the peaks come every $1/(2f)$ seconds. If the capacitor discharges for that whole interval (pessimistic, since recharging starts before the next peak):

$$\Delta V \approx \frac{I}{2fC} \quad\text{(full wave)}, \qquad \Delta V \approx \frac{I}{fC} \quad\text{(half wave)}.$$

Two more things to check:

- **Diode peak inverse voltage (PIV)**: each bridge diode must block about $V_{peak}$. Use parts rated at least 2× that.
- **Diode peak current**: the capacitor recharges in short bursts near each peak, so the diodes carry pulses several times the average load current.

:::figure widget=rectifier caption="A full-wave bridge from 12 V rms at 50 Hz, smoothed by a capacitor. The estimate I/(2fC) is a little pessimistic compared with the simulation."
:::end

## Protecting against inductive kicks

Lesson 6 showed that switching off an inductor produces a huge voltage. In practice:

- **Relays and solenoids** driven by one transistor: a diode across the coil. Add a Zener in series for faster release.
- **Brushed motors in an H-bridge**: the MOSFETs' body diodes (or added Schottky diodes) catch the current. The energy flows back to the supply, so the supply needs enough capacitance, or a clamp, to absorb it without its voltage rising dangerously.
- **Cables and connectors** exposed to the outside world: a **TVS diode**, which clamps fast transients such as ESD and inductive spikes above a set voltage.

## Worked example

A transformer gives 12 V rms at 50 Hz into a bridge; the load draws 0.5 A.

1. Peak: $12\sqrt2 = 16.97$ V; after two 0.7 V drops, 15.57 V.
2. With 1000 µF: $\Delta V \approx 0.5/(2\times50\times10^{-3}) = 5$ V. That's far too much; simulation gives 3.8 V.
3. For ripple of about 1 V: $C \ge 0.5/(2\times50\times1) = 5000$ µF. With a standard 6800 µF capacitor the estimate is 0.74 V and the simulation gives 0.67 V.
4. Diode PIV: about 17 V, so 1N4001-class diodes (50 V) are fine.
5. A half-wave rectifier with the same 6800 µF would ripple about twice as much: 1.47 V by the estimate, 1.37 V simulated.

## Code it from scratch

:::code file=rectifier.py
```python
import math

def simulate(C, I, f=50.0, vrms=12.0, vd=0.7, full=True, T=0.1, dt=1e-6):
    vp = vrms * math.sqrt(2)
    v, lo, hi, t = vp - (2 if full else 1) * vd, 1e9, 0.0, 0.0
    while t < T:
        s = math.sin(2 * math.pi * f * t)
        src = max(0.0, (abs(s) if full else s) * vp - (2 if full else 1) * vd)
        v -= I / C * dt                       # the load drains the capacitor
        v = max(v, src)                       # the diodes recharge it whenever the input is higher
        if t > 0.04:
            lo, hi = min(lo, v), max(hi, v)
        t += dt
    return hi - lo, lo

if __name__ == "__main__":
    assert abs(12 * math.sqrt(2) - 1.4 - 15.5706) < 1e-4
    for C, est in ((1000e-6, 5.0), (6800e-6, 0.7353)):
        ripple, vmin = simulate(C, 0.5)
        print(f"C = {C*1e6:.0f} uF: ripple {ripple:.3f} V (estimate {est:.3f} V), minimum {vmin:.2f} V")
        assert abs(0.5 / (2 * 50 * C) - est) < 1e-3
        assert 0.7 * est < ripple < est             # the estimate is a little pessimistic
    r_half, _ = simulate(6800e-6, 0.5, full=False)
    r_full, _ = simulate(6800e-6, 0.5)
    assert 1.8 < r_half / r_full < 2.3             # half wave ripples about twice as much
```
:::end

## Exercises

:::exercise
A 5 V regulator (lesson 19) needs at least 7 V at its input. With the 12 V rms transformer and 0.5 A, what is the smallest capacitor that keeps the valley above 7 V?
:::solution
The peak is 15.57 V, so the allowed ripple is 8.57 V. $C \ge 0.5/(2\times50\times8.57) = 583$ µF; with margin for mains dips and capacitor tolerance, 1000 µF.
:::end

:::exercise
Why does a bigger smoothing capacitor increase the diodes' peak current?
:::solution
Lower ripple means the input exceeds the capacitor voltage for a shorter time near each peak. The same charge ($I/2f$ per half-cycle) must flow in that shorter window, so the current pulses get taller.
:::end

## Quiz

:::quiz
- type: num
  q: Peak output of a 12 V rms bridge after two 0.7 V drops, in volts?
  answer: 15.5706
  tol: 0.001
  unit: V
  py: "12*math.sqrt(2)-1.4"
  explain: $V_{rms}\sqrt2 - 2V_d$.
- type: num
  q: What is the estimated ripple in volts for 0.5 A, 50 Hz full wave and 1000 µF?
  answer: 5
  tol: 0.001
  unit: V
  py: "0.5/(2*50*1000e-6)"
  explain: $I/(2fC)$.
- type: num
  q: What capacitance in µF gives an estimated 1 V of ripple?
  answer: 5000
  tol: 0.001
  unit: µF
  py: "0.5/(2*50*1)*1e6"
  explain: $C = I/(2f\Delta V)$.
- type: mc
  q: Compared with full wave, a half-wave rectifier with the same capacitor has…
  options:
    - half the ripple
    - about twice the ripple
    - the same ripple
    - no ripple
  answer: 1
  explain: The capacitor waits a full period between top-ups.
- type: mc
  q: A TVS diode is used to…
  options:
    - rectify mains
    - clamp fast voltage transients such as ESD
    - regulate 5 V precisely
    - measure temperature
  answer: 1
  explain: It conducts hard above its breakdown voltage.
- type: num
  q: Smallest capacitor in µF that keeps the valley above 7 V at 0.5 A?
  answer: 583.43
  tol: 0.003
  unit: µF
  py: "0.5/(2*50*(12*math.sqrt(2)-1.4-7))*1e6"
  explain: Allowed ripple is 15.57 − 7 = 8.57 V.
:::end

:::verify
import math
assert abs(0.5/(50*6800e-6)-1.4706)<1e-4 and abs(12*math.sqrt(2)-16.97)<0.005
:::end
