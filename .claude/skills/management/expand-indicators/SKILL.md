---
name: expand-indicators
description: |
  .claude/todo/backlog.md の検証済み候補を、git TS config → e-Stat → R2 の
  完全DBレス経路で少数ずつ追加する。Use when user says "指標追加", "indicator 拡充",
  "/expand-indicators".
argument-hint: "--target <N> [--priority high|medium] [--dry-run]"
primary_agent: data-ingester
---

# expand-indicators — 検証済み指標の追加

`.claude/todo/backlog.md` の表から候補を選び、一次統計を再確認してから
`packages/data-configs/src/metrics/*.ts` に追加する。観測値の経路は
**git TS config → e-Stat → R2**。永続・リモート D1 は使わない。

大量展開は `/expand-rankings` の計測ゲート付きキューに任せ、本スキルは人が検証した
最大20件の候補だけを扱う。

## 引数

| 引数 | デフォルト | 説明 |
|---|---|---|
| `--target <N>` | `10` | 今回扱う件数。最大20件 |
| `--priority <p>` | `high` | `high` または `medium` |
| `--dry-run` | false | 調査と変更案だけを出し、ファイル・R2を変更しない |

## 必読

- `.claude/rules/metric-config-standards.md`
- `.claude/rules/estat-api.md`
- `.claude/rules/data-provenance-standards.md`
- `.claude/rules/r2-storage-design.md`
- `.claude/rules/branch-workflow.md`

## 実行手順

### 1. 候補を抽出する

```bash
node .claude/scripts/management/parse-backlog.cjs \
  --backlog .claude/todo/backlog.md \
  --priority high \
  --status pending \
  --limit 10
```

引数に応じて priority と limit を変える。候補が0件なら終了する。

### 2. 書く前に一次統計を再確認する

候補ごとに次を確認する。1項目でも未確定なら config を作らず、調査キューへ戻す。

- `candidate_slug` と既存 metric key、正規化後 title が重複しない
- `statsDataId`、都道府県軸、分類コード、年、単位がメタ情報と一致する
- 代表3県の値をAPI原値と照合できる
- 47都道府県比較として欠測・秘匿・特殊地域軸を説明できる
- provenance が `.claude/rules/data-provenance-standards.md` を満たす

調査用のrecipeや応答は `/tmp/expand-indicators/` に置く。

### 3. TS config を作る

近い既存configを読み、同じ構造で
`packages/data-configs/src/metrics/<candidate_slug>.ts` を作る。

- `years` は4桁年だけを使う
- `category` は既存の17軸から選ぶ
- `title`、`subtitle`、`note`、`description` の責務を混ぜない
- `isActive: true` は公開を意味しない。公開工程は `/publish-ranking` が担う

### 4. 決定的検証を行う

```bash
npm run build:registry --workspace=packages/data-configs
npm run validate:years --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npx tsx packages/data-configs/scripts/page-data-batch.ts --metric <key> --dry-run
```

対象packageの型チェックやテストがある場合は併せて実行する。全件バッチは起動しない。

### 5. 観測値と公開を分離する

- R2への書き込みは外部状態変更なので、ユーザーの明示承認後に
  `page-data-batch.ts --metric <key>` を1件ずつ実行する。
- ランキングitem、values、KNOWN、sitemap、本番200確認は `/publish-ranking <key>` に渡す。
- デプロイは複数件をまとめ、別途ユーザー承認を得る。

### 6. TODOを閉じる

- config・R2・公開確認まで完了した候補行は `.claude/todo/backlog.md` から削除する。
- 取得不能、重複、価値不足が確定した候補も削除する。理由はGit差分または必要に応じて
  失敗履歴はGitに委ね、再開可能な未完了手順だけをTODOへ残す。
- 効果測定が必要な公開施策だけ `.claude/todo/improvements.md` に追加する。
  単なる投入履歴は追加しない。
- frontmatter の件数と `updated` を更新する。

## 禁止

- 削除済み `stats_prefecture` を使う `ingest-indicator.mjs`
- 永続・リモートD1をSSOTまたは観測値保存先にすること
- 未検証IDの投入、候補全件の一括処理、失敗時の推測補正
- TODO行を `done` / `failed` 履歴として残すこと
- 承認なしのR2書き込み、PRマージ、デプロイ

## 完了報告

次を簡潔に報告する。

- 対象keyと一次統計
- config追加数、見送り数と理由
- 実行した検証と結果
- R2・公開・デプロイの実行有無
- `backlog.md` の残件数

## 関連

- 候補: [`.claude/todo/backlog.md`](../../../../.claude/todo/backlog.md)
- パーサ: [`.claude/scripts/management/parse-backlog.cjs`](../../../scripts/management/parse-backlog.cjs)
- 観測値投入: [`/page-data-batch`](../../db/page-data-batch/SKILL.md)
- 公開: [`/publish-ranking`](../../db/publish-ranking/SKILL.md)
- 大量候補の計測ゲート: [`/expand-rankings`](../expand-rankings/SKILL.md)
