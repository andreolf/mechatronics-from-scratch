// Home page: hero, labs, course map, footer. Runs on every project (desktop + phones).
import { test, expect } from '@playwright/test';
import { watchConsole, litFraction, gotoLab, overflow, fullIds } from './helpers.js';

let errors;
test.beforeEach(async ({ page }) => { errors = watchConsole(page); await page.goto('./'); });
test.afterEach(async ({ page }) => {
  expect(await overflow(page), 'horizontal overflow').toBeLessThanOrEqual(0);
  expect(errors, 'console errors').toEqual([]);
});

test('home: hero, honest stats, tutor line and footer', async ({ page }) => {
  await expect(page).toHaveTitle(/Mechatronics from Scratch/);
  await expect(page.locator('h1:visible').first()).toContainText('Mechatronics');
  await expect(page.locator('#stats')).toContainText('363');
  await expect(page.locator('#stats')).toContainText('20');
  await expect(page.locator('#stats')).toContainText('+ 1 track');
  await expect(page.getByTestId('full-count')).toHaveText(String(fullIds().length));
  await expect(page.getByTestId('tutor-cmd')).toContainText('git clone https://github.com/andreolf/mechatronics-from-scratch');
  await expect(page.locator('#tutor')).not.toContainText(/coming soon|placeholder/i);
  const foot = page.locator('#colophon');
  await expect(foot).toContainText('no paywall, no signup');
  await expect(foot).toContainText('MIT');
  await expect(foot).toContainText('not affiliated with or endorsed by ETH Zurich');
  await expect(foot.locator('.foot-h')).toHaveText(['This course', 'More from Scratch', 'About']);
  const sib = foot.getByTestId('sibling-courses');
  for (const [name, url] of [['Security from Scratch', 'https://andreolf.github.io/security-from-scratch/'], ['AI Safety from Scratch', 'https://andreolf.github.io/ai-safety-from-scratch/'], ['Mechanical Engineering from Scratch', 'https://andreolf.github.io/mechanical-engineering-from-scratch/']])
    await expect(sib.getByRole('link', { name })).toHaveAttribute('href', url);
  await expect(sib.getByRole('link', { name: /Mechatronics from Scratch/ })).toHaveCount(0);
  await foot.scrollIntoViewIfNeeded();
  const links = await foot.locator('.foot-list a').evaluateAll((as) => as.map((a) => ({ h: a.getBoundingClientRect().height, d: getComputedStyle(a).textDecorationLine, t: getComputedStyle(a.querySelector('.foot-link-t') || a).textDecorationLine })));
  expect(links.length).toBe(8);
  for (const l of links) { expect(l.h).toBeGreaterThanOrEqual(44); expect(l.d).toBe('none'); expect(l.t).toBe('none'); }
  await expect(page.locator('main')).not.toContainText(/Sister course|Sibling courses/);
  for (const id of ['loop', 'labs', 'course', 'tutor', 'colophon']) { await page.locator('#' + id).scrollIntoViewIfNeeded(); await page.waitForTimeout(200); }
});

test('hero 3D canvas renders; the arm follows the pointer on desktop', async ({ page, isMobile }) => {
  const hero = page.getByTestId('hero-canvas');
  await expect(hero).toHaveAttribute('data-webgl', 'on');
  await expect(hero.locator('canvas')).toHaveCount(1);
  await page.waitForTimeout(1200);
  expect(await litFraction(page, hero)).toBeGreaterThan(0.01);
  test.skip(isMobile, 'pointer-follow is a desktop nicety; phones get the idle animation');
  const before = await page.evaluate(() => window.__mfs.hero.target.toArray());
  const box = await hero.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.35, { steps: 5 });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__mfs.hero.target.toArray());
  expect(Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2])).toBeGreaterThan(0.05);
});

test('lab 01 pendulum: balances, then falls when D is switched off', async ({ page }) => {
  const lab = await gotoLab(page, 'pendulum');
  const badge = page.getByTestId('lab-pendulum-status');
  await page.waitForTimeout(1500);
  await expect(lab).toHaveAttribute('data-fallen', 'false');
  await expect(badge).toHaveAttribute('data-state', 'BALANCING');
  await page.getByTestId('pend-D').click();
  await page.getByTestId('pend-kick').click();
  await expect(lab).toHaveAttribute('data-fallen', 'true', { timeout: 30_000 });
  await expect(badge).toHaveAttribute('data-state', 'FALLEN');
  await page.getByTestId('pend-defaults').click();
  await page.waitForTimeout(1500);
  await expect(lab).toHaveAttribute('data-fallen', 'false');
});

test('lab 02 arm: tracks a target placed by tap or drag, sags when the elbow motor is killed', async ({ page, isMobile }) => {
  const lab = await gotoLab(page, 'arm');
  const view = page.getByTestId('lab-arm-3d');
  await view.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(200);
  const box = await view.boundingBox();
  // first point that the canvas itself receives (the overlay toolbar can sit on top on short screens)
  let x = 0, y = 0;
  for (const [fx, fy] of [[0.6, 0.35], [0.6, 0.5], [0.55, 0.6], [0.45, 0.55]]) {
    x = box.x + box.width * fx; y = box.y + box.height * fy;
    if (await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', [x, y])) break;
  }
  if (isMobile) {
    // touch never hijacks scroll: a drag needs Drag mode, a tap places the target directly
    await page.getByTestId('lab-arm-interact').click();
    await expect(page.getByTestId('lab-arm-interact')).toHaveAttribute('aria-pressed', 'true');
    await page.touchscreen.tap(x, y);
    await page.getByTestId('lab-arm-interact').click();
  } else {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + box.width * 0.02, y - box.height * 0.02, { steps: 4 }); await page.mouse.up();
  }
  await expect(page.getByTestId('arm-auto')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => +(await lab.getAttribute('data-error')), { timeout: 30_000 }).toBeLessThan(0.03);
  await page.getByTestId('arm-kill').click();
  await expect(page.getByTestId('lab-arm-status')).toHaveAttribute('data-state', 'ELBOW MOTOR OFF');
  await expect.poll(async () => +(await lab.getAttribute('data-error')), { timeout: 30_000 }).toBeGreaterThan(0.1);
});

test('lab 03 quadcopter: hovers, crashes when a motor is killed, gyro bias drifts', async ({ page }) => {
  const lab = await gotoLab(page, 'quad');
  await page.waitForTimeout(1500);
  await expect(lab).toHaveAttribute('data-crashed', 'false');
  expect(+(await lab.getAttribute('data-z'))).toBeGreaterThan(0.6);
  await page.getByTestId('quad-kill-2').click();
  await expect(lab).toHaveAttribute('data-crashed', 'true', { timeout: 30_000 });
  await expect(page.getByTestId('lab-quad-status')).toHaveAttribute('data-state', /CRASHED|FLY-AWAY/);
  await page.getByTestId('quad-kill-2').click();
  await page.getByTestId('quad-reset').click();
  await page.waitForTimeout(500);
  await expect(lab).toHaveAttribute('data-crashed', 'false');
  await page.getByTestId('quad-filter').selectOption('gyro');
  await page.getByTestId('quad-bias').click();
  await expect.poll(async () => +(await lab.getAttribute('data-atterr')), { timeout: 30_000 }).toBeGreaterThan(0.08);
});

test('lab 04 motor: follows setpoint, loses speed under load without integral action', async ({ page }) => {
  const lab = await gotoLab(page, 'motor');
  await expect.poll(async () => +(await lab.getAttribute('data-rpm')), { timeout: 20_000 }).toBeGreaterThan(1900);
  await page.getByTestId('motor-rpm').fill('3500');
  await expect.poll(async () => +(await lab.getAttribute('data-rpm')), { timeout: 20_000 }).toBeGreaterThan(3350);
  await page.getByTestId('motor-int').click();
  await page.getByTestId('motor-step').click();
  await expect.poll(async () => +(await lab.getAttribute('data-rpm')), { timeout: 20_000 }).toBeLessThan(3000);
  await expect(page.getByTestId('lab-motor-status')).toHaveAttribute('data-state', /OFF SETPOINT|SATURATED/);
});

const setRange = (page, id, v) => page.getByTestId(id).evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const nums = async (lab, attr) => (await lab.getAttribute(attr)).split(',').map(Number);
test('lab 05 cable robot: four positive tensions, swing damping works, relaxes at the limit and re-arms', async ({ page, isMobile }) => {
  const lab = await gotoLab(page, 'cable');
  await expect.poll(async () => (await nums(lab, 'data-tensions')).length).toBe(4);
  // at rest the lines hold the weight with no slack line
  await page.waitForTimeout(1500);
  expect((await nums(lab, 'data-tensions')).every((t) => t > 0)).toBe(true);
  await expect(lab).toHaveAttribute('data-relaxed', 'false');
  // IK answers a slider: moving towards anchor 3 (+x, +y) shortens line 3
  const before = await nums(lab, 'data-lengths');
  await setRange(page, 'cable-x', 2);
  await setRange(page, 'cable-y', 2);
  await expect.poll(async () => (await nums(lab, 'data-lengths'))[2], { timeout: 20_000 }).toBeLessThan(before[2] - 1);
  // a kicked swing dies out with damping on and keeps going with it off
  await page.getByTestId('cable-kick').click();
  await expect.poll(async () => +(await lab.getAttribute('data-swing')), { timeout: 5_000 }).toBeGreaterThan(4);
  await expect.poll(async () => +(await lab.getAttribute('data-swing')), { timeout: 15_000 }).toBeLessThan(1.5);
  await page.getByTestId('cable-damp').click();
  await page.waitForTimeout(3000);
  await page.getByTestId('cable-kick').click();
  await page.waitForTimeout(4000);
  // the angle passes through small values twice a period, so look for a peak over a couple of seconds
  await expect.poll(async () => +(await lab.getAttribute('data-swing')), { timeout: 4_000, intervals: [100] }).toBeGreaterThan(3);
  await page.getByTestId('cable-damp').click();
  // pushing the gripper past the 28 N limit relaxes every line, and it stays relaxed (latched)
  await setRange(page, 'cable-push', 35);
  await expect(lab).toHaveAttribute('data-relaxed', 'true', { timeout: 10_000 });
  await expect(page.getByTestId('lab-cable-status')).toHaveAttribute('data-state', /RELAXED/);
  await setRange(page, 'cable-push', 0);
  await page.waitForTimeout(800);
  await expect(lab).toHaveAttribute('data-relaxed', 'true');
  // re-arm once the gripper is down: catching a load that is still falling and swinging can trip the limit again, as it should
  await expect(page.getByTestId('lab-cable-status')).toHaveAttribute('data-state', /ON THE FLOOR/, { timeout: 20_000 });
  await page.getByTestId('cable-rearm').click();
  await expect(lab).toHaveAttribute('data-relaxed', 'false');
  // with relax off, a 5 N limit is exceeded and the bars say so
  await page.getByTestId('cable-relax').click();
  await setRange(page, 'cable-limit', 5);
  await expect(lab.locator('.cable-bar[data-state=over]').first()).toBeVisible({ timeout: 10_000 });
  if (isMobile) {
    const small = await lab.evaluate((root) => [...root.querySelectorAll('button, select, a')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.height < 43.5 || b.width < 43.5); }).map((e) => e.outerHTML.slice(0, 80)));
    expect(small).toEqual([]);
  }
});

test('lab 05 under reduced motion: paused, but still answers its controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const lab = await gotoLab(page, 'cable');
  await expect(page.getByTestId('lab-cable-pause')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await lab.getAttribute('data-lengths'))?.split(',').length).toBe(4);
  const before = await lab.getAttribute('data-lengths');
  await setRange(page, 'cable-x', -2);
  await expect.poll(() => lab.getAttribute('data-lengths')).not.toBe(before);
});

test('course map: 20 phases plus the cable-robot track, expand, search, open a Phase 20 lesson', async ({ page }) => {
  await page.locator('#course').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('phase')).toHaveCount(21);
  const p20 = page.locator('[data-phase="p20"]');
  await p20.getByTestId('phase-btn').click();
  await expect(p20).toHaveClass(/open/);
  await expect(p20.getByTestId('lesson')).toHaveCount(16);
  await p20.getByTestId('phase-btn').click();
  await expect(p20).not.toHaveClass(/open/);
  await page.getByTestId('search').fill('kalman');
  await expect(page.locator('#search-status')).toContainText('match');
  const n = +(await page.locator('#search-status').getAttribute('data-count'));
  expect(n).toBeGreaterThan(3);
  await expect(page.getByTestId('lesson')).toHaveCount(n);
  await expect(page.getByTestId('lesson').first()).toContainText(/kalman/i);
  await page.getByTestId('search').fill('zzqxv');
  await expect(page.locator('#search-status')).toContainText('0 lessons');
  await page.getByTestId('search').fill('');
  await expect(page.getByTestId('phase')).toHaveCount(21);
  await p20.getByTestId('phase-btn').click();
  await p20.locator('#lesson-p20-l07').getByTestId('lesson-link').click();
  await expect(page).toHaveURL(/#\/learn\/p20-l07$/);
  await expect(page.getByTestId('lesson-body')).toBeVisible();
  await expect(page.getByTestId('lesson-title')).toContainText('Quadcopter');
});

test('checkbox progress persists across reloads and resets with a second tap', async ({ page }) => {
  await page.locator('#course').scrollIntoViewIfNeeded();
  const p1 = page.locator('[data-phase="p01"]');
  await p1.getByTestId('phase-btn').click();
  await p1.getByTestId('lesson-check').nth(0).check();
  await p1.getByTestId('lesson-check').nth(2).check();
  await expect(page.locator('#progress-label')).toHaveText('2 of 363 lessons done');
  await page.reload();
  await page.locator('#course').scrollIntoViewIfNeeded();
  await expect(page.locator('#progress-label')).toHaveText('2 of 363 lessons done');
  const p1b = page.locator('[data-phase="p01"]');
  await expect(p1b.locator('.phase-meta')).toContainText('2 of 18 done');
  await p1b.getByTestId('phase-btn').click();
  await expect(p1b.getByTestId('lesson-check').nth(0)).toBeChecked();
  await expect(p1b.getByTestId('lesson-check').nth(2)).toBeChecked();
  await page.getByTestId('reset-progress').click();
  await page.getByTestId('reset-progress').click();
  await expect(page.locator('#progress-label')).toHaveText('0 of 363 lessons done');
});

test('graceful WebGL fallback still runs the simulations', async ({ page }) => {
  await page.goto('./?nowebgl=1');
  await expect(page.getByTestId('hero-canvas')).toHaveAttribute('data-webgl', 'off');
  const lab = await gotoLab(page, 'pendulum');
  await expect(lab.locator('.nogl')).toBeVisible();
  const t1 = await lab.getAttribute('data-theta');
  await page.getByTestId('pend-kick').click();
  await page.waitForTimeout(400);
  expect(await lab.getAttribute('data-theta')).not.toBe(t1);
});
