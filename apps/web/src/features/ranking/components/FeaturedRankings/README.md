# FeaturedRankings — 「注目のランキング」

現行UI仕様の正典: `docs/01_技術設計/04_デザインシステム.md`「Surface」。
本書は home / ranking index の FeaturedRankings と、category / survey を含む
FeaturedRankingCard の実装・データ・計測契約の正典とする。

> **home-featured-v1 実験は終了 (2026-07-23)**: 50/50 A/B (control=map/number vs editorial=
> question/comparison/territory/top-three) は判定前だったが、ポータル型 home 再設計で
> home 構造が変わり exposure/CTR
> 条件が変化するため、**オーナー判断で終了し editorial を採用**した (標本不足で `inconclusive`)。
> sticky assignment 機構 (`resolveHomeFeaturedAssignment` / localStorage `stats47_exp_home_featured_v1`
> / 乱数 50/50) は撤去した。2026-07-26に残存していた4表示variantも廃止し、
> 地理地図＋1位情報の共通カード1形式へ統一した。
> impression/click 計測は
> `experiment_variant="editorial"` 固定で継続する。

## SSOT

| データ | SSOT |
|---|---|
| 掲載指標・順番・hook | `packages/data-configs/src/prominence/ranking-prominence.generated.ts` (`HOME_FEATURED_PROMINENCE`) |
| 派生値 (top/map/homeFeatured) | R2 `app/home/featured.json` (exporter が焼き込み) |
| 派生ロジック | `packages/ranking/src/exporters/home-featured.ts` (pure・fixture test 済) |
| card model 解決 | `utils/resolve-featured-ranking-card.ts` |
| category / survey の values→model 変換 | `lib/build-featured-ranking-card-model.ts` |
| home / category / survey の描画・比率 | `components/FeaturedRankingCard/index.tsx` |

metric config の `isFeatured`/`featuredOrder` はホームでは**使わない** (category/survey 用に残置)。
hook はホーム専用 copy で、ranking の title/seoTitle を上書きしない。

## 構成

```
home
  └─ FeaturedRankings (Server) … R2 featured snapshot 読込 + model 解決
       └─ FeaturedRankingGrid
            └─ TrackedFeaturedRankingCard … impression + click 計測
                 └─ FeaturedRankingCard
/ranking
  └─ FeaturedRankings (Server) … home と同じ snapshot / model / card、home 専用計測は無効
category / survey
  └─ buildFeaturedRankingCardModel … values→同じ model
       └─ FeaturedRankingCard
```

`FeaturedRankingCard`が`PORTAL_CARD_ASPECT_CLASS`、文字階層、1位情報、地理地図配置を所有する。
呼び出し側のpropsは`rankingKey / year / unit / model`だけで、表示variantを選べない。
`FeaturedRankings`を home 以外で使う場合は`trackHomeEvents={false}`を指定し、
home 専用イベントへ別画面の表示・クリックを混入させない。

## 終了済み実験の計測互換

- experiment_id は `home-featured-v1`、experiment_variant は採用値 `editorial` 固定
- sticky assignment / placeholder は撤去済み。SSR HTML に共通カードを直接描画する

## データ不足時

- 旧タイル地図・1位欠損snapshotだけvalues.jsonを1回読み、地理地図modelへin-memory移行する
- 地理地図または1位を生成できなければ別デザインへfallbackせず、そのカードを表示しない
- 未登録ランキングは正式titleをhookに使う

## GA4 event

- `home_featured_impression` / `home_featured_click`
- params: `ranking_key / card_variant / slot / experiment_id / experiment_variant / link_position=home_featured`
- `card_variant` は計測互換のため`geographic`固定
- custom dimension (`card_variant/slot/experiment_id/experiment_variant`) の登録状況は
  `.claude/rules/analytics-event-standards.md`を正典とする
