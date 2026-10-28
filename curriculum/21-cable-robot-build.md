# Phase 21 · Build-along: a Room-Scale Cable Robot

> Four winches, four lines and a gripper on a pole: derive, simulate and build a cable-driven parallel robot in the spirit of the open-source Stringman.

Optional build-along track: it has its own phase test and certificate, and is not required for the full-course certificate.

- **Lessons:** 11
- **Maps to:** Cable-driven parallel robots (generic) (generic topic, not an exact ETH title)
- **Main tool:** NumPy · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p21-l01 · Cable robots, from RoboCrane to Stringman

**Goal:** Know what a cable-driven parallel robot is and where they have been used.

- **Derive by hand:** Count actuators and degrees of freedom; why four cables can hold a point but not a full pose.
- **Code from scratch (Python):** Model a CDPR as anchors plus a platform point in NumPy and print its parts.
- **Interactive lab / visual:** The cable lab in a 7 x 7 x 3 m room. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Lengths and counts match the geometry.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l02 · Geometry and inverse kinematics

**Goal:** Turn a gripper position into four cable lengths.

- **Derive by hand:** l_i = ‖a_i − p‖, the Jacobian of the lengths, and forward kinematics by Gauss-Newton.
- **Code from scratch (Python):** Implement IK, its Jacobian and an FK solver that inverts it.
- **Interactive lab / visual:** Drag the target and read the lengths. → live lab on the site: `#lab-cable`
- **Test that proves it works:** FK(IK(p)) = p to 1e-9 m; Jacobian matches finite differences.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l03 · Cables only pull: tension distribution

**Goal:** Find non-negative cable tensions that hold the load.

- **Derive by hand:** U t = f with a one-dimensional null space; the feasible interval for λ; minimum-norm choice.
- **Code from scratch (Python):** Write the tension solver and check it against closed-form cases.
- **Interactive lab / visual:** Tensions coloured by load, coral when slack or over the limit. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Equal tensions at the centre; vertical components sum to the weight.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l04 · Workspace and payload capacity

**Goal:** Map where the robot can hold a given payload.

- **Derive by hand:** Capacity m_max = T_max / (g · min_λ max_i τ_i); the wrench-feasible workspace.
- **Code from scratch (Python):** Compute capacity on a grid and the mean over the room.
- **Interactive lab / visual:** Capacity heat map at the pivot height. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Closed form at the centre; capacity falls towards walls and ceiling.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l05 · Motors, spools and encoders

**Goal:** Size the winch: spool, gearing, motor torque and length resolution.

- **Derive by hand:** Line length per revolution with layering, tension from torque, encoder counts per millimetre.
- **Code from scratch (Python):** Model a spool with layers and an encoder, and size a motor for a tension.
- **Interactive lab / visual:** Spool and encoder calculator.
- **Test that proves it works:** Length from counts matches the layered model.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l06 · Calibration: finding the anchors

**Goal:** Recover anchor positions from line-length measurements.

- **Derive by hand:** Nonlinear least squares, Gauss-Newton, observability and why one pose is not enough.
- **Code from scratch (Python):** Estimate four anchors from noisy lengths at known poses.
- **Interactive lab / visual:** Anchor estimate converging from a rough tape-measure guess.
- **Test that proves it works:** Recovered anchors within a few millimetres in simulation.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l07 · Swing and its cancellation

**Goal:** Stop a gripper on a pole from swinging.

- **Derive by hand:** Pendulum on a moving pivot, d'' = −(g/l) d − a; PD on the pivot acceleration; eigenvalues of the coupled loop.
- **Code from scratch (Python):** Simulate the swing with and without damping and check the poles.
- **Interactive lab / visual:** Kick the swing and toggle damping. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Damped swing decays below 1 % in 4 s; undamped keeps ringing.
- **Pro / open-source tool it maps to:** NumPy
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l08 · Safety: a tension limit that lets go

**Goal:** Design a supervisor that relaxes every motor when a line is overloaded.

- **Derive by hand:** Force from a person pushing; tension rise; latching and re-arming logic.
- **Code from scratch (Python):** Write the relax supervisor and test it exhaustively.
- **Interactive lab / visual:** Push the gripper until the lines relax at 28 N. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Every overload ends relaxed; re-arm refuses while the overload persists.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l09 · Electronics and communication

**Goal:** Choose controllers, drivers and the network between them.

- **Derive by hand:** Latency budget: position error v·τ, and the phase lag a delay adds to swing damping.
- **Code from scratch (Python):** Simulate delayed swing damping and find the latency it tolerates.
- **Interactive lab / visual:** Swing damping with a delay slider.
- **Test that proves it works:** Damping still works at 100 ms delay; the margin shrinks as delay grows.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l10 · Software: a Python API and imitation learning

**Goal:** Drive the robot from Python and learn a task from demonstrations.

- **Derive by hand:** Behaviour cloning as supervised regression; covariate shift and why corrections matter.
- **Code from scratch (Python):** Write a small robot API and train a linear policy from demonstrations.
- **Interactive lab / visual:** Behaviour cloning on a top-down pick task.
- **Test that proves it works:** The cloned policy reaches the bin from new starts.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Cable-driven parallel robots (generic) (generic)

## p21-l11 · Build plan and bill of materials

**Goal:** Plan a desk-scale cable robot you can build in a weekend.

- **Derive by hand:** Scale the design: capacity, motor torque and speed at desk size.
- **Code from scratch (Python):** Check a BOM against the requirements and print the build plan.
- **Interactive lab / visual:** The lab in desk-frame mode. → live lab on the site: `#lab-cable`
- **Test that proves it works:** Every requirement is met by the BOM, with margins printed.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Cable-driven parallel robots (generic) (generic)
