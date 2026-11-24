import { Link } from "react-router-dom";
import { Box, Card, Flex, Grid, Heading, Text } from "theme-ui";
import { useCurrent, useProjects } from "../api";
import { Loading } from "../components/Loading";
import { Meter } from "../components/Meter";
import { ProgressStrip } from "../prep/ProgressStrip";

export function Dashboard() {
  const current = useCurrent();

  if (current.isError) return <Text role="alert">Couldn't load your progress. Is the API running?</Text>;
  if (!current.data) return <Loading />;

  return (
    <Flex sx={{ flexDirection: "column", gap: 4 }}>
      <Heading as="h1" sx={{ fontSize: 5 }}>Dashboard</Heading>
      {current.data.totalWeeks ? (
        <ProgressStrip current={current.data} />
      ) : (
        <Card>
          <Text sx={{ display: "block", mb: 2 }}>No curriculum yet. Your progress will show here once you have one.</Text>
          <Link to="/prep/curriculum">Go to curriculum</Link>
        </Card>
      )}
      <PortfolioProgress />
    </Flex>
  );
}

function PortfolioProgress() {
  const { data: projects } = useProjects();
  if (!projects?.length) return null;

  return (
    <Card as="section" aria-label="Portfolio progress">
      <Flex sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 3 }}>
        <Text variant="label">Portfolio</Text>
        <Link to="/portfolio">All projects</Link>
      </Flex>
      <Grid columns={[1, 2]} gap={3} sx={{ mt: 2 }}>
        {projects.map((p) => {
          const done = p.todos.filter((t) => t.completedAt).length;
          const open = p.todos.length - done;
          return (
            <Box key={p.id}>
              <Flex sx={{ justifyContent: "space-between", gap: 2, mb: 1 }}>
                <Text sx={{ fontSize: 0 }}>{p.name}</Text>
                <Text variant="meta">{p.todos.length ? `${open} open` : "Nothing listed"}</Text>
              </Flex>
              <Meter value={done} max={p.todos.length} label={`${p.name} improvements done`} />
            </Box>
          );
        })}
      </Grid>
    </Card>
  );
}
