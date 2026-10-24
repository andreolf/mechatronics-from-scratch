# Phase 19 · Power Electronics, Batteries & Safety

> Convert power efficiently, manage batteries and design machines that fail safe.

- **Lessons:** 22
- **Maps to:** Power Electronics (ETH Zurich course title)
- **Main tool:** ngspice · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p19-l01 · Switching versus linear power

**Goal:** See why switchers dominate.

- **Derive by hand:** Efficiency of linear versus switching conversion.
- **Code from scratch (Python):** Compare losses for a 12 V to 3.3 V conversion.
- **Interactive lab / visual:** Heat comparison.
- **Test that proves it works:** Switcher efficiency above 85 percent in model.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l02 · The buck converter

**Goal:** Derive the buck converter.

- **Derive by hand:** Volt-second balance: Vout = D Vin; ripple equations.
- **Code from scratch (Python):** Simulate an averaged and switched buck.
- **Interactive lab / visual:** Inductor current ripple.
- **Test that proves it works:** Ripple matches formula.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l03 · The boost converter

**Goal:** Step voltage up.

- **Derive by hand:** Vout = Vin/(1 - D).
- **Code from scratch (Python):** Simulate a boost converter.
- **Interactive lab / visual:** Voltage rising with duty.
- **Test that proves it works:** Matches formula in CCM.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l04 · Buck-boost and flyback

**Goal:** Isolate and invert.

- **Derive by hand:** Transformer turns ratio; energy storage in core.
- **Code from scratch (Python):** Simulate a flyback.
- **Interactive lab / visual:** Energy in and out of the core.
- **Test that proves it works:** Output matches ratio formula.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l05 · Converter control

**Goal:** Regulate output voltage.

- **Derive by hand:** Averaged small-signal model; type-II compensator.
- **Code from scratch (Python):** Design voltage-mode control.
- **Interactive lab / visual:** Load step response.
- **Test that proves it works:** Phase margin above 45 degrees.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Power Electronics (ETH)

## p19-l06 · MOSFET losses and thermal design

**Goal:** Keep switches cool.

- **Derive by hand:** Conduction plus switching losses; junction temperature.
- **Code from scratch (Python):** Compute losses and heatsink.
- **Interactive lab / visual:** Thermal network.
- **Test that proves it works:** Junction below limit.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)

## p19-l07 · Gate drivers and bootstrap

**Goal:** Drive high-side MOSFETs.

- **Derive by hand:** Bootstrap capacitor sizing.
- **Code from scratch (Python):** Size a bootstrap circuit.
- **Interactive lab / visual:** Bootstrap charging cycle.
- **Test that proves it works:** Droop within spec.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l08 · Three-phase inverters and SVPWM

**Goal:** Drive AC motors.

- **Derive by hand:** Space vector modulation geometry.
- **Code from scratch (Python):** Implement SVPWM.
- **Interactive lab / visual:** Hexagon with reference vector.
- **Test that proves it works:** Phase voltages match reference.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)

## p19-l09 · Regenerative braking

**Goal:** Recover energy, as in Swiss mountain rail and ski lifts.

- **Derive by hand:** Motor as generator; energy recovered = efficiency times potential energy.
- **Code from scratch (Python):** Simulate regen braking on a descent.
- **Interactive lab / visual:** Energy flowing back to the battery.
- **Test that proves it works:** Energy accounting closes.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)
- **Real-world anchor:** Switzerland

## p19-l10 · Lithium-ion cells

**Goal:** Understand what a cell is.

- **Derive by hand:** OCV curve, capacity, C-rate.
- **Code from scratch (Python):** Model OCV versus SOC.
- **Interactive lab / visual:** Cell with charge level.
- **Test that proves it works:** Model matches example data.
- **Pro / open-source tool it maps to:** PyBaMM
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l11 · Battery equivalent circuit model

**Goal:** Predict terminal voltage.

- **Derive by hand:** Thevenin model with RC pairs.
- **Code from scratch (Python):** Fit an ECM to a pulse test.
- **Interactive lab / visual:** Voltage relaxing after a pulse.
- **Test that proves it works:** Fit error below 10 mV.
- **Pro / open-source tool it maps to:** PyBaMM
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l12 · State of charge estimation

**Goal:** Estimate remaining energy, e.g. in an e-scooter pack.

- **Derive by hand:** Coulomb counting drift; EKF with ECM.
- **Code from scratch (Python):** Implement SOC EKF.
- **Interactive lab / visual:** SOC estimate converging.
- **Test that proves it works:** SOC error below 3 percent.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Bali

## p19-l13 · Battery management and balancing

**Goal:** Keep packs safe.

- **Derive by hand:** Passive balancing energy dissipation.
- **Code from scratch (Python):** Simulate passive balancing.
- **Interactive lab / visual:** Cells equalising.
- **Test that proves it works:** Cell spread reduced.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l14 · Charging: CC/CV

**Goal:** Charge cells correctly.

- **Derive by hand:** Constant current then constant voltage termination.
- **Code from scratch (Python):** Implement a CC/CV charger state machine.
- **Interactive lab / visual:** Charging curve.
- **Test that proves it works:** Never exceeds limits.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l15 · EMC basics

**Goal:** Avoid interference problems.

- **Derive by hand:** Loop area, dV/dt and coupling paths.
- **Code from scratch (Python):** Estimate radiated loop emissions qualitatively.
- **Interactive lab / visual:** Field around a current loop.
- **Test that proves it works:** Layout change reduces estimated coupling.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Power Electronics (ETH)

## p19-l16 · Hazard analysis and risk assessment

**Goal:** Identify hazards systematically.

- **Derive by hand:** Severity, exposure and probability; ISO 12100 process.
- **Code from scratch (Python):** Write a hazard log for a robot arm cell.
- **Interactive lab / visual:** Risk matrix.
- **Test that proves it works:** Every hazard has a mitigation.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l17 · Functional safety concepts

**Goal:** Understand safety integrity.

- **Derive by hand:** IEC 61508 and ISO 13849 concepts: SIL, PL, diagnostic coverage.
- **Code from scratch (Python):** Compute a simple PFH for a redundant channel.
- **Interactive lab / visual:** Redundant channels with diagnostics.
- **Test that proves it works:** Calculation consistent with formula.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l18 · Emergency stop and safe torque off

**Goal:** Stop machines safely.

- **Derive by hand:** Stop categories 0, 1 and 2; STO principle.
- **Code from scratch (Python):** Simulate a category-1 stop of a drive.
- **Interactive lab / visual:** Machine decelerating then torque removed.
- **Test that proves it works:** Stop time within spec.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l19 · Watchdogs, plausibility checks and fail-safe states

**Goal:** Detect faults at runtime.

- **Derive by hand:** Range, rate and cross-check monitors.
- **Code from scratch (Python):** Implement plausibility monitors for a sensor pair.
- **Interactive lab / visual:** Fault detection timeline.
- **Test that proves it works:** Detects injected faults within budget.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)
- **Real-world anchor:** Switzerland

## p19-l20 · FMEA

**Goal:** Analyse failure modes.

- **Derive by hand:** RPN = S x O x D and its limits.
- **Code from scratch (Python):** Write an FMEA for a self-balancing robot.
- **Interactive lab / visual:** FMEA table.
- **Test that proves it works:** Highest risks have actions.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l21 · Fault injection testing

**Goal:** Prove your safety logic works.

- **Derive by hand:** Coverage of fault classes.
- **Code from scratch (Python):** Inject faults into the simulation.
- **Interactive lab / visual:** Kill a motor and observe. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Safety reaction triggers each time.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l22 · Electrical safety and isolation

**Goal:** Protect people.

- **Derive by hand:** Creepage, clearance, isolation barriers.
- **Code from scratch (Python):** Check a design against isolation rules.
- **Interactive lab / visual:** Board with isolation gap.
- **Test that proves it works:** Rule checks pass.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Machine and functional safety (generic) (generic)
