"""从 Academy 本地 API 获取提醒，并通过 Telegram Bot 发送。

示例：
    python bot/send_reminder.py --level 1

需要环境变量：
    ACADEMY_API_BASE_URL
    ACADEMY_CRON_SECRET
    ACADEMY_USER_ID
    TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID
    ACADEMY_MINI_APP_URL
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
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


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def post_json(url: str, payload: dict, headers: dict | None = None) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"content-type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code}: {detail}") from error


def get_reminder(level: int) -> dict:
    base_url = required_env("ACADEMY_API_BASE_URL").rstrip("/")
    secret = required_env("ACADEMY_CRON_SECRET")
    user_id = os.getenv("ACADEMY_USER_ID", "founder").strip() or "founder"
    return post_json(
        f"{base_url}/api/academy/reminders/next",
        {"userId": user_id, "level": level},
        {"authorization": f"Bearer {secret}"},
    )


def send_telegram(reminder: dict) -> dict:
    bot_token = required_env("TELEGRAM_BOT_TOKEN")
    chat_id = required_env("TELEGRAM_CHAT_ID")
    mini_app_url = (
        reminder.get("miniAppUrl")
        or os.getenv("ACADEMY_MINI_APP_URL", "").strip()
    )

    payload: dict = {
        "chat_id": chat_id,
        "text": reminder["reminder"]["content"],
    }
    if mini_app_url:
        payload["reply_markup"] = {
            "inline_keyboard": [
                [
                    {
                        "text": reminder["reminder"]["buttonText"],
                        "web_app": {"url": mini_app_url},
                    }
                ]
            ]
        }

    return post_json(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        payload,
    )


def main() -> int:
    load_local_env()
    parser = argparse.ArgumentParser(description="Send an Academy reminder")
    parser.add_argument("--level", type=int, choices=(1, 2, 3, 4), required=True)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只获取和打印提醒，不调用 Telegram",
    )
    args = parser.parse_args()

    result = get_reminder(args.level)
    if result.get("skipped"):
        print(f"SKIPPED: {result.get('reason', 'unknown')}")
        return 0

    if args.dry_run:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    sent = send_telegram(result)
    if not sent.get("ok"):
        raise RuntimeError(f"Telegram rejected message: {sent}")
    print(
        f"SENT {result['reminder']['id']} "
        f"level={result['state']['level']} "
        f"message_id={sent['result']['message_id']}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
