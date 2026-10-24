// Small numeric helpers shared by the simulations.
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Deterministic PRNG (mulberry32) + Box-Muller so runs are reproducible.
export function rng(seed = 1) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  u.gauss = () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let x = 0, y = 0;
    while (x === 0) x = u();
    y = u();
    const r = Math.sqrt(-2 * Math.log(x));
    spare = r * Math.sin(2 * Math.PI * y);
    return r * Math.cos(2 * Math.PI * y);
  };
  return u;
}

// Classic fixed-step RK4 on a plain array state: f(x, out) writes dx/dt into out.
export function rk4(f, x, h, k) {
  const n = x.length;
  const { k1, k2, k3, k4, tmp } = k;
  f(x, k1);
  for (let i = 0; i < n; i++) tmp[i] = x[i] + 0.5 * h * k1[i];
  f(tmp, k2);
  for (let i = 0; i < n; i++) tmp[i] = x[i] + 0.5 * h * k2[i];
  f(tmp, k3);
  for (let i = 0; i < n; i++) tmp[i] = x[i] + h * k3[i];
  f(tmp, k4);
  for (let i = 0; i < n; i++) x[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
export const rk4Work = (n) => ({ k1: new Float64Array(n), k2: new Float64Array(n), k3: new Float64Array(n), k4: new Float64Array(n), tmp: new Float64Array(n) });

export const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
