# apps/admin — 統合メディアコンソール (localhost 専用)

stats47 のローカル統合メディアコンソール。X / Instagram / note / Kindle の原稿・公開状態、
private Google Drive参考文献から既存コンテンツへの展開状況、
SNS 投稿状態、Geo契約、画像資産、ブログ SVG、調査カタログ、事業方針、プロジェクト現況を横断管理する。画面からSNS下書き本文・noteカバー制作・記事と画像の改善方針・候補画像・目視結果・図の型を保存できる。公開状態は既存の投稿工程が管理する。
2026-07-16 に旧 node:http + Vanilla JS 実装 (`.claude/scripts/gallery/`) から**完全移管** (旧実装は削除済み)。

**公開サイト `apps/web` とは独立**。Cloudflare 等へデプロイしない。リモート公開・認証・DB なし。

## 起動

```bash
npm run admin              # http://127.0.0.1:4747/ (root から。Ctrl-C で停止)
PORT=5000 npm run admin    # ポート上書き
```

- **bind は 127.0.0.1 固定** (`next dev -H 127.0.0.1`)。0.0.0.0 / LAN に公開しない。
- エージェントが起動する場合は `run_in_background: true` + Ready polling (前面 sleep 禁止)。
- dev モードで常用する (ビルド不要・ジョブ履歴はプロセス内 = 再起動で消える現行仕様)。

## 画面

| パス                              | 内容                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                               | 導線 + 件数サマリ                                                                                                                                                                                  |
| `/product/status`                 | 商品チャネル (note・ココナラ・Kindle) の件数・公開段階。チャネルの定義は `lib/channel-registry.ts`                                                                                                 |
| `/product/coconala`               | ココナラの出品状況 (`coconala-listings.json` × product-factory カタログ)                                                                                                                           |
| `/content`                        | X / Instagram / note / Kindle の制作・公開状態・次アクション・SSOT監査の横断サマリ                                                                                                                 |
| `/content/x` `/content/instagram` | 投稿台帳をチャネル別に初期絞り込み。XはGeo role・分析ID・claim metricも表示                                                                                                                        |
| `/content/note`                   | 記事台帳 (`data/note/articles.json`)・R2本文所在・公開URL・公開準備状態の読み取り専用ミラー                                                                                                        |
| `/content/note/covers`            | カテゴリ別方針・固定の制作ID・制作状況・公開画像/候補の比較。制作内容を保存してプロンプトと制作仕様を取得し、候補の採用/修正を記録して次の記事へ進む。画像はprivate R2からGET proxyでSHA確認し配信 |
| `/content/kindle`                 | Kindle catalog・manuscript・ローカルEPUB/表紙・R2暗号化archive・KDPの下書き/審査中/販売中・価格/ロイヤリティ/KUの読み取り専用ミラー                                                                |
| `/content/references`             | 解決済みinventoryをranking・survey・theme・area・japan・world・blog・note・Kindle・YouTube・Instagram・Xへ突合した全展開ポートフォリオ。context-onlyは公式資料単位の補強プールとして別表示         |
| `/sns`                            | 投稿台帳 (X/IG と YouTube 過去実績/pilot 記録)・素材再生・caption・投稿状態・残枠・IG 整合性警告の読み取りビュー                                                                                   |
| `/assets`                         | 画像/動画資産 11 タブの読み取り専用ギャラリー                                                                                                                                                      |
| `/svg`                            | ブログ SVG 分類カタログ (手動ロード・10 分キャッシュ)                                                                                                                                              |
| `/research`                       | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続の読み取り専用ミラー                                                                                                  |
| `/strategy`                       | stats47 2.0事業計画とM1 Geoのsource layer・空間演算・metric・X role 3/9/2/1・契約違反の読み取り専用ミラー                                                                                          |
| `/dashboard`                      | メトリクス/進捗キュー/バックログ/STP の読み取り専用ミラー (60 秒キャッシュ)                                                                                                                        |
| `/buzz-map`                       | curated catalog・score・evidence・landing・素材previewの読み取り専用ギャラリー。実行は `/buzz-map` skill                                                                                           |
| `/ops/agents`                     | agent・skill・CI 無人実行・backlog-loop のモデル/effort 割り当て一覧。正本の frontmatter・workflow・routing policy を表示のたびに読む                                                              |

## 構成

```
app/            管理画面 + api/** (Route Handler) + media/ pilot/ (ローカルファイル配信)
components/     共有 (console-nav / async-state / media-preview) + ページ別
components/ui/  shadcn/ui 公式 (new-york-v4) の部品。公式のままにする (差は check-shadcn-parity が止める)
components/admin-ui/  組み立て部品 (TableFrame / DataTable / PanelCard / StatCard / StatusBadge / LinkCard)。layout-primitives.tsx は Stack / Grid / Section
components/content/note-covers-browser.tsx  shadcn Table + TanStack Table v8で制作ID/分類/状況を検索・比較。表示条件はURLに保持
components/content/note-cover-production.tsx  制作内容・目視確認のフォーム。方針と制作仕様の表示・ダウンロード
lib/nav-registry.ts  左メニューの定義 (SSOT) と現在地判定。表示は公式 Sidebar (components/console-nav*.tsx)
lib/client/     fetch wrapper (SWR 等は使わない)
lib/contracts/  読み取りAPI DTO + Zod schema
lib/content-operations/ 各チャネルSSOTの正規化 + 決定的監査 (書込なし)
lib/server/     server-only read model (project-root / posts / collectors / ...)
tests/          unit + integration (Vitest) / e2e (Playwright)
```

- **UI**: Tailwind v4 (CSS-first・`app/globals.css`) + shadcn/ui 公式部品。web (`apps/web`) とは独立で `@stats47/components` は使わない。
  規約・検査・移行手順は `.claude/rules/admin-ui.md` (`npm run admin-ui:check`)。
- fs / child_process を使う route は `runtime="nodejs"` + `dynamic="force-dynamic"` + `Cache-Control: no-store`。
- project root は `lib/server/project-root.ts` が一元解決 (`STATS47_PROJECT_ROOT` env で上書き可、
  `package.json name === "stats47-monorepo"` を検証)。

## SSOT (このアプリはミラー・複製 store を作らない)

| データ                   | SSOT                                                                                                                     | 扱い                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| SNS 投稿台帳             | `data/sns/posts.json`                                                                                                    | ID台帳・画像一覧から確認。下書き本文の保存だけadminから既存store経由で実行。予約・投稿はowner agent/skill                        |
| note編集メタ / 本文      | `.claude/scripts/note/catalog/` (git TS) / R2 `note/<vertical>/<slug>/`                                                  | `/content/note` は正規化表示のみ。`note-published-urls.json` は派生で手編集しない                                                |
| Kindle設計 / 原稿 / 出品 | `book-catalog.ts` / `manuscripts/<id>/` / `config/kdp-listings.json` / `data/products/kindle-archives.json`              | `/content/kindle` は突合表示のみ。ローカル成果物とR2 revision、KDP状態を別々に表示                                               |
| 参考文献展開             | `data/source-inventory/` + Theme/Japan/survey/blog/note/Kindle/SNSの既存SSOT + `contents/blog/`・`docs/31_note記事原稿/` | `/content/references` は制作単位×12チャネルを実行時に重複排除し、context-onlyも全件集約する。原本・OCR・crop・Drive IDは読まない |
| IG 予約                  | `data/sns/instagram-w*-schedule.json`                                                                                    | adminはposts.jsonとの差分表示だけ。予約agentが更新                                                                               |
| ローカル素材             | `.local/r2/sns` / `.local/ogp-pilot`                                                                                     | `/media` `/pilot` で配信 (読み取り)                                                                                              |
| X 成功時刻               | `.local/sns-gallery-state.json`                                                                                          | 投稿agentが更新し、adminは残枠表示のために読む                                                                                   |
| 配信素材                 | R2 (`storage.stats47.jp`)                                                                                                | 公開 URL で読む。list しない                                                                                                     |
| dashboard                | state JSON / metrics CSV / docs md                                                                                       | 読み取り専用ミラー (`lib/server/dashboard.ts`)                                                                                   |
| 調査カタログ             | `.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json`                                    | 読み取り専用ミラー (`lib/server/dashboard-catalog.ts`)                                                                           |
| 事業計画                 | `packages/data-configs/src/business-plan/` + `data/business-plan/latest.json`                                            | authored SSOTとderived運用stateの読み取り専用ミラー (`lib/server/business-plan.ts`)                                              |
| 資産列挙                 | `.claude/scripts/lib/gallery-collectors.mjs` + `svg-classify.mjs`                                                        | **CI 静的ギャラリーと共有 — 削除禁止**。`lib/server/collectors.ts` (+ .d.ts) 経由で import                                       |

## SNSのID台帳

`/sns` と `/content/{x,instagram}` で画像一覧 / 台帳表示を切り替える。IDは既存の `posts.json` を使い、別台帳を作らない。
ID検索 (`#1109`、`1109,1110,1111`)、本文・キー・template検索、媒体・投稿状態・画像の型の絞り込み、予約順、24件ごとのページ送りに対応。表示条件はURLに保持し、日時はJSTに統一する。
「展開候補」 (`/sns?scope=candidates`) は予約前の下書きを表示。出どころ（新しい型の追加企画 / 既存素材）、準備状況、型で絞り込み、企画名も検索できる。
候補の `planning`（企画名・出どころ・整理日・確認用画像の区別・確認事項）と `material_keys`（媒体/ドメイン/元ディレクトリキー）は同じ投稿IDの行に保存する。
確認用プレビューは `assets.role=thumbnail` で保全し、投稿用 `media_path` には設定しない。公開前に投稿用画像・本文・出典を確認する。
未登録素材の整理は `node .claude/scripts/sns/reconcile-materials.mjs --input /tmp/materials.json --report /tmp/plan.json`（dry-run）、適用は `--apply`。
入力は `{platform, domain, content_key, batch:"YYYY-MM-DD"}` の配列で、`title/caption/origin/note` は任意。正確なファイル・既知の別名・素材キーで既存IDへ紐付け、曖昧なら停止。
削除済み素材も元IDへの所属を維持し復活させない。新規行は承認待ち・日時なしで登録し、画像はprivate R2、動画はDriveに実体とSHAを保全する。既存本文・状態・予約日時は変更しない。
画像と本文を開くと下書きだけ編集できる。未保存で閉じる際は確認し、保存エラーでも入力を残す。予約済み・投稿済みは閲覧用。
画像は投稿IDに紐づくprivate R2正本を優先する。移行前の画像と動画はGoogle Driveを読み、既存のローカル/R2配信候補も表示する。家計レシート・県図鑑・順位乗換も型で絞り込める。

## 安全ガード

- APIは原則GET。保存の例外は `PATCH /api/posts/:id/caption` の下書き本文と `PATCH /api/note-covers/:key/production` の制作内容・確認結果 (2026-10-14 オーナー指示)。同一origin・loopback・JSON限定、ID/内容/版を検査し、古い画面からの更新を拒否する。SNSの予約/公開/削除済み投稿は編集できない
- writerを呼べるのは `posts-store.ts` の `saveDraftCaption` と `note-cover-production.ts` の `saveCoverProduction`。後者は元画像/入力の実在確認と正確な候補版の照合を行い、コピー/方針変更で採用を解除する。noteへの反映は制作側の既存公開工程で行う。品質改善の限定writerは `content-quality.ts` と共有 `media/lib/workspace.mjs`。その他の書込・子プロセス起動は `tests/unit/read-only-contract.test.ts` が拒否する
- **ファイル配信**: decode → resolve → relative 検査 → **realpath 後再検査** (symlink 脱出拒否) → regular file のみ。Range 200/206/416
- 個別制作物をTODOへ二重登録しない。`audit:content-operations` が `K-Sx-xx` / `NOTE-ARTICLE-*` /
  `SNS-POST-*` 等の個別カードを拒否し、システム課題・自動化・横断意思決定だけをbacklogに残す
- CORS ヘッダなし (same-origin のみ)。エラー応答は `{error}` のみ (stack/credential を返さない)

## 検証

```bash
npm run type-check --workspace=apps/admin
npm run lint --workspace=apps/admin        # Next / TypeScript / hooks lint（生成物は除外）
npm run test --workspace=apps/admin        # Vitest unit fixture + 実SSOTのread-only integration
npm run audit:content-operations           # SNS / note / Kindle / 参考文献展開のSSOT横断監査 (errorで失敗)
npm run build --workspace=apps/admin
cd apps/admin && npx playwright test       # desktop/mobile E2E。参考文献の12チャネル・filter・ページ送りも検証
```

生成先は通常dev=`.local/next-admin-dev`、E2E=`.local/next-e2e`、build/start=`.next` に分離する。
起動中のdevとbuildで同じwebpack chunkを上書きしないための契約で、`run-next.mjs` と
`playwright.config.ts` が `NEXT_DIST_DIR` を設定する。

## 共通事業方針の表示

「戦略」→「共通方針」(`/strategy/policy`) で、Obsidian vault正本(`.claude/共通事業方針SSOT.md`)から配布されたHARM・判断の問い・原則を読み取り専用表示する。全画面共通の表示ではなく、この専用ページだけに置く。同じ配布版をエージェントも参照する。`npm run admin` の起動前に `policy:check` が内容の整合性（正本があれば最新版との一致も）を検査する。正本更新後はObsidian vaultで `npm run policy:sync`。個別適用は `.claude/shared-policy/application.json`、収益モデルとKPIは既存戦略が正本。

## 記事・画像の改善管理

- 商品 → 記事・投稿の改善 (`/product/content-quality`): 全note記事・SNS投稿を既存台帳から結合し、優先度、改善方針、データ/画像/配置/導入/出典/リンクの確認を保存する。右ペインで保存原稿と実画像を確認できる。公開ページのnoteカード表示は別途確認する。
- 管理 → 画像ライブラリ (`/ops/image-library`): 使用箇所ID、R2所在、入力ファイル、旧新画像、320px比較、候補履歴、生成根拠を確認する。PNG/JPEG/WebP候補はprivate R2保存後に読み戻して照合する。原寸・320px・数値/年/単位の確認が揃った現在の候補だけ採用できる。カバーは既存の専用制作画面へ接続する。
- 管理 → 画像・元データ・改善 (`/ops/image-library`): OGP・リンクカード・ブログ本文SVG・note・SNS・県の輪郭・共通素材を同じ使用箇所IDで管理する。用途、形式、既存カタログ、媒体で絞り込み、右ペインで保存済み入力・生成元・記事内の位置・同じ元画像の使用先を辿る。`?view=templates` は既存SVG分類を含む図の型・媒体別方針、`?view=articles` は記事の改善。旧 `/assets`・`/svg`・`/ops/image-templates` はここへ転送する。共有collectorとSVG分類は既存SSOTを再利用する。

`?view=templates` は全ての型に note / X / Instagram の3列を設け、媒体ごとに最大3枚、最大320px幅で実画像を比較する。比率の選択は画像を変形せず、保存された実寸・SVG viewBox・候補の実寸で絞り込む。未記録の寸法は画像読込後に表示する（絞り込みは記録済み寸法のみ）。制作サイズの目安は共通CANVASプリセットを参照する。Web/ブログの実例は同じ型の参考欄から開く。媒体を寸法やファイル名から推定しない。未登録の媒体は明示し、「3媒体の見本登録あり」「媒体別見本が不足」で絞り込む。題材が異なる参考画像も含むため、同じ固定データによる比較試作の完了とは扱わない。

試作候補・採用済み画像・既存参考例を区別し、旧条件の候補には再確認を表示する。選出は `lib/media-template-examples.ts` が所有し、媒体ごとに重複排除してから上限を適用する。未分類・カバーは除外。旧分類が混在するnote時系列・家計のみ代表IDを使う。SNSは `media/lib/catalog.mjs` が台帳の生成テンプレートと元素材名から型を解決し、表紙・CTA・出典スライドを図の見本から除く。手動の型指定は優先する。保存先が直接解決できる画像を優先し、元画像・投稿台帳は書き換えない。原寸、比較・元データ、`?template=<id>` の全使用箇所へ進み、方針を版付きで保存できる。見本の掲載だけで型の確定や公開を行わない。

図の方針更新時は版と旧方針を残し、旧条件の候補を失効させる。SVG候補は外部参照・スクリプト等を検査し、実ファイルはR2に保存、画面ではPNGプレビューにする。X/Instagramの現行全47県表示契約を維持する。

運用記録は `data/content-operations/quality.json`、図の方針は `image-templates.json` と各JSON Schema。公開URL/本文/投稿状態の正本を複製しない。画像索引 `image-inventory.json` は検証済み記事manifestから派生する。未回収・未照合を「画像なし」「再生成可能」と扱わない。候補画像・入力根拠はprivate R2 `media-workspace/{images,inputs}/<sha>.*` に保存する。

新規SNS画像は `sns-assets/<platform>/<id>/<role>-<order>/<sha>.*` のprivate R2正本へ保全する。従来の `sns/` は配信コピー。既存note本文/カバーのR2正本は維持し、旧Driveはハッシュ一致を確認した画像だけ移行する。元画像の削除はしない。

```bash
npm run media:inventory -- --all --apply
npm run media:inventory:web -- --all --apply
npm run media:migrate -- --all --verify-existing --apply
npm run media:prepare -- --id IMG-...
npm run media:check
npm run media:test
```

inventory/migrateは `--apply` なしで保存しない。移行結果は `image-migration.json`、元画像未取得・内容不一致・通信等の未照合を区別する。prepareは正本をSHA照合して新しいOS一時ディレクトリへ復元し、固定入力とrenderer参照を記したrequest.jsonを出力する。復元は再生成成功を意味しない。数値入力不足は回収してから制作する。

Web索引は `web-image-inventory.json` と `web-images/*.json` の小分けファイルで保持し、読込時に各ファイルのSHAを照合する。Web索引は公開ページ台帳とR2の生成manifest・本文参照から派生する。変更のない記事はキャッシュを使い、リモートの全面再照合には `--refresh` を付ける。OGPのmanifestに残るSHAと、実画像を取得したSHAを区別する。本文SVGは対応JSON・source JSONを照合し、埋込SVGは固定本文の範囲から復元する。上流URLだけでは当時の入力を保全したことにしない。素材のGit所在、外部URL、生成記録なし、使用箇所未照合も一覧に残す。棚卸し範囲は画面に表示し、未照合を「全画像の品質確認済み」と扱わない。

書込APIは `PATCH /api/content-quality`、`PATCH /api/media-library/:id`、`POST /api/media-library/:id/candidate`、`PATCH /api/media-templates/:id`。同一localhost Origin、入力schema、楽観ロック、保存ロック、画像サイズ/形式、R2 readbackを検査する。採用で公開面は変更しない。CIのadmin-qualityが台帳検査と専用単体テストを実行する。

本文画像の型を試すときは、各型の代表例を原寸と320pxで比較してから全件に広げる。画像検索は改善方針も対象にし、`?q=MOBILE-PILOT-01` で試作対象を再表示できる。個別方針と記事の配置・本文の不一致は同じ品質台帳に記録し、見た目だけの改善で記事全体を確認済みにしない。

`node node_modules/tsx/dist/cli.mjs .claude/scripts/media/render-article-pilot.ts --spec <OS一時領域/spec.json>` は `media:prepare` の復元物からランキング・地理形状地図・散布図の640×960候補を生成する。specは `{id,directory,kind,dataFile,title,subtitle,unit?,xLabel?,yLabel?,focusNames?,changes}` の配列（最大9件）。`kind` は `ranking` / `map` / `scatter`。既定はローカル試作のみ。`--register --admin http://127.0.0.1:4757` を付けると、PNG・SVG・固定数値入力・地理データ・生成条件・コードSHAをprivate R2へ保存し、管理API経由で候補登録する。数値は復元物のSHA、47県の集合、年・単位を検査し、PNGは200KiB以下を必須にする。元出典の正しさと過去の復元一致率は別途評価する。自動採用・公開はしない。

候補の入力根拠の `supplied.sourceData`（JSON文字列）を解析し、`frozenBundle` のR2キーを辿ると、`inputs[].text` に固定ファイル、`sample` に描画条件、`geometry` に当時の地理データ、`renderer` にコード本文とSHAがある。最新値で補完せず、その版のコードと入力を復元して再試作する。媒体別方針の版が変わったら旧候補は再確認する。
