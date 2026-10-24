# Phase 04 · Probability & Statistics for Estimation

> Noise is the default. Learn to reason about it before you filter it.

- **Lessons:** 12
- **Maps to:** Probability and Statistics (ETH Zurich course title)
- **Main tool:** NumPy · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p04-l01 · Random variables and distributions

**Goal:** Describe sensor readings as distributions, not numbers.

- **Derive by hand:** PDF, CDF, expectation as integral.
- **Code from scratch (Python):** Sample uniform, Gaussian and exponential variables from a uniform generator.
- **Interactive lab / visual:** Histogram converging to the PDF as samples grow.
- **Test that proves it works:** Sample moments within 3 standard errors of theory.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l02 · Mean, variance and datasheets

**Goal:** Translate datasheet noise specs into variance.

- **Derive by hand:** Var = E[x^2] - E[x]^2; noise density to RMS via bandwidth.
- **Code from scratch (Python):** Convert accelerometer noise density into RMS noise at 100 Hz.
- **Interactive lab / visual:** Noise trace whose band shrinks as you lower bandwidth.
- **Test that proves it works:** RMS of simulated noise matches computed value within 5 percent.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l03 · The Gaussian and the central limit theorem

**Goal:** See why sums of errors look Gaussian.

- **Derive by hand:** Derive the Gaussian as a limit of sums; standardisation.
- **Code from scratch (Python):** Sum N uniform variables and test normality.
- **Interactive lab / visual:** Galton board in 3D that builds a bell curve.
- **Test that proves it works:** Kolmogorov-Smirnov test passes for N >= 12.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** Probability and Statistics (ETH)

## p04-l04 · Joint distributions and covariance

**Goal:** Model correlated errors between axes.

- **Derive by hand:** Covariance matrix, correlation, covariance ellipses from eigenvectors.
- **Code from scratch (Python):** Estimate covariance from IMU data and draw the ellipse.
- **Interactive lab / visual:** 2D scatter with a live 2-sigma ellipse.
- **Test that proves it works:** Estimated covariance converges to the true matrix.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l05 · Linear transforms of Gaussians

**Goal:** Propagate uncertainty through a model.

- **Derive by hand:** If y = A x + b then Sigma_y = A Sigma_x A^T.
- **Code from scratch (Python):** Propagate encoder uncertainty through arm forward kinematics.
- **Interactive lab / visual:** Uncertainty ellipse at the end effector moving with the arm.
- **Test that proves it works:** Monte Carlo covariance matches linear propagation for small noise.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l06 · Bayes' rule for sensors

**Goal:** Update belief when a measurement arrives.

- **Derive by hand:** Derive posterior proportional to likelihood times prior.
- **Code from scratch (Python):** Implement a 1D histogram filter for a corridor robot.
- **Interactive lab / visual:** Belief bars sharpening as the robot senses doors.
- **Test that proves it works:** Posterior sums to 1 and peaks at the true cell.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l07 · Maximum likelihood and least squares

**Goal:** Show least squares is MLE under Gaussian noise.

- **Derive by hand:** Maximise log-likelihood to get weighted least squares.
- **Code from scratch (Python):** Fit a sensor calibration with weighted least squares.
- **Interactive lab / visual:** Points weighted by confidence pulling a fit line.
- **Test that proves it works:** WLS beats OLS when noise variance differs by axis.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Probability and Statistics (ETH)

## p04-l08 · Monte Carlo simulation

**Goal:** Estimate failure probabilities by brute force.

- **Derive by hand:** Law of large numbers; standard error ~ 1/sqrt(N).
- **Code from scratch (Python):** Estimate tolerance stack-up of a resistor divider with 5 percent parts.
- **Interactive lab / visual:** Histogram of divider output with spec limits.
- **Test that proves it works:** Result matches analytic worst case bounds.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l09 · Allan variance for IMUs

**Goal:** Characterise gyro noise and bias instability.

- **Derive by hand:** Allan deviation definition; slopes for white noise and random walk.
- **Code from scratch (Python):** Compute overlapping Allan deviation from a simulated gyro log.
- **Interactive lab / visual:** Log-log Allan plot with labelled slopes.
- **Test that proves it works:** Recovers injected angle random walk within 10 percent.
- **Pro / open-source tool it maps to:** allantools
- **Course mapping:** Probability and Statistics (ETH)

## p04-l10 · Random walks and coloured noise

**Goal:** Model bias drift and 1/f noise.

- **Derive by hand:** Random walk variance grows linearly; first-order Gauss-Markov process.
- **Code from scratch (Python):** Simulate white, pink and Gauss-Markov noise.
- **Interactive lab / visual:** Three noise traces with their spectra.
- **Test that proves it works:** PSD slopes match theory.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l11 · Hypothesis tests for acceptance

**Goal:** Decide if a part or sensor passes test with evidence.

- **Derive by hand:** t-test and chi-square; p-values and false acceptance.
- **Code from scratch (Python):** Write an acceptance test for a batch of load cells.
- **Interactive lab / visual:** Sliding threshold showing false accept and false reject rates.
- **Test that proves it works:** Test rejects a biased batch at the 5 percent level.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** Probability and Statistics (ETH)

## p04-l12 · Importance sampling and particles

**Goal:** Represent non-Gaussian beliefs with samples.

- **Derive by hand:** Weights w proportional to p/q; resampling algorithms.
- **Code from scratch (Python):** Implement systematic resampling.
- **Interactive lab / visual:** Particles shrinking and concentrating after resampling.
- **Test that proves it works:** Resampled distribution matches weights statistically.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)
