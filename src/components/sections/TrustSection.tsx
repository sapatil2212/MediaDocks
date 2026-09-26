import Link from "next/link";
import { CheckCircle2, Clock, HardDrive, Lock, Shield, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const TRUST_FACTS = [
  {
    icon: HardDrive,
    title: "Zero Permanent Disk Storage",
    body: "When you download or transcode media, chunks are buffered ephemerally in server memory. As soon as the final byte reaches your browser, the temporary buffer is unlinked and destroyed.",
  },
  {
    icon: Clock,
    title: "30-Minute Token Lifespan",
    body: "Resolved media format links carry a 30-minute time-to-live (TTL). This ensures origin link tokens remain fresh and complies with source security policies.",
  },
  {
    icon: Lock,
    title: "No Account & No Personal Data",
    body: "We never ask for your email address, passwords, or personal details. The 'Recent links' history in your browser is stored strictly in your local device's localStorage.",
  },
  {
    icon: ShieldCheck,
    title: "500 MB Transparent Safeguard",
    body: "To prevent server memory exhaustion and keep response times fast for everyone, individual download jobs are capped at 500 MB (~60 minutes of 1080p).",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="scroll-mt-24 border-t border-border bg-surface-strong/20 py-20 lg:py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                Security & Data Integrity
              </span>
            </div>
            <h2 className="section-title mt-4">
              How MediaDocks handles your files and privacy
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Transparent, verifiable infrastructure details on how media flows through our servers.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_FACTS.map((fact, idx) => {
            const Icon = fact.icon;
            return (
              <Reveal key={fact.title} delay={idx * 60}>
                <div className="panel flex h-full flex-col justify-between p-6">
                  <div>
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-primary shadow-soft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-foreground">
                      {fact.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {fact.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Reveal delay={200}>
            <p className="text-xs text-muted-foreground">
              Want to review our detailed legal and privacy commitments?{" "}
              <Link
                href="/privacy"
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Read our Privacy Policy
              </Link>{" "}
              or{" "}
              <Link
                href="/terms"
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Terms of Service
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
