---
name: analyze-winning-patterns
description: アクセス数(GSC CTR/順位)の多いブログ記事を「良い記事」と仮置きし、トップ記事の構造特徴を実測と突合して勝ち要因を抽出する、品質継続改善ループの「天井を上げる」側。analyze-winning-patterns.mjsでfeatureSignalsを算出し、confidence hi/midの信号のみblog-quality-standardsへ書き戻す。Use when user says "良い記事とは何か分析", "勝ちパターン", "ブログの質を底上げ", "何が刺さるか".
argument-hint: [--min-imp 15]
primary_agent: gsc-analyst
co_agents: [blog-critic, trend-scout]
---

# /analyze-winning-patterns — ブログ勝ち要因分析 (天井を上げるループ)

「アクセス数の多い記事 = 良い記事」を作業仮説に、トップ記事の構造特徴を **GSC 実測 (CTR / 掲載順位)** と
突合して「何が勝ちパターンか」を数値化する。`/brushup-blog`(床=blocker是正) と対をなす **天井=基準を引き上げる**側。

> 概念正典 (天井ループ): `.Codex/rules/blog-quality-standards.md` §継続品質ループ
> 書き戻し先(品質基準): `.Codex/rules/blog-quality-standards.md`
> 判定の歯止め: `.Codex/rules/evidence-based-judgment.md`

## 前提

- GSC 週次 snapshot が必要: `.Codex/skills/analytics/gsc-improvement/reference/snapshots/<week>/pages.csv`
  (無ければ先に `/fetch-gsc-data last28d page snapshot <week>`)。
- R2 公開 URL から公開記事 (`app/blog/all.json` + `app/blog/<slug>/article.md`) を読む (認証不要)。

## 手順

### Step 1: 解析を実行

```bash
node .Codex/scripts/blog/analyze-winning-patterns.mjs            # 既定 imp>=15
# node .Codex/scripts/blog/analyze-winning-patterns.mjs --min-imp 30   # 母数を厳しく
```

出力:
- `.Codex/skills/blog/analyze-winning-patterns/reference/reports/<date>.md` — 比較用レポート
- `.Codex/state/blog/winning-patterns.json` — 機械向け (featureSignals + 記事別 conformance)

### Step 2: シグナルを読む (confidence で足切り)

- **confidence hi (N≥15) / mid (N≥8) の正の lift / Δ** だけを勝ちパターン候補とする。
- **lo (弱い信号) は無視**。N が小さい初期はノイズ。
- **反直感的な信号は仮説扱い**。交絡 (古い記事 / ブランド / キーワード難易度) を排除できるまで基準を変えない。

### Step 3: 定性裏取り (任意だが推奨)

winner 上位 5–8 本について「なぜ刺さるか」を裏取り:
- `blog-critic` agent に winner と loser を読ませ、構造シグナルの解釈を求める。
- 必要なら `/notebooklm-research` で深掘りし、仮説をレポートに追記。

### Step 4: 書き戻し (慎重に)

confidence hi/mid + 定性裏取り済の勝ちパターンのみ `.Codex/rules/blog-quality-standards.md` の
archetype / チェックリストに反映する。**変更は「仮説 → 数記事で試す → 4 週後 measure-gsc-impact 検証 →
effect/* 判定」の順**。lo 信号や未裏取りの直感で基準を書き換えない。

### Step 5: 床ループへ接続

`winning-patterns.json` の `perArticleConformance` (低 conformance × GSC 流入あり) は
`/brushup-blog --target queue` の opportunity レーンで自動的に優先される (tiebreaker)。
是正キューを更新して順次是正:

```bash
node .Codex/scripts/blog/build-remediation-queue.mjs   # conformance を取り込む
/brushup-blog --target queue --next 5
```

## 出力契約 (このスキルの報告)

ユーザーへの報告は以下に絞る (冗長な全文転記をしない):
1. winner CTR 中央値 vs loser、評価本数
2. confidence hi/mid の上位シグナル 3–5 個 (feature / 差 / confidence)
3. 反直感的シグナルがあれば「仮説・要裏取り」と明示
4. 低 conformance × 流入ありの是正候補 上位 3–5 slug
5. レポートファイルパス

## 注意

- これは **判断を伴うループ**。決定的 gate (quality-gate) と違い「効果確定」を自動でしない。
- `evidence-based-judgment.md` の NG ワード (「のはず」「と思われる」等) を使わない。シグナルは数値 + confidence で語る。
