import type { CapacitorConfig } from '@capacitor/cli';

// webDir: 'dist' (not a server.url override) — the built app bundles its
// own UI and runs fully offline; it talks to the WRS Clinic Gateway only
// through fetch() calls resolved by src/config.js (VITE_API_BASE_URL /
// localStorage override), same as the browser PWA. This keeps the
// offline-first behavior identical between "installed app" and "PWA in
// Chrome" — neither depends on Capacitor's server.url pointing anywhere.
const config: CapacitorConfig = {
  appId: 'org.juakali.wrsclinic',
  appName: 'WRS Clinic',
  webDir: 'dist',
  android: {
    // The Gateway is plain HTTP on the local network / localhost (Termux
    // has no TLS cert to offer) — Android blocks cleartext traffic by
    // default from API 28+. This allows it. If you later put the Gateway
    // behind a Cloudflare tunnel (HTTPS), you can remove this.
    allowMixedContent: true
  }
};

export default config;
