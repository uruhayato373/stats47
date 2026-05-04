---
name: discover-trends
description: 指定したソース（Google Trends / GSC / はてブ / Google News / Yahoo / note.com）から急上昇トピックを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。Use when user says "トレンド検索", "トレンド発見", "GSCトレンド", "はてブトレンド", "Yahooトレンド", "ニューストレンド", "noteトレンド", "トレンド全部". 検索急上昇・自サイト需要・ネット議論・ニュース報道など複数視点で記事ネタを発見.
disable-model-invocation: true
---

複数のトレンドソースから急上昇トピックを取得し、stats47 の統計データ（`indicators` / `indicator_tags` + `tags` / `estat_metainfo`）とマッチングしてブログ記事候補を提案する。

## 用途

- トレンド起点でタイムリーな記事テーマを発見したいとき
- 複数ソースで同時に話題になっているテーマ（クロスソースヒット）を探したいとき
- `/plan-blog-articles`（カテゴリ起点）と補完的に使う

## 引数

```
$ARGUMENTS — [--source <name>] [--limit N] [--youtube]
             --source: 取得元ソース。省略時は all
                       trends:  Google Trends デイリー（検索急上昇）
                       gsc:     Google Search Console（自サイト需要）
                       hatena:  はてなブックマーク Hot Entry（ネット議論）
                       news:    Google News RSS（メディア報道・複数トピック）
                       yahoo:   Yahoo!ニュース トピックス（国内・地域に強い）
                       note:    note.com 注目記事（クリエイター層の関心）
                       all:     上記 6 ソース全部 + クロスソースヒット集計
             --limit:  候補出力件数の上限（デフォルト: 20）
             --youtube: trends 選択時のみ、YouTube トレンドも WebSearch で補助取得（任意）
```

## 手順

### Phase 1: ソース別データ取得

`--source` の値に応じて、`.claude/skills/blog/discover-trends/sources/` 配下の該当 markdown を読み、その手順に従って **そのソース固有のデータ取得** を行う。

| --source 値 | 参照ファイル | 取得元 |
|---|---|---|
| `trends` | `sources/trends.md` | Google Trends RSS (`trends.google.co.jp`) |
| `gsc` | `sources/gsc.md` | Search Console API（要サービスアカウント鍵） |
| `hatena` | `sources/hatena.md` | はてブ Hot Entry RSS（5 カテゴリ） |
| `news` | `sources/news.md` | Google News RSS（5 トピック） |
| `yahoo` | `sources/yahoo.md` | Yahoo!ニュース RSS（6 カテゴリ） |
| `note` | `sources/note.md` | note.com WebSearch + WebFetch |
| `all` | `sources/all.md` | 上記 6 ソースを並列実行し統合 |

各 sources/*.md では「Phase 1 の取得結果」として以下の共通フォーマットでトレンドキーワード一覧を整える:

```
[
  { keyword, sourceLabel, popularity, relatedUrls[], pubDate? },
  ...
]
```

- `keyword`: トレンドキーワード
- `sourceLabel`: `google-trends` / `gsc` / `hatena` / `google-news` / `yahoo` / `note` / 複数（all モードで複数ソースから出てきた場合）
- `popularity`: 検索ボリューム / ブクマ数 / スキ数 / impressions など、ソース固有の注目度指標
- `relatedUrls`: 関連記事 / 出典 URL
- `pubDate`: 公開日時（ある場合のみ）

`all` の場合は最後にキーワードで集約し、複数ソースから出ているものを **クロスソースヒット** として優先する。

### Phase 2: フィルタリング

1. 以下のカテゴリキーワードマップで、各トレンドを stats47 の 16 カテゴリに分類する。完全一致しなくても Claude のセマンティック推論でカテゴリとの関連性を判断する。

| category_key | カテゴリ名 | 関連キーワード |
|---|---|---|
| landweather | 国土・気象 | 地震, 台風, 豪雨, 猛暑, 気温, 降水量, 積雪, 面積, 土地利用, 災害, 洪水, 干ばつ, 気候変動 |
| population | 人口・世帯 | 人口, 出生, 死亡, 婚姻, 離婚, 少子化, 高齢化, 過疎, 移住, 転入, 転出, 世帯, 合計特殊出生率 |
| laborwage | 労働・賃金 | 賃金, 給料, 年収, 最低賃金, 失業, 雇用, 就職, 転職, 労働時間, 残業, 有給, 正社員, 非正規, パート |
| agriculture | 農林水産業 | 農業, 米, 野菜, 果物, 畜産, 漁業, 林業, 収穫量, 食料自給率, 農家, ブランド米, 水産物 |
| miningindustry | 鉱工業 | 工場, 製造業, 出荷額, 半導体, 自動車, 鉄鋼, 化学, 生産, 工業, 産業 |
| commercial | 商業・サービス業 | 小売, 百貨店, コンビニ, 飲食店, サービス業, 商業, 売上, 店舗数, EC, 通販 |
| economy | 企業・家計・経済 | GDP, 県内総生産, 物価, インフレ, 景気, 企業, 倒産, 起業, 家計, 消費, 貯蓄, 所得 |
| construction | 住宅・土地・建設 | 住宅, マンション, 地価, 家賃, 建設, 着工, 空き家, 不動産, リフォーム, タワマン |
| energy | エネルギー・水 | 電力, ガス, 水道, 再生可能エネルギー, 太陽光, 原発, 電気代, 光熱費, CO2, 脱炭素 |
| tourism | 運輸・観光 | 観光, 旅行, インバウンド, 宿泊, ホテル, 鉄道, 空港, 交通, 自動車保有, 道路 |
| ict | 情報通信・科学技術 | IT, インターネット, スマホ, 通信, AI, DX, スタートアップ, 研究, 特許, 科学技術 |
| educationsports | 教育・文化・スポーツ | 学校, 大学, 受験, 学力, 教育費, 図書館, 美術館, スポーツ施設, 文化, 体力 |
| administrativefinancial | 行財政 | 税収, 財政, 公務員, 地方交付税, ふるさと納税, 自治体, 議員, 選挙, 行政 |
| safetyenvironment | 司法・安全・環境 | 犯罪, 交通事故, 火災, 警察, 裁判, ゴミ, リサイクル, 環境, 大気汚染, 騒音 |
| socialsecurity | 社会保障・衛生 | 医療, 病院, 医師, 看護師, 介護, 年金, 生活保護, 健康, 平均寿命, 感染症, ワクチン, 福祉 |
| international | 国際 | 貿易, 輸出, 輸入, 外国人, 在留, 国際交流, 姉妹都市, 外資 |

2. **除外するトレンド** — 以下に該当するものは統計記事化が困難なため除外:
   - 芸能人・有名人の個人ニュース（スキャンダル、結婚、引退等）
   - スポーツの試合結果・選手個人ニュース
   - ゲーム・アニメ・漫画の新作リリース・キャラクター話題
   - TV 番組・映画の放送・上映情報
   - 政治家個人のスキャンダル・発言（政策関連は除外しない）
   - 商品・サービスの単発プロモーション
   - 海外ニュース（日本の都道府県データと結びつかないもの）
   - 事件・事故の個別速報（統計化が困難なもの）

3. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できたトレンド → Phase 3 へ
   - **除外**: 理由を簡潔に記録（Phase 6 のサマリーで報告）

### Phase 3: DB マッチング

4. 採用した各トレンドについて、ローカル D1 に対して以下のクエリを実行し関連データを検索する。

**4a. indicator_tags + tags でタグ検索:**

```sql
SELECT DISTINCT i.key AS ranking_key, i.title, i.unit, i.latest_year, t.tag_key, t.tag_name
FROM indicator_tags it
JOIN indicators i ON it.indicator_id = i.id
JOIN tags t ON it.tag_key = t.tag_key
WHERE (t.tag_key LIKE '%{keyword}%' OR t.tag_name LIKE '%{keyword}%')
  AND i.area_type = 'prefecture'
  AND i.is_active = 1
ORDER BY i.latest_year DESC;
```

※ キーワードは元のトレンドワードだけでなく、関連語・上位概念も含めて複数パターンで検索する。例: 「猛暑」→ `%猛暑%`, `%気温%`, `%熱中症%`

**4b. indicators でタイトル検索:**

```sql
SELECT DISTINCT key AS ranking_key, title, unit, latest_year
FROM indicators
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
  AND is_active = 1
ORDER BY latest_year DESC;
```

**4c. estat_metainfo で統計表カタログ検索 (registered + candidate):**

```sql
SELECT stats_data_id, title, gov_org, status, category_key, stats_field
FROM estat_metainfo
WHERE title LIKE '%{keyword}%'
ORDER BY
  CASE status WHEN 'registered' THEN 0 ELSE 1 END,
  title;
```

- `status = 'registered'` → 既に indicators に登録済み (`indicators.source_id` で参照される運用マスタ)
- `status = 'candidate'` → e-Stat 統計表カタログとして 8,399 件保持。未登録だが ID + メタは既知。新規ランキング候補として `/fetch-estat-data <statsDataId>` で取得 → `/register-ranking` で indicators 登録できる

5. マッチ結果をもとに、各トレンドのマッチ度を判定:

| マッチ度 | 基準 |
|---|---|
| ★★★ | indicators に直接関連するデータあり（記事すぐ書ける） |
| ★★☆ | estat_metainfo (status='candidate') に候補あり、または indicators に間接的な関連データあり |
| ★☆☆ | カテゴリ的に関連するが、直接マッチするデータなし（新規データ取得が必要） |

### Phase 4: 重複チェック

6. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

- 同じテーマ・切り口の既存記事がある場合、候補から除外するか「差別化ポイント」を明記する。

### Phase 5: 候補生成

7. マッチ度 ★★☆ 以上の候補について、以下の形式で記事候補を生成する:

```
## 候補: {トレンドキーワード}（マッチ度: ★★★ / ソース: {sourceLabel}）

- **トレンド概要**: {関連情報の要約}
- **注目度**: {popularity}
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **タイミング**: なぜ今このテーマが注目されているか

### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| ... | DB既存 | ... | |
| ... | e-Stat候補 | ... | 要 /fetch-estat-data |

### 記事の切り口（案）

1. {切り口1}: {概要}
2. {切り口2}: {概要}

### 推奨チャート

- {チャート種類}: {何を可視化するか}

### 次のアクション

- [ ] `/fetch-article-data` でデータ取得
- [ ] `/generate-article-charts` でチャート生成
- [ ] 記事執筆
```

8. ★☆☆ の候補は簡易リストのみ（詳細な構成案は不要）。

9. `--source all` の場合は **クロスソースヒット**（複数ソースから出ているキーワード）を優先表示する。同じキーワードが 3 ソース以上で出ていれば最優先候補として扱う。

### Phase 6: サマリー・保存

10. 全結果を以下の形式でまとめる:

```markdown
# トレンド × stats47 マッチング結果（source: {selected-source}）

> 調査日時: YYYY-MM-DD HH:MM
> ソース: {selected-source}
> トレンド総数: N件 / 採用: M件 / 除外: L件
{ all モード時のみ: > クロスソースヒット: K件 }

## 候補一覧

| # | トレンド | ソース | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | ... | ... | ★★★ | ... | ... | すぐ執筆可 |
| 2 | ... | ... | ★★☆ | ... | ... | データ取得必要 |

## 除外トレンド

| トレンド | 除外理由 |
|---|---|
| ... | 芸能人個人ニュース |

## 推奨アクション

1. {最も推奨する候補とその理由}
2. {次に推奨する候補}
```

11. Phase 5 の候補詳細 + 上記サマリーを以下に保存:

```
.claude/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md
```

- `{source}` は実行時の `--source` 値（`all` / `gsc` / `trends` 等）
- 同日に複数回実行した場合は `-2.md`, `-3.md` のように連番

12. 保存後、会話内でもサマリーを表示してユーザーに報告する。

## 注意

- **キーワードの拡張検索**: DB 検索時はトレンドキーワードそのままだけでなく、同義語・関連語・上位概念でも検索する
- **マッチ度の判断**: 機械的なキーワード一致だけでなく、統計データとトレンドの「記事としての結びつきやすさ」をセマンティックに判断する
- **`gsc` ソース固有**: 過去 7-28 日間の比較データを取るため、サービスアカウント鍵が必要。詳細は `sources/gsc.md`
- **`note` ソース固有**: 公式 RSS が無いため WebSearch + WebFetch の組み合わせ。精度は他ソースより低め
- **保存先**: 出力は必ず `.claude/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md`。会話内でもサマリーを表示

## 関連スキル

- `/plan-blog-articles` — カテゴリ起点の記事企画（本スキルと補完関係）
- `/fetch-article-data` — 候補確定後のデータ一括取得
- `/generate-article-charts` — 記事用チャート SVG 生成
- `/fetch-estat-data` — 新規データの e-Stat API 取得
- `/expert-review` — 企画の専門家レビュー
