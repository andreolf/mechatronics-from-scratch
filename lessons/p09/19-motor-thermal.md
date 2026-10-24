---
id: p09-l19
minutes: 35
summary: Motors rarely fail from too much torque and often from too much heat. You build a two-node thermal model of winding and housing, include copper's resistance rising with temperature, check the simulated steady temperature against the thermal resistances, and work out the continuous current and safe duty cycle for a winding insulation class.
---

## Heat in, heat out

Copper loss is $P = I^2R(T)$, and copper's resistance rises about 0.393 % per kelvin:

$$R(T) = R_{20}\,\big(1 + 0.00393\,(T - 20)\big).$$

The heat flows from the winding to the housing through a thermal resistance $R_{wh}$ (K/W), and from the housing to the air through $R_{ha}$. Each body stores heat in its thermal capacitance $C$ (J/K). That's an RC network, with temperature as voltage and power as current:

$$C_w\frac{dT_w}{dt} = P - \frac{T_w - T_h}{R_{wh}}, \qquad C_h\frac{dT_h}{dt} = \frac{T_w - T_h}{R_{wh}} - \frac{T_h - T_a}{R_{ha}}.$$

## Steady state and time constants

In steady state the same power flows through both resistances in series:

$$T_w = T_a + P\,(R_{wh} + R_{ha}).$$

There are two time constants: a fast one for the winding (minutes, roughly $R_{wh}C_w$) and a slow one for the housing (tens of minutes). That's why a motor can take a short overload of several times its rated current: the winding heats quickly, but it starts from the housing's temperature.

## Limits and duty cycles

Winding insulation is rated by **class**: B 130 °C, F 155 °C, H 180 °C hot-spot. Above the limit, insulation life roughly halves every 10 K. The **continuous current** solves

$$T_{max} = T_a + I^2R(T_{max})(R_{wh} + R_{ha}).$$

For a repeating on/off cycle much shorter than the time constants, what matters is the average power, $D\,I^2R$: the **RMS current** over the cycle must be below the continuous rating.

:::figure widget=thermal caption="Winding and housing temperatures under an on/off duty cycle with a 2-minute period. The winding ripples on top of the slowly rising housing. Raise the current until the winding crosses the 155 °C class F limit."
:::end

## Worked example

$R_{20} = 0.5$ Ω, $R_{wh} = 1.0$ K/W, $R_{ha} = 1.5$ K/W, ambient 30 °C, class F.

1. Continuous current: $R(155) = 0.5(1 + 0.00393\cdot135) = 0.765$ Ω, so $I = \sqrt{125/(2.5\cdot0.765)} = 8.08$ A.
2. Using the cold resistance (0.5 Ω) would give 10.0 A, 24 % too much: always include the temperature rise of R.
3. A cycle of 12 A for 40 % of the time, then off: RMS current $12\sqrt{0.4} = 7.59$ A, which is under 8.08 A, so it's OK on average. The winding ripple on top must still be checked when the period is long.

## Code it from scratch

:::code file=motor_thermal.py
```python
import numpy as np

R20, Rwh, Rha, Cw, Ch, Ta = 0.5, 1.0, 1.5, 300.0, 3000.0, 30.0

def simulate(I, duty=1.0, period=120.0, T=14 * 3600, dt=0.5, tempco=0.00393):
    Tw = Th = Ta; tw = []
    for n in range(int(T / dt)):
        on = (n * dt) % period < duty * period
        P = I * I * R20 * (1 + tempco * (Tw - 20)) if on else 0.0
        q = (Tw - Th) / Rwh
        Tw += dt * (P - q) / Cw
        Th += dt * (q - (Th - Ta) / Rha) / Ch
        tw.append(Tw)
    return np.array(tw)

def continuous_current(Tmax=155.0):
    return np.sqrt((Tmax - Ta) / ((Rwh + Rha) * R20 * (1 + 0.00393 * (Tmax - 20))))

if __name__ == "__main__":
    # without the copper temperature coefficient, the steady state is exactly Ta + P (Rwh + Rha)
    tw = simulate(6.0, tempco=0.0)
    P = 36 * R20
    print(f"steady {tw[-1]:.3f} C, formula {Ta + P * (Rwh + Rha):.3f} C")
    assert abs(tw[-1] - (Ta + P * (Rwh + Rha))) < 0.01
    Ic = continuous_current()
    print(f"continuous current for class F: {Ic:.2f} A")
    assert abs(Ic - 8.08) < 0.01
    assert abs(simulate(Ic)[-1] - 155.0) < 0.2             # with tempco, it settles right at the limit
    # duty cycle: 12 A at 40 % has RMS 7.59 A < Ic; the average winding temperature stays below the limit
    tw = simulate(12.0, duty=0.4)
    last = tw[-int(120 / 0.5) * 5:]
    print(f"12 A at 40 %: winding {last.min():.0f}..{last.max():.0f} C")
    assert 12 * np.sqrt(0.4) < Ic and last.mean() < 155 and last.max() < 165
```
:::end

## Exercises

:::exercise
A fan on the housing halves $R_{ha}$ to 0.75 K/W. What's the new continuous current?
:::solution
$I = \sqrt{125/(1.75\cdot0.765)} = 9.66$ A, 20 % more. The winding-to-housing resistance now dominates, which is why high-performance motors also improve the internal path (potting, better slot fill).
:::end

:::exercise
Why does a motor's datasheet give a much higher "peak current" than continuous current?
:::solution
For a few seconds the winding's thermal capacitance absorbs the heat before its temperature rises much (time constant around $R_{wh}C_w = 300$ s here, though a winding hot spot is faster). The peak rating is limited instead by demagnetising the magnets, saturating the iron, or the drive's current limit.
:::end

## Quiz

:::quiz
- type: num
  q: Steady winding temperature in °C for 18 W, R_wh + R_ha = 2.5 K/W, 30 °C ambient?
  answer: 75
  tol: 0.001
  unit: °C
  py: "30+18*2.5"
  explain: T_a + P·ΣR.
- type: num
  q: Copper resistance in Ω at 155 °C if 0.5 Ω at 20 °C?
  answer: 0.7653
  tol: 0.001
  unit: Ω
  py: "0.5*(1+0.00393*135)"
  explain: R₂₀(1 + 0.00393·ΔT).
- type: num
  q: Continuous current in A for class F (155 °C) in the worked example?
  answer: 8.08
  tol: 0.002
  unit: A
  py: "math.sqrt(125/(2.5*0.5*(1+0.00393*135)))"
  explain: Solve with the hot resistance.
- type: num
  q: RMS current in A of 12 A on for 40 % of the time?
  answer: 7.59
  tol: 0.002
  unit: A
  py: "12*math.sqrt(0.4)"
  explain: I·√D.
- type: num
  q: Hot-spot limit in °C of class B insulation?
  answer: 130
  tol: 0.001
  unit: °C
  py: "130"
  explain: B 130, F 155, H 180.
- type: mc
  q: For an on/off cycle much shorter than the thermal time constants, the heating depends on…
  options:
    - the peak current
    - the RMS current
    - the average current
    - the off time only
  answer: 1
  explain: Average power ∝ I²_rms.
:::end

:::verify
import math
assert abs(math.sqrt(125/(1.75*0.765)) - 9.66) < 0.01
assert abs(math.sqrt(125/(2.5*0.5)) - 10.0) < 0.01
:::end
