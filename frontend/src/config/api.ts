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
