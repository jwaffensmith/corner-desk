# Reading

Notes and takeaways from the books you read for work.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Notes are short entries | A book holds many notes, not one long page | Jotting is quick and each thought can be edited, starred, or deleted on its own. |
| Takeaways | A note you star, not a separate thing | You find out which notes matter after writing them. Starring moves a note between the two lists. |
| Chapter or page | Optional free text on each note | Enough to find the passage again without modelling chapters. The add box keeps the last one, since consecutive notes usually come from the same place. |
| Order | Books newest first. Notes newest first, takeaways in the order written | The book you're reading and the note you just wrote sit at the top. Takeaways read back in the order the book makes its points. |
| Deleting | Deleting a book deletes its notes | They mean nothing without it. The confirmation says how many will go. |

## Data model

- **Book**: title and optional author.
- **BookNote**: text, optional `location`, and `isTakeaway`. The foreign key includes
  `userId`, so a note can only belong to a book in the same account.

An account can hold 100 books and 1,000 notes on each (`LIMITS` in `shared`).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/reading/books` | Books newest first, each with its notes in the order written |
| `POST /api/reading/books` | Create |
| `PATCH /api/reading/books/:id` | Update title or author |
| `DELETE /api/reading/books/:id` | Delete the book and its notes |
| `POST /api/reading/books/:bookId/notes` | Add a note |
| `PATCH /api/reading/notes/:id` | Update any field, including `isTakeaway` |
| `DELETE /api/reading/notes/:id` | Delete |

## Screen

`/reading` shows a card per book. A box at the top adds a note (Ctrl or ⌘ + Enter also
adds it), with an optional chapter or page and a checkbox to file it as a takeaway
straight away. Below sit the notes and, beside them on wide screens, the takeaways. The
star on a note moves it between the two; selecting a note opens it to edit or delete.
