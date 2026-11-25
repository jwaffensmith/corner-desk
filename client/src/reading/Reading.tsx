import { useId, useState, type FormEvent } from "react";
import { Box, Button, Card, Flex, Grid, Heading, Input, Text } from "theme-ui";
import type { BookNoteKind } from "@cornerdesk/shared";
import { type Book, type BookNote, errorMessage, useBooks, useCreateBookNote, useUpdateBookNote } from "../api";
import { Loading } from "../components/Loading";
import { RowButton } from "../components/RowButton";
import { TextArea } from "../components/TextArea";
import { BookDialog } from "./BookDialog";
import { KindPicker } from "./KindPicker";
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
  const takeaways = b.notes.filter((n) => n.kind === "TAKEAWAY");
  const notes = b.notes.filter((n) => n.kind === "NOTE").reverse();
  const wonderings = b.notes.filter((n) => n.kind === "WONDERING").reverse();
  const open = wonderings.filter((n) => !n.answer);
  const answered = wonderings.filter((n) => n.answer);

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
          <Flex sx={{ flexDirection: "column", gap: 4, minWidth: 0, order: [0, 0, 1] }}>
            <NoteList title="Takeaways" notes={takeaways} empty="Star a note to keep it here." onOpen={onOpenNote} />
            <NoteList
              title="Wonderings"
              count={answered.length > 0 ? `${open.length} open` : undefined}
              notes={[...open, ...answered]}
              empty="File a question here, then come back once the book answers it."
              onOpen={onOpenNote}
            />
          </Flex>
          <NoteList
            title="Notes"
            notes={notes}
            empty={takeaways.length > 0 ? "Every note is a takeaway." : "No notes yet."}
            onOpen={onOpenNote}
          />
        </Grid>
      )}
    </Card>
  );
}

interface ListProps {
  title: string;
  count?: string;
  notes: BookNote[];
  empty: string;
  onOpen: (id: string) => void;
}

function NoteList({ title, count, notes, empty, onOpen }: ListProps) {
  const id = useId();
  return (
    <Box as="section" aria-labelledby={id} sx={{ minWidth: 0 }}>
      <Heading as="h3" id={id} sx={{ fontSize: 2 }}>
        {title} <Text variant="meta" sx={{ fontFamily: "body", fontWeight: "body" }}>({count ?? notes.length})</Text>
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
  const starred = n.kind === "TAKEAWAY";
  return (
    <Flex as="li" sx={{ alignItems: "start", gap: 1, py: 2, borderTop: "1px solid", borderColor: "muted" }}>
      {n.kind === "WONDERING" ? (
        <RowButton
          title={n.text}
          dimmed={!!n.answer}
          meta={n.answer ? (
            <>
              {n.location}
              <Text sx={{ display: "block", fontSize: 1, color: "text", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                Answer: {n.answer}
              </Text>
            </>
          ) : n.location}
          onClick={onOpen}
        />
      ) : (
        <>
          <Button
            variant="ghost"
            aria-label="Takeaway"
            aria-pressed={starred}
            title={starred ? "Move back to notes" : "Mark as a takeaway"}
            onClick={() => update.mutate({ id: n.id, kind: starred ? "NOTE" : "TAKEAWAY" })}
            sx={{ flexShrink: 0, width: 32, height: 32, p: 0, fontSize: 2, lineHeight: 1, color: starred ? "accent" : "secondary" }}
          >
            {starred ? "★" : "☆"}
          </Button>
          <RowButton title={n.text} meta={n.location} onClick={onOpen} />
        </>
      )}
    </Flex>
  );
}

function AddNote({ book }: { book: Book }) {
  const create = useCreateBookNote();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [kind, setKind] = useState<BookNoteKind>("NOTE");
  const wondering = kind === "WONDERING";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (create.isPending) return;
    e.currentTarget.querySelector("textarea")?.focus();
    create.mutate(
      { bookId: book.id, text, location: location.trim() || null, kind },
      { onSuccess: () => { setText(""); setLocation(""); setKind("NOTE"); } },
    );
  }

  return (
    <Box as="form" onSubmit={submit}>
      <TextArea
        required
        rows={2}
        aria-label={`Add a ${wondering ? "wondering" : "note"} to ${book.title}`}
        placeholder={wondering ? "What are you wondering?" : "Jot a note"}
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
        <KindPicker value={kind} onChange={setKind} />
        <Button type="submit" variant="secondary" disabled={create.isPending} title="Ctrl or ⌘ + Enter" sx={{ ml: "auto" }}>
          {wondering ? "Add wondering" : "Add note"}
        </Button>
      </Flex>
      {create.isError && <Text role="alert" sx={{ color: "alert" }}>{errorMessage(create.error)}</Text>}
    </Box>
  );
}
