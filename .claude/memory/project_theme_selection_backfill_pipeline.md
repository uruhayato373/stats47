---
name: project_theme_selection_backfill_pipeline
description: ThemeCatalog selection の夜間 backfill (THEME-SELECTION-BACKFILL-01)。モデルは JSON を返すだけ・決定的 gate が書く。expanded.ts 由来は selection-evidence.ts。headless claude はこのMacのセッション内でも認証できた
metadata: 
  node_type: memory
  type: project
  originSessionId: 5d91c2c7-fe14-4d68-8912-1087beb736d4
  modified: 2026-09-16T11:42:29.687Z
---

ThemeCatalog の選定根拠 (selection) 540 件を一次資料で埋める夜間バッチを 2026-09-16 に実装 (skill `/backfill-theme-selection`、driver `.claude/scripts/themes/run-selection-backfill.sh`、正典 `.claude/rules/theme-catalog-standards.md` §4「置き場」「機械検査」)。

**Why:**
- 55 テーマ中 31 テーマ + 既存テーマ拡張 67 章は `expanded.ts` の tuple 定義で per-metric の selection 欄が無い。inline に書けないので `selection-evidence.ts` (JSON 形式 TS・writer が丸ごと再生成) を置き場にした。writer は「`<theme>.ts` に rankingKey があるか」で inline patch / evidence file を機械判定する
- 2026-09-16 の Agent tool 経路 (aging-society) で researcher が統計指標コードを 7 件中 2 件誤記した → モデルにファイルを触らせず JSON を返させ、gate (引用の逐語照合・https 到達・定型文・cdCat01 一致・基準語彙) を通った分だけ書く設計に変えた
- `adoptionCriteria` あり = 「一次資料で裏付けた」の主張。proposedBy が内部監査名 (「全テーマ構成監査」) のまま criteria が付いた 3 件は主張として不成立なので外した (定型文で埋めるより未記入が正しい)

**How to apply:**
- headless `claude -p` は **このMacの Claude Code セッション内でも Keychain 認証が通った** (2026-09-16 実測。ai-content の「セッション内は Not logged in」メモは環境依存)。パイロットはセッションから直接回せる。`--tools "WebFetch,WebSearch" --allowedTools ...` + `--json-schema` + cwd を repo 外にする
- PDF 出典が多い (白書・調査結果)。`pdftotext` (poppler) があれば逐語照合、無ければ `skipped-pdf` で到達性のみ。Windows PC で回すなら poppler を入れる
- 実測: 1 テーマ 2 指標で 15 turns・128K tokens・$0.69 (API 換算)。Agent tool 経路の 285K tokens より軽い
- ratchet は既存 `check-quality-warning-ratchet.cjs` (`quality-warning-baseline.json` の `theme-catalog:no-adoption-criteria`) を使い、driver が減少専用で縮める。`develop-quality-gate.yml` にも配線済み
- 関連: [[project_ai_content_headless_claude_batch]] (headless CLI の型)、[[feedback_theme_indicator_research_pattern]]
