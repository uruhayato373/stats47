---
name: admin-console
description: 統合メディア管理コンソール (ローカル) を起動する。X/Instagram/note/Kindleの原稿・公開状態、参考文献の展開状況、Geo契約、画像資産、SVG、調査、収益、品質、TODOを読み取り専用で横断確認する。Use when user says "管理画面", "メディアコンソール", "admin", "投稿管理画面", "コンテンツ管理", "参考文献管理", "Geo投稿確認", "Kindle管理", "note管理", "画像資産を確認", "SNSギャラリー"。
primary_agent: sns-metrics-sync
co_agents: [note-manager, kindle-publisher, kdp-operator]
---

全コンテンツ運用とメディア資産を 1 つの localhost 画面で横断管理する読み取り専用コンソール。
書き込み・投稿・生成は各 owner agent / skill が担う。実装は独立 Next.js アプリ **`apps/admin`** (App Router・127.0.0.1 bind 固定。
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
| `/content` | コンテンツ運用 | X / Instagram / note / Kindle の件数・制作段階・次アクション・SSOT監査を横断表示 |
| `/content/{x,instagram}` | SNSチャネル別 | `/sns` の共通コンポーネントをチャネル別に初期絞り込み。Geo role・素材・caption・状態を閲覧 |
| `/content/note` | note運用 | git TS catalog + R2本文所在 + 公開URL/準備状態。読み取り専用 |
| `/content/kindle` | Kindle運用 | book catalog + manuscripts + `.local`成果物 + R2暗号化archive + KDP審査/販売状態・価格・ロイヤリティ・KU。読み取り専用 |
| `/content/references` | 参考文献展開 | 制作単位×12チャネルとcontext-only補強プールを、既存SSOTから全件派生。読み取り専用 |
| `/sns` | SNS 投稿ギャラリー | X/IG 素材の再生・caption・投稿状態・メトリクス・残枠を読み取り専用表示。YouTube は過去実績とpilot台帳を表示 |
| `/assets` | 画像資産 | OGP / リンクカード(light/dark) / note カバー / note 記事内画像 / 動画 masterを閲覧 |
| `/strategy` | 事業戦略 | 事業計画とM1 Geo分析のレイヤー・空間演算・metric・X role 3/9/2/1・機械契約を表示 |
| `/svg` | ブログ SVG カタログ | 記事内 SVG を 6 カタログ + table + unknown に機械分類して一覧 |
| `/research` | 調査カタログ | 政府・自治体の公式ダッシュボード、ストーリー、指標・可視化、stats47テーマ接続と監査状態を読み取り専用で表示 |
| `/dashboard` | プロジェクト現況 | メトリクス(GSC/GA4/AdSense/PSI/カバレッジ) + 進捗キュー(blog是正/ai-content/記事ネタ/SNS/実験) + 効果測定サマリ + 機能バックログ + 戦略(STP)。改善の全件表は `/todo?f=improvements` に一本化。state JSON / md を**読み取り専用ミラー**でライブ表示 (60秒キャッシュ)。編集は各 SSOT 側で |
| `/todo` | TODO | 左サイドバーで「収益」「品質・運用」と同列の独立グループとして、実行バックログ・今週の計画・今月の計画・効果測定と改善を表示。全件・Owner・Metricはここで確認し、編集は各 SSOT 側で |

## API

| メソッド + パス | 機能 |
|---|---|
| `GET /api/posts` `/api/inventory` `/api/limits` `/api/ig-consistency` | SNS 台帳・在庫・残枠・IG 整合 |
| `GET /api/assets/tabs` `/api/assets/summary` | 資産タブ定義 / ホームサマリ |
| `GET /api/assets/tab/:id?limit&all` | タブ 1 つの entry (OGP=buildTab / note-image / video) |
| `GET /api/svg/catalog?limit&all` | ブログ SVG を fetch → 分類 (TTL 10 分キャッシュ) |
| `GET /api/research/dashboard-catalog` | 公式ダッシュボード研究カタログ + 基本監査結果 (読み取り専用・TTL 60 秒) |
| `GET /api/dashboard/summary` | プロジェクト現況の集約 JSON (state/md ライブ読み・TTL 60 秒、collector は `dashboard-data.mjs`) |
| `GET /api/content` | 4運用チャネルの共通stage・note/Kindle詳細・参考文献12チャネル展開ポートフォリオ・SSOT監査結果 (読み取り専用・TTL 60 秒) |

**API routeはGETだけ**。POST/PATCH/PUT/DELETEを追加すると
`apps/admin/tests/unit/read-only-contract.test.ts` が失敗する。

## できること

| 操作 | 実装 |
|---|---|
| SNS 素材ギャラリー閲覧 (動画再生・画像) | ローカル `.local/r2/sns/` 優先、無ければ R2 公開 URL 直参照 |
| caption / 予約日時 / 投稿状態の確認 | `/content/{x,instagram}` と `/sns` |
| Geo role・分析ID・claim metricの確認 | `/content/x` と `/strategy` |
| 画像資産の所在・欠落状態の確認 | `/assets` |
| SVG カタログの分類確認 | `/svg` (dark 対応の厳密確認は静的 `build-svg-gallery-tabbed.mjs`) |

## 規約 (正典: `.claude/rules/sns-content-standards.md` §5.5 / `.claude/rules/ogp-image-standards.md`)

- 投稿台帳 SSOT は `.claude/state/sns/posts.json`。adminはread-onlyで、書込はadmin外のagent/skillが `sns-posts-store.cjs` 経由で行う
- note は git TS catalog + R2本文、Kindleは book-catalog/manuscripts + kdp-listings がSSOT。`/content`用の新規台帳を作らない
- 参考文献展開は `.claude/state/source-inventory/` と既存コンテンツSSOTを実行時に突合する派生read model。制作可能単位は12チャネル、context-onlyは補強専用として全件集約し、別台帳・Drive ID・原本/OCR/cropを保持しない
- `npm run audit:content-operations` は duplicate ID、公開証跡、catalog/listings集合差、draft索引孤児、個別制作物のTODO二重登録、参考文献inventoryとmetric/area接続を検査し、errorで失敗する。PRのadmin-qualityはbuild + lint + audit + 参考文献E2Eをblocking実行
- 頻度リミット (§1) は画面の残枠バッジ + 各ガードで enforce
- **R2 の投稿済み動画は30日で自動削除** (`cleanup-r2-sns-videos.yml` weekly)。再投稿したい場合は再レンダー
- IG の予約は 1 日 1 件 (cron 仕様)。同日重複は登録時に拒否される
- 資産列挙は R2 list 不可のため SSOT (sitemap / all.json / note state / archive-manifest) 起点 + HEAD probe

## トラブルシュート

- **動画が再生されない**: R2 に mp4 が無い (30日削除済み or 未 push)。source バッジ (local/r2) を確認
- **X 投稿が 428**: 成功実績が 7 日以上ない → まず dry-run で X の UI 変化を確認してから
- **IG 不整合警告**: schedule JSON と posts.json の diff。`GET /api/ig-consistency` で詳細
- **資産タブが空/欠落**: R2 未生成。該当するowner agent / skillで生成・反映する
- **`Cannot find module './NNNN.js'`**: 起動中devとbuildの出力混在。通常devは `.local/next-admin-dev`、build/startは `.next`、E2Eは `.local/next-e2e` を使う契約。古いプロセスを止めて `npm run admin` で再起動する

## 関連

- 実装: `apps/admin/` (Next.js App Router。app/=18画面+API、lib/content-operations/=正規化・監査、README に構成・ガード詳細)
- 共有 collector: `.claude/scripts/lib/gallery-collectors.mjs` / SVG 分類: `.claude/scripts/lib/svg-classify.mjs`
- CI 静的ギャラリー (collector 共用): `.claude/scripts/ogp/build-image-gallery.mjs` (`--audit` 週次ゲート)
- 台帳ストア (admin外のwriter用): `.claude/scripts/lib/sns-posts-store.cjs`
- R2 削除: `packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts` + `.github/workflows/cleanup-r2-sns-videos.yml`
- X 投稿: `.claude/skills/sns/publish-x/` / IG cron: `.claude/scripts/instagram/post-from-schedule.cjs`
