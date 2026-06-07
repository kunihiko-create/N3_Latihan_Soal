#!/usr/bin/env python3
"""data/index.json と参照先の JSON をまとめて data/bundle.js を生成する。

これにより、index.html をブラウザで直接開いても（file://）、
GitHub Pages 上でも、fetch を使わずにデータを読み込める。

使い方:
    python3 tools/build_bundle.py
（JLPT-N3-App ディレクトリ、またはその tools から実行）
"""
import json
import os

# このスクリプトの場所から JLPT-N3-App ルートを特定
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
INDEX_PATH = os.path.join(DATA_DIR, "index.json")
OUT_PATH = os.path.join(DATA_DIR, "bundle.js")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    index = load(INDEX_PATH)
    files = {}

    for group in ("past", "similar"):
        for entry in index.get(group, []):
            rel = entry["file"]  # 例: "data/past/2023-07.json"
            abs_path = os.path.join(ROOT, rel)
            files[rel] = load(abs_path)

    bundle = {"index": index, "files": files}

    payload = json.dumps(bundle, ensure_ascii=False, indent=2)
    js = (
        "// 自動生成ファイル — 直接編集しないでください。\n"
        "// 元データを変更したら `python3 tools/build_bundle.py` で再生成します。\n"
        "window.JLPT_DATA = " + payload + ";\n"
    )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(js)

    print("bundle.js を生成しました:", OUT_PATH)
    print("  収録:", ", ".join(files.keys()))


if __name__ == "__main__":
    main()
