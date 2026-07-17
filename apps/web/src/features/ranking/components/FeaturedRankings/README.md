# FeaturedRankings — ホーム「注目のランキング」(home-featured-v1 実験)

仕様の正典: `docs/02_実装計画/28_ホーム注目ランキングCTR改善仕様.md`

## SSOT

| データ | SSOT |
|---|---|
| 掲載指標・順番・hook・card variant | `packages/data-configs/src/home-featured-rankings.ts` (`HOME_FEATURED_RANKINGS`) |
| 派生値 (top/bottom/top3/map/homeFeatured) | R2 `app/home/featured.json` (exporter が焼き込み) |
| 派生ロジック | `packages/ranking/src/exporters/home-featured.ts` (pure・fixture test 済) |

metric config の `isFeatured`/`featuredOrder` はホームでは**使わない** (category/survey 用に残置)。
hook はホーム専用 copy で、ranking の title/seoTitle を上書きしない。

## 構成 (仕様 §7)

```
FeaturedRankings (Server)            … R2 featured snapshot 読込 + payload 解決のみ
  └─ FeaturedRankingExperimentGrid (Client) … sticky 割当 + 固定高 placeholder
       └─ TrackedFeaturedRankingCard (Client) … impression (50%×1秒×1回) + click 計測
            ├─ EditorialFeaturedCard … question / comparison / territory / top-three
            └─ FeaturedRankingCard   … control (現行 map / number・fitHeight で等高化)
```

## 実験 (仕様 §8)

- experiment_id: `home-featured-v1` / localStorage key: `stats47_exp_home_featured_v1`
- 初回 50/50 → 同一 browser に sticky。localStorage 不可時は session 内固定
  (`utils/home-featured-experiment.ts`)
- SSR/mount 前は card と同一の固定高さ placeholder (CLS 回避・§8.3)

## fallback (仕様 §5.4)

- `homeFeatured` 欠損 (旧 snapshot) → control
- question=featuredTop / territory=+tileMapSvg / comparison=+featuredBottom / top-three=3 件、
  不足時はその card だけ control 表示 (判定: `utils/resolve-home-featured-card.ts`)
- 新 snapshot ではホーム表示時の values.json 追加 fetch 0
  (`needsHomeFeaturedValuesFetch` が unit test で保証)。development のみ旧 snapshot を
  in-memory 補完して editorial を QA できる

## GA4 event (仕様 §9)

- `home_featured_impression` / `home_featured_click`
- params: `ranking_key / card_variant / slot / experiment_id / experiment_variant / link_position=home_featured`
- `card_variant` は実際に描画された variant (fallback 後)
- custom dimension (`card_variant/slot/experiment_id/experiment_variant`) の GA4 管理画面登録は人間タスク
