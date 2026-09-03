import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './static-server.mjs';

const root = process.cwd();
const localSite = await startStaticServer({ root });
const browser = await chromium.launch({ headless: true });
const journeys = [
  {
    label: 'Middle-school math booking',
    filters: { subject: 'Math', grade: '6-8', format: 'online' },
    tutor: 'Maya Patel',
    slot: /Mon, Oct 5 4:00 PM/,
    outcome: 'booking confirmed',
  },
  {
    label: 'Elementary reading consideration',
    filters: { subject: 'Reading', grade: 'K-5', format: 'in-person' },
    tutor: 'Sofia Ramirez',
    outcome: 'booking exited',
  },
  {
    label: 'High-school science booking',
    filters: { subject: 'Science', grade: '9-12', format: 'online' },
    tutor: 'Ethan Lee',
    slot: /Tue, Oct 6 4:00 PM/,
    outcome: 'booking confirmed',
  },
  {
    label: 'Algebra profile visit',
    filters: { subject: 'Math', grade: '9-12', format: 'online' },
    tutor: 'Jordan Williams',
    outcome: 'profile viewed',
  },
];

async function runJourney(journey) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const captureResponses = [];
  page.on('response', (response) => {
    if (response.url().includes('.i.posthog.com')) captureResponses.push(response.status());
  });

  try {
    await page.goto(`${localSite.url}/?traffic=simulation`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Subject').selectOption(journey.filters.subject);
    await page.getByLabel('Grade level').selectOption(journey.filters.grade);
    await page.getByLabel('Session format').selectOption(journey.filters.format);

    const tutorCard = page.locator('article').filter({ hasText: journey.tutor });
    await tutorCard.getByRole('button', { name: 'View profile' }).click();

    if (journey.outcome !== 'profile viewed') {
      await page.getByRole('dialog').getByRole('button', { name: 'Choose a time' }).click();
      if (journey.outcome === 'booking confirmed') {
        await page.getByRole('dialog').getByRole('button', { name: journey.slot }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Confirm session' }).click();
        await page.getByRole('dialog').getByText('Your session is reserved').waitFor();
      } else {
        await page.getByRole('dialog').getByRole('button', { name: 'Close booking' }).click();
      }
    }

    await page.waitForTimeout(1800);
    return { label: journey.label, outcome: journey.outcome, posthog_response_statuses: captureResponses };
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
    expected_events: [
      'tutor filters applied',
      'tutor profile viewed',
      'booking started',
      'time selected',
      'booking confirmed',
      'booking exited',
    ],
    dashboard_use: 'Filter traffic_type to simulated when reviewing these demonstration sessions.',
  };
  await mkdir(resolve(root, 'output'), { recursive: true });
  await writeFile(resolve(root, 'output/traffic-simulation-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
  await localSite.close();
}
