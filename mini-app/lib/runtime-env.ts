/**
 * Server-only runtime configuration.
 *
 * The production deployment runs on a VPS, so secrets are supplied through
 * systemd's EnvironmentFile rather than a Cloudflare Worker binding.
 */
export function getRuntimeEnv<T extends Record<string, string | undefined>>() {
  return process.env as T;
}
