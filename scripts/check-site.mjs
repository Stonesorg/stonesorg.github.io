import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { TUTORS } from '../assets/js/data.js';

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), 'utf8');
const [home, listing, profile, booking, posthog, analytics, bookingScript] = await Promise.all([
  read('index.html'), read('tutors.html'), read('tutor.html'), read('booking.html'),
  read('assets/js/posthog-init.js'), read('assets/js/analytics.js'), read('assets/js/booking.js'),
]);

for (const requiredPath of [
  'assets/css/styles.css', 'assets/js/analytics.js', 'assets/js/booking-state.js',
  'assets/js/booking.js', 'assets/js/data.js', 'assets/js/domain.js', 'assets/js/tutor.js',
  'assets/js/tutors.js', 'assets/js/posthog-init.js', 'assets/images/maya-patel.png',
  'assets/images/jordan-williams.png', 'assets/images/naomi-brooks.png', 'assets/images/leo-martinez.png',
  'assets/images/ethan-lee.png', 'assets/images/sofia-ramirez.png', 'tutors.html', 'tutor.html', 'booking.html',
]) {
  await access(resolve(root, requiredPath));
}

assert.equal(TUTORS.length, 6);
assert.equal(TUTORS.filter((tutor) => tutor.subjects.includes('Math')).length, 4);
assert.equal(TUTORS.filter((tutor) => tutor.subjects.includes('Science')).length, 1);
assert.equal(TUTORS.filter((tutor) => tutor.subjects.includes('Reading')).length, 1);
assert.match(posthog, /posthog\.init\('phc_txVivnwXGwZwbjotysrZw3zsvdWHRrWgLT78TbDYNrqK'/);
assert.match(posthog, /autocapture: false/);
assert.match(posthog, /capture_pageview: false/);
assert.match(posthog, /capture_pageleave: false/);
assert.match(posthog, /person_profiles: 'identified_only'/);
assert.match(analytics, /utm_source/);
assert.match(analytics, /referral_category/);
assert.doesNotMatch(analytics, /parent|student|email/i);
assert.match(bookingScript, /Parent or guardian name/);
assert.match(bookingScript, /Email address/);
assert.match(bookingScript, /Student first name/);
assert.match(bookingScript, /Student grade/);
assert.match(bookingScript, /Subject for this session/);
assert.match(bookingScript, /booking confirmed/);
assert.match(bookingScript, /private booking system/);
assert.doesNotMatch(bookingScript, /no longer appears in/i);
for (const page of [home, listing, profile, booking]) {
  assert.match(page, /posthog-init\.js/);
  assert.match(page, /Tutor names and photos are representative/);
  assert.doesNotMatch(page, />[^<]*(ChatGPT|GPT|artificial intelligence)[^<]*</i);
}

console.log('Site contract checks passed.');
