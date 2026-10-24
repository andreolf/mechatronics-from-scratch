# Phase 06 · Digital Electronics & Logic

> Bits, gates, flip-flops and state machines, built from transistors upward.

- **Lessons:** 16
- **Maps to:** Digital Design and Computer Architecture (ETH Zurich course title)
- **Main tool:** Icarus Verilog · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p06-l01 · Number systems and two's complement

**Goal:** Read registers and sensor words correctly.

- **Derive by hand:** Positional notation; two's complement negation as invert-plus-one; overflow rules.
- **Code from scratch (Python):** Write encode/decode for signed 8/16/32-bit and detect overflow.
- **Interactive lab / visual:** Bit toggles that show the signed and unsigned value live.
- **Test that proves it works:** Round-trips all 16-bit values; overflow detected on edge cases.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l02 · Fixed-point arithmetic (Q formats)

**Goal:** Do fast maths on MCUs without an FPU.

- **Derive by hand:** Q15 scaling, multiplication with rounding and saturation.
- **Code from scratch (Python):** Implement Q15 add, mul and saturate; compare against floats.
- **Interactive lab / visual:** Error histogram of Q15 versus float multiplies.
- **Test that proves it works:** Max error below 2^-15 with rounding.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l03 · Boolean algebra and Karnaugh maps

**Goal:** Minimise logic for interlocks and decoders.

- **Derive by hand:** De Morgan; K-map grouping for sum-of-products.
- **Code from scratch (Python):** Implement Quine-McCluskey minimisation.
- **Interactive lab / visual:** K-map grid you click to set minterms, groups appear.
- **Test that proves it works:** Minimised expressions match truth tables.
- **Pro / open-source tool it maps to:** Logisim-evolution
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l04 · CMOS gates from transistors

**Goal:** See a gate as two switch networks.

- **Derive by hand:** Pull-up and pull-down duality; static power is near zero.
- **Code from scratch (Python):** Model NAND and NOR as switch graphs and evaluate them.
- **Interactive lab / visual:** Transistor switches lighting as inputs change.
- **Test that proves it works:** Truth tables match for all inputs.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l05 · Combinational building blocks

**Goal:** Build a mux, decoder and adder.

- **Derive by hand:** Ripple-carry adder delay; carry look-ahead derivation.
- **Code from scratch (Python):** Simulate a 4-bit ripple-carry and look-ahead adder at gate level.
- **Interactive lab / visual:** Carry propagating bit by bit with timing.
- **Test that proves it works:** Correct sums for all 256 input pairs.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l06 · Gate-level netlist simulator

**Goal:** Write an event-driven logic simulator.

- **Derive by hand:** Event queues, propagation delay, glitches.
- **Code from scratch (Python):** Implement an event-driven simulator for a netlist of gates.
- **Interactive lab / visual:** Waveform viewer with a visible glitch.
- **Test that proves it works:** Matches Icarus on the adder testbench.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l07 · Latches and flip-flops

**Goal:** Store a bit and understand clocking.

- **Derive by hand:** SR latch feedback; D flip-flop edge triggering.
- **Code from scratch (Python):** Simulate SR latch and D flip-flop in your simulator.
- **Interactive lab / visual:** Clock edges capturing data into a flip-flop.
- **Test that proves it works:** Output changes only on rising edges.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l08 · Finite state machines

**Goal:** Model a ski-lift gate or traffic light controller.

- **Derive by hand:** Moore versus Mealy; state transition tables and encoding.
- **Code from scratch (Python):** Implement a table-driven FSM for a lift-gate sequence with timeouts.
- **Interactive lab / visual:** State diagram highlighting the active state.
- **Test that proves it works:** Exhaustive input sequences never reach an unsafe state.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)
- **Real-world anchor:** Switzerland

## p06-l09 · Counters and quadrature decoding

**Goal:** Count encoder pulses and direction.

- **Derive by hand:** Gray-code style A/B phase states; x4 decoding.
- **Code from scratch (Python):** Implement a 4x quadrature decoder state machine.
- **Interactive lab / visual:** Rotating encoder disk with A/B traces and count.
- **Test that proves it works:** Counts match ground truth through direction reversals.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l10 · Shift registers

**Goal:** Expand outputs and serialise data.

- **Derive by hand:** Serial-in parallel-out timing; LFSR maximal length polynomials.
- **Code from scratch (Python):** Implement a 74HC595-style driver and an LFSR.
- **Interactive lab / visual:** Bits marching across a register.
- **Test that proves it works:** LFSR period equals 2^n - 1.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l11 · Timing, metastability and synchronisers

**Goal:** Cross clock domains safely.

- **Derive by hand:** Setup/hold windows; MTBF of a two-flop synchroniser.
- **Code from scratch (Python):** Simulate metastability probability versus synchroniser depth.
- **Interactive lab / visual:** Unsynchronised signal corrupting a counter.
- **Test that proves it works:** Two-flop synchroniser removes errors in simulation.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l12 · Debouncing

**Goal:** Read buttons and limit switches reliably.

- **Derive by hand:** Bounce as a noisy transient; integrator and timer debouncers.
- **Code from scratch (Python):** Implement counter-based debouncing on recorded bounce data.
- **Interactive lab / visual:** Bouncy contact trace with clean output beneath.
- **Test that proves it works:** Exactly one event per physical press.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l13 · Memory: SRAM, Flash and EEPROM

**Goal:** Choose where to store parameters and logs.

- **Derive by hand:** Endurance, wear levelling and page erase semantics.
- **Code from scratch (Python):** Simulate a wear-levelled parameter store on a flash model.
- **Interactive lab / visual:** Flash pages ageing with a heat map.
- **Test that proves it works:** Parameters survive simulated power loss mid-write.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l14 · ADC architectures: SAR

**Goal:** Understand what happens in an ADC conversion.

- **Derive by hand:** Binary search via a DAC and comparator; quantisation error.
- **Code from scratch (Python):** Implement a SAR ADC model and compute INL/DNL.
- **Interactive lab / visual:** Comparator decisions narrowing onto the input.
- **Test that proves it works:** Codes match ideal quantiser within 0.5 LSB.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l15 · DACs and the R-2R ladder

**Goal:** Generate analog voltages from bits.

- **Derive by hand:** Derive R-2R output by superposition.
- **Code from scratch (Python):** Model R-2R with resistor tolerance and plot DNL.
- **Interactive lab / visual:** Ladder lighting up per bit.
- **Test that proves it works:** Monotonicity holds with 0.1 percent resistors.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l16 · Your first HDL design

**Goal:** Blink an LED on an FPGA in Verilog.

- **Derive by hand:** Counter divides clock frequency f_out = f_clk/2^n.
- **Code from scratch (Python):** Write a Verilog blinker with testbench.
- **Interactive lab / visual:** Waveform of the divided clock.
- **Test that proves it works:** Testbench confirms period within one cycle.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)
