---
type: agent-reference
feature: multi-channel-content-product-factory
created: 2026-07-18
status: proposed
owner: product-portfolio-manager
tags: [収益化, note, KDP, Brain, ココナラ, コンテンツ販売, AI, product-factory]
---

# マルチチャネル・コンテンツ商品ファクトリー仕様

> 進捗・優先順位のSSOTは
> `.claude/todo/05_機能バックログ.md#MULTICHANNEL-CONTENT-PRODUCT-01`。
> 本文書はClaude Code／商品管理エージェント向けの詳細な実装・運用参照資料であり、進捗状態を重複管理しない。

## 0. 決定

stats47の公的統計、記事、地図、チャート、Remotion動画、Office生成基盤、元県庁職員としての実務知識を
共通原料として、無料コンテンツ、低単価デジタル商品、電子書籍、ノウハウ教材、業務テンプレート、受託、
法人ライセンスへ段階展開する。

目的は「AIで媒体ごとに薄いコンテンツを大量投稿すること」ではない。多数の仮説を低コストで作り、無料反応、
商品クリック、実売、粗利、サポート負荷を計測し、反応が確認されたテーマと形式だけに人間レビューと制作予算を集中する。

Office・データ商品の生成基盤は `.claude/rules/coconala-product-standards.md` を恒久仕様とする。
本仕様は1つの商品原料をnote、KDP、Brain、ココナラ等へ変換し、ポートフォリオとして選別する上位仕様である。

## 1. 背景と既存資産

### 1.1 利用する既存資産

| 資産 | 現在のSSOT | 本仕様での役割 |
|---|---|---|
| metricメタ | `packages/data-configs/src/metrics/` | 商品の定義・単位・調査根拠 |
| 観測値 | R2 `app/stats/` 等 | 図表・分析の原料 |
| blog | R2 + article outbox | 無料需要、章素材、landing |
| note | note catalog git TS + R2 | 無料・有料記事、マガジン候補 |
| SNS | posts.json + metrics snapshots | 無料需要テスト |
| 地図・チャート | buzz-map / chart / Remotion | 表紙、図解、動画、教材 |
| Office商品 | `packages/product-factory/` | PPTX/XLSX/PDF/CSV商品 |
| gallery | `apps/admin` | ローカル横断管理画面 |
| 実験 | `.claude/state/experiments.json` | 仮説と判定履歴 |

### 1.2 既存方針との関係

- SEO + blogを集客主軸とする判断は維持する。
- noteはstats47への送客入口という役割を維持しつつ、**検証済みテーマだけ**買い切り有料商品を許可する。
- YouTube/TikTok撤退を維持し、商品販売を理由に再開しない。
- Instagram/Xは既存頻度ガードを維持し、商品販売のために投稿上限を緩めない。
- 有料note・KDP・Brain・外部販売は自動公開せず、人間承認を必須にする。
- ココナラP-01のOffice実機検証を飛ばして商品数を増やさない。

## 2. 目的、成功条件、非目的

### 2.1 目的

1. 1テーマから媒体ごとに異なる価値を持つ成果物を決定的に生成する。
2. 商品アイデア、原料、主張、出典、派生物、販売先、実績を一意IDで追跡する。
3. 反応がない商品を早く止め、反応がある商品だけシリーズ・講座・受託へ昇格する。
4. AI生成量ではなく、手数料後粗利、購入者価値、再利用率、人間時間当たり利益を最大化する。
5. 第三者素材、公的統計、AI生成物、商標、個人情報の権利・表示を一貫管理する。

### 2.2 成功条件

1. 全商品仮説が`productIdeaId`、`topicId`、`audienceId`、`jobToBeDone`を持つ。
2. 同じ主張・図表・出典を媒体別原稿へコピーせず、共通content bundleから再生成できる。
3. AI生成、AIアシスト、人間作成をartifact単位で記録できる。
4. 無料需要、販売、返金、粗利、サポート時間を同じポートフォリオ画面で比較できる。
5. 低品質、重複、権利不明、出典欠落、非対応形式を自動gateで止められる。
6. 最初の90日で3テーマを無料テストし、最大3件の低単価商品を出し、1件以上を継続・停止判定する。
7. 生成件数をKPIにしない。

### 2.3 非目的

- 47県×全指標の薄い電子書籍・note記事を一括販売する。
- 同じ本文をstats47、note、KDP、Brainへ複製する。
- AI生成原稿を無審査で公開する。
- 販売数、収益、レビュー等の非公開管理画面を規約外手段で取得する。
- 医療、投資、防災、教育等の結果を保証する。
- 顧客メッセージ、住所、決済情報等の個人情報をrepoへ保存する。
- プラットフォームへの自動ログイン、公開、価格変更、販売停止。

## 3. 商品ポートフォリオ

### 3.1 価値階段

```text
無料認知
  X / Instagram / 無料note / stats47
    ↓ 反応あり
入口商品
  有料note / PDF / Kindle / 小型データパック
    ↓ 実売あり
実用品
  Excel / PowerPoint / SVG / CSV / ワークブック
    ↓ 利用目的あり
ノウハウ
  Brain / 動画講座 / 有料マガジン
    ↓ 個別要望あり
サービス
  ココナラ / 相談 / カスタマイズ / 研修
    ↓ 継続需要あり
B2B
  法人ライセンス / 年次更新 / 調査・制作契約
```

上位へ進むほど価格と人間関与を増やす。無料反応だけで高単価サービスを大量作成しない。

### 3.2 商品ファミリー

#### A. 読み物・出版

- 単テーマ有料note。
- 複数記事の有料マガジン。
- Kindle短冊本、体系書、実務書。
- Amazonペーパーバックのワークブック・地図帳。
- PDFレポート、年鑑、テーマ別白書。
- ニュースレター、月次レポート。

#### B. データ・素材

- 出典・定義付きCSV。
- 47都道府県の整形済み時系列データ。
- SVG/PNG日本地図素材。
- プレゼン用チャートパック。
- SNSカルーセル素材。
- 教育用ワークシート、クイズ。
- 更新版付きデータパック。

#### C. Office・業務テンプレート

- 編集可能PowerPoint地図。
- Excel都道府県ランキング。
- 地域比較ダッシュボード。
- 自治体ベンチマークシート。
- 行政計画・企画書図表テンプレート。
- メディア向け図表セット。

#### D. ノウハウ・教育

- e-Stat入門。
- 国土数値情報・GSI入門。
- 誤読されない統計表現。
- Claude Codeで統計資料を作る方法。
- 完全DBレスの統計サイト運営。
- Remotionによるランキング動画生成。
- 公務員・自治体職員向け生成AI実務。
- AIコンテンツの出典・品質管理。

#### E. 受託・ライセンス

- オーダーメイド地域分析。
- 営業・出店・採用エリア比較。
- 移住候補・生活条件比較。
- 自治体・メディア向け図表制作。
- ホワイトペーパー、記事、SNS、動画制作。
- Excel業務の自動化。
- 研修、講演、個別相談。
- 商用素材・年間更新ライセンス。

### 3.3 優先する3つのvertical

| vertical | 無料需要 | 入口商品 | 上位商品 | 差別化 |
|---|---|---|---|---|
| 移住・住宅・人口移動 | ranking/blog/note | 移住チェックPDF、Kindle | 比較Excel、個別レポート | stats47全県データ |
| 年収・仕事・生活費 | GSC/note | 有料note、Kindle | Excel、キャリア比較資料 | 職種×地域×生活費 |
| 公務員・自治体AI実務 | note/SNS | 実務note、PDF | Brain、講座、ココナラ、研修 | 元県庁職員経験×実装実績 |

医療、防災、治安、教育評価は高sensitivityとして初期販売対象から除外し、別審査を通す。

## 4. 販売チャネル設計

### 4.1 note

役割:

- 無料記事: 検索・レコメンド・フォロワー獲得とstats47送客。
- 有料記事: 単一の意思決定や実務を完了できる成果物。
- 有料マガジン: 同じ読者・jobを持つ買い切りbundle。
- メンバーシップ: 3か月以上の継続需要確認後のみ。

初期商品:

- 「移住前に確認する統計10項目」+チェックリスト。
- 「県別年収を生活費と一緒に読む方法」+比較表。
- 「役所のExcel集計をClaude Codeで短縮する設計」+安全チェック。

禁止:

- stats47公開記事の後半だけを有料化する。
- 無料部分に価値がなく、結論だけを有料領域へ隠す。
- noteだけで完結させるためstats47の比較体験を複製する。
- 更新頻度を守れない段階でメンバーシップを開始する。

公式上、noteには有料記事、有料マガジン、定期購読マガジン、メンバーシップがある。販売機能・価格・手数料は
変更され得るため、公開時に公式ヘルプと管理画面を再確認する。

### 4.2 Amazon KDP / Kindle

役割: 検索・Amazon顧客基盤・まとまった体系書。

適合する形式:

- 15,000〜35,000字の実用短冊本。
- 35,000〜70,000字の体系書。
- 図解中心のワークブック。
- テーマ別シリーズ。ただし内容の大部分を共有するvariantは禁止。

初期候補:

1. 『データで選ぶ移住先――47都道府県の人口・住宅・仕事』
2. 『県別年収だけではわからない――生活費と仕事で比べる地域』
3. 『公務員のためのClaude Code統計実務』

KDP固有gate:

- AI生成テキスト、画像、翻訳の申告状態をmanifestに保持。
- AI生成後に大幅編集してもAI生成として申告する。
- 本文、表紙、説明文、画像すべての権利を確認。
- 読書体験を損なう重複、水増し、誤字、壊れた目次を検査。
- Kindle Previewerまたは実機で目次、図表、リンク、文字サイズを確認。
- KDP Selectを選ぶ場合、電子版の独占条件と他チャネル配布を公開前に確認。
- 価格・ロイヤリティは公開時の公式条件を再確認する。

2026-07-18確認時点で、KDPはAI生成コンテンツの申告を求め、AIアシストは申告不要として区別している。
日本の70%ロイヤリティ価格帯は250〜1,650円で、日本向け70%にはKDP Select等の条件がある。

### 4.3 Brain

役割: 結果ではなく、購入者が自分で再現できる手順・テンプレート・実装ノウハウ。

初期候補:

- e-Statから地域比較コンテンツを作るワークフロー。
- Claude Codeで統計記事・図表・SNSを一貫生成する方法。
- 公務員でも安全に使えるAI資料作成チェックリスト。
- R2/Next.js/Remotionの完全DBレスコンテンツ基盤。

商品構成:

```text
対象者 / 完了できるjob / 前提環境 / 所要時間
  → 完成例
  → 手順
  → template / code / checklist
  → 失敗例と制約
  → 更新履歴
  → support範囲
```

誇大的な収益表示、誰でも再現できるという断定、架空実績、過度なaffiliate報酬は使用しない。
販売手数料、紹介制度、審査、返金条件は公開時にBrain販売者規約で再確認する。

### 4.4 ココナラ

`packages/product-factory/src/catalog/`の商品カタログを再利用する。

- 完成品: PPTX/XLSX/PDF/CSV。
- カスタマイズ: 色、県、業界、指標。
- 分析代行: 顧客データと公開統計。
- 制作代行: 記事、資料、SNS、動画。
- 相談: 生成AI、行政統計、データ可視化。

無料note/Kindle/Brainから「自分で作るのが難しい人」をココナラへ接続する。ココナラ商品説明に他媒体の全文を
複製せず、納品物、修正回数、必要入力、非対応、納期、商用条件を明示する。

### 4.5 BOOTH / Gumroad / 自社販売

- BOOTH: 日本語の素材、PDF、テンプレート、教育教材候補。
- Gumroad: 英語圏向けJapan map、dataviz素材候補。
- 自社販売: 利益率は高いが決済、特商法、税、返金、認証、サポートを自前化するため後段。

初期Phaseではcatalogへ候補登録するだけ。公式条件・ファイル上限・商用利用規約を調査するまで自動出品しない。

### 4.6 Udemy等の講座

Brainまたはnoteで実売・質問が確認されたテーマだけ講座化する。講座は動画の大量生成ではなく、学習目標、演習、
完成物、字幕、更新責任を持つ。最初の候補は「公務員・自治体向けAI×統計資料作成」。

### 4.7 B2B

最高優先の長期収益候補。

- 自治体・観光・不動産・人材・メディア向け地域比較。
- 商用図表ライセンス。
- 定期データ更新。
- 社内研修。
- ホワイトペーパー・レポート制作。

個人向け商品の購入・問い合わせからjobを抽出し、同じ問題が3件以上確認された場合に法人パッケージを作る。

## 5. 共通content bundle

### 5.1 SSOT

媒体別原稿を上流SSOTにしない。商品企画・主張・出典・図表・権利・価格仮説は型付きgit TSをSSOTとする。

```text
packages/product-factory/src/content-products/
├── types.ts
├── topics.ts
├── audiences.ts
├── jobs.ts
├── offers.ts
├── channels.ts
├── licenses.ts
├── experiments.ts
└── products/
    ├── migration.ts
    ├── income-living-cost.ts
    └── public-sector-ai.ts
```

`packages/product-factory`が既に存在するため、新packageを増やさない。Office商品catalogとの参照はIDで行う。

### 5.2 型

```ts
type Channel =
  | "stats47" | "note-free" | "note-paid" | "note-magazine"
  | "kdp-ebook" | "kdp-paperback" | "brain" | "coconala"
  | "booth" | "gumroad" | "udemy" | "b2b";

type ContentProductDefinition = {
  id: string;
  topicId: string;
  audienceId: string;
  jobToBeDone: string;
  promise: string;
  sourceMetricKeys: readonly string[];
  sourceRefs: readonly SourceRef[];
  claims: readonly ClaimDefinition[];
  visualSpecIds: readonly string[];
  officeProductIds: readonly string[];
  channelOffers: readonly ChannelOffer[];
  rights: RightsAssessment;
  aiPolicy: AiContentPolicy;
  sensitivity: "normal" | "review" | "high";
  hypothesis: ExperimentHypothesis;
  status:
    | "idea" | "free-test" | "signal" | "pilot-approved"
    | "generated" | "quality-reviewed" | "ready-for-owner"
    | "published" | "measuring" | "validated" | "scale"
    | "paused" | "retired";
};

type ChannelOffer = {
  channel: Channel;
  format: string;
  priceYen: number | null;
  freeBoundary: string | null;
  deliverables: readonly string[];
  supportScope: string;
  refundPolicyCheckedAt: string | null;
  termsCheckedAt: string | null;
  status: "candidate" | "generated" | "reviewed" | "approved" | "listed" | "paused";
};

type AiContentPolicy = {
  text: "human" | "ai-assisted" | "ai-generated";
  images: "human" | "ai-assisted" | "ai-generated" | "none";
  translation: "human" | "ai-assisted" | "ai-generated" | "none";
  disclosureRequired: boolean;
  humanReviewer: string | null;
};
```

### 5.3 生成物

```text
.local/content-products/<product-id>/<version>/
├── bundle.json
├── sources.csv
├── claims.json
├── visuals/
├── free/
│   ├── stats47/
│   ├── note/
│   └── sns/
├── paid/
│   ├── note/
│   ├── kdp/{manuscript,cover,metadata}/
│   ├── brain/
│   ├── coconala/
│   └── files/
├── quality/
│   ├── automated.json
│   ├── semantic-review.md
│   └── owner-checklist.md
└── manifest.json
```

生成物はgit管理しない。人間が編集した最終原稿を正典にする場合は、媒体ごとの既存outbox/SSOTへ明示的に昇格する。

## 6. AI活用と品質保証

### 6.1 AIに任せること

- 既存原料の要約・媒体別再構成。
- タイトル、説明、目次、販売文の候補。
- 読者persona別の例、演習、FAQ候補。
- 図表caption、alt、字幕、サムネイル案。
- 重複、矛盾、欠落、読みやすさの一次検査。
- 販売結果の定型集計と次実験候補。

### 6.2 コードに任せること

- データ取得、計算、順位、図表、組版。
- ID、参照整合、重複hash、status遷移。
- 出典・年・単位・ライセンスの必須検査。
- 価格、手数料、粗利、工数の計算。
- 文字数、ページ数、画像サイズ、ファイル破損検査。
- AI生成区分manifestと公開checklist。

### 6.3 人間に残すこと

- 商品を公開する最終判断。
- 価格、返金、support、商用条件。
- 主張、経験談、顧客成果の真実性。
- KDP AI申告、プラットフォーム規約確認。
- Office/Kindle/教材の実機確認。
- 顧客対応、レビュー返信、法人契約。

### 6.4 品質gate

1. **source gate**: 全数値に年・単位・調査・取得元。
2. **claim gate**: 主張がsourceまたは明示された経験に紐づく。
3. **duplication gate**: 自社既存商品と本文・章・図表の重複率を検査。
4. **value gate**: 購入後に完了できるjobと納品物が明確。
5. **rights gate**: 第三者素材、商標、データ利用条件。
6. **AI gate**: 生成/アシスト区分、開示、human reviewer。
7. **format gate**: Kindle、PDF、PPTX、XLSX等の形式検証。
8. **brand gate**: 誇大、煽り、地域蔑視、結果保証なし。
9. **commercial gate**: 予想粗利とsupport上限。
10. **owner gate**: 公開、価格、販売先を人間が承認。

## 7. 需要テストと集中ルール

### 7.1 Gate 0: 供給可能性

- 一次データ・権利・年次・対象読者が明確。
- 既存コンテンツの単なる再包装でない。
- stats47固有のデータ、経験、生成基盤のうち2つ以上を使う。

### 7.2 Gate 1: 無料需要

無料SNS、blog、無料note、無料sampleで14〜28日観測する。

候補指標:

- GSC impressions/clicks/CTR。
- note views、スキ、stats47参照流入。
- X/IG/YTのaccount baseline比。
- sample/product page click。
- 保存、共有、具体的な質問。

`signal`条件は次のいずれか:

- 2媒体で同形式baselineの1.5倍以上。
- 1媒体で2倍以上かつ具体的な利用質問2件以上。
- 商品詳細またはsampleへのユニーククリック20以上。
- 既存顧客・問い合わせによる明示需要1件。

これは初期判定基準であり、実測後に変更する。未取得指標を0にしない。

### 7.3 Gate 2: 入口商品

1テーマにつき最初の有料商品は1つだけ。note、KDP、PDFを同時発売しない。

評価:

- 商品ページ閲覧→購入率。
- 手数料後売上・粗利。
- 返金、低評価、質問。
- 制作時間、review時間、supportMinutes。
- stats47や上位商品への波及。

28日または商品ページ100viewの遅い方で判定する。ただし権利・品質問題は即停止。

### 7.4 Gate 3: 横展開

入口商品で次のいずれかを満たした場合だけ別媒体へ展開する。

- 3件以上の実売かつ返金0。
- 1件以上の購入と具体的な上位要望。
- 粗利が制作・support時間の内部基準を上回る。

横展開時も同文複製をしない。例:

```text
有料note: 1つの判断を短時間で完了
Kindle: 背景から複数ケースまで体系化
Brain: 読者自身が再現する手順
Excel/PPT: 作業を即時短縮
ココナラ: 個別条件へ適用
```

### 7.5 Scale / Stop

`scale`:

- 2回以上の販売期間で需要が再現。
- 返金・重大誤りなし。
- 粗利と人間時間当たり利益がportfolio中央値以上。
- 更新・support負債を引いても継続可能。

`pause/retire`:

- 商品ページ100viewかつ販売0。
- 90日販売0で改善仮説なし。
- supportMinutesが想定の2倍超。
- データ更新・規約・権利コストが粗利を超える。
- 自社無料コンテンツを食い、全体収益を下げる。

## 8. 計測とSSOT

### 8.1 保存先

| 対象 | SSOT |
|---|---|
| 商品定義・offer・権利・AI方針 | git TS `packages/product-factory/` |
| 生成物 | `.local/content-products/`、必要に応じ既存R2/outboxへ昇格 |
| catalog status | `.claude/state/products/catalog-status.json`（生成） |
| 販売実績 | `.claude/state/products/sales-ledger.json`（既存拡張） |
| 実験 | `.claude/state/experiments.json`参照、product experiment state |
| 月次判断 | 未完了策は `.claude/todo/05_機能バックログ.md`、実測履歴はproduct state |
| TODO | `.claude/todo/05_機能バックログ.md` |

永続D1を追加しない。売上APIが公式に提供され、利用条件を確認できるまで管理画面scrapingを実装しない。

### 8.2 sales ledger追加項目

```ts
type ProductSaleObservation = {
  productId: string;
  offerId: string;
  channel: Channel;
  observedAt: string;
  source: "official-api" | "platform-export" | "manual";
  pageViews: number | null;
  units: number;
  grossYen: number;
  platformFeesYen: number | null;
  refunds: number;
  supportMinutes: number;
  rating: number | null;
  notes: string | null;
};
```

購入者の氏名、メール、住所、メッセージ本文は保存しない。

### 8.3 KPI

North Starは**商品別の手数料・返金・support原価控除後粗利**。

補助指標:

- idea→free-test速度。
- free-test→signal率。
- signal→初回販売日数。
- 商品ページ→購入率。
- 人間時間/商品、粗利/人間時間。
- bundle再利用率。
- 返金率、重大誤り、supportMinutes。
- repeat buyerは個人情報を保存せず、プラットフォーム集計がある場合のみ集計値を記録。

生成件数、公開件数、AI token数を成功指標にしない。

## 9. エージェント設計

### 9.1 新設・拡張方針

platformごとにwriter agentを乱立させない。商品ポートフォリオ、bundle制作、品質審査、販売計測の4責務に絞る。

| agent | model | 責務 | write boundary |
|---|---|---|---|
| `product-portfolio-manager` | Fable | orchestrator、優先順位、gate、月次配分、SSOT改訂提案 | product portfolio state、月次proposal |
| `product-researcher` | Sonnet | 市場・競合・価格・platform規約・需要調査 | research snapshotsのみ |
| `content-product-architect` | Opus条件付き | job、offer、価値階段、bundle、差別化設計 | product definition proposal |
| `content-product-builder` | Sonnet | 共通bundleと媒体別draft生成 | product/version単位outbox |
| `product-quality-critic` | Opus条件付き | claim、重複、価値、rights、AI開示、販売品質 | reviewのみ、成果物変更禁止 |
| `product-metrics-sync` | Haiku/Sonnet | export/manual値の決定的取込、集計 | sales ledgerのみ |
| `note-manager` | Sonnet | 承認済みnote draftと公開LC | 既存note領域 |
| `product-factory`実装担当 | Sonnet/Opus | PPTX/XLSX/PDF生成 | `packages/product-factory` |
| `strategy-advisor` | Sonnet | current month/weekへ採択 | 既存計画ファイル |
| `improvement-triage` | Sonnet | effect判定・改善バックログ | 既存排他writer |

`product-factory`は現状agent名ではなく機能領域を指す。実装時は既存agentを確認し、必要なら
`content-product-builder`にOffice生成を担当させ、同義agentを増やさない。

### 9.2 モデル割り当て

- **Fable**: 生原稿を量産しない。portfolio配分、停止判断、SSOT変更、agent統合。
- **Opus**: 高単価offer、KDP最終構成、規約・権利・ブランド、相反証拠。全商品には使わない。
- **Sonnet**: 調査、構成、draft、商品説明、test、文書、変換。
- **Haiku**: 定型metadata、タグ、欠損確認、売上export整形。
- **決定的コード**: score、価格、手数料、ID、重複、status、manifest、validation。

### 9.3 Opusエスカレーション条件

- 新しい商品familyまたは販売channelを有効化。
- 5,000円超の個人商品、法人商品、継続課金。
- KDP本の最終章構成・重複審査。
- 高sensitivity、法務、権利、AI開示が不明。
- 既存収益化SSOTを変更。
- 低評価・返金・権利申立て発生。

### 9.4 Output Contract

Researcher:

```text
OUTPUT FORMAT: 1 markdown table only.
Columns: Source | Observed fact | Date | Product implication | Uncertainty | Required verification.
No uncited platform claims.
```

Builder:

```text
OUTPUT FORMAT: JSON manifest + generated file list only.
Do not publish. Do not invent metrics, sales, testimonials, or platform terms.
```

Critic:

```text
OUTPUT FORMAT: exactly 5 sections.
Verdict / Blockers / Evidence / Buyer value / Required fixes.
Verdict: PASS | REVISE | BLOCK | ESCALATE-HUMAN.
```

### 9.5 File Boundary

- portfolio managerだけがportfolio status proposalを統合する。
- builderは`<product-id>/<version>`単位排他。
- criticはread-only。
- metrics syncだけがsales ledgerを書く。
- note-managerはnote catalog、product builderはcontent product catalog。同じファイルを触らない。
- 複数agentに同じ販売文・原稿を同時編集させない。
- commit、push、公開、価格変更、販売停止はsubagentに許可しない。

## 10. gallery統合

`apps/admin`に`/products`を追加する。ココナラ専用画面ではなく全channelのportfolio consoleとする。

### 10.1 view

| view | 内容 |
|---|---|
| Portfolio | idea、gate、channel、実売、粗利、次action |
| Bundles | 原料、claims、sources、visual、派生物 |
| Offers | channel別価格、納品、support、規約確認日 |
| Quality | automated gate、critic、owner checklist |
| Experiments | baseline、判定日、結果、scale/stop |
| Sales | units、gross、fees、refund、support、粗利 |
| Queue | 無料test、要review、要実機、要人間公開 |

### 10.2 安全ガード

- 既定はread-only。
- generateはローカル派生物のみ。
- publish/list/price changeボタンはPhase 1-4で実装しない。
- 外部URLを表示しても管理画面credentialを保存しない。
- 売上は公式exportまたは手入力。scraping jobを置かない。
- owner approval前の成果物には`NOT FOR SALE`状態を表示。

## 11. CLI

```bash
npm run products:content:catalog -- --check
npm run products:content:next -- --limit 5
npm run products:content:generate -- --id <id> --channel note-paid
npm run products:content:validate -- --id <id> --all-gates
npm run products:content:review-packet -- --id <id>
npm run products:content:record-sales -- --input <official-export-or-manual-json>
npm run products:content:report -- --month YYYY-MM
```

全生成は`--all`必須。既存成果物上書きは`--force`必須。publishコマンドを同じCLIに追加しない。

## 12. 検証

### 12.1 Unit

- product/offer ID一意。
- source、claim、visual、Office product参照整合。
- status非巻戻し。
- price、fees、refund、粗利計算。
- null欠損と0の区別。
- AI生成区分とchannel別開示要否。
- same-content hashと重複閾値。
- high sensitivity hard gate。

### 12.2 Integration

- 1bundleからnote/KDP/Brain/coconala draftを生成。
- 媒体間でpromiseは一致し、本文は同文複製にならない。
- product-factoryのPPTX/PDFをoffer deliverableとして参照。
- sales export fixtureを個人情報なしでledgerへ取込。
- critic BLOCK時にready-for-ownerへ進めない。
- owner approval無しにpublishできるroute/commandが存在しない。

### 12.3 実機

- note preview、有料境界、リンク。
- Kindle Previewer、目次、図表、リンク、表紙。
- Brainの購入者viewとdownload形式。
- PowerPoint/Excel Windows/Mac。
- PDFの日本語font、印刷、リンク。

実機確認無しを販売可能と報告しない。

## 13. 実装Phase

### Phase 0: 監査・戦略整合

- `packages/product-factory`、note catalog、product catalog、experiments、sales ledgerを棚卸し。
- 収益化SSOTの実験レーンと禁止事項を確認。
- platform公式条件を取得日付きregistryへ記録。
- 既存未コミット変更とfile boundaryを確認。

完了条件: 重複実装、変更対象、移行対象、未確認規約が一覧化される。コード生成に進まない。

### Phase 1: 型・catalog・validator

- `ContentProductDefinition`と関連型。
- 3 vertical × 最低3 ideaの初期catalog。
- channel registry、AI policy、rights、status。
- validatorとunit test。
- 既存Office product ID参照。

完了条件: catalog check、type-check、unit test green。媒体draftは作らない。

### Phase 2: 共通bundle

- claims/sources/visual/content outlineのbundle builder。
- manifest、hash、重複検査。
- `.local/content-products`出力。
- 公開無しのreview packet。

### Phase 3: note pilot

- 無料需要が最も強い1テーマ。
- 無料記事または既存実績→有料note draft 1件。
- note-critic、owner preview。
- 公開は人間が別工程で承認。

### Phase 4: KDP pilot

- noteと同文でない体系書1冊。
- EPUB/DOCX、表紙、metadata、AI disclosure manifest。
- Kindle Previewer、critic、owner review。
- KDP uploadは人間。

### Phase 5: Brain / ノウハウpilot

- 実務質問が確認された1テーマ。
- 手順、template、完成例、失敗例、support範囲。
- 販売ページdraft。出品は人間。

### Phase 6: portfolio console / sales loop

- gallery `/products`。
- sales ledger、粗利、support、gate判定。
- 月次review。

### Phase 7: scale

- 勝った商品だけ別channelへ展開。
- BOOTH/Gumroad/Udemy/B2Bはそれぞれ規約・需要gate後。
- 90日ごとにpause/retire。

Phaseを飛ばさない。複数channelを同時pilotしない。

## 14. 最初の90日

### 0〜30日

- Phase 0-2。
- 3 verticalの無料需要と既存実績を集計。
- ココナラP-01をOffice実機確認。
- note pilot候補を1件選定。

### 31〜60日

- 有料note 1件を人間承認後に公開。
- 商品ページview、購入、質問、送客、supportを観測。
- KDP原稿はdraftまで。note結果前に公開しない。

### 61〜90日

- noteをscale/hold/stop判定。
- 売れた/質問が強い場合だけKDPまたはBrainのどちらか1つを公開候補へ。
- ココナラはP-01実機green後に1商品だけ出品候補。
- 月次reviewで次quarter配分を決定。

## 15. 初期商品カタログ案

| ID | vertical | 無料test | 入口商品 | 上位候補 |
|---|---|---|---|---|
| MCP-MIG-001 | 移住 | 「移住前に見る10統計」無料note | checklist付き有料note | Kindle、比較Excel、個別分析 |
| MCP-MIG-002 | 移住 | 空き家×人口移動地図 | PDF地域比較 | PPTX、自治体/不動産B2B |
| MCP-MIG-003 | 移住 | 交通×人口変化動画 | Kindle短冊 | 到達圏分析、研修 |
| MCP-INC-001 | 年収 | 年収だけでは選べない県比較 | 有料note | Kindle、生活費Excel |
| MCP-INC-002 | 年収 | 職種別地域差 | PDF/CSV | キャリア比較資料、受託 |
| MCP-INC-003 | 生活費 | 家賃×所得×物価 | Kindle | 移住Excel、住宅B2B |
| MCP-AI-001 | 行政AI | Excel集計短縮の実例 | 実務note | Brain、ココナラ相談 |
| MCP-AI-002 | 行政AI | e-Stat資料自動化 | PDF/checklist | 講座、研修 |
| MCP-AI-003 | 行政AI | DBレス統計サイトの構成 | 技術note | Brain、法人設計支援 |

初期登録は候補であり、全部を生成・販売しない。Gate 1の上位1件だけをpilotへ進める。

## 16. リスクと対策

| リスク | 対策 |
|---|---|
| AIスパム化 | 同時pilot 1件、価値gate、人間review、生成数をKPIにしない |
| 自社カニバリ | 媒体別jobを分け、stats47比較体験は無料で維持 |
| KDP拒否・停止 | AI申告、権利、重複、Previewer、規約確認日 |
| 誤った統計 | claim-source graph、年・単位・母集団gate |
| support赤字 | support範囲・分数記録、価格とstop条件 |
| 更新負債 | データsnapshot/version/更新期日、売れない商品はretire |
| ブランド毀損 | 誇大収益・煽り・地域蔑視禁止、critic/owner gate |
| platform依存 | 共通bundleをSSOTにし、販売先を交換可能にする |
| SSOT重複 | git TS authored、R2観測、state実績、生成物localの境界 |
| worktree競合 | 同時agent file boundary、別worktree、所有者不明変更保護 |

## 17. 受入条件

- [ ] `packages/product-factory`、note catalog、SNS、実験、sales ledgerを再利用し、同義基盤を増やしていない。
- [ ] 商品、offer、channel、AI policy、rights、実験の型付きgit TS SSOTがある。
- [ ] 共通bundleから媒体別価値を変えて生成できる。
- [ ] 自社媒体間の同文複製を機械検出できる。
- [ ] KDP AI生成申告情報をartifact単位で保持できる。
- [ ] 価格、手数料、返金、supportを含む粗利を計算できる。
- [ ] 無料需要→入口商品→横展開→scale/stopのgateを迂回できない。
- [ ] Opusは高リスク・高単価・最終審査だけに使われる。
- [ ] galleryはSSOTの派生viewで、公開機能を持たない。
- [ ] 第三者素材、顧客個人情報、credentialを保存しない。
- [ ] owner approval無しに外部公開できない。
- [ ] 最初のPhaseは監査と型だけで、商品を一括生成しない。

## 18. 公式根拠（実装・公開時に再確認）

2026-07-18確認:

- note収益化の手段: https://note.com/help/pg/monetize
- noteメンバーシップ運営: https://note.com/help/pg/membership
- KDPコンテンツガイドライン・AI生成/AIアシスト: https://kdp.amazon.co.jp/ja_JP/help/topic/G200672390
- KDP電子書籍価格要件: https://kdp.amazon.co.jp/ja_JP/help/topic/G200634560
- KDP電子書籍ロイヤリティ: https://kdp.amazon.co.jp/ja_JP/help/topic/G200644210
- KDP日本向け価格: https://kdp.amazon.co.jp/ja_JP/help/topic/G201849770
- Brain販売者用利用規約: https://brain-market.com/brain_terms_of_seller.pdf

規約、手数料、価格、ファイル形式、AI開示、独占条件は変更され得る。catalogの`termsCheckedAt`を公開前に更新し、
未確認のchannelは`blocked-terms-review`とする。

## 19. Claude Code実装開始prompt

```text
OUTPUT FORMAT:
最終報告は「結果 / 変更ファイル / 検証 / 未完了 / 次Phase」の5見出し、合計800語以内。
未検証を完了と書かず、各結果にファイルまたはコマンドを付ける。

BEHAVIOR CONTRACT:
- .claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md のPhase 0だけを実施する。
- 実装、商品生成、外部アクセス、R2 write、公開、出品、git push、deployに進まない。
- 既存未コミット変更を保護し、関連変更も所有者確認なしに編集しない。
- 永続D1を追加しない。
- platform条件を断定する場合は公式URL、確認日、取得内容を記録する。
- agent prompt冒頭に .claude/rules/agent-output-contract.md 準拠のOUTPUT FORMATを書く。
- agent起動時は mode: bypassPermissions を既定にする。

ROLE:
あなたはFable。既存資産監査、タスク境界、モデル配分、SSOT整合、Phase 1計画の統合を担当する。

MODEL ROUTING:
- Sonnet: repo調査、既存型・catalog・state・CLI・workflowの棚卸し。
- Opus: 今回は原則起動しない。収益化SSOTと本仕様の解消不能な矛盾だけを短いpacketで審査。
- Haiku: 機械的なファイル一覧・参照一覧が必要な場合のみ。
- Fable: 重複判定、採否、file boundary、Phase 1計画。

必読:
- CLAUDE.md
- docs/00_プロジェクト管理/02_収益化戦略.md
- .claude/rules/coconala-product-standards.md
- .claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md
- docs/30_note記事企画/note戦略.md
- .claude/scripts/note/catalog/README.md
- .claude/rules/{data-storage,docs-vs-issues,agent-output-contract,evidence-based-judgment,branch-workflow}.md
- .claude/agents/README.md
- packages/product-factory/ の既存実装・package scripts・tests
- .claude/state/products/ と .claude/state/experiments.json

Phase 0 task:
1. git statusで所有者不明変更を記録し、編集対象から除外する。
2. product-factory、note catalog、SNS posts/metrics、experiments、sales ledger、galleryの既存schemaとwriterを棚卸しする。
3. 本仕様の提案path・型・agentが既存機能と重複する箇所を表にする。
4. 各channelについて公式規約URL、確認日、未確認事項をregistry案にする。ログインやscrapingはしない。
5. Phase 1の最小変更ファイル、migration不要/必要、test、受入条件を確定する。
6. 未完了事項だけを `.claude/todo/05_機能バックログ.md` の該当IDへ具体化する。
7. コードは変更しない。Phase 1開始可否を ready / blocked と根拠付きで判定する。
```
