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

test('a parent can follow the six-tutor demo booking path without sending family details to analytics', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.__capturedEvents = [];
    window.posthog = {
      __SV: 1,
      init: () => {},
      capture: (event, properties) => window.__capturedEvents.push({ event, properties }),
    };
  });
  const page = await context.newPage();

  try {
    await page.goto(`${localSite.url}/?utm_source=facebook&utm_medium=social&utm_campaign=parents-group`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Meet our tutors' }).click();
    await page.waitForURL(/tutors\.html/);
    await assert.doesNotReject(() => page.getByText('6 tutors available').waitFor());

    await page.getByLabel('Subject').selectOption('Math');
    await assert.doesNotReject(() => page.getByText('4 tutors available').waitFor());
    await page.getByRole('article').filter({ hasText: 'Naomi Brooks' }).getByRole('link', { name: 'See profile' }).click();
    await page.waitForURL(/tutor\.html\?tutor=naomi-brooks/);
    await page.getByRole('link', { name: 'Book with Naomi' }).click();
    await page.waitForURL(/booking\.html\?tutor=naomi-brooks/);
    const tutorPhoto = await page.locator('.booking-summary img').evaluate((image) => {
      const { width, height } = image.getBoundingClientRect();
      return { width, height };
    });
    assert.ok(Math.abs(tutorPhoto.width - tutorPhoto.height) < 2, 'The phone booking summary keeps the tutor photo square.');

    await page.getByLabel('Parent or guardian name').fill('Taylor Morgan');
    await page.getByLabel('Email address').fill('taylor@example.test');
    await page.getByLabel('Student first name').fill('Sam');
    await page.getByLabel('Student grade').selectOption('6-8');
    await page.getByLabel('Subject for this session').selectOption('Math');
    await page.getByRole('radio', { name: /Mon, Oct 5 6:00 PM/ }).check();
    await page.getByRole('button', { name: 'Reserve demo session' }).click();

    await assert.doesNotReject(() => page.getByRole('heading', { name: 'You’re all set.' }).waitFor());
    await assert.doesNotReject(() => page.getByText(/Naomi Brooks for Mon, Oct 5 at 6:00 PM/).waitFor());
    await assert.doesNotMatch(await page.locator('body').innerText(), /no longer appears in/i);

    const events = await page.evaluate(() => window.__capturedEvents);
    const confirmation = events.find(({ event }) => event === 'booking confirmed');
    assert.equal(confirmation.properties.requested_subject, 'Math');
    assert.equal(confirmation.properties.utm_source, 'facebook');
    assert.doesNotMatch(JSON.stringify(confirmation.properties), /Taylor|taylor@example|Sam/);
    const storedBookingState = await page.evaluate(() => localStorage.getItem('abc-tutoring-demo-booked-slots'));
    assert.equal(storedBookingState, JSON.stringify(['naomi-mon-6']));
    assert.doesNotMatch(storedBookingState, /Taylor|taylor@example|Sam/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.getByRole('radio', { name: /Mon, Oct 5 6:00 PM/ }).count(), 0);
  } finally {
    await browser.close();
  }
});
