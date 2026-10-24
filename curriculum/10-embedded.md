# Phase 10 · Embedded Systems & Microcontrollers

> Bare-metal C on a Cortex-M: registers, timers, interrupts, PWM, ADC, DMA.

- **Lessons:** 22
- **Maps to:** Embedded Systems (ETH Zurich course title)
- **Main tool:** PlatformIO · **Default language:** C

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p10-l01 · Microcontroller architecture

**Goal:** Know what is inside a Cortex-M MCU.

- **Derive by hand:** Harvard bus, registers, pipeline; cycles per instruction.
- **Code from scratch (C):** Count cycles of a loop with the DWT cycle counter.
- **Interactive lab / visual:** Block diagram of core, buses and peripherals.
- **Test that proves it works:** Cycle count matches expected instruction count.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l02 · Toolchain: compile, link, flash

**Goal:** Build firmware without an IDE.

- **Derive by hand:** Object files, symbols, sections; ELF to BIN.
- **Code from scratch (C):** Write a Makefile for arm-none-eabi-gcc and flash with OpenOCD.
- **Interactive lab / visual:** Build pipeline animation from .c to flash.
- **Test that proves it works:** make produces a binary that boots in QEMU or on a board.
- **Pro / open-source tool it maps to:** arm-none-eabi-gcc
- **Course mapping:** Embedded Systems (ETH)

## p10-l03 · Memory map and linker scripts

**Goal:** Place code and data correctly.

- **Derive by hand:** .text, .data, .bss, stack and heap layout.
- **Code from scratch (C):** Write a minimal linker script.
- **Interactive lab / visual:** Memory bar showing sections.
- **Test that proves it works:** Map file shows sections at expected addresses.
- **Pro / open-source tool it maps to:** arm-none-eabi-gcc
- **Course mapping:** Embedded Systems (ETH)

## p10-l04 · Startup code and the vector table

**Goal:** Boot an MCU from reset.

- **Derive by hand:** Reset vector, .data copy, .bss zeroing.
- **Code from scratch (C):** Write startup.c from scratch.
- **Interactive lab / visual:** Step through reset to main.
- **Test that proves it works:** Global variables initialised correctly in test.
- **Pro / open-source tool it maps to:** QEMU
- **Course mapping:** Embedded Systems (ETH)

## p10-l05 · GPIO by registers

**Goal:** Blink an LED with no library.

- **Derive by hand:** Memory-mapped registers; read-modify-write.
- **Code from scratch (C):** Toggle a GPIO by writing MODER and ODR.
- **Interactive lab / visual:** LED blinking with register bits shown.
- **Test that proves it works:** Logic analyser shows the expected period.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l06 · Bit manipulation and volatile

**Goal:** Write correct register code.

- **Derive by hand:** Masks, shifts; why volatile matters.
- **Code from scratch (C):** Implement SET_BIT, CLEAR_BIT and field macros with tests.
- **Interactive lab / visual:** Bits flipping in a register view.
- **Test that proves it works:** Host unit tests pass for all field widths.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l07 · Clock tree and PLL

**Goal:** Run the core at the right frequency.

- **Derive by hand:** f_out = f_in N/(M P); flash wait states.
- **Code from scratch (C):** Configure the PLL for a target frequency.
- **Interactive lab / visual:** Clock tree diagram with dividers.
- **Test that proves it works:** Measured SysTick period matches.
- **Pro / open-source tool it maps to:** STM32CubeMX
- **Course mapping:** Embedded Systems (ETH)

## p10-l08 · Timers and counters

**Goal:** Generate precise time bases.

- **Derive by hand:** f_update = f_clk/((PSC + 1)(ARR + 1)).
- **Code from scratch (C):** Configure a timer for a 1 kHz control tick.
- **Interactive lab / visual:** Counter sawtooth with update events.
- **Test that proves it works:** Tick frequency within 0.1 percent.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l09 · Interrupts and the NVIC

**Goal:** Respond to events in microseconds.

- **Derive by hand:** Priority, preemption, latency.
- **Code from scratch (C):** Write a timer ISR that runs the control loop.
- **Interactive lab / visual:** Main loop paused by ISR bars on a timeline.
- **Test that proves it works:** ISR jitter below 1 microsecond on a scope.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l10 · Race conditions and atomics

**Goal:** Share data between ISR and main safely.

- **Derive by hand:** Read-modify-write hazards; critical sections.
- **Code from scratch (C):** Demonstrate a torn 32-bit read and fix it.
- **Interactive lab / visual:** Interleaving timeline showing the race.
- **Test that proves it works:** Stress test finds no corruption after fix.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l11 · PWM generation

**Goal:** Drive motors and LEDs.

- **Derive by hand:** Duty = CCR/(ARR + 1); centre-aligned PWM.
- **Code from scratch (C):** Configure complementary PWM with dead time.
- **Interactive lab / visual:** PWM waveform with dead-time gap.
- **Test that proves it works:** Duty matches command within 1 count.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l12 · Input capture and encoder mode

**Goal:** Measure frequency and position in hardware.

- **Derive by hand:** Captured timestamps to period; hardware quadrature counting.
- **Code from scratch (C):** Configure encoder mode and compute speed.
- **Interactive lab / visual:** Encoder pulses filling a counter.
- **Test that proves it works:** Speed matches reference.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l13 · ADC sampling with DMA

**Goal:** Sample sensors without CPU load.

- **Derive by hand:** Sample time, conversion time and DMA circular buffers.
- **Code from scratch (C):** Sample 4 channels via DMA triggered by a timer.
- **Interactive lab / visual:** Buffer filling in a ring.
- **Test that proves it works:** Sample rate matches timer trigger.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l14 · DAC and waveform generation

**Goal:** Generate analog test signals.

- **Derive by hand:** Lookup tables and phase accumulators (DDS).
- **Code from scratch (C):** Generate a sine with DDS.
- **Interactive lab / visual:** Frequency changes with tuning word.
- **Test that proves it works:** Output frequency within 0.1 percent.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l15 · Watchdogs and brown-out

**Goal:** Recover from hangs and power dips.

- **Derive by hand:** Window watchdog timing.
- **Code from scratch (C):** Implement a watchdog that resets a hung loop.
- **Interactive lab / visual:** Countdown timer with kick events.
- **Test that proves it works:** Injected hang triggers reset.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l16 · Low-power modes

**Goal:** Run a sensor node on a battery.

- **Derive by hand:** Average current = sum duty times current.
- **Code from scratch (C):** Implement sleep-wake on an RTC alarm.
- **Interactive lab / visual:** Current profile over time.
- **Test that proves it works:** Battery-life estimate meets target.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l17 · Fixed-point versus FPU

**Goal:** Choose numerics for a control loop.

- **Derive by hand:** Cycle counts and accuracy trade-offs.
- **Code from scratch (C):** Benchmark Q15 and float PID on target.
- **Interactive lab / visual:** Bar chart of cycles.
- **Test that proves it works:** Both versions agree within tolerance.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l18 · Ring buffers

**Goal:** Pass bytes from ISRs to the main loop.

- **Derive by hand:** Head/tail indices, power-of-two masking.
- **Code from scratch (C):** Implement a lock-free SPSC ring buffer.
- **Interactive lab / visual:** Head and tail chasing on a circle.
- **Test that proves it works:** No lost bytes under stress test.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l19 · Super-loop versus scheduler

**Goal:** Structure firmware sanely.

- **Derive by hand:** Rate groups and loop timing budgets.
- **Code from scratch (C):** Refactor a super-loop into rate groups.
- **Interactive lab / visual:** Timeline of tasks per tick.
- **Test that proves it works:** All tasks meet their periods.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l20 · A cooperative scheduler from scratch

**Goal:** Build a tiny time-triggered scheduler.

- **Derive by hand:** Static schedule tables; hyperperiod.
- **Code from scratch (C):** Implement a time-triggered scheduler with overrun detection.
- **Interactive lab / visual:** Gantt chart of tasks.
- **Test that proves it works:** Overrun is detected and logged.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l21 · Debugging with GDB and SWD

**Goal:** Find bugs on real hardware.

- **Derive by hand:** Breakpoints, watchpoints, fault registers.
- **Code from scratch (C):** Decode a HardFault stack frame.
- **Interactive lab / visual:** Fault decoder walking stacked registers.
- **Test that proves it works:** Decoder identifies the faulting PC.
- **Pro / open-source tool it maps to:** OpenOCD
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l22 · Unit testing firmware on the host

**Goal:** Test embedded logic without hardware.

- **Derive by hand:** Hardware abstraction layers and fakes.
- **Code from scratch (C):** Write host tests with Unity and fake registers.
- **Interactive lab / visual:** Test report of passing cases.
- **Test that proves it works:** CI-ready test run passes.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)
