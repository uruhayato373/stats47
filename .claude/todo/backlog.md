---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-09-05
---

# バックログ (タスクマスタ)

> **役割**: 優先度・時期を問わず「未完了タスクの全量」を保持するマスタ。カード構文・タグ語彙の
> 正典は `.claude/rules/todo-standards.md` (doboku-note と統一の v3-unified スキーマ)。
> **完了したカードはセクションごと削除する** (記録は git 履歴。完了サマリを本ファイルに書かない)。
> stats47 では backlog-loop (CI 日次) が処理するため **ID (`### [ID] タイトル`) を必ず付ける**。
> 行削除は gate 証拠が ledger に要る (`.claude/rules/backlog-loop.md`)。

各カードは `### [ID] タスク名` の直下に `タグ:` 行を置く (機械読取り):

```
タグ: [カテゴリ] [種類:X] [実行:X] [検証:cmd] [起票:YYYY-MM-DD] [期日:YYYY-MM-DD] [進行中]
```

## 🔴 高 — 今月中に着手したい

### [GIS-COMMERCIAL-LICENSE-BOUNDARY-01] [進行中] 非商用KSJの公開終了・新版への切替を本番確認する

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run geo:check-data-catalog] [起票:2026-09-05] [期日:2026-09-12]

- **owner**: gis-curator（利用条件SSOT）/ r2-publisher（exact削除）/ ranking-publisher（公開）/ x-strategist（関連SNS）
- **現在地**: 元GIS435件は検証付き退避後に削除済み。新版の道の駅・漁港・港湾対象港、派生データ・画像・共有一覧194件と、道の駅3記事・Geo出典・分類辞書の追補69件はR2公開/SHA照合済み。
  証跡と件数の正典は `.claude/state/metrics/geo-release-publication-2026-09-05.json` の `legacyLicense`。
  出典監査はfresh stateで既存ratchet PASS、webテスト1,254件PASS。コードはPR #928で未デプロイ。
- **次（実行順）**:
  1. PR #928の最終CI通過後に一括deploy。旧`fishing-port-count`の新版への301、代替のない8ランキングと終了3記事の410、新版3ランキング・道の駅3記事・Geoページの200を実測する。
  2. `license-retention-20260905.json` の旧ランキング125・旧正規化2・終了ブログ53・旧港正規化1・旧道の駅資産3、合計184件だけをworkflow経由で削除する。raw435は再実行しない。
  3. CDNを更新し、公開69ファイルのSHA、廃止184キーの404、Googlebot UAによるGeo/ランキング/ダウンロードの全対象を確認する。
  4. 関連SNSの台帳posted6/draft2を外部実測する。旧11ランキング系列の未検証投稿を、Geo15投稿の既存検証結果と混同しない。
- **承認済み範囲**: ユーザー「やって」「進めて」「更新すべきものは更新して　古い資産は削除して」による上記データ置換・終了・exact削除・一括deploy。道の駅3記事は独立レビューPASS。別作業の学力metricは取り込まない。
- **停止条件**: key/size/ETagが退避時と変わった対象は削除しない。共有一覧の無関係レコード、別作業のWIP、backupを保持する。「加工済み」だけで商用可と扱わない。main→developは生成3ファイルの競合をpreviewで検出済みのため、指示なく解消しない。
- **完了条件**: public R2の非商用11prefixが0件、catalog gate PASS、新版の出典・保存則・公開値が一致し、終了URL/ダウンロード・記事/SNSまで承認方針どおりの状態を本番実測する。


### [AFF-DEPLOY-RESOLUTION-01] 広告解決順の変更 (#912/#913) を本番反映し、代表ページで実測する

タグ: [収益化] [種類:改善] [実行:ユーザー] [検証:curl -sA Googlebot https://stats47.jp/ranking/natto-consumption-expenditure | grep -c ふるさと] [起票:2026-09-03] [期日:2026-09-10]

- **owner**: uruhayato373 (デプロイ承認) / Claude Code (実測)
- **何を**: PR #912 (タグ写像 75 件 + japan/municipalities/市区町村カテゴリの native 枠) と PR #913
  (解決順を出典調査 → タグ → カテゴリに統一、`SURVEY_AFFILIATE_MAP`) は develop にマージ済みだが
  コード変更なので **develop → main のデプロイまで本番に出ない**。在庫 SSOT の priority 変更だけは
  `publish-affiliate-ads.yml` で R2 反映済み (2026-09-03 実測 5/1/5)。
- **なぜ**: ランキング流入の 38% (家計調査の食品品目 28,867 imp/週) に金融広告が出ている状態が
  本番では続いている。試算では economy 35,613 → 6,746、furusato 2,904 → 31,465 imp/週。
- **同時にデプロイされるもの**: improvements の `AFF-IMPRESSION-ROUTING-01` (AdSense 停止中の空き
  位置へ文脈バナーを配線・コード実装済・未デプロイ) も同じデプロイに乗る。効果判定の窓が重なる
  ので、判定は vertical 別 (furusato の増分) と position 別 (ranking-incontent) を分けて読む。
- **次**: `/deploy` (develop → main PR → CI green → merge → CDN purge)。
- **完了条件**:
  - `/ranking/natto-consumption-expenditure` の native 枠にふるさと納税サイトが出る
  - `/ranking/avg-height-high-school-2nd-male` に意図軸の広告が出ない (ハウス枠のみ)
  - `/blog/local-government-debt-burden` の本文バナーが furusato
  - 完了したら improvements の `AFF-RESOLUTION-EFFECT-01` へ引き渡す (baseline は起票済み)
- **停止条件**: デプロイ後の smoke (`.github/scripts/smoke-test-routes.sh`) で ranking / blog が
  200 以外、または `x-nextjs-prerender` の notFound 固着 → main を前 SHA へ戻す。

### [AFF-FURUSATO-INVENTORY-01] ふるさと納税ポータルの提携を 2〜3 件足す (furusato 在庫 4 本 / 週 5.4 万 imp)

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node .claude/scripts/ads/audit-affiliate-inventory.ts の furusato 横長 banner ≥ 7] [起票:2026-09-03] [期日:2026-09-30]

- **owner**: uruhayato373 (ASP 提携) / affiliate-manager (登録)
- **なぜ**: #913 で家計調査 (ランキング 28,867 + ブログ 12,366 imp/週) と農業・地方財政が furusato に
  集まる。一方 furusato の横長バナーは **4 本** (イオン九州 ×2・ふるさと本舗・au PAY) で、3 枠を
  埋めると毎ページ同じ並びになる。需要と在庫が最も逆転している軸。
- **候補**: さとふる / ふるなび / 楽天ふるさと納税 / ANA のふるさと納税 (A8・もしも・afb のどこで
  提携できるかは `/affiliate-operate` の走査で確認。ブランド適合は人の判断)。
- **手順**: ユーザーが ASP で提携申請 → 承認後 `/register-affiliate-banner register` で 300x250
  を 1 案件 1 エントリ登録 (vertical=furusato、priority は確定 EPC バンド) → develop push で R2 反映。
- **完了条件**: furusato の横長 300x250 が 7 本以上、かつ priority 上位 3 が全国対応ポータル
  (地域限定のイオン九州が上位 3 に入らない)。
- **禁止**: 楽天ふるさと納税の代わりに楽天市場の商品カードで代用しない (別チャネル)。

### [BLOG-BACKGROUND-BATCH-01] 公開待ち 91 記事の背景画像を生成して公開・デプロイまで届ける

タグ: [コンテンツ品質] [種類:制作] [実行:ユーザー] [検証:blog-auto-publish の Summary が「公開: 91 件 / スキップ: なし」] [起票:2026-09-02]

- **owner**: オーナー (画像生成) → Claude Code (公開起動・確認・デプロイ)
- **現状**: `docs/21_ブログ記事原稿` の `published: true` は 91 本。すべて quality-gate blocker 0 +
  blog-critic PASS を得ており、公開に足りないのは**記事固有の背景画像だけ**。
- **止まっている実測**: PR #895 merge 直後の `blog-auto-publish.yml` run 33587682293 は 1 本目
  (`annual-sunshine-duration-prefecture-gap`) の `Fatal: 記事固有背景がありません` で exit 1 になり、
  公開 0 件。`generate-blog-thumbnails.ts` は共有背景へフォールバックしない (`ogp-image-standards.md` §5)
  ので、ゲートを緩めるのではなく画像を用意して通す。
- **なぜユーザー実行か**: Codex MCP はクラウドセッションで `ENOENT` (codex 未インストール)。
  背景生成はローカル Mac の Codex built-in imagegen で行う。
- **手順** (`/generate-blog-images` Mode A): 公開前の記事なので `--article <article.md>` が必須
  (省くと R2 404)。

  ```bash
  npm run blog-images:codex -- request-article --slug <slug> \
    --article "docs/21_ブログ記事原稿/<slug>/article.md"
  npm run blog-images:codex -- ingest-article --slug <slug> \
    --article "docs/21_ブログ記事原稿/<slug>/article.md" \
    --input <generated.png> --prompt-hash <sha256-...>
  npm run check:blog-images
  ```

  生成物は `apps/web/scripts/lib/assets/blog-article-backgrounds/<slug>.jpg` (git tracked)。
- **公開の起動**: 画像だけの push では auto-publish は発火しない (paths フィルタが `article.md` と
  workflow 自身のみ)。`workflow-dispatch-proxy.yml` の allowlist に `blog-auto-publish.yml` を
  追加済 (PR #899) なので、クラウドからも slugs 空 = reconcile で代理起動できる。
- **順序の注意**: 現行の workflow は背景の無い slug で run 全体が止まる (`BLOG-PUBLISH-THUMBNAIL-GUARD-01`)。
  91 枚すべて揃えてから push するか、揃った分だけ `-f slugs="..."` で明示指定する。
- **完了条件**: 91 本が R2 `app/blog/<slug>/` に載り、`docs/21` から commit-back で消え、
  develop→main のデプロイ (`deploy-workers.yml` success) まで終わること。

### [BLOG-PUBLISH-THUMBNAIL-GUARD-01] 背景1件の欠落で公開run全体が止まるのを per-slug skip にする

タグ: [エージェント・SSOT] [種類:不具合] [実行:機械] [検証:背景の無い slug を1件混ぜても他 slug が公開されること] [起票:2026-08-31]

- **owner**: Claude Code
- **症状**: `blog-auto-publish.yml` の「Gate + Stage + Publish each slug」は `set -e` の下で
  `npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug "$SLUG"` をガードなしに呼ぶ。
  記事固有背景が無い slug で例外が出ると **ループごと停止し、後続 slug が 1 件も公開されない**。
  run 33446804723 で実測: 20 件中 1 件目 (`airport-count-vs-general-project-investment-agriculture`)
  の `記事固有背景がありません` で全体が exit 1 になり、公開 0 件。
- **同じステップ内で非対称になっている**: ci-factual-gate と quality-gate は
  `if ! ...; then SKIPPED=...; continue; fi` で該当 slug だけ飛ばす作りなのに、thumbnail 生成と
  それ以降 (`push-generated-image-set` / `diff-push-r2`) にはこの扱いが無い。
- **影響が滞留として現れている**: reconcile (`select-republish-slugs.mjs`) は現在 24 件を返すが、
  そのうち少なくとも 24 件が背景未生成で、先頭で止まるため**どれも公開されない**。
  背景待ちの記事が 1 件でもあると、背景が揃っている記事まで巻き添えで止まる構造。
- **2026-09-02 に規模が拡大**: run 33587682293 では公開待ち **91 件**が 1 本目
  (`annual-sunshine-duration-prefecture-gap`) の同じ Fatal で全滅した。滞留は 24 → 91 件。
  per-slug skip になっていれば、背景が揃った分から順に公開できる (`BLOG-BACKGROUND-BATCH-01`)。
- **完了条件**: 背景が無い slug は SKIPPED に積んで次へ進み、他 slug が公開されること。
  **背景の無い slug を 1 件混ぜた状態で run を通し、他が公開されることを実測する**
  (全 PASS は「何も見ていない」と区別がつかない)。
- **注意**: skip にしても「公開されない」事実は変わらないので、Step Summary と
  `SKIPPED` に理由 (背景未生成) が残ることまでを条件に含める。黙って飛ばすと滞留が見えなくなる。
- **関連**: `QUALITY-GATE-COVERAGE-01` / `CHART-VALIDATE-GATE-01`

### [CHART-VALIDATE-GATE-01] ブログチャート検証ゲートが全 PR で 0 件しか見ていないのを直す

タグ: [エージェント・SSOT] [種類:不具合] [実行:機械] [検証:.github/workflows/generate-article-charts.yml の run で検出 slug 数 > 0] [起票:2026-08-31]

- **owner**: Claude Code
- **症状**: `generate-article-charts.yml` の PR ゲートが、記事を何本追加しても
  空の結果表を出して success で終わる。PR #872 (ブログ 20 本追加) の run 33444223980 で実測。
  ログに `fatal: origin/develop...HEAD: no merge base` が出て検出 slug が 0 件になり、
  ループが 1 回も回らないまま `FAIL=0` で通っている。
- **原因は 3 つあり、どれか 1 つを直しても 0 件のまま**:
  1. `git fetch origin "$base" --depth=1` が shallow ref を作るため 3 点ドット diff に
     merge base が無い。`actions/checkout` は `fetch-depth: 0` なので、この `--depth=1` を
     外せば解決する。
  2. `awk -F/ '{print $2}'` がフォルダ名 (`21_ブログ記事原稿`) を出しており slug ではない。
     パスは `docs/21_ブログ記事原稿/<slug>/...` なので `$3` が正しい。
  3. git が非 ASCII パスをクォートするため行頭が `"` になり `/^docs\/21_/` が一致しない。
     `git -c core.quotepath=false diff` が要る。
- **実測**: 3 つを直した検出は PR #872 の 20 slug を過不足なく返す。その 20 件に対して
  `generate-article-charts.ts --slug <s> --validate` を実行すると全件 OK なので、
  この修正で既存の記事が赤くなることはない。
- **完了条件**: ブログ記事を含む PR で、結果表に対象 slug が行として並ぶこと。
  あわせて**壊れたチャートを 1 件混ぜて実際に赤くなることを実測する** (全 PASS は
  「何も見ていない」と区別がつかないため。`unit-semantics-standards.md` §4.5)。
- **関連**: `QUALITY-GATE-COVERAGE-01` (CI の実効網羅性の親項目)

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [起票:2026-08-13]

- **owner**: Claude Code
- **trigger**: `CROSS-PAGE-DATA-SSOT-01`のcore契約を壊さず、Claude CodeへこのIDを指定してQG0から順に実装する。
  QG0、QG2、QG4、QG7はデータ移行と独立して先行できる。QG1、QG3、QG6の最終受入は同項目のWP6後に行う。
- **目的**: 「checkerやtestファイルが存在する」ではなく、公開値を壊す欠陥を意図的に混入したときに
  対応するPR gateが確実に失敗し、修復後にgreenへ戻る状態を作る。production workspace、R2境界、主要route、
  単位・配色・欠測の意味まで同じ契約で検証し、未実行・fail-open・過度なskipを機械的に検出する。
- **QG0 完了 (2026-08-26)**: `quality-gates.json` に26 workspaceとcritical checker 43件を登録し、
  checkerの実行文脈を `declared / invoked / blocking / scheduled` へ分類した。blocking 41件・scheduled 22件に対する
  未宣言criticalは0。未配線、docs-only、`continue-on-error`、期限切れ例外、重複ID、不存在command、
  未宣言criticalのfixture 11件と実repo監査がgreen。次はQG1から再開する。
- **QG1 checkpoint (2026-08-26)**: production webからe-Stat providerへの推移import graphをAST化し、
  static/dynamic/re-export/require/wrapper/aliasを検出、type-onlyだけを許可する18 testを固定した。
  ThemeCatalogとWeb runtimeのchart propsを共有parserへ統合し、欠落`statsDataId`、空配列、非string filter、
  未知field/chart/metricKeyを両側で拒否する。unit classifierはSI倍率、分母の母集団・量、異なる計数単位、
  片側period不明を理由付きで判定し、公開`./unit` APIを実際のテーマ軸判定へ接続した。残りはmoney unit監査の
  blocking配線とsource/stored/display/recipe変異で、QG1カード全体は未完了。
- **QG2 完了 (2026-08-26)**: `createSnapshotReader`をruntime parser必須にし、正常 / 404 / malformed /
  schema-invalid / 旧新schema / stale / 5xx / timeoutの9状態をfixtureで固定した。categoriesはproducer→reader
  round-tripとpage adapterの状態写像を検証し、stats-r2、page-components、area profile/databook、correlation、
  ranking itemなど公開routeへ届く優先readerをparser境界へ移行。reader契約inventoryも機械化した。
  対象69 test、packages 1,930 test、web 1,081 test、全workspace + scripts type-checkがgreen。次はQG3。
- **QG3 checkpoint (2026-08-26)**: 同一fixtureのmetric / year / area / value / unit / provenanceを
  ranking・theme・blog adapterで縦断照合し、10倍変異をRED、復元後25 test GREENで固定した。
  known routeをstatus / canonical / heading / data要素で検証する公開route matrixと、375 / 768 / 1280pxの
  responsive smokeを追加。初回実走でCPIの空unitとbespoke地方財政の機械属性欠落を検出・是正し、
  公開8導線 + 5テーマ全9 chart type + 4幅の25 E2E、型検査、pre-commitはgreen。
  no-data / source errorの専用表示など残りのQG3受入は継続する。
- **QG4 admin slice (2026-08-27)**: PR CIのpackages testが`@stats47/*`だけを対象にし、activeな
  `apps/admin` 16 files / 150 testsを一度も実行していなかった欠落を是正した。`test` jobでadmin unitを
  blocking実行し、command削除・`continue-on-error`化・required集約からの切断を各mutationで検知する
  workspace契約を追加。契約17件、admin 150件、型検査はgreen。
- **QG4 build / media slice (2026-08-27)**: admin production buildとdesktop smoke 15件を独立required jobへ
  接続し、build欠落・E2E soft-fail・required切断をmutationで固定した。Remotionは166 sourceの
  critical bundlerとしてbundle buildをrequired並列jobへ追加し、GESは3 sourceのtooling-only generatorとして
  PRではtype-check、外部実機生成はdeferredとregistryへ明記。親側実測はadmin build 10.72秒、E2E 15/15・19.1秒、
  Remotion bundle 9.39秒、admin/media契約10/10、workspace契約25、workflow policy 64/0、checker wiring 96・new 0。
  残りQG4は全source-bearing workspaceのrisk分類、test 0 / lint / build enforcement、CI p95集計。
- **QG4 workspace matrix (2026-08-27)**: source-bearing 25 workspaceをactive 22 / tooling-only 3へ分類し、
  type-check必須25、test必須19・none 6、build必須3・none 22、lint必須1・none 24をmanifestから自動突合する
  0.10秒のblocking契約を追加した。親側で全量/mutation契約18/18、workspace契約25、workflow policy 64/0、
  checker wiring 96・new 0を再確認。QG4の分類・配線残件は0、実CI p95は統合後のrun履歴で計測する。
- **QG5 first slice (2026-08-27)**: shape gate、unit classifier、dependency collector、chart props validator、
  R2 runtime parserの5モジュールについて、実測したlines / branches / functionsの個別floorを単一inventoryへ固定し、
  PRのrequired `test` jobへ134 testのcoverage判定をblocking接続した。inventory欠落、推測floor、Vitest配線欠落、
  soft-fail、required集約切断を8 mutation契約で検知する。追加CI時間は実測4.29秒、関連65 files / 751 tests、
  契約43件、type-checkはgreen。残りQG5はcritical module拡張、web routeロジックのpure抽出、
  `src/app`一括除外縮小、意味あるfixtureによるbranch coverage改善。
- **QG5 recipe / value slice (2026-08-27)**: metric recipeとvalue verificationを同じinventoryへ追加し、
  実測floorをrecipe 100 / 93.47 / 100、value 100 / 97.91 / 100（lines / branches / functions）に固定した。
  7領域200 testsをPR blockingへ接続し、未分類IDとrecipe branch低下のRED、復元後GREENを確認。
  data-configs全64 files / 718 tests、契約8件、type-check、pre-commitはgreen。CI増分は初回QG5比約1.1秒。
- **QG6 semantic color slice (2026-08-27)**: semantic role 20件をすべて有効なhexへ解決し、移行前14色の
  goldenを固定した。`rainbow` / `red` / `var(...)` / `oklch(...)` / `series-99`をcatalog・runtime双方で拒否し、
  consumer 0だったCSS resolverを削除。対象67 test、data-configs全727 test、type-check、catalog監査はgreen。
- **QG6 render deterministic contract (2026-08-27)**: opt-in render 9件のinventory、TZ・locale・viewport・DPR・
  font SHA・artifact出力先・RAF待機を決定的契約へ固定し、通常suite 28 files / 172 testsはgreen。opt-in実走は
  37 files / 185 testsのうちpixel差7件が残ったため、停止条件どおりPR必須化・scheduled配線は保留した。
  次は固定raster engineでgoldenを再検証し、7件を解消後にworkflowへ接続する。
- **監査ベースライン (2026-08-13、ローカル実測)**:
  - rootの`test:packages`は`vitest run --project '@stats47/*'`で、`apps/admin`のunit test
    **14 file / 136 test**はPR CI対象外。galleryにはPlaywright 6 specもあるがworkflowから呼ばれていない。
    PRのbuildは`apps/web`だけで、gallery / remotion / gesのbuild・smokeは明示されていない。
  - `apps/remotion`は約166 source file、`apps/ges`は3 source fileだがテスト0。testのない小packageもある。
    すべてへ一律にtestを足すのではなく、active / inactive / tooling-onlyとownerを先に確定する必要がある。
  - web coverage floorはlines/statements/functions 22%、branches 46%。`src/app/**`、middleware、provider、store等が除外され、
    packages側はcoverage thresholdを持たない。重要な境界が増えても全体率だけでは回帰を検出できない。
  - web E2Eは14 specあるが、known rankingを`200`または`410`で許し、`410`ならskipするケースがある。
    テーマchartの値・単位・非空状態、category / survey / tag / city-categoryの主要導線、PR前responsive smokeが不足する。
  - `fetchFromR2AsJson<T>`は`JSON.parse(...) as T`で、runtime schemaを検証しない。`packages/stats-r2`のreaderと
    `createSnapshotReader`の直接testがなく、22以上のtyped R2 read sourceに検証有無のばらつきがある。
  - e-Stat境界checkは導入途中だが、静的import中心の検出ではdynamic import、re-export、ローカルwrapper経由を
    取りこぼせる。production providerへの推移的な到達を検査し、最終allowlist 0を受入条件にする必要がある。
  - 金額単位監査は347 metric中consistent 5 / mismatch 42 / unknown 300だが、通常実行は
    `--fail-on-error`なしでexit 0。checker wiringは84 checker / new unwired 0と報告する一方、package script、docs、skillからの
    テキスト参照も「配線済み」に数えるため、PRで実行されるblocking gateかを保証しない。
  - semantic color roleは現行20個で、採用済みruntimeは生成時hex解決。一方で未定義CSS tokenを返す
    `resolveChartColorCssVar`だけが未使用で残り、resolver parity testが実consumer不在を隠す。
    visualizationのrender test 9件は`RUN_RENDER_TESTS=1` opt-inでworkflow実行がない。
  - `provenance-audit-weekly.yml`はcatalog / area databook / open-data validatorを`|| true`で継続し、全exit codeを
    集約していない。prefecture statistics / open-dataの決定的validatorやlink checkにも定期実行の空白がある。
  - theme actionには取得失敗を`[]` / `null` / 空timeseriesへ変換する経路があり、HTTP 200だけのE2Eでは
    `no-data`、`source-unavailable`、`schema-invalid`を区別できない。
  - config warningは少なくともunit語彙45 use、polarity未割当2,241、catalog warning 194が残る。
    一括strict化ではなく、warning class別の縮小ratchet・owner・期限が必要。
- **進行中実装の再監査残件 (2026-08-13、欠陥fixtureで再現)**:
  - e-Stat境界checkはstatic value importの12 testがgreenだが、`import()`、re-export、`require()`を各1件入れると
    すべて未検出 (`false`)。直接import一覧10 fileに対しproductionの`fetchEstatData(` callerは少なくとも15 file、
    `fetch-db-chart-data.ts`だけでdynamic value importが3箇所あり、現在のgreenはruntime到達0を意味しない。
  - `validateChartProps("line-chart", {estatParams:[{cdCat01:"A"}]})`とdonutの`color:"rainbow"`が
    どちらもerror 0。`componentProps`は依然`Record<string, unknown>`でapp側parserと形を二重定義し、
    `StatSeriesRef`はrepresentative fixture以外のconsumerがまだない。
  - `classifyUnitComparability`は`kg→g`、`km→m`、`l→ml`、`人口10万対→人口千対`、`件→校`を
    すべて`same / factor 1`と判定する。片側だけperiodがある場合も`same`になる。さらにpackageの`./unit` exportは
    `unit-semantics.ts`だけを指し、このclassifierはtest以外から公開・利用されていない。
  - catalogの生色は179→0まで移行した一方、roleは現行20個、CSS tokenは0、CSS resolverのconsumerも0。
    runtimeは`transform`でroleをhexへ戻す方式。移行前14 distinct色を確認する逆写像testは、移行後の
    `baseline.distinctColors=[]`をloopするため空振りgreenになり、未知roleもresolverが文字列のまま通す。
  - live監査はpure core testがなく、`--limit 0`で0/192件でも`coverageOk:true`・exit 0を実測した。
    返却行が要求filterを満たすかは照合せず、scheduled workflowも監査exit codeをIssue条件へ使うだけで
    最後に非0を返さないため、GitHub上のrunは成功表示になりうる。
- **依存と責務境界**:
  - データ取得のR2一本化、`StatSeriesRef`、単位変換一回、theme dependency、semantic color roleの実装本体は
    `CROSS-PAGE-DATA-SSOT-01`が所有する。本項目は、その契約を迂回できないtest / CI / mutationを所有する。
  - `sourceUnit` / `valueScale`と金額42件の実データ是正は`MONEY-UNIT-SCALE-01`、shape / configHashは
    `RANKING-VALUES-PARTITION-INTEGRITY-01`を再利用する。同じ分類表・allowlist・監査母集団を複製しない。
  - 公開blog / ranking / themeのlive期待集合、欠落asset / R2 payloadの是正、alertのopen / closeは
    `PUBLIC-DATA-CONTRACT-AUDIT-01`が所有する。本項目のQG2 / QG3は、その監査が使うruntime schema、fixture、
    page adapter、E2Eを所有し、別のlive scannerを作らない。
  - baselineに残る個別findingの返済は`MAINTENANCE-DEBT-PAYDOWN-01`が所有する。QG7はbaselineを増やせない
    機械契約と期限管理だけを実装し、既存findingを本項目へ複製しない。
  - 完全DBレスを維持する。廃止済みD1用のintegration testを増やさず、実態がunit testの`test:integration`は
    内容に合う名称へ変更または削除する。
- **実装規律**:
  - Claude Code単独を既定とし、同じworking treeでwriterを並行起動しない。開始時にdirty fileを列挙し、
    このIDと無関係な差分を編集・stageしない。`git add -A`、commit、PR、deploy、workflow dispatch、R2 writeは禁止。
  - 各QGで、まず最小の欠陥fixtureを入れて対象gateがredになることを確認し、その欠陥だけを直してgreenへ戻す。
    greenの確認だけで完了にしない。fixtureの欠陥は作業中に戻し、repositoryへ壊れた状態を残さない。
  - deterministicな検査はPR blocking、secret・network・pixel差の影響を受ける検査はscheduled / manualに分離する。
    不安定だから検査自体を消すのではなく、同じ契約をfixtureでPR、live dataでscheduleの二層にする。
  - baselineは現行欠陥を一時許可する縮小ratchetだけに使う。current branchの定数だけと比較せず、merge-baseの結果と比較し、
    baseline値の引上げ・allowlist追加・skip追加を通常の機能差分で同時に通せないようにする。
- **実行順**:
  1. **QG0 — 実行される品質ゲートのインベントリをSSOT化**
     - root workspace一覧、各workspaceのsource数、`type-check` / `test` / `coverage` / `lint` / `build`、
       PR / scheduled / pre-commit / manualの実行箇所をpure collectorで列挙する。active、tooling-only、inactiveを
       owner・根拠・再確認日付きで分類し、未分類をerrorにする。
     - 既存の機械configがなければ`.claude/config/`に品質ゲートregistryを置く。最低fieldは`id`、`command`、
       `scope`、`owner`、`trigger`、`blocking`、`network/secrets`、`timeout`、例外時の`reason` / `expiresAt`。
       `.github/workflows/README.md`と`docs/01_技術設計/06_自動化インベントリ.md`はこのregistryの説明・参照だけを持つ。
     - `check-checker-wiring.cjs`を、単なる文字列参照ではなく`declared` / `invoked` / `blocking` / `scheduled`へ分類する。
       package.jsonまたはdocsだけから参照されるcritical checker、存在しないcommand、期限切れ例外、重複IDをerrorにする。
     - fixtureへ「未配線checker」「docsからだけ参照」「workflow内`continue-on-error`」「期限切れ除外」を各1件seedし、
       すべて検知するtestを追加する。現行84件を新分類へ移した後、criticalな`declared-only`を0にする。
  2. **QG1 — e-Stat・単位境界の迂回防止**
     - TypeScript ASTまたは既存parserで、production `apps/web`から禁止providerまでのimport graphを作る。
       static value importだけでなく`export ... from`、`require()`、valueの`import()`、alias、ローカルwrapper経由を検査し、
       `import type`だけを除外する。endpoint文字列の直書きも別ruleで検出する。
     - static import、dynamic import、re-export、wrapper、alias、type-onlyの6 fixtureを置く。最初の5つがred、type-onlyだけがgreen。
       移行中allowlistはfileと理由・期限を持つ縮小専用とし、`CROSS-PAGE-DATA-SSOT-01`完了時に0へする。
     - catalog validatorとapp側`theme-chart-props.ts`が別々に形を解釈しないよう、chart種別のshared schemaまたは
       単一parserへ寄せる。`CatalogChart.componentProps`の`Record<string, unknown>`をdiscriminated unionへ置換し、
       現行移行中schemaでも`estatParams`内の`statsDataId`必須、空配列、非文字列filter、未知field / 未知chartを両方向testする。
       `StatSeriesRef`はfixtureを作るだけで完了にせず、実catalogとreaderのconsumerになり、metricKeyをregistry照合する。
     - money unit監査をPRまたはsnapshot生成前のblocking commandへ配線する。mismatchは常にerror、unknownは
       `meta-missing` / `no-tab-pinned`等のreason別baselineにし、新規unknownとbaseline増加をerrorにする。
       `sourceUnit`、stored/display unit、scale、period、recipeHashを1つずつ変異させ、取り込みgateとR2監査の両方が落ちることを確認する。
     - unit modelに基底単位への倍率と分母の量・母集団を持たせ、`kg↔g`、`km↔m`、`l↔ml`、`kWh↔MWh`、
       `人口10万対↔人口千対`を正しい倍率または比較不能へする。`件↔校`のような異なる計数単位を自動でsameにしない。
       periodが片側だけ不明な場合もsameと断定せず、理由付きunknown / incomparableへする。
     - 金額だけでなく上記SI・分母・計数・片側periodを両方向mutationへ追加し、`./unit`の公開entryからclassifierを
       importできるようにする。少なくとも実際のchart軸判定または監査1箇所をこの公開APIへ移し、test専用の死んだSSOTにしない。
  3. **QG2 — R2 producer / schema / reader契約をruntimeで閉じる**
     - R2 readerをconsumer別に棚卸しし、criticality、runtime parser、missing時の挙動、fallback、ownerを表にする。
       genericの`JSON.parse(...) as T`をproduction境界で直接使わず、既存schema libraryまたはpure type guardをreaderへ渡す。
     - `packages/stats-r2`、ranking item / values、page-components、categories、area profile/databook、correlations等の
       公開routeに届くsnapshotから優先してschemaを定義する。producerが出力したfixtureを同じreaderで読む
       round-trip testを置き、producerとconsumerが別の型を複製しない。
     - `createSnapshotReader`へ、正常、404、malformed JSON、schema-invalid、旧schema、新schema、stale、5xx、timeoutのtestを置く。
       fallback可能な旧schemaは明示migrateし、壊れたpayloadを空配列へ変換しない。
     - 返り値を少なくとも`ok` / `no-data` / `source-unavailable` / `schema-invalid` / `stale`で識別し、
       page adapterが各状態を意図した表示・ログへ写像するtestを追加する。retryやstatus分類にモデルを使わない。
  4. **QG3 — 公開ページの値・単位・欠測を縦断検証**
     - 固定fixtureに、同じmetric / year / areaの期待value・unit・label・provenanceを置き、ranking、theme、blog chart adapterが
       同じreader結果を表示するcontract testを作る。値の10倍、yearずれ、unitだけ変更、area欠落を別mutationとして落とす。
     - Playwrightのroute matrixへhome、known ranking、theme代表9 chart type、category detail、survey list/detail、tag、
       prefecture、city-categoryを登録する。公開が契約済みのknown routeで`200 | 410`や条件付きskipを許さず、
       期待status、canonical、主要heading、chart/data要素をassertする。
     - theme代表routeはHTTP 200だけでなく「期待chart数」「各chartのdata state」「unit」「year」「空でない系列」を検査する。
       意図したno-data fixtureは専用表示をassertし、source errorで空表示へ化けるケースを分離する。
     - 375 / 768 / 1024 / 1280pxのうち主要3導線をPR smokeへ入れ、全routeのresponsive監査はscheduledに残す。
       テストコメントとfixtureから旧D1前提を除き、R2 snapshot契約へ合わせる。
  5. **QG4 — workspace別CI matrixを明示化**
     - rootの`test:packages`を「packagesだけ」と明示したまま、active appを含む`test:all`相当の入口を追加するか、
       workflowでworkspace matrixを生成する。`apps/admin`の14 file / 136 unit testをPR CIへ必ず含める。
     - galleryはtype-check・unit・buildをblockingにし、6 Playwright specは変更pathでPR、全件をscheduledにする。
       remotionはactiveならtype-check/buildと代表compositionの決定的render smoke、gesはactiveならtype-checkと最小unit testを追加する。
       inactiveなら「testなし」を黙認せず、owner・理由・再確認期限付き例外にする。
     - sourceを持つpackageについて、純関数・変換・公開export・外部I/O境界の有無でrisk分類する。criticalなのにtest 0、
       `lint` scriptなし、build成果物を公開するのにbuild未実行、workspace追加後にmatrix未登録の状態をcheckerで拒否する。
     - CI時間をjob summaryへ記録し、cache込みPR p95が既存上限を5分超えて増える場合は、非決定的E2E/renderをscheduledへ分ける。
       type-check、unit、schema、境界guard等の決定的gateは時間理由で外さない。
  6. **QG5 — coverageを全体率から重要契約の回帰防止へ変更**
     - webとcritical packageのcoverage JSONを保存せず集計し、module / folder別の現行値を再計測する。
       初期floorは実測値を超えて推測せず、merge-baseからlines / branches / functionsのいずれも低下したら失敗させる。
     - 新規・変更したpure validator、unit classifier、shape gate、dependency collector、R2 parserは、全分岐をfixtureまたは
       mutationで通す。生成file、型だけのfile、framework boilerplate以外を都合よくcoverage除外へ追加しない。
     - `src/app/**`を一括除外したままにせず、route固有ロジックをpure moduleへ抽出してunit対象にし、page wiringはE2Eで検査する。
       package coverageをPR matrixへ足し、低い全体率を埋めるだけの無意味なtestは追加しない。
  7. **QG6 — semantic colorとrender結果を実ブラウザまで検証**
     - 採用済みの最終形を「git TSはrole、page-components / R2 / renderer入力は生成時に
       `resolveChartColorHex`でhex化」へ統一し、現行rendererを変えず未使用CSS resolverを削除する。
       CSS-var追従は今回へ混ぜず、必要ならdark modeの挙動変更として別途判断する。
     - 現行`CHART_COLOR_ROLES`全件（現在20）について、role→hexの全域性とcatalog→生成物の解決を確認する。
       移行前14 distinct hexはcatalogの
       空集合から導出せず固定fixtureまたはmerge-base生成物から取り、全色が同じ出力へ写る非空testにする。
     - 色キー値は「raw colorの正規表現に一致しない」ではなく「既知roleである」を条件にする。`rainbow`、named color、
       `var()`、`oklch()`、不明roleをvalidatorで拒否し、移行完了後のresolverは未知値を素通しせずfail-closedにする。
     - Playwrightで代表chartの実描画色を読み、未解決値、正負色反転、seriesと凡例の色不一致、light/darkのcontrast不足を検査する。
       新しいliteral colorは既存例外以外でPRを失敗させる。
     - opt-inのrender test 9件を、font・locale・timezone・viewportを固定して実行する専用jobへ配線する。
       変更pathではPR、全件はscheduledで実行し、差分artifactを保存する。pixel更新は欠陥を説明せず一括acceptしない。
  8. **QG7 — fail-open、warning、skip、baselineの縮小管理**
     - `provenance-audit-weekly.yml`で各validatorのexit codeを個別に保持し、最後に集約してjob statusとIssue本文へ反映する。
       出力収集目的の`|| true`は許しても、最終stepが1件でもerrorなら非0で終了するtestを置く。
     - prefecture statistics / open-dataの決定的validatorをPRまたはscheduledへ配線し、network link checkはtimeout、retry、
       stale判定、alert ownerを持つscheduled jobにする。secret不足は成功扱いせず`not-run`としてsummaryとalertに出す。
     - catalog、polarity、unit語彙、maintenance debt等のwarningをcode別に数え、`count`、`owner`、`reason`、`expiresAt`を持つ
       shrink-only baselineへ移す。新code、新warning、期限切れ、件数増加、baseline引上げを失敗させる。
     - `test.skip`、環境変数opt-in、除外glob、`continue-on-error`を機械列挙し、owner・理由・期限のないcritical除外を拒否する。
       product factoryの凍結test、GIS/e-Stat live test、render test等を同じregistryで追跡する。
     - `theme-chart-live-audit.mjs`のargument / mirror schema / inspect / coverage判定をpure coreへ分け、0・負数・NaNのlimit、
       空mirror、重複key、件数不一致、API status、malformed JSON、wrong-filter rowsをfixtureで検査する。partial実行は
       `coverageOk:false` / `status:partial`とし、smoke成功と全件成功を同じexit / stateで表現しない。
     - e-Stat返却行の`@tab` / `@cat01`等を要求した`cdTab` / `cdCat01`等と照合し、APIがfilterを無視して別系列を返しても
       greenにしない。scheduled jobはstate保存とIssue更新を終えた後、監査失敗なら最終stepで非0を返す。
  9. **QG8 — 最終mutation、文書、preflight**
     - e-Stat dynamic / wrapper、金額scale、SI倍率、分母量、R2 schema、theme dependency、未知色role、色逆写像の空集合、
       live監査0件 / wrong-filter、known route、workspace未登録、validator exit code、warning baselineの欠陥を一つずつseedし、
       該当PR gateだけがred、復元後に全gateがgreenになる結果を表で記録する。
     - `npm run type-check`、`npm run test:packages`、`npm run test --workspace=apps/admin`、
       `npm run test:coverage --workspace=apps/web`、web Playwright、active appのtype-check/build、追加したquality registry testを実行する。
       R2 schema / SSG / routeに触れたまとまりの節目で`npm run build --workspace=apps/web`も実行する。
     - 恒久契約だけを`apps/web/tests/README.md`、`.github/workflows/README.md`、
       `docs/01_技術設計/06_自動化インベントリ.md`とコード近傍READMEへ反映する。文書変更後は
       `npm run docs:fix`、`npm run docs:check`、`npm run docs:check:all`を実行し、開始時の既存warningから増えていないことを確認する。
     - 変更file、追加job、CI時間before/after、未実行live監査、例外残数、rollbackをpreflightとして提示する。
       commit / PR / deploy / workflow dispatch / branch protection変更はownerの明示承認まで実行しない。
- **停止条件**:
  - merge-baseとの差分を取れずbaselineを縮小専用にできない、またはmutationを入れても想定gateがgreenのまま。
  - CI追加がcache込みp95で5分超の増加、外部API rate limit、secret不足、pixel差の非決定性によりPRを安定して再現できない。
    この場合はdeterministic fixtureをPRに残し、live / visualだけをscheduledへ分離して再計測する。
  - runtime schema導入で既存R2 payloadを後方互換に読めず、remote再生成・R2 write・公開値変更が必要になる。
  - inactive workspaceの削除、branch protection、GitHub secret、remote workflow、deploy、R2への変更が必要になる。
  - ユーザー差分との競合、検査母集団の理由なき減少、allowlist / baseline / skipの拡大が必要になった場合は、
    対象、証拠、影響、最小の選択肢を提示してowner判断を待つ。
- **完了条件**:
  - 全workspaceと全critical checkerがregistryで分類され、criticalな`declared-only`、ownerなし、期限切れ例外が0。
    galleryの136 unit testがPRで実行され、active appはtype-check / test / buildの必要範囲が明示される。
  - production webからe-Stat providerへの推移的到達0。dynamic import / re-export / wrapperを含む陰性対照が境界gateで落ちる。
  - chart propsのshared schemaをcatalog / validator / app parserが共有し、`Record<string, unknown>`の二重解釈がない。
    `StatSeriesRef`が実catalog / readerで使われ、欠落`statsDataId`、未知field、未知metricKeyを拒否する。
  - unit classifierが金額、SI倍率、分母量、計数語、両側/片側periodを理由付きで判定し、誤ったfactor 1を返さない。
    公開package entryから利用でき、少なくとも1つのproduction判定と監査が同じAPIを使う。
  - 公開routeへ届くcritical R2 snapshotはruntime schemaとproducer-reader round-trip testを持ち、malformed / old / stale / 5xxを
    空データと区別する。同じfixtureのmetric / year / value / unitがranking、theme、blogで一致する。
  - known routeを`200 | 410`やskipで逃がさず、代表9 chart typeの非空・unit・year・data stateをE2Eが検証する。
  - 全color role（現行20）が選択した単一の解決方式、catalog、生成物、rendererで一致し、未知roleを拒否する。
    移行前14色の非空goldenとrender test 9件がPR変更pathまたはscheduledで実行される。
  - provenance等のvalidator失敗が最終job statusへ伝播し、warning / skip / baselineはcode別縮小ratchetで新規増加0。
  - theme live監査は0件・partial・wrong-filterを全件成功と扱わず、collectorが返す期待集合（現行移行中192件）の
    全件照合時だけcoverage成功になる。
    監査失敗はstate / Issue更新後もscheduled runの最終statusへ非0で伝播する。
  - QG8のmutationがすべて意図したgateをredにし、復元後に対象test、全type-check、必要build、docs checkがgreen。
    CI時間は停止条件内で、未実行のlive検査・外部反映・例外は0またはowner・期限付きで明示される。
- **正典**: `.github/workflows/pr-quality-check.yml` / `.github/workflows/README.md` /
  `docs/01_技術設計/06_自動化インベントリ.md` / `apps/web/tests/README.md` /
  `.claude/scripts/lib/check-checker-wiring.cjs` / `apps/web/coverage-thresholds.json` /
  `packages/r2-storage/src/lib/operations/` / `packages/stats-r2/` /
  `CROSS-PAGE-DATA-SSOT-01` / `MONEY-UNIT-SCALE-01` / `RANKING-VALUES-PARTITION-INTEGRITY-01` /
  `PUBLIC-DATA-CONTRACT-AUDIT-01` / `MAINTENANCE-DEBT-PAYDOWN-01`

### [AICONTENT-DBLESS-REBUILD] ranking ai-content生成の完走

タグ: [進行中] [起票:2026-06-01]

- **owner**: ranking-content-author
- **次**:
  1. develop で `bash .claude/scripts/ai-content/run-claude-batch.sh` (既定 35 件 / Sonnet / retries 1 / concurrency 2) を
     1 push = 1 commit で回す。**最初の 35 件バッチで Pro/Max 枠のレート制限 (`claude-error_*` reason) が出るかを観測**し、
     1 日の件数はそこから決める (推測で置かない)。公開後は `audit-ai-content.mjs <key>` で R2 の内容一致を見る
  2. manual-escalation 30 件 + quarantine だけ Opus Agent tool (`ranking-content-author` を `model: opus` で起動)
  3. (並走・別件) 課金を有効化していない専用 Google AI Studio project の `GEMINI_API_KEY` を確認して
     `ai-content-gemini-daily.yml` を復旧する。既定 3 件/日・並列 1 を維持し、7 run 以上の
     通過率・quota 失敗・author/critic request・token を観測するまで件数を上げない
- **2026-09-05 pilot 完了**: CLI 再ログイン後、pilot 0 (1 件 PASS・$0.35) → pilot 1 (Haiku 0/10 で不適・Sonnet 4/9 全て
  2-3 回目) → 原因 2 つ (stdout の文字化けバグ・県別解説の定型化) を修正 → verify1 **6/6・$0.51/件・43K トークン/件**。
  運転設定を `run-claude-batch.sh` の既定に焼いた。正典 `ranking-content-standards.md` §2026-09-05
- **2026-09-05 本番 3 バッチ**: 公開 54 件 (done 718 → 772・残 1,394)。batch1 は 26 件が原因不明の CLI 失敗 (stdout を
  捨てる欠陥 → 修正)、batch2 は定型化 REVISE が支配的 → prompt に県数・地方別順位表を機械計算で渡し、critic に author の
  制約を前提として明文化。batch3 (35 件・concurrency 2) は **OK 25 / REJECT 9 / FAIL 1・$0.81/公開件・50 分・レート制限なし**。
  `public-kindergarten-ratio` が 3 連続不合格で quarantine 入り (Opus 例外是正の初例)。次は 1 日 1〜2 バッチで回し、
  `claude-error_*` が出たら止める
- **2026-09-05 checkpoint**: Gemini 日次 CI は 08-30 から `preflight_status=billing` で 8 run 連続 PASS 0 (鍵の
  前払いクレジット枯渇。モデル品質ではない)。残 1,445 件 (done 718 / active 2,163) を Claude で消化するため、
  Agent tool 経路 (1 件 $16-18) ではなく **headless `claude -p` 経路**を整備した:
  `generate-parallel.ts` の `--model claude-*` を lean 化 (repo 外 cwd・`--tools ""`・`--setting-sources local`・独自
  system prompt・`--output-format json` で usage/cost 取得・alias allowlist)、`--critic claude-*` 新設、
  `run-claude-batch.sh` (preflight → キュー → 生成 → 監査 → critic → history.csv/quarantine → 1 commit → push →
  publish run 待ち)、`history.csv` に `cost_usd` 列。dry-run・型・vitest 50・node test 54 は green。
  **実 LLM 呼び出しは未実施** (CLI 未ログインのため)。正典 `ranking-content-standards.md` §2026-09-05。
- **2026-08-30 checkpoint**: 高コストだった Claude Code/OAuth の自動量産を復活させず、
  `gemini-2.5-flash-lite` の structured author → 決定的監査 → 別リクエスト critic → 最大1回再生成 →
  PASS分だけ outbox/publish という日次 CI を実装した。対象あり生成0件、Secret欠損、preflight、
  develop push、publisher dispatch/run未確認を hard fail にし、本文を含まない集計を
  `.claude/state/metrics/ai-content/`、キー別失敗を quarantine state に残す。旧対話3件並列は
  quarantine / 高流入キーの手動例外是正だけに縮退した。
- **2026-08-26 checkpoint**: R2公開後にactive 2,167件を全量再構築し、done 362 / needs 1,805
  （missing 198 / incomplete 1,548 / blocker 59）を確定。当日公開9件はすべて公開R2の決定的監査が
  blocker 0 / warn 0で、Googlebotの対象routeも200。上位5件
  `gpp-public-service` / `voter-turnout-governor` / `high-school-teacher-annual-income` /
  `junior-high-club-per100-soft-tennis` / `junior-high-club-per100-swimming`は公開済み。意味criticで、公務分の指標名、暦年/年度、派生指標の
  分子・分母時点を是正した。疎なpartitionは実観測件数とcommentary件数を照合し、未観測県を
  47件へ水増ししない監査契約を追加（AI監査48 test green）。当日の月次上限内で生成を停止し、次回は
  `other-fresh-fish-consumption-expenditure`から再開する。
- **2026-08-26 next 1**: `other-fresh-fish-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  長崎9,910円（1位）/ 高知3,652円（47位）を含む順位・県名・値・areaCode不一致0、機械監査
  blocker 0 / warn 0。独立criticの初回REVISE（数値過多・反復・神奈川の誤認）を是正し、delta最終PASS。
  R2公開は全データrefreshとの競合を避け、親工程で直列実行する。
- **2026-08-27 next 2**: `game-console-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  静岡3,033円（1位）、8県0円（同率40位）を欠測へ変換せず全47県の解説へ保持し、構造不一致0、
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのdelta判定までgreen。R2公開は全データrefresh後に直列実行する。
- **2026-08-27 next 3**: `manufacturing-establishments`を2024年度・事業所・47県の公開R2へ接地して生成。
  大阪18,481（最大）/ 鳥取854（最小）、欠測・0値・同率0、全areaCode・県名・順位・値の不一致0。
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのREVISE 4点をdelta是正して最終PASS。
- **2026-08-27 next 4**: `cod-roe-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  福岡4,870円（最大）/ 沖縄589円（最小）、欠測・0値・同率0、全areaCode・県名・順位・値の不一致0。
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのREVISEを全件delta是正して最終PASS。
- **2026-08-27 next 5**: `library-lending-books`を2020年度・冊・47県の公開R2へ接地して生成。
  東京85,113,851冊（最大）/ 秋田2,463,802冊（最小）、欠測・0値・同率0、全areaCode・県名・順位・値の
  不一致0。機械監査blocker 0 / warn 0、AI監査48件、独立criticのfull / delta 2回を是正して最終PASS。
- **2026-08-27 next 6–7**: `sole-proprietor-sales`（2025年・万円）と
  `coffee-drink-consumption-expenditure`（2024年・円）を公開R2の47県へ接地して生成。欠測・0値なし、
  同率順位と全areaCode・県名・順位・値を保持し、各機械監査blocker 0 / warn 0、AI監査48件、
  独立critic full→外科修正→delta PASS。3件ともCIの権威ゲートを再通過し、R2公開・CDN purge・
  outbox削除まで成功（runs `32989601036` / `32991476893` / `32991854174`、skip 0 / upload error 0）。
- **2026-08-27 next 8–9**: `deaths-lifestyle-diseases`（2023年度・人）と
  `junior-high-club-per100-basketball`（2025年度・人）を公開R2の47県へ接地して生成。全areaCode・県名・
  順位・値・年・単位の不一致0、機械監査blocker 0 / warn 0、AI監査48件、独立criticのfull→外科修正→
  delta PASS。CIの権威ゲートを再通過し、R2公開2件・CDN purge2 URL・outbox削除まで成功
  （run `33005947804`、skip 0 / upload error 0）。
- **完了条件**: 全active rankingを処理し、欠測・矛盾・未検証生成を0にする。R2 pushとCDN反映は別承認。
- **正典**: `.claude/rules/ranking-content-standards.md`

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [進行中] [起票:2026-07-22]

- **owner**: Claude Code
- **現況**: 全`article.md`参照から期待asset集合を作る公開契約監査へ拡張済み。公開434記事・本文参照
  1,091 assetで `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` だけが404。SVGは既存JSON/sourceから
  ローカル再生成済みで、公開gateもdata refresh / blog publish / 週次へ配線済み。R2全量pullのdry-runは
  `app/blog` 8,913 files（local差分8,526）を確認したが、read-only取得の承認前なので実pullしていない。
- **2026-08-27 生成物監査**: R2 `app/blog` 8,944 filesをローカルへ同期し、432記事・2,443 SVGを同一lintで
  再走査した。構造error 98記事、dark mode非対応135記事を機械stateへ記録した。旧stateの98記事・141 SVG・error 0は母集団が
  生成物全量を覆っておらず、完了証拠には使えない。公開参照asset契約とSVG内容品質は別gateとして維持する。
- **次**: 構造error 98記事を優先し、小バッチで処理する。R2由来、算式、年、metric keyを復元できない図は
  推測で再生成しない。公開参照asset契約と内容品質gateを各バッチ後に再実行する。
- **完了条件**: 全公開記事の参照assetが200、must-fix 0、公開gate greenとなり、source lineage不明の図は削除または明示的に保留される。
- **正典**: `.claude/rules/blog-data-schema.md`

### [BLOG-REVIEW-AREA-RATIO-01] 面積割合記事の除外定義・同率順位・構造分析を是正する

タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [検証:node .claude/scripts/blog/quality-gate.mjs area-ratio-prefecture-gap] [起票:2026-08-29] [Codex候補]

- **次**: #B01101の除外範囲をタイトル・description・定義・出典へ反映し、同率順位を未丸め値で確認する。上位・下位差は公的一次資料で実証し、接地できなければ検証論点へ限定する。
- **禁止**: 未確認の順位や、面積割合だけから行政・インフラへの因果を断定しない。
- **完了条件**: 指摘4件を解消し、独立blog-criticがPASS、quality gateがexit 0になる。

## 🟡 中 — 2〜3ヶ月以内

### [CI-DEVELOP-GATE-COVERAGE-01] develop 向け PR で決定的ゲートを走らせ、main への PR で初めて落ちる状態を止める

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:develop 向け PR で Static Gates 相当と Unit Tests が走ること] [起票:2026-09-03] [期日:2026-10-15]

- **owner**: devops-runner
- **症状 (2026-09-03 実測)**: PR #913 が入れた 2 つの欠陥 (check-ad-placement のリテラル不一致・
  native 枠の在庫フォールバック喪失) が develop では一度も検知されず、デプロイ PR #915 で初めて落ちた。
  `pr-quality-check.yml` は `pull_request: branches: [main]` でしか発火せず、develop 向け PR が通る
  `develop-quality-gate.yml` は eslint・env registry・maintenance debt の 3 つだけ。husky は
  依存に無く `core.hooksPath` も設定されないため pre-commit も発火しない。
  結果、develop は「決定的ゲートを通っていないコードが積まれる場所」になっている。
- **次**: `develop-quality-gate.yml` に、決定的で速い検査だけを足す。候補は
  `check-ad-placement.cjs` / `design-system:check` / `check-card-census.cjs` (いずれも数秒) と
  `vitest run` (apps/web で実測 98 秒)。**Build Check・Full E2E・Remotion は足さない**
  (develop への push が詰まると `--no-verify` を誘発し、ゲートを足した意味が消える →
  `branch-workflow.md`「ここに重い検査を足さない」)。
- **停止条件**: 追加後の develop-quality-gate が実測 3 分を超えるなら、超えた分を外して
  main 向けに残す。判断は実測値で行い、推測で足さない。
- **完了条件**: develop 向け PR で上記ゲートが走り、意図的に壊した変更が develop マージ前に落ちる
  ことを 1 度実測する。

### [AFF-PLACEMENT-MAP-CORE-01] placement-map-core を「出典調査 → タグ → カテゴリ」に追従させ、survey の stale 判定を直す

タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [検証:node --test .claude/scripts/ads/__tests__/placement-map-core.test.mjs] [起票:2026-09-03] [期日:2026-09-30]

- **owner**: affiliate-manager
- **症状**: `.claude/scripts/ads/lib/placement-map-core.mjs` はブログを tags → vertical だけで判定し、
  ranking を categoryKey だけで判定する。#913 以降の実装は出典調査を最上位に見るので、
  `placement-map-latest.json` の `unmapped.byReason.tags-unmapped` と `demand.byVertical` が
  実態と食い違う (家計調査ページが economy に計上され続ける)。`survey-hardcoded-tags` の理由コードも
  2026-07-28 に survey ページが categoryKey 最頻値へ変わった時点で stale。
- **次**: builder の入力に surveyIds (R2 `app/ranking/<key>/item.json` / `app/blog/all.json`) を足し、
  `resolveContentVertical` と同じ順で判定する。判定は純関数のまま (`placement-map-core.test.mjs` に
  「調査 null → 広告なし」「調査あり → カテゴリより優先」のケースを追加)。
- **完了条件**: 週次 `affiliate-dashboard-refresh.yml` の出力で家計調査ページが furusato に、
  学校保健統計ページが `no-intent` (新理由コード) に計上される。

### [AFF-OFFER-LANE-01] offer profile の lane / friction 分類を進めて pilot readiness の blocked を解く

タグ: [収益化] [種類:改善] [実行:対話] [検証:.claude/state/ads/affiliate-pilot-readiness-latest.json の readiness.status が blocked 以外] [起票:2026-09-03] [期日:2026-10-15]

- **owner**: affiliate-manager (排他 writer)
- **現状**: `affiliate-pilot-readiness-latest.json` は `eligible-lane-pair-missing` で blocked。
  `affiliate-offer-profiles-data.ts` に discovery / decision の lane と F0〜F4 の行動負担が
  付いた案件が pilot 可能な組になっていない。
- **次**: furusato・economy・labor の上位案件から順に、ASP の成果条件 (確認元・確認日つき) を
  読んで lane / friction を記録する。案件名や報酬額から推測しない (rules §2)。
- **完了条件**: discovery と decision に 1 件ずつ以上 approved の案件があり、pilot plan を作れる。

### [AFF-VERTICAL-FIT-02] population / health / education 軸の上位在庫を主題に合わせて入れ替える

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-03] [期日:2026-10-15]

- **owner**: affiliate-manager / 判断は uruhayato373
- **実測 (2026-09-03)**: priority 上位 3 が主題と合っていない軸が残る。
  - population: マッチングアプリ ×2 が最上位。未婚率・婚姻には合うが、人口密度・在留外国人・
    世帯構造 (週 8K imp) には合わない
  - health: RIZAP / ClassPass が難病・精神病床・中絶率のページに出る。精力サプリは #913 で
    priority 1 に下げたが停止はしていない (improvements `AFF-BRAND-FIT-01` の判断待ち)
  - education: AI Agent Camp (Claude Code 研修) / LEC 資格講座が図書館・学校数のページに出る
- **次**: (a) マッチングアプリ・結婚相談所は `targetRankingKeys` で未婚率・婚姻・初婚年齢の
  ranking に限定する (b) 人口密度・世帯構造には子育て・保険系を上位にする (c) 図書館・学校数には
  通信教育・塾探し (エデュスタ p20) を上位にする。priority 変更は週 1 vertical 1 変更まで (rules §10)。
- **完了条件**: 3 軸とも GSC imp 上位 3 ページで priority 上位 3 の広告が主題と合っている
  (人が読んで判定。表を PR に残す)。

### [AFF-RAKUTEN-FIRST-01] 家計調査ページで楽天商品カードを native 枠より上に出し、計測を分離する

タグ: [UI・UX] [種類:改善] [実行:sweep] [検証:npm run test --workspace apps/web -- src/features/ads] [起票:2026-09-03] [期日:2026-10-31]

- **owner**: ranking-ui-manager / affiliate-manager
- **なぜ**: 「納豆消費量ランキング」の読者に最も合うのは品目一致の楽天商品カードだが、現在は
  右レールの末尾 (`RakutenItemsCard`) にあり、GA4 では `blog-sidebar` / `ranking-sidebar` に
  混ざって計測されるため効果を分離できない。
- **次**: (a) 出典調査が kakei-chousa のページでは楽天商品カードを右レール先頭 (関連ランキングの
  直後) に置く (b) `position` を `rakuten-sidebar` に分けて `link_position` で読めるようにする
  (dimension は登録済みなので値追加のみ、`analytics-event-standards.md` §2 に追記)。
- **完了条件**: GA4 の `link_position=rakuten-sidebar` が家計調査ページで取れ、CTR が
  native 枠と比較できる。

### [REFERENCE-SOURCE-EXPANSION-01] Drive参考文献3資料をinventory化して既存SSOTへ展開する（家計調査書籍は KAKEI-MARKETING-CONTENT-01）

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run source-vault:ready] [起票:2026-08-29]

- **owner**: 全体は`open-data-curator`、2021都道府県DataBookは`area-curator`、Claudeスキル構築ガイドは`knowledge-curator`。
- **現状証拠**: 全ページOCR・内部crop・解決台帳を完了。DataBook 8 PDF / 580ページは`combined-analysis` 61 /
  `context-only` 19 / `not-applicable` 500、偏差値資料6 PDF / 103ページは`rights-hold` 103、Claudeガイド
  1 PDF / 33ページは`context-only` 7 / `not-applicable` 26。3資料ともresolution coverage 100%。
- **次**: DataBookの61候補は既存area/editorial責務で必要なwaveだけ実装する。偏差値資料は図表権利と一次資料の
  両方が確定した項目だけholdを解除する。準備工程の再実行は不要。
- **完了条件**: 3資料の全抽出候補がresolutionを持ち、公開候補100%で一次資料・年度・単位・地域粒度・rightsが
  確定し、書籍値の直接投入、原文・元図・内部cropの公開が0である。
- **停止条件**: 書誌・権利、Drive private状態、manifest/hash、一次資料、OCR原本照合のいずれかが未解決なら
  `rights-hold`または`primary-source-unavailable`で停止する。remote R2、git push、PR、deploy、外部公開は別途承認。

### [KAKEI-MARKETING-CONTENT-01] 『マーケティングに使える「家計調査」』の分析・論点80件をstats47へ段階展開する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run source-vault:inventory:check] [起票:2026-09-05]

- **owner**: 台帳は`open-data-curator`、new-metricは`data-ingester`（実在検証は`estat-researcher`）、evidenceTopicsは`theme-designer`、記事は`article-writer`→`blog-critic`。
- **現状証拠**: profile `kakei-marketing-2015`（Drive `参考文献/マーケティングに使える家計調査/2015年版`、bundle r3 = PDF + ページ画像307 + 生OCR307 + Markdown文字起こし307 + 図表crop113、`stage-status` で S0〜S4 到達）を全307ページOCR（jpn_vert）し、
  `packages/data-configs/src/evidence-inventory/kakei-marketing/analyses.json` に分析・論点33件＋県庁所在市47件を authored、
  `.claude/state/source-inventory/kakei-marketing/2015/` は coverage 100%（combined-analysis 259 / new-metric 13 / reuse 3 / context-only 27 / not-applicable 5）。
  wave 0 として education-culture・real-income・fishery-marine に evidenceTopics を各1件追加済み（`validate:catalog` green）。契約は
  `docs/02_実装計画/46_その他参考文献OCR・クロップ・stats47展開実装仕様.md` §4.4。
- **進捗（2026-09-06）**: step 2〜5 は記事側が完了。既存記事更新 wave・新規記事 wave A/B の全記事と
  `<pref>-food-culture` 47本すべてが quality-gate + blog-critic PASS で R2 公開済み（live md5 一致で実測）。
  47本すべての live 本文に「数量×価格で分解する」H2 がある。接地器 `build-kakei-quantity-price.mjs` は
  未 commit だったので `countsNote`（counts は「他の〜」残余品目を除いた数）付きで develop へ載せた。
- **次（実行順）**:
  1. **残るのは deploy のみ**: new-metric 2件（`academic-achievement-test-average-rate` / `information-communication-expenditure`
     → `information-communication-coefficient`）は config・R2・KNOWN/SITEMAP まで反映済み。
     develop→main PR → CI green → merge → CDN purge → Googlebot UA で `/ranking/academic-achievement-test-average-rate` /
     `/ranking/information-communication-coefficient` / `/ranking/information-communication-expenditure` が 200
     （title が「見つかりません」でない）を実測する（`ranking-publisher` 手順 6〜8）。
     既存記事の改稿（`income-quintile-education` 等の prerender 済みページ）もこの deploy で本番反映される。
  2. inventory の `combined-analysis` 各項目が記事・theme・area のいずれかへ接続されているかを
     管理画面 `/content/references` で確認し、未接続分だけを次の wave に回す。
- **停止条件**: 書籍の数値・図表・本文を公開物へ流さない。全国集計（五分位・年齢階級・月次）を/rankingへ載せない。
  県庁所在市の値を県全体として書かない。一次資料で再取得できない項目は`primary-source-unavailable`へ戻す。
  R2 write・deploy・SNS公開は別途承認。
- **完了条件**: new-metric 2件が`validate:config`/`validate:years` green で公開パイプラインに乗り、既存記事更新wave と
  新規記事wave A の全記事が quality-gate + critic PASS、県別シリーズ47本が公開済みで、inventoryの`combined-analysis`各項目が
  記事・theme・areaのいずれかへ実在証跡で接続されている（管理画面`/content/references`で確認）。

### [REFERENCE-CONTENT-DRAFTS-01] 参考文献由来のテーマ企画と横断ブログ下書きを制作する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run test --workspace=apps/admin -- reference-expansion-plans] [起票:2026-08-30]

- **owner**: テーマ採択は`theme-designer`、ブログ本文は`article-writer`、管理画面の読み取り契約は`admin-console`。
- **前提**: `japan-zue`の解決済みinventoryは論点発見だけに使う。記事・テーマへ載せる定義、年度、単位、値は、各metricの一次資料とR2観測値で再検証する。原文、OCR、書籍値、内部cropは公開しない。
- **テーマ企画**: 参考文献で`theme`対象になり、既存ThemeCatalogまたはIndicatorSetへ未統合の制作単位だけを保持する。`draft`は採択・チャート設計待ち、`blocked`はactiveな公開metricが無いため停止中。

<!-- reference-theme-plans:start -->
| metricKey | title | targetTheme | status | hypothesis |
| --- | --- | --- | --- | --- |
| general-households | 一般世帯数 | population-dynamics | draft | 人口総数だけでは見えない世帯構造を人口動態の基礎軸に加える |
| projected-population-2020 | 将来推計人口 | population-dynamics | blocked | 将来人口と現在の人口動態を同じ時間軸で比較する |
| area-ratio-of-total | 面積割合 | climate | draft | 国土面積の差を気候・居住条件の解釈に使う前提軸として置く |
| sex-ratio-total | 人口性比 | population-dynamics | draft | 男女構成の地域差を人口移動・年齢構成と合わせて読む |
| day-time-population | 昼間人口 | labor-mobility | draft | 就業地への流入規模を通勤移動の絶対数コンテキストとして示す |
| gross-prefectural-product-expenditure-nominal-h27 | 県内総生産 | local-economy | blocked | 地域経済の規模と産業・雇用構造を同じ画面で比較する |
| electricity-generation-capacity | 発電電力量 | local-economy | draft | 電力供給規模と地域の産業基盤を並べて読む |
| agricultural-output | 農業産出額 | local-economy | draft | 農業の生産規模を地域経済の産業構成へ接続する |
| current-liabilities-balance-multi-person-households-per-household | 負債現在高 | real-income | draft | 所得・消費だけでなく家計の負債側を購買力の文脈に加える |
| consumption-expenditure-multi-person-households-per-month | 消費支出 | real-income | draft | 可処分所得と実際の支出水準の差を家計フローとして示す |
| avg-propensity-to-consume-worker-households | 平均消費性向 | real-income | draft | 所得のうち消費へ回る割合を地域別の家計行動として比較する |
| municipality-count | 市町村数 | local-finance | draft | 自治体数を行政サービス・財政構造の基礎条件として示す |
| agricultural-employment-population | 農業就業人口 | local-economy | draft | 農業産出額と担い手規模を組み合わせて産業構造を読む |
| number-of-establishments-manufacturing | 製造業事業所数 | manufacturing | draft | 製造品出荷額だけでは見えない生産拠点の厚みを示す |
| households-on-public-assistance | 生活保護被保護実世帯数 | local-finance | draft | 実数を制度利用者の優劣にせず、人口規模と自治体財政の基礎条件として読む |
| households-on-public-assistance-per-1000 | 生活保護被保護実世帯数 | local-finance | draft | 実数と世帯千対を分け、地域規模を調整した制度利用状況として読む |
| infant-deaths | 乳児死亡数 | healthcare | draft | 小標本の年次変動を明示し、実数と出生千対を分けて医療・人口動態を読む |
| infant-mortality-rate-per-1000-births | 乳児死亡率 | healthcare | draft | 出生千対の率を単年順位へ短絡せず、複数年推移と出生数を合わせて読む |
| average-life-expectancy-female-20 | 20歳女性の平均余命 | healthcare | draft | 出生時平均余命と年齢別平均余命を分離し、女性20歳時点の地域差を読む |
| average-life-expectancy-female-65 | 65歳女性の平均余命 | healthcare | draft | 高齢期の平均余命を出生時平均余命と混同せず、医療・生活条件と合わせて読む |
| average-life-expectancy-male | 男性の平均余命 | healthcare | draft | 男女・年齢別系列を同じ値として扱わず、男性系列の地域差を検証する |
| students-requiring-japanese-instruction | 日本語指導が必要な児童生徒数 | education-culture | blocked | 国籍と支援ニーズを分け、人数・児童生徒比・学校側の受入体制を重ねて読む |
<!-- reference-theme-plans:end -->

- **ブログ下書き**: `docs/21_ブログ記事原稿/{household-structure-daytime-population-gap,agriculture-output-employment-productivity-gap,electricity-generation-manufacturing-establishments-gap,household-spending-debt-propensity-gap}/article.md`。4本とも`published:false`で、一次資料・R2接地前の数値主張を置かない。
- **次**: テーマはactiveな19指標を既存カタログへ採択する順序を需要と重複で決める。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
- **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
- **完了条件**: activeなテーマ企画19件が採択または理由付き不採用となり、blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [起票:2026-08-17]

- **owner**: Claude Code
- **症状 (2026-08-17 実測)**: `sync-snapshots --only ranking-items` 完走後も
  `/ranking/marriages-per-total-population` の `<title>` が旧値 (2014年・東京 6.49) のままだった。
  三層で切り分けた結果 **R2 と Worker は正しく、Cloudflare エッジだけが stale**:
  - R2 `app/ranking/<key>/item.json` の `generatedAt` = 20:25:21・新 seoTitle 入り
  - `?cb=<random>` でエッジを迂回 → **新 title**・`cf-cache-status: MISS`
  - 素の URL → 旧 title・`cf-cache-status: HIT`・`age: 1649`
- **原因**: `sync-snapshots.yml` の「🧹 Purge Workers Cache after snapshot sync」が呼ぶのは
  `purge-worker-cache.ts` で、**Workers Cache しか消さない** (スクリプト冒頭に
  「zone purge API は Workers Cache へ影響しないため」と明記されている)。
  ゾーンのエッジキャッシュは別レイヤで、誰も purge していない。
  さらに origin は `cache-control: public, max-age=0, must-revalidate` を返しているのに
  エッジが HIT を返す = **Cloudflare 側の Cache Rule が Edge TTL を上書きしている**
  (`ogp-image-standards.md` §5.0 の `storage.stats47.jp` が `max-age=14400` を返すのと同じ構図)。
- **なぜ毎回は表面化しないか**: エッジにエントリが無い URL は origin まで抜けるので新値が出る。
  実際 同じ同期で `divorces-per-total-population` は即座に新 title になった。
  **「1 ページ直ったから反映済み」と判断すると取りこぼす**。
- **★ゾーン purge では直らないことを実測した (2026-08-17 21:00)**: `purge-cdn.yml` を
  prefix 空 (`purge_everything`) で dispatch し **run 32068743106 は success**
  (`🔄 Purging ALL CDN cache for https://storage.stats47.jp...` → `✅ Full cache purge complete`、
  zone `4caf2866…`)。にもかかわらず当該 HTML の `age` は 20:27 の充填時刻から
  **一度もリセットされず**増え続けた (2076 → 2153 → 2188)。同時刻に
  `storage.stats47.jp` は `DYNAMIC` を返しており、**purge はストレージ側にしか届いていない**。
  `deploy-workers.yml` 冒頭にも「purge-cdn は CDN のみで ISR には効かない」と既に書かれていた。
- **現時点で判明している構造**: ページ経路のエッジコピーを消す手段が**リポジトリ内に存在しない**。
  - `purge-worker-cache.ts --all` (sync-snapshots step 9・20:31:21 success) → Workers Cache のみ
  - `purge-cache.ts` (purge-cdn) → `storage.stats47.jp` のみ。`--files` も
    `${R2_PUBLIC_URL}/<key>` しか組み立てず `stats47.jp` の HTML を狙えない
  - → **purge 系スクリプトでは消せない**。実測では 50 分経過時点でまだ `HIT`
- **★デプロイすれば消える (2026-08-17 21:29 実測)**: PR #805 の develop→main デプロイ直後、
  同じ URL が `cf-cache-status: MISS` で **2022年・1位東京都（5.36人口千対）** を返した。
  buildId が変わってエッジコピーが無効化されるため。**「TTL 切れを待つしかない」は誤り**で、
  実務上は**次のデプロイまで stale**が正しい。したがって
  「snapshot 同期だけして数日デプロイしない」期間が危険窓になる (今回は 1 時間で解消した)。
- **次**: (1) Cloudflare ダッシュボードで **stats47.jp のゾーン ID と Cache Rule の Edge TTL** を
  確認する (オーナー領域。`CLOUDFLARE_ZONE_ID` が storage 用の別ゾーンを指している可能性を含む)。
  (2) ページ経路に届く purge 手段を決める (正しいゾーン ID での purge / Cache-Tag / `--files` の
  ホスト対応のいずれか)。(3) 決まったら `sync-snapshots` に配線する。
- **完了条件**: snapshot 同期の**次のデプロイ後**に本番 `<title>` を Googlebot UA で実測して新値になっている
  (代表 2 URL 以上)。判断できるまでは同期後の実測手順を SKILL に残す。
- **停止条件 / 承認境界**: ゾーン全体 purge は本番のキャッシュを一斉に落とすので、
  恒久配線はオーナー承認を経てから。Cloudflare の設定変更も outward-facing。
- 関連: `.claude/skills/db/sync-snapshots/SKILL.md` / `packages/r2-storage/src/scripts/{purge-worker-cache,purge-cache}.ts`

### [TILEMAP-LINEAGE-01] タイルマップの手動系譜残件

タグ: [起票:2026-08-03]

- **owner**: `chart-author`
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行の自動復元器が
  確証できる残件は0。タイルマップの手動判断残件は6枚で、正確な対象は
  `.claude/state/blog/svg-lineage-queue.json` の `residualCard === "TILEMAP-LINEAGE-01"` を正典とする。
  1枚 (`per-capita-income-gap/income-map`) は2021年SSOTと100%一致してローカル復元済み。
- **問題**: 公開済みタイルマップ 123 枚のうち 9 枚が現行の 720×720 デザインに移行できていない。内訳は (a) `data/*.json` が R2 に無い 7 枚 = 元データ消失 (`alcohol-prefecture-map/alcohol-consumption-map` / `childcare-friendly-prefecture-ranking/tile-grid-score` / `food-consumption-prefecture-battle/ramen-gyoza-tilemap` / `international-cooperation-volunteer-map/volunteer-rate-map` / `per-capita-income-gap/income-map` / `purchasing-power-adjusted/income-map` / `waiting-children-progress/waiting-children-map`)、(b) 年が確定できない 2 枚 (`fiscal-health-50years-trend/fiscal-map` / `fiscal-self-reliance-gap/fiscal-strength-map`)。
- **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
- **(a) の手順**: `.claude/rules/blog-data-schema.md` §1.7 の restoreMethod に従い SSOT から復元する。SVG の絵から値を逆復元しない。SSOT に該当年が無ければ e-Stat から取り込んで SSOT を伸ばす (`data-ingester`)。届かない図は記事から外すか SSOT にある図に差し替える。
- **(b) の手順**: 両記事の本文は 2022年度 を論じているのに地図は 1988年 (live) を表示しており、再生成すると 1989年 に振れる (SSOT 照合が両年で同程度に一致するため)。どの年の地図が記事の主張に対応するかを人が決めてから `--mapping` で固定する。**確定するまで push しない**。
- **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。

### [THEME-PORTFOLIO-REMAINDER-01] テーマ分類・カタログの残工程

タグ: [起票:2026-07-04]

- **owner**: Claude Code
- **統合元**: `THEME-TAXONOMY-REORGANIZE-01` / `THEME-CATALOG-QUALITY-01` / chart expansion。旧 guidance card 案は 2026-08-25 に指標ハブ契約へ置換済み。
- **2026-08-27 監査**: 22テーマのreviewは全件存在。catalog validatorは20テーマ・error 0・warn 169
  （selection未記入120 / sortOrder重複36 / primary未使用11 / global key重複2）。意味確認なしの一括補完は行わない。
- **次**: 22テーマreviewの結果から、欠測・重複・定義誤認だけを修正する。分類再編は重複matrixと移行影響が確定するまで実装しない。
- **完了条件**: catalog validator、選定provenance、分類契約が一致し、UI変更はテーマ単位の小さな差分で検証する。
- **正典**: `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md` / `theme-taxonomy-reorganization.md` / `.claude/rules/theme-catalog-standards.md`

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **2026-08-27 監査**: 最新note metricsの上位24記事はcatalogのnote IDと一致0件で、対象アカウントの
  series別流入・clickを判定できない。誤ったseriesをpilotに選ばず、stats47 note側の計測が揃うまで待つ。
- **trigger**: note既存記事の流入・クリックを確認し、上位1シリーズだけをpilotできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。

### [NOTE-MAGAZINE-REORG-01] note既存投稿のマガジン再編成 + 新規投稿の増産

タグ: [実行:windows] [起票:2026-08-03]

- **owner**: Claude Code
- **方針**: ココナラ商品カタログと同型 (git TS カタログ = SSOT)。ただし公開済み stats47-note 159 件は回収スタブ (key = note ID・不透明・`r2Body:false`) で、カテゴリはタイトルからしか導出できない点がココナラと異なる。
- **済 (Phase 1)**: `magazines.ts` を e-Stat 17 カテゴリ + 行動者率クラスタ = 18 マガジンに細分化。`assign-magazines-by-title.mjs` (タイトル分類・決定的) で公開済み 159 件中 143 件 (90%) を `s47-*` マガジンへ割当。validator pass・派生インデックス再生成済。
- **残り**:
  1. **note-operator 自動化を新設** (coconala-operator 相当・Playwright)。マガジン作成 + 記事割当を note.com へ反映する。**note ログインは人手** (初回・所有者アカウント)、実反映は draft-first + 承認境界。まず 1 マガジン (件数最多 = `s47-sports-culture`) で実証してから横展開。
     - 実装済: `.claude/scripts/note/login-note-profile.mjs` (永続プロファイル `.local/playwright-note-profile` への対話ログイン + account assert `.claude/config/note-account.json`)。
     - 実装済: `.claude/scripts/note/probe-magazine-ui.mjs` / `fetch-note-magazines.mjs` (read-only。既存マガジンを API 取得)。
     - **★probe で判明した実態 (2026-08-03)**: note.com には既に**有料マガジン3つ**が稼働中 — 公務員×Claude Code (¥1,980・key m512ad7023815) / e-Stat×Claude Code (¥1,480・m1b836e4c8dce) / D3.js配色完全ガイド (¥500・mfe0fab2606eb) + デフォルト「あとで読む」。**ランキング系マガジンはまだ note.com に無い**。
     - **済 (Track A・照合取り込み)**: 既存3マガジンの noteUrl + isPaid を magazines.ts に反映。product-d3-colors 新設 + D3 全6章を帰属 (第2-6章=stats47-note / 配色理論=koumuin-gis)。validator error 0。
     - **済 (membership 検証)**: `fetch-magazine-members.mjs` で各マガジンの note.com 実所属を取得・突合。結果: product-d3-colors 6=6 一致 / koumuin-claude-code note.com 37 vs catalog 35 (note.com が2件多い・マガジンが vertical 跨ぎ) / **koumuin-estat note.com 1 vs catalog 14 = 13件未追加 (Track B で追加)**。30 warn (有料マガジンに無料記事) は note.com buy-once モデルの実態と確認 (catalog は正しい)。
     - **flow 判明 (create-probe)**: マガジン作成/管理は `/notes` ダッシュボード。記事の「…」→ マガジンに追加、上部「マガジン ▾」で絞り込み。`/magazine/new` は 404。作成入口は追加モーダル内 or 専用ページ (要 click probe)。
     - **済 (Track B・operator 実装)**: `lib/note-session.mjs` (account assert) + `note-magazine.mjs` CLI (`plan` / `create --key --commit`)。作成フォームは `https://note.com/magazines/new` (名前≤30字 + 説明≤400字 + 無料/有料 + 作成)。dry-run で作成候補15件 (14 s47 + koumuin-gis・全て名前30字以内) を算出済み。無料マガジン専用 (有料は手動)、既存 noteUrl 持ちは作り直さない、`--commit` gate + account assert。
     - **済 (Track B・マガジン作成)**: `note-magazine.mjs create-all --commit` で s47-\* 14 + koumuin-gis = **15マガジンを note.com に実作成完了** (pilot 検証後に一括)。全 noteUrl を magazines.ts へ書き戻し。note.com マガジン総数 19 (今回15 + 既存4) を実測確認。catalog 18中15稼働・残3 (ict/international/energy) は記事0で受け皿。auto mode は「全て自動化」の明示指示で outbound write を許可。
     - **済 (Track B・記事割当 = add-article)**: `note-magazine.mjs add-articles --commit` で **合計156記事をマガジンへ投入完了** (s47-sports-culture 74本 / 自治体財政 14本 / koumuin-estat +13本 等・成功率100%)。API は `POST /api/v1/our/magazines/{magKey}/notes` body `{note_id, note_key}` (両方必須) + header `X-Requested-With: XMLHttpRequest` (CSRF 不要)。note_id は creator contents API (`kind=note`) の key→id マップから解決。既存メンバーは skip する冪等実装。**マガジン再編成 + 記事投入は note.com 上で完全稼働**。
       1b. **残 (整理・任意)**: (a) note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) の削除判断 = オーナー領域。(b) 未公開ドラフト22件のカテゴリ手当て or 整理。(c) s47-ict/international/energy (記事0) は新規投稿が付いたら create + add。(d) 新規投稿の増産 (`sns-content-standards.md` の note 頻度上限は 2026-08-03 撤廃済)。
       1c. **下書き37本の新規投稿 (browser-use・進行中) ★resume ポイント**:
     - **方針**: 「投稿できるものは全て投稿・上限なし」(2026-08-03 オーナー判断)。対象 = 完成済み下書き37本 (stats47-note 28 + koumuin-claude-code 9)。product-sales 55 は凍結チャネルで対象外。
     - **前提**: 投稿は **browser-use + Chrome Profile 5** (note.com/stats47 ログイン済・アカウントゲート合格確認済)。実行環境 = オーナーのローカル Mac。`export PATH="$HOME/.browser-use-env/bin:$PATH"`。
     - **済 (pilot 1本・実公開)**: `a-maximum-temperature` → https://note.com/stats47/n/n91e96edf3950 (HTTP 200・図3枚正配置・s47-climate へ束ね済)。
     - **修正済バグ2件** (commit 73bbe8939 等): ① `prepare-article.cjs` の画像 regex が `images/` を取りこぼす → `(?:\.\/)?images/`。② `ins_img` が目次(TOC)同名見出しに誤マッチ → `publish-new-note.sh` が投稿前に目次を折りたたむ。
     - **パイプライン (1本ごと)**: `node .claude/scripts/note/prepare-article.cjs <slug>` → `build-body.cjs <slug>` → `bash .claude/scripts/note/restore-from-r2.sh <slug>` → `node generate-note-covers.mjs --slug <slug>`(koumuin は `generate-koumuin-covers.cjs`) → `node generate-note-hashtags.mjs --slug <slug>` → `bash .claude/scripts/note/publish-new-note.sh <slug> <vertical> --publish` → live 確認 (`curl -sI note.com/stats47/n/<id>`) → catalog を published+noteUrl+magazine に更新 → `note-magazine.mjs add-articles --key <mag> --commit` で束ね。
     - **残 36本** (resume): catalog で `status:"draft"` の stats47-note 27 + koumuin-claude-code 9。`npx tsx -e 'import {NOTE_ARTICLES} from "./.claude/scripts/note/catalog/index.ts"; console.log(NOTE_ARTICLES.filter(a=>a.status==="draft"&&a.r2Body!==false&&a.vertical!=="product-sales").map(a=>a.vertical+"/"+a.key).join("\n"))'` で残スラッグを列挙。1本 ~5分・実 Chrome 占有・Bash 10分上限で1回2本程度。resume 可 (published は skip)。
     - **注意**: `koumuin-shigoto-kouritsuka-ai`/`pinned-intro` は vertical/性質が特殊 → 個別判断。誤配置の旧ドラフト `ndd6577272515` は削除確認ボタンが取れず残存 → note.com で手動削除。browser-use は毎回 daemon kill + editor.note.com タブ close (`browser-use-cleanup.md`)。
  2. **誤 vertical 16 件の再評価 (済/残)**: D3配色の章5件は実在有料マガジン (¥500) の中身 → 帰属済。Claude Code 記事は koumuin 有料マガジンの member (membership 検証で確認)。note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) は削除判断 = オーナー領域 (残)。
  3. **未解決 22 件 (未公開ドラフトの英語キー)** をカテゴリ手当て or ドラフト整理。
  4. **新規投稿の増産**: カテゴリマガジンを受け皿に増やす。`sns-content-standards.md` の note 頻度上限 (月1-2本) の見直しが要る (別判断)。
- **完了条件**: 公開済み記事が note.com 上でマガジンに束ねられ、新規投稿が catalog のカテゴリマガジンに自動で割り当たること。記事一括変更しない (1 マガジンずつ実証)。
- **停止条件 / 承認境界**: note.com への実反映 (マガジン作成・記事割当・新規公開) は outward-facing。人手ログイン + オーナー承認を経てから。SSOT は catalog git TS、note.com は反映先。
- **なぜ blocked-local-runtime か (2026-08-17)**: 残る主工程 (1c の下書き36本投稿) が
  **browser-use + Chrome Profile 5 をオーナーのローカル Mac で占有する**ため、CI からは
  原理的に閉じられない。status が `pending` のままだと日次ループが拾って 3 回失敗し
  quarantine するだけになる (`ASP-CONTINUITY-01` で実際に踏んだ)。
  **catalog だけで閉じられる残り (1b の (b) 未公開ドラフト22件の整理 / 3. 未解決22件のカテゴリ手当て) は
  ローカル不要**なので、着手するときは別 ID へ切り出してループに戻す。
- 関連: [NOTE-CIRCULATION-CTA-01] (回遊/CTA の catalog 駆動)・`.claude/scripts/note/catalog/README.md`・`.claude/rules/sns-content-standards.md` §note

### [MIGRATION-FLOW-PHASE23-01] 人口移動 月次/年次 workflowの生成ステップ未実装

タグ: [起票:2026-08-01]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [実行:ユーザー] [起票:2026-07-10]

- **owner**: Claude Code
- **trigger**: e-Statで2025年年報の公表を確認できること。
- **次**: 既存697 metricの年次更新を先に行い、需要確認済みの中分類だけを第2弾へ追加する。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。
- **正典**: `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 13 件

タグ: [実行:ユーザー] [起票:2026-07-30]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない** (2026-08-17): 対象が `.github/` だけで、ループの verify は
  そこを**禁止パス**にしている（workflow を書き換えられると allowedTools・許可パス・timeout・
  モデルを自分で緩められるため）。status を pending のままにするとループが毎回 pick して
  `class-needs-pr` で skip し、枠だけを消費する。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所が 13 件残っている。dispatch できる者が任意コードを実行できる類型。private repo で dispatch 権限者は push もできるため実効的な権限昇格ではないが、衛生上の負債。
- **★この負債は現在 CodeQL に検出されていない** (2026-07-30 実測): `.github/workflows/security-scan.yml` の init は `languages: javascript,typescript` で、**workflow ファイル自体は走査対象外** (走査には `languages: actions` が要る)。PR #655 で出た CodeQL 3 件はこれとは無関係で、`.claude/scripts/` の `execSync(テンプレート文字列)` = `js/command-line-injection` だった (同 PR で argv 形式へ是正済)。**「CodeQL が出たら workflow の式インジェクション」と早合点しない** — 2 度誤診した。
- **対象**: `blog-auto-publish` / `blog-remediation-daily` / `fetch-metrics-weekly` / `improvement-log-reminder-weekly` (2) / `migration-flow-weekly` (2) / `publish-ai-content` / `sns-weekly-report` (2) / `sync-snapshots` (3)
- **次**: 各 step に `env:` ブロックを足し、`run:` はシェル変数だけを参照する形へ書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと 13 件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失図表の手動系譜残件

タグ: [起票:2026-08-12]

- **owner**: Claude Code
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行のranking自動復元器が
  確証できる残件は0。非タイルマップの手動判断残件は93枚
  (unknown 41 / ranking 18 / line 23 / stacked 4 / scatter 5 / findings 2)。正確な対象は
  `.claude/state/blog/svg-lineage-queue.json` の
  `residualCard === "CHART-LINEAGE-RESIDUAL-01"` を正典とする。CROSS側はこれらを推測復元せず閉じる。
- **背景**: 公開散布図 102 枚のうち 24 枚が元データ (`<base>.json` / `.source.json`) を失い、
  gate の検証対象外だった (gate は「78/78 正準」と報告するが 24 枚を見ていない = 死角)。
  2026-08-12 に SSOT から **19 枚を復元** (33 軸を SSOT 照合・一致率 80% 未満 0 件・R2 反映済)。
  残り 5 枚は**指標を同定できない / SSOT に値が無い**ため、捏造せず flag した。
  ★ SVG のピクセル座標から値を逆算して data json にするのは禁止 (`blog-data-schema.md` §1.7)。
- **残り 5 枚と律速**:
  | slug/base | 律速 |
  |---|---|
  | `international-cooperation-volunteer-map/{travel,foreign-pop}-vs-volunteer-scatter` | 「国際協力ボランティア率」に該当する metric が SSOT に**存在しない**。e-Stat 側の表を特定して投入する必要がある |
  | `per-capita-income-gap/income-vs-industry-scatter` | Y 軸「1人当たり県民所得」の現行基準が `isActive:false` / 値未投入。`data/data-refresh-requests.json` で 2021 年度取り込みを要求済 (2026-08-12) |
  | `purchasing-power-adjusted/income-vs-price-scatter` | 同上 (X 軸が同じ指標) |
  | `foreign-residents-diversity-map/manufacturing-vs-foreign-scatter` | X 軸「製造品出荷額 1人当たり」の**算出式と年次を特定できない** (最有力候補でも一致率 67-72%) |
- **次**: ① 県民所得の取り込み結果を確認し 2 枚を復元 ② 国際協力ボランティア率の e-Stat 表を
  `estat-researcher` で特定 ③ 製造業の算出式は記事本文の記述から再構成できるか確認する
- **完了条件**: `chartType === "scatter" && status !== "both"` の非正準が 0 枚
  (測定: S3 実体を読む。公開 URL は `max-age=14400` で最大 4 時間古い)
- **禁止**: 一致率が足りないまま「だいたい合っている」で復元しない。復元できないなら記事から図を外す

- **タイルマップ側の残り 6 枚** (2026-08-12 実測。公開 120 枚中、元データを持つ 22 枚は
  現行 svg-builder で再生成し R2 反映済 = 正準 114/120):
  | slug/base | 現状 | 律速 |
  |---|---|---|
  | `per-capita-income-gap/income-map` | 600×665 | 県民所得の現行基準が SSOT 未投入 (散布図と同じ) |
  | `purchasing-power-adjusted/income-map` | 600×700 | 同上 |
  | `international-cooperation-volunteer-map/volunteer-rate-map` | 600×700 | 「国際協力ボランティア率」が SSOT に存在しない (散布図と同じ) |
  | `alcohol-prefecture-map/alcohol-consumption-map` | 600×690 | 指標・年次の同定が要る |
  | `food-consumption-prefecture-battle/ramen-gyoza-tilemap` | 960×520 | 2 指標の対比図。同定が要る |
  | `waiting-children-progress/waiting-children-map` | 600×690 | 指標・年次の同定が要る |
- **散布図とタイルマップで律速が重なる**: `per-capita-income-gap` / `purchasing-power-adjusted` /
  `international-cooperation-volunteer-map` の 3 記事は両方の図が同じ SSOT 欠落で止まっている。
  **指標を投入すれば 2 種類まとめて解ける**ので、この 3 記事を先に片付ける

### [SYNC-SNAPSHOTS-MANIFEST-CARRY-01] sync-snapshots の「差分 push」が CI では毎回フル push になる

タグ: [起票:2026-08-17]

- **owner**: `r2-publisher`
- **問題**: `diff-push-r2` は manifest (`.local/r2-manifest/`) と突合して差分だけ送る設計だが、
  manifest は runner ローカルなので CI では毎回空 (`マニフェスト記録済み: 0`)。結果
  **アップロード対象が常に全件**になる。run 32020891418 の実測で **14,033 件 / 24m44s**
  (9.45 files/s)、生成 33m07s と合わせて sync job は 58 分かかる。timeout 45 分では
  構造的に完走できず push が途中で打ち切られていた (是正済・timeout 120 分)。
- **次**: manifest を `actions/cache` で run 間に持ち越すか、R2 の ETag / SHA と突合して
  差分を出す。どちらを採るかは、cache の失効時に全件送りへ安全に degrade できるかで決める。
- **完了条件**: 連続 2 回の run で、2 回目の「アップロード対象」が全件でないことを実測する。
- **禁止**: push を速くするために検証や purge を削らない。差分判定を誤って
  **送るべきものを skip する**方が、全件送るより実害が大きい (stale 配信は 6 日間気づかれなかった)。

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出

- **owner**: open-data-curator
- **正典**: `packages/data-configs/src/prefecture-statistics-catalog/README.md`
- **次**: 各県ポータルを1巡し、複数県で反復する指標だけを、定義、単位、粒度、年次、一次出典付きで上の表へ追加する。
- **完了条件**: 47県を確認し、既存metricとの非重複と全国比較可能性を検証する。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [実行:対話] [起票:2026-05-19]

一次統計の実在、都道府県粒度、既存 metric との非重複を確認した候補だけを残す。
需要未確認の大量候補、取得失敗、重複は削除済みで、再調査は Git 履歴から行う。
`parse-backlog.cjs` が次の表を読む。`high` は既存テーマの欠測または需要が明確、`medium` は鮮度・特殊軸・導入先の追加判断が必要。

| priority | candidate_slug                     | category          | suggested_theme     | estat_stats_data_id | rationale                                                             | status  |
| -------- | ---------------------------------- | ----------------- | ------------------- | ------------------- | --------------------------------------------------------------------- | ------- |
| high     | outpatient-consultation-rate-total | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=4。既存テーマに全傷病の外来受療率がない    | pending |
| high     | inpatient-consultation-rate-total  | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=1。外来と対で医療アクセスを比較できる      | pending |
| high     | ambulance-dispatch-count           | safetyenvironment | healthcare          | 0000010111          | SSDS K1210、47県。救急搬送の基礎指標                                  | pending |
| high     | infant-mortality-rate              | socialsecurity    | healthcare          | 0003411730          | 人口動態統計2024、47県。既存healthcareの結果指標を補う                | pending |
| high     | average-household-members          | population        | population-dynamics | 0003414255          | 国勢調査2020 cdTab=1390、47県。人口動態テーマの世帯構造を補う         | pending |
| high     | working-age-population-ratio       | population        | population-dynamics | 0000010201          | SSDS #A03502、2024。年齢構造の基礎比率                                | pending |
| high     | juvenile-offenders-count           | safetyenvironment | safety              | 0000010111          | SSDS K4204、2023、47県。千人比は別calculated metricで扱う             | pending |
| high     | average-job-tenure                 | laborwage         | labor-wages         | 0003426933          | 賃金構造基本統計 cat04=01,cat03=01、47県                              | pending |
| high     | equivalized-disposable-income-gini | economy           | real-income         | 0003440743          | 全国家計構造調査2019表7-6、cat01=1（OECD新基準準拠）、47県・小数値   | pending |
| high     | nursing-home-count                 | socialsecurity    | aging-society       | 0000010210          | SSDS #J022011、2023、既存4指標と非重複                                | pending |
| high     | paid-nursing-home-count            | socialsecurity    | aging-society       | 0000010210          | SSDS #J02204、2023、47県                                              | pending |
| high     | life-time-use-series               | laborwage         | living-housing      | 0000010113          | SSDS生活時間。sleep/housework/mealsのcdCat01確定後に個別keyへ分割する | pending |
| medium   | beef-cattle-count                  | agriculture       | local-economy       | 0004041846          | 畜産統計2024。都道府県がcat01=1013-1059に入るためarea読替が必要       | pending |
| medium   | pig-count                          | agriculture       | local-economy       | 0004041860          | 畜産統計2024。通常area軸ではなくcat01読替が必要                       | pending |
| medium   | household-head-average-age         | economy           | consumer-prices     | 0003348239          | 家計調査2024、県庁所在市52件。都道府県値と誤認しない表示設計が必要    | pending |
| medium   | fishery-species-catch-salmon       | agriculture       | fishery-marine      | 0003425253          | さけ・ます類、2019、cat01=100-150。鮮度を明示する                     | pending |
| medium   | fishery-species-harvest-nori       | agriculture       | fishery-marine      | 0003425258          | のり類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | fishery-species-harvest-oyster     | agriculture       | fishery-marine      | 0003425257          | かき類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | housing-seismic-retrofit-count     | construction      | safety              | 0004025509          | 住宅土地統計2023 cat03=15。「耐震化率」ではなく改修実施戸数として扱う | pending |

**投入手順** (完了した行は削除する):

1. `parse-backlog.cjs` で候補を選ぶ。
2. e-Statメタと代表値を再確認し、`metric-config-standards.md` と `data-provenance-standards.md` に従ってconfigを作る。
3. config validation、R2 snapshot生成、ranking item、KNOWN/sitemapの順で整合を取る。
4. 本番反映はユーザー承認後にまとめて1回行い、HTTP 200、年、単位、代表値を実測する。
5. 完了した行は削除する。

## 🟢 低 — 時期未定・条件付き (trigger は本文に)

### [MUNI-RANKING-EXPANSION-01] 市区町村ランキング拡充 (全量公開 2026-09-01 実施済み・残は SSDS 未使用分)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-01]

- **owner**: Claude Code (選定・監査) + オーナー (公開承認)
- **実施済み (2026-09-01)**:
  - 第1バッチ 6 key + テーマ population (オーナー承認・本番実測済み)
  - **全量公開 (オーナー指示「公開できるものは全て公開したい」)**: 候補 184 のうち **171 key + 19 テーマ**を
    published 昇格。除外 13 の理由は catalog の unsupported/unknown エントリが正典
    (cities.json 不在 4 / 値完全一致の重複 7 / 品質監査未了 2 = industrial-land-price・major-lake-area)。
    fiscal-strength-index の unknown は「0 = 194 行政区 + 特別区部のみ」の実測で解消。
    同名 title の系列は item snapshot の `subtitle` でページ title を区別 (generator が衝突未解決を throw)。
    副産物: moving-in-excess-rate の subtitle 誤り是正 + SSDS 系 10 config の displayName/url 補記
- **残り (次の拡充はここから)**:
  1. 品質監査未了 2 件 (industrial-land-price / major-lake-area) の要否判断
  2. **SSDS 未使用 733 指標** (`expansion-survey.json` の `ssdsUntapped`・同じ 1,913 団体軸) —
     e-Stat から `page-data-batch --kind city` で cities.json を作れば同じ pipeline で公開可能。
     metric config 新設が要るため data-ingester 系の作業
  3. 非 SSDS 3,361 表 (`.claude/state/estat-city-discovery.json`) — 表ごとに軸 pin 設計が要る長尾
- **計測**: 公開 28 日後 (2026-09-29 目安) に GSC/GA4 で市区町村面の実測。pilot の 9/21 判定は
  confounded (doc 44 記録済み)
- **関連**: doc 44 WP8 / `MUNI-AI-CONTENT-01` (公開 key が 10 を超えたため trigger 1 は成立。
  trigger 2=解説スロット・3=オーナー承認 は未成立)

### [MUNI-AI-CONTENT-01] 市区町村ランキング用 ai-content を別契約で新設する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-08-31]

- **owner**: Claude Code (ranking-content-author 系の拡張として)
- **trigger (3 つすべて満たすまで着手しない)**:
  1. doc 44 WP8 の実測判断で公開 municipality ranking key が増えること (目安 10 key 以上。現在 1)
  2. `/municipalities/ranking/<key>` ページが解説を描画する設計になること (現状 item.json の
     title/description のみで、解説スロットが無い = 消費者不在)
  3. オーナーが市区町村面のコンテンツ投資を承認すること
- **設計要点 (着手時の前提。正典 = `ranking-content-standards.md` §スコープ境界)**:
  - namespace は `app/municipalities/ranking/<key>/ai-content.json` (県版 `app/ranking/` と混ぜない)
  - スキーマは県版の流用禁止。1,717 自治体に「県別解説 47 件」の相当物は成立しないため、
    上位/下位の要約・県別分布・母集団と除外自治体 (entityPolicy / valuePolicy) の説明・FAQ で構成する
  - 監査は `app/municipalities/ranking/<key>/values.json` (cities.json 由来・1,717 entity) と
    突合する専用実装。県版の EXPECTED_PREF_COUNT=47 / thin 40 / 7 地方区分は持ち込まない
  - 共有するのは原理のみ: 数値突合 (number-audit の設計)・author/critic 分離・outbox → push → CI 公開
- **完了条件**: pilot key 1 件で生成 → 専用監査 blocker 0 → critic PASS → ページ描画まで通し、
  誤値を注入して監査が発火することを実測する
- **関連**: doc 44 (`docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`) WP8 / `JAPAN-COMMENTARY-01`

### [JAPAN-COMMENTARY-01] /japan の時系列解説は別コンテンツ型として要否から判断する

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-08-31]

- **owner**: Claude Code (theme-designer / strategy-advisor と協働)
- **trigger**: `/japan/*` の GSC 実測で流入が付き、解説の読者価値を検証する意味が出たとき
  (doc 43 は「最低コンテンツ基準を満たす slug だけ active」— 需要実測が先)
- **決めること**: ランキング ai-content の派生では作らない (正典 `ranking-content-standards.md`
  §スコープ境界)。`/japan` の契約は `app/japan/<metric>/series.json` = 公式全国値の時系列で、
  1位/最下位/県別解説の形が構造的に当てはまらない。候補は (a) theme の evidenceTopics /
  markdown-section の系譜で人手キュレーション、(b) 時系列専用の生成契約を新設、(c) 作らない。
  要否そのものから判断する
- **完了条件**: 採否の判断が実測根拠つきで記録され、採用時は設計が別 backlog として起票されること
- **関連**: doc 43 (`docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md`) / `MUNI-AI-CONTENT-01`



### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [起票:2026-07-12]

- **owner**: Claude Code
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。

### [AREA-DATABOOK-REMAINDER] 県データブックの小粒残件

タグ: [起票:2026-07-19]

- **owner**: Claude Code
- **trigger**: 既存47県版の利用実測で、欠損セクションが回遊または検索の阻害要因と確認できたとき。

### [MULTICHANNEL-CONTENT-PRODUCT-01] 商品チャネル横断化

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **trigger**: ココナラまたはnoteの単一商品で実売、粗利、supportMinutesを測定できた後。
- **正典**: `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`

### [GIS-CROSS-CONTENT-BACKLOG] 統計×GISコンテンツ

タグ: [起票:2026-07-04]

- **owner**: Claude Code
- **trigger**: 既存GIS素材と検索需要が一致する単一pilotを選べたとき。

### [CLOUDFLARE-INVOICE-01] 請求書PDFと予測値の突合

タグ: [起票:2026-05-16]

- **owner**: Claude Code
- **trigger**: 手動精算漏れが再発するか、請求額が継続して予測から10%以上ずれるとき。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [AFF-NO-INTENT-FALLBACK-01] 「広告なし」にした主題 (身長・気候・犯罪など週 7,757+ imp) に何を出すか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03]

- **owner**: uruhayato373
- **背景**: #913 で `SURVEY_AFFILIATE_MAP` に null を置いた調査 (学校保健統計・気象統計・面積・
  犯罪・火災・水害・廃棄物・上下水道) はランキングで週 7,757 imp、ブログで 20,501 imp (気候・地名・
  公務員向け how-to 含む) が意図軸の広告なし (ハウス枠 + AdSense) になる。意図の合わない広告を
  上位に置くより空の方が無害という判断だが、収益機会としては空いている。
- **選択肢**: (a) 現状維持 (AdSense のみ) (b) 汎用ハウス枠 (転職 neo-recruit は 28 日で
  5,093 imp / 5 click と全広告中最多) を 2 枚に増やす (c) 主題ごとに商材を開拓する
  (身長 → 成長サプリ・子ども向け通信教育、気候 → 引越し・家電)。
- **決めること**: (b) にするか、(c) をどの主題からやるか。決まったら 🟡 に実装カードを切る。

### [AFF-GEO-SLOT-01] /geo に広告枠を置くか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03]

- **owner**: uruhayato373
- **背景**: 2026-09-02 の棚卸しで枠の無い route は `/japan` (54 imp/週)・`/municipalities` (0)・
  `/geo` (0)・法務ページのみ。japan / municipalities は #912 で足した。`/geo` は
  `geo-analysis-standards.md` が canonical ページの 7 構成 (問い → 途中地図 → 検算 → 集計 → 補助
  レイヤー → 方法) を規定しており、広告の置き場を規定していない。流入 0 なので急がない。
- **決めること**: 置くなら「方法・限界」の後 (読了位置) に native 1 段、vertical は分析の主題
  (駅アクセス → mobility、2050 人口 → population)。置かないなら本カードを削除。

### [GIT-HISTORY-SECRET-PURGE-01] Git履歴のAPIキーを扱う方針決定

タグ: [実行:対話] [起票:2026-07-11]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [SCRIPT-ORPHAN-DELETE-01] 役目が終わった orphan スクリプト 6 本の削除可否

タグ: [実行:対話] [起票:2026-08-17]

- **owner**: uruhayato373 (削除可否はオーナー判断)
- **前提**: `SCRIPT-ORPHAN-TRIAGE-01` で orphan **29 本すべてを分類し、残す理由を記録した**
  (下記「orphan 29 本の分類」)。残るのは (a) 群 6 本の削除可否だけ。
- **(a) 役目が終わっている 6 本**: `blog/gen-chart-svg.cjs` (自身が
  「⚠ SUPERSEDED (2026-05-27)」と明記) / `lib/update-skill-primary-agent.cjs` (一回きりの移行) /
  `note/generate-remaining-covers.cjs` (一回きりの一括生成) / `note/inject-affiliate-blocks.mjs`
  (一回きりの一括注入) / `sns/backfill-x-templates.cjs` (一回きりの backfill) /
  `estat/estimate-city-data-size.mjs` (廃止済み永続 D1 の行数試算が前提)。
- **次**: オーナーが 6 本の削除を承認する。承認後は git rm するだけ (履歴から復元可)。
- **完了条件**: 6 本が削除されるか、残す理由が本エントリに追記されている。
- **禁止**: (b)(c) 群を巻き込んで一括削除しない。

#### orphan 29 本の分類 (2026-08-17 実測・`check-agent-skill-consistency.cjs`)

エントリ記載の 20 本は古い。実測は **29 本**。全件に残す/消す理由を付けた。

**(a) 役目が終わっている 6 本** → 上記のとおり削除候補 (オーナー判断)

**(b) 生きているバックログに紐づく 13 本** → 消さない。紐づけ先が閉じるまで資産として残す

| 紐づけ先                                                                        | スクリプト                                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`      | `db/export-city-local-finance.cjs` / `estat/{etl-city-stats,fetch-city-local-finance}` / `gsc/inspect-cities-sample.cjs`            |
| `BLOG-SVG-LINEAGE-RESTORE-01` (in-progress)                                     | `blog/restore-{findings,ranking,scatter}-from-svg.mjs`                                                                              |
| `NOTE-MAGAZINE-REORG-01` (in-progress)                                          | `note/{note-magazine,fetch-note-magazines,fetch-magazine-members}.mjs` / `note/probe-{create-form,magazine-create,magazine-ui}.mjs` |
| `CHART-LINEAGE-RESIDUAL-01` (pending)                                           | `blog/resolve-scatter-axes.mjs`                                                                                                     |

`restore-*-from-svg.mjs` は名前に反して**逆復元をしない** — 旧 SVG の表示値を
「SSOT が正しいことの照合先」としてのみ使い、≥0.95 一致したときだけ SSOT から再生成する
(`.claude/rules/blog-data-schema.md` §1.6 の捏造防止規約に適合)。名前だけで消さない。

`probe-*` は note.com の UI が変わったとき再実行する read-only 調査用。note は SPA で
DOM が変わりやすく、実機 probe なしでは実装を直せない (`kdp-publish` と同じ理由)。

**(c) 用途が判断できない 10 本** → 1 リリース残して未使用なら (a) 群へ落とす

`blog/build-article-data-from-r2.mjs` / `blog/prefecture-food-profile.mjs` /
`blog/select-conformance-candidates.mjs` / `gsc/discover-trends-fetch.cjs` /
`note/affiliate-incremental.sh` / `note/download-affiliate-banners.mjs` /
`note/expand-for-fix.mjs` / `note/publish-new-note.sh` / `psi/generate-cwv-pr.mjs` /
`estat/estimate-city-data-size.mjs` は D1 前提が明確なので (a) へ寄せた

**なぜ orphan 警告を 0 にしないか**: (b) の 13 本は「今は呼ばれていないが消してはいけない」もので、
これを 0 にするには allowlist を作るか無理に参照を生やすことになる。どちらも実態を曇らせる。
warning のまま**理由付きで残す**のが正しい形で、これが本エントリの成果物。

- **完了条件**: orphan 警告が 0 になるか、残るものが「なぜ残すか」を添えて記録されている。

### [T2-RANKING-NORM-SSG-01] ranking正規化派生のURL方針

タグ: [実行:対話] [起票:2026-05-25]

- **owner**: Claude Code
- **次**: queryを別URLへ昇格する案、別rankingKey化、canonical吸収の3案を、検索需要とsnapshot容量で比較する。
- **完了条件**: URL policy、canonical、sitemap、既存queryの扱いを先に決め、実装案を混在させない。

### [MIGRATION-FLOW-IG-01] migration-flow の IG 投稿が 3 か月止まっている

タグ: [実行:対話] [起票:2026-08-13]

- **owner**: uruhayato373 (継続可否の判断)
- **問題**: `migration-flow-weekly.yml` の Instagram 投稿ステップが **12 回連続失敗** (約 3 か月・1 本も投稿されていない)。
  `❌ ディレクトリが存在しません: .local/r2/sns/migration-flow/okayama/instagram`。
  `.local/r2/` は gitignore された作業域なので runner のチェックアウトには無い。R2 から取得する段が
  無いか、`cleanup-r2-sns-videos.yml` (投稿済み動画を 30 日で削除) で素材が消えたかのどちらか。
  2026-08-13 の cron 横断ヘルスチェック初回実行で発覚 (それまで誰も気づいていなかった)。
- **次**: 「この IG 投稿を今後も回すか」を決める。**止める**なら workflow を無効化して
  自動化インベントリから外す。**続ける**なら素材を R2 から取得する段を足す (レンダから
  やり直すのか、保持ポリシーを変えるのかもセットで決める)。
- **禁止**: 素材の所在を確認せずに「取得段を足す」だけの修正をしない (30 日削除ポリシーと
  衝突すると同じ失敗を繰り返す)。
- **完了条件**: workflow が緑になる、または schedule が外れて横断ヘルスチェックの対象から消える。
- **正典**: `.claude/rules/sns-content-standards.md` §5.5 (R2 素材保持ポリシー)
