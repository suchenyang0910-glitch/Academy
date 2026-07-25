from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"content-type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code}: {detail}") from error


def academy_headers() -> dict[str, str]:
    secret = required_env("ACADEMY_CRON_SECRET")
    return {"authorization": f"Bearer {secret}"}


def academy_base_url() -> str:
    return required_env("ACADEMY_API_BASE_URL").rstrip("/")


def resolve_user_payload(telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    if user_id:
        return {"userId": user_id}
    if telegram_user_id:
        return {"telegramUserId": str(telegram_user_id)}
    env_user = os.getenv("ACADEMY_USER_ID", "").strip()
    env_tg = os.getenv("ACADEMY_TELEGRAM_USER_ID", "").strip()
    if env_user:
        return {"userId": env_user}
    if env_tg:
        return {"telegramUserId": env_tg}
    return {"userId": "founder"}


def fetch_summary(telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    payload = resolve_user_payload(telegram_user_id=telegram_user_id, user_id=user_id)
    return post_json(
        f"{academy_base_url()}/api/academy/admin/bot/summary",
        payload,
        academy_headers(),
    )


def fetch_day(day: int, telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    payload = resolve_user_payload(telegram_user_id=telegram_user_id, user_id=user_id)
    payload["day"] = day
    return post_json(
        f"{academy_base_url()}/api/academy/admin/bot/day",
        payload,
        academy_headers(),
    )


def fetch_notes(limit: int = 20, telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    payload = resolve_user_payload(telegram_user_id=telegram_user_id, user_id=user_id)
    payload["action"] = "list"
    payload["limit"] = limit
    return post_json(
        f"{academy_base_url()}/api/academy/admin/bot/notes",
        payload,
        academy_headers(),
    )


def create_note(content: str, lesson_id: str | None = None, telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    payload = resolve_user_payload(telegram_user_id=telegram_user_id, user_id=user_id)
    payload["action"] = "create"
    payload["content"] = content
    payload["lessonId"] = lesson_id
    return post_json(
        f"{academy_base_url()}/api/academy/admin/bot/notes",
        payload,
        academy_headers(),
    )


def fetch_reminder(level: int = 1, telegram_user_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    payload = resolve_user_payload(telegram_user_id=telegram_user_id, user_id=user_id)
    payload["level"] = level
    return post_json(
        f"{academy_base_url()}/api/academy/admin/bot/reminder",
        payload,
        academy_headers(),
    )
