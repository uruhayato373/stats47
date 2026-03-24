# Facebook Reels 予約投稿セットアップ

## 背景

- Business Suite（https://business.facebook.com/latest/posts/published_posts?asset_id=867917829741700&business_id=1145339647633233）からリール動画を投稿しているが、予約投稿も即時投稿も反映しない
- 動画のアップロードまではするが、公開されない
- 動画スペックは問題なし（H.264, 1080x1920, 27秒, MP4）
- → Graph API 経由で予約投稿するスクリプトを作成する方針

## 動画ファイル

- `.local/r2/sns/ranking/<rankingKey>/instagram/stills/reel.mp4`（各プラットフォームに存在）
- スペック確認済み: H.264 (avc1), 1080x1920 (9:16), 27秒, 約5MB → Reels 要件を満たしている

## 必要なセットアップ

### 1. Meta Developer アカウント

- **個人の Facebook アカウント**で https://developers.facebook.com/ にアクセスが必要
- ビジネスアカウント（Meta Business Suite）ではアクセス不可（`out_of_scope_redirect` にリダイレクトされる）
- シークレットウィンドウまたは別ブラウザで個人アカウントにログインして開く

### 2. Meta App の設定

1. https://developers.facebook.com/apps/ で App を作成（または既存 App を使用）
2. 「アプリのロール」→「ロール」で自分が**管理者**であることを確認
3. 「アプリレビュー」→「権限と機能」で以下のパーミッションを有効化:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `publish_video`（リール投稿に必須）
4. 開発モードでもアプリ管理者ならテスト利用可能

### 3. ページアクセストークンの取得

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer/) を開く
2. 対象の Meta App を選択 → User Token を選択
3. 上記パーミッションを追加 → 「Generate Access Token」
4. Explorer で `me/accounts?fields=name,id,access_token` を実行
5. ページ ID `867917829741700` の `access_token` をコピー

### 4. 長期トークンへの変換（任意・60日有効）

```javascript
// node -e で実行
const PAGE_TOKEN = '取得したページトークン';
const APP_ID = 'Meta App ID';
const APP_SECRET = 'Meta App Secret';
const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${PAGE_TOKEN}`;
const res = await fetch(url);
const data = await res.json();
console.log('長期トークン:', data.access_token);
```

### 5. 環境変数を .env.local に追加

```
FACEBOOK_PAGE_ID=867917829741700
FACEBOOK_PAGE_ACCESS_TOKEN=<取得したページアクセストークン>
```

## Graph API によるリール予約投稿フロー

3ステップで実行:

1. **アップロード開始**: `POST /{page-id}/video_reels` (upload_phase=start)
2. **動画バイナリ送信**: `POST` to upload URL (バイナリデータ送信)
3. **公開予約**: `POST /{page-id}/video_reels` (upload_phase=finish + `scheduled_publish_time`)

`scheduled_publish_time` は Unix タイムスタンプ（10分後〜75日後の範囲）。

## ステータス

- [ ] Meta Developer に個人アカウントでアクセス
- [ ] Meta App 作成/設定
- [ ] パーミッション有効化（`publish_video` 等）
- [ ] ページアクセストークン取得
- [ ] .env.local にトークン追加
- [ ] 予約投稿スクリプト作成
