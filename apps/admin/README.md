# apps/admin — 統合メディアコンソール (localhost 専用)

stats47 のローカル統合メディアコンソール。X / Instagram / note / Kindle の原稿・公開状態、
private Google Drive参考文献から既存コンテンツへの展開状況、
SNS 投稿状態、Geo契約、画像資産、ブログ SVG、調査カタログ、事業方針、プロジェクト現況を読み取り専用で横断管理する。
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
| `/content/x` `/content/instagram` | 投稿台帳をチャネル別に初期絞り込み。XはGeo role・分析ID・claim metricも表示 |
| `/content/note` | note catalog (git TS)・R2本文所在・公開URL・公開準備状態の読み取り専用ミラー |
| `/content/kindle` | Kindle catalog・manuscript・ローカルEPUB/表紙・R2暗号化archive・KDPの下書き/審査中/販売中・価格/ロイヤリティ/KUの読み取り専用ミラー |
| `/content/references` | 解決済みinventoryをranking・survey・theme・area・japan・world・blog・note・Kindle・YouTube・Instagram・Xへ突合した全展開ポートフォリオ。context-onlyは公式資料単位の補強プールとして別表示 |
| `/sns` | 投稿台帳 (X/IG と YouTube 過去実績/pilot 記録)・素材再生・caption・投稿状態・残枠・IG 整合性警告の読み取りビュー |
| `/assets` | 画像/動画資産 11 タブの読み取り専用ギャラリー |
| `/svg` | ブログ SVG 分類カタログ (手動ロード・10 分キャッシュ) |
| `/research` | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続の読み取り専用ミラー |
| `/strategy` | stats47 2.0事業計画とM1 Geoのsource layer・空間演算・metric・X role 3/9/2/1・契約違反の読み取り専用ミラー |
| `/dashboard` | メトリクス/進捗キュー/バックログ/STP の読み取り専用ミラー (60 秒キャッシュ) |
| `/buzz-map` | curated catalog・score・evidence・landing・素材previewの読み取り専用ギャラリー。実行は `/buzz-map` skill |

## 構成

```
app/            管理画面 + api/** (Route Handler) + media/ pilot/ (ローカルファイル配信)
components/     共有 (console-nav / async-state / media-preview) + ページ別
lib/client/     fetch wrapper (SWR 等は使わない)
lib/contracts/  読み取りAPI DTO + Zod schema
lib/content-operations/ 各チャネルSSOTの正規化 + 決定的監査 (書込なし)
lib/server/     server-only read model (project-root / posts / collectors / ...)
tests/          unit + integration (Vitest) / e2e (Playwright)
```

- fs / child_process を使う route は `runtime="nodejs"` + `dynamic="force-dynamic"` + `Cache-Control: no-store`。
- project root は `lib/server/project-root.ts` が一元解決 (`STATS47_PROJECT_ROOT` env で上書き可、
  `package.json name === "stats47-monorepo"` を検証)。

## SSOT (このアプリはミラー・複製 store を作らない)

| データ | SSOT | 扱い |
|---|---|---|
| SNS 投稿台帳 | `.claude/state/sns/posts.json` | adminは`loadAll/query`だけを公開。書込はadmin外のagent/skillがstore経由で実行 |
| note編集メタ / 本文 | `.claude/scripts/note/catalog/` (git TS) / R2 `note/<vertical>/<slug>/` | `/content/note` は正規化表示のみ。`note-published-urls.json` は派生で手編集しない |
| Kindle設計 / 原稿 / 出品 | `book-catalog.ts` / `manuscripts/<id>/` / `.claude/config/kdp-listings.json` / `.claude/state/products/kindle-archives.json` | `/content/kindle` は突合表示のみ。ローカル成果物とR2 revision、KDP状態を別々に表示 |
| 参考文献展開 | `.claude/state/source-inventory/` + Theme/Japan/survey/blog/note/Kindle/SNSの既存SSOT + `docs/{21_ブログ記事原稿,31_note記事原稿}/` | `/content/references` は制作単位×12チャネルを実行時に重複排除し、context-onlyも全件集約する。原本・OCR・crop・Drive IDは読まない |
| IG 予約 | `.claude/state/instagram-w*-schedule.json` | adminはposts.jsonとの差分表示だけ。予約agentが更新 |
| ローカル素材 | `.local/r2/sns` / `.local/ogp-pilot` | `/media` `/pilot` で配信 (読み取り) |
| X 成功時刻 | `.local/sns-gallery-state.json` | 投稿agentが更新し、adminは残枠表示のために読む |
| 配信素材 | R2 (`storage.stats47.jp`) | 公開 URL で読む。list しない |
| dashboard | state JSON / metrics CSV / docs md | 読み取り専用ミラー (`lib/server/dashboard.ts`) |
| 調査カタログ | `.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json` | 読み取り専用ミラー (`lib/server/dashboard-catalog.ts`) |
| 事業計画 | `packages/data-configs/src/business-plan/` + `.claude/state/business-plan/latest.json` | authored SSOTとderived運用stateの読み取り専用ミラー (`lib/server/business-plan.ts`) |
| 資産列挙 | `.claude/scripts/lib/gallery-collectors.mjs` + `svg-classify.mjs` | **CI 静的ギャラリーと共有 — 削除禁止**。`lib/server/collectors.ts` (+ .d.ts) 経由で import |

## 安全ガード

- API routeはGETだけ。書き込みmethodは `tests/unit/read-only-contract.test.ts` が拒否する
- server層の子プロセス起動・ファイル書き込みadapterも同じ契約テストが拒否する
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
