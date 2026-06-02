---
type: tech-design
status: active
date: 2026-05-27
tags: [architecture, area, theme, page-components, information-architecture]
---

# area / theme / category / ranking 責務分離

stats47 の 4 つの「データ表示ページ系統」 (`/areas/[code]`, `/themes/[slug]`, `/category/[key]`, `/ranking/[key]`) の責務を厳格に分離し、`page_components` テーブルの配置ルールを定義する。

## 背景

2026-05-27、`/areas/17000` (石川県) に「人口移動フロー」が表示されていたが、これは**主題**（人口動態）の深掘り可視化であって**県軸**の特徴ではなかった。同様に、`page_components` テーブルの `pageType="area"` 配下に「全国横断視点が必要な可視化」が紛れ込んでいる可能性があり、area / theme の責務が曖昧化していた。

本ドキュメントは責務分離の判定基準を定め、page_components 配置の根拠とする。

## 4 ページ系統の責務マトリクス

| ページ | 軸 | ユーザー意図 | 主な要素 |
|---|---|---|---|
| `/areas/[code]` | **県軸 (行)** | 「この県の特徴を知りたい」 | 強み/弱み、県固有の時系列推移、カテゴリ別 top3、カテゴリ/ランキング/テーマへの導線 |
| `/themes/[slug]` | **指標軸 (列) ×横断可視化** | 「この主題で 47 県を比べたい」 | indicator set (10〜15 指標) の地図/コロプレス、横並びダッシュボード、移動フロー・ピラミッド等の主題深掘り可視化 |
| `/category/[key]` | **カテゴリ内一覧** | 「このカテゴリにどんなランキングがあるか」 | ランキング一覧、簡易ナビ |
| `/ranking/[key]` | **個別指標深掘り** | 「この指標の詳細を知りたい」 | 47 県順位、地図、時系列、AI コンテンツ、関連指標 |

### 関係性

```
[県軸] /areas/[code]       ─┐
                            │  どちらも同じデータマトリクスを別軸で切る
[指標軸] /themes/[slug]    ─┘
        │
        ↓ 深掘り
[個別指標] /ranking/[key]
        ↑
[カテゴリ一覧] /category/[key] (ハブ)
```

## page_components 配置の判定基準

`page_components` テーブルの `pageType` カラムに何を入れるかの判断軸。**1 つのチャートを複数 pageType に配置するのは可** (page_type + page_key + component_key で一意)。ただし**意味的に正しい pageType だけに配置すること**。

### pageType = "theme" に配置するもの

**判定軸**: 「47 県を横並びで見せる」「主題内の複数指標を関連付ける」「単一指標でも全国構造を可視化する」可視化。

- ✅ **地図/コロプレス** (47 県塗り分け)
- ✅ **移動フロー** (全国の人の流れ)
- ✅ **人口ピラミッド** (年齢構成の全国比較)
- ✅ **散布図** (2 指標の相関、47 県プロット)
- ✅ **主題ダッシュボードのタブ別チャート群** (例: 人口動態の「出生・死亡」タブ)
- ✅ **テーマ KPI タイル** (主題内の代表指標サマリ)

### pageType = "area" に配置するもの

**判定軸**: 「**この県だけ**の時系列・構成・固有ストーリー」を語る可視化。県を変えれば中身が変わるが、構造（チャートの読み方）は同じ。

- ✅ **県固有の時系列推移** (例: 「東京の人口の年次推移」)
- ✅ **県の年齢構成円グラフ** (その県の age composition)
- ✅ **県の産業構成** (その県の industry mix)
- ✅ **県内の市区町村ランキング** (intra-prefecture top/bottom)
- ❌ 47 県を比較する地図 → theme へ
- ❌ 主題全体の可視化 (移動フロー等) → theme へ
- ❌ 全国平均との対比だけのチャート → ranking へ（個別指標として）

### pageType = "area-category" / "city-category" に配置するもの

**判定軸**: その県/市区町村の「特定カテゴリ内」の指標を **複数まとめて見せる**ダッシュボード。

- ✅ カテゴリ内 KPI タイル群
- ✅ カテゴリ内チャート群（時系列・構成）
- ✅ 市区町村専用は `city-category` (statsDataId が異なる)

### pageType = "ranking" に配置するもの

**判定軸**: 個別ランキングページ内のサブチャート (主指標以外の補助可視化)。

- ✅ 関連指標の時系列
- ✅ 全国分布ヒストグラム
- ✅ ランキング詳細ページ専用カード

## 設計原則

### 1. 「重い横断可視化は theme へ」

`MigrationFlowPlayer`、地図コロプレス、47 県散布図のような**全国を一度に処理する重いコンポーネント**は theme に集約する。理由:

- area ページは 47 回 SSG されるため、重い可視化を含めると build 時間・bundle サイズが 47 倍効く
- 同じ可視化が 47 ページに重複する SEO 上の cannibalization リスク
- 主題の文脈で見せる方が認知負荷が低い (「人口動態」の文脈で移動フローを見る方が、「石川県」の文脈で見るより主題理解に直結)

### 2. 「area は県の自己紹介ハブ」

area ページの本質は **県固有のストーリーと、深掘り先への導線**。具体的には:

- ヒーロー (県名・強み・弱み)
- カテゴリ別 top 指標 (highlight)
- 県固有の時系列 (人口推移、産業推移)
- カテゴリ/ランキング/テーマへの導線

「47 県横並びで見る」用途は theme に委譲し、area からは theme へリンクする。

### 3. 「area の thin content 化を避ける」

「area は導線だけ」まで削ると県名 SEO (例: "石川県 統計") の着地が薄くなる。**県固有の時系列推移** (page_components の中で `pageType="area"` 由来のもの) は area の差別化要素として残す。

### 4. 「page_components の重複は許容、ただし意味的に正しい pageType のみ」

同じ component_key を `(pageType="theme", pageKey="population-dynamics")` と `(pageType="area-category", pageKey="population")` の両方に登録するのは OK。ただし「主題深掘り可視化を pageType=`area` に登録する」のは禁止 (本ドキュメントの判定基準違反)。

## 今回の対応 (2026-05-27)

### 確認された違反

| 配置 | コンポーネント | 判定 | 対応 |
|---|---|---|---|
| `/areas/[code]` (page.tsx 直書き) | `AreaMigrationFlowSection` (人口移動フロー) | 主題深掘り → theme へ | `/themes/population-dynamics` の `ThemePageLayout` に移管 |

### 棚卸し対象

`page_components` テーブルの `pageType="area"` 配下に「主題深掘り可視化」が含まれていないかの全件確認は、`.claude/scripts/audit/page-components-audit.cjs` で実行する。結果は `docs/04_レビュー/area-theme-audit/YYYY-MM-DD.md` に記録。

## 関連

- `docs/01_技術設計/20_ページタイプ×ファネル役割マップ.md` — 本ドキュメントのデータ軸責務に「ファネル役割 (集客面/回遊面) と評価 KPI」を重ねたマップ
- `.claude/design-system/page-components.md` — page_components の実装ガイド (本ドキュメントの判定基準を補完)
- `.claude/scripts/audit/page-components-audit.cjs` — pageType 別配置の棚卸しスクリプト
- `docs/04_レビュー/area-theme-audit/` — 棚卸し結果ログ
