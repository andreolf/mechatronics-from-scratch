from collections import deque

EVENTS = ["open", "close", "limit_open", "limit_closed", "obstacle_on", "obstacle_off", "timer", "timeout"]

def step(state, obstacle, ev, guarded=True):
    """Returns the next (state, obstacle). The environment can toggle the obstacle at any time."""
    if ev in ("obstacle_on", "obstacle_off"):
        obstacle = ev == "obstacle_on"
    table = {
        "CLOSED": {"open": "OPENING"},
        "OPENING": {"limit_open": "OPEN", "timeout": "FAULT"},
        "OPEN": {"close": "CLOSING", "timer": "CLOSING"},
        "CLOSING": {"limit_closed": "CLOSED", "obstacle_on": "OPENING", "timeout": "FAULT"},
        "FAULT": {"reset": "CLOSED"},
    }
    nxt = table[state].get(ev, state)
    if guarded and state == "OPEN" and nxt == "CLOSING" and obstacle:
        nxt = "OPEN"                                       # the guard: never start closing onto an obstacle
    return nxt, obstacle

def motor(state):
    return {"OPENING": "up", "CLOSING": "down"}.get(state, "off")       # Moore output

def explore(guarded):
    """Breadth-first search over every reachable (state, obstacle) pair; keeps the shortest path to each."""
    start = ("CLOSED", False)
    seen, q = {start: []}, deque([start])
    while q:
        s = q.popleft()
        for ev in EVENTS + ["reset"]:
            n = step(*s, ev, guarded)
            if n not in seen:
                seen[n] = seen[s] + [ev]
                q.append(n)
    bad = {s: p for s, p in seen.items() if motor(s[0]) == "down" and s[1]}
    return seen, bad

if __name__ == "__main__":
    seen, bad = explore(guarded=False)
    path = next(iter(bad.values()))
    print("naive table: unsafe state reached via", path)
    assert bad and path[:3] == ["open", "limit_open", "obstacle_on"] and path[3] in ("close", "timer")
    seen, bad = explore(guarded=True)
    print(f"guarded controller: {len(seen)} of 10 (state, obstacle) pairs reachable, unsafe: {len(bad)}")
    assert len(seen) == 9 and not bad and ("CLOSING", True) not in seen
