// Lab 06: the cable robot take-apart. Runs on every project (desktop + phones).
import { test, expect } from '@playwright/test';
import { watchConsole, gotoLab, litFraction, overflow } from './helpers.js';

let errors;
test.beforeEach(async ({ page }) => { errors = watchConsole(page); await page.goto('./'); });
test.afterEach(async ({ page }) => { expect(errors, errors.join('\n')).toEqual([]); expect(await overflow(page)).toBeLessThanOrEqual(0); });

const openPanel = async (page, isMobile, tab) => { if (isMobile) await page.getByTestId(`ta-teardown-tab-${tab}`).click(); };

test('lab 06 renders the model, runs the scripted job and reads out four line tensions', async ({ page }) => {
  const lab = await gotoLab(page, 'teardown');
  const view = page.getByTestId('ta-teardown-3d');
  await expect(view).toHaveAttribute('data-webgl', 'on');
  await expect.poll(() => litFraction(page, view), { timeout: 20_000 }).toBeGreaterThan(0.02);
  await expect(page.getByTestId('ta-teardown-status')).toHaveText(/IDLE|CALIBRATING|MOVING|HOLDING/);
  await expect.poll(async () => ((await lab.getAttribute('data-tensions')) || '').split(',').filter((v) => +v > 0).length).toBe(4);
  // lengths match the room geometry: pivot at (0, 0, 1.7) in a 7 x 7 x 3 m room is 5.118 m from each corner
  const L = (await lab.getAttribute('data-lengths')).split(',').map(Number);
  expect(L.length).toBe(4); for (const l of L) expect(l).toBeGreaterThan(4.5);
  await expect(page.getByTestId('ta-teardown-log').locator('li').first()).toBeAttached();
});

test('lab 06 exploded view and assemblies glide out and back', async ({ page, isMobile }) => {
  const lab = await gotoLab(page, 'teardown');
  const ex = page.getByTestId('ta-teardown-explode');
  await ex.click();
  await expect(lab).toHaveAttribute('data-exploded', 'true');
  await expect(page.getByTestId('ta-teardown-status')).toHaveText('TEARDOWN');
  await expect(lab).toHaveAttribute('data-playing', 'false'); // the operator took over
  await openPanel(page, isMobile, 'subs');
  await expect(page.getByTestId('ta-teardown-badge-anchors')).toHaveText(/detached/i);
  await openPanel(page, isMobile, 'parts');
  // labels with leader lines follow the parts
  await expect.poll(() => page.locator('#lab-teardown .ta-label[data-on="1"]').count()).toBeGreaterThan(isMobile ? 2 : 6);
  await ex.click();
  await expect(lab).toHaveAttribute('data-exploded', 'false');
  await page.getByTestId('ta-teardown-asm-spool').click();
  await expect(lab).toHaveAttribute('data-assembly', 'spool');
  await expect(page.getByTestId('ta-teardown-asm-spool')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('ta-teardown-asm-all').click();
  await expect(lab).toHaveAttribute('data-assembly', 'all');
  await page.getByTestId('ta-teardown-labels').click();
  await expect(lab).toHaveAttribute('data-labels', 'false');
  await expect(page.locator('#lab-teardown .ta-label[data-on="1"]')).toHaveCount(0);
});

test('lab 06 tapping a part opens its card with a Phase 21 lesson link', async ({ page, isMobile }) => {
  await gotoLab(page, 'teardown');
  await page.getByTestId('ta-teardown-play').click(); // pause, so the model holds still
  await page.getByTestId('ta-teardown-labels').click(); // labels off, so the tap lands on the canvas
  await page.getByTestId('ta-teardown-asm-electronics').click();
  await page.getByTestId('ta-teardown-3d').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800); // camera glides to the enclosure
  const pt = await page.evaluate(() => window.__mfs.labs.teardown.screenOf('psu-0'));
  if (isMobile) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y);
  const card = page.getByTestId('ta-teardown-card');
  await expect(card).toBeVisible();
  await expect(card.locator('h5')).not.toBeEmpty();
  const link = card.locator('a[href^="#/learn/p21-"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  await page.getByTestId('ta-teardown-card-close').click();
  await expect(card).toBeHidden();
  await page.evaluate(() => window.__mfs.labs.teardown.openCard('encoder-1'));
  await expect(card.locator('h5')).toHaveText('Angle encoder (AS5600)');
  await expect(card).toContainText('0.055 mm');
  await card.locator('a[href="#/learn/p21-l05"]').click();
  await expect(page).toHaveURL(/#\/learn\/p21-l05$/);
  await expect(page.getByTestId('lesson-body')).toBeVisible();
  expect(href).toMatch(/^#\/learn\/p21-l\d\d$/);
});

test('lab 06 safety trip relaxes every line, then re-arms', async ({ page, isMobile }) => {
  const lab = await gotoLab(page, 'teardown');
  await page.getByTestId('ta-teardown-trip').click();
  await expect(lab).toHaveAttribute('data-relaxed', 'true', { timeout: 20_000 });
  await expect(page.getByTestId('ta-teardown-status')).toHaveText('RELAXED');
  await openPanel(page, isMobile, 'subs');
  await expect(page.getByTestId('ta-teardown-badge-cables')).toHaveText(/relaxed/i);
  await openPanel(page, isMobile, 'parts');
  await page.getByTestId('ta-teardown-trip').click();
  await expect(lab).toHaveAttribute('data-relaxed', 'false', { timeout: 10_000 });
  await expect(page.getByTestId('ta-teardown-status')).not.toHaveText('RELAXED');
});

test('lab 06 find-the-part challenge and the scrub bar', async ({ page, isMobile }) => {
  const lab = await gotoLab(page, 'teardown');
  const quiz = page.getByTestId('ta-teardown-quiz');
  await page.evaluate(() => window.__mfs.labs.teardown.openCard('motor-0'));
  await expect(quiz).toContainText('Try again');
  await page.evaluate(() => window.__mfs.labs.teardown.openCard('encoder-2'));
  await expect(quiz).toContainText('1 / 3');
  const scrub = page.getByTestId('ta-teardown-scrub');
  await scrub.fill('28');
  await expect(lab).toHaveAttribute('data-exploded', 'true');
  await scrub.fill('2');
  await expect(lab).toHaveAttribute('data-exploded', 'false');
  await expect(lab).toHaveAttribute('data-playing', 'false');
  if (isMobile) { await page.getByTestId('ta-teardown-tab-tele').click(); await expect(page.getByTestId('ta-teardown-telemetry')).toBeVisible(); await expect(page.getByTestId('ta-teardown-asm-all')).toBeHidden(); }
});

test('#/labs/teardown deep link, and lesson 11 embeds the take-apart inline', async ({ page }) => {
  await page.goto('./#/labs/teardown');
  await expect(page.locator('#lab-teardown')).toBeInViewport({ timeout: 20_000 });
  await page.goto('./#/learn/p21-l11');
  const emb = page.locator('[data-testid^="lab-teardown-w"]');
  await emb.scrollIntoViewIfNeeded();
  await expect(emb).toBeVisible({ timeout: 20_000 });
  await expect(emb.locator('[data-testid$="-3d"]')).toHaveAttribute('data-webgl', 'on');
  await emb.locator('[data-testid$="-explode"]').click();
  await expect(emb).toHaveAttribute('data-exploded', 'true');
  await page.goto('./#/learn/p21-l05');
  await expect(page.locator('.prose a[href="#/labs/teardown"]')).toBeVisible();
});
