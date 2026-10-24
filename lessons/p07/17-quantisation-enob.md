---
id: p07-l17
minutes: 35
summary: Quantisation adds an error spread uniformly over one LSB, which sets an upper limit on an ADC's signal-to-noise ratio. You derive q²/12 and SNR = 6.02N + 1.76 dB, measure SINAD and the effective number of bits from the FFT of a coherently sampled sine, and see how extra noise costs bits.
---

## Quantisation noise

An ideal $N$-bit ADC with step $q$ (one LSB) rounds each sample. For a busy signal, the error is spread uniformly over $[-q/2, q/2]$, so its variance is

$$\sigma_q^2 = \frac{1}{q}\int_{-q/2}^{q/2} e^2\,de = \frac{q^2}{12}.$$

A full-scale sine spans $2^N q$ peak to peak, so its rms is $2^N q/(2\sqrt2)$. The ratio is

$$\text{SNR} = 20\log_{10}\frac{2^N q/(2\sqrt2)}{q/\sqrt{12}} = 6.02N + 1.76\text{ dB}.$$

That's 74.0 dB for 12 bits and 98.1 dB for 16. Every extra bit buys 6 dB.

## Effective number of bits

A real ADC adds thermal noise, reference noise, distortion (harmonics from non-linearity, Phase 06 lesson 14) and clock jitter. Measure the **SINAD** (signal to noise and distortion) and express it as the bits an ideal converter would need:

$$\text{ENOB} = \frac{\text{SINAD} - 1.76}{6.02}.$$

A "16-bit" ADC with 86 dB SINAD is really a 14-bit one.

**Measuring it**: sample a pure sine with an integer, odd (ideally prime) number of cycles in the record: **coherent sampling**. Every cycle then lands on an exact FFT bin, there's no leakage, and no window is needed (Phase 08 lesson 11). Sum the power in the signal bin, sum everything else except DC, and take the ratio.

**Oversampling** helps too: averaging $M$ samples of uncorrelated noise improves SNR by $10\log_{10}M$ dB, which is half a bit per doubling, as long as there's enough noise to *dither* the quantisation.

:::figure widget=enob caption="A full-scale sine, quantised, and its error magnified 20×. With no extra noise the measured SNR matches 6.02N + 1.76; add noise and the effective bits fall."
:::end

## Worked example

A 12-bit ADC on 3.3 V.

1. $q = 3.3/4096 = 0.806$ mV, so $\sigma_q = 0.806/\sqrt{12} = 0.233$ mV rms.
2. Ideal SNR: $6.02\times12 + 1.76 = 74.0$ dB.
3. If the front end adds 0.5 mV rms of noise, the total is $\sqrt{0.233^2 + 0.5^2} = 0.552$ mV, the SINAD is $74.0 - 20\log_{10}(0.552/0.233) = 66.5$ dB, and the ENOB is 10.75 bits.
4. Averaging 16 samples of that noise gains 12 dB: about 2 bits back.

## Code it from scratch

:::code file=enob.py
```python
import numpy as np

rng = np.random.default_rng(17)

def adc(x, bits, vref=3.3):
    q = vref / 2**bits
    return np.clip(np.floor(x / q + 0.5), 0, 2**bits - 1) * q

def sinad_db(samples, cycles):
    spec = np.abs(np.fft.rfft(samples - samples.mean())) ** 2
    signal = spec[cycles]
    noise = spec[1:].sum() - signal
    return 10 * np.log10(signal / noise)

def enob(sinad):
    return (sinad - 1.76) / 6.02

if __name__ == "__main__":
    n, cycles, vref = 8192, 997, 3.3                      # prime number of cycles: coherent sampling
    t = np.arange(n)
    for bits in (8, 10, 12, 14, 16):
        q = vref / 2**bits
        x = vref / 2 + (vref / 2 - q) * np.sin(2 * np.pi * cycles * t / n)
        s = sinad_db(adc(x, bits), cycles)
        print(f"{bits:2d} bits: SINAD {s:6.2f} dB (theory {6.02*bits+1.76:6.2f}), ENOB {enob(s):5.2f}")
        assert abs(enob(s) - bits) < 0.1
    # 0.5 mV rms of extra noise on a 12-bit, 3.3 V converter
    q = vref / 4096
    x = vref / 2 + (vref / 2 - q) * np.sin(2 * np.pi * cycles * t / n) + 0.5e-3 * rng.standard_normal(n)
    e = enob(sinad_db(adc(x, 12), cycles))
    assert abs(e - 10.75) < 0.1
    assert abs(np.sqrt(np.mean(rng.uniform(-0.5, 0.5, 1_000_000) ** 2)) - 1 / np.sqrt(12)) < 1e-3
    print(f"with 0.5 mV rms noise: ENOB {e:.2f}")
```
:::end

## Exercises

:::exercise
Why does the record need an odd or prime number of cycles, not just an integer?
:::solution
With an even number that shares factors with the record length, the sine hits the same few ADC codes repeatedly, so the quantisation error is periodic and shows up as harmonics instead of spreading like noise. A prime number of cycles exercises many different codes.
:::end

:::exercise
How many samples must you average to turn a 12-bit ADC with enough noise into an effective 14-bit one?
:::solution
Each 2 bits is 12 dB, so $10\log_{10}M = 12$ gives $M = 16$ samples. That cuts the output rate 16×.
:::end

## Quiz

:::quiz
- type: num
  q: Ideal SNR in dB of a 12-bit ADC?
  answer: 74
  tol: 0.001
  unit: dB
  py: "6.02*12+1.76"
  explain: 6.02N + 1.76.
- type: num
  q: Quantisation noise in mV rms for a 12-bit, 3.3 V ADC?
  answer: 0.23262
  tol: 0.002
  unit: mV
  py: "3.3/4096/math.sqrt(12)*1000"
  explain: q/√12.
- type: num
  q: ENOB of an ADC with 86 dB SINAD?
  answer: 13.993
  tol: 0.002
  unit: bits
  py: "(86-1.76)/6.02"
  explain: (SINAD − 1.76)/6.02.
- type: mc
  q: Coherent sampling means…
  options:
    - sampling twice per cycle
    - an integer (ideally prime) number of cycles in the record
    - using a Hann window
    - sampling at the signal frequency
  answer: 1
  explain: No leakage.
- type: num
  q: SNR gain in dB from averaging 16 samples of uncorrelated noise?
  answer: 12.041
  tol: 0.002
  unit: dB
  py: "10*math.log10(16)"
  explain: 10 log₁₀ M.
- type: num
  q: Variance of a uniform error over one LSB, in units of q²?
  answer: 0.083333
  tol: 0.001
  py: "1/12"
  explain: q²/12.
:::end

:::verify
import math
assert abs(math.sqrt(0.2326**2+0.5**2) - 0.5515) < 1e-3
:::end
