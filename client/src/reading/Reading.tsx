import { useId, useState, type FormEvent } from "react";
import { Box, Button, Card, Flex, Grid, Heading, Input, Label, Text } from "theme-ui";
import { type Book, type BookNote, errorMessage, useBooks, useCreateBookNote, useUpdateBookNote } from "../api";
import { Loading } from "../components/Loading";
import { RowButton } from "../components/RowButton";
import { TextArea } from "../components/TextArea";
import { BookDialog } from "./BookDialog";
import { NoteDialog } from "./NoteDialog";

export function Reading() {
  const books = useBooks();
  const [adding, setAdding] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);

  if (books.isError) return <Text role="alert">Couldn't load your reading notes. Is the API running?</Text>;
  if (!books.data) return <Loading />;

  const editing = books.data.find((b) => b.id === bookId);
  const note = books.data.flatMap((b) => b.notes).find((n) => n.id === noteId);

  return (
    <Flex sx={{ flexDirection: "column", gap: 5 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Heading as="h1" sx={{ fontSize: 5 }}>Reading</Heading>
        <Button onClick={() => setAdding(true)}>Add book</Button>
      </Flex>

      {books.data.length === 0 && (
        <Card><Text>No books yet. Add the one you're reading, then jot notes as you go.</Text></Card>
      )}
      {books.data.map((b) => (
        <BookCard key={b.id} book={b} onEdit={() => setBookId(b.id)} onOpenNote={setNoteId} />
      ))}

      {adding && <BookDialog onClose={() => setAdding(false)} />}
      {editing && <BookDialog key={editing.id} book={editing} onClose={() => setBookId(null)} />}
      {note && <NoteDialog key={note.id} note={note} onClose={() => setNoteId(null)} />}
    </Flex>
  );
}

interface CardProps {
  book: Book;
  onEdit: () => void;
  onOpenNote: (id: string) => void;
}

function BookCard({ book: b, onEdit, onOpenNote }: CardProps) {
  const takeaways = b.notes.filter((n) => n.isTakeaway);
  const notes = b.notes.filter((n) => !n.isTakeaway).reverse();

  return (
    <Card as="section" aria-labelledby={`book-${b.id}`} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "start", gap: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Heading as="h2" id={`book-${b.id}`} sx={{ fontSize: 3 }}>{b.title}</Heading>
          {b.author && <Text variant="meta">{b.author}</Text>}
        </Box>
        <Button variant="ghost" aria-label={`Edit ${b.title}`} onClick={onEdit}>Edit</Button>
      </Flex>

      <AddNote book={b} />

      {b.notes.length > 0 && (
        <Grid columns={[1, 1, "3fr 2fr"]} gap={[4, 4, 5]} sx={{ alignItems: "start" }}>
          <NoteList
            title="Takeaways"
            notes={takeaways}
            empty="Star a note to keep it here."
            onOpen={onOpenNote}
            sx={{ order: [0, 0, 1] }}
          />
          <NoteList title="Notes" notes={notes} empty="Every note is a takeaway." onOpen={onOpenNote} />
        </Grid>
      )}
    </Card>
  );
}

interface ListProps {
  title: string;
  notes: BookNote[];
  empty: string;
  onOpen: (id: string) => void;
  // Where an `sx` set on this component arrives.
  className?: string;
}

function NoteList({ title, notes, empty, onOpen, className }: ListProps) {
  const id = useId();
  return (
    <Box as="section" aria-labelledby={id} className={className} sx={{ minWidth: 0 }}>
      <Heading as="h3" id={id} sx={{ fontSize: 2 }}>
        {title} <Text variant="meta" sx={{ fontFamily: "body", fontWeight: "body" }}>({notes.length})</Text>
      </Heading>
      {notes.length === 0 ? (
        <Text variant="meta" sx={{ display: "block", mt: 2 }}>{empty}</Text>
      ) : (
        <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>
          {notes.map((n) => <NoteRow key={n.id} note={n} onOpen={() => onOpen(n.id)} />)}
        </Box>
      )}
    </Box>
  );
}

function NoteRow({ note: n, onOpen }: { note: BookNote; onOpen: () => void }) {
  const update = useUpdateBookNote();
  return (
    <Flex as="li" sx={{ alignItems: "start", gap: 1, py: 2, borderTop: "1px solid", borderColor: "muted" }}>
      <Button
        variant="ghost"
        aria-label="Takeaway"
        aria-pressed={n.isTakeaway}
        title={n.isTakeaway ? "Move back to notes" : "Mark as a takeaway"}
        onClick={() => update.mutate({ id: n.id, isTakeaway: !n.isTakeaway })}
        sx={{ flexShrink: 0, width: 32, height: 32, p: 0, fontSize: 2, lineHeight: 1, color: n.isTakeaway ? "accent" : "secondary" }}
      >
        {n.isTakeaway ? "★" : "☆"}
      </Button>
      <RowButton title={n.text} meta={n.location} onClick={onOpen} />
    </Flex>
  );
}

function AddNote({ book }: { book: Book }) {
  const create = useCreateBookNote();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [isTakeaway, setIsTakeaway] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (create.isPending) return;
    e.currentTarget.querySelector("textarea")?.focus();
    create.mutate(
      { bookId: book.id, text, location: location.trim() || null, isTakeaway },
      // The chapter stays filled in for the next note from the same place.
      { onSuccess: () => { setText(""); setIsTakeaway(false); } },
    );
  }

  return (
    <Box as="form" onSubmit={submit}>
      <TextArea
        required
        rows={2}
        aria-label={`Add a note to ${book.title}`}
        placeholder="Jot a note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <Flex sx={{ gap: 3, mt: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Input
          aria-label="Chapter or page"
          placeholder="Chapter or page (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ flex: "1 1 180px", maxWidth: 260 }}
        />
        <Label sx={{ width: "auto", gap: 2, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body", m: 0 }}>
          <input type="checkbox" checked={isTakeaway} onChange={(e) => setIsTakeaway(e.target.checked)} />
          Takeaway
        </Label>
        <Button type="submit" variant="secondary" disabled={create.isPending} title="Ctrl or ⌘ + Enter" sx={{ ml: "auto" }}>
          Add note
        </Button>
      </Flex>
      {create.isError && <Text role="alert" sx={{ color: "alert" }}>{errorMessage(create.error)}</Text>}
    </Box>
  );
}
