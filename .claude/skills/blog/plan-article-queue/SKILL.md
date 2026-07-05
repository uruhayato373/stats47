---
name: plan-article-queue
description: 新規ブログ記事の「次に何を書くか」を状態付きキュー (topic-queue) から選定・レポートする。GSC クエリギャップ×季節性×相関 surprise×競合ギャップの統合スコアで候補を並べる。Use when user says "次に何を書く", "記事ネタ", "topic-queue", "ネタ選定", "記事キュー"。
primary_agent: trend-scout
---

新規記事のネタ選定エンジン。「どの記事を直すか」の是正キュー (`/brushup-blog --target queue`) の**新規版**。
何を書くかの真実源は **`.claude/state/blog/topic-queue.json`** (`build-topic-queue.mjs` が生成)。

**本スキルは実コードを書かない。** `build-topic-queue.mjs` を呼び、候補をレポートし、生産スキルへ橋渡しするだけ。

## 前提 (完全DBレス)

- 入力はすべて既存の R2 / GSC snapshot / git TS を突合するエフェメラル計算 (永続 DB なし)。
- スコア: `combined = 0.35*queryGap + 0.25*seasonality + 0.20*surprise + 0.20*competitionGap`。
  型ポートフォリオ・スコアの意味は `docs/02_実装計画/15_ブログSEO拡充戦略.md` §3-4、型定義は
  `.claude/rules/blog-quality-standards.md` §記事アーキタイプ。

## 用途

- 「今週どの記事を書くか」を決めたいとき (must-write レーン優先)
- 型ミックス (B 相関 / D2 食品 / A 深掘り / F 市区町村 / G 移動) のバランスを見たいとき

## 手順

### Step 1: キューを最新化

```bash
node .claude/scripts/blog/build-topic-queue.mjs          # 最新 GSC 週 + R2 相関で再構築 (状態は保持)
node .claude/scripts/blog/build-topic-queue.mjs --week 2026-W26   # 週指定 (任意)
```

- 週次 cron (`fetch-metrics-weekly.yml`) でも自動再生成されるので、直近実行済なら省略可。
- 出力 `topic-queue.json` の `summary` (pending / must-write / 型内訳) を読者に示す。

### Step 2: 次に書く候補を払い出す

```bash
node .claude/scripts/blog/build-topic-queue.mjs --next 5   # pending 上位 5 件 (JSONL)
```

各エントリの `archetype` / `label` / `combinedScore` / `evidence` (gscImp・pearsonR 等) / `suggestedTitle` を
テーブルで提示する。**型が B に偏っていたら**、下位の D2/F/G を意図的に混ぜて週の型ミックスを整える
(戦略 §3 の月次ミックス: B 5 / D2 4 / A 3-4 / F 3 / G 1-2)。

### Step 3: 生産へ橋渡し

選んだ候補の `topicKey` を in-progress にしてから生産する:

```bash
node .claude/scripts/blog/build-topic-queue.mjs --mark-in-progress <topicKey>
/draft-from-trend --from queue     # キュー先頭の pending を 1 本生産 (下記) / または metricKeys を直接渡す
```

- 1 回 1 記事。B 型は 2 metric (metricKeys) を相関記事に、F/G は決算カード/migration データを使う。
- 公開まで進んだら done にする (published slug を記録):

```bash
node .claude/scripts/blog/build-topic-queue.mjs --mark-done <topicKey> --slug <published-slug>
```

## 規約

- **コードを書かない** (orchestrator)。スコアリングは `build-topic-queue.mjs` に閉じる。
- **既記事化テーマは候補に出ない** (script が R2 `app/blog/all.json` で dedup 済)。既存記事の改善は
  `/brushup-blog --target queue` (remediation-queue) の領分。両キューを混同しない。
- **候補は最終決定ではない**。B 型の高相関ペアには人口交絡・自明ペアが紛れうる (script が減点済だが完全でない)。
  記事化前に相関の意味を吟味し、「意外な関係」が成立しない候補はスキップする (`evidence.populationConfounded` を見る)。

## 参照

- スコアラ: `.claude/scripts/blog/build-topic-queue.mjs`
- 真実源: `.claude/state/blog/topic-queue.json`
- 季節性テーブル: `.claude/scripts/blog/data/seasonality-table.json` (品目×月・手動保守)
- 戦略正典: `docs/02_実装計画/15_ブログSEO拡充戦略.md`
- 型定義: `.claude/rules/blog-quality-standards.md` §記事アーキタイプ
- 生産: `.claude/skills/blog/draft-from-trend/SKILL.md`
- 姉妹キュー (是正): `.claude/scripts/blog/build-remediation-queue.mjs`
