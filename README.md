# Mechatronics from Scratch

**Derive it. Code it. Break it.** A free, open-source (MIT) mechatronics curriculum: 20 phases, 352 lessons, from linear algebra to a self-balancing robot, a quadcopter and a robot arm. Every idea is derived by hand and coded from scratch (Python/NumPy, or bare-metal C for embedded) before you pick up the pro tool it maps to.

Curated by Francesco Andreoli (ETH Zurich mechanical-engineering alumnus · `@francescoswiss` · YouTube `@swissintech`).

> Live site: https://andreolf.github.io/mechatronics-from-scratch/

> Status: v0.2.0. **64 of 352 lessons are fully written** (Phase 01: all 18, Phase 02: all 16, Phase 03: all 14, Phase 04: all 12, Phase 05: 4 of 23 so far). Every other lesson has a detailed outline marked "Full lesson coming soon". The AI-tutor install command on the site is a **coming-soon placeholder** (no skill package is published yet).

## Full lessons

A full lesson lives at `#/learn/<id>` and contains: the derivation (KaTeX, rendered at build time, so no maths runs in the browser), interactive figures, a worked example with real numbers, from-scratch code you can copy or download, exercises with hidden solutions, and a quiz (multiple choice and numeric answers graded with a tolerance, with explanations). Prev/next navigation and a sticky lesson bar make it work one-handed on a phone.

Lessons are Markdown files in `lessons/pNN/*.md` with a few fenced blocks:

```
:::figure widget=integrators args={"system":"stiff"} caption="…"
:::code file=rk4.py lang=python      (must run and pass its own asserts)
:::exercise … :::solution … :::end
:::quiz      (YAML list; numeric questions carry a `py` expression that recomputes the answer)
:::verify    (Python that checks every number quoted in the prose)
```

`python3 tools/verify_lessons.py` runs every code block (Python, and C via `gcc -std=c99 -Wall -Werror`), every verify block, and recomputes every numeric quiz answer. It must pass before a lesson ships (it checks every code block, verify block and quiz answer in every written lesson). `node site/scripts/build-lessons.mjs` compiles the lessons into one lazily loaded JSON per lesson plus one quiz bank per phase.

## Progress, phase tests and certificates

- Everything is stored in your browser (`localStorage`, key `mfs-v2`). No accounts, no backend, no analytics. Export and import your progress as JSON from `#/progress`.
- XP: 50 per completed lesson, 10 per quiz question right first time, 250 per passed phase test. Streaks count consecutive days with activity.
- **Phase tests** (`#/test/pNN`) draw 15 questions from the phase's quiz bank. The pass mark is 80 %. Each retake draws a new set. A phase test exists only once every lesson in the phase is fully written (today: Phases 01 to 04).
- **Certificates** (`#/certificate/pNN`, and `#/certificate/course` after all 20 phase tests) are drawn in the browser and download as PNG or PDF. Each carries a verification code: the first 80 bits of SHA-256 over the name, credential, phases and date, in Crockford base32. Anyone can recompute it at `#/verify`. It proves the certificate wasn't edited after it was made, nothing more: the code is computed client-side, so anyone could generate one.
- **These are free certificates of completion. They are not accredited, and this project is not affiliated with or endorsed by ETH Zurich.**

## Routes

`#/` home · `#/course` · `#/labs` · `#/learn/pNN-lMM` · `#/phase/pNN` · `#/test/pNN` · `#/progress` · `#/certificate/pNN|course` · `#/verify`. Old `#lesson-pNN-lMM` links redirect.

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
lessons/pNN/*.md       full lessons (derivation, worked example, code, exercises, quiz, verify block)
tools/verify_lessons.py     runs and checks every lesson's code, numbers and quiz answers
site/                  Vite + vanilla JS + three.js (bundled from npm, no CDN at runtime)
  scripts/build-lessons.mjs  Markdown + KaTeX + highlight.js → src/generated/*.json
  src/views/           lesson, quiz, phase, test, dashboard, certificate and verify pages
  src/widgets/         touch-friendly interactive figures used inside lessons
  src/cert.js          certificate drawing, verification code, PNG/PDF export
  src/sim/             pure-JS physics + control models used by the labs (no rendering code)
  src/labs/            the four "break the machine" labs (three.js scenes + controls + oscilloscope)
  src/hero.js          hero scene: 3-DOF arm solving IK to follow the cursor
  src/phasemap.js      phase map, lesson search, localStorage progress
  tests/               Playwright e2e on a desktop + phone matrix, plus screenshot capture
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
python3 tools/verify_lessons.py   # every lesson's code, numbers and quiz answers
cd site
npm run test:sim                  # physics/control unit checks (node --test)
npx playwright install chromium webkit   # first time only
npm test                          # build + Playwright e2e
SHOTS=1 npx playwright test screenshots --project=desktop --project=iphone-14 --project=landscape   # refresh screenshots/v2-*.png
BASE_URL=https://andreolf.github.io/mechatronics-from-scratch/ npx playwright test   # against the live site
```

Playwright projects: desktop Chrome (1280), iPhone 13 and iPhone 14 (WebKit), Pixel 7 (Chromium), a 360 px Android, and iPhone 14 landscape. Every test fails on a console error or horizontal overflow. The suite covers: the hero canvas renders; each lab reacts to input, including tap-to-place in the arm lab's explicit drag mode on touch; the course map, search and checkbox progress; a lesson renders KaTeX, code, widgets and hidden solutions; code downloads; quiz grading for multiple choice, numeric tolerance and invalid input; lesson progress and XP survive a reload; prev/next; outline lessons; a failed then passed phase test unlocks a certificate whose PNG and PDF download and whose code verifies (and fails for a different name); every key route has no overflow and touch targets of at least 44 px on phones; the `?nowebgl=1` fallback. Headless Chromium uses SwiftShader (`--enable-unsafe-swiftshader`).

## The labs (educational approximations)

1. **Self-balancing robot (cart-pole)**: nonlinear EoM, RK4 at 1 kHz, PID at 200 Hz, 20 ms actuator lag. Toggle P/I/D, D-filter, gains, sensor noise, sensor latency, kick.
2. **Robot arm IK**: 2-link vertical arm, full M(q)/C/g dynamics (RK4 1 kHz), PD servos with torque limits. Analytic vs damped-least-squares IK, joint limits, gravity compensation, kill the elbow motor, drag the target.
3. **Quadcopter attitude**: rigid body with quaternions, motor lag, simulated IMU (gyro noise/bias, accel noise + vibration), complementary filter vs gyro-only vs accel-only, cascaded position → attitude control, kill any motor, gusts.
4. **DC motor + encoder**: electrical + mechanical ODE (RK4 20 kHz), quadrature encoder quantisation (4–4096 CPR), 1 kHz PI with anti-windup, load torque.

Parameters are illustrative, not validated against specific hardware.

## Known limitations

- 288 lessons (19 in Phase 05 and all of Phases 06 to 20) are outlines, not full lessons yet. Phase tests and phase certificates exist only for Phases 01 to 04, so the full-course certificate can't be earned yet.
- Only 4 live 3D labs exist; lessons also have 2D interactive figures. Other lessons' "lab" field is a design idea.
- Certificate codes show integrity, not identity: there is no server, so anyone could compute one.
- Course mappings are orientation only; this project is not affiliated with or endorsed by ETH Zurich.
- The AI-tutor `npx skills add` line is a placeholder until a skill package exists.

## License

MIT, see [LICENSE](LICENSE). No paywall, no signup.
