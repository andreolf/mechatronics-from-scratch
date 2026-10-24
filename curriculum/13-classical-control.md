# Phase 13 · Classical Control

> PID, root locus, Bode and Nyquist, derived then tuned on real simulations.

- **Lessons:** 20
- **Maps to:** Control Systems I (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p13-l01 · Why feedback works

**Goal:** Reduce sensitivity to unknowns.

- **Derive by hand:** Closed loop GK/(1 + GK); sensitivity to plant change.
- **Code from scratch (Python):** Compare open- and closed-loop response with 30 percent plant error.
- **Interactive lab / visual:** Plant gain slider, open loop drifts and closed loop holds.
- **Test that proves it works:** Closed loop error 10x smaller.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l02 · Open versus closed loop

**Goal:** See disturbance rejection in action.

- **Derive by hand:** Disturbance transfer function 1/(1 + GK).
- **Code from scratch (Python):** Simulate a motor under load step both ways.
- **Interactive lab / visual:** Load torque step with and without feedback. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Speed drop reduced by loop gain.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l03 · Stability and Routh-Hurwitz

**Goal:** Decide stability without computing roots.

- **Derive by hand:** Routh array derivation.
- **Code from scratch (Python):** Implement a Routh table with special cases.
- **Interactive lab / visual:** Gain slider with Routh sign changes.
- **Test that proves it works:** Agrees with root computations.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l04 · Steady-state error and system type

**Goal:** Predict tracking error.

- **Derive by hand:** Error constants Kp, Kv, Ka from final value theorem.
- **Code from scratch (Python):** Compute steady-state errors for step, ramp, parabola.
- **Interactive lab / visual:** Tracking error versus system type.
- **Test that proves it works:** Matches simulation.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l05 · Proportional control

**Goal:** Feel the trade-off of gain.

- **Derive by hand:** Closed-loop poles move with K.
- **Code from scratch (Python):** Tune P control of a motor.
- **Interactive lab / visual:** Overshoot grows with gain.
- **Test that proves it works:** Error equals 1/(1 + Kp) for type 0.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l06 · PI control and integral action

**Goal:** Remove steady-state error.

- **Derive by hand:** Integral adds a pole at origin.
- **Code from scratch (Python):** Add I to a speed controller.
- **Interactive lab / visual:** Error vanishing with integral on. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Zero steady-state error to a step.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l07 · PID control

**Goal:** Derive and tune the full PID.

- **Derive by hand:** u = Kp e + Ki integral e + Kd de/dt; each term's effect on poles.
- **Code from scratch (Python):** Implement continuous PID and tune on cart-pole angle.
- **Interactive lab / visual:** Switch P, I or D off and watch it fall. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Balances for 30 s with tuned gains.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)
- **Real-world anchor:** Switzerland

## p13-l08 · Derivative filtering

**Goal:** Keep D from amplifying noise.

- **Derive by hand:** Kd s/(Tf s + 1); derivative on measurement.
- **Code from scratch (Python):** Compare raw and filtered derivative under sensor noise.
- **Interactive lab / visual:** Noise slider shaking the actuator. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Actuator RMS drops with filter.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l09 · Integrator windup and anti-windup

**Goal:** Handle actuator saturation.

- **Derive by hand:** Back-calculation and clamping schemes.
- **Code from scratch (Python):** Implement both anti-windup schemes.
- **Interactive lab / visual:** Saturated motor with overshoot.
- **Test that proves it works:** Overshoot reduced with anti-windup.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l10 · Ziegler-Nichols and relay autotune

**Goal:** Tune without a model.

- **Derive by hand:** Ultimate gain and period; describing function of a relay.
- **Code from scratch (Python):** Implement relay autotuning.
- **Interactive lab / visual:** Limit cycle under relay.
- **Test that proves it works:** Estimated Ku within 10 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l11 · Root locus

**Goal:** See where poles go as gain rises.

- **Derive by hand:** Angle and magnitude conditions; asymptotes and breakaway.
- **Code from scratch (Python):** Implement root locus by sweeping gain.
- **Interactive lab / visual:** Poles tracing the locus as you drag K.
- **Test that proves it works:** Matches python-control root_locus.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l12 · Lead and lag compensators

**Goal:** Shape the response with poles and zeros.

- **Derive by hand:** Lead adds phase; lag raises low-frequency gain.
- **Code from scratch (Python):** Design a lead compensator for a servo.
- **Interactive lab / visual:** Bode and step updating as you move zero and pole.
- **Test that proves it works:** Meets phase margin spec.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l13 · Bode diagrams

**Goal:** Draw Bode plots by hand and by code.

- **Derive by hand:** Asymptotic construction from factors.
- **Code from scratch (Python):** Compute Bode from TFs.
- **Interactive lab / visual:** Asymptotes versus exact curves.
- **Test that proves it works:** Matches python-control bode.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l14 · The Nyquist criterion

**Goal:** Assess stability from frequency response.

- **Derive by hand:** Argument principle; N = Z - P.
- **Code from scratch (Python):** Plot Nyquist and count encirclements.
- **Interactive lab / visual:** Nyquist contour with critical point.
- **Test that proves it works:** Correctly predicts stability for 10 cases.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l15 · Gain and phase margins

**Goal:** Quantify robustness.

- **Derive by hand:** Definitions from crossover frequencies.
- **Code from scratch (Python):** Compute margins and verify with time-domain instability.
- **Interactive lab / visual:** Margins shrinking with delay.
- **Test that proves it works:** Instability occurs at predicted gain.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l16 · Sensitivity functions

**Goal:** Understand the waterbed.

- **Derive by hand:** S + T = 1; Bode sensitivity integral.
- **Code from scratch (Python):** Plot S and T for several controllers.
- **Interactive lab / visual:** Pushing S down in one band raises it elsewhere.
- **Test that proves it works:** Peak sensitivity linked to margins.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l17 · Time delay and the Smith predictor

**Goal:** Control processes with delay.

- **Derive by hand:** e^(-sT) phase lag; Pade approximation.
- **Code from scratch (Python):** Implement a Smith predictor.
- **Interactive lab / visual:** Delayed process with and without predictor.
- **Test that proves it works:** Predictor recovers delay-free performance with exact model.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l18 · Feedforward control

**Goal:** Use known disturbances and references.

- **Derive by hand:** Inverse plant feedforward; disturbance feedforward.
- **Code from scratch (Python):** Add gravity feedforward to an arm joint.
- **Interactive lab / visual:** Tracking error shrinking with feedforward.
- **Test that proves it works:** Error reduced over 50 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l19 · Cascade control

**Goal:** Nest current, speed and position loops.

- **Derive by hand:** Bandwidth separation of 5 to 10x per loop.
- **Code from scratch (Python):** Design a cascaded servo for a motor.
- **Interactive lab / visual:** Three loops tracking in sequence.
- **Test that proves it works:** Position loop stable with designed bandwidths.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l20 · Discrete PID in C

**Goal:** Ship the controller to an MCU.

- **Derive by hand:** Tustin or backward-Euler PID with filtered derivative.
- **Code from scratch (C):** Write a PID with anti-windup and unit tests.
- **Interactive lab / visual:** Firmware loop timing view.
- **Test that proves it works:** Matches Python reference within 1e-4.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Control Systems I (ETH)
