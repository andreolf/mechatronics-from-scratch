---
id: p18-l13
minutes: 35
summary: A robot starts dozens of nodes, each with its own namespace, parameters and remappings. You model what a ROS 2 launch file does, arguments with defaults and command-line overrides, namespaced groups, conditions, parameter files with wildcards and remaps, and check that every node ends up with the right parameters.
---

## What launch does

`ros2 launch my_robot bringup.launch.py robot:=robot2` runs a **launch description**: a list of actions that declare arguments, start nodes, group them, include other launch files and set conditions. Values such as `LaunchConfiguration('robot')` are **substitutions**, resolved only when the launch runs, after command-line arguments override the declared defaults.

## Namespaces and remapping

`GroupAction([PushRosNamespace('robot1'), …])` puts every node in the group under `/robot1`, so its relative topics (`cmd_vel`) become `/robot1/cmd_vel` (lesson 07). A **remapping** `('cmd_vel', 'base/cmd_vel')` renames one name for one node without touching its code, which is how you wire nodes written by different people together.

## Parameters

Each node declares its parameters and reads them at start-up. Values come from, in order, with later ones winning:

1. the node's declared defaults,
2. each entry of `parameters=[…]` in the launch file, in list order: YAML files and inline dictionaries,
3. inside a YAML file, every section whose node pattern matches the node's fully qualified name, in file order. `/**` matches every node and `*` matches one name.

```text
/**:
  ros__parameters: {use_sim_time: false, rate: 50.0}
/*/driver:
  ros__parameters: {port: /dev/ttyUSB0}
/robot1/controller:
  ros__parameters: {kp: 2.5, rate: 200.0}
```

So for each key, the final value is $v_{i^*}$ from the last source that sets it, $i^* = \max\{i : \text{source } i \text{ sets the key}\}$. Launch passes substituted strings through YAML rules, so `'false'` becomes a boolean.

:::figure widget=launchtree caption="The launch tree of an illustrative bringup. Change the launch arguments; each node shows its resolved name, parameters (with where each value came from) and remappings."
:::end

## Worked example

The default launch of the illustrative description above:

1. Arguments `robot = robot1`, `use_sim_time = false`, `with_logger = true`; groups `/robot1` (driver and controller) and `/tools` (logger).
2. `/robot1/driver` gets `use_sim_time False`, `rate 50.0` from the wildcard and `port /dev/ttyUSB0` from `/*/driver`.
3. `/robot1/controller` gets `rate 200.0` and `kp 2.5` (its own section overrides the wildcard), `use_sim_time False` from the inline dictionary, and its `/robot1/cmd_vel` is remapped to `/robot1/base/cmd_vel`.
4. `/tools/logger` gets `rate 10.0` from its inline dictionary, which comes after the file, and no `port`.
5. With `robot:=robot2 use_sim_time:=true with_logger:=false` only `/robot2/driver` and `/robot2/controller` start, `use_sim_time` is True, and the controller has **no** `kp`: the YAML names `/robot1/controller` explicitly. A classic bug, which the check catches.

## Code it from scratch

:::code file=launch_model.py
```python
import re

PARAMS_YAML = {                                  # what a params.yaml file parses to; applied in file order
    "/**": {"ros__parameters": {"use_sim_time": False, "rate": 50.0}},
    "/*/driver": {"ros__parameters": {"port": "/dev/ttyUSB0"}},
    "/robot1/controller": {"ros__parameters": {"kp": 2.5, "rate": 200.0}},
}

class Arg:
    def __init__(self, name, default): self.name, self.default = name, default
class Sub:                                       # LaunchConfiguration('x'): resolved only when the launch runs
    def __init__(self, name, fmt="{}"): self.name, self.fmt = name, fmt
class Group:                                     # GroupAction([PushRosNamespace(ns), ...]): scoped namespace and arguments
    def __init__(self, ns, children, condition=None): self.ns, self.children, self.condition = ns, children, condition
class NodeDesc:
    def __init__(self, package, executable, name, parameters=(), remappings=(), namespace=None):
        self.package, self.executable, self.name = package, executable, name
        self.parameters, self.remappings, self.namespace = list(parameters), list(remappings), namespace

def sub(v, cfg):
    if isinstance(v, Sub): return v.fmt.format(cfg[v.name])
    if isinstance(v, dict): return {k: sub(x, cfg) for k, x in v.items()}
    if isinstance(v, (list, tuple)): return type(v)(sub(x, cfg) for x in v)
    return v

def typed(v):
    """launch passes substituted strings to parameters through YAML rules: 'true' is a bool, '2.5' a float"""
    if not isinstance(v, str): return v
    if v.lower() in ("true", "false"): return v.lower() == "true"
    try: return int(v)
    except ValueError: pass
    try: return float(v)
    except ValueError: return v

def match(pattern, fqn):
    """ROS 2 parameter-file node patterns: '*' matches one name token, '**' any number of tokens"""
    rx = "^" + re.escape(pattern).replace(r"/\*\*", "(/[^/]+)*").replace(r"\*", "[^/]+") + "$"
    return re.match(rx, fqn) is not None

def launch(description, cli=None):
    """run a launch description: resolve arguments (command line overrides defaults), push namespaces,
    then give each node its parameters (files and dicts in list order, later wins) and remappings"""
    cfg = {a.name: a.default for a in description if isinstance(a, Arg)}; cfg.update(cli or {})
    nodes, tree = [], []
    def walk(items, ns, depth):
        for it in items:
            if isinstance(it, Group):
                if it.condition and str(sub(it.condition, cfg)).lower() != "true":
                    tree.append("  " * depth + f"group {sub(it.ns, cfg)} (skipped: condition false)"); continue
                g = (ns.rstrip("/") + "/" + sub(it.ns, cfg).strip("/")) if it.ns else ns
                tree.append("  " * depth + f"group namespace {g}"); walk(it.children, g, depth + 1)
            elif isinstance(it, NodeDesc):
                nns = sub(it.namespace, cfg) if it.namespace else ns or "/"
                fqn = (nns.rstrip("/") + "/" + it.name)
                params = {}
                for p in it.parameters:
                    if isinstance(p, str) and p == "params.yaml":
                        for pat, body in PARAMS_YAML.items():
                            if match(pat, fqn): params.update(body["ros__parameters"])
                    else: params.update({k: typed(v) for k, v in sub(p, cfg).items()})
                remap = {}
                for a, b in it.remappings:
                    full = lambda n: n if n.startswith("/") else nns.rstrip("/") + "/" + n
                    remap[full(sub(a, cfg))] = full(sub(b, cfg))
                nodes.append({"fqn": fqn, "params": params, "remap": remap})
                tree.append("  " * depth + f"node {it.package}/{it.executable} as {fqn}")
            elif isinstance(it, Arg):
                tree.append("  " * depth + f"arg {it.name} = {cfg[it.name]!r}")
    walk(description, "", 0)
    return {n["fqn"]: n for n in nodes}, tree

def description():
    return [
        Arg("robot", "robot1"), Arg("use_sim_time", "false"), Arg("with_logger", "true"),
        Group(Sub("robot"), [
            NodeDesc("my_robot", "driver", "driver", ["params.yaml"]),
            NodeDesc("my_robot", "controller", "controller", ["params.yaml", {"use_sim_time": Sub("use_sim_time")}],
                     remappings=[("cmd_vel", "base/cmd_vel")]),
        ]),
        Group("tools", [NodeDesc("my_robot", "logger", "logger", ["params.yaml", {"rate": 10.0}])], condition=Sub("with_logger")),
    ]

def test_default_launch():
    nodes, tree = launch(description()); print("\n".join(tree))
    for f, n in nodes.items(): print(f"  {f}: {n['params']}" + (f" remap {n['remap']}" if n["remap"] else ""))
    c = nodes["/robot1/controller"]["params"]
    assert c == {"use_sim_time": False, "rate": 200.0, "kp": 2.5}          # specific file entry beats the wildcard
    assert nodes["/robot1/driver"]["params"]["port"] == "/dev/ttyUSB0" and nodes["/robot1/driver"]["params"]["rate"] == 50.0
    assert nodes["/tools/logger"]["params"] == {"use_sim_time": False, "rate": 10.0}   # the inline dict comes later and wins
    assert "port" not in nodes["/tools/logger"]["params"]                    # /*/driver does not match logger
    assert nodes["/robot1/controller"]["remap"] == {"/robot1/cmd_vel": "/robot1/base/cmd_vel"}

def test_command_line():
    nodes, _ = launch(description(), {"robot": "robot2", "use_sim_time": "true", "with_logger": "false"})
    print("with robot:=robot2 use_sim_time:=true with_logger:=false ->", sorted(nodes))
    assert sorted(nodes) == ["/robot2/controller", "/robot2/driver"]
    assert "kp" not in nodes["/robot2/controller"]["params"]                 # the YAML names robot1 explicitly: a classic bug
    assert nodes["/robot2/controller"]["params"]["use_sim_time"] is True

test_default_launch()
test_command_line()
print("PASS")
```
:::end

The same description as a real launch file, for reference (not run by this site's checks; needs a ROS 2 install):

:::code file=bringup_ref.launch.py lang=python
```text
# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
# bringup.launch.py: the same description as the model above.
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, GroupAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, PushRosNamespace
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    robot = LaunchConfiguration('robot')
    params = PathJoinSubstitution([FindPackageShare('my_robot'), 'config', 'params.yaml'])
    return LaunchDescription([
        DeclareLaunchArgument('robot', default_value='robot1'),
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        DeclareLaunchArgument('with_logger', default_value='true'),
        GroupAction([
            PushRosNamespace(robot),
            Node(package='my_robot', executable='driver', name='driver', parameters=[params]),
            Node(package='my_robot', executable='controller', name='controller',
                 parameters=[params, {'use_sim_time': LaunchConfiguration('use_sim_time')}],
                 remappings=[('cmd_vel', 'base/cmd_vel')]),
        ]),
        GroupAction([
            PushRosNamespace('tools'),
            Node(package='my_robot', executable='logger', name='logger', parameters=[params, {'rate': 10.0}]),
        ], condition=IfCondition(LaunchConfiguration('with_logger'))),
    ])
```
:::end

## In practice

Inspect a running system with `ros2 param list /robot1/controller`, `ros2 param get` and `ros2 param dump`. Use `ros2 launch … --show-args` to list the arguments and `--print` to see the resolved description. Nodes can react to runtime changes with a parameter callback, and declare ranges and read-only flags with parameter descriptors.

## Exercises

:::exercise
How would you make the parameter file work for any robot namespace?
:::solution
Use a pattern instead of the namespace: `/*/controller` or `/**/controller`. Alternatively substitute the namespace into the file name or pass the robot-specific values as an inline dictionary in the launch file.
:::end

:::exercise
A node started with `parameters=[{'rate': 10.0}, params_file]` ignores your `rate: 10.0`. Why?
:::solution
Entries are applied in list order, so the file, which sets `rate` through `/**`, comes later and wins. Put the dictionary after the file.
:::end

## Quiz

:::quiz
- type: num
  q: Nodes started in the default launch of the example?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Driver, controller and logger.
- type: num
  q: Rate the example controller gets (Hz)?
  answer: 200
  tol: 0.001
  py: "200"
  explain: Its own section overrides the wildcard.
- type: num
  q: Rate the example driver gets (Hz)?
  answer: 50
  tol: 0.001
  py: "50"
  explain: Only the wildcard sets it.
- type: num
  q: Nodes started with with_logger:=false?
  answer: 2
  tol: 0.001
  py: "2"
  explain: The tools group is skipped.
- type: mc
  q: In a ROS 2 parameter file, /** matches…
  options:
    - every node in every namespace
    - only nodes in the root namespace
    - only the first node
    - nothing; it is a comment
  answer: 0
  explain: Any number of name tokens.
- type: mc
  q: A remapping cmd_vel to base/cmd_vel in namespace /robot1 renames the topic to…
  options:
    - /robot1/base/cmd_vel
    - /base/cmd_vel
    - /cmd_vel
    - /robot1/cmd_vel/base
  answer: 0
  explain: Relative names resolve in the node's namespace.
:::end
