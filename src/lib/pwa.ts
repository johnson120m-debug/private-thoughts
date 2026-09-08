const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

function blocked() {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterApp() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function setupServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (blocked()) {
    await unregisterApp();
    return;
  }
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    /* offline support unavailable */
  }
}
