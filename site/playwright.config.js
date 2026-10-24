import { defineConfig, devices } from '@playwright/test';

// Chromium in this container renders WebGL through SwiftShader.
const gl = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const chromium = { launchOptions: { args: gl } };
export default defineConfig({
  testDir: './tests',
  testIgnore: process.env.SHOTS ? [] : ['**/screenshots.spec.js'],
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  workers: 3,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4791/', trace: 'off' },
  webServer: process.env.BASE_URL ? undefined : { command: 'npx vite preview --port 4791 --strictPort', port: 4791, reuseExistingServer: true, timeout: 30_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, ...chromium } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-14', use: { ...devices['iPhone 14'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'], ...chromium } },
    { name: 'android-360', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 }, ...chromium } },
    { name: 'landscape', use: { ...devices['iPhone 14 landscape'] } },
  ],
});
