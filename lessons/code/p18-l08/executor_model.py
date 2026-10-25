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
