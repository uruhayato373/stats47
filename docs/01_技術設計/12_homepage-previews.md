---
type: tech-design
status: active
date: 2026-05-27
tags: [homepage, previews, screenshots, video, playwright, r2]
---

# ホームページ主要ページプレビュー画像/動画

`/` (homepage) 末尾の「このサイトの主要ページ」セクション (`NextUpGrid`) に、各リンク先のスクリーンショット / 短尺動画を追加してユーザーの興味を引く設計。

## 背景

現状の `NextUpGrid` は意図的に画像を使わない設計 (LCP 影響回避、コメント記載済)。グラデーション 80px アクセント + バッジ + タイトル + 説明だけ。視覚的訴求力が弱く、各ページの内容が想像しづらい。

本設計は **「LCP を維持しつつ視覚的訴求力を上げる」** ための具体的仕様。

## 方針: A+B ハイブリッド

| ページ | 形式 | 理由 |
|---|---|---|
| `/ranking` | **動画 (WebM)** | ランキング表のスクロール/ホバーで「インタラクティブな大量データ」感を訴求 |
| `/themes` | **動画 (WebM)** | ダッシュボードの地図/チャート切り替えで「複合可視化」感を訴求 |
| `/areas` | 静的 (AVIF) | 47 タイル一覧、静止画で伝わる |
| `/blog` | 静的 (AVIF) | 記事一覧サムネ、静止画で伝わる |
| `/survey` | 静的 (AVIF) | 一覧、静止画で伝わる |
| `/search` | 静的 (AVIF) | 検索 UI、静止画で伝わる |

## LCP / CLS / モバイル配慮

| 項目 | 対策 |
|---|---|
| LCP | プレビューは **fold 下** (homepage 末尾) なので LCP 候補から外れる。`loading="lazy"` + Intersection Observer で実際に必要になるまで読み込まない |
| CLS | `aspect-ratio: 16 / 9` を CSS で固定。読み込み前後で高さが変動しない |
| モバイル通信量 | AVIF 採用 (~30-50KB/枚)、動画は WebM (VP9) 3 秒以内 (~150KB/枚)、`preload="metadata"` |
| autoplay | 動画は `muted autoplay loop playsInline preload="metadata"`。モバイル Safari で再生可 |
| 訪問者の選好 | `prefers-reduced-motion: reduce` で動画は静止 (poster 表示のみ) |

## ファイル仕様

### スクリーンショット (AVIF)

- ビューポート: **1280×720** (16:9)
- 撮影位置: 各ページの above-the-fold (`page.goto` 後 `networkidle` まで待機)
- 出力: **800×450 AVIF, quality 60** (Sharp で変換、~30KB 目標)
- 命名: `app/home/previews/{key}.avif`

### 動画 (WebM)

- ビューポート: **1280×720**
- 録画時間: **3 秒**
- アクション:
  - `/ranking`: ページロード後 1.5 秒経過 → ランキング 5 行目あたりへゆっくりスクロール (1.5 秒)
  - `/themes`: ページロード後 1.5 秒経過 → ダッシュボードの 2 つ目のタブをクリック (1.5 秒)
- 出力: **WebM VP9, 800×450, ~30fps, ~150KB 目標** (Playwright `video` recording → ffmpeg リサイズ・再エンコード)
- 命名: `app/home/previews/{key}.webm`
- ポスター画像: `app/home/previews/{key}-poster.avif` (動画停止時表示)

## R2 配信

- 公開 URL: `https://storage.stats47.jp/app/home/previews/{key}.{avif,webm}`
- `r2-storage-design.md` 準拠で `app/home/` 配下に配置 (URL `/` に対応)

## NextUpGrid 拡張

新規 props 追加:

```typescript
interface NextUpItem {
  href: string;
  title: string;
  description?: string;
  badge?: string;
  accent?: string;
  /** 追加: プレビュー画像 URL (省略時はグラデのみ) */
  previewImageUrl?: string;
  /** 追加: プレビュー動画 URL (省略時は静止画 or グラデ) */
  previewVideoUrl?: string;
}
```

表示優先度:

1. `previewVideoUrl` 指定あり: `<video>` 表示 (poster は `previewImageUrl`)
2. `previewVideoUrl` なし + `previewImageUrl` あり: `<img>` 表示
3. 両方なし: 既存のグラデアクセントバー (後方互換)

aspect-ratio は 16:9 で固定。

## CI 自動再撮影

- ファイル: `.github/workflows/capture-home-previews-monthly.yml`
- トリガー:
  - `schedule: "0 18 1 * *"` (毎月 1日 03:00 JST)
  - `workflow_dispatch` (手動)
- 処理:
  1. checkout main
  2. install playwright + sharp + ffmpeg
  3. `npx tsx apps/web/scripts/capture-home-previews.ts --base-url https://stats47.jp` 実行
  4. 出力 `/tmp/home-previews/` を R2 にアップロード (`wrangler r2 object put`)
  5. CDN purge (cache key invalidation)
- 認証: 既存 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` を流用

## 検証方法

- 手動: `npx tsx apps/web/scripts/capture-home-previews.ts --base-url http://localhost:3000 --output /tmp/preview-test`
- LCP 影響確認: `/lighthouse` or PSI で homepage の LCP が +0ms (lazy load で初期ロード影響なし) を確認
- CLS: aspect-ratio 固定で 0 のはず

## 関連

- `apps/web/src/features/redesign/components/NextUpGrid.tsx` — UI コンポーネント
- `apps/web/src/app/page.tsx:392-439` — homepage 該当セクション
- `apps/web/scripts/capture-home-previews.ts` — 撮影スクリプト (新規)
- `.github/workflows/capture-home-previews-monthly.yml` — CI workflow (新規)
- `.claude/rules/r2-storage-design.md` — R2 配置ルール (準拠)
- `.claude/rules/nextjs-ssg-preservation.md` — SSG 影響なし (server component で静的属性のみ)

## roll-out 手順

1. NextUpGrid 拡張 + homepage update (R2 ファイル無くてもグラデフォールバック) → main deploy
2. ローカルで `capture-home-previews.ts` を試走 → R2 push (1 回手動)
3. CI workflow を有効化 → 月次自動更新が回る状態に
