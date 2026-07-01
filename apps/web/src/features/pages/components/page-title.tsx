import { useEffect, useRef, useState } from "react";

interface PageTitleProps {
  title: string;
  onChange: (title: string) => void;
  readOnly: boolean;
}

export function PageTitle({ title, onChange, readOnly }: PageTitleProps) {
  const [value, setValue] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      readOnly={readOnly}
      placeholder="Untitled"
      rows={1}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onChange(value.trim())}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          textareaRef.current?.blur();
        }
      }}
      className="w-full resize-none overflow-hidden border-none bg-transparent text-4xl font-bold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40"
    />
  );
}
