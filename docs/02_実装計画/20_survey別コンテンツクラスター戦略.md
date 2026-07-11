---
type: implementation-plan
date: 2026-07-11
status: active
tags: [survey, seo, blog, content-cluster, gsc]
---

# survey別コンテンツクラスター戦略

## 1. 結論

`/survey/[surveyKey]` を単なる「関連ランキング一覧」から、**調査ごとに異なる検索意図を受ける編集ハブ**へ育てる。
ただし 75 調査を一括で長文化したり、47 都道府県の記事を自動量産したりしない。最初は **国勢調査 1 survey** で、
ランキング・解説記事・調査ハブを結ぶ小さなクラスターを実証し、GSC 実測が基準を満たした場合だけ横展開する。

既存のファネル役割は維持する。

- `/ranking/[key]`: 単一の問い・事実を取る集客面
- `/blog/[slug]`: 背景、理由、生活への含意を説明する集客面
- `/survey/[key]`: 同じ調査に属する問いを束ねる潜在集客ハブ
- `/themes` `/areas` `/compare`: 内部回遊・深掘り面

## 2. 背景と仮説

情報設計の実測では `/survey/*` は週 1,353 impressions、6 clicks、CTR 約 0.4%、平均順位 13.9 で、
表示機会はあるがクリックに転換できていない。現在の survey 詳細は調査概要とランキング一覧が中心で、
調査固有の疑問、読み方、代表的な論点を十分に説明していない。

**仮説**: 調査固有の検索意図と代表論点を明示し、ランキングと高品質記事を相互リンクすれば、
survey の CTR と順位、クラスター全体のクリック、ランキングからの記事回遊が改善する。

Google の people-first 方針に合わせ、独自分析、明確な出典、集計方法、著者情報を価値の中心に置く。
検索流入だけを目的とした薄い自動生成ページは作らない。

## 3. surveyごとに変えるもの

### 3.1 調査タイプ別の編集文法

| 調査タイプ   | 代表 survey                  | 主な読者意図                     | 優先する切り口                         | 注意点                                 |
| ------------ | ---------------------------- | -------------------------------- | -------------------------------------- | -------------------------------------- |
| 人口・世帯   | 国勢調査、人口推計           | 自分の地域、結婚、世帯、人口減少 | 年代・性別・家族構成・都市集中・時系列 | 母数、年齢階級、調査年                 |
| 出生・死亡   | 人口動態統計                 | 少子化、婚姻、離婚、健康         | 出生・死亡・婚姻の関係、長期変化       | 率と件数、因果表現、センシティブ表現   |
| 家計・消費   | 家計調査                     | 県民性、食文化、生活費           | 数量と支出、価格、季節性、食文化       | 都道府県ではなく県庁所在市の場合を明記 |
| 労働・賃金   | 賃金構造基本統計、労働力調査 | 転職、年収、雇用                 | 年齢・性別・職種・産業・生活コスト     | 名目値、標本、属性差                   |
| 住宅・土地   | 住宅・土地統計調査           | 空き家、家賃、持ち家、移住       | 住宅費、空き家、老朽化、地域選択       | 空き家定義、住宅数と世帯数             |
| 教育         | 学校基本調査                 | 進学、学校数、若者流出           | 進路、地域格差、人口移動               | 学力との混同、年度差                   |
| 産業・事業所 | 経済センサス、工業統計       | 地域経済、産業構造               | 特化産業、生産性、事業所規模           | 再編・分類変更、名目額                 |
| 行政・財政   | 地方財政状況調査             | 自治体財政、行政サービス         | 財政力、歳入構造、将来負担             | 単一指標で健全性を断定しない           |

### 3.2 各クラスターの4つの問い

各 survey は次の4方向から論点を選ぶ。全方向を機械的に埋める必要はない。

1. **どこが高い・低いか** — ranking が回答する
2. **なぜ地域差があるか** — blog が複数指標と背景を説明する
3. **生活や意思決定にどう関係するか** — blog が結婚、仕事、移住等へ翻訳する
4. **数字をどう読むか** — survey ハブが母数、対象、頻度、誤読注意を説明する

## 4. 初回実験: 国勢調査クラスター

### 4.1 スコープ

最初の対象は `census`（国勢調査）とする。ユーザーが提示した30代男性未婚率を起点に、既存 ranking を
監査してから次の最小構成を作る。

- survey ハブ: `/survey/census` 1ページ
- 主要 ranking: 既存から 3〜5ページを選定（未婚率、単身世帯、人口構成など）
- blog: 新規または既存改稿を 2本まで
  - A: 「30代男性の未婚率は地域でなぜ違うのか」
  - B: 「未婚率51.8%の読み方—母数・男女差・年齢階級」
- 内部リンク: survey ↔ ranking ↔ blog の三方向

記事タイトルは仮題であり、実装前に GSC query と既存記事重複を確認して確定する。

### 4.2 surveyハブの情報構成

1. 調査名、実施主体、調査周期、最新年
2. 「この調査で分かること」3〜5項目
3. 代表的な問い（自然文）と対応 ranking
4. 注目ランキング（既存 `featuredItems` を再利用）
5. 数字を読む際の注意（母数、対象、年齢階級、時点）
6. 関連する分析記事
7. 全ランキング一覧
8. 一次出典

一覧より前に独自解説を無制限に積まず、ファーストビュー付近でユーザーが目的の ranking に移動できる構成にする。

## 5. SSOTと実装境界

### 5.1 採用方針

survey 固有の編集情報は低 volume・人手・型/review 対象なので、**git TS を SSOT** とする。
R2 JSONを手編集しない。調査マスタと ranking 紐付けの既存 SSOT は変更しない。

推奨する責務分離:

```text
packages/ranking/src/data/surveys.json
  └─ 調査のreference情報（名称・組織・URL）: 既存のまま

新規のgit TS定義（配置は既存export・依存方向を読んでClaude Codeが確定）
  └─ surveyの編集情報
      ├─ summary
      ├─ whatYouCanLearn[]
      ├─ readerQuestions[] { question, rankingKey }
      ├─ caveats[]
      └─ relatedArticleSlugs[]

R2 app/survey/<id>/items.json
  └─ surveyに属するranking一覧: 既存の導出を維持
```

`surveys.json` に長文SEOコピーを混在させない。blog と survey の独自紐付けを R2 や DB に新設せず、
編集TS側に記事 slug を明示する。ranking↔survey は既存の `resolveSurveyLinkage` だけを使用する。

### 5.2 実装前にClaude Codeが確認するもの

- `apps/web/src/app/survey/[surveyKey]/page.tsx` の既存 exports・取得境界
- survey repository / R2 snapshot の型と呼び出し元
- article repository と `related-articles.ts` の再利用可否
- 既存 page_components / SectionHeader / ArticleShell
- `coding-standards.md`、`ui-components.md`、`survey-linkage-standards.md`
- `07_情報設計.md`、`13_統一レイアウト設計.md`、`12_完全DBレス設計.md`
- URL、metadata、構造化データを触る場合は `11_URL構造.md`

## 6. 段階的な実装計画

### Phase 0: 実測と重複監査

- GSCで `/survey/*` の直近28日 query/page を取得する
- `/survey/census` と関連 ranking の表示回数、CTR、順位をbaseline保存する
- 既存 blog の重複、cannibalization、利用可能なランキングを確認する
- 実験対象の ranking 3〜5件と記事0〜2件を確定する

**完了条件**: 対象URL、query、baseline、記事タイトル、内部リンク図が確定している。

### Phase 1: 編集TSとcensusハブ

- 最小の型と `census` 1件だけを追加する
- 定義欠落 survey は現行UIへフォールバックさせる
- census ハブに「分かること」「代表的な問い」「注意点」「関連記事」を描画する
- metadata は本文と一致させ、誇張・一律テンプレ化を避ける

**完了条件**: 他74 surveyの表示を壊さず、censusだけ編集ハブになる。リンク切れと重複H1がない。

### Phase 2: クラスター内部リンク

- census → 対象ranking / blog
- 対象ranking → census / 対応blog
- blog → 根拠ranking / census
- リンク文言は「詳しく見る」の一律表現ではなく、遷移先の問いを記述する

**完了条件**: 3ページ種を2クリック以内で回遊でき、リンク先が内容的に一致する。

### Phase 3: 記事制作

- 既存記事で検索意図を満たせる場合は新規作成より改稿を優先する
- 数字はR2観測値を使い、調査年・対象・母数・出典を明示する
- 相関を因果として書かず、地域スティグマを生む断定を避ける
- 著者、作成方法、更新日、`Article`構造化データを既存規約に沿って確認する

**完了条件**: factual/quality reviewを通り、rankingと矛盾する数値がない。

### Phase 4: 計測と横展開判定

デプロイから4〜8週後、baselineと比較する。季節性とquery mixの変化を注記する。

| 指標     | 主対象              | 成功の目安                                      |
| -------- | ------------------- | ----------------------------------------------- |
| CTR      | `/survey/census`    | baseline比 +30%以上、かつ impressions 100以上   |
| clicks   | クラスター合計      | baseline比 +20%以上                             |
| 平均順位 | 対象query           | 2順位以上改善、または11〜20位からTop10入り      |
| 内部遷移 | survey→ranking/blog | GA4でクリック発生を確認。初回値を次回基準にする |
| 品質     | 全対象              | 誤出典、数値不一致、soft 404、重複canonicalが0  |

母数不足なら `effect/none` と断定せず計測期間を延長する。横展開順は推測で固定せず、
`docs/04_レビュー/2026-07-11-survey-portfolio-audit.md` のGSC実測を使う。現時点の次監査は
賃金構造基本統計調査（直近28日447 impressions）を最優先とする。

## 7. やらないこと

- 75 surveyの一括AI長文化
- 47都道府県ごとの薄い記事生成
- ranking↔survey紐付けロジックの別実装
- R2 JSONや生成snapshotの手編集
- query parameter違いの類似ページ量産
- 未検証の相関を「理由」や「原因」と断定
- 実験ごとの本番デプロイ（まとまりで1回、明示承認後）

## 8. Claude Codeへの着手指示

次の順に依頼する。初回依頼では **Phase 0のみ** とし、調査結果をレビューしてから実装へ進む。

```text
docs/02_実装計画/20_survey別コンテンツクラスター戦略.md を正典として、Phase 0 のみ実施してください。
コードは変更せず、/survey/census と関連 ranking/blog の現状、GSC baseline、重複、内部リンク、
利用可能な ranking を監査し、実装対象3〜5 rankingと記事案0〜2本を提案してください。
調査結果は docs/04_レビュー/YYYY-MM-DD-survey-census-cluster-audit.md に保存してください。
不明な検索意図を推測で確定せず、根拠queryを併記してください。デプロイはしないでください。
```

Phase 0承認後:

```text
上記戦略と承認済み監査結果に従い、Phase 1〜2だけを外科的に実装してください。
既存のsurvey linkageとR2 snapshotを変更せず、編集情報はgit TSをSSOTにしてください。
census 1件で実証し、他surveyは現行表示へフォールバックさせてください。
対象テストと apps/web type-check を実行し、フルbuild未実行なら明記してください。デプロイはしないでください。
```

## 9. 関連する正典

- `docs/01_技術設計/07_情報設計.md`
- `docs/01_技術設計/12_完全DBレス設計.md`
- `docs/02_実装計画/15_ブログSEO拡充戦略.md`
- `docs/02_実装計画/16_月間100万PVロードマップ.md`
- `docs/02_実装計画/17_家計調査論点カタログ.md`
- `.claude/rules/survey-linkage-standards.md`
- `.claude/rules/blog-quality-standards.md`
- Google Search Central: Creating helpful, reliable, people-first content
- Google Search Central: Article structured data

## 10. 事前監査の完了状態（2026-07-11）

- 全74 surveyのR2在庫とGSC優先順位: 完了
- `census` baseline・query・代表導線: 完了
- `wage-structure-survey` baseline・query・76件分類・代表5件・記事重複・定義: 完了
- Claude Code実装受入条件と禁止境界: 完了
- 実装後のlocalhost/full build/本番確認: Claude Codeへ移譲
- デプロイ後4〜8週の効果測定: 時間経過後に実施

これ以降、実装前の追加調査を目的なく広げない。次の作業はハンドオフに従う実装検証である。
