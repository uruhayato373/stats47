---
name: admin-console
description: 統合メディア管理コンソール (ローカル) を起動する。SNS 投稿素材 (X/IG と YouTube 過去実績/pilot 記録) を動画再生しながら確認し投稿/予約/caption 編集/メトリクス閲覧、OGP/リンクカード/note カバー・記事内画像/動画 master の閲覧・欠落チェック・再生成、ブログ SVG カタログ閲覧を 1 画面で行う。Use when user says "管理画面", "メディアコンソール", "admin", "投稿管理画面", "画像資産を確認", "OGP/カード一覧", "SNSギャラリー"。
primary_agent: sns-metrics-sync
---

全メディア資産を 1 つの localhost 画面で横断管理するローカルコンソール。SNS は投稿・予約まで、
画像資産は再生成ジョブ起動まで。実装は独立 Next.js アプリ **`apps/admin`** (App Router・127.0.0.1 bind 固定。
2026-07-16 に旧 node:http 実装から完全移管)。

## 起動 / 停止

```bash
npm run admin              # http://127.0.0.1:4747/ (Ctrl-C で停止)
PORT=5000 npm run admin    # ポート変更
```

- **ローカル専用** (127.0.0.1 bind)。デプロイしない。エージェント起動時は `run_in_background: true` + Ready polling。

## 画面 (セクション)

| パス | セクション | 内容 |
|---|---|---|
| `/` | ホーム | 各セクションへのナビ + 件数サマリ (`GET /api/assets/summary`) |
| `/sns` | SNS 投稿ギャラリー | X/IG 素材の動画再生・caption 編集・投稿/予約・メトリクス・残枠バッジ。YouTube は過去実績と pilot 台帳を表示するが、投稿は Studio の人間工程 |
| `/assets` | 画像資産 | OGP / リンクカード(light/dark) / note カバー / note 記事内画像 / 動画 master。欠落チェック + 再生成 |
| `/svg` | ブログ SVG カタログ | 記事内 SVG を 6 カタログ + table + unknown に機械分類して一覧 |
| `/research` | 調査カタログ | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続と監査状態を読み取り専用で表示 |
| `/dashboard` | プロジェクト現況 | メトリクス(GSC/GA4/AdSense/PSI/カバレッジ) + 進捗キュー(blog是正/ai-content/記事ネタ/SNS/実験) + 効果測定サマリ + 機能バックログ + 戦略(STP)。改善の全件表は `/todo?f=improvements` に一本化。state JSON / md を**読み取り専用ミラー**でライブ表示 (60秒キャッシュ)。編集は各 SSOT 側で |
| `/todo` | TODO | 左サイドバーで「収益」「品質・運用」と同列の独立グループとして、実行バックログ・今週の計画・今月の計画・効果測定と改善を表示。全件・Owner・Metricはここで確認し、編集は各 SSOT 側で |

## API

| メソッド + パス | 機能 |
|---|---|
| `GET /api/posts` `/api/inventory` `/api/limits` `/api/ig-consistency` | SNS 台帳・在庫・残枠・IG 整合 (従来) |
| `PATCH /api/posts/:id` / `POST /api/posts` / `POST /api/probe-r2` | caption・予約編集 / draft 登録 / R2 探索 (従来) |
| `POST /api/actions/{schedule-ig,publish-x}` | IG 予約 / X 投稿 (従来) |
| `GET /api/jobs` `/api/jobs/:id` | ジョブ一覧 / 進捗 |
| `GET /api/assets/tabs` `/api/assets/summary` | 資産タブ定義 / ホームサマリ |
| `GET /api/assets/tab/:id?limit&all` | タブ 1 つの entry (OGP=buildTab / note-image / video) |
| `POST /api/assets/check` | タブの画像を HEAD probe で欠落判定 (明示操作時のみ) |
| `GET /api/svg/catalog?limit&all` | ブログ SVG を fetch → 分類 (TTL 10 分キャッシュ) |
| `GET /api/research/dashboard-catalog` | 公式ダッシュボード研究カタログ + 基本監査結果 (読み取り専用・TTL 60 秒) |
| `GET /api/dashboard/summary` | プロジェクト現況の集約 JSON (state/md ライブ読み・TTL 60 秒、collector は `dashboard-data.mjs`) |
| `POST /api/actions/regenerate` | 再生成ジョブ (kind ホワイトリスト: blog-thumbnails / ogp-ranking / ogp-ranking-cards / ogp-areas / ogp-note-covers) |

## できること

| 操作 | 実装 |
|---|---|
| SNS 素材ギャラリー閲覧 (動画再生・画像) | ローカル `.local/r2/sns/` 優先、無ければ R2 公開 URL 直参照 |
| caption / 予約日時の編集 | `PATCH /api/posts/:id` (このフィールドのみ、SSOT の他フィールドは守る) |
| draft 登録 (未登録素材を台帳へ) | `POST /api/posts`。R2 素材の発見は「R2 探索」(HEAD probe) |
| **X**: dry-run / 予約 / 即時投稿 | `publish-x.ts` を spawn (同時1・7日ぶりは dry-run 強制) |
| **IG**: 予約登録のみ | schedule JSON + posts.json 同時書込 → 実投稿は GHA cron (毎朝 09:03 JST) |
| 画像資産の欠落チェック | `/assets` の「⚠ 欠落チェック」→ `POST /api/assets/check` (HEAD probe) |
| 画像資産の再生成 | `/assets` の「♻ 再生成」→ 既存 1 並列ジョブで generate 系スクリプト起動 (ホワイトリスト) |
| SVG カタログの分類確認 | `/svg` (dark 対応の厳密確認は静的 `build-svg-gallery-tabbed.mjs`) |

## 規約 (正典: `.claude/rules/sns-content-standards.md` §5.5 / `.claude/rules/ogp-image-standards.md`)

- 投稿台帳 SSOT は `.claude/state/sns/posts.json`。**書込は sns-posts-store.cjs 経由のみ** (server も同経路)
- 頻度リミット (§1) は画面の残枠バッジ + 各ガードで enforce
- **R2 の投稿済み動画は30日で自動削除** (`cleanup-r2-sns-videos.yml` weekly)。再投稿したい場合は再レンダー
- IG の予約は 1 日 1 件 (cron 仕様)。同日重複は登録時に拒否される
- 資産列挙は R2 list 不可のため SSOT (sitemap / all.json / note state / archive-manifest) 起点 + HEAD probe
- **再生成は kind ホワイトリストのみ**。OGP 再生成は生成→R2 push (diff-push) まで実行し、push には S3 creds が要る (無ければ job ログで fail)

## トラブルシュート

- **動画が再生されない**: R2 に mp4 が無い (30日削除済み or 未 push)。source バッジ (local/r2) を確認
- **X 投稿が 428**: 成功実績が 7 日以上ない → まず dry-run で X の UI 変化を確認してから
- **IG 不整合警告**: schedule JSON と posts.json の diff。`GET /api/ig-consistency` で詳細
- **資産タブが空/欠落**: R2 未生成 → `/assets` の「♻ 再生成」または該当 generate スクリプト
- **ジョブが動かない**: 同時実行 1 制限。実行中ジョブの完了を待つ

## 関連

- 実装: `apps/admin/` (Next.js App Router。app/=11画面+API、lib/server/=ドメイン層、README に構成・ガード詳細)
- 共有 collector: `.claude/scripts/lib/gallery-collectors.mjs` / SVG 分類: `.claude/scripts/lib/svg-classify.mjs`
- CI 静的ギャラリー (collector 共用): `.claude/scripts/ogp/build-image-gallery.mjs` (`--audit` 週次ゲート)
- 台帳ストア: `.claude/scripts/lib/sns-posts-store.cjs`
- R2 削除: `packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts` + `.github/workflows/cleanup-r2-sns-videos.yml`
- X 投稿: `.claude/skills/sns/publish-x/` / IG cron: `.claude/scripts/instagram/post-from-schedule.cjs`
