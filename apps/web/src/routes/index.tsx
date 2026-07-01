import MockDocument from "@/components/common/mock-document";
import Navbar from "@/components/common/navbar";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, FileText, Smile } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[13px] text-muted-foreground">
          <Smile className="h-3.5 w-3.5" />
          Now with real-time collaboration
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Your notes, docs, and
          <br />
          tasks. Together.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Jotion is the all-in-one workspace for your notes, projects, and
          collaboration. Write, plan, and organize — all in one place.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-10 gap-1.5 px-5 text-[14px]">
            Get Jotion free
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-10 gap-2 px-5 text-[14px]"
          >
            <FileText className="h-4 w-4" />
            Live demo
          </Button>
        </div>

        <p className="mt-3 text-[13px] text-muted-foreground/70">
          No credit card required · Free for personal use
        </p>
      </div>

      <div className="mt-16">
        <MockDocument />
      </div>

      {/* ambient gradient, kept faint and behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-linear-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-500/3"
      />
    </section>
  );
}

// -----------------------------------------------------------------------------
// Feature grid — Notion markets in plain nouns: Docs, Wiki, Projects
// -----------------------------------------------------------------------------
const FEATURES = [
  {
    icon: "📝",
    title: "Write it down",
    body: "A blank page that turns into anything — meeting notes, a wiki, a journal. Type / to add anything.",
  },
  {
    icon: "✅",
    title: "Track the work",
    body: "Turn any page into a board, a list, or a calendar. Assign owners, set due dates, and move things forward.",
  },
  {
    icon: "🗂️",
    title: "Organize by nesting",
    body: "Pages live inside pages. Build the hierarchy that matches how your team actually thinks.",
  },
  {
    icon: "🤝",
    title: "Work together, live",
    body: "See cursors move, leave comments inline, and never wonder who changed what.",
  },
];

function Features() {
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            One tool for your whole workflow
          </h2>
          <p className="mt-3 text-muted-foreground">
            Replace a dozen disconnected apps with one flexible workspace.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card p-6 transition-colors hover:bg-accent/40 sm:p-8"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// CTA band
// -----------------------------------------------------------------------------
function CTA() {
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your workspace, ready when you are
        </h2>
        <p className="mt-3 text-muted-foreground">
          Jotion is free to use for as long as you want. Add your team when
          you're ready.
        </p>
        <div className="mt-7">
          <Button size="lg" className="h-10 gap-1.5 px-6 text-[14px]">
            Get Dotion free
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
