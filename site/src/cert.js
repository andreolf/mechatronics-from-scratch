// Browser-only certificates: canvas PNG, a minimal hand-written PDF that embeds a JPEG, and a SHA-256 verification code.
import { corePhases } from './course.js';

export const CERT_W = 2000, CERT_H = 1414; // A4 landscape ratio
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
export const normName = (s) => String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ');
// the full-course code covers the 20 core phases only, so certificates issued before Phase 21 existed still verify
export const phaseKeys = (key) => (key === 'course' ? corePhases.map((p) => p.id) : [key]);

export async function certCode(name, key, date) {
  const payload = `MFS-CERT-1|${normName(name).toLowerCase()}|${key}|${phaseKeys(key).join(',')}|${date}`;
  const buf = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)));
  let bits = 0, val = 0, out = '';
  for (let i = 0; i < 10; i++) { val = (val << 8) | buf[i]; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  return out.match(/.{4}/g).join('-');
}
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');

function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

export async function drawCert(canvas, { name, key, date, dateLabel, code, verifyUrl }) {
  try { await Promise.all(['800 80px "Schibsted Grotesk Variable"', '400 40px "Newsreader Variable"', 'italic 400 40px "Newsreader Variable"', '500 30px "JetBrains Mono Variable"'].map((f) => document.fonts.load(f))); } catch { /* fallback fonts */ }
  canvas.width = CERT_W; canvas.height = CERT_H;
  const c = canvas.getContext('2d'); const W = CERT_W, H = CERT_H, M = 90;
  const SANS = '"Schibsted Grotesk Variable", system-ui, sans-serif', SERIF = '"Newsreader Variable", Georgia, serif', MONO = '"JetBrains Mono Variable", ui-monospace, monospace';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // fine grid
  c.strokeStyle = '#0f110d'; c.lineWidth = 1;
  for (let x = M; x <= W - M; x += 40) { c.beginPath(); c.moveTo(x + 0.5, M); c.lineTo(x + 0.5, H - M); c.stroke(); }
  for (let y = M; y <= H - M; y += 40) { c.beginPath(); c.moveTo(M, y + 0.5); c.lineTo(W - M, y + 0.5); c.stroke(); }
  // frame + corner ticks
  c.strokeStyle = '#353a2d'; c.lineWidth = 2; c.strokeRect(M, M, W - 2 * M, H - 2 * M);
  c.strokeStyle = '#c6ff1a'; c.lineWidth = 4;
  for (const [x, y, dx, dy] of [[M, M, 1, 1], [W - M, M, -1, 1], [M, H - M, 1, -1], [W - M, H - M, -1, -1]]) { c.beginPath(); c.moveTo(x, y + dy * 60); c.lineTo(x, y); c.lineTo(x + dx * 60, y); c.stroke(); }
  const L = M + 90;
  c.fillStyle = '#c6ff1a'; c.font = `700 30px ${SANS}`; c.fillText('MECHATRONICS FROM SCRATCH', L, M + 120);
  c.fillStyle = '#a4a89c'; c.font = `500 26px ${MONO}`; c.textAlign = 'right'; c.fillText(key === 'course' ? 'FULL COURSE' : `PHASE ${key.slice(1)}`, W - L, M + 120); c.textAlign = 'left';
  c.fillStyle = '#eceee6'; c.font = `italic 400 46px ${SERIF}`; c.fillText('Certificate of completion', L, M + 260);
  c.fillStyle = '#a4a89c'; c.font = `400 34px ${SERIF}`; c.fillText('This certifies that', L, M + 340);
  // name, shrink to fit
  const nm = normName(name) || 'Your name'; let fs = 120;
  do { c.font = `800 ${fs}px ${SANS}`; fs -= 4; } while (c.measureText(nm).width > W - 2 * L && fs > 40);
  c.fillStyle = '#ffffff'; c.fillText(nm, L, M + 480);
  c.fillStyle = '#c6ff1a'; c.fillRect(L, M + 520, 160, 6);
  const ph = phaseKeys(key).map((k) => phases.find((p) => p.id === k));
  const what = key === 'course'
    ? `completed all ${ph.length} phases and ${ph.reduce((a, p) => a + p.lessons.length, 0)} lessons of Mechatronics from Scratch and passed every phase test with a score of 80 % or more.`
    : `completed Phase ${String(ph[0].number).padStart(2, '0')}, “${ph[0].title}”, of Mechatronics from Scratch (${ph[0].lessons.length} lessons) and passed its phase test with a score of 80 % or more.`;
  c.fillStyle = '#dfe2d8'; c.font = `400 38px ${SERIF}`;
  wrap(c, what, W - 2 * L - 200).forEach((ln, i) => c.fillText(ln, L, M + 610 + i * 54));
  // title block
  const ty = H - M - 230, cells = [['DATE', dateLabel], ['VERIFICATION CODE', code], ['CURATED BY', 'Francesco Andreoli']];
  c.strokeStyle = '#353a2d'; c.lineWidth = 2; c.strokeRect(L, ty, W - 2 * L, 130);
  const cw = (W - 2 * L) / 3;
  cells.forEach(([k, v], i) => {
    const x = L + i * cw; if (i) { c.beginPath(); c.moveTo(x, ty); c.lineTo(x, ty + 130); c.stroke(); }
    c.fillStyle = '#767b6e'; c.font = `600 20px ${SANS}`; c.fillText(k, x + 24, ty + 44);
    c.fillStyle = i === 1 ? '#c6ff1a' : '#eceee6'; c.font = i === 1 ? `600 34px ${MONO}` : `600 32px ${SANS}`; c.fillText(v, x + 24, ty + 96);
  });
  c.fillStyle = '#a4a89c'; c.font = `400 22px ${SANS}`;
  c.fillText('Free certificate of completion. Not accredited. Not affiliated with or endorsed by ETH Zurich.', L, H - M - 52);
  c.fillStyle = '#767b6e'; c.font = `400 20px ${MONO}`; c.fillText(`Verify: ${verifyUrl}`, L, H - M - 20);
  return canvas;
}

export function pdfFromCanvas(canvas) {
  const jpg = atob(canvas.toDataURL('image/jpeg', 0.93).split(',')[1]);
  const img = new Uint8Array(jpg.length); for (let i = 0; i < jpg.length; i++) img[i] = jpg.charCodeAt(i);
  const PW = 842, PH = 595, enc = new TextEncoder();
  const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
  const chunks = [], offsets = []; let len = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[^\x00-\x7f]/g, '')); // ascii-safe header
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`); push(img); push('\nendstream'); });
  obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  obj(6, () => push('<< /Title (Mechatronics from Scratch certificate of completion) /Creator (mechatronics-from-scratch, generated in the browser) >>'));
  const xref = len;
  push(`xref\n0 7\n0000000000 65535 f \n${[1, 2, 3, 4, 5, 6].map((n) => String(offsets[n]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}
