import type { ReactNode } from "react";
import { Box, Text } from "theme-ui";

interface Props {
  title: string;
  meta?: ReactNode;
  dimmed?: boolean;
  struck?: boolean;
  onClick: () => void;
}

export function RowButton({ title, meta, dimmed, struck, onClick }: Props) {
  return (
    <Box
      as="button"
      onClick={onClick}
      sx={{
        flex: 1, minWidth: 0, textAlign: "left", bg: "transparent", border: 0, p: 1, borderRadius: "sm",
        font: "inherit", color: "inherit", cursor: "pointer",
        "&:hover": { bg: "muted" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "accent" },
      }}
    >
      <Text sx={{ display: "block", color: dimmed ? "secondary" : "text", textDecoration: struck ? "line-through" : "none" }}>
        {title}
      </Text>
      {meta && <Text variant="meta">{meta}</Text>}
    </Box>
  );
}
