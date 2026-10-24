# Phase 01 · Workbench & Linear Algebra

> Set up the bench, then build the matrix toolkit every later phase leans on.

- **Lessons:** 18
- **Maps to:** Linear Algebra (ETH Zurich course title)
- **Main tool:** NumPy · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p01-l01 · The from-scratch loop

**Goal:** Set up a repo where every lesson ends in a passing test and a kept artifact.

- **Derive by hand:** Define a residual r = x_hat - x and a pass criterion abs(r) <= atol + rtol*abs(x).
- **Code from scratch (Python):** Write assert_close(a, b, rtol, atol) and a pytest fixture that saves plots to artifacts/.
- **Interactive lab / visual:** Tolerance slider that flips a sample result between pass and fail.
- **Test that proves it works:** pytest runs green and artifacts/ contains one PNG per lesson.
- **Pro / open-source tool it maps to:** pytest
- **Course mapping:** Linear Algebra (ETH)

## p01-l02 · Units and dimensional analysis

**Goal:** Catch unit errors before they reach a simulation.

- **Derive by hand:** Buckingham pi: express torque, power and energy in SI base units; N*m*rad/s = W.
- **Code from scratch (Python):** Build a tiny Quantity class that tracks exponents of kg, m, s, A and refuses mismatched addition.
- **Interactive lab / visual:** Drag-and-drop unit tiles that must cancel to watts.
- **Test that proves it works:** Adding metres to seconds raises; torque*speed returns watts.
- **Pro / open-source tool it maps to:** pint
- **Course mapping:** Linear Algebra (ETH)

## p01-l03 · Vectors, dot and cross products

**Goal:** Use vectors to express forces, moments and directions.

- **Derive by hand:** Derive a.b = abs(a)abs(b)cos(theta) and the cross product as the area-normal; moment M = r x F.
- **Code from scratch (Python):** Implement dot, cross and norm without numpy.linalg.
- **Interactive lab / visual:** 3D arrows: rotate a force around a pivot and watch the moment vector change.
- **Test that proves it works:** Matches np.cross on 1000 random vectors; r x F is orthogonal to both.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)
- **Real-world anchor:** Switzerland

## p01-l04 · Matrices as linear maps

**Goal:** See a matrix as a machine that moves vectors.

- **Derive by hand:** Columns of A are images of basis vectors; composition is multiplication.
- **Code from scratch (Python):** Write matmul with triple loops, then vectorise and compare timing.
- **Interactive lab / visual:** Grid warp: edit a 2x2 matrix and watch the unit square shear and scale.
- **Test that proves it works:** Loop and vectorised matmul agree to 1e-12.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)
- **Real-world anchor:** Switzerland

## p01-l05 · Gaussian elimination with partial pivoting

**Goal:** Solve Ax = b the way every circuit and FEM solver does underneath.

- **Derive by hand:** Row operations as left-multiplication; pivoting bounds growth of round-off.
- **Code from scratch (Python):** Implement gauss_solve(A, b) with partial pivoting and back substitution.
- **Interactive lab / visual:** Step through elimination on a 4x4 nodal-analysis matrix.
- **Test that proves it works:** Residual norm(Ax - b) < 1e-10 on random well-conditioned systems; raises on singular A.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l06 · LU decomposition

**Goal:** Factor once, solve many right-hand sides in a control loop.

- **Derive by hand:** Derive PA = LU from the elimination multipliers.
- **Code from scratch (Python):** Implement lu(A) returning P, L, U and lu_solve.
- **Interactive lab / visual:** Animate L filling below the diagonal as U forms above it.
- **Test that proves it works:** P@A equals L@U; repeated solves beat re-elimination in a timing test.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l07 · Determinants and invertibility

**Goal:** Know when a system has no unique answer.

- **Derive by hand:** Determinant as signed volume; det(AB) = det(A)det(B); zero det means a collapsed dimension.
- **Code from scratch (Python):** Compute det via LU (product of pivots with permutation sign).
- **Interactive lab / visual:** Parallelogram area tracks det as you drag column vectors; it vanishes when they align.
- **Test that proves it works:** det via LU matches np.linalg.det; singular matrices flagged.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l08 · Least squares and the normal equations

**Goal:** Fit a model to noisy measurements, e.g. a motor torque constant.

- **Derive by hand:** Minimise norm(Ax - b)^2; derive A^T A x = A^T b by setting the gradient to zero.
- **Code from scratch (Python):** Fit k_t from current/torque bench data with your own solver.
- **Interactive lab / visual:** Scatter plot with a draggable outlier showing how the line moves.
- **Test that proves it works:** Recovers synthetic k_t within 1 percent at SNR 20 dB.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l09 · QR decomposition

**Goal:** Solve least squares without squaring the condition number.

- **Derive by hand:** Gram-Schmidt orthogonalisation and Householder reflections; R x = Q^T b.
- **Code from scratch (Python):** Implement modified Gram-Schmidt and a Householder QR.
- **Interactive lab / visual:** Watch basis vectors become orthonormal step by step.
- **Test that proves it works:** Q^T Q = I to 1e-12; QR least squares beats normal equations on an ill-conditioned fit.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)
- **Real-world anchor:** Switzerland

## p01-l10 · Eigenvalues and eigenvectors

**Goal:** Find the directions a system naturally moves along.

- **Derive by hand:** Solve det(A - lambda I) = 0 for 2x2; power iteration converges at rate abs(lambda2/lambda1).
- **Code from scratch (Python):** Implement power iteration and inverse iteration with shifts.
- **Interactive lab / visual:** Vectors spin under repeated A until they lock onto the dominant eigenvector.
- **Test that proves it works:** Eigenpairs satisfy A v = lambda v to 1e-9.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l11 · Diagonalisation and modal analysis

**Goal:** Decouple a vibrating structure into independent modes.

- **Derive by hand:** A = V Lambda V^-1; for M x'' + K x = 0 solve the generalised eigenproblem K v = w^2 M v.
- **Code from scratch (Python):** Compute mode shapes of a 3-mass spring chain.
- **Interactive lab / visual:** 3D spring chain vibrating in each pure mode and in a mix.
- **Test that proves it works:** Natural frequencies match the analytic two-mass result.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l12 · Singular value decomposition

**Goal:** Measure how a map stretches space; core of IK and calibration.

- **Derive by hand:** Derive SVD from eigen-decomposition of A^T A; ellipse axes are singular values.
- **Code from scratch (Python):** Implement SVD via eigenvectors of A^T A and compare with a one-sided Jacobi SVD.
- **Interactive lab / visual:** Unit circle mapped to an ellipse with live singular values.
- **Test that proves it works:** U S V^T reconstructs A; singular values match NumPy.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l13 · Condition number and numerical error

**Goal:** Predict when a computation will lie to you.

- **Derive by hand:** kappa(A) = s_max/s_min bounds relative error amplification; machine epsilon.
- **Code from scratch (Python):** Perturb b and measure output error versus kappa on Hilbert matrices.
- **Interactive lab / visual:** Slider for kappa showing the error cone around a solution.
- **Test that proves it works:** Measured error stays below kappa*eps*norm bound.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Linear Algebra (ETH)

## p01-l14 · Rotation matrices and SO(3)

**Goal:** Represent orientation of a robot link or drone body.

- **Derive by hand:** R^T R = I, det R = 1; elementary rotations about x, y, z; composition order matters.
- **Code from scratch (Python):** Implement rotx, roty, rotz and a validity checker.
- **Interactive lab / visual:** 3D frame you rotate with sliders; extrinsic versus intrinsic order shown side by side.
- **Test that proves it works:** Products stay orthonormal after 10^6 compositions with re-orthonormalisation.
- **Pro / open-source tool it maps to:** SciPy Rotation
- **Course mapping:** Linear Algebra (ETH)

## p01-l15 · Euler angles and gimbal lock

**Goal:** Understand why drones and cameras avoid Euler angles internally.

- **Derive by hand:** ZYX roll-pitch-yaw extraction; singularity at pitch = 90 degrees.
- **Code from scratch (Python):** Convert R to and from ZYX Euler angles with singularity handling.
- **Interactive lab / visual:** 3D gimbal rig that loses a degree of freedom at 90 degree pitch.
- **Test that proves it works:** Round-trip error < 1e-9 away from the singularity; singular case detected.
- **Pro / open-source tool it maps to:** SciPy Rotation
- **Course mapping:** Linear Algebra (ETH)

## p01-l16 · Quaternions

**Goal:** Integrate orientation smoothly and cheaply.

- **Derive by hand:** Derive q = [cos(t/2), sin(t/2) u]; Hamilton product; q' = 0.5 q * omega.
- **Code from scratch (Python):** Implement quat multiply, normalise, to_matrix, slerp and integration from gyro rates.
- **Interactive lab / visual:** Slerp between two drone attitudes versus naive Euler interpolation.
- **Test that proves it works:** to_matrix(q) matches Rodrigues; integrated constant rate matches analytic rotation.
- **Pro / open-source tool it maps to:** SciPy Rotation
- **Course mapping:** Linear Algebra (ETH)

## p01-l17 · Homogeneous transforms and SE(3)

**Goal:** Chain frames from world to base to tool.

- **Derive by hand:** 4x4 T = [R p; 0 1]; inverse T^-1 = [R^T, -R^T p].
- **Code from scratch (Python):** Implement transform compose, inverse and point transformation.
- **Interactive lab / visual:** Chain of coordinate frames along a 3-link arm you can edit live.
- **Test that proves it works:** T @ inv(T) = I; transformed points match manual R p + t.
- **Pro / open-source tool it maps to:** ROS 2 tf2
- **Course mapping:** Linear Algebra (ETH)

## p01-l18 · Skew matrices and the exponential map

**Goal:** Connect angular velocity to rotation for kinematics and estimation.

- **Derive by hand:** Rodrigues formula exp([w]x t); log map back to axis-angle.
- **Code from scratch (Python):** Implement hat, vee, expm_so3 and logm_so3.
- **Interactive lab / visual:** Draw omega as an arrow and watch the frame sweep.
- **Test that proves it works:** expm_so3 equals scipy.linalg.expm of the skew matrix to 1e-10.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Linear Algebra (ETH)
- **Real-world anchor:** Switzerland
# Phase 02 · Calculus, ODEs & Numerical Integration

> Every simulation on this site is an integrator stepping an ODE. Build them yourself.

- **Lessons:** 16
- **Maps to:** Analysis I and II (ETH Zurich course title)
- **Main tool:** NumPy · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p02-l01 · Derivatives as sensitivity

**Goal:** Read a derivative as how much output moves per unit input.

- **Derive by hand:** Limit definition; forward, backward and central differences with O(h) and O(h^2) error.
- **Code from scratch (Python):** Implement numeric derivatives and plot error versus step size h.
- **Interactive lab / visual:** Log-log error plot that shows the round-off valley.
- **Test that proves it works:** Central difference error slope is 2 on the log-log plot.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Analysis I and II (ETH)

## p02-l02 · Taylor series and linearisation

**Goal:** Replace a nonlinear curve with a line near an operating point.

- **Derive by hand:** f(x0 + dx) = f(x0) + f'(x0)dx + ...; small-angle sin(theta) ~ theta.
- **Code from scratch (Python):** Compare sin(theta) and its Taylor polynomials to order 1, 3, 5.
- **Interactive lab / visual:** Slider for operating point with the tangent line following.
- **Test that proves it works:** First-order error under 1 percent below 14 degrees.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Analysis I and II (ETH)

## p02-l03 · Integration and accumulation

**Goal:** Turn rates into totals: current to charge, speed to distance.

- **Derive by hand:** Riemann sums, trapezoid and Simpson rules with error orders.
- **Code from scratch (Python):** Implement trapz and simpson; integrate a scooter speed log to distance.
- **Interactive lab / visual:** Rectangles and trapezoids filling under a curve as N grows.
- **Test that proves it works:** Simpson converges at order 4 on a polynomial benchmark.
- **Pro / open-source tool it maps to:** SciPy integrate
- **Course mapping:** Analysis I and II (ETH)
- **Real-world anchor:** Bali

## p02-l04 · Gradients and Jacobians numerically

**Goal:** Linearise multi-input systems automatically.

- **Derive by hand:** J_ij = df_i/dx_j; complex-step derivative for machine-precision gradients.
- **Code from scratch (Python):** Write numerical_jacobian(f, x) with central and complex-step variants.
- **Interactive lab / visual:** Heat map of a 2-link arm Jacobian as you move the arm.
- **Test that proves it works:** Matches analytic Jacobian of the 2-link arm to 1e-8.
- **Pro / open-source tool it maps to:** JAX
- **Course mapping:** Analysis I and II (ETH)

## p02-l05 · First-order ODEs

**Goal:** Model RC charging and thermal warm-up.

- **Derive by hand:** Solve tau x' + x = u analytically: x = u(1 - exp(-t/tau)).
- **Code from scratch (Python):** Simulate an RC circuit and a motor winding temperature.
- **Interactive lab / visual:** Charging curve with draggable tau showing 63 percent at t = tau.
- **Test that proves it works:** Numeric solution matches analytic to 1e-4 with small steps.
- **Pro / open-source tool it maps to:** SciPy integrate
- **Course mapping:** Analysis I and II (ETH)

## p02-l06 · Second-order ODEs

**Goal:** Model the mass-spring-damper behind every suspension and watch balance.

- **Derive by hand:** m x'' + c x' + k x = F; derive wn, zeta and the three damping cases.
- **Code from scratch (Python):** Simulate under-, critically and over-damped responses.
- **Interactive lab / visual:** 3D mass on a spring with zeta slider; a Swiss watch balance wheel analogy.
- **Test that proves it works:** Measured overshoot matches exp(-zeta*pi/sqrt(1-zeta^2)).
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Analysis I and II (ETH)
- **Real-world anchor:** Switzerland

## p02-l07 · Explicit Euler and its stability

**Goal:** See why a naive integrator blows up a stiff system.

- **Derive by hand:** x(k+1) = x(k) + h f(x); stability region abs(1 + h lambda) < 1.
- **Code from scratch (Python):** Implement Euler; find the step size where a spring-mass sim diverges.
- **Interactive lab / visual:** Energy plot that grows without bound once h is too big.
- **Test that proves it works:** Divergence threshold matches h = 2/abs(lambda) prediction.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Analysis I and II (ETH)

## p02-l08 · Semi-implicit (symplectic) Euler

**Goal:** Get stable mechanics simulations for almost free.

- **Derive by hand:** Update velocity first then position; show bounded energy error.
- **Code from scratch (Python):** Implement symplectic Euler and compare energy drift with explicit Euler.
- **Interactive lab / visual:** Two pendulums side by side: one gains energy, one does not.
- **Test that proves it works:** Energy drift over 10^5 steps stays bounded.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Analysis I and II (ETH)

## p02-l09 · Runge-Kutta 4

**Goal:** Use the workhorse integrator behind the labs on this site.

- **Derive by hand:** Derive RK4 weights by matching Taylor terms up to order 4.
- **Code from scratch (Python):** Implement rk4_step(f, x, u, h) and apply it to the pendulum.
- **Interactive lab / visual:** Error versus step size for Euler, RK2 and RK4 on one chart.
- **Test that proves it works:** Global error slope equals 4.
- **Pro / open-source tool it maps to:** SciPy solve_ivp
- **Course mapping:** Analysis I and II (ETH)

## p02-l10 · Adaptive step size (RK45)

**Goal:** Let the integrator choose its own step.

- **Derive by hand:** Embedded Dormand-Prince pair; local error estimate and step control law.
- **Code from scratch (Python):** Implement an adaptive RK45 with tolerance control.
- **Interactive lab / visual:** Step-size trace shrinking at a sudden impact event.
- **Test that proves it works:** Hits requested tolerance on a Van der Pol oscillator.
- **Pro / open-source tool it maps to:** SciPy solve_ivp
- **Course mapping:** Analysis I and II (ETH)

## p02-l11 · Stiff systems and implicit Euler

**Goal:** Simulate circuits with fast and slow dynamics together.

- **Derive by hand:** Backward Euler x(k+1) = x(k) + h f(x(k+1)); A-stability.
- **Code from scratch (Python):** Implement implicit Euler with a Newton solve per step.
- **Interactive lab / visual:** Stiff RC-plus-mechanics model: explicit explodes, implicit stays calm.
- **Test that proves it works:** Stable at steps 100x larger than the explicit limit.
- **Pro / open-source tool it maps to:** SciPy BDF
- **Course mapping:** Analysis I and II (ETH)

## p02-l12 · Systems of ODEs in state form

**Goal:** Write any model as x' = f(x, u).

- **Derive by hand:** Reduce an nth-order ODE to n first-order equations.
- **Code from scratch (Python):** Build a generic simulate(f, x0, u_fn, t) harness used for the rest of the course.
- **Interactive lab / visual:** Pick a model from a dropdown and see its states plotted.
- **Test that proves it works:** Harness reproduces lessons 5 and 6 exactly.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Analysis I and II (ETH)

## p02-l13 · Equilibria and phase portraits

**Goal:** See all behaviours of a 2D system at once.

- **Derive by hand:** Equilibria solve f(x) = 0; nullclines; classify nodes, saddles, foci.
- **Code from scratch (Python):** Plot a vector field and trajectories for pendulum and Van der Pol.
- **Interactive lab / visual:** Click anywhere on the phase plane to launch a trajectory.
- **Test that proves it works:** Detected equilibria match analytic ones for the pendulum.
- **Pro / open-source tool it maps to:** Matplotlib
- **Course mapping:** Analysis I and II (ETH)

## p02-l14 · Linearisation around equilibria

**Goal:** Get the A and B matrices that control design needs.

- **Derive by hand:** Taylor expand f about (x*, u*): A = df/dx, B = df/du.
- **Code from scratch (Python):** Linearise the pendulum upright and hanging; compare eigenvalues.
- **Interactive lab / visual:** Overlay nonlinear and linear responses as the angle grows.
- **Test that proves it works:** Upright linearisation has one positive real eigenvalue sqrt(g/l).
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Analysis I and II (ETH)

## p02-l15 · Newton's method for nonlinear equations

**Goal:** Solve diode circuits, IK and trim points.

- **Derive by hand:** x(k+1) = x(k) - J^-1 f(x); quadratic convergence and basins of attraction.
- **Code from scratch (Python):** Implement Newton with backtracking line search.
- **Interactive lab / visual:** Fractal basin plot of Newton on z^3 - 1.
- **Test that proves it works:** Converges quadratically near a simple root.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Analysis I and II (ETH)

## p02-l16 · Optimisation basics

**Goal:** Fit and tune with gradient descent and Gauss-Newton.

- **Derive by hand:** Gradient descent step size bounds; Gauss-Newton from linearised residuals.
- **Code from scratch (Python):** Fit damping and stiffness of a spring from a measured step response.
- **Interactive lab / visual:** Loss landscape with the optimiser path drawn over it.
- **Test that proves it works:** Recovers parameters within 2 percent from noisy data.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Analysis I and II (ETH)
# Phase 03 · Laplace, Fourier & z-Transforms

> Move between time, frequency and s-plane until transfer functions feel physical.

- **Lessons:** 14
- **Maps to:** Signals and systems (generic) (generic topic, not an exact ETH title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p03-l01 · Complex numbers and phasors

**Goal:** Represent sinusoids as rotating arrows.

- **Derive by hand:** z = a + jb = r e^(j phi); multiplication rotates and scales.
- **Code from scratch (Python):** Implement phasor arithmetic for AC circuit sums.
- **Interactive lab / visual:** Rotating phasors summing tip to tail.
- **Test that proves it works:** Phasor sum equals time-domain sum sampled at 1000 points.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l02 · Euler's formula and sinusoids

**Goal:** Connect exponentials, sines and oscillation.

- **Derive by hand:** Derive e^(j w t) = cos + j sin from Taylor series.
- **Code from scratch (Python):** Generate sinusoids from complex exponentials and check identities.
- **Interactive lab / visual:** Helix in 3D whose projections are sine and cosine.
- **Test that proves it works:** Identity holds to 1e-12 across a sweep.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l03 · The Laplace transform

**Goal:** Turn derivatives into algebra.

- **Derive by hand:** Derive L{x'} = sX - x(0) from the definition by integration by parts.
- **Code from scratch (Python):** Numerically evaluate Laplace integrals and compare with a table.
- **Interactive lab / visual:** Surface plot of abs(F(s)) over the s-plane.
- **Test that proves it works:** Numeric transform of e^(-at) matches 1/(s + a).
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l04 · Transfer functions from ODEs

**Goal:** Write G(s) for a motor, a filter or a spring.

- **Derive by hand:** Zero initial conditions: G(s) = Y(s)/U(s).
- **Code from scratch (Python):** Build a TF class with numerator, denominator, series and feedback.
- **Interactive lab / visual:** Block diagram where blocks multiply into one TF live.
- **Test that proves it works:** Series/feedback match python-control results.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l05 · Poles, zeros and time response

**Goal:** Predict response shape from the s-plane.

- **Derive by hand:** Pole location sets decay and frequency; dominant poles.
- **Code from scratch (Python):** Compute poles and simulate step responses for a pole set.
- **Interactive lab / visual:** Drag poles on the s-plane and watch the step response morph.
- **Test that proves it works:** Settling time matches 4/(zeta wn) within 5 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)
- **Real-world anchor:** Switzerland

## p03-l06 · Partial fractions and inverse Laplace

**Goal:** Get closed-form time responses.

- **Derive by hand:** Residue method for distinct and repeated poles.
- **Code from scratch (Python):** Implement residue computation for distinct poles.
- **Interactive lab / visual:** Each partial-fraction term plotted and summed.
- **Test that proves it works:** Reconstructed response matches simulation.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l07 · Initial and final value theorems

**Goal:** Read steady-state error without simulating.

- **Derive by hand:** x(inf) = lim s->0 sX(s), valid only for stable systems.
- **Code from scratch (Python):** Compute final values and flag invalid use for unstable systems.
- **Interactive lab / visual:** Step response with the predicted final value line.
- **Test that proves it works:** Matches simulated steady state; detects an unstable case.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l08 · Convolution and impulse response

**Goal:** Understand output as a weighted sum of past inputs.

- **Derive by hand:** y = h * u; derive from linearity and time invariance.
- **Code from scratch (Python):** Implement discrete convolution with loops then FFT.
- **Interactive lab / visual:** Flip-and-slide convolution animation.
- **Test that proves it works:** Loop and FFT convolution agree to 1e-10.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l09 · Fourier series

**Goal:** See PWM as a sum of harmonics.

- **Derive by hand:** Derive coefficients of a square wave by orthogonality; Gibbs phenomenon.
- **Code from scratch (Python):** Reconstruct PWM waveforms with N harmonics.
- **Interactive lab / visual:** Harmonic slider building a square wave with visible overshoot.
- **Test that proves it works:** Coefficients match 4/(n pi) for odd n.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l10 · The Fourier transform and spectra

**Goal:** Read frequency content of vibration and noise.

- **Derive by hand:** Continuous FT, energy and Parseval.
- **Code from scratch (Python):** Compute spectra of synthetic motor vibration signals.
- **Interactive lab / visual:** Spectrum that shifts as you change motor speed.
- **Test that proves it works:** Parseval holds numerically.
- **Pro / open-source tool it maps to:** SciPy fft
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l11 · DFT and the radix-2 FFT

**Goal:** Build the FFT that every analyser uses.

- **Derive by hand:** DFT matrix; derive the butterfly by splitting even and odd samples.
- **Code from scratch (Python):** Implement recursive and iterative radix-2 FFT.
- **Interactive lab / visual:** Butterfly diagram lighting up per stage.
- **Test that proves it works:** Matches numpy.fft to 1e-9; timing scales as N log N.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l12 · Sampling and aliasing

**Goal:** Pick sample rates that do not lie.

- **Derive by hand:** Sampling as multiplication by an impulse train; Nyquist criterion.
- **Code from scratch (Python):** Sample a spinning wheel and reproduce the wagon-wheel effect.
- **Interactive lab / visual:** 3D wheel strobed at a chosen frame rate appears to spin backwards.
- **Test that proves it works:** Aliased frequency matches abs(f - k fs) prediction.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l13 · The z-transform and discrete transfer functions

**Goal:** Describe digital filters and controllers.

- **Derive by hand:** z = e^(sT); unit circle stability; difference equations to H(z).
- **Code from scratch (Python):** Implement lfilter from a difference equation.
- **Interactive lab / visual:** Poles in the z-plane with unit circle and impulse response.
- **Test that proves it works:** Matches scipy.signal.lfilter output.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Signals and systems (generic) (generic)

## p03-l14 · Discretisation: ZOH, Tustin and matched

**Goal:** Turn a continuous controller into code.

- **Derive by hand:** Derive ZOH via matrix exponential; Tustin s = (2/T)(z-1)/(z+1); prewarping.
- **Code from scratch (Python):** Discretise a PID and a lowpass with three methods.
- **Interactive lab / visual:** Bode overlay of continuous and discrete versions as T grows.
- **Test that proves it works:** ZOH step responses match continuous at sample instants.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Signals and systems (generic) (generic)
# Phase 04 · Probability & Statistics for Estimation

> Noise is the default. Learn to reason about it before you filter it.

- **Lessons:** 12
- **Maps to:** Probability and Statistics (ETH Zurich course title)
- **Main tool:** NumPy · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p04-l01 · Random variables and distributions

**Goal:** Describe sensor readings as distributions, not numbers.

- **Derive by hand:** PDF, CDF, expectation as integral.
- **Code from scratch (Python):** Sample uniform, Gaussian and exponential variables from a uniform generator.
- **Interactive lab / visual:** Histogram converging to the PDF as samples grow.
- **Test that proves it works:** Sample moments within 3 standard errors of theory.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l02 · Mean, variance and datasheets

**Goal:** Translate datasheet noise specs into variance.

- **Derive by hand:** Var = E[x^2] - E[x]^2; noise density to RMS via bandwidth.
- **Code from scratch (Python):** Convert accelerometer noise density into RMS noise at 100 Hz.
- **Interactive lab / visual:** Noise trace whose band shrinks as you lower bandwidth.
- **Test that proves it works:** RMS of simulated noise matches computed value within 5 percent.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l03 · The Gaussian and the central limit theorem

**Goal:** See why sums of errors look Gaussian.

- **Derive by hand:** Derive the Gaussian as a limit of sums; standardisation.
- **Code from scratch (Python):** Sum N uniform variables and test normality.
- **Interactive lab / visual:** Galton board in 3D that builds a bell curve.
- **Test that proves it works:** Kolmogorov-Smirnov test passes for N >= 12.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** Probability and Statistics (ETH)

## p04-l04 · Joint distributions and covariance

**Goal:** Model correlated errors between axes.

- **Derive by hand:** Covariance matrix, correlation, covariance ellipses from eigenvectors.
- **Code from scratch (Python):** Estimate covariance from IMU data and draw the ellipse.
- **Interactive lab / visual:** 2D scatter with a live 2-sigma ellipse.
- **Test that proves it works:** Estimated covariance converges to the true matrix.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l05 · Linear transforms of Gaussians

**Goal:** Propagate uncertainty through a model.

- **Derive by hand:** If y = A x + b then Sigma_y = A Sigma_x A^T.
- **Code from scratch (Python):** Propagate encoder uncertainty through arm forward kinematics.
- **Interactive lab / visual:** Uncertainty ellipse at the end effector moving with the arm.
- **Test that proves it works:** Monte Carlo covariance matches linear propagation for small noise.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l06 · Bayes' rule for sensors

**Goal:** Update belief when a measurement arrives.

- **Derive by hand:** Derive posterior proportional to likelihood times prior.
- **Code from scratch (Python):** Implement a 1D histogram filter for a corridor robot.
- **Interactive lab / visual:** Belief bars sharpening as the robot senses doors.
- **Test that proves it works:** Posterior sums to 1 and peaks at the true cell.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l07 · Maximum likelihood and least squares

**Goal:** Show least squares is MLE under Gaussian noise.

- **Derive by hand:** Maximise log-likelihood to get weighted least squares.
- **Code from scratch (Python):** Fit a sensor calibration with weighted least squares.
- **Interactive lab / visual:** Points weighted by confidence pulling a fit line.
- **Test that proves it works:** WLS beats OLS when noise variance differs by axis.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Probability and Statistics (ETH)

## p04-l08 · Monte Carlo simulation

**Goal:** Estimate failure probabilities by brute force.

- **Derive by hand:** Law of large numbers; standard error ~ 1/sqrt(N).
- **Code from scratch (Python):** Estimate tolerance stack-up of a resistor divider with 5 percent parts.
- **Interactive lab / visual:** Histogram of divider output with spec limits.
- **Test that proves it works:** Result matches analytic worst case bounds.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l09 · Allan variance for IMUs

**Goal:** Characterise gyro noise and bias instability.

- **Derive by hand:** Allan deviation definition; slopes for white noise and random walk.
- **Code from scratch (Python):** Compute overlapping Allan deviation from a simulated gyro log.
- **Interactive lab / visual:** Log-log Allan plot with labelled slopes.
- **Test that proves it works:** Recovers injected angle random walk within 10 percent.
- **Pro / open-source tool it maps to:** allantools
- **Course mapping:** Probability and Statistics (ETH)

## p04-l10 · Random walks and coloured noise

**Goal:** Model bias drift and 1/f noise.

- **Derive by hand:** Random walk variance grows linearly; first-order Gauss-Markov process.
- **Code from scratch (Python):** Simulate white, pink and Gauss-Markov noise.
- **Interactive lab / visual:** Three noise traces with their spectra.
- **Test that proves it works:** PSD slopes match theory.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)

## p04-l11 · Hypothesis tests for acceptance

**Goal:** Decide if a part or sensor passes test with evidence.

- **Derive by hand:** t-test and chi-square; p-values and false acceptance.
- **Code from scratch (Python):** Write an acceptance test for a batch of load cells.
- **Interactive lab / visual:** Sliding threshold showing false accept and false reject rates.
- **Test that proves it works:** Test rejects a biased batch at the 5 percent level.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** Probability and Statistics (ETH)

## p04-l12 · Importance sampling and particles

**Goal:** Represent non-Gaussian beliefs with samples.

- **Derive by hand:** Weights w proportional to p/q; resampling algorithms.
- **Code from scratch (Python):** Implement systematic resampling.
- **Interactive lab / visual:** Particles shrinking and concentrating after resampling.
- **Test that proves it works:** Resampled distribution matches weights statistically.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Probability and Statistics (ETH)
# Phase 05 · Circuits & Analog Electronics

> From Ohm's law to your own tiny SPICE: analyse, simulate, then build on a PCB.

- **Lessons:** 23
- **Maps to:** Electrical engineering I and II (generic) (generic topic, not an exact ETH title)
- **Main tool:** ngspice · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p05-l01 · Charge, current, voltage and power

**Goal:** Ground the four quantities in energy flow.

- **Derive by hand:** P = V I; energy as integral of power; sign conventions.
- **Code from scratch (Python):** Compute power and energy from a logged motor current and voltage.
- **Interactive lab / visual:** Animated electrons and power meter on a simple loop.
- **Test that proves it works:** Energy integral matches a known battery discharge.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l02 · Ohm's law and resistor networks

**Goal:** Reduce networks and size resistors.

- **Derive by hand:** Series and parallel rules derived from KVL/KCL; divider formula.
- **Code from scratch (Python):** Write a resistor-network reducer for series-parallel graphs.
- **Interactive lab / visual:** Drag resistors into a network and read equivalent resistance.
- **Test that proves it works:** Matches ngspice operating point.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l03 · Kirchhoff's laws and nodal analysis

**Goal:** Solve any linear DC circuit systematically.

- **Derive by hand:** KCL at each node gives G v = i; modified nodal analysis for voltage sources.
- **Code from scratch (Python):** Build an MNA solver that parses a small netlist.
- **Interactive lab / visual:** Node voltages colour the circuit as you change values.
- **Test that proves it works:** Agrees with ngspice .op on five test circuits.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l04 · Thevenin and Norton equivalents

**Goal:** Simplify a sensor front end to one source and one resistor.

- **Derive by hand:** Derive V_th as open-circuit voltage and R_th by source deactivation.
- **Code from scratch (Python):** Compute Thevenin equivalents from your MNA solver.
- **Interactive lab / visual:** Load-line plot with maximum power transfer point.
- **Test that proves it works:** Load voltages match full circuit for any R_load.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l05 · Capacitors and RC transients

**Goal:** Time a debounce or an RC filter.

- **Derive by hand:** i = C dv/dt; tau = R C; energy 0.5 C v^2.
- **Code from scratch (Python):** Simulate RC charge and discharge with your ODE harness.
- **Interactive lab / visual:** Capacitor filling while a scope trace draws.
- **Test that proves it works:** Matches ngspice .tran within 1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l06 · Inductors and RL transients

**Goal:** Understand why motor coils kick back.

- **Derive by hand:** v = L di/dt; tau = L/R; flyback voltage when current is interrupted.
- **Code from scratch (Python):** Simulate switching an inductive load with and without a flyback diode.
- **Interactive lab / visual:** Spark animation and voltage spike when the switch opens.
- **Test that proves it works:** Spike magnitude predicted from L di/dt.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l07 · RLC circuits and resonance

**Goal:** Connect electrical and mechanical oscillators.

- **Derive by hand:** Series RLC ODE; wn = 1/sqrt(LC), Q factor.
- **Code from scratch (Python):** Simulate RLC step responses and find resonance.
- **Interactive lab / visual:** Electrical RLC and mass-spring side by side in lockstep.
- **Test that proves it works:** Measured resonance matches 1/(2 pi sqrt(LC)).
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l08 · AC analysis and impedance

**Goal:** Analyse circuits at a single frequency.

- **Derive by hand:** Z_R = R, Z_C = 1/(j w C), Z_L = j w L; phasor MNA.
- **Code from scratch (Python):** Extend the MNA solver to complex AC analysis.
- **Interactive lab / visual:** Impedance phasors rotating as frequency sweeps.
- **Test that proves it works:** Matches ngspice .ac magnitude and phase.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l09 · Bode plots of passive filters

**Goal:** Read gain and phase versus frequency.

- **Derive by hand:** Asymptotes: -20 dB/decade per pole; -3 dB at the corner.
- **Code from scratch (Python):** Generate Bode plots from your AC solver.
- **Interactive lab / visual:** Corner frequency marker that follows component values.
- **Test that proves it works:** -3 dB point at 1/(2 pi R C) to 1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l10 · Diodes and the Shockley equation

**Goal:** Solve the first nonlinear circuit with Newton's method.

- **Derive by hand:** I = Is(exp(V/(n Vt)) - 1); linearised companion model.
- **Code from scratch (Python):** Add a diode to the MNA solver with Newton iterations.
- **Interactive lab / visual:** I-V curve with operating point found by load line.
- **Test that proves it works:** Converges and matches ngspice operating point.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l11 · Rectifiers and flyback protection

**Goal:** Protect electronics from motors and relays.

- **Derive by hand:** Half and full-wave rectification; ripple ~ I/(f C).
- **Code from scratch (Python):** Simulate a bridge rectifier with smoothing capacitor.
- **Interactive lab / visual:** Ripple shrinks as you increase capacitance.
- **Test that proves it works:** Ripple matches I/(2 f C) estimate.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l12 · The BJT as a switch

**Goal:** Drive a relay or LED strip from a microcontroller pin.

- **Derive by hand:** Ic = beta Ib in active region; saturation design with overdrive factor.
- **Code from scratch (Python):** Compute base resistor for a 500 mA load and simulate.
- **Interactive lab / visual:** Transistor glowing between cutoff, active and saturation.
- **Test that proves it works:** Vce(sat) below 0.3 V in simulation.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l13 · The MOSFET as a switch

**Goal:** Switch motor current efficiently.

- **Derive by hand:** Rds(on) conduction loss I^2 R; gate charge Qg and switching time t = Qg/Ig.
- **Code from scratch (Python):** Estimate conduction and switching losses for a scooter-sized load.
- **Interactive lab / visual:** Gate voltage plateau animation during turn-on.
- **Test that proves it works:** Loss estimate within 15 percent of the simulation.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)
- **Real-world anchor:** Bali

## p05-l14 · Operational amplifier golden rules

**Goal:** Analyse op-amp circuits in seconds.

- **Derive by hand:** Ideal op-amp with negative feedback: V+ = V-, no input current.
- **Code from scratch (Python):** Derive and simulate a buffer and a summing amplifier.
- **Interactive lab / visual:** Op-amp internal gain slider showing when golden rules fail.
- **Test that proves it works:** Gains match -Rf/Rin within 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l15 · Inverting and non-inverting amplifiers

**Goal:** Scale a sensor signal into an ADC range.

- **Derive by hand:** Gain 1 + Rf/Rg; gain-bandwidth product limits.
- **Code from scratch (Python):** Design an amplifier mapping 0-50 mV to 0-3.3 V.
- **Interactive lab / visual:** Bandwidth shrinks as you raise gain.
- **Test that proves it works:** Meets range spec over a Monte Carlo of 1 percent resistors.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l16 · Instrumentation amplifiers

**Goal:** Read a tiny bridge signal in a noisy machine.

- **Derive by hand:** Three-op-amp INA gain and common-mode rejection ratio.
- **Code from scratch (Python):** Simulate an INA with resistor mismatch and compute CMRR.
- **Interactive lab / visual:** Common-mode noise disappearing at the output.
- **Test that proves it works:** CMRR degrades as predicted by mismatch.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l17 · Active filters: Sallen-Key

**Goal:** Build anti-aliasing filters.

- **Derive by hand:** Derive the Sallen-Key transfer function; set Q and wc.
- **Code from scratch (Python):** Design a 2nd-order Butterworth lowpass at 500 Hz.
- **Interactive lab / visual:** Bode plot updating as you pick capacitor values.
- **Test that proves it works:** Q = 0.707 within 2 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l18 · Comparators and Schmitt triggers

**Goal:** Turn a noisy analog signal into a clean digital edge.

- **Derive by hand:** Hysteresis thresholds from positive feedback divider.
- **Code from scratch (Python):** Simulate noisy input with and without hysteresis.
- **Interactive lab / visual:** Chattering output that calms when hysteresis is added.
- **Test that proves it works:** Number of output edges equals true crossings with hysteresis.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l19 · Linear voltage regulators

**Goal:** Power a sensor cleanly.

- **Derive by hand:** Dropout, PSRR and dissipation P = (Vin - Vout) I.
- **Code from scratch (Python):** Compute regulator temperature rise from thermal resistance.
- **Interactive lab / visual:** Heat map on the regulator as load rises.
- **Test that proves it works:** Junction temperature estimate within datasheet limits.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l20 · Grounding, decoupling and noise

**Goal:** Stop motors from resetting your microcontroller.

- **Derive by hand:** Ground loops, L di/dt bounce; decoupling capacitor impedance.
- **Code from scratch (Python):** Simulate ground bounce with and without decoupling.
- **Interactive lab / visual:** Supply rail spike shrinking with decoupling.
- **Test that proves it works:** Rail droop below 5 percent with designed decoupling.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Electrical engineering I and II (generic) (generic)
- **Real-world anchor:** Switzerland

## p05-l21 · Wheatstone bridges

**Goal:** Measure tiny resistance changes from strain or temperature.

- **Derive by hand:** Derive bridge output for quarter, half and full bridge.
- **Code from scratch (Python):** Compute bridge sensitivity and nonlinearity.
- **Interactive lab / visual:** Bridge with a strain slider and output voltage.
- **Test that proves it works:** Full-bridge output linear within 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l22 · Build a mini SPICE (transient)

**Goal:** Combine MNA, companion models and an integrator.

- **Derive by hand:** Backward Euler companion models for C and L: G_eq = C/h.
- **Code from scratch (Python):** Implement transient analysis for R, C, L, diode netlists.
- **Interactive lab / visual:** Your SPICE and ngspice traces overlaid.
- **Test that proves it works:** Matches ngspice .tran on an RLC and a rectifier.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electrical engineering I and II (generic) (generic)

## p05-l23 · PCB design basics

**Goal:** Turn a schematic into a manufacturable board.

- **Derive by hand:** Trace width from current (IPC-2221 style estimate); return paths.
- **Code from scratch (Python):** Draw a motor driver breakout in KiCad and run DRC.
- **Interactive lab / visual:** 3D board view with current-carrying traces highlighted.
- **Test that proves it works:** KiCad DRC passes with zero errors.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Electrical engineering I and II (generic) (generic)
# Phase 06 · Digital Electronics & Logic

> Bits, gates, flip-flops and state machines, built from transistors upward.

- **Lessons:** 16
- **Maps to:** Digital Design and Computer Architecture (ETH Zurich course title)
- **Main tool:** Icarus Verilog · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p06-l01 · Number systems and two's complement

**Goal:** Read registers and sensor words correctly.

- **Derive by hand:** Positional notation; two's complement negation as invert-plus-one; overflow rules.
- **Code from scratch (Python):** Write encode/decode for signed 8/16/32-bit and detect overflow.
- **Interactive lab / visual:** Bit toggles that show the signed and unsigned value live.
- **Test that proves it works:** Round-trips all 16-bit values; overflow detected on edge cases.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l02 · Fixed-point arithmetic (Q formats)

**Goal:** Do fast maths on MCUs without an FPU.

- **Derive by hand:** Q15 scaling, multiplication with rounding and saturation.
- **Code from scratch (Python):** Implement Q15 add, mul and saturate; compare against floats.
- **Interactive lab / visual:** Error histogram of Q15 versus float multiplies.
- **Test that proves it works:** Max error below 2^-15 with rounding.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l03 · Boolean algebra and Karnaugh maps

**Goal:** Minimise logic for interlocks and decoders.

- **Derive by hand:** De Morgan; K-map grouping for sum-of-products.
- **Code from scratch (Python):** Implement Quine-McCluskey minimisation.
- **Interactive lab / visual:** K-map grid you click to set minterms, groups appear.
- **Test that proves it works:** Minimised expressions match truth tables.
- **Pro / open-source tool it maps to:** Logisim-evolution
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l04 · CMOS gates from transistors

**Goal:** See a gate as two switch networks.

- **Derive by hand:** Pull-up and pull-down duality; static power is near zero.
- **Code from scratch (Python):** Model NAND and NOR as switch graphs and evaluate them.
- **Interactive lab / visual:** Transistor switches lighting as inputs change.
- **Test that proves it works:** Truth tables match for all inputs.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l05 · Combinational building blocks

**Goal:** Build a mux, decoder and adder.

- **Derive by hand:** Ripple-carry adder delay; carry look-ahead derivation.
- **Code from scratch (Python):** Simulate a 4-bit ripple-carry and look-ahead adder at gate level.
- **Interactive lab / visual:** Carry propagating bit by bit with timing.
- **Test that proves it works:** Correct sums for all 256 input pairs.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l06 · Gate-level netlist simulator

**Goal:** Write an event-driven logic simulator.

- **Derive by hand:** Event queues, propagation delay, glitches.
- **Code from scratch (Python):** Implement an event-driven simulator for a netlist of gates.
- **Interactive lab / visual:** Waveform viewer with a visible glitch.
- **Test that proves it works:** Matches Icarus on the adder testbench.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l07 · Latches and flip-flops

**Goal:** Store a bit and understand clocking.

- **Derive by hand:** SR latch feedback; D flip-flop edge triggering.
- **Code from scratch (Python):** Simulate SR latch and D flip-flop in your simulator.
- **Interactive lab / visual:** Clock edges capturing data into a flip-flop.
- **Test that proves it works:** Output changes only on rising edges.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l08 · Finite state machines

**Goal:** Model a ski-lift gate or traffic light controller.

- **Derive by hand:** Moore versus Mealy; state transition tables and encoding.
- **Code from scratch (Python):** Implement a table-driven FSM for a lift-gate sequence with timeouts.
- **Interactive lab / visual:** State diagram highlighting the active state.
- **Test that proves it works:** Exhaustive input sequences never reach an unsafe state.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)
- **Real-world anchor:** Switzerland

## p06-l09 · Counters and quadrature decoding

**Goal:** Count encoder pulses and direction.

- **Derive by hand:** Gray-code style A/B phase states; x4 decoding.
- **Code from scratch (Python):** Implement a 4x quadrature decoder state machine.
- **Interactive lab / visual:** Rotating encoder disk with A/B traces and count.
- **Test that proves it works:** Counts match ground truth through direction reversals.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l10 · Shift registers

**Goal:** Expand outputs and serialise data.

- **Derive by hand:** Serial-in parallel-out timing; LFSR maximal length polynomials.
- **Code from scratch (Python):** Implement a 74HC595-style driver and an LFSR.
- **Interactive lab / visual:** Bits marching across a register.
- **Test that proves it works:** LFSR period equals 2^n - 1.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l11 · Timing, metastability and synchronisers

**Goal:** Cross clock domains safely.

- **Derive by hand:** Setup/hold windows; MTBF of a two-flop synchroniser.
- **Code from scratch (Python):** Simulate metastability probability versus synchroniser depth.
- **Interactive lab / visual:** Unsynchronised signal corrupting a counter.
- **Test that proves it works:** Two-flop synchroniser removes errors in simulation.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l12 · Debouncing

**Goal:** Read buttons and limit switches reliably.

- **Derive by hand:** Bounce as a noisy transient; integrator and timer debouncers.
- **Code from scratch (Python):** Implement counter-based debouncing on recorded bounce data.
- **Interactive lab / visual:** Bouncy contact trace with clean output beneath.
- **Test that proves it works:** Exactly one event per physical press.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l13 · Memory: SRAM, Flash and EEPROM

**Goal:** Choose where to store parameters and logs.

- **Derive by hand:** Endurance, wear levelling and page erase semantics.
- **Code from scratch (Python):** Simulate a wear-levelled parameter store on a flash model.
- **Interactive lab / visual:** Flash pages ageing with a heat map.
- **Test that proves it works:** Parameters survive simulated power loss mid-write.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l14 · ADC architectures: SAR

**Goal:** Understand what happens in an ADC conversion.

- **Derive by hand:** Binary search via a DAC and comparator; quantisation error.
- **Code from scratch (Python):** Implement a SAR ADC model and compute INL/DNL.
- **Interactive lab / visual:** Comparator decisions narrowing onto the input.
- **Test that proves it works:** Codes match ideal quantiser within 0.5 LSB.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l15 · DACs and the R-2R ladder

**Goal:** Generate analog voltages from bits.

- **Derive by hand:** Derive R-2R output by superposition.
- **Code from scratch (Python):** Model R-2R with resistor tolerance and plot DNL.
- **Interactive lab / visual:** Ladder lighting up per bit.
- **Test that proves it works:** Monotonicity holds with 0.1 percent resistors.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Digital Design and Computer Architecture (ETH)

## p06-l16 · Your first HDL design

**Goal:** Blink an LED on an FPGA in Verilog.

- **Derive by hand:** Counter divides clock frequency f_out = f_clk/2^n.
- **Code from scratch (Python):** Write a Verilog blinker with testbench.
- **Interactive lab / visual:** Waveform of the divided clock.
- **Test that proves it works:** Testbench confirms period within one cycle.
- **Pro / open-source tool it maps to:** Icarus Verilog
- **Course mapping:** Digital Design and Computer Architecture (ETH)
# Phase 07 · Sensors & Signal Conditioning

> Turn physics into clean numbers: transduce, condition, sample, calibrate.

- **Lessons:** 18
- **Maps to:** Sensors and measurement (generic) (generic topic, not an exact ETH title)
- **Main tool:** PlatformIO · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p07-l01 · Sensor characteristics

**Goal:** Read a datasheet like an engineer.

- **Derive by hand:** Range, resolution, accuracy, precision, linearity, hysteresis, bandwidth.
- **Code from scratch (Python):** Build a SensorModel class with gain, offset, noise and saturation.
- **Interactive lab / visual:** Target diagram showing accuracy versus precision.
- **Test that proves it works:** Model reproduces datasheet error budget.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l02 · Calibration by least squares

**Goal:** Remove gain and offset errors.

- **Derive by hand:** Two-point and multi-point calibration; residual analysis.
- **Code from scratch (Python):** Calibrate a simulated load cell from reference weights.
- **Interactive lab / visual:** Before/after error plot.
- **Test that proves it works:** Residual error below spec after calibration.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l03 · Potentiometers as position sensors

**Goal:** Measure angle cheaply.

- **Derive by hand:** Divider output; loading error with finite ADC input impedance.
- **Code from scratch (Python):** Compute loading error and fix it with a buffer.
- **Interactive lab / visual:** Pot knob with error curve.
- **Test that proves it works:** Buffered error below 0.1 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l04 · Strain gauges and load cells

**Goal:** Weigh things and measure force.

- **Derive by hand:** Gauge factor GF = (dR/R)/strain; bridge sensitivity.
- **Code from scratch (Python):** Model a load cell bridge plus INA plus ADC chain.
- **Interactive lab / visual:** Beam bending with strain colour map.
- **Test that proves it works:** Recovered weight within 0.5 percent.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l05 · Thermistors and Steinhart-Hart

**Goal:** Measure temperature in a motor or battery.

- **Derive by hand:** Fit 1/T = A + B ln R + C (ln R)^3.
- **Code from scratch (Python):** Fit Steinhart-Hart coefficients from a resistance table.
- **Interactive lab / visual:** Thermistor curve with linearised fit.
- **Test that proves it works:** Error below 0.2 K over 0-80 C.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l06 · RTDs and thermocouples

**Goal:** Measure high temperatures with cold-junction compensation.

- **Derive by hand:** Callendar-Van Dusen; Seebeck voltage and reference junction.
- **Code from scratch (Python):** Implement thermocouple conversion with CJC.
- **Interactive lab / visual:** Two junctions with temperatures and resulting voltage.
- **Test that proves it works:** Matches reference table to 0.5 C.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l07 · Optical encoders

**Goal:** Measure position and speed of motors.

- **Derive by hand:** Counts per rev, x4 decoding; speed by period versus frequency method.
- **Code from scratch (Python):** Estimate speed from simulated encoder edges with both methods.
- **Interactive lab / visual:** Spinning encoder with speed estimates versus truth.
- **Test that proves it works:** Period method wins at low speed, frequency method at high.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l08 · Hall sensors and commutation

**Goal:** Detect rotor position in a BLDC motor.

- **Derive by hand:** Hall voltage V_H = I B/(n q t); six-state sequence.
- **Code from scratch (Python):** Decode Hall states to a commutation step and speed.
- **Interactive lab / visual:** Rotor magnets passing three Hall sensors.
- **Test that proves it works:** Sequence matches rotation direction.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l09 · MEMS accelerometers

**Goal:** Measure tilt and vibration.

- **Derive by hand:** Proof-mass model; tilt from gravity atan2(ay, az).
- **Code from scratch (Python):** Compute tilt from simulated accelerometer with vibration.
- **Interactive lab / visual:** Phone-style tilt with noisy reading.
- **Test that proves it works:** Static tilt error below 1 degree.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l10 · Gyroscopes and bias

**Goal:** Measure rotation rate and understand drift.

- **Derive by hand:** Coriolis principle; integrated bias error grows linearly.
- **Code from scratch (Python):** Integrate a biased gyro and estimate bias at rest.
- **Interactive lab / visual:** Drifting attitude without bias correction.
- **Test that proves it works:** Bias estimate within 5 percent after 10 s rest.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l11 · Magnetometers and hard/soft iron

**Goal:** Get heading near steel and motors.

- **Derive by hand:** Ellipsoid fitting for hard and soft iron.
- **Code from scratch (Python):** Fit an ellipsoid to rotated magnetometer samples.
- **Interactive lab / visual:** Distorted point cloud becoming a sphere.
- **Test that proves it works:** Heading error below 2 degrees after calibration.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l12 · Ultrasonic time-of-flight

**Goal:** Measure distance with sound.

- **Derive by hand:** d = c t/2; temperature dependence of c.
- **Code from scratch (Python):** Simulate echo detection with threshold and cross-correlation.
- **Interactive lab / visual:** Sound wave bouncing off a wall.
- **Test that proves it works:** Distance error below 1 cm with correlation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l13 · Optical ToF and LiDAR

**Goal:** Use light for range and scanning.

- **Derive by hand:** Phase-shift ranging; ambiguity distance c/(2 f).
- **Code from scratch (Python):** Convert raw 2D LiDAR scans into points.
- **Interactive lab / visual:** Rotating scanner building a room outline.
- **Test that proves it works:** Point cloud matches the ground-truth wall.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l14 · Current sensing

**Goal:** Measure motor current for control and protection.

- **Derive by hand:** Shunt drop and power; high-side versus low-side; Hall current sensors.
- **Code from scratch (Python):** Design a shunt plus amplifier for 20 A.
- **Interactive lab / visual:** Current waveform under PWM with sampling instants.
- **Test that proves it works:** Sampling at PWM centre yields average current.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l15 · Pressure and flow sensors

**Goal:** Instrument a pump, e.g. a Bali irrigation line.

- **Derive by hand:** Bernoulli and orifice flow Q = Cd A sqrt(2 dp/rho).
- **Code from scratch (Python):** Estimate flow from differential pressure.
- **Interactive lab / visual:** Water flowing through an orifice with pressure taps.
- **Test that proves it works:** Flow estimate within 5 percent of model.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)
- **Real-world anchor:** Bali

## p07-l16 · Anti-aliasing filter design

**Goal:** Filter before you sample.

- **Derive by hand:** Required attenuation at fs/2 for a given ADC resolution.
- **Code from scratch (Python):** Choose filter order and corner for 1 kHz sampling and 12 bits.
- **Interactive lab / visual:** Spectrum folding with and without the filter.
- **Test that proves it works:** Aliased tone below 1 LSB.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l17 · ADC quantisation and ENOB

**Goal:** Know your real resolution.

- **Derive by hand:** Quantisation noise q^2/12; SNR = 6.02 N + 1.76 dB.
- **Code from scratch (Python):** Compute ENOB from an FFT of a sampled sine.
- **Interactive lab / visual:** Staircase quantisation and error signal.
- **Test that proves it works:** ENOB matches theory for ideal ADC.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)

## p07-l18 · Complementary filter preview

**Goal:** Fuse a gyro and accelerometer simply.

- **Derive by hand:** High-pass the gyro, low-pass the accelerometer, sum is unity.
- **Code from scratch (Python):** Implement a complementary tilt filter.
- **Interactive lab / visual:** Tilt estimate with gyro, accel and fused traces. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Fused estimate beats both sensors on RMS error.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Sensors and measurement (generic) (generic)
# Phase 08 · Signal Processing & Filters

> Design, implement and verify the filters that sit between every sensor and controller.

- **Lessons:** 16
- **Maps to:** Digital signal processing (generic) (generic topic, not an exact ETH title)
- **Main tool:** SciPy signal · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p08-l01 · Discrete-time systems

**Goal:** Think in samples.

- **Derive by hand:** Linearity, time invariance, causality, BIBO stability.
- **Code from scratch (Python):** Test systems for LTI properties numerically.
- **Interactive lab / visual:** Input/output plots with property checks.
- **Test that proves it works:** Detects a nonlinear and a time-varying system.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l02 · Moving-average filters

**Goal:** Smooth with the simplest FIR.

- **Derive by hand:** Frequency response is a Dirichlet kernel; delay (N - 1)/2.
- **Code from scratch (Python):** Implement an O(1) running moving average.
- **Interactive lab / visual:** Noisy signal smoothed versus window size.
- **Test that proves it works:** Output equals convolution with a box kernel.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l03 · First-order IIR filter

**Goal:** Filter with one multiply.

- **Derive by hand:** y = a y + (1 - a) x; derive a from tau and Ts.
- **Code from scratch (Python):** Implement and discretise an RC-equivalent filter.
- **Interactive lab / visual:** Step response with tunable a.
- **Test that proves it works:** Time constant matches design.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l04 · FIR design by windowing

**Goal:** Get linear-phase filters.

- **Derive by hand:** Ideal sinc response truncated and windowed.
- **Code from scratch (Python):** Design lowpass FIRs with Hamming and Kaiser windows.
- **Interactive lab / visual:** Magnitude response as window changes.
- **Test that proves it works:** Stopband attenuation meets spec.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l05 · IIR biquads

**Goal:** Implement second-order sections robustly.

- **Derive by hand:** Direct form I/II transposed; coefficient quantisation sensitivity.
- **Code from scratch (Python):** Implement a biquad cascade.
- **Interactive lab / visual:** Pole-zero plot with response.
- **Test that proves it works:** Matches scipy.signal.sosfilt.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l06 · Butterworth design via bilinear transform

**Goal:** Design filters from analog prototypes.

- **Derive by hand:** Maximally flat prototype; prewarping.
- **Code from scratch (Python):** Implement Butterworth design end to end.
- **Interactive lab / visual:** Order slider with magnitude response.
- **Test that proves it works:** Matches scipy.signal.butter coefficients.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l07 · Phase and group delay

**Goal:** Understand why filters slow your control loop.

- **Derive by hand:** Group delay = -d phase/d w; phase lag at crossover.
- **Code from scratch (Python):** Compute phase lag a filter adds at a control bandwidth.
- **Interactive lab / visual:** Delayed filtered signal following the raw one.
- **Test that proves it works:** Measured delay matches computed group delay.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l08 · Notch filters for vibration

**Goal:** Remove a motor or propeller resonance.

- **Derive by hand:** Notch zeros on unit circle at w0, poles inside at radius r.
- **Code from scratch (Python):** Design a notch for a 120 Hz resonance.
- **Interactive lab / visual:** Vibration peak removed in spectrum.
- **Test that proves it works:** Notch depth > 30 dB at w0.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l09 · Median filters and outlier rejection

**Goal:** Kill spikes from ultrasonic sensors.

- **Derive by hand:** Order statistics; Hampel identifier.
- **Code from scratch (Python):** Implement median and Hampel filters.
- **Interactive lab / visual:** Spiky signal cleaned.
- **Test that proves it works:** Removes injected spikes without lag on steps.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l10 · Power spectral density (Welch)

**Goal:** Measure noise floors properly.

- **Derive by hand:** Periodogram variance; averaging overlapping windows.
- **Code from scratch (Python):** Implement Welch PSD.
- **Interactive lab / visual:** PSD estimate smoothing with averages.
- **Test that proves it works:** Matches scipy.signal.welch.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l11 · Windowing and leakage

**Goal:** Read spectra without artefacts.

- **Derive by hand:** Leakage from non-integer periods; window main lobe versus sidelobes.
- **Code from scratch (Python):** Compare rectangular, Hann and flat-top windows.
- **Interactive lab / visual:** Spectrum peak smearing as frequency shifts.
- **Test that proves it works:** Flat-top amplitude error below 0.1 dB.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l12 · Decimation and interpolation

**Goal:** Change sample rates for logging.

- **Derive by hand:** Downsample after anti-alias filter; polyphase structure.
- **Code from scratch (Python):** Implement decimate-by-M with polyphase FIR.
- **Interactive lab / visual:** Spectrum before and after decimation.
- **Test that proves it works:** No aliasing above spec.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l13 · Fixed-point filters in C

**Goal:** Run filters on an MCU.

- **Derive by hand:** Q15 coefficient scaling, accumulator width, limit cycles.
- **Code from scratch (C):** Write a Q15 biquad in C and compare with float on host.
- **Interactive lab / visual:** Error between fixed and float versions.
- **Test that proves it works:** Error below 1 LSB on test vectors.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l14 · Differentiating noisy signals

**Goal:** Get velocity from position without amplifying noise.

- **Derive by hand:** Differentiator gain grows with frequency; filtered derivative.
- **Code from scratch (Python):** Compare finite difference, filtered derivative and Savitzky-Golay.
- **Interactive lab / visual:** Noise amplification visualised.
- **Test that proves it works:** Filtered derivative RMS error 5x lower.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l15 · Correlation and time-delay estimation

**Goal:** Find delays between signals.

- **Derive by hand:** Cross-correlation peak location; parabolic interpolation.
- **Code from scratch (Python):** Estimate delay between two noisy microphones.
- **Interactive lab / visual:** Correlation peak sliding with delay.
- **Test that proves it works:** Sub-sample accuracy within 0.1 sample.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Digital signal processing (generic) (generic)

## p08-l16 · Vibration diagnostics

**Goal:** Detect a failing bearing in a drive, e.g. a ski-lift gearbox.

- **Derive by hand:** Bearing fault frequencies; envelope spectrum.
- **Code from scratch (Python):** Implement envelope analysis using Hilbert transform.
- **Interactive lab / visual:** Spectrum lines appearing as a defect grows.
- **Test that proves it works:** Detects injected fault frequency.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** Digital signal processing (generic) (generic)
- **Real-world anchor:** Switzerland
# Phase 09 · Actuators: Motors, Drives & Fluid Power

> Model and drive the things that move: DC, stepper, BLDC, solenoids, cylinders and pumps.

- **Lessons:** 20
- **Maps to:** Electric drives (generic) (generic topic, not an exact ETH title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p09-l01 · Electromagnetism for actuators

**Goal:** Derive force and back-EMF from first principles.

- **Derive by hand:** Lorentz force F = B I L; Faraday's law e = -d phi/dt.
- **Code from scratch (Python):** Compute force on a coil in a magnetic gap.
- **Interactive lab / visual:** Coil in a field with force arrows.
- **Test that proves it works:** Force scales linearly with current.
- **Pro / open-source tool it maps to:** FEMM
- **Course mapping:** Electric drives (generic) (generic)

## p09-l02 · The brushed DC motor model

**Goal:** Write the two equations of every DC motor.

- **Derive by hand:** L di/dt = V - R i - k w; J dw/dt = k i - b w - T_load.
- **Code from scratch (Python):** Simulate a DC motor step response.
- **Interactive lab / visual:** Spinning rotor with current and speed traces. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Steady-state speed matches V/k minus load effect.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l03 · Identifying DC motor parameters

**Goal:** Measure R, L, k, J and b on the bench.

- **Derive by hand:** Locked-rotor tests; no-load speed; spin-down for J/b.
- **Code from scratch (Python):** Fit parameters from synthetic test data.
- **Interactive lab / visual:** Fitted versus measured curves.
- **Test that proves it works:** Parameters recovered within 5 percent.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Electric drives (generic) (generic)

## p09-l04 · Torque-speed curves

**Goal:** Pick operating points and avoid stall.

- **Derive by hand:** Linear torque-speed line; peak power at half no-load speed.
- **Code from scratch (Python):** Plot torque-speed and efficiency maps.
- **Interactive lab / visual:** Operating point moving with load.
- **Test that proves it works:** Peak power at half no-load speed.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l05 · Gearboxes and reflected inertia

**Goal:** Match a motor to a load.

- **Derive by hand:** J_reflected = J_load/N^2; optimal gear ratio sqrt(J_load/J_motor).
- **Code from scratch (Python):** Compute optimal ratio for a robot joint.
- **Interactive lab / visual:** Acceleration versus ratio curve.
- **Test that proves it works:** Optimum matches formula.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l06 · H-bridges and PWM

**Goal:** Drive a motor in both directions.

- **Derive by hand:** Average voltage = D Vbus; current ripple ~ V/(L f).
- **Code from scratch (Python):** Simulate an H-bridge with PWM and dead time.
- **Interactive lab / visual:** Four switches lighting in sequence with current arrows.
- **Test that proves it works:** Ripple matches estimate.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electric drives (generic) (generic)

## p09-l07 · Current control loop

**Goal:** Control torque by controlling current.

- **Derive by hand:** Inner PI loop on L/R plant; bandwidth choice.
- **Code from scratch (Python):** Design a current PI by pole-zero cancellation.
- **Interactive lab / visual:** Current tracking a torque command.
- **Test that proves it works:** Bandwidth within 10 percent of design.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l08 · Stepper motors

**Goal:** Position open-loop with steps and microsteps.

- **Derive by hand:** Step angle; holding torque; sinusoidal microstepping currents.
- **Code from scratch (Python):** Generate full, half and microstep current tables.
- **Interactive lab / visual:** Rotor snapping step by step.
- **Test that proves it works:** Microstep current vector magnitude constant.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l09 · Stepper resonance and missed steps

**Goal:** Understand why steppers stall mid-speed.

- **Derive by hand:** Rotor as torsional spring-mass; pull-out torque.
- **Code from scratch (Python):** Simulate missed steps when acceleration is too high.
- **Interactive lab / visual:** Rotor lagging and slipping a step.
- **Test that proves it works:** Detects missed steps when load exceeds pull-out torque.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l10 · BLDC six-step commutation

**Goal:** Spin a brushless motor with Hall feedback.

- **Derive by hand:** Trapezoidal back-EMF; commutation table.
- **Code from scratch (Python):** Implement six-step commutation logic.
- **Interactive lab / visual:** Rotating magnetic field vector stepping around.
- **Test that proves it works:** Correct direction for both rotations.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l11 · Clarke and Park transforms

**Goal:** See three-phase currents as two DC values.

- **Derive by hand:** Derive abc to alpha-beta to dq transforms.
- **Code from scratch (Python):** Implement Clarke, Park and inverses.
- **Interactive lab / visual:** Rotating phasors becoming fixed dq vectors.
- **Test that proves it works:** Round-trip error below 1e-12.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l12 · Field-oriented control

**Goal:** Get smooth torque from a PMSM.

- **Derive by hand:** Torque ~ (3/2) p psi i_q; decoupled dq current loops.
- **Code from scratch (Python):** Simulate FOC of a PMSM with dq PI loops.
- **Interactive lab / visual:** Rotor and stator field vectors at 90 degrees.
- **Test that proves it works:** Torque ripple far below six-step.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Electric drives (generic) (generic)

## p09-l13 · RC servos

**Goal:** Use a hobby servo correctly.

- **Derive by hand:** 50 Hz PWM pulse width to angle; internal P loop.
- **Code from scratch (Python):** Model a servo and its deadband.
- **Interactive lab / visual:** Servo horn following pulse width.
- **Test that proves it works:** Angle within 2 degrees of command.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Electric drives (generic) (generic)

## p09-l14 · Solenoids and relays

**Goal:** Drive linear on/off actuators.

- **Derive by hand:** Force ~ i^2 dL/dx; pull-in versus hold current.
- **Code from scratch (Python):** Simulate a solenoid with peak-and-hold drive.
- **Interactive lab / visual:** Plunger snapping in with current trace.
- **Test that proves it works:** Hold mode cuts power by more than 50 percent.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Electric drives (generic) (generic)

## p09-l15 · Lead screws and linear actuators

**Goal:** Convert rotation to precise linear motion.

- **Derive by hand:** Lead, efficiency and back-driving condition.
- **Code from scratch (Python):** Compute force and back-drivability.
- **Interactive lab / visual:** Nut traversing a screw.
- **Test that proves it works:** Matches efficiency equation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l16 · Pneumatics: cylinders and valves

**Goal:** Model compressible actuators.

- **Derive by hand:** F = p A; orifice flow; air as a spring.
- **Code from scratch (Python):** Simulate a cylinder extending with a valve.
- **Interactive lab / visual:** Piston extending with pressure colour.
- **Test that proves it works:** Extension time matches flow estimate.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** Electric drives (generic) (generic)

## p09-l17 · Hydraulics basics

**Goal:** Lift heavy loads.

- **Derive by hand:** Pascal's law; flow continuity; pressure losses.
- **Code from scratch (Python):** Size a hydraulic cylinder for a lift.
- **Interactive lab / visual:** Pressure distribution in a circuit.
- **Test that proves it works:** Force and speed meet spec.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** Electric drives (generic) (generic)

## p09-l18 · Pumps and pump curves

**Goal:** Drive an irrigation pump efficiently, e.g. in Bali rice terraces.

- **Derive by hand:** Pump curve intersect system curve; affinity laws.
- **Code from scratch (Python):** Find operating point and energy with a VFD.
- **Interactive lab / visual:** Operating point sliding as speed changes.
- **Test that proves it works:** Affinity laws hold in simulation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)
- **Real-world anchor:** Bali

## p09-l19 · Motor thermal model

**Goal:** Avoid cooking windings.

- **Derive by hand:** Two-node thermal RC; I^2 R heating.
- **Code from scratch (Python):** Simulate winding temperature under duty cycle.
- **Interactive lab / visual:** Coil heating and cooling colour.
- **Test that proves it works:** Steady temperature matches thermal resistance.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)

## p09-l20 · Sizing a scooter hub motor

**Goal:** Size a motor for a Bali scooter climb.

- **Derive by hand:** Road load: rolling, aero and grade forces; power = F v.
- **Code from scratch (Python):** Compute torque and power for a given grade and speed.
- **Interactive lab / visual:** Scooter on adjustable slope with power gauge.
- **Test that proves it works:** Requirements consistent with energy per km estimate.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Electric drives (generic) (generic)
- **Real-world anchor:** Bali
# Phase 10 · Embedded Systems & Microcontrollers

> Bare-metal C on a Cortex-M: registers, timers, interrupts, PWM, ADC, DMA.

- **Lessons:** 22
- **Maps to:** Embedded Systems (ETH Zurich course title)
- **Main tool:** PlatformIO · **Default language:** C

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p10-l01 · Microcontroller architecture

**Goal:** Know what is inside a Cortex-M MCU.

- **Derive by hand:** Harvard bus, registers, pipeline; cycles per instruction.
- **Code from scratch (C):** Count cycles of a loop with the DWT cycle counter.
- **Interactive lab / visual:** Block diagram of core, buses and peripherals.
- **Test that proves it works:** Cycle count matches expected instruction count.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l02 · Toolchain: compile, link, flash

**Goal:** Build firmware without an IDE.

- **Derive by hand:** Object files, symbols, sections; ELF to BIN.
- **Code from scratch (C):** Write a Makefile for arm-none-eabi-gcc and flash with OpenOCD.
- **Interactive lab / visual:** Build pipeline animation from .c to flash.
- **Test that proves it works:** make produces a binary that boots in QEMU or on a board.
- **Pro / open-source tool it maps to:** arm-none-eabi-gcc
- **Course mapping:** Embedded Systems (ETH)

## p10-l03 · Memory map and linker scripts

**Goal:** Place code and data correctly.

- **Derive by hand:** .text, .data, .bss, stack and heap layout.
- **Code from scratch (C):** Write a minimal linker script.
- **Interactive lab / visual:** Memory bar showing sections.
- **Test that proves it works:** Map file shows sections at expected addresses.
- **Pro / open-source tool it maps to:** arm-none-eabi-gcc
- **Course mapping:** Embedded Systems (ETH)

## p10-l04 · Startup code and the vector table

**Goal:** Boot an MCU from reset.

- **Derive by hand:** Reset vector, .data copy, .bss zeroing.
- **Code from scratch (C):** Write startup.c from scratch.
- **Interactive lab / visual:** Step through reset to main.
- **Test that proves it works:** Global variables initialised correctly in test.
- **Pro / open-source tool it maps to:** QEMU
- **Course mapping:** Embedded Systems (ETH)

## p10-l05 · GPIO by registers

**Goal:** Blink an LED with no library.

- **Derive by hand:** Memory-mapped registers; read-modify-write.
- **Code from scratch (C):** Toggle a GPIO by writing MODER and ODR.
- **Interactive lab / visual:** LED blinking with register bits shown.
- **Test that proves it works:** Logic analyser shows the expected period.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l06 · Bit manipulation and volatile

**Goal:** Write correct register code.

- **Derive by hand:** Masks, shifts; why volatile matters.
- **Code from scratch (C):** Implement SET_BIT, CLEAR_BIT and field macros with tests.
- **Interactive lab / visual:** Bits flipping in a register view.
- **Test that proves it works:** Host unit tests pass for all field widths.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l07 · Clock tree and PLL

**Goal:** Run the core at the right frequency.

- **Derive by hand:** f_out = f_in N/(M P); flash wait states.
- **Code from scratch (C):** Configure the PLL for a target frequency.
- **Interactive lab / visual:** Clock tree diagram with dividers.
- **Test that proves it works:** Measured SysTick period matches.
- **Pro / open-source tool it maps to:** STM32CubeMX
- **Course mapping:** Embedded Systems (ETH)

## p10-l08 · Timers and counters

**Goal:** Generate precise time bases.

- **Derive by hand:** f_update = f_clk/((PSC + 1)(ARR + 1)).
- **Code from scratch (C):** Configure a timer for a 1 kHz control tick.
- **Interactive lab / visual:** Counter sawtooth with update events.
- **Test that proves it works:** Tick frequency within 0.1 percent.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l09 · Interrupts and the NVIC

**Goal:** Respond to events in microseconds.

- **Derive by hand:** Priority, preemption, latency.
- **Code from scratch (C):** Write a timer ISR that runs the control loop.
- **Interactive lab / visual:** Main loop paused by ISR bars on a timeline.
- **Test that proves it works:** ISR jitter below 1 microsecond on a scope.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l10 · Race conditions and atomics

**Goal:** Share data between ISR and main safely.

- **Derive by hand:** Read-modify-write hazards; critical sections.
- **Code from scratch (C):** Demonstrate a torn 32-bit read and fix it.
- **Interactive lab / visual:** Interleaving timeline showing the race.
- **Test that proves it works:** Stress test finds no corruption after fix.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l11 · PWM generation

**Goal:** Drive motors and LEDs.

- **Derive by hand:** Duty = CCR/(ARR + 1); centre-aligned PWM.
- **Code from scratch (C):** Configure complementary PWM with dead time.
- **Interactive lab / visual:** PWM waveform with dead-time gap.
- **Test that proves it works:** Duty matches command within 1 count.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l12 · Input capture and encoder mode

**Goal:** Measure frequency and position in hardware.

- **Derive by hand:** Captured timestamps to period; hardware quadrature counting.
- **Code from scratch (C):** Configure encoder mode and compute speed.
- **Interactive lab / visual:** Encoder pulses filling a counter.
- **Test that proves it works:** Speed matches reference.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l13 · ADC sampling with DMA

**Goal:** Sample sensors without CPU load.

- **Derive by hand:** Sample time, conversion time and DMA circular buffers.
- **Code from scratch (C):** Sample 4 channels via DMA triggered by a timer.
- **Interactive lab / visual:** Buffer filling in a ring.
- **Test that proves it works:** Sample rate matches timer trigger.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l14 · DAC and waveform generation

**Goal:** Generate analog test signals.

- **Derive by hand:** Lookup tables and phase accumulators (DDS).
- **Code from scratch (C):** Generate a sine with DDS.
- **Interactive lab / visual:** Frequency changes with tuning word.
- **Test that proves it works:** Output frequency within 0.1 percent.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l15 · Watchdogs and brown-out

**Goal:** Recover from hangs and power dips.

- **Derive by hand:** Window watchdog timing.
- **Code from scratch (C):** Implement a watchdog that resets a hung loop.
- **Interactive lab / visual:** Countdown timer with kick events.
- **Test that proves it works:** Injected hang triggers reset.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l16 · Low-power modes

**Goal:** Run a sensor node on a battery.

- **Derive by hand:** Average current = sum duty times current.
- **Code from scratch (C):** Implement sleep-wake on an RTC alarm.
- **Interactive lab / visual:** Current profile over time.
- **Test that proves it works:** Battery-life estimate meets target.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l17 · Fixed-point versus FPU

**Goal:** Choose numerics for a control loop.

- **Derive by hand:** Cycle counts and accuracy trade-offs.
- **Code from scratch (C):** Benchmark Q15 and float PID on target.
- **Interactive lab / visual:** Bar chart of cycles.
- **Test that proves it works:** Both versions agree within tolerance.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l18 · Ring buffers

**Goal:** Pass bytes from ISRs to the main loop.

- **Derive by hand:** Head/tail indices, power-of-two masking.
- **Code from scratch (C):** Implement a lock-free SPSC ring buffer.
- **Interactive lab / visual:** Head and tail chasing on a circle.
- **Test that proves it works:** No lost bytes under stress test.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l19 · Super-loop versus scheduler

**Goal:** Structure firmware sanely.

- **Derive by hand:** Rate groups and loop timing budgets.
- **Code from scratch (C):** Refactor a super-loop into rate groups.
- **Interactive lab / visual:** Timeline of tasks per tick.
- **Test that proves it works:** All tasks meet their periods.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Embedded Systems (ETH)

## p10-l20 · A cooperative scheduler from scratch

**Goal:** Build a tiny time-triggered scheduler.

- **Derive by hand:** Static schedule tables; hyperperiod.
- **Code from scratch (C):** Implement a time-triggered scheduler with overrun detection.
- **Interactive lab / visual:** Gantt chart of tasks.
- **Test that proves it works:** Overrun is detected and logged.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)

## p10-l21 · Debugging with GDB and SWD

**Goal:** Find bugs on real hardware.

- **Derive by hand:** Breakpoints, watchpoints, fault registers.
- **Code from scratch (C):** Decode a HardFault stack frame.
- **Interactive lab / visual:** Fault decoder walking stacked registers.
- **Test that proves it works:** Decoder identifies the faulting PC.
- **Pro / open-source tool it maps to:** OpenOCD
- **Course mapping:** Embedded Systems (ETH)
- **Real-world anchor:** Switzerland

## p10-l22 · Unit testing firmware on the host

**Goal:** Test embedded logic without hardware.

- **Derive by hand:** Hardware abstraction layers and fakes.
- **Code from scratch (C):** Write host tests with Unity and fake registers.
- **Interactive lab / visual:** Test report of passing cases.
- **Test that proves it works:** CI-ready test run passes.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Embedded Systems (ETH)
# Phase 11 · Communication Buses & Protocols

> Get bits between chips and machines reliably: UART, I2C, SPI, CAN and beyond.

- **Lessons:** 14
- **Maps to:** Communication systems (generic) (generic topic, not an exact ETH title)
- **Main tool:** PulseView (sigrok) · **Default language:** C

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p11-l01 · UART framing and baud rates

**Goal:** Talk serial correctly.

- **Derive by hand:** Start, data, parity, stop bits; baud error tolerance.
- **Code from scratch (C):** Implement a bit-banged UART transmitter.
- **Interactive lab / visual:** Logic trace decoding a byte.
- **Test that proves it works:** Decoded bytes match at 115200 baud.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l02 · Bit-banged UART receive

**Goal:** Sample in the middle of bits.

- **Derive by hand:** Oversampling and majority vote.
- **Code from scratch (C):** Implement a UART receiver state machine.
- **Interactive lab / visual:** Sampling points on a noisy trace.
- **Test that proves it works:** Receives with up to 3 percent baud error.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l03 · Checksums and CRC

**Goal:** Detect corrupted packets.

- **Derive by hand:** Polynomial division over GF(2).
- **Code from scratch (Python):** Implement CRC-8 and CRC-16 table-driven.
- **Interactive lab / visual:** Bit errors detected versus checksum type.
- **Test that proves it works:** Matches reference CRC values.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Communication systems (generic) (generic)

## p11-l04 · Packet framing with COBS

**Goal:** Delimit packets on a byte stream.

- **Derive by hand:** Consistent overhead byte stuffing.
- **Code from scratch (C):** Implement COBS encode/decode.
- **Interactive lab / visual:** Bytes stuffed and unstuffed.
- **Test that proves it works:** Round-trip all random payloads.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Communication systems (generic) (generic)

## p11-l05 · RS-485 and Modbus RTU

**Goal:** Talk to industrial drives and sensors.

- **Derive by hand:** Differential signalling; Modbus frame and timing.
- **Code from scratch (Python):** Write a Modbus RTU master for a simulated pump controller.
- **Interactive lab / visual:** Request/response on a bus diagram.
- **Test that proves it works:** Reads registers from simulator correctly.
- **Pro / open-source tool it maps to:** pymodbus
- **Course mapping:** Communication systems (generic) (generic)

## p11-l06 · I2C protocol

**Goal:** Wire many sensors to two pins.

- **Derive by hand:** Open-drain, pull-up sizing t_r = 0.8473 R C; addressing, ACK.
- **Code from scratch (C):** Implement a bit-banged I2C master.
- **Interactive lab / visual:** SDA/SCL traces with start and stop.
- **Test that proves it works:** Talks to a simulated device with ACKs.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l07 · Reading an IMU over I2C

**Goal:** Get real accelerometer data.

- **Derive by hand:** Register maps, burst reads, scaling.
- **Code from scratch (C):** Write an IMU driver with a HAL.
- **Interactive lab / visual:** Live axes from IMU data.
- **Test that proves it works:** Driver passes tests against recorded register dumps.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Communication systems (generic) (generic)

## p11-l08 · SPI modes

**Goal:** Talk fast to ADCs and displays.

- **Derive by hand:** CPOL/CPHA; full duplex shift registers.
- **Code from scratch (C):** Implement SPI mode 0 to 3 bit-bang.
- **Interactive lab / visual:** Clock and data edges per mode.
- **Test that proves it works:** Correct sampling for all modes.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l09 · SPI with DMA

**Goal:** Stream ADC samples at high rates.

- **Derive by hand:** Throughput = f_sck/bits per sample.
- **Code from scratch (C):** Configure SPI DMA reads from an external ADC.
- **Interactive lab / visual:** Throughput gauge.
- **Test that proves it works:** Achieves target sample rate.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Communication systems (generic) (generic)

## p11-l10 · CAN bus physical layer and arbitration

**Goal:** Network motor drives robustly.

- **Derive by hand:** Dominant/recessive bits; bitwise arbitration.
- **Code from scratch (Python):** Simulate arbitration among three nodes.
- **Interactive lab / visual:** Bits on the bus with losing nodes backing off.
- **Test that proves it works:** Lowest ID always wins.
- **Pro / open-source tool it maps to:** python-can
- **Course mapping:** Communication systems (generic) (generic)

## p11-l11 · CAN frames and DBC decoding

**Goal:** Read signals from a vehicle or battery pack network.

- **Derive by hand:** Frame fields, bit stuffing, signal scaling.
- **Code from scratch (Python):** Decode CAN frames from a DBC file.
- **Interactive lab / visual:** Live signals decoded from frames.
- **Test that proves it works:** Decoded values match reference log.
- **Pro / open-source tool it maps to:** cantools
- **Course mapping:** Communication systems (generic) (generic)

## p11-l12 · CANopen and drive profiles

**Goal:** Command servo drives.

- **Derive by hand:** Object dictionary, PDO/SDO; CiA 402 state machine.
- **Code from scratch (Python):** Implement the CiA 402 state machine.
- **Interactive lab / visual:** Drive state diagram.
- **Test that proves it works:** State transitions follow spec.
- **Pro / open-source tool it maps to:** python-can
- **Course mapping:** Communication systems (generic) (generic)

## p11-l13 · Industrial Ethernet and EtherCAT

**Goal:** Know what fast fieldbuses do.

- **Derive by hand:** Processing on the fly; distributed clocks.
- **Code from scratch (Python):** Simulate cycle time for a chain of slaves.
- **Interactive lab / visual:** Frame passing through slaves.
- **Test that proves it works:** Cycle time estimate matches formula.
- **Pro / open-source tool it maps to:** SOEM
- **Course mapping:** Communication systems (generic) (generic)

## p11-l14 · Wireless telemetry: BLE, Wi-Fi and MQTT

**Goal:** Stream robot data to a laptop.

- **Derive by hand:** Throughput, latency and packet loss.
- **Code from scratch (Python):** Publish telemetry to MQTT and plot it.
- **Interactive lab / visual:** Live telemetry dashboard.
- **Test that proves it works:** Latency measured below target.
- **Pro / open-source tool it maps to:** Mosquitto
- **Course mapping:** Communication systems (generic) (generic)
# Phase 12 · System Dynamics & Modelling

> Write the equations of motion for anything with mass, charge, heat or flow.

- **Lessons:** 18
- **Maps to:** System Modeling (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p12-l01 · Lumped-parameter modelling

**Goal:** Decide what to keep and what to ignore.

- **Derive by hand:** Energy storage elements and dissipators; model order.
- **Code from scratch (Python):** Sketch and simulate a lumped model of a coffee machine heater.
- **Interactive lab / visual:** Model complexity slider versus accuracy.
- **Test that proves it works:** Reduced model within 5 percent of full.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** System Modeling (ETH)

## p12-l02 · Translational mechanical systems

**Goal:** Model carts, suspensions and stages.

- **Derive by hand:** Newton's second law with free-body diagrams.
- **Code from scratch (Python):** Simulate a two-mass suspension.
- **Interactive lab / visual:** Quarter-car on a bumpy road.
- **Test that proves it works:** Natural frequencies match eigenvalues.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l03 · Rotational mechanical systems

**Goal:** Model shafts, gears and flywheels.

- **Derive by hand:** J w' = sum of torques; torsional stiffness.
- **Code from scratch (Python):** Simulate a motor-shaft-load with compliance.
- **Interactive lab / visual:** Twisting shaft visual.
- **Test that proves it works:** Resonance appears at predicted frequency.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l04 · Lagrangian mechanics

**Goal:** Derive equations of motion without free-body diagrams.

- **Derive by hand:** L = T - V; Euler-Lagrange equations.
- **Code from scratch (Python):** Derive the double pendulum equations with SymPy.
- **Interactive lab / visual:** Chaotic double pendulum.
- **Test that proves it works:** Energy conserved without damping.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** System Modeling (ETH)

## p12-l05 · Electrical-mechanical analogies

**Goal:** Use one toolkit for all domains.

- **Derive by hand:** Force-voltage and force-current analogies.
- **Code from scratch (Python):** Map a mass-spring to RLC and verify.
- **Interactive lab / visual:** Two systems in lockstep.
- **Test that proves it works:** Responses identical after scaling.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** System Modeling (ETH)

## p12-l06 · Electromechanical coupling

**Goal:** Model a DC motor driving a load end to end.

- **Derive by hand:** Power conservation: k_t = k_e in SI units.
- **Code from scratch (Python):** Build a full motor plus gearbox plus load model.
- **Interactive lab / visual:** Motor driving a flywheel. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Energy balance closes within 1 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l07 · Fluid and thermal systems

**Goal:** Model tanks, pipes and heaters.

- **Derive by hand:** Hydraulic capacitance and resistance; thermal RC.
- **Code from scratch (Python):** Simulate an irrigation tank fill and drain.
- **Interactive lab / visual:** Tank level animation.
- **Test that proves it works:** Steady state matches flow balance.
- **Pro / open-source tool it maps to:** OpenModelica
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Bali

## p12-l08 · Block diagrams and algebra

**Goal:** Reduce interconnected systems.

- **Derive by hand:** Series, parallel, feedback reduction; Mason's rule.
- **Code from scratch (Python):** Implement block diagram reduction.
- **Interactive lab / visual:** Blocks merging step by step.
- **Test that proves it works:** Matches python-control interconnect.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l09 · State-space models

**Goal:** Write any linear model as x' = Ax + Bu.

- **Derive by hand:** Choice of states; transfer function to state space.
- **Code from scratch (Python):** Convert TFs to controllable canonical form.
- **Interactive lab / visual:** State trajectories in 3D.
- **Test that proves it works:** TF from your SS matches original.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l10 · Linearising nonlinear models

**Goal:** Get A, B, C, D at an operating point.

- **Derive by hand:** Jacobians at equilibrium.
- **Code from scratch (Python):** Linearise a nonlinear tank system automatically.
- **Interactive lab / visual:** Nonlinear vs linear overlay.
- **Test that proves it works:** Errors small near operating point.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** System Modeling (ETH)

## p12-l11 · Cart-pole equations of motion

**Goal:** Derive the classic inverted pendulum.

- **Derive by hand:** Lagrangian of cart and pole; coupled nonlinear ODEs.
- **Code from scratch (Python):** Simulate cart-pole with RK4.
- **Interactive lab / visual:** Pendulum falling from near upright. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Energy conserved when frictionless.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** System Modeling (ETH)

## p12-l12 · Self-balancing robot model

**Goal:** Model a two-wheeled balancing robot.

- **Derive by hand:** Wheel and body coupling; motor torque input.
- **Code from scratch (Python):** Derive and simulate the wheeled inverted pendulum.
- **Interactive lab / visual:** Wheeled robot falling with no control. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Linear model unstable with expected pole.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** System Modeling (ETH)

## p12-l13 · Quadrotor rigid-body dynamics

**Goal:** Model a drone.

- **Derive by hand:** Newton-Euler for a rigid body; thrust and torque mixing.
- **Code from scratch (Python):** Simulate a quadrotor in 3D.
- **Interactive lab / visual:** Drone hovering open-loop and drifting. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Hover thrust equals m g.
- **Pro / open-source tool it maps to:** Gazebo
- **Course mapping:** System Modeling (ETH)

## p12-l14 · Train longitudinal dynamics

**Goal:** Model a train on a gradient, inspired by Swiss mountain rail.

- **Derive by hand:** Davis resistance equation; grade force m g sin(theta); traction limit by adhesion.
- **Code from scratch (Python):** Simulate a train climbing a steep grade with adhesion limit.
- **Interactive lab / visual:** Train on a slope with traction and resistance arrows.
- **Test that proves it works:** Wheel slip predicted when demand exceeds adhesion.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Switzerland

## p12-l15 · Oscillators and escapements

**Goal:** Model a mechanical watch balance as a timekeeper.

- **Derive by hand:** Balance wheel as torsional oscillator; isochronism and amplitude.
- **Code from scratch (Python):** Simulate a balance wheel with periodic impulses.
- **Interactive lab / visual:** Balance wheel ticking in 3D.
- **Test that proves it works:** Period nearly independent of amplitude for linear spring.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** System Modeling (ETH)
- **Real-world anchor:** Switzerland

## p12-l16 · Step-response system identification

**Goal:** Fit models to experiments.

- **Derive by hand:** First- and second-order fitting from rise time and overshoot.
- **Code from scratch (Python):** Fit a motor model from a step log.
- **Interactive lab / visual:** Fitted versus measured overlay.
- **Test that proves it works:** Parameters within 5 percent.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** System Modeling (ETH)

## p12-l17 · Frequency-response identification

**Goal:** Measure a Bode plot with a chirp.

- **Derive by hand:** Empirical transfer function estimate H = Syu/Suu.
- **Code from scratch (Python):** Identify a plant from chirp data.
- **Interactive lab / visual:** Measured Bode overlay.
- **Test that proves it works:** Matches true plant within 1 dB in band.
- **Pro / open-source tool it maps to:** SciPy signal
- **Course mapping:** System Modeling (ETH)

## p12-l18 · Model validation

**Goal:** Decide whether a model is good enough.

- **Derive by hand:** Residual whiteness and cross-validation.
- **Code from scratch (Python):** Validate an identified model on new data.
- **Interactive lab / visual:** Residual autocorrelation plot.
- **Test that proves it works:** Residuals pass a whiteness test.
- **Pro / open-source tool it maps to:** SciPy stats
- **Course mapping:** System Modeling (ETH)
# Phase 13 · Classical Control

> PID, root locus, Bode and Nyquist, derived then tuned on real simulations.

- **Lessons:** 20
- **Maps to:** Control Systems I (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p13-l01 · Why feedback works

**Goal:** Reduce sensitivity to unknowns.

- **Derive by hand:** Closed loop GK/(1 + GK); sensitivity to plant change.
- **Code from scratch (Python):** Compare open- and closed-loop response with 30 percent plant error.
- **Interactive lab / visual:** Plant gain slider, open loop drifts and closed loop holds.
- **Test that proves it works:** Closed loop error 10x smaller.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l02 · Open versus closed loop

**Goal:** See disturbance rejection in action.

- **Derive by hand:** Disturbance transfer function 1/(1 + GK).
- **Code from scratch (Python):** Simulate a motor under load step both ways.
- **Interactive lab / visual:** Load torque step with and without feedback. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Speed drop reduced by loop gain.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l03 · Stability and Routh-Hurwitz

**Goal:** Decide stability without computing roots.

- **Derive by hand:** Routh array derivation.
- **Code from scratch (Python):** Implement a Routh table with special cases.
- **Interactive lab / visual:** Gain slider with Routh sign changes.
- **Test that proves it works:** Agrees with root computations.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l04 · Steady-state error and system type

**Goal:** Predict tracking error.

- **Derive by hand:** Error constants Kp, Kv, Ka from final value theorem.
- **Code from scratch (Python):** Compute steady-state errors for step, ramp, parabola.
- **Interactive lab / visual:** Tracking error versus system type.
- **Test that proves it works:** Matches simulation.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l05 · Proportional control

**Goal:** Feel the trade-off of gain.

- **Derive by hand:** Closed-loop poles move with K.
- **Code from scratch (Python):** Tune P control of a motor.
- **Interactive lab / visual:** Overshoot grows with gain.
- **Test that proves it works:** Error equals 1/(1 + Kp) for type 0.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l06 · PI control and integral action

**Goal:** Remove steady-state error.

- **Derive by hand:** Integral adds a pole at origin.
- **Code from scratch (Python):** Add I to a speed controller.
- **Interactive lab / visual:** Error vanishing with integral on. → live lab on the site: `#lab-motor`
- **Test that proves it works:** Zero steady-state error to a step.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l07 · PID control

**Goal:** Derive and tune the full PID.

- **Derive by hand:** u = Kp e + Ki integral e + Kd de/dt; each term's effect on poles.
- **Code from scratch (Python):** Implement continuous PID and tune on cart-pole angle.
- **Interactive lab / visual:** Switch P, I or D off and watch it fall. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Balances for 30 s with tuned gains.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)
- **Real-world anchor:** Switzerland

## p13-l08 · Derivative filtering

**Goal:** Keep D from amplifying noise.

- **Derive by hand:** Kd s/(Tf s + 1); derivative on measurement.
- **Code from scratch (Python):** Compare raw and filtered derivative under sensor noise.
- **Interactive lab / visual:** Noise slider shaking the actuator. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Actuator RMS drops with filter.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l09 · Integrator windup and anti-windup

**Goal:** Handle actuator saturation.

- **Derive by hand:** Back-calculation and clamping schemes.
- **Code from scratch (Python):** Implement both anti-windup schemes.
- **Interactive lab / visual:** Saturated motor with overshoot.
- **Test that proves it works:** Overshoot reduced with anti-windup.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l10 · Ziegler-Nichols and relay autotune

**Goal:** Tune without a model.

- **Derive by hand:** Ultimate gain and period; describing function of a relay.
- **Code from scratch (Python):** Implement relay autotuning.
- **Interactive lab / visual:** Limit cycle under relay.
- **Test that proves it works:** Estimated Ku within 10 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l11 · Root locus

**Goal:** See where poles go as gain rises.

- **Derive by hand:** Angle and magnitude conditions; asymptotes and breakaway.
- **Code from scratch (Python):** Implement root locus by sweeping gain.
- **Interactive lab / visual:** Poles tracing the locus as you drag K.
- **Test that proves it works:** Matches python-control root_locus.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l12 · Lead and lag compensators

**Goal:** Shape the response with poles and zeros.

- **Derive by hand:** Lead adds phase; lag raises low-frequency gain.
- **Code from scratch (Python):** Design a lead compensator for a servo.
- **Interactive lab / visual:** Bode and step updating as you move zero and pole.
- **Test that proves it works:** Meets phase margin spec.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l13 · Bode diagrams

**Goal:** Draw Bode plots by hand and by code.

- **Derive by hand:** Asymptotic construction from factors.
- **Code from scratch (Python):** Compute Bode from TFs.
- **Interactive lab / visual:** Asymptotes versus exact curves.
- **Test that proves it works:** Matches python-control bode.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l14 · The Nyquist criterion

**Goal:** Assess stability from frequency response.

- **Derive by hand:** Argument principle; N = Z - P.
- **Code from scratch (Python):** Plot Nyquist and count encirclements.
- **Interactive lab / visual:** Nyquist contour with critical point.
- **Test that proves it works:** Correctly predicts stability for 10 cases.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l15 · Gain and phase margins

**Goal:** Quantify robustness.

- **Derive by hand:** Definitions from crossover frequencies.
- **Code from scratch (Python):** Compute margins and verify with time-domain instability.
- **Interactive lab / visual:** Margins shrinking with delay.
- **Test that proves it works:** Instability occurs at predicted gain.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l16 · Sensitivity functions

**Goal:** Understand the waterbed.

- **Derive by hand:** S + T = 1; Bode sensitivity integral.
- **Code from scratch (Python):** Plot S and T for several controllers.
- **Interactive lab / visual:** Pushing S down in one band raises it elsewhere.
- **Test that proves it works:** Peak sensitivity linked to margins.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l17 · Time delay and the Smith predictor

**Goal:** Control processes with delay.

- **Derive by hand:** e^(-sT) phase lag; Pade approximation.
- **Code from scratch (Python):** Implement a Smith predictor.
- **Interactive lab / visual:** Delayed process with and without predictor.
- **Test that proves it works:** Predictor recovers delay-free performance with exact model.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l18 · Feedforward control

**Goal:** Use known disturbances and references.

- **Derive by hand:** Inverse plant feedforward; disturbance feedforward.
- **Code from scratch (Python):** Add gravity feedforward to an arm joint.
- **Interactive lab / visual:** Tracking error shrinking with feedforward.
- **Test that proves it works:** Error reduced over 50 percent.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l19 · Cascade control

**Goal:** Nest current, speed and position loops.

- **Derive by hand:** Bandwidth separation of 5 to 10x per loop.
- **Code from scratch (Python):** Design a cascaded servo for a motor.
- **Interactive lab / visual:** Three loops tracking in sequence.
- **Test that proves it works:** Position loop stable with designed bandwidths.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems I (ETH)

## p13-l20 · Discrete PID in C

**Goal:** Ship the controller to an MCU.

- **Derive by hand:** Tustin or backward-Euler PID with filtered derivative.
- **Code from scratch (C):** Write a PID with anti-windup and unit tests.
- **Interactive lab / visual:** Firmware loop timing view.
- **Test that proves it works:** Matches Python reference within 1e-4.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Control Systems I (ETH)
# Phase 14 · Modern Control & Estimation

> State space, LQR, observers and Kalman filters: the core of drones and legged robots.

- **Lessons:** 18
- **Maps to:** Control Systems II (ETH Zurich course title)
- **Main tool:** python-control · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p14-l01 · Matrix exponential and state solutions

**Goal:** Solve x' = Ax exactly.

- **Derive by hand:** x(t) = e^(At) x0 plus convolution with input.
- **Code from scratch (Python):** Compute e^(At) by eigen-decomposition and Pade.
- **Interactive lab / visual:** State trajectory from e^(At).
- **Test that proves it works:** Matches scipy.linalg.expm.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Linear System Theory (ETH)

## p14-l02 · Controllability

**Goal:** Know when inputs can move every state.

- **Derive by hand:** Controllability matrix rank.
- **Code from scratch (Python):** Test controllability of cart-pole and decoupled systems.
- **Interactive lab / visual:** Reachable set visual.
- **Test that proves it works:** Rank tests match theory.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l03 · Observability

**Goal:** Know when outputs reveal every state.

- **Derive by hand:** Observability matrix rank; duality.
- **Code from scratch (Python):** Test which sensors make cart-pole observable.
- **Interactive lab / visual:** Toggle sensors and see observability change.
- **Test that proves it works:** Rank tests match theory.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l04 · Pole placement

**Goal:** Put closed-loop poles where you want.

- **Derive by hand:** Ackermann's formula derivation.
- **Code from scratch (Python):** Implement Ackermann's formula.
- **Interactive lab / visual:** Drag desired poles and watch response.
- **Test that proves it works:** Closed-loop eigenvalues match targets.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)
- **Real-world anchor:** Switzerland

## p14-l05 · LQR from the Riccati equation

**Goal:** Derive optimal state feedback.

- **Derive by hand:** Minimise integral of x'Qx + u'Ru; derive continuous algebraic Riccati equation.
- **Code from scratch (Python):** Derive K = R^-1 B^T P.
- **Interactive lab / visual:** Cost versus Q/R trade-off.
- **Test that proves it works:** K matches python-control lqr.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l06 · Solving the Riccati equation

**Goal:** Compute P numerically yourself.

- **Derive by hand:** Hamiltonian matrix eigenvectors; iterative discrete Riccati.
- **Code from scratch (Python):** Implement Riccati iteration.
- **Interactive lab / visual:** Convergence of P.
- **Test that proves it works:** Matches scipy solve_continuous_are.
- **Pro / open-source tool it maps to:** SciPy
- **Course mapping:** Control Systems II (ETH)

## p14-l07 · LQR on the cart-pole

**Goal:** Balance the pendulum optimally.

- **Derive by hand:** Linear model at upright; weight choice.
- **Code from scratch (Python):** Simulate LQR on the nonlinear cart-pole.
- **Interactive lab / visual:** Compare LQR versus PID recovery. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Stabilises from 15 degrees.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l08 · Integral action in state feedback

**Goal:** Remove steady-state error with LQR.

- **Derive by hand:** Augmented state with integral of error.
- **Code from scratch (Python):** Design LQI for a motor.
- **Interactive lab / visual:** Tracking error vanishing.
- **Test that proves it works:** Zero steady-state error.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l09 · Luenberger observers

**Goal:** Estimate unmeasured states.

- **Derive by hand:** Error dynamics A - LC; dual pole placement.
- **Code from scratch (Python):** Implement an observer for cart-pole velocities.
- **Interactive lab / visual:** True versus estimated states.
- **Test that proves it works:** Estimation error converges.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l10 · The separation principle

**Goal:** Combine observer and controller.

- **Derive by hand:** Block-triangular closed-loop matrix.
- **Code from scratch (Python):** Simulate observer-based control.
- **Interactive lab / visual:** Eigenvalues of combined system.
- **Test that proves it works:** Eigenvalues are union of designs.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Linear System Theory (ETH)

## p14-l11 · Discrete-time LQR

**Goal:** Implement LQR in firmware.

- **Derive by hand:** Discrete Riccati equation.
- **Code from scratch (Python):** Discretise and design DLQR.
- **Interactive lab / visual:** Discrete versus continuous response.
- **Test that proves it works:** Matches python-control dlqr.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Control Systems II (ETH)

## p14-l12 · Kalman filter derivation

**Goal:** Derive the optimal linear estimator.

- **Derive by hand:** Predict and update; minimise trace of posterior covariance.
- **Code from scratch (Python):** Implement a Kalman filter class.
- **Interactive lab / visual:** Covariance ellipses predicting and updating.
- **Test that proves it works:** Errors consistent with covariance (NEES test).
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l13 · Kalman filter tracking

**Goal:** Track position and velocity from noisy positions.

- **Derive by hand:** Constant velocity model.
- **Code from scratch (Python):** Track a scooter from noisy GPS-like fixes.
- **Interactive lab / visual:** Track with uncertainty ellipses.
- **Test that proves it works:** RMS error below raw measurements.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Bali

## p14-l14 · Tuning Q and R

**Goal:** Make the filter trust the right things.

- **Derive by hand:** Innovation statistics; NIS test.
- **Code from scratch (Python):** Tune Q and R from logs.
- **Interactive lab / visual:** Innovation plot with bounds.
- **Test that proves it works:** NIS within chi-square bounds.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l15 · Extended Kalman filter

**Goal:** Estimate nonlinear systems.

- **Derive by hand:** Linearise process and measurement with Jacobians.
- **Code from scratch (Python):** Implement an EKF for a pendulum with angle measurement.
- **Interactive lab / visual:** EKF tracking a swinging pendulum.
- **Test that proves it works:** Converges from wrong initial state.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l16 · Unscented Kalman filter

**Goal:** Handle strong nonlinearities.

- **Derive by hand:** Sigma points and unscented transform.
- **Code from scratch (Python):** Implement UKF and compare to EKF.
- **Interactive lab / visual:** Sigma points flowing through a nonlinearity.
- **Test that proves it works:** UKF beats EKF on strong nonlinearity.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p14-l17 · Attitude estimation: complementary versus Kalman

**Goal:** Pick a filter for an IMU.

- **Derive by hand:** Quaternion EKF; Mahony-style complementary filter.
- **Code from scratch (Python):** Implement both on simulated IMU data.
- **Interactive lab / visual:** Kill the IMU filter and watch attitude drift. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Both track; filter disabled shows drift.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Switzerland

## p14-l18 · Model predictive control

**Goal:** Control with constraints.

- **Derive by hand:** Receding horizon QP formulation.
- **Code from scratch (Python):** Implement unconstrained MPC then add box constraints with a QP.
- **Interactive lab / visual:** Predicted trajectory window sliding.
- **Test that proves it works:** Constraints respected in simulation.
- **Pro / open-source tool it maps to:** CVXPY
- **Course mapping:** Model Predictive Control (ETH)
# Phase 15 · Robot Kinematics & Dynamics

> Frames, Jacobians, inverse kinematics and the dynamics of arms, wheels and legs.

- **Lessons:** 18
- **Maps to:** Robot Dynamics (ETH Zurich course title)
- **Main tool:** Robotics Toolbox for Python · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p15-l01 · Rigid-body configuration

**Goal:** Describe where a robot link is.

- **Derive by hand:** Degrees of freedom, Grubler's formula, configuration space.
- **Code from scratch (Python):** Compute DOF of planar mechanisms.
- **Interactive lab / visual:** Mechanism with DOF counter.
- **Test that proves it works:** Matches known mechanisms.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Robot Dynamics (ETH)

## p15-l02 · Forward kinematics of a planar 2-link arm

**Goal:** Find the tool position from joint angles.

- **Derive by hand:** x = l1 cos q1 + l2 cos(q1 + q2).
- **Code from scratch (Python):** Implement FK and plot the workspace.
- **Interactive lab / visual:** Arm with reachable workspace shaded. → live lab on the site: `#lab-arm`
- **Test that proves it works:** FK matches geometric construction.
- **Pro / open-source tool it maps to:** Robotics Toolbox for Python
- **Course mapping:** Robot Dynamics (ETH)

## p15-l03 · Denavit-Hartenberg parameters

**Goal:** Describe serial chains compactly.

- **Derive by hand:** DH transform derivation.
- **Code from scratch (Python):** Build FK for a 3-DOF arm from a DH table.
- **Interactive lab / visual:** DH frames on a 3D arm.
- **Test that proves it works:** Matches homogeneous transform chain.
- **Pro / open-source tool it maps to:** Robotics Toolbox for Python
- **Course mapping:** Robot Dynamics (ETH)

## p15-l04 · Product of exponentials

**Goal:** Use screw axes instead of DH.

- **Derive by hand:** T = e^[S1]q1 ... M.
- **Code from scratch (Python):** Implement PoE FK.
- **Interactive lab / visual:** Screw axes drawn on joints.
- **Test that proves it works:** Agrees with DH FK.
- **Pro / open-source tool it maps to:** Modern Robotics library
- **Course mapping:** Robot Dynamics (ETH)

## p15-l05 · Forward kinematics of a 6-DOF arm

**Goal:** Model an industrial arm.

- **Derive by hand:** Spherical wrist decomposition.
- **Code from scratch (Python):** FK for a generic 6-DOF arm.
- **Interactive lab / visual:** 3D arm with tool frame.
- **Test that proves it works:** Matches URDF-based FK.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l06 · Analytic inverse kinematics

**Goal:** Solve joint angles in closed form.

- **Derive by hand:** Law of cosines; elbow-up and elbow-down branches.
- **Code from scratch (Python):** Implement analytic IK for 2- and 3-link planar arms.
- **Interactive lab / visual:** Drag target, see both branches. → live lab on the site: `#lab-arm`
- **Test that proves it works:** FK(IK(x)) = x for reachable targets.
- **Pro / open-source tool it maps to:** Robotics Toolbox for Python
- **Course mapping:** Robot Dynamics (ETH)

## p15-l07 · Numerical IK with the Jacobian pseudo-inverse

**Goal:** Solve IK for any chain.

- **Derive by hand:** dq = J^+ dx; Newton iterations.
- **Code from scratch (Python):** Implement iterative IK.
- **Interactive lab / visual:** Arm converging to the cursor. → live lab on the site: `#lab-arm`
- **Test that proves it works:** Converges within 20 iterations for reachable targets.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l08 · Damped least squares and singularities

**Goal:** Survive singular configurations.

- **Derive by hand:** dq = J^T (J J^T + lambda^2 I)^-1 dx.
- **Code from scratch (Python):** Implement DLS and compare near singularities.
- **Interactive lab / visual:** Arm at full stretch with and without damping. → live lab on the site: `#lab-arm`
- **Test that proves it works:** DLS bounded joint speed at singularity.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l09 · Velocity kinematics

**Goal:** Map joint rates to tool velocity.

- **Derive by hand:** Geometric Jacobian columns z_i x (p - p_i).
- **Code from scratch (Python):** Compute the geometric Jacobian.
- **Interactive lab / visual:** Velocity ellipsoid at the tool.
- **Test that proves it works:** Matches numerical differentiation.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l10 · Statics: tau = J^T F

**Goal:** Compute joint torques for a tool force.

- **Derive by hand:** Virtual work principle.
- **Code from scratch (Python):** Compute holding torques for a payload.
- **Interactive lab / visual:** Force arrow at tool with joint torque bars.
- **Test that proves it works:** Matches Newton-Euler at rest.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l11 · Joint limits and redundancy

**Goal:** Use extra DOF for secondary goals.

- **Derive by hand:** Null-space projection (I - J^+ J).
- **Code from scratch (Python):** Implement IK with joint-limit avoidance in null space.
- **Interactive lab / visual:** Toggle joint limits and see unreachable targets. → live lab on the site: `#lab-arm`
- **Test that proves it works:** Joint limits respected while tracking.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l12 · Recursive Newton-Euler dynamics

**Goal:** Compute inverse dynamics fast.

- **Derive by hand:** Forward velocity pass, backward force pass.
- **Code from scratch (Python):** Implement RNEA for a planar arm.
- **Interactive lab / visual:** Force propagation down links.
- **Test that proves it works:** Matches Lagrangian result.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Robot Dynamics (ETH)

## p15-l13 · Lagrangian dynamics of a 2-link arm

**Goal:** Get M(q), C(q, dq) and g(q).

- **Derive by hand:** Kinetic energy of links; Christoffel symbols.
- **Code from scratch (Python):** Derive with SymPy and simulate.
- **Interactive lab / visual:** Arm falling under gravity.
- **Test that proves it works:** Energy conserved without damping.
- **Pro / open-source tool it maps to:** SymPy
- **Course mapping:** Robot Dynamics (ETH)

## p15-l14 · Computed-torque control

**Goal:** Linearise an arm by feedback.

- **Derive by hand:** tau = M(q)(qdd_d + Kd e' + Kp e) + C + g.
- **Code from scratch (Python):** Implement computed torque control.
- **Interactive lab / visual:** Arm tracking a trajectory with error traces.
- **Test that proves it works:** Tracking error decays exponentially.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Robot Dynamics (ETH)

## p15-l15 · Impedance control

**Goal:** Make a robot compliant to touch.

- **Derive by hand:** Desired mass-spring-damper at the tool.
- **Code from scratch (Python):** Implement Cartesian impedance control.
- **Interactive lab / visual:** Pushing the arm and feeling it spring back.
- **Test that proves it works:** Effective stiffness matches design.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Robot Dynamics (ETH)

## p15-l16 · Mobile robot kinematics

**Goal:** Model a differential-drive robot.

- **Derive by hand:** Unicycle model; nonholonomic constraint.
- **Code from scratch (Python):** Simulate a diff-drive robot.
- **Interactive lab / visual:** Robot driving arcs.
- **Test that proves it works:** Odometry matches kinematic integration.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p15-l17 · Legged locomotion basics

**Goal:** Understand quadruped gaits generically, in the style of research quadrupeds.

- **Derive by hand:** Support polygon, centre of mass, gait phases.
- **Code from scratch (Python):** Simulate a quadruped gait pattern kinematically.
- **Interactive lab / visual:** Quadruped stepping with support polygon.
- **Test that proves it works:** CoM stays in support polygon for static gait.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Autonomous Mobile Robots (ETH)
- **Real-world anchor:** Switzerland

## p15-l18 · Floating-base dynamics

**Goal:** Model robots that are not bolted down.

- **Derive by hand:** Floating base coordinates; contact constraints.
- **Code from scratch (Python):** Compute contact forces for a standing quadruped.
- **Interactive lab / visual:** Contact force arrows on feet.
- **Test that proves it works:** Forces balance gravity.
- **Pro / open-source tool it maps to:** Pinocchio
- **Course mapping:** Autonomous Mobile Robots (ETH)
- **Real-world anchor:** Switzerland
# Phase 16 · Motion Planning & Trajectories

> Plan collision-free paths and smooth, feasible trajectories.

- **Lessons:** 14
- **Maps to:** Autonomous Mobile Robots (ETH Zurich course title)
- **Main tool:** OMPL · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p16-l01 · Configuration space

**Goal:** Turn obstacles into C-space regions.

- **Derive by hand:** Minkowski sums; C-obstacles for a 2-link arm.
- **Code from scratch (Python):** Compute a C-space map for a planar arm.
- **Interactive lab / visual:** Workspace and C-space side by side.
- **Test that proves it works:** Collision-free path in C-space is collision-free in workspace.
- **Pro / open-source tool it maps to:** OMPL
- **Course mapping:** Autonomous Mobile Robots (ETH)
- **Real-world anchor:** Switzerland

## p16-l02 · Polynomial trajectories

**Goal:** Move smoothly between points.

- **Derive by hand:** Cubic and quintic boundary-condition solves.
- **Code from scratch (Python):** Implement cubic and quintic trajectories.
- **Interactive lab / visual:** Position, velocity and acceleration plots.
- **Test that proves it works:** Boundary conditions satisfied exactly.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l03 · Trapezoidal velocity profiles

**Goal:** Move motors with acceleration limits.

- **Derive by hand:** Triangular versus trapezoidal profile times.
- **Code from scratch (Python):** Implement a trapezoidal profile generator.
- **Interactive lab / visual:** Profile with limits shaded.
- **Test that proves it works:** Never exceeds limits.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l04 · Jerk-limited S-curves

**Goal:** Reduce vibration in motion.

- **Derive by hand:** Seven-segment S-curve.
- **Code from scratch (Python):** Implement S-curve profiles.
- **Interactive lab / visual:** Vibration of a flexible load with and without S-curve.
- **Test that proves it works:** Residual vibration reduced.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l05 · Splines

**Goal:** Interpolate many waypoints.

- **Derive by hand:** Cubic splines with continuity conditions.
- **Code from scratch (Python):** Implement natural cubic splines.
- **Interactive lab / visual:** Spline through draggable waypoints.
- **Test that proves it works:** C2 continuity verified.
- **Pro / open-source tool it maps to:** SciPy interpolate
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l06 · Graph search: BFS and Dijkstra

**Goal:** Plan on grids.

- **Derive by hand:** Optimality and complexity.
- **Code from scratch (Python):** Implement BFS and Dijkstra on occupancy grids.
- **Interactive lab / visual:** Wavefront spreading over a map.
- **Test that proves it works:** Path cost optimal.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l07 · A* search

**Goal:** Plan faster with a heuristic.

- **Derive by hand:** Admissible heuristic preserves optimality.
- **Code from scratch (Python):** Implement A* and compare expansions.
- **Interactive lab / visual:** Fewer expanded nodes visualised.
- **Test that proves it works:** Same cost as Dijkstra, fewer expansions.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l08 · Potential fields

**Goal:** Navigate reactively.

- **Derive by hand:** Attractive and repulsive potentials; local minima.
- **Code from scratch (Python):** Implement potential-field navigation.
- **Interactive lab / visual:** Robot stuck in a local minimum.
- **Test that proves it works:** Reaches goal in open map; detects minima.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l09 · Probabilistic roadmaps

**Goal:** Plan in high-dimensional spaces.

- **Derive by hand:** Sampling and connection; probabilistic completeness.
- **Code from scratch (Python):** Implement PRM for a 2-link arm.
- **Interactive lab / visual:** Roadmap growing.
- **Test that proves it works:** Finds a path when one exists in tests.
- **Pro / open-source tool it maps to:** OMPL
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l10 · RRT and RRT*

**Goal:** Plan with tree growth.

- **Derive by hand:** Voronoi bias; asymptotic optimality of RRT*.
- **Code from scratch (Python):** Implement RRT and RRT*.
- **Interactive lab / visual:** Tree growing toward goal.
- **Test that proves it works:** RRT* path cost decreases with samples.
- **Pro / open-source tool it maps to:** OMPL
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l11 · Collision checking

**Goal:** Check robot versus obstacles quickly.

- **Derive by hand:** Separating axis theorem; bounding volumes.
- **Code from scratch (Python):** Implement SAT for 2D polygons.
- **Interactive lab / visual:** Shapes turning red on collision.
- **Test that proves it works:** Matches brute-force tests.
- **Pro / open-source tool it maps to:** FCL
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l12 · Trajectory optimisation

**Goal:** Optimise smoothness and obstacle cost.

- **Derive by hand:** Minimum-jerk objective; gradient-based optimisation.
- **Code from scratch (Python):** Implement a simple CHOMP-style optimiser.
- **Interactive lab / visual:** Path bending away from obstacles.
- **Test that proves it works:** Cost decreases and path stays collision-free.
- **Pro / open-source tool it maps to:** SciPy optimize
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l13 · Time-optimal path parameterisation

**Goal:** Move as fast as limits allow.

- **Derive by hand:** Phase plane s, s-dot with velocity and acceleration limits.
- **Code from scratch (Python):** Implement a simple TOPP on a path.
- **Interactive lab / visual:** Phase-plane limit curve.
- **Test that proves it works:** Respects all limits.
- **Pro / open-source tool it maps to:** TOPP-RA
- **Course mapping:** Autonomous Mobile Robots (ETH)

## p16-l14 · Pure pursuit path tracking

**Goal:** Follow a path with a mobile robot.

- **Derive by hand:** Curvature = 2 y/L^2 for lookahead L.
- **Code from scratch (Python):** Implement pure pursuit.
- **Interactive lab / visual:** Robot following a track with lookahead circle.
- **Test that proves it works:** Cross-track error below spec.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Autonomous Mobile Robots (ETH)
# Phase 17 · Computer Vision, Estimation & SLAM

> Cameras, features, localisation and mapping, built from pixels and probabilities.

- **Lessons:** 20
- **Maps to:** Vision and mobile robot estimation (generic) (generic topic, not an exact ETH title)
- **Main tool:** OpenCV · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p17-l01 · Images as arrays

**Goal:** Treat an image as numbers.

- **Derive by hand:** Pixels, channels, colour spaces.
- **Code from scratch (Python):** Load and manipulate images with NumPy only.
- **Interactive lab / visual:** Pixel inspector.
- **Test that proves it works:** Conversions match OpenCV.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l02 · The pinhole camera model

**Goal:** Map 3D points to pixels.

- **Derive by hand:** u = f x/z + cx; intrinsic matrix K.
- **Code from scratch (Python):** Project 3D points to an image.
- **Interactive lab / visual:** 3D scene with camera frustum.
- **Test that proves it works:** Matches cv2.projectPoints.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l03 · Camera calibration

**Goal:** Estimate K from checkerboard images.

- **Derive by hand:** Zhang's homography method.
- **Code from scratch (Python):** Implement calibration from synthetic data.
- **Interactive lab / visual:** Checkerboard views.
- **Test that proves it works:** Recovers intrinsics within 1 percent.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l04 · Lens distortion

**Goal:** Undistort images.

- **Derive by hand:** Radial and tangential models.
- **Code from scratch (Python):** Implement undistortion.
- **Interactive lab / visual:** Warped grid straightening.
- **Test that proves it works:** Matches OpenCV undistortion.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l05 · Convolution and edges

**Goal:** Find edges.

- **Derive by hand:** Sobel kernels; gradient magnitude.
- **Code from scratch (Python):** Implement Sobel and Canny-style non-max suppression.
- **Interactive lab / visual:** Edge map.
- **Test that proves it works:** Matches OpenCV within tolerance.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l06 · Thresholding and blobs

**Goal:** Find coloured objects.

- **Derive by hand:** Otsu's method; connected components.
- **Code from scratch (Python):** Implement Otsu and blob labelling.
- **Interactive lab / visual:** Blobs labelled with centroids.
- **Test that proves it works:** Counts match ground truth.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l07 · Harris corners

**Goal:** Find trackable points.

- **Derive by hand:** Structure tensor eigenvalues.
- **Code from scratch (Python):** Implement Harris detection.
- **Interactive lab / visual:** Corners highlighted.
- **Test that proves it works:** Repeatable under rotation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l08 · Descriptors and matching

**Goal:** Match features between images.

- **Derive by hand:** Binary descriptors and Hamming distance; ratio test.
- **Code from scratch (Python):** Implement BRIEF-like descriptors and matching.
- **Interactive lab / visual:** Matches drawn between frames.
- **Test that proves it works:** Inlier ratio above target.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l09 · Homographies and DLT

**Goal:** Map planes between views.

- **Derive by hand:** Direct linear transform with SVD.
- **Code from scratch (Python):** Implement DLT homography.
- **Interactive lab / visual:** Image warped onto a plane.
- **Test that proves it works:** Reprojection error below 1 px.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l10 · RANSAC

**Goal:** Fit models with outliers.

- **Derive by hand:** Iteration count from inlier ratio.
- **Code from scratch (Python):** Implement RANSAC for homographies.
- **Interactive lab / visual:** Inliers versus outliers coloured.
- **Test that proves it works:** Robust to 50 percent outliers.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l11 · Fiducial markers and PnP

**Goal:** Get pose from a marker.

- **Derive by hand:** Perspective-n-point; iterative refinement.
- **Code from scratch (Python):** Estimate pose from four corners.
- **Interactive lab / visual:** Axes drawn on a marker.
- **Test that proves it works:** Pose error below 1 degree in simulation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l12 · Stereo depth

**Goal:** Get depth from two cameras.

- **Derive by hand:** Disparity z = f B/d.
- **Code from scratch (Python):** Implement block matching.
- **Interactive lab / visual:** Disparity map.
- **Test that proves it works:** Depth error within expectation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l13 · Optical flow

**Goal:** Track motion between frames.

- **Derive by hand:** Lucas-Kanade least squares.
- **Code from scratch (Python):** Implement LK optical flow.
- **Interactive lab / visual:** Flow vectors.
- **Test that proves it works:** Tracks synthetic motion within 0.2 px.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l14 · Odometry and dead reckoning

**Goal:** Integrate wheel and IMU motion.

- **Derive by hand:** Error growth over distance.
- **Code from scratch (Python):** Implement odometry with drift analysis.
- **Interactive lab / visual:** Drifting path versus truth.
- **Test that proves it works:** Drift matches error model.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l15 · Particle filter localisation

**Goal:** Localise on a known map.

- **Derive by hand:** Monte Carlo localisation.
- **Code from scratch (Python):** Implement MCL with a laser model.
- **Interactive lab / visual:** Particles converging on a map.
- **Test that proves it works:** Converges from global uncertainty.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Recursive Estimation (ETH)

## p17-l16 · EKF localisation with landmarks

**Goal:** Localise with known landmarks.

- **Derive by hand:** Range-bearing measurement Jacobians.
- **Code from scratch (Python):** Implement EKF localisation.
- **Interactive lab / visual:** Ellipse following robot.
- **Test that proves it works:** Consistent NEES.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p17-l17 · Occupancy grid mapping

**Goal:** Build a map from range scans.

- **Derive by hand:** Log-odds updates; inverse sensor model.
- **Code from scratch (Python):** Implement occupancy mapping.
- **Interactive lab / visual:** Map filling in.
- **Test that proves it works:** Map matches ground truth above 95 percent.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l18 · Scan matching with ICP

**Goal:** Align two scans.

- **Derive by hand:** Point-to-point ICP via SVD.
- **Code from scratch (Python):** Implement ICP.
- **Interactive lab / visual:** Scans snapping together.
- **Test that proves it works:** Converges for small initial errors.
- **Pro / open-source tool it maps to:** Open3D
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l19 · EKF-SLAM

**Goal:** Map and localise together.

- **Derive by hand:** Joint state of robot and landmarks; correlations.
- **Code from scratch (Python):** Implement EKF-SLAM in 2D.
- **Interactive lab / visual:** Landmark ellipses shrinking on loop closure.
- **Test that proves it works:** Consistent estimates.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p17-l20 · Pose-graph optimisation

**Goal:** Fix drift with loop closures.

- **Derive by hand:** Nonlinear least squares on SE(2).
- **Code from scratch (Python):** Implement Gauss-Newton pose graph.
- **Interactive lab / visual:** Graph snapping into shape.
- **Test that proves it works:** Error reduced after optimisation.
- **Pro / open-source tool it maps to:** GTSAM
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)
# Phase 18 · Real-Time Software & ROS 2

> Deadlines, schedulers and the ROS 2 graph that ties a robot together.

- **Lessons:** 17
- **Maps to:** Real-time systems (generic) (generic topic, not an exact ETH title)
- **Main tool:** ROS 2 · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p18-l01 · Real-time concepts

**Goal:** Define deadlines, jitter and WCET.

- **Derive by hand:** Hard, firm and soft deadlines.
- **Code from scratch (Python):** Measure loop timing on Linux.
- **Interactive lab / visual:** Timing histogram.
- **Test that proves it works:** Statistics computed correctly.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l02 · Rate-monotonic scheduling

**Goal:** Prove a task set is schedulable.

- **Derive by hand:** Liu-Layland bound n(2^(1/n) - 1); response-time analysis.
- **Code from scratch (Python):** Implement response-time analysis.
- **Interactive lab / visual:** Gantt chart with deadlines.
- **Test that proves it works:** Matches simulation.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l03 · RTOS tasks

**Goal:** Run tasks with FreeRTOS.

- **Derive by hand:** Preemptive priority scheduling.
- **Code from scratch (C):** Create tasks for sensing, control and logging.
- **Interactive lab / visual:** Task timeline.
- **Test that proves it works:** Control task meets period.
- **Pro / open-source tool it maps to:** FreeRTOS
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l04 · Queues, mutexes and priority inversion

**Goal:** Avoid classic concurrency failures.

- **Derive by hand:** Priority inheritance protocol.
- **Code from scratch (C):** Reproduce and fix priority inversion.
- **Interactive lab / visual:** Inversion timeline.
- **Test that proves it works:** High priority latency bounded after fix.
- **Pro / open-source tool it maps to:** FreeRTOS
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l05 · Linux real-time with PREEMPT_RT

**Goal:** Run control loops on Linux.

- **Derive by hand:** Latency sources; cyclictest.
- **Code from scratch (Python):** Measure jitter with and without RT settings.
- **Interactive lab / visual:** Jitter histogram comparison.
- **Test that proves it works:** Max latency reduced.
- **Pro / open-source tool it maps to:** cyclictest
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l06 · Lock-free communication between threads

**Goal:** Pass data without blocking.

- **Derive by hand:** Memory ordering and atomics.
- **Code from scratch (Python):** Implement a triple buffer.
- **Interactive lab / visual:** Writer and reader timelines.
- **Test that proves it works:** No torn reads in stress test.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l07 · ROS 2 architecture and DDS

**Goal:** Understand the ROS 2 graph.

- **Derive by hand:** Publish-subscribe, QoS policies.
- **Code from scratch (Python):** Inspect a running graph.
- **Interactive lab / visual:** Node graph.
- **Test that proves it works:** Correct topics listed.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l08 · Nodes, topics, services and actions

**Goal:** Pick the right interface.

- **Derive by hand:** Synchronous versus asynchronous semantics.
- **Code from scratch (Python):** Write one of each in rclpy.
- **Interactive lab / visual:** Message flow animation.
- **Test that proves it works:** Integration test passes.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l09 · Publisher and subscriber

**Goal:** Stream sensor data.

- **Derive by hand:** Message rates and QoS.
- **Code from scratch (Python):** Publish IMU data and subscribe.
- **Interactive lab / visual:** Live plot.
- **Test that proves it works:** Received rate within 1 percent.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l10 · Custom interfaces

**Goal:** Define your own messages.

- **Derive by hand:** Message definition language.
- **Code from scratch (Python):** Create a custom message package.
- **Interactive lab / visual:** Message fields.
- **Test that proves it works:** Builds and round-trips.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l11 · TF2 transforms

**Goal:** Track frames over time.

- **Derive by hand:** Transform tree and interpolation.
- **Code from scratch (Python):** Broadcast and look up transforms.
- **Interactive lab / visual:** Frame tree in 3D.
- **Test that proves it works:** Lookups match computed transforms.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l12 · URDF robot description

**Goal:** Describe a robot for tools.

- **Derive by hand:** Links, joints, inertias.
- **Code from scratch (Python):** Write a URDF for a 3-DOF arm.
- **Interactive lab / visual:** Robot in a viewer.
- **Test that proves it works:** check_urdf passes.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l13 · Launch files and parameters

**Goal:** Start systems reproducibly.

- **Derive by hand:** Parameter scoping.
- **Code from scratch (Python):** Write a launch file for the arm stack.
- **Interactive lab / visual:** Launch tree.
- **Test that proves it works:** System starts with correct parameters.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l14 · ros2_control and hardware interfaces

**Goal:** Connect controllers to hardware.

- **Derive by hand:** Controller manager lifecycle.
- **Code from scratch (Python):** Write a mock hardware interface.
- **Interactive lab / visual:** Controller states.
- **Test that proves it works:** Joint trajectory controller runs on mock hardware.
- **Pro / open-source tool it maps to:** ros2_control
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l15 · Simulation in Gazebo and MuJoCo

**Goal:** Test before hardware.

- **Derive by hand:** Physics step, contact models, real-time factor.
- **Code from scratch (Python):** Run the arm in simulation.
- **Interactive lab / visual:** Simulated arm.
- **Test that proves it works:** Matches expected kinematics.
- **Pro / open-source tool it maps to:** Gazebo
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l16 · micro-ROS on a microcontroller

**Goal:** Bring ROS 2 to an MCU.

- **Derive by hand:** Agent-client architecture.
- **Code from scratch (C):** Publish encoder data from an MCU.
- **Interactive lab / visual:** MCU node in the graph.
- **Test that proves it works:** Topic visible at expected rate.
- **Pro / open-source tool it maps to:** micro-ROS
- **Course mapping:** Real-time systems (generic) (generic)

## p18-l17 · Logging and replay with rosbag

**Goal:** Debug with recorded data.

- **Derive by hand:** Deterministic replay.
- **Code from scratch (Python):** Record and replay a session.
- **Interactive lab / visual:** Timeline scrubber.
- **Test that proves it works:** Replay reproduces outputs.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Real-time systems (generic) (generic)
# Phase 19 · Power Electronics, Batteries & Safety

> Convert power efficiently, manage batteries and design machines that fail safe.

- **Lessons:** 22
- **Maps to:** Power Electronics (ETH Zurich course title)
- **Main tool:** ngspice · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p19-l01 · Switching versus linear power

**Goal:** See why switchers dominate.

- **Derive by hand:** Efficiency of linear versus switching conversion.
- **Code from scratch (Python):** Compare losses for a 12 V to 3.3 V conversion.
- **Interactive lab / visual:** Heat comparison.
- **Test that proves it works:** Switcher efficiency above 85 percent in model.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l02 · The buck converter

**Goal:** Derive the buck converter.

- **Derive by hand:** Volt-second balance: Vout = D Vin; ripple equations.
- **Code from scratch (Python):** Simulate an averaged and switched buck.
- **Interactive lab / visual:** Inductor current ripple.
- **Test that proves it works:** Ripple matches formula.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l03 · The boost converter

**Goal:** Step voltage up.

- **Derive by hand:** Vout = Vin/(1 - D).
- **Code from scratch (Python):** Simulate a boost converter.
- **Interactive lab / visual:** Voltage rising with duty.
- **Test that proves it works:** Matches formula in CCM.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l04 · Buck-boost and flyback

**Goal:** Isolate and invert.

- **Derive by hand:** Transformer turns ratio; energy storage in core.
- **Code from scratch (Python):** Simulate a flyback.
- **Interactive lab / visual:** Energy in and out of the core.
- **Test that proves it works:** Output matches ratio formula.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l05 · Converter control

**Goal:** Regulate output voltage.

- **Derive by hand:** Averaged small-signal model; type-II compensator.
- **Code from scratch (Python):** Design voltage-mode control.
- **Interactive lab / visual:** Load step response.
- **Test that proves it works:** Phase margin above 45 degrees.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Power Electronics (ETH)

## p19-l06 · MOSFET losses and thermal design

**Goal:** Keep switches cool.

- **Derive by hand:** Conduction plus switching losses; junction temperature.
- **Code from scratch (Python):** Compute losses and heatsink.
- **Interactive lab / visual:** Thermal network.
- **Test that proves it works:** Junction below limit.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)

## p19-l07 · Gate drivers and bootstrap

**Goal:** Drive high-side MOSFETs.

- **Derive by hand:** Bootstrap capacitor sizing.
- **Code from scratch (Python):** Size a bootstrap circuit.
- **Interactive lab / visual:** Bootstrap charging cycle.
- **Test that proves it works:** Droop within spec.
- **Pro / open-source tool it maps to:** ngspice
- **Course mapping:** Power Electronics (ETH)

## p19-l08 · Three-phase inverters and SVPWM

**Goal:** Drive AC motors.

- **Derive by hand:** Space vector modulation geometry.
- **Code from scratch (Python):** Implement SVPWM.
- **Interactive lab / visual:** Hexagon with reference vector.
- **Test that proves it works:** Phase voltages match reference.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)

## p19-l09 · Regenerative braking

**Goal:** Recover energy, as in Swiss mountain rail and ski lifts.

- **Derive by hand:** Motor as generator; energy recovered = efficiency times potential energy.
- **Code from scratch (Python):** Simulate regen braking on a descent.
- **Interactive lab / visual:** Energy flowing back to the battery.
- **Test that proves it works:** Energy accounting closes.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Power Electronics (ETH)
- **Real-world anchor:** Switzerland

## p19-l10 · Lithium-ion cells

**Goal:** Understand what a cell is.

- **Derive by hand:** OCV curve, capacity, C-rate.
- **Code from scratch (Python):** Model OCV versus SOC.
- **Interactive lab / visual:** Cell with charge level.
- **Test that proves it works:** Model matches example data.
- **Pro / open-source tool it maps to:** PyBaMM
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l11 · Battery equivalent circuit model

**Goal:** Predict terminal voltage.

- **Derive by hand:** Thevenin model with RC pairs.
- **Code from scratch (Python):** Fit an ECM to a pulse test.
- **Interactive lab / visual:** Voltage relaxing after a pulse.
- **Test that proves it works:** Fit error below 10 mV.
- **Pro / open-source tool it maps to:** PyBaMM
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l12 · State of charge estimation

**Goal:** Estimate remaining energy, e.g. in an e-scooter pack.

- **Derive by hand:** Coulomb counting drift; EKF with ECM.
- **Code from scratch (Python):** Implement SOC EKF.
- **Interactive lab / visual:** SOC estimate converging.
- **Test that proves it works:** SOC error below 3 percent.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)
- **Real-world anchor:** Bali

## p19-l13 · Battery management and balancing

**Goal:** Keep packs safe.

- **Derive by hand:** Passive balancing energy dissipation.
- **Code from scratch (Python):** Simulate passive balancing.
- **Interactive lab / visual:** Cells equalising.
- **Test that proves it works:** Cell spread reduced.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l14 · Charging: CC/CV

**Goal:** Charge cells correctly.

- **Derive by hand:** Constant current then constant voltage termination.
- **Code from scratch (Python):** Implement a CC/CV charger state machine.
- **Interactive lab / visual:** Charging curve.
- **Test that proves it works:** Never exceeds limits.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Batteries and energy storage (generic) (generic)

## p19-l15 · EMC basics

**Goal:** Avoid interference problems.

- **Derive by hand:** Loop area, dV/dt and coupling paths.
- **Code from scratch (Python):** Estimate radiated loop emissions qualitatively.
- **Interactive lab / visual:** Field around a current loop.
- **Test that proves it works:** Layout change reduces estimated coupling.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Power Electronics (ETH)

## p19-l16 · Hazard analysis and risk assessment

**Goal:** Identify hazards systematically.

- **Derive by hand:** Severity, exposure and probability; ISO 12100 process.
- **Code from scratch (Python):** Write a hazard log for a robot arm cell.
- **Interactive lab / visual:** Risk matrix.
- **Test that proves it works:** Every hazard has a mitigation.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l17 · Functional safety concepts

**Goal:** Understand safety integrity.

- **Derive by hand:** IEC 61508 and ISO 13849 concepts: SIL, PL, diagnostic coverage.
- **Code from scratch (Python):** Compute a simple PFH for a redundant channel.
- **Interactive lab / visual:** Redundant channels with diagnostics.
- **Test that proves it works:** Calculation consistent with formula.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l18 · Emergency stop and safe torque off

**Goal:** Stop machines safely.

- **Derive by hand:** Stop categories 0, 1 and 2; STO principle.
- **Code from scratch (Python):** Simulate a category-1 stop of a drive.
- **Interactive lab / visual:** Machine decelerating then torque removed.
- **Test that proves it works:** Stop time within spec.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l19 · Watchdogs, plausibility checks and fail-safe states

**Goal:** Detect faults at runtime.

- **Derive by hand:** Range, rate and cross-check monitors.
- **Code from scratch (Python):** Implement plausibility monitors for a sensor pair.
- **Interactive lab / visual:** Fault detection timeline.
- **Test that proves it works:** Detects injected faults within budget.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)
- **Real-world anchor:** Switzerland

## p19-l20 · FMEA

**Goal:** Analyse failure modes.

- **Derive by hand:** RPN = S x O x D and its limits.
- **Code from scratch (Python):** Write an FMEA for a self-balancing robot.
- **Interactive lab / visual:** FMEA table.
- **Test that proves it works:** Highest risks have actions.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l21 · Fault injection testing

**Goal:** Prove your safety logic works.

- **Derive by hand:** Coverage of fault classes.
- **Code from scratch (Python):** Inject faults into the simulation.
- **Interactive lab / visual:** Kill a motor and observe. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Safety reaction triggers each time.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Machine and functional safety (generic) (generic)

## p19-l22 · Electrical safety and isolation

**Goal:** Protect people.

- **Derive by hand:** Creepage, clearance, isolation barriers.
- **Code from scratch (Python):** Check a design against isolation rules.
- **Interactive lab / visual:** Board with isolation gap.
- **Test that proves it works:** Rule checks pass.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Machine and functional safety (generic) (generic)
# Phase 20 · Capstones

> Build complete machines: a self-balancing robot, a quadcopter, a robot arm and two real-world systems.

- **Lessons:** 16
- **Maps to:** Project work (generic) (generic topic, not an exact ETH title)
- **Main tool:** ROS 2 · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p20-l01 · Capstone planning and requirements

**Goal:** Write requirements you can test.

- **Derive by hand:** Requirements as measurable criteria.
- **Code from scratch (Python):** Write a requirements file with tests mapped to each item.
- **Interactive lab / visual:** Requirements traceability graph.
- **Test that proves it works:** Every requirement has a test.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Project work (generic) (generic)

## p20-l02 · Self-balancing robot: modelling

**Goal:** Model your robot.

- **Derive by hand:** Wheeled inverted pendulum with motor model.
- **Code from scratch (Python):** Build the full model.
- **Interactive lab / visual:** Model falling uncontrolled. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Linear model matches nonlinear near upright.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Project work (generic) (generic)

## p20-l03 · Self-balancing robot: electronics

**Goal:** Design the electronics.

- **Derive by hand:** Power budget and IMU placement.
- **Code from scratch (Python):** Draw the schematic in KiCad.
- **Interactive lab / visual:** 3D PCB.
- **Test that proves it works:** ERC passes.
- **Pro / open-source tool it maps to:** KiCad
- **Course mapping:** Project work (generic) (generic)

## p20-l04 · Self-balancing robot: firmware

**Goal:** Write the control firmware.

- **Derive by hand:** Loop timing budget.
- **Code from scratch (C):** Implement sensing, filter and control at 500 Hz.
- **Interactive lab / visual:** Timing view.
- **Test that proves it works:** Loop meets deadline.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Project work (generic) (generic)

## p20-l05 · Self-balancing robot: PID versus LQR

**Goal:** Compare controllers.

- **Derive by hand:** Robustness margins.
- **Code from scratch (Python):** Implement both and compare recovery.
- **Interactive lab / visual:** Kick test. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Both recover; LQR uses less effort.
- **Pro / open-source tool it maps to:** python-control
- **Course mapping:** Project work (generic) (generic)

## p20-l06 · Self-balancing robot: break it

**Goal:** Inject faults.

- **Derive by hand:** Failure modes and detection.
- **Code from scratch (Python):** Inject sensor noise, delay and actuator loss.
- **Interactive lab / visual:** Switch D off, add noise. → live lab on the site: `#lab-pendulum`
- **Test that proves it works:** Each fault is detected or explained.
- **Pro / open-source tool it maps to:** MuJoCo
- **Course mapping:** Project work (generic) (generic)

## p20-l07 · Quadcopter: dynamics and mixer

**Goal:** Model the drone.

- **Derive by hand:** Mixer matrix from thrust to motor commands.
- **Code from scratch (Python):** Implement the mixer and inverse.
- **Interactive lab / visual:** Motors spinning by command. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Mixer inverse correct.
- **Pro / open-source tool it maps to:** Gazebo
- **Course mapping:** Project work (generic) (generic)

## p20-l08 · Quadcopter: attitude estimation

**Goal:** Estimate attitude.

- **Derive by hand:** Complementary filter and EKF.
- **Code from scratch (Python):** Run filters on sim IMU.
- **Interactive lab / visual:** Filter on/off. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Attitude error below 2 degrees.
- **Pro / open-source tool it maps to:** PX4
- **Course mapping:** Project work (generic) (generic)

## p20-l09 · Quadcopter: cascaded control

**Goal:** Control rate and attitude.

- **Derive by hand:** Inner rate loop, outer attitude loop.
- **Code from scratch (Python):** Tune cascaded PID.
- **Interactive lab / visual:** Step response. → live lab on the site: `#lab-quad`
- **Test that proves it works:** Stable with margins.
- **Pro / open-source tool it maps to:** PX4
- **Course mapping:** Project work (generic) (generic)

## p20-l10 · Quadcopter: sim-to-real

**Goal:** Prepare for flight.

- **Derive by hand:** Model mismatch and robustness.
- **Code from scratch (Python):** Run in Gazebo with noise.
- **Interactive lab / visual:** Simulated flight.
- **Test that proves it works:** Passes robustness tests.
- **Pro / open-source tool it maps to:** Gazebo
- **Course mapping:** Project work (generic) (generic)

## p20-l11 · Robot arm: design and URDF

**Goal:** Design a 3-DOF arm.

- **Derive by hand:** Torque requirements from statics.
- **Code from scratch (Python):** Write URDF and size motors.
- **Interactive lab / visual:** Arm in a viewer.
- **Test that proves it works:** Motors meet torque spec.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Project work (generic) (generic)

## p20-l12 · Robot arm: IK and trajectories

**Goal:** Move the arm.

- **Derive by hand:** IK plus quintic trajectories.
- **Code from scratch (Python):** Implement pick-and-place motion.
- **Interactive lab / visual:** Arm picking points. → live lab on the site: `#lab-arm`
- **Test that proves it works:** Reaches targets within 1 mm in sim.
- **Pro / open-source tool it maps to:** MoveIt 2
- **Course mapping:** Project work (generic) (generic)

## p20-l13 · Robot arm: computed torque and ros2_control

**Goal:** Control the arm.

- **Derive by hand:** Computed torque on hardware interface.
- **Code from scratch (Python):** Implement controller in ros2_control.
- **Interactive lab / visual:** Tracking plot.
- **Test that proves it works:** Error below spec.
- **Pro / open-source tool it maps to:** ros2_control
- **Course mapping:** Project work (generic) (generic)

## p20-l14 · Smart irrigation pump controller

**Goal:** Build a pump controller for a Bali-style terrace irrigation tank.

- **Derive by hand:** Level control with pump curves and hysteresis.
- **Code from scratch (Python):** Implement level control with dry-run protection.
- **Interactive lab / visual:** Tank and pump animation.
- **Test that proves it works:** Never runs dry in simulation.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Project work (generic) (generic)
- **Real-world anchor:** Bali

## p20-l15 · Ski-lift-style drive supervisor

**Goal:** Build a safety supervisor for a rope drive (educational).

- **Derive by hand:** Speed monitoring, brakes and stop categories.
- **Code from scratch (Python):** Implement a supervisor with fault states.
- **Interactive lab / visual:** Drive state diagram.
- **Test that proves it works:** All faults lead to safe state.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Project work (generic) (generic)
- **Real-world anchor:** Switzerland

## p20-l16 · Portfolio and demo day

**Goal:** Package your work.

- **Derive by hand:** Communicating results.
- **Code from scratch (Python):** Assemble artifacts and a write-up.
- **Interactive lab / visual:** Portfolio page.
- **Test that proves it works:** Every capstone has artifacts and tests.
- **Pro / open-source tool it maps to:** Git
- **Course mapping:** Project work (generic) (generic)
# Mechatronics from Scratch · Curriculum

20 phases · 352 lessons. Generated from `tools/src/*.txt` by `tools/build_curriculum.py`; `curriculum.json` is the single source the site reads.

| # | Phase | Lessons | Maps to |
|---|---|---|---|
| 01 | [Workbench & Linear Algebra](01-workbench-linear-algebra.md) | 18 | Linear Algebra (ETH) |
| 02 | [Calculus, ODEs & Numerical Integration](02-calculus-odes.md) | 16 | Analysis I and II (ETH) |
| 03 | [Laplace, Fourier & z-Transforms](03-transforms.md) | 14 | Signals and systems (generic) |
| 04 | [Probability & Statistics for Estimation](04-probability.md) | 12 | Probability and Statistics (ETH) |
| 05 | [Circuits & Analog Electronics](05-circuits-analog.md) | 23 | Electrical engineering I and II (generic) |
| 06 | [Digital Electronics & Logic](06-digital-logic.md) | 16 | Digital Design and Computer Architecture (ETH) |
| 07 | [Sensors & Signal Conditioning](07-sensors.md) | 18 | Sensors and measurement (generic) |
| 08 | [Signal Processing & Filters](08-signal-processing.md) | 16 | Digital signal processing (generic) |
| 09 | [Actuators: Motors, Drives & Fluid Power](09-actuators.md) | 20 | Electric drives (generic) |
| 10 | [Embedded Systems & Microcontrollers](10-embedded.md) | 22 | Embedded Systems (ETH) |
| 11 | [Communication Buses & Protocols](11-buses.md) | 14 | Communication systems (generic) |
| 12 | [System Dynamics & Modelling](12-system-dynamics.md) | 18 | System Modeling (ETH) |
| 13 | [Classical Control](13-classical-control.md) | 20 | Control Systems I (ETH) |
| 14 | [Modern Control & Estimation](14-modern-control.md) | 18 | Control Systems II (ETH) |
| 15 | [Robot Kinematics & Dynamics](15-robot-kinematics-dynamics.md) | 18 | Robot Dynamics (ETH) |
| 16 | [Motion Planning & Trajectories](16-motion-planning.md) | 14 | Autonomous Mobile Robots (ETH) |
| 17 | [Computer Vision, Estimation & SLAM](17-vision-slam.md) | 20 | Vision and mobile robot estimation (generic) |
| 18 | [Real-Time Software & ROS 2](18-realtime-ros2.md) | 17 | Real-time systems (generic) |
| 19 | [Power Electronics, Batteries & Safety](19-power-safety.md) | 22 | Power Electronics (ETH) |
| 20 | [Capstones](20-capstones.md) | 16 | Project work (generic) |
