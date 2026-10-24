import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export function watchConsole(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return errors;
}

// Fraction of non-background pixels in an element screenshot (decoded in the page with a 2D canvas).
export async function litFraction(page, locator) {
  const b64 = (await locator.screenshot()).toString('base64');
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 90) lit++;
    return lit / (d.length / 4);
  }, b64);
}

// Labs are built lazily when the labs band nears the viewport.
export async function gotoLab(page, id) {
  await page.locator('#labs').scrollIntoViewIfNeeded();
  await page.waitForSelector('html[data-labs=ready]');
  const lab = page.locator(`#lab-${id}`);
  await lab.scrollIntoViewIfNeeded();
  await expect(lab).toBeInViewport();
  return lab;
}

export const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// Answer key straight from the compiled lesson data, so tests can pass a phase test.
const GEN = path.resolve(import.meta.dirname, '../src/generated');
export const quizBank = (pid) => Object.values(JSON.parse(fs.readFileSync(path.join(GEN, `quiz-${pid}.json`), 'utf8'))).flat();
export const lessonData = (id) => JSON.parse(fs.readFileSync(path.join(GEN, 'lessons', `${id}.json`), 'utf8'));

export async function answer(q, el, correct = true) {
  if (q.type === 'mc') {
    const i = correct ? q.answer : (q.answer + 1) % q.options.length;
    await el.locator('.q-opt').nth(i).click();
  } else {
    const v = correct ? q.answer * (1 + q.tol / 4) : (q.answer === 0 ? 1 + q.tol * 10 : q.answer * (1 + q.tol * 5) + 1);
    await el.getByTestId('num-input').fill(String(v));
  }
}
