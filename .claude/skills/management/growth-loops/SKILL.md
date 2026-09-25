---
name: growth-loops
description: 持続的成長ループ（フライホイール）を設計・評価する。Use when user says "成長ループ", "フライホイール設計". viral/content/SEO等のループタイプ分析.
disable-model-invocation: true
primary_agent: strategy-advisor
---

stats47 の持続的成長ループ（フライホイール）を設計・評価する。

原典: [phuryn/pm-skills](https://github.com/phuryn/pm-skills) (MIT License) の `growth-loops` を stats47 向けにカスタマイズ。

## 引数

```
/growth-loops [focus]
```

- `focus`（任意）: 特定のループタイプに絞る場合（例: `viral`, `content`, `seo`）

## プロジェクトコンテキスト

stats47 は都道府県統計データの可視化サイト。以下の特性を前提に分析すること:

- **プロダクト**: 47都道府県の統計ランキング・チャート・比較機能を無料提供
- **コンテンツ**: ブログ記事、SNS 投稿（X/Instagram、YouTube通常動画pilot）、note.com 記事。TikTokは撤退
- **現在の成長チャネル**: SEO（検索流入）、SNS 投稿、note.com からの流入
- **収益モデル**: アフィリエイトと行政実務向け商品 (AdSense は恒久停止。正典 `docs/00_プロジェクト管理/02_収益化戦略.md`)
- **ユーザー**: 統計に興味がある一般層、学生、ライター、メディア関係者
- **技術基盤**: Next.js + Cloudflare Workers (OpenNext)、R2 (完全DBレス)

## 手順

### Step 1: 現状の成長チャネル調査

以下を同一セッションの並列 tool call で収集する。数回の read / shell call で終わるため
subagent は起動しない:

#### Track A: トラフィックデータ
```
- 公開記事数: `curl -s https://storage.stats47.jp/app/blog/all.json` の件数
```

#### Track B: コンテンツ資産
```
- 投稿台帳 `.claude/state/sns/posts.json` から投稿状況を集計（完全DBレス。旧 D1 sns_posts は廃止）:
  `node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const by={};for(const p of s.loadAll()){const k=(p.domain||"?")+"/"+(p.platform||"?")+"/"+(p.status||"?");by[k]=(by[k]||0)+1}console.log(JSON.stringify(by,null,2))'`
- .local/r2/sns/ の生成済みコンテンツ
- ブログ記事の企画状況（`.claude/todo/backlog.md` と `topic-queue.json`）
```

### Step 2: ループを比較し、最有望ループを決める

実測データから、機能しているループと構築候補のループを特定し、適合度・成熟度・実装コスト・成長速度・複利効果で比較する。
最有望のループについては、1 人あたりの共有・引用数、共有から新規ユーザーへの変換率、1 周の期間を推定し、検証計画を示す。

stats47 で候補になりやすいループ (固定リストではない): コンテンツ SEO (記事 → 検索流入 → 引用・被リンク → 順位)、
SNS 拡散 (意外な事実の投稿 → 共有 → 流入)、データ引用 (CSV・埋め込み → メディア・研究者の引用 → 権威性)、
クロスプラットフォーム (SNS 間とサイトの相互送客)。

## 出力フォーマット

```markdown
# stats47 成長ループ分析

## 現状サマリー
- 主要流入チャネル: ...
- 現在機能しているループ: ...

## ループ評価

### 1. [ループ名]（推奨度: ★★★★★）
- **仕組み**: A → B → C → A
- **適合度**: 5/5
- **現在の成熟度**: 2/5
- **実装コスト**: S
- **成長速度**: 中期
- **複利効果**: 高
- **具体的アクション**: ...

（以下同様）

## 推奨実装順序
1. 最優先: ...
2. 第2優先: ...

## 30-60-90日ロードマップ
...

## 計測指標
| ループ | 計測指標 | 現在値 | 目標値 |
|---|---|---|---|
```

### Step 3: SSOTとTODOへ反映する

採択した成長ループとゲートは `docs/00_プロジェクト管理/03_マーケティング戦略.md` または
`02_収益化戦略.md` へ直接反映する。未完了の実験だけを `.claude/todo/improvements.md` へ
実行順・停止条件・完了条件付きで統合し、レビュー全文は保存しない。

### Step 4: 変遷を確認する

戦略文書のGit履歴と `.claude/state/experiments.json` を参照する。

## 参照

- `docs/02_実装計画/00_INDEX.md` — 実装計画の現在地
- `docs/00_プロジェクト管理/02_収益化戦略.md` — NSM・収益レーン・意思決定ゲート
- 投稿台帳 `.claude/state/sns/posts.json`（`sns-posts-store.cjs` 経由）— SNS 投稿状況・メトリクスキャッシュ
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画
- 原典: Ognjen Boskovic の Growth Loops フレームワーク
