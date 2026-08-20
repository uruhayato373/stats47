---
name: audit-survey-linkage
description: ranking ↔ 統計調査 (survey) 紐付けの決定的監査と是正。解決済/未分類/orphan survey/不正オーバーライドを実測し、辞書追記で未分類を回収する。Use when user says "調査紐付け監査", "survey 監査", "audit-survey-linkage", "調査の整理", "未分類ランキングの回収"。
primary_agent: survey-curator
---

ranking↔survey 紐付けの監査・是正スキル。**正典: `.Codex/rules/survey-linkage-standards.md`**
(SSOT 構造・導出優先順位・編集フロー・禁止事項)。

**本スキルは導出ロジックを書かない。** 監査スクリプトは本番生成 (`generate-ranking-items.ts`) と
**同一の導出コード** (`resolveSurveyLinkage`) を共有しており、監査結果 = 配信結果が保証される。

## いつ実行するか

- 新 metric 追加後 (data-ingester の量産フロー後)
- surveys.json / 導出辞書を編集した後
- 四半期の定期棚卸し

## 手順

### Step 1: 監査

```bash
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts               # 人間向けテーブル
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --json        # 機械向け
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --unresolved  # 未分類の全キー列挙
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --compare-r2  # R2 焼き込み突合 (live item.json vs git 導出。--sample N で間引き)
```

レポート: 解決済/未分類 (内訳: ssds-synthetic-only / estat-uncovered / external / calculated) /
辞書未カバー statsDataId 一覧 / orphan survey / config.surveyId 不正 / survey 別件数
(**perSurvey = 総数、perSurveyActive = isActive のみ = 配信されるべき数**)。

> **active/total を混同しない** (正典 §監査の 2 層): R2 all.json は active のみ配信するため、
> 全在庫が未公開の調査 (inactive-only) が R2 に無いのは正常。stale (r2-drift) と誤診して
> sync・公開を要求しない。焼き込みの実測は `--compare-r2` (月次ポートフォリオ監査で実行)。

### Step 2: 是正 (survey-curator の責務)

| 症状 | 是正 |
|---|---|
| `estat-uncovered` (辞書未カバー) | e-Stat で statsDataId の調査名を確認 → `packages/data-configs/src/ssds/estat-provenance.generated.json` の `statsDataIdToSurvey` に追記 (出典 URL+日付必須) |
| `ssds-synthetic-only` (原典がマスタ未登録) | 頻度が高ければ surveys.json に実調査を正式登録 + `ssds-provenance` 辞書側の名前と一致させる。低頻度テールは未分類のまま可 |
| orphan survey | surveys.json から物理削除 (git 履歴で復活可) |
| config.surveyId 不正 | 該当 metric TS を修正 (`validate:config` の survey-id lint でも検知) |
| `external` / `calculated-unresolved` | 原則未分類のまま (偽の調査を作らない)。必要なら config.surveyId で個別オーバーライド |

### Step 3: 検証 + R2 反映

```bash
npm run validate:config --workspace=@stats47/data-configs   # surveyId 実在 lint
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts # 再監査 (回収件数を実測)
```

R2 反映は **`generate-ranking-items` → `export-master-snapshots` の順序厳守** (正典 §4)。
CI: `gh workflow run sync-snapshots.yml -f only=ranking-items` → 完了後 `-f only=master`。
本番デプロイを伴う場合はまとめて 1 回・ユーザー確認 (デプロイ規律)。

## 規約

- カバレッジ数値は**必ず監査スクリプトの実測値**を使う (推測で書かない)
- 未分類に偽の調査を割り当てない (誤分類より非表示が良い)
- 編集対象は surveys.json / estat-provenance辞書 / metric TS の surveyId のみ (File Boundary は agent 定義)

## 参照

- 正典: `.Codex/rules/survey-linkage-standards.md`
- 監査スクリプト: `packages/ranking/src/scripts/audit-survey-linkage.ts`
- agent: `.Codex/agents/survey-curator.md`
- **役割分離**: 本スキル = 紐付け層の監査・是正の実行エンジン。監査結果を台帳化し需要・編集品質と
  合わせて評価する層は `/manage-survey-portfolio` (`.Codex/state/surveys/portfolio.json` へ転記。
  紐付けロジック・是正手順は本スキルにのみ置き、そちらへ再定義しない)
