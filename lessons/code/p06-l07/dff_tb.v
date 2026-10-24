`timescale 1ns/1ps
module dff(input clk, d, output reg q);
  always @(posedge clk) q <= d;
endmodule

module tb;
  reg clk = 0, d = 0; wire q; integer errors = 0; reg expected = 0;
  dff u(.clk(clk), .d(d), .q(q));
  always #5 clk = ~clk;                       // 10 ns period
  always @(posedge clk) expected <= d;
  initial begin
    #12 d = 1; #3 d = 0;                      // a short pulse between edges: must not appear on q
    #20 d = 1; #40 d = 0; #30;
    $finish;
  end
  always @(negedge clk) if (q !== expected) begin errors = errors + 1; $display("FAIL at %0t", $time); end
  final if (errors == 0) $display("PASS: q only changes on rising edges");
endmodule
