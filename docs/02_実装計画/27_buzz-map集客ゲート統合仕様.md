---
type: implementation-plan
date: 2026-07-16
status: active
tags: [buzz-map, sns, funnel, blog, theme, r2, gallery]
---

# buzz-map 集客ゲート統合仕様

## 0. この文書の目的

buzz-map を「SNS 用の画像・動画を作る機能」ではなく、次の一連の集客システムとして実装する。

```text
企画カタログ
  → 公的データ・権利・重複の確認
  → 着地点の選定または同時制作
  → buzz-map の spec / 画像 / 動画 / caption 生成
  → R2 保存
  → posts.json draft 登録
  → X / Instagram 投稿
  → stats47 の landing へ流入
  → ranking / blog / theme / area へ回遊
  → AdSense / 文脈一致アフィリエイト / 再訪
  → SNS・GA4・GSC・収益を計測して次の企画へ反映
```

本仕様は、以下を一体として定義する。

1. Web・競合・GSCを反映した buzz-map 全候補カタログ
2. カタログから spec・画像・動画を生成するパイプライン
3. R2 保存と posts.json draft 登録
4. localhost 統合メディアコンソールの管理画面
5. SNS 投稿ごとの着地先 routing
6. 必要な blog 記事または theme の同時制作
7. SNS → landing → 回遊 → 収益の attribution
8. ライセンス・品質・重複・センシティブ表現のゲート

この文書は実装計画であり、運用時の正典を置き換えない。矛盾する場合は次を優先する。

- 収益判断: `docs/02_実装計画/01_収益化マスタープラン.md`
- ページ責務: `docs/01_技術設計/07_情報設計.md`
- 完全DBレス: `docs/01_技術設計/12_完全DBレス設計.md`
- buzz-map: `.claude/rules/buzz-map-standards.md`
- SNS投稿: `.claude/rules/sns-content-standards.md`
- ブログ品質: `.claude/rules/blog-quality-standards.md`
- ブログデータ: `.claude/rules/blog-data-schema.md`
- ThemeCatalog: `.claude/rules/theme-catalog-standards.md`

## 1. 背景と設計判断

### 1.1 SNS は終点ではない

SNSの表示回数・いいね・保存だけでは収益につながらない。stats47 の North Star Metric は週次収益であり、SNSは次の先行指標を作る集客ゲートとして扱う。

- SNS表示回数
- SNSリンククリックまたはプロフィールリンク遷移
- campaign別 landing session
- engaged session
- landingからranking/theme/areaへのCTAクリック
- pages per session
- AdSense対象PV
- 文脈一致affiliate click

### 1.2 landing は一律に新規blogではない

情報設計の正典では、`/ranking` と `/blog` が集客面、`/themes` は回遊・深掘り面である。したがって、buzz-map 1本につき新しいblogやthemeを機械的に作ってはならない。

| buzz-mapの内容                      | 第一着地                      | 理由                                 |
| ----------------------------------- | ----------------------------- | ------------------------------------ |
| 単一指標・単一の答え                | 既存 `/ranking/[key]`         | 最短で全47県データと年次を見せられる |
| 単一事実だが「なぜ」の解釈が必要    | 既存または新規 `/blog/[slug]` | 背景・限界・関連指標を説明する       |
| 複数指標を継続的に比較する          | 既存 `/themes/[slug]` を拡張  | 回遊・比較面として使う               |
| 新しい概念で3指標以上を継続運用する | 新規theme候補                 | 単発投稿のためには作らない           |
| 県固有の意思決定につなぐ            | `/areas/[code]` を第二着地    | 移住・住宅等の地域意図に接続する     |
| 地名点群・GISで既存rankingがない    | 新規blogを優先                | 地図の読み方と根拠を説明できる       |

### 1.3 同時制作の意味

「SNSとlandingを同時に作る」とは、同じ `ideaId` の content bundle として企画・データ・CTAを共有することである。公開順は次の不変条件に従う。

> **SNSを投稿可能にする前に、primary landing URL が公開済みでHTTP 200を返し、SNSの約束とlandingの内容が一致していなければならない。**

新規blogは `docs/21_ブログ記事原稿/<slug>` で作業し、critic PASSと既存CI公開を経る。Claude Codeが勝手にdevelop/mainへpushしたり本番デプロイしたりしない。landingが未公開の間、SNS素材はローカル生成またはR2 stagingまで可能だが、`postable` にはしない。

## 2. 成功条件と非目標

### 2.1 成功条件

- Codex提案と既存機械候補を、重複排除した機械可読カタログで管理できる
- 全候補が `ready / needs-content / needs-pipeline / needs-renderer / blocked` のいずれかになる
- 各候補に primary landing とCTAの計画がある
- landingがない候補は、blog draft・theme拡張案・新規theme案のどれかへ決定的にroutingされる
- 商用利用可能で現行型A〜Eに対応する候補をバッチ生成できる
- X/Instagram素材をR2へ保存できる
- live landing確認後にのみposts.jsonへdraft登録できる
- `npm run gallery` の管理画面から企画、landing、素材、R2、draftを横断確認できる
- UTMとGA4でSNSからlanding、その先のCTAまで測れる
- 投稿後の結果が次回カタログscoreへ反映される

### 2.2 非目標

- 778件以上を一括レンダリングすること
- 全候補を動画化すること
- buzz-map 1件につき薄いblogを1件作ること
- buzz-map 1件につきthemeを1件作ること
- ライセンス不明・非商用データを収益導線に使うこと
- SNSの実投稿・予約を無承認で行うこと
- D1を復活させること
- 新しい公開サイト用CMSを作ること
- note、TikTok、YouTubeへの無差別同時展開

## 3. 全体アーキテクチャ

```text
git TS: curated buzz-map ideas
  │
  ├─ machine sources: e-Stat / KSJ / MLIT DPF / GSI
  ├─ GSC evidence
  ├─ competitor / viral evidence
  ├─ existing ranking/blog/theme inventory
  └─ posts.json status
        ↓ build
.claude/state/sns/buzz-map-catalog.json
.claude/state/sns/buzz-map-combo-catalog.json
        ↓ landing router
landingPlan
  ├─ existing-ranking
  ├─ existing-blog
  ├─ extend-theme
  ├─ create-blog
  ├─ create-theme
  └─ blocked
        ↓ landing ready gate
BuzzMapSpec → Remotion → local derived assets → R2 sns/buzz-map/*
        ↓
posts.json draft → gallery /buzz-map + /sns
        ↓ publish by existing guarded flow
X / Instagram → UTM landing → CTA → ranking/theme/area
        ↓
GA4 / GSC / SNS metrics / revenue → score refresh
```

### 3.1 SSOT

| データ           | SSOT                                      | 備考                             |
| ---------------- | ----------------------------------------- | -------------------------------- |
| 人が選定した企画 | git TS                                    | 手編集JSONをSSOTにしない         |
| metric/theme設定 | 既存git TS                                | 重複定義しない                   |
| 観測値           | R2                                        | `app/stats/*`等を読む            |
| blog公開記事     | R2 `app/blog/<slug>`                      | docs/21はephemeral outbox        |
| buzz-map spec    | git JSON                                  | 既存規約どおり、生成物として追跡 |
| カタログ統合結果 | `.claude/state/sns/*.json`                | builderによる派生・status upsert |
| SNS素材          | R2 `sns/buzz-map/*`                       | 再生成可能な派生物               |
| 投稿台帳         | `.claude/state/sns/posts.json`            | store経由のみ                    |
| 計測             | `.claude/state/metrics` / skill reference | 既存の計測経路を使う             |

## 4. カタログ設計

### 4.1 authored source

配置規約を確認した上で、共有SNSスクリプトから読む企画SSOTを次の相当位置に置く。

```text
.claude/scripts/sns/data/buzz-map-curated-ideas.ts
```

既存の `build-buzz-map-catalog.ts` は、machine laneとcurated laneを統合し、重複を解消してstate JSONを生成する。state JSONを直接編集しない。

### 4.2 型

```ts
type LandingStrategy =
  | 'existing-ranking'
  | 'existing-blog'
  | 'existing-theme'
  | 'extend-theme'
  | 'create-blog'
  | 'create-theme'
  | 'blocked';

type LandingReadiness =
  | 'ready'
  | 'needs-content'
  | 'draft'
  | 'review-passed'
  | 'publish-pending'
  | 'live'
  | 'blocked';

interface BuzzMapLandingPlan {
  strategy: LandingStrategy;
  readiness: LandingReadiness;
  primaryUrl: string | null;
  primaryKey: string | null;
  secondaryUrls: string[];
  articleSlug: string | null;
  themeSlug: string | null;
  landingPromise: string;
  ctaLabel: string;
  searchIntent: string | null;
  monetizationVertical: 'none' | 'housing' | 'mobility' | 'labor' | 'education';
  attributionByChannel: Partial<
    Record<'x' | 'instagram', 'direct' | 'profile' | 'unattributed'>
  >;
  blockers: string[];
}

interface CuratedBuzzMapIdea {
  ideaId: string;
  title: string;
  subtitle: string;
  hook: string;
  question: string;
  level: 'pref' | 'muni' | 'mesh';
  recommendedType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'flow';
  category: string;
  sourceKind: 'estat' | 'ksj' | 'mlit-dpf' | 'gsi' | 'derived' | 'external';
  metricKeys: string[];
  dataRefs: Array<{
    id: string;
    version?: string;
    year?: string;
    license: string;
    sourceUrl?: string;
  }>;
  viralPatterns: string[];
  externalEvidence: Array<{ url: string; note: string; surveyedAt: string }>;
  gscEvidence: Array<{
    query: string;
    impressions?: number;
    clicks?: number;
    week?: string;
  }>;
  competitorOverlap: 'none' | 'partial' | 'exact';
  feasibility: 'now' | 'needs-pipeline' | 'needs-renderer' | 'needs-data';
  capability: string;
  commercialUse: 'allowed' | 'review-required' | 'blocked';
  sensitivity: 'low' | 'medium' | 'high';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  score: number;
  scoreBreakdown: Record<string, number>;
  blockers: string[];
  channels: Array<'x' | 'instagram'>;
  renderPlan: string;
  landingPlan: BuzzMapLandingPlan;
}
```

### 4.3 status

```text
candidate
  → data-ready
  → landing-planned
  → landing-ready
  → spec
  → generated
  → r2-ready
  → draft
  → scheduled
  → posted
  → measured
```

分岐状態:

- `needs-content`
- `needs-pipeline`
- `needs-renderer`
- `needs-license-review`
- `blocked`
- `rejected`

status再構築時は、既存の後段状態を巻き戻さない。

### 4.4 score

100点満点:

| 要素                       |  点 |
| -------------------------- | --: |
| 見た瞬間の異常・例外       |  20 |
| 自分の県を探したくなる     |  15 |
| リプで補足・反論したくなる |  15 |
| 季節・ニュース性           |  10 |
| 外部の類似バズ実績         |  10 |
| stats47のGSC需要           |  15 |
| 実装容易性                 |  10 |
| 競合との差別化             |   5 |

landing補正:

- liveの既存ranking/blogへ約束一致で着地: `+10`
- 文脈一致verticalがある: `+5`
- landing新規作成が必要: `-5`
- exact競合重複: 自動生成対象外
- landing無し: 自動投稿対象外

### 4.5 hard gate

- `license=non-commercial` は `commercialUse=blocked`
- license空欄、partial、版依存は `review-required`
- データ年・対象単位・定義が説明できない候補はblocked
- `competitorOverlap=exact` は自動生成対象外
- story/hookが空の機械comboは自動生成対象外
- sensitivity=highは自動caption・自動投稿対象外
- ダミーデータで不足を埋めない
- 家計調査は県全体と県庁所在市等を混同しない
- 因果が未検証なら「関係」「一致」「仮説」と表現し、原因と断定しない

## 5. landing router

### 5.1 判定順

1. SNSの問いに直接答える既存rankingがあるか
2. そのrankingだけで、問い・定義・年次・全体像を満たすか
3. 既存blogに、同じ問いをより深く説明する記事があるか
4. 既存themeが複数指標の回遊先として適切か
5. 新規blogに固有の読者価値があるか
6. 新規themeとして3指標以上を継続的に束ねる価値があるか
7. いずれも満たさなければblockedまたはranking投入待ち

### 5.2 routing rule

#### existing-ranking

採用条件:

- metric keyが実在
- R2値が200
- ranking URLがlive 200
- SNSの値とrankingの値・年度・対象単位が一致
- 追加説明なしでも投稿の問いに答えられる

#### existing-blog / create-blog

blogが必要になる条件:

- 「なぜ」「昔と今」「複数要因」「限界」の説明が必要
- 地名・点群・GISなど単一rankingが存在しない
- GSCに明確な問いがあり、既存記事とカニバリしない
- 画像の答えを繰り返すだけでなく、追加の読者価値を提供できる

blogを作らない条件:

- rankingの言い換えだけ
- 47県分の薄い量産
- SNSから来ないと意味がない短命な本文
- 既存blogと検索意図が同じ

新規blogは `/draft-from-trend` の既存フローを使い、次を必須とする。

- R2観測値からデータ接地
- curiosity gapは1要素まで
- ですます調
- factual-check
- quality-gate
- blog-criticによるreview.md PASS
- 対応rankingへのsource-linkを該当セクション内に配置
- theme/areaへの次の回遊を1〜2本に絞る

#### existing-theme / extend-theme

themeはprimary landingではなく、原則として第二着地または記事内CTAにする。

既存theme拡張条件:

- buzz-mapの複数metricが同じ社会課題を説明する
- ThemeCatalogのprimary/secondary/contextへ自然に置ける
- selection provenanceを記録できる
- 既存themeの責務をぼかさない

#### create-theme

新規theme作成条件をすべて満たすこと。

- 3つ以上の実在ranking key
- 少なくとも1 primaryと2 secondary
- 今後もbuzz-mapを3本以上束ねられる
- 既存themeへの統合では意味が崩れる
- `/themes`を検索集客面として評価しない
- ThemeCatalog validatorを通せる

### 5.3 landing contract

SNSとlandingの整合性を機械検証する。

```ts
interface LandingContract {
  ideaId: string;
  canonicalUrl: string;
  promise: string;
  requiredMetricKeys: string[];
  requiredYear?: string;
  requiredTerms: string[];
  liveStatus: number | null;
  verifiedAt: string | null;
  result: 'pass' | 'fail' | 'pending';
  reasons: string[];
}
```

検証内容:

- URLが200
- canonicalがクリーンURL
- noindexではない
- title/H1/本文またはページデータにrequiredTermsがある
- requiredMetricKeysがページに存在
- 年次と対象単位がSNSと一致
- SNSの問いにlanding内で答えが見つかる

## 6. content bundle

`ideaId`を単位に次を関連付ける。

```text
idea
├── evidence
├── landingPlan
├── landingContract
├── article draft or theme change (必要時のみ)
├── buzz-map spec
├── X image/video/caption
├── Instagram image/video/caption
├── R2 keys
├── posts.json ids
└── measured outcome
```

新しいmanifestをSNS素材のSSOTとして追加しない。上流はcurated TS、配信素材はR2、投稿状態はposts.jsonで管理する。catalog JSONは横断ビューとしてID参照を持つ。

## 7. URL・CTA・attribution

### 7.1 canonicalとUTM

catalogの`primaryUrl`はUTMなしのcanonical URLを保持する。platform別caption生成時だけUTMを付ける。

```text
utm_source=x | instagram
utm_medium=social
utm_campaign=buzz-map-<ideaId>
utm_content=<variant-id>
```

例:

```text
https://stats47.jp/blog/vacant-house-crisis
  ?utm_source=x
  &utm_medium=social
  &utm_campaign=buzz-map-vacant-housing-muni
  &utm_content=question-a
```

- UTM付きURLをsitemapやcanonicalへ入れない
- platformとvariantを上書きしない
- 同じ投稿の再生成でcampaignを変えない
- 再投稿は`utm_content`を変えて区別する
- posts.jsonの`utm_url`へ実際のURLを記録する

チャネルごとのリンク能力を同一視しない。

- Xで投稿本文から直接遷移できる場合は`attribution=direct`
- Instagramでプロフィール等の間接導線を使う場合は`attribution=profile`
- クリック可能な導線を保証できない投稿は`attribution=unattributed`として、投稿別CTRを算出しない
- `utm_url`を保存しただけで、利用者がそのURLをクリックできたとみなさない
- プロフィールURLを投稿ごとに自動変更する実装は、本仕様の対象外

### 7.2 CTA階層

| 位置           | CTA                                        | 目的                  |
| -------------- | ------------------------------------------ | --------------------- |
| SNS            | 「全市区町村を見る」「理由とデータを見る」 | primary landingへ送る |
| blog冒頭〜中盤 | 対応ranking                                | 詳細値を見る          |
| blog中盤       | theme                                      | 関連指標を比較する    |
| blog末尾       | areaまたは関連記事                         | 回遊を残す            |
| ranking        | 関連blog/theme                             | 解釈へ進む            |
| theme          | ranking/blog                               | 個別事実へ戻す        |

CTAを一度に多数置かず、SNSで提示した問いの次の一歩をprimary CTAにする。

### 7.3 計測

最低限:

- GA4 sessionSource / medium / campaign / content
- landingPagePlusQueryString
- page_view
- engaged_session
- 既存`cta_click`
- affiliate_click
- AdSense page type別PV/RPM

`cta_click`を使う場合の推奨パラメータ:

```text
cta_id=buzz_map_landing_to_ranking | buzz_map_landing_to_theme | buzz_map_landing_to_area
link_position=article_inline | article_end | ranking_related | theme_catalog
content_id=<ideaId>
target_type=ranking | theme | area | blog
target_key=<key-or-slug>
```

### 7.4 KPI

投稿単位:

```text
SNS CTR = landing sessions / SNS impressions
Landing engagement = engaged sessions / landing sessions
Deep click rate = cta_click / landing sessions
Revenue reach = AdSense対象page view / landing sessions
Affiliate reach = affiliate_click / landing sessions
```

SNS CTRは`attribution=direct`で分母・分子を対応できる投稿だけ算出する。Instagramのprofile経由は、profile link clickとlanding sessionを補助指標として扱い、個別投稿の因果を過大評価しない。

4週間または12投稿の小さい方で型ごとに評価する。表示回数だけで勝ち判定しない。

## 8. 生成・R2・draft

### 8.1 対象

- 型A/C/E: X/Instagram用4:5静止画
- 型B/D: 最終状態4:5静止画 + X動画 + IG 9:16リール
- 型F/flow: renderer完成までcatalogのみ
- 既存素材はidempotentに再利用

### 8.2 R2 key

```text
sns/buzz-map/<ideaId>/x/stills/<ideaId>-45.png
sns/buzz-map/<ideaId>/x/reel.mp4
sns/buzz-map/<ideaId>/x/caption.txt
sns/buzz-map/<ideaId>/instagram/stills/slide-1-cover-1080x1350.png
sns/buzz-map/<ideaId>/instagram/reel.mp4
sns/buzz-map/<ideaId>/instagram/caption.txt
```

検証:

- HTTP 200
- PNG=`image/png`
- MP4=`video/mp4`
- captionはtext Content-Type
- R2キーとposts.json media_path一致
- credentialをログに出さない

### 8.3 draft gate

次をすべて満たした場合のみposts.jsonへdraft登録する。

- commercialUse=allowed
- sensitivity!=high
- spec生成済み
- 目視または決定的レンダ検査PASS
- R2素材HTTP 200
- landingContract=pass
- primary landingがlive 200
- captionに出典・年度・正しい対象単位がある
- platform/domain/content_key重複なし

posts.jsonは`sns-posts-store.cjs`経由のみ。予約日時を入れず、実投稿を呼ばない。

### 8.4 R2保持

- PNG、caption、投稿記録は永続
- posted後30日を経たMP4は既存cleanup対象
- draft/scheduledのMP4は削除しない
- 全候補の先行レンダリングはしない
- default batch sizeは12、動画は1batch最大3

## 9. gallery `/buzz-map`

`apps/gallery`へlocalhost専用管理画面を追加する。

### 9.1 表示

- 総候補、eligible、blocked、landing-ready、generated、draft、posted
- priority/type/category/lane/license/feasibility/status
- score breakdown
- hook/question
- source/year/unit/license
- viral/GSC/competitor evidence
- landing strategy/readiness/URL/contract結果
- blog draft/review/live状態
- theme plan/validator状態
- spec、ローカル素材、R2素材、posts.json状態
- X/Instagram画像・動画・caption preview

### 9.2 操作

- landing再判定
- blog draft生成ジョブ
- theme拡張計画生成
- spec生成
- 静止画生成
- 動画preview
- 本尺動画生成
- R2 push
- draft登録

各操作は分離する。R2 push前に確認ダイアログを出す。実投稿・予約は既存`/sns`画面に委ねる。

### 9.3 安全

- localhost 127.0.0.1固定
- nodejs/no-store Route Handler
- Zodでbody検証
- allowlist化したideaId/actionのみ
- 任意shell commandを受け取らない
- 既存job同時実行1件ガード
- エラーへsecret/stackを返さない
- 実storeを触るテストを作らない

## 10. 初回優先キューとlanding案

| priority | ideaId                           | テーマ                    | 第一着地案                                    | 第二着地案                     | 状況                      |
| -------: | -------------------------------- | ------------------------- | --------------------------------------------- | ------------------------------ | ------------------------- |
|        1 | vacant-housing-muni              | 空き家率20%以上の市区町村 | `/blog/vacant-house-crisis`                   | `/ranking/vacant-housing-rate` | 既存blog/ranking live確認 |
|        2 | future-population-decline-2050   | 2050年人口減少            | `/ranking/future-population-change-rate-2050` | 人口theme                      | 県は既存、muni/mesh拡張   |
|        3 | children-more-than-elderly-muni  | 子どもが高齢者より多い街  | 新規blog候補                                  | 関連ranking×2                  | 派生指標                  |
|        4 | stationless-population-growth    | 駅なしなのに人口増        | 新規blog候補                                  | 人口移動theme                  | 既存spec合成              |
|        5 | food-culture-territory           | 食文化勢力図              | 既存個別rankingまたは食文化blog               | category                       | 対象単位注意              |
|        6 | real-affordability-pref          | 所得×生活費               | 新規blog候補                                  | 所得・住宅ranking              | 派生指標                  |
|        7 | natural-decrease-social-increase | 自然減だが転入超過        | 新規blog候補                                  | 人口theme                      | 複数指標                  |
|        8 | tani-vs-sawa-place-names         | 谷vs沢・澤                | 新規blog候補                                  | 地名関連blog                   | GSI即時                   |
|        9 | medical-desert-aging             | 高齢化×病院不足           | 新規blog候補                                  | 医療theme                      | 定義設計必須              |
|       10 | female-majority-muni             | 女性が多い市区町村        | 既存ranking確認、なければblog                 | 人口theme                      | 指標確認                  |
|       11 | inhabited-mesh                   | 人が住むメッシュ          | 新規blog候補                                  | 人口theme                      | 型F必要                   |
|       12 | sakura-bloom-50y                 | さくら開花50年            | 新規blog候補                                  | 気候theme                      | 気象データ必要            |
|       13 | airport-shinkansen-access        | 空港・新幹線から遠い地域  | 新規blog候補                                  | 交通theme                      | 到達時間renderer必要      |
|       14 | tropical-night-30y               | 熱帯夜30年                | 既存気候blog確認                              | 気候theme                      | 気象データ必要            |
|       15 | highway-population-change        | 高速道路開通×人口         | 新規blog候補                                  | 交通/人口theme                 | 因果断定禁止              |

既存生成済み8本は新規登録せず、landing readinessをbackfillする。

### 10.1 記事骨子の作成方針

P0の全候補について記事を新規作成するわけではない。landing routerは次の順で判断する。

1. SNSと対象単位・年度・算式が一致する既存ranking/blogがあれば再利用する
2. rankingだけで問いに答えられる場合はblogを増やさない
3. 複数指標の関係、時系列、例外、GIS上の分布を説明する価値がある場合だけblogを作る
4. 既存記事と問いは近いが対象単位が違う場合は無理に流用しない
5. データ取得後に答えが成立しない企画は記事化せず、catalogを`rejected`または`blocked`へ戻す

ここでいう骨子は「記事の結論を先に捏造するテンプレート」ではない。数値、上位地域、境界、相関係数、転換年はデータ取得・検算後に確定する。仮説と観測結果を分け、因果を示せないデータで「XがYを増やした」と書かない。

各記事計画は少なくとも次を持つ。

- `decision`: `reuse` / `brushup` / `new` / `conditional` / `ranking-only`
- `articleSlug`: 既存slugまたは衝突確認後の候補slug
- `readerQuestion`: 記事が一つだけ答える問い
- `answerSlot`: 集計後に確定する冒頭回答
- `dataContract`: 指標、対象単位、年度、母数、派生式、出典
- `chartPlan`: 各図が答える副問と使用データ
- `outline`: H2単位の論理順
- `ctaPlan`: 関連ranking/theme/areaへの内部リンクとSNSへ戻さない次行動
- `riskNotes`: 分母、欠損、境界変更、相関と因果、センシティブ表現等
- `qualityState`: factual-check、quality-gate、blog-criticの状態

本文は`blog-quality-standards.md`に従い、導入200〜400字、問い、データ概要、結果、構造的説明、注意点、まとめの順を基本とする。Markdown tableでランキングを埋め込まず、既存のchart/ranking componentを使う。タイトルのcuriosity gapは一つだけに絞り、内部リンクは原則3〜5本、図ごとに対応する一次出典を置く。

### 10.2 共通骨子テンプレート

#### A. 境界・分布型

- 導入: 読者の直感と地図上の実分布の差を一つ提示
- H2「結論」: どこに境界・集中・例外が見えたか
- H2「地図で見る」: 全国分布と地域クラスター
- H2「上位と例外」: 代表地域を個別確認
- H2「なぜそう見えるか」: 歴史、地理、制度等の説明候補を根拠付きで整理
- H2「読み方の注意」: 集計単位、欠損、名称揺れ、因果非断定
- まとめ: 対応rankingとthemeへ誘導

#### B. 二指標・四象限型

- 導入: 一方の指標だけでは答えが変わる問いを提示
- H2「指標と算式」: 二指標、基準年、標準化、分母を先に開示
- H2「4タイプの全国像」: 四象限scatterと各象限の意味
- H2「直感どおりの地域」: 代表例
- H2「逆転した地域」: 外れ値と追加要因
- H2「この比較で言えないこと」: 相関、因果、個人差、期間差
- まとめ: 両方のrankingと関連themeへ誘導

#### C. 時系列型

- 導入: 現在値だけでは見えない変化を提示
- H2「いつから変わったか」: 全国系列と転換点
- H2「地域別の変化」: 上昇・低下・横ばいの分類
- H2「代表地域を比較」: 3〜5地域のline chart
- H2「背景候補」: 制度、気候、交通等を時系列整合性とともに検討
- H2「観測条件」: 観測地点変更、自治体合併、定義変更、欠測
- まとめ: 最新rankingとthemeへ誘導

#### D. 到達圏・GIS型

- 導入: 距離と実際の到達しやすさが違う問いを提示
- H2「定義」: 起点、終点、交通手段、所要時間閾値、集計単位
- H2「全国地図」: 到達圏または空白域
- H2「人口との重なり」: 影響人口・高齢化等とのoverlay
- H2「代表例」: 島しょ、県境、山間部、都市圏を比較
- H2「限界」: ダイヤ、渋滞、便数、境界、施設機能の差
- まとめ: 交通/人口/医療themeへ誘導

### 10.3 P0候補別の記事骨子

以下のタイトルは作業用であり、実データ確認後に`title`と`seoTitle`を分けて確定する。`answerSlot`の角括弧は集計後に置換し、未確定のまま公開しない。

#### 1. 空き家率20%以上の市区町村

- `decision`: `conditional`。既存`/blog/vacant-house-crisis`は都道府県単位の問いに再利用する。SNSが市区町村単位なら記事内に同単位の分析がある場合だけ`reuse`、なければ新規記事にする
- 作業タイトル: 「空き家率20%超の街はどこ」
- `readerQuestion`: 空き家が5戸に1戸以上ある市区町村はどこに集中し、何が共通するか
- `answerSlot`: 「該当は[件数]自治体で、[地域的特徴]が見えた。ただし別荘等を含む定義で順位は変わる」
- `dataContract`: 住宅・土地統計調査または利用可能な市区町村統計、総住宅数、空き家数、空き家の種類、基準年。小標本・非表章自治体を明示
- `chartPlan`: 該当自治体map、上位bar、空き家率×人口増減率scatter、空き家種類の内訳
- `outline`: 定義と結論 → 全国分布 → 上位自治体 → 人口減少・住宅用途との関係 → 統計上の空き家と管理不全空き家の違い → まとめ
- `ctaPlan`: `/ranking/vacant-housing-rate`、`/themes/living-housing`、`/blog/vacant-housing-aging-correlation`
- `riskNotes`: 市区町村データが存在しない年・地域を県値で代用しない。別荘、売却用、賃貸用と「放置住宅」を混同しない

#### 2. 2050年人口減少

- `decision`: `reuse/ranking-only`。県版は`/ranking/future-population-change-rate-2050`と既存`/blog/future-population-disappearing-prefectures`または`/blog/future-population-tokyo-paradox`をhookに応じて使い分ける
- 作業タイトル: 「2050年、人口が4割減る県」
- `readerQuestion`: 2050年までの人口減少はどの県で大きく、全国一様ではないのはなぜか
- `answerSlot`: 「[基準年]比で[閾値]以上減る県は[件数]。年齢構成と人口移動の差が将来像を分ける」
- `dataContract`: 国立社会保障・人口問題研究所の地域別将来推計人口、基準年、2050年、推計シナリオ。実績値と推計値を区別
- `chartPlan`: 2050年変化率map、全県bar、2020→2050 slope、年齢3区分の構成変化
- `outline`: 推計結果 → 県別格差 → 年齢構成 → 東京圏との対比 → 推計の前提と不確実性 → まとめ
- `ctaPlan`: 2050年ranking、`/themes/population-dynamics`、既存将来人口blog
- `riskNotes`: 予言として書かない。市区町村・mesh版は別データ契約とし、県版記事へ無理に混在させない

#### 3. 子どもが高齢者より多い街

- `decision`: `new`。既存`/blog/aging-rate-akita-vs-okinawa`は県単位の背景記事として内部リンクに使う
- slug候補: `children-outnumber-elderly-municipalities`
- 作業タイトル: 「子どもが高齢者より多い街」
- `readerQuestion`: 15歳未満人口が65歳以上人口を上回る市区町村は現在も存在するか
- `answerSlot`: 「条件を満たすのは[件数]自治体で、[島しょ/都市近郊等、算出後確定]に特徴がある」
- `dataContract`: 国勢調査の市区町村別年齢3区分人口。同一年・同境界で`0-14人口 > 65歳以上人口`を判定
- `chartPlan`: 該当自治体map、年少/老年比率bar、両人口のscatter、全国平均との比較
- `outline`: 判定結果 → 地図 → 代表自治体 → 出生だけでは決まらない人口移動の影響 → 境界・年齢不詳の扱い → まとめ
- `ctaPlan`: 年少人口割合ranking、高齢化率ranking、`/themes/aging-society`、既存高齢化blog
- `riskNotes`: 年齢「人数」と「割合」を混同しない。人口が少ない自治体の率を過大評価しない

#### 4. 駅なしなのに人口増

- `decision`: `new`
- slug候補: `stationless-municipalities-population-growth`
- 作業タイトル: 「駅がないのに人口が増えた街」
- `readerQuestion`: 自治体内に鉄道駅がなくても人口が増えた街はどこで、どんな交通条件を持つか
- `answerSlot`: 「[期間]に人口増となった駅なし自治体は[件数]。隣接駅、自動車交通、都市圏近接のどれが効くかを比較する」
- `dataContract`: 国勢調査2時点、国土数値情報の鉄道駅、同一自治体境界。駅の代表点が境界内に0件を「駅なし」と定義
- `chartPlan`: 駅なし×人口増map、増減率bar、最寄駅距離分布、DID/道路とのoverlay
- `outline`: 駅なしの定義 → 該当自治体 → 代表例 → 隣接自治体の駅・道路アクセス → 単純な鉄道因果で説明できない理由 → まとめ
- `ctaPlan`: 人口増減ranking、`/themes/railway`、`/themes/population-dynamics`、鉄道通勤blog
- `riskNotes`: 廃駅年と人口比較期間を合わせる。境界上の駅、路面電車、季節営業、隣接駅を別扱いする

#### 5. 食文化勢力図

- `decision`: `reuse`。総合入口は`/blog/food-culture-prefecture-map`。品目ごとは既存ranking/blogへ直接着地し、同じ内容の総合記事を増やさない
- 作業タイトル: 「県境で食卓は変わるのか」
- `readerQuestion`: 選んだ品目の消費分布に連続した地域圏や境界があるか
- `answerSlot`: 「[品目]は[地域圏]に集中し、[境界地域]で分布が切り替わる。ただし家計調査は県民全体ではなく県庁所在市等の二人以上世帯である」
- `dataContract`: 家計調査の対象世帯・地域単位、3年平均の有無、数量/支出の別、同一年
- `chartPlan`: 品目map、上位bar、対立品目のdominant map、数量×支出scatter
- `outline`: 品目ごとの結論 → 勢力図 → 境界県 → 生産地と消費地の逆転 → 調査対象の注意 → まとめ
- `ctaPlan`: 該当品目ranking、食文化hub、都道府県別食文化記事
- `riskNotes`: 「県民全員の嗜好」と一般化しない。数量と支出、単年と3年平均を混ぜない

#### 6. 所得×生活費の実質的な余裕

- `decision`: `conditional`。既存`/blog/tokyo-real-income-after-rent`、`/blog/housing-cost-livability-trend`、`/blog/price-index-high-low-prefecture`と算式が一致すれば`reuse/brushup`、異なる合成指数を作る場合だけ方法論付き新規記事にする
- slug候補: `income-cost-real-affordability`
- 作業タイトル: 「収入から生活費を引くと何位」
- `readerQuestion`: 名目所得ではなく地域別生活費を考慮すると、可処分の余裕はどう入れ替わるか
- `answerSlot`: 「同一年の[所得指標]を[費用指標]で調整すると、[上昇県/低下県]が入れ替わる」
- `dataContract`: 世帯/個人の統一、税引前/可処分所得の統一、地域差指数、住宅費、基準年。合成式と重みを公開
- `chartPlan`: 名目順位と調整後順位のslope、所得×費用scatter、費目別内訳、感度分析
- `outline`: 指標の作り方 → 順位の入れ替わり → 東京等の代表例 → 住宅費以外の影響 → 算式の限界 → まとめ
- `ctaPlan`: 所得ranking、家賃ranking、`/themes/real-income`、既存実質年収blog
- `riskNotes`: 異なる世帯属性・年度を合成しない。「住みやすさ」の総合結論へ拡張しない

#### 7. 自然減だが転入超過

- `decision`: `new`。ただし自然増減率と社会増減率の最新共通年を取得できるまで`blocked`
- slug候補: `natural-decline-social-increase-prefectures`
- 作業タイトル: 「人口減でも人が来る県」
- `readerQuestion`: 出生・死亡では減っているのに、転入超過で人を引きつける県はどこか
- `answerSlot`: 「[共通年]に自然減かつ社会増となったのは[件数]県で、総人口が増えた県と減少を補い切れない県に分かれる」
- `dataContract`: 人口推計の自然増減率・社会増減率・人口増減率を同一年で使用。符号と単位を統一
- `chartPlan`: 自然×社会増減の四象限scatter、総人口増減bar、複数年の象限遷移
- `outline`: 2種類の人口増減 → 四象限 → 転入で補えた県/補えない県 → 年次変化 → 因果として言えないこと → まとめ
- `ctaPlan`: 自然増減率ranking、社会増減率ranking、`/themes/population-dynamics`
- `riskNotes`: 現行theme catalogでは社会増減率の鮮度課題が明記されている。古い社会増減と最新自然増減を接合しない

#### 8. 「谷」対「沢・澤」の地名分布

- `decision`: `new`
- slug候補: `tani-sawa-place-name-map`
- 作業タイトル: 「『谷』と『沢』の境界はどこ」
- `readerQuestion`: 「谷」を含む地名と「沢・澤」を含む地名は日本のどこで優勢が入れ替わるか
- `answerSlot`: 「正規化後の地名件数では[地域]で谷、[地域]で沢が優勢となり、境界は[算出後確定]に現れる」
- `dataContract`: 国土地理院の地名/自然地名データ、読みではなく表記を基本とする。沢/澤の統合、重複地名、施設名除外を定義
- `chartPlan`: 点分布map、自治体/mesh別dominant map、東西断面、都道府県別構成比
- `outline`: 集計ルール → 全国勢力図 → 境界地域 → 例外 → 地形・方言・歴史資料で検討 → 名称だけでは語源を断定できない理由 → まとめ
- `ctaPlan`: 地名関連記事、該当地域area、今後の地名シリーズ
- `riskNotes`: 表記分布から語源や方言を断定しない。読みが「や/たに/さわ」等に分かれることを注記

#### 9. 高齢化×病院不足

- `decision`: `conditional`。既存`/blog/depopulation-area-medical-facilities`と同じ空間単位・定義なら`brushup`、異なる「医療砂漠」指標なら新規記事にする
- slug候補: `aging-medical-access-gap`
- 作業タイトル: 「高齢者ほど病院が遠い地域」
- `readerQuestion`: 高齢者人口が多いのに医療機関への到達性が低い地域はどこか
- `answerSlot`: 「[到達時間]圏外の高齢者が[人数/割合]となる地域は[分布]に集中する」
- `dataContract`: 医療施設種別、診療科/病床機能、道路到達時間、mesh高齢人口、基準年。『不足』の閾値を先に定義
- `chartPlan`: 到達圏外高齢人口map、高齢化率×施設密度scatter、代表地域のisochrone、県別集計
- `outline`: 医療砂漠の定義 → 全国分布 → 高齢人口との重なり → 代表地域 → 施設数と利用可能性の差 → 限界とまとめ
- `ctaPlan`: `/themes/healthcare`、`/themes/aging-society`、既存過疎地医療blog、医療施設ranking
- `riskNotes`: センシティブ表現。施設数0と受診不能を同一視せず、救急/診療所/病院を分ける

#### 10. 女性が多い市区町村

- `decision`: `new`。現行ブログ一覧に同じ市区町村別の問いは確認できない
- slug候補: `female-majority-municipalities`
- 作業タイトル: 「女性が多い街はなぜ偏る」
- `readerQuestion`: 女性比率が高い市区町村はどこで、年齢構成を除いても差が残るか
- `answerSlot`: 「女性比率上位は[地域特性]に集中するが、[割合]は高齢人口構成で説明される部分がある」
- `dataContract`: 国勢調査の男女別人口、年齢5歳階級、同一境界。性別不詳の扱いと最小人口閾値を定義
- `chartPlan`: 女性比率map、上位bar、女性比率×高齢化率scatter、年齢階級別男女比
- `outline`: 全国分布 → 上位自治体 → 高齢化補正前後 → 進学・就業移動等の説明候補 → ジェンダー統計の限界 → まとめ
- `ctaPlan`: 男女人口ranking、人口移動ranking、`/themes/population-dynamics`
- `riskNotes`: 個人の属性・暮らしやすさ・婚活適性へ一般化しない。小人口自治体を除外/注記する

#### 11. 人が住むメッシュ

- `decision`: `new`。型F/flow rendererと国勢調査mesh処理が完成するまで`blocked`
- slug候補: `inhabited-mesh-japan-map`
- 作業タイトル: 「日本のどこまで人は住むのか」
- `readerQuestion`: 国土のどの範囲に居住人口が存在し、無居住域はどこに広がるか
- `answerSlot`: 「[meshサイズ]で人口1人以上のmeshは[件数/面積比]。国土面積と居住域の差が見える」
- `dataContract`: 国勢調査地域mesh、meshサイズ、人口秘匿/合算処理、陸域面積。人口0と欠測を区別
- `chartPlan`: 全国dot/mesh map、地方別拡大、標高/可住地とのoverlay、都市圏と山地の比較
- `outline`: meshの読み方 → 全国像 → 都市圏の連続域 → 山地・島しょの点在 → 面積比の算出 → 秘匿と解像度の限界 → まとめ
- `ctaPlan`: 人口密度ranking、可住地人口密度ranking、`/themes/population-dynamics`
- `riskNotes`: 小地域の個人特定を避ける。秘匿値を0人として扱わない。精密な居住地点を示さない

#### 12. さくら開花50年

- `decision`: `new`。長期連続系列と観測地点の継続性を確認できるまで`blocked`
- slug候補: `sakura-bloom-50-year-change`
- 作業タイトル: 「桜の開花は50年で何日早まった」
- `readerQuestion`: 同じ観測地点で比較すると、開花日は50年間でどれだけ変化したか
- `answerSlot`: 「比較可能な[地点数]地点では、50年間に中央値で[日数]変化。地域ごとの差は[算出後確定]」
- `dataContract`: 気象庁の生物季節観測、観測地点、標本木、開花日、1970年代と直近の比較期間。欠測と観測方法変更を管理
- `chartPlan`: 地点別変化map、代表地点line、10年平均slope、春季気温とのscatter
- `outline`: 全国の変化 → 地域差 → 代表地点 → 気温との関係 → 観測制度・標本木の注意 → まとめ
- `ctaPlan`: 気温ranking、猛暑日ranking、`/themes/climate`、既存気候blog
- `riskNotes`: 2時点だけで傾向を断定しない。地点移転・観測終了・標本木変更を補正せず接続しない

#### 13. 空港・新幹線から遠い地域

- `decision`: `new`。到達時間rendererと交通モード定義が完成するまで`blocked`
- slug候補: `airport-shinkansen-access-gap`
- 作業タイトル: 「空港も新幹線も遠い地域」
- `readerQuestion`: 空港または新幹線駅まで一定時間以上かかる人口はどこに分布するか
- `answerSlot`: 「自動車で[閾値]分圏外に住む人口は[人数/割合]で、[地域類型]に集中する」
- `dataContract`: 空港/新幹線駅の対象定義、道路network、起点mesh、所要時間、人口年。便数・運行頻度は別指標
- `chartPlan`: 二交通拠点の到達圏map、圏外人口bar、最寄り拠点別map、島しょ/県境の代表例
- `outline`: 遠いの定義 → 全国到達圏 → 圏外人口 → 代表地域 → 距離と利便性が一致しない例 → 限界とまとめ
- `ctaPlan`: `/themes/railway`、空港・鉄道関連ranking、観光theme
- `riskNotes`: 直線距離を所要時間と呼ばない。離島航路、空港便数、列車本数、冬季条件を明記

#### 14. 熱帯夜30年

- `decision`: `conditional`。既存`/blog/extreme-heat-days-prefecture`、`/blog/temperature-extremes-map`、`/blog/climate-lifestyle-connection`に熱帯夜の長期系列がなければ新規作成
- slug候補: `tropical-nights-30-year-change`
- 作業タイトル: 「熱帯夜は30年で何倍に増えた」
- `readerQuestion`: 最低気温25度以上の夜は30年間でどの地域にどれだけ増えたか
- `answerSlot`: 「比較可能地点の[基準期間]と[直近期間]を比べると、中央値は[日数/倍率]変化した」
- `dataContract`: 気象庁の日最低気温または熱帯夜相当日数、同一観測地点、30年の比較窓。『熱帯夜』の算出定義を明示
- `chartPlan`: 変化量map、10年平均line、現在値と変化量scatter、代表都市small multiples
- `outline`: 現在値と増加量 → 地域差 → 長期推移 → 都市化/海洋性等の説明候補 → 観測点の注意 → まとめ
- `ctaPlan`: 猛暑日ranking、`/themes/climate`、既存猛暑blog
- `riskNotes`: 現在値が多い地域と増加率が高い地域を混同しない。観測所移転と都市化影響を注記

#### 15. 高速道路開通×人口変化

- `decision`: `conditional`。高速道路網の歴史は既存`/blog/highway-japan-58years`を再利用し、開通前後の人口比較が主題なら新規記事にする
- slug候補: `highway-opening-population-change`
- 作業タイトル: 「高速道路が来た街は栄えたか」
- `readerQuestion`: 高速道路IC開通前後で周辺自治体の人口推移はどう変わったか
- `answerSlot`: 「開通自治体の[期間]人口変化は[結果]だが、開通していない比較地域との差だけでは因果を確定できない」
- `dataContract`: 路線/IC開通年、国勢調査人口、同一自治体境界、前後期間、比較群の選定規則
- `chartPlan`: 路線開通animation、event-time line、開通自治体と比較群の分布、代表地域map
- `outline`: 問いと比較法 → 全国の開通史 → 開通前後の人口 → 伸びた/減った例 → 逆因果と交絡 → まとめ
- `ctaPlan`: `/blog/highway-japan-58years`、`/themes/roads`、人口増減ranking
- `riskNotes`: 開通が人口変化を起こしたと断定しない。自治体合併、IC位置、同時期の産業立地等を考慮する

### 10.4 記事生成と公開のゲート

Claude Codeは骨子からいきなり公開記事を作らない。1企画ずつ次の成果物を揃える。

1. catalogの`dataContract`を確定し、取得データと派生式を検算する
2. landing routerで`reuse/ranking-only/new`を再判定する
3. `new/brushup`の場合だけ`docs/21_ブログ記事原稿/<slug>/article.md`を生成する
4. 図の値と本文の値を同じsnapshotから生成し、各図の直下に一次出典を置く
5. factual checkとblog quality gateを通す
6. 別コンテキストのblog-criticが`review.md`を作り、最終判定を`PASS`にする
7. live URLが200となりlanding contractを通った後だけSNS draftを登録する

`review.md`が未作成、`NEEDS_REVISION`、対象単位不一致、未確定placeholder残存のいずれかならSNS素材が完成していても投稿準備完了としない。

### 10.5 P1記事群の位置づけ

P1はP0の次に着手する記事候補30件である。SNS企画との対応を保ちつつ、既存記事では答えられない市区町村・GIS・複数指標・時系列の問いを優先した。

ユーザーからClaude Codeへは一度だけ指示してよいが、内部処理は`.claude/skills/blog/draft-from-trend/SKILL.md`の「1回1記事」を守る。30記事を一つの生成promptへ詰めたり、品質ゲートを最後にまとめて実行したり、新しい一括生成scriptを作ったりしない。Claude Codeの一つの作業セッション内で、次の単記事処理を30回直列に反復する。

```text
inventory/重複確認
  → 1記事のdata contract確定
  → 1記事のdata取得・検算
  → 1記事のarticle.md・chart生成
  → factual check
  → quality gate
  → 別contextのblog-critic
  → PASSまたはblockedを記録
  → 次の記事
```

5記事を1 waveとして途中結果を整理するが、Claude Codeは確認待ちで停止せず次waveへ進む。各候補の終端状態は次のいずれかとする。

- `drafted-pass`: `article.md`、data、SVG、`review.md PASS`が揃った
- `reuse-existing`: 既存記事で問い・単位・年度・算式を満たすため新規作成しなかった
- `blocked-data`: 一次データ、対象単位、商用利用条件、比較可能年のいずれかが不足
- `rejected-framing`: 集計結果が問いを支持しない、または誤読リスクが便益を上回る
- `failed-gate`: factual/quality/criticを反復しても解消できず、公開不能のまま隔離

「一気に作成」の完了条件は30件すべてが終端状態になることであり、30記事を無条件に捏造することではない。`blocked/rejected/failed`を空の記事や推測値で埋めない。

### 10.6 P1記事骨子30件

タイトルは作業用であり、実データからcuriosity gapを1つ確定した後に短い`title`と説明的な`seoTitle`へ分ける。slugは公開済み`all.json`とredirect/gone slugを照合してから確定する。

#### Wave 1: 人口減少と地域構造

##### P1-01 人口減少率10%・20%・30%以上の街

- slug候補/問い: `municipality-population-decline-tiers` / 人口減少はどの街で「緩やか・急速・極端」の段階に分かれるか
- data/図: 同一境界へ補正した国勢調査2時点、市区町村別増減率、10/20/30%のtier map、人口規模別bar
- 骨子: 閾値の定義 → 全国分布 → 30%以上減少した街 → 人口規模との関係 → 合併・境界変更の注意 → 人口theme/増減率rankingへCTA

##### P1-02 外国人人口5%以上の街

- slug候補/問い: `foreign-resident-five-percent-municipalities` / 外国人比率が5%を超える街は大都市だけなのか
- data/図: 同一年の市区町村別外国人人口と総人口、比率map、人数×比率scatter、産業構成との比較
- 骨子: 5%基準 → 人数上位との違い → 製造業都市・観光地等の代表例 → 国籍別構成 → 在留外国人と国勢調査の定義差 → foreign-residents themeへCTA

##### P1-03 高齢者が人口の半分を超える街

- slug候補/問い: `half-population-elderly-municipalities` / 65歳以上が住民の半数を超える自治体はどこにあるか
- data/図: 国勢調査の年齢3区分人口、該当自治体map、高齢化率bar、総人口×高齢化率scatter
- 骨子: 判定結果 → 地域分布 → 小規模自治体の代表例 → 10年前との変化 → 年齢不詳・母数の注意 → aging-society themeへCTA

##### P1-04 昼の人口が夜を上回る街

- slug候補/問い: `daytime-population-hub-municipalities` / 昼間人口が膨らむ地域中心は県庁所在地だけなのか
- data/図: 国勢調査の昼間・夜間人口、昼夜間人口比率map、流入人数bar、人口規模×比率scatter
- 骨子: 昼夜比の定義 → 全国の吸引都市 → 県庁所在地でない中心 → ベッドタウンとの対比 → 通勤・通学だけを測る限界 → population-dynamics themeへCTA

##### P1-05 「市」より人口が多い町・村

- slug候補/問い: `towns-villages-larger-than-cities` / なぜ一部の町や村は多くの市より人口が多いのか
- data/図: 最新国勢調査または人口推計、市町村種別、町村と下位市のslope/bar、都市圏map
- 骨子: 逆転件数 → 大きな町村 → 小さな市との比較 → 市制要件と合併史 → 制度名称を都市力と混同しない注意 → 人口rankingへCTA

#### Wave 2: 集中・住宅・生活費

##### P1-06 県人口の半分が1都市へ集中する県

- slug候補/問い: `prefecture-population-city-concentration` / 一つの都市へ人口が集中する県と分散する県はどこか
- data/図: 県人口、市区町村人口、最大都市share、集中率bar、県内treemap、上位都市が県庁所在地かの分類
- 骨子: 集中率の算式 → 集中県/分散県 → 県庁所在地でない最大都市 → 地形・合併・都市圏の背景 → 行政区域依存の限界 → area/themeへCTA

##### P1-07 日本の人口重心は50年でどこへ動いたか

- slug候補/問い: `japan-population-center-50-year-shift` / 人口重心は50年間にどの方向へどれだけ移動したか
- data/図: 国勢調査の人口重心時系列、年次点・移動線、区間別距離bar、人口移動イベントの注記
- 骨子: 現在地 → 50年の軌跡 → 移動が大きい期間 → 大都市圏集中との関係 → 重心が示さない地域差 → population-dynamics themeへCTA

##### P1-08 新築が増えているのに人口が減る街

- slug候補/問い: `new-housing-despite-population-decline` / 人口減少下でも住宅着工が増える街では何が起きているか
- data/図: 市区町村別住宅着工と人口増減の共通期間、四象限scatter、該当自治体map、住宅種別bar
- 骨子: 指標と期間 → 逆説自治体 → 貸家/持ち家の内訳 → 世帯数・建替え等の説明候補 → 空き家増加との因果非断定 → living-housing themeへCTA

##### P1-09 持ち家率×空き家率の4象限

- slug候補/問い: `homeownership-vacancy-four-types` / 持ち家が多い県ほど空き家も多いのか
- data/図: 同一年の持ち家率・空き家率、四象限scatter、象限map、既存`vacant-housing-vs-*`との差分確認
- 骨子: 二指標の定義 → 4タイプ → 同時に高い県/片方だけ高い県 → 住宅市場・別荘等の背景 → 相関と因果の注意 → living-housing themeへCTA

##### P1-10 所得×地価で見る住宅取得の重さ

- slug候補/問い: `income-land-price-affordability-gap` / 所得に対して住宅地価が重い地域はどこか
- data/図: 同一年・同単位の所得指標と住宅地価、算式を公開した比率、scatter、名目順位からの変動slope
- 骨子: 算式 → 所得順位と負担順位の逆転 → 都市圏/地方の例 → 家賃・住宅面積の補助 → 住宅価格そのものではない限界 → real-income/living-housing themeへCTA

#### Wave 3: 地域経済と鉄道

##### P1-11 生活費は安いが所得も低い県

- slug候補/問い: `low-cost-low-income-prefectures` / 物価の安さは所得差を補えているか
- data/図: 可処分所得と消費者物価地域差指数の共通年、四象限scatter、実質化の感度分析、費目別bar
- 骨子: 二指標 → 低コスト低所得群 → 実質化後の順位 → 住宅費の影響 → 世帯属性・年差の限界 → real-income themeへCTA

##### P1-12 人口規模以上に製造品を生む街

- slug候補/問い: `manufacturing-output-outlier-cities` / 人口は小さいのに製造品出荷額が大きい街はどこか
- data/図: 市区町村別製造品出荷額・人口、1人当たり値、log scatter、外れ値map、産業中分類
- 骨子: 規模補正の理由 → 外れ値都市 → 主力産業 → 雇用・昼間人口との関係 → 本社/工場と住民所得の違い → manufacturing themeへCTA

##### P1-13 周辺人口以上に小売を集める中心都市

- slug候補/問い: `retail-sales-regional-hub-cities` / 人口規模以上の小売販売額を持つ都市はどこか
- data/図: 市区町村別小売販売額・人口、1人当たり値、昼間人口とのscatter、商圏mapまたは近隣比較
- 骨子: 中心性の算式 → 地域拠点 → 観光都市との違い → 通勤流入・交通との関係 → EC/法人取引を含む統計限界 → local-economy themeへCTA

##### P1-14 駅がないのに人口が多い街

- slug候補/問い: `stationless-large-municipalities` / 鉄道駅0でも人口が多い自治体はどこか
- data/図: KSJ駅点、市区町村境界、人口、駅なし自治体bar、最寄駅距離map、道路/バス補助layer
- 骨子: 駅なし定義 → 人口上位 → 隣接駅・自動車交通 → 都市圏の例 → 境界上の駅等の注意 → railway themeへCTA

##### P1-15 駅があるのに人口減少が大きい街

- slug候補/問い: `railway-served-depopulating-municipalities` / 駅の存在だけでは人口減少を止められないのはどこか
- data/図: 駅点、国勢調査2時点、駅数/密度×人口増減scatter、減少自治体map、列車頻度があれば補助
- 骨子: 対象と期間 → 駅あり減少自治体 → 駅密度との比較 → 路線機能・雇用等の背景 → 鉄道因果を断定しない → railway/population themeへCTA

#### Wave 4: 交通変化と地名文化

##### P1-16 廃線で鉄道駅が消えた自治体

- slug候補/問い: `municipalities-that-lost-railway` / 鉄道を失った自治体はどこに増えたか
- data/図: 現在/過去の鉄道路線・駅、廃止年、市区町村境界、before-after map、廃止年timeline
- 骨子: 「消えた」の定義 → 全国分布 → 時代別廃線 → 代表地域 → 人口減少との前後関係 → データ網羅性の限界 → railway themeへCTA

##### P1-17 新幹線開業前後の人口

- slug候補/問い: `shinkansen-opening-population-change` / 新幹線開業都市の人口は開業後に増えたのか
- data/図: 駅開業年、国勢調査人口、同一境界、event-time line、比較群、代表都市map
- 骨子: 比較方法 → 開業都市の平均像 → 増加/減少例 → 県内中心への集中 → 逆因果・同時施策 → railway/population themeへCTA

##### P1-18 県庁所在地まで2時間以上の地域

- slug候補/問い: `two-hours-from-prefectural-capital` / 同じ県内でも県庁所在地まで2時間以上かかる人口はどこにいるか
- data/図: 道路network、県庁地点、mesh人口、120分isochrone、圏外人口bar、島しょ別扱い
- 骨子: 到達時間の定義 → 全国空白域 → 圏外人口 → 県境を越えた方が近い例 → 道路速度/航路等の限界 → roads/areaへCTA

##### P1-19 インフラがあるのに人口が流出する地域

- slug候補/問い: `infrastructure-with-population-outflow` / 駅・IC・病院があっても人口流出が続く地域はどこか
- data/図: 施設access、社会増減率、人口規模を同年で統合、四象限map/scatter、代表地域card
- 骨子: インフラ指標 → 流出地域 → 雇用・進学等の補助指標 → 例外 → 施設の存在と利用可能性の差 → 複合因果の限界 → themesへCTA

##### P1-20 「谷戸」と「谷津」の境界

- slug候補/問い: `yato-yatsu-place-name-boundary` / 谷戸と谷津の地名はどこで入れ替わるか
- data/図: GSI地名、表記/読み正規化、点分布、自治体別構成比、境界拡大map
- 骨子: 集計定義 → 全国点群 → 南関東の境界 → 地形との重なり → 読み・表記から語源を断定しない → 地名hub/areaへCTA

#### Wave 5: 地名シリーズ

##### P1-21 内陸にある「島」地名

- slug候補/問い: `inland-shima-place-names` / 海から遠いのに「島」が付く地名はどこにあるか
- data/図: GSI地名、海岸線からの距離、内陸閾値、点分布、河川・旧水域overlay
- 骨子: 内陸の定義 → 分布 → 河川沿い/盆地の例 → 地形・歴史の説明候補 → 現在の海岸距離だけでは語源を決められない → GIS/areaへCTA

##### P1-22 「浜・浦・津」の海岸語彙

- slug候補/問い: `hama-ura-tsu-coastal-place-names` / 海岸地名の漢字は地域ごとにどう使い分けられるか
- data/図: GSI地名、海岸距離、3語のdominant map、都道府県別構成比、地形分類overlay
- 骨子: 3語の集計 → 勢力図 → 境界県 → 湾・港等との関係 → 行政地名と自然地名の差 → 地名hubへCTA

##### P1-23 「川」と「河」の地域差

- slug候補/問い: `kawa-gawa-river-place-name-map` / 「川」と「河」を含む地名の分布は何が違うか
- data/図: GSI地名の表記、河川network、点分布、構成比map、行政/自然地名分類
- 骨子: 表記集計 → 全国差 → 河川規模との比較 → 代表例 → 読みを表記から推定しない注意 → 地名hubへCTA

##### P1-24 「新田・開・拓」に残る開発史

- slug候補/問い: `development-history-place-name-map` / 開発を示す地名は時代と地域でどう分かれるか
- data/図: GSI地名、3語の点群、干拓地/平野/北海道開拓layer、dominant map
- 骨子: 語の定義 → 全国分布 → 新田/干拓/開拓の地域差 → 代表地域 → 地名だけで年代を断定しない → 歴史・area記事へCTA

##### P1-25 県ごとに特徴的な地名漢字

- slug候補/問い: `distinctive-place-name-kanji-by-prefecture` / 各県で全国平均より目立つ地名漢字は何か
- data/図: GSI地名の文字頻度、全国平均との差またはTF-IDF、県別代表漢字map、頻度/特徴度scatter
- 骨子: 「多い」と「特徴的」の違い → 算式 → 47県map → 意外な県 → 文字分割・異体字の注意 → 地名シリーズへCTA

#### Wave 6: 教育・医療・気候・防災

##### P1-26 学校がない自治体

- slug候補/問い: `municipalities-without-schools` / 小中学校が自治体内にない地域で子どもはどこへ通うか
- data/図: KSJ学校点、自治体境界、年少人口、学校0自治体map、最寄校距離、児童数とのoverlay
- 骨子: 学校0の定義 → 該当自治体 → 年少人口との重なり → 組合立/区域外通学等 → 休校・廃校・学校種別の注意 → education-culture themeへCTA

##### P1-27 一般病院0の自治体

- slug候補/問い: `municipalities-without-general-hospitals` / 一般病院がない自治体は診療所や隣接都市で補えているか
- data/図: 医療施設点、施設種別、自治体境界、人口、病院0map、最寄病院距離、診療所密度bar
- 骨子: 病院0の定義 → 分布 → 人口・高齢化との重なり → 隣接施設への到達 → 病院0と医療不能を混同しない → healthcare themeへCTA

##### P1-28 高齢者人口×介護施設定員

- slug候補/問い: `elderly-population-care-capacity-gap` / 高齢者数に対して介護施設定員が少ない地域はどこか
- data/図: 同一年の65歳以上人口、施設種別別定員、1000人当たり定員bar、scatter、地域map
- 骨子: 需給指標 → 供給が薄い地域 → 施設種別の差 → 在宅介護指標との補完 → 待機者数を直接示さない限界 → aging/healthcare themeへCTA

##### P1-29 初雪・終雪の変化

- slug候補/問い: `snow-season-length-change` / 雪の季節は過去数十年で短くなったのか
- data/図: 気象庁の初雪・終雪または積雪観測、比較可能地点、季節長line、変化量map、欠測状況
- 骨子: 季節長の定義 → 全国変化 → 地域差 → 代表地点 → 観測方法・地点変更 → climate themeへCTA

##### P1-30 避難施設への到達空白

- slug候補/問い: `evacuation-shelter-access-gaps` / 指定避難施設まで一定時間以上かかる居住地域はどこか
- data/図: 指定緊急避難場所/避難所、道路network、居住mesh、徒歩到達圏、圏外人口、災害種別layer
- 骨子: 施設・閾値の定義 → 全国空白域 → 高齢人口との重なり → 災害種別の違い → 実際の避難可能性を断定しない → safety/areaへCTA

### 10.7 P1一括指示の実行契約

P1は次の契約でClaude Codeへ指示する。

1. 開始時に公開済みblog、redirect/gone slug、既存draftを棚卸しする
2. P1-01から順に処理し、同じarticle directoryを複数agentが同時編集しない
3. 各候補でmetric key、R2 HTTP 200、一次データ、対象単位、比較年を実在確認する
4. 既存`draft-from-trend`、chart、factual、quality、blog-reviewを単記事単位で使用する
5. article-writerとblog-criticを別contextにし、Agent tool prompt冒頭へOutput FormatとBehavior Contractを置く
6. `REVISE`は同じ記事内で修正し、再審査はdeltaを使う
7. 5記事ごとに件数とblockerを整理するが、ユーザー確認待ちで停止しない
8. 30件すべてが終端状態になるまで、未処理を残して「完了」と報告しない
9. `published: false`を維持し、commit/push/PR/deploy/R2 publish/SNS投稿を行わない
10. session limit等で継続不能になった場合は、処理済みIDと次のIDをhandoffへ残し、未処理を完了扱いしない

Claude Codeへ渡すpromptは`docs/handoffs/2026-07-16-buzz-map-p1-article-batch-prompt.md`に置く。

## 11. 全候補カタログ

以下はcurated sourceへ登録する企画母集団である。実装時に既存machine catalogと照合し、同義候補は1件へ統合して`aliases`またはevidenceへ残す。

### 11.1 人口・地域の存続

- 人口が増えた市区町村
- 人口減少率10%・20%・30%以上
- 2050年に人口が半減する地域
- 出生数が死亡数を上回る市区町村
- 自然減だが社会増の市区町村
- 自然増だが転出超過の市区町村
- 転入超過率上位10%の街
- 外国人人口5%以上の街
- 65歳以上が人口の半分を超える街
- 15歳未満人口が65歳以上人口より多い街
- 現役世代割合が全国平均以上の街
- 昼間人口が夜間人口を上回る街
- 他市町村からの通勤者が多い街
- 他市町村への通勤者が多いベッドタウン
- 可住地人口密度が高い街
- 面積は広いが可住地が少ない街
- 人が1人でも住んでいるメッシュ
- 人口重心が50年間で移動した方向
- 消滅した旧自治体・合併で巨大化した自治体
- 「市」より人口が多い「町・村」
- 県庁所在地より人口が多い非県庁所在地
- 県内人口の半分以上が1都市に集中する県
- 女性人口が男性人口より多い市区町村

### 11.2 住宅・生活費

- 空き家率20%以上
- 持ち家率80%以上
- 1住宅当たり面積が120平方メートル以上
- 木造住宅率が高い県
- オートロック共同住宅率
- 新築住宅が増えているのに人口が減る街
- 貸家建設が多い街
- 住宅地地価が上昇した県
- 所得に対して住宅費が安い県
- 食費が高い県
- 光熱水費が高い県
- 交通・通信費が高い県
- 消費者物価が全国平均以下の県
- 生活費は安いが所得も低い県
- 持ち家率×空き家率の4象限
- 人口増加×住宅着工の一致・不一致
- 所得×地価
- 所得×人口流入

### 11.3 食文化・消費

- 納豆消費の東西境界
- うどん県・そば県勢力図
- 米派・パン派
- 牛肉・豚肉・鶏肉の最多品目
- マヨネーズ派・ソース派
- 味噌消費量
- 昆布消費量
- カツオ・マグロ消費量
- カツオ水揚げ量×消費量
- アイス消費量×猛暑日
- コーヒー派・緑茶派
- 日本酒・焼酎・ビールの地域勢力
- カップ麺・即席麺消費
- パスタ消費
- 外食費が高い県
- エンゲル係数
- コンビニ店舗密度
- 食料自給的な農業産出額×人口
- 「全国1位の食べ物」を県ごとに1つ配置
- 隣県で消費傾向が正反対の境界

### 11.4 交通・インフラ

- 乗降客5千人・1万人・10万人以上の駅
- 鉄道駅がない自治体
- 駅がないのに人口が多い自治体
- 駅がないのに人口が増えている自治体
- 駅があるのに人口減少が大きい自治体
- 高速道路網60年
- 鉄道網の過去と現在
- 廃線で鉄道が消えた自治体
- 新幹線開業前後の人口
- 高速道路×転入超過
- 高速道路開通前後×人口増減
- 駅密度×人口増加
- バス停密度×高齢化率
- 空港・新幹線からの到達時間
- 県庁所在地まで2時間以上
- 東京・大阪までの時間距離変形地図
- 通勤流動の矢印
- 最多通勤先による都市圏勢力図
- 港湾・漁港×水揚げ
- 学校・病院・消防署の到達圏
- インフラがないのに人口が維持される地域
- インフラがあるのに人口が流出する地域

### 11.5 地名

- 「谷」対「沢・澤」
- 「谷戸」対「谷津」
- 「台」対「丘」
- 「島」が付く内陸地名
- 「温泉」が付く地名
- 「馬」が付く地名
- 数字を含む地名
- 「浜・浦・津」の海岸語彙比較
- 「川・河」の地域差
- 「山・岳」の地域差
- 「坂・峠」の分布
- 「新田・開・拓」の開発史
- 「中央・本町・駅前」の都市地名
- 東西南北を含む地名
- 上・下・新・古・大・小を含む地名
- 点だけ見て漢字を当てる地名クイズ
- 県別に最も特徴的な地名漢字
- 県境を越えて連続する地名文化圏

競合と重なる「宿」「浜」「新田」「数字」はexact複製を避け、比較・時系列・別レイヤーとの合成で差別化する。

### 11.6 経済・仕事・財政

- 1人当たり課税所得
- 所得上位10%の市区町村
- 製造品出荷額が人口規模以上に大きい街
- 農業産出額が高い街
- 小売販売額が周辺人口より大きい中心都市
- 第1次・第2次・第3次産業の最多勢力図
- 完全失業率
- 高齢者就業率
- 共働き率
- 育児中の就業率
- 介護中の就業率
- 男女賃金格差
- 財政力指数1.0以上
- 地方債残高・県債負担
- 実質公債費比率
- 将来負担比率
- ごみ処理費×財政力
- 太陽光発電設備のある住宅率

### 11.7 教育・医療・福祉

- 小学校児童数が増えている街
- 子ども割合が高い街
- 学校がない自治体
- 児童数×学校点
- 不登校率の地域差
- 大学数・大学進学率
- 一般病院0の自治体
- 一般診療所密度
- 医師・歯科医師・薬剤師密度
- 病床利用率
- 精神科病床利用率
- 高齢者人口×介護施設
- 保育所利用率
- 公営保育所割合
- 健康寿命
- 平均寿命と健康寿命の差
- 高齢化率×医療施設
- 過疎地域×医療施設

自殺、精神疾患、認知症、死亡率、不登校等はsensitivityをmedium/highとし、自動生成・煽り表現から除外する。

### 11.8 気候・環境・防災

- さくら開花50年
- 猛暑日数の30年
- 熱帯夜数の30年
- 最高気温と年平均気温の逆転
- 年間日照時間
- 降水量・降雪量
- 初雪・終雪の変化
- 豪雪地帯
- 太陽光住宅×日照時間
- ごみ排出量
- リサイクル率
- ごみ埋立率
- 下水道・汚水処理普及率
- 洪水浸水区域×人口
- 津波浸水想定×居住人口
- 土砂災害警戒区域×高齢人口
- 低地×人口集中地区
- クマ被害地点の年内推移
- 台風上陸・接近経路
- 竜巻・突風地点
- 災害碑・自然災害伝承碑
- 避難施設への到達空白

### 11.9 投稿表現の横断型

- ほぼ全国が同じ色で1県だけ例外
- 数県だけ残る例外
- 点群から日本列島が浮かぶ
- 点群から都市圏が浮かぶ
- 昔と今の2枚比較
- 時系列で消える・増える
- 自県を探す勢力図
- 県境を越える文化圏
- 1枚目クイズ・2枚目答え
- 地元民の体感を募集する問い
- 単一指標と関連要因の2層合成
- 「あるのに減る」「ないのに増える」逆説

## 12. Web・競合・GSC根拠

実バズ例から、例外、点群、勢力図、時系列、地元補足が強いと判断する。

- 人口減少県のほぼ全面塗り: 435万表示・約5.2万いいね  
  https://nlab.itmedia.co.jp/cont/articles/3393075/
- 37度以上観測県の唯一の空白: 約7.3万いいね  
  https://nlab.itmedia.co.jp/cont/articles/3381706/
- 「鼻」地名点群: 300万表示  
  https://nlab.itmedia.co.jp/cont/articles/3896036/
- 人が住む地域の点群: 115万表示・9000いいね  
  https://nlab.itmedia.co.jp/cont/articles/3722281/
- GMS勢力図: 約330万表示・2.3万いいね  
  https://nlab.itmedia.co.jp/cont/articles/3646216/
- 認識上の仙台範囲: 460万表示  
  https://nlab.itmedia.co.jp/cont/articles/3714932/
- 空港・新幹線からの時間距離  
  https://forest.watch.impress.co.jp/docs/serial/yajiuma/2073824.html
- 競合アーカイブ  
  https://keiryosha.com/

stats47側の需要根拠:

- `.claude/state/metrics/gsc/LATEST.md`
- `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W28/queries.csv`

W28では、空き家、納豆・うどん・マヨネーズ等の食消費、子育て、生活費、地方債、2050年人口、カツオ水揚げが顕在需要として確認できる。特に空き家の問いは既存landingと生成済みbuzz-mapを同時に活用できる。

## 13. 実装フェーズ

### Phase 1: catalog + landing router

- curated TS追加
- catalog builder統合
- 重複排除
- license hard gate
- landing inventory reader
- landing router
- landing contract checker
- CLI filter/status update
- 既存生成済みbuzz-mapへlandingPlan backfill

### Phase 2: gallery

- `/buzz-map`ページ
- catalog/landing/material/draft横断表示
- landing判定
- 各生成job
- R2/draftの安全な分離操作

### Phase 3: content creation integration

- `create-blog`を既存draft-from-trendへ接続
- P1-01〜P1-30を1記事ずつ直列処理し、全件を終端状態へ移す
- 5記事ごとのcheckpointと中断時handoffを持つが、単記事品質ゲートをbatch化しない
- review.md PASSの状態取得
- existing theme inventoryとThemeCatalogの接続
- extend-theme proposal生成
- 新規themeの厳格ゲート
- landing live確認までdraft登録を止める

### Phase 4: batch render + R2 + draft

- dry-run既定のbatch CLI
- batch size 12
- 動画最大3
- idempotency
- Content-Type検証
- posts store登録

### Phase 5: attribution + feedback

- UTM生成の一本化
- landing/CTA計測
- campaign別GA4集計
- 投稿結果をcatalog scoreへ還流
- 4週間判定

## 14. 検証

### 14.1 unit

- curated schema
- ID重複
- machine/curated重複
- status upsert
- license hard gate
- landing routing
- landing contract
- UTM生成
- postable predicate
- batch selection
- posts重複防止

### 14.2 integration

- existing rankingがreadyになる
- explanationが必要な候補がcreate-blogになる
- 3指標未満でcreate-themeにならない
- non-commercialがblockedになる
- landing 404でdraft登録が止まる
- R2 Content-Type不正でdraft登録が止まる
- live landing + R2 200でdraft登録できる
- 再実行で重複しない

### 14.3 representative render

- 型A: 空き家
- 型C: 谷vs沢
- 型D: 高速道路時系列
- 型E: 駅なし×人口増
- 型B: データが揃った時系列1件

### 14.4 quality

- blog factual-check
- blog quality-gate
- blog-critic PASS
- theme `generate:catalog --check`
- theme `validate:catalog`
- gallery type-check/test/build
- Remotion type-check/代表レンダ
- R2 HTTP 200/Content-Type
- posts.json整合性

## 15. 受入条件

- 全curated候補がcatalogに入り、machine候補と重複していない
- 全候補にlandingPlanがある
- landingがない候補を投稿可能扱いしない
- 既存landingを優先し、薄いblog/themeを量産しない
- 新規blogは既存品質ゲートを迂回しない
- P1-01〜P1-30が全件終端状態で、`drafted-pass`は単記事ごとのfactual/quality/criticを通過している
- P1記事はすべて`published: false`で、公開・R2 write・SNS投稿が0件
- 新規themeは3指標以上・継続利用条件を満たす
- non-commercial/unknown licenseをR2投稿素材にしない
- 上位eligible候補を12件単位で生成できる
- R2素材とposts.jsonが一致する
- 実投稿・予約は0件
- galleryから企画→landing→素材→draftを確認できる
- UTM campaign単位でGA4流入を判別できる
- 4週間後にSNS表示だけでなくsite session・回遊・収益到達で評価できる

## 16. 実装時に更新する正典

- `.claude/rules/buzz-map-standards.md`
- `.claude/rules/sns-content-standards.md`
- `.claude/skills/sns/buzz-map/SKILL.md`
- `.claude/rules/blog-quality-standards.md`（必要な共通CTA規則だけ。重複記述しない）
- `.claude/rules/theme-catalog-standards.md`（連携フィールドが必要な場合だけ）
- `apps/gallery/README.md`
- `docs/01_技術設計/06_自動化インベントリ.md`

## 17. Claude Codeへの実装原則

- 本文書を入口にし、参照先の正典を読んでから実装する
- 記事は§10.3の`decision`と§10.4のゲートに従い、P0の15件を一括新規作成しない
- P1は§10.5〜§10.7に従い、一度のユーザー指示でP1-01〜P1-30を処理するが、内部では必ず1記事ずつ完結させる
- 一度に全Phaseを混ぜず、Phaseごとに検証・報告する
- 既存のbuilder、Remotion、blog、ThemeCatalog、gallery、posts storeを再利用する
- 新規CMS、新規DB、新規SNS manifestを作らない
- R2 writeは`sns/buzz-map/` prefixに限定する
- blog公開、SNS投稿、予約、本番deploy、git pushは明示指示なしに行わない
- 既存dirty worktreeを尊重し、他作業をcommitに混ぜない
- 失敗・未検証・blockedを完了扱いしない
