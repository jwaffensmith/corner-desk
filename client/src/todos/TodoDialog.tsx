import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Text } from "theme-ui";
import { type Todo, errorMessage, useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from "../api";
import { Dialog } from "../components/Dialog";
import { TextArea } from "../components/TextArea";

export function TodoDialog({ todo, onClose }: { todo?: Todo; onClose: () => void }) {
  const categories = [...new Set((useTodos().data ?? []).flatMap((t) => t.category ?? []))].sort();
  const create = useCreateTodo();
  const update = useUpdateTodo();
  const remove = useDeleteTodo();
  const [title, setTitle] = useState(todo?.title ?? "");
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? "");
  const [category, setCategory] = useState(todo?.category ?? "");
  const [repeatsWeekly, setRepeatsWeekly] = useState(todo?.repeatsWeekly ?? false);
  const [notes, setNotes] = useState(todo?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { title, dueDate: dueDate || null, category: category || null, repeatsWeekly, notes: notes || null };
    try {
      await (todo ? update.mutateAsync({ id: todo.id, ...body }) : create.mutateAsync(body));
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Dialog title={todo ? "Edit to-do" : "Add to-do"} onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="t-title">To-do</Label>
          <Input id="t-title" required autoFocus={!todo} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Box>
        <Flex sx={{ gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="t-due">Due (optional)</Label>
            <Input id="t-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="t-category">Category (optional)</Label>
            <Input id="t-category" list="t-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="t-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Box>
        </Flex>
        <Box>
          <Label sx={{ gap: 2, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body", m: 0 }}>
            <input type="checkbox" checked={repeatsWeekly} onChange={(e) => setRepeatsWeekly(e.target.checked)} />
            Repeats weekly
          </Label>
          <Text variant="meta">Checking it off adds the same to-do for the following week.</Text>
        </Box>
        <Box>
          <Label htmlFor="t-notes">Notes (optional)</Label>
          <TextArea id="t-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Box>
        {error && <Text role="alert" sx={{ color: "alert" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">{todo ? "Save" : "Add"}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {todo && (
            <Button
              type="button"
              variant="ghost"
              sx={{ ml: "auto" }}
              onClick={() => window.confirm(`Delete "${todo.title}"?`) && remove.mutateAsync(todo.id).then(onClose)}
            >
              Delete
            </Button>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
