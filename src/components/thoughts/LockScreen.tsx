import { Fingerprint, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import {
  biometricsSupported,
  enrollBiometrics,
  hasBiometrics,
  hasPassword,
  setPassword,
  unlockWithBiometrics,
  verifyPassword,
} from "@/lib/security";

type Props = { onUnlocked: () => void };

export function LockScreen({ onUnlocked }: Props) {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [password, setPasswordInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setNeedsSetup(!(await hasPassword()));
      setBioEnrolled(await hasBiometrics());
      setReady(true);
    })();
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMessage("Use at least 6 characters.");
    if (password !== confirm) return setMessage("Passwords don't match.");
    await setPassword(password);
    onUnlocked();
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (await verifyPassword(password)) return onUnlocked();
    setMessage("Incorrect password.");
    setPasswordInput("");
  }

  async function handleBiometric() {
    setMessage(null);
    try {
      if (await unlockWithBiometrics()) onUnlocked();
      else setMessage("Fingerprint unlock isn't set up yet.");
    } catch {
      setMessage("Fingerprint check didn't complete.");
    }
  }

  async function handleEnroll() {
    setMessage(null);
    try {
      await enrollBiometrics();
      setBioEnrolled(true);
      setMessage("Fingerprint unlock enabled.");
    } catch {
      setMessage("Couldn't enable fingerprint unlock on this device.");
    }
  }

  if (!ready) return <div className="min-h-dvh bg-background" />;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg">
        <Lock className="h-7 w-7" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Thoughts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsSetup ? "Set a password to protect your notes." : "Locked. Unlock to see your notes."}
        </p>
      </div>

      <form
        onSubmit={needsSetup ? handleSetup : handleUnlock}
        className="w-full max-w-sm space-y-3 rounded-3xl bg-card p-5 ring-1 ring-border"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoComplete={needsSetup ? "new-password" : "current-password"}
          className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
        />
        {needsSetup && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            aria-label="Confirm password"
            autoComplete="new-password"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
          />
        )}
        <button
          type="submit"
          className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          {needsSetup ? "Create password" : "Unlock"}
        </button>

        {biometricsSupported() && !needsSetup && (
          <button
            type="button"
            onClick={bioEnrolled ? handleBiometric : handleEnroll}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
          >
            <Fingerprint className="h-4 w-4" />
            {bioEnrolled ? "Unlock with fingerprint" : "Enable fingerprint unlock"}
          </button>
        )}
        {message && <p className="text-center text-xs text-muted-foreground">{message}</p>}
      </form>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Everything stays on this device. Nothing is uploaded.
      </p>
    </main>
  );
}
