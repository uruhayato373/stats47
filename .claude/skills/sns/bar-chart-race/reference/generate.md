# BCR reference: generate (データ生成)

> `/bar-chart-race --step generate` の詳細手順。スキル本体は `../SKILL.md`。
> **DBレス**: 「D1 から」の記述は旧称。実際は **R2 観測値 `app/stats/<key>/values.json`** を読む
> (`.claude/rules/data-sqlite-ssot.md`)。無ければ `/page-data-batch --metric <key>` で投入。

R2 観測値から Bar Chart Race 用の全年度データを取得し、`.local/r2/sns/bar-chart-race/<rankingKey>/` に config.json と data.json を保存する。

## ディレクトリ構造

```
.local/r2/sns/bar-chart-race/<rankingKey>/
  config.json  ← タイトル・hookText・eventLabels（編集可能）
  data.json    ← frames データ（D1 から生成）
```

## 引数

ユーザーから以下を確認すること:
- **rankingKey**: ランキングキー（必須）— `ranking_data.category_code` の値（例: `total-population`）

以下は任意（未指定の場合は既存 config.json or AI 自動生成）:
- **hookText**: フックテキスト — イントロの赤帯に表示するキャッチコピー（15文字以内）
- **eventLabels**: イベントラベル — 年度付近に表示するテキスト
- **enableSpoilerHook**: スポイラーフック — 最終年の1位を冒頭に表示するか（default: false）

## 手順

### Step 1: R2 snapshot からデータ取得

完全DBレス（Phase 6 で観測値を R2 に移行済。旧 D1/miniflare は廃止）。メタも観測値も R2 公開 URL から取得する（読み取りは認証不要）。

```bash
R2="${R2_PUBLIC_FETCH_URL:-https://storage.stats47.jp}"
```

#### 1a: メタデータ取得 (R2 ranking item.json。旧 D1 metrics cache は廃止)

```bash
# title(=category_name) と unit を取得
curl -s "$R2/app/ranking/<rankingKey>/item.json" | jq '.item | {category_name: .title, unit}'
```

#### 1b: R2 観測値ファイル確認

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$R2/app/stats/<rankingKey>/values.json"
# 404 なら /page-data-batch --metric <rankingKey> で投入 → /sync-snapshots で R2 反映
```

#### 1c: 全年度・全都道府県データ取得 (R2 から JS で)

```javascript
const R2 = process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp';
const payload = await (await fetch(`${R2}/app/stats/<rankingKey>/values.json`)).json();

// 47 都道府県 (全国・地域コードは除外)
const filtered = payload.rows.filter(r => /^\d{2}000$/.test(r.areaCode) && Number(r.areaCode.slice(0,2)) <= 47);

// 年度別グループ + 値降順
const byYear = {};
for (const r of filtered) {
  if (r.value == null) continue;
  if (!byYear[r.yearCode]) byYear[r.yearCode] = [];
  byYear[r.yearCode].push({ yearCode: r.yearCode, yearName: r.yearName, areaName: r.areaName, value: Math.round(Number(r.value)) });
}
for (const y of Object.keys(byYear)) byYear[y].sort((a, b) => b.value - a.value);
```

DISTINCT year_code: `Object.keys(byYear).sort()`

### Step 2: config.json を生成・更新

既存の `config.json` がある場合はそれをベースにする。ない場合は新規作成する。

ユーザーが hookText を指定していない場合、取得したデータを分析して **自動生成** する。

#### hookText の生成ルール（15文字以内）

データの特徴を捉えたキャッチーなフレーズを生成する。以下を参考に:
- 意外性: 「1位は東京じゃない」「最下位は意外な県」
- 変動: 「東京一人勝ち」「千葉の躍進」「北海道の凋落」
- 格差: 「10倍の差」「東西で真逆」
- 時事: 「コロナで逆転」「令和の大変動」

生成時は以下を確認:
- 最初と最後の年で順位が大きく変わった都道府県
- 1位が一貫して同じか、入れ替わりがあるか
- 上位・下位の格差の大きさ

#### eventLabels の生成ルール

データの年度範囲に応じて、日本の主要な出来事を自動付与する:
- 1991: バブル崩壊
- 1995: 阪神大震災
- 2008: リーマンショック
- 2011: 東日本大震災
- 2020: コロナ禍

年度範囲に含まれるイベントのみ選択する。

#### config.json の形式

```json
{
  "title": "都道府県別 総人口ランキング",
  "unit": "人",
  "hookText": "東京一極集中の50年",
  "eventLabels": [
    { "year": "1995", "label": "阪神大震災" },
    { "year": "2011", "label": "東日本大震災" }
  ],
  "enableSpoilerHook": true
}
```

注意:
- `enableSpoilerHook` が false の場合はフィールドを省略する
- **hookText は必ず設定すること**（自動生成 or ユーザー指定）

### Step 3: data.json を生成

取得データを年度でグループ化し、以下の形式で保存する:

```json
{
  "frames": [
    {
      "date": "1975年度",
      "items": [
        { "name": "東京都", "value": 11674000 },
        { "name": "大阪府", "value": 8278000 }
      ]
    }
  ]
}
```

注意:
- 各 frame の `items` は 47 都道府県すべて含める（topN フィルタはコンポーネント側）
- `date` は `year_name` をそのまま使用
- `value` は数値型で出力（整数の場合は小数点なし）

### Step 4: 確認

保存後、ユーザーに以下を報告する:
- 保存先パス
- title, unit
- 年度範囲（例: 1975年度 〜 2024年度）
- フレーム数（年度数）
- 各フレームの items 件数
- **hookText**（既存 or 自動生成）
- **eventLabels**

プレビューが必要な場合は `/preview-remotion --type bar-chart-race` スキルの実行を案内する。

## 参照

- `.local/r2/sns/bar-chart-race/<rankingKey>/config.json` — 設定ファイル
- `.local/r2/sns/bar-chart-race/<rankingKey>/data.json` — フレームデータ
- `.local/r2/sns/ranking/<rankingKey>/youtube/shorts.json` — 既存ランキングの hookText 参考
