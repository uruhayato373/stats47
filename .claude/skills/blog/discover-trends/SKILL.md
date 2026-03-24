Google Trends のデイリートレンドを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。

## 用途

- トレンド起点でタイムリーな記事テーマを発見したいとき
- 既存の統計データと時事ネタを結びつけた記事企画が欲しいとき
- `/plan-blog-articles`（カテゴリ起点）と補完的に使う

## 引数

```
$ARGUMENTS — [--youtube]
             --youtube: YouTube トレンドも WebSearch で補助取得（任意）
```

## 手順

### Phase 1: トレンド取得

1. Google Trends RSS を WebFetch で取得:

```
URL: https://trends.google.co.jp/trending/rss?geo=JP
```

- 各 `<item>` から以下を抽出:
  - `<title>` — トレンドキーワード
  - `<ht:approx_traffic>` — 検索ボリューム（例: "200,000+"）
  - `<ht:news_item>` 内の `<ht:news_item_title>` — 関連ニュースタイトル
  - `<ht:news_item_url>` — 関連ニュース URL

2. `--youtube` オプションが指定された場合、WebSearch で「YouTube トレンド 日本 今日」を検索し、上位の話題を補助情報として収集する。

### Phase 2: フィルタリング

3. 以下のカテゴリキーワードマップを使い、各トレンドを stats47 の 16 カテゴリに分類する。マップに完全一致しなくても、Claude のセマンティック推論でカテゴリとの関連性を判断すること。

**カテゴリキーワードマップ:**

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

4. **除外するトレンド** — 以下に該当するトレンドは統計記事化が困難なため除外:
   - 芸能人・有名人の個人ニュース（スキャンダル、結婚、引退等）
   - スポーツの試合結果・選手個人ニュース
   - ゲーム・アニメ・漫画の新作リリース・キャラクター話題
   - TV 番組・映画の放送・上映情報
   - 政治家個人のスキャンダル・発言（政策関連は除外しない）
   - 商品・サービスの単発プロモーション

5. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できたトレンド → Phase 3 へ
   - **除外**: 理由を簡潔に記録（Phase 6 のサマリーで報告）

### Phase 3: DB マッチング

6. 採用した各トレンドについて、ローカル D1 で以下のクエリを実行し関連データを検索する。SQLite ファイルは `.local/d1/` 配下にある。

**6a. ranking_tags でタグ検索:**

```sql
SELECT DISTINCT ri.ranking_key, ri.title, ri.unit, ri.latest_year, rt.tag
FROM ranking_tags rt
JOIN ranking_items ri ON rt.ranking_key = ri.ranking_key AND rt.area_type = ri.area_type
WHERE rt.tag LIKE '%{keyword}%'
  AND ri.area_type = 'prefecture'
ORDER BY ri.latest_year DESC;
```

※ キーワードは元のトレンドワードだけでなく、関連語・上位概念も含めて複数パターンで検索する。例: トレンド「猛暑」→ `%猛暑%`, `%気温%`, `%熱中症%`

**6b. ranking_items でタイトル検索:**

```sql
SELECT DISTINCT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
ORDER BY latest_year DESC;
```

**6c. estat_stats_tables で統計表カタログ検索:**

```sql
SELECT stats_data_id, title, gov_org, status, category_key
FROM estat_stats_tables
WHERE title LIKE '%{keyword}%'
ORDER BY status, title;
```

- `status = 'registered'` → 既存データあり、すぐ使える
- `status = 'candidate'` → 未登録候補、`/fetch-estat-data` で取得が必要

7. マッチ結果をもとに、各トレンドのマッチ度を判定:

| マッチ度 | 基準 |
|---|---|
| ★★★ | ranking_items に直接関連するデータあり（記事すぐ書ける） |
| ★★☆ | estat_stats_tables に候補あり、または ranking_items に間接的な関連データあり |
| ★☆☆ | カテゴリ的に関連するが、直接マッチするデータなし（新規データ取得が必要） |

### Phase 4: 重複チェック

8. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

- 同じテーマ・切り口の既存記事がある場合、候補から除外するか「差別化ポイント」を明記する。

### Phase 5: 候補生成

9. マッチ度 ★★☆ 以上の候補について、以下の形式で記事候補を生成する:

```
## 候補: {トレンドキーワード}（マッチ度: ★★★）

- **トレンド概要**: {関連ニュースの要約}
- **検索ボリューム**: {approx_traffic}
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

10. ★☆☆ の候補は簡易リストのみ（詳細な構成案は不要）。

### Phase 6: サマリー・保存

11. 全結果を以下の形式でまとめる:

```markdown
# トレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> トレンド総数: N件
> 採用: M件 / 除外: L件

## 候補一覧

| # | トレンド | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|
| 1 | ... | ★★★ | ... | ... | すぐ執筆可 |
| 2 | ... | ★★☆ | ... | ... | データ取得必要 |
| ... | | | | | |

## 除外トレンド

| トレンド | 除外理由 |
|---|---|
| ... | 芸能人個人ニュース |
| ... | ゲーム新作リリース |

## 推奨アクション

1. {最も推奨する候補とその理由}
2. {次に推奨する候補}
```

12. Phase 5 の候補詳細 + 上記サマリーを `docs/21_ブログ記事原稿/trends-YYYY-MM-DD.md` に保存する。同日に複数回実行した場合は `trends-YYYY-MM-DD-2.md` のように連番を付与する。

13. 保存後、会話内でもサマリーを表示してユーザーに報告する。

## 注意

- **出力先**: `docs/21_ブログ記事原稿/trends-YYYY-MM-DD.md` に保存。会話内でもサマリーを表示する
- **RSS フォーマット**: Google Trends RSS は XML 形式。WebFetch の結果から `<item>` 要素を正確にパースすること
- **検索キーワードの拡張**: DB 検索時はトレンドキーワードそのままだけでなく、同義語・関連語・上位概念でも検索する。Claude の知識を活用して適切な検索語を生成すること
- **マッチ度の判断**: 機械的なキーワード一致だけでなく、統計データとトレンドの「記事としての結びつきやすさ」をセマンティックに判断する

## 関連スキル

- `/plan-blog-articles` — カテゴリ起点の記事企画（本スキルと補完関係）
- `/fetch-article-data` — 候補確定後のデータ一括取得
- `/generate-article-charts` — 記事用チャート SVG 生成
- `/fetch-estat-data` — 新規データの e-Stat API 取得
- `/expert-review` — 企画の専門家レビュー
