import MockDocument from '@/components/common/mock-document'
import Navbar from '@/components/common/navbar'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Smile } from 'lucide-react'
import * as m from '@/paraglide/messages'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAuthPopover } from '@/features/auth/hooks/use-auth-popover'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

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
  )
}

function Hero() {
  const session = useSession()
  const user = session.data?.user
  const { open: openAuth } = useAuthPopover()

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[13px] text-muted-foreground">
          <Smile className="h-3.5 w-3.5" />
          {m.landing_hero_badge()}
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {m.landing_hero_title_1()}
          <br />
          {m.landing_hero_title_2()}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          {m.landing_hero_description()}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link to="/app">
              <Button size="lg" className="h-10 gap-1.5 px-5 text-[14px]">
                {m.landing_cta_get_started()}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="h-10 gap-1.5 px-5 text-[14px]"
              onClick={openAuth}
            >
              {m.landing_cta_get_started()}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16">
        <MockDocument />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-linear-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-500/3"
      />
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: '📝',
      title: m.landing_feature_write_title(),
      body: m.landing_feature_write_body(),
    },
    {
      icon: '✅',
      title: m.landing_feature_track_title(),
      body: m.landing_feature_track_body(),
    },
    {
      icon: '🗂️',
      title: m.landing_feature_organize_title(),
      body: m.landing_feature_organize_body(),
    },
    {
      icon: '🤝',
      title: m.landing_feature_collab_title(),
      body: m.landing_feature_collab_body(),
    },
  ]

  return (
    <section className="border-t border-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {m.landing_features_heading()}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {m.landing_features_subheading()}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {features.map((f) => (
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
  )
}

function CTA() {
  const session = useSession()
  const user = session.data?.user
  const { open: openAuth } = useAuthPopover()

  return (
    <section className="border-t border-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {m.landing_cta_section_title()}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {m.landing_cta_section_desc()}
        </p>
        <div className="mt-7">
          {user ? (
            <Link to="/app">
              <Button size="lg" className="h-10 gap-1.5 px-6 text-[14px]">
                {m.landing_cta_get_started()}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="h-10 gap-1.5 px-6 text-[14px]"
              onClick={openAuth}
            >
              {m.landing_cta_get_started()}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
