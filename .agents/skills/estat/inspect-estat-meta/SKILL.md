---
name: inspect-estat-meta
domain: data
description: e-Stat API のメタデータ（カテゴリ・年・地域の構造）を調査する。Use when user says "メタデータ調査", "inspect-estat-meta", "統計構造を調べて". statsDataId のカテゴリ・年・地域を把握.
primary_agent: estat-researcher
co_agents: [theme-designer]
---

e-Stat API のメタデータ（カテゴリ・年・地域の構造）を調査する。

## 事前確認

**最初に e-Statメタデータ完全カタログを確認する** (月次更新・`docs/02_実装計画/48_e-Statカタログ実装仕様.md`)。既に取得済みなら生API不要。

```bash
node --import tsx .claude/scripts/estat/catalog.mjs pull        # .local/estat-catalog/ が無い場合のみ (初回)
node --import tsx .claude/scripts/estat/catalog.mjs search --id <statsDataId>
```

見つからない (未取得・全国 collectArea=1 や該当なし 0 で meta 対象外・カタログ自体が初回backfill未実施) 場合のみ
Phase 1 の生 API 呼び出しへ進む。
また `.claude/skills/estat/references/README.md` を確認し、既知のテーブル構造やコード体系を把握すること。該当する調査のリファレンスファイルがあれば、そちらも読むこと。

## 用途

- statsDataId の中身（カテゴリ・年・地域）を調査したいとき
- `/fetch-estat-data` で使うパラメータ（cdCat01, time, area 等）を特定したいとき
- 統計データの構造を理解したいとき

## 引数

ユーザーから以下を確認すること:

- **statsDataId**: e-Stat 統計データ ID（必須）

## 手順

### Phase 1: メタデータ取得

1. 共通 API から取得する。appId は CI の Repository Variable、ローカルの `.env.local`、`apps/web/.env.development` の順で解決する。値は出力しない。

```bash
node --input-type=module - <statsDataId> <<'JS'
import { fetchMetaInfo } from "./.claude/scripts/lib/estat-catalog/api.mjs";
const json = await fetchMetaInfo(process.argv[2]);
for (const obj of [].concat(json.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ)) {
  const classes = [].concat(obj.CLASS);
  console.log(`${obj["@id"]}: ${obj["@name"]} (${classes.length})`);
  for (const item of classes.slice(0, 20)) console.log(`  ${item["@code"]} | ${item["@name"]} | ${item["@unit"] ?? ""}`);
  if (classes.length > 20) console.log(`  ... and ${classes.length - 20} more`);
}
JS
```

### Phase 2: 構造分析

2. 出力を分析し、以下を特定:
   - **cat01 コード**: 取得したいカテゴリ（例: `J250502`）
   - **time 形式**: 年コードの形式（`2024000000` or `2024100000` 等）
     - ⚠️ **metric config の `years` / R2 yearCode には 4 桁年 (`2024`) で入れる**。フルタイムコード
       (`2024100000`) を転記しない（「2009100000 問題」再発防止。規約: `.claude/rules/estat-api.md`「年の正規化」）
   - **area レベル**: 都道府県は `lvArea=2` / 5桁 `XX000` 形式
   - **tab / cat02〜**: 複数ディメンションがある場合のフィルタ値

3. ユーザーに構造レポートを報告:
   - ディメンション一覧（tab, cat01〜, time, area）
   - 各ディメンションの項目数と代表的な値
   - 都道府県ランキングデータを取得する場合の推奨パラメータ

### Phase 3: よく使う表は references に記録（完全DBレス）

4. **CLASS_INF は e-Stat API (`getMetaInfo`) から毎回再取得できる**ため、永続キャッシュは不要。旧 D1 `estat_metainfo.class_inf` への書き戻しは廃止（8,000 行の自動カタログは retired D1 由来で git 再生成不可。DBレスの恒久カタログは **git-tracked `.claude/skills/estat/references/*.md` + e-Stat API**）。

   **頻繁に使う統計表**だけ、把握した構造（ディメンション一覧・各項目数・都道府県ランキング取得の推奨パラメータ）を `.claude/skills/estat/references/<調査名>.md` に追記しておく。これが次回以降 API を叩かずに参照できる恒久カタログになる（`references/README.md` の索引にも 1 行追加する）。

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

## クロスプラットフォーム

共通 API が `HTTP_PROXY` / `HTTPS_PROXY` を検出する。

## 注意

- **カテゴリ名の接頭辞**: e-Stat のカテゴリ名は `"J250502_保育所等利用待機児童数"` のようにコード接頭辞がつく場合がある

## 関連スキル

- `/search-estat` — statsDataId を特定する検索（このスキルの前に使用）
- `/fetch-estat-data` — メタデータ調査結果をもとにランキングデータを取得（このスキルの後に使用）

## 月次の表を探すとき

サイトの指標は年単位なので、月次の表は `data/estat/monthly/decisions.json` の台帳で採否を管理する (管理画面 `/data/monthly`)。カタログを取り直したら `node .claude/scripts/estat/build-monthly-ledger.mjs` で調査ごとの数を作り直し、新しい調査に判断を足す。
