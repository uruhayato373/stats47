---
name: register-ranking
description: 新規ランキングキーを ranking_items に登録し e-Stat API からデータ投入する。Use when user says "ランキング登録", "register-ranking", "新しい指標を追加". search-estat/inspect-estat-meta と連携.
disable-model-invocation: true
---

新しいランキングキーを ranking_items に登録し、e-Stat API からデータを取得して ranking_data に投入する。

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
   db.prepare("SELECT ranking_key FROM ranking_items WHERE ranking_key = ?").get(rankingKey)
   ```
2. 既に存在する場合はユーザーに報告し、上書きするか確認

### Phase 2: ranking_items 登録

3. 以下の形式で INSERT:
   ```js
   {
     ranking_key: rankingKey,
     area_type: "prefecture",
     ranking_name: rankingName,
     title: rankingName,
     unit: unit,
     category_key: categoryKey,
     is_active: 1,
     is_featured: 0,
     data_source_id: "estat",
     source_config: JSON.stringify({
       source: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
       statsDataId: statsDataId,
       cdCat01: cdCat01
     }),
     value_display_config: JSON.stringify({
       conversionFactor: conversionFactor ?? 1,
       decimalPlaces: 1,
       ...(displayUnit ? { displayUnit } : {})
     }),
     visualization_config: JSON.stringify({
       colorScheme: colorScheme ?? "interpolateBlues",
       colorSchemeType: "sequential",
       minValueType: "zero"
     }),
     calculation_config: JSON.stringify({ isCalculated: false }),
     latest_year: null,    // Phase 3 で {"yearCode":"2023","yearName":"2023年度"} 形式に更新
     available_years: null // Phase 3 で [{"yearCode":"2023","yearName":"2023年度"},...] 形式に更新
   }
   ```

### Phase 3: ranking_data 投入

4. `/populate-all-rankings` の `--key` オプションで投入:
   ```bash
   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts --key <rankingKey>
   ```

5. **populate が失敗する場合**（source_config の形式が合わない等）は WebFetch で直接取得:
   ```
   https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData
     ?appId=<ESTAT_APP_ID>&statsDataId=<ID>&cdCat01=<CODE>&lvArea=2&cdTime=<TIME>
   ```
   取得後、better-sqlite3 で ranking_data に直接 INSERT する（今回の旅館/BHデータ登録と同じ手順）。

6. `years: "all"` の場合は全年度を取得。`cdTime` を指定せずに取得し、年度ごとにグループ化して INSERT。

### Phase 4: 検証

7. 登録結果を検証:
   - ranking_items に登録されたか
   - ranking_data に 47 都道府県分のデータがあるか
   - Top 5 / Bottom 5 を表示して値が妥当か
   - `latest_year` / `available_years` が更新されたか

8. 検証結果をユーザーに報告:
   ```
   ✅ ranking_items: total-overnight-guests-ryokan (延べ宿泊者数（旅館）)
   ✅ ranking_data: 47件 (2023年度)
      1位: 北海道 (4,496,710 人泊)
      47位: 沖縄県 (105,380 人泊)

   次のステップ:
   - /sync-remote-d1 でリモート D1 に反映
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
    - `/sync-remote-d1` — リモート反映
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
- `/sync-remote-d1` — リモート D1 へ反映
