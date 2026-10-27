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
| `/content/note`                   | Git記事台帳 (`data/note/articles.json`)・R2本文所在・公開URL・公開ゲートの読み取り専用ミラー。未公開レコードを本文未作成・同題重複・販売条件・カバー・内容レビューで絞り込む。note.comエディタの下書き件数とは区別する |
| `/content/note/covers`            | カテゴリ別方針・固定の制作ID・制作状況・公開画像/候補の比較。制作内容を保存してプロンプトと制作仕様を取得し、候補の採用/修正を記録して次の記事へ進む。画像はprivate R2からGET proxyでSHA確認し配信 |
| `/content/kindle`                 | Kindle catalog・manuscript・ローカルEPUB/表紙・R2暗号化archive・KDPの下書き/審査中/販売中・価格/ロイヤリティ/KUの読み取り専用ミラー                                                                |
| `/content/references`             | 解決済みinventoryをranking・survey・theme・area・japan・world・blog・note・Kindle・YouTube・Instagram・Xへ突合した全展開ポートフォリオ。context-onlyは公式資料単位の補強プールとして別表示         |
| `/sns`                            | 投稿台帳 (X/IG と YouTube 過去実績/pilot 記録)・素材再生・caption・投稿状態・残枠・IG 整合性警告の読み取りビュー                                                                                   |
| `/assets`                         | 画像/動画資産 11 タブの読み取り専用ギャラリー                                                                                                                                                      |
| `/svg`                            | ブログ SVG 分類カタログ (手動ロード・10 分キャッシュ)                                                                                                                                              |
| `/research`                       | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続の読み取り専用ミラー                                                                                                  |
| `/dashboard`                      | 現況レビュー。pilot 判定・施策の同時進行・領域の警告の要約とリンク + 週次メトリクス (60 秒キャッシュ)                                                                                               |
| `/strategy`                       | 方針。事業計画の題目・事業原則・設計と方針の文書。明細は `/strategy/business-plan` (計画の詳細)・`/data/geo` (Geo 分析)・`/sns/geo-plan` (X 企画)・`/product/note-plan` (note 商品) へ割り振った |
| `/site/queues`                    | サイトの是正キュー (ブログ品質・AI 解説・企画キュー・SNS・実験)。旧 `/dashboard` の進捗キュー                                                                                                      |
| `/domains/<id>`                   | 領域の概要 (サイドメニューのグループ名から開く)。判断に使う画面・構えと狙い・タスク・文書・担当エージェント/スキル                                                                                  |
| `/docs` `/docs/<path>`            | docs/ の全文書を領域ごとに一覧し、本文を表示する (docs/ の外は開かない)                                                                                                                            |
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

note家計の媒体展開は同じ投稿IDの`production.input`で固定数値・原記事・renderer/フォント・出力SHAを辿る。投稿用画像を先に表示し、`thumbnail`のnote原図は参考素材として末尾から選べる。投稿詳細の「原図と媒体別レイアウト」で原図と各ページを比較する。確認用素材は投稿用レイアウトの見本に含めない。

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

統計画像の文言は4媒体共通の[画像内テキスト規約](../../.claude/rules/chart-image-copy.md)に従う。管理画面の共通ルールには `media/lib/image-copy.mjs` の同じ方針を表示し、ランキング見本のPNG生成前に定型説明の再混入を検査する。詳細な定義・制作条件・出典記録は保持し、画像内には必要な条件を短く1回だけ示す。

- 型の基本形 (`/ops/image-templates`): 左側は「目的 → 図の形」の二階層だけを選ぶ。右側は型ごとに固定した代表統計を使い、note・サイト・X・Instagramの4媒体を並べて確認する。「比較する題材」や記事の大量選択は置かない。共通ルールは見本の下へ、編集はshadcn標準Sheetへまとめる。未保存の編集は分類切り替えで保持し、ページ移動・再読込では警告する。
- 画像ライブラリ (`/ops/image-library`): 型の画面の「この型の使用先」から同じ型・目的で絞り込み、記事・投稿の実画像、原本、固定入力、旧新比較、確認結果、候補・採用履歴を管理する。カバーは既存の専用制作画面で扱う。
- 記事・投稿の改善 (`/product/content-quality`): 本文・画像・配置・導入・出典・リンクの改善を、既存のnote/SNS台帳と結合して管理する。

型分類と代表統計の少数の固定カタログは `lib/image-template-basics.ts`、実画像の解決は `lib/server/template-statistical-samples.ts`、表示は `components/content/template-statistical-preview.tsx` が所有する。分類は型カタログから導出し、記事数や画像の登録・分類状態に依存しない。代表統計は家計支出の10分類・最高気温・エンゲル係数の推移などの実統計を使い、架空の値へ置き換えない。家計は検討済みの名古屋市・青森市・札幌市を維持し、主見本以外は「ほかの検討見本」で開く。現在の共通試作は4:5（1080×1350）1枚。古い寸法の実画像は「参考図・形式調整前」と明示し、固定した参照元を4媒体で共有しても各媒体の資産登録・採用済みとは扱わない。未制作は「サンプル画像を準備中」、代表統計未決定は「代表統計を選定中」とし、無関係な記事画像で穴埋めしない。型の検討は代表統計から始め、使用先の画像修正は型が決まってから行う。
ランキング画像の指標・単位・出典・表示桁は `data/metrics/<key>.ts`、入力は正典R2 `app/stats/<key>/values.json` に接続する。e-Statカタログは取得対象のメタ情報を管理し、配色は指標の `visualization` が正典。サイトは生成した `item.json` の同設定を読み、画像は同じ authored 定義を読む。`lib/template-ranking-data.ts` が代表年とSHA固定の参照を持ち、更新時は入力の同一性・年・全47県・単位・同順位を検査する。地図の塗りと凡例はサイトと同じ `resolveChoroplethScale` で解決し、SVG builderへ解決結果を渡す。発散の中心・対称範囲・反転・区分境界を画像側で再計算しない。棒の軸は指標の `visualization.barDomain` と共通 `resolveBarDomain` に接続する。既定の `extent` は全47県の実測最小〜最大を使い、`zero` は0を含む範囲、`fixed` は最小・最大を丸めず反映する。画像の軸目盛り・目盛線は既定で表示せず、0を含まない範囲は短い「範囲：最小–最大」で示し、最小値は端点でも残す。値が収まらなければ生成を止める。省略時の既定値も型パッケージで一元管理し、サイトの点図用 `comparisonDomain` と混用しない。型画面の参照情報も同じ定義から派生し、家計の検討済み画像は維持する。

基本形ページのURLは `purpose` / `template` / `q` のみ。旧 `topic` / `medium` / `sample-<媒体>` / `ratio-<媒体>` / `selection` / 媒体充足条件は除去し、記事を選ばず同じ型へ戻す。使用先へのリンクは型・目的と `returnTo` を渡す。分類待ち・用途確認待ちは画像ライブラリへ案内する。

ランキング3型の見本PNGはprivate R2 `media-workspace/images/<sha>.png` に固定保存する。`lib/template-ranking-assets.ts` は保存済みPNGと根拠manifestの参照（bucket/key/SHA/bytes）を持ち、GETは照合済みPNGだけを返す。閲覧時には生成・保存しない。元データの私有コピー、描画SVG、PNG、生成コードのcommitとソース、実行環境は同じR2のSHA付きオブジェクトとして保全する。入力や型を改訂するときは `npm run samples:publish --workspace apps/admin` で3型を確認し、`-- --apply` で明示保存する。全ファイルの保存後照合が成功してからGit参照を一括更新する。4媒体は同じ保存PNGを共有し、採用・公開状態は変更しない。

折れ線・テーブル・積み上げ棒の見本は `packages/svg-builder` の共通生成処理を呼び、文字配置・凡例の折り返し・列幅の修正を引き継ぐ。外枠は1080×1350で共通化し、内部の描画幅を340に指定して縮小表示でも読める文字サイズを保つ。生成manifestには実行時ソースの本文・SHAと未コミット変更の有無も残し、commitだけから復元できると誤認させない。

「構成 → 積み上げ棒」は国税庁「酒のしおり」の2008・2013・2018年度、酒類8区分の販売数量構成比を使う。公開済み記事の固定入力JSONと出典JSONをSHA照合し、年度・区分の重複、欠測、負値、年度合計0を拒否する。`npm run samples:publish:composition --workspace apps/admin` で生成確認し、`-- --apply` でPNG・SVG・入力・出典記録をprivate R2へ保存する。参照は `lib/template-composition-assets.ts`。元の公開済みSVGは参考図として保持する。

「推移 → 折れ線」は `lib/template-trend-line.ts` の名古屋市・エンゲル係数（2007〜2024年、二人以上の世帯）を4媒体共通の1080×1350で表示する。R2の指標観測値から18年分を抜き出し、全国平均や愛知県全域の値として扱わない。年順・欠測・重複・単位を検査し、欠測を補間して結ばない。縦軸は指標の `trendDomain` をサイト共通 `resolveNumericDomain` で解決し、固定範囲の逸脱を拒否する。公開済み全国グラフは参考図として残す。`npm run samples:publish:trend --workspace apps/admin` で生成確認し、`-- --apply` でPNG・SVG・全観測値入力・根拠をprivate R2へ保存する。照合後の参照は `lib/template-trend-assets.ts`、GETの共通読出は `lib/server/template-sample.ts` が所有する。既存ランキングのPNGはこのコマンドで更新しない。

「ランキング → 棒グラフ」は `lib/template-ranking-bars.ts` の共通基本形を4媒体で表示する。代表統計は2024年の最高気温（日最高気温の月平均の最高値）。`lib/template-ranking-data.ts` に固定した正典R2入力のSHA・バイト数を照合し、全47県から上位5県・下位5県を順位のまま抜粋する。全47県共通の実測最小〜最大・同じ青の横棒を縦積みにした1080×1350の1枚。軸目盛りと目盛線は置かず、順位・県名・薄い背景の棒・右端の数値を分離する。公開済みnoteの最高気温図とInstagramの副業者割合図を下部に固定表示し、既存の読みやすい配置を参照できるようにする。`GET /api/template-samples/maximum-temperature-bars` は保存済みR2のPNGをSHA照合して返し、記事・画像・投稿台帳を書き換えない。照合失敗を旧図への置換で隠さず、エラーにする。原本の修正・採用・公開は別工程。

「ランキング → テーブル」は `lib/template-ranking-table.ts` が同じ実統計の上位10県を順位・都道府県・数値の3列で描画する。棒や軸は置かず、県名は左、数値は右に揃える。全47県の入力検査とSHA照合は棒グラフと共用し、`GET /api/template-samples/maximum-temperature-table` から4媒体共通の1080×1350 PNGを表示する。既存の食品支出の参考図も追加見本として保持する。

運用記録は `data/content-operations/quality.json`、図の方針は `image-templates.json` と各JSON Schema。公開URL/本文/投稿状態の正本を複製しない。画像索引 `image-inventory.json` は検証済み記事manifestから派生する。未回収・未照合を「画像なし」「再生成可能」と扱わない。

**派生データの置き場 (2026-10-18 オーナー判断: 画像は R2)**: 在庫索引 (`image-inventory.json`)・Web 画像索引 (`web-image-inventory.json` と `web-images/`)・SNS 画像の移行記録 (`image-migration.json`) は git に置かず、正本を private R2 の `state/content-operations/` にする (有料記事の画像名・SHA を含むため公開 R2 には置かない)。手元では git 管理外の `data/content-operations/live/` に置く。画面を使う前に `npm run media:state:pull` で取得し、`media:inventory -- --all --apply` などで作り直したら `npm run media:state:push` で戻す。未取得のまま開くと画像ライブラリは空に近く、`media:check` は索引に依存する照合だけを省略する (CI はこの状態で動く)。候補画像・入力根拠はprivate R2 `media-workspace/{images,inputs}/<sha>.*` に保存する。

「ランキング → タイルマップ」は `lib/template-ranking-tile-map.ts` から公開済みnote・サイトの `packages/svg-builder/src/charts/choropleth.ts` を直接呼び、同じ実統計の全47県を表示する。北海道の2×2、県ごとの縦横、沖縄の分離を残し、等サイズの正方形へ再配置しない。タイル面積は実面積・人口・値の大小を表さない。色と区分・凡例は指標定義をサイト共通の尺度処理へ渡して解決し、文字の明度調整と列島配置は既存描画処理を共有する。`GET /api/template-samples/maximum-temperature-tile-map` から4媒体共通の1080×1350 PNGを表示する。公開済みの住居費割合note・焼酎支出Instagramの原本と公開先を「公開済みの基準画像」に並べ、旧参考図も保持する。型の整理は先に公開済みの代表画像と生成処理を確認し、既存の良い配置を継承してから行う。

型の方針は `image-templates.json`、運用・確認記録は `quality.json` と各JSON Schemaを正本とする。方針保存時は版と旧方針を残し、旧条件の候補は再確認にする。型が決まってから使用先の画像を順次修正し、生成・目視確認・採用・公開は別の工程として進める。基本形の表示や使用先の紐付けでは原本・候補・公開画像・投稿状態を更新しない。SNSの全47県表示契約も保持する。

同じ図の使用先は、画像ライブラリの「同じ図の使用先」で管理する。`ImageView.comparison` は原本SHA（不明なら画像ID）を既定とし、同じ型・目的・掲載範囲の図を一致根拠付きで関連付ける。保存先は `quality.images[IMG].comparison`（key/title/reason/sharedChannels）。記事名・入力ファイル名だけで異なる図をまとめない。明示した媒体だけ共通画像を利用でき、専用画像を優先する。共有元を保持し、共有先での資産登録・採用・公開済みを推定しない。楽観ロックと型・目的・掲載範囲・管理名の整合を検査する。この使用先管理を基本形の選択へ逆流させない。

画像ライブラリは画像ID・原本SHA・R2所在・使用先・元データ・旧新画像・320px比較・候補履歴を保持する。分類案・失効した分類・元データ未回収は確認待ちとして扱い、未取得を「画像なし」「再生成可能」に置き換えない。候補画像・入力根拠はprivate R2 `media-workspace/{images,inputs}/<sha>.*` に保存する。既存家計の制作記録や `previewOnly`、全項目・現行候補の条件も維持し、旧原図や分割図を現在の共通型として自動採用しない。

### 分類・改善台帳の契約

使用箇所のIDは `IMG-<ownerとfileのハッシュ>` を維持する。物理画像の所在は `assetKey`、同じ原本の使用先は `relatedImageIds` で辿る。分類変更で画像IDを振り直さず、原本・投稿台帳・カバー台帳を複製しない。

| 項目 | 正本・責務 |
|---|---|
| 使用箇所（本文/noteカバー/OGP/SNS等） | 元記事・投稿・画像索引の `usage`。配置先の事実 |
| 役割（統計図/表紙/出典/案内等）と図・画像の型 | 共通契約 `media/lib/classification.mjs`。手動確認は `quality.images[IMG].classification` と `templateId` |
| 確認の根拠と履歴 | `classification` の原本基準SHA・理由・確認日時と `classificationHistory`。元画像が変われば `stale` |
| 個別の改善方針・現画像の維持判断 | 同じ画像レコードの `policy` / `assessment`。現画像の確認は原寸・320px・内容の照合と理由を必須化 |
| 共通の制作方針・媒体別方針 | `image-templates.json`。見た目の型・旧名対応・目的・構成の語彙は `media/lib/taxonomy.mjs`、カード・素材の既定定義は `catalog.mjs`。SVG生成方法は型の分類軸にしない。noteカバーは既存カバー方針のみ |
| 候補・採用 | 同じ画像レコードの `revisions` / `candidateId` / `approvedId` とprivate R2。採用と公開は別の状態 |
| 改善キュー・分類件数・棚卸し不足 | 正本を結合して毎回派生。件数や残件を別の手書き台帳へ複製しない |

`unclassified` は互換用の未割当値で、制作の型には含めない。型一覧から「用途・型の確認待ち」へ移動でき、旧URLも改善キューへ接続する。`queue` / `role` / `usage` / `template` / `purpose` / `selection` / `image` で確認位置を共有する。キューは重複あり（例: 分類・原本・入力の3つが不足する画像）なので件数を合計して総画像数にしない。

分類は `recorded`（使用先契約や明示されたスライド役割）、`suggested`（名前・旧カタログからの案）、`confirmed`（根拠付き確認）、`pending`（未割当）、`stale`（元画像変更）を区別する。記事テーマ・caption・寸法・`image-N`だけで図の型を決めない。人が確認した割当を自動分類で上書きしない。分類の確認は画像品質の合格を意味しない。新規の型は共通定義・役割・方針・対応テストを一緒に追加する。

統計図の `templateId` は見た目の型（棒グラフ・テーブル・折れ線・散布図・地理形状の地図・タイルマップ等）とする。ランキング・比較・推移は `classification.purpose`、上位下位・全47県等は `classification.selection`、媒体は使用先、SVG/PNGは形式として分ける。棒の長さで量を読むものは棒グラフ、行と列で項目・数値を読むものはテーブル（補助の棒があっても表が主ならテーブル）。カード・表紙・素材は既存の用途別方針と専用カバー台帳を維持する。

旧 `ranking` は目的へ、SVG/媒体別の同じ図形は共通型へ統合する。目的・題材だけで型を確定しない。旧台帳・索引は互換読込し、曖昧な割当は確認待ちへ残す。旧方針と分類は履歴に保存し、IMG ID・原本・入力・使用先・候補実体を維持する。型・目的・構成・方針は候補の確認条件に含め、変更後は旧候補を自動採用しない。分類保存は目的と構成（未確認も明示可能）の語彙検査を通し、制作依頼にも同じ分類を渡す。

分類未確定でも改善方針だけ保存できる。現画像を維持する判断と候補の採用は、分類・原寸・320px・内容の確認を伴う。維持判断の保存前には原本の実体とSHAを再照合する。原本・型・方針・固定入力の変更後は以前の確認を完了扱いにしない。分類が未確認・失効している候補は採用不可。表紙・出典カードも同じ方針・候補管理を使用し、noteカバーは制作ID付きで既存専用画面へ送る。

本文manifest未回収/索引の版不一致/SNS素材一覧未登録/Web本文索引エラーは「棚卸し待ち」に残す。素材一覧が空のSNSに限り、記事・投稿の改善画面で「画像・動画なし」を根拠付きで確認できる。投稿が変わればこの確認も失効する。統計図の入力確認は数値JSON/CSVの所在を見ており、本文や完成SVGだけで入力保全済みとはしない。全入力が足りるか・再生成できるかは個別に検証する。

`media:check` は全画像の分類状態・役割/型整合・作業キューの網羅・参照ID・履歴・孤児・棚卸し待ちの使用先を検査する。`media:test` は分類/元画像変更/競合書込/採用拒否の振る舞いを検査する。PRの常時実行ジョブ `contract-tests` で実行し、台帳だけの更新も対象とする。未分類・未保全の存在は作業キューで追い、台帳の破損や取りこぼしは検査失敗にする。

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

書込APIは `PATCH /api/content-quality`、`PATCH /api/media-library/:id`（`plan`=分類確認+方針、`policy`=方針のみ、`assess`=現画像の確認、`review`=候補の確認）、`POST /api/media-library/:id/candidate`、`PATCH /api/media-templates/:id`。同一localhost Origin、入力schema、楽観ロック、保存ロック、画像サイズ/形式、R2 readbackを検査する。採用で公開面は変更しない。

本文画像の型を試すときは、各型の代表例を原寸と320pxで比較してから全件に広げる。画像検索は改善方針も対象にし、`?q=MOBILE-PILOT-01` で試作対象を再表示できる。個別方針と記事の配置・本文の不一致は同じ品質台帳に記録し、見た目だけの改善で記事全体を確認済みにしない。

`node node_modules/tsx/dist/cli.mjs .claude/scripts/media/render-article-pilot.ts --spec <OS一時領域/spec.json>` は `media:prepare` の復元物からランキング・地理形状地図・散布図の640×960候補を生成する。specは `{id,directory,kind,dataFile,title,subtitle,unit?,xLabel?,yLabel?,focusNames?,changes}` の配列（最大9件）。`kind` は `ranking` / `map` / `scatter`。既定はローカル試作のみ。`--register --admin http://127.0.0.1:4757` を付けると、PNG・SVG・固定数値入力・地理データ・生成条件・コードSHAをprivate R2へ保存し、管理API経由で候補登録する。数値は復元物のSHA、47県の集合、年・単位を検査し、PNGは200KiB以下を必須にする。元出典の正しさと過去の復元一致率は別途評価する。自動採用・公開はしない。

候補の入力根拠の `supplied.sourceData`（JSON文字列）を解析し、`frozenBundle` のR2キーを辿ると、`inputs[].text` に固定ファイル、`sample` に描画条件、`geometry` に当時の地理データ、`renderer` にコード本文とSHAがある。最新値で補完せず、その版のコードと入力を復元して再試作する。媒体別方針の版が変わったら旧候補は再確認する。
