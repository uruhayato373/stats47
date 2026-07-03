# Critic レビュープロトコル (全 critic agent 共通の型)

blog-critic / note-critic / ranking-content-critic (および今後の critic 系 agent) が共有する
**レビューの共通プロトコル**。各 agent はドメイン固有のルーブリック (何を審査するか) を自ファイルに持ち、
「どうレビューするか」の型は本ファイルを正典とする。

> 経緯 (2026-07-03 運営総点検): 3 critic がほぼ同型のプロトコル記述を各自コピーしておりドリフトの温床
> だった。agent 統合は AGENT-L3-CONSOLIDATE-01 で KEEP-SKIP 判定済み (責務分離が適切) のため、
> **agent は分離を維持しつつプロトコルだけ単一ソース化**する。

## 原則 (全 critic 共通)

1. **author / critic の分離**: 書いた本人が自己採点して公開しない。critic は必ず author とは
   別コンテキスト (別 agent 起動) で審査する。
2. **read-only**: 審査対象 (記事本文 / ai-content / data) は読むだけ。**修正は呼び元 author に委ねる**。
   書き込みは自分の判定成果物 (review.md 等) のみ。
3. **品質の3層モデルの第②層**: 決定的ゲート (quality-gate.mjs / audit-ai-content.mjs 等) が機械フロア
   (第①層) を弾いた後、critic は**ゲートが捕まえられない意味的品質** (読者価値・冗長・論理の質) を担う。
   機械ゲートに blocker が残っていれば意味審査の前に即 REVISE (機械違反を先に潰させる)。
4. **実証ベース**: 「品質が低そう」という推測での指摘は禁止。具体箇所・定量で指摘する
   (`.claude/rules/evidence-based-judgment.md`)。

## 判定フォーマット (共通)

- **重大度**: `BLOCK` (公開不可・要修正) / `MAJOR` / `MINOR`
- **verdict**: BLOCK が 1 件でもあれば `REVISE`、無ければ `PASS`。REVISE の指摘は author が修正 →
  再レビューで PASS に更新する (critic 自身は直さない)
- 機械ゲート由来の指摘は `[gate:<code>]` プレフィックスで意味指摘と区別する

## Output Contract (共通)

- 呼び元への chat 返答は **Template A** (table-only): `対象 | Section | Issue | Severity | Recommendation`。
  前置き文禁止 (`.claude/rules/agent-output-contract.md`)
- 成果物ファイル (review.md 等・書式は各 agent 定義) が公開ゲートの必須入力になる場合、
  frontmatter に `reviewer` / `verdict` / `date` を必ず含める

## File Boundary (共通)

- 審査対象は read-only。書き込みは自分の判定成果物のみ
- 全 agent と並列起動可。同一対象への複数 critic 並列 (多視点レビュー) も可

## 各 critic のドメイン固有部 (正典は各 agent ファイル)

| agent | 対象 | 機械ゲート (第①層) | 固有ルーブリックの正典 |
|---|---|---|---|
| `blog-critic` | ブログ記事 | `quality-gate.mjs` | `.claude/agents/blog-critic.md` + `blog-quality-standards.md` |
| `note-critic` | note 記事 | (quality-gate 相当) | `.claude/agents/note-critic.md` |
| `ranking-content-critic` | ranking AI コンテンツ | `audit-ai-content.mjs` | `.claude/agents/ranking-content-critic.md` + 生成プロンプト |

新しい critic agent を作る場合は本プロトコルを必読 rules に含め、ドメイン固有ルーブリックだけを
agent ファイルに書く。
