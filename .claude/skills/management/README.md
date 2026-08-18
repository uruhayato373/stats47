# Management スキル

プロジェクトの計画・分析・戦略策定に使うスキル群。

## スキル一覧

| スキル | 用途 | 頻度 |
|---|---|---|
| `/monthly-plan` | 月次計画を生成（今月の重点1-2テーマに絞る・予算配分） | 毎月初 |
| `/weekly-plan` | 週次計画を生成（月次の重点を分割消化） | 毎週月曜 |
| `/weekly-review` | 週次レビューを生成 | 毎週日曜〜月曜 |
| `/maintain-docs` | 文書の作成・統合・削除と陳腐化をSSOT・機械ガードで棚卸し | 文書変更時 + 週次alert時 |
| `/critical-review` | 設計書・計画書に対する批判的レビュー | 随時 |
| `/knowledge` | 過去の失敗と学びを参照・追記 | バグ解決時 |
| `/growth-loops` | 成長ループ（フライホイール）の設計・評価 | 四半期ごと |
| `/monetization-strategy` | 収益化戦略のブレインストーム | 四半期ごと |
| `/north-star-metric` | North Star Metric と Input Metrics の定義 | 初回 + 見直し時 |
| `/expand-rankings` | SSDS ランキング拡充ループ（計測ゲート付き需要ファースト・旧 expand-indicators 再構築） | 公開→計測→深掘りの反復 |

## 推奨ワークフロー

### 初回セットアップ（プロジェクト立ち上げ・方針転換時）

```
1. /north-star-metric     ← 最重要指標を決める
2. /growth-loops           ← 指標を伸ばす成長メカニズムを設計
3. /monetization-strategy  ← 収益化手段を検討
```

この順序が重要。NSM が定まらないと成長ループの優先度が決まらず、成長の見通しがないと収益化の議論が空転する。

### 月次運用（毎月初）

```
月初:
/monthly-plan   ← 今月どこに張るかを決める。週次レビュー4本＋3バックログを集約し、
                  Pro 予算を制約に「今月の重点1-2テーマ」へ絞る。週次がこれを分割消化する。
```

`/monthly-plan` は週次の重い収集を再実行せず、週次レビューと各バックログを**集約**する軽量設計（月1回でも予算を圧迫しない）。月末の振り返りは翌月の `/monthly-plan` の「前月の振り返り」で吸収する。

### 週次運用（毎週のルーティン）

```
日曜〜月曜:
1. /weekly-review   ← 今週の実績を振り返る
2. /weekly-plan     ← 来週の計画を立てる（レビュー結果＋今月の重点テーマを自動参照）
```

`/weekly-plan` は NSM と Input Metrics を現状サマリーに含める設計になっている。`/north-star-metric` の出力を活用。

### 随時実行

```
設計判断の検証:  /critical-review <対象ファイル>
バグ解決の記録:  /knowledge
文書の作成・整理:  /maintain-docs
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

**保存先**: 定義は `docs/00_プロジェクト管理/02_収益化戦略.md`、未完了策は `.claude/todo/04_改善バックログ.md`

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

**保存先**: 採択内容は既存戦略、未完了実験は `.claude/todo/04_改善バックログ.md`

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

**保存先**: 決定事項は `docs/00_プロジェクト管理/02_収益化戦略.md`、未完了策は `.claude/todo/`

### `/weekly-plan`, `/weekly-review`

週次の PDCA サイクル。詳細は各 SKILL.md を参照。

- `/weekly-review`: 5観点のsnapshot / scriptを同一セッションで並列収集し、計画との差分を分析
- `/weekly-plan`: 5観点の決定的データ収集 → 戦略分析 → 批判的レビュー → 計画出力

**保存先**: 計画は `.claude/todo/03_今週の計画.md`（毎週上書き）、レビューは `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md`（agent用履歴）

### `/critical-review`

設計書・計画書に対して連続起業家・プロ PM 視点で批判的レビューを実施。

```
/critical-review <対象>  # ファイルパス / スキル名 / PR 番号 等
```

**保存先**: 恒久判断は対象SSOT、未完了策は `.claude/todo/`

### `/knowledge`

過去の失敗と学びを記録・参照。バグ解決時に実行して再発防止する。

```
/knowledge                ← 既存の知見を参照
/knowledge add            ← 新しい知見を追記
```

**保存先**: `.claude/skills/management/knowledge/` 内

### `/maintain-docs`

文書の新規作成より既存SSOTへの統合を優先し、固定構成、frontmatter、TODO ID、
鮮度、INDEX、リンクを検査する。

```bash
/maintain-docs
npm run docs:fix
npm run docs:check
```

判断規則は`.claude/rules/docs-vs-issues.md`、機械契約は
`.claude/config/docs-governance.json`。自動修正は生成管理された実装計画INDEXだけに限定する。

## 出力先早見表

現在計画は `.claude/todo/`、戦略判断は既存SSOT、agent用履歴はskill referenceへ分離する。

| スキル | 出力先 | frontmatter type |
|---|---|---|
| `/monthly-plan` | `.claude/todo/02_今月の重点.md` | `monthly-plan` |
| `/weekly-plan` | `.claude/todo/03_今週の計画.md` | `weekly-plan` |
| `/weekly-review` | `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` | `weekly-review` |
| `/critical-review` | 対象SSOT + `.claude/todo/` | 全文はセッション出力 |
| `/north-star-metric` | `02_収益化戦略.md` + 改善バックログ | 週次値はsnapshot |
| `/growth-loops` | 戦略SSOT + 改善バックログ | 全文はセッション出力 |
| `/monetization-strategy` | `02_収益化戦略.md` + `.claude/todo/` | 全文はセッション出力 |
| `/pre-mortem` | `.claude/todo/` | 採択した未完了策のみ |
| `/performance-report` | PSI state + improvement log + 改善バックログ | 定期値とTODOを分離 |
