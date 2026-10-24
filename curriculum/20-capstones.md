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
