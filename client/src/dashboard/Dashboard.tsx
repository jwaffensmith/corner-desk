import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text } from "theme-ui";
import { useCurrent } from "../api";
import { ProgressStrip } from "../prep/ProgressStrip";

export function Dashboard() {
  const current = useCurrent();

  if (current.isError) return <Text role="alert">Couldn't load your progress. Is the API running?</Text>;
  if (!current.data) return <Text>Loading…</Text>;

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
    </Flex>
  );
}
