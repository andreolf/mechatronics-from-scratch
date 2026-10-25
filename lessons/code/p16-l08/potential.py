import numpy as np

K_ATT, K_REP, RHO0 = 1.0, 2.0, 1.0      # illustrative gains and the repulsive range (m)

def grad_U(q, goal, obst):
    """gradient of U = 1/2 k_att |q - goal|^2 + sum over obstacles of 1/2 k_rep (1/rho - 1/rho0)^2 for rho < rho0"""
    g = K_ATT * (q - goal)
    for c, r in obst:
        d = q - c; dist = np.linalg.norm(d); rho = dist - r          # distance to the obstacle's surface
        if rho < RHO0:
            g += -K_REP * (1 / rho - 1 / RHO0) / rho**2 * d / dist   # pushes away, growing without bound near the surface
    return g

def U(q, goal, obst):
    u = 0.5 * K_ATT * np.sum((q - goal)**2)
    for c, r in obst:
        rho = np.linalg.norm(q - c) - r
        if rho < RHO0: u += 0.5 * K_REP * (1 / rho - 1 / RHO0)**2
    return u

def navigate(start, goal, obst, step=0.02, iters=4000, tol=0.05, stall=1e-3):
    """descend the potential with a speed limit; stop at the goal or when the robot stops moving away from it"""
    q = np.array(start, float); path = [q.copy()]
    for _ in range(iters):
        g = grad_U(q, goal, obst); n = np.linalg.norm(g)
        if np.linalg.norm(q - goal) < tol: return path, "goal"
        if n < stall: return path, "local minimum"
        q = q - step * g / max(n, 1.0)                                # move at most `step` per iteration
        path.append(q.copy())
        if len(path) > 200 and np.linalg.norm(path[-1] - path[-200]) < 10 * step:
            return path, "local minimum"                              # oscillating in place
    return path, "gave up"

OPEN = [(np.array([3.0, 2.5]), 0.6), (np.array([6.0, 4.0]), 0.8), (np.array([8.0, 1.5]), 0.5)]
U_TRAP = [(np.array([5.0, y]), 0.35) for y in np.arange(1.0, 5.01, 0.5)] + \
         [(np.array([x, 1.0]), 0.35) for x in (4.0, 3.0)] + [(np.array([x, 5.0]), 0.35) for x in (4.0, 3.0)]

def test_gradient_is_right():
    q, goal = np.array([2.2, 2.0]), np.array([10.0, 6.0]); h = 1e-6
    num = np.array([(U(q + h * e, goal, OPEN) - U(q - h * e, goal, OPEN)) / (2 * h) for e in np.eye(2)])
    print(f"analytic gradient {grad_U(q, goal, OPEN).round(5)}, finite differences {num.round(5)}")
    assert np.allclose(num, grad_U(q, goal, OPEN), rtol=1e-6)

def test_open_map_reaches_goal():
    goal = np.array([10.0, 6.0]); path, why = navigate([0.0, 0.0], goal, OPEN)
    P = np.array(path); clear = min(np.linalg.norm(P - c, axis=1).min() - r for c, r in OPEN)
    print(f"open map: {why} after {len(path)} steps, path length {np.sum(np.linalg.norm(np.diff(P, axis=0), axis=1)):.2f} m, closest approach to an obstacle {clear:.2f} m")
    assert why == "goal" and clear > 0

def test_u_trap_is_detected():
    goal = np.array([8.0, 3.0]); path, why = navigate([1.0, 3.0], goal, U_TRAP)
    q = path[-1]
    print(f"U-shaped trap: {why} at ({q[0]:.2f}, {q[1]:.2f}), {np.linalg.norm(q - goal):.2f} m from the goal, |grad U| = {np.linalg.norm(grad_U(q, goal, U_TRAP)):.1e}")
    assert why == "local minimum" and np.linalg.norm(q - goal) > 2
    # it really is a minimum of U: every nearby point is higher
    ring = [U(q + 0.05 * np.array([np.cos(a), np.sin(a)]), goal, U_TRAP) for a in np.linspace(0, 2 * np.pi, 36, endpoint=False)]
    print(f"U there {U(q, goal, U_TRAP):.4f}; lowest U on a 5 cm ring around it {min(ring):.4f}")
    assert min(ring) > U(q, goal, U_TRAP)

test_gradient_is_right()
test_open_map_reaches_goal()
test_u_trap_is_detected()
print("PASS")
