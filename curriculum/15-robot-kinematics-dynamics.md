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
