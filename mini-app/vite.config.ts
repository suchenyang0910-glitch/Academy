import vinext from "vinext";
import { defineConfig } from "vite";

// The Academy production service runs as a Node process behind Nginx.
// Cloudflare remains the DNS/CDN proxy; it is no longer the application
// runtime, so database and secret access stay on the VPS.
export default defineConfig({
  plugins: [vinext()],
  // `pg` optionally probes pg-native at runtime. Keep it in Node's module
  // resolution for both dev and production SSR instead of asking Vite to
  // pre-bundle an optional peer dependency that is not installed on the VPS.
  ssr: {
    external: ["pg", "pg-native"],
  },
});
