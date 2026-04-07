---
name: north-star-metric
description: North Star Metric と Input Metrics を定義する。Use when user says "NSM定義", "最重要指標", "North Star". KPI体系の設計・見直し.
disable-model-invocation: true
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
DB: .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite

- 公開記事数: SELECT COUNT(*) FROM articles WHERE published = 1;
- ランキング数: SELECT COUNT(*) FROM ranking_items;
- SNS 指標: SELECT platform, SUM(impressions), SUM(likes) FROM sns_metrics GROUP BY platform;
```

既存の週次計画（`docs/03_レビュー/weekly/`）から追跡中の KPI を確認する。

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

`docs/03_レビュー/critical/` に保存する。

## 参照

- `docs/02_実装計画/01_実装ロードマップ.md` — KPI・スプリント目標
- `docs/00_プロジェクト管理/01_概要/` — プロジェクト概要・ビジョン
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画（NSM 統合先）
- `.claude/skills/management/growth-loops/SKILL.md` — 成長ループ分析
- 原典: Paweł Huryn の North Star Framework（Amplitude 社ベース）
