import { Fragment, type ReactNode } from "react";
import { Flex, Text } from "theme-ui";
import { type Todo, useUpdateTodo } from "../api";
import { RowButton } from "../components/RowButton";
import { dayOf, formatDay, today } from "../lib/dates";

function due(day: string): ReactNode {
  const now = today();
  if (day < now) return <Text sx={{ color: "alert" }}>Was due {formatDay(day)}</Text>;
  return day === now ? "Due today" : `Due ${formatDay(day)}`;
}

export function TodoRow({ todo: t, onOpen }: { todo: Todo; onOpen: () => void }) {
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
