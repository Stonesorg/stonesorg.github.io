import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';
import { startStaticServer } from '../scripts/static-server.mjs';

let localSite;

before(async () => {
  localSite = await startStaticServer();
});

after(async () => {
  if (localSite) await localSite.close();
});

test('a parent can filter, reserve a time, and see it remain unavailable after refresh', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    window.posthog = { __SV: 1, capture: () => {} };
  });
  const page = await context.newPage();

  try {
    await page.goto(`${localSite.url}/?traffic=simulation`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Subject').selectOption('Math');
    await page.getByLabel('Grade level').selectOption('6-8');
    await page.getByLabel('Session format').selectOption('online');
    await assert.doesNotReject(() => page.getByText('3 tutors available').waitFor());

    const mayaCard = page.locator('article').filter({ hasText: 'Maya Patel' });
    await mayaCard.getByRole('button', { name: 'View profile' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Choose a time' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Mon, Oct 5 4:00 PM/ }).click();
    await assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Confirm session' }).isEnabled(), true);
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm session' }).click();

    await assert.doesNotReject(() => page.getByRole('dialog').getByText('Maya Patel is reserved for Mon, Oct 5 at 4:00 PM.').waitFor());
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
    await assert.match(await mayaCard.innerText(), /2 times this week/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await assert.match(await page.locator('article').filter({ hasText: 'Maya Patel' }).innerText(), /2 times this week/);
  } finally {
    await browser.close();
  }
});
