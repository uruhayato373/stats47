---
type: handoff
date: 2026-07-18
topic: site-navigation-graph-phase0
status: ready
---

# サイト回遊グラフ Phase 0 ハンドオフ

## 状態

2026-07-18のオーナー明示指示により、`KAIYU-HUB-01`のT3/T2ゲート待ちは解除済み。Phase 0のread-only監査を開始できる。
全Phase一括実装ではなく、Phase 0の結果を確認してからPhase 1へ進む。

## 目的

blog、ranking、theme、area、surveyの既存内部linkをread-only監査し、共通content graph Phase 1の範囲を確定する。

## 正典

- `docs/02_実装計画/35_サイト回遊グラフ・レコメンド基盤仕様.md`
- `docs/01_技術設計/07_情報設計.md`
- `docs/01_技術設計/12_完全DBレス設計.md`
- `docs/01_技術設計/15_デザインシステムSSOT.md`
- `docs/04_レビュー/2026-07-18-sitewide-content-layout-benchmark.md`
- `.claude/rules/evidence-based-judgment.md`

## Phase 0

1. source type別に候補生成、選定、表示、計測、fallbackをinventoryする。
2. 同一destination重複、410/noindex、tag断線、未計装を列挙する。
3. 既存tag/category/theme/survey/area/correlationをnode/edgeへ写像する。
4. Phase 1をpure types/score/selector/validator/synthetic fixtureへ絞る。

## 禁止

- コード、docs、state、R2の変更。
- runtime LLM、閲覧profile、永続D1。
- browser、deploy、外部write。

## 完了ゲート

- `TAG-410`の解決方針確定。
- GA4 internal navigation event/custom dimensionsの現状確認。
- Phase 1の最小file/test承認。

## working tree

既存未コミット変更を所有・上書き・一括commitしない。同一worktreeでClaude/Codexを同時実行しない。

## 検証状態

- 文書のみ。コード、type-check、test、build、GA4、R2、localhostは未実行。
- `git diff --check`: PASS（2026-07-18、文書更新後）。
