---
type: session-handoff
date: 2026-07-06
status: active
topic: OGP 画像の背景を ChatGPT 生成の日本データビジュアライゼーション背景に刷新
tags: [ogp, image, satori, r2, blog, handoff]
---

# ハンドオフ: OGP 背景画像の刷新（背景画像合成）

> **なぜこの handoff があるか**: クラウドセッションでは「ChatGPT で作った背景 PNG のファイル本体」を
> 環境に渡せない（チャット貼付画像は視覚入力どまりでディスクに落ちない）。**ローカル PC で続行する**ため、
> ローカルの新セッションがそのまま拾えるよう手順を固定する。

## 0. 前提: これまでに完了していること（本番反映済み）

- OGP は **事前生成した静的画像を R2 配信**する方式に統一済み（正典 `.claude/rules/ogp-image-standards.md` §5）。
  ランタイム next/og は Cloudflare Worker で 500 になるため使わない。
- 全種別の静的画像を生成し R2 push 済み（ranking / areas / ranking-cards / note-covers / blog）。棚卸し 0 missing。
- メタデータは静的 R2 URL を指す（`apps/web/src/lib/metadata/ogp-image.ts` の `ogpImageUrl`/`ogpImageKeys`）。
- 生成漏れの機械チェックを CI に配線済み（週次 `ogp-image-audit-weekly.yml` + `sync-snapshots` 公開時フック）。
- **PR #535 でデプロイ済み・本番稼働中**（5/5 ranking で R2 静的 og:image を実測確認）。

→ **現状の背景はグラデ+ストライプ（`blog-thumbnail-render.ts` の `bg`/`stripePattern`）。今回これを画像背景に差し替える。**

## 1. 今回のタスク

ChatGPT で生成した**日本地図＋チャートのライトブルー背景**（約 1.9:1・左〜中央が余白でテキスト重ねに最適）を
OGP の共通背景にする。テキスト（タイトル/サブタイトル/カテゴリ）を Satori でその上に重ねる。

## 2. 手順（ローカル PC）

### Step 1: 背景画像を配置
ChatGPT で作った PNG を repo に置く:
```
apps/web/public/ogp-backgrounds/stats47-base.png
```
（フォルダ新規で可。名前は任意だが以降このパス前提で記載）

### Step 2: Satori を画像背景合成に対応
- 対象ファイル: `apps/web/scripts/lib/blog-thumbnail-render.ts` の `buildElement()`
- 現状ルート `<div>` の背景は `bg`（グラデ）+ `stripePattern`。これを **背景画像の data URI** に差し替える:
  - `readFileSync(path.join(process.cwd(), "apps/web/public/ogp-backgrounds/stats47-base.png"))` を
    base64 化し `backgroundImage: `url(data:image/png;base64,${b64})``、`backgroundSize: "cover"`。
  - テキストブロックは**左〜中央の余白**に寄せる。右の日本地図・右下のバー/折れ線チャートに文字が
    被らないよう、テキストコンテナに `width` 上限（例 62%）と左パディングを設定。
  - 可読性確保のため、テキスト裏に薄い白のソフトグラデ（左→右で透過）を 1 枚敷くと安全。
- **背景画像を使うのは blog/ranking/areas/note すべて共通**。4 種は同じ render lib を通るので `buildElement` の
  修正で一括反映される（`generate-ogp-images.ts` の ranking-cards/note-covers も `buildElement` 経由）。
  ※ ranking/areas の OGP は別コンポーネント（`RankingOgp`/`AreaOgp`）を使う経路があるので、そちらにも
    同じ背景を適用するか、`buildElement` タイトルカードにフォールバック統一するか、試作を見て決める。

### Step 3: まず試作 → ギャラリーで目視（★全件やらない）
```bash
# blog OGP を数件だけ生成（blog は generate-blog-thumbnails-cloud.ts が入口・render lib 共有）
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --limit 2 --force
# ギャラリー HTML を出してブラウザで確認
node .claude/scripts/ogp/build-image-gallery.mjs --tabs blog-ogp --limit 5
```
- テキストが地図/チャートに被っていないか、可読性（コントラスト）、余白バランスを目視。
- ranking/areas/note も 1〜2 件ずつ試作して 4 種の見た目を揃える。

### Step 4: OK なら全件再生成 → R2 push
```bash
# 例（blog）: 生成 → PUT-only push（安全・削除しない）
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --apply
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/blog
# ranking/areas/note-covers も同様に generate-ogp-images.ts --type <t> → diff-push-r2 --prefix <app/ranking|app/areas|note>
```
- **ローカルは R2 S3 creds が必要**: `.env.local` に `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_S3_ENDPOINT`。
  無ければ `wrangler login`。creds はユーザーが Cloudflare ダッシュボードで発行。

### Step 5: デプロイ（急がない）
- 背景差し替えは**画像アセットの入れ替え**なのでコード面のデプロイは軽微。R2 push だけで本番 OGP は更新される
  （メタは既存の R2 URL を指したまま）。
- コード変更（`blog-thumbnail-render.ts`）は feature → develop → PR develop→main の通常フローで。
- **まとめて 1 回デプロイ**（デプロイ規律 `.claude/rules/branch-workflow.md`）。急ぐ理由なし。

## 3. 判断メモ（決定済み）

- **OGP は単一の静的画像**なのでライト/ダーク 2 枚は不要。この 1 枚で足りる（light/dark が要るのは
  サイト内リンクカード `thumbnail-{light,dark}.webp` の方。今回のスコープ外）。
- 背景素材の正規置き場は `.claude/rules/ogp-image-standards.md` §5 が想定する `brand/ogp-backgrounds/<use>/`。
  repo の `apps/web/public/ogp-backgrounds/` に置いてビルド時に読む形でよい（R2 に置く必要はない・build 時 read）。

## 4. 関連ファイル

| 役割 | パス |
|---|---|
| 背景合成を入れる render lib | `apps/web/scripts/lib/blog-thumbnail-render.ts`（`buildElement`） |
| blog OGP 生成入口 | `apps/web/scripts/generate-blog-thumbnails-cloud.ts` |
| ranking/areas/cards/note 生成 | `apps/web/scripts/generate-ogp-images.ts` |
| ギャラリー目視 | `.claude/scripts/ogp/build-image-gallery.mjs` |
| メタ URL 解決（変更不要） | `apps/web/src/lib/metadata/ogp-image.ts` |
| 正典ルール | `.claude/rules/ogp-image-standards.md`（§5） |
| R2 push（PUT-only） | `packages/r2-storage/src/scripts/diff-push-r2.ts` |

## 5. ローカル新セッションへの一言

「`.claude/rules/ogp-image-standards.md` と本 handoff（`docs/04_レビュー/2026-07-06-session-handoff-ogp-background-image.md`）
を読んで、`apps/web/public/ogp-backgrounds/stats47-base.png` を背景に OGP を刷新したい。まず blog 2 件で試作 →
ギャラリー確認から」と伝えれば拾える。
