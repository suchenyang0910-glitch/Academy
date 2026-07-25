"""
LEGACY: Academy 早期 Bot 命令处理模块。

这套命令仍依赖 bot.database 中的 14 天 SQLite 原型数据，不代表当前 mini-app
主线产品状态。当前 Academy 的主学习闭环已经迁移到 mini-app API 与服务层。

维护规则：
1. 这里只允许做兼容性维护和迁移注释；
2. 不再新增业务能力、课程规则或进度口径；
3. 后续目标是让 Bot 只做 Telegram 入口，并调用 mini-app API，而不是继续维护
   一套并行的学习事实源。
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from bot import academy_api

SUBJECT_NAMES = {
    'english': '🇬🇧 English',
    'ai': '🤖 AI',
    'management': '🏢 Management',
    'founder_note': '✍️ FounderNote',
    'quiz': '📝 Quiz'
}

def cmd_today():
    """今日课程汇总"""
    summary = academy_api.fetch_summary()
    today = summary.get("today") or []
    supervision = summary.get("supervision") or {}
    today_key = supervision.get("todayKey") or "today"

    if not today:
        return (
            f"📚 **Academy — {today_key}**\n\n"
            f"📭 今日没有激活课程。\n"
            f"请先在 Mini App 完成选课。"
        )

    lines = [f"📚 **Academy — {today_key}**\n"]
    for item in today:
        course = item.get("courseTitle") or "Course"
        lesson_title = item.get("lessonTitle") or "Lesson"
        status = item.get("submissionStatus")
        icon = "✅" if status == "completed" else "🟡" if status else "⬜"
        current_day = item.get("currentDay") or "?"
        lines.append(f"{icon} **{course}** — Day {current_day}: {lesson_title}")

    lines.append(f"\n📝 记笔记: `/academy note 今天学了...`")
    lines.append(f"💡 查看某天课程: `/academy day <1-60>`")
    return "\n".join(lines)

def cmd_day(day):
    """查看某天的完整课程"""
    result = academy_api.fetch_day(day)
    items = result.get("items") or []
    if not items:
        return f"📭 Day {day} 没有课程。"

    lines = [f"📖 **Day {day} — 全部课程**\n"]
    for item in items:
        course = item.get("courseTitle") or "Course"
        title = item.get("lessonTitle") or "Lesson"
        preview = item.get("preview") or ""
        status = item.get("submissionStatus")
        icon = "✅" if status == "completed" else "🟡" if status else "⬜"
        lines.append(f"━━━ {icon} {course} ━━━")
        lines.append(f"**{title}**")
        if preview:
            lines.append(str(preview))
        lines.append("")
    return "\n".join(lines)

def cmd_history():
    """学习进度"""
    summary = academy_api.fetch_summary()
    today = summary.get("today") or []
    supervision = summary.get("supervision") or {}
    state = supervision.get("state") or "unknown"
    lag_days = supervision.get("lagDays") or 0

    lines = [
        "📊 **Academy 学习进度**\n",
        f"今日状态: {state}",
        f"落后天数: {lag_days}",
        "",
        "📌 当前进行中课程:",
    ]
    for item in today:
        course = item.get("courseTitle") or "Course"
        current_day = item.get("currentDay") or "?"
        status = item.get("submissionStatus")
        icon = "✅" if status == "completed" else "🟡" if status else "⬜"
        lines.append(f"  {icon} {course}: Day {current_day}/60")

    return "\n".join(lines)

def cmd_notes(day=None):
    """查看笔记"""
    if day:
        title = f"📝 **Day {day} 的笔记**\n"
    else:
        title = "📝 **学习笔记（最近 20 条）**\n"

    result = academy_api.fetch_notes(limit=20)
    rows = result.get("items") or []
    if not rows:
        return title + "\n📭 还没有笔记。试试 `/academy note 今天学了xxx`"

    lines = [title]
    for row in rows:
        note = row.get("content") or ""
        created = row.get("createdAt") or ""
        course = row.get("courseTitle") or ""
        day_value = row.get("day")
        tag = f"{course} Day {day_value}" if course and day_value else "Note"
        lines.append(f"**{tag}**")
        lines.append(f"  {note}")
        lines.append(f"  _· {created}_\n")

    return "\n".join(lines)

def cmd_next():
    """明日预告"""
    summary = academy_api.fetch_summary()
    today = summary.get("today") or []
    supervision = summary.get("supervision") or {}
    today_key = supervision.get("todayKey") or "today"

    current_days = []
    for item in today:
        value = item.get("currentDay")
        try:
            current_days.append(int(value))
        except (TypeError, ValueError):
            continue

    if not current_days:
        return (
            f"🔮 **Academy — 下一步预告**\n\n"
            f"📭 当前没有激活课程。\n"
            f"请先在 Mini App 完成选课。"
        )

    max_day = max(current_days)
    if max_day >= 60:
        return (
            f"🎉 **Academy — 已完成**\n\n"
            f"你已经完成 Day 60。"
        )

    next_day = max_day + 1
    result = academy_api.fetch_day(next_day)
    items = result.get("items") or []
    if not items:
        return f"📭 Day {next_day} 没有课程。"

    lines = [
        "🔮 **Academy — 下一步预告**\n",
        f"📅 {today_key} → Day {next_day}/60\n",
    ]
    for item in items:
        course = item.get("courseTitle") or "Course"
        title = item.get("lessonTitle") or "Lesson"
        preview = item.get("preview") or ""
        lines.append(f"━━━ {course} ━━━")
        lines.append(f"**Day {next_day}: {title}**")
        if preview:
            lines.append(str(preview))
        lines.append("")

    lines.append(f"💡 查看 Day {next_day}: `/academy day {next_day}`")
    return "\n".join(lines)

def handle_academy_command(text):
    """
    解析 /academy 命令并返回响应文本
    返回值：(text, need_db_write)
    need_db_write=True 表示需要在 Bot 端执行写操作
    """
    text = text.strip()

    # /academy
    if text == '/academy' or text == '/academy ':
        return cmd_today(), False

    # /academy day <N>
    if text.startswith('/academy day '):
        try:
            day = int(text.split()[-1])
            return cmd_day(day), False
        except (ValueError, IndexError):
            return "❌ 格式: `/academy day <数字>` (如 `/academy day 3`)", False

    # /academy history
    if text == '/academy history':
        return cmd_history(), False

    # /academy next
    if text == '/academy next':
        return cmd_next(), False

    # /academy notes [day]
    if text == '/academy notes':
        return cmd_notes(), False
    if text.startswith('/academy notes '):
        try:
            day = int(text.split()[-1])
            return cmd_notes(day), False
        except (ValueError, IndexError):
            return "❌ 格式: `/academy notes <数字>`", False

    # /academy note "xxx"
    if text.startswith('/academy note '):
        note_text = text[len('/academy note '):].strip().strip('"').strip("'")
        if note_text:
            academy_api.create_note(note_text)
            return f"📝 已记录学习笔记 ✅", False
        else:
            return "❌ 笔记内容不能为空。格式: `/academy note 今天学了xxx`", False

    # 未知子命令
    return (
        "❓ 未知命令。可用命令：\n"
        "`/academy` — 今日课程\n"
        "`/academy day <N>` — 查看某天\n"
        "`/academy history` — 进度\n"
        "`/academy note <内容>` — 记笔记\n"
        "`/academy notes` — 看笔记\n"
        "`/academy next` — 明日预告"
    ), False
