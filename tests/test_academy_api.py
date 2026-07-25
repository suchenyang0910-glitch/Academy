import os
import unittest
from unittest.mock import patch

from bot import academy_api


class AcademyApiTests(unittest.TestCase):
    def test_fetch_summary_posts_to_admin_endpoint(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "https://academy.example",
                    "ACADEMY_CRON_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch("bot.academy_api.post_json") as post,
        ):
            post.return_value = {"ok": True}
            result = academy_api.fetch_summary(user_id="u1")

        self.assertEqual(result, {"ok": True})
        post.assert_called_once_with(
            "https://academy.example/api/academy/admin/bot/summary",
            {"userId": "u1"},
            {"authorization": "Bearer test-secret"},
        )

    def test_fetch_day_posts_day_value(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "https://academy.example",
                    "ACADEMY_CRON_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch("bot.academy_api.post_json") as post,
        ):
            post.return_value = {"items": []}
            academy_api.fetch_day(5, telegram_user_id="100")

        post.assert_called_once_with(
            "https://academy.example/api/academy/admin/bot/day",
            {"telegramUserId": "100", "day": 5},
            {"authorization": "Bearer test-secret"},
        )

    def test_fetch_notes_lists_with_limit(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "https://academy.example",
                    "ACADEMY_CRON_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch("bot.academy_api.post_json") as post,
        ):
            post.return_value = {"items": []}
            academy_api.fetch_notes(limit=10, user_id="u1")

        post.assert_called_once_with(
            "https://academy.example/api/academy/admin/bot/notes",
            {"userId": "u1", "action": "list", "limit": 10},
            {"authorization": "Bearer test-secret"},
        )

    def test_create_note_posts_create_action(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "https://academy.example",
                    "ACADEMY_CRON_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch("bot.academy_api.post_json") as post,
        ):
            post.return_value = {"note": {"id": 1}}
            academy_api.create_note("hello", lesson_id="l1", user_id="u1")

        post.assert_called_once_with(
            "https://academy.example/api/academy/admin/bot/notes",
            {"userId": "u1", "action": "create", "content": "hello", "lessonId": "l1"},
            {"authorization": "Bearer test-secret"},
        )

    def test_fetch_reminder_posts_level(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "https://academy.example",
                    "ACADEMY_CRON_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch("bot.academy_api.post_json") as post,
        ):
            post.return_value = {"skipped": True}
            academy_api.fetch_reminder(level=3, telegram_user_id="100")

        post.assert_called_once_with(
            "https://academy.example/api/academy/admin/bot/reminder",
            {"telegramUserId": "100", "level": 3},
            {"authorization": "Bearer test-secret"},
        )


if __name__ == "__main__":
    unittest.main()

