import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { adStateCopy, getAdState } from "@/lib/ads/ad-state";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "What MediaDocks processes, which cookies and storage it uses, how Google may use advertising cookies and web beacons, how to change your ad choices, and how to contact us.",
  path: "/privacy",
});

/** Plain external link used throughout the policy. */
function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function Section({
  id,
  title,
  delay,
  children,
}: {
  id?: string;
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay}>
      <div id={id} className="panel scroll-mt-24 space-y-4 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <div className="space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {children}
        </div>
      </div>
    </Reveal>
  );
}

export default function PrivacyPage() {
  const ads = adStateCopy(getAdState());

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy" },
          ]),
        ]}
      />

      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        <InteractiveBackground />
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
          aria-hidden="true"
        />
        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-foreground">
                  Privacy
                </span>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Privacy Policy
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                This policy describes what MediaDocks processes when you use the site, and how
                advertising and analytics work.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Effective date: 7 November 2026</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-8">
          <Section title="1. Summary" delay={0}>
            <ul className="list-disc space-y-2 pl-5">
              <li>MediaDocks has no user accounts. You do not give us a name or password to use a tool.</li>
              <li>
                Files that must be processed on the server are handled in a temporary location for
                the request. Many tools process files in your browser and never upload them.
              </li>
              <li>
                Like any web server, ours sees your IP address and browser details while it answers
                a request. Usage statistics use a one-way daily digest instead of storing the address.
              </li>
              <li>
                Advertising, when enabled, is provided by Google and uses cookies and similar
                technologies. See sections 3 and 4.
              </li>
            </ul>
          </Section>

          <Section title="2. Information we process" delay={30}>
            <p>
              <strong className="text-foreground">Uploaded files.</strong> The AI transcription,
              subtitle and summary tools send the audio from a file you upload to Google&apos;s
              Gemini API to produce your result. Video to Audio uploads the video to our server so
              the audio can be extracted and returned. Server-side copies are temporary and tied to
              the request; MediaDocks does not keep a library of uploads.
            </p>
            <p>
              <strong className="text-foreground">Browser-only tools.</strong> The image converter,
              image resizer, PDF to image, image to PDF, SVG to PNG, Base64 and QR code tools run in
              your browser, and so does the Background Remover. The Background Remover downloads an
              image model from Hugging Face (huggingface.co) when you first use it; your images are
              not sent there.
            </p>
            <p>
              <strong className="text-foreground">Short links.</strong> The URL shortener stores the
              destination address you submit, the short code, a creation time and a click count so
              the link can redirect. Do not shorten addresses that contain secrets.
            </p>
            <p>
              <strong className="text-foreground">Link tools reachable by direct link.</strong> If
              you paste a public media link into one of the link tools that are reachable by direct
              address, our server requests public metadata for that link. To avoid repeating
              requests we store a one-way hash of the address with a short expiry (30 minutes by
              default), not the address itself.
            </p>
            <p>
              <strong className="text-foreground">Server logs.</strong> Our server records request
              details such as the time, the endpoint and an outcome code to operate the service and
              investigate problems. These logs are not used to build profiles. Rate limiting keeps a short-lived hash of the IP
              address in the server&apos;s memory to slow abusive request bursts.
            </p>
          </Section>

          <Section title="3. Cookies and local storage" delay={60}>
            <p>
              <strong className="text-foreground">Set by MediaDocks.</strong> MediaDocks sets no
              cookie for visitor measurement and no cookie for public visitors to sign in. Two
              cookies exist for the site operator&apos;s admin area: a signed session cookie while
              the operator is signed in, and a cookie named{" "}
              <code className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-foreground">
                sidebar_state
              </code>{" "}
              that remembers whether the admin sidebar is open.
            </p>
            <p>
              <strong className="text-foreground">Local storage in your browser.</strong> The site
              keeps your theme choice, a short list of recent items, and a list of links you created
              with the URL shortener in your browser&apos;s local storage. This data stays on your
              device and you can clear it in your browser settings.
            </p>
            <p>
              <strong className="text-foreground">Set by Google.</strong> If advertising is enabled
              and you are shown ads, Google and its partners may set or read cookies and similar
              identifiers on your device, as described in the next section.
            </p>
          </Section>

          <Section title="4. Advertising and Google" delay={90}>
            <p>{ads.summary}</p>
            <p>
              MediaDocks does not place ads on tool screens, downloader pages, short links or
              legal pages. If ads are enabled, they appear only on long-form guide pages.
            </p>
            <p>If ads are enabled, the following applies:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Google, as a third-party vendor, uses cookies, including the DoubleClick cookie, to
                serve ads on this site. Other third-party vendors may also set cookies.
              </li>
              <li>
                Google and its partners may use <strong className="text-foreground">web beacons</strong>{" "}
                (small image requests that report that a page or ad was viewed) and similar
                technologies to measure and serve ads.
              </li>
              <li>
                When an ad is requested, Google receives your{" "}
                <strong className="text-foreground">IP address</strong>, your browser and device
                details, the page being viewed, and identifiers stored in its cookies.
              </li>
              <li>
                Ads can be <strong className="text-foreground">personalized</strong>, based on your
                visits to this and other sites, or{" "}
                <strong className="text-foreground">non-personalized</strong>, based on the content of
                the page and general information such as your approximate location. Which kind you
                see depends on your Google settings and on the consent you give where consent is
                required.
              </li>
              <li>
                Where the law requires consent, for example in the European Economic Area, the United
                Kingdom and Switzerland, ads are requested only after a consent tool reports your
                choice.
              </li>
            </ul>
            <p>
              To learn how Google uses data when you use sites that use its services, see{" "}
              <Ext href="https://policies.google.com/technologies/partner-sites">
                How Google uses information from sites or apps that use our services
              </Ext>
              .
            </p>
          </Section>

          <Section id="ad-choices" title="5. Your ad choices" delay={120}>
            <p>{ads.choices}</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Manage Google ad personalization in{" "}
                <Ext href="https://adssettings.google.com">Google Ads Settings</Ext>.
              </li>
              <li>
                Opt out of personalized advertising from participating vendors at{" "}
                <Ext href="https://www.aboutads.info/choices/">aboutads.info</Ext>.
              </li>
              <li>
                If you are in the European Economic Area, use{" "}
                <Ext href="https://www.youronlinechoices.com/">Your Online Choices</Ext>.
              </li>
              <li>You can also block or delete cookies in your browser settings.</li>
            </ul>
            <p>
              See the guides library at{" "}
              <Link href="/guides" className="font-semibold text-primary underline underline-offset-4">
                /guides
              </Link>{" "}
              for the pages on which a consent control, when installed, is available.
            </p>
          </Section>

          <Section title="6. AI processing (Google Gemini API)" delay={150}>
            <p>
              The Video to Text, Audio to Text, Audio Summarizer and Subtitle tools send audio to
              Google&apos;s Gemini API over an encrypted connection to produce transcripts, subtitles
              and summaries. MediaDocks does not use your files or results to train its own models.
              Google processes the data under its own terms and privacy notices, which we do not
              control.
            </p>
          </Section>

          <Section title="7. Usage statistics" delay={180}>
            <p>
              MediaDocks records anonymous usage events to see which pages and tools are used and
              whether they fail. For a page view or tool request we store the page path, a device
              class (such as mobile or desktop), the referring host (not the full referring address),
              an outcome and, for link tools, the platform name.
            </p>
            <p>
              To count distinct visitors without storing IP addresses, the server computes a one-way
              SHA-256 digest of the IP address, the browser string, a secret salt and the calendar
              date, and keeps the first part of it. The value changes every day, cannot be turned
              back into an address, and cannot be linked across days. Events are deleted after 90
              days by default. Known crawlers are not counted.
            </p>
          </Section>

          <Section title="8. Your rights and contact" delay={210}>
            <p>
              Depending on where you live, you may have rights to access, correct or delete personal
              data, to object to processing, and to withdraw consent. MediaDocks has no accounts and
              generally holds no data that identifies you, but if you think we hold data about you,
              email{" "}
              <a
                href="mailto:sapdigitechsolutions@gmail.com?subject=Privacy%20request"
                className="font-semibold text-primary underline underline-offset-4"
              >
                sapdigitechsolutions@gmail.com
              </a>{" "}
              and describe the request. For data that Google holds through advertising, use the links
              in section 5.
            </p>
            <p>
              We may update this policy when the site changes. The effective date at the top shows
              when the text last changed in a way that matters.
            </p>
          </Section>
        </div>
      </section>

      <CTASection />
    </>
  );
}
