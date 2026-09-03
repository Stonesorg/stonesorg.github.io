import { TUTORS } from './data.js';
import { filterTutors, reserveSlot } from './domain.js';

const BOOKED_SLOTS_KEY = 'abc-tutoring-booked-slots';
const trafficType = new URLSearchParams(window.location.search).get('traffic') === 'simulation'
  ? 'simulated'
  : 'live';

const state = {
  filters: { subject: 'all', grade: 'all', format: 'all' },
  tutors: loadTutors(),
  selectedTutorId: null,
  selectedSlotId: null,
  bookingSession: null,
};

const elements = {
  results: document.querySelector('#tutor-results'),
  resultCount: document.querySelector('#result-count'),
  filters: document.querySelector('#tutor-filters'),
  resetFilters: document.querySelector('#reset-filters'),
  profileDialog: document.querySelector('#profile-dialog'),
  profileContent: document.querySelector('#profile-dialog-content'),
  bookingDialog: document.querySelector('#booking-dialog'),
  bookingContent: document.querySelector('#booking-dialog-content'),
};

function loadTutors() {
  try {
    const bookedIds = new Set(JSON.parse(localStorage.getItem(BOOKED_SLOTS_KEY) || '[]'));
    return TUTORS.map((tutor) => ({
      ...tutor,
      availability: tutor.availability.map((slot) => ({ ...slot, booked: bookedIds.has(slot.id) })),
    }));
  } catch {
    return TUTORS.map((tutor) => ({
      ...tutor,
      availability: tutor.availability.map((slot) => ({ ...slot })),
    }));
  }
}

function saveBookedSlots() {
  const bookedIds = state.tutors
    .flatMap((tutor) => tutor.availability)
    .filter((slot) => slot.booked)
    .map((slot) => slot.id);

  localStorage.setItem(BOOKED_SLOTS_KEY, JSON.stringify(bookedIds));
}

function capture(eventName, properties = {}) {
  window.posthog?.capture?.(eventName, { traffic_type: trafficType, ...properties });
}

function displayFormat(formats) {
  return formats.map((format) => (format === 'in-person' ? 'In person' : 'Online')).join(' + ');
}

function availabilityLabel(tutor) {
  const available = tutor.availability.filter((slot) => !slot.booked).length;
  return available === 1 ? '1 time this week' : `${available} times this week`;
}

function getTutor(tutorId) {
  return state.tutors.find((tutor) => tutor.id === tutorId);
}

function getSlot(tutor, slotId) {
  return tutor.availability.find((slot) => slot.id === slotId);
}

function timeOfDay(time) {
  const hour = Number.parseInt(time, 10);
  if (time.includes('PM') && hour < 5) return 'afternoon';
  if (time.includes('PM')) return 'evening';
  return 'morning';
}

function renderTutors() {
  const filteredTutors = filterTutors(state.tutors, state.filters);
  elements.resultCount.textContent = `${filteredTutors.length} ${filteredTutors.length === 1 ? 'tutor' : 'tutors'} available`;

  if (!filteredTutors.length) {
    elements.results.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Try a different match</p>
        <h3>No tutors match those filters yet.</h3>
        <p>Clear one or two filters to see more options.</p>
        <button class="text-button" type="button" data-clear-empty>Clear filters</button>
      </div>`;
    elements.results.querySelector('[data-clear-empty]').addEventListener('click', resetFilters);
    return;
  }

  elements.results.innerHTML = filteredTutors.map((tutor) => `
    <article class="tutor-card">
      <img class="tutor-photo" src="${tutor.image}" alt="${tutor.alt}" width="640" height="640" loading="lazy">
      <div class="tutor-card-body">
        <div class="tutor-card-heading">
          <div>
            <h3>${tutor.name}</h3>
            <p>${tutor.experience}</p>
          </div>
          <p class="rate">$${tutor.rate}<span>/hr</span></p>
        </div>
        <p class="tutor-subjects">${tutor.subjects.join(' · ')}</p>
        <p class="tutor-details">${tutor.grades.join(' & ')} <span aria-hidden="true">•</span> ${displayFormat(tutor.formats)}</p>
        <p class="availability"><span aria-hidden="true">●</span> ${availabilityLabel(tutor)}</p>
        <button class="button button-secondary" type="button" data-view-tutor="${tutor.id}">View profile</button>
      </div>
    </article>`).join('');

  elements.results.querySelectorAll('[data-view-tutor]').forEach((button) => {
    button.addEventListener('click', () => openProfile(button.dataset.viewTutor));
  });
}

function openProfile(tutorId) {
  const tutor = getTutor(tutorId);
  if (!tutor) return;

  state.selectedTutorId = tutorId;
  elements.profileContent.innerHTML = `
    <button class="dialog-close" type="button" data-close-profile aria-label="Close ${tutor.name}'s profile">×</button>
    <div class="profile-layout">
      <img class="profile-photo" src="${tutor.image}" alt="${tutor.alt}" width="640" height="640">
      <div class="profile-copy">
        <p class="eyebrow">Meet your tutor</p>
        <h2 id="profile-title">${tutor.name}</h2>
        <p class="profile-role">${tutor.subjects.join(' + ')} <span aria-hidden="true">•</span> ${tutor.experience}</p>
        <p>${tutor.bio}</p>
        <dl class="profile-facts">
          <div><dt>Grades</dt><dd>${tutor.grades.join(' & ')}</dd></div>
          <div><dt>Format</dt><dd>${displayFormat(tutor.formats)}</dd></div>
          <div><dt>Rate</dt><dd>$${tutor.rate} / 60 minutes</dd></div>
        </dl>
        <p class="availability profile-availability"><span aria-hidden="true">●</span> ${availabilityLabel(tutor)}</p>
        <button class="button button-primary" type="button" data-start-booking>Choose a time</button>
      </div>
    </div>`;
  elements.profileContent.querySelector('[data-close-profile]').addEventListener('click', () => elements.profileDialog.close());
  elements.profileContent.querySelector('[data-start-booking]').addEventListener('click', () => {
    elements.profileDialog.close();
    openBooking(tutorId);
  });
  capture('tutor profile viewed', {
    tutor_name: tutor.name,
    primary_subject: tutor.subjects[0],
    format: displayFormat(tutor.formats),
  });
  elements.profileDialog.showModal();
}

function openBooking(tutorId) {
  const tutor = getTutor(tutorId);
  if (!tutor) return;

  state.selectedTutorId = tutorId;
  state.selectedSlotId = null;
  state.bookingSession = { tutorId, outcome: 'open' };
  capture('booking started', {
    tutor_name: tutor.name,
    primary_subject: tutor.subjects[0],
    format: displayFormat(tutor.formats),
  });
  renderBooking();
  elements.bookingDialog.showModal();
}

function renderBooking() {
  const tutor = getTutor(state.selectedTutorId);
  if (!tutor) return;
  const availableSlots = tutor.availability.filter((slot) => !slot.booked);
  const selectedSlot = state.selectedSlotId ? getSlot(tutor, state.selectedSlotId) : null;

  elements.bookingContent.innerHTML = `
    <button class="dialog-close" type="button" data-close-booking aria-label="Close booking">×</button>
    <p class="eyebrow">Book a 60-minute session</p>
    <h2 id="booking-title">Choose a time with ${tutor.name}</h2>
    <p class="booking-intro">${tutor.subjects.join(' + ')} <span aria-hidden="true">•</span> $${tutor.rate} per hour <span aria-hidden="true">•</span> ${displayFormat(tutor.formats)}</p>
    <div class="slot-list" aria-label="Available times">
      ${availableSlots.length ? availableSlots.map((slot) => `
        <button class="time-slot${slot.id === state.selectedSlotId ? ' is-selected' : ''}" type="button" data-select-slot="${slot.id}" aria-pressed="${slot.id === state.selectedSlotId}">
          <span>${slot.date}</span><strong>${slot.time}</strong>
        </button>`).join('') : '<p class="no-slots">This tutor is fully booked for the times shown. Please choose another tutor.</p>'}
    </div>
    <div class="booking-actions">
      <p>${selectedSlot ? `Selected: <strong>${selectedSlot.date} at ${selectedSlot.time}</strong>` : 'Select an available time to continue.'}</p>
      <button class="button button-primary" type="button" data-confirm-booking ${selectedSlot ? '' : 'disabled'}>Confirm session</button>
    </div>`;

  elements.bookingContent.querySelector('[data-close-booking]').addEventListener('click', () => elements.bookingDialog.close());
  elements.bookingContent.querySelectorAll('[data-select-slot]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedSlotId = button.dataset.selectSlot;
      const slot = getSlot(tutor, state.selectedSlotId);
      state.bookingSession = { tutorId: tutor.id, outcome: 'time-selected' };
      capture('time selected', {
        tutor_name: tutor.name,
        primary_subject: tutor.subjects[0],
        format: displayFormat(tutor.formats),
        time_of_day: timeOfDay(slot.time),
      });
      renderBooking();
    });
  });
  elements.bookingContent.querySelector('[data-confirm-booking]').addEventListener('click', confirmBooking);
}

function confirmBooking() {
  const tutor = getTutor(state.selectedTutorId);
  const slot = tutor && getSlot(tutor, state.selectedSlotId);
  if (!tutor || !slot || slot.booked) return;

  try {
    state.tutors = reserveSlot(state.tutors, tutor.id, slot.id);
    saveBookedSlots();
    state.bookingSession = { tutorId: tutor.id, outcome: 'confirmed' };
    capture('booking confirmed', {
      tutor_name: tutor.name,
      primary_subject: tutor.subjects[0],
      format: displayFormat(tutor.formats),
      rate: tutor.rate,
    });
    renderTutors();
    renderConfirmation(tutor, slot);
  } catch {
    renderBooking();
  }
}

function renderConfirmation(tutor, slot) {
  elements.bookingContent.innerHTML = `
    <button class="dialog-close" type="button" data-close-booking aria-label="Close confirmation">×</button>
    <div class="confirmation-mark" aria-hidden="true">✓</div>
    <p class="eyebrow">Your session is reserved</p>
    <h2 id="booking-title">You’re all set.</h2>
    <p class="confirmation-copy">${tutor.name} is reserved for <strong>${slot.date} at ${slot.time}</strong>.</p>
    <div class="confirmation-summary">
      <span>60 minutes</span><span>${displayFormat(tutor.formats)}</span><span>$${tutor.rate}</span>
    </div>
    <p class="confirmation-note">That time is now held for your family and no longer appears in ${tutor.name}’s available times.</p>
    <button class="button button-primary" type="button" data-close-booking>Done</button>`;
  elements.bookingContent.querySelectorAll('[data-close-booking]').forEach((button) => {
    button.addEventListener('click', () => elements.bookingDialog.close());
  });
}

function resetFilters() {
  state.filters = { subject: 'all', grade: 'all', format: 'all' };
  elements.filters.reset();
  renderTutors();
}

elements.filters.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement)) return;
  state.filters[event.target.name] = event.target.value;
  const matchingTutors = filterTutors(state.tutors, state.filters);
  capture('tutor filters applied', {
    subject: state.filters.subject,
    grade_band: state.filters.grade,
    format: state.filters.format,
    results_count: matchingTutors.length,
  });
  renderTutors();
});

elements.resetFilters.addEventListener('click', resetFilters);

elements.bookingDialog.addEventListener('close', () => {
  if (state.bookingSession && state.bookingSession.outcome !== 'confirmed') {
    const tutor = getTutor(state.bookingSession.tutorId);
    if (tutor) {
      capture('booking exited', {
        tutor_name: tutor.name,
        primary_subject: tutor.subjects[0],
        stage: state.bookingSession.outcome,
      });
    }
  }
  state.bookingSession = null;
  state.selectedSlotId = null;
});

document.querySelector('#find-a-tutor').addEventListener('click', () => {
  document.querySelector('#find-your-tutor').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

renderTutors();
