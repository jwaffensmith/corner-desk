import { useId } from "react";
import { Flex, Label } from "theme-ui";
import type { BookNoteKind } from "@cornerdesk/shared";

const KINDS: { value: BookNoteKind; label: string }[] = [
  { value: "NOTE", label: "Note" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "WONDERING", label: "Wondering" },
];

export function KindPicker({ value, onChange }: { value: BookNoteKind; onChange: (kind: BookNoteKind) => void }) {
  const name = useId();
  return (
    <Flex role="radiogroup" aria-label="File under" sx={{ gap: 3, alignItems: "center", flexWrap: "wrap" }}>
      {KINDS.map((k) => (
        <Label key={k.value} sx={{ width: "auto", gap: 1, m: 0, alignItems: "center", fontSize: 1, color: "text", fontWeight: "body" }}>
          <input type="radio" name={name} checked={value === k.value} onChange={() => onChange(k.value)} />
          {k.label}
        </Label>
      ))}
    </Flex>
  );
}
