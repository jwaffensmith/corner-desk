import type { Theme } from "theme-ui";

const field = {
  borderColor: "border",
  bg: "white",
  fontFamily: "body",
  fontSize: "16px",
  lineHeight: "body",
  px: 3,
  py: "10px",
  "&:focus-visible": { outline: "2px solid", outlineColor: "accent", outlineOffset: 1 },
};

export const theme: Theme = {
  colors: {
    text: "#242E20",
    background: "#FEFBF6",
    primary: "#253D25",
    secondary: "#616F52",
    accent: "#697733",
    muted: "#F3EEE3",
    border: "#DCD5C5",
    wood: "#CC884D",
    white: "#FFFFFF",
  },
  fonts: {
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    heading: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  },
  fontSizes: [13, 15, 17, 20, 26, 34],
  fontWeights: { body: 400, heading: 600, bold: 600 },
  lineHeights: { body: 1.5, heading: 1.2 },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  radii: { sm: 6, md: 10 },
  text: {
    heading: { fontFamily: "heading", fontWeight: "heading", lineHeight: "heading", color: "primary" },
    label: { fontSize: 0, color: "secondary", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "bold" },
    meta: { fontSize: 0, color: "secondary" },
    tagline: { fontSize: "11px", color: "secondary", textTransform: "uppercase", letterSpacing: "0.28em" },
  },
  buttons: {
    primary: {
      bg: "primary", color: "background", borderRadius: "sm", fontSize: 1, fontWeight: "bold", cursor: "pointer",
      "&:hover": { bg: "text" },
      "&:disabled": { opacity: 0.5, cursor: "default" },
      "&:focus-visible": { outline: "2px solid", outlineColor: "accent", outlineOffset: 2 },
    },
    secondary: {
      variant: "buttons.primary", bg: "transparent", color: "primary", boxShadow: "inset 0 0 0 1px #DCD5C5",
      "&:hover": { bg: "muted" },
    },
    ghost: {
      variant: "buttons.primary", bg: "transparent", color: "secondary", fontWeight: "body", px: 2, py: 1,
      "&:hover": { bg: "muted", color: "text" },
    },
  },
  forms: {
    input: field,
    textarea: { ...field, minHeight: 44, resize: "vertical" },
    select: field,
    label: { fontSize: 0, color: "secondary", fontWeight: "bold", mb: 1 },
  },
  cards: {
    primary: { bg: "white", border: "1px solid", borderColor: "border", borderRadius: "md", p: 4 },
  },
  styles: {
    root: {
      fontFamily: "body", fontSize: 1, lineHeight: "body", color: "text", bg: "background",
      "*": { boxSizing: "border-box" },
      a: { color: "accent" },
      "input[type=checkbox], input[type=radio]": { accentColor: "#253D25" },
    },
  },
};
