import { keyframes } from "@emotion/react";
import { Box, Flex, Text, type ThemeUIStyleObject } from "theme-ui";

const spin = keyframes({ to: { transform: "rotate(360deg)" } });
const appear = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

// Held back briefly so a fast response doesn't flash a spinner.
const delayedAppear = `${appear} 0.2s ease-out 0.2s both`;

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size, height: size, flexShrink: 0, borderRadius: "50%",
        border: "2px solid", borderColor: "border", borderTopColor: "accent",
        animation: `${spin} 0.7s linear infinite`,
        "@media (prefers-reduced-motion: reduce)": { animationDuration: "2.8s" },
      }}
    />
  );
}

const layouts: Record<"page" | "screen" | "inline", ThemeUIStyleObject> = {
  page: { flexDirection: "column", justifyContent: "center", gap: 3, minHeight: "40vh" },
  screen: { flexDirection: "column", justifyContent: "center", gap: 3, minHeight: "100vh" },
  inline: { gap: 2, my: 3 },
};

export function Loading({ label = "Loading…", layout = "page" }: { label?: string; layout?: keyof typeof layouts }) {
  const inline = layout === "inline";
  return (
    <Flex role="status" sx={{ alignItems: "center", color: "secondary", animation: delayedAppear, ...layouts[layout] }}>
      <Spinner size={inline ? 16 : 28} />
      <Text sx={{ fontSize: inline ? 1 : 0 }}>{label}</Text>
    </Flex>
  );
}
