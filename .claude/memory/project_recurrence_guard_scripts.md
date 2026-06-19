---
name: 再発防止 guard スクリプト一覧
description: stats47 プロジェクトの過去事故由来 guard スクリプト群。新規スキル / refactor / デプロイ時に参照する
type: project
originSessionId: dfec608a-a637-4fdf-b949-56d68f37fcb8
---
過去に発生した事故の再発を機械的に防ぐため、`.claude/scripts/lib/check-*.cjs` に guard スクリプトを置いている。`/deploy` Step 2 で自動実行されるほか、関連スキルからも個別に呼ばれる。

**Why**: SKILL.md の手順や CLAUDE.md の規約だけでは Sonnet/Opus がうっかり破るリスクが残る。検出可能なパターンは exit 1 で止める方が確実。

## 現在のスクリプト

| スクリプト | 検出対象 | 由来 (knowledge エントリ) | 呼び出し元 |
|---|---|---|---|
| `check-cover-overlap.cjs` (note配下) | note 記事 cover SVG の CJK テキスト bbox 重なり | 「note 記事 cover SVG で大きな数字テキストがリード文と重なる」(2026-04-18) | `edit-note-draft` 品質チェックリスト |
| `check-analytics-tag-strategy.cjs` | `GoogleAnalytics.tsx` の `<Script strategy="lazyOnload">` 混入 | 「GA4 の Script strategy を lazyOnload にすると PV が約 1/10 に収縮する」(2026-04-18) | `/deploy` Step 2 |
| `check-skill-required-sections.cjs` | 重要 SKILL.md からの platform セクション欠落 | 「SKILL.md からセクションを削除すると静かに機能が消える」(2026-04-18) | `/deploy` Step 2 |
| `check-ga-bot-anomalies.cjs` | GA4 pages.csv の bot 疑い行 (pv/user≥20 or avgDur≥600s) を `pages_suspicious.csv` に隔離 | 「GA4 の既知 bot フィルタは IAB リスト依存で独自スクレイパーを捕まえない」(2026-04-18) | `ga4-improvement` mode=observe |
| `check-youtube-post-budget.cjs` | `.claude/state/youtube-pause.json` が未来なら exit 1、週 YouTube 投稿 ≥3 なら exit 1 | 「2026-03-24 以降の YouTube シャドウバン、2026-04-24 の復帰対応 (#88)」 | `/publish-youtube-normal`, `/post-youtube`, `.claude/scripts/youtube/upload.js` main 先頭 |
| `check-yearcode-format.cjs` | 同一 statsDataId 内で `ranking_items.latest_year.yearCode` の桁数が混在したら exit 1 | 「Phase 1 で漁業 11 件を 11 桁形式 (`"2023100000"`) で投入し、同 statsDataId の他指標 (4 桁) と不整合 → `/themes/fishery-marine` の map が silent failure (2026-04-26)」 | `/deploy` Step 2、`/register-ranking` Phase 6 |
| `check-published-drafts.cjs` | docs/21_ブログ記事原稿/<slug> が存在し公開 SSOT `.local/r2/app/blog/<slug>/article.md` も存在 = 公開済み下書きの取り残しを exit 1（SSD 非接続時は skip） | 「publish-article 手順6（公開後の下書き削除）の skip で公開済み 6 件が docs/21 に残存し live(R2) と drift・退行リスク (2026-05-30)」 | `/deploy` Step 2、`/publish-article` 手順6 |

## 配置場所

- 共有 (複数スキルから呼ぶ): `.claude/scripts/lib/check-*.cjs`
- スキル固有: `.claude/scripts/<domain>/check-*.cjs` (例: `.claude/scripts/note/check-cover-overlap.cjs`)

## How to apply

- 新しい事故が起きたら: (1) `/knowledge` に問題・原因・対策を記録 (2) 検出可能なら guard スクリプトを追加 (3) `/deploy` Step 2 や対象スキルから呼ばれるよう導線を整える
- guard が exit 1 で失敗したら: 修正してから再実行。デプロイ判断としては `/knowledge` の関連エントリを必ず参照
- 新スキル / refactor を書くときは、対象エリアの guard が存在するか先に確認する (本ファイルが索引)
