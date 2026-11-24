import { useState } from "react";
import { Box, Button, Flex, Input, Label, Select, Text } from "theme-ui";
import { TextArea } from "../components/TextArea";
import type { AssignmentStatus, AssignmentUpdate } from "@cornerdesk/shared";
import {
  type Assignment, type Track, formatMinutes, useDeleteAssignment, useUpdateAssignment, useWeeks,
} from "../api";
import { Dialog } from "../components/Dialog";
import { AssignmentForm } from "./AssignmentForm";

const STATUSES: [AssignmentStatus, string][] = [["TODO", "To do"], ["DONE", "Done"], ["SKIPPED", "Skipped"]];

interface Props {
  assignment: Assignment;
  tracks: Track[];
  onClose: () => void;
}

export function AssignmentDrawer({ assignment: a, tracks, onClose }: Props) {
  const update = useUpdateAssignment();
  const remove = useDeleteAssignment();
  const weeks = useWeeks();
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(a.actualMin?.toString() ?? "");
  const [notes, setNotes] = useState(a.notes ?? "");
  const track = tracks.find((t) => t.id === a.trackId);
  const save = (body: AssignmentUpdate) => update.mutate({ id: a.id, ...body });

  if (editing) {
    return (
      <Dialog title="Edit assignment" drawer onClose={onClose}>
        <AssignmentForm
          tracks={tracks}
          initial={a}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (content) => {
            await update.mutateAsync({ id: a.id, ...content });
            setEditing(false);
          }}
        />
      </Dialog>
    );
  }

  return (
    <Dialog title={a.title} drawer onClose={onClose}>
      <Text variant="meta">
        {track?.name} · {formatMinutes(a.estimatedMin)} estimated
        {a.completedAt && ` · completed ${new Date(a.completedAt).toLocaleDateString()}`}
      </Text>

      <Flex role="group" aria-label="Status" sx={{ gap: 2 }}>
        {STATUSES.map(([status, label]) => (
          <Button
            key={status}
            variant={a.status === status ? "primary" : "secondary"}
            aria-pressed={a.status === status}
            onClick={() => save({ status })}
          >
            {label}
          </Button>
        ))}
      </Flex>

      {a.description && <Text sx={{ whiteSpace: "pre-wrap" }}>{a.description}</Text>}

      {a.objectives.length > 0 && (
        <Box>
          <Text variant="label">Objectives</Text>
          <Box as="ul" sx={{ pl: 4, my: 1 }}>{a.objectives.map((o) => <li key={o}>{o}</li>)}</Box>
        </Box>
      )}

      {a.resources.length > 0 && (
        <Box>
          <Text variant="label">Resources</Text>
          <Box as="ul" sx={{ pl: 4, my: 1 }}>
            {a.resources.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
            ))}
          </Box>
        </Box>
      )}

      <Flex sx={{ gap: 4, flexWrap: "wrap" }}>
        <Box sx={{ width: 160 }}>
          <Label htmlFor="d-minutes">Time spent (min)</Label>
          <Input
            id="d-minutes"
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onBlur={() => save({ actualMin: minutes === "" ? null : Number(minutes) })}
          />
        </Box>
        <Box as="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Label as="legend">Confidence (optional)</Label>
          <Flex sx={{ gap: 3, alignItems: "center", height: 38 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Label key={n} sx={{ width: "auto", gap: 1, m: 0, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body" }}>
                <input
                  type="radio"
                  name="confidence"
                  checked={a.confidence === n}
                  onChange={() => save({ confidence: n })}
                />
                {n}
              </Label>
            ))}
            {a.confidence !== null && (
              <Button variant="ghost" onClick={() => save({ confidence: null })}>Clear</Button>
            )}
          </Flex>
        </Box>
      </Flex>

      <Box>
        <Label htmlFor="d-notes">Notes</Label>
        <TextArea
          id="d-notes"
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (a.notes ?? "") && save({ notes: notes || null })}
        />
        <Text variant="meta" aria-live="polite">
          {update.isPending ? "Saving…" : update.isError ? "Couldn't save. Your text is still here." : "Saved automatically"}
        </Text>
      </Box>

      <Flex sx={{ gap: 2, alignItems: "end", flexWrap: "wrap", borderTop: "1px solid", borderColor: "border", pt: 4 }}>
        <Box sx={{ flexBasis: "100%", minWidth: 0 }}>
          <Label htmlFor="d-week">Scheduled for</Label>
          <Select
            id="d-week"
            value={a.weekId}
            onChange={(e) => save({ weekId: e.target.value })}
            sx={{ pr: 5, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
          >
            {weeks.data?.map((w) => (
              <option key={w.id} value={w.id}>Week {w.number}{w.title ? `: ${w.title}` : ""}</option>
            ))}
          </Select>
        </Box>
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit details</Button>
        <Button variant="secondary" onClick={() => remove.mutateAsync(a.id).then((deleted) => deleted && onClose())}>Delete</Button>
      </Flex>
    </Dialog>
  );
}
