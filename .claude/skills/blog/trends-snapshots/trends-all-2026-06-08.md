---
type: trends-snapshot
source: all
date: 2026-06-08
collected_at: "2026-06-08 (JST 午前)"
sources_run: [google-trends, gsc, hatena, google-news, yahoo, note]
sources_failed: [yahoo/life (upstream HTTP 500)]
whitepaper: skip (--whitepaper 未指定)
deep: skip (--deep 未指定)
tags: []
---

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-08（GSC 集計期間 2026-05-28〜2026-06-04 / 外部 RSS は当日取得）
> ソース: all（6 ソース並列 + クロスソース集計）
> トレンド総数: 約 180 件（外部 RSS ~150 + GSC 急上昇 3 + GSC 高 impression 40）/ 採用候補: 8 件 / 除外: 大半（個人・政治・海外・市況）
> クロスソースヒット（3 ソース以上）: 3 件（書店 / クマ出没 / 気温・天気）
> ⚠ Yahoo ライフ RSS は upstream 500 で取得不可（5 カテゴリで継続）。GSC `--whitepaper`/`--deep` は未指定のため skip。

## エグゼクティブサマリ（最重要）

stats47 は **265 記事 / 2,122 アクティブ指標**で極めて成熟しており、今回の外部トレンドの統計化テーマは **ほぼ既存記事でカバー済み**だった。今回の本質的な収穫は次の 3 種に集約される:

1. **新規記事の余地（データあり・記事なし・需要あり）= 1 件のみ**: **書店（書籍・雑誌小売業）** ── クロスソースヒット（はてブ/Google News/Yahoo の 3 ソース）＋「全国書店 1 万店割れ（ピーク時の 4 割）」という強いニュースフック＋ stats47 に未使用の指標 `book-magazine-retail-annual-sales-per-capita` あり。**今回の唯一の即執筆候補**。
2. **データ未整備の強トレンド（記事化不能・要 e-Stat 補完）= 1 件**: **クマ出没** ── クロスソースヒット（3 ソース）だが stats47 に対応指標が無い。環境省「クマ類の出没・人身被害」系の e-Stat 取り込みが先決（`--deep` 相当の補完が必要）。
3. **既存記事の CTR/順位是正（GSC 実需あり・CTR ほぼ 0）= 6 件**: 乳用牛 / うどん消費量 / 納豆消費量 / 鶏肉消費量 / 子育てしやすい県 / 長寿県ランキング2026。**新規執筆ではなく `/brushup-blog` の対象**。GSC で表示はされているのにクリックを取れていない（curiosity gap タイトル化・indexing 強化）。

> 結論: 今週は「新規 1 本（書店）＋ 既存 6 本の CTR 是正＋ クマ出没のデータ補完起票」が最も投資対効果が高い。トレンド由来の新規乱発は不要（既に網羅済み）。

## クロスソースヒット（3 ソース以上で出現）

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 | 扱い |
|---|---|---|---|---|---|---|
| 1 | 書店（書店数・書店減少） | 3 | hatena(knowledge 110users) / google-news(business) / yahoo(business) | commercial | ★★★ | **新規執筆** |
| 2 | クマ出没 | 3 | hatena(social 100users) / google-news(top) / yahoo(top+local) | safetyenvironment | ★☆☆ | **データ補完起票** |
| 3 | 気温・天気（梅雨前線含む） | 3 | google-trends(天気200,000+/気温) / google-news(top 梅雨前線) / gsc(北海道vs沖縄気温) | landweather | ★★★(既存) | brushup/既存で充足 |
| 4 | コメ価格・米 | 3 | hatena(social+economics) / google-news(business) / yahoo(business) | agriculture | ★★★(既存) | 既存にタイムリー追記 |

## 候補一覧

| # | トレンド | ソース | マッチ度 | カテゴリ | 既存記事 | 推奨アクション |
|---|---|---|---|---|---|---|
| 1 | 書店（書籍・雑誌小売業） | cross(3) | ★★★ | commercial | **なし** | **新規執筆**（即） |
| 2 | クマ出没 | cross(3) | ★☆☆ | safetyenvironment | なし | e-Stat 取り込み起票（環境省 クマ被害） |
| 3 | 乳用牛 飼育頭数ランキング | gsc(465+impr) | ★★★(既存) | agriculture | dairy-cattle-hokkaido-monopoly | **brushup**（CTR 0.2%/pos 10.5） |
| 4 | うどん消費量ランキング | gsc(~159impr) | ★★★(既存) | economy | udon-soba-food-culture / fresh-udon-soba | **brushup**（CTR 低・pos 8-11） |
| 5 | 納豆消費量 都道府県 | gsc(~59impr) | ★★★(既存) | economy | natto-consumption-east-west-divide | **brushup**（CTR 低） |
| 6 | 子育てしやすい県ランキング | gsc(25impr) | ★★★(既存) | educationsports/socialsecurity | childcare-friendly-prefecture-ranking | **brushup**（CTR 0/pos 6.7） |
| 7 | 長寿県ランキング2026 | gsc(~30impr) | ★★★(既存) | socialsecurity | health-life-expectancy-structure 他 | **brushup**（"長寿県ランキング2026" 文言で取りこぼし） |
| 8 | 鶏肉消費量 ランキング | gsc(11impr) | ★★★(既存) | economy | chicken-consumption-prefecture-gap | brushup（軽微） |

---

## 候補詳細

### 候補1: 書店（書籍・雑誌小売業）（マッチ度: ★★★ / ソース: cross-3 / 🎯 今週の最優先・唯一の新規）

- **トレンド概要**: 「全国の書店 1 万店割れ、ピーク時の 4 割余り」（読売・Yahoo ビジネス）。はてブ「学び」で 110 users（読売書店記事）。Google News ビジネスでも「全国の書店 1 万店割れ、紙の出版不振やネット書店伸長で」。**はてブ・Google News・Yahoo の 3 ソースで同時に話題＝クロスソースヒット**。
- **注目度**: はてブ 110 users / 主要 3 メディア横断 / 「ネット書店伸長・紙不振」という構造ニュース
- **分類カテゴリ**: commercial（商業・サービス業）
- **タイミング**: 書店数の節目（1 万店割れ）報道。読者の「自分の県の書店は?」需要が立ち上がるタイミング。

#### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| 書籍・雑誌小売業年間商品販売額（人口あたり） | git TS 既存 | `book-magazine-retail-annual-sales-per-capita`（statsDataId 0000010207） | **未記事化**。commercial |
| 書籍・雑誌小売業年間商品販売額（総額） | git TS 既存 | `book-magazine-retail-annual-sales`（statsDataId 0000010107） | 同上 |
| 図書館蔵書数 / 図書館数（対比素材） | git TS 既存 | `library-books` / `library-count-per-million` | 既存記事 library-books-prefecture-gap あり（内部リンク先） |

> ⚠ caveat: 指標は「販売額」であり「店舗数」ではない。記事では「書店が消える/残る県」の代理指標として扱い、`[!WARNING]` で「店舗数ではなく小売販売額」と明示すること（factual gate 対策）。

#### 記事の切り口（案・アーキタイプ D: 生活含意・対比）

1. **「本が買える県・買えない県」**: 人口あたり書籍・雑誌小売販売額の上位5/下位5を SVG 横棒で。1 万店割れの全国趨勢の中で、どの県が踏ん張りどの県が崩れたか。
2. **ネット書店 vs リアル書店の構造**: 都市部（高販売額）と地方（低販売額）の二極化を、図書館数（公共の代替）と対比。「リアル書店が消えた県は図書館で代替できているか?」
3. **タイムリー callout**: `[!NOTE]` で「全国 1 万店割れ（ピーク時 4 割）」のニュース文脈、`[!WARNING]` で「販売額 ≠ 店舗数」。

#### 推奨チャート
- 上位5+下位5 の横棒（人口あたり書籍・雑誌小売販売額）
- 散布図: 書籍小売販売額 × 図書館数（リアル書店と公共代替の相関 / B アーキタイプ要素）

#### 次のアクション
- [ ] `/fetch-article-data --metric book-magazine-retail-annual-sales-per-capita`（R2 values 直 fetch・rank=0 なら再計算）
- [ ] `/generate-article-charts`（上位5+下位5 + 散布図）
- [ ] 記事執筆 → `blog-critic`（panel/expert）PASS → `/publish-article`
- [ ] 内部リンク: `/blog/library-books-prefecture-gap`・`/blog/library-museum-cultural-capital`・`/ranking/book-magazine-retail-annual-sales-per-capita`

---

### 候補2: クマ出没（マッチ度: ★☆☆ データ未整備 / ソース: cross-3 / データ補完が先決）

- **トレンド概要**: 「宇都宮市中心部をクマが縦断」「宇都宮市立の全小中学校が休校」が Google News トップ・Yahoo トップ&地域・はてブ社会（100 users）で同時拡散。**3 ソースのクロスソースヒット**。
- **注目度**: 全国紙トップ級 + 自治体休校という社会インパクト
- **分類カテゴリ**: safetyenvironment（司法・安全・環境）/ landweather
- **タイミング**: 市街地クマ出没の季節的急増。読者の「自分の県のクマ被害は?」需要が極めて高い。

#### 使えるデータ
| データ | ソース | 状態 | 備考 |
|---|---|---|---|
| クマ出没件数 / 人身被害 都道府県別 | — | **stats47 に指標なし** | 2,122 指標を全文検索したが該当ゼロ |

- **判定**: トレンドは強いが**データが無いため現状は記事化不能（★☆☆）**。需要は明確なので、e-Stat / 環境省「クマ類による人身被害」統計の取り込みを起票する価値が高い。

#### 次のアクション（データ補完ループ ＝ `--deep` 相当を別途）
- [ ] `/search-estat "クマ 出没 被害"` / `"野生鳥獣 被害"`（環境省・農水省 鳥獣被害統計の statsDataId 探索）
- [ ] 見つかれば `/fetch-estat-data` → TS-config 追加 → `/page-data-batch` → 記事化（クロスソース需要が裏付け済）
- [ ] 見つからなければ `.claude/todo/backlog.md` に「クマ出没・鳥獣被害（都道府県）」として起票（将来 e-Stat 追加待ち）

---

### 候補3-8: GSC 実需あり・既存記事の CTR/順位是正（`/brushup-blog` 対象）

> GSC（自サイト需要）で表示はされているのにクリックがほぼ取れていない既存記事群。**新規執筆ではなく brushup**。GSC 集計 2026-05-28〜2026-06-04。

| トレンド（GSC クエリ） | 既存記事 slug | 実測（impr / CTR / pos） | 是正方針 |
|---|---|---|---|
| 乳用牛 飼育頭数ランキング（クイズ流入「中国地方5県のうち…」含む） | dairy-cattle-hokkaido-monopoly | ~465+ / 0.2% / 10.5 | curiosity gap タイトル化 + indexing 強化。クイズ需要（「中国地方5県で乳用牛最多は?」）に答える明示見出し |
| うどん消費量ランキング（多数バリアント） | udon-soba-food-culture-prefecture-map / fresh-udon-soba-consumption-prefecture-gap | ~159 / 低 / 8-11 | 「うどん消費量ランキング」を seoTitle/見出しに明示。2 記事の食い合い（カニバリ）整理 |
| 納豆 消費量 都道府県 | natto-consumption-east-west-divide / natto-consumption-expenditure | ~59 / 低 / 6.8-11.9 | 同上。2 記事のカニバリ整理 + canonical 検討 |
| 子育てしやすい県ランキング | childcare-friendly-prefecture-ranking | 25 / 0% / 6.7 | pos 6.7 で CTR 0 → タイトル curiosity gap 化が最有効 |
| 長寿県ランキング2026 / 長寿県ランキング | health-life-expectancy-structure / healthy-life-expectancy-male-female-gap | ~30 / 0% / 8 | 「長寿県ランキング2026」文言で取りこぼし。年号付き見出し・内部リンク追加 |
| 鶏肉消費量 ランキング | chicken-consumption-prefecture-gap / chicken-consumption-quantity | 11 / 低 / 9.7 | 軽微。カニバリ整理 |

#### 次のアクション
- [ ] `node .claude/scripts/blog/build-remediation-queue.mjs`（GSC×品質 統合スコア再構築）
- [ ] `/brushup-blog --target queue --next 3`（上記の高 impression × CTR 0 を優先消化）
- [ ] うどん/納豆/鶏肉は **同テーマ複数記事のカニバリ**が CTR 低下要因の可能性 → canonical / 統合 / 役割分担を blog-critic で判断

---

## 既存記事にタイムリー追記が有効（新規不要）

外部トレンドだが既存記事で充足。timely callout 追記でフレッシュネス確保:

| トレンド | 既存記事 | 追記アングル |
|---|---|---|
| コメ価格高騰（赤字150億・在庫2倍）cross-3 | rice-harvest-volume-prefecture-gap / food-price-regional-2026 | `[!NOTE]` で 2026 コメ価格・在庫状況のニュース文脈 |
| ガソリン補助の出口 | gasoline-car-society-map | `[!TIP]` 補助縮小で「車社会度の高い県ほど打撃」 |
| 物価高・地域格差（note ×3） | inflation-rate-prefecture-gap / consumer-price-regional-gap / cpi-change-regional-pattern | 既に厚くカバー。追記不要 |
| 介護保険料・施設不足・2040年（note ×4） | nursing-care-shortage-2040 / inpatient-rate-aging-burden | 既存で充足。note 需要は内部リンク強化で吸収 |
| 出生率・少子化（note ×4 + gsc） | fertility-rate-prefecture-gap / birth-death-gap-decline 他 | 既存で厚くカバー |

## 除外トレンド（主なもの）

| トレンド | 除外理由 |
|---|---|
| 総裁選 / 中傷動画 / 高市首相答弁 / 議員定数 / 国旗損壊罪 | 政治家個人・政局（政策統計化が困難） |
| イラン・イスラエル / 習近平訪朝 / 韓国新首相 | 海外（都道府県データと無関係） |
| 無期懲役求刑 / 名古屋ひき逃げ / 強盗 / 京都男児殺害 | 個別事件速報（統計化困難） |
| シャトレーゼ / ファミマ腕時計 / ネオスナック | 単発商品プロモ |
| 三山凌輝 / 出口夏希 / 佐々木蔵之介 / ムロツヨシ / 長野久義 / 阪神森下 | 芸能人・スポーツ選手個人 |
| ペルソナ6 / Switch 2 | ゲーム |
| ChatGPT刷新 / Gemini / Anthropic / AGI / クアルコム | AI 製品（都道府県差なし） |
| 日経平均 / 円安 / ビットコイン / 米半導体時価総額 | 市況（都道府県粒度なし） |
| パスポート値下げ / H3ロケット | 全国一律・単発（地域差小） |

## 推奨アクション（優先順）

1. **書店（書籍・雑誌小売業）を新規執筆** — 今回唯一のクロスソース×データあり×記事なし。`book-magazine-retail-annual-sales-per-capita` で即着手。caveat「販売額≠店舗数」を `[!WARNING]` で明示。
2. **`/brushup-blog --target queue --next 3`** — 乳用牛 / 子育てしやすい県 / 長寿県ランキング2026 を優先（GSC 高 impression × CTR 0）。うどん/納豆/鶏肉のカニバリ整理を同時に。
3. **クマ出没のデータ補完を起票** — `/search-estat "野生鳥獣 被害"` → 取得可なら記事化、不可なら `backlog.md` へ。クロスソース需要が裏付け済。
