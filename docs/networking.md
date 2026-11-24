# Networking

A log of the networking events you sign up for and attend, measured against a monthly goal.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Status | `REGISTERED` / `ATTENDED` / `SKIPPED` | Signing up and showing up are different things, and only attending counts toward the goal. Skipping keeps the record without counting it. |
| Goal | Events attended per calendar month, default 1 | The month an event counts toward is the month of its date. |
| Dates | Calendar days (`YYYY-MM-DD`), no time of day | An event belongs to a day wherever you are, so "this month" and "upcoming" are worked out in the browser's time zone. |
| History | Starts at the first tracked event, up to 12 months | Months before the tracker existed don't read as misses. |

## Data model

- **NetworkingEvent**: name, `date`, optional location, link, and notes, and a status.
- **NetworkingSettings**: one row per user holding `eventsPerMonth`.

An account can hold 500 events (`LIMITS` in `shared`).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/networking` | `{ eventsPerMonth, events }`, events newest first |
| `PATCH /api/networking/settings` | `{ eventsPerMonth }` |
| `POST /api/networking/events` | Create; `status` defaults to `REGISTERED` |
| `PATCH /api/networking/events/:id` | Update any field, including `status` |
| `DELETE /api/networking/events/:id` | Delete |

## Screen

`/networking` shows this month against the goal, then three lists: events whose date has
passed without an answer ("Did you go?"), upcoming sign-ups, and past events.
