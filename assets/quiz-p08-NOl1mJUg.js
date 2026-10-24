var e={"p08-l01":[{id:`p08-l01-q1`,type:`mc`,q:`<p>The system y[n] = x[n] + 1 is…</p>
`,explain:`<p>An offset breaks superposition.</p>
`,options:[`non-causal`,`linear but time-varying`,`not linear, but time-invariant`,`linear and time-invariant`],answer:2},{id:`p08-l01-q2`,type:`mc`,q:`<p>An LTI system is completely described by…</p>
`,explain:`<p>Output = convolution with h.</p>
`,options:[`its step size`,`its DC gain`,`its order`,`its impulse response`],answer:3},{id:`p08-l01-q3`,type:`num`,q:`<p>Sum of the impulse response of y[n] = 0.9 y[n−1] + x[n]?</p>
`,explain:`<p>A geometric series.</p>
`,answer:10,tol:.001,unit:``},{id:`p08-l01-q4`,type:`mc`,q:`<p>A filter is FIR when…</p>
`,explain:`<p>No feedback.</p>
`,options:[`it has poles outside the unit circle`,`it uses future samples`,`it is unstable`,`all feedback coefficients a_k (k ≥ 1) are zero`],answer:3},{id:`p08-l01-q5`,type:`mc`,q:`<p>y[n] = n x[n] is…</p>
`,explain:`<p>The gain depends on n.</p>
`,options:[`non-causal`,`time-invariant`,`non-linear`,`time-varying`],answer:3},{id:`p08-l01-q6`,type:`num`,q:`<p>Output y[3] of y[n] = 0.9 y[n−1] + x[n] for a unit impulse at n = 0?</p>
`,explain:`<p>h[n] = 0.9ⁿ.</p>
`,answer:.729,tol:.001,unit:``}],"p08-l02":[{id:`p08-l02-q1`,type:`num`,q:`<p>Delay in samples of a 20-point moving average?</p>
`,explain:`<p>(N − 1)/2.</p>
`,answer:9.5,tol:.001,unit:`samples`},{id:`p08-l02-q2`,type:`num`,q:`<p>N for a first null at 50 Hz with f_s = 1 kHz?</p>
`,explain:`<p>Nulls at k f_s/N.</p>
`,answer:20,tol:.001,unit:``},{id:`p08-l02-q3`,type:`num`,q:`<p>Approximate −3 dB frequency in Hz for N = 20 at 1 kHz?</p>
`,explain:`<p>0.443 f_s/N.</p>
`,answer:22.15,tol:.01,unit:`Hz`},{id:`p08-l02-q4`,type:`num`,q:`<p>Noise variance reduction factor for N = 20 on white noise?</p>
`,explain:`<p>σ²/N.</p>
`,answer:20,tol:.001,unit:``},{id:`p08-l02-q5`,type:`mc`,q:`<p>The moving average’s first sidelobe is about…</p>
`,explain:`<p>A poor stopband.</p>
`,options:[`−13 dB`,`−100 dB`,`−60 dB`,`−40 dB`],answer:0},{id:`p08-l02-q6`,type:`mc`,q:`<p>A running-sum implementation costs per sample…</p>
`,explain:`<p>Add one, subtract one.</p>
`,options:[`O(N²)`,`O(log N)`,`O(N) operations`,`O(1) operations`],answer:3}],"p08-l03":[{id:`p08-l03-q1`,type:`num`,q:`<p>Exact coefficient a for τ = 20 ms and T_s = 1 ms?</p>
`,explain:`<p>e^(−T_s/τ).</p>
`,answer:.95123,tol:.001,unit:``},{id:`p08-l03-q2`,type:`num`,q:`<p>Backward-Euler coefficient for τ = 20 ms and T_s = 1 ms?</p>
`,explain:`<p>τ/(τ + T_s).</p>
`,answer:.95238,tol:.001,unit:``},{id:`p08-l03-q3`,type:`num`,q:`<p>Cutoff frequency in Hz for τ = 20 ms?</p>
`,explain:`<p>1/(2πτ).</p>
`,answer:7.9577,tol:.001,unit:`Hz`},{id:`p08-l03-q4`,type:`num`,q:`<p>Noise rms reduction factor √((1−a)/(1+a)) for a = 0.95123?</p>
`,explain:`<p>About T_s/(2τ) in variance.</p>
`,answer:.1581,tol:.003,unit:``},{id:`p08-l03-q5`,type:`mc`,q:`<p>The filter’s DC gain is…</p>
`,explain:`<p>a + (1 − a) = 1.</p>
`,options:[`1/(1 − a)`,`1 − a`,`1, because the coefficients sum to one`,`a`],answer:2},{id:`p08-l03-q6`,type:`num`,q:`<p>Settling time to 1 % in ms for τ = 20 ms?</p>
`,explain:`<p>τ ln 100.</p>
`,answer:92.103,tol:.002,unit:`ms`}],"p08-l04":[{id:`p08-l04-q1`,type:`num`,q:`<p>Kaiser β for 60 dB attenuation?</p>
`,explain:`<p>0.1102(A − 8.7).</p>
`,answer:5.6533,tol:.001,unit:``},{id:`p08-l04-q2`,type:`num`,q:`<p>Estimated Kaiser length for 60 dB and Δf = 0.05 (before rounding)?</p>
`,explain:`<p>(A − 8)/(2.285·2πΔf) + 1.</p>
`,answer:73.43,tol:.003,unit:``},{id:`p08-l04-q3`,type:`num`,q:`<p>Group delay in samples of a 75-tap linear-phase FIR?</p>
`,explain:`<p>(N − 1)/2.</p>
`,answer:37,tol:.001,unit:`samples`},{id:`p08-l04-q4`,type:`mc`,q:`<p>The Hamming window’s stopband is about…</p>
`,explain:`<p>Fixed, whatever N.</p>
`,options:[`−53 dB`,`−74 dB`,`−21 dB`,`−120 dB`],answer:0},{id:`p08-l04-q5`,type:`mc`,q:`<p>A symmetric FIR impulse response guarantees…</p>
`,explain:`<p>FIR is always stable; symmetry gives linear phase.</p>
`,options:[`minimum phase`,`stability and linear phase`,`zero delay`,`an infinite stopband`],answer:1},{id:`p08-l04-q6`,type:`num`,q:`<p>Design cutoff in cycles/sample for a 100–150 Hz transition at f_s = 1 kHz?</p>
`,explain:`<p>The middle of the transition.</p>
`,answer:.125,tol:.001,unit:``}],"p08-l05":[{id:`p08-l05-q1`,type:`num`,q:`<p>State variables per biquad in transposed direct form II?</p>
`,explain:`<p>s₁ and s₂.</p>
`,answer:2,tol:.001,unit:``},{id:`p08-l05-q2`,type:`num`,q:`<p>Biquads needed for an 8th-order filter?</p>
`,explain:`<p>Two poles per section.</p>
`,answer:4,tol:.001,unit:``},{id:`p08-l05-q3`,type:`mc`,q:`<p>High-order IIR filters are implemented as cascades because…</p>
`,explain:`<p>Local sensitivity per section.</p>
`,options:[`cascades have linear phase`,`they need fewer multiplies`,`scipy requires it`,`polynomial roots are very sensitive to coefficient rounding`],answer:3},{id:`p08-l05-q4`,type:`mc`,q:`<p>A biquad is stable when…</p>
`,explain:`<p>Poles inside |z| = 1.</p>
`,options:[`both poles lie inside the unit circle`,`a₁ &gt; 0`,`b₀ = 1`,`the zeros are on the unit circle`],answer:0},{id:`p08-l05-q5`,type:`num`,q:`<p>For a pole pair at radius r, what is a₂?</p>
`,explain:`<p>a₂ = r², here with r = 0.9.</p>
`,answer:.81,tol:.001,unit:``},{id:`p08-l05-q6`,type:`num`,q:`<p>Grid step of coefficients rounded to 12 fraction bits?</p>
`,explain:`<p>2⁻¹².</p>
`,answer:24414e-8,tol:.002,unit:``}],"p08-l06":[{id:`p08-l06-q1`,type:`num`,q:`<p>Prewarped analogue cutoff in rad/s for 100 Hz at f_s = 1 kHz?</p>
`,explain:`<p>2f_s tan(πf_c/f_s).</p>
`,answer:649.84,tol:.001,unit:`rad/s`},{id:`p08-l06-q2`,type:`num`,q:`<p>Digital pole for an analogue pole at s = −649.8, f_s = 1 kHz?</p>
`,explain:`<p>z = (1 + s/2f_s)/(1 − s/2f_s).</p>
`,answer:.50953,tol:.001,unit:``},{id:`p08-l06-q3`,type:`mc`,q:`<p>The bilinear transform maps the analogue frequency axis…</p>
`,explain:`<p>Ω = 2f_s tan(πf/f_s).</p>
`,options:[`onto the unit circle once, with tangent warping`,`outside the unit circle`,`linearly onto the unit circle`,`only up to f_s/4`],answer:0},{id:`p08-l06-q4`,type:`mc`,q:`<p>Butterworth filters are…</p>
`,explain:`<p>No ripple.</p>
`,options:[`equiripple in the passband`,`linear phase`,`FIR`,`maximally flat in the passband`],answer:3},{id:`p08-l06-q5`,type:`num`,q:`<p>Number of zeros at z = −1 for a 6th-order Butterworth low-pass?</p>
`,explain:`<p>One per pole.</p>
`,answer:6,tol:.001,unit:``},{id:`p08-l06-q6`,type:`num`,q:`<p>Magnitude in dB of an n-th order Butterworth at its cutoff?</p>
`,explain:`<p>Half power.</p>
`,answer:-3.0103,tol:.001,unit:`dB`}],"p08-l07":[{id:`p08-l07-q1`,type:`num`,q:`<p>Group delay in samples of a 31-tap linear-phase FIR?</p>
`,explain:`<p>(N − 1)/2.</p>
`,answer:15,tol:.001,unit:`samples`},{id:`p08-l07-q2`,type:`num`,q:`<p>Phase lag in degrees from a 10 ms delay at 20 Hz?</p>
`,explain:`<p>360° f T_d.</p>
`,answer:72,tol:.001,unit:`°`},{id:`p08-l07-q3`,type:`num`,q:`<p>Maximum delay in ms for a 45° margin at a 50 Hz crossover?</p>
`,explain:`<p>Solve 360° f T_d = 45°.</p>
`,answer:2.5,tol:.001,unit:`ms`},{id:`p08-l07-q4`,type:`mc`,q:`<p>Group delay measures the delay of…</p>
`,explain:`<p>−dφ/dω.</p>
`,options:[`DC`,`the envelope of a narrowband signal`,`a sinusoid’s crests only`,`the noise floor`],answer:1},{id:`p08-l07-q5`,type:`mc`,q:`<p>To protect phase margin, a sensor low-pass cutoff should be…</p>
`,explain:`<p>Its phase lag at crossover stays small.</p>
`,options:[`at the crossover`,`below the crossover`,`well above the crossover (5–10×)`,`as low as possible`],answer:2},{id:`p08-l07-q6`,type:`num`,q:`<p>Group delay in ms of the 4th-order 50 Hz Butterworth at 20 Hz (f_s = 1 kHz)?</p>
`,explain:`<p>From the code.</p>
`,answer:8.936,tol:.002,unit:`ms`}],"p08-l08":[{id:`p08-l08-q1`,type:`num`,q:`<p>Approximate −3 dB width in Hz for r = 0.95 at f_s = 1 kHz?</p>
`,explain:`<p>(1 − r) f_s/π.</p>
`,answer:15.915,tol:.002,unit:`Hz`},{id:`p08-l08-q2`,type:`num`,q:`<p>The coefficient a₂ for r = 0.95?</p>
`,explain:`<p>r².</p>
`,answer:.9025,tol:.001,unit:``},{id:`p08-l08-q3`,type:`mc`,q:`<p>The zeros of a notch filter are placed…</p>
`,explain:`<p>For complete cancellation.</p>
`,options:[`inside the unit circle`,`at the origin`,`on the unit circle at ±ω₀`,`at z = 1`],answer:2},{id:`p08-l08-q4`,type:`num`,q:`<p>Normalised frequency ω₀ in rad/sample for 120 Hz at 1 kHz?</p>
`,explain:`<p>2πf₀/f_s.</p>
`,answer:.75398,tol:.001,unit:`rad/sample`},{id:`p08-l08-q5`,type:`mc`,q:`<p>Moving the poles closer to the unit circle makes the notch…</p>
`,explain:`<p>Smaller bandwidth, slower decay.</p>
`,options:[`shallower at ω₀`,`unstable immediately`,`narrower, with longer ringing`,`wider`],answer:2},{id:`p08-l08-q6`,type:`num`,q:`<p>Approximate decay time constant in samples of poles at r = 0.99?</p>
`,explain:`<p>rⁿ = e^(n ln r).</p>
`,answer:99.5,tol:.01,unit:`samples`}],"p08-l09":[{id:`p08-l09-q1`,type:`num`,q:`<p>5-point moving average of 1.1, 0.9, 9.0, 1.0, 1.1?</p>
`,explain:`<p>The spike is diluted, not removed.</p>
`,answer:2.62,tol:.001,unit:``},{id:`p08-l09-q2`,type:`num`,q:`<p>Median of the same five samples?</p>
`,explain:`<p>Sorted 0.9, 1.0, 1.1, 1.1, 9.0; the spike can’t be the middle value.</p>
`,answer:1.1,tol:.001,unit:``},{id:`p08-l09-q3`,type:`num`,q:`<p>Hampel threshold for MAD = 0.1 and t = 3?</p>
`,explain:`<p>t · 1.4826 · MAD.</p>
`,answer:.44478,tol:.002,unit:``},{id:`p08-l09-q4`,type:`mc`,q:`<p>A running median applied to a clean step…</p>
`,explain:`<p>Order statistics preserve edges.</p>
`,options:[`adds overshoot`,`turns it into a ramp`,`removes it`,`keeps it sharp (possibly delayed)`],answer:3},{id:`p08-l09-q5`,type:`num`,q:`<p>Minimum odd window to reject bursts of 3 consecutive outliers?</p>
`,explain:`<p>Outliers must be fewer than half.</p>
`,answer:7,tol:.001,unit:``},{id:`p08-l09-q6`,type:`mc`,q:`<p>The median filter is…</p>
`,explain:`<p>Superposition fails.</p>
`,options:[`an IIR filter`,`linear and time-invariant`,`unstable`,`non-linear, so it has no frequency response`],answer:3}],"p08-l10":[{id:`p08-l10-q1`,type:`num`,q:`<p>One-sided PSD of white noise with σ = 0.1 at f_s = 1 kHz?</p>
`,explain:`<p>σ²/(f_s/2).</p>
`,answer:2e-5,tol:.001,unit:`units²/Hz`},{id:`p08-l10-q2`,type:`num`,q:`<p>Segments of 256 with 50 % overlap in 10 000 samples?</p>
`,explain:`<p>⌊(N − L)/step⌋ + 1.</p>
`,answer:77,tol:.001,unit:``},{id:`p08-l10-q3`,type:`num`,q:`<p>Frequency resolution in Hz for L = 256 at f_s = 1 kHz?</p>
`,explain:`<p>f_s/L.</p>
`,answer:3.9063,tol:.001,unit:`Hz`},{id:`p08-l10-q4`,type:`mc`,q:`<p>A single periodogram of noise…</p>
`,explain:`<p>That’s why we average.</p>
`,options:[`converges as the record gets longer`,`has zero variance`,`has scatter about equal to its mean, whatever the length`,`needs no window`],answer:2},{id:`p08-l10-q5`,type:`mc`,q:`<p>Integrating the PSD over all frequencies gives…</p>
`,explain:`<p>Parseval.</p>
`,options:[`the variance (mean power)`,`the peak amplitude`,`the sampling rate`,`zero`],answer:0},{id:`p08-l10-q6`,type:`num`,q:`<p>Noise density in units/√Hz for a PSD of 2e-5 units²/Hz?</p>
`,explain:`<p>Square root of the PSD.</p>
`,answer:.0044721,tol:.002,unit:`units/√Hz`}],"p08-l11":[{id:`p08-l11-q1`,type:`num`,q:`<p>Worst-case scalloping loss in dB of a rectangular window?</p>
`,explain:`<p>sinc(0.5) = 2/π.</p>
`,answer:-3.92,tol:.005,unit:`dB`},{id:`p08-l11-q2`,type:`num`,q:`<p>Rectangular-window reading in dB for a tone 0.3 bin off-centre?</p>
`,explain:`<p>sinc(0.3).</p>
`,answer:-1.3275,tol:.01,unit:`dB`},{id:`p08-l11-q3`,type:`mc`,q:`<p>For accurate amplitude readings, use…</p>
`,explain:`<p>Its flat main lobe makes scalloping negligible.</p>
`,options:[`a flat-top window`,`a shorter record`,`no window and zero-padding`,`a rectangular window`],answer:0},{id:`p08-l11-q4`,type:`mc`,q:`<p>Leakage is caused by…</p>
`,explain:`<p>The wrap-around discontinuity.</p>
`,options:[`aliasing`,`the FFT algorithm’s rounding`,`a non-integer number of cycles in the record`,`quantisation`],answer:2},{id:`p08-l11-q5`,type:`num`,q:`<p>Highest sidelobe of the Hann window in dB (approximately)?</p>
`,explain:`<p>Versus −13 dB rectangular.</p>
`,answer:-31.5,tol:.02,unit:`dB`},{id:`p08-l11-q6`,type:`num`,q:`<p>Bin spacing in Hz for f_s = 1024 Hz and N = 1024?</p>
`,explain:`<p>f_s/N.</p>
`,answer:1,tol:.001,unit:`Hz`}],"p08-l12":[{id:`p08-l12-q1`,type:`num`,q:`<p>New Nyquist frequency in Hz after decimating 8 kHz by 8?</p>
`,explain:`<p>f_s/(2M).</p>
`,answer:500,tol:.001,unit:`Hz`},{id:`p08-l12-q2`,type:`num`,q:`<p>Lowest input frequency in Hz that aliases into 0–400 Hz after decimating to 1 kHz?</p>
`,explain:`<p>f_s,new − f_pass.</p>
`,answer:600,tol:.001,unit:`Hz`},{id:`p08-l12-q3`,type:`num`,q:`<p>Where in Hz does 1.7 kHz land after downsampling to 1 kHz without filtering?</p>
`,explain:`<p>It folds to |1700 − 2000|.</p>
`,answer:300,tol:.001,unit:`Hz`},{id:`p08-l12-q4`,type:`num`,q:`<p>Work saved by polyphase decimation by M = 8 (factor)?</p>
`,explain:`<p>Only kept outputs are computed.</p>
`,answer:8,tol:.001,unit:``},{id:`p08-l12-q5`,type:`mc`,q:`<p>Decimation means…</p>
`,explain:`<p>Filter first, or aliases are permanent.</p>
`,options:[`insert zeros, then filter`,`downsample, then filter`,`low-pass filter, then downsample`,`only downsample`],answer:2},{id:`p08-l12-q6`,type:`num`,q:`<p>Kaiser length estimate for 60 dB with Δf = 0.025 (before rounding)?</p>
`,explain:`<p>From lesson 4.</p>
`,answer:145.87,tol:.002,unit:``}],"p08-l13":[{id:`p08-l13-q1`,type:`num`,q:`<p>One Q15 LSB as a fraction of full scale?</p>
`,explain:`<p>1/32768.</p>
`,answer:30518e-9,tol:.001,unit:``},{id:`p08-l13-q2`,type:`num`,q:`<p>Q14 value of a1 = −1.14298?</p>
`,explain:`<p>Multiply by 2^14 and round.</p>
`,answer:-18727,tol:1e-4,unit:``},{id:`p08-l13-q3`,type:`num`,q:`<p>Q-format of a Q15 sample times a Q14 coefficient?</p>
`,explain:`<p>Fraction bits add.</p>
`,answer:29,tol:.001,unit:`fraction bits`},{id:`p08-l13-q4`,type:`num`,q:`<p>DC gain of the 2 Hz design after Q14 quantisation (b = 1, 1, 1 and a sums to 2)?</p>
`,explain:`<p>Should be 1.</p>
`,answer:1.5,tol:.001,unit:``},{id:`p08-l13-q5`,type:`mc`,q:`<p>Error feedback…</p>
`,explain:`<p>Nothing is lost on average.</p>
`,options:[`removes the need for saturation`,`doubles the coefficient precision`,`adds the discarded rounding remainder into the next sample`,`prevents overflow`],answer:2},{id:`p08-l13-q6`,type:`mc`,q:`<p>On overflow, a fixed-point filter output should…</p>
`,explain:`<p>Wrapping flips the sign.</p>
`,options:[`wrap around`,`saturate at the limit`,`reset the filter state to zero`,`be left to the compiler`],answer:1}],"p08-l14":[{id:`p08-l14-q1`,type:`num`,q:`<p>Finite-difference noise RMS for σ = 0.01 at 200 Hz?</p>
`,explain:`<p>√2·σ/T.</p>
`,answer:2.828,tol:.002,unit:``},{id:`p08-l14-q2`,type:`num`,q:`<p>Sum of k² for k from −7 to 7?</p>
`,explain:`<p>2·(7·8·15/6).</p>
`,answer:280,tol:.001,unit:``},{id:`p08-l14-q3`,type:`num`,q:`<p>Savitzky-Golay (15-point) noise RMS for σ = 0.01 at 200 Hz?</p>
`,explain:`<p>σ/(T√Σk²).</p>
`,answer:.1195,tol:.002,unit:``},{id:`p08-l14-q4`,type:`num`,q:`<p>Amplitude of the derivative of a unit 1 Hz sine?</p>
`,explain:`<p>ω.</p>
`,answer:6.283,tol:.001,unit:``},{id:`p08-l14-q5`,type:`mc`,q:`<p>The gain of an ideal differentiator…</p>
`,explain:`<p>H = jω.</p>
`,options:[`grows in proportion to frequency`,`falls with frequency`,`is flat`,`is zero at high frequency`],answer:0},{id:`p08-l14-q6`,type:`mc`,q:`<p>Savitzky-Golay is centred, so in real time it…</p>
`,explain:`<p>Zero phase offline means M samples of latency online.</p>
`,options:[`needs floating point`,`has no delay`,`is unstable`,`needs M future samples, a delay of M samples`],answer:3}],"p08-l15":[{id:`p08-l15-q1`,type:`num`,q:`<p>Maximum delay in samples for mics 0.20 m apart at 48 kHz (c = 343 m/s)?</p>
`,explain:`<p>d/c·f_s.</p>
`,answer:27.99,tol:.002,unit:`samples`},{id:`p08-l15-q2`,type:`num`,q:`<p>Parabolic correction for y0 = 0.80, y1 = 1.00, y2 = 0.92?</p>
`,explain:`<p>½(y0 − y2)/(y0 − 2y1 + y2).</p>
`,answer:.2143,tol:.002,unit:`samples`},{id:`p08-l15-q3`,type:`num`,q:`<p>Angle in degrees for a 10.21-sample delay (same setup)?</p>
`,explain:`<p>sin θ = c·τ/d.</p>
`,answer:21.4,tol:.005,unit:`°`},{id:`p08-l15-q4`,type:`num`,q:`<p>Parabolic correction when y0 = y2 (symmetric neighbours)?</p>
`,explain:`<p>The peak is exactly on the sample.</p>
`,answer:0,tol:.001,unit:`samples`},{id:`p08-l15-q5`,type:`mc`,q:`<p>The FFT computes correlation in…</p>
`,explain:`<p>Two forward FFTs and one inverse.</p>
`,options:[`O(N)`,`O(N²)`,`O(N log N)`,`O(log N)`],answer:2},{id:`p08-l15-q6`,type:`mc`,q:`<p>GCC-PHAT improves delay estimates by…</p>
`,explain:`<p>It divides by the magnitude, keeping only phase.</p>
`,options:[`adding more noise`,`removing the zero-padding`,`whitening the cross-spectrum to sharpen the peak`,`using a rectangular window`],answer:2}],"p08-l16":[{id:`p08-l16-q1`,type:`num`,q:`<p>BPFO in Hz for 9 balls, d/D = 0.2036, 25 Hz shaft?</p>
`,explain:`<p>(N_b/2)·f_r·(1 − d/D).</p>
`,answer:89.6,tol:.002,unit:`Hz`},{id:`p08-l16-q2`,type:`num`,q:`<p>BPFI in Hz for the same bearing?</p>
`,explain:`<p>(N_b/2)·f_r·(1 + d/D).</p>
`,answer:135.4,tol:.002,unit:`Hz`},{id:`p08-l16-q3`,type:`num`,q:`<p>Cage frequency FTF in Hz for the same bearing?</p>
`,explain:`<p>(f_r/2)·(1 − d/D).</p>
`,answer:9.955,tol:.002,unit:`Hz`},{id:`p08-l16-q4`,type:`num`,q:`<p>Sum BPFO + BPFI, in multiples of the shaft rate, for 9 balls?</p>
`,explain:`<p>Always N_b.</p>
`,answer:9,tol:.001,unit:``},{id:`p08-l16-q5`,type:`mc`,q:`<p>In the raw spectrum, an outer-race fault mostly shows as…</p>
`,explain:`<p>The impacts ring a resonance.</p>
`,options:[`a line at the shaft rate`,`nothing at all`,`sidebands spaced by BPFO around a structural resonance`,`a strong line at BPFO`],answer:2},{id:`p08-l16-q6`,type:`mc`,q:`<p>The analytic signal is obtained by…</p>
`,explain:`<p>Its magnitude is the envelope.</p>
`,options:[`taking the derivative`,`squaring the signal`,`low-pass filtering`,`zeroing negative frequencies and doubling positive ones`],answer:3}]};export{e as default};