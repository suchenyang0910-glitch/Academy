import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from bot.commands import handle_academy_command


class CommandTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "academy-test.db")
        self.db_patch = patch("bot.database.DB_PATH", self.db_path)
        self.db_patch.start()
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.executescript(
                """
                CREATE TABLE notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    day INTEGER NOT NULL,
                    note TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE day_counter (current_day INTEGER NOT NULL);
                INSERT INTO day_counter (current_day) VALUES (4);
                """
            )
            conn.commit()

    def tearDown(self):
        self.db_patch.stop()
        self.temp_dir.cleanup()

    def test_note_command_persists_without_extra_cli_argument(self):
        response, needs_write = handle_academy_command(
            "/academy note 记录一个真实学习证据"
        )
        self.assertFalse(needs_write)
        self.assertIn("Day 4", response)
        with closing(sqlite3.connect(self.db_path)) as conn:
            row = conn.execute("SELECT day, note FROM notes").fetchone()
        self.assertEqual(row, (4, "记录一个真实学习证据"))


if __name__ == "__main__":
    unittest.main()
