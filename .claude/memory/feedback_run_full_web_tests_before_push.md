---
name: feedback_run_full_web_tests_before_push
description: web の部品・route を変えたとき、別ブランチを取り込んだときは、触れた workspace の vitest 全件を push 前に回す。部分実行で既存テストを見落として CI を赤にした (2026-10-21 web・2026-10-25 admin)
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3c7e2bb-de58-44a0-94f7-7f3ab787b91e
  modified: 2026-10-21T02:50:12.829Z
---

apps/web の部品 (例 `RankedKpiGrid`) の表記や route の依存 (例 ダウンロード route が `readRankingItemFromR2` を呼ぶ) を変えたら、変更したディレクトリのテストだけでなく `cd apps/web && npx vitest run` で全件を回してから push する。

**Why:** 2026-10-21、変更した部品・route のテストだけ回して push し、別ディレクトリにある既存テスト (`src/__tests__/download-indexing.test.ts` の vi.mock に新しい関数が無い、`RankedKpiGrid.test.tsx` が旧表記を期待) が develop-quality-gate の Unit Tests (web) で落ちた。全件でも 1〜2 分で終わる。

**How to apply:** 表記・関数の呼び出しを変えたら、旧表記の文字列や mock 対象の import 元 (`@stats47/ranking/server` 等) を `grep -rn` で探し、最後に全件を回す。このマシンでは `eslint-dependency-compatibility.test.ts` の 1 件が環境由来で落ちる (CI では通る) ので、それ以外が 0 件かで判断する。関連: [[develop-had-no-ci-gate]]

**別ブランチの取り込みも同じ (2026-10-25)**: Codex の 68 コミットを develop へマージしたとき、変更ファイルが見えた admin の content-operations テスト 1 本だけを回して push し、admin の別テスト 2 件 (content route の fixture に新しい必須台帳 `data/note/cover-assets.json` が無い / M1 note の本文件数の期待値) が main 行き PR の Unit Tests で落ちた。取り込みの後は `git diff --name-only` に現れた workspace (apps/admin・packages/* 等) ごとに vitest を全件回す。
