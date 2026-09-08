import { Mic, Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { putNote, type Note } from "@/lib/db";
import { formatDuration } from "@/lib/format";

type Props = { onSaved: () => void };

export function Recorder({ onSaved }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const now = new Date();
        const note: Note = {
          id: crypto.randomUUID(),
          title: `Note ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          createdAt: now.getTime(),
          duration: seconds,
          mimeType: blob.type,
          blob,
        };
        await putNote(note);
        setSeconds(0);
        setState("idle");
        onSaved();
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setState("recording");
    } catch {
      setError("Microphone access was blocked. Allow it and try again.");
    }
  }

  function pause() {
    recorderRef.current?.pause();
    setState("paused");
  }

  function resume() {
    recorderRef.current?.resume();
    setState("recording");
  }

  function stop() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  const active = state !== "idle";

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
      <div className="flex flex-col items-center gap-5">
        <p className="font-mono text-4xl tabular-nums text-foreground">{formatDuration(seconds)}</p>
        <p className="text-sm text-muted-foreground">
          {state === "recording" ? "Recording…" : state === "paused" ? "Paused" : "Tap to record a thought"}
        </p>
        <div className="flex items-center gap-4">
          {!active && (
            <button
              onClick={start}
              aria-label="Start recording"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
            >
              <Mic className="h-8 w-8" />
            </button>
          )}
          {active && (
            <>
              <button
                onClick={state === "recording" ? pause : resume}
                aria-label={state === "recording" ? "Pause recording" : "Resume recording"}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform active:scale-95"
              >
                {state === "recording" ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <button
                onClick={stop}
                aria-label="Stop and save recording"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                <Square className="h-7 w-7" />
              </button>
            </>
          )}
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
