---
name: discover-trends-gsc
description: Google Search Console の急上昇クエリを検出しコンテンツギャップからブログ記事候補を提案する。Use when user says "GSCトレンド", "検索トレンド", "サーチコンソールトレンド". 自サイトデータ起点のテーマ発見.
disable-model-invocation: true
---

Google Search Console の検索クエリから急上昇キーワードを検出し、stats47 のブログ記事候補を提案する。

## 用途

- stats47 への検索流入で急増しているキーワード（= ユーザーが実際に求めているテーマ）を発見したいとき
- 既存ページはないが検索されているキーワード（コンテンツギャップ）を特定したいとき
- 外部トレンド（Google Trends 等）ではなく、自サイトのデータに基づくテーマ発見

## 引数

```
$ARGUMENTS — [比較方式]
             比較方式: wow | mom（デフォルト: wow）
             wow: 前週比（直近7日 vs 前7日）
             mom: 前月比（直近28日 vs 前28日）
```

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルートに `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json` のいずれかが存在、gitignore 済み）
- サービスアカウント: `stats47-windows@stats47.iam.gserviceaccount.com`
- サイト: `https://stats47.jp/`（Search Console に登録済み）
- npm パッケージ: `googleapis`（インストール済み）

## 手順

### Phase 1: GSC データ取得

1. 2 期間分のクエリデータを取得する。GSC データは 2〜3 日遅延するため、endDate は 3 日前とする。

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const searchconsole = google.searchconsole({ version: 'v1', auth });
const SITE_URL = 'https://stats47.jp/';

async function fetchQueries(startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 500,
    },
  });
  return res.data.rows || [];
}
```

2. 期間の計算:

| 方式 | 今期 | 前期 |
|---|---|---|
| wow | 10日前〜3日前（7日間） | 17日前〜10日前（7日間） |
| mom | 31日前〜3日前（28日間） | 59日前〜31日前（28日間） |

```javascript
// wow の場合
const end = new Date(); end.setDate(end.getDate() - 3);
const currentStart = new Date(end); currentStart.setDate(currentStart.getDate() - 7);
const prevEnd = new Date(currentStart);
const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 7);
```

3. 今期・前期それぞれのクエリデータを取得。

### Phase 2: 急上昇検出

4. 今期と前期のデータを結合し、以下の指標を算出:

```javascript
// 各クエリについて
const growth = {
  query: row.keys[0],
  currentClicks: currentRow.clicks,
  prevClicks: prevRow?.clicks || 0,
  currentImpressions: currentRow.impressions,
  prevImpressions: prevRow?.impressions || 0,
  clickGrowth: prevRow ? (currentRow.clicks - prevRow.clicks) / prevRow.clicks : Infinity,
  impressionGrowth: prevRow ? (currentRow.impressions - prevRow.impressions) / prevRow.impressions : Infinity,
  isNew: !prevRow,  // 前期に存在しなかった新規クエリ
};
```

5. 急上昇の判定基準:

| 種別 | 条件 |
|---|---|
| **新規クエリ** | 前期にゼロで今期にクリック 3 以上 |
| **急上昇クエリ** | クリック増加率 100% 以上 かつ 今期クリック 5 以上 |
| **表示急増クエリ** | 表示回数増加率 200% 以上 かつ 今期表示 50 以上（まだクリックは少ないが需要あり） |

6. 各カテゴリに該当するクエリを抽出し、増加率で降順ソートする。

### Phase 3: フィルタリング・分類

7. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）で分類する。

8. **除外するクエリ**:
   - ブランドクエリ（`stats47`, `stats47.jp`）
   - 意味不明・タイポのクエリ
   - 単一都道府県名のみ（`東京`, `大阪` 等）

### Phase 4: DB マッチング

9. 急上昇クエリについて、ローカル D1 で関連データを検索:

**9a. ranking_tags でタグ検索:**

```sql
SELECT DISTINCT ri.ranking_key, ri.title, ri.unit, ri.latest_year, rt.tag
FROM ranking_tags rt
JOIN ranking_items ri ON rt.ranking_key = ri.ranking_key AND rt.area_type = ri.area_type
WHERE rt.tag LIKE '%{keyword}%'
  AND ri.area_type = 'prefecture'
ORDER BY ri.latest_year DESC;
```

**9b. ranking_items でタイトル検索:**

```sql
SELECT DISTINCT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
ORDER BY latest_year DESC;
```

**9c. estat_stats_tables で統計表カタログ検索:**

```sql
SELECT stats_data_id, title, gov_org, status, category_key
FROM estat_stats_tables
WHERE title LIKE '%{keyword}%'
ORDER BY status, title;
```

**9d. 既存ページ確認（クエリがどのページに流入しているか）:**

追加で page ディメンションも取得し、クエリの流入先ページを特定する:

```javascript
const pageRes = await searchconsole.searchanalytics.query({
  siteUrl: SITE_URL,
  requestBody: {
    startDate: currentStartStr,
    endDate: endStr,
    dimensions: ['query', 'page'],
    dimensionFilterGroups: [{
      filters: [{ dimension: 'query', operator: 'equals', expression: query }]
    }],
    rowLimit: 5,
  },
});
// → 流入先が /ranking/ のみ → ブログ記事を書けば追加流入が見込める
// → 流入先が /blog/ → 既存記事の改善・関連記事の追加
```

### Phase 5: 重複チェック

10. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

### Phase 6: 候補生成

11. 急上昇クエリを以下の形式でまとめる:

```
## 候補: {クエリ}（{種別}: 新規 / 急上昇 / 表示急増）

- **ソース**: Google Search Console（stats47.jp）
- **今期クリック**: {clicks}（前期比: +{growth}%）
- **今期表示**: {impressions}（前期比: +{growth}%）
- **現在の流入先**: {page_url}（なし = コンテンツギャップ）
- **分類カテゴリ**: {category_key}
- **マッチ度**: ★★★

### コンテンツギャップ分析

- 検索されているが適切なページがない → 新規記事の機会
- 既存ランキングページに流入 → ブログ記事で深掘りすれば追加流入

### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| ... | DB既存 | ... | |

### 記事の切り口（案）

1. {切り口1}
2. {切り口2}

### 次のアクション

- [ ] `/fetch-article-data` でデータ取得
- [ ] 記事執筆
```

### Phase 7: サマリー・保存

12. 全結果をまとめる:

```markdown
# GSC 急上昇クエリ × stats47 記事候補

> 調査日時: YYYY-MM-DD HH:MM
> 比較方式: {wow|mom}
> 今期: YYYY-MM-DD 〜 YYYY-MM-DD
> 前期: YYYY-MM-DD 〜 YYYY-MM-DD
> 急上昇クエリ: N件（新規: A件 / 急上昇: B件 / 表示急増: C件）

## 急上昇クエリ一覧

| # | クエリ | 種別 | 今期クリック | 前期比 | 今期表示 | 流入先 | カテゴリ |
|---|---|---|---|---|---|---|---|
| 1 | 最低賃金 都道府県 | 急上昇 | 25 | +400% | 800 | /ranking/... | laborwage |
| 2 | 出生率 ランキング | 新規 | 8 | 新規 | 150 | なし | population |

## コンテンツギャップ（流入先なし）

| クエリ | 今期表示 | 推奨アクション |
|---|---|---|
| ... | 200 | ブログ記事を新規作成 |

## 推奨アクション

1. **最優先**: {クエリ} — {理由}
```

13. `.claude/skills/blog/trends-snapshots/trends-gsc-YYYY-MM-DD.md` に保存する。

## 注意

- **GSC データは 2〜3 日遅延**: endDate を 3 日前に設定すること
- **自サイトデータの強み**: 外部トレンドと違い、「実際に stats47 を探して来ているユーザーの需要」が分かる
- **コンテンツギャップが最重要**: 検索されているのに適切なページがない = 確実に流入が見込める記事テーマ
- **少数クリックでも注目**: stats47 の規模では、クリック 5 以上の急上昇は有意

## 関連スキル

- `/fetch-gsc-data` — GSC 生データ取得（本スキルの元データ）
- `/discover-trends` — Google Trends 起点
- `/discover-trends-all` — 全ソース統合
