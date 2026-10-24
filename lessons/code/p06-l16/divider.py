f_clk = 12e6
rates = {k: f_clk / 2 ** (k + 1) for k in (21, 22, 23)}
assert abs(rates[23] - 0.715) < 0.001 and abs(rates[22] - 1.431) < 0.001 and abs(rates[21] - 2.861) < 0.001
debounce_ms = 2**16 / f_clk * 1e3
assert abs(debounce_ms - 5.46) < 0.01
M = int(f_clk / (2 * 1.0))          # modulo counter toggling the LED for exactly 1 Hz
assert M == 6_000_000 and (M - 1).bit_length() == 23
print(rates, f"debounce {debounce_ms:.2f} ms, modulo-{M} counter needs 23 bits")
