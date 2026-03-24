e-Stat API の統計表を検索し、statsDataId を特定する。

## 事前確認

新規検索の前に `.claude/skills/estat/references/README.md` を確認し、既知のテーブルや e-Stat API 未登録の統計を把握すること。該当する調査のリファレンスファイルがあれば、そちらも読むこと。

## 用途

- キーワードで統計表を探したいとき（例: 「待機児童」「人口移動」）
- 統計分野コードで一覧を取得したいとき（例: 02=人口・世帯）
- 政府統計コードから統計表を絞り込みたいとき
- `/fetch-estat-data` で使う statsDataId を調べたいとき

## 引数

ユーザーから以下を確認すること（いずれか1つ以上）:

- **keyword**: 検索キーワード（任意）
- **statsField**: 統計分野コード 2桁（任意）
- **statsCode**: 政府統計コード 5桁 or 8桁（任意）
- **collectArea**: 集計地域区分 `1`=全国, `2`=都道府県, `3`=市区町村（任意）
- **limit**: 取得件数（任意、デフォルト: 20）

## 手順

### Phase 1: 検索実行

1. 一時スクリプトを作成して検索を実行:

```ts
// scripts/temp-search-estat.mts
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

const { EstatStatsListFetcher } = await import(
  "../packages/estat-api/src/stats-list/services/fetcher.ts"
);
const { EstatStatsListFormatter } = await import(
  "../packages/estat-api/src/stats-list/services/formatter.ts"
);

// --- 検索パラメータ（案件ごとにカスタマイズ） ---
const response = await EstatStatsListFetcher.searchByKeyword("<KEYWORD>", {
  limit: <LIMIT>,
  // statsField: "<FIELD_CODE>",   // 分野で絞り込む場合
  // statsCode: "<STATS_CODE>",    // 政府統計コードで絞り込む場合
  // collectArea: "2",             // 都道府県データのみ
});

const result = EstatStatsListFormatter.formatStatsListData(response);

console.log(`\n検索結果: ${result.totalCount} 件中 ${result.tables.length} 件表示\n`);
console.log("=".repeat(100));

for (const t of result.tables) {
  console.log(`[${t.id}] ${t.statName}`);
  console.log(`  題名: ${t.title}`);
  console.log(`  統計名: ${t.statisticsName}`);
  console.log(`  機関: ${t.govOrg} | 周期: ${t.cycle || "-"} | 調査: ${t.surveyDate || "-"} | 更新: ${t.updatedDate || "-"}`);
  if (t.mainCategory) console.log(`  分野: ${t.mainCategory.name}${t.subCategory ? " > " + t.subCategory.name : ""}`);
  console.log("-".repeat(100));
}

if (result.pagination.nextKey) {
  console.log(`\n次ページ: startPosition=${result.pagination.nextKey}`);
}
```

```bash
npx tsx scripts/temp-search-estat.mts
```

### Phase 2: 結果分析

2. 出力を分析し、ユーザーに結果をサマリーで報告:
   - 該当件数
   - 主要な統計表（statsDataId、題名、機関、調査年）
   - 目的に合いそうな候補の推薦

3. ユーザーが特定の statsDataId を選んだら、`/fetch-estat-data` スキルへ誘導

### Phase 3: 後処理

4. 一時スクリプトを削除

## 検索メソッド一覧

| メソッド | 用途 | 主パラメータ |
|---|---|---|
| `searchByKeyword(keyword, opts)` | キーワード検索 | 検索ワード |
| `searchByField(fieldCode, opts)` | 分野別一覧 | 分野コード 2桁 |
| `searchByStatsCode(code, opts)` | 政府統計コード検索 | 5桁 or 8桁コード |
| `searchByCollectArea(area, opts)` | 地域区分検索 | "1"/"2"/"3" |
| `fetchStatsNameList(opts)` | 政府統計名一覧 | — |
| `fetchUpdatedStats(since, opts)` | 更新日以降の統計 | YYYY-MM-DD |
| `fetchAllWithPaging(params, pagingOpts)` | 全件取得（ページング） | maxResults, batchSize |

## 統計分野コード

| コード | 分野 |
|---|---|
| 01 | 国土・気象 |
| 02 | 人口・世帯 |
| 03 | 労働・賃金 |
| 04 | 農林水産業 |
| 05 | 鉱工業 |
| 06 | 商業・サービス業 |
| 07 | 企業・家計・経済 |
| 08 | 住宅・土地・建設 |
| 09 | エネルギー・水 |
| 10 | 運輸・観光 |
| 11 | 情報通信・科学技術 |
| 12 | 教育・文化・スポーツ・生活 |
| 13 | 行財政 |
| 14 | 司法・安全・環境 |
| 15 | 社会保障・衛生 |
| 16 | 国際 |

## 検索オプション (StatsListSearchOptions)

```typescript
{
  searchWord?: string;           // キーワード（スペース区切りで複数可）
  statsCode?: string;            // 政府統計コード
  statsField?: string;           // 分野コード（2桁）
  collectArea?: "1" | "2" | "3"; // 1: 全国, 2: 都道府県, 3: 市区町村
  surveyYears?: string;          // 調査年月（YYYYMM, 範囲: YYYYMM-YYYYMM）
  openYears?: string;            // 公開年月（同上）
  updatedDate?: string;          // 更新日（YYYY-MM-DD）
  limit?: number;                // 取得件数（デフォルト: 100, 最大: 10000）
  startPosition?: number;        // 開始位置（ページング用）
}
```


## クロスプラットフォーム注意事項

このスキルは Windows / macOS 両環境で使用される。

| 項目 | Windows | macOS |
|---|---|---|
| プロキシ制約 | あり（企業ネットワーク） | なし（自宅ネットワーク） |
| `packages/estat-api` HTTP クライアント | `undici.ProxyAgent` を自動検出・適用 | プロキシ環境変数が未設定のためスキップ |

`packages/estat-api` の HTTP クライアント（`http-client.ts`）が `HTTP_PROXY` / `HTTPS_PROXY` 環境変数を自動検出するため、**コード変更は不要**。

## 注意

- **プロキシ**: `packages/estat-api` の HTTP クライアントにプロキシ対応済み（`undici.ProxyAgent` 自動検出）
- **環境変数**: `NEXT_PUBLIC_ESTAT_APP_ID` が `.env.local` に設定されていること
- **レートリミット**: e-Stat API は公称 60req/min。`fetchAllWithPaging` は内部で遅延制御する
- **TABLE_INF 構造**: API レスポンスの `TABLE_INF` は `DATALIST_INF` 直下に配置される（`LIST_INF` ネストなし）

## 関連スキル

- `/fetch-estat-data` — statsDataId 確定後にメタデータ調査 → ランキングデータ取得
