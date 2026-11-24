import { Fragment, useState, type ReactNode } from "react";
import { Box, Button, Card, Flex, Heading, Text } from "theme-ui";
import { type Todo, useTodos, useUpdateTodo } from "../api";
import { ListSection } from "../components/ListSection";
import { RowButton } from "../components/RowButton";
import { dayOf, endOfWeek, formatDay, today } from "../lib/dates";
import { TodoDialog } from "./TodoDialog";

export function Todos() {
  const todos = useTodos();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (todos.isError) return <Text role="alert">Couldn't load your to-dos. Is the API running?</Text>;
  if (!todos.data) return <Text>Loading…</Text>;

  const weekEnd = endOfWeek(today());
  const open = todos.data.filter((t) => !t.completedAt);
  const done = todos.data.filter((t) => t.completedAt);
  const sections: [string, Todo[]][] = [
    ["This week", open.filter((t) => t.dueDate && t.dueDate <= weekEnd)],
    ["Later", open.filter((t) => t.dueDate && t.dueDate > weekEnd)],
    ["Anytime", open.filter((t) => !t.dueDate)],
  ];
  const categories = [...new Set(todos.data.flatMap((t) => t.category ?? []))].sort();
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

      {adding && <TodoDialog categories={categories} onClose={() => setAdding(false)} />}
      {editing && <TodoDialog key={editing.id} todo={editing} categories={categories} onClose={() => setOpenId(null)} />}
    </Flex>
  );
}

function due(day: string): ReactNode {
  const now = today();
  if (day < now) return <Text sx={{ color: "alert" }}>Was due {formatDay(day)}</Text>;
  return day === now ? "Due today" : `Due ${formatDay(day)}`;
}

function TodoRow({ todo: t, onOpen }: { todo: Todo; onOpen: () => void }) {
  const update = useUpdateTodo();
  const done = Boolean(t.completedAt);
  const meta = [
    t.completedAt ? `Done ${formatDay(dayOf(t.completedAt))}` : t.dueDate && due(t.dueDate),
    t.category,
    t.repeatsWeekly && "Repeats weekly",
  ].filter(Boolean);

  return (
    <Flex as="li" sx={{ alignItems: "center", gap: 3, py: 2, borderTop: "1px solid", borderColor: "muted" }}>
      <input
        type="checkbox"
        checked={done}
        aria-label={`Mark "${t.title}" done`}
        onChange={() => update.mutate({ id: t.id, completed: !done })}
        sx={{ width: 20, height: 20, flexShrink: 0, cursor: "pointer" }}
      />
      <RowButton
        title={t.title}
        dimmed={done}
        struck={done}
        onClick={onOpen}
        meta={meta.length > 0 && meta.map((part, i) => <Fragment key={i}>{i > 0 && " · "}{part}</Fragment>)}
      />
    </Flex>
  );
}
