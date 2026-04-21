# Cloudflare コスト改善ログ

Cloudflare Workers / D1 / R2 の月次コストと主要メトリクスを時系列で追跡し、打った施策と効果を記録する。

請求は月次で前月 15 日〜当月 14 日の集計になるため、施策効果の測定は **14 日以上経過してから** 判定する。

---

## Baseline（2026-W15 = 2026-03-15〜04-14）

| 指標 | 実績 | 無料枠 | 超過 | 課金額 |
|---|---|---|---|---|
| D1 Rows Read | 39,524,193,411 | 25B | 14.5B | **$14.53** |
| Workers CPU ms | 225,488,730 | 30M | 195M | **$3.92** |
| D1 Storage | 6 GB | 5 GB | 1 GB | $0.75 |
| Workers Paid サブスク | 1 | - | - | $5.00 |
| 消費税 (JPN 10%) | - | - | - | $2.42 |
| **合計** | | | | **$26.62** |

請求書: IN-62466340（2026-04-15 発行）

---

## Action Log

### [T1-D1READ-01] sitemap.ts に ISR 24h キャッシュ

**施策 ID**: `T1-D1READ-01`
**Tier**: T1（即効・低リスク）
**デプロイ日**: 2026-04-21（PR merge 済、本番デプロイは別途 `/deploy`）
**PR**: https://github.com/uruhayato373/stats47/pull/7
**コミット**: `28715f42`
**ターゲット指標**: D1 Rows Read
**想定効果値**: -50%（月 500M〜1B 削減）
**観測予定日**: 2026-05-05 (MID), 2026-05-19 (FINAL)

#### 変更内容
- `apps/web/src/app/sitemap.ts` に `export const revalidate = 86400` 追加
- Googlebot / Bingbot 等のクローラが sitemap.xml を取得するたびに `rankingItems` `categories` `articles` `articleTags` `surveys` を全行スキャンしていた問題を解消

#### 実測効果
| 観測日 | 経過日数 | D1 Rows Read delta | 判定 |
|---|---|---|---|
| （未観測） | - | - | PENDING |

---

### [T1-D1READ-02] /ports の force-dynamic → ISR 24h

**施策 ID**: `T1-D1READ-02`
**Tier**: T1
**デプロイ日**: 2026-04-21（PR merge 済）
**PR**: https://github.com/uruhayato373/stats47/pull/8
**コミット**: `0b2a39bf`
**ターゲット指標**: D1 Rows Read
**想定効果値**: -30%（月 500M〜1B 追加削減）
**観測予定日**: 2026-05-05 (MID), 2026-05-19 (FINAL)

#### 変更内容
- `apps/web/src/app/ports/page.tsx` の `export const dynamic = "force-dynamic"` を削除
- `export const revalidate = 86400` + `loadPortData().catch(...)` の fallback 追加
- force-dynamic は 2026-03-27 コミット `60b5fd1c` で CI ビルド失敗の回避策として追加されたものであり、意図した設計ではなかった

#### 実測効果
| 観測日 | 経過日数 | D1 Rows Read delta | 判定 |
|---|---|---|---|
| （未観測） | - | - | PENDING |

---

### [T1-CPUMS-01] OGP 画像を ISR 長期キャッシュ化

**施策 ID**: `T1-CPUMS-01`
**Tier**: T1
**デプロイ日**: 2026-04-21（PR merge 済）
**PR**: https://github.com/uruhayato373/stats47/pull/9
**コミット**: `fce131bf`
**ターゲット指標**: Workers CPU ms
**想定効果値**: -80%（月 225M → 45M）
**観測予定日**: 2026-05-05 (MID), 2026-05-19 (FINAL)

#### 変更内容
- `/areas/[areaCode]/opengraph-image.tsx`: `revalidate = 604800`（7 日）+ D1 失敗時 fallback
- `/themes/[themeSlug]/opengraph-image.tsx`: `revalidate = 2592000`（30 日）+ `generateStaticParams` で 16 テーマ分事前生成
- Satori による動的 PNG 生成を長期エッジキャッシュで代替

#### 実測効果
| 観測日 | 経過日数 | Workers CPU ms delta | 判定 |
|---|---|---|---|
| （未観測） | - | - | PENDING |

---

## Observation Log

### 3.1 月次メトリクス履歴

| スナップショット | 期間 | D1 Rows Read | Workers CPU ms | D1 Storage | 合計 $ | 備考 |
|---|---|---|---|---|---|---|
| 2026-W15 | Mar 15 – Apr 14 | 39.5B | 225M | 6GB | $26.62 | BASELINE。T1-D1READ-01/02 + T1-CPUMS-01 デプロイ前 |

### 3.2 施策効果サマリ

| 観測日 | 施策 ID | 経過日数 | ターゲット | 想定 delta | 実測 delta | 判定 |
|---|---|---|---|---|---|---|
| （まだなし） | | | | | | |

---

## Next Actions

### Tier 1（即効・未実施）

- **ランキング API route のキャッシュ見直し** — `/api/ranking-data/[rankingKey]` route の Cache-Control 設定確認
- **`packages/ranking/*/list-ranking-values*.ts` に LIMIT 追加** — 安全装置として。WHERE 句で絞り込まれているため実質影響は小さいが、事故防止のため

### Tier 2（戦略）

- **D1 storage 削減** — `_backup` 系テーブル・古い migration 残骸の洗い出し
- **R2 hot object 特定** — ランキング画像・AI 生成コンテンツの hit rate 確認

### Tier 3（要調査）

- **Bot トラフィックフィルタ** — Cloudflare Dashboard で bot score でフィルタ、スクレイパー遮断
- **D1 read replica** — 将来のスケール時。現状は不要

### 監視タスク

- **2026-05-05（デプロイ後 14 日）**: MID observation 実施
- **2026-05-19（デプロイ後 28 日）**: FINAL observation 実施
- **2026-05-15（次の請求日）**: 実請求額で最終判定
