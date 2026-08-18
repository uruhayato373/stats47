---
type: agent-reference
feature: site-navigation-graph
created: 2026-07-18
owners: [performance-auditor, blog-seo-strategist]
tags: [回遊, 内部リンク, recommendation, blog, ranking, theme, area, GA4]
---

# サイト回遊グラフ・レコメンド基盤仕様

> 進捗・優先順位のSSOTは
> `.claude/todo/05_機能バックログ.md#KAIYU-HUB-01`。
> 本文書は`seo-audit --focus content`と実装担当が読む詳細参照であり、進捗状態を重複管理しない。

## 0. 決定

blog、ranking、theme、areaを別々の関連記事実装として扱わず、同じcontent graph上のnodeとして接続する。
ただし、万能なAIレコメンドやユーザー追跡は導入しない。候補生成、score、重複排除、配置、計測は決定的コードで行い、
ページごとの表示componentは既存の文脈別UIを維持する。

2026-07-18、オーナーの明示指示により、マーケティング戦略のT3待ちをこの施策に限って解除した。直ちに全Phaseを実装する承認ではなく、
Phase 0のread-only監査を開始できる承認である。Phase 0の結果確認後にPhase 1へ進み、以後も各Phaseのgateを維持する。

```text
検索/SNS
  ↓
blog または ranking（集客面）
  ↓ answer bridge
theme または area（回遊・深掘り面）
  ↓ detail bridge
ranking / blog / survey
  ↓
次の関連content または収益導線
```

## 1. 成功条件

1. blog/ranking/theme/areaの全詳細ページが、次に進む明確なprimary linkを1〜3件持つ。
2. 同一destinationを本文、rail、footerで重複表示しない。
3. 「なぜおすすめか」を同テーマ、同県、同調査、反対指標等のreason codeで説明できる。
4. URL、label、score、placementを決定的に再現できる。
5. link impression/click、source/destination type、position、reasonをGA4で測れる。
6. pageviews/sessionだけでなく、入口別の2ページ目到達率と有意義な深掘りを評価できる。
7. 欠損時は既存tag/category linkへ縮退し、R2障害でページ本体を失敗させない。
8. 永続D1、個人profile、閲覧履歴server保存、LLM runtime呼出しを追加しない。
9. 既存canonical、SSG/ISR、R2 snapshotを壊さない。
10. 実測で効果がないslotは撤去できる。

## 2. 非目的

- TikTok/YouTube型の無限feed。
- 個人ごとの行動profile、cookie based personalization。
- LLMによるrequest時recommendation。
- 内部link数を増やすだけのSEO施策。
- 全pageに同じ「関連記事8件」を置くこと。
- 広告clickを回遊成功に含めること。
- theme/areaを検索集客KPIで評価すること。

## 3. 現状と課題

### 3.1 既存資産

| 既存 | 現状 | 再利用 |
|---|---|---|
| `getRelatedArticleSummaries` | 複数tagを順に集約、slug dedup | candidate source |
| `RelatedRankingsGrid` | 同categoryの先頭最大8件 | presentation、候補source |
| `RankingPageSidebarSection` | survey、related article | presentation |
| `ThemeRelatedArticles` | `relatedArticleTagKeys` | presentation、authored edge |
| `ThemeIndicatorCatalogSection` | theme→ranking | authoritative edge |
| `AreaRelatedRankingsCard` | 県のstrength/weakness | authoritative area edge |
| `RelatedAreas` | 同地域の県 | geography edge |
| `AreaRelatedBlogArticles` | area→blog | presentation |
| correlation snapshot | ranking間相関 | weak candidate、guard必要 |
| analytics events | CTA/home featured等の一部 | event helper拡張 |

### 3.2 問題

- selectionがtag入力順やcategory配列順に依存し、関連度を説明できない。
- blog→rankingはあるがblog→area/theme、ranking→theme/areaが体系化されていない。
- themeはindicator catalogが強いが、ユーザーが次に見るべき入口が多すぎる。
- areaは強み/弱みからrankingへ行けるが、そのindicatorを束ねるthemeへの橋が弱い。
- 同じlinkがrail、本文、article markdownに重複し得る。
- impressionがないため、0 clickが「見られなかった」のか「魅力がない」のか分からない。
- 全22 themeのinternal navigationが未計装。
- `/tag/*` 410問題が残り、blog taxonomy経路自体に既知の断線がある。

## 4. 回遊の役割設計

### 4.1 ページ別の次行動

| source | ユーザー状態 | primary destination | secondary |
|---|---|---|---|
| blog | 背景・理由を読んだ | 根拠ranking | 関連area/theme |
| ranking | 単一事実を確認した | 同調査/対になるranking | 解釈blog/theme |
| theme | 複数指標を俯瞰した | 注目ranking | 自分のarea/blog |
| area | 自県の特徴を確認した | 強み/弱みranking | 関連theme/近隣area |
| survey | 調査の指標群を見た | 代表ranking | 解釈blog |

### 4.2 placement

| placement | 件数 | 目的 |
|---|---:|---|
| `answer_bridge` | 1 | 結論直後に根拠/深掘りへ |
| `section_bridge` | 1〜2 | section内容に対応する次link |
| `rail_related` | 3 | desktopで次候補を常時提示 |
| `end_next` | 3 | 読了後の次の行動 |
| `hub_featured` | 3〜6 | theme/area hubの主要入口 |

同一ページではdestination URLをplacement横断でdedupする。`answer_bridge`に出たものをrailへ再掲しない。

## 5. Content Graph

### 5.1 node

```ts
type ContentNodeType = "blog" | "ranking" | "theme" | "area" | "survey" | "category";

interface ContentNode {
  id: `${ContentNodeType}:${string}`;
  type: ContentNodeType;
  key: string;
  url: string;
  title: string;
  description: string | null;
  status: "active" | "noindex" | "retired" | "missing";
  categoryKeys: string[];
  themeKeys: string[];
  tagKeys: string[];
  areaCodes: string[];
  surveyIds: string[];
  rankingKeys: string[];
  updatedAt: string | null;
}
```

### 5.2 edge

```ts
type EdgeReason =
  | "authored_explicit"
  | "same_survey"
  | "theme_metric"
  | "article_cites_ranking"
  | "shared_area"
  | "area_strength"
  | "area_weakness"
  | "same_category"
  | "shared_tags"
  | "same_region"
  | "correlation"
  | "popular_fallback"
  | "recent_fallback";

interface ContentEdge {
  from: ContentNode["id"];
  to: ContentNode["id"];
  reason: EdgeReason;
  weight: number;
  provenance: string;
  authored: boolean;
}
```

### 5.3 edge優先順位

```text
authored explicit
  > 同survey / theme metric / article内引用
  > shared area / strength / weakness
  > same category / shared tags
  > correlation
  > popular/recent fallback
```

相関だけでrecommendしない。人口規模等の疑似相関を避け、相関edgeは別のcategory/theme/tag edgeが1つ以上ある場合だけ候補化する。

## 6. SSOTと生成

### 6.1 入力

- ranking: git TS metric config、survey snapshot、category、tag、correlation R2。
- blog: `article.md` frontmatter/本文linkから生成したR2 article snapshot。
- theme: ThemeCatalog/indicator sets/page-components git TS。
- area: 47県master、databook、strength/weakness R2 derived snapshot。
- authored override: git TS `packages/data-configs/src/navigation/curated-edges.ts`。

### 6.2 出力

```text
R2 app/navigation/v1/nodes.json
R2 app/navigation/v1/by-source/<type>/<key>.json
R2 app/navigation/v1/manifest.json
```

git TSと既存article/metric/theme定義がauthored SSOT。navigation snapshotはderivedで再生成可能。永続D1を追加しない。
runtimeはsource別small JSONだけを読み、全graphを毎requestで走査しない。

### 6.3 配置案

```text
packages/navigation/
├── src/
│   ├── types.ts
│   ├── reason-codes.ts
│   ├── build-nodes.ts
│   ├── build-edges.ts
│   ├── score-candidates.ts
│   ├── select-recommendations.ts
│   ├── validate.ts
│   └── index.ts
├── scripts/export-navigation-snapshot.ts
└── src/__tests__/

apps/web/src/features/navigation/
├── repositories/navigation-snapshot.ts
├── components/RecommendationSlot.tsx
├── components/TrackedRecommendationLink.tsx
├── components/NextContentSection.tsx
└── lib/presentation.ts
```

presentationは万能cardを強制せず、`RecommendationSlot`がtyped itemsを既存RailCard/SurfaceLinkCardへ渡す薄い境界にする。

## 7. 決定的score

```text
score = edgeWeight
      + destinationQuality
      + freshness
      + popularityWithinType
      + journeyFit
      - duplicationPenalty
      - sameTypeFatigue
      - stalePenalty
      - riskPenalty
```

初期weight例:

| reason | weight |
|---|---:|
| authored_explicit | 100 |
| same_survey | 90 |
| theme_metric | 85 |
| article_cites_ranking | 85 |
| area_strength/weakness | 80 |
| shared_area | 70 |
| same_category | 50 |
| shared_tags | 40〜60（共有数） |
| same_region | 35 |
| correlation | 20 |
| popular/recent fallback | 10 |

値はconfigにし、コードへ散在させない。同点は`to` ID昇順で安定化する。

### 7.1 journeyFit

- blog→ranking +20、blog→theme/area +10。
- ranking→blog/theme +15、ranking→same survey +20。
- theme→ranking +20、theme→blog/area +10。
- area→ranking +20、area→theme +15、area→area +5。
- 同typeが3件続く場合は3件目以降penalty。

### 7.2 quality gate

candidateは次を満たす。

- active、canonical URLが有効、self linkでない。
- noindex/410/retiredでない。
- title/descriptionが存在。
- data年次がstale policy内、またはstale注記がある。
- blogは公開済み、rankingはknown active key。
- authored禁止edge、政治/炎上等のbrand riskに該当しない。

## 8. UI/UX

### 8.1 共通表示

各recommendationは次を持つ。

- content type label。
- title。
- reason label（例:「同じ統計調査」「東京都の上位指標」「この記事の根拠データ」）。
- optional meta（年度、1位県、更新日）。
- optional data thumbnail。railは小さく、inlineは原則text-first。

### 8.2 Blog

- 記事が明示的に引用するrankingを`answer_bridge`最優先。
- 記事末は`根拠データ`、`同テーマの記事`、`関連する県`を各最大1件。
- railは本文内/末尾に出ていない3件。
- markdown内の手書き関連記事sectionは移行後に重複を監査し、ページcomponentを正典にする。

### 8.3 Ranking

- first visual後に同surveyまたは対になる指標1件。
- AI考察後にblog/theme。
- footerは同categoryだけで8件埋めず、same survey、theme、blog、categoryを混ぜた3〜6件。
- correlationは「一緒に動く指標」と明示し、因果を示唆しない。

### 8.4 Theme

- 10〜15指標を平坦表示する前に「まず見る3指標」をauthored/scoreで提示。
- 全国表示では注目ranking→blog→area selector。
- 県選択時はその県の強み/弱みranking→area page。
- 広告/promoより前にnext contentを置く。

### 8.5 Area

- 上位/下位から各1〜3ranking。
- 指標が属するthemeへ直接linkし、現在の一律`/themes` linkを具体themeへ変える。
- 同地域areaは比較意図がある場合だけ2〜4件。
- city pageは親県、同県city、該当rankingの順。

## 9. Analytics event contract

```ts
interface NavigationImpressionEvent {
  source_type: ContentNodeType;
  source_id: string;
  destination_type: ContentNodeType;
  destination_id: string;
  placement: "answer_bridge" | "section_bridge" | "rail_related" | "end_next" | "hub_featured";
  position: number;
  reason: EdgeReason;
  algorithm_version: string;
  experiment_id?: string;
  variant?: string;
}
```

event:

- `internal_recommendation_impression`: IntersectionObserverで50%以上・1秒。session内同slot一度。
- `internal_recommendation_click`: link click。
- `internal_journey_continue`: destination側でsource markerをsessionStorageから読み、到達を確認。

raw URL/query/titleを送らず、typed IDを送る。cookie consent既存設定に従う。event送信失敗でnavigationを止めない。

## 10. KPI

primary:

- recommendation CTR = click/impression。
- second-page rate = landing sessionで2ページ目へ進んだ割合。
- meaningful continuation = destinationで10秒またはchart interaction/50% scroll。
- pages/session（参考）。

guardrail:

- source page completion、bounce、LCP/INP/CLS。
- ad viewability/revenue/session。
- destination 404/410/error率。
- same destination concentration。

ページtype別:

- blog/ranking: 入口から2ページ目到達。
- theme/area: ranking/blogへのoutbound CTRと滞在。
- SEO crawl link数は補助であり、ユーザーCTRより優先しない。

## 11. Experiment

Phase 1 pilotは各source typeで1 placementだけ。

| pilot | control | variant |
|---|---|---|
| blog end | tag順関連記事 | graph mixed 3件 |
| ranking related | same category 8件 | survey/theme/blog混合6件 |
| theme top | catalogのみ | まず見る3指標 |
| area strength | ranking linkのみ | ranking + specific theme |

hash(source ID)でvariantを安定割当し、cookie personalizationは不要。最低2週間かつ各variant 500 impressionを暫定gateとする。
sample不足は`inconclusive`。複数placementを同時変更しない。

## 12. Failure/fallback

- snapshot 404/parse失敗: 現行関連componentへfallback。
- candidate 0: category/theme/areas hubへの明示link1件。
- image failure: text-first cardへ。
- analytics failure: linkは通常遷移。
- stale manifest: `generatedAt`をlog、page renderingは継続。
- destinationが410: build validatorでfail。runtimeでもfilter。

## 13. 段階実装

### Phase 0: inventory/measurement

- 現行の全source→destination link、selection、placement、重複を監査。
- `/tag/*` 410を回遊基盤の前提blockerとして解決方針確定。
- GA4 custom dimension/eventの既存状態を確認。
- graph schemaとfixtureだけ設計し、UI変更なし。

### Phase 1: pure graph

- node/edge/type/reason/score/select/validatorとsynthetic fixture。
- R2 write、UI、GA4なし。

### Phase 2: snapshot

- read-only inputsからderived snapshot生成、`/tmp` dry-run。
- coverage、orphan、410、duplicate、top destination concentration report。
- 承認後だけR2 exportを追加。

### Phase 3: one pilot

- blog endだけをpilotし、impression/click/continueを計測。
-既存related implementationをfallbackに残す。

### Phase 4: cross-type

- ranking、theme、areaを1つずつ追加。
- effect確認後に重複旧logicを整理。

### Phase 5: operation

- weekly broken-edge audit、monthly CTR/journey review。
- weight変更はexperiment proposal→承認→version更新。

## 14. テスト

- node ID/canonical/status。
- edge provenance/weight/reason。
- stable ordering、self/duplicate/noindex/410除外。
- source type別mixとsame-type fatigue。
- fallback、0 candidate、stale manifest。
- event payloadにraw URL/query/title/PIIがない。
- impression observer dedup。
- navigationがanalytics failureで妨げられない。
- snapshot schema、referential integrity、全active detail page coverage。
- representative component a11yとvisual regression。

## 15. 受入条件

- [ ] 全詳細pageの現行outbound link inventoryがある。
- [ ] graphのauthored/derived SSOTが明確。
- [ ] selectionが理由付き・決定的・versioned。
- [ ] runtime LLM、永続D1、personal profileがない。
- [ ] destination重複と410/noindex linkがない。
- [ ] source typeごとの次行動が異なる。
- [ ] impression/click/continueを同一contractで測れる。
- [ ] theme internal nav未計装が解消される。
- [ ] fallbackで既存UXを維持する。
- [ ] 1 pilotずつ評価し、effect前に全展開しない。

## 16. Claude Code Phase 0 prompt

```text
Output Format:
1. source page type別の現行内部link inventory
2. selection/data source/component/eventのmap
3. 重複・断線・未計装一覧
4. graph node/edgeへの写像案
5. Phase 1最小file/test案
6. 未変更・未検証事項

stats47のサイト回遊グラフPhase 0監査だけを行ってください。

必読:
- CLAUDE.md
- .claude/skills/analytics/seo-audit/reference/site-navigation-graph.md
- docs/01_技術設計/03_情報設計.md
- docs/01_技術設計/02_データアーキテクチャ.md
- docs/01_技術設計/04_デザインシステム.md
- docs/01_技術設計/03_情報設計.md
- .claude/rules/evidence-based-judgment.md
- .claude/rules/data-storage.md
- .claude/rules/ui-components.md

対象:
- blog/ranking/theme/area/surveyの詳細ページ
- related article/ranking/theme/area componentとservice
- tag/category/survey/theme catalog/area strength/correlation
- apps/web/src/lib/analytics/events.ts
- TAG-410、THEME-INTERNALNAV-01、KAIYU-HUB-01

制約:
- read-only監査のみ。コード、docs、state、R2を変更しない。
- browser、deploy、外部writeを行わない。
- LLM runtime recommendationや永続D1を提案しない。
- git statusを確認し、ユーザーの既存変更を所有/上書きしない。

成功条件:
- 各pageの候補生成、選定、表示、計測、fallbackが追跡できる。
- 重複URL、tag 410、未計装slotが具体的に列挙される。
- Phase 1がpure graph/types/score/fixture testだけに絞られる。
```
