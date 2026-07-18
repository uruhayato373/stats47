---
type: handoff
date: 2026-07-18
topic: site-content-layout-phase0
status: ready
---

# サイト横断コンテンツ配置 Phase 0 ハンドオフ

## 目的

Header、blog、ranking、right rail、OGP、thumbnail、link cardの実装前visual inventoryを行い、P0を小変更へ分割する。

## 正典

- `docs/04_レビュー/2026-07-18-sitewide-content-layout-benchmark.md`
- `docs/04_レビュー/2026-07-18-sitewide-image-ux-audit.md`
- `docs/01_技術設計/07_情報設計.md`
- `docs/01_技術設計/13_統一レイアウト設計.md`
- `docs/01_技術設計/15_デザインシステムSSOT.md`
- `.claude/rules/ui-components.md`
- `.claude/rules/ogp-image-standards.md`
- `.claude/rules/evidence-based-judgment.md`

## Phase 0

1. `git status`を確認し、既存変更を所有・上書きしない。
2. 主要12 URLをmobile/desktop/light/darkでlocalhost確認する。
3. component、asset、fallback、analytics、rail順、metadataをinventoryする。
4. GA4/GSC/PSIの既存baselineをread-onlyで確認する。
5. P0をheader IA、card fallback、mobile rail、metadata整合へ分割する。

## 禁止

- コード、画像、docs、stateの変更。
- 外部デザイン/画像/CSSのコピー。
- 画像生成、R2 write、deploy。
- 推計trafficや未計測効果の断定。

## 完了ゲート

- 現状screenshotとcomponent mapが揃う。
- 各P0に成功指標、影響file、test、performance guardrailがある。
- home heroとdesign SSOTの扱いが明示される。
- Phase 1以降を開始しない。

## working tree

未コミット変更が多数あるため、一括commit・削除・無関係な整形をしない。同時にClaude/Codexを同じworktreeで走らせない。

## 検証状態

- 文書のみ。localhost、GA4、GSC、PSI、type-check、test、buildは未実行。
- `git diff --check`: PASS（2026-07-18、文書更新後）。
