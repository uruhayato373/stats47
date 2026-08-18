---
type: seo-audit
date: 2026-07-13
status: completed
tags: [survey, portfolio, pr-2]
---

# survey ポートフォリオ初回監査 (PR-2 初期生成)

`.claude/state/surveys/portfolio.json` の初期生成 (75 survey) と census 実験の台帳登録の記録。
数値はすべて機械取得の実測 (audit-survey-linkage --json / R2 all.json / survey-editorial.ts import /
GSC・GA4 2026-W28 snapshot 行数)。最新状態の SSOT は portfolio.json であり、本書は生成時点の証跡。

## 生成結果 (2026-07-13)

- **portfolio.json**: 75 survey (surveys.json と双方向一致)。orphan 0 / editorial 実装 1 (census) /
  **r2-drift 1 (population-projection)**。validator green (warning 1 = r2-drift)。
- **紐付けグローバル** (linkage ブロックに転記): metrics 2,235 / resolved 1,984 (88.8%) /
  unresolved 251 (estat-uncovered 56 / ssds-synthetic-only 134 / external 61) / 辞書未カバー
  statsDataId 50 / orphan 0 / config.surveyId 不正 0。
- **experiments.json**: SURVEY-EXP-001 (census / editorial-hub) を登録。
  baseline = GSC W27 (23 imp / 0 clicks / CTR 0% / pos 25.43)、startedAt = 2026-07-12
  (PR #567 merge・本番 live を 2026-07-13 curl 実測)、判定期日 d7=07-19 / d28=08-09 / d56=09-06。

## lifecycle / editorial の初期判定 (根拠 = evidenceRefs)

| surveyId | lifecycle | editorial | 根拠 |
|---|---|---|---|
| census | improve | measuring | reviews/2026-07-11-survey-census.md + 本番 live 実測。d28 (2026-08-09) を次レビューに設定 |
| wage-structure-survey | editorial-candidate | audit-ready | reviews/2026-07-11-survey-wage-structure-survey.md (事前監査完了・受入条件確定) + audits/2026-07-11 (447imp/CTR0.22% = 最大改善余地) |
| kakei-chousa | editorial-candidate | candidate | audits/2026-07-11 (在庫最大 694・優先 2 位)。個別監査は未了 |
| local-finance | editorial-candidate | candidate | audits/2026-07-11 (CTR 2.78%・行政実務意図・優先 3 位)。個別監査は未了 |
| social-life-basic-survey | editorial-candidate | candidate | audits/2026-07-11 (生活時間・余暇の独自性・優先 4 位)。個別監査は未了 |
| population-projection | linkage-fix-required | fallback | R2 all.json に不在 (builder が機械検知)。下記 §残課題 |
| 残り 69 件 | observe | fallback | 需要観測中 (既定)。GSC/GA4 集計は PR-3 |

- housing-land-survey / school-basic-survey は 2026-07-11 監査で「比較して選択」とされたのみで確定
  根拠が無いため observe のまま (PR-3 の実測集計後に判断)。
- 病院報告・患者調査は表示ありだが **YMYL のため品質監査完了まで candidate にしない** (運用設計 §4)。

## docs 移行の完了記録

- 旧survey監査3本は `reference/{reviews,audits}/` へ移設済 (PR-0)。
- 旧 survey content cluster handoff → **消化して削除済み** (終了条件
  「本番反映 + 初回 baseline 記録」を充足: 本番反映 2026-07-12 実測・baseline は SURVEY-EXP-001 に記録。
  効果測定の追跡は experiments.json が担い、effect 確定時に improvement-triage へ引き渡す)。

## 残課題 / 委譲

1. **population-projection の R2 反映** (r2-drift): surveys.json 追加後に master export 未実行。
   → CI `sync-snapshots` を **`ranking-items` → `master` の順**で実行 (r2-publisher / CI へ委譲。
   本運用からは R2 push しない)。実行後に build 再実行で ok へ戻ることを確認する。
   > **訂正 (2026-07-14)**: 上記は誤診だった。実態は該当 7 指標 (projected-population-20XX) が
   > **すべて isActive:false (未公開)** で、R2 all.json は active のみ配信するため不在は**正常**。
   > 「stale」ではなく **inactive-only** (公開待ち・公開判断は ranking-publisher / expansion queue)。
   > 誤診の根因 = 監査が active/total を区別していなかったこと → audit-survey-linkage に
   > `perSurveyActive` と `--compare-r2` (焼き込み実測突合) を追加し、linkageStatus を 4 値化して根治。
   > 初回全件突合 (2026-07-14): active 2,159 item 一致 100%・欠落 0・調査集合一致。
2. **PR-3**: GSC/GA4 snapshot の /survey/* 集計 (非重複 2 窓 56d) → baseline 保存・gscSnapshotRef 記入。
   素材は確認済み (GSC W28 に /survey/ 41 行・GA4 W28 に 30 行)。
3. **PR-4**: 月次監査コマンド・実験期日判定スクリプト・CI 配線 (schema/drift/orphan/linkage のみ)。
4. **rule drift**: `survey-content-standards.md` の relatedArticleSlugs[] は survey-editorial.ts 未実装
   (portfolio の relatedArticleCount は実装まで null)。wage-structure 実装時に関連記事接続と併せて判断。
