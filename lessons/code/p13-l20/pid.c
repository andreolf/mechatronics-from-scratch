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
