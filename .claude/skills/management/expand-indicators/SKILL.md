---
name: expand-indicators
description: |
  docs/50_Issues/indicator-backlog.md から優先度上位 N 件を取得し、
  recipe を author して .claude/scripts/management/ingest-indicator.mjs で
  metrics + stats_prefecture テーブルに登録、backlog status 更新、
  docs/05_改善ログ/indicator-expansion.md に append する。
  Use when user says "指標追加", "indicator 拡充", "/expand-indicators".
argument-hint: "--target <N> [--priority high|medium|low|all] [--dry-run]"
---

stats47 の指標を継続的に拡充する。`docs/50_Issues/indicator-backlog.md` の pending 候補から優先度上位 N 件を順次取得・登録し、backlog の status を更新、`docs/05_改善ログ/indicator-expansion.md` に施策バッチとして append する 1 コマンド型スキル。

**現行 schema** (DDD migration 後):
- `metrics(key, title, unit, source_id, category_key, ...)` — 旧 `indicators`
- `stats_prefecture(metric_key, area_code, year_code, value, rank, ...)` — 旧 `ranking_data`
- `sources(id, source_kind, external_id, ...)` — 出典マスタ
- `estat_metainfo(stats_data_id, status, ...)` — candidate / registered フラグ

旧 SKILL は `indicators` / `ranking_data` を前提に書かれていたが、それらは DDD 移行で廃止済 ([feedback_skill_schema_drift.md](~/.claude/projects/-Users-minamidaisuke-stats47/memory/feedback_skill_schema_drift.md))。本 SKILL は現行 schema 直書きの orchestrator を経由する。

## 用途

- 競合 (todo-ran 1,501 / uub 1,843) との指標数 gap を継続的に縮める
- e-Stat candidate pool (8,838 件) から優先度の高いものを段階的に registered に昇格
- 「指標追加」を 1 件ずつ手動運用するコストを削減し、batch 実行 + 改善ログ append まで自動化

## 引数

| 引数 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `--target <N>` | △ | `10` | 1 回の実行で処理する候補件数 (最大 30、超過時は分割実行を推奨) |
| `--priority <p>` | △ | `high` | `high` / `medium` / `low` / `all` / カンマ区切り (`high,medium`) |
| `--dry-run` | △ | false | 候補抽出 + recipe 整形のみ。fetch / D1 INSERT / backlog 更新 / 改善ログ append は実行しない |

### 使用例

```bash
# 標準: high priority 上位 10 件
/expand-indicators --target 10

# 予行演習
/expand-indicators --target 10 --dry-run

# medium priority も含めて 20 件
/expand-indicators --target 20 --priority high,medium
```

## 前提条件

- `docs/50_Issues/indicator-backlog.md` が存在し、pending 候補が 1 件以上ある
- `.env.local` に `NEXT_PUBLIC_ESTAT_APP_ID` 設定済
- ローカル D1 (`.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`) アクセス可能
- 既存スキル `/inspect-estat-meta` で recipe 雛形が作れる
- (任意) `git status` がクリーン — rollback を容易にする

## 実行フロー

### Phase 1: 候補抽出

1. `parse-backlog.cjs` で backlog をパースし、`--priority` `--status=pending` で上位 N 件抽出:
   ```bash
   node .claude/scripts/management/parse-backlog.cjs \
     --backlog docs/50_Issues/indicator-backlog.md \
     --priority "${PRIORITY:-high}" \
     --status pending \
     --limit "${TARGET:-10}"
   ```
2. 0 件なら「pending なし」と報告して終了。

### Phase 2: 各 candidate の recipe を author

各 candidate に対して **recipe オブジェクト** を 1 件作る。recipe は以下のスキーマ:

```json
{
  "slug": "convenience-store-sales-monthly",
  "statsDataId": "0004032502",
  "categoryKey": "commercial",
  "title": "コンビニエンスストア販売額（都道府県別・年計）",
  "unit": "百万円",
  "yearCode": "2024",
  "yearName": "2024年",
  "query": { "cdCat01": "0101300", "cdCat02": "01040100", "cdCat03": "01030100", "cdTime": "2024000000" },
  "prefSource": "area",
  "allowOldYear": false
}
```

| フィールド | 説明 |
|---|---|
| `slug` | backlog の candidate_slug をそのまま使う (= 将来の `metrics.key`) |
| `statsDataId` | backlog の `estat_stats_data_id` |
| `categoryKey` | backlog の category (例 `commercial`, `socialsecurity`) |
| `title` | `metrics.title` に入る公式名 (e-Stat 表名 + 集計軸を簡潔に) |
| `unit` | 「百万円」「人口10万対」など |
| `yearCode` / `yearName` | 取得対象年。`2024` / `"2024年"` 形式 |
| `query` | e-Stat API のクエリパラメータ (`cdCat01` 等)。**probe 必須** |
| `prefSource` | `"area"` (標準) / `"cat02-pseudo"` / `"cat03-pseudo"` (下記参照) |
| `allowOldYear` | true なら 5 年以上前のデータでも登録 (周期的調査向け) |

**recipe author の手順** (新規 statsDataId ごとに必須):

1. `/inspect-estat-meta` で `statsDataId` のメタを取得し、`CLASS_OBJ` 一覧を見る
2. `area` dimension があるか確認:
   - **ある** → `prefSource: "area"`。`cdArea` は指定しない (全国取得 → 47 都道府県をフィルタ)
   - **ない** → 都道府県が `cat02` / `cat03` に擬似コード (2-48) で埋まっている可能性大 (患者調査系)。`prefSource: "cat02-pseudo"` or `"cat03-pseudo"`
3. 必要な集計軸を絞る (例: 「総数 × 入院総数」のみに絞る `cdCat01` `cdCat03`)
4. yearCode を最新に固定
5. **経済センサス系** (`0004003256-261`) は `lvArea=2` を付けると 0 件返るので付けない

recipe を `/tmp/expand-indicators/recipes-YYYY-MM-DD-NN.json` (配列) として保存。

### Phase 3: ingest 実行

3. `ingest-indicator.mjs` を recipe JSON 入力で実行:
   ```bash
   mkdir -p /tmp/expand-indicators
   # (recipes-2026-MM-DD-NN.json を Phase 2 で作成済)
   node .claude/scripts/management/ingest-indicator.mjs \
     --recipes /tmp/expand-indicators/recipes-2026-MM-DD-NN.json \
     [--dry-run]
   ```
   出力 (stdout): 結果 JSON 配列。各要素は `{ slug, statsDataId, status, rows, latestYear, reason }`。
   status: `done` / `failed` / `skipped` / `dry-run`。

4. スクリプト内で実行される処理 (各 candidate ごと):
   - 既存 `metrics.key` チェック → あって `stats_prefecture` が 47 件なら skip
   - yearAge チェック (`!allowOldYear && now - yearCode > 5` で failed)
   - e-Stat `getStatsData` 呼び出し
   - prefSource に応じて 47 都道府県値を抽出
   - 47 件未満なら failed (debug JSON を `/tmp/expand-indicators/<slug>.debug.json` に保存)
   - rank 計算 (降順、同値同順位)
   - `sources` upsert / `metrics` upsert / `stats_prefecture` DELETE+INSERT (year_code 単位)
   - `estat_metainfo.status = 'registered'` に昇格
   - 47 件確認 → `done`

5. **rate limit**: スクリプト内で 7 秒 sleep (e-Stat 公称 60req/min、meta + data で 2 コール想定)。`--sleep-ms` で調整可。

### Phase 4: backlog 更新

6. 結果 JSON を見て、成功 candidate の backlog 該当行を Edit:
   - `status: pending` → `status: done`
7. 失敗 candidate:
   - `status: pending` → `status: failed`、行末に `<!-- failed: <reason> @ YYYY-MM-DD -->` 付与
8. backlog frontmatter の `updated:` を本日日付に更新。

### Phase 5: 改善ログ append

9. `docs/05_改善ログ/indicator-expansion.md` を Read し、`## 実行履歴` セクション末尾に下記テンプレで新 batch entry を Edit append:
   - section ID: `[BATCH-YYYY-MM-DD-NN]` (NN は当日 N 回目)
   - 追加リスト表 (slug / category / theme / estat_id / rows / latest_year)
   - 結果サマリ (成功 / 失敗 / skip / backlog 残)
   - 想定効果 (`evidence-based-judgment.md` 準拠)
   - 失敗 candidate 一覧 (あれば)
   - 次回推奨実行コマンド
10. frontmatter の `updated:` を本日日付に更新。

### Phase 6: 次アクション提示

11. 完了サマリ報告 (成功 / 失敗 / backlog 残):
    ```
    [expand-indicators] 完了
      成功: 8 件 / 失敗: 1 件 / skip: 1 件
      backlog 残: pending=29 / failed=1 / done=8
      改善ログ: docs/05_改善ログ/indicator-expansion.md#BATCH-2026-05-19-01

    次のアクション候補:
      1. /generate-known-ranking-keys (新規 metric.key を middleware に登録)
      2. /sync-snapshots (R2 反映 → 本番配信)
      3. /expand-indicators --target 10 (次 batch)
    ```

## 完了後の更新先

| 更新対象 | 内容 |
|---|---|
| `docs/50_Issues/indicator-backlog.md` | 該当行 `status` 更新 + frontmatter `updated:` |
| `docs/05_改善ログ/indicator-expansion.md` | 新 batch entry append + frontmatter `updated:` |
| ローカル D1 | `metrics` + `stats_prefecture` + `sources` (upsert) + `estat_metainfo` (status='registered') |
| `/tmp/expand-indicators/recipes-*.json` | recipe 入力 (ephemeral) |
| `/tmp/expand-indicators/<slug>.debug.json` | 失敗時のみ debug ダンプ (ephemeral) |

**未更新で OK** (別スキル / 後続バッチ):
- `apps/web/src/config/known-ranking-keys.ts` → `/generate-known-ranking-keys` (要実行、未実行だと middleware が 410 を返す)
- R2 snapshot → `/sync-snapshots`
- メモリ → 恒常事実が変わったときのみ手動更新

## 規約

- **1 回の実行で最大 30 件**。超過時は backlog を 2-3 回に分けて実行する。
- **失敗時は個別 candidate を skip して次へ**。バッチ全体を中断しない。
- **append-only**: 改善ログの既存 section を編集してはならない。新 batch は必ず新 section として append。
- **`evidence-based-judgment.md` 準拠**: 想定効果は数値 + 根拠を必ず併記。判定は 28 日後の GSC / GA4 実測で行う。それまで `effect/pending`。
- **新規ロジック禁止**: 取得・登録ロジックは `ingest-indicator.mjs` を再利用。本スキル内で e-Stat API を直接呼ばない。
- **D1 パス固定**: `.claude/rules/local-environment.md` の固定パスを `ingest-indicator.mjs` 内でハードコード済。
- **一時ファイルは `/tmp/expand-indicators/` 配下**。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `e-Stat API rate limit (429)` | 60 req/min 超過 | `--sleep-ms 20000` に増やす / `--target` を半分に / 翌日再実行 |
| `候補が 47 件未満` | 都道府県別データが揃っていない調査 | `/tmp/expand-indicators/<slug>.debug.json` で `cat01`/`cat02`/`cat03` を確認。recipe の `query` を修正、または `prefSource` を `cat02-pseudo` / `cat03-pseudo` に変更 |
| `重複登録 (既存 metric.key)` | 既に手動登録済 | 自動 skip (`stats_prefecture` 47 件確認後) |
| `latest_year が 5 年以上前` | データ更新停止カテゴリ | 周期的調査 (国勢調査・経済センサス等) で意図的に古いデータが必要なら recipe に `"allowOldYear": true` を追加。それ以外は backlog で `failed` |
| `D1 が空ファイル化` | `better-sqlite3` が誤ったパスを開いた | `.claude/rules/local-environment.md` の固定パスを再確認、空ファイル削除 |
| `backlog 表のパース失敗` | 列順が変わった | `parse-backlog.cjs` の `EXPECTED_HEADER` を更新 |
| **患者調査 (`0004026xxx`) が `area` で 0 件** | 都道府県が `cat02`/`cat03` に擬似コード (2-48) で埋まる | `prefSource: "cat02-pseudo"` or `"cat03-pseudo"` を使う。code N (2-48) → areaCode `(N-1).padStart(2,0) + "000"` (北海道=2→01000, 沖縄=48→47000) |
| **経済センサス (`000400325x`) が `lvArea=2` で 0 件** | 表構造上 `lvArea` 指定が空 fetch を引き起こす | recipe の `query` に `lvArea` を含めない。`cdTab` + `cdCat01` + (必要なら `cdCat02`) で十分 |
| **海面漁業統計 (`0003262xxx`) が 47 件超 or 部分カバー** | `area` 次元に「大海区」(48000-74000) や複合コード「青森県(太平洋北区)」等が含まれる + 内陸 8 県 (栃木/群馬/埼玉/山梨/長野/岐阜/滋賀/奈良) は構造的に欠損 | `pickPrefByArea` の regex で大海区は自動除外済 (`^(0[1-9]|[1-3]\d|4[0-7])000$`)。内陸 8 県は事後で value=0 補完が必要 (`/tmp/expand-indicators/fill-landlocked-zeros.mjs` パターン) + `metrics.subtitle` に「内陸 8 県は調査対象外」明記 |
| `STATUS=100x` (Bad Request) | 必須 dimension の欠如 | `/inspect-estat-meta` で `CLASS_OBJ` を全部確認、各 dim から 1 値選んで recipe `query` に追加 |

## 関連

- backlog: [`docs/50_Issues/indicator-backlog.md`](../../../../docs/50_Issues/indicator-backlog.md)
- 改善ログ: [`docs/05_改善ログ/indicator-expansion.md`](../../../../docs/05_改善ログ/indicator-expansion.md)
- パーサ: [`.claude/scripts/management/parse-backlog.cjs`](../../../scripts/management/parse-backlog.cjs)
- orchestrator: [`.claude/scripts/management/ingest-indicator.mjs`](../../../scripts/management/ingest-indicator.mjs)
- 連携スキル: `/inspect-estat-meta`, `/generate-known-ranking-keys`, `/sync-snapshots`
- 規約: `.claude/rules/estat-api.md`, `.claude/rules/evidence-based-judgment.md`, `.claude/rules/data-storage.md`, `.claude/rules/docs-vs-issues.md`
- memory: `~/.claude/projects/-Users-minamidaisuke-stats47/memory/project_estat_metainfo_unified.md`, `~/.claude/projects/-Users-minamidaisuke-stats47/memory/feedback_skill_schema_drift.md`
- 過去 batch ref: `/tmp/expand-indicators/run2.mjs` (2026-05-19 BATCH-01 で使った原型、ephemeral)
