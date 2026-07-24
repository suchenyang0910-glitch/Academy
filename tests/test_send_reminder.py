import os
import unittest
from unittest.mock import patch

from bot import send_reminder


class ReminderSenderTests(unittest.TestCase):
    def test_get_reminder_calls_local_api_with_secret(self):
        with (
            patch.dict(
                os.environ,
                {
                    "ACADEMY_API_BASE_URL": "http://127.0.0.1:3000",
                    "ACADEMY_CRON_SECRET": "test-secret",
                    "ACADEMY_USER_ID": "founder",
                },
                clear=True,
            ),
            patch("bot.send_reminder.post_json") as post,
        ):
            post.return_value = {"skipped": True}
            result = send_reminder.get_reminder(2)

        self.assertTrue(result["skipped"])
        post.assert_called_once_with(
            "http://127.0.0.1:3000/api/academy/reminders/next",
            {"userId": "founder", "level": 2},
            {"authorization": "Bearer test-secret"},
        )

    def test_send_telegram_uses_web_app_button(self):
        reminder = {
            "reminder": {
                "content": "课程只要 15 分钟。",
                "buttonText": "现在补上",
            },
            "miniAppUrl": "https://academy.example",
        }
        with (
            patch.dict(
                os.environ,
                {
                    "TELEGRAM_BOT_TOKEN": "bot-token",
                    "TELEGRAM_CHAT_ID": "123",
                },
                clear=True,
            ),
            patch("bot.send_reminder.post_json") as post,
        ):
            post.return_value = {"ok": True}
            send_reminder.send_telegram(reminder)

        url, payload = post.call_args.args
        self.assertEqual(url, "https://api.telegram.org/botbot-token/sendMessage")
        self.assertEqual(payload["chat_id"], "123")
        button = payload["reply_markup"]["inline_keyboard"][0][0]
        self.assertEqual(button["text"], "现在补上")
        self.assertEqual(button["web_app"]["url"], "https://academy.example")


if __name__ == "__main__":
    unittest.main()
