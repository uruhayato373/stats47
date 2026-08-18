---
type: architecture
date: 2026-05-26
status: active
related_files:
  - .claude/skills/sns/post-instagram/reference/facebook-token-setup.md
  - .claude/skills/sns/post-instagram/post-instagram.ts
  - .claude/scripts/sns/delete-ig-via-fb-graph.cjs
---

# Meta API アーキテクチャ — 2 IG アカウント運用 + 投稿/削除自動化

## 現状

1 つの Facebook アカウント (Daisuke Minami / FB user id `1467945805010765`) に 2 つの IG Business Account を連携:

| IG アカウント | FB Page | IG Business ID | API 投稿実績 |
|---|---|---|---|
| **stats47jp** | Stats47 (id: `1009240568948428`) | `26834754356143704` | ✅ (Instagram Login API で運用中、2026-04-25 〜) |
| **doboku-note** | Doboku-note (id: `1094537940409154`) | 未取得 | ❌ 未実装 |

目標:
1. doboku-note も API で投稿可能にする
2. 両アカウントとも削除 API を整備する
3. 投稿スクリプトを `--account` フラグで切り替え可能にする

## Meta API の 2 系統

Instagram には「ユーザーの利用シーン別」に 2 つの API がある。同じ IG Business Account に対して **両方の API が使える**。

| API | エンドポイント | 認証フロー | 投稿 | 削除 | コメント | インサイト |
|---|---|---|---|---|---|---|
| **Instagram Login API** (新) | `graph.instagram.com` | Instagram OAuth (Page 経由しない) | ✅ | ❌ | ✅ | ✅ |
| **Facebook Graph API** (旧、 Page 経由) | `graph.facebook.com` | Facebook Login → Page Access Token | ✅ | ✅ | ✅ | ✅ |

**重要:**
- 削除 (`DELETE /{ig-media-id}`) は **Facebook Graph API 経由のみ** 可能
- 同じ IG account に対して、用途別に 2 種類の Token を持つことが可能/推奨
- Facebook Graph API を使うには **Page と IG Business の連携** が必須

## 必要な Token (4 種類)

| 環境変数名 | 用途 | 取得元 | 有効期限 |
|---|---|---|---|
| `IG_TOKEN_STATS47JP` | stats47jp 投稿 (post-instagram) | Instagram Basic Display | 60 日 (long-lived) |
| `IG_USER_ID_STATS47JP` | stats47jp IG Business ID | 上記 token で取得 | 不変 |
| `IG_TOKEN_DOBOKUNOTE` | doboku-note 投稿 | 同上、別途取得 | 60 日 |
| `IG_USER_ID_DOBOKUNOTE` | doboku-note IG Business ID | 上記 token で取得 | 不変 |
| `META_PAGE_TOKEN_STATS47` | stats47jp 削除・詳細管理 | Facebook Graph API | 60 日 |
| `META_PAGE_TOKEN_DOBOKUNOTE` | doboku-note 削除 | 同上、別途 | 60 日 |
| `META_PAGE_ID_STATS47` | Stats47 Page ID | 固定値 | 1009240568948428 |
| `META_PAGE_ID_DOBOKUNOTE` | Doboku-note Page ID | 固定値 | 1094537940409154 |

> 既存 `.env.local` の `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` は stats47jp 用なので、後方互換として残しつつ、`IG_TOKEN_STATS47JP` / `IG_USER_ID_STATS47JP` を新規追加する。

## Meta for Developers アプリ設定

`stats47` アプリ (app_id: `4481810975430495`) に追加が必要な Products:

| Product | 用途 | 状態 |
|---|---|---|
| **Instagram (Instagram Login)** | 投稿 API、新フロー | ✅ 既に追加済 (stats47jp 投稿で動いている) |
| **Instagram Graph API** | 削除 API、Page 経由 | ❓ **未追加の可能性** |
| **Facebook Login for Business** | Page Token 取得用 | ❓ 確認必要 |

### Product 追加手順

1. https://developers.facebook.com/apps → stats47
2. 左メニュー「**Products**」または「**Use Cases**」を表示
3. 「**Instagram Graph API**」が無ければ「Add Product」で追加
4. Set Up ダイアログで **Stats47 Page** + **Doboku-note Page** 両方を選択

### 必要な Permissions

App Review なしで grant 可能なもの (Standard Access、開発者本人なら使える):

- `pages_show_list`
- `pages_read_engagement`
- `business_management`
- `instagram_basic` ← **重要、現状不足**
- `instagram_manage_contents` ← **削除に必須、現状不足**
- `instagram_content_publish` ← **投稿に必須**
- `instagram_manage_comments`

## Page-IG 連携の確認

```bash
source .env.local
# Stats47 Page → IG 連携確認
curl -s "https://graph.facebook.com/v21.0/1009240568948428?fields=instagram_business_account&access_token=$META_PAGE_TOKEN_STATS47" | python3 -m json.tool
```

## 段階的実装手順

### Phase 1: アプリ設定確認 (Meta Dashboard)

- [ ] stats47 アプリの Products に「Instagram Graph API」追加
- [ ] App Roles で Daisuke Minami が Admin 確認
- [ ] Page-IG 連携 (Stats47 ⇄ stats47jp / Doboku-note ⇄ doboku-note) を確認

### Phase 2: Token 取得

手順詳細: `.claude/skills/sns/post-instagram/reference/facebook-token-setup.md`

各アカウント分:
- [ ] User Access Token 取得
- [ ] `/me/accounts` で各 Page Access Token を取り出し
- [ ] Long-lived Token に交換 (60 日)
- [ ] `IG Business Account ID` を `/{page-id}?fields=instagram_business_account` で取得

### Phase 3: `.env.local` 更新

```bash
# stats47jp (既存維持 + 新名称も追加)
INSTAGRAM_ACCESS_TOKEN=<既存>           # 後方互換
INSTAGRAM_BUSINESS_ACCOUNT_ID=<既存>    # 後方互換
IG_TOKEN_STATS47JP=<新規 long-lived>
IG_USER_ID_STATS47JP=26834754356143704
META_PAGE_TOKEN_STATS47=<新規>
META_PAGE_ID_STATS47=1009240568948428

# doboku-note (新規)
IG_TOKEN_DOBOKUNOTE=<新規>
IG_USER_ID_DOBOKUNOTE=<取得>
META_PAGE_TOKEN_DOBOKUNOTE=<新規>
META_PAGE_ID_DOBOKUNOTE=1094537940409154
```

### Phase 4: 共通基盤 (新規)

`.claude/scripts/sns/sns-accounts-helper.cjs` を作成:
- `getAccount(name)` で account config (token, ig_user_id, page_token, page_id) を返す
- `verifyAccount(name)` で token 有効性と Page-IG 連携を check
- 全 account 一覧は `SNS_ACCOUNTS` 定数で定義

### Phase 5: 既存スクリプト改修

- `.claude/skills/sns/post-instagram/post-instagram.ts` に `--account stats47jp|doboku-note` フラグ追加
- `.claude/scripts/sns/delete-ig-via-fb-graph.cjs` も同上

### Phase 6: 動作確認

各 account で:
- [ ] Token 検証 (`node sns-accounts-helper.cjs --verify-all`)
- [ ] テスト投稿 (1 件、dry-run → 本投稿)
- [ ] テスト削除 (1 件)
- [ ] 既存 stats47jp の自動投稿が壊れていないか確認

### Phase 7: migration-flow 既存 27 件削除 (本来の目標)

- [ ] `node delete-ig-via-fb-graph.cjs --account stats47jp --domain migration-flow`

## Token 更新スケジュール

long-lived Token は 60 日有効。期限切れ前に refresh が必要:

| Token | 更新スクリプト案 | cron |
|---|---|---|
| `IG_TOKEN_STATS47JP` | `node refresh-instagram-token.cjs --account stats47jp` | 月次 |
| `IG_TOKEN_DOBOKUNOTE` | 同上 | 月次 |
| `META_PAGE_TOKEN_*` | `node refresh-meta-page-token.cjs --account *` | 月次 |

`.github/workflows/meta-tokens-monthly.yml` で毎月 1 日に refresh + 失敗時通知。

## トラブルシューティング

- **「Add a Permission」に `instagram_basic` が出ない** → アプリの Products に **Instagram Graph API** が追加されていない
- **`instagram_business_account` フィールドが空** → Page と IG が連携されていない。Meta Business Suite で連携
- **scopes に追加した権限が含まれない** → Generate Access Token 時の承認ダイアログで「詳細を編集」して各権限を確認

## 関連

- 公式 docs:
  - Instagram Login API: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
  - Instagram Graph API: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api
  - メディア削除: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media#deleting
- memory: `project_instagram_graph_api_setup` (stats47jp セットアップ履歴)
