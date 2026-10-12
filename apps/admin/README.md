# apps/admin — 統合メディアコンソール (localhost 専用)

stats47 のローカル統合メディアコンソール。X / Instagram / note / Kindle の原稿・公開状態、
private Google Drive参考文献から既存コンテンツへの展開状況、
SNS 投稿状態、Geo契約、画像資産、ブログ SVG、調査カタログ、事業方針、プロジェクト現況を横断管理する。SNS下書き本文のみ画面から編集でき、それ以外は読み取り専用。
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

| パス | 内容 |
|---|---|
| `/` | 導線 + 件数サマリ |
| `/product/status` | 商品チャネル (note・ココナラ・Kindle) の件数・公開段階。チャネルの定義は `lib/channel-registry.ts` |
| `/product/coconala` | ココナラの出品状況 (`coconala-listings.json` × product-factory カタログ) |
| `/content` | X / Instagram / note / Kindle の制作・公開状態・次アクション・SSOT監査の横断サマリ |
| `/content/x` `/content/instagram` | 投稿台帳をチャネル別に初期絞り込み。XはGeo role・分析ID・claim metricも表示 |
| `/content/note` | note catalog (git TS)・R2本文所在・公開URL・公開準備状態の読み取り専用ミラー |
| `/content/note/covers` | 共通台帳から画像付き一覧・カバー比較を表示。右側で分類/確認状態/note反映を絞り込み、検索・列見出しの並べ替え・ページ送り・Sheetで拡大比較。画像はprivate R2からGET proxyでSHA確認し配信 |
| `/content/kindle` | Kindle catalog・manuscript・ローカルEPUB/表紙・R2暗号化archive・KDPの下書き/審査中/販売中・価格/ロイヤリティ/KUの読み取り専用ミラー |
| `/content/references` | 解決済みinventoryをranking・survey・theme・area・japan・world・blog・note・Kindle・YouTube・Instagram・Xへ突合した全展開ポートフォリオ。context-onlyは公式資料単位の補強プールとして別表示 |
| `/sns` | 投稿台帳 (X/IG と YouTube 過去実績/pilot 記録)・素材再生・caption・投稿状態・残枠・IG 整合性警告の読み取りビュー |
| `/assets` | 画像/動画資産 11 タブの読み取り専用ギャラリー |
| `/svg` | ブログ SVG 分類カタログ (手動ロード・10 分キャッシュ) |
| `/research` | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続の読み取り専用ミラー |
| `/strategy` | stats47 2.0事業計画とM1 Geoのsource layer・空間演算・metric・X role 3/9/2/1・契約違反の読み取り専用ミラー |
| `/dashboard` | メトリクス/進捗キュー/バックログ/STP の読み取り専用ミラー (60 秒キャッシュ) |
| `/buzz-map` | curated catalog・score・evidence・landing・素材previewの読み取り専用ギャラリー。実行は `/buzz-map` skill |
| `/ops/agents` | agent・skill・CI 無人実行・backlog-loop のモデル/effort 割り当て一覧。正本の frontmatter・workflow・routing policy を表示のたびに読む |

## 構成

```
app/            管理画面 + api/** (Route Handler) + media/ pilot/ (ローカルファイル配信)
components/     共有 (console-nav / async-state / media-preview) + ページ別
components/ui/  shadcn/ui 公式 (new-york-v4) の部品。公式のままにする (差は check-shadcn-parity が止める)
components/admin-ui/  組み立て部品 (TableFrame / DataTable / PanelCard / StatCard / StatusBadge / LinkCard)。layout-primitives.tsx は Stack / Grid / Section
components/content/note-covers-browser.tsx  shadcn Table + 既存のTanStack Table v8で検索/並べ替え。表示条件はURLに保持し、画像/公開台帳には書き込まない
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

| データ | SSOT | 扱い |
|---|---|---|
| SNS 投稿台帳 | `data/sns/posts.json` | ID台帳・画像一覧から確認。下書き本文の保存だけadminから既存store経由で実行。予約・投稿はowner agent/skill |
| note編集メタ / 本文 | `.claude/scripts/note/catalog/` (git TS) / R2 `note/<vertical>/<slug>/` | `/content/note` は正規化表示のみ。`note-published-urls.json` は派生で手編集しない |
| Kindle設計 / 原稿 / 出品 | `book-catalog.ts` / `manuscripts/<id>/` / `config/kdp-listings.json` / `data/products/kindle-archives.json` | `/content/kindle` は突合表示のみ。ローカル成果物とR2 revision、KDP状態を別々に表示 |
| 参考文献展開 | `data/source-inventory/` + Theme/Japan/survey/blog/note/Kindle/SNSの既存SSOT + `contents/blog/`・`docs/31_note記事原稿/` | `/content/references` は制作単位×12チャネルを実行時に重複排除し、context-onlyも全件集約する。原本・OCR・crop・Drive IDは読まない |
| IG 予約 | `data/sns/instagram-w*-schedule.json` | adminはposts.jsonとの差分表示だけ。予約agentが更新 |
| ローカル素材 | `.local/r2/sns` / `.local/ogp-pilot` | `/media` `/pilot` で配信 (読み取り) |
| X 成功時刻 | `.local/sns-gallery-state.json` | 投稿agentが更新し、adminは残枠表示のために読む |
| 配信素材 | R2 (`storage.stats47.jp`) | 公開 URL で読む。list しない |
| dashboard | state JSON / metrics CSV / docs md | 読み取り専用ミラー (`lib/server/dashboard.ts`) |
| 調査カタログ | `.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json` | 読み取り専用ミラー (`lib/server/dashboard-catalog.ts`) |
| 事業計画 | `packages/data-configs/src/business-plan/` + `data/business-plan/latest.json` | authored SSOTとderived運用stateの読み取り専用ミラー (`lib/server/business-plan.ts`) |
| 資産列挙 | `.claude/scripts/lib/gallery-collectors.mjs` + `svg-classify.mjs` | **CI 静的ギャラリーと共有 — 削除禁止**。`lib/server/collectors.ts` (+ .d.ts) 経由で import |

## SNSのID台帳

`/sns` と `/content/{x,instagram}` で画像一覧 / 台帳表示を切り替える。IDは既存の `posts.json` を使い、別台帳を作らない。
ID検索 (`#1109`、`1109,1110,1111`)、本文・キー・template検索、媒体・投稿状態・画像の型の絞り込み、予約順、24件ごとのページ送りに対応。表示条件はURLに保持し、日時はJSTに統一する。
「展開候補」 (`/sns?scope=candidates`) は予約前の下書きを表示。出どころ（新しい型の追加企画 / 既存素材）、準備状況、型で絞り込み、企画名も検索できる。
候補の `planning`（企画名・出どころ・整理日・確認用画像の区別・確認事項）と `material_keys`（媒体/ドメイン/元ディレクトリキー）は同じ投稿IDの行に保存する。
確認用プレビューは `assets.role=thumbnail` で保全し、投稿用 `media_path` には設定しない。公開前に投稿用画像・本文・出典を確認する。
未登録素材の整理は `node .claude/scripts/sns/reconcile-materials.mjs --input /tmp/materials.json --report /tmp/plan.json`（dry-run）、適用は `--apply`。
入力は `{platform, domain, content_key, batch:"YYYY-MM-DD"}` の配列で、`title/caption/origin/note` は任意。正確なファイル・既知の別名・素材キーで既存IDへ紐付け、曖昧なら停止。
削除済み素材も元IDへの所属を維持し復活させない。新規行は承認待ち・日時なしで登録し、Driveに実体とSHAを保全する。既存本文・状態・予約日時は変更しない。
画像と本文を開くと下書きだけ編集できる。未保存で閉じる際は確認し、保存エラーでも入力を残す。予約済み・投稿済みは閲覧用。
素材は投稿IDに紐づくGoogle Drive保全素材を優先し、ローカル/R2候補へフォールバックする。家計レシート・県図鑑・順位乗換も型で絞り込める。

## 安全ガード

- APIは原則GET。例外は `PATCH /api/posts/:id/caption` の下書き本文保存だけ (2026-10-11 オーナー指示)。同一origin・loopback・JSON限定、ID/本文/版を検査し、予約/公開/削除済み・古い版の更新を拒否する。変更後は承認待ちへ戻す
- `posts-store.ts` の `saveDraftCaption` のみ既存storeのwriterを呼べる。その他の書込・子プロセス起動は `tests/unit/read-only-contract.test.ts` が拒否する
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
