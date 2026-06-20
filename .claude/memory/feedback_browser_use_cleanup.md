---
name: browser-use 終了時 daemon クリーンアップ必須
description: close は page を閉じるだけで daemon を止めない。pkill 必須
type: feedback
originSessionId: 931dd251-e8f5-4988-a5c5-a6306131c5ff
---
2026-04-25 検証で確定。`browser-use` CLI の `close` サブコマンドは page を閉じるだけで `browser_use.skill_cli.daemon` Python プロセス本体を停止しない。

## 症状

publish-note / fetch-note-metrics 等を 1 日に何度か実行すると:
- 6 個以上の `browser_use.skill_cli.daemon` プロセスが残存
- 各 daemon が 5-6 個の chromium ヘルパープロセスを抱える
- 結果: OS 全体が重くなる + 次回 `browser-use ... open` が 60s timeout

## 必須対応（3 段すべて）

`--profile "Profile 1"` で起動した場合は **ユーザーの実 Chrome 内にタブを開く** ため、daemon kill だけだとタブが残る。スクリプト / スキル末尾で 3 段すべてを trap で必ず実行:

```bash
trap '
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null
  osascript -e "tell application \"Google Chrome\"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t contains \"editor.note.com\" then close t
      end repeat
    end repeat
  end tell" 2>/dev/null || true
' EXIT INT TERM
```

Node.js orchestrator なら `process.on('exit')` / `SIGINT` で同等。AppleScript の URL 条件は対象サイトに合わせて調整。

## 関連

- CLAUDE.md 作業規約に横断ルールあり（PR #105）
- `scripts/note/fetch-note-metrics.sh` の trap で実装済（launchd 経由で週次自動掃除）
- 対象スキル: `publish-note` / `fetch-note-metrics` / `post-instagram` / `post-x` / `post-tiktok` / `post-youtube` / `find-quote-rt` 等 browser-use 系全般
