---
type: implementation-plan
date: 2026-07-17
status: active
tags: [home, ranking, featured, ctr, svg, ga4, experiment]
---

# ホーム「注目のランキング」CTR改善仕様

## 0. 結論

ホームの「注目のランキング」は、外部の画像生成AIや静的PNG/WebPを追加せずに改善する。

- 主役: ホーム専用の問い、比較、順位、都道府県名、数値
- 可視化: R2観測値から決定的に生成する既存タイル地図SVG
- 表示: HTML/CSS + inline SVG
- 計測: カード単位のimpression/clickと実験variant
- SSOT: git TSのホーム専用編集設定
- 配信: 既存`app/home/featured.json`へ派生値を焼き込む

ここで「画像生成は不要」とは、Gemini等によるAI画像や、カードごとのラスター画像ファイルを作らないという意味である。データ可視化としてのSVGは、既存snapshot生成時に引き続き決定的に生成する。

本施策が直接改善するKPIは、ホームから`/ranking/[key]`への内部CTRである。検索表示回数や検索CTRを直接増やす施策ではない。遷移後のランキングPV・回遊が増え、結果としてサイト利用量が増えることを狙う。

## 1. 背景と現状

### 1.1 現在の表示

`FeaturedRankings`は8件を2列/4列gridで表示し、次の2 variantを使う。

- `map`: 47都道府県タイル地図 + 1位
- `number`: 1位の数値を強調し、地図を薄い背景にする

`number`は表示値の数字が5桁以上の場合に`map`へfallbackする。そのためホーム内でカードの視覚階層が揃わず、8枚が似た地図に見える一方、一部だけ数値中心になる。

現行8件はmetric configの`isFeatured`と`featuredOrder`で固定されている。

1. 年間日照時間
2. 総人口
3. 将来人口増減率
4. 農業産出額
5. 財政力指数
6. 年間快晴日数
7. 一般行政職 定年退職者 平均退職手当
8. 消費支出

### 1.2 課題

1. 正式な指標名をそのままカードタイトルに使い、クリック理由が弱い
2. 地図が8枚並び、カード間の意味差が小さい
3. モバイル2列では長い指標名、地図、数値が競合する
4. `number`の桁数fallbackにより、意図しない見た目の混在が起きる
5. ホームカード単位のimpression/clickがなく、改善効果を判定できない
6. ホームの編集判断とcategory/surveyの`isFeatured`が同じフラグに依存している

### 1.3 需要根拠

2026-W28 GSCでは、次の問いに検索需要がある。

- 納豆消費量
- うどん消費量
- マヨネーズ消費量
- 生活費・生活コスト
- 子育てしやすい県
- 地方債・県債
- 空き家率
- 2050年人口
- カツオ水揚げ

ただし最初の実験で「見た目」と「掲載テーマ」を同時変更すると寄与を分離できない。Experiment V1は現行8指標を維持して表示だけを比較し、勝ちvariant確定後のV2で掲載テーマを入れ替える。

## 2. 成功条件と非目標

### 2.1 成功条件

- 現行controlとeditorial variantを同じ8指標で比較できる
- カードごとに問い・比較・地図・TOP3を使い分けられる
- 画像生成AI、静的画像、追加画像network requestが0
- `home_featured_impression`と`home_featured_click`を計測できる
- `ranking_key / card_variant / slot / experiment_id / experiment_variant`を送れる
- 50%以上が1秒表示されたカードだけimpressionを1回送る
- 同一browserへexperiment variantをsticky割当する
- 既存R2 snapshotで壊れず、派生値不足時はcontrolへfallbackする
- 新snapshotではホーム表示時の追加values fetchが0
- 390px、desktop、light/darkで読める
- CLSを増やさず、キーボード操作とfocus表示を維持する

### 2.2 非目標

- AIイラスト、写真、人物画像をカードへ追加する
- OGPやSNS画像を作り直す
- ランキング詳細ページのh1/seoTitleを変更する
- category/surveyカードを同時に再設計する
- 新しいCMS、DB、JSON SSOTを作る
- GSC検索CTRの効果を本施策へ帰属する
- Experiment V1で掲載テーマも同時に変更する
- 本番deploy、R2 write、GA4管理画面設定を無承認で行う

## 3. 画像生成が不要な理由

### 3.1 ランキングカードのクリック理由

カードで伝えるべき情報は、次の4つである。

1. 何が意外なのか
2. どの県が1位なのか
3. どれほど差があるのか
4. 自分の県も確認できるのか

一般的なAI背景はこれらの答えを増やさず、統計との対応も保証しない。カード幅が小さいモバイルでは、背景画像が文字の可読性を下げる可能性もある。

### 3.2 データ由来SVGの利点

- snapshotと同じ数値から生成できる
- 年次更新時に自動更新できる
- 追加の画像配信・R2 key管理が不要
- light/darkとsemantic colorへ追従できる
- SVG文字列をsnapshotへ焼き込めばruntime計算が不要
- 値と画像が不一致になる二重SSOTを作らない

### 3.3 将来AI画像を検討する条件

次をすべて満たした場合だけ、別施策として検討する。

- データカードvariantのCTRが頭打ち
- AI背景あり/なしを同じcopyと指標で比較できる
- LCP/転送量のguardrailを定義済み
- 背景が統計の意味を誤認させない
- OGP/SNS用資産との再利用価値がある

今回のClaude Code実装には含めない。

## 4. SSOT設計

### 4.1 ホーム専用設定を分離する

新規ファイル:

```text
packages/data-configs/src/home-featured-rankings.ts
```

metric configの`isFeatured`はcategory/survey等でも使われるため削除しない。ただしホームの選定・順番・hook・visual variantは新しいgit TSをSSOTにする。

```ts
export const HOME_FEATURED_CARD_VARIANTS = [
  'question',
  'comparison',
  'territory',
  'top-three',
] as const;

export type HomeFeaturedCardVariant =
  (typeof HOME_FEATURED_CARD_VARIANTS)[number];

export interface HomeFeaturedRankingDefinition {
  rankingKey: string;
  order: number;
  hook: string;
  variant: HomeFeaturedCardVariant;
}

export const HOME_FEATURED_RANKINGS: readonly HomeFeaturedRankingDefinition[] =
  [
    // authored definitions
  ];
```

### 4.2 validation

build/test時に次を決定的に検査する。

- `rankingKey`重複なし
- `order`重複なし、1始まりの連番
- 初期8件
- `rankingKey`が`METRICS_REGISTRY`に実在
- `isActive: true`
- `entities`に`prefecture`を含む
- hookは改行なし、8〜28文字
- variantがallowlist内
- hookへ年度や数値を固定埋め込みしない

hookはホーム専用編集copyであり、rankingの`title/seoTitle`を上書きしない。

### 4.3 Experiment V1の設定

Experiment V1は現行8指標を維持する。

| order | rankingKey                                                  | hook候補                   | editorial variant |
| ----: | ----------------------------------------------------------- | -------------------------- | ----------------- |
|     1 | `annual-sunshine-duration`                                  | 日照時間が最も長い県は？   | question          |
|     2 | `total-population`                                          | 人口上位3県で全国の何割？  | top-three         |
|     3 | `future-population-change-rate-2050`                        | 2050年、人口が増える県は？ | question          |
|     4 | `agricultural-output`                                       | 農業産出額の上位3県は？    | top-three         |
|     5 | `fiscal-strength-index-prefecture`                          | 財政力が高い県と低い県     | comparison        |
|     6 | `annual-clear-days`                                         | 快晴日数1位は沖縄？        | question          |
|     7 | `retirement-allowance-admin-prefecture`                     | 退職手当は県でいくら違う？ | comparison        |
|     8 | `consumption-expenditure-multi-person-households-per-month` | 最も消費支出が多い県は？   | question          |

「全国の何割」等の派生値をhook本文へ表示する場合はsnapshotで計算する。計算しない初期実装では、hookを「人口上位3県は？」へ短縮し、未算出の答えを作らない。

## 5. R2 snapshot設計

### 5.1 key

既存を維持する。

```text
app/home/featured.json
```

新しいR2 keyや画像prefixを作らない。

### 5.2 派生型

`FeaturedRankingItem`へoptionalで追加する。

```ts
interface FeaturedValue {
  rank: number;
  areaName: string;
  value: string | null;
}

interface FeaturedRankingItem extends RankingItem {
  featuredTop?: FeaturedValue | null;
  featuredBottom?: FeaturedValue | null;
  featuredTopThree?: FeaturedValue[];
  tileMapSvg?: string | null;
  homeFeatured?: {
    order: number;
    hook: string;
    variant: HomeFeaturedCardVariant;
  };
}
```

すべてoptionalにし、旧snapshotを読んでも壊れないようにする。

### 5.3 exporter

`packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts`を次のように変更する。

1. `HOME_FEATURED_RANKINGS`の順番でRankingItemを解決
2. active/prefecture/実在を再検証
3. 1指標につきvaluesを1回読む
4. null値を除外
5. `rank`昇順でtop/top3、降順の末尾でbottomを決める
6. 表示値は既存display規則でlocale整形
7. 既存`generateMiniTileSvg`でmapを生成
8. `homeFeatured`のhook/variantを焼き込む
9. 8件を`app/home/featured.json`へ保存

同順位がある場合は元のrankを保持する。「47位」と固定表示せず、snapshotの実rankを表示する。

### 5.4 旧snapshot fallback

- `homeFeatured`欠損: 現行map/number controlを表示
- `question`: `featuredTop`があれば表示可能
- `territory`: `tileMapSvg`と`featuredTop`があれば表示可能
- `comparison`: `featuredBottom`欠損ならcontrolへfallback
- `top-three`: 3件未満ならcontrolへfallback

localhost確認で旧snapshotしかない場合、必要なitemだけvaluesを追加fetchしてin-memory補完してよい。新snapshot反映後は追加fetch 0になることをテストする。

## 6. UI variant仕様

### 6.1 共通

- 外枠は`SurfaceLinkCard`を使用
- `rounded-none`、通常border、hoverは`shadow-md`まで
- hookは最大2行
- 数値は`font-mono tabular-nums`
- 年度・単位を省略しない
- card全体をlinkにする
- focus-visibleを保持
- 同一grid内の高さを揃える
- mapはtrusted generator outputだけを`dangerouslySetInnerHTML`へ渡す

### 6.2 control

現行`map/number`をそのまま保持する。Experiment V1の対照群であり、削除しない。

### 6.3 question

```text
┌─────────────────────┐
│ 2050年              │ eyebrow
│ 人口が増える県は？   │ hook
│                     │
│ +2.5%               │ answer value
│ 1位 東京都           │ answer area
│        [薄い地図]    │ decoration
└─────────────────────┘
```

- hookを第一要素にする
- answerはtop value + area
- 地図は背景または右下35%以内
- hookとanswerが同じ内容を繰り返さない

### 6.4 comparison

```text
┌─────────────────────┐
│ 財政力が高い県と低い県│
│ 1位        最下位    │
│ 東京        ○○       │
│ 1.064      0.xxx     │
└─────────────────────┘
```

- topとbottomを左右2列
- 実rankを表示
- 単位を双方へ重複表示せず共通captionに置く
- ratioは負数/0/指数で誤読しやすいため初期実装では出さない

### 6.5 territory

```text
┌─────────────────────┐
│ 納豆消費の境界は？   │
│ [タイル地図 55%]     │
│ 1位 ○○県 xxx円      │
└─────────────────────┘
```

- mapを主役にする唯一のeditorial variant
- 凡例を残す
- 色だけで1位を表さずarea/valueを併記

### 6.6 top-three

```text
┌─────────────────────┐
│ 農業産出額の上位3県は？│
│ 1 北海道  1,347,800  │
│ 2 ○○県     xxx,xxx  │
│ 3 ○○県     xxx,xxx  │
└─────────────────────┘
```

- 表彰台イラストは使わず3行の順位リスト
- 県名と値を同じbaselineへ揃える
- 長い値は既存の表示変換を使い、CSS縮小で押し込まない

## 7. Component構成

```text
FeaturedRankings (Server)
  ├─ R2 featured snapshot読込
  ├─ config/legacy fallback解決
  └─ FeaturedRankingExperimentGrid (Client)
       ├─ experiment sticky割当
       ├─ fixed-height placeholder
       └─ TrackedFeaturedRankingCard (Client)
            ├─ impression observer
            ├─ click event
            └─ FeaturedRankingCardVisual (presentational)
                 ├─ ControlCard
                 ├─ QuestionCard
                 ├─ ComparisonCard
                 ├─ TerritoryCard
                 └─ TopThreeCard
```

`FeaturedRankings`はdata取得、Client gridは割当と計測、Visualは表示だけを担当する。Visual内でR2 fetchやgtagを呼ばない。

新規配置はranking feature固有のため、`apps/web/src/features/ranking/components/FeaturedRankings/`配下に置く。

## 8. Experiment設計

### 8.1 variant

```text
experiment_id: home-featured-v1
control: 現行map/number
editorial: metricごとのquestion/comparison/territory/top-three
weight: 50 / 50
```

### 8.2 sticky assignment

- localStorage key: `stats47_exp_home_featured_v1`
- 値: `control`または`editorial`
- 初回だけ50/50で割当
- 以降は同一browserで固定
- localStorage不可時はsession内だけ固定
- 個人情報や乱数値をGA4へ送らない

既存`VariantAdSlot`のsticky assignmentパターンを参考にするが、広告domain logicをimportしない。必要最小限の純関数をranking feature内に置く。

### 8.3 hydration/CLS

SSGを維持するためclientで割り当てる。mount前はcard gridと同じ高さのplaceholderを描画し、variant確定後に差し替える。

- placeholderと実cardの高さを同じにする
- grid全体を空のままcollapseさせない
- `suppressHydrationWarning`で隠さない
- cookie参照でhomeをdynamic化しない

## 9. GA4計測

### 9.1 events

`apps/web/src/lib/analytics/events.ts`へ追加する。

```ts
trackHomeFeaturedImpression({
  rankingKey,
  cardVariant,
  slot,
  experimentId,
  experimentVariant,
});

trackHomeFeaturedClick({
  rankingKey,
  cardVariant,
  slot,
  experimentId,
  experimentVariant,
});
```

event名:

```text
home_featured_impression
home_featured_click
```

parameter:

```text
ranking_key
card_variant
slot
experiment_id
experiment_variant
link_position=home_featured
```

### 9.2 impression条件

既存`AdImpressionTracker`と同じ機械条件を使う。

- IntersectionObserver threshold 0.5
- 1秒連続表示
- card mountにつき1回
- 1秒前にviewport外へ出たらtimer解除
- unmount時observer/timer cleanup

### 9.3 KPI

primary:

```text
card CTR = home_featured_click / home_featured_impression
```

breakdown:

- experiment_variant
- card_variant
- ranking_key
- slot
- device category

secondary:

- 遷移先rankingのengaged session
- rankingから次ページへのCTA
- pages/session

guardrail:

- home LCP
- CLS
- JS bundle増分
- browser console error
- 404遷移

GA4管理画面で`card_variant / slot / experiment_id / experiment_variant`をevent-scoped custom dimensionとして登録する作業は人間タスクであり、Claude Codeは実行できない。

### 9.4 勝敗判定

- 最低14日
- 各experiment variantでcard impression 500以上を目安
- editorialの全体CTRがcontrol比+15%以上を仮説上の勝ち基準
- guardrail悪化なし
- ranking_key/slot別に極端な悪化がない

標本不足または流入構成が大きく変わった場合は`inconclusive`とし、勝ち扱いしない。

## 10. Experiment V2: 掲載テーマ

V1で表示variantを確定した後、同じvisualを使い掲載テーマだけを比較する。

候補はR2 `values.json` HTTP 200を2026-07-17に確認済み。

| rankingKey                                | hook候補                       | 推奨variant |
| ----------------------------------------- | ------------------------------ | ----------- |
| `vacant-housing-rate`                     | 空き家率が高い県、徳島の次は？ | top-three   |
| `future-population-change-rate-2050`      | 2050年、人口が増える県は？     | question    |
| `natto-consumption-expenditure`           | 納豆消費の東西境界は？         | territory   |
| `fresh-udon-soba-consumption-quantity`    | うどん消費は香川だけが突出？   | territory   |
| `mayonnaise-consumption-expenditure`      | マヨネーズ消費が多い県は？     | question    |
| `consumer-price-difference-index-overall` | 生活費が高い県と低い県         | comparison  |
| `local-debt-current`                      | 地方債残高が大きい県は？       | comparison  |
| `annual-clear-days`                       | 快晴日数1位は沖縄？            | question    |

hookの事実関係はV2適用前に最新snapshotで再検証する。GSC需要があるだけで自動的にhomeへ採用しない。

## 11. 実装フェーズ

### Phase 1: tracking baseline

- events関数とunit test
- impression/click tracker
- 現行controlへ計測追加
- localhostでevent payload確認

### Phase 2: git TS config + snapshot

- `home-featured-rankings.ts`
- validation test
- exporterをconfig駆動へ変更
- top/bottom/top3/mapを1回のvalues readから生成
- 旧snapshot fallback test

### Phase 3: editorial cards

- 4 variantのpresentational component
- `SurfaceLinkCard`利用
- responsive/light/dark/accessibility
- controlを維持

### Phase 4: experiment

- sticky assignment
- fixed-height placeholder
- control/editorial切替
- experiment parameter付き計測
- localhostで両variant確認

### Phase 5: documentation

- `apps/web/src/features/ranking/README.md`または既存READMEへSSOT/計測/variantを追記
- `docs/todo/02_機能バックログ.md`更新
- 実装後に本仕様をstatus completedへ更新

本番deployとR2 snapshot反映はユーザー承認後の別操作とする。

## 12. 変更対象

必須候補:

- `packages/data-configs/src/home-featured-rankings.ts`（新規）
- `packages/data-configs/src/index.ts`
- `packages/data-configs/src/types.ts`または新規設定ファイル内の型
- `packages/ranking/src/types/ranking-item.ts`
- `packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts`
- exporter/configのunit test
- `apps/web/src/features/ranking/components/FeaturedRankings/index.tsx`
- `apps/web/src/features/ranking/components/FeaturedRankingCard/index.tsx`
- ranking feature内のexperiment/tracker/visual components
- `apps/web/src/lib/analytics/events.ts`
- `apps/web/src/lib/analytics/__tests__/events.test.ts`
- `apps/web/src/features/ranking/README.md`または近接README
- `docs/todo/02_機能バックログ.md`

変更しない:

- ranking詳細ページ
- blog/OGP/SNS画像pipeline
- `apps/remotion`
- D1/database schema
- category/surveyの情報設計
- R2 credential/env
- 無関係なmetric config

## 13. テスト

### 13.1 data/config

- key/order重複を拒否
- registry非実在keyを拒否
- inactive/city-onlyを拒否
- hook長/改行を拒否
- 8件をorder順で返す

### 13.2 exporter

- values 1回からtop/bottom/top3を生成
- nullを除外
- tiesの実rankを保持
- 3件未満でtopThree不足を表現
- map生成失敗でも他派生値を保持
- 旧snapshot互換
- snapshot JSONへ画像URL/secretを含めない

### 13.3 resolver/UI

- required payloadがあれば指定variant
- payload不足ならcontrol fallback
- question/comparison/territory/top-threeの内容
- hook最大2行
- card hrefが`/ranking/<key>`
- keyboard focus
- colorだけに依存しないlabel

### 13.4 analytics

- gtag未定義でnoop
- click payload
- impression 50%/1秒で1回
- viewport離脱でtimer取消
- unmount cleanup
- experiment parameter
- sticky assignment再利用
- localStorage例外耐性

### 13.5 verification commands

```bash
npm run test:run --workspace packages/ranking -- <対象test>
npm run test:run --workspace apps/web -- <対象test>
npm run type-check --workspace packages/ranking
npm run type-check --workspace apps/web
npm run design-system:check --workspace apps/web
```

localhost:

```bash
npm run dev:web
```

確認:

- `/` 200
- control/editorial双方
- 390px / desktop
- light/dark
- browser console error 0
- networkに新規PNG/WebP fetch 0
- card click先200
- CLSの目視悪化なし
- GA4 payload（network送信はmock可）

R2書き込みを伴う`export-master-snapshots.ts`は実装検証中に実行しない。pure helper/unit fixtureで検証し、本番snapshot反映は承認後に1回だけ行う。

## 14. 受入条件

- 画像生成AIを呼ばない
- 新規ラスター画像を作らない
- 新規画像R2 keyを作らない
- 4種類のeditorial cardが実装される
- controlが残り、sticky 50/50実験が動く
- ホーム専用設定がgit TSの単一ソースになる
- 旧snapshotでホームが壊れない
- 新snapshotでは追加values fetch 0
- card単位のimpression/clickが計測される
- mobile/desktop/light/darkの主要表示を確認する
- unit/type-check/design-system checkが通る
- 本番deploy、R2 write、commit、pushを行わない

## 15. Rollback

- experiment設定をcontrol 100%へ戻す
- `HOME_FEATURED_RANKINGS`を現行8件のまま維持
- editorial componentを残してもcontrolだけ描画可能
- R2旧snapshotでもoptional fieldにより読める
- DB migrationや画像削除はない

rollbackでranking URL、metric config、R2 valuesを変更しない。

## 16. Claude Codeへの実装原則

- 最初に現行exporter・snapshot型・card・analytics eventを読む
- Phase 1〜4を順番に実装し、各Phaseで対象testを通す
- 外部画像生成やRemotionを起動しない
- UIは既存`SurfaceLinkCard`とsemantic tokenを使う
- 問いcopyと正式titleを混在させない
- 値・順位・年度を手入力しない
- snapshot派生値はpure helperで検証する
- 既存dirty worktreeを尊重する
- R2 write、commit、push、PR、deployは行わない
- フルbuildを省略した場合は最終報告へ明記する
