"""Academy 灰色幽默提醒文案与随机选择。

cron 可调用 ``python bot/main.py --cmd reminder --level 1 --user-id <telegram_id>``。
同一用户最近 5 次收到的文案会被排除，发送后写入 SQLite 历史。
"""

from __future__ import annotations

import random
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime, timezone

from bot.database import get_conn


@dataclass(frozen=True)
class ReminderTemplate:
    id: str
    level: int
    content: str
    button_text: str
    weight: int = 100


_COPY = {
    1: (
        "开始今天的课程",
        [
            "今天的知识不会自己长进脑子。遗憾的是，工资通常也不会替你学习。",
            "课程只要 15 分钟。你上次刷短视频，大概不是这个数字。",
            "未来的你发来消息：别再把今天的任务外包给明天。",
            "学习不一定立刻改变命运，不学习通常也很稳定。",
            "大脑申请继续摸鱼，Academy 已驳回。",
            "今天不要求逆袭，只要求别继续原地踏步。",
            "你的课程还活着，只是完成率看起来不太乐观。",
            "成年人的自由包括自由拖延，也包括承担拖延的后果。",
            "今日份能力升级已送达。是否安装，由你决定。",
            "世界不会因为你没学习而停止运转，它只会继续把差距算进去。",
            "先完成今天这 15 分钟，再去处理那些假装很紧急的事情。",
            "课程已经准备好。你的借口如果也准备好了，可以让它们先聊一会儿。",
        ],
    ),
    2: (
        "现在补上",
        [
            "今日任务尚未完成。它没有消失，只是开始积灰。",
            "你成功躲过了课程，知识也成功躲过了你。",
            "进度条安静得像周一早晨的灵魂。",
            "学习计划还在等你，耐心比老板好一点，但也有限。",
            "今天再不开始，明天会获得双倍内疚，完全免费。",
            "没关系，拖延也是一种坚持，只是方向不太理想。",
            "课程只要 15 分钟，焦虑它通常更久。",
            "今日任务正在从“稍后完成”缓慢变成“又没完成”。",
            "你可以晚一点开始，但不能用“晚一点”学习一辈子。",
            "系统没有催你，它只是在替昨天信心满满的你收账。",
        ],
    ),
    3: (
        "保住今天",
        [
            "今天快结束了，任务还没有。两者似乎只有一个比较着急。",
            "再拖一会儿，今天的课程就会正式成为明天的心理负担。",
            "连续记录正在悬崖边散步。现在还能把它叫回来。",
            "今日学习窗口即将关闭。借口可以保留，任务请先提交。",
            "最后一班学习列车准备关门。它不豪华，但至少往前开。",
            "如果今天选择放弃，系统会如实记录，不替任何人美化历史。",
        ],
    ),
    4: (
        "恢复学习",
        [
            "连续中断已发生。下一课暂时锁定，先把欠下的今天处理掉。",
            "学习计划已经失联两天。系统决定正式介入。",
            "两天没完成不是世界末日，但继续假装没发生通常是下一步。",
            "进度没有背叛你，它只是忠实展示了你没有出现。",
            "下一课在门后等你。钥匙是完成当前任务，不是再立一个新计划。",
            "系统已进入监督模式。放心，它不会讲大道理，只会继续追问。",
        ],
    ),
}


REMINDER_TEMPLATES = tuple(
    ReminderTemplate(
        id=f"l{level}-{index:02d}",
        level=level,
        content=content,
        button_text=button_text,
    )
    for level, (button_text, messages) in _COPY.items()
    for index, content in enumerate(messages, start=1)
)


def _ensure_tables() -> None:
    with closing(get_conn()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reminder_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                template_id TEXT NOT NULL,
                level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 4),
                sent_at TEXT NOT NULL,
                clicked_at TEXT,
                completed_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_reminder_events_user_sent
            ON reminder_events(user_id, sent_at DESC)
            """
        )
        conn.commit()


def recent_template_ids(user_id: str, limit: int = 5) -> list[str]:
    _ensure_tables()
    with closing(get_conn()) as conn:
        rows = conn.execute(
            """
            SELECT template_id
            FROM reminder_events
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (str(user_id), limit),
        ).fetchall()
    return [str(row[0]) for row in rows]


def select_reminder(
    level: int,
    user_id: str,
    *,
    rng: random.Random | None = None,
) -> ReminderTemplate:
    if level not in _COPY:
        raise ValueError("Reminder level must be between 1 and 4")

    recent = set(recent_template_ids(user_id))
    level_templates = [
        template for template in REMINDER_TEMPLATES if template.level == level
    ]
    candidates = [
        template for template in level_templates if template.id not in recent
    ] or level_templates
    chooser = rng or random.SystemRandom()
    return chooser.choices(
        candidates,
        weights=[template.weight for template in candidates],
        k=1,
    )[0]


def record_reminder(user_id: str, template: ReminderTemplate) -> None:
    _ensure_tables()
    sent_at = datetime.now(timezone.utc).isoformat()
    with closing(get_conn()) as conn:
        conn.execute(
            """
            INSERT INTO reminder_events (user_id, template_id, level, sent_at)
            VALUES (?, ?, ?, ?)
            """,
            (str(user_id), template.id, template.level, sent_at),
        )
        conn.commit()


def choose_and_record_reminder(level: int, user_id: str) -> ReminderTemplate:
    template = select_reminder(level, user_id)
    record_reminder(user_id, template)
    return template
