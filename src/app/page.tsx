import Link from "next/link";
import {
  UtensilsCrossed,
  Zap,
  Users,
  CalendarRange,
  Bell,
  Smartphone,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "Meal ledger",
    description:
      "Log daily meals, bazaar spending and deposits. Meal rate and each member's balance recalculate automatically.",
  },
  {
    icon: Zap,
    title: "Utilities & shared costs",
    description:
      "Rent, electricity, internet and every other shared bill — split equally or custom, paid by a member or the Cottage Balance.",
  },
  {
    icon: CalendarRange,
    title: "Monthly statements",
    description:
      "Generate a full category-by-category utility statement per member before settling up — transparent, never a single mystery total.",
  },
  {
    icon: Users,
    title: "Members & permissions",
    description:
      "Invite roommates, assign who can add meals, costs or deposits, and track bazaar duty — all from one place.",
  },
  {
    icon: Bell,
    title: "Real-time notifications",
    description:
      "Everyone stays in sync automatically when a bill, meal or settlement gets added — no group chat required.",
  },
  {
    icon: Smartphone,
    title: "Install on any device",
    description:
      "Cottage is a full Progressive Web App — install it on Android, iOS or desktop and use it like a native app.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Logo size={30} />
            Cottage
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Log in
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />} className="rounded-full">
              Sign up free
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, #FBEAE5 0%, rgba(251,234,229,0) 70%)",
            }}
          />
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
              <ShieldCheck className="size-3.5 text-primary sm:size-4" />
              Built for shared houses, not spreadsheets
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              One house.
              <br className="sm:hidden" /> One ledger.{" "}
              <span className="text-primary">Zero confusion.</span>
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Cottage tracks meals, utilities and shared expenses for your roommates — so
              everyone always knows exactly what they owe, and why.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/signup" />}
                className="h-12 rounded-full px-8 text-base"
              >
                Start your Cottage
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/login" />}
                className="h-12 rounded-full px-8 text-base"
              >
                Sign in as a member
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Free to use. No credit card. Set up your house in under a minute.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything your house needs
            </h2>
            <p className="text-muted-foreground">
              Meals, bills and settle-ups — Cottage keeps every roommate&apos;s numbers
              straight, automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="gap-3 rounded-2xl p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Up and running in three steps
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Create your Cottage",
                  body: "Sign up and you're the admin — invite your roommates by email in seconds.",
                },
                {
                  step: "2",
                  title: "Log as you go",
                  body: "Add a meal, a bazaar run or a utility bill whenever it happens. Everyone sees it instantly.",
                },
                {
                  step: "3",
                  title: "Settle up with confidence",
                  body: "Generate a clear statement each month and settle up — no arguments, no guesswork.",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to stop tracking rent in a group chat?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Create your Cottage now — it takes less time than the last argument about who owes
            what.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="mt-8 h-12 rounded-full px-8 text-base"
          >
            Get started for free
            <ArrowRight />
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Logo size={22} />
            Cottage
          </div>
          <p>Shared-house expense manager for every Cottage.</p>
        </div>
      </footer>
    </div>
  );
}
