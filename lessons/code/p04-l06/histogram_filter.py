import numpy as np

N = 20
DOORS = {2, 6, 13}
P_HIT, P_FALSE = 0.8, 0.1                       # P(z=door | door), P(z=door | wall)

def sense(bel, z):
    is_door = np.array([i in DOORS for i in range(N)])
    like = np.where(is_door, P_HIT if z else 1 - P_HIT, P_FALSE if z else 1 - P_FALSE)
    post = bel * like
    return post / post.sum()

def move(bel, step=1, p=(0.1, 0.8, 0.1)):
    """Shift by step with undershoot/exact/overshoot probabilities p (circular corridor)."""
    return sum(pk * np.roll(bel, step + k - 1) for k, pk in enumerate(p))

if __name__ == "__main__":
    bel = np.full(N, 1 / N)
    post = sense(bel, True)
    assert abs(post[2] - 0.8 * 0.05 / 0.205) < 1e-12 and abs(post[0] - 0.1 * 0.05 / 0.205) < 1e-12
    assert abs(sum(post[i] for i in DOORS) - 0.585366) < 1e-6
    rng = np.random.default_rng(5)
    hits = near = 0
    for trial in range(200):
        pos, bel = int(rng.integers(N)), np.full(N, 1 / N)
        for _ in range(40):
            z = rng.random() < (P_HIT if pos in DOORS else P_FALSE)
            bel = sense(bel, z)
            assert abs(bel.sum() - 1) < 1e-12
            pos = (pos + 1 + rng.choice([-1, 0, 1], p=[0.1, 0.8, 0.1])) % N
            bel = move(bel)
        bel = sense(bel, rng.random() < (P_HIT if pos in DOORS else P_FALSE))
        a = int(np.argmax(bel))
        hits += int(a == pos)
        near += int(min((a - pos) % N, (pos - a) % N) <= 1)
    print(f"peak on the true cell in {hits}/200 runs, within one cell in {near}/200 (chance: 10/200)")
    assert hits > 40 and near > 100                    # far above the 5 % a guess would get
