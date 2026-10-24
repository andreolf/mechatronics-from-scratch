---
id: p03-l10
minutes: 30
summary: The Fourier transform extends Fourier series to signals that don't repeat, and is how you read a machine's vibration. You derive it as the long-period limit of the series, prove Parseval's energy theorem, and compute a windowed spectrum of synthetic motor vibration.
---

## From series to transform

Write the Fourier series in complex form, $x(t) = \sum_k c_k e^{jk\omega_0 t}$ with $c_k = \frac1T\int_{-T/2}^{T/2}x\,e^{-jk\omega_0t}dt$. The lines in the spectrum are spaced $\omega_0 = 2\pi/T$ apart. Let the period grow without bound: the spacing shrinks to $d\omega$, the sum becomes an integral, and $Tc_k$ becomes a continuous function

$$X(\omega) = \int_{-\infty}^{\infty}x(t)\,e^{-j\omega t}\,dt, \qquad x(t) = \frac{1}{2\pi}\int_{-\infty}^{\infty}X(\omega)\,e^{j\omega t}\,d\omega.$$

For a causal signal this is the Laplace transform evaluated on the imaginary axis, $s = j\omega$, whenever that axis lies in the region of convergence.

Two properties you'll use constantly:

- **Time-frequency trade-off.** Squeezing a pulse in time spreads its spectrum: a Gaussian of width $\sigma_t$ has a Gaussian spectrum of width $1/\sigma_t$. A short hammer tap excites a broad band, which is exactly why modal testing uses one.
- **Real signals have symmetric spectra**, $X(-\omega) = \overline{X(\omega)}$, so you only ever plot positive frequencies.

## Parseval: energy is conserved

$$\int_{-\infty}^{\infty}|x(t)|^2dt = \frac{1}{2\pi}\int_{-\infty}^{\infty}|X(\omega)|^2d\omega.$$

Proof sketch: write $|x|^2 = x\bar x$, substitute the inverse transform for $\bar x$, and swap integrals; the inner integral is the forward transform. The spectrum therefore tells you how a signal's energy is divided among frequencies. The discrete version for $N$ samples, which you'll verify numerically, is $\sum_n|x_n|^2 = \frac1N\sum_k|X_k|^2$.

## Reading a real spectrum

A sampled record of $N$ points at rate $f_s$ gives frequency bins every $f_s/N$ Hz up to $f_s/2$. Cutting a record out of a longer signal multiplies it by a rectangular window, whose spectrum has large sidelobes that smear one strong peak across many bins (leakage). A Hann window $w_n = \frac12(1 - \cos\frac{2\pi n}{N})$ tapers the ends and trades a slightly wider peak for much lower sidelobes. Multiply by 2 afterwards to restore the amplitude, since the Hann window's mean is ½.

:::figure widget=spectrum caption="Vibration of a motor with a 5-blade fan. Peaks sit at 1×, 2× and 5× the shaft speed; change the speed and they move together."
:::end

## Worked example

A fan motor runs at 3000 rpm. Its accelerometer signal is $1.0\sin(2\pi\,50t) + 0.4\sin(2\pi\,100t) + 0.25\sin(2\pi\,250t)$ m/s².

1. The shaft frequency is $3000/60 = 50$ Hz, so the peaks are at 1× (imbalance), 2× (misalignment) and 5× (blade pass of a 5-blade fan).
2. The mean power of a sinusoid of amplitude $A$ is $A^2/2$, so the total is $0.5 + 0.08 + 0.03125 = 0.61125$ (m/s²)², and the RMS is $0.7818$ m/s².
3. Recorded at $f_s = 2$ kHz for $N = 2048$ samples, the bins are $0.977$ Hz apart. 50 Hz isn't an exact bin, so without a window its peak leaks into neighbours.
4. Parseval lets you check a spectrum: the sum of squared bin magnitudes divided by $N$ must equal the sum of squared samples.

## Code it from scratch

:::code file=spectrum.py
```python
import numpy as np

def amplitude_spectrum(x, fs, window=True):
    N = len(x)
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N) / N) if window else np.ones(N)
    X = np.fft.rfft(x * w)
    amp = 2 * np.abs(X) / np.sum(w)                # coherent-gain correction
    return np.fft.rfftfreq(N, 1 / fs), amp

if __name__ == "__main__":
    fs, N = 2000, 2048
    t = np.arange(N) / fs
    x = 1.0 * np.sin(2*np.pi*50*t) + 0.4 * np.sin(2*np.pi*100*t) + 0.25 * np.sin(2*np.pi*250*t)
    X = np.fft.fft(x)
    assert abs(np.sum(x**2) - np.sum(np.abs(X)**2) / N) < 1e-9 * np.sum(x**2)      # Parseval
    f, amp = amplitude_spectrum(x, fs)
    peaks = sorted(f[i] for i in np.argsort(amp)[-3:])
    print("strongest bins at", [round(p, 1) for p in peaks], "Hz")
    for target, a in ((50, 1.0), (100, 0.4), (250, 0.25)):
        k = np.argmin(np.abs(f - target))
        assert abs(f[k] - target) < fs / N
        assert abs(amp[k] - a) / a < 0.16                  # Hann scalloping loss is at most 15 %
    assert abs(np.sqrt(np.mean(x**2)) - 0.7818) < 0.003     # RMS from the time domain
    # leakage: the rectangular window spreads far more energy away from 50 Hz
    _, rect = amplitude_spectrum(x, fs, window=False)
    far = (f > 150) & (f < 230)
    assert rect[far].max() > 20 * amp[far].max()
```
:::end

## Exercises

:::exercise
You need to separate two vibration lines at 49.0 and 50.5 Hz. What is the shortest record that can resolve them, and how many samples is that at 2 kHz?
:::solution
Bin spacing is $f_s/N = 1/T_\text{record}$. With a Hann window the peak is about 2 bins wide, so you want spacing well under 0.75 Hz: about $T = 4/1.5 \approx 2.7$ s, or 5400 samples; round up to 8192 for the FFT (4.1 s).
:::end

:::exercise
A 1 ms rectangular pulse and a 10 ms pulse are both used to excite a structure. Which one excites higher frequencies, and roughly up to where?
:::solution
The spectrum of a rectangular pulse of width $T$ is a sinc with its first zero at $1/T$. The 1 ms pulse excites up to about 1 kHz, the 10 ms pulse only up to about 100 Hz. Use the short pulse to find high-frequency modes.
:::end

## Quiz

:::quiz
- type: num
  q: What is the RMS of $1.0\sin(2\pi50t) + 0.4\sin(2\pi100t) + 0.25\sin(2\pi250t)$?
  answer: 0.78182
  tol: 0.001
  py: "math.sqrt(0.5+0.08+0.03125)"
  explain: Powers add for different frequencies, each $A^2/2$.
- type: num
  q: What is the bin spacing in Hz for $f_s = 2000$ Hz and $N = 2048$?
  answer: 0.97656
  tol: 0.001
  unit: Hz
  py: "2000/2048"
  explain: $\Delta f = f_s/N$.
- type: mc
  q: Parseval's theorem says…
  options:
    - the spectrum is symmetric
    - signal energy is the same computed in time or in frequency
    - the FFT is fast
    - windowing removes noise
  answer: 1
  explain: $\int|x|^2dt = \frac{1}{2\pi}\int|X|^2d\omega$.
- type: num
  q: A shaft at 4500 rpm drives a 7-blade fan. At what frequency in Hz is the blade-pass line?
  answer: 525
  tol: 0.001
  unit: Hz
  py: "4500/60*7"
  explain: $75$ Hz shaft × 7 blades.
- type: mc
  q: Why apply a Hann window before an FFT of a measured record?
  options:
    - To make the FFT faster
    - To reduce leakage from the record's abrupt ends
    - To remove the DC component
    - To double the resolution
  answer: 1
  explain: Tapering the ends lowers the sidelobes that smear strong peaks across the spectrum.
- type: mc
  q: Making a pulse shorter in time makes its spectrum…
  options:
    - narrower
    - wider
    - unchanged
    - purely real
  answer: 1
  explain: Time and frequency widths are inversely related.
:::end

:::verify
assert abs(3000/60-50)<1e-12 and abs(2000/2048-0.977)<5e-4
:::end
