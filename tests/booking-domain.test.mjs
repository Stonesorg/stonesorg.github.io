import test from 'node:test';
import assert from 'node:assert/strict';

import { filterTutors, reserveSlot } from '../assets/js/domain.js';

const tutors = [
  {
    id: 'maya',
    subjects: ['Math', 'Science'],
    grades: ['K-5', '6-8'],
    formats: ['online', 'in-person'],
    availability: [
      { id: 'maya-mon-4', date: 'Mon, Oct 5', time: '4:00 PM', booked: false },
      { id: 'maya-wed-5', date: 'Wed, Oct 7', time: '5:00 PM', booked: false },
    ],
  },
  {
    id: 'caleb',
    subjects: ['Reading'],
    grades: ['K-5'],
    formats: ['online'],
    availability: [],
  },
  {
    id: 'nina',
    subjects: ['Math'],
    grades: ['9-12'],
    formats: ['in-person'],
    availability: [],
  },
];

test('filterTutors matches all active subject, grade, and format filters', () => {
  assert.deepEqual(
    filterTutors(tutors, { subject: 'Math', grade: '6-8', format: 'online' }).map((tutor) => tutor.id),
    ['maya'],
  );

  assert.deepEqual(
    filterTutors(tutors, { subject: 'Reading', grade: 'all', format: 'all' }).map((tutor) => tutor.id),
    ['caleb'],
  );
});

test('reserveSlot marks exactly one selected time unavailable without changing the source data', () => {
  const reserved = reserveSlot(tutors, 'maya', 'maya-wed-5');

  assert.equal(tutors[0].availability[1].booked, false);
  assert.equal(reserved[0].availability[0].booked, false);
  assert.equal(reserved[0].availability[1].booked, true);
  assert.equal(reserved[1], tutors[1]);
});

test('reserveSlot rejects an already-reserved or unknown slot', () => {
  const reserved = reserveSlot(tutors, 'maya', 'maya-mon-4');

  assert.throws(() => reserveSlot(reserved, 'maya', 'maya-mon-4'), /not available/);
  assert.throws(() => reserveSlot(tutors, 'maya', 'missing-slot'), /not found/);
});
