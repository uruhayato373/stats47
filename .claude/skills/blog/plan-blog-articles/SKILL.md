---
name: plan-blog-articles
description: カテゴリ別ブログ記事企画を自動生成し構成案として保存する。Use when user says "記事企画", "ブログ企画", "記事ネタ". データインベントリ・トレンド・SEO を考慮.
---

指定カテゴリのブログ記事企画を自動生成し、構成案ファイルとして保存する。

## 用途

- カテゴリ単位でブログ記事のテーマ・構成案を一括生成したいとき
- 既存指標 + e-Stat 未登録データを組み合わせた企画を立てたいとき
- SEO・季節性・データ掛け合わせを考慮した記事企画が欲しいとき

## 引数

```
$ARGUMENTS — categoryKey [articleCount]
             categoryKey: 対象カテゴリ（例: energy）
             articleCount: 生成する企画数（デフォルト: 5）
```

## カテゴリキー → e-Stat 分野コードマッピング

| category_key | e-Stat分野コード | 分野名 |
|---|---|---|
| landweather | 01 | 国土・気象 |
| population | 02 | 人口・世帯 |
| laborwage | 03 | 労働・賃金 |
| agriculture | 04 | 農林水産業 |
| miningindustry | 05 | 鉱工業 |
| commercial | 06 | 商業・サービス業 |
| economy | 07 | 企業・家計・経済 |
| construction | 08 | 住宅・土地・建設 |
| energy | 09 | エネルギー・水 |
| tourism | 10 | 運輸・観光 |
| ict | 11 | 情報通信・科学技術 |
| educationsports | 12 | 教育・文化・スポーツ |
| administrativefinancial | 13 | 行財政 |
| safetyenvironment | 14 | 司法・安全・環境 |
| socialsecurity | 15 | 社会保障・衛生 |
| international | 16 | 国際 |

## 手順

### Phase 1: データインベントリ

以下の優先順で参照し、利用可能な指標を把握する:

1. **estat_stats_tables**（DB）— 統計表カタログ。カテゴリの全統計表（登録済み＋候補）を一括検索:

```sql
-- カテゴリの全統計表カタログ
SELECT stats_data_id, title, gov_org, status, class_inf
FROM estat_stats_tables
WHERE category_key = '<categoryKey>'
ORDER BY status, title;
```

- `status = 'registered'`: 既存指標あり、すぐ記事で使える
- `status = 'candidate'`: 未登録候補。記事で使う場合は `/fetch-estat-data` での新規取得が必要
- `class_inf`（registered のみ JSON）: 各統計表で取得できる指標一覧（cat01 等のコード・名前・単位）

2. **ranking_items + source_config**（DB）— 登録済みランキングの e-Stat パラメータ:

```sql
SELECT ri.ranking_key, ri.ranking_name, ri.unit, ri.source_config
FROM ranking_items ri
WHERE ri.category_key = '<categoryKey>' AND ri.is_active = 1
  AND ri.area_type = 'prefecture';
```

`source_config` JSON に `statsDataId`, `cdCat01` 等が格納されている。

3. **e-Stat API 検索** — 上記でカバーできない場合のみ実行。`/search-estat` 相当の検索を行う

4. 既存ブログ記事との重複チェック:

```sql
SELECT slug, title, tags FROM articles;
```

既存記事のスラッグ・タイトル・タグを把握し、同じテーマの企画を避ける。

### Phase 2: 記事テーマ発想

5. Web 検索で対象カテゴリのトレンド・ニュース・季節性を調査:
   - 「都道府県 {分野名} ランキング」で検索し、競合記事を把握
   - 「{分野名} 2026 トレンド」「{分野名} ニュース」で時事ネタを収集
   - 季節フック（年度末、夏休み、年末年始など）との関連を検討

6. 指標同士の掛け合わせ候補を列挙:
   - 同カテゴリ内の指標間（例: 出生数 × 婚姻率）
   - 異カテゴリの指標との掛け合わせ（例: エネルギー消費 × 産業構造）
   - 散布図・相関分析に適した組み合わせを優先

7. SEO キーワード候補の検討:
   - ロングテールキーワードを意識（「都道府県別 ○○ ランキング」形式）
   - 既存記事でカバーしていない検索意図を狙う

### Phase 3: 構成案生成

8. 各テーマについて以下の構成案を生成する。stats47 の記事トーン（データ中心・客観的・読みやすい）に合わせること:

**出力フォーマット（1記事分）:**

```yaml
## 記事企画: {slug}

- title: "..."
- subtitle: "..."
- description: "..."
- category: {categoryKey}
- tags: [タグ1, タグ2, ...]
- target: ターゲット読者
- seasonal_hook: 季節性（任意）
- seo_keywords: [kw1, kw2, ...]

### 使用データ

| 指標 | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| 指標名 | DB既存 | ranking-key-here | |
| 指標名 | e-Stat新規 | statsDataId + cdCat01 | 要 /fetch-estat-data |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 指標A | 都道府県別の色分け |
| 2 | scatter | 指標A × 指標B | 相関分析 |
| 3 | line | 指標A（時系列） | 全国推移 |

### 骨子

1. リード文: ...
2. セクション1: ...
3. セクション2: ...
4. データ出典
5. 関連ランキングリンク
```

利用可能なチャート種類:
- `bar`: 上位10・下位10の横棒グラフ（メインランキング表示）
- `tile-grid-map`: 都道府県タイルマップ（地域差の俯瞰）
- `line`: 折れ線グラフ（全国時系列推移）
- `scatter`: 散布図（2指標の相関分析）
- `stacked-bar`: 積み上げ棒グラフ（構成比較）
- `summary-findings`: まとめ表（記事末尾のファインディング一覧）

### Phase 4: 出力

9. `docs/20_ブログ記事企画/<categoryKey>.md` に保存。ファイル冒頭に以下のヘッダーを付与:

```markdown
# {カテゴリ名}（{categoryKey}）— ブログ記事企画

> 生成日: YYYY-MM-DD
> 既存指標数: N件
> 企画数: M件

---
```

10. 生成結果のサマリーをユーザーに報告:
    - 企画数
    - 各企画の slug と title の一覧
    - DB 既存データのみで書ける記事 vs e-Stat 新規取得が必要な記事の内訳

## タイトル設計ルール

フロントマターの `title` と `subtitle` は OGP 画像にそのまま使用される。

### ランキングページとの差別化（必須）

stats47 にはランキングページ（`/ranking/xxx`）とブログ記事（`/blog/xxx`）があり、検索カニバリを防ぐため title と slug で明確に差別化する。

| | ランキングページ `/ranking/` | ブログ記事 `/blog/` |
|---|---|---|
| 検索意図 | データ参照（「○○ ランキング 都道府県」） | 分析・洞察（「なぜ○○か」「○○の実態」） |
| title | `{指標名}` | **洞察・発見・対比**を示す |
| slug | `{ranking-key}` | **記事の切り口**を反映 |

**title ルール:**
- `title` を「○○ランキング」にしない。ランキングページと同じ検索キーワードで競合するため
- 「○○格差」「○○の地域差」も多用しない。パターン化して全記事が同じに見える
- 記事の**洞察・発見・対比**をタイトルにする。読者が「読みたい」と思う具体性・意外性を入れる
- NG: `製造品出荷額ランキング` → ランキングページと競合
- NG: `失業率2倍差の労働市場格差` → 「格差」パターンに逃げている
- OK: `愛知58兆円一強の製造業地図`（発見型）
- OK: `自前で稼げる自治体はどこか`（疑問型）
- OK: `5軒に1軒が空き家の県がある`（自分ごと化）
- OK: `森林大国なのに林業は稼げない`（逆説型）
- OK: `結婚も離婚も日本一は沖縄`（意外性）

**slug ルール:**
- slug に `-ranking` を付けない。`/ranking/` ページの URL と混同されるため
- 記事の切り口・ストーリーを反映する命名にする
- NG: `manufacturing-shipment-ranking`
- OK: `manufacturing-powerhouse-aichi-115x-gap`
- OK: `dual-income-household-gap`

### title の書式

- **上限: 17全角文字相当**（OGP 画像で1行に収まる最大サイズ）
- 全角文字=1、半角文字=0.5 でカウント
- 「都道府県別・」は省略する（サイト自体が都道府県統計のため冗長）
- `title` に `──` や `｜` を含めない（title / subtitle に分離）
- タイトルパターン（多様に使い分ける。同じパターンばかりにしない）:
  - 意外性: `結婚も離婚も日本一は沖縄` / `都会ほどスポーツをする逆説`
  - 逆説: `森林大国なのに林業は稼げない` / `寿命は延びたが不健康期間も延びた`
  - 疑問: `自前で稼げる自治体はどこか` / `賃金が高い県は本当に豊かか`
  - 自分ごと化: `5軒に1軒が空き家の県がある` / `月の生活費は県で1.4倍違う`
  - 発見: `愛知58兆円一強の製造業地図` / `北海道1.3兆円、農業の独走態勢`
  - 対比: `旅館vsホテル 宿泊者数4倍差の二極化`

### subtitle

- フック・数値比較（OGP の小さな文字）。読者の興味を引くデータや対比
  - 例: `東京107.8L vs 滋賀58.0L`
  - 例: `出生数72.7万人、死亡数157.6万人`
- ページの `<title>` タグには `title` のみ使用。`subtitle` は OGP 画像とページのサブヘッダーに使用

## 品質チェックリスト

生成した企画について以下を自己検証すること:

- [ ] 既存記事（articles テーブル）と同じテーマが含まれていないか
- [ ] チャート構成で指定した種類が利用可能なものか
- [ ] 記事骨子が stats47 のトーン（データ中心・客観的）に合っているか
- [ ] slug がケバブケースで、既存記事と重複しないか

## 企画から原稿を作成するとき

企画が確定したら、`docs/21_ブログ記事原稿/` に `.local/r2/blog/` と同じ構成で原稿を作成する:

```
docs/21_ブログ記事原稿/<slug>/
├── article.md       # 記事本文（フロントマター + Markdown）
└── data/            # JSON データ・SVG チャート
```

- 企画の `.md` ファイル（`docs/20_ブログ記事企画/`）は原稿完成後に削除する（ライフサイクルルール）
- データ取得は `/fetch-article-data`、チャート生成は `/generate-article-charts` を使用

## 注意

- **レートリミット**: e-Stat API は 60req/min。Phase 1 の API 検索は最小限に
- **estat_stats_tables の活用**: DB の `estat_stats_tables` テーブルに全カタログ（~8,400件）が格納済み。e-Stat API を叩く代わりにこのテーブルを優先して使う
- **季節フックは無理に入れない**: 該当しない場合は空欄で良い

## 関連スキル

- `/search-estat` — e-Stat API の統計表検索（Phase 1 で参照）
- `/fetch-estat-data` — 企画確定後、新規データの取得に使用
- `/fetch-article-data` — 記事執筆時のデータ一括取得
- `/generate-article-charts` — 記事用チャート SVG 生成
- `/expert-review` — 企画の専門家レビュー
- `/panel-review` — 企画のパネルレビュー
