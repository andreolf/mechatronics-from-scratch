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
