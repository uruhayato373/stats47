---
name: project_redesign_bundle
description: Claude Design リデザイン案11ページ×4案の取り込み・管理・順次実装の進捗
metadata: 
  node_type: memory
  type: project
  originSessionId: 34bf9d1e-cb24-4725-b8d0-920f69f882ea
---

Claude Design (claude.ai/design) でモックした 11 ページ × 各 4 案のリデザイン案を `.claude/design-system/redesign/` に取り込み済み（バンドル元: `~/Downloads/stats47-ranking-handoff (13).zip`、2026-05-22）。

- **真実源**: `.claude/design-system/redesign/INDEX.md`（11ページのステータス・採用案・PR）。プロトタイプ本体は `redesign/project/`。
- **実装スキル**: `/apply-redesign <page>` — 4案レビュー→推奨→pixel-perfect実装→INDEX更新。`.claude/skills/ui/apply-redesign/SKILL.md`。
- 4案はおおむね A=低リスク整理 / B=構造強化 / C=パワーユーザー最適化 / D=収益最大化。
- **ranking ページ**: 採用案 = **D**（暗色ヒーロー＋ネイティブ収益）。Phase1（ヒーロー/単位ピル/CSV CTA/CSV訴求カード/AI考察カード、データ非依存UI）実装済み・型チェック+build通過・SSG維持。Phase2（カテゴリ別アフィリエイトrow、既存 `resolveAffiliateBanners` 利用）未着手。未コミット。
- D の制約調整: 県別特産品DBなし→カテゴリ別アフィリエイトバナーで代替 / JSON・Excel エクスポート未実装→CSVのみ / メルマガ機能なし→サイドバーのメルマガカード省略。
- 残り10ページ（home/area/category/compare/theme/themes-index/survey/search/blog/tag）は未着手。
