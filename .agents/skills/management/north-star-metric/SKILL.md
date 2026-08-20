---
name: north-star-metric
description: North Star Metric と Input Metrics を定義する。Use when user says "NSM定義", "最重要指標", "North Star". KPI体系の設計・見直し.
disable-model-invocation: true
primary_agent: strategy-advisor
---

stats47 の North Star Metric（最重要指標）と 3-5 の Input Metrics を定義する。

原典: [phuryn/pm-skills](https://github.com/phuryn/pm-skills) (MIT License) の `north-star-metric` を stats47 向けにカスタマイズ。

## 引数

```
/north-star-metric [context]
```

- `context`（任意）: 追加コンテキスト（例: `収益重視`, `成長重視`）

## プロジェクトコンテキスト

stats47 は都道府県統計データの可視化サイト。以下の特性を前提に分析すること:

- **プロダクト**: 47都道府県の統計ランキング・チャート・比較を無料提供
- **ビジョン**: 「統計で見る都道府県」— 統計データを分かりやすく可視化し、データリテラシー向上に貢献
- **収益モデル**: 広告・アフィリエイト（トラフィック依存）
- **ユーザー**: 統計好き一般層、学生、ライター、メディア関係者
- **技術基盤**: Next.js + Cloudflare（運用コスト極小）
- **運営**: 個人開発
- **成長チャネル**: SEO、SNS（X/Instagram/YouTube/TikTok）、note.com

## North Star Metric の要件

NSM は以下の 7 基準を**すべて**満たす必要がある:

| # | 基準 | 説明 |
|---|---|---|
| 1 | **理解しやすい** | 組織全員（1人だが将来含め）が即座に理解できる |
| 2 | **顧客中心** | 売上ではなく、ユーザーに提供する価値を反映 |
| 3 | **持続的価値** | 習慣化・長期エンゲージメントを示す |
| 4 | **ビジョン整合** | プロダクトビジョンへの進捗を表す |
| 5 | **定量的** | 明確な数値で計測可能 |
| 6 | **アクション可能** | 施策によって直接影響を与えられる |
| 7 | **先行指標** | 将来のビジネス成功（収益成長）を予測する |

**注意**: NSM は売上・LTV そのものではない。顧客視点の指標であること。

## 手順

### Step 1: ビジネスゲームの分類

stats47 がプレイしているゲームを判定する:

| ゲーム | 定義 | 例 |
|---|---|---|
| **Attention** | ユーザーの滞在時間 | Facebook, YouTube, TikTok |
| **Transaction** | 取引・コンバージョン回数 | Amazon, Uber, Airbnb |
| **Productivity** | タスク完了の効率 | Canva, Notion, Dropbox |

stats47 はコンテンツメディアとして主に **Attention ゲーム** だが、データ提供の側面では **Productivity ゲーム** の要素もある。

### Step 2: 現在のメトリクス調査

以下を収集する:

```
完全DBレス: R2 snapshot / 投稿台帳から取得（旧 D1/miniflare は廃止）

- 公開記事数: `curl -s "https://storage.stats47.jp/app/blog/all.json" | jq '.articles | length'`
- ランキング数: `curl -s "https://storage.stats47.jp/app/ranking-items/all.json" | jq '.count'`
- SNS 指標（最新値）: 投稿台帳 `.Codex/state/sns/posts.json` から集計（旧 D1 sns_posts は廃止）:
  `node -e 'const s=require("./.Codex/scripts/lib/sns-posts-store.cjs");const acc={};for(const p of s.query(x=>x.status==="posted")){const a=acc[p.platform]||={impressions:0,likes:0};a.impressions+=p.impressions||0;a.likes+=p.likes||0}console.log(JSON.stringify(acc,null,2))'`
- SNS 指標（時系列）: `.Codex/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（`sns-metrics-store.cjs` 経由）
```

現在の週次計画（`.Codex/todo/weekly.md`）から追跡中の KPI を確認する。

### Step 3: NSM 候補の検討

以下の候補を 7 基準で評価する（候補は追加可能）:

| 候補 | 概要 |
|---|---|
| 週間ユニークランキング閲覧数 | サイトでランキングページを見た UU 数 |
| 週間データ参照セッション数 | 2ページ以上閲覧したセッション数 |
| 月間オーガニック検索流入数 | SEO 経由の新規ユーザー数 |
| 月間データ引用数 | 外部サイトからの被リンク・引用数 |
| 週間リピーター数 | 2回以上訪問したユーザー数 |

### Step 4: NSM の決定

7 基準の評価表を作成し、最もスコアの高い候補を NSM として選定する。

### Step 5: Input Metrics の定義

NSM を駆動する 3-5 の Input Metrics を定義する。各 Input Metric は:
- 短期的に動かしやすい
- NSM に直接貢献する
- 最適化の焦点を特定しやすい

## 出力フォーマット

```markdown
# stats47 North Star Metric

## ビジネスゲーム
- 分類: [Attention / Transaction / Productivity]
- 理由: ...

## North Star Metric

### [NSM 名]
- **定義**: ...（計測方法を明記）
- **現在値**: N（計測可能な場合）
- **目標値**: N（3ヶ月後）

### 7 基準チェック
| 基準 | 評価 | 根拠 |
|---|---|---|
| 理解しやすい | ○ | ... |
| 顧客中心 | ○ | ... |
| ... | | |

### 却下した候補
| 候補 | 却下理由 |
|---|---|
| ... | ... |

## Input Metrics

### 1. [Input Metric 名]
- **定義**: ...
- **NSM との関係**: [Input] → [NSM] のメカニズム
- **現在値**: N
- **目標値**: N
- **施策例**: ...

（以下同様）

## メトリクスツリー

```
[NSM]
├── [Input 1]
│   ├── 施策 A
│   └── 施策 B
├── [Input 2]
│   └── 施策 C
└── [Input 3]
    └── 施策 D
```

## 計測方法
| 指標 | データソース | 更新頻度 |
|---|---|---|
| NSM | GA4 / GSC | 週次 |
| Input 1 | ... | ... |

## 週次計画への統合
`/weekly-plan` の「現状サマリー」テーブルに NSM と Input Metrics を追加する方法を提案。
```

### Step 6: SSOTとTODOへ反映する

NSM定義・Input Metrics・意思決定ゲートは `docs/00_プロジェクト管理/02_収益化戦略.md` へ直接反映する。
未完了の計測・改善だけを `.Codex/todo/improvements.md` へ具体化する。レビュー全文は保存しない。
週次snapshotは `.Codex/skills/management/nsm-experiment/reference/weekly-snapshots/{YYYY-Www}.json` を継続使用する。

### Step 7: 変遷を確認する

`git log -p -- docs/00_プロジェクト管理/02_収益化戦略.md` と週次snapshotを参照する。

## 参照

- `docs/02_実装計画/00_INDEX.md` — 実装計画の現在地
- `docs/00_プロジェクト管理/02_収益化戦略.md` — NSM・先行指標・意思決定ゲート
- `docs/00_プロジェクト管理/01_プロジェクト定義.md` — プロジェクト概要・ビジョン
- `.Codex/skills/management/weekly-plan/SKILL.md` — 週次計画（NSM 統合先）
- `.Codex/skills/management/growth-loops/SKILL.md` — 成長ループ分析
- 原典: Paweł Huryn の North Star Framework（Amplitude 社ベース）
