import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Text } from "theme-ui";
import { type Track, errorMessage, useCreateTrack, useDeleteTrack, useUpdateTrack } from "../api";
import { Dialog } from "../components/Dialog";
import { TextArea } from "../components/TextArea";

interface Props {
  track?: Track;
  assignmentCount?: number;
  onClose: () => void;
}

export function TrackDialog({ track, assignmentCount = 0, onClose }: Props) {
  const create = useCreateTrack();
  const update = useUpdateTrack();
  const remove = useDeleteTrack();
  const [name, setName] = useState(track?.name ?? "");
  const [description, setDescription] = useState(track?.description ?? "");
  const [countsTowardStudy, setCountsTowardStudy] = useState(track?.countsTowardStudy ?? true);
  const [weeklyTargetMin, setWeeklyTargetMin] = useState(String(track?.weeklyTargetMin ?? 45));
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = {
      name,
      description: description || null,
      countsTowardStudy,
      weeklyTargetMin: Number(weeklyTargetMin),
    };
    run(() => (track ? update.mutateAsync({ id: track.id, ...body }) : create.mutateAsync(body)));
  }

  return (
    <Dialog title={track ? "Edit track" : "Add track"} onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="t-name">Name</Label>
          <Input id="t-name" required autoFocus={!track} value={name} onChange={(e) => setName(e.target.value)} />
          {track && (
            <Text variant="meta">
              Curriculum files call this track <Text sx={{ fontFamily: "monospace" }}>{track.slug}</Text>. Renaming it here doesn't change that.
            </Text>
          )}
        </Box>
        <Box>
          <Label htmlFor="t-description">Description (optional)</Label>
          <TextArea id="t-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Box>
        <Box>
          <Label sx={{ gap: 2, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body", m: 0 }}>
            <input type="checkbox" checked={countsTowardStudy} onChange={(e) => setCountsTowardStudy(e.target.checked)} />
            Counts toward study hours
          </Label>
          <Text variant="meta">Uncheck it for learning you do during the workday. That time is totalled separately.</Text>
        </Box>
        {countsTowardStudy && (
          <Box sx={{ width: 200 }}>
            <Label htmlFor="t-target">Weekly target (min)</Label>
            <Input id="t-target" type="number" min={0} required value={weeklyTargetMin} onChange={(e) => setWeeklyTargetMin(e.target.value)} />
          </Box>
        )}
        {error && <Text role="alert" sx={{ color: "alert" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">{track ? "Save" : "Add"}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {track && assignmentCount === 0 && (
            <Button
              type="button"
              variant="ghost"
              sx={{ ml: "auto" }}
              onClick={() => window.confirm(`Delete "${track.name}"?`) && run(() => remove.mutateAsync(track.id))}
            >
              Delete
            </Button>
          )}
        </Flex>
        {track && assignmentCount > 0 && (
          <Text variant="meta">
            {assignmentCount === 1 ? "1 assignment uses" : `${assignmentCount} assignments use`} this track. Move or delete
            {assignmentCount === 1 ? " it" : " them"} before deleting the track.
          </Text>
        )}
      </Flex>
    </Dialog>
  );
}
