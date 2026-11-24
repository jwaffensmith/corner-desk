import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Select, Text } from "theme-ui";
import type { EventStatus } from "@cornerdesk/shared";
import { type NetworkingEvent, errorMessage, useCreateEvent, useDeleteEvent, useUpdateEvent } from "../api";
import { Dialog } from "../components/Dialog";
import { TextArea } from "../components/TextArea";
import { today } from "../lib/dates";

export const STATUS_LABELS: Record<EventStatus, string> = {
  REGISTERED: "Signed up",
  ATTENDED: "Attended",
  SKIPPED: "Didn't go",
};

export function EventDialog({ event, onClose }: { event?: NetworkingEvent; onClose: () => void }) {
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const remove = useDeleteEvent();
  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState(event?.date ?? today());
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "REGISTERED");
  const [location, setLocation] = useState(event?.location ?? "");
  const [url, setUrl] = useState(event?.url ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { name, date, status, location: location || null, url: url.trim() || null, notes: notes || null };
    try {
      await (event ? update.mutateAsync({ id: event.id, ...body }) : create.mutateAsync(body));
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Dialog title={event ? "Edit event" : "Add event"} onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="e-name">Event</Label>
          <Input id="e-name" required autoFocus={!event} value={name} onChange={(e) => setName(e.target.value)} />
        </Box>
        <Flex sx={{ gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="e-date">Date</Label>
            <Input id="e-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="e-status">Status</Label>
            <Select id="e-status" value={status} onChange={(e) => setStatus(e.target.value as EventStatus)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Box>
        </Flex>
        <Box>
          <Label htmlFor="e-location">Location (optional)</Label>
          <Input id="e-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="e-url">Link (optional)</Label>
          <Input id="e-url" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          {event?.url && (
            <Text variant="meta"><a href={event.url} target="_blank" rel="noreferrer">Open event page</a></Text>
          )}
        </Box>
        <Box>
          <Label htmlFor="e-notes">Notes (optional)</Label>
          <TextArea id="e-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Box>
        {error && <Text role="alert" sx={{ color: "#88542C" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">{event ? "Save" : "Add"}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {event && (
            <Button
              type="button"
              variant="ghost"
              sx={{ ml: "auto" }}
              onClick={() => window.confirm(`Delete "${event.name}"?`) && remove.mutateAsync(event.id).then(onClose)}
            >
              Delete
            </Button>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
