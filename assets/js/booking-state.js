import { TUTORS } from './data.js';
import { reserveSlot } from './domain.js';

const BOOKED_SLOTS_KEY = 'abc-tutoring-demo-booked-slots';

function bookedSlotIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BOOKED_SLOTS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function loadDemoTutors() {
  const bookedIds = bookedSlotIds();
  return TUTORS.map((tutor) => ({
    ...tutor,
    availability: tutor.availability.map((slot) => ({ ...slot, booked: bookedIds.has(slot.id) })),
  }));
}

export function reserveDemoSlot(tutorId, slotId) {
  const reservedTutors = reserveSlot(loadDemoTutors(), tutorId, slotId);
  const reservedIds = reservedTutors
    .flatMap((tutor) => tutor.availability)
    .filter((slot) => slot.booked)
    .map((slot) => slot.id);

  localStorage.setItem(BOOKED_SLOTS_KEY, JSON.stringify(reservedIds));
  return reservedTutors;
}
