# Academy Telegram 自动提醒（VPS）

这套定时器是 Telegram 提醒真正发出的最后一环。它每小时扫描一次已开启提醒的用户，由应用按用户时区、提醒时间、免打扰时间、当天完成情况和连续中断天数决定是否投递。

它不是固定时间向所有人群发：例如用户设为曼谷 20:00，只有到达该用户当地应提醒的时间、且当天还有未完成课程时才会发送。

## 一次性安装

以下命令在 VPS 上以 `academy` 用户执行；安装 systemd 文件时会临时使用 `sudo`。

```bash
cd /srv/academy/app
chmod 750 scripts/run-reminder-dispatch.sh
sudo install -o root -g root -m 644 ops/academy-reminders.service /etc/systemd/system/academy-reminders.service
sudo install -o root -g root -m 644 ops/academy-reminders.timer /etc/systemd/system/academy-reminders.timer
sudo systemctl daemon-reload
sudo systemctl enable --now academy-reminders.timer
```

前提：`/etc/academy/academy.env` 已包含非空的 `ACADEMY_CRON_SECRET`，并且主应用已经监听在 `127.0.0.1:3000`。

## 立即验证

先手工跑一次。它会走真实投递逻辑，但只会给“当前应收到提醒”的用户发消息；已经完成、暂停、处于免打扰时段或今天已经收到同等级提醒的用户会被跳过。

```bash
sudo systemctl start academy-reminders.service
sudo journalctl -u academy-reminders.service -n 30 --no-pager
systemctl list-timers academy-reminders.timer --all
```

日志中只会显示 `scanned`、`delivered`、`skipped` 和 `failed` 汇总，不会泄露 Telegram ID 或提醒正文。逐条投递状态保存在 PostgreSQL 的 `reminder_events` 表中。

## 故障排查

```bash
sudo systemctl status academy-reminders.timer academy-reminders.service --no-pager
sudo journalctl -u academy-reminders.service --since "24 hours ago" --no-pager
curl -I http://127.0.0.1:3000
```

若服务日志报 `Cron authorization required`，确认 `/etc/academy/academy.env` 的 `ACADEMY_CRON_SECRET` 与运行中的 Academy 服务使用的是同一个值；修改环境文件后执行：

```bash
sudo systemctl restart academy
sudo systemctl start academy-reminders.service
```

若出现 Telegram 投递失败，应用会将对应 `reminder_events.delivery_status` 标为 `failed`，但不会因此中断其他用户的提醒扫描。
