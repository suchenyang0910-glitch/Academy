"""
Academy Bot — /academy 命令处理器

部署方式：
1. PM2: pm2 start bot/main.py --interpreter python3 --name academy-bot
2. 或作为现有 Bot (xiaoguanjia) 的 exec 工具调用

作为独立 Bot: 设置环境变量 BOT_TOKEN
作为 exec 工具: python bot/main.py --cmd "today"
"""

import argparse
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from bot.commands import handle_academy_command

def main():
    parser = argparse.ArgumentParser(description='Academy Bot 命令处理')
    parser.add_argument('--cmd', help='命令 (如 today, history, next)')
    parser.add_argument('--day', type=int, help='Day 参数')
    parser.add_argument('--note', help='笔记内容')
    parser.add_argument('--text', help='原始命令文本 (如 "/academy day 3")')
    parser.add_argument('--level', type=int, help='提醒等级 1-4')
    parser.add_argument('--user-id', help='Telegram 用户 ID')

    args = parser.parse_args()

    if args.text:
        response, _ = handle_academy_command(args.text)
        print(response)

    elif args.cmd == 'today':
        from bot.commands import cmd_today
        print(cmd_today())

    elif args.cmd == 'history':
        from bot.commands import cmd_history
        print(cmd_history())

    elif args.cmd == 'next':
        from bot.commands import cmd_next
        print(cmd_next())

    elif args.cmd == 'day' and args.day:
        from bot.commands import cmd_day
        print(cmd_day(args.day))

    elif args.cmd == 'notes':
        from bot.commands import cmd_notes
        print(cmd_notes(args.day))

    elif args.cmd == 'reminder':
        from bot.reminders import choose_and_record_reminder

        if not args.level or not args.user_id:
            parser.error("--cmd reminder 需要 --level 1-4 和 --user-id")
        reminder = choose_and_record_reminder(args.level, args.user_id)
        print(reminder.content)
        print(f"\n[按钮] {reminder.button_text}")
        print(f"[文案ID] {reminder.id}")

    else:
        print("📚 Academy 可用命令:\n"
              "  --cmd today     今日课程\n"
              "  --cmd history   学习进度\n"
              "  --cmd next      明日预告\n"
              "  --cmd day --day N  查看某天\n"
              "  --cmd notes --day N 查看笔记\n"
              "  --cmd reminder --level N --user-id ID 随机提醒\n"
              "  --text \"命令\"  原始命令解析")

if __name__ == '__main__':
    main()
