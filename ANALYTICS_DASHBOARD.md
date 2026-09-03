# ABC Tutoring PostHog dashboard

## Access

The [ABC Tutoring - Demo](https://us.posthog.com/project/591454/dashboard/2060822) dashboard is configured with a public share link. It contains only aggregate, non-PII demonstration metrics. Before production, review **Manage sharing** in PostHog and restrict access to the team unless a public dashboard is specifically wanted.

## Live cards for Dana

1. **Tutor attention** - Trend of `tutor profile viewed`, broken down by `tutor_name`. This shows which tutor profiles draw interest.
2. **Booking journey** - Funnel: `tutor profile viewed` → `booking started` → `time selected` → `booking confirmed`. It makes the point where families leave visible without collecting their form details.
3. **Subjects families seek** - Trend of `tutor filters applied`, broken down by `requested_subject`. This is the hiring signal Dana asked for.

Each card and the dashboard itself include a plain-language description of the question it answers, how to interpret the demo sample, and the decision it can support.

## Referral tracking

The site records `utm_source`, `utm_medium`, `utm_campaign`, and a simplified `referral_category` on intentional events. Link Facebook posts with `?utm_source=facebook&utm_medium=social&utm_campaign=parents-group`; those visits can be compared in PostHog once live browser sessions begin arriving. The bundled traffic simulation sends direct event batches, so it is intentionally not used to demonstrate session-level referral attribution.

## Demo data and privacy

The traffic script produces four labelled sample journeys. Apply `traffic_type = simulated` while demonstrating the dashboard, then exclude that value when reviewing future live traffic.

The intentional events record tutoring choices and source information only. Parent and student form values are neither captured in PostHog nor written to browser storage. Keep PostHog autocapture disabled.

## Before production

Use a private booking backend as the source of truth. It must reserve a slot atomically, retain booking details separately from analytics, and notify Dana only after the reservation succeeds. Do not accept a real booking through this static demo.
