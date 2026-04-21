---
name: review-ui-consistency
description: ページ横断の UI 一貫性を検証し不統一を検出する。Use when user says "UI一貫性レビュー", "review-ui-consistency", "見た目がバラバラ". 7人の専門家パネルで多角評価.
disable-model-invocation: true
argument-hint: "[scope] (all | category-name | route-path)"
---

ページ横断で UI 実装の一貫性を検証し、「技術的に動くが見た目がバラバラ」な問題を検出する。

> **個別ページの深掘りは `/ui-panel-review` に委任する。** このスキルは「ページ間の不統一」に特化する。

## 用途

- コンポーネントや feature を追加した後、既存 UI との整合性を確認したいとき
- 「なんとなくページごとに雰囲気が違う」と感じたとき
- デザインシステムの準拠度を定期的に監査したいとき

## 引数

```
$ARGUMENTS — レビュースコープ（以下のいずれか）
  - "all":          全ページ横断レビュー（最も網羅的、時間がかかる）
  - カテゴリ名:     "ranking" → ランキング関連ページ群をレビュー
  - ルートパス:     "/areas" → areas 配下のページ群をレビュー
  - 省略時:         "all" として実行
```

## 手順

### Phase 1: 自動スキャン

コードベースを Grep/Glob で走査し、不統一の候補を機械的に検出する。

**1a. コンポーネント利用の統一性**

CLAUDE.md 規約: 「`@stats47/components` の shadcn ベースコンポーネントを優先使用する」

以下の素 HTML 要素が `apps/web/src/` 内で使われている箇所を検出:

```bash
# 素 HTML 要素の使用箇所（shadcn 代替があるもの）
grep -rn '<table[ >]' apps/web/src/ --include='*.tsx' | grep -v 'node_modules'
grep -rn '<button[ >]' apps/web/src/ --include='*.tsx' | grep -v 'node_modules'
grep -rn '<select[ >]' apps/web/src/ --include='*.tsx' | grep -v 'node_modules'
grep -rn '<input[ >]' apps/web/src/ --include='*.tsx' | grep -v 'node_modules'
```

`packages/components/src/` に該当コンポーネントがあるか照合する。

**1b. アイコン実装方式の分類**

```bash
# lucide-react の直接 import
grep -rn "from 'lucide-react'" apps/web/src/ --include='*.tsx'
grep -rn 'from "lucide-react"' apps/web/src/ --include='*.tsx'

# SVG ファイル参照（<img src="*.svg">）
grep -rn '<img.*\.svg' apps/web/src/ --include='*.tsx'

# インライン SVG（<svg ...>）
grep -rn '<svg[ >]' apps/web/src/ --include='*.tsx'

# getIcon() 経由
grep -rn 'getIcon' apps/web/src/ --include='*.tsx'
```

**1c. スタイルトークンの一貫性**

```bash
# 見出しサイズ（規約: h1 = text-2xl font-bold）
grep -rn 'text-3xl\|text-4xl\|text-5xl' apps/web/src/ --include='*.tsx'

# ハードコード色（Tailwind 変数を使うべき箇所）
grep -rn 'text-gray-\|text-slate-\|bg-gray-\|bg-slate-' apps/web/src/ --include='*.tsx' | head -30

# アイコンサイズの不統一
grep -rn 'h-[0-9] w-[0-9]\|size={' apps/web/src/ --include='*.tsx' | grep -i icon
```

**1d. レスポンシブ設計**

CLAUDE.md 規約: ページレイアウトは `lg:`、ダッシュボードカードは `@sm:/@md:/@lg:`

```bash
# コンテナクエリ vs ビューポートクエリの使用状況
grep -rn '@sm:\|@md:\|@lg:' apps/web/src/ --include='*.tsx' | wc -l
grep -rn ' md:\| lg:' apps/web/src/ --include='*.tsx' | wc -l
```

**1e. 状態パターン**

```bash
# ローディング表示のパターン
grep -rn 'Skeleton\|Loader2\|Loading\|spinner\|animate-spin' apps/web/src/ --include='*.tsx'

# エラー表示のパターン
grep -rn 'AlertCircle\|ErrorBoundary\|error-boundary\|error\.tsx' apps/web/src/ --include='*.tsx'

# 空状態のパターン
grep -rn 'データがありません\|データなし\|見つかりません\|No data\|empty' apps/web/src/ --include='*.tsx'
```

### Phase 2: パターン分析

Phase 1 の結果をページ種別ごとに整理する。

ページ種別:
- **ランキングページ** (`/ranking/[key]`)
- **ダッシュボードページ** (`/[category]/[subcategory]/dashboard/[areaCode]`)
- **地域ページ** (`/areas/[areaCode]`)
- **ブログページ** (`/blog/[slug]`)
- **トップページ** (`/`)
- **カテゴリページ** (`/[category]`)

各種別で以下を比較:
- ヘッダー構造（見出しサイズ、パンくず有無）
- カードレイアウト（影、角丸、パディング）
- アイコンの出典と配色
- レスポンシブ切り替えポイント
- ローディング/エラー/空状態の表示方法

**不統一の「ホットスポット」**（同じ種別内で実装が異なる箇所）を特定する。

### Phase 3: パネルレビュー

7人の専門家として、Phase 1-2 の結果を元にそれぞれ独立した視点で評価する。

パネリスト定義は [reference/panelists.md](reference/panelists.md) を参照。

### Phase 4: 出力

結果を以下のフォーマットで保存する。

## パネリスト定義

[reference/panelists.md](reference/panelists.md) に定義。

## 出力フォーマット

````
# UI 一貫性レビュー

スコープ: {all | カテゴリ名 | ルートパス}
スキャン日: YYYY-MM-DD
ページ種別数: N
検出した不統一: N 箇所

---

## Phase 1: 自動スキャン結果

### コンポーネント利用
- 素 HTML 要素の使用: N 箇所（うち shadcn 代替あり: M 箇所）
- 詳細: ...

### アイコン実装
- lucide-react: N 箇所
- SVG ファイル: N 箇所
- インライン SVG: N 箇所
- 混在ファイル: ...

### スタイルトークン
- 規約違反の見出しサイズ: N 箇所
- ハードコード色: N 箇所

### レスポンシブ設計
- コンテナクエリ使用: N 箇所
- ビューポートクエリ使用: N 箇所
- 規約違反の疑い: ...

### 状態パターン
- ローディング表示のバリエーション: N 種類
- エラー表示のバリエーション: N 種類
- 空状態表示のバリエーション: N 種類

---

## Phase 2: ページ種別別の不統一

### {ページ種別名}
- 不統一箇所: ...
- 比較対象ファイル: ...

---

## Phase 3: パネルレビュー

### 1. デザインシステム専門家
（2〜4文。語り口に沿って）

### 2. ビジュアル一貫性エンジニア
（2〜4文）

... （7人分）

---

## パネル総括

### P0: 壊れている（即修正）
- ...

### P1: 不統一（計画的に修正）
- ...（想定工数: S/M/L）

### P2: 改善推奨（余裕があれば）
- ...

### 良い点（維持すべきパターン）
- ...

### 次のアクション
- [ ] ...（工数: S）
- [ ] ...（工数: M）

### 個別ページの深掘りが必要な場合
→ `/ui-panel-review {URL}` を実行してください
````

## 注意

- **コードを実際に読んでからレビューする。推測でレビューしない**
- 全パネリストが同じ結論を出してはならない。意見の対立・矛盾を恐れない
- 褒めるだけのパネリストを作ってはならない。全員が最低 1 つ批判する
- CLAUDE.md の UI コンポーネント規約・レスポンシブ規約を基準とする
- 出力は GitHub Issue（`dev-review` ラベル、タイトル `[Dev Review] ui-consistency / YYYY-MM-DD`）として作成する:
  ```bash
  # 本文を /tmp/review-ui-consistency-body.md に書き出し後:
  gh issue create \
    --title "[Dev Review] ui-consistency / YYYY-MM-DD" \
    --label "dev-review" \
    --body-file /tmp/review-ui-consistency-body.md
  ```
- 作成した Issue の番号・URL を報告する。過去のレビューは `gh issue list --label dev-review --state all` で参照できる

## 関連スキル

- `/ui-panel-review` — 個別ページの UI/UX 詳細評価（本スキルから委任先）
- `/review-feature` — feature 内部のコード品質
- `/review-app` — App Router 層のSEO・ルーティング
- `/review-packages` — packages/ のコード品質
