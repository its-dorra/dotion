import { SlidersHorizontal, Sparkles, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchMode } from "../types"
import * as m from "@/paraglide/messages"

interface SearchModeSelectorProps {
  mode: SearchMode
  onSelectMode: (mode: SearchMode) => void
}

export function SearchModeSelector({
  mode,
  onSelectMode,
}: SearchModeSelectorProps) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/30 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-muted-foreground font-medium mr-1 select-none">
          {m.search_dialog_mode_label()}
        </span>
        <button
          type="button"
          onClick={() => onSelectMode("balanced")}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer",
            mode === "balanced"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title={m.search_dialog_mode_balanced_tooltip()}
        >
          <SlidersHorizontal className="size-3" />
          <span>{m.search_dialog_mode_balanced()}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("conceptual")}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer",
            mode === "conceptual"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title={m.search_dialog_mode_conceptual_tooltip()}
        >
          <Sparkles className="size-3" />
          <span>{m.search_dialog_mode_conceptual()}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("exact")}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer",
            mode === "exact"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title={m.search_dialog_mode_exact_tooltip()}
        >
          <Target className="size-3" />
          <span>{m.search_dialog_mode_exact()}</span>
        </button>
      </div>
      <span className="text-[10px] text-muted-foreground/70 hidden sm:inline select-none">
        {mode === "balanced" && m.search_dialog_mode_balanced_desc()}
        {mode === "conceptual" && m.search_dialog_mode_conceptual_desc()}
        {mode === "exact" && m.search_dialog_mode_exact_desc()}
      </span>
    </div>
  )
}
