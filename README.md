# ABC Tutoring prototype

A friendly, static prototype for a K-12 tutoring service. Families can narrow tutors by subject, grade level, and session format; open a detailed profile; and reserve a 60-minute time. A confirmed time is removed immediately and remains unavailable after a page reload on the same device.

## Run it locally

```sh
npm install
npm run serve
```

Open the local address printed by the server. The project is plain HTML, CSS, and JavaScript, so it is also ready to serve from the root of a GitHub Pages repository.

## Verify it

```sh
sh .codex/verify.sh
```

This runs the booking-domain checks, static-content checks, and an actual browser booking journey. The browser test confirms filtering, confirmation details, removal of the reserved time, and persistence after a reload.

## Demonstrate the analytics

```sh
npm run simulate:traffic
```

The script runs four independent browser journeys against a local server and sends events to the configured PostHog project. It labels every generated event with `traffic_type: simulated`, so demo data can be filtered out of future live reporting. The latest run is recorded in [output/traffic-simulation-summary.json](output/traffic-simulation-summary.json).

The implementation intentionally avoids collecting parent names, email addresses, or student details. It records only the decisions Dana asked to understand:

| Question | Events / properties |
| --- | --- |
| Which tutors attract attention? | `tutor profile viewed` by `tutor_name` |
| Do families book or leave? | `booking started` → `time selected` → `booking confirmed`, with `booking exited` for deliberate exits |
| What subjects are in demand? | `tutor filters applied` by `subject`, plus confirmed bookings by `primary_subject` |

Suggested PostHog dashboard cards are a tutor-profile-view trend (broken down by tutor), a booking funnel, and a confirmed-booking trend broken down by subject. Exclude `traffic_type = simulated` when reviewing live performance.

## Deliverables

- [Customer presentation PDF](output/pdf/abc-tutoring-presentation.pdf)
- [Editable presentation](output/abc-tutoring-prototype.pptx)
- [Customer decisions and delivery plan](PROJECT_PLAN.md)

## Prototype boundary

Bookings are intentionally stored in the browser with `localStorage`, which makes the prototype demonstrable without a backend. A production rollout needs a shared scheduling source of truth, calendar availability, and an appropriate parent-contact flow.
