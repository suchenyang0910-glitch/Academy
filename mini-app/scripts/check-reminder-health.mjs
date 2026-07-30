import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    baseUrl:
      process.env.ACADEMY_PUBLIC_BASE_URL ??
      process.env.ACADEMY_MINI_APP_URL ??
      "http://127.0.0.1:3000",
    secret: process.env.ACADEMY_CRON_SECRET ?? "",
    skipSystemd: process.env.ACADEMY_SKIP_SYSTEMD_CHECK === "true",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--base-url") {
      args.baseUrl = String(argv[i + 1] ?? args.baseUrl);
      i += 1;
    } else if (token === "--secret") {
      args.secret = String(argv[i + 1] ?? args.secret);
      i += 1;
    } else if (token === "--skip-systemd") {
      args.skipSystemd = true;
    }
  }

  return args;
}

function fail(message, hint) {
  console.error("reminder_health=fail");
  console.error(`reason=${message}`);
  if (hint) console.error(`repair_hint=${hint}`);
  process.exit(1);
}

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
  });
}

function assertSystemdUnit(unitName, expectedActiveState) {
  const result = run("systemctl", ["is-active", unitName]);
  const output = `${result.stdout}${result.stderr}`.trim();

  if (result.error?.code === "ENOENT") {
    fail(
      "systemctl is not available",
      "run on the VPS, or pass --skip-systemd for local HTTP-only checks",
    );
  }

  if (result.status !== 0 || output !== expectedActiveState) {
    fail(
      `${unitName} is ${output || "unknown"}, expected ${expectedActiveState}`,
      `sudo systemctl status ${unitName} --no-pager`,
    );
  }
}

function assertTimerScheduled(timerName) {
  const result = run("systemctl", ["list-timers", timerName, "--all", "--no-pager"]);
  const output = `${result.stdout}${result.stderr}`;

  if (result.status !== 0) {
    fail(
      `unable to inspect ${timerName}`,
      `systemctl list-timers ${timerName} --all --no-pager`,
    );
  }

  if (!output.includes(timerName)) {
    fail(
      `${timerName} is not listed by systemd timers`,
      `sudo systemctl enable --now ${timerName}`,
    );
  }
}

async function assertOpsDashboard(baseUrl, secret) {
  if (!secret) {
    fail(
      "ACADEMY_CRON_SECRET is missing",
      "source /etc/academy/academy.env before running this command",
    );
  }

  const url = new URL("/api/academy/admin/ops-dashboard", baseUrl);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });
  const body = await response.text();

  if (!response.ok) {
    fail(
      `ops dashboard returned HTTP ${response.status}`,
      "check ACADEMY_CRON_SECRET, academy.service, nginx, and Cloudflare routing",
    );
  }

  for (const token of [
    "Reminder Delivery Health",
    "24h Total",
    "Delivered",
    "Failed",
    "Opened / Completed",
  ]) {
    if (!body.includes(token)) {
      fail(
        `ops dashboard missing reminder marker: ${token}`,
        "deploy latest code and restart academy.service",
      );
    }
  }

  const statusMatch = body.match(/Reminder Health[\s\S]{0,500}?<strong>([^<]+)<\/strong>/);
  const status = statusMatch?.[1]?.trim() ?? "unknown";
  return { url: url.toString(), status };
}

const args = parseArgs(process.argv.slice(2));

if (!args.skipSystemd) {
  assertSystemdUnit("academy-reminders.timer", "active");
  assertTimerScheduled("academy-reminders.timer");
}

const dashboard = await assertOpsDashboard(args.baseUrl, args.secret);

console.log("reminder_health=ok");
console.log(`base_url=${args.baseUrl}`);
console.log(`ops_dashboard=${dashboard.url}`);
console.log(`dashboard_status=${dashboard.status}`);
console.log(`systemd_checked=${args.skipSystemd ? "no" : "yes"}`);
console.log("next_action=send_test_reminder_from_mini_app_and_confirm_telegram_delivery");
