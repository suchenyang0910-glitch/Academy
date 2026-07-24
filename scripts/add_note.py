"""
Academy 笔记添加工具
供 Bot 调用：python scripts/add_note.py --day 1 --note "今天学了..."
"""

import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from bot.database import save_note

def main():
    parser = argparse.ArgumentParser(description='添加 Academy 学习笔记')
    parser.add_argument('--day', type=int, required=True, help='第几天')
    parser.add_argument('--note', help='笔记内容（如不传则从 stdin 读取）')

    args = parser.parse_args()

    note = args.note
    if not note:
        note = sys.stdin.read().strip()

    if not note:
        print("❌ 错误：未提供笔记内容")
        sys.exit(1)

    save_note(args.day, note)
    print(f"✅ 已保存 Day {args.day} 的笔记")

if __name__ == '__main__':
    main()
