#!/usr/bin/env python3
"""開発用ヘルパー: JLPT の PDF ページを PNG 画像に変換する。

PDF の日本語はフォント埋め込みの都合でテキスト直接抽出ができないため、
ページを画像化して目視で読み取り、JSON へ構造化するための補助スクリプト。
アプリの実行時には不要。

使い方:
    python3 render_pdf.py "<pdf path>" <出力ディレクトリ> [--dpi 150] [--pages 1-5]
"""
import argparse
import os
import sys

import fitz  # PyMuPDF


def parse_pages(spec, total):
    if not spec:
        return range(total)
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a) - 1, int(b)))
        else:
            out.append(int(part) - 1)
    return [p for p in out if 0 <= p < total]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("outdir")
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--pages", default="")
    args = ap.parse_args()

    doc = fitz.open(args.pdf)
    os.makedirs(args.outdir, exist_ok=True)
    base = os.path.splitext(os.path.basename(args.pdf))[0]
    for i in parse_pages(args.pages, doc.page_count):
        pix = doc[i].get_pixmap(dpi=args.dpi)
        path = os.path.join(args.outdir, f"{base}_p{i + 1:02d}.png")
        pix.save(path)
        print(path)


if __name__ == "__main__":
    sys.exit(main())
