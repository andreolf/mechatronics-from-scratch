---
id: p03-l01
minutes: 30
summary: A sinusoid at a fixed frequency is fully described by one complex number, its phasor. You derive why adding sinusoids becomes adding arrows, why multiplying by a complex number rotates and scales, and write a phasor class that you check against a 1000-point time-domain sum.
---

## Complex numbers as arrows

A complex number $z = a + jb$ is a point in the plane: $a$ along the real axis, $b$ along the imaginary one. Engineers write $j$ for $\sqrt{-1}$ because $i$ is taken by current. In polar form

$$z = r\,e^{j\varphi} = r(\cos\varphi + j\sin\varphi), \qquad r = |z| = \sqrt{a^2 + b^2}, \quad \varphi = \operatorname{atan2}(b, a).$$

Use `atan2`, not `atan(b/a)`: the latter loses the quadrant, so $-1 - j$ and $1 + j$ would get the same angle.

Addition works component-wise, like vectors. Multiplication is where complex numbers earn their keep:

$$z_1 z_2 = r_1 r_2\, e^{j(\varphi_1 + \varphi_2)}.$$

Magnitudes multiply and angles add. Multiplying by $j = e^{j\pi/2}$ rotates by 90°; multiplying by $2e^{-j\pi/4}$ doubles and rotates by −45°. Division divides magnitudes and subtracts angles.

## From sinusoids to phasors

Every voltage and current in a linear circuit driven at one frequency $\omega$ is a sinusoid at that same $\omega$. Only amplitude and phase differ, so write

$$v(t) = V\cos(\omega t + \varphi) = \operatorname{Re}\{V e^{j\varphi}\, e^{j\omega t}\}.$$

The complex number $\mathbf V = V e^{j\varphi}$ is the **phasor**. The factor $e^{j\omega t}$ is shared by every signal and spins all phasors together, so you can drop it while you calculate and put it back at the end.

Why adding phasors is legitimate: the real part is linear, so

$$v_1 + v_2 = \operatorname{Re}\{\mathbf V_1 e^{j\omega t}\} + \operatorname{Re}\{\mathbf V_2 e^{j\omega t}\} = \operatorname{Re}\{(\mathbf V_1 + \mathbf V_2)e^{j\omega t}\}.$$

Summing two cosines with different phases by trigonometric identities takes a page. With phasors it's one complex addition. In lesson 8 of Phase 05 the same trick turns a capacitor's $i = C\,dv/dt$ into $\mathbf I = j\omega C\,\mathbf V$, because differentiating $e^{j\omega t}$ multiplies by $j\omega$.

:::figure widget=phasor caption="Two phasors added tip to tail. Move the time slider: every arrow rotates together, and the real part of the amber sum traces the amber curve."
:::end

## Worked example

Two windings of a sensor produce $v_1 = 2\cos(\omega t + 30°)$ V and $v_2 = 4\cos(\omega t - 45°)$ V in series. What is the total?

1. To rectangular form: $\mathbf V_1 = 2\angle 30° = 1.7321 + 1.0000j$, and $\mathbf V_2 = 4\angle{-45°} = 2.8284 - 2.8284j$.
2. Add: $\mathbf V = 4.5605 - 1.8284j$.
3. Back to polar: $|\mathbf V| = \sqrt{4.5605^2 + 1.8284^2} = 4.9134$ V and $\varphi = \operatorname{atan2}(-1.8284, 4.5605) = -21.85°$.
4. So $v(t) = 4.913\cos(\omega t - 21.85°)$ V. The amplitude is less than $2 + 4 = 6$ V because the two are 75° apart.

Multiplying the phasors gives $8\angle{-15°}$, and dividing gives $\mathbf V_1/\mathbf V_2 = 0.5\angle 75°$. You'll use division constantly: an impedance is a voltage phasor divided by a current phasor.

## Code it from scratch

:::code file=phasor.py
```python
import math
import numpy as np

class Phasor:
    """A sinusoid A cos(wt + phi) at a shared frequency, stored as a complex number."""
    def __init__(self, amp, deg):
        self.z = amp * complex(math.cos(math.radians(deg)), math.sin(math.radians(deg)))

    @classmethod
    def from_complex(cls, z):
        p = cls(0, 0); p.z = complex(z); return p

    amp = property(lambda self: abs(self.z))
    deg = property(lambda self: math.degrees(math.atan2(self.z.imag, self.z.real)))

    def __add__(self, o): return Phasor.from_complex(self.z + o.z)
    def __mul__(self, o): return Phasor.from_complex(self.z * o.z)
    def __truediv__(self, o): return Phasor.from_complex(self.z / o.z)

    def at(self, t, w):
        return self.amp * np.cos(w * t + math.radians(self.deg))

if __name__ == "__main__":
    w = 2 * math.pi * 50
    v1, v2 = Phasor(2, 30), Phasor(4, -45)
    v = v1 + v2
    print(f"sum = {v.amp:.4f} V at {v.deg:.2f} deg")
    t = np.linspace(0, 0.04, 1000)                       # two periods, 1000 points
    err = np.max(np.abs(v.at(t, w) - (v1.at(t, w) + v2.at(t, w))))
    assert err < 1e-12, err
    assert abs(v.amp - 4.9134) < 1e-4 and abs(v.deg + 21.85) < 0.01
    q = v1 / v2
    assert abs(q.amp - 0.5) < 1e-12 and abs(q.deg - 75) < 1e-9
    assert abs((v1 * v2).deg + 15) < 1e-9
```
:::end

## Exercises

:::exercise
Three phases of a motor supply carry $230\angle 0°$, $230\angle{-120°}$ and $230\angle 120°$ V. What is their sum, and what does that mean physically?
:::solution
The three arrows are 120° apart and equal in length, so they close into a triangle: the sum is exactly 0. In a balanced three-phase system the neutral wire carries no current, which is why long-distance transmission often omits it.
:::end

:::exercise
Write $z = -3 + 3j$ in polar form. What would `atan(b/a)` have given?
:::solution
$|z| = 3\sqrt 2 = 4.243$ and $\varphi = \operatorname{atan2}(3, -3) = 135°$. `atan(3/-3)` returns −45°, which points into the opposite quadrant: the naive formula is off by 180°.
:::end

:::exercise
A current phasor is $\mathbf I = 0.5\angle 10°$ A and the impedance is $\mathbf Z = 100\angle{-60°}$ Ω. Find the voltage $\mathbf V = \mathbf Z\mathbf I$ as a time function at 50 Hz.
:::solution
Magnitudes multiply and angles add: $\mathbf V = 50\angle{-50°}$ V, so $v(t) = 50\cos(2\pi \cdot 50\, t - 50°)$ V.
:::end

## Quiz

:::quiz
- type: num
  q: What is the magnitude of $2\angle 30° + 4\angle{-45°}$?
  answer: 4.9134
  tol: 0.001
  py: "abs(2*np.exp(1j*np.radians(30))+4*np.exp(-1j*np.radians(45)))"
  explain: Convert both to rectangular form, add, then take the magnitude.
- type: num
  q: What is the angle of $-3 + 3j$ in degrees?
  answer: 135
  tol: 0.001
  unit: °
  py: "math.degrees(math.atan2(3,-3))"
  explain: atan2 keeps the quadrant; the point is in the second quadrant.
- type: mc
  q: Multiplying a phasor by $j$…
  options:
    - doubles its magnitude
    - rotates it by 90° and keeps its magnitude
    - takes its complex conjugate
    - rotates it by 180°
  answer: 1
  explain: $j = e^{j\pi/2}$ has magnitude 1 and angle 90°.
- type: num
  q: What is the magnitude of the phasor sum of $5\cos\omega t$ and $3\cos(\omega t + 90°)$?
  answer: 5.831
  tol: 0.001
  py: "abs(5+3j)"
  explain: $5 + 3j$ has magnitude $\sqrt{34} = 5.831$.
- type: mc
  q: Why can you add phasors to add sinusoids?
  options:
    - Because cosines are periodic
    - Because the real part is linear and all signals share the same $e^{j\omega t}$
    - Because phasors are vectors in 3D
    - It only works when the phases are equal
  answer: 1
  explain: $\operatorname{Re}\{a\} + \operatorname{Re}\{b\} = \operatorname{Re}\{a + b\}$, and the common $e^{j\omega t}$ factors out.
- type: num
  q: What is the angle of $\mathbf V_1/\mathbf V_2$ for $\mathbf V_1 = 2\angle 30°$ and $\mathbf V_2 = 4\angle{-45°}$, in degrees?
  answer: 75
  tol: 0.001
  unit: °
  py: "30-(-45)"
  explain: Division subtracts angles.
:::end

:::verify
import cmath, math
A = 2*cmath.exp(1j*math.radians(30)); B = 4*cmath.exp(-1j*math.radians(45)); S = A+B
assert abs(A.real-1.7321)<1e-4 and abs(A.imag-1)<1e-4 and abs(B.real-2.8284)<1e-4
assert abs(S.real-4.5605)<1e-4 and abs(S.imag+1.8284)<1e-4
assert abs(abs(S)-4.9134)<1e-4 and abs(math.degrees(cmath.phase(S))+21.85)<0.005
s3 = 230*(1+cmath.exp(-2j*math.pi/3)+cmath.exp(2j*math.pi/3)); assert abs(s3)<1e-9
assert abs(abs(-3+3j)-4.243)<1e-3
:::end
