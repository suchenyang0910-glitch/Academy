import unittest
from unittest.mock import patch

from bot.commands import handle_academy_command


class CommandTests(unittest.TestCase):
    def test_note_command_calls_mini_app_api(self):
        with patch("bot.commands.academy_api.create_note") as create_note:
            response, needs_write = handle_academy_command(
                "/academy note 记录一个真实学习证据"
            )
        self.assertFalse(needs_write)
        create_note.assert_called_once_with("记录一个真实学习证据")
        self.assertIn("已记录学习笔记", response)

    def test_next_command_uses_api(self):
        with patch("bot.commands.academy_api.fetch_summary") as fetch_summary, patch(
            "bot.commands.academy_api.fetch_day"
        ) as fetch_day:
            fetch_summary.return_value = {
                "today": [{"courseTitle": "English", "currentDay": 4}],
                "supervision": {"todayKey": "2026-07-25"},
            }
            fetch_day.return_value = {
                "items": [
                    {
                        "courseTitle": "English",
                        "lessonTitle": "Lesson 5",
                        "preview": "preview",
                    }
                ]
            }
            response, needs_write = handle_academy_command("/academy next")
        self.assertFalse(needs_write)
        self.assertIn("Day 5", response)


if __name__ == "__main__":
    unittest.main()
