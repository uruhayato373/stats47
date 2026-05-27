---
type: note-article-drafts
series: F
title: "Series F: 舞台裏 / Claude Code × データ可視化 How-to"
date_drafted: 2026-05-27
status: drafts-ready
tags: [how-to, claude-code, technical, behind-the-scenes, engineer-targeted]
---

# Series F: 舞台裏 — 5 本のアウトライン (高単価 × 高リピート)

エンジニア・データ職向け How-to。「Claude Code でこんなことができる」を実例付きで公開。
**単価¥1,200-2,000**、シリーズ買いの可能性高い。既存 koumuin-estat-claude-code magazine の延長線上。

各記事の構成テンプレ:
1. 「これができる」デモ動画/GIF (1 分)
2. 完成物のリポジトリリンク
─── 有料壁 ───
3. アーキテクチャ図
4. ステップ・バイ・ステップ実装
5. 全プロンプト・スクリプト公開
6. ハマりポイントとデバッグ
7. コスト試算 + 再現手順
8. 応用アイデア

---

## F-1: e-Stat API + Claude Code で47都道府県時系列動画を1日で作る (全プロンプト・スクリプト公開)

### メタ
- 価格: ¥1,500
- デモ: 既存 YouTube 動画 (`3O4v9iVgntE` 等)
- ターゲット: データエンジニア、データジャーナリスト
- 想定字数: 7000

### 「これができる」フック
- 完成物: 47 都道府県 50 年分人口前年度比のアニメーション動画 (69 秒)
- 制作時間: 約 6 時間 (人間の作業時間)
- ツール: Claude Code + Remotion + d3-geo + e-Stat API
- コスト: Claude Pro ¥15,000/月、それ以外ほぼゼロ

### 構成
1. **アーキテクチャ図**: e-Stat API → backfill script → D1 → R2 → Remotion → MP4
2. **Step 1: データ取得スクリプト** (`backfill-stats-prefecture.cjs` 全文)
   - 「`cdTimeFrom` を使わない」e-Stat キャッシュ規約の理由
   - DELETE + INSERT vs UPSERT のリスク (実例で 2 年分喪失したケース)
3. **Step 2: YoY 加工パイプライン** (`build-yoy-timeseries.cjs` 全文)
   - 5年中央移動平均の実装
   - 47県未揃い年のフィルタリング
   - 全期間 maxAbs 計算で配色 domain 統一
4. **Step 3: Remotion コンポーネント実装** (主要ファイル全文)
   - `projection.ts` — manual Mercator で東京小笠原島嶼を bbox から除外
   - `PopulationYoy47Scene.tsx` — フレーム同期型アニメ
   - `IntroCard.tsx` / `OutroCard.tsx` — テロップ内に計算方法明示
5. **Step 4: レンダー & 配信**
   - `npx remotion render` の時間・コスト試算
   - YouTube アップロード `upload.js` 全文
6. **ハマりポイント**
   - fitExtent で Japan が小さくなる問題 → manual projection で解決
   - DELETE+INSERT で他ソース年喪失 → UPSERT に変更
   - dev server 初期コンパイル遅延 → Cloudflare Preview で検証
7. **コスト試算** (月次)
   - Claude Pro: ¥15,000
   - Cloudflare R2/D1/Pages: ¥1,000
   - YouTube: 無料
   - **合計: ~¥16,500/月で月 10-20 本可能**
8. **応用アイデア**: 他指標 (出生率・自殺率) への展開、他国データ (OECD) への展開、リアルタイム更新

### TODO
- [ ] リポジトリ整理 (該当ファイルへの permalink)
- [ ] ハマりポイントの再現手順テスト
- [ ] 動画再制作 (記事用の短いデモ動画)

---

## F-2: Remotion + d3-geo で県別 YoY コロプレスを実装する

### メタ
- 価格: ¥1,200
- ターゲット: React/TypeScript エンジニア、動画生成に興味ある人
- 想定字数: 5000

### 「これができる」フック
- 完成物: 任意の年次データをアニメコロプレス動画にする再利用可能コンポーネント
- React + d3-geo + Remotion の知識で 200 行
- レンダー: 1080p / 30fps / 2010 frame → 約 3 分

### 構成
1. アーキテクチャ: timeseries.json → PopulationYoy47Scene → Remotion
2. **d3-geo の選択**:
   - `geoMercator()` vs `geoMercator().fitExtent()` の罠
   - `center / scale / translate` で manual control する理由 (東京小笠原問題)
3. **diverging カラースケール**:
   - `scaleDiverging(interpolateRdBu)`
   - `.clamp(true)` の重要性 (外れ値での飽和)
4. **フレーム同期型アニメーション**:
   - `useCurrentFrame()` → `frameIndex` 算出
   - 1.2秒/年 = 36 frame / 年 (30fps)
   - 補間 (interpolate) と離散切替の使い分け
5. **凡例とテロップ**:
   - DivergingColorLegend の SVG 実装
   - intro card で計算方法を可視化する設計判断
6. **エクスポート**:
   - `npx remotion render` 引数
   - timeout 設定 (動画は初期化に 60s+ かかる)
   - portrait + landscape 両方のレシピ
7. ファイル別解説 (全ソース付き)

### TODO
- [ ] Remotion 公式チュートリアルとの差別化
- [ ] 既存 stats47 リポからコピペ可能なコード片を抽出

---

## F-3: D1 + R2 で大量統計データを Cloudflare 月¥5 で運用する

### メタ
- 価格: ¥1,500
- ターゲット: フルスタックエンジニア、コスト最適化に興味ある人
- 想定字数: 6000

### 「これができる」フック
- 2,200+ ランキング、3,000+ 地理データを Cloudflare で月¥5
- D1 (SQLite): 構造化データ、ローカル開発と本番完全同期
- R2 (object storage): 大量 JSON snapshot、エッジ配信、S3 互換
- 比較: AWS RDS + S3 で同等構成は月 ¥5,000 〜 ¥20,000

### 構成
1. **アーキテクチャ全体**: e-Stat → ローカル D1 → R2 snapshot → Cloudflare Pages → 利用者
2. **D1 の使い方**:
   - SQLite ベースのため `better-sqlite3` でローカル直接操作可能
   - miniflare で本番完全同期 dev 環境
   - Time Travel で 30 日 PITR
3. **R2 の設計原則** (`r2-storage-design.md` 解説)
   - `app/` プレフィックスで URL 対応
   - 1 ページ 1 JSON、モノリス禁止
   - reader にメモリキャッシュ持たせない
4. **同期パイプライン**: `sync-snapshots` スキル
5. **コスト試算**:
   - D1: 月 5GB まで無料、それ以降 $0.75/GB
   - R2: ストレージ $0.015/GB/月、エグレス無料
   - Pages: 無料 (個人プラン)
6. **ベンチマーク**: 1 ページの p95 レスポンス時間 (50ms)
7. **比較表**: Vercel + Postgres / AWS RDS+S3 / Cloudflare で同規模運用

### TODO
- [ ] コスト試算詳細 (実数値で)
- [ ] パフォーマンスベンチマーク
- [ ] D1 から S3 への移行スクリプト (お試し)

---

## F-4: Cloudflare Pages + Next.js 15 でデータ可視化サイトを構築する

### メタ
- 価格: ¥1,500
- ターゲット: フロントエンドエンジニア、データ可視化興味
- 想定字数: 6000

### 「これができる」フック
- Next.js App Router + OpenNext で Cloudflare Pages 配信
- D3.js + Leaflet でインタラクティブマップ
- ISR / SSG で大量ページの高速配信

### 構成
1. プロジェクト構造 (`apps/web` モノレポ)
2. **Next.js App Router** での generateStaticParams 大量ページ
3. **D3.js** チャート (PrefectureMapChart, BarChartRace etc)
4. **Leaflet** で 47県インタラクティブ地図
5. **テーマダッシュボード** の設計 (themes + theme_metrics スキーマ)
6. **YoY アニメコロプレス** (上記 F-2 の Web 版)
7. SEO 対策 (sitemap, OGP)
8. デプロイ自動化 (GitHub Actions → Pages)

### TODO
- [ ] サンプルリポジトリ整備 (最小構成版)
- [ ] パフォーマンス計測 (Lighthouse スコア)

---

## F-5: Claude Code で SNS 投稿フル自動化 (X / YouTube / note 全部)

### メタ
- 価格: ¥2,000 (最高単価)
- ターゲット: コンテンツクリエイター、SNS 運用担当
- 想定字数: 7000

### 「これができる」フック
- 1 つの記事/動画から X / YouTube / Instagram / TikTok / note へ自動投稿
- キャプション生成、サムネ生成、予約投稿、メトリクス収集まで自動化
- 制作時間: 1 投稿 5 分 → 1 分以下に

### 構成
1. **全体パイプライン**: 動画/記事生成 → キャプション生成 → プラットフォーム別変換 → 投稿
2. **YouTube**: `upload.js` (Google API)
3. **X (Twitter)**: `publish-x.ts` (Playwright で予約投稿)
   - 過去事故 (2026-04-18 即時投稿事故) と対策 (dry-run)
4. **Instagram**: Graph API (`post-instagram`)
   - business_discovery の制約
5. **TikTok**: `post-tiktok` (Playwright)
6. **note**: `publish-note` (Playwright、clipboard paste)
   - browser-use cleanup の必要性
7. **キャプション AI 生成**: Claude API でプラットフォーム別最適化
8. **メトリクス収集**: 各プラットフォームから日次/週次でデータ取得
9. **コスト試算**: API 利用料、Playwright インフラ
10. **倫理的注意**: 各プラットフォーム規約、シャドウバン対策

### TODO
- [ ] 各スキルの公開可能な部分を抽出 (private 含まないように)
- [ ] サンプル動画/記事から全自動投稿のデモ動画
- [ ] プラットフォーム別注意事項のチェックリスト
