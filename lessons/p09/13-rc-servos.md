---
id: p09-l13
minutes: 30
summary: A hobby servo packs a DC motor, a gearbox, a potentiometer and a proportional controller into one box, and you command it with a pulse width. You derive the pulse-to-angle mapping, measure a pulse with a timer, model the internal loop with its speed limit and deadband, and check the horn lands within 2 degrees of every command.
---

## The interface: a pulse every 20 ms

An RC servo reads a pulse repeated at about 50 Hz (every 20 ms). The **pulse width**, not the duty cycle, sets the angle. A common convention is 1000 µs for one end, 1500 µs for centre and 2000 µs for the other end. Many servos accept 500–2500 µs for a wider range, and the exact mapping varies by model, so calibrate yours. For a servo that maps 1000–2000 µs to 0–180°:

$$\theta = (t_{pulse} - 1000\ \mu s)\cdot\frac{180°}{1000\ \mu s} = 0.18°/\mu s\cdot(t_{pulse} - 1000).$$

To generate it from a microcontroller, use a timer in PWM mode (Phase 10) with a 20 ms period and a 1 µs tick, so the compare value is the pulse width in microseconds.

## Inside: a proportional loop

The servo's controller compares the commanded angle with the potentiometer on the output shaft and drives the motor with a voltage proportional to the error, saturated at full voltage. So:

- far from the target the horn moves at its **maximum speed**, typically 0.1–0.2 s per 60°;
- near the target it slows down proportionally;
- inside a **deadband** of a few microseconds' worth of angle it stops driving, which prevents the motor from hunting and buzzing on potentiometer noise.

The deadband sets the resolution: a 4 µs deadband (±2 µs) on 0.18°/µs is ±0.36°. Because the loop is only proportional, a load torque leaves a steady error, and the servo pushes back with torque proportional to the deflection, like a stiff spring.

:::figure widget=servo caption="Servo horn angle for a pulse width (top) and the 50 Hz control signal (bottom). Increase the deadband: the horn stops further from the command."
:::end

## Worked example

A servo maps 1000–2000 µs to 0–180°, moves at 60° per 0.12 s, with a 4 µs deadband.

1. A 1350 µs pulse commands $0.18\cdot350 = 63°$.
2. From 90°, the move is 27°. At 500°/s it takes about 54 ms, nearly three pulse periods.
3. The horn stops within $\pm2\ \mu s\cdot0.18 = \pm0.36°$ of 63°.
4. A timer with a 1 µs tick measures the pulse to ±1 µs, or ±0.18°.

## Code it from scratch

:::code file=servo_model.py
```python
import numpy as np

DEG_PER_US = 180 / 1000

def pulse_train(width_us, periods=3, fs=1e6, period_us=20000):
    n = np.arange(int(periods * period_us * fs / 1e6))
    return ((n % period_us) < width_us).astype(np.uint8)

def measure_width(samples, fs=1e6):
    """Timer-capture style: count samples between a rising and the next falling edge."""
    d = np.diff(samples.astype(int))
    rise = np.flatnonzero(d == 1) + 1; fall = np.flatnonzero(d == -1) + 1
    if samples[0]:
        rise = np.r_[0, rise]
    widths = [f - r for r in rise for f in fall[fall > r][:1]]
    return np.median(widths) * 1e6 / fs

def servo(cmd_deg, start_deg=90.0, kp=40.0, w_max=500.0, deadband_us=4.0, T=0.4, dt=1e-4):
    th = start_deg; db = deadband_us / 2 * DEG_PER_US
    for _ in range(int(T / dt)):
        e = cmd_deg - th
        if abs(e) > db:
            th += dt * np.clip(kp * e, -w_max, w_max)       # saturated proportional drive
    return th

if __name__ == "__main__":
    rng = np.random.default_rng(13)
    worst = 0
    for width in rng.uniform(1000, 2000, 40):
        measured = measure_width(pulse_train(round(width)))
        assert abs(measured - round(width)) <= 1
        cmd = (measured - 1000) * DEG_PER_US
        ang = servo(cmd, start_deg=rng.uniform(0, 180))
        worst = max(worst, abs(ang - cmd))
    print(f"worst final error over 40 random commands: {worst:.3f} deg")
    assert worst < 2.0 and worst <= 2 * DEG_PER_US + 1e-9   # within the deadband
    assert abs((1350 - 1000) * DEG_PER_US - 63) < 1e-12
```
:::end

## Exercises

:::exercise
You need 0.1° resolution over 180°. Can a standard RC servo do it?
:::solution
That's 1800 positions, 0.56 µs per position on a 1000 µs range, which is finer than a typical deadband (2–8 µs) and the potentiometer's noise. No: use a "digital" servo with a tiny deadband and a magnetic encoder, or a geared motor with an encoder and your own loop.
:::end

:::exercise
Why does the servo hold its position against a push even though the controller is only proportional?
:::solution
Any deflection creates an error, and the controller drives the motor against it with torque proportional to that error (until saturation). That's a spring, multiplied by the gearbox ratio. There's a small steady error under load, which an integral term would remove.
:::end

## Quiz

:::quiz
- type: num
  q: Angle in degrees for a 1350 µs pulse (1000–2000 µs ↔ 0–180°)?
  answer: 63
  tol: 0.001
  unit: °
  py: "(1350-1000)*0.18"
  explain: 0.18°/µs.
- type: num
  q: Final-error bound in degrees for a 4 µs deadband?
  answer: 0.36
  tol: 0.001
  unit: °
  py: "4/2*0.18"
  explain: ±2 µs × 0.18°/µs.
- type: num
  q: Time in ms to move 27° at 500°/s?
  answer: 54
  tol: 0.001
  unit: ms
  py: "27/500*1000"
  explain: Distance over speed.
- type: num
  q: Pulse repetition frequency in Hz for a 20 ms period?
  answer: 50
  tol: 0.001
  unit: Hz
  py: "1/0.020"
  explain: 1/T.
- type: mc
  q: The angle of an RC servo is set by…
  options:
    - the duty cycle
    - the pulse width
    - the pulse frequency
    - the supply voltage
  answer: 1
  explain: Width in microseconds.
- type: mc
  q: The deadband exists to…
  options:
    - make the servo faster
    - stop the motor hunting on noise near the target
    - save the gearbox
    - set the pulse frequency
  answer: 1
  explain: It trades resolution for quiet holding.
:::end

:::verify
assert abs(60/0.12 - 500) < 1e-9
:::end
