---
type: session-handoff
date: 2026-06-24
status: active
wave_id: 2026-06-24-lineage-restore
topic: ブログ must-fix 群の SVG データ系譜 (3点セット) 復元
tags: [blog, chart-lineage, remediation, quality-gate]
---

# ハンドオフ: ブログ SVG データ系譜の SSOT 復元 (must-fix 群)

## 1. このセッションで何をしたか

must-fix ブログ記事の「prose 薄い」課題の実体は **チャートのデータ系譜 (data lineage) 喪失** だと判明し、その復元を進めた。

- **棚卸し (cohort census)**: must-fix 全 38 件を triage し `.claude/state/blog/cohort-census.json` に永続化。
  バケット分類: **A1:restore-direct 28 / A2:drift-verify 2 / B:redesign(high-traffic) 1 / C:trim/deprecate(low) 7**。
  結論: データ負債は**全体に蔓延しているのではなく集中している** — 28/38 はクリーンに復元可能、問題児は ~10 件、うち高トラフィックは farmland 1 件のみ。
- **A1 機械復元レシピを確立・実証** (記事 6 本完了、すべて blog-critic PASS / R2 200 検証済):
  library-books-prefecture-gap, public-phone-prefecture-vanishing, outpatient-rate-prefecture-gap,
  whisky-consumption-prefecture-gap, future-burden-ratio-extreme-gap, inpatient-rate-prefecture-gap
  (outpatient/inpatient は既に系譜あり)。
- **generate-article-charts.ts に `chartType` JSON フォールバックを追加** (commit ca94c164):
  復元記事が article.md 埋め込みの非 canonical basename (`data/library-per-capita.svg` 等) を変えられない場合、
  filename suffix で型確定できない**ときだけ** JSON 先頭の `chartType` でディスパッチ。canonical 名では無視。
- `blog-data-schema.md` の stale 記述を是正 (3点セット欠落は 2026-06-20 に warning→**blocker** 昇格済を明記)。

**進捗: must-fix 残 40→32 (done 8)。** git クリーン・全コミット develop に push 済。

## 2. 確立した A1 機械復元レシピ (再開時はこれをそのまま使う)

A1 記事は本文が既に ですます調で、**チャートのデータ系譜を SSOT から再生成するだけ**（prose リライト不要）:

```
1. node .claude/scripts/blog/fetch-ranking-data-r2.mjs \
     --slug <slug> --base .local/r2/app/blog \
     --keys <実在 app/ranking key> --data-name <既存SVGのbasename>
   # → data/<name>.json + data/<name>.source.json を SSOT (R2 app/ranking/<key>/values.json) から生成

2. NODE_OPTIONS='--conditions react-server' npx tsx \
     .claude/scripts/blog/generate-article-charts.ts --slug <slug> --base .local/r2/app/blog
   # → SVG + -ig.svg を data JSON から決定的生成 + source.json をセット出力

3. blog-critic agent で review.md 生成 (.local の article.md 隣に置く → docs/21 にコピーして git commit)

4. NODE_OPTIONS='--conditions react-server' npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts \
     --prefix app/blog/<slug>/data --apply
   # data のみ push (中間状態や review.md を巻き込まない)。S3 creds は環境に設定済

5. R2 200 検証 → build-remediation-queue.mjs --mark-done <slug> --wave 2026-06-24-lineage-restore

6. 記録 (queue / cohort-census / review.md) を develop に commit + push
```

## 3. 重要な制約 (違反しないこと)

- **SVG の絵から値を逆復元しない** (§1.6)。必ず SSOT (`app/ranking/<key>/values.json`) から取得。捏造・推測も禁止。
- SSOT に存在しないデータに依存する図は **復元せず、図を外すか記事を再設計** (quality-gate 3点セット blocker を回避するため)。
- R2 書き込みは S3 creds 経由 (環境に設定済)。読み取りは公開 URL `https://storage.stats47.jp`。
- ブランチは **develop** に commit。指定外ブランチへ push しない。

## 4. 次回の再開手順 (優先順・「続けて」で着手)

真実源: `.claude/state/blog/remediation-queue.json` (残32) / `.claude/state/blog/cohort-census.json` (バケット)。

### (a) 先送りした batch-2 の 2 件 (A1 内の変則ケース)
- **telework-gap-tokyo-6x** (27imp/2clk): ランキングチャート無し → findings-card の 3点セット化 +
  本文に である調 1 箇所残存 (要 ですます化) + critic。
- **low-birthweight-rate-prefecture-gap** (49imp/1clk): ランキングチャートは復元済。
  時系列チャートを SSOT partition (`low-birthweight-rate-per-1000-births`) から **沖縄 vs 全国47県平均** の派生系列として構築。
  記事の数値と照合: 沖縄 91.8→121‰、平均 76.1→96.2‰。

### (b) A1 バッチ3 (残り ~24、機械レシピで流す)
低トラフィックの食品/消費系が大半 (frozen-gyoza, tofu, yogurt, pachinko, pharmacist-income 等)。
**cc-estat-* / koumuin-* (計11) はチュートリアル記事でサンプルデータ型 → 別トラック** (実データ系譜ではないので
A1 機械レシピは適用しない。図を持たない/サンプル図なら 3点セット要件の扱いを個別判断)。
実データ系の A1: minimum-wage-increase-rate, train-commuters, musical-instrument-expenditure,
inflow-population-ratio, frozen-gyoza, pachinko-participation, pharmacist-income, tofu-consumption,
yogurt-spending, ai-claude-code-pref-analysis。

### (c) B群: farmland-crisis-abandoned-land (361imp/42clk — 唯一の高トラフィック、個別再設計)
4 つの mappable チャートは SSOT 復元、1 つの composite は再設計 or 削除。ROI 最大なので丁寧に。

### (d) A2/C群: 個別 trim-or-deprecate
- **library-museum-cultural-capital** (55imp/2clk, A2): 6図中 3図が復元不能の可能性大
  (library-lending tilemap, library-vs-hobby scatter, cultural-facility stacked = 複数指標 composite)。
  復元できる図は SSOT 復元、不能な composite は削除。本文の対応段落も整理。
  key ドリフト判明分: library-count→library-count-per-million, museum-count→total-museum-count,
  theater-hall-count→theater-music-hall, library-books-lent→(人口あたり貸出 key 無し)。
- **overseas-travel-gap** (12imp/1clk, C): gender 棒・income-scatter は SSOT 無し (chart-author が逆復元した過去あり→却下済)。
  ranking と map は実在 key (overseas-travel-annual-participation-rate-15plus) で復元可。
  composite/scatter は削除候補。床割れなら published:false。
- C群その他: food-spending-pattern, natto, inbound-overnight, commercial-land-price,
  konbu, waste-management → mappable は復元 / 復元不能 composite は削除 / 床割れ published:false。

## 5. 既知の落とし穴 (このセッションで踏んだ)
- R2 GET が稀に Cloudflare 524 timeout (future-burden-ratio で発生) → チェーンせず小分け実行。
  同一47値を使う tile-grid は ranking json を `cp` + source.json を sed して再 fetch を避ける。
- diff-push は **`--prefix app/blog/<slug>/data` でスコープ**する (review.md は slug 直下にあり data/ ではない。
  別記事の壊れた中間状態を巻き込まない)。
- cohort-census の drift-resolver は名詞一致で緩い → drift-only は direct-match と分けて要検証 (library-museum を A2 に移した理由)。

## 6. 残タスク (ユーザー手動)
- feature ブランチ `claude/charming-pasteur-po6krd` の削除 (この環境からは不可)。
