import { expect } from '@playwright/test';

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

export async function gotoLab(page, id) {
  const lab = page.locator(`#lab-${id}`);
  await lab.scrollIntoViewIfNeeded();
  await expect(lab).toBeInViewport();
  return lab;
}
