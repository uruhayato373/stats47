---
type: session-handoff
date: 2026-07-11
status: active
tags: [survey, census, seo, claude-code]
---

# survey別コンテンツクラスター実装の引き継ぎ

## 最初に読むもの

1. `.claude/rules/survey-content-standards.md` — 編集文法・ハブ構成・SSOT・横展開 (旧 doc 20 を統合)
2. `docs/04_レビュー/2026-07-11-survey-census-cluster-audit.md` — 監査・実装・検証結果
3. `docs/04_レビュー/2026-07-11-survey-portfolio-audit.md` — 全surveyの実測優先順位
4. `docs/04_レビュー/2026-07-11-survey-wage-structure-audit.md` — 次候補の在庫・論点監査
5. `.claude/rules/survey-linkage-standards.md` — ranking↔survey紐付けの禁止境界

## 現在地

国勢調査 `census` の初回実証はローカル実装済み。`/survey/census` に次を追加した。

- この調査で分かること
- 実在するrankingへ移動する自然文の問い5件
- 母数、5年周期、因果解釈に関する注意
- census固有のmetadata description
- 未定義surveyを現行UIへ戻すフォールバック

対応する既存ブログ記事は確認できなかったため、薄い記事は新規作成していない。

戦略・全surveyポートフォリオ・census・次候補の賃金構造基本統計について、実装前監査は完了している。
追加の企画監査は行わず、Claude Codeはローカル検証と実装判断から再開する。

## 変更ファイル

- `apps/web/src/app/survey/[surveyKey]/page.tsx`
- `apps/web/src/features/survey/survey-editorial.ts`
- `apps/web/src/features/survey/survey-editorial.test.ts`
- `apps/web/src/features/survey/index.ts`
- `.claude/rules/survey-content-standards.md` (旧 doc 20)
- `docs/04_レビュー/2026-07-11-survey-census-cluster-audit.md`
- `docs/02_実装計画/00_INDEX.md`
- `docs/todo/02_機能バックログ.md`

## 検証状態

- `npx vitest run apps/web/src/features/survey/survey-editorial.test.ts`: 2 tests passed
- `npm run type-check --workspace apps/web`: passed
- `git diff --check`: passed
- full build: 未実行（対象テスト＋type-checkを優先）
- design-system check: 今回と無関係な既存 `apps/web/src/app/page.tsx` の2違反で失敗
- lint: ESLint 9直接実行では設定入口を検出できず未検証
- 本番表示: 未検証（未デプロイ）

## 次にやること

1. **既存のdirty worktreeを先に確認する。** 別作業の変更を混ぜない。
2. `/survey/census` をlocalhostで目視確認する。特にモバイル、セクション番号、5リンク、他surveyのフォールバック。
3. 必要ならフルbuildを実行する。今回と無関係な失敗は分離して報告する。
4. ownerの明示承認後に、他変更とまとめて1回だけデプロイする。
5. census baseline（W27直近28日: 23 impressions / 0 clicks / CTR 0% / position 25.43）とpage filter付きqueryは記録済み。
6. 4〜8週後にCTR、clicks、順位、survey→ranking遷移を判定する。
7. `wage-structure-survey` の個別監査は完了済み。横展開実装はcensusの本番確認後に判断する。

賃金構造基本統計の事前監査は完了済み。実装受入条件、既存記事との重複、代表5rankingは
`docs/04_レビュー/2026-07-11-survey-wage-structure-audit.md` を正典とする。

## 変更してはいけない境界

- ranking↔surveyの解決を別実装しない。既存 `resolveSurveyLinkage` に一本化する。
- R2 `app/survey/*` やitem snapshotを手編集しない。
- 75 surveyの一括AI長文化、47県別の薄い記事生成をしない。
- 永続D1を追加しない。編集情報はgit TS、観測・配信はR2を維持する。
- ユーザーの承認なしに本番デプロイしない。

## Claude Codeへの再開プロンプト

```text
docs/handoffs/2026-07-11-survey-content-cluster.md を読み、そこから参照される戦略・監査・survey linkage規約を確認してください。
既存のdirty worktreeを保護したうえで、国勢調査クラスター実装のローカル目視確認と未実行検証を行ってください。
新しいsurveyやブログ記事へスコープを広げず、未検証事項とデプロイ可否を報告してください。
本番デプロイはownerの明示承認を得るまで実行しないでください。
```

## ハンドオフの終了条件

本番反映と初回baseline記録が完了したら、残る4〜8週後の効果測定を改善バックログへ抽出し、
このハンドオフを削除する。
