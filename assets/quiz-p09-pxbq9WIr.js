var e={"p09-l01":[{id:`p09-l01-q1`,type:`num`,q:`<p>Force constant in N/A for N = 50, B = 0.8 T, L = 0.03 m per turn?</p>
`,explain:`<p>k = N·B·L.</p>
`,answer:1.2,tol:.001,unit:`N/A`},{id:`p09-l01-q2`,type:`num`,q:`<p>Force in N on that coil at 2 A?</p>
`,explain:`<p>F = k·I.</p>
`,answer:2.4,tol:.001,unit:`N`},{id:`p09-l01-q3`,type:`num`,q:`<p>Back-EMF in V at 0.5 m/s?</p>
`,explain:`<p>e = k·v.</p>
`,answer:.6,tol:.001,unit:`V`},{id:`p09-l01-q4`,type:`num`,q:`<p>Back-EMF in V of a 0.05 N·m/A motor at 3000 rpm?</p>
`,explain:`<p>k_e = k_t in SI units.</p>
`,answer:15.71,tol:.002,unit:`V`},{id:`p09-l01-q5`,type:`mc`,q:`<p>Why is k_f equal to k_e?</p>
`,explain:`<p>Electrical power in equals mechanical power out.</p>
`,options:[`energy conservation, e·I = F·v`,`because B is uniform`,`by coincidence of units`,`only for voice coils`],answer:0},{id:`p09-l01-q6`,type:`mc`,q:`<p>Reversing the current in the coil…</p>
`,explain:`<p>F = I L × B is linear in I.</p>
`,options:[`doubles the force`,`leaves the force unchanged`,`removes the back-EMF`,`reverses the force`],answer:3}],"p09-l02":[{id:`p09-l02-q1`,type:`num`,q:`<p>No-load steady speed in rad/s at 12 V (worked-example motor)?</p>
`,explain:`<p>kV/(k² + Rb).</p>
`,answer:596.4,tol:.001,unit:`rad/s`},{id:`p09-l02-q2`,type:`num`,q:`<p>Steady speed in rad/s at 12 V with a 0.05 N·m load?</p>
`,explain:`<p>(kV − R·T_L)/(k² + Rb).</p>
`,answer:447.3,tol:.001,unit:`rad/s`},{id:`p09-l02-q3`,type:`num`,q:`<p>Electrical time constant in ms?</p>
`,explain:`<p>L/R.</p>
`,answer:.5,tol:.001,unit:`ms`},{id:`p09-l02-q4`,type:`num`,q:`<p>Mechanical time constant in ms?</p>
`,explain:`<p>JR/(k² + Rb).</p>
`,answer:8.946,tol:.002,unit:`ms`},{id:`p09-l02-q5`,type:`num`,q:`<p>Starting (inrush) current in A at 12 V?</p>
`,explain:`<p>No back-EMF at standstill, so V/R.</p>
`,answer:10,tol:.001,unit:`A`},{id:`p09-l02-q6`,type:`mc`,q:`<p>At no load and no friction, a DC motor’s speed is set by…</p>
`,explain:`<p>It accelerates until kω ≈ V.</p>
`,options:[`its inertia`,`V/k, where back-EMF balances the supply`,`its inductance`,`the load torque`],answer:1}],"p09-l03":[{id:`p09-l03-q1`,type:`num`,q:`<p>R in Ω from a locked-rotor test at 1.0 V settling at 0.833 A?</p>
`,explain:`<p>R = V/i∞.</p>
`,answer:1.2,tol:.002,unit:`Ω`},{id:`p09-l03-q2`,type:`num`,q:`<p>L in mH if the 63 % time is 0.50 ms with R = 1.2 Ω?</p>
`,explain:`<p>L = τ·R.</p>
`,answer:.6,tol:.001,unit:`mH`},{id:`p09-l03-q3`,type:`num`,q:`<p>k from a no-load test at 12 V, 595.2 rad/s, 79.5 mA (R = 1.2 Ω)?</p>
`,explain:`<p>(V − R·i)/ω.</p>
`,answer:.02,tol:.002,unit:`V·s/rad`},{id:`p09-l03-q4`,type:`num`,q:`<p>J in kg·m² if b = 2e-6 N·m·s and the spin-down time constant is 1.5 s?</p>
`,explain:`<p>τ = J/b.</p>
`,answer:3e-6,tol:.001,unit:`kg·m²`},{id:`p09-l03-q5`,type:`num`,q:`<p>Time in s for that spin-down to stop from 595 rad/s with T_c/b = 200 rad/s?</p>
`,explain:`<p>t = τ ln(1 + ω₀ b/T_c).</p>
`,answer:2.07,tol:.002,unit:`s`},{id:`p09-l03-q6`,type:`mc`,q:`<p>The locked-rotor test is done at low voltage because…</p>
`,explain:`<p>No back-EMF limits the current.</p>
`,options:[`the full stall current would overheat the winding`,`k changes with voltage`,`inductance depends on voltage`,`the back-EMF is too large`],answer:0}],"p09-l04":[{id:`p09-l04-q1`,type:`num`,q:`<p>Stall torque in N·m (12 V, 1.2 Ω, k = 0.02)?</p>
`,explain:`<p>kV/R.</p>
`,answer:.2,tol:.001,unit:`N·m`},{id:`p09-l04-q2`,type:`num`,q:`<p>Peak output power in W?</p>
`,explain:`<p>V²/(4R).</p>
`,answer:30,tol:.001,unit:`W`},{id:`p09-l04-q3`,type:`num`,q:`<p>Speed in rad/s at peak power?</p>
`,explain:`<p>ω₀/2.</p>
`,answer:300,tol:.001,unit:`rad/s`},{id:`p09-l04-q4`,type:`num`,q:`<p>Peak efficiency with I₀ = 0.15 A and I_s = 10 A, in %?</p>
`,explain:`<p>(1 − √(I₀/I_s))².</p>
`,answer:77,tol:.002,unit:`%`},{id:`p09-l04-q5`,type:`num`,q:`<p>Current in A at peak efficiency?</p>
`,explain:`<p>√(I₀·I_s).</p>
`,answer:1.2247,tol:.002,unit:`A`},{id:`p09-l04-q6`,type:`mc`,q:`<p>The maximum efficiency at the peak-power point is…</p>
`,explain:`<p>Half the input is lost in R there.</p>
`,options:[`100 %`,`50 %`,`25 %`,`77 %`],answer:1}],"p09-l05":[{id:`p09-l05-q1`,type:`num`,q:`<p>Optimum ratio for J_L = 0.01 and J_m = 1e-5 kg·m²?</p>
`,explain:`<p>√(J_L/J_m).</p>
`,answer:31.62,tol:.002,unit:``},{id:`p09-l05-q2`,type:`num`,q:`<p>Maximum load acceleration in rad/s² with T_m = 0.1 N·m?</p>
`,explain:`<p>T_m/(2√(J_L J_m)).</p>
`,answer:158.1,tol:.002,unit:`rad/s²`},{id:`p09-l05-q3`,type:`num`,q:`<p>Reflected inertia in kg·m² of 0.01 kg·m² through a 100:1 gearbox?</p>
`,explain:`<p>J_L/N².</p>
`,answer:1e-6,tol:.001,unit:`kg·m²`},{id:`p09-l05-q4`,type:`num`,q:`<p>Highest ratio in rad/s terms if the motor tops out at 628 rad/s and the joint needs 30 rad/s?</p>
`,explain:`<p>ω_motor,max/ω_load.</p>
`,answer:20.93,tol:.002,unit:``},{id:`p09-l05-q5`,type:`num`,q:`<p>Load acceleration in rad/s² at N = 20.93?</p>
`,explain:`<p>N·T_m/(J_L + N²J_m).</p>
`,answer:145,tol:.005,unit:`rad/s²`},{id:`p09-l05-q6`,type:`mc`,q:`<p>At the optimum ratio…</p>
`,explain:`<p>J_L/N² = J_m.</p>
`,options:[`the gearbox efficiency is highest`,`the reflected load inertia equals the motor inertia`,`the motor runs at no-load speed`,`the load inertia equals the motor inertia`],answer:1}],"p09-l06":[{id:`p09-l06-q1`,type:`num`,q:`<p>Average voltage in V at D = 0.75 on a 24 V bus?</p>
`,explain:`<p>D·V_bus.</p>
`,answer:18,tol:.001,unit:`V`},{id:`p09-l06-q2`,type:`num`,q:`<p>Ripple in A at D = 0.5, 24 V, 1 mH, 20 kHz?</p>
`,explain:`<p>V·D(1 − D)/(L·f).</p>
`,answer:.3,tol:.001,unit:`A`},{id:`p09-l06-q3`,type:`num`,q:`<p>Ripple in A at D = 0.75 (same bridge)?</p>
`,explain:`<p>D(1 − D) = 0.1875.</p>
`,answer:.225,tol:.001,unit:`A`},{id:`p09-l06-q4`,type:`num`,q:`<p>PWM frequency in kHz for ≤ 0.2 A ripple, 12 V, 0.1 mH?</p>
`,explain:`<p>V/(4L·ΔI).</p>
`,answer:150,tol:.001,unit:`kHz`},{id:`p09-l06-q5`,type:`num`,q:`<p>Average voltage in V lost to 0.5 µs dead time at 20 kHz (24 V bus, 0.7 V diode)?</p>
`,explain:`<p>t_d·f·(V + V_d).</p>
`,answer:.247,tol:.002,unit:`V`},{id:`p09-l06-q6`,type:`mc`,q:`<p>Shoot-through happens when…</p>
`,explain:`<p>That shorts the supply.</p>
`,options:[`the high and low switch of the same leg are on together`,`the motor stalls`,`dead time is too long`,`both low-side switches are on`],answer:0}],"p09-l07":[{id:`p09-l07-q1`,type:`num`,q:`<p>K_p in V/A for L = 1 mH and ω_c = 6283 rad/s?</p>
`,explain:`<p>K_p = L·ω_c.</p>
`,answer:6.283,tol:.001,unit:`V/A`},{id:`p09-l07-q2`,type:`num`,q:`<p>K_i in V/(A·s) for R = 1 Ω at the same bandwidth?</p>
`,explain:`<p>K_i = R·ω_c.</p>
`,answer:6283,tol:.001,unit:``},{id:`p09-l07-q3`,type:`num`,q:`<p>Phase lost in degrees to 75 µs of delay at 1 kHz crossover?</p>
`,explain:`<p>ω_c·T_d.</p>
`,answer:27,tol:.01,unit:`°`},{id:`p09-l07-q4`,type:`num`,q:`<p>Time in µs to reach 63 % of a step at ω_c = 6283 rad/s?</p>
`,explain:`<p>1/ω_c for a first-order loop.</p>
`,answer:159.2,tol:.002,unit:`µs`},{id:`p09-l07-q5`,type:`num`,q:`<p>Rule-of-thumb maximum current-loop bandwidth in Hz for a 20 kHz loop?</p>
`,explain:`<p>f_s/20.</p>
`,answer:1e3,tol:.001,unit:`Hz`},{id:`p09-l07-q6`,type:`mc`,q:`<p>Pole-zero cancellation places the PI zero…</p>
`,explain:`<p>K_i/K_p = R/L.</p>
`,options:[`on the plant pole at −R/L`,`at the crossover frequency`,`at the origin`,`at the PWM frequency`],answer:0}],"p09-l08":[{id:`p09-l08-q1`,type:`num`,q:`<p>Full-step angle in degrees for 50 rotor teeth?</p>
`,explain:`<p>360°/(4N_r).</p>
`,answer:1.8,tol:.001,unit:`°`},{id:`p09-l08-q2`,type:`num`,q:`<p>Microsteps per revolution at 1/16 on a 200-step motor?</p>
`,explain:`<p>200 × 16.</p>
`,answer:3200,tol:.001,unit:``},{id:`p09-l08-q3`,type:`num`,q:`<p>Ratio of the largest to smallest current magnitude in uncompensated half stepping?</p>
`,explain:`<p>One phase versus two.</p>
`,answer:1.4142,tol:.001,unit:``},{id:`p09-l08-q4`,type:`num`,q:`<p>Static deflection in degrees under a load of 10 % of holding torque (N_r = 50)?</p>
`,explain:`<p>arcsin(T_L/T_h)/N_r.</p>
`,answer:.1148,tol:.002,unit:`°`},{id:`p09-l08-q5`,type:`num`,q:`<p>8-bit table value 127·cos(16.875°), rounded?</p>
`,explain:`<p>Microstep 3 of 16.</p>
`,answer:122,tol:.001,unit:``},{id:`p09-l08-q6`,type:`mc`,q:`<p>Which drive mode keeps the current vector’s magnitude constant?</p>
`,explain:`<p>cos² + sin² = 1.</p>
`,options:[`full step, one phase on`,`sin/cos microstepping`,`wave drive`,`half step`],answer:1}],"p09-l09":[{id:`p09-l09-q1`,type:`num`,q:`<p>Natural frequency in Hz (T_h = 0.5 N·m, N_r = 50, J = 5e-5 kg·m²)?</p>
`,explain:`<p>√(T_h N_r/J)/2π.</p>
`,answer:112.5,tol:.002,unit:`Hz`},{id:`p09-l09-q2`,type:`num`,q:`<p>Maximum acceleration in rad/s² with a 0.1 N·m load?</p>
`,explain:`<p>(T_h − T_L)/J.</p>
`,answer:8e3,tol:.001,unit:`rad/s²`},{id:`p09-l09-q3`,type:`num`,q:`<p>Maximum acceleration in rad/s² with an abrupt ramp (same motor and load)?</p>
`,explain:`<p>The step overshoot doubles J·α.</p>
`,answer:4e3,tol:.001,unit:`rad/s²`},{id:`p09-l09-q4`,type:`num`,q:`<p>Full steps lost per slip?</p>
`,explain:`<p>One electrical cycle.</p>
`,answer:4,tol:.001,unit:``},{id:`p09-l09-q5`,type:`num`,q:`<p>Small-angle stiffness in N·m/rad?</p>
`,explain:`<p>T_h·N_r.</p>
`,answer:25,tol:.001,unit:`N·m/rad`},{id:`p09-l09-q6`,type:`mc`,q:`<p>An open-loop stepper that misses steps…</p>
`,explain:`<p>It has no position feedback.</p>
`,options:[`automatically retries`,`keeps counting as if it hadn’t, so its position is wrong`,`recalibrates at the next step`,`stops and raises an error`],answer:1}],"p09-l10":[{id:`p09-l10-q1`,type:`num`,q:`<p>Electrical frequency in Hz of a 15-pole-pair motor at 600 rpm?</p>
`,explain:`<p>p × mechanical rev/s.</p>
`,answer:150,tol:.001,unit:`Hz`},{id:`p09-l10-q2`,type:`num`,q:`<p>Commutation events per second at that speed?</p>
`,explain:`<p>Six per electrical cycle.</p>
`,answer:900,tol:.001,unit:``},{id:`p09-l10-q3`,type:`num`,q:`<p>Average torque factor of six-step with ideal 60–120° lead?</p>
`,explain:`<p>Mean of sin over 60–120°.</p>
`,answer:.9549,tol:.001,unit:``},{id:`p09-l10-q4`,type:`num`,q:`<p>Field angle in degrees of the pair A+ C−?</p>
`,explain:`<p>Â − Ĉ.</p>
`,answer:30,tol:.001,unit:`°`},{id:`p09-l10-q5`,type:`mc`,q:`<p>In six-step drive, how many phases carry current at a time?</p>
`,explain:`<p>One in, one out, one floating.</p>
`,options:[`it alternates between one and three`,`one`,`two`,`three`],answer:2},{id:`p09-l10-q6`,type:`mc`,q:`<p>To reverse a BLDC, the drive…</p>
`,explain:`<p>Torque sign follows sin(lead).</p>
`,options:[`reverses the Hall sequence wiring`,`lowers the PWM frequency`,`swaps the bus polarity`,`picks the vector lagging the rotor by 60–120°`],answer:3}],"p09-l11":[{id:`p09-l11-q1`,type:`num`,q:`<p>i_β in A for i_a = −0.643, i_b = 0.985, i_c = −0.342?</p>
`,explain:`<p>(i_b − i_c)/√3.</p>
`,answer:.766,tol:.002,unit:`A`},{id:`p09-l11-q2`,type:`num`,q:`<p>i_q in A at θ = 40° for i_α = −0.643, i_β = 0.766?</p>
`,explain:`<p>−i_α sin θ + i_β cos θ.</p>
`,answer:1,tol:.002,unit:`A`},{id:`p09-l11-q3`,type:`num`,q:`<p>Torque-current fraction with a 10° angle error?</p>
`,explain:`<p>cos of the error.</p>
`,answer:.9848,tol:.001,unit:``},{id:`p09-l11-q4`,type:`num`,q:`<p>Length of the α–β vector for a balanced set of amplitude 2 A (amplitude-invariant Clarke)?</p>
`,explain:`<p>The 2/3 factor keeps amplitude.</p>
`,answer:2,tol:.001,unit:`A`},{id:`p09-l11-q5`,type:`mc`,q:`<p>In the dq frame, balanced sinusoidal currents look like…</p>
`,explain:`<p>The frame rotates with them.</p>
`,options:[`noise`,`sinusoids at twice the frequency`,`square waves`,`constants`],answer:3},{id:`p09-l11-q6`,type:`mc`,q:`<p>The d axis points…</p>
`,explain:`<p>q is 90° ahead of d.</p>
`,options:[`along the rotor magnet’s flux`,`90° ahead of the rotor flux`,`along phase a`,`along the stator current`],answer:0}],"p09-l12":[{id:`p09-l12-q1`,type:`num`,q:`<p>Torque in N·m for p = 4, ψ = 0.01 Wb, i_q = 5 A?</p>
`,explain:`<p>(3/2)·p·ψ·i_q.</p>
`,answer:.3,tol:.001,unit:`N·m`},{id:`p09-l12-q2`,type:`num`,q:`<p>Electrical speed in rad/s at 3000 rpm with 4 pole pairs?</p>
`,explain:`<p>ω_e = p·ω_m.</p>
`,answer:1256.6,tol:.001,unit:`rad/s`},{id:`p09-l12-q3`,type:`num`,q:`<p>Back-EMF amplitude in V at that speed (ψ = 0.01 Wb)?</p>
`,explain:`<p>ω_e·ψ.</p>
`,answer:12.566,tol:.001,unit:`V`},{id:`p09-l12-q4`,type:`num`,q:`<p>Phase voltage amplitude in V needed (v_q = 15.07 V, v_d = −3.14 V)?</p>
`,explain:`<p>√(v_d² + v_q²).</p>
`,answer:15.39,tol:.002,unit:`V`},{id:`p09-l12-q5`,type:`mc`,q:`<p>Which current produces torque in a surface PMSM?</p>
`,explain:`<p>T = (3/2)pψ i_q.</p>
`,options:[`i_q`,`i_α`,`i_d`,`the zero-sequence current`],answer:0},{id:`p09-l12-q6`,type:`mc`,q:`<p>Decoupling feed-forward cancels…</p>
`,explain:`<p>Then lesson 7’s PI design applies.</p>
`,options:[`the dead time`,`the PWM ripple`,`the encoder error`,`the ω_e·L cross terms and back-EMF, leaving each axis as an RL plant`],answer:3}],"p09-l13":[{id:`p09-l13-q1`,type:`num`,q:`<p>Angle in degrees for a 1350 µs pulse (1000–2000 µs ↔ 0–180°)?</p>
`,explain:`<p>0.18°/µs.</p>
`,answer:63,tol:.001,unit:`°`},{id:`p09-l13-q2`,type:`num`,q:`<p>Final-error bound in degrees for a 4 µs deadband?</p>
`,explain:`<p>±2 µs × 0.18°/µs.</p>
`,answer:.36,tol:.001,unit:`°`},{id:`p09-l13-q3`,type:`num`,q:`<p>Time in ms to move 27° at 500°/s?</p>
`,explain:`<p>Distance over speed.</p>
`,answer:54,tol:.001,unit:`ms`},{id:`p09-l13-q4`,type:`num`,q:`<p>Pulse repetition frequency in Hz for a 20 ms period?</p>
`,explain:`<p>1/T.</p>
`,answer:50,tol:.001,unit:`Hz`},{id:`p09-l13-q5`,type:`mc`,q:`<p>The angle of an RC servo is set by…</p>
`,explain:`<p>Width in microseconds.</p>
`,options:[`the duty cycle`,`the pulse width`,`the pulse frequency`,`the supply voltage`],answer:1},{id:`p09-l13-q6`,type:`mc`,q:`<p>The deadband exists to…</p>
`,explain:`<p>It trades resolution for quiet holding.</p>
`,options:[`stop the motor hunting on noise near the target`,`set the pulse frequency`,`save the gearbox`,`make the servo faster`],answer:0}],"p09-l14":[{id:`p09-l14-q1`,type:`num`,q:`<p>Continuous coil power in W at 24 V, 12 Ω?</p>
`,explain:`<p>V²/R.</p>
`,answer:48,tol:.001,unit:`W`},{id:`p09-l14-q2`,type:`num`,q:`<p>Minimum hold current in A for a 3.2 N spring force, k = 1e-4 H·m, residual gap 1 mm?</p>
`,explain:`<p>Solve k i²/(2 g_r²) = F.</p>
`,answer:.253,tol:.003,unit:`A`},{id:`p09-l14-q3`,type:`num`,q:`<p>Holding power in W at 0.6 A?</p>
`,explain:`<p>I²R.</p>
`,answer:4.32,tol:.001,unit:`W`},{id:`p09-l14-q4`,type:`num`,q:`<p>Power reduction in % of 0.6 A hold versus 2 A continuous?</p>
`,explain:`<p>1 − (I_hold/I_peak)².</p>
`,answer:91,tol:.002,unit:`%`},{id:`p09-l14-q5`,type:`num`,q:`<p>Open-gap force in N at 2 A (gap + residual = 5 mm)?</p>
`,explain:`<p>k i²/(2g²).</p>
`,answer:8,tol:.001,unit:`N`},{id:`p09-l14-q6`,type:`mc`,q:`<p>A plain flyback diode across a relay coil…</p>
`,explain:`<p>The current decays slowly through the diode.</p>
`,options:[`makes it release faster`,`protects the switch but slows the release`,`is only needed for AC relays`,`reduces pull-in time`],answer:1}],"p09-l15":[{id:`p09-l15-q1`,type:`num`,q:`<p>Lead angle in degrees for 2 mm lead on a 12 mm screw?</p>
`,explain:`<p>atan(l/(π d_m)).</p>
`,answer:3.036,tol:.002,unit:`°`},{id:`p09-l15-q2`,type:`num`,q:`<p>Efficiency in % of that screw with μ = 0.15?</p>
`,explain:`<p>tan λ/tan(λ + φ).</p>
`,answer:25.9,tol:.005,unit:`%`},{id:`p09-l15-q3`,type:`num`,q:`<p>Torque in N·m to push 500 N with it?</p>
`,explain:`<p>F·l/(2π η).</p>
`,answer:.614,tol:.005,unit:`N·m`},{id:`p09-l15-q4`,type:`num`,q:`<p>Efficiency in % of a 5 mm lead ball screw (12 mm, μ = 0.005)?</p>
`,explain:`<p>Rolling friction is tiny.</p>
`,answer:96.3,tol:.002,unit:`%`},{id:`p09-l15-q5`,type:`mc`,q:`<p>A screw is self-locking when…</p>
`,explain:`<p>Friction angle exceeds lead angle.</p>
`,options:[`its efficiency is above 50 %`,`it’s a ball screw`,`φ &gt; λ`,`λ &gt; φ`],answer:2},{id:`p09-l15-q6`,type:`mc`,q:`<p>A self-locking screw’s efficiency is always…</p>
`,explain:`<p>A power-off brake from friction costs efficiency.</p>
`,options:[`below 50 %`,`independent of friction`,`above 90 %`,`exactly 50 %`],answer:0}],"p09-l16":[{id:`p09-l16-q1`,type:`num`,q:`<p>Working pressure in bar abs for 200 N on a 32 mm bore?</p>
`,explain:`<p>p_atm + F/A.</p>
`,answer:3.5,tol:.003,unit:`bar`},{id:`p09-l16-q2`,type:`num`,q:`<p>Highest downstream pressure in bar abs at which flow from 7 bar abs is still choked?</p>
`,explain:`<p>0.528·p_s.</p>
`,answer:3.696,tol:.002,unit:`bar`},{id:`p09-l16-q3`,type:`num`,q:`<p>Choked mass flow in g/s through a 1.5 mm orifice (C_d 0.8, 7 bar abs, 293 K)?</p>
`,explain:`<p>0.0404·C_d·A_o·p_s/√T.</p>
`,answer:2.34,tol:.005,unit:`g/s`},{id:`p09-l16-q4`,type:`num`,q:`<p>Stroke time in s at that flow (200 mm, A = 8.04 cm², p_w = 3.50 bar)?</p>
`,explain:`<p>s·A·p_w/(ṁRT).</p>
`,answer:.287,tol:.01,unit:`s`},{id:`p09-l16-q5`,type:`num`,q:`<p>Natural frequency in Hz of 5 kg on a 3580 N/m air spring?</p>
`,explain:`<p>√(k/m)/2π.</p>
`,answer:4.26,tol:.005,unit:`Hz`},{id:`p09-l16-q6`,type:`mc`,q:`<p>Under choked flow, the mass flow…</p>
`,explain:`<p>The throat is sonic.</p>
`,options:[`is zero`,`rises with downstream pressure`,`depends only on the cylinder size`,`doesn’t depend on downstream pressure`],answer:3}],"p09-l17":[{id:`p09-l17-q1`,type:`num`,q:`<p>Minimum bore in mm for 20 kN at 100 bar?</p>
`,explain:`<p>√(4F/(πp)).</p>
`,answer:50.46,tol:.002,unit:`mm`},{id:`p09-l17-q2`,type:`num`,q:`<p>Cylinder pressure in bar for 20 kN on a 63 mm bore?</p>
`,explain:`<p>F/A.</p>
`,answer:64.16,tol:.002,unit:`bar`},{id:`p09-l17-q3`,type:`num`,q:`<p>Flow in L/min to move a 63 mm piston at 0.10 m/s?</p>
`,explain:`<p>Q = A·v.</p>
`,answer:18.7,tol:.002,unit:`L/min`},{id:`p09-l17-q4`,type:`num`,q:`<p>Force in kN of a 63 mm bore at 200 bar?</p>
`,explain:`<p>p·A.</p>
`,answer:62.3,tol:.003,unit:`kN`},{id:`p09-l17-q5`,type:`num`,q:`<p>Reynolds number in a 10 mm hose at 3.97 m/s, ν = 32 cSt?</p>
`,explain:`<p>uD/ν; laminar.</p>
`,answer:1241,tol:.003,unit:``},{id:`p09-l17-q6`,type:`mc`,q:`<p>In a hydraulic circuit, the actuator’s speed is set by…</p>
`,explain:`<p>Continuity, v = Q/A.</p>
`,options:[`the relief valve`,`the flow`,`the pressure`,`the oil viscosity`],answer:1}],"p09-l18":[{id:`p09-l18-q1`,type:`num`,q:`<p>Full-speed flow in m³/h (H₀ = 20, k = 0.08, H_s = 6, r = 0.04)?</p>
`,explain:`<p>√((H₀ − H_s)/(k + r)).</p>
`,answer:10.8,tol:.002,unit:`m³/h`},{id:`p09-l18-q2`,type:`num`,q:`<p>Power ratio at 80 % speed by the affinity laws?</p>
`,explain:`<p>P ∝ n³.</p>
`,answer:.512,tol:.001,unit:``},{id:`p09-l18-q3`,type:`num`,q:`<p>Speed ratio that delivers 7 m³/h with a VFD?</p>
`,explain:`<p>n²H₀ = H_s + (k + r)Q².</p>
`,answer:.7707,tol:.002,unit:``},{id:`p09-l18-q4`,type:`num`,q:`<p>Shaft power in W when throttling to 7 m³/h (H = 16.08 m, η = 0.6)?</p>
`,explain:`<p>ρgQH/η.</p>
`,answer:511,tol:.003,unit:`W`},{id:`p09-l18-q5`,type:`num`,q:`<p>Minimum speed ratio to lift water 6 m with H₀ = 20 m?</p>
`,explain:`<p>n²H₀ = H_s.</p>
`,answer:.5477,tol:.002,unit:``},{id:`p09-l18-q6`,type:`mc`,q:`<p>The affinity laws apply exactly to the operating point when…</p>
`,explain:`<p>Pure-friction systems.</p>
`,options:[`the system curve passes through the origin`,`the system has a static lift`,`the pump is throttled`,`the pump efficiency is 100 %`],answer:0}],"p09-l19":[{id:`p09-l19-q1`,type:`num`,q:`<p>Steady winding temperature in °C for 18 W, R_wh + R_ha = 2.5 K/W, 30 °C ambient?</p>
`,explain:`<p>T_a + P·ΣR.</p>
`,answer:75,tol:.001,unit:`°C`},{id:`p09-l19-q2`,type:`num`,q:`<p>Copper resistance in Ω at 155 °C if 0.5 Ω at 20 °C?</p>
`,explain:`<p>R₂₀(1 + 0.00393·ΔT).</p>
`,answer:.7653,tol:.001,unit:`Ω`},{id:`p09-l19-q3`,type:`num`,q:`<p>Continuous current in A for class F (155 °C) in the worked example?</p>
`,explain:`<p>Solve with the hot resistance.</p>
`,answer:8.08,tol:.002,unit:`A`},{id:`p09-l19-q4`,type:`num`,q:`<p>RMS current in A of 12 A on for 40 % of the time?</p>
`,explain:`<p>I·√D.</p>
`,answer:7.59,tol:.002,unit:`A`},{id:`p09-l19-q5`,type:`num`,q:`<p>Hot-spot limit in °C of class B insulation?</p>
`,explain:`<p>B 130, F 155, H 180.</p>
`,answer:130,tol:.001,unit:`°C`},{id:`p09-l19-q6`,type:`mc`,q:`<p>For an on/off cycle much shorter than the thermal time constants, the heating depends on…</p>
`,explain:`<p>Average power ∝ I²_rms.</p>
`,options:[`the off time only`,`the peak current`,`the RMS current`,`the average current`],answer:2}],"p09-l20":[{id:`p09-l20-q1`,type:`num`,q:`<p>Grade force in N for 180 kg on a 10 % slope?</p>
`,explain:`<p>m g sin θ.</p>
`,answer:175.7,tol:.002,unit:`N`},{id:`p09-l20-q2`,type:`num`,q:`<p>Aero drag in N at 30 km/h (C_dA = 0.6 m², ρ = 1.15)?</p>
`,explain:`<p>½ρC_dAv².</p>
`,answer:23.96,tol:.002,unit:`N`},{id:`p09-l20-q3`,type:`num`,q:`<p>Wheel power in kW for 226 N at 30 km/h?</p>
`,explain:`<p>F·v.</p>
`,answer:1.883,tol:.002,unit:`kW`},{id:`p09-l20-q4`,type:`num`,q:`<p>Hub speed in rpm at 30 km/h with a 0.25 m wheel radius?</p>
`,explain:`<p>v/r in rpm.</p>
`,answer:318.3,tol:.002,unit:`rpm`},{id:`p09-l20-q5`,type:`num`,q:`<p>Energy in Wh to lift 180 kg by 300 m?</p>
`,explain:`<p>m g Δh.</p>
`,answer:147.2,tol:.002,unit:`Wh`},{id:`p09-l20-q6`,type:`mc`,q:`<p>On a 10 % climb at 30 km/h, the largest force is…</p>
`,explain:`<p>176 N of 226 N.</p>
`,options:[`rolling resistance`,`grade`,`aerodynamic drag`,`bearing friction`],answer:1}]};export{e as default};