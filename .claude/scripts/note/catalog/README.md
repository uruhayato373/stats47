# note 記事の管理 (台帳・本文・作業場)

note の全記事 (公開済み + 下書き) を、**記事 ID (key) の台帳 1 つ**と **R2 の本文**で管理する。
管理者は **note-manager** agent。2026-10-13 に TS カタログ・docs/31 の git 管理・CI 同期を廃止してこの形にした。

## 何がどこにあるか

| データ | 正本 | 形 |
|---|---|---|
| 記事の ID と編集メタ (vertical / series / magazine / 有料・価格 / 状態 / noteUrl / 公開日 / 送客先) と**本文の所在** | `data/note/articles.json` | git の JSON + `articles.schema.json` |
| マガジン定義 (名称 / 有料無料 / 束ねる vertical / URL / 商品導線) | `data/note/magazines.json` | git の JSON + `magazines.schema.json` |
| 本文と画像 (draft.md・SVG・PNG・chart-data.json など記事ディレクトリの全ファイル) | **無料 = 公開 R2・有料 = private R2** の `<r2Path>/` | R2 |
| 保存の履歴 (ファイル名→SHA のマニフェスト・上書き前の旧ファイル) | private R2 `note-archive/manifests/<key>/<sha>.json`・`note-archive/blobs/<sha>` | R2 (不変) |
| カバー画像 (候補 / 採用 / 公開の対応) | private R2 + `data/note/cover-assets.json` | 下の「公開カバー」 |
| 有料記事の無料部分の文言 | `data/note/paid-landing/<key>.json` + `paid-landing.schema.json` | git の JSON |
| 公開 URL の索引・下書き索引 | (派生) `data/note/note-published-urls.json`・`note-draft-index.json` | `generate-note-catalog.ts` が台帳から作る |

- **docs/31_note記事原稿 は作業場**で、git に何も置かない (`.gitignore` 済み)。作業コピーは `checkout` で取り出し、
  `save` で R2 へ戻すと消える。git には台帳 (所在とマニフェストの SHA) だけが残る。
- 本文の所在 `body.store` は 3 種類。`r2-public` (無料記事)・`r2-private` (有料記事)・`note-only` (本文が note.com にしか無い回収待ち)。
  **有料記事を `r2-public` にする台帳は Schema が拒否する。** `body.manifest` が null なのは「まだ保存していない」記事
  (本文未作成の下書きなど)。公開済みで null は検査が止める。
- `catalog/index.ts`・`magazines.ts` は台帳を読んで型を付けるだけの層。`NOTE_ARTICLES[].r2Body` は台帳に書かない派生値
  (`body.manifest` があれば true)。

## 作業手順 (`npm run note:article -- <command>`)

```bash
npm run note:article -- status                     # 台帳の所在と、作業コピーが保存済みと同じか (通信なし)
npm run note:article -- checkout <key>             # R2 → docs/31 の作業コピー (未保存の変更があれば止まる。捨てるなら --force)
# … 作業コピーを編集・画像を生成・note へ公開 …
npm run note:article -- save <key>                 # 作業コピー → R2 (読み戻し SHA 照合) → 台帳の manifest 更新 → 作業コピー削除
npm run note:article -- verify [--keys a,b] [--deep] [--record]   # 台帳と R2 の照合 (--deep は全ファイルの SHA)
npm run note:article -- adopt <key>                # 台帳の外で R2 に置かれた本文を、そのまま台帳に取り込む
npm run note:article -- sources [--unlinked]       # 教材 (参考文献) の note 企画と記事の結び付きを教材ごとに数える
```

- **新しい記事**: 台帳に 1 レコード足す (状態 `draft`・`body: {store, manifest: null}`) → 作業コピーを作る → `save`。
  家計シリーズは `build-kakei-catalog-entries.mjs`、商品の販売記事は product-factory の `promote` が台帳レコードを作る。
- **教材 (参考文献) の企画から作るとき**: 記事レコードの `sourceAnalyses` に企画 ID (`data/source-inventory/<sourceKey>/<edition>/analyses.json` の
  `analyses[].id`) を書く。書き込み時に ID の実在と、企画の `contentRoles` に note があることを検査する。見送る企画は企画側の `contentRoles` から note を外す。
- **公開したとき**: 台帳の `status: "published"`・`noteUrl`・`publishedAt` を書き、作業コピーに変更があれば `save`。
  公開記録を R2 の draft.md frontmatter に書き戻す旧手順 (`migrate-note-frontmatter.mjs`) は廃止した。
- **有料記事**: `save` が最初から private R2 に保存する。公開 R2 には何も置かない
  (旧 `publish-paid-note-private-r2.ts` が置いていた `public.json` は読み手が無く、新規には作らない。既存分は検査が許容する)。
- **別の端末**: `git pull` で台帳を合わせてから `checkout`。他の端末が先に保存していて R2 の実体が台帳の記録と違うと、
  `save` は上書きせずに止まる。
- 書き込みは `lib/article-ledger.mjs` の `updateArticleLedger` / `writeArticleLedger` だけ (Schema・キー重複・マガジン参照を検査してから書く)。
  派生インデックスは台帳を変えたら `npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts --apply`。
  PR と pre-commit は `--check` で台帳とのずれを止める。

## 検査

| 検査 | 入口 | 場所 |
|---|---|---|
| 台帳の Schema・参照整合・title 重複 | `npm run note:catalog:validate` | PR (note Catalog Contract Gate) |
| 派生インデックスが台帳と一致 | `npm run note:catalog:check` | PR・pre-commit |
| docs/31 に追跡ファイルが無い | `npm run note:images:audit` | PR・pre-commit |
| 公開 R2 の本文・生成 AI 背景の実在 | `npm run note:images:audit -- --verify-r2` | 週次 (`note-circulation-audit-weekly.yml`) |
| 台帳と R2 (private を含む) の照合 | `npm run note:article -- verify` | ローカル (R2 の S3 認証が要る) |
| 保存・衝突・退避の仕組み | `npm run note:article:test` | PR |

`validate-note-catalog.ts` の規則: **error** は key 重複 / 未登録マガジンキー / マガジンの vertical 不一致 / published なのに noteUrl 無し、
**warn** は title 重複の疑い / 有料マガジンに無料記事 / isPaid だが priceJpy 未設定 / stats47Targets が KNOWN_RANKING_KEYS に不在。

## 本文が note.com にしか無い記事 (`body.store: "note-only"`)

`recovered-*` / `paid-*` の多くは、note.com から URL だけ回収した記事で、R2 に本文が無い (2026-10-13 時点 73 本)。
`r2Path` は note ID から機械生成した予定地で、実体は無い。本文を note.com から取得して作業コピーに置き、
`body.store` を `r2-public` (無料) か `r2-private` (有料) に変えてから `save` する。回収は `NOTE-BODY-RECOVERY-01`。
同題の記事が 2 本あれば同一記事の再投稿の疑いがある (`validate` の title 重複 warn)。本文を照合して統廃合する。

## マガジン運用 (「類似記事を無料マガジンに束ねる」)

- 無料キュレーション (`isPaid: false`) は回遊導線で、有料記事を含めてよい。有料メンバーシップ (`isPaid: true`) は有料記事を束ねる収益ライン。
  koumuin 系の有料マガジンは note.com の buy-once 型で無料記事も束ねる (validate の「有料マガジンに無料記事」warn は想定内)。
  `koumuin-claude-code` は stats47-note に回収された旧 URL の有料メンバーも販売継続中。
- stats47-note は e-Stat 17 カテゴリに 1:1 対応する `s47-*` マガジン + 行動者率クラスタ `s47-sports-culture` で束ねる。
  新しい記事は既存のカテゴリマガジンに足す。一括割当は `assign-magazines-by-title.mjs` (タイトル分類・決定的)。
- `s47-kakei-reading` (2026-09-06 新設) は軸が違う「方法のマガジン」で、家計調査の支出額の読み方 (県別プロファイル 47 本と
  読み違いを正す論点記事) を束ねる。分類側 (`s47-economy`) は県別ランキング型の記事を持ち続け、粒度を壊さない。
- 手順: `magazines.json` に定義 → 記事レコードの `magazine` を設定 → `validate` → note.com でマガジンを作ったら `noteUrl` を書き戻す。

公開記事のカバー状態は`npm run note:covers:audit`で測定する。カタログと公開一覧の和集合を
v3記事詳細APIで確認し、一覧サムネイルに代用された本文画像を設定済みと誤認しない。
`data/note/evidence/note-cover-audit-latest.json`が最新の観測結果（時刻・完全性付き）であり、
カバー状態を記事台帳に手入力して同期しない。終了コードは0=合格、1=未設定/集合差分、2=不完全。

カバーと新しいインプレッション/PVの突合は`npm run note:metrics:fetch`を使う。
`data/note/dashboard/cover-metrics-latest.{json,csv}`へ公開記事の棚卸しを出力する。
期間内に一覧行がない記事は指標nullで残し、全体をincompleteとする。旧viewsへ変換しない。
収集契約・期間指定は[fetch-note-metrics](../../../skills/analytics/fetch-note-metrics/SKILL.md)を参照する。


## カバー制作・画像専用更新の実装

`cover-designs.ts`が既存維持リスト・短い見出し・補足の編集判断を持つ。画像は派生物。
`../generate-cover-refresh.ts`は共有`note-cover-render.ts`のeditorial rendererを使い、
既存GISの県輪郭/日本地図を配置する。家計調査は2024年の47都市観測値から単純平均と増減率を再計算し、
記事のchart-dataと一致する場合だけ描く。県名と調査対象都市名を併記する。

一時領域の`before/`、`inventory.json`、検算入力`sources/`、制作物`after/`、`production-manifest.json`は
生成時の入力と検査結果であり、正本として保持しない。remote保管・読み戻しSHA検証後に削除する。
共通画像台帳には記事ID・画像SHA・版・1280×670・文字境界/重なりの根拠・目視判定を保存する。
Satoriは文字をpath化するため、SVGの`text`要素検索だけで合格させず、`onNodeDetected`の実レイアウトで検査する。
再生成すると目視判定はpendingへ戻る。PNGを手修正してもhashが変わり反映ゲートで止まる。

`../update-note-covers.mjs`は採用済みremote版と現在の公開画像を検査する。`--commit`で実際に変更し、
`--keys`/`--limit`で範囲を絞れる。stats47アカウント・記事台帳の記事URL・公開前の内容を照合した後、
実際のエディタで観測した`POST /api/v1/image_upload/note_eyecatch`へ画像だけを送る。
`note_id`はv3詳細の数値`id`であり、`n...`形式のkeyではない。FormDataはnote_id/file/width/heightの4項目、
`X-Requested-With: XMLHttpRequest`が必要。note側のPNG減色を許容し、取得した配信画像も1280×670へ正規化して画素差を照合する。

履歴は`data/note/evidence/note-cover-refresh-<version>.json`。本文自体を保存せず、前後の保全項目hash・
旧新URL・制作画像SHA・変更時刻・配信検証結果を記録する。確定済みは再送しない。応答不明は停止して照合する。
仕上げに`../verify-cover-refresh.mjs [--keys <key>]`で共通画像台帳からカバー監査と前後照合を実行する。
改修は`cover-remediation`として記録し、KPI改善の実験成功とは区別する。


## 公開カバーの制作と差し替え

画像の正本は非公開R2、台帳は `data/note/cover-assets.json`、形の契約は同ディレクトリのJSON Schema。
公開済み記事もドラフトも記事keyで結び、タイトルや分類は記事台帳から読む。
管理画面の `/content/note/covers` と `/assets` は共通台帳を読む。特定PCのPNGや絶対パスに依存しない。

1. 新規catalog登録後は `npm run note:assets -- seed`。現在の公開画像は `archive --keys <key>` で保全する。
2. `prepare --keys <key1,key2> --output /tmp/<task>` で一時入力を取得する。draftは `note:article checkout` で取り出した作業コピーを使う。
3. `node --import tsx .claude/scripts/note/generate-cover-refresh.ts --output /tmp/<task> --version <版>`。
   文字境界/重なり/数値を検算し、private R2へ保存・読み戻しSHAを確認する。成功後は一時入力を削除する。
4. 管理画面で320px相当の縮小表示を確認後、`npm run note:assets -- review --keys <key> --revision <sha> --status pass --reason <理由>`。
   要修正なら `--status needs-revision`。新しい候補に旧版の承認を引き継がない。
5. 既存記事は `node .claude/scripts/note/update-note-covers.mjs --keys <key>` でdry-runする。
   明示された差し替え時だけ `--commit` を付け、画像専用POSTと本文/価格/有料境界の保全・配信確認後に公開ポインタを更新する。
   Windowsは`note-session.mjs`の専用Playwright profileで投稿先を照合し、未ログイン時は`login-note-profile.mjs`で人がログインする。
   再開は同じ`--keys`を指定する。採用版からjournalを識別し、完了行は送信せず、応答不明のPOSTは検査するまで再送しない。
6. `node .claude/scripts/note/verify-cover-refresh.mjs --keys <key>` と `npm run note:assets:validate` で整合を確認する。

旧manifestは `note:assets import --manifest <path>`、旧public R2は `archive-r2 --keys <key>` で移行できる。
旧manifestの絶対パスは入力にだけ使用し、旧レビューは自動採用せず未判定で登録する。未回収の版は `missingVersions` に残す。
認証は既存S3環境変数または `wrangler login` のセッション。署名URLや認証情報を台帳に保存しない。

## 禁止事項

| NG | OK |
|---|---|
| docs/31 の原稿・画像を git に追加する | `note:article save` で R2 へ保存し、台帳にマニフェストを記録する |
| R2 の記事本文を `diff-push-r2`・`wrangler r2 object put`・独自スクリプトで直接書く | `note:article save` (衝突検査と旧版の退避を通る) |
| `note-published-urls.json` / `note-draft-index.json` を手編集する | 台帳を編集 → `generate-note-catalog.ts --apply` |
| 有料記事の本文を公開 R2 に置く | `body.store: "r2-private"` (Schema が強制) |
| マガジンキーを記事レコードに直書きで増やす | `magazines.json` に登録してから参照 |

## データ復元マニフェスト (data-provenance.json) — リライト系譜

note ランキング記事の**リライトを楽にする**ため、記事ごとに元データの系譜を残す
(blog の `source.json` の note 版)。**データ本体はコピーしない** — stats47 R2 の観測値 SSOT
(`app/ranking/<key>/values.json`) を指すマニフェストだけを R2 の記事ディレクトリに置く
(二重 SSOT を作らない / 完全DBレス準拠)。リライト時に「どの ranking の何年か」を辿って
チャート再生成・数値検算ができる。

- **新規記事**: `post-note-ranking` の Step 7.5 が作業コピーに `data-provenance.json` を生成し、`note:article save` で R2 へ保存する。
- **既存記事の backfill**: `node .claude/scripts/note/catalog/backfill-note-data-provenance.mjs`
  - slug (`a-<key>`) + draft.md の `stats47.jp/ranking/<key>` リンク + values.json の rank1/47 値照合で
    rankingKey/年を**決定的に導出** (捏造しない)。`.local/r2/note/<vertical>/<slug>/data-provenance.json` に staging。
  - 分類: `confirmed` (rank1+47 一致) / `partial` (D 系など一部不一致・要目視) / `no-chart` / `no-r2`。
  - **実測 (2026-07-15)**: stats47-note 187 件中 confirmed 8 / partial 4 / no-chart 16 / **no-r2 159**。
    no-r2 159 は `recovered-*` = note.com URL 回収スタブで **R2 記事本体が無く provenance を貼れない**
    (published index の実態。カタログ+backfill で初めて可視化)。実 backfill 対象は R2 本体を持つ生成記事。
- **R2 反映**: backfill の staging を記事の作業コピーへ置き、`note:article save <key>` で保存する
  (台帳のマニフェストが更新される。`diff-push-r2` で記事本文を直接書かない。旧 `manifest.json` 依存は NOTE-PROVENANCE-BACKFILL-MANIFEST-01)。
