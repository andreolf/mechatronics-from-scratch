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
