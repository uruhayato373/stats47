---
name: sns-gallery
description: SNS 投稿ギャラリー管理画面 (ローカル) を起動する。X/Instagram/YouTube の投稿素材を動画再生しながら確認し、キャプション編集・投稿/予約・メトリクス閲覧を行う。Use when user says "SNSギャラリー", "投稿管理画面", "sns gallery", "投稿素材を確認"。
primary_agent: sns-metrics-sync
---

X / Instagram / YouTube の投稿素材をギャラリーで確認しながら投稿・予約・微調整するローカル管理画面。

## 起動 / 停止

```bash
npm run sns:gallery          # http://127.0.0.1:4747/ (Ctrl-C で停止)
PORT=5000 npm run sns:gallery  # ポート変更
```

- **ローカル専用** (127.0.0.1 bind 固定)。デプロイしない。依存追加ゼロ (node:http)。
- エージェントが起動する場合は `run_in_background: true` + ログ polling (`/tmp` 等へ出力)。

## できること

| 操作 | 実装 |
|---|---|
| 素材ギャラリー閲覧 (動画再生・画像) | ローカル `.local/r2/sns/` 優先、無ければ R2 公開 URL 直参照 |
| caption / 予約日時の編集 | `PATCH /api/posts/:id` (このフィールドのみ、SSOT の他フィールドは守る) |
| draft 登録 (未登録素材を台帳へ) | `POST /api/posts`。R2 素材の発見は「R2 探索」(HEAD probe) |
| **X**: dry-run / 予約 / 即時投稿 | `publish-x.ts` を spawn (同時1・7日ぶりは dry-run 強制) |
| **IG**: 予約登録のみ | schedule JSON + posts.json 同時書込 → 実投稿は GHA cron (毎朝 09:03 JST) |
| **YT**: ガード付き投稿 | `upload.js` spawn (月1 + 重複ガードは upload.js 内蔵)、confirm 必須 |
| メトリクス閲覧 (imp/likes/eng率) | posts.json の値を表示 (更新は `/update-sns-metrics`) |
| 残枠バッジ | X 週2-3 / IG 週3 / YT 月1 を posts.json から計算 |

## 規約 (正典: `.claude/rules/sns-content-standards.md`)

- 投稿台帳 SSOT は `.claude/state/sns/posts.json`。**書込は sns-posts-store.cjs 経由のみ** (server も同経路)
- 頻度リミット (§1) は画面の残枠バッジ + 各ガードで enforce
- **R2 の投稿済み動画は30日で自動削除** (`cleanup-r2-sns-videos.yml` weekly)。再投稿したい場合は再レンダーする
- IG の予約は 1 日 1 件 (cron 仕様)。同日重複は登録時に拒否される

## トラブルシュート

- **動画が再生されない**: R2 に mp4 が無い (30日削除済み or 未 push)。カードの source バッジ (local/r2) を確認
- **X 投稿が 428**: 成功実績が 7 日以上ない → まず dry-run で X の UI 変化を確認してから
- **IG 不整合警告**: schedule JSON と posts.json の diff。`GET /api/ig-consistency` で詳細
- **ジョブが動かない**: 同時実行 1 制限。実行中ジョブの完了を待つ

## 関連

- server: `.claude/scripts/sns/gallery-server.mjs` / UI: `.claude/scripts/sns/gallery.html`
- 台帳ストア: `.claude/scripts/lib/sns-posts-store.cjs`
- R2 削除: `packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts` + `.github/workflows/cleanup-r2-sns-videos.yml`
- X 投稿: `.claude/skills/sns/publish-x/` / IG cron: `.claude/scripts/instagram/post-from-schedule.cjs` / YT: `.claude/scripts/youtube/upload.js`
