# 引用RT テーマローテーション

`find-quote-rt` スキルでテーマが未指定の場合に参照する静的ドキュメント。
ローテ順・テーマ定義・選定ロジックを定める。**動的な状態（直近使用テーマ等）は一切保持しない** — 単一ソースは `sns_posts` テーブル。

## 設計原則

- **静的定義のみ**: ローテ順・検索キーワード・category_key マッピング
- **ランタイム状態は sns_posts に集約**: 直近の quote_rt から `content_key → ranking_items.category_key` を JOIN で取得し、次テーマを決定
- **ファイル⇄DB の乖離リスクゼロ**: ここには「いつ・何を投稿したか」は書かない

## テーマ定義

| # | テーマ | category_key | 検索キーワード候補 | 備考 |
|---|---|---|---|---|
| 1 | 人口 | `population` | 少子化, 出生率, 人口減少, 高齢化, 過疎 | 社会的関心度が高い |
| 2 | 年収 | `laborwage` | 年収, 給料, 給与, 賃金, 最低賃金 | stats47 主力データ |
| 3 | 物価 | `economy` | 物価, 家賃, 地価, 不動産, 生活費 | 地域差が明確 |
| 4 | 治安 | `safetyenvironment` | 治安, 犯罪, 交通事故, 詐欺 | センシティブ配慮必要 |
| 5 | 医療 | `socialsecurity` | 医療, 医師不足, 病院, 看護師 | 医療費・介護含む |
| 6 | 教育 | `educationsports` | 教育, 大学, 学歴, 偏差値, 進学率 | 地域格差の定番 |
| 7 | 観光 | `tourism` | 観光, 旅行, インバウンド, 宿泊 | ポジティブ文脈で伸びやすい |
| 8 | 農業 | `agriculture` | 農業, 農家, 米, 農産物 | 地方活性化と絡める |

## ローテ順（固定ラウンドロビン）

```
人口 → 年収 → 物価 → 治安 → 医療 → 教育 → 観光 → 農業 → (repeat)
```

**Phase 1（導入〜2週間）**: 上記の固定ローテ。反応ベースラインを取得する。
**Phase 2（3週目以降）**: メトリクス実績に応じて重み付け選定に切替予定（要別途スキル改修）。

## 次テーマの自動選定ロジック

テーマ未指定で `/find-quote-rt` が実行された場合、以下の手順で次テーマを決定する。

### Step 1: 直近 quote_rt の category_key を取得

```sql
SELECT ri.category_key, sp.posted_at
FROM sns_posts sp
LEFT JOIN ranking_items ri ON ri.ranking_key = sp.content_key
WHERE sp.post_type = 'quote_rt'
  AND sp.platform = 'x'
ORDER BY sp.posted_at DESC
LIMIT 3;
```

ローカル D1 パスで実行:
```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite "..."
```

### Step 2: ローテ順から次テーマを選定

1. 直近3件の `category_key` を「直近使用テーマ」として取得
2. ローテ順のテーマ一覧を先頭から走査し、**直近使用テーマに含まれない最初のテーマ**を選択
3. 全テーマが直近3件に含まれる場合（理論上ありえないが）、最古のテーマから採用

**例**: 直近3件が `laborwage, laborwage, economy` → 先頭の `population`(人口) を選定。

### Step 3: 最低間隔ルール

- **同一テーマは直近3件に含まれていれば選ばない**（= 最低3投稿空ける）
- **同一 content_key（ranking_key）は7日間空ける**: 同じランキングを短期間で使い回さない
  ```sql
  SELECT content_key FROM sns_posts
  WHERE post_type='quote_rt' AND posted_at > datetime('now','-7 days');
  ```
  候補マッチング（Phase 4）で返された ranking_key のうち、この結果に含まれるものは除外する。

## 運用メモ

- ローテ順を変更したい場合はこのファイルの「ローテ順」セクションのみ編集する
- テーマを追加する場合は「テーマ定義」表と「ローテ順」の両方に追記する
- 反応分析は `sns_metrics` と `sns_posts.impressions/likes/reposts` を category_key で集計して評価する（`/sns-weekly-report` が対応予定）
