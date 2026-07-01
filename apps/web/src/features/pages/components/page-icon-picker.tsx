import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PageIconPickerProps {
  icon?: string;
  onChange: (icon: string) => void;
}

const ICON_OPTIONS = [
  "📄", "📝", "📌", "📚", "💡", "🚀", "🛠️", "📐",
  "🚨", "🗺️", "✅", "📊", "🎯", "🔥", "⭐", "🧭",
];

export function PageIconPicker({ icon, onChange }: PageIconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-lg text-5xl leading-none transition-colors hover:bg-accent"
          aria-label="Change icon"
        >
          {icon ?? "📄"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {ICON_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-accent"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
