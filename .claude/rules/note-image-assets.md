---
paths:
  - "data/note/**"
  - "apps/admin/lib/server/note-covers.ts"
  - ".claude/scripts/note/**"
  - ".claude/skills/note/**"
  - ".claude/agents/note-manager.md"
---
# note 記事の画像・データ資産の置き場 (2026-09-29・2026-10-13 改訂)

## 正本の保管と画像台帳 (2026-10-02 オーナー決定)

**画像をローカルだけで管理しない。** 生成・確認・アップロード時の一時ファイルは許容するが、
`.local/` や特定PCのディレクトリを画像・レビュー・manifestの唯一の保存先にしない。
「再生成できる」はレビューした版を保存しなくてよい理由にしない。

- noteカバーの生成候補・採用版・noteに登録した実体は、版ごとに非公開R2へ保存する。公開サイトが直接読む画像だけpublic R2へ配信する。生成AIの元画像・候補をDriveへ置く既存契約は維持し、同じ画像の正本を複数持たない。
- 画像台帳とJSON Schemaは **`data/note/`** に置き、gitで共有・レビューする。記事台帳 `data/note/articles.json` とは記事keyで結び、タイトル・分類を二重管理しない。監査の記録 (`data/note/evidence/`) を画像台帳の代用にしない。
- 台帳は画像の版ID、storage/providerと相対key、SHA-256、bytes、寸法、生成日時、生成元・テンプレート版、レビュー状態、候補版・採用版の参照、note公開URL・公開画像URL・最終確認日時・対応版を持つ。公開画像だけ観測でき、版を照合できない場合は対応版をnullとする。
- JSON Schemaで形・語彙・必須項目を検査し、専用validatorで記事key・版参照・承認状態・保存実体とSHAを検査する。ローカル絶対パス、署名付きURL、認証情報を台帳へ保存しない。
- 生成・レビュー・公開・監査・両管理画面は同じ台帳を参照する。版を上書きせず、採用版の切替を明示する。端末に画像がなくても共有ストレージから表示し、「未取得」「未生成」「未承認」「未公開」「確認が古い」を区別する。
- 保存実体とSHAを確認して台帳を切り替えるまで旧画像を削除しない。入力のSVG・コード・生成設定はgitで共有可。ローカルのPNGと作業用manifestは正本への保管確認後に一時ファイルとして扱う。

カバーの正本は `data/note/cover-assets.json`、形の契約は `cover-assets.schema.json`。
実体は `stats47-private:note/covers/<articleKey>/revisions/<sha256>.png` に不変保存する。
制作根拠のJSONも同じprivate R2の `note/covers/<articleKey>/inputs/<sha256>.json` に不変保存し、
台帳の `provenance.input` と `quality.evidenceSha256` を同じSHAで結ぶ。`verify` は画像と入力の両方を照合する。
入力には使った47県分の固定値・単位・対象年・出典URL/SHA・文字組み・配色・地理データ/renderer/fontのSHAを残す。
`cover-assets.mjs` の専用writerは保存後に読み戻したSHA/bytesを検査してから台帳を更新する。
記事集合・口座・公開URL・版参照・レビューを `npm run note:assets:validate` で検査し、
実体は `npm run note:assets -- verify` で検査する。別PCはgit台帳とR2認証だけで同じ版を表示できる。

- 既存の公開画像の保全・最新確認: `npm run note:assets -- archive [--keys key1,key2]`。
- 旧public R2保管画像の移行: `archive-r2 --keys key1,key2`。候補・採用・公開ポインタを変更しない。
- 制作入力は `prepare --keys key1,key2 --output /tmp/<task>` で一時領域へ取得し、
  `node --import tsx .claude/scripts/note/generate-cover-refresh.ts --output /tmp/<task> --version <version>` で生成する。
  文字境界/重なりを検査し、画像のremote保管と照合後に一時領域を削除する。日付だけの版上書きはしない。
  問い型など本文を制作入力に使わないカバーは `prepare --source ledger` で保存済み公開版を比較元にできる。
  公開URLと版IDの一致・remote SHAを確認し、公開サイトへの新規反映を意味する観測として扱わない。
- 旧manifestは `import --manifest <path>` で取り込む。ローカル絶対パスは入力だけに使い、台帳には残さない。
  旧レビューを自動継承せず未判定で登録する。回収できない旧版は `missingVersions` に残す。
- 縮小表示確認後に `review --keys <key> --revision <sha> --status pass|needs-revision --reason <理由>`。
  採用は現在の候補の正確なSHAに対してだけ行う。新しい候補に古い承認を引き継がない。
- `update-note-covers.mjs [--keys ...] [--commit]` は台帳の採用済みremote版だけを読み、
  画像専用更新と本文/価格/境界の保全・配信検証後に公開ポインタを更新する。
  `verify-cover-refresh.mjs [--keys ...]` も台帳起点で検査する。管理画面はGET専用のまま。
- `/content/note/covers` と `/assets` は同じ台帳を読む。非公開画像はlocalhostのGET proxyでSHAを照合して表示し、
  ローカル画像キャッシュを永続化しない。取得失敗・旧版未回収・未判定・未反映・観測の鮮度を表示する。
- Wrangler OAuthの期限切れは、既存sessionを非対話で更新し、同時画像取得は1回の更新を共有する。
  更新後の認証を読み直し、子プロセスもTLSを検証する。失効などで更新不能なら接続案内を表示して停止する。
- 週次監査は完全取得した観測だけを台帳へ反映し、developへ限定commitする。失敗・不明で直前の画像を消さない。
- 汎用 `generate-ogp-images.ts --type note-covers` は書込開始前に停止する。既存のSVG/Remotion等は制作入力用の旧rendererであり、
  保存・採用・公開の正典ではない。本文チャートの再生成契約は以下に残す。

### 問い型ランキングのカバー

分類SSOTの `ranking-question` 全記事は同じ `question-ranking-note-cover-v1` rendererを使う。
淡い背景・大きな問い・答え・対象年・薄い日本地図を配置し、カバーに凡例・単位・数値範囲を載せない。
地図はD3 `interpolateYlOrRd` と連続線形スケールで実際の値を塗り分け、本文チャートの順位配色とは区別する。
長い主題は資格条件や助詞を失わず2行にし、同率1位は全て表示する。
既存 `chart-data.json` は全47県・年・値を照合して使用する。単位欠落は一致を確認した元データから補う。
固定コピーが無い回収記事もカタログの `stats47Targets` から対象ランキングと記事の年を明示解決し、
private R2の制作入力に固定する。最新年への自動切替・公開原稿一式の無断上書きは行わない。
文字検査はSatoriの `textContent` を読む。空の検査結果をPASSにせず、境界・重なりを検査してから登録する。

### 分類別のカバー (2026-10-11)

問い型・家計以外の分類も `generate-cover-refresh.ts` の `categoryCover` が分類ごとに描く。文言と図の対応は git TS
(`catalog/cover-designs.ts`・`catalog/ranking-story-cover-copy.ts`) が正本で、部品は `lib/cover-visuals.ts`。

- ranking-story・intro: 記事の題名 (一部は無料本文) にある順位・値・格差だけを大きく出す。地図は値を持たない背景。
- practitioner: シリーズ (vertical) ごとの名前・話数・色で見分ける暗色の型。
- explainer: 記事が公開R2に載せている図を1枚入れる。dataset-geo: 記事のGeo集計 (`app/geo/<slug>/item.json`) か公開ランキングの47県値で塗った県別地図。
- palette: 章が扱うD3配色を `d3-scale-chromatic` から描いた色見本。
- 書き出しは自前で256色に減色したPNGを既定にする。noteは受け取ったPNGを256色に変換し、暗い地に半透明を重ねたRGBA画像では
  色が反転した (平均画素差17.6/255)。自前の減色は元画像との差0.005。
- これとは別に、noteは保存時にまれに画像の下部へ色付きの帯を入れる (2026-10-11 実測: 減色版66件中2件・フルカラー版17件中1件)。
  形式によらないので、公開後検証で落ちた記事は下の手順で別版を上げ直す (上げ直した版はすべて合格)。
- 登録前に `--local-review` で描画だけ行い縮小表示で全件を見る。描画は決定的なので、登録後のSHAが確認版と一致することを再描画で確かめてからレビューを付ける。
- macOS で `update-note-covers.mjs` を Profile 5 (browser-use) ではなく Playwright の専用プロファイルで動かすときは
  `NOTE_COVER_BROWSER=playwright` を付ける (Claude アプリから Chrome の Profile 5 が読めない環境向け)。
- 公開後の検証で画像差が出た操作は再実行しない。公開画像を点検し、新しい版を作ったうえで作業記録の操作を
  `status: superseded` + `supersededBy` + `inspection` で閉じる (点検記録の無い superseded は閉じたことにならない)。
  上げ直しは、もう一方の形式 (`NOTE_COVER_PNG=truecolor` で透過なしフルカラー、無指定で減色) で別版を作り、
  確認済み版との平均画素差 (0.5/255 以下) を測ってからレビューし、`archive` で公開ポインタを合わせて反映する。

## 記事の本文と画像の置き場 (2026-10-13 オーナー決定)

記事の本文・画像・データ (draft.md・SVG・PNG・chart-data.json・render-spec.json など記事ディレクトリの全ファイル) の
**正本は R2 だけ**に置く。無料記事は公開 R2、有料記事は private R2 の `note/<vertical>/<slug>/`。
所在とファイル一覧のマニフェストの SHA は記事台帳 `data/note/articles.json` が持つ。
`docs/31_note記事原稿/` は git に何も置かない作業場で、`npm run note:article -- checkout <key>` で取り出し、`save <key>` で戻す。
置き場と手順の正典は [catalog/README.md](../scripts/note/catalog/README.md)。

それまでの「原稿と SVG は git、派生 PNG は gitignore、公開時点の版は CI が R2 へ」という 3 層は廃止した。
git に置くと有料記事の行き場が無く (公開 R2 に置けない)、docs/31 に 123 本・861 ファイルが溜まり、R2 と git のどちらが新しいかが
記事ごとに食い違っていた (2026-10-13 の移行時の実測: 54 本で内容が異なり、うち 1 本は R2 の方が新しかった)。

## 契約

1. **docs/31 に追跡ファイルを置かない。** 作業コピーは `.gitignore` 済み。保存は `note:article save` だけで、R2 へ読み戻して SHA を照合し、
   台帳のマニフェストを更新してから作業コピーを消す。旧版は private R2 の `note-archive/` に残る (git の履歴の代わり)。
2. **派生 PNG は作業コピーで作り直してよいが、保存すると R2 の正本になる。** SVG から作る PNG の復元は
   `npm run note:images:regen -- --slug <記事ディレクトリ名>` (変換は `.claude/scripts/lib/svg-to-png.cjs` に一本化)。
   公開 (`/publish-note`) の前に PNG が無ければ復元してから使う。SVG は手作りの図版 (koumuin シリーズの 268 枚など) を含む正本で、
   PNG と一緒に R2 に置く。
3. **ランキング記事は `chart-data.json` と `data-provenance.json` だけでデータを復元できる。**
   `chart-data.json` は 47 行 (rank 1..47 の連番・area_code 47 種・数値 value)、`copy.{canonicalTitle,readerLabel,hook}`、
   `summary.{mean,stddev,topBottomRatio}`、**`unit`** (画像の再描画に必要。単位なしは空文字を明示) を持つ。
   `data-provenance.json` は `source` が R2 の `app/stats/<key>/values.json` を指し、`restore` を持つ。
   観測値の本体は R2 が SSOT で、ここはその記事が使った値の**固定コピー** (R2 の値が後で更新されても、公開時の数値を辿れる)。
   `note:article save` が保存前に検査して警告を出す (旧記事の不備で保存を止めない)。
4. **画像の作り方を変えたら、既存記事の画像も作り直す。** テンプレートだけ直して過去記事を放置しない。
5. **「R2 に本文がある」は台帳の申告でなく実在で確かめる。** 台帳の `body.manifest` は保存して読み戻せたときだけ書かれる。
   週次の `--verify-r2` が公開 R2 の配信を、`note:article verify` が private を含む全ファイルを照合する。
   (2026-09-29 に、カタログの `r2Body` 既定が `true` で、登録しただけで「保存済み」になっていた a-* 14 本が R2 に無かった。)
6. **生成 AI (imagegen / Codex) の画像は「作り直せない入力」なので保管する。** 同じ指示でも毎回別の絵になり、時間も枠も使うため。
   二層で持つ (Kindle の表紙背景と同じ考え方。`.claude/rules/coconala-product-standards.md`「カバー画像は二層」)。
   - **Drive (非公開・人が見る)**: 候補・元画像 `stats47/note画像/<slug>/candidates/`。
   - **R2 (承認した最終版だけ)**: `media/note-backgrounds/<slug>/<sha12>/background.jpg` (1280x670 JPEG)。
   - **記事の `render-spec.json` の `background`**: `sha256` / `r2Key` / 寸法 / `model` / `prompt` / `status: "approved"` だけ。画像本体は置かない。
   - 文字・数値・地図は生成画像に含めず、テンプレートが実テキスト/実データで重ねる (家ルール。`ogp-image-standards.md` §5)。
   手順は `node .claude/scripts/note/ingest-note-background.mjs` の先頭コメントに従う (候補を Drive へ `--stash` → 採用を正規化して
   `--write-spec` → R2 反映 → `render-ranking-images.mjs`)。`render-ranking-images.mjs` は背景を取得して SHA を検証し、合わなければ
   画像を作らず止まる (別の背景で焼かない)。生成 AI は再実行しない。現状、背景を使うのはカバーだけ。
7. **画像の生成口は 1 つ、公開前に必ず揃える。** ランキング記事の 4 枚は `render-ranking-images.mjs` だけが作る
   (`apps/remotion` の `pipeline:sns` は note 画像を作らない。`--note-only` は廃止して呼ぶと止まる。二つの経路で作ると内容が食い違う)。
   公開・更新の入口 (`publish-new-note.sh` / `editor-helpers.sh`) は `ensure-note-images.mjs` で PNG を作り直し、足りなければ止まる
   (カバー無しのまま黙って公開しない)。
8. **決定的であることを保つ。** 同じ入力から `render-ranking-images.mjs` は同じバイト列を作る (2026-09-30 に同一 SHA を実測)。
   テンプレートに時刻・乱数・外部取得を入れない。入れるなら入力として spec に固定する。

## 機械検査 (`npm run note:images:audit`)

| コード | 意味 |
|---|---|
| `DOCS31_TRACKED` | docs/31 に git の追跡ファイルがある (契約 1) |
| `RANKING_CHART_DATA_INVALID` / `RANKING_PROVENANCE_INVALID` | 契約 3 の欠落 (`note:article save` が保存前に警告) |
| `RENDER_SPEC_INVALID` | `render-spec.json` が無い・`chart-data.json` の SHA やテンプレート版が現行と不一致 (画像を作り直していない) |
| `NOTE_BACKGROUND_MISSING` | `render-spec.json` の背景が R2 に無い (`--verify-r2`・週次。作り直せない入力が失われている) |
| `NOTE_R2_BODY_MISSING` | 台帳が保存済みとする公開本文が R2 に無い / 公開済みなのに未保存 (`--verify-r2`・週次。通信失敗は 0 件扱いにせず exit 2) |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の
`note-image-assets`・週次 (`note-circulation-audit-weekly.yml` の artifact `note-image-assets.json`)。
`/weekly-review` は `npm run note:images:audit -- --json` の `summary` を読む。

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
