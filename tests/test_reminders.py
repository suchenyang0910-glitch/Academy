import random
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bot import reminders


class ReminderTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "academy-test.db")
        self.db_patch = patch("bot.database.DB_PATH", self.db_path)
        self.reminder_db_patch = patch("bot.reminders.get_conn")
        self.db_patch.start()

        from bot.database import get_conn

        self.reminder_db_patch.start().side_effect = get_conn

    def tearDown(self):
        self.reminder_db_patch.stop()
        self.db_patch.stop()
        self.temp_dir.cleanup()

    def test_has_34_templates(self):
        self.assertEqual(len(reminders.REMINDER_TEMPLATES), 34)

    def test_excludes_recent_five_templates(self):
        user_id = "1001"
        first_five = [
            template
            for template in reminders.REMINDER_TEMPLATES
            if template.level == 1
        ][:5]
        for template in first_five:
            reminders.record_reminder(user_id, template)

        selected = reminders.select_reminder(
            1,
            user_id,
            rng=random.Random(7),
        )
        self.assertNotIn(selected.id, {template.id for template in first_five})

    def test_choose_records_event(self):
        template = reminders.choose_and_record_reminder(2, "1002")
        self.assertEqual(template.level, 2)
        self.assertEqual(reminders.recent_template_ids("1002", 1), [template.id])


if __name__ == "__main__":
    unittest.main()
