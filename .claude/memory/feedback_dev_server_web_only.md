---
name: feedback_dev_server_web_only
description: dev サーバー起動はルート npm run dev (turbo 23 パッケージ) を使わず web 単体 (npm run dev:web)。常駐プロセスは background 起動 + Ready polling
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4e1bea9e-bf94-448f-9899-14c1d278b244
---

ローカルで Web サイトの動作確認をするときの dev サーバー起動規約。

**ルート `npm run dev`（= `turbo run dev`）を使わない。** 23 パッケージすべての dev を起動し、出力が混ざって `Ready` を検出しづらく、port 3000 を listen する前に体感で固まる。web 単体なら `✓ Ready in 2s`。

```bash
npm run dev:web                    # = turbo run dev --filter=web (推奨)
npm run dev --workspace=apps/web   # turbo を介さず最速
```

**Why:** 2026-06-20、テーマページ修正の確認で `npm run dev`(turbo) を起動し、起動待ちのタイムアウト・前面 sleep のブロックで「起動しない／キャッシュ問題か」と時間を浪費した。実際は web 単体起動なら 2 秒で立ち上がる。

**How to apply:**
- エージェントが dev を起動するときは `run_in_background: true` + 出力ファイルを polling して `✓ Ready` を確認する。前面 `sleep` の固定待ちは禁止（そもそもブロックされる）。
- 表示が更新されないときは「キャッシュ」を疑う前に、まず dev が listen しているか確認する（`lsof -i :3000` / `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`）。
- 正典は `.claude/rules/local-environment.md` の「dev サーバー起動」節。root に `dev:web` スクリプトを追加済み (2026-06-20)。
