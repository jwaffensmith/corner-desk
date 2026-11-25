import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Text } from "theme-ui";
import { type Book, errorMessage, useCreateBook, useDeleteBook, useUpdateBook } from "../api";
import { Dialog } from "../components/Dialog";

export function BookDialog({ book, onClose }: { book?: Book; onClose: () => void }) {
  const create = useCreateBook();
  const update = useUpdateBook();
  const remove = useDeleteBook();
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { title, author: author.trim() || null };
    try {
      await (book ? update.mutateAsync({ id: book.id, ...body }) : create.mutateAsync(body));
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function confirmDelete(b: Book) {
    const count = b.notes.length;
    const notes = count === 0 ? "" : count === 1 ? " and its 1 note" : ` and its ${count} notes`;
    if (window.confirm(`Delete "${b.title}"${notes}?`)) remove.mutateAsync(b.id).then(onClose);
  }

  return (
    <Dialog title={book ? "Edit book" : "Add book"} onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="b-title">Title</Label>
          <Input id="b-title" required autoFocus={!book} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="b-author">Author (optional)</Label>
          <Input id="b-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Box>
        {error && <Text role="alert" sx={{ color: "alert" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">{book ? "Save" : "Add"}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {book && (
            <Button type="button" variant="ghost" sx={{ ml: "auto" }} onClick={() => confirmDelete(book)}>Delete</Button>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
