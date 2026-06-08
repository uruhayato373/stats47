---
type: setup-guide
date: 2026-05-26
status: active
---

# Facebook Page Access Token セットアップ手順

Instagram メディア削除 (`DELETE /{ig-media-id}`) を API 経由で実行するために必要な Page Access Token を取得する。

**前提:** stats47jp の IG Business Account が Facebook Page と連携済 (memory `project_instagram_graph_api_setup` で 2026-04-25 セットアップ済)。

## なぜ別 Token が必要か

| Token 種別 | 取得元 | 使用ホスト | 削除サポート |
|---|---|---|---|
| **Instagram Login Token** (既存 `INSTAGRAM_ACCESS_TOKEN`) | Instagram Basic Display API | `graph.instagram.com` | ❌ 不可 |
| **Facebook Page Access Token** (これから取得) | Facebook Graph API | `graph.facebook.com` | ✅ **可能** |

## 必要権限

- `instagram_basic`
- `instagram_manage_contents` ← **削除に必須**
- `pages_show_list`
- `pages_read_engagement`
- `instagram_content_publish` (将来の投稿自動化用)

## 取得手順 (Graph API Explorer 経由、最短 5 分)

### 1. Graph API Explorer を開く

https://developers.facebook.com/tools/explorer

### 2. App を選択

右上「Meta App」プルダウンから **stats47** (or 同名のアプリ) を選択。

### 3. 権限を追加

「Permissions」セクション →「Add a Permission」→ 以下を全部選択:
- `instagram_basic`
- `instagram_manage_contents`
- `pages_show_list`
- `pages_read_engagement`
- `instagram_content_publish`

### 4. User Token 生成

「Generate Access Token」ボタン → Facebook 認証ダイアログ → 承認

User Access Token (短期、~1 時間有効) が表示される。

### 5. Page Access Token に交換

Explorer の Query 欄に `/me/accounts` を入力 → Submit。
レスポンスから stats47 Page (or stats47jp 関連) の `access_token` をコピー (これが Page Access Token)。

### 6. Long-lived Token に交換 (60 日有効)

```bash
APP_ID=<your_app_id>
APP_SECRET=<your_app_secret>
SHORT_TOKEN=<step5 で取得した Page Token>

curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}" | python3 -m json.tool
```

App ID / Secret は https://developers.facebook.com/apps → stats47 →「設定」→「基本設定」で確認。

### 7. .env.local に保存

```bash
# .env.local
META_PAGE_ACCESS_TOKEN=<long-lived Page Access Token>
META_PAGE_ID=<stats47 Page ID>  # /me/accounts レスポンスの id フィールド
```

`INSTAGRAM_BUSINESS_ACCOUNT_ID` は既存のものを再利用 (memory より既存)。

### 8. 動作確認

```bash
source .env.local
curl -s "https://graph.facebook.com/v21.0/me?access_token=$META_PAGE_ACCESS_TOKEN" | python3 -m json.tool
# → name: stats47 (Page 名) が表示されれば OK

curl -s "https://graph.facebook.com/v21.0/me/permissions?access_token=$META_PAGE_ACCESS_TOKEN" | python3 -m json.tool
# → instagram_manage_contents が "granted" なら削除可能
```

## トラブルシューティング

- **"Invalid OAuth access token"** → token が User Token のまま。Step 5 で `/me/accounts` を必ず叩いて Page Token に交換
- **"Permissions error"** → Step 3 で `instagram_manage_contents` 権限が抜けている。Explorer で再 grant
- **Page が一覧に出ない** → Facebook Page と IG Business Account の連携を確認 (Facebook → 設定 → Instagram)

## 関連

- 削除スクリプト: `.claude/scripts/sns/delete-ig-via-fb-graph.cjs` (本 token を使用)
- IG 投稿スクリプト (既存): `.claude/skills/sns/post-instagram/post-instagram.ts` (Instagram Login Token を使用、変更不要)
- アーキテクチャ全体: `.claude/skills/sns/post-instagram/reference/meta-api-architecture.md`
- memory: `project_instagram_graph_api_setup` (既存セットアップ履歴)
- 公式 docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media
