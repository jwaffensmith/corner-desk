# Interview Prep

A self-paced, eight-month curriculum across five parallel learning tracks, with honest
progress tracking. Single user, localhost only.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Pacing | Self-paced | The current week is the lowest-numbered week not marked complete. You move on with "advance," so time away never creates overdue work. |
| Tracks | Table, not enum | "Agentic doesn't count toward the 100 hours" is the `countsTowardStudy` flag, and a sixth track is a data change. |
| Completion | `TODO` / `DONE` / `SKIPPED` | Completion records that the work happened. Proficiency is measured separately (confidence now; assessments later). Skipping removes an assignment from the plan instead of leaving it unfinished. |
| Time | `actualMin` per assignment | Checking off fills it with the estimate if empty, so one click still counts. Weekly consistency is approximated from completion dates. |
| Curriculum | Imported as JSON, never hardcoded | The curriculum is written and refined outside the app. |

## Data model

- **Track**: slug, name, weekly target, `countsTowardStudy`, order. Five are seeded by `prisma/seed.ts`.
- **PrepSettings**: a single row holding the hours target (100), weekly target and stretch (180 / 240 min), and assessment cadence (4 weeks).
- **Week**: `number` (unique, always contiguous from 1), title, milestone, notes, `completedAt`.
- **Assignment**: a stable `key`; content fields (title, description, objectives, estimate, resources); progress fields (status, `completedAt`, `actualMin`, confidence 1–5, notes); `isSupplementary`.

An assignment "has progress" when it is done, or has time, confidence, or notes logged.
Deletes that would lose progress return `409` unless `?force=true`.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/prep/current` | Current week with assignments, this week's study minutes, next assessment and milestone |
| `POST /api/prep/advance` | `{ carryOver: id[] }` completes the current week and moves the chosen unfinished assignments to the next |
| `GET /api/prep/progress` | Planned vs. done, study vs. workplace minutes, per-track totals, last 12 calendar weeks |
| `GET/PATCH /api/prep/settings` | Targets and cadence |
| `/api/tracks` | List, create, update, delete (blocked while a track has assignments) |
| `/api/weeks` | List (with assignments), get, create (`number` inserts at that position), update (`completed: boolean` to close or reopen), delete |
| `PUT /api/weeks/order` | `{ ids }`, every week in its new order |
| `PUT /api/weeks/:id/assignments/order` | `{ ids }`, every assignment in the week in its new order |
| `/api/assignments` | Create, get, update (including `status`, or `weekId` to reschedule), delete |
| `POST /api/curriculum/import[?dryRun=true]` | Validate and merge a curriculum file; returns the change plan |
| `GET /api/curriculum/export[?progress=true]` | The current curriculum in the import format; with `progress=true`, a full backup |

## Curriculum file

```json
{
  "settings": { "targetHours": 100 },
  "weeks": [
    {
      "number": 1,
      "title": "Foundations",
      "milestone": "Write a loop-heavy function without autocomplete",
      "assignments": [
        {
          "key": "w01-js-closures",
          "track": "js-ts",
          "title": "Closures from scratch",
          "description": "Implement once, memoize, and a counter factory by hand.",
          "objectives": ["Explain lexical scope", "Spot a stale closure"],
          "estimatedMin": 45,
          "resources": [{ "title": "MDN: Closures", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures" }]
        }
      ]
    }
  ]
}
```

Track slugs: `js-ts`, `cs`, `leetcode`, `system-design`, `agentic`.

**Merge rules.** Re-importing is safe at any point in the curriculum.

- Weeks match by `number`; omitted week fields are left unchanged.
- Assignments match by `key`, and only content fields are written. Status, time, confidence, and notes are never touched, and an existing assignment stays in whatever week it has been moved to.
- An assignment the file drops from a week it lists is deleted only if it has no progress; otherwise it is kept and reported.
- Weeks the file does not mention, and assignments added in the app, are left alone.
- Week numbers must stay contiguous, and keys must be unique across the file.

**Backups.** `export?progress=true` adds each assignment's `progress` (status, completion
date, time, confidence, notes) and `isSupplementary`, and each week's `completedAt`. Importing
a file that carries these restores them, replacing what is in the database. A plain plan
file has none of them, so it never touches progress.

Run with `?dryRun=true` first to see what will be created, updated, removed, and kept.

## Later phases

Each is its own stacked PR: the Prep UI; workplace learning and the agentic journal;
assessments; LeetCode problem and attempt tracking; trend views.
