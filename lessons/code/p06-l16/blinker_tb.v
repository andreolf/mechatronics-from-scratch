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
