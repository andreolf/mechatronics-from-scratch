---
id: p04-l06
minutes: 35
summary: Bayes' rule says how a measurement should change what you believe. You derive it from the definition of conditional probability, apply it to a door sensor with false positives, and implement a histogram filter that localises a robot in a corridor by alternating sensing and moving.
---

## Deriving Bayes' rule

Conditional probability is defined by $P(A \cap B) = P(A \mid B)P(B)$. Write the same joint probability both ways and divide:

$$P(x \mid z) = \frac{P(z \mid x)\,P(x)}{P(z)}, \qquad P(z) = \sum_{x'}P(z \mid x')P(x').$$

Read it as: **posterior** ∝ **likelihood** × **prior**. $x$ is the state you care about (where the robot is) and $z$ is the measurement (the sensor says "door"). $P(z \mid x)$ is the sensor model: how likely that reading is in each state. The denominator just normalises the result to sum to one.

The base rate matters. A sensor that's right 80 % of the time can still be wrong most of the time it fires if the thing it detects is rare.

## The histogram filter

Split the world into cells and keep a belief $b_i$ for each. Two steps alternate:

1. **Sense**: multiply each cell's belief by the likelihood of the measurement in that cell, then normalise. Belief sharpens.
2. **Move**: shift the belief by the commanded motion and blur it by the motion uncertainty. That's a convolution of the belief with the motion model (lesson 8 of Phase 03). Belief spreads.

Sensing gains information and moving loses it. Repeating the cycle localises the robot even though no single reading is enough. This is a discrete Bayes filter; the Kalman filter is the same idea with Gaussians, and the particle filter (lesson 12) does it with samples.

:::figure widget=bayes caption="A robot in a 20-cell circular corridor with doors at cells 2, 6 and 13. Press Sense and Move 1 cell repeatedly: the belief (lime) concentrates around the robot's true cell."
:::end

## Worked example

A corridor of 20 cells has doors in 3 of them. The door sensor reports "door" with probability 0.8 in front of a door and 0.1 in front of a wall.

1. Prior: uniform, so $P(\text{door cell}) = 3/20 = 0.15$.
2. The sensor says "door". The evidence is $P(z) = 0.8\times0.15 + 0.1\times0.85 = 0.205$.
3. Posterior that the robot is in front of some door: $0.8\times0.15/0.205 = 0.585$. Despite the "80 % accurate" sensor, there's a 41.5 % chance it's facing a wall.
4. Per cell: each door cell goes from 0.05 to $0.8\times0.05/0.205 = 0.195$, and each wall cell from 0.05 to $0.1\times0.05/0.205 = 0.0244$.
5. Move one cell and sense again. Only positions consistent with both readings and the known door spacing keep high belief. With this noisy sensor and a robot that slips 20 % of the time, the filter's best guess is the true cell about 30 % of the time and within one cell about 57 % of the time, against 5 % for a blind guess. Better sensors or less slip sharpen that quickly, and Exercise 3 asks you to try.

## Code it from scratch

:::code file=histogram_filter.py
```python
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
```
:::end

## Exercises

:::exercise
A crack detector flags 95 % of cracked welds and 3 % of good ones. 1 % of welds are cracked. If it flags a weld, what is the chance the weld is cracked?
:::solution
$P = \frac{0.95\times0.01}{0.95\times0.01 + 0.03\times0.99} = \frac{0.0095}{0.0392} = 0.242$. Three out of four flagged welds are fine; a second independent test is needed before scrapping parts.
:::end

:::exercise
Why does the histogram filter need the move step to blur the belief? What goes wrong without it?
:::solution
Without blur, the filter assumes perfect motion. A single slip would put the robot in a cell the belief has already ruled out (probability near zero), and multiplication can never bring it back, so the filter gets stuck on a wrong answer. The blur keeps every plausible cell alive.
:::end


:::exercise
In the code, change the motion model to slip 10 % of the time (0.05, 0.9, 0.05) in both the simulation and `move`. How does the hit rate change?
:::solution
With seed 5 it rises from 60/200 to 87/200 on the exact cell and from 114/200 to 144/200 within one cell. Less motion blur means each sensing step's information survives longer.
:::end

## Quiz

:::quiz
- type: num
  q: Door prior 0.15, P(door reading | door) = 0.8, P(door reading | wall) = 0.1. After one door reading, what is P(door)?
  answer: 0.58537
  tol: 0.001
  py: "0.8*0.15/(0.8*0.15+0.1*0.85)"
  explain: Posterior = likelihood × prior / evidence.
- type: num
  q: The crack detector example. What is P(cracked | flagged)?
  answer: 0.24235
  tol: 0.002
  py: "0.95*0.01/(0.95*0.01+0.03*0.99)"
  explain: The low base rate dominates.
- type: mc
  q: In a Bayes filter, the sensing step…
  options:
    - spreads the belief
    - multiplies the belief by the likelihood and normalises
    - shifts the belief by the motion
    - resets the belief to uniform
  answer: 1
  explain: Measurement update = likelihood × prior.
- type: mc
  q: The motion step in a histogram filter is mathematically a…
  options:
    - multiplication
    - convolution with the motion model
    - Fourier transform
    - normalisation
  answer: 1
  explain: Each cell's belief spreads to its neighbours according to the motion probabilities.
- type: num
  q: Uniform prior over 20 cells, door reading. What is the posterior of one wall cell?
  answer: 0.02439
  tol: 0.002
  py: "0.1*0.05/0.205"
  explain: $0.1\times0.05/0.205$.
- type: mc
  q: The denominator $P(z)$ in Bayes' rule…
  options:
    - is the most important term
    - normalises the posterior to sum to one
    - is always 0.5
    - is the prior
  answer: 1
  explain: It's the sum of likelihood × prior over all states.
:::end

:::verify
assert abs(0.8*0.15+0.1*0.85-0.205)<1e-12 and abs(0.8*0.05/0.205-0.195)<5e-4 and abs(1-0.585366-0.415)<5e-4
assert abs(0.95*0.01+0.03*0.99-0.0392)<5e-5
:::end
