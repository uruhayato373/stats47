---
name: brushup-blog
description: ブログ記事の品質是正スキル。--target queueで状態付き是正キュー(GSC×品質blocker統合スコア)のpending上位をarticle-writer→blog-critic PASS→publishで順次是正、--target article <slug>で1記事リライト、--target batchでユーザー指示時の一括リライト。Use when user says "ブログ品質を上げる", "記事を順次直す", "ブラッシュアップ", "一括リライト".
argument-hint: --target queue [--next 5] | --target article <slug> [--focus CTR-reframe|エキスパート視点追加|最新データ更新|CTA強化] | --target batch [--count 5] [--dry-run] | --target priority (legacy)
primary_agent: article-writer
---

# /brushup-blog — ブログ記事 brushup (優先度キュー生成 + 1 記事リライト + 一括リライト)

旧 `/brushup-blog-priority` (キュー生成)・`/brushup-blog-article` (1 記事リライト)・`/auto-brushup-batch` (一括 rewrite) を統合した skill。 `--target` で 3 モードを切り替える。 **リライトの実行エンジンは `--target article` に一本化**され、`--target batch` はそのエンジンをユーザー指示時に複数記事へループ適用する (cron 自律実行はしない)。

## 引数

```
/brushup-blog --target <priority|article|batch> [<slug>] [--focus <観点>] [--count N] [--dry-run]
```

| 引数 | 必須 | 説明 |
|---|---|---|
| `--target` | Yes | `queue` (★推奨・計画的是正の実行エンジン) / `article` (1 記事リライト) / `batch` (一括リライト、ユーザー指示時のみ) / `priority` (legacy、`queue` に置換) |
| `--next` | `--target queue` の時 Optional | 取り出す pending 件数 (default 5) |
| `<slug>` | `--target article` 時のみ Yes | 記事スラグ (例: `household-income-tokyo-okinawa`) |
| `--focus` | `--target article` の時 Optional | リライト観点 (省略時 `CTR-reframe`): `CTR-reframe` / `エキスパート視点追加` / `最新データ更新` / `CTA強化` |
| `--count` | `--target batch` の時 Optional | 処理件数 (default 5、最大 5 にクランプ) |
| `--dry-run` | `--target batch` の時 Optional | 候補選定 + framing スコア report のみ (書込・commit なし) |

---

## --target queue: 計画的是正 (★推奨・週次バッチの実行エンジン)

`build-remediation-queue.mjs` が作る**状態付き是正キュー** (`.Codex/state/blog/remediation-queue.json`) を消費し、
pending 上位 N 件を順に是正する。GSC 流入 (expectedLift) × 品質 blocker severity を**統合スコア**で序列化し、
publish-blocker を持つ記事 (**must-fix レーン**) を最上位に置く。「次に何を直すか」「何本消化したか」「効いたか」を
キューが追跡するので、**週次で少しずつ品質を底上げ**できる。正典: `.Codex/rules/blog-remediation-loop.md`。

### Step 1: キューを最新化

```bash
node .Codex/scripts/blog/build-remediation-queue.mjs
# audit を fresh 取得 (audit-published-blog.mjs) → 最新 GSC とマージ → 状態を保ったまま upsert。
# done は「直近 brushup 済 かつ audit が blocker 0 を確認」した記事のみ。blocker が残れば自動で再 pending。
```

### Step 2: 次の N 件を取り出す

```bash
node .Codex/scripts/blog/build-remediation-queue.mjs --next 5   # pending 上位 N を JSONL で出力
```

各 entry は `{slug, lane, priority, combinedScore, gsc{}, quality{blockers,prosePerChart,flags}}`。

### Step 3: 各記事を 1 件ずつ是正 (`--target article` エンジンを再利用)

各 slug について順に:

1. **in-progress に印**: `node .Codex/scripts/blog/build-remediation-queue.mjs --mark-in-progress <slug>`
2. **focus は `quality.flags` の blocker 内訳から決める** (`--target article` のリライトエンジンを適用):
   - markdown 表 / truncated 表 / チャート0 → 表を **SVG (上位5+下位5)** に置換
   - `である調 文末` (dearuEndings>0) → **本文を ですます調 に変換** (である。→です。/だった。→でした。/ではない。→ではありません。/動詞終止形→ます形)。callout・引用・データ出典の体言止めは対象外 (正典 `.Codex/rules/blog-quality-standards.md`「文体」)。**★copula だけの正規表現一括置換は禁止** (2026-06-13 実証): 動詞終止形・形容詞終止 (〜もたらす。/〜多い。) が常体で残り「です。」と混在して崩壊し、`quality-gate.mjs` は copula しか見ないため**通ってしまう**。必ず article-writer エンジンが**文単位で ですます完全化**する
   - `rank 主張あるが data 無し` (検証不能 blocker) → R2 `app/ranking/<key>/values.json` から `data/<name>-prefecture-rankings.json` を生成 (value 降順で rank 再計算) し本文数値を data に一致させる
   - `prose/図 <350` → **各図直下に「なぜ上位/下位か」の解釈段落**を追加 (記事アーキタイプの必須分析視点。図あたり ~600字)
   - `callouts<2` → **記事固有の「読み違い防止の知識」** callout を追加 (全記事共通の定型は不可)
   - `internalLinks<3` / source-link 末尾集約 → source-link を各図直下にインライン配置
   - `リンク切れ (soft 404 / 410 Gone)` → **勝手に近そうな別ページへ張り替えない**。`.Codex/scripts/blog/data/broken-link-remap.json` に置換先 (アンカーテキストが指す指標が実在 metric の title と一致する場合のみ。無ければ `to: null` = リンク解除) と `reason` を追記し、`node .Codex/scripts/blog/fix-broken-internal-links.mjs --apply` で決定的に是正する (置換先を live 実測し到達不能なら中断する)。正典 `.Codex/rules/blog-quality-standards.md` §内部リンクの実在
   - opportunity レーン (blocker 無し・CTR 改善余地) → `CTR-reframe`
3. **記事アーキタイプを 1 つ選び frontmatter `archetype: A|B|C|D|E` を宣言** (正典「記事アーキタイプ」)。型の章構成・必須分析視点に従う。
4. **quality-gate を通す**: `node .Codex/scripts/blog/quality-gate.mjs <draft path>`。`prose/図` blocker を含め blocker 0 になるまで直す。
5. **blog-critic を別 agent で起動** → `docs/21_…/<slug>/review.md` verdict: PASS まで反復 (★自己採点禁止)。
6. **done に印 + wave_id**: `node .Codex/scripts/blog/build-remediation-queue.mjs --mark-done <slug> --wave-id YYYY-MM-DD-manual`

### Step 4: wave を記録 (history + 改善ログ)

- `.Codex/state/blog/auto-brushup-history.json` に通過記事を追記 (wave_id 一致、`.Codex/rules/blog-data-schema.md` の命名規則)。
- `.Codex/todo/improvements.md` に `## [BLOG-WAVE-<wave_id>]` section を追加 (frontmatter `status: pending` / `due: <+28日>` / `wave_id`)。
- 公開は CI (`publish-blog.yml` / develop push)。`quality-gate.mjs` が公開前に再 enforce する。

### cadence (週次・人手ゲート)

- **weekly-plan** が毎週 `--next` で top-N を「ブログ品質是正 N 本」Must として転載する。
- 是正の効果は 4 週後に **weekly-review** が wave_id (gsc.md の BLOG-WAVE section) で判定する。
- **全自動ではなく人手ゲート** (critic PASS 必須)。auto-brushup の 13% FAIL リスクを避け、人がバッチ単位で確認しながら進める。
- **★大量是正は 20-30 本/バッチに分割する** (2026-06-13 実証): 173 本を 1 Workflow (writer→critic→revise→critic) で全自動投入したら **14M token + session limit 到達**で critic 段が大量失敗した。writer は quality-gate 反復+SVG生成+全文書き換えで 1 本 ~10万 token と重く、critic が後追いで枠を食い潰す。`--next` の top-N を小バッチで回し、バッチ間で結果確認する。詳細: memory `project_blog_mass_rewrite_lessons`。

### model 傾斜と delta 再審査 (トークン節約・2026-07-07 / TOKEN-CONTENT-01)

critic 往復のコストを下げる 2 つの機構。モデル選択の正典は `.Codex/rules/model-prompting.md`、
対象別 tier の決定実装は `build-remediation-queue.mjs`:

agent起動promptとモデル別の共通規律は `.Codex/rules/model-prompting.md` /
`.Codex/rules/agent-output-contract.md` を正典とする。

1. **model 傾斜**: `build-remediation-queue.mjs` が各 entry に `reviewTier` を付与する (GSC impressions 上位 30 = `opus` / 他 = `sonnet`。ai-content の `build-ai-content-queue.mjs` と同規則)。`blog-mass-rewrite.js` は tier2 (`reviewTier==='opus'`) の初回 critic を opus で起動し、他は既定 (sonnet)。author (rewrite) は常に sonnet 固定。総コストを floor に保ったまま流入上位の審査品質だけ引き上げる。
2. **delta 再審査**: REVISE 後の再レビュー (`blog-revise-fix.js`) は blog-critic を **mode: delta** で起動する — 前回 review.md の指摘 + 変更 hunk のみを見て、正典 465行と記事全文を再読しない (機械的な床は `quality-gate.mjs` が公開前に毎回フル実行するため落ちない)。delta は読む量が少ないため opus で起動しても安価。

> 効果は brushup バッチの token/記事を Workflow journal で実測し baseline (~217K/記事) と比較して判定する (TOKEN-CONTENT-01)。

---

## --target priority: ブログ改善優先度キュー生成 (legacy → `--target queue` に置換)

> ⚠️ **legacy**: 本モードは D1 articles テーブル参照 (DBレス移行で廃止) + 状態を持たない上書きキューで、
> `--target queue` (状態付き是正キュー) に置換された。新規は `--target queue` を使う。以下は旧仕様の記録。

GSC の impressions × CTR と D1 の article メタデータを掛け合わせて、改善効果が最も高い記事を特定し `brushup-queue.md` に出力する。

### データソース

| データ | 場所 |
|---|---|
| GSC ページ別週次 | `.Codex/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` |
| ブログ記事 (公開) | R2 `app/blog/all.json` (`.articles`。旧 D1 articles テーブルは廃止) |

### 実行フロー (priority)

#### Step 1: 最新 GSC ページデータ読み込み

```bash
# 最新週を特定
ls .Codex/skills/analytics/gsc-improvement/reference/snapshots/ | sort | tail -1
```

`.Codex/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` を Read する。
`/blog/` を含む行のみを抽出し、 slug を `https://stats47.jp/blog/` 以降の文字列として取得する。

#### Step 2: R2 blog snapshot から記事メタデータ取得

完全DBレス（旧 D1 articles テーブルは廃止。記事 SSOT は article.md → `app/blog/all.json`）:

```bash
curl -s "https://storage.stats47.jp/app/blog/all.json" \
  | jq -r '.articles | sort_by(.updatedAt) | .[] | [.slug, .title, .publishedAt, .updatedAt] | @tsv'
```

#### Step 3: スコアリング

| 指標 | 計算式 | 意味 |
|---|---|---|
| CTR ギャップ | `全記事平均 CTR - ページ CTR` | 大きいほど「見つかっているが読まれない」 |
| インプレッション | `impressions` 数値そのまま | 大きいほど改善効果が広い |
| スコア | `CTR ギャップ × log10(impressions + 1)` | 両指標の積 (log スケール) |

スコア降順でソートし上位 20 本を選定する。
GSC データは実測値。 D1 の `articles` テーブルの `updated_at` が古い記事はボーナス +0.2 を加算。

#### Step 4: brushup-queue.md 出力

`.Codex/state/blog/remediation-queue.json` に以下の形式で書き出す:

```markdown
# ブログ改善優先度キュー

生成日: YYYY-MM-DD / GSC 参照週: YYYY-Www

| 優先度 | slug | タイトル | impressions | CTR | 平均比 | スコア |
|---|---|---|---|---|---|---|
| 1 | household-income-tokyo-okinawa | ... | 1,177 | 4.4% | -1.8% | 2.31 |
...
```

### Step 5: 次のアクション案内

キュー上位を `/brushup-blog --target article <slug>` で実際に改善するよう案内。

---

## --target article: 1 記事リライト (唯一のリライトエンジン)

ブログ記事を 1 本リライトする。**`--target batch` もこのエンジンを内部で呼ぶ**。`--focus` でリライト観点を切り替える (省略時 `CTR-reframe`)。

### focus 別の動作

| focus | 編集範囲 | NotebookLM | 主目的 |
|---|---|---|---|
| `CTR-reframe` (default) | 全文 reframe (seoTitle / description / 本文) | ❌ 使わない | CTR 改善 (curiosity gap タイトル + 構造的発見) |
| `エキスパート視点追加` | 1-2 セクションのみ部分補強 | ✅ `nlm cross query` (**対話実行限定**) | 白書引用・政策背景 |
| `最新データ更新` | データ説明部分のみ | ❌ | 最新年度値へ差し替え |
| `CTA強化` | 記事末尾の関連リンク | ❌ | 回遊性 |

> **NotebookLM ガード (重要)**: `エキスパート視点追加` focus は `notebooklm` CLI が対話 OAuth 前提でヘッドレス非対応のため、**人間が起動する単記事実行時のみ**選べる。`--target batch` から内部呼び出しされた場合はこの focus を**強制的に拒否し `CTR-reframe` に倒す** (OAuth 失効でループが詰まる事故を防ぐ)。

### 絶対遵守 (2026-05-25 追加, 全 focus 共通)

**rule**: リライトで追加・変更する数値 / rank はすべて data ファイルから copy-paste。 memory や類推で書かない。

補強完了後、 必ず factual cross-check を通す:

```bash
node .Codex/scripts/lib/article-factual-check.mjs \
  ".local/r2/app/blog/<slug>/article.md" \
  ".local/r2/app/blog/<slug>/data"
```

exit 1 なら修正 → 再 check して pass するまで繰り返す。 詳細: `.Codex/skills/blog/SHARED-failure-cases.md`

### 共通 Step A: 記事読込・診断 + ground-truth 確認 (全 focus)

1. `.local/r2/app/blog/<slug>/article.md` を Read (frontmatter + 本文 + H2 構成 + callout/chart 数を把握)
2. 「何が不足しているか」を診断し focus を確定 (引数で明示されていれば従う):
   - **CTR が低い (タイトルに curiosity gap なし)** → `CTR-reframe`
   - **エキスパート視点なし** (白書引用・政策的背景が薄い) → `エキスパート視点追加` ※単記事・対話実行時のみ
   - **最新データなし** (`publishedAt` が 12 ヶ月以上前) → `最新データ更新`
   - **CTA 弱い** (末尾の関連リンク・ランキング誘導が貧弱) → `CTA強化`
3. **ground-truth 確認 (必須)**: `ls .local/r2/app/blog/<slug>/data/` → 各 JSON を Read し、本文で言及する都道府県の `{rank, value, label}` を確認。本文に書く数値・rank はこの値のみ使う (derive 計算は過程を明示)。

### focus=CTR-reframe のフロー (default)

全文 reframe で CTR を改善する。タイトルの curiosity gap が CTR の主因 (`.Codex/rules/blog-quality-standards.md` の実証)。

#### C-1. 関連 metrics 探索 (面白い対比探し)

R2 ranking-items snapshot から同カテゴリの関連 ranking を 3-5 個ピックアップ（完全DBレス。旧 D1 metrics は廃止）:

```bash
curl -s "https://storage.stats47.jp/app/ranking-items/all.json" \
  | jq '.items[] | select(.categoryKey=="<カテゴリ>") | {key: .rankingKey, title}' | head -40
```

「面積 vs 効率」「平均 vs 中央値」「総量 vs 比率」「TOP1 単独 vs TOP10 集中度」等の **対比軸** を 1-2 個発見する。

#### C-2. 5 案 framing 生成 → 4 軸採点 → best 選択

1 記事に対し **必ず 5 つの framing 案**を内的に生成し、各案を 4 軸で 0-10 点採点:

| 評価軸 | 内容 | 重み |
|---|---|---|
| practical_value | 読者が明日使える知識か | 30% |
| structural_finding | データから読み解ける構造的発見か | 30% |
| data_grounding | データを正確に反映しているか (誇張なし) | 25% |
| non_sensational | 扇情的でなく curiosity gap が本質的か | 15% |

**合計 30 点以上**の案がなければこの記事を skip (batch 時は次候補へ)。`rice-harvest` の「X倍格差」失敗事例 (本質的価値ゼロの数値倍率) を再発させない。

#### C-3. best framing で全文 reframe

best 案で seoTitle / description / 本文を再構成する。構成テンプレ (`.Codex/rules/blog-quality-standards.md` 準拠):

1. 冒頭 (緊張感セットアップ + 中核質問)
2. データ概要
3. 構造的発見 1 (主要) / 4. 構造的発見 2 (対比)
5. 対立軸 or 限界 / 6. まとめ + 政策含意・実用 take-away
7. データの位置づけ (古いデータは基準年フレーミング) / 8. 出典 + ライセンス
9. 関連ランキング・記事 (内部リンク 6+ 個)

必須要素: callout 3-4 個 (`[!NOTE]`/`[!WARNING]`/`[!TIP]` ミックス) / chart 1-2 個 (SVG、TOP10 + 対比) / 内部リンク 6+ 個。`<source-link href="/ranking/...">` は対応する図の直下にインライン配置 (末尾集約禁止)。

### focus=エキスパート視点追加 のフロー (対話実行限定・1-2 節のみ)

**全文書き直し禁止。編集は 1-2 セクションのみ。** `--target batch` からは選べない (NotebookLM ガード)。

#### 前提条件

```bash
nlm --version  # 0.6.5 以上 (/Users/minamidaisuke/.local/bin/nlm)
```

#### ノートブック × テーマ マッピング (エキスパート視点追加 focus 用)

記事スラグのキーワードから適切なノートブックを自動選択する:

| キーワード例 | 使用ノートブック |
|---|---|
| income, wage, salary, tax, fiscal, gdp | 経済財政白書 |
| medical, hospital, nurse, care, nursing, birth, fertility, child, suicide | 厚生労働白書 |
| road, infrastructure, port, housing, construction, traffic | 国土交通白書 |
| energy, electricity, solar, renewable, carbon | エネルギー白書,第６次エネルギー基本計画 |
| environment, recycling, waste, pollution, climate | 環境白書 |
| ict, telework, digital, smartphone, internet | 情報通信白書 |
| traffic-accident, transport, logistics, travel | 交通政策白書 |
| manufacturing, industry, productivity, factory | ものづくり白書 |
| small-business, entrepreneur, startup | 中小企業白書 |
| child, education, school, kindergarten, childcare, fertility | こども白書 |
| population, aging, migration, solo-living | 経済財政白書,厚生労働白書 |

複数ノートブックを `--notebooks "白書A,白書B"` でカンマ結合して渡す。

#### nlm cross query で白書調査

```bash
nlm cross query --notebooks "<ノートブック名>" \
  "「<記事テーマ>」について、 背景・政策的意義・最新トレンド・都道府県間格差の要因を教えてください。 引用根拠付きで回答してください。"
```

クエリ結果を整理する ([背景・政策] / [最新データ] / [専門的観点] / [引用元] `<ノートブック名>` より)。

#### 差分のみ article.md に反映

各 H2 の散文導入 or 考察セクションに白書引用・政策背景・専門的解説を 2-3 文追加する。Edit ツールで最小限の変更を適用する (全文書き直し禁止)。

### focus=最新データ更新 / CTA強化 のフロー (部分編集)

| focus | 反映先 | 内容 |
|---|---|---|
| 最新データ更新 | データ説明部分 | data/*.json・D1 の最新年度値に差し替え |
| CTA強化 (関連ランキング誘導) | **対応する図・データを扱う H2 セクション内** (SVG 図の直下等) | そのセクションが言及するランキングへ `<source-link href="/ranking/...">` を**インライン配置**。**記事末尾に集約しない** (回遊性・文脈性を損なう)。ナビ目的の `/category/` `/themes/` への `<source-link>` は末尾の関連セクションで可。検査: `node .Codex/scripts/blog/audit-article-structure.mjs` |

### 共通 Step B: bold+括弧レンダリングバグ検出・修正 (必須, 全 focus)

```bash
node .Codex/scripts/blog/lint-article.cjs <slug>
```

exit 1 (問題あり) の場合は、 検出行を Edit ツールで修正する。

修正パターン:
- `**text（内側）**` → `**text**（内側）` (括弧をボールドの外へ移動)
- `**text（内側）**:` → `**text**（内側）:` (コロン前も同様)

修正後に再度 lint を実行して exit 0 を確認してから次へ進む。

### 共通 Step C: quality-gate + 完了レポート (全 focus)

リライト確定前に factual + 形式の防壁を通す:

```bash
node .Codex/scripts/blog/quality-gate.mjs <slug>
# exit 0 → 確定 / exit 1 → blocker を修正して再実行 (batch では revert + skip)
```

quality-gate は内部で `article-factual-check.mjs` を呼び、rank/値の data 突合・callout/内部リンク/H2・**prose 文字数の床 (1600)**・NG ワード・**truncated 表**を一括検証する。

> **★公開記事は blog-critic レビュー (review.md verdict: PASS) が必須**: `published:true` の記事は
> `docs/21_ブログ記事原稿/<slug>/review.md` (別 agent `blog-critic` が `/blog-review --mode expert` で生成、
> verdict: PASS) が無いと quality-gate が blocker で止める。**リライトした本人が自己採点しない** ——
> 必ず別コンテキストの blog-critic に意味レビュー (冗長・図表重複・水増し・CTA過多・読者価値) を依頼し、
> REVISE 指摘を反映してから PASS を得る。文字数の量的十分性も critic が判断する (高い文字数床で水増しを誘発しない)。
> 詳細: `.Codex/rules/blog-quality-standards.md`「品質の3層モデルと critic 必須」。

#### 共通 Step B2: 表現の正典化 (全 brushup で必ず適用・2026-06-02)

リライト時、記事 markdown を `.Codex/rules/blog-quality-standards.md`「記事 markdown の正典テンプレート」に揃える。
以下は **quality-gate が blocker 化**しているので必ず是正する (棚卸し: `audit-published-blog.mjs`):

1. **チャート**: `<chart-placeholder ... data="X"/>` と インライン `<svg>` を **生成画像 `![](data/X.svg)`** に統一。
   - data/*.json があれば `node .Codex/scripts/blog/generate-article-charts.ts --slug <slug>` で **上位5+下位5** SVG を生成し placeholder を自動置換。data が無ければ `fetch-ranking-data-r2.mjs` で ranking から取得してから生成。
2. **記事内『関連ランキング/関連記事』セクション削除**: ページ側 (`RelatedRankingsSection`/`BlogRelatedArticlesSection`) が正典。`## 関連ランキング` `### 関連記事` 見出しごと markdown から除去 (二重表示の解消)。
3. **source-link を各図直下にインライン配置**: 末尾集約をやめ、対応する図の直下へ分散。
4. **truncated 表 / 上下非対称表の除去**: 全件表 or SVG 化 (上下対称)。

```
=== /brushup-blog --target article: <slug> 完了 ===
focus: <CTR-reframe | エキスパート視点追加 | 最新データ更新 | CTA強化>
採用 framing: <CTR-reframe 時、best 案 + 採点。それ以外は「-」>
参照ノートブック: <エキスパート視点追加 時のみ。それ以外は「-」>
変更内容: <1-2 行で要約>
factual-check: ✅ exit 0 / quality-gate: ✅ exit 0 / bold lint: ✅ exit 0
```

---

## --target batch: 一括リライト (ユーザー指示時のみ)

GSC で改善余地の大きい blog 記事を優先度順に選び、`--target article` エンジン (CTR-reframe focus 固定) でまとめてリライトする。**ユーザーが「一括リライト」等を明示した時のみ実行**。cron 自律実行・PR auto-merge はしない (旧 `/auto-brushup-batch` から移植、自動化部分は除外)。

### 安全装置

- **1 回最大 5 記事** (`--count` > 5 は 5 にクランプ)
- **全件 skip 日は commit せず終了**
- **90 日以内に brushup した記事は dedup** (`.Codex/state/blog/auto-brushup-history.json`)
- **NotebookLM 不使用** (バッチは CTR-reframe focus 固定。エキスパート視点追加は対話実行のみ)

### Step 1: 候補選定

```bash
node .Codex/scripts/blog/select-brushup-candidates.mjs --count 5 > /tmp/candidates.jsonl
```

候補が 0 件なら終了。(注: 旧 30 日 plan `auto-brushup-plan.json` / `generate-brushup-plan.mjs` は cron 廃止に伴い**参照しない** — deprecated)

### Step 2: 各候補を 1 件ずつリライト

各候補 slug に対し `--target article <slug> --focus CTR-reframe` のフロー (共通 Step A → C-1〜C-3 → 共通 Step B/C) を実行する。

- リライト前に `cp .local/r2/app/blog/<slug>/article.md /tmp/brushup-backup-<slug>.md`
- 5 案採点で合計 30 点未満なら skip
- `node .Codex/scripts/blog/quality-gate.mjs <slug>` が exit 1 なら revert (`cp /tmp/brushup-backup-<slug>.md .local/r2/app/blog/<slug>/article.md`) + skip-log

`--dry-run` の場合はここで停止し、候補一覧 + 各 framing スコアを report 出力 (書込・commit なし)。

### Step 3: sync + commit + PR (通過 ≥ 1 件時のみ)

```bash
npm run articles:sync-from-r2 --workspace=packages/database
bash .Codex/skills/db/sync-snapshots/run.sh --only blog

git checkout -b feature/brushup-batch-YYYY-MM-DD develop
git add .
git commit -m "brushup-batch: N 記事 rewrite (slugs: ...)"
git checkout develop
git merge --no-ff feature/brushup-batch-YYYY-MM-DD -m "Merge brushup-batch YYYY-MM-DD"
git push origin develop

gh pr create --base main --head develop \
  --title "brushup-batch YYYY-MM-DD (N 記事)" \
  --body "$(cat /tmp/brushup-report.md)"
```

**ここで停止する。`gh pr merge --auto` は付けない** — CI green 確認後に人間がマージする (`.Codex/rules/branch-workflow.md` の develop→main ゲート)。

### Step 4: history 更新

`.Codex/state/blog/auto-brushup-history.json` に通過記事を追記:

```jsonc
{ "date": "YYYY-MM-DD", "wave_id": "YYYY-MM-DD-auto", "slug": "...", "framing": "...", "expectedLift": N }
```

- `wave_id` は `YYYY-MM-DD-auto`。同日再実行は `-2`, `-3` と連番化し、既存 `2026-05-25-auto` 等と衝突させない (`.Codex/rules/blog-data-schema.md` の wave 命名規則)。
- skip した記事は `.Codex/state/blog/auto-brushup-skipped.log` に記録 (週次レビューで prompt 改善の手がかり)。

---

## 参照

- **記事品質の正典: `.Codex/rules/blog-quality-standards.md`** (curiosity gap / callout / 内部リンク / source-link 配置の単一ソース)
- 優先度キュー: `.Codex/state/blog/remediation-queue.json` (`--target priority` で生成)
- 品質確認: `/blog-review --mode proofread` で最終チェック
- factual + 形式の防壁: `node .Codex/scripts/blog/quality-gate.mjs <slug>` (内部で `article-factual-check.mjs` を呼ぶ)
- 失敗事例 ledger: `.Codex/skills/blog/SHARED-failure-cases.md`
- nlm ヘルプ: `nlm cross --help` (エキスパート視点追加 focus 用)

## 移行ステータス

本 skill は旧 `/brushup-blog-priority` (キュー生成)・旧 `/brushup-blog-article` (1 記事補強)・旧 `/auto-brushup-batch` (一括 rewrite) を統合したもの。 旧 skill はすべて削除済み。 リライトの実行ロジックは `--target article` に一本化され、`--target batch` はそれをループ適用する薄い orchestrator。cron 自律実行は廃止 (ユーザー指示時のみ実行)。
