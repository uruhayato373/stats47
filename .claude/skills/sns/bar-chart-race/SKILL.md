---
name: bar-chart-race
description: Bar Chart Race (BCR) 動画を「データ生成 → レンダリング → キャプション」の一連で作る統合スキル。Use when user says "バーチャートレース", "bar chart race", "BCR作成", "BCR動画". YouTube 月1本の主フォーマット。--step で工程を指定。
disable-model-invocation: true
argument-hint: "<rankingKey> [--step generate|render|captions|all] [--platform youtube|x] [--dry-run]"
primary_agent: youtube-strategist
co_agents: [sns-renderer]
---

# /bar-chart-race — BCR 動画の生成→レンダ→キャプション統合

Bar Chart Race (全年度推移の順位変動アニメ動画) を 1 本の線で作る。旧 `generate-bar-chart-race` /
`render-bar-chart-race` / `post-bar-chart-race-captions` の 3 スキルを統合した (詳細手順は `reference/` に温存)。

> **位置づけ**: BCR は **YouTube の主フォーマット** (`.claude/rules/sns-content-standards.md` §0。既定=月1本、
> 量産実験モード中は §1 例外注記で上限緩和)。レンダは 1 本 4-20 分かかるため瞬発力トラック (react-to-news) からは外す。
> X への短尺流用も可。投稿は本スキルではなく `/post-youtube` (ガード 3 点通過。CI 経路あり) が担う。
> **Remotion BCR レンダの正典入口は本スキル** (静止画/動画一般は `/render-sns-stills`、プレビューは `/preview-remotion`)。
>
> **★データ前提**: BCR は全年時系列が必要 → `app/stats/<metric>/values.json` (全年 rows) を読む。
> `app/ranking/<key>/values.json` は**単年 snapshot なので BCR には使えない** (2026-07-11 実測: aging-index 等は
> 1 年分のみで不可、births=29年 / japanese-population=45年 は可)。metric 選定時に年数を先に確認すること。

## 工程 (--step)

| step | 内容 | 詳細 | 出力 |
|---|---|---|---|
| `generate` | R2 観測値から config.json / data.json 生成 | `reference/generate.md` | `.local/r2/sns/bar-chart-race/<key>/{config,data}.json` |
| `render` | Remotion で動画レンダリング (Chrome 必須) | `reference/render.md` | `apps/remotion` out → `.local/r2/sns/bar-chart-race/<key>/` |
| `captions` | 全 SNS キャプション生成 (posts.json draft) | `reference/captions.md` | posts.json draft |
| `all` (既定) | generate → render → captions を順に実行 | — | 上記すべて |

## 実行例

```bash
# フル (generate → render → captions)
/bar-chart-race total-population

# データ生成だけ
/bar-chart-race total-population --step generate

# レンダだけ (dry-run で対象確認)
cd apps/remotion && npx tsx scripts/pipeline/render-bar-chart-race.ts --dry-run --key total-population
npx tsx scripts/pipeline/render-bar-chart-race.ts --key total-population --platform youtube
```

## 手順

1. **generate**: `reference/generate.md` の手順で R2 `app/stats/<key>/values.json` から全年度データを読み、
   `config.json` (hookText 15 字以内・eventLabels) と `data.json` (フレーム) を生成。
   観測値が無ければ先に `/page-data-batch --metric <key>`。
2. **render**: `apps/remotion/scripts/pipeline/render-bar-chart-race.ts` で動画化。`--dry-run` で対象確認 → 本番。
   `--platform youtube` (縦長長尺) / `--platform x` (横長)。詳細 `reference/render.md`。
3. **captions**: `reference/captions.md` の型で全 SNS キャプションを生成し posts.json に draft 登録
   (UTM は `.claude/rules/sns-content-standards.md` §4)。
4. **投稿は本スキルでは行わない**。YouTube は `/post-youtube` (月 1・`check-youtube-post-budget.cjs` +
   `check-youtube-duplicate.cjs` + 翌日 `diagnose-shadowban.js` を必ず通す)。

## 参照

- 詳細手順: `.claude/skills/sns/bar-chart-race/reference/{generate,render,captions}.md`
- レンダスクリプト: `apps/remotion/scripts/pipeline/render-bar-chart-race.ts`
- チャネル規約・頻度リミット・YouTube ガード: `.claude/rules/sns-content-standards.md`
- 投稿 (月1): `/post-youtube`
