---
name: populate-component-data
description: e-Stat API → component_data テーブルへデータ投入（composition-chart 対応）
argument-hint: "<chart-key> | --type composition-chart | --all"
disable-model-invocation: true
allowed-tools: Read, Bash
---

e-Stat API からデータを取得し、リモート D1 の `component_data` テーブルに UPSERT する。

`component_data` は **Tier B テーブル**（リモートのみ管理）。
ローカル D1 には空テーブルのみ存在するため、このスキルはリモートにのみ書き込む。

## 引数

`$ARGUMENTS` — 以下のいずれか:
- `<chart-key>` : 特定チャートのみ（例: `cmp-mining-industry-mix`）
- `--type composition-chart` : `composition-chart` タイプ全件
- `--all` : 対応コンポーネント全件（現フェーズは composition-chart のみ）

## 環境準備

```bash
cd apps/web
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
const DB_PATH = '../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
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

// props: composition-chart の component_props
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

      // セグメントデータ取得
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

      // totalCode データ取得
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

## Phase 3: リモート D1 への UPSERT

500行/チャンクで `--file` 投入:

```javascript
import fs from 'fs';

function toSqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function buildChunk(rows) {
  const lines = ['PRAGMA foreign_keys=OFF;'];
  for (const r of rows) {
    lines.push(
      `INSERT OR REPLACE INTO component_data ` +
      `(chart_key, area_code, year_code, category_key, value, unit, source_id) VALUES ` +
      `(${toSqlVal(r.chartKey)}, ${toSqlVal(r.areaCode)}, ${toSqlVal(r.yearCode)}, ` +
      `${toSqlVal(r.categoryKey)}, ${toSqlVal(r.value)}, ${toSqlVal(r.unit)}, ${toSqlVal(r.sourceId)});`
    );
  }
  return lines.join('\n');
}

// チャンク分割して投入
const CHUNK = 500;
for (let i = 0; i * CHUNK < rows.length; i++) {
  const chunk = rows.slice(i * CHUNK, (i + 1) * CHUNK);
  const sqlFile = `/tmp/populate-chunk-${i}.sql`;
  fs.writeFileSync(sqlFile, buildChunk(chunk));
  // 次のコマンドで投入:
  // cd apps/web && npx wrangler d1 execute stats47_static --remote --env production -y --file <sqlFile>
}
```

```bash
cd apps/web
for f in /tmp/populate-chunk-*.sql; do
  echo "Uploading $f..."
  npx wrangler d1 execute stats47_static --remote --env production -y --file "$f"
done
rm /tmp/populate-chunk-*.sql
```

## Phase 4: 投入結果レポート

```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production -y \
  --command "SELECT chart_key, COUNT(*) as rows, MIN(updated_at) as first, MAX(updated_at) as last FROM component_data GROUP BY chart_key;" --json
```

期待出力例:
```
cmp-mining-industry-mix: 47areas × 4years × 8categories = 1,504行
```

## 注意

- `component_data` は Tier B テーブル — ローカルには書かない
- `surveyYear` が null の場合は API レスポンスの `@time` から年を抽出
- `@time` は `"2020000000"` 形式のため `.slice(0, 4)` で年を取得
- API エラー（`0`件 or エラーオブジェクト）の場合は行を追加しない
- `value` が `"-"` または空文字の場合は `null` として保存
