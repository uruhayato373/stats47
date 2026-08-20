---
name: react-to-news
description: じじネタ・時事ニュースに即SNS反応する瞬発力パイプライン。トピック(自由文)→該当指標の発見→投稿用静止画(SVG/PNG 横+IG縦)+キャプション草稿の生成までを数分で通す。Use when user says "このニュースでSNS", "時事ネタ対応", "速報でSNS出したい", "react to news", "じじネタ投稿".
primary_agent: x-strategist
---

# react-to-news — じじネタ→即SNS の瞬発力パイプライン

ニュース/時事ネタを見た瞬間に「刺さる統計指標を見つけ → 投稿用ビジュアル+キャプションを数分で作る」ための最短経路。
**発見(find-metrics) と 生成(quick-still) の2つのローカルCLIを繋ぐ薄いオーケストレーション。** 投稿本体は既存の
安全ゲート付き skill (`publish-x` / `post-instagram`) に受け渡す（本 skill は投稿しない）。

> 設計判断: 瞬発力のボトルネックは DB クエリ速度ではなく「①ネタ→指標の発見」「②指標→ビジュアル生成」だった
> (完全DBレスのまま解決)。動画 (bar-chart-race) は 1 本 10-20 分レンダリングなので**瞬発力トラックから外す**。
> 静止画 (X / Instagram / note) が本命。関連: `.Codex/rules/data-sqlite-ssot.md`(DBレス正典)。

## 前提 (初回/データ更新時のみ)

指標発見索引はローカルの再生成可能キャッシュ (DBレス互換)。指標を追加/改名したら再生成する:

```bash
npx tsx .Codex/scripts/sns/build-discovery-index.ts   # → .Codex/state/sns/metric-discovery-index.json (2211件)
```

## フロー

### Step 1. ネタ→指標を発見する

ニュースのキーワード(自由文・複数語可)を渡す。**ニュース語彙と指標語彙のギャップ**は同義語辞書
(`.Codex/scripts/sns/` の `news-synonyms.json`, 76見出し) が吸収する (例: 「移住」→転入/転出、「少子化」→出生率/出生数、
「賃上げ」→賃金/給与/所得、「値上げ」→消費者物価)。

```bash
node .Codex/scripts/sns/find-metrics.mjs "少子化" --top 5
# 複数語は AND ボーナス:  node .Codex/scripts/sns/find-metrics.mjs "年収 医師" --top 5
# 機械可読:              node .Codex/scripts/sns/find-metrics.mjs "移住" --top 5 --json
```

- 出力の `key` 列が指標キー(= ranking key)。`headline` は seoTitle 由来の「1位◯◯県(値)」でニュース性判断に使う。
- 0件なら: 語を言い換える / カテゴリ名で引く / 辞書 (`news-synonyms.json`) に見出し語を追記する。
- 上位候補を**ユーザーに提示して 1 つ選んでもらう** (見出し数値を見て「どれが一番刺さるか」は人が判断)。

### Step 2. 指標→投稿ビジュアル+キャプションを生成する

選んだキーで、記事(article.md)非依存の単発生成。R2 観測値を公開URLから取得(認証不要)。

```bash
npx tsx .Codex/scripts/sns/quick-still.ts --key births
# 出力: .local/r2/sns/ranking/<key>/x/  (publish-x が読む §2-9 正典パス)
#   stills/<key>.svg / stills/<key>.png       … 横長 960x404 (X / ブログ / note)
#   stills/<key>-ig.svg / stills/<key>-ig.png … 縦長 1080x1350 (Instagram フィード/リール)
#   caption.txt                                … 上位5/下位5の実数値 + 倍率 + 出典 + ハッシュタグ雛形
#   source.json                                … provenance (rankingKey / year)
```

### Step 3. (任意) 相関で横展開ネタを足す

相関は既に計算済みで R2 にある。関連指標を1 fetchで引ける (じじネタの深掘り: 「少子化」×所得/住宅 等)。

```bash
curl -s https://storage.stats47.jp/app/correlation/by-ranking-key/<key>.json | head
```

### Step 4. キャプションにニュース文脈を1文足す

`caption.txt` は統計事実のみ。**ニュースとの接続文 (「〜という報道があったが、実際のデータでは…」) を人が1文足す**と
瞬発力ネタとして成立する。ここは AI 生成 + 人の最終確認。

### Step 5. 投稿は既存の安全ゲート skill へ受け渡す (本 skill は投稿しない)

`quick-still` の出力をそのまま `publish-x` の**直接指定モード (`--media`/`--caption`)** に渡せる (新規の橋渡しコード不要)。
**必ず `--dry-run` を先に実行**して予約モード到達を screenshot 確認してから本番 (誤即時投稿事故 2026-04-18 由来の安全ゲート、維持する):

```bash
# X: quick-still の横長PNG + caption をそのまま渡す。まず --dry-run
npx tsx .Codex/skills/sns/publish-x/publish-x.ts <key> <YYYY-MM-DDTHH:MM> \
  --media  .local/r2/sns/ranking/<key>/x/stills/<key>.png \
  --caption .local/r2/sns/ranking/<key>/x/caption.txt \
  --dry-run
# dry-run で予約モード確認できたら --dry-run を外して本番予約
```

- `<key>` が実在 ranking key なら DB (`sns_posts`) 連携は自動 (`--skip-db` 不要)。
- **Instagram**: `/post-instagram` — Graph API は公開URL要求のため、`quick-still` の `<key>-ig.png` を**先に `/push-r2` で本番R2へ push** してから投稿。
- 投稿後は `/mark-sns-posted` で記録。

> 設計判断: `quick-still` 出力を `publish-x` が自動解決する `.local/r2/sns/ranking/<key>/x/` レイアウトに二重出力する案もあったが、
> publish-x の既存 `--media`/`--caption` 受け口で足りるため**新規コード・出力の二重化はしない** (外科的変更)。

## やらないこと (意図的)

- **投稿の全自動化はしない** — Step 5 の安全ゲート(dry-run / push-r2)は事故防止のため人手確認を残す。
- **動画生成は含めない** — bar-chart-race は 10-20 分/本で瞬発力に合わない。動画は別途 `/bar-chart-race`。
- **指標データを DB に持たない** — 発見索引は git TS から、観測値は R2 から。永続 DB は使わない (完全DBレス)。

## 関連

- 発見索引: `.Codex/scripts/sns/{build-discovery-index.ts,find-metrics.mjs,news-synonyms.json}`
- 生成: `.Codex/scripts/sns/quick-still.ts` (svg-builder `generateBarChartSvg` 再利用 / sharp で PNG 化)
- 投稿: `/publish-x` `/post-instagram` `/push-r2` `/mark-sns-posted`
- 週次でまとめて回す運用: `/sns-weekly-plan` (企画→生成→予約→計測)
- 図の規約: `.Codex/rules/blog-svg-chart-standards.md` (横960 / 縦1080)
