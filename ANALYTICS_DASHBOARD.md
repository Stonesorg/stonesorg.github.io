# ABC Tutoring PostHog dashboard

## Access

No saved or shared dashboard exists yet. Sign in to PostHog at <https://us.posthog.com/login?next=/project/591454/dashboard>, then create a dashboard named **ABC Tutoring - Demo** in project 591454.

The prototype can send events to PostHog, but an ingestion token cannot create or share dashboards.

## Four cards for Dana

1. **Tutor attention** - Trend of `tutor profile viewed`, broken down by `tutor_name`. This shows which tutor profiles draw interest.
2. **Booking journey** - Funnel: `tutor profile viewed` → `booking started` → `time selected` → `booking confirmed`. Break down by `offered_subject` or `tutor_name` to see where families leave.
3. **Subjects families seek** - Trend of `tutor filters applied`, broken down by `requested_subject`; compare it with `booking confirmed` broken down by the same property. This is the hiring signal Dana asked for.
4. **Facebook parents' group** - Trend of `booking confirmed` filtered to `utm_source = facebook`, with a breakdown by `utm_campaign`. Link Facebook posts with `?utm_source=facebook&utm_medium=social&utm_campaign=parents-group`.

## Demo data and privacy

The traffic script produces four labelled sample journeys. Apply `traffic_type = simulated` while demonstrating the dashboard, then exclude that value when reviewing future live traffic.

The intentional events record tutoring choices and source information only. Parent and student form values are neither captured in PostHog nor written to browser storage. Keep PostHog autocapture disabled.

## Before production

Use a private booking backend as the source of truth. It must reserve a slot atomically, retain booking details separately from analytics, and notify Dana only after the reservation succeeds. Do not accept a real booking through this static demo.
