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
