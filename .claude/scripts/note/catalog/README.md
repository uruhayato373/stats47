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
| editorial メタ (vertical/series/**magazine**/isPaid/priceJpy/status/noteUrl/publishedAt/r2Path/**r2Body**/**stats47Targets**) | **`catalog/data/<vertical>.ts`** | — |
| マガジン定義 (名称/有料無料/束ねる vertical/URL/商品導線) | **`catalog/magazines.ts`** | 商品導線は記事別 clean path に変換し、サイト到着時だけGA4標準UTMへ転送 |
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
| `assign-magazines-by-title.mjs` | 公開済み stats47-note (回収スタブ = key 不透明) の `magazine` をタイトル分類で一括割当 (dry-run 既定・`--apply` で書換)。誤 vertical / 未解決は null 保持で flag |
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
   stats47-note の一括割当は `assign-magazines-by-title.mjs`(タイトル分類・決定的)を使う
   (公開スタブは key が不透明なためタイトルからカテゴリを導出する)。
3. `validate` で整合 (キー実在・vertical 一致) を確認。
4. note.com でマガジンを作成し URL が出たら `magazines.ts` の `noteUrl` に書き戻す
   (フッター注入 `inject-magazine-url.cjs` への接続は downstream 移行 = 次段)。

- koumuin-* 系は初版で各 vertical マガジンに自動割当済。
- stats47-note は e-Stat 17 カテゴリ + 行動者率クラスタ = 18 の `s47-*` マガジンに細分化済み
  (`s47-fiscal` / `s47-health` / `s47-sports-culture` …)。`assign-magazines-by-title.mjs --apply`
  で公開済み 159 件中 143 件を割当済み。残りは誤 vertical 16 件 (Claude Code/商品章の混入) +
  未公開ドラフト。全体設計とフェーズは `.claude/todo/backlog.md` `[NOTE-MAGAZINE-REORG-01]`。

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

## R2 未保存の回収スタブ (`r2Body: false`) — 要本文復元

`recovered-*` / `paid-*` エントリは **note.com に公開済みだが R2 に記事本体 (draft.md/画像) が無い**
回収スタブ。r2Path は note ID から機械生成しただけで実体が無く **404 になる** (docs/31 にもローカル本文なし)。
これらを `r2Body: false` で正直にマークする (省略時 = `true` = R2 に本体あり)。

- **派生インデックス `note-published-urls.json`** は `r2Body===false` を `status: "note_only"` +
  `r2_body: false` で出力する。R2 に本体があるものだけ `status: "r2_ready"`
  (旧 `generate-note-catalog.ts` は全公開記事を無条件 `r2_ready` にし、404 の r2Path を「保存済み」と偽っていた)。
- **一覧 (要本文復元)**: `.claude/state/note/r2-missing-inventory.md` (カタログから再生成する派生物)。
  実測 2026-07-15: 165 件 (stats47-note 159 / koumuin 6, 有料 50)。
- **復元手順**: note.com からの本文取得は browser-use + note ログイン (有料は所有者アカウント) が必要で、
  creds/ブラウザを持つローカルセッションで実施する。復元 (note.com → R2 push) 後に該当エントリを
  `r2Body: true` へ更新 → `generate-note-catalog.ts --apply` で再生成する。
- **title 重複 warn** (`validate` が surface): proper (R2 本体あり) と recovered/paid スタブが同題の場合は
  同一記事の再投稿疑い。noteUrl が異なるため機械では断定できない → 本文照合の上で統廃合 (次段)。

## データ復元マニフェスト (data-provenance.json) — リライト系譜

note ランキング記事の**リライトを楽にする**ため、記事ごとに元データの系譜を残す
(blog の `source.json` の note 版)。**データ本体はコピーしない** — stats47 R2 の観測値 SSOT
(`app/ranking/<key>/values.json`) を指すマニフェストだけを R2 の記事ディレクトリに置く
(二重 SSOT を作らない / 完全DBレス準拠)。リライト時に「どの ranking の何年か」を辿って
チャート再生成・数値検算ができる。

- **新規記事**: `post-note-ranking` の Step 7.5 が `data-provenance.json` を生成 → 既存 sync で R2 へ。
- **既存記事の backfill**: `node .claude/scripts/note/catalog/backfill-note-data-provenance.mjs`
  - slug (`a-<key>`) + draft.md の `stats47.jp/ranking/<key>` リンク + values.json の rank1/47 値照合で
    rankingKey/年を**決定的に導出** (捏造しない)。`.local/r2/note/<vertical>/<slug>/data-provenance.json` に staging。
  - 分類: `confirmed` (rank1+47 一致) / `partial` (D 系など一部不一致・要目視) / `no-chart` / `no-r2`。
  - **実測 (2026-07-15)**: stats47-note 187 件中 confirmed 8 / partial 4 / no-chart 16 / **no-r2 159**。
    no-r2 159 は `recovered-*` = note.com URL 回収スタブで **R2 記事本体が無く provenance を貼れない**
    (published index の実態。カタログ+backfill で初めて可視化)。実 backfill 対象は R2 本体を持つ生成記事。
- **R2 反映**: staging (`.local/r2/note/**`) → S3 push は **creds を持つ CI / セッション**で
  `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix note` (R2 書き込みは CI 専任)。

## 次段 (downstream 移行・今回スコープ外)

- `build-note-published-index.mjs` (R2 fetch 版) を `generate-note-catalog.ts` に置換
- `inject-magazine-url.cjs` / `add-koumuin-magazine-footer.cjs` をカタログ駆動化
- `validate` を pre-commit / CI に配線
- 既存コーパスの重複 (`recovered-*` / `paid-*` の title 重複) の統廃合
