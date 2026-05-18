---
name: fetch-article-data
description: ブログ記事用の ranking JSON + timeseries JSON を取得して docs/21_ブログ記事原稿/<slug>/data/ に配置する。企画 MD の ranking_key / statsDataId を参照し、ローカル D1 や e-Stat API から都道府県データを集約。Use when user says "記事データ取得", "fetch-article-data", "article データ準備".
---

ブログ記事用のデータを集約するスキル。`/draft-from-trend` の orchestrator から呼ばれる。

**本スキルは既存のデータソース取得を組み合わせる aggregator。** ローカル D1 + e-Stat API + R2 snapshot から取得し、記事 1 本分の `data/*.json` を整える。

## 用途

- 企画確定後、`/generate-article-charts` で使う前のデータ準備
- `/draft-from-trend` の Step 3 として呼ばれる
- 手動で記事原稿を書いている時にもデータだけ揃えたいとき

## 引数

```
/fetch-article-data <slug>
```

- **slug**: 企画 MD で確定した記事 slug (例: `manufacturing-aichi-dominance`)
  - 対応する企画 MD は `docs/20_ブログ記事企画/backlog/` 配下のいずれかに含まれている前提

## 前提

- 企画 MD が `docs/20_ブログ記事企画/backlog/*.md` に存在し、対象 slug に以下が記述されていること:
  - `ranking_key` (1 個以上、既存 D1 `rankings` テーブルにある key)
  - もしくは `statsDataId` (e-Stat API から新規取得する場合)
  - `chart_specs` (どのチャートを作るかの仕様)

- ローカル D1 (`.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`) が最新の状態
- e-Stat API キー (`ESTAT_APP_ID` 環境変数) が設定済み (新規 statsDataId の場合のみ)

## 手順

### Phase 1: 企画 MD から指標抽出

`docs/20_ブログ記事企画/backlog/` 配下を grep して slug のセクションを特定:

```bash
grep -l "slug:.*<slug>" docs/20_ブログ記事企画/backlog/*.md
```

該当 MD の section から以下を抽出:
- `ranking_key`: 既存 D1 にある場合のキー (例: `manufacturing-shipment-value`)
- `statsDataId`: 新規 e-Stat データの場合 (例: `0003445758`)
- `chart_specs`: チャート種別と必要データ (bar / tile-grid / line / scatter / stacked / summary)

### Phase 2: ディレクトリ準備

```bash
mkdir -p docs/21_ブログ記事原稿/<slug>/data
```

### Phase 3: ranking JSON 取得 (47 都道府県)

#### 既存 D1 にある ranking_key の場合

ローカル D1 から direct クエリ:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT area_code, area_name, value, year FROM rankings r
   JOIN ranking_data rd ON r.id = rd.ranking_id
   WHERE r.ranking_key = '<ranking_key>'
   ORDER BY value DESC;"
```

出力を `docs/21_ブログ記事原稿/<slug>/data/<ranking_key>-prefecture-rankings.json` に保存:

```json
{
  "ranking_key": "manufacturing-shipment-value",
  "title": "製造品出荷額ランキング",
  "unit": "兆円",
  "year": 2023,
  "items": [
    { "area_code": "23000", "area_name": "愛知県", "value": 58 },
    ...
  ]
}
```

#### 新規 statsDataId の場合

`/fetch-estat-data` skill を呼ぶ:

```
/fetch-estat-data statsDataId=<id> cdCat01=<cat> output=docs/21_ブログ記事原稿/<slug>/data/<name>-prefecture-rankings.json rankingKey=<name>
```

### Phase 4: timeseries JSON 取得 (複数年)

時系列データは D1 `ranking_data` の年度別 record を集約:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT year, area_code, value FROM rankings r
   JOIN ranking_data rd ON r.id = rd.ranking_id
   WHERE r.ranking_key = '<ranking_key>'
   ORDER BY year ASC, area_code ASC;"
```

出力を `docs/21_ブログ記事原稿/<slug>/data/<ranking_key>-timeseries.json` に保存:

```json
{
  "ranking_key": "manufacturing-shipment-value",
  "title": "製造品出荷額の推移",
  "unit": "兆円",
  "years": [2018, 2019, 2020, 2021, 2022, 2023],
  "series": [
    { "area_code": "23000", "area_name": "愛知県", "values": [55, 56, 50, 53, 55, 58] },
    ...
  ]
}
```

### Phase 5: chart_specs に応じた追加データ取得

chart_specs に応じて以下を追加で取得:

- `scatter` の場合: 2 指標の対 (例: 製造品出荷額 vs 人口) → `<name>-scatter.json`
- `tile-grid` の場合: 47 県分の単一指標 → `<name>-tile-grid.json` (ranking と同じ構造で OK)
- `summary-findings` の場合: 上位 5 / 下位 5 + 全国平均の集計 → `<name>-findings.json`

### Phase 6: 検証

すべての JSON が syntax 正しいか確認:

```bash
for f in docs/21_ブログ記事原稿/<slug>/data/*.json; do
  jq empty "$f" || echo "FAIL: $f"
done
```

47 都道府県 (area_code 01000-47000) が漏れなく含まれているか確認:

```bash
jq '.items | length' docs/21_ブログ記事原稿/<slug>/data/<name>-prefecture-rankings.json
# → 47 が期待値
```

## 出力サマリ

実行後、生成されたファイル一覧を報告:

```
✓ docs/21_ブログ記事原稿/<slug>/data/<name>-prefecture-rankings.json (47 prefectures)
✓ docs/21_ブログ記事原稿/<slug>/data/<name>-timeseries.json (6 years × 47 prefectures)
✓ docs/21_ブログ記事原稿/<slug>/data/<name>-scatter.json (47 points)
```

次のステップ: `/generate-article-charts --slug <slug>` で SVG 生成

## 規約

- **JSON 命名規則**:
  - `<name>-prefecture-rankings.json` → bar chart 用
  - `<name>-timeseries.json` → line chart 用
  - `<name>-tile-grid.json` → tile-grid-map 用
  - `<name>-scatter.json` → scatter chart 用
  - `<name>-stacked.json` → stacked-bar 用
  - `<name>-findings.json` → summary-findings 表用

`<name>` は ranking_key またはチャート識別子 (例: `prefecture-pyramid`)。命名は generate-article-charts のチャート種別判定と一致させる。

- **47 都道府県の網羅**: 沖縄から北海道まで area_code 01000-47000 を漏れなく含める (欠損あれば警告)
- **データソース明記**: 各 JSON の `data_source` フィールドに「e-Stat 0003445758 (令和7年賃金構造基本統計)」のように記載
- **本スキルは aggregator**: 新規 API 呼び出しロジックは追加しない、既存スキル (`/fetch-estat-data`) と DB クエリの組合せで完結

## 既知の制約

- ローカル D1 が古い場合は `/sync-snapshots --only ranking` で先に更新
- e-Stat API の新規取得は rate limit (60 req/min) あり、複数 statsDataId 同時取得時は wait 必要
- chart_specs が企画 MD に明記されていない場合は手動指定が必要 (デフォルトは bar + timeseries のみ)

## 関連

- `/draft-from-trend` (本スキルを Step 3 で呼ぶ orchestrator)
- `/plan-blog-trends` (本スキルが入力する企画 MD を生成)
- `/generate-article-charts` (本スキルの出力 JSON を入力にする後続スキル)
- `/fetch-estat-data` (新規 statsDataId 取得時に内部で呼ぶ既存スキル)
- `/inspect-estat-meta` (新規 statsDataId のメタ調査が事前必要なら)
- データソース全般: `.claude/rules/estat-api.md`
- ローカル D1 パス: `.claude/rules/local-environment.md`

## 完了条件

- [ ] 対象 slug の `docs/21_ブログ記事原稿/<slug>/data/` に必要 JSON 全て生成
- [ ] 各 JSON が syntax valid (jq empty 通る)
- [ ] 47 都道府県漏れなし (ranking の items 47 件)
- [ ] data_source フィールド明記
