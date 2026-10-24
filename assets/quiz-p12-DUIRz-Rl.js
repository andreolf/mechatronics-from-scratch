var e={"p12-l01":[{id:`p12-l01-q1`,type:`num`,q:`<p>Steady water temperature in °C at 200 W with the lesson’s resistances and a 20 °C room?</p>
`,explain:`<p>P(R_wb + R_ba) above ambient.</p>
`,answer:140,tol:.001,unit:`°C`},{id:`p12-l01-q2`,type:`num`,q:`<p>Time constant in s of the first-order boiler model?</p>
`,explain:`<p>Total capacitance times total resistance.</p>
`,answer:897.6,tol:.001,unit:`s`},{id:`p12-l01-q3`,type:`num`,q:`<p>Heater element time constant C_h R_hw in s?</p>
`,explain:`<p>Far faster than the boiler.</p>
`,answer:2.5,tol:.001,unit:`s`},{id:`p12-l01-q4`,type:`num`,q:`<p>Water temperature in °C after 600 s (first-order model, 150 W)?</p>
`,explain:`<p>Exponential rise towards 110 °C.</p>
`,answer:63.9,tol:.002,unit:`°C`},{id:`p12-l01-q5`,type:`mc`,q:`<p>What sets the order of a lumped model?</p>
`,explain:`<p>Each store is one state.</p>
`,options:[`the number of independent energy-storage elements`,`the number of resistances`,`the number of inputs`,`the simulation step size`],answer:0},{id:`p12-l01-q6`,type:`mc`,q:`<p>When can a storage element be merged into its neighbour?</p>
`,explain:`<p>It equilibrates almost instantly.</p>
`,options:[`when its time constant is much shorter than the dynamics you care about`,`when it is the largest store`,`when it has no resistance`,`never`],answer:0}],"p12-l02":[{id:`p12-l02-q1`,type:`num`,q:`<p>Approximate body-bounce frequency in Hz with k_s = 20 kN/m, k_t = 200 kN/m, m_s = 300 kg?</p>
`,explain:`<p>Series stiffness over the sprung mass.</p>
`,answer:1.24,tol:.005,unit:`Hz`},{id:`p12-l02-q2`,type:`num`,q:`<p>Approximate wheel-hop frequency in Hz with k_s = 20 kN/m, k_t = 200 kN/m, m_u = 45 kg?</p>
`,explain:`<p>Both springs act on the wheel.</p>
`,answer:11.13,tol:.005,unit:`Hz`},{id:`p12-l02-q3`,type:`num`,q:`<p>Static tyre deflection in mm under the full quarter-car weight (290 kg, k_t = 160 kN/m, g = 9.81)?</p>
`,explain:`<p>The preload that measuring from equilibrium hides.</p>
`,answer:17.78,tol:.002,unit:`mm`},{id:`p12-l02-q4`,type:`num`,q:`<p>Number of natural frequencies of an undamped 3-mass chain?</p>
`,explain:`<p>One per degree of freedom.</p>
`,answer:3,tol:0,unit:``},{id:`p12-l02-q5`,type:`mc`,q:`<p>The natural frequencies squared are the eigenvalues of…</p>
`,explain:`<p>From (K − ω²M)v = 0.</p>
`,options:[`M⁻¹K`,`K M`,`M + K`,`C⁻¹K`],answer:0},{id:`p12-l02-q6`,type:`mc`,q:`<p>In body bounce, how do the body and wheel move?</p>
`,explain:`<p>The wheel follows the slow motion with a small amplitude.</p>
`,options:[`mostly the body, on the suspension and tyre in series`,`mostly the wheel`,`in opposite directions with equal amplitude`,`not at all`],answer:0}],"p12-l03":[{id:`p12-l03-q1`,type:`num`,q:`<p>Anti-resonance in Hz for k = 200 N·m/rad and J_L = 2×10⁻³ kg·m²?</p>
`,explain:`<p>sqrt(k/J_L).</p>
`,answer:50.33,tol:.002,unit:`Hz`},{id:`p12-l03-q2`,type:`num`,q:`<p>Ratio ω_r/ω_a when J_L = 9 J_m?</p>
`,explain:`<p>sqrt(1 + J_L/J_m).</p>
`,answer:3.162,tol:.001,unit:``},{id:`p12-l03-q3`,type:`num`,q:`<p>Torsional stiffness in N·m/rad of a 10 mm steel shaft (G = 79 GPa) 500 mm long?</p>
`,explain:`<p>G·πd⁴/(32ℓ).</p>
`,answer:155.1,tol:.002,unit:`N·m/rad`},{id:`p12-l03-q4`,type:`num`,q:`<p>Resonance in Hz of the worked-example axis?</p>
`,explain:`<p>sqrt(k(1/J_m + 1/J_L)).</p>
`,answer:125.8,tol:.002,unit:`Hz`},{id:`p12-l03-q5`,type:`mc`,q:`<p>At the anti-resonance, what does the motor do?</p>
`,explain:`<p>The motor-side response dips.</p>
`,options:[`it barely moves while the load swings against the shaft`,`it spins fastest`,`it stalls permanently`,`it reverses`],answer:0},{id:`p12-l03-q6`,type:`mc`,q:`<p>Why does the motor-shaft-load model have a pole at zero?</p>
`,explain:`<p>The rigid-body mode.</p>
`,options:[`both inertias can rotate together freely, with no spring to the frame`,`because of friction`,`because the motor has inductance`,`it doesn’t`],answer:0}],"p12-l04":[{id:`p12-l04-q1`,type:`num`,q:`<p>Energy in J of the worked-example pendulum released at θ₁ = 60°, θ₂ = 0?</p>
`,explain:`<p>V = −(m₁+m₂)gℓ₁cos θ₁ − m₂gℓ₂cos θ₂.</p>
`,answer:-19.62,tol:.001,unit:`J`},{id:`p12-l04-q2`,type:`num`,q:`<p>Lowest possible energy in J of the worked-example pendulum?</p>
`,explain:`<p>Both links hanging, at rest.</p>
`,answer:-29.43,tol:.001,unit:`J`},{id:`p12-l04-q3`,type:`num`,q:`<p>Degrees of freedom of a planar triple pendulum?</p>
`,explain:`<p>One angle per link.</p>
`,answer:3,tol:0,unit:``},{id:`p12-l04-q4`,type:`num`,q:`<p>Small-angle period in s of a single 1 m pendulum (g = 9.81)?</p>
`,explain:`<p>2π sqrt(ℓ/g), a quick sanity check for any pendulum model.</p>
`,answer:2.006,tol:.001,unit:`s`},{id:`p12-l04-q5`,type:`mc`,q:`<p>Why don’t the rod tensions appear in the Lagrangian equations?</p>
`,explain:`<p>Generalised coordinates satisfy the constraints automatically.</p>
`,options:[`constraint forces do no work along the motion the coordinates allow`,`they are zero`,`they are included in V`,`they are approximated away`],answer:0},{id:`p12-l04-q6`,type:`mc`,q:`<p>What does energy conservation in the simulation prove?</p>
`,explain:`<p>Chaos still amplifies tiny errors.</p>
`,options:[`the equations and integrator are consistent, but not that the trajectory is accurate long-term`,`the trajectory is exact`,`the system is not chaotic`,`nothing`],answer:0}],"p12-l05":[{id:`p12-l05-q1`,type:`num`,q:`<p>Natural frequency in rad/s of L = 0.5 H, C = 2 mF?</p>
`,explain:`<p>1/sqrt(LC).</p>
`,answer:31.62,tol:.001,unit:`rad/s`},{id:`p12-l05-q2`,type:`num`,q:`<p>Damping ratio of m = 1 kg, c = 4 N·s/m, k = 100 N/m?</p>
`,explain:`<p>c/(2 sqrt(km)).</p>
`,answer:.2,tol:.001,unit:``},{id:`p12-l05-q3`,type:`num`,q:`<p>Capacitance in F that models a 25 N/m spring in the force-voltage analogy?</p>
`,explain:`<p>C = 1/k.</p>
`,answer:.04,tol:.001,unit:`F`},{id:`p12-l05-q4`,type:`num`,q:`<p>Percent overshoot for ζ = 0.15?</p>
`,explain:`<p>Same for both twins.</p>
`,answer:62.09,tol:.002,unit:`%`},{id:`p12-l05-q5`,type:`mc`,q:`<p>In the force-current analogy, mass corresponds to…</p>
`,explain:`<p>Velocity is voltage; m dv/dt ↔ C du/dt.</p>
`,options:[`capacitance`,`inductance`,`resistance`,`voltage`],answer:0},{id:`p12-l05-q6`,type:`mc`,q:`<p>Which analogy preserves the topology of the mechanism?</p>
`,explain:`<p>Elements sharing a velocity share a node voltage.</p>
`,options:[`force-current`,`force-voltage`,`both`,`neither`],answer:0}],"p12-l06":[{id:`p12-l06-q1`,type:`num`,q:`<p>Torque constant in N·m/A of a motor with k_e = 10 V/krpm?</p>
`,explain:`<p>Convert to V·s/rad; then k_t = k_e.</p>
`,answer:.0955,tol:.001,unit:`N·m/A`},{id:`p12-l06-q2`,type:`num`,q:`<p>Reflected inertia in kg·m² of J_L = 0.01 through N = 20?</p>
`,explain:`<p>Divided by N².</p>
`,answer:25e-6,tol:.001,unit:`kg·m²`},{id:`p12-l06-q3`,type:`num`,q:`<p>Steady motor speed in rad/s in the worked example?</p>
`,explain:`<p>(kV − Rτ)/(k² + Rb).</p>
`,answer:454.5,tol:.002,unit:`rad/s`},{id:`p12-l06-q4`,type:`num`,q:`<p>Gear ratio that matches J_m = 2×10⁻⁵ to J_L = 0.01?</p>
`,explain:`<p>N² = J_L/J_m.</p>
`,answer:22.36,tol:.001,unit:``},{id:`p12-l06-q5`,type:`mc`,q:`<p>Why must k_t equal k_e in SI units?</p>
`,explain:`<p>Losses are modelled separately.</p>
`,options:[`the conversion conserves power, so e·i = τ·ω`,`by definition of the ampere`,`because of friction`,`it’s a coincidence`],answer:0},{id:`p12-l06-q6`,type:`mc`,q:`<p>What does a load torque look like from the motor side of an N:1 gearbox?</p>
`,explain:`<p>Torque scales by N; inertia by N².</p>
`,options:[`divided by N`,`multiplied by N`,`divided by N²`,`unchanged`],answer:0}],"p12-l07":[{id:`p12-l07-q1`,type:`num`,q:`<p>Steady level in m for 1 L/s through the lesson’s orifice?</p>
`,explain:`<p>Quarter of the 2 L/s level.</p>
`,answer:.2832,tol:.002,unit:`m`},{id:`p12-l07-q2`,type:`num`,q:`<p>Time in s to drain a 2 m² tank from 1 m through C_d a = 5×10⁻⁴ m²?</p>
`,explain:`<p>(A/(C_d a)) sqrt(2h₀/g).</p>
`,answer:1806,tol:.001,unit:`s`},{id:`p12-l07-q3`,type:`num`,q:`<p>Hydraulic capacitance in m³/Pa of a 1 m² tank of water (ρ = 1000, g = 9.81)?</p>
`,explain:`<p>A/(ρg).</p>
`,answer:1019e-7,tol:.002,unit:`m³/Pa`},{id:`p12-l07-q4`,type:`num`,q:`<p>Factor by which the steady level rises when the inflow triples (orifice outlet)?</p>
`,explain:`<p>h ∝ q².</p>
`,answer:9,tol:0,unit:``},{id:`p12-l07-q5`,type:`mc`,q:`<p>What makes a tank with an orifice outlet nonlinear?</p>
`,explain:`<p>Torricelli’s law.</p>
`,options:[`outflow grows with the square root of the level`,`the tank’s area`,`gravity`,`the pump`],answer:0},{id:`p12-l07-q6`,type:`mc`,q:`<p>Which quantity plays the role of voltage in the hydraulic analogy?</p>
`,explain:`<p>Flow is current, volume is charge.</p>
`,options:[`pressure (or level)`,`flow`,`volume`,`area`],answer:0}],"p12-l08":[{id:`p12-l08-q1`,type:`num`,q:`<p>DC gain of G/(1 + G) for G = 9 at DC?</p>
`,explain:`<p>Unity feedback.</p>
`,answer:.9,tol:.001,unit:``},{id:`p12-l08-q2`,type:`num`,q:`<p>Damping ratio of the worked-example servo?</p>
`,explain:`<p>2ζω_n = 30, ω_n = 20.</p>
`,answer:.75,tol:.001,unit:``},{id:`p12-l08-q3`,type:`num`,q:`<p>Damping ratio without the velocity loop (k_v = 0)?</p>
`,explain:`<p>Denominator s² + 10s + 400.</p>
`,answer:.25,tol:.001,unit:``},{id:`p12-l08-q4`,type:`num`,q:`<p>Value of Δ in Mason’s rule for two touching loops with gains −2 and −3?</p>
`,explain:`<p>1 − ΣL.</p>
`,answer:6,tol:0,unit:``},{id:`p12-l08-q5`,type:`mc`,q:`<p>Feedback with forward G and feedback H (negative) gives…</p>
`,explain:`<p>The standard loop formula.</p>
`,options:[`G/(1 + GH)`,`G/(1 − GH)`,`GH/(1 + G)`,`G + H`],answer:0},{id:`p12-l08-q6`,type:`mc`,q:`<p>What does Δ_k remove in Mason’s rule?</p>
`,explain:`<p>Δ_k is Δ evaluated without loops sharing a node with path k.</p>
`,options:[`the loops that touch forward path k`,`the forward paths`,`all loops`,`the non-touching pairs`],answer:0}],"p12-l09":[{id:`p12-l09-q1`,type:`num`,q:`<p>The D term of G(s) = (3s + 1)/(s + 2)?</p>
`,explain:`<p>Divide first; the remainder is −5/(s + 2).</p>
`,answer:3,tol:0,unit:``},{id:`p12-l09-q2`,type:`num`,q:`<p>Number of states in a minimal realisation of a fourth-order transfer function?</p>
`,explain:`<p>The denominator degree.</p>
`,answer:4,tol:0,unit:``},{id:`p12-l09-q3`,type:`num`,q:`<p>DC gain C(−A)⁻¹B of the worked example?</p>
`,explain:`<p>b₀/a₀.</p>
`,answer:.6,tol:.001,unit:``},{id:`p12-l09-q4`,type:`num`,q:`<p>The entry A[2,1] (bottom-left) of the CCF of 1/(s² + 7s + 12)?</p>
`,explain:`<p>The bottom row is −a₀, −a₁.</p>
`,answer:-12,tol:0,unit:``},{id:`p12-l09-q5`,type:`mc`,q:`<p>The poles of C(sI − A)⁻¹B + D are…</p>
`,explain:`<p>det(sI − A) is the denominator.</p>
`,options:[`eigenvalues of A (for a minimal realisation)`,`entries of B`,`zeros of C`,`eigenvalues of D`],answer:0},{id:`p12-l09-q6`,type:`mc`,q:`<p>What does a similarity transform change?</p>
`,explain:`<p>A’ = TAT⁻¹ has the same eigenvalues.</p>
`,options:[`the state variables, not the input-output behaviour`,`the transfer function`,`the poles`,`the DC gain`],answer:0}],"p12-l10":[{id:`p12-l10-q1`,type:`num`,q:`<p>Linearised time constant in s of the tank at q₀ = 2 L/s, h₀ = 1.133 m, A_t = 1 m²?</p>
`,explain:`<p>2A_t h₀/q₀.</p>
`,answer:1133,tol:.002,unit:`s`},{id:`p12-l10-q2`,type:`num`,q:`<p>Factor by which the linearisation error grows when the step doubles?</p>
`,explain:`<p>Second-order remainder.</p>
`,answer:4,tol:0,unit:``},{id:`p12-l10-q3`,type:`num`,q:`<p>Unstable eigenvalue in 1/s of an inverted pendulum with ℓ = 0.5 m?</p>
`,explain:`<p>sqrt(g/ℓ).</p>
`,answer:4.429,tol:.001,unit:`1/s`},{id:`p12-l10-q4`,type:`num`,q:`<p>Exact steady level in m at 2.2 L/s if 2 L/s gives 1.133 m?</p>
`,explain:`<p>h ∝ q².</p>
`,answer:1.371,tol:.002,unit:`m`},{id:`p12-l10-q5`,type:`mc`,q:`<p>What is the A matrix of a linearised model?</p>
`,explain:`<p>First-order Taylor term.</p>
`,options:[`the Jacobian ∂f/∂x at the operating point`,`f at the operating point`,`the Hessian`,`the inverse of B`],answer:0},{id:`p12-l10-q6`,type:`mc`,q:`<p>Why does the tank’s linear model change with the operating level?</p>
`,explain:`<p>The Jacobian is evaluated at h₀.</p>
`,options:[`the slope of √h depends on h`,`the tank’s area changes`,`gravity changes`,`it doesn’t`],answer:0}],"p12-l11":[{id:`p12-l11-q1`,type:`num`,q:`<p>Unstable pole in 1/s of the lab’s cart-pole (M = 0.8, m = 0.25, ℓ = 0.45)?</p>
`,explain:`<p>The formula derived above.</p>
`,answer:4.461,tol:.001,unit:`1/s`},{id:`p12-l11-q2`,type:`num`,q:`<p>The same with the cart held fixed?</p>
`,explain:`<p>sqrt(g/(4ℓ/3)) for a uniform rod.</p>
`,answer:4.044,tol:.001,unit:`1/s`},{id:`p12-l11-q3`,type:`num`,q:`<p>Inertia in kg·m² of the pole about its hinge, I + mℓ²?</p>
`,explain:`<p>(4/3) m ℓ².</p>
`,answer:.0675,tol:.001,unit:`kg·m²`},{id:`p12-l11-q4`,type:`num`,q:`<p>Extra time in s to fall if the start angle is halved (p = 4.46)?</p>
`,explain:`<p>ln 2 / p.</p>
`,answer:.155,tol:.01,unit:`s`},{id:`p12-l11-q5`,type:`mc`,q:`<p>Which quantity is conserved when F = 0 and there’s no friction?</p>
`,explain:`<p>Time invariance gives energy; x not appearing in L gives momentum.</p>
`,options:[`total energy and horizontal momentum`,`only the pole angle`,`cart velocity`,`nothing`],answer:0},{id:`p12-l11-q6`,type:`mc`,q:`<p>Why is the cart-pole hard to balance by careful placement?</p>
`,explain:`<p>Unstable pole at 4.46 s⁻¹.</p>
`,options:[`the deviation grows exponentially, so tiny errors become large quickly`,`the cart is heavy`,`gravity varies`,`the equations are linear`],answer:0}],"p12-l12":[{id:`p12-l12-q1`,type:`num`,q:`<p>Effective translational mass M₁₁ in kg of the example robot?</p>
`,explain:`<p>m_w + m_b + I_w/r², with I_w/r² = m_w/2.</p>
`,answer:1.45,tol:.001,unit:`kg`},{id:`p12-l12-q2`,type:`num`,q:`<p>Open-loop unstable pole in 1/s?</p>
`,explain:`<p>The formula above.</p>
`,answer:13.8,tol:.003,unit:`1/s`},{id:`p12-l12-q3`,type:`num`,q:`<p>Time in ms for a tilt error to double at p = 13.8 s⁻¹?</p>
`,explain:`<p>ln 2/p.</p>
`,answer:50.2,tol:.01,unit:`ms`},{id:`p12-l12-q4`,type:`num`,q:`<p>Number of zero eigenvalues of the open-loop linear model?</p>
`,explain:`<p>Position and wheel velocity drift freely.</p>
`,answer:2,tol:0,unit:``},{id:`p12-l12-q5`,type:`mc`,q:`<p>Why does the body’s equation contain −τ?</p>
`,explain:`<p>The motor sits between wheel and body.</p>
`,options:[`the motor’s reaction torque acts on the body`,`friction`,`gravity`,`it’s a sign error`],answer:0},{id:`p12-l12-q6`,type:`mc`,q:`<p>A positive torque step initially makes the body…</p>
`,explain:`<p>The reaction torque acts first.</p>
`,options:[`tilt back, away from the direction of travel`,`tilt forward`,`stay still`,`jump`],answer:0}],"p12-l13":[{id:`p12-l13-q1`,type:`num`,q:`<p>Thrust in N per motor to hover a 1 kg quadrotor?</p>
`,explain:`<p>mg/4.</p>
`,answer:2.4525,tol:.001,unit:`N`},{id:`p12-l13-q2`,type:`num`,q:`<p>Pitch acceleration in rad/s² from a 0.01 N imbalance (ℓ = 0.22 m, I_yy = 0.012)?</p>
`,explain:`<p>ℓΔT/I.</p>
`,answer:.1833,tol:.002,unit:`rad/s²`},{id:`p12-l13-q3`,type:`num`,q:`<p>Small-angle drift in m after 2 s from that imbalance?</p>
`,explain:`<p>gαt⁴/24.</p>
`,answer:1.199,tol:.01,unit:`m`},{id:`p12-l13-q4`,type:`num`,q:`<p>Climb acceleration in m/s² with 1 % more than hover thrust?</p>
`,explain:`<p>0.01 g.</p>
`,answer:.0981,tol:.002,unit:`m/s²`},{id:`p12-l13-q5`,type:`mc`,q:`<p>What does the ω × Iω term describe?</p>
`,explain:`<p>It’s zero when spinning about a single principal axis.</p>
`,options:[`gyroscopic coupling between axes`,`aerodynamic drag`,`gravity`,`motor lag`],answer:0},{id:`p12-l13-q6`,type:`mc`,q:`<p>Why use a quaternion for attitude?</p>
`,explain:`<p>Euler angles have gimbal lock.</p>
`,options:[`no singularities and cheap normalisation`,`it’s more accurate than physics`,`it removes gyroscopic effects`,`it’s required for hover`],answer:0}],"p12-l14":[{id:`p12-l14-q1`,type:`num`,q:`<p>Grade force in kN on a 120 t train on 70 ‰?</p>
`,explain:`<p>m g sin(arctan 0.07).</p>
`,answer:82.2,tol:.005,unit:`kN`},{id:`p12-l14-q2`,type:`num`,q:`<p>Adhesion limit in kN with μ = 0.12 and 60 t on driven axles (cos α ≈ 0.9976)?</p>
`,explain:`<p>μ m_adh g cos α.</p>
`,answer:70.5,tol:.005,unit:`kN`},{id:`p12-l14-q3`,type:`num`,q:`<p>Steepest grade in ‰ a train can start on if μ = 0.2 and all its weight is on driven axles (small angle, no resistance)?</p>
`,explain:`<p>tan α ≈ μ.</p>
`,answer:200,tol:.01,unit:`‰`},{id:`p12-l14-q4`,type:`num`,q:`<p>Traction force in kN available from 1 MW at 10 m/s?</p>
`,explain:`<p>P/v.</p>
`,answer:100,tol:.001,unit:`kN`},{id:`p12-l14-q5`,type:`mc`,q:`<p>What decides whether the wheels slip?</p>
`,explain:`<p>F_t = min(demand, adhesion).</p>
`,options:[`traction demand versus μ times the weight on driven axles`,`the Davis A term`,`train length`,`speed alone`],answer:0},{id:`p12-l14-q6`,type:`mc`,q:`<p>The Davis C v² term represents…</p>
`,explain:`<p>It grows with the square of speed.</p>
`,options:[`aerodynamic drag`,`grade`,`bearing friction`,`adhesion`],answer:0}],"p12-l15":[{id:`p12-l15-q1`,type:`num`,q:`<p>Frequency in Hz of a balance beating 28 800 vibrations per hour (two vibrations per period)?</p>
`,explain:`<p>8 vibrations per second, 4 periods.</p>
`,answer:4,tol:0,unit:`Hz`},{id:`p12-l15-q2`,type:`num`,q:`<p>Hairspring stiffness in N·m/rad for 4 Hz with I = 1e-9 kg·m²?</p>
`,explain:`<p>κ = I ω².</p>
`,answer:6.317e-7,tol:.002,unit:`N·m/rad`},{id:`p12-l15-q3`,type:`num`,q:`<p>Rate offset in s/day from damping alone with Q = 250?</p>
`,explain:`<p>−86 400 ζ²/2 with ζ = 1/(2Q).</p>
`,answer:-.1728,tol:.01,unit:`s/day`},{id:`p12-l15-q4`,type:`num`,q:`<p>Factor by which amplitude changes if Q drops from 250 to 200 at the same impulse energy?</p>
`,explain:`<p>A ∝ √Q.</p>
`,answer:.894,tol:.002,unit:``},{id:`p12-l15-q5`,type:`mc`,q:`<p>Where should the escapement kick the balance to keep it isochronous?</p>
`,explain:`<p>Airy’s theorem.</p>
`,options:[`at the centre, where the spring torque is zero`,`at maximum amplitude`,`at 90°`,`anywhere`],answer:0},{id:`p12-l15-q6`,type:`mc`,q:`<p>A hairspring that stiffens with angle makes the watch…</p>
`,explain:`<p>Frequency rises with amplitude.</p>
`,options:[`gain more at larger amplitude`,`lose at larger amplitude`,`keep perfect time`,`stop`],answer:0}],"p12-l16":[{id:`p12-l16-q1`,type:`num`,q:`<p>Fraction of the final value a first-order step reaches after one time constant?</p>
`,explain:`<p>1 − e⁻¹.</p>
`,answer:.632,tol:.001,unit:``},{id:`p12-l16-q2`,type:`num`,q:`<p>Damping ratio for 37.2 % overshoot?</p>
`,explain:`<p>The inversion formula.</p>
`,answer:.3,tol:.01,unit:``},{id:`p12-l16-q3`,type:`num`,q:`<p>Damping ratio for 10 % overshoot?</p>
`,explain:`<p>Same formula.</p>
`,answer:.591,tol:.005,unit:``},{id:`p12-l16-q4`,type:`num`,q:`<p>Time in s for a 20 rad/s, τ = 0.12 s motor to reach 95 % of final speed?</p>
`,explain:`<p>3τ (exactly τ ln 20).</p>
`,answer:.3595,tol:.005,unit:`s`},{id:`p12-l16-q5`,type:`mc`,q:`<p>Why fit the whole record instead of using the 63 % point?</p>
`,explain:`<p>Error shrinks as 1/√N.</p>
`,options:[`it uses every sample, so noise averages out`,`it’s always unbiased for any model`,`it doesn’t need a model`,`it’s faster`],answer:0},{id:`p12-l16-q6`,type:`mc`,q:`<p>A first-order fit to an oscillating response leaves…</p>
`,explain:`<p>Residuals carry the oscillation.</p>
`,options:[`structured residuals that reveal a missing order`,`white residuals`,`zero residuals`,`negative gain`],answer:0}],"p12-l17":[{id:`p12-l17-q1`,type:`num`,q:`<p>Frequency resolution in Hz with 8192-sample segments at 1 kHz?</p>
`,explain:`<p>f_s/N_seg.</p>
`,answer:.122,tol:.005,unit:`Hz`},{id:`p12-l17-q2`,type:`num`,q:`<p>Peak gain in dB of a second-order plant with ζ = 0.15?</p>
`,explain:`<p>1/(2ζ√(1−ζ²)).</p>
`,answer:10.56,tol:.005,unit:`dB`},{id:`p12-l17-q3`,type:`num`,q:`<p>Approximate resonance width in Hz for f_n = 5 Hz, ζ = 0.15?</p>
`,explain:`<p>2ζf_n.</p>
`,answer:1.5,tol:.01,unit:`Hz`},{id:`p12-l17-q4`,type:`num`,q:`<p>Coherence when the output is pure noise unrelated to the input?</p>
`,explain:`<p>S_uy → 0.</p>
`,answer:0,tol:.01,unit:``},{id:`p12-l17-q5`,type:`mc`,q:`<p>H1 = S_uy/S_uu is biased low when…</p>
`,explain:`<p>Input noise inflates S_uu.</p>
`,options:[`the input measurement is noisy`,`the output measurement is noisy`,`the plant is linear`,`the chirp is logarithmic`],answer:0},{id:`p12-l17-q6`,type:`mc`,q:`<p>What does low coherence at a frequency tell you?</p>
`,explain:`<p>Little of the output is linearly explained by the input.</p>
`,options:[`noise or nonlinearity dominates, so don’t trust the estimate there`,`the plant gain is exactly zero`,`the plant is unstable`,`the sample rate is too high`],answer:0}],"p12-l18":[{id:`p12-l18-q1`,type:`num`,q:`<p>Half-width of the 95 % whiteness band for N = 4000?</p>
`,explain:`<p>1.96/√N.</p>
`,answer:.031,tol:.02,unit:``},{id:`p12-l18-q2`,type:`num`,q:`<p>95th percentile of χ² with 20 degrees of freedom?</p>
`,explain:`<p>The Ljung-Box threshold for 20 lags.</p>
`,answer:31.41,tol:.002,unit:``},{id:`p12-l18-q3`,type:`num`,q:`<p>Probability in % that at least one of 20 white-noise lags falls outside its 95 % band?</p>
`,explain:`<p>1 − 0.95²⁰.</p>
`,answer:64.2,tol:.005,unit:`%`},{id:`p12-l18-q4`,type:`num`,q:`<p>Number of parameters in an ARX model with n = 2 (two a’s and two b’s)?</p>
`,explain:`<p>a₁, a₂, b₁, b₂.</p>
`,answer:4,tol:0,unit:``},{id:`p12-l18-q5`,type:`mc`,q:`<p>Residuals with significant correlation at lag 1 mean…</p>
`,explain:`<p>Something in the past still predicts the error.</p>
`,options:[`the model misses predictable dynamics`,`the model is perfect`,`the noise is too small`,`the input was too large`],answer:0},{id:`p12-l18-q6`,type:`mc`,q:`<p>Why validate on a separate record?</p>
`,explain:`<p>Overfitting shows up only on fresh data.</p>
`,options:[`to catch models that fit the estimation noise`,`it’s faster`,`least squares needs two records`,`to increase the fit on estimation data`],answer:0}]};export{e as default};