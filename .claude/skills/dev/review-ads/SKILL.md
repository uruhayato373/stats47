---
name: review-ads
description: ads ドメインのコードレビュー（収益最適化・法務・広告計測の専門パネリスト付き）。Use when user says "広告レビュー", "review-ads", "ads レビュー". review-feature ads のショートカット.
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

出力先: GitHub Issue（`dev-review` ラベル、タイトル `[Dev Review] feature:ads / YYYY-MM-DD`）。

```bash
# 本文を /tmp/review-ads-body.md に書き出し後:
gh issue create \
  --title "[Dev Review] feature:ads / YYYY-MM-DD" \
  --label "dev-review" \
  --body-file /tmp/review-ads-body.md
```

過去のレビューは `gh issue list --label dev-review --state all` で参照できる。
