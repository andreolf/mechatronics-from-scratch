import math
import numpy as np

def newton(f, jac, x0, tol=1e-12, max_iter=50, c=1e-4):
    x = np.atleast_1d(np.asarray(x0, float)); history = [x.copy()]
    for _ in range(max_iter):
        fx = f(x); phi = 0.5 * fx @ fx
        if math.sqrt(2 * phi) < tol: break
        dx = np.linalg.solve(np.atleast_2d(jac(x)), -fx)
        alpha = 1.0
        while alpha > 1e-8:
            fn = f(x + alpha * dx)
            if 0.5 * fn @ fn <= (1 - 2 * c * alpha) * phi: break
            alpha /= 2
        x = x + alpha * dx; history.append(x.copy())
    return x, history

if __name__ == "__main__":
    f = lambda x: np.array([x[0] ** 3 - 2 * x[0] - 5])
    J = lambda x: np.array([[3 * x[0] ** 2 - 2]])
    root, hist = newton(f, J, [2.0])
    r = 2.0945514815423265
    e = [abs(h[0] - r) for h in hist]
    assert abs(root[0] - r) < 1e-15 and abs(hist[1][0] - 2.1) < 1e-15
    assert abs(e[2] / e[1] ** 2 - 0.563) < 0.01        # quadratic convergence
    root_bad, _ = newton(f, J, [0.8])                   # tangent nearly flat here
    assert abs(root_bad[0] - r) < 1e-12
    # inverse kinematics of a two-link arm: find q with fk(q) = target
    l1, l2, target = 0.3, 0.2, np.array([0.25, 0.30])
    fk = lambda q: np.array([l1 * math.cos(q[0]) + l2 * math.cos(q[0] + q[1]), l1 * math.sin(q[0]) + l2 * math.sin(q[0] + q[1])])
    Jq = lambda q: np.array([[-l1 * math.sin(q[0]) - l2 * math.sin(q[0] + q[1]), -l2 * math.sin(q[0] + q[1])],
                             [l1 * math.cos(q[0]) + l2 * math.cos(q[0] + q[1]), l2 * math.cos(q[0] + q[1])]])
    q, hist = newton(lambda q: fk(q) - target, Jq, [0.3, 0.8])
    assert np.linalg.norm(fk(q) - target) < 1e-12
    print(f"IK solution q = {np.degrees(q).round(4)}° in {len(hist) - 1} iterations")
