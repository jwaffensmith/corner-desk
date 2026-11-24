import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Card, Heading, Text } from "theme-ui";
import { useTodos } from "../api";
import { dayOf, dueThisWeek, startOfThisWeek } from "../lib/dates";
import { TodoDialog } from "./TodoDialog";
import { TodoRow } from "./TodoRow";

// To-dos due by the end of this week plus every open weekly one, whatever its date, with
// the ones finished this week kept in view.
export function WeekTodos() {
  const todos = useTodos();
  const [openId, setOpenId] = useState<string | null>(null);

  const weekStart = startOfThisWeek();
  const items = (todos.data ?? []).filter((t) =>
    t.completedAt
      ? dueThisWeek(t.dueDate) && dayOf(t.completedAt) >= weekStart
      : dueThisWeek(t.dueDate) || t.repeatsWeekly);
  const editing = items.find((t) => t.id === openId);

  return (
    <Card as="aside" aria-labelledby="week-todos" sx={{ position: [null, null, "sticky"], top: 4 }}>
      <Heading as="h2" id="week-todos" sx={{ fontSize: 2 }}>To-do this week</Heading>

      {todos.isError ? (
        <Text role="alert" sx={{ display: "block", my: 3 }}>Couldn't load your to-dos.</Text>
      ) : items.length > 0 ? (
        <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, mb: 3 }}>
          {items.map((t) => <TodoRow key={t.id} todo={t} onOpen={() => setOpenId(t.id)} />)}
        </Box>
      ) : (
        <Text sx={{ display: "block", my: 3 }}>{todos.data ? "Nothing due this week." : "Loading…"}</Text>
      )}

      <Link to="/todos">All to-dos</Link>
      {editing && <TodoDialog key={editing.id} todo={editing} onClose={() => setOpenId(null)} />}
    </Card>
  );
}
