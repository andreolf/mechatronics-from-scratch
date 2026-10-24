---
id: p03-l04
minutes: 35
summary: A transfer function is the Laplace-domain ratio of output to input with zero initial conditions. You derive the transfer function of a DC motor from its two ODEs, build a small TF class with series and feedback connections, and close a speed loop around the motor.
---

## Definition

Take a linear ODE relating an input $u$ to an output $y$, transform it with all initial conditions zero, and divide:

$$G(s) = \frac{Y(s)}{U(s)} = \frac{b_m s^m + \dots + b_0}{a_n s^n + \dots + a_0}.$$

For $a_2\ddot y + a_1\dot y + a_0 y = b_0 u$ that's $G(s) = b_0/(a_2s^2 + a_1s + a_0)$: the denominator is the characteristic polynomial from Phase 02, and its roots are the system's poles.

Three numbers you can read off without solving anything:

- **DC gain** $G(0) = b_0/a_0$: the steady output per unit of constant input.
- **Poles**: roots of the denominator; they set the natural responses $e^{pt}$.
- **Frequency response** $G(j\omega)$: the phasor gain at frequency $\omega$ (lesson 9 of Phase 05).

## The DC motor

The armature circuit and the rotor give two coupled equations, with voltage $V$, current $i$ and speed $\omega$:

$$L\frac{di}{dt} = V - Ri - K\omega, \qquad J\frac{d\omega}{dt} = Ki - b\omega.$$

$K$ is both the torque constant (N·m/A) and the back-EMF constant (V·s/rad); in SI units they're equal because the motor conserves energy. Transform with zero initial conditions:

$$(Ls + R)I = V - K\Omega, \qquad (Js + b)\Omega = KI.$$

Eliminate $I = (Js + b)\Omega/K$:

$$G(s) = \frac{\Omega(s)}{V(s)} = \frac{K}{(Js + b)(Ls + R) + K^2}.$$

The $K^2$ term is the back-EMF loop: faster rotation generates a voltage that opposes the supply.

## Block algebra

Blocks in **series** multiply: $G_2G_1$. A **feedback** loop with forward path $G$ and sensor $H$ (negative feedback) gives

$$T(s) = \frac{G}{1 + GH}.$$

Derivation: the error is $E = R - HY$ and $Y = GE$, so $Y = G(R - HY)$, which rearranges to $Y(1 + GH) = GR$. With polynomials $G = n_G/d_G$ and $H = n_H/d_H$:

$$T = \frac{n_G\,d_H}{d_G\,d_H + n_G\,n_H}.$$

So every block diagram reduces to polynomial products and sums.

:::figure widget=splane caption="A transfer function's poles fix its step response. Drag the pole pair (tap on a phone, or turn on Drag) and watch the shape change."
:::end

## Worked example

A small brushed motor has $J = 10^{-4}$ kg·m², $b = 10^{-5}$ N·m·s, $K = 0.05$ N·m/A, $R = 1$ Ω and $L = 1$ mH.

1. Denominator: $JLs^2 + (JR + bL)s + (bR + K^2) = 10^{-7}s^2 + 1.0001\times10^{-4}s + 2.51\times10^{-3}$.
2. Poles: $s = -974.3$ and $s = -25.76$ s⁻¹. The fast one, with a 1.03 ms time constant, is electrical; the slow one, at 38.8 ms, is mechanical.
3. DC gain: $K/(bR + K^2) = 0.05/0.00251 = 19.92$ rad/s per volt. At 12 V the motor spins at 239 rad/s (2283 rpm).
4. Close a proportional speed loop with $K_p = 0.5$ V per rad/s and unity sensor $H = 1$. The closed-loop denominator becomes $10^{-7}s^2 + 1.0001\times10^{-4}s + 0.02751$.
5. Closed-loop poles: $-500.05 \pm 158.27j$ s⁻¹, so $\omega_n = 524.5$ rad/s and $\zeta = 0.953$. The response is about 20 times faster than open loop.
6. Closed-loop DC gain: $0.5 \times 0.05/0.02751 = 0.9088$. A proportional loop leaves a 9.1 % steady-state error; lesson 7 predicts it without simulating, and integral action in Phase 13 removes it.

## Code it from scratch

:::code file=tf.py
```python
import numpy as np

class TF:
    """Transfer function as numerator/denominator coefficient arrays (highest power first)."""
    def __init__(self, num, den):
        self.num = np.trim_zeros(np.atleast_1d(np.asarray(num, float)), "f")
        self.den = np.trim_zeros(np.atleast_1d(np.asarray(den, float)), "f")

    def __mul__(self, o):            # series
        return TF(np.polymul(self.num, o.num), np.polymul(self.den, o.den))

    def feedback(self, H=None):      # negative feedback, unity by default
        H = H or TF([1], [1])
        return TF(np.polymul(self.num, H.den),
                  np.polyadd(np.polymul(self.den, H.den), np.polymul(self.num, H.num)))

    def __call__(self, s):
        return np.polyval(self.num, s) / np.polyval(self.den, s)

    poles = property(lambda self: np.roots(self.den))
    dc = property(lambda self: self(0.0))

def motor(J=1e-4, b=1e-5, K=0.05, R=1.0, L=1e-3):
    return TF([K], np.polyadd(np.polymul([J, b], [L, R]), [K * K]))

if __name__ == "__main__":
    G = motor()
    print("open-loop poles", np.round(np.sort(G.poles.real), 2), "DC gain", round(G.dc, 3))
    assert np.allclose(np.sort(G.poles.real), [-974.3389, -25.7611], atol=1e-3)
    assert abs(G.dc - 19.9203) < 1e-3
    T = (TF([0.5], [1]) * G).feedback()
    p = T.poles
    assert np.allclose(sorted(p, key=lambda z: z.imag), [-500.05 - 158.2719j, -500.05 + 158.2719j], atol=1e-3)
    assert abs(T.dc - 0.90876) < 1e-4
    # feedback formula agrees with direct evaluation G/(1+G) at many frequencies
    w = np.logspace(0, 5, 200) * 1j
    Gc = 0.5 * G(w)
    assert np.allclose(T(w), Gc / (1 + Gc), rtol=1e-10)
    print("closed-loop poles", np.round(p, 2), "DC gain", round(T.dc, 4))
```
:::end

## Exercises

:::exercise
A spring-mass-damper has $m\ddot x + c\dot x + kx = F$. Write $X(s)/F(s)$ and its DC gain.
:::solution
$G(s) = \frac{1}{ms^2 + cs + k}$ and $G(0) = 1/k$: a constant force $F$ deflects the spring by $F/k$, as statics says.
:::end

:::exercise
Ignore the inductance ($L = 0$) in the motor model. What does $G(s)$ become, and what is the mechanical time constant with the numbers above?
:::solution
$G(s) = \frac{K}{(Js + b)R + K^2} = \frac{K/(bR + K^2)}{\tau s + 1}$ with $\tau = \frac{JR}{bR + K^2} = \frac{10^{-4}}{0.00251} = 39.8$ ms. That's close to the 38.8 ms slow pole of the full model: dropping a fast pole barely moves the slow one.
:::end

## Quiz

:::quiz
- type: num
  q: What is the DC gain of the example motor in rad/s per volt?
  answer: 19.92
  tol: 0.002
  unit: rad/s/V
  py: "0.05/(1e-5*1+0.05**2)"
  explain: $K/(bR + K^2) = 0.05/0.00251$.
- type: num
  q: What is the closed-loop DC gain with $K_p = 0.5$ and unity feedback?
  answer: 0.9088
  tol: 0.002
  py: "0.5*19.9203/(1+0.5*19.9203)"
  explain: $K_pG(0)/(1 + K_pG(0))$.
- type: mc
  q: Negative feedback with forward path $G$ and sensor $H$ gives…
  options:
    - $G/(1 - GH)$
    - $G/(1 + GH)$
    - $GH/(1 + G)$
    - $G + H$
  answer: 1
  explain: From $Y = G(R - HY)$.
- type: num
  q: Which magnitude in s⁻¹ is the slow (mechanical) pole of the example motor?
  answer: 25.76
  tol: 0.002
  unit: 1/s
  py: "-max(np.roots([1e-7,1.0001e-4,2.51e-3]).real)"
  explain: Roots of $10^{-7}s^2 + 1.0001\times10^{-4}s + 2.51\times10^{-3}$.
- type: mc
  q: Blocks in series combine by…
  options:
    - adding their transfer functions
    - multiplying their transfer functions
    - taking the larger one
    - feedback
  answer: 1
  explain: The output of one is the input of the next, so $Y = G_2G_1U$.
- type: num
  q: What is the DC gain of $1/(ms^2 + cs + k)$ for $k = 400$ N/m, in metres per newton?
  answer: 0.0025
  tol: 0.001
  unit: m/N
  py: "1/400"
  explain: $G(0) = 1/k$.
:::end

:::verify
import numpy as np, math
r = np.sort(np.roots([1e-7, 1.0001e-4, 2.51e-3]).real)
assert abs(r[0]+974.34)<0.01 and abs(r[1]+25.76)<0.01
assert abs(1000/974.34-1.03)<0.005 and abs(1000/25.76-38.8)<0.05
assert abs(19.92*12-239)<0.5 and abs(19.9203*12*60/(2*math.pi)-2283)<1
c = np.roots([1e-7, 1.0001e-4, 0.02751]); assert abs(c[0].real+500.05)<0.01 and abs(abs(c[0].imag)-158.27)<0.01
wn = math.sqrt(0.02751/1e-7); assert abs(wn-524.5)<0.1 and abs(1.0001e-4/1e-7/(2*wn)-0.953)<0.001
assert abs(0.025/0.02751-0.9088)<1e-4 and abs(1e-4/0.00251-0.0398)<1e-4
:::end
