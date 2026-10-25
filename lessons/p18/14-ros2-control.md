---
id: p18-l14
minutes: 40
summary: ros2_control separates controllers from hardware so the same controller runs on a simulator, mock hardware or the real arm. You model the managed lifecycle, mock hardware, a controller manager with exclusive command interfaces, a joint state broadcaster and a joint trajectory controller with spline interpolation, and run a trajectory to its goal on mock hardware.
---

## The architecture

**ros2_control** splits a robot's control stack into:

- **Hardware components** (a `SystemInterface` for a whole arm, or actuators and sensors): plugins that export **state interfaces** (`joint1/position`, `joint1/velocity`) and **command interfaces** (`joint1/position`, `joint1/effort`), and implement `read()` and `write()` to the real drivers.
- **Controllers**: plugins that read state interfaces and write command interfaces in `update()`. The `joint_trajectory_controller` (JTC) follows trajectories; `joint_state_broadcaster` publishes `/joint_states` (lesson 12); others are diff drive, forward command and admittance controllers.
- The **controller manager**: loads both from the URDF's `<ros2_control>` tag and a YAML file, and runs **read → update → write** at a fixed rate in a real-time thread (lesson 05).

Each command interface can be claimed by only one active controller at a time, so two controllers can never fight over a joint.

## The lifecycle

Hardware components and controllers are **managed** (lifecycle) objects: `unconfigured` → configure → `inactive` → activate → `active`, back with deactivate and cleanup, and shutdown to `finalized`. Configure allocates and connects; activate starts commanding. A controller can only run `update()` when active, and switching controllers is a deactivate of one and an activate of the other between two cycles.

## Mock hardware

`mock_components/GenericSystem` mirrors commands to states, so you can test the whole stack, launch files, controllers and motion planning, without a robot or a simulator. This lesson's mock adds a 20 ms first-order lag so tracking errors are visible.

:::figure widget=ctrlstates caption="Controller and hardware lifecycle states. Press the transitions and send a trajectory; refused transitions and interface conflicts are shown, and the plot shows the joint following the spline."
:::end

## Worked example

A 3-joint mock system at 100 Hz, with a joint state broadcaster, a JTC and a second position controller:

1. Activating the JTC while unconfigured is refused. After configure, activating the broadcaster and the JTC succeeds; activating the second controller is refused because the `jointN/position` command interfaces are already claimed. It stays inactive.
2. A goal with two waypoints, $(0.5, -0.3, 0.8)$ at 1 s with velocities $(0.4, -0.2, 0)$, and $(1.0, 0.2, 0.4)$ at 2 s at rest, is sampled with cubic Hermite splines.
3. The maximum tracking error during the move is 0.0240 rad (from the lag), the goal is reached within tolerance (result `SUCCESSFUL`), and 300 `/joint_states` messages were published in 3 s.

## Code it from scratch

:::code file=ros2_control_model.py
```python
import numpy as np

TRANSITIONS = {("unconfigured", "configure"): "inactive", ("inactive", "activate"): "active",
               ("active", "deactivate"): "inactive", ("inactive", "cleanup"): "unconfigured",
               ("unconfigured", "shutdown"): "finalized", ("inactive", "shutdown"): "finalized", ("active", "shutdown"): "finalized"}

class Lifecycle:
    """the managed-node state machine that ros2_control uses for hardware components and controllers"""
    def __init__(self, name): self.name, self.state, self.log = name, "unconfigured", []
    def trigger(self, t):
        nxt = TRANSITIONS.get((self.state, t))
        if nxt is None: self.log.append(f"{t} refused in {self.state}"); return False
        ok = getattr(self, "on_" + t, lambda: True)()
        self.log.append(f"{self.state} -{t}-> {nxt if ok else self.state}")
        if ok: self.state = nxt
        return ok

class MockSystem(Lifecycle):
    """like mock_components/GenericSystem: position command interfaces, state interfaces that follow them
    (here through an optional first-order lag, so the controller has something to track)"""
    def __init__(self, joints, lag=0.0):
        super().__init__("mock_hw"); self.joints, self.lag = joints, lag
        self.cmd = {j: 0.0 for j in joints}; self.pos = {j: 0.0 for j in joints}; self.vel = {j: 0.0 for j in joints}
    def read(self, dt): pass
    def write(self, dt):
        for j in self.joints:
            a = 1.0 if self.lag == 0 else min(1.0, dt / self.lag); new = self.pos[j] + a * (self.cmd[j] - self.pos[j])
            self.vel[j] = (new - self.pos[j]) / dt; self.pos[j] = new

class JointStateBroadcaster(Lifecycle):
    claims = ()
    def __init__(self, hw): super().__init__("joint_state_broadcaster"); self.hw, self.msgs = hw, 0
    def update(self, t, dt): self.msgs += 1; self.last = dict(self.hw.pos)      # would publish /joint_states

def hermite(p0, v0, p1, v1, T, s):
    h00, h10, h01, h11 = 2*s**3 - 3*s**2 + 1, s**3 - 2*s**2 + s, -2*s**3 + 3*s**2, s**3 - s**2
    return h00 * p0 + h10 * T * v0 + h01 * p1 + h11 * T * v1

class JointTrajectoryController(Lifecycle):
    """samples a trajectory of waypoints (positions, velocities, time_from_start) with cubic splines every update
    and writes position commands; checks the goal tolerance when the trajectory ends"""
    def __init__(self, hw, joints, name="joint_trajectory_controller", tol=0.01):
        super().__init__(name); self.hw, self.joints, self.tol, self.traj, self.result = hw, joints, tol, None, None
        self.claims = tuple(f"{j}/position" for j in joints)
    def on_activate(self): self.hold = np.array([self.hw.pos[j] for j in self.joints]); return True
    def send_goal(self, t0, points):
        if self.state != "active": return False
        start = (0.0, np.array([self.hw.pos[j] for j in self.joints]), np.zeros(len(self.joints)))
        self.traj, self.t0, self.result = [start] + [(tf, np.array(p), np.array(v)) for tf, p, v in points], t0, None; return True
    def sample(self, t):
        tr = self.traj; t = t - self.t0
        if t >= tr[-1][0]: return tr[-1][1]
        for (ta, pa, va), (tb, pb, vb) in zip(tr, tr[1:]):
            if ta <= t <= tb: return hermite(pa, va, pb, vb, tb - ta, (t - ta) / (tb - ta))
    def update(self, t, dt):
        ref = self.hold if self.traj is None else self.sample(t)
        for j, r in zip(self.joints, ref): self.hw.cmd[j] = float(r)
        if self.traj is not None and self.result is None and t - self.t0 >= self.traj[-1][0] + 0.5:
            err = np.abs(np.array([self.hw.pos[j] for j in self.joints]) - self.traj[-1][1]).max()
            self.result = ("SUCCESSFUL" if err < self.tol else "GOAL_TOLERANCE_VIOLATED", err)

class ControllerManager:
    """owns the hardware and the controllers; runs read -> update -> write at a fixed rate; command interfaces
    are claimed exclusively by active controllers"""
    def __init__(self, hw, rate=100.0): self.hw, self.dt, self.ctrls, self.t, self.events = hw, 1 / rate, {}, 0.0, []
    def load(self, c): self.ctrls[c.name] = c
    def switch(self, activate=(), deactivate=()):
        for n in deactivate: self.ctrls[n].trigger("deactivate")
        claimed = {i for c in self.ctrls.values() if c.state == "active" for i in c.claims}
        for n in activate:
            c = self.ctrls[n]
            if claimed & set(c.claims): self.events.append(f"activate {n} refused: interfaces already claimed"); return False
            if not c.trigger("activate"): self.events.append(f"activate {n} refused: state {c.state}"); return False
            claimed |= set(c.claims)
        return True
    def spin(self, seconds):
        for _ in range(int(round(seconds / self.dt))):
            if self.hw.state == "active":
                self.hw.read(self.dt)
                for c in self.ctrls.values():
                    if c.state == "active": c.update(self.t, self.dt)
                self.hw.write(self.dt)
            self.t = round(self.t + self.dt, 9)

def test_bringup_and_trajectory():
    joints = ["joint1", "joint2", "joint3"]; hw = MockSystem(joints, lag=0.02); cm = ControllerManager(hw)
    hw.trigger("configure"); hw.trigger("activate")
    jsb = JointStateBroadcaster(hw); jtc = JointTrajectoryController(hw, joints); other = JointTrajectoryController(hw, joints, "arm_position_controller")
    for c in (jsb, jtc, other): cm.load(c)
    assert not cm.switch(activate=["joint_trajectory_controller"])           # still unconfigured: refused
    for c in (jsb, jtc, other): c.trigger("configure")
    assert cm.switch(activate=["joint_state_broadcaster", "joint_trajectory_controller"])
    assert not cm.switch(activate=["arm_position_controller"])               # same command interfaces: refused
    print("events:", cm.events)
    print("states:", {c.name: c.state for c in (jsb, jtc, other)})
    goal = [(1.0, [0.5, -0.3, 0.8], [0.4, -0.2, 0.0]), (2.0, [1.0, 0.2, 0.4], [0.0, 0.0, 0.0])]
    assert jtc.send_goal(cm.t, goal); t_start = cm.t
    track = []
    for _ in range(30): cm.spin(0.1); track.append(np.abs(np.array([hw.pos[j] for j in joints]) - jtc.sample(cm.t)).max())
    print(f"max tracking error during the move {max(track):.4f} rad; result {jtc.result[0]}, final error {jtc.result[1]:.1e} rad; "
          f"/joint_states messages {jsb.msgs}")
    assert jtc.result[0] == "SUCCESSFUL" and jsb.msgs == round((cm.t - t_start) / cm.dt)
    print("lifecycle log of the controller:", jtc.log)

test_bringup_and_trajectory()
print("PASS")
```
:::end

The matching controller configuration in a real setup, for reference (not run by this site's checks; needs a ROS 2 install):

```text
controller_manager:
  ros__parameters:
    update_rate: 100
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster
    joint_trajectory_controller:
      type: joint_trajectory_controller/JointTrajectoryController

joint_trajectory_controller:
  ros__parameters:
    joints: [joint1, joint2, joint3]
    command_interfaces: [position]
    state_interfaces: [position, velocity]
    constraints:
      goal_time: 0.5
      joint1: {goal: 0.01}
```

## In practice

`ros2 control list_controllers`, `ros2 control list_hardware_interfaces` and `ros2 control switch_controllers --activate …` inspect and drive the manager, and the `spawner` node loads controllers from a launch file. The URDF's `<ros2_control>` tag names the hardware plugin, `mock_components/GenericSystem` for testing; the `ros2_control_demos` repository has complete examples. MoveIt 2 sends its plans to the JTC's `follow_joint_trajectory` action.

## Exercises

:::exercise
You want to switch from trajectory control to a teleoperation forward-command controller on the same joints. What has to happen in one controller manager cycle?
:::solution
Deactivate the JTC (releasing its command interfaces) and activate the forward-command controller (claiming them), in one `switch_controllers` request, so no cycle runs with both or neither in charge.
:::end

:::exercise
Why test on mock hardware before a simulator?
:::solution
It starts instantly and is deterministic, so it isolates mistakes in the URDF, YAML, launch files and controller wiring from physics problems. Then a simulator (lesson 15) adds dynamics, and finally the real hardware plugin.
:::end

## Quiz

:::quiz
- type: num
  q: Update cycles in 3 s at update_rate 100?
  answer: 300
  tol: 0.001
  py: "3*100"
  explain: One read-update-write per cycle.
- type: num
  q: Controllers that can claim joint2/position at the same time?
  answer: 1
  tol: 0.001
  py: "1"
  explain: Command interfaces are exclusive.
- type: num
  q: Hermite blending weight h01 at the midpoint of a segment?
  answer: 0.5
  tol: 0.001
  py: "-2*0.5**3+3*0.5**2"
  explain: -2s³ + 3s².
- type: num
  q: Lifecycle transitions from unconfigured to active?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Configure, then activate.
- type: mc
  q: A controller writes commands in update() only when it is…
  options:
    - active
    - inactive
    - unconfigured
    - finalized
  answer: 0
  explain: Inactive controllers are loaded but idle.
- type: mc
  q: mock_components/GenericSystem…
  options:
    - mirrors command interfaces to state interfaces
    - simulates full rigid-body physics
    - talks to a real motor driver
    - replaces the controller manager
  answer: 0
  explain: For testing the stack without hardware.
:::end
