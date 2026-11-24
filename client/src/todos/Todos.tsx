import { useState } from "react";
import { Box, Button, Card, Flex, Heading, Text } from "theme-ui";
import { type Todo, useTodos } from "../api";
import { ListSection } from "../components/ListSection";
import { dueThisWeek } from "../lib/dates";
import { TodoDialog } from "./TodoDialog";
import { TodoRow } from "./TodoRow";

export function Todos() {
  const todos = useTodos();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (todos.isError) return <Text role="alert">Couldn't load your to-dos. Is the API running?</Text>;
  if (!todos.data) return <Text>Loading…</Text>;

  const open = todos.data.filter((t) => !t.completedAt);
  const done = todos.data.filter((t) => t.completedAt);
  const sections: [string, Todo[]][] = [
    ["This week", open.filter((t) => dueThisWeek(t.dueDate))],
    ["Later", open.filter((t) => t.dueDate && !dueThisWeek(t.dueDate))],
    ["Anytime", open.filter((t) => !t.dueDate)],
  ];
  const editing = todos.data.find((t) => t.id === openId);
  const rows = (items: Todo[]) => items.map((t) => <TodoRow key={t.id} todo={t} onOpen={() => setOpenId(t.id)} />);

  return (
    <Flex sx={{ flexDirection: "column", gap: 5 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Heading as="h1" sx={{ fontSize: 5 }}>To-do</Heading>
        <Button onClick={() => setAdding(true)}>Add to-do</Button>
      </Flex>

      {open.length === 0 && (
        <Card>
          <Text>
            {done.length
              ? "Nothing left on your list."
              : "Nothing here yet. Add what sits outside the curriculum, like a book to read or a weekly commitment."}
          </Text>
        </Card>
      )}
      {sections.filter(([, items]) => items.length > 0).map(([title, items]) => (
        <ListSection key={title} title={title}>{rows(items)}</ListSection>
      ))}

      {done.length > 0 && (
        <details>
          <Box as="summary" sx={{ cursor: "pointer", color: "secondary", "&:focus-visible": { outline: "2px solid", outlineColor: "accent" } }}>
            Recently done ({done.length})
          </Box>
          <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>{rows(done)}</Box>
        </details>
      )}

      {adding && <TodoDialog onClose={() => setAdding(false)} />}
      {editing && <TodoDialog key={editing.id} todo={editing} onClose={() => setOpenId(null)} />}
    </Flex>
  );
}
