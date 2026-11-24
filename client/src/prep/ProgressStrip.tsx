import { Box, Card, Flex, Grid, Text } from "theme-ui";
import { type Current, formatMinutes, useProgress } from "../api";
import { Meter } from "../components/Meter";

export function ProgressStrip({ current }: { current: Current }) {
  const { data: p } = useProgress();
  if (!p) return null;

  const hours = Math.round((p.study.minutes / 60) * 10) / 10;
  const activeWeeks = p.consistency.filter((w) => w.completed > 0).length;
  const upcoming = [
    current.nextMilestone && `Milestone in week ${current.nextMilestone.number}: ${current.nextMilestone.milestone}`,
    current.nextAssessmentAfterWeek && `Next check-in after week ${current.nextAssessmentAfterWeek}`,
  ].filter(Boolean);

  return (
    <Card as="section" aria-label="Overall progress" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Grid columns={[1, 2]} gap={4}>
        <Box>
          <Text variant="label">Curriculum</Text>
          <Text sx={{ display: "block", mb: 2 }}>{p.assignments.done} of {p.assignments.planned} assignments</Text>
          <Meter value={p.assignments.done} max={p.assignments.planned} label="Assignments completed" />
        </Box>
        <Box>
          <Text variant="label">Study time</Text>
          <Text sx={{ display: "block", mb: 2 }}>
            {hours} of {p.study.targetMinutes / 60} hours
            {p.workplaceMinutes > 0 && <Text variant="meta"> · plus {formatMinutes(p.workplaceMinutes)} at work</Text>}
          </Text>
          <Meter value={p.study.minutes} max={p.study.targetMinutes} label="Study hours logged" />
        </Box>
      </Grid>

      <Box>
        <Text variant="label">By track</Text>
        <Grid columns={[1, 2]} gap={3} sx={{ mt: 2 }}>
          {p.tracks.filter((t) => t.planned > 0).map((t) => (
            <Box key={t.id}>
              <Flex sx={{ justifyContent: "space-between", gap: 2, mb: 1 }}>
                <Text sx={{ fontSize: 0 }}>{t.name}</Text>
                <Text variant="meta">{t.done}/{t.planned}</Text>
              </Flex>
              <Meter value={t.done} max={t.planned} label={`${t.name} completed`} />
            </Box>
          ))}
        </Grid>
      </Box>

      <Flex sx={{ justifyContent: "space-between", gap: 4, flexWrap: "wrap", alignItems: "end" }}>
        <Box>
          <Text variant="label">Recent weeks</Text>
          <Flex
            role="img"
            aria-label={`Studied in ${activeWeeks} of the last ${p.consistency.length} weeks`}
            sx={{ gap: 1, mt: 2 }}
          >
            {p.consistency.map((w) => (
              <Box
                key={w.weekOf}
                title={`Week of ${w.weekOf}: ${formatMinutes(w.minutes)}`}
                sx={{ width: 14, height: 14, borderRadius: 4, bg: w.completed ? "accent" : "muted" }}
              />
            ))}
          </Flex>
          <Text variant="meta">Studied in {activeWeeks} of the last {p.consistency.length} weeks</Text>
        </Box>
        {upcoming.length > 0 && (
          <Box>
            <Text variant="label">Coming up</Text>
            {upcoming.map((line) => <Text key={line as string} sx={{ display: "block", fontSize: 0 }}>{line}</Text>)}
          </Box>
        )}
      </Flex>
    </Card>
  );
}
