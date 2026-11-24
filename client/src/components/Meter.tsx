import { Box } from "theme-ui";

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <Box
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      sx={{ height: 8, bg: "muted", borderRadius: 99, overflow: "hidden" }}
    >
      <Box sx={{ width: `${percent}%`, height: "100%", bg: "accent", borderRadius: 99, transition: "width .2s" }} />
    </Box>
  );
}
