---
type: design-review
date: 2026-07-18
status: proposed
scope: apps/web 全page route
tags: [ui, ux, image, visual, performance, accessibility]
---

# stats47 全ページ画像UI/UX監査

## 0. 結論

画像で改善できる場所はある。ただし「全ページにAI画像を置く」のではなく、次の3用途に限定する。

1. **理解を速める**: 地図、縮小チャート、県の位置、ランキング分布。
2. **選択肢を見分ける**: 記事、カテゴリ、テーマ、ランキングへのリンクカード。
3. **読む動機を作る**: ブログ表紙、カテゴリ/テーマの限定hero、県の特産品。

優先度が高いのは装飾写真ではなく、既存データから決定的に作る地図・チャート画像である。法務、検索、表・チャートの
詳細ページへ背景画像を足す価値は低い。画像は情報階層を助ける場合だけ使い、本文や操作より先に主役にしない。

## 1. 監査範囲と前提

対象は`apps/web/src/app`の全24 `page.tsx` route family。コード、情報設計、統一レイアウト、デザインシステム、
既存画像資産、既存TODOをread-onlyで確認した。実画面、GA4、ヒートマップ、Lighthouseは今回未確認である。

重要な既存判断:

- 白基調・低ノイズ・データ中心。大型heroやKPIタイルを安易に増やさない。
- ranking/blogが検索集客面、theme/area/category/compareが回遊面。
- home注目ランキングはAI画像ではなく、決定的SVG/データサムネイルを使う方針。
- ブログthumbnail、ランキング地図/数値thumbnail、17カテゴリhero、県特産品画像は既に基盤がある。
- Cloudflare Workersでは`next/image` optimizerを前提にせず、配信サイズを事前最適化する。

## 2. 評価基準

各ページを以下で判定する。

- **A 追加/改善推奨**: タスク完了や選択精度を直接改善する。
- **B 条件付き**: 既存資産の再利用、実測、performance gateを満たす場合だけ。
- **C 原則不要**: 画像よりテキスト、表、操作、チャートが適切。

追加画像は次のうち2つ以上を満たす必要がある。

- 画像がない場合より、5秒以内の意味理解が速い。
- 異なるリンク先を視覚的に識別できる。
- 実データと同期でき、古い値を見せない。
- モバイルで本文/CTAを押し下げすぎない。
- alt、寸法、fallback、dark mode、配信予算を定義できる。

## 3. 全ページ判定マトリクス

| route | 役割 | 判定 | 推奨 | 避ける |
|---|---|---:|---|---|
| `/` | 主要入口 | B | heroは現状を実測。注目rankingは既存SVG、blogは既存thumbnail | hero追加、写真カード量産 |
| `/ranking` | ranking索引 | A | category別の既存画像を小さな識別子として利用 | 各rankingへのAI写真 |
| `/ranking/[key]` | 集客・個別指標 | A | first view直後に地図/分布の実データpreview。関連rankingに既存thumbnail | 装飾hero、本文背景 |
| `/category/[key]` | 内部ナビ | B | 既存17 heroは継続。ただしCTR/回遊を測る。ranking cardはdata thumbnail | heroの高さ拡大 |
| `/category/[key]/compare` | 比較操作 | C | 比較結果そのもののchart/mapだけ | 背景、人物、カテゴリ写真 |
| `/themes` | curated索引 | A | 各themeを代表するmini data-vizまたは共有カテゴリ画像 | 22枚の無関係AI挿絵 |
| `/themes/[slug]` | 深掘り・回遊 | B | heroは強い固有visualがあるthemeのみ。chart previewを優先 | 全theme一律hero |
| `/themes/local-finance` | 専門dashboard | C | 財政flow/chart/mapを主役にする | コイン等の装飾挿絵の追加 |
| `/themes/local-finance/cities` | 市町村財政一覧 | A | 市町村分布map、県フィルタの位置補助 | 都市写真 |
| `/areas` | 県選択 | A | 既存interactive日本地図を主役として改善。地域/県ラベルを補強 | 47枚の県写真一覧 |
| `/areas/[areaCode]` | 県自己紹介 | A | 県形シルエット、特産品画像、代表KPIのmini chart | 観光写真hero、県庁写真 |
| `/areas/[areaCode]/[theme]` | 県×主題 | C | 主題chart/mapだけ。県シルエットはbreadcrumb程度 | 毎ページ別AIhero |
| `/areas/[areaCode]/cities/[cityCode]` | 市区町村profile | A | 県内位置inset map、市区町村輪郭 | 自治体写真の自動収集 |
| `/areas/[areaCode]/cities/[cityCode]/[category]` | 市×カテゴリ | C | KPI/chartだけ | カテゴリ装飾画像 |
| `/survey` | 調査索引・潜在集客 | A | 調査カードに代表rankingのdata thumbnail | 汎用アンケート写真 |
| `/survey/[surveyKey]` | 調査束・読み物 | A | 冒頭に「この調査で分かること」のsmall multiple preview | 大型hero、同じchartの重複画像 |
| `/blog` | 記事索引 | A | 既存記事別thumbnailを継続、欠落/品質/比率を統一 | thumbnail内の小さすぎる文字 |
| `/blog/[slug]` | 集客・読み物 | A | 記事内の地図・chart・diagramを論点の直後に置く | 本文と無関係な雰囲気写真 |
| `/blog/tags` | tag索引 | C | icon/件数で十分 | tagごとの画像生成 |
| `/tag/[tagKey]` | 記事絞込 | A | blogの既存thumbnail再利用 | tag専用画像の二重管理 |
| `/search` | utility | C | 結果種別icon、rankingならmini data previewを任意 | 検索hero、空状態の大型AI画像 |
| `/about` | 信頼形成 | B | 実在運営者avatar、データ取得→可視化の簡潔な仕組み図 | 架空人物、ストック写真 |
| `/privacy` | 法務 | C | なし | hero、挿絵 |
| `/terms` | 法務 | C | なし | hero、挿絵 |

`not-found`、error、loadingはpage route外だが横断UXとして扱う。大型イラストは不要。軽い日本地図outlineまたは
既存brand markを使えるが、状態説明、戻る/検索CTA、skeletonを優先する。

## 4. ページ群別の具体案

### 4.1 Home

現状は`hero-home.jpg`の全幅hero、FeaturedRankings、3 discovery card、blog thumbnailで構成される。一方、設計文書には
「homeの暗色hero撤去」と「大型heroを増やさない」が残り、コードと文書に不整合がある。

提案:

- heroを直ちに増強しない。現状heroあり/なしを実験単位にし、主要CTA CTR、FeaturedRankings到達率、LCPを測る。
- 3 discovery cardは写真化しない。ranking=棒/順位、areas=日本地図、themes=small multiplesという既存icon/データ記号で十分。
- FeaturedRankingsは既存の地図型/数値型thumbnailが正解。静的AI画像を追加しない。
- blogは既存thumbnailを再利用し、home専用画像を作らない。

### 4.2 Ranking

一覧ではカテゴリの識別、詳細ではデータ理解が目的である。

- `/ranking`: `public/images/categories/*.webp`はカテゴリ見出し/カードの小面積に限定。17カテゴリを色だけでなく絵柄でも識別できる。
- `/ranking/[key]`: hero画像ではなく、上位/下位と全国分布が分かる決定的thumbnailをfirst meaningful visualにする。
- 関連ranking cardは既存`RankingThumbnail`と`thumbnailVariant`を再利用する。
- 欠落時の`No Image`は公開UIとして弱い。画像枠を消してtext-first cardへ縮退するか、決定的generic mapへfallbackする。
- thumbnail内の数値はsnapshotと同時生成し、古い画像を別SSOTとして残さない。

### 4.3 Category / Theme

カテゴリは「分野の違い」、テーマは「問いと可視化の違い」を見分ける必要がある。

- 17 category heroは既存資産を維持できるが、全画面上部を占領させない。
- `/themes`は、テーマごとの代表chart typeを小さく示す方が汎用AI画像より有益。例: 人口動態=人口ピラミッド、観光=地図、財政=flow。
- `/themes/[slug]`は、固有visualがあるテーマだけheroを許可。現状の`local-economy`方式を全22件へ機械展開しない。
- heroと最初のchartが同じ意味を繰り返す場合、heroを削る。

### 4.4 Area / City

この群は画像改善余地が最も大きい。ユーザーは地理的位置と「この地域らしさ」を短時間で把握したい。

- `/areas`: interactive tile mapを維持し、選択中/hover/keyboard focus、地域凡例、県名検索との連携を改善する。
- `/areas/[code]`: 県形silhouette + 全国inset、特産品画像、代表3指標のsparklineを組み合わせる。
- 特産品画像は`SpecialtyImage`の既存fallbackを活用し、欠落でlayoutを壊さない。
- 市ページは観光写真ではなく「県内のどこか」を示すinset mapが最優先。
- 自治体写真は権利、更新、代表性、47県×市区町村規模の運用負債が大きいため採用しない。

### 4.5 Survey

surveyは潜在集客面だが、何がまとまっているページかを一覧・冒頭で理解しにくい場合に画像が効く。

- 一覧カード: そのsurveyの代表ranking 1件のmap/Top3 thumbnail。
- 詳細冒頭: 3つの主要問いをsmall multiplesでpreviewし、各sectionへanchorする。
- 同じchartを「画像」とinteractive chartの両方で縦に重ねない。previewはnavigationとして使う。

### 4.6 Blog / Tag

- 記事一覧とtag一覧は既存R2 thumbnailを単一資産として再利用する。
- 記事内画像は「説明対象の直後」に置く。論点と離れたアイキャッチの再掲は避ける。
- 優先visualはchoropleth、ranking table、scatter、timeline、process diagram。
- AI背景はthumbnail/OGPの入口用途に限定し、記事内の事実図解には使わない。
- altはタイトルの複製でなく、画像が伝える比較・傾向を書く。装飾背景は`alt=""`。

### 4.7 Search / Utility / Legal / About

- Searchは速度と結果判別が主役。結果type iconは良いが、全結果thumbnailはnetwork/視覚ノイズを増やす。ranking/blog上位だけ任意表示。
- empty stateは短文とquery修正案を優先し、巨大illustrationを置かない。
- Aboutは実在avatarと「e-Stat→snapshot→chart」の仕組み図が信頼性を補強する。生成人物は不可。
- Privacy/Termsは画像不要。reading zoneを保つ。

## 5. 横断コンポーネント案

新しい汎用画像componentを乱立させず、用途を4つに限定する。

1. `DataThumbnail`: ranking/survey/themeの決定的SVG/WebP。map/number/chart variant。
2. `LocationInsetMap`: area/cityの全国・県内位置。SVG、キーボード非操作なら装飾alt。
3. `EditorialThumbnail`: blogの既存light/dark R2画像。home/tagでも同じURLを再利用。
4. `HeroBanner`: 既存componentのみ。使用許可catalogにあるcategory/themeだけ。

`ThemeAwareImage`を配信入口として使い、width/heightまたはaspect ratioでCLSを防ぐ。画像取得失敗時は、意味を失わない
text-first layoutへ縮退する。`No Image`という内部状態を読者へ見せない。

## 6. 資産SSOT

| asset | SSOT | 配信 | 方針 |
|---|---|---|---|
| category/theme hero | git TS catalog + source provenance | public WebP | allowlistのみ |
| ranking thumbnail | ranking snapshot/configから再生成 | R2 | 値と同時生成 |
| blog thumbnail/OGP | article.md + generator catalog | R2 | 全面再利用 |
| area/city inset | geography dataから決定的生成 | SVG/HTML | raster量産しない |
| specialty | typed definition + generated asset manifest | R2/local mirror | fallback必須 |
| author avatar | git asset | public WebP | 実在・承認済みのみ |

手編集JSONをSSOTにせず、永続D1を追加しない。生成プロンプト、source、hash、寸法、alt policy、再生成commandをmanifestへ持つ。

## 7. Performance / accessibility gate

- pageごとの追加初期画像転送: mobileで原則150KB以内。hero採用時も既存LCP予算内で個別計測する。
- above-foldはLCP候補1枚だけpriority。カード一覧を一括eagerにしない（既存blogの実測例外を維持）。
- AVIF/WebP優先。SVGは決定的図形と地図に限定し、危険な外部SVGをinline化しない。
- width/heightまたはaspect ratio必須。loadingで高さを変えない。
- meaningful imageは具体alt、リンク画像はリンク先の目的を含める。装飾は空alt。
- 色だけに依存せず、地図/thumbnailにも順位、label、patternを併用する。
- reduced motionではzoom/animationを停止できる。
- dark用の二重DOM画像を置かず`ThemeAwareImage`で1枚だけ読む。

## 8. 計測設計

画像の採否を主観で確定しない。

| page群 | primary | guardrail |
|---|---|---|
| home | hero CTA CTR、FeaturedRanking CTR | LCP、直帰、scroll到達 |
| ranking一覧/category/theme | card CTR | CLS、image error、回遊数 |
| ranking詳細 | chart/map interaction、関連CTR | LCP、本文到達 |
| area/city | selector成功、related CTR | map error、INP |
| survey | section anchor CTR、ranking遷移 | scroll、LCP |
| blog/tag | article CTR、本文scroll | LCP、image bytes |

experiment IDとvariantを既存analytics eventへ付ける。最低2週間または十分なsampleまで`effect`と断定しない。

## 9. 優先順位

### P0: 新規生成なしで直す

1. `RankingThumbnail`の`No Image`公開fallbackをtext-first/generic data fallbackへ変更。
2. 既存画像が使えるリンクカードを棚卸しし、home/blog/tagで同一assetを再利用。
3. home heroとデザインSSOTの不整合を解消し、hero実験の成功条件を決める。
4. 画像のalt、寸法、priority、broken imageを主要routeで機械監査する。

### P1: 決定的data visual

1. area/cityのlocation inset map。
2. survey一覧/詳細の代表data thumbnail。
3. themes一覧の代表chart-type preview。

### P2: 条件付きeditorial image

1. heroを持たないthemeのうち、実測で識別困難なものだけ候補化。
2. Aboutのデータpipeline図。
3. specialty画像のcoverage改善。

### 実施しない

- 全ranking、全theme、全cityへのAI hero一括生成。
- 法務/search/compareへの装飾画像。
- 外部写真の自動収集。
- 画像内への動的な日本語本文焼き込み。
- 第三者SNS素材の流用。

## 10. 実装フェーズ

### Phase 0: visual inventory

- route×component×asset×fallback×alt×priorityの機械inventory。
- asset size、参照切れ、LCP候補、既存analytics eventを確認。
- localhostでmobile/desktop/light/darkの代表routeをscreenshot監査。

### Phase 1: P0修正

- broken fallbackと資産再利用のみ。新規画像生成なし。
- 対象test、type-check、design-system check、主要route visual regression。

### Phase 2: data visual pilot

- area/city inset、survey preview、theme previewから各1系統をpilot。
- feature flag/experiment ID、配信byte、interactionを計測。

### Phase 3:判定と展開

- 実測で勝ったpatternだけ同系統へ展開。
- 効果なしは削除。hero/画像catalogを増やさない。

## 11. 受入条件

- [ ] 全24 route familyの画像inventoryと代表screenshotがある。
- [ ] 新規画像ごとにユーザーtask、SSOT、fallback、alt、byte予算がある。
- [ ] 第三者素材と生成AIによる事実図解を使わない。
- [ ] ranking/blogの既存pipelineを複製しない。
- [ ] `No Image`、broken icon、CLSを主要routeで出さない。
- [ ] home heroとデザインSSOTの矛盾を解消する。
- [ ] mobile LCP/CLS/INPがguardrailを超えない。
- [ ] 回遊面と集客面を同じKPIで評価しない。
- [ ] deploy前にlocalhost、デプロイは人間承認後に1回だけ。

## 12. Claude Code Phase 0指示prompt

```text
Output Format:
1. 対象route一覧
2. route×画像component×asset×fallback×alt×loading表
3. broken/missing/oversized/LCPリスク
4. デザインSSOTとの不整合
5. P0の最小変更案
6. 未検証事項

stats47全ページ画像UI/UX改善のPhase 0 visual inventoryだけを行ってください。

必読:
- CLAUDE.md
- docs/04_レビュー/2026-07-18-sitewide-image-ux-audit.md
- docs/01_技術設計/07_情報設計.md
- docs/01_技術設計/13_統一レイアウト設計.md
- docs/01_技術設計/15_デザインシステムSSOT.md
- .claude/rules/ui-components.md
- .claude/rules/ogp-image-standards.md
- apps/gallery/README.md

実施:
- git status確認。ユーザーの既存変更を変更/commitしない。
- apps/web/src/appの全page.tsxと参照画像componentをread-onlyでinventoryする。
- public/R2 path、画像寸法、fallback、alt、priority/loading、dark/light二重取得を確認する。
- localhostが既に安全に起動できる場合だけ代表routeをmobile/desktop/light/darkで確認する。

禁止:
- コード、画像、docs、stateの変更。
- 画像生成、R2 write、外部写真取得、deploy。
- 全ページへのhero追加を前提にすること。

成功条件:
- 24 route familyが漏れなく分類される。
- P0が新規画像生成なしの外科的変更に絞られる。
- home heroとSSOTの不整合、No Image fallback、performance/accessibilityリスクが明示される。
```
