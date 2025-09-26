// Central API helpers
export const API_BASE = (() => {
  // Prefer Vite env if present: import.meta.env.VITE_API_BASE
  // Use a try/catch because some environments may not support import.meta access at runtime
  let v: string | undefined;
  try {
    const im = import.meta as unknown as { env?: { VITE_API_BASE?: string } };
    v = im.env?.VITE_API_BASE;
  } catch (e) {
    // ignore; in some runtimes import.meta may not be available
    void e;
  }

  const maybeGlobal = (globalThis as unknown as { VITE_API_BASE?: string })
    .VITE_API_BASE;
  const resolved = v || maybeGlobal;
  // If VITE_API_BASE isn't supplied, allow a small, explicit production
  // fallback: when the built frontend is running on the known production
  // frontend domain, point API calls to the hosted backend project URL.
  // This is a safety net — the preferred production setup is to set
  // VITE_API_BASE in Vercel environment variables so the value is
  // embedded at build time.
  if (!resolved) {
    try {
      if (typeof window !== "undefined" && window.location && window.location.origin) {
        const FRONTEND_PROD_ORIGIN = "https://gistreeview.vercel.app";
        const PROD_BACKEND_URL = "https://gistreeview-backend-three.vercel.app";
        if (window.location.origin === FRONTEND_PROD_ORIGIN) {
          return PROD_BACKEND_URL;
        }
      }
    } catch (e) {
      void e;
    }
  }
  if (resolved) return resolved;

  // If running in a browser, prefer the frontend origin so requests are relative
  // to the same host. This avoids accidentally targeting localhost when the
  // build didn't embed VITE_API_BASE (for example, if the env var wasn't set
  // during the production build). Only fall back to localhost as an explicit
  // development safety net.
  try {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      return window.location.origin;
    }
  } catch (e) {
    // ignore
    void e;
  }

  // Final fallback for non-browser runtime (e.g. SSR/local tooling)
  return "http://localhost:4000";
})();

// Debug: print which API base the built app will use at runtime. This is
// temporary and can be removed after deployment verification.
try {
  if (typeof window !== "undefined") {
    // Some bundlers may inline `import.meta.env` at build-time; we try to show
    // both the resolved runtime value and any build-time value.
    // eslint-disable-next-line no-console
    console.info("[DEBUG][API] API_BASE resolved at runtime:", API_BASE, "import.meta.env.VITE_API_BASE:",
      (typeof import !== 'undefined' && (import as any).meta && (import as any).meta.env ? (import as any).meta.env.VITE_API_BASE : undefined),
      "globalThis.VITE_API_BASE:", (globalThis as any).VITE_API_BASE);
  }
} catch (e) {
  // ignore debug errors
  void e;
}

export function apiUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
}

export function uploadUrl(filename: string, folder: string) {
  if (!filename) return "";
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${API_BASE}/uploads/${folder}/${filename}`;
}

export default {
  API_BASE,
  apiUrl,
  uploadUrl,
};
