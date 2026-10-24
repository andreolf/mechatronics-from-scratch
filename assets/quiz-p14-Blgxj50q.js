var e={"p14-l01":[{id:`p14-l01-q1`,type:`num`,q:`<p>Entry (1,1) of e^(At) at t = 1 for A = [[0, 1], [-2, -3]]?</p>
`,explain:`<p>2e^(-t) − e^(-2t) at t = 1.</p>
`,answer:.60042,tol:.001,unit:``},{id:`p14-l01-q2`,type:`num`,q:`<p>Steady-state x1 for A = [[0, 1], [-2, -3]], B = (0, 1) and a unit step input?</p>
`,explain:`<p>x∞ = −A⁻¹B.</p>
`,answer:.5,tol:.001,unit:``},{id:`p14-l01-q3`,type:`num`,q:`<p>Scaling exponent s (smallest integer with ‖M‖/2^s &lt; 1) for ‖M‖ = 40?</p>
`,explain:`<p>2^6 = 64 &gt; 40 &gt; 32.</p>
`,answer:6,tol:.001,unit:``},{id:`p14-l01-q4`,type:`num`,q:`<p>Determinant of e^(At) at t = 1 for A with trace −3?</p>
`,explain:`<p>det e^(At) = e^(trace(A) t).</p>
`,answer:.049787,tol:.001,unit:``},{id:`p14-l01-q5`,type:`mc`,q:`<p>When does the eigen-decomposition route to e^(At) fail?</p>
`,explain:`<p>Complex eigenvalues are fine; a missing eigenvector makes V singular.</p>
`,options:[`when A is stable`,`when A is defective (not enough eigenvectors)`,`when t is negative`,`when A has complex eigenvalues`],answer:1},{id:`p14-l01-q6`,type:`mc`,q:`<p>The second term in x(t) = e^(At)x0 + ∫e^(A(t−τ))Bu(τ)dτ is…</p>
`,explain:`<p>e^(At)B is the impulse response from u to x.</p>
`,options:[`the forced response, a convolution with the impulse response`,`the free response`,`an approximation error`,`the steady state only`],answer:0}],"p14-l02":[{id:`p14-l02-q1`,type:`num`,q:`<p>How many columns does the controllability matrix have for 4 states and 1 input?</p>
`,explain:`<p>B, AB, A²B, A³B.</p>
`,answer:4,tol:.001,unit:``},{id:`p14-l02-q2`,type:`num`,q:`<p>Rank of the controllability matrix for two identical mass-springs pushed by one force?</p>
`,explain:`<p>The difference mode can’t be excited.</p>
`,answer:2,tol:.001,unit:``},{id:`p14-l02-q3`,type:`num`,q:`<p>Determinant of [[1, −1], [1, −2]], the controllability matrix of 1/(s+1) and 1/(s+2) in parallel?</p>
`,explain:`<p>Nonzero, so controllable.</p>
`,answer:-1,tol:.001,unit:``},{id:`p14-l02-q4`,type:`num`,q:`<p>Cart-pole B entry for the pole’s angular acceleration per newton (β = 1/((M+m)ℓ(4/3 − m/(M+m))))?</p>
`,explain:`<p>The magnitude of the fourth entry of B.</p>
`,answer:1.9324,tol:.001,unit:`rad/(s²·N)`},{id:`p14-l02-q5`,type:`mc`,q:`<p>The PBH test fails at an eigenvalue λ when…</p>
`,explain:`<p>That mode is invisible to the input.</p>
`,options:[`λ is complex`,`λ is unstable`,`a left eigenvector for λ is orthogonal to B`,`A is not invertible`],answer:2},{id:`p14-l02-q6`,type:`mc`,q:`<p>Why do the powers stop at A^(n−1)B?</p>
`,explain:`<p>A satisfies its own characteristic polynomial.</p>
`,options:[`to save computation only`,`the input is bounded`,`by Cayley-Hamilton, higher powers are combinations of lower ones`,`higher powers are always zero`],answer:2}],"p14-l03":[{id:`p14-l03-q1`,type:`num`,q:`<p>Rank of the cart-pole observability matrix with only the pole angle measured?</p>
`,explain:`<p>Cart position and speed never reach the angle.</p>
`,answer:2,tol:.001,unit:``},{id:`p14-l03-q2`,type:`num`,q:`<p>Rank with only the cart speed measured?</p>
`,explain:`<p>Absolute cart position is missing.</p>
`,answer:3,tol:.001,unit:``},{id:`p14-l03-q3`,type:`num`,q:`<p>How many rows does the observability matrix have for 4 states and 2 sensors?</p>
`,explain:`<p>n blocks of C, each with 2 rows.</p>
`,answer:8,tol:.001,unit:``},{id:`p14-l03-q4`,type:`num`,q:`<p>CA² for the angle sensor has p² in column 3. What is p² for the lab cart-pole in s⁻²?</p>
`,explain:`<p>g/(ℓ(4/3 − m/(M+m))).</p>
`,answer:19.904,tol:.001,unit:`s⁻²`},{id:`p14-l03-q5`,type:`mc`,q:`<p>Observability of (A, C) is equivalent to…</p>
`,explain:`<p>The duality used to design observers.</p>
`,options:[`stability of A`,`controllability of (Aᵀ, Cᵀ)`,`C being square`,`controllability of (A, B)`],answer:1},{id:`p14-l03-q6`,type:`mc`,q:`<p>Two initial states that differ by a vector in the unobservable subspace…</p>
`,explain:`<p>The difference produces zero output.</p>
`,options:[`give identical outputs for all time`,`cannot both exist`,`converge to each other`,`give outputs that differ by a constant`],answer:0}],"p14-l04":[{id:`p14-l04-q1`,type:`num`,q:`<p>Open-loop sway frequency in rad/s for M = 500 kg, m = 1000 kg, L = 8 m?</p>
`,explain:`<p>√((M + m)g/(ML)).</p>
`,answer:1.918,tol:.001,unit:`rad/s`},{id:`p14-l04-q2`,type:`num`,q:`<p>Constant term of the desired polynomial for poles −3, −4, −5, −6?</p>
`,explain:`<p>The product of the pole magnitudes.</p>
`,answer:360,tol:.001,unit:``},{id:`p14-l04-q3`,type:`num`,q:`<p>Coefficient of s³ for poles −3, −4, −5, −6?</p>
`,explain:`<p>The sum of the magnitudes.</p>
`,answer:18,tol:.001,unit:``},{id:`p14-l04-q4`,type:`num`,q:`<p>Real part of a pole pair with ω_n = 0.8 rad/s and ζ = 0.8?</p>
`,explain:`<p>−ζω_n.</p>
`,answer:-.64,tol:.001,unit:``},{id:`p14-l04-q5`,type:`mc`,q:`<p>Ackermann’s formula applies directly to…</p>
`,explain:`<p>Multi-input placement has extra freedom and needs another method.</p>
`,options:[`single-input controllable systems`,`unobservable systems only`,`discrete systems only`,`any multi-input system`],answer:0},{id:`p14-l04-q6`,type:`mc`,q:`<p>Why is Ackermann avoided for large systems in practice?</p>
`,explain:`<p>Robust methods use orthogonal transformations.</p>
`,options:[`it gives the wrong poles in theory`,`it cannot place complex poles`,`it needs a Kalman filter`,`it inverts the often ill-conditioned controllability matrix`],answer:3}],"p14-l05":[{id:`p14-l05-q1`,type:`num`,q:`<p>Position gain for a double integrator with Q = diag(100, 0) and R = 1?</p>
`,explain:`<p>K₁ = √q.</p>
`,answer:10,tol:.001,unit:``},{id:`p14-l05-q2`,type:`num`,q:`<p>Velocity gain for the same design?</p>
`,explain:`<p>K₂ = √(2√q).</p>
`,answer:4.4721,tol:.001,unit:``},{id:`p14-l05-q3`,type:`num`,q:`<p>Closed-loop natural frequency in rad/s for q = 16?</p>
`,explain:`<p>ω_n = q^(1/4).</p>
`,answer:2,tol:.001,unit:`rad/s`},{id:`p14-l05-q4`,type:`num`,q:`<p>Optimal cost from x0 = (1, 0) for q = 1, where P = [[√2, 1], [1, √2]]?</p>
`,explain:`<p>J = x0ᵀPx0 = P₁₁.</p>
`,answer:1.4142,tol:.001,unit:``},{id:`p14-l05-q5`,type:`mc`,q:`<p>Raising R with Q fixed makes the controller…</p>
`,explain:`<p>Effort becomes more expensive.</p>
`,options:[`more aggressive`,`unchanged`,`unstable`,`gentler, with slower response and less effort`],answer:3},{id:`p14-l05-q6`,type:`mc`,q:`<p>The Lyapunov equation in Newton’s method gives…</p>
`,explain:`<p>Then the gain is improved from it.</p>
`,options:[`the exact cost matrix of the current gain`,`the optimal gain directly`,`the closed-loop poles`,`the observer gain`],answer:0}],"p14-l06":[{id:`p14-l06-q1`,type:`num`,q:`<p>Riccati solution p for ẋ = x + u with q = 3 and r = 1?</p>
`,explain:`<p>The positive root of p² − 2p − 3 = 0.</p>
`,answer:3,tol:.001,unit:``},{id:`p14-l06-q2`,type:`num`,q:`<p>Closed-loop pole for that design?</p>
`,explain:`<p>a − bK with K = p b/r = 3.</p>
`,answer:-2,tol:.001,unit:``},{id:`p14-l06-q3`,type:`num`,q:`<p>How many eigenvalues does the Hamiltonian of a 4-state system have?</p>
`,explain:`<p>It’s 2n by 2n; half are stable.</p>
`,answer:8,tol:.001,unit:``},{id:`p14-l06-q4`,type:`num`,q:`<p>Discrete pole at T = 5 ms for a continuous pole at −2 rad/s?</p>
`,explain:`<p>z = e^(sT).</p>
`,answer:.99005,tol:.001,unit:``},{id:`p14-l06-q5`,type:`mc`,q:`<p>If μ is an eigenvalue of the Hamiltonian, then so is…</p>
`,explain:`<p>The Hamiltonian structure makes the spectrum symmetric about the imaginary axis.</p>
`,options:[`μ²`,`−μ`,`1/μ`,`only μ itself`],answer:1},{id:`p14-l06-q6`,type:`mc`,q:`<p>The discrete Riccati iteration is…</p>
`,explain:`<p>Each step adds one more stage of optimal cost-to-go.</p>
`,options:[`Newton’s method on the CARE`,`pole placement`,`a Kalman filter`,`dynamic programming run backwards from the end of the horizon`],answer:3}],"p14-l07":[{id:`p14-l07-q1`,type:`num`,q:`<p>Bryson weight for an acceptable angle of 0.14 rad?</p>
`,explain:`<p>Q = 1/x_max².</p>
`,answer:51.02,tol:.01,unit:``},{id:`p14-l07-q2`,type:`num`,q:`<p>Force in N that costs as much as a 1 m position error with Q_x = 5 and R = 0.05?</p>
`,explain:`<p>R F² = Q_x x², so F = √(Q_x/R).</p>
`,answer:10,tol:.001,unit:`N`},{id:`p14-l07-q3`,type:`num`,q:`<p>Control period in ms at 200 Hz?</p>
`,explain:`<p>The lab’s controller rate.</p>
`,answer:5,tol:.001,unit:`ms`},{id:`p14-l07-q4`,type:`num`,q:`<p>Guaranteed phase margin in degrees of a continuous single-input LQR?</p>
`,explain:`<p>From the return-difference inequality |1 + L(jω)| ≥ 1.</p>
`,answer:60,tol:.001,unit:`deg`},{id:`p14-l07-q5`,type:`mc`,q:`<p>Compared with the Phase 13 PID, the LQR’s main advantage here is…</p>
`,explain:`<p>Angle and cart are weighed together.</p>
`,options:[`it never needs a model`,`it brings the cart back much sooner as part of one design`,`it settles the angle ten times faster`,`it uses no force`],answer:1},{id:`p14-l07-q6`,type:`mc`,q:`<p>What did the design model leave out that the test includes?</p>
`,explain:`<p>The nonlinear simulation adds all three.</p>
`,options:[`gravity`,`force limit, actuator lag and sampling`,`the cart mass`,`the pole length`],answer:1}],"p14-l08":[{id:`p14-l08-q1`,type:`num`,q:`<p>How many states does the augmented system have for a 2-state motor with one integrated output?</p>
`,explain:`<p>x plus the integral z.</p>
`,answer:3,tol:.001,unit:``},{id:`p14-l08-q2`,type:`num`,q:`<p>Steady voltage in V needed to hold 200 rad/s against 0.05 N·m (R = 1.2, k = 0.05, b = 2e-5)?</p>
`,explain:`<p>V = R i + k ω with i = (τ_L + bω)/k.</p>
`,answer:11.296,tol:.001,unit:`V`},{id:`p14-l08-q3`,type:`num`,q:`<p>LQR plus prefilter error in rad/s under the load in the worked example?</p>
`,explain:`<p>Proportional feedback needs an error to make the extra voltage.</p>
`,answer:1.54,tol:.02,unit:`rad/s`},{id:`p14-l08-q4`,type:`num`,q:`<p>Steady-state error of the LQI under that load?</p>
`,explain:`<p>ż = 0 forces y = r.</p>
`,answer:0,tol:.001,unit:``},{id:`p14-l08-q5`,type:`mc`,q:`<p>Integral action fails to be possible when the plant…</p>
`,explain:`<p>The augmented pair is then uncontrollable.</p>
`,options:[`is a motor`,`has a zero at s = 0`,`is unstable`,`has two states`],answer:1},{id:`p14-l08-q6`,type:`mc`,q:`<p>Why is LQR with a prefilter sensitive to model error even without load?</p>
`,explain:`<p>A wrong DC gain gives a wrong steady state.</p>
`,options:[`the prefilter is computed from the model’s DC gain`,`the weights change`,`the prefilter integrates`,`LQR is unstable`],answer:0}],"p14-l09":[{id:`p14-l09-q1`,type:`num`,q:`<p>Noise in rad/s RMS from differentiating a 0.1° RMS encoder at 1 kHz?</p>
`,explain:`<p>σ√2/T.</p>
`,answer:2.468,tol:.01,unit:`rad/s`},{id:`p14-l09-q2`,type:`num`,q:`<p>Size of the observer gain matrix L for 4 states and 2 sensors (rows × columns, as a number of entries)?</p>
`,explain:`<p>L is 4 by 2.</p>
`,answer:8,tol:.001,unit:``},{id:`p14-l09-q3`,type:`num`,q:`<p>Time constant in ms of the slowest observer pole at −20 rad/s?</p>
`,explain:`<p>1/20 s.</p>
`,answer:50,tol:.001,unit:`ms`},{id:`p14-l09-q4`,type:`num`,q:`<p>Factor by which an error mode at −20 rad/s shrinks in 0.5 s?</p>
`,explain:`<p>e^(−20 × 0.5).</p>
`,answer:454e-7,tol:.01,unit:``},{id:`p14-l09-q5`,type:`mc`,q:`<p>The error dynamics of a Luenberger observer depend on…</p>
`,explain:`<p>Both u and x cancel in the subtraction.</p>
`,options:[`only A − LC, not on u or x`,`the input u`,`the reference`,`the controller gain K`],answer:0},{id:`p14-l09-q6`,type:`mc`,q:`<p>Making the observer poles much faster mainly costs…</p>
`,explain:`<p>Large L amplifies sensor noise.</p>
`,options:[`instability of the plant`,`more measurement noise in the estimate`,`loss of observability`,`a steady-state error`],answer:1}],"p14-l10":[{id:`p14-l10-q1`,type:`num`,q:`<p>How many closed-loop eigenvalues does observer-based control of a 4-state plant have?</p>
`,explain:`<p>4 from the controller, 4 from the observer.</p>
`,answer:8,tol:.001,unit:``},{id:`p14-l10-q2`,type:`num`,q:`<p>Slowest closed-loop pole if the controller’s slowest is −1.39 and the observer’s is −0.5?</p>
`,explain:`<p>The union keeps both.</p>
`,answer:-.5,tol:.001,unit:``},{id:`p14-l10-q3`,type:`num`,q:`<p>Number of zero blocks in the (x, e) closed-loop matrix?</p>
`,explain:`<p>The lower-left block.</p>
`,answer:1,tol:.001,unit:``},{id:`p14-l10-q4`,type:`num`,q:`<p>Real part of the controller’s complex poles in the worked example?</p>
`,explain:`<p>−1.39 ± 0.89j.</p>
`,answer:-1.39,tol:.01,unit:``},{id:`p14-l10-q5`,type:`mc`,q:`<p>The separation principle guarantees…</p>
`,explain:`<p>Margins are not guaranteed.</p>
`,options:[`the same robustness margins as full state feedback`,`zero estimation error at all times`,`that the observer can be omitted`,`the closed-loop poles are the union of the controller and observer poles`],answer:3},{id:`p14-l10-q6`,type:`mc`,q:`<p>In the (x, e) coordinates, the reference input excites…</p>
`,explain:`<p>The input matrix is (B, 0).</p>
`,options:[`neither`,`both equally`,`only x, never e`,`only e`],answer:2}],"p14-l11":[{id:`p14-l11-q1`,type:`num`,q:`<p>Discrete pole for a continuous pole at −8.55 rad/s sampled at 5 ms?</p>
`,explain:`<p>z = e^(sT).</p>
`,answer:.95817,tol:.001,unit:``},{id:`p14-l11-q2`,type:`num`,q:`<p>Multiply-adds per control tick for u = −Kx with 4 states?</p>
`,explain:`<p>One per state.</p>
`,answer:4,tol:.001,unit:``},{id:`p14-l11-q3`,type:`num`,q:`<p>Sample time in ms above which the emulated continuous gain is unstable here?</p>
`,explain:`<p>Found by sweeping the spectral radius.</p>
`,answer:106,tol:.02,unit:`ms`},{id:`p14-l11-q4`,type:`num`,q:`<p>Spectral radius of the emulated gain at 150 ms?</p>
`,explain:`<p>Greater than 1, so unstable.</p>
`,answer:2.45,tol:.01,unit:``},{id:`p14-l11-q5`,type:`mc`,q:`<p>The discrete LQR is preferred over emulation when…</p>
`,explain:`<p>At fast rates they agree.</p>
`,options:[`Q is diagonal`,`the plant is continuous`,`there are no sensors`,`the sample time is not small compared with the closed-loop dynamics`],answer:3},{id:`p14-l11-q6`,type:`mc`,q:`<p>A_d = e^(AT) and B_d come from…</p>
`,explain:`<p>Exact for inputs held constant over each step.</p>
`,options:[`forward Euler`,`a Kalman filter`,`a zero-order-hold discretisation`,`a Tustin transform`],answer:2}],"p14-l12":[{id:`p14-l12-q1`,type:`num`,q:`<p>Kalman gain for prior variance 4 and measurement variance 1?</p>
`,explain:`<p>K = P⁻/(P⁻ + R).</p>
`,answer:.8,tol:.001,unit:``},{id:`p14-l12-q2`,type:`num`,q:`<p>Posterior variance in that case?</p>
`,explain:`<p>(1 − K)P⁻.</p>
`,answer:.8,tol:.001,unit:``},{id:`p14-l12-q3`,type:`num`,q:`<p>Expected NEES for a 2-state filter that is consistent?</p>
`,explain:`<p>Chi-square mean equals the degrees of freedom.</p>
`,answer:2,tol:.001,unit:``},{id:`p14-l12-q4`,type:`num`,q:`<p>Upper 97.5 % point of the average NEES over 200 runs of a 2-state filter?</p>
`,explain:`<p>chi2(Nn) / N.</p>
`,answer:2.2869,tol:.005,unit:``},{id:`p14-l12-q5`,type:`mc`,q:`<p>An average NEES far above the band means the filter is…</p>
`,explain:`<p>Errors are bigger than the filter believes.</p>
`,options:[`unobservable`,`too cautious, with P too large`,`optimal`,`overconfident, with P too small`],answer:3},{id:`p14-l12-q6`,type:`mc`,q:`<p>The predict step generally…</p>
`,explain:`<p>Process noise adds uncertainty between measurements.</p>
`,options:[`changes the gain only`,`uses the measurement`,`decreases the uncertainty`,`increases the uncertainty by adding Q`],answer:3}],"p14-l13":[{id:`p14-l13-q1`,type:`num`,q:`<p>Position entry of Q for q = 0.1 and T = 1 s?</p>
`,explain:`<p>qT³/3.</p>
`,answer:.03333,tol:.001,unit:`m²`},{id:`p14-l13-q2`,type:`num`,q:`<p>RMS 2-D error in m of raw fixes with 5 m noise per axis?</p>
`,explain:`<p>√(σ² + σ²).</p>
`,answer:7.071,tol:.001,unit:`m`},{id:`p14-l13-q3`,type:`num`,q:`<p>Speed in m/s of 30 km/h?</p>
`,explain:`<p>Divide by 3.6.</p>
`,answer:8.333,tol:.001,unit:`m/s`},{id:`p14-l13-q4`,type:`num`,q:`<p>Velocity entry of Q for q = 0.1 and T = 1 s?</p>
`,explain:`<p>qT.</p>
`,answer:.1,tol:.001,unit:`m²/s²`},{id:`p14-l13-q5`,type:`mc`,q:`<p>An assumed q far too small makes the track…</p>
`,explain:`<p>The filter trusts its straight-line model too much.</p>
`,options:[`lag behind every bend`,`follow the noise`,`diverge immediately`,`exact`],answer:0},{id:`p14-l13-q6`,type:`mc`,q:`<p>During a GPS outage the filter…</p>
`,explain:`<p>Predict-only steps.</p>
`,options:[`uses the last fix as truth`,`resets to zero`,`stops and freezes the covariance`,`keeps predicting and lets the covariance grow`],answer:3}],"p14-l14":[{id:`p14-l14-q1`,type:`num`,q:`<p>Expected NIS for a 2-D position measurement?</p>
`,explain:`<p>Chi-square with m = 2 has mean 2.</p>
`,answer:2,tol:.001,unit:``},{id:`p14-l14-q2`,type:`num`,q:`<p>Upper 97.5 % point of the average NIS over 2999 scalar innovations?</p>
`,explain:`<p>chi2(N)/N.</p>
`,answer:1.0513,tol:.002,unit:``},{id:`p14-l14-q3`,type:`num`,q:`<p>R in m² for a sensor with 0.3 m standard deviation?</p>
`,explain:`<p>The variance.</p>
`,answer:.09,tol:.001,unit:`m²`},{id:`p14-l14-q4`,type:`num`,q:`<p>Fraction of scalar innovations expected inside ±2√S?</p>
`,explain:`<p>The Gaussian 2-sigma probability.</p>
`,answer:.9545,tol:.002,unit:``},{id:`p14-l14-q5`,type:`mc`,q:`<p>Average NIS well above its band means…</p>
`,explain:`<p>Innovations are bigger than the filter expects.</p>
`,options:[`Q or R is too large`,`the filter is optimal`,`Q or R is too small and the filter is overconfident`,`the sensor is perfect`],answer:2},{id:`p14-l14-q6`,type:`mc`,q:`<p>Why is NIS usable on real logs when NEES is not?</p>
`,explain:`<p>NEES needs ground truth.</p>
`,options:[`it ignores R`,`it is always smaller`,`it needs only measurements, not the true state`,`it needs no covariance`],answer:2}],"p14-l15":[{id:`p14-l15-q1`,type:`num`,q:`<p>Small-angle natural frequency in rad/s of a 0.5 m pendulum?</p>
`,explain:`<p>√(g/ℓ).</p>
`,answer:4.429,tol:.001,unit:`rad/s`},{id:`p14-l15-q2`,type:`num`,q:`<p>F₂₁ of the Euler-step Jacobian at θ = 1.2 rad with T = 0.02 s?</p>
`,explain:`<p>−(g/ℓ)T cos θ.</p>
`,answer:-.14216,tol:.01,unit:``},{id:`p14-l15-q3`,type:`num`,q:`<p>Same entry at θ = 0?</p>
`,explain:`<p>cos 0 = 1.</p>
`,answer:-.3924,tol:.001,unit:``},{id:`p14-l15-q4`,type:`num`,q:`<p>Angle noise variance in rad² for a 2° sensor?</p>
`,explain:`<p>R = σ².</p>
`,answer:.0012185,tol:.01,unit:`rad²`},{id:`p14-l15-q5`,type:`mc`,q:`<p>The EKF propagates the covariance using…</p>
`,explain:`<p>First-order linearisation around the estimate.</p>
`,options:[`sigma points`,`the nonlinear function itself`,`a fixed matrix computed offline`,`the Jacobian of f at the current estimate`],answer:3},{id:`p14-l15-q6`,type:`mc`,q:`<p>The small-angle KF fails on big swings because…</p>
`,explain:`<p>Gravity’s stiffness falls as cos θ.</p>
`,options:[`it uses too large a Q`,`it predicts too often`,`the sensor is nonlinear`,`its model has the restoring stiffness of θ = 0 everywhere`],answer:3}],"p14-l16":[{id:`p14-l16-q1`,type:`num`,q:`<p>Number of sigma points for a 6-state filter?</p>
`,explain:`<p>2n + 1.</p>
`,answer:13,tol:.001,unit:``},{id:`p14-l16-q2`,type:`num`,q:`<p>Central weight W₀ for n = 2 and λ = 1?</p>
`,explain:`<p>λ/(n + λ).</p>
`,answer:.3333,tol:.001,unit:``},{id:`p14-l16-q3`,type:`num`,q:`<p>True mean distance in m along the bearing axis for r = 10 m and σ_θ = 30°?</p>
`,explain:`<p>r e^(−σ²/2).</p>
`,answer:8.7193,tol:.001,unit:`m`},{id:`p14-l16-q4`,type:`num`,q:`<p>Weight of each of the other sigma points for n = 2 and λ = 1?</p>
`,explain:`<p>1/(2(n + λ)).</p>
`,answer:.16667,tol:.001,unit:``},{id:`p14-l16-q5`,type:`mc`,q:`<p>For a linear function the unscented transform is…</p>
`,explain:`<p>Mean and covariance pass through a linear map exactly.</p>
`,options:[`exact`,`undefined`,`biased`,`first-order accurate`],answer:0},{id:`p14-l16-q6`,type:`mc`,q:`<p>What does the UKF avoid that the EKF needs?</p>
`,explain:`<p>Points are pushed through the functions directly.</p>
`,options:[`Jacobians of f and h`,`a covariance matrix`,`a measurement model`,`an initial estimate`],answer:0}],"p14-l17":[{id:`p14-l17-q1`,type:`num`,q:`<p>Crossover frequency in Hz of a complementary filter with K_p = 1 rad/s?</p>
`,explain:`<p>K_p/(2π).</p>
`,answer:.159,tol:.01,unit:`Hz`},{id:`p14-l17-q2`,type:`num`,q:`<p>False pitch in degrees seen by an accelerometer during a 2 m/s² forward acceleration?</p>
`,explain:`<p>atan(a/g).</p>
`,answer:11.52,tol:.01,unit:`deg`},{id:`p14-l17-q3`,type:`num`,q:`<p>Angle drift in degrees after 60 s from an uncorrected 0.03 rad/s gyro bias about a fixed axis?</p>
`,explain:`<p>Bias × time.</p>
`,answer:103.1,tol:.01,unit:`deg`},{id:`p14-l17-q4`,type:`num`,q:`<p>Steady attitude error in rad of a proportional-only correction with K_p = 1 and bias 0.03 rad/s?</p>
`,explain:`<p>e = b/K_p; the integral term removes it.</p>
`,answer:.03,tol:.001,unit:`rad`},{id:`p14-l17-q5`,type:`mc`,q:`<p>Which state is barely observable from gyro plus accelerometer?</p>
`,explain:`<p>Gravity doesn’t change with yaw.</p>
`,options:[`roll`,`the x gyro bias`,`yaw and the z gyro bias`,`pitch`],answer:2},{id:`p14-l17-q6`,type:`mc`,q:`<p>With the accelerometer correction disabled, the attitude…</p>
`,explain:`<p>Nothing pulls it back.</p>
`,options:[`becomes noisier but unbiased`,`drifts with the integrated gyro bias`,`locks to gravity`,`stays exact`],answer:1}],"p14-l18":[{id:`p14-l18-q1`,type:`num`,q:`<p>Number of decision variables for a single-input MPC with horizon 20?</p>
`,explain:`<p>One input per step.</p>
`,answer:20,tol:.001,unit:``},{id:`p14-l18-q2`,type:`num`,q:`<p>Look-ahead time in s for N = 20 at T = 0.1 s?</p>
`,explain:`<p>N T.</p>
`,answer:2,tol:.001,unit:`s`},{id:`p14-l18-q3`,type:`num`,q:`<p>Unconstrained LQR force per kg in N for a 5 m position error with K₁ = 7.613?</p>
`,explain:`<p>Far beyond a ±1 limit.</p>
`,answer:38.07,tol:.01,unit:`N`},{id:`p14-l18-q4`,type:`num`,q:`<p>Size of H (rows) for a single-input horizon of 20?</p>
`,explain:`<p>H is N·m by N·m.</p>
`,answer:20,tol:.001,unit:``},{id:`p14-l18-q5`,type:`mc`,q:`<p>Unconstrained MPC with the Riccati terminal cost gives a first move equal to…</p>
`,explain:`<p>The terminal cost is the exact cost-to-go.</p>
`,options:[`a bang-bang input`,`zero`,`the infinite-horizon LQR`,`a PID`],answer:2},{id:`p14-l18-q6`,type:`mc`,q:`<p>Clipping an unconstrained controller’s output at the limit…</p>
`,explain:`<p>The plan doesn’t know it can’t brake as hard as it assumed.</p>
`,options:[`is always optimal`,`ignores the limit in the plan and can overshoot badly`,`is unstable for any plant`,`is identical to MPC`],answer:1}]};export{e as default};