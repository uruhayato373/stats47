# apps/admin — 統合メディアコンソール (localhost 専用)

stats47 のローカル統合メディアコンソール。X / Instagram / note / Kindle の原稿・公開状態、
SNS 投稿/予約、画像資産の欠落チェック/再生成、ブログ SVG、調査カタログ、事業方針、プロジェクト現況を横断管理する。
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
| `/content` | X / Instagram / note / Kindle の制作・公開状態・次アクション・SSOT監査の横断サマリ |
| `/content/x` `/content/instagram` | 既存SNS投稿機能をチャネル別に初期絞り込みした専用画面 |
| `/content/note` | note catalog (git TS)・R2本文所在・公開URL・公開準備状態の読み取り専用ミラー |
| `/content/kindle` | Kindle catalog・manuscript・ローカルEPUB/表紙・KDP listingsの読み取り専用ミラー |
| `/sns` | 投稿台帳 (X/IG と YouTube 過去実績/pilot 記録)・素材再生・caption 編集・投稿/予約・残枠・IG 整合性警告。YouTube 投稿は Studio の人間工程 |
| `/assets` | 画像/動画資産 11 タブ・欠落チェック (HEAD probe)・再生成 (whitelist 5 タブのみ) |
| `/svg` | ブログ SVG 分類カタログ (手動ロード・10 分キャッシュ) |
| `/research` | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続の読み取り専用ミラー |
| `/strategy` | stats47 2.0事業計画の25章判断、設計文書、実行ゲート、KPI/イベント、100企画・X30案・note商品15件の読み取り専用ミラー |
| `/dashboard` | メトリクス/進捗キュー/バックログ/STP の読み取り専用ミラー (60 秒キャッシュ) |
| `/buzz-map` | バズ地図 集客ゲート管理 (2026-07-17)。curated catalog 160 件既定 + `?lane=` で machine 全レーン。filter/score breakdown/evidence/landing 状態/素材 preview。操作 job: landing 再判定・spec 生成・レンダ (still/preview/本尺)・R2 push・draft 登録 — **push/draft は確認ダイアログ + isPostable ゲート必須** (landingContract=pass && live 200 なしでは登録不可)。ideaId/action は catalog 実在 allowlist。正典 `.claude/rules/buzz-map-standards.md` §5 |

## 構成

```
app/            管理画面 + api/** (Route Handler) + media/ pilot/ (ローカルファイル配信)
components/     共有 (console-nav / async-state / job-dialog / media-preview) + ページ別
lib/client/     fetch wrapper (SWR 等は使わない)
lib/contracts/  API DTO + Zod schema (書込/action body 検証)
lib/content-operations/ 各チャネルSSOTの正規化 + 決定的監査 (書込なし)
lib/server/     server-only ドメイン層 (project-root / posts-store / jobs / actions / ...)
tests/          unit + integration (Vitest) / e2e (Playwright)
```

- fs / child_process を使う route は `runtime="nodejs"` + `dynamic="force-dynamic"` + `Cache-Control: no-store`。
- project root は `lib/server/project-root.ts` が一元解決 (`STATS47_PROJECT_ROOT` env で上書き可、
  `package.json name === "stats47-monorepo"` を検証)。

## SSOT (このアプリはミラー・複製 store を作らない)

| データ | SSOT | 扱い |
|---|---|---|
| SNS 投稿台帳 | `.claude/state/sns/posts.json` | **書込は `sns-posts-store.cjs` 経由のみ** (`lib/server/posts-store.ts` が createRequire でランタイムロード — webpack バンドル禁止: .cjs は `__dirname` 相対でパス解決するため) |
| note編集メタ / 本文 | `.claude/scripts/note/catalog/` (git TS) / R2 `note/<vertical>/<slug>/` | `/content/note` は正規化表示のみ。`note-published-urls.json` は派生で手編集しない |
| Kindle設計 / 原稿 / 出品 | `book-catalog.ts` / `manuscripts/<id>/` / `.claude/config/kdp-listings.json` | `/content/kindle` は突合表示のみ。EPUB/表紙は `.local` で存在確認 |
| IG 予約 | `.claude/state/instagram-w*-schedule.json` | schedule JSON + posts.json の**二重書込を同一処理で** |
| ローカル素材 | `.local/r2/sns` / `.local/ogp-pilot` | `/media` `/pilot` で配信 (読み取り) |
| X 成功時刻 | `.local/sns-gallery-state.json` | 7 日ガードの判定源 |
| 配信素材 | R2 (`storage.stats47.jp`) | 公開 URL で読む。list しない |
| dashboard | state JSON / metrics CSV / docs md | 読み取り専用ミラー (`lib/server/dashboard.ts`) |
| 調査カタログ | `.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json` | 読み取り専用ミラー (`lib/server/dashboard-catalog.ts`) |
| 事業計画 | `packages/data-configs/src/business-plan/` + `.claude/state/business-plan/latest.json` | authored SSOTとderived運用stateの読み取り専用ミラー (`lib/server/business-plan.ts`) |
| 資産列挙 | `.claude/scripts/lib/gallery-collectors.mjs` + `svg-classify.mjs` | **CI 静的ギャラリーと共有 — 削除禁止**。`lib/server/collectors.ts` (+ .d.ts) 経由で import |

## 安全ガード

- **X**: 最終成功から 7 日超は `force:true` なしで **428** (dry-run を先に強制)。job 成功時に成功時刻を更新
- **regenerate**: kind whitelist 5 種のみ・keys は `^[a-z0-9,_-]+$`
- **job**: 同時実行 1 (実行中は 409)・log 末尾 500 行・globalThis singleton (HMR 二重化防止)
- **ファイル配信**: decode → resolve → relative 検査 → **realpath 後再検査** (symlink 脱出拒否) → regular file のみ。Range 200/206/416
- post 登録は常に `status="draft"`、PATCH は caption/scheduled_at のみ
- 個別制作物をTODOへ二重登録しない。`audit:content-operations` が `K-Sx-xx` / `NOTE-ARTICLE-*` /
  `SNS-POST-*` 等の個別カードを拒否し、システム課題・自動化・横断意思決定だけをbacklogに残す
- CORS ヘッダなし (same-origin のみ)。エラー応答は `{error}` のみ (stack/credential を返さない)

## 検証

```bash
npm run type-check --workspace=apps/admin
npm run test --workspace=apps/admin        # Vitest unit + integration (実 SSOT に触れない fixture 方式)
npm run audit:content-operations           # SNS / note / Kindle のSSOT横断監査 (errorで失敗)
npm run build --workspace=apps/admin
cd apps/admin && npx playwright test       # E2E (dev server を PORT=47470 で自動起動、破壊的操作は mock)
```

生成先は通常dev=`.local/next-admin-dev`、E2E=`.local/next-e2e`、build/start=`.next` に分離する。
起動中のdevとbuildで同じwebpack chunkを上書きしないための契約で、`run-next.mjs` と
`playwright.config.ts` が `NEXT_DIST_DIR` を設定する。
