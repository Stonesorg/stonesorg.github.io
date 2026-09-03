# ABC Tutoring prototype plan

## Customer decisions captured

- Serve K-12 students, with a middle-school focus, in elementary math through Algebra II, science, and elementary reading.
- Offer both online and in-person sessions.
- Let parents choose a tutor, then an available date and time for a standard 60-minute session.
- Surface each tutor's photo, subjects, grade levels, hourly rate, availability, and brief bio.
- Keep the visual style clean and friendly - neither corporate nor childish.
- Let parents filter by subject, grade level, and session format.
- Remove a reserved time immediately and show a clear confirmation with tutor, date, and time.
- Use representative profiles for this prototype.

## Experience and telemetry contract

The static site will use browser-local booking state so an available time becomes unavailable immediately and remains unavailable after refresh. It will not collect or send parent contact details.

PostHog will receive only these decision-useful events:

| Event | Purpose | Key properties |
| --- | --- | --- |
| `tutor filters applied` | See demand by subject, grade, and format | subject, grade_band, format, results_count |
| `tutor profile viewed` | Rank tutor interest | tutor_name, primary_subject, format |
| `booking started` | Measure movement from interest to booking | tutor_name, primary_subject, format |
| `time selected` | See whether available times meet demand | tutor_name, primary_subject, format, time_of_day |
| `booking confirmed` | Measure completed bookings and conversion | tutor_name, primary_subject, format, rate |
| `booking exited` | Explain booking drop-off without guessing | tutor_name, primary_subject, stage |

All events will include `traffic_type` (`live` or `simulated`) so the simulated traffic is distinguishable in reporting. No parent name, email, phone, or free-form booking note is captured.

## Delivery plan and checks

1. Add failing tests for filtering and immutable slot reservation. Verify with `npm test`.
2. Implement the domain functions and representative tutor data. Re-run the tests green.
3. Build the responsive static directory, filter controls, profile booking panel, confirmation, and local persistence. Verify with browser tests.
4. Add the PostHog snippet and named captures. Verify source-level telemetry contract and real browser interaction.
5. Add a Playwright traffic simulation that runs varied visitor journeys against the local site. Verify the script finishes and records its session summary.
6. Inspect the desktop and mobile experience visually; run the project done-gate.
7. Produce, render, and inspect a Dana-facing PDF presentation that explains the website and useful reporting.

## Boundaries

- This is a GitHub Pages-compatible static prototype, not a payment or calendar integration.
- Copy is written as ordinary family-facing website copy; no user-facing text mentions AI or an "AI prototype."
