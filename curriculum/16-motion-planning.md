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
