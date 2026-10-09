---
name: page-data-batch
domain: data
description: TS-config (data-configs registry) を walk して e-Stat から data を fetch し R2 直行で書き込む。D1 を経由しない Phase 6 メインバッチ。Use when user says "page-data-batch", "metric データ更新", "R2 更新バッチ".
argument-hint: "[--metric <key>] [--kind <entity>] [--since YYYY-MM] [--dry-run] [--concurrency N]"
disable-model-invocation: true
primary_agent: data-ingester
co_agents: [theme-designer]
---

`data/metrics/*.ts` registry を入力に、e-Stat から data を fetch して R2 (`.local/r2/app/stats/<metric>/values.json`) へ直接書き込む。

Phase 6 で D1 → R2 移行が完了した後、本 skill が新規 metric / 年度更新の主たる手段となる (旧 `populate-all-rankings` skill を置換、2026-05-28 削除済み)。

## 背景

Phase 1-4 までは e-Stat → D1 → R2 snapshot の二段階フローだったが、D1 が 15GB に肥大化したため D1 を経由しない方針に転換 (Phase 6)。本 skill は **TS-config = authored SSOT、R2 = 配信・観測値SSOT** という完全DBレス構成の中心。

詳細: [データアーキテクチャ](../../../../docs/01_技術設計/02_データアーキテクチャ.md)、
[`r2-storage-design.md`](../../../rules/r2-storage-design.md)

## 手順

### 1. dry-run で対象を確認

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --dry-run
npx tsx packages/data-configs/scripts/page-data-batch.ts --kind city --dry-run
```

### 2. 単一 metric の更新 (smoke)

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --metric japanese-population
```

### 3. 部分更新 (since フィルタ)

```bash
# 2024-01 以降に更新されていない metric だけ再取得
npx tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01-01
```

### 4. 全件更新 (週次運用想定)

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --concurrency 4
```

時間目安: 2,200 metric × ~1 秒/req = **40-60 分**。e-Stat API レート制限あり、concurrency は 4-8 推奨。

### 5. R2 へ push

```bash
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats
```

## サポート状況 (Phase 6.4 時点)

| source.kind | 対応 |
|---|---|
| `estat` | ✅ 実装済 |
| `kakei-chousa` | ⏳ 未対応 (フェッチャ別途) |
| `mlit` / `external` | ⏳ 未対応 (フェッチャ別途) |
| `calculated` | ⏳ 別 skill 必要 (分子/分母の依存解決) |

非対応 source は skip (失敗扱いではない)。

## 手動取得 (`fetcherKey:"manual"`) の取得スクリプト

page-data-batch が skip する `external` + `manual` の metric は、一次資料 (xlsx / PDF / 公開 HTML) ごとに専用の取得スクリプトが
`.claude/scripts/data/` にあり、`.local/r2/app/stats/<key>/values.json` を書き出す (rank は値の降順・同値同順位で付く。
共通部品は `.claude/scripts/data/lib/stats-values-writer.mjs`)。各 metric の `source.config.provenance.restore` が同じスクリプトを指す。
書き出しはローカルだけで、本番 R2 への反映は上の「5. R2 へ push」(`diff-push-r2.ts`) を別に行う。
provenance の規約は [`data-provenance-standards.md`](../../../rules/data-provenance-standards.md)。

| スクリプト (`node .claude/scripts/data/...`) | 書き出す metric key | 一次資料 |
|---|---|---|
| `fetch-chutairen-club-membership.mjs` | `junior-high-club-per100-*` (競技別) | 日本中学校体育連盟 加盟生徒数調査 PDF |
| `fetch-pachinko-shop-density.mjs` | `pachinko-shop-density-per-10k` | 全日遊連公表 (警察庁保安課原典) |
| `fetch-japanese-instruction-students.mjs` | `students-requiring-japanese-instruction` (`npm run evidence:pilot:data:write-local`) | 文部科学省 日本語指導が必要な児童生徒の受入状況調査 |
| `fetch-cancer-asr75-breast.mjs` | `breast-cancer-asr75-mortality-female` | 国立がん研究センター がん情報サービス |
| `fetch-financial-literacy-correct-rate.mjs` | `financial-literacy-correct-rate` | 金融広報中央委員会 金融リテラシー調査 統計表 xlsx |
| `fetch-national-assessment-questionnaire.mjs` | `national-assessment-elementary-{breakfast,study-1h-plus,tutoring,reading-like}-rate` | 国立教育政策研究所 全国学力・学習状況調査 児童質問紙 (47 県 xlsx) |
| `fetch-nta-alcohol-per-adult.mjs` | `alcohol-sales-per-adult-{total,beer,sake,shochu,wine,whisky}` | 国税庁 酒のしおり (沖縄は表に無く 46 県) |
| `fetch-opendata-adoption-rate.mjs` | `opendata-adoption-rate-municipalities` | デジタル庁 オープンデータ取組済自治体資料 (全団体リスト CSV) |
| `fetch-sports-facility-athletics-stadium.mjs` | `athletics-stadium-count-public` | スポーツ庁 体育・スポーツ施設現況調査 |
| `fetch-zen-koutairen-rugby.mjs` | `high-school-club-per100-rugby-male` | 全国高等学校体育連盟 加盟・登録状況 ÷ 学校基本調査の男子生徒数 |
| `fetch-nhns-2024-prefecture.mjs` | `bmi-male-20to69-age-adjusted` `bmi-female-40to69-age-adjusted` `smoking-rate-male-age-adjusted` | 厚生労働省 令和6年国民健康・栄養調査 都道府県別結果 PDF |
| `fetch-census-sex-ratio-20-39.mjs` | `sex-ratio-age-20-39` | 国勢調査 5 歳階級別人口 (入力は R2 の `theme-population-pyramid-*` 8 本。先に page-data-batch で取り込む) |
| `fetch-heatstroke-deaths-mhlw.mjs` | `heatstroke-deaths` | 厚生労働省 人口動態統計「熱中症による死亡数」xlsx |
| `.claude/scripts/themes/ingest-food-livestock.mjs --write-local` | 畜産・食品製造 7 指標 (`beef-cattle-count` `pig-count` `layer-hen-count` ほか) | 農林水産省 畜産統計・経済産業省 経済構造実態調査 (e-Stat file-download、SHA256 固定) |

新しい手動取得スクリプトを足したら、この表に 1 行足す (書きっぱなしだと `check-agent-skill-consistency.cjs` の W1 orphan になり、次の担当者が辿れない)。
各スクリプトは `--help` を持たず、引数なしで本処理を走らせる。


## 新規 metric 追加フロー

1. `data/metrics/<new-key>.ts` を新規作成 (既存ファイルをコピーして編集)
2. `npx tsx packages/data-configs/scripts/build-registry.ts` で registry 再生成
3. `/page-data-batch --metric <new-key>` で data fetch + R2 書込
4. `/publish-ranking <new-key>` で ranking-items / values / KNOWN / sitemap を同期し、承認後に本番反映

## 参照

- 実装: `packages/data-configs/scripts/page-data-batch.ts`
- registry: `packages/data-configs/src/registry.ts`
- 型: `packages/data-configs/src/types.ts`
- 関連: `/publish-ranking`, `/push-r2`
