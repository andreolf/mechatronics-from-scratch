var e={"p13-l01":[{id:`p13-l01-q1`,type:`num`,q:`<p>Closed-loop DC gain with a loop gain of 20?</p>
`,explain:`<p>L/(1 + L).</p>
`,answer:.9524,tol:.001,unit:``},{id:`p13-l01-q2`,type:`num`,q:`<p>Sensitivity S at DC with a loop gain of 20?</p>
`,explain:`<p>1/(1 + L).</p>
`,answer:.0476,tol:.002,unit:``},{id:`p13-l01-q3`,type:`num`,q:`<p>Output error in % with the prefilter when the plant gain is 30 % high (L goes from 20 to 26)?</p>
`,explain:`<p>About 27 times less than open loop.</p>
`,answer:1.11,tol:.01,unit:`%`},{id:`p13-l01-q4`,type:`num`,q:`<p>Closed-loop time constant in ms for τ = 0.5 s and L = 20?</p>
`,explain:`<p>τ/(1 + L).</p>
`,answer:23.8,tol:.01,unit:`ms`},{id:`p13-l01-q5`,type:`mc`,q:`<p>What can feedback not correct?</p>
`,explain:`<p>The loop tracks the measured value.</p>
`,options:[`errors in the sensor`,`changes in plant gain`,`slow plant dynamics`,`load disturbances`],answer:0},{id:`p13-l01-q6`,type:`mc`,q:`<p>What is the main risk of raising loop gain?</p>
`,explain:`<p>Dynamics and delays make high gain oscillate.</p>
`,options:[`instability`,`lower accuracy`,`higher sensitivity to plant changes`,`slower response`],answer:0}],"p13-l02":[{id:`p13-l02-q1`,type:`num`,q:`<p>Motor damping β in N·m·s for R = 1.2 Ω, k = 0.05, b = 2e-5?</p>
`,explain:`<p>k²/R + b.</p>
`,answer:.002103,tol:.002,unit:``},{id:`p13-l02-q2`,type:`num`,q:`<p>Open-loop speed drop in rad/s for a 0.05 N·m load?</p>
`,explain:`<p>τ_L/β.</p>
`,answer:23.77,tol:.003,unit:`rad/s`},{id:`p13-l02-q3`,type:`num`,q:`<p>Loop gain with K_p = 0.5 V per rad/s?</p>
`,explain:`<p>kK_p/(Rβ).</p>
`,answer:9.906,tol:.003,unit:``},{id:`p13-l02-q4`,type:`num`,q:`<p>Closed-loop speed drop in rad/s?</p>
`,explain:`<p>Open-loop drop over 1 + L.</p>
`,answer:2.181,tol:.005,unit:`rad/s`},{id:`p13-l02-q5`,type:`mc`,q:`<p>The disturbance transfer function with feedback is…</p>
`,explain:`<p>The same sensitivity factor.</p>
`,options:[`G_d/(1 + GK)`,`GK/(1 + GK)`,`G_d·GK`,`1 + GK`],answer:0},{id:`p13-l02-q6`,type:`mc`,q:`<p>Proportional speed feedback against a step load leaves…</p>
`,explain:`<p>Integral action is needed for zero error.</p>
`,options:[`a smaller but non-zero steady speed error`,`zero steady error`,`a larger error`,`an oscillation`],answer:0}],"p13-l03":[{id:`p13-l03-q1`,type:`num`,q:`<p>Largest stable K for K/((s + 1)(s + 2)(s + 3))?</p>
`,explain:`<p>a₂a₁ = a₃a₀ at the limit.</p>
`,answer:60,tol:0,unit:``},{id:`p13-l03-q2`,type:`num`,q:`<p>Oscillation frequency in rad/s at that gain?</p>
`,explain:`<p>Auxiliary polynomial 6s² + 66.</p>
`,answer:3.317,tol:.001,unit:`rad/s`},{id:`p13-l03-q3`,type:`num`,q:`<p>Number of RHP roots of s⁴ + s³ + 2s² + 2s + 3?</p>
`,explain:`<p>The epsilon method shows two sign changes.</p>
`,answer:2,tol:0,unit:``},{id:`p13-l03-q4`,type:`num`,q:`<p>Upper gain limit for s³ + 2s² + (K + 1)s + 3K?</p>
`,explain:`<p>From the s¹ row.</p>
`,answer:2,tol:0,unit:``},{id:`p13-l03-q5`,type:`mc`,q:`<p>A row of zeros in the Routh array means…</p>
`,explain:`<p>Use the auxiliary polynomial.</p>
`,options:[`roots symmetric about the origin, such as a pair on the imaginary axis`,`the system is always stable`,`a root at infinity`,`an arithmetic mistake`],answer:0},{id:`p13-l03-q6`,type:`mc`,q:`<p>All coefficients positive guarantees stability for…</p>
`,explain:`<p>From third order on you need the full test.</p>
`,options:[`first- and second-order polynomials only`,`every polynomial`,`no polynomial`,`odd orders only`],answer:0}],"p13-l04":[{id:`p13-l04-q1`,type:`num`,q:`<p>Step error of the type 0 example?</p>
`,explain:`<p>1/(1 + K_p) with K_p = 5.</p>
`,answer:.1667,tol:.002,unit:``},{id:`p13-l04-q2`,type:`num`,q:`<p>Ramp error of the type 1 example?</p>
`,explain:`<p>K_v = 10/(2·5).</p>
`,answer:1,tol:.001,unit:``},{id:`p13-l04-q3`,type:`num`,q:`<p>Parabola error of the type 2 example?</p>
`,explain:`<p>K_a = 10·1/5 = 2.</p>
`,answer:.5,tol:.001,unit:``},{id:`p13-l04-q4`,type:`num`,q:`<p>Following error in rad for a 2 rad/s ramp with K_v = 50 s⁻¹?</p>
`,explain:`<p>Ramp rate over K_v.</p>
`,answer:.04,tol:.001,unit:`rad`},{id:`p13-l04-q5`,type:`mc`,q:`<p>A type 1 loop tracking a step has…</p>
`,explain:`<p>K_p is infinite.</p>
`,options:[`zero steady-state error`,`error 1/(1 + K_p)`,`an error that grows`,`error 1/K_v`],answer:0},{id:`p13-l04-q6`,type:`mc`,q:`<p>The final value theorem applies only if…</p>
`,explain:`<p>Otherwise there is no final value.</p>
`,options:[`the closed loop is stable`,`the input is a step`,`the system is type 0`,`the plant has no zeros`],answer:0}],"p13-l05":[{id:`p13-l05-q1`,type:`num`,q:`<p>Steady error for a type 0 loop with K_p = 9?</p>
`,explain:`<p>1/(1 + K_p).</p>
`,answer:.1,tol:.001,unit:``},{id:`p13-l05-q2`,type:`num`,q:`<p>DC gain of the motor in (rad/s)/V?</p>
`,explain:`<p>k/(Rb + k²).</p>
`,answer:19.81,tol:.002,unit:``},{id:`p13-l05-q3`,type:`num`,q:`<p>Gain K_p where the two poles meet?</p>
`,explain:`<p>Discriminant zero.</p>
`,answer:13.27,tol:.005,unit:``},{id:`p13-l05-q4`,type:`num`,q:`<p>Overshoot in % at ζ = 0.707?</p>
`,explain:`<p>exp(−πζ/√(1−ζ²)).</p>
`,answer:4.32,tol:.01,unit:`%`},{id:`p13-l05-q5`,type:`mc`,q:`<p>Raising proportional gain on this loop…</p>
`,explain:`<p>Only the constant term changes.</p>
`,options:[`shrinks the error and reduces damping`,`removes the steady error completely`,`slows the response`,`moves the pole sum`],answer:0},{id:`p13-l05-q6`,type:`mc`,q:`<p>The pole sum stays fixed because…</p>
`,explain:`<p>Sum of roots = −a₁/a₀.</p>
`,options:[`the gain only changes the constant coefficient`,`the motor is linear`,`the inductance is small`,`the poles are real`],answer:0}],"p13-l06":[{id:`p13-l06-q1`,type:`num`,q:`<p>Zero location in rad/s of a PI with K_p = 0.12 and K_i = 2.5 (give the magnitude)?</p>
`,explain:`<p>K_i/K_p.</p>
`,answer:20.83,tol:.002,unit:`rad/s`},{id:`p13-l06-q2`,type:`num`,q:`<p>Steady error in % of P-only control with loop DC gain 2.38?</p>
`,explain:`<p>1/(1 + K).</p>
`,answer:29.6,tol:.01,unit:`%`},{id:`p13-l06-q3`,type:`num`,q:`<p>P-only load droop in rad/s for 0.05 N·m (β + kK_p/R = 0.007103)?</p>
`,explain:`<p>τ_L over the total damping.</p>
`,answer:7.04,tol:.01,unit:`rad/s`},{id:`p13-l06-q4`,type:`num`,q:`<p>Steady error with PI against a constant load?</p>
`,explain:`<p>Type 1 rejects constants.</p>
`,answer:0,tol:0,unit:``},{id:`p13-l06-q5`,type:`mc`,q:`<p>The PI controller adds…</p>
`,explain:`<p>C(s) = (K_p s + K_i)/s.</p>
`,options:[`a pole at the origin and a zero at −K_i/K_p`,`two zeros`,`a pole at −K_i/K_p`,`only gain`],answer:0},{id:`p13-l06-q6`,type:`mc`,q:`<p>The price of integral action is…</p>
`,explain:`<p>Up to 90° lag below the zero.</p>
`,options:[`phase lag that reduces stability margins`,`steady error`,`lower DC gain`,`slower rejection of noise only`],answer:0}],"p13-l07":[{id:`p13-l07-q1`,type:`num`,q:`<p>Minimum proportional gain in N/rad for the linear cart-pole to have stiffness (p² = 19.9, β = 1.93)?</p>
`,explain:`<p>K_p &gt; p²/β.</p>
`,answer:10.31,tol:.005,unit:`N/rad`},{id:`p13-l07-q2`,type:`num`,q:`<p>Natural frequency in rad/s with K_p = 38?</p>
`,explain:`<p>√(βK_p − p²).</p>
`,answer:7.32,tol:.005,unit:`rad/s`},{id:`p13-l07-q3`,type:`num`,q:`<p>Damping ratio with K_d = 7?</p>
`,explain:`<p>βK_d/(2ω_n).</p>
`,answer:.924,tol:.005,unit:``},{id:`p13-l07-q4`,type:`num`,q:`<p>K_d for ζ = 0.7 at K_p = 38?</p>
`,explain:`<p>2ζω_n/β.</p>
`,answer:5.3,tol:.01,unit:`N·s/rad`},{id:`p13-l07-q5`,type:`mc`,q:`<p>Which term provides damping on the inverted pendulum?</p>
`,explain:`<p>It opposes angular velocity.</p>
`,options:[`derivative`,`integral`,`proportional`,`none of them`],answer:0},{id:`p13-l07-q6`,type:`mc`,q:`<p>Why are the lab’s cart-position gains positive?</p>
`,explain:`<p>Non-minimum-phase behaviour.</p>
`,options:[`you must lean the pole towards where the cart should go, by first moving the cart away`,`it’s a sign error`,`the rail is tilted`,`to make the cart drift`],answer:0}],"p13-l08":[{id:`p13-l08-q1`,type:`num`,q:`<p>RMS in rad/s of a raw derivative of 0.0087 rad white noise sampled at 5 ms?</p>
`,explain:`<p>√2 σ/T_s.</p>
`,answer:2.46,tol:.01,unit:`rad/s`},{id:`p13-l08-q2`,type:`num`,q:`<p>Filter coefficient a for T_f = 12 ms and T_s = 5 ms?</p>
`,explain:`<p>e^(−T_s/T_f).</p>
`,answer:.659,tol:.002,unit:``},{id:`p13-l08-q3`,type:`num`,q:`<p>Factor by which that filter reduces derivative noise RMS?</p>
`,explain:`<p>√2 over (1 − a)√(2/(1 + a)).</p>
`,answer:3.78,tol:.01,unit:``},{id:`p13-l08-q4`,type:`num`,q:`<p>Phase lag in degrees of a 100 ms filter at 7 rad/s?</p>
`,explain:`<p>arctan(ωT_f).</p>
`,answer:35,tol:.01,unit:`°`},{id:`p13-l08-q5`,type:`mc`,q:`<p>High-frequency gain of K_d s/(T_f s + 1)?</p>
`,explain:`<p>The filter caps it.</p>
`,options:[`K_d/T_f`,`infinite`,`zero`,`K_d`],answer:0},{id:`p13-l08-q6`,type:`mc`,q:`<p>What limits how much you can filter the derivative?</p>
`,explain:`<p>Damping that arrives late is no damping.</p>
`,options:[`the phase lag erodes the damping`,`the actuator saturates more`,`the integral winds up`,`nothing`],answer:0}],"p13-l09":[{id:`p13-l09-q1`,type:`num`,q:`<p>Voltage in V the PI asks for at the first instant of a 200 rad/s step with K_p = 0.12?</p>
`,explain:`<p>K_p e, before any integral.</p>
`,answer:24,tol:.001,unit:`V`},{id:`p13-l09-q2`,type:`num`,q:`<p>Integral time T_i in ms for K_p = 0.12 and K_i = 2.5?</p>
`,explain:`<p>K_p/K_i.</p>
`,answer:48,tol:.001,unit:`ms`},{id:`p13-l09-q3`,type:`num`,q:`<p>Steady voltage in V needed for 200 rad/s with a DC gain of 19.81 (rad/s)/V?</p>
`,explain:`<p>Within the 12 V limit.</p>
`,answer:10.1,tol:.003,unit:`V`},{id:`p13-l09-q4`,type:`num`,q:`<p>Largest step in rad/s that doesn’t saturate a 12 V drive at the first instant with K_p = 0.12?</p>
`,explain:`<p>K_p e ≤ V_max.</p>
`,answer:100,tol:.001,unit:`rad/s`},{id:`p13-l09-q5`,type:`mc`,q:`<p>Back-calculation drives the integrator using…</p>
`,explain:`<p>(u − v)/T_t.</p>
`,options:[`the difference between the saturated and unsaturated output`,`the derivative of the error`,`the motor current`,`a separate model`],answer:0},{id:`p13-l09-q6`,type:`mc`,q:`<p>Without anti-windup, saturation typically causes…</p>
`,explain:`<p>The stored integral has to unwind.</p>
`,options:[`larger overshoot and slower settling`,`zero overshoot`,`faster settling`,`a steady error`],answer:0}],"p13-l10":[{id:`p13-l10-q1`,type:`num`,q:`<p>Ultimate gain of 1/(s + 1)³?</p>
`,explain:`<p>The gain magnitude at √3 rad/s is 1/8.</p>
`,answer:8,tol:.001,unit:``},{id:`p13-l10-q2`,type:`num`,q:`<p>Ultimate period in s of 1/(s + 1)³?</p>
`,explain:`<p>2π/√3.</p>
`,answer:3.628,tol:.002,unit:`s`},{id:`p13-l10-q3`,type:`num`,q:`<p>Describing-function gain of a ±1 relay when the output oscillates ±0.16?</p>
`,explain:`<p>4d/(πa).</p>
`,answer:7.96,tol:.005,unit:``},{id:`p13-l10-q4`,type:`num`,q:`<p>Ziegler-Nichols K_p for K_u = 8?</p>
`,explain:`<p>0.6 K_u.</p>
`,answer:4.8,tol:.001,unit:``},{id:`p13-l10-q5`,type:`mc`,q:`<p>Why use a relay rather than raising P gain to find K_u?</p>
`,explain:`<p>The experiment stays small and safe.</p>
`,options:[`the oscillation amplitude is controlled by the relay level`,`it’s more accurate than the exact value`,`it doesn’t need a plant`,`it gives zero steady error`],answer:0},{id:`p13-l10-q6`,type:`mc`,q:`<p>Ziegler-Nichols PID tunings are typically…</p>
`,explain:`<p>Detune them in practice.</p>
`,options:[`aggressive, with large overshoot`,`very conservative`,`optimal for noise`,`unstable`],answer:0}],"p13-l11":[{id:`p13-l11-q1`,type:`num`,q:`<p>Asymptote centroid of 1/(s(s + 2)(s + 4))?</p>
`,explain:`<p>Sum of poles over n − m.</p>
`,answer:-2,tol:0,unit:``},{id:`p13-l11-q2`,type:`num`,q:`<p>Breakaway point of that locus?</p>
`,explain:`<p>Root of 3s² + 12s + 8 between the poles.</p>
`,answer:-.8453,tol:.001,unit:``},{id:`p13-l11-q3`,type:`num`,q:`<p>Gain at the breakaway point?</p>
`,explain:`<p>K = |s||s + 2||s + 4|.</p>
`,answer:3.079,tol:.002,unit:``},{id:`p13-l11-q4`,type:`num`,q:`<p>Gain at which it crosses into the right half-plane?</p>
`,explain:`<p>Routh.</p>
`,answer:48,tol:0,unit:``},{id:`p13-l11-q5`,type:`mc`,q:`<p>A point is on the root locus when…</p>
`,explain:`<p>The magnitude then gives K.</p>
`,options:[`the angle of L(s) is 180° (mod 360°)`,`|L(s)| = 1`,`L(s) is real`,`it is a pole of L`],answer:0},{id:`p13-l11-q6`,type:`mc`,q:`<p>As K → ∞, branches end at…</p>
`,explain:`<p>D + KN ≈ KN.</p>
`,options:[`the open-loop zeros, or infinity along asymptotes`,`the open-loop poles`,`the origin`,`the imaginary axis`],answer:0}],"p13-l12":[{id:`p13-l12-q1`,type:`num`,q:`<p>α for a lead that adds 42° at most?</p>
`,explain:`<p>(1 − sin φ)/(1 + sin φ).</p>
`,answer:.198,tol:.005,unit:``},{id:`p13-l12-q2`,type:`num`,q:`<p>Maximum phase in degrees of a lead with α = 0.1?</p>
`,explain:`<p>arcsin((1 − α)/(1 + α)).</p>
`,answer:54.9,tol:.005,unit:`°`},{id:`p13-l12-q3`,type:`num`,q:`<p>Lead gain in dB at ω_m for α = 0.198?</p>
`,explain:`<p>1/√α.</p>
`,answer:7.03,tol:.01,unit:`dB`},{id:`p13-l12-q4`,type:`num`,q:`<p>Phase margin in degrees of 10/(s(s + 1)) without compensation?</p>
`,explain:`<p>Crossover at 3.08 rad/s.</p>
`,answer:17.96,tol:.005,unit:`°`},{id:`p13-l12-q5`,type:`mc`,q:`<p>A lag compensator mainly…</p>
`,explain:`<p>Its corner sits a decade below crossover.</p>
`,options:[`raises low-frequency gain without moving crossover much`,`adds phase at crossover`,`removes the integrator`,`speeds up the response`],answer:0},{id:`p13-l12-q6`,type:`mc`,q:`<p>Where should a lead’s maximum phase be placed?</p>
`,explain:`<p>That is where phase margin is measured.</p>
`,options:[`at the new gain crossover frequency`,`at DC`,`at the plant pole`,`far above crossover`],answer:0}],"p13-l13":[{id:`p13-l13-q1`,type:`num`,q:`<p>Error in dB of a real-pole asymptote at its corner?</p>
`,explain:`<p>The exact gain there is 1/√2.</p>
`,answer:3.01,tol:.002,unit:`dB`},{id:`p13-l13-q2`,type:`num`,q:`<p>Resonant peak above the asymptote in dB for ζ = 0.1?</p>
`,explain:`<p>−20 log₁₀(2ζ).</p>
`,answer:13.98,tol:.002,unit:`dB`},{id:`p13-l13-q3`,type:`num`,q:`<p>Exact gain in dB of the worked example at 10 rad/s?</p>
`,explain:`<p>The corner’s 3 dB; the other factors nearly cancel.</p>
`,answer:-3.01,tol:.01,unit:`dB`},{id:`p13-l13-q4`,type:`num`,q:`<p>High-frequency slope in dB/decade of the worked example?</p>
`,explain:`<p>Three poles, one zero.</p>
`,answer:-40,tol:0,unit:`dB/dec`},{id:`p13-l13-q5`,type:`mc`,q:`<p>Why do Bode plots add factor by factor?</p>
`,explain:`<p>Phase adds directly too.</p>
`,options:[`the logarithm of a product is a sum of logarithms`,`frequencies add`,`the poles are real`,`scipy does it that way`],answer:0},{id:`p13-l13-q6`,type:`mc`,q:`<p>A complex pair’s phase at its natural frequency is…</p>
`,explain:`<p>Half of its total −180°.</p>
`,options:[`−90°`,`−45°`,`−180°`,`0°`],answer:0}],"p13-l14":[{id:`p13-l14-q1`,type:`num`,q:`<p>Closed-loop RHP poles if P = 1 and the plot encircles −1 once clockwise?</p>
`,explain:`<p>Z = N + P.</p>
`,answer:2,tol:0,unit:``},{id:`p13-l14-q2`,type:`num`,q:`<p>Encirclements needed for stability when P = 2 (counting clockwise as positive)?</p>
`,explain:`<p>Two counter-clockwise.</p>
`,answer:-2,tol:0,unit:``},{id:`p13-l14-q3`,type:`num`,q:`<p>Where does L = K/((s − 1)(s + 2)) cross the negative real axis at ω = 0 for K = 3?</p>
`,explain:`<p>L(0) = −K/2.</p>
`,answer:-1.5,tol:0,unit:``},{id:`p13-l14-q4`,type:`num`,q:`<p>Smallest K that stabilises K/((s − 1)(s + 2))?</p>
`,explain:`<p>The constant term K − 2 must be positive.</p>
`,answer:2,tol:0,unit:``},{id:`p13-l14-q5`,type:`mc`,q:`<p>The zeros of 1 + L(s) are…</p>
`,explain:`<p>1 + L = (D + N)/D.</p>
`,options:[`the closed-loop poles`,`the open-loop zeros`,`the open-loop poles`,`always stable`],answer:0},{id:`p13-l14-q6`,type:`mc`,q:`<p>Why indent the contour around poles on the imaginary axis?</p>
`,explain:`<p>The detour maps to a large arc.</p>
`,options:[`L is infinite there, so the contour must avoid them`,`to make the plot symmetric`,`to count zeros`,`to remove the integrator`],answer:0}],"p13-l15":[{id:`p13-l15-q1`,type:`num`,q:`<p>Gain margin of 2/(s(s + 1)(s + 2))?</p>
`,explain:`<p>Routh limit 6 over the current gain 2.</p>
`,answer:3,tol:.001,unit:``},{id:`p13-l15-q2`,type:`num`,q:`<p>That gain margin in dB?</p>
`,explain:`<p>20 log₁₀ 3.</p>
`,answer:9.54,tol:.002,unit:`dB`},{id:`p13-l15-q3`,type:`num`,q:`<p>Delay margin in s with PM = 32.6° at 0.749 rad/s?</p>
`,explain:`<p>PM in radians over ω_c.</p>
`,answer:.76,tol:.005,unit:`s`},{id:`p13-l15-q4`,type:`num`,q:`<p>Phase in degrees lost to a 3.5 ms delay at 20 rad/s?</p>
`,explain:`<p>ωτ.</p>
`,answer:4.01,tol:.01,unit:`°`},{id:`p13-l15-q5`,type:`mc`,q:`<p>A pure time delay changes…</p>
`,explain:`<p>Its magnitude is 1 at all frequencies.</p>
`,options:[`phase only, by −ωτ`,`gain only`,`both gain and phase`,`nothing`],answer:0},{id:`p13-l15-q6`,type:`mc`,q:`<p>At the gain limit the loop oscillates at…</p>
`,explain:`<p>Where the phase is −180°.</p>
`,options:[`the phase crossover frequency`,`the gain crossover frequency`,`DC`,`the highest plant pole`],answer:0}],"p13-l16":[{id:`p13-l16-q1`,type:`num`,q:`<p>S + T at any frequency?</p>
`,explain:`<p>(1 + L)/(1 + L).</p>
`,answer:1,tol:0,unit:``},{id:`p13-l16-q2`,type:`num`,q:`<p>Guaranteed gain margin for M_s = 2?</p>
`,explain:`<p>M_s/(M_s − 1).</p>
`,answer:2,tol:.001,unit:``},{id:`p13-l16-q3`,type:`num`,q:`<p>Guaranteed phase margin in degrees for M_s = 2?</p>
`,explain:`<p>2 arcsin(1/(2M_s)).</p>
`,answer:28.96,tol:.005,unit:`°`},{id:`p13-l16-q4`,type:`num`,q:`<p>Bode integral of ln|S| for a loop with one open-loop RHP pole at s = 1?</p>
`,explain:`<p>π times the sum of RHP poles.</p>
`,answer:3.1416,tol:.001,unit:``},{id:`p13-l16-q5`,type:`mc`,q:`<p>Sensor noise reaches the output through…</p>
`,explain:`<p>The loop tracks the measurement.</p>
`,options:[`T`,`S`,`the plant only`,`the integral`],answer:0},{id:`p13-l16-q6`,type:`mc`,q:`<p>The waterbed effect says…</p>
`,explain:`<p>The integral of ln|S| is fixed.</p>
`,options:[`reducing |S| in one band raises it in another`,`S is always below 1`,`T and S are equal`,`feedback removes noise`],answer:0}],"p13-l17":[{id:`p13-l17-q1`,type:`num`,q:`<p>Phase lag in degrees of a 2 s delay at 0.5 rad/s?</p>
`,explain:`<p>ωθ = 1 rad.</p>
`,answer:57.3,tol:.002,unit:`°`},{id:`p13-l17-q2`,type:`num`,q:`<p>Phase margin in degrees of 0.5e^(−2s)/s?</p>
`,explain:`<p>Crossover at 0.5 rad/s.</p>
`,answer:32.7,tol:.01,unit:`°`},{id:`p13-l17-q3`,type:`num`,q:`<p>Dead time in s for 3 m at 0.5 m/s?</p>
`,explain:`<p>Distance over speed.</p>
`,answer:6,tol:0,unit:`s`},{id:`p13-l17-q4`,type:`num`,q:`<p>Phase error in degrees of the first-order Padé at ωθ = 0.5?</p>
`,explain:`<p>−2 arctan(ωθ/2) versus −ωθ.</p>
`,answer:.58,tol:.03,unit:`°`},{id:`p13-l17-q5`,type:`mc`,q:`<p>With an exact model, the Smith predictor makes the closed loop…</p>
`,explain:`<p>The delay moves outside the loop.</p>
`,options:[`the delay-free closed loop followed by the delay`,`delay-free`,`unstable`,`identical to plain PI`],answer:0},{id:`p13-l17-q6`,type:`mc`,q:`<p>The first-order Padé approximation has…</p>
`,explain:`<p>Its zero is at +2/θ.</p>
`,options:[`a right-half-plane zero`,`a double pole`,`no phase`,`gain that falls with frequency`],answer:0}],"p13-l18":[{id:`p13-l18-q1`,type:`num`,q:`<p>Gravity torque in N·m of 0.5 kg at 0.3 m, arm horizontal?</p>
`,explain:`<p>mgℓ.</p>
`,answer:1.4715,tol:.001,unit:`N·m`},{id:`p13-l18-q2`,type:`num`,q:`<p>Static PD error in rad from that gravity at θ = 1 rad with K_p = 20?</p>
`,explain:`<p>mgℓ sin θ / K_p.</p>
`,answer:.0619,tol:.01,unit:`rad`},{id:`p13-l18-q3`,type:`num`,q:`<p>Inertial feedforward torque in N·m at peak reference acceleration 0.6 rad/s² with J = 0.05?</p>
`,explain:`<p>J θ̈_r.</p>
`,answer:.03,tol:.001,unit:`N·m`},{id:`p13-l18-q4`,type:`num`,q:`<p>Fraction of the error left if feedforward removes 90 % of the required torque (ideal linear case)?</p>
`,explain:`<p>Feedback handles the remainder.</p>
`,answer:.1,tol:.001,unit:``},{id:`p13-l18-q5`,type:`mc`,q:`<p>Does adding feedforward change closed-loop stability?</p>
`,explain:`<p>The loop transfer function is unchanged.</p>
`,options:[`no, it acts outside the loop`,`yes, it adds poles`,`it always destabilises`,`only for integrators`],answer:0},{id:`p13-l18-q6`,type:`mc`,q:`<p>Gravity compensation on a robot joint is an example of…</p>
`,explain:`<p>A known disturbance cancelled at the input.</p>
`,options:[`disturbance feedforward`,`integral action`,`a Smith predictor`,`derivative filtering`],answer:0}],"p13-l19":[{id:`p13-l19-q1`,type:`num`,q:`<p>Current-loop proportional gain in V/A for L = 2 mH and ω_i = 3000 rad/s?</p>
`,explain:`<p>K_p,i = L ω_i.</p>
`,answer:6,tol:.001,unit:`V/A`},{id:`p13-l19-q2`,type:`num`,q:`<p>Current-loop integral gain in V/(A·s) for R = 1.2 Ω and ω_i = 3000 rad/s?</p>
`,explain:`<p>K_i,i = R ω_i, which puts the zero at R/L.</p>
`,answer:3600,tol:.001,unit:`V/(A·s)`},{id:`p13-l19-q3`,type:`num`,q:`<p>Speed-loop gain in A per rad/s for J = 2e-4, k = 0.05 and ω_s = 300 rad/s?</p>
`,explain:`<p>K_p,s = J ω_s / k.</p>
`,answer:1.2,tol:.001,unit:`A/(rad/s)`},{id:`p13-l19-q4`,type:`num`,q:`<p>With 10× separation per level below a current loop at ω_i = 3000 rad/s, what is the position bandwidth in rad/s?</p>
`,explain:`<p>Two levels of 10× separation.</p>
`,answer:30,tol:.001,unit:`rad/s`},{id:`p13-l19-q5`,type:`mc`,q:`<p>Which loop is innermost in a motor servo cascade?</p>
`,explain:`<p>The fastest dynamics go innermost.</p>
`,options:[`current (torque)`,`speed`,`position`,`temperature`],answer:0},{id:`p13-l19-q6`,type:`mc`,q:`<p>Why does the position loop usually need no integral term?</p>
`,explain:`<p>The speed PI holds zero speed error under constant load, and the plant from speed to position is already an integrator.</p>
`,options:[`the speed loop’s integrator already rejects load torque`,`position cannot have steady-state error`,`integrators are unstable`,`the current loop removes all errors`],answer:0}],"p13-l20":[{id:`p13-l20-q1`,type:`num`,q:`<p>Derivative filter coefficient T_f/(T_f + T_s) for T_f = 10 ms and T_s = 1 ms?</p>
`,explain:`<p>Backward Euler of the first-order filter.</p>
`,answer:.90909,tol:.001,unit:``},{id:`p13-l20-q2`,type:`num`,q:`<p>Integrator increment per sample for K_i = 10, T_s = 1 ms and e = 0.5?</p>
`,explain:`<p>K_i T_s e.</p>
`,answer:.005,tol:.001,unit:``},{id:`p13-l20-q3`,type:`num`,q:`<p>Phase lost in degrees to a 50 µs latency at a 3000 rad/s crossover?</p>
`,explain:`<p>ω_c t_d in radians, converted.</p>
`,answer:8.594,tol:.01,unit:`deg`},{id:`p13-l20-q4`,type:`num`,q:`<p>CPU load in percent of a 50 µs ISR at 10 kHz?</p>
`,explain:`<p>Execution time over period.</p>
`,answer:50,tol:.001,unit:`%`},{id:`p13-l20-q5`,type:`mc`,q:`<p>Why take the derivative on the measurement rather than the error?</p>
`,explain:`<p>The setpoint is piecewise constant; differentiating it gives spikes.</p>
`,options:[`a setpoint step then causes no derivative kick`,`it is more accurate`,`it removes the need for a filter`,`it makes the loop faster`],answer:0},{id:`p13-l20-q6`,type:`mc`,q:`<p>Conditional-integration anti-windup stops the integrator when…</p>
`,explain:`<p>It integrates normally as soon as the error would bring the output back.</p>
`,options:[`the output is saturated and the error pushes further into saturation`,`the error is zero`,`the derivative is large`,`the sample period is late`],answer:0}]};export{e as default};