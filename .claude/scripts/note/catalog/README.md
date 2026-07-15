# note-catalog (note 記事カタログ SSOT)

note コーパス全体 (公開済み + ドラフト) の **editorial メタの単一ソース (SSOT)**。
従来バラバラだった真実源を git TS 1 箇所に束ねる。管理者は **note-manager** agent。

> 決定 (2026-07-15): カタログの SSOT は **git TS** (theme-catalog / survey-editorial と同型)。
> 記事本文の SSOT は従来どおり **R2 `note/<vertical>/<slug>/draft.md`** (変更しない)。
> つまり「本文 = R2」「editorial メタ (vertical/series/magazine/有料無料/送客先/公開URL) = このカタログ」。

## 何が SSOT で、何が派生か

| データ | SSOT | 派生 (手編集しない) |
|---|---|---|
| 記事本文・画像 | R2 `note/<vertical>/<slug>/` | — |
| editorial メタ (vertical/series/**magazine**/isPaid/priceJpy/status/noteUrl/publishedAt/r2Path/**stats47Targets**) | **`catalog/data/<vertical>.ts`** | — |
| マガジン定義 (名称/有料無料/束ねる vertical/URL) | **`catalog/magazines.ts`** | — |
| 公開済みインデックス | (派生) | `.claude/state/note-published-urls.json` ← `generate-note-catalog.ts` |

## ファイル

| ファイル | 役割 |
|---|---|
| `types.ts` | `NoteArticle` / `NoteMagazine` / `NoteVertical` / `NoteSeries` |
| `magazines.ts` | マガジンレジストリ (`NOTE_MAGAZINES`)。マガジン追加・有料/無料はここ |
| `data/<vertical>.ts` | 記事エントリ (SSOT)。手編集してよいのは editorial メタのみ |
| `index.ts` | 集約入口 + helper (`NOTE_ARTICLES` / `articlesByMagazine` 等) |
| `validate-note-catalog.ts` | 決定的 lint (参照整合性)。error で exit 1 |
| `generate-note-catalog.ts` | カタログ → `note-published-urls.json` 再生成 |
| `bootstrap-from-indices.mjs` | 一回限りの移行 (既存インデックス → data/*.ts)。初版生成済・通常再実行しない |

## 使い方

```bash
# 検証 (参照整合性)
npx tsx .claude/scripts/note/catalog/validate-note-catalog.ts [--strict]
# 派生インデックス再生成 (非破壊は scratchpad、--apply で本番 state 上書き)
npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts [--apply]
```

## マガジン運用 (「類似記事を無料マガジンに束ねる」)

1. `magazines.ts` にマガジンを定義 (無料キュレーション or 有料メンバーシップ)。
2. 束ねたい記事の `data/<vertical>.ts` の `magazine` を該当キーに設定する。
3. `validate` で整合 (キー実在・vertical 一致) を確認。
4. note.com でマガジンを作成し URL が出たら `magazines.ts` の `noteUrl` に書き戻す
   (フッター注入 `inject-magazine-url.cjs` への接続は downstream 移行 = 次段)。

- koumuin-* 系は初版で各 vertical マガジンに自動割当済。
- stats47-note は `s47-fiscal` / `s47-climate` / `s47-population` / `s47-labor` を用意。
  記事の `magazine` を設定して束ねる (初版は未割当 = null)。

## 検証ルール (validate-note-catalog.ts)

- **error**: key 重複 / 未登録マガジンキー / マガジンの vertical 不一致 / published なのに noteUrl 無し
- **warn**: title 重複の疑い (実質重複記事の surface) / 有料マガジンに無料記事 / isPaid だが priceJpy 未設定 /
  stats47Targets が KNOWN_RANKING_KEYS に不在

## 禁止事項

| NG | OK |
|---|---|
| `note-published-urls.json` を手編集して真実源化 | `data/*.ts` を編集 → `generate` で再生成 |
| 記事本文を git に長期保持 (docs/31 は ephemeral outbox) | 本文は R2、メタはカタログ |
| マガジンキーを data/*.ts に直書きで増やす | `magazines.ts` に登録してから参照 |

## 次段 (downstream 移行・今回スコープ外)

- `build-note-published-index.mjs` (R2 fetch 版) を `generate-note-catalog.ts` に置換
- `inject-magazine-url.cjs` / `add-koumuin-magazine-footer.cjs` をカタログ駆動化
- `validate` を pre-commit / CI に配線
- 既存コーパスの重複 (`recovered-*` / `paid-*` の title 重複) の統廃合
