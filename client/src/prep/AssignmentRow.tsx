import { Button, Flex } from "theme-ui";
import { type Assignment, formatMinutes, useUpdateAssignment } from "../api";
import { RowButton } from "../components/RowButton";

interface Props {
  assignment: Assignment;
  trackName?: string;
  onOpen: () => void;
  onMove?: (delta: -1 | 1) => void;
}

export function AssignmentRow({ assignment: a, trackName, onOpen, onMove }: Props) {
  const update = useUpdateAssignment();
  const done = a.status === "DONE";
  const skipped = a.status === "SKIPPED";

  return (
    <Flex as="li" sx={{ alignItems: "center", gap: 3, py: 2, borderTop: "1px solid", borderColor: "muted" }}>
      <input
        type="checkbox"
        checked={done}
        aria-label={`Mark "${a.title}" complete`}
        onChange={() => update.mutate({ id: a.id, status: done ? "TODO" : "DONE" })}
        sx={{ width: 20, height: 20, flexShrink: 0, cursor: "pointer" }}
      />
      <RowButton
        title={a.title}
        dimmed={done || skipped}
        struck={done}
        onClick={onOpen}
        meta={[trackName, formatMinutes(a.actualMin ?? a.estimatedMin), skipped && "Skipped", a.isSupplementary && "Extra"]
          .filter(Boolean)
          .join(" · ")}
      />
      {onMove && (
        <Flex>
          <Button variant="ghost" aria-label={`Move "${a.title}" up`} onClick={() => onMove(-1)}>↑</Button>
          <Button variant="ghost" aria-label={`Move "${a.title}" down`} onClick={() => onMove(1)}>↓</Button>
        </Flex>
      )}
    </Flex>
  );
}
