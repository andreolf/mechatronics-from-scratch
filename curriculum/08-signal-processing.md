# Phase 08 · Signal Processing & Filters

> Design, implement and verify the filters that sit between every sensor and controller.

- **Lessons:** 16
- **Maps to:** Digital signal processing (generic) (generic topic, not an exact ETH title)
- **Main tool:** SciPy signal · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p08-l01 · Discrete-time systems

**Goal:** Think in samples.

- **Derive by hand:** Linearity, time invariance, causality, BIBO stability.
- **Code from scratch (Python):** Test systems for LTI properties numerically.
- **Interactive lab / visual:** Input/output plots with property checks.
- **Test that proves it works:** Detects a nonlinear and a time-varying system.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l02 · Moving-average filters

**Goal:** Smooth with the simplest FIR.

- **Derive by hand:** Frequency response is a Dirichlet kernel; delay (N - 1)/2.
- **Code from scratch (Python):** Implement an O(1) running moving average.
- **Interactive lab / visual:** Noisy signal smoothed versus window size.
- **Test that proves it works:** Output equals convolution with a box kernel.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l03 · First-order IIR filter

**Goal:** Filter with one multiply.

- **Derive by hand:** y = a y + (1 - a) x; derive a from tau and Ts.
- **Code from scratch (Python):** Implement and discretise an RC-equivalent filter.
- **Interactive lab / visual:** Step response with tunable a.
- **Test that proves it works:** Time constant matches design.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l04 · FIR design by windowing

**Goal:** Get linear-phase filters.

- **Derive by hand:** Ideal sinc response truncated and windowed.
- **Code from scratch (Python):** Design lowpass FIRs with Hamming and Kaiser windows.
- **Interactive lab / visual:** Magnitude response as window changes.
- **Test that proves it works:** Stopband attenuation meets spec.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l05 · IIR biquads

**Goal:** Implement second-order sections robustly.

- **Derive by hand:** Direct form I/II transposed; coefficient quantisation sensitivity.
- **Code from scratch (Python):** Implement a biquad cascade.
- **Interactive lab / visual:** Pole-zero plot with response.
- **Test that proves it works:** Matches scipy.signal.sosfilt.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l06 · Butterworth design via bilinear transform

**Goal:** Design filters from analog prototypes.

- **Derive by hand:** Maximally flat prototype; prewarping.
- **Code from scratch (Python):** Implement Butterworth design end to end.
- **Interactive lab / visual:** Order slider with magnitude response.
- **Test that proves it works:** Matches scipy.signal.butter coefficients.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l07 · Phase and group delay

**Goal:** Understand why filters slow your control loop.

- **Derive by hand:** Group delay = -d phase/d w; phase lag at crossover.
- **Code from scratch (Python):** Compute phase lag a filter adds at a control bandwidth.
- **Interactive lab / visual:** Delayed filtered signal following the raw one.
- **Test that proves it works:** Measured delay matches computed group delay.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l08 · Notch filters for vibration

**Goal:** Remove a motor or propeller resonance.

- **Derive by hand:** Notch zeros on unit circle at w0, poles inside at radius r.
- **Code from scratch (Python):** Design a notch for a 120 Hz resonance.
- **Interactive lab / visual:** Vibration peak removed in spectrum.
- **Test that proves it works:** Notch depth > 30 dB at w0.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l09 · Median filters and outlier rejection

**Goal:** Kill spikes from ultrasonic sensors.

- **Derive by hand:** Order statistics; Hampel identifier.
- **Code from scratch (Python):** Implement median and Hampel filters.
- **Interactive lab / visual:** Spiky signal cleaned.
- **Test that proves it works:** Removes injected spikes without lag on steps.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l10 · Power spectral density (Welch)

**Goal:** Measure noise floors properly.

- **Derive by hand:** Periodogram variance; averaging overlapping windows.
- **Code from scratch (Python):** Implement Welch PSD.
- **Interactive lab / visual:** PSD estimate smoothing with averages.
- **Test that proves it works:** Matches scipy.signal.welch.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l11 · Windowing and leakage

**Goal:** Read spectra without artefacts.

- **Derive by hand:** Leakage from non-integer periods; window main lobe versus sidelobes.
- **Code from scratch (Python):** Compare rectangular, Hann and flat-top windows.
- **Interactive lab / visual:** Spectrum peak smearing as frequency shifts.
- **Test that proves it works:** Flat-top amplitude error below 0.1 dB.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l12 · Decimation and interpolation

**Goal:** Change sample rates for logging.

- **Derive by hand:** Downsample after anti-alias filter; polyphase structure.
- **Code from scratch (Python):** Implement decimate-by-M with polyphase FIR.
- **Interactive lab / visual:** Spectrum before and after decimation.
- **Test that proves it works:** No aliasing above spec.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l13 · Fixed-point filters in C

**Goal:** Run filters on an MCU.

- **Derive by hand:** Q15 coefficient scaling, accumulator width, limit cycles.
- **Code from scratch (C):** Write a Q15 biquad in C and compare with float on host.
- **Interactive lab / visual:** Error between fixed and float versions.
- **Test that proves it works:** Error below 1 LSB on test vectors.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l14 · Differentiating noisy signals

**Goal:** Get velocity from position without amplifying noise.

- **Derive by hand:** Differentiator gain grows with frequency; filtered derivative.
- **Code from scratch (Python):** Compare finite difference, filtered derivative and Savitzky-Golay.
- **Interactive lab / visual:** Noise amplification visualised.
- **Test that proves it works:** Filtered derivative RMS error 5x lower.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l15 · Correlation and time-delay estimation

**Goal:** Find delays between signals.

- **Derive by hand:** Cross-correlation peak location; parabolic interpolation.
- **Code from scratch (Python):** Estimate delay between two noisy microphones.
- **Interactive lab / visual:** Correlation peak sliding with delay.
- **Test that proves it works:** Sub-sample accuracy within 0.1 sample.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l16 · Vibration diagnostics

**Goal:** Detect a failing bearing in a drive, e.g. a ski-lift gearbox.

- **Derive by hand:** Bearing fault frequencies; envelope spectrum.
- **Code from scratch (Python):** Implement envelope analysis using Hilbert transform.
- **Interactive lab / visual:** Spectrum lines appearing as a defect grows.
- **Test that proves it works:** Detects injected fault frequency.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)
- **Real-world anchor:** Switzerland
