---
id: p19-l05
minutes: 40
summary: A converter needs feedback to hold its output against load and input changes. You derive the averaged control-to-output transfer function of a buck, design a type-II compensator for a 20 kHz crossover, check the phase margin above 45 degrees, and simulate a load step on the closed loop.
---

## The plant

The averaged model of lesson 02 is linear in the duty cycle. Small changes $\hat d$ in duty cause output changes $\hat v$ through

$$G_{vd}(s) = V_{in} \frac{1 + s C r_c}{L C s^2 \left(1 + \tfrac{r_c}{R}\right) + s\left(\tfrac{L}{R} + C r_c\right) + 1},$$

a **double pole** at the LC resonance $f_0 = 1/(2\pi\sqrt{LC})$, where the phase drops by 180°, and a **zero** from the capacitor's ESR $r_c$ at $f_{esr} = 1/(2\pi C r_c)$, which gives 90° back. This is the loop-shaping problem of Phase 13 with a power stage as the plant.

## The type-II compensator

Voltage-mode control compares $V_{out}$ with a reference and sets the duty cycle through

$$G_c(s) = K\, \frac{1 + s/\omega_z}{s\,(1 + s/\omega_p)}.$$

The integrator removes steady-state error; the zero-pole pair adds up to 90° of phase lead around the crossover. Placing the zero a factor $k$ below the crossover $f_c$ and the pole a factor $k$ above gives a phase boost of $2\arctan k - 90°$, 77.5° for $k = 4.5$. Choose $K$ so the loop gain is 1 at $f_c$. Pick $f_c$ well below the switching frequency (a tenth or less), since the averaged model fails near $f_s$.

Type II works when the ESR zero is below the crossover, as with electrolytic capacitors. With low-ESR ceramic capacitors there is no such zero and you need a **type-III** compensator (two zeros) or current-mode control.

:::figure widget=loopbode caption="Bode plot of the compensated buck loop and its response to a load step. Move the crossover frequency and the zero-pole spread; the readout shows phase margin and the voltage dip."
:::end

## Worked example

12 V to 3.3 V, $L = 22$ µH, $C = 470$ µF with $r_c = 50$ mΩ, a 1.65 Ω load (illustrative):

1. The LC double pole is at 1565 Hz and the ESR zero at 6773 Hz.
2. For $f_c = 20$ kHz and $k = 4.5$ the compensator zero is at 4444 Hz and its pole at 90 000 Hz.
3. The loop crosses over at 19.99 kHz with a phase margin of 47.8°, and above crossover the phase stays above −175.5°. Below crossover the phase dips under −180° where the gain is large: the loop is **conditionally stable**, normal for such designs, but a reason to avoid large duty-cycle saturation.
4. A load step from 1 to 2 A dips the output by 50.5 mV (mostly $r_c \times 1$ A) and brings it back within 1 % after 6 µs. The final value is 3.3000 V: no steady-state error.

## Code it from scratch

:::code file=compensator.py
```python
import numpy as np

P = dict(vin=12.0, L=22e-6, C=470e-6, rc=0.05, R=1.65)       # buck with an electrolytic output capacitor (its ESR adds a zero)

def plant(s, vin, L, C, rc, R):
    """control-to-output transfer function of the averaged buck, Gvd = vout/d"""
    return vin * (1 + s * C * rc) / (L * C * s**2 * (1 + rc / R) + s * (L / R + C * rc) + 1)

def type2(s, K, wz, wp): return K * (1 + s / wz) / (s * (1 + s / wp))

def design(fc=20e3, k=4.5):
    """type-II: zero a factor k below crossover, pole a factor k above, gain so that |loop| = 1 at fc"""
    wc = 2 * np.pi * fc; wz, wp = wc / k, wc * k
    K = 1 / abs(plant(1j * wc, **P) * type2(1j * wc, 1.0, wz, wp))
    return K, wz, wp

def margins(K, wz, wp):
    f = np.logspace(1, 6, 20000); s = 2j * np.pi * f; Lp = plant(s, **P) * type2(s, K, wz, wp)
    i = np.argmin(abs(abs(Lp) - 1)); pm = 180 + np.degrees(np.angle(Lp[i]))
    ph = np.degrees(np.unwrap(np.angle(Lp))); hi = f > f[i]
    return f[i], pm, ph[hi].min()                                          # lowest phase above crossover

def load_step(K, wz, wp, vref=3.3, t_end=3e-3, dt=20e-9, i1=1.0, i2=2.0, t_step=1e-3):
    """averaged buck with the type-II controller: the load is a current sink that steps from i1 to i2"""
    vin, L, C, rc = P["vin"], P["L"], P["C"], P["rc"]
    iL, vC, z, w = i1, vref, vref / vin / K, vref / vin / K                # start in steady state
    out = []
    for k in range(int(t_end / dt)):
        t = k * dt; io = i1 if t < t_step else i2
        vo = vC + rc * (iL - io)
        e = vref - vo; z += dt * e; w += dt * wp * (z - w)
        d = np.clip(K * ((wp / wz) * z + (1 - wp / wz) * w), 0, 1)          # duty cycle, limited to 0..1
        iL += dt * (d * vin - vo) / L; vC += dt * (iL - io) / C
        if k % 50 == 0: out.append((t, vo))
    return np.array(out)

def test_margins():
    K, wz, wp = design(); fc, pm, ph_hi = margins(K, wz, wp)
    f0 = 1 / (2 * np.pi * np.sqrt(P["L"] * P["C"])); fesr = 1 / (2 * np.pi * P["C"] * P["rc"])
    print(f"LC double pole {f0:.0f} Hz, ESR zero {fesr:.0f} Hz; compensator zero {wz / 2 / np.pi:.0f} Hz, pole {wp / 2 / np.pi:.0f} Hz")
    print(f"crossover {fc / 1e3:.2f} kHz, phase margin {pm:.1f} deg; above crossover the phase stays above {ph_hi:.1f} deg")
    assert pm > 45 and abs(fc - 20e3) / 20e3 < 0.01 and ph_hi > -180
    return K, wz, wp

def test_load_step(K, wz, wp):
    tr = load_step(K, wz, wp); t, v = tr[:, 0], tr[:, 1]; after = t > 1e-3
    dip = 3.3 - v[after].min(); settle = t[after][np.where(abs(v[after] - 3.3) > 0.01 * 3.3)[0][-1]] - 1e-3
    print(f"load step 1 A -> 2 A: dip {1000 * dip:.1f} mV, back within 1 % after {1e6 * settle:.0f} us, final {v[-1]:.4f} V")
    assert abs(v[-1] - 3.3) < 1e-3 and dip < 0.1                            # the integrator removes the steady-state error

K, wz, wp = test_margins()
test_load_step(K, wz, wp)
print("PASS")
```
:::end

## In practice

The **python-control** library computes Bode plots and margins (`control.margin`) for these transfer functions, and controller datasheets give formulas to turn $K$, $\omega_z$ and $\omega_p$ into resistor and capacitor values around the error amplifier. Measure the real loop with a frequency-response analyser that injects a small signal across a resistor in the feedback path, since parasitics move the plant.

## Exercises

:::exercise
You replace the electrolytic with ceramics of 2 mΩ ESR. What happens to the type-II design?
:::solution
The ESR zero moves to about 170 kHz, above crossover, so the plant phase at 20 kHz is near −180°. With the integrator's −90° and at most 90° of boost, the margin is around zero or negative: the loop rings or oscillates. Use a type-III compensator or current-mode control.
:::end

:::exercise
Why not push the crossover to 200 kHz for a faster response?
:::solution
With 500 kHz switching, the averaged model is no longer valid near $f_s$, the PWM sampling adds delay, and switching ripple in the feedback would modulate the duty cycle. Crossovers stay around a tenth of $f_s$ or below.
:::end

## Quiz

:::quiz
- type: num
  q: LC resonance of 10 µH and 100 µF (Hz)?
  answer: 5033
  tol: 0.002
  py: "1/(2*math.pi*math.sqrt(10e-6*100e-6))"
  explain: 1/(2π√(LC)).
- type: num
  q: ESR zero of 220 µF with 0.1 Ω (Hz)?
  answer: 7234
  tol: 0.002
  py: "1/(2*math.pi*220e-6*0.1)"
  explain: 1/(2π C rc).
- type: num
  q: Phase boost of a type-II pair with k = 3 (degrees)?
  answer: 53.13
  tol: 0.002
  py: "2*math.degrees(math.atan(3))-90"
  explain: 2 arctan k − 90°.
- type: num
  q: Output dip from 50 mΩ ESR on a 2 A load step (mV)?
  answer: 100
  tol: 0.002
  py: "0.05*2*1000"
  explain: rc ΔI.
- type: mc
  q: The integrator in the compensator…
  options:
    - removes the steady-state output error
    - adds phase lead at crossover
    - raises the switching frequency
    - cancels the ESR zero
  answer: 0
  explain: Infinite DC gain.
- type: mc
  q: With low-ESR ceramic output capacitors, voltage-mode control usually needs…
  options:
    - a type-III compensator
    - no compensation
    - a pure proportional controller
    - a lower duty cycle
  answer: 0
  explain: Two zeros recover the phase lost at the LC pole.
:::end
