---
name: manage-survey-portfolio
description: 75 survey のポートフォリオを評価・更新する。surveys.json × 紐付け監査 × R2 all.json × survey-editorial.ts × GSC/GA4 snapshot を突合して .Codex/state/surveys/portfolio.json を再構築し、編集ハブ化候補の選別・lifecycle 判定・実験の baseline/効果測定を管理する。survey-curator が実行。Use when user says "surveyポートフォリオ", "survey棚卸し", "survey評価", "manage-survey-portfolio".
allowed-tools: Read, Grep, Glob, Bash
primary_agent: survey-curator
---

# manage-survey-portfolio

survey ポートフォリオ (`.Codex/state/surveys/`) の継続評価サイクルを回す。
運用設計の正典: `.Codex/skills/survey/manage-survey-portfolio/reference/surveyポートフォリオ運用.md`。
schema・判定規律の正典: `.Codex/state/surveys/README.md`。

> **役割分離 (`/audit-survey-linkage` と重複しない)**: **紐付け層** (未分類回収・辞書追記・orphan
> 物理削除・config.surveyId 是正) は従来どおり `/audit-survey-linkage` が実行エンジン。本スキルは
> その監査結果を**転記して台帳化し、需要・編集品質と合わせて判定する層**。紐付けの導出ロジック・
> 是正手順をここに再定義しない。

## モード

| mode | 内容 |
|---|---|
| `audit` (既定) | portfolio.json を surveys.json + 紐付け監査 + R2 all.json + survey-editorial.ts + レビュー文書と突合して再構築 → validator → 差分レポート |
| `evaluate` | lifecycle / editorial 判定の見直し (56d 実測ベース)。判定変更は根拠つきで `--set` 経由 |
| `experiment` | 実験の登録 (baseline 必須・`--add-experiment`) / 期日到達分の d7/d28/d56 判定 (`evaluate-survey-experiments.mjs`) |
| `handoff` | 改善候補を improvement-triage へ引き渡し (agent 定義 §引き渡し形式) |

## コマンド (PR-4 で確定)

```bash
# ★継続監査の入口 (月次推奨・四半期必須): build → aggregate → validate → 実験期日 → drift
bash .Codex/scripts/surveys/run-survey-portfolio-audit.sh

# 個別実行
npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts        # 機械項目の再導出 (upsert)
npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts --set <surveyId> --lifecycle <status> --add-evidence <ref>
npx tsx .Codex/scripts/surveys/aggregate-survey-metrics.ts      # 56d 実測 (非重複 2 窓合算)
npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts --add-experiment <file.json>
node .Codex/scripts/surveys/evaluate-survey-experiments.mjs --schedule <id> <デプロイ日>  # startedAt + d7/28/56 期日を機械算出
node .Codex/scripts/surveys/evaluate-survey-experiments.mjs --check          # 実験期日到達分に実測を記録
node .Codex/scripts/surveys/evaluate-survey-experiments.mjs --verdict <id> <verdict> --evidence <ref>
```

- cadence: **月次で run-survey-portfolio-audit.sh、四半期で監査レポート**
  (`reference/audits/YYYY-MM-DD-survey-portfolio-audit.md`) を必須とする。CI (`pr-quality-check.yml` の
  Survey Portfolio State Guard) は schema/drift/orphan/linkage の検証のみで、本文生成・R2 push・deploy をしない。

## 手順 (audit)

1. **機械項目の再導出 (決定的)**:
   ```bash
   npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts
   # 内部で audit-survey-linkage.ts --json を実行 (itemCount/orphan は監査実測値の転記) +
   # R2 app/survey/all.json fetch (activeItemCount / r2-drift 検知) +
   # survey-editorial.ts import (editorialContentExists / readerQuestionCount) +
   # reference/reviews/YYYY-MM-DD-survey-<surveyId>.md 対応付け (lastReviewedAt / evidenceRefs)
   ```
2. **実測集計**: `npx tsx .Codex/scripts/surveys/aggregate-survey-metrics.ts` — GSC / GA4 pages.csv
   の `/survey/<id>` 行を 56d (非重複 2 窓) で合算。**行が無い = 表示 0 の実測として measured-low の
   カウント 0、標本不足 (imp<100) は measured-low (比率値保存禁止)、未計装 (survey→ranking 内部遷移)
   は not-instrumented として保存し推測値を入れない**。
3. **検証**: `npx tsx .Codex/scripts/surveys/validate-survey-portfolio.ts` が green であること
   (drift・根拠なし判定・重複実験は validator が弾く)。
4. **差分レポート**: lifecycle/editorial の変更・r2-drift・orphan・insufficient-data の一覧を
   agent の OUTPUT FORMAT で報告。四半期監査時は
   `reference/audits/YYYY-MM-DD-survey-portfolio-audit.md` に保存。

## 編集ハブ化の選別 (evaluate)

候補条件・除外条件の正典は `reference/surveyポートフォリオ運用.md` §4 (検索表示の実測 / 在庫 /
調査固有の意図 / 一次出典 / 責務分離 / YMYL 監査)。判定は必ず根拠 (evidenceRefs) つきで:

```bash
npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts --set <surveyId> \
  --lifecycle editorial-candidate --editorial candidate \
  --add-evidence <レビュー文書 or snapshot ref> [--hypothesis "<検証したい仮説>"]
```

編集ハブの実装フローは `.Codex/rules/survey-content-standards.md` (1 survey ずつ実証・一括長文化禁止)。
実装前に `reference/reviews/YYYY-MM-DD-survey-<surveyId>.md` の事前監査 (query 実測・在庫構造・
既存記事との重複・受入条件) を書き、editorialStatus を audit-ready に上げてから着手する。

## 実験管理 (experiment)

```bash
# 登録 (本番反映の前後で baseline を固定してから)
npx tsx .Codex/scripts/surveys/build-survey-portfolio.ts --add-experiment /tmp/exp.json
# 期日到達分の判定 (d7=異常検知のみ / d28=暫定 / d56=基本) — 判定スクリプトは PR-4
```

- baseline なし・同一 surveyId × changeType の pending 重複は validator が弾く。
- **GSC impressions < 100 の観測で CTR 効果を確定しない** (E4)。期間重複 snapshot を合算しない。
- 効果確定後の改善バックログ status 反映は improvement-triage へ引き渡す。

## 検証 (毎回必須)

```bash
npx tsx .Codex/scripts/surveys/validate-survey-portfolio.ts   # schema + 判定規律 + drift
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts   # 紐付け実測 (数値の根拠)
npx vitest run apps/web/src/features/survey/survey-editorial.test.ts --root apps/web  # editorial 変更時
```

## 禁止

- R2 push / deploy / production 変更 (このスキルは state と reference だけを書く)
- `.Codex/todo/improvements.md` への直接書き込み (improvement-triage へ引き渡す)
- portfolio/experiments の手編集 (builder スクリプト経由のみ)
- 紐付けの別ロジック実装 (itemCount は audit-survey-linkage の実測値を転記)
- 75 survey の一括 AI 長文化 / 未分類の受け皿となる擬似 survey の新設
- 推測値の保存 (取れない値は insufficient-data / not-instrumented / measured-low)
- surveys.json / survey-editorial.ts への計測値の書き込み
