# Phase 07 · Sensors & Signal Conditioning

> Turn physics into clean numbers: transduce, condition, sample, calibrate.

- **Lessons:** 18
- **Maps to:** Sensors and measurement (generic) (generic topic, not an exact ETH title)
- **Main tool:** PlatformIO · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p07-l01 · Sensor characteristics

**Goal:** Read a datasheet like an engineer.

- **Derive by hand:** Range, resolution, accuracy, precision, linearity, hysteresis, bandwidth.
- **Code from scratch (Python):** Build a SensorModel class with gain, offset, noise and saturation.
- **Interactive lab / visual:** Target diagram showing accuracy versus precision.
- **Test that proves it works:** Model reproduces datasheet error budget.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l02 · Calibration by least squares

**Goal:** Remove gain and offset errors.

- **Derive by hand:** Two-point and multi-point calibration; residual analysis.
- **Code from scratch (Python):** Calibrate a simulated load cell from reference weights.
- **Interactive lab / visual:** Before/after error plot.
- **Test that proves it works:** Residual error below spec after calibration.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l03 · Potentiometers as position sensors

**Goal:** Measure angle cheaply.

- **Derive by hand:** Divider output; loading error with finite ADC input impedance.
- **Code from scratch (Python):** Compute loading error and fix it with a buffer.
- **Interactive lab / visual:** Pot knob with error curve.
- **Test that proves it works:** Buffered error below 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l04 · Strain gauges and load cells

**Goal:** Weigh things and measure force.

- **Derive by hand:** Gauge factor GF = (dR/R)/strain; bridge sensitivity.
- **Code from scratch (Python):** Model a load cell bridge plus INA plus ADC chain.
- **Interactive lab / visual:** Beam bending with strain colour map.
- **Test that proves it works:** Recovered weight within 0.5 percent.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l05 · Thermistors and Steinhart-Hart

**Goal:** Measure temperature in a motor or battery.

- **Derive by hand:** Fit 1/T = A + B ln R + C (ln R)^3.
- **Code from scratch (Python):** Fit Steinhart-Hart coefficients from a resistance table.
- **Interactive lab / visual:** Thermistor curve with linearised fit.
- **Test that proves it works:** Error below 0.2 K over 0-80 C.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l06 · RTDs and thermocouples

**Goal:** Measure high temperatures with cold-junction compensation.

- **Derive by hand:** Callendar-Van Dusen; Seebeck voltage and reference junction.
- **Code from scratch (Python):** Implement thermocouple conversion with CJC.
- **Interactive lab / visual:** Two junctions with temperatures and resulting voltage.
- **Test that proves it works:** Matches reference table to 0.5 C.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l07 · Optical encoders

**Goal:** Measure position and speed of motors.

- **Derive by hand:** Counts per rev, x4 decoding; speed by period versus frequency method.
- **Code from scratch (Python):** Estimate speed from simulated encoder edges with both methods.
- **Interactive lab / visual:** Spinning encoder with speed estimates versus truth.
- **Test that proves it works:** Period method wins at low speed, frequency method at high.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l08 · Hall sensors and commutation

**Goal:** Detect rotor position in a BLDC motor.

- **Derive by hand:** Hall voltage V_H = I B/(n q t); six-state sequence.
- **Code from scratch (Python):** Decode Hall states to a commutation step and speed.
- **Interactive lab / visual:** Rotor magnets passing three Hall sensors.
- **Test that proves it works:** Sequence matches rotation direction.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l09 · MEMS accelerometers

**Goal:** Measure tilt and vibration.

- **Derive by hand:** Proof-mass model; tilt from gravity atan2(ay, az).
- **Code from scratch (Python):** Compute tilt from simulated accelerometer with vibration.
- **Interactive lab / visual:** Phone-style tilt with noisy reading.
- **Test that proves it works:** Static tilt error below 1 degree.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l10 · Gyroscopes and bias

**Goal:** Measure rotation rate and understand drift.

- **Derive by hand:** Coriolis principle; integrated bias error grows linearly.
- **Code from scratch (Python):** Integrate a biased gyro and estimate bias at rest.
- **Interactive lab / visual:** Drifting attitude without bias correction.
- **Test that proves it works:** Bias estimate within 5 percent after 10 s rest.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l11 · Magnetometers and hard/soft iron

**Goal:** Get heading near steel and motors.

- **Derive by hand:** Ellipsoid fitting for hard and soft iron.
- **Code from scratch (Python):** Fit an ellipsoid to rotated magnetometer samples.
- **Interactive lab / visual:** Distorted point cloud becoming a sphere.
- **Test that proves it works:** Heading error below 2 degrees after calibration.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l12 · Ultrasonic time-of-flight

**Goal:** Measure distance with sound.

- **Derive by hand:** d = c t/2; temperature dependence of c.
- **Code from scratch (Python):** Simulate echo detection with threshold and cross-correlation.
- **Interactive lab / visual:** Sound wave bouncing off a wall.
- **Test that proves it works:** Distance error below 1 cm with correlation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l13 · Optical ToF and LiDAR

**Goal:** Use light for range and scanning.

- **Derive by hand:** Phase-shift ranging; ambiguity distance c/(2 f).
- **Code from scratch (Python):** Convert raw 2D LiDAR scans into points.
- **Interactive lab / visual:** Rotating scanner building a room outline.
- **Test that proves it works:** Point cloud matches the ground-truth wall.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l14 · Current sensing

**Goal:** Measure motor current for control and protection.

- **Derive by hand:** Shunt drop and power; high-side versus low-side; Hall current sensors.
- **Code from scratch (Python):** Design a shunt plus amplifier for 20 A.
- **Interactive lab / visual:** Current waveform under PWM with sampling instants.
- **Test that proves it works:** Sampling at PWM centre yields average current.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l15 · Pressure and flow sensors

**Goal:** Instrument a pump, e.g. a Bali irrigation line.

- **Derive by hand:** Bernoulli and orifice flow Q = Cd A sqrt(2 dp/rho).
- **Code from scratch (Python):** Estimate flow from differential pressure.
- **Interactive lab / visual:** Water flowing through an orifice with pressure taps.
- **Test that proves it works:** Flow estimate within 5 percent of model.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)
- **Real-world anchor:** Bali

## p07-l16 · Anti-aliasing filter design

**Goal:** Filter before you sample.

- **Derive by hand:** Required attenuation at fs/2 for a given ADC resolution.
- **Code from scratch (Python):** Choose filter order and corner for 1 kHz sampling and 12 bits.
- **Interactive lab / visual:** Spectrum folding with and without the filter.
- **Test that proves it works:** Aliased tone below 1 LSB.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l17 · ADC quantisation and ENOB

**Goal:** Know your real resolution.

- **Derive by hand:** Quantisation noise q^2/12; SNR = 6.02 N + 1.76 dB.
- **Code from scratch (Python):** Compute ENOB from an FFT of a sampled sine.
- **Interactive lab / visual:** Staircase quantisation and error signal.
- **Test that proves it works:** ENOB matches theory for ideal ADC.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l18 · Complementary filter preview

**Goal:** Fuse a gyro and accelerometer simply.

- **Derive by hand:** High-pass the gyro, low-pass the accelerometer, sum is unity.
- **Code from scratch (Python):** Implement a complementary tilt filter.
- **Interactive lab / visual:** Tilt estimate with gyro, accel and fused traces. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Fused estimate beats both sensors on RMS error.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)
