# ABC Tutoring prototype

A friendly, mobile-first static demonstration for a K-12 tutoring service. Families can move from a home page to a six-tutor listing, read a profile, and complete a 60-minute booking form. The form asks for the parent’s name and email, the student’s first name and grade, and the session subject. No payment is taken; Dana invoices families directly.

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

This runs the booking-domain checks, static-content checks, and an actual phone-sized browser journey. The browser test confirms six-tutor filtering, the full form, a friendly confirmation, removal of the reserved demo slot after reload, Facebook attribution, and that neither analytics nor browser storage contains family details.

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
| What subjects are in demand? | `tutor filters applied` and `booking confirmed`, both by `requested_subject` |
| Is the Facebook parents’ group working? | Any event by `utm_source`, `utm_campaign`, or `referral_category` |

The dashboard configuration is documented in [ANALYTICS_DASHBOARD.md](ANALYTICS_DASHBOARD.md). Exclude `traffic_type = simulated` when reviewing live performance.

## Deliverables

- [Customer presentation PDF](output/pdf/abc-tutoring-presentation.pdf)
- [Editable presentation](output/abc-tutoring-prototype.pptx)
- [Customer decisions and delivery plan](PROJECT_PLAN.md)

## Prototype boundary

This is a local-only demo. It stores only the reserved slot ID in that browser; it does not transmit, retain, or analyse the form details. A production rollout needs a private backend that atomically reserves shared availability before it stores parent/student details or sends notifications. It also needs a private staff area for managing tutors and times.
