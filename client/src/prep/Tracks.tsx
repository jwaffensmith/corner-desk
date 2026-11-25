import { useState } from "react";
import { Box, Button, Flex, Text } from "theme-ui";
import { type Track, type Week, trackTarget } from "../api";
import { RowButton } from "../components/RowButton";
import { TrackDialog } from "./TrackDialog";

export function Tracks({ tracks, weeks }: { tracks: Track[]; weeks: Week[] }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = tracks.find((t) => t.id === editId);
  const counts = new Map<string, number>();
  for (const a of weeks.flatMap((w) => w.assignments)) counts.set(a.trackId, (counts.get(a.trackId) ?? 0) + 1);
  const used = (id: string) => counts.get(id) ?? 0;

  return (
    <details sx={{ variant: "cards.primary", p: 0 }}>
      <Box as="summary" sx={{ p: 4, cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "accent" } }}>
        <Text sx={{ fontFamily: "heading", fontWeight: "heading", color: "primary", fontSize: 2 }}>Learning tracks</Text>
        <Text variant="meta" sx={{ ml: 3 }}>{tracks.length === 1 ? "1 track" : `${tracks.length} tracks`}</Text>
      </Box>

      <Flex sx={{ flexDirection: "column", gap: 3, px: 4, pb: 4 }}>
        <Text variant="meta">
          Every assignment belongs to a track. A curriculum file refers to a track by the short name shown beside it.
        </Text>
        <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {tracks.map((t) => (
            <Flex as="li" key={t.id} sx={{ alignItems: "center", gap: 3, py: 2, borderTop: "1px solid", borderColor: "muted" }}>
              <RowButton
                title={t.name}
                meta={[trackTarget(t), used(t.id) === 1 ? "1 assignment" : `${used(t.id)} assignments`].filter(Boolean).join(" · ")}
                onClick={() => setEditId(t.id)}
              />
              <Text variant="meta" sx={{ fontFamily: "monospace", flexShrink: 0 }}>{t.slug}</Text>
            </Flex>
          ))}
        </Box>
        <Box><Button variant="secondary" onClick={() => setAdding(true)}>Add track</Button></Box>
      </Flex>

      {adding && <TrackDialog onClose={() => setAdding(false)} />}
      {editing && (
        <TrackDialog key={editing.id} track={editing} assignmentCount={used(editing.id)} onClose={() => setEditId(null)} />
      )}
    </details>
  );
}
