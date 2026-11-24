# Portfolio

The projects on your portfolio site and what you want to improve about each one.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Improvements are to-dos | A to-do can belong to a project | An improvement needs what a to-do already has (title, notes, due date, done), and a dated one should turn up on the To-do list and beside the week's plan without being entered twice. |
| Backlog | An improvement without a due date shows on `/portfolio` only | A project collects more ideas than you can act on at once. Giving one a due date is how it gets scheduled. |
| Progress | Improvements done out of all listed, per project | No status to keep up to date by hand. |
| Order | Projects in the order they were added | Few enough that sorting isn't worth a control. |
| Deleting | Deleting a project deletes its improvements | They mean nothing without it. The confirmation says how many will go. |

## Data model

- **Project**: name, optional `liveUrl`, `repoUrl`, and notes.
- **Todo** gains an optional `projectId`. The foreign key includes `userId`, so a to-do can
  only join a project in the same account.

The next copy of a weekly to-do stays on the same project. An account can hold 50 projects
(`LIMITS` in `shared`).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/projects` | Projects in the order added, each with all of its to-dos, finished or not |
| `POST /api/projects` | Create |
| `PATCH /api/projects/:id` | Update any field |
| `DELETE /api/projects/:id` | Delete the project and its to-dos |

To-dos join or leave a project through `projectId` on `POST /api/todos` and
`PATCH /api/todos/:id`.

## Screen

`/portfolio` shows a card per project: its links and notes, progress, open improvements
with a field to add another, and the finished ones folded away. The Dashboard lists each
project's progress and open count.

On `/todos`, an improvement with a due date sits in "This week" or "Later" with its
project's name. Undated ones are left out and counted in a line that links to `/portfolio`.
The to-do form has a project picker once there is a project to pick.
