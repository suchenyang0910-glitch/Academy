#!/usr/bin/env sh
# Academy reminder dispatcher for the production VPS.
# This script deliberately talks to the local app listener so the cron secret
# never travels through Cloudflare or appears in a shell command line.

set -eu
umask 077

ENV_FILE="${ACADEMY_ENV_FILE:-/etc/academy/academy.env}"
API_BASE_URL="${ACADEMY_API_BASE_URL:-http://127.0.0.1:3000}"

if [ ! -r "$ENV_FILE" ]; then
  echo "Academy reminder dispatch failed: cannot read $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${ACADEMY_CRON_SECRET:-}" ]; then
  echo "Academy reminder dispatch failed: ACADEMY_CRON_SECRET is empty" >&2
  exit 1
fi

RESULT_FILE="$(mktemp /tmp/academy-reminders.XXXXXX)"
cleanup() { rm -f "$RESULT_FILE"; }
trap cleanup EXIT HUP INT TERM

curl \
  --fail-with-body \
  --silent \
  --show-error \
  --retry 2 \
  --retry-delay 3 \
  --connect-timeout 5 \
  --max-time 45 \
  -X POST "${API_BASE_URL%/}/api/academy/reminders/next" \
  -H "Authorization: Bearer ${ACADEMY_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  --data '{"level":1,"limit":200}' \
  --output "$RESULT_FILE"

# Keep journal output operationally useful without leaking Telegram IDs or
# reminder text. Individual delivery records stay in PostgreSQL.
node --input-type=module -e '
  import { readFileSync } from "node:fs";
  const result = JSON.parse(readFileSync(process.argv[1], "utf8"));
  console.log(JSON.stringify({
    requestedLevel: result.requestedLevel,
    scanned: result.scanned,
    delivered: result.delivered,
    skipped: result.skipped,
    failed: result.failed ?? 0,
  }));
' "$RESULT_FILE"
