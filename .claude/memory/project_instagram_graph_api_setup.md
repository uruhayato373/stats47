---
name: Instagram Graph API セットアップ状態
description: stats47jp の Meta アプリ / IG User ID / トークン / スキル群（2026-04-25 時点）
type: project
originSessionId: 21ab466f-ac29-4456-99e2-06047c2e52f5
---
2026-04-25 に Instagram Graph API による自アカウント投稿・メトリクス取得の基盤を構築した。

**Why:** 旧実装は browser-use スクレイピング頼みで脆弱だった。公式 API（Instagram Login 新フロー）に全面移行。

**How to apply:** Instagram 関連のタスクは以下の前提で設計する。

## アカウント・アプリ情報

| 項目 | 値 |
|---|---|
| IG username | `stats47jp` |
| IG User ID | `26834754356143704` |
| Meta App ID | `4481810975430495` |
| ユースケース | 「Instagram でメッセージとコンテンツを管理」（新フロー = Instagram Login 直結） |
| アカウント種別 | BUSINESS |
| 環境変数 | `.env.local` の `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `META_APP_ID`, `META_APP_SECRET` |

## トークン運用

- トークン形式: **EAA（Facebook Graph 形式）**。`refresh-token.cjs` は `fb_exchange_token` で refresh
- 長期トークン 60 日有効。**2026-07-05 前後に失効**（2026-05-06 に再取得・更新）
- 月 1 回 `node .claude/scripts/instagram/refresh-token.cjs` で refresh（expires_in は毎回 60 日にリセット）
- refresh は META_APP_ID + META_APP_SECRET が必要（.env.local に設定済み）
- 失効・エラー 190 が出たら Meta Developer App Explorer で短期トークン再取得 → refresh スクリプト実行

## 新フローの制約（重要）

- **`business_discovery` は使えない**（旧 Facebook Login フロー専用）。他アカウント（riskmap.jp 等）の閲覧は不可。必要なら別途 Facebook Login プロダクトをアプリに追加する必要あり（約 1 時間）
- **Content Publishing API は即時投稿のみ**。予約投稿は Meta Business Suite UI か `schedule` スキルで cron 定義
- **画像/動画は公開 URL 必須**。`/push-r2` で `storage.stats47.jp` に push してから `/post-instagram`
- **投稿レート**: 25/24h、API レート: 200/h

## 作成済みスキル・エージェント

- エージェント: `.claude/agents/instagram-strategist.md`
- スキル: `/fetch-instagram-data`, `/post-instagram`（純 API、browser-use 不使用）
- スキル改修: `/update-sns-metrics --platform instagram` は Graph API 化済
- コンテンツ生成: `/generate-all-sns` と `/render-sns-stills` に Instagram セクション追加
- トークン更新: `.claude/scripts/instagram/refresh-token.cjs`

## 連携フロー

```
/generate-all-sns → /push-r2 → /post-instagram → /update-sns-metrics → /fetch-instagram-data
```

## 残課題

- トークン refresh の自動化（現状は手動月 1 回）
- compare / correlation / blog ドメインの Instagram 対応
- `business_discovery` が必要になったら別アプリ or 旧フロー追加
