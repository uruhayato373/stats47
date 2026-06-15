#!/usr/bin/env python3
"""ingest-gsc-export.py — GSC「ページ」インデックスエクスポート(zip)を正規化して取り込む。

GSC UI (インデックス作成 > ページ) の export は:
  - ファイル名が cp932 (`unzip` が Illegal byte sequence で失敗する)
  - カテゴリ別 drilldown zip / 集計 zip / 推移 zip が混在する
を、カテゴリ判定して正準ファイル名で `.claude/state/metrics/gsc/coverage-drilldown/<週>/` に展開する。
出力は auto-resubmit.mjs / build-coverage-queue.mjs が読む形式 (`<category>-urls.csv` = `URL,前回のクロール`)。

使い方:
  python3 .claude/scripts/gsc/ingest-gsc-export.py                    # ~/Downloads の GSC zip を自動取り込み
  python3 .claude/scripts/gsc/ingest-gsc-export.py --src ~/Downloads  # 取り込み元ディレクトリ指定
  python3 .claude/scripts/gsc/ingest-gsc-export.py --week 2026-W25    # 週を明示 (既定: 今日の ISO 週)

正典: docs/02_実装計画/12_GSCカバレッジ是正ループ.md
"""
import argparse
import datetime as dt
import io
import json
import os
import sys
import unicodedata
import zipfile

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DRILLDOWN_DIR = os.path.join(PROJECT_ROOT, ".claude/state/metrics/gsc/coverage-drilldown")

# GSC 「理由」(問題) → 正準 category slug。auto-resubmit.mjs は `*-urls.csv` を全て未INDEXED扱いするので、
# 意図的カテゴリ(redirect/robots/noindex/alt-canonical/duplicate)も別名で保存し build 側で分類する。
CATEGORY_MAP = {
    "見つかりませんでした（404）": "not-found-404",
    "ソフト 404": "soft-404",
    "サーバーエラー（5xx）": "server-error-5xx",
    "ページにリダイレクトがあります": "redirect",
    "robots.txt によりブロックされました": "robots-blocked",
    "robots.txt によりブロックされましたが、インデックスに登録しました": "robots-blocked-indexed",
    "クロール済み - インデックス未登録": "crawled-not-indexed",
    "検出 - インデックス未登録": "discovered-not-indexed",
    "noindex タグによって除外されました": "noindex-excluded",
    "代替ページ（適切な canonical タグあり）": "alt-canonical",
    "リダイレクト エラー": "redirect-error",
    "他の 4xx の問題が原因でブロックされました": "other-4xx",
    "重複しています。Google により、ユーザーがマークしたページとは異なるページが正規ページとして選択されました": "duplicate-google-chose-other",
    "重複しています。ユーザーにより、正規ページとして選択されていません": "duplicate-no-user-canonical",
    "送信して登録されました": "indexed-submitted",
    "登録済み（インデックス登録済み）": "indexed-submitted",
}


def iso_week(date: dt.date) -> str:
    y, w, _ = date.isocalendar()
    return f"{y}-W{w:02d}"


def decode_member_name(info: zipfile.ZipInfo) -> str:
    """cp437 として読まれた cp932 ファイル名を復元 (中身判定には使わないが参考用)。"""
    raw = info.filename.encode("cp437", errors="replace")
    for enc in ("cp932", "shift_jis"):
        try:
            return raw.decode(enc)
        except Exception:
            continue
    return info.filename


def decode_text(data: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "cp932"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")


def classify_member(text: str):
    """CSV テキストの中身から種別を判定して ('kind', payload) を返す。
    kind: 'drilldown'(category, lines) / 'aggregate'(理由→件数) / 'trend'(lines) / 'meta'(問題) / 'unknown'
    """
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        return ("unknown", None)
    header = lines[0]
    # 個別 URL drilldown: 先頭列 URL
    if header.startswith("URL") or (lines[1:2] and lines[1].startswith("http")):
        return ("drilldown", lines)
    # 集計 (重大な問題): 理由,ソース,確認,ページ
    if header.startswith("理由") and "ページ" in header:
        agg = {}
        for l in lines[1:]:
            cols = l.split(",")
            if len(cols) >= 4:
                reason = cols[0].strip()
                try:
                    agg[reason] = int(cols[-1].strip())
                except ValueError:
                    pass
        return ("aggregate", agg)
    # 推移: 日付,未登録,登録済み,表示回数
    if header.startswith("日付"):
        return ("trend", lines)
    # メタ: プロパティ,値 (問題 行にカテゴリ名)
    if header.startswith("プロパティ"):
        problem = None
        for l in lines[1:]:
            cols = l.split(",", 1)
            if cols[0].strip() == "問題" and len(cols) > 1:
                problem = cols[1].strip()
        return ("meta", problem)
    return ("unknown", None)


def process_zip(zp: str):
    """1 つの zip を解析し dict を返す: {category, drilldown_lines, aggregate, trend_lines}"""
    result = {"category": None, "drilldown": None, "aggregate": None, "trend": None}
    try:
        z = zipfile.ZipFile(zp)
    except zipfile.BadZipFile:
        return None
    members = []
    for info in z.infolist():
        if info.is_dir():
            continue
        data = z.read(info)
        text = decode_text(data)
        kind, payload = classify_member(text)
        members.append((kind, payload, text))
    # メタの「問題」が最優先のカテゴリ判定
    for kind, payload, _ in members:
        if kind == "meta" and payload:
            result["category"] = CATEGORY_MAP.get(payload, payload)
    for kind, payload, text in members:
        if kind == "drilldown":
            result["drilldown"] = payload
        elif kind == "aggregate":
            # 「重大な問題」(13行) と「重大ではない問題」(1行) を両方マージ (上書きしない)
            merged = dict(result["aggregate"] or {})
            for k, v in payload.items():
                # 同 reason は大きい方を採用 (集計の取り違え防止)
                merged[k] = max(merged.get(k, 0), v)
            result["aggregate"] = merged
        elif kind == "trend":
            result["trend"] = text
    # zip が単一カテゴリ集計のみ (Drilldown 無し) の場合もある
    return result


def is_gsc_zip(zp: str) -> bool:
    name = unicodedata.normalize("NFC", os.path.basename(zp))
    return name.endswith(".zip") and ("インデックス" in name or "カバレッジ" in name or "Coverage" in name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.expanduser("~/Downloads"), help="GSC zip の取り込み元")
    ap.add_argument("--week", default=None, help="保存先 ISO 週 (既定: 今日)")
    ap.add_argument("--date", default=None, help="今日の日付 YYYY-MM-DD (week 自動算出用)")
    args = ap.parse_args()

    today = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    week = args.week or iso_week(today)
    out_dir = os.path.join(DRILLDOWN_DIR, week)
    os.makedirs(out_dir, exist_ok=True)

    if not os.path.isdir(args.src):
        print(f"!! src not found: {args.src}", file=sys.stderr)
        sys.exit(1)

    zips = sorted(
        [os.path.join(args.src, f) for f in os.listdir(args.src) if is_gsc_zip(os.path.join(args.src, f))],
        key=lambda p: os.path.getmtime(p),
    )
    if not zips:
        print(f"!! {args.src} に GSC zip が見つかりません (ファイル名に 'インデックス'/'カバレッジ'/'Coverage' を含む zip)", file=sys.stderr)
        sys.exit(1)

    aggregate = {}
    trend_text = None
    written = []
    for zp in zips:
        r = process_zip(zp)
        if not r:
            continue
        if r["aggregate"]:
            for k, v in r["aggregate"].items():
                aggregate[k] = max(aggregate.get(k, 0), v)
        if r["trend"]:
            trend_text = r["trend"]
        if r["drilldown"] and r["category"]:
            cat = r["category"]
            # ★命名規約: 生 drilldown は `-drilldown.csv`。auto-resubmit.mjs は `-urls.csv` だけ拾うため、
            #   死んだ 404 を含む生エクスポートは再送信対象に**しない**。build-coverage-queue.mjs が
            #   本番 HTTP 実測で live を選別し curated `coverage-live-resubmit-urls.csv` に書き出す。
            fname = f"{cat}-drilldown.csv"
            # drilldown lines はヘッダ込み。URL,前回のクロール 形式に正規化
            lines = r["drilldown"]
            body = []
            for i, l in enumerate(lines):
                if i == 0 and l.startswith("URL"):
                    continue
                if l.startswith("http"):
                    body.append(l)
            with open(os.path.join(out_dir, fname), "w", encoding="utf-8") as f:
                f.write("URL,前回のクロール\n")
                f.write("\n".join(body) + ("\n" if body else ""))
            written.append((fname, len(body)))

    # 集計 (カテゴリ別総件数) を保存 → 経過観測のトレンド入力
    if aggregate:
        totals = {}
        for reason, cnt in aggregate.items():
            totals[CATEGORY_MAP.get(reason, reason)] = cnt
        with open(os.path.join(out_dir, "category-totals.json"), "w", encoding="utf-8") as f:
            json.dump({"week": week, "date": today.isoformat(), "totals": totals, "raw": aggregate}, f, ensure_ascii=False, indent=2)
        written.append(("category-totals.json", len(totals)))

    if trend_text:
        with open(os.path.join(out_dir, "coverage-trend.csv"), "w", encoding="utf-8") as f:
            f.write(trend_text if trend_text.endswith("\n") else trend_text + "\n")
        written.append(("coverage-trend.csv", trend_text.count("\n")))

    print(f"[ingest] week={week} → {os.path.relpath(out_dir, PROJECT_ROOT)}")
    for fname, n in written:
        print(f"  {n:5d}  {fname}")
    if not written:
        print("  (取り込み対象なし — drilldown/集計/推移のいずれも検出できませんでした)")


if __name__ == "__main__":
    main()
