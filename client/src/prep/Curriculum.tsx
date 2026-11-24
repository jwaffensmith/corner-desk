import { useState } from "react";
import { Box, Button, Card, Flex, Heading, Input, Label, Text } from "theme-ui";
import {
  type Track, type Week, api, useCreateAssignment, useCreateWeek, useDeleteWeek, useReorderAssignments,
  useReorderWeeks, useTracks, useUpdateWeek, useWeeks,
} from "../api";
import { Dialog } from "../components/Dialog";
import { AssignmentDrawer } from "./AssignmentDrawer";
import { AssignmentForm } from "./AssignmentForm";
import { AssignmentRow } from "./AssignmentRow";
import { ImportDialog } from "./ImportDialog";

function moved<T>(list: T[], index: number, delta: -1 | 1): T[] | null {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

async function downloadExport(withProgress: boolean) {
  const data = await api(`/curriculum/export?progress=${withProgress}`);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = withProgress ? `cornerdesk-backup-${new Date().toISOString().slice(0, 10)}.json` : "curriculum.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

export function Curriculum() {
  const weeks = useWeeks();
  const tracks = useTracks();
  const createWeek = useCreateWeek();
  const reorderWeeks = useReorderWeeks();
  const [importing, setImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (weeks.isError || tracks.isError) return <Text role="alert">Couldn't load the curriculum. Is the API running?</Text>;
  if (!weeks.data || !tracks.data) return <Text>Loading…</Text>;

  const currentId = weeks.data.find((w) => !w.completedAt)?.id;
  const open = weeks.data.flatMap((w) => w.assignments).find((a) => a.id === openId);
  const ids = weeks.data.map((w) => w.id);

  return (
    <Flex sx={{ flexDirection: "column", gap: 4 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Heading as="h1" sx={{ fontSize: 5 }}>Curriculum</Heading>
        <Flex sx={{ gap: 2, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setImporting(true)}>Import JSON</Button>
          <Button variant="secondary" disabled={!weeks.data.length} onClick={() => downloadExport(false)}>Export plan</Button>
          <Button variant="secondary" disabled={!weeks.data.length} onClick={() => downloadExport(true)}>Export backup</Button>
          <Button onClick={() => createWeek.mutate({})}>Add week</Button>
        </Flex>
      </Flex>

      {weeks.data.length === 0 && (
        <Card><Text>No weeks yet. Import a curriculum file, or add your first week.</Text></Card>
      )}

      {weeks.data.map((week, i) => (
        <WeekSection
          key={week.id}
          week={week}
          tracks={tracks.data}
          isCurrent={week.id === currentId}
          onOpen={setOpenId}
          onMove={(delta) => {
            const next = moved(ids, i, delta);
            if (next) reorderWeeks.mutate(next);
          }}
        />
      ))}

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {open && <AssignmentDrawer key={open.id} assignment={open} tracks={tracks.data} onClose={() => setOpenId(null)} />}
    </Flex>
  );
}

interface WeekProps {
  week: Week;
  tracks: Track[];
  isCurrent: boolean;
  onOpen: (id: string) => void;
  onMove: (delta: -1 | 1) => void;
}

function WeekSection({ week, tracks, isCurrent, onOpen, onMove }: WeekProps) {
  const updateWeek = useUpdateWeek();
  const deleteWeek = useDeleteWeek();
  const reorder = useReorderAssignments();
  const createAssignment = useCreateAssignment();
  const [adding, setAdding] = useState(false);
  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name;
  const planned = week.assignments.filter((a) => a.status !== "SKIPPED");
  const done = planned.filter((a) => a.status === "DONE").length;
  const saveField = (field: "title" | "milestone", value: string) =>
    value !== (week[field] ?? "") && updateWeek.mutate({ id: week.id, [field]: value || null });

  return (
    <details open={isCurrent} sx={{ variant: "cards.primary", p: 0 }}>
      <Box as="summary" sx={{ p: 4, cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "accent" } }}>
        <Text sx={{ fontFamily: "heading", fontWeight: "heading", color: "primary", fontSize: 2 }}>
          Week {week.number}{week.title ? `: ${week.title}` : ""}
        </Text>
        <Text variant="meta" sx={{ ml: 3 }}>
          {[isCurrent && "Current", week.completedAt && "Finished", `${done}/${planned.length} done`].filter(Boolean).join(" · ")}
        </Text>
      </Box>

      <Flex sx={{ flexDirection: "column", gap: 3, px: 4, pb: 4 }}>
        <Flex sx={{ gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Label htmlFor={`title-${week.id}`}>Title</Label>
            <Input id={`title-${week.id}`} defaultValue={week.title ?? ""} onBlur={(e) => saveField("title", e.target.value.trim())} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Label htmlFor={`milestone-${week.id}`}>Milestone (optional)</Label>
            <Input id={`milestone-${week.id}`} defaultValue={week.milestone ?? ""} onBlur={(e) => saveField("milestone", e.target.value.trim())} />
          </Box>
        </Flex>

        <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {week.assignments.map((a, i) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              trackName={trackName(a.trackId)}
              onOpen={() => onOpen(a.id)}
              onMove={(delta) => {
                const next = moved(week.assignments.map((x) => x.id), i, delta);
                if (next) reorder.mutate({ weekId: week.id, ids: next });
              }}
            />
          ))}
        </Box>

        <Flex sx={{ gap: 2, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setAdding(true)}>Add assignment</Button>
          <Button variant="ghost" onClick={() => onMove(-1)}>Move week up</Button>
          <Button variant="ghost" onClick={() => onMove(1)}>Move week down</Button>
          <Button variant="ghost" onClick={() => updateWeek.mutate({ id: week.id, completed: !week.completedAt })}>
            {week.completedAt ? "Reopen week" : "Mark finished"}
          </Button>
          <Button variant="ghost" onClick={() => {
              if (!week.assignments.length || window.confirm(`Delete week ${week.number} and its assignments?`)) {
                deleteWeek.mutate(week.id);
              }
            }}>Delete week</Button>
        </Flex>
      </Flex>

      {adding && (
        <Dialog title={`Add to week ${week.number}`} onClose={() => setAdding(false)}>
          <AssignmentForm
            tracks={tracks}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (content) => {
              await createAssignment.mutateAsync({ ...content, weekId: week.id });
              setAdding(false);
            }}
          />
        </Dialog>
      )}
    </details>
  );
}
