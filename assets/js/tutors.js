import { capture, capturePageView } from './analytics.js';
import { loadDemoTutors } from './booking-state.js';
import { filterTutors } from './domain.js';

const filters = document.querySelector('#tutor-filters');
const results = document.querySelector('#tutor-results');
const resultCount = document.querySelector('#result-count');
const resetButton = document.querySelector('#reset-filters');
const state = { subject: 'all', grade: 'all', format: 'all' };

function displayFormat(formats) {
  return formats.map((format) => (format === 'in-person' ? 'In person' : 'Online')).join(' + ');
}

function availabilityLabel(tutor) {
  const available = tutor.availability.filter((slot) => !slot.booked).length;
  return available === 1 ? '1 time this week' : `${available} times this week`;
}

function renderTutors() {
  const matchingTutors = filterTutors(loadDemoTutors(), state);
  resultCount.textContent = `${matchingTutors.length} ${matchingTutors.length === 1 ? 'tutor' : 'tutors'} available`;

  if (!matchingTutors.length) {
    results.innerHTML = '<div class="empty-state"><p class="eyebrow">Try a different match</p><h2>No tutors match those filters yet.</h2><p>Clear one or two filters to see more options.</p></div>';
    return;
  }

  results.innerHTML = matchingTutors.map((tutor) => `
    <article class="tutor-card">
      <img class="tutor-photo" src="${tutor.image}" alt="${tutor.alt}" width="640" height="640" loading="lazy">
      <div class="tutor-card-body">
        <div class="tutor-card-heading"><div><h2>${tutor.name}</h2><p>${tutor.experience}</p></div><p class="rate">$${tutor.rate}<span>/hr</span></p></div>
        <p class="tutor-subjects">${tutor.subjects.join(' · ')}</p>
        <p class="tutor-details">${tutor.grades.join(' & ')} <span aria-hidden="true">•</span> ${displayFormat(tutor.formats)}</p>
        <p class="availability"><span aria-hidden="true">●</span> ${availabilityLabel(tutor)}</p>
        <a class="button button-secondary" href="tutor.html?tutor=${tutor.id}" data-tutor-link="${tutor.id}">See profile</a>
      </div>
    </article>`).join('');

}

filters.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement)) return;
  state[event.target.name] = event.target.value;
  const matchingTutors = filterTutors(loadDemoTutors(), state);
  capture('tutor filters applied', {
    requested_subject: state.subject,
    grade_band: state.grade,
    format: state.format,
    results_count: matchingTutors.length,
  });
  renderTutors();
});

resetButton.addEventListener('click', () => {
  Object.assign(state, { subject: 'all', grade: 'all', format: 'all' });
  filters.reset();
  renderTutors();
});

capturePageView('tutor listing');
renderTutors();
