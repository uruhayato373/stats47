#!/usr/bin/env python3
"""ingest-gsc-export.py — GSC「ページ」インデックスエクスポート(zip)を正規化して取り込む。

GSC UI (インデックス作成 > ページ) の export は:
  - ファイル名が cp932 (`unzip` が Illegal byte sequence で失敗する)
  - カテゴリ別 drilldown zip / 集計 zip / 推移 zip が混在する
を、カテゴリ判定して正準ファイル名で `data/gsc/coverage-drilldown/<週>/` に展開する。
出力は auto-resubmit.mjs / build-coverage-queue.mjs が読む形式 (`<category>-urls.csv` = `URL,前回のクロール`)。

使い方:
  python3 .claude/scripts/gsc/ingest-gsc-export.py                    # ~/Downloads の GSC zip を自動取り込み
  python3 .claude/scripts/gsc/ingest-gsc-export.py --src ~/Downloads  # 取り込み元ディレクトリ指定
  python3 .claude/scripts/gsc/ingest-gsc-export.py --week 2026-W25    # 週を明示 (既定: 今日の ISO 週)

正典: .claude/skills/analytics/gsc-coverage-remediation/SKILL.md
"""
import argparse
import csv
import datetime as dt
import io
import json
import os
import sys
import unicodedata
import zipfile
from urllib.parse import urlparse

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DRILLDOWN_DIR = os.path.join(PROJECT_ROOT, "data/gsc/coverage-drilldown")
# 「すべての送信済みページ」ビュー (pages=ALL_SUBMITTED_URLS) の週次推移。datasets.mjs の gsc.coverage-submitted。
SUBMITTED_HISTORY = os.path.join(PROJECT_ROOT, "data/gsc/coverage-submitted-history.csv")
# export-coverage-playwright.mjs が送信済みビューの概要 zip 名の末尾に埋める識別子。
SUBMITTED_MARKER = "送信済みビュー"
# メタデータ.csv の `サイトマップ` 行の値。ビューの取り違えをファイル名ではなく中身で見分ける。
SITEMAP_ALL_KNOWN = "すべての既知のページ"
SITEMAP_ALL_SUBMITTED = "すべての送信済みページ"
SUBMITTED_HISTORY_REASONS = (
    "discovered-not-indexed", "noindex-excluded", "crawled-not-indexed", "robots-blocked",
    "not-found-404", "redirect", "redirect-error", "server-error-5xx", "soft-404",
)
SUBMITTED_HISTORY_HEADER = ["week", "date", "status", "indexed", "not-indexed", *SUBMITTED_HISTORY_REASONS]

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


def parse_validation(text: str):
    """理由表の `確認` 列(検証の状態)を {理由: 状態} で返す。列が無ければ {}。未知の値も文字列のまま持つ。"""
    rows = [r for r in csv.reader(text.splitlines()) if r]
    if not rows or "確認" not in rows[0] or "理由" not in rows[0]:
        return {}
    ri, ci = rows[0].index("理由"), rows[0].index("確認")
    return {r[ri].strip(): r[ci].strip() for r in rows[1:] if len(r) > max(ri, ci) and r[ci].strip()}


def parse_sitemap(text: str):
    """メタデータ.csv (プロパティ,値) の `サイトマップ` 行の値。無ければ None。"""
    rows = [r for r in csv.reader(text.splitlines()) if r]
    if not rows or not rows[0] or not rows[0][0].startswith("プロパティ"):
        return None
    for r in rows[1:]:
        if len(r) > 1 and r[0].strip() == "サイトマップ":
            return r[1].strip()
    return None


def process_zip(zp: str):
    """1 つの zip を解析し dict を返す: {category, drilldown_lines, aggregate, trend_lines}"""
    result = {"category": None, "drilldown": None, "aggregate": None, "trend": None,
              "validation": {}, "sitemap": None}
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
    for _, _, text in members:
        sm = parse_sitemap(text)
        if sm:
            result["sitemap"] = sm
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
            result["validation"].update(parse_validation(text))
        elif kind == "trend":
            result["trend"] = text
    # zip が単一カテゴリ集計のみ (Drilldown 無し) の場合もある
    return result


# 概要グラフ (日付,未登録,登録済み,表示回数) の列名。カテゴリ別グラフ (日付,該当ページ) は持たない。
INDEXED_HEADERS = ("登録済み", "インデックス登録済み", "Indexed")
NOT_INDEXED_HEADERS = ("未登録", "インデックス未登録", "Not indexed")


def parse_index_status(trend_text: str):
    """概要グラフの最新日から登録済み/未登録の件数を返す。登録済み列が無いグラフは None。

    「重大な問題」表は未登録の理由別件数しか持たないため、登録済みの総数はこのグラフにしか無い。
    以前は読んでいなかったので coverage-totals-history.csv の indexed-submitted 列が常に空だった。
    """
    rows = [row for row in csv.reader(trend_text.splitlines()) if row]
    if len(rows) < 2:
        return None
    header = [h.strip() for h in rows[0]]
    indexed_col = next((header.index(h) for h in INDEXED_HEADERS if h in header), None)
    if indexed_col is None:
        return None
    not_indexed_col = next((header.index(h) for h in NOT_INDEXED_HEADERS if h in header), None)
    latest = max(rows[1:], key=lambda row: row[0].strip())

    def count(col):
        try:
            return int(latest[col].replace(",", "").strip())
        except (IndexError, TypeError, ValueError):
            return None

    indexed = count(indexed_col)
    if indexed is None:
        return None
    return {
        "date": latest[0].strip(),
        "indexed": indexed,
        "not_indexed": count(not_indexed_col) if not_indexed_col is not None else None,
    }


def is_gsc_zip(zp: str) -> bool:
    name = unicodedata.normalize("NFC", os.path.basename(zp))
    return name.endswith(".zip") and ("インデックス" in name or "カバレッジ" in name or "Coverage" in name)


def is_submitted_zip(zp: str) -> bool:
    """送信済みビューの概要 zip か。「すべての既知」の集計へ混ぜると max マージで壊れるので分離する。"""
    return SUBMITTED_MARKER in unicodedata.normalize("NFC", os.path.basename(zp))


def canonical_validation(raw_validation):
    """{理由: 状態} → {正準名: 状態}。正準名に写像できない理由は生のラベルのまま。"""
    return {CATEGORY_MAP.get(k, k): v for k, v in (raw_validation or {}).items()}


def classify_view(zp: str, report):
    """('known'|'submitted'|'mismatch', 理由)。ファイル名の目印かメタデータの値で送信済みと判定し、食い違えば mismatch。"""
    by_name = is_submitted_zip(zp)
    sitemap = (report or {}).get("sitemap")
    if sitemap == SITEMAP_ALL_KNOWN and by_name:
        return ("mismatch", f"{os.path.basename(zp)}: ファイル名は送信済みビューだがメタデータのサイトマップは「{sitemap}」")
    if by_name or sitemap == SITEMAP_ALL_SUBMITTED:
        return ("submitted", None)
    return ("known", None)


def build_submitted_record(report, week, date):
    """送信済みビューの概要 zip 1 件から記録を作る。登録済み件数が読めなければ None (未取得扱い)。"""
    if not report or not report.get("trend"):
        return None
    status = parse_index_status(report["trend"])
    if not status:
        return None
    raw = dict(report.get("aggregate") or {})
    totals = {CATEGORY_MAP.get(k, k): v for k, v in raw.items()}
    return {
        "week": week, "date": date, "view": "ALL_SUBMITTED_URLS", "status": "captured",
        "index_status": status, "totals": totals, "raw": raw,
        "validation": canonical_validation(report.get("validation")),
    }


def update_submitted_history(path, week, date, record):
    """週次推移 CSV を更新する。record=None (未取得) は空欄で status=missing と記録し、0 では埋めない。
    既に captured の週を missing で上書きしない。"""
    rows = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                rows[row["week"]] = row
    if record is None:
        if rows.get(week, {}).get("status") == "captured":
            return False
        new = {"week": week, "date": date, "status": "missing"}
    else:
        status = record["index_status"]
        new = {"week": week, "date": date, "status": "captured", "indexed": status["indexed"],
               "not-indexed": "" if status["not_indexed"] is None else status["not_indexed"]}
        for reason in SUBMITTED_HISTORY_REASONS:
            if reason in record["totals"]:
                new[reason] = record["totals"][reason]
    rows[week] = new
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=SUBMITTED_HISTORY_HEADER, lineterminator="\n", restval="")
        w.writeheader()
        for key in sorted(rows):
            w.writerow({k: rows[key].get(k, "") for k in SUBMITTED_HISTORY_HEADER})
    return True


def validate_actionable_reports(reports):
    """Validate this run's ZIP contents, not stale files already in the destination."""
    required = {"not-found-404", "soft-404", "server-error-5xx", "crawled-not-indexed", "discovered-not-indexed"}
    totals = {CATEGORY_MAP.get(k, k): v for r in reports for k, v in (r.get("aggregate") or {}).items()}
    for category in required:
        matches = [r for r in reports if r.get("category") == category and r.get("drilldown")]
        if len(matches) != 1 or category not in totals:
            raise ValueError(f"report_incomplete: missing or duplicate {category}")
        rows = list(csv.reader(matches[0]["drilldown"]))
        if rows[0][0] != "URL" or len(rows) - 1 != min(totals[category], 1000):
            raise ValueError(f"report_incomplete: row count {category}")
        urls = [row[0] for row in rows[1:] if row]
        if len(set(urls)) != len(rows) - 1:
            raise ValueError(f"report_incomplete: duplicate URL {category}")
        for value in urls:
            url = urlparse(value)
            # sc-domain properties include every subdomain, unlike URL-prefix properties.
            if url.scheme not in ("http", "https") or not (url.hostname == "stats47.jp" or (url.hostname or "").endswith(".stats47.jp")):
                raise ValueError("account_mismatch: drilldown host")


def normalize_drilldown(lines):
    rows = list(csv.reader(lines))
    if not rows or rows[0] != ["URL", "前回のクロール"]:
        raise ValueError("report_incomplete: drilldown header")
    if any(len(row) != 2 or urlparse(row[0]).scheme not in ("http", "https") for row in rows[1:]):
        raise ValueError("report_incomplete: drilldown row")
    out = io.StringIO(newline="")
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue(), len(rows) - 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.expanduser("~/Downloads"), help="GSC zip の取り込み元")
    ap.add_argument("--week", default=None, help="保存先 ISO 週 (既定: 今日)")
    ap.add_argument("--date", default=None, help="今日の日付 YYYY-MM-DD (week 自動算出用)")
    ap.add_argument("--require-actionable", action="store_true", help="概要と5分類の内容・行数・サイト帰属を必須照合")
    args = ap.parse_args()

    today = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    week = args.week or iso_week(today)
    out_dir = os.path.join(DRILLDOWN_DIR, week)

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

    processed = [(zp, process_zip(zp)) for zp in zips]
    submitted_report = None
    reports = []
    for zp, rep_ in processed:
        view, why = classify_view(zp, rep_)
        if view == "mismatch":
            print(f"  !! ビュー取り違えのため取り込まない: {why}", file=sys.stderr)
        elif view == "submitted":
            submitted_report = rep_  # mtime 昇順なので最後が最新
        else:
            reports.append(rep_)
    if args.require_actionable:
        if any(r is None for r in reports):
            raise ValueError("report_incomplete: invalid ZIP")
        validate_actionable_reports(reports)
    os.makedirs(out_dir, exist_ok=True)
    aggregate = {}
    raw_validation = {}
    trend_text = None
    index_status = None
    written = []
    for r in reports:
        if not r:
            continue
        if r["aggregate"]:
            for k, v in r["aggregate"].items():
                aggregate[k] = max(aggregate.get(k, 0), v)
            raw_validation.update(r.get("validation") or {})
        if r["trend"] and not r["category"]:
            # 登録済み列を持つ概要グラフを優先する (カテゴリ別グラフで上書きしない)
            status = parse_index_status(r["trend"])
            if status:
                index_status = status
                trend_text = r["trend"]
            elif index_status is None:
                trend_text = r["trend"]
        if r["drilldown"] and r["category"]:
            cat = r["category"]
            # ★命名規約: 生 drilldown は `-drilldown.csv`。auto-resubmit.mjs は `-urls.csv` だけ拾うため、
            #   死んだ 404 を含む生エクスポートは再送信対象に**しない**。build-coverage-queue.mjs が
            #   本番 HTTP 実測で live を選別し curated `coverage-live-resubmit-urls.csv` に書き出す。
            fname = f"{cat}-drilldown.csv"
            # Preserve quoted URLs containing commas; never silently drop rows.
            body, row_count = normalize_drilldown(r["drilldown"])
            with open(os.path.join(out_dir, fname), "w", encoding="utf-8") as f:
                f.write(body)
            written.append((fname, row_count))

    # 集計 (カテゴリ別総件数) を保存 → 経過観測のトレンド入力
    if aggregate:
        totals = {}
        for reason, cnt in aggregate.items():
            totals[CATEGORY_MAP.get(reason, reason)] = cnt
        if index_status:
            totals["indexed-submitted"] = index_status["indexed"]
        else:
            print("  !! 概要グラフに登録済み件数が無い — indexed-submitted は空のまま", file=sys.stderr)
        with open(os.path.join(out_dir, "category-totals.json"), "w", encoding="utf-8") as f:
            json.dump({"week": week, "date": today.isoformat(), "totals": totals, "raw": aggregate,
                       "index_status": index_status, "validation": canonical_validation(raw_validation)}, f, ensure_ascii=False, indent=2)
        written.append(("category-totals.json", len(totals)))

    # 送信済みビュー: 取れた週だけ週フォルダへ記録し、推移 CSV には取れなかった週も missing で残す
    submitted = build_submitted_record(submitted_report, week, today.isoformat())
    if submitted:
        with open(os.path.join(out_dir, "submitted-totals.json"), "w", encoding="utf-8") as f:
            json.dump(submitted, f, ensure_ascii=False, indent=2)
        written.append(("submitted-totals.json", len(submitted["totals"])))
    else:
        print("  !! 送信済みビューの概要 zip が無い/登録済み件数を読めない — 未取得として記録", file=sys.stderr)
    update_submitted_history(SUBMITTED_HISTORY, week, today.isoformat(), submitted)

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
