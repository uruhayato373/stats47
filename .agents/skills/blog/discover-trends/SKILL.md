---
name: discover-trends
description: 指定ソース（Google Trends/GSC/はてブ/Google News/Yahoo/note.com）から急上昇トピックを取得し、stats47の統計データとマッチングしてブログ記事候補を提案する。--whitepaperでNotebookLM白書の切り口、--deepでe-Stat取得による補完ループも可。Use when user says "トレンド検索", "トレンド発見", "GSCトレンド", "白書トレンド" など複数視点で記事ネタを発見したいとき.
disable-model-invocation: true
primary_agent: trend-scout
co_agents: [theme-designer, blog-editor, data-ingester]
---

複数のトレンドソースから急上昇トピックを取得し、stats47 の統計データ（`indicators` / `indicator_tags` + `tags` / `estat_metainfo`）とマッチングしてブログ記事候補を提案する。

## 用途

- トレンド起点でタイムリーな記事テーマを発見したいとき
- 複数ソースで同時に話題になっているテーマ（クロスソースヒット）を探したいとき
- `/draft-from-trend`（記事化）と補完的に使う

## 引数

```
$ARGUMENTS — [--source <name>] [--limit N] [--youtube] [--whitepaper]
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
             --whitepaper: ★★☆ 以上の候補に NotebookLM 白書クエリを当て、
                       政策・社会的背景に裏打ちされた「切り口」を付与する（Phase 4.5）。
                       3 軸ヒット（トレンド需要 × 白書の切り口 × stats47 データ）を最優先候補化。
                       NotebookLM CLI + 認証が必要（ローカル環境のみ。未設置時は自動 skip）。
             --deep: `--whitepaper` 併用時のみ有効。白書が強い切り口を示すのに
                       stats47 にデータが無い候補（★☆☆）を救済する補完ループ（Phase 4.6）。
                       白書アングル → e-Stat 探索/取得 → 白書に再照会 → factual gate を
                       決定的ゲートで 1〜2 周まで回す。NotebookLM + e-Stat + R2 が必要
                       （ローカル専用）。コスト大のため対象は最大 2 候補に制限。
```

## 手順

### Phase 1: ソース別データ取得

`--source` の値に応じて、`.Codex/skills/blog/discover-trends/sources/` 配下の該当 markdown を読み、その手順に従って **そのソース固有のデータ取得** を行う。

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

1. 以下のカテゴリキーワードマップで、各トレンドを stats47 の 16 カテゴリに分類する。完全一致しなくても Codex のセマンティック推論でカテゴリとの関連性を判断する。

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

### Phase 3: R2 / references マッチング（完全DBレス）

4. 採用した各トレンドについて、R2 ranking-items snapshot と git-tracked references に対して関連データを検索する（旧 D1 indicators/tags/estat_metainfo は廃止）。

**4a. ranking-items のタグ検索:**

```bash
# tags はキーワードで絞り込む（※ ranking-items snapshot の tags バックフィルは進行中で現状は疎。
#   当面は 4b のタイトル検索が主。backlog: 2211 件 tags 恒久バックフィル）
curl -s "https://storage.stats47.jp/app/ranking-items/all.json" \
  | jq '.items[] | select((.tags // []) | map(.tagKey) | any(test("{keyword}"))) | {ranking_key: .rankingKey, title, unit, latest_year: .latestYear}'
```

※ キーワードは元のトレンドワードだけでなく、関連語・上位概念も含めて複数パターンで検索する。例: 「猛暑」→ `猛暑`, `気温`, `熱中症`

**4b. ranking-items のタイトル検索:**

```bash
curl -s "https://storage.stats47.jp/app/ranking-items/all.json" \
  | jq '.items[] | select(.title | test("{keyword}")) | {ranking_key: .rankingKey, title, unit, latest_year: .latestYear}'
```

**4c. e-Stat 統計表カタログ検索 (references + API):**

- まず git-tracked `.Codex/skills/estat/references/*.md` を検索: `grep -rniE "{keyword}" .Codex/skills/estat/references/*.md`
- 見つからなければ `/search-estat`（e-Stat API 検索）。有用な統計表は `/inspect-estat-meta` で references に追記する（DBレスの恒久カタログ）
- 新規ランキング候補は `/fetch-estat-data <statsDataId>` → TS-config (`packages/data-configs/src/metrics/<key>.ts`) 追加 + `/page-data-batch --metric <key>` で登録
- （旧 D1 `estat_metainfo` の 8,399 件自動カタログは retired D1 由来で廃止）

5. マッチ結果をもとに、各トレンドのマッチ度を判定:

| マッチ度 | 基準 |
|---|---|
| ★★★ | ranking-items に直接関連するランキングあり（記事すぐ書ける） |
| ★★☆ | e-Stat references / API に候補あり、または ranking-items に間接的な関連データあり |
| ★☆☆ | カテゴリ的に関連するが、直接マッチするデータなし（新規データ取得が必要） |

### Phase 4: 重複チェック

6. 既存記事との重複を確認（R2 blog snapshot。旧 D1 articles は廃止）:

```bash
curl -s "https://storage.stats47.jp/app/blog/all.json" | jq '.articles[] | {slug, title, tags: [.tags[].tagKey]}'
```

- 同じテーマ・切り口の既存記事がある場合、候補から除外するか「差別化ポイント」を明記する。

### Phase 4.5: 白書の切り口エンリッチ（`--whitepaper` 指定時のみ）

> **狙い**: トレンド（需要）と stats47 データ（可視化素材）だけでは「数字を並べただけの記事」になりやすい。白書（NotebookLM）から**政策的・社会的な切り口**を引き、「なぜ今このテーマにニーズがあるか」を権威ある記述で裏打ちする。3 つが揃った候補を **3 軸ヒット**（トレンド × 白書 × データ）として最優先化する。

`--whitepaper` が無い場合は本 Phase を丸ごと skip し、Phase 5 の「白書の切り口」欄は空欄のままにする。

**前提**: NotebookLM CLI（`~/bin/notebooklm`）と認証が必要。**ローカル環境専用**（リモート実行コンテナには CLI が無いため自動 skip）。利用可能ノートブックと ID は `.Codex/skills/blog/notebooklm-research/SKILL.md` の「利用可能ノートブック」表を参照。

1. **対象を絞る**: Phase 3 のマッチ度が **★★☆ 以上**、かつ Phase 4 の重複チェックを通過した候補のうち、注目度（popularity）上位 **最大 5 件**のみを対象にする。NotebookLM は 1 クエリ ~30 秒・逐次実行のため、件数を絞ることが重要。

2. **白書クエリを実行**: 各対象候補について、決定論的ラッパーを呼ぶ:

```bash
node .Codex/scripts/notebooklm-cross-query.mjs --json \
  --notebooks "最新の白書,国土交通白書" \
  "「{トレンドキーワード}」に関連して、{category名} 分野で白書が指摘している社会的課題・政策的背景・今後の方向性を教えてください。都道府県間の格差や地域差に触れた記述があれば優先してください。"
```

   - `--notebooks` は候補のカテゴリに応じて選ぶ（社会基盤・インフラ系は `国土交通白書`、人口・GX・DX 系は `最新の白書`）。迷えば両方指定。
   - `--json` で `{ answer, references }` を取得。`references` は出典明記（`<data-source>`）にそのまま使える。
   - **終了コードで分岐**（決定的）:
     - `exit 0` → 回答を解釈して切り口を抽出
     - `exit 1`（CLI 未設置）/ `exit 2`（認証期限切れ） → **本候補のエンリッチを skip**。会話・サマリーに「白書エンリッチ未実行（NotebookLM 未認証/未設置）」と明記し、`--whitepaper` 無しと同じ扱いで継続。ユーザーに `notebooklm login` を案内する
     - `exit 3`（1 ノートブックで ask 失敗） → 成功したノートブックの回答のみ使用

3. **切り口を抽出**（agent の判断）: 白書回答から、その候補を「ただのランキング」から「ニーズの高い記事」へ引き上げる切り口を 1-3 個抽出する。機械的転記でなく、トレンド・データ・白書の交点を **記事の問い** として再構成する。

   例: トレンド「医師不足」× データ「人口10万人あたり医師数ランキング」× 白書「人口減少地域での医療アクセス確保が課題」
   → 切り口「医師数ランキング下位県は"過疎で医療が届かない構造"を抱える ── 白書が指摘する地域医療の崩れを 47 都道府県データで可視化」

4. **3 軸ヒット判定**: 白書から有意な切り口が得られた候補は **3 軸ヒット**としてマーク（Phase 5・6 で最優先表示）。白書に該当記述が薄い候補は通常候補のまま（切り口欄に「白書該当記述なし」と記録）。

### Phase 4.6: 白書ドリブン・データ補完ループ（`--deep` 指定時のみ）

> **狙い**: 白書が強い切り口を示しているのに stats47 にデータが無い（★☆☆）と、今は捨てられる。本ループは「白書が要求する切り口に、データを後追いで揃える」。これにより ★☆☆ → ★★☆/★★★ への昇格を狙う。

`--whitepaper` 無しでは本 Phase は無効（`--deep` 単独指定はエラーにせず警告して skip）。**ローカル専用**（NotebookLM + e-Stat API + R2 が必要。リモートコンテナでは自動 skip）。

> ⚠ コスト大（NotebookLM ~30 秒/回 + e-Stat 取得は `fetch → TS-config → /sync-metrics-cache → /page-data-batch` の重いパイプライン）。**無条件ループは禁止。** 下記の決定的ゲートで必ず縛る。

1. **起動条件（決定的フィルタ）**: 以下を **すべて** 満たす候補のみループに入れる。最大 **2 候補**（注目度上位順）。
   - マッチ度 ★☆☆（既存データなし）
   - Phase 4.5 で白書から **強い切り口**が得られている（漠然とした言及ではなく、都道府県差・地域差に踏み込んだ記述がある）
   - Phase 3 の `estat_metainfo` 検索で `status='candidate'` すら無い（候補 ID があるなら通常の `/fetch-estat-data` で足り、ループ不要）

2. **ループ本体**（1 候補あたり **最大 2 周**）:

   **(a) e-Stat 探索**: 白書の切り口をクエリ語にして `/search-estat` で統計表を探す:
   ```
   /search-estat "{白書が指摘した社会課題のキーワード}"
   ```
   - 該当 `statsDataId` が見つからない → **その候補は離脱**（「白書アングルあり / データ未整備」として Phase 5 で ★☆☆ のまま記録、将来の e-Stat 追加待ち）

   **(b) データ取得**: 見つかった `statsDataId` を `/fetch-estat-data` で取得し、必要なら TS-config 追加 → `/sync-metrics-cache --apply` → `/page-data-batch --metric <key>`（`.Codex/rules/data-sqlite-ssot.md` の取り込みフロー準拠）。

   **(c) 白書に再照会**: 取得データの実際の上位/下位県を文脈に入れて白書へ再質問し、切り口を**実データで検証・精緻化**する:
   ```bash
   node .Codex/scripts/notebooklm-cross-query.mjs --json \
     --notebooks "最新の白書,国土交通白書" \
     "{指標名} は実データで 1位{県A}・47位{県B} だった。白書が指摘する{社会課題}と整合するか、地域差の要因として白書が挙げる論点を教えてください。"
   ```
   - 白書の論点と実データが **整合** → 「記事の問い」を確定し ★★☆/★★★ に昇格、3 軸ヒット化
   - **不整合**（白書の見立てとデータが食い違う）→ それ自体が curiosity gap（「白書はこう言うが、データは逆」）。逆説アングルとして採用可

   **(d) factual gate（終了条件の一部）**: 確定した切り口に登場する数値が取得データと一致するか、`article-factual-check.mjs` の `checkValueClaims` 相当で確認できる状態にする（実記事執筆時の blocker を企画段階で前倒し）。

3. **終了条件（いずれか）**:
   - データ取得済 ∧ 白書整合（or 有意な逆説）∧ 切り口に出典付与 → **成功（昇格）**
   - 2 周到達 / `/search-estat` 該当なし / e-Stat 取得失敗 → **離脱**（理由を記録、★☆☆ のまま）

4. ループ結果を Phase 5 候補に反映。昇格した候補は「次のアクション」の `fetch-ranking-data-r2.mjs` を **取得済データ参照**に置き換える。

### Phase 5: 候補生成

7. マッチ度 ★★☆ 以上の候補について、以下の形式で記事候補を生成する:

```
## 候補: {トレンドキーワード}（マッチ度: ★★★ / ソース: {sourceLabel}{ / 🎯3軸ヒット}）

- **トレンド概要**: {関連情報の要約}
- **注目度**: {popularity}
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **タイミング**: なぜ今このテーマが注目されているか

### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| ... | DB既存 | ... | |
| ... | e-Stat候補 | ... | 要 /fetch-estat-data |

### 白書の切り口（NotebookLM ／ `--whitepaper` 時のみ）

> Phase 4.5 で白書から得た切り口。`--whitepaper` 無し or skip 時はこの節を省略。

- {白書が指摘する社会的課題・政策的背景の要約}（出典: {ノートブック名 / references}）
- **記事の問い**: {トレンド × データ × 白書 の交点を問いとして再構成}

### 記事の切り口（案）

1. {切り口1}: {概要}
2. {切り口2}: {概要}

### 推奨チャート

- {チャート種類}: {何を可視化するか}

### 次のアクション

- [ ] `fetch-ranking-data-r2.mjs` でデータ取得
- [ ] `/generate-article-charts` でチャート生成
- [ ] 記事執筆（白書の切り口がある場合は `<data-source>` で出典明記）
```

- **3 軸ヒット**（トレンド需要 × 白書の切り口 × stats47 データ が揃った候補）は `🎯3軸ヒット` を見出しに付与し、Phase 6 サマリーの最上段に並べる。クロスソースヒットと並ぶ最優先シグナル。

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
{ --whitepaper 時のみ: > 3軸ヒット: J件（白書エンリッチ: 実行 / skip <理由>） }
{ --deep 時のみ: > データ補完ループ: 投入 P件 / 昇格 Q件 / 離脱 R件（離脱理由内訳） }

## 候補一覧

| # | トレンド | ソース | マッチ度 | カテゴリ | 白書切り口 | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|---|
| 1 | ... | ... | ★★★ 🎯 | ... | あり | ... | すぐ執筆可 |
| 2 | ... | ... | ★★☆ | ... | なし | ... | データ取得必要 |

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
.Codex/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md
```

- `{source}` は実行時の `--source` 値（`all` / `gsc` / `trends` 等）
- 同日に複数回実行した場合は `-2.md`, `-3.md` のように連番

12. 保存後、会話内でもサマリーを表示してユーザーに報告する。

## 注意

- **キーワードの拡張検索**: DB 検索時はトレンドキーワードそのままだけでなく、同義語・関連語・上位概念でも検索する
- **マッチ度の判断**: 機械的なキーワード一致だけでなく、統計データとトレンドの「記事としての結びつきやすさ」をセマンティックに判断する
- **`gsc` ソース固有**: 過去 7-28 日間の比較データを取るため、サービスアカウント鍵が必要。詳細は `sources/gsc.md`
- **`note` ソース固有**: 公式 RSS が無いため WebSearch + WebFetch の組み合わせ。精度は他ソースより低め
- **`--whitepaper` 固有**: NotebookLM CLI + 認証必須（**ローカル環境専用**）。リモート実行コンテナでは CLI 不在のため自動 skip。1 候補 ~30 秒・逐次のため対象を ★★☆ 以上の上位 5 件に絞る。回答は転記でなく **記事の問い** に再構成する（白書の文言コピペは AI 生成感を招く）
- **`--deep` 固有**: e-Stat 取得を伴う重い補完ループ。**必ず起動条件（★☆☆ ∧ 白書強アングル ∧ candidate 無し）と最大 2 候補・最大 2 周のゲートで縛る**（無条件ループ禁止）。ループ制御は決定的に、切り口の良し悪し判定のみ agent。`/search-estat` 該当なしは即離脱（無いデータは作れない）
- **企画と執筆の分離**: 本スキルは企画素材（白書の切り口を含む）の発見まで。公開済記事を白書で深掘り補強するのは `/notebooklm-research`（目的が異なる）
- **保存先**: 出力は必ず `.Codex/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md`。会話内でもサマリーを表示

## 関連スキル

- `/draft-from-trend` — metric 起点の記事化（本スキルと補完関係）
- `/notebooklm-research` — 白書 NotebookLM クエリ（本スキルは**企画段階**で白書を当てる、`/notebooklm-research` は**公開済記事の深掘り補強**。同じラッパー `notebooklm-cross-query.mjs` を共用）
- `fetch-ranking-data-r2.mjs` — 候補確定後のデータ一括取得
- `/generate-article-charts` — 記事用チャート SVG 生成
- `/search-estat` — `--deep` ループで白書アングルに合う統計表を探索
- `/fetch-estat-data` — 新規データの e-Stat API 取得（`--deep` ループのデータ補完）
- `/expert-review` — 企画の専門家レビュー
