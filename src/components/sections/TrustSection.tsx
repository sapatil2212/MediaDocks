import Link from "next/link";
import { Clock, HardDrive, Lock, Shield, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const TRUST_FACTS = [
  {
    icon: HardDrive,
    title: "No media library",
    body: "Files you send to the server for processing are handled in a temporary location scoped to the request and are not kept as a library or archive.",
  },
  {
    icon: Clock,
    title: "Many tools stay in your browser",
    body: "The image converter, resizer, PDF, SVG, Base64 and QR tools, and the Background Remover, run in your browser, so those files do not need to be uploaded.",
  },
  {
    icon: Lock,
    title: "No account",
    body: "There is no sign-up and no password. Anything you do not send to a server stays on your device.",
  },
  {
    icon: ShieldCheck,
    title: "Stated limits",
    body: "AI transcription accepts uploads up to 100 MB and two hours by default. Each tool page lists its own limits.",
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
              What happens to the files you use with each tool.
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
