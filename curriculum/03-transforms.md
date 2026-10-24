# Phase 03 · Laplace, Fourier & z-Transforms

> Move between time, frequency and s-plane until transfer functions feel physical.

- **Lessons:** 14
- **Maps to:** Signals and systems (generic) (generic topic, not an exact ETH title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p03-l01 · Complex numbers and phasors

**Goal:** Represent sinusoids as rotating arrows.

- **Derive by hand:** z = a + jb = r e^(j phi); multiplication rotates and scales.
- **Code from scratch (Python):** Implement phasor arithmetic for AC circuit sums.
- **Interactive lab / visual:** Rotating phasors summing tip to tail.
- **Test that proves it works:** Phasor sum equals time-domain sum sampled at 1000 points.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l02 · Euler's formula and sinusoids

**Goal:** Connect exponentials, sines and oscillation.

- **Derive by hand:** Derive e^(j w t) = cos + j sin from Taylor series.
- **Code from scratch (Python):** Generate sinusoids from complex exponentials and check identities.
- **Interactive lab / visual:** Helix in 3D whose projections are sine and cosine.
- **Test that proves it works:** Identity holds to 1e-12 across a sweep.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l03 · The Laplace transform

**Goal:** Turn derivatives into algebra.

- **Derive by hand:** Derive L{x'} = sX - x(0) from the definition by integration by parts.
- **Code from scratch (Python):** Numerically evaluate Laplace integrals and compare with a table.
- **Interactive lab / visual:** Surface plot of abs(F(s)) over the s-plane.
- **Test that proves it works:** Numeric transform of e^(-at) matches 1/(s + a).
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l04 · Transfer functions from ODEs

**Goal:** Write G(s) for a motor, a filter or a spring.

- **Derive by hand:** Zero initial conditions: G(s) = Y(s)/U(s).
- **Code from scratch (Python):** Build a TF class with numerator, denominator, series and feedback.
- **Interactive lab / visual:** Block diagram where blocks multiply into one TF live.
- **Test that proves it works:** Series/feedback match python-control results.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l05 · Poles, zeros and time response

**Goal:** Predict response shape from the s-plane.

- **Derive by hand:** Pole location sets decay and frequency; dominant poles.
- **Code from scratch (Python):** Compute poles and simulate step responses for a pole set.
- **Interactive lab / visual:** Drag poles on the s-plane and watch the step response morph.
- **Test that proves it works:** Settling time matches 4/(zeta wn) within 5 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)
- **Real-world anchor:** Switzerland

## p03-l06 · Partial fractions and inverse Laplace

**Goal:** Get closed-form time responses.

- **Derive by hand:** Residue method for distinct and repeated poles.
- **Code from scratch (Python):** Implement residue computation for distinct poles.
- **Interactive lab / visual:** Each partial-fraction term plotted and summed.
- **Test that proves it works:** Reconstructed response matches simulation.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l07 · Initial and final value theorems

**Goal:** Read steady-state error without simulating.

- **Derive by hand:** x(inf) = lim s->0 sX(s), valid only for stable systems.
- **Code from scratch (Python):** Compute final values and flag invalid use for unstable systems.
- **Interactive lab / visual:** Step response with the predicted final value line.
- **Test that proves it works:** Matches simulated steady state; detects an unstable case.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l08 · Convolution and impulse response

**Goal:** Understand output as a weighted sum of past inputs.

- **Derive by hand:** y = h * u; derive from linearity and time invariance.
- **Code from scratch (Python):** Implement discrete convolution with loops then FFT.
- **Interactive lab / visual:** Flip-and-slide convolution animation.
- **Test that proves it works:** Loop and FFT convolution agree to 1e-10.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l09 · Fourier series

**Goal:** See PWM as a sum of harmonics.

- **Derive by hand:** Derive coefficients of a square wave by orthogonality; Gibbs phenomenon.
- **Code from scratch (Python):** Reconstruct PWM waveforms with N harmonics.
- **Interactive lab / visual:** Harmonic slider building a square wave with visible overshoot.
- **Test that proves it works:** Coefficients match 4/(n pi) for odd n.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l10 · The Fourier transform and spectra

**Goal:** Read frequency content of vibration and noise.

- **Derive by hand:** Continuous FT, energy and Parseval.
- **Code from scratch (Python):** Compute spectra of synthetic motor vibration signals.
- **Interactive lab / visual:** Spectrum that shifts as you change motor speed.
- **Test that proves it works:** Parseval holds numerically.
- **Pro / open-source tool it maps to:** SciPy fft
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l11 · DFT and the radix-2 FFT

**Goal:** Build the FFT that every analyser uses.

- **Derive by hand:** DFT matrix; derive the butterfly by splitting even and odd samples.
- **Code from scratch (Python):** Implement recursive and iterative radix-2 FFT.
- **Interactive lab / visual:** Butterfly diagram lighting up per stage.
- **Test that proves it works:** Matches numpy.fft to 1e-9; timing scales as N log N.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l12 · Sampling and aliasing

**Goal:** Pick sample rates that do not lie.

- **Derive by hand:** Sampling as multiplication by an impulse train; Nyquist criterion.
- **Code from scratch (Python):** Sample a spinning wheel and reproduce the wagon-wheel effect.
- **Interactive lab / visual:** 3D wheel strobed at a chosen frame rate appears to spin backwards.
- **Test that proves it works:** Aliased frequency matches abs(f - k fs) prediction.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l13 · The z-transform and discrete transfer functions

**Goal:** Describe digital filters and controllers.

- **Derive by hand:** z = e^(sT); unit circle stability; difference equations to H(z).
- **Code from scratch (Python):** Implement lfilter from a difference equation.
- **Interactive lab / visual:** Poles in the z-plane with unit circle and impulse response.
- **Test that proves it works:** Matches scipy.signal.lfilter output.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l14 · Discretisation: ZOH, Tustin and matched

**Goal:** Turn a continuous controller into code.

- **Derive by hand:** Derive ZOH via matrix exponential; Tustin s = (2/T)(z-1)/(z+1); prewarping.
- **Code from scratch (Python):** Discretise a PID and a lowpass with three methods.
- **Interactive lab / visual:** Bode overlay of continuous and discrete versions as T grows.
- **Test that proves it works:** ZOH step responses match continuous at sample instants.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)
