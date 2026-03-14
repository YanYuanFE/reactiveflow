import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Shield,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/shared/WalletButton";
import { Logo } from "@/components/shared/Logo";
import { FlowAnimation } from "@/components/shared/FlowAnimation";

const STEPS = [
  {
    label: "WHEN",
    color: "text-primary",
    borderColor: "border-primary",
    bgColor: "bg-primary/5",
    title: "An event fires",
    description:
      "Token transfer, price update, DEX swap, or any custom event emitted on Somnia.",
    example: "Transfer > 10,000 USDC",
  },
  {
    label: "IF",
    color: "text-amber-600",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/5",
    title: "Conditions are met",
    description:
      "Optional guard with threshold comparisons, oracle lookups, or data-offset checks.",
    example: "Amount > 50,000",
  },
  {
    label: "THEN",
    color: "text-emerald-600",
    borderColor: "border-emerald-500",
    bgColor: "bg-emerald-500/5",
    title: "Actions execute",
    description:
      "Transfer tokens, swap via DEX, call a contract, or emit an on-chain alert.",
    example: "Emit whale alert",
  },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Event-Driven",
    description:
      "Listen to any on-chain event -- token transfers, price updates, DEX swaps, or custom contract emissions.",
  },
  {
    icon: Shield,
    title: "Conditional Logic",
    description:
      "Gate execution with conditions: thresholds, comparisons, oracle data. Flows only fire when your rules are met.",
  },
  {
    icon: Zap,
    title: "Automatic Execution",
    description:
      "Actions execute atomically on-chain via Somnia's Reactive precompile. No servers, no keepers, no cron jobs.",
  },
  {
    icon: Layers,
    title: "Template Library",
    description:
      "Start from pre-built templates -- whale alerts, price guardians, smart DCA -- and customize to your needs.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b px-6 py-4 lg:px-12">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <WalletButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="relative mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            Powered by Somnia Reactive Precompile
          </Badge>

          <h1 className="font-heading text-4xl font-extrabold text-balance leading-[1.1] sm:text-5xl lg:text-6xl">
            On-Chain Automation,{" "}
            <span className="text-primary">Reactive by Design</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            Build IFTTT-style workflows that listen to blockchain events and
            execute actions automatically. No servers. No cron jobs. Pure
            on-chain reactivity.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Launch App
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="lg">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Flow pipeline animation */}
        <div className="mx-auto mt-16 max-w-4xl">
          <FlowAnimation />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Three simple steps to automate any on-chain workflow
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.label} className="relative">
                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ChevronRight className="size-6 text-border" />
                  </div>
                )}

                <Card className={`h-full border-t-2 ${step.borderColor}`}>
                  <CardContent className="pt-6">
                    <span
                      className={`text-xs font-bold uppercase ${step.color}`}
                    >
                      {step.label}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-balance">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-pretty text-muted-foreground">
                      {step.description}
                    </p>
                    <div
                      className={`mt-4 rounded-md px-3 py-2 ${step.bgColor}`}
                    >
                      <code className="text-xs font-medium">
                        {step.example}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
              Built for the Reactive Chain
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              ReactiveFlow harnesses Somnia's native reactive precompile for
              truly autonomous on-chain automation
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-balance">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-t bg-muted/30 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
                Your Logic, On-Chain
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                Each flow is stored as a struct on Somnia. When the emitter
                contract fires the event you subscribed to, the Reactive
                precompile evaluates your conditions and executes your action —
                all in a single atomic transaction.
              </p>
              <div className="mt-8">
                <Link to="/flows/create">
                  <Button variant="outline" className="gap-2">
                    Create Your First Flow
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="bg-foreground text-background">
              <CardContent className="pt-6">
                <pre className="overflow-x-auto text-sm leading-relaxed">
                  <code>{`struct Flow {
  string   name;
  Trigger  trigger;   // WHEN
  Condition condition; // IF
  Action   action;    // THEN
  bool     active;
  uint256  executionCount;
}

// Reactive precompile callback
function react(
  bytes calldata rlpData
) external onlyReactive {
  // decode → evaluate → execute
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
            Start Building Reactive Flows
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Connect your wallet, pick a template or start from scratch, and
            deploy your first automated workflow in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Launch App
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="lg">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Logo size="sm" className="text-muted-foreground" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            Somnia Network
          </div>
        </div>
      </footer>
    </div>
  );
}
