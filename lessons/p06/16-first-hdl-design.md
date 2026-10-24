---
id: p06-l16
minutes: 40
summary: Your first hardware description. You write a parameterised Verilog counter that divides a clock by 2^n, add a synchronised, debounced button that changes the blink rate, simulate it with a self-checking testbench in Icarus Verilog, and check that the output frequency is exactly f_clk/2^n.
---

## Describing hardware, not running code

Verilog looks like C but describes circuits that all run at once:

- `always @(posedge clk)` describes flip-flops. Every assignment inside it, written `q <= q + 1`, takes effect together at the clock edge (a **non-blocking** assignment).
- `assign y = a & b;` describes combinational logic: a wire that is always equal to its expression.
- A `module` is a component with ports. Instantiating one is placing a chip and wiring it up.

The synthesiser turns the description into the gates and flip-flops of lessons 3–8, and the FPGA tools place them and check timing (lesson 11). Before any of that, you **simulate**: a testbench drives the clock and inputs, watches the outputs and checks them automatically.

## A counter as a clock divider

An $N$-bit binary counter's bit $q[k]$ toggles every $2^k$ clock cycles, so its period is $2^{k+1}$ cycles:

$$f_{q[k]} = \frac{f_{clk}}{2^{k+1}}.$$

To blink an LED at about 1 Hz from a 12 MHz oscillator, pick $k$ so that $12\times10^6/2^{k+1} \approx 1$: $k = 23$ gives 0.715 Hz. For an exact frequency, count to a terminal value $M$ and reset instead (a modulo-$M$ counter); the period is then $2M$ cycles for a toggled output.

:::figure widget=clockdiv caption="The clock and counter bits q[0]..q[3]. Each bit divides the one above by two; pick a bit to see its period."
:::end

## Worked example

A blinker for a 12 MHz board, with a button that cycles through three speeds.

1. A 24-bit counter, with the LED on `q[23]`, `q[22]` or `q[21]`: 0.715, 1.43 or 2.86 Hz.
2. The button is asynchronous: two flip-flops synchronise it (lesson 11), then a counter debouncer (lesson 12) requires 2^16 stable cycles (5.5 ms at 12 MHz).
3. A rising edge of the debounced signal advances a 2-bit `speed` register: 0 → 1 → 2 → 0. That's a tiny FSM (lesson 8).
4. For simulation, the testbench sets small parameters (a 6-bit counter, 3-bit debounce) so the checks run in microseconds rather than seconds of simulated time. The same parameterised module synthesises with the real values.

## Code it from scratch

:::code file=blinker_tb.v
```verilog
`timescale 1ns/1ps
module blinker #(parameter W = 24, parameter DB = 16) (
    input  wire clk, rst, btn_async,
    output wire led,
    output reg  [1:0] speed
);
    reg [W-1:0] cnt;
    always @(posedge clk) cnt <= rst ? 0 : cnt + 1'b1;

    reg s1, s2;                                   // two-flop synchroniser
    always @(posedge clk) begin s1 <= btn_async; s2 <= s1; end

    reg [DB-1:0] db_cnt; reg btn, btn_prev;       // counter debouncer
    always @(posedge clk) begin
        if (rst) begin db_cnt <= 0; btn <= 0; btn_prev <= 0; end
        else begin
            btn_prev <= btn;
            if (s2 == btn) db_cnt <= 0;
            else if (&db_cnt) begin btn <= s2; db_cnt <= 0; end
            else db_cnt <= db_cnt + 1'b1;
        end
    end

    always @(posedge clk)                         // speed FSM, advance on a debounced press
        if (rst) speed <= 0;
        else if (btn && !btn_prev) speed <= (speed == 2) ? 2'd0 : speed + 1'b1;

    assign led = cnt[W - 1 - speed];
endmodule

module tb;
    localparam W = 6, DB = 3;
    reg clk = 0, rst = 1, btn = 0;
    wire led; wire [1:0] speed;
    integer errors = 0, edges, first, last, k;
    blinker #(.W(W), .DB(DB)) dut(.clk(clk), .rst(rst), .btn_async(btn), .led(led), .speed(speed));
    always #5 clk = ~clk;                         // 100 MHz in simulation time

    task measure_period(input integer expect_cycles);
        integer cyc; reg prev;
        begin
            edges = 0; first = 0; last = 0; prev = led;
            for (cyc = 0; cyc < 8 * expect_cycles; cyc = cyc + 1) begin
                @(posedge clk); #1;
                if (led && !prev) begin
                    if (edges == 0) first = cyc; last = cyc; edges = edges + 1;
                end
                prev = led;
            end
            if ((last - first) != (edges - 1) * expect_cycles) begin
                $display("FAIL speed %0d: %0d rising edges over %0d cycles, expected period %0d", speed, edges, last - first, expect_cycles);
                errors = errors + 1;
            end else $display("speed %0d: period %0d cycles = f_clk/%0d", speed, expect_cycles, expect_cycles);
        end
    endtask

    task press;                                   // a bouncy press: chatter, hold, chatter
        begin
            for (k = 0; k < 6; k = k + 1) begin btn = ~btn; #3; end
            btn = 1; #200;
            for (k = 0; k < 6; k = k + 1) begin btn = ~btn; #3; end
            btn = 0; #200;
        end
    endtask

    initial begin
        #22 rst = 0;
        measure_period(1 << W);                   // speed 0 uses cnt[W-1]
        press; if (speed != 1) begin $display("FAIL press 1 gave speed %0d", speed); errors = errors + 1; end
        measure_period(1 << (W - 1));
        press; if (speed != 2) begin $display("FAIL press 2 gave speed %0d", speed); errors = errors + 1; end
        measure_period(1 << (W - 2));
        press; if (speed != 0) begin $display("FAIL press 3 gave speed %0d", speed); errors = errors + 1; end
        if (errors == 0) $display("PASS"); else $display("FAIL %0d errors", errors);
        $finish;
    end
endmodule
```
:::end

The same frequency arithmetic in Python:

:::code file=divider.py
```python
f_clk = 12e6
rates = {k: f_clk / 2 ** (k + 1) for k in (21, 22, 23)}
assert abs(rates[23] - 0.715) < 0.001 and abs(rates[22] - 1.431) < 0.001 and abs(rates[21] - 2.861) < 0.001
debounce_ms = 2**16 / f_clk * 1e3
assert abs(debounce_ms - 5.46) < 0.01
M = int(f_clk / (2 * 1.0))          # modulo counter toggling the LED for exactly 1 Hz
assert M == 6_000_000 and (M - 1).bit_length() == 23
print(rates, f"debounce {debounce_ms:.2f} ms, modulo-{M} counter needs 23 bits")
```
:::end

## Exercises

:::exercise
Why does the testbench measure the period over several rising edges instead of trusting the first one?
:::solution
The first edge after reset or a speed change can come early, because the counter is already partway through its cycle. The steady-state spacing between later edges is the true period.
:::end

:::exercise
What happens if you use blocking assignments (`=`) in the synchroniser's `always` block?
:::solution
`s1 = btn_async; s2 = s1;` makes `s2` take the new value in the same clock edge. The two flops collapse into one, and the synchroniser no longer gives the first stage a cycle to resolve.
:::end

## Quiz

:::quiz
- type: num
  q: Blink frequency in Hz from bit q[23] of a counter on 12 MHz?
  answer: 0.71526
  tol: 0.001
  unit: Hz
  py: "12e6/2**24"
  explain: $f_{clk}/2^{k+1}$.
- type: num
  q: Period of q[3] in clock cycles?
  answer: 16
  tol: 0.001
  py: "2**4"
  explain: It toggles every 8 cycles.
- type: mc
  q: In Verilog, `q <= q + 1` inside `always @(posedge clk)` describes…
  options:
    - a loop that runs forever
    - a register updated at each clock edge
    - combinational logic
    - a delay
  answer: 1
  explain: A non-blocking assignment in a clocked block makes flip-flops.
- type: num
  q: Debounce time in ms for 2^16 cycles at 12 MHz?
  answer: 5.461
  tol: 0.002
  unit: ms
  py: "2**16/12e6*1000"
  explain: Cycles over clock rate.
- type: num
  q: Terminal count M for a toggled output of exactly 1 Hz from 12 MHz?
  answer: 6000000
  tol: 0.001
  py: "12e6/2"
  explain: Toggle every half period.
- type: mc
  q: A testbench is…
  options:
    - the synthesised circuit
    - simulation code that drives inputs and checks outputs automatically
    - the FPGA pin map
    - a timing report
  answer: 1
  explain: It never becomes hardware.
:::end

:::verify
assert 12e6/2**22 > 2.86
:::end
