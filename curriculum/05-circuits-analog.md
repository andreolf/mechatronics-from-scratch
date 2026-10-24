# Phase 05 · Circuits & Analog Electronics

> From Ohm's law to your own tiny SPICE: analyse, simulate, then build on a PCB.

- **Lessons:** 23
- **Maps to:** Electrical engineering I and II (generic) (generic topic, not an exact ETH title)
- **Main tool:** ngspice · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p05-l01 · Charge, current, voltage and power

**Goal:** Ground the four quantities in energy flow.

- **Derive by hand:** P = V I; energy as integral of power; sign conventions.
- **Code from scratch (Python):** Compute power and energy from a logged motor current and voltage.
- **Interactive lab / visual:** Animated electrons and power meter on a simple loop.
- **Test that proves it works:** Energy integral matches a known battery discharge.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l02 · Ohm's law and resistor networks

**Goal:** Reduce networks and size resistors.

- **Derive by hand:** Series and parallel rules derived from KVL/KCL; divider formula.
- **Code from scratch (Python):** Write a resistor-network reducer for series-parallel graphs.
- **Interactive lab / visual:** Drag resistors into a network and read equivalent resistance.
- **Test that proves it works:** Matches ngspice operating point.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l03 · Kirchhoff's laws and nodal analysis

**Goal:** Solve any linear DC circuit systematically.

- **Derive by hand:** KCL at each node gives G v = i; modified nodal analysis for voltage sources.
- **Code from scratch (Python):** Build an MNA solver that parses a small netlist.
- **Interactive lab / visual:** Node voltages colour the circuit as you change values.
- **Test that proves it works:** Agrees with ngspice .op on five test circuits.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l04 · Thevenin and Norton equivalents

**Goal:** Simplify a sensor front end to one source and one resistor.

- **Derive by hand:** Derive V_th as open-circuit voltage and R_th by source deactivation.
- **Code from scratch (Python):** Compute Thevenin equivalents from your MNA solver.
- **Interactive lab / visual:** Load-line plot with maximum power transfer point.
- **Test that proves it works:** Load voltages match full circuit for any R_load.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l05 · Capacitors and RC transients

**Goal:** Time a debounce or an RC filter.

- **Derive by hand:** i = C dv/dt; tau = R C; energy 0.5 C v^2.
- **Code from scratch (Python):** Simulate RC charge and discharge with your ODE harness.
- **Interactive lab / visual:** Capacitor filling while a scope trace draws.
- **Test that proves it works:** Matches ngspice .tran within 1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l06 · Inductors and RL transients

**Goal:** Understand why motor coils kick back.

- **Derive by hand:** v = L di/dt; tau = L/R; flyback voltage when current is interrupted.
- **Code from scratch (Python):** Simulate switching an inductive load with and without a flyback diode.
- **Interactive lab / visual:** Spark animation and voltage spike when the switch opens.
- **Test that proves it works:** Spike magnitude predicted from L di/dt.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l07 · RLC circuits and resonance

**Goal:** Connect electrical and mechanical oscillators.

- **Derive by hand:** Series RLC ODE; wn = 1/sqrt(LC), Q factor.
- **Code from scratch (Python):** Simulate RLC step responses and find resonance.
- **Interactive lab / visual:** Electrical RLC and mass-spring side by side in lockstep.
- **Test that proves it works:** Measured resonance matches 1/(2 pi sqrt(LC)).
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l08 · AC analysis and impedance

**Goal:** Analyse circuits at a single frequency.

- **Derive by hand:** Z_R = R, Z_C = 1/(j w C), Z_L = j w L; phasor MNA.
- **Code from scratch (Python):** Extend the MNA solver to complex AC analysis.
- **Interactive lab / visual:** Impedance phasors rotating as frequency sweeps.
- **Test that proves it works:** Matches ngspice .ac magnitude and phase.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l09 · Bode plots of passive filters

**Goal:** Read gain and phase versus frequency.

- **Derive by hand:** Asymptotes: -20 dB/decade per pole; -3 dB at the corner.
- **Code from scratch (Python):** Generate Bode plots from your AC solver.
- **Interactive lab / visual:** Corner frequency marker that follows component values.
- **Test that proves it works:** -3 dB point at 1/(2 pi R C) to 1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l10 · Diodes and the Shockley equation

**Goal:** Solve the first nonlinear circuit with Newton's method.

- **Derive by hand:** I = Is(exp(V/(n Vt)) - 1); linearised companion model.
- **Code from scratch (Python):** Add a diode to the MNA solver with Newton iterations.
- **Interactive lab / visual:** I-V curve with operating point found by load line.
- **Test that proves it works:** Converges and matches ngspice operating point.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l11 · Rectifiers and flyback protection

**Goal:** Protect electronics from motors and relays.

- **Derive by hand:** Half and full-wave rectification; ripple ~ I/(f C).
- **Code from scratch (Python):** Simulate a bridge rectifier with smoothing capacitor.
- **Interactive lab / visual:** Ripple shrinks as you increase capacitance.
- **Test that proves it works:** Ripple matches I/(2 f C) estimate.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l12 · The BJT as a switch

**Goal:** Drive a relay or LED strip from a microcontroller pin.

- **Derive by hand:** Ic = beta Ib in active region; saturation design with overdrive factor.
- **Code from scratch (Python):** Compute base resistor for a 500 mA load and simulate.
- **Interactive lab / visual:** Transistor glowing between cutoff, active and saturation.
- **Test that proves it works:** Vce(sat) below 0.3 V in simulation.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l13 · The MOSFET as a switch

**Goal:** Switch motor current efficiently.

- **Derive by hand:** Rds(on) conduction loss I^2 R; gate charge Qg and switching time t = Qg/Ig.
- **Code from scratch (Python):** Estimate conduction and switching losses for a scooter-sized load.
- **Interactive lab / visual:** Gate voltage plateau animation during turn-on.
- **Test that proves it works:** Loss estimate within 15 percent of the simulation.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)
- **Real-world anchor:** Bali

## p05-l14 · Operational amplifier golden rules

**Goal:** Analyse op-amp circuits in seconds.

- **Derive by hand:** Ideal op-amp with negative feedback: V+ = V-, no input current.
- **Code from scratch (Python):** Derive and simulate a buffer and a summing amplifier.
- **Interactive lab / visual:** Op-amp internal gain slider showing when golden rules fail.
- **Test that proves it works:** Gains match -Rf/Rin within 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l15 · Inverting and non-inverting amplifiers

**Goal:** Scale a sensor signal into an ADC range.

- **Derive by hand:** Gain 1 + Rf/Rg; gain-bandwidth product limits.
- **Code from scratch (Python):** Design an amplifier mapping 0-50 mV to 0-3.3 V.
- **Interactive lab / visual:** Bandwidth shrinks as you raise gain.
- **Test that proves it works:** Meets range spec over a Monte Carlo of 1 percent resistors.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l16 · Instrumentation amplifiers

**Goal:** Read a tiny bridge signal in a noisy machine.

- **Derive by hand:** Three-op-amp INA gain and common-mode rejection ratio.
- **Code from scratch (Python):** Simulate an INA with resistor mismatch and compute CMRR.
- **Interactive lab / visual:** Common-mode noise disappearing at the output.
- **Test that proves it works:** CMRR degrades as predicted by mismatch.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l17 · Active filters: Sallen-Key

**Goal:** Build anti-aliasing filters.

- **Derive by hand:** Derive the Sallen-Key transfer function; set Q and wc.
- **Code from scratch (Python):** Design a 2nd-order Butterworth lowpass at 500 Hz.
- **Interactive lab / visual:** Bode plot updating as you pick capacitor values.
- **Test that proves it works:** Q = 0.707 within 2 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l18 · Comparators and Schmitt triggers

**Goal:** Turn a noisy analog signal into a clean digital edge.

- **Derive by hand:** Hysteresis thresholds from positive feedback divider.
- **Code from scratch (Python):** Simulate noisy input with and without hysteresis.
- **Interactive lab / visual:** Chattering output that calms when hysteresis is added.
- **Test that proves it works:** Number of output edges equals true crossings with hysteresis.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l19 · Linear voltage regulators

**Goal:** Power a sensor cleanly.

- **Derive by hand:** Dropout, PSRR and dissipation P = (Vin - Vout) I.
- **Code from scratch (Python):** Compute regulator temperature rise from thermal resistance.
- **Interactive lab / visual:** Heat map on the regulator as load rises.
- **Test that proves it works:** Junction temperature estimate within datasheet limits.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l20 · Grounding, decoupling and noise

**Goal:** Stop motors from resetting your microcontroller.

- **Derive by hand:** Ground loops, L di/dt bounce; decoupling capacitor impedance.
- **Code from scratch (Python):** Simulate ground bounce with and without decoupling.
- **Interactive lab / visual:** Supply rail spike shrinking with decoupling.
- **Test that proves it works:** Rail droop below 5 percent with designed decoupling.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Electrical engineering I and II (generic) (generic)
- **Real-world anchor:** Switzerland

## p05-l21 · Wheatstone bridges

**Goal:** Measure tiny resistance changes from strain or temperature.

- **Derive by hand:** Derive bridge output for quarter, half and full bridge.
- **Code from scratch (Python):** Compute bridge sensitivity and nonlinearity.
- **Interactive lab / visual:** Bridge with a strain slider and output voltage.
- **Test that proves it works:** Full-bridge output linear within 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l22 · Build a mini SPICE (transient)

**Goal:** Combine MNA, companion models and an integrator.

- **Derive by hand:** Backward Euler companion models for C and L: G_eq = C/h.
- **Code from scratch (Python):** Implement transient analysis for R, C, L, diode netlists.
- **Interactive lab / visual:** Your SPICE and ngspice traces overlaid.
- **Test that proves it works:** Matches ngspice .tran on an RLC and a rectifier.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l23 · PCB design basics

**Goal:** Turn a schematic into a manufacturable board.

- **Derive by hand:** Trace width from current (IPC-2221 style estimate); return paths.
- **Code from scratch (Python):** Draw a motor driver breakout in KiCad and run DRC.
- **Interactive lab / visual:** 3D board view with current-carrying traces highlighted.
- **Test that proves it works:** KiCad DRC passes with zero errors.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Electrical engineering I and II (generic) (generic)
