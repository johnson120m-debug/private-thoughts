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
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3">
      {active && (
        <div className="mb-1 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-xl ring-1 ring-border">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">Recording</span>
            <span className="font-mono text-lg tabular-nums leading-none text-foreground">
              {formatDuration(seconds)}
            </span>
          </div>
          <button
            onClick={state === "recording" ? pause : resume}
            aria-label={state === "recording" ? "Pause recording" : "Resume recording"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform active:scale-95"
          >
            {state === "recording" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            onClick={stop}
            aria-label="Stop and save recording"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>
      )}

      {!active ? (
        <button
          onClick={start}
          aria-label="Start recording"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95"
        >
          <Mic className="h-6 w-6" />
        </button>
      ) : (
        <button
          onClick={stop}
          aria-label="Stop and save recording"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-xl transition-transform active:scale-95"
        >
          <Square className="h-6 w-6" />
        </button>
      )}

      {error && (
        <p className="max-w-[calc(100vw-2rem)] rounded-xl bg-card px-3 py-2 text-center text-xs text-destructive shadow-lg ring-1 ring-border">
          {error}
        </p>
      )}
    </div>
  );
}
