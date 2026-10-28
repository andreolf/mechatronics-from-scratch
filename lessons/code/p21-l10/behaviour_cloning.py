import numpy as np

V, DT, STEPS, WALL = 0.4, 0.1, 100, 0.15            # 4 m at 0.4 m/s between obstacles 15 cm either side

def expert(y):
    return float(np.clip(-2.0 * y, -0.4, 0.4))         # steer back to the centre line

def knn_policy(Y, A, k=5):
    """average action of the k recorded states nearest to y"""
    order = np.argsort(Y)
    Y, A = np.asarray(Y)[order], np.asarray(A)[order]
    def act(y):
        i = np.searchsorted(Y, y)
        lo, hi = max(0, i - k), min(len(Y), i + k)
        near = lo + np.argsort(np.abs(Y[lo:hi] - y))[:k]
        return float(A[near].mean())
    return act

def rollout(policy, rng, noise, label=None):
    """drive the corridor with policy; noise is the random sideways disturbance per step (m)"""
    y, ys = 0.0, [0.0]
    for _ in range(STEPS):
        if label is not None:
            label.append((y, expert(y)))               # DAgger: the expert labels the state the learner reached
        y += policy(y) * DT + rng.normal(0, noise)
        ys.append(y)
    return np.array(ys)

def train(n_demos, demo_noise, dagger_rounds, noise, rng):
    data = []
    for _ in range(n_demos):                            # demonstrations by the expert, optionally disturbed (DART)
        y = 0.0
        for _ in range(STEPS):
            data.append((y, expert(y)))
            y += expert(y) * DT + rng.normal(0, demo_noise)
    for _ in range(dagger_rounds):
        pol = knn_policy(*zip(*data))
        for _ in range(5):
            rollout(pol, rng, noise, label=data)
    return knn_policy(*zip(*data))

def success(policy, rng, noise, trials=200):
    return np.mean([np.abs(rollout(policy, rng, noise)).max() < WALL for _ in range(trials)])

rng = np.random.default_rng(3)
noise = 0.015
results = {
    "expert itself": success(expert, rng, noise),
    "cloned from 50 clean demos": success(train(50, 0.0, 0, noise, rng), rng, noise),
    "cloned from 50 disturbed demos (DART)": success(train(50, 0.015, 0, noise, rng), rng, noise),
    "50 clean demos + 2 DAgger rounds": success(train(50, 0.0, 2, noise, rng), rng, noise),
}
for k, v in results.items():
    print(f"{k:40s} {v*100:5.1f} % of runs stay in the corridor")

assert results["expert itself"] == 1.0
assert results["cloned from 50 clean demos"] < 0.6          # the clone never saw a mistake, so it never learned to fix one
assert results["cloned from 50 disturbed demos (DART)"] > 0.95
assert results["50 clean demos + 2 DAgger rounds"] > 0.95
# with clean demos every recorded state is on the centre line, and the clone's correction is zero everywhere
clean = train(50, 0.0, 0, noise, np.random.default_rng(0))
assert clean(0.1) == 0.0 and expert(0.1) == -0.2
# so the clone is a random walk: after 100 steps of 1.5 cm the spread is 15 cm, the width of half the corridor
assert abs(noise * np.sqrt(STEPS) - WALL) < 1e-12
print("PASS")
