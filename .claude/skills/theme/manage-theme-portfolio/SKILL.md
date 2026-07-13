---
name: manage-theme-portfolio
description: テーマ群 (22 テーマ) のポートフォリオを評価・更新する。ThemeCatalog と GSC/GA4 snapshot とレビュー文書を突合して .claude/state/themes/portfolio.json を再構築し、keep/improve/merge/split/rename/retire 候補を実測根拠つきで判定、実験の baseline/効果測定を管理する。theme-portfolio-manager が実行。Use when user says "テーマポートフォリオ", "テーマ棚卸し", "テーマ評価", "manage-theme-portfolio".
allowed-tools: Read, Grep, Glob, Bash, Agent
primary_agent: theme-portfolio-manager
---

# manage-theme-portfolio

テーマポートフォリオ (`.claude/state/themes/`) の継続評価サイクルを回す。
運用設計の正典: `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`。
schema・判定規律の正典: `.claude/state/themes/README.md`。

## モード

| mode | 内容 |
|---|---|
| `audit` (既定) | portfolio.json を ThemeCatalog + 最新 snapshot + レビュー文書と突合して再構築 → validator → 差分レポート |
| `evaluate` | ライフサイクル判定の見直し (56d 実測ベース)。判定変更は根拠つきで提示 |
| `experiment` | 実験の登録 (baseline 必須) / 期日到達分の d7/d28/d56 判定 |
| `handoff` | 改善候補を improvement-triage へ引き渡し (agent 定義 §引き渡し形式) |

## 手順 (audit)

1. **インベントリ導出 (決定的)**: `npx tsx` で `THEME_CATALOGS` から themeKey / role 別指標数 /
   selectionMissing / chartCount を導出。legacy (`climate` / `local-finance-city`) は IndicatorSet
   (`packages/types/src/indicator-sets/`) から。catalogStatus を付与。
2. **レビュー対応付け**: `.claude/skills/theme/manage-theme-portfolio/reference/reviews/*-theme-<key>.md` を glob し `reviewDocRef` /
   `officialSourceReviewedAt` を更新。レビュー後にカタログの primary 構成が変わっていれば
   `reviewStatus: "stale"`。
3. **実測集計**: 最新週の GSC / GA4 pages.csv から `/themes/<key>` 行を集計 (56d 窓 = 直近 8 週分の
   snapshot を合算)。**行が無い・標本不足は insufficient-data、未計装 (内部遷移等) は
   not-instrumented として保存し推測値を入れない**。
4. **portfolio.json 更新** → `node .claude/scripts/themes/validate-theme-state.mjs` が green であること。
5. **差分レポート**: 前回との lifecycle 変更・stale 検知・insufficient-data の一覧を agent の
   OUTPUT FORMAT で報告。四半期監査時は `.claude/skills/theme/manage-theme-portfolio/reference/audits/YYYY-MM-DD-theme-portfolio-audit.md` に保存。

## コマンド (PR-4 で確定)

```bash
# ★継続監査の入口 (月次推奨・四半期必須): build → aggregate → validate → 実験期日 → drift
bash .claude/scripts/themes/run-theme-portfolio-audit.sh

# 個別実行
npx tsx .claude/scripts/themes/build-theme-portfolio.ts        # 機械項目の再導出 (upsert)
npx tsx .claude/scripts/themes/build-theme-portfolio.ts --set <key> --lifecycle <status> --add-evidence <ref>
npx tsx .claude/scripts/themes/aggregate-theme-metrics.ts      # 56d 実測 (非重複 2 窓合算)
node .claude/scripts/themes/evaluate-theme-experiments.mjs --check          # 実験期日到達分に実測を記録
node .claude/scripts/themes/evaluate-theme-experiments.mjs --verdict <id> <verdict> --evidence <ref>
```

- cadence: **月次で run-theme-portfolio-audit.sh、四半期で監査レポート** (`.claude/skills/theme/manage-theme-portfolio/reference/audits/YYYY-MM-DD-theme-portfolio-audit.md`) を必須とする。CI (`pr-quality-check.yml` の Theme Portfolio State Guard) は schema/規律の検証のみで破壊的変更をしない。

## 検証 (毎回必須)

```bash
node .claude/scripts/themes/validate-theme-state.mjs          # schema + 判定規律
node --test .claude/scripts/themes/__tests__/                 # validator 自体の回帰
```

## 禁止

- R2 push / deploy / production 変更 (このスキルは state と docs だけを書く)
- `docs/todo/01_改善バックログ.md` への直接書き込み (improvement-triage へ引き渡す)
- ThemeCatalog / 生成物 TS/JSON の編集 (theme-designer / generate:catalog の領分)
- 推測値の保存 (取れない値は insufficient-data / not-instrumented)
