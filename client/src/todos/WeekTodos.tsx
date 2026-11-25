import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Card, Heading, Text } from "theme-ui";
import { useTodos } from "../api";
import { Loading } from "../components/Loading";
import { dayOf, dueThisWeek, startOfThisWeek } from "../lib/dates";
import { TodoDialog } from "./TodoDialog";
import { TodoRow } from "./TodoRow";

const EXPANDED_KEY = "cornerdesk:week-todos-expanded";

// To-dos due by the end of this week plus every open weekly one, whatever its date, with
// the ones finished this week kept in view.
export function WeekTodos() {
  const todos = useTodos();
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => localStorage.getItem(EXPANDED_KEY) !== null);

  const weekStart = startOfThisWeek();
  const items = (todos.data ?? []).filter((t) =>
    t.completedAt
      ? dueThisWeek(t.dueDate) && dayOf(t.completedAt) >= weekStart
      : dueThisWeek(t.dueDate) || t.repeatsWeekly);
  const remaining = items.filter((t) => !t.completedAt).length;
  const editing = items.find((t) => t.id === openId);

  function onToggle(open: boolean) {
    setExpanded(open);
    if (open) localStorage.setItem(EXPANDED_KEY, "1");
    else localStorage.removeItem(EXPANDED_KEY);
  }

  return (
    <Card as="aside" aria-labelledby="week-todos" sx={{ position: [null, null, "sticky"], top: 4 }}>
      <details open={expanded} onToggle={(e) => onToggle(e.currentTarget.open)}>
        <Box as="summary" sx={{ cursor: "pointer", color: "secondary", "&:focus-visible": { outline: "2px solid", outlineColor: "accent" } }}>
          <Heading as="h2" id="week-todos" sx={{ display: "inline", fontSize: 2 }}>To-do this week</Heading>
          {!expanded && remaining > 0 && <Text variant="meta" sx={{ ml: 2 }}>{remaining} open</Text>}
        </Box>

        {todos.isError ? (
          <Text role="alert" sx={{ display: "block", my: 3 }}>Couldn't load your to-dos.</Text>
        ) : items.length > 0 ? (
          <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, mb: 3 }}>
            {items.map((t) => <TodoRow key={t.id} todo={t} onOpen={() => setOpenId(t.id)} />)}
          </Box>
        ) : todos.data ? (
          <Text sx={{ display: "block", my: 3 }}>Nothing due this week.</Text>
        ) : (
          <Loading layout="inline" />
        )}

        <Link to="/todos">All to-dos</Link>
      </details>
      {editing && <TodoDialog key={editing.id} todo={editing} onClose={() => setOpenId(null)} />}
    </Card>
  );
}
