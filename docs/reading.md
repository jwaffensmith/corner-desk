# Reading

Notes, takeaways, and wonderings from the books you read for work.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Notes are short entries | A book holds many notes, not one long page | Jotting is quick and each thought can be edited, starred, or deleted on its own. |
| Takeaways | A note you star, not a separate thing | You find out which notes matter after writing them. Starring moves a note between the two lists. |
| Wonderings | A question you file while reading, with room for the book's answer | Kept apart from notes so the open ones are easy to check against the book later. Writing in what the book says marks one answered. |
| One kind per entry | `kind` is note, takeaway, or wondering | The three lists never overlap, and an entry filed in the wrong one can be moved. |
| Chapter or page | Optional free text on each note | Enough to find the passage again without modelling chapters. |
| Order | Books newest first. Notes newest first, takeaways in the order written, open wonderings above answered ones | The book you're reading and the note you just wrote sit at the top. Takeaways read back in the order the book makes its points. Open wonderings are the ones still to look out for. |
| Deleting | Deleting a book deletes its notes | They mean nothing without it. The confirmation says how many will go. |

## Data model

- **Book**: title and optional author.
- **BookNote**: text, optional `location`, a `kind` (`NOTE`, `TAKEAWAY`, or `WONDERING`),
  and an optional `answer` for a wondering. The foreign key includes `userId`, so a note
  can only belong to a book in the same account.

An account can hold 100 books and 1,000 notes of any kind on each (`LIMITS` in `shared`).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/reading/books` | Books newest first, each with its notes in the order written |
| `POST /api/reading/books` | Create |
| `PATCH /api/reading/books/:id` | Update title or author |
| `DELETE /api/reading/books/:id` | Delete the book and its notes |
| `POST /api/reading/books/:bookId/notes` | Add a note, takeaway, or wondering |
| `PATCH /api/reading/notes/:id` | Update any field, including `kind` and `answer` |
| `DELETE /api/reading/notes/:id` | Delete |

## Screen

`/reading` shows a card per book. A box at the top adds a note (Ctrl or ⌘ + Enter also
adds it), with an optional chapter or page and a choice of where to file it: note,
takeaway, or wondering. Below sit the notes and, beside them on wide screens, the
takeaways and wonderings. The star on a note moves it between notes and takeaways.
Selecting any entry opens it to edit, refile, or delete; a wondering also has a field
for what the book says, and once that is filled in it drops below the open ones with
its answer shown.
