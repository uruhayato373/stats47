---
type: session-handoff
date: 2026-06-08
status: completed
tags: [blog, tone, publish, factual, cron, quality-gate]
---

# セッションハンドオフ 2026-06-08 — ブログ文体ですます統一 + 未公開ドラフト全公開 + cron捏造の発覚

## 何をやったか (成果)

1. **ブログ品質是正 (前半)**: 是正キュー must-fix 高流入記事を 3 バッチ計 9 記事ブラッシュアップ・公開
   (BLOG-WAVE-2026-06-07-manual / -manual-2 / -manual-3)。表→SVG、archetype 宣言、blog-critic PASS。
2. **文体 ですます調 の統一を仕組み化** (BLOG-TONE-01):
   - `quality-gate.mjs` に **である調 copula 文末** (である。/だ。/だった。/ではない。/だろう。/のだ。) の blocker を追加
     (callout・引用・見出し・表は除外)。pre-commit + publish-blog.yml で enforce。
   - `blog-quality-standards.md`「文体」セクション、`article-writer.md` Phase 3、`blog-critic.md` 審査項目、
     `blog-review/SKILL.md` proofread、`brushup-blog/SKILL.md` Step3 focus にルールを横展開。
   - 既に である調 だった公開済み 5 記事 (automotive/consumer-price/curry/doctor/marriage) を変換・再公開 (本番 dearu=0)。
3. **未公開ドラフト 11 本を公開** (BLOG-PUBLISH-DRAFTS-01): 10 cron ドラフト + koumuin。全 11 本 本番200。

## ★最重要の発覚: 週次自動生成 cron がデータを捏造する

- `feat(blog): 週次自動生成 10本` (commit 523c577c, 2026-06-07, Claude セッション生成) のドラフト 10 本が
  **全て順位・数値を hallucination** していた (例: green-tea「奈良2位」/ paved-road「東京46位の逆説」/ sushi「北陸3県独占」は全て虚偽)。
- **根因**: `fetch-article-data.mjs` がローカル D1 依存で **cloud/headless では空振り** → data/*.json が無い →
  `quality-gate.mjs` / factual-check は ground truth 0 で **rank 検証を skip** → AI 捏造が素通りでドラフト化。
- **対応**:
  - 公開 11 本は R2 実データ (`app/ranking/<key>/values.json`) を ground truth に全 factual 修正してから公開。
  - `quality-gate.mjs` を **fail-closed 化**: rank 主張 (≥2件) があるのに data/*.json が無い記事は「検証不能」blocker
    (audit-published-blog は独自実装なので queue には誤爆しない / publish 時は data 在席のため正規記事は通る)。
  - `fetch-article-data/SKILL.md` に cloud 非対応 + R2 fallback を明記。

## 今後の注意 (次セッションへ)

- **cron 自動生成ドラフトを無検証で公開しない**。必ず R2 実データと factual 突合 (fail-closed gate が止めるが、
  内容の真正性は人/critic が確認)。理想は cron 側 (生成セッション) が R2 から data を引いて factual-check を通すこと。
- **docs/21 削除は slug 名指しで** (`rm -r docs/21/` 全削除は cron 未公開ドラフトを巻き込む。2026-06-08 に一度誤削除→復元)。
- **既存の である調記事** (約250本中の該当分) は gate により是正キューに自動浮上 → 今後のバッチで順次 ですます 化。
- 効果計測: 4 週後 (2026-07-05/06) に GSC で BLOG-WAVE-* / BLOG-TONE-01 / BLOG-PUBLISH-DRAFTS-01 を判定。

## 関連

- 改善ログ: `docs/02_実装計画/improvement-backlog.md` (BLOG-WAVE-2026-06-07-manual{,-2,-3} / BLOG-TONE-01 / BLOG-PUBLISH-DRAFTS-01)
- メモリ: `project_blog_brushup_dbless_scaffold` (cron捏造・文体enforcement・docs/21削除・perl事故・R2 scaffold手順)
- 是正ループ正典: `docs/02_実装計画/blog-remediation-loop.md` / 品質基準: `.claude/rules/blog-quality-standards.md`
