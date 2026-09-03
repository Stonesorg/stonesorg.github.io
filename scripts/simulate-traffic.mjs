import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './static-server.mjs';

const root = process.cwd();
const localSite = await startStaticServer({ root });
const browser = await chromium.launch({ headless: true });
const journeys = [
  { label: 'Facebook middle-school math booking', filters: { subject: 'Math', grade: '6-8', format: 'in-person' }, tutor: 'Naomi Brooks', slot: /Mon, Oct 5 6:00 PM/, outcome: 'booking confirmed', source: 'facebook' },
  { label: 'Elementary reading consideration', filters: { subject: 'Reading', grade: 'K-5', format: 'online' }, tutor: 'Sofia Ramirez', outcome: 'booking exited', source: 'direct' },
  { label: 'High-school science booking', filters: { subject: 'Science', grade: '9-12', format: 'online' }, tutor: 'Ethan Lee', slot: /Tue, Oct 6 4:00 PM/, outcome: 'booking confirmed', source: 'facebook' },
  { label: 'Algebra profile visit', filters: { subject: 'Math', grade: '9-12', format: 'online' }, tutor: 'Jordan Williams', outcome: 'profile viewed', source: 'direct' },
];

async function runJourney(journey) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const captureResponses = [];
  page.on('response', (response) => {
    if (response.url().includes('.i.posthog.com')) captureResponses.push(response.status());
  });

  try {
    const sourceQuery = journey.source === 'facebook' ? '&utm_source=facebook&utm_medium=social&utm_campaign=parents-group' : '';
    await page.goto(`${localSite.url}/?traffic=simulation${sourceQuery}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Meet our tutors' }).click();
    await page.getByLabel('Subject').selectOption(journey.filters.subject);
    await page.getByLabel('Grade level').selectOption(journey.filters.grade);
    await page.getByLabel('Session format').selectOption(journey.filters.format);
    await page.getByRole('article').filter({ hasText: journey.tutor }).getByRole('link', { name: 'See profile' }).click();

    if (journey.outcome !== 'profile viewed') {
      await page.getByRole('link', { name: new RegExp(`Book with ${journey.tutor.split(' ')[0]}`) }).click();
      if (journey.outcome === 'booking confirmed') {
        await page.getByLabel('Parent or guardian name').fill('Demo Parent');
        await page.getByLabel('Email address').fill('demo@example.test');
        await page.getByLabel('Student first name').fill('Demo Student');
        await page.getByLabel('Student grade').selectOption(journey.filters.grade);
        await page.getByRole('radio', { name: journey.slot }).check();
        await page.getByRole('button', { name: 'Reserve demo session' }).click();
        await page.getByRole('heading', { name: 'You’re all set.' }).waitFor();
      } else {
        await page.goto(`${localSite.url}/tutors.html?traffic=simulation`, { waitUntil: 'domcontentloaded' });
      }
    }

    await page.waitForTimeout(1800);
    return { label: journey.label, outcome: journey.outcome, source: journey.source, posthog_response_statuses: captureResponses };
  } finally {
    await context.close();
  }
}

try {
  const results = [];
  for (const journey of journeys) results.push(await runJourney(journey));
  const summary = {
    generated_at: new Date().toISOString(),
    traffic_type: 'simulated',
    local_site: localSite.url,
    visitor_journeys: results,
    expected_events: ['site page viewed', 'tutor filters applied', 'tutor profile viewed', 'booking started', 'time selected', 'booking confirmed', 'booking exited'],
    dashboard_use: 'Filter traffic_type to simulated. Break down source-aware cards by utm_source or referral_category to evaluate Facebook parents-group traffic.',
  };
  await mkdir(resolve(root, 'output'), { recursive: true });
  await writeFile(resolve(root, 'output/traffic-simulation-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
  await localSite.close();
}
