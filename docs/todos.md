# To-do

A list for what sits outside the curriculum: one-off tasks like a book to read, and recurring
commitments like a program's weekly responsibilities.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Separate from assignments | Its own table and screen | To-dos follow the calendar; curriculum weeks are self-paced and never fall behind. |
| Due date | Optional calendar day (`YYYY-MM-DD`) | Plenty of to-dos have no deadline. A past date is shown as "was due", not hidden. |
| Category | Optional free text | Enough to tell "Leadership program" from the rest without managing a list of categories. |
| Repeats | Weekly only | Finishing a weekly to-do adds the same one for the following week and leaves the finished one as a record. |

## Data model

- **Todo**: title, optional notes, `category`, and `dueDate`; `repeatsWeekly`; `completedAt`.

**Weekly repeats.** The copy keeps the title, notes, and category. Its due date is a week
after the finished one's, moved on by whole weeks until it is after today, so it keeps its
weekday and finishing late never produces a to-do that is already past due. With no due date
it is due a week from today. The repeat moves to the copy, so reopening and finishing the
old one again doesn't add another.

An account can hold 300 open to-dos (`LIMITS` in `shared`).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/todos` | Open to-dos by due date (undated last), then the 50 most recently finished |
| `POST /api/todos` | Create |
| `PATCH /api/todos/:id` | Update any field; `completed: boolean` finishes or reopens |
| `DELETE /api/todos/:id` | Delete |

## Screen

`/todos` groups open to-dos into "This week" (due by Sunday, including anything past due),
"Later", and "Anytime" (no date), with recently finished ones folded away below.
