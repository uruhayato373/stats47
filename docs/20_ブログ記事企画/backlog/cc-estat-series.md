---
type: blog-plan
category: cross-cutting
content_type: blog-ai-stat
plan_count: 20
created: 2026-05-16
updated: 2026-05-16
status: writing
tags: [content-plan, ai-stat, claude, e-stat, series]
series: cc-estat
---

# Claude Code × e-Stat API 実例集（全20本）

## 概要

Claude Code 未経験のエンジニアを対象に「e-Stat API からデータを取得して可視化する」というニーズに 1 テーマ = 1 チャートの実例で答える連載企画。Part 1（環境構築）から順に進めれば、20 本目で Next.js + Cloudflare Pages へのデプロイまで完了する階段構造。

## 想定読者

- Claude Code 未経験のソフトウェアエンジニア（Node/Python のいずれかは書ける）
- 公開データを使った副業ブログ / 個人プロダクト構築に興味がある層
- 「AI に統計データを取らせて可視化」を最短で再現したい層

## 企画一覧

| # | slug | 想定タイトル | チャート種 | Claude Code 論点 | カテゴリ | 優先 |
|---|---|---|---|---|---|---|
| 1 | cc-estat-01-setup | はじめての Claude Code × e-Stat\| 環境構築と API キー取得 | （セットアップ） | インストール / appId / .env | ict | S |
| 2 | cc-estat-02-search-skill | スキル化する `/search-estat`\| 統計表 ID を AI に探させる | （検索ログ） | Skill 定義 / slash command | ict | S |
| 3 | cc-estat-03-population-bar | 都道府県別人口ランキングを Claude Code で1分で作る | バーチャート | fetch → 整形 → D3 | population | S |
| 4 | cc-estat-04-aging-heatmap | 高齢化率を47県ヒートマップに\| 配色を AI に決めさせる | ヒートマップ | カラースケール / d3-scale-chromatic | population | S |
| 5 | cc-estat-05-medical-cost-choropleth | 都道府県別医療費のコロプレス地図\| TopoJSON を AI に整形させる | コロプレス | TopoJSON / d3-geo | socialsecurity | S |
| 6 | cc-estat-06-income-scatter | 県民所得と教育費の散布図\| 相関係数まで一気通貫 | 散布図 | 多次元データ結合 | economy | S |
| 7 | cc-estat-07-birthrate-line | 出生率の時系列推移を 47 本ライン\| 年度範囲フィルタの罠 | ライン | cdTimeFrom 使わない理由 | population | A |
| 8 | cc-estat-08-bar-chart-race | 製造品出荷額 30 年の Bar Chart Race を Remotion で出す | Bar Chart Race | Remotion / 動画書き出し | miningindustry | A |
| 9 | cc-estat-09-radar-prefecture | 1つの県をレーダーチャートで多角的に\| 複数指標の正規化 | レーダー | 正規化 (min-max) | cross-cutting | A |
| 10 | cc-estat-10-wage-box-plot | 賃金の都道府県格差をボックスプロット\| 外れ値ハイライト | ボックス | 統計量計算 | laborwage | A |
| 11 | cc-estat-11-tourism-stacked | 観光客数の積み上げ棒\| 国内 / 訪日を一枚に | 積み上げ棒 | 多系列処理 | tourism | A |
| 12 | cc-estat-12-housing-treemap | 都道府県別住宅着工をツリーマップ\| 階層データ整形 | ツリーマップ | hierarchy / sum | construction | A |
| 13 | cc-estat-13-agri-sankey | 農業産出額の流れをサンキー\| 分類軸を AI に提案させる | サンキー | d3-sankey | agriculture | A |
| 14 | cc-estat-14-energy-area-chart | 電力消費の積み上げ面\| stack 系列の順序を会話で決める | エリアチャート | d3-stack | energy | A |
| 15 | cc-estat-15-crime-small-multiple | 犯罪発生率の Small Multiple\| 47枚を一括生成 | Small Multiple | loop / map レイアウト | safetyenvironment | B |
| 16 | cc-estat-16-commerce-bubble | 商業販売額バブルチャート\| 人口で重み付け | バブル | 多変量可視化 | commercial | B |
| 17 | cc-estat-17-edu-slope-graph | 学力テストの順位変化を Slope Graph\| 順位データ整形 | Slope Graph | 順位データ整形 | educationsports | B |
| 18 | cc-estat-18-cache-r2 | チャートデータを R2 にキャッシュ\| JSON 分割と命名規約 | （アーキ図） | Cloudflare R2 / キー設計 | ict | B |
| 19 | cc-estat-19-skill-pipeline | 20本の図を毎週自動更新\| Skill チェーンと GitHub Actions | （ワークフロー図） | スキル合成 / cron | ict | B |
| 20 | cc-estat-20-publish | 完成したチャートを Next.js + Cloudflare Pages で公開 | （デプロイ図） | App Router / OG 画像 | ict | B |

## 共通仕様

- frontmatter: 既存 `ai-claude-code-pref-analysis/article.md` のスキーマに準拠
- 本文長: 5,000 字以上 / 300 行以上
- 必須コードブロック: bash（セットアップ）、Claude Code 自然言語プロンプト、JS or Python 実装、JSON or YAML（設定）
- `<chart-placeholder>` を最低 1 つ含める（実例集として）
- 末尾に「関連ランキング・記事」セクション

## 関連

- 既存記事: `ai-claude-code-pref-analysis`（公務員向け 7 ステップ）
- 既存記事: `koumuin-claude-code-estat-automation`（公務員向け運用フロー）
- マスター INDEX: `docs/00_プロジェクト管理/05_コンテンツ企画マスター.md`
