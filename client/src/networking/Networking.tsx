import { useState } from "react";
import { Box, Button, Card, Flex, Heading, Input, Label, Text } from "theme-ui";
import { type NetworkingEvent, useNetworking, useUpdateEvent, useUpdateNetworkingGoal } from "../api";
import { ListSection } from "../components/ListSection";
import { Meter } from "../components/Meter";
import { RowButton } from "../components/RowButton";
import { formatDay, formatMonth, monthsThrough, today } from "../lib/dates";
import { EventDialog, STATUS_LABELS } from "./EventDialog";

export function Networking() {
  const networking = useNetworking();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (networking.isError) return <Text role="alert">Couldn't load your events. Is the API running?</Text>;
  if (!networking.data) return <Text>Loading…</Text>;

  const { events, eventsPerMonth } = networking.data;
  const now = today();
  const waiting = events.filter((e) => e.status === "REGISTERED");
  const sections: [string, NetworkingEvent[]][] = [
    ["Did you go?", waiting.filter((e) => e.date < now)],
    ["Coming up", waiting.filter((e) => e.date >= now).reverse()],
    ["Past events", events.filter((e) => e.status !== "REGISTERED")],
  ];
  const open = events.find((e) => e.id === openId);

  return (
    <Flex sx={{ flexDirection: "column", gap: 5 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Heading as="h1" sx={{ fontSize: 5 }}>Networking</Heading>
        <Button onClick={() => setAdding(true)}>Add event</Button>
      </Flex>

      <MonthlyGoal events={events} goal={eventsPerMonth} />

      {events.length === 0 && (
        <Card><Text>No events yet. Add the first one you've signed up for.</Text></Card>
      )}
      {sections.filter(([, items]) => items.length > 0).map(([title, items]) => (
        <ListSection key={title} title={title}>
          {items.map((e) => <EventRow key={e.id} event={e} onOpen={() => setOpenId(e.id)} />)}
        </ListSection>
      ))}

      {adding && <EventDialog onClose={() => setAdding(false)} />}
      {open && <EventDialog key={open.id} event={open} onClose={() => setOpenId(null)} />}
    </Flex>
  );
}

function MonthlyGoal({ events, goal }: { events: NetworkingEvent[]; goal: number }) {
  const updateGoal = useUpdateNetworkingGoal();
  const now = today();
  const month = now.slice(0, 7);
  const attendedIn = (m: string) => events.filter((e) => e.status === "ATTENDED" && e.date.startsWith(m)).length;
  const attended = attendedIn(month);
  const linedUp = events.filter((e) => e.status === "REGISTERED" && e.date >= now && e.date.startsWith(month)).length;

  // History starts with the first tracked event, so months before the tracker existed don't read as misses.
  const first = events.at(-1)?.date.slice(0, 7) ?? month;
  const months = monthsThrough(month, 12).filter((m) => m >= first);
  const met = months.filter((m) => attendedIn(m) >= goal).length;

  return (
    <Card as="section" aria-label="Monthly goal" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Flex sx={{ justifyContent: "space-between", alignItems: "end", gap: 3, flexWrap: "wrap", mb: 2 }}>
          <Box>
            <Text variant="label">{formatMonth(month)}</Text>
            <Text sx={{ display: "block" }}>{attended} of {goal} attended</Text>
          </Box>
          <Label htmlFor="n-goal" sx={{ width: "auto", m: 0, gap: 2, alignItems: "center" }}>
            Goal
            <Input
              id="n-goal"
              key={goal}
              type="number"
              min={1}
              max={31}
              defaultValue={goal}
              onBlur={(e) => {
                const next = Number(e.target.value);
                if (Number.isInteger(next) && next >= 1 && next <= 31 && next !== goal) updateGoal.mutate(next);
                else e.target.value = String(goal);
              }}
              sx={{ width: 72, py: 1 }}
            />
            a month
          </Label>
        </Flex>
        <Meter value={attended} max={goal} label={`Events attended in ${formatMonth(month)}`} />
        <Text variant="meta" sx={{ display: "block", mt: 2 }}>
          {attended >= goal
            ? `Goal met for ${formatMonth(month)}.`
            : linedUp > 0
              ? `Signed up for ${linedUp} more this month.`
              : `Nothing lined up for the rest of ${formatMonth(month)} yet.`}
        </Text>
      </Box>

      {months.length > 1 && (
        <Box>
          <Text variant="label">Recent months</Text>
          <Flex role="img" aria-label={`Goal met in ${met} of the last ${months.length} months`} sx={{ gap: 1, mt: 2 }}>
            {months.map((m) => (
              <Box
                key={m}
                title={`${formatMonth(m)}: ${attendedIn(m)} attended`}
                sx={{ width: 14, height: 14, borderRadius: 4, bg: attendedIn(m) >= goal ? "accent" : "muted" }}
              />
            ))}
          </Flex>
          <Text variant="meta">Goal met in {met} of the last {months.length} months</Text>
        </Box>
      )}
    </Card>
  );
}

function EventRow({ event: e, onOpen }: { event: NetworkingEvent; onOpen: () => void }) {
  const update = useUpdateEvent();
  const happened = e.status === "REGISTERED" && e.date <= today();

  return (
    <Flex as="li" sx={{ alignItems: "center", gap: 3, py: 2, borderTop: "1px solid", borderColor: "muted", flexWrap: "wrap" }}>
      <RowButton
        title={e.name}
        dimmed={e.status === "SKIPPED"}
        onClick={onOpen}
        meta={[formatDay(e.date), e.location, e.status !== "REGISTERED" && STATUS_LABELS[e.status]]
          .filter(Boolean)
          .join(" · ")}
      />
      {happened && (
        <Flex sx={{ gap: 2 }}>
          <Button
            variant="secondary"
            aria-label={`Mark "${e.name}" attended`}
            onClick={() => update.mutate({ id: e.id, status: "ATTENDED" })}
          >
            Attended
          </Button>
          <Button
            variant="ghost"
            aria-label={`Mark "${e.name}" as not attended`}
            onClick={() => update.mutate({ id: e.id, status: "SKIPPED" })}
          >
            Didn't go
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
