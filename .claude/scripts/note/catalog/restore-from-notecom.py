#!/usr/bin/env python3
"""
note.com → R2 staging 本文復元 (一回限りの backfill)

背景: note カタログ SSOT 化で「note.com に公開済みだが R2 に本体 (draft.md/画像) が
無い」記事 (r2Body:false) が 165 件可視化された。これらは note.com が唯一のソース。
本スクリプトは note.com API v3 から本文を取得し、HTML→markdown 変換 + 画像を
`.local/r2/<r2_path>/` へ staging する。R2 への反映は creds を持つ環境で
`diff-push-r2.ts --prefix note` を実行する (R2 書き込みは CI/creds 専任)。

実行: /Users/minamidaisuke/stats47/.memory-env/bin/python \
        .claude/scripts/note/catalog/restore-from-notecom.py [options]

options:
  --limit N        先頭 N 件だけ処理 (試走用)
  --key <key>      特定 key (recovered-*/paid-*) 1 件だけ
  --include-paid   有料記事も対象 (所有者 note ログイン cookie が必要)
  --cookie <val>   _note_session_v5 の値 (有料取得用)
  --cookie-file <path>  playwright が保存した cookie JSON (login-note-playwright.py の出力)
  --out <dir>      staging ルート (既定 .local/r2)
  --no-images      画像 DL をスキップ (本文 md のみ)

無料 (recovered-*) は認証不要。有料 (paid-*) は can_read=true が要る = 所有者ログイン。
"""
import argparse
import datetime
import json
import os
import re
import sys
import time
from pathlib import Path

import httpx
from markdownify import markdownify as html2md

ROOT = Path(__file__).resolve().parents[4]
INDEX = ROOT / ".claude/state/note-published-urls.json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
TODAY = "2026-07-15"  # Date.now() は harness で使えないため固定


def load_targets():
    data = json.loads(INDEX.read_text())
    out = []
    for key, v in data["articles"].items():
        if v.get("status") != "note_only":
            continue
        r2_path = v.get("r2_path", "")
        note_id = r2_path.rsplit("/", 1)[-1]  # n<hex>
        out.append(
            {
                "key": key,
                "vertical": v["vertical"],
                "title": v.get("title", ""),
                "note_url": v.get("url", ""),
                "is_paid": bool(v.get("is_paid")),
                "published_at": v.get("published_at", ""),
                "r2_path": r2_path,
                "note_id": note_id,
            }
        )
    return out


def get_cookie_from_chrome():
    try:
        import browser_cookie3

        for prof in ["Profile 5", "Profile 1", "Profile 7", "Default"]:
            path = f"/Users/minamidaisuke/Library/Application Support/Google/Chrome/{prof}/Cookies"
            if not os.path.exists(path):
                continue
            cj = browser_cookie3.chrome(cookie_file=path, domain_name="note.com")
            jar = {c.name: c.value for c in cj}
            if "_note_session_v5" not in jar:
                continue
            # verify it is stats47 (owner)
            try:
                r = httpx.get(
                    "https://note.com/api/v2/current_user",
                    headers={"User-Agent": UA},
                    cookies=jar,
                    timeout=15,
                )
                d = r.json().get("data")
                urlname = d.get("urlname") if isinstance(d, dict) else None
                if urlname == "stats47":
                    return jar, prof
            except Exception:
                pass
        return None, None
    except Exception:
        return None, None


def fetch_note(note_id, cookies=None):
    url = f"https://note.com/api/v3/notes/{note_id}"
    r = httpx.get(url, headers={"User-Agent": UA}, cookies=cookies or {}, timeout=25)
    r.raise_for_status()
    return r.json()["data"]


def build_frontmatter(t, is_paid, price):
    fm = {
        "type": "note-draft",
        "vertical": t["vertical"],
        "title": t["title"],
        "note_url": t["note_url"],
        "published": True,
        "published_at": t["published_at"],
        "is_paid": is_paid,
    }
    if price:
        fm["price_jpy"] = price
    fm["restored_from"] = "note.com"
    fm["restored_at"] = TODAY
    lines = ["---"]
    for k, v in fm.items():
        if isinstance(v, bool):
            v = "true" if v else "false"
        lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)


def convert_body(body, note_id, out_dir, download_images):
    """HTML body → markdown, optionally downloading images into images/."""
    img_urls = re.findall(r'<img[^>]+src="([^"]+)"', body)
    img_map = {}
    if download_images and img_urls:
        img_dir = out_dir / "images"
        img_dir.mkdir(parents=True, exist_ok=True)
        for i, src in enumerate(dict.fromkeys(img_urls), 1):
            try:
                ext = os.path.splitext(src.split("?")[0])[1] or ".png"
                fname = f"image-{i:02d}{ext}"
                data = httpx.get(src, headers={"User-Agent": UA}, timeout=30).content
                (img_dir / fname).write_bytes(data)
                img_map[src] = f"images/{fname}"
            except Exception as e:
                print(f"    ! image DL fail {src}: {e}", file=sys.stderr)
    md = html2md(body, heading_style="ATX", strip=["span"])
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    # rewrite image src to local relative paths
    for src, rel in img_map.items():
        md = md.replace(src, rel)
    return md, len(img_urls), len(img_map)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--key")
    ap.add_argument("--include-paid", action="store_true")
    ap.add_argument("--cookie")
    ap.add_argument("--cookie-file")
    ap.add_argument("--out", default=".local/r2")
    ap.add_argument("--no-images", action="store_true")
    args = ap.parse_args()

    targets = load_targets()
    if args.key:
        targets = [t for t in targets if t["key"] == args.key]
    if not args.include_paid and not args.key:
        targets = [t for t in targets if not t["is_paid"]]

    cookies = None
    if args.include_paid or (args.key and targets and targets[0]["is_paid"]):
        if args.cookie_file:
            raw = json.loads(Path(args.cookie_file).read_text())
            # playwright cookies() 形式 (list of {name,value,...}) or 単純 dict
            if isinstance(raw, list):
                cookies = {c["name"]: c["value"] for c in raw}
            else:
                cookies = raw
            print(f"[auth] cookie-file: {len(cookies)} cookies from {args.cookie_file}")
        elif args.cookie:
            cookies = {"_note_session_v5": args.cookie}
        else:
            cookies, prof = get_cookie_from_chrome()
            if cookies:
                print(f"[auth] stats47 cookie from Chrome {prof}")
            else:
                print("[auth] stats47 の note ログイン cookie が見つかりません "
                      "(有料記事は本文が取れません)")

    if args.limit:
        targets = targets[: args.limit]

    out_root = ROOT / args.out
    restored, skipped_paid, failed = [], [], []
    for i, t in enumerate(targets, 1):
        tag = "PAID" if t["is_paid"] else "free"
        print(f"[{i}/{len(targets)}] {tag} {t['key']} — {t['title'][:40]}")
        try:
            d = fetch_note(t["note_id"], cookies)
        except Exception as e:
            print(f"    ! fetch fail: {e}")
            failed.append(t["key"])
            continue
        is_paid = bool(d.get("price"))
        price = d.get("price") or 0
        if is_paid and not d.get("can_read"):
            print("    ! 有料 & can_read=false → 所有者ログイン要。skip")
            skipped_paid.append(t["key"])
            continue
        out_dir = out_root / t["r2_path"]
        out_dir.mkdir(parents=True, exist_ok=True)
        md, n_img, n_dl = convert_body(
            d["body"], t["note_id"], out_dir, not args.no_images
        )
        fm = build_frontmatter(t, is_paid, price)
        title = t["title"] or d.get("name", "")
        draft = f"{fm}\n\n# {title}\n\n{md}\n"
        (out_dir / "draft.md").write_text(draft)
        print(f"    ✓ {len(md)} chars, images {n_dl}/{n_img} → {out_dir.relative_to(ROOT)}")
        restored.append(t["key"])
        time.sleep(0.3)

    print("\n=== summary ===")
    print(f"restored: {len(restored)}")
    print(f"skipped (paid no auth): {len(skipped_paid)}")
    print(f"failed: {len(failed)}")
    manifest = out_root / "_note-restore-manifest.json"
    manifest.write_text(
        json.dumps(
            {"restored": restored, "skipped_paid": skipped_paid, "failed": failed},
            ensure_ascii=False,
            indent=2,
        )
    )
    print(f"manifest: {manifest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
