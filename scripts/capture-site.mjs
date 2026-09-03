import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './static-server.mjs';

const root = process.cwd();
const output = resolve(root, 'tmp/presentation');
const localSite = await startStaticServer({ root });
const browser = await chromium.launch({ headless: true });

try {
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.posthog = { __SV: 1, capture: () => {} };
  });
  const page = await context.newPage();
  await page.goto(localSite.url, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: resolve(output, 'abc-tutoring-site.png'), fullPage: true });
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.addInitScript(() => {
    window.posthog = { __SV: 1, capture: () => {} };
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(localSite.url, { waitUntil: 'domcontentloaded' });
  await mobilePage.screenshot({ path: resolve(output, 'abc-tutoring-mobile.png'), fullPage: true });
  await mobile.close();
  console.log(`Saved ${resolve(output, 'abc-tutoring-site.png')} and ${resolve(output, 'abc-tutoring-mobile.png')}`);
} finally {
  await browser.close();
  await localSite.close();
}
