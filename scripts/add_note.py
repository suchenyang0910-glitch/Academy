"""
Academy 笔记添加工具
供 Bot 调用：python scripts/add_note.py --day 1 --note "今天学了..."
"""

import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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

    print("❌ Legacy SQLite 写入已禁用。")
    print("请使用 `/academy note ...`（Bot → mini-app API）或直接调用 mini-app /api/academy/notes。")
    sys.exit(2)

if __name__ == '__main__':
    main()
