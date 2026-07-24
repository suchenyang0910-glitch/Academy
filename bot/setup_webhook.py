"""Configure the Academy Telegram webhook without exposing the Bot Token.

Examples:
    python bot/setup_webhook.py
    python bot/setup_webhook.py --info
    python bot/setup_webhook.py --delete
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from send_reminder import load_local_env, post_json, required_env


def load_mini_app_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / "mini-app" / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"').strip("'")
        if name:
            os.environ.setdefault(name, value)


def webhook_url() -> str:
    base_url = (
        os.getenv("ACADEMY_PUBLIC_BASE_URL", "").strip()
        or os.getenv("ACADEMY_MINI_APP_URL", "").strip()
    ).rstrip("/")
    if not base_url:
        raise RuntimeError(
            "Missing ACADEMY_PUBLIC_BASE_URL or ACADEMY_MINI_APP_URL"
        )
    parsed = urlparse(base_url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise RuntimeError("Telegram webhook URL must use a public HTTPS address")
    return f"{base_url}/api/telegram/webhook"


def telegram_method(method: str, payload: dict | None = None) -> dict:
    token = required_env("TELEGRAM_BOT_TOKEN")
    return post_json(
        f"https://api.telegram.org/bot{token}/{method}",
        payload or {},
    )


def set_webhook() -> dict:
    return telegram_method(
        "setWebhook",
        {
            "url": webhook_url(),
            "secret_token": required_env("TELEGRAM_WEBHOOK_SECRET"),
            "allowed_updates": ["message", "pre_checkout_query"],
            "drop_pending_updates": False,
        },
    )


def main() -> int:
    load_local_env()
    load_mini_app_env()
    parser = argparse.ArgumentParser(description="Manage the Academy Telegram webhook")
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--info", action="store_true", help="Show webhook status")
    action.add_argument("--delete", action="store_true", help="Delete the webhook")
    args = parser.parse_args()

    if args.info:
        result = telegram_method("getWebhookInfo")
    elif args.delete:
        result = telegram_method("deleteWebhook", {"drop_pending_updates": False})
    else:
        result = set_webhook()

    if not result.get("ok"):
        raise RuntimeError(f"Telegram rejected the webhook request: {result}")

    if args.info:
        info = result.get("result", {})
        print(
            "Webhook:",
            info.get("url") or "(not set)",
            "| pending:",
            info.get("pending_update_count", 0),
            "| last error:",
            info.get("last_error_message") or "none",
        )
    elif args.delete:
        print("Telegram webhook deleted.")
    else:
        print(f"Telegram webhook configured: {webhook_url()}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
