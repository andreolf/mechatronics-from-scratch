---
id: p13-l20
minutes: 45
summary: The PID you designed in continuous time has to run as a few lines of C inside a fixed-rate interrupt. You discretise it with backward Euler and a filtered derivative on the measurement, add an output clamp with conditional-integration anti-windup, unit-test it in C, and test that the firmware output matches a Python reference to within 1e-4 over a full closed-loop run.
---

## From s to z

A controller in firmware sees samples $y_k$ every $T_s$ seconds and must produce $u_k$ before the next tick. Each continuous term needs a discrete stand-in. With **backward Euler**, $s \approx (1 - z^{-1})/T_s$:

- integral: $I_k = I_{k-1} + K_i T_s e_k$;
- derivative, filtered with time constant $T_f$ and taken on the measurement so a setpoint step gives no kick:

$$D_k = \frac{T_f}{T_f + T_s} D_{k-1} - \frac{K_d}{T_f + T_s}\,(y_k - y_{k-1}).$$

Backward Euler maps every stable $s$-pole inside the unit circle, so the discrete filter is stable for any $T_s$. **Tustin** ($s \approx \tfrac{2}{T_s}\tfrac{1 - z^{-1}}{1 + z^{-1}}$) matches the frequency response more closely below Nyquist; either works when $T_s$ is well under the loop's time constants.

The output is $u_k = K_p e_k + I_{k-1} + D_k$, clamped to the actuator limits. **Anti-windup** by conditional integration: skip the integrator update when the output is saturated and the error would push it further.

## What the firmware loop looks like

The control ISR fires on a timer: read the ADC, run `pid_step`, write the PWM compare register. Two times matter: the **execution time** (must fit in the period with margin) and the **latency** from sampling to output, which acts like a small delay of $\approx$ one compute time, costing phase margin $\omega_c t_d$.

:::figure widget=pidtiming caption="A timeline of a fixed-rate control interrupt: sample, compute, write output. Raise the execution time or the jitter and watch the CPU load and the phase lost to latency at the loop's crossover."
:::end

## Worked example

Illustrative loop at $T_s = 1$ ms: $K_p = 2$, $K_i = 10$ s⁻¹, $K_d = 0.1$ s, $T_f = 10$ ms, output limits $\pm 1.5$, plant $\tau \dot y = -y + u$ with $\tau = 0.2$ s.

1. Derivative filter coefficient $T_f/(T_f + T_s) = 10/11 = 0.909$.
2. The PI zero at $K_i/K_p = 5$ rad/s cancels the plant pole $1/\tau = 5$ rad/s, so the loop is $\approx 10/s$: bandwidth 10 rad/s, settling in well under a second.
3. If `pid_step` takes 50 µs, latency costs $10 \times 50\times10^{-6}$ rad $= 0.03°$ of margin: nothing. On a 20 kHz current loop at 3000 rad/s, the same 50 µs costs $8.6°$.

## Code it from scratch

The controller and its unit tests, in C99 with no dependencies. `REAL` defaults to `float`, as on a Cortex-M4F.

:::code file=pid.c
```c
/* pid.c: discrete PID for a fixed-rate firmware loop.
   Backward-Euler integral, first-order filtered derivative on the measurement,
   output clamp with conditional-integration anti-windup. */
#include <stdio.h>
#include <math.h>

#ifndef REAL
#define REAL float
#endif
typedef REAL real;

typedef struct {
    real kp, ki, kd;      /* gains */
    real tf;              /* derivative filter time constant, s */
    real ts;              /* sample period, s */
    real umin, umax;      /* actuator limits */
    real integ;           /* integrator state (already multiplied by ki) */
    real dstate;          /* filtered derivative term */
    real yprev;
    int  first;
} pid_ctrl;

void pid_init(pid_ctrl *c, real kp, real ki, real kd, real tf, real ts, real umin, real umax) {
    c->kp = kp; c->ki = ki; c->kd = kd; c->tf = tf; c->ts = ts;
    c->umin = umin; c->umax = umax;
    c->integ = 0; c->dstate = 0; c->yprev = 0; c->first = 1;
}

real pid_step(pid_ctrl *c, real r, real y) {
    real e = r - y;
    if (c->first) { c->yprev = y; c->first = 0; }          /* no derivative kick on the first sample */
    /* D on measurement, filtered: tf*dD/dt + D = -kd*dy/dt, discretised by backward Euler */
    real a = c->tf / (c->tf + c->ts);
    c->dstate = a * c->dstate - (1 - a) * c->kd * (y - c->yprev) / c->ts;
    c->yprev = y;
    real u = c->kp * e + c->integ + c->dstate;
    real us = u > c->umax ? c->umax : (u < c->umin ? c->umin : u);
    /* anti-windup: integrate unless the output is saturated and the error pushes further into it */
    if (!((u > c->umax && e > 0) || (u < c->umin && e < 0)))
        c->integ += c->ki * c->ts * e;
    return us;
}

#ifdef DUMP
/* closed loop with a first-order plant tau*y' = -y + u (exact discretisation); prints u and y */
int main(void) {
    pid_ctrl c; pid_init(&c, 2.0, 10.0, 0.1, 0.01, 0.001, -1.5, 1.5);
    double y = 0, tau = 0.2, ad = exp(-0.001 / tau);
    for (int k = 0; k < 3000; k++) {
        double r = k < 1500 ? 1.0 : -0.5;
        double u = pid_step(&c, (real)r, (real)y);
        printf("%.9f %.9f\n", u, y);
        y = ad * y + (1 - ad) * u;
    }
    return 0;
}
#else
static int fails = 0;
#define CHECK(cond, msg) do { if (!(cond)) { printf("FAIL: %s\n", msg); fails++; } } while (0)

int main(void) {
    pid_ctrl c;
    /* P only: output is kp*e */
    pid_init(&c, 2, 0, 0, 0.01, 0.001, -10, 10);
    CHECK(fabs(pid_step(&c, 1, 0.25) - 1.5) < 1e-6, "P term");
    /* I only: after n steps of e = 1, output is ki*ts*(n-1) (integral updates after the output) */
    pid_init(&c, 0, 5, 0, 0.01, 0.001, -10, 10);
    real u = 0;
    for (int k = 0; k < 101; k++) u = pid_step(&c, 1, 0);
    CHECK(fabs(u - 0.5) < 1e-5, "I term ramp");
    /* D on measurement: no kick on a setpoint step */
    pid_init(&c, 0, 0, 1, 0.01, 0.001, -10, 10);
    pid_step(&c, 0, 0);
    CHECK(fabs(pid_step(&c, 5, 0)) < 1e-9, "no derivative kick from setpoint");
    /* D on a measurement ramp of slope 1 settles to -kd */
    pid_init(&c, 0, 0, 1, 0.01, 0.001, -10, 10);
    for (int k = 0; k < 200; k++) u = pid_step(&c, 0, k * 0.001f);
    CHECK(fabs(u + 1) < 1e-3, "filtered derivative of a ramp");
    /* clamp */
    pid_init(&c, 100, 0, 0, 0.01, 0.001, -1, 1);
    CHECK(pid_step(&c, 1, 0) == 1 && pid_step(&c, -1, 0) == -1, "output clamp");
    /* anti-windup: integrator stops growing while saturated */
    pid_init(&c, 1, 50, 0, 0.01, 0.001, -1, 1);
    for (int k = 0; k < 5000; k++) pid_step(&c, 10, 0);
    CHECK(c.integ < 1.0 + 1e-3, "integrator held at saturation");
    /* ...and recovers immediately when the error reverses */
    CHECK(pid_step(&c, -1, 0) < 0, "leaves saturation at once");
    if (fails) return 1;
    printf("PASS\n");
    return 0;
}
#endif
```
:::end

Now compile the same file with `-DDUMP` to run a closed loop and print every sample, and compare it with an independent Python implementation of the same equations.

:::code file=pid_reference.py
```python
import subprocess, numpy as np

def pid_ref(kp, ki, kd, tf, ts, umin, umax):
    s = dict(integ=0.0, d=0.0, yprev=None)
    a = tf / (tf + ts)
    def step(r, y):
        e = r - y
        if s["yprev"] is None: s["yprev"] = y
        s["d"] = a * s["d"] - (1 - a) * kd * (y - s["yprev"]) / ts
        s["yprev"] = y
        u = kp * e + s["integ"] + s["d"]
        us = min(max(u, umin), umax)
        if not ((u > umax and e > 0) or (u < umin and e < 0)):
            s["integ"] += ki * ts * e
        return us
    return step

def closed_loop():
    step = pid_ref(2.0, 10.0, 0.1, 0.01, 0.001, -1.5, 1.5)
    y, ad, out = 0.0, np.exp(-0.001 / 0.2), []
    for k in range(3000):
        r = 1.0 if k < 1500 else -0.5
        u = step(r, y); out.append((u, y))
        y = ad * y + (1 - ad) * u
    return np.array(out)

def run_c(real):
    subprocess.run(["gcc", "-std=c99", "-Wall", "-Werror", "-O1", "-DDUMP", f"-DREAL={real}", "-o", "pid_dump", "pid.c", "-lm"], check=True)
    txt = subprocess.run(["./pid_dump"], capture_output=True, text=True, check=True).stdout
    return np.loadtxt(txt.splitlines())

def test_c_matches_python():
    ref = closed_loop()
    for real, tol in (("double", 1e-8), ("float", 1e-4)):
        c = run_c(real)
        err = np.abs(c - ref).max()
        print(f"C ({real}) vs Python reference over 3000 steps: max difference {err:.2e}")
        assert c.shape == ref.shape and err < tol

def test_loop_behaviour():
    ref = closed_loop(); u, y = ref[:, 0], ref[:, 1]
    print(f"saturated samples: {np.sum(np.abs(u) >= 1.5)}, y at 1.5 s: {y[1499]:.4f}, at 3 s: {y[-1]:.4f}")
    assert np.abs(u).max() <= 1.5
    assert abs(y[1499] - 1) < 0.01 and abs(y[-1] + 0.5) < 0.01

test_c_matches_python()
test_loop_behaviour()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does the integrator update *after* the output is computed?
:::solution
So that $u_k$ depends on $I_{k-1}$, which is already known when the sample arrives: the ISR can compute the output, write the PWM, and update state afterwards, minimising latency. It also lets the anti-windup decision use the current saturation state.
:::end

:::exercise
The float build matches the double reference to about $10^{-6}$. When would single precision stop being enough?
:::solution
When the integrator adds increments much smaller than its value. A float has 24 bits of mantissa (about $6\times10^{-8}$ relative), so with $K_i T_s e$ tiny and $I$ large the increment rounds away and the integrator stalls. Fixes: scale units, keep the integral of $e$ rather than $K_i\!\int e$, or use a double or a 32-bit fixed-point accumulator.
:::end

## Quiz

:::quiz
- type: num
  q: Derivative filter coefficient T_f/(T_f + T_s) for T_f = 10 ms and T_s = 1 ms?
  answer: 0.90909
  tol: 0.001
  py: "10/11"
  explain: Backward Euler of the first-order filter.
- type: num
  q: Integrator increment per sample for K_i = 10, T_s = 1 ms and e = 0.5?
  answer: 0.005
  tol: 0.001
  py: "10*0.001*0.5"
  explain: K_i T_s e.
- type: num
  q: Phase lost in degrees to a 50 µs latency at a 3000 rad/s crossover?
  answer: 8.594
  tol: 0.01
  unit: deg
  py: "3000*50e-6*180/math.pi"
  explain: ω_c t_d in radians, converted.
- type: num
  q: CPU load in percent of a 50 µs ISR at 10 kHz?
  answer: 50
  tol: 0.001
  unit: "%"
  py: "50e-6*10000*100"
  explain: Execution time over period.
- type: mc
  q: Why take the derivative on the measurement rather than the error?
  options:
    - a setpoint step then causes no derivative kick
    - it is more accurate
    - it removes the need for a filter
    - it makes the loop faster
  answer: 0
  explain: The setpoint is piecewise constant; differentiating it gives spikes.
- type: mc
  q: Conditional-integration anti-windup stops the integrator when…
  options:
    - the output is saturated and the error pushes further into saturation
    - the error is zero
    - the derivative is large
    - the sample period is late
  answer: 0
  explain: It integrates normally as soon as the error would bring the output back.
:::end
