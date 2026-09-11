---
paths:
  - ".claude/{scripts/source-vault,skills/db/process-reference-source,state/source-inventory}/**"
  - ".claude/config/source-vault.json"
  - "docs/02_実装計画/**"
  - ".claude/agents/{area-curator,area-databook-designer,open-data-curator}.md"
---
# 参考文献の保存・利用実装規約

stats47 で調査・企画・実装に使う書籍、PDF、白書、報告書その他の参考文献は、原本を private Google Drive に保存し、
資料ごとの利用実装仕様書を通過したものだけ stats47 の既存 SSOT へ展開する。本規約は保存場所と昇格条件の正典であり、
個別資料の採否・権利判断・実装先は各利用実装仕様書で定める。

## 1. 適用範囲と SSOT

- stats47 で利用候補として取得した書籍、PDF、白書、報告書、スキャン、OCR、付属データを対象とする。
- 原本、スキャン、OCR原文、整形Markdown、ページ画像、抽出図、文字起こし、付属データを資料の版 folder に揃えて置き、
  オーナーだけがアクセスできる private Google Drive を保存先とする。
- 公開 URL、dataset ID、取得日、利用条件は Git 上の provenance / catalog / 利用実装仕様書にも記録する。Drive は出典 URL の代替ではない。
- 人手で確定した分類・採否・mapping は git TS、一次資料から取得した観測値は R2 を SSOT とする。参考文献の原本・OCRは
  アプリの runtime SSOT にしない。
- URL を調査候補として記録しただけの段階では保存を要求しない。利用候補としてファイルを取得した時点で Drive へ保全する。

## 2. Google Drive の固定階層

```text
マイドライブ/                             # 日本語ロケールの Drive アプリ (英語ロケールは My Drive)
└── stats47/                              # ブランド名のため英数字を維持
    └── 参考文献/                         # private source vault
        └── <資料名>/                     # 正式名称を日本語優先で表記
            └── <版>/                     # 例: 2025・2026年版、版不明。1 資料 1 版 = 1 directory
                ├── <原本>.pdf            # 原本。分冊は複数置く
                ├── pages/pNNNN.jpg       # 1 ページ 1 画像 (S1)
                ├── transcripts/ md/ figures/ ocr-raw/   # S2・S3 の成果物 (§3 の規約 directory)
                ├── page-dims.json / crop-manifest.json  # 補助 file
                └── stats47-<sourceKey>-<edition>.manifest.json   # Git manifest の複製 (人が見る用)
```

- `stats47` と全子孫は `shared:false` を維持し、公開リンク、組織共有、公開 R2 への複製を禁止する。
- `.claude/config/source-vault.json` の `driveRootFolder` は `stats47`、`driveCollectionFolder` は `参考文献` に固定する。
  各 profile の `driveSourceFolderName` と `driveEditionFolderName` から、人が読むDrive論理パスを決定する。
- Driveのfolder名は正式な日本語名称を優先する。`stats47`、`sourceKey`、`edition`、manifestのfile名は、
  ブランド名または決定的な機械処理識別子なので英数字を維持する。
- `<sourceKey>` と `<edition>` は英小文字・数字・ハイフンだけを使う。Drive上の版folderは上書きせず、新版を別folderとして追加する。
- **展開配置が保存の正典**。tar bundle と `r<N>` ごとの不変 archive は 2026-09-10 に廃止した。分割の唯一の根拠だった
  Drive MCP の 1 file 100MB 上限はローカルマウント経由では無関係で、ストリーミングマウントでは巨大 blob より個別 file の
  方が堅牢 (doboku-note と同じ判断)、訂正のたびに全量を複製する必要も無いため。同じ版の訂正・再OCR・段階の追加は
  同じ版 folder の file を差し替え / 追加し、Git manifest を `create --force` で作り直す。履歴は Git の manifest 差分で追う。
- Git manifest は `.claude/state/source-inventory/<sourceKey>/<edition>/source-bundle-manifest.json` (schemaVersion 2、
  `storage.layout: expanded`、`contentSha256`、全 file の path / bytes / sha256、`componentCounts`)。`revision` は manifest の
  世代番号で、Drive 上のコピーを増やさない。検証の正典は Git 版で、Drive 上の複製は人が見る用。
- ローカルマウントの解決は `source-vault.mjs` の `resolveVaultRoot()` が行う。`STATS47_SOURCE_VAULT_ROOT` (マウント上の
  `stats47/` folder) が最優先、無ければ macOS `~/Library/CloudStorage/GoogleDrive-<account>/{マイドライブ,My Drive}/stats47`、
  Windows `G:\{マイドライブ,My Drive}\stats47` の順に探す。マウント先は端末ごとに違うので Git には論理パスだけを書く。
- Drive の folder / file ID、URL、connector file reference は公開 Git に保存しない。
- `upload` は manifest の全 file を複製した後に vault 側を読み戻して sha256 を照合する。マウントへの書き込みとクラウド同期の
  完了は別なので、ローカルコピーを消す前に Drive 側で件数を確認する。`shared:false` は Drive 側で維持する。

## 3. ローカル作業領域

```text
$TMPDIR/stats47-source-vault/
├── work/<sourceKey>/<edition>/<sourceRootName>/   # vault の版 folder の複製 (restore)
└── derived/<sourceKey>/<edition>/r<N>/
    ├── processing-manifest.json
    ├── transcripts/
    ├── pages/
    └── crops/
```

- リポジトリ内の `/books/`、`/docs/books/`、`/.claude/pdfs/` は禁止する。`npm run source-vault:check` を
  pre-commit / PRで実行し、いずれかが存在すれば失敗させる。復元・OCR照合・manifest生成はOSの一時領域だけで行う。
- `derived/`は文字抽出、OCR、ページ画像、内部照合cropだけを置く一時領域とし、復元したsource rootを変更しない。
- 作業領域はSSOT、配信物、バックアップではない。作業終了後に削除でき、同じDriveの版folderから再現できなければならない。
- 原本、スキャン、OCR、抽出画像を Git、公開 R2、Web bundle、SNS 素材へ含めない。
- 復元時に同名 directory があれば上書きせず停止する。

### 利用時の共通手順

1. `.claude/config/source-vault.json` のprofileとGit manifestから、Drive論理パス、版、revisionを確定する。
2. `npm run source-vault -- vault-root --profile <profile>` でローカルマウントを解決し、版 folder を manifest と照合する。
3. 次の共通CLIで vault の全構成fileを検証して `work/` 配下へ複製する (複製後にも sha256 で照合する)。

   ```bash
   npm run source-vault -- verify --profile <profile> --manifest <git-manifest> --vault
   npm run source-vault -- restore --profile <profile> --manifest <git-manifest>
   ```

4. stats47への調査・抽出は `work/` の復元物だけを読む。原本をrepoへコピーせず、成果は利用実装仕様書が指定する既存SSOTへ書く。
5. `npm run source-vault:process -- prepare --profile <profile>`でPDF inventoryを作り、明示ページだけを`extract`、
   利用目的と一次資料再確認を宣言したspecだけを`crop`する。`npm run source-vault:ready`で全profileとPDF toolchainを検査する。
6. 全ページ処理後に`npm run source-vault:inventory -- build --profile <profile>`を実行し、全候補に公開可能な接続先、
   `primary-source-unavailable`、`rights-hold`、`not-applicable`のいずれかを付ける。`inventory.json`へOCR本文、
   書籍値、画像、ローカルpathを保存してはならず、`npm run source-vault:inventory:check`でcoverage 100%を検証する。
7. 作業後は`npm run source-vault:process -- cleanup --profile <profile>`で`work/`、`derived/`を削除し、
   `npm run source-vault:check`でrepo内に資料が残っていないことを確認する。

### 処理段階 (stage) と版 folder 構成の契約

PDF → ページ画像 → 文字起こし → 図クロップ → 台帳 → 展開は、次の段階に固定する。段階ごとの成果物は
版 folder 内の規約 directory に置き、段階が進むたびに manifest の `revision` を上げて `create --force` → `upload` で
同じ版 folder に足す (Drive 上のコピーは増やさない)。

| stage | 成果物 (版 folder 内) | 作り手 | gate |
|---|---|---|---|
| S0 保全 | 原本 PDF | 人 (PDF を work root へ) + `source-vault create` + `upload` | manifest hash・`shared:false` |
| S1 ページ画像 | `pages/pNNNN.{png\|jpg}` (1ページ1枚) + `page-dims.json` | CLI `extract --mode image` (profile の `processing.pageImage` を適用) | ページ数 = PDF ページ数。UI 枠などの本文領域外は `contentCrop` で除き、座標は `page-dims.json` に記録する |
| S2 文字起こし | `transcripts/pNNNN.txt` (生 OCR / text layer) + `md/pNNNN.md` (Markdown 文字起こし) | txt = CLI `extract`、md = agent が `pages/` 画像と txt を読んで書く | `md-check --check`: 全ページに md があり frontmatter (`page` / `kind` / `figures`) が規約どおり |
| S3 図クロップ | `figures/<crop-id>.png` + `crop-manifest.json` | CLI `crop` (spec は agent が書く) | crop spec の internal-only 宣言。md の `figures[]` は実在 crop id だけ |
| S4 台帳 | `.claude/state/source-inventory/<sourceKey>/<edition>/inventory.json` | CLI `source-inventory build` (authored mapping は git TS) | coverage 100%・本文/書籍値/ローカル path を含まない |
| S5 展開 | 既存 SSOT (metric / theme / area / content) | 利用実装仕様書が定める owner | 各 SSOT の既存 gate |

- **CLI が担うのは決定的な処理** (render、OCR、crop、parity、frontmatter 検査、bundle 化)。**agent が担うのは意味の作業**
  (Markdown 文字起こし、図の意味付け、crop spec の起票、mapping)。両者を混ぜない。
- `md/pNNNN.md` の frontmatter は `page: <int>` / `kind: text|figure|table|mixed|blank` / `figures: [<crop-id>, ...]` を持つ。
  本文は縦書き・段組を読み順に直した Markdown で、図表ページは本文の代わりに図表の要点と `figures[]` を書く。
  `blank` 以外は本文必須、`figure` / `table` は `figures[]` 必須。
- 段階の到達状況は `npm run source-vault:process -- stage-status` で manifest の `componentCounts` から読む。
  版 folder にどの段階まで入っているかを人の記憶や Drive の目視で判断しない。
- `stage --revision <N>` は derived workspace の成果物を規約名で source root へ配置するだけで、manifest の更新は
  `source-vault create --force`、Drive への反映は `source-vault upload` が行う。revision は profile と manifest で一致させる。
- ページ画像・文字起こし・図クロップは版 folder の内部構成物であり、Git・公開 R2・記事・SNS へは出さない。

## 4. 利用実装仕様書の必須条件

Drive への保全だけでは stats47 への採用を意味しない。OCR、inventory、指標、Theme、記事、SNS などへ展開する前に、
`docs/02_実装計画/` に資料単位の active な利用実装仕様書を置く。既存文書へ統合できる場合は新規文書を作らない。

利用実装仕様書は最低限、次を定義する。

1. `type: implementation-spec`、`status: active`、`related_backlog` と責任 owner。
2. `sourceKey`、正式書誌、版、対象ファイル、Drive 論理パス、Git manifest、ローカル復元先。
3. 利用目的、対象範囲、全件の母数、完了率、除外理由を追跡できる inventory contract。
4. 著作権・利用条件・引用・公開可否と、曖昧な場合の `rights-hold` 停止条件。
5. 参考文献の各項目から一次資料、既存 metric / survey / theme / area / content への mapping。
6. 一次資料からの再取得方法、年度、単位、地域粒度、provenance、値検証 gate。
7. 書籍本文、OCR値、図表、レイアウトを公開物へ直接流さないための禁止事項と機械 gate。
8. 実行順、承認境界、検証コマンド、別PCでの復元・再開手順、完了条件。

仕様書が無い、`status` が active でない、版が一致しない、権利または一次資料が未解決の項目は、Drive 内で保全したまま停止する。

## 5. stats47 への昇格フロー

```text
参考文献を private Drive に保全
  → manifest / hash / private 状態を検証
  → 利用実装仕様書を採択
  → 全項目 inventory と rights 判定
  → 一次資料を特定・再取得
  → provenance / unit / 値分布を検証
  → 既存 metric・survey・theme・area・content SSOT へ配置
  → 既存の公開・計測 gate
```

- 参考文献は論点、候補、書誌上の手掛かりを見つける evidence source として使う。
- 数値、事実、表現は一次資料で検証する。書籍や二次資料の数値を観測値へ直接投入しない。
- 新しい公開 taxonomy や保存層を資料ごとに作らず、既存の Category / Theme / Tag、metric、survey、R2、記事・SNS台帳へ写像する。
- 一次資料を特定できない項目は `primary-source-unavailable`、利用条件が不明な項目は `rights-hold` として公開しない。
- OCR、ページ画像、cropは候補発見と原本照合だけに使い、原文、数値列、元図、レイアウト、crop画像を公開SSOTへ移さない。
- crop specは`internalUseOnly:true`、`publicOriginalReuse:"forbidden"`、出典ページ、用途、
  `primarySourceRequired:true`を必須とし、欠ける場合は共通CLIが停止する。
- 利用実装仕様書の更新は設計判断が変わった時だけ行い、実行履歴は backlog / state / 既存運用台帳へ置く。
- コンテンツ展開の進捗は管理コンソール`/content/references`で確認する。同画面は解決済みinventoryを
  metric / area単位へ重複排除し、ranking / survey / theme / area / japan / world / blog / note / Kindle /
  YouTube / Instagram / X の既存SSOTと実行時に突合する派生read modelである。`context-only`は一次資料・役割・
  地理粒度単位の補強プールとして全件を集約し、独立制作単位と混在させない。
  手編集の別台帳、資料候補1件ごとのTODO、Drive IDの保存を禁止する。
- `context-only`は既存記事の分析文脈にだけ使い、単独の制作単位へ昇格しない。`rights-hold`、
  `primary-source-unavailable`、`not-applicable`は制作キューへ入れない。metricまたはareaへの公開可能な接続を持つ
  `reuse-existing-metric`、`new-metric`、`combined-analysis`だけを制作単位にする。
- 制作状況は各チャネルSSOTの実在証跡で判定する。サイトはactive metricまたはarea editorial、ブログは公開記事内の
  `/ranking/<key>`接続、noteはcatalogの`stats47Targets`、Kindleはbook catalogの`rankingKeys`または`blogSlug`を使う。
  制作中はブログ`docs/21_ブログ記事原稿/`、note`docs/31_note記事原稿/`、Kindle catalogのstatusを読む。
  推測による「制作中」「制作済み」判定は禁止する。

## 6. 関連

- 保存先の分類: `.claude/rules/data-storage.md`
- 観測値の出典: `.claude/rules/data-provenance-standards.md`
- 文書配置: `.claude/rules/docs-vs-issues.md`
- source vault 設定: `.claude/config/source-vault.json`
- source vault CLI: `.claude/scripts/source-vault/source-vault.mjs`
- OCR / page / crop / stage CLI: `.claude/scripts/source-vault/source-processing.mjs`
- 段階運用 skill: `.claude/skills/db/process-reference-source/SKILL.md` (`/process-reference-source`、owner `open-data-curator`)
- evidence inventory CLI: `.claude/scripts/source-vault/source-inventory.mjs`
- 実装例: `docs/02_実装計画/45_日本国勢図会一次資料化・マルチチャネル展開実装仕様.md`
- その他3資料の実装契約: `docs/02_実装計画/46_その他参考文献OCR・クロップ・stats47展開実装仕様.md`
