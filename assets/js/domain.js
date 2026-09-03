export function filterTutors(tutors, { subject = 'all', grade = 'all', format = 'all' } = {}) {
  return tutors.filter((tutor) => {
    const subjectMatches = subject === 'all' || tutor.subjects.includes(subject);
    const gradeMatches = grade === 'all' || tutor.grades.includes(grade);
    const formatMatches = format === 'all' || tutor.formats.includes(format);

    return subjectMatches && gradeMatches && formatMatches;
  });
}

export function reserveSlot(tutors, tutorId, slotId) {
  const tutor = tutors.find((candidate) => candidate.id === tutorId);

  if (!tutor) {
    throw new Error(`Tutor ${tutorId} was not found.`);
  }

  const slot = tutor.availability.find((candidate) => candidate.id === slotId);

  if (!slot) {
    throw new Error(`Slot ${slotId} was not found.`);
  }

  if (slot.booked) {
    throw new Error(`Slot ${slotId} is not available.`);
  }

  return tutors.map((candidate) => {
    if (candidate.id !== tutorId) {
      return candidate;
    }

    return {
      ...candidate,
      availability: candidate.availability.map((candidateSlot) => (
        candidateSlot.id === slotId ? { ...candidateSlot, booked: true } : candidateSlot
      )),
    };
  });
}
