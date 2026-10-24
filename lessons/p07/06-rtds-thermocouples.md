---
id: p07-l06
minutes: 40
summary: For wider ranges use a platinum RTD or a thermocouple. You implement the Callendar-Van Dusen equation for a PT100, then see why a thermocouple measures only a temperature difference, implement cold-junction compensation with the NIST type K polynomial, and match the reference table to 0.5 °C.
---

## Platinum RTDs

A PT100 is 100 Ω of platinum at 0 °C. Its resistance rises almost linearly, following the **Callendar-Van Dusen** equation for $t \ge 0$ °C:

$$R(t) = R_0(1 + A t + B t^2),\quad A = 3.9083\times10^{-3},\ B = -5.775\times10^{-7}.$$

It's accurate and stable from −200 to 850 °C. The sensitivity is only 0.39 Ω/K, so:

- Drive it with a small constant current (about 1 mA, to limit self-heating).
- Use a 3- or 4-wire connection, so lead resistance doesn't add to the reading: 1 Ω of lead is a 2.6 K error.

## Thermocouples measure a difference

Join two different metals at the hot end. Each wire develops a voltage along its temperature gradient (the **Seebeck effect**), and they differ. The voltage at the open ends depends on the temperatures of *both* junctions:

$$V = E(T_{hot}) - E(T_{cold}),$$

where $E$ is the reference function tabulated for 0 °C cold junctions. Type K (chromel–alumel) gives about 41 µV/K and works up to about 1260 °C.

**Cold-junction compensation (CJC)**: measure the temperature of the terminal block with a thermistor or IC sensor, add $E(T_{cold})$ back, and invert:

$$T_{hot} = E^{-1}\big(V + E(T_{cold})\big).$$

Without it, the reading is low by roughly the terminal temperature. With a linear 41 µV/K approximation instead of the real $E$, it can be off by up to about 12 K between 0 and 1000 °C.

:::figure widget=thermocouple caption="Indicated against true temperature. Turn off cold-junction compensation and the reading drops by the terminal temperature. This sketch uses a linear 41 µV/K model; the code uses the NIST polynomial."
:::end

## Worked example

A type K thermocouple reads 15.396 mV with its terminals at 25 °C.

1. $E(25\,°C) = 1.000$ mV from the table.
2. Compensated voltage: $15.396 + 1.000 = 16.396$ mV.
3. Inverting the table gives $T_{hot} = 400.0$ °C ($E(400) = 16.397$ mV).
4. Without CJC, inverting 15.396 mV gives 376 °C, which is 24 K low.
5. A PT100 at 100 °C: $R = 100(1 + 0.39083 - 0.005775) = 138.51$ Ω.

## Code it from scratch

:::code file=thermocouple.py
```python
import math

# NIST ITS-90 type K reference function, 0 to 1372 C, E in mV
C = [-0.176004136860e-01, 0.389212049750e-01, 0.185587700320e-04, -0.994575928740e-07, 0.318409457190e-09,
     -0.560728448890e-12, 0.560750590590e-15, -0.320207200030e-18, 0.971511471520e-22, -0.121047212750e-25]
A0, A1, A2 = 0.118597600000e+00, -0.118343200000e-03, 0.126968600000e+03

def E_k(t):
    return sum(c * t**i for i, c in enumerate(C)) + A0 * math.exp(A1 * (t - A2) ** 2)

def t_from_E(e, lo=0.0, hi=1372.0):
    for _ in range(60):                                   # bisection: E is monotonic on this range
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if E_k(mid) < e else (lo, mid)
    return (lo + hi) / 2

def thermocouple_temp(v_mV, t_cold):
    return t_from_E(v_mV + E_k(t_cold))

def pt100(t, R0=100.0, A=3.9083e-3, B=-5.775e-7):
    return R0 * (1 + A * t + B * t * t)

if __name__ == "__main__":
    table = {0: 0.000, 25: 1.000, 100: 4.096, 200: 8.138, 300: 12.209, 400: 16.397, 500: 20.644, 1000: 41.276}
    for t, e in table.items():
        assert abs(E_k(t) - e) < 0.0015, t
        assert abs(t_from_E(e) - t) < 0.5
    # cold-junction compensation
    for t_hot in (50, 150, 400, 800, 1200):
        for t_cold in (0, 20, 45):
            v = E_k(t_hot) - E_k(t_cold)                     # what the voltmeter sees
            assert abs(thermocouple_temp(v, t_cold) - t_hot) < 0.5
    v = 15.396
    with_cjc, without = thermocouple_temp(v, 25), t_from_E(v)
    print(f"15.396 mV, terminals at 25 C: {with_cjc:.1f} C with CJC, {without:.1f} C without")
    assert abs(with_cjc - 400) < 0.1 and 20 < with_cjc - without < 26
    # a linear 41 uV/K model is off by several kelvin somewhere in 0-1000 C
    worst_lin = max(abs(E_k(t) / 0.041 - t) for t in range(0, 1001, 10))
    assert worst_lin > 5
    assert abs(pt100(100) - 138.5055) < 1e-4
    print(f"linear-model worst error {worst_lin:.1f} K; PT100 at 100 C = {pt100(100):.2f} ohm")
```
:::end

## Exercises

:::exercise
A 2-wire PT100 has 0.5 Ω in each lead. What temperature error does that cause?
:::solution
1 Ω extra in total, divided by 0.39 Ω/K, is about +2.6 K. A 3- or 4-wire connection removes it.
:::end

:::exercise
Why can't you simply subtract the cold-junction *temperature* from the reading instead of adding $E(T_{cold})$?
:::solution
$E$ isn't linear, so $E^{-1}(V) + T_{cold}$ differs from $E^{-1}(V + E(T_{cold}))$. Compensate in the voltage domain, then invert once.
:::end

## Quiz

:::quiz
- type: num
  q: PT100 resistance in Ω at 100 °C?
  answer: 138.5055
  tol: 0.001
  unit: Ω
  py: "100*(1+3.9083e-3*100-5.775e-7*100**2)"
  explain: Callendar-Van Dusen.
- type: num
  q: Compensated voltage in mV for 15.396 mV with terminals at 25 °C (E(25) = 1.000 mV)?
  answer: 16.396
  tol: 0.001
  unit: mV
  py: "15.396+1.000"
  explain: Add E of the cold junction.
- type: mc
  q: A thermocouple's voltage depends on…
  options:
    - the hot junction only
    - the temperature difference between hot and cold junctions
    - the wire length
    - the current through it
  answer: 1
  explain: V = E(T_hot) − E(T_cold).
- type: num
  q: Temperature error in K from 1 Ω of lead resistance on a PT100 (0.39 Ω/K)?
  answer: 2.564
  tol: 0.01
  unit: K
  py: "1/0.39"
  explain: Use 4 wires.
- type: num
  q: Approximate type K sensitivity in µV/K?
  answer: 41
  tol: 0.05
  unit: µV/K
  py: "41"
  explain: About 41 µV/K near room temperature.
- type: mc
  q: CJC needs…
  options:
    - a second thermocouple
    - a separate measurement of the terminal temperature
    - an ice bath always
    - a higher ADC resolution only
  answer: 1
  explain: A thermistor or IC sensor at the terminals.
:::end

:::verify
assert abs(1/0.39 - 2.564) < 0.001
:::end
