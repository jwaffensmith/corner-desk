import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Text } from "theme-ui";
import { type BookNote, errorMessage, useDeleteBookNote, useUpdateBookNote } from "../api";
import { Dialog } from "../components/Dialog";
import { TextArea } from "../components/TextArea";

export function NoteDialog({ note, onClose }: { note: BookNote; onClose: () => void }) {
  const update = useUpdateBookNote();
  const remove = useDeleteBookNote();
  const [text, setText] = useState(note.text);
  const [location, setLocation] = useState(note.location ?? "");
  const [isTakeaway, setIsTakeaway] = useState(note.isTakeaway);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({ id: note.id, text, location: location.trim() || null, isTakeaway });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Dialog title="Edit note" onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="n-text">Note</Label>
          <TextArea id="n-text" required rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="n-location">Chapter or page (optional)</Label>
          <Input id="n-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Box>
        <Label sx={{ gap: 2, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body", m: 0 }}>
          <input type="checkbox" checked={isTakeaway} onChange={(e) => setIsTakeaway(e.target.checked)} />
          Takeaway
        </Label>
        {error && <Text role="alert" sx={{ color: "alert" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="ghost"
            sx={{ ml: "auto" }}
            onClick={() => window.confirm("Delete this note?") && remove.mutateAsync(note.id).then(onClose)}
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}
