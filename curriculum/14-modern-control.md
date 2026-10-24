# Phase 14 · Modern Control & Estimation

> State space, LQR, observers and Kalman filters: the core of drones and legged robots.

- **Lessons:** 18
- **Maps to:** Control Systems II (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p14-l01 · Matrix exponential and state solutions

**Goal:** Solve x' = Ax exactly.

- **Derive by hand:** x(t) = e^(At) x0 plus convolution with input.
- **Code from scratch (Python):** Compute e^(At) by eigen-decomposition and Pade.
- **Interactive lab / visual:** State trajectory from e^(At).
- **Test that proves it works:** Matches scipy.linalg.expm.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Linear System Theory (ETH)

## p14-l02 · Controllability

**Goal:** Know when inputs can move every state.

- **Derive by hand:** Controllability matrix rank.
- **Code from scratch (Python):** Test controllability of cart-pole and decoupled systems.
- **Interactive lab / visual:** Reachable set visual.
- **Test that proves it works:** Rank tests match theory.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l03 · Observability

**Goal:** Know when outputs reveal every state.

- **Derive by hand:** Observability matrix rank; duality.
- **Code from scratch (Python):** Test which sensors make cart-pole observable.
- **Interactive lab / visual:** Toggle sensors and see observability change.
- **Test that proves it works:** Rank tests match theory.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l04 · Pole placement

**Goal:** Put closed-loop poles where you want.

- **Derive by hand:** Ackermann's formula derivation.
- **Code from scratch (Python):** Implement Ackermann's formula.
- **Interactive lab / visual:** Drag desired poles and watch response.
- **Test that proves it works:** Closed-loop eigenvalues match targets.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)
- **Real-world anchor:** Switzerland

## p14-l05 · LQR from the Riccati equation

**Goal:** Derive optimal state feedback.

- **Derive by hand:** Minimise integral of x'Qx + u'Ru; derive continuous algebraic Riccati equation.
- **Code from scratch (Python):** Derive K = R^-1 B^T P.
- **Interactive lab / visual:** Cost versus Q/R trade-off.
- **Test that proves it works:** K matches python-control lqr.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l06 · Solving the Riccati equation

**Goal:** Compute P numerically yourself.

- **Derive by hand:** Hamiltonian matrix eigenvectors; iterative discrete Riccati.
- **Code from scratch (Python):** Implement Riccati iteration.
- **Interactive lab / visual:** Convergence of P.
- **Test that proves it works:** Matches scipy solve_continuous_are.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Control Systems II (ETH)

## p14-l07 · LQR on the cart-pole

**Goal:** Balance the pendulum optimally.

- **Derive by hand:** Linear model at upright; weight choice.
- **Code from scratch (Python):** Simulate LQR on the nonlinear cart-pole.
- **Interactive lab / visual:** Compare LQR versus PID recovery. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Stabilises from 15 degrees.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l08 · Integral action in state feedback

**Goal:** Remove steady-state error with LQR.

- **Derive by hand:** Augmented state with integral of error.
- **Code from scratch (Python):** Design LQI for a motor.
- **Interactive lab / visual:** Tracking error vanishing.
- **Test that proves it works:** Zero steady-state error.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l09 · Luenberger observers

**Goal:** Estimate unmeasured states.

- **Derive by hand:** Error dynamics A - LC; dual pole placement.
- **Code from scratch (Python):** Implement an observer for cart-pole velocities.
- **Interactive lab / visual:** True versus estimated states.
- **Test that proves it works:** Estimation error converges.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l10 · The separation principle

**Goal:** Combine observer and controller.

- **Derive by hand:** Block-triangular closed-loop matrix.
- **Code from scratch (Python):** Simulate observer-based control.
- **Interactive lab / visual:** Eigenvalues of combined system.
- **Test that proves it works:** Eigenvalues are union of designs.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l11 · Discrete-time LQR

**Goal:** Implement LQR in firmware.

- **Derive by hand:** Discrete Riccati equation.
- **Code from scratch (Python):** Discretise and design DLQR.
- **Interactive lab / visual:** Discrete versus continuous response.
- **Test that proves it works:** Matches python-control dlqr.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l12 · Kalman filter derivation

**Goal:** Derive the optimal linear estimator.

- **Derive by hand:** Predict and update; minimise trace of posterior covariance.
- **Code from scratch (Python):** Implement a Kalman filter class.
- **Interactive lab / visual:** Covariance ellipses predicting and updating.
- **Test that proves it works:** Errors consistent with covariance (NEES test).
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l13 · Kalman filter tracking

**Goal:** Track position and velocity from noisy positions.

- **Derive by hand:** Constant velocity model.
- **Code from scratch (Python):** Track a scooter from noisy GPS-like fixes.
- **Interactive lab / visual:** Track with uncertainty ellipses.
- **Test that proves it works:** RMS error below raw measurements.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Bali

## p14-l14 · Tuning Q and R

**Goal:** Make the filter trust the right things.

- **Derive by hand:** Innovation statistics; NIS test.
- **Code from scratch (Python):** Tune Q and R from logs.
- **Interactive lab / visual:** Innovation plot with bounds.
- **Test that proves it works:** NIS within chi-square bounds.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l15 · Extended Kalman filter

**Goal:** Estimate nonlinear systems.

- **Derive by hand:** Linearise process and measurement with Jacobians.
- **Code from scratch (Python):** Implement an EKF for a pendulum with angle measurement.
- **Interactive lab / visual:** EKF tracking a swinging pendulum.
- **Test that proves it works:** Converges from wrong initial state.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l16 · Unscented Kalman filter

**Goal:** Handle strong nonlinearities.

- **Derive by hand:** Sigma points and unscented transform.
- **Code from scratch (Python):** Implement UKF and compare to EKF.
- **Interactive lab / visual:** Sigma points flowing through a nonlinearity.
- **Test that proves it works:** UKF beats EKF on strong nonlinearity.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l17 · Attitude estimation: complementary versus Kalman

**Goal:** Pick a filter for an IMU.

- **Derive by hand:** Quaternion EKF; Mahony-style complementary filter.
- **Code from scratch (Python):** Implement both on simulated IMU data.
- **Interactive lab / visual:** Kill the IMU filter and watch attitude drift. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Both track; filter disabled shows drift.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Switzerland

## p14-l18 · Model predictive control

**Goal:** Control with constraints.

- **Derive by hand:** Receding horizon QP formulation.
- **Code from scratch (Python):** Implement unconstrained MPC then add box constraints with a QP.
- **Interactive lab / visual:** Predicted trajectory window sliding.
- **Test that proves it works:** Constraints respected in simulation.
- **Pro / open-source tool it maps to:** CVXPY
- **Course mapping:** Model Predictive Control (ETH)
