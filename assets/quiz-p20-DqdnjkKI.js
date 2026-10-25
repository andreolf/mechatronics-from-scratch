var e={"p20-l01":[{id:`p20-l01-q1`,type:`num`,q:`<p>Usable energy of a 3S pack (11.1 V, 2.5 Ah) at 85 % (Wh)?</p>
`,explain:`<p>V × Ah × usable fraction.</p>
`,answer:23.59,tol:.002,unit:``},{id:`p20-l01-q2`,type:`num`,q:`<p>Runtime of 23.6 Wh at a 16.8 W load with 90 % efficient regulators (min)?</p>
`,explain:`<p>Energy over input power.</p>
`,answer:75.9,tol:.003,unit:``},{id:`p20-l01-q3`,type:`num`,q:`<p>Requirements without tests if 7 requirements are covered by tests for 5 of them?</p>
`,explain:`<p>Two are unverified.</p>
`,answer:2,tol:.001,unit:``},{id:`p20-l01-q4`,type:`num`,q:`<p>Loop period for a 500 Hz control loop (ms)?</p>
`,explain:`<p>1/f.</p>
`,answer:2,tol:.001,unit:``},{id:`p20-l01-q5`,type:`mc`,q:`<p>Which requirement is testable?</p>
`,explain:`<p>Quantity, comparison and limit.</p>
`,options:[`Respond quickly`,`Balance well`,`Be robust to pushes`,`Recover from a 5° tilt within 1.5 s`],answer:3},{id:`p20-l01-q6`,type:`mc`,q:`<p>What does a test with no linked requirement suggest?</p>
`,explain:`<p>Traceability runs both ways.</p>
`,options:[`Nothing`,`The requirement set is complete`,`A missing requirement or an unnecessary test`,`The test must pass`],answer:2}],"p20-l02":[{id:`p20-l02-q1`,type:`num`,q:`<p>√(g/l) for l = 0.07 m (1/s)?</p>
`,explain:`<p>Point-mass pendulum rate.</p>
`,answer:11.84,tol:.003,unit:``},{id:`p20-l02-q2`,type:`num`,q:`<p>Time constant of an unstable pole at +7.1 per second (s)?</p>
`,explain:`<p>1/λ.</p>
`,answer:.141,tol:.005,unit:``},{id:`p20-l02-q3`,type:`num`,q:`<p>Factor by which a tilt grows in 0.3 s with λ = 7.1 per second?</p>
`,explain:`<p>e^(λt).</p>
`,answer:8.42,tol:.005,unit:``},{id:`p20-l02-q4`,type:`num`,q:`<p>Equivalent wheel mass m + Iw/r² with m 0.12 kg, Iw 9.6e-5 kg·m², r 0.04 m (kg)?</p>
`,explain:`<p>Rotation adds mass.</p>
`,answer:.18,tol:.002,unit:``},{id:`p20-l02-q5`,type:`mc`,q:`<p>Which generalised forces does the motor torque produce?</p>
`,explain:`<p>It acts between body and wheels.</p>
`,options:[`None, it is internal`,`τ on both`,`Only τ on θ`,`τ/r on x and −τ on θ`],answer:3},{id:`p20-l02-q6`,type:`mc`,q:`<p>What does one positive eigenvalue of A mean?</p>
`,explain:`<p>Small tilts grow exponentially.</p>
`,options:[`Upright is unstable`,`The model is wrong`,`The robot oscillates`,`The motor is saturated`],answer:0}],"p20-l03":[{id:`p20-l03-q1`,type:`num`,q:`<p>LDO dissipation from 5 V to 3.3 V at 104 mA (mW)?</p>
`,explain:`<p>(Vin − Vout) I.</p>
`,answer:176.8,tol:.002,unit:``},{id:`p20-l03-q2`,type:`num`,q:`<p>Buck input power for 5 V at 144 mA with 90 % efficiency (W)?</p>
`,explain:`<p>Pout / η.</p>
`,answer:.8,tol:.002,unit:``},{id:`p20-l03-q3`,type:`num`,q:`<p>Runtime of 23.6 Wh at 16.8 W (min)?</p>
`,explain:`<p>Energy over power.</p>
`,answer:84.3,tol:.003,unit:``},{id:`p20-l03-q4`,type:`num`,q:`<p>Accelerometer reading error for x’’ = 1 m/s² and h θ’’ = −0.6 m/s² (m/s²)?</p>
`,explain:`<p>The two terms partly cancel.</p>
`,answer:.4,tol:.002,unit:``},{id:`p20-l03-q5`,type:`mc`,q:`<p>Which ERC error does a regulator output on a misnamed net cause?</p>
`,explain:`<p>The loads see no supply.</p>
`,options:[`Power input not driven by a power output`,`None`,`Two outputs on one net`,`Unconnected input`],answer:0},{id:`p20-l03-q6`,type:`mc`,q:`<p>Why is the accelerometer alone a poor tilt sensor on a balancing robot?</p>
`,explain:`<p>Specific force includes motion.</p>
`,options:[`It drifts like a gyro`,`It also measures the robot’s own accelerations`,`It measures only rotation`,`It cannot sense gravity`],answer:1}],"p20-l04":[{id:`p20-l04-q1`,type:`num`,q:`<p>Bit time of 155 bits at 400 kHz (µs)?</p>
`,explain:`<p>Bits over clock rate.</p>
`,answer:387.5,tol:.001,unit:``},{id:`p20-l04-q2`,type:`num`,q:`<p>Time for 8000 cycles at 84 MHz (µs)?</p>
`,explain:`<p>Cycles over frequency.</p>
`,answer:95.2,tol:.002,unit:``},{id:`p20-l04-q3`,type:`num`,q:`<p>Share of a 2 ms period used by 534 µs (%)?</p>
`,explain:`<p>Busy time over period.</p>
`,answer:26.7,tol:.003,unit:``},{id:`p20-l04-q4`,type:`num`,q:`<p>Complementary filter time constant for α 0.995 and T 2 ms (s)?</p>
`,explain:`<p>α T / (1 − α).</p>
`,answer:.398,tol:.005,unit:``},{id:`p20-l04-q5`,type:`mc`,q:`<p>Why keep hardware access behind small functions?</p>
`,explain:`<p>Host testing catches bugs early.</p>
`,options:[`It removes the need for tests`,`The same control code runs on the target and against a simulated plant`,`It makes the code faster`,`The compiler requires it`],answer:1},{id:`p20-l04-q6`,type:`mc`,q:`<p>Which item dominates this loop’s budget?</p>
`,explain:`<p>Bus time, not computation.</p>
`,options:[`The encoder read`,`The blocking I2C read`,`The PWM update`,`The control law`],answer:1}],"p20-l05":[{id:`p20-l05-q1`,type:`num`,q:`<p>Delay margin for 93.1° at 20.4 rad/s (ms)?</p>
`,explain:`<p>φm in radians over ωc.</p>
`,answer:79.7,tol:.005,unit:``},{id:`p20-l05-q2`,type:`num`,q:`<p>Delay margin for 100.9° at 203.2 rad/s (ms)?</p>
`,explain:`<p>High crossover, small delay margin.</p>
`,answer:8.67,tol:.005,unit:``},{id:`p20-l05-q3`,type:`num`,q:`<p>Effort saving from 0.415 to 0.175 V²·s (%)?</p>
`,explain:`<p>1 − ratio.</p>
`,answer:57.8,tol:.005,unit:``},{id:`p20-l05-q4`,type:`num`,q:`<p>Smallest gain factor an LQR loop is guaranteed to tolerate at its input?</p>
`,explain:`<p>Gain margin from 1/2 to infinity.</p>
`,answer:.5,tol:.001,unit:``},{id:`p20-l05-q5`,type:`mc`,q:`<p>What does the PID’s slow outer loop do?</p>
`,explain:`<p>Without it the robot drifts.</p>
`,options:[`Leans the tilt setpoint to bring the robot back to its position`,`Estimates the tilt`,`Limits the voltage`,`Removes sensor noise`],answer:0},{id:`p20-l05-q6`,type:`mc`,q:`<p>Which guarantee does a continuous-time LQR give?</p>
`,explain:`<p>A classical LQR robustness result.</p>
`,options:[`No overshoot`,`At least 60° phase margin at the input`,`Zero steady-state error to any input`,`Minimum peak voltage`],answer:1}],"p20-l06":[{id:`p20-l06-q1`,type:`num`,q:`<p>Filter offset for a 0.05 rad/s bias, α 0.995, T 2 ms (degrees)?</p>
`,explain:`<p>b α T / (1 − α).</p>
`,answer:1.14,tol:.005,unit:``},{id:`p20-l06-q2`,type:`num`,q:`<p>Noise power ratio for ten times the noise amplitude?</p>
`,explain:`<p>Power goes with amplitude squared.</p>
`,answer:100,tol:.001,unit:``},{id:`p20-l06-q3`,type:`num`,q:`<p>Torque gain estimate if Σ i_meas i_cmd = 0.6 and Σ i_cmd² = 1.0?</p>
`,explain:`<p>Least-squares ratio.</p>
`,answer:.6,tol:.001,unit:``},{id:`p20-l06-q4`,type:`num`,q:`<p>Parking position for K = (3.16, ·, 19.92, 2.10), offset 0.0199 rad, bias 0.05 rad/s (cm)?</p>
`,explain:`<p>Solve K · s = 0 for x.</p>
`,answer:-15.9,tol:.01,unit:``},{id:`p20-l06-q5`,type:`mc`,q:`<p>What is the worst outcome of a fault-injection test?</p>
`,explain:`<p>It means the model or code is wrong.</p>
`,options:[`Higher effort`,`Behaviour nobody can explain`,`A monitor trip`,`A fall caught by the tilt monitor`],answer:1},{id:`p20-l06-q6`,type:`mc`,q:`<p>Which fault does the LQR’s gain margin cover?</p>
`,explain:`<p>Any gain from one half upward.</p>
`,options:[`A motor producing 60 % of its torque`,`A stuck encoder`,`Total motor loss`,`An 80 ms delay`],answer:0}],"p20-l07":[{id:`p20-l07-q1`,type:`num`,q:`<p>Arm offset d for ℓ = 0.22 m on an X frame (m)?</p>
`,explain:`<p>ℓ/√2.</p>
`,answer:.1556,tol:.005,unit:``},{id:`p20-l07-q2`,type:`num`,q:`<p>Hover thrust per motor for 1 kg (N)?</p>
`,explain:`<p>mg/4.</p>
`,answer:2.4525,tol:.005,unit:``},{id:`p20-l07-q3`,type:`num`,q:`<p>Roll acceleration for 0.1 N·m with Ixx 0.012 kg·m² (rad/s²)?</p>
`,explain:`<p>τ/I.</p>
`,answer:8.33,tol:.005,unit:``},{id:`p20-l07-q4`,type:`num`,q:`<p>Largest roll torque at hover with F_max 6 N (N·m)?</p>
`,explain:`<p>4 d Δf.</p>
`,answer:1.526,tol:.005,unit:``},{id:`p20-l07-q5`,type:`mc`,q:`<p>Which axis does the mixer give up first when motors saturate?</p>
`,explain:`<p>A slow heading change is harmless.</p>
`,options:[`Total thrust`,`Roll`,`Yaw`,`Pitch`],answer:2},{id:`p20-l07-q6`,type:`mc`,q:`<p>Why is yaw authority weak on a quad?</p>
`,explain:`<p>c is a few centimetres.</p>
`,options:[`The mixer ignores yaw`,`The yaw inertia is zero`,`Yaw torque comes from propeller drag, a small fraction of the thrust`,`Yaw needs a tail rotor`],answer:2}],"p20-l08":[{id:`p20-l08-q1`,type:`num`,q:`<p>A bias of 0.02 rad/s in degrees per second?</p>
`,explain:`<p>× 180/π.</p>
`,answer:1.146,tol:.005,unit:``},{id:`p20-l08-q2`,type:`num`,q:`<p>Complementary filter offset for bias 0.02 rad/s, α 0.99, T 4 ms (degrees)?</p>
`,explain:`<p>b α T / (1 − α).</p>
`,answer:.454,tol:.005,unit:``},{id:`p20-l08-q3`,type:`num`,q:`<p>Apparent tilt from 0.3 m/s² of horizontal acceleration (degrees)?</p>
`,explain:`<p>atan(a/g).</p>
`,answer:1.752,tol:.005,unit:``},{id:`p20-l08-q4`,type:`num`,q:`<p>Roll from an accelerometer reading (0, −2, −9.6) m/s² (degrees)?</p>
`,explain:`<p>atan2(−ay, −az).</p>
`,answer:11.77,tol:.005,unit:``},{id:`p20-l08-q5`,type:`mc`,q:`<p>What does the EKF estimate that the complementary filter does not?</p>
`,explain:`<p>Bias states remove the offset.</p>
`,options:[`The gyro biases`,`The yaw angle from gravity`,`The accelerometer noise`,`The motor thrust`],answer:0},{id:`p20-l08-q6`,type:`mc`,q:`<p>What limits the accuracy of both filters in the example?</p>
`,explain:`<p>The accelerometer cannot tell acceleration from tilt.</p>
`,options:[`The sample rate`,`Gyro noise`,`Manoeuvre acceleration that looks like tilt`,`Numerical errors`],answer:2}],"p20-l09":[{id:`p20-l09-q1`,type:`num`,q:`<p>Bandwidth separation of 27.8 and 6.54 rad/s?</p>
`,explain:`<p>Ratio of crossovers.</p>
`,answer:4.25,tol:.005,unit:``},{id:`p20-l09-q2`,type:`num`,q:`<p>Delay margin for 62.4° at 27.8 rad/s (ms)?</p>
`,explain:`<p>φm/ωc.</p>
`,answer:39.2,tol:.005,unit:``},{id:`p20-l09-q3`,type:`num`,q:`<p>Phase lag of a 20 ms motor at 27.8 rad/s (degrees)?</p>
`,explain:`<p>atan(ωτ).</p>
`,answer:29.08,tol:.005,unit:``},{id:`p20-l09-q4`,type:`num`,q:`<p>Phase lag of a 6 ms delay at 27.8 rad/s (degrees)?</p>
`,explain:`<p>ωTd in degrees.</p>
`,answer:9.56,tol:.005,unit:``},{id:`p20-l09-q5`,type:`mc`,q:`<p>What happens when the attitude crossover approaches the rate crossover?</p>
`,explain:`<p>The inner loop’s lag is no longer negligible.</p>
`,options:[`The rate loop becomes unstable`,`Nothing, the loops are independent`,`The drone becomes slower`,`The outer phase margin falls and the step overshoots`],answer:3},{id:`p20-l09-q6`,type:`mc`,q:`<p>Why does the inner loop control rate rather than angle?</p>
`,explain:`<p>The fastest, cleanest signal goes in the inner loop.</p>
`,options:[`The mixer needs rates`,`Angles cannot be measured`,`Rate loops need no tuning`,`The gyro measures rate directly with little lag and noise`],answer:3}],"p20-l10":[{id:`p20-l10-q1`,type:`num`,q:`<p>Phase lag of 12 ms delay at 27.8 rad/s (degrees)?</p>
`,explain:`<p>ωTd.</p>
`,answer:19.1,tol:.005,unit:``},{id:`p20-l10-q2`,type:`num`,q:`<p>Cascade stiffness k_a k_p for 6 and 0.36 (N·m/rad)?</p>
`,explain:`<p>Product of the gains.</p>
`,answer:2.16,tol:.005,unit:``},{id:`p20-l10-q3`,type:`num`,q:`<p>Static roll error from 0.2 N·m with that stiffness (degrees)?</p>
`,explain:`<p>τ/k.</p>
`,answer:5.31,tol:.005,unit:``},{id:`p20-l10-q4`,type:`num`,q:`<p>Relative loop gain change for 0.7 inertia and 1.2 thrust gain?</p>
`,explain:`<p>k_T / (I/I0).</p>
`,answer:1.714,tol:.005,unit:``},{id:`p20-l10-q5`,type:`mc`,q:`<p>What should a robustness test also check, besides the samples inside the envelope?</p>
`,explain:`<p>A test that never fails proves nothing.</p>
`,options:[`That the integrator is off`,`That a drone outside the envelope fails it`,`That the nominal model is exact`,`That noise is zero`],answer:1},{id:`p20-l10-q6`,type:`mc`,q:`<p>Where should the envelope come from?</p>
`,explain:`<p>Measure, then test.</p>
`,options:[`The controller gains`,`The nominal model`,`Measurements of the real drone and its variation`,`The simulator defaults`],answer:2}],"p20-l11":[{id:`p20-l11-q1`,type:`num`,q:`<p>Static shoulder torque from a 0.2 kg payload at 0.45 m (N·m)?</p>
`,explain:`<p>m g x.</p>
`,answer:.883,tol:.005,unit:``},{id:`p20-l11-q2`,type:`num`,q:`<p>Inertia of a 0.3 kg, 0.25 m rod about its end (kg·m²)?</p>
`,explain:`<p>m ℓ²/3.</p>
`,answer:.00625,tol:.005,unit:``},{id:`p20-l11-q3`,type:`num`,q:`<p>Requirement for 2.305 N·m static, inertia 0.0813 kg·m², 3 rad/s², SF 1.5 (N·m)?</p>
`,explain:`<p>SF (τ + Iα).</p>
`,answer:3.824,tol:.005,unit:``},{id:`p20-l11-q4`,type:`num`,q:`<p>Share of a 6 N·m rating used by 3.824 N·m (%)?</p>
`,explain:`<p>Ratio.</p>
`,answer:63.7,tol:.005,unit:``},{id:`p20-l11-q5`,type:`mc`,q:`<p>Which inertia tensor is physical?</p>
`,explain:`<p>Each moment must be at most the sum of the other two and positive.</p>
`,options:[`diag(1, -1, 1)`,`diag(0, 2, 1)`,`diag(1, 1, 3)`,`diag(1, 2, 2.5)`],answer:3},{id:`p20-l11-q6`,type:`mc`,q:`<p>Where should a motor’s effort limit in the URDF come from?</p>
`,explain:`<p>The limits protect the hardware.</p>
`,options:[`The static torque`,`The chosen motor’s continuous rating`,`Any large number`,`The peak torque`],answer:1}],"p20-l12":[{id:`p20-l12-q1`,type:`num`,q:`<p>Peak speed of a quintic with Δq 1 rad over 1 s (rad/s)?</p>
`,explain:`<p>15Δq/(8T).</p>
`,answer:1.875,tol:.005,unit:``},{id:`p20-l12-q2`,type:`num`,q:`<p>Peak acceleration of a quintic with Δq 1 rad over 1 s (rad/s²)?</p>
`,explain:`<p>10Δq/(√3 T²).</p>
`,answer:5.774,tol:.005,unit:``},{id:`p20-l12-q3`,type:`num`,q:`<p>Half a count of a 4096-count encoder (mrad)?</p>
`,explain:`<p>π/4096 rad.</p>
`,answer:.767,tol:.005,unit:``},{id:`p20-l12-q4`,type:`num`,q:`<p>Elbow cosine for r 0.3, z − h 0.2, links 0.25 and 0.20?</p>
`,explain:`<p>Law of cosines.</p>
`,answer:.275,tol:.005,unit:``},{id:`p20-l12-q5`,type:`mc`,q:`<p>Why use quintic rather than cubic segments?</p>
`,explain:`<p>Cubics jump in acceleration at the ends.</p>
`,options:[`Zero acceleration at both ends, so no jerk at start and stop`,`They are faster`,`They need no IK`,`They avoid joint limits automatically`],answer:0},{id:`p20-l12-q6`,type:`mc`,q:`<p>What does |cos q₃| &gt; 1 mean?</p>
`,explain:`<p>No triangle exists with those sides.</p>
`,options:[`The Jacobian is singular`,`A joint limit is hit`,`The target is out of reach`,`Elbow up is required`],answer:2}],"p20-l13":[{id:`p20-l13-q1`,type:`num`,q:`<p>k_p for a triple pole at 30 rad/s (s⁻²)?</p>
`,explain:`<p>3w².</p>
`,answer:2700,tol:.001,unit:``},{id:`p20-l13-q2`,type:`num`,q:`<p>Elbow gravity error from a 0.05 kg payload mismatch at 0.2 m (N·m)?</p>
`,explain:`<p>Δm g ℓ.</p>
`,answer:.0981,tol:.005,unit:``},{id:`p20-l13-q3`,type:`num`,q:`<p>Peak shoulder torque as a share of its 6 N·m rating (%)?</p>
`,explain:`<p>Ratio.</p>
`,answer:73.5,tol:.005,unit:``},{id:`p20-l13-q4`,type:`num`,q:`<p>Ratio of moving errors, 7.2 mm without and 0.814 mm with the model?</p>
`,explain:`<p>The model’s benefit.</p>
`,answer:8.85,tol:.01,unit:``},{id:`p20-l13-q5`,type:`mc`,q:`<p>What does read() do in a ros2_control hardware interface?</p>
`,explain:`<p>update() computes, write() sends.</p>
`,options:[`Loads the URDF`,`Computes the torque`,`Fills the joint states from the hardware`,`Plans the trajectory`],answer:2},{id:`p20-l13-q6`,type:`mc`,q:`<p>What does the integral term fix in computed torque?</p>
`,explain:`<p>A wrong payload leaves a constant error.</p>
`,options:[`Torque saturation`,`Encoder quantisation`,`Joint limits`,`Steady error from model mismatch`],answer:3}],"p20-l14":[{id:`p20-l14-q1`,type:`num`,q:`<p>Operating flow for H0 14 m, lift 6 m, kp 1.8e5, r 0.9e5 (L/s)?</p>
`,explain:`<p>√((H0 − Hs)/(kp + r)).</p>
`,answer:5.443,tol:.005,unit:``},{id:`p20-l14-q2`,type:`num`,q:`<p>Time to fill 30 % of a 1.5 m deep 8 m² tank at 5.44 L/s (min)?</p>
`,explain:`<p>Volume over flow.</p>
`,answer:11.03,tol:.005,unit:``},{id:`p20-l14-q3`,type:`num`,q:`<p>Head delivered at the operating point (m)?</p>
`,explain:`<p>H0 − kp Q².</p>
`,answer:8.67,tol:.005,unit:``},{id:`p20-l14-q4`,type:`num`,q:`<p>Daily demand with 6 h at 3 L/s and 18 h at 0.4 L/s (m³)?</p>
`,explain:`<p>L/s × 3600 s/h ÷ 1000.</p>
`,answer:90.72,tol:.005,unit:``},{id:`p20-l14-q5`,type:`mc`,q:`<p>Which signal catches a pump running dry when both level sensors fail?</p>
`,explain:`<p>Current falls without water.</p>
`,options:[`Tank level`,`The start counter`,`Motor current`,`The clock`],answer:2},{id:`p20-l14-q6`,type:`mc`,q:`<p>The tank empties at half inflow. What is the fix?</p>
`,explain:`<p>Supply below demand cannot be controlled away.</p>
`,options:[`A tighter hysteresis`,`More supply or storage, it is a sizing problem`,`A faster loop`,`More starts per hour`],answer:1}],"p20-l15":[{id:`p20-l15-q1`,type:`num`,q:`<p>Emergency stopping distance from 5 m/s at 1.6 m/s² (m)?</p>
`,explain:`<p>v²/2a.</p>
`,answer:7.81,tol:.005,unit:``},{id:`p20-l15-q2`,type:`num`,q:`<p>Overspeed threshold for 5 m/s at 115 % (m/s)?</p>
`,explain:`<p>Ratio times nominal.</p>
`,answer:5.75,tol:.001,unit:``},{id:`p20-l15-q3`,type:`num`,q:`<p>Rope slip threshold for 5 m/s (m/s)?</p>
`,explain:`<p>0.05 v_nom + 0.1.</p>
`,answer:.35,tol:.001,unit:``},{id:`p20-l15-q4`,type:`num`,q:`<p>State-fault pairs for 7 states and 9 faults?</p>
`,explain:`<p>Exhaustive product.</p>
`,answer:63,tol:.001,unit:``},{id:`p20-l15-q5`,type:`mc`,q:`<p>What must happen after any fault before the line restarts?</p>
`,explain:`<p>Faults latch.</p>
`,options:[`Nothing, it restarts itself`,`A timeout`,`A power cycle`,`A reset with no fault present`],answer:3},{id:`p20-l15-q6`,type:`mc`,q:`<p>What does escalation protect against?</p>
`,explain:`<p>The emergency brake takes over.</p>
`,options:[`High wind`,`Sensor noise`,`A drive that cannot brake during a controlled stop`,`A slow reset`],answer:2}],"p20-l16":[{id:`p20-l16-q1`,type:`num`,q:`<p>Requirements across capstones with 4, 4, 3, 2 and 2?</p>
`,explain:`<p>Sum.</p>
`,answer:15,tol:.001,unit:``},{id:`p20-l16-q2`,type:`num`,q:`<p>Lessons in the arm capstone as a share of Phase 20’s 16 (%)?</p>
`,explain:`<p>3/16.</p>
`,answer:18.75,tol:.005,unit:``},{id:`p20-l16-q3`,type:`num`,q:`<p>Margin of 84.2 min over the 30 min requirement (×)?</p>
`,explain:`<p>Result over limit.</p>
`,answer:2.807,tol:.005,unit:``},{id:`p20-l16-q4`,type:`num`,q:`<p>Margin of the arm’s 0.307 mm against 1 mm (×)?</p>
`,explain:`<p>Limit over result.</p>
`,answer:3.257,tol:.005,unit:``},{id:`p20-l16-q5`,type:`mc`,q:`<p>Which is a requirement without a test?</p>
`,explain:`<p>Nothing proves it.</p>
`,options:[`A demo`,`A result`,`A wish`,`A model`],answer:2},{id:`p20-l16-q6`,type:`mc`,q:`<p>What makes a reported number trustworthy?</p>
`,explain:`<p>Anyone can rerun it.</p>
`,options:[`It appears in a slide`,`It is regenerated by a script in the repository`,`It is round`,`It matches expectations`],answer:1}]};export{e as default};