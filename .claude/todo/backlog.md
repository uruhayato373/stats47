---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-09-16
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

### [CONTENT-PAINPOINT-PUBLISH-01] 悩み起点ブログ5本の公開とSNS展開を完了させる

タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:curl -sI https://stats47.jp/blog/nursery-shortage-urban-prefecture が200を返す] [起票:2026-09-16] [期日:2026-09-23]

- **背景**: 統計そのものより「悩み・不安」起点の記事がSEOに効くという仮説で、白書(NotebookLM)調査+note/X調査の両方で裏付けが取れた5テーマを記事化した。5本とも `quality-gate.mjs` / `article-factual-check.mjs` / blog-critic すべて PASS 済み (`docs/21_ブログ記事原稿/{nursery-shortage-urban-prefecture, vacant-housing-rate-inherited-home-risk, elderly-welfare-expenditure-prefecture-gap, evacuation-plan-coverage-urban-prefecture-gap, intellectual-crime-tokyo-kagawa-gap}/`)。
- **公開の現在地**: `/publish-bulk-articles` の Phase 1(検証)・Phase 2(staging、`.local/r2/app/blog/<slug>/` に `published: true` で配置済み)までは完了。Phase 3(OGP/カード背景のCodex生成)で停止 — このセッションでは Codex MCP が `CONNECTION_CLOSED` だった。ユーザーが `codex login` を完了させたことは確認済みだが、**MCP再接続には新しいセッション起動が必要**(同一セッション内では再接続できなかった)。
- **画像生成の準備**: 5本分の背景生成リクエストは `.local/blog-imagegen/requests/<slug>.json` に作成済み (プロンプト・promptHash・出力先 `apps/web/scripts/lib/assets/blog-article-backgrounds/<slug>.jpg` まで確定)。新セッションでCodex MCPが繋がったら `npm run blog-images:codex -- ingest-article --slug <slug> --input <path> --prompt-hash <hash>` → `generate-blog-thumbnails.ts --slug <5slugs>` から Phase 3 を再開し、Phase 4(R2 push・all.json反映・cache purge)→ Phase 5(HTTP検証)へ進める。
- **SNS下書き**: X投稿文5本・Instagramキャプション5本は作成済み、`.claude/state/sns/pain-point-series-drafts.md` に保存済み。**投稿・予約は記事が本番公開されてから、ユーザーの明示許可を得て実施する**(まだ実行していない)。X下書き作成agentの申し送り: 各投稿に添付する画像とチャートSVGの形式一致は未確認、投稿前に要突合。
- **次**: 新セッションで `codex login status` → MCP接続確認 → 上記Phase 3から再開。
- **停止条件**: 画像なし(共有背景fallback)でR2にpushしない(OGP/カードが404で公開される事故を防ぐ設計)。
- **完了条件**: 5記事すべてが本番で200 + OGP/thumbnail画像が正しく出る + SNS投稿(X/IG)まで実施されている。

### [UI-CARD-TYPOGRAPHY-UNIFY-01] カードの見出し・本文・余白を役割契約に統一する (A 済 / B 実装済・検証途中 / C 未着手)

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-16] [期日:2026-09-30]

- **owner**: site-ux-manager (横断契約・機械ゲート) / ranking-ui-manager (ranking 面) / theme-ui-manager (themes 面)
- **背景 (2026-09-16 実測・5 ページ・デスクトップ幅)**: 同じ役割のカードが feature ごとに見出しサイズ/太さ/余白を上書き・再実装し、
  ranking 詳細で本文カード見出しが 14/600・14/500・16/600・14/700 の 4 系統、FAQ 本文 14px / 考察 15px に対し他カード 12px、
  `/areas/04000` 右レールで 14/500 と 16/600 が混在、`/themes/real-income` でチャート見出しが同一ページ内 16/600 (9 枚) と
  14/600 (6 枚)、category の分類カードが 13/700・余白 8/12。規約 (`04_デザインシステム.md`) はカード見出し/本文/余白の数値を
  持たず、旧資料 `.claude/design-system/{prohibited,principles,quick-reference}.md` は余白を `p-5以上`/`p-6`/`p-0禁止` と 3 値で
  並立させコード正典 `SurfaceCard p-4` と食い違う。計測方法: DOM で `border`+`bg-card` を持つ最外郭要素ごとに最初の見出し
  (h2-h4 / font-weight≥600) の font-size/weight、本文の最頻 font-size、padding を集計。
- **契約 (確定。数値はコードが正典・文書へ二重管理しない)**:
  - レール/リンク一覧カード = `RailCard` 既定 (h3 `text-sm font-medium text-muted-foreground`・ヘッダ `px-4 py-3`・本文 `px-4 pb-4 pt-3`)、
    リンク行 = `RailLinkItem` (`py-1.5 text-sm`、2026-09-16 に text-xs から統一)、2 行目 `text-xs`
  - 見出し付き本文カード = `SectionCard` (`components/surface/SurfaceCard.tsx`、RailCard と同じ HeaderedSurfaceCard の variant。
    h3 `text-sm font-semibold text-foreground`・ヘッダ `px-4 py-3`・本文 `p-4`)。`ChartPanel` と同じ見た目。非チャート用
  - メタ文字 = `text-xs`。`text-[10px]`/`text-[11px]`/`text-[13px]` の任意値は使わない
  - `titleClassName` のサイズ/太さ上書き禁止 (色だけ可: AreaProfileSidebar の emerald/amber)
  - ページ節見出し: h2 `text-xl font-bold`、節内の小見出し h3 `text-base font-semibold`。h1 だけ `text-2xl font-bold`。`text-lg` 見出し禁止
  - カード内カード禁止は維持 (SectionCard の内側は枠なしのリンク行にする)
- **済 (A) — commit `3ca99124c`**: SectionCard 新設 + card census 登録 / RailLinkItem text-sm / RailCard 再実装 7 件
  (RelatedAreas・AreaProfileSidebar・CitiesNavCard・CorrelationSection+Skeleton・PortStatisticsMapCard・RankingSidebarSkeleton・RailAdSlot)
  を共通部品化 / blog 関連ランキング・目次と CityRankingSection の titleClassName 上書き削除 (ArticleTableOfContents の compact prop 削除) /
  楽天・返礼品・運営者カードを semibold + text-xs へ / PortalCategoryGrid sidebar・RailLinksCard の任意 px を scale へ。
  `/areas/04000` 右レール 4 枚が 14/500・リンク 14px に揃ったことをブラウザ実測済み
- **B — 実装済み・検証途中 (この PC で 2026-09-16 に Sonnet が編集、型/design-system/card census/eslint は緑、対象 vitest は実行途中で中断)**:
  対象 14 ファイル = RankingSourceCard / RelatedRankingsGrid (SectionCard 化。内側 9 枚は枠付き SurfaceLinkCard から枠なしリンク行へ =
  カード内カード禁止のため。**見た目の確認が未了**) / DataUsageCard (SurfaceCard + tint) / RankingPageCardsSkeleton / AreaRelatedRankingsCard /
  AreaRelatedBlogArticles (h2 text-2xl→text-xl) / AreaDatabookSection (節内 h3 text-lg→text-base semibold) / ThemeRelatedArticles /
  ThemeEvidenceTopicsSection / ThemeIndicatorCatalogSection (h2 text-lg→text-xl) / MetricFocusCharts・MetricSwitcherPanel
  (`titleClassName="text-base"` 削除 = themes のチャート見出し 16→14px) / ChartState (h3 text-lg→text-sm) / SurveyTaxonomyCard section 変種
  (h2 text-lg→text-xl、p-5 撤去)。**次の PC ではまず** `cd apps/web && npx vitest run src/features/ranking src/features/area-profile
  src/features/area-databook src/features/theme-dashboard src/features/survey src/components` を通し、`git diff` で
  ThemeEvidenceTopicsSection の見出し扱い (h2 を節見出しとして残したか SectionCard title にしたか) を確認する
- **C — 未着手 (機械ゲート + 文書)**:
  1. `apps/web/scripts/check-design-system.mjs` に規則を追加 (既存の `rules` 配列と同形式・`allow` で例外):
     `no-card-title-scale-override` (`titleClassName=` に `text-(xs|sm|base|lg|xl|2xl)|font-\w+` を含む。features/app 対象) /
     `no-manual-card-header` (`border-b` と `px-N` と `py-N` を同一 class 文字列に持つ手書きヘッダ。features/app 対象、`src/components/**` は許可) /
     `no-arbitrary-text-size` (`text-\[(10|11|13)px\]`。A 実施前は 87 箇所/40 ファイル。残存ファイルを**縮小専用 allowlist** に列挙し新規を止める。
     `src/features/ogp/**` と Remotion 系は対象外) / `no-text-lg-heading` (`<h[23]` と `text-lg` の同居。`MarkdownSectionRenderer` は allowlist) /
     `no-h2-text-2xl` (hero・PageHeader 以外)。checker のテストがあれば規則ごとに 1 ケース足す
  2. 文書: `docs/01_技術設計/04_デザインシステム.md` に「カードの役割契約」節 (部品名で書く。数値は書かない) / `.claude/rules/ui-components.md` に
     「RailCard/SectionCard の titleClassName でサイズを上書きしない」「feature 内で SurfaceCard p-0 + 手書きヘッダを作らない」を追記 /
     `.claude/design-system/{prohibited,principles,quick-reference}.md` の余白数値 (`p-5以上`/`p-6`/`p-0禁止`) を削除し「コード正典 = SurfaceCard p-4」へ
  3. ブラウザ再計測 (上記の計測方法) を `/ranking/natto-consumption-expenditure` `/areas/04000` `/themes/real-income` `/category/economy`
     `/blog/local-government-debt-burden` で行い、役割ごとに 1 系統に収束したことを確認。RelatedRankingsGrid の枠なし化と
     ranking 右レールのリンク 14px 化の見た目を目視
- **未決 (オーナー判断)**: ① FAQ/定義/考察 (開閉 UI) の本文 14px は規約どおりだが他カードの 12px と並ぶと大きく見える —
  他カードを 14px へ上げるか開閉 UI を 13px へ寄せるか ② category の分類カード (13/700・8/12、`CategoryTopicGroups`) を契約へ寄せるか
  ③ `MarkdownSectionRenderer` の h2 16px (テーマ本文内) の扱い
- **環境メモ**: この Windows PC で node_modules が lock とずれ `@babel/core` 不在 → pre-commit の `next lint` が落ちる。`npm install` で復元済み。
  共有ツリーで作業するときは `git commit -- <paths>` で staged を残さない (別セッションの commit に巻き込まれた実例あり)
- **停止条件**: 契約テスト (`right-rail-banner-contract` / `page-shell-rail-contract` / `left-rail-layout-contract` / chart contract audit) を弱めない。
  デプロイはオーナー指示で 1 回
- **完了条件**: 5 ページ計測で役割ごとに 1 系統 / `check-design-system` の新規則が緑で既存違反 0 (allowlist は縮小専用) / 文書 3 点更新 /
  `npm run type-check --workspace=apps/web` と対象 vitest が緑

### [SITEWIDE-DUPLICATE-LINK-RATIO-01] サイト横断でリンク重複率が閾値超過 (本番全6,237URL実測)

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run page-quality:audit-weekly -- --base-url https://stats47.jp] [起票:2026-09-15]

- **owner**: ranking-ui-manager (ranking) / theme-ui-manager (theme) / site-ux-manager (共通部品・横断)
- 2026-09-15、`page-quality:audit-weekly` を本番全 6,237 URL に実行 (初の全件試行)。
  error 2,698 / warning 5,106。**duplicate_link_ratio がほぼ全テンプレートの支配的違反**で、
  個別ページの内容問題ではなく共通コンポーネント由来の疑いが強い:

  | テンプレート | 対象URL数 | error | warning | duplicate_link_ratio 内訳 |
  |---|---:|---:|---:|---|
  | prefecture-detail (`/areas/[code]`) | 2,491 | 1,691 | 1,612 | error 1,691 + warning 752 = 対象の 98% |
  | blog (`/blog/[slug]`) | 606 | 606 | 112 | error 605 = 対象の **99.8%** |
  | ranking (`/ranking/[key]`) | 2,170 | 227 | 3,197 | error 227 + warning 1,941 (ad_duplicate_count warning も1,256件) |
  | geo-analysis | 71 | 55 | 10 | error 55 = 対象の 77% |
  | theme | 56 | 38 | 34 | error 38 = 対象の 68% |
  | survey | 148 | 64 | 83 | error 56 + warning 83 |
  | category | 17 | 11 | 8 | error 11 |
  | municipality | 360 | 0 | 0 | **異常なし** (比較対象として健全) |

- **注意 (実証ベース)**: prefecture-detail は並行 Codex セッション (`area-density-optimization` /
  `area-all-optimization`、2026-09-15実施)が「ranking リンク重複排除」を含む最適化を
  ローカル dev server で検証済みだが**本番未デプロイ**。本監査は現行本番 (デプロイ前) を
  見ているため、そのセッションの変更が本番反映されれば prefecture-detail 分は改善している
  可能性が高い。**デプロイ後に再実測してから母数を再評価すること** (未検証のまま「直った」
  と判断しない)。
- **次 (実行順)**: ①上記デプロイ待ちの分を除いた ranking/blog/theme/survey/category の
  duplicate_link_ratio 原因(共通ナビ・関連記事ウィジェット・広告リンクの重複生成箇所)を
  各 owner が最小1テンプレートで特定 ②修正 ③`page-quality:check`(代表URL)で個別確認
  ④全件は次回週次 `page-quality-audit-weekly.yml` で確認 (毎回全件を手動実行しない)。
- **完了条件**: 週次監査の error 件数が縮小傾向 (ラチェット化は別途検討)。
- 生データ: `.claude/state/metrics/page-quality/{latest.json,LATEST.md,snapshots/2026-09-15.json}`、
  管理画面 `/quality/page-audit`。

### [STATE-R2-MIGRATION-01] 日次観測 state の残り 4 domain を R2 `state/` へ移す (psi → cloudflare → url-inspection → search-growth)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:git log --since=4.weeks --name-only -- .claude/state/metrics | sort -u | wc -l が 230 未満、かつ curl -sI https://storage.stats47.jp/state/psi/index.json が 200] [起票:2026-09-14] [期日:2026-10-12]

- **owner**: Claude Code (実装) / オーナー (PR 承認・Cloudflare lifecycle)
- **前提**: PR `feat/ga4-affiliate-state-r2` で 1 domain 目 (`state/ads/ga4-affiliate/`) の型が出来ている。
  `state-pull.mjs` (公開 URL → gitignored `live/`)、`index.json` 維持、週次集約だけ commit-back、
  `prune-state-snapshots.mjs` の policy 削除、という 4 手順を domain ごとに繰り返す。
- **背景 (2026-09-14 実測)**: `.claude/state/metrics` は 4 週で 230 commit。大半が psi / cloudflare /
  url-inspection の日次 `[skip ci]` commit-back。git を肥大化させず agent の Grep 対象にも入れない置き場は
  R2 `state/` (400 日 lifecycle・`r2-storage-design.md`)。
- **次 (実行順)**: ① `psi-audit-daily.yml`: `psi-batch-*.json` を `state/psi/` へ、`history.csv` は git のまま。
  読み手 `psi-threshold-check.mjs` / `fetch-psi-audit.mjs` / `search-growth/lib/sources.mjs` に「local 無ければ
  `live/`」を足す。② `cloudflare-usage-daily.yml` (`cloudflare/snapshots/`)。③ `url-inspection-daily.cjs`
  (`gsc/url-inspection/`)。④ `search-growth-weekly.yml` の `latest.json` / `live/`。domain ごとに 1 PR、
  移行後に `RETENTION_POLICIES` の該当 scope を消す。
- **停止条件**: 日次アラート (`[PSI Alert]` / `[Cloudflare Alert]`) の起票経路を壊さない (読み手が CI 内で
  直前に書いた raw を読む経路は維持する)。R2 へ書けなかった日は raw を捨てず artifact に残す。
- **完了条件**: 4 domain とも日次 commit-back が消え、`fetch-metrics-weekly.yml` の週次 1 commit だけが
  `.claude/state/metrics` を触る。`npm run state:pull -- <domain>` が 4 domain で動く。

### [STATE-R2-LIFECYCLE-01] R2 `state/` prefix の object lifecycle rule (400 日) をオーナーが設定する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Cloudflare ダッシュボード R2 → stats47 → Settings → Object lifecycle rules に prefix state/ の 400 日ルールがある] [起票:2026-09-14] [期日:2026-09-28]

- **owner**: オーナー
- **何を**: Cloudflare ダッシュボード → R2 → `stats47` → Settings → Object lifecycle rules → Add rule:
  prefix `state/`、Delete uploaded objects after 400 days。コード変更なし。
- **なぜ**: `state/` は CI が日次・週次で書き続ける生 snapshot の置き場で、他の prefix と違い GC を
  `r2-retention.ts` の allowlist で運用しない (正典 `r2-storage-design.md` 「削除ポリシー」)。
  ルールが無いと 32GB (2026-09-12) の R2 に上乗せで増え続ける。
- **停止条件**: prefix を `state/` 以外に広げない (`app/` `gis/` は PROTECTED)。

### [CONFIG-SECRET-CLAUDE-JSON-01] `~/.claude.json` の github MCP に残る平文 PAT を退避する (gh CLI のプロキシ認証が前提)

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:node -e "const j=require(require('os').homedir()+'/.claude.json');console.log(Object.keys(j.mcpServers.github?.env||{}))" が [] を返す] [起票:2026-09-14] [期日:2026-10-12]

- **owner**: オーナー
- **現状 (2026-09-14)**: Codex 側 (`~/.codex/config.toml`) の PAT は削除・github MCP を無効化済み。Claude 側
  (`~/.claude.json` user スコープ) の github MCP は `GITHUB_PERSONAL_ACCESS_TOKEN` を平文で持つが、会社 PC では
  `gh` CLI が「Proxy Authentication Required」で使えないため、この MCP が唯一の GitHub API 経路として残している。
- **次**: ① 会社 PC で `gh auth login` を通す (プロキシ設定 `HTTPS_PROXY` + `gh config set http_unix_socket` 等を
  試す)。② 通ったら `claude mcp remove -s user github` し、`~/dotfiles/bin/mcp-user.{ps1,zsh}` の集合と一致させる。
  ③ 平文で置かれていた PAT は GitHub 側で revoke して発行し直す。
- **停止条件**: gh が通る前に MCP を消さない (GitHub Issues / PR 操作が会社 PC で不能になる)。

### [MAC-FIRST-RUN-01] 自宅 Mac で二拠点セットアップを初回実行し、Mac 固有の罠を local-environment.md に記録する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Mac で node .claude/scripts/setup-memory-symlink.mjs --check と node .claude/scripts/lib/sync-codex-mirror.cjs --check が exit 0] [起票:2026-09-14] [期日:2026-09-28]

- **owner**: オーナー (Mac 操作) / Claude Code (罠の記録)
- **手順**: `local-environment.md` 「2 台で同じ形にする手順」の Mac 列を上から実行する
  (dotfiles clone → `link.mjs --host mac` → `git clone --filter=blob:none` → memory link → `core.hooksPath` →
  `~/tmp` → `local-resources.sh install` → `gh auth login; codex login` → mirror check)。
- **要確認 (未実測)**: `codex/host.mac.toml` の filesystem / notebooklm パスは仮置き (`/Users/kazu/...`)。
  `local-resources.mjs` の darwin `ps` 分岐と `assertNoLinks` の `/private/tmp` realpath は実機未検証。
  `.claude/settings.local.json` の seed (`stats47.local.mac.json`) の許可リストも初回で調整する。
- **完了条件**: Mac 側の `claude mcp list` / `codex mcp list` の名前集合が Windows と一致し、
  `local-environment.md` に Mac 節の実測が 1 つ以上追記されている。

### [PERF-RANKING-LCP-03] ランキングページの LCP がベースラインより悪化したまま

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/psi/... の history.csv で ranking/total-population,mobile の LCP < 9,347ms] [起票:2026-09-07] [期日:2026-09-21]

- **owner**: Claude Code (調査・実装) / オーナー (デプロイ承認)
- **症状 (実測)**: `.claude/state/metrics/psi/history.csv` の `ranking/total-population,mobile` 直近 3 週 (2026-08-23〜09-06) の LCP は 10,936〜13,841ms (平均約 12,300ms) で、ベースライン 9,347ms (2026-08-04) より約 32% 悪化している。
- **一次診断**: 最新 batch (2026-09-06) の `lcp_element` 実測で LCP 要素は依然 Leaflet タイル。topology をクライアント `useEffect` fetch へ変更したことがハイドレーション後の直列処理を増やした疑い。
- **なぜカードが要るか**: 旧 `PERF-RANKING-LCP-02` は 2026-09-07 の improvement-triage (`b27c62cab`) で「完了条件未達」として改善バックログから削除されたが、後継の追跡先が作られず**どの台帳にも存在しない状態**になっていた。`monthly.md` の言及は計画ビューであり TODO の実体ではない。
- **次**: タイル描画を TopoJSON 取得から分離する修正は `4ee6b5641` に実装済み。PR #940 の本番反映後に LCP 要素を再確認し、PSI の 3 週以上の推移で効果を判定する。調査・実装を最初から繰り返さない。
- **停止条件**: 単発の PSI 値で改善と判定しない (日次計測はばらつくため 3 週以上の推移で見る)。デプロイはオーナーの明示承認まで行わない。ベースライン 9,347ms は 2026-08-04 の実測値で、これを更新して達成扱いにしない。
- **完了条件**: `ranking/total-population,mobile` の LCP が 3 週連続でベースライン 9,347ms を下回る。悪化要因が topology fetch でなかった場合は、実測で特定した真因と対策を本カードへ記録してから閉じる。

### [RSC-CACHE-BYPASS-01] RSC 応答が HTML と同じ共有キャッシュ設定で返る

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:curl -sD - -o /dev/null -H "RSC: 1" https://stats47.jp/ranking/total-population | grep -iE 'cache-tag|vary'] [起票:2026-09-07] [期日:2026-09-21]

- **owner**: Claude Code (調査・実装) / オーナー (デプロイ承認)
- **症状 (2026-09-07 本番実測)**: `/ranking/total-population` へ `RSC: 1` を付けたリクエストの応答が `Content-Type: text/x-component` を返しながら、`cache-tag: stats47-html,stats47-path:%2Franking%2Ftotal-population` と `cloudflare-cdn-cache-control: public, max-age=86400, stale-while-revalidate=604800` を持つ。`Vary` は `Accept-Encoding` のみで RSC ヘッダーを区別しない。HTML と RSC が同一キャッシュキーを共有する条件が成立している。
- **切り分け済み**: (a) `RSC` / `Next-Router-State-Tree` / `Next-Router-Prefetch` / `x-nextjs-data` の 4 種すべてで bypass 分岐に入らない。(b) `RSC: 1` のときだけ `text/x-component` が返るのでヘッダー自体は Next.js 本体に届いている。(c) `apps/web/src/lib/cache-policy.ts` の設計は正しく (RSC は `private, no-store` + `RSC_VARY`)、`cache-policy.test.ts` と `middleware.test.ts` の 54 件は全通過。(d) 該当コードは 2026-08-15 `c46752ef2` で main に入っており未デプロイではない。→ **アプリのコードではなく `@opennextjs/cloudflare` 1.20.6 との統合層の問題**。
- **未確認**: 実際にキャッシュ混入が起きたかは観測していない (RSC 応答に `CF-Cache-Status` が付かない)。本番でキャッシュ汚染を誘発する再現は実害が出るため行っていない。
- **仮説 (未検証)**: `open-next.config.ts` の `withRegionalCache(r2IncrementalCache, { mode: "long-lived" })` が返すキャッシュ応答が HTML 用ヘッダーを引き継ぎ、middleware の判定結果を反映していない。
- **次 (実行順)**: Worker gateway の RSC bypass は `3ce7e0edb` に実装済み。公開・実測の最新結果は [PR #940 の最終検証欄](https://github.com/uruhayato373/stats47/pull/940) を確認する。未検証の場合だけ RSC 応答の `private, no-store`・`Vary`・HTML cache-tag 非付与を実測する。上記仮説は修正前の調査記録であり、未着手と解釈しない。
- **停止条件**: 本番でキャッシュ汚染を誘発する再現テストをしない。デプロイはオーナーの明示承認まで行わない。原因未特定のまま `withRegionalCache` を外さない (ISR キャッシュが効かなくなり別の劣化を生む)。
- **完了条件**: RSC リクエストの応答が `Cache-Control: private, no-store` と RSC を含む `Vary` を返し、`cache-tag: stats47-html` が付かないことを本番で実測する。HTML 応答は従来どおり `CF-Cache-Status: HIT` を維持する。

### [GSC-COVERAGE-DEPLOY-01] カバレッジ是正と入力鮮度ガードを本番反映する

タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [検証:node .claude/scripts/gsc/build-coverage-queue.mjs --no-probe] [起票:2026-09-07] [期日:2026-09-14] [進行中]

- **owner**: オーナー（GSC UI export）／Claude Code（取込・効果判定）
- **現状**: 2026-09-07にPR #939（main `5d05cd6e1`）で本番反映済み。PR CI、Cloudflare deploy、post-deploy smoke、R2 ISR GC、CDN全体パージはすべて成功した。Googlebot UA実測で旧市区町村カテゴリsoft404 5件は全件301、親プロフィール200、未知カテゴリ410 + noindex。sitemapは旧カテゴリ0件 / 市区町村プロフィール360件、自治体Datasetは`description` / `license` / `distribution.contentUrl`を本番HTMLで確認した。
- **次（実行順）**: ①次回週次runの成功、または入力が2週以上古くなった際の`coverage-alert`起票を確認する。②次回GSC UI exportで市区町村カテゴリsoft404 5→0と全体件数差を測定し、`COVERAGE-LOOP-01`へ効果観測を引き渡す。
- **停止条件**: 古いW32入力を当週データとして再生成しない。通常ページへGoogle Indexing APIを送らない。デプロイ前のURLを同一観測窓へ混ぜず、Google再クロール前の件数不変だけでeffect/noneにしない。
- **完了条件**: develop→mainのCIがgreenで、上記の本番HTTP・構造化データ・sitemap検証がすべて合格する。失敗時の`coverage-alert`起票と、回復時の自動closeを少なくとも一方はGitHub Actionsで実測し、デプロイ後exportで市区町村カテゴリsoft404が0になる。

### [PRODUCT-SALES-READINESS-01] 横断カタログの全商品を販売準備ゲートまで仕上げる

タグ: [収益化] [種類:制作] [実行:sweep] [起票:2026-09-06] [期日:2026-09-13]

- **status**: in-progress（期日は次回棚卸し期限）
- **owner**: coconala-product-manager / kindle-publisher / note記事担当 / オーナー
- **対象の正典**: `.claude/state/products/catalog-status.json` の `offers`。既存商品と未制作候補、同一商品の販売先variantを分け、個別statusを本文に複製しない。人間向け一覧は `products:report` が生成する `.local/product-portfolio/catalog.html`。
- **再開点（2026-09-06）**: 現行候補は`CURRENT_SALES_REVISIONS`で固定。最終EPUB検査は`kindle-v3-20260906-r4-verification.json`で実本文全章SHAを保持。S2-01だけは当該版の独立review.jsonがあり、他巻へ流用しない。最初の公開前に、固定bytes送信・旧draft再投入・公開直前再照合を認証済み下書きで実測する（コード/モック検査のみでは実UI動作を合格にしない）。新規公開は実機・権利/申告・保全・オーナー承認がそろってから。
- **次（実行順）**: ①Kindle改訂版を全章で独立意味レビューする。書き下ろしだけでなくブログ/ランキング由来の本文・図を含め、未根拠因果・対象年/地域/分母の違いを是正し、内部比率を再計測する。②確定版のEPUB検査・Previewer・全章SHAに結び付いたreview.json・入稿bundle照合後、明示版指定のarchiveで旧版を保持して暗号化保全する。③note14パックの準備原稿に固有の使い方・図例を追加し、独立レビュー・価格/添付/利用条件確認へ進める。無料P13を含めた固定入力はfree-sample-delivery.jsonと納品manifestで照合する。未制作Geo11企画は原典・再現テスト・読者成果を満たすものから制作する。④商品別の残ゲートが解消してから、承認された対象だけを専用公開フローへ渡す。入稿提案JSONを公開済み記録と扱わない。
- **Kindle再接地の具体対象**: S1-01のブログ9章は全章の再編集が必要。`per-capita-income-gap`の本文と図の採用年・数値不一致、`heating-cost-vs-disposable-income`の名目支出/実質所得・世帯範囲の不一致、`communication-cost-burden`の交通通信費/通信費混同、`expenditure-structure-comparison`の性質別/目的別混在と因果主張、`black-tea-income-gap`の購入量/飲用量・相関/説明割合混同を残さない。S1-02も食品の支出・購入数量と調査対象都市を元記事の本文・図まで照合する。`editorial-corrections.ts`の部分校訂だけで当該章全体を合格にしない。他冊にも同種の旧断定があるため全章レビューを省略しない。
- **関連の別owner工程**: Office・本人確認は `COCONALA-PROFILE-OWNER-01`、歴史2指標は `COCONALA-HISTORICAL-SOURCE-01`。公開済みGeo noteの本文・添付再確認は認証済み画面が必要。売上/需要の不明を0扱いしない。
- **再利用本文の追加是正対象**: S1-03高齢単身の分母・通勤流入と移住、04介護必要数と不足数・化学工業と医薬品・相談窓口の時間、05大学収容力と入学定員・保育利用率と希望充足率、06財政指標の控除/平均期間・目的別と性質別、07宿泊施設範囲/人泊と人数・国籍から嗜好の断定、08供給契約と世帯普及率、09産業出荷/利益/用水効率、10火災地震合算/強度率の労働時間分母、11行動者率/稼働率、12有業者/雇用者を元ブログ・図まで直す。fresh訂正だけでは完了しない。
- **ランキング再利用の境界**: S2-01旧版全章レビューでDID可住地分母、死亡率/件数、従属人口指数/就労者、都道府県率の合算、単純平均/全国値、相関からの因果・算術誤りを検出。商品版のランキング章は未レビューAI解説を外して同順位の全県表・決定的集計へ再構成した。公開サイト本文は未変更のため、原典再計算とサイトownerへの是正引渡しが必要。旧版レビューを新版PASSへ流用しない。
- **停止条件**: 生成/形式検査だけで販売準備完了にしない。内部30%をAmazonの合法性・受理保証と説明しない。字数水増し・収録指標の黙った削減をしない。税務・銀行・本人認証・規約同意を代行せず、KDP Select独占を他チャネル展開と両立済みと扱わない。旧公開版・原稿を上書きしない。公開stateを機械品質の結果で書き換えない。
- **完了条件**: 全offerが対象版の実検証・独立レビュー・必要な人間確認を満たすか、採用見送り理由と再開条件が明記される。販売を選んだofferは価格・納品物・権利・公開証跡が一致する。未完了が1件でもあれば「全商品販売可能」と報告しない。

### [COCONALA-PROFILE-OWNER-01] 本人手続き・実経験年数と13パックのOffice実機確認

タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-09-06] [期日:2026-09-13]

- **status**: pending（期日は次回確認期限）
- **owner**: オーナー
- **次**: ココナラ本人確認を本人が実施し、NDAは内容を確認して本人が同意する。HTML・TypeScript・Next.js・Node.jsの実際の経験年数を確認できた場合のみ技術欄へ登録する。既存13パックの修正版はWindows/Mac Office 365で表示・県図形編集・チャート編集・Excel順位再計算を実機確認する。未確認の資格・職歴年月・稼働時間は増やさない。
- **完了条件**: 本人確認・NDAの公開ステータスと、本人が申告した年数の一致を確認する。修正版13パックのOffice実機検証結果（OS・バージョン・表示・編集・再計算）を記録する。実施しない項目は本人の判断を記録し、未確認表示を維持する。
- **停止条件**: 2FA・本人確認書類・規約同意はエージェントが代行しない。経験年数・資格は推測しない。Windows/MacのOffice環境が不足する場合は未検証表示を維持する。インボイス登録を売上改善のために自動実施しない。
- **整備済み範囲の証跡**: `.claude/state/products/coconala-profile-2026-09-06.json`。プロフィール文面・画像・見本の公開更新を再実行しない。

### [COCONALA-HISTORICAL-SOURCE-01] 納品パックの歴史2指標を原典と再照合する

タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-09-06] [期日:2026-09-13]

- **status**: pending（期日は次回確認期限）
- **owner**: estat-researcher（一次資料照合）／coconala-product-manager（採否判断への引渡し）
- **対象・根拠**: `.claude/state/products/coconala-packs-2026-09-06.json` の未検証2指標。P-06/P-12に含まれるstatsDataId `0000010205` の `E0910101`（`kindergarten-education-diffusion-rate`）と `E0910102`（`nursery-education-diffusion-rate`）。
- **次**: 納品版のSOURCES・CSVから対象年と47地域値を固定し、当該年の公式表・定義・分母・単位・地域粒度へ照合する。
- **停止条件**: 原典未取得や不一致時は未検証注記を維持する。推測補完、値・公開内容の変更、再出品は行わず、除外／継続の判断材料を商品担当へ渡す。外部変更は別途承認を得る。
- **完了条件**: 2指標それぞれに原典URL・参照箇所・年・分母・47地域の一致／差異／欠測を既存商品stateへ記録する。確認不能なら探索範囲・不足資料・再開条件・採否判断担当を明示して引き渡し、未確認を確認済みにしない。

### [GIS-COMMERCIAL-LICENSE-BOUNDARY-01] 公開終了・新版切替の完了証跡を照合しカードを回収する

タグ: [コンテンツ品質] [種類:不具合] [実行:機械] [検証:npm run geo:check-data-catalog] [起票:2026-09-05] [期日:2026-09-12]

- **owner**: backlog-loop（完了gateとカード回収のみ）
- **対象**: 外部作業は完了済み。公開・削除を再実行せず、既存証跡を照合してledgerへ記録し、本カードを排他writer経由で削除する。
  公開・削除・退避・検証の証跡と件数の正典は `.claude/state/metrics/geo-release-publication-2026-09-05.json` の `legacyLicense`。
- **次（実行順）**:
  1. `legacyLicense` の公開・削除証跡と `legacySnsVerification.deletionApproval.status=COMPLETED`、`deletionEvidence.pendingIds=[]`、投稿台帳IDs592/632/636/749/796/800の`status=deleted`・`deleted_at`を照合する。catalog gateを通し、ledger証拠付きで本カードを回収する。新しい外部操作・認証・コンテンツ生成は不要。
- **派生生成の停止は解消済み（2026-09-08照合）**: `602b885aa` は生成側でpublisherと同じ判定を使い、非商用KSJ由来9キーのitem出力を除外する。guardを緩める必要はない。ranking-items同期run `34132337368` は全job SUCCESS、公開可能な2,302 itemを反映済み。本カードの残りは上記の公開終了・SNS削除証跡の照合であり、派生生成の再修正ではない。
- **再発防止の確認**: main/develop両経路にguard反映済み。共有索引544件は全行保持、分類修正20件一致。従来から公開終了指定の未公開1行も除外・HTTP410確認。guardを持たない旧checkoutまで保護済みとは扱わない。
- **承認済み範囲**: ユーザー「やって」「進めて」「更新すべきものは更新して　古い資産は削除して」による上記データ置換・終了・exact削除・一括deploy。道の駅3記事は独立レビューPASS。別作業の学力metricは取り込まない。
- **停止条件**: key集合/size/ETagが退避時と変わった対象は削除しない。削除済みraw435・派生59・旧ランキング126件を再実行しない。共有一覧の無関係レコード、別作業のWIP、backupを保持する。「加工済み」だけで商用可と扱わない。別作業のdevelopリリースと競合する変更は行わない。
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

### [AFF-FURUSATO-INVENTORY-01] ふるさと納税ポータルの提携を 2〜3 件足す (furusato 在庫 2 本 / 週 5.4 万 imp)

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node .claude/scripts/ads/audit-affiliate-inventory.ts の furusato 横長 banner ≥ 7] [起票:2026-09-03] [期日:2026-09-30]

- **owner**: uruhayato373 (ASP 提携) / affiliate-manager (登録)
- **追加申請の前提**: 最新の提携状態・観測範囲・証拠は `.claude/state/ads/affiliate-stocktake-latest.json` を参照。
  チョイス `s00000019332001` とさとふる `s00000014771001` は実機で明示未提携を確認したため、
  承認待ちとして扱わない。過去の申請履歴がある両案件は再申請せず、掲載判断は状態の証拠に基づく。
  もしもは2026-09-08にSID638943一致を確認済み。既存返礼品3830・3172は提携中なので再申請不要。
- **現在地 (2026-09-08)**: もしもの新規3件は申請済み。3831ポケットマルシェは審査待ち、
  1863食べチョク・55楽天トラベルは承認済み（状態の正典は `affiliate-catalog.json`）。
  承認済み2件の300×250原稿は `.local/affiliate-harvest/moshimo/2026-09-08/` に取得済み・在庫SSOT未登録。
  これらは通常商品／旅行の案件であり、ふるさと納税ポータル在庫の完了件数には含めない。
- **追加6件の次工程**: オーナー承認後にstats47から各1回申請済み（2026-09-08、重複送信なし）。
  A8の羽田産直 `s00000021701002`・九州お取り寄せ本舗 `s00000020875001` は承認済みなので、
  掲載適合性を確定して素材取得・ローカル登録へ進む。WESTERモール `s00000027147001`・
  北海道ぎょれん `s00000021814001`、afbのふるさとプレミアム `9156`・日本の旅 鉄道の旅 `16537` は
  審査待ちにつき状態照合のみ行い、再申請しない。状態の正典は `.claude/state/ads/{a8,affiliate}-catalog.json`。
  6件とも広告在庫未登録・未掲載。送信/再照合の証拠は `.local/affiliate-ops/` に保持。
- **次**: 返礼品3830・3172の原稿取得と掲載条件確認、上記承認済み素材のローカル登録。
  食品は産地に一致する食文化/特産品ページ、鉄道旅行は国内観光の文脈に限定し、返礼品在庫と混同しない。
  承認後も案件別eligibility・重複・成果条件・申請対象サイトを再照合する。浜名湖産直 `12522` は
  対象商品の紹介文が掲載条件のため保留。条件原文はこのPCの `C:/tmp/stats47-{a8,afb}-offer-details-20260908.json`。
  楽天トラベルは既存の直接提携広告と比較して採用先を決め、二重配信しない。
  もしも発行原稿の独立ピクセル・referrerpolicy・attributionsrc・PR条件を落とさない。
  別セッションを含む専用ブランチ `codex/workspace-updates-20260908` へのcommit・pushは承認済み。develop/main反映・R2更新・デプロイは別途公開承認を得てから行う。
- **なぜ**: #913 で家計調査 (ランキング 28,867 + ブログ 12,366 imp/週) と農業・地方財政が furusato に
  集まる。一方、全国対応の横長バナーは **2 本** (ふるさと本舗・au PAY) だけである。イオン九州3枠は
  地域・購買意図の不一致と成果0円の実績から2026-09-15に全配信を停止した。需要と在庫が最も逆転している軸。
- **候補**: さとふる / ふるなび / 楽天ふるさと納税 / ANA のふるさと納税 (A8・もしも・afb のどこで
  提携できるかは `/affiliate-operate` の走査で確認。ブランド適合は人の判断)。
- **手順**: ユーザーが ASP で提携申請 → 承認後 `/register-affiliate-banner register` で 300x250
  を 1 案件 1 エントリ登録 (vertical=furusato、priority は確定 EPC バンド) → develop push で R2 反映。
- **完了条件**: furusato の横長 300x250 が 7 本以上、かつ priority 上位 3 が全国対応ポータル。
- **禁止**: 楽天ふるさと納税の代わりに楽天市場の商品カードで代用しない (別チャネル)。

### [AFF-STOCKTAKE-RECONCILE-01] 提携棚卸しの不明案件と既存在庫の不一致を再照合する

タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-09-08] [期日:2026-09-15]

- **owner**: affiliate-operator（状態照合）/ affiliate-manager（在庫判断・ローカル修正）/ オーナー（手動ログイン）
- **証拠・対象の正典**: `.claude/state/ads/affiliate-stocktake-latest.json`。詳細な件数・状態・素材一覧は本カードへ複製しない。
- **次（実行順）**: ①帰属ガードを確認してからA8 `26822001`、afb `15671`・`14033`・`16511`・`15831` の不明状態を再照合する。②楽天は正しい広告リンク作成用IDかをオーナーに確認し、stats47の登録と既存リンクの口座一致を確認する。登録変更は別承認とする。未提携が確定した3案件は `affiliate-delivery-policy.ts` の共通停止へ反映済み、重複はprogramRef/クリック先で除外済み。これらの公開前確認は `AFF-PLACEMENT-RELEASE-01` へ分離する。
- **停止条件**: サイト・口座帰属を確定できなければ停止し、不在を未提携や終了と推測しない。新規・重複申請、認証回避、成果リンクへの確認クリック、本番変更・deploy・R2 pushは禁止。既存在庫を未確認のまま削除しない。
- **完了条件**: 各対象の状態・在庫判断を実機証拠へ結び付け、必要なローカル修正と対象の検証が完了する。不明が残る間はカードを維持し、人間作業またはガード復旧による再開条件を明記する。

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

タグ: [種類:改善] [実行:対話] [起票:2026-08-13]

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

### [ESTAT-CATALOG-01] e-Statメタデータ完全カタログの初回バックフィルと旧発見スクリプトの退役

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --import tsx .claude/scripts/estat/catalog.mjs search 人口] [起票:2026-09-16]

- **owner**: estat-researcher (catalog検索の消費側配線) / r2-publisher (初回backfillのdispatch)
- 2026-09-16、`.claude/scripts/estat/catalog.mjs` (run/pull/search) + `estat-catalog-monthly.yml`
  (月次cron・専用ブランチpushトリガー) を実装済み。R2 `estat-catalog/` へ全国/都道府県/市区町村の
  statsDataId一覧とgetMetaInfo要約 (年次・エリア種別・47県判定) を月次で保有する。
  設計: `docs/02_実装計画/48_e-Statカタログ実装仕様.md`。単体テスト19件 (`npm run estat:catalog:test`) PASS。
  **未実施**: 実e-Stat APIに対する初回runとR2 push (APP_IDはCI専任のためローカル未検証)。
- **次 (実行順)**:
  1. `estat-catalog-run` ブランチへpushしCIで初回run (`--dry-run`でL1件数を先に確認 → 全国の実件数を見て
     `meta-scope`に1を足すか判断)
  2. 時間予算150分では1回で終わらない (県+市区町村≈12,000表)。pendingが0になるまで3〜4回push
  3. `curl https://storage.stats47.jp/estat-catalog/manifest.json` で反映を実測
  4. `.claude/skills/estat/{search-estat,inspect-estat-meta}/SKILL.md` と
     `.claude/agents/{estat-researcher,theme-researcher,survey-curator}.md` にcatalog検索を先に引く1行を追記
  5. 上記が安定稼働したら旧発見スクリプト3系統を退役: `discover-prefecture-candidates.mjs` +
     `discover-estat-candidates.yml` + git内 `prefecture-candidates.json` (3.1MB・LARGE_FILE例外) /
     `estat-fetch-meta.yml` / `estat-city-discovery.json` (いずれもcatalogの`index/tables/`から導出可能)
  6. `ssds-candidates.json`をcatalog派生に置換、find-metricsに未登録候補の索引を追加
- **完了条件**: manifestの`collectAreas.{2,3}.metaPending`が0、consumer 3件の配線完了、旧スクリプト退役
  (旧スクリプトの退役は新カタログが最低1ヶ月安定稼働してから)
- **禁止**: 全国(collectArea=1)の一律`--meta-scope 1`実行 (推定20万表超・時間予算超過のリスク。
  必ず実測件数を見てから判断)

### [THEME-SELECTION-BACKFILL-01] ThemeCatalogの選定根拠(selection)未記入552件を夜間の無人バッチで白書・公式統計から裏付ける

タグ: [エージェント・SSOT] [種類:改善] [実行:windows] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-16]

- **owner**: theme-designer (catalog TS の書き手) / theme-researcher (調査) / validator は data-configs scripts
- **背景 (2026-09-16 実測)**: `validate:catalog` の `no-adoption-criteria` warn は 561 件。aging-society の
  9 指標を theme-researcher(sonnet) → 呼び元検証 → 書き込みで処理し 552 件へ。1 テーマ 19 分
  (agent 9 分・41 tool call・28.5 万 token / 検証+書き込み+gate 10 分)。受け入れ検証で agent が
  社会生活統計指標コードを 7 件中 2 件誤記 (#A06603/04 ≠ config の #A06601/02) したのを捕捉。
  NotebookLM CLI はこの PC では SSL 証明書エラーで不可、白書は WebFetch で足りた。
  55 テーマ×約 15 分 = 約 14 時間なので 1 晩では終わらず、5 時間利用枠で止まる前提で 2〜3 晩。
- **次 (実行順)**:
  1. validator (`packages/data-configs/scripts/validate-theme-catalog.ts`) へ 3 gate を error で追加:
     (a) `selection.rationale`/`proposedBy` 中の `#[A-Z]\d{5,}` コードが metric config の `cdCat01` と一致し、
     さらに e-Stat カタログ (`node --import tsx .claude/scripts/estat/catalog.mjs search --id <statsDataId>`、
     初回 `pull`・社内PCは proxy preload) で解決した分類コード名が rationale の指標名と矛盾しない
     (**前提**: `ESTAT-CATALOG-01` の run で `index/classes/` が push 済みであること。2026-09-16 07:35 時点は
     2 回目 run が in_progress で分類行 0 件のため、この半分は run 完了後に有効化する)
     (b) `sourceUrl` が HTTP 到達可能 (`.claude/scripts/audit/theme-chart-live-audit.mjs` の
     `resolveDispatcher` でプロキシ経由) (c) 定型フレーズ (「詳細索引に保持し」「実値として比較する」等) を
     rationale に含まない。加えて `no-adoption-criteria` 件数の ratchet (baseline 552・減少専用) を
     `pr-quality-check` / `develop-quality-gate` に配線
  2. skill `/backfill-theme-selection <theme>`: theme-researcher (Task Capsule 固定・table-only) →
     theme-designer が `selection` だけを書く。**role は変更しない** (推奨は夜間レポートへ出し人が判断)
  3. 夜間ドライバ `.claude/scripts/themes/run-selection-backfill.sh` (`run-claude-batch.sh` の型):
     専用 worktree・1 テーマ 1 attempt・gate 不合格は skip 記録・並列 2 まで・`wait_for_capacity`・
     **夜 1 コミット** (このPCは pre-commit 12 分/回)・レポートを
     `.claude/skills/theme/manage-theme-portfolio/reference/audits/YYYY-MM-DD-selection-backfill.md`
  4. 翌朝: レポートの role 推奨と skip を人が処理、ratchet の数字を weekly review が読む
- **完了条件**: `no-adoption-criteria` = 0、role 推奨リストの人間処理完了、ratchet が CI に配線済み
- **停止条件**: 1 晩の gate 不合格率 > 30% (prompt か gate の問題なので続行しない)、枠エラー 3 連続
- **禁止**: 夜間バッチによる role 変更・rejectedCandidates への追加・`git commit --no-verify`・
  gate 未通過の selection の書き込み

### [THEME-CHART-TEMPORAL-MISMATCH-01] line-chartが単年設定の13指標を再取り込みして年範囲を拡張する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-09-15]

- **owner**: data-ingester (年範囲拡張・再取り込み。判断待ちなし、以下は全件データ存在確認済み)
- `npm run validate:catalog` の `[chart-temporal-fit]` warn (2026-09-15新設) が機械的に検出。
  対象10テーマ13指標の line-chart が、`years: {from,to}` が単年 (from===to) の指標を参照しており
  推移を描けない状態だった (componentKeyに「trend」を含むものも複数: `theme-health-expense-trend`
  `railway-passenger-trend-jr` `roads-length-trend` 等)。
- **2026-09-15 e-Stat実データで確認済み (getStatsData実測、値がnullでない年のみ集計)**:
  全13指標とも**e-Statに複数年の実データが存在する**(config側の年範囲設定が不足していただけ)。
  チャート型変更は不要、年範囲拡張が正解。

  | metric key | statsDataId | config年数 | e-Stat実在年数 | 実在年 |
  |---|---|---:|---:|---|
  | national-medical-expense-per-person | 0000010209 | 1 | 14 | 1999-2022 (隔年等) |
  | turnover-rate | 0000010206 | 1 | 11 | 1977-2022 (5年おき) |
  | job-change-rate | 0000010206 | 1 | 11 | 1977-2022 (5年おき) |
  | gender-wage-gap | 0003426933 | 1 | 2 | 2021-2022 |
  | single-person-household-ratio | 0000010201 | 1 | 9 | 1980-2020 (5年おき) |
  | jr-passenger-transport | 0000010103 | 1 | 19 | 2005-2023 |
  | consumer-price-difference-index-housing | 0000010212 | 1 | 12 | 2013-2024 |
  | consumer-price-difference-index-food | 0000010212 | 1 | 12 | 2013-2024 |
  | actual-income-worker-households-per-month | 0000010212 | 1 | 50 | 1975-2024 |
  | road-total-length-with-expressway | 0000010108 | 1 | 19 | 2005-2023 |
  | road-expressway-length | 0000010108 | 1 | 19 | 2005-2023 |
  | building-fire-count-per-100-thousand-people | 0000010211 | 1 | 49 | 1975-2023 |
  | air-passenger-transport | 0000010103 | 1 | 49 | 1975-2023 |

- **次 (実行順)**: ①各 `packages/data-configs/src/metrics/<key>.ts` の `years` を上表の実在年範囲へ
  拡張 (5年おき等の指標は `{years:[...]}` 形式、連続年は `{from,to}`) ②`validate:years`/`validate:config`
  ③`page-data-batch --metric <key>` で再取り込み ④`npm run validate:catalog` で
  `chart-temporal-fit` warn 解消を確認。gender-wage-gap は2年のみのため折れ線でなく2点比較の
  表示 (mixed-chart等) が妥当か theme-designer が判断してもよい。
- **完了条件**: 対象13件で `chart-temporal-fit` warn が解消 (ラチェットは新規追加時の再発防止)。
- **検証**: `npx tsx packages/data-configs/scripts/validate-theme-catalog.ts`

### [LOCAL-RESOURCE-BUDGET-01] 資料の復元経路と再起動後のメモリ削減効果を確認する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-10]

- **owner**: devops-runner（計測・保持確認）／オーナー（Codex再起動）
- **次（実行順）**: ①次回Codex再起動後に local:health を実行し、重複MCP設定変更の適用とNode数・専用メモリを同じ代表作業で比較する。②日本国勢図会のprivate Drive保管6分割bundleをWindowsへ復元し、既存source-vaultのSHA-256検証と再展開検証を通してから books/ を回収する。③残る一時GISの原本ZIP・固有スクリプトは取得URL・成果保存先・復元手順がそろうものから回収する。
- **再開材料**: 端末内 .local/resource-health/ の計測・掃除・GIS復元台帳、既存 source-inventory/japan-zue/2025-26/source-bundle-manifest.json。Driveの日本国勢図会/2025・2026年版にmanifestと6分割ファイルの存在・非共有・容量を確認し、ローカル1746ファイルのhash一致と全profileのcoverage 100%は検証済み。Drive connectorのバイナリ返却先はsediment URIで、このWindows端末への復元経路は未確立。
- **停止条件**: 未検証のDrive原本・GIS・WIP・認証profileを削除しない。既存セッションの一括終了やGit履歴リセットで軽量化しない。Node数・メモリはツール稼働を含む瞬間値であり、条件を合わせず削減効果と断定しない。
- **完了条件**: 再起動後の同条件計測を保存し、参考文献のDrive復元検証と source-vault:check が通る。GISは回収した各対象から保全先と再生成手順が辿れ、保全できないものには保持理由を残す。導入済み予算・定期点検方式は local-environment.md と自動化インベントリを参照する。


### [RULES-DEMOTE-01] 常時読み込みから外した rule の移設と reference 化

タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [検証:npm run docs:check] [起票:2026-09-08]

- **背景**: 2026-09-08 に 41 rule を `paths:` 条件付き読み込みへ切り替えた (常時 10,461 行 → 584 行、DG070-072 で固定)。本文は不変で、内容の置き場が rule として不適切なものが 3 つ残る。
- **次**: `blog-remediation-loop.md` → `.claude/skills/blog/brushup-blog/reference/`、`data-sqlite-ssot.md` → `packages/database/README.md` (冒頭で doc 12 が優先と宣言済み)、`evidence-based-judgment.md` の「各種 API での最低検証コマンド」節 (~110 行) → 対応 skill の reference。参照元 (agents / skills / rules) を rg で全置換し、`check-agent-skill-consistency.cjs` を通す。
- **併記判断**: paths rule は subagent 自身の Read でしか載らない。owner agent が担当 rule を明示 Read しているかを同 checker で検査するかを決める。
- **完了条件**: 3 ファイルの移設先が実在し、CLAUDE.md の表と DG072 が更新後の集合で green。

### [COCONALA-MEASUREMENT-CONTRACT-01] 14商品の公開後計測を整え改善台帳へ引き渡す

タグ: [インフラ・計測] [種類:改善] [実行:別環境] [起票:2026-09-06] [期日:2026-09-13]

- **status**: pending（期日は計測契約整備の次回確認期限）
- **owner**: coconala-operator（取得可否確認）／improvement-triage（効果観測の排他writer）
- **次**: 既存13定型商品＋Geo1商品の閲覧・問い合わせ・購入について、本人アカウントを照合した管理画面で取得可否、商品別／全体別、期間・集計単位をread-onlyで確認する。公開日時・baseline・観測期間・母数・判定条件・観測期限後の次手を定義する。
- **停止条件**: 公開前baseline不明はunknownとし、公開後の値を公開前の代用にしない。未取得を0とせず、母数0のCVRは未算出とする。認証・権限不足では停止し、売上効果を断定しない。商品変更・自動監視の開始は行わない。
- **完了条件**: 取得根拠・日時付きbaseline/unknownと計測契約を既存商品stateへ保存し、improvement-triageが別IDのeffect/pendingへ引き継ぐ。引渡し証拠をbacklog-loopへ渡し、以後の観測待ちを本カードに重複保持しない。

### [GEO-SERVICE-PILOT-01] Geo納品見本の販売条件を確定し1商品だけ出品判断する
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-06]

- **owner**: オーナー（販売条件・承認）/ coconala-product-manager（再生成）/ coconala-operator（承認後の出品）
- **対象**: `packages/product-factory/src/channels/geo/service-offer.ts`。生成・見本・検証状態は `.claude/state/products/geo-service-readiness-2026-09-06.json` を参照する。
- **次**: 外部公開と匿名閲覧の検証結果は上記stateのpublicationを参照。出品の再実行は不要。商品生成コード・本人照合修正・出品台帳・`.claude/state/products/coconala-packs-2026-09-06.json`を含むcommitのdevelop反映をGitで照合し、ledger gateでカードを閉じる。Office実機確認・本人手続きはCOCONALA-PROFILE-OWNER-01へ分離済み。
- **停止条件**: 価格・公開未承認、公開manifestと不一致、空間結合・保存則FAILでは出品しない。需要未確認の公開はオーナーの明示指示を記録し、購入実績があるとは扱わない。note自動取得403を非公開・閲覧ゼロと誤判定しない。任意商圏・住所検索・鑑定・安全保証へ範囲を拡大しない。
- **完了条件**: 承認記録、納品ZIPのSHA、サービスURL・販売条件・実際の納品物の一致を確認するか、オーナーが出品見送りを決定する。カード削除はbacklog-loopのledger gate経由。

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
- **現在地**: `codex/affiliate-optimization` で実際のTS resolverを共有し、R2の調査メタを入力化。
  ローカル回帰テストと公開R2を読むdry-runを検証し、取り込み後の週次出力確認を残す。
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
- **現在地 (2026-09-13)**: 後続の明示指示に基づき、全セッションの関連変更をPR963で公開した。app34739098468成功、計測定義切替は2026-09-13T05:02:32Z。楽天run34726845212で510検索を新規取得し、有品373・正常空137・失敗0。公開先510canonical GETの内容とepoch一致を確認した。固定28日baselineは `.claude/state/metrics/affiliate-placement-baseline-2026-09-08.json` を維持する。
- **公開後の次**: 48時間後に `rakuten-sidebar` のpage/device別計測を確認し、未取得なら
  商品在庫・DOM表示・GA4送信を切り分ける。14日以上の非重複窓で表示/PV・商品クリックを比較し、
  楽天成果レポート未取得の間は収益増と判定しない。直前のPR945の影響と混在するため因果効果は断定しない。
- **未完了**: 「楽天市場で探す」は通常検索URLのまま、affiliate_clickから除外済み。
  収益化するには楽天公式リンク作成で発行した検索リンクを取得し、生成URLを改変せず採用する。
- **なぜ**: 「納豆消費量ランキング」の読者に最も合うのは品目一致の楽天商品カードだが、現在は
  右レールの末尾 (`RakutenItemsCard`) にあり、GA4 では `blog-sidebar` / `ranking-sidebar` に
  混ざって計測されるため効果を分離できない。
- **次**: 9/15 14:02:32 JST以降に48時間の計装確認、9/27に14日経過後の比較可否を確認する。現行GA4のdays指定は当日を含むinclusive窓のため、明示日付の確定した非重複期間が取得できるまでは効果を判定しない。
- **停止条件**: 取得失敗・他県混入・PR/計測欠落があれば担当へ修正を引き渡す。収益化されていない通常検索リンクを成果クリックに含めない。
- **完了条件**: GA4 の `link_position=rakuten-sidebar` が家計調査ページで取れ、CTR が
  native 枠と比較できる。

### [PREFECTURE-DEVIATION-S5-01] 『47都道府県の偏差値』の一次資料候補25件をmetric/theme/ranking候補へ展開する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run source-vault:test] [起票:2026-09-15]

- **owner**: 台帳は`open-data-curator`、metricKey実在検証は`estat-researcher`、投入は`data-ingester`。
- **現状証拠**: profile `prefecture-deviation` (Drive `参考文献/47都道府県の偏差値/2018年版`、6分冊PDF・103ページ)を
  全ページOCR (jpn+eng, rotate 90, psm 4)。一律`rights-hold`103件だった旧判定 (書誌確定前の暫定placeholder) を撤去し、
  `packages/data-configs/src/evidence-inventory/prefecture-deviation/analyses.json` に章単位の分析・論点53件を authored
  (kakei-marketingと同じ形式)。`.claude/state/source-inventory/prefecture-deviation/2018/`はcoverage 100%
  (`combined-analysis` 25 / `primary-source-unavailable` 20 / `context-only` 5 / `not-applicable` 3)。
  書籍の偏差値・数値そのものは転記せず、章の着想だけを一次資料 (総務省家計調査・人口動態調査・国勢調査・
  住宅土地統計調査・文科省学力調査等) で独立再検証可能かを判定した。
- **次**: `combined-analysis` 25件を1件ずつ、①既存metric/rankingとの重複確認、②未登録なら`estat-researcher`が
  statsDataId実在検証、③`data-ingester`が投入、の順で管理画面`/content/references`にunit接続が出るまで進める。
  `context-only`5件 (自動車検査登録情報協会・全国軽自動車協会連合会等の業界団体統計) は既存記事の分析文脈補強にのみ使う。
- **停止条件**: 書籍の偏差値・数値・図表・本文を公開物へ直接流さない。一次資料で再取得できない項目は
  `primary-source-unavailable`のまま留める (`週刊朝日`独自集計の東大・京大合格者数ランキング等、20件は既に該当)。
  R2 write・deploy・SNS公開は別途承認。
- **完了条件**: `combined-analysis`25件全てがreuse-existing-metric/new-metricいずれかで既存SSOTへ接続され、
  管理画面`/content/references`で実在証跡が確認できる。

### [REFERENCE-CONTENT-DRAFTS-01] 参考文献由来のテーマ企画と横断ブログ下書きを制作する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run test --workspace=apps/admin -- reference-expansion-plans] [起票:2026-08-30]

- **owner**: テーマ採択は`theme-designer`、ブログ本文は`article-writer`、管理画面の読み取り契約は`admin-console`。
- **前提**: `japan-zue`の解決済みinventoryは論点発見だけに使う。記事・テーマへ載せる定義、年度、単位、値は、各metricの一次資料とR2観測値で再検証する。原文、OCR、書籍値、内部cropは公開しない。
- **テーマ企画**: 参考文献で`theme`対象になり、既存ThemeCatalogまたはIndicatorSetへ未統合の制作単位だけを保持する。`draft`は採択・チャート設計待ち、`blocked`はactiveな公開metricが無いため停止中。

<!-- reference-theme-plans:start -->
| metricKey | title | targetTheme | status | hypothesis |
| --- | --- | --- | --- | --- |
| projected-population-2020 | 将来推計人口 | population-dynamics | blocked | 将来人口と現在の人口動態を同じ時間軸で比較する |
| gross-prefectural-product-expenditure-nominal-h27 | 県内総生産 | local-economy | blocked | 地域経済の規模と産業・雇用構造を同じ画面で比較する |
| students-requiring-japanese-instruction | 日本語指導が必要な児童生徒数 | education-culture | blocked | 国籍と支援ニーズを分け、人数・児童生徒比・学校側の受入体制を重ねて読む |
| general-households | 一般世帯数 | population-dynamics | draft | [却下 2026-09-14] 人口動態=増減メカニズムと無関係、世帯構造は別テーマ向き |
| area-ratio-of-total | 面積割合 | climate | draft | [却下 2026-09-14] 面積割合は気候(気象)と直接関係せず地理指標 |
| number-of-establishments-manufacturing | 製造業事業所数 | manufacturing | draft | [却下 2026-09-14] 登録済みmanufacturing-establishmentsと同一statsDataId重複、年度が古い |
| average-life-expectancy-male | 男性の平均余命 | healthcare | draft | [却下 2026-09-14] subtitle年齢欠落・値63年が0歳時点と矛盾、metric要修正が先 |
<!-- reference-theme-plans:end -->

- **2026-09-14 テーマ企画14件を判定 (theme-designer)**: 採択11件をcontext roleでThemeCatalogへ追加 (`sex-ratio-total`→population-dynamics、`day-time-population`→labor-mobility、`electricity-generation-capacity`/`agricultural-employment-population`→local-economy、`avg-propensity-to-consume-worker-households`→real-income、`municipality-count`/`households-on-public-assistance`→local-finance、`infant-deaths`/`infant-mortality-rate-per-1000-births`/`average-life-expectancy-female-20`/`average-life-expectancy-female-65`→healthcare)。却下3件: `general-households`(人口動態=増減メカニズムと無関係、世帯構造テーマ向き)、`area-ratio-of-total`(気候テーマと面積は無関係、landweatherカテゴリのまま)、`number-of-establishments-manufacturing`(登録済み`manufacturing-establishments`と同一statsDataId・年度が古い重複)、`average-life-expectancy-male`(subtitleに年齢欠落・値63年が0歳時点と矛盾し要metric修正)。`generate:catalog`→`validate:catalog`(0 error/0 warn)→`tsc --noEmit -p apps/web/tsconfig.json`(0 error)まで確認済み。
- **ブログ下書き**: `docs/21_ブログ記事原稿/{household-structure-daytime-population-gap,agriculture-output-employment-productivity-gap,electricity-generation-manufacturing-establishments-gap,household-spending-debt-propensity-gap}/article.md`。4本とも`published:false`で、一次資料・R2接地前の数値主張を置かない。`general-households`/`number-of-establishments-manufacturing`は却下済みのため、該当2本のペア構成をarticle-writerが着手前に見直す。
- **次**: blocked 3件はactiveな公開metricが出た時点で再判定する。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
- **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
- **完了条件**: blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17]

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

タグ: [種類:不具合] [実行:対話] [起票:2026-08-03]

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

### [THEME-EXPANSION-IMPLEMENT-01] 地震曝露の住宅部分に使える全国空間原典を確保する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-09]

- **対象**: 候補105の住宅部分。現在の採用範囲と未充足は [全体実装記録](../state/metrics/themes/2026-09-10-all-expansion.json) の `scopeCounts` / `validation.next253Tsunami29.scopeAudit`、採否は [候補カタログ](../skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json) のdecisionを正典とする。
- **owner**: theme-designer（採用判断）／open-data-curator（原典探索）／data-ingester・gis-pipeline-runner（取得・空間集計）。
- **次・実行順**: ①住宅を直接数える全国空間原典を公式提供元で確認し、版・単位・住宅の定義・地域カバレッジ・利用条件を記録する。②利用可能ならJ-SHISとの空間対応、県別途中artifact、保存則を実装・検証する。③採用指標と章へ接続し、生成物・実表示・本番反映を同じ対象で確認する。
- **停止条件**: 全国住宅の原典が確保できない間は未充足を維持する。人口・一般世帯・建物棟数を住宅戸数の代用にしない。PLATEAU等の部分カバレッジを全国値にしない。原典未発見を全国に存在しないという断定にしない。
- **完了条件**: 住宅部分を原典から再現でき、定義・時点・空間集計・配信値の整合を検証し、候補105のdecisionと全体実装記録へ証拠を反映する。公開後の計測と品質観測は `THEME-EXPANSION-EFFECT-01` へ接続する。

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [種類:改善] [実行:対話] [起票:2026-07-18]

- **owner**: Claude Code
- **2026-08-27 監査**: 最新note metricsの上位24記事はcatalogのnote IDと一致0件で、対象アカウントの
  series別流入・clickを判定できない。誤ったseriesをpilotに選ばず、stats47 note側の計測が揃うまで待つ。
- **trigger**: note既存記事の流入・クリックを確認し、上位1シリーズだけをpilotできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。

### [NOTE-MAGAZINE-REORG-01] note既存投稿のマガジン再編成 + 新規投稿の増産

タグ: [種類:制作] [実行:windows] [起票:2026-08-03]

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

タグ: [種類:不具合] [実行:対話] [起票:2026-08-01]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [種類:制作] [実行:ユーザー] [起票:2026-07-10]

- **owner**: Claude Code
- **trigger**: e-Statで2025年年報の公表を確認できること。
- **次**: 既存697 metricの年次更新を先に行い、需要確認済みの中分類だけを第2弾へ追加する。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。
- **正典**: `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 13 件

タグ: [種類:不具合] [実行:ユーザー] [起票:2026-07-30]

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

タグ: [種類:不具合] [実行:対話] [起票:2026-08-12]

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

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [期日:2026-09-20]

- **owner**: gis-pipeline-runner（生成・再開）／r2-publisher（公開契約）／devops-runner（CI）
- **状態・着手時期**: 実装未着手。今回の公開完了後、次回Geo原典更新前に計測・設計から着手する。期日は初回設計の確認期限。
- **実測根拠**: [Geo run 34726806521](https://github.com/uruhayato373/stats47/actions/runs/34726806521) の2026-09-13 UTCの準備は00:01:59〜00:44:28（42分29秒）、dry-runは00:44:28〜01:21:35（37分07秒）。apply/readbackは01:21:35〜04:03:28（2時間41分53秒）、runはsuccess。17,717件・stored 2,199,375,814 bytesを公開し全件のS3/公開query照合に成功。3フェーズ合計4時間01分29秒（job準備等を除く）。[アプリCI run 34731862870](https://github.com/uruhayato373/stats47/actions/runs/34731862870) は `8f66cb638` で01:58:36〜02:08:11（9分35秒）・success。再取得は `gh run view 34726806521 --repo uruhayato373/stats47 --json jobs`。
- **コード根拠・未計測部分**: `apps/web/scripts/geo-source-publish-core.ts` の `buildExactPlan`、dry-run preflight＋共有publisher、apply preflight＋共有publisher＋PUT後確認は、変更対象1件につき計6回のHEADを行う構造。共有処理は `packages/r2-storage/src/scripts/push-exact-r2-assets-core.ts`。`mapGeoSourceBatch` は4件固定バッチの全終了待ちで、`.github/workflows/geo-source-publish.yml` は準備・dry-runもglobal `r2-write` lock内に置き、楽天公開の待ち要因になる。対象コードのdevelop pushは全件再生成・公開を発火する。実API数・HEADや解凍の時間寄与・短縮率は未計測。
- **次（実行順）**: ①phase別の壁時間、件数、API種類別回数、最大同時数、転送bytes、lock待ちを記録し、今回runの終了値を比較元に固定する。②最大4件のworker poolで空き枠を継続利用し、失敗検出後の新規dispatch停止とin-flight完了待ちをテストする。③候補の重複解凍・HEADの整理を計測結果から選ぶ。④原典SHA＋生成コード＋schemaに結び付いた検証済み生成物の再利用・再開を設計し、失効条件と失効時の再生成を固定する。⑤コードpushは検証、公開は明示scopeのCIへ分離する。準備と書込lockの分離は、巨大artifactの保存・転送・復元時間と費用を含めて採否を決める。
- **保持する契約・停止条件**: 全scope検査を最初のPUTより前に完了し、ETag条件PUT、gzipとdecoded両方のSHA、S3とcache-bust付き公開HTTPの全件照合、catalog-lastを保持する。purge後のcanonical検証は索引51件＋50ページの代表GISを予定範囲として区別し、実行時の対象キー・件数を記録する。全GISのcanonical GET完了とは扱わない。変更分への同強度検証と定期全件監査は別契約として設計・検証し、後者を前者の代用にしない。scope漏れ、再利用の失効判定不能、異常後の新規dispatch、検証強度低下、転送込みの時間・費用悪化があれば採用を止める。現在のCIをcancel/rerunせず、今回リリースへの実装追加をしない。短縮率の予測を成果にしない。
- **完了条件**: 対象テストで並行上限4・失敗後停止・ETag変更・gzip/decoded不一致・scope漏れ・生成物失効・catalog順序の異常を拒否し、同一scope/bytesの比較可能なCIで全フェーズと待ち時間・API数・転送量の変更前後を残す。変更なし／一部変更／再開／全件監査の各経路で、必要な公開対象と同強度検証の取り落しがない。未採用案は実測理由を残し、実測短縮が確認できるまで高速化完了としない。
- **既存カードとの境界**: `SYNC-SNAPSHOTS-MANIFEST-CARRY-01` は一般snapshotのmanifest持ち越し、`BUILD-PERF-PHASE34` はアプリCI cache・型検査の重複が対象。本カードはGeo原典生成からexact公開・再開・書込lockまでを扱う。

### [SYNC-SNAPSHOTS-MANIFEST-CARRY-01] sync-snapshots の「差分 push」が CI では毎回フル push になる

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17]

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

タグ: [コンテンツ品質] [種類:制作] [実行:対話]

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出

タグ: [コンテンツ品質] [種類:制作] [実行:対話]

- **owner**: open-data-curator
- **正典**: `packages/data-configs/src/prefecture-statistics-catalog/README.md`
- **次**: 各県ポータルを1巡し、複数県で反復する指標だけを、定義、単位、粒度、年次、一次出典付きで上の表へ追加する。
- **完了条件**: 47県を確認し、既存metricとの非重複と全国比較可能性を検証する。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [種類:制作] [実行:対話] [起票:2026-05-19]

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

### [AFF-PRODUCT-KEYWORD-GAP-01] 家計調査系19指標が品目辞書から漏れ、楽天商品カードが出ない (1文字品目・「〜料」接尾辞)

タグ: [収益化] [種類:改善] [実行:sweep] [検証:npm run test --workspace apps/web -- src/features/ads] [起票:2026-09-16] [期日:2026-10-31]

- **owner**: affiliate-manager (辞書導出規則) / ranking-ui-manager (表示確認)
- 2026-09-16 実測 (家計調査系 706 metric の title を `detectProductKeyword` に通した): 検出あり 600 / 検出なし 106。
  106 のうち 87 はサービス・料金・費目合計で商品カードにならないのが正しいが、**19 件は商品**なのに
  `apps/web/src/features/ads/constants/product-keyword-derivation.ts` の 2 規則で落ちている:
  - `:72` `term.length < 2` → 1 文字品目 6 種 × (支出額+消費量) = 12 件: 桃・梨・柿・米・傘・酢
  - `:51` `/[代料費賃税]$/` (費目接尾辞) → 「〜料」で終わる商品 7 件: 炭酸飲料・乳飲料・茶飲料・乳酸菌飲料・風味調味料・他の調味料・修繕材料
  影響: これらのランキングでは右レール (デスクトップ) と本文中段 (モバイル、`AFF-RANKING-RAKUTEN-NATIVE-01` 以降) の
  商品軸カードが出ず、地域軸 (1 位県の返礼品) に代替される。
- **次**: ①「飲料・調味料・材料」を費目扱いから除く例外を足す (接尾辞判定を stem 全体で見る)。
  ②1 文字品目は blog タイトルで誤検出が確実 (「山梨」→梨、「米国」→米) なので無条件 allowlist にしない。
  ranking の `sourceText` は正準 title (`{品目}消費支出額|消費量`) なので、**title 全体がその形に一致する場合だけ**
  1 文字品目を許す (`detectProductKeyword` に完全形一致の分岐を足すか、呼び出し側で正準 title を別引数で渡す)。
  ③`generate-runtime-metric-summaries.ts` を再実行して `RUNTIME_PRODUCT_KEYWORDS` を再生成 (現 465 語)。
  ④vitest に「山梨県を含む blog タイトルで 梨 を検出しない」「桃消費支出額 では 桃 を検出する」の両方向を足す。
- **停止条件**: blog 側 (`resolveBlogRakutenPlacement` / `blog-rakuten-content`) の既存テストが 1 件でも赤になる変更は入れない。
- **完了条件**: 上記 19 metric の `/ranking/<key>` で商品カードが描画され (ローカル実測)、`src/features/ads` のテストと blog の誤検出テストが緑。

### [METRIC-SUBTITLE-KAKEI-NOTE-01] 家計調査系 706 metric の subtitle が調査方法の定型文で、一覧・h1 直下に冗長表示される

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-09-16]

- **owner**: data-ingester (config 一括是正) / ranking-ui-manager (表示面の確認)
- 実測 (2026-09-16): `packages/data-configs/src/metrics/` の `kind: "kakei-chousa"` 706 件すべてが
  `subtitle: "都道府県庁所在市の二人以上世帯の年間{品目}消費支出額"` の形。`metric-config-standards.md` の役割表では
  subtitle は「同名指標を区別する短い定義補足」で、調査方法は `note` / `description` の責務。lint `subtitle-redundant`
  (`validate-metric-config.ts:250`) は「subtitle が title を包含」を真の識別子 (乳用牛(めす)) のために許容しているので、この定型文はすり抜ける。
- 表示への影響: ranking 右レールと関連ランキンググリッドは 2026-09-16 に UI 側で除外済み
  (`select-sidebar-items.ts` の `getSidebarDetail`: subtitle が title を含む場合は識別に使えないとして非表示)。**残っている面**:
  ranking 詳細の h1 直下 (`classifyRankingSubtitle` 経由)、category / survey / municipalities 一覧の `${title}（${subtitle}）` 連結
  (`app/category/[categoryKey]/page.tsx:184`、`app/survey/[surveyKey]/page.tsx:211`、`app/municipalities/**`) で
  「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」の重複が出る。
- **次**: ①決定的スクリプトで 706 件の subtitle 定型文を `note` (「都道府県庁所在市の二人以上世帯・年間値」等の短文 1 種) へ移し、
  subtitle は null にする (同名衝突がある metric だけ短い識別子を残す)。②`validate:config` / `validate:years` を通す。
  ③`sync-snapshots` の `ranking-items` で item.json を再生成 (デプロイが先: `branch-workflow.md`「R2 反映は main のコードで動く」)。
  ④UI 側の暫定ヒューリスティック (`getSidebarDetail` の包含判定・`classifyRankingSubtitle`) はデータ側が揃ったあとに縮退を検討する。
- **停止条件**: 一括書き換えで `subtitle-redundant` 以外の lint error が増えたら止める。R2 反映とデプロイはオーナー承認後。
- **完了条件**: 家計調査系 config の subtitle 行に定型文が 0 件、category / survey 一覧のタイトルに定型文の括弧書きが出ない、
  ranking 詳細ではチャート下の note として表示される。

### [GEO-UX-CLICK-REDUCTION-01] /geo の入口・県選択・着地を 1 本化し、重なり地図までのクリックを減らす

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run src/features/geo-analysis src/lib/analytics] [起票:2026-09-16] [期日:2026-09-30]

- **owner**: site-ux-manager (導線・IA) / geo-analysis-curator (lineage 表示が欠けないことの確認)
- **実測根拠 (2026-09-16 localhost:3000、desktop 1493×1270)**: `/geo` は main 内リンク 21 本で、`/geo/compare`・`/geo/method`・`/geo/data-catalog` が各 2 回、上部ナビ「2. データを重ねて読む」は `#geo-analyses-heading` (直下セクションへのアンカー) で実質無意味。6 カードのうち地価・洪水・駅は `?pref=13&stage=overlap` に着地するが、豪雪・土砂・施設は stage 無しで **「1. 2020年基準人口の分布」タブに着地** (active tab を DOM で確認)。分析ページ (`/geo/population-flood-risk`) は main 内リンク 70・combobox 2・高さ 4,849px。県を選ぶ UI が **3 つ** (地図の Select / 「都道府県を最大3件で比較」の Select+追加ボタン / 47 行テーブルの「○○県の地図」リンク)。`/geo` → 東京以外の重なり地図は 3〜4 クリック。GSC 直近週の `/geo` は impressions 4・clicks 0 (seo-observability 2026-09-06) で検索流入はなく、サイト内回遊用の導線。
- **次 (実行順・すべて `apps/web/src/app/geo/**` と `apps/web/src/features/geo-analysis/**` の中だけ)**:
  1. **着地を「重なり」に統一**: `app/geo/[analysisSlug]/page.tsx` の stage 既定 `'population'` → `'overlap'`、`components/GeoCrossAnalysisArticle.tsx` の `initialStage = 'population'` も同様。`components/GeoAnalysisCards.tsx` のプレビュー 3 枚の href `/geo/${slug}?pref=13&stage=overlap` → `/geo/${slug}` (canonical と一致、非プレビュー 3 枚と同形)。`components/GeoSpatialEvidenceExplorer.tsx` の TabsTrigger から `1. `〜`4. ` の番号と `hasFacilities ? '3.' : '2.'` 式を外す (手順ではなく表示切替)。テスト `components/__tests__/GeoSpatialEvidenceExplorer.test.tsx` の `'3. 数値の確かめ方'` 4 箇所を追従。同コンポーネントは theme 埋め込み (`ThemeGeo*Client.tsx`) でも使われるが、それらのテストは番号を見ていない (grep 0 件)。
  2. **県選択を 1 つに**: `GeoCrossAnalysisArticle.tsx` の `<GeoCrossAnalysisExplorer …/>` を `<SectionHeader title={config.mapTitle} description={config.mapSubtitle} hideRule />` に置換 (見出しは 47 行テーブルの文脈として残す)。`components/GeoCrossAnalysisExplorer.tsx` を削除し `features/geo-analysis/index.ts` の export を外す。`trackGeoCompareAdd` は `GeoPopulationExplorer.tsx` (`/geo/2050-population`) が使うので `lib/analytics/events.ts` とそのテストは触らない。47 行テーブルの「○○県の地図」 (`/geo/${slug}/${NN}/overlap`) は indexable landing 導線なので残す。
  3. **`/geo` の入口を 1 本に**: `app/geo/page.tsx` の `<nav aria-label="地域データの調べ方">` (「1. GISを探す」「2. データを重ねて読む」) を削除し、`SectionHeader`「調べたい問いから選ぶ」+ `GeoAnalysisCards` を PageHeader 直下へ。rail の `RailLinksCard`「分析方法・出典」に `GISを探す → /geo/layers` を 1 行追加。`ContentDisclosure` 末尾の `/geo/method` リンクは rail と重複なので削除。`CompareLink` は xl 表示と `xl:hidden` の切替で常に 1 回なのでそのまま。
  4. **地図より上のブロックを減らす**: `GeoCrossAnalysisArticle.tsx` の `<nav aria-label="分析の読み順">` (3 アンカー) を削除。`<nav aria-label="入力データを単体で見る">` (まず単体で見る) は JSX をそのまま `<GeoSpatialEvidenceExplorer>` の**直後**へ移動。洪水の `role="note"` 注意書きは安全情報なので地図の上に残す。`id="prefecture-comparison"` / `id="methods"` は Explorer 内リンク `/geo/${slug}#methods` が使うので残す。
  5. **「数値の確かめ方」タブを常時表示へ**: `GeoSpatialEvidenceExplorer.tsx` の `<TabsTrigger value="audit">` と `<TabsContent value="audit">` を削除し、中身 (`spatialAuditRows` の 3 カード / `GeoLandslideAudit` / 照合文) を Tabs の直後・地図下リンク行の上に `SectionHeader title="数値の確かめ方" hideRule` 付きで常時描画。`useState(initialView === 'audit' ? 'overlap' : initialView)` で既存 URL (`?stage=audit`, `/geo/<slug>/<NN>/audit`) を重なり表示に読み替える。**`lib/geo-spatial-evidence.ts` の `SpatialView` / `isGeoSpatialView`、`packages/data-configs/src/business-plan/geo-routes.ts` の `GEO_STAGES` は変更しない** (ルート・sitemap・`geo-routes.test.ts` に波及させない)。
  6. **検証**: `cd apps/web && npx vitest run src/features/geo-analysis src/lib/analytics` → `npm run type-check` → `npm run design-system:check` → `npm run dev:web` で localhost:3000 を実測: (a) `/geo` の 6 カードすべてで着地の active tab が「…重なり」系 (`document.querySelector('[role="tab"][data-state="active"]')`)、(b) 分析ページ main 内の `[role="combobox"]` が 1 個、(c) `/geo` main 内リンクに `#geo-analyses-heading` が無く `/geo/method`・`/geo/compare`・`/geo/data-catalog` が各 1 回 (xl 幅)、(d) `/geo/population-snow-designation/28/audit` と `/geo/population-flood-risk?pref=28&stage=audit` が 200 で地図と検算値の両方が出る、(e) `/themes/*` の Geo 埋め込み (雪・土砂・駅・施設) が崩れない。
- **停止条件・禁止**: `geo-routes.ts` / `GEO_INDEXABLE_ROUTES` / middleware / sitemap に触る必要が出たら止めて別カードにする。`components/surface`・`components/rail` は別セッション (2026-09-16 時点で `cf1d3c9a`、RailCard/SectionCard タイポグラフィ統一) が編集中なので props・見た目を変えない (使うだけ)。lineage 表示 (検算 3 カード・「再現・検証データ」・47 行テーブル) を削らない (`geo-analysis-standards.md` の canonical 着地契約)。本番デプロイはしない (localhost 確認までで止め、まとめて 1 回・オーナー承認)。広告枠は `AFF-GEO-SLOT-01` (🟣) の判断待ちで触らない。
- **完了条件**: `/geo` → 任意県の重なり地図が全 6 カードで 3 クリック (カード → Select 開く → 県)、東京都なら 1 クリック。分析ページの県選択 UI が 1 個 (Select) + テーブルリンクのみ。既存 URL (`?stage=audit`, `/NN/audit`, `/NN/population`, `/NN/overlap`) がすべて 200。vitest・type-check・design-system:check 緑。上記 (a)〜(e) を実測した記録をこのカードの削除 commit に残す。
- **範囲外 (完了後に必要なら別カード)**: `/geo/compare` の「県を 1 つ選ぶ → 4 カード」を `/geo` 先頭に統合し、6 カードに選択県の `pref` を持たせて **2 クリック化**する案。効果は大きいが `/geo/compare` の canonical・`GEO_INDEXABLE_ROUTES`・`middleware.test.ts` (UTM 付き `/geo/compare` の検証) に及ぶ。

### [NOTE-NAV-REPORT-RETENTION-01] update-published-navigation の日次レポートが hygiene の DATED_STATE_ARTIFACT に抵触して commit を止める

タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:node .claude/scripts/lib/check-repo-hygiene.cjs --baseline] [起票:2026-09-16]

- **owner**: note-manager
- **trigger**: 次に `.claude/scripts/note/update-published-navigation.mjs` を実行し、そのレポートを commit しようとしたとき。
- **実測 (2026-09-16)**: 別 PC 向け sync commit で `.claude/state/metrics/note-navigation-pilot-2026-09-1{4,5,6}.json` の 3 本が
  pre-commit の Repo Hygiene ゲート (`check-repo-hygiene.cjs`) の `DATED_STATE_ARTIFACT` で止まった。ルールは 2026-09-14 (e4fabb4b3) に
  追加されたが、writer の `REPORT_PATH` (`update-published-navigation.mjs:33`) は `.claude/state/metrics/` 直下に日付名で書いたまま。
  09-06 分はルール以前にコミット済みで baseline に載っている。3 本はこの PC の未追跡のまま残し、commit からは外した。
- **次**: `REPORT_PATH` を `prune-state-snapshots.mjs` が所有するディレクトリ (例 `.claude/state/metrics/note/navigation/`) へ変え、
  同スクリプトに prune policy (`note-navigation-pilot-YYYY-MM-DD.json`, keep 8 程度) を追加する。09-06 の既存ファイルは同じ場所へ
  `git mv` して baseline から外す。update-published-navigation の SKILL / README に出力先を反映する。


## 🟢 低 — 時期未定・条件付き (trigger は本文に)

### [PRECOMMIT-STAGED-SCOPE-01] pre-commit の working-tree 走査ゲートが、別セッションの未コミット編集で無関係な commit を止める

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/preflight-commit.test.mjs] [起票:2026-09-16]

- **owner**: devops-runner
- **trigger**: 同一作業ツリーで 2 セッション以上が並行するとき (この repo では常態)。次に同じ理由で commit が止まったら着手する。
- **実測 (2026-09-16 17:0x JST)**: docs のみを staged した commit (`.claude/todo/backlog.md` +17 行) が、pre-commit の
  `preflight-commit.mjs --commit-static` 内 **Card Census** (`check-card-census.cjs`) で中止された。原因は別セッションが
  **unstaged** で編集中だった `apps/web/src/components/surface/SurfaceCard.tsx` の `SectionCard` (BASELINE 未登録)。
  `check-card-census.cjs:86` は `fs.readdirSync` で working tree 全体を走査し、staged 内容を見ない。回避に使った
  「origin/develop ベースの worktree + node_modules junction」は `git worktree remove --force` が junction を辿って本体の
  `apps/*/node_modules` を消す事故を起こした (memory `feedback_worktree_junction_deletes_target`)。
- **次**: `preflight-commit.mjs` に既にある `stagedWebFiles()` (ESLint ゲートが使用、staged な `apps/web/src` の TS/TSX が無ければ skip) を
  `--commit-static` の Card Census / Ad Placement / Static Accessibility にも適用し、staged に `apps/web/src/**/*.tsx` が無い commit では
  skip する (`skipped: true` を出力に残す)。CI の `npm run preflight` / `preflight:pr` は従来どおり全体走査のまま (縮退させない)。
  `preflight-commit.test.mjs` に「staged が docs のみ + working tree に BASELINE 外 *Card がある → commit-static は緑」の固定を足す。
- **停止条件・禁止**: staged に *.tsx がある commit の検査強度を落とさない。gate を `--no-verify` で迂回する運用にしない。
  worktree へ本体の `node_modules` を junction で共有しない。
- **完了条件**: 上記の再現条件 (docs のみ staged + 別セッションの未登録 Card が unstaged) で pre-commit が通り、
  同じ状態で `npm run preflight` は従来どおり Card Census で落ちる。

### [CATEGORY-NAV-CONSOLIDATION-01] カテゴリ一覧UIの2実装 (PortalCategoryGrid / CategoryNavGrid) 統合検討

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-15]

- home (`/`) と `/category/[categoryKey]` は同一の `PortalCategoryGrid`
  (`apps/web/src/features/home-portal/components/PortalCategoryGrid.tsx`) を使い、17カテゴリの
  順序・データ源 (`CATEGORY_DEFS`) は一致している (整合済み・対応不要)。
- 一方 `/areas/[areaCode]` は別実装の `CategoryNavGrid`
  (`apps/web/src/features/area-profile/components/CategoryNavGrid.tsx`) を使い、アイコン+色タイル
  (件数なし) と `PortalCategoryGrid` のテキスト+件数行という異なる見た目・挙動になっている。
- trigger: `/areas/[areaCode]` を次に触るセッションで、統合が本当に妥当か (県スコープの
  リンク生成・件数表示の要否が違うため意図的な分離の可能性もある) を精読してから判断する。
  2026-09-15 時点でこのファイルは別の並行セッションが直後に編集済み (uncommitted) のため、
  今回は触れずこのカードだけ残す。

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

タグ: [種類:改善] [実行:対話] [起票:2026-07-12]

- **owner**: Claude Code
- **状態**: 未完了範囲はCIのbuild成果物再利用・変更種別ごとの検査分岐・短縮効果の実測。型検査の必須性を維持し、同一入力で合格したローカル検査は変更理由がなければ繰り返さない。
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **追加の実測根拠（2026-09-13）**: PR964の初回CI `34740979345` はE2E 102/103成功。公開R2の地域経済チャートは意図した折れ線へ更新済みだったが、テストの旧ドーナツ表示要求が残っていた。テストmatrixだけを修正した次回CI `34741425669` でも全体build・型・unit・E2Eが実行され、18チェック成功。job全体（依存導入などを含む）はStatic Gates 533秒、Full E2E 522秒、Build Check 309秒で並行実行されており、合算を待ち時間と扱わない。コードだけでなく公開データ版も検証入力として記録する必要がある。
- **次（実行順）**: ①jobごとの依存導入・build・検査・cache復元/保存の壁時間を測る。②コード・lockfile・生成設定・データmanifestの組を固定し、同じ入力の検証済みbuildを後続jobで再利用できるか試す。③アプリ変更、テスト変更、運用記録だけの変更に応じたrequired checksを設計し、無関係な全体buildの繰り返しを減らす。④同じscopeの前後時間と費用を比較する。公開R2を候補コードへ組み合わせるE2Eでは、カタログ変更の公開前後で期待値がずれるケースを別途検出する。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。
- **完了条件**: 変更種別ごとに必要な検査が必ず実行され、入力変更時のcache失効と失敗伝播を確認する。復元/保存込みの同条件比較で短縮が実測されるまで高速化完了とはしない。今回のリリースへCI構成変更を追加しない。

### [AREA-DATABOOK-REMAINDER] 県データブックの小粒残件

タグ: [種類:改善] [実行:対話] [起票:2026-07-19]

- **owner**: Claude Code
- **trigger**: 既存47県版の利用実測で、欠損セクションが回遊または検索の阻害要因と確認できたとき。

### [MULTICHANNEL-CONTENT-PRODUCT-01] 商品チャネル横断化

タグ: [種類:制作] [実行:対話] [起票:2026-07-18]

- **owner**: Claude Code
- **trigger**: ココナラまたはnoteの単一商品で実売、粗利、supportMinutesを測定できた後。
- **正典**: `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`

### [GIS-CROSS-CONTENT-BACKLOG] 統計×GISコンテンツ

タグ: [種類:制作] [実行:対話] [起票:2026-07-04]

- **owner**: Claude Code
- **trigger**: 既存GIS素材と検索需要が一致する単一pilotを選べたとき。

### [CLOUDFLARE-INVOICE-01] 請求書PDFと予測値の突合

タグ: [種類:改善] [実行:対話] [起票:2026-05-16]

- **owner**: Claude Code
- **trigger**: 手動精算漏れが再発するか、請求額が継続して予測から10%以上ずれるとき。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

タグ: [コンテンツ品質] [種類:制作] [実行:対話]

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

タグ: [種類:意思決定] [実行:対話] [起票:2026-07-11]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [SCRIPT-ORPHAN-DELETE-01] 役目が終わった orphan スクリプト 6 本の削除可否

タグ: [種類:意思決定] [実行:対話] [起票:2026-08-17]

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

タグ: [種類:意思決定] [実行:対話] [起票:2026-05-25]

- **owner**: Claude Code
- **次**: queryを別URLへ昇格する案、別rankingKey化、canonical吸収の3案を、検索需要とsnapshot容量で比較する。
- **完了条件**: URL policy、canonical、sitemap、既存queryの扱いを先に決め、実装案を混在させない。

### [MIGRATION-FLOW-IG-01] migration-flow の IG 投稿が 3 か月止まっている

タグ: [種類:意思決定] [実行:対話] [起票:2026-08-13]

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

### [NOTE-INS-IMG-HEADING-PLACEMENT-01] ins_img が見出し直前の段落をアンカーにすると画像が見出し直後へずれる

タグ: [種類:不具合] [実行:対話] [起票:2026-09-16]

- **owner**: 未定
- **問題**: `.claude/scripts/note/editor-helpers.sh` の `ins_img` は、アンカー文字列を含む段落の
  「次の `<p id=>`/`<li>`」を探して画像挿入位置にしているため、アンカー段落の直後が見出し
  (`<h2>`/`<h3>`) だと見出しを読み飛ばし、次セクション先頭の段落の前に画像を置いてしまう
  (実質: 画像が見出しの直後＝意図した位置の1ブロック先にずれる)。2026-09-16、b-kakei-* 8本の
  画像復元時に `audit-note-figure-split.mjs` の misplaced 件数で発覚 (7/8 本で計14枚が該当)。
  内容自体は正しい画像で欠落や誤情報ではないため公開は維持している。
- **試して失敗した案**: アンカー段落自身をそのままクリックし段落末尾へキャレットを置いて
  Enter する変更 → `b-kakei-necktie-decline` で misplaced が 1→2 に悪化して撤回済み
  (原因未特定。`BU state` が出す accessibility tree のダンプ形式の想定が外れている可能性が高い)。
- **次**: 実際に `BU state` の生ダンプ (`/tmp/ns.txt`) を見出し前後の段落で目視してから
  awk の抽出条件を組み直す。ライブの note エディタで最低3パターン (見出し直前 / 見出し無し /
  リスト直前) を実地検証してから全 note 記事へ展開する。
- **禁止**: ライブ DOM の実物を見ずに正規表現だけを推測で直さない (今回の失敗の再発)。
- **完了条件**: 見出し直前アンカーを含む記事で `audit-note-figure-split.mjs` の misplaced が 0。

### [NOTE-RECOVERED-DUPLICATE-CONSOLIDATION-01] recovered-* に同一テーマの重複投稿が残っている

タグ: [種類:意思決定] [実行:対話] [起票:2026-09-16]

- **owner**: uruhayato373 (どちらを残すかの編集判断)
- **問題**: note全体189本の商品カード監査中に発見。`recovered-n581a1409b2c9` と
  `recovered-ned30a382334d` が同一タイトル「大学数ランキング」、`recovered-n6f8a367906d1` と
  `recovered-nb2d65c42c28b` が同一タイトル「最高気温ランキング」で同日投稿。後者はさらに
  3本目の stub (`n863f429319ca`) と、画像付きで書き直した後継記事 `a-maximum-temperature`
  (現在 status:draft で未公開) も存在する。いずれもチャート画像パイプライン導入前の
  note.com バックフィルによる復元 stub。
- **次**: 各組で「どれを正本として残すか」を決める (後継記事があるものは後継を仕上げて
  公開し、旧stubを非公開化する方針が有力)。どの note 投稿を非公開/削除するかは
  公開済みコンテンツへの不可逆操作なのでオーナー判断が必要。
- **完了条件**: 各組が1本に統合される、またはそれぞれ独立して残す理由が記録される。

### [ESTAT-META-BATCH-ARTIFACTS-01] getMetaInfo 9 バッチ (1,000 表) の CI artifact を 2026-10-15 失効前に保全するか、ESTAT-CATALOG-01 に吸収して捨てるか

タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-09-16] [期日:2026-10-14]

- **owner**: オーナー (判断) / estat-researcher (保全する場合の実行)
- 事実 (2026-09-16 実測): `estat-meta-run` ブランチへの push で `estat-fetch-meta.yml` が 2026-09-15 11:24〜22:56 UTC に
  8 run 成功 (batch 1/9, 3/9〜9/9。2/9 は独立した run / commit が見つからない)。入力は `.claude/scripts/estat/proof-batch-statsids.json`
  の 1,000 statsDataId (discover Phase 1 の候補 8,706 表から抽出)。**結果は各 run の artifact `estat-meta` (約 0.96 MB/run、
  retention 30 日) にしか無く**、リポジトリにも R2 にも無い。失効: run 9 が 2026-10-15T23:09Z、他はそれより前。
  取得: `gh run download <runId> -n estat-meta -D .local/estat-meta/batch-<n>` (run 9 = 35033358636、run 1 = 34963136368、
  一覧は `gh run list --workflow=estat-fetch-meta.yml --branch=estat-meta-run`)。`.claude/state/estat/meta/` の 77 件は
  7 月の SSDS 調査分で、この 1,000 表とは重複しない。
- 判断材料: 同日に `ESTAT-CATALOG-01` (月次 R2 カタログが全表の getMetaInfo 要約を保有し、`estat-fetch-meta.yml` と
  `prefecture-candidates.json` を退役予定) が実装された。カタログの初回 run が 10/14 までに県 + 市区町村 (≈12,000 表) を
  終えるなら、この 1,000 表分は捨ててよい。終わらないなら artifact を落として橋渡しにする。
- **次**: ①10/7 頃に `curl https://storage.stats47.jp/estat-catalog/manifest.json` で `collectAreas.{2,3}.metaPending` を確認。
  ②0 なら本カードを削除 (保全不要)。③残っているなら 8 run 分を `.local/estat-meta/` に download し、`.claude/state/estat/` に
  置くか (LARGE_FILE 例外が要る) カタログ完了まで `.local/` 保持かを決める。
  ④併せて `estat-meta-run` / `worktree-estat-meta-batches` ブランチの後始末。後者には
  `0591b72fe chore(blog): 悩み起点5記事の下書きとSNS/公開チェックポイントを保存` が乗っており、
  **develop に同内容があるか確認してから**削除する (未マージなら先に取り込む)。
- **禁止**: 判断前に artifact を作り直す目的で `estat-meta-run` へ再 push しない (e-Stat API を 1,000 表分再消費する)。
- **完了条件**: 保全 or 廃棄が決まり実行済み。ブランチ 2 本の扱いが決まっている。
