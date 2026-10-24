# Mechatronics from Scratch

**Derive it. Code it. Break it.** A free, open-source (MIT) mechatronics curriculum: 20 phases, 352 lessons, from linear algebra to a self-balancing robot, a quadcopter and a robot arm. Every idea is derived by hand and coded from scratch (Python/NumPy, or bare-metal C for embedded) before you pick up the pro tool it maps to.

Curated by Francesco Andreoli (ETH Zurich mechanical-engineering alumnus · `@francescoswiss` · YouTube `@swissintech`).

> Status: local draft (v0.1.0). Nothing is published. The AI-tutor install command on the site is a **TBD placeholder**.

## What every lesson contains

Each of the 352 lessons in `curriculum/curriculum.json` has:

| field | meaning |
|---|---|
| `id`, `title`, `goal` | e.g. `p13-l07` · PID control · one-line goal |
| `math` | what you derive by hand |
| `code` | `{lang, task}`: the from-scratch exercise (Python/NumPy or C) |
| `lab` / `live_lab` | the interactive visual idea; `live_lab` links to one of the four labs running on the site |
| `test` | the test that proves your implementation works |
| `tool` | the open-source / professional tool it maps to (ngspice, KiCad, python-control, ROS 2, MuJoCo, Gazebo, PlatformIO…) |
| `course` | `{title, eth}`: `eth: true` only where the title is a real ETH Zurich course name we are confident about; otherwise a generic topic |
| `anchors` | real-world anchors (Switzerland: rail, ski lifts, watches, legged robots generically; Bali: scooters, irrigation pumps) |

## Phases

| # | Phase | Lessons | Maps to |
|---|---|---|---|
| 01 | [Workbench & Linear Algebra](curriculum/01-workbench-linear-algebra.md) | 18 | Linear Algebra (ETH) |
| 02 | [Calculus, ODEs & Numerical Integration](curriculum/02-calculus-odes.md) | 16 | Analysis I and II (ETH) |
| 03 | [Laplace, Fourier & z-Transforms](curriculum/03-transforms.md) | 14 | Signals and systems (generic) |
| 04 | [Probability & Statistics for Estimation](curriculum/04-probability.md) | 12 | Probability and Statistics (ETH) |
| 05 | [Circuits & Analog Electronics](curriculum/05-circuits-analog.md) | 23 | Electrical engineering I and II (generic) |
| 06 | [Digital Electronics & Logic](curriculum/06-digital-logic.md) | 16 | Digital Design and Computer Architecture (ETH) |
| 07 | [Sensors & Signal Conditioning](curriculum/07-sensors.md) | 18 | Sensors and measurement (generic) |
| 08 | [Signal Processing & Filters](curriculum/08-signal-processing.md) | 16 | Digital signal processing (generic) |
| 09 | [Actuators: Motors, Drives & Fluid Power](curriculum/09-actuators.md) | 20 | Electric drives (generic) |
| 10 | [Embedded Systems & Microcontrollers](curriculum/10-embedded.md) | 22 | Embedded Systems (ETH) |
| 11 | [Communication Buses & Protocols](curriculum/11-buses.md) | 14 | Communication systems (generic) |
| 12 | [System Dynamics & Modelling](curriculum/12-system-dynamics.md) | 18 | System Modeling (ETH) |
| 13 | [Classical Control](curriculum/13-classical-control.md) | 20 | Control Systems I (ETH) |
| 14 | [Modern Control & Estimation](curriculum/14-modern-control.md) | 18 | Control Systems II (ETH) |
| 15 | [Robot Kinematics & Dynamics](curriculum/15-robot-kinematics-dynamics.md) | 18 | Robot Dynamics (ETH) |
| 16 | [Motion Planning & Trajectories](curriculum/16-motion-planning.md) | 14 | Autonomous Mobile Robots (ETH) |
| 17 | [Computer Vision, Estimation & SLAM](curriculum/17-vision-slam.md) | 20 | Vision and mobile robot estimation (generic) |
| 18 | [Real-Time Software & ROS 2](curriculum/18-realtime-ros2.md) | 17 | Real-time systems (generic) |
| 19 | [Power Electronics, Batteries & Safety](curriculum/19-power-safety.md) | 22 | Power Electronics (ETH) |
| 20 | [Capstones](curriculum/20-capstones.md) | 16 | Project work (generic) |
| | **Total** | **352** | |

## Repository layout

```
curriculum/            one markdown file per phase + README index + curriculum.json (single source of truth for the site)
tools/src/*.txt        compact lesson source (one line per lesson)
tools/build_curriculum.py   regenerates curriculum/*.md and curriculum.json
site/                  Vite + vanilla JS + three.js (bundled from npm, no CDN at runtime)
  src/sim/             pure-JS physics + control models used by the labs (no rendering code)
  src/labs/            the four "break the machine" labs (three.js scenes + controls + oscilloscope)
  src/hero.js          hero scene: 3-DOF arm solving IK to follow the cursor
  src/phasemap.js      phase map, lesson search, localStorage progress
  tests/               Playwright e2e (desktop 1280 + mobile 390) + screenshot capture
  tests-unit/          node --test checks of the simulations
screenshots/           PNGs captured by the Playwright screenshot spec
```

## Run locally

```bash
cd site
npm install
python3 ../tools/build_curriculum.py   # only if you edit tools/src/*.txt
npm run dev                            # http://localhost:5173
# production build + preview
npx vite build && npm run preview      # http://localhost:4791
```

## Tests

```bash
cd site
npm run test:sim          # 17 physics/control unit checks (node --test)
npx playwright install chromium   # first time only
npm test                  # vite build + Playwright e2e on desktop (1280) and mobile (390)
```

The e2e suite checks: page loads with zero console errors; the hero WebGL canvas renders non-blank pixels and reacts to the pointer; each lab reacts to input (pendulum falls with D off, arm tracks a dragged target and sags when the elbow motor is killed, quadcopter crashes when a motor is killed and drifts with a biased gyro-only estimate, motor tracks a new setpoint and droops under load without integral action); the phase map expands, opens lesson details and search filters; progress survives a reload and can be reset; `?nowebgl=1` shows the fallback while the simulations keep running. Headless Chromium uses SwiftShader (`--enable-unsafe-swiftshader`).

## The labs (educational approximations)

1. **Self-balancing robot (cart-pole)**: nonlinear EoM, RK4 at 1 kHz, PID at 200 Hz, 20 ms actuator lag. Toggle P/I/D, D-filter, gains, sensor noise, sensor latency, kick.
2. **Robot arm IK**: 2-link vertical arm, full M(q)/C/g dynamics (RK4 1 kHz), PD servos with torque limits. Analytic vs damped-least-squares IK, joint limits, gravity compensation, kill the elbow motor, drag the target.
3. **Quadcopter attitude**: rigid body with quaternions, motor lag, simulated IMU (gyro noise/bias, accel noise + vibration), complementary filter vs gyro-only vs accel-only, cascaded position → attitude control, kill any motor, gusts.
4. **DC motor + encoder**: electrical + mechanical ODE (RK4 20 kHz), quadrature encoder quantisation (4–4096 CPR), 1 kHz PI with anti-windup, load torque.

Parameters are illustrative, not validated against specific hardware.

## Known limitations

- Lessons are fully specified (goal, derivation, exercise, lab idea, test, tool) but the per-lesson worked solutions, notebooks and firmware are not written yet.
- Only 4 live labs exist; other lessons' "lab" field is a design idea.
- Course mappings are orientation only; this project is not affiliated with or endorsed by ETH Zurich.
- The AI-tutor `npx skills add` line is a placeholder until a skill package exists.
- Touch on the hero scrolls the page (the arm follows an idle path on phones); the arm lab supports touch-drag.

## License

MIT, see [LICENSE](LICENSE). No paywall, no signup.
