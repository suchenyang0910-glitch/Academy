"""
Academy Bot 命令处理模块
输出格式化的 TG 消息文本
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from bot.database import (
    get_day_lessons, get_lesson, get_notes, get_notes_by_day,
    get_overall_progress, get_current_day, get_latest_lessons, save_note
)

SUBJECT_NAMES = {
    'english': '🇬🇧 English',
    'ai': '🤖 AI',
    'management': '🏢 Management',
    'founder_note': '✍️ FounderNote',
    'quiz': '📝 Quiz'
}

def cmd_today():
    """今日课程汇总"""
    day = get_current_day()
    lessons = get_day_lessons(day)

    if not lessons:
        return (
            f"📚 **Academy — Day {day}**\n\n"
            f"📭 今日课程尚未推送。\n"
            f"课程会在每天 10:00~21:00 陆续推送。"
        )

    lines = [f"📚 **Academy — Day {day} / 14**\n"]
    for subject, title, _ in lessons:
        name = SUBJECT_NAMES.get(subject, subject)
        lines.append(f"✅ **{name}** — {title}")

    lines.append(f"\n💡 查看某课详情: `/academy day {day}`")
    lines.append(f"📝 记笔记: `/academy note 今天学了...`")

    return '\n'.join(lines)

def cmd_day(day):
    """查看某天的完整课程"""
    lessons = get_day_lessons(day)
    if not lessons:
        return f"📭 Day {day} 还没有课程记录。\n最早从 Day 1 开始。"

    lines = [f"📖 **Day {day} — 全部课程**\n"]

    for subject, title, preview in lessons:
        name = SUBJECT_NAMES.get(subject, subject)
        lines.append(f"━━━ {name} ━━━")
        lines.append(f"**{title}**")

        # 获取完整内容
        full = get_lesson(day, subject)
        if full:
            content = full[3]
            # 只显示前 300 字
            if len(content) > 300:
                lines.append(content[:300] + "...")
            else:
                lines.append(content)
        lines.append("")

    return '\n'.join(lines)

def cmd_history():
    """学习进度"""
    stats = get_overall_progress()
    day = get_current_day()
    latest_days = get_latest_lessons(7)

    days_completed = stats[0] if stats else 0
    lessons_completed = stats[1] if stats else 0
    avg_score = stats[2] if stats and stats[2] else '—'

    progress_pct = min(100, round(days_completed / 14 * 100))
    bar = '█' * (progress_pct // 10) + '░' * (10 - progress_pct // 10)

    lines = [
        "📊 **Academy 学习进度**\n",
        f"当前进度: Day {day} / 14",
        f"完成天数: {days_completed} / 14",
        f"已完成课次: {lessons_completed}",
        f"Quiz 均分: {avg_score}",
        f"",
        f"总体进度: [{bar}] {progress_pct}%",
        f"",
        f"📌 最近课程:"
    ]

    for d in latest_days:
        lessons = get_day_lessons(d)
        count = len(lessons)
        subjects = ' · '.join([SUBJECT_NAMES.get(s, s) for s, _, _ in lessons])
        lines.append(f"  Day {d}: {count}/5 课 — {subjects}")

    lines.append(f"\n💡 查看某天: `/academy day <N>`")

    return '\n'.join(lines)

def cmd_notes(day=None):
    """查看笔记"""
    if day:
        rows = get_notes_by_day(day)
        title = f"📝 **Day {day} 的笔记**\n"
    else:
        rows = get_notes(limit=20)
        title = "📝 **学习笔记（最近 20 条）**\n"

    if not rows:
        return title + "\n📭 还没有笔记。试试 `/academy note 今天学了xxx`"

    lines = [title]
    for row in rows:
        if day:
            nid, note, created = row
            lines.append(f"  {note}")
            lines.append(f"  _· {created}_\n")
        else:
            nid, d, note, created = row
            lines.append(f"**Day {d}**")
            lines.append(f"  {note}")
            lines.append(f"  _· {created}_\n")

    return '\n'.join(lines)

def cmd_next():
    """明日预告"""
    day = get_current_day()
    tomorrow = day + 1

    from datetime import datetime, timezone, timedelta
    tz = timezone(timedelta(hours=7))

    subjects_day_next = [
        ("🇬🇧 English", "10:00", "等待上课"),
        ("🤖 AI", "14:00", "等待上课"),
        ("🏢 Management", "16:00", "等待上课"),
        ("✍️ FounderNote", "20:00", "等待上课"),
        ("📝 Quiz", "21:00", "等待上课"),
    ]

    lines = [
        f"🔮 **Academy — 明日课程预告**\n",
        f"明天是 **Day {tomorrow} / 14**\n",
        f"📅 {datetime.now(tz).strftime('%A, %Y-%m-%d')}\n",
        "| 科目 | 时间 | 状态 |",
        "|------|------|------|"
    ]

    for name, time, status in subjects_day_next:
        lines.append(f"| {name} | {time} | ⏳ {status} |")

    lines.append(f"\n💡 明天见！")

    return '\n'.join(lines)

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
            day = get_current_day()
            save_note(day, note_text)
            return f"📝 已记录 Day {day} 的笔记 ✅", False
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
