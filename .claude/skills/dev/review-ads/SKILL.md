---
name: review-ads
description: ads ドメイン（アフィリエイト・広告・収益化）のコードレビュー。収益最適化・法務コンプライアンス・広告計測の専門パネリスト付き。
disable-model-invocation: true
---

ads ドメイン（`apps/web/src/features/ads/`）を専門家パネルでレビューする。
`/review-feature ads` のショートカット。

## 手順

`.claude/skills/dev/review-feature/SKILL.md` の手順に従って実行する。

- 対象: `apps/web/src/features/ads/`
- 汎用パネリスト: review-feature の SKILL.md に定義された6人
- ドメイン固有パネリスト: `.claude/skills/dev/review-feature/reference/domains/ads.md` に定義された3人（収益最適化・法務コンプライアンス・広告計測）
- 追加引数（`$ARGUMENTS`）があればレビューの焦点として考慮する

保存先: `docs/03_レビュー/critical/feature_ads_レビュー.md`
