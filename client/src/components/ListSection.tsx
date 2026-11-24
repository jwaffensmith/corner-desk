import { useId, type ReactNode } from "react";
import { Box, Heading } from "theme-ui";

export function ListSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <Box as="section" aria-labelledby={id}>
      <Heading as="h2" id={id} sx={{ fontSize: 2 }}>{title}</Heading>
      <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>{children}</Box>
    </Box>
  );
}
