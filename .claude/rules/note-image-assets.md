---
paths:
  - "data/note/**"
  - "apps/admin/lib/server/note-covers.ts"
  - "docs/31_note記事原稿/**"
  - ".claude/scripts/note/**"
  - ".claude/skills/note/**"
  - ".claude/agents/note-manager.md"
---
# note 原稿の画像・データ資産の置き場 (2026-09-29)

## 正本の保管と画像台帳 (2026-10-02 オーナー決定)

**画像をローカルだけで管理しない。** 生成・確認・アップロード時の一時ファイルは許容するが、
`.local/` や特定PCのディレクトリを画像・レビュー・manifestの唯一の保存先にしない。
「再生成できる」はレビューした版を保存しなくてよい理由にしない。

- noteカバーの生成候補・採用版・noteに登録した実体は、版ごとに非公開R2へ保存する。公開サイトが直接読む画像だけpublic R2へ配信する。生成AIの元画像・候補をDriveへ置く既存契約は維持し、同じ画像の正本を複数持たない。
- 画像台帳とJSON Schemaは **`data/note/`** に置き、gitで共有・レビューする。記事メタの既存TSカタログとは記事keyで結び、タイトル・分類を二重管理しない。`.claude/state/` の監査履歴を画像台帳の代用にしない。
- 台帳は画像の版ID、storage/providerと相対key、SHA-256、bytes、寸法、生成日時、生成元・テンプレート版、レビュー状態、候補版・採用版の参照、note公開URL・公開画像URL・最終確認日時・対応版を持つ。公開画像だけ観測でき、版を照合できない場合は対応版をnullとする。
- JSON Schemaで形・語彙・必須項目を検査し、専用validatorで記事key・版参照・承認状態・保存実体とSHAを検査する。ローカル絶対パス、署名付きURL、認証情報を台帳へ保存しない。
- 生成・レビュー・公開・監査・両管理画面は同じ台帳を参照する。版を上書きせず、採用版の切替を明示する。端末に画像がなくても共有ストレージから表示し、「未取得」「未生成」「未承認」「未公開」「確認が古い」を区別する。
- 保存実体とSHAを確認して台帳を切り替えるまで旧画像を削除しない。入力のSVG・コード・生成設定はgitで共有可。ローカルのPNGと作業用manifestは正本への保管確認後に一時ファイルとして扱う。

カバーの正本は `data/note/cover-assets.json`、形の契約は `cover-assets.schema.json`。
実体は `stats47-private:note/covers/<articleKey>/revisions/<sha256>.png` に不変保存する。
`cover-assets.mjs` の専用writerは保存後に読み戻したSHA/bytesを検査してから台帳を更新する。
記事集合・口座・公開URL・版参照・レビューを `npm run note:assets:validate` で検査し、
実体は `npm run note:assets -- verify` で検査する。別PCはgit台帳とR2認証だけで同じ版を表示できる。

- 既存の公開画像の保全・最新確認: `npm run note:assets -- archive [--keys key1,key2]`。
- 旧public R2保管画像の移行: `archive-r2 --keys key1,key2`。候補・採用・公開ポインタを変更しない。
- 制作入力は `prepare --keys key1,key2 --output /tmp/<task>` で一時領域へ取得し、
  `node --import tsx .claude/scripts/note/generate-cover-refresh.ts --output /tmp/<task> --version <version>` で生成する。
  文字境界/重なりを検査し、画像のremote保管と照合後に一時領域を削除する。日付だけの版上書きはしない。
- 旧manifestは `import --manifest <path>` で取り込む。ローカル絶対パスは入力だけに使い、台帳には残さない。
  旧レビューを自動継承せず未判定で登録する。回収できない旧版は `missingVersions` に残す。
- 縮小表示確認後に `review --keys <key> --revision <sha> --status pass|needs-revision --reason <理由>`。
  採用は現在の候補の正確なSHAに対してだけ行う。新しい候補に古い承認を引き継がない。
- `update-note-covers.mjs [--keys ...] [--commit]` は台帳の採用済みremote版だけを読み、
  画像専用更新と本文/価格/境界の保全・配信検証後に公開ポインタを更新する。
  `verify-cover-refresh.mjs [--keys ...]` も台帳起点で検査する。管理画面はGET専用のまま。
- `/content/note/covers` と `/assets` は同じ台帳を読む。非公開画像はlocalhostのGET proxyでSHAを照合して表示し、
  ローカル画像キャッシュを永続化しない。取得失敗・旧版未回収・未判定・未反映・観測の鮮度を表示する。
- 週次監査は完全取得した観測だけを台帳へ反映し、developへ限定commitする。失敗・不明で直前の画像を消さない。
- 汎用 `generate-ogp-images.ts --type note-covers` は書込開始前に停止する。既存のSVG/Remotion等は制作入力用の旧rendererであり、
  保存・採用・公開の正典ではない。本文チャートの再生成契約は以下に残す。

note 記事の画像は、記事で使ったデータと設定から作り直せる**派生物**である。派生物を git に置くと
リポジトリが肥大する (2026-09-29 の実測: `docs/31_note記事原稿/` の追跡 PNG 682 枚で約 153MB。
うち 519 枚 (約 140MB) は同名 SVG から再生成できた)。次の 3 層に分けて持つ。

| 層 | 置き場 | 中身 | 理由 |
|---|---|---|---|
| ① 原稿とデータ | git | `draft.md` / `chart-data.json` / `data-provenance.json` / `render-spec.json` / `tags.txt` / SVG | 小さく、差分をレビューでき、画像を作り直す入力になる |
| ② 派生画像 | git に置かない (gitignore) | SVG から作る PNG、ランキング記事の Remotion 画像 4 枚 | 再生成できる。復元コマンドがある |
| ②' 作り方の記録 | git | `render-spec.json` (ランキング記事) | `chart-data.json` の SHA・テンプレート版・色スケールを固定し、作り直しの根拠にする |
| ③ 公開時点の固定版 | R2 `note/<vertical>/<slug>/` (既存の `sync-note-r2`) | 公開した原稿一式 | 公開後の再現用。書込は CI のみ |

## 契約

1. **SVG から再生成できる PNG を追跡しない。** `docs/31_note記事原稿/` の PNG は、同名 SVG が追跡されていれば `.gitignore` の
   系列パターン (`a-kakei-*` / `b-kakei-*` / `koumuin-*`) が除外する。復元は
   `npm run note:images:regen -- --slug <記事ディレクトリ名>` (変換は `.claude/scripts/lib/svg-to-png.cjs` に一本化)。
   公開 (`/publish-note`) と `sync-note-r2` の前に、PNG が無ければ復元してから使う。
2. **無視される PNG には必ず再生成元を置く。** 再生成元は同名 SVG か、ランキング記事の `render-spec.json` + `chart-data.json`。
   どちらも無い PNG が無視されると git に載らず失われる。再生成元を持たない画像 (`product-sales`) は追跡のままにする。
3. **ランキング記事は `chart-data.json` と `data-provenance.json` だけでデータを復元できる。**
   `chart-data.json` は 47 行 (rank 1..47 の連番・area_code 47 種・数値 value)、`copy.{canonicalTitle,readerLabel,hook}`、
   `summary.{mean,stddev,topBottomRatio}`、**`unit`** (画像の再描画に必要。単位なしは空文字を明示) を持つ。
   `data-provenance.json` は `source` が R2 の `app/stats/<key>/values.json` を指し、`restore` を持つ。
   観測値の本体は R2 が SSOT で、ここはその記事が使った値の**固定コピー** (R2 の値が後で更新されても、公開時の数値を辿れる)。
4. **再生成元を持たない追跡 PNG は増やさない。** 追跡 PNG の総量は `.claude/config/note-image-assets-budget.json` の予算を超えない。
   予算は縮小専用で、下げるときは `npm run note:images:audit -- --write-budget`。増やす場合だけ `--allow-increase` を付け、理由をコミットに残す。
5. **画像の作り方を変えたら、既存記事の画像も作り直す。** テンプレートだけ直して過去記事を放置しない。

6. **「R2 に本文がある」はカタログの申告でなく実在で確かめる。** 2026-09-29 の実測で、`note-published-urls.json` が
   `r2_body:true` とする a-* 14 本の `draft.md` が R2 (`storage.stats47.jp/note/…`) に無く、git の `docs/31` が唯一の実体だった。
   原因は、カタログの `r2Body` 既定が `true` (「R2 に本体あり」) で、登録しただけで同期されないまま「保存済み」になっていたこと。
   該当 65 記事は `r2Body: false` にして `sync-note-r2` (CI) の対象へ戻した。以後は週次の `--verify-r2` が新しい欠落を止める。
   `r2BodyMissingKnown` (予算ファイル) は、直せない既知の欠落を一時的に許す縮小専用の一覧 (現在は空)。

7. **生成 AI (imagegen / Codex) の画像は「作り直せない入力」なので保管する。** 同じ指示でも毎回別の絵になり、時間も枠も使うため。
   二層で持つ (Kindle の表紙背景と同じ考え方。`.claude/rules/coconala-product-standards.md`「カバー画像は二層」)。
   - **Drive (非公開・人が見る)**: 候補・元画像 `stats47/note画像/<slug>/candidates/`。
   - **R2 (承認した最終版だけ)**: `media/note-backgrounds/<slug>/<sha12>/background.jpg` (1280x670 JPEG)。
   - **git (`render-spec.json` の `background`)**: `sha256` / `r2Key` / 寸法 / `model` / `prompt` / `status: "approved"` だけ。画像本体は置かない。
   - 文字・数値・地図は生成画像に含めず、テンプレートが実テキスト/実データで重ねる (家ルール。`ogp-image-standards.md` §5)。
   手順は `node .claude/scripts/note/ingest-note-background.mjs` の先頭コメントに従う (候補を Drive へ `--stash` → 採用を正規化して
   `--write-spec` → R2 反映 → `render-ranking-images.mjs`)。`render-ranking-images.mjs` は背景を取得して SHA を検証し、合わなければ
   画像を作らず止まる (別の背景で焼かない)。生成 AI は再実行しない。現状、背景を使うのはカバーだけ。
8. **SVG は git に置く。** SVG は画像の正本で、テキスト・小さく (追跡分の合計は約 1.5MB)・差分が読める。koumuin シリーズの 268 枚は
   手作りの図版で作り直せない。PNG のように外すと正本を失うので外さない。

9. **画像の生成口は 1 つ、公開前に必ず揃える。** ランキング記事の 4 枚は `render-ranking-images.mjs` だけが作る
   (`apps/remotion` の `pipeline:sns` は note 画像を作らない。`--note-only` は廃止して呼ぶと止まる。二つの経路で作ると内容が食い違う)。
   公開・更新の入口 (`publish-new-note.sh` / `editor-helpers.sh`) は `ensure-note-images.mjs` で PNG を作り直し、足りなければ止まる
   (カバー無しのまま黙って公開しない)。
10. **決定的であることを保つ。** 同じ入力から `render-ranking-images.mjs` は同じバイト列を作る (2026-09-30 に同一 SHA を実測)。
    テンプレートに時刻・乱数・外部取得を入れない。入れるなら入力として spec に固定する。

## 機械検査 (`npm run note:images:audit`)

| コード | 意味 |
|---|---|
| `DERIVED_PNG_TRACKED` | 同名 SVG から再生成できる PNG を追跡している |
| `IGNORED_PNG_WITHOUT_SVG` | gitignore された PNG に再生成元の SVG が無い (作業ツリーでのみ検出) |
| `RANKING_CHART_DATA_INVALID` / `RANKING_PROVENANCE_INVALID` | 契約 3 の欠落 |
| `RENDER_SPEC_INVALID` | `render-spec.json` が無い・`chart-data.json` の SHA やテンプレート版が現行と不一致 (画像を作り直していない) |
| `TRACKED_PNG_OVER_BUDGET` | 追跡 PNG が予算を超えた |
| `NOTE_BACKGROUND_MISSING` | `render-spec.json` の背景が R2 に無い (`--verify-r2`・週次。作り直せない入力が失われている) |
| `NOTE_R2_BODY_MISSING` | `r2_body:true` の記事が R2 に無い (`--verify-r2`・ネットワーク要・週次のみ。通信失敗は 0 件扱いにせず exit 2) |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の
`note-image-assets`・週次 (`note-circulation-audit-weekly.yml` の artifact `note-image-assets.json`)。
`/weekly-review` は `npm run note:images:audit -- --json` の `summary` を読む。
既存の `check-asset-policy.cjs` は、`docs/31` の派生 PNG が CI checkout に無いことを欠落 (`MISSING_REFERENCE`) と扱わない。

## ランキング記事の画像 4 枚 (cover / choropleth / chart / boxplot)

`node .claude/scripts/note/render-ranking-images.mjs <rankingKey>` が `chart-data.json` だけから 4 枚を作り、`render-spec.json` を書く
(`--all` 全記事 / `--stale` 古い記事だけ / `--check` 検査のみ)。R2 や `.local` のデータは読まない。

- テンプレートは `apps/remotion/src/features/ranking-note/` (note 専用)。X・Instagram と共有する `ranking-x/` は変えない
  (`RankingBoxplot` にだけ opt-in の `marginLeft` / `niceTicks` を足した。省略時は従来と同じ出力)。
- **色は値でなく順位で決める。** 値で塗ると、東京都・北海道のような外れ値が 1 県あるだけで残り 46 県が同じ薄い色になる。
- props 欠落時は別指標のモックに落ちず例外にする (他記事のデータで画像が焼かれる事故を防ぐ)。
- **見た目を変えたら** `.claude/scripts/note/lib/note-render-spec.mjs` の `NOTE_RENDER_TEMPLATE_VERSION` を上げ、
  `render-ranking-images.mjs --stale` で全記事を作り直す。上げ忘れても、古い spec は `RENDER_SPEC_INVALID` で止まる。
- Remotionのカバー出力も制作入力であり、画像の保存・採用の正典は共通画像台帳。公開済み記事のカバー一括差し替えは
  `NOTE-COVER-ROLLOUT-20260928` が持ち、共通画像台帳の現在の候補SHAに対する採用ポインタが実際に note へ載せる画像を決める。
