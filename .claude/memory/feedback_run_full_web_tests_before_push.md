---
name: feedback_run_full_web_tests_before_push
description: web の部品や route を変えたら、対象ディレクトリだけでなく apps/web の vitest 全件を push 前に回す。2026-10-21 に部分実行で 2 件の既存テストを見落とし develop の Unit Tests (web) を赤にした
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3c7e2bb-de58-44a0-94f7-7f3ab787b91e
  modified: 2026-10-21T02:50:12.829Z
---

apps/web の部品 (例 `RankedKpiGrid`) の表記や route の依存 (例 ダウンロード route が `readRankingItemFromR2` を呼ぶ) を変えたら、変更したディレクトリのテストだけでなく `cd apps/web && npx vitest run` で全件を回してから push する。

**Why:** 2026-10-21、変更した部品・route のテストだけ回して push し、別ディレクトリにある既存テスト (`src/__tests__/download-indexing.test.ts` の vi.mock に新しい関数が無い、`RankedKpiGrid.test.tsx` が旧表記を期待) が develop-quality-gate の Unit Tests (web) で落ちた。全件でも 1〜2 分で終わる。

**How to apply:** 表記・関数の呼び出しを変えたら、旧表記の文字列や mock 対象の import 元 (`@stats47/ranking/server` 等) を `grep -rn` で探し、最後に全件を回す。このマシンでは `eslint-dependency-compatibility.test.ts` の 1 件が環境由来で落ちる (CI では通る) ので、それ以外が 0 件かで判断する。関連: [[develop-had-no-ci-gate]]
