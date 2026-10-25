---
id: p18-l08
minutes: 40
summary: Topics stream, services answer and actions carry out long goals with feedback. You build a small executor that runs one of each, the talker-listener, add_two_ints and Fibonacci examples, as an integration test, and reproduce the classic deadlock of calling a service synchronously inside a callback on a single-threaded executor.
---

## Three ways to communicate

- **Topic**: fire and forget, many to many. A publisher does not know who listens. Use for streams: sensor data, state, commands.
- **Service**: one request, one response, from a client to one server. Use for short queries and configuration ("reset odometry", "get the map").
- **Action**: a goal that takes time. The client sends a goal, the server accepts or rejects it, streams **feedback** and finally returns a **result**; the client can **cancel**. Built from services (goal, cancel, result) and topics (feedback, status). Use for "move to this pose", "grasp".

## Executors and callbacks

A node does not run its own loop. Its timers, subscriptions, service handlers and response handlers are **callbacks**, and an **executor** waits for work and runs them. `rclpy.spin(node)` uses a single-threaded executor: one callback at a time. A `MultiThreadedExecutor` runs several at once, limited by **callback groups**: callbacks in a mutually exclusive group never overlap, those in a reentrant group may.

## Sync versus async

`client.call(req)` blocks until the response arrives. But the response is itself delivered by a callback that the executor must run. Called from inside a callback on a single-threaded executor, it waits for work that can only happen after it returns: a **deadlock**. Use `call_async` and a done callback, or put the client in its own callback group on a multi-threaded executor.

:::figure widget=msgflow caption="Messages moving between nodes: a topic stream, a service request and response, and an action's goal, feedback and result. Step through or play, and toggle the synchronous call to see the executor stall."
:::end

## Worked example

The integration test runs in a simulated second of executor time:

1. Topic: the talker publishes on a 0.1 s timer and the listener receives `hello 0` to `hello 4`.
2. Service: `call_async` to `add_two_ints` with $(2, 3)$ completes with 5.
3. Action: the Fibonacci goal of order 5 streams feedback `[0, 1, 1]`, `[0, 1, 1, 2]`, `[0, 1, 1, 2, 3]`, `[0, 1, 1, 2, 3, 5]` and succeeds with `[0, 1, 1, 2, 3, 5]`.
4. A synchronous call inside a timer callback times out on the single-threaded executor and on a two-thread executor when everything shares one callback group; with the service in its own group it returns 5.

## Code it from scratch

:::code file=executor_model.py
```python
from collections import deque

class Future:
    def __init__(self): self.done, self.result, self.cbs = False, None, []
    def set(self, ex, value):
        self.done, self.result = True, value
        for cb in self.cbs: ex.post(cb, self, group=None)

class Executor:
    """a model of rclpy's executors: callbacks wait in a queue; `threads` workers take them, but two callbacks of the same
    mutually exclusive callback group never run at once"""
    def __init__(self, threads=1):
        self.q, self.timers, self.t, self.threads, self.running = deque(), [], 0.0, threads, []
        self.topics, self.services = {}, {}
    def post(self, cb, *args, group="default"): self.q.append((cb, args, group))
    def _runnable(self):
        if len(self.running) >= self.threads: return None                  # every worker is busy
        for i, (cb, args, g) in enumerate(self.q):
            if g is None or g not in self.running: del self.q[i]; return cb, args, g
        return None
    def _run(self, item):
        cb, args, g = item; self.running.append(g); cb(*args); self.running.remove(g)
    def wait_for(self, fut, max_steps=1000):
        """a synchronous wait from inside a callback: other workers may keep executing callbacks meanwhile"""
        for _ in range(max_steps):
            if fut.done: return fut.result
            item = self._runnable()
            if item: self._run(item)
            else: self._tick()
        raise TimeoutError("future never completed: the executor could not run the callback it waits for")
    def _tick(self, dt=0.01):
        self.t = round(self.t + dt, 6)
        for tm in self.timers:
            if self.t + 1e-9 >= tm["next"] and tm["active"]: tm["next"] += tm["period"]; self.post(tm["cb"], group=tm["group"])
    def spin(self, seconds):
        end = self.t + seconds
        while self.t < end - 1e-9:
            item = self._runnable()
            if item: self._run(item)
            else: self._tick()

class Node:
    def __init__(self, ex, name, group="default"): self.ex, self.name, self.group = ex, name, group
    def create_publisher(self, topic):
        return lambda msg: [self.ex.post(cb, msg, group=g) for cb, g in self.ex.topics.get(topic, [])]
    def create_subscription(self, topic, cb, group=None): self.ex.topics.setdefault(topic, []).append((cb, group or self.group))
    def create_timer(self, period, cb, group=None):
        tm = {"period": period, "next": self.ex.t + period, "cb": cb, "group": group or self.group, "active": True}
        self.ex.timers.append(tm); return tm
    def create_service(self, name, cb, group=None): self.ex.services[name] = (cb, group or self.group)
    def call_async(self, name, req):
        fut = Future(); cb, g = self.ex.services[name]
        self.ex.post(lambda: fut.set(self.ex, cb(req)), group=g); return fut
    def call(self, name, req): return self.ex.wait_for(self.call_async(name, req))

class ActionServer:
    """goal -> accepted, periodic feedback, final result; a cancel request stops it early"""
    def __init__(self, node, name, execute_steps, period=0.1):
        self.node, self.steps, self.period = node, execute_steps, period; node.ex.services[name + "/send_goal"] = (self.on_goal, node.group)
    def on_goal(self, req):
        goal, fb_cb, res_fut = req
        gen = self.steps(goal); h = {"cancel": False}
        def step():
            if h["cancel"]: tm["active"] = False; res_fut.set(self.node.ex, ("canceled", None)); return
            try: fb_cb(next(gen))
            except StopIteration as e: tm["active"] = False; res_fut.set(self.node.ex, ("succeeded", e.value))
        tm = self.node.create_timer(self.period, step); return h

def fibonacci(order):
    seq = [0, 1]
    for _ in range(order - 1): seq.append(seq[-1] + seq[-2]); yield list(seq)
    return seq

def integration(threads=1, separate_group=False, sync_in_callback=False):
    ex = Executor(threads); log = {"rx": [], "fb": [], "sum": None, "err": None}
    talker = Node(ex, "talker"); listener = Node(ex, "listener"); server = Node(ex, "adder", "server" if separate_group else "default")
    pub = talker.create_publisher("chatter"); n = [0]
    def tick():
        if n[0] < 5: pub(f"hello {n[0]}"); n[0] += 1
    talker.create_timer(0.1, tick)
    listener.create_subscription("chatter", log["rx"].append)
    server.create_service("add_two_ints", lambda r: r[0] + r[1])
    if sync_in_callback:                                     # a timer callback calls the service synchronously
        def caller():
            try: log["sum"] = listener.call("add_two_ints", (2, 3))
            except TimeoutError as e: log["err"] = str(e)
        tm = listener.create_timer(0.05, lambda: (caller(), tm.update(active=False)))
    else:
        fut = listener.call_async("add_two_ints", (2, 3)); fut.cbs.append(lambda f: log.update(sum=f.result))
    fs = Node(ex, "fib_server"); ActionServer(fs, "fibonacci", fibonacci)
    res = Future(); listener.call_async("fibonacci/send_goal", (5, log["fb"].append, res))
    ex.spin(1.0)
    return log, res

def test_one_of_each():
    log, res = integration()
    print("topic received:", log["rx"])
    print("service (async call) 2 + 3 =", log["sum"])
    print("action feedback:", log["fb"], "result:", res.result)
    assert log["rx"] == [f"hello {i}" for i in range(5)] and log["sum"] == 5
    assert res.result == ("succeeded", [0, 1, 1, 2, 3, 5]) and len(log["fb"]) == 4

def test_sync_call_deadlock():
    log, _ = integration(threads=1, sync_in_callback=True)
    print("single-threaded executor, sync call inside a callback:", log["err"])
    assert log["sum"] is None and log["err"]
    log, _ = integration(threads=2, sync_in_callback=True)
    print("multi-threaded executor, same callback group:", log["err"] or log["sum"])
    assert log["err"]
    log, _ = integration(threads=2, separate_group=True, sync_in_callback=True)
    print("multi-threaded executor, service in its own callback group: 2 + 3 =", log["sum"])
    assert log["sum"] == 5 and log["err"] is None

test_one_of_each()
test_sync_call_deadlock()
print("PASS")
```
:::end

The same ideas in real rclpy, for reference (not run by this site's checks; needs a ROS 2 install):

:::code file=talker_ref.py lang=python
```text
# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.callback_groups import MutuallyExclusiveCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from std_msgs.msg import String
from example_interfaces.srv import AddTwoInts

class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.pub = self.create_publisher(String, 'chatter', 10)
        self.n = 0
        self.create_timer(0.1, self.tick)
        self.cli = self.create_client(AddTwoInts, 'add_two_ints', callback_group=MutuallyExclusiveCallbackGroup())

    def tick(self):
        self.pub.publish(String(data=f'hello {self.n}')); self.n += 1
        fut = self.cli.call_async(AddTwoInts.Request(a=2, b=3))     # never block inside a callback
        fut.add_done_callback(lambda f: self.get_logger().info(f'sum {f.result().sum}'))

def main():
    rclpy.init()
    ex = MultiThreadedExecutor(); ex.add_node(Talker()); ex.spin()
```
:::end

## In practice

The `demo_nodes_py`, `examples_rclpy_minimal_service` and `action_tutorials` packages contain the real versions of these nodes, and `ros2 service call`, `ros2 action send_goal --feedback` and `ros2 topic echo` exercise them from the command line. Integration tests use `launch_testing` to start nodes and assert on what they publish.

## Exercises

:::exercise
Should "drive 3 m forward" be a topic, a service or an action?
:::solution
An action: it takes seconds, the client wants progress (distance so far) and may need to cancel it. A service would block with no feedback, and a topic gives no result or acknowledgement.
:::end

:::exercise
Why does `call_async` followed by `rclpy.spin_until_future_complete(node, fut)` in `main()` work, while `call` inside a timer callback on a single-threaded executor hangs?
:::solution
`spin_until_future_complete` runs the executor until the future is done, so the response callback gets executed. Inside a callback, the only executor thread is busy running that callback and cannot deliver the response.
:::end

## Quiz

:::quiz
- type: num
  q: Messages the listener received in the integration test?
  answer: 5
  tol: 0.001
  py: "5"
  explain: hello 0 to hello 4.
- type: num
  q: Last element of the Fibonacci result for order 5?
  answer: 5
  tol: 0.001
  py: "[0,1,1,2,3,5][-1]"
  explain: 0, 1, 1, 2, 3, 5.
- type: num
  q: Feedback messages in the example action?
  answer: 4
  tol: 0.001
  py: "4"
  explain: One per added term.
- type: num
  q: Messages per second from a 0.1 s timer?
  answer: 10
  tol: 0.001
  py: "1/0.1"
  explain: 10 Hz.
- type: mc
  q: Calling a service synchronously inside a callback on a single-threaded executor…
  options:
    - deadlocks, because the response needs the busy executor
    - works but is slow
    - raises a type error
    - is required for reliability
  answer: 0
  explain: Use call_async instead.
- type: mc
  q: The best fit for a long task with progress and cancel is…
  options:
    - an action
    - a service
    - a topic
    - a parameter
  answer: 0
  explain: Actions provide feedback and cancel.
:::end
