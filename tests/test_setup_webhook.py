import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bot"))

import setup_webhook


class SetupWebhookTests(unittest.TestCase):
    def test_loads_mini_app_env_without_overwriting_existing_values(self):
        with patch.object(
            setup_webhook.Path,
            "exists",
            return_value=True,
        ), patch.object(
            setup_webhook.Path,
            "read_text",
            return_value="TELEGRAM_BOT_TOKEN=from-file\nNEW_VALUE=loaded\n",
        ), patch.dict(
            os.environ,
            {"TELEGRAM_BOT_TOKEN": "already-set"},
            clear=True,
        ):
            setup_webhook.load_mini_app_env()
            self.assertEqual(os.environ["TELEGRAM_BOT_TOKEN"], "already-set")
            self.assertEqual(os.environ["NEW_VALUE"], "loaded")

    def test_builds_https_webhook_url(self):
        with patch.dict(
            os.environ,
            {"ACADEMY_PUBLIC_BASE_URL": "https://academy.example.com/"},
            clear=True,
        ):
            self.assertEqual(
                setup_webhook.webhook_url(),
                "https://academy.example.com/api/telegram/webhook",
            )

    def test_rejects_local_http_url(self):
        with patch.dict(
            os.environ,
            {"ACADEMY_PUBLIC_BASE_URL": "http://localhost:3000"},
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "public HTTPS"):
                setup_webhook.webhook_url()

    def test_set_webhook_uses_secret_and_payment_updates(self):
        with patch.dict(
            os.environ,
            {
                "TELEGRAM_BOT_TOKEN": "test-token",
                "TELEGRAM_WEBHOOK_SECRET": "test-secret",
                "ACADEMY_PUBLIC_BASE_URL": "https://academy.example.com",
            },
            clear=True,
        ), patch.object(
            setup_webhook,
            "post_json",
            return_value={"ok": True, "result": True},
        ) as post:
            setup_webhook.set_webhook()
            url, payload = post.call_args.args
            self.assertIn("setWebhook", url)
            self.assertNotIn("test-token", str(payload))
            self.assertEqual(payload["secret_token"], "test-secret")
            self.assertEqual(
                payload["allowed_updates"],
                ["message", "pre_checkout_query"],
            )


if __name__ == "__main__":
    unittest.main()
