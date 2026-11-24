import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Select, Text } from "theme-ui";
import { TextArea } from "../components/TextArea";
import type { AssignmentCreate } from "@cornerdesk/shared";
import { type Assignment, type Track, errorMessage } from "../api";

type Content = Omit<AssignmentCreate, "weekId">;

interface Props {
  tracks: Track[];
  initial?: Assignment;
  submitLabel: string;
  onSubmit: (content: Content) => Promise<unknown>;
  onCancel: () => void;
}

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export function AssignmentForm({ tracks, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trackId, setTrackId] = useState(initial?.trackId ?? tracks[0]?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [objectives, setObjectives] = useState(initial?.objectives.join("\n") ?? "");
  const [estimatedMin, setEstimatedMin] = useState(String(initial?.estimatedMin ?? 45));
  const [resources, setResources] = useState(
    initial?.resources.map((r) => `${r.title} | ${r.url}`).join("\n") ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title,
        trackId,
        description: description || null,
        objectives: lines(objectives),
        estimatedMin: Number(estimatedMin),
        resources: lines(resources).map((line) => {
          const [name, url] = line.includes("|") ? line.split("|").map((s) => s.trim()) : [line, line];
          return { title: name, url };
        }),
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
      <Box>
        <Label htmlFor="a-title">Title</Label>
        <Input id="a-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Box>
      <Flex sx={{ gap: 3 }}>
        <Box sx={{ flex: 2 }}>
          <Label htmlFor="a-track">Learning track</Label>
          <Select id="a-track" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Label htmlFor="a-estimate">Estimate (min)</Label>
          <Input id="a-estimate" type="number" min={0} required value={estimatedMin} onChange={(e) => setEstimatedMin(e.target.value)} />
        </Box>
      </Flex>
      <Box>
        <Label htmlFor="a-description">Description</Label>
        <TextArea id="a-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Box>
      <Box>
        <Label htmlFor="a-objectives">Learning objectives (one per line)</Label>
        <TextArea id="a-objectives" rows={4} value={objectives} onChange={(e) => setObjectives(e.target.value)} />
      </Box>
      <Box>
        <Label htmlFor="a-resources">Resources (one per line: Title | URL)</Label>
        <TextArea id="a-resources" rows={4} value={resources} onChange={(e) => setResources(e.target.value)} />
      </Box>
      {error && <Text role="alert" sx={{ color: "#88542C" }}>{error}</Text>}
      <Flex sx={{ gap: 2 }}>
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </Flex>
    </Flex>
  );
}
