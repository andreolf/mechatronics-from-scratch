# Phase 09 · Actuators: Motors, Drives & Fluid Power

> Model and drive the things that move: DC, stepper, BLDC, solenoids, cylinders and pumps.

- **Lessons:** 20
- **Maps to:** Electric drives (generic) (generic topic, not an exact ETH title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p09-l01 · Electromagnetism for actuators

**Goal:** Derive force and back-EMF from first principles.

- **Derive by hand:** Lorentz force F = B I L; Faraday's law e = -d phi/dt.
- **Code from scratch (Python):** Compute force on a coil in a magnetic gap.
- **Interactive lab / visual:** Coil in a field with force arrows.
- **Test that proves it works:** Force scales linearly with current.
- **Pro / open-source tool it maps to:** FEMM
- **Course mapping:** Electric drives (generic) (generic)

## p09-l02 · The brushed DC motor model

**Goal:** Write the two equations of every DC motor.

- **Derive by hand:** L di/dt = V - R i - k w; J dw/dt = k i - b w - T_load.
- **Code from scratch (Python):** Simulate a DC motor step response.
- **Interactive lab / visual:** Spinning rotor with current and speed traces. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Steady-state speed matches V/k minus load effect.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l03 · Identifying DC motor parameters

**Goal:** Measure R, L, k, J and b on the bench.

- **Derive by hand:** Locked-rotor tests; no-load speed; spin-down for J/b.
- **Code from scratch (Python):** Fit parameters from synthetic test data.
- **Interactive lab / visual:** Fitted versus measured curves.
- **Test that proves it works:** Parameters recovered within 5 percent.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Electric drives (generic) (generic)

## p09-l04 · Torque-speed curves

**Goal:** Pick operating points and avoid stall.

- **Derive by hand:** Linear torque-speed line; peak power at half no-load speed.
- **Code from scratch (Python):** Plot torque-speed and efficiency maps.
- **Interactive lab / visual:** Operating point moving with load.
- **Test that proves it works:** Peak power at half no-load speed.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l05 · Gearboxes and reflected inertia

**Goal:** Match a motor to a load.

- **Derive by hand:** J_reflected = J_load/N^2; optimal gear ratio sqrt(J_load/J_motor).
- **Code from scratch (Python):** Compute optimal ratio for a robot joint.
- **Interactive lab / visual:** Acceleration versus ratio curve.
- **Test that proves it works:** Optimum matches formula.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l06 · H-bridges and PWM

**Goal:** Drive a motor in both directions.

- **Derive by hand:** Average voltage = D Vbus; current ripple ~ V/(L f).
- **Code from scratch (Python):** Simulate an H-bridge with PWM and dead time.
- **Interactive lab / visual:** Four switches lighting in sequence with current arrows.
- **Test that proves it works:** Ripple matches estimate.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electric drives (generic) (generic)

## p09-l07 · Current control loop

**Goal:** Control torque by controlling current.

- **Derive by hand:** Inner PI loop on L/R plant; bandwidth choice.
- **Code from scratch (Python):** Design a current PI by pole-zero cancellation.
- **Interactive lab / visual:** Current tracking a torque command.
- **Test that proves it works:** Bandwidth within 10 percent of design.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l08 · Stepper motors

**Goal:** Position open-loop with steps and microsteps.

- **Derive by hand:** Step angle; holding torque; sinusoidal microstepping currents.
- **Code from scratch (Python):** Generate full, half and microstep current tables.
- **Interactive lab / visual:** Rotor snapping step by step.
- **Test that proves it works:** Microstep current vector magnitude constant.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l09 · Stepper resonance and missed steps

**Goal:** Understand why steppers stall mid-speed.

- **Derive by hand:** Rotor as torsional spring-mass; pull-out torque.
- **Code from scratch (Python):** Simulate missed steps when acceleration is too high.
- **Interactive lab / visual:** Rotor lagging and slipping a step.
- **Test that proves it works:** Detects missed steps when load exceeds pull-out torque.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l10 · BLDC six-step commutation

**Goal:** Spin a brushless motor with Hall feedback.

- **Derive by hand:** Trapezoidal back-EMF; commutation table.
- **Code from scratch (Python):** Implement six-step commutation logic.
- **Interactive lab / visual:** Rotating magnetic field vector stepping around.
- **Test that proves it works:** Correct direction for both rotations.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l11 · Clarke and Park transforms

**Goal:** See three-phase currents as two DC values.

- **Derive by hand:** Derive abc to alpha-beta to dq transforms.
- **Code from scratch (Python):** Implement Clarke, Park and inverses.
- **Interactive lab / visual:** Rotating phasors becoming fixed dq vectors.
- **Test that proves it works:** Round-trip error below 1e-12.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l12 · Field-oriented control

**Goal:** Get smooth torque from a PMSM.

- **Derive by hand:** Torque ~ (3/2) p psi i_q; decoupled dq current loops.
- **Code from scratch (Python):** Simulate FOC of a PMSM with dq PI loops.
- **Interactive lab / visual:** Rotor and stator field vectors at 90 degrees.
- **Test that proves it works:** Torque ripple far below six-step.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l13 · RC servos

**Goal:** Use a hobby servo correctly.

- **Derive by hand:** 50 Hz PWM pulse width to angle; internal P loop.
- **Code from scratch (Python):** Model a servo and its deadband.
- **Interactive lab / visual:** Servo horn following pulse width.
- **Test that proves it works:** Angle within 2 degrees of command.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l14 · Solenoids and relays

**Goal:** Drive linear on/off actuators.

- **Derive by hand:** Force ~ i^2 dL/dx; pull-in versus hold current.
- **Code from scratch (Python):** Simulate a solenoid with peak-and-hold drive.
- **Interactive lab / visual:** Plunger snapping in with current trace.
- **Test that proves it works:** Hold mode cuts power by more than 50 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electric drives (generic) (generic)

## p09-l15 · Lead screws and linear actuators

**Goal:** Convert rotation to precise linear motion.

- **Derive by hand:** Lead, efficiency and back-driving condition.
- **Code from scratch (Python):** Compute force and back-drivability.
- **Interactive lab / visual:** Nut traversing a screw.
- **Test that proves it works:** Matches efficiency equation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l16 · Pneumatics: cylinders and valves

**Goal:** Model compressible actuators.

- **Derive by hand:** F = p A; orifice flow; air as a spring.
- **Code from scratch (Python):** Simulate a cylinder extending with a valve.
- **Interactive lab / visual:** Piston extending with pressure colour.
- **Test that proves it works:** Extension time matches flow estimate.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** Electric drives (generic) (generic)

## p09-l17 · Hydraulics basics

**Goal:** Lift heavy loads.

- **Derive by hand:** Pascal's law; flow continuity; pressure losses.
- **Code from scratch (Python):** Size a hydraulic cylinder for a lift.
- **Interactive lab / visual:** Pressure distribution in a circuit.
- **Test that proves it works:** Force and speed meet spec.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** Electric drives (generic) (generic)

## p09-l18 · Pumps and pump curves

**Goal:** Drive an irrigation pump efficiently, e.g. in Bali rice terraces.

- **Derive by hand:** Pump curve intersect system curve; affinity laws.
- **Code from scratch (Python):** Find operating point and energy with a VFD.
- **Interactive lab / visual:** Operating point sliding as speed changes.
- **Test that proves it works:** Affinity laws hold in simulation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)
- **Real-world anchor:** Bali

## p09-l19 · Motor thermal model

**Goal:** Avoid cooking windings.

- **Derive by hand:** Two-node thermal RC; I^2 R heating.
- **Code from scratch (Python):** Simulate winding temperature under duty cycle.
- **Interactive lab / visual:** Coil heating and cooling colour.
- **Test that proves it works:** Steady temperature matches thermal resistance.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l20 · Sizing a scooter hub motor

**Goal:** Size a motor for a Bali scooter climb.

- **Derive by hand:** Road load: rolling, aero and grade forces; power = F v.
- **Code from scratch (Python):** Compute torque and power for a given grade and speed.
- **Interactive lab / visual:** Scooter on adjustable slope with power gauge.
- **Test that proves it works:** Requirements consistent with energy per km estimate.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)
- **Real-world anchor:** Bali
