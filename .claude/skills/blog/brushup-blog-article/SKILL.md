---
name: brushup-blog-article
description: ブログ記事を nlm cross query（白書ノートブック）+ D1 統計データで部分補強する。全文書き直しなし・部分パッチのみ。Use when user says "ブログをブラッシュアップ", "記事を補強", "brushup", "/brushup-blog-article".
argument-hint: "<slug> [--focus エキスパート視点追加|最新データ更新|CTA強化]"
---

# /brushup-blog-article — ブログ記事部分補強

`nlm cross query`（白書ノートブック）と D1 統計データを使い、ブログ記事を **1-2 セクション単位**で部分補強する。全文書き直しは禁止。

## 引数

```
/brushup-blog-article <slug> [--focus <観点>]
```

| 引数 | 説明 |
|---|---|
| `slug` | 記事スラグ（例: `household-income-tokyo-okinawa`） |
| `--focus` | 補強の観点（省略時は自動判断）。選択肢: `エキスパート視点追加` / `最新データ更新` / `CTA強化` |

## 前提条件

```bash
nlm --version  # 0.6.5 以上（/Users/minamidaisuke/.local/bin/nlm）
```

## ノートブック × テーマ マッピング

記事スラグのキーワードから適切なノートブックを自動選択する:

| キーワード例 | 使用ノートブック |
|---|---|
| income, wage, salary, tax, fiscal, gdp | 経済財政白書 |
| medical, hospital, nurse, care, nursing, birth, fertility, child, suicide | 厚生労働白書 |
| road, infrastructure, port, housing, construction, traffic | 国土交通白書 |
| energy, electricity, solar, renewable, carbon | エネルギー白書,第６次エネルギー基本計画 |
| environment, recycling, waste, pollution, climate | 環境白書 |
| ict, telework, digital, smartphone, internet | 情報通信白書 |
| traffic-accident, transport, logistics, travel | 交通政策白書 |
| manufacturing, industry, productivity, factory | ものづくり白書 |
| small-business, entrepreneur, startup | 中小企業白書 |
| child, education, school, kindergarten, childcare, fertility | こども白書 |
| population, aging, migration, solo-living | 経済財政白書,厚生労働白書 |

複数ノートブックを `--notebooks "白書A,白書B"` でカンマ結合して渡す。

## 実行フロー

### Step 1: 記事読み込みと改善点特定

1. `.local/r2/app/blog/<slug>/article.md` を Read
2. 現在の記事を見て「何が不足しているか」を判断:
   - **エキスパート視点なし** → 白書引用・政策的背景が薄い
   - **最新データなし** → `publishedAt` が 12 ヶ月以上前、最新年度データに更新余地あり
   - **CTA 弱い** → 記事末尾の関連リンク・ランキングページへの誘導が貧弱
3. スラグからノートブック候補を選択（マッピング表参照）

### Step 2: D1 から統計データ抽出（sqlite MCP）

記事テーマに関連する指標を D1 から抽出:

```sql
SELECT i.name, i.slug AS indicator_slug, o.area_code, o.year_code, o.value
FROM indicators i
JOIN observations o ON o.indicator_id = i.id
WHERE i.name LIKE '%<テーマキーワード>%'
ORDER BY o.year_code DESC, o.value DESC
LIMIT 50;
```

最新年度・都道府県別ランキングの上位/下位 5 件を整理する。

### Step 3: nlm cross query で白書調査

```bash
nlm cross query --notebooks "<ノートブック名>" \
  "「<記事テーマ>」について、背景・政策的意義・最新トレンド・都道府県間格差の要因を教えてください。引用根拠付きで回答してください。"
```

クエリ結果を以下の形式で整理:

```
=== nlm findings: <slug> ===
[背景・政策]  ...
[最新データ] ...
[専門的観点] ...
[引用元]     <ノートブック名> より
```

### Step 4: 差分のみ article.md に反映

**原則: 全文書き直し禁止。編集は 1-2 セクションのみ。**

| focus | 反映先 | 内容 |
|---|---|---|
| エキスパート視点追加 | 各 H2 の散文導入 or 考察セクション | 白書引用・政策背景・専門的解説を 2-3 文追加 |
| 最新データ更新 | データ説明部分 | D1 から取得した最新年度値に差し替え |
| CTA 強化 | 記事末尾 | 関連ランキングページへの `<site-link>` を追加 |

Edit ツールで最小限の変更を適用する。

### Step 5: 完了レポート

```
=== /brushup-blog-article: <slug> 完了 ===
参照ノートブック: <名前>
D1 クエリ結果: <件数> 件
補強したセクション: <H2 名>
変更内容: <1-2 行で要約>
```

## 参照

- 優先度キュー: `docs/20_ブログ記事企画/brushup-queue.md`（`/brushup-blog-priority` で生成）
- 品質確認: `/proofread-article` で最終チェック
- nlm ヘルプ: `nlm cross --help`
