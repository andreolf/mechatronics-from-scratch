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
