# browser-use クリーンアップ規約

browser-use を使うスキル / スクリプトは終了時に必ず daemon 停止 + Chrome タブクローズすること。

`browser-use ... close` は page を閉じるだけで `browser_use.skill_cli.daemon` を止めない。さらに `--profile "Profile 1"` で起動した場合は **ユーザーの実 Chrome 内にタブを開く** ため daemon kill 後もタブが残る（2026-04-25 検証で daemon 6 個 + note タブ 5 個残存）。

## bash スクリプトでの必須 trap（3段すべて）

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

Node.js orchestrator では `process.on('exit')` 等で同等処理を spawn する。

## 対象スキル

`publish-note` / `fetch-note-metrics` / `post-instagram` / `post-x` / `post-tiktok` / `post-youtube` 等 browser-use 系全般。

AppleScript の URL 条件は対象サイトに合わせて調整（note 系: `editor.note.com` `note.com/sitesettings` `note.com/login`）。
