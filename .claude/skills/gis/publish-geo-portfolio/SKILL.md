---
name: publish-geo-portfolio
description: >
  Geo企画カタログの4分析を、canonical Geoページ、ブログ、X、note再現パック、計測まで公開する統合オーケストレーション。
  カタログの順序とgateを守り、既存owner skillへ委譲する。Use when user says "Geoを全て公開", "GIS企画を展開", "Geo商品化".
disable-model-invocation: true
primary_agent: strategy-advisor
co_agents: [gis-curator, gis-pipeline-runner, article-writer, x-strategist, note-manager, r2-publisher, devops-runner]
argument-hint: "[--content geo-016|all] [--surfaces geo,blog,x,note] [--publish]"
---

# publish-geo-portfolio

## フロー

`/fetch-mlit-ksj` → `/build-geo-analysis` → ★`/publish-geo-portfolio` → `/verification-loop` → `/deploy` → 計測

Geo企画を一度きりの作業にせず、git TSカタログから無料閲覧、編集記事、SNS、販売物、計測へ展開する。
新しい専門agentは作らない。判断はカタログ、実行は既存owner skill、配信状態は実URL・R2・投稿台帳から確認する。

## 正典と状態

- 企画、順序、読者価値、停止条件: `packages/data-configs/src/business-plan/geo-content-lifecycle.ts`
- 分析入力、演算、canonical: `packages/data-configs/src/business-plan/m1.ts`
- Geo証拠: `.local/r2/app/geo/<slug>/{item,manifest,pref/<NN>}.json`
- ブログoutbox: `docs/21_ブログ記事原稿/<slug>/`
- X draft台帳: `.claude/state/sns/posts.json`
- 商品成果物: `.local/geo-products/<product-id>/`
- note商品企画: `.claude/scripts/note/catalog/data/stats47-note.ts`

`ready/draft/gated`はカタログ上の実行可能性であり、外部公開済みを表す台帳ではない。
公開状態をgit TSへ手書きしない。URL、R2 object、X/noteの外部状態を実測する。

## 引数

- `--content <contentId|all>`: 既定は`all`。launch orderで`geo-016 → geo-031 → geo-062 → geo-001`。
- `--surfaces <csv>`: 既定は`geo,blog,x,note`。
- `--publish`: R2、X、note、develop→mainを含む外部公開を許可する。無い場合は生成・監査・draft登録まで。

## Phase 1: カタログとGeo証拠

1. `/business-plan-operate`の契約でカタログ整合性を確認する。
2. `/build-geo-analysis`の契約で47県artifact、lineage、保存則を再監査する。
3. canonical、方法、データカタログをGooglebot UAで確認する。

```bash
npm run business-plan:check
npm run geo:audit-analysis
npm run products:geo:plan --workspace @stats47/product-factory
```

Geoの公開停止条件は`.claude/rules/geo-analysis-standards.md`を優先する。manifest欠落、保存則不一致、
context-only混入、canonical不在の分析は、後続のブログ・X・noteも公開しない。

## Phase 2: ブログ

カタログの`editorial.blogSlug`ごとに`/write-prepared-article`を使う。記事型はH。

1. `article-writer`がcanonical Geo artifactだけから本文・図・source JSONを作る。
2. 別コンテキストの`blog-critic`がfull reviewを行う。
3. REVISEならwriterが直し、criticはdelta reviewでPASSを出す。
4. `quality-gate.mjs`を通し、`published: true`でoutboxへ置く。
5. `--publish`時だけ`blog-auto-publish.yml`または`publish-blog.yml`でR2へ公開する。

```bash
node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/<slug>/article.md
```

執筆者の自己レビュー、Geo表の丸ごと複製、未検証の数値、markdown表は公開不可。

## Phase 3: X

`/operate-geo-content`で15件の役割比、caption、画像SHA、観測値SHA、canonical着地を監査する。

```bash
npm run business-plan:export-m1-x
node .claude/skills/sns/post-x-batch/scripts/lint-x-captions.cjs \
  --in .local/r2/sns/_queue/business-plan-m1-x.json
npm run business-plan:render-m1-x-geo
npm run business-plan:audit-m1-x-geo
node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs \
  --in .local/r2/sns/_queue/business-plan-m1-x.json --sync-draft
```

`--publish`時だけ`/publish-x --from-queue --filter-domain geo --content-prefix geo-001-x-`へ渡す。
Xは`/geo`一覧ではなく、該当分析の県別stage、`/geo/method`、
または`/geo/compare`へ着地させる。

## Phase 4: note再現パック

結論は無料Geoページで公開したまま、再現工程、辞書、検算manifest、加工済みCSV/JSON、判断テンプレートを販売する。

```bash
npm run products:geo:generate --workspace @stats47/product-factory
npm run products:geo:validate --workspace @stats47/product-factory
```

1. `/design-note-structure`と`/write-note-section`で商品説明と利用手順を作る。
2. `note-critic`の意味レビューを通す。
3. 成果物のSHA、列定義、対象版、非対応事項、免責をnote原稿と一致させる。
4. frontmatterへ`product_archive: .local/geo-products/<articleKey>/<articleKey>.zip`と、有料本文中の`product_attachment_after`見出しを記載する。
5. `prepare-article.cjs`でZIPの所在・50MB上限・有料設定を検証し、`--publish`時だけ`/publish-note`へ渡す。
6. note上でファイル名が有料境界より後ろに表示されること、価格、境界、公開URLを実測する。添付失敗時は公開しない。
7. 公開後、catalog派生stateを生成し、`publish-paid-note-private-r2.ts <slug> --commit`で原稿・画像・商品ZIPを`stats47-private`へSHA-256検証付き保存する。public R2は`public.json`だけ、catalogの`r2Body:true`はprivate保存確認後だけ許可する。

無料ページの結論を隠すだけの有料化、住宅購入・安全性・徒歩時間の断定は停止する。

## Phase 5: R2、deploy、実測

`--publish`時はexact keyだけを`/push-r2`へ渡し、`/verification-loop`後に`/deploy`を1回だけ行う。
mainがdevelopより先行していれば、先にmainをdevelopへ同期する。

公開後は最低限、次を実測する。

- Geo canonical、県別stage、方法、データカタログ: HTTP 200、index
- ブログ4本: HTTP 200、article assetとsource-linkが表示
- X: draft/scheduled/postedの台帳と外部状態が一致
- note: 公開URL、価格、販売物の版とSHAが一致
- paid source: private R2のmanifest/全object hashが一致し、public R2の`draft.md`が404、`public.json`だけが200
- GA4/GSC: `geo_analysis_view`、データ導線、ブログ→Geo回遊を28日窓で評価

## 所有権

| 領域 | owner / skill |
|---|---|
| 企画順・停止条件 | business-plan catalog / strategy-advisor |
| GIS原典・分析証拠 | gis-curator / gis-pipeline-runner / `/build-geo-analysis` |
| ブログ | article-writer → blog-critic → blog-editor |
| X | x-strategist / sns-renderer / `/operate-geo-content` → `/publish-x` |
| note商品 | product-factory / note-manager / note-critic → `/publish-note` |
| R2・本番 | r2-publisher / devops-runner |

## Output Contract

`Content | Geo evidence | Canonical | Blog+critic | X ledger | Product validation | note | R2/deploy | Live URL`
の1表で返す。生成、監査、R2反映、外部公開を別状態として報告し、未実行を公開済みにしない。
