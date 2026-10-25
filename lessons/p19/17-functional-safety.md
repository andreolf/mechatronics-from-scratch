---
id: p19-l17
minutes: 45
summary: A safety function must fail dangerously rarely enough, and functional safety standards put numbers on that. You learn SIL and performance levels, MTTFd and diagnostic coverage, compute the dangerous failure frequency of a single and a redundant channel with common-cause failures, and check the simplified formula against an exact result and a Monte Carlo simulation.
---

## Safety functions and their targets

A **safety function** is something the control system must do to keep risk acceptable: stop the arm when the door opens, remove torque on an E-stop. Hazard analysis (Lesson 16) assigns each one a target. **IEC 61508** (and its machinery offshoot IEC 62061) uses **safety integrity levels**; **ISO 13849-1** uses **performance levels**. For a function used often (high demand), both are bands of the average frequency of dangerous failure per hour, PFH:

| PL | PFH per hour | SIL (high demand) |
|---|---|---|
| a | $10^{-5}$ to $10^{-4}$ | none |
| b | $3 \times 10^{-6}$ to $10^{-5}$ | SIL 1 |
| c | $10^{-6}$ to $3 \times 10^{-6}$ | SIL 1 |
| d | $10^{-7}$ to $10^{-6}$ | SIL 2 |
| e | $10^{-8}$ to $10^{-7}$ | SIL 3 |

## The ingredients

- **MTTFd**, the mean time to dangerous failure of one channel (ISO 13849 calls 3 to 10 years low, 10 to 30 medium, 30 to 100 high). Its rate is $\lambda_D = 1/\mathrm{MTTF_d}$.
- **Diagnostic coverage** DC, the fraction of dangerous failures that self-tests detect and turn into a safe stop (below 60 % none, 60 to 90 % low, 90 to 99 % medium, 99 % or more high). The undetected rate is $\lambda_{DU} = (1 - \mathrm{DC})\lambda_D$.
- **Redundancy**: two channels, either of which can stop the machine (1oo2, one out of two).
- **Common-cause failures**: a fraction $\beta$ of failures hit both channels at once (same overvoltage, same software bug, same contamination).

For two channels over a mission time $T$, a simplified estimate is

$$\mathrm{PFH}_{1oo2} \approx (1-\beta)^2 \lambda_{DU}^2\, T + \beta \lambda_{DU}.$$

IEC 61508-6 gives the full formulas with repair and proof-test terms; ISO 13849-1 offers a simplified method based on category, MTTFd and DC. The formula here is for understanding, not for a certified design.

:::figure widget=pfhbands caption="PFH of one and two channels against the PL and SIL bands. Change MTTFd, diagnostic coverage, the common-cause fraction β and the mission time."
:::end

## Worked example

Each channel MTTFd 30 years, DC 90 %, $\beta = 2$ %, mission time 20 years (illustrative values):

1. $\lambda_D = 3.805 \times 10^{-6}$ per hour; $\lambda_{DU} = 3.805 \times 10^{-7}$ per hour.
2. One channel: PFH $3.805 \times 10^{-7}$, PL d, SIL 2.
3. Two channels: formula $3.197 \times 10^{-8}$; Monte Carlo over two million systems $3.038 \times 10^{-8} \pm 2.9 \times 10^{-10}$; exact $3.041 \times 10^{-8}$. PL e, SIL 3. The simplified formula is 5.2 % conservative.
4. Common cause contributes 24 % of it; with $\beta = 10$ % the PFH rises from $2.537 \times 10^{-8}$ (no common cause) to $5.860 \times 10^{-8}$.

## Code it from scratch

:::code file=pfh.py
```python
import numpy as np

HOURS_PER_YEAR = 8760
PL_BANDS = [("e", 1e-8, 1e-7), ("d", 1e-7, 1e-6), ("c", 1e-6, 3e-6), ("b", 3e-6, 1e-5), ("a", 1e-5, 1e-4)]   # ISO 13849-1, PFH per hour
SIL_BANDS = [("SIL 4", 1e-9, 1e-8), ("SIL 3", 1e-8, 1e-7), ("SIL 2", 1e-7, 1e-6), ("SIL 1", 1e-6, 1e-5)]   # IEC 61508, high demand

def band(pfh, bands):
    for name, lo, hi in bands:
        if lo <= pfh < hi: return name
    return "below range" if pfh < bands[0][1] else "not reached"

def pfh_1oo1(lam_du): return lam_du

def pfh_1oo2(lam_du, beta, t_h):
    """simplified average dangerous failure frequency of two redundant channels over mission time t_h:
    both fail independently, (1-beta)^2 lam^2 t, or one common cause hits both, beta lam. Detected failures are
    assumed to trip the safe state. IEC 61508-6 gives the full formulas with repair and proof-test terms."""
    return (1 - beta) ** 2 * lam_du**2 * t_h + beta * lam_du

def pfh_1oo2_exact(lam_du, beta, t_h):
    """same model without the small-number approximation: P(both independent failures or a common cause by t) / t."""
    p_ind = (1 - np.exp(-(1 - beta) * lam_du * t_h)) ** 2
    return (1 - (1 - p_ind) * np.exp(-beta * lam_du * t_h)) / t_h

def monte_carlo(lam_du, beta, t_h, n=2_000_000, seed=7):
    """sample independent failure times for both channels and a common-cause time; the system fails dangerously when
    both channels are down. Average frequency = P(failure within t_h) / t_h."""
    rng = np.random.default_rng(seed)
    a = rng.exponential(1 / ((1 - beta) * lam_du), n); b = rng.exponential(1 / ((1 - beta) * lam_du), n)
    c = rng.exponential(1 / (beta * lam_du), n)
    fail = np.minimum(np.maximum(a, b), c) < t_h
    p = fail.mean(); return p / t_h, np.sqrt(p * (1 - p) / n) / t_h

def test_redundant_channel():
    mttfd_y, dc, beta, mission_y = 30, 0.90, 0.02, 20
    lam_d = 1 / (mttfd_y * HOURS_PER_YEAR); lam_du = (1 - dc) * lam_d; t = mission_y * HOURS_PER_YEAR
    print(f"per channel: MTTFd {mttfd_y} y -> lambda_D {lam_d:.3e}/h; DC {dc:.0%} -> lambda_DU {lam_du:.3e}/h")
    p1 = pfh_1oo1(lam_du); p2 = pfh_1oo2(lam_du, beta, t); mc, se = monte_carlo(lam_du, beta, t)
    print(f"1oo1 PFH {p1:.3e}/h: PL {band(p1, PL_BANDS)}, {band(p1, SIL_BANDS)}")
    print(f"1oo2 PFH formula {p2:.3e}/h, Monte Carlo {mc:.3e} +/- {se:.1e}/h: PL {band(p2, PL_BANDS)}, {band(p2, SIL_BANDS)}")
    ex = pfh_1oo2_exact(lam_du, beta, t)
    print(f"  exact {ex:.3e}/h: the simplified formula is {100 * (p2 / ex - 1):.1f} % conservative")
    print(f"  of which common cause {beta * lam_du:.3e}/h ({100 * beta * lam_du / p2:.0f} %)")
    assert abs(mc - ex) < 3 * se and ex <= p2 < 1.1 * ex                     # simulation matches; formula is a safe upper bound
    assert band(p2, PL_BANDS) == "e" and band(p1, PL_BANDS) == "d"

def test_common_cause_dominates():
    lam_du = 3.805e-7; t = 20 * HOURS_PER_YEAR
    for beta in (0.0, 0.02, 0.05, 0.10):
        print(f"beta {beta:4.2f}: PFH {pfh_1oo2(lam_du, beta, t):.3e}/h, PL {band(pfh_1oo2(lam_du, beta, t), PL_BANDS)}")
    assert pfh_1oo2(lam_du, 0.10, t) > 2 * pfh_1oo2(lam_du, 0.0, t)

test_redundant_channel()
test_common_cause_dominates()
print("PASS")
```
:::end

## In practice

Engineers compute performance levels with tools such as SISTEMA (from the German IFA) and take failure data from component manufacturers' safety data (B10d values for electromechanical parts, FIT rates for electronics). Certified safety relays, safety PLCs and drives with integrated safety functions supply ready-made subsystems with stated PL and PFH. This lesson is educational and not a substitute for the standards or a qualified functional safety assessment.

## Exercises

:::exercise
A channel has MTTFd 50 years and DC 99 %. What is $\lambda_{DU}$ per hour?
:::solution
$\lambda_D = 1/(50 \times 8760) = 2.28 \times 10^{-6}$; $\lambda_{DU} = 0.01 \times 2.28 \times 10^{-6} = 2.28 \times 10^{-8}$ per hour.
:::end

:::exercise
Why does diversity (two different sensor types) help a redundant channel?
:::solution
Different technologies rarely fail from the same cause, so diversity lowers $\beta$, the common-cause fraction, which otherwise sets a floor $\beta\lambda_{DU}$ on the PFH no matter how good each channel is.
:::end

## Quiz

:::quiz
- type: num
  q: Dangerous failure rate for MTTFd 20 years (per hour, ×10⁻⁶)?
  answer: 5.71
  tol: 0.003
  py: "1e6/(20*8760)"
  explain: 1/(MTTFd in hours).
- type: num
  q: λDU for λD = 4e-6 per hour and DC 90 % (per hour, ×10⁻⁷)?
  answer: 4
  tol: 0.002
  py: "1e7*(1-0.9)*4e-6"
  explain: (1 − DC) λD.
- type: num
  q: Common-cause floor βλDU for β 5 % and λDU 2e-7 per hour (×10⁻⁸)?
  answer: 1
  tol: 0.002
  py: "1e8*0.05*2e-7"
  explain: Both channels fail together.
- type: num
  q: Simplified 1oo2 PFH with λDU 1e-7, β 0 and T 100000 h (×10⁻⁹)?
  answer: 1
  tol: 0.002
  py: "1e9*(1e-7)**2*1e5"
  explain: λ² T.
- type: mc
  q: Which PL corresponds to PFH 5e-8 per hour?
  options: ["PL e", "PL d", "PL c", "PL a"]
  answer: 0
  explain: 1e-8 to 1e-7 is PL e.
- type: mc
  q: What limits the benefit of redundancy?
  options: ["Common-cause failures", "The number of wires", "The mission time only", "Diagnostic coverage above 99 %"]
  answer: 0
  explain: β λDU is a floor.
:::end
