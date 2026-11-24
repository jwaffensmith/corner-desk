import { useEffect, useRef, useState } from "react";
import { Box, Button, Text } from "theme-ui";

interface Item {
  label: string;
  hint?: string;
  onSelect: () => void;
}

export function Menu({ label, items, disabled }: { label: string; items: Item[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const outside = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      root.current?.querySelector("button")?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const options = [...root.current!.querySelectorAll<HTMLElement>("[role=menuitem]")];
    const next = options.indexOf(document.activeElement as HTMLElement) + (e.key === "ArrowDown" ? 1 : -1);
    options[(next + options.length) % options.length]?.focus();
  }

  return (
    <Box ref={root} onKeyDown={onKeyDown} sx={{ position: "relative" }}>
      <Button variant="secondary" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label} <Text aria-hidden sx={{ fontSize: 0 }}>▾</Text>
      </Button>
      {open && (
        <Box
          role="menu"
          aria-label={label}
          sx={{
            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 1, minWidth: 240, p: 1,
            bg: "white", border: "1px solid", borderColor: "border", borderRadius: "md",
            boxShadow: "0 6px 20px rgba(36, 46, 32, 0.12)",
          }}
        >
          {items.map((item) => (
            <Box
              as="button"
              role="menuitem"
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              sx={{
                display: "block", width: "100%", textAlign: "left", bg: "transparent", border: 0, borderRadius: "sm",
                px: 3, py: 2, font: "inherit", color: "text", cursor: "pointer",
                "&:hover, &:focus-visible": { bg: "muted", outline: "none" },
              }}
            >
              {item.label}
              {item.hint && <Text variant="meta" sx={{ display: "block" }}>{item.hint}</Text>}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
