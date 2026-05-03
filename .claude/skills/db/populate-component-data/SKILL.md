---
name: populate-component-data
description: e-Stat API から component_data テーブル（ローカル D1）へデータ投入する（composition-chart 対応）。投入後は /export-snapshots → /push-r2 で R2 反映。Use when user says "コンポーネントデータ投入", "populate-component-data".
argument-hint: "<chart-key> | --type composition-chart | --all"
disable-model-invocation: true
allowed-tools: Read, Bash
---

e-Stat API からデータを取得し、**ローカル D1** の `component_data` テーブルに UPSERT する。投入後、`/export-snapshots --only page-components` → `/push-r2 --prefix snapshots/page-components/` で本番反映する。

> **設計変更（2026-05）**: リモート D1 は Phase 10 で撤廃済み。旧設計の「Tier B = リモート D1 直書き」は廃止。**ローカル D1 投入 + R2 export**に統一。詳細: `docs/01_技術設計/11_データ基盤設計.md`

> **注意**: `component_data` 専用の exporter は未実装（2026-05-03 時点）。現状は `page_components` テーブルが `snapshots/page-components/all.json` に export される際に component_data も同梱されるか、別 exporter を実装する必要がある。実装状況を確認のうえ、未実装ならまず exporter を `packages/<相応 package>/src/scripts/export-component-data-snapshot.ts` として作成すること。

## 引数

`$ARGUMENTS` — 以下のいずれか:
- `<chart-key>` : 特定チャートのみ（例: `cmp-mining-industry-mix`）
- `--type composition-chart` : `composition-chart` タイプ全件
- `--all` : 対応コンポーネント全件（現フェーズは composition-chart のみ）

## 環境準備

```bash
cd /Users/minamidaisuke/stats47/apps/web
source ../../.env.local 2>/dev/null || true
```

e-Stat API キーが必要:
```bash
echo "NEXT_PUBLIC_ESTAT_APP_ID: ${NEXT_PUBLIC_ESTAT_APP_ID:-NOT SET}"
```

## Phase 1: 対象チャートの取得

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '/Users/minamidaisuke/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH, { readonly: true });
const arg = '$ARGUMENTS';
const isAll = arg === '--all' || arg === '--type composition-chart';
const rows = db.prepare(\`
  SELECT chart_key, component_type, component_props
  FROM page_components
  WHERE is_active = 1
    AND component_type = 'composition-chart'
    AND (? OR chart_key = ?)
\`).all(isAll, arg);
console.log(JSON.stringify(rows, null, 2));
db.close();
"
```

## Phase 2: e-Stat API からデータ取得

`composition-chart` の `component_props` を解析してデータ取得:

```javascript
// /tmp/populate-component-data.mjs として実行
import { config } from 'dotenv';
import path from 'path';
import { ProxyAgent } from 'undici';
config({ path: path.resolve('/Users/minamidaisuke/stats47/apps/web', '../../.env.local') });

const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const AREA_CODES = [
  '01000','02000','03000','04000','05000','06000','07000','08000','09000','10000',
  '11000','12000','13000','14000','15000','16000','17000','18000','19000','20000',
  '21000','22000','23000','24000','25000','26000','27000','28000','29000','30000',
  '31000','32000','33000','34000','35000','36000','37000','38000','39000','40000',
  '41000','42000','43000','44000','45000','46000','47000',
];

async function fetchEstat(statsDataId, cdArea, extraParams = {}) {
  const params = new URLSearchParams({
    appId, lang: 'J', statsDataId, cdArea,
    ...extraParams,
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url, fetchOpts);
  const json = await res.json();
  return json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? [];
}

function mapAreaCode(jisCode, offset) {
  const prefix = parseInt(jisCode.slice(0, 2), 10);
  return String(prefix + offset).padStart(2, '0') + '000';
}

async function fetchAll(chartKey, props) {
  const { segments, totalCode, statsDataId, multipleStatsSources } = props;
  const sources = multipleStatsSources ??
    [{ statsDataId, surveyYear: null, areaCodeOffset: 0 }];

  const rows = [];

  for (const source of sources) {
    const { statsDataId: srcId, surveyYear, areaCodeOffset = 0, cdCat01Fixed } = source;

    const buildParams = (segCode) =>
      cdCat01Fixed
        ? { cdCat01: cdCat01Fixed, cdCat02: segCode }
        : { cdCat01: segCode };

    for (const areaCode of AREA_CODES) {
      const mappedCode = areaCodeOffset ? mapAreaCode(areaCode, areaCodeOffset) : areaCode;

      const segResults = await Promise.all(
        segments.map(async (seg) => {
          const values = await fetchEstat(srcId, mappedCode, buildParams(seg.code));
          return { seg, values };
        })
      );

      for (const { seg, values } of segResults) {
        for (const v of values) {
          const yc = surveyYear ?? (v['@time'] ?? '').slice(0, 4);
          rows.push({
            chartKey,
            areaCode,
            yearCode: yc,
            categoryKey: seg.label,
            value: parseFloat(v['$']) || null,
            unit: v['@unit'] ?? null,
            sourceId: srcId,
          });
        }
      }

      if (totalCode) {
        const totalValues = await fetchEstat(srcId, mappedCode, buildParams(totalCode));
        for (const v of totalValues) {
          const yc = surveyYear ?? (v['@time'] ?? '').slice(0, 4);
          rows.push({
            chartKey,
            areaCode,
            yearCode: yc,
            categoryKey: '__total__',
            value: parseFloat(v['$']) || null,
            unit: v['@unit'] ?? null,
            sourceId: srcId,
          });
        }
      }
    }
  }

  return rows;
}
```

## Phase 3: ローカル D1 の component_data へ UPSERT

`better-sqlite3` で直接 INSERT OR REPLACE する。

```javascript
import Database from 'better-sqlite3';

const DB_PATH = '/Users/minamidaisuke/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH);

const upsert = db.prepare(`
  INSERT OR REPLACE INTO component_data
    (chart_key, area_code, year_code, category_key, value, unit, source_id, updated_at)
  VALUES (@chartKey, @areaCode, @yearCode, @categoryKey, @value, @unit, @sourceId, datetime('now'))
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) upsert.run(row);
});

insertMany(rows);  // rows は Phase 2 の結果
db.close();
```

## Phase 4: R2 snapshot への export と push

```bash
# 1. ローカル R2 に snapshot 出力
/export-snapshots --only page-components

# 2. リモート R2 へ push
/push-r2 --prefix snapshots/page-components/
```

> exporter が未実装の場合、まず `packages/stat-charts/src/scripts/export-page-components-snapshot.ts` を改修し、`page_components` だけでなく関連する `component_data` も snapshot に含めるか、別 path に出力するか検討すること。

## Phase 5: 検証

```bash
/verify-component-data <chart-key>
```

期待出力例:
```
ローカル D1: cmp-mining-industry-mix: 47地域 × 4年 × 8カテゴリ = 1,504行
R2 snapshot: snapshots/page-components/all.json (or component-data 専用 path) 更新確認
```

## 注意

- `surveyYear` が null の場合は API レスポンスの `@time` から年を抽出
- `@time` は `"2020000000"` 形式のため `.slice(0, 4)` で年を取得
- API エラー（`0` 件 or エラーオブジェクト）の場合は行を追加しない
- `value` が `"-"` または空文字の場合は `null` として保存
- リモート D1 への直接書き込みは廃止（`wrangler --remote` 利用禁止、Phase 10 撤廃）
