#!/usr/bin/env python3
"""
note.com に stats47 として対話ログインし、認証 cookie を取り出す (有料記事復元用)。

headed の playwright ブラウザを開き、ユーザーが stats47 でログインするのを待つ。
current_user が urlname==stats47 になったら cookie を .local/note-cookies.json に保存して終了。
restore-from-notecom.py --include-paid --cookie-file .local/note-cookies.json で使う。

実行: /Users/minamidaisuke/stats47/.memory-env/bin/python \
        .claude/scripts/note/catalog/login-note-playwright.py
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / ".local/note-cookies.json"
TIMEOUT_S = 600
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        # channel="chrome" で実 Chrome を使う (フレッシュ・保存パスワードは無い前提)
        try:
            browser = p.chromium.launch(channel="chrome", headless=False)
        except Exception:
            browser = p.chromium.launch(headless=False)
        ctx = browser.new_context(user_agent=UA)
        page = ctx.new_page()
        page.goto("https://note.com/login", wait_until="domcontentloaded")
        print("ブラウザで note.com に stats47 としてログインしてください…", flush=True)
        deadline = time.time() + TIMEOUT_S
        while time.time() < deadline:
            time.sleep(4)
            try:
                r = ctx.request.get(
                    "https://note.com/api/v2/current_user",
                    headers={"User-Agent": UA},
                )
                d = r.json().get("data")
                name = d.get("urlname") if isinstance(d, dict) else None
            except Exception:
                name = None
            if name == "stats47":
                cookies = ctx.cookies("https://note.com")
                OUT.write_text(json.dumps(cookies, ensure_ascii=False, indent=2))
                print(f"LOGGED_IN stats47 — cookies saved to {OUT}", flush=True)
                browser.close()
                return 0
            if name and name != "stats47":
                print(f"別アカウントでログイン中: {name} — stats47 に切り替えてください", flush=True)
        print("タイムアウト: stats47 ログインを検知できませんでした", flush=True)
        browser.close()
        return 1


if __name__ == "__main__":
    sys.exit(main())
