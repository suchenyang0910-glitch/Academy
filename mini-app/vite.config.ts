import vinext from "vinext";
import { defineConfig } from "vite";

// The Academy production service runs as a Node process behind Nginx.
// Cloudflare remains the DNS/CDN proxy; it is no longer the application
// runtime, so database and secret access stay on the VPS.
export default defineConfig({
  plugins: [vinext()],
});
