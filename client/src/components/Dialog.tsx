import { useEffect, useRef, type ReactNode } from "react";
import { Button, Flex, Heading } from "theme-ui";

interface Props {
  title: string;
  onClose: () => void;
  drawer?: boolean;
  children: ReactNode;
}

// The native modal <dialog> supplies the focus trap, Escape to close, and focus return.
// No close() on cleanup: StrictMode's double effect would fire onClose and unmount it at once.
export function Dialog({ title, onClose, drawer, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (!el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      sx={{
        border: "1px solid", borderColor: "border", bg: "background", color: "text", p: 0,
        width: "min(560px, 100vw)", maxWidth: "100vw",
        ...(drawer
          ? { m: 0, ml: "auto", height: "100dvh", maxHeight: "100dvh" }
          : { borderRadius: "md", maxHeight: "85dvh" }),
        "&::backdrop": { bg: "rgba(36, 46, 32, 0.35)" },
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: 4, p: 5 }}>
        <Flex sx={{ justifyContent: "space-between", alignItems: "start", gap: 3 }}>
          <Heading as="h2" sx={{ fontSize: 3 }}>{title}</Heading>
          <Button variant="ghost" onClick={onClose} aria-label="Close">✕</Button>
        </Flex>
        {children}
      </Flex>
    </dialog>
  );
}
