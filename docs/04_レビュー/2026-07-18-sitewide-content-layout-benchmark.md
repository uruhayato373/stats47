---
type: design-review
date: 2026-07-18
status: proposed
scope: header, blog, ranking, right-rail, OGP, thumbnail, link-card
tags: [ui, ux, benchmark, content-design, seo, monetization]
---

# stats47 コンテンツ配置・外部ベンチマーク改善提案

## 0. エグゼクティブサマリ

stats47は部品・データ・画像生成基盤は既に強い。改善すべき中心は「さらに部品を増やすこと」ではなく、
**検索→答え→根拠→深掘り→次のページ**の順序を全ページで揃えることである。

提案する全体構造:

```text
Header: ロゴ | ランキング | テーマ | ブログ | 都道府県 | 検索
                            ↓
Page:   問い/H1 → 結論visual → 根拠/出典 → 深掘り → 次の行動
                            ↓
Rail:   ページ内ナビ → 関連コンテンツ → 運営者 → 文脈広告 → 汎用広告
                            ↓
Card:   visual → 種別 → 結論型title → 補助meta → クリック先
```

優先施策は次の5つ。

1. Headerへ「都道府県」を復帰し、検索を主操作として維持する。
2. ブログ記事冒頭に既存OGP/thumbnailをそのまま置かず、記事固有visualを条件付きで表示する。
3. ランキング詳細を「結論→全国分布→表→理由→関連」の順に固定する。
4. 右レールを関連情報優先にし、販促・広告を下へ送る。モバイルへ右レール全部を積み下ろさない。
5. OGP、thumbnail、link cardを同じcontent manifestから生成しつつ、用途別layoutは分ける。

## 1. 外部サイトの選定と注意

「アクセス数が多い」は参考サイト選定の一要素だが、第三者推計と自社公表を混同しない。Similarwebのmonthly visitsは
desktop/mobileの推計sessionであり、実GAとは一致しない場合があるため、本レビューでは規模の厳密な順位付けには使わず、
大規模コンテンツ運用で公開されている設計思想を重視する。

### 1.1 参考サイト

| site | 参考にする理由 | 移植する型 | 移植しないもの |
|---|---|---|---|
| Our World in Data | 14,000超chart、100超topicを横断するdata publication | 検索、topic browse、dataを前面化、content type分離 | 長文英語publicationの密度 |
| Data Commons | 2500億data point規模、自然言語検索とmap/timeline/scatter | 問いからデータへ直行、place/variable探索 | 汎用knowledge graph UI |
| Statista | 大量statistics/topicを商品化 | most viewed/recent/topicの分離、関連導線 | paywall、過密mega nav |
| Google Search/Images | 画像発見とrich resultの技術要件 | representative image、HTML img、alt、構造化data | 検索結果を目的にした過剰SEO |
| 都道府県格付研究所 | 国内の都道府県rankingを大量分類 | 県/カテゴリ/地図という入口の並列 | 古い視覚表現、独自格付の模倣 |

Our World in Dataは2024年のhome redesignで、prominent search、topic一覧、記事/topic/data visualizationのcontent type分離、
interactive chartのhome掲載を明示した。stats47にも「検索」「カテゴリ/テーマbrowse」「注目データ」の3入口は合う。

Data Commonsは自然言語queryからtimeline/map/scatterへ接続する。stats47は生成AI検索を急いで追加する必要はないが、
検索候補を「問い」「ランキング」「県」「テーマ」で分け、結果から直接visualへ到達させる設計は有効である。

Statistaはtopic内でmost viewedとrecentを分ける。stats47も「注目」「新着」「関連」を同じカードgridに混ぜず、選定理由を
labelで示すべきである。

参考URL:

- [Our World in Data homepage redesign](https://ourworldindata.org/homepage-redesign)
- [Our World in Data](https://ourworldindata.org/)
- [Data Commons overview](https://docs.datacommons.org/what_is.html)
- [Statista Topic Overview](https://www.statista.com/topics/)
- [Google Image SEO best practices](https://developers.google.com/search/docs/appearance/google-images)
- [都道府県格付研究所](https://grading.jpn.org/)
- [Similarweb monthly visitsの定義](https://support.similarweb.com/hc/en-us/articles/115000501465-Monthly-Visits)

## 2. 現状評価

### 強み

- sticky headerに検索、主要nav、mobile drawer、active stateがある。
- `ArticleShell`で本文と360px railが揃っている。
- ranking/blog/surveyのreading zoneが統一されている。
- ranking thumbnailはmap/number variant、blogはlight/dark thumbnailを持つ。
- OGPはranking/category/area/blogでroute別に生成できる。
- `SurfaceLinkCard`、`RailCard`、`ChartPanel`等の共通部品がある。
- right railは本文関連widgetを販促より上にする設計意図を既に持つ。

### 課題

- Headerのdesktop主要navがランキング、ブログ、テーマに絞られ、stats47固有の「都道府県から探す」が隠れている。
- home heroの実装と「home hero撤去」の設計文書が不整合。
- ブログ記事headerに記事visualがなく、一覧thumbnailから詳細への視覚連続性が切れる。
- ブログrailは運営者→関連ranking→関連記事→promo×2→広告→text adsで長く、本文関連が広告群に埋もれやすい。
- rail全体をmobile本文下へ積むため、記事読了後の次行動が散漫になる。
- ranking詳細の関連情報はtext link中心で、代表値/地図/thumbnailを活かし切れていない。
- OGP、thumbnail、in-page imageの役割が混ざりやすい。
- link cardの情報量が場所ごとに異なり、titleだけのcardとvisual付きcardの優先関係が不明確。
- `RankingThumbnail`失敗時の`No Image`は内部状態を読者へ露出する。

## 3. Header

### 3.1 推奨desktop IA

```text
[stats47]  ランキング  都道府県  テーマ  ブログ      [統計を検索________] [theme]
```

- 「ランキング」: `/ranking`。categoryはdropdown内へ。
- 「都道府県」: `/areas`。stats47の固有価値でありprimary navへ戻す。
- 「テーマ」: 現在のmega menuを維持。ただし22件を平坦に並べず、4〜6group + 人気theme + 全て見る。
- 「ブログ」: `/blog`。
- 検索: desktop常設を維持し、placeholderを「年収、人口、東京都…」の具体例へする。

### 3.2 検索改善

- submit後の検索ページだけでなく、入力中に上位5件を候補表示する。
- 候補を`ランキング`、`都道府県`、`テーマ`、`記事`でgroup化する。
- keyword一致だけでなく、同義語と読み仮名は決定的indexへ持つ。
- recent queryのlocal保存はopt-in不要な端末localで可能だが、個人情報化しうるqueryはanalyticsへ生送信しない。
- shortcut `/` または`⌘K`はdesktopだけ補助。見える検索欄を置き換えない。

### 3.3 Mobile

- headerはmenu、logo、searchの3操作を優先。theme toggleはdrawer内へ移す案をtestする。
- drawer先頭へ検索input、続いて4 primary nav、最近見た県/ランキングはlocal-onlyで条件付き。
- 44px target、focus trap、Escape、scroll lockを維持する。

### 3.4 Headerでしないこと

- promo、広告、SNS iconを入れない。
- mega menuへ17 category + 22 theme + 47県を同時表示しない。
- nav labelへiconを増やしすぎない。desktopでは文字識別を優先する。
- header高さを64px以上へ拡大しない。

## 4. Home

外部の成功パターンは「大きなブランド画像」ではなく、複数の探索経路を早く示すことにある。

推奨順:

1. compact mission + search/primary CTA。
2. Featured Rankings（実data visual）。
3. 入口4枚: ranking / areas / themes / blog。
4. 人気と新着を別sectionにする。
5. 代表interactive chart 1件。
6. 全カテゴリ/テーマbrowse。

home heroはA/B対象とし、画像heroを残す場合も高さを抑え、画像がなくてもH1/CTAが成立すること。primary KPIは
hero CTA CTRだけでなく、Featured Rankings到達率、検索利用率、LCPを併用する。

## 5. ブログ一覧・記事詳細

### 5.1 一覧

カードは次で統一する。

```text
[16:9 thumbnail]
[カテゴリ/タグ]  [更新日]
結論またはcuriosity gapを含むtitle（2〜3行）
description（desktopのみ2行）
```

- 現行gridはthumbnailしか視認できない構造になりやすいため、title/metaをcard内へ必ず含める。
- 最初の1件だけfeatured largeにする案は、記事間のtraffic集中が許容できる場合に実験する。
- `人気記事`はGA4直近28日等の実測、`新着`はpublishedAt、`編集部おすすめ`はauthored catalogと出所を分ける。
- popularを「おすすめ」と曖昧に呼ばない。

### 5.2 記事header

順序:

```text
eyebrow / PR表記
H1
subtitle（結論要約）
published / updated / author / reviewed
share
記事固有visual（条件付き）
3行要約
mobile TOC
本文
```

- 記事固有visualは地図、chart、比較diagramがある場合に表示する。
- OGPの文字入り画像をそのまま記事冒頭へ置かない。H1重複と小さい文字を生む。
- AI背景しかない記事はheader visualを省略する。
- publishedだけでなくupdatedを表示し、統計年次と記事更新を区別する。
- 記事冒頭のmobile affiliateは、最初のdata visual/要約より前に置かない。

### 5.3 本文

- 冒頭100〜150字で問いへの答えを出す。
- chartの直前に「何を見るか」、直後に「何が分かるか」を置く。
- 出典、年度、単位、更新日はchart footerへ固定。
- 長いranking tableはTop5/Bottom5 preview + 全件展開にする。
- 関連link cardは段落途中へ乱発せず、section末または記事末で2〜4件。
- 同一記事内で同じrankingへのCTAを複数variantで重複させない。

## 6. ランキング一覧・詳細

### 6.1 一覧

- category browse、検索、人気、新着を明確に分ける。
- cardはthumbnail、title、最新年、単位、1位県を基本情報にする。
- visualはAI写真でなくmap/number thumbnail。
- 1位だけを煽るtitleにせず、データ定義が分かる正式titleを残す。
- filter/sort stateをURLに持ち、戻る操作で維持する。

### 6.2 詳細の推奨順

```text
Breadcrumb
H1 + 定義 + 年度/出典 + share
結論: 1位 / 最下位 / 全国差
主要visual: map or ranking bar
47県表 + year/basis controls
読み解き: なぜ差があるか（仮説と根拠を分離）
時系列 / 相関 / 補助chart
FAQ
関連ranking / related blog / survey
```

- `RankingHeroCard`の暗色stat asideは情報として有効。ただしpage hero画像を追加しない。
- 1位・最下位だけでなく中央値または全国平均を置く。
- table、map、barで同じ47値を同時にすべて展開せず、tab/segmented controlで主表示を選べるよう検討する。
- 「CSV」「出典」「定義」をchart近傍にまとめる。
- 関連ranking cardへmini visualまたは1位県を加え、title-only listとの差を作る。

## 7. 右サイドバー

### 7.1 原則

railは「本文に付随する第2のページ」ではない。ユーザーの現在地に応じ、最大4groupに絞る。

```text
1. 今いるページのナビ（TOC / 年度 / 関連survey）
2. 次に読む関連content（3〜5件）
3. 信頼要素（運営者/出典）
4. 文脈一致promo 1件 + ad 1枠
```

### 7.2 Blog rail

desktop推奨:

1. sticky TOC。
2. 関連ranking 3件。
3. 関連記事3件。
4. operator compact。
5. 文脈一致promo 1件。
6. ad 1枠。

現在のpromo banner×2、AdSense、text adsの同時表示は広告密度が高い。収益を守るため一括削除ではなく、
`rail_promo_click`、ad viewability、article completion、次page CTRでvariant比較する。

mobileではrailを丸ごと本文下へ複製しない。記事末に「次に読む」3件 + operator compact + promo最大1件とし、TOCは冒頭accordion。

### 7.3 Ranking rail

1. survey/definition/source。
2. related blog。
3. same group/related ranking。
4. context promo。
5. ad。

ランキング本文が操作中はrailを自然flowにし、TOCやselectorだけstickyにする。広告をstickyにしない。

### 7.4 Rail visual

- 360px幅では大画像を使わない。64〜88px thumbnail + 2行titleが上限。
- 同一RailCard内で全linkの画像有無を混在させない。
- 画像取得失敗時は画像枠を消し、text layoutへ縮退する。
- section titleに「関連」「人気」「新着」の選定理由を明記する。

## 8. OGP

### 8.1 役割別template

| type | 主visual | 必須text | 避ける |
|---|---|---|---|
| ranking | map/Top3/数値差 | 指標名、年、単位 | 汎用背景だけ |
| blog | 記事固有visual + short title | title、brand | 長文subtitle |
| area | 県silhouette/inset +代表値 | 県名、ページ種別 | 観光写真 |
| category | category motif | category名 | 未検証数値 |
| theme | 代表chart type | theme名 | 全theme同一絵 |
| default | brand +日本地図 | site name、価値提案 | logoだけ |

Googleはrepresentativeで高解像度、極端でないaspect ratioの画像、`og:image`/structured dataの指定を推奨している。
generic logoや無関係画像は避ける。stats47では1200×630を中心に、ranking/blog/areaで同一manifestからmetadataと画像を出す。

### 8.2 OGP品質gate

- title safe area、2行上限、mobile previewで読めるfont。
- data年次、単位、source IDをmanifestへ持つ。
- page canonicalとOGP URLの対応。
- light/dark OGPをSNS user themeで分けない。固定brand templateを使う。
- generated imageのhash、generator version、updatedAt。
- 404、content-type、寸法、file size、text overflowをCI/galleryで監査。
- `Article`/`WebPage` structured dataのimageと`og:image`を整合させる。

## 9. Thumbnail

OGPとthumbnailは同じ情報源から作るが、同一画像を縮小流用しない。

- OGP: share preview、1200×630、brand/textあり。
- card thumbnail: 小面積識別、文字最小、data visual中心。
- article hero visual: 本文理解、文字なしまたはchart labelのみ。

推奨variants:

```text
ranking: map | number | trend
blog: map | comparison | timeline | people | economy | industry
area: silhouette | specialty
theme: chart-type preview
```

variant selectionはgit TS/configの決定的rule。モデルは候補提案までで、値、年度、画像pathを生成しない。

## 10. Link card

### 10.1 Card taxonomy

| card | 場所 | 内容 | visual |
|---|---|---|---|
| `HeroLinkCard` | home/section先頭 | 重要1件 | large data visual |
| `ContentCard` | blog/ranking一覧 | title/meta/summary | 16:9 thumbnail |
| `DataLinkCard` | related ranking/survey | title/year/top value | mini map/number |
| `RailLinkCard` | 360px rail | 2行title + reason | optional 72px |
| `InlineLinkCard` | 記事section末 | title + 1行価値 | 原則なし |
| `TextLinkItem` | 密な一覧 | title/meta | なし |

すべてを画像cardにしない。重要度と表示面積でvisualの有無を決める。

### 10.2 共通rule

- card全体を1つのlinkにし、nested link/buttonを置かない。
- hoverだけで情報を出さない。focus-visibleを同等にする。
- titleはリンク先H1と意味一致。煽りcopyはeyebrow/descriptionへ。
- `なぜ関連するか`をtag、category、同survey等で短く示す。
- card内CTA「詳しく見る」は冗長なら置かない。
- 画像aspect ratioを固定しCLSを防ぐ。
- `No Image`を表示しない。

## 11. 広告とコンテンツの配置

広告を減らすこと自体を目的にしない。ユーザーtaskを完了した後、文脈一致順に出す。

- first view: H1、answer、primary visualを広告より先にする。
- blog: 最初の要約/data visual前にmobile affiliateを置かない。
- ranking: map/table操作の間へ広告を挟まない。
- rail: related content→operator→context promo→ad。
- footer: generic ads/Multiplex。
- promoは同viewportに1件を基本とし、2件目は十分離す。
- ad viewabilityだけでなく、content completionと次page CTRをguardrailにする。

## 12. Analytics

最低限のevent contract:

```text
nav_click {item, viewport}
site_search {query_class, result_count}       # raw queryは送らない
card_impression {card_type, content_type, position, selection_reason}
card_click {card_type, content_id, position, selection_reason}
rail_impression {widget_type, position}
rail_click {widget_type, content_id}
og_share_click {platform, page_type}
chart_interaction {chart_type, action}
article_progress {25|50|75|100}
```

評価:

- header: search usage、nav CTR、search success。
- blog: article CTR、25/75% progress、related CTR、return。
- ranking: primary visual interaction、table到達、related CTR。
- rail: widget別CTR、ad viewability、本文完読への悪影響。
- OGP: platform別share click、social landing engagement。SNS impressionだけで画像品質を断定しない。

## 13. 優先順位

### P0: 新規画像・大改修なし

1. Headerへ`都道府県`を追加する案の情報設計/幅監査。
2. blog一覧cardにtitle/metaが必ず見えるか確認し統一。
3. mobileのblog rail積み下ろしを「次に読む3件 + promo最大1」に縮約。
4. `No Image` fallbackをtext-firstへ。
5. OGP/structured data/canonical/image URLの整合監査。
6. home heroとdesign SSOTの不整合解消。

### P1: 配置変更pilot

1. blog headerに記事固有data visualがある場合だけ表示。
2. ranking related cardへtop valueまたはmini visual。
3. blog railのpromo/ad密度A/B。
4. search suggestionをcontent type別に表示。

### P2: generator/catalog拡張

1. area OGPのsilhouette/inset variant。
2. theme thumbnailのchart-type variant。
3. survey preview/OGP。
4. selection reason付きpopular/recent/editorial catalog。

## 14. 実装フェーズ

### Phase 0:実画面benchmark

- localhost主要12 URLをmobile/desktop/light/darkでscreenshot。
- header、first view、rail、article end、cards、OGPをvisual inventory。
- GA4/GSC/PSIの既存baselineを取得。
- 外部referenceを構造メモで比較し、見た目を複製しない。

### Phase 1:P0

- 小さなPRに分ける: header IA、card fallback、mobile rail、metadata audit。
- component contractとanalytics eventを先にtest。
- full buildはまとまりの節目だけ。

### Phase 2:pilot

- page群ごとに1variant、2週間またはsample gate。
- effect判定前に横展開しない。

### Phase 3:展開/撤去

- 勝ったpatternを共通component/catalogへ反映。
- 不発variantと未使用assetを撤去。二重SSOTを残さない。

## 15. 受入条件

- [ ] headerの4入口と検索がmobile/desktopで明確。
- [ ] 全pageがanswer/visual/source/deep dive/next actionの順序に沿う。
- [ ] blog/rankingのfirst meaningful contentより広告が先に来ない。
- [ ] railの選定理由、件数、mobile縮約ruleが明示される。
- [ ] OGP/thumbnail/in-page visualの役割とmanifestが分離される。
- [ ] link card taxonomyを共通componentへ対応付ける。
- [ ] `No Image`、broken image、nested link、CLSがない。
- [ ] third-partyの見た目・文言・画像を複製しない。
- [ ] GA4 eventとperformance guardrailを持つ。
- [ ] localhost検証後、deployは承認を得てまとめて1回。

## 16. Claude Code Phase 0 prompt

```text
Output Format:
1. 主要routeごとの現状screenshot inventory
2. header/blog/ranking/rail/OGP/thumbnail/cardのcomponent map
3. 外部benchmarkとの差（構造だけ）
4. P0候補と影響範囲
5. analytics/performance baseline
6. 未検証・blocker

stats47のコンテンツ配置改善Phase 0監査だけを行ってください。

必読:
- CLAUDE.md
- docs/04_レビュー/2026-07-18-sitewide-content-layout-benchmark.md
- docs/04_レビュー/2026-07-18-sitewide-image-ux-audit.md
- docs/01_技術設計/07_情報設計.md
- docs/01_技術設計/13_統一レイアウト設計.md
- docs/01_技術設計/15_デザインシステムSSOT.md
- .claude/rules/ui-components.md
- .claude/rules/ogp-image-standards.md
- .claude/rules/evidence-based-judgment.md

対象:
- header、mobile drawer、home
- blog一覧/詳細、ranking一覧/詳細
- ArticleShell、RightRailWidgets、blog/ranking rail
- OGP metadata/generator、thumbnail、全link card variants

実施:
- git statusを確認し、既存変更を所有/上書きしない。
- localhostで代表12 URLをmobile/desktop/light/dark確認。起動不能ならコード監査だけにして明示する。
- 変更せずcomponent/data flow/asset/analyticsをinventoryする。
- GA4/GSC/PSIは既存skill/snapshotのread-only確認に限定する。

禁止:
- コード、docs、画像、stateの変更。
- 外部サイトの画像・文言・CSSのコピー。
- 画像生成、R2 write、投稿、deploy。
- traffic推計を実測として扱うこと。

成功条件:
- P0をheader IA、card fallback、mobile rail、metadata整合の小変更へ分割できる。
- current baselineと成功指標があり、主観だけで全面改修しない。
- 未検証の外部traffic、selector、効果を断定しない。
```
