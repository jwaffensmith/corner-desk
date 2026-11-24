import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, Label, Text } from "theme-ui";
import {
  type Week, formatMinutes, useAdvance, useCreateAssignment, useCurrent, useTracks,
} from "../api";
import desk from "../assets/desk.png";
import { Dialog } from "../components/Dialog";
import { Meter } from "../components/Meter";
import { AssignmentDrawer } from "./AssignmentDrawer";
import { AssignmentForm } from "./AssignmentForm";
import { AssignmentRow } from "./AssignmentRow";
import { ProgressStrip } from "./ProgressStrip";

export function ThisWeek() {
  const current = useCurrent();
  const tracks = useTracks();
  const createAssignment = useCreateAssignment();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(false);

  if (current.isError || tracks.isError) return <Text role="alert">Couldn't load your plan. Is the API running?</Text>;
  if (!current.data || !tracks.data) return <Text>Loading…</Text>;

  const { week, totalWeeks, settings, studyMinutes = 0 } = current.data;
  if (!week) {
    return (
      <Card sx={{ textAlign: "center", py: 6, bg: "background", border: 0 }}>
        <img src={desk} alt="" sx={{ width: "min(360px, 100%)", height: "auto", mb: 4 }} />
        <Heading as="h1" sx={{ fontSize: 4, mb: 2 }}>
          {totalWeeks ? "Curriculum complete" : "No curriculum yet"}
        </Heading>
        <Text sx={{ display: "block", mb: 3 }}>
          {totalWeeks
            ? "Every week is marked finished. Add more weeks or reopen one from the curriculum."
            : "Import your curriculum as JSON, or add weeks by hand, to get started."}
        </Text>
        <Link to="/prep/curriculum">Go to curriculum</Link>
      </Card>
    );
  }

  const open = week.assignments.find((a) => a.id === openId);
  const counted = week.assignments.filter((a) => a.status !== "SKIPPED");
  const done = counted.filter((a) => a.status === "DONE").length;
  const groups = tracks.data
    .map((track) => ({ track, items: week.assignments.filter((a) => a.trackId === track.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Flex sx={{ flexDirection: "column", gap: 5 }}>
      <Box>
        <Text variant="label">Week {week.number} of {totalWeeks}</Text>
        <Heading as="h1" sx={{ fontSize: 5, mt: 1 }}>{week.title ?? "This week"}</Heading>
        <Flex sx={{ justifyContent: "space-between", gap: 3, mt: 3, mb: 2, flexWrap: "wrap" }}>
          <Text>{done} of {counted.length} done</Text>
          <Text variant="meta">
            {formatMinutes(studyMinutes)} of {formatMinutes(settings.weeklyTargetMin)} study time
          </Text>
        </Flex>
        <Meter value={done} max={counted.length} label="This week's assignments completed" />
      </Box>

      {groups.map(({ track, items }) => (
        <Box as="section" key={track.id} aria-labelledby={`track-${track.id}`}>
          <Flex sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 3 }}>
            <Heading as="h2" id={`track-${track.id}`} sx={{ fontSize: 2 }}>{track.name}</Heading>
            <Text variant="meta">
              {track.countsTowardStudy ? `${formatMinutes(track.weeklyTargetMin)} a week` : "During the workday"}
            </Text>
          </Flex>
          <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>
            {items.map((a) => <AssignmentRow key={a.id} assignment={a} onOpen={() => setOpenId(a.id)} />)}
          </Box>
        </Box>
      ))}

      <Flex sx={{ gap: 2, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => setAdding(true)}>Add assignment</Button>
        <Button variant="secondary" onClick={() => setFinishing(true)}>Finish week</Button>
      </Flex>

      <ProgressStrip current={current.data} />

      {open && <AssignmentDrawer key={open.id} assignment={open} tracks={tracks.data} onClose={() => setOpenId(null)} />}
      {adding && (
        <Dialog title={`Add to week ${week.number}`} onClose={() => setAdding(false)}>
          <AssignmentForm
            tracks={tracks.data}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (content) => {
              await createAssignment.mutateAsync({ ...content, weekId: week.id, isSupplementary: true });
              setAdding(false);
            }}
          />
        </Dialog>
      )}
      {finishing && (
        <FinishWeek week={week} isLast={week.number === totalWeeks} onClose={() => setFinishing(false)} />
      )}
    </Flex>
  );
}

function FinishWeek({ week, isLast, onClose }: { week: Week; isLast: boolean; onClose: () => void }) {
  const advance = useAdvance();
  const unfinished = week.assignments.filter((a) => a.status === "TODO");
  const [carry, setCarry] = useState(() => new Set(isLast ? [] : unfinished.map((a) => a.id)));
  const toggle = (id: string) =>
    setCarry((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Dialog title={`Finish week ${week.number}`} onClose={onClose}>
      {unfinished.length === 0 ? (
        <Text>Everything is wrapped up.</Text>
      ) : isLast ? (
        <Text>This is the last week, so unfinished assignments stay here. Add a week first to move them on.</Text>
      ) : (
        <Box as="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Text as="legend" sx={{ mb: 2 }}>Choose what to carry into next week. Anything unchecked stays in this one.</Text>
          {unfinished.map((a) => (
            <Label key={a.id} sx={{ gap: 2, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body", py: 1 }}>
              <input type="checkbox" checked={carry.has(a.id)} onChange={() => toggle(a.id)} />
              {a.title}
            </Label>
          ))}
        </Box>
      )}
      {advance.isError && <Text role="alert">{advance.error.message}</Text>}
      <Flex sx={{ gap: 2 }}>
        <Button disabled={advance.isPending} onClick={() => advance.mutateAsync([...carry]).then(onClose)}>
          Finish week
        </Button>
        <Button variant="secondary" onClick={onClose}>Not yet</Button>
      </Flex>
    </Dialog>
  );
}
