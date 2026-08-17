# ブログ品質基準 (curiosity gap パターン)

stats47.jp の `/blog/{slug}` 記事を新規作成または brushup する際の必須基準。BLOG-CTR-03/04 (2026-05-23) の実測ベースで確立。

> **本ファイルが記事品質ルールの正典 (単一ソース)**。curiosity gap タイトル / callout / 内部リンク / source-link 配置の基準はここに集約する。関連ファイルは役割分担:
> - `.claude/skills/blog/md-syntax/SKILL.md` — markdown **記法** (タグ形式・配置の機械的詳細)。品質ルール本体は本ファイルを参照
> - `.claude/skills/blog/blog-review/SKILL.md` — review 時の**チェック項目**。基準は本ファイルを参照
> - 決定的検査: `node .claude/scripts/blog/quality-gate.mjs <slug>` (単一記事) / `audit-article-structure.mjs` / `audit-chart-quality.mjs` (全記事バッチ)
>
> ルールを変更する場合は**まず本ファイルを更新**し、他は参照のみに保つこと (drift 防止)。

## 品質の3層モデルと critic 必須 (★最重要・2026-06-02)

ブログ品質は**1つの指標やスクリプトで測れない**。忠実度とコストの異なる3層で担保する。**文字数や決定的 gate を「品質」と取り違えない**こと(取り違えた結果、図と重複する truncated 表で字数を稼ぐ事故が起きた)。

| 層 | 担い手 | 役割 | 捕まえる / 捕まえない |
|---|---|---|---|
| ① 機械的フロア | `quality-gate.mjs` | 公開前の床 (決定的) | 捕: callout数/内部リンク/NG word/factual rank/**markdown 表の存在 (全面禁止)**/source-link 配置/prose 文字数の床/**図あたり prose 字数の床 (「図はあるが薄い」を弾く)**。**不可: 読者価値の有無** |
| ② 意味レビュー | **`blog-critic` agent (別コンテキスト)** | 読者価値の判断 | 捕: 冗長・図表重複・論理の質・curiosity gap の真正性・CTA過多・「この要素は何を足すか」 |
| ③ アウトカム | gsc-analyst / 改善ログ | 最終評価 | GSC CTR/順位・GA4 滞在・CV (遅行・最も真実) |

**鉄則**:
- **文字数 (prose) は「薄すぎ」を弾く床であって品質ではない。**表・markup・リンクでは稼げない (gate が prose のみ計測)。字数を満たしたいなら読者価値のある分析を書く。
- **書いた本人が自分の記事を採点して公開してはならない。**必ず `blog-critic`(別 agent・別コンテキスト) の意味レビューを通す。執筆 (article-writer) と監査 (blog-critic) は分離する。
- 機械 gate を pass しても「品質 OK」ではない。②③ を経て初めて品質が担保される。
- **critic は full / delta の二相で起動する (トークン節約)**: 初回審査は `full` (正典全観点 + 記事全文)、REVISE 後の再審査は `delta` (前回指摘 + 変更 hunk のみ、正典 465行と記事全文を再読しない。床は `quality-gate.mjs` が毎回フル実行するため落ちない)。GSC 流入上位 30 記事の初回 critic は opus、他は sonnet に傾斜する (`build-remediation-queue.mjs` の `reviewTier`。モデル規律は `.claude/rules/model-prompting.md`)。

> **既存記事を計画的に順次是正するには (★どのセッションからでも開始可)**: 「次にどの記事を直すか」は
> 状態付き是正キュー `.claude/state/blog/remediation-queue.json` が真実源 (GSC流入×品質blockerの統合スコア)。
> ```bash
> node .claude/scripts/blog/build-remediation-queue.mjs   # コミット済み履歴+公開R2+GSCから再構築 (どこでも可)
> ```
> で最新化し `/brushup-blog --target queue --next 3` で週次バッチ是正する。仕組みの正典:
> **`.claude/rules/blog-remediation-loop.md`**。新規記事を書くときの型は本ファイルの「記事アーキタイプ」節。

### critic レビュー成果物 `review.md` (公開の必須条件)

`published: true` の記事は `docs/21_ブログ記事原稿/<slug>/review.md` (blog-critic が生成) が無いと **`quality-gate.mjs` が blocker で公開を止める**。format:

```markdown
---
slug: <slug>
reviewer: blog-critic
mode: expert | panel
verdict: PASS | REVISE
date: YYYY-MM-DD
---
## 評価サマリ
<読者価値の総括>
## 指摘
- [blocker|major|minor] <具体的指摘と修正案>
## 判定理由
<PASS/REVISE の根拠>
```

`verdict: PASS`(実体200字以上) で初めて公開可。REVISE の指摘は article-writer 側が修正してから PASS に更新する。これにより「自己採点での公開」を構造的に不可能にする。

## なぜこのルールがあるか

2026-05-23 のブログ品質診断で判明:

- 187 記事中チャート採用は 1% (2 件) → **チャートの有無は CTR の主要因ではない**
- トップパフォーマー (health-life-expectancy-structure, CTR 4.6%) もチャート 0
- 失敗記事 (W19 新規 6 本) は CTR 0% (合計 626 imp / 0 clicks)
- 真の品質ギャップは **タイトルの curiosity gap** にあった

## 必須パターン (タイトル)

### NG: 事実羅列型

```
×「砂糖消費量1位は三重5kg・最下位東京」(CTR 0%)
×「都道府県別 X ランキング｜A が1位、B が最下位」
×「X ランキング 2024｜...XX 倍格差」(数値だけ羅列)
```

### OK: curiosity gap 型

タイトルに以下のいずれかの要素を入れる:

1. **疑問形 / なぜ?**: 「**なぜ**東北が高い?」「**唯一**自立できる47都道府県は」
2. **矛盾 / 逆説**: 「寿命は延びたが**不健康期間も延びた**」「**意外**にも京都が1位」
3. **真因 / 構造**: 「物価格差の**真因**は家賃」「人口密度の**真因**が見える」
4. **比較対比**: 「東京 vs 北海道で44倍」「コロナで半減→**V字回復**で過去最多」
5. **倍率 + 意外性**: 「住居だけ1.6倍格差」「ホタテ99%独占」

### 推奨タイトル構造

```
{主要 fact + curiosity gap}｜{追加情報 (年・対象)}
```

例:
- ✅「中学生の身長は県で3.9cm違う｜秋田163.6cm・高知159.7cm、**なぜ東北が高い?** (2023)」
- ✅「人口密度は東京 vs 北海道で44倍｜**埼玉が昼夜人口比率最下位の意外**、47都道府県」
- ✅「財政力指数ランキング｜東京1.06 vs 島根0.25、**唯一「自立」できる**47都道府県は (2022年度)」

### 実測補正: 短タイトル + gap は 1 要素まで (★2026-07-05 winning-patterns 反映)

勝ちパターン分析 (`.claude/state/blog/winning-patterns.json`、117 記事 winner/loser 各 39、robust 判定) の実測で、curiosity gap は「必須」だが**過剰は逆効果**と確定した (winner の gap 語彙使用率 28.2% vs loser 48.7%)。BLOG-WAVE-2026-05-25-auto (53 記事 gap 改修) が effect/none だった一因でもある。

- **title は短く ~17 字目標** (winner 中央値 17 字 vs loser 33 字)。`{主要fact+gap}｜{補足}` の補足部 (年・対象数) は **seoTitle 側に寄せ**、title 本体を軽くする。
- **curiosity gap 要素はタイトルに 1 個まで**。疑問形 or 逆説 or 倍率のどれか 1 つで十分。「衝撃」「意外すぎる」等の煽り語の重ね掛けは禁止。
- 上の「OK: curiosity gap 型」の 5 要素は引き続き必須 (0 個 = 事実羅列型 NG)。**0 個も 2 個以上も負け**、が実測。

冒頭は **緊張感セットアップ** で開始。事実だけ羅列しない。

### NG

```
×「2024年最新版・47都道府県の X ランキング。1位は A (Y)、最下位 B (Z)で N 倍差。」
```

### OK

```
✅「『同じ日本でも住む県で物価が変わる』──2024年消費者物価地域差指数で...」
✅「『面積1位は北海道、人口密度1位は東京』──なぜこの2つが一致しないのか?」
✅「半減した宿泊市場、4年で過去最多に──だが回復は均一ではなく、東京 vs 徳島で54倍差。」
```

### 推奨 description 構造

```
{緊張感セットアップ (1 文)}──{具体的な対比・数値 (1-2 文)}{記事の貢献 (何を可視化するか)}
```

## 文体: ですます調に統一 (★2026-06-08 確定・決定的 gate)

**本文の地の文は「ですます調」に統一する。「である調」(である。/だ。/だった。/ではない。/だろう。/のだ。 等の plain copula 文末) を混在させない。** 読者に語りかける一貫したトーンが信頼感と読みやすさを生む (手本: `sports-urban-paradox` / `price-index-high-low-prefecture`)。

| である調 (NG) | ですます調 (OK) |
|---|---|
| 〜である。/ 〜だ。 | 〜です。 |
| 〜だった。/ 〜であった。 | 〜でした。 |
| 〜ではない。 | 〜ではありません。 |
| 〜だろう。/ 〜であろう。 | 〜でしょう。 |
| 〜のだ。/ 〜のである。 | 〜のです。 |
| 動詞終止形 (〜する。〜なる。〜連なる。) | ます形 (〜します。〜なります。〜連なります。) |

- **適用範囲**: 地の文 (本文段落・箇条書き)。**callout (`> [!NOTE]` 等) と引用・データ出典の体言止めは対象外** (注記は簡潔な体言止め・常体を許容)。
- **検査 (決定的)**: `quality-gate.mjs` が prose 中の である調 copula 文末を検出し **blocker** にする (callout/引用/見出し/表/タグは除外)。1 箇所でも残れば pre-commit / publish-blog.yml で公開がブロックされる。動詞終止形の常体は gate では捕まえないため **blog-critic が文体の一貫性も審査**する。
- **執筆 agent (article-writer) は最初から ですます調で書く**。brushup で既存の である調記事を是正する場合は全文を ですます に変換する (数値・構造・チャート・リンクは変えない)。
- **★copula だけの機械置換は禁止 (2026-06-13 実証)**: `である。/だ。/だった。/ではない。` 等の copula 文末だけを正規表現で一括置換すると、**動詞終止形・形容詞終止 (〜もたらす。/〜連なる。/〜多い。) が常体のまま残り、「です。」と混在して文体が崩壊する**。`quality-gate.mjs` は copula しか検出しないため **gate は通ってしまい崩壊に気づけない**。である調記事の是正は必ず **article-writer agent で文単位に ですます完全化**する (機械の正規表現スクリプトで一括処理してはならない)。残った混在は blog-critic が MAJOR で弾く。

## 数値の書き方 (★2026-07-31 確定・決定的 gate)

数値は記事の信頼性そのものなので、**機械が照合できる形で書く**。以下は書き方の制約であり、
守れば `quality-gate.mjs` の factual-check が本文の数値を data/*.json と自動突合できる。
守らないと検証不能な数値が本文に残り、捏造を機械では止められない。

### 都道府県名の直後の括弧に値・順位を書かない (blocker)

```
❌ 愛知県（746.0万人）が4位となっている
❌ 石川県（2.5人、31位）は全国平均を下回ります
✅ 愛知県は746.0万人で4位となっています
✅ 石川県は2.5人で31位、全国平均を下回ります
```

- **なぜ**: 括弧内の数値は文脈が閉じており、記事の主指標なのか別指標・派生値なのかが機械には判別できない。
  実測でも括弧内はほぼ別指標か派生値だったため、factual-check は**括弧内を照合対象から外している**。
  つまり括弧に入れた瞬間その数値は誰にも検証されなくなる。散文に開けば照合対象に入る。
- **例外 (gate も許容)**: 年次 `(2020年度)` `(令和5年)` / 出典・注記 `(出典: …)` `(※ …)` /
  単位・対象の限定 `(人口10万人当たり)` `(2人以上の世帯)` — これらは**値の挿入ではない**ので対象外。
- **検査**: `paren-number-lint.mjs` (`lintParenNumbers`)。判定は ai-content 側の
  `audit-ai-content.mjs` と同じ許容規則に揃える (blog と ranking で二重基準を作らない)。
- **既存負債**: 2026-07-31 実測で公開済み 424 記事の **79.5% (4,671 箇所)** が該当。既存記事は
  brushup で順次是正する (是正キューが blocker として拾う)。**新規記事は最初からこの形で書く**。

### 複合スケールの数値は表記を混ぜない

`4万5,897円` のようにスケールを跨いだ表記も、`45,897円` の表記も許容する
(factual-check の `parseJapaneseNumeral` が両方を同じ値として解釈する)。ただし
**同一記事内では表記を統一する** (読者が桁を読み違える)。gate では検出せず critic が見る。

## 推奨パターン (本文)

### コール アウトの活用

`[!NOTE]`, `[!TIP]`, `[!WARNING]` callout を 2-4 個配置:

```markdown
> [!NOTE]
> 本データの定義・調査方法の補足

> [!WARNING]
> 注意点 (調査年度の変遷、定義変更、サンプル偏りなど)

> [!TIP]
> 読み解くコツ・関連指標
```

### 構造テンプレート

```
1. 冒頭 (200-400 字)
   - 緊張感セットアップ
   - 記事の中核質問

2. データの概要 (1-2 H2)
   - 全体トレンド
   - [!NOTE] で定義補足

3. ランキング詳細 (2-3 H2)
   - TOP / 下位の対比
   - 各順位の文脈解説

4. 構造的解釈 (1-2 H2)
   - 「なぜ」の探究
   - [!WARNING] で限界・注意

5. 関連 / まとめ (1 H2)
   - 関連記事リンク 3-5 個
   - 「次に読むべきデータ」誘導
```

### 内部リンク密度

最低 3-5 個の内部リンクを含む:

- `/ranking/{key}` (本テーマのランキング詳細)
- `/areas/{prefCode}` (上位/下位県の area page)
- `/blog/{related-slug}` (関連記事)
- `/category/{key}` (カテゴリ一覧)

### source-link の配置 (★必須・カードは「1 図 1 枚」)

`<source-link href="/ranking/...">` は**その節の主題データへ深掘りするカード 1 枚**であって、
リンク集ではない。**対応する図を扱う H2 セクション内 (SVG 図の直下等) にインライン配置**し、
記事末尾にも節内にも**束ねない**。

理由: 束ねると (1) 読者がその図を見た瞬間の「もっと詳しく」という意図を取りこぼし回遊性を下げる、
(2) どのカードがどのデータに対応するか文脈が失われ、**読者には無関係なリンクの羅列に見える**
(2026-07-24 に `/blog/black-tea-income-gap` で実際に報告された。紅茶マップの直下に紅茶・緑茶・
コーヒーのカードが 3 連続していた)。

| 配置 | リンク種別 | 可否 |
|---|---|---|
| 対応セクション内 (図の直下) に 1 枚 | `/ranking/{key}` | ✅ 必須 |
| 同一 `/ranking/{key}` へのカードを記事内に 2 枚以上 | `/ranking/{key}` | ❌ 禁止 |
| カードを 2 枚以上連続で並べる (節の途中でも) | `/ranking/{key}` | ❌ 禁止 |
| 図が 1 枚も無い H2 セクションにカードを置く | `/ranking/{key}` | ❌ 禁止 |
| 記事末尾にまとめて 2 個以上 | `/ranking/{key}` | ❌ 禁止 (アンチパターン) |
| 束ねたい / 図の無い節から誘導したい場合のインラインテキストリンク | `あわせて見る: [ラベル](/ranking/key)` | ✅ 可 (1 行に集約) |
| 末尾の関連セクション | `/category/{key}` `/themes/{key}` (ナビ目的) | ✅ 可 |
| 末尾の `### 関連記事` | `/blog/{slug}` | ✅ 可 |

複数のランキングへ誘導したい節では、**カードは図に対応する 1 枚だけ**にし、残りは
`あわせて見る: [A ランキング](/ranking/a) / [B ランキング](/ranking/b)` の 1 行にまとめる
(テキストリンクも `quality-gate.mjs` の internalLinks に数えられるので回遊導線は失われない)。

**良い例**:
```markdown
## 製造品出荷額ランキング

![出荷額 上位5・下位5](data/manufacturing-ranking.svg)

愛知が58兆円で...（解説）

<source-link href="/ranking/manufacturing-shipment-amount">製造品出荷額ランキングをもっと見る</source-link>
```

**悪い例** (カードの羅列):
```markdown
## 地理でみる紅茶消費

![紅茶消費支出額 都道府県マップ](data/black-tea-expenditure-map.svg)

...（解説）

<source-link href="/ranking/black-tea-consumption-expenditure">紅茶消費支出額ランキング</source-link>
<source-link href="/ranking/green-tea-consumption-expenditure">緑茶消費支出額ランキング</source-link>
<source-link href="/ranking/coffee-consumption-expenditure">コーヒー消費支出額ランキング</source-link>
```
↑ 紅茶のカードは前の節と重複、緑茶・コーヒーは直上の図と無関係。読者には「関係ないリンク」に見える。
図に対応する 1 枚だけカードで残し、他は `あわせて見る: [緑茶消費支出額ランキング](/ranking/green-tea-consumption-expenditure) / [コーヒー消費支出額ランキング](/ranking/coffee-consumption-expenditure)` にする。

検査 (決定的 lint・**blocker**): `.claude/scripts/lib/article-structure-lint.mjs` が
`dup-ranking-link` / `adjacent-cluster` / `no-figure-section` / `tail-cluster` を検出する
(`offtopic-link` = 指標名が節の本文に出てこない、は warning)。配線先は `quality-gate.mjs`
(pre-commit + publish-blog.yml で公開前ブロック) / `audit-article-structure.mjs` (バッチ) /
`audit-published-blog.mjs` (公開済み棚卸し)。

既存記事の一括是正は決定的変換スクリプトで行う (散文は変更しない):
```bash
node .claude/scripts/blog/fix-source-link-placement.mjs            # dry-run
node .claude/scripts/blog/fix-source-link-placement.mjs --apply    # .local/blog-srclink-fix/out へ
npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply         # R2 の article.md を上書き
```
どの図にどのカードを残すかの意味判断が要る分だけ brushup サイクルで agent が対応する。

### 内部リンクの実在 (★必須・soft 404 に注意)

記事から張る内部リンクは**リンク先が実在すること**。`/ranking/<key>` は **存在しないキーでも
HTTP 200 を返し、タイトルだけ「ランキングが見つかりません」になる (soft 404)**。ステータス監視や
`curl -o /dev/null -w %{http_code}` では**素通りする**ので、判定は必ず**実在集合かタイトルの内容**で行う。

2026-07-24 の初回実測 (公開 419 記事・内部リンク 延べ 2,573 本 / ユニーク 820 件):

| 種別 | ユニーク | 壊れ | 壊れ方 |
|---|---:|---:|---|
| `/ranking/` | 561 | 36 | soft 404 (200) 29 + 410 Gone 7 |
| `/blog/` | 181 | 8 | 未公開 (published:false) / 実在しない slug |
| `/category/` | 20 | 3 | 17 軸に無いキー (`transport` 等) |
| `/themes/` | 11 | 2 | 実在しない slug (`landform-climate` 等) |
| `/areas/` | 47 | 0 | — |

**三層で検査する**（①②が記事本文、③がページ側コンポーネント生成リンク）:

| 層 | 実装 | 発火箇所 | 判定できるもの |
|---|---|---|---|
| ① オフライン (ネットワーク不要) | `.claude/scripts/lib/internal-link-lint.mjs` | `quality-gate.mjs` (pre-commit + 公開 CI) / `audit-article-structure.mjs` / `audit-published-blog.mjs` | ranking (GONE / KNOWN∪config 外) / category / areas / themes / blog (GONE・呼び元が公開 slug 集合を渡した場合) → **blocker** |
| ② live 実測 (週次) | `.claude/scripts/blog/audit-internal-links.mjs` (`internal-link-audit-weekly.yml`) | 日曜 04:00 JST。壊れがあれば `link-alert` Issue | 全種別。**KNOWN に載っているが R2 データが無いキー**など①が確定できない壊れ方 |
| ③ サイト横断 live 実測 (週次) | `.claude/scripts/site/audit-site-links.mjs` (同 workflow) | 同上 | **ページ側コンポーネントが生成するリンク** (タグ・パンくず・サイドバー・県データブックの KPI グリッド等)。記事本文に現れないため①②では原理的に検知できない |

**③ が要る理由 (2026-07-24 実測)**: リンクの大半は article.md ではなくコンポーネントが生成する。
③ でしか見つからない壊れが 3 系統あった — 公開記事のタグリンク **1,988 本が 410**
(`known-tag-keys.ts` が D1 廃止で 2026-04-26 に凍結)、全 47 県の県ページが `isActive:false` の
ランキングへリンク、約 231 ランキングページが合成 survey id (`ssds-src:*`) へ 404 リンク。

> **★上のタグリンク 410 は解消済み (2026-08-17 実測)**。`known-tag-keys.ts` は 868 件・
> 2026-08-05 再生成 (`28a881711`) で、`/tag/人口` は本番 200 を返す。**この段落は
> 「なぜ層 ③ が要るか」の根拠として当時の実測を残したもので、現状の記述ではない。**
> 凍結が続いていると誤読して再調査しないこと (2026-08-17 に実際に誤読した)。
生成元ごとのオフライン検査 (`validate:area-databook` / `validate:catalog` の
`[metric-inactive]` / `[ranking-link]`) が①に相当する再発防止で、③はその網羅漏れを拾う。

①は live 実測 49 件に対し**誤検知 0・見逃し 0**で一致することを確認済み。ただし①の集合判定だけでは
`fiscal-strength-index` のような「config も KNOWN もあるが R2 データが無い」キーは検出できないため、②が要る。

是正は決定的スクリプトで行う (散文は変更しない):

```bash
node .claude/scripts/blog/audit-internal-links.mjs                  # 壊れリンクの洗い出し
# .claude/scripts/blog/data/broken-link-remap.json に置換先を追記 (無ければ to: null = リンク解除)
node .claude/scripts/blog/fix-broken-internal-links.mjs --apply     # 置換先の live 検証つき
npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply --src .local/blog-linkfix/out
```

置換表の規律: **アンカーテキストの指す指標が実在 metric の title と一致するときだけ `to` を書く**。
近そうなだけのページへ飛ばさない (誤った行き先より無リンクを選ぶ)。理由は `reason` に必ず残す。
`--apply` は置換先を live で実測し、1 つでも到達不能なら中断する (新たなリンク切れを作れない)。

> 既存記事の改稿は R2 push だけでは本番に出ない (`● SSG` prerender)。**再デプロイが要る**
> → `.claude/rules/nextjs-ssg-preservation.md`。

### 可視化は SVG 図に統一・表は原則禁止 (★2026-06-04 確定: markdown 表 全面禁止)

ブログ記事は **数値・データを表 (markdown table) で羅列せず、必ず SVG 図で視覚化する**。これがサイト全体の原則。

- ✅ **標準: 上位5+下位5 のカード型 SVG**（2026-06-20 確定。10件は廃止）— ランキングは「上位5件 + 下位5件」をカード型で 1 枚にする。モバイル可読性が高く、上下の対比が一目で伝わる。中位は本文の `<source-link href="/ranking/{key}">` でランキング詳細へ誘導する。
  - `generate-article-charts.ts` が `*-ranking.json` から **横長 columns (`<name>.svg`・ブログ本文+X) と 縦長 portrait (`<name>-ig.svg`・Instagram) の2レイアウトを自動両出力**する。本文は横長を参照。正典 = `.claude/rules/blog-data-schema.md` §1.5 / カタログ = `blog-svg-chart-standards.md`。
  - 旧「上位10+下位10」の既存記事は順次 5 へ再生成（`regenerate-ranking-cards.mjs`）。
- ❌ **禁止: markdown 表 (`| … |`) の一切** — ランキング表・比較表・全件表・定義表を問わず、記事本文に markdown table を置かない。データは SVG 図で、手順・列挙は箇条書き (bullet list) で表現する。
  - ランキング数値 → 上位5+下位5 の SVG 横棒図 (`![alt](data/<name>.svg)`)。全件・中位は `<source-link href="/ranking/{key}">` でランキング詳細へ誘導。
  - 比較・分類・手順 (非データの表) → 箇条書き or 散文。どうしても二次元比較が必要なら SVG 図 (グループ化横棒・散布図・タイルマップ等) にする。
- 検査 (決定的): `quality-gate.mjs` が **markdown 表の存在を blocker で検出**する (区切り行 `|---|` を 1 つでも含めば fail)。チャート0 / 上下非対称 / truncated は「表禁止」に包含されるため個別判定は廃止。

### 記事 markdown の正典テンプレート (★2026-06-02 確定: コンポーネント二重・未描画を排除)

`article.md` に書いてよいもの・書いてはいけないものを固定する。ページ側 (`apps/web/src/app/blog/[slug]/page.tsx`) が描画する要素を記事 markdown に重複して書かない (二重・不一致の温床)。

| 要素 | 正典 | 記事 markdown では |
|---|---|---|
| ランキングチャート | **生成画像 `![alt](data/<name>.svg)`** (上位5+下位5) | ✅ これだけ。`<chart-placeholder>` (未描画) と インライン `<svg>` は **禁止** |
| データ表 / 比較表 | **SVG 図** (データ) または 箇条書き (列挙・手順) | ❌ markdown 表 (`\| … \|`) は全面禁止。区切り行 `\|---\|` があれば公開ブロック |
| 関連ランキング | ページ側 `RelatedRankingsSection` (tag 駆動) | ❌ 記事内 `## 関連ランキング` を書かない。本文中は各図直下の `<source-link>` で個別誘導 |
| 関連記事 | ページ側 `BlogRelatedArticlesSection` (tag 駆動) | ❌ 記事内 `## 関連記事` / `### 関連記事` を書かない |
| AI スクール広告 | (コードから除去済・2026-06-02) | 記事に書かない |
| 関連データ DL | (コードから除去済・2026-06-02) | 記事に書かない |
| 出典 | `## データ出典` テキスト または `<data-source>` タグ | ✅ どちらか (本文末) |
| ランキング詳細への誘導 | `<source-link href="/ranking/{key}">` | ✅ **各図の直下にインライン**配置 (末尾集約禁止) |
| AdSense 枠 | `<ad-slot></ad-slot>` (任意・未配置なら自動注入) | ✅ 任意 |

**決定的検査 (`quality-gate.mjs` が blocker)**: `<chart-placeholder>` 残存 / インライン `<svg>` / 記事内 `関連(ランキング\|記事)` 見出し。これらは公開前に弾かれる。バッチ是正の対象でもある (2026-06-02 棚卸し: 記事内関連229・インラインsvg76・chart-placeholder54)。

### 表は使わない (★2026-06-04: markdown 表 全面禁止)

**記事本文に markdown 表 (`| … |`) を一切置かない。**「図と重複する表」「表だけ」「上下非対称表」「truncated 表」「全件表」いずれも不可。データは SVG 図、列挙・手順は箇条書きで表現する。

- ❌ **禁止: あらゆる markdown 表** — ランキング表 (順位列) も、比較表・分類表・手順表・全件表 (47 都道府県) も等しく禁止。区切り行 `|---|` を 1 つでも含めば公開ブロック。
- ✅ **データの可視化 → SVG 図** — ランキングは上位5+下位5 横棒、分布は散布図/ヒストグラム、地理は タイルマップ、時系列は折れ線。`![alt](data/<name>.svg)`。
- ✅ **全件・中位を見せたい → `<source-link href="/ranking/{key}">`** でランキング詳細ページへ誘導 (全件はリンク先で閲覧可)。記事に全件表を焼き込まない。
- ✅ **非データの比較・手順 → 箇条書き (bullet list) or 散文**。二次元比較がどうしても必要なら グループ化横棒等の SVG にする。

なぜ表を全廃するか: (1) markdown 表はモバイルで横スクロール/折返しが破綻し可読性が低い、(2) 図と重複する表が「読者価値ゼロの水増し」として繰り返し混入した (shochu 等)、(3) 「どの表なら OK か」の線引きを critic 判断に委ねると再発する。**「表は使わない」を決定的ルールにすることで線引き自体を消す。**

検査 (決定的): `quality-gate.mjs` が markdown 表 (区切り行 `|---|`) の存在を **blocker** で検出する。

> **文字数判定は prose (地の文) ベース・かつ「床」のみ (2026-06-02〜)**: `quality-gate.mjs` の charCount は frontmatter / 表 / 画像参照 / `<source-link>` 等タグ / リンクURL / 見出し・引用記号 / コードを除いた**地の文のみ**を数える。ただし**文字数は品質指標ではなく、スタブ (極端に薄い) を弾く床**として **1600 字未満を blocker / 2400 字未満を warning** とするだけ。**量的な十分さ・密度・非反復は blog-critic の意味レビューが判断する**。過去に「2800 字を満たすための反復水増し」が critic に water-padding と判定された反省から、長さの縛りを critic に一本化した。表・markup・リンクでは字数を稼げない。

### 図あたり prose 字数の床 (★2026-06-06 確定: 「図はあるが薄い」を決定的に弾く)

「SVG はあるが文章が少なすぎる」という症状の実体は **図を貼って解説段落が無い** こと。実測で
**良記事は図あたり ~600字** (`health-life-expectancy` 等は各図の後に 3-4 段落の解釈)、**薄い記事は図あたり ~280字**
(`ryokan-vs-hotel` は 6 図 / 1,693 字 = 282字/図) と明確に分かれる。総 prose 字数の床だけでは「図を増やして
1 図 1-2 文」のスカスカ記事を弾けないため、**図あたり prose 字数** を決定的フロアに追加する。

- **計算**: `prose字数 ÷ SVG図数` (`![](data/*.svg)` の枚数)。チャート 0 の記事には適用しない (表禁止チェックが別途カバー)。
- **blocker**: `< 350字/図` — 図を貼って解説が薄い。各図の直後に「なぜ上位/下位か」の解釈段落を足すか、図を減らす。
- **warning**: `< 550字/図` — 図あたりの解説がやや薄い (良記事は ~600字/図、critic の意味判断で可否)。
- **副次効果**: 図を増やすほど分母が増え prose 要求も増えるため、**「まとめに findings 図を貼って水増し」「装飾 SVG で字数稼ぎ」が構造的に不能**になる。図数は品質ではない (良記事 `beef-consumption` は SVG 1 枚で prose 3,981 字)。**図を貼る判断には常に「この図に解釈を 1 段落足せるか」を伴わせる。**

検査 (決定的): `quality-gate.mjs` が `prosePerChart` を計算し blocker/warning を出す。

## 記事アーキタイプ (★2026-06-06: 型で章構成・字数・分析視点を担保)

「SVG はあるが薄い」「callout が定型で不自然」を根治するには、**記事タイプごとに「章構成・目安字数・必須の
分析視点」を固定**する。これにより機械フロア (図あたり字数・H2数) と意味レビュー (型ごとの分析視点を critic が
審査) の両面で品質を底上げできる。記事は下記 8 型のいずれか 1 つを選び、その章構成と必須分析視点に従う。

**frontmatter に `archetype: A|B|C|D|D2|E|F|G` を宣言する** (任意だが推奨)。gate は型別の字数床を強制しない (普遍の
図あたり字数で担保) が、blog-critic が宣言された型の **必須分析視点が満たされているか** を意味審査する。宣言が
無い場合 critic は本文から型を推定して審査する。

| 型 | 用途 | 目安字数 | 必須の分析視点 (critic がこれを審査) |
|---|---|---|---|
| **A 単一指標 深掘り** | 標準。1 指標を掘る | 2,400-3,200 | **なぜ上位/下位か** を地理・産業構造で説明 (各図直下に解釈段落) |
| **B 相関・真因解明** | todo-ran 対抗の差別化主軸。**素材は R2 相関 snapshot に既存 = 最量産可能な主軸型** | 2,800-3,600 | **他指標との相関**を散布図 SVG で可視化 + 「見かけの相関 vs 真因」「相関≠因果」 |
| **C 時系列変化** | V字/逆転/急増減 | 2,400-3,200 | **時系列の推移 + 変化の地理的偏り** (変化が均一でないことを示す) |
| **D 生活含意・対比** | 読者ベネフィット (CV/回遊に最効) | 2,400-3,000 | **内訳分解 (別指標で真因を分解) + 読者の生活への含意** |
| **D2 食品・家計消費** (D 亜種・★2026-07-05 新設) | 家計調査品目の「消費量日本一」型。うどん・マヨネーズ等 CTR 7-17% の勝ちクラスタ横展開 | 2,000-2,800 | **食文化・気候・産地との結びつき**で消費差を説明 + 関連品目との対比 |
| **E 網羅ハブ** | カテゴリ/テーマ送客 | 1,800-2,400 | 代表 2-3 指標を束ねハブ誘導 (薄くなりがち。**乱発禁止**) |
| **F 市区町村内格差** (★2026-07-05 新設) | 決算カード等の市区町村粒度。todo-ran/uub が持たない**最大の差別化資産** | 2,400-3,200 | **県内の市町村間格差**を類似団体平均と対比 + 財政・人口構造の真因 |
| **G 移動フロー** (★2026-07-05 新設) | 県間人口移動 (migration-flow)。転出入クエリは 1-3 月に季節需要 | 2,400-3,000 | **どこから来てどこへ去るか**の方向性 + 年齢構造・東京圏/地方圏の非対称性 |

### 型ポートフォリオ (月次ミックス・2026-07-05 改訂)

月 15-20 本ペースでの型配分。**配分比率の SSOT は `.claude/state/blog/seo-strategy.json` の `typeMix`**
(blog-seo-strategist が winning-patterns 実測で四半期ごとに見直す)。人間向け戦略・入力データは
`.claude/agents/blog-seo-strategist.md` §戦略コンテキスト。**比率の数値はここに再掲しない** (二重管理=ドリフトの元)。
このルールは各型の「どう書くか」(下記の記事アーキタイプ) を持ち、「何本ずつ張るか」は上記 SSOT が持つ。

- どの記事を書くかは topic-queue (`.claude/state/blog/topic-queue.json`、`build-topic-queue.mjs` が生成) の
  pending 上位から払い出す (`/plan-article-queue`)

### 各型の章構成テンプレ

すべての型に共通の制約を内包する: 表禁止 (データは SVG 図) / 上位5+下位5 の SVG が標準 / 各図直下に
`<source-link href="/ranking/{key}">` をインライン / curiosity gap タイトル (1 要素・~17字) / 図あたり ≥350字 / H2≥4 / callout≥3 /
内部リンク≥3。**核心の insight は冒頭〜前半に先出しする** (後置すると離脱する)。
チャートは **tile-grid 地図と散布図を優先**し 3 図構成を標準とする (winning-patterns robust: hasMap +15.4% /
hasScatter +15.4% / chartCount winner 中央値 3)。図あたり prose は **~550 字を目標** (床 350 字は gate。
winner 中央値 550 字/図 — 書きすぎも負けプロファイル)。

- **A 単一指標 深掘り**: ①冒頭 (緊張感 + 核心の問い、核心を一部先出し) → ②全体トレンド + `[!NOTE]` 定義 →
  ③上位5+下位5 SVG +「なぜ上位/下位か」を 3-4 段落 → ④構造的解釈 (地理/歴史/経済の真因) + `[!WARNING]` 限界 → ⑤関連へ誘導
- **B 相関・真因解明**: ①「A が高い県は B も高い?」の問い → ②指標A 上位5+下位5 SVG → ③指標B 上位5+下位5 SVG
  (同じ県が並ぶか対比) → ④**散布図 SVG で相関を可視化** +「見かけの相関 vs 真因」 → ⑤`[!WARNING]` 相関≠因果 → ⑥両 `/ranking/{key}` リンク
- **C 時系列変化**: ①「半減→過去最多」等の変化フック → ②折れ線 SVG で推移 → ③最新年の上位5+下位5 SVG →
  ④変化が大きい県の「なぜ」 → ⑤`[!TIP]` 今後の読み筋 → ⑥関連リンク
- **D 生活含意・対比**: ①「住む県で物価がこれだけ違う」読者事 → ②上位5+下位5 SVG → ③内訳の真因 (家賃/交通など
  別指標で分解) → ④`[!TIP]` 読者の生活への含意 → ⑤関連リンク
- **D2 食品・家計消費**: ①「◯◯消費量日本一はどこ?」フック (核心の県名は一部先出し) → ②上位5+下位5 SVG +
  tile-grid 地図で地理分布 → ③「なぜその県か」を食文化・気候・産地・歴史で 3-4 段落 → ④関連品目との対比
  (scatter or 別ランキング参照、例: うどん県はそば消費が低いか) → ⑤`[!TIP]` 関連品目の読み筋 + `/ranking/{key}` 誘導。
  データ: 家計調査品目 metric (R2 `app/stats/<key>/values.json`)。**品目は系統展開する** (うどん→そば→ラーメン→餃子…)
- **E 網羅ハブ**: ①テーマ概観 → ②代表指標を 2-3 個、各々 上位5+下位5 SVG + 1 段落 + `/ranking/{key}` →
  ③`/category/{key}` `/themes/{key}` でハブ誘導
- **F 市区町村内格差**: ①「同じ県でも市町村でこれだけ違う」フック → ②県内市町村の上位/下位 SVG →
  ③類似団体平均との比較 (bar) → ④財政・人口構造の真因 + `[!WARNING]` 決算年度・団体区分の注意 →
  ⑤`/areas/{code}` 誘導。データ: 決算カード (`apps/web/public/finance-cards/cities/` + `similar-averages.json`)。
  **数値は finance-cards JSON のみ使う** (捏造防止、factual-check 対象)
- **G 移動フロー**: ①「◯◯県の人はどこへ移住する?」フック → ②転出先/転入元 上位 SVG → ③年齢別・男女別の偏り →
  ④東京圏一極集中・U ターン等の構造解釈 + `[!WARNING]` 住民基本台帳ベースの限界 (実移動との乖離) →
  ⑤関連 `/ranking/{key}` (転入超過数等)。データ: R2 `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json`

### callout の正しい使い方 (機械的反復を排除)

callout が「全記事で定義1 + 年次差caveat1」の定型 2 個になり情報量ゼロ＝「不自然」の正体。**callout は本文を読まなくても
独立した価値がある「読み違い防止の知識」にする** (gate は数を数えるだけ、中身は critic が審査)。

| 種別 | 入れるべき中身 | アンチパターン (critic が弾く) |
|---|---|---|
| `[!NOTE]` 定義・調査方法 | 「指標は事業所単位。本社一括計上で都市部が過大」等、**読み違いを防ぐ知識** | description / 本文の言い換え・要約だけ |
| `[!WARNING]` 限界・落とし穴 | 「2018年に定義変更で不連続」「内陸県は0表示=対象外」「相関≠因果」 (B/C 型で必須) | 全記事共通の「年次が異なる」定型 |
| `[!TIP]` 読み解くコツ・次の一手 | 「人口あたりに直すと順位が逆転する」「◯◯と合わせて見る」**分析視点の提供** (D 型の核) | 内容ゼロの数稼ぎ |

- 全型共通: `[!NOTE]` (定義) 1 個は必須。配置は該当データを論じる H2 内 (冒頭でなく文脈の中)。3-4 個が適量、5 個以上は過剰。
- **記事固有の callout を書く** (全記事に同じ文言を貼らない)。`health` の TIP「3年ごと算定でコロナ後未反映」のような記事固有の注意が良い callout。

## brushup の判断基準

GSC スナップショットで以下に該当する記事は brushup 候補:

- impressions ≥ 200 / 週
- CTR < 2%
- position 5-15 (改修で順位向上の余地大)

特に **impressions ≥ 500 かつ CTR < 1%** は最優先 (1記事あたり +20-50 clicks/週 のリフト見込み)。

検証コマンド (改修候補抽出):

```bash
awk -F',' 'NR>1 && $1 ~ /\/blog\// && $3 >= 200 && ($4+0) < 0.02 && ($4+0) > 0 {print $0}' \
  .claude/skills/analytics/gsc-improvement/reference/snapshots/<week>/pages.csv | \
  sort -t',' -k3 -rn | head -20
```

## デプロイフロー (記録)

1. `.local/r2/app/blog/{slug}/article.md` の frontmatter (title, seoTitle, description) を編集 ★article.md が SSOT
2. 必要なら本文も編集 ([!NOTE] callout 追加、内部リンク強化)
3. `bash .claude/skills/db/sync-snapshots/run.sh --only blog` で R2 push
   （`export-blog-snapshot.ts` が article.md frontmatter を直接読んで `app/blog/all.json` を生成 = 完全DBレス。D1 articles テーブルは廃止済）
4. 改善バックログ `docs/todo/04_改善バックログ.md` に BLOG-CTR-NN として記録
5. feature ブランチで commit → develop merge → PR develop → main → CI green → merge → Cloudflare Pages 自動 deploy

## 実証データ (2026-05-23 ベース)

BLOG-CTR-03 / 04 で 10 記事を curiosity gap 改修:

| Tier | imp 合計 | 改修前 CTR 平均 | 想定 CTR | 想定リフト |
|---|---|---|---|---|
| Top 5 (BLOG-CTR-03) | 5,499 | 1.5% | 3.5% | +101 clicks/週 |
| Tier 2 (BLOG-CTR-04) | 1,307 | 0.69% | 3.0% | +30 clicks/週 |
| **合計 (Top 10)** | **6,806** | 1.31% | 3.4% | **+131 clicks/週 (+645/月)** |

4 週後 (2026-06-20) に GSC snapshot で検証。実測 CTR が想定の 70% 以上なら本パターンは effect/full 確定。

## 新規記事の無人生成パイプライン (★2026-07-31 新設)

Claude のトークンを使わず、Gemini API + 決定的ゲートだけで新規記事を書いて公開まで届ける。
ranking ai-content の日次ループ (`ranking-content-standards.md` §全件量産の日次ループ) と同じ形。

```
topic-queue (何を書くか)
  → R2 観測値を接地 (fetch-ranking-data-r2.mjs --with-map)
  → ★データ健全性ゲート (blog-topic-gate) — 壊れた metric の記事は書かない
  → SVG 生成 (generate-article-charts.ts。ランキング + タイルマップの 2 枚)
  → 本文生成 (Gemini) → quality-gate → 落ちたら指摘を添えて再試行
  → ★critic (別コンテキストの Gemini。記事本文だけを渡す) → review.md
  → published:true → 最終ゲート → docs/21 outbox → develop push
  → blog-auto-publish.yml を dispatch → factual/quality 再検証 → R2 公開
```

| 要素 | 実装 |
|---|---|
| 生成 | `packages/ai-content/src/scripts/generate-blog-article.ts` |
| prompt | `packages/ai-content/src/services/prompts/blog-article-prompt.ts` (本文 + critic) |
| データ健全性ゲート | `packages/ai-content/src/services/blog-topic-gate.ts` (+ `__tests__/`) |
| 日次 cron | `.github/workflows/blog-generate-daily.yml` (JST 04:30) |

### データ健全性ゲートが生成の**前**に要る理由

quality-gate は「本文の数値が data/*.json と一致するか」しか見ないので、**その data 自体が
壊れていれば一致してしまう**。壊れた観測値から書き始めると捏造記事を量産する。

実例 (2026-07-31 に topic-queue 上位で実際に踏んだ): `convenience-store-count-commercial` は
分類軸の絞り忘れで 94 行 (47県 × 2系列) あり、下位が「-1.7 店」という負の増減率だった。
判定は取り込み側・週次監査と同じ `findExpectedShapeAnomaly` を使い、加えて接地した行そのもの
(県の重複・件数・非有限値・全件同値) を見る。**「47 県でなければ違反」にはしない** — 港湾・
漁港系は内陸県が対象外で 40 県台が正常なので、誤検知を出すゲートは運用で無効化される。

### critic を同じモデルにしてよいのか

本ファイルが禁じているのは「**書いた本人が自己採点して公開する**」ことなので、critic には
**記事本文だけ**を渡し、ground truth も型の指示も再試行履歴も渡さない。文脈が違えば同じモデルでも
独立した読者として読める。人間 (または別 agent) のレビューより弱いのは事実なので、公開後の
GSC 実測と是正ループ (`blog-remediation-loop.md`) で品質を上げる。

### 型ごとの図の構成

| 型 | 図 | 接地 |
|---|---|---|
| A / C / D / D2 / F / G | ランキング + タイルマップ (2 枚) | `fetch-ranking-data-r2.mjs --with-map` |
| **B (相関)** | 指標A ランキング + 指標B ランキング + **散布図** (3 枚) | 上記 + `fetch-correlation-scatter.mjs` |

型B に散布図が要るのは、2 指標の関係を論じる記事に主指標だけの図を貼っても問いに答えられない
から (2026-07-31 に dry-run で実際にその形になることを確認し、散布図の接地を通してから解禁した)。
相関 snapshot にペアが無ければその記事は成立しないので skip する。**第2指標もデータ健全性ゲートを
通す**。カードは 1 枚だけ (dup-ranking-link を避ける) なので、第2指標へはテキストリンクで導線を作る。

### 起動経路 (cloud セッションからも回せる)

`blog-generate-daily.yml` は 3 経路で発火する。

| 経路 | 用途 |
|---|---|
| schedule (JST 04:30) | 無人の日次ループ |
| **push `data/blog-generate-requests.json`** | **cloud セッション用**。`{ "limit": 1, "dryRun": false, "keepDraft": true, "requestedAt": "<ISO>" }` を develop へ commit すると実行し、request を git rm で commit-back する |
| workflow_dispatch | ローカルからの手動 |

**再投入するときは `requestedAt` を必ず更新する。** paths フィルタは差分で判定するので、同じ内容を
書き直しても diff が出ず発火しない (2026-07-31 に実際に踏んだ)。request は**結果によらず消費される**
(失敗した run が残すと、同じ内容では再実行できなくなるため)。

push 経路が要るのは、**cloud セッションが `actions:write` を持たず workflow_dispatch できない (403)**
ため。`data-refresh.yml` / `gemini-image-run.yml` と同じ方式で、`ai-content-generate-daily.yml` にも
同型の口 (`data/ai-content-generate-requests.json`) を用意した。これが無いと cloud からは cron を
待つしかなく、実生成を検証できない (2026-07-31 に実際に詰まった)。

### 件数は実測してから増やす

既定 `limit: 2`。1 記事あたり本文生成 + critic の 2 回 Gemini を呼ぶ。公開された記事の品質を
GSC と critic の指摘で確認してから増やす (ai-content の 40 件と同列に扱わない)。

## ルール ↔ 機械チェック 対応表 (★2026-07-31 棚卸し・ゲート設計の SSOT)

「どのルールが決定的に守られ、どれが critic の意味判断に委ねられているか」を 1 箇所で見えるようにする。
**ルールを追加したらこの表に行を足し、gate に配線するか「critic 判断」と明記する。**
配線せず表にも書かないルールは、書いた翌日から誰にも守られない。

| ルール | 検査 | tier | 実装 |
|---|---|---|---|
| タイトル: 事実羅列型 NG (「N位」で終わる等) | 機械 | blocker | `NG_PATTERNS` |
| タイトル: 扇情語 (驚愕/衝撃/ヤバい/最大級) | 機械 | blocker | `NG_PATTERNS` |
| タイトル: 短く (~17字) / gap 要素 1 個 | **critic** | — | 実測 75.5% / 36.6% 該当で gate 不可。目標であり禁止ではない |
| description: 50字以上 + frontmatter 必須 | 機械 | blocker | `hasDescription` / `hasSeoTitle` |
| description: 緊張感セットアップの質 | **critic** | — | — |
| 文体: ですます調 (copula である調) | 機械 | blocker | `countDearuEndings` |
| 文体: 動詞終止形の常体混在 | **critic** | — | 誤検出を避け gate では見ない |
| **数値: 県名直後の括弧に値・順位を書かない** | 機械 | blocker | `lintParenNumbers` |
| 数値: 本文の値が data/*.json と一致 | 機械 | warn/blocker | `checkArticleFactual` |
| 数値: rank 主張があるのに ground truth 無し | 機械 | blocker | `rankClaimCount` gate |
| callout 2 個以上 / 3 個推奨 | 機械 | blocker/warn | `countCallouts` |
| callout の中身が定型でない | **critic** | — | 数は数えられるが情報量は測れない |
| H2 4 個以上 | 機械 | blocker | `getH2Count` |
| prose 1600字 (床) / 2400字 (推奨) | 機械 | blocker/warn | `getCharCount` |
| 図あたり prose 350字 (床) / 550字 | 機械 | blocker/warn | `prosePerChart` |
| markdown 表の全面禁止 | 機械 | blocker | `countMarkdownTables` |
| chart-placeholder / インライン svg / 記事内「関連」見出し | 機械 | blocker | 正規表現 |
| 内部リンク 3 本以上 | 機械 | blocker | `countInternalLinks` |
| 内部リンクの実在 (soft 404 含む) | 機械 | blocker | `lintInternalLinks` |
| source-link: 図直下1枚 / 末尾集約・重複・隣接・図なし節 禁止 | 機械 | blocker | `lintSourceLinkPlacement` |
| **SVG: 参照先が実在する (画像切れ)** | 機械 | blocker | `missingSvgFiles` |
| SVG: 3点セット (.json + .source.json) | 機械 | blocker | 系譜 gate |
| **SVG: 構造 (viewBox/width/height/閉じタグ/未解決テンプレート値)** | 機械 | blocker | `lintSvgContent` |
| SVG: dark mode 非対応 / theme 色 inline | 機械 | warn | `lintSvgContent` (140枚該当・再生成で解消) |
| SVG: カタログ別 正規サイズ | 機械 | blocker | `lintSvgSize` |
| SVG: choropleth 凡例 / findings パリティ / tile-grid 不変量 | 機械 | blocker | `lintChoroplethLegend` 他 |
| **SVG: 型を判別できる basename (`chart-1` 禁止)** | 機械 | blocker | `MEANINGLESS_BASENAME_RE` |
| SVG: canonical suffix 命名 (`-ranking` 等) の全面遵守 | **critic** | — | 既存負債 14.9%。`-quintile` 等の正当名を巻き込むため gate 不可 |
| 記事アーキタイプ (A/B/C/D/D2/E/F/G) の必須分析視点 | **critic** | — | 型は宣言できるが「視点を満たしたか」は意味判断 |
| 読者価値・冗長・図表重複・curiosity gap の真正性 | **critic** | — | review.md verdict PASS が公開の必須条件 |
| critic レビュー通過 (review.md PASS) | 機械 | blocker | `hasCriticPass` |

**ゲートを足す前に必ずコーパスで該当率を測る。** 「括弧に数字があれば違反」と広げた lint は
公開済み 424 記事の 97.6% を弾き、`(人口10万人当たり)` のような正当な注記まで巻き込んだ
(2026-07-31 実測)。誤検知を出す gate は運用で無効化されるので、確実に違反と言えるものだけを
blocker にし、境界は非検出テストで固定する。

**gate 自体も検証する。** 全 PASS は「ゲートが何も見ていない」状態と区別がつかない。
新しい gate は正常データで発火しないことと、違反を注入したデータで発火することの両方を確認する。

## 違反検知

新規ブログ記事 / brushup で本基準に違反していないか機械的に検知する (量産時の品質ボトムライン担保)。

**実装済の決定的チェック**:

```bash
# 単一記事の総合ゲート (callout≥2 / 内部リンク≥3 / H2≥4 / charCount / source-link 配置 / factual)
# 引数は <slug> (=.local/r2/app/blog/<slug>/article.md を解決) または article.md への直接パス
node .claude/scripts/blog/quality-gate.mjs <slug | path/to/article.md>

# 全記事の source-link 末尾集約を一括監査 → structure-audit.json
node .claude/scripts/blog/audit-article-structure.mjs

# 全記事のチャート SVG 品質 (dark mode 等) を一括監査 → chart-audit.json
node .claude/scripts/blog/audit-chart-quality.mjs

# ★公開済み全記事を R2 公開 URL から取得し決定的チェックを一括適用 (cloud 可・週次棚卸し)
#   → /tmp/published-blog-audit.json。未完了の横断施策だけを改善バックログへ反映
node .claude/scripts/blog/audit-published-blog.mjs
```

公開記事の品質是正キュー (真実源): `.claude/state/blog/remediation-queue.json` (build-remediation-queue.mjs が R2+GSC から再構築)。
週次是正ループ (GSC 優先で blocker 記事を /brushup-blog → critic PASS) は同ファイル参照。

### enforce される箇所 (2026-06-02〜 / 公開前ブロック)

`quality-gate.mjs` は手動実行だけでなく **2 つの関門で自動 enforce** される (factual gate のみで薄い記事が素通りした再発防止)。

| 関門 | 対象 | 挙動 |
|---|---|---|
| **pre-commit** (`apps/web/scripts/pre-commit-checks.sh` §6.1) | staged の `docs/21_ブログ記事原稿/*/article.md` で **`published: true`** のもの | blocker があれば commit 中止。`published: false` の作業中ドラフトは対象外 |
| **publish-blog.yml** (CI→R2) | publish 対象 slug | ステージ後・push 前に実行。blocker があれば R2 公開をブロック (権威ゲート) |

> 作業中ドラフトを commit したいだけなら frontmatter を `published: false` にする。公開 (`published: true`) する記事は必ず gate を通す。

両 audit の結果は `select-brushup-candidates.mjs` が読み込み、違反記事を brushup 候補で優先する (GSC 改善余地を主軸に、同点時に品質問題を加味)。

**title curiosity gap の検出パターン** (要素のいずれかを含むか): `なぜ`, `意外`, `唯一`, `真因`, `vs`, `逆転`, `?`, `倍`, `→`
(`quality-gate.mjs` の NG_PATTERNS で「N位だけで終わる」等のアンチパターンも検出)

## 継続品質ループ (床を上げる × 天井を上げる)

本ファイルの決定的ルールは「床」(全記事を一定品質に揃える)。その上で**アクセス数の多い記事を実測分析して
「良い記事とは何か」を学び、本ファイルの基準自体を引き上げる**のが「天井」ループ（本節が正典）。

- **床 (決定的)**: `quality-gate.mjs` / `audit-published-blog.mjs` → `/brushup-blog --target queue`。文体ですます・
  上位5+下位5 SVG・地理は `tile-grid` 地図 (`*-tile-grid.json` → tile-grid-map)・表禁止・図あたり字数 等。
- **天井 (学習)**: `/analyze-winning-patterns` が GSC 実測 (CTR/順位) × 構造特徴で勝ち要因 (featureSignals) を抽出。
  **confidence hi/mid + 定性裏取り済の信号のみ本ファイルへ書き戻す** (`evidence-based-judgment.md` 準拠、lo 信号で書き換えない)。

## 関連ドキュメント

- **継続品質ループ (床 × 天井): 本ファイル §継続品質ループ** ★床と天井の全体像
- **新規記事の戦略 (型ポートフォリオ・ネタ選定・KPI): `.claude/agents/blog-seo-strategist.md` §戦略コンテキスト** ★何を書くかはまずこれ
- **是正ループの正典 (計画的に順次品質向上): `.claude/rules/blog-remediation-loop.md`** ★既存記事を直すときはまずこれ
- 勝ち要因分析スキル: `.claude/skills/blog/analyze-winning-patterns/SKILL.md`
- 親方針: `docs/00_プロジェクト管理/03_マーケティング戦略.md`「成長レバー > SEO品質」
- 実測判定ルール: `.claude/rules/evidence-based-judgment.md`
- 改善バックログ: `docs/todo/04_改善バックログ.md` (BLOG-CTR-03 / BLOG-CTR-04)
- 既存スキル: `.claude/skills/blog/brushup-blog/SKILL.md` (`--target queue` が是正の実行エンジン)
