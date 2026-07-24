"""
Academy 课程保存工具
供 cron 调用：python scripts/save_lesson.py --day 1 --subject english --title "xxx" --content "xxx"

也支持管道输入内容:
    echo "课程内容" | python scripts/save_lesson.py --day 1 --subject english --title "xxx"
"""

import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from bot.database import save_lesson

def main():
    parser = argparse.ArgumentParser(description='保存 Academy 课程内容')
    parser.add_argument('--day', type=int, required=True, help='第几天')
    parser.add_argument('--subject', required=True,
                       choices=['english', 'ai', 'management', 'founder_note', 'quiz'],
                       help='科目')
    parser.add_argument('--title', required=True, help='课程标题')
    parser.add_argument('--content', help='课程内容（如不传则从 stdin 读取）')

    args = parser.parse_args()

    content = args.content
    if not content:
        content = sys.stdin.read().strip()

    if not content:
        print("❌ 错误：未提供课程内容")
        sys.exit(1)

    save_lesson(args.day, args.subject, args.title, content)
    print(f"✅ 已保存 Day {args.day} {args.subject}: {args.title}")

if __name__ == '__main__':
    main()
