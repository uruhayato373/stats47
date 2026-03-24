---
description: GA4 PV データから注目ランキングを自動更新（ranking_page_views 蓄積 + is_featured 更新）
argument-hint: [--days 7] [--limit 8] [--dry-run]
---

GA4 API からランキングページの日次 PV を取得し、`ranking_page_views` テーブルに蓄積した上で、
PV 上位のランキングを注目ランキング（`is_featured`）として自動更新する。

## 用途

- 注目のランキング（トップページ表示）を PV ベースで定期更新したいとき
- PV 履歴を蓄積して伸び率分析に使いたいとき
- dry-run でフィーチャー候補を事前確認したいとき

## 引数

| 引数 | 説明 | デフォルト |
|---|---|---|
| `--days` | PV 集計対象の日数（GA4 から N 日分取得） | 7 |
| `--limit` | 注目ランキングの枠数 | 8 |
| `--dry-run` | ranking_items 更新をスキップ（PV 保存は実行） | false |

## 前提

- サービスアカウント鍵: リポジトリルートに `stats47-*.json` が存在すること
- ローカル D1 が利用可能であること
- `ranking_page_views` テーブルがローカル D1 に存在すること

## 手順

### Phase 1: GA4 PV データ取得

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
3. `ranking_page_views` テーブルに UPSERT（同日に複数回実行しても安全）
4. `ranking_page_views` から過去 N 日の PV を集計
5. `ranking_items` に存在する active なキーのみフィルタ
6. カテゴリ分散フィルタ適用（同カテゴリ最大 2 枠）
7. `ranking_items` の `is_featured` / `featured_order` を更新

### Phase 2: リモート反映

```bash
/sync-remote-d1 --key ranking_items
/sync-remote-d1 --table ranking_page_views
```

## 注意

- GA4 データは前日分までが取得可能（当日分は未確定）
- 同日に複数回実行しても UPSERT で安全（最新値で上書き）
- `--dry-run` でも PV データの保存（Phase 2）は実行される（データ蓄積が主目的）
- カテゴリ分散: 同カテゴリのランキングは最大 2 枠まで

## 将来拡張

- 伸び率ベースの判定: 直近7日 vs 前7日の PV 伸び率でスコアリング
- 週次自動実行: cron ジョブでの定期更新

## 参照

- `/fetch-ga4-data` — GA4 データ手動取得スキル
- `/sync-remote-d1` — リモート D1 反映
- `packages/database/src/schema/ranking_page_views.ts` — テーブルスキーマ
- `packages/database/scripts/update-featured-rankings.ts` — バッチスクリプト
