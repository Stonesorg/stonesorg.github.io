import { capture, capturePageView } from './analytics.js';
import { loadDemoTutors } from './booking-state.js';

const tutorId = new URLSearchParams(window.location.search).get('tutor');
const tutor = loadDemoTutors().find((item) => item.id === tutorId);
const profile = document.querySelector('#tutor-profile');

function displayFormat(formats) {
  return formats.map((format) => (format === 'in-person' ? 'In person' : 'Online')).join(' + ');
}

if (!tutor) {
  profile.innerHTML = '<div class="empty-state"><h1>That tutor is not available.</h1><p>Choose a tutor from the full team list.</p><a class="button button-primary" href="tutors.html">Meet our tutors</a></div>';
} else {
  const available = tutor.availability.filter((slot) => !slot.booked);
  profile.innerHTML = `
    <div class="profile-layout profile-page-layout">
      <img class="profile-photo" src="${tutor.image}" alt="${tutor.alt}" width="640" height="640">
      <div class="profile-copy">
        <p class="eyebrow">Meet your tutor</p>
        <h1>${tutor.name}</h1>
        <p class="profile-role">${tutor.subjects.join(' + ')} <span aria-hidden="true">•</span> ${tutor.experience}</p>
        <p>${tutor.bio}</p>
        <dl class="profile-facts"><div><dt>Grades</dt><dd>${tutor.grades.join(' & ')}</dd></div><div><dt>Format</dt><dd>${displayFormat(tutor.formats)}</dd></div><div><dt>Rate</dt><dd>$${tutor.rate} / 60 minutes</dd></div></dl>
        <section class="available-preview" aria-labelledby="times-title"><h2 id="times-title">Available times</h2>${available.length ? `<ul>${available.map((slot) => `<li>${slot.date} at ${slot.time}</li>`).join('')}</ul>` : '<p>This tutor is fully booked for the times shown.</p>'}</section>
        <a class="button button-primary" href="booking.html?tutor=${tutor.id}">Book with ${tutor.name.split(' ')[0]}</a>
      </div>
    </div>`;
  capturePageView('tutor profile');
  capture('tutor profile viewed', { tutor_name: tutor.name, offered_subject: tutor.subjects[0], format: displayFormat(tutor.formats) });
}
