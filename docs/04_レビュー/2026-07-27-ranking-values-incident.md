---
type: critical-review
date: 2026-07-27
status: completed
tier: 1
target_metric: data
tags: [incident, ranking-values, data-integrity, post-mortem]
---

# ranking values.json 配信障害 ポストモーテム (2026-07-27)

## 発端

トップページの注目ランキング (`app/home/featured.json`) が `count:0` で空になっているのを検知した。
調査の過程で category 10 ファイル・survey 8 ファイルも 28 件版に汚染されていることが判明し、
さらに深掘りした結果、配信用ランキング値 `app/ranking/<key>/values.json` そのものが
**Phase 6 (2026-05-27) 以降 2 ヶ月間、生成されていなかった**ことが確定した。

## 根本原因 (2 つ)

### 原因① CI の NODE_ENV 未設定による誤 patch → master export の汚染

CI の TSX ラッパ `packages/ranking/src/scripts/setup-cli.js` が `NODE_ENV` 未設定時に
`development` を立ち上げ、`listFromR2` が本番 R2 (S3) ではなく `.local/r2` を列挙する経路に
入っていた。master export 直前の `item-metadata-refresh --apply` が patched 28 件だけを
staging したため、`enumerateRankingItemKeys` は「28 件 (>0 件) だから全件」と誤認し、
`app/home/featured.json` / category 10 件 / survey 8 件が 28 件版で上書きされた。exporter は
missingKeys があっても warn を出すのみで push を止めていなかった。

### 原因② `app/ranking/<key>/values.json` の writer が Phase 6 で消失

Phase 6 (2026-05-27、観測値の D1→R2 移行) で D1 export task が廃止された際、代替の配信用
values.json writer が作られないままだった。runtime の全描画値・OGP・blog はこの
`app/ranking/<key>/values.json` を読むため、既存 2,112 件は stale 配信、Phase 6 以降に追加された
67 件は values.json が存在せず「データがありません」の空ページのまま sitemap に掲載され続けていた。

## 対策 (実装済み)

| 対策 | 内容 |
|---|---|
| 配信用 values.json writer 新設 | `packages/ranking/src/scripts/generate-ranking-values.ts` — 正典 `app/stats/<key>/values.json` を入力に `app/ranking/<key>/values.json` を決定的生成。rank は正典の値を引き継ぐ。readers は無変更 |
| sync-snapshots への配線 | `.claude/skills/db/sync-snapshots/run.sh` の TASKS に `ranking-values` を `ranking-items` の**後**で追加 |
| CI の NODE_ENV 固定 | `sync-snapshots.yml` / `data-refresh.yml` に `NODE_ENV: production` を追加 (原因① の再発防止) |
| fail-closed ガード | `ranking-items-per-url-snapshot.ts` に `checkRankingItemsCompleteness` を追加し、欠落時に push を止める |
| 恒久監査 | `packages/ranking/src/scripts/audit-ranking-data-integrity.ts` + `.github/workflows/ranking-integrity-audit-weekly.yml` (日曜 04:30 JST) を新設。実行して欠落 67 件 + 年不整合 1 件の検出を実証済み |
| exit code / smoke test 是正 | `page-data-batch.ts` の exit code 是正、`smoke-test-routes.sh` に featured count>=8 検査を追加 |

## 残課題 (本件のスコープ外・バックログへ起票)

- **e-Stat fetch 失敗 25 metric** — 全件が同一エラー `DATA_INF undefined`。config の statsDataId/cdCat
  不正、または該当データが e-Stat に存在しない疑いで、再実行では直らない。
  → `docs/todo/01_改善バックログ.md` `DATA-ESTAT-FETCH-01`
- **手動抽出 12 metric** — provenance に復旧コマンドが記録済みのため再取得で解消見込み。
  → `docs/todo/01_改善バックログ.md` `DATA-MANUAL-RESTORE-01`

## 関連

- 正典: `.claude/rules/metric-config-standards.md`「isActive:true ≠ 本番公開」
- R2 キー設計: `.claude/rules/r2-storage-design.md`
- sync-snapshots: `.claude/skills/db/sync-snapshots/SKILL.md`
- バックログ: `docs/todo/01_改善バックログ.md` `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01`
