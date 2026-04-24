---
name: post-instagram
description: Instagram Graph API (Content Publishing) で stats47jp に画像/カルーセル/リールを自動投稿する。Use when user says "Instagram投稿", "IG投稿", "リール投稿". API 純粋実装、browser-use 不要。即時投稿のみ（予約は API 非対応）。
disable-model-invocation: true
argument-hint: "<rankingKey> [<rankingKey> ...] [--domain ranking|compare|correlation|blog] [--type image|carousel|reels] [--dry-run]"
---

Instagram Graph API の Content Publishing エンドポイントで `stats47jp` に投稿する。画像 / カルーセル / リール / 動画に対応。

## 前提

- `.env.local` に以下:
  - `INSTAGRAM_ACCESS_TOKEN` — 長期トークン
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID` — IG User ID
- 権限: `instagram_business_content_publish` が有効
- 投稿対象のキャプション・画像が **ローカル R2 にあり、`/push-r2` で本番 R2 に push 済み**（API は公開 URL を要求）
- R2 公開 URL: `https://storage.stats47.jp/sns/<domain>/<key>/instagram/...`

## 重要な制約

### 即時投稿のみ

Content Publishing API は **即時投稿のみ**対応。予約投稿は Meta Business Suite の UI 経由でしか作成できないため、このスキルは**常に即座に投稿する**。予約したい場合は `schedule` スキルで routine を組むか、手動で Business Suite を使う。

### API レート

- **25 投稿 / 24 時間 / IG User**（Content Publishing 固有）
- ストーリーは別カウント
- 超過時は `error.code=4` または `error.code=36003`

## 引数

```
/post-instagram <rankingKey> [<rankingKey> ...] [--domain <d>] [--type <t>] [--dry-run]

  rankingKey  ... 投稿対象のキー（複数指定で順次投稿）
  --domain    ranking | compare | correlation | blog （デフォルト: ranking）
  --type      image | carousel | reels （デフォルト: カルーセル優先で自動判定）
  --dry-run   API を叩かずに container 作成までの payload を表示
```

### 自動判定ロジック（--type 未指定時）

ディレクトリ構造から判定：

1. `.local/r2/sns/<domain>/<key>/instagram/reel.mp4` が存在 → **reels**
2. `.local/r2/sns/<domain>/<key>/instagram/stills/` に 2 枚以上 → **carousel**
3. それ以外 → **image**（先頭 1 枚）

## 手順

### Step 1: 事前検証

```bash
# push-r2 済みか（public URL に到達できるか）
curl -I "https://storage.stats47.jp/sns/ranking/<key>/instagram/stills/main-1080x1080.png"
# 200 OK が返れば OK、404 なら /push-r2 を先に実行

# トークン疎通
node -e "
require('dotenv').config({ path: '.env.local' });
fetch(\`https://graph.instagram.com/v21.0/me?access_token=\${process.env.INSTAGRAM_ACCESS_TOKEN}\`)
  .then(r => r.json()).then(d => console.log(d));
"
```

### Step 2: 投稿スクリプト実行

```bash
npx tsx .claude/skills/sns/post-instagram/post-instagram.ts <rankingKey> [<rankingKey> ...] [flags]
```

### Step 3: API フロー（スクリプト内部）

#### image（単一画像）

1. **Container 作成**:
   ```
   POST https://graph.instagram.com/v21.0/{ig-user-id}/media
     ?image_url=https://storage.stats47.jp/.../main-1080x1080.png
     &caption=...
     &access_token=...
   ```
   レスポンス: `{id: "17xxxxxxxxxxxxx"}` が container ID

2. **Publish**:
   ```
   POST https://graph.instagram.com/v21.0/{ig-user-id}/media_publish
     ?creation_id=<container-id>
     &access_token=...
   ```
   レスポンス: `{id: "17xxxxxxxxxxxxx"}` が media ID

#### carousel（カルーセル、最大 10 枚）

1. 子要素を事前に作成（`is_carousel_item=true` で container 作成）
2. 親 container 作成: `media_type=CAROUSEL&children=<id1>,<id2>,...`
3. `media_publish`

#### reels（動画）

1. Container 作成: `media_type=REELS&video_url=...&cover_url=...&caption=...`
2. **status_code が FINISHED になるまで polling**（動画は処理に数十秒かかる）:
   ```
   GET /{container-id}?fields=status_code
   ```
   `status_code`: IN_PROGRESS / FINISHED / ERROR / EXPIRED
3. FINISHED になったら `media_publish`

### Step 4: 結果記録

投稿成功後、以下を更新:

- **D1 `sns_posts` テーブル**: `post_url`, `post_id`, `posted_at`, `platform=instagram`, `status=published`
- **投稿ログ**: `.claude/state/metrics/sns/instagram-publish-log.csv` に `posted_at, ranking_key, media_id, type, permalink` を追記

## キャプション・画像の配置規約

```
.local/r2/sns/<domain>/<key>/instagram/
├── caption.txt                        # 投稿本文（2200 字まで、ハッシュタグ含む）
├── caption.json                       # メタデータ（ハッシュタグ配列、言及アカウント等）
├── stills/
│   ├── main-1080x1080.png             # image 用 or carousel 1 枚目
│   ├── slide-2-1080x1080.png          # carousel 2 枚目
│   ├── slide-3-1080x1080.png          # carousel 3 枚目
│   └── ...
└── reel.mp4                           # reels 用動画（任意、これが存在すれば reels 優先）
```

### 画像仕様

- **最大**: 1080 × 1350 px（縦長 4:5）、8 MB
- **推奨**: 1080 × 1080 px（正方形）、1080 × 1350 px（縦長フィード）
- **形式**: JPEG / PNG

### 動画（リール）仕様

- **最大**: 1 GB、100 MB 以下推奨
- **長さ**: 3 秒〜15 分
- **アスペクト比**: 9:16（1080 × 1920）推奨
- **形式**: MP4（H.264 + AAC）
- **サムネイル**: `cover_url` で指定（省略時は最初のフレーム）

## よく使うパターン

```bash
# 単体投稿（カルーセル自動判定）
/post-instagram current-balance-ratio

# 複数投稿（連続実行）
/post-instagram current-balance-ratio manufacturing-shipment-amount

# リール明示
/post-instagram current-balance-ratio --type reels

# dry-run（payload 確認のみ、API 叩かない）
/post-instagram current-balance-ratio --dry-run
```

## エラー対応

| エラーコード | 内容 | 対処 |
|---|---|---|
| `error.code=4` | レート制限 | 24 時間待機 or 投稿数を調整（最大 25/日） |
| `error.code=9004` | image_url 到達不可 | `/push-r2` を実行、または URL を確認 |
| `error.code=2207026` | アスペクト比不正 | 画像サイズ見直し（1:1〜4:5） |
| `error.code=36003` | 公開中断 | ポリシー違反の可能性、手動確認 |
| `error.code=10` | 権限不足 | `instagram_business_content_publish` が有効か確認 |
| `container.status_code=ERROR` | 動画処理失敗 | 動画フォーマット再確認、再アップロード |

## 制限事項

- **即時投稿のみ**（予約非対応）
- **ストーリー投稿は別エンドポイント**（`media_type=STORIES`）で実装予定
- **ショッピング投稿は未対応**
- 位置情報タグは `location_id` が必要で FB Pages 経由でしか取得不可
- 音声付きリール: 標準音源ライブラリの曲は API からは使用不可（オリジナル音声のみ）

## 参照

- [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [Reels Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media#creating)
- [Carousel Posts](https://developers.facebook.com/docs/instagram-platform/content-publishing#carousel-posts)
- 環境変数: `.env.local`（`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`）
- 関連スキル: `/push-r2`（事前に画像を公開 URL へ push）、`/fetch-instagram-data`（投稿後のメトリクス確認）
