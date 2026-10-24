---
id: p07-l14
minutes: 35
summary: Motor control needs the current, which is the torque. You size a shunt and amplifier for ±20 A, compare low-side, high-side and Hall sensing, and show why sampling at the centre of a PWM period gives the average current while sampling near an edge catches ripple and ringing.
---

## Shunts

A **shunt** is a small, accurate resistor in the current path. Ohm's law turns current into voltage: $V = IR$. Choose $R$ by balancing:

- **Signal**: a larger $R$ gives more millivolts above amplifier offset and noise.
- **Loss**: $P = I^2R$ heats the board and wastes energy.

A full-scale drop of 50–100 mV is typical. Use a 4-terminal (Kelvin) connection, so the solder joints and copper aren't part of the measurement, and a current-sense amplifier with high common-mode rejection.

**Where to put it**:

- **Low side** (between the load or bridge and ground): a common-mode voltage near 0 V, so it's easy to amplify. It doesn't see a short from the load to ground, and it lifts the load's ground.
- **High side or in-line in a motor phase**: it sees all the current, but the common mode swings with the PWM, so it needs a dedicated amplifier with high common-mode rejection at high slew rates.
- **Hall-effect current sensors** (lesson 8): galvanic isolation and no loss, at the cost of offset drift and bandwidth.

## Sampling in a PWM period

With PWM at $f_{pwm}$, the motor's inductance turns the voltage pulses into a current that ramps up during the on-time and down during the off-time: a triangle **ripple** around the average. Each switching edge also adds **ringing**.

With **centre-aligned PWM**, the middle of the on-time (and of the off-time) is exactly where the rising ramp crosses the average, far from both edges. Triggering the ADC from the PWM timer at that instant samples the **average current** with no filtering delay. That's what every field-oriented motor drive does (Phase 09).

:::figure widget=shunt caption="Shunt current through one centre-aligned PWM period, with ramp ripple and switching ringing. Move the sample instant: the centre gives the average; near an edge you sample the ringing."
:::end

## Worked example

Design for ±20 A with a 3.3 V ADC.

1. A 50 mV drop at 20 A gives $R = 2.5$ mΩ. Loss at 20 A: $20^2\times0.0025 = 1$ W, so use a 2–3 W part.
2. Bidirectional: bias the amplifier output at 1.65 V. Gain $G = 1.65/0.05 = 33$ maps ±20 A to 0–3.3 V.
3. A 12-bit ADC: $3.3/4096 = 0.81$ mV per count, which is $0.81/(33\times2.5) = 9.8$ mA per count.
4. An amplifier offset of 100 µV at the input is 40 mA of current error, which you calibrate out at zero current.

## Code it from scratch

:::code file=current_sense.py
```python
import numpy as np

def shunt_design(i_max, v_fs=0.05, adc_span=3.3, bits=12):
    R = v_fs / i_max
    G = (adc_span / 2) / v_fs                              # bidirectional around mid-rail
    amps_per_count = adc_span / 2**bits / (G * R)
    return R, i_max**2 * R, G, amps_per_count

def phase_current(t, duty, i_avg=10.0, ripple=4.0, ring=6.0):
    """t in PWM periods [0, 1); centre-aligned, on in the middle."""
    t = np.asarray(t) % 1.0
    on0, on1 = 0.5 - duty / 2, 0.5 + duty / 2
    rising = (t >= on0) & (t < on1)
    x_off = np.where(t < on0, (t + 1 - on1) / (1 - duty), (t - on1) / (1 - duty))
    i = np.where(rising, i_avg - ripple / 2 + ripple * (t - on0) / duty, i_avg + ripple / 2 - ripple * x_off)
    for edge in (on0, on1):
        dt = t - edge
        i = i + np.where((dt >= 0) & (dt < 0.04), ring * np.exp(-dt / 0.012) * np.cos(2 * np.pi * dt / 0.012), 0)
    return i

if __name__ == "__main__":
    R, P, G, lsb = shunt_design(20)
    print(f"R = {R*1e3:.2f} mOhm, loss {P:.2f} W, gain {G:.0f}, {lsb*1e3:.2f} mA per count")
    assert abs(R - 2.5e-3) < 1e-12 and abs(P - 1.0) < 1e-12 and abs(G - 33) < 1e-12 and abs(lsb - 9.766e-3) < 1e-5
    t = np.linspace(0, 1, 200_000, endpoint=False)
    for duty in (0.2, 0.5, 0.8):
        true_avg = phase_current(t, duty, ring=0).mean()
        centre = float(phase_current(0.5, duty))           # middle of the on-time (PWM counter at its peak)
        valley = float(phase_current(0.0, duty))           # middle of the off-time
        near_edge = float(phase_current(0.5 - duty / 2 + 0.005, duty))
        assert abs(centre - true_avg) < 1e-3 and abs(valley - true_avg) < 1e-3
        assert abs(near_edge - true_avg) > 1.0
    print("centre-aligned sampling returns the average current at every duty cycle")
```
:::end

## Exercises

:::exercise
Why does a low-side shunt under a half-bridge only measure the current while the low switch conducts?
:::solution
The current flows through the shunt only when its leg's low-side switch (or diode) carries it. During the high-side on-time, the current circulates elsewhere and the shunt reads zero. Sample during the low-side conduction window, which also sets a minimum off-time.
:::end

:::exercise
Choose a shunt for ±5 A with a 100 mV full-scale drop. What power does it dissipate?
:::solution
$R = 0.1/5 = 20$ mΩ; $P = 25\times0.02 = 0.5$ W at full current. Use a 1 W part.
:::end

## Quiz

:::quiz
- type: num
  q: Shunt resistance in mΩ for 50 mV at 20 A?
  answer: 2.5
  tol: 0.001
  unit: mΩ
  py: "0.05/20*1000"
  explain: R = V/I.
- type: num
  q: Power in W at 20 A through 2.5 mΩ?
  answer: 1
  tol: 0.001
  unit: W
  py: "20**2*0.0025"
  explain: I²R.
- type: num
  q: Amplifier gain to map ±50 mV onto 0–3.3 V around mid-rail?
  answer: 33
  tol: 0.001
  py: "1.65/0.05"
  explain: Half the span over the full-scale drop.
- type: mc
  q: In centre-aligned PWM, sampling at the middle of the on-time gives…
  options:
    - the peak current
    - the average current
    - zero
    - the ringing amplitude
  answer: 1
  explain: The ramp crosses the average there.
- type: num
  q: Current error in mA from a 100 µV amplifier input offset on 2.5 mΩ?
  answer: 40
  tol: 0.001
  unit: mA
  py: "100e-6/2.5e-3*1000"
  explain: Calibrate it at zero current.
- type: mc
  q: A Hall-effect current sensor's main advantage over a shunt is…
  options:
    - lower offset drift
    - galvanic isolation and no I²R loss
    - higher bandwidth always
    - lower cost always
  answer: 1
  explain: It senses the field around the conductor.
:::end

:::verify
assert abs(3.3/4096/(33*2.5e-3) - 9.766e-3) < 1e-5
:::end
