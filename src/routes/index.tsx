import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { LockScreen } from "@/components/thoughts/LockScreen";
import { NoteList } from "@/components/thoughts/NoteList";
import { Recorder } from "@/components/thoughts/Recorder";
import { ThemeToggle } from "@/components/thoughts/ThemeToggle";
import { listNotes, type Note } from "@/lib/db";
import { setupServiceWorker } from "@/lib/pwa";
import { getLockMinutes, setLockMinutes } from "@/lib/security";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thoughts — Private voice notes, stored on your device" },
      {
        name: "description",
        content:
          "Record voice memos behind a fingerprint or password lock. Notes stay in your browser, work offline, and are never uploaded.",
      },
      { property: "og:title", content: "Thoughts — Private voice notes" },
      {
        property: "og:description",
        content: "Locked, offline-first voice memos that never leave your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [lockMinutes, setMinutes] = useState(2);

  const refresh = useCallback(() => {
    listNotes().then(setNotes);
  }, []);

  useEffect(() => {
    setupServiceWorker();
    getLockMinutes().then(setMinutes);
  }, []);

  useEffect(() => {
    if (unlocked) refresh();
  }, [unlocked, refresh]);

  // Auto-lock on inactivity or when the tab loses focus.
  useEffect(() => {
    if (!unlocked) return;
    let timer = window.setTimeout(() => setUnlocked(false), lockMinutes * 60_000);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setUnlocked(false), lockMinutes * 60_000);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") setUnlocked(false);
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onVisibility);
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onVisibility);
    };
  }, [unlocked, lockMinutes]);

  if (!unlocked) return <LockScreen onUnlocked={() => setUnlocked(true)} />;

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-xl bg-background px-4 pb-28 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Thoughts</h1>
          <p className="text-xs text-muted-foreground">{notes.length} note{notes.length === 1 ? "" : "s"} on this device</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setUnlocked(false)}
            aria-label="Lock app"
            className="rounded-full bg-card p-2.5 text-foreground ring-1 ring-border"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border">
          <label htmlFor="autolock" className="text-muted-foreground">
            Auto-lock after
          </label>
          <select
            id="autolock"
            value={lockMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMinutes(v);
              setLockMinutes(v);
            }}
            className="rounded-xl bg-secondary px-3 py-1.5 text-foreground outline-none ring-1 ring-border"
          >
            {[1, 2, 5, 10].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
        <NoteList notes={notes} onChanged={refresh} />
      </div>

      <Recorder onSaved={refresh} />
    </main>
  );
}
