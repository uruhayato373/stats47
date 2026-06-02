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
| ① 機械的フロア | `quality-gate.mjs` | 公開前の床 (決定的) | 捕: callout数/内部リンク/NG word/factual rank/truncated 表/**ランキング表チャート0**/**上下非対称表**/source-link 配置/prose 文字数の床。**不可: 読者価値の有無** |
| ② 意味レビュー | **`blog-critic` agent (別コンテキスト)** | 読者価値の判断 | 捕: 冗長・図表重複・論理の質・curiosity gap の真正性・CTA過多・「この要素は何を足すか」 |
| ③ アウトカム | gsc-analyst / 改善ログ | 最終評価 | GSC CTR/順位・GA4 滞在・CV (遅行・最も真実) |

**鉄則**:
- **文字数 (prose) は「薄すぎ」を弾く床であって品質ではない。**表・markup・リンクでは稼げない (gate が prose のみ計測)。字数を満たしたいなら読者価値のある分析を書く。
- **書いた本人が自分の記事を採点して公開してはならない。**必ず `blog-critic`(別 agent・別コンテキスト) の意味レビューを通す。執筆 (article-writer) と監査 (blog-critic) は分離する。
- 機械 gate を pass しても「品質 OK」ではない。②③ を経て初めて品質が担保される。

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

## 必須パターン (description)

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

### source-link の配置 (★必須・末尾集約禁止)

`<source-link href="/ranking/...">` (関連ランキングへの誘導) は **記事末尾にまとめない**。
**対応する図・データを扱う H2 セクション内 (SVG 図の直下等) にインライン配置**する。

理由: 末尾集約は (1) 読者がその図を見た瞬間の「もっと詳しく」という意図を取りこぼし回遊性を下げる、(2) どのリンクがどのデータに対応するか文脈が失われる。

| 配置 | リンク種別 | 可否 |
|---|---|---|
| 対応セクション内 (図の直下) | `/ranking/{key}` | ✅ 必須 |
| 記事末尾にまとめて 2 個以上 | `/ranking/{key}` | ❌ 禁止 (アンチパターン) |
| 末尾の関連セクション | `/category/{key}` `/themes/{key}` (ナビ目的) | ✅ 可 |
| 末尾の `### 関連記事` | `/blog/{slug}` | ✅ 可 |

**良い例**:
```markdown
## 製造品出荷額ランキング

![出荷額 上位10・下位10](data/manufacturing-ranking.svg)

愛知が58兆円で...（解説）

<source-link href="/ranking/manufacturing-shipment-amount">製造品出荷額ランキングをもっと見る</source-link>
```

**悪い例** (末尾集約):
```markdown
## まとめ
...
<source-link href="/ranking/a">A ランキング</source-link>
<source-link href="/ranking/b">B ランキング</source-link>
<source-link href="/ranking/c">C ランキング</source-link>   ← 全部末尾。各図の直下に分散すべき
```

検査 (決定的 lint): `node .claude/scripts/blog/audit-article-structure.mjs` で `/ranking/` source-link の末尾集約 (2 個以上) を検出。`quality-gate.mjs` にも統合済 (WARN)。どの図に再配置するかは brushup 時に agent が意味判断。

### ランキング可視化の標準 (★2026-06-02 確定: 上位5+下位5 SVG)

ランキング系の記事は **数値を表で羅列せず、SVG チャートで可視化する**のが標準。

- ✅ **標準: 上位5+下位5 の SVG チャート** — ランキングの主役は「上位5件 + 下位5件」を 1 枚の SVG (横棒等) にする。モバイル可読性が高く、上下の対比が一目で伝わる。中位は本文の `<source-link href="/ranking/{key}">` でランキング詳細へ誘導する。
  - 既存の良記事は「上位10+下位10」を使っているものも多い (許容)。**5 でも 10 でもよいが上下は対称**にする。本数の最終判断は本文の情報量と blog-critic に委ねる (gate は本数を判定しない)。
- ❌ **禁止: 表だけ (チャート0) のランキング** — 「順位」列の表しかない記事は不可。必ず SVG を置く (82 記事が該当・2026-06-02 棚卸し)。
- ❌ **禁止: 上下非対称表** — 「上位10 + 下位3」のように上下件数が食い違う表 (51 記事が該当)。対称にするか SVG 化する。
- 検査 (決定的): `quality-gate.mjs` が (1) 「順位」列を持つ表があるのに SVG チャート0、(2) 上下非対称表、を **blocker** で検出する。本数 (5 vs 10) は判定しない。

### 記事 markdown の正典テンプレート (★2026-06-02 確定: コンポーネント二重・未描画を排除)

`article.md` に書いてよいもの・書いてはいけないものを固定する。ページ側 (`apps/web/src/app/blog/[slug]/page.tsx`) が描画する要素を記事 markdown に重複して書かない (二重・不一致の温床)。

| 要素 | 正典 | 記事 markdown では |
|---|---|---|
| ランキングチャート | **生成画像 `![alt](data/<name>.svg)`** (上位5+下位5) | ✅ これだけ。`<chart-placeholder>` (未描画) と インライン `<svg>` は **禁止** |
| 関連ランキング | ページ側 `RelatedRankingsSection` (tag 駆動) | ❌ 記事内 `## 関連ランキング` を書かない。本文中は各図直下の `<source-link>` で個別誘導 |
| 関連記事 | ページ側 `BlogRelatedArticlesSection` (tag 駆動) | ❌ 記事内 `## 関連記事` / `### 関連記事` を書かない |
| AI スクール広告 | (コードから除去済・2026-06-02) | 記事に書かない |
| 関連データ DL | (コードから除去済・2026-06-02) | 記事に書かない |
| 出典 | `## データ出典` テキスト または `<data-source>` タグ | ✅ どちらか (本文末) |
| ランキング詳細への誘導 | `<source-link href="/ranking/{key}">` | ✅ **各図の直下にインライン**配置 (末尾集約禁止) |
| AdSense 枠 | `<ad-slot></ad-slot>` (任意・未配置なら自動注入) | ✅ 任意 |

**決定的検査 (`quality-gate.mjs` が blocker)**: `<chart-placeholder>` 残存 / インライン `<svg>` / 記事内 `関連(ランキング\|記事)` 見出し。これらは公開前に弾かれる。バッチ是正の対象でもある (2026-06-02 棚卸し: 記事内関連229・インラインsvg76・chart-placeholder54)。

### 図と表 (★truncated 表の禁止)

ランキング図 (SVG) の直後に表を置く場合、表は **「全件掲載」か「省略」の二択**。

- ❌ **禁止: truncated 表** — 「上位数件 + `…` + 下位数件」のように `…`/`⋯` で省略した部分複製表。すぐ上のチャート (上位10+下位10) の**劣化した部分集合**にすぎず、読者価値ゼロ。`charCount` ゲートを満たすための水増しに陥りやすい典型的アンチパターン (2026-06-02 検出)。
- ✅ **OK: 全件表** — 全エンティティ (47 都道府県等) を載せる。中位を含むためチャートを補完し、SEO テキスト・Ctrl+F 価値がある。
- ✅ **OK: 表を置かない** — チャート + 該当ランキングへの `<source-link>` で十分 (全件はリンク先で見られる)。
- 表は「図にない情報」を足すときだけ置く (中位/分布/差分など)。図と同じ上下数件をなぞるだけの表は作らない。

検査 (決定的): `quality-gate.mjs` の NG_PATTERN が `| … |` 等の省略行を含む表を **blocker** で検出する。

> **文字数判定は prose (地の文) ベース・かつ「床」のみ (2026-06-02〜)**: `quality-gate.mjs` の charCount は frontmatter / 表 / 画像参照 / `<source-link>` 等タグ / リンクURL / 見出し・引用記号 / コードを除いた**地の文のみ**を数える。ただし**文字数は品質指標ではなく、スタブ (極端に薄い) を弾く床**として **1600 字未満を blocker / 2400 字未満を warning** とするだけ。**量的な十分さ・密度・非反復は blog-critic の意味レビューが判断する**。過去に「2800 字を満たすための反復水増し」が critic に water-padding と判定された反省から、長さの縛りを critic に一本化した。表・markup・リンクでは字数を稼げない。

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
4. 改善ログ `docs/05_改善ログ/gsc.md` に BLOG-CTR-NN として記録
5. feature ブランチで commit → develop merge → PR develop → main → CI green → merge → Cloudflare Pages 自動 deploy

## 実証データ (2026-05-23 ベース)

BLOG-CTR-03 / 04 で 10 記事を curiosity gap 改修:

| Tier | imp 合計 | 改修前 CTR 平均 | 想定 CTR | 想定リフト |
|---|---|---|---|---|
| Top 5 (BLOG-CTR-03) | 5,499 | 1.5% | 3.5% | +101 clicks/週 |
| Tier 2 (BLOG-CTR-04) | 1,307 | 0.69% | 3.0% | +30 clicks/週 |
| **合計 (Top 10)** | **6,806** | 1.31% | 3.4% | **+131 clicks/週 (+645/月)** |

4 週後 (2026-06-20) に GSC snapshot で検証。実測 CTR が想定の 70% 以上なら本パターンは effect/full 確定。

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
#   → /tmp/published-blog-audit.json + docs/04_レビュー/blog-quality/<date>-published-inventory.md
node .claude/scripts/blog/audit-published-blog.mjs
```

公開記事の品質棚卸し (最新): `docs/04_レビュー/blog-quality/2026-06-02-published-inventory.md`。
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

## 関連ドキュメント

- 親方針: `docs/02_実装計画/100x-pv-strategy.md` Phase 0 (CTR 改修)
- 実測判定ルール: `.claude/rules/evidence-based-judgment.md`
- 改善ログ: `docs/05_改善ログ/gsc.md` BLOG-CTR-03 / BLOG-CTR-04
- 既存スキル: `.claude/skills/blog/brushup-blog/SKILL.md`
