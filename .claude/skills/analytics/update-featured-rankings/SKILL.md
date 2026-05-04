---
name: update-featured-rankings
description: GA4 PVデータから注目ランキングを自動更新する（is_featured 更新）。Use when user says "注目ランキング更新", "フィーチャー更新". PV上位を自動選出.
disable-model-invocation: true
argument-hint: "[--days 7] [--limit 8] [--dry-run]"
---

GA4 API からランキングページの日次 PV を取得し、PV 上位のランキングを注目ランキング（`indicators.is_featured`）として自動更新する。

## 用途

- 注目のランキング（トップページ表示）を PV ベースで定期更新したいとき
- dry-run でフィーチャー候補を事前確認したいとき

## 引数

| 引数 | 説明 | デフォルト |
|---|---|---|
| `--days` | PV 集計対象の日数（GA4 から N 日分取得） | 7 |
| `--limit` | 注目ランキングの枠数 | 8 |
| `--dry-run` | indicators 更新をスキップ | false |

## 前提

- サービスアカウント鍵: リポジトリルートに `stats47-*.json` が存在すること
- ローカル D1 が利用可能であること

## 手順

### Phase 1: GA4 PV データ取得 + indicators 更新

スクリプトを実行する:

```bash
npx tsx packages/database/scripts/update-featured-rankings.ts
```

オプション指定:

```bash
npx tsx packages/database/scripts/update-featured-rankings.ts --days 14 --limit 8
npx tsx packages/database/scripts/update-featured-rankings.ts --dry-run
```

スクリプト内部の処理フロー:

1. GA4 API を呼び出し、`/ranking/*` ページの日次 PV + activeUsers を取得（pagePath + date の2ディメンション）
2. pagePath から ranking_key を抽出し、同一キーの複数パスは PV を合算
3. in-memory で ranking_key 単位に集計
4. `indicators` に存在する prefecture / is_active のキーのみフィルタ
5. カテゴリ分散フィルタ適用（同カテゴリ最大 2 枠）
6. `indicators` の `is_featured` / `featured_order` を更新

PV 履歴の永続化は行わない。GA4 履歴は `.claude/skills/analytics/ga4-improvement/reference/snapshots/<week>/pages.csv` に GitHub Actions が週次で蓄積している。

### Phase 2: R2 snapshot 反映

```bash
/sync-snapshots
```

production app は R2 snapshot 経由で indicators を読むため、is_featured 更新後は snapshot 再生成が必要。

## 注意

- GA4 データは前日分までが取得可能（当日分は未確定）
- 同日に複数回実行しても安全（in-memory 集計のみ、副作用は indicators の UPDATE のみ）
- `--dry-run` は indicators 更新をスキップ（GA4 fetch + 集計結果の表示のみ）
- カテゴリ分散: 同カテゴリのランキングは最大 2 枠まで

## 履歴

- 2026-05-04: `ranking_page_views` テーブル廃止に伴い、D1 への PV 蓄積を削除。GA4 fetch → in-memory 集計 → indicators 更新の 1 phase 構成に簡素化

## 参照

- `/fetch-ga4-data` — GA4 データ手動取得スキル
- `/sync-snapshots` — R2 snapshot 再生成
- `packages/database/scripts/update-featured-rankings.ts` — バッチスクリプト
