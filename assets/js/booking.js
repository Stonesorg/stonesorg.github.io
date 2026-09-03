import { capture, capturePageView } from './analytics.js';
import { loadDemoTutors, reserveDemoSlot } from './booking-state.js';

const tutorId = new URLSearchParams(window.location.search).get('tutor');
const bookingRoot = document.querySelector('#booking-root');
let bookingConfirmed = false;

function displayFormat(formats) {
  return formats.map((format) => (format === 'in-person' ? 'In person' : 'Online')).join(' + ');
}

function renderBooking(message = '') {
  const tutor = loadDemoTutors().find((item) => item.id === tutorId);
  if (!tutor) {
    bookingRoot.innerHTML = '<div class="empty-state"><h1>Choose a tutor first.</h1><p>Start with the team list to find the right fit.</p><a class="button button-primary" href="tutors.html">Meet our tutors</a></div>';
    return;
  }
  const available = tutor.availability.filter((slot) => !slot.booked);
  bookingRoot.innerHTML = `
    <section class="booking-layout" aria-labelledby="booking-title">
      <aside class="booking-summary"><img src="${tutor.image}" alt="${tutor.alt}" width="640" height="640"><p class="eyebrow">Your selected tutor</p><h2>${tutor.name}</h2><p>${tutor.subjects.join(' + ')} <span aria-hidden="true">•</span> $${tutor.rate} / hour</p><p>${displayFormat(tutor.formats)}</p></aside>
      <div class="booking-form-card"><p class="eyebrow">Book a 60-minute session</p><h1 id="booking-title">A few details, then you’re set.</h1><p class="booking-intro">No online payment today. Dana will invoice you directly.</p>${message ? `<p class="form-message" role="alert">${message}</p>` : ''}
        <form id="booking-form">
          <div class="form-grid"><label>Parent or guardian name<input name="parentName" autocomplete="name" required></label><label>Email address<input name="parentEmail" type="email" autocomplete="email" required></label><label>Student first name<input name="studentName" autocomplete="given-name" required></label><label>Student grade<select name="studentGrade" required><option value="">Select grade level</option><option value="K-5">K-5</option><option value="6-8">6-8</option><option value="9-12">9-12</option></select></label><label class="form-wide">Subject for this session<select name="requestedSubject" required>${tutor.subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join('')}</select></label></div>
          <fieldset class="slot-fieldset"><legend>Choose an available time</legend>${available.length ? available.map((slot) => `<label class="slot-option"><input type="radio" name="slot" value="${slot.id}" aria-label="${slot.date} ${slot.time}" required><span><strong>${slot.date} at ${slot.time}</strong><small>60-minute ${displayFormat(tutor.formats).toLowerCase()} session</small></span></label>`).join('') : '<p class="no-slots">This tutor is fully booked for the times shown. Please choose another tutor.</p>'}</fieldset>
          <p class="demo-boundary">Demo note: the details entered here are not transmitted or saved. Before launch, this form must connect to a private booking system that sends notifications and keeps availability shared.</p>
          <button class="button button-primary" type="submit" ${available.length ? '' : 'disabled'}>Reserve demo session</button>
        </form>
      </div>
    </section>`;
  const bookingForm = bookingRoot.querySelector('#booking-form');
  bookingForm?.addEventListener('submit', submitBooking);
  bookingForm?.querySelectorAll('input[name="slot"]').forEach((input) => {
    input.addEventListener('change', () => {
      const selected = tutor.availability.find((slot) => slot.id === input.value);
      if (selected) capture('time selected', { tutor_name: tutor.name, offered_subject: tutor.subjects[0], time_of_day: selected.time.includes('PM') ? 'afternoon-or-evening' : 'morning' });
    });
  });
}

function submitBooking(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const tutor = loadDemoTutors().find((item) => item.id === tutorId);
  const slot = tutor?.availability.find((item) => item.id === data.get('slot'));
  if (!tutor || !slot || slot.booked) {
    renderBooking('That demo time was just selected in this browser. Please choose another time.');
    return;
  }

  reserveDemoSlot(tutor.id, slot.id);
  bookingConfirmed = true;
  capture('booking confirmed', {
    tutor_name: tutor.name,
    offered_subject: tutor.subjects[0],
    requested_subject: data.get('requestedSubject'),
    format: displayFormat(tutor.formats),
    rate: tutor.rate,
  });
  bookingRoot.innerHTML = `
    <section class="confirmation-page"><div class="confirmation-mark" aria-hidden="true">✓</div><p class="eyebrow">Your demo session is reserved</p><h1>You’re all set.</h1><p class="confirmation-copy">You’re booked with <strong>${tutor.name} for ${slot.date} at ${slot.time}</strong>.</p><div class="confirmation-summary"><span>60 minutes</span><span>${displayFormat(tutor.formats)}</span><span>$${tutor.rate}</span></div><p class="confirmation-note">Dana will confirm the next steps and invoice information before the live service launches.</p><p class="demo-boundary">This demo does not send email or keep the details you entered. A private backend will be required before accepting real bookings.</p><a class="button button-primary" href="tutors.html">Return to tutors</a></section>`;
}

capturePageView('booking');
capture('booking started', { selected_tutor_id: tutorId || 'none' });
renderBooking();

window.addEventListener('pagehide', () => {
  if (!bookingConfirmed && tutorId) capture('booking exited', { selected_tutor_id: tutorId, stage: 'details' });
});
