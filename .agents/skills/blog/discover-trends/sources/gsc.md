# Source: Google Search Console (自サイト需要)

stats47.jp に対する検索クエリの過去 7 日 / 28 日比較を取り、急上昇 / 新規 / 表示急増のクエリを抽出する。**自サイトに対する実需要**が起点なので、外部トレンドより「書けば確実に流入する」可能性が高い。

## 引数の追加サブオプション

`/discover-trends --source gsc [--compare wow|mom]`

- `wow`（既定）: 直近 7 日 vs 前 7 日
- `mom`: 直近 28 日 vs 前 28 日

## 前提

- サービスアカウント鍵: リポジトリルートに `stats47-*.json`（gitignore 済み）
  - 候補名: `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json`
- サイト: `https://stats47.jp/`（Search Console 登録済み）
- npm パッケージ: `googleapis`

## データ取得

### 期間計算（GSC は 2〜3 日遅延、endDate は 3 日前）

| 方式 | 今期 | 前期 |
|---|---|---|
| wow | 10日前〜3日前（7日間） | 17日前〜10日前（7日間） |
| mom | 31日前〜3日前（28日間） | 59日前〜31日前（28日間） |

### Search Console API 呼び出し

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
    requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 500 },
  });
  return res.data.rows || [];
}
```

### 急上昇判定

```javascript
const growth = {
  query: row.keys[0],
  currentClicks: currentRow.clicks,
  prevClicks: prevRow?.clicks || 0,
  currentImpressions: currentRow.impressions,
  prevImpressions: prevRow?.impressions || 0,
  clickGrowth: prevRow ? (currentRow.clicks - prevRow.clicks) / prevRow.clicks : Infinity,
  impressionGrowth: prevRow ? (currentRow.impressions - prevRow.impressions) / prevRow.impressions : Infinity,
  isNew: !prevRow,
};
```

| 種別 | 条件 |
|---|---|
| 新規クエリ | 前期にゼロで今期にクリック 3 以上 |
| 急上昇クエリ | クリック増加率 100% 以上 かつ 今期クリック 5 以上 |
| 表示急増クエリ | 表示回数増加率 200% 以上 かつ 今期表示 50 以上 |

## 流入先ページの取得（コンテンツギャップ分析の補助）

各急上昇クエリについて、page ディメンション付きで再クエリし流入先を特定:

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
```

判定:
- 流入先が `/ranking/` のみ → ブログ記事を書けば追加流入が見込める
- 流入先が `/blog/` → 既存記事の改善 / 関連記事の追加
- 流入先なし（インデックスゼロ）= **コンテンツギャップ**（最優先候補）

## 除外クエリ

- ブランドクエリ（`stats47`, `stats47.jp`）
- 意味不明・タイポ
- 単一都道府県名のみ（`東京`, `大阪` 等）

## sourceLabel

- `gsc`

## トレンドリストへのマッピング

| 統合フォーマット | GSC データ |
|---|---|
| keyword | row.keys[0] |
| popularity | currentClicks（または impressionGrowth%） |
| relatedUrls | 流入先ページ URL リスト（pageRes から） |
| 補足: gscType | "新規" / "急上昇" / "表示急増" のいずれか（候補生成時に表示） |
| 補足: gscGrowth | clickGrowth + impressionGrowth |

## 候補生成の追加フォーマット

GSC ソースのみ、Phase 5 のテンプレに以下を上乗せ:

```
- **今期クリック**: {clicks}（前期比: +{clickGrowth}%）
- **今期表示**: {impressions}（前期比: +{impressionGrowth}%）
- **現在の流入先**: {page_url}（なし = コンテンツギャップ）

### コンテンツギャップ分析
- 検索されているが適切なページがない → 新規記事の機会
- 既存ランキングページに流入 → ブログ記事で深掘りすれば追加流入
```

## 注意

- **GSC データは 2〜3 日遅延**。endDate を 3 日前にするのは固定ルール
- **自サイトデータの強み**: 外部トレンドと違い「実際に stats47 を探して来ているユーザー」の需要が分かる
- **コンテンツギャップが最重要**: 検索されているのに適切なページがない = 確実に流入が見込める記事テーマ
- **少数クリックでも注目**: stats47 規模ではクリック 5 以上の急上昇は有意
