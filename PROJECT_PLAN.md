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
| `tutor filters applied` | See demand by subject, grade, and format | requested_subject, grade_band, format, results_count |
| `tutor profile viewed` | Rank tutor interest | tutor_name, offered_subject, format |
| `booking started` | Measure movement from interest to booking | selected_tutor_id |
| `time selected` | See whether available times meet demand | tutor_name, offered_subject, time_of_day |
| `booking confirmed` | Measure completed bookings and conversion | tutor_name, offered_subject, requested_subject, format, rate |
| `booking exited` | Explain booking drop-off without guessing | selected_tutor_id, stage |

All events will include `traffic_type` (`live` or `simulated`), `referral_category`, and available `utm_source`, `utm_medium`, and `utm_campaign` properties so simulated traffic and Facebook-parent-group visits are distinguishable. No parent name, email, phone, student name, or free-form booking note is captured.

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

## V2 demo plan — Dana's expanded brief

The public demo will add a mobile-first home, tutor listing, tutor profile, and booking path; six representative profiles (four math, one science, one reading); a parent/student form; source-aware analytics; and clearer confirmation language.

The browser demo will keep a selected slot unavailable on that browser and will render a booking confirmation. Parent name, email, and student details will never be sent to PostHog, written to a remote service, or persisted by the demo. The interface will state plainly that live bookings require a private backend before launch.

For a live service, a server-side booking operation must atomically reserve an availability slot, store the booking in a private data store, and only then notify Dana and the parent. A future staff-only admin experience can manage tutor profiles and availability. The current analytics will add requested subject and UTM/referral properties to help evaluate Facebook-parent-group traffic and hiring demand without collecting family data.
