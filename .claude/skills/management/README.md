# Management スキル

プロジェクトの計画・分析・戦略策定に使うスキル群。

## スキル一覧

| スキル | 用途 | 頻度 |
|---|---|---|
| `/weekly-plan` | 週次計画を生成 | 毎週月曜 |
| `/weekly-review` | 週次レビューを生成 | 毎週日曜〜月曜 |
| `/critical-review` | 設計書・計画書に対する批判的レビュー | 随時 |
| `/knowledge` | 過去の失敗と学びを参照・追記 | バグ解決時 |
| `/growth-loops` | 成長ループ（フライホイール）の設計・評価 | 四半期ごと |
| `/monetization-strategy` | 収益化戦略のブレインストーム | 四半期ごと |
| `/north-star-metric` | North Star Metric と Input Metrics の定義 | 初回 + 見直し時 |

## 推奨ワークフロー

### 初回セットアップ（プロジェクト立ち上げ・方針転換時）

```
1. /north-star-metric     ← 最重要指標を決める
2. /growth-loops           ← 指標を伸ばす成長メカニズムを設計
3. /monetization-strategy  ← 収益化手段を検討
```

この順序が重要。NSM が定まらないと成長ループの優先度が決まらず、成長の見通しがないと収益化の議論が空転する。

### 週次運用（毎週のルーティン）

```
日曜〜月曜:
1. /weekly-review   ← 今週の実績を振り返る
2. /weekly-plan     ← 来週の計画を立てる（レビュー結果を自動参照）
```

`/weekly-plan` は NSM と Input Metrics を現状サマリーに含める設計になっている。`/north-star-metric` の出力を活用。

### 随時実行

```
設計判断の検証:  /critical-review <対象ファイル>
バグ解決の記録:  /knowledge
```

## 各スキルの詳細

### `/north-star-metric`

**目的**: stats47 が追うべき唯一の最重要指標を決める。

**入力**: プロジェクトのコンテキスト（自動収集）+ 任意の方針

```
/north-star-metric              ← デフォルト（バランス型）
/north-star-metric 収益重視      ← 収益成長を優先する場合
/north-star-metric 成長重視      ← ユーザー成長を優先する場合
```

**出力**:
- ビジネスゲームの分類（Attention / Transaction / Productivity）
- NSM の定義 + 7基準チェック
- 3-5 の Input Metrics（NSM を駆動する先行指標）
- メトリクスツリー
- 計測方法と `/weekly-plan` への統合提案

**保存先**: GitHub Issue（`critical-review` ラベル、タイトル `[Critical Review] North Star Metric`）

### `/growth-loops`

**目的**: NSM を伸ばすための持続的成長メカニズムを設計する。

**入力**: プロジェクトのコンテキスト（自動収集）+ 任意のフォーカス

```
/growth-loops              ← 全5ループを評価
/growth-loops viral        ← バイラルループに絞って深掘り
/growth-loops seo          ← SEOループに絞って深掘り
```

**評価する5ループ**:
1. コンテンツ SEO ループ（記事 → 検索流入 → 被リンク → 順位上昇）
2. SNS バイラルループ（投稿 → シェア → 新規流入 → 自発シェア）
3. UGC ループ（ユーザーがデータ引用 → 被リンク → SEO）
4. データ引用ループ（CSV/チャート提供 → メディア利用 → 権威性）
5. クロスプラットフォームループ（YouTube → IG → X → サイト）

**出力**:
- 各ループの適合度・成熟度・コスト・速度・複利効果の評価
- 推奨実装順序
- 30-60-90日ロードマップ
- 計測指標

**保存先**: GitHub Issue（`critical-review` ラベル、タイトル `[Critical Review] Growth Loops`）

### `/monetization-strategy`

**目的**: 収益化手段を 3-5 案ブレインストームし、検証実験を設計する。

**入力**: プロジェクトのコンテキスト（自動収集）+ 任意の制約

```
/monetization-strategy              ← 制約なし
/monetization-strategy 月5万円目標   ← 収益目標を指定
/monetization-strategy affiliate-only ← アフィリエイトに限定
/monetization-strategy no-ads        ← 広告なしの前提
```

**検討するカテゴリ**: 広告、アフィリエイト、データ販売、スポンサー、コンテンツ課金、ライセンス、コンサル

**出力**:
- 各戦略の仕組み・収益レンジ・実装コスト・UX影響・リスク
- 優先度マトリクス
- 低コスト検証実験の設計
- 実装ロードマップ

**保存先**: GitHub Issue（`critical-review` ラベル、タイトル `[Critical Review] Monetization Strategy`）

### `/weekly-plan`, `/weekly-review`

週次の PDCA サイクル。詳細は各 SKILL.md を参照。

- `/weekly-review`: 4つのサブエージェントで実績データを並列収集し、計画との差分を分析
- `/weekly-plan`: 4つのサブエージェントでコンテキスト収集 → 戦略分析 → セルフ批判レビュー → 計画出力

**保存先**: GitHub Issue（`weekly-review` / `weekly-plan` ラベル、タイトル `[Weekly Review] YYYY-Www` / `[Weekly Plan] YYYY-Www`）

### `/critical-review`

設計書・計画書に対して連続起業家・プロ PM 視点で批判的レビューを実施。

```
/critical-review <対象>  # GitHub Issue 番号 / スキル名 / PR 番号 等
```

**保存先**: GitHub Issue（`critical-review` ラベル、タイトル `[Critical Review] {対象名}`）

### `/knowledge`

過去の失敗と学びを記録・参照。バグ解決時に実行して再発防止する。

```
/knowledge                ← 既存の知見を参照
/knowledge add            ← 新しい知見を追記
```

**保存先**: `.claude/skills/management/knowledge/` 内

## 出力先の Issue ラベル早見表

Management 系スキルの出力はすべて GitHub Issues に統一されている。過去分は `gh issue list --label <ラベル> --state all` で参照できる。

| スキル | 出力タイトル | ラベル |
|---|---|---|
| `/weekly-plan` | `[Weekly Plan] YYYY-Www` | `weekly-plan` |
| `/weekly-review` | `[Weekly Review] YYYY-Www` | `weekly-review` |
| `/critical-review` | `[Critical Review] {対象名}` | `critical-review` |
| `/north-star-metric` | `[Critical Review] North Star Metric` | `critical-review` |
| `/growth-loops` | `[Critical Review] Growth Loops` | `critical-review` |
| `/monetization-strategy` | `[Critical Review] Monetization Strategy` | `critical-review` |
| `/pre-mortem` | `[Pre-Mortem] YYYY-MM` | `pre-mortem` |
| `/performance-report` | `[Performance Report] YYYY-MM-DD` | `performance-report` |
