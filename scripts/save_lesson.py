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

    print("❌ Legacy SQLite 写入已禁用。")
    print("当前课程内容以 mini-app 的 seed 与课程表为准，不再通过脚本写入。")
    sys.exit(2)

if __name__ == '__main__':
    main()
