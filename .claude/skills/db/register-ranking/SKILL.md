---
name: register-ranking
description: 新規 metric を metrics + sources に登録し e-Stat API からデータ投入する。Use when user says "ランキング登録", "register-ranking", "新しい指標を追加". search-estat/inspect-estat-meta と連携.
disable-model-invocation: true
primary_agent: data-ingester
co_agents: [theme-component-builder, theme-designer, data-pipeline]
---

新しい指標を `metrics` テーブルに登録し、e-Stat API からデータを取得して `stats_prefecture` (or `stats_city` / `stats_port`) に投入する。

## DDD migration 後のスキーマ (重要)

PR #205-#210 (2026-05-04) 完了後の現行スキーマ:

| 旧テーブル名 | 現行テーブル名 |
|---|---|
| `ranking_items` / `indicators` | `metrics` |
| `ranking_data` (entity_type 別) | `stats_prefecture` / `stats_city` / `stats_port` |
| `data_sources` + `source_metadata` | `sources` (`source_kind` で識別) |
| `estat_stats_tables` | `estat_metainfo` (status='registered' / 'candidate') |

カラム名対応:

| 旧 | 現行 |
|---|---|
| `ranking_key` | `key` (metrics PK) |
| `ranking_name` | `title` |
| `data_source_id` | `source_id` (FK → sources.id) |
| `source_config` | `source_config_json` |
| `value_display_config` | `value_display_config_json` |
| `visualization_config` | `visualization_config_json` |
| `calculation_config` | `calculation_config_json` |

ペア観測 (pref ↔ pref など) は `stats_prefecture` で表現不能 → `stats_migration_flow` のような専用テーブルを新規追加 (詳細: `packages/database/README.md`)。

## ⚠ Freeze ガード (必須、最初に実行)

```bash
if [ -f .claude/state/phase6-freeze.json ]; then
  jq -r .abortMessage .claude/state/phase6-freeze.json >&2
  exit 1
fi
```

Phase 6 進行中は本 skill での D1 INSERT 禁止。代替: `packages/data-configs/src/metrics/<key>.ts` に MetricConfig を新規追加し、`/sync-metrics-cache` を実行 (Phase 6.1 で skill 化予定)。

## 用途

- ブログ記事で参照したいランキングが DB に存在しないとき
- エリアページ（`/areas/`）に新しい指標を追加したいとき
- 相関分析の対象を増やしたいとき

## 引数

ユーザーから以下を確認すること（不明な場合は `/search-estat` → `/inspect-estat-meta` で特定する）:

| 引数 | 必須 | 説明 | 例 |
|---|---|---|---|
| `rankingKey` | ○ | ランキングキー（kebab-case） | `total-overnight-guests-ryokan` |
| `rankingName` | ○ | 日本語名 | `延べ宿泊者数（旅館）` |
| `statsDataId` | ○ | e-Stat 統計データ ID | `0000010107` |
| `cdCat01` | ○ | e-Stat カテゴリコード | `G710103` |
| `categoryKey` | ○ | サイト内カテゴリ | `tourism` |
| `unit` | ○ | DB 保存時の単位 | `人泊` |
| `displayUnit` | △ | 表示時の単位（変換後） | `万人泊` |
| `conversionFactor` | △ | 表示変換係数 | `0.0001` |
| `colorScheme` | △ | D3 カラースケール（デフォルト: `interpolateBlues`） | `interpolateReds` |
| `years` | △ | `latest`（デフォルト）/ `all` | `all` |

## 手順

### Phase 1: 事前確認

1. ローカル DB で同名キーが既に存在しないか確認:
   ```js
   db.prepare("SELECT key FROM metrics WHERE key = ?").get(rankingKey)
   ```
2. 既に存在する場合はユーザーに報告し、上書きするか確認

### Phase 2: metrics 登録

3. `metrics` への INSERT (現行 schema):
   ```js
   db.prepare(`
     INSERT INTO metrics (
       key, title, unit, source_id, category_key,
       source_config_json, value_display_config_json,
       visualization_config_json, calculation_config_json,
       is_active, is_featured
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `).run(
     rankingKey,
     rankingName,
     unit,
     "estat",  // sources.id
     categoryKey,
     JSON.stringify({
       source: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
       statsDataId: statsDataId,
       cdCat01: cdCat01,
     }),
     JSON.stringify({
       conversionFactor: conversionFactor ?? 1,
       decimalPlaces: 1,
       ...(displayUnit ? { displayUnit } : {}),
     }),
     JSON.stringify({
       colorScheme: colorScheme ?? "interpolateBlues",
       colorSchemeType: "sequential",
       minValueType: "zero",
     }),
     JSON.stringify({ isCalculated: false }),
     1, 0,
   );
   ```

`sources` テーブルに `id="estat"` が無い場合は事前に登録する。

### Phase 3: stats_prefecture (もしくは stats_city / stats_port) 投入

4. `/populate-all-rankings` の `--key` オプションで投入:
   ```bash
   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts --key <rankingKey>
   ```

5. **populate が失敗する場合**（source_config_json の形式が合わない等）は WebFetch で直接取得:
   ```
   https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData
     ?appId=<ESTAT_APP_ID>&statsDataId=<ID>&cdCat01=<CODE>&lvArea=2&cdTime=<TIME>
   ```
   取得後、better-sqlite3 で `stats_prefecture` に直接 INSERT。

6. `years: "all"` の場合は全年度を取得。`cdTime` を指定せず取得し、年度ごとにグループ化して INSERT。

### Phase 4: 検証

7. 登録結果を検証:
   - `metrics` に登録されたか (`SELECT * FROM metrics WHERE key = ?`)
   - `stats_prefecture` に 47 行あるか (`SELECT COUNT(*) FROM stats_prefecture WHERE metric_key = ?`)
   - Top 5 / Bottom 5 で値が妥当か
   - `/verify-d1-integrity --metric <key>` で整合性 OK

8. 検証結果をユーザーに報告:
   ```
   ✅ metrics: total-overnight-guests-ryokan (延べ宿泊者数（旅館）)
   ✅ stats_prefecture: 47件 (2023年度)
      1位: 北海道 (4,496,710 人泊)
      47位: 沖縄県 (105,380 人泊)

   次のステップ:
   - /sync-snapshots でスナップショット更新・本番反映
   - 記事に <source-link href="/ranking/total-overnight-guests-ryokan"> を追加
   - 相関分析に含めるには correlation バッチを再実行
   ```

### Phase 5: known-ranking-keys 再生成（**必須**）

9. `/generate-known-ranking-keys` を実行して `apps/web/src/config/known-ranking-keys.ts` を再生成
   - または: `cd apps/web && npx tsx scripts/generate-known-ranking-keys.ts`
10. 差分を確認（新規追加 rankingKey が含まれていること）:
    ```bash
    git diff apps/web/src/config/known-ranking-keys.ts | head -30
    ```
11. git add + commit:
    ```bash
    git add apps/web/src/config/known-ranking-keys.ts
    git commit -m "chore: known-ranking-keys.ts 再生成（+N 件 <rankingKey>）"
    ```

**重要**: この手順を飛ばすと、新規追加した rankingKey が middleware Fix 6 で **410 Gone** になりサイトでアクセス不可になる。CI ビルド環境に D1 binding が無いため、middleware は git commit されたファイルのみを参照する設計。

### Phase 6: 後処理

12. 一時スクリプトがあれば削除
13. ユーザーに次のアクション候補を提示:
    - `/sync-snapshots` — スナップショット更新・本番反映
    - `/deploy` — known-ranking-keys.ts と合わせて本番デプロイ
    - 記事への `<source-link>` 追加
    - 相関分析バッチの再実行

## 注意

- **area_code 形式**: ranking_data の area_code は `01000`〜`47000`（5桁）。e-Stat API の地域コードをそのまま使用する。2桁に変換しないこと（地図 TopoJSON の prefCode と一致させるため）
- **ランク計算**: value 降順ソート、同値は同順位
- **既存キーとの重複**: ranking_key が既に存在する場合は INSERT OR REPLACE で上書きされる。意図しない上書きに注意
- **プロキシ**: 企業ネットワークでは populate スクリプトが失敗する場合がある。WebFetch フォールバックを使う
- **データ鮮度**: `/fetch-estat-data` の「データ鮮度の落とし穴」セクションを参照。最新年が5年以上前の場合はユーザーに確認

## 関連スキル

- `/search-estat` — statsDataId を特定
- `/inspect-estat-meta` — メタデータ調査（cdCat01 を特定）
- `/fetch-estat-data` — ランキング形式データの手動取得
- `/populate-all-rankings` — 全キー一括投入
- `/sync-snapshots` — R2 スナップショット更新・本番反映
