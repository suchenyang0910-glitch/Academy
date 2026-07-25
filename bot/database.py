"""
LEGACY: Academy 早期 SQLite 数据库操作模块。

这套实现服务于仓库早期的 14 天单机 Bot 原型，和当前 mini-app 主线
（60 天课程、多用户、Telegram 鉴权、PostgreSQL/D1 兼容层）已经不是同一
套事实来源。

边界约束：
1. 不要在这里继续增加产品逻辑或数据模型；
2. 不要把这里当作 Academy 当前学习记录的权威来源；
3. 后续应改为只调用 mini-app API，或直接归档整个 legacy bot 路径。
"""

import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'academy.db')

def get_conn():
    raise RuntimeError(
        "Legacy SQLite database is disabled. Use mini-app APIs as the single source of truth."
    )

# ─── 课程操作 ───

def save_lesson(day, subject, title, content):
    """保存课程内容（幂等：同一天同一科目只保留最新）"""
    conn = get_conn()
    conn.execute("""
        INSERT OR REPLACE INTO lessons (day, subject, title, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now', '+7 hours'))
    """, (day, subject, title, content))
    conn.commit()
    conn.close()

def get_lesson(day, subject):
    """获取指定天指定科目的课程"""
    conn = get_conn()
    cur = conn.execute(
        "SELECT day, subject, title, content FROM lessons WHERE day=? AND subject=?",
        (day, subject)
    )
    row = cur.fetchone()
    conn.close()
    return row

def get_day_lessons(day):
    """获取指定天的全部课程"""
    conn = get_conn()
    cur = conn.execute(
        "SELECT subject, title, substr(content, 1, 100) as preview FROM lessons WHERE day=? ORDER BY subject",
        (day,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows

def get_latest_lessons(limit=5):
    """获取最近的课程（按天倒序）"""
    conn = get_conn()
    cur = conn.execute("""
        SELECT DISTINCT day FROM lessons
        ORDER BY day DESC LIMIT ?
    """, (limit,))
    days = [r[0] for r in cur.fetchall()]
    conn.close()
    return days

# ─── 笔记操作 ───

def save_note(day, note_text):
    """保存笔记"""
    conn = get_conn()
    conn.execute(
        "INSERT INTO notes (day, note) VALUES (?, ?)",
        (day, note_text)
    )
    conn.commit()
    conn.close()

def get_notes(limit=50):
    """获取笔记列表（最新在前）"""
    conn = get_conn()
    cur = conn.execute(
        "SELECT id, day, note, created_at FROM notes ORDER BY created_at DESC LIMIT ?",
        (limit,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows

def get_notes_by_day(day):
    """获取指定天的笔记"""
    conn = get_conn()
    cur = conn.execute(
        "SELECT id, note, created_at FROM notes WHERE day=? ORDER BY created_at",
        (day,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows

# ─── 进度操作 ───

def upsert_progress(day, subject, completed=1, quiz_score=None):
    """更新学习进度"""
    conn = get_conn()
    conn.execute("""
        INSERT OR REPLACE INTO progress (day, subject, completed, quiz_score, updated_at)
        VALUES (?, ?, ?, ?, datetime('now', '+7 hours'))
    """, (day, subject, completed, quiz_score))
    conn.commit()
    conn.close()

def get_progress(day):
    """获取指定天的进度"""
    conn = get_conn()
    cur = conn.execute(
        "SELECT subject, completed, quiz_score FROM progress WHERE day=?",
        (day,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows

def get_overall_progress():
    """获取总体进度统计"""
    conn = get_conn()
    cur = conn.execute("""
        SELECT
            COUNT(DISTINCT day) as days_completed,
            COUNT(*) as lessons_completed,
            AVG(quiz_score) as avg_score
        FROM progress WHERE completed=1
    """)
    stats = cur.fetchone()
    conn.close()
    return stats

def get_current_day():
    """获取当前 day 数"""
    conn = get_conn()
    cur = conn.execute("SELECT current_day FROM day_counter LIMIT 1")
    row = cur.fetchone()
    conn.close()
    return row[0] if row else 1

# ─── 工具 ───

def format_lesson_preview(day):
    """格式化指定天的课程预览"""
    lessons = get_day_lessons(day)
    if not lessons:
        return f"📭 Day {day} 还没有课程记录。"

    lines = [f"📚 **Day {day} — 课程汇总**\n"]
    subject_names = {
        'english': '🇬🇧 English',
        'ai': '🤖 AI',
        'management': '🏢 Management',
        'founder_note': '✍️ FounderNote',
        'quiz': '📝 Quiz'
    }
    for subject, title, preview in lessons:
        name = subject_names.get(subject, subject)
        lines.append(f"**{name}**: {title}")
        lines.append(f"  {preview}...")

    return '\n'.join(lines)
