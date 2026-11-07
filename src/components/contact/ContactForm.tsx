"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

const CONTACT_EMAIL = "sapdigitechsolutions@gmail.com";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /**
   * There is no mail-sending backend, so this composes an email in the visitor's
   * own mail app instead of pretending the message was delivered.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const body = `${message.trim()}\n\n${name.trim()}\n${email.trim()}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      `[MediaDocks] ${subject}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = href;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">Your email is ready to send</h3>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          Your mail app should have opened with the message filled in. Press send there to
          deliver it. Nothing has been sent from this page yet.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          If nothing opened, write to{" "}
          <a className="font-semibold text-primary underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
          }}
          className="mt-6 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-strong"
        >
          Edit the message
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-foreground">
            Your Name <span className="text-primary">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-foreground">
            Email Address <span className="text-primary">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-xs font-semibold text-foreground">
          Subject / Inquiry Type
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
        >
          <option value="General Support">General Support & Troubleshooting</option>
          <option value="Bug Report">Technical Bug Report</option>
          <option value="DMCA & Copyright">Copyright Notice</option>
          <option value="Feature Request">Feature Suggestion</option>
          <option value="Business Inquiry">Business or Partnership Inquiry</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-foreground">
          Message Details <span className="text-primary">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe your question or issue in detail. If reporting a link failure, include the public platform URL."
          className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[0.7rem] text-muted-foreground">\n          This opens your email app. Nothing is sent until you press send there.\n        </span>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
        >
          <Send className="h-3.5 w-3.5" />\n          <span>Compose email</span>
        </button>
      </div>
    </form>
  );
}
