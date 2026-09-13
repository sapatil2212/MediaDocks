"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ClipboardPaste, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/PlatformIcon";
import { detectPlatform } from "@/lib/platforms";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPaste: () => void;
  onClear: () => void;
  loading: boolean;
  invalid: boolean;
  /** Platform pages pass a more specific prompt. */
  placeholder?: string;
}

/** Cmd on Apple platforms, Ctrl elsewhere — shown in the paste hint. */
function useMetaKeyLabel(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    const isApple = /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
    setLabel(isApple ? "⌘" : "Ctrl");
  }, []);
  return label;
}

export function UrlInput({
  value,
  onChange,
  onSubmit,
  onPaste,
  onClear,
  loading,
  invalid,
  placeholder = "Paste a video, reel, photo or post link",
}: UrlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const metaKey = useMetaKeyLabel();

  const trimmed = value.trim();
  const detection = detectPlatform(trimmed);
  const recognised = Boolean(detection.platform);
  const unknownHost = trimmed.length > 0 && detection.isUrl && !recognised;

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const text =
            e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
          if (text) {
            onChange(text.trim());
            inputRef.current?.focus();
          }
        }}
        className={cn(
          "rounded-2xl border bg-surface p-1.5 transition-all duration-300",
          dragging
            ? "border-primary bg-accent/50 shadow-glow"
            : invalid
              ? "border-destructive/60 shadow-soft"
              : focused
                ? "border-primary/60 shadow-lift"
                : "border-border shadow-soft",
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
            {/* The leading slot doubles as live platform feedback. */}
            <span className="grid h-6 w-6 shrink-0 place-items-center" aria-hidden="true">
              {recognised && detection.platform ? (
                <PlatformIcon
                  platform={detection.platform.id}
                  className={cn("animate-pop h-5 w-5", detection.platform.colorClass)}
                />
              ) : (
                <Search
                  className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    focused ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
            </span>

            <label htmlFor="media-url" className="sr-only">
              Media link from YouTube, Instagram, X, Pinterest or Facebook
            </label>
            <input
              id="media-url"
              ref={inputRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={value}
              aria-invalid={invalid}
              aria-describedby="media-url-hint"
              disabled={loading}
              placeholder={placeholder}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
                if (e.key === "Escape" && value) onClear();
              }}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60 sm:h-14"
            />

            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear the link"
                onClick={onClear}
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={onPaste}
                className="hidden h-9 shrink-0 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <ClipboardPaste className="h-4 w-4" />
                Paste
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onPaste}
              className="h-12 flex-1 rounded-xl text-sm font-semibold sm:hidden"
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="group h-12 flex-1 rounded-xl px-6 text-sm font-semibold shadow-glow transition-transform hover:-translate-y-0.5 disabled:translate-y-0 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reading link
                </>
              ) : (
                <>
                  Get formats
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* One live hint line, so the field always explains its own state. */}
      <p
        id="media-url-hint"
        aria-live="polite"
        className={cn(
          "min-h-5 px-1 text-xs",
          unknownHost ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {dragging ? (
          "Drop the link to fill the field"
        ) : recognised && detection.platform ? (
          <>
            <span className="font-semibold text-foreground">{detection.platform.name}</span>{" "}
            detected — {detection.platform.outputs}
          </>
        ) : unknownHost ? (
          "That host isn't supported yet. Try a YouTube, Instagram, X, Pinterest or Facebook link."
        ) : (
          <>
            Press{" "}
            <kbd className="rounded border border-border bg-surface-strong px-1 font-sans text-[0.7rem] font-semibold">
              {metaKey} V
            </kbd>{" "}
            to paste, or drag a link in. Enter starts it.
          </>
        )}
      </p>
    </div>
  );
}
