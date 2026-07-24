"""
Academy DB 初始化脚本
运行: python scripts/init_db.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'academy.db')

SCHEMA = """
-- 课程内容表
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    subject TEXT NOT NULL CHECK(subject IN ('english','ai','management','founder_note','quiz')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', '+7 hours'))
);

-- 学习笔记表
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', '+7 hours'))
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    subject TEXT NOT NULL CHECK(subject IN ('english','ai','management','founder_note','quiz')),
    completed INTEGER DEFAULT 0 CHECK(completed IN (0,1)),
    quiz_score INTEGER,
    updated_at TEXT DEFAULT (datetime('now', '+7 hours'))
);

-- Day 计数器
CREATE TABLE IF NOT EXISTS day_counter (
    current_day INTEGER NOT NULL DEFAULT 1
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_lessons_day ON lessons(day);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
CREATE INDEX IF NOT EXISTS idx_notes_day ON notes(day);
CREATE INDEX IF NOT EXISTS idx_progress_day ON progress(day);
"""

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)

    # 初始化 day_counter
    cur = conn.execute("SELECT COUNT(*) FROM day_counter")
    if cur.fetchone()[0] == 0:
        conn.execute("INSERT INTO day_counter (current_day) VALUES (1)")

    conn.commit()
    conn.close()
    print(f"✅ 数据库已初始化: {DB_PATH}")

if __name__ == '__main__':
    init_db()
