# Phase 12 · System Dynamics & Modelling

> Write the equations of motion for anything with mass, charge, heat or flow.

- **Lessons:** 18
- **Maps to:** System Modeling (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p12-l01 · Lumped-parameter modelling

**Goal:** Decide what to keep and what to ignore.

- **Derive by hand:** Energy storage elements and dissipators; model order.
- **Code from scratch (Python):** Sketch and simulate a lumped model of a coffee machine heater.
- **Interactive lab / visual:** Model complexity slider versus accuracy.
- **Test that proves it works:** Reduced model within 5 percent of full.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** System Modeling (ETH)

## p12-l02 · Translational mechanical systems

**Goal:** Model carts, suspensions and stages.

- **Derive by hand:** Newton's second law with free-body diagrams.
- **Code from scratch (Python):** Simulate a two-mass suspension.
- **Interactive lab / visual:** Quarter-car on a bumpy road.
- **Test that proves it works:** Natural frequencies match eigenvalues.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l03 · Rotational mechanical systems

**Goal:** Model shafts, gears and flywheels.

- **Derive by hand:** J w' = sum of torques; torsional stiffness.
- **Code from scratch (Python):** Simulate a motor-shaft-load with compliance.
- **Interactive lab / visual:** Twisting shaft visual.
- **Test that proves it works:** Resonance appears at predicted frequency.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l04 · Lagrangian mechanics

**Goal:** Derive equations of motion without free-body diagrams.

- **Derive by hand:** L = T - V; Euler-Lagrange equations.
- **Code from scratch (Python):** Derive the double pendulum equations with SymPy.
- **Interactive lab / visual:** Chaotic double pendulum.
- **Test that proves it works:** Energy conserved without damping.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** System Modeling (ETH)

## p12-l05 · Electrical-mechanical analogies

**Goal:** Use one toolkit for all domains.

- **Derive by hand:** Force-voltage and force-current analogies.
- **Code from scratch (Python):** Map a mass-spring to RLC and verify.
- **Interactive lab / visual:** Two systems in lockstep.
- **Test that proves it works:** Responses identical after scaling.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** System Modeling (ETH)

## p12-l06 · Electromechanical coupling

**Goal:** Model a DC motor driving a load end to end.

- **Derive by hand:** Power conservation: k_t = k_e in SI units.
- **Code from scratch (Python):** Build a full motor plus gearbox plus load model.
- **Interactive lab / visual:** Motor driving a flywheel. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Energy balance closes within 1 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l07 · Fluid and thermal systems

**Goal:** Model tanks, pipes and heaters.

- **Derive by hand:** Hydraulic capacitance and resistance; thermal RC.
- **Code from scratch (Python):** Simulate an irrigation tank fill and drain.
- **Interactive lab / visual:** Tank level animation.
- **Test that proves it works:** Steady state matches flow balance.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Bali

## p12-l08 · Block diagrams and algebra

**Goal:** Reduce interconnected systems.

- **Derive by hand:** Series, parallel, feedback reduction; Mason's rule.
- **Code from scratch (Python):** Implement block diagram reduction.
- **Interactive lab / visual:** Blocks merging step by step.
- **Test that proves it works:** Matches python-control interconnect.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l09 · State-space models

**Goal:** Write any linear model as x' = Ax + Bu.

- **Derive by hand:** Choice of states; transfer function to state space.
- **Code from scratch (Python):** Convert TFs to controllable canonical form.
- **Interactive lab / visual:** State trajectories in 3D.
- **Test that proves it works:** TF from your SS matches original.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l10 · Linearising nonlinear models

**Goal:** Get A, B, C, D at an operating point.

- **Derive by hand:** Jacobians at equilibrium.
- **Code from scratch (Python):** Linearise a nonlinear tank system automatically.
- **Interactive lab / visual:** Nonlinear vs linear overlay.
- **Test that proves it works:** Errors small near operating point.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l11 · Cart-pole equations of motion

**Goal:** Derive the classic inverted pendulum.

- **Derive by hand:** Lagrangian of cart and pole; coupled nonlinear ODEs.
- **Code from scratch (Python):** Simulate cart-pole with RK4.
- **Interactive lab / visual:** Pendulum falling from near upright. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Energy conserved when frictionless.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** System Modeling (ETH)

## p12-l12 · Self-balancing robot model

**Goal:** Model a two-wheeled balancing robot.

- **Derive by hand:** Wheel and body coupling; motor torque input.
- **Code from scratch (Python):** Derive and simulate the wheeled inverted pendulum.
- **Interactive lab / visual:** Wheeled robot falling with no control. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Linear model unstable with expected pole.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** System Modeling (ETH)

## p12-l13 · Quadrotor rigid-body dynamics

**Goal:** Model a drone.

- **Derive by hand:** Newton-Euler for a rigid body; thrust and torque mixing.
- **Code from scratch (Python):** Simulate a quadrotor in 3D.
- **Interactive lab / visual:** Drone hovering open-loop and drifting. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Hover thrust equals m g.
- **Pro / open-source tool it maps to:** Gazebo
- **Course mapping:** System Modeling (ETH)

## p12-l14 · Train longitudinal dynamics

**Goal:** Model a train on a gradient, inspired by Swiss mountain rail.

- **Derive by hand:** Davis resistance equation; grade force m g sin(theta); traction limit by adhesion.
- **Code from scratch (Python):** Simulate a train climbing a steep grade with adhesion limit.
- **Interactive lab / visual:** Train on a slope with traction and resistance arrows.
- **Test that proves it works:** Wheel slip predicted when demand exceeds adhesion.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Switzerland

## p12-l15 · Oscillators and escapements

**Goal:** Model a mechanical watch balance as a timekeeper.

- **Derive by hand:** Balance wheel as torsional oscillator; isochronism and amplitude.
- **Code from scratch (Python):** Simulate a balance wheel with periodic impulses.
- **Interactive lab / visual:** Balance wheel ticking in 3D.
- **Test that proves it works:** Period nearly independent of amplitude for linear spring.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Switzerland

## p12-l16 · Step-response system identification

**Goal:** Fit models to experiments.

- **Derive by hand:** First- and second-order fitting from rise time and overshoot.
- **Code from scratch (Python):** Fit a motor model from a step log.
- **Interactive lab / visual:** Fitted versus measured overlay.
- **Test that proves it works:** Parameters within 5 percent.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** System Modeling (ETH)

## p12-l17 · Frequency-response identification

**Goal:** Measure a Bode plot with a chirp.

- **Derive by hand:** Empirical transfer function estimate H = Syu/Suu.
- **Code from scratch (Python):** Identify a plant from chirp data.
- **Interactive lab / visual:** Measured Bode overlay.
- **Test that proves it works:** Matches true plant within 1 dB in band.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** System Modeling (ETH)

## p12-l18 · Model validation

**Goal:** Decide whether a model is good enough.

- **Derive by hand:** Residual whiteness and cross-validation.
- **Code from scratch (Python):** Validate an identified model on new data.
- **Interactive lab / visual:** Residual autocorrelation plot.
- **Test that proves it works:** Residuals pass a whiteness test.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** System Modeling (ETH)
