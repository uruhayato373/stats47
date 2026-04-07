---
name: inspect-estat-meta
description: e-Stat API のメタデータ（カテゴリ・年・地域の構造）を調査する。Use when user says "メタデータ調査", "inspect-estat-meta", "統計構造を調べて". statsDataId のカテゴリ・年・地域を把握.
---

e-Stat API のメタデータ（カテゴリ・年・地域の構造）を調査する。

## 事前確認

調査前に `.claude/skills/estat/references/README.md` を確認し、既知のテーブル構造やコード体系を把握すること。該当する調査のリファレンスファイルがあれば、そちらも読むこと。

## 用途

- statsDataId の中身（カテゴリ・年・地域）を調査したいとき
- `/fetch-estat-data` で使うパラメータ（cdCat01, time, area 等）を特定したいとき
- 統計データの構造を理解したいとき

## 引数

ユーザーから以下を確認すること:

- **statsDataId**: e-Stat 統計データ ID（必須）

## 手順

### Phase 1: メタデータ取得

1. 一時スクリプトを作成してメタ情報を取得する:

```js
// scripts/temp-inspect-meta.mjs
import { config } from "dotenv";
import path from "path";
import { ProxyAgent } from "undici";
config({ path: path.resolve(process.cwd(), ".env.local") });

const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};
const statsDataId = process.argv[2];

const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&lang=J&statsDataId=${statsDataId}`;
const res = await fetch(url, fetchOpts);
const json = await res.json();
const classObjs = json.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;

for (const obj of classObjs) {
  const id = obj["@id"];
  const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
  console.log(`\n--- ${id}: ${obj["@name"]} (${classes.length} items) ---`);
  for (const c of classes.slice(0, 20)) {
    console.log(`  ${c["@code"]} | ${c["@name"]}${c["@unit"] ? " (" + c["@unit"] + ")" : ""}`);
  }
  if (classes.length > 20) console.log(`  ... and ${classes.length - 20} more`);
}
```

```bash
node scripts/temp-inspect-meta.mjs <statsDataId>
```

### Phase 2: 構造分析

2. 出力を分析し、以下を特定:
   - **cat01 コード**: 取得したいカテゴリ（例: `J250502`）
   - **time 形式**: 年コードの形式（`2024000000` or `2024100000` 等）
   - **area レベル**: 都道府県は `lvArea=2` / 5桁 `XX000` 形式
   - **tab / cat02〜**: 複数ディメンションがある場合のフィルタ値

3. ユーザーに構造レポートを報告:
   - ディメンション一覧（tab, cat01〜, time, area）
   - 各ディメンションの項目数と代表的な値
   - 都道府県ランキングデータを取得する場合の推奨パラメータ

### Phase 3: 後処理

4. 一時スクリプトを削除

## 出力例

```
--- tab: 表章項目 (3 items) ---
  01 | 転入者数
  02 | 転出者数
  04 | 転入超過数

--- cat01: 年齢5歳階級 (20 items) ---
  000 | 総数
  100 | ０～４歳
  201 | ５～９歳
  ...

--- time: 時間軸(年次) (15 items) ---
  2024000000 | 2024年
  2023000000 | 2023年
  ...

--- area: 地域 (48 items) ---
  00000 | 全国
  01000 | 北海道
  02000 | 青森県
  ...
```

## クロスプラットフォーム注意事項

このスキルは Windows / macOS 両環境で使用される。

| 項目 | Windows | macOS |
|---|---|---|
| プロキシ制約 | あり（企業ネットワーク、`undici.ProxyAgent` 必須） | なし（自宅ネットワーク） |
| `ProxyAgent` import | 必須（`HTTP_PROXY` / `HTTPS_PROXY` 環境変数から検出） | 不要（環境変数が未設定なら自動スキップ） |

スクリプトテンプレートの `ProxyAgent` 処理は環境変数の有無で自動判定するため、**コード変更は不要**。

## 注意

- **プロキシ**: 企業ネットワークでは `undici` の `ProxyAgent` が必須（スクリプトテンプレートが自動検出する）
- **環境変数**: `NEXT_PUBLIC_ESTAT_APP_ID` が `.env.local` に設定されていること
- **カテゴリ名の接頭辞**: e-Stat のカテゴリ名は `"J250502_保育所等利用待機児童数"` のようにコード接頭辞がつく場合がある

## 関連スキル

- `/search-estat` — statsDataId を特定する検索（このスキルの前に使用）
- `/fetch-estat-data` — メタデータ調査結果をもとにランキングデータを取得（このスキルの後に使用）
