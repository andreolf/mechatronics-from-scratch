---
id: p03-l07
minutes: 25
summary: The initial and final value theorems read the start and the end of a response straight from its Laplace transform. You derive both from the derivative rule, use the final value theorem to predict a control loop's steady-state error, and learn the one condition that makes it lie.
---

## Deriving the theorems

Start from the derivative rule $\int_0^\infty \dot x\,e^{-st}dt = sX(s) - x(0)$.

**Final value.** Let $s \to 0$. The left side becomes $\int_0^\infty \dot x\,dt = x(\infty) - x(0)$, so

$$x(\infty) = \lim_{s \to 0} sX(s).$$

Taking that limit inside the integral is only legitimate if $x(t)$ actually settles. That requires every pole of $sX(s)$ to have a negative real part.

**Initial value.** Let $s \to \infty$ instead. The factor $e^{-st}$ kills the integral (for well-behaved $\dot x$), so

$$x(0^+) = \lim_{s \to \infty} sX(s).$$

For a step response $X = G(s)/s$, the final value is simply $G(0)$, the DC gain, provided the system is stable. If $G$ has more poles than zeros, $sX = G(s) \to 0$ as $s \to \infty$, so the response starts at zero.

## When the final value theorem lies

Take $G(s) = 1/(s - 1)$, an unstable system. The formula says $\lim_{s\to0} s\cdot\frac{1}{s(s-1)} = -1$. The actual response is $y(t) = e^t - 1$, which runs off to infinity. The theorem happily returned a finite number for a system that doesn't settle. The same trap catches a pure oscillator such as $1/(s^2 + 4)$: its poles sit on the imaginary axis, the output never settles, and the theorem still returns a number. Check the poles first.

## Steady-state error

For unity feedback with loop gain $L(s) = C(s)G(s)$, the error is $E = R/(1 + L)$. For a unit step $R = 1/s$:

$$e_\text{ss} = \lim_{s \to 0}\frac{1}{1 + L(s)} = \frac{1}{1 + L(0)}.$$

A finite $L(0)$ leaves a residual error. An integrator in the loop makes $L(0) = \infty$ and the step error zero. That's the whole reason PI controllers exist (Phase 13). For a ramp input $R = 1/s^2$, $e_\text{ss} = 1/\lim_{s\to0} sL(s)$, which is finite only with at least one integrator.

:::figure widget=response args={"order":2} caption="The response settles at the DC gain. The final value theorem predicts that level from G(0) without simulating, as long as every pole is in the left half-plane."
:::end

## Worked example

1. **Plain step response.** $G(s) = \dfrac{10}{s^2 + 3s + 2}$ has poles −1 and −2, both stable. The step response settles at $G(0) = 10/2 = 5$.
2. **Initial slope.** For $G(s) = 5/(s + 2)$ the step response starts at $y(0^+) = \lim s\cdot\frac{5}{s(s+2)} = 0$, with slope $\dot y(0^+) = \lim s\cdot sY = \lim \frac{5s}{s+2} = 5$ per second.
3. **The motor loop from lesson 4.** $K_p = 0.5$ and $G(0) = 19.92$ give $L(0) = 9.96$, so $e_\text{ss} = 1/10.96 = 9.12$ %. That matches the 0.9088 closed-loop DC gain.
4. **Add an integrator.** $C(s) = K_p + K_i/s$ makes $L(0)$ infinite, so $e_\text{ss} = 0$ for steps. For a 1 rad/s² ramp with $K_i = 5$, $sL \to K_i G(0) = 99.6$, so $e_\text{ss} = 1/99.6 = 0.01$ rad/s.

## Code it from scratch

:::code file=final_value.py
```python
import numpy as np
from scipy import signal

def final_value(num, den, inp="step"):
    """lim s->0 s*G(s)*R(s); returns None if the response doesn't settle."""
    k = {"impulse": 0, "step": 1, "ramp": 2}[inp]
    d = np.polymul(den, [1] + [0] * k)             # G(s)/s^k
    if k:                                          # multiply by s: cancel one s from the denominator
        sX_num, sX_den = np.asarray(num, float), np.polydiv(d, [1, 0])[0]
    else:                                          # impulse: multiply the numerator by s
        sX_num, sX_den = np.polymul(num, [1, 0]), np.asarray(d, float)
    # cancel common factors of s
    while abs(sX_num[-1]) < 1e-15 and abs(sX_den[-1]) < 1e-15:
        sX_num, sX_den = sX_num[:-1], sX_den[:-1]
    if np.any(np.roots(sX_den).real >= -1e-12):
        return None                                # pole on or right of the axis: FVT invalid
    return np.polyval(sX_num, 0) / np.polyval(sX_den, 0)

if __name__ == "__main__":
    assert abs(final_value([10], [1, 3, 2]) - 5) < 1e-12
    t = np.linspace(0, 20, 4001)
    _, y = signal.step(([10], [1, 3, 2]), T=t)
    assert abs(y[-1] - 5) < 1e-6
    assert final_value([1], [1, -1]) is None         # unstable: FVT would say -1
    assert final_value([1], [1, 0, 4]) is None       # undamped oscillator
    assert abs(final_value([10], [1, 3, 2], "impulse")) < 1e-12   # impulse response decays to 0
    # motor speed loop: error transfer 1/(1+L), L = 0.5*G
    G_num, G_den = [0.05], [1e-7, 1.0001e-4, 2.51e-3]
    E_num, E_den = G_den, np.polyadd(G_den, 0.5 * np.array(G_num))
    ess = final_value(E_num, E_den)
    print(f"steady-state error {100*ess:.2f} %")
    assert abs(ess - 0.09124) < 1e-4
    # PI: L = (0.5 s + 5)/s * G ; ramp error = 1 / (5 * G(0))
    L_num, L_den = np.polymul([0.5, 5], G_num), np.polymul([1, 0], G_den)
    E_num, E_den = L_den, np.polyadd(L_den, L_num)
    assert abs(final_value(E_num, E_den, "step")) < 1e-12
    assert abs(final_value(E_num, E_den, "ramp") - 1 / (5 * 0.05 / 2.51e-3)) < 1e-9
```
:::end

## Exercises

:::exercise
A temperature loop has $L(s) = \dfrac{4}{(10s + 1)(s + 1)}$. What steady-state error remains after a 1 °C setpoint step?
:::solution
$L(0) = 4$, so $e_\text{ss} = 1/(1 + 4) = 0.2$ °C. The closed-loop poles are roots of $10s^2 + 11s + 5$, both with real part $-0.55$, so the theorem applies.
:::end

:::exercise
Apply the initial value theorem to the step response of $G(s) = \dfrac{s + 2}{s + 4}$. Does the result make sense?
:::solution
$y(0^+) = \lim_{s\to\infty} \frac{s+2}{s+4} = 1$, while $y(\infty) = G(0) = 0.5$. The output jumps to 1 instantly and decays to 0.5. That's possible because $G$ has as many zeros as poles, so it passes high frequencies (the step's edge) straight through.
:::end

## Quiz

:::quiz
- type: num
  q: What value does the step response of $10/(s^2 + 3s + 2)$ settle to?
  answer: 5
  tol: 0.001
  py: "10/2"
  explain: Stable, so $y(\infty) = G(0) = 5$.
- type: num
  q: Unity feedback with $L(0) = 9.96$. What is the step steady-state error, as a fraction?
  answer: 0.09124
  tol: 0.002
  py: "1/(1+9.96)"
  explain: $e_\text{ss} = 1/(1 + L(0))$.
- type: mc
  q: The final value theorem gives a wrong answer for…
  options:
    - $10/(s^2 + 3s + 2)$
    - $1/(s - 1)$
    - $5/(s + 2)$
    - any system with a zero
  answer: 1
  explain: The pole at $+1$ means the response grows without bound.
- type: num
  q: "What is $\\dot y(0^+)$ for the step response of $5/(s + 2)$?"
  answer: 5
  tol: 0.001
  unit: 1/s
  py: "5.0"
  explain: $\lim_{s\to\infty} s\cdot s\cdot\frac{5}{s(s+2)} = 5$.
- type: mc
  q: To get zero steady-state error to a step, the loop needs…
  options:
    - a high gain only
    - at least one integrator
    - a zero at the origin
    - a faster sensor
  answer: 1
  explain: An integrator makes $L(0)$ infinite, so $1/(1 + L(0)) = 0$.
- type: num
  q: What is the steady-state error for $L(s) = 4/((10s + 1)(s + 1))$ after a 1 °C step, in °C?
  answer: 0.2
  tol: 0.001
  unit: °C
  py: "1/(1+4)"
  explain: $1/(1 + 4)$.
:::end

:::verify
import numpy as np
r = np.roots([10, 11, 5]); assert np.allclose(r.real, -0.55)
assert abs(1/10.96-0.0912)<1e-4 and abs(5*19.92-99.6)<1e-9 and abs(1/99.6-0.01)<1e-4
:::end
