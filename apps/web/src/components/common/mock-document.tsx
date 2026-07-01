import { cn } from "@/lib/utils";
import { CheckSquare, ImageIcon, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

export default function MockDocument() {
  const [checked, setChecked] = useState([true, false, true]);

  const toggle = (i: number) =>
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_30px_rgba(0,0,0,0.3)]">
      {/* fake window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="ml-2 text-[12px] text-muted-foreground">
          Product Launch — Jotion
        </span>
      </div>

      <div className="space-y-4 px-8 py-8 sm:px-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-2xl dark:bg-amber-500/10">
          🚀
        </div>

        <h2 className="text-3xl font-bold tracking-tight">Q3 Product Launch</h2>

        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Everything we need to ship on time, in one page. Add notes, assign
          owners, drop in mockups — it all lives here.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Engineering", "Design", "Q3"].map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-muted px-2 py-0.5 text-[12px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2.5">
          <p className="text-[14px] font-semibold">Launch checklist</p>
          {[
            "Finalize onboarding flow",
            "Write release notes",
            "Schedule announcement email",
          ].map((task, i) => (
            <button
              key={task}
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-2.5 rounded px-1.5 py-1 text-left hover:bg-accent"
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                  checked[i]
                    ? "border-foreground bg-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {checked[i] && (
                  <CheckSquare className="h-3 w-3 text-background" />
                )}
              </span>
              <span
                className={cn(
                  "text-[14px]",
                  checked[i] && "text-muted-foreground line-through",
                )}
              >
                {task}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span className="text-[13px]">Drop an image, or click to upload</span>
        </div>

        <button className="flex items-center gap-1.5 text-[13px] text-muted-foreground/70 hover:text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          Add a block
        </button>
      </div>

      {/* floating collaborator avatars, like Notion's live presence */}
      <div className="absolute -right-3 -top-3 flex">
        <Avatar className="h-7 w-7 border-2 border-background">
          <AvatarFallback className="bg-violet-500 text-[11px] text-white">
            S
          </AvatarFallback>
        </Avatar>
        <Avatar className="-ml-2 h-7 w-7 border-2 border-background">
          <AvatarFallback className="bg-emerald-500 text-[11px] text-white">
            M
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
