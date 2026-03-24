# stats47 - 統計で見る都道府県

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・チャート・地図で表示する。

**本番サイト:** https://stats47.jp

## 技術スタック

Next.js 15 / React 19 / TypeScript / Tailwind CSS / Cloudflare Workers・D1・R2 / Drizzle ORM / D3.js / Remotion

## モノレポ構成

```
apps/
  web/       Next.js (Cloudflare Workers) — 公開サイト
  admin/     Next.js — 管理画面・データ投入
  video/     Remotion — 動画・OGP・サムネイル生成
packages/
  database/       Drizzle ORM + D1 スキーマ
  components/     shadcn/ui ベース共通 UI
  visualization/  D3.js チャートコンポーネント
  estat-api/      e-Stat API クライアント
  ranking/        ランキング計算ロジック
  r2-storage/     Cloudflare R2 アクセス
  types/          共通型定義
  utils/          汎用ユーティリティ
```

## セットアップ

```bash
npm install
npm run dev --workspace web
```

## ドキュメント

詳細は [`docs/INDEX.md`](./docs/INDEX.md) を参照。

| 知りたいこと | 参照先 |
|---|---|
| プロジェクト概要・要件 | `docs/00_プロジェクト管理/01_概要/` |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| DB 操作・スキーマ | `packages/database/README.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |

## ライセンス

MIT
