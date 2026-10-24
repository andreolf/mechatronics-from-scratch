`timescale 1ns/1ps
module full_adder(input a, b, c, output s, cout);
  wire p, g, t;
  xor #1 x1(p, a, b);
  and #1 a1(g, a, b);
  and #1 a2(t, p, c);
  or  #1 o1(cout, g, t);
  xor #1 x2(s, p, c);
endmodule

module adder4(input [3:0] a, b, output [3:0] s, output cout);
  wire [4:0] c;
  assign c[0] = 1'b0;
  genvar i;
  generate for (i = 0; i < 4; i = i + 1) begin : fa
    full_adder u(.a(a[i]), .b(b[i]), .c(c[i]), .s(s[i]), .cout(c[i+1]));
  end endgenerate
  assign cout = c[4];
endmodule

module tb;
  reg [3:0] a, b; wire [3:0] s; wire cout;
  integer i, j, errors = 0;
  adder4 dut(.a(a), .b(b), .s(s), .cout(cout));
  initial begin
    for (i = 0; i < 16; i = i + 1)
      for (j = 0; j < 16; j = j + 1) begin
        a = i; b = j; #20;                      // longer than the 9 ns worst-case ripple
        if ({cout, s} !== i + j) begin errors = errors + 1; $display("FAIL %0d + %0d = %0d", i, j, {cout, s}); end
      end
    if (errors == 0) $display("PASS: all 256 sums correct");
    $finish;
  end
endmodule
