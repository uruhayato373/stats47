---
name: manage-theme-portfolio
description: 現行ThemeCatalogのテーマ群のポートフォリオを評価・更新する。ThemeCatalog と GSC/GA4 snapshot とレビュー文書を突合して .claude/state/themes/portfolio.json を再構築し、keep/improve/merge/split/rename/retire 候補を実測根拠つきで判定、実験の baseline/効果測定を管理する。theme-portfolio-manager が実行。Use when user says "テーマポートフォリオ", "テーマ棚卸し", "テーマ評価", "manage-theme-portfolio".
allowed-tools: Read, Grep, Glob, Bash
primary_agent: theme-portfolio-manager
---

# manage-theme-portfolio

テーマポートフォリオ (`.claude/state/themes/`) の継続評価サイクルを回す。
運用設計の正典: `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`。
schema・判定規律の正典: `.claude/state/themes/README.md`。

## 参照ルーティング

| 作業 | 必読 |
|---|---|
| 採択済みの指標・チャート改善を実装へ渡す | `reference/theme-improvement-execution.md` |
| 定義・比較時の注意カードを実装する | `reference/theme-guidance-implementation.md` |
| keep/split/merge/parent-hub判定やURL移行を設計する | `reference/theme-taxonomy-reorganization.md` |

進捗と優先度は `.claude/todo/backlog.md` を正典とし、reference文書へstatusを重複記録しない。

## モード

| mode | 内容 |
|---|---|
| `audit` (既定) | portfolio.json を ThemeCatalog + 最新 snapshot + レビュー文書と突合して再構築 → validator → 差分レポート |
| `deep-dive <themeKey>` | **単一テーマの改善監査** (下記 §deep-dive。実装はしない・提案まで) |
| `evaluate` | ライフサイクル判定の見直し (56d 実測ベース)。判定変更は根拠つきで提示 |
| `experiment` | 改善実験は baseline 必須、新規公開は launch として不在を明記 / d7/d28/d56 の記録 |
| `handoff` | 改善候補を improvement-triage へ引き渡し (agent 定義 §引き渡し形式) |

## deep-dive (単一テーマの改善監査)

「テーマ <key> を改善候補として監査」の定型。**まだ実装しない** (変更案と実装契約の提示まで)。

必須入力 (すべて既存基盤から取得):
1. **ThemeCatalog**: `packages/data-configs/src/theme-catalog/<key>.ts` (legacy は indicator-sets)
2. **最新テーマレビュー**: `reference/reviews/*-theme-<key>.md` (公式根拠セクション含む。不足時は theme-researcher へ調査委譲)
3. **GSC 直近28日 vs 前28日**: snapshots `<最新週>/pages.csv` vs `<4週前>/pages.csv` (各週 = last-28d 窓。合算しない)
4. **GA4 同**: Japan-only `pages-clean.csv` と成功/期間/国条件のmeta.jsonを持つ、実期間が連続した非重複窓ペア
5. **指標の最新年・欠測率**: テーマ集計は portfolio.json の dataQuality、**指標別**は R2 `app/ranking/<rankingKey>/values.json` を個別 fetch (年列・47県カバレッジ)
6. **公式資料**: レビューの公式根拠 (URL + アクセス日) を確認。更新確認が要る場合は WebFetch / theme-researcher
7. **内部導線**: **構造** = catalog metrics→`/ranking/<key>` リンク + relatedArticleTagKeys→blog (null なら「関連記事導線なし」と報告)。**計測**は既存nav_clickのtheme_* surfaceを `theme-navigation.csv` で取得する。計測行が無ければ insufficient-data とする

出力 (固定 10 項・この順):
現状 / 問題 / 仮説 / 判定 (keep・improve・merge/split/rename/retire 候補 — state README の判定規律準拠、根拠なし候補は validator が弾く) / 変更案 / primary KPI / guardrail KPI / 変更前 baseline (現行実測値) / 28日・56日の判定条件 (d28=暫定・d56=基本) / **Claude Code 実装契約** (実装 owner agent・対象ファイル・検証コマンド・禁止事項・R2/本番に触れない旨)

保存: `reference/audits/YYYY-MM-DD-theme-deepdive-<key>.md` のみ (docs/ には書かない)。
変更を実行に移す場合: ①experiments.json に baseline 登録 (build/evaluate スクリプト経由) →
②実装契約を theme-designer 等へ委譲 (セッションの実装承認範囲内) → ③d28/d56 で効果判定。

## 手順 (audit)

1. `npm run theme:portfolio:audit` で品質→インベントリ→実測→validator→実験期日→差分を一括確認する。
   `THEME_CATALOGS` が母集団。気候も登録済み、旧 `local-finance-city` はredirectのため含めない。
2. 章/図/指標の整合は `quality.json` と生成物検査、実表示はlocalhostで確認する。
3. GSCはsummaryのrolling28d、GA4はJapan-only成功メタの実期間から非重複28日窓2本を選ぶ。
   raw GA4は統廃合判断に使わない。行欠落を0にせず、低標本では比率を保存しない。
4. **portfolio.json 更新** → `node .claude/scripts/themes/validate-theme-state.mjs` が green であること。
5. **差分レポート**: 前回との lifecycle 変更・stale 検知・insufficient-data の一覧を agent の
   OUTPUT FORMAT で報告。四半期監査時は `.claude/skills/theme/manage-theme-portfolio/reference/audits/YYYY-MM-DD-theme-portfolio-audit.md` に保存。

## コマンド (PR-4 で確定)

```bash
# 継続監査の入口: quality → build → aggregate → validate → 実験期日 → drift
bash .claude/scripts/themes/run-theme-portfolio-audit.sh

# 個別実行
node --import tsx .claude/scripts/themes/build-theme-portfolio.ts        # 機械項目の再導出 (upsert)
node --import tsx .claude/scripts/themes/build-theme-portfolio.ts --set <key> --lifecycle <status> --add-evidence <ref>
node --import tsx .claude/scripts/themes/aggregate-theme-metrics.ts      # 56d 実測 (非重複 2 窓合算)
node .claude/scripts/themes/evaluate-theme-experiments.mjs --check          # 実験期日到達分に実測を記録
node .claude/scripts/themes/evaluate-theme-experiments.mjs --verdict <id> <verdict> --evidence <ref>
node .claude/scripts/themes/evaluate-theme-experiments.mjs --register '<json>'   # 実験登録 (手編集禁止の書き込み口。デプロイ前は evaluateAt 未設定で登録可)
node .claude/scripts/themes/evaluate-theme-experiments.mjs --schedule <id> <デプロイ日>  # startedAt + evaluateAt(d7/28/56) を機械算出
```

- cadence: **週次で機械監査、月次で公式資料と構成の再確認、四半期で監査レポート** (`.claude/skills/theme/manage-theme-portfolio/reference/audits/YYYY-MM-DD-theme-portfolio-audit.md`) を必須とする。CI (`pr-quality-check.yml` の Theme Portfolio State Guard) は schema/規律を検証。週次theme-chart-auditは公開R2と構成を読み、固定アラートを更新する。

## 検証 (毎回必須)

```bash
node .claude/scripts/themes/validate-theme-state.mjs          # schema + 判定規律
npm run theme:quality:test                                  # TS原典定義を含む回帰
```

## 禁止

- R2 push / deploy / production 変更 (このスキルは state と docs だけを書く)
- `.claude/todo/improvements.md` への直接書き込み (improvement-triage へ引き渡す)
- ThemeCatalog / 生成物 TS/JSON の編集 (theme-designer / generate:catalog の領分)
- 推測値の保存 (取れない値は insufficient-data / not-instrumented)
