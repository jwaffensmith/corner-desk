import { useLayoutEffect, useRef } from "react";
import { Textarea, type TextareaProps } from "theme-ui";

// Grows with its content so long text is never clipped behind a scrollbar. CSS field-sizing
// does this natively; the measured height is the fallback for browsers without it.
export function TextArea(props: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el || CSS.supports("field-sizing", "content") || el.scrollHeight === 0) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(resize, [props.value]);

  return (
    <Textarea
      ref={ref}
      {...props}
      sx={{ fieldSizing: "content", minHeight: Number(props.rows ?? 2) * 24 + 22, ...props.sx }}
      onFocus={(e) => { resize(); props.onFocus?.(e); }}
      onInput={(e) => { resize(); props.onInput?.(e); }}
    />
  );
}
