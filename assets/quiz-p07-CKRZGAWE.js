var e={"p07-l01":[{id:`p07-l01-q1`,type:`num`,q:`<p>Worst-case total of 0.5, 1.5, 0.25 and 0.1 % FS?</p>
`,explain:`<p>Add the magnitudes.</p>
`,answer:2.35,tol:.001,unit:`% FS`},{id:`p07-l01-q2`,type:`num`,q:`<p>RSS total of the same four errors?</p>
`,explain:`<p>Root of the sum of squares.</p>
`,answer:1.6035,tol:.002,unit:`% FS`},{id:`p07-l01-q3`,type:`mc`,q:`<p>Averaging many readings removes…</p>
`,explain:`<p>The mean converges to truth plus bias.</p>
`,options:[`bias`,`gain error`,`hysteresis`,`random scatter, but not bias`],answer:3},{id:`p07-l01-q4`,type:`num`,q:`<p>Sensitivity in mV/kPa of a 0–100 kPa sensor with a 0.5–4.5 V output?</p>
`,explain:`<p>4 V over 100 kPa.</p>
`,answer:40,tol:.001,unit:`mV/kPa`},{id:`p07-l01-q5`,type:`mc`,q:`<p>Different outputs for the same input approached from above and below is…</p>
`,explain:`<p>It depends on the history.</p>
`,options:[`offset`,`noise`,`hysteresis`,`non-linearity`],answer:2},{id:`p07-l01-q6`,type:`num`,q:`<p>Noise in kPa after averaging 16 readings of 0.05 kPa rms noise?</p>
`,explain:`<p>Divide by √16.</p>
`,answer:.0125,tol:.001,unit:`kPa`}],"p07-l02":[{id:`p07-l02-q1`,type:`num`,q:`<p>Gain in counts/kg from 1012 counts at 0 kg and 53 412 counts at 5 kg?</p>
`,explain:`<p>Rise over run.</p>
`,answer:10480,tol:.001,unit:`counts/kg`},{id:`p07-l02-q2`,type:`num`,q:`<p>Mass in kg for a reading of 22 000 counts?</p>
`,explain:`<p>Subtract the offset, divide by the gain.</p>
`,answer:2.00267,tol:.001,unit:`kg`},{id:`p07-l02-q3`,type:`mc`,q:`<p>Residuals that form a smooth bow indicate…</p>
`,explain:`<p>Noise doesn’t have a shape.</p>
`,options:[`random noise`,`non-linearity the model doesn’t capture`,`a perfect fit`,`an offset error`],answer:1},{id:`p07-l02-q4`,type:`mc`,q:`<p>Least squares improves on a two-point calibration because…</p>
`,explain:`<p>More data and a diagnostic.</p>
`,options:[`it removes hysteresis`,`it is always exact`,`it needs no references`,`noise averages over many points, and residuals can be inspected`],answer:3},{id:`p07-l02-q5`,type:`num`,q:`<p>Uncertainty in counts/kg of a two-point slope over 5 kg with 20 counts rms noise per reading?</p>
`,explain:`<p>Two independent readings.</p>
`,answer:5.657,tol:.002,unit:`counts/kg`},{id:`p07-l02-q6`,type:`num`,q:`<p>0.1 % of a 5 kg full scale in grams?</p>
`,explain:`<p>The spec used in the code.</p>
`,answer:5,tol:.001,unit:`g`}],"p07-l03":[{id:`p07-l03-q1`,type:`num`,q:`<p>Loaded output ratio at x = 2/3 with k = 10?</p>
`,explain:`<p>The loading formula.</p>
`,answer:.65217,tol:.001,unit:``},{id:`p07-l03-q2`,type:`num`,q:`<p>Approximate worst loading error in % for k = 10?</p>
`,explain:`<p>About 15/k %.</p>
`,answer:1.5,tol:.05,unit:`%`},{id:`p07-l03-q3`,type:`mc`,q:`<p>The loading error peaks at about…</p>
`,explain:`<p>Where <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">x</span><span class="mord">/</span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">x</span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">x</span><span class="mclose">)</span><span class="mord">/</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mclose">)</span></span></span></span> is largest.</p>
`,options:[`x = 0`,`x = 1/2`,`x = 2/3`,`x = 1`],answer:2},{id:`p07-l03-q4`,type:`num`,q:`<p>Angle resolution in degrees of a 300° pot on a 12-bit ADC?</p>
`,explain:`<p>In principle, before noise and linearity.</p>
`,answer:.073242,tol:.002,unit:`°`},{id:`p07-l03-q5`,type:`mc`,q:`<p>The simplest way to remove loading error is…</p>
`,explain:`<p>Very high input resistance.</p>
`,options:[`a voltage-follower buffer`,`a lower supply`,`a bigger pot`,`a longer cable`],answer:0},{id:`p07-l03-q6`,type:`num`,q:`<p>Maximum pot value in kΩ for &lt; 0.5 % error into 100 kΩ (using 15/k)?</p>
`,explain:`<p>k ≥ 30.</p>
`,answer:3.333,tol:.002,unit:`kΩ`}],"p07-l04":[{id:`p07-l04-q1`,type:`num`,q:`<p>ΔR/R in % for GF = 2 and 1000 µε?</p>
`,explain:`<p>GF × strain.</p>
`,answer:.2,tol:.001,unit:`%`},{id:`p07-l04-q2`,type:`num`,q:`<p>Full-scale output in mV of a 2 mV/V load cell at 3.3 V excitation?</p>
`,explain:`<p>Sensitivity × excitation.</p>
`,answer:6.6,tol:.001,unit:`mV`},{id:`p07-l04-q3`,type:`num`,q:`<p>Maximum INA gain with 1.65 V headroom and 6.6 mV full scale?</p>
`,explain:`<p>Headroom over signal.</p>
`,answer:250,tol:.001,unit:``},{id:`p07-l04-q4`,type:`num`,q:`<p>Grams per count with G = 200 and a 16-bit ADC (5 kg, 2 mV/V, ratiometric)?</p>
`,explain:`<p>5243 counts per kg.</p>
`,answer:.19073,tol:.002,unit:`g`},{id:`p07-l04-q5`,type:`mc`,q:`<p>A full bridge with two stretched and two compressed gauges…</p>
`,explain:`<p>Compared with a single gauge.</p>
`,options:[`removes the need for an amplifier`,`halves the signal`,`quadruples the signal and cancels temperature drift`,`needs no excitation`],answer:2},{id:`p07-l04-q6`,type:`mc`,q:`<p>Ratiometric measurement means…</p>
`,explain:`<p>The ratio cancels supply variation.</p>
`,options:[`two ADCs are used`,`the signal is AC`,`the gain is unity`,`the ADC reference also excites the sensor`],answer:3}],"p07-l05":[{id:`p07-l05-q1`,type:`mc`,q:`<p>The Steinhart-Hart equation models…</p>
`,explain:`<p>Three coefficients.</p>
`,options:[`T as linear in R`,`the β value only`,`R as a polynomial in T`,`1/T as A + B ln R + C (ln R)^3`],answer:3},{id:`p07-l05-q2`,type:`num`,q:`<p>Minimum number of table points to determine A, B and C?</p>
`,explain:`<p>Three unknowns.</p>
`,answer:3,tol:.001,unit:``},{id:`p07-l05-q3`,type:`num`,q:`<p>Self-heating power in µW of a 10 kΩ thermistor with 1.65 V across it?</p>
`,explain:`<p>V²/R.</p>
`,answer:272.25,tol:.002,unit:`µW`},{id:`p07-l05-q4`,type:`num`,q:`<p>Thermistor resistance in kΩ when a 12-bit divider (10 kΩ fixed, thermistor low) reads 2048?</p>
`,explain:`<p>Mid-scale means equal resistances.</p>
`,answer:10,tol:.001,unit:`kΩ`},{id:`p07-l05-q5`,type:`mc`,q:`<p>The β equation is exact…</p>
`,explain:`<p>It’s a two-point model.</p>
`,options:[`only at its two defining temperatures`,`only at 0 °C`,`never`,`everywhere`],answer:0},{id:`p07-l05-q6`,type:`num`,q:`<p>Approximate self-heating in K at 1 mK/µW and 272 µW?</p>
`,explain:`<p>Comparable to the accuracy target.</p>
`,answer:.272,tol:.01,unit:`K`}],"p07-l06":[{id:`p07-l06-q1`,type:`num`,q:`<p>PT100 resistance in Ω at 100 °C?</p>
`,explain:`<p>Callendar-Van Dusen.</p>
`,answer:138.5055,tol:.001,unit:`Ω`},{id:`p07-l06-q2`,type:`num`,q:`<p>Compensated voltage in mV for 15.396 mV with terminals at 25 °C (E(25) = 1.000 mV)?</p>
`,explain:`<p>Add E of the cold junction.</p>
`,answer:16.396,tol:.001,unit:`mV`},{id:`p07-l06-q3`,type:`mc`,q:`<p>A thermocouple’s voltage depends on…</p>
`,explain:`<p>V = E(T_hot) − E(T_cold).</p>
`,options:[`the temperature difference between hot and cold junctions`,`the wire length`,`the hot junction only`,`the current through it`],answer:0},{id:`p07-l06-q4`,type:`num`,q:`<p>Temperature error in K from 1 Ω of lead resistance on a PT100 (0.39 Ω/K)?</p>
`,explain:`<p>Use 4 wires.</p>
`,answer:2.564,tol:.01,unit:`K`},{id:`p07-l06-q5`,type:`num`,q:`<p>Approximate type K sensitivity in µV/K?</p>
`,explain:`<p>About 41 µV/K near room temperature.</p>
`,answer:41,tol:.05,unit:`µV/K`},{id:`p07-l06-q6`,type:`mc`,q:`<p>CJC needs…</p>
`,explain:`<p>A thermistor or IC sensor at the terminals.</p>
`,options:[`a higher ADC resolution only`,`a second thermocouple`,`a separate measurement of the terminal temperature`,`an ice bath always`],answer:2}],"p07-l07":[{id:`p07-l07-q1`,type:`num`,q:`<p>Frequency-method resolution in rev/s for 2000 counts/rev and a 1 ms window?</p>
`,explain:`<p>One count per window.</p>
`,answer:.5,tol:.001,unit:`rev/s`},{id:`p07-l07-q2`,type:`num`,q:`<p>Timer ticks per count at 2 rev/s with a 10 MHz timer?</p>
`,explain:`<p>f_t over the count rate.</p>
`,answer:2500,tol:.001,unit:``},{id:`p07-l07-q3`,type:`num`,q:`<p>Crossover speed in rev/s?</p>
`,explain:`<p>Where both resolutions are equal.</p>
`,answer:50,tol:.001,unit:`rev/s`},{id:`p07-l07-q4`,type:`mc`,q:`<p>At very low speed, prefer…</p>
`,explain:`<p>Many timer ticks per edge.</p>
`,options:[`the frequency method`,`[object Object]`,`a bigger window only`,`the period method`],answer:3},{id:`p07-l07-q5`,type:`num`,q:`<p>Period-method resolution in % at 80 rev/s?</p>
`,explain:`<p>ωN/f_t.</p>
`,answer:1.6,tol:.001,unit:`%`},{id:`p07-l07-q6`,type:`mc`,q:`<p>The M/T method…</p>
`,explain:`<p>It gets the best of both.</p>
`,options:[`only works at standstill`,`averages the two estimates`,`counts edges and times the window from the first to the last edge`,`uses two encoders`],answer:2}],"p07-l08":[{id:`p07-l08-q1`,type:`num`,q:`<p>Hall transitions per second for 4 pole pairs at 3000 rpm?</p>
`,explain:`<p>6 per electrical revolution.</p>
`,answer:1200,tol:.001,unit:``},{id:`p07-l08-q2`,type:`num`,q:`<p>Hall voltage in mV for I = 1 mA, B = 0.1 T, n = 1e21 m⁻³, t = 10 µm?</p>
`,explain:`<p>V_H = IB/(nqt).</p>
`,answer:62.42,tol:.005,unit:`mV`},{id:`p07-l08-q3`,type:`mc`,q:`<p>Which Hall codes indicate a fault?</p>
`,explain:`<p>They never occur in normal rotation.</p>
`,options:[`100 and 011`,`none`,`101 and 010`,`000 and 111`],answer:3},{id:`p07-l08-q4`,type:`num`,q:`<p>Minimum six-step torque as a percentage of peak?</p>
`,explain:`<p>cos 30°.</p>
`,answer:86.6,tol:.001,unit:`%`},{id:`p07-l08-q5`,type:`mc`,q:`<p>In six-step drive, during each sector…</p>
`,explain:`<p>Two phases conduct.</p>
`,options:[`one phase is high, one low and one floating`,`all three phases conduct`,`the phases are sinusoidal`,`only one phase conducts`],answer:0},{id:`p07-l08-q6`,type:`num`,q:`<p>Transitions per mechanical revolution for 7 pole pairs?</p>
`,explain:`<p>6p.</p>
`,answer:42,tol:.001,unit:``}],"p07-l09":[{id:`p07-l09-q1`,type:`num`,q:`<p>Pitch in degrees for a_x = 0.342 g and a_z = 0.940 g (a_y = 0)?</p>
`,explain:`<p>atan2.</p>
`,answer:19.997,tol:.002,unit:`°`},{id:`p07-l09-q2`,type:`num`,q:`<p>False pitch in degrees from 0.1 g of forward acceleration?</p>
`,explain:`<p>Acceleration is indistinguishable from tilt.</p>
`,answer:5.7106,tol:.001,unit:`°`},{id:`p07-l09-q3`,type:`mc`,q:`<p>At rest on a level table, an accelerometer’s z axis reads…</p>
`,explain:`<p>It measures specific force.</p>
`,options:[`−1 g`,`0 g`,`+1 g (up)`,`9.81 g`],answer:2},{id:`p07-l09-q4`,type:`num`,q:`<p>Deflection in nm of a 5 kHz proof mass under 1 g?</p>
`,explain:`<p>a/ω².</p>
`,answer:9.94,tol:.01,unit:`nm`},{id:`p07-l09-q5`,type:`mc`,q:`<p>atan2 is used instead of atan because…</p>
`,explain:`<p>Full ±180° range.</p>
`,options:[`it gives yaw`,`it is faster`,`it handles all quadrants and a zero denominator`,`it removes noise`],answer:2},{id:`p07-l09-q6`,type:`num`,q:`<p>Scatter in degrees after averaging 100 readings with 1.1° per reading?</p>
`,explain:`<p>√N.</p>
`,answer:.11,tol:.001,unit:`°`}],"p07-l10":[{id:`p07-l10-q1`,type:`num`,q:`<p>Heading error in degrees after 60 s from a 0.5 °/s bias?</p>
`,explain:`<p>Linear growth.</p>
`,answer:30,tol:.001,unit:`°`},{id:`p07-l10-q2`,type:`num`,q:`<p>Bias uncertainty in °/s after 10 s at rest with N = 0.01 °/s/√Hz?</p>
`,explain:`<p>N/√T.</p>
`,answer:.0031623,tol:.002,unit:`°/s`},{id:`p07-l10-q3`,type:`num`,q:`<p>Coriolis acceleration in m/s² for 100 °/s and 0.1 m/s?</p>
`,explain:`<p>2Ωv.</p>
`,answer:.34907,tol:.002,unit:`m/s²`},{id:`p07-l10-q4`,type:`mc`,q:`<p>The angle error from white gyro noise grows like…</p>
`,explain:`<p>A random walk.</p>
`,options:[`it doesn’t grow`,`t²`,`√t`,`t`],answer:2},{id:`p07-l10-q5`,type:`num`,q:`<p>Seconds at rest for a bias uncertainty of 0.001 °/s with N = 0.01 °/s/√Hz?</p>
`,explain:`<p>T = (N/σ)².</p>
`,answer:100,tol:.001,unit:`s`},{id:`p07-l10-q6`,type:`mc`,q:`<p>After subtracting an estimated bias, heading drift is…</p>
`,explain:`<p>Residual bias and random walk remain.</p>
`,options:[`smaller but still unbounded`,`eliminated forever`,`larger`,`bounded by 1°`],answer:0}],"p07-l11":[{id:`p07-l11-q1`,type:`num`,q:`<p>Raw heading in degrees for m_x = 37 µT, m_y = −23 µT?</p>
`,explain:`<p>atan2(−m_y, m_x).</p>
`,answer:31.866,tol:.002,unit:`°`},{id:`p07-l11-q2`,type:`num`,q:`<p>Corrected heading in degrees after removing an offset of (15, −8) µT?</p>
`,explain:`<p>Subtract the offset first.</p>
`,answer:34.287,tol:.002,unit:`°`},{id:`p07-l11-q3`,type:`mc`,q:`<p>Hard iron…</p>
`,explain:`<p>A constant offset vector.</p>
`,options:[`stretches the sphere of readings`,`shifts its centre`,`rotates the Earth’s field`,`adds noise`],answer:1},{id:`p07-l11-q4`,type:`mc`,q:`<p>Soft iron turns the sphere of readings into…</p>
`,explain:`<p>A linear map.</p>
`,options:[`an ellipsoid`,`a plane`,`a line`,`a shifted sphere`],answer:0},{id:`p07-l11-q5`,type:`num`,q:`<p>Unknowns in the linear ellipsoid fit?</p>
`,explain:`<p>Six quadratic and three linear terms.</p>
`,answer:9,tol:.001,unit:``},{id:`p07-l11-q6`,type:`num`,q:`<p>Magnitude in µT of a field of (20, 0, −40) µT?</p>
`,explain:`<p>Typical for mid-latitudes.</p>
`,answer:44.721,tol:.002,unit:`µT`}],"p07-l12":[{id:`p07-l12-q1`,type:`num`,q:`<p>Speed of sound in m/s at 20 °C?</p>
`,explain:`<p>331.3 + 0.606 T.</p>
`,answer:343.42,tol:.001,unit:`m/s`},{id:`p07-l12-q2`,type:`num`,q:`<p>Distance in m for an 11.66 ms round trip at 20 °C?</p>
`,explain:`<p>Half the round trip.</p>
`,answer:2.0021,tol:.001,unit:`m`},{id:`p07-l12-q3`,type:`num`,q:`<p>Range per 40 kHz cycle in mm (c = 343 m/s)?</p>
`,explain:`<p>Half a wavelength.</p>
`,answer:4.2875,tol:.002,unit:`mm`},{id:`p07-l12-q4`,type:`mc`,q:`<p>Cross-correlation beats a fixed threshold because…</p>
`,explain:`<p>A matched filter.</p>
`,options:[`it removes the speed of sound`,`it is faster`,`it uses the whole echo and doesn’t depend on amplitude`,`it needs no transmitted signal`],answer:2},{id:`p07-l12-q5`,type:`num`,q:`<p>Range error in % from assuming 343 m/s when the air is at 0 °C?</p>
`,explain:`<p>Measure the temperature.</p>
`,answer:3.53,tol:.01,unit:`%`},{id:`p07-l12-q6`,type:`mc`,q:`<p>Fitting a parabola to the correlation peak gives…</p>
`,explain:`<p>Interpolation between samples.</p>
`,options:[`sub-sample time resolution`,`the echo amplitude only`,`the speed of sound`,`a wider beam`],answer:0}],"p07-l13":[{id:`p07-l13-q1`,type:`num`,q:`<p>Ambiguity distance in m at 20 MHz?</p>
`,explain:`<p>c/(2f).</p>
`,answer:7.4948,tol:.001,unit:`m`},{id:`p07-l13-q2`,type:`num`,q:`<p>Distance in m for a 1.2 rad phase at 20 MHz?</p>
`,explain:`<p>cΔφ/(4πf).</p>
`,answer:1.4313,tol:.001,unit:`m`},{id:`p07-l13-q3`,type:`num`,q:`<p>Unambiguous range in m of 20 and 25 MHz combined?</p>
`,explain:`<p>Their difference, 5 MHz.</p>
`,answer:29.979,tol:.001,unit:`m`},{id:`p07-l13-q4`,type:`num`,q:`<p>Round-trip time in ps for 1 mm of range?</p>
`,explain:`<p>Light is fast.</p>
`,answer:6.6713,tol:.002,unit:`ps`},{id:`p07-l13-q5`,type:`mc`,q:`<p>A LiDAR range of exactly 0 usually means…</p>
`,explain:`<p>Filter invalid returns.</p>
`,options:[`a mixed pixel`,`no return; discard it`,`maximum precision`,`an object touching the sensor`],answer:1},{id:`p07-l13-q6`,type:`num`,q:`<p>The y coordinate in m of a return at 30° and 2.31 m?</p>
`,explain:`<p>r sin θ.</p>
`,answer:1.155,tol:.001,unit:`m`}],"p07-l14":[{id:`p07-l14-q1`,type:`num`,q:`<p>Shunt resistance in mΩ for 50 mV at 20 A?</p>
`,explain:`<p>R = V/I.</p>
`,answer:2.5,tol:.001,unit:`mΩ`},{id:`p07-l14-q2`,type:`num`,q:`<p>Power in W at 20 A through 2.5 mΩ?</p>
`,explain:`<p>I²R.</p>
`,answer:1,tol:.001,unit:`W`},{id:`p07-l14-q3`,type:`num`,q:`<p>Amplifier gain to map ±50 mV onto 0–3.3 V around mid-rail?</p>
`,explain:`<p>Half the span over the full-scale drop.</p>
`,answer:33,tol:.001,unit:``},{id:`p07-l14-q4`,type:`mc`,q:`<p>In centre-aligned PWM, sampling at the middle of the on-time gives…</p>
`,explain:`<p>The ramp crosses the average there.</p>
`,options:[`the average current`,`the peak current`,`the ringing amplitude`,`zero`],answer:0},{id:`p07-l14-q5`,type:`num`,q:`<p>Current error in mA from a 100 µV amplifier input offset on 2.5 mΩ?</p>
`,explain:`<p>Calibrate it at zero current.</p>
`,answer:40,tol:.001,unit:`mA`},{id:`p07-l14-q6`,type:`mc`,q:`<p>A Hall-effect current sensor’s main advantage over a shunt is…</p>
`,explain:`<p>It senses the field around the conductor.</p>
`,options:[`higher bandwidth always`,`galvanic isolation and no I²R loss`,`lower cost always`,`lower offset drift`],answer:1}],"p07-l15":[{id:`p07-l15-q1`,type:`num`,q:`<p>Air density in kg/m³ at 20 °C and 101.3 kPa?</p>
`,explain:`<p>p/(R_s T).</p>
`,answer:1.2041,tol:.001,unit:`kg/m³`},{id:`p07-l15-q2`,type:`num`,q:`<p>Flow in L/s through a 10 mm orifice (C_d 0.61) at 2000 Pa, ρ = 1.204?</p>
`,explain:`<p>C_d A √(2Δp/ρ).</p>
`,answer:2.7604,tol:.003,unit:`L/s`},{id:`p07-l15-q3`,type:`num`,q:`<p>Pressure ratio needed for a 10:1 flow range?</p>
`,explain:`<p>Δp ∝ Q².</p>
`,answer:100,tol:.001,unit:``},{id:`p07-l15-q4`,type:`num`,q:`<p>Flow error in % from a 12.5 Pa offset at Δp = 50 Pa?</p>
`,explain:`<p>The square root amplifies it at low flow.</p>
`,answer:11.803,tol:.002,unit:`%`},{id:`p07-l15-q5`,type:`mc`,q:`<p>A differential pressure sensor measures…</p>
`,explain:`<p>Used for flow.</p>
`,options:[`against vacuum`,`between two ports`,`against ambient air`,`temperature`],answer:1},{id:`p07-l15-q6`,type:`mc`,q:`<p>The discharge coefficient accounts for…</p>
`,explain:`<p>Real flow is less than ideal.</p>
`,options:[`the jet contracting and losses`,`temperature`,`the sensor’s offset`,`ADC resolution`],answer:0}],"p07-l16":[{id:`p07-l16-q1`,type:`num`,q:`<p>Attenuation in dB needed to keep a full-scale alias below 1 LSB at 12 bits?</p>
`,explain:`<p>20 log₁₀ 2^(N−1).</p>
`,answer:66.227,tol:.001,unit:`dB`},{id:`p07-l16-q2`,type:`num`,q:`<p>Frequency in Hz where 900 Hz appears when sampled at 1 kHz?</p>
`,explain:`<p>It folds about f_s/2.</p>
`,answer:100,tol:.001,unit:`Hz`},{id:`p07-l16-q3`,type:`num`,q:`<p>Attenuation in dB of a 4th-order Butterworth (f_c = 100 Hz) at 900 Hz?</p>
`,explain:`<p>10 log₁₀(1 + (f/f_c)^(2n)).</p>
`,answer:76.335,tol:.002,unit:`dB`},{id:`p07-l16-q4`,type:`mc`,q:`<p>An alias already in the sampled data can be removed by…</p>
`,explain:`<p>Filter before sampling.</p>
`,options:[`a higher ADC resolution`,`[object Object]`,`averaging`,`a digital low-pass filter`],answer:1},{id:`p07-l16-q5`,type:`num`,q:`<p>Minimum Butterworth order for 66.2 dB at 9× the corner?</p>
`,explain:`<p>About 19.1 dB per order.</p>
`,answer:4,tol:.001,unit:``},{id:`p07-l16-q6`,type:`mc`,q:`<p>The usual modern alternative to a steep analogue filter is…</p>
`,explain:`<p>Moves the aliases far away.</p>
`,options:[`a slower ADC`,`a higher reference voltage`,`removing the filter`,`oversampling, then digital filtering and decimation`],answer:3}],"p07-l17":[{id:`p07-l17-q1`,type:`num`,q:`<p>Ideal SNR in dB of a 12-bit ADC?</p>
`,explain:`<p>6.02N + 1.76.</p>
`,answer:74,tol:.001,unit:`dB`},{id:`p07-l17-q2`,type:`num`,q:`<p>Quantisation noise in mV rms for a 12-bit, 3.3 V ADC?</p>
`,explain:`<p>q/√12.</p>
`,answer:.23262,tol:.002,unit:`mV`},{id:`p07-l17-q3`,type:`num`,q:`<p>ENOB of an ADC with 86 dB SINAD?</p>
`,explain:`<p>(SINAD − 1.76)/6.02.</p>
`,answer:13.993,tol:.002,unit:`bits`},{id:`p07-l17-q4`,type:`mc`,q:`<p>Coherent sampling means…</p>
`,explain:`<p>No leakage.</p>
`,options:[`an integer (ideally prime) number of cycles in the record`,`sampling twice per cycle`,`sampling at the signal frequency`,`using a Hann window`],answer:0},{id:`p07-l17-q5`,type:`num`,q:`<p>SNR gain in dB from averaging 16 samples of uncorrelated noise?</p>
`,explain:`<p>10 log₁₀ M.</p>
`,answer:12.041,tol:.002,unit:`dB`},{id:`p07-l17-q6`,type:`num`,q:`<p>Variance of a uniform error over one LSB, in units of q²?</p>
`,explain:`<p>q²/12.</p>
`,answer:.083333,tol:.001,unit:``}],"p07-l18":[{id:`p07-l18-q1`,type:`num`,q:`<p>α for τ = 0.5 s at 200 Hz?</p>
`,explain:`<p>τ/(τ + Δt).</p>
`,answer:.9901,tol:.001,unit:``},{id:`p07-l18-q2`,type:`num`,q:`<p>Steady error in degrees from a 1.5 °/s gyro bias with τ = 0.5 s?</p>
`,explain:`<p>bτ.</p>
`,answer:.75,tol:.001,unit:`°`},{id:`p07-l18-q3`,type:`mc`,q:`<p>In a complementary filter, the gyro contributes…</p>
`,explain:`<p>Its errors are low-frequency drift.</p>
`,options:[`only the bias`,`nothing`,`the high frequencies`,`the low frequencies`],answer:2},{id:`p07-l18-q4`,type:`mc`,q:`<p>The two filters must sum to one so that…</p>
`,explain:`<p>That’s what complementary means.</p>
`,options:[`α is zero`,`the true signal passes undistorted at every frequency`,`the gyro bias vanishes`,`noise doubles`],answer:1},{id:`p07-l18-q5`,type:`num`,q:`<p>Crossover frequency in Hz for τ = 0.5 s?</p>
`,explain:`<p>1/(2πτ).</p>
`,answer:.31831,tol:.002,unit:`Hz`},{id:`p07-l18-q6`,type:`num`,q:`<p>Gyro-only drift in degrees after 20 s with a 1.5 °/s bias?</p>
`,explain:`<p>Linear growth.</p>
`,answer:30,tol:.001,unit:`°`}]};export{e as default};