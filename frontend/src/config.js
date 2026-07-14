// Resolves the WRS Gateway base URL.
//
// Priority:
//  1. localStorage override — set this from the app when your Cloudflare
//     tunnel URL changes, with zero rebuild needed:
//       localStorage.setItem('wrs.apiBaseUrl', 'https://xyz.trycloudflare.com')
//  2. VITE_API_BASE_URL — baked in at build time (see .env.example)
//  3. '' (empty) — relative paths, relies on Vite's dev proxy to
//     localhost:4000. Only works for local dev, never in a built/installed
//     PWA or when opened via a tunnel domain.
const LS_KEY = 'wrs.apiBaseUrl';

export function getApiBaseUrl() {
  const override = localStorage.getItem(LS_KEY);
  if (override) return override.replace(/\/+$/, '');
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  return fromEnv ? fromEnv.replace(/\/+$/, '') : '';
}

export function setApiBaseUrlOverride(url) {
  localStorage.setItem(LS_KEY, url.replace(/\/+$/, ''));
}

export function clearApiBaseUrlOverride() {
  localStorage.removeItem(LS_KEY);
}

export function apiUrl(path) {
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
