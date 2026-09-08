import { getMeta, setMeta } from "./db";

const PASS_KEY = "passwordRecord";
const CRED_KEY = "webauthnCredential";
const LOCK_MINUTES_KEY = "lockMinutes";

type PasswordRecord = { salt: string; hash: string; iterations: number };

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export async function hasPassword() {
  return Boolean(await getMeta<PasswordRecord>(PASS_KEY));
}

export async function setPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210000;
  const hash = await derive(password, salt, iterations);
  const record: PasswordRecord = { salt: toB64(salt.buffer), hash, iterations };
  await setMeta(PASS_KEY, record);
}

export async function verifyPassword(password: string) {
  const record = await getMeta<PasswordRecord>(PASS_KEY);
  if (!record) return false;
  const hash = await derive(password, fromB64(record.salt), record.iterations);
  return hash === record.hash;
}

/* ---------------- WebAuthn (device biometrics) ---------------- */

export const biometricsSupported = () =>
  typeof window !== "undefined" && Boolean(window.PublicKeyCredential);

export async function hasBiometrics() {
  return Boolean(await getMeta<string>(CRED_KEY));
}

export async function enrollBiometrics() {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Thoughts", id: window.location.hostname },
      user: { id: userId, name: "thoughts-local", displayName: "Thoughts" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Enrollment cancelled");
  await setMeta(CRED_KEY, toB64(cred.rawId));
  return true;
}

export async function unlockWithBiometrics() {
  const id = await getMeta<string>(CRED_KEY);
  if (!id) return false;
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: fromB64(id) as unknown as BufferSource }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return Boolean(assertion);
}

/* ---------------- auto-lock preference ---------------- */

export async function getLockMinutes() {
  return (await getMeta<number>(LOCK_MINUTES_KEY)) ?? 2;
}

export const setLockMinutes = (m: number) => setMeta(LOCK_MINUTES_KEY, m);
